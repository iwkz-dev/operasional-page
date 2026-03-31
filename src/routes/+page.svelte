<script lang="ts">
	import { onMount } from 'svelte';
	import {
		PUBLIC_DONATION_URL,
		PUBLIC_SOCKET_EVENT_NAME,
		PUBLIC_SOCKET_TOKEN,
		PUBLIC_STRAPI_URL
	} from '$env/static/public';
	import { io } from 'socket.io-client';
	import QRCode from 'qrcode';
	import {
		BarController,
		BarElement,
		CategoryScale,
		Chart,
		type ChartConfiguration,
		type ChartDataset,
		LinearScale
	} from 'chart.js/auto';
	import ChartDataLabels from 'chartjs-plugin-datalabels';

	Chart.register(CategoryScale, LinearScale, BarController, BarElement, ChartDataLabels);

	const STRAPI_URL = PUBLIC_STRAPI_URL || 'http://api.iwkz.de/';
	const EVENT_NAME = PUBLIC_SOCKET_EVENT_NAME || 'info_iwkz';
	const SOCKET_TOKEN = PUBLIC_SOCKET_TOKEN || '';
	const DONATION_URL = PUBLIC_DONATION_URL || 'https://paypal.me/your-link';

	type ConnectionStatus = 'Connected' | 'Connecting...' | 'Disconnected';

	type Donation = {
		amount: number;
		name?: string;
		createdAt: number;
	};

	type ToastDonation = {
		id: number;
		amount: number;
		name: string;
	};

	type DonationSocketPayload = {
		amount?: number | string;
		name?: string;
		createdAt?: string | number;
	};

	function createMockMonthlyTotals() {
		const now = new Date();
		const currentMonthIndex = now.getMonth();
		const baseline = [620, 740, 690, 880, 910, 1020, 970, 1130, 1080, 1210, 1160, 1300];
		const totals = Array.from({ length: 12 }, (_, monthIndex) => {
			if (monthIndex > currentMonthIndex) return 0;
			if (monthIndex === currentMonthIndex) return 0;
			return baseline[monthIndex];
		});

		return totals;
	}

	let status = $state<ConnectionStatus>('Connecting...');
	let donations = $state<Donation[]>([]);
	let totalIncome = $state(0);
	let toast = $state<ToastDonation | null>(null);
	let donationPulse = $state(false);

	let monthlyTotals = $state<number[]>(createMockMonthlyTotals());

	let qrCanvas: HTMLCanvasElement | undefined;
	let chartCanvas: HTMLCanvasElement | undefined;
	let toastTimer: ReturnType<typeof setTimeout> | undefined;
	let pulseTimer: ReturnType<typeof setTimeout> | undefined;
	let monthlyChart: Chart<'bar'> | null = null;

	const CURRENT_YEAR = new Date().getFullYear();
	const CURRENT_MONTH_INDEX = new Date().getMonth();
	const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('id-ID', { month: 'short' });

	const monthLabels = $derived(
		Array.from({ length: CURRENT_MONTH_INDEX + 1 }, (_, index) =>
			MONTH_LABEL_FORMATTER.format(new Date(CURRENT_YEAR, index, 1))
		)
	);

	const monthValues = $derived(monthlyTotals.slice(0, CURRENT_MONTH_INDEX + 1));

	function euro(amount: number) {
		return new Intl.NumberFormat('de-DE', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 2
		}).format(amount);
	}

	function euroCompact(amount: number) {
		return new Intl.NumberFormat('de-DE', {
			style: 'currency',
			currency: 'EUR',
			maximumFractionDigits: 0,
			notation: 'compact'
		}).format(amount);
	}

	function exactHourLabel(timestamp: number) {
		return new Intl.DateTimeFormat('id-ID', {
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(timestamp));
	}

	function toTimestamp(value: unknown) {
		if (typeof value === 'number' && Number.isFinite(value)) return value;
		if (typeof value === 'string') {
			const parsed = Date.parse(value);
			if (Number.isFinite(parsed)) return parsed;
		}
		return Date.now();
	}

	function chartStep(maxValue: number) {
		if (maxValue <= 500) return 100;
		if (maxValue <= 2000) return 250;
		return 500;
	}

	function chartMax(maxValue: number) {
		const step = chartStep(maxValue);
		return Math.max(500, Math.ceil(maxValue / step) * step);
	}

	function createOrUpdateChart() {
		if (!chartCanvas) return;

		const values = [...monthValues];
		const labels = [...monthLabels];
		const maxValue = Math.max(...values, 0);
		const yMax = chartMax(maxValue);
		const yStep = chartStep(yMax);

		if (!monthlyChart) {
			const dataset: ChartDataset<'bar', number[]> = {
				data: values,
				label: 'Donasi Bulanan',
				backgroundColor: 'rgba(74, 222, 128, 0.85)',
				borderColor: 'rgba(16, 185, 129, 0.85)',
				borderWidth: 1,
				borderRadius: 14,
				maxBarThickness: 48
			};

			const config: ChartConfiguration<'bar'> = {
				type: 'bar',
				data: {
					labels,
					datasets: [dataset]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					layout: {
						padding: {
							top: 30,
							right: 6,
							left: 4,
							bottom: 4
						}
					},
					animation: {
						duration: 750,
						easing: 'easeOutCubic'
					},
					plugins: {
						legend: {
							display: false
						},
						tooltip: {
							enabled: false
						},
						datalabels: {
							anchor: 'end',
							align: 'top',
							offset: 6,
							color: 'rgba(6, 78, 59, 0.92)',
							font: {
								weight: 'bold',
								size: 11
							},
							formatter: (value: number) => euroCompact(Number(value)),
							clip: false,
							clamp: true
						}
					},
					scales: {
						x: {
							grid: {
								display: false
							},
							ticks: {
								color: 'rgba(6, 95, 70, 0.8)',
								font: {
									weight: 'bold',
									size: 11
								}
							}
						},
						y: {
							min: 0,
							max: yMax,
							ticks: {
								stepSize: yStep,
								color: 'rgba(6, 95, 70, 0.7)',
								font: {
									size: 10,
									weight: 'bold'
								},
								callback: (value: string | number) => euroCompact(Number(value))
							},
							grid: {
								color: 'rgba(16, 185, 129, 0.15)'
							}
						}
					}
				}
			};

			monthlyChart = new Chart(chartCanvas, config);
			return;
		}

		monthlyChart.data.labels = labels;
		monthlyChart.data.datasets[0].data = values;
		monthlyChart.options.scales = {
			x: {
				grid: {
					display: false
				},
				ticks: {
					color: 'rgba(6, 95, 70, 0.8)',
					font: {
						weight: 'bold',
						size: 11
					}
				}
			},
			y: {
				min: 0,
				max: yMax,
				ticks: {
					stepSize: yStep,
					color: 'rgba(6, 95, 70, 0.7)',
					font: {
						size: 10,
						weight: 'bold'
					},
					callback: (value: string | number) => euroCompact(Number(value))
				},
				grid: {
					color: 'rgba(16, 185, 129, 0.15)'
				}
			}
		};

		monthlyChart.update();
	}

	function addToMonthlyTotal(amount: number, createdAt: number) {
		const donationDate = new Date(createdAt);
		if (donationDate.getFullYear() !== CURRENT_YEAR) return;

		const monthIndex = donationDate.getMonth();
		if (monthIndex > CURRENT_MONTH_INDEX) return;

		const nextTotals = [...monthlyTotals];
		nextTotals[monthIndex] = Number((nextTotals[monthIndex] + amount).toFixed(2));
		monthlyTotals = nextTotals;
	}

	function registerDonation(donation: Donation) {
		donations = [donation, ...donations].slice(0, 12);
		totalIncome = Number((totalIncome + donation.amount).toFixed(2));
		addToMonthlyTotal(donation.amount, donation.createdAt);

		createOrUpdateChart();

		toast = {
			id: Date.now(),
			amount: donation.amount,
			name: donation.name?.trim() || 'Hamba Allah'
		};

		donationPulse = true;
		if (pulseTimer) clearTimeout(pulseTimer);
		pulseTimer = setTimeout(() => {
			donationPulse = false;
		}, 420);

		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			toast = null;
		}, 4200);
	}

	function simulateDonation() {
		const amount = Number((Math.random() * (130 - 15) + 15).toFixed(2));

		registerDonation({
			amount,
			name: 'Donasi Masjid',
			createdAt: Date.now()
		});
	}

	onMount(() => {
		if (!qrCanvas || !chartCanvas) {
			status = 'Disconnected';
			return;
		}

		createOrUpdateChart();

		void QRCode.toCanvas(qrCanvas, DONATION_URL, {
			margin: 1,
			color: {
				dark: '#14532d',
				light: '#f0fdf4'
			}
		});

		const socket = io(STRAPI_URL, {
			auth: {
				token: SOCKET_TOKEN
			}
		});

		socket.on('connect', () => {
			status = 'Connected';
		});

		socket.on('disconnect', () => {
			status = 'Disconnected';
		});

		socket.on(EVENT_NAME, (payload: DonationSocketPayload) => {
			const createdAt = toTimestamp(payload.createdAt);
			const amount = Number(payload.amount ?? 0);
			if (!Number.isFinite(amount) || amount <= 0) return;

			registerDonation({
				amount,
				name: 'Donasi Masjid',
				createdAt
			});
		});

		return () => {
			socket.disconnect();
			if (toastTimer) clearTimeout(toastTimer);
			if (pulseTimer) clearTimeout(pulseTimer);
			if (monthlyChart) {
				monthlyChart.destroy();
				monthlyChart = null;
			}
			status = 'Disconnected';
		};
	});
</script>

<svelte:head>
	<title>Dashboard Donasi IWKZ</title>
	<meta
		name="description"
		content="Dashboard donasi live untuk operasional dan Jumat dengan grafik euro, notifikasi real-time, dan QR PayPal."
	/>
</svelte:head>

<div
	class="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_15%_20%,rgba(134,239,172,0.45),transparent_35%),radial-gradient(circle_at_85%_8%,rgba(110,231,183,0.28),transparent_30%),linear-gradient(135deg,#f7fee7_0%,#ecfdf3_54%,#f0fdf4_100%)]"
></div>
<div
	class="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,rgba(22,163,74,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(22,163,74,0.08)_1px,transparent_1px)] bg-size-[26px_26px] opacity-35"
></div>

<main
	class="mx-auto grid h-dvh w-full max-w-355 grid-rows-[auto_minmax(0,1fr)] overflow-hidden px-4 pt-4 pb-20 font-[Manrope,Plus_Jakarta_Sans,Segoe_UI,sans-serif] text-green-950 sm:px-7 sm:pt-6 sm:pb-20"
>
	<header class="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
		<div>
			<p class="mb-2 text-[0.72rem] font-extrabold tracking-[0.2em] text-green-700 uppercase">
				IWKZ LIVE DONATION WALL
			</p>
			<h1 class="text-[clamp(1.9rem,4vw,3.2rem)] leading-[1.02] font-extrabold tracking-[-0.03em]">
				Donasi Operasional & Jumat
				<small class="mt-2.5 block text-[0.34em] font-semibold tracking-normal text-green-800"
					>Live-Spenden fur Betrieb & Freitagsgebet</small
				>
			</h1>
		</div>
		<div
			class={`rounded-full border px-4 py-2 text-sm font-bold shadow-[0_12px_34px_rgba(21,128,61,0.12)] ${
				status === 'Connected'
					? 'border-green-700/20 bg-green-100/95 text-green-900'
					: 'border-green-900/15 bg-white/80 text-green-900'
			}`}
		>
			{status}
		</div>
	</header>

	<section class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2.8fr)_minmax(260px,1fr)]">
		<article
			class={`grid min-h-0 grid-rows-[auto_minmax(0,1fr)] rounded-[30px] border border-green-600/20 bg-white/88 p-4 shadow-[0_26px_52px_rgba(22,101,52,0.13)] backdrop-blur-xl transition-transform duration-300 sm:p-6 ${donationPulse ? 'scale-[1.01]' : 'scale-100'}`}
		>
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h3 class="text-[1.2rem] font-bold tracking-[-0.01em]">Grafik Donasi Bulanan</h3>
					<p class="mt-1 text-[0.86rem] text-green-900/75">
						Januari sampai bulan ini, sumbu-Y Euro (€), real-time
					</p>
					<small class="mt-0.5 block text-[0.72rem] text-green-900/60"
						>Von Januar bis aktuellen Monat, Live-Aktualisierung</small
					>
				</div>
				<div
					class="rounded-2xl border border-emerald-700/15 bg-white/85 px-3 py-2 text-right shadow-[0_8px_20px_rgba(16,185,129,0.1)]"
				>
					<p class="text-[0.68rem] font-bold tracking-wide text-emerald-800 uppercase">
						Total Hari Ini
					</p>
					<p class="text-[1.05rem] font-extrabold tracking-[-0.02em] text-emerald-950">
						{euro(totalIncome)}
					</p>
					<small class="text-[0.64rem] text-emerald-900/65">Gesamt heute</small>
				</div>
			</div>

			<div
				class="mt-3 min-h-0 overflow-hidden rounded-2xl border border-emerald-600/10 bg-linear-to-b from-emerald-50/75 to-white p-3"
			>
				<div class="h-full min-h-88 w-full sm:min-h-104">
					<canvas
						class="h-full w-full"
						bind:this={chartCanvas}
						aria-label="Grafik donasi bulanan dalam euro"
					></canvas>
				</div>
			</div>
		</article>

		<aside
			class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[28px] border border-green-600/20 bg-white/85 p-4 shadow-[0_26px_52px_rgba(22,101,52,0.13)] backdrop-blur-xl sm:p-5"
		>
			<div class="pb-3.5">
				<h3 class="text-[1.05rem] font-bold">Donasi Terbaru</h3>
				<p class="mt-1 text-[0.76rem] text-green-900/75">Masuk secara real-time</p>
				<small class="mt-0.5 block text-[0.68rem] text-green-900/60">Live Eingang in Echtzeit</small
				>
			</div>
			{#if donations.length === 0}
				<p class="text-[0.9rem] text-green-700/75">Menunggu donasi masuk...</p>
			{:else}
				<div class="grid h-full auto-rows-max content-start gap-2.5 overflow-auto pr-1.5">
					{#each donations as donation, index (index)}
						<div
							class="grid h-18 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 overflow-hidden rounded-[14px] border border-green-600/10 bg-green-50/90 px-3.5 py-3"
						>
							<div class="min-w-0">
								<strong class="block truncate">{donation.name ?? 'Hamba Allah'}</strong>
								<span class="mt-0.5 block text-[0.72rem] text-green-900/65"
									>{exactHourLabel(donation.createdAt)}</span
								>
							</div>
							<strong class="shrink-0 text-[0.95rem]">{euro(donation.amount)}</strong>
						</div>
					{/each}
				</div>
			{/if}
		</aside>
	</section>

	{#if toast}
		<div
			class="fixed top-3 left-1/2 z-20 w-[min(92vw,540px)] -translate-x-1/2 rounded-2xl bg-green-700/95 px-4 py-3 text-center text-green-50 shadow-[0_18px_40px_rgba(20,83,45,0.42)] motion-safe:animate-pulse sm:top-6 sm:px-5 sm:py-4"
			role="status"
			aria-live="polite"
		>
			<p class="mb-1 text-2xl leading-none font-extrabold">+ {euro(toast.amount)}</p>
			<p class="text-[1rem] font-bold">Jazaakumullahu khairan atas donasinya</p>
			<p class="mt-1 text-[0.8rem] opacity-90">Moge Allah es Ihnen vielfach vergelten.</p>
		</div>
	{/if}

	<button
		class="fixed bottom-2.5 left-2.5 z-20 cursor-pointer rounded-xl bg-green-900 px-3 py-2.5 text-sm font-bold text-green-50 shadow-[0_14px_28px_rgba(20,83,45,0.28)] transition-transform hover:-translate-y-0.5 sm:bottom-4 sm:left-4 sm:rounded-2xl sm:px-3.5 sm:py-3"
		onclick={simulateDonation}
	>
		Simulasi Donasi
		<small class="mt-0.5 block text-[0.7rem] font-medium opacity-90">Debug eingehend</small>
	</button>

	<div
		class="fixed right-2.5 bottom-2.5 z-20 flex w-31 flex-col items-center justify-center rounded-2xl border border-green-600/25 bg-white/90 p-2 text-center shadow-[0_18px_36px_rgba(21,128,61,0.22)] sm:right-4 sm:bottom-4 sm:w-42.5 sm:p-2.5"
	>
		<p class="text-[0.82rem] font-bold">Scan PayPal</p>
		<small class="mt-0.5 mb-2 block text-[0.68rem] text-green-900/70">Jetzt spenden</small>
		<canvas class="mx-auto" bind:this={qrCanvas}></canvas>
	</div>
</main>

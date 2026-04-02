<script lang="ts">
	import { onMount } from 'svelte';
	import {
		PUBLIC_DONATION_URL,
		PUBLIC_SOCKET_EVENT_NAME,
		PUBLIC_SOCKET_TOKEN,
		PUBLIC_STRAPI_URL
	} from '$env/static/public';
	import {
		euro,
		euroCompact,
		getMonthlyTotalsByLedger,
		registerMonthlyDonationChart,
		renderMonthlyDonationChart,
		requestInitialDashboardUpdate
	} from '$lib/features/dashboard';
	import type {
		ConnectionStatus,
		CurrentOperationalDonationProgress,
		DonationSocketPayload,
		JadwalShalat,
		MonthlyLedgerSeries,
		ToastDonation
	} from '$lib/features/dashboard';
	import iwkzLogo from '$lib/assets/iwkz-logo.png';
	import { Chart } from 'chart.js/auto';
	import QRCode from 'qrcode';
	import { io } from 'socket.io-client';

	const STRAPI_URL = PUBLIC_STRAPI_URL || 'http://api.iwkz.de/';
	const EVENT_NAME = PUBLIC_SOCKET_EVENT_NAME || 'info_iwkz';
	const SOCKET_TOKEN = PUBLIC_SOCKET_TOKEN || '';
	const DONATION_URL = PUBLIC_DONATION_URL || 'https://paypal.me/your-link';

	registerMonthlyDonationChart();

	let status = $state<ConnectionStatus>('Connecting...');
	let totalIncome = $state(0);
	let toast = $state<ToastDonation | null>(null);
	let donationPulse = $state(false);
	let currentMonthIncome = $state<number | null>(null);

	let monthlyLedgerSeries = $state<MonthlyLedgerSeries[]>([]);
	let todayJadwalShalat = $state<JadwalShalat | null>(null);
	let hasReceivedInitialPayload = $state(false);

	let qrCanvas: HTMLCanvasElement | undefined;
	let qrWrapper: HTMLDivElement | undefined;
	let chartCanvas: HTMLCanvasElement | undefined;
	let toastTimer: ReturnType<typeof setTimeout> | undefined;
	let pulseTimer: ReturnType<typeof setTimeout> | undefined;
	let monthlyChart: Chart<'bar' | 'line'> | null = null;
	let qrResizeObserver: ResizeObserver | undefined;

	const CURRENT_YEAR = new Date().getFullYear();
	const CURRENT_MONTH_INDEX = new Date().getMonth();
	const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('id-ID', { month: 'short' });

	const monthLabels = $derived(
		Array.from({ length: CURRENT_MONTH_INDEX + 1 }, (_, index) =>
			MONTH_LABEL_FORMATTER.format(new Date(CURRENT_YEAR, index, 1))
		)
	);

	const monthDatasets = $derived.by(() => {
		const monthCount = CURRENT_MONTH_INDEX + 1;
		const inflowValues = Array.from({ length: monthCount }, () => 0);
		const outflowValues = Array.from({ length: monthCount }, () => 0);

		for (const series of monthlyLedgerSeries) {
			for (let monthIndex = 0; monthIndex < monthCount; monthIndex += 1) {
				const value = Math.abs(series.values[monthIndex] ?? 0);
				if (series.flow === 'inflow') {
					inflowValues[monthIndex] += value;
				} else {
					outflowValues[monthIndex] += value;
				}
			}
		}

		if (currentMonthIncome !== null) {
			inflowValues[CURRENT_MONTH_INDEX] = Number(currentMonthIncome.toFixed(2));
		}

		return [
			{
				label: 'Inflow',
				ledgerId: 1,
				flow: 'inflow' as const,
				values: inflowValues.map((value) => Number(value.toFixed(2)))
			},
			{
				label: 'Outflow',
				ledgerId: 2,
				flow: 'outflow' as const,
				values: outflowValues.map((value) => Number(value.toFixed(2)))
			}
		];
	});

	function createOrUpdateChart() {
		monthlyChart = renderMonthlyDonationChart({
			chart: monthlyChart,
			canvas: chartCanvas,
			labels: [...monthLabels],
			datasets: [...monthDatasets],
			formatCompactValue: euroCompact
		});
	}

	function updateDonationProgress(progress: CurrentOperationalDonationProgress | null | undefined) {
		const nextTotalIncome = Number((progress?.totalPrice ?? 0).toFixed(2));
		const incomeDelta = Number((nextTotalIncome - totalIncome).toFixed(2));

		if (progress?.totalPrice !== undefined && Number.isFinite(progress.totalPrice)) {
			currentMonthIncome = Number(progress.totalPrice.toFixed(2));
		}

		totalIncome = nextTotalIncome;

		if (incomeDelta <= 0) {
			return;
		}

		toast = {
			id: Date.now(),
			amount: incomeDelta
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

	function hydrateDonationProgress(
		progress: CurrentOperationalDonationProgress | null | undefined
	) {
		const nextTotalIncome = Number((progress?.totalPrice ?? 0).toFixed(2));

		if (progress?.totalPrice !== undefined && Number.isFinite(progress.totalPrice)) {
			currentMonthIncome = Number(progress.totalPrice.toFixed(2));
		}

		totalIncome = nextTotalIncome;
	}

	function simulateDonation() {
		const amount = Number((Math.random() * (130 - 15) + 15).toFixed(2));
		updateDonationProgress({
			totalPrice: Number((totalIncome + amount).toFixed(2))
		});
	}

	function renderQrCode() {
		if (!qrCanvas || !qrWrapper) {
			return;
		}

		const qrWidth = Math.max(96, Math.floor(qrWrapper.clientWidth));

		void QRCode.toCanvas(qrCanvas, DONATION_URL, {
			margin: 1,
			width: qrWidth,
			color: {
				dark: '#14532d',
				light: '#f0fdf4'
			}
		});
	}

	onMount(() => {
		if (!qrCanvas || !qrWrapper || !chartCanvas) {
			status = 'Disconnected';
			return;
		}

		createOrUpdateChart();
		renderQrCode();

		qrResizeObserver = new ResizeObserver(() => {
			renderQrCode();
		});
		qrResizeObserver.observe(qrWrapper);

		const socket = io(STRAPI_URL, {
			auth: {
				token: SOCKET_TOKEN
			}
		});

		socket.on('connect', () => {
			status = 'Connected';
			void requestInitialDashboardUpdate({
				strapiUrl: STRAPI_URL,
				socketToken: SOCKET_TOKEN
			}).catch((error) => {
				console.error('Failed to request initial dashboard update', error);
			});
		});

		socket.on('disconnect', () => {
			status = 'Disconnected';
		});

		socket.on(EVENT_NAME, (payload: DonationSocketPayload) => {
			console.log('Received donation payload:', payload);

			if (payload.todayJadwalShalat) {
				todayJadwalShalat = payload.todayJadwalShalat;
			}

			monthlyLedgerSeries = getMonthlyTotalsByLedger(
				payload.finance?.operationalMonthlyReport,
				CURRENT_MONTH_INDEX
			);

			if (!hasReceivedInitialPayload) {
				hydrateDonationProgress(payload.finance?.currentOperationalDonationProgress);
				hasReceivedInitialPayload = true;
			} else {
				updateDonationProgress(payload.finance?.currentOperationalDonationProgress);
			}

			createOrUpdateChart();
		});

		return () => {
			socket.disconnect();
			if (qrResizeObserver) qrResizeObserver.disconnect();
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
		content="Dashboard donasi live IWKZ dengan grafik euro, notifikasi real-time, dan QR PayPal."
	/>
</svelte:head>

<div
	class="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_15%_20%,rgba(134,239,172,0.45),transparent_35%),radial-gradient(circle_at_85%_8%,rgba(110,231,183,0.28),transparent_30%),linear-gradient(135deg,#f7fee7_0%,#ecfdf3_54%,#f0fdf4_100%)]"
></div>
<div
	class="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,rgba(22,163,74,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(22,163,74,0.08)_1px,transparent_1px)] bg-size-[26px_26px] opacity-35"
></div>

<main
	class="mx-auto grid h-dvh w-full max-w-355 grid-rows-[auto_minmax(0,1fr)] overflow-x-hidden overflow-y-auto px-3 pt-3 pb-14 font-[Manrope,Plus_Jakarta_Sans,Segoe_UI,sans-serif] text-green-950 sm:px-5 sm:pt-4 sm:pb-14"
>
	<header class="mb-3 flex flex-col gap-2.5 md:flex-row md:items-start md:justify-between">
		<div>
			<div class="mb-2 inline-flex items-center gap-2 py-1">
				<img src={iwkzLogo} alt="IWKZ logo" class="h-8 w-auto rounded-md sm:h-9" loading="eager" />
				<span class="text-[0.72rem] font-bold tracking-[0.16em] text-green-700 uppercase">IWKZ</span
				>
			</div>
			<h1 class="text-[clamp(1.9rem,4vw,3.2rem)] leading-[1.02] font-extrabold tracking-[-0.03em]">
				Donasi IWKZ
				<small class="mt-1.5 block text-[0.34em] font-semibold tracking-normal text-green-800"
					>Live-Spenden fur IWKZ</small
				>
			</h1>
		</div>
		<div
			class={`rounded-full border px-3 py-1.5 text-sm font-bold shadow-[0_10px_24px_rgba(21,128,61,0.12)] ${
				status === 'Connected'
					? 'border-green-700/20 bg-green-100/95 text-green-900'
					: 'border-green-900/15 bg-white/80 text-green-900'
			}`}
		>
			{status}
		</div>
	</header>

	<section class="grid min-h-0 grid-cols-1 gap-3">
		<article
			class={`grid min-h-0 grid-rows-[auto_minmax(0,1fr)] rounded-[22px] border border-green-600/20 bg-white/88 p-3 shadow-[0_20px_40px_rgba(22,101,52,0.13)] backdrop-blur-xl transition-transform duration-300 sm:p-4 ${donationPulse ? 'scale-[1.01]' : 'scale-100'}`}
		>
			<div class="flex flex-wrap items-start justify-between gap-2.5">
				<div>
					<h3 class="text-[1.2rem] font-bold tracking-[-0.01em]">Donasi Bulanan</h3>
					<p class="mt-1 text-[0.86rem] text-green-900/75">
						Pemasukan & pengeluaran dari Januari hingga bulan ini (€)
					</p>
					<small class="mt-0.5 block text-[0.72rem] text-green-900/60"
						>Einnahmen & Ausgaben von Januar bis heute</small
					>
				</div>
				<div class="px-2.5 py-1.5 text-right">
					<p class="text-[0.68rem] font-bold tracking-wide text-emerald-800 uppercase">
						Total Donasi Masuk Bulan Ini
					</p>
					<p class="text-[1.05rem] font-extrabold tracking-[-0.02em] text-emerald-950">
						{euro(totalIncome)}
					</p>
					<small class="text-[0.64rem] text-emerald-900/65">Gesamt eingehend diesen Monat</small>
				</div>
			</div>

			<div
				class="mt-2 min-h-0 overflow-hidden rounded-xl border border-emerald-600/10 bg-linear-to-b from-emerald-50/75 to-white p-2"
			>
				<div class="h-[clamp(300px,52vh,460px)] w-full">
					<canvas
						class="h-full w-full"
						bind:this={chartCanvas}
						aria-label="Grafik donasi bulanan dalam euro"
					></canvas>
				</div>
			</div>
		</article>
	</section>

	{#if toast}
		<div
			class="fixed top-2.5 left-1/2 z-20 w-[min(92vw,520px)] -translate-x-1/2 rounded-xl bg-green-700/95 px-3 py-2.5 text-center text-green-50 shadow-[0_14px_32px_rgba(20,83,45,0.42)] motion-safe:animate-pulse sm:top-4 sm:px-4 sm:py-3"
			role="status"
			aria-live="polite"
		>
			<p class="mb-1 text-2xl leading-none font-extrabold">+ {euro(toast.amount)}</p>
			<p class="text-[1rem] font-bold">Jazaakumullahu khairan atas donasinya</p>
			<p class="mt-1 text-[0.8rem] opacity-90">Moge Allah es Ihnen vielfach vergelten.</p>
		</div>
	{/if}

	<button
		class="fixed bottom-2 left-2 z-20 cursor-pointer rounded-xl bg-green-900 px-2.5 py-2 text-sm font-bold text-green-50 shadow-[0_12px_24px_rgba(20,83,45,0.28)] transition-transform hover:-translate-y-0.5 sm:bottom-3 sm:left-3 sm:px-3 sm:py-2.5"
		onclick={simulateDonation}
	>
		Simulasi Donasi
		<small class="mt-0.5 block text-[0.7rem] font-medium opacity-90">Debug eingehend</small>
	</button>

	<div
		class="fixed right-2 bottom-2 z-20 flex w-36 flex-col items-center justify-center rounded-xl border border-green-600/25 bg-white/90 p-1.5 text-center shadow-[0_14px_28px_rgba(21,128,61,0.22)] sm:right-3 sm:bottom-3 sm:w-44 sm:p-2"
	>
		{#if todayJadwalShalat}
			<p class="mb-1 text-[0.7rem] font-bold tracking-wide text-green-800 uppercase">
				Waktu Shalat
			</p>
			<div class="mb-2 grid w-full grid-cols-2 gap-x-1.5 gap-y-0.5 text-left">
				<span class="text-[0.7rem] text-green-900/65">Subuh</span><span
					class="text-right text-[0.7rem] font-semibold">{todayJadwalShalat.subuh}</span
				>
				<span class="text-[0.7rem] text-green-900/65">Terbit</span><span
					class="text-right text-[0.7rem] font-semibold">{todayJadwalShalat.terbit}</span
				>
				<span class="text-[0.7rem] text-green-900/65">Zuhur</span><span
					class="text-right text-[0.7rem] font-semibold">{todayJadwalShalat.dzuhur}</span
				>
				<span class="text-[0.7rem] text-green-900/65">Asar</span><span
					class="text-right text-[0.7rem] font-semibold">{todayJadwalShalat.ashr}</span
				>
				<span class="text-[0.7rem] text-green-900/65">Maghrib</span><span
					class="text-right text-[0.7rem] font-semibold">{todayJadwalShalat.maghrib}</span
				>
				<span class="text-[0.7rem] text-green-900/65">Isya</span><span
					class="text-right text-[0.7rem] font-semibold">{todayJadwalShalat.isya}</span
				>
			</div>
			<hr class="mb-2 w-full border-green-600/20" />
		{/if}
		<p class="text-[0.82rem] font-bold">Scan PayPal</p>
		<small class="mt-0.5 mb-2 block text-[0.68rem] text-green-900/70">Jetzt spenden</small>
		<div class="mx-auto w-full" bind:this={qrWrapper}>
			<canvas class="block h-auto w-full" bind:this={qrCanvas}></canvas>
		</div>
	</div>
</main>

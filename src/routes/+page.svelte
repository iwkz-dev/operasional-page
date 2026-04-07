<script lang="ts">
	import { onMount } from 'svelte';
	import {
		PUBLIC_SOCKET_EVENT_NAME,
		PUBLIC_SOCKET_TOKEN,
		PUBLIC_STRAPI_URL
	} from '$env/static/public';
	import {
		buildMonthDatasets,
		CHART_MODES,
		euro,
		euroCompact,
		euroSimple,
		getMonthlyTotalsByLedger,
		registerMonthlyDonationChart,
		renderMonthlyDonationChart,
		requestInitialDashboardUpdate
	} from '$lib/features/dashboard';
	import type {
		ChartMode,
		ConnectionStatus,
		CurrentOperationalDonationProgress,
		DonationSocketPayload,
		JadwalShalat,
		MonthlyLedgerSeries,
		ToastDonation
	} from '$lib/features/dashboard';
	import DonationToast from '$lib/components/DonationToast.svelte';
	import PrayerTimesWidget from '$lib/components/PrayerTimesWidget.svelte';
	import iwkzLogo from '$lib/assets/iwkz-logo.png';
	import { Chart } from 'chart.js/auto';
	import { io } from 'socket.io-client';

	const STRAPI_URL = PUBLIC_STRAPI_URL || 'http://api.iwkz.de/';
	const EVENT_NAME = PUBLIC_SOCKET_EVENT_NAME || 'info_iwkz';
	const SOCKET_TOKEN = PUBLIC_SOCKET_TOKEN || '';
	const PRS_DONATION_TARGET = 1000000;

	registerMonthlyDonationChart();

	let status = $state<ConnectionStatus>('Connecting...');
	let totalIncome = $state(0);
	let currentPrsDonation = $state<number | null>(null);
	let toast = $state<ToastDonation | null>(null);
	let prsToast = $state<ToastDonation | null>(null);
	let donationPulse = $state(false);
	let currentMonthIncome = $state<number | null>(null);

	let operationalMonthlyLedgerSeries = $state<MonthlyLedgerSeries[]>([]);
	let prsMonthlyLedgerSeries = $state<MonthlyLedgerSeries[]>([]);
	let todayJadwalShalat = $state<JadwalShalat | null>(null);
	let hasReceivedInitialPayload = $state(false);
	let activeChartMode = $state<ChartMode>('operational');

	let chartCanvas: HTMLCanvasElement | undefined;
	let toastTimer: ReturnType<typeof setTimeout> | undefined;
	let prsToastTimer: ReturnType<typeof setTimeout> | undefined;
	let pulseTimer: ReturnType<typeof setTimeout> | undefined;
	let clockTimer: ReturnType<typeof setInterval> | undefined;
	let chartCarouselTimer: ReturnType<typeof setInterval> | undefined;
	let monthlyChart: Chart<'bar' | 'line'> | null = null;

	const CURRENT_YEAR = new Date().getFullYear();
	const CURRENT_MONTH_INDEX = new Date().getMonth();
	const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('id-ID', { month: 'short' });
	const CLOCK_TIME_FORMATTER = new Intl.DateTimeFormat('de-DE', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
	const CLOCK_DATE_FORMATTER = new Intl.DateTimeFormat('de-DE', {
		weekday: 'short',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	});
	let currentTimeLabel = $state(CLOCK_TIME_FORMATTER.format(new Date()));
	let currentDateLabel = $state(CLOCK_DATE_FORMATTER.format(new Date()));

	const monthLabels = $derived(
		Array.from({ length: CURRENT_MONTH_INDEX + 1 }, (_, index) =>
			MONTH_LABEL_FORMATTER.format(new Date(CURRENT_YEAR, index, 1))
		)
	);

	const operationalMonthDatasets = $derived.by(() =>
		buildMonthDatasets(operationalMonthlyLedgerSeries, CURRENT_MONTH_INDEX, currentMonthIncome)
	);
	const prsMonthDatasets = $derived.by(() =>
		buildMonthDatasets(prsMonthlyLedgerSeries, CURRENT_MONTH_INDEX)
	);
	const activeMonthDatasets = $derived.by(() =>
		activeChartMode === 'operational' ? operationalMonthDatasets : prsMonthDatasets
	);
	const activeChartTitle = $derived(
		activeChartMode === 'operational' ? 'Donasi Operasional Bulanan' : 'Donasi PRS Bulanan'
	);
	const activeChartSubtitle = $derived(
		activeChartMode === 'operational'
			? 'Operative Einnahmen & Ausgaben von Januar bis heute'
			: 'PRS Einnahmen & Ausgaben von Januar bis heute'
	);

	function createOrUpdateChart() {
		monthlyChart = renderMonthlyDonationChart({
			chart: monthlyChart,
			canvas: chartCanvas,
			labels: [...monthLabels],
			datasets: [...activeMonthDatasets],
			formatCompactValue: euroCompact
		});
	}

	function setChartMode(mode: ChartMode) {
		if (activeChartMode === mode) {
			return;
		}

		activeChartMode = mode;
		createOrUpdateChart();
	}

	function showNextChart() {
		const currentIndex = CHART_MODES.indexOf(activeChartMode);
		const nextIndex = (currentIndex + 1) % CHART_MODES.length;
		setChartMode(CHART_MODES[nextIndex]);
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

	function updatePrsDonation(nextPrsDonation: number, shouldNotify = true) {
		const nextAmount = Number(nextPrsDonation.toFixed(2));
		const previousAmount = currentPrsDonation ?? 0;
		const prsDelta = Number((nextAmount - previousAmount).toFixed(2));

		currentPrsDonation = nextAmount;

		if (!shouldNotify || prsDelta <= 0) {
			return;
		}

		prsToast = {
			id: Date.now(),
			amount: prsDelta
		};

		if (prsToastTimer) clearTimeout(prsToastTimer);
		prsToastTimer = setTimeout(() => {
			prsToast = null;
		}, 4200);
	}

	function updateCurrentTimeLabel() {
		const now = new Date();
		currentTimeLabel = CLOCK_TIME_FORMATTER.format(now);
		currentDateLabel = CLOCK_DATE_FORMATTER.format(now);
	}

	onMount(() => {
		updateCurrentTimeLabel();
		clockTimer = setInterval(updateCurrentTimeLabel, 1000);

		if (!chartCanvas) {
			status = 'Disconnected';
			return () => {
				if (clockTimer) clearInterval(clockTimer);
			};
		}

		createOrUpdateChart();
		chartCarouselTimer = setInterval(showNextChart, 10000);

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

			const nextPrsDonation = payload.finance?.currentPrsDonationProgress?.currentDonation;
			if (nextPrsDonation !== undefined && Number.isFinite(nextPrsDonation)) {
				updatePrsDonation(nextPrsDonation, hasReceivedInitialPayload);
			}

			operationalMonthlyLedgerSeries = getMonthlyTotalsByLedger(
				payload.finance?.operationalMonthlyReport,
				CURRENT_MONTH_INDEX
			);
			prsMonthlyLedgerSeries = getMonthlyTotalsByLedger(
				payload.finance?.prsMonthlyReport,
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
			if (clockTimer) clearInterval(clockTimer);
			if (chartCarouselTimer) clearInterval(chartCarouselTimer);
			if (toastTimer) clearTimeout(toastTimer);
			if (prsToastTimer) clearTimeout(prsToastTimer);
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

<!-- Subtle background -->
<div
	class="pointer-events-none fixed inset-0 -z-20 bg-linear-to-br from-green-50 via-emerald-50/60 to-white"
></div>

<main
	class="mx-auto flex min-h-dvh w-full max-w-400 flex-col gap-3 px-3 pt-3 pb-4 font-[Manrope,Plus_Jakarta_Sans,Segoe_UI,sans-serif] text-green-950 sm:gap-4 sm:px-5 sm:pt-4 lg:grid lg:h-dvh lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_18rem] lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden lg:pb-4 xl:grid-cols-[minmax(0,1fr)_20rem]"
>
	<!-- Header — spans both columns on lg -->
	<header class="flex items-center justify-between gap-3 lg:col-span-2">
		<div class="flex items-center gap-2.5">
			<img src={iwkzLogo} alt="IWKZ logo" class="h-8 w-auto rounded-lg sm:h-9" loading="eager" />
			<div class="leading-tight">
				<p class="text-[0.92rem] font-extrabold tracking-tight sm:text-[1.05rem]">
					Dashboard Donasi
				</p>
				<p class="text-[0.62rem] font-medium text-green-800/60">Live-Operativspenden IWKZ</p>
			</div>
		</div>
		<div
			class="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold {status ===
			'Connected'
				? 'border-emerald-200 bg-emerald-50 text-emerald-700'
				: 'border-green-200 bg-white text-green-600'}"
		>
			<span
				class="inline-block size-1.5 rounded-full {status === 'Connected'
					? 'bg-emerald-500'
					: 'bg-green-400'}"
			></span>
			{status}
		</div>
	</header>

	<!-- Left column: KPI row + chart -->
	<section class="flex min-h-0 flex-col gap-3 sm:gap-4">
		<!-- KPI cards -->
		<div class="grid grid-cols-2 gap-2.5 sm:gap-3">
			<div
				class="rounded-2xl border border-emerald-100 bg-white/80 px-3.5 py-3 shadow-sm backdrop-blur-sm sm:px-4 sm:py-3.5"
			>
				<p class="mb-1 text-[0.58rem] font-bold tracking-widest text-emerald-600 uppercase">
					Operasional
				</p>
				<p
					class="text-[clamp(1.1rem,2.5vw,1.5rem)] leading-none font-extrabold tracking-tight text-emerald-950"
				>
					{euro(totalIncome)}
				</p>
				<p class="mt-1 text-[0.58rem] font-medium text-emerald-700/60">
					Bulan ini &middot; Diesen Monat
				</p>
			</div>
			<div
				class="rounded-2xl border border-green-100 bg-white/80 px-3.5 py-3 shadow-sm backdrop-blur-sm sm:px-4 sm:py-3.5"
			>
				<p class="mb-1 text-[0.58rem] font-bold tracking-widest text-green-600 uppercase">PRS</p>
				<p
					class="text-[clamp(1rem,2.5vw,1.35rem)] leading-none font-extrabold tracking-tight text-green-950"
				>
					{#if currentPrsDonation !== null}
						{euroSimple(currentPrsDonation)}
					{:else}
						&ndash;
					{/if}
					<span class="text-[0.55em] font-semibold text-green-700/60"
						>/ {euroSimple(PRS_DONATION_TARGET)}</span
					>
				</p>
				<p class="mt-1 text-[0.58rem] font-medium text-green-700/60">Aktuelle PRS-Spende</p>
			</div>
		</div>

		<!-- Chart card -->
		<article
			class="flex min-h-0 flex-1 flex-col rounded-2xl border border-green-100 bg-white/80 shadow-sm backdrop-blur-sm transition-transform duration-300 {donationPulse
				? 'scale-[1.005]'
				: 'scale-100'}"
		>
			<div class="flex items-baseline justify-between gap-2 px-4 pt-3.5 pb-1 sm:pt-4">
				<div>
					<h3 class="text-[0.88rem] font-bold tracking-tight sm:text-[0.95rem]">
						{activeChartTitle}
					</h3>
					<p class="mt-0.5 text-[0.62rem] text-green-800/55">{activeChartSubtitle}</p>
				</div>
			</div>
			<div class="min-h-0 flex-1 px-3 pb-3 sm:px-4 sm:pb-4">
				<div class="h-full min-h-55 w-full sm:min-h-70">
					<canvas
						class="h-full w-full"
						bind:this={chartCanvas}
						aria-label={`Grafik donasi bulanan dalam euro untuk ${activeChartMode}`}
					></canvas>
				</div>
			</div>
		</article>
	</section>

	<!-- Right column: prayer + QR — stacks below chart on mobile -->
	<PrayerTimesWidget
		jadwalShalat={todayJadwalShalat}
		timeLabel={currentTimeLabel}
		dateLabel={currentDateLabel}
	/>

	<!-- Toasts -->
	{#if toast}
		<DonationToast
			amount={toast.amount}
			title="Jazaakumullahu khairan atas donasinya"
			subtitle="Möge Allah es Ihnen vielfach vergelten."
			variant="operational"
		/>
	{/if}

	{#if prsToast}
		<DonationToast
			amount={prsToast.amount}
			title="Donasi PRS baru diterima"
			subtitle="Neue PRS-Spende ist eingegangen."
			variant="prs"
		/>
	{/if}
</main>

import { registerMonthlyDonationChart } from '$lib/features/dashboard';
import type {
	ChartMode,
	ConnectionStatus,
	CurrentOperationalDonationProgress,
	DonationSocketPayload,
	JadwalShalat,
	MonthlyLedgerSeries,
	ToastDonation
} from '$lib/features/dashboard';
import {
	CLOCK_DATE_FORMATTER,
	CLOCK_TIME_FORMATTER,
	CURRENT_MONTH_INDEX,
	DONATION_PULSE_DURATION_MS,
	DONATION_TOAST_DURATION_MS,
	monthLabels
} from '$lib/features/dashboard/page/config';
import {
	createIncomeToast,
	extractDashboardPayloadState,
	getActiveMonthDatasets,
	getCurrentClockLabels,
	getNextChartMode,
	getProgressSnapshot,
	getPrsDonationSnapshot,
	renderDashboardMonthlyChart
} from '$lib/features/dashboard/page/helpers';
import { Chart } from 'chart.js/auto';
import { SvelteDate } from 'svelte/reactivity';

export function createDashboardPageController() {
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
	let jumatanMonthlyLedgerSeries = $state<MonthlyLedgerSeries[]>([]);
	let todayJadwalShalat = $state<JadwalShalat | null>(null);
	let hasReceivedInitialPayload = $state(false);
	let activeChartMode = $state<ChartMode>('operational');
	let chartCanvas = $state<HTMLCanvasElement | undefined>(undefined);
	let currentTimeLabel = $state(CLOCK_TIME_FORMATTER.format(new SvelteDate()));
	let currentDateLabel = $state(CLOCK_DATE_FORMATTER.format(new SvelteDate()));

	let toastTimer: ReturnType<typeof setTimeout> | undefined;
	let prsToastTimer: ReturnType<typeof setTimeout> | undefined;
	let pulseTimer: ReturnType<typeof setTimeout> | undefined;
	let monthlyChart: Chart<'bar' | 'line'> | null = null;

	const activeMonthDatasets = $derived.by(() =>
		getActiveMonthDatasets({
			mode: activeChartMode,
			currentMonthIndex: CURRENT_MONTH_INDEX,
			currentMonthIncome,
			series: {
				operationalMonthlyLedgerSeries,
				prsMonthlyLedgerSeries,
				jumatanMonthlyLedgerSeries
			}
		})
	);

	function setStatus(nextStatus: ConnectionStatus) {
		status = nextStatus;
	}

	function createOrUpdateChart() {
		monthlyChart = renderDashboardMonthlyChart({
			chart: monthlyChart,
			canvas: chartCanvas,
			labels: [...monthLabels],
			datasets: [...activeMonthDatasets]
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
		const nextChartMode = getNextChartMode(activeChartMode);
		setChartMode(nextChartMode);
	}

	function updateDonationProgress(progress: CurrentOperationalDonationProgress | null | undefined) {
		const nextSnapshot = getProgressSnapshot(progress, currentMonthIncome);
		const incomeDelta = Number((nextSnapshot.totalIncome - totalIncome).toFixed(2));

		totalIncome = nextSnapshot.totalIncome;
		currentMonthIncome = nextSnapshot.currentMonthIncome;

		if (incomeDelta <= 0) {
			return;
		}

		toast = createIncomeToast(incomeDelta);
		donationPulse = true;

		if (pulseTimer) clearTimeout(pulseTimer);
		pulseTimer = setTimeout(() => {
			donationPulse = false;
		}, DONATION_PULSE_DURATION_MS);

		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			toast = null;
		}, DONATION_TOAST_DURATION_MS);
	}

	function hydrateDonationProgress(
		progress: CurrentOperationalDonationProgress | null | undefined
	) {
		const nextSnapshot = getProgressSnapshot(progress, currentMonthIncome);
		totalIncome = nextSnapshot.totalIncome;
		currentMonthIncome = nextSnapshot.currentMonthIncome;
	}

	function updatePrsDonation(nextPrsDonation: number, shouldNotify = true) {
		const nextSnapshot = getPrsDonationSnapshot(currentPrsDonation, nextPrsDonation, shouldNotify);

		currentPrsDonation = nextSnapshot.currentPrsDonation;

		if (!nextSnapshot.toast) {
			return;
		}

		prsToast = nextSnapshot.toast;

		if (prsToastTimer) clearTimeout(prsToastTimer);
		prsToastTimer = setTimeout(() => {
			prsToast = null;
		}, DONATION_TOAST_DURATION_MS);
	}

	function updateCurrentTimeLabel() {
		const nextClockLabels = getCurrentClockLabels(CLOCK_TIME_FORMATTER, CLOCK_DATE_FORMATTER);
		currentTimeLabel = nextClockLabels.currentTimeLabel;
		currentDateLabel = nextClockLabels.currentDateLabel;
	}

	function handleSocketPayload(payload: DonationSocketPayload) {
		console.log('Received donation payload:', payload);

		const nextPayloadState = extractDashboardPayloadState(payload, CURRENT_MONTH_INDEX);

		if (nextPayloadState.todayJadwalShalat) {
			todayJadwalShalat = nextPayloadState.todayJadwalShalat;
		}

		if (
			nextPayloadState.nextPrsDonation !== undefined &&
			Number.isFinite(nextPayloadState.nextPrsDonation)
		) {
			updatePrsDonation(nextPayloadState.nextPrsDonation, hasReceivedInitialPayload);
		}

		operationalMonthlyLedgerSeries = nextPayloadState.operationalMonthlyLedgerSeries;
		prsMonthlyLedgerSeries = nextPayloadState.prsMonthlyLedgerSeries;
		jumatanMonthlyLedgerSeries = nextPayloadState.jumatanMonthlyLedgerSeries;

		if (!hasReceivedInitialPayload) {
			hydrateDonationProgress(nextPayloadState.operationalProgress);
			hasReceivedInitialPayload = true;
		} else {
			updateDonationProgress(nextPayloadState.operationalProgress);
		}

		createOrUpdateChart();
	}

	function cleanupLocalResources() {
		if (toastTimer) clearTimeout(toastTimer);
		if (prsToastTimer) clearTimeout(prsToastTimer);
		if (pulseTimer) clearTimeout(pulseTimer);
		if (monthlyChart) {
			monthlyChart.destroy();
			monthlyChart = null;
		}
	}

	return {
		get status() {
			return status;
		},
		get totalIncome() {
			return totalIncome;
		},
		get currentPrsDonation() {
			return currentPrsDonation;
		},
		get toast() {
			return toast;
		},
		get prsToast() {
			return prsToast;
		},
		get donationPulse() {
			return donationPulse;
		},
		get activeChartMode() {
			return activeChartMode;
		},
		get todayJadwalShalat() {
			return todayJadwalShalat;
		},
		get currentTimeLabel() {
			return currentTimeLabel;
		},
		get currentDateLabel() {
			return currentDateLabel;
		},
		get chartCanvas() {
			return chartCanvas;
		},
		set chartCanvas(value: HTMLCanvasElement | undefined) {
			chartCanvas = value;
		},
		setStatus,
		createOrUpdateChart,
		showNextChart,
		updateCurrentTimeLabel,
		handleSocketPayload,
		cleanupLocalResources
	};
}

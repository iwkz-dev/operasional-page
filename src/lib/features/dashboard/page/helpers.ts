import {
	buildMonthDatasets,
	CHART_MODES,
	euroCompact,
	getMonthlyTotalsByLedger,
	renderMonthlyDonationChart
} from '$lib/features/dashboard';
import type {
	ChartMode,
	CurrentOperationalDonationProgress,
	DonationSocketPayload,
	MonthlyLedgerSeries,
	ToastDonation
} from '$lib/features/dashboard';
import { Chart } from 'chart.js/auto';

type MonthlySeriesCollections = {
	operationalMonthlyLedgerSeries: MonthlyLedgerSeries[];
	prsMonthlyLedgerSeries: MonthlyLedgerSeries[];
	jumatanMonthlyLedgerSeries: MonthlyLedgerSeries[];
};

const MONTHLY_SERIES_BY_MODE: Record<
	ChartMode,
	(series: MonthlySeriesCollections) => MonthlyLedgerSeries[]
> = {
	jumatan: (series) => series.jumatanMonthlyLedgerSeries,
	operational: (series) => series.operationalMonthlyLedgerSeries,
	prs: (series) => series.prsMonthlyLedgerSeries
};

export function getActiveMonthDatasets({
	mode,
	currentMonthIndex,
	currentMonthIncome,
	series
}: {
	mode: ChartMode;
	currentMonthIndex: number;
	currentMonthIncome: number | null;
	series: MonthlySeriesCollections;
}) {
	return buildMonthDatasets(
		MONTHLY_SERIES_BY_MODE[mode](series),
		currentMonthIndex,
		mode === 'operational' ? currentMonthIncome : undefined
	);
}

export function renderDashboardMonthlyChart({
	chart,
	canvas,
	labels,
	datasets
}: {
	chart: Chart<'bar' | 'line'> | null;
	canvas: HTMLCanvasElement | undefined;
	labels: string[];
	datasets: ReturnType<typeof buildMonthDatasets>;
}) {
	return renderMonthlyDonationChart({
		chart,
		canvas,
		labels,
		datasets,
		formatCompactValue: euroCompact
	});
}

export function getNextChartMode(activeChartMode: ChartMode) {
	const currentIndex = CHART_MODES.indexOf(activeChartMode);
	const nextIndex = (currentIndex + 1) % CHART_MODES.length;
	return CHART_MODES[nextIndex];
}

export function getProgressSnapshot(
	progress: CurrentOperationalDonationProgress | null | undefined,
	previousMonthIncome: number | null
) {
	const nextTotalIncome = Number((progress?.totalPrice ?? 0).toFixed(2));
	const hasFiniteProgress =
		progress?.totalPrice !== undefined && Number.isFinite(progress.totalPrice);

	return {
		totalIncome: nextTotalIncome,
		currentMonthIncome: hasFiniteProgress
			? Number(progress.totalPrice.toFixed(2))
			: previousMonthIncome
	};
}

export function createIncomeToast(amount: number): ToastDonation {
	return {
		id: Date.now(),
		amount
	};
}

export function getPrsDonationSnapshot(
	currentPrsDonation: number | null,
	nextPrsDonation: number,
	shouldNotify = true
) {
	const nextAmount = Number(nextPrsDonation.toFixed(2));
	const previousAmount = currentPrsDonation ?? 0;
	const prsDelta = Number((nextAmount - previousAmount).toFixed(2));

	return {
		currentPrsDonation: nextAmount,
		toast: shouldNotify && prsDelta > 0 ? createIncomeToast(prsDelta) : null
	};
}

export function getCurrentClockLabels(
	timeFormatter: Intl.DateTimeFormat,
	dateFormatter: Intl.DateTimeFormat
) {
	const now = new Date();

	return {
		currentTimeLabel: timeFormatter.format(now),
		currentDateLabel: dateFormatter.format(now)
	};
}

export function extractDashboardPayloadState(
	payload: DonationSocketPayload,
	currentMonthIndex: number
) {
	return {
		todayJadwalShalat: payload.todayJadwalShalat ?? null,
		nextPrsDonation: payload.finance?.currentPrsDonationProgress?.currentDonation,
		operationalMonthlyLedgerSeries: getMonthlyTotalsByLedger(
			payload.finance?.operationalMonthlyReport,
			currentMonthIndex
		),
		prsMonthlyLedgerSeries: getMonthlyTotalsByLedger(
			payload.finance?.prsMonthlyReport,
			currentMonthIndex
		),
		jumatanMonthlyLedgerSeries: getMonthlyTotalsByLedger(
			payload.finance?.shalatJumatDonationMonthlyReport,
			currentMonthIndex
		),
		operationalProgress: payload.finance?.currentOperationalDonationProgress
	};
}

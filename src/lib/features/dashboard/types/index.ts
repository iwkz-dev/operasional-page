export type ConnectionStatus = 'Connected' | 'Connecting...' | 'Disconnected';

export type Donation = {
	amount: number;
	name?: string;
	createdAt: number;
};

export type ToastDonation = {
	id: number;
	amount: number;
};

export type FinanceLedgerData = {
	ledgerId: number;
	total: number;
	ledgerName: string;
};

export type FinanceMonthlyData = {
	month: number;
	inflow?: {
		ledgerData?: FinanceLedgerData[];
	};
	outflow?: {
		ledgerData?: FinanceLedgerData[];
	};
};

export type FinanceDataMonthlyReport = {
	year?: number;
	monthlyData?: FinanceMonthlyData[];
};

export type MonthlyLedgerSeries = {
	flow: 'inflow' | 'outflow';
	ledgerId: number;
	ledgerName: string;
	values: number[];
};

export type MonthlyFlowDataset = {
	label: string;
	ledgerId: number;
	flow: 'inflow' | 'outflow';
	values: number[];
};

export type ChartMode = 'jumatan' | 'operational' | 'prs';

export const CHART_MODES: ChartMode[] = ['jumatan', 'operational', 'prs'];

export type CurrentOperationalDonationProgress = {
	totalOrder?: number;
	totalOrders?: number;
	totalPrice: number;
};

export type CurrentPrsDonationProgress = {
	currentDonation?: number;
};

export type JadwalShalat = {
	date: string;
	subuh: string;
	terbit: string;
	dzuhur: string;
	ashr: string;
	maghrib: string;
	isya: string;
	day: number;
	month: number;
	year: number;
	hijriahDate: number;
	hijriahMonth: string;
	hijriahYear: number;
};

export type DonationSocketPayload = {
	finance?: {
		operationalMonthlyReport?: FinanceDataMonthlyReport | null;
		prsMonthlyReport?: FinanceDataMonthlyReport | null;
		currentOperationalDonationProgress?: CurrentOperationalDonationProgress | null;
		currentPrsDonationProgress?: CurrentPrsDonationProgress | null;
		shalatJumatDonationMonthlyReport?: FinanceDataMonthlyReport | null;
	} | null;
	todayJadwalShalat?: JadwalShalat | null;
};

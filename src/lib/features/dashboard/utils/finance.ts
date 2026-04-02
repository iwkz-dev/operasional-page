import type { MonthlyLedgerSeries, OperationalMonthlyReport } from '../types';

export function createEmptyMonthlyTotals() {
	return Array.from({ length: 12 }, () => 0);
}

function normalizeLedgerName(name: unknown) {
	if (typeof name !== 'string') return 'Ledger Tanpa Nama';
	const trimmed = name.trim();
	return trimmed || 'Ledger Tanpa Nama';
}

export function toTimestamp(value: unknown) {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const parsed = Date.parse(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return Date.now();
}

export function getMonthlyTotalsByLedger(
	report: OperationalMonthlyReport | null | undefined,
	currentMonthIndex: number
) {
	const byFlowAndLedgerId = new Map<string, MonthlyLedgerSeries>();
	const ledgerNameById = new Map<number, string>();

	const registerLedgerValue = (
		flow: 'inflow' | 'outflow',
		ledgerId: number,
		ledgerName: string,
		monthIndex: number,
		total: number
	) => {
		const canonicalName = ledgerNameById.get(ledgerId) ?? ledgerName;
		ledgerNameById.set(ledgerId, canonicalName);

		const key = `${flow}::${ledgerId}`;
		const current = byFlowAndLedgerId.get(key) ?? {
			flow,
			ledgerId,
			ledgerName: canonicalName,
			values: createEmptyMonthlyTotals()
		};

		current.values[monthIndex] = Number(total.toFixed(2));
		byFlowAndLedgerId.set(key, current);
	};

	for (const monthData of report?.monthlyData ?? []) {
		const monthIndex = monthData.month - 1;
		if (monthIndex < 0 || monthIndex > currentMonthIndex) continue;

		for (const ledger of monthData.inflow?.ledgerData ?? []) {
			const ledgerName = normalizeLedgerName(ledger.ledgerName);
			registerLedgerValue('inflow', ledger.ledgerId, ledgerName, monthIndex, ledger.total);
		}

		for (const ledger of monthData.outflow?.ledgerData ?? []) {
			const ledgerName = normalizeLedgerName(ledger.ledgerName);
			registerLedgerValue('outflow', ledger.ledgerId, ledgerName, monthIndex, ledger.total);
		}
	}

	const series = Array.from(byFlowAndLedgerId.values());

	series.sort((a, b) => {
		if (a.flow !== b.flow) return a.flow === 'inflow' ? -1 : 1;

		const totalA = a.values.reduce((sum, value) => sum + Math.abs(value), 0);
		const totalB = b.values.reduce((sum, value) => sum + Math.abs(value), 0);
		return totalB - totalA;
	});

	return series;
}

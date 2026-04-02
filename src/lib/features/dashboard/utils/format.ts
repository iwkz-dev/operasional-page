const euroFormatter = new Intl.NumberFormat('de-DE', {
	style: 'currency',
	currency: 'EUR',
	minimumFractionDigits: 2
});

const euroCompactFormatter = new Intl.NumberFormat('de-DE', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 0,
	notation: 'compact'
});

const hourFormatter = new Intl.DateTimeFormat('id-ID', {
	hour: '2-digit',
	minute: '2-digit'
});

export function euro(amount: number) {
	return euroFormatter.format(amount);
}

export function euroCompact(amount: number) {
	return euroCompactFormatter.format(amount);
}

export function exactHourLabel(timestamp: number) {
	return hourFormatter.format(new Date(timestamp));
}

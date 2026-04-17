import {
	PUBLIC_SOCKET_EVENT_NAME,
	PUBLIC_SOCKET_TOKEN,
	PUBLIC_STRAPI_URL
} from '$env/static/public';

export const STRAPI_URL = PUBLIC_STRAPI_URL || 'http://api.iwkz.de/';
export const EVENT_NAME = PUBLIC_SOCKET_EVENT_NAME || 'info_iwkz';
export const SOCKET_TOKEN = PUBLIC_SOCKET_TOKEN || '';

export const CURRENT_YEAR = new Date().getFullYear();
export const CURRENT_MONTH_INDEX = new Date().getMonth();

export const CLOCK_TICK_INTERVAL_MS = 1000; // 1 second
export const CHART_CAROUSEL_INTERVAL_MS = 10000; // 10 seconds
export const DASHBOARD_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const DONATION_PULSE_DURATION_MS = 420; // 420ms for a quick pulse effect
export const DONATION_TOAST_DURATION_MS = 4200; // 4.2 seconds to allow the toast to be noticed without overstaying

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('id-ID', { month: 'short' });

export const CLOCK_TIME_FORMATTER = new Intl.DateTimeFormat('de-DE', {
	hour: '2-digit',
	minute: '2-digit',
	hour12: false
});

export const CLOCK_DATE_FORMATTER = new Intl.DateTimeFormat('de-DE', {
	weekday: 'short',
	day: '2-digit',
	month: '2-digit',
	year: 'numeric'
});

export const monthLabels = Array.from({ length: CURRENT_MONTH_INDEX + 1 }, (_, index) =>
	MONTH_LABEL_FORMATTER.format(new Date(CURRENT_YEAR, index, 1))
);

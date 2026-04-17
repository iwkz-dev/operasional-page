import { requestInitialDashboardUpdate } from '$lib/features/dashboard';
import type { ConnectionStatus, DonationSocketPayload } from '$lib/features/dashboard';
import {
	CHART_CAROUSEL_INTERVAL_MS,
	CLOCK_TICK_INTERVAL_MS,
	DASHBOARD_REFRESH_INTERVAL_MS
} from '$lib/features/dashboard/page/config';
import { io, type Socket } from 'socket.io-client';

type DashboardRealtimeOptions = {
	strapiUrl: string;
	socketToken: string;
	eventName: string;
	onStatusChange: (status: ConnectionStatus) => void;
	onPayload: (payload: DonationSocketPayload) => void;
	onClockTick: () => void;
	onChartRotate: () => void;
};

export type DashboardRealtimeController = DashboardRealtimeOptions & {
	socket: Socket | null;
	clockTimer: number | null;
	chartCarouselTimer: number | null;
	refreshTimer: number | null;
};

export async function requestDashboardRefresh(strapiUrl: string, socketToken: string) {
	try {
		await requestInitialDashboardUpdate({
			strapiUrl,
			socketToken
		});
	} catch (error) {
		console.error('Failed to request dashboard refresh', error);
	}
}

export function createDashboardRealtimeController(
	options: DashboardRealtimeOptions
): DashboardRealtimeController {
	return {
		...options,
		socket: null,
		clockTimer: null,
		chartCarouselTimer: null,
		refreshTimer: null
	};
}

export function startDashboardRealtime(controller: DashboardRealtimeController) {
	controller.onClockTick();
	controller.clockTimer = window.setInterval(controller.onClockTick, CLOCK_TICK_INTERVAL_MS);
	controller.chartCarouselTimer = window.setInterval(
		controller.onChartRotate,
		CHART_CAROUSEL_INTERVAL_MS
	);
	controller.refreshTimer = window.setInterval(() => {
		void requestDashboardRefresh(controller.strapiUrl, controller.socketToken);
	}, DASHBOARD_REFRESH_INTERVAL_MS);

	controller.socket = io(controller.strapiUrl, {
		auth: {
			token: controller.socketToken
		}
	});

	controller.socket.on('connect', () => {
		controller.onStatusChange('Connected');
		void requestDashboardRefresh(controller.strapiUrl, controller.socketToken);
	});

	controller.socket.on('disconnect', () => {
		controller.onStatusChange('Disconnected');
	});

	controller.socket.on(controller.eventName, controller.onPayload);
}

export function stopDashboardRealtime(controller: DashboardRealtimeController) {
	controller.socket?.disconnect();
	controller.socket = null;

	if (controller.clockTimer) {
		clearInterval(controller.clockTimer);
		controller.clockTimer = null;
	}

	if (controller.chartCarouselTimer) {
		clearInterval(controller.chartCarouselTimer);
		controller.chartCarouselTimer = null;
	}

	if (controller.refreshTimer) {
		clearInterval(controller.refreshTimer);
		controller.refreshTimer = null;
	}

	controller.onStatusChange('Disconnected');
}

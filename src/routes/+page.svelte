<script lang="ts">
	import { onMount } from 'svelte';
	import ChartCard from '$lib/components/ChartCard.svelte';
	import DonationToast from '$lib/components/DonationToast.svelte';
	import { DASHBOARD_LANG } from '$lib/features/dashboard/lang';
	import PrayerTimesWidget from '$lib/components/PrayerTimesWidget.svelte';
	import KpiCard from '$lib/components/KpiCard.svelte';
	import Header from '$lib/components/Header.svelte';
	import { EVENT_NAME, SOCKET_TOKEN, STRAPI_URL } from '$lib/features/dashboard/page/config';
	import { createDashboardPageController } from '$lib/features/dashboard/page/controller.svelte';
	import {
		createDashboardRealtimeController,
		startDashboardRealtime,
		stopDashboardRealtime
	} from '$lib/features/dashboard/page/realtime';

	const dashboard = createDashboardPageController();

	onMount(() => {
		dashboard.updateCurrentTimeLabel();

		if (!dashboard.chartCanvas) {
			dashboard.setStatus('Disconnected');
			return dashboard.cleanupLocalResources;
		}

		dashboard.createOrUpdateChart();

		const realtimeController = createDashboardRealtimeController({
			strapiUrl: STRAPI_URL,
			socketToken: SOCKET_TOKEN,
			eventName: EVENT_NAME,
			onStatusChange: dashboard.setStatus,
			onPayload: dashboard.handleSocketPayload,
			onClockTick: dashboard.updateCurrentTimeLabel,
			onChartRotate: dashboard.showNextChart
		});

		startDashboardRealtime(realtimeController);

		return () => {
			stopDashboardRealtime(realtimeController);
			dashboard.cleanupLocalResources();
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
	<Header status={dashboard.status} />

	<!-- Left column: KPI row + chart -->
	<section class="flex min-h-0 flex-col gap-3 sm:gap-4">
		<!-- KPI cards -->
		<KpiCard
			totalIncome={dashboard.totalIncome}
			currentPrsDonation={dashboard.currentPrsDonation}
		/>

		<!-- Chart card -->
		<ChartCard
			bind:chartCanvas={dashboard.chartCanvas}
			donationPulse={dashboard.donationPulse}
			activeChartMode={dashboard.activeChartMode}
		/>
	</section>

	<!-- Right column: prayer + QR — stacks below chart on mobile -->
	<PrayerTimesWidget
		jadwalShalat={dashboard.todayJadwalShalat}
		timeLabel={dashboard.currentTimeLabel}
		dateLabel={dashboard.currentDateLabel}
	/>

	<!-- Toasts -->
	{#if dashboard.toast}
		<DonationToast
			amount={dashboard.toast.amount}
			message={DASHBOARD_LANG.toasts.operational.message}
			variant="operational"
		/>
	{/if}

	{#if dashboard.prsToast}
		<DonationToast
			amount={dashboard.prsToast.amount}
			message={DASHBOARD_LANG.toasts.prs.message}
			variant="prs"
		/>
	{/if}
</main>

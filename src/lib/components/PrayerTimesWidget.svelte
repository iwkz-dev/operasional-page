<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';
	import { DASHBOARD_LANG } from '$lib/features/dashboard/lang';
	import type { JadwalShalat } from '$lib/features/dashboard';

	type Props = {
		jadwalShalat: JadwalShalat | null;
		timeLabel: string;
		dateLabel: string;
	};

	let { jadwalShalat, timeLabel, dateLabel }: Props = $props();

	const PRAYER_ROWS: { label: { original: string; sub: string }; key: keyof JadwalShalat }[] =
		DASHBOARD_LANG.prayerWidget.prayerRows;

	const DONATION_LINKS = DASHBOARD_LANG.prayerWidget.donationLinks;

	const QR_OPTIONS: QRCode.QRCodeToDataURLOptions = {
		margin: 1,
		width: 160,
		color: { dark: '#14532d', light: '#f0fdf4' }
	};

	let qrDataUrls = $state<Record<string, string>>({});

	onMount(() => {
		for (const link of DONATION_LINKS) {
			QRCode.toDataURL(link.url, QR_OPTIONS).then((dataUrl) => {
				qrDataUrls = { ...qrDataUrls, [link.url]: dataUrl };
			});
		}
	});
</script>

{#if jadwalShalat}
	<aside
		class="flex w-full flex-col gap-3 self-start sm:flex-row sm:gap-3 lg:flex-col lg:overflow-y-auto"
	>
		<!-- Clock + Prayer Times -->
		<div
			class="flex-1 rounded-2xl border border-green-100 bg-white/80 p-3.5 shadow-sm backdrop-blur-sm sm:p-4"
		>
			<div class="mb-2.5 flex items-baseline justify-between">
				<p class="text-[0.6rem] font-bold tracking-[0.14em] text-green-600 uppercase select-none">
					{DASHBOARD_LANG.prayerWidget.scheduleTitle.original} /
					{DASHBOARD_LANG.prayerWidget.scheduleTitle.sub}
				</p>
				<p class="text-[0.58rem] font-medium text-green-800/45">{dateLabel}</p>
			</div>

			<p
				class="mb-3 text-center text-[1.75rem] leading-none font-extrabold tracking-tight text-green-950 sm:text-[2rem]"
			>
				{timeLabel}
			</p>

			<div class="grid grid-cols-3 gap-1.5 sm:gap-2">
				{#each PRAYER_ROWS as { label, key } (key)}
					<div class="flex flex-col items-center rounded-xl bg-green-50/60 px-1 py-1.5 sm:py-2">
						<span class="text-[0.52rem] font-semibold text-green-700/50 uppercase sm:text-[0.58rem]"
							>{label.original}</span
						>
						<span
							class="mt-0.5 text-[0.82rem] leading-none font-bold text-green-950 sm:text-[0.92rem]"
							>{jadwalShalat[key]}</span
						>
					</div>
				{/each}
			</div>
		</div>

		<!-- Donation QR Codes -->
		<div
			class="flex-1 rounded-2xl border border-green-100 bg-white/80 p-3.5 shadow-sm backdrop-blur-sm sm:p-4"
		>
			<p
				class="mb-2.5 text-[0.6rem] font-bold tracking-[0.14em] text-green-600 uppercase select-none"
			>
				{DASHBOARD_LANG.prayerWidget.donationTitle.original} /
				{DASHBOARD_LANG.prayerWidget.donationTitle.sub}
			</p>

			<div class="flex flex-col gap-3">
				{#each DONATION_LINKS as { title, url, displayUrl } (url)}
					<div class="flex items-center gap-3">
						<div class="shrink-0">
							{#if qrDataUrls[url]}
								<img
									src={qrDataUrls[url]}
									alt={`QR ${title.original}`}
									class="size-16 rounded-lg sm:size-18"
								/>
							{:else}
								<div
									class="flex size-16 items-center justify-center rounded-lg bg-green-50/60 sm:size-18"
								>
									<span class="text-[0.5rem] text-green-700/35">...</span>
								</div>
							{/if}
						</div>
						<div class="min-w-0">
							<p class="text-[0.72rem] leading-tight font-bold text-green-950 sm:text-[0.78rem]">
								{title.original}
							</p>
							<p
								class="mt-0.5 text-[0.62rem] leading-snug font-medium text-emerald-600/70 sm:text-[0.66rem]"
							>
								{displayUrl}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</aside>
{/if}

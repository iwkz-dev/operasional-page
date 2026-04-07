<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';
	import type { JadwalShalat } from '$lib/features/dashboard';

	type Props = {
		jadwalShalat: JadwalShalat | null;
		timeLabel: string;
		dateLabel: string;
	};

	let { jadwalShalat, timeLabel, dateLabel }: Props = $props();

	const PRAYER_ROWS: { label: string; key: keyof JadwalShalat }[] = [
		{ label: 'Subuh', key: 'subuh' },
		{ label: 'Terbit', key: 'terbit' },
		{ label: 'Zuhur', key: 'dzuhur' },
		{ label: 'Asar', key: 'ashr' },
		{ label: 'Maghrib', key: 'maghrib' },
		{ label: 'Isya', key: 'isya' }
	];

	const DONATION_LINKS = [
		{
			title: 'Operasional',
			url: 'https://donasi.iwkz.de/operasional',
			displayUrl: 'donasi.iwkz.de/operasional'
		},
		{
			title: 'Proyek Rumah Surga (PRS)',
			url: 'https://donasi.iwkz.de/prs',
			displayUrl: 'donasi.iwkz.de/prs'
		}
	];

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
	<aside class="flex w-full flex-col gap-3 self-start">
		<!-- Clock + Prayer Times -->
		<div
			class="rounded-2xl border border-green-600/12 bg-white/85 p-4 shadow-[0_8px_24px_rgba(22,101,52,0.10)] backdrop-blur-lg"
		>
			<div class="mb-3 flex items-baseline justify-between">
				<p
					class="text-[0.65rem] font-bold tracking-[0.14em] text-green-700/80 uppercase select-none"
				>
					Waktu Shalat
				</p>
				<p class="text-[0.65rem] font-medium text-green-900/50">{dateLabel}</p>
			</div>

			<p
				class="mb-4 text-center text-[2rem] leading-none font-extrabold tracking-tight text-green-950"
			>
				{timeLabel}
			</p>

			<div class="grid grid-cols-3 gap-2">
				{#each PRAYER_ROWS as { label, key } (key)}
					<div
						class="flex flex-col items-center rounded-lg bg-green-50/70 px-1 py-2 transition-colors"
					>
						<span class="text-[0.6rem] font-medium text-green-800/60 uppercase">{label}</span>
						<span class="mt-0.5 text-[0.92rem] leading-none font-bold text-green-950"
							>{jadwalShalat[key]}</span
						>
					</div>
				{/each}
			</div>
		</div>

		<!-- Donation QR Codes -->
		<div
			class="rounded-2xl border border-green-600/12 bg-white/85 p-4 shadow-[0_8px_24px_rgba(22,101,52,0.10)] backdrop-blur-lg"
		>
			<p
				class="mb-3 text-[0.65rem] font-bold tracking-[0.14em] text-green-700/80 uppercase select-none"
			>
				Donasi / Spenden
			</p>

			<div class="flex flex-col gap-4">
				{#each DONATION_LINKS as { title, url, displayUrl } (url)}
					<div class="flex items-center gap-3">
						<div class="shrink-0">
							{#if qrDataUrls[url]}
								<img src={qrDataUrls[url]} alt="QR {title}" class="size-20 rounded-lg" />
							{:else}
								<div class="flex size-20 items-center justify-center rounded-lg bg-green-50/80">
									<span class="text-[0.55rem] text-green-800/40">...</span>
								</div>
							{/if}
						</div>
						<div class="min-w-0">
							<p class="text-[0.78rem] leading-tight font-bold text-green-950">
								{title}
							</p>
							<p class="mt-1 text-[0.68rem] leading-snug font-medium text-emerald-700/80">
								{displayUrl}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</aside>
{/if}

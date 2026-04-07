<script lang="ts">
	import type { JadwalShalat } from '$lib/features/dashboard';
	import ArrowUpRightIcon from '$lib/components/icons/ArrowUpRightIcon.svelte';
	import HeartOutlineIcon from '$lib/components/icons/HeartOutlineIcon.svelte';

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
		{ icon: ArrowUpRightIcon, title: 'Operasional', url: 'donasi.iwkz.de/operasional' },
		{ icon: HeartOutlineIcon, title: 'Proyek Rumah Surga (PRS)', url: 'donasi.iwkz.de/prs' }
	];
</script>

<div
	class="fixed right-2 bottom-2 z-20 flex w-52 flex-col items-center justify-center rounded-xl border border-green-600/25 bg-white/90 p-3 text-center shadow-[0_14px_28px_rgba(21,128,61,0.22)] sm:right-3 sm:bottom-3 sm:w-60 sm:p-3.5"
>
	{#if jadwalShalat}
		<p class="mb-1.5 text-[0.82rem] font-bold tracking-wide text-green-800 uppercase">
			Waktu Shalat
		</p>
		<p class="mb-2 text-[1.1rem] leading-none font-extrabold tracking-[0.02em] text-green-950">
			{timeLabel}
		</p>
		<p class="mb-2.5 text-[0.72rem] font-semibold tracking-wide text-green-900/70">
			{dateLabel}
		</p>

		<div class="mb-2.5 grid w-full grid-cols-2 gap-x-2 gap-y-1 text-left">
			{#each PRAYER_ROWS as { label, key } (key)}
				<span class="text-[0.82rem] text-green-900/65">{label}</span>
				<span class="text-right text-[0.82rem] font-semibold">{jadwalShalat[key]}</span>
			{/each}
		</div>

		<hr class="mb-2 w-full border-green-600/20" />

		<div class="w-full text-left">
			<p class="text-[0.7rem] font-semibold text-green-900/70">Link donasi</p>
			{#each DONATION_LINKS as { icon: Icon, title, url } (url)}
				<div class="mt-1 flex items-start gap-1.5 text-[0.72rem] text-green-950">
					<Icon class="h-3.5 w-3.5 shrink-0 text-emerald-700" />
					<div class="leading-tight">
						<p class="font-bold">{title}</p>
						<p class="mt-0.5">{url}</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

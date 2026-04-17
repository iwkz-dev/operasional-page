<script lang="ts">
	import { euro, euroSimple } from '$lib/features/dashboard';

	const PRS_DONATION_TARGET = 1000000;

	type Props = {
		totalIncome: number;
		currentPrsDonation: number | null;
	};

	let { totalIncome, currentPrsDonation }: Props = $props();
</script>

<div class="grid grid-cols-2 gap-2.5 sm:gap-3">
	<div
		class="rounded-2xl border border-emerald-100 bg-white/80 px-3.5 py-3 shadow-sm backdrop-blur-sm sm:px-4 sm:py-3.5"
	>
		<p class="mb-1 text-[0.58rem] font-bold tracking-widest text-emerald-600 uppercase">
			Operasional
		</p>
		<p
			class="text-[clamp(1.1rem,2.5vw,1.5rem)] leading-none font-extrabold tracking-tight text-emerald-950"
		>
			{euro(totalIncome)}
		</p>
		<p class="mt-1 text-[0.58rem] font-medium text-emerald-700/60">
			Bulan ini &middot; Diesen Monat
		</p>
	</div>
	<div
		class="rounded-2xl border border-green-100 bg-white/80 px-3.5 py-3 shadow-sm backdrop-blur-sm sm:px-4 sm:py-3.5"
	>
		<p class="mb-1 text-[0.58rem] font-bold tracking-widest text-green-600 uppercase">PRS</p>
		<p
			class="text-[clamp(1rem,2.5vw,1.35rem)] leading-none font-extrabold tracking-tight text-green-950"
		>
			{#if currentPrsDonation !== null}
				{euroSimple(currentPrsDonation)}
			{:else}
				&ndash;
			{/if}
			<span class="text-[0.55em] font-semibold text-green-700/60"
				>/ {euroSimple(PRS_DONATION_TARGET)}</span
			>
		</p>
		<p class="mt-1 text-[0.58rem] font-medium text-green-700/60">Aktuelle PRS-Spende</p>
	</div>
</div>

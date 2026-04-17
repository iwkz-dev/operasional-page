<script lang="ts">
	import { DASHBOARD_LANG } from '$lib/features/dashboard/lang';
	import type { ChartMode } from '$lib/features/dashboard';

	type Props = {
		chartCanvas: HTMLCanvasElement | undefined;
		donationPulse: boolean;
		activeChartMode: ChartMode;
	};

	let { chartCanvas = $bindable(), donationPulse, activeChartMode }: Props = $props();

	const activeChartCopy = $derived(DASHBOARD_LANG.chartModes[activeChartMode]);
</script>

<article
	class="flex min-h-0 flex-1 flex-col rounded-2xl border border-green-100 bg-white/80 shadow-sm backdrop-blur-sm transition-transform duration-300 {donationPulse
		? 'scale-[1.005]'
		: 'scale-100'}"
>
	<div class="flex items-baseline justify-between gap-2 px-4 pt-3.5 pb-1 sm:pt-4">
		<div>
			<h3 class="text-[0.88rem] font-bold tracking-tight sm:text-[0.95rem]">
				{activeChartCopy.title.original}
			</h3>
			<p class="mt-0.5 text-[0.62rem] text-green-800/55">{activeChartCopy.title.sub}</p>
		</div>
	</div>
	<div class="min-h-0 flex-1 px-3 pb-3 sm:px-4 sm:pb-4">
		<div class="h-full min-h-55 w-full sm:min-h-70">
			<canvas
				class="h-full w-full"
				bind:this={chartCanvas}
				aria-label={activeChartCopy.ariaLabel.original}
			></canvas>
		</div>
	</div>
</article>

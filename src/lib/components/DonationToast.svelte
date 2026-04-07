<script lang="ts">
	import { euro } from '$lib/features/dashboard';

	type Props = {
		amount: number;
		title: string;
		subtitle: string;
		variant?: 'operational' | 'prs';
	};

	let { amount, title, subtitle, variant = 'operational' }: Props = $props();

	const variantStyles = {
		operational:
			'top-2.5 bg-green-700/95 text-green-50 shadow-[0_14px_32px_rgba(20,83,45,0.42)] sm:top-4',
		prs: 'top-[4.9rem] bg-emerald-800/95 text-emerald-50 shadow-[0_14px_32px_rgba(6,95,70,0.42)] sm:top-[5.6rem]'
	};
</script>

<div
	class="fixed left-1/2 z-20 w-[min(92vw,520px)] -translate-x-1/2 rounded-xl px-3 py-2.5 text-center motion-safe:animate-pulse sm:px-4 sm:py-3 {variantStyles[
		variant
	]}"
	role="status"
	aria-live="polite"
>
	<p class="mb-1 text-2xl leading-none font-extrabold">+ {euro(amount)}</p>
	<p class="text-[1rem] font-bold">{title}</p>
	<p class="mt-1 text-[0.8rem] opacity-90">{subtitle}</p>
</div>

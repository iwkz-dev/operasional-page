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
			'top-3 bg-emerald-600 text-white shadow-[0_12px_40px_rgba(16,185,129,0.35)] sm:top-4',
		prs: 'top-[4.5rem] bg-green-700 text-white shadow-[0_12px_40px_rgba(22,163,74,0.35)] sm:top-[5.2rem]'
	};
</script>

<div
	class="fixed left-1/2 z-30 w-[min(90vw,420px)] -translate-x-1/2 rounded-2xl px-4 py-3 text-center backdrop-blur-sm sm:px-5 sm:py-3.5 {variantStyles[
		variant
	]}"
	role="status"
	aria-live="polite"
>
	<p class="text-[1.5rem] leading-none font-extrabold tracking-tight sm:text-[1.75rem]">
		+ {euro(amount)}
	</p>
	<p class="mt-1.5 text-[0.82rem] font-semibold opacity-95">{title}</p>
	<p class="mt-0.5 text-[0.68rem] font-medium opacity-75">{subtitle}</p>
</div>

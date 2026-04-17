<script lang="ts">
	import iwkzLogo from '$lib/assets/iwkz-logo.png';
	import { DASHBOARD_LANG } from '$lib/features/dashboard/lang';

	type Props = {
		status: 'Connecting...' | 'Connected' | 'Disconnected';
	};

	let { status }: Props = $props();

	const statusCopy = $derived(DASHBOARD_LANG.header.status[status]);
</script>

<header class="flex items-center justify-between gap-3 lg:col-span-2">
	<div class="flex items-center gap-2.5">
		<img src={iwkzLogo} alt="IWKZ logo" class="h-8 w-auto rounded-lg sm:h-9" loading="eager" />
		<div class="leading-tight">
			<p class="text-[0.92rem] font-extrabold tracking-tight sm:text-[1.05rem]">
				{DASHBOARD_LANG.header.brand.original}
			</p>
			<p class="text-[0.62rem] font-medium text-green-800/60">
				{DASHBOARD_LANG.header.brand.sub}
			</p>
		</div>
	</div>
	<div
		class="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold {status ===
		'Connected'
			? 'border-emerald-200 bg-emerald-50 text-emerald-700'
			: status === 'Connecting...'
				? 'border-yellow-200 bg-yellow-50 text-yellow-700'
				: 'border-green-200 bg-white text-green-600'}"
	>
		<span
			class="inline-block size-1.5 rounded-full {status === 'Connected'
				? 'bg-emerald-500'
				: status === 'Connecting...'
					? 'bg-yellow-500'
					: 'bg-green-400'}"
		></span>
		{statusCopy.sub}
	</div>
</header>

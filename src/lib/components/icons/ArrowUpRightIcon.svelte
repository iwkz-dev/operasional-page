<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<svg
	class={className}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.8"
	aria-hidden="true"
>
	<path stroke-linecap="round" stroke-linejoin="round" d="M7 7h10v10M7 17 17 7" />
</svg>

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
	<path
		stroke-linecap="round"
		stroke-linejoin="round"
		d="M12 21s-6.7-4.4-9-8.1C1.4 10.4 2 7 4.9 5.5 7 4.4 9.1 5 10.5 6.5L12 8l1.5-1.5C14.9 5 17 4.4 19.1 5.5 22 7 22.6 10.4 21 12.9 18.7 16.6 12 21 12 21Z"
	/>
</svg>

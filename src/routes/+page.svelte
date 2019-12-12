<script lang="ts">
	import { onMount } from 'svelte';
	import { io } from 'socket.io-client';
	import Chart from 'chart.js/auto';
	import type { Chart as ChartInstance } from 'chart.js';
	import QRCode from 'qrcode';

	const STRAPI_URL = 'http://localhost:1337/';
	const EVENT_NAME = 'info_iwkz';
	const DONATION_URL = 'https://paypal.me/your-link';

	type ConnectionStatus = 'Connected' | 'Connecting...' | 'Disconnected';

	type Donation = {
		amount: number;
		name?: string;
	};

	let status = $state<ConnectionStatus>('Connecting...');
	let donations = $state<Donation[]>([]);
	let totalIncome = $state(0);
	let totalOutcome = $state(0);

	let canvas: HTMLCanvasElement | undefined;
	let qrCanvas: HTMLCanvasElement | undefined;
	let chart: ChartInstance<'bar', number[], string> | undefined;

	function updateChart() {
		if (!chart) return;

		chart.data.datasets[0].data = [totalIncome, totalOutcome];
		chart.update();
	}

	onMount(() => {
		if (!canvas || !qrCanvas) {
			status = 'Disconnected';
			return;
		}

		void QRCode.toCanvas(qrCanvas, DONATION_URL, {
			margin: 1,
			width: 220
		});

		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: ['Income', 'Outcome'],
				datasets: [
					{
						label: 'Balance',
						data: [totalIncome, totalOutcome],
						backgroundColor: ['#15803d', '#b91c1c'],
						borderRadius: 10
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false
			}
		});

		const socket = io(STRAPI_URL, {
			auth: {
				token:
					''
			}
		});

		socket.on('connect', () => {
			status = 'Connected';
		});

		socket.on('disconnect', () => {
			status = 'Disconnected';
		});

		socket.on(EVENT_NAME, (payload: Partial<Donation>) => {
			console.log('Received donation event:', payload);
			const donation: Donation = {
				amount: Number(payload.amount ?? 0),
				name: payload.name?.trim() || 'Anonymous'
			};

			donations = [donation, ...donations].slice(0, 20);
			totalIncome += donation.amount;
			updateChart();
		});

		updateChart();

		return () => {
			socket.disconnect();
			chart?.destroy();
			chart = undefined;
			status = 'Disconnected';
		};
	});
</script>

<svelte:head>
	<title>Donation Dashboard</title>
	<meta
		name="description"
		content="Live donation dashboard with QR code, balance chart, and recent donation activity."
	/>
</svelte:head>

<div class="container">
	<header class="hero">
		<div>
			<p class="eyebrow">IWKZ Operasional</p>
			<h1>Donation Dashboard</h1>
			<p class="summary">
				Monitor live donation activity and share a quick payment link on one screen.
			</p>
		</div>
		<div class:online={status === 'Connected'} class="status-pill">{status}</div>
	</header>

	<section class="grid">
		<div class="card donate-card">
			<h2>Donate</h2>
			<p>Scan the QR code to open the payment link.</p>
			<canvas bind:this={qrCanvas}></canvas>
		</div>

		<div class="card totals-card">
			<h2>Totals</h2>
			<div class="totals">
				<div>
					<span>Income</span>
					<strong>{totalIncome}</strong>
				</div>
				<div>
					<span>Outcome</span>
					<strong>{totalOutcome}</strong>
				</div>
			</div>
			<div class="chart-wrap">
				<canvas bind:this={canvas}></canvas>
			</div>
		</div>

		<div class="card donations-card">
			<h2>Live Donations</h2>
			{#if donations.length === 0}
				<p class="empty">Waiting for incoming donations.</p>
			{:else}
				<div class="donation-list">
					{#each donations as donation, index (index)}
						<div class="donation">
							<div>
								<strong>{donation.name ?? 'Anonymous'}</strong>
								<span>Recent contribution</span>
							</div>
							<strong>{donation.amount}</strong>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>

<style>
	:global(body) {
		margin: 0;
		background:
			radial-gradient(circle at top, rgba(34, 197, 94, 0.18), transparent 32%),
			linear-gradient(180deg, #f8fafc 0%, #ecfccb 100%);
		color: #0f172a;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	}

	.container {
		max-width: 1120px;
		margin: 0 auto;
		padding: 48px 20px 80px;
	}

	.hero {
		display: flex;
		justify-content: space-between;
		gap: 24px;
		align-items: start;
		margin-bottom: 28px;
	}

	.eyebrow {
		margin: 0 0 12px;
		color: #166534;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	h1,
	h2,
	p {
		margin-top: 0;
	}

	h1 {
		margin-bottom: 12px;
		font-size: clamp(2.4rem, 5vw, 4.5rem);
		line-height: 0.95;
	}

	.summary {
		max-width: 56ch;
		color: #334155;
		font-size: 1.05rem;
	}

	.status-pill {
		padding: 10px 16px;
		border: 1px solid rgba(15, 23, 42, 0.08);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.75);
		font-weight: 700;
		box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
	}

	.status-pill.online {
		color: #166534;
		background: rgba(220, 252, 231, 0.92);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 20px;
	}

	.card {
		padding: 24px;
		border: 1px solid rgba(255, 255, 255, 0.7);
		border-radius: 24px;
		background: rgba(255, 255, 255, 0.78);
		backdrop-filter: blur(18px);
		box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
	}

	.donate-card {
		grid-column: span 4;
		text-align: center;
	}

	.totals-card {
		grid-column: span 8;
	}

	.donations-card {
		grid-column: 1 / -1;
	}

	.totals {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16px;
		margin: 16px 0 20px;
	}

	.totals span,
	.donation span {
		display: block;
		color: #64748b;
		font-size: 0.9rem;
	}

	.totals strong,
	.donation strong {
		font-size: 1.5rem;
	}

	.chart-wrap {
		height: 280px;
	}

	.donation-list {
		display: grid;
		gap: 12px;
	}

	.donation {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		padding: 16px 18px;
		border-radius: 18px;
		background: rgba(248, 250, 252, 0.9);
	}

	.empty {
		color: #64748b;
	}

	canvas {
		max-width: 100%;
	}

	@media (max-width: 900px) {
		.hero {
			flex-direction: column;
		}

		.donate-card,
		.totals-card,
		.donations-card {
			grid-column: 1 / -1;
		}
	}

	@media (max-width: 640px) {
		.container {
			padding-top: 32px;
		}

		.card {
			padding: 20px;
		}

		.totals {
			grid-template-columns: 1fr;
		}

		.donation {
			align-items: start;
			flex-direction: column;
		}
	}
</style>

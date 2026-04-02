import {
	BarController,
	BarElement,
	CategoryScale,
	Chart,
	type ChartConfiguration,
	type ChartDataset,
	LineController,
	LineElement,
	LinearScale,
	PointElement,
	Tooltip
} from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

type RenderMonthlyDonationChartOptions = {
	chart: Chart<'bar' | 'line'> | null;
	canvas: HTMLCanvasElement | undefined;
	labels: string[];
	datasets: {
		label: string;
		flow: 'inflow' | 'outflow';
		values: number[];
	}[];
	formatCompactValue: (value: number) => string;
};

let isRegistered = false;

function chartStep(maxValue: number) {
	if (maxValue <= 500) return 100;
	if (maxValue <= 2000) return 250;
	return 500;
}

function chartMax(maxValue: number) {
	const step = chartStep(maxValue);
	return Math.max(500, Math.ceil(maxValue / step) * step);
}

function chartMin(minValue: number) {
	if (minValue >= 0) return 0;
	const step = chartStep(Math.abs(minValue));
	return Math.min(-500, -Math.ceil(Math.abs(minValue) / step) * step);
}

function createScales(
	yMin: number,
	yMax: number,
	yStep: number,
	formatCompactValue: (value: number) => string
) {
	return {
		x: {
			stacked: false,
			grid: {
				display: false
			},
			ticks: {
				color: 'rgba(6, 95, 70, 0.8)',
				font: {
					weight: 'bold' as const,
					size: 11
				}
			}
		},
		y: {
			stacked: false,
			min: yMin,
			max: yMax,
			ticks: {
				stepSize: yStep,
				color: 'rgba(6, 95, 70, 0.7)',
				font: {
					size: 10,
					weight: 'bold' as const
				},
				callback: (value: string | number) => formatCompactValue(Number(value))
			},
			grid: {
				color: 'rgba(16, 185, 129, 0.15)'
			}
		}
	};
}

export function registerMonthlyDonationChart() {
	if (isRegistered) return;

	Chart.register(
		CategoryScale,
		LinearScale,
		BarController,
		BarElement,
		LineController,
		LineElement,
		PointElement,
		Tooltip,
		ChartDataLabels
	);
	isRegistered = true;
}

export function renderMonthlyDonationChart({
	chart,
	canvas,
	labels,
	datasets,
	formatCompactValue
}: RenderMonthlyDonationChartOptions): Chart<'bar' | 'line'> | null {
	if (!canvas) return chart;
	const inflowSeries = datasets.find((dataset) => dataset.flow === 'inflow');
	const outflowSeries = datasets.find((dataset) => dataset.flow === 'outflow');
	const inflowValues = (inflowSeries?.values ?? []).map((value) => Math.abs(value));
	const outflowValues = (outflowSeries?.values ?? []).map((value) => Math.abs(value));
	const monthlyDifference = inflowValues.map((inflowValue, index) => {
		const outflowValue = outflowValues[index] ?? 0;
		return Number((inflowValue - outflowValue).toFixed(2));
	});

	const allValues = [...inflowValues, ...outflowValues, ...monthlyDifference];
	const maxValue = Math.max(...allValues, 0);
	const minValue = Math.min(...allValues, 0);
	const yMax = chartMax(maxValue);
	const yMin = chartMin(minValue);
	const yStep = chartStep(Math.max(Math.abs(yMax), Math.abs(yMin)));

	const chartDatasets: ChartDataset<'bar' | 'line', number[]>[] = [
		{
			label: inflowSeries?.label ?? 'Inflow',
			data: inflowValues,
			backgroundColor: 'rgba(16, 185, 129, 0.78)',
			borderColor: 'rgba(5, 150, 105, 0.95)',
			borderWidth: 1,
			borderRadius: 8,
			barThickness: 'flex',
			barPercentage: 0.9,
			categoryPercentage: 0.7,
			order: 10
		},
		{
			label: outflowSeries?.label ?? 'Outflow',
			data: outflowValues,
			backgroundColor: 'rgba(239, 68, 68, 0.72)',
			borderColor: 'rgba(220, 38, 38, 0.95)',
			borderWidth: 1,
			borderRadius: 8,
			barThickness: 'flex',
			barPercentage: 0.9,
			categoryPercentage: 0.7,
			order: 10
		},
		{
			type: 'line',
			label: 'Difference (Inflow - Outflow)',
			data: monthlyDifference,
			borderColor: 'rgba(15, 23, 42, 0.95)',
			backgroundColor: 'rgba(15, 23, 42, 0.3)',
			pointBackgroundColor: 'rgba(15, 23, 42, 0.95)',
			pointBorderColor: 'rgba(255, 255, 255, 0.95)',
			pointBorderWidth: 1.5,
			pointRadius: 3,
			pointHoverRadius: 5,
			borderWidth: 2,
			tension: 0,
			fill: false,
			order: -10
		}
	];

	if (!chart) {
		const config: ChartConfiguration<'bar' | 'line'> = {
			type: 'bar',
			data: {
				labels,
				datasets: chartDatasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				layout: {
					padding: {
						top: 14,
						right: 6,
						left: 4,
						bottom: 2
					}
				},
				animation: {
					duration: 750,
					easing: 'easeOutCubic'
				},
				plugins: {
					legend: {
						display: true,
						position: 'bottom',
						labels: {
							boxWidth: 11,
							boxHeight: 11,
							padding: 14,
							color: 'rgba(6, 95, 70, 0.85)',
							font: {
								size: 11,
								weight: 'bold' as const
							}
						}
					},
					tooltip: {
						enabled: true,
						callbacks: {
							label: (context) =>
								`${context.dataset.label}: ${formatCompactValue(Number(context.raw))}`
						}
					},
					datalabels: {
						display: true,
						formatter: (value: unknown, context) => {
							const numericValue = Number(value ?? 0);
							if (!Number.isFinite(numericValue)) return '';
							if (Math.abs(numericValue) < 0.005) return '';

							if (context.dataset.type === 'line') {
								const sign = numericValue > 0 ? '+' : '';
								return `${sign}${formatCompactValue(numericValue)}`;
							}

							return formatCompactValue(numericValue);
						},
						color: (context) =>
							context.dataset.type === 'line' ? 'rgba(15, 23, 42, 0.98)' : 'rgba(6, 78, 59, 0.95)',
						font: {
							size: 10,
							weight: 'bold' as const
						},
						anchor: (context) => (context.dataset.type === 'line' ? 'end' : 'end'),
						align: (context) => (context.dataset.type === 'line' ? 'top' : 'top'),
						offset: (context) => (context.dataset.type === 'line' ? 6 : 2),
						clamp: true,
						clip: false,
						textStrokeColor: 'rgba(255,255,255,0.9)',
						textStrokeWidth: 2
					}
				},
				scales: createScales(yMin, yMax, yStep, formatCompactValue)
			}
		};

		return new Chart<'bar' | 'line'>(canvas, config);
	}

	chart.data.labels = labels;
	chart.data.datasets = chartDatasets;
	chart.options.scales = createScales(yMin, yMax, yStep, formatCompactValue);
	chart.update();

	return chart;
}

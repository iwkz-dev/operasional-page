import type { ChartType, Plugin } from 'chart.js';

declare module 'chartjs-plugin-datalabels' {
	const ChartDataLabels: Plugin;
	export default ChartDataLabels;
}

declare module 'chart.js' {
	interface PluginOptionsByType<TType extends ChartType> {
		datalabels?: {
			anchor?: 'start' | 'center' | 'end';
			align?: 'start' | 'center' | 'end' | 'right' | 'bottom' | 'left' | 'top';
			offset?: number;
			color?: string;
			font?: {
				weight?: string | number;
				size?: number;
				family?: string;
				style?: string;
				lineHeight?: string | number;
			};
			formatter?: (value: unknown) => string | number | null;
			clip?: boolean;
			clamp?: boolean;
		};
	}
}

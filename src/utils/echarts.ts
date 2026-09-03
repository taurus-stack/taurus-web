import * as echarts from 'echarts/core';
import { PieChart, BarChart, LineChart, GaugeChart } from 'echarts/charts';
import {
	TitleComponent,
	TooltipComponent,
	GridComponent,
	LegendComponent,
	DatasetComponent,
	TransformComponent,
	ToolboxComponent,
	DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ComposeOption } from 'echarts/core';
import type { PieSeriesOption, BarSeriesOption, LineSeriesOption, GaugeSeriesOption } from 'echarts/charts';
import type {
	TitleComponentOption,
	TooltipComponentOption,
	GridComponentOption,
	LegendComponentOption,
	DatasetComponentOption,
	ToolboxComponentOption,
	DataZoomComponentOption,
} from 'echarts/components';

type ECOption = ComposeOption<
	| PieSeriesOption
	| BarSeriesOption
	| LineSeriesOption
	| GaugeSeriesOption
	| TitleComponentOption
	| TooltipComponentOption
	| GridComponentOption
	| LegendComponentOption
	| DatasetComponentOption
	| ToolboxComponentOption
	| DataZoomComponentOption
>;

echarts.use([
	PieChart,
	BarChart,
	LineChart,
	GaugeChart,
	TitleComponent,
	TooltipComponent,
	GridComponent,
	LegendComponent,
	DatasetComponent,
	TransformComponent,
	ToolboxComponent,
	DataZoomComponent,
	CanvasRenderer,
]);

export { echarts };
export type { ECOption };
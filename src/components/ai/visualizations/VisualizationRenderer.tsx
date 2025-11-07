'use client';

import { LineChart } from './LineChart';
import { BarChart } from './BarChart';
import { PieChart } from './PieChart';
import { RadarChart } from './RadarChart';
import { ProgressBar } from './ProgressBar';
import { Heatmap } from './Heatmap';
import type { VisualData } from '@/lib/ai/types';

interface VisualizationRendererProps {
  visualData: VisualData;
}

export function VisualizationRenderer({ visualData }: VisualizationRendererProps) {
  const { chartType, data, labels, colors } = visualData;

  // Ensure minimum height for charts
  const chartHeight = '300px';

  switch (chartType) {
    case 'line':
      return (
        <div style={{ height: chartHeight }}>
          <LineChart data={data as Array<{ date?: string; name?: string; value: number }>} labels={labels} colors={colors} />
        </div>
      );
    case 'bar':
      return (
        <div style={{ height: chartHeight }}>
          <BarChart data={data as Array<{ name: string; value: number }>} labels={labels} colors={colors} />
        </div>
      );
    case 'pie':
      return (
        <div style={{ height: chartHeight }}>
          <PieChart data={data as Array<{ name: string; value: number }>} labels={labels} colors={colors} />
        </div>
      );
    case 'radar':
      return (
        <div style={{ height: chartHeight }}>
          <RadarChart data={data as Array<{ metric?: string; name?: string; value: number; max: number }>} labels={labels} colors={colors} />
        </div>
      );
    case 'progress':
      return (
        <div style={{ height: chartHeight }}>
          <ProgressBar data={data as Array<{ label?: string; name?: string; value: number; max: number }>} labels={labels} colors={colors} />
        </div>
      );
    case 'heatmap':
      return (
        <div style={{ height: chartHeight }}>
          <Heatmap data={data} labels={labels} colors={colors} />
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          Unknown chart type: {chartType}
        </div>
      );
  }
}


'use client';

import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface RadarChartProps {
  data: Array<{ metric?: string; name?: string; value: number; max: number; [key: string]: unknown }>;
  labels?: string[];
  colors?: string[];
}

export function RadarChart({ data, labels, colors = ['#3b82f6'] }: RadarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  // Transform data for Recharts (normalize values to 0-100 scale)
  const chartData = data.map((item, index) => {
    const metric = item.metric || item.name || labels?.[index] || `Metric ${index + 1}`;
    const max = item.max || 100;
    const value = item.value || 0;
    const normalizedValue = max > 0 ? (value / max) * 100 : 0;
    
    return {
      metric,
      value: Math.min(normalizedValue, 100), // Cap at 100
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsRadarChart data={chartData}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis 
          dataKey="metric" 
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]}
          tick={{ fill: '#6b7280', fontSize: 10 }}
        />
        <Radar
          name="Performance"
          dataKey="value"
          stroke={colors[0]}
          fill={colors[0]}
          fillOpacity={0.6}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}


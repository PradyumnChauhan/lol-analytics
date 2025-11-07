'use client';

import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LineChartProps {
  data: Array<{ date?: string; name?: string; value: number; [key: string]: unknown }>;
  labels?: string[];
  colors?: string[];
}

export function LineChart({ data, labels, colors = ['#3b82f6'] }: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = data.map((item, index) => ({
    name: item.date || item.name || labels?.[index] || `Point ${index + 1}`,
    value: item.value || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="name" 
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '12px'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={colors[0]} 
          strokeWidth={2}
          dot={{ fill: colors[0], r: 4 }}
          activeDot={{ r: 6 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}


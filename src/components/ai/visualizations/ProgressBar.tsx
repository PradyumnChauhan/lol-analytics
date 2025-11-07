'use client';

interface ProgressBarProps {
  data: Array<{ label?: string; name?: string; value: number; max: number; [key: string]: unknown }>;
  labels?: string[];
  colors?: string[];
}

export function ProgressBar({ data, labels, colors = ['#3b82f6'] }: ProgressBarProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-center space-y-4">
      {data.map((item, index) => {
        const label = item.label || item.name || labels?.[index] || 'Progress';
        const value = item.value || 0;
        const max = item.max || 100;
        const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
        const color = colors[index % colors.length];

        return (
          <div key={index} className="w-full">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">{label}</span>
              <span className="text-sm text-gray-600">{value} / {max}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {percentage.toFixed(1)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}


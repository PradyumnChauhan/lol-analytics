'use client';

interface HeatmapProps {
  data: unknown[];
  labels?: string[];
  colors?: string[];
}

export function Heatmap({ data }: HeatmapProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  // Simple heatmap visualization
  // For now, render as a grid of colored squares
  const gridSize = Math.ceil(Math.sqrt(data.length));
  
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
        {data.map((item: unknown, index) => {
          const value = typeof item === 'object' && item !== null && 'value' in item 
            ? (item as { value: number }).value 
            : typeof item === 'number' 
              ? item 
              : 0;
          
          // Normalize value to 0-100 for color intensity
          const intensity = Math.min(Math.max(value, 0), 100);
          const opacity = intensity / 100;
          
          return (
            <div
              key={index}
              className="aspect-square rounded"
              style={{
                backgroundColor: `rgba(59, 130, 246, ${opacity})`,
                minWidth: '20px',
                minHeight: '20px',
              }}
              title={`Value: ${value}`}
            />
          );
        })}
      </div>
    </div>
  );
}


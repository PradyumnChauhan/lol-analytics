'use client';

import { useMemo } from 'react';

interface Match {
  info: {
    participants: Array<{
      puuid: string;
      win: boolean;
      kills: number;
      deaths: number;
      assists: number;
      gameCreation?: number;
    }>;
    gameCreation: number;
  };
}

interface WinRateChartProps {
  matches: Match[];
  puuid: string;
}

export function WinRateChart({ matches, puuid }: WinRateChartProps) {
  const chartData = useMemo(() => {
    const sortedMatches = [...matches]
      .sort((a, b) => a.info.gameCreation - b.info.gameCreation)
      .slice(-20); // Last 20 matches

    let wins = 0;
    return sortedMatches.map((match, index) => {
      const participant = match.info.participants.find(p => p.puuid === puuid);
      if (participant?.win) wins++;
      
      return {
        game: index + 1,
        winRate: (wins / (index + 1)) * 100,
        result: participant?.win ? 'Win' : 'Loss'
      };
    });
  }, [matches, puuid]);

  if (chartData.length === 0) {
    return <div className="text-slate-400">No match data available</div>;
  }


  return (
    <div className="h-64 w-full">
      <svg viewBox="0 0 400 200" className="w-full h-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <g key={y}>
            <line
              x1="40"
              y1={160 - (y * 1.2)}
              x2="380" 
              y2={160 - (y * 1.2)}
              stroke="#475569"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            <text
              x="35"
              y={165 - (y * 1.2)}
              fill="#94a3b8"
              fontSize="10"
              textAnchor="end"
            >
              {y}%
            </text>
          </g>
        ))}
        
        {/* Win rate line */}
        <polyline
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          points={chartData.map((d, i) => 
            `${40 + (i * (340 / (chartData.length - 1)))},${160 - (d.winRate * 1.2)}`
          ).join(' ')}
        />
        
        {/* Data points */}
        {chartData.map((d, i) => (
          <g key={i}>
            <circle
              cx={40 + (i * (340 / (chartData.length - 1)))}
              cy={160 - (d.winRate * 1.2)}
              r="3"
              fill={d.result === 'Win' ? '#22c55e' : '#ef4444'}
              stroke="#1e293b"
              strokeWidth="1"
            />
            
            {/* Game number labels */}
            {i % 5 === 0 && (
              <text
                x={40 + (i * (340 / (chartData.length - 1)))}
                y="185"
                fill="#94a3b8"
                fontSize="10"
                textAnchor="middle"
              >
                {d.game}
              </text>
            )}
          </g>
        ))}
        
        {/* Current win rate indicator */}
        <text
          x="380"
          y={155 - (chartData[chartData.length - 1]?.winRate * 1.2)}
          fill="#22c55e"
          fontSize="12"
          fontWeight="bold"
          textAnchor="start"
        >
          {chartData[chartData.length - 1]?.winRate.toFixed(1)}%
        </text>
      </svg>
    </div>
  );
}
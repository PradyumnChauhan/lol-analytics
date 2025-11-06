'use client';

import { useMemo } from 'react';

interface Match {
  info: {
    participants: Array<{
      puuid: string;
      kills: number;
      deaths: number;
      assists: number;
    }>;
  };
}

interface KDAChartProps {
  matches: Match[];
  puuid: string;
}

export function KDAChart({ matches, puuid }: KDAChartProps) {
  const chartData = useMemo(() => {
    return matches.slice(-15).map((match, index) => {
      const participant = match.info.participants.find(p => p.puuid === puuid);
      if (!participant) return null;
      
      const kda = participant.deaths === 0 
        ? participant.kills + participant.assists 
        : (participant.kills + participant.assists) / participant.deaths;
      
      return {
        game: index + 1,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        kda: kda
      };
    }).filter((d): d is NonNullable<typeof d> => d !== null);
  }, [matches, puuid]);

  if (chartData.length === 0) {
    return <div className="text-slate-400">No match data available</div>;
  }

  const maxStat = Math.max(...chartData.flatMap(d => [d.kills, d.deaths, d.assists]));

  return (
    <div className="h-64 w-full">
      <svg viewBox="0 0 400 200" className="w-full h-full">
        {/* Grid lines */}
        {Array.from({length: 6}, (_, i) => i * (maxStat / 5)).map((y, i) => (
          <g key={i}>
            <line
              x1="40"
              y1={160 - (i * 24)}
              x2="380" 
              y2={160 - (i * 24)}
              stroke="#475569"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            <text
              x="35"
              y={165 - (i * 24)}
              fill="#94a3b8"
              fontSize="10"
              textAnchor="end"
            >
              {Math.round(y)}
            </text>
          </g>
        ))}
        
        {/* Bars for each game */}
        {chartData.map((d, i) => {
          const x = 50 + (i * (300 / chartData.length));
          const barWidth = (300 / chartData.length) * 0.7;
          
          return (
            <g key={i}>
              {/* Kills bar */}
              <rect
                x={x}
                y={160 - (d.kills * (120 / maxStat))}
                width={barWidth * 0.3}
                height={d.kills * (120 / maxStat)}
                fill="#22c55e"
                opacity="0.8"
              />
              
              {/* Deaths bar */}
              <rect
                x={x + barWidth * 0.33}
                y={160 - (d.deaths * (120 / maxStat))}
                width={barWidth * 0.3}
                height={d.deaths * (120 / maxStat)}
                fill="#ef4444"
                opacity="0.8"
              />
              
              {/* Assists bar */}
              <rect
                x={x + barWidth * 0.66}
                y={160 - (d.assists * (120 / maxStat))}
                width={barWidth * 0.3}
                height={d.assists * (120 / maxStat)}
                fill="#3b82f6"
                opacity="0.8"
              />
              
              {/* Game number */}
              <text
                x={x + barWidth / 2}
                y="185"
                fill="#94a3b8"
                fontSize="9"
                textAnchor="middle"
              >
                {d.game}
              </text>
            </g>
          );
        })}
        
        {/* Legend */}
        <g transform="translate(300, 20)">
          <rect x="0" y="0" width="12" height="8" fill="#22c55e" />
          <text x="15" y="7" fill="#94a3b8" fontSize="10">Kills</text>
          
          <rect x="0" y="12" width="12" height="8" fill="#ef4444" />
          <text x="15" y="19" fill="#94a3b8" fontSize="10">Deaths</text>
          
          <rect x="0" y="24" width="12" height="8" fill="#3b82f6" />
          <text x="15" y="31" fill="#94a3b8" fontSize="10">Assists</text>
        </g>
      </svg>
    </div>
  );
}
'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MatchTimelineChartProps {
  timeline: {
    frames?: Array<{
      timestamp: number;
      participantFrames?: Record<number, {
        gold?: number;
        xp?: number;
        damageStats?: { totalDamageDoneToChampions?: number };
        minionsKilled?: number;
        level?: number;
      }>;
    }>;
    metadata?: {
      participants?: string[];
    };
  } | null;
  playerPuuid: string;
  teamId: number;
  className?: string;
}

interface TimelineDataPoint {
  timestamp: number;
  gold: number;
  xp: number;
  damage: number;
  cs: number;
  level: number;
  time: string; // Formatted time (e.g., "15:30")
}

export function MatchTimelineChart({ timeline, playerPuuid, className = '' }: MatchTimelineChartProps) {
  if (!timeline?.frames) {
    return (
      <div className={`p-4 text-center text-slate-400 ${className}`}>
        <p>Timeline data not available</p>
      </div>
    );
  }

  // Find participant ID
  const participantId = timeline.metadata?.participants?.indexOf(playerPuuid);
  if (participantId === undefined || participantId === -1 || typeof participantId !== 'number') {
    return (
      <div className={`p-4 text-center text-slate-400 ${className}`}>
        <p>Player not found in timeline data</p>
      </div>
    );
  }

  // Process timeline data
  const data: TimelineDataPoint[] = timeline.frames
    .filter((frame: { participantFrames?: Record<number, unknown> }) => {
      return frame.participantFrames !== undefined && typeof participantId === 'number' && participantId in frame.participantFrames;
    })
    .map((frame: { timestamp: number; participantFrames?: Record<number, { gold?: number; xp?: number; damageStats?: { totalDamageDoneToChampions?: number }; minionsKilled?: number; level?: number }> }) => {
      if (!frame.participantFrames || typeof participantId !== 'number') {
        return null;
      }
      const participantFrame = frame.participantFrames[participantId];
      if (!participantFrame) {
        return null;
      }
      const timestamp = frame.timestamp;
      const minutes = Math.floor(timestamp / 60000);
      const seconds = Math.floor((timestamp % 60000) / 1000);
      
      return {
        timestamp,
        gold: participantFrame.gold || 0,
        xp: participantFrame.xp || 0,
        damage: participantFrame.damageStats?.totalDamageDoneToChampions || 0,
        cs: participantFrame.minionsKilled || 0,
        level: participantFrame.level || 1,
        time: `${minutes}:${seconds.toString().padStart(2, '0')}`
      };
    })
    .filter((point): point is TimelineDataPoint => point !== null);

  if (data.length === 0) {
    return (
      <div className={`p-4 text-center text-slate-400 ${className}`}>
        <p>No timeline data available for this player</p>
      </div>
    );
  }

  // Calculate gold and XP per minute, and differences
  const processedData = data.map((point, index) => {
    const minutes = point.timestamp / 60000;
    const goldPerMin = minutes > 0 ? point.gold / minutes : 0;
    const xpPerMin = minutes > 0 ? point.xp / minutes : 0;
    const goldDiff = point.gold - (index > 0 ? data[index - 1].gold : 0);
    const xpDiff = point.xp - (index > 0 ? data[index - 1].xp : 0);
    
    return {
      ...point,
      goldDiff,
      xpDiff,
      goldPerMin: Math.round(goldPerMin),
      xpPerMin: Math.round(xpPerMin),
    };
  });

  return (
    <div className={`bg-white/5 rounded-xl p-4 ${className}`}>
      <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
        Performance Timeline
      </h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              yAxisId="left"
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: unknown, name: string): [React.ReactNode, string] => {
                const formattedValue: React.ReactNode = typeof value === 'number' 
                  ? value.toLocaleString() 
                  : typeof value === 'string'
                  ? value
                  : String(value);
                return [formattedValue, name];
              }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Legend />
            
            {/* Gold line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="gold"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
              name="Gold"
            />
            
            {/* XP line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="xp"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              name="XP"
            />
            
            {/* Damage line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="damage"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              name="Damage to Champions"
            />
            {/* Gold per minute line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="goldPerMin"
              stroke="#FCD34D"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              name="Gold/Min"
            />
            {/* XP per minute line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="xpPerMin"
              stroke="#60A5FA"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              name="XP/Min"
            />
            
            {/* CS line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cs"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={false}
              name="CS"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <div className="text-amber-400 font-semibold">
            {data[data.length - 1]?.gold?.toLocaleString() || 0}
          </div>
          <div className="text-slate-400">Final Gold</div>
        </div>
        <div className="text-center">
          <div className="text-green-400 font-semibold">
            {data[data.length - 1]?.xp?.toLocaleString() || 0}
          </div>
          <div className="text-slate-400">Final XP</div>
        </div>
        <div className="text-center">
          <div className="text-red-400 font-semibold">
            {data[data.length - 1]?.damage?.toLocaleString() || 0}
          </div>
          <div className="text-slate-400">Total Damage</div>
        </div>
        <div className="text-center">
          <div className="text-purple-400 font-semibold">
            {data[data.length - 1]?.cs || 0}
          </div>
          <div className="text-slate-400">Total CS</div>
        </div>
      </div>
    </div>
  );
}


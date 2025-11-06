'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { WardHeatmap } from '@/components/visualization/WardHeatmap';

interface PerformanceGraphProps {
  data: Array<{
    date: string;
    winRate: number;
    kda: number;
    damage: number;
    vision: number;
    cs: number;
    performance: number;
    gamesPlayed: number;
  }>;
  matchData?: any[];
  playerPuuid?: string;
  className?: string;
  type?: 'line' | 'area' | 'multi';
}

export function PerformanceGraph({ data, matchData, playerPuuid, className = '', type = 'multi' }: PerformanceGraphProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`p-4 text-center text-slate-400 ${className}`}>
        <p>No performance data available</p>
      </div>
    );
  }

  // Normalize data for better visualization
  const normalizedData = data.map(point => ({
    ...point,
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    winRateNormalized: point.winRate,
    kdaNormalized: Math.min(point.kda * 20, 100), // Scale KDA to 0-100
    damageNormalized: Math.min(point.damage / 100, 100), // Scale damage to 0-100
    visionNormalized: Math.min(point.vision * 2, 100), // Scale vision to 0-100
    csNormalized: Math.min(point.cs / 10, 100), // Scale CS to 0-100
    performanceNormalized: Math.min(point.performance, 100)
  }));

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart data={normalizedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: any, name: string) => {
                const formattedValue = typeof value === 'number' 
                  ? value.toFixed(1) 
                  : value;
                return [formattedValue, name];
              }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Area
              type="monotone"
              dataKey="performanceNormalized"
              stroke="#3B82F6"
              fill="url(#performanceGradient)"
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
          </AreaChart>
        );

      case 'line':
        return (
          <LineChart data={normalizedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: any, name: string) => {
                const formattedValue = typeof value === 'number' 
                  ? value.toFixed(1) 
                  : value;
                return [formattedValue, name];
              }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Line
              type="monotone"
              dataKey="performanceNormalized"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              name="Performance Score"
            />
          </LineChart>
        );

      default: // multi
        return (
          <LineChart data={normalizedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              yAxisId="left"
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
              domain={[0, 100]}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: any, name: string) => {
                const formattedValue = typeof value === 'number' 
                  ? value.toFixed(1) 
                  : value;
                return [formattedValue, name];
              }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Legend />
            
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="winRateNormalized"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              name="Win Rate %"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="kdaNormalized"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
              name="KDA Score"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="damageNormalized"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              name="Damage Score"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="visionNormalized"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={false}
              name="Vision Score"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="performanceNormalized"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              name="Overall Performance"
            />
          </LineChart>
        );
    }
  };

  // Calculate trends
  const trends = calculateTrends(normalizedData);

  return (
    <div className={`bg-white/5 rounded p-2 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-white text-sm font-semibold flex items-center">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></span>
          Performance Trends
        </h3>
        <div className="flex space-x-1">
          <button className="px-2 py-0.5 text-[10px] bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors">
            {type === 'multi' ? 'Multi' : type === 'area' ? 'Area' : 'Line'}
          </button>
        </div>
      </div>
      
      <div className="h-48 mb-1">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Trend Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-xs mb-1">
        <div className="text-center">
          <div className={`font-semibold text-xs ${trends.winRate > 0 ? 'text-green-400' : trends.winRate < 0 ? 'text-red-400' : 'text-white/60'}`}>
            {trends.winRate > 0 ? '↗' : trends.winRate < 0 ? '↘' : '→'} {Math.abs(trends.winRate).toFixed(1)}%
          </div>
          <div className="text-white/60 text-[10px]">Win Rate Trend</div>
        </div>
        <div className="text-center">
          <div className={`font-semibold text-xs ${trends.kda > 0 ? 'text-green-400' : trends.kda < 0 ? 'text-red-400' : 'text-white/60'}`}>
            {trends.kda > 0 ? '↗' : trends.kda < 0 ? '↘' : '→'} {Math.abs(trends.kda).toFixed(1)}
          </div>
          <div className="text-white/60 text-[10px]">KDA Trend</div>
        </div>
        <div className="text-center">
          <div className={`font-semibold text-xs ${trends.damage > 0 ? 'text-green-400' : trends.damage < 0 ? 'text-red-400' : 'text-white/60'}`}>
            {trends.damage > 0 ? '↗' : trends.damage < 0 ? '↘' : '→'} {Math.abs(trends.damage).toFixed(0)}
          </div>
          <div className="text-white/60 text-[10px]">Damage Trend</div>
        </div>
        <div className="text-center">
          <div className={`font-semibold text-xs ${trends.performance > 0 ? 'text-green-400' : trends.performance < 0 ? 'text-red-400' : 'text-white/60'}`}>
            {trends.performance > 0 ? '↗' : trends.performance < 0 ? '↘' : '→'} {Math.abs(trends.performance).toFixed(1)}
          </div>
          <div className="text-white/60 text-[10px]">Overall Trend</div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="pt-1 border-t border-white/10 mb-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-xs">
          <div className="text-center">
            <div className="text-green-400 font-semibold text-xs">
              {data.reduce((sum, point) => sum + point.gamesPlayed, 0)}
            </div>
            <div className="text-white/60 text-[10px]">Total Games</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold text-xs">
              {(data.reduce((sum, point) => sum + point.winRate, 0) / data.length).toFixed(1)}%
            </div>
            <div className="text-white/60 text-[10px]">Avg Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-400 font-semibold text-xs">
              {(data.reduce((sum, point) => sum + point.kda, 0) / data.length).toFixed(2)}
            </div>
            <div className="text-white/60 text-[10px]">Avg KDA</div>
          </div>
          <div className="text-center">
            <div className="text-purple-400 font-semibold text-xs">
              {(data.reduce((sum, point) => sum + point.performance, 0) / data.length).toFixed(1)}
            </div>
            <div className="text-white/60 text-[10px]">Avg Performance</div>
          </div>
        </div>
      </div>

      {/* Ward Placement Heatmap - Integrated */}
      {matchData && playerPuuid && (
        <div className="pt-4 mt-4 border-t border-white/10">
          <WardHeatmap matchData={matchData} playerPuuid={playerPuuid} noContainer={true} />
        </div>
      )}
    </div>
  );
}

function calculateTrends(data: any[]): {
  winRate: number;
  kda: number;
  damage: number;
  performance: number;
} {
  if (data.length < 2) {
    return { winRate: 0, kda: 0, damage: 0, performance: 0 };
  }

  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));

  const calculateAverage = (arr: any[], key: string) => 
    arr.reduce((sum, item) => sum + item[key], 0) / arr.length;

  const firstWinRate = calculateAverage(firstHalf, 'winRate');
  const secondWinRate = calculateAverage(secondHalf, 'winRate');
  const firstKda = calculateAverage(firstHalf, 'kda');
  const secondKda = calculateAverage(secondHalf, 'kda');
  const firstDamage = calculateAverage(firstHalf, 'damage');
  const secondDamage = calculateAverage(secondHalf, 'damage');
  const firstPerformance = calculateAverage(firstHalf, 'performance');
  const secondPerformance = calculateAverage(secondHalf, 'performance');

  return {
    winRate: secondWinRate - firstWinRate,
    kda: secondKda - firstKda,
    damage: secondDamage - firstDamage,
    performance: secondPerformance - firstPerformance
  };
}



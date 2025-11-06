'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Crown, TrendingUp } from 'lucide-react';

interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  tokensEarned: number;
  puuid: string;
}

interface MasteryProgressChartProps {
  masteryData: ChampionMastery[];
}

export function MasteryProgressChart({ masteryData }: MasteryProgressChartProps) {
  const getMasteryStats = () => {
    const stats = {
      totalPoints: 0,
      totalChampions: masteryData.length,
      mastery7: 0,
      mastery6: 0,
      mastery5: 0,
      chestsEarned: 0,
      tokensEarned: 0,
      recentlyPlayed: 0
    };

    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    masteryData.forEach(mastery => {
      stats.totalPoints += mastery.championPoints;
      
      if (mastery.championLevel === 7) stats.mastery7++;
      else if (mastery.championLevel === 6) stats.mastery6++;
      else if (mastery.championLevel === 5) stats.mastery5++;
      
      if (mastery.chestGranted) stats.chestsEarned++;
      stats.tokensEarned += mastery.tokensEarned;
      
      if (mastery.lastPlayTime && mastery.lastPlayTime > oneWeekAgo) stats.recentlyPlayed++;
    });

    return stats;
  };

  const formatPoints = (points: number) => {
    if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`;
    if (points >= 1000) return `${(points / 1000).toFixed(0)}k`;
    return points.toString();
  };

  const stats = getMasteryStats();
  const averagePoints = stats.totalChampions > 0 ? Math.round(stats.totalPoints / stats.totalChampions) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Mastery Score */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {formatPoints(stats.totalPoints)}
          </div>
          <div className="text-sm text-slate-400 mb-2">Total Mastery Points</div>
          <div className="text-xs text-blue-400 font-semibold">
            {formatPoints(averagePoints)} avg per champion
          </div>
        </CardContent>
      </Card>

      {/* Mastery Levels Breakdown */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Crown className="h-5 w-5 text-yellow-400" />
            <div className="text-sm text-slate-400">Mastery Levels</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-yellow-400 text-xs">Level 7</span>
              <span className="text-white font-semibold text-sm">{stats.mastery7}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-400 text-xs">Level 6</span>
              <span className="text-white font-semibold text-sm">{stats.mastery6}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-400 text-xs">Level 5</span>
              <span className="text-white font-semibold text-sm">{stats.mastery5}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards Status */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Award className="h-5 w-5 text-green-400" />
            <div className="text-sm text-slate-400">Rewards</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-green-400 text-xs">Chests Earned</span>
              <span className="text-white font-semibold text-sm">{stats.chestsEarned}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-400 text-xs">Available Chests</span>
              <span className="text-white font-semibold text-sm">{stats.totalChampions - stats.chestsEarned}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-orange-400 text-xs">Tokens</span>
              <span className="text-white font-semibold text-sm">{stats.tokensEarned}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            <div className="text-sm text-slate-400">Activity</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-indigo-400 text-xs">Champions Owned</span>
              <span className="text-white font-semibold text-sm">{stats.totalChampions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-cyan-400 text-xs">Recently Played</span>
              <span className="text-white font-semibold text-sm">{stats.recentlyPlayed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-400 text-xs">Completion</span>
              <span className="text-white font-semibold text-sm">
                {Math.round((stats.chestsEarned / stats.totalChampions) * 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
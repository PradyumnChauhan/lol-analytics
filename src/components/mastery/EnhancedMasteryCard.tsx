'use client';

import React from 'react';
import { Crown, Award, Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MasteryProgressBar } from './MasteryProgressBar';

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

interface EnhancedMasteryCardProps {
  mastery: ChampionMastery;
  championName?: string;
  rank?: number;
}

const MASTERY_LEVEL_COLORS = {
  1: 'text-gray-400',
  2: 'text-gray-300',
  3: 'text-green-400',
  4: 'text-blue-400',
  5: 'text-purple-400',
  6: 'text-red-400',
  7: 'text-yellow-400'
};

const MASTERY_LEVEL_NAMES = {
  1: 'D',
  2: 'C',
  3: 'B',
  4: 'A',
  5: 'S',
  6: 'S+',
  7: 'S++' 
};

const POINTS_FOR_NEXT_LEVEL = {
  1: 1800,
  2: 4200, 
  3: 8400,
  4: 14400,
  5: 21600,
  6: 21600,
  7: 0 // Max level
};

export function EnhancedMasteryCard({ mastery, championName, rank }: EnhancedMasteryCardProps) {
  const formatPoints = (points: number) => {
    if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`;
    if (points >= 1000) return `${(points / 1000).toFixed(0)}k`;
    return points.toString();
  };

  const getTimeSinceLastPlayed = () => {
    // Handle cases where lastPlayTime is undefined, null, or invalid
    if (!mastery.lastPlayTime || typeof mastery.lastPlayTime !== 'number' || mastery.lastPlayTime <= 0) {
      return 'Unknown';
    }

    const now = Date.now();
    const lastPlayedDate = mastery.lastPlayTime;
    const daysSince = Math.floor((now - lastPlayedDate) / (1000 * 60 * 60 * 24));
    
    // Handle negative or invalid calculations
    if (isNaN(daysSince) || daysSince < 0) {
      return 'Unknown';
    }
    
    if (daysSince === 0) return 'Today';
    if (daysSince === 1) return 'Yesterday';
    if (daysSince < 7) return `${daysSince} days ago`;
    if (daysSince < 30) return `${Math.floor(daysSince / 7)} weeks ago`;
    if (daysSince < 365) return `${Math.floor(daysSince / 30)} months ago`;
    return `${Math.floor(daysSince / 365)} years ago`;
  };

  const getProgressPercentage = () => {
    if (mastery.championLevel >= 7) return 100;
    const totalNeeded = mastery.championPointsSinceLastLevel + mastery.championPointsUntilNextLevel;
    if (totalNeeded === 0) return 100;
    return (mastery.championPointsSinceLastLevel / totalNeeded) * 100;
  };

  const getMasteryBadgeColor = () => {
    if (mastery.championLevel >= 7) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    if (mastery.championLevel >= 6) return 'bg-gradient-to-r from-red-500 to-pink-500';
    if (mastery.championLevel >= 5) return 'bg-gradient-to-r from-purple-500 to-indigo-500';
    if (mastery.championLevel >= 4) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (mastery.championLevel >= 3) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    return 'bg-gradient-to-r from-gray-500 to-slate-500';
  };

  return (
    <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 group">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Champion Image */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center border-2 border-white/20">
              <img 
                src={`https://ddragon.leagueoflegends.com/cdn/14.19.1/img/champion/${championName || 'Aatrox'}.png`}
                alt={championName || `Champion ${mastery.championId}`}
                className="w-full h-full rounded-xl object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-sm font-bold text-white">${mastery.championId}</span>`;
                  }
                }}
              />
            </div>
            
            {/* Mastery Level Badge */}
            <div className={`absolute -bottom-2 -right-2 ${getMasteryBadgeColor()} border-2 border-white/30 rounded-full w-8 h-8 flex items-center justify-center`}>
              <span className="text-white font-bold text-xs">
                {MASTERY_LEVEL_NAMES[mastery.championLevel as keyof typeof MASTERY_LEVEL_NAMES] || mastery.championLevel}
              </span>
            </div>

            {/* Rank Badge */}
            {rank && rank <= 10 && (
              <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-500 to-orange-500 border-2 border-white/30 rounded-full w-6 h-6 flex items-center justify-center">
                <span className="text-white font-bold text-xs">#{rank}</span>
              </div>
            )}
          </div>

          {/* Champion Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold text-lg truncate">
                {championName || `Champion ${mastery.championId}`}
              </h3>
              
              {/* Rewards Status */}
              <div className="flex items-center space-x-1">
                {mastery.chestGranted ? (
                  <CheckCircle className="h-4 w-4 text-green-400" title="Chest Earned" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-400" title="Chest Available" />
                )}
                {mastery.tokensEarned > 0 && (
                  <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400">
                    {mastery.tokensEarned} 🪙
                  </Badge>
                )}
              </div>
            </div>

            {/* Mastery Points */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-bold text-xl">
                {formatPoints(mastery.championPoints)}
                <span className="text-white/60 text-sm font-normal ml-1">points</span>
              </div>
              
              <div className="text-right">
                <div className="text-white/60 text-xs">Last Played</div>
                <div className="text-white/80 text-sm font-medium">
                  {getTimeSinceLastPlayed()}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <MasteryProgressBar 
              currentLevel={mastery.championLevel}
              pointsSinceLastLevel={mastery.championPointsSinceLastLevel}
              pointsUntilNextLevel={mastery.championPointsUntilNextLevel}
            />

            {/* Additional Stats */}
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-white/60">Level</div>
                <div className="text-white font-semibold">{mastery.championLevel}/7</div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-white/60">Progress</div>
                <div className="text-white font-semibold">
                  {mastery.championLevel >= 7 ? 'Max' : `${Math.round(getProgressPercentage())}%`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
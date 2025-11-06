'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Crown, Target } from 'lucide-react';

interface LeagueEntry {
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  queueType: string;
}

interface LeagueData {
  soloQueue: LeagueEntry | null;
  flexQueue: LeagueEntry | null;
  all: LeagueEntry[];
}

interface RankedProgressionProps {
  leagueData: LeagueData;
}

export function RankedProgression({ leagueData }: RankedProgressionProps) {
  const stats = useMemo(() => {
    const soloQueue = leagueData.soloQueue;
    const flexQueue = leagueData.flexQueue;
    
    if (!soloQueue && !flexQueue) return null;

    const calculateWinRate = (wins: number, losses: number) => {
      const total = wins + losses;
      return total === 0 ? 0 : (wins / total) * 100;
    };

    const getTierProgress = (tier: string, rank: string) => {
      const tierOrder = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
      const rankOrder = ['IV', 'III', 'II', 'I'];
      
      const tierIndex = tierOrder.indexOf(tier);
      const rankIndex = rankOrder.indexOf(rank);
      
      if (tierIndex === -1) return 0;
      
      // Calculate overall progress (0-100)
      let baseProgress = tierIndex * 4; // Each tier has 4 ranks
      if (rankIndex !== -1) {
        baseProgress += (3 - rankIndex); // IV=0, III=1, II=2, I=3
      }
      
      const totalTiers = tierOrder.length * 4;
      return (baseProgress / totalTiers) * 100;
    };

    return {
      soloQueue: soloQueue ? {
        ...soloQueue,
        winRate: calculateWinRate(soloQueue.wins, soloQueue.losses),
        progress: getTierProgress(soloQueue.tier, soloQueue.rank),
        totalGames: soloQueue.wins + soloQueue.losses
      } : null,
      flexQueue: flexQueue ? {
        ...flexQueue,
        winRate: calculateWinRate(flexQueue.wins, flexQueue.losses),
        progress: getTierProgress(flexQueue.tier, flexQueue.rank),
        totalGames: flexQueue.wins + flexQueue.losses
      } : null
    };
  }, [leagueData]);

  const getRankColor = (tier: string) => {
    const colors: Record<string, string> = {
      IRON: 'from-gray-600 to-gray-700',
      BRONZE: 'from-amber-600 to-amber-700',
      SILVER: 'from-gray-400 to-gray-500',
      GOLD: 'from-yellow-500 to-yellow-600',
      PLATINUM: 'from-cyan-500 to-cyan-600',
      EMERALD: 'from-green-500 to-green-600',
      DIAMOND: 'from-blue-500 to-blue-600',
      MASTER: 'from-purple-600 to-purple-700',
      GRANDMASTER: 'from-red-600 to-red-700',
      CHALLENGER: 'from-yellow-400 to-yellow-500',
    };
    return colors[tier] || 'from-gray-500 to-gray-600';
  };

  const getLPToNextRank = (tier: string, rank: string, lp: number) => {
    if (tier === 'MASTER' || tier === 'GRANDMASTER' || tier === 'CHALLENGER') {
      return `${lp} LP`;
    }
    
    const lpNeeded = 100 - lp;
    return lpNeeded > 0 ? `${lpNeeded} LP to next rank` : 'Promotion Series';
  };

  if (!stats || (!stats.soloQueue && !stats.flexQueue)) {
    return (
      <div className="text-center py-8 text-slate-400">
        No ranked data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {stats.soloQueue && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                <span>Solo/Duo Queue</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Rank Display */}
                <div className={`bg-gradient-to-r ${getRankColor(stats.soloQueue.tier)} rounded-lg p-4 text-center`}>
                  <div className="text-white text-2xl font-bold">
                    {stats.soloQueue.tier} {stats.soloQueue.rank}
                  </div>
                  <div className="text-white text-lg">
                    {stats.soloQueue.leaguePoints} LP
                  </div>
                  <div className="text-white/80 text-sm">
                    {getLPToNextRank(stats.soloQueue.tier, stats.soloQueue.rank, stats.soloQueue.leaguePoints)}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-slate-700 rounded-lg p-3">
                    <div className="text-green-400 text-xl font-bold">
                      {stats.soloQueue.winRate.toFixed(1)}%
                    </div>
                    <div className="text-slate-400 text-sm">Win Rate</div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <div className="text-blue-400 text-xl font-bold">
                      {stats.soloQueue.totalGames}
                    </div>
                    <div className="text-slate-400 text-sm">Total Games</div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <div className="text-green-500 text-xl font-bold">
                      {stats.soloQueue.wins}
                    </div>
                    <div className="text-slate-400 text-sm">Wins</div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <div className="text-red-500 text-xl font-bold">
                      {stats.soloQueue.losses}
                    </div>
                    <div className="text-slate-400 text-sm">Losses</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Ladder Progress</span>
                    <span className="text-white">{stats.soloQueue.progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(stats.soloQueue.progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stats.flexQueue && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-500" />
                <span>Flex Queue</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Rank Display */}
                <div className={`bg-gradient-to-r ${getRankColor(stats.flexQueue.tier)} rounded-lg p-4 text-center`}>
                  <div className="text-white text-2xl font-bold">
                    {stats.flexQueue.tier} {stats.flexQueue.rank}
                  </div>
                  <div className="text-white text-lg">
                    {stats.flexQueue.leaguePoints} LP
                  </div>
                  <div className="text-white/80 text-sm">
                    {getLPToNextRank(stats.flexQueue.tier, stats.flexQueue.rank, stats.flexQueue.leaguePoints)}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-slate-700 rounded-lg p-3">
                    <div className="text-green-400 text-xl font-bold">
                      {stats.flexQueue.winRate.toFixed(1)}%
                    </div>
                    <div className="text-slate-400 text-sm">Win Rate</div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <div className="text-blue-400 text-xl font-bold">
                      {stats.flexQueue.totalGames}
                    </div>
                    <div className="text-slate-400 text-sm">Total Games</div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <div className="text-green-500 text-xl font-bold">
                      {stats.flexQueue.wins}
                    </div>
                    <div className="text-slate-400 text-sm">Wins</div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <div className="text-red-500 text-xl font-bold">
                      {stats.flexQueue.losses}
                    </div>
                    <div className="text-slate-400 text-sm">Losses</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Ladder Progress</span>
                    <span className="text-white">{stats.flexQueue.progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(stats.flexQueue.progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance Summary */}
      {stats.soloQueue && stats.flexQueue && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Ranked Performance Comparison</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-slate-400 text-sm mb-2">Better Win Rate</div>
                <div className="text-2xl font-bold">
                  {stats.soloQueue.winRate > stats.flexQueue.winRate ? (
                    <span className="text-yellow-500">Solo/Duo</span>
                  ) : stats.flexQueue.winRate > stats.soloQueue.winRate ? (
                    <span className="text-purple-500">Flex</span>
                  ) : (
                    <span className="text-gray-400">Tied</span>
                  )}
                </div>
                <div className="text-slate-400 text-sm">
                  {Math.max(stats.soloQueue.winRate, stats.flexQueue.winRate).toFixed(1)}%
                </div>
              </div>
              
              <div>
                <div className="text-slate-400 text-sm mb-2">Higher Rank</div>
                <div className="text-2xl font-bold">
                  {stats.soloQueue.progress > stats.flexQueue.progress ? (
                    <span className="text-yellow-500">Solo/Duo</span>
                  ) : stats.flexQueue.progress > stats.soloQueue.progress ? (
                    <span className="text-purple-500">Flex</span>
                  ) : (
                    <span className="text-gray-400">Same</span>
                  )}
                </div>
                <div className="text-slate-400 text-sm">
                  Ladder Position
                </div>
              </div>
              
              <div>
                <div className="text-slate-400 text-sm mb-2">More Active</div>
                <div className="text-2xl font-bold">
                  {stats.soloQueue.totalGames > stats.flexQueue.totalGames ? (
                    <span className="text-yellow-500">Solo/Duo</span>
                  ) : stats.flexQueue.totalGames > stats.soloQueue.totalGames ? (
                    <span className="text-purple-500">Flex</span>
                  ) : (
                    <span className="text-gray-400">Equal</span>
                  )}
                </div>
                <div className="text-slate-400 text-sm">
                  {Math.max(stats.soloQueue.totalGames, stats.flexQueue.totalGames)} games
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
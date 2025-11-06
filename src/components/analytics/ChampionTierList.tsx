'use client';

import React from 'react';

interface ChampionTierListProps {
  championStats: Array<{
    championId: number;
    championName: string;
    games: number;
    wins: number;
    winRate: number;
    avgKDA: number;
    avgDamage: number;
    avgVision: number;
    avgGold: number;
    avgCS: number;
    performanceGrade: string;
    recentForm: boolean[];
    roles: string[];
    lastPlayed: number;
    multikills: number;
    firstBloodRate: number;
    damageShare: number;
    goldShare: number;
    killParticipation: number;
  }>;
  className?: string;
}

interface TierGroup {
  tier: string;
  color: string;
  champions: any[];
  minGames: number;
}

export function ChampionTierList({ championStats, className = '' }: ChampionTierListProps) {
  if (!championStats || championStats.length === 0) {
    return (
      <div className={`p-4 text-center text-slate-400 ${className}`}>
        <p>No champion data available</p>
      </div>
    );
  }

  // Filter champions with minimum games and calculate tier scores
  const minGames = 3;
  const filteredChampions = championStats
    .filter(champ => champ.games >= minGames)
    .map(champ => ({
      ...champ,
      tierScore: calculateTierScore(champ)
    }))
    .sort((a, b) => b.tierScore - a.tierScore);

  // Group champions into tiers
  const tierGroups = groupChampionsIntoTiers(filteredChampions);

  return (
    <div className={`bg-gradient-to-br from-slate-900/80 to-slate-900/60 rounded border border-yellow-500/20 p-2 ${className}`}>
      <h3 className="text-white text-sm font-bold mb-1 flex items-center">
        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
        Champion Tier List
      </h3>
      
      <div className="space-y-1">
        {tierGroups.map((group, groupIndex) => (
          <div key={group.tier} className="bg-white/5 rounded border border-yellow-500/10 p-1.5">
            <div className="flex items-center mb-1">
              <div 
                className={`w-8 h-5 rounded flex items-center justify-center text-white font-bold text-xs mr-2 ${group.color}`}
              >
                {group.tier}
              </div>
              <div className="text-white/70 text-[10px]">
                {group.champions.length} champions • Min {group.minGames} games
              </div>
            </div>
            
            <div className="space-y-0.5">
              {group.champions.map((champion, index) => (
                <div
                  key={champion.championId}
                  className="bg-white/5 rounded border border-yellow-500/10 p-1.5 hover:bg-white/10 hover:border-yellow-500/30 transition-colors"
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="text-white font-semibold text-sm">
                        {champion.championName}
                      </div>
                      <div className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        champion.performanceGrade === 'S+' ? 'bg-yellow-500 text-black' :
                        champion.performanceGrade === 'S' ? 'bg-yellow-600 text-white' :
                        champion.performanceGrade === 'A' ? 'bg-green-500 text-white' :
                        champion.performanceGrade === 'B' ? 'bg-blue-500 text-white' :
                        champion.performanceGrade === 'C' ? 'bg-orange-500 text-white' :
                        'bg-red-500 text-white'
                      }`}>
                        {champion.performanceGrade}
                      </div>
                    </div>
                    {/* Recent Form */}
                    <div className="flex items-center gap-1">
                      <div className="text-white/60 text-[9px]">Recent:</div>
                      <div className="flex gap-0.5">
                        {champion.recentForm.slice(-5).map((win: boolean, i: number) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              win ? 'bg-green-400' : 'bg-red-400'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats Row - Horizontal Layout */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {/* Primary Stats */}
                    <div className="flex flex-col">
                      <div className="text-white/60 text-[9px]">Games</div>
                      <div className="text-white font-semibold text-xs">{champion.games}</div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-white/60 text-[9px]">Win Rate</div>
                      <div className={`font-semibold text-xs ${
                        champion.winRate >= 60 ? 'text-green-400' : 
                        champion.winRate >= 50 ? 'text-yellow-400' : 
                        'text-red-400'
                      }`}>
                        {champion.winRate.toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-white/60 text-[9px]">KDA</div>
                      <div className="text-white font-semibold text-xs">{champion.avgKDA.toFixed(2)}</div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-white/60 text-[9px]">Damage</div>
                      <div className="text-white font-semibold text-xs">{(champion.avgDamage / 1000).toFixed(1)}k</div>
                    </div>
                    
                    {/* Additional Stats */}
                    {champion.multikills > 0 && (
                      <div className="flex flex-col">
                        <div className="text-white/60 text-[9px]">Multikills</div>
                        <div className="text-yellow-400 font-semibold text-xs">{champion.multikills}</div>
                      </div>
                    )}
                    {champion.killParticipation > 0 && (
                      <div className="flex flex-col">
                        <div className="text-white/60 text-[9px]">KP</div>
                        <div className="text-white font-semibold text-xs">{champion.killParticipation.toFixed(0)}%</div>
                      </div>
                    )}
                    {champion.damageShare > 0 && (
                      <div className="flex flex-col">
                        <div className="text-white/60 text-[9px]">Dmg Share</div>
                        <div className="text-white font-semibold text-xs">{champion.damageShare.toFixed(0)}%</div>
                      </div>
                    )}
                    {champion.avgGold > 0 && (
                      <div className="flex flex-col">
                        <div className="text-white/60 text-[9px]">Gold</div>
                        <div className="text-white font-semibold text-xs">{(champion.avgGold / 1000).toFixed(1)}k</div>
                      </div>
                    )}
                    {champion.avgVision > 0 && (
                      <div className="flex flex-col">
                        <div className="text-white/60 text-[9px]">Vision</div>
                        <div className="text-white font-semibold text-xs">{champion.avgVision.toFixed(0)}</div>
                      </div>
                    )}
                    {champion.avgCS > 0 && (
                      <div className="flex flex-col">
                        <div className="text-white/60 text-[9px]">CS</div>
                        <div className="text-white font-semibold text-xs">{champion.avgCS.toFixed(0)}</div>
                      </div>
                    )}
                    {champion.firstBloodRate > 0 && (
                      <div className="flex flex-col">
                        <div className="text-white/60 text-[9px]">FB Rate</div>
                        <div className="text-white font-semibold text-xs">{champion.firstBloodRate.toFixed(0)}%</div>
                      </div>
                    )}
                    {champion.goldShare > 0 && (
                      <div className="flex flex-col">
                        <div className="text-white/60 text-[9px]">Gold %</div>
                        <div className="text-white font-semibold text-xs">{champion.goldShare.toFixed(0)}%</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Roles Footer */}
                  {champion.roles && champion.roles.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-yellow-500/10 flex items-center gap-1">
                      <div className="text-white/60 text-[9px]">Roles:</div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(new Set(champion.roles as string[])).slice(0, 4).map((role: string, i: number) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 bg-white/10 text-white/80 text-[9px] rounded border border-yellow-500/10"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="mt-1 pt-1 border-t border-yellow-500/10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs">
          <div className="text-center">
            <div className="text-yellow-400 font-semibold text-xs">
              {tierGroups.find(g => g.tier === 'S')?.champions.length || 0}
            </div>
            <div className="text-white/60 text-[9px]">S Tier</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-semibold text-xs">
              {tierGroups.find(g => g.tier === 'A')?.champions.length || 0}
            </div>
            <div className="text-white/60 text-[9px]">A Tier</div>
          </div>
          <div className="text-center">
            <div className="text-blue-400 font-semibold text-xs">
              {tierGroups.find(g => g.tier === 'B')?.champions.length || 0}
            </div>
            <div className="text-white/60 text-[9px]">B Tier</div>
          </div>
          <div className="text-center">
            <div className="text-orange-400 font-semibold text-xs">
              {tierGroups.find(g => g.tier === 'C')?.champions.length || 0}
            </div>
            <div className="text-white/60 text-[9px]">C Tier</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateTierScore(champion: any): number {
  // Weighted scoring system
  const winRateScore = champion.winRate * 0.3;
  const kdaScore = Math.min(champion.avgKDA * 20, 30) * 0.25;
  const damageScore = Math.min(champion.avgDamage / 100, 20) * 0.2;
  const visionScore = Math.min(champion.avgVision * 2, 10) * 0.1;
  const gamesScore = Math.min(champion.games * 2, 15) * 0.1;
  const recentFormScore = champion.recentForm.filter((w: boolean) => w).length * 2 * 0.05;
  
  return winRateScore + kdaScore + damageScore + visionScore + gamesScore + recentFormScore;
}

function groupChampionsIntoTiers(champions: any[]): TierGroup[] {
  if (champions.length === 0) return [];

  const sortedChampions = [...champions].sort((a, b) => b.tierScore - a.tierScore);
  const totalChampions = sortedChampions.length;
  
  // Define tier thresholds
  const sThreshold = Math.ceil(totalChampions * 0.1); // Top 10%
  const aThreshold = Math.ceil(totalChampions * 0.3); // Top 30%
  const bThreshold = Math.ceil(totalChampions * 0.6); // Top 60%
  
  const tiers: TierGroup[] = [
    {
      tier: 'S',
      color: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      champions: sortedChampions.slice(0, sThreshold),
      minGames: 3
    },
    {
      tier: 'A',
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      champions: sortedChampions.slice(sThreshold, aThreshold),
      minGames: 3
    },
    {
      tier: 'B',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      champions: sortedChampions.slice(aThreshold, bThreshold),
      minGames: 3
    },
    {
      tier: 'C',
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      champions: sortedChampions.slice(bThreshold),
      minGames: 3
    }
  ];

  return tiers.filter(tier => tier.champions.length > 0);
}


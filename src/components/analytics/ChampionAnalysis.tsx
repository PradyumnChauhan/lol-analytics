'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

interface Match {
  info: {
    participants: Array<{
      puuid: string;
      championId: number;
      win: boolean;
      kills: number;
      deaths: number;
      assists: number;
      totalDamageDealtToChampions: number;
      goldEarned: number;
      totalMinionsKilled: number;
    }>;
  };
}

interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  chestGranted: boolean;
  lastPlayTime: number;
}

interface ChampionAnalysisProps {
  matches: Match[];
  masteries: ChampionMastery[];
  puuid: string;
}

export function ChampionAnalysis({ matches, masteries, puuid }: ChampionAnalysisProps) {
  const championStats = useMemo(() => {
    const stats: Record<number, {
      championId: number;
      games: number;
      wins: number;
      kills: number;
      deaths: number;
      assists: number;
      damage: number;
      gold: number;
      cs: number;
      mastery?: ChampionMastery;
    }> = {};

    matches.forEach(match => {
      const participant = match.info.participants.find(p => p.puuid === puuid);
      if (!participant) return;

      const { championId } = participant;
      if (!stats[championId]) {
        stats[championId] = {
          championId,
          games: 0,
          wins: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          damage: 0,
          gold: 0,
          cs: 0,
          mastery: masteries.find(m => m.championId === championId)
        };
      }

      const stat = stats[championId];
      stat.games++;
      if (participant.win) stat.wins++;
      stat.kills += participant.kills;
      stat.deaths += participant.deaths;
      stat.assists += participant.assists;
      stat.damage += participant.totalDamageDealtToChampions;
      stat.gold += participant.goldEarned;
      stat.cs += participant.totalMinionsKilled;
    });

    return Object.values(stats)
      .map(stat => ({
        ...stat,
        winRate: (stat.wins / stat.games) * 100,
        avgKills: stat.kills / stat.games,
        avgDeaths: stat.deaths / stat.games,
        avgAssists: stat.assists / stat.games,
        kda: (stat.kills + stat.assists) / Math.max(stat.deaths, 1),
        avgDamage: stat.damage / stat.games,
        avgGold: stat.gold / stat.games,
        avgCs: stat.cs / stat.games
      }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 10);
  }, [matches, masteries, puuid]);

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'bg-green-600';
    if (winRate >= 60) return 'bg-green-500';
    if (winRate >= 50) return 'bg-yellow-500';
    if (winRate >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getMasteryColor = (level: number) => {
    if (level >= 7) return 'bg-purple-600';
    if (level >= 6) return 'bg-purple-500';
    if (level >= 5) return 'bg-blue-500';
    if (level >= 4) return 'bg-blue-400';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-600">
              <th className="text-left py-3 text-slate-400">Champion</th>
              <th className="text-center py-3 text-slate-400">Mastery</th>
              <th className="text-center py-3 text-slate-400">Games</th>
              <th className="text-center py-3 text-slate-400">Win Rate</th>
              <th className="text-center py-3 text-slate-400">Avg KDA</th>
              <th className="text-center py-3 text-slate-400">Avg Damage</th>
              <th className="text-center py-3 text-slate-400">Avg Gold</th>
              <th className="text-center py-3 text-slate-400">Avg CS</th>
            </tr>
          </thead>
          <tbody>
            {championStats.map((champion) => (
              <tr key={champion.championId} className="border-b border-slate-700 hover:bg-slate-800/50">
                <td className="py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-white font-semibold">{champion.championId}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Champion {champion.championId}</p>
                      {champion.mastery && (
                        <p className="text-slate-400 text-xs">
                          {champion.mastery.championPoints.toLocaleString()} points
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                
                <td className="text-center">
                  {champion.mastery ? (
                    <div className="flex flex-col items-center space-y-1">
                      <Badge className={`${getMasteryColor(champion.mastery.championLevel)} text-white`}>
                        Level {champion.mastery.championLevel}
                      </Badge>
                      {champion.mastery.chestGranted && (
                        <span className="text-yellow-400 text-xs">📦</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-xs">No Mastery</span>
                  )}
                </td>
                
                <td className="text-center">
                  <span className="text-white font-semibold">{champion.games}</span>
                </td>
                
                <td className="text-center">
                  <Badge className={`${getWinRateColor(champion.winRate)} text-white`}>
                    {champion.winRate.toFixed(1)}%
                  </Badge>
                </td>
                
                <td className="text-center">
                  <div className="text-white font-mono">
                    <div>{champion.avgKills.toFixed(1)}/{champion.avgDeaths.toFixed(1)}/{champion.avgAssists.toFixed(1)}</div>
                    <div className="text-slate-400 text-xs">KDA: {champion.kda.toFixed(2)}</div>
                  </div>
                </td>
                
                <td className="text-center">
                  <span className="text-red-400 font-mono">
                    {Math.round(champion.avgDamage).toLocaleString()}
                  </span>
                </td>
                
                <td className="text-center">
                  <span className="text-yellow-400 font-mono">
                    {Math.round(champion.avgGold).toLocaleString()}
                  </span>
                </td>
                
                <td className="text-center">
                  <span className="text-blue-400 font-mono">
                    {Math.round(champion.avgCs)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {championStats.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          No champion performance data available
        </div>
      )}
    </div>
  );
}
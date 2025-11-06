'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Award, Target } from 'lucide-react';

interface Match {
  metadata: {
    matchId: string;
  };
  info: {
    participants: Array<{
      puuid: string;
      championId: number;
      win: boolean;
      kills: number;
      deaths: number;
      assists: number;
      totalDamageDealtToChampions: number;
      totalDamageDealt: number;
      totalDamageTaken: number;
      goldEarned: number;
      totalMinionsKilled: number;
      visionScore: number;
      item0: number;
      item1: number;
      item2: number;
      item3: number;
      item4: number;
      item5: number;
      item6: number;
      summoner1Id: number;
      summoner2Id: number;
      perks: {
        styles: Array<{
          selections: Array<{
            perk: number;
          }>;
        }>;
      };
      teamPosition: string;
      lane: string;
      role: string;
    }>;
    gameDuration: number;
    gameCreation: number;
    gameMode: string;
    queueId: number;
  };
}

interface DetailedMatchHistoryProps {
  matches: Match[];
  puuid: string;
}

interface Participant {
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealtToChampions: number;
  visionScore: number;
  goldEarned: number;
  [key: string]: unknown;
}

export function DetailedMatchHistory({ matches, puuid }: DetailedMatchHistoryProps) {
  const getQueueName = (queueId: number) => {
    const queues: Record<number, string> = {
      420: 'Ranked Solo/Duo',
      440: 'Ranked Flex',
      450: 'ARAM',
      400: 'Normal Draft',
      430: 'Normal Blind',
      900: 'URF',
      1020: 'One For All',
    };
    return queues[queueId] || `Queue ${queueId}`;
  };

  const getKDAColor = (kda: number) => {
    if (kda >= 3) return 'text-green-400';
    if (kda >= 2) return 'text-yellow-400';
    if (kda >= 1) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPerformanceScore = (participant: Participant) => {
    const kda = participant.deaths === 0 ? 
      participant.kills + participant.assists : 
      (participant.kills + participant.assists) / participant.deaths;
    
    const damageRatio = participant.totalDamageDealtToChampions / Math.max(participant.goldEarned, 1);
    const totalMinionsKilled = typeof participant.totalMinionsKilled === 'number' ? participant.totalMinionsKilled : 0;
    const csPerMin = totalMinionsKilled / (15); // Assuming 15 min average
    
    return Math.round((kda * 20) + (damageRatio * 1000) + (csPerMin * 2) + (participant.visionScore * 3));
  };

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No detailed match history available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.slice(0, 10).map((match) => {
        const participant = match.info.participants.find(p => p.puuid === puuid);
        if (!participant) return null;

        const kda = participant.deaths === 0 ? 
          participant.kills + participant.assists : 
          (participant.kills + participant.assists) / participant.deaths;

        const performanceScore = getPerformanceScore(participant);
        const items = [
          participant.item0, participant.item1, participant.item2,
          participant.item3, participant.item4, participant.item5, participant.item6
        ].filter(item => item !== 0);

        return (
          <Card key={match.metadata.matchId} className={`bg-slate-800 border-l-4 ${participant.win ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardContent className="p-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Game Result & Champion */}
                <div className="col-span-3">
                  <div className="flex items-center space-x-3">
                    <Badge className={participant.win ? 'bg-green-600' : 'bg-red-600'}>
                      {participant.win ? 'VICTORY' : 'DEFEAT'}
                    </Badge>
                    <div>
                      <p className="text-white font-semibold">Champion {participant.championId}</p>
                      <p className="text-slate-400 text-sm">{participant.teamPosition || participant.lane}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(match.info.gameDuration)}</span>
                    </div>
                    <div>{getQueueName(match.info.queueId)}</div>
                  </div>
                </div>

                {/* KDA */}
                <div className="col-span-2 text-center">
                  <div className="text-white font-bold text-lg">
                    {participant.kills}/{participant.deaths}/{participant.assists}
                  </div>
                  <div className={`text-sm font-semibold ${getKDAColor(kda)}`}>
                    {kda.toFixed(2)} KDA
                  </div>
                </div>

                {/* Damage & Gold */}
                <div className="col-span-2 text-center">
                  <div className="text-red-400 font-semibold">
                    {participant.totalDamageDealtToChampions.toLocaleString()}
                  </div>
                  <div className="text-yellow-400 text-sm">
                    {participant.goldEarned.toLocaleString()}g
                  </div>
                </div>

                {/* CS & Vision */}
                <div className="col-span-2 text-center">
                  <div className="text-blue-400 font-semibold">
                    {participant.totalMinionsKilled} CS
                  </div>
                  <div className="text-purple-400 text-sm flex items-center justify-center space-x-1">
                    <Target className="h-3 w-3" />
                    <span>{participant.visionScore}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="col-span-2">
                  <div className="grid grid-cols-3 gap-1">
                    {items.slice(0, 6).map((itemId, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 bg-slate-600 rounded border border-slate-500 flex items-center justify-center"
                      >
                        <span className="text-xs text-white">{itemId}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Score */}
                <div className="col-span-1 text-center">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center space-x-1">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="text-white font-bold">{performanceScore}</span>
                    </div>
                    <div className="text-xs text-slate-400">Score</div>
                  </div>
                </div>
              </div>

              {/* Additional Stats Row */}
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-slate-400">Damage Taken</div>
                    <div className="text-orange-400 font-semibold">
                      {participant.totalDamageTaken.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400">Total Damage</div>
                    <div className="text-red-400 font-semibold">
                      {participant.totalDamageDealt.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400">CS/Min</div>
                    <div className="text-blue-400 font-semibold">
                      {(participant.totalMinionsKilled / (match.info.gameDuration / 60)).toFixed(1)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400">Match Date</div>
                    <div className="text-slate-300">
                      {new Date(match.info.gameCreation).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
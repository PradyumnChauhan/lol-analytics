'use client';

import React from 'react';
import { Activity, TrendingUp, Zap, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MatchParticipant {
  puuid: string;
  championId: number;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealt: number;
  totalDamageDealtToChampions: number;
  physicalDamageDealtToChampions: number;
  magicDamageDealtToChampions: number;
  trueDamageDealtToChampions: number;
  visionScore: number;
  goldEarned: number;
  totalMinionsKilled: number;
  neutralMinionsKilled?: number;
  win: boolean;
  lane: string;
  role: string;
  teamPosition: string;
  individualPosition: string;
  champLevel: number;
  damageDealtToBuildings: number;
  damageDealtToObjectives: number;
  damageSelfMitigated: number;
  largestKillingSpree: number;
  largestMultiKill: number;
  totalDamageTaken: number;
  totalHeal: number;
  wardsPlaced: number;
  wardsKilled: number;
  teamId: number;
  challenges?: {
    killParticipation?: number;
    visionScorePerMinute?: number;
    controlWardsPlaced?: number;
    wardTakedowns?: number;
    soloKills?: number;
    turretPlatesTaken?: number;
    epicMonsterKillsWithin30SecondsOfSpawn?: number;
    [key: string]: unknown;
  };
}

interface MatchPerformanceAnalysisProps {
  participant: MatchParticipant;
  teamParticipants: MatchParticipant[];
  gameDuration: number;
}

export function MatchPerformanceAnalysis({ participant, teamParticipants, gameDuration }: MatchPerformanceAnalysisProps) {
  const gameDurationMinutes = Math.floor(gameDuration / 60);
  
  // Calculate per-minute statistics
  const damagePerMin = Math.round((participant.totalDamageDealtToChampions || 0) / (gameDurationMinutes || 1));
  const goldPerMin = Math.round((participant.goldEarned || 0) / (gameDurationMinutes || 1));
  const csPerMin = ((participant.totalMinionsKilled + (participant.neutralMinionsKilled || 0)) / (gameDurationMinutes || 1)).toFixed(1);
  const visionPerMin = ((participant.visionScore || 0) / (gameDurationMinutes || 1)).toFixed(1);
  
  // Calculate team rankings
  const damageRank = teamParticipants
    .sort((a, b) => (b.totalDamageDealtToChampions || 0) - (a.totalDamageDealtToChampions || 0))
    .findIndex(p => p.puuid === participant.puuid) + 1;
    
  const goldRank = teamParticipants
    .sort((a, b) => (b.goldEarned || 0) - (a.goldEarned || 0))
    .findIndex(p => p.puuid === participant.puuid) + 1;
    
  const visionRank = teamParticipants
    .sort((a, b) => (b.visionScore || 0) - (a.visionScore || 0))
    .findIndex(p => p.puuid === participant.puuid) + 1;

  // Calculate efficiency metrics
  const damageEfficiency = (participant.goldEarned || 0) > 0 
    ? Math.round((participant.totalDamageDealtToChampions || 0) / (participant.goldEarned || 0) * 1000) / 1000
    : 0;
  
  const survivalRate = (participant.deaths > 0) 
    ? Math.round((gameDurationMinutes / participant.deaths) * 10) / 10
    : gameDurationMinutes;

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Activity className="h-5 w-5 mr-2 text-green-500" />
          Performance Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* KDA Analysis */}
        <div className="p-4 bg-white/5 rounded-lg">
          <h4 className="text-white font-semibold mb-3 flex items-center">
            <Zap className="h-4 w-4 mr-2 text-yellow-500" />
            KDA Breakdown
          </h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{participant.kills}</div>
              <div className="text-xs text-slate-400">Kills</div>
              <div className="text-xs text-slate-300 mt-1">
                {((participant.kills / (gameDurationMinutes || 1)) * 10).toFixed(1)}/10m
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{participant.deaths}</div>
              <div className="text-xs text-slate-400">Deaths</div>
              <div className="text-xs text-slate-300 mt-1">
                {survivalRate}m avg life
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{participant.assists}</div>
              <div className="text-xs text-slate-400">Assists</div>
              <div className="text-xs text-slate-300 mt-1">
                {participant.challenges?.killParticipation 
                  ? `${Math.round(participant.challenges.killParticipation * 100)}% KP`
                  : 'N/A'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Economy Stats */}
        <div className="p-4 bg-white/5 rounded-lg">
          <h4 className="text-white font-semibold mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
            Economy & Farm
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Total Gold</span>
              <span className="text-white font-semibold">
                {(participant.goldEarned || 0).toLocaleString()} ({goldPerMin}/min)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Minion Kills</span>
              <span className="text-white font-semibold">
                {participant.totalMinionsKilled + (participant.neutralMinionsKilled || 0)} ({csPerMin}/min)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Last Hits</span>
              <div className="text-right">
                <span className="text-white font-semibold">{participant.totalMinionsKilled}</span>
                <span className="text-slate-400 text-sm ml-2">+ {participant.neutralMinionsKilled || 0} jungle</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Gold Efficiency</span>
              <span className="text-white font-semibold">
                {damageEfficiency.toFixed(2)} dmg/gold
              </span>
            </div>
          </div>
        </div>

        {/* Team Comparison */}
        <div className="p-4 bg-white/5 rounded-lg">
          <h4 className="text-white font-semibold mb-3 flex items-center">
            <Users className="h-4 w-4 mr-2 text-blue-500" />
            Team Rankings
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Damage Rank</span>
              <div className="flex items-center space-x-2">
                <span className="text-white font-semibold">#{damageRank}/5</span>
                <span className="text-xs text-slate-400">({damagePerMin}/min)</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Gold Rank</span>
              <div className="flex items-center space-x-2">
                <span className="text-white font-semibold">#{goldRank}/5</span>
                <span className="text-xs text-slate-400">({goldPerMin}/min)</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Vision Rank</span>
              <div className="flex items-center space-x-2">
                <span className="text-white font-semibold">#{visionRank}/5</span>
                <span className="text-xs text-slate-400">({visionPerMin}/min)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Combat Efficiency */}
        <div className="p-4 bg-white/5 rounded-lg">
          <h4 className="text-white font-semibold mb-3">Combat Efficiency</h4>
          <div className="space-y-2">
            {participant.largestKillingSpree > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Largest Killing Spree</span>
                <span className="text-white font-semibold">{participant.largestKillingSpree}</span>
              </div>
            )}
            {participant.largestMultiKill > 1 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Largest Multikill</span>
                <span className="text-white font-semibold">
                  {participant.largestMultiKill === 2 ? 'Double Kill' :
                   participant.largestMultiKill === 3 ? 'Triple Kill' :
                   participant.largestMultiKill === 4 ? 'Quadra Kill' :
                   participant.largestMultiKill >= 5 ? 'Penta Kill' :
                   `${participant.largestMultiKill} kills`}
                </span>
              </div>
            )}
            {participant.challenges?.soloKills && participant.challenges.soloKills > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Solo Kills</span>
                <span className="text-white font-semibold">{participant.challenges.soloKills}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Damage Taken</span>
              <span className="text-white font-semibold">
                {Math.round((participant.totalDamageTaken || 0) / 1000)}k
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Damage Mitigated</span>
              <span className="text-white font-semibold">
                {Math.round((participant.damageSelfMitigated || 0) / 1000)}k
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
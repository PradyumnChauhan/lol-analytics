'use client';

import React from 'react';
import { Sword, Shield } from 'lucide-react';
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

interface DamageBreakdownChartProps {
  participant: MatchParticipant;
}

export function DamageBreakdownChart({ participant }: DamageBreakdownChartProps) {
  const physicalDamage = participant.physicalDamageDealtToChampions || 0;
  const magicDamage = participant.magicDamageDealtToChampions || 0;
  const trueDamage = participant.trueDamageDealtToChampions || 0;
  const totalDamage = physicalDamage + magicDamage + trueDamage;

  // Calculate percentages
  const physicalPercent = totalDamage > 0 ? (physicalDamage / totalDamage) * 100 : 0;
  const magicPercent = totalDamage > 0 ? (magicDamage / totalDamage) * 100 : 0;
  const truePercent = totalDamage > 0 ? (trueDamage / totalDamage) * 100 : 0;

  // Damage breakdown colors
  const damageTypes = [
    {
      name: 'Physical',
      value: physicalDamage,
      percent: physicalPercent,
      color: 'bg-orange-500',
      textColor: 'text-orange-400'
    },
    {
      name: 'Magic',
      value: magicDamage,
      percent: magicPercent,
      color: 'bg-blue-500',
      textColor: 'text-blue-400'
    },
    {
      name: 'True',
      value: trueDamage,
      percent: truePercent,
      color: 'bg-purple-500',
      textColor: 'text-purple-400'
    }
  ];

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Sword className="h-5 w-5 mr-2 text-red-500" />
          Damage Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Total Damage Display */}
        <div className="text-center p-4 bg-white/5 rounded-lg">
          <div className="text-3xl font-bold text-white mb-2">
            {Math.round(totalDamage / 1000)}k
          </div>
          <div className="text-sm text-slate-400">Total Champion Damage</div>
        </div>

        {/* Damage Type Breakdown */}
        <div className="space-y-3">
          {damageTypes.map((type, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`font-semibold ${type.textColor}`}>{type.name} Damage</span>
                <span className="text-white text-sm">
                  {Math.round(type.value / 1000)}k ({type.percent.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-3">
                <div 
                  className={`${type.color} h-3 rounded-full transition-all duration-300`}
                  style={{ width: `${type.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Damage Comparison */}
        <div className="p-4 bg-white/5 rounded-lg space-y-3">
          <h4 className="text-white font-semibold mb-3 flex items-center">
            <Shield className="h-4 w-4 mr-2 text-blue-500" />
            Damage Overview
          </h4>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-white">
                {Math.round((participant.totalDamageDealt || 0) / 1000)}k
              </div>
              <div className="text-xs text-slate-400">Total Damage</div>
              <div className="text-xs text-slate-500 mt-1">All sources</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">
                {Math.round((participant.damageDealtToObjectives || 0) / 1000)}k
              </div>
              <div className="text-xs text-slate-400">Objective Damage</div>
              <div className="text-xs text-slate-500 mt-1">Dragons, Baron, etc.</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-white">
                {Math.round((participant.damageDealtToBuildings || 0) / 1000)}k
              </div>
              <div className="text-xs text-slate-400">Structure Damage</div>
              <div className="text-xs text-slate-500 mt-1">Turrets, Inhibitors</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">
                {Math.round((participant.totalDamageTaken || 0) / 1000)}k
              </div>
              <div className="text-xs text-slate-400">Damage Taken</div>
              <div className="text-xs text-slate-500 mt-1">From enemies</div>
            </div>
          </div>
        </div>

        {/* Damage Efficiency */}
        <div className="p-4 bg-white/5 rounded-lg">
          <h4 className="text-white font-semibold mb-3">Efficiency Metrics</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Damage per Gold</span>
              <span className="text-white font-semibold">
                {participant.goldEarned > 0 
                  ? (totalDamage / participant.goldEarned).toFixed(2)
                  : '0.00'
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Damage per Death</span>
              <span className="text-white font-semibold">
                {participant.deaths > 0 
                  ? Math.round(totalDamage / participant.deaths)
                  : Math.round(totalDamage)
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Self Mitigated</span>
              <span className="text-white font-semibold">
                {Math.round((participant.damageSelfMitigated || 0) / 1000)}k
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Healing Done</span>
              <span className="text-white font-semibold">
                {Math.round((participant.totalHeal || 0) / 1000)}k
              </span>
            </div>
          </div>
        </div>

        {/* Visual Damage Distribution */}
        <div className="p-4 bg-white/5 rounded-lg">
          <h4 className="text-white font-semibold mb-3">Damage Distribution</h4>
          <div className="relative">
            {/* Damage bar visualization */}
            <div className="w-full h-8 bg-slate-700/50 rounded-lg overflow-hidden flex">
              {physicalPercent > 0 && (
                <div 
                  className="bg-orange-500 h-full flex items-center justify-center text-xs font-semibold text-white"
                  style={{ width: `${physicalPercent}%` }}
                  title={`Physical: ${Math.round(physicalDamage / 1000)}k (${physicalPercent.toFixed(1)}%)`}
                >
                  {physicalPercent > 15 ? 'PHYS' : ''}
                </div>
              )}
              {magicPercent > 0 && (
                <div 
                  className="bg-blue-500 h-full flex items-center justify-center text-xs font-semibold text-white"
                  style={{ width: `${magicPercent}%` }}
                  title={`Magic: ${Math.round(magicDamage / 1000)}k (${magicPercent.toFixed(1)}%)`}
                >
                  {magicPercent > 15 ? 'MAGIC' : ''}
                </div>
              )}
              {truePercent > 0 && (
                <div 
                  className="bg-purple-500 h-full flex items-center justify-center text-xs font-semibold text-white"
                  style={{ width: `${truePercent}%` }}
                  title={`True: ${Math.round(trueDamage / 1000)}k (${truePercent.toFixed(1)}%)`}
                >
                  {truePercent > 15 ? 'TRUE' : ''}
                </div>
              )}
            </div>
            
            {/* Legend */}
            <div className="flex justify-center space-x-4 mt-3 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span className="text-slate-300">Physical</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-slate-300">Magic</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-slate-300">True</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
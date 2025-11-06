'use client';

import React from 'react';
import { Eye, MapPin, Target, Award } from 'lucide-react';
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

interface VisionAnalysisProps {
  participant: MatchParticipant;
  teamParticipants: MatchParticipant[];
  gameDuration: number;
}

export function VisionAnalysis({ participant, teamParticipants, gameDuration }: VisionAnalysisProps) {
  const gameDurationMinutes = Math.floor(gameDuration / 60);
  
  // Vision statistics
  const visionScore = participant.visionScore || 0;
  const wardsPlaced = participant.wardsPlaced || 0;
  const wardsKilled = participant.wardsKilled || 0;
  const controlWardsPlaced = participant.challenges?.controlWardsPlaced || 0;
  const wardTakedowns = participant.challenges?.wardTakedowns || 0;
  
  // Per-minute calculations
  const visionScorePerMin = gameDurationMinutes > 0 ? (visionScore / gameDurationMinutes).toFixed(1) : '0.0';
  const wardsPlacedPerMin = gameDurationMinutes > 0 ? (wardsPlaced / gameDurationMinutes).toFixed(1) : '0.0';
  const wardsKilledPerMin = gameDurationMinutes > 0 ? (wardsKilled / gameDurationMinutes).toFixed(1) : '0.0';

  // Team vision comparison
  const teamVisionScore = teamParticipants.reduce((sum, p) => sum + (p.visionScore || 0), 0);
  const visionScorePercent = teamVisionScore > 0 ? ((visionScore / teamVisionScore) * 100).toFixed(1) : '0.0';
  
  const visionRank = teamParticipants
    .sort((a, b) => (b.visionScore || 0) - (a.visionScore || 0))
    .findIndex(p => p.puuid === participant.puuid) + 1;

  // Vision efficiency ratings
  const getVisionRating = (score: number, duration: number) => {
    const scorePerMin = duration > 0 ? score / (duration / 60) : 0;
    if (scorePerMin >= 1.5) return { label: 'Excellent', color: 'text-green-400' };
    if (scorePerMin >= 1.0) return { label: 'Good', color: 'text-blue-400' };
    if (scorePerMin >= 0.6) return { label: 'Average', color: 'text-yellow-400' };
    return { label: 'Below Average', color: 'text-red-400' };
  };

  const visionRating = getVisionRating(visionScore, gameDuration);

  // Calculate role-specific vision benchmarks
  const getPositionVisionBenchmark = (position: string) => {
    const benchmarks: Record<string, { min: number; good: number; excellent: number }> = {
      'UTILITY': { min: 25, good: 40, excellent: 55 },
      'JUNGLE': { min: 20, good: 35, excellent: 50 },
      'MIDDLE': { min: 15, good: 25, excellent: 35 },
      'BOTTOM': { min: 10, good: 20, excellent: 30 },
      'TOP': { min: 8, good: 15, excellent: 25 }
    };
    return benchmarks[position] || { min: 15, good: 25, excellent: 35 };
  };

  const benchmark = getPositionVisionBenchmark(participant.individualPosition);
  const visionPerformance = visionScore >= benchmark.excellent ? 'Excellent' :
                           visionScore >= benchmark.good ? 'Good' :
                           visionScore >= benchmark.min ? 'Average' : 'Below Average';

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Eye className="h-5 w-5 mr-2 text-yellow-500" />
          Vision Control Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Vision Score Overview */}
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold">Vision Score</h4>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{visionScore}</div>
              <div className="text-xs text-slate-400">({visionScorePerMin}/min)</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300">Performance Rating</span>
            <span className={`font-semibold ${visionRating.color}`}>
              {visionRating.label}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Position Benchmark</span>
            <span className={`font-semibold ${
              visionPerformance === 'Excellent' ? 'text-green-400' :
              visionPerformance === 'Good' ? 'text-blue-400' :
              visionPerformance === 'Average' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {visionPerformance}
            </span>
          </div>
        </div>

        {/* Ward Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-lg">
            <h4 className="text-white font-semibold mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-green-500" />
              Wards Placed
            </h4>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{wardsPlaced}</div>
              <div className="text-xs text-slate-400 mt-1">
                {wardsPlacedPerMin} per minute
              </div>
              {controlWardsPlaced > 0 && (
                <div className="text-xs text-yellow-400 mt-2">
                  {controlWardsPlaced} control wards
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-lg">
            <h4 className="text-white font-semibold mb-3 flex items-center">
              <Target className="h-4 w-4 mr-2 text-red-500" />
              Wards Destroyed
            </h4>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{wardsKilled}</div>
              <div className="text-xs text-slate-400 mt-1">
                {wardsKilledPerMin} per minute
              </div>
              {wardTakedowns > 0 && wardTakedowns !== wardsKilled && (
                <div className="text-xs text-orange-400 mt-2">
                  {wardTakedowns} takedowns
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Vision Comparison */}
        <div className="p-4 bg-white/5 rounded-lg">
          <h4 className="text-white font-semibold mb-3 flex items-center">
            <Award className="h-4 w-4 mr-2 text-blue-500" />
            Team Vision Contribution
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Team Rank</span>
              <span className="text-white font-semibold">
                #{visionRank}/5
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Vision Share</span>
              <span className="text-white font-semibold">
                {visionScorePercent}%
              </span>
            </div>
            
            {/* Vision score bar */}
            <div className="w-full bg-slate-700/50 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(parseFloat(visionScorePercent), 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Vision Efficiency Breakdown */}
        <div className="p-4 bg-white/5 rounded-lg">
          <h4 className="text-white font-semibold mb-3">Vision Efficiency</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Ward Efficiency</span>
              <span className="text-white font-semibold">
                {wardsPlaced > 0 ? (visionScore / wardsPlaced).toFixed(1) : '0.0'} points/ward
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Vision vs Deaths</span>
              <span className="text-white font-semibold">
                {participant.deaths > 0 ? (visionScore / participant.deaths).toFixed(1) : visionScore.toString()} ratio
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Ward Placement Rate</span>
              <span className="text-white font-semibold">
                {((wardsPlaced / Math.max(gameDurationMinutes, 1)) * 10).toFixed(1)} per 10min
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Ward Clear Rate</span>
              <span className="text-white font-semibold">
                {((wardsKilled / Math.max(gameDurationMinutes, 1)) * 10).toFixed(1)} per 10min
              </span>
            </div>
          </div>
        </div>

        {/* Position-Specific Analysis */}
        <div className="p-4 bg-white/5 rounded-lg">
          <h4 className="text-white font-semibold mb-3">
            {participant.individualPosition} Position Analysis
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Expected Min:</span>
              <span className="text-slate-400">{benchmark.min}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Good Performance:</span>
              <span className="text-blue-400">{benchmark.good}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Excellent Performance:</span>
              <span className="text-green-400">{benchmark.excellent}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Your Score:</span>
              <span className={`font-semibold ${
                visionScore >= benchmark.excellent ? 'text-green-400' :
                visionScore >= benchmark.good ? 'text-blue-400' :
                visionScore >= benchmark.min ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {visionScore}
              </span>
            </div>
          </div>

          {/* Visual progress bar */}
          <div className="mt-3 relative">
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  visionScore >= benchmark.excellent ? 'bg-green-500' :
                  visionScore >= benchmark.good ? 'bg-blue-500' :
                  visionScore >= benchmark.min ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ 
                  width: `${Math.min((visionScore / benchmark.excellent) * 100, 100)}%` 
                }}
              />
            </div>
            
            {/* Benchmark markers */}
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0</span>
              <span>{benchmark.min}</span>
              <span>{benchmark.good}</span>
              <span>{benchmark.excellent}+</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
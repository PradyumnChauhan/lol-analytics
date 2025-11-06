'use client';

import React, { useState } from 'react';
import { X, Clock, Trophy, Target, Eye, Coins, Sword, Shield, Activity, Users, Zap, MessageSquare, MapPin, BarChart3, PieChart, TrendingUp, Award, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MatchPerformanceAnalysis } from './MatchPerformanceAnalysis';
import { DamageBreakdownChart } from './DamageBreakdownChart';
import { VisionAnalysis } from './VisionAnalysis';
import { MatchTimelineChart } from './MatchTimelineChart';
import { ObjectiveTimeline } from './ObjectiveTimeline';
import { ItemBuildTimeline } from './ItemBuildTimeline';
import { RuneAnalysis } from './RuneAnalysis';

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
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
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
  firstBloodKill: boolean;
  firstBloodAssist: boolean;
  firstTowerKill: boolean;
  firstTowerAssist: boolean;
  dragonKills?: number;
  baronKills?: number;
  turretKills?: number;
  inhibitorKills?: number;
  gameEndedInEarlySurrender: boolean;
  gameEndedInSurrender: boolean;
  teamEarlySurrendered: boolean;
  teamId: number;
  
  // Enhanced fields for comprehensive analysis
  spell1Casts: number;
  spell2Casts: number;
  spell3Casts: number;
  spell4Casts: number;
  summoner1Casts: number;
  summoner2Casts: number;
  summoner1Id: number;
  summoner2Id: number;
  
  // Communication (Pings)
  allInPings: number;
  assistMePings: number;
  enemyMissingPings: number;
  enemyVisionPings: number;
  getBackPings: number;
  holdPings: number;
  needVisionPings: number;
  onMyWayPings: number;
  pushPings: number;
  commandPings: number;
  visionClearedPings: number;
  
  // Economy
  goldSpent: number;
  consumablesPurchased: number;
  itemsPurchased: number;
  
  // Vision & Control
  visionWardsBoughtInGame: number;
  sightWardsBoughtInGame: number;
  detectorWardsPlaced: number;
  
  // CC & Control
  timeCCingOthers: number;
  totalTimeCCDealt: number;
  totalTimeSpentDead: number;
  longestTimeSpentLiving: number;
  
  // Support metrics
  totalHealsOnTeammates: number;
  totalDamageShieldedOnTeammates: number;
  totalUnitsHealed: number;
  
  // Multikills
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
  unrealKills: number;
  
  // Objectives
  inhibitorTakedowns: number;
  turretTakedowns: number;
  turretPlatesTaken: number;
  nexusKills: number;
  nexusTakedowns: number;
  
  // Arena/Special modes
  championTransform?: number;
  playerAugment1?: number;
  playerAugment2?: number;
  playerAugment3?: number;
  playerAugment4?: number;
  playerAugment5?: number;
  playerAugment6?: number;
  PlayerScore0?: number;
  PlayerScore1?: number;
  PlayerScore2?: number;
  PlayerScore3?: number;
  PlayerScore4?: number;
  PlayerScore5?: number;
  PlayerScore6?: number;
  PlayerScore7?: number;
  PlayerScore8?: number;
  PlayerScore9?: number;
  PlayerScore10?: number;
  PlayerScore11?: number;
  missions?: {
    playerScore0?: number;
    playerScore1?: number;
    playerScore2?: number;
    [key: string]: any;
  };
  playerSubteamId?: number;
  subteamPlacement?: number;
  
  challenges?: {
    killParticipation?: number;
    visionScorePerMinute?: number;
    controlWardsPlaced?: number;
    wardTakedowns?: number;
    soloKills?: number;
    turretPlatesTaken?: number;
    epicMonsterKillsWithin30SecondsOfSpawn?: number;
    damagePerMinute?: number;
    goldPerMinute?: number;
    kda?: number;
    multikills?: number;
    killingSprees?: number;
    perfectGame?: number;
    legendaryCount?: number;
    [key: string]: unknown;
  };
}

interface MatchData {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];
    platformId?: string;
  };
  info: {
    endOfGameResult: string;
    gameCreation: number;
    gameDuration: number;
    gameEndTimestamp: number;
    gameId: number;
    gameMode: string;
    gameName: string;
    gameStartTimestamp: number;
    gameType: string;
    gameVersion: string;
    mapId: number;
    queueId?: number;
    participants: MatchParticipant[];
    teams?: Array<{
      teamId: number;
      win: boolean;
      bans?: Array<{
        championId: number;
        pickTurn: number;
      }>;
      feats?: {
        FIRST_BLOOD?: { featState: number };
        FIRST_TURRET?: { featState: number };
        EPIC_MONSTER_KILL?: { featState: number };
        [key: string]: { featState: number } | undefined;
      };
      objectives?: {
        baron?: { first: boolean; kills: number };
        dragon?: { first: boolean; kills: number };
        inhibitor?: { first: boolean; kills: number };
        riftHerald?: { first: boolean; kills: number };
        tower?: { first: boolean; kills: number };
        atakhan?: { first: boolean; kills: number };
        horde?: { first: boolean; kills: number };
        champion?: { first: boolean; kills: number };
        [key: string]: { first: boolean; kills: number } | undefined;
      };
    }>;
  };
}

interface MatchDetailPopupProps {
  match: MatchData;
  playerPuuid: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MatchDetailPopup({ match, playerPuuid, isOpen, onClose }: MatchDetailPopupProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!isOpen || !match) return null;

  const participant = match.info.participants.find(p => p.puuid === playerPuuid);
  if (!participant) return null;

  // Calculate game duration
  const gameDurationMinutes = Math.floor(match.info.gameDuration / 60);
  const remainingSeconds = match.info.gameDuration % 60;
  
  // Determine queue type
  const getQueueName = (queueId?: number) => {
    const queueMap: Record<number, string> = {
      420: 'Ranked Solo/Duo',
      440: 'Ranked Flex',
      450: 'ARAM',
      400: 'Normal Draft',
      430: 'Normal Blind',
      1700: 'Arena',
      900: 'URF',
      1020: 'One for All'
    };
    return queueMap[queueId || 0] || match.info.gameMode;
  };

  // Calculate team stats for comparison
  const playerTeam = match.info.participants.filter(p => p.teamId === participant.teamId);
  const enemyTeam = match.info.participants.filter(p => p.teamId !== participant.teamId);
  
  const teamDamage = playerTeam.reduce((sum, p) => sum + (p.totalDamageDealtToChampions || 0), 0);
  const playerDamagePercent = teamDamage > 0 ? ((participant.totalDamageDealtToChampions || 0) / teamDamage * 100) : 0;
  
  const teamGold = playerTeam.reduce((sum, p) => sum + (p.goldEarned || 0), 0);
  const playerGoldPercent = teamGold > 0 ? ((participant.goldEarned || 0) / teamGold * 100) : 0;

  // Calculate CS per minute
  const csPerMin = ((participant.totalMinionsKilled + (participant.neutralMinionsKilled || 0)) / (gameDurationMinutes || 1)).toFixed(1);
  
  // Calculate gold per minute
  const goldPerMin = Math.round((participant.goldEarned || 0) / (gameDurationMinutes || 1));

  // Format time ago
  const timeAgo = new Date(Date.now() - match.info.gameCreation).getTime() < 3600000 ? 
    `${Math.floor((Date.now() - match.info.gameCreation) / 60000)}m ago` :
    `${Math.floor((Date.now() - match.info.gameCreation) / 3600000)}h ago`;

  // Calculate damage breakdown for pie chart
  const damageBreakdown = {
    physical: participant.physicalDamageDealtToChampions || 0,
    magic: participant.magicDamageDealtToChampions || 0,
    true: participant.trueDamageDealtToChampions || 0
  };

  // Calculate total pings
  const totalPings = (participant.allInPings || 0) + (participant.assistMePings || 0) + 
    (participant.enemyMissingPings || 0) + (participant.enemyVisionPings || 0) + 
    (participant.getBackPings || 0) + (participant.holdPings || 0) + 
    (participant.needVisionPings || 0) + (participant.onMyWayPings || 0) + 
    (participant.pushPings || 0) + (participant.commandPings || 0) + 
    (participant.visionClearedPings || 0);

  // Calculate multikills
  const totalMultikills = (participant.doubleKills || 0) + (participant.tripleKills || 0) + 
    (participant.quadraKills || 0) + (participant.pentaKills || 0) + (participant.unrealKills || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2">
      <div className="w-full max-w-6xl h-[95vh] max-h-[900px] backdrop-blur-xl bg-gradient-to-br from-slate-900/95 via-purple-900/30 to-slate-900/95 border border-yellow-500/30 rounded-xl shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-yellow-500/20 bg-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center border-2 border-yellow-500/40">
                {(() => {
                  const { getChampionName } = require('@/lib/champions');
                  const champName = participant.championName || getChampionName(participant.championId);
                  return (
                    <img 
                      src={`https://ddragon.leagueoflegends.com/cdn/14.19.1/img/champion/${champName}.png`}
                      alt={champName}
                      className="w-full h-full rounded-lg object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-xs font-bold text-white">${participant.championId}</span>`;
                        }
                      }}
                    />
                  );
                })()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 bg-slate-900 border-2 border-yellow-500/50 rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-[9px] text-white font-bold">{participant.champLevel || 1}</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {(() => {
                  const { getChampionName } = require('@/lib/champions');
                  return participant.championName || getChampionName(participant.championId);
                })()}
              </h2>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <Badge className={`${participant.win ? 'bg-green-600' : 'bg-red-600'} text-white text-[10px] px-1.5 py-0.5`}>
                  {participant.win ? 'Victory' : 'Defeat'}
                </Badge>
                {match.info.endOfGameResult && (
                  <Badge className="bg-slate-700/50 text-white/80 text-[10px] px-1.5 py-0.5">
                    {match.info.endOfGameResult}
                  </Badge>
                )}
                <span className="text-white/80 flex items-center">
                  <Clock className="h-3 w-3 mr-0.5" />
                  {gameDurationMinutes}m {remainingSeconds}s
                </span>
                <span className="text-white/70">{getQueueName(match.info.queueId)}</span>
                <span className="text-white/60">{timeAgo}</span>
                {match.info.gameVersion && (
                  <span className="text-white/50 text-[9px]">v{match.info.gameVersion.split('.')[0]}.{match.info.gameVersion.split('.')[1]}</span>
                )}
              </div>
            </div>
          </div>
          
          <Button 
            onClick={onClose}
            variant="ghost" 
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/10 rounded-lg p-1.5 h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Enhanced Tabbed Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-2 pt-2 border-b border-yellow-500/10">
              <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-yellow-500/20 rounded-lg p-0.5 gap-0.5">
                <TabsTrigger value="overview" className="text-white text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500/30 data-[state=active]:via-amber-500/20 data-[state=active]:to-yellow-500/30 data-[state=active]:text-yellow-200 data-[state=active]:border-yellow-400/50 border border-transparent rounded py-1 px-1.5">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="damage" className="text-white text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500/30 data-[state=active]:via-amber-500/20 data-[state=active]:to-yellow-500/30 data-[state=active]:text-yellow-200 data-[state=active]:border-yellow-400/50 border border-transparent rounded py-1 px-1.5">
                  <PieChart className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Damage</span>
                </TabsTrigger>
                <TabsTrigger value="objectives" className="text-white text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500/30 data-[state=active]:via-amber-500/20 data-[state=active]:to-yellow-500/30 data-[state=active]:text-yellow-200 data-[state=active]:border-yellow-400/50 border border-transparent rounded py-1 px-1.5">
                  <Trophy className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Objectives</span>
                </TabsTrigger>
                <TabsTrigger value="communication" className="text-white text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500/30 data-[state=active]:via-amber-500/20 data-[state=active]:to-yellow-500/30 data-[state=active]:text-yellow-200 data-[state=active]:border-yellow-400/50 border border-transparent rounded py-1 px-1.5">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Comm</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 p-2">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-1">
                {/* Overview Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 text-center hover:border-yellow-500/40 transition-colors">
                    <div className="text-lg font-bold text-white mb-0.5">
                      {participant.kills}/{participant.deaths}/{participant.assists}
                    </div>
                    <div className="text-xs text-white/60 mb-1">K / D / A</div>
                    <div className={`text-xs font-semibold ${
                      participant.deaths === 0 ? 'text-purple-400' :
                      ((participant.kills + participant.assists) / (participant.deaths || 1)) >= 2.0 ? 'text-green-400' :
                      ((participant.kills + participant.assists) / (participant.deaths || 1)) >= 1.5 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {participant.deaths === 0 ? 'Perfect KDA' : `${((participant.kills + participant.assists) / (participant.deaths || 1)).toFixed(2)} KDA`}
                    </div>
                  </div>

                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 text-center hover:border-yellow-500/40 transition-colors">
                    <div className="text-lg font-bold text-white mb-0.5">
                      {participant.totalDamageDealtToChampions ? Math.round(participant.totalDamageDealtToChampions / 1000) : 0}k
                    </div>
                    <div className="text-xs text-white/60 mb-1">Champion Damage</div>
                    <div className="text-xs text-green-400 font-semibold">
                      {playerDamagePercent > 0 ? `${playerDamagePercent.toFixed(1)}% of team` : 'N/A'}
                    </div>
                  </div>

                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 text-center hover:border-yellow-500/40 transition-colors">
                    <div className="text-lg font-bold text-white mb-0.5">
                      {(participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0)}
                    </div>
                    <div className="text-xs text-white/60 mb-1">CS ({csPerMin}/min)</div>
                    <div className="text-xs text-blue-400 font-semibold">
                      {goldPerMin > 0 ? `${goldPerMin} gold/min` : 'N/A'}
                    </div>
                  </div>

                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 text-center hover:border-yellow-500/40 transition-colors">
                    <div className="text-lg font-bold text-white mb-0.5">
                      {participant.visionScore || 0}
                    </div>
                    <div className="text-xs text-white/60 mb-1">Vision Score</div>
                    <div className="text-xs text-yellow-400 font-semibold">
                      {participant.wardsPlaced || 0} wards placed
                    </div>
                  </div>
                </div>

                {/* Main Analysis Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                  {/* Performance Analysis */}
                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2">
                    <MatchPerformanceAnalysis 
                      participant={participant}
                      teamParticipants={playerTeam}
                      gameDuration={match.info.gameDuration}
                    />
                  </div>

                  {/* Damage Breakdown Chart */}
                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2">
                    <DamageBreakdownChart participant={participant} />
                  </div>
                </div>

                {/* Vision Analysis */}
                <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2">
                  <VisionAnalysis 
                    participant={participant}
                    teamParticipants={playerTeam}
                    gameDuration={match.info.gameDuration}
                  />
                </div>

                {/* Advanced Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                  {/* Objective Control */}
                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 hover:border-yellow-500/40 transition-colors">
                    <div className="flex items-center mb-1 pb-1 border-b border-yellow-500/10">
                      <Target className="h-4 w-4 mr-1.5 text-orange-500" />
                      <h3 className="text-white text-sm font-bold">Objective Control</h3>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 text-xs">🐉 Dragons</span>
                        <span className="text-white font-semibold text-xs">{participant.dragonKills || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 text-xs">🛡️ Barons</span>
                        <span className="text-white font-semibold text-xs">{participant.baronKills || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 text-xs">🏰 Turrets</span>
                        <span className="text-white font-semibold text-xs">{participant.turretKills || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 text-xs">⚡ Inhibitors</span>
                        <span className="text-white font-semibold text-xs">{participant.inhibitorKills || 0}</span>
                      </div>
                      {participant.challenges?.turretPlatesTaken && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/70 text-xs">🪨 Turret Plates</span>
                          <span className="text-white font-semibold text-xs">{participant.challenges.turretPlatesTaken}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Combat Metrics */}
                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 hover:border-yellow-500/40 transition-colors">
                    <div className="flex items-center mb-1 pb-1 border-b border-yellow-500/10">
                      <Sword className="h-4 w-4 mr-1.5 text-red-500" />
                      <h3 className="text-white text-sm font-bold">Combat Metrics</h3>
                    </div>
                    <div className="space-y-1">
                      {participant.largestKillingSpree > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/70 text-xs">Largest Killing Spree</span>
                          <span className="text-white font-semibold text-xs">{participant.largestKillingSpree}</span>
                        </div>
                      )}
                      {participant.largestMultiKill > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/70 text-xs">Largest Multikill</span>
                          <span className="text-white font-semibold text-xs">{participant.largestMultiKill}</span>
                        </div>
                      )}
                      {participant.damageSelfMitigated > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/70 text-xs">Damage Self Mitigated</span>
                          <span className="text-white font-semibold text-xs">
                            {Math.round(participant.damageSelfMitigated / 1000)}k
                          </span>
                        </div>
                      )}
                      {participant.totalHeal > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/70 text-xs">Total Healing</span>
                          <span className="text-white font-semibold text-xs">
                            {Math.round(participant.totalHeal / 1000)}k
                          </span>
                        </div>
                      )}
                      {participant.challenges?.soloKills && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/70 text-xs">Solo Kills</span>
                          <span className="text-white font-semibold text-xs">{participant.challenges.soloKills}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team Comparison */}
                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 hover:border-yellow-500/40 transition-colors">
                    <div className="flex items-center mb-1 pb-1 border-b border-yellow-500/10">
                      <Users className="h-4 w-4 mr-1.5 text-blue-500" />
                      <h3 className="text-white text-sm font-bold">Team Comparison</h3>
                    </div>
                    <div className="space-y-1">
                      {playerDamagePercent > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/70 text-xs">Damage Share</span>
                          <span className="text-white font-semibold text-xs">{playerDamagePercent.toFixed(1)}%</span>
                        </div>
                      )}
                      {playerGoldPercent > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/70 text-xs">Gold Share</span>
                          <span className="text-white font-semibold text-xs">{playerGoldPercent.toFixed(1)}%</span>
                        </div>
                      )}
                      {participant.challenges?.killParticipation && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/70 text-xs">Kill Participation</span>
                          <span className="text-white font-semibold text-xs">
                            {Math.round(participant.challenges.killParticipation * 100)}%
                          </span>
                        </div>
                      )}
                      {participant.challenges?.damagePerMinute && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/70 text-xs">Damage Per Minute</span>
                          <span className="text-white font-semibold text-xs">
                            {Math.round(participant.challenges.damagePerMinute)}
                          </span>
                        </div>
                      )}
                      {participant.challenges?.goldPerMinute && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/70 text-xs">Gold Per Minute</span>
                          <span className="text-white font-semibold text-xs">
                            {Math.round(participant.challenges.goldPerMinute)}
                          </span>
                        </div>
                      )}
                      {participant.challenges?.visionScorePerMinute && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/70 text-xs">Vision Score Per Minute</span>
                          <span className="text-white font-semibold text-xs">
                            {participant.challenges.visionScorePerMinute.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {participant.challenges?.kda && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/70 text-xs">KDA Ratio</span>
                          <span className="text-white font-semibold text-xs">
                            {participant.challenges.kda.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {playerTeam.length > 0 && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-white/70 text-xs">Vision Score Rank</span>
                            <span className="text-white font-semibold text-xs">
                              #{playerTeam.sort((a, b) => (b.visionScore || 0) - (a.visionScore || 0)).findIndex(p => p.puuid === playerPuuid) + 1}/5
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/70 text-xs">Damage Rank</span>
                            <span className="text-white font-semibold text-xs">
                              #{playerTeam.sort((a, b) => (b.totalDamageDealtToChampions || 0) - (a.totalDamageDealtToChampions || 0)).findIndex(p => p.puuid === playerPuuid) + 1}/5
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items & Build */}
                <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 hover:border-yellow-500/40 transition-colors">
                  <div className="flex items-center mb-1 pb-1 border-b border-yellow-500/10">
                    <Shield className="h-4 w-4 mr-1.5 text-purple-500" />
                    <h3 className="text-white text-sm font-bold">Final Build</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white/70 text-xs">Items:</span>
                      <div className="flex gap-1">
                        {[participant.item0, participant.item1, participant.item2, participant.item3, participant.item4, participant.item5, participant.item6].map((itemId, index) => (
                          <div key={index} className={`w-8 h-8 rounded border ${itemId ? 'bg-slate-600 border-yellow-500/30' : 'bg-slate-800 border-slate-700'}`}>
                            {itemId ? (
                              <img 
                                src={`https://ddragon.leagueoflegends.com/cdn/14.19.1/img/item/${itemId}.png`}
                                alt={`Item ${itemId}`}
                                className="w-full h-full rounded object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 rounded text-[9px] flex items-center justify-center text-black font-bold">${itemId.toString().slice(-2)}</div>`;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-800 rounded"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-white font-semibold text-sm">
                        {participant.goldEarned ? Math.round(participant.goldEarned / 1000) : 0}k Gold
                      </div>
                      <div className="text-white/60 text-xs">
                        {goldPerMin > 0 ? `${goldPerMin} per minute` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2">
                    <MatchTimelineChart 
                      timeline={(match as any).timeline || null} 
                      playerPuuid={participant.puuid}
                      teamId={participant.teamId}
                    />
                  </div>
                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2">
                    <ObjectiveTimeline 
                      match={match} 
                      playerPuuid={participant.puuid}
                    />
                  </div>
                </div>
                <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2">
                  <ItemBuildTimeline 
                    match={match} 
                    playerPuuid={participant.puuid}
                  />
                </div>

                {/* Runes */}
                <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2">
                  <RuneAnalysis participant={participant} />
                </div>

                {/* Advanced Metrics - Multikills & Vision */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {/* Multikills & Streaks */}
                  {totalMultikills > 0 && (
                    <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 hover:border-yellow-500/40 transition-colors">
                      <div className="flex items-center mb-1 pb-1 border-b border-yellow-500/10">
                        <Award className="h-4 w-4 mr-1.5 text-purple-500" />
                        <h3 className="text-white text-sm font-bold">Multikills & Streaks</h3>
                      </div>
                      <div className="space-y-1">
                        <div className="grid grid-cols-2 gap-1">
                          {(participant.doubleKills || 0) > 0 && (
                            <div className="text-center p-1.5 bg-white/5 rounded border border-yellow-500/10">
                              <div className="text-sm font-bold text-white">{participant.doubleKills}</div>
                              <div className="text-white/60 text-[10px]">Double Kills</div>
                            </div>
                          )}
                          {(participant.tripleKills || 0) > 0 && (
                            <div className="text-center p-1.5 bg-white/5 rounded border border-yellow-500/10">
                              <div className="text-sm font-bold text-white">{participant.tripleKills}</div>
                              <div className="text-white/60 text-[10px]">Triple Kills</div>
                            </div>
                          )}
                          {(participant.quadraKills || 0) > 0 && (
                            <div className="text-center p-1.5 bg-white/5 rounded border border-yellow-500/10">
                              <div className="text-sm font-bold text-white">{participant.quadraKills}</div>
                              <div className="text-white/60 text-[10px]">Quadra Kills</div>
                            </div>
                          )}
                          {(participant.pentaKills || 0) > 0 && (
                            <div className="text-center p-1.5 bg-white/5 rounded border border-yellow-500/10">
                              <div className="text-sm font-bold text-white">{participant.pentaKills}</div>
                              <div className="text-white/60 text-[10px]">Penta Kills</div>
                            </div>
                          )}
                        </div>
                        {participant.largestKillingSpree > 0 && (
                          <div className="flex justify-between items-center pt-1 mt-1 border-t border-yellow-500/10">
                            <span className="text-white/70 text-xs">Largest Killing Spree</span>
                            <span className="text-white font-semibold text-xs">{participant.largestKillingSpree}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Vision & Control */}
                  {(participant.visionScore > 0 || participant.wardsPlaced > 0 || participant.wardsKilled > 0 || participant.visionWardsBoughtInGame > 0 || participant.timeCCingOthers > 0) && (
                    <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 hover:border-yellow-500/40 transition-colors">
                      <div className="flex items-center mb-1 pb-1 border-b border-yellow-500/10">
                        <Eye className="h-4 w-4 mr-1.5 text-blue-500" />
                        <h3 className="text-white text-sm font-bold">Vision & Control</h3>
                      </div>
                      <div className="space-y-1">
                        {participant.visionScore > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-white/70 text-xs">Vision Score</span>
                            <span className="text-white font-semibold text-xs">{participant.visionScore}</span>
                          </div>
                        )}
                        {participant.wardsPlaced > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-white/70 text-xs">Wards Placed</span>
                            <span className="text-white font-semibold text-xs">{participant.wardsPlaced}</span>
                          </div>
                        )}
                        {participant.wardsKilled > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-white/70 text-xs">Wards Killed</span>
                            <span className="text-white font-semibold text-xs">{participant.wardsKilled}</span>
                          </div>
                        )}
                        {participant.visionWardsBoughtInGame > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-white/70 text-xs">Control Wards</span>
                            <span className="text-white font-semibold text-xs">{participant.visionWardsBoughtInGame}</span>
                          </div>
                        )}
                        {participant.timeCCingOthers > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-white/70 text-xs">CC Time Dealt</span>
                            <span className="text-white font-semibold text-xs">{participant.timeCCingOthers}s</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Damage Tab */}
              <TabsContent value="damage" className="space-y-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                  {/* Damage Breakdown Pie Chart */}
                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 hover:border-yellow-500/40 transition-colors">
                    <div className="flex items-center mb-1 pb-1 border-b border-yellow-500/10">
                      <PieChart className="h-4 w-4 mr-1.5 text-red-500" />
                      <h3 className="text-white text-sm font-bold">Damage Breakdown</h3>
                    </div>
                    <div className="space-y-1">
                      {damageBreakdown.physical > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span className="text-white text-xs">Physical Damage</span>
                          </div>
                          <span className="text-white font-semibold text-xs">
                            {Math.round(damageBreakdown.physical / 1000)}k ({((damageBreakdown.physical / (damageBreakdown.physical + damageBreakdown.magic + damageBreakdown.true || 1)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      )}
                      {damageBreakdown.magic > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span className="text-white text-xs">Magic Damage</span>
                          </div>
                          <span className="text-white font-semibold text-xs">
                            {Math.round(damageBreakdown.magic / 1000)}k ({((damageBreakdown.magic / (damageBreakdown.physical + damageBreakdown.magic + damageBreakdown.true || 1)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      )}
                      {damageBreakdown.true > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                            <span className="text-white text-xs">True Damage</span>
                          </div>
                          <span className="text-white font-semibold text-xs">
                            {Math.round(damageBreakdown.true / 1000)}k ({((damageBreakdown.true / (damageBreakdown.physical + damageBreakdown.magic + damageBreakdown.true || 1)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Damage vs Team */}
                  {playerDamagePercent > 0 && teamDamage > 0 && (
                    <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 hover:border-yellow-500/40 transition-colors">
                      <div className="flex items-center mb-1 pb-1 border-b border-yellow-500/10">
                        <Users className="h-4 w-4 mr-1.5 text-green-500" />
                        <h3 className="text-white text-sm font-bold">Team Damage Share</h3>
                      </div>
                      <div className="space-y-1">
                        <div className="text-center">
                          <div className="text-xl font-bold text-white mb-0.5">
                            {playerDamagePercent.toFixed(1)}%
                          </div>
                          <div className="text-white/60 text-xs">of team's total damage</div>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-green-400 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(playerDamagePercent, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-center text-white/60 text-xs">
                          {participant.totalDamageDealtToChampions ? Math.round(participant.totalDamageDealtToChampions / 1000) : 0}k / {teamDamage ? Math.round(teamDamage / 1000) : 0}k
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Structure Damage */}
                {(participant.damageDealtToBuildings > 0 || participant.damageDealtToObjectives > 0 || participant.totalHeal > 0 || participant.damageSelfMitigated > 0) && (
                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 hover:border-yellow-500/40 transition-colors">
                    <div className="flex items-center mb-1 pb-1 border-b border-yellow-500/10">
                      <Target className="h-4 w-4 mr-1.5 text-orange-500" />
                      <h3 className="text-white text-sm font-bold">Structure & Objective Damage</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                      {participant.damageDealtToBuildings > 0 && (
                        <div className="text-center">
                          <div className="text-base font-bold text-white">
                            {Math.round(participant.damageDealtToBuildings / 1000)}k
                          </div>
                          <div className="text-white/60 text-[10px]">Buildings</div>
                        </div>
                      )}
                      {participant.damageDealtToObjectives > 0 && (
                        <div className="text-center">
                          <div className="text-base font-bold text-white">
                            {Math.round(participant.damageDealtToObjectives / 1000)}k
                          </div>
                          <div className="text-white/60 text-[10px]">Objectives</div>
                        </div>
                      )}
                      {participant.totalHeal > 0 && (
                        <div className="text-center">
                          <div className="text-base font-bold text-white">
                            {Math.round(participant.totalHeal / 1000)}k
                          </div>
                          <div className="text-white/60 text-[10px]">Healing</div>
                        </div>
                      )}
                      {participant.damageSelfMitigated > 0 && (
                        <div className="text-center">
                          <div className="text-base font-bold text-white">
                            {Math.round(participant.damageSelfMitigated / 1000)}k
                          </div>
                          <div className="text-white/60 text-[10px]">Mitigated</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Objectives Tab */}
              <TabsContent value="objectives" className="space-y-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                  {/* Champion Bans */}
                  {match.info.teams && match.info.teams.length > 0 && (
                    <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 hover:border-yellow-500/40 transition-colors">
                      <div className="flex items-center mb-1 pb-1 border-b border-yellow-500/10">
                        <Shield className="h-4 w-4 mr-1.5 text-red-500" />
                        <h3 className="text-white text-sm font-bold">Champion Bans</h3>
                      </div>
                      <div className="space-y-1.5">
                        {match.info.teams.map((team: any, teamIndex: number) => {
                          const { getChampionName } = require('@/lib/champions');
                          const isPlayerTeam = team.teamId === participant.teamId;
                          return (
                            <div key={teamIndex} className="space-y-1">
                              <div className="text-white/70 text-[10px] font-semibold">
                                {isPlayerTeam ? 'Your Team' : 'Enemy Team'}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {team.bans && team.bans.length > 0 ? (
                                  team.bans.map((ban: any, banIndex: number) => (
                                    <div
                                      key={banIndex}
                                      className="w-8 h-8 rounded border border-yellow-500/30 bg-slate-800/50 flex items-center justify-center"
                                      title={getChampionName(ban.championId)}
                                    >
                                      <img
                                        src={`https://ddragon.leagueoflegends.com/cdn/14.19.1/img/champion/${getChampionName(ban.championId)}.png`}
                                        alt={getChampionName(ban.championId)}
                                        className="w-full h-full rounded object-cover opacity-60"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent) {
                                            parent.innerHTML = `<span class="text-[8px] text-white/60">${ban.championId}</span>`;
                                          }
                                        }}
                                      />
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-white/40 text-[10px]">No bans</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Team Feats */}
                  {match.info.teams && match.info.teams.length > 0 && (
                    <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 hover:border-yellow-500/40 transition-colors">
                      <div className="flex items-center mb-1 pb-1 border-b border-yellow-500/10">
                        <Award className="h-4 w-4 mr-1.5 text-purple-500" />
                        <h3 className="text-white text-sm font-bold">Team Achievements</h3>
                      </div>
                      <div className="space-y-1.5">
                        {match.info.teams.map((team: any, teamIndex: number) => {
                          const isPlayerTeam = team.teamId === participant.teamId;
                          const feats = team.feats || {};
                          return (
                            <div key={teamIndex} className="space-y-1">
                              <div className="text-white/70 text-[10px] font-semibold">
                                {isPlayerTeam ? 'Your Team' : 'Enemy Team'}
                              </div>
                              <div className="space-y-0.5">
                                {feats.FIRST_BLOOD && (
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-white/70">First Blood</span>
                                    <Badge className={`text-[9px] px-1 py-0 ${feats.FIRST_BLOOD.featState === 1001 ? 'bg-green-500' : 'bg-slate-600'}`}>
                                      {feats.FIRST_BLOOD.featState === 1001 ? 'Achieved' : 'Missed'}
                                    </Badge>
                                  </div>
                                )}
                                {feats.FIRST_TURRET && (
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-white/70">First Turret</span>
                                    <Badge className={`text-[9px] px-1 py-0 ${feats.FIRST_TURRET.featState === 1001 ? 'bg-green-500' : 'bg-slate-600'}`}>
                                      {feats.FIRST_TURRET.featState === 1001 ? 'Achieved' : 'Missed'}
                                    </Badge>
                                  </div>
                                )}
                                {feats.EPIC_MONSTER_KILL && (
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-white/70">Epic Monster Kill</span>
                                    <Badge className={`text-[9px] px-1 py-0 ${feats.EPIC_MONSTER_KILL.featState === 1 ? 'bg-green-500' : 'bg-slate-600'}`}>
                                      {feats.EPIC_MONSTER_KILL.featState === 1 ? 'Achieved' : 'Missed'}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Objective Control */}
                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 hover:border-yellow-500/40 transition-colors">
                    <div className="flex items-center mb-1 pb-1 border-b border-yellow-500/10">
                      <Trophy className="h-4 w-4 mr-1.5 text-yellow-500" />
                      <h3 className="text-white text-sm font-bold">Objective Control</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="text-center p-1.5 bg-white/5 rounded border border-yellow-500/10">
                        <div className="text-base font-bold text-white">{participant.dragonKills || 0}</div>
                        <div className="text-white/60 text-[10px]">🐉 Dragons</div>
                      </div>
                      <div className="text-center p-1.5 bg-white/5 rounded border border-yellow-500/10">
                        <div className="text-base font-bold text-white">{participant.baronKills || 0}</div>
                        <div className="text-white/60 text-[10px]">🛡️ Barons</div>
                      </div>
                      <div className="text-center p-1.5 bg-white/5 rounded border border-yellow-500/10">
                        <div className="text-base font-bold text-white">{participant.turretKills || 0}</div>
                        <div className="text-white/60 text-[10px]">🏰 Turrets</div>
                      </div>
                      <div className="text-center p-1.5 bg-white/5 rounded border border-yellow-500/10">
                        <div className="text-base font-bold text-white">{participant.inhibitorKills || 0}</div>
                        <div className="text-white/60 text-[10px]">⚡ Inhibitors</div>
                      </div>
                    </div>
                  </div>

                  {/* First Events */}
                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 hover:border-yellow-500/40 transition-colors">
                    <div className="flex items-center mb-1 pb-1 border-b border-yellow-500/10">
                      <Award className="h-4 w-4 mr-1.5 text-purple-500" />
                      <h3 className="text-white text-sm font-bold">First Events</h3>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-xs">First Blood</span>
                        <Badge className={`text-[9px] px-1.5 py-0.5 ${participant.firstBloodKill ? 'bg-red-500' : participant.firstBloodAssist ? 'bg-orange-500' : 'bg-slate-600'}`}>
                          {participant.firstBloodKill ? 'Kill' : participant.firstBloodAssist ? 'Assist' : 'None'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-xs">First Tower</span>
                        <Badge className={`text-[9px] px-1.5 py-0.5 ${participant.firstTowerKill ? 'bg-yellow-500' : participant.firstTowerAssist ? 'bg-orange-500' : 'bg-slate-600'}`}>
                          {participant.firstTowerKill ? 'Kill' : participant.firstTowerAssist ? 'Assist' : 'None'}
                        </Badge>
                      </div>
                      {(participant.challenges?.turretPlatesTaken || 0) > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-white/70 text-xs">Turret Plates</span>
                          <span className="text-white font-semibold text-xs">{participant.challenges?.turretPlatesTaken || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Communication Tab */}
              <TabsContent value="communication" className="space-y-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                  {/* Ping Usage */}
                  {totalPings > 0 && (
                    <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 hover:border-yellow-500/40 transition-colors">
                      <div className="flex items-center mb-1 pb-1 border-b border-yellow-500/10">
                        <MessageSquare className="h-4 w-4 mr-1.5 text-blue-500" />
                        <h3 className="text-white text-sm font-bold">Ping Usage</h3>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white/70 text-xs">Total Pings</span>
                          <span className="text-white font-semibold text-xs">{totalPings}</span>
                        </div>
                        <div className="space-y-0.5">
                          {(participant.allInPings || 0) > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 text-[10px]">All-in Pings</span>
                              <span className="text-white text-xs">{participant.allInPings}</span>
                            </div>
                          )}
                          {(participant.assistMePings || 0) > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 text-[10px]">Assist Me Pings</span>
                              <span className="text-white text-xs">{participant.assistMePings}</span>
                            </div>
                          )}
                          {(participant.enemyMissingPings || 0) > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 text-[10px]">Enemy Missing</span>
                              <span className="text-white text-xs">{participant.enemyMissingPings}</span>
                            </div>
                          )}
                          {(participant.pushPings || 0) > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 text-[10px]">Push Pings</span>
                              <span className="text-white text-xs">{participant.pushPings}</span>
                            </div>
                          )}
                          {(participant.commandPings || 0) > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 text-[10px]">Command Pings</span>
                              <span className="text-white text-xs">{participant.commandPings}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Spell Casts */}
                  {((participant.spell1Casts || 0) > 0 || (participant.spell2Casts || 0) > 0 || (participant.spell3Casts || 0) > 0 || (participant.spell4Casts || 0) > 0) && (
                    <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2 hover:border-yellow-500/40 transition-colors">
                      <div className="flex items-center mb-1 pb-1 border-b border-yellow-500/10">
                        <Zap className="h-4 w-4 mr-1.5 text-yellow-500" />
                        <h3 className="text-white text-sm font-bold">Spell Usage</h3>
                      </div>
                      <div className="space-y-1">
                        <div className="grid grid-cols-2 gap-1">
                          <div className="text-center p-1.5 bg-white/5 rounded border border-yellow-500/10">
                            <div className="text-sm font-bold text-white">{participant.spell1Casts || 0}</div>
                            <div className="text-white/60 text-[10px]">Q Casts</div>
                          </div>
                          <div className="text-center p-1.5 bg-white/5 rounded border border-yellow-500/10">
                            <div className="text-sm font-bold text-white">{participant.spell2Casts || 0}</div>
                            <div className="text-white/60 text-[10px]">W Casts</div>
                          </div>
                          <div className="text-center p-1.5 bg-white/5 rounded border border-yellow-500/10">
                            <div className="text-sm font-bold text-white">{participant.spell3Casts || 0}</div>
                            <div className="text-white/60 text-[10px]">E Casts</div>
                          </div>
                          <div className="text-center p-1.5 bg-white/5 rounded border border-yellow-500/10">
                            <div className="text-sm font-bold text-white">{participant.spell4Casts || 0}</div>
                            <div className="text-white/60 text-[10px]">R Casts</div>
                          </div>
                        </div>
                        {((participant.summoner1Casts || 0) + (participant.summoner2Casts || 0)) > 0 && (
                          <div className="flex justify-between items-center pt-1 mt-1 border-t border-yellow-500/10">
                            <span className="text-white/70 text-xs">Summoner Spells</span>
                            <span className="text-white font-semibold text-xs">
                              {(participant.summoner1Casts || 0) + (participant.summoner2Casts || 0)} total
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
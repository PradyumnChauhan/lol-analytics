'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Eye, Target, Zap, Shield, Sword, ChevronRight } from 'lucide-react';

interface MatchParticipant {
  puuid: string;
  championId: number;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealtToChampions: number;
  visionScore: number;
  goldEarned: number;
  totalMinionsKilled: number;
  neutralMinionsKilled?: number;
  win: boolean;
  champLevel: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  doubleKills?: number;
  tripleKills?: number;
  quadraKills?: number;
  pentaKills?: number;
  firstBloodKill?: boolean;
}

type PerformanceGrade = 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';

interface CompactMatchCardProps {
  match: {
    info: {
      gameDuration: number;
      gameCreation: number;
      gameMode: string;
      queueId?: number;
      participants: MatchParticipant[];
    };
  };
  participant: MatchParticipant;
  onMatchClick: () => void;
  className?: string;
}

const queueTypeMap: Record<number, string> = {
  420: 'Ranked Solo',
  440: 'Ranked Flex',
  400: 'Normal Draft',
  430: 'Normal Blind',
  450: 'ARAM',
  700: 'Clash',
  900: 'URF',
  1700: 'Arena',
  1020: 'One for All',
  1300: 'Nexus Blitz',
  1400: 'Ultimate Spellbook',
  1900: 'URF',
  2000: 'Tutorial 1',
  2010: 'Tutorial 2',
  2020: 'Tutorial 3',
};

const getPerformanceGrade = (participant: MatchParticipant): PerformanceGrade => {
  const kda = participant.deaths > 0 ? (participant.kills + participant.assists) / participant.deaths : participant.kills + participant.assists;
  const winRate = participant.win ? 100 : 0;
  
  if (kda >= 4.0 && winRate >= 70) return 'S+';
  if (kda >= 3.0 && winRate >= 60) return 'S';
  if (kda >= 2.5 && winRate >= 55) return 'A';
  if (kda >= 2.0 && winRate >= 50) return 'B';
  if (kda >= 1.5 && winRate >= 45) return 'C';
  return 'D';
};

const getGradeColor = (grade: PerformanceGrade) => {
  switch (grade) {
    case 'S+': return 'from-yellow-400 to-yellow-600';
    case 'S': return 'from-yellow-500 to-orange-500';
    case 'A': return 'from-green-400 to-green-600';
    case 'B': return 'from-blue-400 to-blue-600';
    case 'C': return 'from-orange-400 to-orange-600';
    case 'D': return 'from-red-400 to-red-600';
  }
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatTimeAgo = (gameCreation: number) => {
  const now = Date.now();
  const diff = now - gameCreation;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export function CompactMatchCard({ match, participant, onMatchClick, className = '' }: CompactMatchCardProps) {
  if (!participant) return null;
  
  const isWin = participant.win;
  const gameDuration = match.info.gameDuration;
  const gameCreation = match.info.gameCreation;
  const queueId = match.info.queueId || 420;
  const queueName = queueTypeMap[queueId] || match.info.gameMode || 'Unknown';
  const performanceGrade = getPerformanceGrade(participant);
  
  const kda = participant.deaths > 0 ? (participant.kills + participant.assists) / participant.deaths : participant.kills + participant.assists;
  const csPerMin = ((participant.totalMinionsKilled + (participant.neutralMinionsKilled || 0)) / (gameDuration / 60)).toFixed(1);
  const damagePerMin = Math.round(participant.totalDamageDealtToChampions / (gameDuration / 60));
  const visionPerMin = (participant.visionScore / (gameDuration / 60)).toFixed(1);
  
  return (
    <div 
      onClick={onMatchClick}
      className={`backdrop-blur-xl bg-white/5 rounded border transition-all duration-200 hover:bg-white/10 cursor-pointer ${
        isWin 
          ? 'border-l-2 border-l-green-500 border-yellow-500/20' 
          : 'border-l-2 border-l-red-500 border-yellow-500/20'
      } ${className}`}
    >
      <div className="p-2.5">
        <div className="flex items-center justify-between gap-2">
          
          {/* Left Section: Grade + Champion + Queue */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Performance Grade */}
            <div className={`w-6 h-6 rounded bg-gradient-to-br ${getGradeColor(performanceGrade)} flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
              {performanceGrade}
            </div>
            
            {/* Champion */}
            <div className="relative">
              <div className="w-8 h-8 rounded overflow-hidden border border-white/20">
                <img 
                  src={`https://ddragon.leagueoflegends.com/cdn/14.19.1/img/champion/${participant.championName || 'Aatrox'}.png`}
                  alt={participant.championName || `Champion ${participant.championId}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">${participant.championId}</div>`;
                    }
                  }}
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 bg-slate-900 border border-slate-600 rounded-full w-3 h-3 flex items-center justify-center">
                <span className="text-xs text-white font-bold">{participant.champLevel}</span>
              </div>
            </div>
            
            {/* Queue & Time */}
            <div className="text-left min-w-[60px]">
              <div className="text-xs text-white/70 font-medium">
                {queueName.replace('Ranked ', '').replace('Normal ', '')}
              </div>
              <div className="text-[10px] text-white/50 flex items-center">
                <Clock className="h-2.5 w-2.5 mr-0.5" />
                {formatTimeAgo(gameCreation)} • {formatDuration(gameDuration)}
              </div>
            </div>
          </div>

          {/* Center Section: Stats - Compact */}
          <div className="flex items-center gap-3 flex-1 justify-center">
            {/* KDA */}
            <div className="text-center">
              <div className="text-base font-bold text-white">
                {participant.kills}/{participant.deaths}/{participant.assists}
              </div>
              <div className="text-xs text-white/60">
                {kda.toFixed(2)} KDA
              </div>
            </div>
            
            {/* Damage */}
            <div className="text-center">
              <div className="text-sm font-semibold text-white flex items-center justify-center">
                <Sword className="h-2.5 w-2.5 mr-0.5 text-red-400" />
                {Math.round(participant.totalDamageDealtToChampions / 1000)}k
              </div>
              <div className="text-[10px] text-white/60">
                {damagePerMin}/min
              </div>
            </div>
            
            {/* CS */}
            <div className="text-center">
              <div className="text-sm font-semibold text-white flex items-center justify-center">
                <Target className="h-2.5 w-2.5 mr-0.5 text-yellow-400" />
                {participant.totalMinionsKilled + (participant.neutralMinionsKilled || 0)}
              </div>
              <div className="text-[10px] text-white/60">
                {csPerMin}/min
              </div>
            </div>
            
            {/* Vision */}
            <div className="text-center">
              <div className="text-sm font-semibold text-white flex items-center justify-center">
                <Eye className="h-2.5 w-2.5 mr-0.5 text-blue-400" />
                {participant.visionScore}
              </div>
              <div className="text-[10px] text-white/60">
                {visionPerMin}/min
              </div>
            </div>
          </div>

          {/* Right Section: Items - Compact */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Items */}
            <div className="flex gap-0.5">
              {[participant.item0, participant.item1, participant.item2, participant.item3, participant.item4, participant.item5].map((itemId, index) => (
                <div key={index} className={`w-4 h-4 rounded border ${itemId ? 'bg-slate-600 border-slate-500' : 'bg-slate-800 border-slate-700'}`}>
                  {itemId ? (
                    <img 
                      src={`https://ddragon.leagueoflegends.com/cdn/14.19.1/img/item/${itemId}.png`}
                      alt={`Item ${itemId}`}
                      className="w-full h-full rounded object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
            
            {/* Badges - Compact */}
            <div className="flex items-center gap-0.5">
              {(participant.doubleKills || 0) + (participant.tripleKills || 0) + (participant.quadraKills || 0) + (participant.pentaKills || 0) > 0 && (
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px] px-2 py-0">
                  {(participant.doubleKills || 0) + (participant.tripleKills || 0) + (participant.quadraKills || 0) + (participant.pentaKills || 0)}
                </Badge>
              )}
              {participant.firstBloodKill && (
                <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-2 py-0">
                  FB
                </Badge>
              )}
            </div>
            
            {/* View Details Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/10 p-1 h-6 w-6"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Match List with Load More functionality
interface CompactMatchCardListProps {
  matches: {
    match: CompactMatchCardProps['match'];
    participant: MatchParticipant;
  }[];
  onMatchClick: (match: CompactMatchCardProps['match']) => void;
  initialCount?: number;
  loadMoreCount?: number;
  className?: string;
}

export function CompactMatchCardList({ 
  matches, 
  onMatchClick, 
  initialCount = 10,
  loadMoreCount = 10,
  className = '' 
}: CompactMatchCardListProps) {
  const [displayCount, setDisplayCount] = React.useState(initialCount);
  const displayedMatches = matches.slice(0, displayCount);
  const hasMore = matches.length > displayCount;
  const remaining = matches.length - displayCount;

  return (
    <div className={`space-y-1 ${className}`}>
      {displayedMatches.map((item, index) => (
        <CompactMatchCard
          key={index}
          match={item.match}
          participant={item.participant}
          onMatchClick={() => onMatchClick(item.match)}
        />
      ))}
      
      {hasMore && (
        <div className="mt-2 pt-2 border-t border-yellow-500/30">
          <Button
            onClick={() => setDisplayCount(prev => Math.min(prev + loadMoreCount, matches.length))}
            variant="ghost"
            size="sm"
            className="w-full text-white bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 border border-yellow-500/40 rounded-lg text-xs h-9 font-semibold shadow-lg hover:shadow-yellow-500/20 transition-all"
          >
            Load More ({remaining} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}

// Mobile version - even more compact
export function CompactMatchCardMobile({ match, participant, onMatchClick, className = '' }: CompactMatchCardProps) {
  if (!participant) return null;
  
  const isWin = participant.win;
  const gameDuration = match.info.gameDuration;
  const gameCreation = match.info.gameCreation;
  const queueId = match.info.queueId || 420;
  const performanceGrade = getPerformanceGrade(participant);
  
  const kda = participant.deaths > 0 ? (participant.kills + participant.assists) / participant.deaths : participant.kills + participant.assists;
  
  return (
    <div 
      onClick={onMatchClick}
      className={`backdrop-blur-xl bg-white/5 rounded-lg border transition-all duration-200 hover:bg-white/10 cursor-pointer ${
        isWin 
          ? 'border-l-4 border-l-green-500 border-white/20' 
          : 'border-l-4 border-l-red-500 border-white/20'
      } ${className}`}
    >
      <div className="p-2">
        <div className="flex items-center justify-between">
          {/* Left: Grade + Champion + KDA */}
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 rounded bg-gradient-to-br ${getGradeColor(performanceGrade)} flex items-center justify-center text-white font-bold text-xs`}>
              {performanceGrade}
            </div>
            
            <div className="w-8 h-8 rounded overflow-hidden border border-white/30">
              <img 
                src={`https://ddragon.leagueoflegends.com/cdn/14.19.1/img/champion/${participant.championName || 'Aatrox'}.png`}
                alt={participant.championName || `Champion ${participant.championId}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-full h-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">${participant.championId}</div>`;
                  }
                }}
              />
            </div>
            
            <div className="text-center">
              <div className="text-sm font-bold text-white">
                {participant.kills}/{participant.deaths}/{participant.assists}
              </div>
              <div className="text-xs text-white/60">
                {kda.toFixed(1)} KDA
              </div>
            </div>
          </div>
          
          {/* Center: Damage + CS */}
          <div className="text-center">
            <div className="text-xs text-white/80">
              {Math.round(participant.totalDamageDealtToChampions / 1000)}k DMG
            </div>
            <div className="text-xs text-white/60">
              {participant.totalMinionsKilled + (participant.neutralMinionsKilled || 0)} CS
            </div>
          </div>
          
          {/* Right: Time + Duration */}
          <div className="text-center">
            <div className="text-xs text-white/60">
              {formatTimeAgo(gameCreation)}
            </div>
            <div className="text-xs text-white/60">
              {formatDuration(gameDuration)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

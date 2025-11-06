'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Clock, 
  Users, 
  Trophy, 
  Eye, 
  Shield, 
  RefreshCw
} from 'lucide-react';
import { TeamComposition } from './TeamComposition';
import { GamePredictions } from './GamePredictions';

interface LiveGameParticipant {
  puuid: string;
  teamId: number;
  spell1Id: number;
  spell2Id: number;
  championId: number;
  profileIconId: number;
  riotId: string;
  bot: boolean;
}

interface BannedChampion {
  championId: number;
  teamId: number;
  pickTurn: number;
}

interface LiveGameData {
  gameId: number;
  mapId: number;
  gameMode: string;
  gameType: string;
  gameQueueConfigId: number;
  participants: LiveGameParticipant[];
  observers?: {
    encryptionKey: string;
  };
  platformId: string;
  bannedChampions: BannedChampion[];
  gameLength: number;
  gameStartTime?: number;
}

interface LiveGameDashboardProps {
  playerPuuid: string;
  liveGameData: LiveGameData | null;
  isLoading: boolean;
  error?: string;
  onRefresh: () => void;
  compact?: boolean; // New prop for compact header display
}

const QUEUE_NAMES: Record<number, string> = {
  420: 'Ranked Solo/Duo',
  440: 'Ranked Flex',
  450: 'ARAM',
  400: 'Normal Draft',
  430: 'Normal Blind',
  700: 'Clash',
  900: 'URF',
  1020: 'One for All',
  1300: 'Nexus Blitz'
};

const GAME_MODES: Record<string, string> = {
  'CLASSIC': 'Summoner\'s Rift',
  'ARAM': 'Howling Abyss',
  'URF': 'Ultra Rapid Fire',
  'ONEFORALL': 'One for All',
  'NEXUSBLITZ': 'Nexus Blitz'
};

export function LiveGameDashboard({ 
  playerPuuid, 
  liveGameData, 
  isLoading, 
  error, 
  onRefresh,
  compact = false 
}: LiveGameDashboardProps) {
  const [gameDuration, setGameDuration] = useState<string>('0:00');

  useEffect(() => {
    if (!liveGameData) return;

    // Set initial game start time (approximate)
    const initialStartTime = Date.now() - (liveGameData.gameLength * 1000);

    // Update game duration every second
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - initialStartTime) / 1000);
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      setGameDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [liveGameData]);

  const getQueueName = (queueId: number) => {
    return QUEUE_NAMES[queueId] || `Queue ${queueId}`;
  };

  const getGameMode = (mode: string) => {
    return GAME_MODES[mode] || mode;
  };

  const findPlayerInGame = () => {
    if (!liveGameData) return null;
    return liveGameData.participants.find(p => p.puuid === playerPuuid);
  };

  const getTeamParticipants = (teamId: number) => {
    if (!liveGameData) return [];
    return liveGameData.participants.filter(p => p.teamId === teamId);
  };

  const playerParticipant = findPlayerInGame();
  const playerTeam = playerParticipant ? getTeamParticipants(playerParticipant.teamId) : [];
  const enemyTeam = playerParticipant ? getTeamParticipants(playerParticipant.teamId === 100 ? 200 : 100) : [];

  // Compact version for header
  if (compact) {
    if (isLoading) {
      return (
        <div className="flex items-center space-x-2 text-white/60">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">Checking...</span>
        </div>
      );
    }

    if (error || !liveGameData) {
      return (
        <Button 
          onClick={onRefresh}
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <Eye className="h-4 w-4 mr-2" />
          <span className="text-sm">Check Live Game</span>
        </Button>
      );
    }

    // Show compact live game indicator
    return (
      <div className="flex items-center space-x-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg px-4 py-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <Play className="h-4 w-4 text-green-400" />
          <span className="text-white font-semibold text-sm">LIVE</span>
        </div>
        <div className="text-white/60 text-sm">
          {gameDuration} • {getQueueName(liveGameData.gameQueueConfigId)}
        </div>
        <Button 
          onClick={onRefresh}
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10 p-1"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Full version for main content
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
            <span className="text-white">Checking for active game...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !liveGameData) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-white/60">
              <Eye className="h-5 w-5" />
              <span>No Live Game Detected</span>
            </div>
            <p className="text-white/40 text-sm">
              {error || 'This player is not currently in a game.'}
            </p>
            <Button 
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Game Header */}
      <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <Play className="h-6 w-6 text-green-400" />
                <CardTitle className="text-white text-xl">Live Game</CardTitle>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                ACTIVE
              </Badge>
            </div>
            <Button 
              onClick={onRefresh}
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Game Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="h-4 w-4 text-blue-400" />
                <span className="text-white/60 text-sm">Duration</span>
              </div>
              <div className="text-white font-bold text-lg">{gameDuration}</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-white/60 text-sm">Queue</span>
              </div>
              <div className="text-white font-semibold text-sm">{getQueueName(liveGameData.gameQueueConfigId)}</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Shield className="h-4 w-4 text-purple-400" />
                <span className="text-white/60 text-sm">Map</span>
              </div>
              <div className="text-white font-semibold text-sm">{getGameMode(liveGameData.gameMode)}</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Users className="h-4 w-4 text-green-400" />
                <span className="text-white/60 text-sm">Players</span>
              </div>
              <div className="text-white font-bold text-lg">{liveGameData.participants.length}</div>
            </div>
          </div>

          {/* Player Status */}
          {playerParticipant && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{playerParticipant.championId}</span>
                </div>
                <div>
                  <div className="text-white font-semibold">Playing as Champion {playerParticipant.championId}</div>
                  <div className="text-white/60 text-sm">
                    Team {playerParticipant.teamId === 100 ? 'Blue' : 'Red'} Side
                  </div>
                </div>
                <div className="ml-auto">
                  <Badge className={`${
                    playerParticipant.teamId === 100 
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}>
                    {playerParticipant.teamId === 100 ? 'Blue Team' : 'Red Team'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Compositions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamComposition 
          title="Blue Team"
          participants={getTeamParticipants(100)}
          teamId={100}
          playerPuuid={playerPuuid}
          bannedChampions={liveGameData.bannedChampions.filter(ban => ban.teamId === 200)} // Enemy bans
        />
        <TeamComposition 
          title="Red Team"
          participants={getTeamParticipants(200)}
          teamId={200}
          playerPuuid={playerPuuid}
          bannedChampions={liveGameData.bannedChampions.filter(ban => ban.teamId === 100)} // Enemy bans
        />
      </div>

      {/* Game Predictions & Analysis */}
      <GamePredictions 
        liveGameData={liveGameData}
        playerTeam={playerTeam}
        enemyTeam={enemyTeam}
        playerPuuid={playerPuuid}
      />
    </div>
  );
}
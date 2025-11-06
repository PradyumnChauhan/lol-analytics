'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  BarChart3, 
  Zap, 
  Users, 
  Trophy,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

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

interface LiveGameData {
  gameId: number;
  mapId: number;
  gameMode: string;
  gameType: string;
  gameQueueConfigId: number;
  participants: LiveGameParticipant[];
  bannedChampions: Array<{
    championId: number;
    teamId: number;
    pickTurn: number;
  }>;
  gameLength: number;
}

interface GamePredictionsProps {
  liveGameData: LiveGameData;
  playerTeam: LiveGameParticipant[];
  enemyTeam: LiveGameParticipant[];
  playerPuuid: string;
}

// Mock champion strength data - in a real implementation, this would come from API or database
const CHAMPION_STRENGTH: Record<number, { 
  winRate: number; 
  difficulty: string; 
  role: string;
  earlyGame: number;
  lateGame: number;
  teamFight: number;
}> = {
  12: { winRate: 52.3, difficulty: 'Easy', role: 'Tank', earlyGame: 7, lateGame: 8, teamFight: 9 },
  234: { winRate: 48.7, difficulty: 'Hard', role: 'Assassin', earlyGame: 8, lateGame: 6, teamFight: 7 },
  157: { winRate: 49.1, difficulty: 'Hard', role: 'Fighter', earlyGame: 6, lateGame: 8, teamFight: 7 },
  110: { winRate: 51.8, difficulty: 'Medium', role: 'ADC', earlyGame: 5, lateGame: 9, teamFight: 8 },
  517: { winRate: 53.2, difficulty: 'Medium', role: 'Support', earlyGame: 7, lateGame: 7, teamFight: 8 }
};

const getChampionStrength = (championId: number) => {
  return CHAMPION_STRENGTH[championId] || {
    winRate: 50.0,
    difficulty: 'Unknown',
    role: 'Unknown',
    earlyGame: 5,
    lateGame: 5,
    teamFight: 5
  };
};

export function GamePredictions({ 
  liveGameData, 
  playerTeam, 
  enemyTeam, 
  playerPuuid 
}: GamePredictionsProps) {
  const playerParticipant = liveGameData.participants.find(p => p.puuid === playerPuuid);
  const isPlayerBlueTeam = playerParticipant?.teamId === 100;

  // Calculate team compositions and strengths
  const getTeamAnalysis = (team: LiveGameParticipant[]) => {
    const champions = team.map(p => getChampionStrength(p.championId));
    
    return {
      avgWinRate: champions.reduce((sum, c) => sum + c.winRate, 0) / champions.length,
      earlyGameStrength: champions.reduce((sum, c) => sum + c.earlyGame, 0) / champions.length,
      lateGameStrength: champions.reduce((sum, c) => sum + c.lateGame, 0) / champions.length,
      teamFightStrength: champions.reduce((sum, c) => sum + c.teamFight, 0) / champions.length,
      roles: champions.map(c => c.role),
      difficulties: champions.map(c => c.difficulty)
    };
  };

  const playerTeamAnalysis = getTeamAnalysis(playerTeam);
  const enemyTeamAnalysis = getTeamAnalysis(enemyTeam);

  // Calculate win probability based on team strengths
  const calculateWinProbability = () => {
    const teamStrength = (playerTeamAnalysis.avgWinRate + 
                         playerTeamAnalysis.earlyGameStrength * 10 + 
                         playerTeamAnalysis.lateGameStrength * 10 + 
                         playerTeamAnalysis.teamFightStrength * 10) / 4;
    
    const enemyStrength = (enemyTeamAnalysis.avgWinRate + 
                          enemyTeamAnalysis.earlyGameStrength * 10 + 
                          enemyTeamAnalysis.lateGameStrength * 10 + 
                          enemyTeamAnalysis.teamFightStrength * 10) / 4;
    
    const totalStrength = teamStrength + enemyStrength;
    return Math.round((teamStrength / totalStrength) * 100);
  };

  const winProbability = calculateWinProbability();
  
  // Predict game length based on team compositions
  const predictGameLength = () => {
    const earlyGameAdvantage = playerTeamAnalysis.earlyGameStrength - enemyTeamAnalysis.earlyGameStrength;
    const lateGameAdvantage = playerTeamAnalysis.lateGameStrength - enemyTeamAnalysis.lateGameStrength;
    
    if (Math.abs(earlyGameAdvantage) > 1.5) {
      return { duration: '25-30 min', reason: 'Early game focused teams' };
    } else if (Math.abs(lateGameAdvantage) > 1.5) {
      return { duration: '35-45 min', reason: 'Late game scaling teams' };
    } else {
      return { duration: '30-35 min', reason: 'Balanced team compositions' };
    }
  };

  const gameLengthPrediction = predictGameLength();

  // Key matchup analysis
  const getKeyMatchups = () => {
    const playerChampion = playerParticipant ? getChampionStrength(playerParticipant.championId) : null;
    const enemyChampions = enemyTeam.map(e => getChampionStrength(e.championId));
    
    if (!playerChampion) return [];
    
    return enemyChampions.map((enemy, index) => ({
      enemyChampionId: enemyTeam[index].championId,
      difficulty: enemy.difficulty,
      advantage: playerChampion.winRate > enemy.winRate ? 'favorable' : 
                playerChampion.winRate < enemy.winRate ? 'difficult' : 'even'
    }));
  };

  const keyMatchups = getKeyMatchups();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Win Probability */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <span>Win Probability</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${
              winProbability >= 60 ? 'text-green-400' :
              winProbability >= 40 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {winProbability}%
            </div>
            <div className="text-white/60 text-sm mb-4">
              {winProbability >= 60 ? 'Favored to Win' :
               winProbability >= 40 ? 'Even Match' : 'Underdog'}
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-white/10 rounded-full h-2 mb-4">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  winProbability >= 60 ? 'bg-green-500' :
                  winProbability >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${winProbability}%` }}
              />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/60">Your Team Avg WR</span>
                <span className="text-white">{playerTeamAnalysis.avgWinRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Enemy Team Avg WR</span>
                <span className="text-white">{enemyTeamAnalysis.avgWinRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Length Prediction */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Target className="h-5 w-5 text-orange-400" />
            <span>Game Duration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">
              {gameLengthPrediction.duration}
            </div>
            <div className="text-white/60 text-sm mb-4">
              {gameLengthPrediction.reason}
            </div>
            
            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white/60 text-xs">Early Game Power</span>
                  <span className={`text-xs font-semibold ${
                    playerTeamAnalysis.earlyGameStrength > enemyTeamAnalysis.earlyGameStrength ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {playerTeamAnalysis.earlyGameStrength > enemyTeamAnalysis.earlyGameStrength ? 'Advantage' : 'Disadvantage'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-400">{playerTeamAnalysis.earlyGameStrength.toFixed(1)}</span>
                  <span className="text-white/60">vs</span>
                  <span className="text-red-400">{enemyTeamAnalysis.earlyGameStrength.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white/60 text-xs">Late Game Power</span>
                  <span className={`text-xs font-semibold ${
                    playerTeamAnalysis.lateGameStrength > enemyTeamAnalysis.lateGameStrength ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {playerTeamAnalysis.lateGameStrength > enemyTeamAnalysis.lateGameStrength ? 'Advantage' : 'Disadvantage'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-400">{playerTeamAnalysis.lateGameStrength.toFixed(1)}</span>
                  <span className="text-white/60">vs</span>
                  <span className="text-red-400">{enemyTeamAnalysis.lateGameStrength.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Fight Analysis */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Users className="h-5 w-5 text-purple-400" />
            <span>Team Fight Power</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className={`text-3xl font-bold mb-2 ${
              playerTeamAnalysis.teamFightStrength > enemyTeamAnalysis.teamFightStrength ? 'text-green-400' :
              playerTeamAnalysis.teamFightStrength < enemyTeamAnalysis.teamFightStrength ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {playerTeamAnalysis.teamFightStrength.toFixed(1)}/10
            </div>
            <div className="text-white/60 text-sm">
              {playerTeamAnalysis.teamFightStrength > enemyTeamAnalysis.teamFightStrength ? 'Team Fight Advantage' :
               playerTeamAnalysis.teamFightStrength < enemyTeamAnalysis.teamFightStrength ? 'Team Fight Disadvantage' : 'Even Team Fights'}
            </div>
          </div>

          {/* Key Matchups */}
          {keyMatchups.length > 0 && (
            <div className="space-y-2">
              <div className="text-white/60 text-xs font-medium mb-2">Key Matchups:</div>
              {keyMatchups.slice(0, 3).map((matchup, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-white/60">vs Champion {matchup.enemyChampionId}</span>
                  <div className="flex items-center space-x-1">
                    {matchup.advantage === 'favorable' ? (
                      <CheckCircle className="h-3 w-3 text-green-400" />
                    ) : matchup.advantage === 'difficult' ? (
                      <AlertTriangle className="h-3 w-3 text-red-400" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    )}
                    <span className={`${
                      matchup.advantage === 'favorable' ? 'text-green-400' :
                      matchup.advantage === 'difficult' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {matchup.advantage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
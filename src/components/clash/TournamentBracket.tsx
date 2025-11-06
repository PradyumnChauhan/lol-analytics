/**
 * TournamentBracket.tsx
 * Component for displaying tournament bracket visualization with match results
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Crown, 
  Sword, 
  Shield,
  Target,
  Award,
  Clock,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Star
} from 'lucide-react';
import { 
  ClashTeam,
  Tournament,
  ClashUtils,
  clashAPI
} from '@/lib/api/endpoints/clash';

interface Match {
  id: string;
  round: number;
  position: number;
  team1: ClashTeam | null;
  team2: ClashTeam | null;
  winner: ClashTeam | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  startTime?: number;
  endTime?: number;
  score?: {
    team1: number;
    team2: number;
  };
}

interface TournamentBracketProps {
  tournamentId: number;
  region?: string;
  playerPuuid?: string;
}

export function TournamentBracket({ tournamentId, region = 'na1', playerPuuid }: TournamentBracketProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<ClashTeam[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const loadTournamentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [tournamentData, teamsData] = await Promise.all([
        clashAPI.getTournamentById(tournamentId, region),
        clashAPI.getTeamsByTournament(tournamentId, region)
      ]);
      
      setTournament(tournamentData);
      setTeams(teamsData);
      
      // Generate bracket matches (mock implementation)
      const generatedMatches = generateBracketMatches(teamsData);
      setMatches(generatedMatches);
      
      console.log('✅ Tournament bracket loaded:', {
        tournament: tournamentData,
        teams: teamsData.length,
        matches: generatedMatches.length
      });
    } catch (err) {
      console.error('❌ Failed to load tournament bracket:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  }, [tournamentId, region]);

  const generateBracketMatches = (teams: ClashTeam[]): Match[] => {
    // Simple single-elimination bracket generation
    const matches: Match[] = [];
    const totalTeams = teams.length;
    
    if (totalTeams === 0) return matches;
    
    // Round 1 - Quarter Finals (if 8 teams) or Semi Finals (if 4 teams)
    const teamsPerMatch = 2;
    let currentRound = 1;
    let currentPosition = 0;
    
    // Create first round matches
    for (let i = 0; i < totalTeams; i += teamsPerMatch) {
      if (i + 1 < totalTeams) {
        matches.push({
          id: `match-r${currentRound}-${currentPosition}`,
          round: currentRound,
          position: currentPosition,
          team1: teams[i],
          team2: teams[i + 1],
          winner: Math.random() > 0.5 ? teams[i] : teams[i + 1], // Random winner for demo
          status: 'COMPLETED',
          startTime: Date.now() - 3600000, // 1 hour ago
          endTime: Date.now() - 1800000, // 30 minutes ago
          score: {
            team1: Math.floor(Math.random() * 3) + 1,
            team2: Math.floor(Math.random() * 3) + 1
          }
        });
        currentPosition++;
      }
    }
    
    // Generate subsequent rounds
    let previousRoundMatches = matches.filter(m => m.round === currentRound);
    
    while (previousRoundMatches.length > 1) {
      currentRound++;
      currentPosition = 0;
      const nextRoundMatches: Match[] = [];
      
      for (let i = 0; i < previousRoundMatches.length; i += 2) {
        if (i + 1 < previousRoundMatches.length) {
          const match1 = previousRoundMatches[i];
          const match2 = previousRoundMatches[i + 1];
          
          nextRoundMatches.push({
            id: `match-r${currentRound}-${currentPosition}`,
            round: currentRound,
            position: currentPosition,
            team1: match1.winner,
            team2: match2.winner,
            winner: currentRound === 2 ? (Math.random() > 0.5 ? match1.winner : match2.winner) : null,
            status: currentRound === 2 ? 'COMPLETED' : 'PENDING',
            startTime: currentRound === 2 ? Date.now() + 1800000 : undefined, // 30 minutes from now
            score: currentRound === 2 ? {
              team1: Math.floor(Math.random() * 3) + 1,
              team2: Math.floor(Math.random() * 3) + 1
            } : undefined
          });
          currentPosition++;
        }
      }
      
      matches.push(...nextRoundMatches);
      previousRoundMatches = nextRoundMatches;
    }
    
    return matches;
  };

  const getRoundName = (round: number, totalRounds: number): string => {
    if (round === totalRounds) return 'Finals';
    if (round === totalRounds - 1) return 'Semi Finals';
    if (round === totalRounds - 2) return 'Quarter Finals';
    return `Round ${round}`;
  };

  const getMatchStatusColor = (status: Match['status']) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'IN_PROGRESS': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'PENDING': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getMatchStatusIcon = (status: Match['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4" />;
      case 'PENDING': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const renderTeamCard = (team: ClashTeam | null, isWinner: boolean = false) => {
    if (!team) {
      return (
        <div className="bg-white/5 border border-white/20 border-dashed rounded-lg p-3 text-center">
          <span className="text-white/40 text-sm">TBD</span>
        </div>
      );
    }

    const isPlayerTeam = team.players.some(p => p.puuid === playerPuuid);
    
    return (
      <div className={`bg-white/5 border rounded-lg p-3 transition-all duration-300 ${
        isWinner ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/20 hover:border-white/40'
      } ${isPlayerTeam ? 'ring-2 ring-blue-500/50' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-white font-semibold text-sm">{team.name}</span>
                {isWinner && <Crown className="h-3 w-3 text-yellow-400" />}
                {isPlayerTeam && <Star className="h-3 w-3 text-blue-400" />}
              </div>
              <div className="flex items-center space-x-1">
                <Badge variant="outline" className="text-xs">
                  [{team.abbreviation}]
                </Badge>
                <Badge className={`text-xs bg-gradient-to-r text-white ${
                  team.tier === 1 ? 'from-yellow-500 to-orange-500' :
                  team.tier === 2 ? 'from-gray-400 to-gray-600' :
                  team.tier === 3 ? 'from-amber-600 to-yellow-700' :
                  'from-green-500 to-emerald-600'
                }`}>
                  Tier {team.tier}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-white/60 text-xs">
            {team.players.length}/5
          </div>
        </div>
      </div>
    );
  };

  const renderMatch = (match: Match) => {
    const isPlayerMatch = match.team1?.players.some(p => p.puuid === playerPuuid) ||
                          match.team2?.players.some(p => p.puuid === playerPuuid);
    
    return (
      <Card 
        key={match.id} 
        className={`bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer ${
          isPlayerMatch ? 'ring-2 ring-blue-500/30' : ''
        }`}
        onClick={() => setSelectedMatch(match)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Badge className={getMatchStatusColor(match.status)}>
              <div className="flex items-center space-x-1">
                {getMatchStatusIcon(match.status)}
                <span className="text-xs">
                  {match.status === 'COMPLETED' ? 'Completed' :
                   match.status === 'IN_PROGRESS' ? 'Live' : 'Pending'}
                </span>
              </div>
            </Badge>
            {match.startTime && (
              <span className="text-white/60 text-xs">
                {new Date(match.startTime).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {renderTeamCard(match.team1, match.winner?.id === match.team1?.id)}
            
            <div className="flex items-center justify-center py-1">
              <div className="flex items-center space-x-2">
                <Sword className="h-4 w-4 text-white/60" />
                {match.score && (
                  <span className="text-white/80 text-sm font-mono">
                    {match.score.team1} - {match.score.team2}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-white/60" />
              </div>
            </div>
            
            {renderTeamCard(match.team2, match.winner?.id === match.team2?.id)}
          </div>
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    loadTournamentData();
  }, [loadTournamentData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-white">Loading Tournament Bracket...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-red-400" />
            <div>
              <h3 className="text-white font-semibold mb-2">Failed to Load Bracket</h3>
              <p className="text-white/60 text-sm mb-4">{error}</p>
              <Button 
                onClick={loadTournamentData}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tournament) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-8 text-center">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-white/40" />
          <h3 className="text-white text-xl font-semibold mb-2">Tournament Not Found</h3>
          <p className="text-white/60">The requested tournament could not be found.</p>
        </CardContent>
      </Card>
    );
  }

  const totalRounds = Math.max(...matches.map(m => m.round));
  const roundMatches = Array.from({ length: totalRounds }, (_, i) => i + 1)
    .map(round => ({
      round,
      name: getRoundName(round, totalRounds),
      matches: matches.filter(m => m.round === round)
    }));

  return (
    <div className="space-y-6">
      {/* Tournament Bracket Header */}
      <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Trophy className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Tournament Bracket</CardTitle>
                <p className="text-white/60 text-sm">
                  Tournament #{tournament.id} • {teams.length} Teams
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-purple-400 border-purple-400">
                {ClashUtils.getTournamentTheme(tournament.themeId).name}
              </Badge>
              <Button 
                onClick={loadTournamentData}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white hover:bg-white/10"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tournament Bracket */}
      {matches.length > 0 ? (
        <div className="space-y-8">
          {roundMatches.map(({ round, name, matches: roundMatchList }) => (
            <div key={round} className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-white text-lg font-semibold">{name}</h3>
                </div>
                <Badge variant="outline" className="text-white/60">
                  {roundMatchList.length} {roundMatchList.length === 1 ? 'Match' : 'Matches'}
                </Badge>
              </div>

              <div className={`grid gap-4 ${
                roundMatchList.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                roundMatchList.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
                'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
              }`}>
                {roundMatchList.map(renderMatch)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-8 text-center">
            <Target className="h-16 w-16 mx-auto mb-4 text-white/40" />
            <h3 className="text-white text-xl font-semibold mb-2">No Matches Available</h3>
            <p className="text-white/60 mb-4">
              Tournament bracket will be available once teams are registered and matches are generated.
            </p>
            <Button 
              onClick={loadTournamentData}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Match Details Modal */}
      {selectedMatch && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Match Details</CardTitle>
              <Button 
                onClick={() => setSelectedMatch(null)}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <h4 className="text-white font-semibold mb-2">Team 1</h4>
                {renderTeamCard(selectedMatch.team1, selectedMatch.winner?.id === selectedMatch.team1?.id)}
              </div>
              <div className="text-center">
                <h4 className="text-white font-semibold mb-2">Team 2</h4>
                {renderTeamCard(selectedMatch.team2, selectedMatch.winner?.id === selectedMatch.team2?.id)}
              </div>
            </div>

            {selectedMatch.score && (
              <div className="text-center bg-white/5 rounded-lg p-4">
                <h4 className="text-white/60 text-sm mb-2">Final Score</h4>
                <div className="text-2xl font-bold text-white">
                  {selectedMatch.score.team1} - {selectedMatch.score.team2}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/5 rounded-lg p-3">
                <span className="text-white/60">Status</span>
                <div className="text-white font-semibold">
                  {selectedMatch.status === 'COMPLETED' ? 'Completed' :
                   selectedMatch.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <span className="text-white/60">Round</span>
                <div className="text-white font-semibold">
                  {getRoundName(selectedMatch.round, totalRounds)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
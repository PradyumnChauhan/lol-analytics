/**
 * TournamentHub.tsx
 * Main component for displaying tournament schedule and upcoming Clash events
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Calendar, 
  Clock, 
  Users, 
  Award,
  Sword,
  Crown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer
} from 'lucide-react';
import { 
  TournamentWithStatus,
  ClashUtils,
  clashAPI
} from '@/lib/api/endpoints/clash';

interface TournamentHubProps {
  playerPuuid?: string;
  region?: string;
  isLoading?: boolean;
}

export function TournamentHub({ playerPuuid: _playerPuuid, region = 'na1', isLoading }: TournamentHubProps) {
  const [tournaments, setTournaments] = useState<TournamentWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [selectedTournament, setSelectedTournament] = useState<TournamentWithStatus | null>(null);

  const loadTournaments = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const tournamentData = await clashAPI.getTournaments(region);
      
      // Enhance tournaments with status and additional info
      const enhancedTournaments: TournamentWithStatus[] = tournamentData.map(tournament => ({
        ...tournament,
        status: ClashUtils.getTournamentStatus(tournament),
        nextPhase: ClashUtils.getNextPhase(tournament),
        timeUntilStart: ClashUtils.getTimeUntilStart(tournament),
        prizePool: ClashUtils.estimatePrizePool(tournament)
      }));

      // Sort by priority
      const sortedTournaments = ClashUtils.sortTournamentsByPriority(enhancedTournaments);
      
      setTournaments(sortedTournaments);
      setLastUpdated(Date.now());
      
      console.log('✅ Tournaments loaded:', sortedTournaments.length);
    } catch (err) {
      console.error('❌ Failed to load tournaments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  }, [region, loading]);

  useEffect(() => {
    loadTournaments();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadTournaments, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadTournaments]);

  const getStatusIcon = (status: TournamentWithStatus['status']) => {
    switch (status) {
      case 'REGISTRATION_OPEN': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'IN_PROGRESS': return <Timer className="h-4 w-4 text-yellow-400" />;
      case 'UPCOMING': return <Clock className="h-4 w-4 text-blue-400" />;
      case 'COMPLETED': return <XCircle className="h-4 w-4 text-gray-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TournamentWithStatus['status']) => {
    switch (status) {
      case 'REGISTRATION_OPEN': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'IN_PROGRESS': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'UPCOMING': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'COMPLETED': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatStatus = (status: TournamentWithStatus['status']) => {
    switch (status) {
      case 'REGISTRATION_OPEN': return 'Registration Open';
      case 'IN_PROGRESS': return 'In Progress';
      case 'UPCOMING': return 'Upcoming';
      case 'COMPLETED': return 'Completed';
      default: return 'Unknown';
    }
  };

  if (isLoading || loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-white">Loading Tournament Data...</span>
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
              <h3 className="text-white font-semibold mb-2">Failed to Load Tournaments</h3>
              <p className="text-white/60 text-sm mb-4">{error}</p>
              <Button 
                onClick={loadTournaments}
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

  return (
    <div className="space-y-6">
      {/* Tournament Hub Header */}
      <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <Trophy className="h-8 w-8 text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Clash Tournaments</CardTitle>
                <p className="text-white/60 text-sm">Compete in team-based tournaments</p>
              </div>
            </div>
            <Button 
              onClick={loadTournaments}
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/10"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        {lastUpdated > 0 && (
          <CardContent className="pt-0">
            <div className="text-white/40 text-xs">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tournament List */}
      {tournaments.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tournaments.map((tournament) => {
            const theme = ClashUtils.getTournamentTheme(tournament.themeId);
            const isActive = tournament.status === 'REGISTRATION_OPEN' || tournament.status === 'IN_PROGRESS';
            
            return (
              <Card 
                key={tournament.id} 
                className={`bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 ${
                  isActive ? 'ring-2 ring-yellow-500/30' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 bg-gradient-to-r ${theme.color} rounded-xl text-white`}>
                        <span className="text-2xl">{theme.icon}</span>
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{theme.name}</CardTitle>
                        <p className="text-white/60 text-sm">{theme.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(tournament.status)}
                      <Badge className={getStatusColor(tournament.status)}>
                        {formatStatus(tournament.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Tournament Schedule */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        <span className="text-white/60 text-sm">Tournament ID</span>
                      </div>
                      <div className="text-white font-semibold">#{tournament.id}</div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Award className="h-4 w-4 text-yellow-400" />
                        <span className="text-white/60 text-sm">Prize Pool</span>
                      </div>
                      <div className="text-white font-semibold text-sm">{tournament.prizePool}</div>
                    </div>
                  </div>

                  {/* Next Phase Info */}
                  {tournament.nextPhase && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-blue-400" />
                          <span className="text-blue-400 font-semibold text-sm">Next Phase</span>
                        </div>
                        <span className="text-white font-bold">
                          {ClashUtils.formatTournamentTime(tournament.nextPhase.startTime)}
                        </span>
                      </div>
                      <div className="text-white/80 text-xs space-y-1">
                        <p>Registration: {new Date(tournament.nextPhase.registrationTime).toLocaleString()}</p>
                        <p>Start Time: {new Date(tournament.nextPhase.startTime).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Tournament Phases */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-white/60" />
                      <span className="text-white/60 text-sm">Tournament Phases</span>
                    </div>
                    <div className="space-y-1">
                      {tournament.schedule.map((phase, index) => {
                        const now = Date.now();
                        const isCurrentPhase = phase.startTime <= now && (
                          index === tournament.schedule.length - 1 || 
                          tournament.schedule[index + 1].startTime > now
                        );
                        const isPastPhase = phase.startTime < now && !isCurrentPhase;
                        
                        return (
                          <div 
                            key={phase.id} 
                            className={`flex items-center justify-between p-2 rounded text-sm ${
                              isCurrentPhase ? 'bg-yellow-500/20 border border-yellow-500/30' :
                              isPastPhase ? 'bg-green-500/20 border border-green-500/30' :
                              'bg-white/5 border border-white/10'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                isCurrentPhase ? 'bg-yellow-400' :
                                isPastPhase ? 'bg-green-400' :
                                'bg-gray-400'
                              }`} />
                              <span className="text-white">Phase {index + 1}</span>
                              {phase.cancelled && (
                                <Badge variant="destructive" className="text-xs">Cancelled</Badge>
                              )}
                            </div>
                            <span className="text-white/60 text-xs">
                              {new Date(phase.startTime).toLocaleDateString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    {tournament.status === 'REGISTRATION_OPEN' && (
                      <Button className="flex-1 bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30">
                        <Users className="h-4 w-4 mr-2" />
                        Register Team
                      </Button>
                    )}
                    <Button 
                      onClick={() => setSelectedTournament(tournament)}
                      variant="outline" 
                      className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Sword className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-white/40" />
            <h3 className="text-white text-xl font-semibold mb-2">No Tournaments Available</h3>
            <p className="text-white/60 mb-4">
              There are currently no Clash tournaments scheduled. Check back later for upcoming events!
            </p>
            <Button 
              onClick={loadTournaments}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tournament Info Footer */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4 text-white/60 text-sm">
            <div className="flex items-center space-x-2">
              <Crown className="h-4 w-4 text-yellow-400" />
              <span>Clash is League&apos;s premier tournament mode</span>
            </div>
            <div className="text-white/40">•</div>
            <div>Form a team of 5 and compete for exclusive rewards</div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Details Modal */}
      {selectedTournament && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Tournament Details</CardTitle>
              <Button 
                onClick={() => setSelectedTournament(null)}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tournament Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-semibold mb-2">Tournament Information</h4>
                  <div className="bg-white/5 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Tournament ID</span>
                      <span className="text-white font-semibold">#{selectedTournament.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Theme</span>
                      <span className="text-white font-semibold">
                        {ClashUtils.getTournamentTheme(selectedTournament.themeId).name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Status</span>
                      <Badge className={getStatusColor(selectedTournament.status)}>
                        {formatStatus(selectedTournament.status)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Prize Pool</span>
                      <span className="text-white font-semibold">{selectedTournament.prizePool}</span>
                    </div>
                  </div>
                </div>

                {/* Next Phase */}
                {selectedTournament.nextPhase && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">Next Phase</h4>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-300">Registration Opens</span>
                          <span className="text-white">
                            {new Date(selectedTournament.nextPhase.registrationTime).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-300">Tournament Starts</span>
                          <span className="text-white">
                            {new Date(selectedTournament.nextPhase.startTime).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tournament Schedule */}
              <div>
                <h4 className="text-white font-semibold mb-2">Tournament Schedule</h4>
                <div className="space-y-2">
                  {selectedTournament.schedule.map((phase, index) => {
                    const now = Date.now();
                    const isCurrentPhase = phase.startTime <= now && (
                      index === selectedTournament.schedule.length - 1 || 
                      selectedTournament.schedule[index + 1].startTime > now
                    );
                    const isPastPhase = phase.startTime < now && !isCurrentPhase;
                    
                    return (
                      <div 
                        key={phase.id} 
                        className={`p-3 rounded-lg border ${
                          isCurrentPhase ? 'bg-yellow-500/20 border-yellow-500/30' :
                          isPastPhase ? 'bg-green-500/20 border-green-500/30' :
                          'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              isCurrentPhase ? 'bg-yellow-400' :
                              isPastPhase ? 'bg-green-400' :
                              'bg-gray-400'
                            }`} />
                            <span className="text-white font-semibold">Phase {index + 1}</span>
                            {phase.cancelled && (
                              <Badge variant="destructive" className="text-xs">Cancelled</Badge>
                            )}
                          </div>
                          <span className={`text-xs ${
                            isCurrentPhase ? 'text-yellow-300' :
                            isPastPhase ? 'text-green-300' :
                            'text-white/60'
                          }`}>
                            {isCurrentPhase ? 'LIVE' : isPastPhase ? 'COMPLETED' : 'UPCOMING'}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between text-white/80">
                            <span>Registration:</span>
                            <span>{new Date(phase.registrationTime).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-white/80">
                            <span>Start Time:</span>
                            <span>{new Date(phase.startTime).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-white/10">
              {selectedTournament.status === 'REGISTRATION_OPEN' && (
                <Button className="bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30">
                  <Users className="h-4 w-4 mr-2" />
                  Register for Tournament
                </Button>
              )}
              <Button 
                onClick={() => setSelectedTournament(null)}
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
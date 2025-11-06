/**
 * TeamRegistration.tsx
 * Component for team management interface with player registration and role assignment
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Crown, 
  Shield, 
  Settings,
  UserPlus,
  Search,
  Check,
  X,
  AlertCircle,
  Trophy,
  Target,
  Award
} from 'lucide-react';
import { 
  ClashTeam,
  TournamentPosition,
  ClashUtils,
  clashAPI
} from '@/lib/api/endpoints/clash';

interface TeamRegistrationProps {
  playerPuuid?: string;
  region?: string;
  tournamentId?: number;
  onTeamCreated?: (team: ClashTeam) => void;
  onTeamJoined?: (team: ClashTeam) => void;
}

interface TeamFormData {
  name: string;
  tag: string;
  iconId: number;
  iconColorId: number;
}

const ROLE_ICONS = {
  TOP: '🛡️',
  JUNGLE: '🌿',
  MIDDLE: '⚡',
  BOTTOM: '🏹',
  UTILITY: '💎'
};

const ROLE_NAMES = {
  TOP: 'Top Lane',
  JUNGLE: 'Jungle',
  MIDDLE: 'Mid Lane', 
  BOTTOM: 'ADC',
  UTILITY: 'Support'
};

const TIER_COLORS = {
  1: 'from-yellow-500 to-orange-500', // Highest tier
  2: 'from-gray-400 to-gray-600',
  3: 'from-amber-600 to-yellow-700',
  4: 'from-green-500 to-emerald-600'  // Lowest tier
};

export function TeamRegistration({ 
  playerPuuid, 
  region = 'na1', 
  tournamentId: _tournamentId,
  onTeamCreated,
  onTeamJoined 
}: TeamRegistrationProps) {
  const [userTeams, setUserTeams] = useState<ClashTeam[]>([]);
  const [availableTeams, setAvailableTeams] = useState<ClashTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    tag: '',
    iconId: 1,
    iconColorId: 1
  });

  const loadUserTeams = useCallback(async () => {
    if (!playerPuuid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const teams = await clashAPI.getPlayerTeams(playerPuuid, region);
      setUserTeams(teams);
      console.log('✅ User teams loaded:', teams.length);
    } catch (err) {
      console.error('❌ Failed to load user teams:', err);
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [playerPuuid, region]);

  const searchTeams = async (query: string) => {
    if (!query.trim()) {
      setAvailableTeams([]);
      return;
    }
    
    try {
      // Mock team search - in real implementation would call API
      const mockTeams: ClashTeam[] = [
        {
          id: 'mock-team-1',
          tournamentId: 1,
          name: 'Dragon Slayers',
          abbreviation: 'DRAG',
          iconId: 1,
          tier: 2,
          captain: 'captain-puuid',
          players: [
            {
              puuid: 'player-1',
              teamId: 'mock-team-1',
              position: 'TOP' as TournamentPosition,
              role: 'CAPTAIN' as const
            }
          ]
        }
      ];
      
      const filtered = mockTeams.filter(team => 
        team.name.toLowerCase().includes(query.toLowerCase()) ||
        team.abbreviation.toLowerCase().includes(query.toLowerCase())
      );
      
      setAvailableTeams(filtered);
    } catch (err) {
      console.error('❌ Failed to search teams:', err);
    }
  };

  const createTeam = async () => {
    if (!playerPuuid || !formData.name.trim() || !formData.tag.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const newTeam = await clashAPI.createTeam(playerPuuid, {
        name: formData.name,
        tag: formData.tag,
        iconId: formData.iconId,
        iconColorId: formData.iconColorId
      }, region);
      
      setUserTeams(prev => [...prev, newTeam]);
      setShowCreateForm(false);
      setFormData({ name: '', tag: '', iconId: 1, iconColorId: 1 });
      
      onTeamCreated?.(newTeam);
      console.log('✅ Team created:', newTeam);
    } catch (err) {
      console.error('❌ Failed to create team:', err);
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const joinTeam = async (teamId: string) => {
    if (!playerPuuid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedTeam = await clashAPI.addPlayerToTeam(teamId, playerPuuid, region);
      setUserTeams(prev => [...prev, updatedTeam]);
      
      onTeamJoined?.(updatedTeam);
      console.log('✅ Joined team:', updatedTeam);
    } catch (err) {
      console.error('❌ Failed to join team:', err);
      setError(err instanceof Error ? err.message : 'Failed to join team');
    } finally {
      setLoading(false);
    }
  };

  const leaveTeam = async (teamId: string) => {
    if (!playerPuuid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await clashAPI.removePlayerFromTeam(teamId, playerPuuid, region);
      setUserTeams(prev => prev.filter(team => team.id !== teamId));
      console.log('✅ Left team:', teamId);
    } catch (err) {
      console.error('❌ Failed to leave team:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserTeams();
  }, [loadUserTeams]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchTeams(searchQuery);
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const renderTeamCard = (team: ClashTeam, isUserTeam: boolean = false) => {
    const tierGradient = TIER_COLORS[team.tier as keyof typeof TIER_COLORS] || TIER_COLORS[4];
    const isPlayerCaptain = team.captain === playerPuuid;
    const playerInTeam = team.players.some(p => p.puuid === playerPuuid);
    
    return (
      <Card key={team.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 bg-gradient-to-r ${tierGradient} rounded-xl text-white`}>
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-white text-lg">{team.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    [{team.abbreviation}]
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={`bg-gradient-to-r ${tierGradient} text-white text-xs`}>
                    Tier {team.tier}
                  </Badge>
                  {isPlayerCaptain && (
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400 text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      Captain
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-white/60">
                {team.players.length}/5
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Team Roster */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-white/60" />
              <span className="text-white/60 text-sm">Team Roster</span>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {(['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as TournamentPosition[]).map(position => {
                const player = team.players.find(p => p.position === position);
                const isEmpty = !player;
                
                return (
                  <div 
                    key={position} 
                    className={`p-3 rounded-lg border text-center ${
                      isEmpty 
                        ? 'bg-white/5 border-white/20 border-dashed' 
                        : 'bg-white/10 border-white/30'
                    }`}
                  >
                    <div className="text-lg mb-1">{ROLE_ICONS[position]}</div>
                    <div className="text-xs text-white/60 mb-1">{ROLE_NAMES[position]}</div>
                    {player ? (
                      <div className="flex items-center justify-center space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <span className="text-white text-xs">Filled</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        <span className="text-white/40 text-xs">Open</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Stats */}
          {isUserTeam && (
            <div className="bg-white/5 rounded-lg p-3">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Trophy className="h-4 w-4 mx-auto mb-1 text-yellow-400" />
                  <div className="text-white font-semibold text-sm">
                    {ClashUtils.calculateTeamStats(team).wins}
                  </div>
                  <div className="text-white/60 text-xs">Wins</div>
                </div>
                <div>
                  <Target className="h-4 w-4 mx-auto mb-1 text-blue-400" />
                  <div className="text-white font-semibold text-sm">
                    {ClashUtils.calculateTeamStats(team).losses}
                  </div>
                  <div className="text-white/60 text-xs">Losses</div>
                </div>
                <div>
                  <Award className="h-4 w-4 mx-auto mb-1 text-purple-400" />
                  <div className="text-white font-semibold text-sm">
                    {ClashUtils.calculateTeamStats(team).tournaments}
                  </div>
                  <div className="text-white/60 text-xs">Tournaments</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {isUserTeam ? (
              <>
                {isPlayerCaptain && (
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                )}
                <Button 
                  onClick={() => leaveTeam(team.id)}
                  variant="outline" 
                  className="flex-1 bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Leave
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => joinTeam(team.id)}
                className="flex-1 bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
                disabled={loading || playerInTeam || team.players.length >= 5}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {team.players.length >= 5 ? 'Team Full' : 'Join Team'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Team Registration Header */}
      <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Team Management</CardTitle>
                <p className="text-white/60 text-sm">Create or join a Clash team</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Team Form */}
      {showCreateForm && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Create New Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Team Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter team name"
                  className="bg-white/10 border-white/20 text-white"
                  maxLength={16}
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Team Tag</label>
                <Input
                  value={formData.tag}
                  onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value.toUpperCase() }))}
                  placeholder="TAG"
                  className="bg-white/10 border-white/20 text-white"
                  maxLength={5}
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={createTeam}
                disabled={loading || !formData.name.trim() || !formData.tag.trim()}
                className="bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
              >
                <Check className="h-4 w-4 mr-2" />
                Create Team
              </Button>
              <Button 
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Teams */}
      {userTeams.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            <h3 className="text-white text-lg font-semibold">My Teams</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {userTeams.map(team => renderTeamCard(team, true))}
          </div>
        </div>
      )}

      {/* Find Teams */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-blue-400" />
          <h3 className="text-white text-lg font-semibold">Find Teams</h3>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams by name or tag..."
            className="pl-10 bg-white/10 border-white/20 text-white"
          />
        </div>

        {availableTeams.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {availableTeams.map(team => renderTeamCard(team, false))}
          </div>
        )}

        {searchQuery && availableTeams.length === 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-white/40" />
              <h3 className="text-white font-semibold mb-2">No Teams Found</h3>
              <p className="text-white/60">No teams match your search criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
          <span className="text-white">Loading...</span>
        </div>
      )}
    </div>
  );
}
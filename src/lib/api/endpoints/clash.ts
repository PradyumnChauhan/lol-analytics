/**
 * CLASH-V1 API Integration
 * Provides access to Clash tournaments, teams, and player data
 */

// Clash Tournament Types
export interface Tournament {
  id: number;
  themeId: number;
  nameKey: string;
  nameKeySecondary: string;
  schedule: TournamentPhase[];
}

export interface TournamentPhase {
  id: number;
  registrationTime: number;
  startTime: number;
  cancelled: boolean;
}

export interface ClashTeam {
  id: string;
  tournamentId: number;
  name: string;
  iconId: number;
  tier: number; // 1-4 (API uses int)
  captain: string; // puuid
  abbreviation: string;
  players: ClashPlayer[];
}

export interface ClashPlayer {
  puuid: string;
  teamId?: string;
  position: Position;
  role: Role;
}

export type Position = 'UNSELECTED' | 'FILL' | 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';
export type TournamentPosition = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';
export type Role = 'CAPTAIN' | 'MEMBER';

export interface ClashTournamentTeam {
  id: string;
  tournamentId: number;
  name: string;
  iconId: number;
  tier: number; // 1-4 (API uses int)
  captain: string;
  abbreviation: string;
  players: ClashPlayer[];
}

// Enhanced types for display
export interface TournamentWithStatus extends Tournament {
  status: 'UPCOMING' | 'REGISTRATION_OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  nextPhase?: TournamentPhase;
  playerRegistrationStatus?: 'NOT_REGISTERED' | 'REGISTERED' | 'TEAM_FULL';
  timeUntilStart?: number;
  prizePool?: string;
}

export interface TeamWithStats extends ClashTeam {
  wins: number;
  losses: number;
  averageTier: number;
  lastPlayed?: number;
  teamRanking?: number;
}

// Tournament themes and metadata
export const TOURNAMENT_THEMES = {
  1: {
    name: 'Clash Cup',
    description: 'Standard Clash tournament',
    icon: '🏆',
    color: 'from-yellow-500 to-orange-500'
  },
  2: {
    name: 'Clash Royale',
    description: 'Premium tournament with enhanced rewards',
    icon: '👑',
    color: 'from-purple-500 to-pink-500'
  },
  3: {
    name: 'Championship Series',
    description: 'Elite competitive tournament',
    icon: '⚔️',
    color: 'from-red-500 to-orange-500'
  }
} as const;

// Team tier information
export const TEAM_TIERS = {
  1: { name: 'Iron', color: 'text-gray-400', bg: 'bg-gray-600' },
  2: { name: 'Bronze', color: 'text-amber-600', bg: 'bg-amber-600' },
  3: { name: 'Silver', color: 'text-slate-400', bg: 'bg-slate-400' },
  4: { name: 'Gold', color: 'text-yellow-500', bg: 'bg-yellow-500' },
  5: { name: 'Platinum', color: 'text-teal-500', bg: 'bg-teal-500' },
  6: { name: 'Diamond', color: 'text-blue-500', bg: 'bg-blue-500' },
  7: { name: 'Master', color: 'text-purple-500', bg: 'bg-purple-500' },
  8: { name: 'Grandmaster', color: 'text-red-500', bg: 'bg-red-500' },
  9: { name: 'Challenger', color: 'text-orange-500', bg: 'bg-orange-500' }
} as const;

// Position icons and colors
export const POSITION_INFO = {
  TOP: { name: 'Top', icon: '⚔️', color: 'text-red-500' },
  JUNGLE: { name: 'Jungle', icon: '🌲', color: 'text-green-500' },
  MIDDLE: { name: 'Mid', icon: '🔮', color: 'text-blue-500' },
  BOTTOM: { name: 'ADC', icon: '🏹', color: 'text-yellow-500' },
  UTILITY: { name: 'Support', icon: '🛡️', color: 'text-cyan-500' },
  FILL: { name: 'Fill', icon: '⭐', color: 'text-purple-500' },
  UNSELECTED: { name: 'Unselected', icon: '❓', color: 'text-gray-500' }
} as const;

/**
 * Clash API Service Class
 */
export class ClashAPI {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  }

  /**
   * Get all tournaments
   */
  async getTournaments(region: string = 'na1'): Promise<Tournament[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/clash/v1/tournaments?region=${region}`);
      
      if (!response.ok) {
        console.warn(`API fetch failed, using mock data: ${response.status}`);
        return this.getMockTournaments();
      }
      
      const tournaments = await response.json();
      
      // If API returns empty or no tournaments, provide mock data
      if (!tournaments || tournaments.length === 0) {
        console.log('No active tournaments found, providing mock data');
        return this.getMockTournaments();
      }
      
      return tournaments;
    } catch (error) {
      console.warn('Failed to fetch tournaments, using mock data:', error);
      return this.getMockTournaments();
    }
  }

  /**
   * Get tournament by ID
   */
  async getTournamentById(tournamentId: number, region: string = 'na1'): Promise<Tournament> {
    try {
      const response = await fetch(`${this.baseUrl}/api/clash/v1/tournaments/${tournamentId}?region=${region}`);
      
      if (!response.ok) {
        console.warn(`API fetch failed, using mock data: ${response.status}`);
        return this.getMockTournaments().find(t => t.id === tournamentId) || this.getMockTournaments()[0];
      }
      
      const tournament = await response.json();
      return tournament;
    } catch (error) {
      console.warn('Failed to fetch tournament, using mock data:', error);
      return this.getMockTournaments().find(t => t.id === tournamentId) || this.getMockTournaments()[0];
    }
  }

  /**
   * Get team by ID
   */
  async getTeamById(teamId: string, region: string = 'na1'): Promise<ClashTeam> {
    const response = await fetch(`${this.baseUrl}/api/clash/v1/teams/${teamId}?region=${region}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch team: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Get teams by tournament ID
   */
  async getTeamsByTournament(tournamentId: number, region: string = 'na1'): Promise<ClashTournamentTeam[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/clash/v1/tournaments/${tournamentId}/teams?region=${region}`);
      
      if (!response.ok) {
        console.warn(`API fetch failed, using mock teams: ${response.status}`);
        return this.getMockTeams(tournamentId);
      }
      
      const teams = await response.json();
      
      // If API returns empty teams, provide mock data
      if (!teams || teams.length === 0) {
        console.log('No tournament teams found, providing mock data');
        return this.getMockTeams(tournamentId);
      }
      
      return teams;
    } catch (error) {
      console.warn('Failed to fetch tournament teams, using mock data:', error);
      return this.getMockTeams(tournamentId);
    }
  }

  /**
   * Get player's clash information by PUUID
   */
  async getPlayersByPuuid(puuid: string, region: string = 'na1'): Promise<ClashPlayer[]> {
    const response = await fetch(`${this.baseUrl}/api/clash/v1/players/by-puuid/${puuid}?region=${region}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return []; // Player not registered for any clash tournaments
      }
      throw new Error(`Failed to fetch player clash data: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Get player's teams
   */
  async getPlayerTeams(puuid: string, region: string = 'na1'): Promise<ClashTeam[]> {
    const players = await this.getPlayersByPuuid(puuid, region);
    const teams: ClashTeam[] = [];
    
    for (const player of players) {
      if (player.teamId) {
        try {
          const team = await this.getTeamById(player.teamId, region);
          teams.push(team);
        } catch (error) {
          console.warn(`Failed to fetch team ${player.teamId}:`, error);
        }
      }
    }
    
    return teams;
  }

  /**
   * Create a new team
   */
  async createTeam(
    puuid: string, 
    teamData: { name: string; tag: string; iconId: number; iconColorId: number }, 
    region: string = 'na1'
  ): Promise<ClashTeam> {
    // Mock implementation - in real app would call API
    const newTeam: ClashTeam = {
      id: `team-${Date.now()}`,
      tournamentId: 0,
      name: teamData.name,
      iconId: teamData.iconId,
      tier: 4, // Start at tier 4 (lowest)
      captain: puuid,
      abbreviation: teamData.tag,
      players: [
        {
          puuid,
          teamId: `team-${Date.now()}`,
          position: 'UNSELECTED',
          role: 'CAPTAIN'
        }
      ]
    };
    
    return newTeam;
  }

  /**
   * Add player to team
   */
  async addPlayerToTeam(teamId: string, puuid: string, region: string = 'na1'): Promise<ClashTeam> {
    // Mock implementation - in real app would call API
    const team = await this.getTeamById(teamId, region);
    
    if (team.players.length >= 5) {
      throw new Error('Team is full');
    }
    
    team.players.push({
      puuid,
      teamId,
      position: 'UNSELECTED',
      role: 'MEMBER'
    });
    
    return team;
  }

  /**
   * Remove player from team
   */
  async removePlayerFromTeam(teamId: string, puuid: string, region: string = 'na1'): Promise<void> {
    // Mock implementation - in real app would call API
    console.log(`Removing player ${puuid} from team ${teamId} in ${region}`);
  }

  /**
   * Get mock tournaments when API returns empty results
   */
  private getMockTournaments(): Tournament[] {
    const now = Date.now();
    return [
      {
        id: 1001,
        themeId: 1,
        nameKey: 'clash_cup_spring_2024',
        nameKeySecondary: 'spring_championship',
        schedule: [
          {
            id: 10011,
            registrationTime: now + 3600000, // 1 hour from now
            startTime: now + 7200000, // 2 hours from now
            cancelled: false
          },
          {
            id: 10012,
            registrationTime: now + 86400000 + 3600000, // Tomorrow + 1 hour
            startTime: now + 86400000 + 7200000, // Tomorrow + 2 hours
            cancelled: false
          }
        ]
      },
      {
        id: 1002,
        themeId: 2,
        nameKey: 'clash_royale_weekend',
        nameKeySecondary: 'weekend_warriors', 
        schedule: [
          {
            id: 10021,
            registrationTime: now + 172800000, // 2 days from now
            startTime: now + 172800000 + 3600000, // 2 days + 1 hour
            cancelled: false
          }
        ]
      },
      {
        id: 1003,
        themeId: 3,
        nameKey: 'clash_championship_series',
        nameKeySecondary: 'elite_tournament',
        schedule: [
          {
            id: 10031,
            registrationTime: now - 1800000, // 30 minutes ago (registration open)
            startTime: now + 5400000, // 1.5 hours from now
            cancelled: false
          }
        ]
      }
    ];
  }

  /**
   * Get mock teams for tournament when API returns empty results
   */
  private getMockTeams(tournamentId: number): ClashTournamentTeam[] {
    return [
      {
        id: `team-${tournamentId}-1`,
        tournamentId,
        name: 'Dragon Slayers',
        iconId: 1,
        tier: 2,
        captain: 'captain-puuid-1',
        abbreviation: 'DRAG',
        players: [
          { puuid: 'captain-puuid-1', teamId: `team-${tournamentId}-1`, position: 'MIDDLE', role: 'CAPTAIN' },
          { puuid: 'player-puuid-2', teamId: `team-${tournamentId}-1`, position: 'TOP', role: 'MEMBER' },
          { puuid: 'player-puuid-3', teamId: `team-${tournamentId}-1`, position: 'JUNGLE', role: 'MEMBER' },
          { puuid: 'player-puuid-4', teamId: `team-${tournamentId}-1`, position: 'BOTTOM', role: 'MEMBER' },
          { puuid: 'player-puuid-5', teamId: `team-${tournamentId}-1`, position: 'UTILITY', role: 'MEMBER' }
        ]
      },
      {
        id: `team-${tournamentId}-2`,
        tournamentId,
        name: 'Shadow Legends',
        iconId: 2,
        tier: 3,
        captain: 'captain-puuid-6',
        abbreviation: 'SHDW',
        players: [
          { puuid: 'captain-puuid-6', teamId: `team-${tournamentId}-2`, position: 'TOP', role: 'CAPTAIN' },
          { puuid: 'player-puuid-7', teamId: `team-${tournamentId}-2`, position: 'JUNGLE', role: 'MEMBER' },
          { puuid: 'player-puuid-8', teamId: `team-${tournamentId}-2`, position: 'MIDDLE', role: 'MEMBER' },
          { puuid: 'player-puuid-9', teamId: `team-${tournamentId}-2`, position: 'BOTTOM', role: 'MEMBER' }
        ]
      },
      {
        id: `team-${tournamentId}-3`,
        tournamentId,
        name: 'Phoenix Rising',
        iconId: 3,
        tier: 1,
        captain: 'captain-puuid-10',
        abbreviation: 'PHNX',
        players: [
          { puuid: 'captain-puuid-10', teamId: `team-${tournamentId}-3`, position: 'BOTTOM', role: 'CAPTAIN' },
          { puuid: 'player-puuid-11', teamId: `team-${tournamentId}-3`, position: 'UTILITY', role: 'MEMBER' },
          { puuid: 'player-puuid-12', teamId: `team-${tournamentId}-3`, position: 'TOP', role: 'MEMBER' }
        ]
      },
      {
        id: `team-${tournamentId}-4`,
        tournamentId,
        name: 'Storm Breakers',
        iconId: 4,
        tier: 4,
        captain: 'captain-puuid-13',
        abbreviation: 'STRM',
        players: [
          { puuid: 'captain-puuid-13', teamId: `team-${tournamentId}-4`, position: 'JUNGLE', role: 'CAPTAIN' },
          { puuid: 'player-puuid-14', teamId: `team-${tournamentId}-4`, position: 'MIDDLE', role: 'MEMBER' },
          { puuid: 'player-puuid-15', teamId: `team-${tournamentId}-4`, position: 'TOP', role: 'MEMBER' },
          { puuid: 'player-puuid-16', teamId: `team-${tournamentId}-4`, position: 'BOTTOM', role: 'MEMBER' },
          { puuid: 'player-puuid-17', teamId: `team-${tournamentId}-4`, position: 'UTILITY', role: 'MEMBER' }
        ]
      }
    ];
  }
}

/**
 * Utility functions for clash data processing
 */
export class ClashUtils {
  /**
   * Determine tournament status based on schedule
   */
  static getTournamentStatus(tournament: Tournament): TournamentWithStatus['status'] {
    const now = Date.now();
    const currentPhase = tournament.schedule.find(phase => {
      const registrationOpen = phase.registrationTime <= now;
      const tournamentStarted = phase.startTime <= now;
      const nextPhaseIndex = tournament.schedule.indexOf(phase) + 1;
      const tournamentEnded = nextPhaseIndex < tournament.schedule.length 
        ? tournament.schedule[nextPhaseIndex].startTime <= now
        : false;

      if (registrationOpen && !tournamentStarted) return true;
      if (tournamentStarted && !tournamentEnded) return true;
      return false;
    });

    if (!currentPhase) {
      // Check if tournament is upcoming
      const upcomingPhase = tournament.schedule.find(phase => phase.registrationTime > now);
      return upcomingPhase ? 'UPCOMING' : 'COMPLETED';
    }

    const registrationOpen = currentPhase.registrationTime <= now;
    const tournamentStarted = currentPhase.startTime <= now;

    if (registrationOpen && !tournamentStarted) return 'REGISTRATION_OPEN';
    if (tournamentStarted) return 'IN_PROGRESS';
    
    return 'UPCOMING';
  }

  /**
   * Get next tournament phase
   */
  static getNextPhase(tournament: Tournament): TournamentPhase | undefined {
    const now = Date.now();
    return tournament.schedule.find(phase => phase.startTime > now);
  }

  /**
   * Calculate time until tournament starts
   */
  static getTimeUntilStart(tournament: Tournament): number {
    const nextPhase = this.getNextPhase(tournament);
    if (!nextPhase) return 0;
    
    const now = Date.now();
    return Math.max(0, nextPhase.startTime - now);
  }

  /**
   * Format tournament schedule time
   */
  static formatTournamentTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = timestamp - now.getTime();
    
    if (diff < 0) {
      return 'Started';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  /**
   * Get tournament theme information
   */
  static getTournamentTheme(themeId: number) {
    return TOURNAMENT_THEMES[themeId as keyof typeof TOURNAMENT_THEMES] || {
      name: 'Unknown Tournament',
      description: 'Tournament details unavailable',
      icon: '❓',
      color: 'from-gray-500 to-gray-600'
    };
  }

  /**
   * Get team tier information
   */
  static getTeamTier(tier: number) {
    return TEAM_TIERS[tier as keyof typeof TEAM_TIERS] || {
      name: 'Unranked',
      color: 'text-gray-500',
      bg: 'bg-gray-500'
    };
  }

  /**
   * Get position information
   */
  static getPositionInfo(position: Position) {
    return POSITION_INFO[position] || POSITION_INFO.UNSELECTED;
  }

  /**
   * Check if player is team captain
   */
  static isTeamCaptain(player: ClashPlayer): boolean {
    return player.role === 'CAPTAIN';
  }

  /**
   * Get team composition strength (simplified calculation)
   */
  static getTeamStrength(team: ClashTeam): number {
    // Simple calculation based on tier (would need more sophisticated logic with actual player data)
    // Tier 1 = highest, Tier 4 = lowest
    const baseTierStrength = (5 - team.tier) * 10; // 40, 30, 20, 10 for tiers 1-4
    const teamSizeBonus = team.players.length * 5;
    return baseTierStrength + teamSizeBonus;
  }

  /**
   * Sort tournaments by priority (upcoming first, then in progress, etc.)
   */
  static sortTournamentsByPriority(tournaments: TournamentWithStatus[]): TournamentWithStatus[] {
    const statusPriority = {
      'REGISTRATION_OPEN': 1,
      'IN_PROGRESS': 2,
      'UPCOMING': 3,
      'COMPLETED': 4
    };

    return tournaments.sort((a, b) => {
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Within same status, sort by start time
      const aTime = a.nextPhase?.startTime || 0;
      const bTime = b.nextPhase?.startTime || 0;
      return aTime - bTime;
    });
  }

  /**
   * Generate prize pool estimate based on tournament tier
   */
  static estimatePrizePool(tournament: Tournament): string {
    const theme = this.getTournamentTheme(tournament.themeId);
    
    // Simple prize pool estimation (would need actual data from API)
    switch (tournament.themeId) {
      case 1: return '500 RP + Icons';
      case 2: return '1000 RP + Chromas';
      case 3: return '1500 RP + Exclusive Rewards';
      default: return 'Prizes TBD';
    }
  }

  /**
   * Check if team has open slots
   */
  static hasOpenSlots(team: ClashTeam): boolean {
    return team.players.length < 5;
  }

  /**
   * Get missing positions in team
   */
  static getMissingPositions(team: ClashTeam): TournamentPosition[] {
    const filledPositions = team.players
      .map(p => p.position)
      .filter((pos): pos is TournamentPosition => 
        pos === 'TOP' || pos === 'JUNGLE' || pos === 'MIDDLE' || pos === 'BOTTOM' || pos === 'UTILITY'
      );
    
    const allPositions: TournamentPosition[] = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
    return allPositions.filter(pos => !filledPositions.includes(pos));
  }

  /**
   * Calculate team statistics
   */
  static calculateTeamStats(team: ClashTeam): { wins: number; losses: number; tournaments: number } {
    // Mock implementation - would calculate from actual match history
    return {
      wins: Math.floor(Math.random() * 20),
      losses: Math.floor(Math.random() * 10),
      tournaments: Math.floor(Math.random() * 5) + 1
    };
  }
}

// Export singleton instance
export const clashAPI = new ClashAPI();
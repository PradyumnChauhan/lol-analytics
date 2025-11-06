import { getApiClient } from '../client';
import type { RiotApiResponse, MatchDto } from '@/types/riot-api';

// Additional types for Match API
interface MatchTimelineDto {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];
  };
  info: {
    endOfGameResult?: string;
    frameInterval: number;
    frames: FrameDto[];
    gameId: number;
    participants: ParticipantFrameDto[];
  };
}

interface FrameDto {
  events: EventDto[];
  participantFrames: { [participantId: string]: ParticipantFrameDto };
  timestamp: number;
}

interface ParticipantFrameDto {
  championStats: ChampionStatsDto;
  currentGold: number;
  damageStats: DamageStatsDto;
  goldPerSecond: number;
  jungleMinionsKilled: number;
  level: number;
  minionsKilled: number;
  participantId: number;
  position: PositionDto;
  timeEnemySpentControlled: number;
  totalGold: number;
  xp: number;
}

interface ChampionStatsDto {
  abilityHaste: number;
  abilityPower: number;
  armor: number;
  armorPen: number;
  armorPenPercent: number;
  attackDamage: number;
  attackSpeed: number;
  bonusArmorPenPercent: number;
  bonusMagicPenPercent: number;
  ccReduction: number;
  cooldownReduction: number;
  health: number;
  healthMax: number;
  healthRegen: number;
  lifesteal: number;
  magicPen: number;
  magicPenPercent: number;
  magicResist: number;
  movementSpeed: number;
  omnivamp: number;
  physicalVamp: number;
  power: number;
  powerMax: number;
  powerRegen: number;
  spellVamp: number;
}

interface DamageStatsDto {
  magicDamageDone: number;
  magicDamageDoneToChampions: number;
  magicDamageTaken: number;
  physicalDamageDone: number;
  physicalDamageDoneToChampions: number;
  physicalDamageTaken: number;
  totalDamageDone: number;
  totalDamageDoneToChampions: number;
  totalDamageTaken: number;
  trueDamageDone: number;
  trueDamageDoneToChampions: number;
  trueDamageTaken: number;
}

interface PositionDto {
  x: number;
  y: number;
}

interface EventDto {
  realTimestamp?: number;
  timestamp: number;
  type: string;
  // Event-specific properties would be defined based on event type
  [key: string]: unknown;
}

export class MatchAPI {
  private client = getApiClient();

  /**
   * Get a list of match ids by PUUID
   * @param puuid The PUUID
   * @param startTime Epoch timestamp in seconds (optional)
   * @param endTime Epoch timestamp in seconds (optional)
   * @param queue Queue ID (optional)
   * @param type Match type (optional)
   * @param start Start index (optional, default 0)
   * @param count Number of matches to return (optional, default 20, max 100)
   * @returns Promise<RiotApiResponse<string[]>>
   */
  async getMatchIdsByPUUID(
    puuid: string,
    options: {
      startTime?: number;
      endTime?: number;
      queue?: number;
      type?: string;
      start?: number;
      count?: number;
    } = {}
  ): Promise<RiotApiResponse<string[]>> {
    const {
      startTime,
      endTime,
      queue,
      type,
      start = 0,
      count = 20
    } = options;

    const params = new URLSearchParams();
    if (startTime) params.append('startTime', startTime.toString());
    if (endTime) params.append('endTime', endTime.toString());
    if (queue) params.append('queue', queue.toString());
    if (type) params.append('type', type);
    params.append('start', start.toString());
    params.append('count', Math.min(count, 100).toString());

    const queryString = params.toString();
    const endpoint = `/lol/match/v5/matches/by-puuid/${puuid}/ids${queryString ? `?${queryString}` : ''}`;

    return this.client.clusterRequest<string[]>(endpoint);
  }

  /**
   * Get a match by match ID
   * @param matchId The match ID
   * @returns Promise<RiotApiResponse<MatchDto>>
   */
  async getMatchById(matchId: string): Promise<RiotApiResponse<MatchDto>> {
    return this.client.clusterRequest<MatchDto>(`/lol/match/v5/matches/${matchId}`);
  }

  /**
   * Get match timeline by match ID
   * @param matchId The match ID
   * @returns Promise<RiotApiResponse<MatchTimelineDto>>
   */
  async getMatchTimelineById(matchId: string): Promise<RiotApiResponse<MatchTimelineDto>> {
    return this.client.clusterRequest<MatchTimelineDto>(`/lol/match/v5/matches/${matchId}/timeline`);
  }

  /**
   * Get multiple matches by match IDs
   * @param matchIds Array of match IDs
   * @returns Promise<RiotApiResponse<MatchDto>[]>
   */
  async getMatchesByIds(matchIds: string[]): Promise<RiotApiResponse<MatchDto>[]> {
    const promises = matchIds.map(matchId => this.getMatchById(matchId));
    return Promise.all(promises);
  }

  /**
   * Get recent match history for a player
   * @param puuid The PUUID
   * @param count Number of recent matches to fetch (default 10, max 20)
   * @returns Promise<RiotApiResponse<MatchDto>[]>
   */
  async getRecentMatches(puuid: string, count: number = 10): Promise<RiotApiResponse<MatchDto>[]> {
    const matchIdsResponse = await this.getMatchIdsByPUUID(puuid, { count: Math.min(count, 20) });
    
    if (!matchIdsResponse.data || matchIdsResponse.error) {
      return [{ error: matchIdsResponse.error || 'Failed to fetch match IDs', status: matchIdsResponse.status }];
    }

    return this.getMatchesByIds(matchIdsResponse.data);
  }

  /**
   * Get ranked matches for a player
   * @param puuid The PUUID
   * @param queue Queue ID for ranked games (420 for Solo/Duo, 440 for Flex)
   * @param count Number of matches to fetch
   * @returns Promise<RiotApiResponse<MatchDto>[]>
   */
  async getRankedMatches(
    puuid: string, 
    queue: number = 420, 
    count: number = 10
  ): Promise<RiotApiResponse<MatchDto>[]> {
    const matchIdsResponse = await this.getMatchIdsByPUUID(puuid, { 
      queue, 
      count: Math.min(count, 100) 
    });
    
    if (!matchIdsResponse.data || matchIdsResponse.error) {
      return [{ error: matchIdsResponse.error || 'Failed to fetch match IDs', status: matchIdsResponse.status }];
    }

    return this.getMatchesByIds(matchIdsResponse.data);
  }

  /**
   * Get matches within a time range
   * @param puuid The PUUID
   * @param startTime Start timestamp (epoch seconds)
   * @param endTime End timestamp (epoch seconds)
   * @param count Number of matches to fetch
   * @returns Promise<RiotApiResponse<MatchDto>[]>
   */
  async getMatchesInTimeRange(
    puuid: string,
    startTime: number,
    endTime: number,
    count: number = 20
  ): Promise<RiotApiResponse<MatchDto>[]> {
    const matchIdsResponse = await this.getMatchIdsByPUUID(puuid, {
      startTime,
      endTime,
      count: Math.min(count, 100)
    });
    
    if (!matchIdsResponse.data || matchIdsResponse.error) {
      return [{ error: matchIdsResponse.error || 'Failed to fetch match IDs', status: matchIdsResponse.status }];
    }

    return this.getMatchesByIds(matchIdsResponse.data);
  }
}

// Export singleton instance
// Export singleton instance - lazy loaded
let _matchAPI: MatchAPI | null = null;
export const matchAPI = {
  getMatchIdsByPUUID: (puuid: string, options: {
    startTime?: number;
    endTime?: number;
    queue?: number;
    type?: string;
    start?: number;
    count?: number;
  } = {}) => {
    if (!_matchAPI) _matchAPI = new MatchAPI();
    return _matchAPI.getMatchIdsByPUUID(puuid, options);
  },
  getMatchById: (matchId: string) => {
    if (!_matchAPI) _matchAPI = new MatchAPI();
    return _matchAPI.getMatchById(matchId);
  },
  getMatchTimelineById: (matchId: string) => {
    if (!_matchAPI) _matchAPI = new MatchAPI();
    return _matchAPI.getMatchTimelineById(matchId);
  },
  getRecentMatches: (puuid: string, count: number = 5) => {
    if (!_matchAPI) _matchAPI = new MatchAPI();
    return _matchAPI.getRecentMatches(puuid, count);
  },
};
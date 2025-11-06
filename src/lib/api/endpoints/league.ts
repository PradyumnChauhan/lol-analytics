import { getApiClient } from '../client';
import type { RiotApiResponse, LeagueEntryDto } from '@/types/riot-api';

// Additional types for League API
interface LeagueListDto {
  leagueId: string;
  entries: LeagueItemDto[];
  tier: string;
  name: string;
  queue: string;
}

interface LeagueItemDto {
  freshBlood: boolean;
  wins: number;
  miniSeries?: MiniSeriesDto;
  inactive: boolean;
  veteran: boolean;
  hotStreak: boolean;
  rank: string;
  leaguePoints: number;
  losses: number;
  summonerId: string;
  summonerName: string;
}

interface MiniSeriesDto {
  target: number;
  wins: number;
  losses: number;
  progress: string;
}

export class LeagueAPI {
  private client = getApiClient();

  /**
   * Get league entries in all queues for a given summoner ID
   * @param encryptedSummonerId The encrypted summoner ID
   * @returns Promise<RiotApiResponse<LeagueEntryDto[]>>
   */
  async getLeagueEntriesBySummonerId(encryptedSummonerId: string): Promise<RiotApiResponse<LeagueEntryDto[]>> {
    return this.client.regionalRequest<LeagueEntryDto[]>(
      `/lol/league/v4/entries/by-summoner/${encryptedSummonerId}`
    );
  }

  /**
   * Get all the league entries
   * @param queue The queue to query (RANKED_SOLO_5x5, RANKED_FLEX_SR, RANKED_FLEX_TT)
   * @param tier The tier to query (IRON, BRONZE, SILVER, GOLD, PLATINUM, EMERALD, DIAMOND, MASTER, GRANDMASTER, CHALLENGER)
   * @param division The division to query (I, II, III, IV) - Not applicable for MASTER, GRANDMASTER, CHALLENGER
   * @param page Page number (starts at 1)
   * @returns Promise<RiotApiResponse<LeagueEntryDto[]>>
   */
  async getLeagueEntries(
    queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR' | 'RANKED_FLEX_TT',
    tier: 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'EMERALD' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER',
    division?: 'I' | 'II' | 'III' | 'IV',
    page: number = 1
  ): Promise<RiotApiResponse<LeagueEntryDto[]>> {
    let endpoint = `/lol/league/v4/entries/${queue}/${tier}`;
    
    if (division && !['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier)) {
      endpoint += `/${division}`;
    }
    
    endpoint += `?page=${page}`;
    
    return this.client.regionalRequest<LeagueEntryDto[]>(endpoint);
  }

  /**
   * Get league with given ID, including inactive entries
   * @param leagueId The league ID
   * @returns Promise<RiotApiResponse<LeagueListDto>>
   */
  async getLeagueById(leagueId: string): Promise<RiotApiResponse<LeagueListDto>> {
    return this.client.regionalRequest<LeagueListDto>(`/lol/league/v4/leagues/${leagueId}`);
  }

  /**
   * Get the challenger league for given queue
   * @param queue The queue to query (RANKED_SOLO_5x5, RANKED_FLEX_SR, RANKED_FLEX_TT)
   * @returns Promise<RiotApiResponse<LeagueListDto>>
   */
  async getChallengerLeague(
    queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR' | 'RANKED_FLEX_TT'
  ): Promise<RiotApiResponse<LeagueListDto>> {
    return this.client.regionalRequest<LeagueListDto>(
      `/lol/league/v4/challengerleagues/by-queue/${queue}`
    );
  }

  /**
   * Get the grandmaster league for given queue
   * @param queue The queue to query (RANKED_SOLO_5x5, RANKED_FLEX_SR, RANKED_FLEX_TT)
   * @returns Promise<RiotApiResponse<LeagueListDto>>
   */
  async getGrandmasterLeague(
    queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR' | 'RANKED_FLEX_TT'
  ): Promise<RiotApiResponse<LeagueListDto>> {
    return this.client.regionalRequest<LeagueListDto>(
      `/lol/league/v4/grandmasterleagues/by-queue/${queue}`
    );
  }

  /**
   * Get the master league for given queue
   * @param queue The queue to query (RANKED_SOLO_5x5, RANKED_FLEX_SR, RANKED_FLEX_TT)
   * @returns Promise<RiotApiResponse<LeagueListDto>>
   */
  async getMasterLeague(
    queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR' | 'RANKED_FLEX_TT'
  ): Promise<RiotApiResponse<LeagueListDto>> {
    return this.client.regionalRequest<LeagueListDto>(
      `/lol/league/v4/masterleagues/by-queue/${queue}`
    );
  }

  /**
   * Helper method to get ranked statistics for a summoner
   * @param encryptedSummonerId The encrypted summoner ID
   * @returns Promise with solo queue and flex queue stats
   */
  async getRankedStats(encryptedSummonerId: string) {
    const response = await this.getLeagueEntriesBySummonerId(encryptedSummonerId);
    
    if (!response.data || response.error) {
      return {
        soloQueue: null,
        flexQueue: null,
        error: response.error
      };
    }

    const soloQueue = response.data.find(entry => entry.queueType === 'RANKED_SOLO_5x5') || null;
    const flexQueue = response.data.find(entry => entry.queueType === 'RANKED_FLEX_SR') || null;

    return {
      soloQueue,
      flexQueue,
      error: null
    };
  }
}

// Export singleton instance
// Export singleton instance - lazy loaded
let _leagueAPI: LeagueAPI | null = null;
export const leagueAPI = {
  getRankedStats: (summonerId: string) => {
    if (!_leagueAPI) _leagueAPI = new LeagueAPI();
    return _leagueAPI.getRankedStats(summonerId);
  },
  getLeagueEntriesBySummonerId: (encryptedSummonerId: string) => {
    if (!_leagueAPI) _leagueAPI = new LeagueAPI();
    return _leagueAPI.getLeagueEntriesBySummonerId(encryptedSummonerId);
  },
  getLeagueEntries: (
    queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR' | 'RANKED_FLEX_TT',
    tier: 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'EMERALD' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER',
    division?: 'I' | 'II' | 'III' | 'IV',
    page: number = 1
  ) => {
    if (!_leagueAPI) _leagueAPI = new LeagueAPI();
    return _leagueAPI.getLeagueEntries(queue, tier, division, page);
  },
  getChallengerLeague: (queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR' | 'RANKED_FLEX_TT') => {
    if (!_leagueAPI) _leagueAPI = new LeagueAPI();
    return _leagueAPI.getChallengerLeague(queue);
  },
  getGrandmasterLeague: (queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR' | 'RANKED_FLEX_TT') => {
    if (!_leagueAPI) _leagueAPI = new LeagueAPI();
    return _leagueAPI.getGrandmasterLeague(queue);
  },
  getMasterLeague: (queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR' | 'RANKED_FLEX_TT') => {
    if (!_leagueAPI) _leagueAPI = new LeagueAPI();
    return _leagueAPI.getMasterLeague(queue);
  },
  getLeagueById: (leagueId: string) => {
    if (!_leagueAPI) _leagueAPI = new LeagueAPI();
    return _leagueAPI.getLeagueById(leagueId);
  },
};
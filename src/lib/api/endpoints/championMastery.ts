import { getApiClient } from '../client';
import type { RiotApiResponse, ChampionMasteryDto } from '@/types/riot-api';

export class ChampionMasteryAPI {
  private client = getApiClient();

  /**
   * Get all champion mastery entries sorted by number of champion points descending
   * @param encryptedPUUID The encrypted PUUID
   * @returns Promise<RiotApiResponse<ChampionMasteryDto[]>>
   */
  async getAllChampionMasteriesByPUUID(encryptedPUUID: string): Promise<RiotApiResponse<ChampionMasteryDto[]>> {
    return this.client.regionalRequest<ChampionMasteryDto[]>(
      `/lol/champion-mastery/v4/champion-masteries/by-puuid/${encryptedPUUID}`
    );
  }

  /**
   * Get a champion mastery by PUUID and champion ID
   * @param encryptedPUUID The encrypted PUUID
   * @param championId The champion ID
   * @returns Promise<RiotApiResponse<ChampionMasteryDto>>
   */
  async getChampionMasteryByPUUID(
    encryptedPUUID: string, 
    championId: number
  ): Promise<RiotApiResponse<ChampionMasteryDto>> {
    return this.client.regionalRequest<ChampionMasteryDto>(
      `/lol/champion-mastery/v4/champion-masteries/by-puuid/${encryptedPUUID}/by-champion/${championId}`
    );
  }

  /**
   * Get specified number of top champion mastery entries sorted by number of champion points descending
   * @param encryptedPUUID The encrypted PUUID
   * @param count Number of entries to retrieve (max 1000)
   * @returns Promise<RiotApiResponse<ChampionMasteryDto[]>>
   */
  async getTopChampionMasteriesByPUUID(
    encryptedPUUID: string, 
    count: number = 10
  ): Promise<RiotApiResponse<ChampionMasteryDto[]>> {
    const validCount = Math.min(Math.max(1, count), 1000);
    return this.client.regionalRequest<ChampionMasteryDto[]>(
      `/lol/champion-mastery/v4/champion-masteries/by-puuid/${encryptedPUUID}/top?count=${validCount}`
    );
  }

  /**
   * Get a player's total champion mastery score
   * @param encryptedPUUID The encrypted PUUID
   * @returns Promise<RiotApiResponse<number>>
   */
  async getMasteryScoreByPUUID(encryptedPUUID: string): Promise<RiotApiResponse<number>> {
    return this.client.regionalRequest<number>(
      `/lol/champion-mastery/v4/scores/by-puuid/${encryptedPUUID}`
    );
  }

  // Legacy methods using Summoner ID (kept for backwards compatibility)
  
  /**
   * Get all champion mastery entries sorted by number of champion points descending (legacy)
   * @param encryptedSummonerId The encrypted summoner ID
   * @returns Promise<RiotApiResponse<ChampionMasteryDto[]>>
   */
  async getAllChampionMasteriesBySummonerId(encryptedSummonerId: string): Promise<RiotApiResponse<ChampionMasteryDto[]>> {
    return this.client.regionalRequest<ChampionMasteryDto[]>(
      `/lol/champion-mastery/v4/champion-masteries/by-summoner/${encryptedSummonerId}`
    );
  }

  /**
   * Get a champion mastery by summoner ID and champion ID (legacy)
   * @param encryptedSummonerId The encrypted summoner ID
   * @param championId The champion ID
   * @returns Promise<RiotApiResponse<ChampionMasteryDto>>
   */
  async getChampionMasteryBySummonerId(
    encryptedSummonerId: string, 
    championId: number
  ): Promise<RiotApiResponse<ChampionMasteryDto>> {
    return this.client.regionalRequest<ChampionMasteryDto>(
      `/lol/champion-mastery/v4/champion-masteries/by-summoner/${encryptedSummonerId}/by-champion/${championId}`
    );
  }

  /**
   * Get specified number of top champion mastery entries by summoner ID (legacy)
   * @param encryptedSummonerId The encrypted summoner ID
   * @param count Number of entries to retrieve (max 1000)
   * @returns Promise<RiotApiResponse<ChampionMasteryDto[]>>
   */
  async getTopChampionMasteriesBySummonerId(
    encryptedSummonerId: string, 
    count: number = 10
  ): Promise<RiotApiResponse<ChampionMasteryDto[]>> {
    const validCount = Math.min(Math.max(1, count), 1000);
    return this.client.regionalRequest<ChampionMasteryDto[]>(
      `/lol/champion-mastery/v4/champion-masteries/by-summoner/${encryptedSummonerId}/top?count=${validCount}`
    );
  }

  /**
   * Get a player's total champion mastery score by summoner ID (legacy)
   * @param encryptedSummonerId The encrypted summoner ID
   * @returns Promise<RiotApiResponse<number>>
   */
  async getMasteryScoreBySummonerId(encryptedSummonerId: string): Promise<RiotApiResponse<number>> {
    return this.client.regionalRequest<number>(
      `/lol/champion-mastery/v4/scores/by-summoner/${encryptedSummonerId}`
    );
  }
}

// Export singleton instance
// Export singleton instance - lazy loaded
let _championMasteryAPI: ChampionMasteryAPI | null = null;
export const championMasteryAPI = {
  getTopChampionMasteriesByPUUID: (encryptedPUUID: string, count?: number) => {
    if (!_championMasteryAPI) _championMasteryAPI = new ChampionMasteryAPI();
    return _championMasteryAPI.getTopChampionMasteriesByPUUID(encryptedPUUID, count);
  },
  getAllChampionMasteriesByPUUID: (encryptedPUUID: string) => {
    if (!_championMasteryAPI) _championMasteryAPI = new ChampionMasteryAPI();
    return _championMasteryAPI.getAllChampionMasteriesByPUUID(encryptedPUUID);
  },
  getChampionMasteryByPUUID: (encryptedPUUID: string, championId: number) => {
    if (!_championMasteryAPI) _championMasteryAPI = new ChampionMasteryAPI();
    return _championMasteryAPI.getChampionMasteryByPUUID(encryptedPUUID, championId);
  },
  getMasteryScoreByPUUID: (encryptedPUUID: string) => {
    if (!_championMasteryAPI) _championMasteryAPI = new ChampionMasteryAPI();
    return _championMasteryAPI.getMasteryScoreByPUUID(encryptedPUUID);
  },
};
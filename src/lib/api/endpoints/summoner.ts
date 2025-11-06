import { getApiClient } from '../client';
import type { RiotApiResponse, SummonerDto } from '@/types/riot-api';

export class SummonerAPI {
  private client = getApiClient();

  /**
   * Get a summoner by summoner name
   * @param summonerName The summoner name
   * @returns Promise<RiotApiResponse<SummonerDto>>
   */
  async getBySummonerName(summonerName: string): Promise<RiotApiResponse<SummonerDto>> {
    const encodedName = encodeURIComponent(summonerName);
    return this.client.regionalRequest<SummonerDto>(
      `/lol/summoner/v4/summoners/by-name/${encodedName}`
    );
  }

  /**
   * Get a summoner by account ID
   * @param encryptedAccountId The encrypted account ID
   * @returns Promise<RiotApiResponse<SummonerDto>>
   */
  async getByAccountId(encryptedAccountId: string): Promise<RiotApiResponse<SummonerDto>> {
    return this.client.regionalRequest<SummonerDto>(
      `/lol/summoner/v4/summoners/by-account/${encryptedAccountId}`
    );
  }

  /**
   * Get a summoner by PUUID
   * @param encryptedPUUID The encrypted PUUID
   * @returns Promise<RiotApiResponse<SummonerDto>>
   */
  async getByPUUID(encryptedPUUID: string): Promise<RiotApiResponse<SummonerDto>> {
    return this.client.regionalRequest<SummonerDto>(
      `/lol/summoner/v4/summoners/by-puuid/${encryptedPUUID}`
    );
  }

  /**
   * Get a summoner by summoner ID
   * @param encryptedSummonerId The encrypted summoner ID
   * @returns Promise<RiotApiResponse<SummonerDto>>
   */
  async getBySummonerId(encryptedSummonerId: string): Promise<RiotApiResponse<SummonerDto>> {
    return this.client.regionalRequest<SummonerDto>(
      `/lol/summoner/v4/summoners/${encryptedSummonerId}`
    );
  }
}

// Export singleton instance - lazy loaded
let _summonerAPI: SummonerAPI | null = null;
export const summonerAPI = {
  getBySummonerName: (summonerName: string) => {
    if (!_summonerAPI) _summonerAPI = new SummonerAPI();
    return _summonerAPI.getBySummonerName(summonerName);
  },
  getByAccountId: (encryptedAccountId: string) => {
    if (!_summonerAPI) _summonerAPI = new SummonerAPI();
    return _summonerAPI.getByAccountId(encryptedAccountId);
  },
  getByPUUID: (encryptedPUUID: string) => {
    if (!_summonerAPI) _summonerAPI = new SummonerAPI();
    return _summonerAPI.getByPUUID(encryptedPUUID);
  },
  getBySummonerId: (encryptedSummonerId: string) => {
    if (!_summonerAPI) _summonerAPI = new SummonerAPI();
    return _summonerAPI.getBySummonerId(encryptedSummonerId);
  },
};
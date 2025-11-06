import { getApiClient } from '../client';
import type { RiotApiResponse, ChampionInfo } from '@/types/riot-api';

export class ChampionAPI {
  private client = getApiClient();

  /**
   * Returns champion rotations, including free-to-play and low-level free-to-play rotations
   * @returns Promise<RiotApiResponse<ChampionInfo>>
   */
  async getChampionRotations(): Promise<RiotApiResponse<ChampionInfo>> {
    return this.client.regionalRequest<ChampionInfo>('/lol/platform/v3/champion-rotations');
  }

  /**
   * Get free champion rotation for new players
   * @returns Promise<number[]> Array of champion IDs
   */
  async getFreeChampionsForNewPlayers(): Promise<number[]> {
    const response = await this.getChampionRotations();
    return response.data?.freeChampionIdsForNewPlayers || [];
  }

  /**
   * Get current free champion rotation
   * @returns Promise<number[]> Array of champion IDs
   */
  async getCurrentFreeChampions(): Promise<number[]> {
    const response = await this.getChampionRotations();
    return response.data?.freeChampionIds || [];
  }

  /**
   * Check if a champion is currently free to play
   * @param championId The champion ID to check
   * @returns Promise<boolean>
   */
  async isChampionFree(championId: number): Promise<boolean> {
    const freeChampions = await this.getCurrentFreeChampions();
    return freeChampions.includes(championId);
  }
}

// Export singleton instance
export const championAPI = new ChampionAPI();
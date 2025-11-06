import { getApiClient } from '../client';
import type { RiotApiResponse, CurrentGameInfo } from '@/types/riot-api';

// Additional types for Spectator API
interface FeaturedGames {
  gameList: FeaturedGameInfo[];
  clientRefreshInterval: number;
}

interface FeaturedGameInfo {
  gameId: number;
  gameType: string;
  gameStartTime: number;
  mapId: number;
  gameLength: number;
  platformId: string;
  gameMode: string;
  bannedChampions: BannedChampion[];
  gameQueueConfigId: number;
  observers: Observer;
  participants: FeaturedParticipant[];
}

interface BannedChampion {
  championId: number;
  teamId: number;
  pickTurn: number;
}

interface Observer {
  encryptionKey: string;
}

interface FeaturedParticipant {
  teamId: number;
  spell1Id: number;
  spell2Id: number;
  championId: number;
  profileIconId: number;
  summonerName: string;
  bot: boolean;
}

export class SpectatorAPI {
  private client = getApiClient();

  /**
   * Get current game information for the given summoner ID
   * @param encryptedSummonerId The encrypted summoner ID
   * @returns Promise<RiotApiResponse<CurrentGameInfo>>
   */
  async getCurrentGameBySummonerId(encryptedSummonerId: string): Promise<RiotApiResponse<CurrentGameInfo>> {
    console.log(`[Spectator API v5] Getting active game for summoner: ${encryptedSummonerId}`);
    return this.client.regionalRequest<CurrentGameInfo>(
      `/lol/spectator/v5/active-games/by-summoner/${encryptedSummonerId}`
    );
  }

  /**
   * Get current game information for the given PUUID
   * @param encryptedPUUID The encrypted PUUID
   * @returns Promise<RiotApiResponse<CurrentGameInfo>>
   */
  async getCurrentGameByPUUID(encryptedPUUID: string): Promise<RiotApiResponse<CurrentGameInfo>> {
    return this.client.regionalRequest<CurrentGameInfo>(
      `/lol/spectator/v4/active-games/by-puuid/${encryptedPUUID}`
    );
  }

  /**
   * Get list of featured games
   * @returns Promise<RiotApiResponse<FeaturedGames>>
   */
  async getFeaturedGames(): Promise<RiotApiResponse<FeaturedGames>> {
    console.log('[Spectator API v5] Getting featured games');  
    return this.client.regionalRequest<FeaturedGames>('/lol/spectator/v5/featured-games');
  }

  /**
   * Check if a player is currently in a game
   * @param encryptedSummonerId The encrypted summoner ID
   * @returns Promise<boolean>
   */
  async isPlayerInGame(encryptedSummonerId: string): Promise<boolean> {
    const response = await this.getCurrentGameBySummonerId(encryptedSummonerId);
    return !response.error && !!response.data;
  }

  /**
   * Check if a player is currently in a game by PUUID
   * @param encryptedPUUID The encrypted PUUID
   * @returns Promise<boolean>
   */
  async isPlayerInGameByPUUID(encryptedPUUID: string): Promise<boolean> {
    const response = await this.getCurrentGameByPUUID(encryptedPUUID);
    return !response.error && !!response.data;
  }

  /**
   * Get game information with additional analysis
   * @param encryptedSummonerId The encrypted summoner ID
   * @returns Promise with enhanced game information
   */
  async getGameAnalysis(encryptedSummonerId: string) {
    const response = await this.getCurrentGameBySummonerId(encryptedSummonerId);
    
    if (!response.data || response.error) {
      return {
        gameInfo: null,
        isInGame: false,
        gameDuration: 0,
        gameMode: null,
        error: response.error
      };
    }

    const gameInfo = response.data;
    const gameDuration = Math.floor((Date.now() - gameInfo.gameStartTime) / 1000);

    return {
      gameInfo,
      isInGame: true,
      gameDuration,
      gameMode: gameInfo.gameMode,
      queueId: gameInfo.gameQueueConfigId,
      participantCount: gameInfo.participants.length,
      error: null
    };
  }

  /**
   * Get team compositions from current game
   * @param encryptedSummonerId The encrypted summoner ID
   * @returns Promise with team composition analysis
   */
  async getTeamCompositions(encryptedSummonerId: string) {
    const response = await this.getCurrentGameBySummonerId(encryptedSummonerId);
    
    if (!response.data || response.error) {
      return {
        blueTeam: [],
        redTeam: [],
        error: response.error
      };
    }

    const participants = response.data.participants;
    const blueTeam = participants.filter(p => p.teamId === 100);
    const redTeam = participants.filter(p => p.teamId === 200);

    return {
      blueTeam,
      redTeam,
      error: null
    };
  }
}

// Export singleton instance
export const spectatorAPI = new SpectatorAPI();
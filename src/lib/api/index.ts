// Lazy API endpoint factories
let _summonerAPI: typeof import('./endpoints/summoner').summonerAPI | null = null;
let _championMasteryAPI: typeof import('./endpoints/championMastery').championMasteryAPI | null = null;
let _matchAPI: typeof import('./endpoints/match').matchAPI | null = null;
let _leagueAPI: typeof import('./endpoints/league').leagueAPI | null = null;

// Lazy loaded API endpoints
export const summonerAPI = {
  getBySummonerName: async (summonerName: string) => {
    if (!_summonerAPI) {
      const { summonerAPI: api } = await import('./endpoints/summoner');
      _summonerAPI = api;
    }
    return _summonerAPI.getBySummonerName(summonerName);
  },
  getByAccountId: async (encryptedAccountId: string) => {
    if (!_summonerAPI) {
      const { summonerAPI: api } = await import('./endpoints/summoner');
      _summonerAPI = api;
    }
    return _summonerAPI.getByAccountId(encryptedAccountId);
  },
  getByPUUID: async (encryptedPUUID: string) => {
    if (!_summonerAPI) {
      const { summonerAPI: api } = await import('./endpoints/summoner');
      _summonerAPI = api;
    }
    return _summonerAPI.getByPUUID(encryptedPUUID);
  },
  getBySummonerId: async (encryptedSummonerId: string) => {
    if (!_summonerAPI) {
      const { summonerAPI: api } = await import('./endpoints/summoner');
      _summonerAPI = api;
    }
    return _summonerAPI.getBySummonerId(encryptedSummonerId);
  },
};

export const leagueAPI = {
  getRankedStats: async (summonerId: string) => {
    if (!_leagueAPI) {
      const { leagueAPI: api } = await import('./endpoints/league');
      _leagueAPI = api;
    }
    return _leagueAPI.getRankedStats(summonerId);
  },
  getLeagueEntriesBySummonerId: async (encryptedSummonerId: string) => {
    if (!_leagueAPI) {
      const { leagueAPI: api } = await import('./endpoints/league');
      _leagueAPI = api;
    }
    return _leagueAPI.getLeagueEntriesBySummonerId(encryptedSummonerId);
  },
};

export const championMasteryAPI = {
  getTopChampionMasteriesByPUUID: async (encryptedPUUID: string, count?: number) => {
    if (!_championMasteryAPI) {
      const { championMasteryAPI: api } = await import('./endpoints/championMastery');
      _championMasteryAPI = api;
    }
    return _championMasteryAPI.getTopChampionMasteriesByPUUID(encryptedPUUID, count);
  },
  getAllChampionMasteriesByPUUID: async (encryptedPUUID: string) => {
    if (!_championMasteryAPI) {
      const { championMasteryAPI: api } = await import('./endpoints/championMastery');
      _championMasteryAPI = api;
    }
    return _championMasteryAPI.getAllChampionMasteriesByPUUID(encryptedPUUID);
  },
};

export const matchAPI = {
  getRecentMatches: async (puuid: string, count: number = 5) => {
    if (!_matchAPI) {
      const { matchAPI: api } = await import('./endpoints/match');
      _matchAPI = api;
    }
    return _matchAPI.getRecentMatches(puuid, count);
  },
  getMatchById: async (matchId: string) => {
    if (!_matchAPI) {
      const { matchAPI: api } = await import('./endpoints/match');
      _matchAPI = api;
    }
    return _matchAPI.getMatchById(matchId);
  },
};

// Factory functions for creating API instances (client-side only)
export const createSummonerAPI = async () => {
  const { SummonerAPI } = await import('./endpoints/summoner');
  return new SummonerAPI();
};

export const createLeagueAPI = async () => {
  const { LeagueAPI } = await import('./endpoints/league');
  return new LeagueAPI();
};

export const createMatchAPI = async () => {
  const { MatchAPI } = await import('./endpoints/match');
  return new MatchAPI();
};

export const createChampionMasteryAPI = async () => {
  const { ChampionMasteryAPI } = await import('./endpoints/championMastery');
  return new ChampionMasteryAPI();
};

// Export main API client
export { getApiClient, initializeApiClient, RiotApiClient } from './client';
export { getRateLimiter, initializeRateLimiter, RateLimiter } from './utils/rateLimit';

// Re-export types
export type * from '@/types/riot-api';
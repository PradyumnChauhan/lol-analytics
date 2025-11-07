// API client for LOL Analytics Backend
// Import the centralized backend URL utility
// Note: This is a .js file, so we need to handle the import differently
// For now, we'll use a similar pattern but ensure consistency
const getDefaultBaseURL = () => {
  if (typeof window !== 'undefined') {
    // Client-side: must use NEXT_PUBLIC_ prefix
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  }
  // Server-side: can use BACKEND_URL or NEXT_PUBLIC_BACKEND_URL
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
};

class LOLBackendAPI {
  constructor(baseURL = null) {
    this.baseURL = baseURL || getDefaultBaseURL();
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication methods
  async getAuthStatus() {
    return this.request('/auth/status');
  }

  async configureAuth(apiKey, cookies = null) {
    return this.request('/auth/configure', {
      method: 'POST',
      body: JSON.stringify({ apiKey, cookies })
    });
  }

  async testAuth() {
    return this.request('/auth/test');
  }

  // Account and Summoner APIs
  async getAccountByRiotId(gameName, tagLine) {
    return this.request(`/api/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`);
  }

  async getSummonerByPuuid(puuid, region = 'na1') {
    return this.request(`/api/summoner/v4/summoners/by-puuid/${puuid}?region=${region}`);
  }

  // Champion Mastery API
  async getChampionMasteryByPuuid(puuid, region = 'na1') {
    return this.request(`/api/champion-mastery/v4/champion-masteries/by-puuid/${puuid}?region=${region}`);
  }

  // League API
  async getLeagueEntriesBySummoner(summonerId, region = 'na1') {
    return this.request(`/api/league/v4/entries/by-summoner/${summonerId}?region=${region}`);
  }

  // Match-V5 API
  async getMatchIdsByPuuid(puuid, options = {}) {
    const { 
      startTime, 
      endTime, 
      queue, 
      type, 
      start = 0, 
      count = 20, 
      region = 'americas' 
    } = options;

    const params = new URLSearchParams();
    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);
    if (queue) params.append('queue', queue);
    if (type) params.append('type', type);
    params.append('start', start);
    params.append('count', count);
    params.append('region', region);

    return this.request(`/api/match/v5/matches/by-puuid/${puuid}/ids?${params}`);
  }

  async getMatchById(matchId, region = 'americas') {
    return this.request(`/api/match/v5/matches/${matchId}?region=${region}`);
  }

  // Utility methods
  async getHealthStatus() {
    return this.request('/health');
  }

  async getAvailableRegions() {
    return this.request('/api/regions');
  }

  // Helper method to get all player data
  async getPlayerData(gameName, tagLine, region = 'na1') {
    try {
      console.log(`🔍 Fetching player data for ${gameName}#${tagLine}...`);

      // Get account info
      const account = await this.getAccountByRiotId(gameName, tagLine);
      console.log('✅ Account data retrieved');

      // Get summoner info
      const summoner = await this.getSummonerByPuuid(account.puuid, region);
      console.log('✅ Summoner data retrieved');

      // Get champion mastery
      const championMastery = await this.getChampionMasteryByPuuid(account.puuid, region);
      console.log('✅ Champion mastery data retrieved');

      // Get league entries
      const leagueEntries = await this.getLeagueEntriesBySummoner(summoner.id, region);
      console.log('✅ League entries retrieved');

      return {
        account,
        summoner,
        championMastery,
        leagueEntries
      };
    } catch (error) {
      console.error('❌ Failed to get player data:', error.message);
      throw error;
    }
  }

  // Helper method to get match history (with fallback handling)
  async getMatchHistory(puuid, options = {}) {
    try {
      const matchIds = await this.getMatchIdsByPuuid(puuid, options);
      console.log(`✅ Retrieved ${matchIds.length} match IDs`);
      
      const matches = [];
      const maxMatches = Math.min(matchIds.length, 5); // Limit to prevent too many requests
      
      for (let i = 0; i < maxMatches; i++) {
        try {
          const match = await this.getMatchById(matchIds[i], options.region);
          matches.push(match);
          console.log(`✅ Retrieved match ${i + 1}/${maxMatches}`);
        } catch (error) {
          console.error(`❌ Failed to get match ${matchIds[i]}:`, error.message);
          // Continue with other matches
        }
      }

      return { matchIds, matches };
    } catch (error) {
      console.error('❌ Failed to get match history:', error.message);
      
      // Return empty data if Match-V5 is not accessible
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        console.log('⚠️  Match-V5 API not accessible, returning empty match data');
        return { matchIds: [], matches: [] };
      }
      
      throw error;
    }
  }
}

// Export for ES modules
export default LOLBackendAPI;
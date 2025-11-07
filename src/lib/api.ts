// API service client for LoL Analytics backend
import type { MatchDto } from '@/types/riot-api';
import { getBackendUrl } from '@/lib/utils/backend-url';

const API_BASE_URL = getBackendUrl();

export interface SummonerData {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface AccountData {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RankData {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  summonerId: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

export interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  tokensEarned: number;
  summonerId: string;
}

export interface ChallengeData {
  totalPoints: number;
  categoryPoints: Record<string, number>;
  challenges: Array<{
    challengeId: number;
    percentile: number;
    level: string;
    value: number;
    achievedTime?: number;
  }>;
}

export class LoLAnalyticsAPI {
  private baseURL: string;

  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  // Account & Summoner APIs
  async getAccountByRiotId(gameName: string, tagLine: string, region = 'na1'): Promise<AccountData> {
    return this.request<AccountData>(`/api/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}?region=${region}`);
  }

  async getSummonerByRiotId(gameName: string, tagLine: string, region = 'na1'): Promise<SummonerData> {
    return this.request<SummonerData>(`/api/summoner/v4/summoners/by-riot-id/${gameName}/${tagLine}?region=${region}`);
  }

  async getSummonerByPuuid(puuid: string, region = 'na1'): Promise<SummonerData> {
    return this.request<SummonerData>(`/api/summoner/v4/summoners/by-puuid/${puuid}?region=${region}`);
  }

  // League & Ranking APIs
  async getRanksBySummonerId(summonerId: string, region = 'na1'): Promise<RankData[]> {
    return this.request<RankData[]>(`/api/league/v4/entries/by-summoner/${summonerId}?region=${region}`);
  }

  async getRanksByPuuid(puuid: string, region = 'na1'): Promise<RankData[]> {
    return this.request<RankData[]>(`/api/league/v4/entries/by-puuid/${puuid}?region=${region}`);
  }

  async getChallengerLeague(queue = 'RANKED_SOLO_5x5', region = 'na1') {
    return this.request(`/api/league/v4/challengerleagues/by-queue/${queue}?region=${region}`);
  }

  async getGrandmasterLeague(queue = 'RANKED_SOLO_5x5', region = 'na1') {
    return this.request(`/api/league/v4/grandmasterleagues/by-queue/${queue}?region=${region}`);
  }

  async getMasterLeague(queue = 'RANKED_SOLO_5x5', region = 'na1') {
    return this.request(`/api/league/v4/masterleagues/by-queue/${queue}?region=${region}`);
  }

  async getLeagueEntries(queue: string, tier: string, division: string, region = 'na1', page = 1) {
    return this.request(`/api/league/v4/entries/${queue}/${tier}/${division}?region=${region}&page=${page}`);
  }

  // Champion Mastery APIs
  async getChampionMasteryByPuuid(puuid: string, region = 'na1'): Promise<ChampionMastery[]> {
    return this.request<ChampionMastery[]>(`/api/champion-mastery/v4/champion-masteries/by-puuid/${puuid}?region=${region}`);
  }

  async getChampionMasteryByChampion(puuid: string, championId: number, region = 'na1'): Promise<ChampionMastery> {
    return this.request<ChampionMastery>(`/api/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}?region=${region}`);
  }

  async getMasteryScore(puuid: string, region = 'na1'): Promise<number> {
    return this.request<number>(`/api/champion-mastery/v4/scores/by-puuid/${puuid}?region=${region}`);
  }

  async getTopChampionMasteries(puuid: string, count = 10, region = 'na1'): Promise<ChampionMastery[]> {
    return this.request<ChampionMastery[]>(`/api/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?region=${region}&count=${count}`);
  }

  // Match APIs
  async getMatchIdsByPuuid(puuid: string, region = 'americas', count = 20, start = 0) {
    return this.request<string[]>(`/api/match/v5/matches/by-puuid/${puuid}/ids?region=${region}&count=${count}&start=${start}`);
  }

  async getMatchDetails(matchId: string, region = 'americas') {
    return this.request(`/api/match/v5/matches/${matchId}?region=${region}`);
  }

  async getMatchTimeline(matchId: string, region = 'americas') {
    return this.request(`/api/match/v5/matches/${matchId}/timeline?region=${region}`);
  }

  // Challenge APIs
  async getAllChallengeConfigs(region = 'na1') {
    return this.request(`/api/challenges/v1/challenges/config?region=${region}`);
  }

  async getAllChallengePercentiles(region = 'na1') {
    return this.request(`/api/challenges/v1/challenges/percentiles?region=${region}`);
  }

  async getChallengeConfig(challengeId: number, region = 'na1') {
    return this.request(`/api/challenges/v1/challenges/config/${challengeId}?region=${region}`);
  }

  async getChallengePercentiles(challengeId: number, region = 'na1') {
    return this.request(`/api/challenges/v1/challenges/percentiles/${challengeId}?region=${region}`);
  }

  async getPlayerChallenges(puuid: string, region = 'na1'): Promise<ChallengeData> {
    return this.request<ChallengeData>(`/api/challenges/v1/player-data/by-puuid/${puuid}?region=${region}`);
  }

  // Spectator APIs
  async getCurrentGame(puuid: string, region = 'na1') {
    return this.request(`/api/spectator/v5/active-games/by-puuid/${puuid}?region=${region}`);
  }

  async getFeaturedGames(region = 'na1') {
    return this.request(`/api/spectator/v5/featured-games?region=${region}`);
  }

  // Platform APIs
  async getChampionRotations(region = 'na1') {
    return this.request(`/api/platform/v3/champion-rotations?region=${region}`);
  }

  async getPlatformStatus(region = 'na1') {
    return this.request(`/api/lol-status/v4/platform-data?region=${region}`);
  }

  // Clash APIs
  async getClashPlayerBySummonerId(summonerId: string, region = 'na1') {
    return this.request(`/api/clash/v1/players/by-summoner/${summonerId}?region=${region}`);
  }

  async getClashTeam(teamId: string, region = 'na1') {
    return this.request(`/api/clash/v1/teams/${teamId}?region=${region}`);
  }

  async getClashTournaments(region = 'na1') {
    return this.request(`/api/clash/v1/tournaments?region=${region}`);
  }

  // League-EXP (Experimental) APIs
  async getLeagueExpEntries(queue: string, tier: string, division: string, region = 'na1', page = 1) {
    return this.request(`/api/league-exp/v4/entries/${queue}/${tier}/${division}?region=${region}&page=${page}`);
  }

  // Utility method to get comprehensive player data
  async getComprehensivePlayerData(gameName: string, tagLine: string, region = 'na1') {
    try {
      // Get basic account and summoner info
      const [account, summoner] = await Promise.all([
        this.getAccountByRiotId(gameName, tagLine, region),
        this.getSummonerByRiotId(gameName, tagLine, region)
      ]);

      // Get detailed data using summoner info
      const [ranks, championMastery, challenges, matchIds] = await Promise.allSettled([
        this.getRanksBySummonerId(summoner.id, region),
        this.getChampionMasteryByPuuid(summoner.puuid, region),
        this.getPlayerChallenges(summoner.puuid, region),
        this.getMatchIdsByPuuid(summoner.puuid, region === 'na1' ? 'americas' : region, 10)
      ]);

      // Get match details for recent matches
      let matchDetails = null;
      if (matchIds.status === 'fulfilled' && matchIds.value.length > 0) {
        const recentMatches = await Promise.allSettled(
          matchIds.value.slice(0, 5).map(matchId => 
            this.getMatchDetails(matchId, region === 'na1' ? 'americas' : region)
          )
        );
        matchDetails = recentMatches
          .filter(result => result.status === 'fulfilled')
          .map(result => (result as PromiseFulfilledResult<MatchDto>).value);
      }

      return {
        account,
        summoner,
        ranks: ranks.status === 'fulfilled' ? ranks.value : [],
        championMastery: championMastery.status === 'fulfilled' ? championMastery.value : [],
        challenges: challenges.status === 'fulfilled' ? challenges.value : null,
        matchIds: matchIds.status === 'fulfilled' ? matchIds.value : [],
        matchDetails: matchDetails || [],
        region
      };
    } catch (error) {
      console.error('Failed to get comprehensive player data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const lolAPI = new LoLAnalyticsAPI();
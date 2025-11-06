// Data persistence and caching utilities
import React from 'react';

export interface UserPreferences {
  preferredRegion: string;
  theme: 'dark' | 'light' | 'auto';
  favoriteChampions: number[];
  notifications: {
    championRotation: boolean;
    serverStatus: boolean;
    matchUpdates: boolean;
  };
  analytics: {
    showAdvancedStats: boolean;
    defaultTimeRange: '7d' | '30d' | '3m' | '1y';
    preferredCharts: string[];
  };
}

export interface CachedMatchData {
  puuid: string;
  matches: string[];
  lastUpdated: number;
  expiresAt: number;
}

export interface CachedSummonerData {
  puuid: string;
  data: unknown;
  lastUpdated: number;
  expiresAt: number;
}

export interface CachedRankData {
  summonerId: string;
  data: unknown[];
  lastUpdated: number;
  expiresAt: number;
}

class LocalStorageManager {
  private static instance: LocalStorageManager;
  private readonly STORAGE_PREFIX = 'lol_analytics_';
  private readonly DEFAULT_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager();
    }
    return LocalStorageManager.instance;
  }

  // User Preferences Management
  getUserPreferences(): UserPreferences {
    const defaultPreferences: UserPreferences = {
      preferredRegion: 'na1',
      theme: 'dark',
      favoriteChampions: [],
      notifications: {
        championRotation: true,
        serverStatus: true,
        matchUpdates: false
      },
      analytics: {
        showAdvancedStats: false,
        defaultTimeRange: '30d',
        preferredCharts: ['winrate', 'performance', 'champions']
      }
    };

    try {
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}user_preferences`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultPreferences, ...parsed };
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }

    return defaultPreferences;
  }

  setUserPreferences(preferences: Partial<UserPreferences>): void {
    try {
      const current = this.getUserPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem(`${this.STORAGE_PREFIX}user_preferences`, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  // Match Data Caching
  getCachedMatches(puuid: string): CachedMatchData | null {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}matches_${puuid}`);
      if (stored) {
        const cached: CachedMatchData = JSON.parse(stored);
        if (Date.now() < cached.expiresAt) {
          return cached;
        } else {
          // Clean up expired cache
          this.clearCachedMatches(puuid);
        }
      }
    } catch (error) {
      console.error('Error loading cached matches:', error);
    }
    return null;
  }

  setCachedMatches(puuid: string, matches: string[], duration?: number): void {
    try {
      const cacheDuration = duration || this.DEFAULT_CACHE_DURATION;
      const now = Date.now();
      const cachedData: CachedMatchData = {
        puuid,
        matches,
        lastUpdated: now,
        expiresAt: now + cacheDuration
      };
      localStorage.setItem(`${this.STORAGE_PREFIX}matches_${puuid}`, JSON.stringify(cachedData));
    } catch (error) {
      console.error('Error caching matches:', error);
    }
  }

  clearCachedMatches(puuid: string): void {
    try {
      localStorage.removeItem(`${this.STORAGE_PREFIX}matches_${puuid}`);
    } catch (error) {
      console.error('Error clearing cached matches:', error);
    }
  }

  // Summoner Data Caching
  getCachedSummoner(puuid: string): CachedSummonerData | null {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}summoner_${puuid}`);
      if (stored) {
        const cached: CachedSummonerData = JSON.parse(stored);
        if (Date.now() < cached.expiresAt) {
          return cached;
        } else {
          this.clearCachedSummoner(puuid);
        }
      }
    } catch (error) {
      console.error('Error loading cached summoner:', error);
    }
    return null;
  }

  setCachedSummoner(puuid: string, data: unknown, duration?: number): void {
    try {
      const cacheDuration = duration || this.DEFAULT_CACHE_DURATION;
      const now = Date.now();
      const cachedData: CachedSummonerData = {
        puuid,
        data,
        lastUpdated: now,
        expiresAt: now + cacheDuration
      };
      localStorage.setItem(`${this.STORAGE_PREFIX}summoner_${puuid}`, JSON.stringify(cachedData));
    } catch (error) {
      console.error('Error caching summoner:', error);
    }
  }

  clearCachedSummoner(puuid: string): void {
    try {
      localStorage.removeItem(`${this.STORAGE_PREFIX}summoner_${puuid}`);
    } catch (error) {
      console.error('Error clearing cached summoner:', error);
    }
  }

  // Rank Data Caching
  getCachedRank(summonerId: string): CachedRankData | null {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}rank_${summonerId}`);
      if (stored) {
        const cached: CachedRankData = JSON.parse(stored);
        if (Date.now() < cached.expiresAt) {
          return cached;
        } else {
          this.clearCachedRank(summonerId);
        }
      }
    } catch (error) {
      console.error('Error loading cached rank:', error);
    }
    return null;
  }

  setCachedRank(summonerId: string, data: unknown[], duration?: number): void {
    try {
      const cacheDuration = duration || this.DEFAULT_CACHE_DURATION;
      const now = Date.now();
      const cachedData: CachedRankData = {
        summonerId,
        data,
        lastUpdated: now,
        expiresAt: now + cacheDuration
      };
      localStorage.setItem(`${this.STORAGE_PREFIX}rank_${summonerId}`, JSON.stringify(cachedData));
    } catch (error) {
      console.error('Error caching rank:', error);
    }
  }

  clearCachedRank(summonerId: string): void {
    try {
      localStorage.removeItem(`${this.STORAGE_PREFIX}rank_${summonerId}`);
    } catch (error) {
      console.error('Error clearing cached rank:', error);
    }
  }

  // Search History Management
  getSearchHistory(): string[] {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}search_history`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading search history:', error);
      return [];
    }
  }

  addToSearchHistory(searchTerm: string): void {
    try {
      const history = this.getSearchHistory();
      const updated = [searchTerm, ...history.filter(item => item !== searchTerm)].slice(0, 10);
      localStorage.setItem(`${this.STORAGE_PREFIX}search_history`, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating search history:', error);
    }
  }

  clearSearchHistory(): void {
    try {
      localStorage.removeItem(`${this.STORAGE_PREFIX}search_history`);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }

  // Favorite Players Management
  getFavoritePlayers(): string[] {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}favorite_players`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading favorite players:', error);
      return [];
    }
  }

  addFavoritePlayer(puuid: string): void {
    try {
      const favorites = this.getFavoritePlayers();
      if (!favorites.includes(puuid)) {
        const updated = [...favorites, puuid];
        localStorage.setItem(`${this.STORAGE_PREFIX}favorite_players`, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error adding favorite player:', error);
    }
  }

  removeFavoritePlayer(puuid: string): void {
    try {
      const favorites = this.getFavoritePlayers();
      const updated = favorites.filter(id => id !== puuid);
      localStorage.setItem(`${this.STORAGE_PREFIX}favorite_players`, JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing favorite player:', error);
    }
  }

  // Cache Management
  getCacheStats(): {
    totalItems: number;
    totalSize: number;
    cacheTypes: Record<string, number>;
  } {
    let totalItems = 0;
    let totalSize = 0;
    const cacheTypes: Record<string, number> = {};

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalItems++;
            totalSize += value.length;
            
            const type = key.split('_')[2] || 'other';
            cacheTypes[type] = (cacheTypes[type] || 0) + 1;
          }
        }
      }
    } catch (error) {
      console.error('Error calculating cache stats:', error);
    }

    return { totalItems, totalSize, cacheTypes };
  }

  clearExpiredCache(): number {
    let clearedItems = 0;
    const now = Date.now();

    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const parsed = JSON.parse(value);
              if (parsed.expiresAt && now >= parsed.expiresAt) {
                keysToRemove.push(key);
              }
            } catch {
              // If we can't parse it or it doesn't have expiration, skip
            }
          }
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        clearedItems++;
      });
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }

    return clearedItems;
  }

  clearAllCache(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX) && !key.includes('user_preferences')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  // Offline Mode Support
  getOfflineData(): {
    lastSyncTime: number;
    cachedPlayers: string[];
    availableFeatures: string[];
  } {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}offline_data`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }

    return {
      lastSyncTime: 0,
      cachedPlayers: [],
      availableFeatures: []
    };
  }

  setOfflineData(data: {
    lastSyncTime: number;
    cachedPlayers: string[];
    availableFeatures: string[];
  }): void {
    try {
      localStorage.setItem(`${this.STORAGE_PREFIX}offline_data`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  isOfflineMode(): boolean {
    return !navigator.onLine;
  }

  // Complete Player Data Caching for AI Dashboard
  getCachedPlayerData(gameName: string, tagLine: string): Record<string, unknown> | null {
    try {
      const key = `${this.STORAGE_PREFIX}player_data_${gameName}_${tagLine}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const cached = JSON.parse(stored);
        // Cache valid for 10 minutes
        if (Date.now() - cached.timestamp < 10 * 60 * 1000) {
          return cached.data;
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error loading cached player data:', error);
    }
    return null;
  }

  setCachedPlayerData(gameName: string, tagLine: string, data: unknown): void {
    try {
      const key = `${this.STORAGE_PREFIX}player_data_${gameName}_${tagLine}`;
      const cachedData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(cachedData));
    } catch (error) {
      console.error('Error caching player data:', error);
    }
  }

  clearCachedPlayerData(gameName: string, tagLine: string): void {
    try {
      const key = `${this.STORAGE_PREFIX}player_data_${gameName}_${tagLine}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing cached player data:', error);
    }
  }
}

export const localStorageManager = LocalStorageManager.getInstance();

// React hooks for easier integration
export function useUserPreferences() {
  const [preferences, setPreferences] = React.useState<UserPreferences>(
    localStorageManager.getUserPreferences()
  );

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    localStorageManager.setUserPreferences(updates);
    setPreferences(localStorageManager.getUserPreferences());
  };

  return { preferences, updatePreferences };
}

export function useCacheStats() {
  const [stats, setStats] = React.useState(localStorageManager.getCacheStats());

  const refreshStats = () => {
    setStats(localStorageManager.getCacheStats());
  };

  const clearExpired = () => {
    const cleared = localStorageManager.clearExpiredCache();
    refreshStats();
    return cleared;
  };

  const clearAll = () => {
    localStorageManager.clearAllCache();
    refreshStats();
  };

  return { stats, refreshStats, clearExpired, clearAll };
}
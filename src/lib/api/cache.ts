// API Response Caching Layer
// Implements in-memory caching for API responses to improve performance

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 100; // Maximum number of cached entries

  set(key: string, data: unknown, ttl: number = 3600000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Get cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{
      key: string;
      age: number;
      ttl: number;
      expired: boolean;
    }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
      expired: Date.now() - entry.timestamp > entry.ttl
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses for this
      entries
    };
  }

  // Clean up expired entries
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  // Static data - cache for 24 hours
  CHAMPIONS: 24 * 60 * 60 * 1000,
  ITEMS: 24 * 60 * 60 * 1000,
  RUNES: 24 * 60 * 60 * 1000,
  SUMMONER_SPELLS: 24 * 60 * 60 * 1000,
  
  // Player data - cache for 15 minutes
  SUMMONER: 15 * 60 * 1000,
  ACCOUNT: 15 * 60 * 1000,
  LEAGUE_ENTRIES: 15 * 60 * 1000,
  CHAMPION_MASTERY: 15 * 60 * 1000,
  CHALLENGES: 15 * 60 * 1000,
  
  // Match data - cache for 1 hour (matches don't change)
  MATCH_DETAILS: 60 * 60 * 1000,
  MATCH_TIMELINE: 60 * 60 * 1000,
  MATCH_IDS: 5 * 60 * 1000, // Match IDs change more frequently
  
  // Live data - cache for 30 seconds
  LIVE_GAME: 30 * 1000,
  SPECTATOR: 30 * 1000,
  
  // Clash data - cache for 1 hour
  CLASH: 60 * 60 * 1000,
} as const;

// Generate cache key for different types of requests
export function generateCacheKey(type: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${type}:${sortedParams}`;
}

// Create singleton cache instance
export const apiCache = new ApiCache();

// Auto-cleanup every 5 minutes
setInterval(() => {
  const cleaned = apiCache.cleanup();
  if (cleaned > 0) {
    console.log(`Cache cleanup: removed ${cleaned} expired entries`);
  }
}, 5 * 60 * 1000);

// Cache wrapper for fetch requests
export async function cachedFetch(
  url: string, 
  options: RequestInit = {}, 
  cacheKey: string, 
  ttl: number = CACHE_TTL.MATCH_DETAILS
): Promise<unknown> {
  // Check cache first
  const cached = apiCache.get(cacheKey);
  if (cached !== null) {
    console.log(`Cache hit: ${cacheKey}`);
    return cached;
  }

  console.log(`Cache miss: ${cacheKey}`);
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the response
    apiCache.set(cacheKey, data, ttl);
    
    return data;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
}

// Utility functions for common cache operations
export const cacheUtils = {
  // Clear all player-specific data
  clearPlayerData: (puuid: string) => {
    const keysToDelete: string[] = [];
    
    for (const key of apiCache['cache'].keys()) {
      if (key.includes(puuid)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => apiCache.delete(key));
    console.log(`Cleared ${keysToDelete.length} cache entries for player ${puuid}`);
  },
  
  // Clear all match data
  clearMatchData: () => {
    const keysToDelete: string[] = [];
    
    for (const key of apiCache['cache'].keys()) {
      if (key.startsWith('match:') || key.startsWith('timeline:')) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => apiCache.delete(key));
    console.log(`Cleared ${keysToDelete.length} match cache entries`);
  },
  
  // Clear all live data
  clearLiveData: () => {
    const keysToDelete: string[] = [];
    
    for (const key of apiCache['cache'].keys()) {
      if (key.startsWith('live:') || key.startsWith('spectator:')) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => apiCache.delete(key));
    console.log(`Cleared ${keysToDelete.length} live data cache entries`);
  },
  
  // Get cache statistics
  getStats: () => apiCache.getStats(),
  
  // Clear all cache
  clearAll: () => {
    apiCache.clear();
    console.log('Cleared all cache entries');
  }
};

export default apiCache;


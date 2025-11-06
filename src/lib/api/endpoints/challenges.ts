/**
 * LOL-CHALLENGES-V1 API Integration
 * Provides access to player challenges, achievements, and leaderboards
 */

// Challenge Types
export interface ChallengeLevel {
  level: 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER';
  current: number;
  max: number;
  percentile: number;
}

export interface CategoryPoints {
  level: 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER';
  current: number;
  max: number;
  percentile: number;
}

export interface Challenge {
  challengeId: number;
  percentile: number;
  level: 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER';
  value: number;
  achievedTime?: number;
  position?: number;
  playersInLevel?: number;
}

export interface ChallengePlayerData {
  totalPoints: ChallengeLevel;
  categoryPoints: {
    COLLECTION?: CategoryPoints;
    EXPERTISE?: CategoryPoints;
    TEAMWORK?: CategoryPoints;
    COMBAT?: CategoryPoints;
    LEGACY?: CategoryPoints;
    // New category names from API
    IMAGINATION?: CategoryPoints;
    VETERANCY?: CategoryPoints;
    [key: string]: CategoryPoints | undefined;
  };
  challenges: Challenge[];
  preferences?: {
    bannerAccent?: string;
    title?: string;
    challengeIds?: number[];
    crestBorder?: string;
    prestigeCrestBorderLevel?: number;
  };
}

export interface ChallengeConfig {
  id: number;
  localizedNames: {
    [locale: string]: {
      name: string;
      description: string;
      shortDescription: string;
    };
  };
  state: 'ENABLED' | 'DISABLED' | 'ARCHIVED';
  leaderboard: boolean;
  thresholds: {
    [level: string]: {
      value: number;
      rewards?: {
        rewardType: string;
        rewardValue: string;
        quantity: number;
      }[];
    };
  };
  tags: {
    [tag: string]: string;
  };
}

export interface LeaderboardEntry {
  puuid: string;
  value: number;
  position: number;
}

export interface ApexPlayerInfo {
  puuid: string;
  value: number;
  position: number;
}

// Challenge Categories with metadata
// Supports both old (COMBAT/LEGACY) and new (IMAGINATION/VETERANCY) category names
export const CHALLENGE_CATEGORIES = {
  COLLECTION: {
    name: 'Collection',
    description: 'Unlock champions, skins, and other collectibles',
    icon: '📚',
    color: 'from-purple-500 to-pink-500'
  },
  EXPERTISE: {
    name: 'Expertise',
    description: 'Master champions and game mechanics',
    icon: '🎯',
    color: 'from-blue-500 to-cyan-500'
  },
  TEAMWORK: {
    name: 'Teamwork',
    description: 'Excel in team coordination and support',
    icon: '🤝',
    color: 'from-green-500 to-teal-500'
  },
  COMBAT: {
    name: 'Combat',
    description: 'Dominate in fights and skirmishes',
    icon: '⚔️',
    color: 'from-red-500 to-orange-500'
  },
  LEGACY: {
    name: 'Legacy',
    description: 'Historical achievements and milestones',
    icon: '👑',
    color: 'from-yellow-500 to-amber-500'
  },
  // New category names (map to existing categories)
  IMAGINATION: {
    name: 'Imagination',
    description: 'Creative and innovative gameplay achievements',
    icon: '✨',
    color: 'from-indigo-500 to-purple-500',
    mappedTo: 'COMBAT' // Map to COMBAT for compatibility
  },
  VETERANCY: {
    name: 'Veterancy',
    description: 'Long-term dedication and experience',
    icon: '🏆',
    color: 'from-amber-500 to-orange-500',
    mappedTo: 'LEGACY' // Map to LEGACY for compatibility
  }
} as const;

// Challenge level colors and thresholds
export const CHALLENGE_LEVELS = {
  IRON: { color: 'text-gray-400', bg: 'bg-gray-600', threshold: 0 },
  BRONZE: { color: 'text-amber-600', bg: 'bg-amber-600', threshold: 1 },
  SILVER: { color: 'text-slate-400', bg: 'bg-slate-400', threshold: 2 },
  GOLD: { color: 'text-yellow-500', bg: 'bg-yellow-500', threshold: 3 },
  PLATINUM: { color: 'text-teal-500', bg: 'bg-teal-500', threshold: 4 },
  DIAMOND: { color: 'text-blue-500', bg: 'bg-blue-500', threshold: 5 },
  MASTER: { color: 'text-purple-500', bg: 'bg-purple-500', threshold: 6 },
  GRANDMASTER: { color: 'text-red-500', bg: 'bg-red-500', threshold: 7 },
  CHALLENGER: { color: 'text-orange-500', bg: 'bg-orange-500', threshold: 8 }
} as const;

/**
 * Challenges API Service Class
 */
export class ChallengesAPI {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  }

  /**
   * Get player challenge data by PUUID
   */
  async getPlayerData(puuid: string, region: string = 'na1'): Promise<ChallengePlayerData> {
    const response = await fetch(`${this.baseUrl}/api/challenges/v1/player-data/by-puuid/${puuid}?region=${region}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch challenge data: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Get challenge configuration data
   */
  async getChallengeConfig(region: string = 'na1'): Promise<ChallengeConfig[]> {
    const response = await fetch(`${this.baseUrl}/api/challenges/v1/challenges/config?region=${region}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch challenge config: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Get challenge percentiles for levels
   */
  async getChallengePercentiles(region: string = 'na1'): Promise<Record<string, number[]>> {
    const response = await fetch(`${this.baseUrl}/api/challenges/v1/challenges/percentiles?region=${region}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch challenge percentiles: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Get leaderboard for a specific challenge
   */
  async getChallengeLeaderboard(
    challengeId: number, 
    level: string = 'CHALLENGER',
    region: string = 'na1'
  ): Promise<LeaderboardEntry[]> {
    const response = await fetch(
      `${this.baseUrl}/api/challenges/v1/challenges/${challengeId}/leaderboards/by-level/${level}?region=${region}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch challenge leaderboard: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Get apex players for challenge leaderboard
   */
  async getApexPlayers(
    challengeId: number,
    region: string = 'na1'
  ): Promise<ApexPlayerInfo[]> {
    const response = await fetch(
      `${this.baseUrl}/api/challenges/v1/challenges/${challengeId}/apex-players?region=${region}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch apex players: ${response.status}`);
    }
    
    return response.json();
  }
}

/**
 * Utility functions for challenge data processing
 */
export class ChallengeUtils {
  /**
   * Calculate total challenge points across all categories
   */
  static calculateTotalPoints(categoryPoints: ChallengePlayerData['categoryPoints']): number {
    return Object.values(categoryPoints).reduce((total, category) => total + category.current, 0);
  }

  /**
   * Get the next milestone for a challenge level
   */
  static getNextMilestone(current: number, max: number, level: string): number {
    const levels = Object.keys(CHALLENGE_LEVELS);
    const currentLevelIndex = levels.indexOf(level);
    
    if (currentLevelIndex === levels.length - 1) {
      return max; // Already at highest level
    }
    
    // Calculate approximate next threshold
    const progressRatio = current / max;
    const nextLevelThreshold = Math.ceil(max * (progressRatio + 0.1));
    
    return Math.min(nextLevelThreshold, max);
  }

  /**
   * Format challenge value for display
   */
  static formatChallengeValue(value: number, challengeId: number): string {
    // Some challenges are percentages, others are counts
    if (challengeId === 1 || challengeId === 12) { // Example: damage-related challenges might be large numbers
      return value.toLocaleString();
    }
    
    if (value < 1) {
      return (value * 100).toFixed(1) + '%';
    }
    
    return value.toLocaleString();
  }

  /**
   * Get challenge category from challenge ID (simplified mapping)
   */
  static getChallengeCategory(challengeId: number): keyof typeof CHALLENGE_CATEGORIES {
    // This would need to be mapped from actual challenge config data
    // For now, using simplified logic
    if (challengeId >= 1 && challengeId <= 100) return 'COMBAT';
    if (challengeId >= 101 && challengeId <= 200) return 'EXPERTISE';
    if (challengeId >= 201 && challengeId <= 300) return 'TEAMWORK';
    if (challengeId >= 301 && challengeId <= 400) return 'COLLECTION';
    return 'LEGACY';
  }

  /**
   * Validate and normalize category key
   * Handles both old (COMBAT/LEGACY) and new (IMAGINATION/VETERANCY) category names
   */
  static validateCategoryKey(categoryKey: string): keyof typeof CHALLENGE_CATEGORIES | null {
    const normalizedKey = categoryKey.toUpperCase();
    
    // Direct match
    if (normalizedKey in CHALLENGE_CATEGORIES) {
      return normalizedKey as keyof typeof CHALLENGE_CATEGORIES;
    }
    
    // Map new category names to old ones for compatibility
    const categoryMapping: Record<string, keyof typeof CHALLENGE_CATEGORIES> = {
      'IMAGINATION': 'COMBAT',
      'VETERANCY': 'LEGACY'
    };
    
    if (normalizedKey in categoryMapping) {
      return categoryMapping[normalizedKey];
    }
    
    // Log unknown categories for debugging
    console.warn(`Unknown challenge category received: ${categoryKey}`);
    return null;
  }
  
  /**
   * Get the base category name for display (handles mapped categories)
   */
  static getDisplayCategory(categoryKey: string): keyof typeof CHALLENGE_CATEGORIES | null {
    const normalizedKey = categoryKey.toUpperCase();
    
    // If it's a new category that maps to an old one, return the mapping
    if (normalizedKey === 'IMAGINATION') return 'COMBAT';
    if (normalizedKey === 'VETERANCY') return 'LEGACY';
    
    // Otherwise validate normally
    return this.validateCategoryKey(categoryKey);
  }

  /**
   * Filter recent achievements (within last 30 days)
   */
  static getRecentAchievements(challenges: Challenge[]): Challenge[] {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    return challenges
      .filter(challenge => challenge.achievedTime && challenge.achievedTime > thirtyDaysAgo)
      .sort((a, b) => (b.achievedTime || 0) - (a.achievedTime || 0));
  }

  /**
   * Get challenges close to next level (within 90% of progress)
   */
  static getNearCompletionChallenges(challenges: Challenge[]): Challenge[] {
    return challenges.filter(challenge => {
      const level = challenge.level;
      const levelData = CHALLENGE_LEVELS[level as keyof typeof CHALLENGE_LEVELS];
      
      // Check if level exists in our mapping and is not the highest tier
      if (!levelData || level === 'CHALLENGER') {
        return false;
      }
      
      // Simple logic - would need actual threshold data from config
      return challenge.percentile >= 85;
    });
  }

  /**
   * Calculate overall rank based on total points and percentile
   */
  static calculateOverallRank(totalPoints: ChallengeLevel): string {
    const { percentile } = totalPoints;
    
    if (percentile >= 99) return `Top ${(100 - percentile).toFixed(1)}%`;
    if (percentile >= 95) return `Top 5%`;
    if (percentile >= 90) return `Top 10%`;
    if (percentile >= 75) return `Top 25%`;
    if (percentile >= 50) return `Top 50%`;
    
    return `${percentile.toFixed(0)}th percentile`;
  }
}

// Export singleton instance
export const challengesAPI = new ChallengesAPI();
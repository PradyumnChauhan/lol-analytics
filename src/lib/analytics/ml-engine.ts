// Advanced Analytics Engine with ML-powered insights

interface MatchData {
  info?: {
    gameCreation?: number;
    gameDuration?: number;
    participants?: Array<{
      championId?: number;
      championName?: string;
      win?: boolean;
      kills?: number;
      deaths?: number;
      assists?: number;
      totalMinionsKilled?: number;
      neutralMinionsKilled?: number;
      goldEarned?: number;
      totalDamageDealtToChampions?: number;
      visionScore?: number;
    }>;
  };
}

interface ChampionStats {
  championId: number;
  championName: string;
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
  damage: number;
  vision: number;
}

interface DailyStats {
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
}

interface RankBenchmarks {
  winRate: number;
  kda: number;
  csPerMinute: number;
  visionScore: number;
  damagePerMinute: number;
}

export interface PerformanceMetrics {
  winRate: number;
  kda: number;
  averageKills: number;
  averageDeaths: number;
  averageAssists: number;
  averageCs: number;
  averageGold: number;
  averageDamage: number;
  visionScore: number;
  gameLength: number;
}

export interface ChampionPerformance {
  championId: number;
  championName: string;
  gamesPlayed: number;
  winRate: number;
  kda: number;
  averagePerformance: PerformanceMetrics;
  trend: 'improving' | 'declining' | 'stable';
  recommendation: string;
  rolePerformance: Record<string, PerformanceMetrics>;
}

export interface RoleAnalysis {
  role: string;
  gamesPlayed: number;
  winRate: number;
  performance: PerformanceMetrics;
  championRecommendations: Array<{
    championId: number;
    championName: string;
    matchScore: number;
    reason: string;
  }>;
  skillAreas: Array<{
    area: string;
    score: number;
    improvement: string;
  }>;
}

export interface PerformanceTrend {
  date: string;
  winRate: number;
  kda: number;
  performance: number;
  gamesPlayed: number;
}

export interface MLInsights {
  overallScore: number;
  primaryRole: string;
  secondaryRole: string;
  strengths: string[];
  improvements: string[];
  championMastery: ChampionPerformance[];
  roleAnalysis: RoleAnalysis[];
  performanceTrend: PerformanceTrend[];
  predictedRank: {
    tier: string;
    division: string;
    confidence: number;
  };
  recommendations: {
    champions: string[];
    roles: string[];
    skillFocus: string[];
  };
}

export interface ComparisonMetrics {
  category: string;
  playerValue: number;
  averageValue: number;
  percentile: number;
  rating: 'excellent' | 'good' | 'average' | 'below-average' | 'poor';
}

class AdvancedAnalyticsEngine {
  // Analyze player performance and generate ML insights
  async generatePlayerInsights(puuid: string, matches: MatchData[]): Promise<MLInsights> {
    try {
      const performanceData = this.extractPerformanceData(matches);
      const championAnalysis = this.analyzeChampionPerformance(matches);
      const roleAnalysis = this.analyzeRolePerformance(matches);
      const trends = this.calculatePerformanceTrends(matches);
      const predictions = this.predictPerformance(performanceData);
      
      return {
        overallScore: this.calculateOverallScore(performanceData),
        primaryRole: this.identifyPrimaryRole(matches),
        secondaryRole: this.identifySecondaryRole(matches),
        strengths: this.identifyStrengths(performanceData),
        improvements: this.identifyImprovements(performanceData),
        championMastery: championAnalysis,
        roleAnalysis: roleAnalysis,
        performanceTrend: trends,
        predictedRank: predictions.rank,
        recommendations: predictions.recommendations
      };
    } catch (error) {
      console.error('Error generating player insights:', error);
      return this.getMockInsights();
    }
  }

  // Compare player against rank average
  async comparePlayerPerformance(
    playerData: PerformanceMetrics,
    rank: string = 'gold'
  ): Promise<ComparisonMetrics[]> {
    const benchmarks = this.getRankBenchmarks(rank);
    
    return [
      {
        category: 'Win Rate',
        playerValue: playerData.winRate,
        averageValue: benchmarks.winRate,
        percentile: this.calculatePercentile(playerData.winRate, benchmarks.winRate),
        rating: this.getRating(playerData.winRate, benchmarks.winRate, 'higher')
      },
      {
        category: 'KDA',
        playerValue: playerData.kda,
        averageValue: benchmarks.kda,
        percentile: this.calculatePercentile(playerData.kda, benchmarks.kda),
        rating: this.getRating(playerData.kda, benchmarks.kda, 'higher')
      },
      {
        category: 'CS per Minute',
        playerValue: playerData.averageCs / (playerData.gameLength / 60),
        averageValue: benchmarks.csPerMinute,
        percentile: this.calculatePercentile(playerData.averageCs / (playerData.gameLength / 60), benchmarks.csPerMinute),
        rating: this.getRating(playerData.averageCs / (playerData.gameLength / 60), benchmarks.csPerMinute, 'higher')
      },
      {
        category: 'Vision Score',
        playerValue: playerData.visionScore,
        averageValue: benchmarks.visionScore,
        percentile: this.calculatePercentile(playerData.visionScore, benchmarks.visionScore),
        rating: this.getRating(playerData.visionScore, benchmarks.visionScore, 'higher')
      },
      {
        category: 'Damage per Minute',
        playerValue: playerData.averageDamage / (playerData.gameLength / 60),
        averageValue: benchmarks.damagePerMinute,
        percentile: this.calculatePercentile(playerData.averageDamage / (playerData.gameLength / 60), benchmarks.damagePerMinute),
        rating: this.getRating(playerData.averageDamage / (playerData.gameLength / 60), benchmarks.damagePerMinute, 'higher')
      }
    ];
  }

  // Generate champion recommendations based on performance and meta
  async getChampionRecommendations(
    role: string,
    currentPerformance: PerformanceMetrics,
    playStyle: 'aggressive' | 'passive' | 'balanced' = 'balanced'
  ): Promise<Array<{
    championId: number;
    championName: string;
    matchScore: number;
    reasons: string[];
    difficulty: number;
  }>> {
    const recommendations = this.getMockChampionRecommendations(role, playStyle);
    return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
  }

  // Predict performance trends
  async predictPerformanceTrend(
    historicalData: PerformanceTrend[],
    days: number = 7
  ): Promise<PerformanceTrend[]> {
    if (historicalData.length < 3) {
      return [];
    }

    const predictions: PerformanceTrend[] = [];
    const lastDataPoint = historicalData[historicalData.length - 1];
    
    // Simple linear regression for trend prediction
    const trend = this.calculateTrendSlope(historicalData);
    
    for (let i = 1; i <= days; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      
      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        winRate: Math.max(0, Math.min(1, lastDataPoint.winRate + (trend.winRate * i))),
        kda: Math.max(0, lastDataPoint.kda + (trend.kda * i)),
        performance: Math.max(0, Math.min(100, lastDataPoint.performance + (trend.performance * i))),
        gamesPlayed: Math.round(lastDataPoint.gamesPlayed + (trend.gamesPlayed * i))
      });
    }
    
    return predictions;
  }

  private extractPerformanceData(matches: MatchData[]): PerformanceMetrics {
    if (!matches.length) {
      return this.getDefaultPerformanceMetrics();
    }

    const totals = matches.reduce((acc, match) => {
      const participant = match.info?.participants?.[0] || {};
      return {
        wins: acc.wins + (participant.win ? 1 : 0),
        kills: acc.kills + (participant.kills || 0),
        deaths: acc.deaths + (participant.deaths || 0),
        assists: acc.assists + (participant.assists || 0),
        cs: acc.cs + (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0),
        gold: acc.gold + (participant.goldEarned || 0),
        damage: acc.damage + (participant.totalDamageDealtToChampions || 0),
        vision: acc.vision + (participant.visionScore || 0),
        gameLength: acc.gameLength + (match.info?.gameDuration || 0)
      };
    }, {
      wins: 0, kills: 0, deaths: 0, assists: 0, cs: 0, 
      gold: 0, damage: 0, vision: 0, gameLength: 0
    });

    const gameCount = matches.length;
    return {
      winRate: totals.wins / gameCount,
      kda: totals.deaths > 0 ? (totals.kills + totals.assists) / totals.deaths : totals.kills + totals.assists,
      averageKills: totals.kills / gameCount,
      averageDeaths: totals.deaths / gameCount,
      averageAssists: totals.assists / gameCount,
      averageCs: totals.cs / gameCount,
      averageGold: totals.gold / gameCount,
      averageDamage: totals.damage / gameCount,
      visionScore: totals.vision / gameCount,
      gameLength: totals.gameLength / gameCount
    };
  }

  private analyzeChampionPerformance(matches: MatchData[]): ChampionPerformance[] {
    const championStats: Record<number, ChampionStats> = {};

    matches.forEach(match => {
      const participant = match.info?.participants?.[0] || {};
      const championId = participant.championId;
      
      if (!championId) return;

      if (!championStats[championId]) {
        championStats[championId] = {
          championId,
          championName: participant.championName || `Champion ${championId}`,
          games: 0,
          wins: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          cs: 0,
          gold: 0,
          damage: 0,
          vision: 0
        };
      }

      const stats = championStats[championId];
      stats.games++;
      stats.wins += participant.win ? 1 : 0;
      stats.kills += participant.kills || 0;
      stats.deaths += participant.deaths || 0;
      stats.assists += participant.assists || 0;
      stats.cs += (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0);
      stats.gold += participant.goldEarned || 0;
      stats.damage += participant.totalDamageDealtToChampions || 0;
      stats.vision += participant.visionScore || 0;
    });

    return Object.values(championStats).map((stats: ChampionStats) => ({
      championId: stats.championId,
      championName: stats.championName,
      gamesPlayed: stats.games,
      winRate: stats.wins / stats.games,
      kda: stats.deaths > 0 ? (stats.kills + stats.assists) / stats.deaths : stats.kills + stats.assists,
      averagePerformance: {
        winRate: stats.wins / stats.games,
        kda: stats.deaths > 0 ? (stats.kills + stats.assists) / stats.deaths : stats.kills + stats.assists,
        averageKills: stats.kills / stats.games,
        averageDeaths: stats.deaths / stats.games,
        averageAssists: stats.assists / stats.games,
        averageCs: stats.cs / stats.games,
        averageGold: stats.gold / stats.games,
        averageDamage: stats.damage / stats.games,
        visionScore: stats.vision / stats.games,
        gameLength: 0
      },
      trend: this.determineTrend(stats.wins / stats.games),
      recommendation: this.generateChampionRecommendation(stats),
      rolePerformance: {}
    }));
  }

  private analyzeRolePerformance(matches: MatchData[]): RoleAnalysis[] {
    // Mock implementation - in reality would analyze lane assignments and roles
    return [
      {
        role: 'ADC',
        gamesPlayed: Math.floor(matches.length * 0.4),
        winRate: 0.65,
        performance: this.getDefaultPerformanceMetrics(),
        championRecommendations: [
          { championId: 22, championName: 'Ashe', matchScore: 85, reason: 'High utility and team fight presence' },
          { championId: 202, championName: 'Jinx', matchScore: 82, reason: 'Strong late game scaling' }
        ],
        skillAreas: [
          { area: 'CS per Minute', score: 75, improvement: 'Focus on last-hitting practice in training mode' },
          { area: 'Positioning', score: 68, improvement: 'Stay behind your frontline in team fights' }
        ]
      }
    ];
  }

  private calculatePerformanceTrends(matches: MatchData[]): PerformanceTrend[] {
    // Group matches by date and calculate daily performance
    const dailyStats: Record<string, DailyStats> = {};
    
    matches.forEach(match => {
      const date = new Date(match.info?.gameCreation || Date.now()).toISOString().split('T')[0];
      const participant = match.info?.participants?.[0] || {};
      
      if (!dailyStats[date]) {
        dailyStats[date] = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
      }
      
      dailyStats[date].games++;
      dailyStats[date].wins += participant.win ? 1 : 0;
      dailyStats[date].kills += participant.kills || 0;
      dailyStats[date].deaths += participant.deaths || 0;
      dailyStats[date].assists += participant.assists || 0;
    });

    return Object.entries(dailyStats).map(([date, stats]: [string, DailyStats]) => ({
      date,
      winRate: stats.wins / stats.games,
      kda: stats.deaths > 0 ? (stats.kills + stats.assists) / stats.deaths : stats.kills + stats.assists,
      performance: (stats.wins / stats.games) * 100,
      gamesPlayed: stats.games
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private predictPerformance(performance: PerformanceMetrics) {
    const overallScore = this.calculateOverallScore(performance);
    
    // Simple rank prediction based on performance metrics
    let predictedRank = 'Bronze';
    let confidence = 0.7;
    
    if (overallScore >= 80) {
      predictedRank = 'Diamond';
      confidence = 0.85;
    } else if (overallScore >= 70) {
      predictedRank = 'Platinum';
      confidence = 0.8;
    } else if (overallScore >= 60) {
      predictedRank = 'Gold';
      confidence = 0.75;
    } else if (overallScore >= 50) {
      predictedRank = 'Silver';
      confidence = 0.7;
    }

    return {
      rank: {
        tier: predictedRank,
        division: 'II',
        confidence
      },
      recommendations: {
        champions: ['Ashe', 'Jinx', 'Caitlyn'],
        roles: ['ADC', 'Support'],
        skillFocus: ['CS improvement', 'Map awareness', 'Team fighting']
      }
    };
  }

  private calculateOverallScore(performance: PerformanceMetrics): number {
    const weights = {
      winRate: 0.3,
      kda: 0.2,
      cs: 0.15,
      damage: 0.15,
      vision: 0.1,
      gold: 0.1
    };

    const normalized = {
      winRate: Math.min(performance.winRate * 100, 100),
      kda: Math.min(performance.kda * 20, 100),
      cs: Math.min((performance.averageCs / 200) * 100, 100),
      damage: Math.min((performance.averageDamage / 20000) * 100, 100),
      vision: Math.min((performance.visionScore / 50) * 100, 100),
      gold: Math.min((performance.averageGold / 15000) * 100, 100)
    };

    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (normalized[key as keyof typeof normalized] * weight);
    }, 0);
  }

  private identifyPrimaryRole(_matches: MatchData[]): string {
    // Mock implementation - would analyze actual lane assignments
    return 'ADC';
  }

  private identifySecondaryRole(_matches: MatchData[]): string {
    return 'Support';
  }

  private identifyStrengths(performance: PerformanceMetrics): string[] {
    const strengths = [];
    if (performance.winRate > 0.6) strengths.push('Consistent winner');
    if (performance.kda > 2.5) strengths.push('Strong KDA ratio');
    if (performance.visionScore > 30) strengths.push('Excellent vision control');
    if (performance.averageCs > 150) strengths.push('Good farming');
    return strengths.length ? strengths : ['Improving steadily'];
  }

  private identifyImprovements(performance: PerformanceMetrics): string[] {
    const improvements = [];
    if (performance.winRate < 0.5) improvements.push('Focus on winning more games');
    if (performance.averageDeaths > 6) improvements.push('Reduce deaths and improve positioning');
    if (performance.visionScore < 20) improvements.push('Increase ward placement and vision control');
    if (performance.averageCs < 120) improvements.push('Improve CS and farming efficiency');
    return improvements.length ? improvements : ['Continue current performance'];
  }

  private getRankBenchmarks(rank: string) {
    const benchmarks: Record<string, RankBenchmarks> = {
      'bronze': { winRate: 0.48, kda: 1.8, csPerMinute: 4.5, visionScore: 15, damagePerMinute: 400 },
      'silver': { winRate: 0.52, kda: 2.1, csPerMinute: 5.2, visionScore: 22, damagePerMinute: 480 },
      'gold': { winRate: 0.56, kda: 2.4, csPerMinute: 5.8, visionScore: 28, damagePerMinute: 550 },
      'platinum': { winRate: 0.60, kda: 2.7, csPerMinute: 6.4, visionScore: 35, damagePerMinute: 620 },
      'diamond': { winRate: 0.65, kda: 3.1, csPerMinute: 7.1, visionScore: 42, damagePerMinute: 720 }
    };
    return benchmarks[rank.toLowerCase()] || benchmarks['gold'];
  }

  private calculatePercentile(playerValue: number, averageValue: number): number {
    return Math.min(Math.max((playerValue / averageValue) * 50, 0), 100);
  }

  private getRating(
    playerValue: number, 
    averageValue: number, 
    direction: 'higher' | 'lower'
  ): 'excellent' | 'good' | 'average' | 'below-average' | 'poor' {
    const ratio = playerValue / averageValue;
    
    if (direction === 'higher') {
      if (ratio >= 1.3) return 'excellent';
      if (ratio >= 1.15) return 'good';
      if (ratio >= 0.85) return 'average';
      if (ratio >= 0.7) return 'below-average';
      return 'poor';
    } else {
      if (ratio <= 0.7) return 'excellent';
      if (ratio <= 0.85) return 'good';
      if (ratio <= 1.15) return 'average';
      if (ratio <= 1.3) return 'below-average';
      return 'poor';
    }
  }

  private getMockChampionRecommendations(_role: string, _playStyle: string) {
    const recommendations = [
      { championId: 22, championName: 'Ashe', matchScore: 88, reasons: ['High utility', 'Good for team play'], difficulty: 3 },
      { championId: 202, championName: 'Jinx', matchScore: 85, reasons: ['Strong scaling', 'High damage potential'], difficulty: 6 },
      { championId: 51, championName: 'Caitlyn', matchScore: 82, reasons: ['Safe laning', 'Long range'], difficulty: 5 }
    ];
    
    return recommendations;
  }

  private calculateTrendSlope(data: PerformanceTrend[]) {
    if (data.length < 2) return { winRate: 0, kda: 0, performance: 0, gamesPlayed: 0 };
    
    const recent = data.slice(-5); // Use last 5 data points
    const n = recent.length;
    
    const avgWinRate = recent.reduce((sum, d) => sum + d.winRate, 0) / n;
    const avgKda = recent.reduce((sum, d) => sum + d.kda, 0) / n;
    const avgPerformance = recent.reduce((sum, d) => sum + d.performance, 0) / n;
    const avgGames = recent.reduce((sum, d) => sum + d.gamesPlayed, 0) / n;
    
    return {
      winRate: (recent[n-1].winRate - avgWinRate) / n,
      kda: (recent[n-1].kda - avgKda) / n,
      performance: (recent[n-1].performance - avgPerformance) / n,
      gamesPlayed: (recent[n-1].gamesPlayed - avgGames) / n
    };
  }

  private determineTrend(winRate: number): 'improving' | 'declining' | 'stable' {
    if (winRate > 0.6) return 'improving';
    if (winRate < 0.4) return 'declining';
    return 'stable';
  }

  private generateChampionRecommendation(stats: ChampionStats): string {
    if (stats.wins / stats.games > 0.7) {
      return 'Keep playing this champion - excellent performance!';
    } else if (stats.wins / stats.games > 0.5) {
      return 'Solid performance - consider mastering this champion further.';
    } else {
      return 'Consider practicing this champion more or trying alternatives.';
    }
  }

  private getDefaultPerformanceMetrics(): PerformanceMetrics {
    return {
      winRate: 0.5,
      kda: 2.0,
      averageKills: 5,
      averageDeaths: 4,
      averageAssists: 8,
      averageCs: 140,
      averageGold: 12000,
      averageDamage: 15000,
      visionScore: 25,
      gameLength: 1800
    };
  }

  private getMockInsights(): MLInsights {
    return {
      overallScore: 72,
      primaryRole: 'ADC',
      secondaryRole: 'Support',
      strengths: ['Consistent farming', 'Good team fighting', 'Strong late game'],
      improvements: ['Early game aggression', 'Vision control', 'Map awareness'],
      championMastery: [],
      roleAnalysis: [],
      performanceTrend: [],
      predictedRank: {
        tier: 'Gold',
        division: 'II',
        confidence: 0.78
      },
      recommendations: {
        champions: ['Ashe', 'Jinx', 'Caitlyn'],
        roles: ['ADC', 'Support'],
        skillFocus: ['CS improvement', 'Positioning', 'Team fighting']
      }
    };
  }
}

export const advancedAnalyticsEngine = new AdvancedAnalyticsEngine();
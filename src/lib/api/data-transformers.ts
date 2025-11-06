// Data Transformation Utilities
// Functions to transform raw API data into frontend-friendly formats

import { ParticipantDto } from '@/types/riot-api';

// Match Data Transformations
export interface TransformedMatchData {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  gameMode: string;
  gameType: string;
  queueId: number;
  endOfGameResult: string;
  participant: ParticipantDto;
  teamId: number;
  win: boolean;
  // Calculated fields
  performanceGrade: string;
  kda: number;
  csPerMinute: number;
  goldPerMinute: number;
  damagePerMinute: number;
  visionScorePerMinute: number;
  killParticipation: number;
  damageShare: number;
  goldShare: number;
  multikillCount: number;
  firstBlood: boolean;
  firstTower: boolean;
  // Timeline data (if available)
  timeline?: any;
}

export function transformMatchData(match: any, puuid: string): TransformedMatchData | null {
  if (!match?.info?.participants) return null;
  
  const participant = match.info.participants.find((p: any) => p.puuid === puuid);
  if (!participant) return null;

  const gameDurationMinutes = match.info.gameDuration / 60;
  
  // Calculate KDA
  const kda = participant.deaths > 0 
    ? (participant.kills + participant.assists) / participant.deaths 
    : participant.kills + participant.assists;

  // Calculate per-minute stats
  const csPerMinute = (participant.totalMinionsKilled + (participant.neutralMinionsKilled || 0)) / gameDurationMinutes;
  const goldPerMinute = participant.goldEarned / gameDurationMinutes;
  const damagePerMinute = participant.totalDamageDealtToChampions / gameDurationMinutes;
  const visionScorePerMinute = participant.visionScore / gameDurationMinutes;

  // Calculate team damage/gold share
  const teamParticipants = match.info.participants.filter((p: any) => p.teamId === participant.teamId);
  const teamDamage = teamParticipants.reduce((sum: number, p: any) => sum + (p.totalDamageDealtToChampions || 0), 0);
  const teamGold = teamParticipants.reduce((sum: number, p: any) => sum + (p.goldEarned || 0), 0);
  
  const damageShare = teamDamage > 0 ? (participant.totalDamageDealtToChampions / teamDamage) * 100 : 0;
  const goldShare = teamGold > 0 ? (participant.goldEarned / teamGold) * 100 : 0;

  // Calculate kill participation
  const teamKills = teamParticipants.reduce((sum: number, p: any) => sum + (p.kills || 0), 0);
  const killParticipation = teamKills > 0 ? ((participant.kills + participant.assists) / teamKills) * 100 : 0;

  // Calculate multikills
  const multikillCount = (participant.doubleKills || 0) + 
                        (participant.tripleKills || 0) + 
                        (participant.quadraKills || 0) + 
                        (participant.pentaKills || 0);

  // Calculate performance grade
  const performanceGrade = calculatePerformanceGrade(
    kda,
    participant.win ? 100 : 0, // Win rate for single match
    damageShare,
    participant.visionScore,
    csPerMinute,
    killParticipation,
    multikillCount
  );

  return {
    matchId: match.metadata.matchId,
    gameCreation: match.info.gameCreation,
    gameDuration: match.info.gameDuration,
    gameMode: match.info.gameMode,
    gameType: match.info.gameType,
    queueId: match.info.queueId || 0,
    endOfGameResult: match.info.endOfGameResult,
    participant,
    teamId: participant.teamId,
    win: participant.win,
    performanceGrade,
    kda,
    csPerMinute,
    goldPerMinute,
    damagePerMinute,
    visionScorePerMinute,
    killParticipation,
    damageShare,
    goldShare,
    multikillCount,
    firstBlood: participant.firstBloodKill || participant.firstBloodAssist,
    firstTower: participant.firstTowerKill || participant.firstTowerAssist,
  };
}

// Champion Mastery Transformations
export interface TransformedMasteryData {
  championId: number;
  championName: string;
  championLevel: number;
  championPoints: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  lastPlayTime: number;
  tokensEarned: number;
  // New season milestone fields
  championSeasonMilestone?: number;
  milestoneGrades?: any[];
  nextSeasonMilestone?: {
    requireGradeCounts?: Record<string, number>;
    rewardMarks?: number;
    bonus?: boolean;
    totalGamesRequires?: number;
  };
  markRequiredForNextLevel?: number;
  // Calculated fields
  progressPercent: number;
  daysSinceLastPlay: number;
  isMaxLevel: boolean;
  nextLevelPoints: number;
}

export function transformMasteryData(mastery: any[]): TransformedMasteryData[] {
  // Dynamic import to avoid circular dependencies
  let getChampionName: (id: number) => string;
  try {
    const champions = require('@/lib/champions');
    getChampionName = champions.getChampionName;
  } catch {
    // Fallback if import fails
    getChampionName = (id: number) => `Champion_${id}`;
  }
  
  return mastery.map(m => {
    const pointsToNext = m.championPointsUntilNextLevel || 0;
    const pointsSinceLast = m.championPointsSinceLastLevel || 0;
    const totalPointsForLevel = pointsToNext + pointsSinceLast;
    const progressPercent = totalPointsForLevel > 0 ? (pointsSinceLast / totalPointsForLevel) * 100 : 0;
    
    const lastPlayTime = m.lastPlayTime ? new Date(m.lastPlayTime) : null;
    const daysSinceLastPlay = lastPlayTime ? Math.floor((Date.now() - lastPlayTime.getTime()) / (1000 * 60 * 60 * 24)) : -1;
    
    return {
      championId: m.championId,
      championName: m.championName || getChampionName(m.championId),
      championLevel: m.championLevel,
      championPoints: m.championPoints,
      championPointsSinceLastLevel: pointsSinceLast,
      championPointsUntilNextLevel: pointsToNext,
      chestGranted: m.chestGranted,
      lastPlayTime: m.lastPlayTime,
      tokensEarned: m.tokensEarned || 0,
      // New season milestone fields
      championSeasonMilestone: m.championSeasonMilestone,
      milestoneGrades: m.milestoneGrades || [],
      nextSeasonMilestone: m.nextSeasonMilestone,
      markRequiredForNextLevel: m.markRequiredForNextLevel,
      // Calculated fields
      progressPercent,
      daysSinceLastPlay,
      isMaxLevel: m.championLevel >= 7,
      nextLevelPoints: totalPointsForLevel,
    };
  });
}

// Challenge Data Transformations
export interface TransformedChallengeData {
  totalPoints: {
    current: number;
    max: number;
    percentile: number;
  };
  categoryPoints: Array<{
    category: string;
    current: number;
    max: number;
    percentile: number;
    tier: string;
  }>;
  challenges: Array<{
    challengeId: number;
    level: string;
    value: number;
    percentile: number;
    name: string;
    description: string;
  }>;
}

export function transformChallengeData(challenges: any): TransformedChallengeData {
  if (!challenges) {
    return {
      totalPoints: { current: 0, max: 0, percentile: 0 },
      categoryPoints: [],
      challenges: []
    };
  }

  return {
    totalPoints: {
      current: challenges.totalPoints?.current || 0,
      max: challenges.totalPoints?.max || 0,
      percentile: challenges.totalPoints?.percentile || 0
    },
    categoryPoints: challenges.categoryPoints?.map((cat: any) => ({
      category: cat.category,
      current: cat.current,
      max: cat.max,
      percentile: cat.percentile,
      tier: cat.tier
    })) || [],
    challenges: challenges.challenges?.map((challenge: any) => ({
      challengeId: challenge.challengeId,
      level: challenge.level,
      value: challenge.value,
      percentile: challenge.percentile,
      name: challenge.name || `Challenge ${challenge.challengeId}`,
      description: challenge.description || ''
    })) || []
  };
}

// Champion Statistics Aggregation
export interface ChampionStats {
  championId: number;
  championName: string;
  games: number;
  wins: number;
  winRate: number;
  avgKDA: number;
  avgDamage: number;
  avgVision: number;
  avgGold: number;
  avgCS: number;
  performanceGrade: string;
  recentForm: boolean[];
  roles: string[];
  lastPlayed: number;
  multikills: number;
  firstBloodRate: number;
  damageShare: number;
  goldShare: number;
  killParticipation: number;
}

export function aggregateChampionStats(
  matches: any[], 
  mastery: any[], 
  puuid: string
): ChampionStats[] {
  const championMap = new Map<number, ChampionStats>();

  // Initialize with mastery data
  mastery.forEach(m => {
    championMap.set(m.championId, {
      championId: m.championId,
      championName: m.championName || `Champion_${m.championId}`,
      games: 0,
      wins: 0,
      winRate: 0,
      avgKDA: 0,
      avgDamage: 0,
      avgVision: 0,
      avgGold: 0,
      avgCS: 0,
      performanceGrade: 'D',
      recentForm: [],
      roles: [],
      lastPlayed: m.lastPlayTime || 0,
      multikills: 0,
      firstBloodRate: 0,
      damageShare: 0,
      goldShare: 0,
      killParticipation: 0
    });
  });

  // Aggregate match data
  matches.forEach(match => {
    const participant = match.info?.participants?.find((p: any) => p.puuid === puuid);
    if (!participant) return;

    const champId = participant.championId;
    const stats = championMap.get(champId);
    if (!stats) return;

    stats.games++;
    if (participant.win) stats.wins++;
    
    const kda = participant.deaths > 0 
      ? (participant.kills + participant.assists) / participant.deaths 
      : participant.kills + participant.assists;
    
    stats.avgKDA = ((stats.avgKDA * (stats.games - 1)) + kda) / stats.games;
    stats.avgDamage = ((stats.avgDamage * (stats.games - 1)) + participant.totalDamageDealtToChampions) / stats.games;
    stats.avgVision = ((stats.avgVision * (stats.games - 1)) + participant.visionScore) / stats.games;
    stats.avgGold = ((stats.avgGold * (stats.games - 1)) + participant.goldEarned) / stats.games;
    stats.avgCS = ((stats.avgCS * (stats.games - 1)) + (participant.totalMinionsKilled + (participant.neutralMinionsKilled || 0))) / stats.games;
    
    stats.recentForm.push(participant.win);
    stats.roles.push(participant.individualPosition || participant.teamPosition || 'UNKNOWN');
    stats.multikills += (participant.doubleKills || 0) + (participant.tripleKills || 0) + (participant.quadraKills || 0) + (participant.pentaKills || 0);
    
    if (participant.firstBloodKill || participant.firstBloodAssist) {
      stats.firstBloodRate = ((stats.firstBloodRate * (stats.games - 1)) + 100) / stats.games;
    } else {
      stats.firstBloodRate = ((stats.firstBloodRate * (stats.games - 1)) + 0) / stats.games;
    }
  });

  // Calculate final stats
  championMap.forEach(stats => {
    if (stats.games > 0) {
      stats.winRate = (stats.wins / stats.games) * 100;
      stats.recentForm = stats.recentForm.slice(-5); // Last 5 games
      stats.performanceGrade = calculatePerformanceGrade(
        stats.avgKDA,
        stats.winRate,
        0, // damageShare - would need team data
        stats.avgVision,
        stats.avgCS / 15, // CS per minute (assuming 15 min average)
        stats.killParticipation,
        stats.multikills
      );
    }
  });

  return Array.from(championMap.values()).sort((a, b) => b.games - a.games);
}

// Performance Trends Calculation
export interface PerformanceTrend {
  date: string;
  winRate: number;
  kda: number;
  damage: number;
  vision: number;
  cs: number;
  performance: number;
  gamesPlayed: number;
}

export function calculateTrends(matches: any[], puuid: string): PerformanceTrend[] {
  const trends: PerformanceTrend[] = [];
  const dailyStats = new Map<string, {
    games: number;
    wins: number;
    kda: number[];
    damage: number[];
    vision: number[];
    cs: number[];
  }>();

  // Group matches by date
  matches.forEach(match => {
    const participant = match.info?.participants?.find((p: any) => p.puuid === puuid);
    if (!participant) return;

    const date = new Date(match.info.gameCreation).toISOString().split('T')[0];
    const kda = participant.deaths > 0 
      ? (participant.kills + participant.assists) / participant.deaths 
      : participant.kills + participant.assists;

    if (!dailyStats.has(date)) {
      dailyStats.set(date, {
        games: 0,
        wins: 0,
        kda: [],
        damage: [],
        vision: [],
        cs: []
      });
    }

    const stats = dailyStats.get(date)!;
    stats.games++;
    if (participant.win) stats.wins++;
    stats.kda.push(kda);
    stats.damage.push(participant.totalDamageDealtToChampions);
    stats.vision.push(participant.visionScore);
    stats.cs.push(participant.totalMinionsKilled + (participant.neutralMinionsKilled || 0));
  });

  // Calculate daily averages
  dailyStats.forEach((stats, date) => {
    const winRate = (stats.wins / stats.games) * 100;
    const avgKDA = stats.kda.reduce((sum, kda) => sum + kda, 0) / stats.kda.length;
    const avgDamage = stats.damage.reduce((sum, dmg) => sum + dmg, 0) / stats.damage.length;
    const avgVision = stats.vision.reduce((sum, vis) => sum + vis, 0) / stats.vision.length;
    const avgCS = stats.cs.reduce((sum, cs) => sum + cs, 0) / stats.cs.length;
    
    // Calculate overall performance score
    const performance = (winRate * 0.3) + (avgKDA * 20) + (avgDamage / 1000) + (avgVision * 2) + (avgCS / 10);

    trends.push({
      date,
      winRate,
      kda: avgKDA,
      damage: avgDamage,
      vision: avgVision,
      cs: avgCS,
      performance,
      gamesPlayed: stats.games
    });
  });

  return trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Timeline Data Extraction
export function extractTimelineData(timeline: any, puuid: string): any {
  if (!timeline?.frames) return null;

  const participantId = timeline.metadata?.participants?.indexOf(puuid);
  if (participantId === -1) return null;

  return {
    frames: timeline.frames.map((frame: any) => ({
      timestamp: frame.timestamp,
      participantFrames: frame.participantFrames?.[participantId] || null,
      events: frame.events || []
    }))
  };
}

// Performance Grade Calculation (from match-analytics.ts)
function calculatePerformanceGrade(
  kda: number,
  winRate: number,
  damageShare: number = 0,
  visionScore: number = 0,
  csPerMinute: number = 0,
  killParticipation: number = 0,
  multikills: number = 0
): string {
  let score = 0;
  
  // KDA scoring (0-30 points)
  if (kda >= 4.0) score += 30;
  else if (kda >= 3.0) score += 25;
  else if (kda >= 2.5) score += 20;
  else if (kda >= 2.0) score += 15;
  else if (kda >= 1.5) score += 10;
  else if (kda >= 1.0) score += 5;
  
  // Win rate scoring (0-25 points)
  if (winRate >= 70) score += 25;
  else if (winRate >= 60) score += 20;
  else if (winRate >= 55) score += 15;
  else if (winRate >= 50) score += 10;
  else if (winRate >= 45) score += 5;
  
  // Damage share scoring (0-15 points)
  if (damageShare >= 30) score += 15;
  else if (damageShare >= 25) score += 12;
  else if (damageShare >= 20) score += 9;
  else if (damageShare >= 15) score += 6;
  else if (damageShare >= 10) score += 3;
  
  // Vision score bonus (0-10 points)
  if (visionScore >= 50) score += 10;
  else if (visionScore >= 40) score += 8;
  else if (visionScore >= 30) score += 6;
  else if (visionScore >= 20) score += 4;
  else if (visionScore >= 10) score += 2;
  
  // CS per minute bonus (0-10 points)
  if (csPerMinute >= 8) score += 10;
  else if (csPerMinute >= 7) score += 8;
  else if (csPerMinute >= 6) score += 6;
  else if (csPerMinute >= 5) score += 4;
  else if (csPerMinute >= 4) score += 2;
  
  // Kill participation bonus (0-10 points)
  if (killParticipation >= 80) score += 10;
  else if (killParticipation >= 70) score += 8;
  else if (killParticipation >= 60) score += 6;
  else if (killParticipation >= 50) score += 4;
  else if (killParticipation >= 40) score += 2;
  
  // Grade assignment
  if (score >= 85) return 'S+';
  if (score >= 75) return 'S';
  if (score >= 65) return 'A';
  if (score >= 50) return 'B';
  if (score >= 35) return 'C';
  return 'D';
}


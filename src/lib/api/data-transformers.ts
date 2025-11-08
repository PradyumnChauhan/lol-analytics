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
  timeline?: Record<string, unknown>;
}

export function transformMatchData(match: Record<string, unknown>, puuid: string): TransformedMatchData | null {
  const matchInfo = match.info as { participants?: Array<{ puuid: string; [key: string]: unknown }> } | undefined;
  if (!matchInfo?.participants) return null;
  
  const participant = matchInfo?.participants?.find((p: { puuid: string }) => p.puuid === puuid);
  if (!participant) return null;

  const matchInfoWithDuration = matchInfo as { gameDuration?: number } | undefined;
  const gameDurationMinutes = (matchInfoWithDuration?.gameDuration || 0) / 60;
  
  // Calculate KDA
  const participantData = participant as { deaths?: number; kills?: number; assists?: number; totalMinionsKilled?: number; neutralMinionsKilled?: number; goldEarned?: number; totalDamageDealtToChampions?: number; visionScore?: number; teamId?: number };
  const kda = (participantData.deaths || 0) > 0 
    ? ((participantData.kills || 0) + (participantData.assists || 0)) / (participantData.deaths || 1)
    : (participantData.kills || 0) + (participantData.assists || 0);

  // Calculate per-minute stats
  const csPerMinute = ((participantData.totalMinionsKilled || 0) + (participantData.neutralMinionsKilled || 0)) / gameDurationMinutes;
  const goldPerMinute = (participantData.goldEarned || 0) / gameDurationMinutes;
  const damagePerMinute = (participantData.totalDamageDealtToChampions || 0) / gameDurationMinutes;
  const visionScorePerMinute = (participantData.visionScore || 0) / gameDurationMinutes;

  // Calculate team damage/gold share
  const teamParticipants = (matchInfo?.participants || []).filter((p) => {
    const pData = p as { teamId?: number };
    return pData.teamId === participantData.teamId;
  });
  const teamDamage = teamParticipants.reduce((sum: number, p) => {
    const pData = p as { totalDamageDealtToChampions?: number };
    return sum + (typeof pData.totalDamageDealtToChampions === 'number' ? pData.totalDamageDealtToChampions : 0);
  }, 0);
  const teamGold = teamParticipants.reduce((sum: number, p) => {
    const pData = p as { goldEarned?: number };
    return sum + (typeof pData.goldEarned === 'number' ? pData.goldEarned : 0);
  }, 0);
  
  const participantDamage = typeof participantData.totalDamageDealtToChampions === 'number' ? participantData.totalDamageDealtToChampions : 0;
  const participantGold = typeof participantData.goldEarned === 'number' ? participantData.goldEarned : 0;
  const damageShare = teamDamage > 0 ? (participantDamage / teamDamage) * 100 : 0;
  const goldShare = teamGold > 0 ? (participantGold / teamGold) * 100 : 0;

  // Calculate kill participation
  const teamKills = teamParticipants.reduce((sum: number, p) => {
    const pData = p as { kills?: number };
    return sum + (typeof pData.kills === 'number' ? pData.kills : 0);
  }, 0);
  const participantKills = typeof participantData.kills === 'number' ? participantData.kills : 0;
  const participantAssists = typeof participantData.assists === 'number' ? participantData.assists : 0;
  const killParticipation = teamKills > 0 ? ((participantKills + participantAssists) / teamKills) * 100 : 0;

  // Calculate multikills
  const multikillCount = ((participantData as { doubleKills?: number; tripleKills?: number; quadraKills?: number; pentaKills?: number }).doubleKills || 0) + 
                        ((participantData as { doubleKills?: number; tripleKills?: number; quadraKills?: number; pentaKills?: number }).tripleKills || 0) + 
                        ((participantData as { doubleKills?: number; tripleKills?: number; quadraKills?: number; pentaKills?: number }).quadraKills || 0) + 
                        ((participantData as { doubleKills?: number; tripleKills?: number; quadraKills?: number; pentaKills?: number }).pentaKills || 0);

  // Calculate performance grade
  const performanceGrade = calculatePerformanceGrade(
    kda,
    (participantData as { win?: boolean }).win ? 100 : 0, // Win rate for single match
    damageShare,
    participantData.visionScore || 0,
    csPerMinute,
    killParticipation,
    multikillCount
  );

  const matchMetadata = match.metadata as { matchId?: string } | undefined;
  const matchInfoForReturn = match.info as { gameCreation?: number; gameDuration?: number; gameMode?: string; gameType?: string; queueId?: number; endOfGameResult?: string } | undefined;

  return {
    matchId: matchMetadata?.matchId || '',
    gameCreation: matchInfoForReturn?.gameCreation || 0,
    gameDuration: matchInfoForReturn?.gameDuration || 0,
    gameMode: matchInfoForReturn?.gameMode || '',
    gameType: matchInfoForReturn?.gameType || '',
    queueId: matchInfoForReturn?.queueId || 0,
    endOfGameResult: matchInfoForReturn?.endOfGameResult || '',
    participant: participantData as ParticipantDto,
    teamId: participantData.teamId || 0,
    win: (participantData as { win?: boolean }).win || false,
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
    firstBlood: ((participantData as { firstBloodKill?: boolean; firstBloodAssist?: boolean }).firstBloodKill || (participantData as { firstBloodKill?: boolean; firstBloodAssist?: boolean }).firstBloodAssist) || false,
    firstTower: ((participantData as { firstTowerKill?: boolean; firstTowerAssist?: boolean }).firstTowerKill || (participantData as { firstTowerKill?: boolean; firstTowerAssist?: boolean }).firstTowerAssist) || false,
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
  milestoneGrades?: Array<Record<string, unknown>>;
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

export function transformMasteryData(mastery: Array<Record<string, unknown>>): TransformedMasteryData[] {
  // Dynamic import to avoid circular dependencies
  const getChampionName = (id: number): string => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const champions = require('@/lib/champions');
      return champions.getChampionName(id);
    } catch {
      // Fallback if import fails
      return `Champion_${id}`;
    }
  };
  
  return mastery.map(m => {
    const pointsToNext = typeof m.championPointsUntilNextLevel === 'number' ? m.championPointsUntilNextLevel : 0;
    const pointsSinceLast = typeof m.championPointsSinceLastLevel === 'number' ? m.championPointsSinceLastLevel : 0;
    const totalPointsForLevel = pointsToNext + pointsSinceLast;
    const progressPercent = totalPointsForLevel > 0 ? (pointsSinceLast / totalPointsForLevel) * 100 : 0;
    
    const lastPlayTimeValue = typeof m.lastPlayTime === 'number' ? m.lastPlayTime : (typeof m.lastPlayTime === 'string' ? parseInt(m.lastPlayTime, 10) : null);
    const lastPlayTime = lastPlayTimeValue !== null && !isNaN(lastPlayTimeValue) ? new Date(lastPlayTimeValue) : null;
    const daysSinceLastPlay = lastPlayTime ? Math.floor((Date.now() - lastPlayTime.getTime()) / (1000 * 60 * 60 * 24)) : -1;
    
    const championId = typeof m.championId === 'number' ? m.championId : 0;
    const championLevel = typeof m.championLevel === 'number' ? m.championLevel : 0;
    const championPoints = typeof m.championPoints === 'number' ? m.championPoints : 0;
    const chestGranted = typeof m.chestGranted === 'boolean' ? m.chestGranted : false;
    const lastPlayTimeNum = typeof m.lastPlayTime === 'number' ? m.lastPlayTime : 0;
    
    return {
      championId,
      championName: (typeof m.championName === 'string' ? m.championName : '') || getChampionName(championId),
      championLevel,
      championPoints,
      championPointsSinceLastLevel: pointsSinceLast,
      championPointsUntilNextLevel: pointsToNext,
      chestGranted,
      lastPlayTime: lastPlayTimeNum,
      tokensEarned: typeof m.tokensEarned === 'number' ? m.tokensEarned : 0,
      // New season milestone fields
      championSeasonMilestone: typeof m.championSeasonMilestone === 'number' ? m.championSeasonMilestone : undefined,
      milestoneGrades: Array.isArray(m.milestoneGrades) ? m.milestoneGrades as Array<Record<string, unknown>> : [],
      nextSeasonMilestone: typeof m.nextSeasonMilestone === 'object' && m.nextSeasonMilestone !== null ? m.nextSeasonMilestone as { requireGradeCounts?: Record<string, number>; rewardMarks?: number; bonus?: boolean; totalGamesRequires?: number } : undefined,
      markRequiredForNextLevel: typeof m.markRequiredForNextLevel === 'number' ? m.markRequiredForNextLevel : undefined,
      // Calculated fields
      progressPercent,
      daysSinceLastPlay,
      isMaxLevel: championLevel >= 7,
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

export function transformChallengeData(challenges: Record<string, unknown> | null | undefined): TransformedChallengeData {
  if (!challenges) {
    return {
      totalPoints: { current: 0, max: 0, percentile: 0 },
      categoryPoints: [],
      challenges: []
    };
  }

  const totalPointsObj = typeof challenges.totalPoints === 'object' && challenges.totalPoints !== null ? challenges.totalPoints as Record<string, unknown> : null;
  const categoryPointsArr = Array.isArray(challenges.categoryPoints) ? challenges.categoryPoints as Array<Record<string, unknown>> : [];
  const challengesArr = Array.isArray(challenges.challenges) ? challenges.challenges as Array<Record<string, unknown>> : [];
  
  return {
    totalPoints: {
      current: typeof totalPointsObj?.current === 'number' ? totalPointsObj.current : 0,
      max: typeof totalPointsObj?.max === 'number' ? totalPointsObj.max : 0,
      percentile: typeof totalPointsObj?.percentile === 'number' ? totalPointsObj.percentile : 0
    },
    categoryPoints: categoryPointsArr.map((cat: Record<string, unknown>) => ({
      category: typeof cat.category === 'string' ? cat.category : '',
      current: typeof cat.current === 'number' ? cat.current : 0,
      max: typeof cat.max === 'number' ? cat.max : 0,
      percentile: typeof cat.percentile === 'number' ? cat.percentile : 0,
      tier: typeof cat.tier === 'string' ? cat.tier : ''
    })),
    challenges: challengesArr.map((challenge: Record<string, unknown>) => ({
      challengeId: typeof challenge.challengeId === 'number' ? challenge.challengeId : 0,
      level: typeof challenge.level === 'string' ? challenge.level : '',
      value: typeof challenge.value === 'number' ? challenge.value : 0,
      percentile: typeof challenge.percentile === 'number' ? challenge.percentile : 0,
      name: typeof challenge.name === 'string' ? challenge.name : `Challenge ${typeof challenge.challengeId === 'number' ? challenge.challengeId : 0}`,
      description: typeof challenge.description === 'string' ? challenge.description : ''
    }))
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
  matches: Array<Record<string, unknown>>, 
  mastery: Array<Record<string, unknown>>, 
  puuid: string
): ChampionStats[] {
  const championMap = new Map<number, ChampionStats>();

  // Initialize with mastery data
  mastery.forEach(m => {
    const championId = typeof m.championId === 'number' ? m.championId : 0;
    const lastPlayTime = typeof m.lastPlayTime === 'number' ? m.lastPlayTime : 0;
    championMap.set(championId, {
      championId,
      championName: (typeof m.championName === 'string' ? m.championName : '') || `Champion_${championId}`,
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
      lastPlayed: lastPlayTime,
      multikills: 0,
      firstBloodRate: 0,
      damageShare: 0,
      goldShare: 0,
      killParticipation: 0
    });
  });

  // Aggregate match data
  matches.forEach(match => {
    const matchInfo = match.info as { participants?: Array<{ puuid: string; championId?: number; [key: string]: unknown }> } | undefined;
    const participant = matchInfo?.participants?.find((p: { puuid: string }) => p.puuid === puuid);
    if (!participant) return;

    const participantData = participant as { championId?: number; [key: string]: unknown };
    const champId = typeof participantData.championId === 'number' ? participantData.championId : undefined;
    if (champId === undefined) return;
    const stats = championMap.get(champId);
    if (!stats) return;

    stats.games++;
    const participantForStats = participant as { win?: boolean; deaths?: number; kills?: number; assists?: number };
    if (participantForStats.win) stats.wins++;
    
    const kda = (participantForStats.deaths || 0) > 0 
      ? ((participantForStats.kills || 0) + (participantForStats.assists || 0)) / (participantForStats.deaths || 1)
      : (participantForStats.kills || 0) + (participantForStats.assists || 0);
    
    stats.avgKDA = ((stats.avgKDA * (stats.games - 1)) + kda) / stats.games;
    const participantForAvg = participant as { totalDamageDealtToChampions?: number; visionScore?: number; goldEarned?: number };
    stats.avgDamage = ((stats.avgDamage * (stats.games - 1)) + (participantForAvg.totalDamageDealtToChampions || 0)) / stats.games;
    stats.avgVision = ((stats.avgVision * (stats.games - 1)) + (participantForAvg.visionScore || 0)) / stats.games;
    stats.avgGold = ((stats.avgGold * (stats.games - 1)) + (participantForAvg.goldEarned || 0)) / stats.games;
    const participantForCS = participant as { totalMinionsKilled?: number; neutralMinionsKilled?: number };
    stats.avgCS = ((stats.avgCS * (stats.games - 1)) + ((participantForCS.totalMinionsKilled || 0) + (participantForCS.neutralMinionsKilled || 0))) / stats.games;
    
    stats.recentForm.push(participantForStats.win || false);
    const participantForRoles = participant as { individualPosition?: string; teamPosition?: string };
    stats.roles.push(participantForRoles.individualPosition || participantForRoles.teamPosition || 'UNKNOWN');
    const participantForMultikills = participant as { doubleKills?: number; tripleKills?: number; quadraKills?: number; pentaKills?: number };
    stats.multikills += (participantForMultikills.doubleKills || 0) + (participantForMultikills.tripleKills || 0) + (participantForMultikills.quadraKills || 0) + (participantForMultikills.pentaKills || 0);
    
    const participantForFirstBlood = participant as { firstBloodKill?: boolean; firstBloodAssist?: boolean };
    if (participantForFirstBlood.firstBloodKill || participantForFirstBlood.firstBloodAssist) {
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

export function calculateTrends(matches: Array<Record<string, unknown>>, puuid: string): PerformanceTrend[] {
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
    const matchInfo = match.info as { participants?: Array<{ puuid: string; championId?: number; [key: string]: unknown }> } | undefined;
    const participant = matchInfo?.participants?.find((p: { puuid: string }) => p.puuid === puuid);
    if (!participant) return;

    const matchInfoForTrends = match.info as { gameCreation?: number; participants?: Array<{ puuid: string; deaths?: number; kills?: number; assists?: number; totalDamageDealtToChampions?: number; visionScore?: number; totalMinionsKilled?: number; [key: string]: unknown }> } | undefined;
    const date = new Date((matchInfoForTrends?.gameCreation as number) || Date.now()).toISOString().split('T')[0];
    const participantForTrends = matchInfoForTrends?.participants?.find((p: { puuid: string }) => p.puuid === puuid);
    if (!participantForTrends) return;
    const participantForTrendsKDA = participantForTrends as { deaths?: number; kills?: number; assists?: number };
    const kda = (participantForTrendsKDA.deaths || 0) > 0 
      ? ((participantForTrendsKDA.kills || 0) + (participantForTrendsKDA.assists || 0)) / (participantForTrendsKDA.deaths || 1)
      : (participantForTrendsKDA.kills || 0) + (participantForTrendsKDA.assists || 0);

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
    const participantForTrendsWin = participantForTrends as { win?: boolean };
    if (participantForTrendsWin.win) stats.wins++;
    stats.kda.push(kda);
    const participantForTrendsStats = participantForTrends as { totalDamageDealtToChampions?: number; visionScore?: number; totalMinionsKilled?: number; neutralMinionsKilled?: number };
    stats.damage.push(participantForTrendsStats.totalDamageDealtToChampions || 0);
    stats.vision.push(participantForTrendsStats.visionScore || 0);
    stats.cs.push((participantForTrendsStats.totalMinionsKilled || 0) + (participantForTrendsStats.neutralMinionsKilled || 0));
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
export function extractTimelineData(timeline: Record<string, unknown>, puuid: string): Record<string, unknown> | null {
  if (!timeline?.frames) return null;

  const metadata = typeof timeline.metadata === 'object' && timeline.metadata !== null ? timeline.metadata as Record<string, unknown> : null;
  const participants = Array.isArray(metadata?.participants) ? metadata.participants as string[] : [];
  const participantId = participants.indexOf(puuid);
  if (participantId === -1) return null;

  const frames = Array.isArray(timeline.frames) ? timeline.frames as Array<Record<string, unknown>> : [];
  return {
    frames: frames.map((frame: Record<string, unknown>) => {
      const participantFrames = typeof frame.participantFrames === 'object' && frame.participantFrames !== null 
        ? frame.participantFrames as Record<string | number, unknown>
        : null;
      return {
        timestamp: frame.timestamp,
        participantFrames: participantFrames && typeof participantId === 'number' ? (participantFrames[participantId] || null) : null,
        events: Array.isArray(frame.events) ? frame.events : []
      };
    })
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
  _multikills: number = 0 // eslint-disable-line @typescript-eslint/no-unused-vars
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


// Match Analytics Utility Functions
// Performance grading, damage analysis, vision rating, role detection, trend analysis

import { ParticipantDto } from '@/types/riot-api';

// Performance Grade Calculation
export type PerformanceGrade = 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';

export interface PerformanceMetrics {
  kda: number;
  winRate: number;
  damageShare: number;
  visionScore: number;
  csPerMinute: number;
  goldPerMinute: number;
  killParticipation: number;
  multikills: number;
  firstBloodRate: number;
  objectiveParticipation: number;
}

export function calculatePerformanceGrade(
  kda: number,
  winRate: number,
  damageShare: number = 0,
  visionScore: number = 0,
  csPerMinute: number = 0,
  killParticipation: number = 0,
  multikills: number = 0
): PerformanceGrade {
  // Weighted scoring system
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

// Damage Analysis
export interface DamageBreakdown {
  physical: number;
  magical: number;
  true: number;
  toChampions: number;
  toBuildings: number;
  toObjectives: number;
  total: number;
  physicalPercent: number;
  magicalPercent: number;
  truePercent: number;
}

export function analyzeDamageDistribution(participant: ParticipantDto): DamageBreakdown {
  const physical = participant.physicalDamageDealtToChampions || 0;
  const magical = participant.magicDamageDealtToChampions || 0;
  const true_dmg = participant.trueDamageDealtToChampions || 0;
  const toChampions = participant.totalDamageDealtToChampions || 0;
  const toBuildings = participant.damageDealtToBuildings || 0;
  const toObjectives = participant.damageDealtToObjectives || 0;
  const total = participant.totalDamageDealt || 0;
  
  const championTotal = physical + magical + true_dmg;
  
  return {
    physical,
    magical,
    true: true_dmg,
    toChampions,
    toBuildings,
    toObjectives,
    total,
    physicalPercent: championTotal > 0 ? (physical / championTotal) * 100 : 0,
    magicalPercent: championTotal > 0 ? (magical / championTotal) * 100 : 0,
    truePercent: championTotal > 0 ? (true_dmg / championTotal) * 100 : 0,
  };
}

// Vision Rating Calculation
export function calculateVisionRating(participant: ParticipantDto): number {
  const visionScore = participant.visionScore || 0;
  const wardsPlaced = participant.wardsPlaced || 0;
  const wardsKilled = participant.wardsKilled || 0;
  const controlWardsBought = participant.visionWardsBoughtInGame || 0;
  const detectorWardsPlaced = participant.detectorWardsPlaced || 0;
  
  // Weighted vision rating (0-100)
  let rating = 0;
  
  // Base vision score (0-50 points)
  rating += Math.min(visionScore * 0.5, 50);
  
  // Ward placement efficiency (0-20 points)
  if (wardsPlaced >= 20) rating += 20;
  else if (wardsPlaced >= 15) rating += 15;
  else if (wardsPlaced >= 10) rating += 10;
  else if (wardsPlaced >= 5) rating += 5;
  
  // Ward clearing (0-15 points)
  if (wardsKilled >= 10) rating += 15;
  else if (wardsKilled >= 7) rating += 12;
  else if (wardsKilled >= 5) rating += 9;
  else if (wardsKilled >= 3) rating += 6;
  else if (wardsKilled >= 1) rating += 3;
  
  // Control ward investment (0-15 points)
  if (controlWardsBought >= 5) rating += 15;
  else if (controlWardsBought >= 3) rating += 12;
  else if (controlWardsBought >= 2) rating += 9;
  else if (controlWardsBought >= 1) rating += 6;
  
  return Math.min(Math.round(rating), 100);
}

// Role Detection
export type PlayerRole = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';

export function detectPlayerRole(participant: ParticipantDto): PlayerRole {
  const teamPosition = participant.teamPosition?.toUpperCase();
  const individualPosition = participant.individualPosition?.toUpperCase();
  const lane = participant.lane?.toUpperCase();
  
  // Use teamPosition first (most reliable)
  if (teamPosition) {
    switch (teamPosition) {
      case 'TOP': return 'TOP';
      case 'JUNGLE': return 'JUNGLE';
      case 'MIDDLE': return 'MID';
      case 'BOTTOM': return 'ADC';
      case 'UTILITY': return 'SUPPORT';
    }
  }
  
  // Fallback to individualPosition
  if (individualPosition) {
    switch (individualPosition) {
      case 'TOP': return 'TOP';
      case 'JUNGLE': return 'JUNGLE';
      case 'MIDDLE': return 'MID';
      case 'BOTTOM': return 'ADC';
      case 'UTILITY': return 'SUPPORT';
    }
  }
  
  // Fallback to lane
  if (lane) {
    switch (lane) {
      case 'TOP': return 'TOP';
      case 'JUNGLE': return 'JUNGLE';
      case 'MID': return 'MID';
      case 'BOTTOM': return 'ADC';
      case 'SUPPORT': return 'SUPPORT';
    }
  }
  
  // Default fallback based on champion or other factors
  return 'MID';
}

// Trend Analysis
export type PerformanceTrend = 'improving' | 'stable' | 'declining';

export function calculatePerformanceTrend(
  matches: ParticipantDto[],
  metric: 'kda' | 'winRate' | 'damage' | 'vision' | 'cs'
): PerformanceTrend {
  if (matches.length < 5) return 'stable';
  
  const recent = matches.slice(0, 5);
  const older = matches.slice(5, 10);
  
  if (older.length === 0) return 'stable';
  
  let recentAvg: number;
  let olderAvg: number;
  
  switch (metric) {
    case 'kda':
      recentAvg = recent.reduce((sum, p) => {
        const kda = p.deaths > 0 ? (p.kills + p.assists) / p.deaths : p.kills + p.assists;
        return sum + kda;
      }, 0) / recent.length;
      
      olderAvg = older.reduce((sum, p) => {
        const kda = p.deaths > 0 ? (p.kills + p.assists) / p.deaths : p.kills + p.assists;
        return sum + kda;
      }, 0) / older.length;
      break;
      
    case 'winRate':
      recentAvg = (recent.filter(p => p.win).length / recent.length) * 100;
      olderAvg = (older.filter(p => p.win).length / older.length) * 100;
      break;
      
    case 'damage':
      recentAvg = recent.reduce((sum, p) => sum + (p.totalDamageDealtToChampions || 0), 0) / recent.length;
      olderAvg = older.reduce((sum, p) => sum + (p.totalDamageDealtToChampions || 0), 0) / older.length;
      break;
      
    case 'vision':
      recentAvg = recent.reduce((sum, p) => sum + (p.visionScore || 0), 0) / recent.length;
      olderAvg = older.reduce((sum, p) => sum + (p.visionScore || 0), 0) / older.length;
      break;
      
    case 'cs':
      recentAvg = recent.reduce((sum, p) => sum + (p.totalMinionsKilled || 0), 0) / recent.length;
      olderAvg = older.reduce((sum, p) => sum + (p.totalMinionsKilled || 0), 0) / older.length;
      break;
      
    default:
      return 'stable';
  }
  
  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  if (change > 10) return 'improving';
  if (change < -10) return 'declining';
  return 'stable';
}

// Comparative Stats
export interface RankComparison {
  rank: string;
  averageKDA: number;
  averageWinRate: number;
  averageDamage: number;
  averageVision: number;
  playerKDA: number;
  playerWinRate: number;
  playerDamage: number;
  playerVision: number;
  kdaDifference: number;
  winRateDifference: number;
  damageDifference: number;
  visionDifference: number;
}

export function compareToRankAverage(
  playerStats: {
    kda: number;
    winRate: number;
    avgDamage: number;
    avgVision: number;
  },
  rank: string
): RankComparison {
  // Mock rank averages (in real implementation, these would come from a database)
  const rankAverages: Record<string, { kda: number; winRate: number; damage: number; vision: number }> = {
    'IRON': { kda: 1.2, winRate: 45, damage: 12000, vision: 15 },
    'BRONZE': { kda: 1.4, winRate: 47, damage: 14000, vision: 18 },
    'SILVER': { kda: 1.6, winRate: 50, damage: 16000, vision: 22 },
    'GOLD': { kda: 1.8, winRate: 52, damage: 18000, vision: 26 },
    'PLATINUM': { kda: 2.0, winRate: 54, damage: 20000, vision: 30 },
    'DIAMOND': { kda: 2.2, winRate: 56, damage: 22000, vision: 34 },
    'MASTER': { kda: 2.4, winRate: 58, damage: 24000, vision: 38 },
    'GRANDMASTER': { kda: 2.6, winRate: 60, damage: 26000, vision: 42 },
    'CHALLENGER': { kda: 2.8, winRate: 62, damage: 28000, vision: 46 },
  };
  
  const average = rankAverages[rank] || rankAverages['SILVER'];
  
  return {
    rank,
    averageKDA: average.kda,
    averageWinRate: average.winRate,
    averageDamage: average.damage,
    averageVision: average.vision,
    playerKDA: playerStats.kda,
    playerWinRate: playerStats.winRate,
    playerDamage: playerStats.avgDamage,
    playerVision: playerStats.avgVision,
    kdaDifference: playerStats.kda - average.kda,
    winRateDifference: playerStats.winRate - average.winRate,
    damageDifference: playerStats.avgDamage - average.damage,
    visionDifference: playerStats.avgVision - average.vision,
  };
}

// Multikill Analysis
export interface MultikillStats {
  doubles: number;
  triples: number;
  quadras: number;
  pentas: number;
  total: number;
  multikillRate: number;
}

export function calculateMultikillStats(participant: ParticipantDto): MultikillStats {
  const doubles = participant.doubleKills || 0;
  const triples = participant.tripleKills || 0;
  const quadras = participant.quadraKills || 0;
  const pentas = participant.pentaKills || 0;
  const total = doubles + triples + quadras + pentas;
  
  // Calculate multikill rate (multikills per game)
  const multikillRate = total; // This would be divided by games played in real implementation
  
  return {
    doubles,
    triples,
    quadras,
    pentas,
    total,
    multikillRate,
  };
}

// Objective Participation
export interface ObjectiveStats {
  dragonKills: number;
  baronKills: number;
  turretKills: number;
  inhibitorKills: number;
  firstBloodRate: number;
  firstTowerRate: number;
  objectiveParticipation: number;
}

export function calculateObjectiveStats(participant: ParticipantDto): ObjectiveStats {
  const dragonKills = participant.dragonKills || 0;
  const baronKills = participant.baronKills || 0;
  const turretKills = participant.turretKills || 0;
  const inhibitorKills = participant.inhibitorKills || 0;
  const firstBloodKill = participant.firstBloodKill || false;
  const firstTowerKill = participant.firstTowerKill || false;
  
  // Calculate objective participation rate (simplified)
  const totalObjectives = dragonKills + baronKills + turretKills + inhibitorKills;
  const objectiveParticipation = Math.min(totalObjectives * 10, 100); // Cap at 100%
  
  return {
    dragonKills,
    baronKills,
    turretKills,
    inhibitorKills,
    firstBloodRate: firstBloodKill ? 100 : 0,
    firstTowerRate: firstTowerKill ? 100 : 0,
    objectiveParticipation,
  };
}

// Communication Analysis
export interface CommunicationStats {
  totalPings: number;
  allInPings: number;
  assistMePings: number;
  enemyMissingPings: number;
  dangerPings: number;
  pushPings: number;
  communicationScore: number;
}

export function calculateCommunicationStats(participant: ParticipantDto): CommunicationStats {
  const allInPings = participant.allInPings || 0;
  const assistMePings = participant.assistMePings || 0;
  const enemyMissingPings = participant.enemyMissingPings || 0;
  const dangerPings = participant.commandPings || 0; // Using commandPings as danger pings
  const pushPings = participant.pushPings || 0;
  
  const totalPings = allInPings + assistMePings + enemyMissingPings + dangerPings + pushPings;
  
  // Communication score based on ping variety and frequency
  let communicationScore = 0;
  if (totalPings >= 20) communicationScore += 40;
  else if (totalPings >= 15) communicationScore += 30;
  else if (totalPings >= 10) communicationScore += 20;
  else if (totalPings >= 5) communicationScore += 10;
  
  // Bonus for ping variety
  const pingTypes = [allInPings, assistMePings, enemyMissingPings, dangerPings, pushPings].filter(p => p > 0).length;
  communicationScore += pingTypes * 10;
  
  return {
    totalPings,
    allInPings,
    assistMePings,
    enemyMissingPings,
    dangerPings,
    pushPings,
    communicationScore: Math.min(communicationScore, 100),
  };
}

// Champion Performance Analysis
export interface ChampionPerformance {
  championId: number;
  championName: string;
  games: number;
  wins: number;
  winRate: number;
  avgKDA: number;
  avgDamage: number;
  avgVision: number;
  performanceGrade: PerformanceGrade;
  recentForm: ('W' | 'L')[];
  damageShare: number;
  killParticipation: number;
  multikills: number;
  firstBloodRate: number;
  favoriteRole: PlayerRole;
}

export function analyzeChampionPerformance(
  championId: number,
  championName: string,
  matches: ParticipantDto[]
): ChampionPerformance {
  const championMatches = matches.filter(m => m.championId === championId);
  
  if (championMatches.length === 0) {
    return {
      championId,
      championName,
      games: 0,
      wins: 0,
      winRate: 0,
      avgKDA: 0,
      avgDamage: 0,
      avgVision: 0,
      performanceGrade: 'D',
      recentForm: [],
      damageShare: 0,
      killParticipation: 0,
      multikills: 0,
      firstBloodRate: 0,
      favoriteRole: 'MID',
    };
  }
  
  const games = championMatches.length;
  const wins = championMatches.filter(m => m.win).length;
  const winRate = (wins / games) * 100;
  
  const avgKDA = championMatches.reduce((sum, m) => {
    const kda = m.deaths > 0 ? (m.kills + m.assists) / m.deaths : m.kills + m.assists;
    return sum + kda;
  }, 0) / games;
  
  const avgDamage = championMatches.reduce((sum, m) => sum + (m.totalDamageDealtToChampions || 0), 0) / games;
  const avgVision = championMatches.reduce((sum, m) => sum + (m.visionScore || 0), 0) / games;
  
  const performanceGrade = calculatePerformanceGrade(avgKDA, winRate, 0, avgVision);
  
  const recentForm = championMatches.slice(0, 5).map(m => m.win ? 'W' : 'L');
  
  // Calculate damage share (simplified - would need team data for accurate calculation)
  const damageShare = 0; // Placeholder
  
  const killParticipation = championMatches.reduce((sum, m) => {
    const kp = m.challenges?.killParticipation || 0;
    return sum + kp;
  }, 0) / games;
  
  const multikills = championMatches.reduce((sum, m) => {
    return sum + (m.doubleKills || 0) + (m.tripleKills || 0) + (m.quadraKills || 0) + (m.pentaKills || 0);
  }, 0);
  
  const firstBloodRate = (championMatches.filter(m => m.firstBloodKill).length / games) * 100;
  
  const favoriteRole = detectPlayerRole(championMatches[0]);
  
  return {
    championId,
    championName,
    games,
    wins,
    winRate,
    avgKDA,
    avgDamage,
    avgVision,
    performanceGrade,
    recentForm,
    damageShare,
    killParticipation,
    multikills,
    firstBloodRate,
    favoriteRole,
  };
}


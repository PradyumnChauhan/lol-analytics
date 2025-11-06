/**
 * AI Data Aggregator
 * Aggregates player data from multiple sources into optimized format for Amazon Bedrock AI
 * Focuses on token efficiency and essential statistics only
 */

export interface AIDataPayload {
  playerInfo: {
    gameName: string;
    tagLine: string;
    summonerLevel: number;
    region: string;
    profileIconId: number;
  };
  matchStats: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
    recentWinRate: number; // Last 10 games
    recentForm: boolean[]; // Last 10 games
    avgKDA: { kills: number; deaths: number; assists: number };
    avgDamage: number;
    avgVision: number;
    avgGold: number;
    avgCS: number;
    avgGoldPerMin: number;
    avgDamagePerMin: number;
    avgKillParticipation: number;
    trends: {
      winRateLast30Days: number[];
      kdaLast30Days: number[];
      damageLast30Days: number[];
    };
  };
  championMastery: {
    totalMasteryScore: number;
    championsMastered: number; // Level 5+
    topChampions: Array<{
      championId: number;
      championName: string;
      masteryLevel: number;
      masteryPoints: number;
      chestGranted: boolean;
      lastPlayTime: number;
      games: number;
      wins: number;
      winRate: number;
      avgKDA: number;
      avgDamage: number;
      preferredRole: string;
    }>;
  };
  recentMatches: Array<{
    gameId: string;
    timestamp: number;
    win: boolean;
    champion: string;
    role: string;
    kda: { k: number; d: number; a: number };
    damage: number;
    vision: number;
    gold: number;
    cs: number;
    duration: number; // seconds
    queueType: string;
    multikills: number;
    firstBlood: boolean;
    teamPosition: string;
  }>;
  challenges: {
    totalPoints: {
      level: string;
      current: number;
      percentile: number;
    } | null;
    categoryPoints: {
      COMBAT: number;
      EXPERTISE: number;
      TEAMWORK: number;
      COLLECTION: number;
      LEGACY: number;
    };
    topAchievements: Array<{
      challengeId: number;
      challengeName: string;
      level: string;
      value: number;
      percentile: number;
    }>;
    recentAchievements: Array<{
      challengeId: number;
      achievementDate: number;
      level: string;
    }>;
  };
  clash: {
    tournamentsParticipated: number;
    recentTournaments: Array<{
      tournamentId: number;
      tournamentName: string;
      teamName?: string;
      teamId?: string;
      position?: number;
      bracketPosition?: string;
      timestamp: number;
    }>;
    bestResult?: {
      tournamentName: string;
      position: number;
      bracketPosition: string;
    };
  };
  ranked: {
    soloQueue?: {
      tier: string;
      rank: string;
      leaguePoints: number;
      wins: number;
      losses: number;
      winRate: number;
    };
    flexQueue?: {
      tier: string;
      rank: string;
      leaguePoints: number;
      wins: number;
      losses: number;
      winRate: number;
    };
  };
  insights: {
    strongestChampions: string[];
    weakestChampions: string[];
    bestRole: string;
    worstRole: string;
    peakPerformance: {
      date: string;
      kda: number;
      damage: number;
    } | null;
    improvementAreas: string[];
  };
}

interface MatchParticipant {
  puuid: string;
  championId: number;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealtToChampions: number;
  visionScore: number;
  goldEarned: number;
  totalMinionsKilled: number;
  neutralMinionsKilled?: number;
  win: boolean;
  teamPosition: string;
  individualPosition: string;
  firstBloodKill: boolean;
  firstBloodAssist: boolean;
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
  teamId: number;
  [key: string]: any;
}

interface MatchData {
  metadata: {
    matchId: string;
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    queueId?: number;
    gameMode?: string;
    participants: MatchParticipant[];
  };
}

interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  chestGranted: boolean;
  championName?: string;
  [key: string]: any;
}

interface ChallengeData {
  totalPoints?: {
    level: string;
    current: number;
    max: number;
    percentile: number;
  };
  categoryPoints?: {
    COMBAT?: number;
    EXPERTISE?: number;
    TEAMWORK?: number;
    COLLECTION?: number;
    LEGACY?: number;
  };
  challenges?: Array<{
    challengeId: number;
    level?: string;
    value?: number;
    percentile?: number;
    achievedTime?: number;
    [key: string]: any;
  }>;
  [key: string]: any;
}

interface LeagueEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  [key: string]: any;
}

interface PlayerData {
  account?: {
    puuid: string;
    gameName: string;
    tagLine: string;
    [key: string]: any;
  };
  summoner?: {
    summonerLevel: number;
    profileIconId: number;
    [key: string]: any;
  };
  matchDetails?: MatchData[];
  championMastery?: ChampionMastery[];
  leagueEntries?: LeagueEntry[];
  challenges?: ChallengeData | null;
  clash?: any; // Clash data structure varies
  region?: string;
}

// Cache for aggregated data (hash-based)
const aggregationCache = new Map<string, { data: AIDataPayload; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Main aggregation function
 */
export function aggregatePlayerDataForAI(playerData: PlayerData): AIDataPayload {
  // Check cache
  const cacheKey = generateCacheKey(playerData);
  const cached = aggregationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const puuid = playerData.account?.puuid || '';
  const region = playerData.region || 'na1';

  // Aggregate all data sources
  const matchStats = extractMatchStats(playerData.matchDetails || [], puuid);
  const championMastery = aggregateChampionMastery(
    playerData.championMastery || [],
    playerData.matchDetails || [],
    puuid
  );
  const challenges = aggregateChallengeData(playerData.challenges);
  const clash = aggregateClashData(playerData.clash);
  const ranked = extractRankedInfo(playerData.leagueEntries || []);
  const recentMatches = extractRecentMatches(playerData.matchDetails || [], puuid);
  const insights = calculatePrecomputedInsights(matchStats, championMastery, recentMatches);

  const result: AIDataPayload = {
    playerInfo: {
      gameName: playerData.account?.gameName || '',
      tagLine: playerData.account?.tagLine || '',
      summonerLevel: playerData.summoner?.summonerLevel || 0,
      region,
      profileIconId: playerData.summoner?.profileIconId || 0,
    },
    matchStats,
    championMastery,
    recentMatches,
    challenges,
    clash,
    ranked,
    insights,
  };

  // Cache result
  aggregationCache.set(cacheKey, { data: result, timestamp: Date.now() });

  return result;
}

/**
 * Extract match statistics from match history
 */
function extractMatchStats(matches: MatchData[], puuid: string) {
  if (!matches || matches.length === 0) {
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      recentWinRate: 0,
      recentForm: [],
      avgKDA: { kills: 0, deaths: 0, assists: 0 },
      avgDamage: 0,
      avgVision: 0,
      avgGold: 0,
      avgCS: 0,
      avgGoldPerMin: 0,
      avgDamagePerMin: 0,
      avgKillParticipation: 0,
      trends: {
        winRateLast30Days: [],
        kdaLast30Days: [],
        damageLast30Days: [],
      },
    };
  }

  // Limit to last 30 matches
  const recentMatches = matches.slice(0, 30);
  
  const participants: Array<{ participant: MatchParticipant; match: MatchData }> = [];
  
  for (const match of recentMatches) {
    const participant = match.info?.participants?.find((p: MatchParticipant) => p.puuid === puuid);
    if (participant) {
      participants.push({ participant, match });
    }
  }

  if (participants.length === 0) {
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      recentWinRate: 0,
      recentForm: [],
      avgKDA: { kills: 0, deaths: 0, assists: 0 },
      avgDamage: 0,
      avgVision: 0,
      avgGold: 0,
      avgCS: 0,
      avgGoldPerMin: 0,
      avgDamagePerMin: 0,
      avgKillParticipation: 0,
      trends: {
        winRateLast30Days: [],
        kdaLast30Days: [],
        damageLast30Days: [],
      },
    };
  }

  const totalGames = participants.length;
  const wins = participants.filter(({ participant }) => participant.win).length;
  const losses = totalGames - wins;
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

  // Recent form (last 10)
  const last10 = participants.slice(0, 10);
  const recentWins = last10.filter(({ participant }) => participant.win).length;
  const recentWinRate = last10.length > 0 ? (recentWins / last10.length) * 100 : 0;
  const recentForm = last10.map(({ participant }) => participant.win);

  // Calculate averages
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalDamage = 0;
  let totalVision = 0;
  let totalGold = 0;
  let totalCS = 0;
  let totalDuration = 0;

  for (const { participant, match } of participants) {
    totalKills += participant.kills || 0;
    totalDeaths += participant.deaths || 0;
    totalAssists += participant.assists || 0;
    totalDamage += participant.totalDamageDealtToChampions || 0;
    totalVision += participant.visionScore || 0;
    totalGold += participant.goldEarned || 0;
    totalCS += (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0);
    totalDuration += match.info.gameDuration || 0;
  }

  const avgKDA = {
    kills: totalGames > 0 ? totalKills / totalGames : 0,
    deaths: totalGames > 0 ? totalDeaths / totalGames : 0,
    assists: totalGames > 0 ? totalAssists / totalGames : 0,
  };

  const avgDamage = totalGames > 0 ? totalDamage / totalGames : 0;
  const avgVision = totalGames > 0 ? totalVision / totalGames : 0;
  const avgGold = totalGames > 0 ? totalGold / totalGames : 0;
  const avgCS = totalGames > 0 ? totalCS / totalGames : 0;

  const totalMinutes = totalDuration / 60;
  const avgGoldPerMin = totalMinutes > 0 ? totalGold / totalMinutes : 0;
  const avgDamagePerMin = totalMinutes > 0 ? totalDamage / totalMinutes : 0;

  // Calculate kill participation from match data
  let totalKillParticipation = 0;
  let killParticipationCount = 0;
  
  for (const { participant, match } of participants) {
    const teamParticipants = match.info?.participants?.filter((p: MatchParticipant) => p.teamId === participant.teamId) || [];
    const teamKills = teamParticipants.reduce((sum: number, p: MatchParticipant) => sum + (p.kills || 0), 0);
    
    if (teamKills > 0) {
      const participation = ((participant.kills + participant.assists) / teamKills) * 100;
      totalKillParticipation += participation;
      killParticipationCount++;
    }
  }
  
  const avgKillParticipation = killParticipationCount > 0 
    ? Math.round((totalKillParticipation / killParticipationCount) * 10) / 10 
    : 50;

  // Calculate trends (daily averages for last 30 days)
  const trends = calculateTrends(participants);

  return {
    totalGames,
    wins,
    losses,
    winRate: Math.round(winRate * 10) / 10,
    recentWinRate: Math.round(recentWinRate * 10) / 10,
    recentForm,
    avgKDA,
    avgDamage: Math.round(avgDamage),
    avgVision: Math.round(avgVision * 10) / 10,
    avgGold: Math.round(avgGold),
    avgCS: Math.round(avgCS * 10) / 10,
    avgGoldPerMin: Math.round(avgGoldPerMin * 10) / 10,
    avgDamagePerMin: Math.round(avgDamagePerMin * 10) / 10,
    avgKillParticipation,
    trends,
  };
}

/**
 * Calculate trends for last 30 days
 */
function calculateTrends(
  participants: Array<{ participant: MatchParticipant; match: MatchData }>
) {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  // Group by date
  const dailyData = new Map<string, { wins: number; games: number; kdas: number[]; damages: number[] }>();

  for (const { participant, match } of participants) {
    const matchDate = new Date(match.info.gameCreation);
    if (matchDate.getTime() < thirtyDaysAgo) continue;

    const dateKey = matchDate.toISOString().split('T')[0];
    if (!dailyData.has(dateKey)) {
      dailyData.set(dateKey, { wins: 0, games: 0, kdas: [], damages: [] });
    }

    const dayData = dailyData.get(dateKey)!;
    dayData.games++;
    if (participant.win) dayData.wins++;

    const kda = participant.deaths > 0
      ? (participant.kills + participant.assists) / participant.deaths
      : participant.kills + participant.assists;
    dayData.kdas.push(kda);
    dayData.damages.push(participant.totalDamageDealtToChampions || 0);
  }

  // Calculate daily averages
  const dates = Array.from(dailyData.keys()).sort();
  const winRateTrend: number[] = [];
  const kdaTrend: number[] = [];
  const damageTrend: number[] = [];

  for (const date of dates) {
    const dayData = dailyData.get(date)!;
    winRateTrend.push(dayData.games > 0 ? (dayData.wins / dayData.games) * 100 : 0);
    kdaTrend.push(
      dayData.kdas.length > 0
        ? dayData.kdas.reduce((a, b) => a + b, 0) / dayData.kdas.length
        : 0
    );
    damageTrend.push(
      dayData.damages.length > 0
        ? dayData.damages.reduce((a, b) => a + b, 0) / dayData.damages.length
        : 0
    );
  }

  return {
    winRateLast30Days: winRateTrend,
    kdaLast30Days: kdaTrend,
    damageLast30Days: damageTrend,
  };
}

/**
 * Extract recent matches summary
 */
function extractRecentMatches(matches: MatchData[], puuid: string) {
  const recentMatches: AIDataPayload['recentMatches'] = [];
  
  // Limit to last 20 matches
  const limitedMatches = matches.slice(0, 20);

  for (const match of limitedMatches) {
    const participant = match.info?.participants?.find((p: MatchParticipant) => p.puuid === puuid);
    if (!participant) continue;

    const multikills = (participant.doubleKills || 0) +
                     (participant.tripleKills || 0) +
                     (participant.quadraKills || 0) +
                     (participant.pentaKills || 0);

    recentMatches.push({
      gameId: match.metadata.matchId,
      timestamp: match.info.gameCreation,
      win: participant.win,
      champion: participant.championName || `Champion_${participant.championId}`,
      role: participant.individualPosition || participant.teamPosition || 'UNKNOWN',
      kda: {
        k: participant.kills || 0,
        d: participant.deaths || 0,
        a: participant.assists || 0,
      },
      damage: participant.totalDamageDealtToChampions || 0,
      vision: participant.visionScore || 0,
      gold: participant.goldEarned || 0,
      cs: (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0),
      duration: match.info.gameDuration || 0,
      queueType: getQueueType(match.info.queueId),
      multikills,
      firstBlood: participant.firstBloodKill || participant.firstBloodAssist || false,
      teamPosition: participant.teamPosition || participant.individualPosition || 'UNKNOWN',
    });
  }

  return recentMatches;
}

/**
 * Aggregate champion mastery with match performance
 */
function aggregateChampionMastery(
  masteryData: ChampionMastery[],
  matchData: MatchData[],
  puuid: string
): AIDataPayload['championMastery'] {
  if (!masteryData || masteryData.length === 0) {
    return {
      totalMasteryScore: 0,
      championsMastered: 0,
      topChampions: [],
    };
  }

  // Import champion name mapping utility
  let getChampionName: (id: number) => string;
  try {
    const champions = require('@/lib/champions');
    getChampionName = champions.getChampionName;
  } catch {
    // Fallback if import fails
    getChampionName = (id: number) => `Champion_${id}`;
  }

  // Create map of champion stats from matches
  const championMatchStats = new Map<number, {
    games: number;
    wins: number;
    totalKDA: number;
    totalDamage: number;
    roles: string[];
  }>();

  for (const match of matchData.slice(0, 100)) { // Check up to 100 matches
    const participant = match.info?.participants?.find((p: MatchParticipant) => p.puuid === puuid);
    if (!participant) continue;

    const champId = participant.championId;
    if (!championMatchStats.has(champId)) {
      championMatchStats.set(champId, {
        games: 0,
        wins: 0,
        totalKDA: 0,
        totalDamage: 0,
        roles: [],
      });
    }

    const stats = championMatchStats.get(champId)!;
    stats.games++;
    if (participant.win) stats.wins++;

    const kda = participant.deaths > 0
      ? (participant.kills + participant.assists) / participant.deaths
      : participant.kills + participant.assists;
    stats.totalKDA += kda;
    stats.totalDamage += participant.totalDamageDealtToChampions || 0;
    
    const role = participant.individualPosition || participant.teamPosition || 'UNKNOWN';
    if (!stats.roles.includes(role)) {
      stats.roles.push(role);
    }
  }

  // Combine mastery with match stats
  const topChampions = masteryData
    .map((mastery) => {
      const matchStats = championMatchStats.get(mastery.championId) || {
        games: 0,
        wins: 0,
        totalKDA: 0,
        totalDamage: 0,
        roles: [],
      };

      const winRate = matchStats.games > 0 ? (matchStats.wins / matchStats.games) * 100 : 0;
      const avgKDA = matchStats.games > 0 ? matchStats.totalKDA / matchStats.games : 0;
      const avgDamage = matchStats.games > 0 ? matchStats.totalDamage / matchStats.games : 0;
      const preferredRole = matchStats.roles.length > 0 ? matchStats.roles[0] : 'UNKNOWN';

      return {
        championId: mastery.championId,
        championName: mastery.championName || getChampionName(mastery.championId),
        masteryLevel: mastery.championLevel || 0,
        masteryPoints: mastery.championPoints || 0,
        chestGranted: mastery.chestGranted || false,
        lastPlayTime: mastery.lastPlayTime || 0,
        games: matchStats.games,
        wins: matchStats.wins,
        winRate: Math.round(winRate * 10) / 10,
        avgKDA: Math.round(avgKDA * 100) / 100,
        avgDamage: Math.round(avgDamage),
        preferredRole,
      };
    })
    .sort((a, b) => b.masteryPoints - a.masteryPoints)
    .slice(0, 15); // Top 15 only

  const totalMasteryScore = masteryData.reduce((sum, m) => sum + (m.championPoints || 0), 0);
  const championsMastered = masteryData.filter((m) => (m.championLevel || 0) >= 5).length;

  return {
    totalMasteryScore,
    championsMastered,
    topChampions,
  };
}

/**
 * Aggregate challenge data
 */
function aggregateChallengeData(challengeData: ChallengeData | null | undefined): AIDataPayload['challenges'] {
  if (!challengeData) {
    return {
      totalPoints: null,
      categoryPoints: {
        COMBAT: 0,
        EXPERTISE: 0,
        TEAMWORK: 0,
        COLLECTION: 0,
        LEGACY: 0,
      },
      topAchievements: [],
      recentAchievements: [],
    };
  }

  const totalPoints = challengeData.totalPoints ? {
    level: challengeData.totalPoints.level || 'IRON',
    current: challengeData.totalPoints.current || 0,
    percentile: challengeData.totalPoints.percentile || 0,
  } : null;
  
  // Handle both old (COMBAT/LEGACY) and new (IMAGINATION/VETERANCY) category names
  const getCategoryValue = (categoryKey: string): number => {
    const category = challengeData.categoryPoints?.[categoryKey];
    if (!category) return 0;
    // Handle both object format (with current/max/percentile) and direct number format
    return typeof category === 'object' && 'current' in category ? category.current : (typeof category === 'number' ? category : 0);
  };
  
  const categoryPoints = {
    COMBAT: getCategoryValue('COMBAT') || getCategoryValue('IMAGINATION') || 0,
    EXPERTISE: getCategoryValue('EXPERTISE') || 0,
    TEAMWORK: getCategoryValue('TEAMWORK') || 0,
    COLLECTION: getCategoryValue('COLLECTION') || 0,
    LEGACY: getCategoryValue('LEGACY') || getCategoryValue('VETERANCY') || 0,
  };

  // Extract top achievements
  const challenges = challengeData.challenges || [];
  const topAchievements = challenges
    .filter((c) => (c.value !== undefined && c.value > 0) || (c.percentile !== undefined && c.percentile > 0))
    .map((c) => ({
      challengeId: c.challengeId || 0,
      challengeName: `Challenge_${c.challengeId}`, // Would need challenge config for actual names
      level: c.level || 'IRON',
      value: c.value || 0,
      percentile: c.percentile || 0,
    }))
    .sort((a, b) => {
      // Sort by value first, then percentile
      const aScore = a.value > 0 ? a.value : a.percentile * 100;
      const bScore = b.value > 0 ? b.value : b.percentile * 100;
      return bScore - aScore;
    })
    .slice(0, 10);

  // Extract recent achievements (those with achievedTime)
  const recentAchievements = challenges
    .filter((c) => c.achievedTime !== undefined && c.achievedTime > 0)
    .map((c) => ({
      challengeId: c.challengeId || 0,
      achievementDate: c.achievedTime || 0,
      level: c.level || 'IRON',
    }))
    .sort((a, b) => b.achievementDate - a.achievementDate)
    .slice(0, 5);

  return {
    totalPoints,
    categoryPoints,
    topAchievements,
    recentAchievements,
  };
}

/**
 * Aggregate Clash/tournament data
 */
function aggregateClashData(clashData: any): AIDataPayload['clash'] {
  // Handle null, undefined, empty array, or non-array data
  if (!clashData) {
    return {
      tournamentsParticipated: 0,
      recentTournaments: [],
    };
  }

  // Handle non-array data (could be object or other structure)
  if (!Array.isArray(clashData)) {
    // If it's an object, try to extract array from common property names
    const possibleArray = clashData.tournaments || clashData.data || clashData.results || [];
    if (Array.isArray(possibleArray)) {
      clashData = possibleArray;
    } else {
      return {
        tournamentsParticipated: 0,
        recentTournaments: [],
      };
    }
  }

  // Handle empty array
  if (clashData.length === 0) {
    return {
      tournamentsParticipated: 0,
      recentTournaments: [],
    };
  }

  // Clash data structure varies, so we handle it generically with safe access
  const recentTournaments = clashData
    .slice(0, 5)
    .filter((tournament: any) => tournament !== null && tournament !== undefined)
    .map((tournament: any) => ({
      tournamentId: tournament?.id || tournament?.tournamentId || 0,
      tournamentName: tournament?.nameKey || tournament?.name || tournament?.tournamentName || 'Tournament',
      teamName: tournament?.team?.name || tournament?.teamName,
      teamId: tournament?.team?.id || tournament?.teamId,
      position: tournament?.team?.position ?? tournament?.position,
      bracketPosition: tournament?.team?.bracketPosition || tournament?.bracketPosition || '',
      timestamp: tournament?.startTime || tournament?.scheduleTime || tournament?.timestamp || Date.now(),
    }))
    .filter((t) => t.tournamentId > 0); // Filter out invalid entries

  const bestResult = recentTournaments
    .filter((t) => t.position !== undefined && t.position !== null)
    .sort((a, b) => (a.position || 999) - (b.position || 999))[0];

  return {
    tournamentsParticipated: clashData.length,
    recentTournaments,
    bestResult: bestResult
      ? {
          tournamentName: bestResult.tournamentName,
          position: bestResult.position || 0,
          bracketPosition: bestResult.bracketPosition || '',
        }
      : undefined,
  };
}

/**
 * Extract ranked information
 */
function extractRankedInfo(leagueEntries: LeagueEntry[]): AIDataPayload['ranked'] {
  const result: AIDataPayload['ranked'] = {};

  for (const entry of leagueEntries) {
    const queueType = entry.queueType || '';
    const wins = entry.wins || 0;
    const losses = entry.losses || 0;
    const total = wins + losses;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    const rankedInfo = {
      tier: entry.tier || 'UNRANKED',
      rank: entry.rank || 'IV',
      leaguePoints: entry.leaguePoints || 0,
      wins,
      losses,
      winRate: Math.round(winRate * 10) / 10,
    };

    if (queueType === 'RANKED_SOLO_5x5') {
      result.soloQueue = rankedInfo;
    } else if (queueType === 'RANKED_FLEX_SR') {
      result.flexQueue = rankedInfo;
    }
  }

  return result;
}

/**
 * Calculate precomputed insights
 */
function calculatePrecomputedInsights(
  matchStats: AIDataPayload['matchStats'],
  championMastery: AIDataPayload['championMastery'],
  recentMatches: AIDataPayload['recentMatches'] = []
) {
  const strongestChampions: string[] = [];
  const weakestChampions: string[] = [];

  // Find strongest/weakest champions (min 5 games)
  const championsWithStats = championMastery.topChampions.filter((c) => c.games >= 5);
  const sortedByWinRate = [...championsWithStats].sort((a, b) => b.winRate - a.winRate);
  
  strongestChampions.push(...sortedByWinRate.slice(0, 3).map((c) => c.championName));
  weakestChampions.push(...sortedByWinRate.slice(-3).reverse().map((c) => c.championName));

  // Find best/worst roles from recent matches
  const roleStats = new Map<string, { games: number; wins: number }>();
  
  for (const match of recentMatches) {
    const role = match.role || match.teamPosition || 'UNKNOWN';
    if (!roleStats.has(role)) {
      roleStats.set(role, { games: 0, wins: 0 });
    }
    const stats = roleStats.get(role)!;
    stats.games++;
    if (match.win) stats.wins++;
  }

  // Find best and worst roles (min 3 games per role)
  const rolesWithStats = Array.from(roleStats.entries())
    .filter(([_, stats]) => stats.games >= 3)
    .map(([role, stats]) => ({
      role,
      winRate: (stats.wins / stats.games) * 100,
      games: stats.games,
    }))
    .sort((a, b) => b.winRate - a.winRate);

  const bestRole = rolesWithStats.length > 0 ? rolesWithStats[0].role : 'UNKNOWN';
  const worstRole = rolesWithStats.length > 1 ? rolesWithStats[rolesWithStats.length - 1].role : 'UNKNOWN';

  // Find peak performance match from recent matches
  let peakPerformance: { date: string; kda: number; damage: number } | null = null;
  if (recentMatches.length > 0) {
    let bestMatch = recentMatches[0];
    let bestScore = 0;

    for (const match of recentMatches) {
      const kda = match.kda.d > 0 
        ? (match.kda.k + match.kda.a) / match.kda.d 
        : match.kda.k + match.kda.a;
      const score = kda * (match.damage / 1000);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = match;
      }
    }

    peakPerformance = {
      date: new Date(bestMatch.timestamp).toISOString().split('T')[0],
      kda: bestMatch.kda.d > 0 
        ? (bestMatch.kda.k + bestMatch.kda.a) / bestMatch.kda.d 
        : bestMatch.kda.k + bestMatch.kda.a,
      damage: bestMatch.damage,
    };
  }

  // Identify improvement areas based on stats
  const improvementAreas: string[] = [];
  if (matchStats.avgVision < 20) improvementAreas.push('Vision Control');
  if (matchStats.avgKDA.deaths > 6) improvementAreas.push('Death Reduction');
  if (matchStats.winRate < 50) improvementAreas.push('Win Rate');
  if (matchStats.avgDamagePerMin < 400) improvementAreas.push('Damage Output');
  if (matchStats.avgCS < 150) improvementAreas.push('CS/Farm');
  if (matchStats.avgKillParticipation < 50 && matchStats.totalGames >= 10) {
    improvementAreas.push('Team Fight Participation');
  }
  if (matchStats.recentWinRate < matchStats.winRate - 10) {
    improvementAreas.push('Recent Performance');
  }

  return {
    strongestChampions,
    weakestChampions,
    bestRole,
    worstRole,
    peakPerformance,
    improvementAreas,
  };
}

/**
 * Generate cache key from player data
 */
function generateCacheKey(playerData: PlayerData): string {
  const puuid = playerData.account?.puuid || '';
  const matchCount = playerData.matchDetails?.length || 0;
  const masteryCount = playerData.championMastery?.length || 0;
  return `${puuid}-${matchCount}-${masteryCount}`;
}

/**
 * Get queue type name from queue ID
 */
function getQueueType(queueId?: number): string {
  const queueTypes: Record<number, string> = {
    420: 'Ranked Solo/Duo',
    440: 'Ranked Flex',
    450: 'ARAM',
    700: 'Clash',
    400: 'Normal Draft',
    430: 'Normal Blind',
  };
  return queueTypes[queueId || 0] || 'Unknown';
}


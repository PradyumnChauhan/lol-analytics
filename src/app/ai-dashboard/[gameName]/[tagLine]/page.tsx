'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, ArrowLeft, Loader2, RefreshCw, Sparkles, TrendingUp, Target, Trophy, Home } from 'lucide-react';
import { useAIAnalytics } from '@/hooks/useAIAnalytics';
import { aggregatePlayerDataForAI, type AIDataPayload } from '@/lib/ai/data-aggregator';
import { FloatingAssistant } from '@/components/ai/FloatingAssistant';
import { localStorageManager } from '@/lib/storage';
import { getBackendUrl } from '@/lib/utils/backend-url';
import { AIDashboardInsights } from '@/components/ai/AIDashboardInsights';
import type { InsightCard, DashboardInsightsResponse } from '@/lib/ai/types';

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
  [key: string]: unknown;
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
  [key: string]: unknown;
}

interface LeagueEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  [key: string]: unknown;
}

interface BackendSummonerData {
  puuid: string;
  gameName: string;
  tagLine: string;
  summonerId?: string;
  accountId?: string;
  profileIconId?: number;
  revisionDate?: number;
  summonerLevel?: number;
  name?: string;
  id?: string;
  [key: string]: unknown;
}

interface ChallengePlayerData {
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
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface PlayerData {
  isLoading: boolean;
  account?: BackendSummonerData;
  summoner?: BackendSummonerData;
  matchDetails?: MatchData[];
  championMastery?: ChampionMastery[];
  leagueEntries?: LeagueEntry[];
  challenges?: ChallengePlayerData | null;
  clash?: unknown;
  region?: string;
  error?: string;
}

export default function AIDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [playerData, setPlayerData] = useState<PlayerData>({ isLoading: true });
  const [aggregatedData, setAggregatedData] = useState<AIDataPayload | null>(null);
  
  const {
    dashboardInsights,
    loading: aiLoading,
    error: aiError,
    fetchDashboardInsights,
  } = useAIAnalytics();

  const gameName = decodeURIComponent(params.gameName as string);
  const tagLine = decodeURIComponent(params.tagLine as string);

  // Load player data (reuse existing logic)
  const loadPlayerData = useCallback(async () => {
    setPlayerData({ isLoading: true });

    try {
      // First, try to load from localStorage cache
      const cachedData = localStorageManager.getCachedPlayerData(gameName, tagLine);
      if (cachedData) {
        const loadedData: PlayerData = {
          isLoading: false,
          ...cachedData
        };
        setPlayerData(loadedData);
        
        // Aggregate data for AI - normalize summoner data
        const normalizedData = {
          ...loadedData,
          summoner: loadedData.summoner ? {
            ...loadedData.summoner,
            summonerLevel: loadedData.summoner.summonerLevel ?? 0,
            profileIconId: loadedData.summoner.profileIconId ?? 0,
          } : undefined,
        };
        const aggregated = aggregatePlayerDataForAI(normalizedData);
        setAggregatedData(aggregated);
        
        // Fetch AI insights (only this API call needed, not all the data fetching)
        await fetchDashboardInsights(aggregated);
        return;
      }

      // If no cache, check if user came from player dashboard
      // If directly accessing URL, redirect to player dashboard with message
      if (typeof window !== 'undefined' && !sessionStorage.getItem(`ai_dashboard_access_${gameName}_${tagLine}`)) {
        // Set a flag to show message on player dashboard
        sessionStorage.setItem(`ai_dashboard_redirect_message`, 'Please click the &quot;AI Dashboard&quot; button to access AI analytics.');
        router.replace(`/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
        return;
      }

      // Clear the session flag after use
      sessionStorage.removeItem(`ai_dashboard_access_${gameName}_${tagLine}`);

      // If cache expired or not found, fetch from API (fallback)
      const regionParam = searchParams.get('region') || 'americas';
      const regionToPlatform: Record<string, string> = {
        'americas': 'na1',
        'asia': 'kr',
        'europe': 'euw1',
      };
      const region = regionParam;
      const platform = regionToPlatform[regionParam] || 'na1';

      // Step 1: Get account by Riot ID
      const accountResponse = await fetch(
        `${getBackendUrl()}/api/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?region=${region}`
      );
      if (!accountResponse.ok) {
        throw new Error(`Account fetch failed: ${accountResponse.status}`);
      }
      const account = await accountResponse.json();

      // Step 2: Get summoner data
      const summonerResponse = await fetch(
        `${getBackendUrl()}/api/summoner/v4/summoners/by-puuid/${account.puuid}?region=${platform}&autoDetect=true`
      );
      const summoner = summonerResponse.ok ? await summonerResponse.json() : null;

      // Step 3: Get match history
      const matchIdsResponse = await fetch(
        `${getBackendUrl()}/api/match/v5/matches/by-puuid/${account.puuid}/ids?region=${region}&count=30`
      );
      const matchIds = matchIdsResponse.ok ? await matchIdsResponse.json() : [];

      // Step 4: Get detailed matches
      const matchDetails = await Promise.all(
        matchIds.slice(0, 30).map(async (matchId: string) => {
          const matchResponse = await fetch(`${getBackendUrl()}/api/match/v5/matches/${matchId}?region=${region}`);
          return matchResponse.ok ? await matchResponse.json() : null;
        })
      );
      const validMatches = matchDetails.filter(Boolean);

      // Step 5: Get champion mastery
      const masteryResponse = await fetch(
        `${getBackendUrl()}/api/champion-mastery/v4/champion-masteries/by-puuid/${account.puuid}?region=${platform}`
      );
      const championMastery = masteryResponse.ok ? await masteryResponse.json() : [];

      // Step 6: Get league entries
      const leagueResponse = await fetch(
        `${getBackendUrl()}/api/league/v4/entries/by-puuid/${account.puuid}?region=${platform}`
      );
      const leagueEntries = leagueResponse.ok ? await leagueResponse.json() : [];

      // Step 7: Get challenges (optional)
      let challenges = null;
      try {
        const challengeResponse = await fetch(
          `${getBackendUrl()}/api/challenges/v1/player-data/by-puuid/${account.puuid}?region=${platform}`
        );
        if (challengeResponse.ok) {
          challenges = await challengeResponse.json();
        }
      } catch {
        // Challenges not available
      }

      // Step 8: Get Clash data (optional)
      let clash = null;
      try {
        if (summoner?.id) {
          const clashResponse = await fetch(
            `${getBackendUrl()}/api/clash/v1/players/by-summoner/${summoner.id}?region=${platform}`
          );
          if (clashResponse.ok) {
            await clashResponse.json(); // clashData not used
            // If we get clash data, also fetch tournaments
            const tournamentsResponse = await fetch(
              `${getBackendUrl()}/api/clash/v1/tournaments?region=${platform}`
            );
            if (tournamentsResponse.ok) {
              clash = await tournamentsResponse.json();
            }
          }
        }
      } catch {
        // Clash data not available
      }

      const loadedData: PlayerData = {
        isLoading: false,
        account: { ...account, puuid: account.puuid, gameName: account.gameName, tagLine: account.tagLine },
        summoner: summoner ? { ...summoner, summonerLevel: summoner.summonerLevel, profileIconId: summoner.profileIconId } : undefined,
        matchDetails: validMatches,
        championMastery,
        leagueEntries,
        challenges,
        clash,
        region: platform,
      };

      setPlayerData(loadedData);

      // Cache the fetched data for future use
      localStorageManager.setCachedPlayerData(gameName, tagLine, {
        account: loadedData.account,
        summoner: loadedData.summoner,
        matchDetails: loadedData.matchDetails,
        championMastery: loadedData.championMastery,
        leagueEntries: loadedData.leagueEntries,
        challenges: loadedData.challenges,
        clash: loadedData.clash,
        region: loadedData.region,
      });

      // Aggregate data for AI - normalize summoner data
      const normalizedData = {
        ...loadedData,
        summoner: loadedData.summoner ? {
          ...loadedData.summoner,
          summonerLevel: loadedData.summoner.summonerLevel ?? 0,
          profileIconId: loadedData.summoner.profileIconId ?? 0,
        } : undefined,
      };
      const aggregated = aggregatePlayerDataForAI(normalizedData);
      setAggregatedData(aggregated);

      // Fetch AI insights
      await fetchDashboardInsights(aggregated);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load player data';
      setPlayerData({ isLoading: false, error: errorMessage });
    }
  }, [gameName, tagLine, searchParams, fetchDashboardInsights, router]);

  useEffect(() => {
    loadPlayerData();
  }, [loadPlayerData]);

  // Prepare player data for FloatingAssistant
  const assistantPlayerData = useMemo(() => {
    if (!aggregatedData) return null;
    return aggregatedData;
  }, [aggregatedData]);

  // Get ranked info for navbar (must be before early returns)
  const rankedInfo = useMemo(() => {
    if (!aggregatedData?.ranked) return null;
    return aggregatedData.ranked.soloQueue || aggregatedData.ranked.flexQueue || null;
  }, [aggregatedData]);
  
  const matchStats = aggregatedData?.matchStats;

  if (playerData.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading player data...</p>
        </div>
      </div>
    );
  }

  if (playerData.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{playerData.error}</p>
          <div className="space-y-2">
            <Button onClick={() => loadPlayerData()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`)}
              className="w-full"
            >
              Go to Player Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 shadow-xl sticky top-0 z-50 border-b-4 border-purple-400">
        <div className="container mx-auto px-4 py-3">
          {/* Top Row: Navigation & Actions */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="text-white hover:bg-white/20 border-white/30"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push(`/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`)}
                className="text-white hover:bg-white/20 border-white/30"
                size="sm"
              >
                <Home className="h-4 w-4 mr-2" />
                Player Dashboard
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (aggregatedData) {
                  fetchDashboardInsights(aggregatedData);
                }
              }}
              disabled={aiLoading || !aggregatedData}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
                size="sm"
            >
              {aiLoading ? (
                  <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
              ) : (
                  <>
                <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Analysis
                  </>
              )}
            </Button>
            </div>
          </div>

          {/* Bottom Row: Player Info & Quick Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Player Identity */}
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 border border-white/30 shadow-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
                  {gameName}#{tagLine}
                  <span className="text-sm font-normal text-purple-100 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">AI Analytics</span>
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  {rankedInfo && (
                    <span className="text-sm bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white border border-white/30 font-medium">
                      {rankedInfo.tier} {rankedInfo.rank} {rankedInfo.leaguePoints}LP
                    </span>
                  )}
                  {playerData.summoner?.summonerLevel && (
                    <span className="text-sm text-purple-100 font-medium">Level {playerData.summoner.summonerLevel}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            {matchStats && (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/25 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-300" />
                    <div>
                      <div className="text-xs text-purple-100 font-medium mb-0.5">Win Rate</div>
                      <div className="text-lg font-bold text-white">{matchStats.winRate.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/25 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-300" />
                    <div>
                      <div className="text-xs text-purple-100 font-medium mb-0.5">KDA</div>
                      <div className="text-lg font-bold text-white">
                        {matchStats.avgKDA.kills.toFixed(1)}/{matchStats.avgKDA.deaths.toFixed(1)}/{matchStats.avgKDA.assists.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/25 shadow-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-300" />
                    <div>
                      <div className="text-xs text-purple-100 font-medium mb-0.5">Recent Form</div>
                      <div className="text-lg font-bold text-white">{matchStats.recentWinRate.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>

                {dashboardInsights && (
                  <div className="bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/25 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-pink-300" />
                      <div>
                        <div className="text-xs text-purple-100 font-medium mb-0.5">Matches Analyzed</div>
                        <div className="text-lg font-bold text-white">{dashboardInsights.matchesAnalyzed}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {aiError && (
          <Card className="p-6 mb-8 bg-red-50 border border-red-200">
            <p className="text-red-800 text-base">Error: {aiError}</p>
          </Card>
        )}

        {aiLoading && !dashboardInsights && (
          <Card className="p-12 text-center border border-gray-200">
            <Loader2 className="h-16 w-16 mx-auto mb-6 animate-spin text-purple-600" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Generating AI Insights</h3>
            <p className="text-gray-600 text-base">This may take 10-30 seconds</p>
          </Card>
        )}

        {dashboardInsights && aggregatedData && (
          <AIDashboardContent
            insights={dashboardInsights}
            aggregatedData={aggregatedData}
          />
        )}

        {!aiLoading && !dashboardInsights && aggregatedData && (
          <Card className="p-12 text-center border border-gray-200">
            <Brain className="h-20 w-20 mx-auto mb-6 text-purple-400" />
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Ready for AI Analysis</h2>
            <p className="text-gray-700 mb-8 text-lg leading-relaxed">
              Click &quot;Refresh Insights&quot; to generate comprehensive AI-powered analysis
            </p>
            <Button
              onClick={() => {
                if (aggregatedData) {
                  fetchDashboardInsights(aggregatedData);
                }
              }}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-6 text-lg"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Generate AI Insights
            </Button>
          </Card>
        )}
      </div>

      {/* Floating Assistant */}
      {assistantPlayerData && (
        <FloatingAssistant
          playerData={assistantPlayerData}
          playerPuuid={playerData.account?.puuid}
        />
      )}
    </div>
  );
}

interface AIDashboardContentProps {
  insights: {
    insights: string | InsightCard[] | DashboardInsightsResponse;
    analysisType: string;
    matchesAnalyzed: number;
    model?: string;
  };
  aggregatedData: AIDataPayload;
}

function AIDashboardContent({ insights }: AIDashboardContentProps) {
  return (
    <article className="bg-white">
      {/* Blog-style Header */}
      <header className="mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-2">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                AI Analysis
              </h1>
              <p className="text-sm text-gray-600">
                Comprehensive insights based on {insights.matchesAnalyzed} matches analyzed
              </p>
            </div>
          </div>
          {insights.model && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium border border-gray-200">
              {insights.model}
            </span>
          )}
        </div>
      </header>

      {/* Structured Insight Cards */}
      <AIDashboardInsights insights={insights.insights} />
    </article>
  );
}


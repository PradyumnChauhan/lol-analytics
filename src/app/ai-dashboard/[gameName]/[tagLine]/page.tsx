'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, ArrowLeft, Loader2, RefreshCw, Sparkles, TrendingUp, Target, Award, BarChart3, Trophy, Users, Zap, Home, Share2, Download } from 'lucide-react';
import { useAIAnalytics } from '@/hooks/useAIAnalytics';
import { aggregatePlayerDataForAI, type AIDataPayload } from '@/lib/ai/data-aggregator';
import { FloatingAssistant } from '@/components/ai/FloatingAssistant';
import { localStorageManager } from '@/lib/storage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

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

interface LeagueEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  [key: string]: any;
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
  [key: string]: any;
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
    [key: string]: any;
  }>;
  [key: string]: any;
}

interface PlayerData {
  isLoading: boolean;
  account?: BackendSummonerData;
  summoner?: BackendSummonerData;
  matchDetails?: MatchData[];
  championMastery?: ChampionMastery[];
  leagueEntries?: LeagueEntry[];
  challenges?: ChallengePlayerData | null;
  clash?: any;
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
        
        // Aggregate data for AI
        const aggregated = aggregatePlayerDataForAI(loadedData);
        setAggregatedData(aggregated);
        
        // Fetch AI insights (only this API call needed, not all the data fetching)
        await fetchDashboardInsights(aggregated);
        return;
      }

      // If no cache, check if user came from player dashboard
      // If directly accessing URL, redirect to player dashboard with message
      if (typeof window !== 'undefined' && !sessionStorage.getItem(`ai_dashboard_access_${gameName}_${tagLine}`)) {
        // Set a flag to show message on player dashboard
        sessionStorage.setItem(`ai_dashboard_redirect_message`, 'Please click the "AI Dashboard" button to access AI analytics.');
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
        `${BASE_URL}/api/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?region=${region}`
      );
      if (!accountResponse.ok) {
        throw new Error(`Account fetch failed: ${accountResponse.status}`);
      }
      const account = await accountResponse.json();

      // Step 2: Get summoner data
      const summonerResponse = await fetch(
        `${BASE_URL}/api/summoner/v4/summoners/by-puuid/${account.puuid}?region=${platform}&autoDetect=true`
      );
      const summoner = summonerResponse.ok ? await summonerResponse.json() : null;

      // Step 3: Get match history
      const matchIdsResponse = await fetch(
        `${BASE_URL}/api/match/v5/matches/by-puuid/${account.puuid}/ids?region=${region}&count=30`
      );
      const matchIds = matchIdsResponse.ok ? await matchIdsResponse.json() : [];

      // Step 4: Get detailed matches
      const matchDetails = await Promise.all(
        matchIds.slice(0, 30).map(async (matchId: string) => {
          const matchResponse = await fetch(`${BASE_URL}/api/match/v5/matches/${matchId}?region=${region}`);
          return matchResponse.ok ? await matchResponse.json() : null;
        })
      );
      const validMatches = matchDetails.filter(Boolean);

      // Step 5: Get champion mastery
      const masteryResponse = await fetch(
        `${BASE_URL}/api/champion-mastery/v4/champion-masteries/by-puuid/${account.puuid}?region=${platform}`
      );
      const championMastery = masteryResponse.ok ? await masteryResponse.json() : [];

      // Step 6: Get league entries
      const leagueResponse = await fetch(
        `${BASE_URL}/api/league/v4/entries/by-puuid/${account.puuid}?region=${platform}`
      );
      const leagueEntries = leagueResponse.ok ? await leagueResponse.json() : [];

      // Step 7: Get challenges (optional)
      let challenges = null;
      try {
        const challengeResponse = await fetch(
          `${BASE_URL}/api/challenges/v1/player-data/by-puuid/${account.puuid}?region=${platform}`
        );
        if (challengeResponse.ok) {
          challenges = await challengeResponse.json();
        }
      } catch (error) {
        // Challenges not available
      }

      // Step 8: Get Clash data (optional)
      let clash = null;
      try {
        if (summoner?.id) {
          const clashResponse = await fetch(
            `${BASE_URL}/api/clash/v1/players/by-summoner/${summoner.id}?region=${platform}`
          );
          if (clashResponse.ok) {
            const clashData = await clashResponse.json();
            // If we get clash data, also fetch tournaments
            const tournamentsResponse = await fetch(
              `${BASE_URL}/api/clash/v1/tournaments?region=${platform}`
            );
            if (tournamentsResponse.ok) {
              clash = await tournamentsResponse.json();
            }
          }
        }
      } catch (error) {
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

      // Aggregate data for AI
      const aggregated = aggregatePlayerDataForAI(loadedData);
      setAggregatedData(aggregated);

      // Fetch AI insights
      await fetchDashboardInsights(aggregated);

    } catch (error: any) {
      setPlayerData({ isLoading: false, error: error.message });
    }
  }, [gameName, tagLine, searchParams, fetchDashboardInsights]);

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
        <div className="container mx-auto px-6 py-6">
          {/* Top Row: Navigation & Actions */}
          <div className="flex items-center justify-between mb-3">
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
          <div className="flex flex-wrap items-center justify-between gap-6">
            {/* Player Identity */}
            <div className="flex items-center gap-5">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30 shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                  {gameName}#{tagLine}
                  <span className="text-base font-normal text-purple-100 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">AI Analytics</span>
                </h1>
                <div className="flex items-center gap-4 mt-2">
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
              <div className="flex items-center gap-5 flex-wrap">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/25 shadow-lg">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-yellow-300" />
                    <div>
                      <div className="text-xs text-purple-100 font-medium mb-1">Win Rate</div>
                      <div className="text-xl font-bold text-white">{matchStats.winRate.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/25 shadow-lg">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-green-300" />
                    <div>
                      <div className="text-xs text-purple-100 font-medium mb-1">KDA</div>
                      <div className="text-xl font-bold text-white">
                        {matchStats.avgKDA.kills.toFixed(1)}/{matchStats.avgKDA.deaths.toFixed(1)}/{matchStats.avgKDA.assists.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/25 shadow-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-300" />
                    <div>
                      <div className="text-xs text-purple-100 font-medium mb-1">Recent Form</div>
                      <div className="text-xl font-bold text-white">{matchStats.recentWinRate.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>

                {dashboardInsights && (
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/25 shadow-lg">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-pink-300" />
                      <div>
                        <div className="text-xs text-purple-100 font-medium mb-1">Matches Analyzed</div>
                        <div className="text-xl font-bold text-white">{dashboardInsights.matchesAnalyzed}</div>
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
      <div className="max-w-4xl mx-auto px-8 py-16">
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
              Click "Refresh Insights" to generate comprehensive AI-powered analysis
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
          puuid={playerData.account?.puuid}
        />
      )}
    </div>
  );
}

interface AIDashboardContentProps {
  insights: {
    insights: string;
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
      <header className="mb-12 pb-8 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-2">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                AI Analysis
              </h1>
              <p className="text-base text-gray-600">
                Comprehensive insights based on {insights.matchesAnalyzed} matches analyzed
              </p>
            </div>
          </div>
          {insights.model && (
            <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium border border-gray-200">
              {insights.model}
            </span>
          )}
        </div>
      </header>

      {/* Blog Content */}
      <div className="prose prose-lg max-w-none 
        prose-headings:font-bold prose-headings:text-gray-900 
        prose-h1:text-4xl prose-h1:font-bold prose-h1:text-gray-900 prose-h1:mt-0 prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b prose-h1:border-gray-200
        prose-h2:text-3xl prose-h2:font-bold prose-h2:text-gray-900 prose-h2:mt-16 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-100
        prose-h3:text-2xl prose-h3:font-semibold prose-h3:text-gray-900 prose-h3:mt-12 prose-h3:mb-5
        prose-p:text-lg prose-p:text-gray-700 prose-p:leading-8 prose-p:mb-6 prose-p:font-normal
        prose-strong:text-gray-900 prose-strong:font-semibold
        prose-ul:text-gray-700 prose-ul:my-8 prose-ul:pl-6 prose-ul:space-y-3
        prose-li:text-lg prose-li:text-gray-700 prose-li:mb-4 prose-li:leading-8 prose-li:font-normal prose-li:pl-1
        prose-ol:text-gray-700 prose-ol:my-8 prose-ol:pl-6 prose-ol:space-y-3
        prose-ol-li:text-lg prose-ol-li:text-gray-700 prose-ol-li:mb-4 prose-ol-li:leading-8 prose-ol-li:font-normal
        prose-li::marker:text-gray-500 prose-li::marker:font-semibold
        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
        prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:bg-gray-50 prose-blockquote:py-3 prose-blockquote:rounded-r prose-blockquote:my-8
        prose-code:text-gray-900 prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
        prose-pre:bg-gray-900 prose-pre:text-white prose-pre:rounded-lg prose-pre:p-4 prose-pre:my-8
        [&>h1]:mt-0 [&>h1]:mb-8
        [&>h2:first-of-type]:mt-0
        [&>p:first-of-type]:mt-0
        [&>ul:first-of-type]:mt-0
        [&>ol:first-of-type]:mt-0">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {insights.insights}
        </ReactMarkdown>
      </div>
    </article>
  );
}


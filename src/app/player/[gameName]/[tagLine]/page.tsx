"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import React, { useState, useEffect, useCallback, Suspense, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MatchDetailPopup } from "@/components/match/MatchDetailPopup"
import { MatchFilters, type MatchFilter } from "@/components/match/MatchFilters"
import { CompactMatchCard } from "@/components/match/CompactMatchCard"
import { LiveGameDashboard } from "@/components/spectator/LiveGameDashboard"
import { ChallengeTracker } from "@/components/challenges/ChallengeTracker"
import { AchievementTimeline } from "@/components/challenges/AchievementTimeline"
import { CategoryProgress } from "@/components/challenges/CategoryProgress"
import { PerformanceGraph } from "@/components/analytics/PerformanceGraph"
import { ChampionTierList } from "@/components/analytics/ChampionTierList"
import { StrengthsWeaknessesAnalysis } from "@/components/analytics/StrengthsWeaknessesAnalysis"
import { DeathLocationMap } from "@/components/visualization/DeathLocationMap"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import { LoadingCard } from "@/components/common/LoadingSpinner"
import {
  transformMatchData,
  transformMasteryData,
  transformChallengeData,
  aggregateChampionStats,
  calculateTrends,
} from "@/lib/api/data-transformers"
import type { ChallengePlayerData } from "@/lib/api/endpoints/challenges"
import {
  ArrowLeft,
  GamepadIcon,
  Trophy,
  Activity,
  TrendingUp,
  Crown,
  BarChart3,
  Award,
  RefreshCw,
  Brain,
} from "lucide-react"
import { FloatingAssistant } from "@/components/ai/FloatingAssistant"
import { aggregatePlayerDataForAI, type AIDataPayload } from "@/lib/ai/data-aggregator"

// Define types and interfaces used within the component
interface PlayerDataState {
  isLoading: boolean
  error: string | null
  account: any | null
  summoner: any | null
  matchDetails: any[]
  championMastery: any[]
  leagueEntries: any[]
  challenges: ChallengePlayerData | null
  clash: any | null
  region: string | null
  analyticsData: {
    trends: any[]
    championStats: any[]
  }
}

interface MatchParticipant {
  puuid: string
  championId: number
  championName: string
  win: boolean
  kills: number
  deaths: number
  assists: number
  totalDamageDealtToChampions: number
  goldEarned: number
  doubleKills: number
  tripleKills: number
  quadraKills: number
  pentaKills: number
  role?: string
  teamPosition?: string
}

function PlayerDashboard() {
  const router = useRouter()
  const { gameName, tagLine } = useParams<{ gameName: string; tagLine: string }>()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null)
  const [isMatchPopupOpen, setIsMatchPopupOpen] = useState(false)
  const [matchFilters, setMatchFilters] = useState<MatchFilter>({
    queueType: "all",
    champion: "all",
    result: "all",
    dateRange: "all",
    sortBy: "recent",
    sortOrder: "desc",
  })
  const [matchesToShow, setMatchesToShow] = useState(10)
  const [championsToShow, setChampionsToShow] = useState(10)
  const [playerData, setPlayerData] = useState<PlayerDataState>({
    isLoading: true,
    error: null,
    account: null,
    summoner: null,
    matchDetails: [],
    championMastery: [],
    leagueEntries: [],
    challenges: null,
    clash: null,
    region: null,
    analyticsData: { trends: [], championStats: [] },
  })
  const [totalMasteryScore, setTotalMasteryScore] = useState<number | null>(null)
  const [challengeData, setChallengeData] = useState<ChallengePlayerData | null>(null)
  const [isChallengeLoading, setIsChallengeLoading] = useState(true)
  const [challengeError, setChallengeError] = useState<string | null>(null)
  const [liveGameData, setLiveGameData] = useState<any | null>(null)
  const [isLiveGameLoading, setIsLiveGameLoading] = useState(true)
  const [liveGameError, setLiveGameError] = useState<string | null>(null)
  const [aggregatedAIData, setAggregatedAIData] = useState<AIDataPayload | null>(null)

  const isClient = typeof window !== "undefined"
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

  // Helper function to safely parse JSON responses
  const safeJsonParse = async (res: Response) => {
    const contentType = res.headers.get("content-type") || ""
    
    // Clone the response first so we can read it multiple times if needed
    const clonedRes = res.clone()
    
    try {
      // Try to parse as JSON first
      const json = await res.json()
      return json
    } catch (jsonError) {
      // If JSON parsing fails, read as text to see what we got
      const text = await clonedRes.text()
      
      // Check if it looks like HTML (common error response)
      if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
        throw new Error(`Server returned HTML instead of JSON. This usually means the API endpoint is not found or returned an error page. Status: ${res.status}`)
      }
      
      // Try to parse as JSON one more time (in case content-type was wrong)
      try {
        return JSON.parse(text)
      } catch {
        throw new Error(`Expected JSON but received ${contentType || "unknown"}. Response preview: ${text.substring(0, 200)}`)
      }
    }
  }

  const fetchPlayerData = useCallback(async () => {
    setPlayerData((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const res = await fetch(
        `/api/player/${encodeURIComponent(gameName as string)}/${encodeURIComponent(tagLine as string)}`,
      )
      if (!res.ok) {
        let errorMessage = `Failed to fetch player data (${res.status})`
        try {
          const errorData = await safeJsonParse(res.clone())
          errorMessage = errorData.message || errorMessage
        } catch (parseError: any) {
          // If parsing fails, use status text or parse error message
          errorMessage = res.statusText || parseError.message || errorMessage
        }
        throw new Error(errorMessage)
      }
      const data = await safeJsonParse(res)

      // Normalize summoner data - handle both nested (by-riot-id) and flat (by-puuid) structures
      let normalizedSummoner = data.summoner;
      if (!normalizedSummoner && data.puuid) {
        // Handle flat structure (by-puuid response)
        normalizedSummoner = {
          puuid: data.puuid,
          profileIconId: data.profileIconId,
          revisionDate: data.revisionDate,
          summonerLevel: data.summonerLevel,
          id: data.id, // May or may not exist
          accountId: data.accountId, // May or may not exist
        };
      } else if (normalizedSummoner && !normalizedSummoner.puuid && data.account?.puuid) {
        // Ensure puuid is present in summoner object
        normalizedSummoner.puuid = data.account.puuid;
      }

      // Transform data here if necessary
      const transformedMasteryData = transformMasteryData(data.championMastery || [])
      const puuid = data.account?.puuid || normalizedSummoner?.puuid || ""
      const analytics = aggregateChampionStats(data.matches || [], data.championMastery || [], puuid)
      const trends = calculateTrends(data.matches || [], puuid)

      // Fetch total mastery score if available
      if (puuid && data.region) {
        fetch(`${BASE_URL}/api/champion-mastery/v4/scores/by-puuid/${puuid}?region=${data.region}`)
          .then(res => res.ok ? res.json() : null)
          .then(scoreData => {
            if (scoreData?.score !== undefined) {
              setTotalMasteryScore(scoreData.score)
            }
          })
          .catch(() => {
            // Calculate from mastery data if API fails
            const calculatedScore = transformedMasteryData.reduce((sum, m) => sum + (m.championPoints || 0), 0)
            setTotalMasteryScore(calculatedScore)
          })
      } else {
        // Calculate from mastery data if puuid not available
        const calculatedScore = transformedMasteryData.reduce((sum, m) => sum + (m.championPoints || 0), 0)
        setTotalMasteryScore(calculatedScore)
      }

      setPlayerData({
        isLoading: false,
        error: null,
        account: data.account,
        summoner: normalizedSummoner,
        matchDetails: data.matches || [],
        championMastery: transformedMasteryData,
        leagueEntries: data.leagueEntries,
        challenges: data.challenges,
        clash: data.clash,
        region: data.region,
        analyticsData: {
          trends: trends,
          championStats: analytics,
        },
      })
    } catch (error: any) {
      console.error("Error fetching player data:", error)
      setPlayerData((prev) => ({ ...prev, isLoading: false, error: error.message || "An unknown error occurred" }))
    }
  }, [gameName, tagLine])

  const fetchChallenges = useCallback(async () => {
    setIsChallengeLoading(true)
    try {
      const res = await fetch(
        `/api/challenges/${encodeURIComponent(gameName as string)}/${encodeURIComponent(tagLine as string)}`,
      )
      if (!res.ok) {
        let errorMessage = `Failed to fetch challenge data (${res.status})`
        try {
          const errorData = await safeJsonParse(res.clone())
          errorMessage = errorData.message || errorMessage
        } catch (parseError: any) {
          // If parsing fails, use status text or parse error message
          errorMessage = res.statusText || parseError.message || errorMessage
        }
        throw new Error(errorMessage)
      }
      const data = await safeJsonParse(res)
      // transformChallengeData returns a different structure, so we keep the original data
      // but if it's already in the correct format, use it directly
      if (data.preferences) {
        setChallengeData(data as ChallengePlayerData)
      } else {
        // If transformed, we need to add preferences or handle it differently
        setChallengeData(null)
      }
      setChallengeError(null)
    } catch (error: any) {
      console.error("Error fetching challenges:", error)
      setChallengeError(error.message || "An unknown error occurred")
      setChallengeData(null)
    } finally {
      setIsChallengeLoading(false)
    }
  }, [gameName, tagLine])

  const fetchLiveGame = useCallback(async () => {
    setIsLiveGameLoading(true)
    try {
      const res = await fetch(
        `/api/live-game/${encodeURIComponent(gameName as string)}/${encodeURIComponent(tagLine as string)}`,
      )
      if (!res.ok) {
        // 404 is expected when player is not in a game - don't treat as error
        if (res.status === 404) {
          setLiveGameData(null)
          setLiveGameError(null)
          return
        }
        
        let errorMessage = `Failed to fetch live game data (${res.status})`
        try {
          const errorData = await safeJsonParse(res.clone())
          errorMessage = errorData.message || errorMessage
        } catch (parseError: any) {
          // If parsing fails, use status text or parse error message
          errorMessage = res.statusText || parseError.message || errorMessage
        }
        setLiveGameError(errorMessage)
        setLiveGameData(null)
        return
      }
      const data = await safeJsonParse(res)
      setLiveGameData(data)
      setLiveGameError(null)
    } catch (error: any) {
      console.error("Error fetching live game:", error)
      setLiveGameError(error.message || "An unknown error occurred")
      setLiveGameData(null)
    } finally {
      setIsLiveGameLoading(false)
    }
  }, [gameName, tagLine])

  const aggregateAIPlayerStats = useCallback(async () => {
    if (!playerData.account || !playerData.summoner || !playerData.matchDetails || !playerData.championMastery) return
    try {
      // Convert ChallengePlayerData to ChallengeData format if needed
      const challengeData = playerData.challenges ? {
        totalPoints: playerData.challenges.totalPoints ? {
          level: playerData.challenges.totalPoints.level,
          current: playerData.challenges.totalPoints.current,
          max: playerData.challenges.totalPoints.max || 0,
          percentile: playerData.challenges.totalPoints.percentile,
        } : undefined,
        categoryPoints: {
          COMBAT: typeof playerData.challenges.categoryPoints?.COMBAT === 'object' 
            ? playerData.challenges.categoryPoints.COMBAT.current 
            : playerData.challenges.categoryPoints?.COMBAT || 0,
          EXPERTISE: typeof playerData.challenges.categoryPoints?.EXPERTISE === 'object'
            ? playerData.challenges.categoryPoints.EXPERTISE.current
            : playerData.challenges.categoryPoints?.EXPERTISE || 0,
          TEAMWORK: typeof playerData.challenges.categoryPoints?.TEAMWORK === 'object'
            ? playerData.challenges.categoryPoints.TEAMWORK.current
            : playerData.challenges.categoryPoints?.TEAMWORK || 0,
          COLLECTION: typeof playerData.challenges.categoryPoints?.COLLECTION === 'object'
            ? playerData.challenges.categoryPoints.COLLECTION.current
            : playerData.challenges.categoryPoints?.COLLECTION || 0,
          LEGACY: typeof playerData.challenges.categoryPoints?.LEGACY === 'object'
            ? playerData.challenges.categoryPoints.LEGACY.current
            : playerData.challenges.categoryPoints?.LEGACY || 0,
        },
        challenges: playerData.challenges.challenges || [],
      } : null

      const data = await aggregatePlayerDataForAI({
        account: playerData.account,
        summoner: playerData.summoner,
        matchDetails: playerData.matchDetails,
        championMastery: playerData.championMastery,
        leagueEntries: playerData.leagueEntries,
        challenges: challengeData,
        clash: playerData.clash,
        region: playerData.region || undefined,
      })
      setAggregatedAIData(data)
    } catch (error) {
      console.error("Error aggregating AI player data:", error)
    }
  }, [playerData])

  useEffect(() => {
    fetchPlayerData()
    fetchChallenges()
    fetchLiveGame()
  }, [fetchPlayerData, fetchChallenges, fetchLiveGame])

  useEffect(() => {
    if (playerData.account && playerData.summoner && playerData.matchDetails.length > 0) {
      aggregateAIPlayerStats()
    }
  }, [playerData, aggregateAIPlayerStats])

  const handleBackClick = () => {
    router.back()
  }

  const handleRefresh = () => {
    fetchPlayerData()
    fetchChallenges()
    fetchLiveGame()
  }

  const handleMatchClick = (match: any) => {
    setSelectedMatch(match)
    setIsMatchPopupOpen(true)
  }

  const getRankIcon = (tier: string) => {
    // Dummy implementation, replace with actual icon mapping
    const icons: Record<string, React.ReactElement> = {
      CHALLENGER: <span className="text-orange-400">👑</span>,
      GRANDMASTER: <span className="text-red-500">🌟</span>,
      MASTER: <span className="text-purple-500">⭐</span>,
      DIAMOND: <span className="text-blue-400">💎</span>,
      EMERALD: <span className="text-green-400">🌿</span>,
      PLATINUM: <span className="text-cyan-400">⚪</span>,
      GOLD: <span className="text-yellow-500">🟡</span>,
      SILVER: <span className="text-gray-400">⚪</span>,
      BRONZE: <span className="text-orange-500">🥉</span>,
      IRON: <span className="text-gray-500">🔩</span>,
    }
    return icons[tier] || <span>?</span>
  }

  const {
    account,
    summoner,
    matchDetails,
    championMastery,
    leagueEntries,
    challenges,
    region,
    analyticsData,
    isLoading,
    error,
  } = playerData

  const primaryRank = useMemo(() => {
    if (!leagueEntries || leagueEntries.length === 0) return null
    // Filter for ranked solo/duo or ranked flex, prioritizing solo/duo
    const rankedSolo = leagueEntries.find((entry: any) => entry.queueType === "RANKED_SOLO_5x5")
    const rankedFlex = leagueEntries.find((entry: any) => entry.queueType === "RANKED_FLEX_5x5")
    return rankedSolo || rankedFlex || leagueEntries[0]
  }, [leagueEntries])

  const totalGames = matchDetails.length
  const wins = matchDetails.filter((match: any) => {
    const participant = match.info.participants.find((p: MatchParticipant) => p.puuid === account?.puuid)
    return participant?.win
  }).length
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0
  const recentForm = matchDetails.map((match: any) => {
    const participant = match.info.participants.find((p: MatchParticipant) => p.puuid === account?.puuid)
    return participant?.win || false
  })

  const isInGame = liveGameData && !isLiveGameLoading && !liveGameError
  const availableChampions = useMemo(() => {
    const { getChampionName } = require('@/lib/champions')
    const champMap = new Map<number, string>()
    // Map champion mastery data with names
    championMastery.forEach((cm: any) => {
      if (cm.championId) {
        champMap.set(cm.championId, cm.championName || getChampionName(cm.championId))
      }
    })
    // Add champions from matches if not present
    matchDetails.forEach((match: any) => {
      match.info.participants.forEach((p: MatchParticipant) => {
        if (!champMap.has(p.championId)) {
          champMap.set(p.championId, p.championName || getChampionName(p.championId))
        }
      })
    })
    return Array.from(champMap.entries()).map(([id, name]) => ({ id, name }))
  }, [championMastery, matchDetails])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Player Data</h2>
          <p className="text-slate-400">Fetching comprehensive analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center p-8 rounded-lg bg-red-900/50 border border-red-500/30">
          <svg
            className="h-16 w-16 mx-auto mb-4 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Data</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <Button onClick={handleRefresh} className="bg-red-600 hover:bg-red-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!account || !summoner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center p-8 rounded-lg bg-slate-900/80 border border-yellow-500/20">
          <svg
            className="h-16 w-16 mx-auto mb-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v4h-1m1-4h4m2 4h-1v-4m-1-4H2m4 12h8m-8-4h8m-8-4h8m-8-4h8M3 21h18"
            ></path>
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2">Player Not Found</h2>
          <p className="text-slate-400 mb-4">
            Could not find data for {gameName}#{tagLine}. Please check the summoner name and region.
          </p>
          <Button onClick={handleBackClick} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Enhanced Animated Background Video */}
      <div className="fixed inset-0 z-0">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-50">
          <source src="/bg/animated-ionia.webm" type="video/webm" />
        </video>
        {/* Minimal gradient overlay for readability - no purple */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="sticky top-0 z-50 border-b border-yellow-500/30 bg-gradient-to-r from-slate-950/95 to-slate-950/95 backdrop-blur-2xl shadow-2xl shadow-slate-900/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Row: Navigation & Profile */}
            <div className="flex items-center justify-between gap-4 py-3">
              {/* Left: Back Button & Profile */}
              <div className="flex items-center gap-4 flex-1">
                <Button
                  onClick={handleBackClick}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gradient-to-r hover:from-yellow-500/20 hover:via-amber-500/15 hover:to-yellow-500/20 hover:text-yellow-200 border border-yellow-500/40 rounded-lg transition-all shadow-sm hover:shadow-yellow-500/20 hover:border-yellow-400/60"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-yellow-400/60 shadow-lg shadow-yellow-500/20 ring-2 ring-purple-500/30">
                      <img
                        src={`https://ddragon.leagueoflegends.com/cdn/14.19.1/img/profileicon/${summoner.profileIconId}.png`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {isInGame && (
                      <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-lg shadow-green-400/50 animate-pulse"></div>
                    )}
                  </div>

                  <div>
                    <h1 className="text-lg font-bold text-white leading-tight">
                      {account.gameName}#{account.tagLine}
                    </h1>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-white/90 font-medium">Level {summoner.summonerLevel}</span>
                      {isInGame && (
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] px-1.5 py-0.5 border border-green-400/50 shadow-sm">
                          <div className="w-1 h-1 bg-white rounded-full mr-1 animate-pulse"></div>
                          In Game
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Rank & Stats Box */}
              <div className="flex items-center gap-3">
                {primaryRank && (
                  <div className="bg-gradient-to-br from-slate-900/90 via-purple-900/30 to-slate-900/90 rounded-xl px-3 py-1.5 border border-yellow-400/40 shadow-lg shadow-purple-500/10 hover:border-yellow-400/60 hover:shadow-yellow-500/20 transition-all backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getRankIcon(primaryRank.tier)}</span>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <div className="text-white font-bold text-xs leading-tight">
                            {primaryRank.tier} {primaryRank.rank}
                          </div>
                          {/* Status flags */}
                          <div className="flex items-center gap-0.5">
                            {primaryRank.hotStreak && (
                              <span className="text-[10px]" title="Hot Streak">🔥</span>
                            )}
                            {primaryRank.veteran && (
                              <span className="text-[10px]" title="Veteran">⭐</span>
                            )}
                            {primaryRank.freshBlood && (
                              <span className="text-[10px]" title="Fresh Blood">🆕</span>
                            )}
                            {primaryRank.inactive && (
                              <span className="text-[10px] text-red-400" title="Inactive">⚠️</span>
                            )}
                          </div>
                        </div>
                        <div className="text-yellow-400 font-semibold text-[10px]">{primaryRank.leaguePoints} LP</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compact Stats Box */}
                <div className="rounded-xl border border-yellow-500/30 bg-gradient-to-br from-slate-900/90 via-purple-900/30 to-slate-900/90 p-2 backdrop-blur-sm shadow-lg">
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="text-center">
                      <div className="text-sm font-bold text-white">{totalGames}</div>
                      <div className="text-[9px] text-white/70 font-medium">Games</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-bold ${winRate >= 60 ? "text-green-400" : winRate >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                        {winRate.toFixed(1)}%
                      </div>
                      <div className="text-[9px] text-white/70 font-medium">Win</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-white">{championMastery.length}</div>
                      <div className="text-[9px] text-white/70 font-medium">Champs</div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-0.5 mt-1.5 pt-1.5 border-t border-yellow-500/20">
                    {recentForm.slice(0, 5).map((win, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${win ? "bg-green-400" : "bg-red-400"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Action Buttons */}
            <div className="flex items-center gap-2 pb-3">
              <Button
                onClick={async () => {
                  if (playerData && playerData.account && !playerData.isLoading) {
                    const { localStorageManager } = await import("@/lib/storage")
                    localStorageManager.setCachedPlayerData(gameName, tagLine, {
                      account: playerData.account,
                      summoner: playerData.summoner,
                      matchDetails: playerData.matchDetails,
                      championMastery: playerData.championMastery,
                      leagueEntries: playerData.leagueEntries,
                      challenges: playerData.challenges,
                      clash: playerData.clash,
                      region: playerData.region,
                    })

                    if (typeof window !== "undefined") {
                      sessionStorage.setItem(`ai_dashboard_access_${gameName}_${tagLine}`, "true")
                    }

                    router.push(`/ai-dashboard/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`)
                  }
                }}
                className="text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 border-0 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
                size="sm"
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Dashboard
              </Button>

              <Button
                onClick={handleRefresh}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gradient-to-r hover:from-yellow-500/20 hover:via-amber-500/15 hover:to-yellow-500/20 hover:text-yellow-200 border border-yellow-500/40 rounded-lg transition-all shadow-sm hover:shadow-yellow-500/20 hover:border-yellow-400/60"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-1">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 bg-gradient-to-r from-slate-900/90 via-slate-800/50 to-slate-900/90 border border-yellow-500/30 rounded-lg p-0.5 shadow-xl shadow-slate-900/20 backdrop-blur-xl">
              <TabsTrigger
                value="overview"
                className="text-white text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500/30 data-[state=active]:via-amber-500/20 data-[state=active]:to-yellow-500/30 data-[state=active]:text-yellow-200 data-[state=active]:border-yellow-400/50 data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/20 border border-transparent rounded transition-all hover:text-yellow-300/80 py-1 px-1.5"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="matches"
                className="text-white text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500/30 data-[state=active]:via-amber-500/20 data-[state=active]:to-yellow-500/30 data-[state=active]:text-yellow-200 data-[state=active]:border-yellow-400/50 data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/20 border border-transparent rounded transition-all hover:text-yellow-300/80 py-1 px-1.5"
              >
                <GamepadIcon className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Matches</span>
              </TabsTrigger>
              <TabsTrigger
                value="champions"
                className="text-white text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500/30 data-[state=active]:via-amber-500/20 data-[state=active]:to-yellow-500/30 data-[state=active]:text-yellow-200 data-[state=active]:border-yellow-400/50 data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/20 border border-transparent rounded transition-all hover:text-yellow-300/80 py-1 px-1.5"
              >
                <Crown className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Champions</span>
              </TabsTrigger>
              <TabsTrigger
                value="mastery"
                className="text-white text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500/30 data-[state=active]:via-amber-500/20 data-[state=active]:to-yellow-500/30 data-[state=active]:text-yellow-200 data-[state=active]:border-yellow-400/50 data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/20 border border-transparent rounded transition-all hover:text-yellow-300/80 py-1 px-1.5"
              >
                <Trophy className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Mastery</span>
              </TabsTrigger>
              <TabsTrigger
                value="challenges"
                className="text-white text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500/30 data-[state=active]:via-amber-500/20 data-[state=active]:to-yellow-500/30 data-[state=active]:text-yellow-200 data-[state=active]:border-yellow-400/50 data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/20 border border-transparent rounded transition-all hover:text-yellow-300/80 py-1 px-1.5"
              >
                <Award className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Challenges</span>
              </TabsTrigger>
              <TabsTrigger
                value="live"
                className="text-white text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500/30 data-[state=active]:via-amber-500/20 data-[state=active]:to-yellow-500/30 data-[state=active]:text-yellow-200 data-[state=active]:border-yellow-400/50 data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/20 border border-transparent rounded transition-all hover:text-yellow-300/80 py-1 px-1.5"
              >
                <Activity className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Live Game</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-1">
              <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-1">
                {/* Left Column: Ranked Stats + Champion List */}
                <div className="space-y-1">
                  {/* Ranked Progress */}
                  <div className="rounded-lg border border-yellow-500/30 p-3 bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 hover:border-yellow-400/50 transition-all shadow-lg backdrop-blur-sm">
                    <h3 className="text-white text-base font-bold mb-2 flex items-center">
                      <Trophy className="h-4 w-4 mr-1.5 text-yellow-400" />
                      <span className="bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">Ranked Solo/Duo</span>
                    </h3>
                    {primaryRank ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">{getRankIcon(primaryRank.tier)}</span>
                            <div>
                              <div className="flex items-center gap-1">
                                <div className="text-white font-bold text-sm">
                                  {primaryRank.tier} {primaryRank.rank}
                                </div>
                                {/* Status flags */}
                                <div className="flex items-center gap-0.5">
                                  {primaryRank.hotStreak && (
                                    <span className="text-sm" title="Hot Streak">🔥</span>
                                  )}
                                  {primaryRank.veteran && (
                                    <span className="text-sm" title="Veteran">⭐</span>
                                  )}
                                  {primaryRank.freshBlood && (
                                    <span className="text-sm" title="Fresh Blood">🆕</span>
                                  )}
                                  {primaryRank.inactive && (
                                    <span className="text-sm text-red-400" title="Inactive">⚠️</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-yellow-400 font-semibold text-sm">{primaryRank.leaguePoints} LP</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold text-sm">
                              {primaryRank.wins}W {primaryRank.losses}L
                            </div>
                            <div className="text-white font-semibold text-sm">
                              {((primaryRank.wins / (primaryRank.wins + primaryRank.losses)) * 100).toFixed(1)}% WR
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${primaryRank.leaguePoints % 100}%` }}
                          ></div>
                        </div>
                        <div className="text-center text-white font-semibold text-sm">
                          {primaryRank.leaguePoints % 100} / 100 LP
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <Trophy className="h-8 w-8 mx-auto text-white/40 mb-1" />
                        <p className="text-white font-semibold text-sm">No ranked data</p>
                      </div>
                    )}
                  </div>

                  {/* Champion Statistics */}
                  <div className="rounded-lg border border-yellow-500/30 p-3 bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 hover:border-yellow-400/50 transition-all shadow-lg backdrop-blur-sm">
                    <h3 className="text-white text-base font-bold mb-2 flex items-center">
                      <Crown className="h-4 w-4 mr-1.5 text-yellow-400" />
                      <span className="bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">Champion Stats</span>
                    </h3>
                    <div className="space-y-2">
                      {(() => {
                        if (!account) return []
                        const championStats: Record<number, { name: string; games: number; wins: number; kills: number; deaths: number; assists: number }> = {}
                        matchDetails.forEach((match) => {
                          if (!match?.info?.participants) return
                          const participant = match.info.participants.find((p: MatchParticipant) => p?.puuid === account.puuid)
                          if (!participant) return
                          const champId = participant.championId
                          if (!championStats[champId]) {
                            championStats[champId] = {
                              name: participant.championName || `Champ_${champId}`,
                              games: 0,
                              wins: 0,
                              kills: 0,
                              deaths: 0,
                              assists: 0,
                            }
                          }
                          championStats[champId].games++
                          if (participant.win) championStats[champId].wins++
                          championStats[champId].kills += participant.kills || 0
                          championStats[champId].deaths += participant.deaths || 0
                          championStats[champId].assists += participant.assists || 0
                        })
                        const statsList = Object.entries(championStats)
                          .sort(([, a], [, b]) => b.games - a.games)
                          .slice(0, 7)
                        if (statsList.length === 0) return <div className="text-white/60 text-sm text-center py-2">No champion data</div>
                        return statsList.map(([champId, stats]) => {
                            const winRate = (stats.wins / stats.games) * 100
                            const avgKills = stats.kills / stats.games
                            const avgDeaths = stats.deaths / stats.games
                            const avgAssists = stats.assists / stats.games
                            const kda = avgDeaths > 0 ? (avgKills + avgAssists) / avgDeaths : avgKills + avgAssists
                            return (
                              <div
                                key={champId}
                                className="flex items-center justify-between p-2 rounded border border-yellow-500/10 hover:bg-slate-800/50 transition-colors"
                              >
                                <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                                  <div className="text-white font-bold text-sm truncate">{stats.name}</div>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                  <div className="text-white/80 font-semibold text-xs">
                                    {kda.toFixed(2)}:1
                                  </div>
                                  <div className="text-white/70 font-semibold text-xs">
                                    {avgKills.toFixed(1)}/{avgDeaths.toFixed(1)}/{avgAssists.toFixed(1)}
                                  </div>
                                  <div className={`font-bold text-xs ${winRate >= 55 ? "text-green-400" : winRate >= 45 ? "text-yellow-400" : "text-red-400"}`}>
                                    {winRate.toFixed(0)}%
                                  </div>
                                  <div className="text-white/60 font-semibold text-xs">{stats.games}G</div>
                                </div>
                              </div>
                            )
                          })
                      })()}
                    </div>
                  </div>
                </div>

                {/* Right Column: Recent Games */}
                <div className="space-y-1">
                  {/* Recent Games Summary */}
                  <div className="rounded-lg border border-yellow-500/30 p-3 bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 hover:border-yellow-400/50 transition-all shadow-lg backdrop-blur-sm">
                    <h3 className="text-white text-base font-bold mb-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1.5 text-green-400" />
                      <span className="bg-gradient-to-r from-white via-green-100 to-emerald-100 bg-clip-text text-transparent">Recent Games</span>
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded p-2.5 border border-yellow-500/20 bg-gradient-to-br from-slate-800/60 via-purple-900/15 to-slate-800/60 text-center">
                        <div className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">{totalGames}</div>
                        <div className="text-white/80 font-semibold text-xs">Games</div>
                      </div>
                      <div className="rounded p-2.5 border border-yellow-500/20 bg-gradient-to-br from-slate-800/60 via-purple-900/15 to-slate-800/60 text-center">
                        <div
                          className={`text-lg font-bold ${
                            winRate >= 60 
                              ? "bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent" 
                              : winRate >= 50 
                                ? "bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent" 
                                : "bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent"
                          }`}
                        >
                          {winRate.toFixed(1)}%
                        </div>
                        <div className="text-white/80 font-semibold text-xs">Win Rate</div>
                      </div>
                      <div className="rounded p-2.5 border border-green-500/20 bg-gradient-to-br from-slate-800/60 via-emerald-900/15 to-slate-800/60 text-center">
                        <div className="text-lg font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                          {recentForm.filter((win) => win).length}/{recentForm.length}
                        </div>
                        <div className="text-white/80 font-semibold text-xs">Recent</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Matches List */}
                  <div className="rounded-lg border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-yellow-500/10">
                      <h3 className="text-white text-sm font-bold">Recent Matches</h3>
                    </div>
                    <div className="p-2">
                      {matchDetails.length > 0 && account ? (
                        <div className="space-y-1">
                          {matchDetails.slice(0, 10).map((match, index) => {
                            if (!match?.info?.participants || !Array.isArray(match.info.participants)) return null
                            const participant = match.info.participants.find((p: MatchParticipant) => p && p.puuid === account.puuid)
                            if (!participant) return null
                            const kda = participant.deaths > 0 ? (participant.kills + participant.assists) / participant.deaths : participant.kills + participant.assists
                            const gameDuration = match.info.gameDuration
                            const minutes = Math.floor(gameDuration / 60)
                            const seconds = gameDuration % 60
                            const timeAgo = isClient ? Math.floor((Date.now() - match.info.gameCreation) / (1000 * 60 * 60)) : 0
                            return (
                              <div
                                key={index}
                                onClick={() => handleMatchClick(match)}
                                className={`flex items-center justify-between p-1.5 rounded border transition-colors cursor-pointer ${
                                  participant.win 
                                    ? 'border-l-2 border-l-green-500 border-yellow-500/10 bg-slate-800/30 hover:bg-slate-800/50' 
                                    : 'border-l-2 border-l-red-500 border-yellow-500/10 bg-slate-800/30 hover:bg-slate-800/50'
                                }`}
                              >
                                <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                                  <div className={`text-xs font-bold ${participant.win ? 'text-green-400' : 'text-red-400'}`}>
                                    {participant.win ? 'W' : 'L'}
                                  </div>
                                  <div className="text-white/80 font-semibold text-[10px] truncate">
                                    {participant.championName || 'Unknown'}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-[10px]">
                                  <div className="text-white font-bold">{participant.kills}/{participant.deaths}/{participant.assists}</div>
                                  <div className="text-white/70">{kda.toFixed(2)}</div>
                                  <div className="text-white/60">{timeAgo}h ago</div>
                                  <div className="text-white/60">{minutes}:{seconds.toString().padStart(2, '0')}</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <GamepadIcon className="h-8 w-8 mx-auto text-white/40 mb-1" />
                          <p className="text-white font-semibold text-xs">No matches</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* New Analytics Components */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                <ErrorBoundary>
                  {playerData.isLoading ? (
                    <LoadingCard className="rounded border border-yellow-500/20" />
                  ) : (
                    <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg p-2">
                      <PerformanceGraph 
                        data={analyticsData.trends} 
                        matchData={matchDetails}
                        playerPuuid={account.puuid}
                        className="rounded" 
                      />
                    </div>
                  )}
                </ErrorBoundary>

                <ErrorBoundary>
                  {playerData.isLoading ? (
                    <LoadingCard className="rounded border border-yellow-500/20" />
                  ) : (
                    <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg p-2">
                      <ChampionTierList championStats={analyticsData.championStats} className="rounded" />
                    </div>
                  )}
                </ErrorBoundary>
              </div>

              {/* Strengths & Weaknesses - Full Width */}
              <ErrorBoundary>
                {playerData.isLoading ? (
                  <LoadingCard className="rounded border border-yellow-500/20" />
                ) : (
                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg p-2">
                    <StrengthsWeaknessesAnalysis
                      matchData={matchDetails}
                      championStats={analyticsData.championStats}
                      playerPuuid={account.puuid}
                      className="rounded"
                    />
                  </div>
                )}
              </ErrorBoundary>

              {/* Death Location Map */}
              <ErrorBoundary>
                {playerData.isLoading ? (
                  <LoadingCard className="rounded border border-yellow-500/20" />
                ) : (
                  <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg p-2">
                    <DeathLocationMap matchData={matchDetails} playerPuuid={account.puuid} className="rounded" />
                  </div>
                )}
              </ErrorBoundary>
            </TabsContent>

            {/* Matches Tab */}
            <TabsContent value="matches" className="space-y-1">
              <MatchFilters
                filters={matchFilters}
                onFiltersChange={(newFilters) => {
                  setMatchFilters(newFilters)
                  setMatchesToShow(10) // Reset to show first 10 when filters change
                }}
                availableChampions={availableChampions}
              />

              <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg overflow-hidden">
                <div className="p-2 border-b border-yellow-500/10">
                  <h3 className="text-white text-sm font-bold">Recent Matches</h3>
                </div>
                <div className="p-2">
                  {(() => {
                    if (!account || matchDetails.length === 0) {
                      return (
                        <div className="text-center py-2">
                          <GamepadIcon className="h-8 w-8 mx-auto text-white/40 mb-1" />
                          <h3 className="text-sm font-bold text-white">No Recent Matches</h3>
                          <p className="text-white/80 font-semibold mt-1 text-xs">
                            This account has no recent match history.
                          </p>
                        </div>
                      )
                    }

                    // Filter matches
                    let filteredMatches = matchDetails.filter((match) => {
                      if (!match?.info?.participants || !Array.isArray(match.info.participants)) return false
                      const participant = match.info.participants.find(
                        (p: MatchParticipant) => p && p.puuid === account.puuid,
                      )
                      if (!participant) return false

                      // Queue type filter
                      if (matchFilters.queueType !== 'all') {
                        const queueId = match.info.queueId?.toString() || ''
                        if (queueId !== matchFilters.queueType) return false
                      }

                      // Champion filter
                      if (matchFilters.champion !== 'all') {
                        if (participant.championName !== matchFilters.champion) return false
                      }

                      // Result filter
                      if (matchFilters.result !== 'all') {
                        if (matchFilters.result === 'win' && !participant.win) return false
                        if (matchFilters.result === 'loss' && participant.win) return false
                      }

                      // Date range filter
                      if (matchFilters.dateRange !== 'all') {
                        const matchDate = new Date(match.info.gameCreation)
                        const now = Date.now()
                        const daysAgo = (now - matchDate.getTime()) / (1000 * 60 * 60 * 24)
                        
                        switch (matchFilters.dateRange) {
                          case '7d':
                            if (daysAgo > 7) return false
                            break
                          case '30d':
                            if (daysAgo > 30) return false
                            break
                          case '90d':
                            if (daysAgo > 90) return false
                            break
                          case 'season':
                            // For now, treat season as last 180 days
                            if (daysAgo > 180) return false
                            break
                        }
                      }

                      return true
                    })

                    // Sort matches
                    filteredMatches.sort((a, b) => {
                      if (!a?.info?.participants || !b?.info?.participants) return 0
                      const participantA = a.info.participants.find((p: MatchParticipant) => p?.puuid === account.puuid)
                      const participantB = b.info.participants.find((p: MatchParticipant) => p?.puuid === account.puuid)
                      if (!participantA || !participantB) return 0

                      let comparison = 0

                      switch (matchFilters.sortBy) {
                        case 'recent':
                          comparison = (b.info.gameCreation || 0) - (a.info.gameCreation || 0)
                          break
                        case 'kda':
                          const kdaA = participantA.deaths > 0 
                            ? (participantA.kills + participantA.assists) / participantA.deaths 
                            : participantA.kills + participantA.assists
                          const kdaB = participantB.deaths > 0 
                            ? (participantB.kills + participantB.assists) / participantB.deaths 
                            : participantB.kills + participantB.assists
                          comparison = kdaB - kdaA
                          break
                        case 'damage':
                          comparison = (participantB.totalDamageDealtToChampions || 0) - (participantA.totalDamageDealtToChampions || 0)
                          break
                        case 'duration':
                          comparison = (b.info.gameDuration || 0) - (a.info.gameDuration || 0)
                          break
                        case 'champion':
                          comparison = (participantA.championName || '').localeCompare(participantB.championName || '')
                          break
                      }

                      return matchFilters.sortOrder === 'asc' ? -comparison : comparison
                    })

                    const totalFiltered = filteredMatches.length
                    const matchesToDisplay = filteredMatches.slice(0, matchesToShow)
                    const hasMore = totalFiltered > matchesToShow
                    const remaining = totalFiltered - matchesToShow

                    return (
                      <>
                        <div className="space-y-0.5">
                          {matchesToDisplay.map((match, index) => {
                            const participant = match.info.participants.find(
                              (p: MatchParticipant) => p && p.puuid === account.puuid,
                            )
                            if (!participant) return null

                            return (
                              <CompactMatchCard
                                key={`${match.metadata?.matchId || index}-${index}`}
                                match={match}
                                participant={participant}
                                onMatchClick={() => handleMatchClick(match)}
                              />
                            )
                          })}
                        </div>
                        {hasMore && remaining > 0 && (
                          <div className="mt-4 pt-4 border-t border-yellow-500/30">
                            <Button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setMatchesToShow(prev => {
                                  const newValue = Math.min(prev + 10, totalFiltered)
                                  return newValue
                                })
                              }}
                              variant="ghost"
                              size="sm"
                              className="w-full text-white bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 border border-yellow-500/40 rounded-lg text-xs h-10 font-semibold shadow-lg hover:shadow-yellow-500/20 transition-all"
                            >
                              Load More ({remaining} remaining)
                            </Button>
                          </div>
                        )}
                        {totalFiltered === 0 && (
                          <div className="text-center py-2">
                            <GamepadIcon className="h-8 w-8 mx-auto text-white/40 mb-1" />
                            <h3 className="text-sm font-bold text-white">No Matches Found</h3>
                            <p className="text-white/80 font-semibold mt-1 text-xs">
                              No matches match your current filters.
                            </p>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            </TabsContent>

            {/* Champions Tab */}
            <TabsContent value="champions" className="space-y-1">
              <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg overflow-hidden">
                <div className="p-2 border-b border-yellow-500/10">
                  <h3 className="text-white text-base font-bold flex items-center">
                    <Crown className="h-4 w-4 mr-1.5 text-yellow-400" />
                    Champion Performance
                  </h3>
                </div>
                <div className="p-2">
                  {matchDetails.length > 0 ? (
                    <div className="space-y-1">
                      {(() => {
                        const championStats: Record<
                          number,
                          {
                            championId: number
                            championName: string
                            games: number
                            wins: number
                            kills: number
                            deaths: number
                            assists: number
                            totalDamage: number
                            goldEarned: number
                            multikills: number
                            recentForm: boolean[]
                            roles: string[]
                            lastPlayed: number
                          }
                        > = {}

                        matchDetails.forEach((match) => {
                          if (
                            !match ||
                            !match.info ||
                            !match.info.participants ||
                            !Array.isArray(match.info.participants)
                          )
                            return
                          const participant = match.info.participants.find(
                            (p: MatchParticipant) => p && p.puuid === account.puuid,
                          )
                          if (!participant) return

                          const champId = participant.championId
                          if (!championStats[champId]) {
                            championStats[champId] = {
                              championId: champId,
                              championName: participant.championName || `Champion_${champId}`,
                              games: 0,
                              wins: 0,
                              kills: 0,
                              deaths: 0,
                              assists: 0,
                              totalDamage: 0,
                              goldEarned: 0,
                              multikills: 0,
                              recentForm: [],
                              roles: [],
                              lastPlayed: 0,
                            }
                          }

                          championStats[champId].games++
                          if (participant.win) championStats[champId].wins++
                          championStats[champId].kills += participant.kills || 0
                          championStats[champId].deaths += participant.deaths || 0
                          championStats[champId].assists += participant.assists || 0
                          championStats[champId].totalDamage += participant.totalDamageDealtToChampions || 0
                          championStats[champId].goldEarned += participant.goldEarned || 0
                          championStats[champId].multikills +=
                            (participant.doubleKills || 0) +
                            (participant.tripleKills || 0) +
                            (participant.quadraKills || 0) +
                            (participant.pentaKills || 0)
                          championStats[champId].recentForm.push(participant.win)
                          championStats[champId].roles.push(participant.role || participant.teamPosition || "UNKNOWN")
                          championStats[champId].lastPlayed = Math.max(
                            championStats[champId].lastPlayed,
                            match.info.gameCreation,
                          )
                        })

                        const sortedChampions = Object.entries(championStats)
                          .sort(([, a], [, b]) => b.games - a.games)
                        
                        const totalChampions = sortedChampions.length
                        const championsToDisplay = sortedChampions.slice(0, championsToShow)
                        const hasMore = totalChampions > championsToShow
                        const remaining = totalChampions - championsToShow

                        return (
                          <>
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-0.5 items-center p-2.5 mb-2 bg-slate-800/50 rounded border border-yellow-500/20">
                              <div className="col-span-3">
                                <div className="text-white/80 font-semibold text-sm">Champion</div>
                              </div>
                              <div className="col-span-1 text-center">
                                <div className="text-white/80 font-semibold text-sm">Grade</div>
                              </div>
                              <div className="col-span-1 text-center">
                                <div className="text-white/80 font-semibold text-sm">Games</div>
                              </div>
                              <div className="col-span-1 text-center">
                                <div className="text-white/80 font-semibold text-sm">Win Rate</div>
                              </div>
                              <div className="col-span-1 text-center">
                                <div className="text-white/80 font-semibold text-sm">Form</div>
                              </div>
                              <div className="col-span-2 text-center">
                                <div className="text-white/80 font-semibold text-sm">KDA</div>
                              </div>
                              <div className="col-span-1 text-center">
                                <div className="text-white/80 font-semibold text-sm">Multi</div>
                              </div>
                              <div className="col-span-2 text-center">
                                <div className="text-white/80 font-semibold text-sm">Last Played</div>
                              </div>
                            </div>
                            
                            {/* Champion Rows */}
                            {championsToDisplay.map(([champId, stats]) => {
                            const winRate = (stats.wins / stats.games) * 100
                            const avgKills = stats.kills / stats.games
                            const avgDeaths = stats.deaths / stats.games
                            const avgAssists = stats.assists / stats.games
                            const kda = avgDeaths > 0 ? (avgKills + avgAssists) / avgDeaths : avgKills + avgAssists
                            const recentForm = stats.recentForm.slice(-5)
                            const mostCommonRole = stats.roles.reduce((a, b, i, arr) =>
                              arr.filter((v) => v === a).length >= arr.filter((v) => v === b).length ? a : b,
                            )

                            const getPerformanceGrade = (kda: number, winRate: number) => {
                              const score = kda * 0.4 + winRate * 0.6
                              if (score >= 80) return { grade: "S+", color: "text-purple-400" }
                              if (score >= 70) return { grade: "S", color: "text-yellow-400" }
                              if (score >= 60) return { grade: "A", color: "text-green-400" }
                              if (score >= 50) return { grade: "B", color: "text-blue-400" }
                              if (score >= 40) return { grade: "C", color: "text-orange-400" }
                              return { grade: "D", color: "text-red-400" }
                            }

                            const performance = getPerformanceGrade(kda, winRate)

                            return (
                              <div
                                key={champId}
                                className="grid grid-cols-12 gap-0.5 items-center p-2 hover:bg-slate-800/50 rounded transition-colors border border-yellow-500/10"
                              >
                                <div className="col-span-3 flex items-center space-x-1.5">
                                  {(() => {
                                    const { getChampionName } = require('@/lib/champions')
                                    const champName = stats.championName || getChampionName(parseInt(champId))
                                    return (
                                      <>
                                        <div className="w-8 h-8 bg-slate-700 rounded overflow-hidden border border-yellow-500/20">
                                          <img
                                            src={`https://ddragon.leagueoflegends.com/cdn/14.19.1/img/champion/${champName}.png`}
                                            alt={champName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement
                                              target.style.display = "none"
                                              const parent = target.parentElement
                                              if (parent) {
                                                parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">${champName.slice(0, 2).toUpperCase()}</div>`
                                              }
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <div className="text-white font-bold text-sm">{champName}</div>
                                          <div className="text-xs text-white/70 font-semibold">{mostCommonRole}</div>
                                        </div>
                                      </>
                                    )
                                  })()}
                                </div>

                                <div className="col-span-1 text-center">
                                  <div
                                    className={`inline-flex items-center justify-center w-6 h-6 rounded font-bold text-xs ${performance.color} bg-slate-800`}
                                  >
                                    {performance.grade}
                                  </div>
                                </div>

                                <div className="col-span-1 text-center">
                                  <div className="text-white font-bold text-sm">{stats.games}</div>
                                </div>

                                <div className="col-span-1 text-center">
                                  <div
                                    className={`font-bold text-sm ${
                                      winRate >= 65
                                        ? "text-green-400"
                                        : winRate >= 55
                                          ? "text-yellow-400"
                                          : winRate >= 45
                                            ? "text-orange-400"
                                            : "text-red-400"
                                    }`}
                                  >
                                    {winRate.toFixed(1)}%
                                  </div>
                                </div>

                                <div className="col-span-1 text-center">
                                  <div className="flex justify-center gap-0.5">
                                    {recentForm.map((win, idx) => (
                                      <div
                                        key={idx}
                                        className={`w-1.5 h-1.5 rounded-full ${win ? "bg-green-500" : "bg-red-500"}`}
                                      />
                                    ))}
                                  </div>
                                </div>

                                <div className="col-span-2 text-center">
                                  <div className="text-white font-bold text-sm">
                                    {avgKills.toFixed(1)}/{avgDeaths.toFixed(1)}/{avgAssists.toFixed(1)}
                                  </div>
                                  <div className="text-xs text-white/70 font-semibold">{kda.toFixed(2)} KDA</div>
                                </div>

                                <div className="col-span-1 text-center">
                                  <div className="text-white font-bold text-sm">{stats.multikills}</div>
                                </div>

                                <div className="col-span-2 text-center">
                                  <div className="text-xs text-white/70 font-semibold">
                                    {isClient ? Math.floor((Date.now() - stats.lastPlayed) / (1000 * 60 * 60 * 24)) : 0}
                                    d ago
                                  </div>
                                </div>
                              </div>
                            )
                            })}
                            
                            {/* Load More Button */}
                            {hasMore && remaining > 0 && (
                              <div className="mt-2 pt-2 border-t border-yellow-500/30">
                                <Button
                                  onClick={() => setChampionsToShow(prev => Math.min(prev + 10, totalChampions))}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full text-white bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 border border-yellow-500/40 rounded-lg text-xs h-9 font-semibold shadow-lg hover:shadow-yellow-500/20 transition-all"
                                >
                                  Load More ({remaining} remaining)
                                </Button>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <Crown className="h-8 w-8 mx-auto text-white/40 mb-1" />
                      <h3 className="text-sm font-bold text-white">No Champion Data</h3>
                      <p className="text-white/80 font-semibold mt-1 text-xs">
                        Play some matches to see champion analytics here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Mastery Tab */}
            <TabsContent value="mastery" className="space-y-1">
              <div className="rounded border border-yellow-500/20 p-2 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white text-base font-bold flex items-center">
                    <Trophy className="h-4 w-4 mr-1.5 text-yellow-400" />
                    Champion Mastery
                  </h3>
                  {totalMasteryScore !== null && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 rounded">
                      <span className="text-white/70 text-xs">Total Score:</span>
                      <span className="text-yellow-400 font-bold text-sm">{totalMasteryScore.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                {championMastery.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                    {championMastery.slice(0, 30).map((mastery, index) => {
                      const { getChampionName } = require('@/lib/champions')
                      const champName = mastery.championName || getChampionName(mastery.championId)
                      const pointsToNext = mastery.championPointsUntilNextLevel || 0
                      const pointsSinceLast = mastery.championPointsSinceLastLevel || 0
                      const totalPointsForLevel = pointsToNext + pointsSinceLast
                      const progressPercent =
                        totalPointsForLevel > 0 ? (pointsSinceLast / totalPointsForLevel) * 100 : 0

                      const lastPlayed = mastery.lastPlayTime ? new Date(mastery.lastPlayTime) : null
                      const daysAgo =
                        lastPlayed && isClient
                          ? Math.floor((Date.now() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24))
                          : null

                      return (
                        <div
                          key={index}
                          className="hover:bg-slate-800/50 rounded p-3 border border-yellow-500/10 transition-colors"
                        >
                          <div className="flex items-center space-x-1.5 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded flex items-center justify-center text-white font-bold text-sm">
                              {mastery.championId.toString().slice(-2)}
                            </div>
                            <div className="flex-1">
                              <div className="text-white font-bold text-sm">{champName}</div>
                              <div className="flex items-center space-x-1 mt-0.5">
                                <div
                                  className={`inline-block px-2 py-1 rounded text-xs font-bold text-white ${
                                    mastery.championLevel >= 7
                                      ? "bg-purple-600"
                                      : mastery.championLevel >= 5
                                        ? "bg-blue-600"
                                        : mastery.championLevel >= 3
                                          ? "bg-green-600"
                                          : "bg-slate-600"
                                  }`}
                                >
                                  M{mastery.championLevel}
                                </div>
                                {mastery.chestGranted && <div className="text-xs">📦</div>}
                              </div>
                            </div>
                          </div>

                          {mastery.championLevel < 7 && (
                            <div className="mb-2">
                              <div className="flex justify-between text-xs text-white/70 mb-1">
                                <span>L{mastery.championLevel + 1}</span>
                                <span>
                                  {pointsSinceLast.toLocaleString()}/{totalPointsForLevel.toLocaleString()}
                                </span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1">
                                <div
                                  className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${progressPercent}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-2 text-sm">
                            {mastery.championSeasonMilestone && (
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-white/50 text-xs">Season Milestone:</span>
                                <Badge className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-0 border border-yellow-500/30">
                                  {mastery.championSeasonMilestone}
                                </Badge>
                              </div>
                            )}
                            {mastery.milestoneGrades && mastery.milestoneGrades.length > 0 && (
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-white/50 text-xs">Grades:</span>
                                {mastery.milestoneGrades.map((grade: string, idx: number) => (
                                  <Badge key={idx} className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-0 border border-yellow-500/30">
                                    {grade}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {mastery.nextSeasonMilestone && (
                              <div className="text-white/40 text-xs mb-1">
                                Next milestone: {mastery.nextSeasonMilestone.totalGamesRequires || 0} games
                                {mastery.nextSeasonMilestone.rewardMarks && (
                                  <span className="ml-1">• {mastery.nextSeasonMilestone.rewardMarks} marks</span>
                                )}
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 font-semibold text-xs">Points</span>
                              <span className="text-white font-bold text-sm">{mastery.championPoints.toLocaleString()}</span>
                            </div>

                            {mastery.tokensEarned > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-white/70 font-semibold text-xs">Tokens</span>
                                <span className="text-yellow-400 font-bold text-sm">🏆 {mastery.tokensEarned}</span>
                              </div>
                            )}

                            {daysAgo !== null && (
                              <div className="flex justify-between items-center">
                                <span className="text-white/70 font-semibold text-xs">Last</span>
                                <span className="text-white font-semibold text-xs">
                                  {daysAgo === 0 ? "Today" : daysAgo === 1 ? "1d" : `${daysAgo}d`}
                                </span>
                              </div>
                            )}

                            {mastery.championLevel >= 7 && (
                              <div className="text-center pt-1">
                                <div className="text-xs text-yellow-400 font-bold">🎉 MAX</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <Trophy className="h-8 w-8 mx-auto text-white/40 mb-1" />
                    <h3 className="text-sm font-bold text-white">No Mastery Data</h3>
                    <p className="text-white/80 font-semibold mt-1 text-xs">
                      Play some champions to see mastery progress here.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Challenges Tab */}
            <TabsContent value="challenges" className="space-y-1">
              {isChallengeLoading ? (
                <div className="text-center py-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-1"></div>
                  <p className="text-white font-semibold text-xs">Loading challenge data...</p>
                </div>
              ) : challengeError ? (
                <div className="text-center py-2 rounded border border-yellow-500/20 bg-slate-900/80 p-2">
                  <Award className="h-8 w-8 mx-auto text-white/40 mb-1" />
                  <h3 className="text-sm font-bold text-white">Challenges Unavailable</h3>
                  <p className="text-white/80 font-semibold mt-1 text-xs">{challengeError}</p>
                </div>
              ) : challengeData ? (
                <div className="space-y-1">
                  <ChallengeTracker challengeData={challengeData} />
                  <AchievementTimeline challenges={challengeData.challenges || []} />
                  <CategoryProgress challengeData={challengeData} />
                </div>
              ) : (
                <div className="text-center py-2 rounded border border-yellow-500/20 bg-slate-900/80 p-2">
                  <Award className="h-8 w-8 mx-auto text-white/40 mb-1" />
                  <h3 className="text-sm font-bold text-white">No Challenge Data</h3>
                  <p className="text-white/80 font-semibold mt-1 text-xs">
                    Challenge data is not available for this player.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Live Game Tab */}
            <TabsContent value="live" className="space-y-1">
              {isLiveGameLoading ? (
                <div className="text-center py-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-1"></div>
                  <p className="text-white font-semibold text-xs">Checking for live game...</p>
                </div>
              ) : liveGameError ? (
                <div className="text-center py-2 rounded border border-yellow-500/20 bg-slate-900/80 p-2">
                  <Activity className="h-8 w-8 mx-auto text-white/40 mb-1" />
                  <h3 className="text-sm font-bold text-white">Live Game Unavailable</h3>
                  <p className="text-white/80 font-semibold mt-1 text-xs">{liveGameError}</p>
                </div>
              ) : isInGame && liveGameData ? (
                <LiveGameDashboard
                  liveGameData={liveGameData}
                  playerPuuid={account.puuid}
                  isLoading={isLiveGameLoading}
                  onRefresh={fetchLiveGame}
                />
              ) : (
                <div className="text-center py-2 rounded border border-yellow-500/20 bg-slate-900/80 p-2">
                  <Activity className="h-8 w-8 mx-auto text-white/40 mb-1" />
                  <h3 className="text-sm font-bold text-white">Not In Game</h3>
                  <p className="text-white/80 font-semibold mt-1 text-xs">
                    This player is not currently in a live game.
                  </p>
                  <Button onClick={handleRefresh} className="mt-1 text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Check Again
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Match Detail Popup */}
        {selectedMatch && (
          <MatchDetailPopup
            match={selectedMatch}
            playerPuuid={account.puuid}
            isOpen={isMatchPopupOpen}
            onClose={() => setIsMatchPopupOpen(false)}
          />
        )}

        {/* Floating AI Assistant */}
        {aggregatedAIData && account && <FloatingAssistant playerData={aggregatedAIData} playerPuuid={account.puuid} />}
      </div>
    </div>
  )
}

function PlayerDashboardPage() {
  return <PlayerDashboard />
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlayerDashboardPage />
    </Suspense>
  )
}

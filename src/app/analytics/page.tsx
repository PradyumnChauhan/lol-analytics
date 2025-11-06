'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Trophy, Star, TrendingUp, RefreshCw, Target, BarChart3, Activity } from 'lucide-react';
import { WinRateChart } from '@/components/charts/WinRateChart';
import { KDAChart } from '@/components/charts/KDAChart';
import { ChampionAnalysis } from '@/components/analytics/ChampionAnalysis';
import { DetailedMatchHistory } from '@/components/analytics/DetailedMatchHistory';
import { RankedProgression } from '@/components/analytics/RankedProgression';
import { NoMatchAnalytics } from '@/components/analytics/NoMatchAnalytics';

interface SummonerData {
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
  revisionDate: number;
  id: string;
  accountId: string;
  name?: string;
}

interface LeagueEntry {
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  queueType: string;
}

interface LeagueData {
  soloQueue: LeagueEntry | null;
  flexQueue: LeagueEntry | null;
  all: LeagueEntry[];
}

interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  tokensEarned: number;
}

interface MatchParticipant {
  puuid: string;
  championId: number;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  totalDamageDealtToChampions: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  goldEarned: number;
  visionScore: number;
  win: boolean;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  summoner1Id: number;
  summoner2Id: number;
  teamPosition: string;
  lane: string;
  role: string;
  perks: {
    styles: Array<{
      selections: Array<{
        perk: number;
      }>;
    }>;
  };
}

interface Match {
  metadata: {
    matchId: string;
  };
  info: {
    participants: MatchParticipant[];
    gameDuration: number;
    gameCreation: number;
    gameMode: string;
    queueId: number;
  };
}

interface MatchData {
  matchIds: string[];
  matches: Match[];
  totalMatches: number;
  fetchedMatches: number;
}

function CompleteAnalyticsPageContent() {
  const searchParams = useSearchParams();
  const puuid = searchParams.get('puuid');
  const region = searchParams.get('region') || 'br1';
  
  const [summonerData, setSummonerData] = useState<SummonerData | null>(null);
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [championMastery, setChampionMastery] = useState<ChampionMastery[]>([]);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    if (!puuid) return;
    
    setLoading(true);
    setError(null);

    try {
      console.log(`🚀 Starting comprehensive data fetch for PUUID: ${puuid.substring(0, 20)}... in ${region}`);
      
      // Reset all data first
      setSummonerData(null);
      setLeagueData(null);
      setChampionMastery([]);
      setMatchData(null);
      
      // 1. Fetch basic summoner data
      console.log('📊 Step 1: Fetching summoner profile...');
      const summonerResponse = await fetch(`/api/summoner/by-puuid?puuid=${encodeURIComponent(puuid)}&region=${region}`);
      if (summonerResponse.ok) {
        const summoner = await summonerResponse.json();
        setSummonerData(summoner);
        console.log('✅ Summoner data loaded:', {
          level: summoner.summonerLevel,
          profileIcon: summoner.profileIconId,
          name: summoner.name || 'No name available'
        });

        // 2. Fetch league/ranked data using summoner ID
        if (summoner.id) {
          console.log('📊 Step 2: Fetching ranked statistics...');
          try {
            const leagueResponse = await fetch(`/api/league?summonerId=${encodeURIComponent(summoner.id)}&region=${region}`);
            if (leagueResponse.ok) {
              const league = await leagueResponse.json();
              setLeagueData(league);
              console.log('✅ League data loaded:', {
                soloQueue: league.soloQueue ? `${league.soloQueue.tier} ${league.soloQueue.rank}` : 'Unranked',
                flexQueue: league.flexQueue ? `${league.flexQueue.tier} ${league.flexQueue.rank}` : 'Unranked',
                totalQueues: league.all?.length || 0
              });
            } else {
              const leagueError = await leagueResponse.text();
              console.log('⚠️ League data not available:', leagueResponse.status, leagueError);
            }
          } catch (err) {
            console.log('⚠️ League API error:', err);
          }
        } else {
          console.log('⚠️ No summoner ID available for league lookup');
        }
      } else {
        const summonerError = await summonerResponse.text();
        console.error('❌ Failed to fetch summoner data:', summonerResponse.status, summonerError);
        throw new Error(`Failed to fetch summoner data: ${summonerResponse.status}`);
      }

      // 3. Fetch champion mastery data
      console.log('📊 Step 3: Fetching champion mastery...');
      try {
        const masteryResponse = await fetch(`/api/champion-mastery?puuid=${encodeURIComponent(puuid)}&region=${region}`);
        if (masteryResponse.ok) {
          const mastery = await masteryResponse.json();
          setChampionMastery(mastery.slice(0, 15)); // Top 15 champions for more data
          console.log('✅ Champion mastery loaded:', {
            totalChampions: mastery.length,
            topLevel: mastery[0]?.championLevel || 0,
            topPoints: mastery[0]?.championPoints || 0
          });
        } else {
          const masteryError = await masteryResponse.text();
          console.log('⚠️ Champion mastery not available:', masteryResponse.status, masteryError);
        }
      } catch (err) {
        console.log('⚠️ Champion mastery API error:', err);
      }

      // 4. Fetch comprehensive match history (with 403 handling)
      console.log('📊 Step 4: Fetching detailed match history...');
      try {
        const matchResponse = await fetch(`/api/matches?puuid=${encodeURIComponent(puuid)}&region=${region}&count=25`);
        if (matchResponse.ok) {
          const matches = await matchResponse.json();
          setMatchData(matches);
          console.log('✅ Match data loaded:', {
            totalMatchIds: matches.totalMatches,
            fetchedDetails: matches.fetchedMatches,
            firstMatch: matches.matches[0] ? {
              id: matches.matches[0].metadata.matchId,
              duration: matches.matches[0].info.gameDuration,
              participants: matches.matches[0].info.participants.length
            } : 'No match details'
          });
          
          // Log some match participant data to verify structure
          if (matches.matches[0]) {
            const playerData = matches.matches[0].info.participants.find((p: MatchParticipant) => p.puuid === puuid);
            console.log('🔍 Sample player match data:', {
              champion: playerData?.championId,
              kda: `${playerData?.kills}/${playerData?.deaths}/${playerData?.assists}`,
              damage: playerData?.totalDamageDealtToChampions,
              gold: playerData?.goldEarned,
              items: [playerData?.item0, playerData?.item1, playerData?.item2].filter(Boolean)
            });
          }
        } else {
          const matchError = await matchResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.log('⚠️ Match data not available:', matchResponse.status, matchError);
          
          if (matchResponse.status === 403) {
            console.log('🚫 API key does not have access to Match-V5 endpoints');
            console.log('📊 Analytics will work with available data (Summoner + Mastery + League)');
          }
        }
      } catch (err) {
        console.log('⚠️ Match API error:', err);
      }

      console.log('🎉 Data fetching completed successfully!');

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error('❌ Failed to fetch analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (puuid) {
      fetchAllData();
    }
  }, [puuid, region]); // eslint-disable-line react-hooks/exhaustive-deps



  if (!puuid) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No PUUID provided. Please use the Player Search to navigate here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Complete Player Analytics</h1>
            <p className="text-slate-400 mt-2">
              Region: {region.toUpperCase()} • PUUID: {puuid.substring(0, 20)}...
            </p>
          </div>
          <Button
            onClick={fetchAllData}
            disabled={loading}
            variant="outline"
            className="border-slate-600 text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh All Data'}
          </Button>
        </div>

        {error && (
          <Card className="bg-red-900/20 border-red-700">
            <CardContent className="pt-6">
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading comprehensive analytics data...</p>
            </CardContent>
          </Card>
        )}

        {/* Summoner Overview */}
        {summonerData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="w-16 h-16 bg-slate-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <User className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-sm text-slate-400">Profile Icon</p>
                <p className="text-lg font-semibold text-white">{summonerData.profileIconId}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Summoner Level</p>
                <p className="text-2xl font-bold text-white">{summonerData.summonerLevel}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Last Updated</p>
                <p className="text-sm text-white">
                  {new Date(summonerData.revisionDate).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Total Matches</p>
                <p className="text-2xl font-bold text-white">
                  {matchData?.totalMatches || 0}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Advanced Ranked Analytics */}
        {leagueData && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span>Advanced Ranked Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RankedProgression leagueData={leagueData} />
            </CardContent>
          </Card>
        )}

        {/* Champion Mastery */}
        {championMastery.length > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Star className="h-5 w-5 text-purple-500" />
                <span>Champion Mastery (Top 10)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left py-2 text-slate-400">Champion</th>
                      <th className="text-center py-2 text-slate-400">Level</th>
                      <th className="text-center py-2 text-slate-400">Points</th>
                      <th className="text-center py-2 text-slate-400">Chest</th>
                      <th className="text-center py-2 text-slate-400">Last Played</th>
                    </tr>
                  </thead>
                  <tbody>
                    {championMastery.map((mastery) => (
                      <tr key={mastery.championId} className="border-b border-slate-700">
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-slate-600 rounded flex items-center justify-center">
                              <span className="text-xs text-white">{mastery.championId}</span>
                            </div>
                            <span className="text-white">Champion {mastery.championId}</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <Badge variant="outline" className="border-purple-500 text-purple-400">
                            {mastery.championLevel}
                          </Badge>
                        </td>
                        <td className="text-center text-white font-mono">
                          {mastery.championPoints.toLocaleString()}
                        </td>
                        <td className="text-center">
                          {mastery.chestGranted ? (
                            <span className="text-green-400">✓</span>
                          ) : (
                            <span className="text-slate-500">✗</span>
                          )}
                        </td>
                        <td className="text-center text-slate-400 text-xs">
                          {new Date(mastery.lastPlayTime).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conditional Analytics: With or Without Match Data */}
        {matchData && matchData.matches.length > 0 ? (
          <>
            {/* Performance Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span>Win Rate Trend (Last 20 Games)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WinRateChart matches={matchData.matches} puuid={puuid} />
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    <span>KDA Performance (Last 15 Games)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <KDAChart matches={matchData.matches} puuid={puuid} />
                </CardContent>
              </Card>
            </div>

            {/* Champion Performance Analysis */}
            {championMastery.length > 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    <span>Champion Performance Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChampionAnalysis 
                    matches={matchData.matches} 
                    masteries={championMastery} 
                    puuid={puuid} 
                  />
                </CardContent>
              </Card>
            )}

            {/* Detailed Match History */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span>Detailed Match History ({matchData.fetchedMatches} matches)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DetailedMatchHistory matches={matchData.matches} puuid={puuid} />
              </CardContent>
            </Card>
          </>
        ) : (
          /* Alternative Analytics Without Match Data */
          <NoMatchAnalytics 
            championMastery={championMastery}
            leagueData={leagueData}
            summonerLevel={summonerData?.summonerLevel || 0}
          />
        )}

        {/* Comprehensive Data Status */}
        <Card className="bg-blue-900/20 border-blue-700">
          <CardHeader>
            <CardTitle className="text-blue-300">🎯 Complete Analytics Data Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-blue-300 mb-3">✅ Core Data Sources</h4>
                <div className="space-y-2">
                  <div className={`flex items-center space-x-2 ${summonerData ? 'text-green-400' : 'text-red-400'}`}>
                    <span>{summonerData ? '✓' : '✗'}</span>
                    <span>Summoner Profile (Level {summonerData?.summonerLevel || 'N/A'})</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${leagueData ? 'text-green-400' : 'text-yellow-400'}`}>
                    <span>{leagueData ? '✓' : '~'}</span>
                    <span>Ranked Data ({leagueData?.all?.length || 0} queues)</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${championMastery.length > 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                    <span>{championMastery.length > 0 ? '✓' : '~'}</span>
                    <span>Champion Mastery ({championMastery.length} champions)</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${matchData?.matches.length ? 'text-green-400' : 'text-red-400'}`}>
                    <span>{matchData?.matches.length ? '✓' : '✗'}</span>
                    <span>Match History ({matchData?.fetchedMatches || 0} detailed matches)</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-300 mb-3">📊 Analytics Components</h4>
                <div className="space-y-2">
                  <div className={`flex items-center space-x-2 ${matchData?.matches.length ? 'text-green-400' : 'text-gray-400'}`}>
                    <span>{matchData?.matches.length ? '✓' : '○'}</span>
                    <span>Win Rate Chart ({matchData?.matches.length || 0} games)</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${matchData?.matches.length ? 'text-green-400' : 'text-gray-400'}`}>
                    <span>{matchData?.matches.length ? '✓' : '○'}</span>
                    <span>KDA Performance Chart</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${matchData?.matches.length && championMastery.length ? 'text-green-400' : 'text-gray-400'}`}>
                    <span>{matchData?.matches.length && championMastery.length ? '✓' : '○'}</span>
                    <span>Champion Analysis Table</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${matchData?.matches.length ? 'text-green-400' : 'text-gray-400'}`}>
                    <span>{matchData?.matches.length ? '✓' : '○'}</span>
                    <span>Detailed Match History</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${leagueData ? 'text-green-400' : 'text-gray-400'}`}>
                    <span>{leagueData ? '✓' : '○'}</span>
                    <span>Ranked Progression</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-300 mb-3">� Data Insights</h4>
                <div className="space-y-2 text-blue-200">
                  {matchData && matchData.matches.length > 0 && (
                    <>
                      <div>• {matchData.matches.length} recent matches analyzed</div>
                      <div>• Win rate tracking over time</div>
                      <div>• Champion performance metrics</div>
                      <div>• KDA progression analysis</div>
                      <div>• Damage and gold efficiency</div>
                    </>
                  )}
                  {leagueData && (
                    <>
                      <div>• Ranked progression tracking</div>
                      <div>• LP gain/loss analysis</div>
                      <div>• Queue performance comparison</div>
                    </>
                  )}
                  {championMastery.length > 0 && (
                    <>
                      <div>• Champion mastery correlation</div>
                      <div>• Performance by champion played</div>
                    </>
                  )}
                  {(!matchData || matchData.matches.length === 0) && (
                    <div className="text-yellow-400">• Limited insights without match data</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Debug Information */}
            <div className="mt-6 pt-4 border-t border-blue-800">
              <h5 className="text-blue-300 font-medium mb-2">🐛 Debug Information</h5>
              <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <div className="text-slate-400">PUUID:</div>
                  <div className="text-blue-200 break-all">{puuid?.substring(0, 30)}...</div>
                </div>
                <div>
                  <div className="text-slate-400">Region:</div>
                  <div className="text-blue-200">{region?.toUpperCase()}</div>
                </div>
                <div>
                  <div className="text-slate-400">Match API Status:</div>
                  <div className="text-blue-200">
                    {matchData ? `${matchData.fetchedMatches}/${matchData.totalMatches} matches` : 'Not loaded'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Last Fetch:</div>
                  <div className="text-blue-200">{new Date().toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CompleteAnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading analytics...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <CompleteAnalyticsPageContent />
    </Suspense>
  );
}
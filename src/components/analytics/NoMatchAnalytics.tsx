'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Crown, Target, TrendingUp } from 'lucide-react';

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

interface NoMatchAnalyticsProps {
  championMastery: ChampionMastery[];
  leagueData: LeagueData | null;
  summonerLevel: number;
}

export function NoMatchAnalytics({ championMastery, leagueData, summonerLevel }: NoMatchAnalyticsProps) {
  const getMasteryColor = (level: number) => {
    if (level >= 7) return 'bg-purple-600';
    if (level >= 6) return 'bg-purple-500';
    if (level >= 5) return 'bg-blue-500';
    if (level >= 4) return 'bg-blue-400';
    return 'bg-gray-500';
  };

  const getRankColor = (tier: string) => {
    const colors: Record<string, string> = {
      IRON: 'from-gray-600 to-gray-700',
      BRONZE: 'from-amber-600 to-amber-700',
      SILVER: 'from-gray-400 to-gray-500',
      GOLD: 'from-yellow-500 to-yellow-600',
      PLATINUM: 'from-cyan-500 to-cyan-600',
      EMERALD: 'from-green-500 to-green-600',
      DIAMOND: 'from-blue-500 to-blue-600',
      MASTER: 'from-purple-600 to-purple-700',
      GRANDMASTER: 'from-red-600 to-red-700',
      CHALLENGER: 'from-yellow-400 to-yellow-500',
    };
    return colors[tier] || 'from-gray-500 to-gray-600';
  };

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    return total === 0 ? 0 : Math.round((wins / total) * 100);
  };

  const totalMasteryPoints = championMastery.reduce((sum, champ) => sum + champ.championPoints, 0);
  const averageMasteryLevel = championMastery.length > 0 
    ? championMastery.reduce((sum, champ) => sum + champ.championLevel, 0) / championMastery.length 
    : 0;
  const level7Champions = championMastery.filter(champ => champ.championLevel === 7).length;
  const chestsEarned = championMastery.filter(champ => champ.chestGranted).length;

  return (
    <div className="space-y-6">
      {/* Player Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{summonerLevel}</p>
            <p className="text-sm text-slate-400">Summoner Level</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{totalMasteryPoints.toLocaleString()}</p>
            <p className="text-sm text-slate-400">Total Mastery</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <Crown className="h-8 w-8 text-gold-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{level7Champions}</p>
            <p className="text-sm text-slate-400">Mastery 7</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{chestsEarned}</p>
            <p className="text-sm text-slate-400">Chests Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Ranked Statistics */}
      {leagueData && (leagueData.soloQueue || leagueData.flexQueue) && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>Comprehensive Ranked Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {leagueData.soloQueue && (
                <div className={`bg-gradient-to-r ${getRankColor(leagueData.soloQueue.tier)} rounded-lg p-6`}>
                  <div className="text-center mb-4">
                    <h3 className="text-white text-xl font-bold">Solo/Duo Queue</h3>
                    <div className="text-white text-3xl font-bold mt-2">
                      {leagueData.soloQueue.tier} {leagueData.soloQueue.rank}
                    </div>
                    <div className="text-white text-lg">
                      {leagueData.soloQueue.leaguePoints} LP
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-white text-2xl font-bold">
                        {getWinRate(leagueData.soloQueue.wins, leagueData.soloQueue.losses)}%
                      </div>
                      <div className="text-white/80 text-sm">Win Rate</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-white text-2xl font-bold">
                        {leagueData.soloQueue.wins + leagueData.soloQueue.losses}
                      </div>
                      <div className="text-white/80 text-sm">Games</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-green-300 text-lg font-bold">
                        {leagueData.soloQueue.wins}W
                      </div>
                      <div className="text-red-300 text-lg font-bold">
                        {leagueData.soloQueue.losses}L
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {leagueData.flexQueue && (
                <div className={`bg-gradient-to-r ${getRankColor(leagueData.flexQueue.tier)} rounded-lg p-6`}>
                  <div className="text-center mb-4">
                    <h3 className="text-white text-xl font-bold">Flex Queue</h3>
                    <div className="text-white text-3xl font-bold mt-2">
                      {leagueData.flexQueue.tier} {leagueData.flexQueue.rank}
                    </div>
                    <div className="text-white text-lg">
                      {leagueData.flexQueue.leaguePoints} LP
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-white text-2xl font-bold">
                        {getWinRate(leagueData.flexQueue.wins, leagueData.flexQueue.losses)}%
                      </div>
                      <div className="text-white/80 text-sm">Win Rate</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-white text-2xl font-bold">
                        {leagueData.flexQueue.wins + leagueData.flexQueue.losses}
                      </div>
                      <div className="text-white/80 text-sm">Games</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-green-300 text-lg font-bold">
                        {leagueData.flexQueue.wins}W
                      </div>
                      <div className="text-red-300 text-lg font-bold">
                        {leagueData.flexQueue.losses}L
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ranked Comparison */}
            {leagueData.soloQueue && leagueData.flexQueue && (
              <div className="mt-6 p-4 bg-slate-700 rounded-lg">
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Queue Performance Comparison
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-slate-400 mb-1">Higher Rank</div>
                    <div className="text-white font-semibold">
                      {leagueData.soloQueue.leaguePoints > leagueData.flexQueue.leaguePoints ? 'Solo/Duo' : 
                       leagueData.flexQueue.leaguePoints > leagueData.soloQueue.leaguePoints ? 'Flex' : 'Equal'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Better Win Rate</div>
                    <div className="text-white font-semibold">
                      {getWinRate(leagueData.soloQueue.wins, leagueData.soloQueue.losses) > 
                       getWinRate(leagueData.flexQueue.wins, leagueData.flexQueue.losses) ? 'Solo/Duo' : 
                       getWinRate(leagueData.flexQueue.wins, leagueData.flexQueue.losses) > 
                       getWinRate(leagueData.soloQueue.wins, leagueData.soloQueue.losses) ? 'Flex' : 'Equal'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">More Active</div>
                    <div className="text-white font-semibold">
                      {(leagueData.soloQueue.wins + leagueData.soloQueue.losses) > 
                       (leagueData.flexQueue.wins + leagueData.flexQueue.losses) ? 'Solo/Duo' : 
                       (leagueData.flexQueue.wins + leagueData.flexQueue.losses) > 
                       (leagueData.soloQueue.wins + leagueData.soloQueue.losses) ? 'Flex' : 'Equal'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Advanced Champion Mastery Analysis */}
      {championMastery.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Star className="h-5 w-5 text-purple-500" />
              <span>Advanced Champion Mastery Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mastery Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{championMastery.length}</div>
                <div className="text-sm text-slate-400">Champions Played</div>
              </div>
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{averageMasteryLevel.toFixed(1)}</div>
                <div className="text-sm text-slate-400">Avg Mastery Level</div>
              </div>
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{chestsEarned}</div>
                <div className="text-sm text-slate-400">Season Chests</div>
              </div>
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {Math.round((chestsEarned / championMastery.length) * 100)}%
                </div>
                <div className="text-sm text-slate-400">Chest Rate</div>
              </div>
            </div>

            {/* Top Champions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 text-slate-400">Champion</th>
                    <th className="text-center py-3 text-slate-400">Mastery</th>
                    <th className="text-center py-3 text-slate-400">Points</th>
                    <th className="text-center py-3 text-slate-400">Progress</th>
                    <th className="text-center py-3 text-slate-400">Chest</th>
                    <th className="text-center py-3 text-slate-400">Last Played</th>
                  </tr>
                </thead>
                <tbody>
                  {championMastery.slice(0, 12).map((mastery, index) => (
                    <tr key={mastery.championId} className="border-b border-slate-700 hover:bg-slate-800/50">
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-white font-semibold">{mastery.championId}</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">Champion {mastery.championId}</p>
                            <p className="text-slate-400 text-xs">Rank #{index + 1}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="text-center">
                        <Badge className={`${getMasteryColor(mastery.championLevel)} text-white`}>
                          Level {mastery.championLevel}
                        </Badge>
                      </td>
                      
                      <td className="text-center">
                        <div className="text-white font-mono font-semibold">
                          {mastery.championPoints.toLocaleString()}
                        </div>
                      </td>
                      
                      <td className="text-center">
                        {mastery.championLevel < 7 ? (
                          <div className="text-xs">
                            <div className="text-slate-400">{mastery.championPointsUntilNextLevel} to next</div>
                            <div className="text-green-400">{mastery.championPointsSinceLastLevel} earned</div>
                          </div>
                        ) : (
                          <div className="text-purple-400 text-xs font-semibold">MAX</div>
                        )}
                      </td>
                      
                      <td className="text-center">
                        {mastery.chestGranted ? (
                          <span className="text-green-400 text-lg">📦</span>
                        ) : (
                          <span className="text-slate-500 text-lg">📦</span>
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

      {/* No Match Data Notice */}
      <Card className="bg-yellow-900/20 border-yellow-700">
        <CardHeader>
          <CardTitle className="text-yellow-300">📊 Limited Analytics Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-yellow-200 space-y-2">
            <p>
              <strong>Match history data is not available</strong> due to API key limitations (403 Forbidden on Match-V5 endpoints).
            </p>
            <p>
              However, we&apos;re still providing comprehensive analytics with available data:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
              <li>Complete champion mastery analysis with progression tracking</li>
              <li>Detailed ranked statistics and queue comparisons</li>
              <li>Summoner profile and achievement tracking</li>
              <li>Champion expertise and chest earning analysis</li>
            </ul>
            <p className="text-xs text-yellow-300 mt-4">
              <strong>Note:</strong> To unlock match history, KDA charts, and detailed game analysis, 
              the API key would need access to Match-V5 endpoints.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
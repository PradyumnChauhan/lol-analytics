'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { initializeRiotAPI } from '@/lib/api/init';
import type { SummonerDto, LeagueEntryDto, Region } from '@/types/riot-api';

interface SearchResult {
  summoner: SummonerDto | null;
  rankedStats: {
    soloQueue: LeagueEntryDto | null;
    flexQueue: LeagueEntryDto | null;
  } | null;
  error: string | null;
  loading: boolean;
}

export function SummonerSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region>('na1');
  const [result, setResult] = useState<SearchResult>({
    summoner: null,
    rankedStats: null,
    error: null,
    loading: false,
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setResult({ ...result, loading: true, error: null });

    try {
      // Initialize API if not already done
      const apiKey = process.env.NEXT_PUBLIC_RIOT_API_KEY;
      if (!apiKey) {
        throw new Error('API key not configured. Please add NEXT_PUBLIC_RIOT_API_KEY to your environment variables.');
      }

      initializeRiotAPI({
        apiKey,
        region: selectedRegion,
        isProduction: false,
      });

      // This component needs Riot ID format (gameName#tagLine) instead of summoner name
      // For now, redirect to the main player search page
      throw new Error('Please use the main player search page with Riot ID format (GameName#TAG)');

    } catch (error) {
      setResult({
        summoner: null,
        rankedStats: null,
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false,
      });
    }
  };

  const getRankBadgeColor = (tier: string) => {
    const colors: Record<string, string> = {
      IRON: 'bg-gray-600',
      BRONZE: 'bg-amber-600',
      SILVER: 'bg-gray-400',
      GOLD: 'bg-yellow-500',
      PLATINUM: 'bg-cyan-500',
      EMERALD: 'bg-green-500',
      DIAMOND: 'bg-blue-500',
      MASTER: 'bg-purple-600',
      GRANDMASTER: 'bg-red-600',
      CHALLENGER: 'bg-yellow-400',
    };
    return colors[tier] || 'bg-gray-500';
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Search Summoner</CardTitle>
          <CardDescription className="text-slate-400">
            Enter a summoner name to view their profile and ranked statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex space-x-2">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as Region)}
                className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 min-w-24"
                disabled={result.loading}
              >
                <option value="na1">NA</option>
                <option value="euw1">EUW</option>
                <option value="eun1">EUNE</option>
                <option value="kr">KR</option>
                <option value="jp1">JP</option>
                <option value="br1">BR</option>
                <option value="la1">LAN</option>
                <option value="la2">LAS</option>
                <option value="oc1">OCE</option>
                <option value="tr1">TR</option>
                <option value="ru">RU</option>
                <option value="ph2">PH</option>
                <option value="sg2">SG</option>
                <option value="th2">TH</option>
                <option value="tw2">TW</option>
                <option value="vn2">VN</option>
              </select>
              <Input
                placeholder="Enter summoner name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                disabled={result.loading}
              />
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleSearch}
                disabled={result.loading || !searchTerm.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {result.loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result.error && (
        <Card className="bg-red-900/20 border-red-700">
          <CardContent className="pt-6">
            <p className="text-red-400">{result.error}</p>
          </CardContent>
        </Card>
      )}

      {result.summoner && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {result.summoner.summonerLevel}
                </span>
              </div>
              <div>
                <div className="text-xl">{searchTerm}</div>
                <div className="text-sm text-slate-400">Level {result.summoner.summonerLevel}</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Summoner ID:</span>
                <div className="text-white font-mono text-xs break-all">
                  {result.summoner.id}
                </div>
              </div>
              <div>
                <span className="text-slate-400">PUUID:</span>
                <div className="text-white font-mono text-xs break-all">
                  {result.summoner.puuid}
                </div>
              </div>
            </div>

            {result.rankedStats && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Ranked Statistics</h3>
                
                {result.rankedStats.soloQueue && (
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">Solo/Duo Queue</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={`${getRankBadgeColor(result.rankedStats.soloQueue.tier)} text-white`}>
                            {result.rankedStats.soloQueue.tier} {result.rankedStats.soloQueue.rank}
                          </Badge>
                          <span className="text-slate-300">
                            {result.rankedStats.soloQueue.leaguePoints} LP
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white">
                          {result.rankedStats.soloQueue.wins}W / {result.rankedStats.soloQueue.losses}L
                        </div>
                        <div className="text-slate-400 text-sm">
                          {Math.round((result.rankedStats.soloQueue.wins / (result.rankedStats.soloQueue.wins + result.rankedStats.soloQueue.losses)) * 100)}% WR
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {result.rankedStats.flexQueue && (
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">Flex Queue</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={`${getRankBadgeColor(result.rankedStats.flexQueue.tier)} text-white`}>
                            {result.rankedStats.flexQueue.tier} {result.rankedStats.flexQueue.rank}
                          </Badge>
                          <span className="text-slate-300">
                            {result.rankedStats.flexQueue.leaguePoints} LP
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white">
                          {result.rankedStats.flexQueue.wins}W / {result.rankedStats.flexQueue.losses}L
                        </div>
                        <div className="text-slate-400 text-sm">
                          {Math.round((result.rankedStats.flexQueue.wins / (result.rankedStats.flexQueue.wins + result.rankedStats.flexQueue.losses)) * 100)}% WR
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!result.rankedStats.soloQueue && !result.rankedStats.flexQueue && (
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <p className="text-slate-400">No ranked data available</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
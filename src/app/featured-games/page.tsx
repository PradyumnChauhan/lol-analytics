'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FeaturedGame {
  gameId: number;
  gameType: string;
  gameStartTime: number;
  mapId: number;
  gameLength: number;
  platformId: string;
  gameMode: string;
  gameQueueConfigId: number;
  participants: Array<{
    teamId: number;
    championId: number;
    summonerName: string;
    profileIconId: number;
    bot: boolean;
  }>;
}

// Removed unused interface FeaturedGamesResponse

export default function FeaturedGamesPage() {
  const [games, setGames] = useState<FeaturedGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedGames = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/spectator/featured-games?region=na1');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch featured games');
      }

      setGames(data.gameList || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedGames();
  }, []);

  const formatGameDuration = (gameLength: number) => {
    const minutes = Math.floor(gameLength / 60);
    const seconds = gameLength % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getQueueName = (queueId: number) => {
    const queueMap: Record<number, string> = {
      420: 'Ranked Solo/Duo',
      440: 'Ranked Flex',
      450: 'ARAM',
      400: 'Normal Draft',
      430: 'Normal Blind',
    };
    return queueMap[queueId] || `Queue ${queueId}`;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Featured Games</h1>
          <p className="text-muted-foreground mt-2">
            Live high-MMR games currently in progress
          </p>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={fetchFeaturedGames} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Loading...' : 'Refresh Featured Games'}
          </Button>
        </div>

        {error && (
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {games.map((game) => (
            <Card key={game.gameId} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {getQueueName(game.gameQueueConfigId)}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">
                        {formatGameDuration(game.gameLength)}
                      </Badge>
                      <Badge variant="outline">
                        {game.gameMode}
                      </Badge>
                      <Badge variant="outline">
                        Game ID: {game.gameId}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Blue Team */}
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-2">Blue Team</h4>
                    <div className="space-y-1">
                      {game.participants
                        .filter(p => p.teamId === 100)
                        .map((participant, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">
                              {participant.championId}
                            </div>
                            <span className="font-medium">{participant.summonerName}</span>
                            {participant.bot && (
                              <Badge variant="secondary" className="text-xs">BOT</Badge>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Red Team */}
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">Red Team</h4>
                    <div className="space-y-1">
                      {game.participants
                        .filter(p => p.teamId === 200)
                        .map((participant, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">
                              {participant.championId}
                            </div>
                            <span className="font-medium">{participant.summonerName}</span>
                            {participant.bot && (
                              <Badge variant="secondary" className="text-xs">BOT</Badge>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {games.length === 0 && !loading && !error && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No featured games available</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">API Limitations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 text-sm">
              Currently using a personal development API key with limited permissions. 
              Featured games work perfectly, but summoner lookup requires a production API key.
              This demonstrates the working spectator API functionality!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
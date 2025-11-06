'use client';

import { useState, useEffect, useCallback } from 'react';

interface LiveGameParticipant {
  puuid: string;
  teamId: number;
  spell1Id: number;
  spell2Id: number;
  championId: number;
  profileIconId: number;
  riotId: string;
  bot: boolean;
}

interface BannedChampion {
  championId: number;
  teamId: number;
  pickTurn: number;
}

interface LiveGameData {
  gameId: number;
  mapId: number;
  gameMode: string;
  gameType: string;
  gameQueueConfigId: number;
  participants: LiveGameParticipant[];
  observers?: {
    encryptionKey: string;
  };
  platformId: string;
  bannedChampions: BannedChampion[];
  gameLength: number;
  gameStartTime?: number;
}

interface UseLiveGameReturn {
  liveGameData: LiveGameData | null;
  isLoading: boolean;
  error: string | null;
  isInGame: boolean;
  refetch: () => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export function useLiveGame(puuid: string, region: string = 'kr'): UseLiveGameReturn {
  const [liveGameData, setLiveGameData] = useState<LiveGameData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInGame, setIsInGame] = useState(false);

  const fetchLiveGame = useCallback(async () => {
    if (!puuid) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${BASE_URL}/api/spectator/v5/active-games/by-summoner/${puuid}?region=${region}`
      );

      if (response.status === 404) {
        // Player is not in an active game - this is expected
        setLiveGameData(null);
        setIsInGame(false);
        setError(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch live game data: ${response.status}`);
      }

      const data = await response.json();
      setLiveGameData(data);
      setIsInGame(true);
      setError(null);
    } catch (err) {
      console.error('Error fetching live game:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch live game data');
      setLiveGameData(null);
      setIsInGame(false);
    } finally {
      setIsLoading(false);
    }
  }, [puuid, region]);

  // Auto-refresh live game data
  useEffect(() => {
    if (!puuid) return;

    // Initial fetch
    fetchLiveGame();

    // Set up polling for live game updates
    const interval = setInterval(fetchLiveGame, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [fetchLiveGame, puuid]);

  const refetch = useCallback(() => {
    fetchLiveGame();
  }, [fetchLiveGame]);

  return {
    liveGameData,
    isLoading,
    error,
    isInGame,
    refetch
  };
}

// Helper hook for featured games
export function useFeaturedGames(region: string = 'kr') {
  const [featuredGames, setFeaturedGames] = useState<LiveGameData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/api/spectator/v5/featured-games?region=${region}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch featured games: ${response.status}`);
      }

      const data = await response.json();
      setFeaturedGames(data.gameList || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching featured games:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch featured games');
      setFeaturedGames([]);
    } finally {
      setIsLoading(false);
    }
  }, [region]);

  useEffect(() => {
    fetchFeaturedGames();
    
    // Refresh featured games every 5 minutes
    const interval = setInterval(fetchFeaturedGames, 300000);
    
    return () => clearInterval(interval);
  }, [fetchFeaturedGames]);

  const refetch = useCallback(() => {
    fetchFeaturedGames();
  }, [fetchFeaturedGames]);

  return {
    featuredGames,
    isLoading,
    error,
    refetch
  };
}
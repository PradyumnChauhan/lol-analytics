import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/utils/backend-url';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ gameName: string; tagLine: string }> }
) {
  try {
    const { gameName, tagLine } = await context.params;
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'americas';
    
    const regionToPlatform: Record<string, string> = {
      'americas': 'na1',
      'asia': 'kr',
      'europe': 'euw1',
    };
    const platform = regionToPlatform[region] || 'na1';

    const backendUrl = getBackendUrl();
    
    // Helper function to create timeout signal
    const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), timeoutMs);
      return controller.signal;
    };

    // Helper function to fetch with retry and better error handling
    const fetchWithRetry = async (url: string, retries = 2): Promise<Response> => {
      for (let i = 0; i <= retries; i++) {
        try {
          const response = await fetch(url, {
            headers: {
              'Connection': 'keep-alive',
            },
            signal: createTimeoutSignal(30000), // 30 second timeout
          });
          return response;
        } catch (error) {
          if (i === retries) throw error;
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
      throw new Error('Failed to fetch after retries');
    };
    
    // Step 1: Get account by Riot ID
    const accountResponse = await fetchWithRetry(
      `${backendUrl}/api/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?region=${region}`
    );
    if (!accountResponse.ok) {
      return NextResponse.json(
        { message: `Account not found: ${accountResponse.statusText}` },
        { status: accountResponse.status }
      );
    }
    const account = await accountResponse.json();

    // Step 2: Get summoner data
    const summonerResponse = await fetchWithRetry(
      `${backendUrl}/api/summoner/v4/summoners/by-puuid/${account.puuid}?region=${platform}&autoDetect=true`
    );
    const summoner = summonerResponse.ok ? await summonerResponse.json() : null;

    // Step 3: Get match history
    const matchIdsResponse = await fetchWithRetry(
      `${backendUrl}/api/match/v5/matches/by-puuid/${account.puuid}/ids?region=${region}&count=30`
    );
    const matchIds = matchIdsResponse.ok ? await matchIdsResponse.json() : [];

    // Step 4: Get detailed matches (limited to 20 for performance, fetch in batches to avoid connection issues)
    const matches: unknown[] = [];
    const matchIdsToFetch = matchIds.slice(0, 20);
    
    // Fetch matches in smaller batches with delays to avoid overwhelming the backend
    const batchSize = 5;
    for (let i = 0; i < matchIdsToFetch.length; i += batchSize) {
      const batch = matchIdsToFetch.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (matchId: string) => {
          try {
            const matchResponse = await fetch(`${backendUrl}/api/match/v5/matches/${matchId}?region=${region}`, {
              headers: {
                'Connection': 'keep-alive',
              },
              // Add timeout to prevent hanging
              signal: createTimeoutSignal(30000), // 30 second timeout
            });
            if (matchResponse.ok) {
              return await matchResponse.json();
            }
            return null;
          } catch (error) {
            console.error(`[API Route] Error fetching match ${matchId}:`, error);
            return null;
          }
        })
      );
      
      // Extract successful results
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value !== null) {
          matches.push(result.value);
        }
      });
      
      // Add small delay between batches to avoid overwhelming the backend
      if (i + batchSize < matchIdsToFetch.length) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      }
    }

    // Step 5: Get champion mastery
    const masteryResponse = await fetchWithRetry(
      `${backendUrl}/api/champion-mastery/v4/champion-masteries/by-puuid/${account.puuid}?region=${platform}`
    );
    const championMastery = masteryResponse.ok ? await masteryResponse.json() : [];

    // Step 6: Get league entries
    const leagueResponse = await fetchWithRetry(
      `${backendUrl}/api/league/v4/entries/by-puuid/${account.puuid}?region=${platform}`
    );
    const leagueEntries = leagueResponse.ok ? await leagueResponse.json() : [];

    // Step 7: Get challenges (optional)
    let challenges = null;
    try {
      const challengeResponse = await fetchWithRetry(
        `${backendUrl}/api/challenges/v1/player-data/by-puuid/${account.puuid}?region=${platform}`
      );
      if (challengeResponse.ok) {
        challenges = await challengeResponse.json();
      }
    } catch (error) {
      console.error('[API Route] Challenges fetch failed:', error);
      // Challenges not available - continue without them
    }

    // Step 8: Get Clash data (optional)
    let clash = null;
    try {
      if (summoner?.id) {
        const clashResponse = await fetchWithRetry(
          `${backendUrl}/api/clash/v1/players/by-summoner/${summoner.id}?region=${platform}`
        );
        if (clashResponse.ok) {
          await clashResponse.json(); // clashData not used
          // If we get clash data, also fetch tournaments
          const tournamentsResponse = await fetchWithRetry(
            `${backendUrl}/api/clash/v1/tournaments?region=${platform}`
          );
          if (tournamentsResponse.ok) {
            clash = await tournamentsResponse.json();
          }
        }
      }
    } catch (error) {
      console.error('[API Route] Clash data fetch failed:', error);
      // Clash data not available - continue without it
    }

    return NextResponse.json({
      account,
      summoner,
      matches,
      championMastery,
      leagueEntries,
      challenges,
      clash,
      region: platform,
    });
  } catch (error: unknown) {
    console.error('[API Route] Error fetching player data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch player data';
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}


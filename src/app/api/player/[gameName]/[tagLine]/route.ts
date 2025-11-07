import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/utils/backend-url';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ gameName: string; tagLine: string }> }
) {
  let gameName = '';
  let tagLine = '';
  let region = 'americas';
  
  try {
    const params = await context.params;
    gameName = params.gameName;
    tagLine = params.tagLine;
    const { searchParams } = new URL(request.url);
    region = searchParams.get('region') || 'americas';
    
    const regionToPlatform: Record<string, string> = {
      'americas': 'na1',
      'asia': 'kr',
      'europe': 'euw1',
    };
    const platform = regionToPlatform[region] || 'na1';

    const backendUrl = getBackendUrl();
    console.log('[API Route] Player data fetch started:', {
      gameName,
      tagLine,
      region,
      platform,
      backendUrl,
      timestamp: new Date().toISOString()
    });
    
    // Helper function to create timeout signal
    const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), timeoutMs);
      return controller.signal;
    };

    // Helper function to fetch with retry and better error handling
    const fetchWithRetry = async (url: string, retries = 2, endpointName = 'unknown'): Promise<Response> => {
      // Ensure we have a full URL (url should already include backendUrl, but handle both cases)
      const fullUrl = url.startsWith('http') ? url : `${backendUrl}${url.startsWith('/') ? url : '/' + url}`;
      console.log(`[fetchWithRetry] ${endpointName}:`, {
        inputUrl: url,
        fullUrl: fullUrl,
        backendUrl: backendUrl,
        attempt: 1,
        retries,
        timestamp: new Date().toISOString()
      });
      
      for (let i = 0; i <= retries; i++) {
        try {
          const startTime = Date.now();
          const response = await fetch(fullUrl, {
            headers: {
              'Connection': 'keep-alive',
            },
            signal: createTimeoutSignal(30000), // 30 second timeout
          });
          
          const duration = Date.now() - startTime;
          console.log(`[fetchWithRetry] ${endpointName} success:`, {
            url: fullUrl,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            attempt: i + 1,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
          });
          
          return response;
        } catch (error) {
          const errorDetails = error instanceof Error ? {
            message: error.message,
            name: error.name,
            stack: error.stack?.split('\n')[0]
          } : { error: String(error) };
          
          console.error(`[fetchWithRetry] ${endpointName} error (attempt ${i + 1}/${retries + 1}):`, {
            url: fullUrl,
            ...errorDetails,
            timestamp: new Date().toISOString()
          });
          
          if (i === retries) {
            console.error(`[fetchWithRetry] ${endpointName} failed after all retries`);
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          const delay = 1000 * (i + 1);
          console.log(`[fetchWithRetry] ${endpointName} retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      throw new Error('Failed to fetch after retries');
    };
    
    // Step 1: Get account by Riot ID
    console.log('[API Route] Step 1: Fetching account by Riot ID');
    const accountResponse = await fetchWithRetry(
      `${backendUrl}/api/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?region=${region}`,
      2,
      'AccountByRiotId'
    );
    if (!accountResponse.ok) {
      return NextResponse.json(
        { message: `Account not found: ${accountResponse.statusText}` },
        { status: accountResponse.status }
      );
    }
    const account = await accountResponse.json();

    // Step 2: Get summoner data
    console.log('[API Route] Step 2: Fetching summoner data', { puuid: account.puuid, platform });
    const summonerResponse = await fetchWithRetry(
      `${backendUrl}/api/summoner/v4/summoners/by-puuid/${account.puuid}?region=${platform}&autoDetect=true`,
      2,
      'SummonerByPuuid'
    );
    const summoner = summonerResponse.ok ? await summonerResponse.json() : null;
    console.log('[API Route] Step 2: Summoner data', { 
      success: summonerResponse.ok, 
      hasSummoner: !!summoner,
      summonerId: summoner?.id 
    });

    // Step 3: Get match history
    console.log('[API Route] Step 3: Fetching match IDs', { puuid: account.puuid, region });
    const matchIdsResponse = await fetchWithRetry(
      `${backendUrl}/api/match/v5/matches/by-puuid/${account.puuid}/ids?region=${region}&count=30`,
      2,
      'MatchIds'
    );
    const matchIds = matchIdsResponse.ok ? await matchIdsResponse.json() : [];
    console.log('[API Route] Step 3: Match IDs fetched', { 
      success: matchIdsResponse.ok, 
      count: matchIds.length 
    });

    // Step 4: Get detailed matches (limited to 20 for performance, fetch in batches to avoid connection issues)
    console.log('[API Route] Step 4: Fetching match details', { 
      totalMatchIds: matchIds.length, 
      willFetch: Math.min(matchIds.length, 20) 
    });
    const matches: unknown[] = [];
    const matchIdsToFetch = matchIds.slice(0, 20);
    
    // Fetch matches in smaller batches with delays to avoid overwhelming the backend
    const batchSize = 5;
    for (let i = 0; i < matchIdsToFetch.length; i += batchSize) {
      const batch = matchIdsToFetch.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      console.log(`[API Route] Step 4: Fetching batch ${batchNumber}`, { 
        batchSize: batch.length, 
        matchIds: batch 
      });
      
      const batchResults = await Promise.allSettled(
        batch.map(async (matchId: string) => {
          const matchUrl = `${backendUrl}/api/match/v5/matches/${matchId}?region=${region}`;
          const startTime = Date.now();
          try {
            console.log(`[API Route] Fetching match: ${matchId}`, { url: matchUrl });
            const matchResponse = await fetch(matchUrl, {
              headers: {
                'Connection': 'keep-alive',
              },
              // Add timeout to prevent hanging
              signal: createTimeoutSignal(30000), // 30 second timeout
            });
            
            const duration = Date.now() - startTime;
            console.log(`[API Route] Match ${matchId} response:`, {
              status: matchResponse.status,
              ok: matchResponse.ok,
              duration: `${duration}ms`
            });
            
            if (matchResponse.ok) {
              const data = await matchResponse.json();
              console.log(`[API Route] Match ${matchId} fetched successfully`);
              return data;
            }
            console.warn(`[API Route] Match ${matchId} failed:`, {
              status: matchResponse.status,
              statusText: matchResponse.statusText
            });
            return null;
          } catch (error) {
            const duration = Date.now() - startTime;
            const errorDetails = error instanceof Error ? {
              message: error.message,
              name: error.name
            } : { error: String(error) };
            console.error(`[API Route] Error fetching match ${matchId}:`, {
              url: matchUrl,
              duration: `${duration}ms`,
              ...errorDetails
            });
            return null;
          }
        })
      );
      
      // Extract successful results
      const successful = batchResults.filter(r => r.status === 'fulfilled' && r.value !== null).length;
      const failed = batchResults.length - successful;
      console.log(`[API Route] Batch ${batchNumber} completed:`, {
        successful,
        failed,
        total: batchResults.length
      });
      
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
    
    console.log('[API Route] Step 4: Match details completed', {
      requested: matchIdsToFetch.length,
      fetched: matches.length
    });

    // Step 5: Get champion mastery
    console.log('[API Route] Step 5: Fetching champion mastery');
    const masteryResponse = await fetchWithRetry(
      `${backendUrl}/api/champion-mastery/v4/champion-masteries/by-puuid/${account.puuid}?region=${platform}`,
      2,
      'ChampionMastery'
    );
    const championMastery = masteryResponse.ok ? await masteryResponse.json() : [];
    console.log('[API Route] Step 5: Champion mastery', {
      success: masteryResponse.ok,
      count: Array.isArray(championMastery) ? championMastery.length : 0
    });

    // Step 6: Get league entries
    console.log('[API Route] Step 6: Fetching league entries');
    const leagueResponse = await fetchWithRetry(
      `${backendUrl}/api/league/v4/entries/by-puuid/${account.puuid}?region=${platform}`,
      2,
      'LeagueEntries'
    );
    const leagueEntries = leagueResponse.ok ? await leagueResponse.json() : [];
    console.log('[API Route] Step 6: League entries', {
      success: leagueResponse.ok,
      count: Array.isArray(leagueEntries) ? leagueEntries.length : 0
    });

    // Step 7: Get challenges (optional)
    console.log('[API Route] Step 7: Fetching challenges');
    let challenges = null;
    try {
      const challengeResponse = await fetchWithRetry(
        `${backendUrl}/api/challenges/v1/player-data/by-puuid/${account.puuid}?region=${platform}`,
        2,
        'Challenges'
      );
      if (challengeResponse.ok) {
        challenges = await challengeResponse.json();
        console.log('[API Route] Step 7: Challenges fetched successfully');
      } else {
        console.log('[API Route] Step 7: Challenges not available', {
          status: challengeResponse.status,
          statusText: challengeResponse.statusText
        });
      }
    } catch (error) {
      const errorDetails = error instanceof Error ? {
        message: error.message,
        name: error.name
      } : { error: String(error) };
      console.error('[API Route] Step 7: Challenges fetch failed:', errorDetails);
      // Challenges not available - continue without them
    }

    // Step 8: Get Clash data (optional)
    console.log('[API Route] Step 8: Fetching Clash data');
    let clash = null;
    try {
      if (summoner?.id) {
        const clashResponse = await fetchWithRetry(
          `${backendUrl}/api/clash/v1/players/by-summoner/${summoner.id}?region=${platform}`,
          2,
          'ClashPlayer'
        );
        if (clashResponse.ok) {
          await clashResponse.json(); // clashData not used
          // If we get clash data, also fetch tournaments
          const tournamentsResponse = await fetchWithRetry(
            `${backendUrl}/api/clash/v1/tournaments?region=${platform}`,
            2,
            'ClashTournaments'
          );
          if (tournamentsResponse.ok) {
            clash = await tournamentsResponse.json();
            console.log('[API Route] Step 8: Clash data fetched successfully');
          } else {
            console.log('[API Route] Step 8: Clash tournaments not available', {
              status: tournamentsResponse.status
            });
          }
        } else {
          console.log('[API Route] Step 8: Clash player data not available', {
            status: clashResponse.status
          });
        }
      } else {
        console.log('[API Route] Step 8: Skipping Clash (no summoner ID)');
      }
    } catch (error) {
      const errorDetails = error instanceof Error ? {
        message: error.message,
        name: error.name
      } : { error: String(error) };
      console.error('[API Route] Step 8: Clash data fetch failed:', errorDetails);
      // Clash data not available - continue without it
    }

    console.log('[API Route] All data fetched successfully:', {
      hasAccount: !!account,
      hasSummoner: !!summoner,
      matchesCount: matches.length,
      masteryCount: Array.isArray(championMastery) ? championMastery.length : 0,
      leagueEntriesCount: Array.isArray(leagueEntries) ? leagueEntries.length : 0,
      hasChallenges: !!challenges,
      hasClash: !!clash,
      region: platform
    });

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
    const errorDetails = error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    } : { error: String(error) };
    
    console.error('[API Route] Error fetching player data:', {
      gameName,
      tagLine,
      region,
      backendUrl: getBackendUrl(),
      ...errorDetails,
      timestamp: new Date().toISOString()
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch player data';
    return NextResponse.json(
      { 
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}


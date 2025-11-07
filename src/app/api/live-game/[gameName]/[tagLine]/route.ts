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
    
    console.log('[API Route] Live game fetch started:', {
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
      console.error('[API Route] Account fetch failed:', {
        status: accountResponse.status,
        statusText: accountResponse.statusText
      });
      return NextResponse.json(
        { message: `Account not found: ${accountResponse.statusText}` },
        { status: accountResponse.status }
      );
    }
    const account = await accountResponse.json();
    console.log('[API Route] Step 1: Account fetched', { puuid: account.puuid });

    // Step 2: Get summoner data
    console.log('[API Route] Step 2: Fetching summoner data', { puuid: account.puuid, platform });
    const summonerResponse = await fetchWithRetry(
      `${backendUrl}/api/summoner/v4/summoners/by-puuid/${account.puuid}?region=${platform}&autoDetect=true`,
      2,
      'SummonerByPuuid'
    );
    if (!summonerResponse.ok) {
      console.error('[API Route] Summoner fetch failed:', {
        status: summonerResponse.status,
        statusText: summonerResponse.statusText
      });
      return NextResponse.json(
        { message: `Summoner not found: ${summonerResponse.statusText}` },
        { status: summonerResponse.status }
      );
    }
    const summoner = await summonerResponse.json();
    console.log('[API Route] Step 2: Summoner fetched', { summonerId: summoner.id });

    // Step 3: Get live game data
    console.log('[API Route] Step 3: Fetching live game data', { summonerId: summoner.id, platform });
    const liveGameResponse = await fetchWithRetry(
      `${backendUrl}/api/spectator/v5/active-games/by-summoner/${summoner.id}?region=${platform}`,
      2,
      'LiveGame'
    );
    
    if (!liveGameResponse.ok) {
      if (liveGameResponse.status === 404) {
        console.log('[API Route] Step 3: Player not in game (404)');
        return NextResponse.json(
          { message: 'Player is not currently in a live game' },
          { status: 404 }
        );
      }
      console.error('[API Route] Step 3: Live game fetch failed:', {
        status: liveGameResponse.status,
        statusText: liveGameResponse.statusText
      });
      return NextResponse.json(
        { message: `Failed to fetch live game: ${liveGameResponse.statusText}` },
        { status: liveGameResponse.status }
      );
    }
    
    const liveGame = await liveGameResponse.json();
    console.log('[API Route] Step 3: Live game fetched successfully');
    return NextResponse.json(liveGame);
  } catch (error: unknown) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    } : { error: String(error) };
    
    console.error('[API Route] Error fetching live game:', {
      gameName,
      tagLine,
      region,
      backendUrl: getBackendUrl(),
      ...errorDetails,
      timestamp: new Date().toISOString()
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch live game data';
    return NextResponse.json(
      { 
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}




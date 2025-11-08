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
    const inputRegion = searchParams.get('region') || 'americas';
    const start = parseInt(searchParams.get('start') || '0');
    const count = parseInt(searchParams.get('count') || '10');
    
    // Map platform to routing region, or use routing region directly
    const platformToRoutingRegion: Record<string, string> = {
      'na1': 'americas',
      'euw1': 'europe',
      'eun1': 'europe',
      'kr': 'asia',
      'br1': 'americas',
      'la1': 'americas',
      'la2': 'americas',
      'oc1': 'asia',
      'tr1': 'europe',
      'ru': 'europe',
      'jp1': 'asia',
      'ph2': 'asia',
      'sg2': 'asia',
      'th2': 'asia',
      'tw2': 'asia',
      'vn2': 'asia',
    };
    
    // If it's a platform, convert to routing region; otherwise use as-is
    region = platformToRoutingRegion[inputRegion] || inputRegion;
    
    // Platform mapping kept for potential future use
    // const regionToPlatform: Record<string, string> = {
    //   'americas': 'na1',
    //   'asia': 'kr',
    //   'europe': 'euw1',
    // };

    const backendUrl = getBackendUrl();
    
    // Helper function to create timeout signal
    const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), timeoutMs);
      return controller.signal;
    };

    // Helper function to fetch with retry
    const fetchWithRetry = async (url: string, retries = 2): Promise<Response> => {
      const fullUrl = url.startsWith('http') ? url : `${backendUrl}${url.startsWith('/') ? url : '/' + url}`;
      
      for (let i = 0; i <= retries; i++) {
        try {
          const response = await fetch(fullUrl, {
            headers: {
              'Connection': 'keep-alive',
            },
            signal: createTimeoutSignal(30000),
          });
          
          if (response.ok) {
            return response;
          }
          
          if (i === retries) {
            return response;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        } catch (error) {
          if (i === retries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
      throw new Error('Failed to fetch after retries');
    };
    
    // Step 1: Get account by Riot ID
    const accountResponse = await fetchWithRetry(
      `${backendUrl}/api/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?region=${region}`,
      2
    );
    if (!accountResponse.ok) {
      return NextResponse.json(
        { message: `Account not found: ${accountResponse.statusText}` },
        { status: accountResponse.status }
      );
    }
    const account = await accountResponse.json();

    // Step 2: Get match IDs with pagination
    // Fetch one extra to check if there are more matches available
    const matchIdsResponse = await fetchWithRetry(
      `${backendUrl}/api/match/v5/matches/by-puuid/${account.puuid}/ids?region=${region}&count=${start + count + 1}`,
      2
    );
    const allMatchIds = matchIdsResponse.ok ? await matchIdsResponse.json() : [];
    
    // Check if there are more matches available (we fetched one extra)
    const hasMore = allMatchIds.length > start + count;
    
    // Get the slice of match IDs we need (without the extra one)
    const matchIdsToFetch = allMatchIds.slice(start, start + count);
    
    if (matchIdsToFetch.length === 0) {
      return NextResponse.json({
        matches: [],
        hasMore: false,
        totalFetched: start,
      });
    }

    // Step 3: Fetch detailed matches
    const matches: unknown[] = [];
    const batchSize = 5;
    
    for (let i = 0; i < matchIdsToFetch.length; i += batchSize) {
      const batch = matchIdsToFetch.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (matchId: string) => {
          const matchUrl = `${backendUrl}/api/match/v5/matches/${matchId}?region=${region}`;
          try {
            const matchResponse = await fetch(matchUrl, {
              headers: {
                'Connection': 'keep-alive',
              },
              signal: createTimeoutSignal(30000),
            });
            
            if (matchResponse.ok) {
              return await matchResponse.json();
            }
            return null;
          } catch (error) {
            console.error(`Error fetching match ${matchId}:`, error);
            return null;
          }
        })
      );
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value !== null) {
          matches.push(result.value);
        }
      });
      
      // Add small delay between batches
      if (i + batchSize < matchIdsToFetch.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({
      matches,
      hasMore: hasMore,
      totalFetched: start + matches.length,
      totalAvailable: allMatchIds.length,
    });
  } catch (error: unknown) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      name: error.name,
    } : { error: String(error) };
    
    console.error('[Matches API Route] Error:', errorDetails);
    
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Failed to fetch matches',
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      },
      { status: 500 }
    );
  }
}


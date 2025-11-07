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

    // Step 1: Get account by Riot ID
    const accountResponse = await fetch(
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
    const summonerResponse = await fetch(
      `${backendUrl}/api/summoner/v4/summoners/by-puuid/${account.puuid}?region=${platform}&autoDetect=true`
    );
    if (!summonerResponse.ok) {
      return NextResponse.json(
        { message: `Summoner not found: ${summonerResponse.statusText}` },
        { status: summonerResponse.status }
      );
    }
    const summoner = await summonerResponse.json();

    // Step 3: Get live game data
    const liveGameResponse = await fetch(
      `${backendUrl}/api/spectator/v5/active-games/by-summoner/${summoner.id}?region=${platform}`
    );
    
    if (!liveGameResponse.ok) {
      if (liveGameResponse.status === 404) {
        return NextResponse.json(
          { message: 'Player is not currently in a live game' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { message: `Failed to fetch live game: ${liveGameResponse.statusText}` },
        { status: liveGameResponse.status }
      );
    }
    
    const liveGame = await liveGameResponse.json();
    return NextResponse.json(liveGame);
  } catch (error: unknown) {
    console.error('[API Route] Error fetching live game:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch live game data';
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}




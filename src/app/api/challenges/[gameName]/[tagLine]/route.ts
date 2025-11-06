import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { gameName: string; tagLine: string } }
) {
  try {
    const { gameName, tagLine } = params;
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'americas';
    
    const regionToPlatform: Record<string, string> = {
      'americas': 'na1',
      'asia': 'kr',
      'europe': 'euw1',
    };
    const platform = regionToPlatform[region] || 'na1';

    // Step 1: Get account by Riot ID
    const accountResponse = await fetch(
      `${BASE_URL}/api/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?region=${region}`
    );
    if (!accountResponse.ok) {
      return NextResponse.json(
        { message: `Account not found: ${accountResponse.statusText}` },
        { status: accountResponse.status }
      );
    }
    const account = await accountResponse.json();

    // Step 2: Get challenges
    const challengeResponse = await fetch(
      `${BASE_URL}/api/challenges/v1/player-data/by-puuid/${account.puuid}?region=${platform}`
    );
    
    if (!challengeResponse.ok) {
      return NextResponse.json(
        { message: `Challenges not available: ${challengeResponse.statusText}` },
        { status: challengeResponse.status }
      );
    }
    
    const challenges = await challengeResponse.json();
    return NextResponse.json(challenges);
  } catch (error: any) {
    console.error('[API Route] Error fetching challenges:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch challenge data' },
      { status: 500 }
    );
  }
}




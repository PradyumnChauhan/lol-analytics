// API route for champion mastery by PUUID
// This runs on the server-side, so it can safely use the API key

import { NextRequest, NextResponse } from 'next/server';

const RIOT_API_KEY = process.env.NEXT_PUBLIC_RIOT_API_KEY;
const REGIONS = ['na1', 'euw1', 'eun1', 'kr', 'br1', 'la1', 'la2', 'oc1', 'tr1', 'ru', 'jp1', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const puuid = searchParams.get('puuid');
    const region = searchParams.get('region') || 'br1';

    // Validate inputs
    if (!puuid) {
      return NextResponse.json(
        { error: 'PUUID is required' },
        { status: 400 }
      );
    }

    if (!REGIONS.includes(region)) {
      return NextResponse.json(
        { error: `Invalid region. Must be one of: ${REGIONS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: 'Riot API key not configured' },
        { status: 500 }
      );
    }

    console.log(`[Champion Mastery API] Fetching champion mastery for PUUID: ${puuid.substring(0, 20)}... in region: ${region}`);

    // Make request to Riot API (server-side)
    const riotApiUrl = `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`;
    
    const response = await fetch(riotApiUrl, {
      headers: {
        'X-Riot-Token': RIOT_API_KEY,
        'User-Agent': 'lol-analytics-app/1.0'
      }
    });

    console.log(`[Champion Mastery API] Riot API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Champion Mastery API] Riot API error:`, errorText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: `No champion mastery found for PUUID in ${region.toUpperCase()}` },
          { status: 404 }
        );
      }
      
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'API key authentication failed. Please check your API key.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: `Riot API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[Champion Mastery API] Successfully fetched ${data.length} champion masteries`);

    return NextResponse.json(data);

  } catch (error) {
    console.error('[Champion Mastery API] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
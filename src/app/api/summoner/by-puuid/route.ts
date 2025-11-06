// API route for summoner by PUUID lookups
// This runs on the server-side, so it can safely use the API key

import { NextRequest, NextResponse } from 'next/server';

const RIOT_API_KEY = process.env.NEXT_PUBLIC_RIOT_API_KEY;
const REGIONS = ['na1', 'euw1', 'eun1', 'kr', 'br1', 'la1', 'la2', 'oc1', 'tr1', 'ru', 'jp1', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const puuid = searchParams.get('puuid');
    const region = searchParams.get('region') || 'br1'; // Default to BR1 like your working curl

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

    console.log(`[API Route] Fetching summoner by PUUID: ${puuid.substring(0, 20)}... in region: ${region}`);
    console.log(`[API Route] Using API key: ${RIOT_API_KEY.substring(0, 20)}...`);

    // Make request to Riot API (server-side) - using the working pattern from your curl
    const riotApiUrl = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    
    const response = await fetch(riotApiUrl, {
      headers: {
        'X-Riot-Token': RIOT_API_KEY,
        'User-Agent': 'lol-analytics-app/1.0'
      }
    });

    console.log(`[API Route] Riot API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Route] Riot API error:`, errorText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: `Summoner with PUUID not found in ${region.toUpperCase()}` },
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
    console.log(`[API Route] Successfully fetched summoner:`, `Level ${data.summonerLevel}`);

    return NextResponse.json(data);

  } catch (error) {
    console.error('[API Route] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
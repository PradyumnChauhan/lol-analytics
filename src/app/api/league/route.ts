// API route for league/ranked stats by summoner ID
// This runs on the server-side, so it can safely use the API key

import { NextRequest, NextResponse } from 'next/server';

interface LeagueEntry {
  leagueId: string;
  summonerId: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
  miniSeries?: {
    target: number;
    wins: number;
    losses: number;
    progress: string;
  };
}

const RIOT_API_KEY = process.env.NEXT_PUBLIC_RIOT_API_KEY;
const REGIONS = ['na1', 'euw1', 'eun1', 'kr', 'br1', 'la1', 'la2', 'oc1', 'tr1', 'ru', 'jp1', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const summonerId = searchParams.get('summonerId');
    const region = searchParams.get('region') || 'br1';

    // Validate inputs
    if (!summonerId) {
      return NextResponse.json(
        { error: 'Summoner ID is required' },
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

    console.log(`[League API] Fetching league stats for summoner ID: ${summonerId.substring(0, 20)}... in region: ${region}`);

    // Make request to Riot API (server-side)
    const riotApiUrl = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
    
    const response = await fetch(riotApiUrl, {
      headers: {
        'X-Riot-Token': RIOT_API_KEY,
        'User-Agent': 'lol-analytics-app/1.0'
      }
    });

    console.log(`[League API] Riot API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[League API] Riot API error:`, errorText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: `No league data found for summoner in ${region.toUpperCase()}` },
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
    console.log(`[League API] Successfully fetched ${data.length} league entries`);

    // Organize data by queue type
    const organized = {
      soloQueue: data.find((entry: LeagueEntry) => entry.queueType === 'RANKED_SOLO_5x5') || null,
      flexQueue: data.find((entry: LeagueEntry) => entry.queueType === 'RANKED_FLEX_SR') || null,
      all: data
    };

    return NextResponse.json(organized);

  } catch (error) {
    console.error('[League API] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
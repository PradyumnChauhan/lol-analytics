// API route for match history by PUUID
// This runs on the server-side, so it can safely use the API key

import { NextRequest, NextResponse } from 'next/server';

const RIOT_API_KEY = process.env.NEXT_PUBLIC_RIOT_API_KEY;
const REGIONS = ['na1', 'euw1', 'eun1', 'kr', 'br1', 'la1', 'la2', 'oc1', 'tr1', 'ru', 'jp1', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const puuid = searchParams.get('puuid');
    const region = searchParams.get('region') || 'br1';
    const count = parseInt(searchParams.get('count') || '20');

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

    console.log(`[Match API] Fetching matches for PUUID: ${puuid.substring(0, 20)}... in region: ${region}`);

    // Get match IDs first
    const matchIdsUrl = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`;
    
    const matchIdsResponse = await fetch(matchIdsUrl, {
      headers: {
        'X-Riot-Token': RIOT_API_KEY,
        'User-Agent': 'lol-analytics-app/1.0'
      }
    });

    if (!matchIdsResponse.ok) {
      const errorText = await matchIdsResponse.text();
      console.error(`[Match API] Error fetching match IDs:`, errorText);
      return NextResponse.json(
        { error: `Failed to fetch match IDs: ${matchIdsResponse.status}` },
        { status: matchIdsResponse.status }
      );
    }

    const matchIds = await matchIdsResponse.json();
    console.log(`[Match API] Found ${matchIds.length} match IDs`);

    // Fetch detailed match data for each match (limit to first 10 for performance)
    const matchesToFetch = matchIds.slice(0, 10);
    const matchPromises = matchesToFetch.map(async (matchId: string) => {
      try {
        const matchUrl = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        const response = await fetch(matchUrl, {
          headers: {
            'X-Riot-Token': RIOT_API_KEY,
            'User-Agent': 'lol-analytics-app/1.0'
          }
        });

        if (response.ok) {
          return await response.json();
        }
        return null;
      } catch (error) {
        console.error(`[Match API] Error fetching match ${matchId}:`, error);
        return null;
      }
    });

    const matches = await Promise.all(matchPromises);
    const validMatches = matches.filter(match => match !== null);

    console.log(`[Match API] Successfully fetched ${validMatches.length} match details`);

    return NextResponse.json({
      matchIds: matchIds,
      matches: validMatches,
      totalMatches: matchIds.length,
      fetchedMatches: validMatches.length
    });

  } catch (error) {
    console.error('[Match API] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
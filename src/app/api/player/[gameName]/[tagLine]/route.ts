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

    // Step 2: Get summoner data
    const summonerResponse = await fetch(
      `${BASE_URL}/api/summoner/v4/summoners/by-puuid/${account.puuid}?region=${platform}&autoDetect=true`
    );
    const summoner = summonerResponse.ok ? await summonerResponse.json() : null;

    // Step 3: Get match history
    const matchIdsResponse = await fetch(
      `${BASE_URL}/api/match/v5/matches/by-puuid/${account.puuid}/ids?region=${region}&count=30`
    );
    const matchIds = matchIdsResponse.ok ? await matchIdsResponse.json() : [];

    // Step 4: Get detailed matches (limited to 25 for performance)
    const matchDetails = await Promise.all(
      matchIds.slice(0, 25).map(async (matchId: string) => {
        const matchResponse = await fetch(`${BASE_URL}/api/match/v5/matches/${matchId}?region=${region}`);
        return matchResponse.ok ? await matchResponse.json() : null;
      })
    );
    const matches = matchDetails.filter(Boolean);

    // Step 5: Get champion mastery
    const masteryResponse = await fetch(
      `${BASE_URL}/api/champion-mastery/v4/champion-masteries/by-puuid/${account.puuid}?region=${platform}`
    );
    const championMastery = masteryResponse.ok ? await masteryResponse.json() : [];

    // Step 6: Get league entries
    const leagueResponse = await fetch(
      `${BASE_URL}/api/league/v4/entries/by-puuid/${account.puuid}?region=${platform}`
    );
    const leagueEntries = leagueResponse.ok ? await leagueResponse.json() : [];

    // Step 7: Get challenges (optional)
    let challenges = null;
    try {
      const challengeResponse = await fetch(
        `${BASE_URL}/api/challenges/v1/player-data/by-puuid/${account.puuid}?region=${platform}`
      );
      if (challengeResponse.ok) {
        challenges = await challengeResponse.json();
      }
    } catch (error) {
      // Challenges not available
    }

    // Step 8: Get Clash data (optional)
    let clash = null;
    try {
      if (summoner?.id) {
        const clashResponse = await fetch(
          `${BASE_URL}/api/clash/v1/players/by-summoner/${summoner.id}?region=${platform}`
        );
        if (clashResponse.ok) {
          const clashData = await clashResponse.json();
          // If we get clash data, also fetch tournaments
          const tournamentsResponse = await fetch(
            `${BASE_URL}/api/clash/v1/tournaments?region=${platform}`
          );
          if (tournamentsResponse.ok) {
            clash = await tournamentsResponse.json();
          }
        }
      }
    } catch (error) {
      // Clash data not available
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
  } catch (error: any) {
    console.error('[API Route] Error fetching player data:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch player data' },
      { status: 500 }
    );
  }
}


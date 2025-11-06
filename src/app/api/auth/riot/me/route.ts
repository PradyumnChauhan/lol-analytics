import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const regions = ['americas', 'europe', 'asia'];

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('riot_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Try to get account info from different regions
    for (const region of regions) {
      try {
        const accountResponse = await fetch(
          `https://${region}.api.riotgames.com/riot/account/v1/accounts/me`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (accountResponse.ok) {
          const accountInfo = await accountResponse.json();
          return NextResponse.json(accountInfo);
        }
      } catch (err) {
        console.error(`[RSO] Failed to get account from ${region}:`, err);
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch account information' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('[RSO] Error fetching user info:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const RIOT_CLIENT_ID = process.env.RIOT_CLIENT_ID || process.env.NEXT_PUBLIC_RIOT_CLIENT_ID || '';
const RIOT_CLIENT_SECRET = process.env.RIOT_CLIENT_SECRET || '';
const RIOT_AUTH_URL = 'https://auth.riotgames.com';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle errors from Riot Sign On
    if (error) {
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
    }

    // Verify state (CSRF protection)
    if (!state) {
      return NextResponse.redirect(new URL('/?error=missing_state', request.url));
    }

    // Validate authorization code
    if (!code) {
      return NextResponse.redirect(new URL('/?error=missing_code', request.url));
    }

    // Validate client credentials
    if (!RIOT_CLIENT_ID || !RIOT_CLIENT_SECRET) {
      console.error('[RSO] Missing client credentials');
      return NextResponse.redirect(new URL('/?error=server_config_error', request.url));
    }

    // Get redirect URI
    const redirectUri = `${request.nextUrl.origin}/api/auth/riot/callback`;

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(`${RIOT_AUTH_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${RIOT_CLIENT_ID}:${RIOT_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[RSO] Token exchange failed:', tokenResponse.status, errorText);
      return NextResponse.redirect(new URL(`/?error=token_exchange_failed`, request.url));
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, id_token, expires_in } = tokenData;

    if (!access_token) {
      return NextResponse.redirect(new URL('/?error=no_access_token', request.url));
    }

    // Get user account info using access token
    // Try different regions to find the user
    const regions = ['americas', 'europe', 'asia'];
    let accountInfo = null;

    for (const region of regions) {
      try {
        const accountResponse = await fetch(
          `https://${region}.api.riotgames.com/riot/account/v1/accounts/me`,
          {
            headers: {
              'Authorization': `Bearer ${access_token}`,
            },
          }
        );

        if (accountResponse.ok) {
          accountInfo = await accountResponse.json();
          break;
        }
      } catch (err) {
        console.error(`[RSO] Failed to get account from ${region}:`, err);
      }
    }

    if (!accountInfo) {
      return NextResponse.redirect(new URL('/?error=account_fetch_failed', request.url));
    }

    // Store tokens in HTTP-only cookies for security
    const cookieStore = await cookies();
    const expiresAt = new Date(Date.now() + (expires_in * 1000));

    cookieStore.set('riot_access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    if (refresh_token) {
      cookieStore.set('riot_refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        path: '/',
      });
    }

    // Redirect to player dashboard
    const { gameName, tagLine } = accountInfo;
    return NextResponse.redirect(
      new URL(`/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, request.url)
    );
  } catch (error: any) {
    console.error('[RSO] Callback error:', error);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error.message || 'unknown_error')}`, request.url)
    );
  }
}


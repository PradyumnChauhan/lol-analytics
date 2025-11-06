import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Clear authentication cookies
    cookieStore.delete('riot_access_token');
    cookieStore.delete('riot_refresh_token');

    // Redirect to home page
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error: any) {
    console.error('[RSO] Logout error:', error);
    return NextResponse.redirect(new URL('/?error=logout_failed', request.url));
  }
}


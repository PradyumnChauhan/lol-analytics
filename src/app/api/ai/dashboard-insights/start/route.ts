import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/utils/backend-url';

/**
 * Start async job for dashboard insights
 * Returns immediately with job ID to avoid gateway timeout
 */
export async function POST(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    
    if (!backendUrl || backendUrl.trim() === '') {
      return NextResponse.json(
        { error: 'Backend URL is not configured' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    
    console.log('[API Route] Starting async dashboard insights job:', {
      backendUrl,
      hasPlayerData: !!body.playerData,
      timestamp: new Date().toISOString()
    });
    
    const response = await fetch(`${backendUrl}/api/ai/dashboard-insights/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.error || `Failed to start job: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to start job';
    console.error('[API Route] Failed to start job:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


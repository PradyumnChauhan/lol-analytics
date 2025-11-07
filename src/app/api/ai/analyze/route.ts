import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/utils/backend-url';

/**
 * Proxy endpoint for AI analyze
 * Proxies requests to backend to avoid mixed-content issues (HTTPS -> HTTP)
 */
export async function POST(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    const body = await request.json();
    
    console.log('[API Route] AI Analyze request:', {
      backendUrl,
      hasPlayerData: !!body.playerData,
      hasMatchData: !!body.matchData,
      analysisType: body.analysisType,
      timestamp: new Date().toISOString()
    });

    // Helper function to create timeout signal
    const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), timeoutMs);
      return controller.signal;
    };

    const startTime = Date.now();
    const response = await fetch(`${backendUrl}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      },
      body: JSON.stringify(body),
      signal: createTimeoutSignal(60000), // 60 second timeout for AI requests
    });

    const duration = Date.now() - startTime;
    console.log('[API Route] AI Analyze response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[API Route] AI Analyze error:', {
        status: response.status,
        errorData
      });
      return NextResponse.json(
        { error: errorData.error || `Failed to analyze: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    } : { error: String(error) };
    
    console.error('[API Route] AI Analyze error:', {
      backendUrl: getBackendUrl(),
      ...errorDetails,
      timestamp: new Date().toISOString()
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}


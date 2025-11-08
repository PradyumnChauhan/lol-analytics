import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/utils/backend-url';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ puuid: string }> }
) {
  let puuid = '';
  let region = 'na1';
  
  try {
    const params = await context.params;
    puuid = params.puuid;
    const { searchParams } = new URL(request.url);
    region = searchParams.get('region') || 'na1';
    
    const backendUrl = getBackendUrl();
    
    console.log('[API Route] Champion Mastery Score fetch started:', {
      puuid,
      region,
      backendUrl,
      timestamp: new Date().toISOString()
    });

    // Helper function to create timeout signal
    const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), timeoutMs);
      return controller.signal;
    };

    // Helper function to fetch with retry
    const fetchWithRetry = async (url: string, retries = 2, endpointName = 'unknown'): Promise<Response> => {
      const fullUrl = url.startsWith('http') ? url : `${backendUrl}${url.startsWith('/') ? url : '/' + url}`;
      
      for (let i = 0; i <= retries; i++) {
        try {
          const startTime = Date.now();
          const response = await fetch(fullUrl, {
            headers: {
              'Connection': 'keep-alive',
            },
            signal: createTimeoutSignal(30000),
          });
          
          const duration = Date.now() - startTime;
          console.log(`[fetchWithRetry] ${endpointName} success:`, {
            url: fullUrl,
            status: response.status,
            ok: response.ok,
            attempt: i + 1,
            duration: `${duration}ms`,
          });
          
          return response;
        } catch (error) {
          const errorDetails = error instanceof Error ? {
            message: error.message,
            name: error.name,
            code: (error as { code?: string }).code,
          } : { error: String(error) };
          
          console.error(`[fetchWithRetry] ${endpointName} error (attempt ${i + 1}/${retries + 1}):`, {
            url: fullUrl,
            ...errorDetails,
          });
          
          if (i === retries) {
            throw error;
          }
          
          const delay = 1000 * (i + 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      throw new Error('Failed to fetch after retries');
    };

    const response = await fetchWithRetry(
      `${backendUrl}/api/champion-mastery/v4/scores/by-puuid/${puuid}?region=${region}`,
      2,
      'ChampionMasteryScore'
    );
    
    if (!response.ok) {
      console.error('[API Route] Champion mastery score fetch failed:', {
        status: response.status,
        statusText: response.statusText
      });
      return NextResponse.json(
        { message: `Failed to fetch mastery score: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('[API Route] Champion mastery score fetched successfully');
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      name: error.name,
      code: (error as { code?: string }).code,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    } : { error: String(error) };
    
    console.error('[API Route] Error fetching champion mastery score:', {
      puuid,
      region,
      backendUrl: getBackendUrl(),
      ...errorDetails,
      timestamp: new Date().toISOString()
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch champion mastery score';
    return NextResponse.json(
      { 
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}


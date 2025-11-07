import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/utils/backend-url';

/**
 * Proxy endpoint for AI dashboard insights
 * Proxies requests to backend to avoid mixed-content issues (HTTPS -> HTTP)
 */
export async function POST(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    const body = await request.json();
    
    console.log('[API Route] AI Dashboard Insights request:', {
      backendUrl,
      hasPlayerData: !!body.playerData,
      timestamp: new Date().toISOString()
    });

    // Helper function to create timeout signal
    const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), timeoutMs);
      return controller.signal;
    };

    const startTime = Date.now();
    const response = await fetch(`${backendUrl}/api/ai/dashboard-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      },
      body: JSON.stringify(body),
      signal: createTimeoutSignal(60000), // 60 second timeout for AI requests
    });

    const duration = Date.now() - startTime;
    console.log('[API Route] AI Dashboard Insights response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[API Route] AI Dashboard Insights error:', {
        status: response.status,
        errorData
      });
      return NextResponse.json(
        { error: errorData.error || `Failed to fetch dashboard insights: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Validate structured response format
    if (data.insights && Array.isArray(data.insights)) {
      console.log('[API Route] Received structured insights response:', {
        insightCount: data.insights.length,
        availableCount: data.insights.filter((i: { available?: boolean }) => i.available !== false).length
      });
      
      // Ensure all insights have required fields
      const validatedInsights = data.insights.map((insight: unknown) => {
        if (typeof insight === 'object' && insight !== null) {
          const i = insight as Record<string, unknown>;
          return {
            type: i.type || 'unknown',
            title: i.title || 'Insight',
            textInsights: i.textInsights || '',
            visualData: i.visualData || { chartType: 'bar', data: [] },
            available: i.available !== false,
          };
        }
        return null;
      }).filter(Boolean);
      
      return NextResponse.json({
        ...data,
        insights: validatedInsights,
      });
    }
    
    // Legacy format - return as is for backward compatibility
    console.log('[API Route] Received legacy text insights response');
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    } : { error: String(error) };
    
    console.error('[API Route] AI Dashboard Insights error:', {
      backendUrl: getBackendUrl(),
      ...errorDetails,
      timestamp: new Date().toISOString()
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch AI dashboard insights';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}


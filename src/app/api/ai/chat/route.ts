import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/utils/backend-url';

/**
 * Proxy endpoint for AI chat
 * Proxies requests to backend to avoid mixed-content issues (HTTPS -> HTTP)
 */
export async function POST(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    const body = await request.json();
    
    console.log('[API Route] AI Chat request:', {
      backendUrl,
      hasPlayerData: !!body.playerData,
      hasQuestion: !!body.question,
      timestamp: new Date().toISOString()
    });

    // Helper function to create timeout signal
    const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), timeoutMs);
      return controller.signal;
    };

    const startTime = Date.now();
    // Add stream flag for chat requests
    const requestBody = {
      ...body,
      stream: true, // Enable streaming for chat
    };
    
    const response = await fetch(`${backendUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      },
      body: JSON.stringify(requestBody),
      signal: createTimeoutSignal(60000), // 60 second timeout for AI requests
    });

    const duration = Date.now() - startTime;
    console.log('[API Route] AI Chat response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      duration: `${duration}ms`,
      contentType: response.headers.get('content-type'),
      timestamp: new Date().toISOString()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[API Route] AI Chat error:', {
        status: response.status,
        errorData
      });
      return NextResponse.json(
        { error: errorData.error || `Failed to process question: ${response.status}` },
        { status: response.status }
      );
    }

    // Check if response is streaming (SSE)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/event-stream')) {
      // Return streaming response
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          
          if (!reader) {
            controller.close();
            return;
          }
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                controller.close();
                break;
              }
              
              const chunk = decoder.decode(value, { stream: true });
              controller.enqueue(new TextEncoder().encode(chunk));
            }
          } catch (error) {
            console.error('[API Route] Stream error:', error);
            controller.error(error);
          }
        }
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    } else {
      // Non-streaming response
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error: unknown) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    } : { error: String(error) };
    
    console.error('[API Route] AI Chat error:', {
      backendUrl: getBackendUrl(),
      ...errorDetails,
      timestamp: new Date().toISOString()
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process AI chat';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}


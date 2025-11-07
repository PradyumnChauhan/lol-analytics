import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/utils/backend-url';

/**
 * Test endpoint to verify backend connectivity
 * Access at: /api/backend-test
 */
export async function GET(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    
    console.log('[Backend Test] Starting backend connectivity test:', {
      backendUrl,
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      allEnvVars: Object.keys(process.env).filter(k => k.includes('BACKEND'))
    });

    // Test 1: Check if backend URL is accessible
    const testUrl = `${backendUrl}/health`;
    console.log('[Backend Test] Testing backend health endpoint:', { url: testUrl });
    
    const startTime = Date.now();
    let response: Response;
    let responseTime: number;
    
    try {
      response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Connection': 'keep-alive',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      responseTime = Date.now() - startTime;
      
      console.log('[Backend Test] Health check response:', {
        url: testUrl,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        responseTime: `${responseTime}ms`,
        headers: Object.fromEntries(response.headers.entries())
      });
    } catch (fetchError) {
      responseTime = Date.now() - startTime;
      const errorDetails = fetchError instanceof Error ? {
        message: fetchError.message,
        name: fetchError.name,
        cause: fetchError.cause
      } : { error: String(fetchError) };
      
      console.error('[Backend Test] Health check failed:', {
        url: testUrl,
        responseTime: `${responseTime}ms`,
        ...errorDetails
      });
      
      return NextResponse.json({
        success: false,
        backendUrl,
        error: 'Failed to connect to backend',
        details: errorDetails,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Try to get response body
    let responseBody: unknown = null;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
    } catch {
      // Ignore body parsing errors
    }

    return NextResponse.json({
      success: response.ok,
      backendUrl,
      healthCheck: {
        url: testUrl,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        responseTime: `${responseTime}ms`,
        responseBody
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasBackendUrl: !!process.env.NEXT_PUBLIC_BACKEND_URL,
        backendUrlValue: process.env.NEXT_PUBLIC_BACKEND_URL || 'not set'
      },
      timestamp: new Date().toISOString()
    }, {
      status: response.ok ? 200 : 500
    });
  } catch (error: unknown) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    } : { error: String(error) };
    
    console.error('[Backend Test] Unexpected error:', {
      ...errorDetails,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: false,
      error: 'Unexpected error during backend test',
      details: errorDetails,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}


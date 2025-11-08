import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/utils/backend-url';

/**
 * Test endpoint to verify backend connectivity
 * Access at: /api/backend-test
 */
export async function GET() {
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
      // Try to fetch with detailed error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Connection': 'keep-alive',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
      
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
        code: (fetchError as { code?: string }).code,
        errno: (fetchError as { errno?: number }).errno,
        syscall: (fetchError as { syscall?: string }).syscall,
        cause: fetchError.cause,
        stack: fetchError.stack?.split('\n').slice(0, 5).join('\n')
      } : { error: String(fetchError) };
      
      console.error('[Backend Test] Health check failed:', {
        url: testUrl,
        backendUrl,
        responseTime: `${responseTime}ms`,
        ...errorDetails
      });
      
      // Provide helpful error messages based on error code
      let errorMessage = 'Failed to connect to backend';
      if (errorDetails.code === 'ECONNREFUSED') {
        errorMessage = 'Backend server is not running or not accessible. Check if the server is running on the specified URL.';
      } else if (errorDetails.code === 'ETIMEDOUT' || errorDetails.code === 'ENOTFOUND') {
        errorMessage = 'Backend server is not reachable. Check the backend URL and network connectivity.';
      } else if (errorDetails.code === 'ECONNRESET') {
        errorMessage = 'Connection to backend was reset. The server may be overloaded or the connection was interrupted.';
      }
      
      return NextResponse.json({
        success: false,
        backendUrl,
        error: errorMessage,
        details: errorDetails,
        troubleshooting: {
          checkBackendRunning: 'Verify the backend server is running on ' + backendUrl,
          checkNetwork: 'Check if the backend is accessible from this server',
          checkFirewall: 'Verify firewall/security group allows connections',
          checkUrl: 'Ensure the backend URL is correct'
        },
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


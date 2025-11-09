import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/utils/backend-url';

/**
 * Proxy endpoint for AI dashboard insights
 * Proxies requests to backend to avoid mixed-content issues (HTTPS -> HTTP)
 * 
 * This endpoint can take up to 15 minutes to process, so we configure
 * the route to allow extended execution time.
 */
export const maxDuration = 900; // 15 minutes in seconds
export const runtime = 'nodejs'; // Use Node.js runtime for longer timeouts
export const dynamic = 'force-dynamic'; // Ensure dynamic rendering

export async function POST(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    
    // Validate backend URL
    if (!backendUrl || backendUrl.trim() === '') {
      console.error('[API Route] Backend URL is not configured');
      return NextResponse.json(
        { 
          error: 'Backend URL is not configured. Please set NEXT_PUBLIC_BACKEND_URL environment variable.',
        },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        }
      );
    }
    
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
    // Dashboard insights can take up to 15 minutes (Lambda timeout)
    // Set timeout to 15 minutes (900000ms) to match Lambda configuration
    let response: Response | null = null;
    
    // Retry configuration for AI processing
    // AWS Bedrock AI can take 5-15 minutes to analyze data, so we wait 5 minutes between retries
    const maxRetries = 3;
    const retryDelay = 5 * 60 * 1000; // 5 minutes - appropriate for AI processing
    let lastError: Error | null = null;
    
    try {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[API Route] Attempt ${attempt}/${maxRetries} to connect to backend:`, {
            backendUrl: `${backendUrl}/api/ai/dashboard-insights`,
            timestamp: new Date().toISOString()
          });

          // Make the actual request with proper configuration
          // Simplified to match working routes - removed invalid options that cause UND_ERR_INVALID_ARG
          response = await fetch(`${backendUrl}/api/ai/dashboard-insights`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Connection': 'keep-alive',
            },
            body: JSON.stringify(body),
            signal: createTimeoutSignal(900000), // 15 minutes (900000ms)
          });
          
          // If we got a response (even if not ok), break out of retry loop
          console.log(`[API Route] Successfully connected to backend on attempt ${attempt}:`, {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });
          break;
          
        } catch (fetchError) {
          lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
          
          console.error(`[API Route] Attempt ${attempt}/${maxRetries} failed:`, {
            error: lastError.message,
            name: lastError.name,
            backendUrl,
            timestamp: new Date().toISOString()
          });
          
          // If this is the last attempt, throw the error
          if (attempt === maxRetries) {
            throw lastError;
          }
          
          // Wait before retrying - fixed 5-minute delay for AI processing
          // AI analysis can take 5-15 minutes, so we wait 5 minutes before retrying
          console.log(`[API Route] Retrying in ${retryDelay / 1000 / 60} minutes (${retryDelay}ms)...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
      
      // If we still don't have a response after retries, throw error
      if (!response) {
        throw lastError || new Error('Failed to get response from backend after retries');
      }
    } catch (fetchError) {
      // Handle network errors (fetch failed) with detailed analysis
      const networkError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
      
      // Detailed error analysis for production debugging
      const errorAnalysis = {
        errorType: 'Unknown network error',
        errorDetails: '',
        possibleCauses: [] as string[],
        suggestedActions: [] as string[],
        technicalDetails: {
          message: networkError.message,
          name: networkError.name,
          cause: networkError.cause,
        }
      };
      
      if (networkError.name === 'AbortError') {
        errorAnalysis.errorType = 'Request timeout';
        errorAnalysis.errorDetails = 'The request exceeded the maximum timeout duration.';
        errorAnalysis.possibleCauses = [
          'Backend server is processing a very large request',
          'Network latency is extremely high',
          'Backend server is overloaded or unresponsive'
        ];
        errorAnalysis.suggestedActions = [
          'Check backend server logs for processing status',
          'Verify backend server is running and responsive',
          'Check network connectivity between frontend and backend',
          'Consider increasing timeout if processing legitimately takes longer'
        ];
      } else if (networkError.message.includes('ECONNREFUSED') || networkError.message.includes('connect ECONNREFUSED')) {
        errorAnalysis.errorType = 'Connection refused';
        errorAnalysis.errorDetails = 'The backend server refused the connection.';
        errorAnalysis.possibleCauses = [
          'Backend server is not running on the specified port',
          'Backend server is bound to localhost only (not accessible externally)',
          'Firewall or security group is blocking the connection',
          'Backend server crashed or is in an error state'
        ];
        errorAnalysis.suggestedActions = [
          'Verify backend server is running: Check server logs and process status',
          'Verify backend is listening on the correct IP and port',
          'Check firewall rules allow connections from Next.js server',
          'Test backend health endpoint directly: GET /health',
          'Verify BACKEND_URL environment variable is correct'
        ];
      } else if (networkError.message.includes('ENOTFOUND') || networkError.message.includes('getaddrinfo ENOTFOUND')) {
        errorAnalysis.errorType = 'DNS resolution failed';
        errorAnalysis.errorDetails = 'Could not resolve the backend hostname to an IP address.';
        errorAnalysis.possibleCauses = [
          'Backend URL hostname is incorrect or misspelled',
          'DNS server cannot resolve the hostname',
          'Backend server IP address has changed',
          'Network DNS configuration is incorrect'
        ];
        errorAnalysis.suggestedActions = [
          'Verify backend URL is correct in environment variables',
          'Try using IP address instead of hostname if DNS is unreliable',
          'Check DNS resolution: nslookup or dig for the hostname',
          'Verify backend server IP address has not changed'
        ];
      } else if (networkError.message.includes('ETIMEDOUT') || networkError.message.includes('timeout')) {
        errorAnalysis.errorType = 'Connection timeout';
        errorAnalysis.errorDetails = 'The connection attempt timed out before establishing a connection.';
        errorAnalysis.possibleCauses = [
          'Backend server is not responding',
          'Network path between frontend and backend is blocked',
          'Backend server is behind a firewall that is blocking connections',
          'Backend server IP address is incorrect'
        ];
        errorAnalysis.suggestedActions = [
          'Test network connectivity: ping or telnet to backend IP:port',
          'Check if backend server is accessible from Next.js server network',
          'Verify security groups/firewall rules allow inbound connections',
          'Check backend server logs for connection attempts'
        ];
      } else if (networkError.message.includes('fetch failed') || networkError.message.includes('Failed to fetch')) {
        errorAnalysis.errorType = 'Network connection failed';
        errorAnalysis.errorDetails = 'Failed to establish a network connection to the backend server.';
        errorAnalysis.possibleCauses = [
          'Backend server is not accessible from Next.js server network',
          'Network routing issue between frontend and backend',
          'Backend server is down or not responding',
          'SSL/TLS certificate issues (if using HTTPS)',
          'Proxy or load balancer configuration issue'
        ];
        errorAnalysis.suggestedActions = [
          'Verify backend server is running and accessible',
          'Test direct connection: curl or wget to backend URL',
          'Check network connectivity from Next.js server to backend',
          'Verify backend URL format is correct (http:// or https://)',
          'Check if backend requires authentication or special headers',
          'Review backend server logs for connection errors',
          'Verify CORS configuration allows requests from Next.js origin'
        ];
      }
      
      // Log comprehensive error information
      console.error('[API Route] Fetch failed - Detailed Analysis:', {
        backendUrl,
        errorAnalysis,
        stack: networkError instanceof Error ? networkError.stack?.split('\n').slice(0, 5).join('\n') : undefined,
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          backendUrlEnv: process.env.BACKEND_URL || 'not set',
          nextPublicBackendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'not set',
        }
      });
      
      // Return detailed error response for production
      return NextResponse.json(
        { 
          error: `${errorAnalysis.errorType}: ${errorAnalysis.errorDetails}`,
          isTimeout: networkError.name === 'AbortError',
          errorType: errorAnalysis.errorType,
          analysis: {
            possibleCauses: errorAnalysis.possibleCauses,
            suggestedActions: errorAnalysis.suggestedActions,
            technicalDetails: process.env.NODE_ENV === 'development' ? errorAnalysis.technicalDetails : undefined,
          },
          backendUrl: process.env.NODE_ENV === 'development' ? backendUrl : undefined,
          timestamp: new Date().toISOString(),
        },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Error-Type': errorAnalysis.errorType,
          }
        }
      );
    }

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
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      cause: error.cause
    } : { error: String(error) };
    
    const backendUrl = getBackendUrl();
    
    console.error('[API Route] AI Dashboard Insights error:', {
      backendUrl,
      ...errorDetails,
      timestamp: new Date().toISOString()
    });
    
    // Determine error message
    let errorMessage = 'Failed to fetch AI dashboard insights';
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = `Network error: ${error.message}. Please check if the backend is accessible at ${backendUrl}`;
      } else if (error.message.includes('JSON')) {
        errorMessage = `Invalid response format: ${error.message}`;
      } else {
        errorMessage = error.message;
      }
    }
    
    // Check if it's a timeout error
    const isTimeout = error instanceof Error && (
      error.name === 'AbortError' || 
      error.message.includes('timeout') || 
      error.message.includes('Gateway Timeout') ||
      error.message.includes('aborted')
    );
    
    return NextResponse.json(
      { 
        error: errorMessage,
        isTimeout,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { 
        status: isTimeout ? 504 : 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );
  }
}


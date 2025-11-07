/**
 * Utility function to get the backend URL
 * Works in both client-side and server-side contexts
 */
export function getBackendUrl(): string {
  let backendUrl: string;
  const isServer = typeof window === 'undefined';
  
  // Server-side: can use BACKEND_URL or NEXT_PUBLIC_BACKEND_URL
  if (isServer) {
    backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    console.log('[getBackendUrl] Server-side:', {
      BACKEND_URL: process.env.BACKEND_URL || 'not set',
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'not set',
      resolved: backendUrl,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('BACKEND') || k.includes('BACKEND_URL'))
    });
  } else {
    // Client-side: must use NEXT_PUBLIC_ prefix
    backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    console.log('[getBackendUrl] Client-side:', {
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'not set',
      resolved: backendUrl,
      windowLocation: typeof window !== 'undefined' ? window.location.origin : 'N/A'
    });
  }
  
  return backendUrl;
}

/**
 * Get frontend URL for redirects and links
 */
export function getFrontendUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
}


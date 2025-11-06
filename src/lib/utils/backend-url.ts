/**
 * Utility function to get the backend URL
 * Works in both client-side and server-side contexts
 */
export function getBackendUrl(): string {
  // Server-side: can use BACKEND_URL or NEXT_PUBLIC_BACKEND_URL
  if (typeof window === 'undefined') {
    return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  }
  
  // Client-side: must use NEXT_PUBLIC_ prefix
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
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


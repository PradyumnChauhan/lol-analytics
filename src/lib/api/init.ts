import { initializeApiClient, initializeRateLimiter } from './index';
import type { Region } from '@/types/riot-api';

/**
 * Initialize the Riot Games API client with proper configuration
 * This should be called once when the application starts
 */
export function initializeRiotAPI(config: {
  apiKey: string;
  region?: Region;
  isProduction?: boolean;
}) {
  const { apiKey, region = 'na1', isProduction = false } = config;

  if (!apiKey) {
    throw new Error('Riot Games API key is required. Please set NEXT_PUBLIC_RIOT_API_KEY in your environment variables.');
  }

  // Initialize the API client
  const apiClient = initializeApiClient(apiKey, region);
  
  // Initialize rate limiter
  const rateLimiter = initializeRateLimiter(isProduction);

  console.log(`🎮 Riot API initialized for region: ${region}`);
  const status = rateLimiter.getStatus();
  console.log(`⚡ Rate limiting: ${isProduction ? 'Production' : 'Personal'} (${status.currentLimit.maxRequests} requests per ${status.currentLimit.windowMs / 1000}s)`);

  return {
    apiClient,
    rateLimiter,
    region,
    isProduction
  };
}

/**
 * Get the current API configuration from environment variables
 */
export function getAPIConfig() {
  const apiKey = process.env.NEXT_PUBLIC_RIOT_API_KEY;
  const region = (process.env.NEXT_PUBLIC_DEFAULT_REGION as Region) || 'na1';
  const isProduction = process.env.NODE_ENV === 'production';

  if (!apiKey) {
    console.warn('⚠️  NEXT_PUBLIC_RIOT_API_KEY not found in environment variables');
  }

  return {
    apiKey,
    region,
    isProduction,
    hasApiKey: !!apiKey
  };
}

/**
 * Auto-initialize API if environment variables are available
 */
export function autoInitializeAPI() {
  const config = getAPIConfig();
  
  if (config.hasApiKey && config.apiKey) {
    return initializeRiotAPI({
      apiKey: config.apiKey,
      region: config.region,
      isProduction: config.isProduction
    });
  }

  console.warn('⚠️  Could not auto-initialize Riot API - missing API key');
  return null;
}
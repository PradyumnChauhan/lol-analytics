import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { RiotApiResponse, Region, RegionalCluster } from '@/types/riot-api';

// Regional routing configuration
const REGIONAL_ENDPOINTS: Record<Region, string> = {
  na1: 'https://na1.api.riotgames.com',
  euw1: 'https://euw1.api.riotgames.com', 
  eun1: 'https://eun1.api.riotgames.com',
  kr: 'https://kr.api.riotgames.com',
  br1: 'https://br1.api.riotgames.com',
  la1: 'https://la1.api.riotgames.com',
  la2: 'https://la2.api.riotgames.com',
  oc1: 'https://oc1.api.riotgames.com',
  tr1: 'https://tr1.api.riotgames.com',
  ru: 'https://ru.api.riotgames.com',
  jp1: 'https://jp1.api.riotgames.com',
  ph2: 'https://ph2.api.riotgames.com',
  sg2: 'https://sg2.api.riotgames.com',
  th2: 'https://th2.api.riotgames.com',
  tw2: 'https://tw2.api.riotgames.com',
  vn2: 'https://vn2.api.riotgames.com',
};

const CLUSTER_ENDPOINTS: Record<RegionalCluster, string> = {
  americas: 'https://americas.api.riotgames.com',
  europe: 'https://europe.api.riotgames.com',
  asia: 'https://asia.api.riotgames.com',
  esports: 'https://esports.api.riotgames.com',
};

export class RiotApiClient {
  private regionalClient: AxiosInstance;
  private clusterClient: AxiosInstance;
  private apiKey: string;
  private region: Region;
  private cluster: RegionalCluster;

  constructor(apiKey: string, region: Region = 'na1') {
    this.apiKey = apiKey;
    this.region = region;
    this.cluster = this.getClusterFromRegion(region);

    // Validate API key format
    if (!apiKey || !apiKey.startsWith('RGAPI-')) {
      console.error('🚨 Invalid API key format. Riot API keys should start with "RGAPI-"');
      console.error('Current key:', apiKey?.substring(0, 10) + '...');
    }

    this.regionalClient = axios.create({
      baseURL: REGIONAL_ENDPOINTS[region],
      timeout: 10000,
      headers: {
        'X-Riot-Token': apiKey,
      },
    });

    this.clusterClient = axios.create({
      baseURL: CLUSTER_ENDPOINTS[this.cluster],
      timeout: 10000,
      headers: {
        'X-Riot-Token': apiKey,
      },
    });

    this.setupInterceptors();
  }

  private getClusterFromRegion(region: Region): RegionalCluster {
    const clusterMap: Record<Region, RegionalCluster> = {
      na1: 'americas',
      br1: 'americas',
      la1: 'americas',
      la2: 'americas',
      euw1: 'europe',
      eun1: 'europe',
      tr1: 'europe',
      ru: 'europe',
      kr: 'asia',
      jp1: 'asia',
      oc1: 'asia',
      ph2: 'asia',
      sg2: 'asia',
      th2: 'asia',
      tw2: 'asia',
      vn2: 'asia',
    };
    return clusterMap[region];
  }

  private setupInterceptors(): void {
    // Request interceptor for both clients
    const requestInterceptor = (config: InternalAxiosRequestConfig) => {
      console.log(`Making API request to: ${config.baseURL}${config.url}`);
      console.log(`Headers:`, config.headers);
      console.log(`Full URL: ${config.baseURL}${config.url}`);
      return config;
    };

    // Response interceptor for both clients
    const responseInterceptor = (response: AxiosResponse) => {
      return response;
    };

    const errorInterceptor = (error: AxiosError) => {
      if (error.response) {
        const status = error.response.status;
        const message = this.getErrorMessage(status);
        
        console.error(`Riot API Error ${status}: ${message}`);
        console.error('Request URL:', error.config?.url);
        console.error('Request Headers:', error.config?.headers);
        
        // Handle specific errors
        if (status === 403) {
          console.error('🚨 403 Forbidden Error - Possible causes:');
          console.error('1. Invalid API key (most common)');
          console.error('2. Blacklisted API key'); 
          console.error('3. Incorrect API path');
          console.error('💡 Solutions:');
          console.error('- Generate fresh API key: https://developer.riotgames.com/');
          console.error('- Verify summoner exists in selected region');
          console.error('- Check if API key is expired (personal keys expire every 24h)');
        }
        
        // Handle rate limiting
        if (status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          console.warn(`Rate limit exceeded. Retry after: ${retryAfter} seconds`);
        }
      }
      return Promise.reject(error);
    };

    // Apply interceptors to both clients
    [this.regionalClient, this.clusterClient].forEach(client => {
      client.interceptors.request.use(requestInterceptor);
      client.interceptors.response.use(responseInterceptor, errorInterceptor);
    });
  }

  private getErrorMessage(status: number): string {
    const errorMessages: Record<number, string> = {
      400: 'Bad request',
      401: 'Unauthorized - Invalid API key',
      403: 'Forbidden - API key lacks permission',
      404: 'Not found',
      405: 'Method not allowed',
      415: 'Unsupported media type',
      429: 'Rate limit exceeded',
      500: 'Internal server error',
      502: 'Bad gateway',
      503: 'Service unavailable',
      504: 'Gateway timeout',
    };
    return errorMessages[status] || 'Unknown error';
  }

  // Regional API requests (platform-specific data)
  async regionalRequest<T>(endpoint: string): Promise<RiotApiResponse<T>> {
    try {
      // For modern API, we use X-Riot-Token header (already set in axios config)
      // But also add api_key query parameter for compatibility
      const separator = endpoint.includes('?') ? '&' : '?';
      const endpointWithKey = `${endpoint}${separator}api_key=${this.apiKey}`;
      
      const response = await this.regionalClient.get<T>(endpointWithKey);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          error: this.getErrorMessage(error.response.status),
          status: error.response.status,
        };
      }
      return {
        error: 'Network error occurred',
        status: 500,
      };
    }
  }

  // Cluster API requests (cross-platform data like match history)
  async clusterRequest<T>(endpoint: string): Promise<RiotApiResponse<T>> {
    try {
      // For modern API, we use X-Riot-Token header (already set in axios config)
      // But also add api_key query parameter for compatibility
      const separator = endpoint.includes('?') ? '&' : '?';
      const endpointWithKey = `${endpoint}${separator}api_key=${this.apiKey}`;
      
      const response = await this.clusterClient.get<T>(endpointWithKey);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          error: this.getErrorMessage(error.response.status),
          status: error.response.status,
        };
      }
      return {
        error: 'Network error occurred',
        status: 500,
      };
    }
  }

  // Update region and recreate clients
  setRegion(region: Region): void {
    this.region = region;
    this.cluster = this.getClusterFromRegion(region);
    
    this.regionalClient = axios.create({
      baseURL: REGIONAL_ENDPOINTS[region],
      timeout: 10000,
      headers: {
        'X-Riot-Token': this.apiKey,
      },
    });

    this.clusterClient = axios.create({
      baseURL: CLUSTER_ENDPOINTS[this.cluster],
      timeout: 10000,
      headers: {
        'X-Riot-Token': this.apiKey,
      },
    });

    this.setupInterceptors();
  }

  // Getters
  getCurrentRegion(): Region {
    return this.region;
  }

  getCurrentCluster(): RegionalCluster {
    return this.cluster;
  }
}

// Export singleton instance
let apiClient: RiotApiClient | null = null;

export const initializeApiClient = (apiKey: string, region: Region = 'na1'): RiotApiClient => {
  apiClient = new RiotApiClient(apiKey, region);
  return apiClient;
};

export const getApiClient = (): RiotApiClient => {
  if (!apiClient) {
    throw new Error('API client not initialized. Call initializeApiClient() first.');
  }
  return apiClient;
};
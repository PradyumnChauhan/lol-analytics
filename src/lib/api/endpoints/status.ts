import { getApiClient } from '../client';
import type { RiotApiResponse } from '@/types/riot-api';

// Status API types
interface PlatformDataDto {
  id: string;
  name: string;
  locales: string[];
  maintenances: StatusDto[];
  incidents: StatusDto[];
}

interface StatusDto {
  id: number;
  maintenance_status: string;
  incident_severity: string;
  titles: ContentDto[];
  updates: UpdateDto[];
  created_at: string;
  archive_at?: string;
  updated_at?: string;
  platforms: string[];
}

interface ContentDto {
  locale: string;
  content: string;
}

interface UpdateDto {
  id: number;
  author: string;
  publish: boolean;
  publish_locations: string[];
  translations: ContentDto[];
  created_at: string;
  updated_at: string;
}

export class StatusAPI {
  private client = getApiClient();

  /**
   * Get League of Legends status for the given platform
   * @returns Promise<RiotApiResponse<PlatformDataDto>>
   */
  async getPlatformData(): Promise<RiotApiResponse<PlatformDataDto>> {
    return this.client.regionalRequest<PlatformDataDto>('/lol/status/v4/platform-data');
  }

  /**
   * Check if the platform is currently under maintenance
   * @returns Promise<boolean>
   */
  async isUnderMaintenance(): Promise<boolean> {
    const response = await this.getPlatformData();
    if (!response.data || response.error) {
      return false;
    }

    return response.data.maintenances.length > 0;
  }

  /**
   * Check if there are any active incidents
   * @returns Promise<boolean>
   */
  async hasActiveIncidents(): Promise<boolean> {
    const response = await this.getPlatformData();
    if (!response.data || response.error) {
      return false;
    }

    return response.data.incidents.length > 0;
  }

  /**
   * Get current platform status summary
   * @returns Promise with status summary
   */
  async getStatusSummary() {
    const response = await this.getPlatformData();
    
    if (!response.data || response.error) {
      return {
        isOnline: false,
        maintenanceCount: 0,
        incidentCount: 0,
        error: response.error
      };
    }

    const data = response.data;
    
    return {
      isOnline: data.maintenances.length === 0 && data.incidents.length === 0,
      maintenanceCount: data.maintenances.length,
      incidentCount: data.incidents.length,
      platformName: data.name,
      maintenances: data.maintenances,
      incidents: data.incidents,
      error: null
    };
  }

  /**
   * Get maintenance information
   * @returns Promise<StatusDto[]>
   */
  async getMaintenances(): Promise<StatusDto[]> {
    const response = await this.getPlatformData();
    return response.data?.maintenances || [];
  }

  /**
   * Get incident information
   * @returns Promise<StatusDto[]>
   */
  async getIncidents(): Promise<StatusDto[]> {
    const response = await this.getPlatformData();
    return response.data?.incidents || [];
  }
}

// Export singleton instance
export const statusAPI = new StatusAPI();
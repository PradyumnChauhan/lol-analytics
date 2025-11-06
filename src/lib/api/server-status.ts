// Server Status API Configuration
const RIOT_API_BASE_URL = 'https://na1.api.riotgames.com';

// LOL-STATUS-V4 API Types
export interface PlatformDataDto {
  id: string;
  name: string;
  locales: string[];
  maintenances: StatusDto[];
  incidents: StatusDto[];
}

export interface StatusDto {
  id: number;
  maintenance_status?: 'scheduled' | 'in_progress' | 'complete';
  incident_severity?: 'info' | 'warning' | 'critical';
  titles: ContentDto[];
  updates: UpdateDto[];
  created_at: string;
  archive_at?: string;
  updated_at: string;
  platforms: ('windows' | 'macos' | 'android' | 'ios' | 'ps4' | 'xbone' | 'switch')[];
}

export interface ContentDto {
  locale: string;
  content: string;
}

export interface UpdateDto {
  id: number;
  author: string;
  publish: boolean;
  publish_locations: ('riotclient' | 'riotstatus' | 'game')[];
  translations: ContentDto[];
  created_at: string;
  updated_at: string;
}

export interface ServerStatusSummary {
  platform: string;
  status: 'operational' | 'degraded' | 'maintenance' | 'incident';
  activeIncidents: number;
  activeMaintenance: number;
  lastUpdate: string;
  severity?: 'info' | 'warning' | 'critical';
}

class ServerStatusAPI {
  private async fetchWithAuth(endpoint: string): Promise<unknown> {
    const response = await fetch(`${RIOT_API_BASE_URL}${endpoint}`, {
      headers: {
        'X-Riot-Token': process.env.NEXT_PUBLIC_RIOT_API_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Server status API error: ${response.status}`);
    }

    return response.json();
  }

  // Get platform status data
  async getPlatformData(region: string = 'na1'): Promise<PlatformDataDto | null> {
    try {
      const data = await this.fetchWithAuth(`/lol/status/v4/platform-data?platform=${region}`);
      return data as PlatformDataDto;
    } catch (error) {
      console.error('Error fetching platform data:', error);
      return this.getMockPlatformData(region);
    }
  }

  // Get server status summary for all regions
  async getServerStatusSummary(): Promise<ServerStatusSummary[]> {
    const regions = ['na1', 'euw1', 'eun1', 'kr', 'jp1', 'br1', 'la1', 'la2', 'oc1', 'tr1', 'ru'];
    const summaries: ServerStatusSummary[] = [];

    for (const region of regions) {
      try {
        const platformData = await this.getPlatformData(region);
        if (platformData) {
          summaries.push(this.createStatusSummary(region, platformData));
        }
      } catch (error) {
        console.error(`Error fetching status for ${region}:`, error);
        // Add mock data for failed regions
        summaries.push(this.getMockStatusSummary(region));
      }
    }

    return summaries;
  }

  // Get active maintenance and incidents
  async getActiveIssues(region: string = 'na1'): Promise<{
    maintenance: StatusDto[];
    incidents: StatusDto[];
  }> {
    try {
      const platformData = await this.getPlatformData(region);
      if (!platformData) {
        return { maintenance: [], incidents: [] };
      }

      const activeMaintenance = platformData.maintenances.filter(
        m => m.maintenance_status === 'scheduled' || m.maintenance_status === 'in_progress'
      );

      const activeIncidents = platformData.incidents.filter(
        i => !i.archive_at || new Date(i.archive_at) > new Date()
      );

      return {
        maintenance: activeMaintenance,
        incidents: activeIncidents
      };
    } catch (error) {
      console.error('Error fetching active issues:', error);
      return { maintenance: [], incidents: [] };
    }
  }

  private createStatusSummary(region: string, data: PlatformDataDto): ServerStatusSummary {
    const activeIncidents = data.incidents.filter(
      i => !i.archive_at || new Date(i.archive_at) > new Date()
    );
    const activeMaintenance = data.maintenances.filter(
      m => m.maintenance_status === 'scheduled' || m.maintenance_status === 'in_progress'
    );

    let status: ServerStatusSummary['status'] = 'operational';
    let severity: 'info' | 'warning' | 'critical' | undefined;

    if (activeMaintenance.length > 0) {
      status = 'maintenance';
    } else if (activeIncidents.length > 0) {
      status = 'incident';
      const criticalIncidents = activeIncidents.filter(i => i.incident_severity === 'critical');
      const warningIncidents = activeIncidents.filter(i => i.incident_severity === 'warning');
      
      if (criticalIncidents.length > 0) {
        severity = 'critical';
      } else if (warningIncidents.length > 0) {
        severity = 'warning';
      } else {
        severity = 'info';
      }
    }

    return {
      platform: region.toUpperCase(),
      status,
      activeIncidents: activeIncidents.length,
      activeMaintenance: activeMaintenance.length,
      lastUpdate: new Date().toISOString(),
      severity
    };
  }

  private getMockPlatformData(region: string): PlatformDataDto {
    return {
      id: region,
      name: this.getRegionName(region),
      locales: ['en_US'],
      maintenances: [],
      incidents: region === 'na1' ? [this.getMockIncident()] : []
    };
  }

  private getMockStatusSummary(region: string): ServerStatusSummary {
    const isNA = region === 'na1';
    return {
      platform: region.toUpperCase(),
      status: isNA ? 'incident' : 'operational',
      activeIncidents: isNA ? 1 : 0,
      activeMaintenance: 0,
      lastUpdate: new Date().toISOString(),
      severity: isNA ? 'warning' : undefined
    };
  }

  private getMockIncident(): StatusDto {
    return {
      id: 1001,
      incident_severity: 'warning',
      titles: [{
        locale: 'en_US',
        content: 'Ranked Queue Issues'
      }],
      updates: [{
        id: 1,
        author: 'Riot Games',
        publish: true,
        publish_locations: ['riotstatus', 'game'],
        translations: [{
          locale: 'en_US',
          content: 'We are currently investigating issues with ranked queue. Some players may experience login difficulties.'
        }],
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }],
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      platforms: ['windows', 'macos']
    };
  }

  private getRegionName(region: string): string {
    const regionNames: Record<string, string> = {
      'na1': 'North America',
      'euw1': 'Europe West',
      'eun1': 'Europe Nordic & East',
      'kr': 'Korea',
      'jp1': 'Japan',
      'br1': 'Brazil',
      'la1': 'Latin America North',
      'la2': 'Latin America South',
      'oc1': 'Oceania',
      'tr1': 'Turkey',
      'ru': 'Russia'
    };
    return regionNames[region] || region.toUpperCase();
  }
}

export const serverStatusAPI = new ServerStatusAPI();
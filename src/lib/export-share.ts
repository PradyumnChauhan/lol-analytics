// Export and sharing utilities

export interface ExportFormat {
  format: 'json' | 'csv' | 'pdf' | 'image';
  data: unknown;
  filename: string;
}

export interface ShareableProfile {
  summoner: {
    name: string;
    level: number;
    rank: string;
    region: string;
  };
  stats: {
    winRate: number;
    kda: number;
    mainRole: string;
    favoriteChampions: string[];
  };
  achievements: string[];
  matchHistory: Array<{
    champion: string;
    result: 'Win' | 'Loss';
    kda: string;
    date: string;
  }>;
  createdAt: string;
}

export interface ComparisonData {
  player1: ShareableProfile;
  player2: ShareableProfile;
  comparison: {
    winRate: { player1: number; player2: number; winner: 'player1' | 'player2' | 'tie' };
    kda: { player1: number; player2: number; winner: 'player1' | 'player2' | 'tie' };
    rank: { player1: string; player2: string; winner: 'player1' | 'player2' | 'tie' };
    level: { player1: number; player2: number; winner: 'player1' | 'player2' | 'tie' };
  };
}

class ExportShareService {
  // Export match history to various formats
  async exportMatchHistory(matches: unknown[], format: 'json' | 'csv' = 'json'): Promise<ExportFormat> {
    const processedData = this.processMatchHistory(matches);
    
    if (format === 'csv') {
      const csvData = this.convertToCSV(processedData);
      return {
        format: 'csv',
        data: csvData,
        filename: `match_history_${new Date().toISOString().split('T')[0]}.csv`
      };
    }

    return {
      format: 'json',
      data: processedData,
      filename: `match_history_${new Date().toISOString().split('T')[0]}.json`
    };
  }

  // Export player statistics
  async exportPlayerStats(playerData: unknown, format: 'json' | 'csv' = 'json'): Promise<ExportFormat> {
    const processedStats = this.processPlayerStats(playerData);
    
    if (format === 'csv') {
      const csvData = this.convertStatsToCSV(processedStats);
      return {
        format: 'csv',
        data: csvData,
        filename: `player_stats_${new Date().toISOString().split('T')[0]}.csv`
      };
    }

    return {
      format: 'json',
      data: processedStats,
      filename: `player_stats_${new Date().toISOString().split('T')[0]}.json`
    };
  }

  // Create shareable profile
  async createShareableProfile(
    _summonerData: unknown,
    _matchHistory: unknown[],
    _statsData: unknown
  ): Promise<ShareableProfile> {
    // Process the data into a shareable format
    const mockProfile: ShareableProfile = {
      summoner: {
        name: 'Sample Summoner',
        level: 145,
        rank: 'Gold II',
        region: 'NA'
      },
      stats: {
        winRate: 0.65,
        kda: 2.8,
        mainRole: 'ADC',
        favoriteChampions: ['Jinx', 'Ashe', 'Caitlyn']
      },
      achievements: [
        'First Blood Master',
        'Team Player',
        'Late Game Carry',
        'Vision Control Expert'
      ],
      matchHistory: [
        { champion: 'Jinx', result: 'Win', kda: '12/3/8', date: '2024-01-15' },
        { champion: 'Ashe', result: 'Win', kda: '8/2/15', date: '2024-01-14' },
        { champion: 'Caitlyn', result: 'Loss', kda: '6/4/7', date: '2024-01-13' },
        { champion: 'Jinx', result: 'Win', kda: '15/1/6', date: '2024-01-12' },
        { champion: 'Ashe', result: 'Win', kda: '9/3/12', date: '2024-01-11' }
      ],
      createdAt: new Date().toISOString()
    };

    return mockProfile;
  }

  // Generate comparison between two players
  async compareProfiles(profile1: ShareableProfile, profile2: ShareableProfile): Promise<ComparisonData> {
    return {
      player1: profile1,
      player2: profile2,
      comparison: {
        winRate: {
          player1: profile1.stats.winRate,
          player2: profile2.stats.winRate,
          winner: profile1.stats.winRate > profile2.stats.winRate ? 'player1' : 
                  profile2.stats.winRate > profile1.stats.winRate ? 'player2' : 'tie'
        },
        kda: {
          player1: profile1.stats.kda,
          player2: profile2.stats.kda,
          winner: profile1.stats.kda > profile2.stats.kda ? 'player1' : 
                  profile2.stats.kda > profile1.stats.kda ? 'player2' : 'tie'
        },
        rank: {
          player1: profile1.summoner.rank,
          player2: profile2.summoner.rank,
          winner: this.compareRanks(profile1.summoner.rank, profile2.summoner.rank)
        },
        level: {
          player1: profile1.summoner.level,
          player2: profile2.summoner.level,
          winner: profile1.summoner.level > profile2.summoner.level ? 'player1' : 
                  profile2.summoner.level > profile1.summoner.level ? 'player2' : 'tie'
        }
      }
    };
  }

  // Download file to user's device
  downloadFile(exportData: ExportFormat): void {
    let content: string;
    let mimeType: string;

    switch (exportData.format) {
      case 'json':
        content = JSON.stringify(exportData.data, null, 2);
        mimeType = 'application/json';
        break;
      case 'csv':
        content = exportData.data as string;
        mimeType = 'text/csv';
        break;
      default:
        throw new Error(`Unsupported format: ${exportData.format}`);
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportData.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Generate shareable link
  generateShareableLink(profile: ShareableProfile): string {
    const encodedProfile = btoa(JSON.stringify(profile));
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lol-analytics.app';
    return `${baseUrl}/shared-profile?data=${encodedProfile}`;
  }

  // Parse shareable link data
  parseShareableLink(encodedData: string): ShareableProfile | null {
    try {
      const decodedData = atob(encodedData);
      return JSON.parse(decodedData) as ShareableProfile;
    } catch (error) {
      console.error('Error parsing shareable link:', error);
      return null;
    }
  }

  // Share on social media
  shareOnSocialMedia(platform: 'twitter' | 'discord' | 'reddit', profile: ShareableProfile): string {
    const shareUrl = this.generateShareableLink(profile);
    const message = `Check out my League of Legends stats! ${profile.summoner.rank} ${profile.summoner.name} with ${Math.round(profile.stats.winRate * 100)}% win rate and ${profile.stats.kda} KDA!`;

    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareUrl)}`;
      case 'discord':
        // Discord doesn't have a direct share URL, return formatted message
        return `${message} ${shareUrl}`;
      case 'reddit':
        return `https://reddit.com/submit?title=${encodeURIComponent(`My LoL Stats - ${profile.summoner.rank}`)}&url=${encodeURIComponent(shareUrl)}`;
      default:
        return shareUrl;
    }
  }

  // Generate image share (would require canvas/image generation library)
  async generateShareImage(_profile: ShareableProfile): Promise<string> {
    // Mock implementation - would generate actual image
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
  }

  private processMatchHistory(_matches: unknown[]): Array<{
    matchId: string;
    champion: string;
    result: string;
    kda: string;
    cs: number;
    damage: number;
    duration: string;
    date: string;
  }> {
    // Mock processing - would extract actual match data
    return [
      {
        matchId: 'NA1_1234567890',
        champion: 'Jinx',
        result: 'Victory',
        kda: '12/3/8',
        cs: 185,
        damage: 25420,
        duration: '28:45',
        date: '2024-01-15T15:30:00Z'
      },
      {
        matchId: 'NA1_1234567891',
        champion: 'Ashe',
        result: 'Victory',
        kda: '8/2/15',
        cs: 172,
        damage: 22100,
        duration: '31:20',
        date: '2024-01-14T20:15:00Z'
      },
      {
        matchId: 'NA1_1234567892',
        champion: 'Caitlyn',
        result: 'Defeat',
        kda: '6/4/7',
        cs: 158,
        damage: 18750,
        duration: '25:10',
        date: '2024-01-13T18:45:00Z'
      }
    ];
  }

  private processPlayerStats(_playerData: unknown): {
    overall: {
      rank: string;
      lp: number;
      winRate: number;
      kda: number;
      averageCs: number;
      averageDamage: number;
      visionScore: number;
    };
    champions: Array<{
      name: string;
      gamesPlayed: number;
      winRate: number;
      kda: number;
      averageCs: number;
    }>;
    roles: Array<{
      role: string;
      gamesPlayed: number;
      winRate: number;
      kda: number;
    }>;
  } {
    // Mock processing - would extract actual player data
    return {
      overall: {
        rank: 'Gold II',
        lp: 75,
        winRate: 0.65,
        kda: 2.8,
        averageCs: 165,
        averageDamage: 22000,
        visionScore: 28
      },
      champions: [
        { name: 'Jinx', gamesPlayed: 45, winRate: 0.71, kda: 3.2, averageCs: 178 },
        { name: 'Ashe', gamesPlayed: 38, winRate: 0.68, kda: 2.9, averageCs: 172 },
        { name: 'Caitlyn', gamesPlayed: 32, winRate: 0.59, kda: 2.5, averageCs: 169 }
      ],
      roles: [
        { role: 'ADC', gamesPlayed: 95, winRate: 0.67, kda: 2.9 },
        { role: 'Support', gamesPlayed: 20, winRate: 0.60, kda: 2.1 }
      ]
    };
  }

  private convertToCSV(data: Array<Record<string, unknown>>): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape values containing commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  private convertStatsToCSV(stats: ReturnType<typeof this.processPlayerStats>): string {
    const rows = [
      // Overall stats
      ['Category', 'Metric', 'Value'],
      ['Overall', 'Rank', stats.overall.rank],
      ['Overall', 'LP', stats.overall.lp.toString()],
      ['Overall', 'Win Rate', `${Math.round(stats.overall.winRate * 100)}%`],
      ['Overall', 'KDA', stats.overall.kda.toString()],
      ['Overall', 'Average CS', stats.overall.averageCs.toString()],
      ['Overall', 'Average Damage', stats.overall.averageDamage.toString()],
      ['Overall', 'Vision Score', stats.overall.visionScore.toString()],
      [],
      // Champions
      ['Champions', 'Name', 'Games', 'Win Rate', 'KDA', 'Average CS'],
      ...stats.champions.map(champ => [
        'Champion',
        champ.name,
        champ.gamesPlayed.toString(),
        `${Math.round(champ.winRate * 100)}%`,
        champ.kda.toString(),
        champ.averageCs.toString()
      ]),
      [],
      // Roles
      ['Roles', 'Role', 'Games', 'Win Rate', 'KDA'],
      ...stats.roles.map(role => [
        'Role',
        role.role,
        role.gamesPlayed.toString(),
        `${Math.round(role.winRate * 100)}%`,
        role.kda.toString()
      ])
    ];

    return rows.map(row => row.join(',')).join('\n');
  }

  private compareRanks(rank1: string, rank2: string): 'player1' | 'player2' | 'tie' {
    const rankOrder = [
      'Iron IV', 'Iron III', 'Iron II', 'Iron I',
      'Bronze IV', 'Bronze III', 'Bronze II', 'Bronze I',
      'Silver IV', 'Silver III', 'Silver II', 'Silver I',
      'Gold IV', 'Gold III', 'Gold II', 'Gold I',
      'Platinum IV', 'Platinum III', 'Platinum II', 'Platinum I',
      'Diamond IV', 'Diamond III', 'Diamond II', 'Diamond I',
      'Master', 'Grandmaster', 'Challenger'
    ];

    const rank1Index = rankOrder.indexOf(rank1);
    const rank2Index = rankOrder.indexOf(rank2);

    if (rank1Index > rank2Index) return 'player1';
    if (rank2Index > rank1Index) return 'player2';
    return 'tie';
  }
}

export const exportShareService = new ExportShareService();
// Champion Rotation API Configuration
const RIOT_API_BASE_URL = 'https://na1.api.riotgames.com';

// Champion V3 API Types
export interface ChampionInfo {
  maxNewPlayerLevel: number;
  freeChampionIdsForNewPlayers: number[];
  freeChampionIds: number[];
}

export interface ChampionRotationData {
  currentRotation: ChampionInfo;
  rotationStart: string;
  rotationEnd: string;
  region: string;
}

export interface ChampionRotationHistory {
  id: string;
  startDate: string;
  endDate: string;
  freeChampionIds: number[];
  freeChampionIdsForNewPlayers: number[];
  region: string;
}

export interface ChampionBasicInfo {
  id: number;
  name: string;
  title: string;
  image: string;
  tags: string[];
  difficulty: number;
  blurb: string;
}

class ChampionRotationAPI {
  private async fetchWithAuth(endpoint: string): Promise<unknown> {
    const response = await fetch(`${RIOT_API_BASE_URL}${endpoint}`, {
      headers: {
        'X-Riot-Token': process.env.NEXT_PUBLIC_RIOT_API_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Champion rotation API error: ${response.status}`);
    }

    return response.json();
  }

  // Get current champion rotation
  async getCurrentRotation(region: string = 'na1'): Promise<ChampionRotationData | null> {
    try {
      const data = await this.fetchWithAuth(`/lol/platform/v3/champion-rotations`);
      const rotation = data as ChampionInfo;
      
      // Calculate rotation dates (rotations typically change on Tuesday)
      const today = new Date();
      const rotationStart = this.getRotationStartDate(today);
      const rotationEnd = new Date(rotationStart);
      rotationEnd.setDate(rotationEnd.getDate() + 7);

      return {
        currentRotation: rotation,
        rotationStart: rotationStart.toISOString(),
        rotationEnd: rotationEnd.toISOString(),
        region
      };
    } catch (error) {
      console.error('Error fetching champion rotation:', error);
      return this.getMockRotationData(region);
    }
  }

  // Get champion rotation for all regions
  async getAllRegionsRotation(): Promise<ChampionRotationData[]> {
    const regions = ['na1', 'euw1', 'eun1', 'kr', 'jp1', 'br1', 'la1', 'la2', 'oc1', 'tr1', 'ru'];
    const rotations: ChampionRotationData[] = [];

    for (const region of regions) {
      try {
        const rotation = await this.getCurrentRotation(region);
        if (rotation) {
          rotations.push(rotation);
        }
      } catch (error) {
        console.error(`Error fetching rotation for ${region}:`, error);
        // Add mock data for failed regions
        const mockRotation = this.getMockRotationData(region);
        if (mockRotation) {
          rotations.push(mockRotation);
        }
      }
    }

    return rotations;
  }

  // Get rotation history (mock implementation - would need database storage)
  async getRotationHistory(region: string = 'na1', weeks: number = 8): Promise<ChampionRotationHistory[]> {
    try {
      // In a real implementation, this would fetch from a database
      return this.getMockRotationHistory(region, weeks);
    } catch (error) {
      console.error('Error fetching rotation history:', error);
      return [];
    }
  }

  // Get champion basic information (mock data - would typically come from Data Dragon)
  async getChampionInfo(championIds: number[]): Promise<ChampionBasicInfo[]> {
    try {
      return this.getMockChampionInfo(championIds);
    } catch (error) {
      console.error('Error fetching champion info:', error);
      return [];
    }
  }

  // Check if champion is currently free
  async isChampionFree(championId: number, region: string = 'na1'): Promise<boolean> {
    try {
      const rotation = await this.getCurrentRotation(region);
      if (!rotation) return false;

      return rotation.currentRotation.freeChampionIds.includes(championId) ||
             rotation.currentRotation.freeChampionIdsForNewPlayers.includes(championId);
    } catch (error) {
      console.error('Error checking champion availability:', error);
      return false;
    }
  }

  private getRotationStartDate(date: Date): Date {
    const dayOfWeek = date.getDay();
    const daysToTuesday = (2 - dayOfWeek + 7) % 7;
    const rotationStart = new Date(date);
    
    if (daysToTuesday === 0 && date.getHours() < 12) {
      // If it's Tuesday morning, use this Tuesday
      return rotationStart;
    } else if (daysToTuesday === 0) {
      // If it's Tuesday afternoon/evening, use next Tuesday
      rotationStart.setDate(rotationStart.getDate() + 7);
    } else {
      // Otherwise, go back to the most recent Tuesday
      rotationStart.setDate(rotationStart.getDate() - daysToTuesday);
    }
    
    rotationStart.setHours(12, 0, 0, 0); // Rotations typically happen at noon
    return rotationStart;
  }

  private getMockRotationData(region: string): ChampionRotationData {
    const today = new Date();
    const rotationStart = this.getRotationStartDate(today);
    const rotationEnd = new Date(rotationStart);
    rotationEnd.setDate(rotationEnd.getDate() + 7);

    // Mock champion IDs for current rotation
    const freeChampionIds = [1, 22, 103, 157, 64, 99, 35, 91, 143, 115, 25, 267, 201, 76];
    const freeChampionIdsForNewPlayers = [222, 254, 427, 18, 19, 45, 25, 64, 102, 37];

    return {
      currentRotation: {
        maxNewPlayerLevel: 10,
        freeChampionIds,
        freeChampionIdsForNewPlayers
      },
      rotationStart: rotationStart.toISOString(),
      rotationEnd: rotationEnd.toISOString(),
      region
    };
  }

  private getMockRotationHistory(region: string, weeks: number): ChampionRotationHistory[] {
    const history: ChampionRotationHistory[] = [];
    const today = new Date();

    for (let i = 0; i < weeks; i++) {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - (i * 7) - 7);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      // Generate different champion IDs for each week
      const baseIds = [1, 22, 103, 157, 64, 99, 35, 91, 143, 115, 25, 267, 201, 76];
      const freeChampionIds = baseIds.map(id => id + (i * 10)).slice(0, 14);
      const freeChampionIdsForNewPlayers = [222, 254, 427, 18, 19, 45, 25, 64, 102, 37];

      history.push({
        id: `${region}-${startDate.toISOString().split('T')[0]}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        freeChampionIds,
        freeChampionIdsForNewPlayers,
        region
      });
    }

    return history;
  }

  private getMockChampionInfo(championIds: number[]): ChampionBasicInfo[] {
    const championData: Record<number, ChampionBasicInfo> = {
      1: { id: 1, name: 'Annie', title: 'the Dark Child', image: '/champions/annie.jpg', tags: ['Mage'], difficulty: 2, blurb: 'Dangerous, yet disarmingly precocious, Annie is a child mage with immense pyromantic power.' },
      22: { id: 22, name: 'Ashe', title: 'the Frost Archer', image: '/champions/ashe.jpg', tags: ['Marksman', 'Support'], difficulty: 4, blurb: 'Iceborn warmother of the Avarosan tribe, Ashe commands the most populous horde in the north.' },
      103: { id: 103, name: 'Ahri', title: 'the Nine-Tailed Fox', image: '/champions/ahri.jpg', tags: ['Mage', 'Assassin'], difficulty: 5, blurb: 'Innately connected to the latent power of Runeterra, Ahri is a vastaya who can reshape magic into orbs of raw energy.' },
      157: { id: 157, name: 'Yasuo', title: 'the Unforgiven', image: '/champions/yasuo.jpg', tags: ['Fighter', 'Assassin'], difficulty: 10, blurb: 'An Ionian of deep resolve, Yasuo is an agile swordsman who wields the air itself against his enemies.' },
      64: { id: 64, name: 'Lee Sin', title: 'the Blind Monk', image: '/champions/leesin.jpg', tags: ['Fighter', 'Assassin'], difficulty: 6, blurb: 'A master of Ionia\'s ancient martial arts, Lee Sin is a principled fighter who channels the essence of the dragon spirit.' },
      99: { id: 99, name: 'Lux', title: 'the Lady of Luminosity', image: '/champions/lux.jpg', tags: ['Mage', 'Support'], difficulty: 4, blurb: 'Luxanna Crownguard hails from Demacia, an insular realm where magical abilities are viewed with fear and suspicion.' },
      35: { id: 35, name: 'Shaco', title: 'the Demon Jester', image: '/champions/shaco.jpg', tags: ['Assassin'], difficulty: 9, blurb: 'Crafted long ago as a plaything for a lonely prince, the enchanted marionette Shaco now delights in murder and mayhem.' },
      91: { id: 91, name: 'Talon', title: 'the Blade\'s Shadow', image: '/champions/talon.jpg', tags: ['Assassin'], difficulty: 7, blurb: 'Talon is the knife in the darkness, a merciless killer able to strike without warning and escape before any alarm is raised.' },
      143: { id: 143, name: 'Zyra', title: 'Rise of the Thorns', image: '/champions/zyra.jpg', tags: ['Mage', 'Support'], difficulty: 7, blurb: 'Born in an ancient, sorcerous catastrophe, Zyra is the wrath of nature given form—an alluring hybrid of plant and human.' },
      115: { id: 115, name: 'Ziggs', title: 'the Hexplosives Expert', image: '/champions/ziggs.jpg', tags: ['Mage'], difficulty: 4, blurb: 'Ziggs is a yordle obsessed with explosives. He finds the yordle homeland of Bandle City boring.' },
      25: { id: 25, name: 'Morgana', title: 'the Fallen', image: '/champions/morgana.jpg', tags: ['Mage', 'Support'], difficulty: 1, blurb: 'Conflicted between her celestial and mortal natures, Morgana bound her wings to embrace humanity.' },
      267: { id: 267, name: 'Nami', title: 'the Tidecaller', image: '/champions/nami.jpg', tags: ['Support', 'Mage'], difficulty: 5, blurb: 'A headstrong young vastaya of the seas, Nami was the first of the Marai tribe to leave the waves.' },
      201: { id: 201, name: 'Braum', title: 'the Heart of the Freljord', image: '/champions/braum.jpg', tags: ['Support', 'Tank'], difficulty: 3, blurb: 'Blessed with massive biceps and an even bigger heart, Braum is a beloved hero of the Freljord.' },
      76: { id: 76, name: 'Nidalee', title: 'the Bestial Huntress', image: '/champions/nidalee.jpg', tags: ['Assassin', 'Mage'], difficulty: 8, blurb: 'Raised in the deepest jungle, Nidalee is a master tracker who can shapeshift into a ferocious cougar.' },
      222: { id: 222, name: 'Jinx', title: 'the Loose Cannon', image: '/champions/jinx.jpg', tags: ['Marksman'], difficulty: 6, blurb: 'A manic and impulsive criminal from Zaun, Jinx lives to wreak havoc without care for the consequences.' },
      254: { id: 254, name: 'Vi', title: 'the Piltover Enforcer', image: '/champions/vi.jpg', tags: ['Fighter', 'Assassin'], difficulty: 4, blurb: 'Once a criminal from the mean streets of Zaun, Vi is a hotheaded, impulsive, and fearsome woman.' },
      427: { id: 427, name: 'Ivern', title: 'the Green Father', image: '/champions/ivern.jpg', tags: ['Support', 'Mage'], difficulty: 7, blurb: 'Ivern Bramblefoot, known to many as the Green Father, is a peculiar half man, half tree.' },
      18: { id: 18, name: 'Tristana', title: 'the Yordle Gunner', image: '/champions/tristana.jpg', tags: ['Marksman', 'Assassin'], difficulty: 4, blurb: 'While most yordles do not handle solo adventures well, Tristana has always been remarkably independent.' },
      19: { id: 19, name: 'Warwick', title: 'the Uncaged Wrath of Zaun', image: '/champions/warwick.jpg', tags: ['Fighter', 'Tank'], difficulty: 2, blurb: 'Warwick is a monster who hunts the gray alleys of Zaun. Transformed by agonizing experiments.' },
      45: { id: 45, name: 'Veigar', title: 'the Tiny Master of Evil', image: '/champions/veigar.jpg', tags: ['Mage'], difficulty: 7, blurb: 'An enthusiastic yordle sorcerer, Veigar has embraced powers that few others dare even approach.' },
      102: { id: 102, name: 'Shyvana', title: 'the Half-Dragon', image: '/champions/shyvana.jpg', tags: ['Fighter', 'Tank'], difficulty: 4, blurb: 'Shyvana is a creature with the magic of a rune shard burning within her heart.' },
      37: { id: 37, name: 'Sona', title: 'Maven of the Strings', image: '/champions/sona.jpg', tags: ['Support', 'Mage'], difficulty: 4, blurb: 'Sona is Demacia\'s foremost virtuoso of the stringed etwahl, speaking only through her graceful chords and vibrant arias.' }
    };

    return championIds.map(id => championData[id]).filter(Boolean);
  }
}

export const championRotationAPI = new ChampionRotationAPI();
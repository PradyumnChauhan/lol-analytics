/**
 * Champion ID to Name Mapping Utility
 * 
 * Provides static mapping of champion IDs to names since the API
 * doesn't return champion names in mastery data.
 * 
 * This mapping can be updated from DDragon API or static data files.
 */

// Champion ID to Name mapping
// This is a comprehensive list of all League of Legends champions
// Updated as of patch 14.19+ (2024)
export const CHAMPION_ID_TO_NAME: Record<number, string> = {
  1: 'Annie',
  2: 'Olaf',
  3: 'Galio',
  4: 'TwistedFate',
  5: 'XinZhao',
  6: 'Urgot',
  7: 'Leblanc',
  8: 'Vladimir',
  9: 'Fiddlesticks',
  10: 'Kayle',
  11: 'MasterYi',
  12: 'Alistar',
  13: 'Ryze',
  14: 'Sion',
  15: 'Sivir',
  16: 'Soraka',
  17: 'Teemo',
  18: 'Tristana',
  19: 'Warwick',
  20: 'Nunu',
  21: 'MissFortune',
  22: 'Ashe',
  23: 'Tryndamere',
  24: 'Jax',
  25: 'Morgana',
  26: 'Zilean',
  27: 'Singed',
  28: 'Evelynn',
  29: 'Twitch',
  30: 'Karthus',
  31: 'Chogath',
  32: 'Amumu',
  33: 'Rammus',
  34: 'Anivia',
  35: 'Shaco',
  36: 'DrMundo',
  37: 'Sona',
  38: 'Kassadin',
  39: 'Irelia',
  40: 'Janna',
  41: 'Gangplank',
  42: 'Corki',
  43: 'Karma',
  44: 'Taric',
  45: 'Veigar',
  48: 'Trundle',
  50: 'Swain',
  51: 'Caitlyn',
  53: 'Blitzcrank',
  54: 'Malphite',
  55: 'Katarina',
  56: 'Nocturne',
  57: 'Maokai',
  58: 'Renekton',
  59: 'JarvanIV',
  60: 'Elise',
  61: 'Orianna',
  62: 'MonkeyKing',
  63: 'Brand',
  64: 'LeeSin',
  67: 'Vayne',
  68: 'Rumble',
  69: 'Cassiopeia',
  72: 'Skarner',
  74: 'Heimerdinger',
  75: 'Nasus',
  76: 'Nidalee',
  77: 'Udyr',
  78: 'Poppy',
  79: 'Gragas',
  80: 'Pantheon',
  81: 'Ezreal',
  82: 'Mordekaiser',
  83: 'Yorick',
  84: 'Akali',
  85: 'Kennen',
  86: 'Garen',
  89: 'Leona',
  90: 'Malzahar',
  91: 'Talon',
  92: 'Riven',
  96: 'KogMaw',
  98: 'Shen',
  99: 'Lux',
  101: 'Xerath',
  102: 'Shyvana',
  103: 'Ahri',
  104: 'Graves',
  105: 'Fizz',
  106: 'Volibear',
  107: 'Rengar',
  110: 'Varus',
  111: 'Nautilus',
  112: 'Viktor',
  113: 'Sejuani',
  114: 'Fiora',
  115: 'Ziggs',
  117: 'Lulu',
  119: 'Draven',
  120: 'Hecarim',
  121: 'Khazix',
  122: 'Darius',
  126: 'Jayce',
  127: 'Lissandra',
  131: 'Diana',
  133: 'Quinn',
  134: 'Syndra',
  136: 'AurelionSol',
  141: 'Kayn',
  142: 'Zoe',
  143: 'Zyra',
  145: 'Kaisa',
  147: 'Seraphine',
  150: 'Gnar',
  154: 'Zac',
  157: 'Yasuo',
  161: 'Velkoz',
  163: 'Taliyah',
  164: 'Camille',
  166: 'Akshan',
  200: 'Belveth',
  201: 'Braum',
  202: 'Jhin',
  203: 'Kindred',
  222: 'Jinx',
  223: 'TahmKench',
  234: 'Viego',
  235: 'Senna',
  236: 'Lucian',
  238: 'Zed',
  240: 'Kled',
  245: 'Ekko',
  246: 'Qiyana',
  254: 'Vi',
  266: 'Aatrox',
  267: 'Nami',
  268: 'Azir',
  350: 'Yuumi',
  360: 'Samira',
  412: 'Thresh',
  420: 'Illaoi',
  421: 'RekSai',
  427: 'Ivern',
  429: 'Kalista',
  432: 'Bard',
  497: 'Rakan',
  498: 'Xayah',
  516: 'Ornn',
  517: 'Sylas',
  518: 'Neeko',
  523: 'Aphelios',
  526: 'Rell',
  555: 'Pyke',
  711: 'Vex',
  777: 'Yone',
  875: 'Sett',
  876: 'Lillia',
  887: 'Gwen',
  888: 'Renata',
  895: 'KSante',
  897: 'Hwei',
  902: 'Milio',
  950: 'Naafiri',
  9022: 'Briar',
  9023: 'Smolder',
};

/**
 * Get champion name from champion ID
 * @param championId - The champion ID
 * @returns Champion name or fallback string if not found
 */
export function getChampionName(championId: number): string {
  return CHAMPION_ID_TO_NAME[championId] || `Champion_${championId}`;
}

/**
 * Get champion ID from champion name (reverse lookup)
 * @param championName - The champion name
 * @returns Champion ID or null if not found
 */
export function getChampionId(championName: string): number | null {
  const entry = Object.entries(CHAMPION_ID_TO_NAME).find(
    ([, name]) => name.toLowerCase() === championName.toLowerCase()
  );
  return entry ? parseInt(entry[0], 10) : null;
}

/**
 * Check if a champion ID exists in the mapping
 * @param championId - The champion ID to check
 * @returns True if champion exists, false otherwise
 */
export function championExists(championId: number): boolean {
  return championId in CHAMPION_ID_TO_NAME;
}

/**
 * Get all champion IDs
 * @returns Array of all champion IDs
 */
export function getAllChampionIds(): number[] {
  return Object.keys(CHAMPION_ID_TO_NAME).map(id => parseInt(id, 10));
}

/**
 * Get all champion names
 * @returns Array of all champion names
 */
export function getAllChampionNames(): string[] {
  return Object.values(CHAMPION_ID_TO_NAME);
}

/**
 * Enrich mastery data with champion names
 * @param masteryData - Array of mastery objects with championId
 * @returns Array of mastery objects with championName added
 */
export function enrichMasteryWithNames(masteryData: Array<{ championId: number; [key: string]: unknown }>): Array<{ championId: number; championName: string; [key: string]: unknown }> {
  return masteryData.map(m => {
    const existingName = typeof m.championName === 'string' ? m.championName : null;
    return {
      ...m,
      championName: existingName || getChampionName(m.championId),
    };
  });
}

/**
 * Enrich participant data with champion names
 * @param participants - Array of participant objects with championId
 * @returns Array of participant objects with championName added
 */
export function enrichParticipantsWithNames(participants: Array<{ championId: number; [key: string]: unknown }>): Array<{ championId: number; championName: string; [key: string]: unknown }> {
  return participants.map(p => {
    const existingName = typeof p.championName === 'string' ? p.championName : null;
    return {
      ...p,
      championName: existingName || getChampionName(p.championId),
    };
  });
}


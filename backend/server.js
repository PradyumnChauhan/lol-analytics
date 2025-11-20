// Load environment variables from .env file if it exists
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your Next.js application
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = [
  FRONTEND_URL,
  process.env.FRONTEND_URL_ALT,
  // AWS Amplify domains (wildcard pattern)
  /^https:\/\/.*\.amplifyapp\.com$/,
  /^https:\/\/.*\.amplify\.app$/
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Configuration file path
const CONFIG_FILE = process.env.CONFIG_FILE_PATH 
  ? path.resolve(process.env.CONFIG_FILE_PATH)
  : path.join(__dirname, 'config', 'riot-config.json');

// In-memory storage for session data
let sessionData = {
  cookies: {},
  apiKey: null,
  lastUpdated: null,
  isValid: false
};

// Load configuration from file
async function loadConfig() {
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf8');
    const config = JSON.parse(configData);
    sessionData = { ...sessionData, ...config };
    console.log('✅ Configuration loaded successfully');
    return true;
  } catch (error) {
    console.log('⚠️  No configuration file found, will create one');
    return false;
  }
}

// Save configuration to file
async function saveConfig() {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(sessionData, null, 2));
    console.log('✅ Configuration saved successfully');
  } catch (error) {
    console.error('❌ Failed to save configuration:', error.message);
  }
}

// Convert cookies object to cookie string
function createCookieString(cookies) {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

// Common headers for Riot API requests
function getHeaders(includeAuth = true) {
  const headers = {
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Content-Type': 'application/json',
    'User-Agent': 'LOL-Analytics/1.0.0'
  };

  if (includeAuth && sessionData.apiKey) {
    headers['X-Riot-Token'] = sessionData.apiKey;
  }

  return headers;
}

// Make authenticated request to Riot API
async function makeRiotApiRequest(url, options = {}) {
  try {
    const config = {
      method: 'GET',
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers
      },
      timeout: 10000
    };

    console.log(`🌐 Making request to: ${url}`);
    console.log(`🔑 Headers:`, JSON.stringify(config.headers, null, 2));
    console.log(`🔧 Config:`, JSON.stringify({ ...config, headers: '[HIDDEN]' }, null, 2));
    
    const response = await axios(url, config);
    console.log(`✅ Response status: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error(`❌ API Request failed:`, {
      url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data || error.message,
      headers: error.response?.headers
    });
    throw error;
  }
}

// API endpoint to set authentication data
app.post('/auth/configure', async (req, res) => {
  try {
    const { apiKey, cookies } = req.body;

    if (!apiKey && !cookies) {
      return res.status(400).json({
        error: 'Either API key or cookies must be provided'
      });
    }

    // Update session data
    if (apiKey) {
      sessionData.apiKey = apiKey;
    }
    
    if (cookies) {
      sessionData.cookies = cookies;
    }

    sessionData.lastUpdated = new Date().toISOString();
    sessionData.isValid = true;

    // Save to file
    await saveConfig();

    res.json({
      success: true,
      message: 'Authentication configured successfully',
      hasApiKey: !!sessionData.apiKey,
      hasCookies: Object.keys(sessionData.cookies).length > 0,
      lastUpdated: sessionData.lastUpdated
    });

  } catch (error) {
    console.error('Configuration error:', error.message);
    res.status(500).json({
      error: 'Failed to configure authentication',
      details: error.message
    });
  }
});

// API endpoint to get current auth status
app.get('/auth/status', (req, res) => {
  res.json({
    isConfigured: sessionData.isValid,
    hasApiKey: !!sessionData.apiKey,
    hasCookies: Object.keys(sessionData.cookies).length > 0,
    lastUpdated: sessionData.lastUpdated,
    cookieCount: Object.keys(sessionData.cookies).length
  });
});

// Test authentication endpoint
app.get('/auth/test', async (req, res) => {
  try {
    if (!sessionData.apiKey) {
      return res.status(400).json({
        error: 'No API key configured'
      });
    }

    // Test with a simple API call (summoner lookup)
    const testSummoner = 'punknown'; // Your summoner name
    const testTag = '2854'; // Your tag
    
    const testUrl = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${testSummoner}/${testTag}`;
    
    const data = await makeRiotApiRequest(testUrl);
    
    res.json({
      success: true,
      message: 'Authentication test successful',
      testData: {
        gameName: data.gameName,
        tagLine: data.tagLine,
        puuid: data.puuid
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication test failed',
      details: error.response?.status === 403 ? 'API key lacks required permissions' : error.message
    });
  }
});

// ACCOUNT-V1 API - Get PUUID by Riot ID (gameName + tagLine)
// Documentation: https://developer.riotgames.com/apis#account-v1/GET_getByRiotId
app.get('/api/riot/account/v1/accounts/by-riot-id/:gameName/:tagLine', async (req, res) => {
  try {
    const { gameName, tagLine } = req.params;
    const { region = 'americas' } = req.query; // Regional routing (americas, asia, europe, sea)
    
    // Validate region parameter
    const validRegions = ['americas', 'asia', 'europe', 'sea'];
    if (!validRegions.includes(region)) {
      return res.status(400).json({
        error: 'Invalid region parameter',
        validRegions,
        details: 'Region must be a valid regional endpoint (americas, asia, europe, sea)'
      });
    }
    
    // Use proper regional endpoint as per documentation
    const url = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    
    console.log(`🔍 [ACCOUNT-V1] Fetching PUUID for ${gameName}#${tagLine} from ${region}`);
    const data = await makeRiotApiRequest(url);
    
    // Log successful PUUID retrieval
    console.log(`✅ [ACCOUNT-V1] Successfully retrieved PUUID: ${data.puuid}`);
    
    res.json({
      ...data,
      _metadata: {
        endpoint: 'ACCOUNT-V1',
        region: region,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error(`❌ [ACCOUNT-V1] Failed to fetch account data:`, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch account data',
      details: error.response?.data || error.message,
      endpoint: 'ACCOUNT-V1',
      suggestion: 'Verify the Riot ID (gameName#tagLine) is correct and exists'
    });
  }
});

// SUMMONER-V4 API - Get summoner data by PUUID (includes summonerID)
// Documentation: https://developer.riotgames.com/apis#summoner-v4/GET_getByPUUID
app.get('/api/summoner/v4/summoners/by-puuid/:encryptedPUUID', async (req, res) => {
  try {
    const { encryptedPUUID } = req.params; // Using proper parameter name from documentation
    const { region = 'na1', autoDetect = 'false' } = req.query;
    
    console.log(`🔍 [SUMMONER-V4] Fetching summoner data for PUUID: ${encryptedPUUID}`);
    
    // Validate platform region parameter
    const validPlatforms = ['na1', 'euw1', 'eun1', 'kr', 'br1', 'jp1', 'la1', 'la2', 'oc1', 'tr1', 'ru'];
    
    // If autoDetect is enabled, try multiple regions using intelligent clustering
    if (autoDetect === 'true') {
      console.log(`🔄 [SUMMONER-V4] Auto-detecting platform for PUUID: ${encryptedPUUID}`);
      
      // Try all platforms grouped by region for better efficiency
      const allPlatforms = ['na1', 'br1', 'la1', 'la2', 'euw1', 'eun1', 'tr1', 'ru', 'kr', 'jp1', 'ph2', 'sg2', 'th2', 'tw2', 'vn2', 'oc1'];
      
      try {
        const result = await findSummonerAcrossPlatforms(encryptedPUUID, allPlatforms);
        
        console.log(`✅ [SUMMONER-V4] Found summoner on platform: ${result.platform}, summonerID: ${result.id}`);
        
        // If successful, return data with region info
        res.json({
          ...result,
          _metadata: {
            endpoint: 'SUMMONER-V4',
            detectedPlatform: result.platform,
            autoDetected: true,
            timestamp: new Date().toISOString()
          }
        });
        return;
      } catch {
        // If auto-detection fails, return 404
        console.log(`❌ [SUMMONER-V4] Summoner not found on any platform for PUUID: ${encryptedPUUID}`);
        res.status(404).json({
          error: 'Summoner not found on any platform',
          details: 'The PUUID exists but no League of Legends summoner was found on any supported platform',
          searchedPlatforms: allPlatforms,
          suggestion: 'This account may exist for other Riot games but not League of Legends',
          endpoint: 'SUMMONER-V4'
        });
        return;
      }

    }
    
    // Validate single region
    if (!validPlatforms.includes(region)) {
      return res.status(400).json({
        error: 'Invalid platform region',
        validPlatforms,
        details: 'Region must be a valid platform endpoint',
        endpoint: 'SUMMONER-V4'
      });
    }
    
    // Standard single-region lookup
    const url = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encryptedPUUID}`;
    const data = await makeRiotApiRequest(url);
    
    console.log(`✅ [SUMMONER-V4] Successfully retrieved summoner data, summonerID: ${data.id}`);
    
    res.json({
      ...data,
      _metadata: {
        endpoint: 'SUMMONER-V4',
        region: region,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error(`❌ [SUMMONER-V4] Failed to fetch summoner data:`, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch summoner data',
      details: error.response?.data || error.message,
      suggestion: 'Try adding ?autoDetect=true to search across multiple regions',
      endpoint: 'SUMMONER-V4'
    });
  }
});

// Legacy endpoint for backward compatibility
app.get('/api/summoner/v4/summoners/by-puuid/:puuid', async (req, res) => {
  // Redirect to the proper endpoint with documentation parameter name
  req.url = req.url.replace('/by-puuid/', '/by-puuid/');
  console.log('⚠️  [SUMMONER-V4] Using legacy endpoint, consider updating to use /by-puuid/{encryptedPUUID}');
  
  // Forward to the main handler
  const { puuid } = req.params;
  req.params.encryptedPUUID = puuid;
  
  // Call the main endpoint handler
  return app._router.handle({
    ...req,
    url: `/api/summoner/v4/summoners/by-puuid/${puuid}`,
    params: { encryptedPUUID: puuid }
  }, res);
});

// COMBINED ENDPOINT - Complete Riot ID to Summoner workflow (ACCOUNT-V1 + SUMMONER-V4)
// This endpoint implements the complete flow as documented:
// 1. ACCOUNT-V1: Get PUUID from Riot ID
// 2. SUMMONER-V4: Get summoner data (including summonerID) from PUUID
app.get('/api/summoner/v4/summoners/by-riot-id/:gameName/:tagLine', async (req, res) => {
  try {
    const { gameName, tagLine } = req.params;
    const { region = 'na1' } = req.query;
    
    console.log(`🚀 [COMBINED] Starting complete Riot ID lookup for ${gameName}#${tagLine}`);
    
    // Step 1: Get account by Riot ID (uses regional endpoint)
    // Following ACCOUNT-V1 documentation: https://developer.riotgames.com/apis#account-v1/GET_getByRiotId
    const regionalEndpoint = getRegionalEndpoint(region);
    const accountUrl = `https://${regionalEndpoint}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    
    console.log(`📋 [STEP 1/2] ACCOUNT-V1: Getting PUUID from ${regionalEndpoint}`);
    const accountData = await makeRiotApiRequest(accountUrl);
    console.log(`✅ [STEP 1/2] ACCOUNT-V1: Retrieved PUUID: ${accountData.puuid}`);
    
    // Step 2: Get summoner by PUUID (uses platform endpoint)
    // Following SUMMONER-V4 documentation: https://developer.riotgames.com/apis#summoner-v4/GET_getByPUUID
    // Try the specified region first, then try all platforms in the regional cluster
    console.log(`👤 [STEP 2/2] SUMMONER-V4: Getting summoner data, starting with ${region}`);
    
    let summonerData;
    let detectedPlatform = region;
    
    try {
      // First try the specified platform
      const summonerUrl = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${accountData.puuid}`;
      summonerData = await makeRiotApiRequest(summonerUrl);
      console.log(`✅ [STEP 2/2] SUMMONER-V4: Found summoner on primary platform ${region}, summonerID: ${summonerData.id}`);
    } catch (error) {
      if (error.response?.status === 404) {
        // Summoner not found on primary platform, try others in the same regional cluster
        console.log(`⚠️  [STEP 2/2] SUMMONER-V4: Not found on ${region}, trying other platforms in ${regionalEndpoint} region...`);
        const platformsToTry = getPlatformEndpointsForRegion(regionalEndpoint).filter(p => p !== region);
        
        try {
          const result = await findSummonerAcrossPlatforms(accountData.puuid, platformsToTry);
          summonerData = result;
          detectedPlatform = result.platform;
          console.log(`✅ [STEP 2/2] SUMMONER-V4: Found summoner on alternative platform ${detectedPlatform}, summonerID: ${summonerData.id}`);
        } catch {
          // If not found on any platform in the region, throw the original error
          throw error;
        }
      } else {
        // Non-404 error, re-throw
        throw error;
      }
    }
    
    // Return combined data with documentation compliance
    const response = {
      // Account data from ACCOUNT-V1 (includes PUUID)
      account: {
        ...accountData,
        _source: 'ACCOUNT-V1'
      },
      // Summoner data from SUMMONER-V4 (includes summonerID) 
      summoner: {
        ...summonerData,
        _source: 'SUMMONER-V4'
      },
      // Metadata about the request
      _metadata: {
        workflow: 'RiotID-to-Summoner',
        steps: [
          {step: 1, endpoint: 'ACCOUNT-V1', action: 'Get PUUID from Riot ID'},
          {step: 2, endpoint: 'SUMMONER-V4', action: 'Get summoner data from PUUID'}
        ],
        regionalEndpoint: regionalEndpoint,
        requestedPlatform: region,
        detectedPlatform: detectedPlatform,
        platformAutoDetected: detectedPlatform !== region,
        timestamp: new Date().toISOString()
      },
      // Also include flattened summoner data for backward compatibility
      ...summonerData
    };
    
    console.log(`🎉 [COMBINED] Successfully completed Riot ID lookup for ${gameName}#${tagLine}`);
    res.json(response);
    
  } catch (error) {
    console.error(`❌ [COMBINED] Failed during Riot ID lookup:`, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch summoner data by Riot ID',
      details: error.response?.data || error.message,
      suggestion: 'Make sure the Riot ID exists and the summoner has played League of Legends on the specified region',
      workflow: 'RiotID-to-Summoner',
      failedAt: error.response?.config?.url?.includes('account') ? 'ACCOUNT-V1' : 'SUMMONER-V4'
    });
  }
});

// Helper function to get regional endpoint from platform region
function getRegionalEndpoint(platformRegion) {
  const regionMap = {
    'na1': 'americas',
    'br1': 'americas',
    'la1': 'americas',
    'la2': 'americas',
    'euw1': 'europe',
    'eun1': 'europe',
    'tr1': 'europe',
    'ru': 'europe',
    'kr': 'asia',
    'jp1': 'asia',
    'ph2': 'sea',
    'sg2': 'sea',
    'th2': 'sea',
    'tw2': 'sea',
    'vn2': 'sea',
    'oc1': 'sea'
  };
  return regionMap[platformRegion] || 'americas';
}

// Helper function to get all platform endpoints for a regional cluster
function getPlatformEndpointsForRegion(regionalEndpoint) {
  const platformMap = {
    'americas': ['na1', 'br1', 'la1', 'la2'],
    'europe': ['euw1', 'eun1', 'tr1', 'ru'],
    'asia': ['kr', 'jp1'],
    'sea': ['ph2', 'sg2', 'th2', 'tw2', 'vn2', 'oc1']
  };
  return platformMap[regionalEndpoint] || ['na1'];
}

// Helper function to try multiple platform endpoints for SUMMONER-V4
async function findSummonerAcrossPlatforms(puuid, platforms) {
  for (const platform of platforms) {
    try {
      console.log(`🔍 [SUMMONER-V4] Trying platform ${platform} for PUUID: ${puuid.substring(0, 20)}...`);
      const url = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
      const data = await makeRiotApiRequest(url);
      console.log(`✅ [SUMMONER-V4] Found summoner on platform: ${platform}`);
      return { ...data, platform };
    } catch (error) {
      console.log(`❌ [SUMMONER-V4] Platform ${platform} failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      // Continue to next platform
    }
  }
  throw new Error('Summoner not found on any platform in the region');
}

app.get('/api/summoner/v4/summoners/:summonerId', async (req, res) => {
  try {
    const { summonerId } = req.params;
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/${summonerId}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch summoner data by ID',
      details: error.response?.data || error.message
    });
  }
});

// Spectator API endpoints
app.get('/api/spectator/v5/active-games/by-summoner/:summonerId', async (req, res) => {
  try {
    const { summonerId } = req.params;
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${summonerId}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch active game',
      details: error.response?.data || error.message
    });
  }
});

app.get('/api/spectator/v5/featured-games', async (req, res) => {
  try {
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/spectator/v5/featured-games`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch featured games',
      details: error.response?.data || error.message
    });
  }
});

// Champion Mastery API
app.get('/api/champion-mastery/v4/champion-masteries/by-puuid/:puuid', async (req, res) => {
  try {
    const { puuid } = req.params;
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch champion mastery data',
      details: error.response?.data || error.message
    });
  }
});

// Get champion mastery for a specific champion
app.get('/api/champion-mastery/v4/champion-masteries/by-puuid/:puuid/by-champion/:championId', async (req, res) => {
  try {
    const { puuid, championId } = req.params;
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch champion mastery for specific champion',
      details: error.response?.data || error.message
    });
  }
});

// Get mastery score (total level) for a summoner
app.get('/api/champion-mastery/v4/scores/by-puuid/:puuid', async (req, res) => {
  try {
    const { puuid } = req.params;
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/champion-mastery/v4/scores/by-puuid/${puuid}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch mastery score',
      details: error.response?.data || error.message
    });
  }
});

// Get top champion masteries (limited count)
app.get('/api/champion-mastery/v4/champion-masteries/by-puuid/:puuid/top', async (req, res) => {
  try {
    const { puuid } = req.params;
    const { region = 'na1', count = 3 } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch top champion masteries',
      details: error.response?.data || error.message
    });
  }
});

// League API - Get ranked data by summoner ID (Legacy - deprecated)
app.get('/api/league/v4/entries/by-summoner/:summonerId', async (req, res) => {
  try {
    const { summonerId } = req.params;
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch league data',
      details: error.response?.data || error.message
    });
  }
});

// League API - Get ranked data by PUUID (Modern approach)
app.get('/api/league/v4/entries/by-puuid/:puuid', async (req, res) => {
  try {
    const { puuid } = req.params;
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch league data by PUUID',
      details: error.response?.data || error.message
    });
  }
});

// Get Challenger League for a specific queue
app.get('/api/league/v4/challengerleagues/by-queue/:queue', async (req, res) => {
  try {
    const { queue } = req.params;
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/${queue}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch challenger league data',
      details: error.response?.data || error.message
    });
  }
});

// Get Grandmaster League for a specific queue
app.get('/api/league/v4/grandmasterleagues/by-queue/:queue', async (req, res) => {
  try {
    const { queue } = req.params;
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/${queue}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch grandmaster league data',
      details: error.response?.data || error.message
    });
  }
});

// Get Master League for a specific queue
app.get('/api/league/v4/masterleagues/by-queue/:queue', async (req, res) => {
  try {
    const { queue } = req.params;
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/league/v4/masterleagues/by-queue/${queue}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch master league data',
      details: error.response?.data || error.message
    });
  }
});

// Get league entries by rank (e.g., DIAMOND I, PLATINUM II)
app.get('/api/league/v4/entries/:queue/:tier/:division', async (req, res) => {
  try {
    const { queue, tier, division } = req.params;
    const { region = 'na1', page = 1 } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/league/v4/entries/${queue}/${tier}/${division}?page=${page}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch league entries by rank',
      details: error.response?.data || error.message
    });
  }
});

// Champion-V3 API (Get champion rotations)
app.get('/api/platform/v3/champion-rotations', async (req, res) => {
  try {
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/platform/v3/champion-rotations`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch champion rotations',
      details: error.response?.data || error.message
    });
  }
});

// LoL Status API
app.get('/api/lol-status/v4/platform-data', async (req, res) => {
  try {
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/status/v4/platform-data`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch platform status',
      details: error.response?.data || error.message
    });
  }
});

// Clash-V1 API (Tournament information)
app.get('/api/clash/v1/players/by-summoner/:summonerId', async (req, res) => {
  try {
    const { summonerId } = req.params;
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/clash/v1/players/by-summoner/${summonerId}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch clash player data',
      details: error.response?.data || error.message
    });
  }
});

app.get('/api/clash/v1/teams/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/clash/v1/teams/${teamId}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch clash team data',
      details: error.response?.data || error.message
    });
  }
});

app.get('/api/clash/v1/tournaments', async (req, res) => {
  try {
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/clash/v1/tournaments`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch clash tournaments',
      details: error.response?.data || error.message
    });
  }
});

// Challenges-V1 API (Player achievements and challenges)
app.get('/api/challenges/v1/challenges/config', async (req, res) => {
  try {
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/challenges/v1/challenges/config`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch challenge configurations',
      details: error.response?.data || error.message
    });
  }
});

app.get('/api/challenges/v1/challenges/percentiles', async (req, res) => {
  try {
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/challenges/v1/challenges/percentiles`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch challenge percentiles',
      details: error.response?.data || error.message
    });
  }
});

app.get('/api/challenges/v1/challenges/config/:challengeId', async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/challenges/v1/challenges/config/${challengeId}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch specific challenge configuration',
      details: error.response?.data || error.message
    });
  }
});

app.get('/api/challenges/v1/challenges/percentiles/:challengeId', async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { region = 'na1' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/challenges/v1/challenges/percentiles/${challengeId}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch challenge percentiles for specific challenge',
      details: error.response?.data || error.message
    });
  }
});

app.get('/api/challenges/v1/player-data/by-puuid/:puuid', async (req, res) => {
  try {
    const { puuid } = req.params;
    const { region = 'na1' } = req.query;
    
    // Fixed: Correct API endpoint is /player-data/{puuid}, not /player-data/by-puuid/{puuid}
    const url = `https://${region}.api.riotgames.com/lol/challenges/v1/player-data/${puuid}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch player challenge data',
      details: error.response?.data || error.message
    });
  }
});

// League-EXP-V4 API (Experimental league endpoints with additional data)
app.get('/api/league-exp/v4/entries/:queue/:tier/:division', async (req, res) => {
  try {
    const { queue, tier, division } = req.params;
    const { region = 'na1', page = 1 } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/league-exp/v4/entries/${queue}/${tier}/${division}?page=${page}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch experimental league entries',
      details: error.response?.data || error.message
    });
  }
});

// Match-V5 API endpoints (these might still need special handling)
app.get('/api/match/v5/matches/by-puuid/:puuid/ids', async (req, res) => {
  try {
    const { puuid } = req.params;
    const { startTime, endTime, queue, type, start = 0, count = 20, region = 'americas' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`;
    const params = { startTime, endTime, queue, type, start, count };
    
    // Remove undefined params
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
    
    const data = await makeRiotApiRequest(url, { params });
    res.json(data);
    
  } catch (error) {
    console.log(`Match API error: ${error.response?.status} - ${error.response?.statusText}`);
    
    // If 403, try to provide helpful error message
    if (error.response?.status === 403) {
      res.status(403).json({
        error: 'Match-V5 API access forbidden',
        details: 'Your API key may not have access to Match-V5 endpoints. This is common with development keys.',
        suggestion: 'Consider using the browser session approach or request production API access'
      });
    } else {
      res.status(error.response?.status || 500).json({
        error: 'Failed to fetch match IDs',
        details: error.response?.data || error.message
      });
    }
  }
});

app.get('/api/match/v5/matches/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { region = 'americas' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    if (error.response?.status === 403) {
      res.status(403).json({
        error: 'Match-V5 API access forbidden',
        details: 'Your API key may not have access to Match-V5 endpoints',
        suggestion: 'Consider using production API key or browser session approach'
      });
    } else {
      res.status(error.response?.status || 500).json({
        error: 'Failed to fetch match data',
        details: error.response?.data || error.message
      });
    }
  }
});

app.get('/api/match/v5/matches/:matchId/timeline', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { region = 'americas' } = req.query;
    
    const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;
    
    const data = await makeRiotApiRequest(url);
    res.json(data);
    
  } catch (error) {
    if (error.response?.status === 403) {
      res.status(403).json({
        error: 'Match-V5 API access forbidden',
        details: 'Your API key may not have access to Match-V5 endpoints',
        suggestion: 'Consider using production API key or browser session approach'
      });
    } else {
      res.status(error.response?.status || 500).json({
        error: 'Failed to fetch match timeline',
        details: error.response?.data || error.message
      });
    }
  }
});

// AI Insights endpoint - Analyzes player data using Bedrock
// Requires BEDROCK_LAMBDA_URL environment variable
// Helper function to get Bedrock URL (checks both env and const)
function getBedrockLambdaUrl() {
  // Try process.env first (in case it was updated), then fallback to const
  const url = (process.env.BEDROCK_LAMBDA_URL || '').trim();
  return url || '';
}

const BEDROCK_LAMBDA_URL = getBedrockLambdaUrl();

// Log Bedrock configuration status on startup
if (!BEDROCK_LAMBDA_URL) {
  console.log('⚠️  BEDROCK_LAMBDA_URL not configured - AI endpoints will be disabled');
  console.log('   Set BEDROCK_LAMBDA_URL environment variable or add it to .env file');
  console.log('   Example: BEDROCK_LAMBDA_URL=https://your-lambda-function-url.lambda-url.region.on.aws/');
  console.log('   Current process.env.BEDROCK_LAMBDA_URL:', process.env.BEDROCK_LAMBDA_URL || 'undefined');
} else {
  console.log(`✅ BEDROCK_LAMBDA_URL configured: ${BEDROCK_LAMBDA_URL.substring(0, 50)}...`);
  console.log(`   Full URL length: ${BEDROCK_LAMBDA_URL.length} characters`);
}

// Conversation history storage (in-memory, keyed by puuid)
// In production, use Redis or DynamoDB for persistence
const conversationHistory = new Map();
const HISTORY_TTL = 10 * 60 * 1000; // 10 minutes

// Cleanup old conversation history periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of conversationHistory.entries()) {
    if (now - data.lastAccess > HISTORY_TTL) {
      conversationHistory.delete(key);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

// Async job storage for long-running AI operations
// In production, use Redis or DynamoDB for persistence
const jobStorage = new Map();
const JOB_TTL = 20 * 60 * 1000; // 20 minutes - jobs expire after 20 minutes

// Job statuses
const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Generate unique job ID
function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Cleanup old jobs periodically
setInterval(() => {
  const now = Date.now();
  for (const [jobId, job] of jobStorage.entries()) {
    if (now - job.createdAt > JOB_TTL) {
      jobStorage.delete(jobId);
      console.log(`[Job Cleanup] Removed expired job: ${jobId}`);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

app.post('/api/ai/analyze', async (req, res) => {
  try {
    const bedrockUrl = getBedrockLambdaUrl();
    if (!bedrockUrl) {
      console.error('[AI Analyze] BEDROCK_LAMBDA_URL not configured');
      return res.status(500).json({
        error: 'Bedrock Lambda URL not configured',
        details: 'Set BEDROCK_LAMBDA_URL environment variable'
      });
    }

    const { matchData, playerStats, analysisType = 'insights' } = req.body;
    
    if (!matchData || !Array.isArray(matchData)) {
      return res.status(400).json({
        error: 'matchData array is required'
      });
    }
    
    console.log(`🤖 [AI] Analyzing ${matchData.length} matches, type: ${analysisType}`);
    
    // Call Bedrock Lambda function
    const response = await axios.post(bedrockUrl, {
      matchData,
      playerStats: playerStats || {},
      analysisType
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout for AI processing
    });
    
    const aiResponse = response.data;
    
    res.json({
      success: true,
      insights: aiResponse.insights,
      analysisType: aiResponse.analysisType,
      matchesAnalyzed: aiResponse.matchesAnalyzed,
      _metadata: {
        timestamp: new Date().toISOString(),
        source: 'Amazon Bedrock (DeepSeek V3.1)'
      }
    });
    
  } catch (error) {
    console.error('❌ [AI] Analysis failed:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to generate AI insights',
      details: error.response?.data || error.message,
      suggestion: 'Check Bedrock Lambda function URL and ensure Bedrock models are enabled'
    });
  }
});

// AI Dashboard Insights endpoint - Comprehensive analysis (SYNC - kept for backward compatibility)
app.post('/api/ai/dashboard-insights', async (req, res) => {
  try {
    const bedrockUrl = getBedrockLambdaUrl();
    console.log('[AI Dashboard] BEDROCK_LAMBDA_URL check:', {
      url: bedrockUrl ? `${bedrockUrl.substring(0, 50)}...` : 'empty',
      length: bedrockUrl.length,
      fromEnv: !!process.env.BEDROCK_LAMBDA_URL
    });
    
    if (!bedrockUrl) {
      console.error('[AI Dashboard] BEDROCK_LAMBDA_URL is empty or not set');
      return res.status(500).json({
        error: 'Bedrock Lambda URL not configured',
        details: 'Set BEDROCK_LAMBDA_URL environment variable',
        debug: {
          envVar: process.env.BEDROCK_LAMBDA_URL ? 'exists' : 'missing',
          envValue: process.env.BEDROCK_LAMBDA_URL ? `${process.env.BEDROCK_LAMBDA_URL.substring(0, 30)}...` : 'N/A'
        }
      });
    }

    const { playerData } = req.body;
    
    if (!playerData || !playerData.playerInfo) {
      return res.status(400).json({
        error: 'playerData with playerInfo is required'
      });
    }
    
    const playerName = `${playerData.playerInfo.gameName || ''}#${playerData.playerInfo.tagLine || ''}`;
    console.log(`🤖 [AI] Generating dashboard insights for ${playerName}`);
    console.log(`[AI Dashboard] Using Bedrock URL: ${bedrockUrl.substring(0, 60)}...`);
    
    // Dashboard insights can take up to 15 minutes (Lambda timeout)
    // Set timeout to 15 minutes (900000ms) to match Lambda configuration
    const response = await axios.post(bedrockUrl, {
      playerData,
      analysisType: 'dashboard'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 900000 // 15 minutes to match Lambda timeout
    });
    
    const aiResponse = response.data;
    
    // Parse the response body if it's a string
    const responseData = typeof aiResponse.body === 'string' ? JSON.parse(aiResponse.body) : aiResponse;
    
    // Log the prompt that was sent
    if (responseData.prompt) {
      console.log('\n📝 [AI] PROMPT SENT TO BEDROCK:');
      console.log('═══════════════════════════════════════════');
      console.log(responseData.prompt);
      console.log('═══════════════════════════════════════════');
      console.log(`Prompt length: ${responseData.promptLength || responseData.prompt.length} characters`);
      console.log(`Model: ${responseData.modelUsed || responseData.model}`);
      console.log(`Max tokens: ${responseData.maxTokens || 'N/A'}\n`);
    }
    
    res.json({
      success: true,
      insights: responseData.insights || aiResponse.insights,
      analysisType: responseData.analysisType || aiResponse.analysisType,
      matchesAnalyzed: responseData.matchesAnalyzed || aiResponse.matchesAnalyzed || 0,
      model: responseData.model || aiResponse.model,
      prompt: responseData.prompt,  // Include prompt in response
      promptMetadata: {
        promptLength: responseData.promptLength || (responseData.prompt?.length || 0),
        modelUsed: responseData.modelUsed || responseData.model,
        maxTokens: responseData.maxTokens
      },
      _metadata: {
        timestamp: new Date().toISOString(),
        source: 'Amazon Bedrock',
        player: playerName
      }
    });
    
  } catch (error) {
    console.error('❌ [AI] Dashboard insights failed:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to generate dashboard insights',
      details: error.response?.data || error.message,
      suggestion: 'Check Bedrock Lambda function URL and ensure Bedrock models are enabled'
    });
  }
});

// ASYNC JOB ENDPOINTS - Work around AWS Amplify 30-second gateway timeout
// Start async job for dashboard insights
app.post('/api/ai/dashboard-insights/start', async (req, res) => {
  try {
    const bedrockUrl = getBedrockLambdaUrl();
    
    if (!bedrockUrl) {
      return res.status(500).json({
        error: 'Bedrock Lambda URL not configured',
        details: 'Set BEDROCK_LAMBDA_URL environment variable'
      });
    }

    const { playerData } = req.body;
    
    if (!playerData || !playerData.playerInfo) {
      return res.status(400).json({
        error: 'playerData with playerInfo is required'
      });
    }
    
    // Generate job ID
    const jobId = generateJobId();
    const playerName = `${playerData.playerInfo.gameName || ''}#${playerData.playerInfo.tagLine || ''}`;
    
    // Create job entry
    const job = {
      id: jobId,
      status: JOB_STATUS.PENDING,
      playerName,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null,
      progress: 0
    };
    
    jobStorage.set(jobId, job);
    
    console.log(`🚀 [AI Job] Started async job ${jobId} for ${playerName}`);
    
    // Start processing asynchronously (don't await)
    processDashboardInsightsJob(jobId, playerData, bedrockUrl).catch(err => {
      console.error(`❌ [AI Job] Job ${jobId} failed:`, err.message);
      const job = jobStorage.get(jobId);
      if (job) {
        job.status = JOB_STATUS.FAILED;
        job.error = err.message;
        job.completedAt = Date.now();
      }
    });
    
    // Return immediately with job ID
    res.json({
      success: true,
      jobId,
      status: JOB_STATUS.PENDING,
      message: 'Job started. Use /api/ai/dashboard-insights/status/:jobId to check status.',
      estimatedTime: '5-15 minutes'
    });
    
  } catch (error) {
    console.error('❌ [AI Job] Failed to start job:', error.message);
    res.status(500).json({
      error: 'Failed to start job',
      details: error.message
    });
  }
});

// Check job status
app.get('/api/ai/dashboard-insights/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobStorage.get(jobId);
  
  if (!job) {
    return res.status(404).json({
      error: 'Job not found',
      jobId
    });
  }
  
  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    createdAt: new Date(job.createdAt).toISOString(),
    startedAt: job.startedAt ? new Date(job.startedAt).toISOString() : null,
    completedAt: job.completedAt ? new Date(job.completedAt).toISOString() : null,
    error: job.error,
    playerName: job.playerName
  });
});

// Get job result (only available when status is 'completed')
app.get('/api/ai/dashboard-insights/result/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobStorage.get(jobId);
  
  if (!job) {
    return res.status(404).json({
      error: 'Job not found',
      jobId
    });
  }
  
  if (job.status === JOB_STATUS.FAILED) {
    return res.status(500).json({
      error: 'Job failed',
      jobId,
      details: job.error
    });
  }
  
  if (job.status !== JOB_STATUS.COMPLETED) {
    return res.status(202).json({
      error: 'Job not completed yet',
      jobId,
      status: job.status,
      message: 'Job is still processing. Check status endpoint for updates.'
    });
  }
  
  // Return the result
  res.json({
    success: true,
    jobId,
    ...job.result
  });
});

// Async function to process the job
async function processDashboardInsightsJob(jobId, playerData, bedrockUrl) {
  const job = jobStorage.get(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  try {
    // Update job status to processing
    job.status = JOB_STATUS.PROCESSING;
    job.startedAt = Date.now();
    job.progress = 10;
    jobStorage.set(jobId, job);
    
    const playerName = `${playerData.playerInfo.gameName || ''}#${playerData.playerInfo.tagLine || ''}`;
    console.log(`🔄 [AI Job] Processing job ${jobId} for ${playerName}`);
    
    // Update progress
    job.progress = 30;
    jobStorage.set(jobId, job);
    
    // Call Bedrock Lambda function
    const response = await axios.post(bedrockUrl, {
      playerData,
      analysisType: 'dashboard'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 900000 // 15 minutes
    });
    
    job.progress = 80;
    jobStorage.set(jobId, job);
    
    const aiResponse = response.data;
    
    // Parse the response body if it's a string
    const responseData = typeof aiResponse.body === 'string' ? JSON.parse(aiResponse.body) : aiResponse;
    
    // Log the prompt that was sent
    if (responseData.prompt) {
      console.log(`\n📝 [AI Job] Job ${jobId} - PROMPT SENT TO BEDROCK:`);
      console.log(`Prompt length: ${responseData.promptLength || responseData.prompt.length} characters`);
      console.log(`Model: ${responseData.modelUsed || responseData.model}\n`);
    }
    
    // Update job with result
    job.status = JOB_STATUS.COMPLETED;
    job.progress = 100;
    job.completedAt = Date.now();
    job.result = {
      insights: responseData.insights || aiResponse.insights,
      analysisType: responseData.analysisType || aiResponse.analysisType,
      matchesAnalyzed: responseData.matchesAnalyzed || aiResponse.matchesAnalyzed || 0,
      model: responseData.model || aiResponse.model,
      prompt: responseData.prompt,
      promptMetadata: {
        promptLength: responseData.promptLength || (responseData.prompt?.length || 0),
        modelUsed: responseData.modelUsed || responseData.model,
        maxTokens: responseData.maxTokens
      },
      _metadata: {
        timestamp: new Date().toISOString(),
        source: 'Amazon Bedrock',
        player: playerName
      }
    };
    
    jobStorage.set(jobId, job);
    
    console.log(`✅ [AI Job] Job ${jobId} completed successfully`);
    
  } catch (error) {
    console.error(`❌ [AI Job] Job ${jobId} failed:`, error.message);
    job.status = JOB_STATUS.FAILED;
    job.error = error.response?.data || error.message;
    job.completedAt = Date.now();
    jobStorage.set(jobId, job);
    throw error;
  }
}

// AI Chat endpoint - Conversational queries with real-time streaming
app.post('/api/ai/chat', async (req, res) => {
  try {
    const bedrockUrl = getBedrockLambdaUrl();
    if (!bedrockUrl) {
      console.error('[AI Chat] BEDROCK_LAMBDA_URL not configured');
      return res.status(500).json({
        error: 'Bedrock Lambda URL not configured',
        details: 'Set BEDROCK_LAMBDA_URL environment variable'
      });
    }

    const { playerData, question, puuid } = req.body;
    
    if (!playerData || !playerData.playerInfo) {
      return res.status(400).json({
        error: 'playerData with playerInfo is required'
      });
    }
    
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        error: 'question is required and must be a non-empty string'
      });
    }
    
    // Get or create conversation history
    const historyKey = puuid || `${playerData.playerInfo.gameName}#${playerData.playerInfo.tagLine}`;
    let history = conversationHistory.get(historyKey);
    
    if (!history) {
      history = {
        messages: [],
        lastAccess: Date.now()
      };
      conversationHistory.set(historyKey, history);
    }
    
    history.lastAccess = Date.now();
    
    // Limit history to last 5 messages
    const conversationHistoryArray = history.messages.slice(-5).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add user question to history
    history.messages.push({
      role: 'user',
      content: question.trim(),
      timestamp: Date.now()
    });
    
    console.log(`💬 [AI Chat] Question from ${playerData.playerInfo.gameName}: ${question.substring(0, 50)}...`);
    
    // Check if streaming is requested
    const streamRequested = req.body.stream === true || req.body.stream === 'true';
    
    if (streamRequested) {
      // Real-time streaming using Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
      
      let fullAnswer = '';
      
      try {
        // Call Lambda with streaming
        const response = await axios.post(bedrockUrl, {
          playerData,
          analysisType: 'chat',
          question: question.trim(),
          conversationHistory: conversationHistoryArray,
          stream: true
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000,
          responseType: 'json'
        });
        
        const aiResponse = response.data;
        
        // If Lambda returns chunks array, stream them in real-time
        if (aiResponse.chunks && Array.isArray(aiResponse.chunks)) {
          for (let i = 0; i < aiResponse.chunks.length; i++) {
            const chunk = aiResponse.chunks[i];
            fullAnswer += chunk;
            
            // Send chunk immediately via SSE
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk, index: i })}\n\n`);
          }
        } else {
          // Fallback: send full response
          fullAnswer = aiResponse.insights || '';
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: fullAnswer })}\n\n`);
        }
        
        // Send completion event
        res.write(`data: ${JSON.stringify({ type: 'done', fullText: fullAnswer })}\n\n`);
        
        // Add AI response to history
        history.messages.push({
          role: 'assistant',
          content: fullAnswer,
          timestamp: Date.now()
        });
        
        // Keep history to last 10 messages max
        if (history.messages.length > 10) {
          history.messages = history.messages.slice(-10);
        }
        
        res.end();
      } catch (streamError) {
        console.error('❌ [AI] Streaming error:', streamError.message);
        res.write(`data: ${JSON.stringify({ type: 'error', error: streamError.message })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response (legacy)
      const response = await axios.post(bedrockUrl, {
        playerData,
        analysisType: 'chat',
        question: question.trim(),
        conversationHistory: conversationHistoryArray,
        stream: false
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });
      
      const aiResponse = response.data;
      const answer = aiResponse.insights || '';
      
      // Add AI response to history
      history.messages.push({
        role: 'assistant',
        content: answer,
        timestamp: Date.now()
      });
      
      // Keep history to last 10 messages max
      if (history.messages.length > 10) {
        history.messages = history.messages.slice(-10);
      }
      
      // Return response
      res.json({
        success: true,
        answer: answer,
        conversationHistory: history.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        _metadata: {
          timestamp: new Date().toISOString(),
          source: 'Amazon Bedrock (DeepSeek V3.1)',
          model: aiResponse.model
        }
      });
    }
    
  } catch (error) {
    console.error('❌ [AI] Chat failed:', error.message);
    if (!res.headersSent) {
      res.status(error.response?.status || 500).json({
        error: 'Failed to process chat question',
        details: error.response?.data || error.message,
        suggestion: 'Check Bedrock Lambda function URL and try again'
      });
    }
  }
});

// Clear conversation history endpoint
app.delete('/api/ai/chat/:puuid', (req, res) => {
  const { puuid } = req.params;
  if (conversationHistory.has(puuid)) {
    conversationHistory.delete(puuid);
    res.json({ success: true, message: 'Conversation history cleared' });
  } else {
    res.json({ success: true, message: 'No conversation history found' });
  }
});

// AI Year-End Summary endpoint (updated to use new format)
app.post('/api/ai/year-end-summary', async (req, res) => {
  try {
    const bedrockUrl = getBedrockLambdaUrl();
    if (!bedrockUrl) {
      console.error('[AI Year-End Summary] BEDROCK_LAMBDA_URL not configured');
      return res.status(500).json({
        error: 'Bedrock Lambda URL not configured',
        details: 'Set BEDROCK_LAMBDA_URL environment variable'
      });
    }

    const { playerData, matchData, playerStats, gameName, tagLine } = req.body;
    
    // Support both new and legacy formats
    let dataToSend = playerData;
    if (!dataToSend && matchData) {
      // Legacy format - convert
      dataToSend = {
        playerInfo: { gameName: gameName || '', tagLine: tagLine || '' },
        matchStats: playerStats || {},
        recentMatches: matchData.slice(0, 20)
      };
    }
    
    if (!dataToSend || !dataToSend.playerInfo) {
      return res.status(400).json({
        error: 'playerData or matchData is required'
      });
    }
    
    const playerName = `${dataToSend.playerInfo.gameName || gameName || ''}#${dataToSend.playerInfo.tagLine || tagLine || ''}`;
    console.log(`🎉 [AI] Generating year-end summary for ${playerName}`);
    
    const response = await axios.post(bedrockUrl, {
      playerData: dataToSend,
      analysisType: 'summary'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    const aiResponse = response.data;
    
    res.json({
      success: true,
      summary: aiResponse.insights,
      playerName: playerName,
      matchesAnalyzed: aiResponse.matchesAnalyzed || 0,
      _metadata: {
        timestamp: new Date().toISOString(),
        source: 'Amazon Bedrock (DeepSeek V3.1)'
      }
    });
    
  } catch (error) {
    console.error('❌ [AI] Summary generation failed:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to generate year-end summary',
      details: error.response?.data || error.message,
      suggestion: 'Check Bedrock Lambda function URL and ensure it\'s accessible'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    configuration: {
      hasApiKey: !!sessionData.apiKey,
      hasCookies: Object.keys(sessionData.cookies).length > 0,
      isValid: sessionData.isValid,
      lastUpdated: sessionData.lastUpdated,
      bedrockConfigured: !!getBedrockLambdaUrl()
    }
  });
});

// Endpoint to get available regions
app.get('/api/regions', (req, res) => {
  res.json({
    platform: {
      'na1': 'North America',
      'euw1': 'Europe West',
      'eun1': 'Europe Nordic & East',
      'kr': 'Korea',
      'br1': 'Brazil',
      'jp1': 'Japan',
      'la1': 'Latin America North',
      'la2': 'Latin America South',
      'oc1': 'Oceania',
      'tr1': 'Turkey',
      'ru': 'Russia'
    },
    regional: {
      'americas': 'Americas (NA, BR, LAN, LAS)',
      'asia': 'Asia (KR, JP)',
      'europe': 'Europe (EUW, EUNE, TR, RU)',
      'sea': 'Southeast Asia (OCE, etc.)'
    }
  });
});

// Documentation endpoint - Explains the proper Riot API workflow
app.get('/api/docs/riot-id-workflow', (req, res) => {
  res.json({
    title: 'Riot ID to Summoner Data Workflow',
    description: 'Official workflow for obtaining PUUID and summonerID from RiotID as per Riot Games API documentation',
    workflow: {
      step1: {
        endpoint: 'ACCOUNT-V1',
        url: '/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}',
        documentation: 'https://developer.riotgames.com/apis#account-v1/GET_getByRiotId',
        purpose: 'Obtain the PUUID associated with a given account by Riot ID (gameName + tagLine)',
        parameters: {
          gameName: 'The game name part of the Riot ID',
          tagLine: 'The tag line part of the Riot ID',
          region: 'Regional endpoint (americas, asia, europe, sea)'
        },
        returns: ['puuid', 'gameName', 'tagLine'],
        example: '/api/riot/account/v1/accounts/by-riot-id/Faker/KR1?region=asia'
      },
      step2: {
        endpoint: 'SUMMONER-V4',
        url: '/lol/summoner/v4/summoners/by-puuid/{encryptedPUUID}',
        documentation: 'https://developer.riotgames.com/apis#summoner-v4/GET_getByPUUID',
        purpose: 'Retrieve summoner data by PUUID, including summonerID',
        parameters: {
          encryptedPUUID: 'The encrypted PUUID obtained from ACCOUNT-V1',
          region: 'Platform endpoint (na1, euw1, kr, etc.)'
        },
        returns: ['id (summonerID)', 'accountId', 'puuid', 'name', 'profileIconId', 'revisionDate', 'summonerLevel'],
        example: '/api/summoner/v4/summoners/by-puuid/{puuid}?region=kr'
      }
    },
    quickStart: {
      description: 'Use our combined endpoint for the complete workflow',
      endpoint: '/api/summoner/v4/summoners/by-riot-id/{gameName}/{tagLine}',
      example: '/api/summoner/v4/summoners/by-riot-id/Faker/KR1?region=kr',
      benefits: [
        'Handles both ACCOUNT-V1 and SUMMONER-V4 calls automatically',
        'Proper regional routing',
        'Comprehensive error handling',
        'Returns combined data with metadata'
      ]
    },
    examples: {
      riotIds: [
        { gameName: 'Faker', tagLine: 'KR1', region: 'kr' },
        { gameName: 'Doublelift', tagLine: 'NA1', region: 'na1' },
        { gameName: 'Caps', tagLine: 'G2', region: 'euw1' }
      ]
    },
    notes: [
      'Always use regional endpoints for ACCOUNT-V1 (americas, asia, europe, sea)',
      'Always use platform endpoints for SUMMONER-V4 (na1, euw1, kr, etc.)',
      'The PUUID is consistent across all Riot games',
      'The summonerID is specific to League of Legends'
    ]
  });
});

// Initialize the server
async function initializeServer() {
  await loadConfig();
  
  app.listen(PORT, () => {
    const serverUrl = process.env.SERVER_URL || `http://localhost:${PORT}`;
    console.log(`🚀 LOL Analytics Backend Server running on ${serverUrl}`);
    console.log(`📊 Configuration Status:`);
    console.log(`   API Key: ${sessionData.apiKey ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`   Cookies: ${Object.keys(sessionData.cookies).length > 0 ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`   Last Updated: ${sessionData.lastUpdated || 'Never'}`);
    console.log(`\n🔗 Available endpoints:`);
    console.log(`   POST /auth/configure - Configure API key or cookies`);
    console.log(`   GET  /auth/status - Check authentication status`);
    console.log(`   GET  /auth/test - Test authentication`);
    console.log(`\n📋 RIOT API DOCUMENTATION COMPLIANT ENDPOINTS:`);
    console.log(`   GET  /api/riot/account/v1/accounts/by-riot-id/:gameName/:tagLine - ACCOUNT-V1: Get PUUID`);
    console.log(`   GET  /api/summoner/v4/summoners/by-puuid/:encryptedPUUID - SUMMONER-V4: Get summoner by PUUID`);
    console.log(`   GET  /api/summoner/v4/summoners/by-riot-id/:gameName/:tagLine - COMBINED: Full RiotID workflow`);
    console.log(`\n🔄 LEGACY ENDPOINTS (for backward compatibility):`);
    console.log(`   GET  /api/summoner/v4/summoners/by-puuid/:puuid - Legacy PUUID lookup`);
    console.log(`   GET  /api/summoner/v4/summoners/:summonerId`);
    console.log(`   GET  /api/champion-mastery/v4/champion-masteries/by-puuid/:puuid`);
    console.log(`   GET  /api/champion-mastery/v4/champion-masteries/by-puuid/:puuid/by-champion/:championId`);
    console.log(`   GET  /api/champion-mastery/v4/scores/by-puuid/:puuid`);
    console.log(`   GET  /api/champion-mastery/v4/champion-masteries/by-puuid/:puuid/top`);
    console.log(`   GET  /api/league/v4/entries/by-summoner/:summonerId (legacy)`);
    console.log(`   GET  /api/league/v4/entries/by-puuid/:puuid (modern)`);
    console.log(`   GET  /api/league/v4/challengerleagues/by-queue/:queue`);
    console.log(`   GET  /api/league/v4/grandmasterleagues/by-queue/:queue`);
    console.log(`   GET  /api/league/v4/masterleagues/by-queue/:queue`);
    console.log(`   GET  /api/league/v4/entries/:queue/:tier/:division`);
    console.log(`   GET  /api/platform/v3/champion-rotations`);
    console.log(`   GET  /api/lol-status/v4/platform-data`);
    console.log(`   GET  /api/clash/v1/players/by-summoner/:summonerId`);
    console.log(`   GET  /api/clash/v1/teams/:teamId`);
    console.log(`   GET  /api/clash/v1/tournaments`);
    console.log(`   GET  /api/challenges/v1/challenges/config`);
    console.log(`   GET  /api/challenges/v1/challenges/percentiles`);
    console.log(`   GET  /api/challenges/v1/challenges/config/:challengeId`);
    console.log(`   GET  /api/challenges/v1/challenges/percentiles/:challengeId`);
    console.log(`   GET  /api/challenges/v1/player-data/by-puuid/:puuid`);
    console.log(`   GET  /api/league-exp/v4/entries/:queue/:tier/:division`);
    console.log(`   GET  /api/match/v5/matches/by-puuid/:puuid/ids`);
    console.log(`   GET  /api/match/v5/matches/:matchId`);
    console.log(`   GET  /api/match/v5/matches/:matchId/timeline`);
    console.log(`   GET  /api/spectator/v5/active-games/by-summoner/:summonerId`);
    console.log(`   GET  /api/spectator/v5/featured-games`);
    console.log(`   GET  /health - Health check`);
    console.log(`   GET  /api/regions - Available regions`);
    console.log(`   GET  /api/docs/riot-id-workflow - Documentation for Riot ID workflow`);
    console.log(`\n🤖 AI ENDPOINTS (Amazon Bedrock):`);
    const startupBedrockUrl = getBedrockLambdaUrl();
    if (startupBedrockUrl) {
      console.log(`   ✅ Bedrock Lambda URL: ${startupBedrockUrl.substring(0, 60)}...`);
      console.log(`   POST /api/ai/analyze - Generate AI insights from player data`);
      console.log(`   POST /api/ai/dashboard-insights - Comprehensive dashboard analysis`);
      console.log(`   POST /api/ai/chat - Conversational Q&A with history`);
      console.log(`   DELETE /api/ai/chat/:puuid - Clear conversation history`);
      console.log(`   POST /api/ai/year-end-summary - Generate year-end summary`);
    } else {
      console.log(`   ❌ Bedrock Lambda URL not configured - AI endpoints disabled`);
      console.log(`   Set BEDROCK_LAMBDA_URL environment variable to enable`);
    }
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down LOL Analytics Backend Server...');
  process.exit(0);
});

// Start the server
initializeServer().catch(console.error);
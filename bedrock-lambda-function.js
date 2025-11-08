import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';

// Initialize Bedrock client
// DeepSeek V3.1 is available in: us-west-2, ap-northeast-1, ap-south-1, eu-west-2, eu-north-1
const bedrockClient = new BedrockRuntimeClient({ region: 'eu-north-1' });

/**
 * Lambda handler - Analyzes League of Legends player data using Amazon Bedrock AI
 * 
 * Expected input:
 * {
 *     "playerData": {...},  // Comprehensive aggregated player data (AIDataPayload)
 *     "analysisType": "dashboard" | "chat" | "summary" | "improvements" | "champion",
 *     "question": "...",  // For chat type
 *     "conversationHistory": [...]  // For chat type
 * }
 */
export const handler = async (event) => {
    try {
        // Parse body (handle both direct and string formats)
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || event);
        const playerData = body.playerData || {};
        let analysisType = body.analysisType || 'dashboard';
        const endpoint = body.endpoint || '';
        
        // Support both new and old data formats
        let finalPlayerData = playerData;
        if (!playerData || Object.keys(playerData).length === 0) {
            // Legacy format support
            const matchData = body.matchData;
            const playerStats = body.playerStats || {};
            
            // Validate matchData is an array
            if (!Array.isArray(matchData) || matchData.length === 0) {
                return errorResponse(400, 'Player data or valid match data array is required');
            }
            
            // Convert legacy format to new format
            finalPlayerData = {
                matchStats: playerStats,
                recentMatches: matchData.slice(0, 20)
            };
        }
        
        // Determine analysis type
        const isStreamingRequest = body.stream === true || body.stream === 'true';
        if (endpoint === 'chat' || analysisType === 'chat') {
            analysisType = 'chat';
            const question = body.question || '';
            
            if (!question || question.trim().length === 0) {
                return errorResponse(400, 'Question is required for chat analysis');
            }
        }
        
        // Build prompt based on analysis type
        const prompt = buildPrompt(
            finalPlayerData,
            analysisType,
            body.question || '',
            body.conversationHistory || []
        );
        console.log('Prompt:', prompt);
        // Determine max tokens based on analysis type
        const maxTokensMap = {
            'dashboard': 10000,  // Increased for comprehensive analysis
            'chat': 1500,
            'summary': 2000,
            'improvements': 1500,
            'champion': 1200,
            'insights': 2000  // Legacy
        };
        const maxTokens = maxTokensMap[analysisType] || 2000;
        
        // Use DeepSeek V3.1 model for all analysis types
        const modelId = 'deepseek.v3-v1:0';
        
        // Prepare Bedrock request for DeepSeek V3.1
        // DeepSeek V3.1 uses messages format (OpenAI-compatible)
        const bedrockRequest = {
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: maxTokens,
            temperature: analysisType === 'chat' ? 0.7 : 0.5,  // More creative for chat, more focused for analysis
            top_p: 0.9
        };
        
        // For chat with streaming, use streaming API
        if (analysisType === 'chat' && isStreamingRequest) {
            return await handleStreamingChat(bedrockRequest, modelId, finalPlayerData, body.conversationHistory || []);
        }
        
        // Call Bedrock DeepSeek model (non-streaming)
        console.log('📤 [BEDROCK] Invoking DeepSeek V3.1 with request:', JSON.stringify({
            modelId,
            maxTokens,
            temperature: bedrockRequest.temperature,
            promptLength: prompt.length
        }));
        
        const command = new InvokeModelCommand({
            modelId: modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(bedrockRequest)
        });
        
        let response;
        try {
            response = await bedrockClient.send(command);
            console.log('✅ [BEDROCK] Received response from DeepSeek');
        } catch (bedrockError) {
            console.error('❌ [BEDROCK] InvokeModel error:', bedrockError);
            console.error('Error details:', {
                name: bedrockError.name,
                message: bedrockError.message,
                code: bedrockError.$metadata?.httpStatusCode,
                requestId: bedrockError.$metadata?.requestId
            });
            
            // Provide helpful error messages
            if (bedrockError.name === 'ValidationException' || bedrockError.message?.includes('model')) {
                throw new Error(`Model access error: ${bedrockError.message}. Check if DeepSeek V3.1 is enabled in Bedrock Console for eu-north-1 region.`);
            } else if (bedrockError.name === 'AccessDeniedException') {
                throw new Error(`Access denied: ${bedrockError.message}. Check IAM permissions for bedrock:InvokeModel.`);
            } else {
                throw new Error(`Bedrock API error: ${bedrockError.message}`);
            }
        }
        
        // Parse DeepSeek response format
        let responseBody;
        try {
            const responseText = new TextDecoder().decode(response.body);
            responseBody = JSON.parse(responseText);
            console.log('📦 [BEDROCK] Raw response structure:', {
                keys: Object.keys(responseBody),
                hasOutput: !!responseBody.output,
                hasChoices: !!responseBody.choices,
                hasContent: !!responseBody.content,
                hasText: !!responseBody.text,
                sample: JSON.stringify(responseBody).substring(0, 300)
            });
        } catch (parseError) {
            console.error('❌ [BEDROCK] Failed to parse response JSON:', parseError);
            const rawBody = new TextDecoder().decode(response.body);
            console.error('Raw response body:', rawBody.substring(0, 500));
            throw new Error(`Failed to parse response as JSON: ${parseError.message}`);
        }
        
        let aiInsights;
        
        // Try multiple possible response formats for DeepSeek
        try {
            // OpenAI-compatible format (primary for DeepSeek V3.1 in Bedrock): { "choices": [{ "message": { "content": "..." } }] }
            if (responseBody.choices?.[0]?.message?.content) {
                const content = responseBody.choices[0].message.content;
                if (typeof content === 'string') {
                    aiInsights = content;
                } else if (Array.isArray(content)) {
                    // Handle array of content blocks
                    aiInsights = content.map(c => (typeof c === 'string' ? c : (c.text || JSON.stringify(c)))).join('\n');
                } else {
                    aiInsights = JSON.stringify(content);
                }
            }
            
            // DeepSeek alternative format: { "output": { "text": "..." } } or { "output": { "message": { "content": "..." } } }
            if (!aiInsights && responseBody.output) {
                if (responseBody.output.text) {
                    aiInsights = responseBody.output.text;
                } else if (responseBody.output.message?.content) {
                    const content = responseBody.output.message.content;
                    if (typeof content === 'string') {
                        aiInsights = content;
                    } else if (Array.isArray(content)) {
                        aiInsights = content.map(c => (typeof c === 'string' ? c : (c.text || JSON.stringify(c)))).join('\n');
                    } else {
                        aiInsights = JSON.stringify(content);
                    }
                } else {
                    console.warn('⚠️ [BEDROCK] output object found but no text/content:', Object.keys(responseBody.output));
                }
            }
            
            // Claude-like format: { "content": [{ "text": "..." }] }
            if (!aiInsights && responseBody.content?.[0]?.text) {
                aiInsights = responseBody.content[0].text;
            }
            
            // Simple text format: { "text": "..." }
            if (!aiInsights && responseBody.text) {
                aiInsights = responseBody.text;
            }
            
            // Fallback: try to extract any text-like content
            if (!aiInsights) {
                console.error('❌ [BEDROCK] Unexpected response format. Full response:', JSON.stringify(responseBody));
                // Try to find any string value in the response
                const findStringValue = (obj, depth = 0) => {
                    if (depth > 5) return null; // Limit recursion
                    if (typeof obj === 'string' && obj.length > 10) return obj;
                    if (Array.isArray(obj)) {
                        for (const item of obj) {
                            const result = findStringValue(item, depth + 1);
                            if (result) return result;
                        }
                    }
                    if (typeof obj === 'object' && obj !== null) {
                        for (const value of Object.values(obj)) {
                            const result = findStringValue(value, depth + 1);
                            if (result) return result;
                        }
                    }
                    return null;
                };
                
                const foundText = findStringValue(responseBody);
                if (foundText) {
                    aiInsights = foundText;
                    console.log('✅ [BEDROCK] Found text in response using fallback search');
                } else {
                    throw new Error(`Unexpected response format from DeepSeek. Response structure: ${JSON.stringify(Object.keys(responseBody)).substring(0, 200)}`);
                }
            }
            
            if (!aiInsights || aiInsights.trim().length === 0) {
                throw new Error('Empty response from DeepSeek model');
            }
            
            console.log(`✅ [BEDROCK] Successfully extracted insights (length: ${aiInsights.length})`);
        } catch (parseError) {
            console.error('❌ [BEDROCK] Response parsing error:', parseError);
            console.error('Response body keys:', Object.keys(responseBody));
            console.error('Response body sample:', JSON.stringify(responseBody).substring(0, 500));
            throw new Error(`Failed to parse DeepSeek response: ${parseError.message}`);
        }
        
        // For dashboard analysis, try to parse structured JSON
        let structuredInsights = null;
        if (analysisType === 'dashboard') {
            try {
                // Try to extract JSON from markdown code blocks if present
                let jsonText = aiInsights.trim();
                
                // Remove markdown code blocks if present
                const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
                if (jsonMatch) {
                    jsonText = jsonMatch[1];
                }
                
                // Try to find JSON object in the text
                const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
                if (jsonObjectMatch) {
                    jsonText = jsonObjectMatch[0];
                }
                
                structuredInsights = JSON.parse(jsonText);
                
                // Validate structure
                if (structuredInsights && Array.isArray(structuredInsights.insights)) {
                    console.log(`✅ [BEDROCK] Successfully parsed structured insights with ${structuredInsights.insights.length} cards`);
                    
                    // Filter out unavailable insights
                    structuredInsights.insights = structuredInsights.insights.filter(insight => insight.available !== false);
                    console.log(`✅ [BEDROCK] Filtered to ${structuredInsights.insights.length} available insight cards`);
                    
                    // Add metadata
                    structuredInsights.analysisType = analysisType;
                    structuredInsights.matchesAnalyzed = finalPlayerData.recentMatches?.length || 0;
                    structuredInsights.model = modelId;
                    structuredInsights.prompt = prompt;
                    structuredInsights.promptMetadata = {
                        promptLength: prompt.length
                    };
                } else {
                    console.warn('⚠️ [BEDROCK] Structured response missing required fields, falling back to legacy format');
                    structuredInsights = null;
                }
            } catch (jsonError) {
                console.warn('⚠️ [BEDROCK] Failed to parse structured JSON, falling back to legacy format:', jsonError.message);
                structuredInsights = null;
            }
        }
        
        // Log the prompt for debugging (also return it)
        console.log('📝 [BEDROCK] Prompt sent to DeepSeek V3.1:');
        console.log('─────────────────────────────────────────');
        console.log(prompt);
        console.log('─────────────────────────────────────────');
        console.log(`Model: ${modelId}, Max Tokens: ${maxTokens}, Temperature: ${bedrockRequest.temperature}`);
        
        // Return structured response if available, otherwise legacy format
        if (structuredInsights) {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(structuredInsights)
            };
        } else {
            // Legacy format for backward compatibility
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    insights: aiInsights,
                    analysisType: analysisType,
                    matchesAnalyzed: finalPlayerData.recentMatches?.length || 0,
                    model: modelId,
                    prompt: prompt,  // Include prompt in response
                    promptLength: prompt.length,
                    modelUsed: modelId,
                    maxTokens: maxTokens
                })
            };
        }
        
    } catch (error) {
        console.error('❌ [LAMBDA] Error:', error);
        console.error('Stack:', error.stack);
        
        // Return detailed error for debugging
        const errorDetails = {
            message: error.message,
            name: error.name,
            stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
        };
        
        console.error('Error details:', JSON.stringify(errorDetails));
        
        return errorResponse(500, `Internal server error: ${error.message}. Check CloudWatch logs for details.`);
    }
};

/**
 * Helper to create error responses
 */
function errorResponse(statusCode, message) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: message })
    };
}

/**
 * Builds optimized prompt for Claude based on analysis type
 */
function buildPrompt(playerData, analysisType, question = '', conversationHistory = []) {
    // Extract player info
    const playerInfo = playerData.playerInfo || {};
    const gameName = playerInfo.gameName || 'Player';
    const tagLine = playerInfo.tagLine || '';
    const level = playerInfo.summonerLevel || 0;
    const region = playerInfo.region || 'na1';
    
    // Extract match stats
    const matchStats = playerData.matchStats || {};
    const totalGames = matchStats.totalGames || 0;
    const wins = matchStats.wins || 0;
    const losses = matchStats.losses || 0;
    const winRate = matchStats.winRate || 0;
    const recentWinRate = matchStats.recentWinRate || 0;
    const avgKDA = matchStats.avgKDA || { kills: 0, deaths: 0, assists: 0 };
    const avgDamage = matchStats.avgDamage || 0;
    const avgVision = matchStats.avgVision || 0;
    
    // Extract champion mastery
    const championMastery = playerData.championMastery || {};
    // Show more champions for dashboard (10) vs others (5)
    const topChampions = Array.isArray(championMastery.topChampions) 
        ? championMastery.topChampions.slice(0, 10) 
        : [];
    const totalMasteryScore = championMastery.totalMasteryScore || 0;
    const championsMastered = championMastery.championsMastered || 0;
    
    // Extract challenges
    const challenges = playerData.challenges || {};
    const challengePoints = challenges.totalPoints;
    const categoryPoints = challenges.categoryPoints || {};
    
    // Extract ranked info
    const ranked = playerData.ranked || {};
    const soloQueue = ranked.soloQueue;
    const flexQueue = ranked.flexQueue;
    
    // Extract recent matches (limit to 20 for dashboard, 10 for others)
    const recentMatches = Array.isArray(playerData.recentMatches) 
        ? playerData.recentMatches.slice(0, 20) 
        : [];
    
    // Extract insights
    const insights = playerData.insights || {};
    
    // Extract clash data
    const clash = playerData.clash || {};
    const tournamentsParticipated = clash.tournamentsParticipated || 0;
    const bestClashResult = clash.bestResult;
    
    if (analysisType === 'dashboard') {
        // Check data availability for each insight type
        const hasMatchData = totalGames >= 5;
        const hasChampionData = topChampions.length > 0;
        const hasRankedData = !!(soloQueue || flexQueue);
        const hasChallengeData = !!challengePoints;
        const hasClashData = tournamentsParticipated > 0;
        const trends = matchStats.trends || {};
        const hasTrendData = Array.isArray(trends.winRateLast30Days) && trends.winRateLast30Days.length > 0;
        
        // Build role stats from recent matches
        const roleStats = {};
        if (Array.isArray(recentMatches) && recentMatches.length > 0) {
            recentMatches.forEach(match => {
                const role = match.role || match.teamPosition || 'UNKNOWN';
                if (!roleStats[role]) {
                    roleStats[role] = { games: 0, wins: 0 };
                }
                roleStats[role].games++;
                if (match.win) roleStats[role].wins++;
            });
        }
        const hasRoleData = Object.keys(roleStats).length > 0;
        
        return `Analyze ${gameName}#${tagLine}'s League of Legends performance data and return a structured JSON response with multiple insight cards.

Player: ${gameName}#${tagLine} (Level ${level}, ${region})
${soloQueue ? `Rank: ${soloQueue.tier} ${soloQueue.rank} (${soloQueue.leaguePoints} LP)` : ''}

PERFORMANCE SUMMARY:
- Total Games: ${totalGames} (${wins}W-${losses}L, ${winRate.toFixed(1)}% win rate)
- Recent Form: ${recentWinRate.toFixed(1)}% in last 10 games
- Average KDA: ${avgKDA.kills.toFixed(1)}/${avgKDA.deaths.toFixed(1)}/${avgKDA.assists.toFixed(1)}
- Average Damage: ${avgDamage.toFixed(0)}
- Average Vision Score: ${avgVision.toFixed(1)}
${hasTrendData ? `- Win Rate Trend (last 30 days): ${JSON.stringify(trends.winRateLast30Days || [])}` : ''}
${hasTrendData ? `- KDA Trend (last 30 days): ${JSON.stringify(trends.kdaLast30Days || [])}` : ''}
${hasTrendData ? `- Damage Trend (last 30 days): ${JSON.stringify(trends.damageLast30Days || [])}` : ''}

CHAMPION MASTERY:
- Total Mastery Score: ${totalMasteryScore.toLocaleString()}
- Champions Mastered (Level 5+): ${championsMastered}
- Top Champions (${topChampions.length}):
${topChampions.length > 0 ? topChampions.map(c => {
    const champName = c.championName || `Champion_${c.championId}`;
    const games = c.games || 0;
    const winRate = c.winRate ? `${c.winRate.toFixed(1)}%` : 'N/A';
    const kda = c.avgKDA ? c.avgKDA.toFixed(2) : 'N/A';
    const mastery = c.masteryLevel ? `Level ${c.masteryLevel}` : '';
    return `  - ${champName}: ${games} games, ${winRate} WR, ${kda} KDA${mastery ? `, ${mastery}` : ''}`;
}).join('\n') : '  None'}

RECENT MATCHES (Last ${recentMatches.length}):
${formatRecentMatches(recentMatches)}

ROLE PERFORMANCE:
${hasRoleData ? Object.entries(roleStats).map(([role, stats]) => {
    const wr = stats.games > 0 ? ((stats.wins / stats.games) * 100).toFixed(1) : '0';
    return `  - ${role}: ${stats.games} games, ${stats.wins}W-${stats.games - stats.wins}L (${wr}% WR)`;
}).join('\n') : '  No role data available'}

${challengePoints ? formatChallengesSection(challenges) : ''}

${(soloQueue || flexQueue) ? formatRankedSection(ranked) : ''}

${tournamentsParticipated > 0 ? formatClashSection(clash) : ''}

${formatInsightsSection(insights)}

CRITICAL: You MUST return ONLY valid JSON, no markdown, no code blocks, no explanations. The response must be a JSON object with this exact structure:

{
  "insights": [
    {
      "type": "match_performance",
      "title": "Match Performance Analysis",
      "textInsights": "Write 2-3 paragraphs analyzing their match performance, win rate trends, recent form, and overall consistency. Use 'you' and 'your' throughout.",
      "visualData": {
        "chartType": "line",
        "data": ${hasTrendData ? JSON.stringify(trends.winRateLast30Days.map((wr, i) => ({ date: `Day ${i + 1}`, value: wr }))) : '[]'},
        "labels": ${hasTrendData ? JSON.stringify(trends.winRateLast30Days.map((_, i) => `Day ${i + 1}`)) : '[]'}
      },
      "available": ${hasMatchData}
    },
    {
      "type": "champion_mastery",
      "title": "Champion Mastery & Performance",
      "textInsights": "Write 2-3 paragraphs about their champion pool, mastery distribution, top performing champions, and recommendations.",
      "visualData": {
        "chartType": "bar",
        "data": ${hasChampionData ? JSON.stringify(topChampions.slice(0, 8).map(c => ({ name: c.championName || `Champ_${c.championId}`, value: c.winRate || 0 }))) : '[]'},
        "labels": ${hasChampionData ? JSON.stringify(topChampions.slice(0, 8).map(c => c.championName || `Champ_${c.championId}`)) : '[]'}
      },
      "available": ${hasChampionData}
    },
    {
      "type": "ranked_progression",
      "title": "Ranked Progression",
      "textInsights": "Write 2-3 paragraphs about their ranked status, progression, and goals.",
      "visualData": {
        "chartType": "progress",
        "data": ${hasRankedData ? JSON.stringify([{ label: soloQueue ? `${soloQueue.tier} ${soloQueue.rank}` : 'Unranked', value: soloQueue ? soloQueue.leaguePoints : 0, max: 100 }]) : '[]'}
      },
      "available": ${hasRankedData}
    },
    {
      "type": "challenges_achievements",
      "title": "Challenges & Achievements",
      "textInsights": "Write 2-3 paragraphs about their challenge progress, achievements, and milestones.",
      "visualData": {
        "chartType": "pie",
        "data": ${hasChallengeData ? JSON.stringify(Object.entries(categoryPoints).map(([key, val]) => ({ name: key, value: typeof val === 'number' ? val : 0 }))) : '[]'},
        "labels": ${hasChallengeData ? JSON.stringify(Object.keys(categoryPoints)) : '[]'}
      },
      "available": ${hasChallengeData}
    },
    {
      "type": "role_performance",
      "title": "Role Performance Analysis",
      "textInsights": "Write 2-3 paragraphs analyzing their performance across different roles, strengths, and role-specific recommendations.",
      "visualData": {
        "chartType": "bar",
        "data": ${hasRoleData ? JSON.stringify(Object.entries(roleStats).map(([role, stats]) => ({ name: role, value: stats.games > 0 ? ((stats.wins / stats.games) * 100) : 0 }))) : '[]'},
        "labels": ${hasRoleData ? JSON.stringify(Object.keys(roleStats)) : '[]'}
      },
      "available": ${hasRoleData}
    },
    {
      "type": "kda_damage_trends",
      "title": "KDA & Damage Trends",
      "textInsights": "Write 2-3 paragraphs about their KDA trends, damage output patterns, and performance consistency.",
      "visualData": {
        "chartType": "line",
        "data": ${hasTrendData ? JSON.stringify(trends.kdaLast30Days.map((kda, i) => ({ date: `Day ${i + 1}`, value: kda }))) : '[]'},
        "labels": ${hasTrendData ? JSON.stringify(trends.kdaLast30Days.map((_, i) => `Day ${i + 1}`)) : '[]'}
      },
      "available": ${hasTrendData}
    },
    {
      "type": "vision_map_control",
      "title": "Vision & Map Control",
      "textInsights": "Write 2-3 paragraphs about their vision score, map control, and warding habits.",
      "visualData": {
        "chartType": "bar",
        "data": ${hasMatchData ? JSON.stringify([{ name: 'Avg Vision', value: avgVision }]) : '[]'},
        "labels": ${hasMatchData ? JSON.stringify(['Average Vision Score']) : '[]'}
      },
      "available": ${hasMatchData}
    },
    {
      "type": "clash_tournament",
      "title": "Clash & Tournament Results",
      "textInsights": "Write 2-3 paragraphs about their tournament participation, best results, and team play.",
      "visualData": {
        "chartType": "progress",
        "data": ${hasClashData ? JSON.stringify([{ label: 'Tournaments', value: tournamentsParticipated, max: 10 }]) : '[]'}
      },
      "available": ${hasClashData}
    },
    {
      "type": "overall_performance_rating",
      "title": "Overall Performance Rating",
      "textInsights": "Write 2-3 paragraphs providing an overall 1-10 rating with detailed justification based on rank, stats, and performance patterns.",
      "visualData": {
        "chartType": "radar",
        "data": ${hasMatchData ? JSON.stringify([
          { metric: 'Win Rate', value: winRate, max: 100 },
          { metric: 'KDA', value: avgKDA.deaths > 0 ? ((avgKDA.kills + avgKDA.assists) / avgKDA.deaths) : (avgKDA.kills + avgKDA.assists), max: 5 },
          { metric: 'Damage', value: Math.min(avgDamage / 1000, 50), max: 50 },
          { metric: 'Vision', value: Math.min(avgVision, 100), max: 100 }
        ]) : '[]'},
        "labels": ${hasMatchData ? JSON.stringify(['Win Rate', 'KDA', 'Damage', 'Vision']) : '[]'}
      },
      "available": ${hasMatchData}
    },
    {
      "type": "improvement_roadmap",
      "title": "Improvement Roadmap",
      "textInsights": "Write 2-3 paragraphs with 5 prioritized, actionable steps (P1-P5) with specific metrics and goals for improvement.",
      "visualData": {
        "chartType": "bar",
        "data": ${hasMatchData ? JSON.stringify([
          { name: 'P1', value: 5 },
          { name: 'P2', value: 4 },
          { name: 'P3', value: 3 },
          { name: 'P4', value: 2 },
          { name: 'P5', value: 1 }
        ]) : '[]'},
        "labels": ${hasMatchData ? JSON.stringify(['Priority 1', 'Priority 2', 'Priority 3', 'Priority 4', 'Priority 5']) : '[]'}
      },
      "available": ${hasMatchData}
    }
  ]
}

IMPORTANT:
- Return ONLY the JSON object, no markdown code blocks, no explanations
- Set "available": false for insight types where insufficient data exists
- Write personalized text insights using "you" and "your" throughout
- Reference specific champions, matches, and stats
- Be direct, specific, and actionable
`;
    } else if (analysisType === 'chat') {
        // Classify question type
        const questionLower = question.toLowerCase();
        const isWeaknessQ = ['weakness', 'weak', 'improve', 'bad', 'lose', 'problem'].some(word => questionLower.includes(word));
        const isChampionQ = ['champion', 'champ', 'pick', 'pool', 'play'].some(word => questionLower.includes(word));
        const isRoleQ = ['role', 'position', 'lane', 'best'].some(word => questionLower.includes(word));
        const isKdaQ = ['kda', 'kill', 'death', 'assist'].some(word => questionLower.includes(word));
        
        // Build relevant context
        const contextParts = [];
        if (isWeaknessQ) {
            contextParts.push(`Win Rate: ${winRate.toFixed(1)}%, Avg Deaths: ${avgKDA.deaths.toFixed(1)}, Avg Vision: ${avgVision.toFixed(1)}`);
            if (Array.isArray(insights.improvementAreas) && insights.improvementAreas.length > 0) {
                contextParts.push(`Identified Issues: ${insights.improvementAreas.join(', ')}`);
            }
        }
        
        if (isChampionQ) {
            const champList = topChampions.slice(0, 5).map(c => `${c.championName} (${c.winRate?.toFixed(1) || 0}% WR)`).join(', ');
            contextParts.push(`Top Champions: ${champList}`);
        }
        
        if (isRoleQ) {
            contextParts.push('Most played roles from recent matches');
        }
        
        if (isKdaQ) {
            contextParts.push(`Current KDA: ${avgKDA.kills.toFixed(1)}/${avgKDA.deaths.toFixed(1)}/${avgKDA.assists.toFixed(1)}`);
        }
        
        // Default context
        if (contextParts.length === 0) {
            contextParts.push(`Stats: ${winRate.toFixed(1)}% WR, ${totalGames} games, Avg KDA: ${avgKDA.kills.toFixed(1)}/${avgKDA.deaths.toFixed(1)}/${avgKDA.assists.toFixed(1)}`);
        }
        
        // Build conversation history
        let historyText = '';
        if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
            historyText = '\nCONVERSATION HISTORY:\n';
            conversationHistory.slice(-5).forEach(msg => {
                const role = msg.role || 'user';
                const content = msg.content || '';
                historyText += `${role.toUpperCase()}: ${content}\n`;
            });
        }
        
        return `You are an AI assistant helping a League of Legends player analyze their performance.

PLAYER: ${gameName}#${tagLine}
CONTEXT: ${contextParts.join(', ')}
${historyText}

CURRENT QUESTION: ${question}

Provide a concise, helpful answer (2-4 sentences). Reference specific stats when relevant. Be constructive and actionable.
`;
    } else if (analysisType === 'summary') {
        return `Create a fun, engaging year-end recap for League player ${gameName}#${tagLine}.

KEY STATS:
- ${wins} wins, ${losses} losses (${winRate.toFixed(1)}% win rate)
- ${totalMasteryScore.toLocaleString()} total mastery points
- ${championsMastered} champions mastered
- Top Champions: ${topChampions.slice(0, 3).map(c => c.championName || 'Unknown').join(', ')}
${challengePoints ? formatChallengesForSummary(challenges) : ''}

RECENT PERFORMANCE:
${formatRecentMatches(recentMatches.slice(0, 5))}

Generate:
- Most memorable achievements (be specific)
- Champion journey highlights
- Improvement story (use trends if available)
- Fun stats and milestones
- Personalized "coach's note" style summary

Tone: Celebratory, authentic, shareable. Make it something they'd want to post! Use emojis sparingly (2-3 max).
`;
    } else if (analysisType === 'improvements') {
        return `Analyze this player's performance and provide specific improvement recommendations.

PERFORMANCE DATA:
- Win Rate: ${winRate.toFixed(1)}% (${recentWinRate.toFixed(1)}% recent)
- Avg KDA: ${avgKDA.kills.toFixed(1)}/${avgKDA.deaths.toFixed(1)}/${avgKDA.assists.toFixed(1)}
- Avg Damage: ${avgDamage.toFixed(0)}
- Avg Vision: ${avgVision.toFixed(1)}
- Improvement Areas Identified: ${Array.isArray(insights.improvementAreas) && insights.improvementAreas.length > 0 ? insights.improvementAreas.join(', ') : 'None specified'}

RECENT MATCHES:
${formatRecentMatches(recentMatches.slice(0, 8))}

Identify:
1. Recurring mistakes or weaknesses (be specific with examples)
2. Champion-specific improvement areas (which champs need work)
3. Gameplay pattern issues (positioning, decision-making, etc.)
4. Ranked progression opportunities (if ranked data available)
5. Concrete, actionable steps they can take (prioritized)

Be constructive, specific, and focus on actionable improvements. Format as numbered recommendations with clear priorities.
`;
    } else if (analysisType === 'champion') {
        const champList = topChampions.slice(0, 10).map(c => 
            `- ${c.championName}: ${c.games || 0} games, ${c.winRate?.toFixed(1) || 0}% WR, ${c.avgKDA?.toFixed(2) || 0} KDA`
        ).join('\n');
        
        return `Analyze this player's champion pool and provide recommendations.

CHAMPION POOL:
${champList}

TOTAL MASTERY: ${totalMasteryScore.toLocaleString()} points, ${championsMastered} champions mastered

RECENT PERFORMANCE:
- Overall Win Rate: ${winRate.toFixed(1)}%
- Strongest Champions: ${Array.isArray(insights.strongestChampions) && insights.strongestChampions.length > 0 ? insights.strongestChampions.join(', ') : 'None specified'}
- Weakest Champions: ${Array.isArray(insights.weakestChampions) && insights.weakestChampions.length > 0 ? insights.weakestChampions.join(', ') : 'None specified'}

Provide:
1. Champion pool strengths and weaknesses
2. Recommendations for which champions to focus on
3. Champions to consider dropping from pool
4. New champions to learn based on playstyle
5. Champion-specific tips for top 3 played champions

Be specific with data-driven recommendations.
`;
    } else {
        // Legacy 'insights' or fallback
        return `Analyze this League of Legends player's performance data.

Player: ${gameName}#${tagLine}
Win Rate: ${winRate.toFixed(1)}% (${wins}W-${losses}L)
Avg KDA: ${avgKDA.kills.toFixed(1)}/${avgKDA.deaths.toFixed(1)}/${avgKDA.assists.toFixed(1)}
Top Champions: ${topChampions.map(c => c.championName || 'Unknown').join(', ')}

Provide:
1. Persistent Strengths
2. Areas for Growth
3. Playstyle Analysis
4. Champion Insights
5. Key Recommendations

Format: Engaging, personalized insights with specific examples.
`;
    }
}

function formatRecentMatches(matches) {
    if (!Array.isArray(matches) || matches.length === 0) {
        return 'No recent matches available.';
    }
    
    return matches.map(match => {
        const champ = match.champion || 'Unknown';
        const win = match.win ? 'Win' : 'Loss';
        const kda = match.kda || {};
        const kdaStr = `${kda.k || 0}/${kda.d || 0}/${kda.a || 0}`;
        const damage = (match.damage || 0).toLocaleString();
        const vision = match.vision || 0;
        const gold = match.gold || 0;
        const cs = match.cs || 0;
        const gameDuration = match.gameDuration || 0;
        const gameMode = match.gameMode || '';
        
        // Build detailed match info
        let matchInfo = `- ${champ} (${match.role || 'UNKNOWN'}): ${win}, ${kdaStr} KDA, ${damage} damage`;
        
        // Add additional stats if available
        const additionalStats = [];
        if (vision > 0) additionalStats.push(`${vision.toFixed(1)} vision`);
        if (gold > 0) additionalStats.push(`${(gold / 1000).toFixed(1)}k gold`);
        if (cs > 0) additionalStats.push(`${cs} CS`);
        if (gameDuration > 0) {
            const minutes = Math.floor(gameDuration / 60);
            const seconds = gameDuration % 60;
            additionalStats.push(`${minutes}:${seconds.toString().padStart(2, '0')} duration`);
        }
        
        if (additionalStats.length > 0) {
            matchInfo += ` (${additionalStats.join(', ')})`;
        }
        
        return matchInfo;
    }).join('\n');
}

function formatChallengesSection(challenges) {
    const totalPoints = challenges.totalPoints;
    if (!totalPoints) {
        return '';
    }
    
    const level = totalPoints.level || 'IRON';
    const percentile = totalPoints.percentile || 0;
    const categoryPoints = challenges.categoryPoints || {};
    
    return `CHALLENGES & ACHIEVEMENTS:
- Challenge Level: ${level}
- Percentile: ${percentile.toFixed(1)}%
- Category Points: COMBAT=${categoryPoints.COMBAT || 0}, EXPERTISE=${categoryPoints.EXPERTISE || 0}, TEAMWORK=${categoryPoints.TEAMWORK || 0}`;
}

function formatRankedSection(ranked) {
    const solo = ranked.soloQueue;
    const flex = ranked.flexQueue;
    
    const parts = [];
    if (solo) {
        parts.push(`Solo Queue: ${solo.tier} ${solo.rank} (${solo.leaguePoints} LP, ${solo.winRate?.toFixed(1) || 0}% WR)`);
    }
    if (flex) {
        parts.push(`Flex Queue: ${flex.tier} ${flex.rank} (${flex.leaguePoints} LP, ${flex.winRate?.toFixed(1) || 0}% WR)`);
    }
    
    if (parts.length > 0) {
        return `RANKED STATUS:\n${parts.join('\n')}`;
    }
    return '';
}

function formatInsightsSection(insights) {
    const parts = [];
    if (Array.isArray(insights.strongestChampions) && insights.strongestChampions.length > 0) {
        parts.push(`Strongest Champions: ${insights.strongestChampions.join(', ')}`);
    }
    if (Array.isArray(insights.weakestChampions) && insights.weakestChampions.length > 0) {
        parts.push(`Weakest Champions: ${insights.weakestChampions.join(', ')}`);
    }
    if (Array.isArray(insights.improvementAreas) && insights.improvementAreas.length > 0) {
        parts.push(`Areas Needing Work: ${insights.improvementAreas.join(', ')}`);
    }
    
    if (parts.length > 0) {
        return `PRE-IDENTIFIED INSIGHTS:\n${parts.join('\n')}`;
    }
    return '';
}

function formatChallengesForSummary(challenges) {
    const totalPoints = challenges.totalPoints;
    if (!totalPoints) {
        return '';
    }
    
    const level = totalPoints.level || 'IRON';
    return `- Challenge Level: ${level}`;
}

function formatClashSection(clash) {
    const tournamentsParticipated = clash.tournamentsParticipated || 0;
    if (tournamentsParticipated === 0) {
        return '';
    }
    
    const bestResult = clash.bestResult;
    const parts = [`Tournaments Participated: ${tournamentsParticipated}`];
    
    if (bestResult) {
        parts.push(`Best Result: ${bestResult.tournamentName || 'Tournament'} - Position ${bestResult.position || 'N/A'}`);
    }
    
    return `TOURNAMENT PARTICIPATION:\n${parts.join('\n')}`;
}

/**
 * Handle streaming chat responses
 * Accumulates stream chunks and returns them in a format suitable for streaming
 */
async function handleStreamingChat(bedrockRequest, modelId, playerData, conversationHistory) {
    try {
        console.log('📤 [BEDROCK] Starting streaming chat with DeepSeek V3.1');
        
        const command = new InvokeModelWithResponseStreamCommand({
            modelId: modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(bedrockRequest)
        });
        
        const response = await bedrockClient.send(command);
        const stream = response.body;
        
        if (!stream) {
            throw new Error('No stream received from Bedrock');
        }
        
        // Accumulate chunks
        const chunks = [];
        let fullText = '';
        
        // Process the stream
        for await (const event of stream) {
            if (event.chunk) {
                const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
                
                // Extract text from various possible formats
                let text = '';
                if (chunk.choices?.[0]?.delta?.content) {
                    text = chunk.choices[0].delta.content;
                } else if (chunk.delta?.text) {
                    text = chunk.delta.text;
                } else if (chunk.output?.text) {
                    text = chunk.output.text;
                } else if (typeof chunk.text === 'string') {
                    text = chunk.text;
                }
                
                if (text) {
                    chunks.push(text);
                    fullText += text;
                }
            }
        }
        
        console.log(`✅ [BEDROCK] Streaming complete. Received ${chunks.length} chunks, total length: ${fullText.length}`);
        
        // Return streaming response format
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                insights: fullText,
                chunks: chunks,  // Include chunks for client-side streaming simulation
                stream: true,
                analysisType: 'chat',
                matchesAnalyzed: playerData.recentMatches?.length || 0,
                model: modelId
            })
        };
        
    } catch (error) {
        console.error('❌ [BEDROCK] Streaming error:', error);
        return errorResponse(500, `Streaming error: ${error.message}`);
    }
}


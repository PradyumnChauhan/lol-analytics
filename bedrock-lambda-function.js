import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

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
        
        // Call Bedrock DeepSeek model
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
        
        // Log the prompt for debugging (also return it)
        console.log('📝 [BEDROCK] Prompt sent to DeepSeek V3.1:');
        console.log('─────────────────────────────────────────');
        console.log(prompt);
        console.log('─────────────────────────────────────────');
        console.log(`Model: ${modelId}, Max Tokens: ${maxTokens}, Temperature: ${bedrockRequest.temperature}`);
        
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
        return `Analyze ${gameName}#${tagLine}'s League of Legends performance data. Write a personalized, direct analysis addressing them with "you" and "your" throughout. Do NOT include generic openings like "Of course", "Here is", or "Here's". Start directly with the analysis.

Player: ${gameName}#${tagLine} (Level ${level}, ${region})
${soloQueue ? `Rank: ${soloQueue.tier} ${soloQueue.rank} (${soloQueue.leaguePoints} LP)` : ''}

PERFORMANCE SUMMARY:
- Total Games: ${totalGames} (${wins}W-${losses}L, ${winRate.toFixed(1)}% win rate)
- Recent Form: ${recentWinRate.toFixed(1)}% in last 10 games
- Average KDA: ${avgKDA.kills.toFixed(1)}/${avgKDA.deaths.toFixed(1)}/${avgKDA.assists.toFixed(1)}
- Average Damage: ${avgDamage.toFixed(0)}
- Average Vision Score: ${avgVision.toFixed(1)}

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

${challengePoints ? formatChallengesSection(challenges) : ''}

${(soloQueue || flexQueue) ? formatRankedSection(ranked) : ''}

${tournamentsParticipated > 0 ? formatClashSection(clash) : ''}

${formatInsightsSection(insights)}

Provide a detailed, personalized analysis. Write directly to the player using "you" and "your". Reference specific champions, matches, and stats from their data. Be specific and actionable.

Structure your analysis with these sections (use markdown headers):
1. **Key Strengths** - Identify top 3 strengths with specific examples from their recent matches and champion performance. Reference exact champions, KDA ratios, and win rates.
2. **Areas for Improvement** - Identify top 3 improvement areas with specific metrics and examples from their gameplay. Reference specific matches where issues occurred.
3. **Playstyle Analysis** - Analyze their playstyle (aggressive/defensive/team-oriented) based on their stats, champion picks, and performance patterns.
4. **Champion Pool Insights** - Provide specific recommendations about their champion pool. Reference their mastery data, win rates, and suggest which champions to focus on or avoid.
5. **Role Recommendations** - Based on their performance across roles, recommend their best roles and explain why.
6. **Improvement Roadmap** - Provide 5 prioritized, actionable steps with specific metrics and goals. Use P1, P2, etc. for priorities.
7. **Overall Performance Rating** - Give a 1-10 rating with detailed justification based on their rank, stats, and performance patterns.

IMPORTANT:
- Start immediately with the analysis title. No pleasantries or generic openings.
- Use "you" and "your" throughout - write directly to the player.
- Reference specific champions by name (not Champion_ID), specific match results, and exact stats.
- Be direct, specific, and actionable.
- Use markdown formatting for headers and bullet points.
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


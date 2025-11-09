'use client';

import { useState, useCallback, useRef } from 'react';
import { AIDataPayload } from '@/lib/ai/data-aggregator';
import type { InsightCard, DashboardInsightsResponse } from '@/lib/ai/types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface DashboardInsights {
  insights: string | InsightCard[] | DashboardInsightsResponse;
  analysisType: string;
  matchesAnalyzed: number;
  model?: string;
  prompt?: string;
  promptMetadata?: {
    promptLength: number;
    modelUsed?: string;
    maxTokens?: number;
  };
}

interface UseAIAnalyticsReturn {
  dashboardInsights: DashboardInsights | null;
  chatHistory: ChatMessage[];
  loading: boolean;
  isStreaming: boolean;
  error: string | null;
  fetchDashboardInsights: (playerData: AIDataPayload) => Promise<void>;
  askQuestion: (question: string, playerData: AIDataPayload, puuid?: string) => Promise<void>;
  generateSummary: (playerData: AIDataPayload) => Promise<void>;
  clearChat: () => void;
}

// Cache for dashboard insights (keyed by data hash)
const insightsCache = new Map<string, { data: DashboardInsights; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function useAIAnalytics(): UseAIAnalyticsReturn {
  const [dashboardInsights, setDashboardInsights] = useState<DashboardInsights | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<string>('');
  const streamingAbortRef = useRef<AbortController | null>(null);

  // Generate cache key from player data
  const generateCacheKey = (playerData: AIDataPayload): string => {
    const puuid = playerData.playerInfo?.gameName + '#' + playerData.playerInfo?.tagLine || '';
    const matchCount = playerData.recentMatches?.length || 0;
    const masteryCount = playerData.championMastery?.topChampions?.length || 0;
    return `${puuid}-${matchCount}-${masteryCount}`;
  };

  const fetchDashboardInsights = useCallback(async (playerData: AIDataPayload) => {
    // Check cache first
    const cacheKey = generateCacheKey(playerData);
    const cached = insightsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setDashboardInsights(cached.data);
      return;
    }

    // Prevent duplicate requests
    if (loading || lastFetchRef.current === cacheKey) {
      return;
    }

    lastFetchRef.current = cacheKey;
    setLoading(true);
    setError(null);

    try {
      // Use Next.js API route with 15-minute timeout support
      // The route is configured with maxDuration = 900 seconds (15 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 16 * 60 * 1000); // 16 minutes to be safe
      
      const response = await fetch('/api/ai/dashboard-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerData }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || `Failed to fetch dashboard insights: ${response.status}`;
        
        // Provide helpful error messages
        if (response.status === 504) {
          throw new Error(`${errorMessage}. Gateway timeout - request may take up to 15 minutes.`);
        } else if (response.status === 500) {
          throw new Error(`${errorMessage}. Server error - the AI processing may have failed. Please try again.`);
        } else {
          throw new Error(errorMessage);
        }
      }

      const data = await response.json();
      
      // Handle both structured and legacy response formats
      let insights: DashboardInsights;
      
      if (data.insights && Array.isArray(data.insights)) {
        // Structured format with insight cards
        insights = {
          insights: data.insights as InsightCard[],
          analysisType: data.analysisType || 'dashboard',
          matchesAnalyzed: data.matchesAnalyzed || 0,
          model: data.model,
          prompt: data.prompt,
          promptMetadata: data.promptMetadata,
        };
      } else if (typeof data.insights === 'string') {
        // Legacy text format
        insights = {
        insights: data.insights,
          analysisType: data.analysisType || 'dashboard',
          matchesAnalyzed: data.matchesAnalyzed || 0,
          model: data.model,
          prompt: data.prompt,
          promptMetadata: data.promptMetadata,
        };
      } else {
        // Fallback: treat as structured response object
        insights = {
          insights: data as DashboardInsightsResponse,
          analysisType: data.analysisType || 'dashboard',
        matchesAnalyzed: data.matchesAnalyzed || 0,
        model: data.model,
          prompt: data.prompt,
        promptMetadata: data.promptMetadata,
      };
      }

      setDashboardInsights(insights);
      insightsCache.set(cacheKey, { data: insights, timestamp: Date.now() });
    } catch (err: unknown) {
      console.error('Failed to fetch dashboard insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch AI insights');
    } finally {
      setLoading(false);
      lastFetchRef.current = '';
    }
  }, [loading]);

  const askQuestion = useCallback(async (
    question: string,
    playerData: AIDataPayload,
    puuid?: string
  ) => {
    if (!question.trim()) {
      setError('Question cannot be empty');
      return;
    }

    // Prevent spam - limit requests
    if (loading || isStreaming) {
      return;
    }

    // Cancel any ongoing streaming
    if (streamingAbortRef.current) {
      streamingAbortRef.current.abort();
    }

    setLoading(true);
    setIsStreaming(true);
    setError(null);

    // Add user message to chat history immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: question.trim(),
      timestamp: Date.now(),
    };
    setChatHistory((prev) => [...prev, userMessage]);

    // Create placeholder assistant message for streaming
    const assistantMessageId = Date.now();
    let accumulatedText = '';

    const abortController = new AbortController();
    streamingAbortRef.current = abortController;

    try {
      // Use Next.js API route to proxy the request (avoids mixed-content issues)
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerData,
          question: question.trim(),
          puuid: puuid || playerData.playerInfo?.gameName + '#' + playerData.playerInfo?.tagLine,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to process question: ${response.status}`);
      }

      // Check if response is streaming (SSE)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        // Real-time streaming via SSE
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body reader available');
        }

        // Add placeholder message
        setChatHistory((prev) => [...prev, {
          role: 'assistant',
          content: '',
          timestamp: assistantMessageId,
        }]);

        try {
          let buffer = '';
          
          while (true) {
            if (abortController.signal.aborted) {
              reader.cancel();
              break;
            }

            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            // Decode chunk
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete SSE messages
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'chunk') {
                    accumulatedText += data.content;
                    
                    // Update message in real-time
                    setChatHistory((prev) => {
                      const newHistory = [...prev];
                      const lastMsg = newHistory[newHistory.length - 1];
                      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.timestamp === assistantMessageId) {
                        lastMsg.content = accumulatedText;
                      }
                      return newHistory;
                    });
                  } else if (data.type === 'done') {
                    // Final update with complete text
                    accumulatedText = data.fullText || accumulatedText;
                    setChatHistory((prev) => {
                      const newHistory = [...prev];
                      const lastMsg = newHistory[newHistory.length - 1];
                      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.timestamp === assistantMessageId) {
                        lastMsg.content = accumulatedText;
                      }
                      return newHistory;
                    });
                    break;
                  } else if (data.type === 'error') {
                    throw new Error(data.error || 'Streaming error');
                  }
                } catch (parseError) {
                  console.warn('Failed to parse SSE data:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        // Non-streaming response
        const data = await response.json();
        const finalMessage: ChatMessage = {
          role: 'assistant',
          content: data.answer || data.insights || '',
          timestamp: Date.now(),
        };

        setChatHistory((prev) => [...prev, finalMessage]);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, don't show error
        return;
      }
      
      console.error('Failed to process question:', err);
      setError((err instanceof Error ? err.message : 'Failed to get AI response'));
      
      // Remove user message and placeholder on error
      setChatHistory((prev) => {
        const filtered = prev.filter(msg => 
          !(msg.role === 'assistant' && msg.timestamp === assistantMessageId && msg.content === '')
        );
        // If we have accumulated text, keep it, otherwise remove the last assistant message
        if (accumulatedText) {
          return filtered;
        }
        return filtered.slice(0, -1);
      });
      
      // Add error message only if no text was accumulated
      if (!accumulatedText) {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your question. Please try again.',
          timestamp: Date.now(),
        };
        setChatHistory((prev) => [...prev, errorMessage]);
      }
    } finally {
      setLoading(false);
      setIsStreaming(false);
      streamingAbortRef.current = null;
    }
  }, [loading, isStreaming]);

  const generateSummary = useCallback(async (playerData: AIDataPayload) => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use Next.js API route to proxy the request (avoids mixed-content issues)
      const response = await fetch('/api/ai/year-end-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerData,
          gameName: playerData.playerInfo?.gameName,
          tagLine: playerData.playerInfo?.tagLine,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to generate summary: ${response.status}`);
      }

      const data = await response.json();
      
      // Return summary as dashboard insights format
      const summary: DashboardInsights = {
        insights: data.summary || data.insights,
        analysisType: 'summary',
        matchesAnalyzed: data.matchesAnalyzed || 0,
        model: data.model,
      };

      setDashboardInsights(summary);
    } catch (err: unknown) {
      console.error('Failed to generate summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate year-end summary');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const clearChat = useCallback(() => {
    setChatHistory([]);
    setError(null);
  }, []);

  return {
    dashboardInsights,
    chatHistory,
    loading,
    isStreaming,
    error,
    fetchDashboardInsights,
    askQuestion,
    generateSummary,
    clearChat,
  };
}

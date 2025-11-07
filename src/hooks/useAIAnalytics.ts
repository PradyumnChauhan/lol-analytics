'use client';

import { useState, useCallback, useRef } from 'react';
import { AIDataPayload } from '@/lib/ai/data-aggregator';
import { getBackendUrl } from '@/lib/utils/backend-url';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface DashboardInsights {
  insights: string;
  analysisType: string;
  matchesAnalyzed: number;
  model?: string;
  prompt?: string;
  promptMetadata?: {
    promptLength: number;
    modelUsed: string;
    maxTokens: number;
  };
}

interface UseAIAnalyticsReturn {
  dashboardInsights: DashboardInsights | null;
  chatHistory: ChatMessage[];
  loading: boolean;
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
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<string>('');

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
      const response = await fetch(`${getBackendUrl()}/api/ai/dashboard-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch dashboard insights: ${response.status}`);
      }

      const data = await response.json();
      const insights: DashboardInsights = {
        insights: data.insights,
        analysisType: data.analysisType,
        matchesAnalyzed: data.matchesAnalyzed || 0,
        model: data.model,
        prompt: data.prompt,  // Include prompt
        promptMetadata: data.promptMetadata,
      };

      // Prompt data is included in response but not logged to console

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
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    // Add user message to chat history immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: question.trim(),
      timestamp: Date.now(),
    };
    setChatHistory((prev) => [...prev, userMessage]);

    try {
      const response = await fetch(`${getBackendUrl()}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerData,
          question: question.trim(),
          puuid: puuid || playerData.playerInfo?.gameName + '#' + playerData.playerInfo?.tagLine,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to process question: ${response.status}`);
      }

      const data = await response.json();

      // Update chat history with response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.answer,
        timestamp: Date.now(),
      };

      setChatHistory(data.conversationHistory || [...chatHistory, userMessage, assistantMessage]);
    } catch (err: unknown) {
      console.error('Failed to process question:', err);
      setError((err instanceof Error ? err.message : 'Failed to get AI response'));
      
      // Remove user message on error
      setChatHistory((prev) => prev.slice(0, -1));
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: Date.now(),
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [loading, chatHistory]);

  const generateSummary = useCallback(async (playerData: AIDataPayload) => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getBackendUrl()}/api/ai/year-end-summary`, {
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
    error,
    fetchDashboardInsights,
    askQuestion,
    generateSummary,
    clearChat,
  };
}

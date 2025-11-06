'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Sparkles, TrendingUp, Loader2, Share2, Copy } from 'lucide-react';

interface MatchData {
  [key: string]: unknown;
}

interface PlayerStats {
  [key: string]: unknown;
}

interface AIInsightsProps {
  matchData: MatchData[];
  playerStats: PlayerStats;
  gameName: string;
  tagLine: string;
}

export function AIInsights({ matchData, playerStats, gameName, tagLine }: AIInsightsProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [improvements, setImprovements] = useState<string | null>(null);
  const [loading, setLoading] = useState<'insights' | 'summary' | 'improvements' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  const fetchAIInsights = async (type: 'insights' | 'summary' | 'improvements') => {
    setLoading(type);
    setError(null);
    
    try {
      const endpoint = type === 'summary' 
        ? '/api/ai/year-end-summary'
        : '/api/ai/analyze';
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchData: matchData.slice(0, 20), // Limit to recent 20 matches
          playerStats,
          analysisType: type === 'summary' ? 'summary' : type
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch AI insights');
      }

      const data = await response.json();
      
      if (type === 'summary') {
        setSummary(data.summary || data.insights);
      } else if (type === 'insights') {
        setInsights(data.insights);
      } else {
        setImprovements(data.insights);
      }
    } catch (error: unknown) {
      console.error('AI analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI insights. Please check your backend connection and Bedrock Lambda configuration.';
      setError(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const shareContent = async (text: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${gameName}#${tagLine} - ${title}`,
          text: text.substring(0, 200) + '...'
        });
      } catch {
        console.log('Share cancelled');
      }
    } else {
      copyToClipboard(text);
    }
  };

  const renderContent = (content: string | null, type: 'insights' | 'summary' | 'improvements') => {
    if (!content) return null;

    const bgColor = type === 'summary' 
      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200'
      : type === 'improvements'
      ? 'bg-blue-50 border border-blue-200'
      : 'bg-gray-50 border border-gray-200';

    return (
      <div className={`prose max-w-none ${bgColor} p-6 rounded-lg relative`}>
        {type === 'summary' && (
          <h3 className="text-xl font-bold mb-4 text-gray-800">🎉 Your Year in League</h3>
        )}
        <div className="whitespace-pre-wrap text-gray-800">{content}</div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-300">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(content)}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => shareContent(content, type === 'summary' ? 'Year-End Summary' : type === 'insights' ? 'AI Insights' : 'Improvements')}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    );
  };

  if (!matchData || matchData.length === 0) {
    return (
      <Card className="p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
        </div>
        <p className="text-gray-600">Match data is required to generate AI insights. Please load a player profile with match history.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-6 w-6 text-purple-600" />
        <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
        <span className="text-xs text-gray-500 bg-purple-100 px-2 py-1 rounded">Powered by Amazon Bedrock</span>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Error: {error}</p>
          <p className="text-red-600 text-sm mt-2">
            Make sure your backend server is running and the Bedrock Lambda function URL is configured correctly.
          </p>
        </div>
      )}

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">
            <Sparkles className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="summary">
            <TrendingUp className="h-4 w-4 mr-2" />
            Year-End Summary
          </TabsTrigger>
          <TabsTrigger value="improvements">
            <TrendingUp className="h-4 w-4 mr-2" />
            Improvements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {!insights && !loading && (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">
                Get AI-powered insights about your gameplay patterns, strengths, and playstyle.
              </p>
              <Button 
                onClick={() => fetchAIInsights('insights')}
                disabled={!matchData || matchData.length === 0}
              >
                Generate Insights
              </Button>
            </div>
          )}
          
          {loading === 'insights' && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-purple-600" />
              <p className="text-gray-600">Analyzing your matches with AI...</p>
              <p className="text-sm text-gray-500 mt-2">This may take 10-30 seconds</p>
            </div>
          )}

          {insights && !loading && renderContent(insights, 'insights')}
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          {!summary && !loading && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">
                Generate a fun, shareable year-end recap of your League journey.
              </p>
              <Button 
                onClick={() => fetchAIInsights('summary')}
                disabled={!matchData || matchData.length === 0}
              >
                Generate Summary
              </Button>
            </div>
          )}

          {loading === 'summary' && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-purple-600" />
              <p className="text-gray-600">Creating your personalized summary...</p>
              <p className="text-sm text-gray-500 mt-2">Crafting your year in League...</p>
            </div>
          )}

          {summary && !loading && renderContent(summary, 'summary')}
        </TabsContent>

        <TabsContent value="improvements" className="space-y-4">
          {!improvements && !loading && (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">
                Get specific, actionable recommendations to improve your gameplay.
              </p>
              <Button 
                onClick={() => fetchAIInsights('improvements')}
                disabled={!matchData || matchData.length === 0}
              >
                Get Recommendations
              </Button>
            </div>
          )}

          {loading === 'improvements' && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-purple-600" />
              <p className="text-gray-600">Analyzing improvement opportunities...</p>
              <p className="text-sm text-gray-500 mt-2">Identifying growth areas...</p>
            </div>
          )}

          {improvements && !loading && renderContent(improvements, 'improvements')}
        </TabsContent>
      </Tabs>
    </Card>
  );
}


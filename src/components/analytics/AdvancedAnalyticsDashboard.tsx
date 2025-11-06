'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Users,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  Crown,
  Medal,
  Activity
} from 'lucide-react';
import { 
  advancedAnalyticsEngine, 
  MLInsights, 
  ComparisonMetrics,
  PerformanceTrend 
} from '@/lib/analytics/ml-engine';

interface AdvancedAnalyticsDashboardProps {
  className?: string;
  puuid?: string;
  matches?: unknown[];
}

export function AdvancedAnalyticsDashboard({ 
  className, 
  puuid = 'mock-puuid', 
  matches = [] 
}: AdvancedAnalyticsDashboardProps) {
  const [insights, setInsights] = useState<MLInsights | null>(null);
  const [comparison, setComparison] = useState<ComparisonMetrics[]>([]);
  const [predictions, setPredictions] = useState<PerformanceTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '3m' | '1y'>('30d');

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      
      // Generate ML insights
      const playerInsights = await advancedAnalyticsEngine.generatePlayerInsights(puuid, matches as any[]);
      setInsights(playerInsights);
      
      // Generate performance comparison
      const mockPerformance = {
        winRate: 0.65,
        kda: 2.8,
        averageKills: 8,
        averageDeaths: 4,
        averageAssists: 12,
        averageCs: 165,
        averageGold: 13500,
        averageDamage: 18000,
        visionScore: 28,
        gameLength: 1800
      };
      
      const comparisonData = await advancedAnalyticsEngine.comparePlayerPerformance(mockPerformance, 'gold');
      setComparison(comparisonData);
      
      // Generate predictions
      const mockTrends = playerInsights.performanceTrend.length > 0 
        ? playerInsights.performanceTrend 
        : [
            { date: '2024-01-01', winRate: 0.6, kda: 2.5, performance: 72, gamesPlayed: 5 },
            { date: '2024-01-02', winRate: 0.65, kda: 2.7, performance: 75, gamesPlayed: 6 },
            { date: '2024-01-03', winRate: 0.63, kda: 2.8, performance: 78, gamesPlayed: 4 }
          ];
      
      const predictionData = await advancedAnalyticsEngine.predictPerformanceTrend(mockTrends, 7);
      setPredictions(predictionData);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [puuid, matches]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return <ArrowUp className="w-4 h-4 text-green-400" />;
      case 'good':
        return <ArrowUp className="w-4 h-4 text-blue-400" />;
      case 'average':
        return <Minus className="w-4 h-4 text-yellow-400" />;
      case 'below-average':
        return <ArrowDown className="w-4 h-4 text-orange-400" />;
      case 'poor':
        return <ArrowDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'average':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'below-average':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'poor':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'declining':
        return <ArrowDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-yellow-400" />;
    }
  };

  if (loading || !insights) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading advanced analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Advanced Analytics
          </h2>
          <p className="text-gray-400">ML-powered insights and performance analysis</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '3m', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm ${
                selectedTimeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range === '7d' && '7 Days'}
              {range === '30d' && '30 Days'}
              {range === '3m' && '3 Months'}
              {range === '1y' && '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Performance Score */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <span className={`text-2xl font-bold ${getScoreColor(insights.overallScore)}`}>
                  {Math.round(insights.overallScore)}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Overall Performance Score</h3>
                <p className="text-gray-400">Based on multiple performance metrics</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-lg font-semibold text-white">
                  {insights.predictedRank.tier} {insights.predictedRank.division}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                {Math.round(insights.predictedRank.confidence * 100)}% confidence
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="insights" className="data-[state=active]:bg-gray-700">
            <Brain className="w-4 h-4 mr-2" />
            ML Insights
          </TabsTrigger>
          <TabsTrigger value="comparison" className="data-[state=active]:bg-gray-700">
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance Comparison
          </TabsTrigger>
          <TabsTrigger value="champions" className="data-[state=active]:bg-gray-700">
            <Star className="w-4 h-4 mr-2" />
            Champion Analysis
          </TabsTrigger>
          <TabsTrigger value="predictions" className="data-[state=active]:bg-gray-700">
            <Activity className="w-4 h-4 mr-2" />
            Predictions
          </TabsTrigger>
        </TabsList>

        {/* ML Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {/* Role Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Role Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Primary Role</span>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {insights.primaryRole}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Secondary Role</span>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      {insights.secondaryRole}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Strengths & Improvements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-green-400 mb-2">Strengths</h4>
                  <div className="space-y-1">
                    {insights.strengths.map((strength, index) => (
                      <div key={index} className="text-sm text-gray-300 flex items-center gap-2">
                        <ArrowUp className="w-3 h-3 text-green-400" />
                        {strength}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-orange-400 mb-2">Areas for Improvement</h4>
                  <div className="space-y-1">
                    {insights.improvements.map((improvement, index) => (
                      <div key={index} className="text-sm text-gray-300 flex items-center gap-2">
                        <Target className="w-3 h-3 text-orange-400" />
                        {improvement}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-blue-400 mb-3">Recommended Champions</h4>
                <div className="space-y-2">
                  {insights.recommendations.champions.map((champion, index) => (
                    <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">
                      {champion}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-purple-400 mb-3">Recommended Roles</h4>
                <div className="space-y-2">
                  {insights.recommendations.roles.map((role, index) => (
                    <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-green-400 mb-3">Skill Focus Areas</h4>
                <div className="space-y-2">
                  {insights.recommendations.skillFocus.map((skill, index) => (
                    <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance vs Rank Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {comparison.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getRatingIcon(metric.rating)}
                      <div>
                        <h4 className="font-medium text-white">{metric.category}</h4>
                        <p className="text-sm text-gray-400">
                          Your: {metric.playerValue.toFixed(2)} | Average: {metric.averageValue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">
                          {Math.round(metric.percentile)}th percentile
                        </div>
                      </div>
                      <Badge className={getRatingColor(metric.rating)}>
                        {metric.rating.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Champion Analysis Tab */}
        <TabsContent value="champions" className="space-y-6">
          <div className="grid gap-4">
            {insights.championMastery.length > 0 ? (
              insights.championMastery.slice(0, 6).map((champion) => (
                <Card key={champion.championId} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {champion.championName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{champion.championName}</h4>
                          <p className="text-sm text-gray-400">{champion.gamesPlayed} games played</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">
                            {Math.round(champion.winRate * 100)}%
                          </div>
                          <div className="text-sm text-gray-400">Win Rate</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">
                            {champion.kda.toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-400">KDA</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(champion.trend)}
                          <Badge className={`${champion.trend === 'improving' ? 'bg-green-100 text-green-800' : 
                            champion.trend === 'declining' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                            {champion.trend}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-300">
                      {champion.recommendation}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6 text-center">
                  <Medal className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Champion Data</h3>
                  <p className="text-gray-400">Play more games to see detailed champion analysis</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Performance Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {predictions.length > 0 ? (
                <div className="grid gap-4">
                  {predictions.map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                      <div className="text-white font-medium">
                        {new Date(prediction.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">
                            {Math.round(prediction.winRate * 100)}%
                          </div>
                          <div className="text-xs text-gray-400">Win Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">
                            {prediction.kda.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-400">KDA</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">
                            {Math.round(prediction.performance)}
                          </div>
                          <div className="text-xs text-gray-400">Score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Predictions Available</h3>
                  <p className="text-gray-400">Need more historical data to generate predictions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
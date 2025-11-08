'use client';

import { Card } from '@/components/ui/card';
import { 
  TrendingUp, 
  Target, 
  Award, 
  Brain, 
  Trophy,
  BarChart3,
  Eye,
  Users,
  Star
} from 'lucide-react';
import { VisualizationRenderer } from './visualizations/VisualizationRenderer';
import type { InsightCard, DashboardInsightsResponse } from '@/lib/ai/types';

interface AIDashboardInsightsProps {
  insights: string | InsightCard[] | DashboardInsightsResponse;
  aggregatedData?: unknown;
}

// Icon mapping for insight types
const getIconForType = (type: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    match_performance: <TrendingUp className="h-5 w-5" />,
    champion_mastery: <Award className="h-5 w-5" />,
    ranked_progression: <Trophy className="h-5 w-5" />,
    challenges_achievements: <Star className="h-5 w-5" />,
    role_performance: <Users className="h-5 w-5" />,
    kda_damage_trends: <BarChart3 className="h-5 w-5" />,
    vision_map_control: <Eye className="h-5 w-5" />,
    clash_tournament: <Trophy className="h-5 w-5" />,
    overall_performance_rating: <Star className="h-5 w-5" />,
    improvement_roadmap: <Target className="h-5 w-5" />,
  };
  return iconMap[type] || <Brain className="h-5 w-5" />;
};

// Color mapping for insight types
const getColorForType = (type: string) => {
  const colorMap: Record<string, string> = {
    match_performance: 'text-blue-600 border-blue-200',
    champion_mastery: 'text-purple-600 border-purple-200',
    ranked_progression: 'text-yellow-600 border-yellow-200',
    challenges_achievements: 'text-green-600 border-green-200',
    role_performance: 'text-indigo-600 border-indigo-200',
    kda_damage_trends: 'text-red-600 border-red-200',
    vision_map_control: 'text-cyan-600 border-cyan-200',
    clash_tournament: 'text-orange-600 border-orange-200',
    overall_performance_rating: 'text-pink-600 border-pink-200',
    improvement_roadmap: 'text-emerald-600 border-emerald-200',
  };
  return colorMap[type] || 'text-gray-600 border-gray-200';
};

export function AIDashboardInsights({ insights }: AIDashboardInsightsProps) {
  // Handle different response formats
  let insightCards: InsightCard[] = [];
  
  if (typeof insights === 'string') {
    // Legacy text format - return simple display
    return (
      <div className="space-y-6">
        <Card className="p-6 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-6 w-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-800">AI-Generated Insights</h2>
          </div>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">
              {insights}
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  if (Array.isArray(insights)) {
    // Direct array of insight cards
    insightCards = insights.filter(card => card.available !== false);
  } else if (insights && typeof insights === 'object' && 'insights' in insights) {
    // DashboardInsightsResponse format
    const response = insights as DashboardInsightsResponse;
    insightCards = Array.isArray(response.insights) 
      ? response.insights.filter(card => card.available !== false)
      : [];
  }

  if (insightCards.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-6 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-6 w-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-800">AI-Generated Insights</h2>
          </div>
          <div className="text-gray-500 text-center py-8">
            No insights available. Please ensure you have sufficient match data.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {insightCards.map((card, index) => {
        const iconColorClass = getColorForType(card.type);
        const [textColor, borderColor] = iconColorClass.split(' border-');
        
        return (
          <Card
            key={card.type || index}
            className={`p-6 border-2 ${borderColor || 'border-gray-200'} transition-all duration-300 hover:shadow-lg`}
            style={{
              animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className={textColor || 'text-gray-600'}>
                {getIconForType(card.type)}
              </div>
              <h3 className="text-xl font-bold text-gray-800">{card.title}</h3>
            </div>

            {/* Content Grid: Left (Text) + Right (Visual) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Text Insights */}
              <div className="flex flex-col">
                <div className="prose max-w-none flex-1">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {card.textInsights}
                  </div>
                </div>
              </div>

              {/* Right: Visualization */}
              <div className="flex flex-col">
                <div className="flex-1 min-h-[300px] bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <VisualizationRenderer visualData={card.visualData} />
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

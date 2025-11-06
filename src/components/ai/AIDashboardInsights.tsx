'use client';

import { Card } from '@/components/ui/card';
import { Brain, TrendingUp, Target, Award, Sparkles } from 'lucide-react';

import type { AIDataPayload } from '@/lib/ai/data-aggregator';

interface AIDashboardInsightsProps {
  insights: string;
  aggregatedData?: AIDataPayload;
}

export function AIDashboardInsights({ insights }: AIDashboardInsightsProps) {
  // Parse insights into structured sections
  const parseInsights = (text: string) => {
    const sections: Record<string, string> = {};
    const lines = text.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      const sectionMatch = line.match(/^\d+\.\s*\*\*(.+?)\*\*/);
      if (sectionMatch) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = sectionMatch[1].trim();
        currentContent = [];
      } else if (line.trim() && currentSection) {
        currentContent.push(line);
      }
    }

    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  };

  const parsed = parseInsights(insights);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">AI-Generated Insights</h2>
        </div>
        
        {(parsed['Key Strengths'] || parsed['Persistent Strengths']) && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-lg">Key Strengths</h3>
            </div>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 bg-white p-4 rounded-lg">
                {parsed['Key Strengths'] || parsed['Persistent Strengths']}
              </div>
            </div>
          </div>
        )}

        {(parsed['Areas for Improvement'] || parsed['Areas for Growth']) && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-lg">Areas for Improvement</h3>
            </div>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 bg-white p-4 rounded-lg">
                {parsed['Areas for Improvement'] || parsed['Areas for Growth']}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Additional sections if available */}
      {parsed['Playstyle Analysis'] && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-lg">Playstyle Analysis</h3>
          </div>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">
              {parsed['Playstyle Analysis']}
            </div>
          </div>
        </Card>
      )}

      {parsed['Improvement Roadmap'] && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-lg">Improvement Roadmap</h3>
          </div>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">
              {parsed['Improvement Roadmap']}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}


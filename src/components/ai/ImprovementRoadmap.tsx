'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface ImprovementRoadmapProps {
  roadmap: string;
  improvementAreas?: string[];
}

export function ImprovementRoadmap({ roadmap, improvementAreas }: ImprovementRoadmapProps) {
  // Extract numbered items from roadmap text
  const extractSteps = (text: string): string[] => {
    const steps: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+)$/);
      if (match) {
        steps.push(match[1].trim());
      }
    }
    
    return steps.length > 0 ? steps : [text];
  };

  const steps = extractSteps(roadmap);

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-lg">Improvement Roadmap</h3>
      </div>

      {improvementAreas && improvementAreas.length > 0 && (
        <div className="mb-4 p-3 bg-white rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Areas to Focus On:</p>
          <div className="flex flex-wrap gap-2">
            {improvementAreas.map((area, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div key={idx} className="flex gap-3 p-3 bg-white rounded-lg">
            <div className="flex-shrink-0">
              <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                {idx + 1}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-gray-700">{step}</p>
            </div>
          </div>
        ))}
      </div>

      {steps.length === 0 && (
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-gray-700">
            {roadmap || 'No improvement roadmap available yet.'}
          </div>
        </div>
      )}
    </Card>
  );
}


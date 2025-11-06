'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, Target, Eye, Coins, Users } from 'lucide-react';
import { PerformanceGrade, PerformanceMetrics } from '@/lib/match-analytics';

interface PerformanceRatingProps {
  grade: PerformanceGrade;
  metrics: PerformanceMetrics;
  comparison?: {
    rank: string;
    averageGrade: PerformanceGrade;
    percentile: number;
  };
  className?: string;
}

const gradeColors = {
  'S+': 'from-yellow-400 via-yellow-500 to-yellow-600',
  'S': 'from-yellow-500 via-yellow-600 to-orange-500',
  'A': 'from-green-400 via-green-500 to-green-600',
  'B': 'from-blue-400 via-blue-500 to-blue-600',
  'C': 'from-orange-400 via-orange-500 to-orange-600',
  'D': 'from-red-400 via-red-500 to-red-600',
};

const gradeDescriptions = {
  'S+': 'Exceptional Performance',
  'S': 'Outstanding Performance',
  'A': 'Strong Performance',
  'B': 'Good Performance',
  'C': 'Average Performance',
  'D': 'Needs Improvement',
};

export function PerformanceRating({ 
  grade, 
  metrics, 
  comparison, 
  className = '' 
}: PerformanceRatingProps) {
  const getGradeIcon = (grade: PerformanceGrade) => {
    switch (grade) {
      case 'S+':
      case 'S':
        return <Trophy className="h-8 w-8 text-yellow-400" />;
      case 'A':
        return <Target className="h-8 w-8 text-green-400" />;
      case 'B':
        return <TrendingUp className="h-8 w-8 text-blue-400" />;
      case 'C':
        return <Eye className="h-8 w-8 text-orange-400" />;
      case 'D':
        return <Users className="h-8 w-8 text-red-400" />;
    }
  };

  const getGradeBackground = (grade: PerformanceGrade) => {
    return `bg-gradient-to-br ${gradeColors[grade]} text-white`;
  };

  return (
    <Card className={`backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-white text-lg font-semibold flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <span>Performance Rating</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Grade Display */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl ${getGradeBackground(grade)} shadow-2xl mb-4`}>
            <span className="text-4xl font-bold">{grade}</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {gradeDescriptions[grade]}
          </h3>
          {comparison && (
            <div className="text-sm text-slate-400">
              Better than {comparison.percentile}% of {comparison.rank} players
            </div>
          )}
        </div>

        {/* Metrics Breakdown */}
        <div className="space-y-4">
          <h4 className="text-white font-semibold text-sm mb-3">Rating Breakdown</h4>
          
          <div className="grid grid-cols-2 gap-4">
            {/* KDA */}
            <div className="backdrop-blur-xl bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">KDA</span>
                <span className="text-white font-semibold">{metrics.kda.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((metrics.kda / 4) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Win Rate */}
            <div className="backdrop-blur-xl bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">Win Rate</span>
                <span className="text-white font-semibold">{metrics.winRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.winRate}%` }}
                />
              </div>
            </div>

            {/* Damage Share */}
            <div className="backdrop-blur-xl bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">Damage Share</span>
                <span className="text-white font-semibold">{metrics.damageShare.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((metrics.damageShare / 30) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Vision Score */}
            <div className="backdrop-blur-xl bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">Vision</span>
                <span className="text-white font-semibold">{metrics.visionScore.toFixed(1)}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((metrics.visionScore / 50) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="backdrop-blur-xl bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-slate-400 text-xs mb-1">CS/min</div>
              <div className="text-white font-semibold">{metrics.csPerMinute.toFixed(1)}</div>
            </div>
            <div className="backdrop-blur-xl bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-slate-400 text-xs mb-1">Gold/min</div>
              <div className="text-white font-semibold">{Math.round(metrics.goldPerMinute)}</div>
            </div>
            <div className="backdrop-blur-xl bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-slate-400 text-xs mb-1">KP%</div>
              <div className="text-white font-semibold">{metrics.killParticipation.toFixed(0)}%</div>
            </div>
          </div>
        </div>

        {/* Performance Tips */}
        <div className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="text-white font-semibold text-sm mb-3 flex items-center space-x-2">
            <Target className="h-4 w-4 text-blue-400" />
            <span>Performance Tips</span>
          </h4>
          <div className="space-y-2 text-sm">
            {grade === 'S+' || grade === 'S' ? (
              <div className="text-green-400">
                🎉 Excellent performance! Keep up the great work!
              </div>
            ) : grade === 'A' ? (
              <div className="text-blue-400">
                💪 Strong performance! Focus on consistency to reach S tier.
              </div>
            ) : grade === 'B' ? (
              <div className="text-yellow-400">
                📈 Good foundation! Work on improving your KDA and vision control.
              </div>
            ) : grade === 'C' ? (
              <div className="text-orange-400">
                🔧 Average performance. Focus on dying less and farming better.
              </div>
            ) : (
              <div className="text-red-400">
                🎯 Needs improvement. Focus on fundamentals: CS, vision, and positioning.
              </div>
            )}
            
            {metrics.kda < 2.0 && (
              <div className="text-slate-300">
                • Work on reducing deaths and increasing assists
              </div>
            )}
            {metrics.winRate < 50 && (
              <div className="text-slate-300">
                • Focus on team play and objective control
              </div>
            )}
            {metrics.visionScore < 20 && (
              <div className="text-slate-300">
                • Improve ward placement and vision control
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for use in stats bars
export function PerformanceRatingCompact({ 
  grade, 
  className = '' 
}: { 
  grade: PerformanceGrade; 
  className?: string; 
}) {
  const getGradeColor = (grade: PerformanceGrade) => {
    switch (grade) {
      case 'S+': return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 'S': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'A': return 'bg-gradient-to-r from-green-400 to-green-600';
      case 'B': return 'bg-gradient-to-r from-blue-400 to-blue-600';
      case 'C': return 'bg-gradient-to-r from-orange-400 to-orange-600';
      case 'D': return 'bg-gradient-to-r from-red-400 to-red-600';
    }
  };

  return (
    <div className={`backdrop-blur-xl bg-white/10 rounded-xl border border-white/20 p-3 text-center ${className}`}>
      <div className="text-white/60 text-xs mb-1">Performance</div>
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${getGradeColor(grade)} text-white font-bold text-lg shadow-lg`}>
        {grade}
      </div>
    </div>
  );
}


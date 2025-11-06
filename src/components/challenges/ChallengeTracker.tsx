/**
 * ChallengeTracker.tsx
 * Main component for displaying player challenge progress and categories
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  Star, 
  Award, 
  Crown,
  TrendingUp,
  Medal,
  Zap
} from 'lucide-react';
import { 
  ChallengePlayerData, 
  CHALLENGE_CATEGORIES, 
  CHALLENGE_LEVELS,
  ChallengeUtils 
} from '@/lib/api/endpoints/challenges';

interface ChallengeTrackerProps {
  challengeData: ChallengePlayerData;
  isLoading?: boolean;
}

export function ChallengeTracker({ challengeData, isLoading }: ChallengeTrackerProps) {
  if (isLoading || !challengeData) {
    return (
      <div className="space-y-1">
        <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-xs">Loading Challenge Data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Log available category keys
  console.log('Challenge categoryPoints keys:', Object.keys(challengeData.categoryPoints));
  console.log('Expected CHALLENGE_CATEGORIES keys:', Object.keys(CHALLENGE_CATEGORIES));

  const overallRank = ChallengeUtils.calculateOverallRank(challengeData.totalPoints);
  const recentAchievements = ChallengeUtils.getRecentAchievements(challengeData.challenges);
  const nearCompletion = ChallengeUtils.getNearCompletionChallenges(challengeData.challenges);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'CHALLENGER': return <Crown className="h-3 w-3" />;
      case 'GRANDMASTER': return <Trophy className="h-3 w-3" />;
      case 'MASTER': return <Award className="h-3 w-3" />;
      case 'DIAMOND': return <Medal className="h-3 w-3" />;
      default: return <Star className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-1">
      {/* Overall Progress Header */}
      <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg overflow-hidden">
        <div className="p-2 border-b border-yellow-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <h3 className="text-white text-sm font-bold">Challenge Progress</h3>
            </div>
            <Badge className={`${CHALLENGE_LEVELS[challengeData.totalPoints.level].bg} text-white border-none px-1.5 py-0.5 text-[10px]`}>
              {challengeData.totalPoints.level}
            </Badge>
          </div>
        </div>
        <div className="p-2 space-y-1">
          {/* Total Points Display */}
          <div className="grid grid-cols-3 gap-1">
            <div className="bg-white/5 rounded border border-yellow-500/10 p-1.5">
              <div className="flex items-center gap-1 mb-0.5">
                <Target className="h-3 w-3 text-blue-400" />
                <span className="text-white/60 text-[10px]">Total Points</span>
              </div>
              <div className="text-white font-bold text-sm">
                {challengeData.totalPoints.current.toLocaleString()}
              </div>
              <div className="text-white/40 text-[9px]">
                of {challengeData.totalPoints.max.toLocaleString()}
              </div>
            </div>

            <div className="bg-white/5 rounded border border-yellow-500/10 p-1.5">
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-white/60 text-[10px]">Rank</span>
              </div>
              <div className="text-white font-bold text-sm">
                {overallRank}
              </div>
              <div className="text-white/40 text-[9px]">
                {challengeData.totalPoints.percentile.toFixed(1)}%
              </div>
            </div>

            <div className="bg-white/5 rounded border border-yellow-500/10 p-1.5">
              <div className="flex items-center gap-1 mb-0.5">
                <Zap className="h-3 w-3 text-yellow-400" />
                <span className="text-white/60 text-[10px]">Completed</span>
              </div>
              <div className="text-white font-bold text-sm">
                {challengeData.challenges.filter(c => c.level !== 'IRON').length}
              </div>
              <div className="text-white/40 text-[9px]">
                of {challengeData.challenges.length}
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-0.5 pt-1 border-t border-yellow-500/10">
            <div className="flex justify-between text-[10px]">
              <span className="text-white/60">Progress</span>
              <span className="text-white">
                {((challengeData.totalPoints.current / challengeData.totalPoints.max) * 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={(challengeData.totalPoints.current / challengeData.totalPoints.max) * 100}
              className="h-1.5 bg-white/10"
            />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-1">
        {Object.entries(challengeData.categoryPoints).map(([categoryKey, categoryData]) => {
          const validCategoryKey = ChallengeUtils.validateCategoryKey(categoryKey);
          
          // Skip rendering if category is not valid
          if (!validCategoryKey) {
            return null;
          }
          
          const category = CHALLENGE_CATEGORIES[validCategoryKey];
          
          const progressPercentage = (categoryData.current / categoryData.max) * 100;
          
          return (
            <div key={categoryKey} className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg p-1.5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className={`p-1 bg-gradient-to-r ${category.color} rounded text-white text-xs`}>
                    {category.icon}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-xs">{category.name}</div>
                    <div className="text-white/60 text-[9px]">{category.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {getLevelIcon(categoryData.level)}
                  <Badge 
                    variant="outline" 
                    className={`${CHALLENGE_LEVELS[categoryData.level].color} border-current text-[9px] px-1 py-0`}
                  >
                    {categoryData.level}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                {/* Points Display */}
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold text-xs">
                    {categoryData.current.toLocaleString()}
                  </span>
                  <span className="text-white/40 text-[9px]">
                    {categoryData.percentile.toFixed(1)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-0.5">
                  <Progress 
                    value={progressPercentage}
                    className="h-1 bg-white/10"
                  />
                  <div className="flex justify-between text-[9px] text-white/60">
                    <span>{progressPercentage.toFixed(1)}%</span>
                    <span>{categoryData.max.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Achievements & Near Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
        {/* Recent Achievements */}
        <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg overflow-hidden">
          <div className="p-2 border-b border-yellow-500/10">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-green-400" />
              <h3 className="text-white text-sm font-bold">Recent Achievements</h3>
            </div>
          </div>
          <div className="p-2">
            {recentAchievements.length > 0 ? (
              <div className="space-y-0.5">
                {recentAchievements.slice(0, 5).map((challenge) => (
                  <div key={challenge.challengeId} className="flex items-center justify-between p-1.5 bg-white/5 rounded border border-yellow-500/10">
                    <div className="flex items-center gap-1.5">
                      <div className={`p-1 rounded ${CHALLENGE_LEVELS[challenge.level as keyof typeof CHALLENGE_LEVELS]?.bg || 'bg-gray-500'}`}>
                        {getLevelIcon(challenge.level)}
                      </div>
                      <div>
                        <div className="text-white font-medium text-xs">
                          Challenge #{challenge.challengeId}
                        </div>
                        <div className="text-white/60 text-[9px]">
                          {challenge.achievedTime && new Date(challenge.achievedTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge className={`${CHALLENGE_LEVELS[challenge.level as keyof typeof CHALLENGE_LEVELS]?.bg || 'bg-gray-500'} text-white border-none text-[9px] px-1 py-0`}>
                      {challenge.level}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-white/60 py-4">
                <Award className="h-8 w-8 mx-auto mb-1 opacity-30" />
                <p className="text-xs">No recent achievements</p>
                <p className="text-[9px] text-white/40 mt-0.5">Keep playing to earn new achievements!</p>
              </div>
            )}
          </div>
        </div>

        {/* Near Completion */}
        <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg overflow-hidden">
          <div className="p-2 border-b border-yellow-500/10">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-yellow-400" />
              <h3 className="text-white text-sm font-bold">Almost There</h3>
            </div>
          </div>
          <div className="p-2">
            {nearCompletion.length > 0 ? (
              <div className="space-y-0.5">
                {nearCompletion.slice(0, 5).map((challenge) => (
                  <div key={challenge.challengeId} className="flex items-center justify-between p-1.5 bg-white/5 rounded border border-yellow-500/10">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 rounded bg-yellow-500/20">
                        <Target className="h-3 w-3 text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium text-xs">
                          Challenge #{challenge.challengeId}
                        </div>
                        <div className="text-white/60 text-[9px]">
                          {challenge.percentile.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-xs font-medium">
                        {ChallengeUtils.formatChallengeValue(challenge.value, challenge.challengeId)}
                      </div>
                      <div className="text-white/40 text-[9px]">
                        {challenge.level} level
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-white/60 py-4">
                <Target className="h-8 w-8 mx-auto mb-1 opacity-30" />
                <p className="text-xs">No challenges near completion</p>
                <p className="text-[9px] text-white/40 mt-0.5">Keep progressing to see upcoming milestones!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
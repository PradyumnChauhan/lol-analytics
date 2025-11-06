/**
 * CategoryProgress.tsx
 * Detailed breakdown of challenge progress by categories (Collection, Expertise, Teamwork, Combat, Legacy)
 */

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Target, 
  Star, 
  Award, 
  Crown,
  TrendingUp,
  Medal,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Zap,
  Users,
  Sword,
  BookOpen,
  History
} from 'lucide-react';
import { 
  ChallengePlayerData, 
  Challenge,
  CHALLENGE_CATEGORIES, 
  CHALLENGE_LEVELS,
  ChallengeUtils 
} from '@/lib/api/endpoints/challenges';

interface CategoryProgressProps {
  challengeData: ChallengePlayerData;
  isLoading?: boolean;
}

interface CategoryStats {
  totalChallenges: number;
  completedChallenges: number;
  averageLevel: string;
  topChallenges: Challenge[];
  recentProgress: Challenge[];
}

export function CategoryProgress({ challengeData, isLoading }: CategoryProgressProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  if (isLoading || !challengeData) {
    return (
      <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2">
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-white text-xs">Loading Category Progress...</span>
        </div>
      </div>
    );
  };

  const getCategoryIcon = (categoryKey: string) => {
    switch (categoryKey) {
      case 'COLLECTION': return <BookOpen className="h-3 w-3" />;
      case 'EXPERTISE': return <Target className="h-3 w-3" />;
      case 'TEAMWORK': return <Users className="h-3 w-3" />;
      case 'COMBAT': return <Sword className="h-3 w-3" />;
      case 'LEGACY': return <History className="h-3 w-3" />;
      default: return <Star className="h-3 w-3" />;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'CHALLENGER': return <Crown className="h-3 w-3" />;
      case 'GRANDMASTER': return <Trophy className="h-3 w-3" />;
      case 'MASTER': return <Award className="h-3 w-3" />;
      case 'DIAMOND': return <Medal className="h-3 w-3" />;
      default: return <Star className="h-3 w-3" />;
    }
  };

  const getCategoryStats = (categoryKey: string): CategoryStats => {
    // Use display category for filtering (handles IMAGINATION/VETERANCY mapping)
    const displayCategory = ChallengeUtils.getDisplayCategory(categoryKey) || categoryKey;
    const categoryChallenges = challengeData.challenges.filter(
      challenge => {
        const challengeCategory = ChallengeUtils.getChallengeCategory(challenge.challengeId);
        const displayChallengeCategory = ChallengeUtils.getDisplayCategory(challengeCategory) || challengeCategory;
        return displayChallengeCategory === displayCategory;
      }
    );

    const completedChallenges = categoryChallenges.filter(c => c.level !== 'IRON');
    
    // Calculate average level (simplified)
    const levelValues = categoryChallenges
      .map(c => CHALLENGE_LEVELS[c.level as keyof typeof CHALLENGE_LEVELS]?.threshold || 0)
      .filter(threshold => threshold > 0);
    
    const averageThreshold = levelValues.length > 0 
      ? levelValues.reduce((a: number, b: number) => a + b, 0) / levelValues.length
      : 0;
    
    const averageLevel = Object.entries(CHALLENGE_LEVELS).find(([, data]) => 
      data.threshold <= averageThreshold
    )?.[0] || 'IRON';

    // Get top challenges (highest level/percentile)
    const topChallenges = categoryChallenges
      .sort((a, b) => {
        // Safely get thresholds with fallback
        const aLevelData = CHALLENGE_LEVELS[a.level as keyof typeof CHALLENGE_LEVELS];
        const bLevelData = CHALLENGE_LEVELS[b.level as keyof typeof CHALLENGE_LEVELS];
        const aThreshold = aLevelData?.threshold ?? 0;
        const bThreshold = bLevelData?.threshold ?? 0;
        if (aThreshold === bThreshold) {
          return (b.percentile || 0) - (a.percentile || 0);
        }
        return bThreshold - aThreshold;
      })
      .slice(0, 5);

    // Get recent progress (challenges with achieved time in last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentProgress = categoryChallenges
      .filter(c => c.achievedTime && c.achievedTime > thirtyDaysAgo)
      .sort((a, b) => (b.achievedTime || 0) - (a.achievedTime || 0))
      .slice(0, 3);

    return {
      totalChallenges: categoryChallenges.length,
      completedChallenges: completedChallenges.length,
      averageLevel,
      topChallenges,
      recentProgress
    };
  };

  const getNextMilestone = (categoryKey: string) => {
    // Handle both old and new category names
    let categoryData = challengeData.categoryPoints[categoryKey as keyof typeof challengeData.categoryPoints];
    
    // If category not found, try mapped category (IMAGINATION -> COMBAT, VETERANCY -> LEGACY)
    if (!categoryData) {
      const displayCategory = ChallengeUtils.getDisplayCategory(categoryKey);
      if (displayCategory) {
        categoryData = challengeData.categoryPoints[displayCategory as keyof typeof challengeData.categoryPoints];
      }
    }
    
    if (!categoryData || typeof categoryData !== 'object' || !('current' in categoryData)) {
      return 0;
    }
    
    const nextThreshold = ChallengeUtils.getNextMilestone(
      categoryData.current, 
      categoryData.max, 
      categoryData.level
    );
    return nextThreshold - categoryData.current;
  };

  return (
    <div className="space-y-1">
      {/* Category Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-1">
        {Object.entries(challengeData.categoryPoints).map(([categoryKey, categoryData]) => {
          // Handle both old and new category names
          const displayCategoryKey = ChallengeUtils.getDisplayCategory(categoryKey) || ChallengeUtils.validateCategoryKey(categoryKey);
          
          // Skip rendering if category is not valid
          if (!displayCategoryKey) {
            return null;
          }
          
          const category = CHALLENGE_CATEGORIES[displayCategoryKey];
          
          // Handle categoryData being object or direct value
          const categoryDataObj = typeof categoryData === 'object' && categoryData !== null && 'current' in categoryData
            ? categoryData as CategoryPoints
            : null;
          
          if (!categoryDataObj) {
            return null;
          }
          
          const stats = getCategoryStats(categoryKey);
          const progressPercentage = (categoryDataObj.current / categoryDataObj.max) * 100;
          const pointsToNext = getNextMilestone(categoryKey);
          const isExpanded = expandedCategory === categoryKey;

          return (
            <div key={categoryKey} className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg overflow-hidden">
              <div className="p-2 border-b border-yellow-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`p-1 bg-gradient-to-r ${category.color} rounded text-white text-xs`}>
                      {getCategoryIcon(categoryKey)}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-xs">{category.name}</div>
                      <div className="text-white/60 text-[9px]">{category.description}</div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setExpandedCategory(isExpanded ? null : categoryKey)}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white hover:bg-white/10 p-1 h-5 w-5"
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              
              <div className="p-2 space-y-1">
                {/* Level and Percentile */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {getLevelIcon(categoryDataObj.level)}
                    <Badge 
                      className={`${CHALLENGE_LEVELS[categoryDataObj.level as keyof typeof CHALLENGE_LEVELS]?.bg || 'bg-slate-600'} text-white border-none text-[9px] px-1 py-0`}
                    >
                      {categoryDataObj.level}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold text-xs">
                      {categoryDataObj.current.toLocaleString()}
                    </div>
                    <div className="text-white/40 text-[9px]">
                      {categoryDataObj.percentile.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/60">Progress</span>
                    <span className="text-white">{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={progressPercentage}
                    className="h-1 bg-white/10"
                  />
                  {pointsToNext > 0 && (
                    <div className="text-white/40 text-[9px]">
                      {pointsToNext.toLocaleString()} to next
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-1 text-center">
                  <div className="bg-white/5 rounded border border-yellow-500/10 p-1">
                    <div className="text-white font-semibold text-xs">
                      {stats.completedChallenges}/{stats.totalChallenges}
                    </div>
                    <div className="text-white/60 text-[9px]">Completed</div>
                  </div>
                  <div className="bg-white/5 rounded border border-yellow-500/10 p-1">
                    <div className="text-white font-semibold text-xs flex items-center justify-center gap-0.5">
                      {getLevelIcon(stats.averageLevel)}
                      <span>{stats.averageLevel}</span>
                    </div>
                    <div className="text-white/60 text-[9px]">Avg Level</div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-yellow-500/10 pt-1 mt-1 space-y-1">
                    {/* Top Challenges */}
                    <div>
                      <h4 className="text-white font-semibold text-xs mb-1 flex items-center gap-1">
                        <BarChart3 className="h-3 w-3 text-yellow-400" />
                        <span>Top Achievements</span>
                      </h4>
                      <div className="space-y-0.5">
                        {stats.topChallenges.slice(0, 3).map((challenge) => (
                          <div key={challenge.challengeId} className="flex items-center justify-between p-1 bg-white/5 rounded border border-yellow-500/10">
                            <div className="flex items-center gap-1">
                              <div className={`p-0.5 rounded ${CHALLENGE_LEVELS[challenge.level as keyof typeof CHALLENGE_LEVELS]?.bg || 'bg-slate-600'}`}>
                                {getLevelIcon(challenge.level)}
                              </div>
                              <div>
                                <div className="text-white text-[10px] font-medium">
                                  Challenge #{challenge.challengeId}
                                </div>
                                <div className="text-white/60 text-[9px]">
                                  {challenge.percentile.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                            <div className="text-white text-[10px] font-medium">
                              {ChallengeUtils.formatChallengeValue(challenge.value, challenge.challengeId)}
                            </div>
                          </div>
                        ))}
                        {stats.topChallenges.length === 0 && (
                          <div className="text-white/40 text-[9px] text-center py-1">
                            No completed challenges yet
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recent Progress */}
                    {stats.recentProgress.length > 0 && (
                      <div>
                        <h4 className="text-white font-semibold text-xs mb-1 flex items-center gap-1">
                          <Zap className="h-3 w-3 text-green-400" />
                          <span>Recent Progress</span>
                        </h4>
                        <div className="space-y-0.5">
                          {stats.recentProgress.map((challenge) => (
                            <div key={challenge.challengeId} className="flex items-center justify-between p-1 bg-green-500/10 border border-green-500/20 rounded border-yellow-500/10">
                              <div className="flex items-center gap-1">
                                <div className={`p-0.5 rounded ${CHALLENGE_LEVELS[challenge.level].bg}`}>
                                  {getLevelIcon(challenge.level)}
                                </div>
                                <div>
                                  <div className="text-white text-[10px] font-medium">
                                    Challenge #{challenge.challengeId}
                                  </div>
                                  <div className="text-green-400 text-[9px]">
                                    Recently achieved!
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px] px-1 py-0">
                                NEW
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress Insights */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded border-yellow-500/10 p-1">
                      <div className="flex items-center gap-1 mb-0.5">
                        <TrendingUp className="h-3 w-3 text-blue-400" />
                        <span className="text-blue-400 font-semibold text-xs">Insights</span>
                      </div>
                      <div className="space-y-0.5 text-white/80 text-[9px]">
                        <p>• {((stats.completedChallenges / stats.totalChallenges) * 100).toFixed(0)}% completion rate</p>
                        <p>• Rank: {categoryDataObj.percentile.toFixed(1)}th percentile globally</p>
                        <p>• {stats.recentProgress.length} achievements in last 30 days</p>
                        {pointsToNext > 0 && (
                          <p>• {pointsToNext.toLocaleString()} points needed for next level</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Comparison Chart */}
      <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg overflow-hidden">
        <div className="p-2 border-b border-yellow-500/10">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            <h3 className="text-white text-sm font-bold">Category Comparison</h3>
          </div>
        </div>
        <div className="p-2">
          <div className="space-y-1">
            {Object.entries(challengeData.categoryPoints).map(([categoryKey, categoryData]) => {
              // Handle both old and new category names
              const displayCategoryKey = ChallengeUtils.getDisplayCategory(categoryKey) || ChallengeUtils.validateCategoryKey(categoryKey);
              
              // Skip rendering if category is not valid
              if (!displayCategoryKey) {
                return null;
              }
              
              const category = CHALLENGE_CATEGORIES[displayCategoryKey];
              
              // Handle categoryData being object or direct value
              const categoryDataObj = typeof categoryData === 'object' && categoryData !== null && 'current' in categoryData
                ? categoryData as CategoryPoints
                : null;
              
              if (!categoryDataObj) {
                return null;
              }
              
              const progressPercentage = (categoryDataObj.current / categoryDataObj.max) * 100;
              const stats = getCategoryStats(categoryKey);

              return (
                <div key={categoryKey} className="space-y-0.5 p-1 bg-white/5 rounded border border-yellow-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={`p-1 bg-gradient-to-r ${category.color} rounded text-white text-xs`}>
                        {getCategoryIcon(categoryKey)}
                      </div>
                      <div>
                        <div className="text-white font-medium text-xs">{category.name}</div>
                        <div className="text-white/60 text-[9px]">
                          {stats.completedChallenges}/{stats.totalChallenges} completed
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold text-xs">
                        {categoryDataObj.current.toLocaleString()}
                      </div>
                      <div className="text-white/40 text-[9px]">
                        {categoryDataObj.percentile.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={progressPercentage}
                    className="h-1 bg-white/10"
                  />
                  <div className="flex justify-between text-[9px] text-white/60">
                    <span>{progressPercentage.toFixed(1)}% complete</span>
                    <Badge className={`${CHALLENGE_LEVELS[categoryDataObj.level as keyof typeof CHALLENGE_LEVELS]?.bg || 'bg-slate-600'} text-white border-none text-[9px] px-1 py-0`}>
                      {categoryDataObj.level}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
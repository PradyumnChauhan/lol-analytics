/**
 * AchievementTimeline.tsx
 * Component for displaying achievement progression history with timeline visualization
 */

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, 
  Calendar, 
  Star, 
  Award, 
  Crown,
  Medal,
  Clock,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  Challenge, 
  CHALLENGE_CATEGORIES, 
  CHALLENGE_LEVELS,
  ChallengeUtils 
} from '@/lib/api/endpoints/challenges';

interface AchievementTimelineProps {
  challenges: Challenge[];
  isLoading?: boolean;
}

interface TimelineEvent {
  id: number;
  challengeId: number;
  level: string;
  value: number;
  achievedTime: number;
  category: keyof typeof CHALLENGE_CATEGORIES;
  title: string;
  description: string;
}

export function AchievementTimeline({ challenges, isLoading }: AchievementTimelineProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30'); // days
  const [showAllEvents, setShowAllEvents] = useState(false);

  if (isLoading || !challenges) {
    return (
      <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-2">
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-white text-xs">Loading Achievement Timeline...</span>
        </div>
      </div>
    );
  }

  // Filter challenges that have achievement times
  const achievedChallenges = challenges.filter(c => c.achievedTime);

  // Create timeline events
  const timelineEvents: TimelineEvent[] = achievedChallenges.map(challenge => ({
    id: challenge.challengeId,
    challengeId: challenge.challengeId,
    level: challenge.level,
    value: challenge.value,
    achievedTime: challenge.achievedTime!,
    category: ChallengeUtils.getChallengeCategory(challenge.challengeId),
    title: `Challenge #${challenge.challengeId}`,
    description: `Achieved ${challenge.level} level`
  }));

  // Filter by timeframe
  const filterByTimeframe = (events: TimelineEvent[]) => {
    if (selectedTimeframe === 'ALL') return events;
    
    const daysAgo = parseInt(selectedTimeframe);
    const cutoffTime = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
    
    return events.filter(event => event.achievedTime > cutoffTime);
  };

  // Filter by category
  const filterByCategory = (events: TimelineEvent[]) => {
    if (selectedCategory === 'ALL') return events;
    return events.filter(event => event.category === selectedCategory);
  };

  // Apply filters and sort by time (most recent first)
  let filteredEvents = timelineEvents;
  filteredEvents = filterByTimeframe(filteredEvents);
  filteredEvents = filterByCategory(filteredEvents);
  filteredEvents = filteredEvents.sort((a, b) => b.achievedTime - a.achievedTime);

  // Limit display if not showing all
  const displayEvents = showAllEvents ? filteredEvents : filteredEvents.slice(0, 10);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'CHALLENGER': return <Crown className="h-3 w-3" />;
      case 'GRANDMASTER': return <Trophy className="h-3 w-3" />;
      case 'MASTER': return <Award className="h-3 w-3" />;
      case 'DIAMOND': return <Medal className="h-3 w-3" />;
      default: return <Star className="h-3 w-3" />;
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
    
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  };

  const getStatsForTimeframe = () => {
    const total = filteredEvents.length;
    const highestLevel = filteredEvents.reduce((highest, event) => {
      const currentThreshold = CHALLENGE_LEVELS[event.level as keyof typeof CHALLENGE_LEVELS].threshold;
      const highestThreshold = CHALLENGE_LEVELS[highest as keyof typeof CHALLENGE_LEVELS].threshold;
      return currentThreshold > highestThreshold ? event.level : highest;
    }, 'IRON');
    
    const categoryBreakdown = filteredEvents.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, highestLevel, categoryBreakdown };
  };

  const stats = getStatsForTimeframe();

  return (
    <div className="space-y-1">
      {/* Header with Stats */}
      <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg overflow-hidden">
        <div className="p-2 border-b border-yellow-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <h3 className="text-white text-sm font-bold">Achievement Timeline</h3>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-sm">{stats.total}</div>
              <div className="text-white/60 text-[9px]">Achievements</div>
            </div>
          </div>
        </div>
        <div className="p-2">
          <div className="grid grid-cols-3 gap-1">
            <div className="bg-white/5 rounded border border-yellow-500/10 p-1.5">
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-white/60 text-[10px]">Highest</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`p-0.5 rounded ${CHALLENGE_LEVELS[stats.highestLevel as keyof typeof CHALLENGE_LEVELS].bg}`}>
                  {getLevelIcon(stats.highestLevel)}
                </div>
                <span className="text-white font-bold text-xs">{stats.highestLevel}</span>
              </div>
            </div>

            <div className="bg-white/5 rounded border border-yellow-500/10 p-1.5">
              <div className="flex items-center gap-1 mb-0.5">
                <Award className="h-3 w-3 text-yellow-400" />
                <span className="text-white/60 text-[10px]">Active</span>
              </div>
              <div className="text-white font-bold text-xs">
                {Object.entries(stats.categoryBreakdown).length > 0
                  ? Object.entries(stats.categoryBreakdown).reduce((a, b) => stats.categoryBreakdown[a[0]] > stats.categoryBreakdown[b[0]] ? a : b)[0]
                  : 'None'
                }
              </div>
            </div>

            <div className="bg-white/5 rounded border border-yellow-500/10 p-1.5">
              <div className="flex items-center gap-1 mb-0.5">
                <Calendar className="h-3 w-3 text-purple-400" />
                <span className="text-white/60 text-[10px]">Time</span>
              </div>
              <div className="text-white font-bold text-xs">
                {selectedTimeframe === 'ALL' ? 'All Time' : `${selectedTimeframe}d`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg overflow-hidden">
        <div className="p-2">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-white/60" />
            <span className="text-white/60 text-[10px]">Filters:</span>
            
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="backdrop-blur-xl bg-white/10 border-yellow-500/20 text-white h-7 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-xl bg-slate-800 border-yellow-500/20 z-[9999]">
                <SelectItem value="ALL" className="text-white hover:bg-white/10 text-xs">All Categories</SelectItem>
                {Object.entries(CHALLENGE_CATEGORIES).map(([key, category]) => (
                  <SelectItem key={key} value={key} className="text-white hover:bg-white/10 text-xs">{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Timeframe Filter */}
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="backdrop-blur-xl bg-white/10 border-yellow-500/20 text-white h-7 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-xl bg-slate-800 border-yellow-500/20 z-[9999]">
                <SelectItem value="7" className="text-white hover:bg-white/10 text-xs">Last 7 Days</SelectItem>
                <SelectItem value="30" className="text-white hover:bg-white/10 text-xs">Last 30 Days</SelectItem>
                <SelectItem value="90" className="text-white hover:bg-white/10 text-xs">Last 3 Months</SelectItem>
                <SelectItem value="365" className="text-white hover:bg-white/10 text-xs">Last Year</SelectItem>
                <SelectItem value="ALL" className="text-white hover:bg-white/10 text-xs">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 hover:border-yellow-500/40 transition-colors shadow-lg overflow-hidden">
        <div className="p-2 border-b border-yellow-500/10">
          <h3 className="text-white text-sm font-bold">Recent Achievements</h3>
        </div>
        <div className="p-2">
          {displayEvents.length > 0 ? (
            <div className="space-y-0.5">
              {displayEvents.map((event, index) => {
                const validCategoryKey = ChallengeUtils.validateCategoryKey(event.category);
                const isLast = index === displayEvents.length - 1;
                
                // Skip rendering if category is not valid
                if (!validCategoryKey) {
                  return null;
                }
                
                const category = CHALLENGE_CATEGORIES[validCategoryKey];
                
                return (
                  <div key={event.id} className="relative">
                    {/* Timeline line */}
                    {!isLast && (
                      <div className="absolute left-4 top-8 w-0.5 h-full bg-white/10"></div>
                    )}
                    
                    {/* Event content */}
                    <div className="flex items-start gap-1.5">
                      {/* Icon */}
                      <div className={`p-1 rounded bg-gradient-to-r ${category.color} flex-shrink-0`}>
                        {getLevelIcon(event.level)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div>
                            <h3 className="text-white font-semibold text-xs">{event.title}</h3>
                            <p className="text-white/60 text-[9px]">{event.description}</p>
                          </div>
                          <Badge 
                            className={`${CHALLENGE_LEVELS[event.level as keyof typeof CHALLENGE_LEVELS].bg} text-white border-none text-[9px] px-1 py-0`}
                          >
                            {event.level}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-white/40 text-[9px] flex items-center gap-0.5">
                              <span className="text-xs">{category.icon}</span>
                              <span>{category.name}</span>
                            </span>
                            <span className="text-white font-medium text-xs">
                              {ChallengeUtils.formatChallengeValue(event.value, event.challengeId)}
                            </span>
                          </div>
                          <span className="text-white/40 text-[9px]">
                            {formatTimeAgo(event.achievedTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Show More/Less Button */}
              {filteredEvents.length > 10 && (
                <div className="text-center pt-2 mt-1 border-t border-yellow-500/10">
                  <Button
                    onClick={() => setShowAllEvents(!showAllEvents)}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white hover:bg-white/10 text-xs h-6"
                  >
                    {showAllEvents ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show All ({filteredEvents.length - 10} more)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-white/60 py-4">
              <Clock className="h-8 w-8 mx-auto mb-1 opacity-30" />
              <p className="text-xs mb-0.5">No achievements found</p>
              <p className="text-[9px] text-white/40">
                {selectedCategory !== 'ALL' || selectedTimeframe !== 'ALL'
                  ? 'Try adjusting your filters or play more games to earn achievements!'
                  : 'Start playing to earn your first achievements!'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
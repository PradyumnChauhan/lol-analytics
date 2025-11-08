'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Search, SortAsc, SortDesc } from 'lucide-react';

export interface MatchFilter {
  queueType: string;
  champion: string;
  result: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface MatchFiltersProps {
  filters: MatchFilter;
  onFiltersChange: (filters: MatchFilter) => void;
  availableChampions: Array<{ id: number; name: string }>;
  className?: string;
}

const queueTypes = [
  { value: 'all', label: 'All Queues' },
  { value: '420', label: 'Ranked Solo' },
  { value: '440', label: 'Ranked Flex' },
  { value: '400', label: 'Normal Draft' },
  { value: '450', label: 'ARAM' },
  { value: '700', label: 'Clash' },
  { value: '900', label: 'URF' },
];

const resultTypes = [
  { value: 'all', label: 'All Results' },
  { value: 'win', label: 'Wins Only' },
  { value: 'loss', label: 'Losses Only' },
];

const dateRanges = [
  { value: 'all', label: 'All Time' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'season', label: 'This Season' },
];

const sortOptions = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'kda', label: 'KDA' },
  { value: 'damage', label: 'Damage' },
  { value: 'duration', label: 'Duration' },
  { value: 'champion', label: 'Champion' },
];

export function MatchFilters({ 
  filters, 
  onFiltersChange, 
  availableChampions = [],
  className = '' 
}: MatchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [championSearch, setChampionSearch] = useState('');

  const handleFilterChange = (key: keyof MatchFilter, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleSortOrderToggle = () => {
    onFiltersChange({
      ...filters,
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      queueType: 'all',
      champion: 'all',
      result: 'all',
      dateRange: 'all',
      sortBy: 'recent',
      sortOrder: 'desc',
    });
    setChampionSearch('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.queueType !== 'all') count++;
    if (filters.champion !== 'all') count++;
    if (filters.result !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.sortBy !== 'recent') count++;
    return count;
  };

  const filteredChampions = availableChampions.filter(champ =>
    champ.name.toLowerCase().includes(championSearch.toLowerCase())
  );

  return (
    <div className={`backdrop-blur-xl bg-white/5 rounded border border-yellow-500/20 shadow-lg p-2 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-1.5">
          <Filter className="h-3.5 w-3.5 text-white/60" />
          <h3 className="text-white text-xs font-semibold">Filters</h3>
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] px-1 py-0">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            onClick={clearFilters}
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/10 h-6 px-1.5 text-[10px]"
          >
            <X className="h-3 w-3 mr-0.5" />
            Clear
          </Button>
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/10 h-6 px-1.5 text-[10px]"
          >
            {isExpanded ? 'Less' : 'More'}
          </Button>
        </div>
      </div>

      {/* Quick Filters Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
        {/* Queue Type */}
        <Select value={filters.queueType} onValueChange={(value) => handleFilterChange('queueType', value)}>
          <SelectTrigger className="backdrop-blur-xl bg-white/10 border-yellow-500/20 text-white h-7 text-xs">
            <SelectValue>
              {queueTypes.find(q => q.value === filters.queueType)?.label || 'All Queues'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="backdrop-blur-xl bg-slate-800 border-yellow-500/20 z-[9999]">
            {queueTypes.map((queue) => (
              <SelectItem key={queue.value} value={queue.value} className="text-white hover:bg-white/10 text-xs">
                {queue.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Result Filter */}
        <Select value={filters.result} onValueChange={(value) => handleFilterChange('result', value)}>
          <SelectTrigger className="backdrop-blur-xl bg-white/10 border-yellow-500/20 text-white h-7 text-xs">
            <SelectValue>
              {resultTypes.find(r => r.value === filters.result)?.label || 'All Results'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="backdrop-blur-xl bg-slate-800 border-yellow-500/20 z-[9999]">
            {resultTypes.map((result) => (
              <SelectItem key={result.value} value={result.value} className="text-white hover:bg-white/10 text-xs">
                {result.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range */}
        <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
          <SelectTrigger className="backdrop-blur-xl bg-white/10 border-yellow-500/20 text-white h-7 text-xs">
            <SelectValue>
              {dateRanges.find(d => d.value === filters.dateRange)?.label || 'All Time'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="backdrop-blur-xl bg-slate-800 border-yellow-500/20 z-[9999]">
            {dateRanges.map((range) => (
              <SelectItem key={range.value} value={range.value} className="text-white hover:bg-white/10 text-xs">
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Options */}
        <div className="flex gap-1">
          <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
            <SelectTrigger className="backdrop-blur-xl bg-white/10 border-yellow-500/20 text-white flex-1 h-7 text-xs">
              <SelectValue>
                {sortOptions.find(s => s.value === filters.sortBy)?.label || 'Most Recent'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="backdrop-blur-xl bg-slate-800 border-yellow-500/20 z-[9999]">
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-white hover:bg-white/10 text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleSortOrderToggle}
            variant="ghost"
            size="sm"
            className="backdrop-blur-xl bg-white/10 border border-yellow-500/20 text-white hover:bg-white/20 h-7 w-7 p-0"
          >
            {filters.sortOrder === 'asc' ? (
              <SortAsc className="h-3 w-3" />
            ) : (
              <SortDesc className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-1 pt-1 border-t border-white/10 mt-1">
          {/* Champion Search */}
          <div className="space-y-1">
            <label className="text-white/70 text-xs font-medium">Champion</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-white/40" />
              <Input
                placeholder="Search champions..."
                value={championSearch}
                onChange={(e) => setChampionSearch(e.target.value)}
                className="pl-7 backdrop-blur-xl bg-white/10 border-yellow-500/20 text-white placeholder-white/40 h-7 text-xs"
              />
            </div>
            
            {/* Champion Selection */}
            <div className="max-h-24 overflow-y-auto space-y-0.5">
              <Button
                onClick={() => handleFilterChange('champion', 'all')}
                variant={filters.champion === 'all' ? 'default' : 'ghost'}
                size="sm"
                className={filters.champion === 'all' 
                  ? 'bg-blue-500 text-white h-6 text-[10px] px-1.5' 
                  : 'text-white/60 hover:text-white hover:bg-white/10 h-6 text-[10px] px-1.5'
                }
              >
                All
              </Button>
              
              <div className="flex flex-wrap gap-0.5">
                {filteredChampions.slice(0, 12).map((champion) => (
                  <Button
                    key={champion.id}
                    onClick={() => handleFilterChange('champion', champion.name)}
                    variant={filters.champion === champion.name ? 'default' : 'ghost'}
                    size="sm"
                    className={filters.champion === champion.name 
                      ? 'bg-blue-500 text-white h-6 text-[10px] px-1.5' 
                      : 'text-white/60 hover:text-white hover:bg-white/10 h-6 text-[10px] px-1.5'
                    }
                  >
                    {champion.name}
                  </Button>
                ))}
              </div>
              
              {filteredChampions.length > 12 && (
                <div className="text-white/40 text-[10px] text-center py-0.5">
                  +{filteredChampions.length - 12} more
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for mobile
export function MatchFiltersCompact({ 
  filters, 
  onFiltersChange, 
  className = '' 
}: {
  filters: MatchFilter;
  onFiltersChange: (filters: MatchFilter) => void;
  className?: string;
}) {
  return (
    <div className={`flex space-x-2 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 ${className}`}>
      <Select value={filters.queueType} onValueChange={(value) => onFiltersChange({...filters, queueType: value})}>
        <SelectTrigger className="backdrop-blur-xl bg-white/10 border-white/20 text-white min-w-[120px]">
          <SelectValue>
            {queueTypes.find(q => q.value === filters.queueType)?.label || 'All Queues'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="backdrop-blur-xl bg-slate-800 border-white/20">
          {queueTypes.map((queue) => (
            <SelectItem key={queue.value} value={queue.value} className="text-white hover:bg-white/10">
              {queue.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.result} onValueChange={(value) => onFiltersChange({...filters, result: value})}>
        <SelectTrigger className="backdrop-blur-xl bg-white/10 border-white/20 text-white min-w-[100px]">
          <SelectValue>
            {resultTypes.find(r => r.value === filters.result)?.label || 'All Results'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="backdrop-blur-xl bg-slate-800 border-white/20">
          {resultTypes.map((result) => (
            <SelectItem key={result.value} value={result.value} className="text-white hover:bg-white/10">
              {result.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.sortBy} onValueChange={(value) => onFiltersChange({...filters, sortBy: value})}>
        <SelectTrigger className="backdrop-blur-xl bg-white/10 border-white/20 text-white min-w-[120px]">
          <SelectValue>
            {sortOptions.find(s => s.value === filters.sortBy)?.label || 'Most Recent'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="backdrop-blur-xl bg-slate-800 border-white/20">
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-white hover:bg-white/10">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}


'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';
import { PerformanceTrend } from '@/lib/match-analytics';

interface TrendIndicatorProps {
  trend: PerformanceTrend;
  change?: number; // Percentage change
  value?: number | string; // Current value
  previousValue?: number | string; // Previous value for comparison
  label?: string;
  showArrow?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: {
    icon: 'h-3 w-3',
    text: 'text-xs',
    container: 'px-2 py-1',
  },
  md: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    container: 'px-3 py-1.5',
  },
  lg: {
    icon: 'h-5 w-5',
    text: 'text-base',
    container: 'px-4 py-2',
  },
};

export function TrendIndicator({
  trend,
  change,
  value,
  previousValue,
  label,
  showArrow = true,
  showPercentage = true,
  size = 'md',
  className = '',
}: TrendIndicatorProps) {
  const sizeClass = sizeClasses[size];
  
  const getTrendIcon = () => {
    if (!showArrow) return null;
    
    switch (trend) {
      case 'improving':
        return <ArrowUp className={sizeClass.icon} />;
      case 'declining':
        return <ArrowDown className={sizeClass.icon} />;
      case 'stable':
        return <Minus className={sizeClass.icon} />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'improving':
        return 'text-green-400';
      case 'declining':
        return 'text-red-400';
      case 'stable':
        return 'text-slate-400';
    }
  };

  const getTrendBackground = () => {
    switch (trend) {
      case 'improving':
        return 'bg-green-500/20 border-green-500/30';
      case 'declining':
        return 'bg-red-500/20 border-red-500/30';
      case 'stable':
        return 'bg-slate-500/20 border-slate-500/30';
    }
  };

  const formatChange = () => {
    if (change === undefined) return '';
    
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const formatValue = (val: number | string | undefined) => {
    if (val === undefined) return '';
    if (typeof val === 'number') {
      return val.toFixed(1);
    }
    return val.toString();
  };

  return (
    <div className={`inline-flex items-center space-x-1 ${className}`}>
      {/* Trend Badge */}
      <div className={`inline-flex items-center space-x-1 ${sizeClass.container} rounded-lg border backdrop-blur-xl ${getTrendBackground()}`}>
        {getTrendIcon()}
        {showPercentage && change !== undefined && (
          <span className={`${sizeClass.text} font-semibold ${getTrendColor()}`}>
            {formatChange()}
          </span>
        )}
      </div>

      {/* Value Display */}
      {value !== undefined && (
        <div className="flex flex-col items-end">
          <span className={`${sizeClass.text} font-semibold text-white`}>
            {formatValue(value)}
          </span>
          {label && (
            <span className="text-xs text-slate-400">{label}</span>
          )}
        </div>
      )}

      {/* Previous Value Comparison */}
      {previousValue !== undefined && value !== undefined && (
        <div className="text-xs text-slate-500">
          vs {formatValue(previousValue)}
        </div>
      )}
    </div>
  );
}

// Compact version for use in stats grids
export function TrendIndicatorCompact({
  trend,
  change,
  className = '',
}: {
  trend: PerformanceTrend;
  change?: number;
  className?: string;
}) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-3 w-3 text-green-400" />;
      case 'declining':
        return <TrendingDown className="h-3 w-3 text-red-400" />;
      case 'stable':
        return <Minus className="h-3 w-3 text-slate-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'improving':
        return 'text-green-400';
      case 'declining':
        return 'text-red-400';
      case 'stable':
        return 'text-slate-400';
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {getTrendIcon()}
      {change !== undefined && (
        <span className={`text-xs font-semibold ${getTrendColor()}`}>
          {change > 0 ? '+' : ''}{change.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

// Mini version for use in small spaces
export function TrendIndicatorMini({
  trend,
  className = '',
}: {
  trend: PerformanceTrend;
  className?: string;
}) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <ArrowUp className="h-3 w-3 text-green-400" />;
      case 'declining':
        return <ArrowDown className="h-3 w-3 text-red-400" />;
      case 'stable':
        return <Minus className="h-3 w-3 text-slate-400" />;
    }
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      {getTrendIcon()}
    </div>
  );
}

// Performance trend with detailed breakdown
export function TrendIndicatorDetailed({
  trend,
  change,
  value,
  previousValue,
  label,
  description,
  className = '',
}: {
  trend: PerformanceTrend;
  change?: number;
  value?: number | string;
  previousValue?: number | string;
  label?: string;
  description?: string;
  className?: string;
}) {
  const getTrendDescription = () => {
    if (description) return description;
    
    switch (trend) {
      case 'improving':
        return 'Performance is improving';
      case 'declining':
        return 'Performance is declining';
      case 'stable':
        return 'Performance is stable';
    }
  };

  return (
    <div className={`backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-300 text-sm">{label}</span>
        <TrendIndicator trend={trend} change={change} size="sm" />
      </div>
      
      <div className="flex items-center justify-between mb-1">
        <span className="text-white font-semibold text-lg">
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        {previousValue !== undefined && (
          <span className="text-slate-400 text-sm">
            vs {typeof previousValue === 'number' ? previousValue.toFixed(1) : previousValue}
          </span>
        )}
      </div>
      
      <div className="text-xs text-slate-400">
        {getTrendDescription()}
      </div>
    </div>
  );
}


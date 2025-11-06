'use client';

import React from 'react';

interface MasteryProgressBarProps {
  currentLevel: number;
  pointsSinceLastLevel: number;
  pointsUntilNextLevel: number;
}

export function MasteryProgressBar({ 
  currentLevel, 
  pointsSinceLastLevel, 
  pointsUntilNextLevel 
}: MasteryProgressBarProps) {
  const isMaxLevel = currentLevel >= 7;
  
  const getProgressPercentage = () => {
    if (isMaxLevel) return 100;
    const totalNeeded = pointsSinceLastLevel + pointsUntilNextLevel;
    if (totalNeeded === 0) return 100;
    return (pointsSinceLastLevel / totalNeeded) * 100;
  };

  const getProgressBarColor = () => {
    if (isMaxLevel) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    if (currentLevel >= 6) return 'bg-gradient-to-r from-red-500 to-pink-500';
    if (currentLevel >= 5) return 'bg-gradient-to-r from-purple-500 to-indigo-500';
    if (currentLevel >= 4) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (currentLevel >= 3) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    return 'bg-gradient-to-r from-gray-500 to-slate-500';
  };

  const formatPoints = (points: number) => {
    if (points >= 1000) return `${(points / 1000).toFixed(0)}k`;
    return points.toString();
  };

  const progressPercentage = getProgressPercentage();

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Progress indicators */}
        {!isMaxLevel && (
          <div className="flex justify-between text-xs text-white/60 mt-1">
            <span>{formatPoints(pointsSinceLastLevel)}</span>
            <span>{formatPoints(pointsUntilNextLevel)} to level {currentLevel + 1}</span>
          </div>
        )}
        
        {isMaxLevel && (
          <div className="text-center text-xs text-yellow-400 font-semibold mt-1">
            Master Level Achieved
          </div>
        )}
      </div>

      {/* Level progression indicator */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5, 6, 7].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                level <= currentLevel
                  ? level === 7
                    ? 'bg-yellow-500 border-yellow-400'
                    : level >= 6
                    ? 'bg-red-500 border-red-400'
                    : level >= 5
                    ? 'bg-purple-500 border-purple-400'
                    : level >= 4
                    ? 'bg-blue-500 border-blue-400'
                    : level >= 3
                    ? 'bg-green-500 border-green-400'
                    : 'bg-gray-500 border-gray-400'
                  : 'bg-transparent border-white/30'
              }`}
            />
          ))}
        </div>
        
        <div className="text-xs text-white/60">
          Level {currentLevel}/7
        </div>
      </div>
    </div>
  );
}
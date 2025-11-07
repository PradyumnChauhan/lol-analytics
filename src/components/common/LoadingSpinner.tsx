'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className = '', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-slate-300 border-t-blue-500`}></div>
      {text && (
        <p className="mt-2 text-slate-400 text-sm">{text}</p>
      )}
    </div>
  );
}

export function LoadingCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white/5 rounded-xl p-4 animate-pulse ${className}`}>
      <div className="space-y-3">
        <div className="h-4 bg-slate-700 rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-700 rounded"></div>
          <div className="h-3 bg-slate-700 rounded w-5/6"></div>
          <div className="h-3 bg-slate-700 rounded w-4/6"></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-8 bg-slate-700 rounded"></div>
          <div className="h-8 bg-slate-700 rounded"></div>
          <div className="h-8 bg-slate-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function LoadingGrid({ count = 6, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </div>
  );
}

export default LoadingSpinner;










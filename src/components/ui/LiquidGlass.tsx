'use client';

import React from 'react';
import { useLiquidGlass, type LiquidGlassConfig } from '@/hooks/useLiquidGlass';
import { LiquidGlassFilter } from './LiquidGlassFilter';
import '@/styles/liquid-glass.css';

// Inject backdrop-filter with URL via inline style
const injectBackdropFilter = (element: HTMLElement, filterId: string) => {
  if (element) {
    element.style.setProperty('backdrop-filter', `url(#${filterId}) saturate(var(--lg-saturation, 1))`);
  }
};

export interface LiquidGlassProps {
  children: React.ReactNode;
  config?: LiquidGlassConfig;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Liquid Glass Wrapper Component
 * Combines hook and filter to provide easy-to-use liquid glass effect
 */
export function LiquidGlass({
  children,
  config = {},
  className = '',
  style = {},
}: LiquidGlassProps) {
  const {
    ref,
    filterId,
    style: hookStyle,
    className: hookClassName,
    displacementMapURI,
    isReady,
  } = useLiquidGlass(config);

  // Merge styles
  const mergedStyle: React.CSSProperties = {
    ...hookStyle,
    ...style,
  };

  // Merge classNames
  const mergedClassName = `${hookClassName} ${className}`.trim();

  // Get filter props from config - match reference defaults
  const fullConfig = {
    scale: -180,
    radius: 16,
    border: 0.07,
    lightness: 50,
    alpha: 0.93,
    blur: 11,
    displace: 0.2, // Match dock preset
    blend: 'difference',
    x: 'R' as const,
    y: 'G' as const, // Fixed: should be 'G' not 'B'
    r: 0,
    g: 10,
    b: 20,
    saturation: 1.5, // Match dock preset
    frost: 0.05, // Match dock preset
    ...config,
  };

  // Apply backdrop-filter with URL when element is ready
  // Also update when dimensions change to regenerate displacement map
  React.useEffect(() => {
    if (isReady && ref.current && displacementMapURI) {
      injectBackdropFilter(ref.current, filterId);
    }
  }, [isReady, filterId, displacementMapURI, ref]);

  return (
    <>
      {/* Always render filter - it will update when displacementMapURI is ready */}
      <LiquidGlassFilter
        filterId={filterId}
        displacementMapURI={displacementMapURI}
        scale={fullConfig.scale}
        rOffset={fullConfig.r}
        gOffset={fullConfig.g}
        bOffset={fullConfig.b}
        displace={fullConfig.displace}
        xChannel={fullConfig.x}
        yChannel={fullConfig.y}
      />
      <div ref={ref} className={mergedClassName} style={mergedStyle}>
        {children}
      </div>
    </>
  );
}


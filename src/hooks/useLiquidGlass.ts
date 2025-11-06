'use client';

import { useRef, useEffect, useState, useMemo, useId } from 'react';
import { generateDisplacementMapDataURI, type DisplacementMapConfig } from '@/lib/utils/displacementMapGenerator';

export interface LiquidGlassConfig {
  scale?: number;
  radius?: number;
  border?: number;
  lightness?: number;
  alpha?: number;
  blur?: number;
  displace?: number;
  blend?: string;
  x?: 'R' | 'G' | 'B';
  y?: 'R' | 'G' | 'B';
  r?: number;
  g?: number;
  b?: number;
  saturation?: number;
  frost?: number;
}

const defaultConfig: Required<LiquidGlassConfig> = {
  scale: -180,
  radius: 16,
  border: 0.07,
  lightness: 50,
  alpha: 0.93,
  blur: 11,
  displace: 0.2, // Changed from 0 to 0.2 to match dock preset
  blend: 'difference',
  x: 'R', // xChannel should be 'R'
  y: 'G', // yChannel should be 'G' (not 'B' as I had before)
  r: 0,
  g: 10,
  b: 20,
  saturation: 1.5, // Changed from 1 to 1.5 to match dock preset
  frost: 0.05, // Changed from 0 to 0.05 to match dock preset
};

export interface LiquidGlassReturn {
  ref: React.RefObject<HTMLDivElement>;
  filterId: string;
  style: React.CSSProperties;
  className: string;
  displacementMapURI: string | null;
  isReady: boolean;
}

/**
 * Custom hook for liquid glass effect
 * Measures element dimensions, generates displacement maps, and manages CSS variables
 */
export function useLiquidGlass(config: LiquidGlassConfig = {}): LiquidGlassReturn {
  const ref = useRef<HTMLDivElement>(null);
  const filterId = useId().replace(/:/g, '-'); // Replace colons with dashes for CSS
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Merge config with defaults
  const fullConfig = useMemo(() => {
    return { ...defaultConfig, ...config };
  }, [config]);

  // Generate displacement map when dimensions are available
  // Always generate a map - use measured dimensions or fallback to reasonable defaults
  const displacementMapURI = useMemo(() => {
    // Use actual dimensions if available, otherwise use a reasonable default
    // The map will be regenerated when dimensions are measured
    const width = dimensions?.width || 400;
    const height = dimensions?.height || 300;

    const mapConfig: DisplacementMapConfig = {
      width: Math.max(width, 100), // Ensure minimum size
      height: Math.max(height, 100), // Ensure minimum size
      radius: fullConfig.radius,
      border: fullConfig.border,
      lightness: fullConfig.lightness,
      alpha: fullConfig.alpha,
      blur: fullConfig.blur,
      blend: fullConfig.blend,
    };

    return generateDisplacementMapDataURI(mapConfig);
  }, [dimensions, fullConfig.radius, fullConfig.border, fullConfig.lightness, fullConfig.alpha, fullConfig.blur, fullConfig.blend]);

  // Measure element dimensions
  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    
    // Initial measurement
    const measure = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
        setIsReady(true);
      }
    };

    measure();

    // Use ResizeObserver for dynamic updates
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({
            width: Math.round(width),
            height: Math.round(height),
          });
        }
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate CSS variables (only for filter generation, not for sizing)
  const style = useMemo(() => {
    return {
      '--lg-radius': fullConfig.radius.toString(),
      '--lg-frost': fullConfig.frost.toString(),
      '--lg-saturation': fullConfig.saturation.toString(),
      '--lg-filter-url': `url(#${filterId})`,
    } as React.CSSProperties;
  }, [fullConfig, filterId]);

  const className = useMemo(() => {
    return isReady ? 'liquid-glass liquid-glass-visible' : 'liquid-glass';
  }, [isReady]);

  return {
    ref,
    filterId,
    style,
    className,
    displacementMapURI,
    isReady,
  };
}


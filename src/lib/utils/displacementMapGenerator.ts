/**
 * Liquid Glass Displacement Map Generator
 * Generates SVG displacement maps for liquid glass effect
 * Based on the reference implementation from liquidglass
 */

export interface DisplacementMapConfig {
  width: number;
  height: number;
  radius: number;
  border: number; // border ratio (0-1)
  lightness: number; // 0-100
  alpha: number; // 0-1
  blur: number;
  blend: string; // blend mode, default 'difference'
}

/**
 * Calculates border dimensions based on element size and border ratio
 */
export function calculateBorder(
  width: number,
  height: number,
  borderRatio: number
): number {
  return Math.min(width, height) * (borderRatio * 0.5);
}

/**
 * Generates SVG displacement map string
 * Creates a gradient-based displacement map for liquid glass effect
 */
export function generateDisplacementMapSVG(config: DisplacementMapConfig): string {
  const { width, height, radius, border, lightness, alpha, blur, blend } = config;
  const borderSize = calculateBorder(width, height, border);
  const centerY = Math.min(width, height) * (border * 0.5);

  // Exact match from reference implementation
  const svg = `
<svg class="displacement-image" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#000"/>
      <stop offset="100%" stop-color="red"/>
    </linearGradient>
    <linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#000"/>
      <stop offset="100%" stop-color="blue"/>
    </linearGradient>
  </defs>
  <!-- backdrop -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="black"></rect>
  <!-- red linear -->
  <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#red)" />
  <!-- blue linear -->
  <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#blue)" style="mix-blend-mode: ${blend}" />
  <!-- block out distortion -->
  <rect x="${borderSize}" y="${centerY}" width="${width - borderSize * 2}" height="${
    height - borderSize * 2
  }" rx="${radius}" fill="hsl(0 0% ${lightness}% / ${alpha})" style="filter:blur(${blur}px)" />
</svg>`.trim();

  return svg;
}

/**
 * Converts SVG string to data URI
 * Encodes the SVG for use in feImage href attribute
 */
export function svgToDataURI(svgString: string): string {
  const encoded = encodeURIComponent(svgString);
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Generates displacement map and returns as data URI
 * Convenience function that combines generation and encoding
 */
export function generateDisplacementMapDataURI(
  config: DisplacementMapConfig
): string {
  const svg = generateDisplacementMapSVG(config);
  return svgToDataURI(svg);
}


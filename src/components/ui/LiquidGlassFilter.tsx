'use client';

import React, { useEffect, useRef } from 'react';

export interface LiquidGlassFilterProps {
  filterId: string;
  displacementMapURI: string | null;
  scale: number;
  rOffset: number;
  gOffset: number;
  bOffset: number;
  displace: number;
  xChannel: 'R' | 'G' | 'B';
  yChannel: 'R' | 'G' | 'B';
}

/**
 * Liquid Glass SVG Filter Component
 * Renders the complete SVG filter with displacement mapping and chromatic aberration
 * Based on the reference implementation - updates filter attributes dynamically
 */
export function LiquidGlassFilter({
  filterId,
  displacementMapURI,
  scale,
  rOffset,
  gOffset,
  bOffset,
  displace,
  xChannel,
  yChannel,
}: LiquidGlassFilterProps) {
  const filterRef = useRef<SVGFilterElement>(null);

  // Update filter attributes dynamically when props change
  useEffect(() => {
    if (!filterRef.current) return;

    const filter = filterRef.current;
    const feImage = filter.querySelector('feImage') as SVGElement;
    const redChannel = filter.querySelector('#redchannel') as SVGElement;
    const greenChannel = filter.querySelector('#greenchannel') as SVGElement;
    const blueChannel = filter.querySelector('#bluechannel') as SVGElement;
    const feGaussianBlur = filter.querySelector('feGaussianBlur') as SVGElement;

    // Update displacement map URI
    if (feImage && displacementMapURI) {
      feImage.setAttribute('href', displacementMapURI);
    }

    // Update channel selectors
    if (redChannel) {
      redChannel.setAttribute('xChannelSelector', xChannel);
      redChannel.setAttribute('yChannelSelector', yChannel);
      redChannel.setAttribute('scale', (scale + rOffset).toString());
    }
    if (greenChannel) {
      greenChannel.setAttribute('xChannelSelector', xChannel);
      greenChannel.setAttribute('yChannelSelector', yChannel);
      greenChannel.setAttribute('scale', (scale + gOffset).toString());
    }
    if (blueChannel) {
      blueChannel.setAttribute('xChannelSelector', xChannel);
      blueChannel.setAttribute('yChannelSelector', yChannel);
      blueChannel.setAttribute('scale', (scale + bOffset).toString());
    }

    // Update output blur
    if (feGaussianBlur) {
      feGaussianBlur.setAttribute('stdDeviation', displace.toString());
    }
  }, [displacementMapURI, scale, rOffset, gOffset, bOffset, displace, xChannel, yChannel]);

  return (
    <svg
      className="filter"
      style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none', inset: 0 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB" ref={filterRef}>
          {/* Input displacement image - href will be set dynamically */}
          <feImage
            x="0"
            y="0"
            width="100%"
            height="100%"
            result="map"
            href={displacementMapURI || ''}
          />
          
          {/* RED channel with strongest displacement */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            id="redchannel"
            xChannelSelector={xChannel}
            yChannelSelector={yChannel}
            scale={scale + rOffset}
            result="dispRed"
          />
          <feColorMatrix
            in="dispRed"
            type="matrix"
            values="1 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="red"
          />
          
          {/* GREEN channel (reference / least displaced) */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            id="greenchannel"
            xChannelSelector={xChannel}
            yChannelSelector={yChannel}
            scale={scale + gOffset}
            result="dispGreen"
          />
          <feColorMatrix
            in="dispGreen"
            type="matrix"
            values="0 0 0 0 0
                    0 1 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="green"
          />
          
          {/* BLUE channel with medium displacement */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            id="bluechannel"
            xChannelSelector={xChannel}
            yChannelSelector={yChannel}
            scale={scale + bOffset}
            result="dispBlue"
          />
          <feColorMatrix
            in="dispBlue"
            type="matrix"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 1 0 0
                    0 0 0 1 0"
            result="blue"
          />
          
          {/* Blend channels back together */}
          <feBlend in="red" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blue" mode="screen" result="output" />
          
          {/* Output blur - stdDeviation updated dynamically */}
          <feGaussianBlur in="output" stdDeviation={displace} />
        </filter>
      </defs>
    </svg>
  );
}


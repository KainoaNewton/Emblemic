

import React, { useMemo } from 'react';
import { IconConfig, PixelGrid } from '../types';
import * as Icons from 'lucide-react';
import { ICON_SIZE } from '../constants';

interface PreviewProps {
  config: IconConfig;
  id?: string; // For capture
}

// Display size in pixels on screen (independent of render resolution)
const PREVIEW_SIZE = 256;

const Preview: React.FC<PreviewProps> = ({ config, id }) => {
  const {
    mode,
    backgroundType,
    solidColor,
    gradientStart,
    gradientEnd,
    gradientAngle,
    noiseOpacity,
    radialGlareOpacity,
    selectedIconName,
    iconColor,
    iconSize,
    iconOffsetY,
    textContent,
    fontFamily,
    textColor,
    textSize,
    pixelGrid,
    pixelSize,
    pixelRounding,
  } = config;

  // Calculate scale factor from internal resolution (512) to preview display (256)
  const scale = PREVIEW_SIZE / ICON_SIZE;

  // Generate Background Style
  const backgroundStyle = useMemo(() => {
    // Background is always enabled for preview
    let bg = '';
    if (backgroundType === 'solid') {
      bg = solidColor;
    } else if (backgroundType === 'linear') {
      bg = `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`;
    } else if (backgroundType === 'radial') {
      bg = `radial-gradient(circle at center, ${gradientStart}, ${gradientEnd})`;
    }
    return { background: bg };
  }, [backgroundType, solidColor, gradientStart, gradientEnd, gradientAngle]);

  // Get Lucide Icon
  const LucideIcon = (Icons as any)[selectedIconName];

  // Helper for Pixel Smart Rounding
  const getPixelStyle = (index: number, color: string) => {
    const style: React.CSSProperties = { backgroundColor: color || 'transparent' };
    
    if (pixelRounding > 0 && color) {
        const cols = pixelGrid.cols;
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        const check = (r: number, c: number) => {
            if (r < 0 || r >= pixelGrid.rows || c < 0 || c >= cols) return false;
            return pixelGrid.data[r * cols + c] === color;
        };

        const hasTop = check(row - 1, col);
        const hasBottom = check(row + 1, col);
        const hasLeft = check(row, col - 1);
        const hasRight = check(row, col + 1);

        const radiusVal = `${(pixelRounding / 100) * 50}%`;

        // If a side has a neighbor, the shared corners are NOT rounded
        const tl = (!hasTop && !hasLeft) ? radiusVal : '0';
        const tr = (!hasTop && !hasRight) ? radiusVal : '0';
        const br = (!hasBottom && !hasRight) ? radiusVal : '0';
        const bl = (!hasBottom && !hasLeft) ? radiusVal : '0';

        style.borderRadius = `${tl} ${tr} ${br} ${bl}`;
    }
    
    return style;
  };

  return (
    <div className="relative flex items-center justify-center group">
      {/* Shadow for depth perception (not exported) */}
      <div
        className="absolute inset-4 blur-2xl opacity-40 rounded-full transition-all duration-500 group-hover:opacity-60 group-hover:blur-3xl"
        style={backgroundStyle}
      />

      {/* Main Icon Container */}
      <div
        id={id}
        className="relative overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-[1.02]"
        style={{
          width: `${PREVIEW_SIZE}px`,
          height: `${PREVIEW_SIZE}px`,
          ...backgroundStyle,
          // Approximate iOS Squircle with CSS for display
          borderRadius: '22%',
        }}
      >
        {/* Noise Texture Overlay */}
        {noiseOpacity > 0 && (
           <div 
             className="absolute inset-0 pointer-events-none z-0 mix-blend-overlay"
             style={{
               opacity: noiseOpacity,
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
             }}
           />
        )}

        {/* Radial Glare Overlay */}
        {radialGlareOpacity > 0 && (
           <div 
             className="absolute inset-0 pointer-events-none z-0"
             style={{
               background: `radial-gradient(circle at 50% 0%, rgba(255,255,255,${radialGlareOpacity}) 0%, transparent 70%)`,
             }}
           />
        )}

        {/* Content Wrapper */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {mode === 'icon' && LucideIcon && (
            <div
              style={{
                transform: `translateY(${iconOffsetY * scale}px)`,
                color: iconColor,
                lineHeight: 0,
              }}
            >
              <LucideIcon size={iconSize * scale} strokeWidth={1.5} />
            </div>
          )}

          {mode === 'text' && (
            <div
              className="text-center leading-none select-none whitespace-pre"
              style={{
                fontFamily: fontFamily,
                color: textColor,
                fontSize: `${textSize * scale}px`,
                fontWeight: config.fontWeight,
                transform: `translateY(${config.textOffsetY * scale}px)`,
              }}
            >
              {textContent}
            </div>
          )}

          {mode === 'pixel' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${pixelGrid.cols}, 1fr)`,
                width: `${pixelSize * scale}px`,
                aspectRatio: '1/1',
                // When rounding is active, pixelated rendering can look jagged on rounded corners in some browsers, 
                // but usually better to keep it for the straight edges. 
                imageRendering: 'pixelated',
              }}
            >
              {pixelGrid.data.map((c, i) => (
                <div key={i} style={getPixelStyle(i, c)} />
              ))}
            </div>
          )}

          {mode === 'image' && config.imageSrc && (
             <div
                style={{
                  width: `${config.imageSize * scale}px`,
                  height: `${config.imageSize * scale}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `translateY(${config.imageOffsetY * scale}px)`,
                }}
             >
               <img 
                 src={config.imageSrc} 
                 alt="Uploaded content" 
                 style={{ 
                   maxWidth: '100%', 
                   maxHeight: '100%', 
                   objectFit: 'contain',
                   userSelect: 'none',
                   pointerEvents: 'none',
                   display: 'block'
                 }} 
               />
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Preview;

import React from 'react';

export interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'color' | 'monochrome' | 'white';
  showText?: boolean;
  compact?: boolean;
  className?: string;
  id?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  size = 'md',
  variant = 'color',
  showText = false,
  compact,
  className = '',
  id,
}) => {
  // Dimension mapping
  const sizePixels = typeof size === 'number' 
    ? size 
    : size === 'sm' 
      ? 24 
      : size === 'md' 
        ? 36 
        : size === 'lg' 
          ? 48 
          : 64;

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const textSizeClass = typeof size === 'number' ? 'text-xl' : textSizes[size];

  // Auto-determine compact mode if not explicitly set
  const isCompact = compact !== undefined ? compact : sizePixels <= 24;

  // Colors based on variant
  const strokeColor = variant === 'white' ? '#FFFFFF' : '#0B192C';
  const ballBg = variant === 'white' ? '#0B192C' : '#FFFFFF';
  const netColor = variant === 'white' ? '#60A5FA' : '#0B192C';
  const netMeshColor = variant === 'white' ? '#3B82F6' : '#1E3A8A';
  const redAccent = variant === 'monochrome' ? '#475569' : '#E63946';

  return (
    <div id={id} className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* SVG Volleyball Over Net Emblem */}
      <svg
        width={sizePixels}
        height={sizePixels}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
        aria-label="Símbolo RallyNaVila Vôlei e Rede"
        role="img"
      >
        <defs>
          <linearGradient id="rnv-net-grad" x1="0" y1="55" x2="0" y2="95" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={netColor} />
            <stop offset="100%" stopColor={netMeshColor} />
          </linearGradient>

          <filter id="rnv-ball-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0B192C" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* 1. Trajectory / Motion Lines (Only on non-compact full version) */}
        {!isCompact && (
          <g opacity="0.85">
            {/* Short diagonal trajectory lines indicating spike/rally upward movement */}
            <path
              d="M 12 78 Q 22 68, 30 52"
              stroke={redAccent}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 22 86 Q 30 76, 38 62"
              stroke={variant === 'white' ? '#60A5FA' : '#2563EB'}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* 2. Volleyball Net (Secondary element at bottom) */}
        <g id="volleyball-net">
          {/* Top Cable / Band of the Net */}
          <path
            d="M 5 62 L 95 62"
            stroke={netColor}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Net Mesh Pattern Lines */}
          <path
            d="M 12 62 V 92 M 28 62 V 92 M 44 62 V 92 M 60 62 V 92 M 76 62 V 92 M 88 62 V 92"
            stroke={netMeshColor}
            strokeWidth="1.8"
            strokeOpacity="0.7"
          />
          <path
            d="M 5 72 H 95 M 5 82 H 95 M 5 92 H 95"
            stroke={netMeshColor}
            strokeWidth="1.8"
            strokeOpacity="0.7"
          />
        </g>

        {/* 3. Clearly Recognizable Volleyball (Main element crossing above net) */}
        <g id="volleyball-body" filter="url(#rnv-ball-shadow)">
          {/* Main Ball Base Circle */}
          <circle cx="58" cy="36" r="28" fill={ballBg} stroke={strokeColor} strokeWidth="3" />

          {/* Volleyball 18-Panel Curved Seams Geometry */}
          {/* Panel 1: Top Arch Seam */}
          <path
            d="M 58 8 C 48 18, 44 32, 42 48"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Panel 2: Center Sweep Panel Seam */}
          <path
            d="M 32 26 C 46 28, 62 34, 84 28"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Panel 3: Lower Curved Panel Seam */}
          <path
            d="M 38 52 C 54 44, 70 48, 82 56"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Red Accent Panel Line (Distinctive Rally Accent) */}
          <path
            d="M 58 8 C 68 18, 76 28, 84 28"
            stroke={redAccent}
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Highlight Arc on Ball */}
          <path
            d="M 38 20 A 20 20 0 0 1 54 12"
            stroke={variant === 'white' ? '#FFFFFF' : '#3B82F6'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
        </g>
      </svg>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-black tracking-tight ${textSizeClass} text-[#0B192C] ${variant === 'white' ? '!text-white' : ''}`}>
            Rally<span className="text-[#E63946]">NaVila</span>
          </span>
        </div>
      )}
    </div>
  );
};

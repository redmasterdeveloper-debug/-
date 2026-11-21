import React from 'react';

interface UrSkyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const UrSkyLogo: React.FC<UrSkyLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const dimensions =
    size === 'sm'
      ? 'h-10 w-auto'
      : size === 'lg'
        ? 'h-16 w-auto'
        : 'h-12 w-auto';

  return (
    <svg
      viewBox="0 0 250 74"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${dimensions} select-none shrink-0 ${className}`}
      role="img"
      aria-label="شعار شبكة سماء أور الإخبارية UR SKY"
    >
      {/* Slanted Main Rectangle */}
      <polygon
        points="22,6 202,6 186,68 6,68"
        fill="#f6f3db"
      />

      {/* Slanted Side Strip */}
      <polygon
        points="208,6 244,6 228,68 192,68"
        fill="#f6f3db"
        fillOpacity="0.92"
      />

      {/* Subtle hairline divider shadow effect between shapes */}
      <polygon
        points="202,6 208,6 192,68 186,68"
        fill="#683424"
        fillOpacity="0.45"
      />

      {/* Top-left corner: ur sky */}
      <text
        x="26"
        y="21"
        fill="#683424"
        fontFamily="Cairo, sans-serif"
        fontSize="11.5"
        fontWeight="700"
        letterSpacing="0.8"
        textAnchor="start"
        direction="ltr"
      >
        ur sky
      </text>

      {/* Center bold: سماء اور */}
      <text
        x="108"
        y="48"
        fill="#683424"
        fontFamily="Cairo, sans-serif"
        fontSize="26"
        fontWeight="800"
        textAnchor="middle"
      >
        سماء اور
      </text>

      {/* Vertical text inside slanted side strip: الإخبارية */}
      <g transform="translate(218, 37) rotate(-75.5)">
        <text
          x="0"
          y="4"
          fill="#683424"
          fontFamily="Cairo, sans-serif"
          fontSize="11"
          fontWeight="800"
          textAnchor="middle"
        >
          الإخبارية
        </text>
      </g>
    </svg>
  );
};

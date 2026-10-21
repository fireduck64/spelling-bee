import React from 'react';

interface BeeLogoProps {
  className?: string;
  size?: number;
}

export const BeeLogo: React.FC<BeeLogoProps> = ({ className = 'w-10 h-10', size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Spelling Bee Logo"
    >
      <rect width="100" height="100" rx="24" fill="#9333ea" />
      {/* Left & Right Wings */}
      <ellipse cx="32" cy="44" rx="16" ry="10" transform="rotate(-25 32 44)" fill="white" fillOpacity="0.9" />
      <ellipse cx="68" cy="44" rx="16" ry="10" transform="rotate(25 68 44)" fill="white" fillOpacity="0.9" />
      {/* Antennae */}
      <path d="M44 26 Q38 16 32 18" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="32" cy="18" r="3" fill="white" />
      <path d="M56 26 Q62 16 68 18" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="68" cy="18" r="3" fill="white" />
      {/* Bee Head */}
      <circle cx="50" cy="31" r="9" fill="white" />
      {/* Bee Body (with purple stripes cut out) */}
      <ellipse cx="50" cy="57" rx="17" ry="21" fill="white" />
      <path d="M34 50 H66 M33 58 H67 M35 66 H65" stroke="#9333ea" strokeWidth="4.5" strokeLinecap="round" />
      {/* Stinger */}
      <polygon points="46,77 54,77 50,86" fill="white" />
    </svg>
  );
};

import React from 'react';

const NexusIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <path 
      d="M50 5 C 50 15, 85 50, 95 50 C 85 50, 50 85, 50 95 C 50 85, 15 50, 5 50 C 15 50, 50 15, 50 5 Z" 
      stroke="currentColor" 
      strokeWidth="5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <text 
      x="50" 
      y="50" 
      fill="currentColor" 
      fontSize="36" 
      fontFamily="'Playfair Display', sans-serif" 
      fontWeight="900" 
      textAnchor="middle"
      dominantBaseline="central"
    >
      NI
    </text>
  </svg>
);

export default NexusIcon;

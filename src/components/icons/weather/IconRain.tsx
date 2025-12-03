// src/components/icons/weather/IconRain.tsx
import React from "react";

export function IconRain(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Rain" {...props}>
      {/* Cloud */}
      <path
        d="M7.5 13.5a3 3 0 0 1 .3-6A4 4 0 0 1 12 5a4 4 0 0 1 3.9 3.2A3 3 0 0 1 16.5 13.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Raindrops */}
      <line x1="9" y1="15.5" x2="8" y2="19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="12" y1="16" x2="11" y2="19.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="15" y1="15.5" x2="14" y2="19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

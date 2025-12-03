// src/components/icons/weather/IconClearDay.tsx
import React from "react";

export function IconClearDay(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Clear sky"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {/* Rays */}
      <line x1="12" y1="2.5" x2="12" y2="5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="21.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="4.3" y1="4.3" x2="6.1" y2="6.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="17.9" y1="17.9" x2="19.7" y2="19.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="2.5" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="19" y1="12" x2="21.5" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="4.3" y1="19.7" x2="6.1" y2="17.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="17.9" y1="6.1" x2="19.7" y2="4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

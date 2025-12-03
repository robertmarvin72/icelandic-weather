// src/components/icons/weather/IconSnow.tsx
import React from "react";

export function IconSnow(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Snow" {...props}>
      {/* Cloud */}
      <path
        d="M7.5 13.5a3 3 0 0 1 .3-6A4 4 0 0 1 12 5a4 4 0 0 1 3.9 3.2A3 3 0 0 1 16.5 13.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Snowflakes (simple) */}
      <circle cx="9" cy="17" r="0.8" fill="currentColor" />
      <circle cx="12" cy="19" r="0.8" fill="currentColor" />
      <circle cx="15" cy="17" r="0.8" fill="currentColor" />
    </svg>
  );
}

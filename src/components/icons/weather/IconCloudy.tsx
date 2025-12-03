// src/components/icons/weather/IconCloudy.tsx
import React from "react";

export function IconCloudy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Cloudy" {...props}>
      <path
        d="M7.5 18.5a3.5 3.5 0 0 1 .3-7A4 4 0 0 1 12 8a4 4 0 0 1 3.9 3.2A3.3 3.3 0 0 1 16.5 18.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

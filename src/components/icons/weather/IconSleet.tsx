import React from "react";

export function IconSleet(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Sleet"
      {...props}
    >
      {/* Cloud */}
      <path
        d="M7.5 11.5a3 3 0 0 1 .3-6A4 4 0 0 1 12 3a4 4 0 0 1 3.9 3.2A3 3 0 0 1 16.5 11.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Mix of rain + snow */}
      <line
        x1="9"
        y1="13.5"
        x2="8"
        y2="16.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.5" r="0.8" fill="currentColor" />
      <line
        x1="15"
        y1="13.5"
        x2="14"
        y2="16.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

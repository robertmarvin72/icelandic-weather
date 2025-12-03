import React from "react";

export function IconFog(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Fog"
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
      {/* Fog lines */}
      <line
        x1="5"
        y1="15"
        x2="17"
        y2="15"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="6.5"
        y1="17.5"
        x2="19"
        y2="17.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

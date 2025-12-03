import React from "react";

export function IconThunderstorm(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Thunderstorm"
      {...props}
    >
      {/* Cloud */}
      <path
        d="M7.5 12.5a3 3 0 0 1 .3-6A4 4 0 0 1 12 4a4 4 0 0 1 3.9 3.2A3 3 0 0 1 16.5 12.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lightning bolt */}
      <polyline
        points="10.5 13.5 9 17 11 17 9.5 20.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Optional raindrop */}
      <line
        x1="14"
        y1="13.5"
        x2="13"
        y2="16.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

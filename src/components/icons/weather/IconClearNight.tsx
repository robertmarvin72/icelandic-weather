import React from "react";

export function IconClearNight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Clear night"
      {...props}
    >
      {/* Crescent moon */}
      <path
        d="M16.5 4.5A6.5 6.5 0 1 0 19.5 15 5 5 0 0 1 16.5 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

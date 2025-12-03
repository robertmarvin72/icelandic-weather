import React from "react";

export function IconHail(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Hail"
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
      {/* Hail stones */}
      <circle cx="9" cy="15" r="0.9" fill="currentColor" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" />
      <circle cx="15" cy="15" r="0.9" fill="currentColor" />
    </svg>
  );
}

import React from "react";

export function IconHeavyRain(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Heavy rain"
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
      {/* Dense raindrops */}
      <line x1="8.5" y1="13.5" x2="7.5" y2="17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="11" y1="14" x2="10" y2="17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="13.5" y1="13.5" x2="12.5" y2="17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="16" y1="14" x2="15" y2="17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

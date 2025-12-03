// src/components/icons/weather/IconPartlyCloudyDay.tsx
import React from "react";

export function IconPartlyCloudyDay(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Partly cloudy" {...props}>
      {/* Small sun behind cloud */}
      <circle
        cx="9"
        cy="9"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <line x1="9" y1="3" x2="9" y2="5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="9" y1="13" x2="9" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="3" y1="9" x2="5" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="13" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />

      {/* Cloud */}
      <path
        d="M8 16a3 3 0 0 1 2.9-2.5A3.2 3.2 0 0 1 14 13a3 3 0 0 1 0 6H9a3 3 0 0 1-1-5.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

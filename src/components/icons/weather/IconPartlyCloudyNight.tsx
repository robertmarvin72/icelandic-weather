import React from "react";

export function IconPartlyCloudyNight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Partly cloudy night"
      {...props}
    >
      {/* Moon behind cloud */}
      <path
        d="M15.5 5.5A4 4 0 0 0 12 12a4 4 0 0 0 5.5 3.5A4.5 4.5 0 0 1 15.5 5.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Cloud */}
      <path
        d="M7.5 17.5a3 3 0 0 1 .3-6A3.8 3.8 0 0 1 12 9a3.8 3.8 0 0 1 3.7 3.1A3 3 0 0 1 16.5 17.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

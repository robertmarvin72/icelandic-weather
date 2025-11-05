import React from "react";

/**
 * A reusable shimmer (skeleton loader) for list, table, or card placeholders.
 * Props:
 *  - rows: number of shimmer lines to render
 *  - height: height of each shimmer line
 */
export default function LoadingShimmer({ rows = 5, height = 16 }) {
  return (
    <div className="p-4 space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-shimmer rounded"
          style={{ height: `${height}px` }}
        ></div>
      ))}
    </div>
  );
}

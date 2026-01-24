// src/components/DevProToggle.jsx
import React from "react";
import { useEntitlements } from "../hooks/useEntitlements";

export default function DevProToggle() {
  const { isPro, setIsPro } = useEntitlements();

  // Only show in dev to avoid “oops I shipped God Mode”
  if (import.meta.env.MODE !== "development") return null;

  return (
    <button
      type="button"
      onClick={() => setIsPro(!isPro)}
      className="rounded-md border px-2 py-1 text-xs opacity-70 hover:opacity-100"
      title="Dev only: toggle Pro"
    >
      Dev Pro: {isPro ? "ON" : "OFF"}
    </button>
  );
}

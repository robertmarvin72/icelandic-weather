// src/components/Brand.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Brand({ t, to = "/", size = "full" }) {
  // FLAT key (valfrjálst): brandTagline
  const tagline = t?.("brandTagline") ?? "Iceland Camping";

  // Size presets (minnst inngrip)
  const isSlim = size === "slim";

  return (
    <Link to={to} className="flex items-end gap-2 min-w-0">
      {/* Light mode logo */}
      <img
        src="/campcast-light.png"
        alt="CampCast"
        className={`block dark:hidden header-logo ${isSlim ? "h-8" : ""}`}
      />

      {/* Dark mode logo */}
      <img
        src="/campcast-dark.png"
        alt="CampCast"
        className={`hidden dark:block header-logo ${isSlim ? "h-8" : ""}`}
      />

      {/* Tagline aligns to bottom of logo text */}
      <span
        className={`header-title header-title-brand dark:text-slate-100 ${isSlim ? "text-xs" : ""}`}
      >
        {tagline}
      </span>
    </Link>
  );
}

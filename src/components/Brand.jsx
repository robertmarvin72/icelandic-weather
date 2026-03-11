// src/components/Brand.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Brand({ t, to = "/", size = "full" }) {
  // FLAT key (valfrjálst): brandTagline
  const tagline = t?.("brandTagline") ?? "Iceland Camping";

  // Size presets (minnst inngrip)
  const isSlim = size === "slim";

  return (
    <Link to={to} className="flex flex-col items-center min-w-0">
      {/* Light mode logo */}
      <img
        src="/campcast-light.png"
        alt="CampCast"
        className={`block dark:hidden ${isSlim ? "h-10" : "h-24 md:h-32"} w-auto shrink-0`}
      />

      {/* Dark mode logo */}
      <img
        src="/campcast-dark.png"
        alt="CampCast"
        className={`hidden dark:block ${isSlim ? "h-10" : "h-20 md:h-24"} w-auto shrink-0`}
      />

      {/* Tagline aligns to bottom of logo text */}
      <span
        className={`header-title header-title-brand dark:text-slate-100 ${
          isSlim ? "text-xs -mt-7" : "text-sm -mt-"
        }`}
      >
        {tagline}
      </span>
    </Link>
  );
}

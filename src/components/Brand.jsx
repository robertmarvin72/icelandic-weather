// src/components/Brand.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Brand({ t, to = "/", size = "full", hideTagline = false }) {
  const logoLight = "/eltumvedrid-light-is.png";
  const logoDark = "/eltumvedrid-dark-is.png";
  const altText = "Eltum Veðrið";

  // FLAT key (valfrjálst): brandTagline
  const tagline = t?.("brandTagline") ?? "Find better weather";

  // Size presets (minnst inngrip)
  const isSlim = size === "slim";

  return (
    <Link to={to} className="flex flex-col items-center min-w-0">
      {/* Light mode logo */}
      <img
        src={logoLight}
        alt={altText}
        className={`block dark:hidden ${isSlim ? "h-10" : "h-20 md:h-32"} w-auto shrink-0`}
      />

      {/* Dark mode logo */}
      <img
        src={logoDark}
        alt={altText}
        className={`hidden dark:block ${isSlim ? "h-10" : "h-20 md:h-32"} w-auto shrink-0`}
      />

      {!hideTagline && (
        <span
          className={`header-title header-title-brand dark:text-slate-100 ${
            isSlim ? "text-xs -mt-7" : "text-sm -mt-"
          }`}
        >
          {tagline}
        </span>
      )}
    </Link>
  );
}

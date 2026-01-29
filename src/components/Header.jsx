// src/components/Header.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Header({ t, rightSlot = null, slim = false }) {
  return (
    <header className="header-wrap">
      <div className="header-inner flex items-center justify-between">
        {/* Left: brand */}
        <Link to="/" className="flex items-end gap-2">
          {/* Light mode logo */}
          <img src="/campcast-light.png" alt="CampCast" className="header-logo block dark:hidden" />

          {/* Dark mode logo */}
          <img src="/campcast-dark.png" alt="CampCast" className="header-logo hidden dark:block" />

          {/* Tagline */}
          <span className="header-title header-title-brand dark:text-slate-100 pb-[2px]">
            {t?.("appTitle") ?? "Iceland Camping Weather"}
          </span>
        </Link>

        {/* Right: optional slot */}
        <div className="flex items-center gap-2">{rightSlot}</div>
      </div>

      {slim ? null : null}
    </header>
  );
}

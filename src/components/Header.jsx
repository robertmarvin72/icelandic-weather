// src/components/Header.jsx
import React from "react";
import Brand from "./Brand";

export default function Header({ t, lang, rightSlot = null, slim = false }) {
  return (
    <header className="header-wrap">
      <div className="header-inner flex items-center justify-between">
        <Brand t={t} size={slim ? "slim" : "full"} lang={lang} />
        <div className="flex items-center gap-2">{rightSlot}</div>
      </div>
    </header>
  );
}

// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Footer({ t }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-slate-200/60 dark:border-slate-700/60">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Row 1: nav / contact (left) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link
            to="/about"
            className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 underline-offset-4 hover:underline"
          >
            {t("footerAbout")}
          </Link>

          <span className="text-slate-400 dark:text-slate-600">·</span>

          <a
            href="mailto:hello@campcast.is"
            className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 underline-offset-4 hover:underline"
          >
            {t("footerContact")}: hello@campcast.is
          </a>
        </div>

        {/* Row 2: attribution (subtle) */}
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          © {year} CampCast · {t("footerDataBy")}{" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 underline-offset-4 hover:underline"
          >
            Open-Meteo
          </a>
        </div>
      </div>
    </footer>
  );
}

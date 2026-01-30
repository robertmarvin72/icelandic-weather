// src/components/SlimHeader.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";

export default function SlimHeader({ t }) {
  const navigate = useNavigate();

  return (
    <Header
      t={t}
      slim
      rightSlot={
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
        >
          ← {t("backToForecast")}
        </button>
      }
    />
  );
}

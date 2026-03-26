import React from "react";
import Footer from "../components/Footer";

export default function PricingInfo({ theme = "light", t, onUpgrade }) {
  const isLight = theme === "light";

  return (
    <div
      className={`min-h-screen ${
        isLight ? "bg-soft-grid text-slate-900" : "bg-slate-950 text-slate-100"
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 underline-offset-4 hover:underline"
          >
            {t("pricingInfoBack")}
          </a>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/70 md:p-8">
          <div className="mb-6">
            <div className="text-sm font-medium text-sky-600 dark:text-sky-400">
              {t("pricingInfoEyebrow")}
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {t("pricingInfoTitle")}
            </h1>

            <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-300">
              {t("pricingInfoLead")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/70 dark:bg-slate-800/60">
              <div className="text-sm font-semibold">{t("pricingInfoFeature1Title")}</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {t("pricingInfoFeature1Body")}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/70 dark:bg-slate-800/60">
              <div className="text-sm font-semibold">{t("pricingInfoFeature2Title")}</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {t("pricingInfoFeature2Body")}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/70 dark:bg-slate-800/60">
              <div className="text-sm font-semibold">{t("pricingInfoFeature3Title")}</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {t("pricingInfoFeature3Body")}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-700/70 dark:bg-slate-900/80">
              <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {t("pricingInfoMonthlyLabel")}
              </div>
              <div className="mt-2 text-3xl font-bold">{t("pricingInfoMonthlyPrice")}</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {t("pricingInfoMonthlyBody")}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {t("pricingInfoYearlyLabel")}
              </div>
              <div className="mt-2 text-3xl font-bold">{t("pricingInfoYearlyPrice")}</div>
              <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                {t("pricingInfoYearlyBody")}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 dark:border-slate-700/70 dark:bg-slate-800/60">
            <div className="text-base font-semibold">{t("pricingInfoIncludesTitle")}</div>

            <ul className="mt-3 grid gap-2 text-sm text-slate-700 dark:text-slate-300">
              <li>✓ {t("pricingInfoIncludes1")}</li>
              <li>✓ {t("pricingInfoIncludes2")}</li>
              <li>✓ {t("pricingInfoIncludes3")}</li>
              <li>✓ {t("pricingInfoIncludes4")}</li>
            </ul>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-700/70 dark:bg-slate-900/80">
            <div className="text-base font-semibold">{t("pricingInfoTrustTitle")}</div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t("pricingInfoTrustBody")}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/refund"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {t("pricingInfoRefundLink")}
              </a>

              <button
                onClick={onUpgrade}
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 dark:bg-white dark:text-slate-900"
              >
                {t("pricingInfoUpgradeLink")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer t={t} />
    </div>
  );
}

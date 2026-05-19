// src/pages/CampaignLandingPage.jsx
import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import Brand from "../components/Brand";
import { useThemeClass } from "../hooks/useThemeClass";

export default function CampaignLandingPage({
  t,
  lang,
  theme,
  headlineKey,
  subheadlineKey,
  ctaKey,
  metaTitle,
  metaDescription,
  canonicalPath,
}) {
  useThemeClass(theme === "dark");

  const { search } = useLocation();

  // Preserve UTM params when routing to the main app — do not strip them
  const ctaTo = useMemo(() => {
    return search ? `/${search}` : "/";
  }, [search]);

  const headline = t(headlineKey);
  const subheadline = t(subheadlineKey);
  const cta = t(ctaKey);

  const steps = [
    { title: t("landingStep1Title"), text: t("landingStep1Text") },
    { title: t("landingStep2Title"), text: t("landingStep2Text") },
    { title: t("landingStep3Title"), text: t("landingStep3Text") },
  ];

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={`${typeof window !== "undefined" ? window.location.origin : "https://campcast.is"}${canonicalPath}`} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={`${typeof window !== "undefined" ? window.location.origin : "https://campcast.is"}${canonicalPath}`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
      </Helmet>

      <div className="min-h-screen bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {/* Sticky header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-950/80">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3">
            <Brand t={t} size="slim" lang={lang} />
            <Link
              to={ctaTo}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {cta}
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-3xl px-6 py-16 text-center md:py-24">
          <div className="mb-4 inline-flex items-center rounded-full bg-sky-100/80 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
            {t("landingEyebrow")}
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight leading-tight md:text-5xl">
            {headline}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 dark:text-slate-400 md:text-lg">
            {subheadline}
          </p>
          <p className="mt-3 text-sm italic text-slate-500 dark:text-slate-400">
            {t("landingHeroUrgency")}
          </p>
          <div className="mt-8">
            <Link
              to={ctaTo}
              className="inline-block rounded-xl bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {cta}
            </Link>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              {t("landingHeroNoSignup")}
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-4xl px-6 pb-14">
          <div className="mb-6 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t("landingHowEyebrow")}
            </div>
            <div className="mt-1 text-lg font-bold">
              {t("landingHowTitle")}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200/70 bg-white/70 px-5 py-5 dark:border-slate-800/70 dark:bg-slate-900/70"
              >
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("landingStepLabel")} {i + 1}
                </div>
                <div className="mb-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                  {step.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{step.text}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-8 py-10 text-center dark:border-slate-800/70 dark:bg-slate-900/70">
            <div className="text-xl font-black tracking-tight">{t("landingFinalTitle")}</div>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {t("landingFinalText")}
            </p>
            <Link
              to={ctaTo}
              className="mt-6 inline-block rounded-xl bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {cta}
            </Link>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              {t("landingFinalNote")}
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200/60 py-6 text-center text-xs text-slate-400 dark:border-slate-800/60 dark:text-slate-600">
          <Link to="/" className="transition-colors hover:text-slate-600 dark:hover:text-slate-400">
            CampCast
          </Link>
          {" · "}
          <Link
            to="/pricing"
            className="transition-colors hover:text-slate-600 dark:hover:text-slate-400"
          >
            Pro
          </Link>
          {" · "}
          <Link
            to="/terms"
            className="transition-colors hover:text-slate-600 dark:hover:text-slate-400"
          >
            Terms
          </Link>
          {" · "}
          <Link
            to="/privacy"
            className="transition-colors hover:text-slate-600 dark:hover:text-slate-400"
          >
            Privacy
          </Link>
        </footer>
      </div>
    </>
  );
}

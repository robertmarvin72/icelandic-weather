// src/pages/NorthernLightsLanding.jsx
//
// Ticket 399 (#399) — permanent English-only product-entry page at
// /en/northern-lights, for organic and paid Northern Lights traffic.
//
// Forced-English contract: `t` is built independently at this route
// boundary via useT("en") — NOT usePageRouteProps().t, which closes over
// the saved language (see the existing /en/blog route, which only swaps
// `lang` and leaves `t` on the saved language — deliberately NOT copied
// here). This is the one and only place `lang`/`t` are decided for this
// page; every child (including NorthernLightsThreeNight) receives them
// from here, so nothing on this route can silently fall back to Icelandic.
//
// Tickets #423/#425: this page and App.jsx share NorthernLightsThreeNight,
// with explicit landing/homepage presentation. Both reuse the canonical
// /api/aurora-decision contract, Free/Pro gate and presentation helpers;
// scoring, freshness and candidates are not duplicated in this page.
//
// Ticket #431: this route needs no login/checkout journey any more — full
// Northern Lights access is open to every tier (see features.js's
// "northern_lights_free_v1" experiment), so the Free-only conversion
// section, its CTA handler, and the login/checkout machinery that only
// existed to serve it (useLoginFlow, useCheckoutFlow, LoginModal, ToastHub)
// are removed. `entitlements`/`loadingMe` are kept — they still drive
// aurora_landing_viewed's genuine-tier attribution and
// NorthernLightsThreeNight's own entitlement-resolution gating.

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import Brand from "../components/Brand";
import Footer from "../components/Footer";
import NorthernLightsThreeNight from "../components/NorthernLightsThreeNight";
import { useT } from "../hooks/useT";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { useThemeClass } from "../hooks/useThemeClass";
import { useMe } from "../hooks/useMe";
import { trackEvent } from "../lib/analytics";
import { NL_FREE_EXPERIMENT_ID } from "../config/features";
import { parseNightQueryDate, withNightQueryDate, AURORA_NIGHT_QUERY_PARAM } from "../lib/auroraNightQuery";

const CANONICAL_PATH = "/en/northern-lights";
// Matches the established production-origin convention already used by
// CampaignLandingPage.jsx / BlogPostPage.jsx's own Helmet/canonical URLs —
// window.location.origin is used whenever available (i.e. always, in this
// pure-CSR app); the literal fallback only guards the rare case it isn't.
const PRODUCTION_ORIGIN_FALLBACK = "https://campcast.is";

export default function NorthernLightsLanding() {
  // Independently constructed English t/lang — the entire forced-English
  // contract for this route starts here (approved prompt's explicit
  // `const t = useT("en")` requirement).
  const t = useT("en");
  const lang = "en";

  const [theme] = useLocalStorageState("theme", "light");
  useThemeClass(theme === "dark");

  // #425: the selected night arrives as an optional ?date=YYYY-MM-DD query
  // (from the homepage details link, or browser back/forward). Only a single
  // exact valid ISO date is passed on; the three-night hook decides whether
  // it is inside today's window and otherwise falls back to tonight.
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDate = parseNightQueryDate(searchParams);
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  // Mirrors the module's selection into the query with router REPLACE (no
  // history entry per tab), preserving unrelated params. Route entry without
  // a date param writes nothing; a present-but-unusable date (impossible,
  // duplicate, malformed, out of window) is normalized to the selection.
  const handleSelectedDateChange = useCallback(
    (date, { isInitial }) => {
      const current = searchParamsRef.current;
      const hasDateParam = current.getAll(AURORA_NIGHT_QUERY_PARAM).length > 0;
      if (isInitial && !hasDateParam) return;
      if (parseNightQueryDate(current) === date) return;
      setSearchParams(withNightQueryDate(current, date), { replace: true });
    },
    [setSearchParams],
  );

  const { me, loadingMe } = useMe();

  const entitlements = useMemo(
    () => ({ isPro: !!me?.entitlements?.pro, proUntil: me?.entitlements?.proUntil ?? null }),
    [me],
  );

  // aurora_landing_viewed — exactly once per mount, only after entitlement
  // resolution is truthful (useMe's loadingMe contract), so `tier` is never
  // a premature "free" guess. No PII: lang + tier only, never email/user
  // id/raw URL/UTM values. The global AnalyticsTracker already fires the
  // pageview for every route (including this one) — this is a separate
  // semantic event, not a duplicate. Ticket 403 (#403): unchanged — name,
  // payload, timing, and exact-once behavior are all preserved.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current || loadingMe) return;
    viewedRef.current = true;
    trackEvent("aurora_landing_viewed", {
      lang: "en",
      tier: entitlements.isPro ? "pro" : "free",
      business_model_experiment: NL_FREE_EXPERIMENT_ID,
    });
  }, [loadingMe, entitlements.isPro]);

  const canonicalUrl = `${typeof window !== "undefined" ? window.location.origin : PRODUCTION_ORIGIN_FALLBACK}${CANONICAL_PATH}`;
  const metaTitle = t("auroraLandingMetaTitle");
  const metaDescription = t("auroraLandingMetaDescription");

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
      </Helmet>

      <div className="min-h-screen bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-950/80">
          <div className="mx-auto flex max-w-3xl items-center px-6 py-3">
            {/* size="full" + hideTagline (Ticket 399 v3): the established
                product header uses Brand's full size (h-20 md:h-32) — the
                slim variant used in v1/v2 rendered a 40px logo, far smaller
                than the homepage's own branding. hideTagline is retained:
                slim's tagline collision (see cc-report.md §7/Revision 2)
                doesn't reach full's non-slim tagline class ("text-sm -mt-",
                an invalid/no-op Tailwind utility), but the prompt still
                requires no tagline here regardless. Neither change touches
                Brand.jsx or any other consumer. */}
            <Brand t={t} size="full" lang={lang} hideTagline />
          </div>
        </header>

        <section className="mx-auto max-w-3xl px-6 pt-10 pb-4 text-center md:pt-14">
          <h1 className="text-2xl font-black tracking-tight leading-tight md:text-4xl">
            {t("auroraLandingHeroTitle")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400 md:text-base">
            {t("auroraLandingHeroSubtitle")}
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-6">
          <NorthernLightsThreeNight
            t={t}
            lang={lang}
            entitlements={entitlements}
            theme={theme}
            loadingMe={loadingMe}
            surface="landing"
            requestedDate={requestedDate}
            onSelectedDateChange={handleSelectedDateChange}
          />
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-6">
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-5 py-5 dark:border-slate-800/70 dark:bg-slate-900/70">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t("auroraLandingHowEyebrow")}
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t("auroraLandingHowText")}</p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-10">
          <p className="text-center text-xs italic text-slate-500 dark:text-slate-400">
            {t("auroraLandingDisclaimer")}
          </p>
        </section>

        <Footer t={t} />
      </div>
    </>
  );
}

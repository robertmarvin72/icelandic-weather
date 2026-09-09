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
// page; every child (including the real NorthernLightsCard) receives them
// from here, so nothing on this route can silently fall back to Icelandic.
//
// The card itself is the same canonical src/components/NorthernLightsCard.jsx
// used on the homepage — same request, classification, Free/Pro
// presentation, details/ranking/map exposure, upgrade click, and analytics.
// Nothing about Aurora scoring/ranking/freshness/candidates is duplicated,
// precomputed, or reinterpreted here.

import { useEffect, useMemo, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import Brand from "../components/Brand";
import Footer from "../components/Footer";
import LoginModal from "../components/LoginModal";
import ToastHub from "../components/ToastHub";
import NorthernLightsCard from "../components/NorthernLightsCard";
import { useT } from "../hooks/useT";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { useThemeClass } from "../hooks/useThemeClass";
import { useMe } from "../hooks/useMe";
import { useToast } from "../hooks/useToast";
import { useLoginFlow } from "../hooks/useLoginFlow";
import { useCheckoutFlow } from "../hooks/useCheckoutFlow";
import { trackEvent } from "../lib/analytics";

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

  const navigate = useNavigate();
  const { toasts, pushToast, dismissToast } = useToast();
  const { me, loadingMe, refetchMe } = useMe();

  const {
    loginOpen,
    loginEmail,
    loginBusy,
    setLoginEmail,
    openLoginModal,
    closeLoginModal,
    submitLogin,
  } = useLoginFlow({ me, navigate, pushToast, refetchMe, t });

  // Same established login/checkout journey as the homepage — no new auth
  // or payment flow. onUpgrade is passed straight through to the card
  // unwrapped, so the card's own `source` argument reaches this exactly as
  // App.jsx's own `onUpgrade={startCheckout}` wiring does.
  const { startCheckout } = useCheckoutFlow({ me, navigate, openLoginModal, pushToast, refetchMe, t });

  const entitlements = useMemo(
    () => ({ isPro: !!me?.entitlements?.pro, proUntil: me?.entitlements?.proUntil ?? null }),
    [me],
  );

  // aurora_landing_viewed — exactly once per mount, only after entitlement
  // resolution is truthful (useMe's loadingMe contract), so `tier` is never
  // a premature "free" guess. No PII: lang + tier only, never email/user
  // id/raw URL/UTM values. The global AnalyticsTracker already fires the
  // pageview for every route (including this one) — this is a separate
  // semantic event, not a duplicate.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current || loadingMe) return;
    viewedRef.current = true;
    trackEvent("aurora_landing_viewed", { lang: "en", tier: entitlements.isPro ? "pro" : "free" });
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

      <ToastHub toasts={toasts} onDismiss={dismissToast} />
      <LoginModal
        open={loginOpen}
        loginBusy={loginBusy}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        closeLoginModal={closeLoginModal}
        submitLogin={submitLogin}
        t={t}
      />

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
          <NorthernLightsCard t={t} lang={lang} entitlements={entitlements} onUpgrade={startCheckout} theme={theme} />
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

// src/pages/Pricing.jsx
import React, { useEffect, useMemo, useState } from "react";

export default function Pricing({ lang = "is", theme = "dark", t, onClose }) {
  const isLight = theme === "light";

  // Translation helper (fallbacks only matter if a key is missing)
  const T = (key, fallback) => {
    if (typeof t === "function") {
      const v = t(key);
      return v == null ? fallback : v;
    }
    return fallback;
  };

  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [busyPlan, setBusyPlan] = useState(""); // "monthly" | "yearly" | ""
  const [error, setError] = useState("");

  // Optional: support ?email=... to prefill Subscribe page
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const emailPrefill = params.get("email") || "";

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/me", { credentials: "include" });
        const j = await r.json().catch(() => ({}));
        if (!alive) return;
        if (r.ok && j?.ok) setMe(j);
        else setMe(null);
      } catch {
        if (!alive) return;
        setMe(null);
      } finally {
        if (!alive) return;
        setLoadingMe(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function goManage() {
    setError("");
    setBusyPlan("manage");
    try {
      const r = await fetch("/api/billing-portal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        throw new Error(
          j?.error ||
            T("billingPortalUnavailable", "Billing portal not ready for this account yet.")
        );
      }
      if (!j?.url) throw new Error(T("subscribeMissingCheckoutUrl", "Missing checkout URL."));
      window.location.assign(j.url);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setBusyPlan("");
    }
  }

  async function startCheckout(plan) {
    if (busyPlan) return;

    setError("");
    setBusyPlan(plan);

    try {
      // If user is not logged in, send them to /subscribe (email prefill)
      if (!me?.user?.email) {
        const q = new URLSearchParams();
        if (emailPrefill) q.set("email", emailPrefill);
        q.set("plan", plan);
        window.location.assign(`/subscribe?${q.toString()}`);
        return;
      }

      // Logged in: call checkout directly
      const r = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        if (r.status === 401) {
          const q = new URLSearchParams();
          q.set("email", me?.user?.email || emailPrefill);
          q.set("plan", plan);
          window.location.assign(`/subscribe?${q.toString()}`);
          return;
        }
        throw new Error(j?.error || T("subscribeSomethingWentWrong", "Something went wrong."));
      }

      if (!j?.url) throw new Error(T("subscribeMissingCheckoutUrl", "Missing checkout URL."));
      window.location.assign(j.url);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setBusyPlan("");
    }
  }

  const proActive = !!me?.entitlements?.pro || me?.user?.tier === "pro";

  const styles = getStyles(isLight);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Top bar */}
        <div style={styles.topBar}>
          <button
            type="button"
            style={styles.back}
            onClick={() => (onClose ? onClose() : window.history.back())}
          >
            {T("pricingBack", "← Back")}
          </button>

          <div style={styles.brandPill} title={T("pricingBrandTitle", "CampCast Pro")}>
            <div style={styles.brandLogoWrap}>
              <img
                src="/logo.png"
                alt={T("pricingBrandAlt", "CampCast")}
                style={styles.brandLogo}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <div style={styles.brandTitle}>{T("pricingBrandTitle", "CampCast Pro")}</div>
              <div style={styles.brandSub}>{T("pricingBrandSub", "Follow the weather")}</div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={styles.card}>
          <h1 style={styles.h1}>{T("pricingTitle", "Choose your Pro plan")}</h1>
          <p style={styles.p}>{T("pricingLead", "Better campsite decisions all season long.")}</p>

          {/* Status row */}
          <div style={styles.statusRow}>
            {loadingMe ? (
              <span style={styles.muted}>{T("loading", "Loading...")}</span>
            ) : proActive ? (
              <span style={styles.good}>{T("proActive", "Pro active ✓")}</span>
            ) : me?.user?.email ? (
              <span style={styles.muted}>
                {T("loggedIn", "Logged in")}: <b>{me.user.email}</b>
              </span>
            ) : (
              <span style={styles.warn}>
                {T("pricingNotLoggedIn", "Not logged in — you’ll enter email on the next step.")}
              </span>
            )}
          </div>

          {error ? (
            <div style={styles.errorBox}>
              <div style={{ fontWeight: 900, marginBottom: 4 }}>
                {T("subscribeOopsTitle", "Oops!")}
              </div>
              <div>{error}</div>
            </div>
          ) : null}

          {/* Plans */}
          <div style={styles.grid}>
            {/* Yearly - primary */}
            <div style={styles.planPrimary}>
              <div style={styles.badge}>{T("pricingBestValue", "Best value")}</div>

              <div style={styles.planTitle}>
                {T("pricingYearlyTitle", "CampCast Pro — Season 2026")}
              </div>
              <div style={styles.planPriceRow}>
                <div style={styles.price}>€24.99</div>
                <div style={styles.per}>{T("pricingPerYear", "/ year")}</div>
              </div>
              <div style={styles.micro}>{T("pricingYearlyMicro", "≈ €2.08 / month")}</div>

              <ul style={styles.list}>
                <li>{T("pricingFeatureAllPro", "Full Pro access")}</li>
                <li>{T("pricingFeatureWindShelter", "Wind direction + shelter score")}</li>
                <li>{T("pricingFeatureCancelAnytime", "Cancel anytime")}</li>
              </ul>

              {proActive ? (
                <button
                  type="button"
                  style={styles.ctaPrimary(true)}
                  onClick={goManage}
                  disabled={busyPlan === "manage"}
                >
                  {busyPlan === "manage"
                    ? T("openingBillingPortal", "Opening billing portal…")
                    : T("manageSubscription", "Manage")}
                </button>
              ) : (
                <button
                  type="button"
                  style={styles.ctaPrimary(busyPlan === "yearly")}
                  onClick={() => startCheckout("yearly")}
                  disabled={!!busyPlan}
                >
                  {busyPlan === "yearly"
                    ? T("subscribeCtaBusy", "Opening checkout…")
                    : T("pricingCtaYearly", "Get Season Pass")}
                </button>
              )}
            </div>

            {/* Monthly - secondary */}
            <div style={styles.planSecondary}>
              <div style={styles.planTitle}>
                {T("pricingMonthlyTitle", "CampCast Pro — Monthly")}
              </div>
              <div style={styles.planPriceRow}>
                <div style={styles.price}>€4.99</div>
                <div style={styles.per}>{T("pricingPerMonth", "/ month")}</div>
              </div>

              <ul style={styles.list}>
                <li>{T("pricingFeatureAllPro", "Full Pro access")}</li>
                <li>{T("pricingFeatureCancelAnytime", "Cancel anytime")}</li>
              </ul>

              {proActive ? (
                <button
                  type="button"
                  style={styles.ctaSecondary(true)}
                  onClick={goManage}
                  disabled={busyPlan === "manage"}
                >
                  {busyPlan === "manage"
                    ? T("openingBillingPortal", "Opening billing portal…")
                    : T("manageSubscription", "Manage")}
                </button>
              ) : (
                <button
                  type="button"
                  style={styles.ctaSecondary(busyPlan === "monthly")}
                  onClick={() => startCheckout("monthly")}
                  disabled={!!busyPlan}
                >
                  {busyPlan === "monthly"
                    ? T("subscribeCtaBusy", "Opening checkout…")
                    : T("pricingCtaMonthly", "Start Monthly")}
                </button>
              )}
            </div>
          </div>

          <div style={styles.finePrint}>
            {T("pricingFinePrint", "Secure checkout via Paddle. Cancel anytime.")}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStyles(isLight) {
  return {
    page: {
      minHeight: "100vh",
      padding: "28px 16px",
      color: isLight ? "#0B1220" : "white",
      background: isLight
        ? "linear-gradient(180deg, #F7FAFC 0%, #EEF2F7 100%)"
        : "linear-gradient(180deg, #060A12 0%, #060A12 100%)",
    },

    container: { maxWidth: 860, margin: "0 auto" },

    topBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 14,
    },

    back: {
      border: 0,
      background: "transparent",
      color: isLight ? "#0B1220" : "rgba(255,255,255,0.9)",
      fontWeight: 800,
      cursor: "pointer",
      padding: "10px 10px",
      borderRadius: 12,
    },

    brandPill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 12px",
      borderRadius: 999,
      border: isLight ? "1px solid rgba(2,6,23,0.10)" : "1px solid rgba(255,255,255,0.12)",
      background: isLight ? "rgba(255,255,255,0.8)" : "rgba(15,23,42,0.55)",
      backdropFilter: "blur(6px)",
    },

    brandLogoWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      overflow: "hidden",
      background: isLight ? "rgba(2,6,23,0.06)" : "rgba(255,255,255,0.06)",
      display: "grid",
      placeItems: "center",
      flex: "0 0 auto",
    },

    brandLogo: { width: 28, height: 28, objectFit: "contain" },
    brandTitle: { fontWeight: 950, fontSize: 12, letterSpacing: 0.2 },
    brandSub: { fontSize: 11, opacity: 0.75 },

    card: {
      borderRadius: 24,
      padding: 18,
      border: isLight ? "1px solid rgba(2,6,23,0.12)" : "1px solid rgba(255,255,255,0.12)",
      background: isLight ? "white" : "rgba(2,6,23,0.65)",
    },

    h1: { margin: 0, fontSize: 28, fontWeight: 950, letterSpacing: -0.4 },
    p: { marginTop: 8, marginBottom: 0, fontSize: 14, opacity: 0.85, lineHeight: 1.5 },

    statusRow: { marginTop: 10, fontSize: 13 },
    muted: { opacity: 0.75 },
    good: { fontWeight: 900 },
    warn: { opacity: 0.9 },

    errorBox: {
      marginTop: 12,
      borderRadius: 16,
      padding: 12,
      border: "1px solid rgba(239,68,68,0.28)",
      background: "rgba(239,68,68,0.10)",
      color: isLight ? "#7f1d1d" : "rgba(255,255,255,0.95)",
      fontSize: 13,
      lineHeight: 1.4,
    },

    grid: {
      marginTop: 14,
      display: "grid",
      gap: 12,
      gridTemplateColumns: "1fr",
    },

    planPrimary: {
      position: "relative",
      borderRadius: 22,
      padding: 16,
      border: "1.5px solid rgba(16,185,129,0.65)",
      background: isLight ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.08)",
      boxShadow: "0 12px 30px rgba(16,185,129,0.18)",
    },

    planSecondary: {
      borderRadius: 22,
      padding: 16,
      border: isLight ? "1px solid rgba(2,6,23,0.12)" : "1px solid rgba(255,255,255,0.12)",
      background: isLight ? "rgba(2,6,23,0.03)" : "rgba(255,255,255,0.03)",
    },

    badge: {
      position: "absolute",
      top: 12,
      right: 12,
      fontSize: 12,
      fontWeight: 900,
      padding: "6px 10px",
      borderRadius: 999,
      background: "rgba(16,185,129,0.20)",
      border: "1px solid rgba(16,185,129,0.35)",
    },

    planTitle: { fontWeight: 950, fontSize: 15, marginBottom: 8 },

    planPriceRow: { display: "flex", alignItems: "baseline", gap: 8 },
    price: { fontSize: 30, fontWeight: 950, letterSpacing: -0.5 },
    per: { fontSize: 13, opacity: 0.75, fontWeight: 800 },
    micro: { marginTop: 6, fontSize: 12, opacity: 0.8, fontWeight: 700 },

    list: { marginTop: 10, marginBottom: 14, paddingLeft: 18, opacity: 0.9, fontSize: 13 },

    ctaPrimary: (busy) => ({
      width: "100%",
      borderRadius: 16,
      border: 0,
      cursor: busy ? "not-allowed" : "pointer",
      padding: "12px 14px",
      fontSize: 14,
      fontWeight: 950,
      background: busy ? "rgba(16,185,129,0.55)" : "rgba(16,185,129,0.95)",
      color: "white",
    }),

    ctaSecondary: (busy) => ({
      width: "100%",
      borderRadius: 16,
      border: isLight ? "1px solid rgba(2,6,23,0.12)" : "1px solid rgba(255,255,255,0.12)",
      cursor: busy ? "not-allowed" : "pointer",
      padding: "12px 14px",
      fontSize: 14,
      fontWeight: 900,
      background: "transparent",
      color: isLight ? "#0B1220" : "rgba(255,255,255,0.92)",
    }),

    finePrint: { marginTop: 12, fontSize: 12, opacity: 0.75, textAlign: "center" },
  };
}

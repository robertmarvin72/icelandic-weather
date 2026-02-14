// src/pages/Pricing.jsx
import React, { useMemo, useState } from "react";
import { useMe } from "../hooks/useMe";

export default function Pricing({ onClose, lang = "is", theme = "dark", t, me }) {
  const isLight = theme === "light";
  const styles = getStyles(isLight);

  // If route doesn't pass `me`, fetch it here so Pricing can still gate buttons.
  const { me: hookMe } = useMe();
  const ME = me || hookMe;
  const userId = ME?.user?.id || null;

  const proActive = !!ME?.entitlements?.pro;
  const proUntil = ME?.entitlements?.proUntil || null;
  const plan = ME?.subscription?.plan || null; // "monthly" | "yearly" | "unknown" | null
  const isYearly = proActive && plan === "yearly";
  const isMonthly = proActive && plan === "monthly";

  const [busyPlan, setBusyPlan] = useState(""); // "monthly" | "yearly" | ""
  const [error, setError] = useState("");

  // Translation helper (fallbacks only matter if a key is missing)
  const T = (key, fallback) => {
    if (typeof t === "function") {
      const v = t(key);
      return v == null ? fallback : v;
    }
    return fallback;
  };

  // --- Helpers --------------------------------------------------------------

  async function postJson(url, body) {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });

    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // non-JSON
    }

    return { res, json, text };
  }

  function pickErrorMessage({ res, json, text, fallback }) {
    return (
      json?.error ||
      json?.message ||
      (typeof text === "string" && text.trim() ? text.trim() : null) ||
      fallback ||
      `Request failed (${res?.status || "?"})`
    );
  }

  // If user is not logged in, route to /subscribe (email prefill) first.
  function goSubscribe(plan) {
    const to = `/subscribe?plan=${encodeURIComponent(plan)}`;
    window.location.assign(to);
  }

  async function startCheckout(plan) {
    if (busyPlan) return;

    // Pricing is the plan selector; Subscribe is email prefill + session creation.
    if (!userId) {
      goSubscribe(plan);
      return;
    }

    setBusyPlan(plan);
    setError("");

    try {
      // IMPORTANT:
      // This assumes your /api/checkout supports { plan: "monthly" | "yearly" }
      const { res, json, text } = await postJson("/api/checkout", { plan });

      // Subscription already active / upgrade rules
      if (res.status === 409) {
        if (json?.code === "SUB_ACTIVE_YEARLY") {
          const until = json?.proUntil ? new Date(json.proUntil).toLocaleDateString() : "";
          throw new Error(
            T(
              "pricingAlreadyYearly",
              until
                ? `Your yearly subscription is already active until ${until}.`
                : "Your yearly subscription is already active."
            )
          );
        }
        if (json?.code === "SUB_ACTIVE_MONTHLY") {
          const until = json?.proUntil ? new Date(json.proUntil).toLocaleDateString() : "";
          throw new Error(
            T(
              "pricingMonthlyActive",
              until
                ? `You already have an active monthly subscription until ${until}.`
                : "You already have an active monthly subscription."
            )
          );
        }
        throw new Error(
          pickErrorMessage({
            res,
            json,
            text,
            fallback: T("subscribeSomethingWentWrong", "Something went wrong."),
          })
        );
      }

      if (!res.ok || !json?.ok) {
        const msg = pickErrorMessage({
          res,
          json,
          text,
          fallback: T("subscribeSomethingWentWrong", "Something went wrong."),
        });

        if (res.status === 401) {
          // Session mismatch; send user through email-prefill flow.
          goSubscribe(plan);
          return;
        }

        throw new Error(msg);
      }

      // Monthly -> Yearly upgrade returns { ok:true, upgraded:true } (no checkout URL)
      if (json?.upgraded) {
        window.location.assign("/?checkout=success&upgrade=1");
        return;
      }

      if (!json?.url) {
        throw new Error(T("subscribeMissingCheckoutUrl", "Missing checkout URL."));
      }

      window.location.assign(json.url);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setBusyPlan("");
    }
  }

  const yearlyPrice = "€24.99";
  const monthlyPrice = "€4.99";

  const featuresYearly = [
    T("pricingFeatureAllPro", "All Pro features unlocked"),
    T("pricingFeatureWindShelter", "Wind direction + shelter score"),
    T("pricingFeatureCancelAnytime", "Cancel anytime"),
  ];

  const featuresMonthly = [
    T("pricingFeatureAllPro", "All Pro features unlocked"),
    T("pricingFeatureCancelAnytime", "Cancel anytime"),
  ];

  return (
    <div style={styles.page}>
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

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
              <img src="/logo.png" alt="CampCast" style={styles.brandLogo} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <div style={styles.brandTitle}>{T("pricingBrandTitle", "CampCast Pro")}</div>
              <div style={styles.brandSub}>{T("pricingBrandSub", "Follow the weather")}</div>
            </div>
          </div>
        </div>

        {/* Main card */}
        <div style={styles.card}>
          <h1 style={styles.h1}>{T("pricingTitle", "Choose your plan")}</h1>
          <p style={styles.p}>
            {T("pricingLead", "Pick monthly or yearly. Payment is handled securely by Paddle.")}
          </p>

          {!userId ? (
            <div style={styles.note}>
              {T("pricingNotLoggedIn", "We’ll ask for your email before checkout.")}
            </div>
          ) : null}

          {isYearly ? (
            <div style={styles.infoBox}>
              <div style={{ fontWeight: 900, marginBottom: 4 }}>
                {T("pricingYearlyActive", "Subscription active")}
              </div>
              <div>
                {T("pricingAlreadyYearly", "Your yearly subscription is already active.")}
                {proUntil ? (
                  <>
                    <br />
                    {T("pricingActiveUntil", "Active until")}{" "}
                    {new Date(proUntil).toLocaleDateString()}
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {isMonthly ? (
            <div style={styles.note}>
              <div style={{ fontWeight: 900, marginBottom: 4 }}>
                {T("pricingMonthlyActive", "Monthly subscription active")}
              </div>
              <div>
                {T(
                  "pricingMonthlyUpgradeHint",
                  "You can upgrade to yearly any time. Monthly cannot be purchased twice."
                )}
              </div>
            </div>
          ) : null}

          {error ? (
            <div style={styles.errorBox}>
              <div style={{ fontWeight: 900, marginBottom: 4 }}>
                {T("subscribeOopsTitle", "Oops!")}
              </div>
              <div>{error}</div>
            </div>
          ) : null}

          <div style={styles.plans}>
            {/* Yearly (featured) */}
            <div style={styles.planFeatured}>
              <div style={styles.planHeader}>
                <div>
                  <div style={styles.planTitle}>{T("pricingYearlyTitle", "Yearly")}</div>
                  <div style={styles.planPriceRow}>
                    <div style={styles.planPrice}>{yearlyPrice}</div>
                    <div style={styles.planPer}>{T("pricingPerYear", "per year")}</div>
                  </div>
                  <div style={styles.planMicro}>
                    {T("pricingYearlyMicro", "One payment. Cancel anytime.")}
                  </div>
                </div>

                <div style={styles.badgeBestValue}>{T("pricingBestValue", "Best value")}</div>
              </div>

              <ul style={styles.featureList}>
                {featuresYearly.map((x) => (
                  <li key={x} style={styles.featureItem}>
                    <span aria-hidden>✅</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                style={styles.cta(true, busyPlan === "yearly")}
                onClick={() => startCheckout("yearly")}
                disabled={!!busyPlan || isYearly}
              >
                {busyPlan === "yearly"
                  ? T("subscribeCtaBusy", "Opening checkout…")
                  : isMonthly
                    ? T("pricingCtaUpgradeToYearly", "Upgrade to Yearly")
                    : T("pricingCtaYearly", "Get Yearly")}
              </button>
            </div>

            {/* Monthly */}
            <div style={styles.plan}>
              <div style={styles.planTitle}>{T("pricingMonthlyTitle", "Monthly")}</div>

              <div style={styles.planPriceRow}>
                <div style={styles.planPrice}>{monthlyPrice}</div>
                <div style={styles.planPer}>{T("pricingPerMonth", "per month")}</div>
              </div>

              <ul style={styles.featureList}>
                {featuresMonthly.map((x) => (
                  <li key={x} style={styles.featureItem}>
                    <span aria-hidden>✅</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                style={styles.cta(false, busyPlan === "monthly")}
                onClick={() => startCheckout("monthly")}
                disabled={!!busyPlan || isMonthly || isYearly}
              >
                {busyPlan === "monthly"
                  ? T("subscribeCtaBusy", "Opening checkout…")
                  : isMonthly
                    ? T("pricingMonthlyAlreadyActive", "Monthly is active")
                    : isYearly
                      ? T("pricingMonthlyNotAvailable", "Not available")
                      : T("pricingCtaMonthly", "Get Monthly")}
              </button>
            </div>
          </div>

          <div style={styles.finePrint}>
            {T("pricingFinePrint", "You can manage or cancel anytime in the billing portal.")}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStyles(isLight) {
  const border = isLight ? "1px solid rgba(2,6,23,0.12)" : "1px solid rgba(255,255,255,0.12)";
  const softBorder = isLight ? "1px solid rgba(2,6,23,0.10)" : "1px solid rgba(255,255,255,0.10)";

  return {
    page: {
      minHeight: "100vh",
      padding: "28px 16px",
      color: isLight ? "#0B1220" : "white",
      background: isLight
        ? "radial-gradient(1200px 700px at 20% 10%, rgba(16,185,129,0.14), transparent 55%), radial-gradient(900px 600px at 85% 80%, rgba(59,130,246,0.10), transparent 55%), linear-gradient(180deg, #F7FAFC 0%, #EEF2F7 100%)"
        : "radial-gradient(1200px 700px at 20% 10%, rgba(16,185,129,0.18), transparent 55%), radial-gradient(900px 600px at 85% 80%, rgba(59,130,246,0.12), transparent 55%), linear-gradient(180deg, #060A12 0%, #060A12 100%)",
      position: "relative",
      overflow: "hidden",
    },

    glowTop: {
      position: "absolute",
      inset: "-200px -200px auto -200px",
      height: 420,
      background: "radial-gradient(circle at 30% 50%, rgba(16,185,129,0.22), transparent 60%)",
      filter: "blur(12px)",
      pointerEvents: "none",
      opacity: isLight ? 0.45 : 1,
    },
    glowBottom: {
      position: "absolute",
      inset: "auto -200px -220px -200px",
      height: 480,
      background: "radial-gradient(circle at 70% 40%, rgba(59,130,246,0.18), transparent 62%)",
      filter: "blur(12px)",
      pointerEvents: "none",
      opacity: isLight ? 0.4 : 1,
    },

    container: { maxWidth: 860, margin: "0 auto", position: "relative" },

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
      fontWeight: 700,
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
      border,
      background: isLight ? "rgba(255,255,255,0.7)" : "rgba(15,23,42,0.55)",
      backdropFilter: "blur(6px)",
      boxShadow: isLight ? "0 10px 30px rgba(2,6,23,0.08)" : "0 16px 40px rgba(0,0,0,0.35)",
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
    brandTitle: { fontWeight: 900, fontSize: 12, letterSpacing: 0.2 },
    brandSub: { fontSize: 11, opacity: 0.75 },

    card: {
      borderRadius: 24,
      padding: 18,
      border,
      background: isLight ? "rgba(255,255,255,0.85)" : "rgba(2,6,23,0.55)",
      backdropFilter: "blur(10px)",
      boxShadow: isLight ? "0 18px 60px rgba(2,6,23,0.10)" : "0 22px 70px rgba(0,0,0,0.42)",
    },

    h1: { margin: 0, fontSize: 28, fontWeight: 950, letterSpacing: -0.4 },
    p: { marginTop: 8, marginBottom: 0, fontSize: 14, opacity: 0.85, lineHeight: 1.5 },

    note: {
      marginTop: 12,
      padding: 12,
      borderRadius: 16,
      border: softBorder,
      background: isLight ? "rgba(2,6,23,0.03)" : "rgba(255,255,255,0.03)",
      fontSize: 13,
      fontWeight: 700,
      opacity: 0.9,
    },

    infoBox: {
      marginTop: 12,
      borderRadius: 16,
      padding: 12,
      border: "1px solid rgba(16,185,129,0.28)",
      background: isLight ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.10)",
      color: isLight ? "#064e3b" : "rgba(255,255,255,0.95)",
      fontSize: 13,
      lineHeight: 1.4,
    },

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

    plans: {
      marginTop: 16,
      display: "grid",
      gap: 12,
      gridTemplateColumns: "1fr",
    },

    planFeatured: {
      borderRadius: 20,
      padding: 14,
      border: "1px solid rgba(16,185,129,0.35)",
      background: isLight ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.10)",
      boxShadow: isLight ? "0 18px 50px rgba(16,185,129,0.10)" : "0 18px 60px rgba(0,0,0,0.30)",
    },

    plan: {
      borderRadius: 20,
      padding: 14,
      border: softBorder,
      background: isLight ? "rgba(2,6,23,0.03)" : "rgba(255,255,255,0.03)",
    },

    planHeader: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },

    planTitle: { fontWeight: 950, fontSize: 14, marginBottom: 6 },

    planPriceRow: { display: "flex", alignItems: "baseline", gap: 10 },
    planPrice: { fontSize: 34, fontWeight: 950, letterSpacing: -0.6 },
    planPer: { fontSize: 13, fontWeight: 800, opacity: 0.75 },

    planMicro: { marginTop: 6, fontSize: 12, fontWeight: 700, opacity: 0.78 },

    badgeBestValue: {
      fontSize: 12,
      fontWeight: 950,
      padding: "8px 10px",
      borderRadius: 999,
      background: isLight ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.20)",
      border: "1px solid rgba(16,185,129,0.32)",
      whiteSpace: "nowrap",
      alignSelf: "flex-start",
    },

    featureList: { margin: "12px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 8 },

    featureItem: {
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
      fontSize: 13,
      fontWeight: 700,
    },

    cta: (isFeatured, busy) => ({
      marginTop: 14,
      width: "100%",
      borderRadius: 18,
      border: 0,
      cursor: busy ? "not-allowed" : "pointer",
      padding: "12px 14px",
      fontSize: 14,
      fontWeight: 950,
      background: isFeatured
        ? busy
          ? "rgba(16,185,129,0.55)"
          : "rgba(16,185,129,0.95)"
        : busy
          ? "rgba(59,130,246,0.55)"
          : "rgba(59,130,246,0.92)",
      color: "white",
      boxShadow: isFeatured
        ? "0 12px 30px rgba(16,185,129,0.22)"
        : "0 12px 30px rgba(59,130,246,0.20)",
    }),

    finePrint: { marginTop: 12, fontSize: 12, opacity: 0.75, textAlign: "center" },
  };
}

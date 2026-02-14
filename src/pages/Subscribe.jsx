// src/pages/Subscribe.jsx
import React, { useMemo, useState } from "react";
import { useMe } from "../hooks/useMe";

export default function Subscribe({ onClose, onDone, lang = "is", theme = "dark", t, me }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);

  const initialEmail = params.get("email") || "";

  // ✅ read plan from querystring (monthly default)
  const rawPlan = (params.get("plan") || "monthly").toLowerCase();
  const plan = rawPlan === "yearly" ? "yearly" : "monthly";

  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isLight = theme === "light";

  // If route doesn't pass `me`, fetch it here.
  const { me: hookMe, refetchMe } = useMe();
  const ME = me || hookMe;
  const proActive = !!ME?.entitlements?.pro;
  const proUntil = ME?.entitlements?.proUntil || null;
  const currentPlan = ME?.subscription?.plan || null;
  const isYearly = proActive && currentPlan === "yearly";
  const isMonthly = proActive && currentPlan === "monthly";

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
      // non-JSON response
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

  // ✅ Ensure a valid session cookie exists for this email.
  async function ensureSessionForEmail(trimmedEmail) {
    const { res, json, text } = await postJson("/api/login", {
      email: trimmedEmail,
      createIfMissing: true,
    });

    if (!res.ok || !json?.ok) {
      const msg = pickErrorMessage({
        res,
        json,
        text,
        fallback: T("loginFailed", "Login failed."),
      });

      const code = json?.code ? ` (${json.code})` : "";
      throw new Error(msg + code);
    }

    return true;
  }

  // --- Checkout -------------------------------------------------------------

  async function startCheckout() {
    if (busy) return;

    const trimmed = String(email || "").trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError(T("invalidEmail", "Please enter a valid email."));
      return;
    }

    setBusy(true);
    setError("");

    try {
      // 1) Ensure session
      await ensureSessionForEmail(trimmed);

      // Refresh /api/me after login so the page can react immediately
      try {
        await refetchMe?.();
      } catch {
        // ignore
      }

      // 2) Create checkout
      let { res, json, text } = await postJson("/api/checkout", { email: trimmed, plan });

      // If we still get 401, retry login ONCE and retry checkout.
      if (res.status === 401) {
        await ensureSessionForEmail(trimmed);
        ({ res, json, text } = await postJson("/api/checkout", { email: trimmed, plan }));
      }

      if (!res.ok || !json?.ok) {
        // Rule enforcement responses
        if (res.status === 409) {
          if (json?.code === "SUB_ACTIVE_YEARLY") {
            const until = json?.proUntil ? new Date(json.proUntil).toLocaleDateString() : "";
            throw new Error(
              T(
                "subscribeAlreadyActive",
                until
                  ? `Your subscription is already active until ${until}.`
                  : "Your subscription is already active."
              )
            );
          }
          if (json?.code === "SUB_ACTIVE_MONTHLY") {
            const until = json?.proUntil ? new Date(json.proUntil).toLocaleDateString() : "";
            throw new Error(
              T(
                "subscribeAlreadyMonthly",
                until
                  ? `You already have an active monthly subscription until ${until}.`
                  : "You already have an active monthly subscription."
              )
            );
          }
        }

        const msg = pickErrorMessage({
          res,
          json,
          text,
          fallback: T("subscribeSomethingWentWrong", "Something went wrong."),
        });

        if (res.status === 401) {
          throw new Error(T("notLoggedIn", "Not logged in."));
        }

        throw new Error(msg);
      }

      if (!json?.url) {
        // Monthly -> Yearly upgrade returns { ok:true, upgraded:true } (no checkout URL)
        if (json?.upgraded) {
          window.location.assign("/?checkout=success&upgrade=1");
          return;
        }
        throw new Error(T("subscribeMissingCheckoutUrl", "Missing checkout URL."));
      }

      // Redirect to Paddle checkout
      window.location.assign(json.url);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  const styles = getStyles(isLight);

  const features = [
    {
      icon: "✨",
      title: T("subscribeFeatureUnlockedTitle", "All Pro features unlocked"),
      desc: T("subscribeFeatureUnlockedDesc", "Full access to Pro features in the app."),
    },
    {
      icon: "📈",
      title: T("subscribeFeatureOverviewTitle", "Better overview & scoring"),
      desc: T("subscribeFeatureOverviewDesc", "Clearer guidance for weather-based decisions."),
    },
    {
      icon: "🧠",
      title: T("subscribeFeatureAccuracyTitle", "More accuracy & calculations"),
      desc: T("subscribeFeatureAccuracyDesc", "Extra calculations where it matters."),
    },
    {
      icon: "🤝",
      title: T("subscribeFeatureSupportTitle", "Supports ongoing development"),
      desc: T("subscribeFeatureSupportDesc", "Your purchase helps us keep improving CampCast."),
    },
  ];

  const trustBadges = [
    { icon: "🔒", text: T("subscribeBadgeSecure", "Secure checkout via Paddle") },
    { icon: "↩️", text: T("subscribeBadgeCancel", "Cancel anytime") },
    { icon: "✅", text: T("subscribeBadgeInstant", "Pro activates instantly") },
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
            {T("subscribeBack", "← Back")}
          </button>

          <div style={styles.brandPill} title={T("subscribeBrandTitle", "CampCast Pro")}>
            <div style={styles.brandLogoWrap}>
              <img
                src="/logo.png"
                alt={T("subscribeBrandAlt", "CampCast")}
                style={styles.brandLogo}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <div style={styles.brandTitle}>{T("subscribeBrandTitle", "CampCast Pro")}</div>
              <div style={styles.brandSub}>{T("subscribeBrandSub", "Follow the weather")}</div>
            </div>
          </div>
        </div>

        {/* Main card */}
        <div style={styles.card}>
          <h1 style={styles.h1}>{T("subscribeTitle", "Activate Pro access")}</h1>
          <p style={styles.p}>{T("subscribeLead", "You’ll complete payment with Paddle.")}</p>

          {isYearly ? (
            <div style={styles.infoBox}>
              <div style={{ fontWeight: 900, marginBottom: 4 }}>
                {T("pricingYearlyActive", "Subscription active")}
              </div>
              <div>
                {T("subscribeAlreadyActive", "Your subscription is already active.")}
                {proUntil ? (
                  <>
                    <br />
                    {T("pricingActiveUntil", "Active until")}{" "}
                    {new Date(proUntil).toLocaleDateString()}
                  </>
                ) : null}
                <br />
                {T("pricingMonthlyNotAvailable", "Yearly customers cannot downgrade to monthly.")}
              </div>
            </div>
          ) : null}

          <div style={styles.badgesRow}>
            {trustBadges.map((b) => (
              <div key={b.text} style={styles.badge}>
                <span aria-hidden>{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>

          {/* Email input */}
          <div style={styles.form}>
            <label style={styles.label}>
              {T("subscribeEmailLabel", "Email")}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={T("subscribeEmailPlaceholder", "name@domain.com")}
                style={styles.input}
                autoFocus
              />
              <div style={styles.help}>
                {T("subscribeEmailHelp", "We use your email for receipts.")}
              </div>
            </label>

            {error ? (
              <div style={styles.errorBox}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {T("subscribeOopsTitle", "Oops!")}
                </div>
                <div>{error}</div>
              </div>
            ) : null}

            <button
              type="button"
              style={styles.cta(busy)}
              onClick={startCheckout}
              disabled={busy || isYearly || (isMonthly && plan === "monthly")}
            >
              {busy
                ? T("subscribeCtaBusy", "Opening checkout…")
                : T("subscribeCtaMain", "Continue to checkout")}
              <div style={styles.ctaSub}>{T("subscribeCtaSub", "You can cancel later.")}</div>
            </button>

            <div style={styles.finePrint}>
              {T("subscribeFinePrint", "Payment is handled via Paddle.")}
            </div>

            <button
              type="button"
              style={styles.secondary}
              onClick={() => (onDone ? onDone() : window.history.back())}
            >
              {T("subscribeSecondary", "Back")}
            </button>

            <div style={styles.footer}>{T("subscribeFooter", "Questions? Email us.")}</div>
          </div>

          {/* Features */}
          <div style={styles.features}>
            <div style={styles.featuresTitle}>
              {T("subscribeSectionTitle", "What you get with Pro")}
            </div>

            <div style={styles.featuresGrid}>
              {features.map((f) => (
                <div key={f.title} style={styles.featureCard}>
                  <div style={styles.featureIcon} aria-hidden>
                    {f.icon}
                  </div>
                  <div>
                    <div style={styles.featureTitle}>{f.title}</div>
                    <div style={styles.featureDesc}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
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
      border: isLight ? "1px solid rgba(2,6,23,0.12)" : "1px solid rgba(255,255,255,0.12)",
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
      border: isLight ? "1px solid rgba(2,6,23,0.10)" : "1px solid rgba(255,255,255,0.12)",
      background: isLight ? "rgba(255,255,255,0.85)" : "rgba(2,6,23,0.55)",
      backdropFilter: "blur(10px)",
      boxShadow: isLight ? "0 18px 60px rgba(2,6,23,0.10)" : "0 22px 70px rgba(0,0,0,0.42)",
    },
    h1: { margin: 0, fontSize: 28, fontWeight: 950, letterSpacing: -0.4 },
    p: { marginTop: 8, marginBottom: 0, fontSize: 14, opacity: 0.85, lineHeight: 1.5 },

    badgesRow: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 },
    badge: {
      display: "inline-flex",
      gap: 8,
      alignItems: "center",
      fontSize: 12,
      padding: "8px 10px",
      borderRadius: 999,
      border: isLight ? "1px solid rgba(2,6,23,0.10)" : "1px solid rgba(255,255,255,0.10)",
      background: isLight ? "rgba(2,6,23,0.04)" : "rgba(255,255,255,0.04)",
    },

    form: { marginTop: 16 },
    label: { display: "grid", gap: 8, fontSize: 13, fontWeight: 800 },

    input: {
      height: 44,
      borderRadius: 14,
      border: isLight ? "1px solid rgba(2,6,23,0.14)" : "1px solid rgba(255,255,255,0.14)",
      background: isLight ? "white" : "rgba(2,6,23,0.6)",
      color: isLight ? "#0B1220" : "white",
      padding: "0 14px",
      outline: "none",
      fontSize: 14,
    },

    help: { fontSize: 12, opacity: 0.75, fontWeight: 600 },

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

    cta: (busy) => ({
      marginTop: 14,
      width: "100%",
      borderRadius: 18,
      border: 0,
      cursor: busy ? "not-allowed" : "pointer",
      padding: "12px 14px",
      fontSize: 14,
      fontWeight: 900,
      background: busy ? "rgba(16,185,129,0.55)" : "rgba(16,185,129,0.95)",
      color: "white",
      boxShadow: "0 12px 30px rgba(16,185,129,0.22)",
      display: "grid",
      gap: 4,
      textAlign: "center",
      opacity: busy ? 0.85 : 1,
    }),

    ctaSub: { fontSize: 12, fontWeight: 700, opacity: 0.9 },
    finePrint: { marginTop: 10, fontSize: 12, opacity: 0.75, textAlign: "center" },

    secondary: {
      marginTop: 10,
      width: "100%",
      borderRadius: 16,
      border: isLight ? "1px solid rgba(2,6,23,0.12)" : "1px solid rgba(255,255,255,0.12)",
      background: "transparent",
      color: isLight ? "#0B1220" : "rgba(255,255,255,0.9)",
      padding: "10px 12px",
      fontSize: 13,
      fontWeight: 800,
      cursor: "pointer",
    },

    footer: { marginTop: 12, fontSize: 12, opacity: 0.75, textAlign: "center" },

    features: { marginTop: 18 },
    featuresTitle: { fontWeight: 950, marginBottom: 10, fontSize: 14 },
    featuresGrid: { display: "grid", gap: 10, gridTemplateColumns: "1fr" },

    featureCard: {
      display: "flex",
      gap: 12,
      padding: 12,
      borderRadius: 18,
      border: isLight ? "1px solid rgba(2,6,23,0.10)" : "1px solid rgba(255,255,255,0.10)",
      background: isLight ? "rgba(2,6,23,0.03)" : "rgba(255,255,255,0.03)",
    },

    featureIcon: {
      width: 38,
      height: 38,
      borderRadius: 14,
      display: "grid",
      placeItems: "center",
      background: isLight ? "rgba(2,6,23,0.05)" : "rgba(255,255,255,0.06)",
      flex: "0 0 auto",
      fontSize: 18,
    },

    featureTitle: { fontWeight: 900, fontSize: 13, marginBottom: 2 },
    featureDesc: { fontSize: 12, opacity: 0.78, lineHeight: 1.35 },
  };
}

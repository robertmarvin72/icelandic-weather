// src/pages/Subscribe.jsx
import React, { useMemo, useState } from "react";

export default function Subscribe({ onClose, onDone, lang = "is", theme = "dark", t }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialEmail = params.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [logoOk, setLogoOk] = useState(true);

  const isLight = theme === "light";

  // Tiny helper: use translation function if provided, otherwise fallback text.
  const T = (key, fallback) => {
    if (typeof t === "function") {
      const v = t(key);
      return v == null ? fallback : v;
    }
    return fallback;
  };

  const copy = useMemo(() => {
    const isEN = lang === "en";
    return {
      back: isEN ? "Back" : "← Til baka",
      brandTitle: "CampCast Pro",
      brandSub: isEN ? "Follow the weather" : "Eltum veðrið",

      h1: isEN ? "Activate Pro access" : "Virkjaðu Pro aðgang",
      lead: isEN
        ? "No drama — just better weather decisions. You’ll complete payment with Paddle."
        : "Engin dramatík — bara betri veðurákvarðanir. Þú ferð í greiðslu hjá Paddle.",
      leadPaddle: "Paddle",

      badges: [
        {
          icon: "🔒",
          text: isEN ? "Secure checkout via Paddle" : "Örugg greiðsla í gegnum Paddle",
        },
        { icon: "↩️", text: isEN ? "Cancel anytime" : "Hætta hvenær sem er" },
        { icon: "✅", text: isEN ? "Pro activates instantly" : "Pro virkjast samstundis" },
      ],

      emailLabel: isEN ? "Email" : "Netfang",
      emailPlaceholder: isEN ? "name@domain.com" : "nafn@domain.com",
      emailHelp: isEN
        ? "We use your email to link your subscription and send receipts."
        : "Við notum netfangið til að tengja áskriftina og senda kvittun.",

      sectionTitle: isEN ? "What you get with Pro" : "Hvað færðu með Pro",
      features: [
        {
          icon: "✨",
          title: isEN ? "All Pro features unlocked" : "Allir Pro fídusar opnast",
          desc: isEN
            ? "Full access to Pro features in the app."
            : "Fáðu fullan aðgang að Pro virkni í appinu.",
        },
        {
          icon: "📊",
          title: isEN ? "Better overview & scoring" : "Betri yfirsýn og skor",
          desc: isEN
            ? "Clearer guidance for weather-based decisions."
            : "Skýrari leið til að taka veðurákvarðanir.",
        },
        {
          icon: "🧠",
          title: isEN ? "More accuracy & calculations" : "Meiri nákvæmni og útreikningar",
          desc: isEN
            ? "Extra calculations where it matters."
            : "Viðbótar-útreikningar þar sem það á við.",
        },
        {
          icon: "🛠️",
          title: isEN ? "Supports ongoing development" : "Styður áframhaldandi þróun",
          desc: isEN
            ? "Your purchase helps us keep improving CampCast."
            : "Kaupin hjálpa okkur að bæta CampCast stöðugt.",
        },
      ],

      ctaMain: isEN ? "Continue to checkout" : "Halda áfram í greiðslu",
      ctaBusy: isEN ? "Opening checkout..." : "Opna greiðslusíðu...",
      ctaSub: isEN
        ? "You can cancel later (billing portal coming soon)."
        : "Þú getur alltaf hætt áskrift síðar (billing portal kemur bráðlega).",

      finePrint: isEN
        ? "By continuing, you agree the payment is handled via Paddle."
        : "Með því að halda áfram samþykkir þú að greiðslan fari fram í gegnum Paddle.",

      secondary: isEN ? "Back" : "Til baka",

      footer: isEN
        ? "Questions? Send us a message and we’ll sort it."
        : "Spurningar? Sendu okkur skilaboð og við reddum þessu.",

      invalidEmail: isEN ? "Please enter a valid email." : "Vinsamlegast sláðu inn gilt netfang.",
      missingCheckoutUrl: isEN
        ? "Missing checkout URL from /api/checkout."
        : "Vantar checkout URL frá /api/checkout.",
      loginFailed: (status) => (isEN ? `Login failed (${status})` : `Login failed (${status})`),
      upsTitle: isEN ? "Oops!" : "Úps!",
    };
  }, [lang]);

  async function startCheckout() {
    setErr("");
    if (!email || !email.includes("@")) {
      setErr(copy.invalidEmail);
      return;
    }

    setBusy(true);
    try {
      // 1) Create user + session if missing
      const r1 = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, createIfMissing: true }),
      });

      const j1 = await r1.json().catch(() => ({}));
      if (!r1.ok || j1?.ok === false) {
        throw new Error(j1?.message || j1?.code || copy.loginFailed(r1.status));
      }

      // 2) Kick off hosted checkout (campcast-pay handles it)
      const r2 = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: "pro" }),
      });

      const j2 = await r2.json().catch(() => ({}));
      const url = j2?.url || j2?.checkoutUrl;
      if (!url) throw new Error(copy.missingCheckoutUrl);

      window.location.href = url;
    } catch (e) {
      setErr(e?.message || (lang === "en" ? "Something went wrong." : "Eitthvað fór úrskeiðis."));
      setBusy(false);
    }
  }

  const styles = getStyles(isLight);

  return (
    <div style={styles.page}>
      {/* soft background glow */}
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

      <div style={styles.container}>
        {/* top bar */}
        <div style={styles.topBar}>
          <button
            onClick={() => (onClose ? onClose() : window.history.back())}
            style={styles.backLink}
            type="button"
          >
            {copy.back}
          </button>

          {/* Brand pill (logo + text) */}
          <div style={styles.brandPill} title={copy.brandTitle}>
            <div style={styles.brandLogoWrap}>
              {logoOk ? (
                <img
                  src="/logo.png"
                  alt="CampCast"
                  style={styles.brandLogo}
                  onError={() => setLogoOk(false)}
                />
              ) : null}
            </div>

            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <div style={styles.brandTitle}>{copy.brandTitle}</div>
              <div style={styles.brandSub}>{copy.brandSub}</div>
            </div>
          </div>
        </div>

        {/* card */}
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.h1}>{copy.h1}</h1>
            <p style={styles.p}>
              {copy.lead} <span style={{ fontWeight: 800 }}>{copy.leadPaddle}</span>.
            </p>

            <div style={styles.badgesRow}>
              {copy.badges.map((b) => (
                <div key={b.text} style={styles.badge}>
                  <span aria-hidden>{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* email input */}
          <div style={{ marginTop: 16 }}>
            <label style={styles.label}>{copy.emailLabel}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={copy.emailPlaceholder}
              inputMode="email"
              autoComplete="email"
              style={{
                ...styles.input,
                borderColor: err
                  ? "rgba(255, 129, 129, 0.6)"
                  : isLight
                    ? "rgba(15,23,42,0.12)"
                    : "rgba(255,255,255,0.14)",
              }}
            />
            <div style={styles.helper}>{copy.emailHelp}</div>
          </div>

          {/* features grid */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>{copy.sectionTitle}</div>

            <div style={styles.grid}>
              {copy.features.map((f) => (
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

          {/* error */}
          {err ? (
            <div style={styles.errorBox} role="alert" aria-live="polite">
              <div style={{ fontWeight: 900, marginBottom: 4 }}>{copy.upsTitle}</div>
              <div style={{ opacity: 0.95 }}>{err}</div>
            </div>
          ) : null}

          {/* CTA */}
          <button
            onClick={startCheckout}
            disabled={busy}
            type="button"
            style={{
              ...styles.cta,
              opacity: busy ? 0.75 : 1,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden>{busy ? "⏳" : "✨"}</span>
              <span>{busy ? copy.ctaBusy : copy.ctaMain}</span>
              <span style={{ opacity: 0.9 }} aria-hidden>
                →
              </span>
            </span>

            <span style={styles.ctaSub}>{copy.ctaSub}</span>
          </button>

          <div style={styles.finePrint}>{copy.finePrint}</div>

          {/* secondary */}
          <button
            onClick={() => (onClose ? onClose() : window.history.back())}
            type="button"
            style={styles.secondary}
          >
            {copy.secondary}
          </button>
        </div>

        {/* footer */}
        <div style={styles.footer}>{copy.footer}</div>
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

    container: {
      maxWidth: 780,
      margin: "0 auto",
      position: "relative",
    },

    topBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 14,
    },

    backLink: {
      background: "transparent",
      border: "none",
      color: isLight ? "rgba(11,18,32,0.72)" : "rgba(255,255,255,0.78)",
      fontSize: 14,
      cursor: "pointer",
      padding: "8px 10px",
      borderRadius: 12,
    },

    // Brand pill (logo + text)
    brandPill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 12px",
      borderRadius: 999,
      background: isLight ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.06)",
      border: isLight ? "1px solid rgba(15,23,42,0.10)" : "1px solid rgba(255,255,255,0.12)",
      boxShadow: isLight ? "0 10px 25px rgba(2,6,23,0.10)" : "0 14px 30px rgba(0,0,0,0.35)",
      backdropFilter: "blur(10px)",
    },

    brandLogoWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: "rgba(255,255,255,0.95)", // bigger white area so text in logo won't get cramped
      display: "grid",
      placeItems: "center",
      padding: 6,
      boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.10)",
      overflow: "visible",
      flex: "0 0 auto",
    },

    brandLogo: {
      width: 34,
      height: 34,
      objectFit: "contain",
      display: "block",
    },

    brandTitle: {
      fontWeight: 900,
      fontSize: 14,
      lineHeight: 1.1,
      color: isLight ? "#0B1220" : "white",
    },
    brandSub: {
      fontSize: 12,
      opacity: 0.72,
      color: isLight ? "rgba(11,18,32,0.85)" : "rgba(255,255,255,0.8)",
    },

    card: {
      borderRadius: 24,
      border: isLight ? "1px solid rgba(15,23,42,0.10)" : "1px solid rgba(255,255,255,0.10)",
      background: isLight ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.06)",
      boxShadow: isLight ? "0 18px 60px rgba(2,6,23,0.12)" : "0 18px 60px rgba(0,0,0,0.45)",
      backdropFilter: "blur(10px)",
      padding: 18,
    },

    header: { padding: "8px 6px 0px 6px" },
    h1: { fontSize: 28, fontWeight: 950, margin: "0 0 8px 0", letterSpacing: "-0.02em" },
    p: { margin: 0, opacity: 0.84, lineHeight: 1.5 },

    badgesRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 14,
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      padding: "8px 10px",
      borderRadius: 999,
      background: isLight ? "rgba(15,23,42,0.05)" : "rgba(255,255,255,0.07)",
      border: isLight ? "1px solid rgba(15,23,42,0.08)" : "1px solid rgba(255,255,255,0.10)",
      color: isLight ? "rgba(11,18,32,0.85)" : "rgba(255,255,255,0.88)",
    },

    label: { display: "block", marginBottom: 8, fontWeight: 900, opacity: 0.92 },

    input: {
      width: "100%",
      padding: "13px 14px",
      borderRadius: 16,
      border: isLight ? "1px solid rgba(15,23,42,0.12)" : "1px solid rgba(255,255,255,0.14)",
      background: isLight ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.22)",
      color: isLight ? "#0B1220" : "white",
      outline: "none",
    },

    helper: { marginTop: 8, fontSize: 12, opacity: 0.7 },

    section: { marginTop: 18 },
    sectionTitle: { fontWeight: 950, marginBottom: 10, fontSize: 14, letterSpacing: "0.01em" },

    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
      gap: 10,
    },

    featureCard: {
      display: "flex",
      gap: 12,
      padding: 14,
      borderRadius: 18,
      background: isLight ? "rgba(15,23,42,0.03)" : "rgba(0,0,0,0.18)",
      border: isLight ? "1px solid rgba(15,23,42,0.08)" : "1px solid rgba(255,255,255,0.10)",
    },

    featureIcon: {
      width: 36,
      height: 36,
      borderRadius: 14,
      display: "grid",
      placeItems: "center",
      background: "rgba(16,185,129,0.14)",
      border: "1px solid rgba(16,185,129,0.22)",
      flex: "0 0 auto",
    },

    featureTitle: { fontWeight: 950, marginBottom: 3 },
    featureDesc: { fontSize: 12, opacity: 0.78, lineHeight: 1.4 },

    errorBox: {
      marginTop: 14,
      padding: 12,
      borderRadius: 16,
      background: "rgba(255, 107, 107, 0.12)",
      border: "1px solid rgba(255, 107, 107, 0.28)",
      color: isLight ? "#0B1220" : "rgba(255,255,255,0.92)",
    },

    cta: {
      width: "100%",
      marginTop: 16,
      padding: "14px 16px",
      borderRadius: 18,
      border: "1px solid rgba(16,185,129,0.35)",
      background: "linear-gradient(180deg, rgba(16,185,129,0.95), rgba(16,185,129,0.70))",
      color: "white",
      fontWeight: 950,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      boxShadow: "0 14px 30px rgba(16,185,129,0.22)",
    },

    ctaSub: { fontSize: 12, fontWeight: 700, opacity: 0.9 },

    finePrint: { marginTop: 10, textAlign: "center", fontSize: 12, opacity: 0.72 },

    secondary: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: 18,
      marginTop: 10,
      background: "transparent",
      border: isLight ? "1px solid rgba(15,23,42,0.16)" : "1px solid rgba(255,255,255,0.16)",
      color: isLight ? "rgba(11,18,32,0.9)" : "rgba(255,255,255,0.92)",
      cursor: "pointer",
      fontWeight: 850,
    },

    footer: { marginTop: 14, textAlign: "center", fontSize: 12, opacity: 0.72 },
  };
}

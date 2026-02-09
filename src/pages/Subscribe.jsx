// src/pages/Subscribe.jsx
import React, { useMemo, useState } from "react";

function getLs(key, fallback = "") {
  try {
    const v = window?.localStorage?.getItem?.(key);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export default function Subscribe({ onClose }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialEmail = params.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [logoOk, setLogoOk] = useState(true);

  // ✅ Read app state from localStorage
  const lang = (getLs("lang", "is") || "is").toLowerCase() === "en" ? "en" : "is";
  const theme = (getLs("theme", "dark") || "dark").toLowerCase() === "light" ? "light" : "dark";

  // ✅ Minimal text-map (can be moved to translations later)
  const copy = useMemo(() => {
    const is = {
      back: "← Til baka",
      brandTitle: "CampCast Pro",
      brandSub: "Eltum veðrið",

      h1: "Virkjaðu Pro aðgang",
      intro: "Engin dramatík — bara betri veðurákvarðanir. Þú ferð í greiðslu hjá ",
      introStrong: "Paddle",

      badge1: "Örugg greiðsla í gegnum Paddle",
      badge2: "Hætta hvenær sem er",
      badge3: "Pro virkjast samstundis",

      emailLabel: "Netfang",
      emailPh: "nafn@domain.com",
      emailHelper: "Við notum netfangið til að tengja áskriftina og senda kvittun.",

      sectionTitle: "Hvað færðu með Pro",
      f1t: "Allir Pro fídusar opnast",
      f1d: "Fáðu fullan aðgang að Pro virkni í appinu.",
      f2t: "Betri yfirsýn og skor",
      f2d: "Skýrari leið til að taka veðurákvarðanir.",
      f3t: "Meiri nákvæmni og útreikningar",
      f3d: "Viðbótar-útreikningar þar sem það á við.",
      f4t: "Styður áframhaldandi þróun",
      f4d: "Kaupin hjálpa okkur að bæta CampCast stöðugt.",

      errTitle: "Úps!",
      invalidEmail: "Vinsamlegast sláðu inn gilt netfang.",

      ctaIdle: "Halda áfram í greiðslu",
      ctaBusy: "Opna greiðslusíðu...",
      ctaSub: "Þú getur alltaf hætt áskrift síðar (billing portal kemur bráðlega).",

      finePrint: "Með því að halda áfram samþykkir þú að greiðslan fari fram í gegnum Paddle.",
      secondary: "Til baka",
      footer: "Spurningar? Sendu okkur skilaboð og við reddum þessu.",
    };

    const en = {
      back: "← Back",
      brandTitle: "CampCast Pro",
      brandSub: "Follow the weather",

      h1: "Activate Pro",
      intro: "No drama — just better weather decisions. You’ll complete payment with ",
      introStrong: "Paddle",

      badge1: "Secure payment via Paddle",
      badge2: "Cancel anytime",
      badge3: "Pro activates instantly",

      emailLabel: "Email",
      emailPh: "name@domain.com",
      emailHelper: "We use your email to link your subscription and send your receipt.",

      sectionTitle: "What you get with Pro",
      f1t: "All Pro features unlocked",
      f1d: "Get full access to Pro features in the app.",
      f2t: "Better overview & scoring",
      f2d: "A clearer way to make weather decisions.",
      f3t: "More accuracy & calculations",
      f3d: "Extra calculations where it makes sense.",
      f4t: "Supports ongoing development",
      f4d: "Your purchase helps us improve CampCast continuously.",

      errTitle: "Oops!",
      invalidEmail: "Please enter a valid email address.",

      ctaIdle: "Continue to payment",
      ctaBusy: "Opening payment page...",
      ctaSub: "You can cancel anytime later (billing portal coming soon).",

      finePrint: "By continuing you agree that payment is processed via Paddle.",
      secondary: "Back",
      footer: "Questions? Send us a message and we’ll help you out.",
    };

    return lang === "en" ? en : is;
  }, [lang]);

  const trustBadges = [
    { icon: "🔒", text: copy.badge1 },
    { icon: "↩️", text: copy.badge2 },
    { icon: "✅", text: copy.badge3 },
  ];

  const features = [
    { icon: "✨", title: copy.f1t, desc: copy.f1d },
    { icon: "📊", title: copy.f2t, desc: copy.f2d },
    { icon: "🧠", title: copy.f3t, desc: copy.f3d },
    { icon: "🛠️", title: copy.f4t, desc: copy.f4d },
  ];

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
        throw new Error(j1?.message || j1?.code || `Login failed (${r1.status})`);
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
      if (!url) throw new Error("Missing checkout URL from /api/checkout.");

      window.location.href = url;
    } catch (e) {
      setErr(e?.message || "Something went wrong.");
      setBusy(false);
    }
  }

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <div style={styles.page}>
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

      <div style={styles.container}>
        <div style={styles.topBar}>
          <button
            onClick={() => (onClose ? onClose() : window.history.back())}
            style={styles.backLink}
            type="button"
          >
            {copy.back}
          </button>

          {/* ✅ Brand pill with safer logo padding so text isn't cut */}
          <div style={styles.brandPill}>
            <div style={styles.logoWrap}>
              {logoOk ? (
                <img
                  src="/logo.png"
                  alt="CampCast"
                  style={styles.logoImg}
                  onError={() => setLogoOk(false)}
                />
              ) : (
                <span style={{ fontSize: 18 }} aria-hidden>
                  ☀️
                </span>
              )}
            </div>

            <div>
              <div style={styles.brandTitle}>{copy.brandTitle}</div>
              <div style={styles.brandSub}>{copy.brandSub}</div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.h1}>{copy.h1}</h1>
            <p style={styles.p}>
              {copy.intro}
              <span style={{ fontWeight: 900 }}>{copy.introStrong}</span>.
            </p>

            <div style={styles.badgesRow}>
              {trustBadges.map((b) => (
                <div key={b.text} style={styles.badge}>
                  <span aria-hidden>{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={styles.label}>{copy.emailLabel}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={copy.emailPh}
              inputMode="email"
              autoComplete="email"
              style={{
                ...styles.input,
                borderColor: err ? "rgba(255, 129, 129, 0.6)" : styles.inputBorder,
              }}
            />
            <div style={styles.helper}>{copy.emailHelper}</div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>{copy.sectionTitle}</div>

            <div style={styles.grid}>
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

          {err ? (
            <div style={styles.errorBox} role="alert" aria-live="polite">
              <div style={{ fontWeight: 950, marginBottom: 4 }}>{copy.errTitle}</div>
              <div style={{ opacity: 0.95 }}>{err}</div>
            </div>
          ) : null}

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
              <span>{busy ? copy.ctaBusy : copy.ctaIdle}</span>
              <span style={{ opacity: 0.9 }} aria-hidden>
                →
              </span>
            </span>
            <span style={styles.ctaSub}>{copy.ctaSub}</span>
          </button>

          <div style={styles.finePrint}>{copy.finePrint}</div>

          <button
            onClick={() => (onClose ? onClose() : window.history.back())}
            type="button"
            style={styles.secondary}
          >
            {copy.secondary}
          </button>
        </div>

        <div style={styles.footer}>{copy.footer}</div>
      </div>
    </div>
  );
}

function makeStyles(theme) {
  const isLight = theme === "light";

  // Light mode = clean + soft glow
  const pageBg = isLight
    ? "radial-gradient(1000px 600px at 15% 10%, rgba(16,185,129,0.14), transparent 55%), radial-gradient(900px 600px at 85% 80%, rgba(59,130,246,0.10), transparent 55%), linear-gradient(180deg, #F7FAFC 0%, #F3F6FB 100%)"
    : "radial-gradient(1200px 700px at 20% 10%, rgba(16,185,129,0.18), transparent 55%), radial-gradient(900px 600px at 85% 80%, rgba(59,130,246,0.12), transparent 55%), linear-gradient(180deg, #060A12 0%, #060A12 100%)";

  const cardBg = isLight ? "rgba(255,255,255,0.74)" : "rgba(255,255,255,0.06)";
  const cardBorder = isLight ? "rgba(15, 23, 42, 0.10)" : "rgba(255,255,255,0.10)";
  const text = isLight ? "#0B1220" : "white";
  const muted = isLight ? "rgba(11, 18, 32, 0.70)" : "rgba(255,255,255,0.78)";

  const inputBg = isLight ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.22)";
  const inputBorder = isLight ? "rgba(15, 23, 42, 0.14)" : "rgba(255,255,255,0.14)";
  const featureBg = isLight ? "rgba(2, 6, 23, 0.04)" : "rgba(0,0,0,0.18)";
  const badgeBg = isLight ? "rgba(2, 6, 23, 0.04)" : "rgba(255,255,255,0.07)";

  return {
    page: {
      minHeight: "100vh",
      padding: "28px 16px",
      color: text,
      background: pageBg,
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
      opacity: isLight ? 0.6 : 1,
    },
    glowBottom: {
      position: "absolute",
      inset: "auto -200px -220px -200px",
      height: 480,
      background: "radial-gradient(circle at 70% 40%, rgba(59,130,246,0.18), transparent 62%)",
      filter: "blur(12px)",
      pointerEvents: "none",
      opacity: isLight ? 0.55 : 1,
    },

    container: { maxWidth: 780, margin: "0 auto", position: "relative" },

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
      color: muted,
      fontSize: 14,
      cursor: "pointer",
      padding: "8px 10px",
      borderRadius: 12,
    },

    // ✅ Brand pill
    brandPill: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 10px",
      borderRadius: 999,
      background: isLight ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.07)",
      border: `1px solid ${isLight ? "rgba(15,23,42,0.10)" : "rgba(255,255,255,0.12)"}`,
      boxShadow: isLight ? "0 10px 30px rgba(2,6,23,0.10)" : "0 12px 30px rgba(0,0,0,0.30)",
      backdropFilter: "blur(10px)",
    },

    // ✅ This is the fix: give the logo a bigger white "safe area"
    logoWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: "rgba(255,255,255,0.92)",
      border: `1px solid ${isLight ? "rgba(15,23,42,0.12)" : "rgba(255,255,255,0.16)"}`,
      display: "grid",
      placeItems: "center",
      padding: 6, // ← increases the white area (prevents text cut)
      overflow: "hidden",
      flex: "0 0 auto",
    },
    logoImg: {
      width: "100%",
      height: "100%",
      objectFit: "contain", // ← ensures logo fits without cropping
      display: "block",
      borderRadius: 10,
    },

    brandTitle: { fontWeight: 950, fontSize: 14, lineHeight: 1.1 },
    brandSub: { fontSize: 12, opacity: isLight ? 0.75 : 0.72 },

    card: {
      borderRadius: 24,
      border: `1px solid ${cardBorder}`,
      background: cardBg,
      boxShadow: isLight ? "0 18px 60px rgba(2,6,23,0.10)" : "0 18px 60px rgba(0,0,0,0.45)",
      backdropFilter: "blur(10px)",
      padding: 18,
    },
    header: { padding: "8px 6px 0px 6px" },
    h1: { fontSize: 28, fontWeight: 980, margin: "0 0 8px 0", letterSpacing: "-0.02em" },
    p: { margin: 0, opacity: isLight ? 0.82 : 0.84, lineHeight: 1.5 },

    badgesRow: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      padding: "8px 10px",
      borderRadius: 999,
      background: badgeBg,
      border: `1px solid ${isLight ? "rgba(15,23,42,0.10)" : "rgba(255,255,255,0.10)"}`,
      color: isLight ? "rgba(11,18,32,0.86)" : "rgba(255,255,255,0.88)",
    },

    label: { display: "block", marginBottom: 8, fontWeight: 900, opacity: isLight ? 0.9 : 0.92 },
    input: {
      width: "100%",
      padding: "13px 14px",
      borderRadius: 16,
      border: `1px solid ${inputBorder}`,
      background: inputBg,
      color: text,
      outline: "none",
    },
    inputBorder,
    helper: { marginTop: 8, fontSize: 12, color: muted },

    section: { marginTop: 18 },
    sectionTitle: { fontWeight: 950, marginBottom: 10, fontSize: 14, letterSpacing: "0.01em" },
    grid: { display: "grid", gridTemplateColumns: "repeat(1, minmax(0, 1fr))", gap: 10 },

    featureCard: {
      display: "flex",
      gap: 12,
      padding: 14,
      borderRadius: 18,
      background: featureBg,
      border: `1px solid ${isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.10)"}`,
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
    featureDesc: { fontSize: 12, opacity: isLight ? 0.78 : 0.78, lineHeight: 1.4 },

    errorBox: {
      marginTop: 14,
      padding: 12,
      borderRadius: 16,
      background: "rgba(255, 107, 107, 0.12)",
      border: "1px solid rgba(255, 107, 107, 0.28)",
      color: isLight ? "rgba(11,18,32,0.92)" : "rgba(255,255,255,0.92)",
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
    ctaSub: { fontSize: 12, fontWeight: 750, opacity: 0.95 },

    finePrint: { marginTop: 10, textAlign: "center", fontSize: 12, color: muted },

    secondary: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: 18,
      marginTop: 10,
      background: "transparent",
      border: `1px solid ${isLight ? "rgba(15,23,42,0.14)" : "rgba(255,255,255,0.16)"}`,
      color: isLight ? "rgba(11,18,32,0.92)" : "rgba(255,255,255,0.92)",
      cursor: "pointer",
      fontWeight: 850,
    },

    footer: { marginTop: 14, textAlign: "center", fontSize: 12, color: muted },
  };
}

// src/pages/Success.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function Success({ lang = "is", theme = "dark", t }) {
  const [status, setStatus] = useState("checking"); // checking | active | pending
  const [logoOk, setLogoOk] = useState(true);

  const isLight = theme === "light";

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
      back: isEN ? "Back to CampCast" : "Fara í CampCast",
      title: isEN ? "Thanks!" : "Takk fyrir!",
      subtitleActive: isEN
        ? "Your CampCast Pro access is now active."
        : "CampCast Pro aðgangur hefur verið virkjaður.",
      subtitlePending: isEN
        ? "Payment received. Pro usually activates instantly — give it a moment."
        : "Greiðsla móttekin. Aðgangur virkjast yfirleitt strax — gefðu þessu smá stund.",
      checking: isEN ? "Verifying your Pro access…" : "Staðfesti Pro aðgang…",
      fine: isEN
        ? "You’ll be able to manage your subscription in settings (billing portal coming soon)."
        : "Þú getur alltaf stjórnað áskriftinni í stillingum (billing portal kemur bráðlega).",
      badge1: isEN ? "Secure payment via Paddle" : "Örugg greiðsla í gegnum Paddle",
      badge2: isEN ? "Pro activates instantly" : "Pro virkjast samstundis",
      badge3: isEN ? "Cancel anytime" : "Hætta hvenær sem er",
      pillTitle: "CampCast Pro",
      pillSub: isEN ? "Follow the weather" : "Eltum veðrið",
    };
  }, [lang]);

  useEffect(() => {
    let alive = true;

    async function checkMe() {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const json = await res.json().catch(() => null);

        if (!alive) return;

        if (res.ok && json?.entitlements?.pro) setStatus("active");
        else setStatus("pending");
      } catch {
        if (!alive) return;
        setStatus("pending");
      }
    }

    checkMe();
    return () => {
      alive = false;
    };
  }, []);

  const styles = getStyles(isLight);

  const trustBadges = [
    { icon: "🔒", text: copy.badge1 },
    { icon: "✅", text: copy.badge2 },
    { icon: "↩️", text: copy.badge3 },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

      <div style={styles.container}>
        {/* top bar */}
        <div style={styles.topBar}>
          <Link to="/" style={styles.backLink}>
            ← {copy.back}
          </Link>

          {/* Brand pill */}
          <div style={styles.brandPill} title={copy.pillTitle}>
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
              <div style={styles.brandTitle}>{copy.pillTitle}</div>
              <div style={styles.brandSub}>{copy.pillSub}</div>
            </div>
          </div>
        </div>

        {/* main card */}
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.celebrateRow}>
              <div style={styles.celebrateIcon} aria-hidden>
                🎉
              </div>
              <div>
                <h1 style={styles.h1}>{copy.title}</h1>
                <p style={styles.p}>
                  {status === "checking"
                    ? copy.checking
                    : status === "active"
                      ? copy.subtitleActive
                      : copy.subtitlePending}
                </p>
              </div>
            </div>

            <div style={styles.badgesRow}>
              {trustBadges.map((b) => (
                <div key={b.text} style={styles.badge}>
                  <span aria-hidden>{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>

            {/* status strip */}
            <div style={styles.statusStrip}>
              <span style={styles.statusDot(status)} aria-hidden />
              <span style={styles.statusText}>
                {status === "checking"
                  ? lang === "en"
                    ? "Checking…"
                    : "Athuga…"
                  : status === "active"
                    ? lang === "en"
                      ? "Pro active"
                      : "Pro virkt"
                    : lang === "en"
                      ? "Activating"
                      : "Virkjar"}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: 14 }}>
            <Link to="/" style={styles.ctaLink}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                <span aria-hidden>✨</span>
                <span>{copy.back}</span>
                <span style={{ opacity: 0.9 }} aria-hidden>
                  →
                </span>
              </span>
              <span style={styles.ctaSub}>{copy.fine}</span>
            </Link>
          </div>

          <div style={styles.finePrint}>
            {T(
              "successFinePrint",
              lang === "en"
                ? "Tip: If Pro doesn’t show up immediately, try refreshing once."
                : "Ábending: Ef Pro birtist ekki strax, prófaðu að endurhlaða einu sinni."
            )}
          </div>
        </div>

        <div style={styles.footer}>
          {T(
            "successSupportLine",
            lang === "en"
              ? "Need help? Message us and we’ll sort it."
              : "Þarftu aðstoð? Sendu okkur skilaboð og við reddum þessu."
          )}
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
    container: { maxWidth: 780, margin: "0 auto", position: "relative" },

    topBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 14,
    },

    backLink: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      borderRadius: 12,
      color: isLight ? "rgba(11,18,32,0.75)" : "rgba(255,255,255,0.78)",
      textDecoration: "none",
      border: "1px solid transparent",
    },

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
      background: "rgba(255,255,255,0.95)",
      display: "grid",
      placeItems: "center",
      padding: 6,
      boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.10)",
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

    celebrateRow: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
    },

    celebrateIcon: {
      width: 44,
      height: 44,
      borderRadius: 16,
      display: "grid",
      placeItems: "center",
      background: "rgba(16,185,129,0.14)",
      border: "1px solid rgba(16,185,129,0.22)",
      flex: "0 0 auto",
      fontSize: 20,
    },

    h1: { fontSize: 28, fontWeight: 950, margin: "0 0 6px 0", letterSpacing: "-0.02em" },
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

    statusStrip: {
      marginTop: 14,
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 12px",
      borderRadius: 16,
      background: isLight ? "rgba(15,23,42,0.03)" : "rgba(0,0,0,0.18)",
      border: isLight ? "1px solid rgba(15,23,42,0.08)" : "1px solid rgba(255,255,255,0.10)",
    },

    statusDot: (status) => {
      const base = {
        width: 10,
        height: 10,
        borderRadius: 999,
        display: "inline-block",
      };

      if (status === "active") return { ...base, background: "rgba(16,185,129,1)" };
      if (status === "checking") return { ...base, background: "rgba(59,130,246,1)" };
      return { ...base, background: "rgba(245,158,11,1)" };
    },

    statusText: {
      fontSize: 13,
      fontWeight: 800,
      opacity: 0.9,
    },

    ctaLink: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      padding: "14px 16px",
      borderRadius: 18,
      border: "1px solid rgba(16,185,129,0.35)",
      background: "linear-gradient(180deg, rgba(16,185,129,0.95), rgba(16,185,129,0.70))",
      color: "white",
      fontWeight: 950,
      textDecoration: "none",
      boxShadow: "0 14px 30px rgba(16,185,129,0.22)",
    },

    ctaSub: {
      fontSize: 12,
      fontWeight: 700,
      opacity: 0.9,
      textAlign: "center",
    },

    finePrint: {
      marginTop: 12,
      textAlign: "center",
      fontSize: 12,
      opacity: 0.72,
    },

    footer: {
      marginTop: 14,
      textAlign: "center",
      fontSize: 12,
      opacity: 0.72,
    },
  };
}

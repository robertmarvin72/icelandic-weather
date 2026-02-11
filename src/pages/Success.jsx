// src/pages/Success.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Success({ lang = "is", theme = "dark", t }) {
  const [status, setStatus] = useState("checking"); // checking | active | pending
  const [logoOk, setLogoOk] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");

  const isLight = theme === "light";

  const T = (key, fallback) => {
    if (typeof t === "function") {
      const v = t(key);
      return v == null ? fallback : v;
    }
    return fallback;
  };

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

  async function openPortal() {
    if (portalLoading) return;
    setPortalLoading(true);
    setPortalError("");

    try {
      const res = await fetch("/api/billing-portal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok || !json?.url) {
        throw new Error(
          json?.error || T("billingPortalUnavailable", "Billing portal unavailable right now.")
        );
      }

      window.location.assign(json.url);
    } catch (e) {
      setPortalError(
        e?.message || T("billingPortalUnavailable", "Billing portal unavailable right now.")
      );
    } finally {
      setPortalLoading(false);
    }
  }

  const styles = getStyles(isLight);

  const trustBadges = [
    { icon: "🔒", text: T("successBadgeSecure", "Secure payment via Paddle") },
    { icon: "✅", text: T("successBadgeInstant", "Pro activates instantly") },
    { icon: "↩️", text: T("successBadgeCancel", "Cancel anytime") },
  ];

  const subtitle =
    status === "checking"
      ? T("successChecking", "Verifying your Pro access…")
      : status === "active"
        ? T("successSubtitleActive", "Your Pro access is now active.")
        : T(
            "successSubtitlePending",
            "Payment received. Pro usually activates instantly — give it a moment."
          );

  const statusText =
    status === "checking"
      ? T("successStatusChecking", "Checking…")
      : status === "active"
        ? T("successStatusActive", "Pro active")
        : T("successStatusActivating", "Activating");

  return (
    <div style={styles.page}>
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

      <div style={styles.container}>
        <div style={styles.topBar}>
          <Link to="/" style={styles.backLink}>
            ← {T("successBack", "Back to CampCast")}
          </Link>

          <div style={styles.brandPill} title={T("successPillTitle", "CampCast Pro")}>
            <div style={styles.brandLogoWrap}>
              {logoOk ? (
                <img
                  src="/logo.png"
                  alt={T("successBrandAlt", "CampCast")}
                  style={styles.brandLogo}
                  onError={() => setLogoOk(false)}
                />
              ) : null}
            </div>

            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <div style={styles.brandTitle}>{T("successPillTitle", "CampCast Pro")}</div>
              <div style={styles.brandSub}>{T("successPillSub", "Follow the weather")}</div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.celebrateRow}>
              <div style={styles.celebrateIcon} aria-hidden>
                🎉
              </div>
              <div>
                <h1 style={styles.h1}>{T("successTitle", "Payment received")}</h1>
                <p style={styles.p}>{subtitle}</p>
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

            <div style={styles.statusStrip}>
              <span style={styles.statusDot(status)} aria-hidden />
              <span style={styles.statusText}>{statusText}</span>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Link to="/" style={styles.ctaLink}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                <span aria-hidden>✨</span>
                <span>{T("successBackToHome", "Back to home")}</span>
                <span style={{ opacity: 0.9 }} aria-hidden>
                  →
                </span>
              </span>
              <span style={styles.ctaSub}>{T("successFine", "Try refreshing shortly.")}</span>
            </Link>

            <div style={styles.portalArea}>
              <button
                type="button"
                onClick={openPortal}
                disabled={portalLoading}
                style={styles.portalButton(portalLoading)}
              >
                {portalLoading
                  ? T("openingBillingPortal", "Opening billing portal…")
                  : T("manageSubscription", "Manage")}
              </button>

              {portalError ? <div style={styles.portalError}>{portalError}</div> : null}
            </div>

            <div style={styles.finePrint}>
              {T(
                "successFinePrint",
                "If Pro access doesn’t activate immediately, it will be enabled automatically within a few minutes."
              )}
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          {T("successSupportLine", "If anything doesn’t work as expected, contact us:")}{" "}
          <a
            href="mailto:support@campcast.is?subject=CampCast%20Pro%20Support"
            style={{ fontWeight: 600, color: "#10b981", textDecoration: "none" }}
          >
            hello@campcast.is
          </a>
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

    backLink: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontWeight: 800,
      textDecoration: "none",
      color: isLight ? "#0B1220" : "rgba(255,255,255,0.9)",
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
      border: isLight ? "1px solid rgba(2,6,23,0.12)" : "1px solid rgba(255,255,255,0.12)",
      background: isLight ? "rgba(255,255,255,0.85)" : "rgba(2,6,23,0.55)",
      backdropFilter: "blur(10px)",
      boxShadow: isLight ? "0 18px 60px rgba(2,6,23,0.10)" : "0 22px 70px rgba(0,0,0,0.42)",
    },

    header: {},

    celebrateRow: { display: "flex", alignItems: "flex-start", gap: 12 },
    celebrateIcon: { fontSize: 22, marginTop: 2 },

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

    statusStrip: {
      marginTop: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      borderRadius: 999,
      border: isLight ? "1px solid rgba(2,6,23,0.10)" : "1px solid rgba(255,255,255,0.10)",
      background: isLight ? "rgba(2,6,23,0.03)" : "rgba(255,255,255,0.03)",
    },

    statusDot: (status) => ({
      width: 8,
      height: 8,
      borderRadius: 999,
      background:
        status === "active"
          ? "rgba(16,185,129,0.95)"
          : status === "checking"
            ? "rgba(59,130,246,0.95)"
            : "rgba(245,158,11,0.95)",
      boxShadow: "0 0 0 6px rgba(16,185,129,0.08)",
    }),

    statusText: { fontSize: 12, fontWeight: 900, opacity: 0.9 },

    ctaLink: {
      width: "100%",
      borderRadius: 18,
      padding: "12px 14px",
      fontSize: 14,
      fontWeight: 900,
      background: "rgba(99,102,241,0.95)",
      color: "white",
      display: "grid",
      gap: 4,
      textAlign: "center",
      textDecoration: "none",
      boxShadow: "0 12px 30px rgba(99,102,241,0.22)",
    },

    ctaSub: { fontSize: 12, fontWeight: 700, opacity: 0.9 },

    portalArea: { marginTop: 12, display: "grid", gap: 8, justifyItems: "center" },

    portalButton: (busy) => ({
      borderRadius: 999,
      padding: "10px 14px",
      fontWeight: 900,
      border: isLight ? "1px solid rgba(2,6,23,0.14)" : "1px solid rgba(255,255,255,0.14)",
      background: busy ? "rgba(148,163,184,0.35)" : "transparent",
      color: isLight ? "#0B1220" : "rgba(255,255,255,0.92)",
      cursor: busy ? "not-allowed" : "pointer",
      minWidth: 160,
    }),

    portalError: {
      fontSize: 12,
      padding: "8px 10px",
      borderRadius: 14,
      border: "1px solid rgba(239,68,68,0.28)",
      background: "rgba(239,68,68,0.10)",
      color: isLight ? "#7f1d1d" : "rgba(255,255,255,0.95)",
      maxWidth: 520,
      textAlign: "center",
    },

    finePrint: { marginTop: 10, fontSize: 12, opacity: 0.75, textAlign: "center" },

    footer: { marginTop: 16, fontSize: 12, opacity: 0.85, textAlign: "center" },
  };
}

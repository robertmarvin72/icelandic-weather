// src/pages/Subscribe.jsx
import React, { useMemo, useState } from "react";

export default function Subscribe({ onClose, onDone }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialEmail = params.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [logoOk, setLogoOk] = useState(true);

  async function startCheckout() {
    setErr("");
    if (!email || !email.includes("@")) {
      setErr("Vinsamlegast sláðu inn gilt netfang.");
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
      if (!url) throw new Error("Vantar checkout URL frá /api/checkout.");

      window.location.href = url;
    } catch (e) {
      setErr(e?.message || "Eitthvað fór úrskeiðis.");
      setBusy(false);
    }
  }

  const trustBadges = [
    { icon: "🔒", text: "Örugg greiðsla í gegnum Paddle" },
    { icon: "↩️", text: "Hætta hvenær sem er" },
    { icon: "✅", text: "Pro virkjast samstundis" },
  ];

  const features = [
    {
      icon: "✨",
      title: "Allir Pro fídusar opnast",
      desc: "Fáðu fullan aðgang að Pro virkni í appinu.",
    },
    {
      icon: "📊",
      title: "Betri yfirsýn og skor",
      desc: "Skýrari leið til að taka veðurákvarðanir.",
    },
    {
      icon: "🧠",
      title: "Meiri nákvæmni og útreikningar",
      desc: "Viðbótar-útreikningar þar sem það á við.",
    },
    {
      icon: "🛠️",
      title: "Styður áframhaldandi þróun",
      desc: "Kaupin hjálpa okkur að bæta CampCast stöðugt.",
    },
  ];

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
            ← Til baka
          </button>

          <div style={styles.brand}>
            {logoOk ? (
              <div style={styles.logoPill} aria-label="CampCast">
                <img
                  src="/logo.png"
                  alt="CampCast"
                  style={styles.logoImg}
                  onError={() => setLogoOk(false)}
                />
              </div>
            ) : null}

            <div>
              <div style={styles.brandTitle}>CampCast Pro</div>
              <div style={styles.brandSub}>Eltum veðrið</div>
            </div>
          </div>
        </div>

        {/* card */}
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.h1}>Virkjaðu Pro aðgang</h1>
            <p style={styles.p}>
              Engin dramatík — bara betri veðurákvarðanir. Þú ferð í greiðslu hjá{" "}
              <span style={{ fontWeight: 800 }}>Paddle</span>.
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

          {/* email input */}
          <div style={{ marginTop: 16 }}>
            <label style={styles.label}>Netfang</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nafn@domain.com"
              inputMode="email"
              autoComplete="email"
              style={{
                ...styles.input,
                borderColor: err ? "rgba(255, 129, 129, 0.6)" : "rgba(255,255,255,0.14)",
              }}
            />
            <div style={styles.helper}>
              Við notum netfangið til að tengja áskriftina og senda kvittun.
            </div>
          </div>

          {/* features grid */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Hvað færðu með Pro</div>

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

          {/* error */}
          {err ? (
            <div style={styles.errorBox} role="alert" aria-live="polite">
              <div style={{ fontWeight: 900, marginBottom: 4 }}>Úps!</div>
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
              <span>{busy ? "Opna greiðslusíðu..." : "Halda áfram í greiðslu"}</span>
              <span style={{ opacity: 0.9 }} aria-hidden>
                →
              </span>
            </span>
            <span style={styles.ctaSub}>
              Þú getur alltaf hætt áskrift síðar (billing portal kemur bráðlega).
            </span>
          </button>

          <div style={styles.finePrint}>
            Með því að halda áfram samþykkir þú að greiðslan fari fram í gegnum Paddle.
          </div>

          {/* secondary */}
          <button
            onClick={() => (onClose ? onClose() : window.history.back())}
            type="button"
            style={styles.secondary}
          >
            Til baka
          </button>
        </div>

        {/* footer trust */}
        <div style={styles.footer}>
          Spurningar? <span style={{ fontWeight: 800 }}>Sendu okkur skilaboð</span> og við reddum
          þessu.
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "28px 16px",
    color: "white",
    background:
      "radial-gradient(1200px 700px at 20% 10%, rgba(16,185,129,0.18), transparent 55%), radial-gradient(900px 600px at 85% 80%, rgba(59,130,246,0.12), transparent 55%), linear-gradient(180deg, #060A12 0%, #060A12 100%)",
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
  },
  glowBottom: {
    position: "absolute",
    inset: "auto -200px -220px -200px",
    height: 480,
    background: "radial-gradient(circle at 70% 40%, rgba(59,130,246,0.18), transparent 62%)",
    filter: "blur(12px)",
    pointerEvents: "none",
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
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    cursor: "pointer",
    padding: "8px 10px",
    borderRadius: 12,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoPill: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: 6,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 22px rgba(0,0,0,0.25)",
  },
  logoImg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    objectFit: "cover",
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 14,
    objectFit: "cover",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
  },
  brandTitle: { fontWeight: 900, fontSize: 14, lineHeight: 1.1 },
  brandSub: { fontSize: 12, opacity: 0.72 },

  card: {
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
    backdropFilter: "blur(10px)",
    padding: 18,
  },
  header: {
    padding: "8px 6px 0px 6px",
  },
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
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.88)",
  },

  label: { display: "block", marginBottom: 8, fontWeight: 900, opacity: 0.92 },
  input: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.22)",
    color: "white",
    outline: "none",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.0)",
  },
  helper: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.7,
  },

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
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.10)",
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
    color: "rgba(255,255,255,0.92)",
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
  ctaSub: {
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.9,
  },
  finePrint: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    opacity: 0.72,
  },

  secondary: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 18,
    marginTop: 10,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.16)",
    color: "rgba(255,255,255,0.92)",
    cursor: "pointer",
    fontWeight: 850,
  },

  footer: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 12,
    opacity: 0.72,
  },
};

// simple responsive tweak for wider screens (no CSS file needed)
if (typeof window !== "undefined") {
  const mq = window.matchMedia("(min-width: 640px)");
  const apply = () => {
    const grid = document.querySelectorAll?.("[data-subscribe-grid]");
    // no-op; kept intentionally small. If you want, we can move to CSS/Tailwind later.
  };
  mq.addEventListener?.("change", apply);
}

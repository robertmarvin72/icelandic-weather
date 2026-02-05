// src/pages/Subscribe.jsx
import React, { useMemo, useState } from "react";

export default function Subscribe({ onClose, onDone }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialEmail = params.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

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
        body: JSON.stringify({ plan: "pro" }), // ef þú notar planId/priceId, settu það hér
      });

      const j2 = await r2.json().catch(() => ({}));

      // algeng mynstur: { url } eða { checkoutUrl }
      const url = j2?.url || j2?.checkoutUrl;
      if (!url) throw new Error("Vantar checkout URL frá /api/checkout.");

      window.location.href = url;
    } catch (e) {
      setErr(e?.message || "Eitthvað fór úrskeiðis.");
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>CampCast Pro</h1>
      <p style={{ opacity: 0.85, marginBottom: 16 }}>
        Þú ert að fara að virkja Pro aðgang. (Engin dramatík — bara betri veðurákvarðanir.)
      </p>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Netfang</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nafn@domain.com"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.2)",
            color: "white",
          }}
        />
      </div>

      <div
        style={{
          padding: 14,
          borderRadius: 14,
          background: "rgba(255,255,255,0.06)",
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Hvað færðu með Pro</div>
        <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.9, lineHeight: 1.6 }}>
          <li>Allar Pro features opnast</li>
          <li>Betri yfirsýn / skor / viðbótar-útreikningar (eftir því sem þú setur inn)</li>
          <li>Stuðningur við áframhaldandi þróun</li>
        </ul>
      </div>

      {err ? <div style={{ marginBottom: 12, color: "#ffb3b3" }}>{err}</div> : null}

      <button
        onClick={startCheckout}
        disabled={busy}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 14,
          border: "none",
          fontWeight: 800,
          cursor: busy ? "not-allowed" : "pointer",
        }}
      >
        {busy ? "Opna checkout..." : "Halda áfram í greiðslu"}
      </button>

      <button
        onClick={() => (onClose ? onClose() : window.history.back())}
        style={{
          width: "100%",
          padding: "10px 16px",
          borderRadius: 14,
          marginTop: 10,
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.18)",
          color: "white",
          cursor: "pointer",
        }}
      >
        Til baka
      </button>
    </div>
  );
}

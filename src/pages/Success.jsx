import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Success() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    async function checkMe() {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const json = await res.json();
        if (res.ok && json?.entitlements?.pro) {
          setStatus("active");
        } else {
          setStatus("pending");
        }
      } catch {
        setStatus("pending");
      }
    }
    checkMe();
  }, []);

  return (
    <div style={{ maxWidth: 520, margin: "80px auto", padding: 24, textAlign: "center" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>🎉 Takk fyrir!</h1>

      {status === "active" ? (
        <p style={{ fontSize: 16, opacity: 0.9 }}>CampCast Pro aðgangur hefur verið virkjaður.</p>
      ) : (
        <p style={{ fontSize: 16, opacity: 0.9 }}>
          Greiðsla móttekin. Aðgangur virkjast augnabliklega.
        </p>
      )}

      <div style={{ marginTop: 32 }}>
        <Link
          to="/"
          style={{
            display: "inline-block",
            padding: "12px 20px",
            borderRadius: 10,
            background: "#2563eb",
            color: "white",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Fara í CampCast
        </Link>
      </div>

      <p style={{ marginTop: 16, fontSize: 13, opacity: 0.6 }}>
        Þú getur alltaf stjórnað áskriftinni í stillingum.
      </p>
    </div>
  );
}

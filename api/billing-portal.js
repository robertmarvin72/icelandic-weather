import postgres from "postgres";
import crypto from "crypto";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });

const SESSION_COOKIE = "cc_session";

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function getCookie(req, name) {
  const header = req.headers?.cookie || "";
  const parts = header.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}

function apiBase() {
  const env = (process.env.PADDLE_ENV || "sandbox").toLowerCase();
  return env === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  try {
    const token = getCookie(req, SESSION_COOKIE);
    if (!token) return res.status(401).json({ ok: false, error: "Not logged in" });

    const sessionHash = sha256Hex(token);

    // Find user by session
    const rows = await sql`
      select
        u.id,
        u.email,
        u.paddle_customer_id,
        u.paddle_subscription_id
      from app_user u
      join app_session s on s.user_id = u.id
      where s.session_hash = ${sessionHash}
        and s.revoked_at is null
        and (s.expires_at is null or s.expires_at > now())
      limit 1
    `;

    const me = rows?.[0];
    if (!me) return res.status(401).json({ ok: false, error: "Session invalid" });

    if (!me.paddle_customer_id) {
      // This typically means webhook mapping hasn’t populated customer_id yet
      return res.status(409).json({
        ok: false,
        code: "MISSING_PADDLE_CUSTOMER",
        error: "Missing paddle_customer_id",
      });
    }

    const paddleKey = process.env.PADDLE_API_KEY;
    if (!paddleKey) {
      return res.status(500).json({ ok: false, error: "Missing PADDLE_API_KEY" });
    }

    const base = apiBase();

    // Create a customer portal session
    const r = await fetch(`${base}/customers/${me.paddle_customer_id}/portal-sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paddleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // optional, but nice to have for UX (Paddle can use it to return)
        // If your Paddle account ignores/doesn’t support this, it’s harmless.
        return_url: "https://www.campcast.is/",
      }),
    });

    const j = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json({
        ok: false,
        error: j?.error?.detail || j?.error || "Paddle portal session failed",
        raw: j,
      });
    }

    const url = j?.data?.url || j?.url;
    if (!url) return res.status(500).json({ ok: false, error: "No portal URL returned" });

    return res.status(200).json({ ok: true, url });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: String(err?.message || err),
    });
  }
}

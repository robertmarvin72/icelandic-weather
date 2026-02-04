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
  for (const part of parts) {
    if (!part) continue;
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx);
    const v = part.slice(idx + 1);
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const rawToken = getCookie(req, SESSION_COOKIE);

    // ✅ #2: Always return a stable shape (include entitlements) even when logged out
    if (!rawToken) {
      res.status(200).json({
        ok: true,
        user: null,
        subscription: null,
        entitlements: { pro: false, proUntil: null },
      });
      return;
    }

    const tokenHash = sha256Hex(rawToken);

    // Validate session + join user
    const rows = await sql`
      select
        u.id as user_id,
        u.email,
        u.tier,
        u.display_name,
        u.created_at,

        s.expires_at,
        s.revoked_at
      from user_session s
      join app_user u on u.id = s.user_id
      where s.token_hash = ${tokenHash}
        and s.revoked_at is null
        and s.expires_at > now()
      limit 1
    `;

    const row = rows[0];
    if (!row) {
      // invalid/expired session
      res.status(200).json({
        ok: true,
        user: null,
        subscription: null,
        entitlements: { pro: false, proUntil: null },
      });
      return;
    }

    const user = {
      id: row.user_id,
      email: row.email,
      tier: row.tier,
      display_name: row.display_name,
      created_at: row.created_at,
    };

    // Subscription (0..1 per user)
    const subs = await sql`
      select
        id,
        status,
        current_period_end,
        paddle_subscription_id,
        paddle_price_id,
        created_at,
        updated_at
      from user_subscription
      where user_id = ${user.id}
      limit 1
    `;

    const sub = subs[0] || null;

    const endsInFuture =
      sub?.current_period_end && new Date(sub.current_period_end) > new Date();

    const proActive =
      endsInFuture &&
      ["active", "trialing", "past_due", "canceled", "cancelled"].includes(sub?.status);

    res.status(200).json({
      ok: true,
      user,
      subscription: sub,
      entitlements: {
        pro: proActive,
        proUntil: sub?.current_period_end || null,
      },
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

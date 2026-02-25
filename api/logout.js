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

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production";
  const cookie = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    secure ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");

  res.setHeader("Set-Cookie", cookie);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const rawToken = getCookie(req, SESSION_COOKIE);

    if (rawToken) {
      const tokenHash = sha256Hex(rawToken);
      await sql`
        update user_session
        set revoked_at = now()
        where token_hash = ${tokenHash}
          and revoked_at is null
      `;
    }

    clearSessionCookie(res);
    res.status(200).json({ ok: true });
  } catch {
    // still clear cookie even if revoke fails
    clearSessionCookie(res);
    res.status(200).json({ ok: true, note: "Cookie cleared; revoke may have failed" });
  }
}

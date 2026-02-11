import postgres from "postgres";
import crypto from "crypto";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });

const SESSION_COOKIE = "cc_session";
const SESSION_DAYS = 30;

function makeSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function sha256Hex(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex");
}

function normalizeEmail(v) {
  return String(v || "").trim().toLowerCase();
}

function buildCookie({ name, value, maxAgeSeconds, secure, domain }) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
    `Expires=${new Date(Date.now() + maxAgeSeconds * 1000).toUTCString()}`,
    secure ? "Secure" : null,
    domain ? `Domain=${domain}` : null,
    "Priority=High",
  ].filter(Boolean);

  return parts.join("; ");
}

function setSessionCookie(res, token, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === "production";

  // Only set this if you truly need cookie shared across subdomains:
  // e.g. ".campcast.is"
  const domain = process.env.SESSION_COOKIE_DOMAIN || "";

  const cookie = buildCookie({
    name: SESSION_COOKIE,
    value: token,
    maxAgeSeconds,
    secure,
    domain: domain || null,
  });

  res.setHeader("Set-Cookie", cookie);
}

async function findUserByEmail(emailLower) {
  const rows = await sql`
    select id, email, tier, display_name, created_at
    from app_user
    where lower(email) = ${emailLower}
    limit 1
  `;
  return rows[0] || null;
}

async function createUser(emailLower) {
  const rows = await sql`
    insert into app_user (email)
    values (${emailLower})
    returning id, email, tier, display_name, created_at
  `;
  return rows[0] || null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const email = normalizeEmail(body.email);
    const createIfMissing = !!body.createIfMissing;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ ok: false, code: "INVALID_EMAIL", error: "Invalid email" });
    }

    // 1) Find user (case-insensitive)
    let user = await findUserByEmail(email);

    // Strict login: don't auto-create
    if (!user && !createIfMissing) {
      return res.status(200).json({
        ok: false,
        code: "USER_NOT_FOUND",
        error: "User not found",
      });
    }

    // Subscribe flow: create user if missing
    if (!user && createIfMissing) {
      try {
        user = await createUser(email);
      } catch (e) {
        user = await findUserByEmail(email);
        if (!user) throw e;
      }
    }

    if (!user) {
      return res.status(500).json({ ok: false, error: "Failed to resolve user" });
    }

    // 2) Create session
    const rawToken = makeSessionToken();
    const tokenHash = sha256Hex(rawToken);

    const maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60;
    const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

    await sql`
      insert into user_session (user_id, token_hash, expires_at)
      values (${user.id}, ${tokenHash}, ${expiresAt.toISOString()})
    `;

    // 3) Set cookie
    setSessionCookie(res, rawToken, maxAgeSeconds);

    return res.status(200).json({ ok: true, user });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

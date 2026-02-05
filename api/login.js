import postgres from "postgres";
import crypto from "crypto";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });

const SESSION_COOKIE = "cc_session";
const SESSION_DAYS = 30;

function makeSessionToken() {
  return crypto.randomBytes(32).toString("hex"); // 64 chars
}

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex"); // 64 chars
}

function setSessionCookie(res, token, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === "production";
  const cookie = [
    `${SESSION_COOKIE}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAgeSeconds}`,
    secure ? "Secure" : null,
  ].filter(Boolean).join("; ");

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
  return rows[0];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const email = (body?.email || "").trim().toLowerCase();
    const createIfMissing = !!body?.createIfMissing;

    if (!email || !email.includes("@")) {
      res.status(400).json({ ok: false, error: "Invalid email" });
      return;
    }

    // 1) Find user (case-insensitive)
    let user = await findUserByEmail(email);

    // If this is a strict login and the user doesn't exist, don't auto-create.
    if (!user && !createIfMissing) {
      res.status(200).json({
        ok: false,
        code: "USER_NOT_FOUND",
        error: "User not found",
      });
      return;
    }

    // If allowed, create user on demand (e.g. from the Subscribe page)
    if (!user && createIfMissing) {
      try {
        user = await createUser(email);
      } catch (e) {
        // If another request created it in parallel, just re-fetch
        user = await findUserByEmail(email);
        if (!user) throw e;
      }
    }

    // 2) Create session
    const rawToken = makeSessionToken();
    const tokenHash = sha256Hex(rawToken);

    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await sql`
      insert into user_session (user_id, token_hash, expires_at)
      values (${user.id}, ${tokenHash}, ${expiresAt.toISOString()})
    `;

    // 3) Set cookie
    const maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60;
    setSessionCookie(res, rawToken, maxAgeSeconds);

    res.status(200).json({ ok: true, user });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

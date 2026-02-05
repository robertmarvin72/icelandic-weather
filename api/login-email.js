// api/login-email.js
import postgres from "postgres";
import crypto from "crypto";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });

function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const { email } = req.body || {};
  if (!email || !email.includes("@")) {
    return res.status(400).json({ ok: false, error: "Invalid email" });
  }

  // 1. ensure user
  const users = await sql`
    insert into app_user (email)
    values (${email})
    on conflict (email)
    do update set email = excluded.email
    returning id, email
  `;
  const user = users[0];

  // 2. create session
  const rawToken = randomToken();
  const tokenHash = sha256Hex(rawToken);

  await sql`
    insert into user_session (user_id, token_hash, expires_at)
    values (${user.id}, ${tokenHash}, now() + interval '30 days')
  `;

  // 3. set cookie
  res.setHeader(
    "Set-Cookie",
    `cc_session=${rawToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
  );

  res.status(200).json({ ok: true, user });
}

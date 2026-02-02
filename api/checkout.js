import postgres from "postgres";
import crypto from "crypto";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });

function getCookie(req, name) {
  const cookie = req.headers.cookie || "";
  const parts = cookie.split(";").map((p) => p.trim());
  const hit = parts.find((p) => p.startsWith(name + "="));
  return hit ? decodeURIComponent(hit.split("=").slice(1).join("=")) : null;
}

function sha256Hex(s) {
  return crypto.createHash("sha256").update(String(s)).digest("hex");
}

function paddleBaseUrl() {
  return process.env.PADDLE_ENV === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

async function paddleFetch(path, { method = "GET", body } = {}) {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) throw new Error("Missing PADDLE_API_KEY");

  const res = await fetch(paddleBaseUrl() + path, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg = json?.error?.detail || json?.error || text || `HTTP ${res.status}`;
    throw new Error(`Paddle API error: ${msg}`);
  }

  return json;
}

async function getUserFromSession(req) {
  const token = getCookie(req, "cc_session");
  if (!token) return null;

  const tokenHash = sha256Hex(token);

  const rows = await sql`
    select u.id, u.email, u.tier, u.paddle_customer_id
    from user_session s
    join app_user u on u.id = s.user_id
    where s.token_hash = ${tokenHash}
      and s.revoked_at is null
      and s.expires_at > now()
    limit 1
  `;

  return rows[0] || null;
}

async function ensurePaddleCustomer(user) {
  if (user.paddle_customer_id) return user.paddle_customer_id;

  const created = await paddleFetch("/customers", {
    method: "POST",
    body: {
      email: user.email,
      custom_data: { app: "campcast", user_id: user.id },
    },
  });

  const customerId = created?.data?.id;
  if (!customerId) throw new Error("Failed to create Paddle customer (missing id)");

  await sql`
    update app_user
    set paddle_customer_id = ${customerId}
    where id = ${user.id}
  `;

  return customerId;
}

function shouldRedirect(req) {
  // If called from browser navigation, we redirect.
  const accept = String(req.headers.accept || "");
  const wantsHtml = accept.includes("text/html");
  const url = new URL(req.url, "http://localhost"); // base doesn't matter
  const redirectFlag = url.searchParams.get("redirect") === "1";
  return wantsHtml || redirectFlag;
}

function appBaseUrl(req) {
  // Prefer explicit env var
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  // Fallback to Vercel-provided host
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`.replace(/\/+$/, "");
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const user = await getUserFromSession(req);
    if (!user) return res.status(401).json({ ok: false, error: "Not logged in" });

    const priceId = process.env.PADDLE_PRICE_ID_MONTHLY;
    if (!priceId) throw new Error("Missing PADDLE_PRICE_ID_MONTHLY");

    const customerId = await ensurePaddleCustomer(user);

    const base = appBaseUrl(req);
    const successUrl = `${base}/?checkout=success`;
    const cancelUrl = `${base}/?checkout=cancel`;

    const txn = await paddleFetch("/transactions", {
      method: "POST",
      body: {
        customer_id: customerId,
        items: [{ price_id: priceId, quantity: 1 }],
        custom_data: { app: "campcast", user_id: user.id, email: user.email },
        checkout: {
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
      },
    });

    const checkoutUrl = txn?.data?.checkout?.url;
    if (!checkoutUrl) throw new Error("No checkout URL returned from Paddle");

    // Key change: redirect for browser flows
    if (shouldRedirect(req)) {
      res.setHeader("Cache-Control", "no-store");
      res.writeHead(303, { Location: checkoutUrl });
      return res.end();
    }

    // Still support JSON for fetch calls
    return res.status(200).json({ ok: true, url: checkoutUrl });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

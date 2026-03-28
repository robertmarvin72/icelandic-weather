import crypto from "crypto";

export function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function parsePaddleSignatureHeader(headerValue) {
  const out = { ts: null, h1: null };
  if (!headerValue) return out;

  const parts = String(headerValue)
    .split(";")
    .map((p) => p.trim());

  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    const v = rest.join("=");
    if (k === "ts") out.ts = v;
    if (k === "h1") out.h1 = v;
  }

  return out;
}

function getPaddleSignatureHeader(req) {
  return (
    req.headers["paddle-signature"] ||
    req.headers["Paddle-Signature"] ||
    req.headers["x-paddle-signature"] ||
    req.headers["X-Paddle-Signature"]
  );
}

export function verifyPaddleSignature({ req, rawBody, secret }) {
  const header = getPaddleSignatureHeader(req);
  const { ts, h1 } = parsePaddleSignatureHeader(header);
  if (!ts || !h1) return false;

  const signedPayload = `${ts}:${rawBody}`;
  const computed = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  return safeEqual(h1, computed);
}

export function isProdLike() {
  const vercelEnv = String(process.env.VERCEL_ENV || "").toLowerCase();
  const nodeEnv = String(process.env.NODE_ENV || "").toLowerCase();
  return vercelEnv === "production" || nodeEnv === "production";
}

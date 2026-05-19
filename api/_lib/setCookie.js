// api/_lib/setCookie.js
// Shared session-cookie setter.  Derives the Domain attribute from the
// incoming request host so the same code works on campcast.is,
// eltumvedrid.is, and localhost without any per-domain env vars.

const SESSION_COOKIE = "cc_session";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

function cookieDomain(requestHost) {
  const h = String(requestHost || "").split(":")[0].toLowerCase();
  if (!h || h === "localhost" || h === "127.0.0.1" || h.startsWith("127.")) return null;
  if (h.includes("eltumvedrid.is")) return ".eltumvedrid.is";
  if (h.includes("campcast.is")) return ".campcast.is";
  return null; // unknown host — omit Domain (safe fallback)
}

export function setSessionCookie(res, token, requestHost) {
  const h = String(requestHost || "").split(":")[0].toLowerCase();
  const isLocalhost = !h || h === "localhost" || h === "127.0.0.1" || h.startsWith("127.");
  const domain = cookieDomain(requestHost);

  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE_SECONDS}`,
    `Expires=${new Date(Date.now() + MAX_AGE_SECONDS * 1000).toUTCString()}`,
    "Priority=High",
    isLocalhost ? null : "Secure",
    domain ? `Domain=${domain}` : null,
  ].filter(Boolean);

  res.setHeader("Set-Cookie", parts.join("; "));
}

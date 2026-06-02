const SESSION_KEY = "checkout_source";

const BLOG_SLUG_PATTERNS = [
  [/asbyrgi/, "blog_asbyrgi"],
  [/egilsstadir/, "blog_egilsstadir"],
  [/skipalaekur/, "blog_skipalaekur"],
];

function routeSource(path) {
  if (path === "/pricing") return "pricing";
  if (path === "/subscribe") return "subscribe";
  if (path === "/brochure") return "brochure";
  if (path.startsWith("/blog/") || path.startsWith("/en/blog/")) {
    const slug = path.split("/blog/")[1] || "";
    for (const [pattern, label] of BLOG_SLUG_PATTERNS) {
      if (pattern.test(slug)) return label;
    }
    return "blog";
  }
  return "homepage";
}

// Priority: ?src= URL param → ctaSource arg → sessionStorage → route fallback
export function resolveCheckoutSource(ctaSource) {
  if (typeof window === "undefined") return "unknown";

  const urlSrc = new URLSearchParams(window.location.search).get("src");
  if (urlSrc) return urlSrc;

  if (ctaSource) return ctaSource;

  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return stored;
  } catch { /* unavailable */ }

  return routeSource(window.location.pathname);
}

export function persistCheckoutSource(source) {
  try {
    sessionStorage.setItem(SESSION_KEY, source);
  } catch { /* unavailable */ }
}

// Used on the success page — reads URL param first, then sessionStorage.
// TODO: Paddle's return URL is configured in the Paddle dashboard. To propagate
// source through Paddle's checkout flow, add ?src={source} to the success_url
// when creating the transaction in /api/checkout. Until that is wired up,
// sessionStorage (set before redirect) is the primary carrier.
export function readCheckoutSource() {
  if (typeof window === "undefined") return "unknown";

  const urlSrc = new URLSearchParams(window.location.search).get("src");
  if (urlSrc) return urlSrc;

  try {
    return sessionStorage.getItem(SESSION_KEY) || "unknown";
  } catch {
    return "unknown";
  }
}

const SESSION_KEY = "checkout_source";
const ROUTE_FALLBACK = "homepage";

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
  return ROUTE_FALLBACK;
}

// Priority: ?src= URL param → ctaSource arg → current route (if identifiable)
// → sessionStorage (fallback only when the route itself can't identify context)
// → route fallback.
//
// A known route (e.g. /pricing) always wins over sessionStorage: sessionStorage
// can hold a source persisted by an earlier, possibly-abandoned checkout attempt
// on a different page, and that must not leak into an unrelated later visit.
export function resolveCheckoutSource(ctaSource) {
  if (typeof window === "undefined") return "unknown";

  const urlSrc = new URLSearchParams(window.location.search).get("src");
  if (urlSrc) return urlSrc;

  if (ctaSource) return ctaSource;

  const routeSrc = routeSource(window.location.pathname);
  if (routeSrc !== ROUTE_FALLBACK) return routeSrc;

  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return stored;
  } catch { /* unavailable */ }

  return routeSrc;
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

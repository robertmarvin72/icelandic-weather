const STORAGE_KEY = "campcast_attribution";

export function getCurrentAttributionFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");
    const utmContent = params.get("utm_content");
    const utmTerm = params.get("utm_term");

    if (!utmSource && !utmMedium && !utmCampaign && !utmContent && !utmTerm) {
      return null;
    }

    const attr = {
      landing_path: window.location.pathname,
      referrer: document.referrer || null,
      first_seen_at: new Date().toISOString(),
    };

    if (utmSource) attr.utm_source = utmSource;
    if (utmMedium) attr.utm_medium = utmMedium;
    if (utmCampaign) attr.utm_campaign = utmCampaign;
    if (utmContent) attr.utm_content = utmContent;
    if (utmTerm) attr.utm_term = utmTerm;

    return attr;
  } catch {
    /* window/document unavailable */
    return null;
  }
}

export function saveAttributionIfPresent() {
  try {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const attr = getCurrentAttributionFromUrl();
    if (!attr) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attr));
  } catch {
    /* localStorage unavailable */
  }
}

export function getStoredAttribution() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearStoredAttribution() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* localStorage unavailable */
  }
}

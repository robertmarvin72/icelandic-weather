// api/_lib/aurora/fetchAurora.js
//
// Single controlled server-side fetch of the Vedur.is aurora feed. Called
// only from the authenticated cron refresh job (api/cron/refresh-aurora.js)
// after a lease claim succeeds — never from a browser or user request path.
//
// Icelandic endpoint only. The aurora-source audit confirmed the IS and EN
// variants share identical tag structure — only the human-readable
// schedule_description text differs, and this app never uses that upstream
// text as UI copy (i18n is derived from scheduleType instead) — so fetching
// both languages would be a redundant second upstream call for no benefit.

const AURORA_URL_IS = "https://xmlweather.vedur.is/aurora?op=xml&type=index";
const FETCH_TIMEOUT_MS = 8000;

/**
 * Fetches the raw aurora XML document. No retry here by design — a failed
 * fetch is the caller's signal to keep last-known-good and let the next
 * scheduled cron tick try again naturally, not to retry within this call.
 * Throws on timeout, network failure, or a non-2xx upstream status.
 */
export async function fetchAuroraXml() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(AURORA_URL_IS, {
      headers: { "User-Agent": "EltumVedrid/1.0 (aurora-cache-refresh)" },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Aurora upstream returned ${res.status}`);
    }

    return await res.text();
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error("Aurora upstream timeout");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

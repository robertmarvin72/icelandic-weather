// api/_lib/winterRoute/boundedFetch.js
//
// Ticket #486, S3(c) — one shared bounded-fetch primitive for every
// upstream request this route makes (both Vegagerðin feeds, and the
// Open-Meteo forecast call): 15s total timeout, no redirect following,
// standard TLS, and a 2 MiB cap enforced while streaming the response body
// (not after buffering it all), so an oversized/slow upstream can never
// hold a serverless invocation open or blow up memory. No retries here —
// callers decide whether/when to retry (this route's own policy is "no
// automatic retries", see roadFetch.js / forecastFetch.js).

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;

/**
 * Fetches `url` and returns either `{ ok: true, data }` (parsed JSON) or a
 * structured `{ ok: false, reason, status? }` failure — never throws.
 */
export async function fetchJsonBounded(
  url,
  { timeoutMs = DEFAULT_TIMEOUT_MS, maxBytes = DEFAULT_MAX_BYTES, headers, fetchImpl = fetch } = {}
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchImpl(url, { signal: controller.signal, redirect: "error", headers });

    if (!res.ok) {
      return { ok: false, reason: "upstream_error", status: res.status };
    }

    const text = await readBodyBounded(res, maxBytes);
    if (text === null) {
      return { ok: false, reason: "too_large" };
    }

    try {
      return { ok: true, data: JSON.parse(text) };
    } catch {
      return { ok: false, reason: "invalid_json" };
    }
  } catch (err) {
    if (err?.name === "AbortError") {
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "fetch_error" };
  } finally {
    clearTimeout(timer);
  }
}

// Streams the response body, aborting as soon as `maxBytes` would be
// exceeded. Returns null (caller treats as "too_large") rather than ever
// returning a silently-truncated partial body. Falls back to `res.text()`
// for fetch implementations without a streamable body (some test doubles),
// still enforcing the cap after the fact.
async function readBodyBounded(res, maxBytes) {
  const reader = res.body?.getReader?.();
  if (!reader) {
    const text = await res.text();
    return Buffer.byteLength(text, "utf-8") > maxBytes ? null : text;
  }

  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
}

// api/_lib/openMeteoAuth.js
//
// Ticket #453 — single source of truth for Open-Meteo host/credential
// selection, shared by the campsite forecast proxy (api/forecast.js) and
// the Aurora decision weather fetch (api/_lib/auroraDecision/openMeteo.js).
// Server-only: never imported from src/, never reads a VITE_-prefixed
// variable, never accepts a caller-supplied host/key/url.
//
// Each caller keeps its own field list, date range and unit-parameter
// spelling unchanged — this helper decides ONLY the base host and whether
// an `apikey` value should be appended; it builds no URL itself.
//
// Configuration is read at CALL TIME: `env` defaults to `process.env`
// evaluated when the function runs, not captured at module import time, so
// tests can inject an explicit env object without import-order dependence
// and without any test leaking its env into another.

export const OPEN_METEO_PUBLIC_HOST = "https://api.open-meteo.com";
export const OPEN_METEO_CUSTOMER_HOST = "https://customer-api.open-meteo.com";

/**
 * Ticket #453, Q1 (owner-confirmed policy): a non-blank configured key
 * always selects the customer host, in every environment. A missing/blank
 * key fails closed ONLY when `VERCEL_ENV === "production"` (defence in
 * depth — Production already has a key, owner-reported); Preview,
 * Development and undefined (plain local/test) all fall back to the public
 * host, with a static, nonsecret warning logged for the two deployed cases
 * (Preview/Development) so a misconfiguration is still visible to an
 * operator reading logs, without being disruptive to local work.
 *
 * `VERCEL_ENV` (not `NODE_ENV`, which is "production" on Preview too) is
 * Vercel's own platform-populated system environment variable — values
 * "production" | "preview" | "development" when this project has "Enable
 * access to System Environment Variables" turned on in Project Settings.
 * Whether that setting is actually enabled for THIS project is UNVERIFIED
 * (an owner-side metadata check, not inspected here); if it is off,
 * `VERCEL_ENV` is simply undefined at runtime and this function behaves
 * exactly like the plain-local/test case below — it does not detect that
 * silently-disabled state, which is a documented limitation, not a second
 * environment policy of its own.
 *
 * @param {Record<string, string|undefined>} [env]
 * @returns {{ host: string|null, apiKey: string|null, failClosed: boolean }}
 *   `failClosed: true` means no fetch should be attempted at all (`host`
 *   and `apiKey` are both null in that case) — callers must treat this
 *   exactly like any other structured upstream failure and must never
 *   throw it as an exception.
 */
export function resolveOpenMeteoAuth(env = process.env) {
  const rawKey = env?.OPEN_METEO_API_KEY;
  const trimmedKey = typeof rawKey === "string" ? rawKey.trim() : "";

  if (trimmedKey) {
    return { host: OPEN_METEO_CUSTOMER_HOST, apiKey: trimmedKey, failClosed: false };
  }

  const vercelEnv = env?.VERCEL_ENV;

  if (vercelEnv === "production") {
    return { host: null, apiKey: null, failClosed: true };
  }

  if (vercelEnv === "preview" || vercelEnv === "development") {
    // Static and nonsecret: never the key value, never a request URL.
    console.warn(`open-meteo: OPEN_METEO_API_KEY missing in ${vercelEnv}; falling back to the public host`);
  }

  return { host: OPEN_METEO_PUBLIC_HOST, apiKey: null, failClosed: false };
}

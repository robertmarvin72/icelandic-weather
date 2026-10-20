# Open-Meteo host/key configuration (Ticket #453)

Both backend weather routes — the campsite forecast proxy (`api/forecast.js`) and the Aurora decision weather fetch (`api/_lib/auroraDecision/openMeteo.js`) — share one host/credential selection helper, `api/_lib/openMeteoAuth.js`. This doc describes how to configure it and what happens when it is missing.

## Setting the key

Set `OPEN_METEO_API_KEY` in Vercel's **Environment Variables** project settings, scoped to whichever environment(s) you are configuring (Development / Preview / Production are separate scopes in Vercel — setting it in one does not set it in the others). **Changing or adding an environment variable requires a new deployment to take effect** — an already-running deployment does not pick up the change until it is redeployed.

This project never prefixes the variable with `VITE_`; it must never be bundled into client-side code, and it is not. See "Credential boundary" below for how that is verified.

## Per-environment status (owner-confirmed facts, not independently inspected by this doc)

| Environment | `OPEN_METEO_API_KEY` configured? | Source |
|---|---|---|
| Development | **Yes** | Owner-confirmed, 2026-10-20 |
| Production | **Yes** | Owner-confirmed, 2026-10-20 |
| Preview | **Unknown** | Not confirmed either way |

These are the owner's own reports, not something read from Vercel's dashboard or API by code or by whoever wrote this doc. Key **validity** (whether it still works, hasn't been rotated/revoked) and real request behavior against the customer host are **not verified** by this doc or by any automated test — see "Operational verification" below.

## What happens when the key is missing or blank

A key that is empty or made of only whitespace is treated as **missing**, never as a valid credential.

- **Key present (any environment):** both routes use `https://customer-api.open-meteo.com` with the key as the `apikey` query parameter.
- **Key missing, environment is Production** (detected via Vercel's own `VERCEL_ENV` system variable — see "Detection limits" below): the route **fails closed**. The campsite forecast proxy returns `502 { error: "forecast_error" }` with `Cache-Control: no-store`, without making any upstream request at all (one static, nonsecret diagnostic line is logged for that single request, naming the environment, never the key or a URL). The Aurora weather fetch returns the same structured per-location failure it already uses for any other weather problem (`weather_fetch_failed`) for every requested location, again without making any request — from the user's point of view this looks like an ordinary "forecast unavailable" outcome, not a distinguishable error. **The Aurora diagnostic is logged once per affected location, not once globally**: `fetchLocationWeather` runs independently per candidate location inside the existing bounded fan-out (up to 8 locations, across up to 3 nights per page load — see "Quota note" below), so a misconfigured deployment can log the same static, nonsecret diagnostic line that many times for a single page load, not a single consolidated line. This is read-only, pre-existing fan-out behavior; this ticket added no deduplication and made no change to how many locations are requested.
- **Key missing, environment is Preview, Development, or undefined** (plain local `npm run dev`/`vitest` runs, where `VERCEL_ENV` is never set): both routes fall back to the public `https://api.open-meteo.com` host, exactly as they did before this ticket. For Preview and Development specifically, a static, nonsecret warning is logged naming the environment, so a deployed-but-unconfigured environment is still visible in logs even though it keeps working.

**There is never a fallback to the public host after a keyed request fails** — a 401/403/429/5xx/timeout from the customer host is reported as the existing kind of failure (the same codes/shapes as any other upstream problem); it is not retried against the public host. If the key is later removed or rotated badly, Production forecasts become unavailable under this same fail-closed rule — this is the accepted, intended behavior (an explicit owner decision), not a bug to route around.

### Detection limits

The Production/Preview/Development distinction above relies on Vercel's platform-provided `VERCEL_ENV` system environment variable. That variable is only populated if this project has **"Enable access to System Environment Variables"** turned on in Project Settings → Environment Variables — **this project's own setting has not been verified** (an owner-side check, not something inspected here). If it were ever turned off, `VERCEL_ENV` would simply be undefined at runtime in every deployed environment, and the code would behave exactly like the "Preview/Development/undefined" case above everywhere, including in Production — i.e. it would silently stop failing closed in Production rather than failing closed everywhere. This is a known, documented limitation of relying on an opt-in platform variable, not a second environment policy the code adds on its own.

Plain local `node`/`vitest` runs never have `VERCEL_ENV` set either, and are treated the same as an un-configured Preview/Development deployment (public host, no warning — this is the expected, ordinary local case, not a misconfiguration).

## Development-only proxy exception

`vite.config.js`'s dev server (`npm run dev`, Vite alone) proxies `/api/forecast` directly to the public `api.open-meteo.com` host, bypassing this helper entirely — it was left unchanged by this ticket. Local campsite forecasts under plain `npm run dev` never use a key or the customer host, regardless of what is configured in Vercel. To exercise the real, shared selection logic locally, run the backend itself (e.g. `vercel dev`) instead of relying on this proxy. The Aurora decision endpoint is backend-only (no client-side route), so it always goes through the shared helper once the backend is actually running, in every context including local `vercel dev`.

## Credential boundary

The helper lives under `api/_lib/` (server-only) and is never imported from `src/`. A fresh production build's `dist/` output was searched and contains neither the customer host string nor any `apikey` handling — confirming the key and the customer-host selection never reach the browser bundle. See `docs/ai/tasks/ticket-453/cc-report.md` for the exact search commands and results.

## Operational verification (owner-side, not performed here)

The following remain genuinely unverified and require real account/environment access this implementation does not have or use:

- Whether the configured Production/Development keys are actually **valid** (not expired/revoked).
- Whether the customer host (`customer-api.open-meteo.com`) answers `wind_speed_unit=ms` requests with `hourly_units.windspeed_10m: "m/s"` identically to the public host — if it did not, the Aurora path's #452 wind-unit guard would null wind data (losing the comfort flag silently, never showing a wrong one) the first time the Aurora decision path runs against the keyed host in a real environment.
- Whether a real request against the customer host returns the same campsite-forecast response shape as the public host.
- Whether Preview actually has (or will have) a configured key, and if not, whether the resulting public-host fallback there is acceptable on an ongoing basis.

None of these should be read as "passed" from any test or mock in this repository — they require the owner (or whoever has Vercel/Open-Meteo account access) to check post-deployment.

## Quota note

The Aurora decision endpoint fans out to up to 8 locations per request, across three nights per page load (today + 2). Once the Aurora path uses the keyed customer host, this traffic draws on the paid plan's quota. No caching or request-volume change was made as part of this ticket.

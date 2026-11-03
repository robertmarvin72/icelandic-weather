# #485 — final probe, keyless request description (recorded before sending)

Written before any network attempt, per `approved-prompt-v10.md` step 1. Reuses `final-bounded-plan.md`'s six points, coordinates, order and variables unchanged — nothing recomputed or re-selected here.

## Decision: original window vs. next full UTC day

Current time at the moment this file was written: **2026-11-03T18:18:46Z** (checked via the local system clock, no network call). The originally planned window — `2026-11-04T00:00Z` through `2026-11-05T00:00Z` (exclusive), i.e. `start_hour=2026-11-04T00:00` / `end_hour=2026-11-04T23:00` — is still **entirely ahead** of now (starts in ~5h41m). Per the approved prompt's instruction ("use the original window only if it is still entirely ahead; otherwise the next full UTC calendar day"), the **original window is used, unchanged** from `final-bounded-plan.md` and the prior (failed-before-HTTP) attempt recorded in `final-bounded-result.json`.

## Endpoint

`GET https://customer-api.open-meteo.com/v1/forecast`

## Six points (unchanged coordinates and request order, from `final-bounded-plan.md`)

| # | Latitude | Longitude | IDBUTUR (selection reference only) |
|---|---|---|---|
| 1 | 64.01137995 | -21.25070175 | 252090037 |
| 2 | 63.96197548 | -21.11948637 | 902030037 |
| 3 | 63.90527541 | -20.59094600 | 901130037 |
| 4 | 63.82344501 | -20.36083533 | 901230037 |
| 5 | 63.54962230 | -19.76249937 | 901210037 |
| 6 | 63.41954011 | -19.00662528 | 801100037 |

Sent as one request, six coordinates each in `latitude`/`longitude` (comma-joined, in the table order above) — not six separate calls.

## Variables and units (all five, unchanged)

| Variable | Unit |
|---|---|
| `temperature_2m` | °C (`temperature_unit=celsius`) |
| `wind_speed_10m` | m/s (`wind_speed_unit=ms`) |
| `wind_gusts_10m` | m/s (same unit param) |
| `precipitation` | mm (`precipitation_unit=mm`), hourly amount per the provider, not an instantaneous rate |
| `weather_code` | WMO code (no unit) |

`hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code`

## UTC window

`timezone=UTC`, `start_hour=2026-11-04T00:00`, `end_hour=2026-11-04T23:00` — a 24-hour interval `[2026-11-04T00:00Z, 2026-11-05T00:00Z)`, sampled at 24 hourly instants. Default model selection; no IG/local-model claim.

## Execution constraints (restated from the approved prompt, not re-derived)

One direct customer request, no retry/redirect/fallback; `redirect: "error"`; 30 s total timeout; 1 MiB maximum retained response; standard TLS; key read only from the current process environment or a single `OPEN_METEO_API_KEY=` line in `.env.local`, held only in memory, never logged, never in a CLI argument, never in this or any other document. Node's own built-in `fetch`, one-shot inline script, not a saved helper. The Vite `/api/forecast-proxy` dev route is deliberately NOT used (per #453, it forwards to the public host, not the customer host).

## Planned execution time

Immediately following this file being written, in the same session, no delay.

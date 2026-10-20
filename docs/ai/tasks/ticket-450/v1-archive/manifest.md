# Ticket #450 — samples manifest

All requests below were made with `curl`/Node built-ins only (no new dependencies), explicit public URLs only (never `customer-api.open-meteo.com`, never an API key), a descriptive `User-Agent: EltumVedridResearch/1.0 (ticket-450 research; contact: research-only)`, and retrieval timestamps in UTC. Secret-grep audit (see `cc-report.md`) found zero matches for `apikey`/`api_key`/`Authorization`/`Cookie`/`Bearer`/`token` in any file below. Retention basis is noted per source's actual terms (not assumed).

| File | Source | Fetch time (UTC) | Actual vs documented example | Redactions | SHA256 |
|---|---|---|---|---|---|
| `openmeteo-baseline-4point.json` | `api.open-meteo.com/v1/forecast` — public endpoint, app-equivalent request (same daily/hourly fields, units, `timezone=Atlantic/Reykjavik` as `src/lib/forecastCache.js`), bundled as one request for 4 locations (comma-separated lat/lon) | 2026-10-19 17:47:22Z (response `Date` header) | Actual live data, not a documented example | None (public, unauthenticated) | `035e26676f2d54a58db5c24436f99850cf5e0afdd3759a40e7834f6566ebf0cd` |
| `openmeteo-baseline-headers.txt` | Response headers for the above request | 2026-10-19 17:47:22Z | Actual | None | `76089c4ec503d2a56d804c809311c5f2ca82ddb28cf57c66eea5fe319ea7b364` |
| `openmeteo-dmi-seamless-experiment.json` | `api.open-meteo.com/v1/forecast?models=dmi_seamless` — single point (Keflavík), explicit-model experiment, separate from the baseline per H3.1 | 2026-10-19 (same session, immediately after baseline) | Actual live data | None | `234b7c9849f58d0fc20344250f795d5707043bfb7b67dbd429139ff3f5e4900a` |
| `vedur-openapi.json` | `api.vedur.is/weather/openapi.json` — full OpenAPI 3.1 spec (catalog/docs request, not counted against the 2-data-request budget) | 2026-10-19 (same session) | Actual, current spec (`info.version: "2026-02-17"`) | None | `0359db043464be96e9f176a857cb961c8e6e31bc90862d87ccbfde30879d0406` |
| `vedur-parameters-aws-hour.json` | `api.vedur.is/weather/parameters?url=/observations/aws/hour&locale=en` — parameter/unit catalog for one endpoint | 2026-10-19 (same session) | Actual | None | `f1b0fd06228e372d51fb9afaf3f1a4b86572f7169033180662384cb71524cfe3` |
| `vedur-station-1350.json` | `api.vedur.is/weather/stations?station_id=1350` — station metadata (data request 1 of 2 for this product) | 2026-10-19 (same session) | Actual | None | `cd6b6548d2fb7c282379d6c062ac482202f89441e864688f4add3c2e1b9f35e0` |
| `vedur-obs-1350-20261018.json` | `api.vedur.is/weather/observations/aws/hour?station_id=1350&parameters=all&format=json&day_from=2026-10-18&day_to=2026-10-18` — one day of hourly observations (data request 2 of 2 for this product) | 2026-10-19 17:46:56Z (response `Date` header) | Actual live data | None | `82e372bceade5555f904513e9169614d18e9425ab3925bcb44df409d08f485fb` |
| `vedur-obs-headers.txt` | Response headers for the above request | 2026-10-19 17:46:56Z | Actual | None | `ffb72a84cf68f9d306559ce0b3d99fba346cea8ffc840653a08187dbad9d4b79` |

## Retention basis

- **Open-Meteo**: samples retained per Open-Meteo's own published terms (attribution required for non-commercial/commercial free tier; see `source-register.md`). No account, no API key used (public `api.open-meteo.com` host only, per H2 — never `customer-api.open-meteo.com`).
- **Veðurstofa Íslands (`api.vedur.is`)**: the API's own OpenAPI spec declares `"license": {"name": "Attribution 4.0 International (CC BY 4.0)", "url": "https://creativecommons.org/licenses/by/4.0/"}` (see `vedur-openapi.json`, `info.license`) — retention and redistribution with attribution is explicitly permitted.

## Request budget accounting (H3.1/H3.4)

- Open-Meteo: 1 bundled baseline request (4 points, counted as the "baseline sample") + 1 explicit-`models` experiment request (1 point) = within the "at most 4 points and 2 data requests" bound, bundling disclosed here as instructed.
- `api.vedur.is`: `openapi.json` and `parameters` are catalog/docs requests (kept separate per H3.1); `stations` and `observations/aws/hour` are the 2 data requests for this candidate product.
- No DMI HARMONIE IG/DINI GRIB sample was retrieved live (see `cc-report.md` for why — documentation-only evidence for DMI, graded accordingly in `provider-matrix.csv`).
- No requests were retried after a 429; none were encountered.

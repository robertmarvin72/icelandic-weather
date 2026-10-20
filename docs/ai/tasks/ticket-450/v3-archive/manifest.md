# Ticket #450 — samples manifest

**v2 (leiðrétt/corrected).** v1 preserved byte-identically in `v1-archive/manifest.md`; the eight original sample bodies/headers below are **unchanged** (same SHA256 as v1 — verified before/after in `cc-report.md`). This version adds the two columns J6 requires (original public URL, retrieval UTC, each labelled EXACT / RECONSTRUCTED / UNKNOWN) and two new, separately-logged catalog files from this round.

All requests were made with `curl`/Node built-ins only (no new dependencies), explicit public URLs only (never `customer-api.open-meteo.com`, never an API key), a descriptive `User-Agent: EltumVedridResearch/1.0 (ticket-450 research; contact: research-only)`. Secret-grep audit (see `cc-report.md`) found zero matches for `apikey`/`api_key`/`Authorization`/`Cookie`/`Bearer`/`token` in any file below. Retention basis is noted per source's actual terms (not assumed).

**EXACT** = the URL/time is recoverable verbatim from this CC session's own retained commands/outputs. **RECONSTRUCTED** = inferred from the session's own command sequencing, with stated reasoning and confidence — never invented. **UNKNOWN** = not recoverable from retained session evidence; never a guess presented as fact. A response `Date` header is the upstream server's response time, not an independently logged local retrieval clock — labelled as such throughout.

## Original 8 files (v1, byte-identical, unchanged)

| File | Original public URL | URL grade | Retrieval UTC | UTC grade | SHA256 |
|---|---|---|---|---|---|
| `openmeteo-baseline-4point.json` | `https://api.open-meteo.com/v1/forecast?latitude=63.9828987122,66.0750,64.8667,65.2669&longitude=-22.6005191803,-23.1200,-19.5667,-14.3948&timezone=Atlantic%2FReykjavik&temperature_unit=celsius&windspeed_unit=ms&precipitation_unit=mm&forecast_days=7&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant&hourly=temperature_2m,weathercode,precipitation,precipitation_probability,windspeed_10m,windgusts_10m,cloudcover,cloudcover_low,cloudcover_mid,cloudcover_high,visibility` | EXACT (verbatim `curl` command retained in this CC session) | 2026-10-19 17:47:22Z | EXACT (response `Date` header, server time) | `035e26676f2d54a58db5c24436f99850cf5e0afdd3759a40e7834f6566ebf0cd` |
| `openmeteo-baseline-headers.txt` | same as above | EXACT | 2026-10-19 17:47:22Z | EXACT (server time) | `76089c4ec503d2a56d804c809311c5f2ca82ddb28cf57c66eea5fe319ea7b364` |
| `openmeteo-dmi-seamless-experiment.json` | `https://api.open-meteo.com/v1/forecast?latitude=63.9828987122&longitude=-22.6005191803&timezone=Atlantic%2FReykjavik&temperature_unit=celsius&windspeed_unit=ms&precipitation_unit=mm&models=dmi_seamless&hourly=temperature_2m,windspeed_10m` | EXACT (verbatim `curl` command retained in this CC session) | 2026-10-19, shortly after 17:47:22Z | RECONSTRUCTED (high confidence: issued in the immediately-following tool call of the same turn, no delay between commands; no `Date` header was captured for this specific request) | `234b7c9849f58d0fc20344250f795d5707043bfb7b67dbd429139ff3f5e4900a` |
| `vedur-openapi.json` | `https://api.vedur.is/weather/openapi.json` | EXACT (verbatim `curl` command retained in this CC session) | 2026-10-19, before 17:46:56Z | RECONSTRUCTED (sequenced before `vedur-obs-1350-20261018.json`, whose `Date` header is 17:46:56Z, within the same short run of tool calls; exact minute not captured since no `-D` header dump was requested for this call) | `0359db043464be96e9f176a857cb961c8e6e31bc90862d87ccbfde30879d0406` |
| `vedur-parameters-aws-hour.json` | `https://api.vedur.is/weather/parameters?url=/observations/aws/hour&locale=en` | EXACT (verbatim `curl` command retained in this CC session) | 2026-10-19, before 17:46:56Z | RECONSTRUCTED (same reasoning as above; sequenced after `vedur-openapi.json`, before the station/obs calls) | `f1b0fd06228e372d51fb9afaf3f1a4b86572f7169033180662384cb71524cfe3` |
| `vedur-station-1350.json` | `https://api.vedur.is/weather/stations?station_id=1350` | EXACT (verbatim `curl` command retained in this CC session) | 2026-10-19, immediately before 17:46:56Z | RECONSTRUCTED (same reasoning; the next call in sequence is the `Date`-stamped observations request) | `cd6b6548d2fb7c282379d6c062ac482202f89441e864688f4add3c2e1b9f35e0` |
| `vedur-obs-1350-20261018.json` | `https://api.vedur.is/weather/observations/aws/hour?station_id=1350&parameters=all&format=json&day_from=2026-10-18&day_to=2026-10-18` | EXACT (verbatim `curl` command retained in this CC session) | 2026-10-19 17:46:56Z | EXACT (response `Date` header, server time) | `82e372bceade5555f904513e9169614d18e9425ab3925bcb44df409d08f485fb` |
| `vedur-obs-headers.txt` | same as above | EXACT | 2026-10-19 17:46:56Z | EXACT (server time) | `ffb72a84cf68f9d306559ce0b3d99fba346cea8ffc840653a08187dbad9d4b79` |

## New files (v2 correction round)

| File | Original public URL | URL grade | Retrieval UTC | UTC grade | SHA256 |
|---|---|---|---|---|---|
| `vedur-stations-all-v2.json` | `https://api.vedur.is/weather/stations` (all stations, no filter — one catalog request per J4/J6's budget) | EXACT | 2026-10-19 18:10:46Z | EXACT (response `Date` header, server time) | see `cc-report.md` v2 hash table |
| `vedur-stations-all-v2-headers.txt` | same as above | EXACT | 2026-10-19 18:10:46Z | EXACT (server time) | see `cc-report.md` v2 hash table |

`research-tools/compare-baseline-vs-dmi-seamless.mjs` + its saved `.output.txt`, and `research-tools/nearest-station-distance.mjs` + its saved `.output.txt`, are not network samples — they are local calculations reading only the already-retained files above, included for reproducibility (J3/J4).

## Retention basis

- **Open-Meteo**: samples retained per Open-Meteo's own published terms (attribution required for non-commercial/commercial free tier; see `source-register.md`). No account, no API key used (public `api.open-meteo.com` host only, per H2 — never `customer-api.open-meteo.com`).
- **Veðurstofa Íslands (`api.vedur.is`)**: the API's own OpenAPI spec declares `"license": {"name": "Attribution 4.0 International (CC BY 4.0)", "url": "https://creativecommons.org/licenses/by/4.0/"}` (see `vedur-openapi.json`, `info.license`) — retention and redistribution with attribution is explicitly permitted.

## Request budget accounting (H3.1/H3.4/J6)

- Open-Meteo: 1 bundled baseline request (4 points, counted as the "baseline sample") + 1 explicit-`models` experiment request (1 point) = within the "at most 4 points and 2 data requests" bound, bundling disclosed here as instructed. No new Open-Meteo request was made in the v2 correction round (J6: "no weather/observation/GRIB data request is made in this correction").
- `api.vedur.is` v1 round: `openapi.json` and `parameters` were catalog/docs requests (kept separate per H3.1); `stations?station_id=1350` and `observations/aws/hour` were the 2 data requests for this candidate product.
- `api.vedur.is` v2 round: exactly one additional, separately-named, separately-logged catalog request (`GET /weather/stations`, all stations) per J4's explicit allowance — not counted against the original 2-data-request budget, and not used to back-date or replace any v1 sample.
- No DMI HARMONIE IG/DINI GRIB sample was retrieved live, in either round (see `cc-report.md` for why — documentation-level evidence for DMI, graded accordingly in `provider-matrix.csv`).
- No requests were retried after a 429; none were encountered in either round.

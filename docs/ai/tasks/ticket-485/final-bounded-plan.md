# #485 — final bounded research, frozen before customer request

Owner explicitly authorised execution in chat on 2026-11-03, overriding the earlier cancelled client's review/execution route for this single research action. No implementation/publication authority. No old client imported or modified. CURRENT's CANCELLED refers to that abandoned branch.

Scope: latest reported road conditions/closures with source/data time, plus forecasts at six selected points at a user-selected hourly time. No road-condition forecast, ETA, arrival-time weather, continuous route coverage, safety verdict, observations, DMI or SafeTravel. Road chain starts at Rauðavatn; Reykjavík urban approach is excluded.

## Frozen points (WGS84, latitude then longitude)

Coordinates are actual retained vertices from ticket-483/samples/wfs-chain-4326.json, selected from their IDBUTUR feature; research point selection, not a claim of whole-section representativeness. Requested point and returned forecast grid coordinates must be distinguished.

| Point | Section represented for selection | IDBUTUR | Latitude | Longitude |
|---|---|---|---|---|
| P1 | Rauðavatn–Sandskeið–western Hellisheiði | 252090037 | 64.01137995 | -21.25070175 |
| P2 | Eastern Hellisheiði–Hveragerði–Selfoss | 902030037 | 63.96197548 | -21.11948637 |
| P3 | Selfoss–Þjórsá–Hella | 901130037 | 63.90527541 | -20.59094600 |
| P4 | Hella–Hvolsvöllur | 901230037 | 63.82344501 | -20.36083533 |
| P5 | Hvolsvöllur–Skógar | 901210037 | 63.54962230 | -19.76249937 |
| P6 | Skógar–Vík | 801100037 | 63.41954011 | -19.00662528 |

## One request and acceptance

GET https://customer-api.open-meteo.com/v1/forecast, six coordinates in one request; API key read privately from .env.local, never recorded. Standard Python urllib.request library (requests is not installed; initial import failed before any request or result file), no custom research client, no retries, redirects disabled, default TLS verification, timeout 30 seconds, maximum retained response 1 MiB. No public-host fallback. One HTTP exchange can count as multiple billable location calls.

hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code

temperature_unit=celsius; wind_speed_unit=ms; precipitation_unit=mm; timezone=UTC; start_hour=2026-11-04T00:00; end_hour=2026-11-04T23:00. This is a 24-hour interval [2026-11-04T00:00Z,2026-11-05T00:00Z), sampled at 24 hourly instants. Precipitation is the provider's hourly quantity, not an instantaneous rate. Default model selection; no IG/local-model claim.

PASS requires HTTP 200; exactly six location results in request order; each has all 24 exact UTC timestamps, timezone offset zero, all five arrays of length 24 with finite numeric non-null values, and matching units (°C, m/s, m/s, mm, WMO code). Returned grid coordinates/elevation retained. Any absent variable/time/unit or unexplained gap fails the sample. Record outcome and stop without repair/retry.

## Rights assessment before request

Reviewed 2026-11-03, reusing retained #483/#485 evidence plus official pages via web open:

- https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/skilmalar-vefthjonustur — general scope expressly covers road-condition data on data servers unless separately excluded; CC BY 4.0. Applied to faerd2017_1 and faerdpunktar2017_1 as reasoned scope interpretation, not bespoke endpoint permission. No contrary per-service restriction found in retained technical sources. Structured condition/closure facts included; do not reproduce protected reports, logos or third-party content. Retained third-party free-text notices require exclusion unless their rights are established. Attribute Vegagerðin, dataset, acquisition date, CC BY 4.0; distinguish transformations; no endorsement. Official closures override automatic/old records. Availability/accuracy not guaranteed.
- https://open-meteo.com/en/pricing and https://open-meteo.com/en/terms — paid subscription permits commercial use at customer endpoint; API data CC BY 4.0. Reuse owner-reported API Standard (#453 and owner-clarification-2026-11-02.md). Attribute Open-Meteo, source/licence links and modifications; temporary caching and display of attributed API data supported by that licence. No sharing key/service credentials, no public-host fallback. No current quota/headroom or production-runtime acceptance claimed.

Conclusion: rights support this restricted factual display and this paid probe, subject to those obligations. HTTPS evidence for road feeds reused unchanged, no road-service requests authorised or made here.

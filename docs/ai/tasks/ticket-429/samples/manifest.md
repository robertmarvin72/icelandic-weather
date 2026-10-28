# #429 — Samples manifest (data ledger)

All new requests in this round, per J2/J6. Reused #450 samples (11 files, unchanged, cited by their own existing manifest/hashes) are **not** repeated here and do not count against this ledger. All requests used `curl` (no new dependency), public hosts only, no key/account, `User-Agent: EltumVedridResearch/1.0 (ticket-429 research; contact: research-only)`, ≤10s timeout, ≤2 attempts per failed endpoint. Acquisition time = the response's own `Date` header (server time, EXACT) where present.

## Data ledger (cap 30 requests / 20 MiB transferred)

| # | Purpose | URL | UTC acquired | HTTP | Content-Type | Bytes | SHA256 | Parser/transform |
|---|---|---|---|---|---|---|---|---|
| 1 | Size-probe, road-state feed (HEAD attempt; method not allowed, still a real exchange) | `http://gagnaveita.vegagerdin.is/api/faerd2017_1` | 2026-10-27T19:08:18Z | 405 | application/json | 0 (body), 73 (server's own reported Content-Length for its error body) | n/a (no body saved) | — |
| 2 | Road-state feed, all currently-serviced segments nationwide | `http://gagnaveita.vegagerdin.is/api/faerd2017_1` | 2026-10-27T19:08:28Z | 200 | application/json | 360,322 | `a3134394ce378a5b413f89784ba2642c6520b1fcb6a9237db389ac97ff789bbb` | `node -e` ad hoc filter by `StuttNafnButs`/`FulltNafnButs` substring match against corridor place names |
| 3 | WFS `GetCapabilities` for the geometry service (catalog/schema probe, logged here since it targets the data service directly, not a documentation page) | `https://gagnaveita.vegagerdin.is/geoserver/gis/ows?service=WFS&version=1.0.0&request=GetCapabilities` | 2026-10-27T19:09:32Z | 200 | text/xml | 38,062 | `3cf532e4b973cf13b0841a04331620e7ef42808679b2154024a228a17bf97e1b` | grep for `faerdferlar2017_1`/`faerdpunktar2017_1` FeatureType blocks |
| 4 | WFS `DescribeFeatureType` for `gis:faerdferlar2017_1` (schema probe) | `https://gagnaveita.vegagerdin.is/geoserver/gis/ows?service=WFS&version=1.0.0&request=DescribeFeatureType&typeName=gis:faerdferlar2017_1` | 2026-10-27T19:10:10Z | 200 | application/xml (xsd) | 3,481 | `43b3e98407e9a9ed7cb30c395fde5882001f685451808d832606308d190b7b98` | read for real attribute names (`IDBUTUR`, `SHAPE` as `gml:LineStringPropertyType`, SRS EPSG:3057) |
| 5 | WFS `GetFeature`, Route A geometry, filtered to 9 real `IDBUTUR` values found in sample #2 | `https://gagnaveita.vegagerdin.is/geoserver/gis/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gis:faerdferlar2017_1&outputFormat=application/json&CQL_FILTER=IDBUTUR IN (902020037,252090037,910330037,902030037,901130037,901230037,901220037,124200037,801100037)` | 2026-10-27T19:10:26Z | 200 | application/json | 133,921 | `9b8403a2498648c3c0025e1f881c313d16bec0992f318f2ccc51a6f9bdeba997` | `node -e` — counted features (108), grouped by `IDBUTUR`, read coordinate ranges per group |
| 6 | DATEX II `MeasurementSiteTablePublicationService` (station/site metadata, all sites) | `https://datex.vegagerdin.is/measurementsitetablepublication3_1/MeasurementSiteTablePublicationService/pullsnapshotdata` | 2026-10-27T19:12:37Z | 200 | application/xml | 739,625 | `3840b2e0cdb6bbf96bf57f15f90d372a537cc072e9fa684f581d02239d9e0923` | regex extraction of `measurementSite id=...measurementSiteName` pairs, matched against corridor names |
| 7 | DATEX II `RoadConditionService` (current road-condition situations) | `https://datex.vegagerdin.is/situationpublication3_1/RoadConditionService/pullsnapshotdata` | 2026-10-27T19:12:43Z | 200 | application/xml | 422,216 | `4d20e82dde8e189cde600411e85e388d167e5303f0696134f97b39e408981bfe` | read raw for `locationReference`/`predefinedLocationReference` ID structure |
| 8 | DATEX II `PredefinedLocationsPublicationService` — **attempt 1** | `https://datex.vegagerdin.is/predefinedlocationspublication3_1/PredefinedLocationsPublicationService/pullsnapshotdata` | 2026-10-27 (no response; timed out) | 000 | — | 0 | — | — |
| 9 | DATEX II `PredefinedLocationsPublicationService` — **attempt 2 (final, verbose diagnostic)** | same URL | 2026-10-27 (no response; `curl: (28) Operation timed out after 10006 milliseconds`) | 000 | — | 0 | — | — |
| 10 | DATEX II `MeasureDataService` (real-time measurement values) | `https://datex.vegagerdin.is/measureddatapublication3_1/MeasureDataService/pullsnapshotdata` | 2026-10-27T19:13:55Z | 200 | application/xml | 653,991 | `5bdb28a864c93353502ee8edfe58a389590ece113b51360538d82afce8c4a860` | located `IRCA_MP_1` (Hellisheiði) block; read `airTemperature`/`roadSurfaceTemperature`/`measurementTimeDefault` values |
| 11 | Veðurstofa observations, station 31392 (Hellisheiði), today only | `https://api.vedur.is/weather/observations/aws/hour?station_id=31392&parameters=all&format=json&day_from=2026-10-27&day_to=2026-10-27` | 2026-10-27T19:14:53Z | 200 | application/json | 12,447 | `839d6c91f7365edae655541fe79e07328f6de755755581d7c0f644a8153c1169` | read first rows for field availability/nulls, same method as #450 |
| 12 | Open-Meteo forecast, Route A checkpoints (Hellisheiði, Selfoss, Hella, Vík í Mýrdal — 4 points, bundled as 1 request per J3) | `https://api.open-meteo.com/v1/forecast?latitude=64.0187835693,63.9355010986,63.8256797791,63.4224205017&longitude=-21.3423805237,-20.9706707001,-20.3653793335,-19.0018806458&timezone=Atlantic%2FReykjavik&...&forecast_days=3&daily=...&hourly=...` (full query in header file) | 2026-10-27T19:15:25Z | 200 | application/json | 19,724 | `5994824f83994c2eb497ad69d772271c3939d2a9fe7f8c021c836ea8f3ef6e11` | `node -e` — confirmed 4 independent point series present |
| 13 | Open-Meteo forecast, Route B checkpoints (Holtavörðuheiði, Blönduós, Öxnadalsheiði, Akureyri, Vatnsskarð — 5 points, bundled) | same host/pattern as #12, 5-point latitude/longitude list | 2026-10-27T19:15:38Z | 200 | application/json | 24,830 | `509c195f503fa394112f1d516051c04b9b8d0acae74057b2689ea02174ae9011` | same as #12 |
| 14 | Open-Meteo forecast, Route C checkpoints (Kjalarnes, Borgarnes — 2 points, bundled) | same host/pattern, 2-point list | 2026-10-27T19:15:39Z | 200 | application/json | 9,906 | `82a3c3d91852a9a0784fe95b65bdedb95b7a9b78d117a16a0900726ab31e77b8` | same as #12 |

**Totals: 14 logged network exchanges (12 succeeded, 2 were the two allowed attempts at one endpoint that both failed), ≈2.4 MB of data-ledger bytes transferred.** Well under the 30-request / 20 MiB cap, with 16 requests and ~17.6 MiB of reserve genuinely unused.

## Documentation/catalog ledger (cap 20 requests / 10 MiB transferred)

| # | Purpose | URL | UTC acquired | HTTP | Bytes | SHA256 |
|---|---|---|---|---|---|---|
| 1 | Road-state data-format documentation (IdButur/DagsSkrad/DagsKeyrtUt/AstandYfirbord/AstandVidbotaruppl schema, prose) | `https://www.vegagerdin.is/vegagerdin/gagnasafn/faerd-gagnasnid` | 2026-10-27T19:06:35Z | 200 | 170,810 | `79e03f7c4f54c2efabbb409d279489e45c0160d9800464688844805fa6ff1b23` |
| 2 | Web-services index page | `https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/vefthjonustur` | 2026-10-27T19:06:44Z | 200 | 154,027 | `edbb3b2db6f499399b2771cba45e764264ba361725f186f9412e468474e46f23` |
| 3 | DATEX II service index page | `https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/datexii-2` | 2026-10-27T19:06:44Z | 200 | 154,947 | `b8da0dda1197061bbde52fc57be30c33cb34d882cb1381b910af6f7b84b0a3d6` |
| 4 | DATEX II specification PDF (service URLs, WSDL, schema links) | `https://www.vegagerdin.is/media/2024/03/irca_datexii_3_1_specification.pdf` | 2026-10-27T19:11:52Z | 200 | 401,858 | `d850e620c496ff00dae10d5ba593e6b86a07d3a781862e9bcd625c53fc035d0b` |

(WFS `GetCapabilities`/`DescribeFeatureType` above are logged in the **data** ledger per J6, since they query the live geometry service directly rather than a separate documentation page — this is a judgment call, disclosed here rather than hidden either way.)

**Totals: 4 documentation requests, ≈790 KB transferred.** Well under the 20-request / 10 MiB cap, with 16 requests and ~9.2 MiB of reserve unused.

## Failed/blocked attempts (not hidden)

- **DATEX II `PredefinedLocationsPublicationService`**: both allowed attempts timed out after 10s with zero bytes received (`curl: (28)`). This is the one named DATEX service this round could not retrieve a live sample from — recorded as a blocker for the "DATEX road-condition-section geometry" sub-capability specifically (see `research-report.md` §4). The other four DATEX services (RoadCondition, MeasurementSiteTable, MeasuredData) all succeeded on the first attempt from the same base host, so this is not evidence the whole DATEX platform is unreachable — only this one service, at this one time.

## Retention basis

- **Vegagerðin** (`vegagerdin.is`, `gagnaveita.vegagerdin.is`, `datex.vegagerdin.is`): no licence/terms text was found on the fetched pages stating reuse conditions for the road-state/geometry/DATEX data itself (the fetched documentation describes the data's *schema*, not its *redistribution terms*). This is recorded as **UNKNOWN**, not assumed-open — see `source-register.md`.
- **Veðurstofa Íslands** (`api.vedur.is`): per #450's own retained finding, the API's OpenAPI spec declares CC BY 4.0 — reused here, not re-verified in this round (the licence text itself was not re-fetched).
- **Open-Meteo**: per #450's retained finding — attribution-required, public host only, no key.

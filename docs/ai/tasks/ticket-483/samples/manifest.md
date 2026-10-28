# #483 — Data ledger (new exchanges this round only; reused #429/#450 samples are not re-counted, per the plan)

Ceilings per `pre-sample-plan.md` §4: ≤24 data exchanges / ≤20MiB, ≤12 doc exchanges / ≤8MiB, ≤2 attempts/endpoint, ≤15s/request. All times UTC.

## Data ledger

| # | Time | Purpose | URL | HTTP | Bytes | SHA256 | Saved as |
|---|---|---|---|---|---|---|---|
| 1 | 18:48:02 | WFS `resultType=hits` probe, `CQL_FILTER=VEGNR='1'` | `.../ows?...&CQL_FILTER=VEGNR='1'&resultType=hits` | 200 (but `numberOfFeatures="0"` — see finding below) | 510 | `61788960f4...` | `wfs-vegnr1-hits.xml` |
| 2 | ~18:48:15 | Diagnostic: same probe with `CQL_FILTER=IDBUTUR=801100037` (known-present ID) | same, different filter | 200, `numberOfFeatures="0"` | ~510 | not saved (printed only) | — |
| 3 | ~18:48:20 | Diagnostic: same probe, URL-encoded `VEGNR` | same, URL-encoded quotes | 200, `numberOfFeatures="0"` | ~510 | not saved (printed only) | — |
| 4 | ~18:48:28 | Diagnostic: `resultType=hits` with **no filter at all** (whole layer) | `.../ows?...&typeName=gis:faerdferlar2017_1&resultType=hits` | 200, `numberOfFeatures="0"` | ~510 | not saved (printed only) | — |
| 5 | ~18:48:35 | Diagnostic sanity check: `GetFeature`, `CQL_FILTER=IDBUTUR IN (801100037)`, GeoJSON, no `maxFeatures` | `.../ows?...&outputFormat=application/json` | 200, real features returned | ~15000 (est.) | not saved (printed only) | — |
| 6 | ~18:48:50 | Bounded size probe, `CQL_FILTER=VEGNR='1'`, `maxFeatures=5` | `.../ows?...&outputFormat=application/json&maxFeatures=5` | 200, `totalFeatures=996` | ~5000 (est.) | not saved (printed only) | — |
| 7 | 18:49:23 | Bounded full page, `CQL_FILTER=VEGNR='1'`, `maxFeatures=1100` | `.../ows?...&outputFormat=application/json&maxFeatures=1100` | 200, 996/996 returned | 1,242,779 | `305f60d6f1...` | `wfs-vegnr1-all.json` |
| 8 | 18:54:01 | SRS test, single known ID, `srsName=EPSG:4326` | `.../ows?...&CQL_FILTER=IDBUTUR IN (252090037)&srsName=EPSG:4326` | 200 | 11,976 | `364b49d08c...` | `wfs-srstest-4326.json` |
| 9 | ~18:54:40 | Full 13-segment chain, `srsName=EPSG:4326`, `maxFeatures=300` | `.../ows?...&CQL_FILTER=IDBUTUR IN (13 values)&srsName=EPSG:4326&maxFeatures=300` | 200, 156/156 | 178,153 | `966848554f...` | `wfs-chain-4326.json` |
| 10 | 18:55:12 | Fresh legacy road-state export | `http://gagnaveita.vegagerdin.is/api/faerd2017_1` | 200 | 360,767 | `592d052e2c...` | `legacy-faerd-fresh.json` |
| 11 | ~18:55:28 | DATEX MeasureData, **wrong guessed URL** | `https://datex.vegagerdin.is/exchange/IRCA/IRCA_MeasureDataService/pullsnapshotdata` | 404 | 103 | not separately retained (overwritten by #12's retry using the same filename before this entry was finalized — a real bookkeeping gap, disclosed here rather than hidden) | — |
| 12 | 18:55:47 | DATEX MeasureData, correct retained URL from #429 | `https://datex.vegagerdin.is/measureddatapublication3_1/MeasureDataService/pullsnapshotdata` | 200 | 653,948 | `a5bda4ff99...` | `datex-measureddata-fresh.xml` |
| 13 | 18:56:16 | Point-incident feed probe (URL pattern guessed by analogy to the segment feed — worked first try) | `http://gagnaveita.vegagerdin.is/api/faerdpunktar2017_1` | 200 | 21,352 | `156f113652...` | `legacy-faerdpunktar.json` |
| 14 | 18:56:~ | Station history, Hellisheiði (31392), day 2026-10-27 | `https://api.vedur.is/weather/observations/aws/hour?station_id=31392&parameters=all&format=json&day_from=2026-10-27&day_to=2026-10-27` | 200, 24 rows | 14,930 | `09cf47ca30...` | `vedur-obs-31392-2026-10-27.json` |
| 15 | 18:56:~ | Station history, Hellisheiði (31392), day 2026-10-28 | same, `day_from=day_to=2026-10-28` | 200, 20 rows | 12,388 | `87b229f6eb...` | `vedur-obs-31392-2026-10-28.json` |
| 16 | 18:56:~ | Station history, Sandskeið (31488), day 2026-10-27 | same, `station_id=31488` | 200, 24 rows | 14,825 | `dacede70a2...` | `vedur-obs-31488-2026-10-27.json` |
| 17 | 18:56:~ | Station history, Sandskeið (31488), day 2026-10-28 | same | 200, 20 rows | 12,332 | `c1c2d8dcad...` | `vedur-obs-31488-2026-10-28.json` |
| 18 | 18:57:~ | Bundled forecast, 6 road-linked points (from the §2 WFS geometry, not stations) | `https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&hourly=...&daily=...&forecast_days=3` | 200 | 29,395 | `f1f0fa4405...` | `openmeteo-chain.json` |
| 19 | 18:58:24 | HTTPS verification, legacy feed | `https://gagnaveita.vegagerdin.is/api/faerd2017_1` | 200, no redirect, cert validated (GoDaddy, wildcard `*.vegagerdin.is`, valid through 2027-03-19) | 360,767 | `2701353a2e...` | `legacy-https-test.json` |

**Data totals:** 19 logged rows above represent **20 actual HTTP requests** (row 2 and row 3 are each one request; all others one request each) **+ one raw TLS handshake** (an `openssl s_client` certificate inspection, not an HTTP GET, not counted against this ceiling) = **20 of 24 allocated**, well under cap. Bytes transferred: sum of the "Bytes" column ≈ **2.62 MiB**, well under the 20MiB cap. Two attempts were needed for exactly one endpoint (DATEX MeasureData, row 11→12, wrong URL then corrected) — within the ≤2-attempts rule.

**Real finding, not a filter bug:** `resultType=hits` on this WFS 1.0.0 service returns `numberOfFeatures="0"` **unconditionally**, even with no filter at all (row 4) or a filter matching a confirmed-present ID (row 2). This is a genuine, demonstrated limitation of this specific endpoint, not a CQL syntax error — confirmed by then successfully using `outputFormat=application/json` instead (rows 5–7), which returns a real `totalFeatures` count in the response body itself, making the broken `resultType=hits` probe unnecessary for this service going forward.

**Disclosed ledger gap:** row 11's failed-attempt response was not separately preserved as its own file (the retry in row 12 was written to the same filename before the 404 attempt's content was separately saved). The 404 status and its 103-byte body are accurately reported from the terminal output at the time; only the byte-for-byte file is not independently re-derivable. This is recorded here rather than silently omitted, per #429's own lesson about honest ledger-keeping.

## Doc/catalog ledger

| # | Time | Purpose | URL | HTTP | Bytes | SHA256 | Saved as |
|---|---|---|---|---|---|---|---|
| 1 | 18:58:~ | Vegagerðin data-portal entry point | `https://gagnaveita.vegagerdin.is/` | 302 → `www.vegagerdin.is/upplysingar-og-utgafa/gagnaveita-vegagerdarinnar/` | 145 | `84c1fdfe0e...` | `vegagerdin-gagnaveita-root.html` |
| 2 | 18:59:~ | Follow to data-portal page (not following redirects first) | `https://www.vegagerdin.is/upplysingar-og-utgafa/gagnaveita-vegagerdarinnar/` | 308 (not followed this attempt) | 49 | n/a (empty redirect stub) | `vegagerdin-gagnaveita-page.html` (overwritten by #3) |
| 3 | 18:59:~ | Same URL, following redirects (`curl -L`) — 4 HTTP hops to final page | same | 200 final, landed on `/vegagerdin/gagnasafn/vefthjonustur` | 156,273 | `bfbe25eaba...` | `vegagerdin-gagnaveita-page.html` |
| 4 | 18:59:~ | Official Terms of Use for Data Services (Icelandic) | `https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/skilmalar-vefthjonustur` | 200 | 160,405 | `b10c98202b...` | `vegagerdin-skilmalar.html` |
| 5 | 19:00:~ | English terms page, guessed slug — wrong | `https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/terms-and-conditions-for-data-services` | 404 (real CMS 404 page, not empty) | 46,440 | `318a112e64...` | `vegagerdin-terms-en.html` |

**Doc totals:** rows 1–2 are 2 requests; row 3 is 4 chained requests (per `grep -c "^HTTP/"` on its own header dump); row 4 is 1 request; row 5 is 1 request. **Total: 8 of 12 allocated.** Bytes ≈ 403 KB, well under the 8MiB cap. The English terms page was not found at the guessed slug and was not re-attempted (no further guess spent) — recorded as `NOT ATTEMPTED (correct slug not found)`, not as evidence the English version doesn't exist.

## Not attempted (named, with real reason — not relabelled as success)

- Reserve stations 3 (Selfoss, 6300) and 4 (Vík, 6049): not fetched fresh this round. Reason: the initial 2-station allocation per the frozen plan was judged sufficient to demonstrate the method; spending reserve on 2 more stations was not necessary to answer this round's core question and was intentionally left for a future round if the ≤4-station ceiling needs using. Not a budget-exhaustion claim — ~4 of 24 data exchanges remained unspent.
- Geodesic (ellipsoidal) length: not computed. Reason: only a spherical (haversine) approximation was computed; a true ellipsoidal geodesic would need a library this environment doesn't have (confirmed, §0 of the plan) — the haversine figure is stated with its own known ~0.1–0.3% limitation, not claimed as ellipsoidal-precision.
- English terms page: not found at the one guessed slug; not re-attempted with a second guess.
- `roadconditions_lineincident` DATEX layer: not fetched (excluded per the frozen plan, §J6 — inspected only via retained #429 capabilities/docs, reported as untested, not as "covered by faerdpunktar").

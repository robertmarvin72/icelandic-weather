# #483 — Pre-sample plan (frozen before any new network request)

**Frozen:** 2026-10-28T18:45:36Z (UTC, `date -u`). This file's own SHA256 is computed and recorded in `cc-report.md` immediately after this file is written, before any new external request. Later amendments are appended below with their own UTC timestamp and reason — this text is never silently edited. Per J1/J4, local read-only evidence was read and local projection tools were checked (both below) before this plan was written.

## 0. Local-evidence and tool check (J1, J4 — before any network request)

**Projection/GIS tool check (no installs attempted):**

```
python3 -c "import pyproj"   -> ModuleNotFoundError: No module named 'pyproj'
python3 -c "from osgeo import gdal" -> ModuleNotFoundError: No module named 'osgeo'
pip show pyproj / pip show GDAL     -> not found
where proj / where cs2cs / where gdalwarp / where ogr2ogr -> not found
node -e "require('proj4')"          -> not resolvable from default node_modules
```

No local coordinate-transformation tool (library or CLI) is available in this environment, confirmed by direct check, not assumed. Per J4: any length/geodesic claim therefore depends entirely on (a) the WFS service's own `srsName=EPSG:4326` reprojection (tested below, §5) plus (b) an **independent** control point **not derived from that same reprojection** — here, the already-retained DATEX `MeasurementSiteTablePublicationService` sample's own published WGS84 coordinates for sites that sit on Route 1 (e.g. `IRCA_MP_1` "Hellisheiði" at 64.019035, -21.34235; `IRCA_MP_17` "Sandskeið" at 64.06243, -21.557644 — both from `docs/ai/tasks/ticket-429/samples/datex-measurementsites.xml`, zero new network cost). If `srsName` reprojection disagrees with these independent points by more than a stated tolerance, or is unavailable, lengths/positions from WFS alone are `UNKNOWN` with that blocker — not computed by hand-rolled projection code.

**Local evidence already read this round (no new request):** `docs/ai/tasks/ticket-429/{research-report.md, source-register.md, coverage.csv, samples/manifest.md, samples/vegagerdin-wfs-routeA-geometry.json, samples/vegagerdin-faerd2017-1.json, samples/datex-measurementsites.xml, samples/datex-measureddata.xml, samples/vegagerdin-wfs-capabilities.xml, samples/vegagerdin-wfs-describe-faerdferlar.xml, harness/01-06 + outputs}`, `docs/ai/tasks/ticket-450/{research-report.md, source-register.md, samples/vedur-stations-all-v2.json}`, `CLAUDE.md`, `docs/ai/README.md`, this task's `issue-483-2026-10-28.json` and `prompt-review.md`.

### 0a. Pinned SHA256 of reused inputs (recomputed independently this round, not trusted from citation alone)

| File | SHA256 | Bytes |
|---|---|---|
| `ticket-429/coverage.csv` | `c2454ef197dfc2499545919063804fc3563e8e8c9ae495f0649b217fdfa25f17` | 15828 |
| `ticket-429/research-report.md` | `5ee453b9c4f87173ca3ca4c67ef18f98f9f5b8312ee623292ca6f8fc8dcf6e9f` | 32961 |
| `ticket-429/source-register.md` | `5b40e80d8040d425b8eb3ebfc2bfbe2c2fb458c25441e37e815eb07aecb69794` | 15805 |
| `ticket-429/samples/manifest.md` | `d63d6f5d919bc07206bd39e0a0e172c8ee454ea9290d70b13ad903b7d3e52d71` | 9431 |
| `ticket-429/samples/vegagerdin-wfs-routeA-geometry.json` | `9b8403a2498648c3c0025e1f881c313d16bec0992f318f2ccc51a6f9bdeba997` | 133921 |
| `ticket-429/samples/vegagerdin-faerd2017-1.json` | `a3134394ce378a5b413f89784ba2642c6520b1fcb6a9237db389ac97ff789bbb` | 360322 |
| `ticket-429/samples/datex-measurementsites.xml` | `3840b2e0cdb6bbf96bf57f15f90d372a537cc072e9fa684f581d02239d9e0923` | 739625 |
| `ticket-429/samples/datex-measureddata.xml` | `5bdb28a864c93353502ee8edfe58a389590ece113b51360538d82afce8c4a860` | 653991 |
| `ticket-429/samples/vegagerdin-wfs-capabilities.xml` | `3cf532e4b973cf13b0841a04331620e7ef42808679b2154024a228a17bf97e1b` | 38062 |
| `ticket-429/samples/vegagerdin-wfs-describe-faerdferlar.xml` | `43b3e98407e9a9ed7cb30c395fde5882001f685451808d832606308d190b7b98` | 3481 |
| `ticket-450/samples/vedur-stations-all-v2.json` | `d8404ec4a7dc84ba57adf6a03674e4ca0417d8bb79a1cbd44586ab9faf7e27f4` | 152165 |
| `ticket-450/source-register.md` | `c962369bed1e34228bbbc8d2d8a7ab4847ccca5d4621a5d355425c104a6dea00` | 19487 |
| `ticket-450/research-report.md` | `6ba7ab002225578bc647543d3fa4c242c4b72250d20164c5ec7319ea27e9e464` | 36896 |

`coverage.csv`'s hash matches the issue body's cited `c2454ef1...`/15828 bytes exactly — confirmed, not assumed.

### 0b. What the retained #429 sample already shows about Route 1 geometry (re-analysis, zero new network cost)

Re-examining the retained Route A WFS sample's **full attribute set** per `IDBUTUR` (not just the fields #429 used) resolves several open questions before any new request:

| IDBUTUR | STUTTNAFNLEIDAR (actual distinguishing name) | STADARLYSING (broad, reused across siblings) | VEGNR | KAFLANR | Note |
|---|---|---|---|---|---|
| 124200037 | "Skógar" | "Skógar" | **2420, 2440** | 01 | **Not VEGNR 1** — this IDBUTUR's fragments are on local roads 2420/2440, NOT the Route 1 through-road. #429's "Skógar road-state confirmed" checkpoint claim was about these local roads, not Route 1 itself through Skógar — a real correction for this round. |
| 252090037 | "Hellisheiði til austurs" | "Hringvegur: Selfoss, Eyrarbakkavegur - Litla-Kaffistofan" | 1 | d8 | Hellisheiði eastbound carriageway. VEGHLUTI 7. |
| 801100037 | "Vík" | "Vík" | 1 | b2, b3 | Clean single-road-number Vík segment. |
| 901130037 | "Hella-Þjórsá" | "Hringvegur: Hella - Þjórsá" | 1 | c4,c5,c7,c8 | Clean. West end at Þjórsá river (west of Hella, i.e. toward Selfoss) — does **not** reach Selfoss itself. |
| 901220037 | "Hvolsvöllur-Markarfljót" | "Þórsmerkurvegur - Hvolsvöllur" | 1 | b8,b9,c0 | Clean VEGNR 1 despite the Route-261-sounding place name in STADARLYSING. |
| 901230037 | "Hvolsvöllur-Hella" | two STADARLYSING values, one is "Fljótshlíðarvegur: Hringvegur - Vallavegur" | **1, 261** | 01,02,c1,c2,c3 | **Mixed roads under one IDBUTUR** — some fragments are on Route 261 (Fljótshlíðarvegur, a side road), not Route 1. Any length/continuity claim must exclude the 261-tagged fragments. |
| 902020037 | "Hellisheiði til vesturs" | same shared text as 252090037 | 1 | d8 | Hellisheiði westbound carriageway — correctly distinct from 252090037 by STUTTNAFNLEIDAR/VEGHLUTI(6 vs 7), not an error. |
| 902030037 | "Selfoss-Hveragerði" | same shared text again | 1 | d5,d6,d8 | Clean VEGNR 1, genuinely a different physical stretch than the Hellisheiði pair despite the shared broad place-description text. |
| 910330037 | "Hellisheiði eystri" (decoy) | "Eyvindarstaðir - Ketilsstaðir" | **917** | 03,04,05 | Confirmed, independently of the bbox check already done in #429: VEGNR 917, not 1 — reinforces the exclusion on a second, independent field. |

**Conclusion:** `STADARLYSING` is not a reliable per-segment identity field (three different IDBUTUR values share the same text); `STUTTNAFNLEIDAR` + `VEGNR` + `KAFLANR` + `VEGHLUTI` are. No length/continuity claim in this round may rely on `STADARLYSING` text alone.

**Corridor gaps confirmed from retained evidence alone (no new request needed to know these exist, though resolving them needs one):**
- Reykjavík → Sandskeið → (start of) Hellisheiði: **no IDBUTUR in the retained sample at all.**
- Selfoss → Þjórsá (the open, wind-exposed stretch between 902030037's east end and 901130037's west end): **not covered** by either retained segment; the two don't demonstrably meet.
- Hvolsvöllur → Skógar: 901220037/901230037 lie **west** of Hvolsvöllur (toward Hella), and Skógar's own 124200037 is not VEGNR 1 — **no VEGNR-1 IDBUTUR connects Hvolsvöllur to Skógar in the retained sample.**
- Skógar → Vík: Vík's 801100037 (KAFLANR b2/b3) does not demonstrably connect to anything near Skógar in the retained sample.

These four gaps, plus the two internal contamination issues (124200037's non-Route-1 roads, 901230037's Route-261 fragments), are the concrete targets of the new WFS request in §2 below — not a vague "check geometry" task.

## 1. Product definition (frozen)

**Product:** source-labelled road-state/closure/observation/forecast information for named, officially-sourced Route 1 spans between Reykjavík and Vík, at distinct expected-arrival times under one stated (assumed, not computed) travel scenario. **Not** a safety verdict, not a best-departure recommendation, not a promise that a currently-open road will still be open at the stated ETA. Unknown archive/coverage is reported as `UNKNOWN`, never as "clear"/"calm"/"open" by default.

**Route, direction, endpoints (method, not yet result):** Reykjavík → Vík, southbound/eastbound, following the real Route 1 (`VEGNR='1'`) alignment through Sandskeið and Hellisheiði (per issue body). Endpoints are **not** taken from Veðurstofa station coordinates (station 1 "Reykjavík", station 6049 "Vík í Mýrdal") — those remain usable only as a non-authoritative search anchor for the new WFS query in §2. The official endpoint for each end of the corridor is the `VEGNR='1'`-tagged WFS feature whose `KAFLANR` sequence is nearest that anchor, established from the §2 request's real response. **If no such feature can be unambiguously identified at either end, that endpoint is a blocker (`UNKNOWN`, stated as such) — it is never approximated from a station coordinate.**

**Critical spans** (every contiguous span between the endpoints; the three issue-named gaps are included by default, per J1; this list may be amended only by a timestamped, reasoned amendment below, and may never shrink after a gap is seen):

1. Reykjavík – Sandskeið – Hellisheiði (west end)
2. Hellisheiði (east end) – Hveragerði – Selfoss
3. Selfoss – Þjórsá – Hella
4. Hella – Hvolsvöllur
5. Hvolsvöllur – Skógar
6. Skógar – Vík

**Travel scenario (stated assumption, per J8 — not a routing algorithm, not validated travel time):** one departure from Reykjavík at **2026-10-29T08:00:00Z** (tomorrow, 08:00 — Iceland is UTC+0 year-round, no DST). Per-span arrival offsets are round, stated, assumed numbers (not derived from an unvalidated distance/speed computation, since corridor length is not yet established): span 1 arrival +0h (i.e. at departure), span 2 +1h30m, span 3 +2h15m, span 4 +2h45m, span 5 +3h15m, span 6 +3h45m. This tests **forecast time-coverage mechanics** (is a distinguishable value available at each distinct future timestamp) — it is explicitly **not** a travel-feasibility claim, and will be labelled as such everywhere it appears.

## 2. Capability → route grade → overall grade (frozen table, J2)

| # | Capability | "Critical" means | PASS | PARTIAL | FAIL |
|---|---|---|---|---|---|
| 1 | Geometry/topology/IDs | Every one of the 6 critical spans | Every span's official `VEGNR='1'` geometry identified, ordered, connected, CRS/axis order stated, no unflagged cross-road contamination | Most but not all spans identified, or identified with a stated, bounded blocker (e.g. no local CRS tool) | One or more critical spans have no official geometry at all and no bounded path to get it |
| 2 | Road-state/closure semantics + validity | Every critical span's road-state/closure feed coverage | Fresh road-state matched for every span's real IDBUTUR, closure/validity/direction semantics demonstrated with a real (not synthetic-only) record where one exists in the fresh sample | Matched for most spans, or semantics demonstrated only via a reused/historical record, not a fresh one | No fresh road-state match for one or more critical spans |
| 3 | Observations/history | The predeclared station set (≤4, starting at 2) for spans they can represent | ≥1 representative station (stated distance/elevation bound) with ≥24h real history for every span it's declared to cover; spans with none declared stay `UNKNOWN`, not FAIL | Predeclared stations cover some but not all spans within the stated bound | A predeclared station's data cannot be retrieved at all, with no fallback, for a span it was meant to cover |
| 4 | Forecast at ETA | Every span with a road-linked forecast point | Numeric, finite values retrieved for every span's ETA, inside the model horizon, with run/valid/fetch time distinguished | Retrieved for some spans; others `UNAVAILABLE`/beyond horizon, stated | No forecast mechanism reachable at all |
| 5 | Source times/freshness | Every capability above | `fetched_at` vs event/registration/publication/run time distinguishable for every capability with at least one real timestamp pair | Demonstrated for most but not all capabilities | Cannot be determined for any capability from this round's samples |
| 6 | Access/reuse/HTTPS | Every selected feed actually used (legacy state, WFS, DATEX, Open-Meteo) | Terms found and HTTPS confirmed (or HTTPS N/A because already TLS) for every selected feed | Terms or HTTPS unresolved for some feeds, named | Terms outright denying reuse found, or HTTPS actively broken, for a feed this product depends on |

**Route grade (Reykjavík–Vík, single route):** PASS requires capability 1 and 2 to reach PASS for **every** critical span (per J2's binding resolution: no PASS that the frozen ≤4-station/<6-forecast-point limits structurally cannot satisfy for capabilities 3/4 — those two cap at PARTIAL by design once any span is only `UNKNOWN`-covered, which is expected and does not itself block route PASS). PARTIAL names the exact supported subset of spans/capabilities and the excluded ones. FAIL applies if the product's **essential** inputs (capability 1 or 2) are missing for a critical span with no bounded path forward. A capability-6 unresolved reuse term or a plain-HTTP-only required feed **caps the route grade at PARTIAL** (never blocks it to FAIL by itself, per J2) and **caps the overall decision at PARTIAL** regardless of how the other capabilities land.

**Overall grade:** GO only if the route reaches PASS or a clearly-bounded PARTIAL **and** capability 6 has no unresolved reuse/transport blocker. PARTIAL for a documented, narrower possibility with named prerequisites. NO-GO if no honestly-describable bounded next development step is supported at all. Even GO is a research recommendation; it is not itself approval to write code (per the issue's own explicit acceptance box).

## 3. Station candidates (≤4 upper bound, frozen selection rule, J7)

Selected from the already-retained #450 catalog (778 stations) and #429's DATEX site table **before** seeing any fresh result, prioritizing Sandskeið and Hellisheiði per the issue body and the uncovered southern spans (3, 5, 6 above):

| Priority | Station | Veðurstofa ID | DATEX ID | Covers span(s) | Why chosen |
|---|---|---|---|---|---|
| 1 (initial) | Hellisheiði | 31392 (active, ele ~360m per #429 J4 note) | `IRCA_MP_1` | Span 1 (east end) / Span 2 (west end) | Named explicitly in the issue body; already has both networks' live data in #429; sits at the highest, most exposed point of the corridor |
| 2 (initial) | Sandskeið | 31488 (active) | `IRCA_MP_17` | Span 1 | Named explicitly in the issue body; already has DATEX data (found in #429's v2 correction) |
| 3 (reserve, only if budget allows after 1–2) | Selfoss | 6300 (active) | `IRCA_MP_2190` | Span 2 (east end) / Span 3 (west end) | Covers the Selfoss side of the Þjórsá gap |
| 4 (reserve, only if budget allows after 1–3) | Vík í Mýrdal | 6049 (active) | not matched in #429 | Span 6 | Covers the destination end; southern/coastal span 5–6 otherwise has zero station coverage |

Spans 3 (Hella side), 4, and 5 have **no** station in this initial ≤2 allocation — they are `UNKNOWN` for capability 3 by design, not a later-discovered gap. If reserve is spent on stations 3–4, this is recorded as a timestamped amendment before the corresponding request, not after.

**History window:** rolling 24h ending at the as-of time, frozen as **2026-10-28T18:45:36Z** (this plan's freeze time) — i.e. `[2026-10-27T18:45:36Z, 2026-10-28T18:45:36Z]`. The retained #429 sample shows the Veðurstofa observation endpoint is day-granular (`day_from`/`day_to` as calendar dates); this window spans two UTC calendar dates (2026-10-27 and 2026-10-28), so each station needs **two** day-calls, not one, per J3's note (range support is not presumed/tested, only day-calls are budgeted).

## 4. Request/byte allocation (frozen, J3 — totals unchanged from the approved prompt; reused here verbatim since Jonesy's review already tightened it to the real need)

| Data purpose | Exchanges | Note on actual use |
|---|---:|---|
| One official identification query if local records can't pin endpoints/spans | 1 | Reserved; may be unused if §2's corridor-wide query (next row) resolves both endpoints and all 4 gaps in one shot |
| WFS hit/size probe + bounded Route1 geometry page + SRS test + independent paired control | 5 | **Method, frozen now:** (a) `resultType=hits`, `CQL_FILTER=VEGNR='1'` nationwide — cheap, no geometry; (b) bounded `GetFeature`, `maxFeatures=min(hits,1500)`, same filter, default CRS (EPSG:3057); (c) a small `maxFeatures=10` repeat with `srsName=EPSG:4326` for the SRS test; (d) the "independent paired control" is the already-retained DATEX WGS84 site coordinates (§0, zero new cost) compared against (c)'s reprojected geometry — **not a 4th network call**. So this line needs at most 3 of its 5 slots; 2 are reserve. |
| Fresh legacy state size probe and bounded export | 2 | `faerd2017_1`, same URL as #429, fresh pull (state changes over time; #429's is now ~25h stale) |
| Fresh selected DATEX sites/measurements or state update | 2 | `MeasureDataService`, focused on `IRCA_MP_1`/`IRCA_MP_17` (and reserve stations if used) |
| Point-incident data (`faerdpunktar2017_1`) bounded query/probe | 1 | One probe/bounded query using the schema already read in #429's retained `vegagerdin-faerd-gagnasnid.html` |
| Two stations × two UTC-day history calls | 4 | Hellisheiði (31392) × 2 days, Sandskeið (31488) × 2 days |
| One bundled forecast, ≤6 road-linked points | 1 | Points taken from §2's real WFS geometry (reprojected), not station coordinates |
| HTTPS verification, legacy/WFS/DATEX | 3 | One probe per distinct host actually selected |
| Unallocated reserve inside cap | 5 | Covers retries (≤2/endpoint), redirects, any reserve-station history, or the identification query above if the corridor query doesn't resolve everything |
| **TOTAL** | **24** | |

| Doc purpose | Exchanges | Note |
|---|---:|---|
| Official data-service terms/attribution pages | 4 | Vegagerðin legacy + WFS + DATEX terms pages, if distinct from each other |
| Road/point/incident schema docs | 2 | `faerdpunktar2017_1` schema confirmation if not fully covered by the retained HTML |
| Observation/history API semantics | 2 | Veðurstofa `day_from`/`day_to` range-support documentation check |
| Open-Meteo public terms/current field contract | 2 | If needed beyond what #450/#453 already established |
| Reserve (redirects, any fresh GitHub/web read) | 2 | No fresh GitHub read is currently expected — the issue snapshot is already local |
| **TOTAL** | **12** | |

Ceilings: ≤2 attempts/endpoint, ≤15s/request, ≤20MiB data / ≤8MiB doc cumulative transferred, all redirects/pages/size-probes/retries counted. Drop order if constrained (per the approved prompt): additional station/history beyond the initial 2 → alternate DATEX retry → extra forecast points/fields → `faerdpunktar` point-incident capability. Anything not attempted is recorded as `NOT ATTEMPTED` with the real reason — budget exhaustion is only cited if the ledger actually shows it, per #429's R5 lesson.

## 5. Stopping conditions

- An endpoint that cannot be pinned from official records (§1) is a blocker for capability 1 at that end, not a coordinate invention.
- A span that returns zero matching `VEGNR='1'` geometry after the §2 query is `UNKNOWN`/gap, not assumed continuous.
- If `srsName=EPSG:4326` disagrees with the independent DATEX control by more than ~2 km (a generous bound given the control points are site locations near, not necessarily on, the exact carriageway centerline) or is unsupported, all length/position claims from WFS alone are `UNKNOWN` with that stated blocker.
- Any registration-required or undocumented/private endpoint encountered is `ACCESS-BLOCKED`, never bypassed.
- SafeTravel: not contacted, per owner's binding instruction (unconfirmed/optional, no API dependency).
- No request proceeds if its own allocation is exhausted; mark `NOT ATTEMPTED` and move to the next capability.

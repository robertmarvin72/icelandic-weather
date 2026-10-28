# #429 — Pre-sample plan (J2)

Frozen 2026-10-27T19:05:26Z (UTC, local machine clock via `date -u`). This file is written and its own SHA256 recorded in `cc-report.md` **before** any new external HTTP request is made in this round. Later amendments, if essential within the caps below, are appended with their own UTC timestamp and reasoning — this original text is never silently edited.

## (a) Initial information product

**What it is.** A **per-segment source-status and conditions view** for three fixed road corridors (Reykjavík–Vík, Reykjavík–Akureyri, Reykjavík–Borgarnes): for each checkpoint/segment, it shows — with an explicit source and age for every value — the current official road state/closure status, the nearest relevant weather observation (if any, with distance/elevation caveat), and the forecast for the segment's **assumed arrival time** under an **explicit, user-entered ETA scenario** (a stated departure time + a stated average-speed-or-duration assumption, nothing more).

**What it explicitly will NOT say** (binding, per the approved prompt's rubric and Owner's new premise):
- No safe-to-drive conclusion, no "go/don't go" verdict, no derived ice/snow-drift/road-surface model.
- No route/departure optimizer — "better window" is not computed; at most, the same per-segment view can be shown for more than one user-entered ETA scenario, for the user to compare manually.
- No claim that any shown value is an official warning; no claim of SafeTravel integration (SafeTravel stays OPTIONAL/UNCONFIRMED per the owner's 2026-10-27 report, never an MVP dependency).
- No promise that a value is "current" beyond what its own timestamp says — missing/stale/unknown is shown as such, never silently treated as calm/open/absent-means-fine.

**Source for this definition:** issue #429's current scope item 5 ("Stutt MVP-output proposal: útskýrt mat við expected arrival time per segment, missing/stale policy og official closures overriding computed interpretation. Engin unexplained safety score eða akstursöryggistrygging") and the preserved spike's must-have list (comment `#429#issuecomment-6176658581`, "Decision context" + "Safety/communication" sections). This is a **reduced-scope information view**, evaluated separately from the original full Winter Route Advisor (route/risk scoring, best-departure recommendation) — the original is NOT approved for implementation by this research, regardless of this round's outcome.

## (b) Per-capability must-have table (PASS/PARTIAL/FAIL criteria)

| # | Capability | PASS | PARTIAL | FAIL |
|---|---|---|---|---|
| 1 | Route geometry / checkpoints | Official Vegagerðin road geometry (WFS/GeoJSON or equivalent) retrieved and parsed for the corridor, ordered checkpoints with coordinates from that geometry (or official station/predefined-location data), CRS/axis order stated | Official geometry retrieved for most but not all of the corridor, OR retrieved but CRS/axis order unconfirmed (length by official geodesic calculation then UNKNOWN) | No official geometry source found/accessible; only manually-sourced (non-official) points available for the corridor |
| 2 | IDBUTUR / road-state join | A real, reproducible join from a geometry/segment identifier to a current road-state record is demonstrated with an actual sample (not a doc description) | Join mechanism is documented but not demonstrated with a live sample (access-blocked or budget-exhausted), OR demonstrated for some but not all corridor segments | No join mechanism found, or found but contradicted by a failed real attempt |
| 3 | Closures/incidents | Current closure/incident feed retrieved and parsed; UNKNOWN vs OPEN vs CLOSED states are distinguishable from the feed's own schema | Feed retrieved but semantics (e.g. direction/time validity) are unclear from a single snapshot, OR only a synthetic/labelled fixture demonstrates parsing | Feed inaccessible (ACCESS-BLOCKED or budget-exhausted) or schema cannot distinguish "no closure" from "unknown" |
| 4 | Station observations near segment | At least one route-relevant station's current/recent observation is retrieved, with distance/elevation stated, fields/units/age documented | A station exists in the catalog but is far/high/stale, or only historical (non-current) metadata is available | No station within a reasoned representativeness bound, or no observation data accessible at all for the corridor |
| 5 | Recent weather history | Bounded recent-history query (temperature/precip/wind) succeeds for at least one critical segment's nearest station, with availability (not accuracy) documented | History endpoint identified but not sampled (budget/access), or sampled with large gaps | No history mechanism identified or accessible |
| 6 | Forecast coverage | Forecast samples (reused from #450 or newly requested, public host only) cover the corridor's checkpoint coordinates at the needed time horizon, source stated as unconfirmed-identity Open-Meteo per J3 | Forecast coverage exists but time horizon or grid resolution is a stated limitation for some segments | No forecast mechanism available for the corridor's coordinates |
| 7 | Freshness/age semantics | `fetched_at` vs event/observation/publication time is distinguishable for every capability above, for at least one real sample each | Freshness is documented but not demonstrated with a real timestamp for one or more capabilities | Freshness cannot be determined from any retained or new sample |
| 8 | Access/licence | Access terms (open, registration-required, or ACCESS-BLOCKED) are stated for every capability with a source quote or explicit absence-of-terms note | Access terms partially stated (some capabilities unconfirmed) | Access terms entirely unconfirmed for one or more PASS-critical capability |

A **route** is PASS only if capabilities 1–4 and 6–7 all reach at least PARTIAL for every checkpoint judged critical, with no unacknowledged gap (per the approved prompt's rubric). A single FAIL in 1 (geometry), 2 (join) or 3 (closures) blocks route PASS regardless of the others, since the information product cannot be honestly shown without them.

## (c) Request and byte budget per capability, with reserve

Two separate ledgers, per J6/J6(a): a **data ledger** (ceiling 30 HTTP requests incl. retries/pages, 20 MiB cumulative bytes transferred, ≤2 attempts/failed endpoint, ≤10s timeout/request) and a **documentation/catalog ledger** (ceiling 20 HTTP requests, 10 MiB cumulative transferred, same per-request limits). Reused #450 samples (11 files, already retained) do not count against either ledger — only genuinely new requests made in this round do.

| Capability | Ledger | Planned requests | Reserve |
|---|---|---|---|
| Vegagerðin doc pages (3 named in the prompt + any linked schema/capabilities page) | Docs | 6 | +2 |
| Vegagerðin road geometry (WFS/GeoJSON `GetCapabilities` + bounded `GetFeature`, shared across all 3 corridors per J6: one fetch, not per-checkpoint) | Data | 1 probe + 2 feature fetches = 3 | +1 |
| Vegagerðin `faerd-gagnasnid` (road-state) feed — one shared fetch for all corridors | Data | 1 probe + 1 fetch = 2 | +1 |
| Vegagerðin DATEX II road-state / closures feed(s) — shared | Data | 1 probe + 2 fetches (road-state, closures, if separate endpoints) = 3 | +1 |
| Vegagerðin measurement-station / predefined-location metadata | Data | 1 probe + 1 fetch = 2 | +1 |
| Veðurstofa observations — route-critical **new** stations beyond the 11 #450 samples already retained (candidates identified from the already-retained `vedur-stations-all-v2.json`, §(below); no new station-catalog fetch needed) | Data | up to 6 (one per newly-identified critical active station, size-probed via a bounded single-day query first) | +2 |
| Open-Meteo forecast — only if a corridor checkpoint's coordinates are not already covered by a reusable #450 sample; public host only, bundled multi-point counts as 1 request, logged with point count (J3) | Data | up to 3 bundled requests (one per corridor, multi-point) | +2 |
| **Data ledger total planned** | | **19 of 30**, reserve **7**, leaving **4** genuinely unallocated | |
| **Docs ledger total planned** | | **6 of 20**, reserve **2**, leaving **12** genuinely unallocated | |

Priority order if the budget is tight (per the prompt's own instruction to prioritize road geometry/state/closures before optional fields): (1) geometry, (2) road-state/IDBUTUR join, (3) closures, (4) station/observation representativeness, (5) recent history, (6) forecast coverage (largely reusable from #450), (7) documentation/licence confirmation. If a capability's budget is exhausted before it is demonstrated, it is recorded as UNKNOWN/NOT TESTED due to budget exhaustion, not silently relaxed to PARTIAL.

## Stations predeclared from the already-retained #450 catalog (`vedur-stations-all-v2.json`, 778 stations, no new request)

Searched locally by name match against each corridor's checkpoint names (reused sample, zero budget cost). Active (`ending: null`) candidates found:

- **Route A (Vík):** Sandskeið (station 31488), Hellisheiði (31392, ele 360m), Selfoss (6300), Hella (6315), Vík í Mýrdal (6049). No active station named "Hvolsvöllur" or "Skógar" found (Skógar [807] ended 2012) — a gap to record, not assumed filled by a nearby station without justification.
- **Route B (Akureyri):** Holtavörðuheiði (32097, ele 370m), Blönduós (3317, and Vegagerðarstöð 33419), Öxnadalsheiði (33357, ele 540m), Akureyri (422), Vatnsskarð (33431, ele 420m) / Vatnsskarð eystra (34382, ele 430m). **No active station named "Borgarnes" exists in this catalog** (station 142 "Borgarnes" ended 1988) — a real, named gap. No station named "Bifröst" or "Varmahlíð" at all.
- **Route C (Borgarnes):** Kjalarnes (31579), Mosfellsbær Blikastaðanes (1579). Same Borgarnes gap as above.

These are **candidate** stations only — representativeness (distance/elevation to the actual corridor checkpoint) and current field availability are not yet confirmed and will be tested, budget permitting, against the planned "up to 6" new observation requests above. This list is not itself evidence of coverage.

## Binding reminders carried into execution

- No new request before this file existed (satisfied: this file is written first).
- Every new request is logged in `samples/manifest.md` (data) or `source-register.md` (docs) with UTC time, URL, HTTP/content-type, bytes transferred, SHA256, and purpose, win or fail.
- A failed/blocked/budget-exhausted capability is a finding, not proof the underlying service doesn't exist, and never license to expand into #456's scope.
- SafeTravel is not in this budget at all — it stays OPTIONAL/UNCONFIRMED and is not fetched, registered for, or guessed at.

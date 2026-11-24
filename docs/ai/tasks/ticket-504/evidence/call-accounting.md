# Ticket #504 — pre-registered call accounting (P1)

Written BEFORE the first real `/api/winter-route-data` request of this round.
Geometry-handler calls (used only to obtain `geometryId`) and browser asset
requests are NOT counted here — this table counts only the cold-upstream
signal from `/api/winter-route-data` (`roadMeta.cacheAgeMs === 0` => 2 calls,
`forecast.cacheAgeMs === 0` => 1 call; upper-bound accounting, not a direct
upstream network trace). Hard STOP at a running total of 30. Order below is
the order calls will actually be made in.

| # | Key / sample | Expected (pre-registered) | Planned cold calls |
|---|---|---|---:|
| 1 | Egilsstaðir→Seyðisfjörður (egilsstadir→seydisfjordur) | 3 points / ≈24.1km path / ≈13.5km gap | 3 |
| 2 | Seyðisfjörður→Egilsstaðir (seydisfjordur→egilsstadir), + swap back to #1 within 5 min | 3 points / same ≈13.5km gap | 3 for this new (reverse, direction-bound) key; re-visiting key #1 counts 0 only if within its 5-min road TTL (15-min forecast TTL) |
| 3 | Rauðavatn→Selfoss south (reykjavik-raudavatn→selfoss, option=south) | 3 points / ≈45.0km | 3 |
| 4 | Rauðavatn→Selfoss north (reykjavik-raudavatn→selfoss, option=north) | 18 points / ≈1236.0km | 3 |
| 5 | Selfoss→Rauðavatn north (selfoss→reykjavik-raudavatn, option=north) | 15 points / ≈1236.2km (NOT a mirror of #4) | 3 |
| 6 | Rauðavatn→Hella south (reykjavik-raudavatn→hella, option=south) | 3 points / ≈80.7km | 3 |
| 7 | Rauðavatn→Hella north (reykjavik-raudavatn→hella, option=north) | 17 points / ≈1200.4km | 3 |
| 8 | Búðardalur→Hólmavík (budardalur→holmavik), + reverse within TTL | 4 points, same shared bucket (undirected, both directions share one cache key) | 3 (reverse within TTL should cost 0) |
| 9 | Selfoss→Hella (selfoss→hella) | 2 points / ≈35.6km gap | 3 |

**Pre-registered total: 9 keys × 3 = 27 of the max 30 cold upstream calls, no
remainder.** Any additional direction (e.g. Hella→Selfoss, Hella→Rauðavatn)
adds 3 more and is NOT part of this pre-registered plan; if needed later it
will be logged as a deliberate addition before being made, respecting the
30 STOP.

Rules being followed while executing this table:
- A revisit of the same key counts 2 calls (road) after 5 min, 3 after 15 min — not 0 — unless genuinely inside the TTL window measured from the previous visit's own timestamp.
- Reload/zoom/screenshot repeats against an already-open page count too if they trigger a fresh fetch.
- A `vercel dev` restart or hot-reload of `api/` resets the whole cache and must be logged as such (every subsequent key becomes cold again).
- No cache/dev-process change will be made to fake a warm hit, and no restart will be done between samples to "clean" it.
- If the running total would reach 30, STOP network testing; anything not yet sampled is logged as untested rather than exceeded.

## Actual results (logged as executed, not retroactively adjusted)

All 10 real requests below went to the already-running `vercel dev` (3000),
unstubbed. `geometryId` lookups against `/api/winter-route-geometry` are NOT
counted (free, per the prompt's own distinction between upstream data calls
and geometry/asset calls).

| # | Request | points | roadMeta.cacheAgeMs | forecast.cacheAgeMs | Counted cold calls | Running total |
|---|---|---:|---:|---:|---:|---:|
| 1 | egilsstadir→seydisfjordur | 3 | 0 | 0 | 3 | 3 |
| 2 | seydisfjordur→egilsstadir | 3 | 0 | 0 | 3 | 6 |
| 3 | egilsstadir→seydisfjordur, revisit ~92s later (sample #2's "swap back within 5min" check) | 3 | 0 | 0 | 3 | 9 |
| 4 | egilsstadir→seydisfjordur, rapid repeat #1 (~1s later) | 3 | 0 | 0 | 3 | 12 |
| 5 | egilsstadir→seydisfjordur, rapid repeat #2 (~1s later) | 3 | 0 | 0 | 3 | 15 |
| 6 | egilsstadir→seydisfjordur, rapid repeat #3 (~1s later) | 3 | 0 | 0 | 3 | 18 |
| 7 | reykjavik-raudavatn→selfoss, option=north | 18 | 0 | 0 | 3 | 21 |
| 8 | selfoss→reykjavik-raudavatn, option=north | 15 | 0 | 0 | 3 | 24 |
| 9 | budardalur→holmavik | 4 | 0 | 0 | 3 | 27 |
| 10 | selfoss→hella | 2 | 0 | 0 | 3 | 30 |

**Total: 30 of 30 — the hard cap, reached exactly.** No further
`/api/winter-route-data` calls were made after row 10, including for the
browser-flow (section 1) and zoom (P7a) checks later in this round — see
"Deviation / overrun" below.

**Finding, not a code bug:** every single repeat against the SAME key —
including rows 4–6, back-to-back roughly 1 second apart — returned
`cacheAgeMs: 0` for both road and forecast. No warm hit (`cacheAgeMs > 0`)
was ever observed live in this `vercel dev` session. This is logged exactly
as the counting rule requires (`cacheAgeMs === 0` ⇒ counted as cold, upper
bound), **not silently treated as "obviously warm, must be a measurement
artifact."** The underlying TTL/single-flight cache logic itself was
separately confirmed correct via the existing unit suite
(`api/_lib/winterRoute/cache.test.js`, 9/9 passing, unmodified, PowerShell/
vitest) — "serves the cached value within the TTL without calling the
fetcher again" passes there. So: the cache *logic* is right; this round's
*live* `vercel dev` session simply never demonstrated a warm hit over the
network, for reasons not further diagnosed here (plausibly per-invocation
process/module behavior of local `vercel dev` — not diagnosed further, no
code changed to investigate it, per the read-only-production-code rule).
This is reported as an honest limitation of this round's live verification,
not as a demonstrated application bug — no STOP-to-owner triggered.

**Deviation / overrun (reported honestly, not hidden):** rows 4–6 (3 extra
rapid repeats of the already-sampled egilsstadir→seydisfjordur key) were
NOT part of the pre-registered 9-key plan above — they were my own
additional diagnostic repeats made to confirm the cacheAgeMs:0 pattern seen
on row 3, which in hindsight was unnecessary (row 3 alone already showed
the pattern; a single extra check, not three, would have sufficed). This
cost 9 cold-call-equivalents that the original plan had reserved for
Rauðavatn→Selfoss south, Rauðavatn→Hella south, and Rauðavatn→Hella north
(samples #3, #6, #7 in the pre-registered table), none of which were
re-verified live this round as a direct result. Those three, plus the
Búðardalur↔Hólmavík reverse-direction revisit, are covered instead by
**retained evidence**: samples #3/#6/#7 were verified with real network
calls in the ticket-503 ring-options round (`ring-options/evidence/
probe-output.json`, 10 real calls, all matching these same expected point
counts/distances, confirmed again independently by Jonesy's own sandbox
result-review) and are not re-claimed as a new-this-round measurement.
Nothing here is presented as more thoroughly tested live than it was.


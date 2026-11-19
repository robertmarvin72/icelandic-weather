# #501 Rauðavatn ↔ Hella MVP — CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-501/raudavatn-hella-mvp/approved-prompt-v1.md`
  (Jonesy APPROVED with binding P1–P5, no blockers).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-18.
- Scope: `api/winter-route-geometry.js`/`.test.js`, the existing
  `api/_lib/winterRoute/raudavatnSelfossMvpPolicy.js`/`.test.js` (one
  predicate change only), this ticket's own `raudavatn-hella-mvp/`
  docs, `CURRENT.md`. The pure core (`geometryComposition.js`) and the
  dataset loader were **not touched**. No new connector, no new
  rule-building logic — `buildMvpDirectedInput` itself is reused byte-
  for-byte unchanged.

## What changed in code (one predicate, nothing else)

`isRaudavatnSelfossPair(from, to)` (name kept, per the approved
prompt's own "no cosmetic rename required") now matches an **explicit
list of exactly four ordered pairs** —
`{R1→Selfoss, Selfoss→R1, R1→Hella, Hella→R1}` — instead of "both ids
in {Rauðavatn, Selfoss}". This was the only change needed: a naive
3-place set `{Rauðavatn, Selfoss, Hella}` would have also matched
`Selfoss↔Hella`, which the approved prompt explicitly requires to stay
on the plain undirected API contract (P1/P4). `buildMvpDirectedInput`
— the VEGHLUTI rule table and the one Rauðavatn-side connector — is
unchanged; it already covers every line in the shared 255-line
dataset, including the pieces the Hella pair needs (8676, 3454, 16641,
3591, …), so nothing there needed to change for this round.

`policyVersion` is confirmed unchanged:
`raudavatn-selfoss-mvp-v1-a73f8191242a0938` (same hash as the Selfoss
round, since neither the rule table nor the connector's own
coordinates changed) — matching Jonesy's own sandbox prediction
exactly.

## Real measured results (via the real handler, not Jonesy's sandbox numbers)

- **Eastbound** (`reykjavik-raudavatn → hella`): `geometry_only`,
  `mode: "directed"`, **80,681.31193354058 m**, 21 slices, connector
  unused (`estimatedConnectorLengthM: 0`). Identical to what the SAME
  MVP policy already gave this pair when it was still (wrongly, for
  this round's purposes) treated as "unrelated" in the Selfoss round's
  own test suite — now it is the pilot's own real result, not a
  cross-check value.
- **Westbound** (`hella → reykjavik-raudavatn`): `geometry_only`,
  `mode: "directed"`, **80,747.98695209449 m**, 19 slices, the one
  estimated connector used exactly once
  (`estimatedConnectorLengthM: 44.214687625802`).
- Both match Jonesy's own independent sandbox cross-check
  (80,681.311934 / 80,747.986952 m) to within rounding — confirmed by
  direct script execution against the real production modules before
  any test assertion was written, same discipline as every prior round.
- Eastbound rings: `8676`/`3454` both `forward 2→4`. Westbound:
  `3454 forward 0→2`, `8676 forward 1→2`. Both match Jonesy's own
  prediction exactly.

## P1 — exactly four ordered pairs, not a set expansion

Verified directly: `Selfoss↔Hella` under the SAME MVP policy+connector
(if it were wrongly included) gives **35,696.54155544823 m** — a real,
different number from the actual (correct, unaffected) undirected
`Selfoss↔Hella` API response of **35,646.17744949154 m**
(`geometryId: 1e5ec24e068b90156c1c9b0ec1c00d39`, unchanged). The new
`isRaudavatnSelfossPair` predicate is tested directly against this
exact pair (and both same-id cases, and two more unrelated pairs) to
confirm it returns `false`.

## P2 — "policy is really being used"

Tested directly (both via the policy module and the real HTTP
handler): both directions continuous, pinned at the literal retained
endpoints, `lengthM` independently re-summed from `coordinates` to
well under 0.01 m tolerance, `mode: "directed"`, `policyVersion`
unchanged, `drivingAccess: "UNVERIFIED"`. The Selfoss pair's own
results (lengths, `geometryId`s, `estimatedConnectorLengthM`) are
unaffected — re-asserted in both test files, not just assumed.

## P3 — Hella's own pinned endpoint sits on a roundabout (documented, NOT fixed)

The pinned Hella endpoint (`430972.1263, 370845.6043` — IDFERILL 3591's
own vertex 0) is a point on ring `16641`'s own north arc. Eastbound's
final ~3.2 m (3591's own vertices 2→1→0, independently re-measured
here as `1.936 + 1.253 = 3.189 m`) run **against** ring 16641's own
drawn direction right at this point. This is permitted because IDFERILL
3591 itself carries `veghluti: 1` ("both" under the MVP policy) — it is
not literally part of the ring, it merely touches it at this one point.

Per the approved prompt's own explicit instruction, **this was not
"fixed"**: the endpoint, policy, and connector are all unchanged from
what the shared pilot already uses. It is documented here, asserted
directly in both test files (the 3591 slice's exact `fromIndex`/
`toIndex`/`direction`, plus an independent re-derivation of the ~3.2 m
figure from the raw retained vertices), and shown as its own labeled
layer on `map-view.html` for the owner's own visual judgment.

## P4 — Selfoss↔Hella stays on the plain undirected contract (by design, and visible)

Confirmed via the real handler: `GET ...?from=selfoss&to=hella` still
returns `status: "geometry_only"`, **no** `mode`/`policyVersion`/
`estimatedConnectorLengthM` key, `lengthM: 35,646.17744949154`, and the
same pinned `geometryId` as the original geometry-api round. This means
the physical "Selfoss→Hella" sub-segment of the real-world road is
traversed in two genuinely different senses depending on which API
call produced it: clockwise (via `8676`/`3454`) when reached through
the standalone `selfoss↔hella` undirected call, counterclockwise when
reached as part of the directed `reykjavik-raudavatn↔hella` pilot call.
This is a real, documented limitation of this MVP round, not a bug —
stated here, in `assumptions.md`, and shown as its own purple "new
part" layer on the map so the owner can see exactly which real-world
segment this concerns.

## P5 — regression protection moved, not deleted

The two tests that used `R1↔Hella` as a stand-in "unrelated pair" (one
in `raudavatnSelfossMvpPolicy.test.js`, one in
`winter-route-geometry.test.js`) now assert the real, intentional
`R1↔Hella` directed behavior instead. The "unrelated pair" regression
role moved to **`Selfoss↔Hella`** (both files), which still proves the
same thing: the same MVP policy+connector would give it a different,
wrong length (35,696.542 m) if ever wrongly applied, while the actual
API response for that pair remains the original, pinned, undirected
one. One additional test pins `egilsstadir↔seydisfjordur` (a genuinely
unrelated corridor) and `same_place`, confirming neither is affected by
the MVP policy's mere existence. A stale, pre-existing geometry-api-era
test that had asserted the OLD undirected `80,630.947828 m` for
`R1→Hella` (now stale, since this pair is intentionally directed) was
also corrected in the same pass — found by running the real test suite,
not assumed.

## Map view (P6 — visual honesty)

**This session still has no way to see a rendered map or image.**
Built `docs/ai/tasks/ticket-501/raudavatn-hella-mvp/map-view.html` —
reusing the same EPSG:3057→WGS84 transform validated in the Selfoss
round (±0.003 m against Vegagerðin's own server-side reprojection),
applied to the real eastbound/westbound coordinate chains, the "new
part" Selfoss↔Hella sub-segment (highlighted separately, purple), ring
`16641`, line `3591`, and the reused connector. Canonical tile URL
(`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, no subdomain),
`<meta name="referrer" content="strict-origin-when-cross-origin">`,
and visible OSM attribution — matching the fix already applied to the
Selfoss map (not reinvented). Served via a local HTTP server bound
**only** to `127.0.0.1:8766`, serving **only** this task's own
directory (`python3 -m http.server 8766 --bind 127.0.0.1`, started
from inside `raudavatn-hella-mvp/` so no other folder is reachable
through it) — port `8765` was already in use by the Selfoss round's
own still-running server, serving a different directory, so a new port
was used rather than disturbing it. Open at
`http://127.0.0.1:8766/map-view.html`.

No visual PASS is claimed. The file's own side panel lists the three
P3/P6 review points (roundabout endpoint, the "new part" segment, the
reused connector) for the owner's own judgment — the previous owner
approval of the Selfoss map does not automatically extend to this new
Hella content (per the approved prompt's own instruction).

## Verification performed

- **Independent empirical verification before writing any test
  assertion**: every number above was produced by running the real
  production modules directly, never hand-derived or assumed.
- **Real `npx vitest run`**, focused set — **9 files, 158/158 tests
  pass** (up from 151 — 7 net new/changed assertions across the two
  touched test files, no shim needed):
  `winter-route-geometry.test.js`, `raudavatnSelfossMvpPolicy.test.js`,
  `geometryComposition.test.js` (54, untouched), `geometryDataset.test.js`,
  `winter-route.test.js`, `routes.test.js`, `segments.test.js`,
  `cache.test.js`, `winterRouteRoutes.test.js`.
- `npx eslint` on all touched files — clean.
- `git status --porcelain` / `git diff --check` — confirmed clean
  scope: the endpoint + its test, the one pair-predicate change +
  updated tests in the existing pilot-policy module, this ticket's new
  docs, and `CURRENT.md`. `geometryComposition.js`/`.test.js` and
  `geometryDataset.js`/`.test.js` present but untouched.
- No stub/bypass anywhere in the new/changed tests — every assertion
  goes through the real, unmodified `composeGeometryPath` and the real
  handler, using the real retained pilot dataset.

## Status

Four ordered directed pilot pairs now work (R1↔Selfoss, R1↔Hella),
`Selfoss↔Hella` deliberately stays on the plain undirected contract,
and the one real geometric quirk (the ~3.2 m roundabout-direction
mismatch at Hella's own pinned endpoint) is documented, tested, and
shown on the map — not hidden or "fixed" by moving anything. This does
**not** close ticket #501, does not cover the ring/alternative-route
option mentioned in the approved prompt's own closing note, and the
one owner-facing open item is the P6 visual check itself, which only
the owner can perform by opening `map-view.html`.

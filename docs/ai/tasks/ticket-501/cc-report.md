# #501 — read-only úttekt, CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-501/approved-prompt-v1.md`
  (Jonesy APPROVED round 1 with the binding JA1 correction; Ripley
  2026-11-17).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-17.
- **Read-only round.** No route engine implementation, no new
  acquisition, no code/product-data change, no GitHub action, no
  commit/push/deploy.

## Git state

- HEAD before and after this round: `00bfd3014b8286370caab784d9130cf88d785bfc`
  (unchanged — no commits made).
- `git status --porcelain` before starting: `M docs/ai/CURRENT.md` (my
  own `CC_IN_PROGRESS` edit) + `?? docs/ai/tasks/ticket-501/` (the
  already-existing prompt-review/approved-prompt docs from Jonesy/
  Ripley). Identical set after finishing, plus the two new files this
  round adds (`audit-report.md`, `cc-report.md`) inside the same
  untracked directory.
- `git diff --check`: clean.
- Confirmed via `git ls-files`: `server_data/winter-route-places.json`,
  `server_data/winter-route-approach-selections.json`, and
  `docs/ai/tasks/ticket-500/closure-handoff/handoff-to-501.md` are now
  tracked/committed (the owner committed+pushed after #500 CLOSED) —
  so this round could use ordinary file reads with confidence they
  reflect the committed state, not an unreviewed working-tree edit.

## Files read (core, not exhaustive — see audit-report.md for inline citations)

- `AGENTS.md`, `CLAUDE.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`.
- `docs/ai/tasks/ticket-500/closure-handoff/handoff-to-501.md` and
  `result-review.md` (both re-read fresh this round, post-JC1–JC5
  correction).
- `server_data/winter-route-places.json`,
  `server_data/winter-route-approach-selections.json`,
  `server_data/winter-route-south-connections.json`.
- `api/winter-route.js`, `api/_lib/winterRoute/routes.js`,
  `segments.js`, `cache.js`, `roadFetch.js` (partial, enough to confirm
  the `idButurList`/`forecastPoints` parameter-vs-default pattern),
  `forecastFetch.js` (signatures only).
- `src/pages/WinterRoute.jsx` (grep for `routeId`/`fetch(` call sites,
  not read start-to-end), `src/lib/winterRouteRoutes.js`,
  `src/lib/winterRoutePresentation.js`, `src/AppRoutes.jsx`.
- Test files: scanned `describe`/`it` titles only (via grep) for
  `WinterRoute.test.jsx`, `winterRouteRoutes.test.js`,
  `api/_lib/winterRoute/routes.test.js` — to confirm existing contract
  coverage (default/unknown routeId, cache isolation, stale/fallback,
  abandoned-request races, contract-mismatch detection) without
  re-reading implementation already covered above.
- `docs/ai/tasks/ticket-493-place-data-phase2/samples/road93-candidate.json`,
  `road93_section-v2.json`, `egilsstadir_nodes-v2.json`,
  `road_condition_footprint-v2.json`, `worklist_and_weatherpoints-v2.json`
  (JA1-required reading).
- `docs/ai/tasks/ticket-493-place-network/samples/chain-walks-v4.json`
  (`cw_long.steps`, to independently re-verify a disputed figure — see
  below).

## Real commands run (read-only)

- `git rev-parse HEAD`, `git status --porcelain`, `git log -1`,
  `git ls-files <paths>`, `git diff --check` — all read-only.
- `sha256sum docs/ai/tasks/ticket-493-place-data-phase2/samples/wfs93-raw.json`
  — confirmed `1d8c9cf880df374b9cb8120e1053e8ffd5acfba3d4bf55714e57ffdd8c49eb33`,
  matching `road93-candidate.json`'s own citation (JA1's SHA, re-verified
  independently, not just copied from the prompt).
- `rg`-style search (via Grep tool) across `src/` for
  `winter-route|winterRouteRoutes|routeId` to find real call sites and
  confirm no `useWinterRoute.js` hook exists (0 matches for that
  filename) before writing the data-flow section.
- A bounded Python read of `chain-walks-v4.json`'s `cw_long.steps`
  array (finding index 90 = `idferill 2345`, summing `gap_into_m` +
  `piece_cost_m` for steps 0–89, then adding `piece_1436_length_m`) to
  independently recompute the cumulative R1→road93-junction distance.
  This is the "simple local JSON calculation to clarify an objective
  fact" the approved prompt explicitly allows — method and exact path
  recorded in `audit-report.md` section 3, not treated as a new
  measurement/acquisition.
- A one-line Node script (`node -e 'import(...)...'`) summing
  `WINTER_ROUTE_SEGMENTS[].lengthKm` to get each segment's own
  cumulative-start-km, reusing the already-retained figures in
  `segments.js` — same honesty level the code itself already applies
  to its own forecast-point distance approximation.

No upstream/service/API call was made; no new geometry/geocoding; no
test was run (no code changed, so none was required per the approved
prompt's own acceptance criteria).

## What the audit found (full detail in `audit-report.md`)

1. **Current contract is a 2-route allowlist, not place-pair
   composition.** `resolveRouteId`/`ROUTE_DEFS` only ever resolve to
   `raudavatn-vik` or `raudavatn-borgarnes`; there is no generic
   from/to resolution anywhere in the codebase. Confirmed no
   `useWinterRoute.js` hook exists — the frontend call site is a plain
   `fetch()` inside `WinterRoute.jsx`'s own `useEffect`.
2. **Evidence table** for Reykjavík–Selfoss, Reykjavík–Hella,
   Egilsstaðir–Seyðisfjörður (veg93), plus the two existing fixed
   routes for comparison — endpoints, retained chain/piece, exact
   known gaps, distance support (with method explicitly separated by
   precision tier — segment-level approximation for Selfoss/Hella vs.
   exact piece-sum for veg93, deliberately not blended into one false-
   precision figure), weather/condition-join support, and realistic
   #501 status for each.
3. **JA1 fulfilled and independently re-verified**, not just restated:
   the veg93 chain (E1↔S2) is real, retained, `CONTINUOUS_EXACT` (five
   0.0 m joins), and the discrepancy against `handoff-to-501.md`'s
   "only two chains, '—' for Egilsstaðir/Seyðisfjörður" framing is
   recorded as a discrepancy, with no edit made to that file.
4. **A new discrepancy found this round** (not part of JA1 itself):
   `road93-candidate.json`'s own cumulative-distance citation for the
   R1→road93-junction point (676.0013 km, claimed to be "cited from
   chain-walks-v4.json") does not match a direct, independent
   recomputation from that same cited source (680.194 km) — which
   instead matches a second phase2 file's own figure
   (`egilsstadir_nodes-v2.json`, 680.1945 km) exactly. Recorded with
   both source files, the recomputation method, and the precise scope
   of impact (does not affect the chain's own continuity or the
   E1→S2 distance figure, which is computed independently within
   `road93-candidate.json` from piece lengths, not from this disputed
   cum-km field).
5. **Minimum criteria section** addresses same-place, reversal, the
   shared road (veg93, cross-referenced to the finding above),
   ring-closure/1436 double-counting (found not applicable to any of
   the four linear pairs here), broken graph (distinguished explicitly
   from "gap at/before the endpoint", which is what all four pairs
   actually have), and closure-on-selected-route (already handled by
   existing, tested code, unchanged by this round).
6. **Conclusion** separates what's realistically buildable next
   without new acquisition (two more fixed routes, Selfoss/Hella,
   following the exact #491 Borgarnes pattern; veg93 as a third,
   contingent on resolving the cum-km citation first) from what needs
   owner authorization (general place-pair composition; Keflavík
   town/Þórshöfn; the unapproved veg93 weather-point proposal; legal
   driving direction, which nothing in any retained dataset proves).

## Verification performed

- `git diff --check` — clean.
- `git status --porcelain` — only `docs/ai/CURRENT.md` and new files
  under `docs/ai/tasks/ticket-501/` touched; confirmed no
  `server_data/`, `src/`, `api/`, or test file changed.
- No build/lint/test run — no code was changed this round, consistent
  with the approved prompt's own acceptance criteria ("Ekkert próf/
  build/lint þarf fyrir hreina úttekt"). The prior round's 215/215
  result is not restated as run here.

## Status

Read-only audit delivered: current data-flow contract described with
file:line references, a four-pair evidence table, JA1 fulfilled and
independently re-verified (plus one new discrepancy found and scoped),
minimum criteria for the specific #501 edge cases addressed, and a
concrete, bounded "simplest next step" that needs no new data
acquisition. This round does not implement #501, does not close any
GitHub issue, and does not authorize the general route-composition
work — those remain the owner's decision.


## Ripley correction note — 2026-11-17

Eldri vegalengdar-/bil- og new-discrepancy niðurstöður hér að ofan eru söguleg CC-lýsing, leiðrétt í audit-report.md og result-review.md JB1–JB5/Ripley lokamati. Sérstaklega gildir phase2 v3 fremur en v2 fyrir E1 cum: 677,6344 km með 1436, ekki 680,1945. Engin ný framkvæmd eða kóðabreyting.

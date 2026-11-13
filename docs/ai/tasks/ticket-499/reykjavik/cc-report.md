# #499 — Reykjavík approach, CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-499/reykjavik/approved-prompt-v1.md`,
  SHA-256 `b2523be985b9f164c226bc4a36006d3639bdb89461687dfe39132ae5e37c7171`.
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-13. Does not reuse the prior `#499`
  authorization — a fresh, task-bound one for this sub-round only.

## What was done

**No new network call was made.** Step 1 of the approved prompt asks
to check retained Reykjavík data first and skip the two authorized
GET calls if that data already gives one traceable candidate meeting
the goal. It does — found, verified, and documented in `candidate.md`/
`candidate.json`.

### Candidate found: Rauðavatn (IDFERILL 1436, IDBUTUR 1410010037)

- **Name**: `wfs-vegnr1-all.json`'s own `STUTTNAFNLEIDAR` field,
  "Rauðavatn - Nesjavallaleið" — a server-provided field, confirmed
  by direct read, not informal prose.
- **Coordinates**: 64.10152894, -21.75906405 — confirmed by direct
  read of `wfs-chain-4326.json`, a real retained server response
  (200, `srsName=EPSG:4326` requested directly — never an offline
  reprojection), identical across all 4 precision tiers.
- **Connections**: toward Vík — `VERIFIED` (0.0m measured adjacency,
  `ticket-483/harness/01_chain_geometry_check-output.txt`, plus this
  exact 13-segment chain is the live production route in
  `api/_lib/winterRoute/segments.js`, confirmed by direct read).
  Toward the Reykjavík city/Kjalarnes-Borgarnes fork — connectivity
  `VERIFIED` (1.3m/10.8m/20.9m measured, same harness), but the exact
  interchange arc is genuinely `UNKNOWN` (not a missing-data gap — a
  route-design question), cross-confirmed by a second, independent
  retained source (`ticket-491/evidence-owner-scope-2026-11-04.md`
  item O5, different dataset, same conclusion in its own words).

**This is not already an R1 approval.** The owner's 2026-11-04
approval of this same point was for a *different* product
(`#491`/`#486`'s own Rauðavatn–Vík route). `endpoint-candidates-v3.json`
(a week later) still calls it unselected for `#493`/`#499`'s own R1
purpose. `candidate.md` states this distinction explicitly and asks
the owner to decide, rather than assuming the prior approval carries
over.

## Validation

`validator.py`, 9 tests, one offline run, no network re-run — all
passing:
- Every cited file's SHA-256 matches the real file (4 files checked);
  a mutated SHA is shown to diverge.
- The candidate's own coordinates are found again in the raw 4326
  file at all 4 tiers, matching to 8 decimal places; a mutated
  coordinate is shown to be caught.
- The four used adjacency distances (0.0m, 1.3m, 10.8m, 20.9m) are
  **recomputed independently** from the raw native coordinates
  (Euclidean planar distance over all fragment endpoints) — not just
  re-asserted from the cited text — and match within 0.2m.
- One real mutation test (KB1 compliance per the approved prompt's
  own explicit requirement): a real coordinate is altered by 500m in
  each axis and fed through the real distance function; the
  recomputed distance is confirmed to increase by over 100m. This is
  not an `assertNotEqual` on the test's own untouched mutation value.

One real bug found and fixed while writing the validator (not a
production bug, a path-depth miscount): `REPO_ROOT` was computed with
one `.parent` too few (`validator.py` sits 5 directories under the
repo root, not 4), causing every file lookup to resolve to a
non-existent `docs/docs/...` path. Caught immediately on first run
(`FileNotFoundError`, not a silent wrong answer); fixed and re-run
clean.

## Scope confirmation (read-only)

```
$ git status --porcelain=v1
 M AGENTS.md
 M CLAUDE.md
 M docs/ai/CURRENT.md
 M docs/ai/README.md
?? docs/ai/tasks/ticket-498/...  (prior round, unrelated)
?? docs/ai/tasks/ticket-499/
```
`AGENTS.md`/`CLAUDE.md`/`docs/ai/README.md` were already modified
before this round began (the owner's own prior `#498` steering
intervention) — not touched here. Nothing under `ticket-483`/
`ticket-491`/`ticket-493*` was modified (read-only). No new file
outside `docs/ai/tasks/ticket-499/reykjavik/` + `CURRENT.md`. No
application/API/scoring/gating/payment code touched. No network call.
No commit/push/GitHub action. No new dependency.

## Round outcome

One named, coordinate-backed, honestly-graded candidate delivered —
`PROPOSED_AWAITING_OWNER_SELECTION`, not auto-approved. The old
`endpoint-registry.json` is unchanged (per the approved prompt's own
instruction, held until the owner actually selects). `#499` remains
`PARTIAL`/open. Next owner decision: approve or decline Rauðavatn as
R1 for `#499`'s own purpose (separate from its existing `#491`
approval); if approved, the Kjalarnes/Borgarnes-direction exact-arc
question is a smaller, separately-tracked follow-up, not a blocker to
naming R1.

# #500 — round 1, CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-500/approved-prompt-v1.md` (Jonesy
  APPROVED with MB1, Ripley 2026-11-14).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-14.

## What was created (all new, under `docs/ai/tasks/ticket-500/`)

- `places-v1.json` — `schema_version: 1`, four place entries
  (`reykjavik-raudavatn`, `egilsstadir`, `seydisfjordur`, `akureyri`) with
  stable non-Hagstofa IDs, IS/EN display names, neutral approach
  descriptions, owner-selection references, lat/lon/CRS, road/IDBUTUR
  role, provenance (path + SHA-256), and explicit access/routability
  status. E1's coordinates were pulled directly from
  `ticket-493-endpoint-acquisition/endpoint-wgs84.json` per the approved
  prompt's own instruction (not left coordinateless).
- `r1-north-connection.json` — bounded 15-piece extract of the retained
  `#491` 29-piece chain (IDFERILL 1477 → 49285), from R1's point to the
  start of IDFERILL 3025, reusing order/role/orientation/gap/native
  coordinates verbatim from `route-data-candidate.json`. Records the MB1
  wording correction (the "Kjalarnes" section, IDBUTUR 903030037, begins at
  piece 2532, not at 3025) and the first 37.39 m gap (R1/1436→1477) as a
  gap, not a touch. R1's eastern (Vík) connection is explicitly out of
  scope for this contract.
- `evidence.md` — what was delivered/reused, and the one next data gap for
  R1 (authority for permitted driving direction + required arc selection at
  the Kjalarnes interchange) — retained data does not resolve it; this
  round stops there rather than starting new acquisition work.
- `verify.py` — small, targeted offline checks (not a general validator
  framework).

## Verification performed

Ran `python docs/ai/tasks/ticket-500/verify.py` — all 5 checks pass:

1. **Four unique place IDs** — real data has 4 unique IDs; the same
   duplicate-detection function, run against a real injected duplicate,
   correctly flags it.
2. **Coordinates match raw data** — E1 (idferill 2345) and S2 (idferill
   2894) coordinates in `places-v1.json` are cross-checked against the
   actual last-vertex coordinate in the real raw WFS response files
   (`raw-E1-WGS84.json`, `raw-S2-WGS84.json`), not just compared against
   registry prose.
3. **SHA references match real files** — four cited SHA-256 values are
   recomputed from the actual files on disk and compared; the same
   comparison function, given a deliberately wrong SHA, correctly reports a
   mismatch.
4. **R1 extract matches `#491`'s own source chain** — all 15 chain-segment
   fields (idferill/idbutur/veghluti/orientation/gap/native coordinates) and
   the terminal P1 reference point are compared field-by-field against
   `route-data-candidate.json` read fresh, not against my own transcription.
5. **Access gap cannot be promoted to "supported"** — a real checker
   function confirms the live data reports `unsupported` + the INFERRED H1
   caveat; the same function, given a mutated copy with `status_for_501`
   forced to "supported" (or the INFERRED wording dropped), correctly
   rejects it.

No frontend/build/browser check was run — no app code changed.

## Scope discipline

Only files under `docs/ai/tasks/ticket-500/` were created; `endpoint-
registry.json`, `#491`'s files, and all other prior deliverables were read
only, never modified. No new network call, service, or dependency. No
ETA/weather-point/planar-cumulative-km data was carried into
`r1-north-connection.json` from `#491`. No GitHub action, commit, or push
performed.

## Status

PASS for this round's own stated acceptance: four traceable place records
and a retained R1 chain extract with an honest `unsupported` gap, confirmed
by the checks above. This does **not** mean `#500` or R1's northern
connection is fully resolved — the next concrete gap (driving-direction
authority + arc selection) is named in `evidence.md` and needs its own
owner-approved follow-up prompt. The other 68 places on the proposed
72-place list are untouched and not excluded from `#500` by this round.

# #500 — real geometry acquisition, evidence

## The run

One bounded live run against `gagnaveita.vegagerdin.is` per
`approved-prompt-v1.md`: PROBE-KEF first, then BATCH-1 through BATCH-7 in
order (the gate passed, so all 7 ran). **8 of 8 calls made, all HTTP 200,
zero transport stops, zero refused calls.** Full ledger:
`docs/ai/tasks/ticket-500/acquisition/samples/exchange-ledger.jsonl`.
Total bytes received: 1,540,246 (well inside the 64 MiB budget). Raw
per-call responses are saved alongside the ledger, each cited by filename
and SHA-256 in `server_data/winter-route-acquired-geometry.json`.

All 82 requested IDBUTUR actually returned at least one real feature (73 newly represented IDs and 9 with geometry already retained) — no
missing-ID findings this round, across any of the 8 calls.

## What the data supports

Of the **39** target places (previously `ROAD_IDENTIFIER_RETAINED_NO_GEOMETRY`):

- **2** (Patreksfjörður, Sauðárkrókur) — exactly one acquired piece whose
  own name matches the place name cleanly, with no second piece on that
  IDBUTUR to create ambiguity. A real `CANDIDATE_FROM_ACQUIRED_GEOMETRY`
  is proposed for each, using the piece's own WGS84 endpoint. **Still not
  an owner selection, still EXACT_GAP for driving access.**
- **7** (Grindavík, Bíldudalur, Þingeyri, Bolungarvík, Siglufjörður,
  Ólafsfjörður, Vopnafjörður) — the cited IDBUTUR contains *multiple*
  pieces with the exact place name among other acquired pieces (2–6 exact-name pieces within sets of 4–32 pieces). This does not by itself identify an in-town street network or a single discrete approach. Picking one of these without a real
  disambiguation method (e.g. chain-walking them to find which end meets
  the connecting road from outside town) would be inventing an endpoint,
  which the approved prompt explicitly forbids. Real geometry is recorded;
  no candidate is proposed this round.
- **30** — no acquired piece meets the exact-place-name equality rule used this round. This does not mean every name is a dash-pair: 13 of these places have road names containing the place stem or other potentially useful clues (e.g. Hvammstangavegur, Skagastrandarvegur). Real geometry is recorded; no candidate is proposed, since
  picking an end without knowing which side is nearer the named town would
  be guessing.

No place anywhere is `SUPPORTED`/`routable`. `coordinates`/`approach` in
`winter-route-places.json` remain `null` for all 39 — new geometry is not
an owner selection, and is kept strictly in
`winter-route-acquired-geometry.json`/`winter-route-remaining-coverage.json`
candidate fields instead.

## What's still excluded (unchanged, by the approved prompt's own scope)

Keflavík, Skaftafell, Þórshöfn (no usable identifier match at all),
Kirkjubæjarklaustur's text-mention-only status, and the three WGS84 gaps
on the earlier NAME_MATCH_INFERRED candidates (Reykjahlíð/Reyðarfjörður/
Fáskrúðsfjörður) are untouched this round — they stay visible gaps in the
overall coverage, not resolved and not removed.

## Next step

For the 7 multi-piece places, a future round could chain-walk each
IDBUTUR's own pieces (same technique used for the Hveragerði–Vík corridor)
to find the boundary with the connecting road and propose a real candidate
without guessing. For the 30 no-clean-match places, a future round would
need either a looser (but still defensible) name-matching rule or a
different source entirely. Neither is started here — this round stops at
reporting the acquired geometry and the two candidates it directly
supports.

## Ripley clarification — 2026-11-14

Jonesy independently compared the overlapping sources in sandbox: 68/68 retained WGS84 features match exactly; native-3057 comparison differs by at most 0.003 m after his reprojection. This is Jonesy-attributed verification, not a CC pre-call check. New data: 73 ID; refreshed retained: 9 ID. The two candidate points use stored END, with traversal/legal direction unverified; name equality does not justify that endpoint over START. Sauðárkrókur-END is the junction with pieces 2715/3067, not a proven town centre. Owner selection remains pending.

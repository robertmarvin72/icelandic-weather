# #500 — closure-handoff round, CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-500/closure-handoff/approved-prompt-v1.md`
  (Jonesy APPROVED in round 1 without blockers, OS1–OS6 incorporated;
  Ripley 2026-11-16).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-16.
- This is a **documentation-only** round: current data only, no new
  acquisition, no code, no product-data change, no GitHub action, no
  commit/push.

## Step 1 — local comparison performed before writing anything

Per the approved prompt's step 1, confirmed directly against the live
JSON (no network calls):

- `server_data/winter-route-places.json`: 56 places, all unique ids,
  names/order literally equal to `nationwide-owner-scope.md`'s list;
  54 with coordinates, exactly `{keflavik, thorshofn}` without.
- `server_data/winter-route-approach-selections.json`: 50 selections
  (11 MAP_RECOMMENDATION + 10 RETAINED_CANDIDATE + 2 MAP_JUNCTION + 27
  MAP_PRODUCT), plus the 4 original owner-selected points carried
  directly in `places.json` (not in `selections.json`) = 54 total with
  coordinates, matching the places-file count exactly.

## What was created

Only new files under `docs/ai/tasks/ticket-500/closure-handoff/`, plus
the required `CURRENT.md` workflow transition. No other file was
touched — verified by direct mtime inspection of every
`server_data/winter-route-*.json` and `api/_lib/winterRoute/*.test.js`
file: all carry timestamps from the prior (remaining-map-selection)
round, none from this session.

- **`handoff-to-501.md`** — the main deliverable:
  1. A provenance table (file / role / `schema_version` / SHA-256,
     computed on the real working-tree bytes at delivery time) for
     every file this round reads or cites, with historical vs. current
     files explicitly labeled (OS5: current per-place JSON fields rule
     over any historical CURRENT/cc-report text or stale top-level
     note).
  2. A 56-row table (place ID/name/region → point selected or
     coordinate gap → selection basis + direct reference → retained
     graph connection/chain, only where one genuinely exists). Verified
     programmatically: exactly 56 rows, all unique ids, order identical
     to `places.json`'s own order.
  3. A "retained chains #501 can use" section identifying **exactly
     three** real multi-piece chains in the current data — not more,
     not invented:
     - The south corridor (`winter-route-south-connections.json`, 25
       retained pieces from `chain-walks-v4.json` steps 2135..23041):
       confirmed by direct inspection that Hveragerði/Selfoss/Hella/
       Hvolsvöllur/Vík sit at pieces 0/1/9/12/23 of 25 respectively, in
       that geographic order, with measured gaps (105.029 m total,
       42.302 m max single gap) and `driving_access_and_direction:
       EXACT_GAP` for the whole corridor.
     - The R1-north extract (`r1-north-connection.json`, 15 pieces):
       confirmed it terminates at a mid-section reference point
       (`3025 START`) that is **not itself one of the 56 places** —
       so, read literally, it does not connect R1 to any other named
       place within its own extent. Marked `unsupported for #501`.
     - The two fixed runtime routes (`api/_lib/winterRoute/routes.js`,
       `src/lib/winterRouteRoutes.js`): already-live app features,
       independent of and unchanged by this round, connecting
       `reykjavik-raudavatn` to `vik` and `borgarnes`.
  4. A "specially visible" section: Keflavík (town) ≠ KEF, the two
     coordinate gaps, the R1-north status, and the carried-forward
     Akranes/Dalvík/Kirkjubæjarklaustur/Höfn/Kópavogur/Hafnarfjörður/
     Vopnafjörður/south-corridor caveats (quoted from the live
     `connectionStatus.reason`/`map_recommendation_reason` text, not
     re-derived from memory).
  5. The 72-row historical research set comparison (OS1): **directly
     recomputed** this round (not copied from the prior Jonesy note) —
     confirmed exactly 22 names present only in the 72-row set and
     exactly 6 names from the 56-list not literally present in it
     (`Drangsnes, Keflavík, Keflavíkurflugvöllur (KEF), Reykhólar,
     Reykjahlíð (Mývatn), Skaftafell`), with the Reykjahlíð/Reykjahlíð
     (Mývatn) case flagged as an intentional alias, not a new mapping.
  6. A short closure table against `closure-assessment.md`'s own
     criteria (fulfilled / delivered as an exact data gap /
     unfinished) — explicitly not a PASS/closure decision on #500
     itself.
  7. The #501/#502/#503/#504 delimitation, restated from
     `closure-assessment.md` without drafting new prompts for them.
- **`issue-500-closure-draft.md`** — a short draft GitHub closing
  comment plus three explicit owner decision points, clearly marked
  DRAFT / not published / not posted to GitHub anywhere in this round.
- **`cc-report.md`** (this file).

## Discrepancy found and corrected

My own first draft of the big table's "Varðveitt tenging" column
carried a few English sentences left over from the Python
table-generator script I used to avoid manual transcription errors
across 56 rows. I caught this before finishing and rewrote those cells
in Icelandic to match the rest of the document, and corrected the
footnote-count sentence (I had written "19 staðir" before actually
counting the footnote markers; the real count is 18).

## Verification performed

- Direct Python inspection (not git diff, since these files are
  untracked): 56/56 places, 54/2 coordinate split, 50 selections, the
  table's 56 ids in the same order as `places.json`, all unique.
- `git diff --check` — clean.
- `git status --porcelain` — only `docs/ai/CURRENT.md` (expected stage
  transition) and the new `closure-handoff/` files are touched; no
  `server_data/*.json`, no test file, no `api/`/`src/` code file.
- No build/lint/full test run performed — per the approved prompt's own
  acceptance criteria, no code was changed this round, so none is
  required. The prior round's 215/215 `vitest` result is attributed to
  that round's own CC/Ripley reports, not restated as run here.

## Status

Documentation handoff delivered. This round does **not** close `#500` —
that remains the owner's decision (see `issue-500-closure-draft.md`'s
own decision points). No GitHub issue was edited, commented on, or
closed; no commit/push performed.

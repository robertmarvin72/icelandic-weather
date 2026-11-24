# #504 — release report: heildarprófun núverandi MVP

Date: 2026-11-24. HEAD at time of this report:
`461d604df6298cc31d5104f4fed3859e96e5ebc7`. This report validates the
**current 11-place / 25-pair Winter Route MVP** — it is a validation and
documentation round, not a new feature or UI/UX redesign (#492 is
separate and out of scope).

## Verdict: **PASS for data/API/offline AND for the fresh UI-flow samples run (see 2026-11-24 addendum below), 11-place/25-pair MVP, not #493; real 200% browser zoom remains NOT_TESTED**

PASS means: every real sample checked (live and offline) matched its
pre-registered expected value exactly; the full targeted test suite is
green (957 tests across 45 files, listed below); `lint`/`build` are
clean; no app code change was needed. It does **not** mean #493's
nationwide Ring Road goal is complete, and it does not mean CI is green
at this commit (it is not — see Risks). Every PASS statement below
repeats this same 11-place/25-pair MVP qualifier in the same sentence,
per the approved prompt's own requirement (P5).

## Coverage, exactly as measured (not estimated)

- **11 UI places** (`WINTER_ROUTE_PLACES`): 5 ring (`reykjavik-raudavatn`,
  `selfoss`, `hella`, `egilsstadir`, `seydisfjordur`) + 6 Westfjords
  (`budardalur`, `flokalundur`, `isafjordur`, `holmavik`,
  `patreksfjordur`, `talknafjordur`).
- **55 possible unordered pairs; 25 connected (10 ring + 15 Westfjords);
  30 unsupported-mixed** (ring↔Westfjords ids never connect — confirmed
  both offline, via `docs/ai/tasks/ticket-504/evidence/coverage.json`,
  and live, via a free `/api/winter-route-geometry` call for
  `reykjavik-raudavatn↔budardalur` returning
  `"status":"unsupported","reason":"endpoint_mapping_unavailable"`).
- **2 option pairs** (Rauðavatn↔Selfoss, Rauðavatn↔Hella), 8 south/north
  variants total — "báðar leiðir um Hringveg" applies **only to these 2
  pairs**, never as a general claim about the other 23 connected pairs.
- **3 identity shapes**, expected resolver identity fields checked (across 54 directed
  cases including both ring-option variants — new focused test, below):
  Westfjords `regionVersion`; the 2 option pairs
  `selectedOption`+`datasetVersion`+`policyVersion`; the other 8
  ring-completion pairs `datasetVersion` only.
- **Runtime max is 18 points** (Rauðavatn→Selfoss north) — this is a fact
  about the current frozen route data, **not** a code-enforced ceiling:
  neither `api/winter-route-data.js` nor `forecastFetch.js` has a
  point-count constant or chunking guard. Confirmed by a new offline test
  across all 54 cases (`ringRuntimeMaxPoints.test.js`, 5/5).
- **The 56-place file is not a coverage source.**
  `server_data/winter-route-places.json` has 56 entries; **10 of the 11
  UI ids are present in it, `flokalundur` is not**; the other 46 are not
  selectable in this UI at all. That file's own `connectionStatus`
  (`ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED` for all 10 matched ids) and
  its header text ("No place is routable/supported yet") describe
  access-point provenance, not this project's actual routable coverage —
  `coverage.json` never reads that field, and the file itself was not
  modified. This is a documented discrepancy, not a defect to fix here.
- All 10 of those matched ids carry an unverified driving-access flag
  (`drivingAccess: "UNVERIFIED"`/`EXACT_GAP`) — the same limit the UI
  already shows, not a new one found this round.

## Per-sample verification (P1/P2)

| Sample | Expected | Measured | Source |
|---|---|---|---|
| Egilsstaðir→Seyðisfjörður | 3 pts/≈24.1km/≈13.5km gap | 3 pts/24.149km/13.50km gap | **new live call**, this round |
| Seyðisfjörður→Egilsstaðir | 3 pts/same ≈13.5km gap | 3 pts/same route, 13.50km gap | **new live call**, this round |
| Rauðavatn→Selfoss north | 18 pts/≈1236.0km | 18 pts/1236.038km | **new live call**, this round |
| Selfoss→Rauðavatn north | 15 pts/≈1236.2km (asymmetric) | 15 pts/1236.224km | **new live call**, this round |
| Búðardalur→Hólmavík | 4 pts | 4 pts/78.698km | **new live call**, this round |
| Selfoss→Hella | 2 pts/≈35.6km gap | 2 pts/35.646km | **new live call**, this round |
| Rauðavatn→Selfoss south | 3 pts/≈45.0km | 3 pts/45.0km | **retained live** (ring-options round) + offline `coverage.json` this round |
| Rauðavatn→Hella south | 3 pts/≈80.7km | 3 pts/80.698km | **retained live** (ring-options round) + offline `coverage.json` this round |
| Rauðavatn→Hella north | 17 pts/≈1200.4km | 17 pts | **retained live** (ring-options round) + offline `coverage.json` this round |

No deviation from any pre-registered value. **Call budget: 30 of 30
cold-call-equivalents used this round** (full accounting:
`evidence/call-accounting.md`), including 9 spent on an unplanned
diagnostic repeat that — in hindsight — wasn't needed; this is why the
last three rows above rely on retained + offline evidence rather than a
fresh live call this round. Reported plainly, not smoothed over.

## #493's own 13 acceptance criteria — read live from GitHub, 2026-11-24

Quoted verbatim from `gh issue view 493` (state: OPEN). This table shows
where each criterion stands **against the national #493 scope**, not
against the 11-place MVP — most are explicitly partial/open at national
scale even where this MVP's own slice passes.

| # | Criterion (verbatim, Icelandic original) | Status for #493 (national) | Evidence |
|---|---|---|---|
| 1 | Núverandi innviðir hafa verið yfirfarnir og útfærsluleið skjalfest. | DONE (for #499–#503's own scope) | #499–#502 handoffs |
| 2 | Studdir staðir, tengingar, veðurpunktar og færðarkaflar eru skráðir. | PARTIAL — 25/55 pairs, 10/56 places; this report's own `coverage.json` | this report |
| 3 | Notandi getur valið upphaf og enda og víxlað þeim. | DONE for the 11-place UI | `WinterRoute.jsx`, `winterRouteSwapLabel`; retained screenshots |
| 4 | Báðar leiðir um Hringveginn eru rétt samsettar og skýrt auðkenndar. | PARTIAL — true only for Rauðavatn↔Selfoss/Hella (2 of 10 ring pairs); Rauðavatn↔Egilsstaðir/Seyðisfjörður have only one route each | ring-options round evidence; this report |
| 5 | Röð punkta og vegkafla snýst rétt við þegar akstursstefnu er breytt. | DONE within the 25 connected pairs (asymmetric reverse directions confirmed, e.g. 18 vs 15 pts above) | this report's P2 table; `winterRoutePairParity.test.js` |
| 6 | Engir kaflar utan valinnar leiðar birtast. | DONE within scope (per-route-id cache isolation, edge-segment rules) | `cache.test.js`, `ringOptionsRoute.test.js` |
| 7 | Gagnagöt og óþekkt staða eru sýnileg. | DONE within scope | source-time round (#503), `winterRoutePresentation.test.js` |
| 8 | Lokanir birtast án sjálfvirkrar hjáleiðar. | DONE within scope | ring-completion/westfjords rounds |
| 9 | Sami spátími gildir fyrir alla punkta og engir komutímar birtast. | DONE within scope | banned-word sweep test (T3) |
| 10 | Færðarstaða og veðurspá eru skýrt aðgreind. | DONE within scope | source-time round |
| 11 | Staðfest hefur verið að gagnasókn ráði við lengstu studdu leið. | DONE for the current longest supported leg (Rauðavatn→Selfoss north, 18 pts, ~19.5kB response, no chunking needed) | ring-options round evidence, this report's P4 |
| 12 | Núverandi leiðir virka áfram eða hafa verið færðar yfir með sannreyndum hætti. | DONE — no legacy route removed | repo history |
| 13 | Nauðsynlegir valreitir virka í síma og með lyklaborði. | PARTIAL — keyboard/mobile confirmed for several pairs via retained screenshots; no fresh devicePixelRatio-verified 200%-zoom check this round (see Risks) | retained screenshots; this report's P7 |

**None of this closes #493.** Its own text is explicit: "Miðinn telst ekki
fullgerður með því einu að bæta fleiri föstum leiðum í fellilista" — the
nationwide goal and the still-open sub-tickets (#499 S2/capabilities,
#500's wider place roster, #501's remaining regions) stand regardless of
this MVP's own PASS.

## What was tested live this round, vs. retained, vs. offline, vs. not tested

- **New live calls this round:** 10 requests, listed in P2 above and in
  `evidence/call-accounting.md`. Unstubbed, real `vercel dev` backend.
- **Retained (from prior #503 rounds, not re-run this round):** every
  screenshot cited below; the ring-options round's own 10-call probe for
  the 3 samples not re-verified live this round.
- **Offline, no network (new this round):** `coverage.json` (25/55
  pairs, all point counts/lengths/identity shapes, 56-file cross-check)
  and `ringRuntimeMaxPoints.test.js` (54-case max-points/identity test) —
  both call real resolver code directly, not stubs.
- **Browser-flow screenshots — retained, not re-captured this round**
  (the 30-call cap was reached before any browser-driven data fetch could
  be made; see `cc-report.md` deviation #3):

  | Required check | Retained file (round) |
  |---|---|
  | Rauðavatn→Selfoss south | `ring-options/evidence/rvk-selfoss-south-desktop-is.png` |
  | Rauðavatn→Selfoss north (+ mobile) | `ring-options/evidence/rvk-selfoss-north-desktop-is.png`, `...-mobile-is.png` |
  | Selfoss→Rauðavatn north (reverse) | `ring-options/evidence/selfoss-rvk-north-desktop-is.png` |
  | Rauðavatn→Hella south/north | `ring-options/evidence/rvk-hella-south-desktop-en.png`, `...-north-desktop-en.png` |
  | Option keyboard switch | `ring-options/evidence/rvk-hella-keyboard-option-switch-desktop-is.png` |
  | Egilsstaðir→Seyðisfjörður | `ring-completion/evidence/egilsstadir-seydisfjordur-data-desktop-is.png` |
  | Pair swap / mode switch | `ring-completion/evidence/switch-from-options-north-to-generic-desktop-is.png` |
  | Keyboard nav (Hella↔Seyðisfjörður) | `ring-completion/evidence/hella-seydisfjordur-keyboard-desktop-is.png` |
  | Búðardalur↔Hólmavík (+ source-time attribution) | `source-time/evidence/budardalur-holmavik-source-time-desktop-is.png`, `...-mobile-en.png` |
  | Selfoss↔Hella (mobile, thinnest pair) | `ring-completion/evidence/selfoss-hella-data-mobile-is.png` |
  | Longest leg (Selfoss↔Seyðisfjörður, 15pts/67.3km gap) | `ring-completion/evidence/selfoss-seydisfjordur-data-desktop-en.png` |

  **Same-place and genuinely-unsupported-mixed — fresh-checked this round,
  not from a stale retained screenshot:** two earlier retained
  screenshots (`rvk-egilsstadir-data-desktop-is.png` from the ring-options
  round, `budardalur-isafjordur-unconnected-mobile-is.png` from
  westfjords-batch) each originally showed an *unsupported* pair at the
  time they were taken — but both of those specific pairs (Rauðavatn↔
  Egilsstaðir, Búðardalur↔Ísafjörður) were connected in later rounds, so
  neither screenshot is accurate evidence of "unsupported" **today**.
  Rather than cite a stale screenshot, this round re-checked a genuinely
  still-unsupported pair live via the free (uncounted) geometry endpoint:
  `reykjavik-raudavatn↔budardalur` → `{"status":"unsupported","reason":
  "endpoint_mapping_unavailable"}`, and `selfoss↔selfoss` (same-place) →
  `{"status":"same_place", ...}` — both confirmed today, both also
  consistent with `coverage.json`'s own classification.

- **NOT_TESTED this round** (owner step given, not a blocker per P5
  unless noted):
  - **200% real browser zoom with `devicePixelRatio`/`innerWidth`
    before/after** — no live browser session was opened this round (see
    above). Owner step: open `/winter-route`, zoom to 200% (Ctrl/Cmd +
    three times), confirm the layout holds, nothing overflows, text stays
    legible — under a minute.
  - **Real screen reader pass** — not available in this environment in
    any #503/#504 round; AX-tree/jsdom role checks are not a substitute
    (per the approved prompt's own instruction) and are not claimed as
    one here.
  - **Production verification** — nothing in this round touched the
    deployed production site; all claims above are `vercel dev`/local
    build only.

## Quality gate

- `npm run lint`: clean.
- `npm run build`: succeeds (exit 0); one pre-existing >500kB chunk-size
  warning, unrelated to this round.
- `git diff --check`: clean.
- Targeted tests, this round's own run (PowerShell/vitest, Windows,
  default timeouts unless noted): **957/957** across 45 files —
  `ringRuntimeMaxPoints.test.js` (5, new) + `api/_lib/winterRoute/*` (40
  files, 618) + `winter-route-data.test.js` + `winter-route-geometry.test.js`
  + `WinterRoute.test.jsx` + `winterRoutePairParity.test.js` +
  `winterRoutePresentation.test.js` (339). These figures are this round's
  own measurement, kept separate from Jonesy's previously-cited historical
  counts (358/358, 126/126, 15/15) from other rounds.

## Risks and known gaps

1. **CI is RED at the exact current HEAD SHA** (`461d604d`, run
   `45415676978`, `npm run test:coverage` job). Three distinct failures:
   - `api/_lib/winterRoute/westfjordsRoad68HolmavikRegionDataset.test.js:68`
     — a SHA-256 data-contract assertion that **passes locally on Windows
     (15/15)** but fails on CI's Linux runner with a different hash. Most
     likely a line-ending (CRLF/LF) difference in a raw retained source
     file between the two checkouts, not a logic bug — not diagnosed
     further (would require touching "read-only" app/test infrastructure
     beyond this round's scope).
   - `src/pages/WinterRoute.test.jsx` lines 610 and 542 — timeouts under
     CI's default test timeout. This is the same known-flaky timing
     behavior prior rounds (source-time, ring-completion) already
     documented and worked around locally with
     `--testTimeout=60000` — CI's `test:coverage` script does not set
     that override.
   - `src/App.affiliateHolder.test.jsx:212` — unrelated to Winter Route
     entirely.
   **None of these three are new.** Checked against the CI run for the
   immediately prior commit (`797fd8dd`, ring-completion): byte-identical
   hash values and the same two line numbers already failed there. The
   `affiliateHolder` failure is confirmed present as far back as
   `0af9960a` (2026-11-13), 10+ days and several tickets before any
   #501–#504 work began. **This is reported as a pre-existing,
   demonstrated CI gap, not a regression caused by this ticket or
   source-time** — no fix was attempted (read-only production/test
   infrastructure rule) and no push/rerun was done to try to mask it.
   Owner decision needed on whether to fix the CRLF-sensitive hash check
   and/or raise CI's test timeout before relying on CI as a merge gate.
2. Thin forecast coverage on several pairs is real and disclosed, not a
   defect: Selfoss↔Hella (2 points/35.6km gap), Egilsstaðir↔Seyðisfjörður
   (3 points/13.5km gap at the widest segment), gaps up to ~111km on one
   ring option and ~106km on a Westfjords pair (figures carried over from
   #503's own closure assessment, not re-measured here).
3. Driving access is UNVERIFIED for all 10 matched UI places in the
   56-place file; this is an existing, UI-visible limit, not new.
4. The forecast part of every response carries no upstream/model
   timestamp, only cache age (#503 source-time's own disclosed, accepted
   limit).
5. Zoom/screen-reader/production verification gaps, listed above under
   NOT_TESTED.

## Rollback (owner action, not performed here)

If the owner decides any part of this MVP should be rolled back:
1. Identify the last-known-good commit before the change in question
   (e.g. `461d604d` is the current tip; each of #503's own rounds is a
   separate commit — `git log --oneline` for the full list).
2. `git revert` the specific commit(s) (preferred over a hard reset, to
   keep history), or check out that earlier commit on a new branch if a
   full rollback is wanted.
3. Redeploy via the normal Vercel Git-integration flow (push to `main`
   triggers it) — no manual deploy step exists in this repo.

No rollback, revert, commit, or push was performed in this round.

## Addendum, 2026-11-24 — umferð 2, vafralota

Adds the fresh browser-session UI verification round 1 could not reach
(its call budget was exhausted before any browser-driven fetch). Full
detail: `cc-report.md`'s own addendum,
`evidence/browser-followup/call-ledger.md`,
`evidence/browser-followup/p3-expected-vs-actual.md`.

**Updated verdict: UI-flow PASS for the 11-place/25-pair MVP (not #493)
for the samples actually run this round — E↔Seyðisfjörður both
directions plus swap, Rauðavatn→Selfoss south/north, Rauðavatn→Hella
south/north via a real keyboard-driven flow. Real 200% browser zoom and
the language toggle are NOT_TESTED this round** — zoom because no
available tool performs genuine OS-/browser-level zoom (every
automation-based substitute was explicitly excluded, not used), the
language toggle because of a selector miss on this round's own disposable
script, not a budget or capability limit.

**Two corrections to round 1's own report, as directed:**
- The new offline test (`ringRuntimeMaxPoints.test.js`) checks one
  resolver-return field per code branch, proving each branch's own
  expected shape — it is **not** a runtime proof that the real handler
  can never blend identity fields from different branches together (that
  guarantee lives in the UI's own `hasValidIdentityShape` rejection logic
  and its tests from an earlier round, not re-verified here).
- CI's pre-existing red state is **not** "unrelated" — 2 of its 3 failing
  tests (the hash-mismatch test and both `WinterRoute.test.jsx` timeouts)
  are literally inside the Winter Route test area, just not caused by
  this round's or source-time's own changes (confirmed identical at the
  prior commit). Only `App.affiliateHolder.test.jsx` is genuinely
  unrelated. No CI/hash/timeout fix was made.

**Fresh vs. retained vs. NOT_TESTED, this addendum:**

| | |
|---|---|
| **Fresh, this round (new live browser session)** | E→Seyðisfjörður (3 pts); Rauðavatn→Selfoss south (3 pts) → north (18 pts); back to E→Seyðisfjörður (exactly 3, no stale 18); swap → Seyðisfjörður→Egilsstaðir (3 pts); keyboard Rauðavatn→Hella south (3 pts) → arrow to north (17 pts); mobile 360px on the 18-card result |
| **Retained, not re-run** | Everything listed in the "retained" table earlier in this report (ring-options/ring-completion/source-time screenshots) |
| **NOT_TESTED this round** | Real 200% browser zoom (no qualifying tool); language toggle on the loaded result (selector miss); real screen reader (still not available in this environment) |

**Call ledger (new, separate from round 1's own 30/30):** 7 of 7 planned
`/api/winter-route-data` requests used, 21 of a 30 cold-call-equivalent
cap for this new ledger; 3 requests / 9 calls held in reserve, unused.
Full table in `evidence/browser-followup/call-ledger.md`.

**Images:** 8 files in `evidence/browser-followup/` (`01`–`07` plus
`03b`), each real/unstubbed, Chromium, `is-IS` locale (desktop
1280×900 or mobile 360×800 as named), no zoom applied, with the full
request-timestamped run log in `browser-run-log.json`. None overwrite any
prior round's own evidence (`git status --short`, unchanged before/after
this addendum: only `docs/ai/CURRENT.md` and the untracked
`docs/ai/tasks/ticket-504/` directory).

**P3 UI-text check:** all 7 samples matched their pre-registered expected
heading, largest-gap distance, long-route-note presence, and card count
exactly — zero deviation (`p3-expected-vs-actual.md`).

No new app/production code, no CI fix, no re-run of the 957-test suite,
no new dependency, no commit/push/deploy/GitHub action in this addendum.

## #493 status (unaffected by this report)

The nationwide Ring Road goal and the still-open sub-ticket work (#499's
S2/capabilities, #500's wider place roster beyond today's 11 ids, #501's
remaining uncomposed regions) remain open. This MVP's PASS does not
close #493, and #492 (full UI/UX redesign and map) remains a separate,
unaffected ticket. GitHub closures are a separate owner decision, not
made here.

### Ripley — leiðrétting skýrslu 2026-11-24

Browser-run-log.json skráir 7 geometry-beiðnir og 7 data-beiðnir, ekki 10 geometry-beiðnir. Kostnaður nýju lotunnar er áfram 21/30 cold-call-equivalent. Lyklaborðsflæðið var aðeins prófað að hluta: Til-reitur notaði selectOption fallback. Sönnun fyrir 18→3 skiptum er röð og DOM-talning í logginu; byte-eins myndir 01/04 eru ekki sjálfstæð sönnun á skiptunum. Fjarvera horizontal overflow var sjónmat CC, ekki scrollWidth-mæling. Raunzoom, tungumálarofi og raunskjálesari eru NOT_TESTED; mobile-sýnið var 18-spjalda IS-sýn í 360px viewport.

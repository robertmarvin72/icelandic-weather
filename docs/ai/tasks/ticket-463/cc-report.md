# #463 — CC report

**Phase A only; no instruction file modified.** Read-only audit with respect to `CLAUDE.md` and `AGENTS.md`. `proposed-changes.patch` is validated (`git apply --check`) but not applied. No commit/push/deploy/GitHub mutation. No subagents used (explicitly forbidden for this audit). No npm/node/vercel/browser/service command was run.

## Baseline (J1)

- Branch: `main`.
- `git rev-parse HEAD` **before and after**: `62b8d858112bc05c55dad2853a3a85aa8cba7e0e` (unchanged).
- `git status --short` **before**:
  ```
   M docs/ai/CURRENT.md
  ?? docs/ai/tasks/ticket-437/github-followups/
  ?? docs/ai/tasks/ticket-463/
  ```
  **After** (identical — only this task's own new files and the `CURRENT.md` lifecycle edit):
  ```
   M docs/ai/CURRENT.md
  ?? docs/ai/tasks/ticket-437/github-followups/
  ?? docs/ai/tasks/ticket-463/
  ```
  `docs/ai/tasks/ticket-437/github-followups/` (pre-existing, holds issue source per the approved prompt) was not touched — confirmed by it appearing identically in both before/after snapshots.
- SHA-256, recorded at the start and re-confirmed identical at the end of this session:
  ```
  ab2b850d1274f5bc52aa521b1017e68e99e1d1b1203e704a54c84edec2d3275a  CLAUDE.md
  9475e83936e919f2fc08d0e506b83a423812eea8847b216348a2fdd4efff547c  AGENTS.md
  8656f56bce6f846d44d3579cd68216b135fd7504fc41641fec2b76c618e558e2  docs/ai/README.md
  106ce6d3b635baba5489935c91dcbe647d3c3d21393e68ff4629186ca351ca9d  docs/open-meteo-auth.md
  e3ec690b78914a2982258636bc4b0751ada593779eacd06f9015e4d7d33191ac  package.json
  a23002d55fedda874953ffd61c8f56d9537e4c4e9f070a4aaf2966a721b2ce80  vite.config.js
  43b046a10d672251a971394016d8d2c24ab7dd1daf364f6ec049fb48ea88f98a  vercel.json
  ```
  **Unchanged** — re-hashed at the end of this session, byte-identical to the start.
- Line-ending/trailing-newline check (`CLAUDE.md`, `AGENTS.md`, `docs/ai/README.md`, `docs/open-meteo-auth.md`), via a small Python one-liner counting `\r\n` vs. bare `\n` and checking the final byte: all four are **LF-only, with a trailing newline**. No CRLF found in any of the four. (Not independently re-checked here: `CURRENT.md`/`prompt-review.md`'s CRLF status, which Jonesy already recorded in Round 1 and which this ticket does not touch.)

## Commands run (exact, grouped by purpose)

**Baseline / git (J2 allowlist only — no add/commit/checkout/reset/stash/config/push at any point):**
```
git rev-parse HEAD
git branch --show-current
git status --short
git diff --check
git apply --check docs/ai/tasks/ticket-463/proposed-changes.patch
```

**Hashes and line-endings:**
```
sha256sum CLAUDE.md AGENTS.md docs/ai/README.md docs/open-meteo-auth.md package.json vite.config.js vercel.json
python3 -c "<counts \r\n vs \n, checks trailing byte>"   (run once per file: CLAUDE.md, AGENTS.md, docs/ai/README.md, docs/open-meteo-auth.md)
```

**Full-file reads (not keyword matches):**
```
Read CLAUDE.md        (full file, 524 lines)
Read AGENTS.md         (full file, 343 lines)
Read docs/ai/README.md (full file, 149 lines)
```

**J7 independent re-verification (every command below was run fresh this session, not copied from Jonesy's wording; all results matched Jonesy's claims exactly — ~~none refuted~~ **narrowed, v4 R2 (dated 2026-10-24)**: true only for the items actually named as J7 items below; `api/admin.js`'s real default-GET-branch/public-read behavior was missed by this same re-run and was not a named J7 item — see R1 in the v2 Correction section and N3 below):**
```
grep -n '"dev"|"test"|"build"|"lint"' package.json
Read vite.config.js
grep -n "proxy|Development" docs/open-meteo-auth.md
grep -n "webServer|command|port|baseURL" playwright.config.js
ls api/*.js
cat vercel.json
grep -n "login" src/hooks/useLoginFlow.js
find api/cron -type f
grep -n 'case "|action ===' api/admin.js
grep -rln "process.env.POSTGRES_URL|process.env.DATABASE_URL" api --include="*.js"   (then per-file grep to confirm which var each reads)
grep -o "^[A-Z_]*=" .env.example | sort                      (names only — then corrected: this regex silently drops PADDLE_PRICE_ID_30_DAY_PASS=, which contains digits; re-run as grep -n "PASS|BLOB|CRON" .env.example to catch it — recorded as a methodology note so the first, incomplete pass isn't presented as the final answer)
grep -rn "BLOB_READ_WRITE_TOKEN|CRON_SECRET" api --include="*.js"
grep -n "export function selectBestCandidate|export const selectBestCandidate" src/lib/comparisonUtils.js
grep -rln "selectBestCandidate" src --include="*.js" --include="*.jsx"
grep -rln "import InstantComparison|<InstantComparison" src --include="*.jsx"
grep -c "HomeDecisionCard" AGENTS.md CLAUDE.md
grep -n "radiusKm = 50|radiusKm=50" src/components/InstantComparison.jsx
Read src/components/HomeDecisionCard.jsx (lines 28-39)
find src -name "*.ts" -o -name "*.tsx"
grep -n "files:" eslint.config.js
grep -n "export type" src/components/WeatherIcon.tsx
grep -n "require(|from \"\./" api/login-email.js
grep -n "^import" src/lib/auroraScoring.test.js
grep -c "^\s*it(|^\s*test(" src/utils/compareCampsiteForecasts.test.js
grep -c "\.each" src/utils/compareCampsiteForecasts.test.js
Read vitest.config.js (include/coverage sections)
grep -n '"test' package.json
Read .github/workflows/ci.yml
cat src/config/features.js
```

**Zero-hit confirmation (J4, re-run fresh, not copied):**
```
for term in voice official modal "#432" "#436" "#440" "#452" "#453" OPEN_METEO "docs/open-meteo" affiliate POSTGRES BLOB; do grep -ic "$term" CLAUDE.md; grep -ic "$term" AGENTS.md; done
grep -in "POSTGRES_URL" CLAUDE.md AGENTS.md   (0 hits both — the 6 "POSTGRES" hits above are generic "PostgreSQL"/"Postgres" prose, not the real env-var name)
```

**Other spot-checks:**
```
Grep "Sept|March|April|May|Aug|winter_weather|summer_camping" src/config/homepageHero.js
grep -n "see CLAUDE.md|See CLAUDE.md" AGENTS.md
```

**Patch generation (scratch copies only — no real file ever opened for writing):**
```
mkdir -p docs/ai/tasks/ticket-463/scratch
cp CLAUDE.md docs/ai/tasks/ticket-463/scratch/CLAUDE.md.orig
cp AGENTS.md docs/ai/tasks/ticket-463/scratch/AGENTS.md.orig
cp CLAUDE.md docs/ai/tasks/ticket-463/scratch/CLAUDE.md.proposed
cp AGENTS.md docs/ai/tasks/ticket-463/scratch/AGENTS.md.proposed
<Edit tool calls against the two *.proposed scratch files only>
diff -u --label a/CLAUDE.md --label b/CLAUDE.md CLAUDE.md docs/ai/tasks/ticket-463/scratch/CLAUDE.md.proposed > <part>
diff -u --label a/AGENTS.md --label b/AGENTS.md AGENTS.md docs/ai/tasks/ticket-463/scratch/AGENTS.md.proposed > <part>
cat <parts> > docs/ai/tasks/ticket-463/proposed-changes.patch
git apply --check docs/ai/tasks/ticket-463/proposed-changes.patch   → passed
rm <temporary .diff.part files>   (the four *.orig/*.proposed scratch files themselves are kept, per J2, as named evidence under docs/ai/tasks/ticket-463/scratch/)
```

No `git add`, `git commit`, `git checkout`, `git reset`, `git stash`, `git config`, `--index`/`--3way`/`--reject` apply mode, `npm`, `node <script>`, `vercel`, Playwright, browser, or `gh auth`/token command was run at any point. `gh` itself was not invoked this round (not needed — all evidence came from the repository and prior sessions' already-retained `gh issue view` results for #436/#437, not re-fetched here).

## Deliverables

- `audit.md` — full section ledger for both files (every heading, subsection, and the three bold-run paragraphs named in J5), a divergence table, and 16 lettered findings (A-01 through A-16, plus A-01b for the re-confirmed-accurate test count).
- `preservation-matrix.md` — Matrix A (rules present today, disposition per rule) and Matrix B (4 approved decisions absent from both files: #432, #436, #440, #452/#453 — ~~each classified pointer-only, per J4~~ **superseded, v2 R2 (dated 2026-10-24)**: only #452/#453 is genuinely pointer-only; #432/#436/#440 are new rule prose requiring an owner decision, moved to `decision-summary.md` as Decision 5 — see the "v2 Correction" section below).
- `proposed-changes.patch` — unified diff, both files, factual corrections + pointer-only additions only (no policy wording). Validated via `git apply --check` (passed); not applied.
- `decision-summary.md` — owner-readable table of what's in the default patch (no decision needed) vs. the 2 real policy decisions (backend-scope wording, git-workflow tension) plus 1 open factual question (were the two removed routes ever planned?), and a hunk→finding-ID map.
- `cc-report.md` — this file.
- `docs/ai/tasks/ticket-463/scratch/{CLAUDE,AGENTS}.md.{orig,proposed}` — the four named scratch copies used to build the patch (listed here per J2's requirement).

## Evidence-grade upgrades over Jonesy's Round-1 review

Several of J7's items were graded SAMPLE by Jonesy (staged subset) or carried an "unchecked" caveat. Re-run this session against the full `src`/`api` tree (not a staged subset), these are now **VERIFIED SOURCE**: the `selectBestCandidate`/`InstantComparison` consumer trace (full `src` grep, not the staged subset Jonesy had access to), and the zero-hit Matrix-B searches (re-run fresh, same result). No *named J7 item* was downgraded or refuted. **This is narrower than it may read, and is marked so here rather than left to imply more (N3, Phase B correction)**: `api/admin.js`'s real behavior (the admin-gated default summary branch, and the two genuinely public published-blog reads) was missed by this same session's own re-run and by Jonesy's own Round 1 pre-finding alike — neither named it as a J7 item to check, so this sentence's "all matched" is true only for the items that were actually named, not a claim that the whole audit caught everything on the first pass. See the Phase A v2 correction section below (R1) for the real finding and fix.

## Limitations

- No live platform/account facts are claimed or changed: `gh auth login` validity (A-14), live Vercel Git-integration deploy behavior (A-15), whether `vercel dev`/`Codex`/`claude --model haiku` commands are actually installed/valid (A-13) are all explicitly UNKNOWN per the contract's instruction not to guess platform facts.
- The `.env.example` gaps noted in A-07 (missing `CRON_SECRET`/`BLOB_READ_WRITE_TOKEN`) are a different file from this audit's scope (CLAUDE.md/AGENTS.md only) — recorded as a related observation, not proposed for a patch here.
- `scripts/` and non-`api/` platform integrations were not checked for `DATABASE_URL*` usage (A-07's evidence is scoped to `api/`, per J6's "a search covering only part of the tree is a SAMPLE" rule) — stated as a SAMPLE, not claimed as a full-repo guarantee that no other code path still needs the old var names.
- Whether the two removed route-table rows (`/api/users`, `/api/db-health`) were ever planned (vs. simply stale) is an open question for the owner (`decision-summary.md`, open question), not assumed either way.
- No full test/lint/build run — not required for a docs-only audit per the contract's own acceptance criteria, and none was needed since no application file was touched (confirmed by the unchanged HEAD/hashes above).

## Phase lifecycle statement (J15, verbatim requirement)

Phase A complete. CC's `CURRENT.md` edits in this round are limited to the canonical `CC_IN_PROGRESS` → `CC_COMPLETE` transition and populating the CC report path — no new stage was introduced, and the canonical workflow (`docs/ai/README.md`) was not changed. Audit completion is **not** whole-ticket completion: #463 remains active pending the owner's review of this proposal and the two policy decisions in `decision-summary.md`. Phase B (applying any resulting changes) requires its own normal Jonesy prompt-review cycle and a new ~~`approved-prompt-v2` (or later)~~ **(what actually happened, v4 R2 annotation, dated 2026-10-24)**: `approved-prompt-v2` was instead used for a narrow Phase A correction round, and Phase B itself was authorized as `approved-prompt-v3` — before any execution — it is not pre-authorized by this report.

---

## v2 Correction — 2026-10-24

Executed `docs/ai/tasks/ticket-463/approved-prompt-v2.md` (R1-R5, narrow Phase A correction only — not Phase B). **No instruction/app/config/test file modified even temporarily. No subagents. No commit/push/deploy/GitHub mutation.**

### Baseline (re-checked)

- `git rev-parse HEAD` before this round: `62b8d858112bc05c55dad2853a3a85aa8cba7e0e`. After all edits below: **unchanged**, `62b8d858112bc05c55dad2853a3a85aa8cba7e0e`.
- `git status --short` before and after: identical — `M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-437/github-followups/` (untouched, confirmed present unchanged in both snapshots), `?? docs/ai/tasks/ticket-463/`.
- `git diff --check`: clean, before and after.
- `sha256sum CLAUDE.md AGENTS.md`: `ab2b850d1274f5bc52aa521b1017e68e99e1d1b1203e704a54c84edec2d3275a` / `9475e83936e919f2fc08d0e506b83a423812eea8847b216348a2fdd4efff547c` — **unchanged**, identical to the v1 baseline and to the end of this correction round.

### R1 disposition — `api/admin.js` full dispatch, including the default branch

```
Read api/admin.js (lines 470-505: handleSummary + its requireAdmin call)
Read api/admin.js (lines 1170-1270: handleGetPublishedBlogPosts, handleGetPublishedBlogPostBySlug and its conditional requireAdmin on &preview=draft)
Read api/admin.js (lines 1390-1449: the full GET/POST dispatch including the default-GET fallthrough to handleSummary at line 1414, and the POST "Unknown action"/405 branches)
grep -n "requireAdmin" api/admin.js   → ~~10 call sites~~ **corrected, v4 R2 (dated 2026-10-24)**: 11 matching lines total — 1 function definition (line 88), 1 comment mention (line 634, not a call), and 9 actual call sites (lines 478, 505, 559, 642, 701, 858, 929, 1239, 1350), confirming which of the 9 named actions + the default summary + the draft-preview branch are admin-gated (all except the two unconditional published-read paths)
```
Corrected `audit.md` A-05 (kept) and A-06 (rewritten with the full picture, old wrong text struck through, not deleted); regenerated the `/api/admin` table rows (now 4 rows reflecting the real auth split) in both scratch `.proposed` files and the regenerated patch.

### R2 disposition — Matrix B pointer-only mischaracterization

```
grep -n "isRendered|onCloseRef" src/components/WeatherVoiceShareDialog.jsx   → zero matches
grep -c "isRendered|onCloseRef" src/components/WeatherVoiceShareDialog.jsx   → 0
Read src/components/RoutePlannerDetailsModal.jsx (lines 18-24: the comment citing WeatherVoiceShareDialog as the prior, narrower focus-trap precedent)
grep -n "isRendered|onCloseRef" src/components/RoutePlannerDetailsModal.jsx  → lines 72, 84, 86, 90, 97, 119, 182 (confirmed present, matching Jonesy's citation)
```
Removed the #432/#436/#440 hunks from both scratch `.proposed` files entirely (rebuilt both from a fresh copy of the real, unchanged `CLAUDE.md`/`AGENTS.md` rather than patching over v1's scratch files, so there was no risk of a stray leftover). Moved all three to `decision-summary.md` as a new Decision 5, with the `WeatherVoiceShareDialog.jsx` citation removed (only `RoutePlannerDetailsModal.jsx` is cited as the #440 worked example now) and the placement note corrected away from "Authentication." `preservation-matrix.md` Matrix B rewritten to reflect that only #452/#453 is genuinely pointer-only. Only the #452/#453 pointer remains in the default `proposed-changes.patch`.

### R3 disposition — cron Method cells

```
grep -n "req.method|method:|CRON_SECRET|Authorization" api/cron/generate-blog-draft.js api/cron/refresh-aurora.js
```
Confirmed neither handler checks `req.method`; the only `method: "POST"` in `generate-blog-draft.js` (line 47) is inside an outbound `fetch(...)` call to the OpenAI API (confirmed by the adjacent `Authorization: Bearer ${process.env.OPENAI_API_KEY}` at line 50), not an inbound method gate. Both route-table rows (both files) now show `—` for Method with an inline note that the handler doesn't check it and the platform's real method is unverified; Auth stays `Bearer CRON_SECRET`. New finding A-19 added to `audit.md`.

### R4 disposition — ledger completeness and `src/data` campsite copies

```
ls -la src/data/
cat src/data/README
ls -la server_data/campsites.full.json src/data/campsites.full.json
grep -rln "data/campsites.json\|from .*/data/campsites|from .*\./data" src api scripts --include="*.js" --include="*.jsx" --include="*.mjs"
grep -n "server_data|src/data" scripts/generateCampsitesFromOSM.mjs scripts/migrateLimitedToOsm.mjs
grep -n "campsites:full" package.json
grep -n "campsites\.(full|limited)\.json|data/campsites" src/config/auroraCandidates.js api/campsites.js api/_lib/auroraDecision/resolveLocations.js
grep -rln "src/data/campsites|from .*data/campsites" tests google-apps-script docs
```
Confirmed `src/data/campsites.{full,limited}.json` are byte-size-identical to the real, actually-imported `server_data/` copies; the `src/data/README`'s own refresh instruction (`npm run campsites:full`) now writes to `server_data/`, not `src/data/` — a stale instruction. Zero real imports of the `src/data/` copies found across the full J3-allowed directory set (`api`, `scripts`, `src`, `tests`, `google-apps-script`, `docs`) except historical task-history mentions. New finding A-18 added (informational, no patch hunk — out of this audit's literal CLAUDE.md/AGENTS.md scope). New finding A-17 added (Architecture/Tech Stack regraded from "verified-current" to "incomplete, illustrative tree" — both ledger tables updated, no patch hunk). `topSitesCount` Free:3/Pro:5 clarification added to the "Weather Scoring" hunk (both files) per R4's "state Free3/Pro5 where verified, separate full score computation from display limits."

### R5 disposition — env-name rationale, line counts, formatting

- **(a)** Both files' Environment Variables heading now states "Representative, not exhaustive — see `.env.example` for the full current list," making the omission of `PADDLE_PRICE_ID_30_DAY_PASS`/`_YEAR_PASS`/`VITE_RESEARCH_QUIZ_*` deliberate rather than silent.
- **(b)** The `POSTGRES_URL` hunk's comment (both files) now explicitly distinguishes code-consumption fact (no handler reads `DATABASE_URL`/`DATABASE_URL_UNPOOLED`) from platform configuration (the Neon/Vercel integration may still provision them) — not an instruction to delete any platform-side setting.
- **(c)** `wc -l CLAUDE.md AGENTS.md` → 523/342 (counts newline characters). This audit's own citations use 524/343 throughout (the Read-tool's 1-indexed line-listing convention, which is what every file:line anchor in `audit.md` is pinned against). Both describe the same bytes — noted explicitly in `audit.md`'s ledger headers now, not left as an unexplained discrepancy.
- **(d)** Table separator-row width: resolved as a side effect of rebuilding both scratch files from scratch this round (every table was regenerated cleanly); no separate formatting-only hunk was needed.
- **(e)** A-01's hunk text now states explicitly that "full campsite list" is covered under "Campsite Tiers" rather than silently dropped.

### Patch regeneration (full rebuild, not a patch-on-a-patch)

Both scratch `.proposed` files were reset from fresh copies of the current, unchanged `CLAUDE.md`/`AGENTS.md` (confirmed via `cmp` against `scratch/*.orig`, which were themselves re-confirmed byte-identical to the real files) and every v1 hunk was reapplied with the R1-R5 corrections baked in from the start, rather than patching v1's scratch files — this avoids any risk of a stray leftover from the superseded #432/#436/#440 text.

```
cp CLAUDE.md docs/ai/tasks/ticket-463/scratch/CLAUDE.md.proposed
cp AGENTS.md docs/ai/tasks/ticket-463/scratch/AGENTS.md.proposed
cmp docs/ai/tasks/ticket-463/scratch/CLAUDE.md.orig CLAUDE.md
cmp docs/ai/tasks/ticket-463/scratch/AGENTS.md.orig AGENTS.md
<Edit tool calls against the two *.proposed scratch files only, re-applying all corrected hunks>
diff -u --label a/CLAUDE.md --label b/CLAUDE.md CLAUDE.md docs/ai/tasks/ticket-463/scratch/CLAUDE.md.proposed > <part>
diff -u --label a/AGENTS.md --label b/AGENTS.md AGENTS.md docs/ai/tasks/ticket-463/scratch/AGENTS.md.proposed > <part>
cat <parts> > docs/ai/tasks/ticket-463/proposed-changes.patch
git apply --check docs/ai/tasks/ticket-463/proposed-changes.patch   → passed
git diff --check   → clean
rm <temporary .diff.part files>
```

No `git add`, `git commit`, `git checkout`, `git reset`, `git stash`, `git config`, `--index`/`--3way`/`--reject` apply mode, `npm`, `node <script>`, `vercel`, Playwright, browser, `gh`, or account/credential command was run this round.

### Deliverables updated this round

`audit.md` (v2 correction notes; A-06 rewritten with superseded text struck through; A-05 unaffected; new findings A-17/A-18/A-19; ledger regrades for Architecture/Tech Stack; line-count reconciliation; A-01/A-07 rationale additions), `preservation-matrix.md` (Matrix B rewritten — only #452/#453 pointer-only, #432/#436/#440 moved out with corrections), `decision-summary.md` (new Decision 5; corrected default-patch table; corrected hunk→finding map), `proposed-changes.patch` (fully regenerated), `cc-report.md` (this section). The four scratch `.orig`/`.proposed` files are the same four named files as v1 (overwritten in place for `.proposed`; `.orig` untouched since the real files didn't change).

### What was NOT examined this round (in addition to v1's list, still standing)

- Whether any file outside the J3-allowed directory set (`api`, `scripts`, `src`, `tests`, `google-apps-script`, `docs`) imports `src/data/campsites.*.json` — A-18 is graded SAMPLE, not a full-disk guarantee.
- Vercel Cron's actual inbound HTTP method for the two cron routes — still UNKNOWN (A-19), platform fact.
- Whether the Neon/Vercel integration still provisions `DATABASE_URL`/`DATABASE_URL_UNPOOLED` at the platform level — still UNKNOWN, explicitly not asserted either way in the corrected A-07 hunk.

**Status: Phase A only; no instruction file modified. Audit completion is not whole-ticket completion.**

---

## Phase B — 2026-10-24 (APPLIED)

Executed `docs/ai/tasks/ticket-463/approved-prompt-v3.md` (B0-B7, JB1-JB9 resolved). **This round DID modify the real `CLAUDE.md`/`AGENTS.md`** — Phase B is the owner-approved application phase, not a proposal round. No commit/push/deploy/GitHub mutation. No subagents.

### B0 — baseline re-check before any edit

```
git rev-parse HEAD            → 62b8d858112bc05c55dad2853a3a85aa8cba7e0e
git branch --show-current     → main
git status --short            → M docs/ai/CURRENT.md; ?? docs/ai/tasks/ticket-437/github-followups/; ?? docs/ai/tasks/ticket-463/
git diff --check              → clean
sha256sum CLAUDE.md AGENTS.md docs/ai/README.md docs/open-meteo-auth.md package.json vite.config.js vercel.json
```
All seven hashes matched the Phase A baseline exactly (`CLAUDE.md` `ab2b850d…`, `AGENTS.md` `9475e839…`, `docs/ai/README.md` `8656f56b…` — no drift since Phase A). Confirmed before editing anything.

### B1 — finished Phase A N1-N4 (before applying)

- **N1 (A-18 restated)**: re-verified directly this session with `node -e` reads of all four campsite JSON files: `server_data/campsites.full.json` and `src/data/campsites.full.json` are 242-entry, byte-identical. `server_data/campsites.limited.json` (57 entries, legacy slug ids e.g. `laugardalur_reykjavik`) has **zero id overlap** with `server_data/campsites.full.json` (242 entries, OSM ids) — confirmed by direct set-intersection check, 0 of 57. `src/data/campsites.limited.json` (58 entries, OSM ids) IS a proper subset of its own full file. `api/campsites.js:21-23` (read directly) serves exactly the mismatched `server_data` pair live, Free vs Pro. Restated in `audit.md` A-18 with the old "likely orphan, safe to delete" framing struck through, not deleted; no deletion/migration action taken; behavioral impact explicitly UNKNOWN; a separate investigation is recommended, not performed.
- **N2**: added finding IDs A-20 (Weather Scoring/`topSitesCount` Free3/Pro5 hunk) and A-21 (Gotchas `campsites.full.json` tier-gating hunk) to `audit.md`, both reframed as VERIFIED SOURCE observed facts (`features.js`'s literal `topSitesCount` value; `api/campsites.js`'s actual `isPro` branch), not inferred rationale. `decision-summary.md`'s hunk→finding map updated to cite A-20/A-21 instead of a placeholder.
- **N3**: `cc-report.md`'s "Evidence-grade upgrades" section's "No item was downgraded; none was refuted" line narrowed with an inline correction — it is true only for J7-named items; the `api/admin.js` default-branch gap (R1) was missed by both this session and Jonesy's own Round 1 pre-finding alike, cross-referenced to the R1 section rather than left to imply a cleaner first pass than actually happened.
- **N4**: cross-reference cosmetics fixed (hunk map entries, A-18/A-20/A-21 IDs threaded through `preservation-matrix.md` and `decision-summary.md` consistently).

No broad re-audit was performed — scoped exactly to N1-N4 per B1's own instruction.

### B2-B7 — patch regeneration and application

```
cp docs/ai/tasks/ticket-463/scratch/CLAUDE.md.proposed docs/ai/tasks/ticket-463/scratch/CLAUDE.md.phaseb.proposed
cp docs/ai/tasks/ticket-463/scratch/AGENTS.md.proposed docs/ai/tasks/ticket-463/scratch/AGENTS.md.phaseb.proposed
cmp docs/ai/tasks/ticket-463/scratch/CLAUDE.md.orig CLAUDE.md   → equal (no drift)
cmp docs/ai/tasks/ticket-463/scratch/AGENTS.md.orig AGENTS.md   → equal (no drift)
<Edit tool calls against the two *.phaseb.proposed scratch files only, layering the 6 exact-wording policy hunks from approved-prompt-v3.md on top of the already-corrected v2 factual hunks>
diff -u --label a/CLAUDE.md --label b/CLAUDE.md CLAUDE.md docs/ai/tasks/ticket-463/scratch/CLAUDE.md.phaseb.proposed > <part>
diff -u --label a/AGENTS.md --label b/AGENTS.md AGENTS.md docs/ai/tasks/ticket-463/scratch/AGENTS.md.phaseb.proposed > <part>
cat <parts> > docs/ai/tasks/ticket-463/proposed-changes-phase-b.patch
git apply --check docs/ai/tasks/ticket-463/proposed-changes-phase-b.patch   → passed
```
The original Phase A `proposed-changes.patch` and its scratch `.orig`/`.proposed` files are untouched and retained alongside the new Phase B artifacts, per B2's "preserve Phase A patch/history."

**Application** — per B2's explicit instruction, applied with normal file tools (`Write`), not `git apply`:
```
Read CLAUDE.md                                    (full file, re-confirmed matches baseline)
Read AGENTS.md                                    (full file, re-confirmed matches baseline)
Read docs/ai/tasks/ticket-463/scratch/CLAUDE.md.phaseb.proposed   (full file)
Read docs/ai/tasks/ticket-463/scratch/AGENTS.md.phaseb.proposed   (full file)
Write CLAUDE.md   <- exact content of CLAUDE.md.phaseb.proposed
Write AGENTS.md   <- exact content of AGENTS.md.phaseb.proposed
```

### Post-application verification (JB5-JB9)

```
cmp CLAUDE.md docs/ai/tasks/ticket-463/scratch/CLAUDE.md.phaseb.proposed   → equal (byte-for-byte match to the reviewed proposed text)
cmp AGENTS.md docs/ai/tasks/ticket-463/scratch/AGENTS.md.phaseb.proposed   → equal
python3 -c "<counts \r bytes and trailing newline per file>"              → CLAUDE.md: 0 CR bytes, ends with \n. AGENTS.md: 0 CR bytes, ends with \n.
sha256sum CLAUDE.md AGENTS.md docs/ai/README.md
git diff -- CLAUDE.md AGENTS.md > docs/ai/tasks/ticket-463/phase-b-applied.diff
git diff --check
git status --short
```

**Results:**
- `CLAUDE.md`: `ab2b850d…` (before) → `eb119924fb9362cb6c3ce502ad506581cde7c1e531e03bd883de49399c210dd8` (after).
- `AGENTS.md`: `9475e839…` (before) → `a4c4c634faed474ff68dc0dc06283d42792498b520dc7b9b4442727fb173e0ed` (after).
- `docs/ai/README.md`: `8656f56bce6f846d44d3579cd68216b135fd7504fc41641fec2b76c618e558e2` — **unchanged**, matching the Phase A/B0 baseline exactly. Canonical workflow was not touched.
- `git diff --check` → clean, no whitespace/line-ending errors.
- `git status --short` → `M CLAUDE.md`, `M AGENTS.md`, `M docs/ai/CURRENT.md`, plus the two expected untracked task folders — no off-scope file appears.
- `git diff -- CLAUDE.md AGENTS.md` printed two Git "LF will be replaced by CRLF the next time Git touches it" **autocrlf warnings** on stderr. Recorded as-is, per the instruction not to make git-config changes to silence them: these are informational notices about Git's own (pre-existing, untouched-by-this-session) `core.autocrlf` behavior on a future commit, not an error, and the direct byte-level check above already confirms the files on disk right now are LF-only with 0 CR bytes. No `git config` command was run.
- Saved as a Phase B artifact: `docs/ai/tasks/ticket-463/phase-b-applied.diff` (381 lines), linked here.

### Applied changes — summary (full detail in `preservation-matrix.md`)

**Factual corrections (both files, carried over from the corrected Phase A patch):** `/api/login` → `/api/login-email`; API Routes table rebuilt (7 missing real handlers added, `/api/users`/`/api/db-health` removed from CLAUDE.md, `/api/admin` split into its real 4-row auth split, cron Method cells corrected to reflect no handler-side method check); Environment Variables blocks corrected (`POSTGRES_URL` replacing `DATABASE_URL`/`DATABASE_URL_UNPOOLED` with a platform-vs-code-consumption caveat, `OPEN_METEO_API_KEY` pointer added, `BLOB_READ_WRITE_TOKEN`/`CRON_SECRET`/`VITE_GA_MEASUREMENT_ID`/`ALLOWED_ORIGINS` added where missing, "representative, not exhaustive" caveat added); dev-command comment corrected (Vite only, pointer to the auth doc); test-file description completed (`.test.jsx`, non-watch CI scripts); TS/import-extension rules given "existing exception" wording (no migration authorized); AGENTS.md's InstantComparison section rewritten to name `HomeDecisionCard.jsx` and the real `comparisonUtils.js` location of `selectBestCandidate`; Pro-features one-liner replaced with a pointer to `src/config/features.js`; Weather Scoring and Gotchas sentences gained the Free3/Pro5 and tier-gating-not-file-size clarifications (A-20/A-21).

**Owner-approved policy additions (exact wording from `approved-prompt-v3.md`, both files):**
1. Backend-scope line replaced (Project Rules).
2. Adjacent-fix line replaced (Conventions).
3. New git-defaults line added to Git workflow, existing lines kept verbatim (Constraints).
4. Subagent git ops heading **retained**, its content neutralized (Constraints) — per JB2, deletion was never separately owner-approved.
5. New "Weather Voice & Own Assessment" subsection added after Route Planner, not under Authentication (#432, #436).
6. New Gotchas bullet added for modal focus/scroll-lock work, citing only `RoutePlannerDetailsModal.jsx` (#440), with the Chromium-only/jsdom caveats from the exact wording.

**Confirmed NOT changed**: the "Execution discipline" block (CLAUDE.md/AGENTS.md Constraints) is byte-identical before and after, per B's explicit "MUST remain byte-identical" instruction — verified by direct comparison of that block's text in both the baseline Read and the applied file. Canonical tone/gating/scoring rules and the comparison raw-path semantics are unchanged. No scoring, gating, payment, or test file was touched. `#460-462` are not described as shipped anywhere in the applied text; `#437`'s `windMax` ambiguity is not mentioned in the applied text at all (per contract item 5, it stays a research reference, not instruction prose).

### What was NOT examined / NOT done this round

- No live platform/account facts asserted (A-13/A-14/A-15/A-19/the `DATABASE_URL` platform-provisioning question all remain explicitly UNKNOWN in the applied text itself, not just in the research artifacts).
- No campsite-data investigation or new GitHub issue was opened for A-18 — recorded as a recommendation only, per B's explicit scope limit ("does not authorize a campsite-data investigation/new GitHub issue").
- No `docs/ai/README.md`, `.env.example`, package/lock/config/app/test/data file was touched.
- No full test/lint/build run — not applicable to an instruction-file-only edit, and not claimed as validating the new policy text (per the evidence section's explicit "no claim existing test counts validate policy").

**Status: Phase B applied. Both instruction files modified with owner-approved content, confirmed byte-exact to the reviewed proposal. Canonical workflow (`docs/ai/README.md`) unchanged. Whole-ticket completion still awaits Jonesy's Phase B result review and Ripley's final assessment — not automatic from this report.**

---

## v4 Correction — 2026-10-24

Executed `docs/ai/tasks/ticket-463/approved-prompt-v4.md` (R1 exact-wording bullet fix, R2 historical annotation-only corrections). Narrow, following Jonesy's Phase B result review (REVISE, narrow, LOW) appended to `result-review.md`.

### Baseline (re-checked)

- `git rev-parse HEAD` before this round: `62b8d858112bc05c55dad2853a3a85aa8cba7e0e`. After all edits below: **unchanged**, `62b8d858112bc05c55dad2853a3a85aa8cba7e0e`.
- `git status --short` before and after: identical in shape — `M CLAUDE.md`, `M AGENTS.md`, `M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-437/github-followups/`, `?? docs/ai/tasks/ticket-463/` (the two instruction-file modifications are the pre-existing Phase B state at the start of this round; this round layers one further bullet edit on top, not a new unrelated change).
- `sha256sum CLAUDE.md AGENTS.md docs/ai/README.md` before this round: `eb119924fb9362cb6c3ce502ad506581cde7c1e531e03bd883de49399c210dd8` / `a4c4c634faed474ff68dc0dc06283d42792498b520dc7b9b4442727fb173e0ed` / `8656f56bce6f846d44d3579cd68216b135fd7504fc41641fec2b76c618e558e2` — matched the end-of-Phase-B hashes exactly, confirming zero drift since the last round.

### R1 disposition — Gotchas bullet, exact wording

Jonesy's R1 finding: the Gotchas `campsites.full.json` bullet still asserted an inferred rationale ("the real reason is Free/Pro tier gating... not raw size") as if it were documented original intent, when v3/JB6 preferred stating the observed `api/campsites.js` serving behavior instead. Both `audit.md`'s A-21 and this report wrongly implied it had already been reframed.

Replaced, in **both** `CLAUDE.md` and `AGENTS.md`, the one Gotchas bullet:
- Before: `` `campsites.full.json` (`server_data/`) must not be imported directly in frontend code — the real reason is Free/Pro tier gating (Free must never receive the Pro-only full list), not the file's raw size (currently ~28 KB) ``
- After (verbatim from `approved-prompt-v4.md`): `` `api/campsites.js` serves `server_data/campsites.limited.json` to Free and `server_data/campsites.full.json` to Pro. Do not import `server_data/*.json` directly into the frontend bundle; use the existing `/api/campsites` flow. ``

This states an observed serving fact (re-confirmed this round: `grep -n "campsites.limited.json\|campsites.full.json" api/campsites.js` shows the `isPro ? ... full.json : ... limited.json` branch, same code path verified in Phase B) plus the retained no-direct-import constraint — not a claim about undocumented original intent. No data/API/gating behavior changed; no other text in either file was touched.

Method: built `docs/ai/tasks/ticket-463/scratch/{CLAUDE,AGENTS}.md.v4.{orig,proposed}` from fresh copies of the real (post-Phase-B) files, edited only this one bullet in each `.proposed` copy, generated `proposed-changes-v4.patch` (one hunk per file, confirmed by inspection to touch only this bullet), validated via `git apply --check` against the real files (passed), then applied via normal `Edit` calls to the real `CLAUDE.md`/`AGENTS.md` — not `git apply`. Post-application: `cmp` confirmed both real files byte-equal to their `.v4.proposed` scratch copies; a Python check confirmed 0 CR bytes and a trailing LF newline in both; new hashes: `CLAUDE.md` → `606a44bdb764bc1e56d8ade03def3db3fda89423de5cabe7f13ee5032290e32d`, `AGENTS.md` → `404afe5d1f2a58ce6875029a91817dc4e9e93a4c8504f7b854cbf6f30948b2fa`; `docs/ai/README.md` hash confirmed unchanged (`8656f56bce6f846d44d3579cd68216b135fd7504fc41641fec2b76c618e558e2`); `git diff --check` clean (two harmless `autocrlf` warnings on stderr, same as every prior round, no `git config` change made). The cumulative `git diff -- CLAUDE.md AGENTS.md` since HEAD was saved as `docs/ai/tasks/ticket-463/phase-b-v4-applied.diff`; the v4-only correction diff is `proposed-changes-v4.patch`, kept as a separate, distinctly-named artifact from Phase B's own `proposed-changes-phase-b.patch`/`phase-b-applied.diff`.

`audit.md`'s A-21 finding text was corrected to match this exact wording (struck-through superseded rationale-as-fact phrasing, not deleted) so the finding record agrees with what was actually applied.

### R2 disposition — historical annotation-only corrections

Per Jonesy's R2 finding, four stale v1/Phase-A-round statements were visibly superseded (struck through, not deleted, with a dated `v4 R2` annotation naming the correction) rather than silently rewritten as if always correct:

1. **Matrix B "all four items pointer-only"** (this report's Phase-A-v1 Deliverables bullet, and the same original framing in `preservation-matrix.md`'s header) — annotated where it appeared as a standing claim in this report; `preservation-matrix.md` itself already carries the corrected per-row classification from the v2 round and needed no further change (verified by re-reading it this round — Matrix B's intro sentence and per-row table already state only #452/#453 is pointer-only).
2. **"none refuted" (J7 re-verification line)** — annotated: true only for items actually named as J7 items; the `api/admin.js` default-branch/public-read gap (found in R1 of the v2 round) was missed by this same session's own first-pass re-run and was never a named J7 item, so it isn't a counterexample to "none refuted" so much as evidence the re-verification's scope didn't include it. Cross-referenced to the existing N3 narrowing already present in the Evidence-grade-upgrades section.
3. **Future Phase B "named `approved-prompt-v2` (or later)"** (Phase lifecycle statement) — annotated with what actually happened: `approved-prompt-v2` was used for a narrow Phase A correction instead, and Phase B was ultimately authorized as `approved-prompt-v3`.
4. **`requireAdmin` "10 call sites"** — re-counted this round: `grep -n "requireAdmin" api/admin.js` returns 11 matching lines (1 function definition at line 88, 1 comment mention at line 634 that is not a call, 9 actual call sites at lines 478, 505, 559, 642, 701, 858, 929, 1239, 1350). Annotated with the exact line numbers rather than repeating either the old "10" or a new unverified round number.

`decision-summary.md`'s A-04/A-05/A-06 row ("add 7 missing real handlers" / "see open question 1 below") was corrected the same way: the guessed "7" is replaced with an explicit per-file list of the actual new route paths added to each table (CLAUDE.md: 5 new paths + the admin 1→4 split; AGENTS.md: 3 new paths, since it already listed `blog-meta`/`cron/generate-blog-draft`, + the same admin split), and "open question 1 below" now points to Decision 3 by name with its resolved/APPLIED status, since that question was already resolved earlier in the same document and the old cross-reference had gone stale.

No audit/policy expansion beyond these four annotations plus the decision-summary row; no original transcript text was deleted or rewritten as if it had always been correct — every correction is a visible strikethrough-plus-note, per house convention.

### Scope confirmation

No app/test/config file touched. No `docs/ai/README.md` edit. No subagent used. No `git add`/`commit`/`push`/`checkout`/`reset`/`stash`/`clean`/`config` run; no `--index`/`--3way`/`--reject` apply mode; no npm/node-script/vercel/browser/`gh` command run. No `.env*`/account/GitHub mutation. Only: two single-bullet instruction-file edits (one each in `CLAUDE.md`/`AGENTS.md`), the four cc-report annotations above, the one decision-summary row annotation, the one audit.md A-21 wording correction, the new `proposed-changes-v4.patch`/`phase-b-v4-applied.diff` artifacts, the `scratch/{CLAUDE,AGENTS}.md.v4.{orig,proposed}` scratch copies, and the required `CURRENT.md` lifecycle transition.

**Status: v4 correction applied. Both instruction files now carry the observed-serving-fact Gotchas wording; four historical annotations and one decision-summary row corrected per Jonesy's R2. Owner next requests a quick Jonesy re-check, then Ripley's whole-ticket final assessment. Not automatically CLOSED by this report.**

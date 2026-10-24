# #463 — Jonesy result review, Phase A (audit + unapplied proposal)

## Jonesy Phase A result review — 2026-10-23

**Verdict: REVISE (narrow, documentation-only, Phase A artifacts only).** The audit itself is thorough and mostly accurate; the ledgers are complete, the pre-findings were genuinely re-run, and the instruction files were not touched. But the *default* patch (advertised as "no owner decision needed") contains one new factual error and several hunks that are not pointer-only, which contradicts J4/J14 and the acceptance rule that every material change traces to evidence. Both are small to fix. No code, config or instruction-file change is involved.

If Ripley prefers to carry R1–R5 into the Phase B prompt instead of a correction round, that is workable only if the corrected patch is regenerated and re-checked before anything is applied; I recommend the correction round because Róbert is about to read `decision-summary.md` and could approve the current patch as-is.

### What I verified (my own sandbox, not the owner's machine; staged snapshots)

- **Instruction files unchanged.** Device mtimes of `CLAUDE.md` (1789501418335) and `AGENTS.md` (1787770589919) are identical to my Round 1 staging, and sha256 prefixes are still `ab2b850d1274f5bc` / `9475e83936e919f2` (VERIFIED SOURCE). `scratch/*.orig` are byte-identical to both (`cmp`). I cannot run `git status` or `git rev-parse` on the owner's machine; HEAD `62b8d85…` and the before/after status are CC-attributed.
- **Patch.** `git apply --check --whitespace=error` passes on copies of the baseline files in a throw-away directory; applying it there reproduces `scratch/CLAUDE.md.proposed` and `scratch/AGENTS.md.proposed` byte-for-byte; the patch has no CR characters (files are LF). So the patch is internally consistent with its scratch sources. This proves applicability only, not correctness.
- **Findings spot-checked against source:** A-02 (no `api/login.js`; `useLoginFlow.js:46`), A-03 (`comparisonUtils.js:101`; AGENTS has 0 `HomeDecisionCard`, CLAUDE 6), A-07 (all 11 handlers read `POSTGRES_URL`; `.env.example` has no `CRON_SECRET`/`BLOB_READ_WRITE_TOKEN` — confirmed from names), A-08 (`package.json:7`; `vite.config.js` proxy block lines 77–87 with its own comment "Proxy all other /api/* to Vercel dev"; `playwright.config.js` webServer), A-09, A-11 (`WeatherIcon.tsx`, 13 icon `.tsx` + `index.ts`), A-12, A-01b (32 tests). These hold.
- **Scope/safety claims in `cc-report.md`** (no npm/node/vercel/browser, no `.env*` reads, no `gh auth`): consistent with the artifacts and commands listed; not independently provable by me (CC-attributed).

### Findings requiring correction

**R1 — MEDIUM. `/api/admin` is misdescribed, and the patch writes the error into both files.**
Audit A-05/A-06 state that `api/admin.js` dispatches only the nine blog actions and that "there is no non-blog admin action today". `api/admin.js:1399–1415`: a GET with no recognised `action` falls through to `handleSummary` (`:476–497`), which is admin-gated and returns `users`/`pro`/`revenue` summaries (`getUsersSummary`, `getProSummary`, `getRevenueSummary`). Also, `getPublishedBlogPosts` and `getPublishedBlogPostBySlug` are **public** reads (`handleGetPublishedBlogPosts` at `:1179` has no `requireAdmin`; the by-slug handler only requires admin for `?preview=draft`, `:1239`). So the proposed Purpose cell "Blog admin operations (list/generate/create/update/publish/delete)" with Auth "admin email" drops the real summary function and mislabels the public reads.
*Ownership of the error:* my Round 1 pre-finding said "`admin.js` dispatches only blog actions". That was incomplete (I read the `action` branches, not the default branch), and CC's re-run repeated the same `action ===` grep and reported "all matched, none refuted". The instruction was to confirm independently; the default branch needed reading.
*Fix:* correct A-05/A-06 and the hunk, e.g. Purpose "Admin summary (GET, admin email); blog admin actions (admin email); published-blog reads (GET `?action=getPublishedBlogPosts|getPublishedBlogPostBySlug`, public)". Auth cell must say it varies by action, or the row should be split. Keep the removal of `/api/users` and `/api/db-health` (still correct: no handler files, no dispatch).

**R2 — MEDIUM. Matrix B hunks are not pointer-only, are mis-described, and are misplaced.**
J4/J14 allow only *pointer-only* additions (link to a canonical doc, no new prose) in the default patch; new instruction text is an owner decision. `decision-summary.md` calls the Matrix B hunks "One-line pointers … No decision". They are not:

- **#432 / #436 line** (both files, inserted under `### Authentication`): a new normative sentence ("safety-tier copy … never a punchline. Own weather assessment must never read as an official warning"). Content is accurate (matches the header of `src/i18n/weatherVoice/safety.js` and the copy in `HazardSourceNote.jsx`), but it is new rule prose derived from task histories, there is no canonical doc to link, and the voice-level policy itself is not stated. `preservation-matrix.md` proposed placing it "near Route Planner/Internationalization", not under Authentication; Weather Voice under an auth heading will mislead readers. The closing "and the canonical-tone rule above" is a spurious cross-reference (that rule is about stay/move/consider, not official warnings).
- **#440 Gotchas bullet** (both files): it states three implementation patterns as guidance and cites `WeatherVoiceShareDialog.jsx` as a worked example of them. Source: `RoutePlannerDetailsModal.jsx` has `isRendered` gating (`:72`) and `onCloseRef` (`:84`); `WeatherVoiceShareDialog.jsx` has neither (mount-only trap, `previouslyFocusedRef`, no `onCloseRef`) — it is the *earlier precedent* the modal's own comment refers to (`RoutePlannerDetailsModal.jsx:21`), not an example of those patterns. Also, the "native in-panel stop vs outside focus" lesson is specific to #440's Tab handler (result-review K1/K2). This is new guidance, not a pointer.
- Only the **#452/#453 line** (env block comment pointing to `docs/open-meteo-auth.md`) is a true pointer.

*Fix:* keep the #452/#453 pointer in the default patch. Move the #432/#436 and #440 texts out of the default patch into `decision-summary.md` as an explicit decision (e.g. Decision 5: "add short rules/pointers for Weather Voice, hazard-source note and modal lifecycle?") with the proposed wording, corrected as above and placed near Route Planner/Internationalization; or reduce each to a bare file pointer with no rule language. Correct the decision-summary wording either way.

**R3 — LOW-MEDIUM. Cron rows: Method column is unverified.**
The patch adds `/api/cron/refresh-aurora | POST | CRON_SECRET` and keeps POST for `generate-blog-draft`. Neither handler checks the inbound method (`refresh-aurora.js:22–24` authenticates first; in `generate-blog-draft.js` the only `method: "POST"` at `:47` is an *outbound* fetch). Both are described in-code as triggered by Vercel Cron with `Authorization: Bearer $CRON_SECRET`. The HTTP method Vercel uses is a platform fact, UNKNOWN from the repo. *Fix:* write "any (Vercel Cron)" or "—" in the Method cell, or drop the Method claim; keep Auth as `Bearer CRON_SECRET`. Auth "—" for `aurora-decision` and "admin email" for `blog-upload` are consistent with source (`aurora-decision.js` has no auth gate; `blog-upload.js:10,43`).

**R4 — LOW. Ledger over-grades "verified-current".**
"Architecture" and "Tech Stack" are marked verified-current, but the tree omits things that exist: `api/cron/`, `api/_lib/aurora*`, `google-apps-script/`, `tests/e2e`, `docs/`, `src/data`, `src/ui`, and "`_lib` Shared utilities (auth, Paddle)" omits aurora and Open-Meteo helpers. This is incompleteness (additive), not error; grade should be "incomplete, pointer/example wording" or a finding. Two related unledgered items: `src/data/campsites.{full,limited}.json` exist (28,454 B for the full file, same size as `server_data/campsites.full.json`), `src/data/README` says `npm run campsites:full` refreshes them while `scripts/generateCampsitesFromOSM.mjs:54` now writes `server_data/campsites.full.json` (`migrateLimitedToOsm.mjs` still targets `src/data`); and the Gotcha "`campsites.full.json` is large" refers to a 28 KB file whose real reason is tier gating. Whether any `src/` file imports the `src/data` copies is unchecked (I could not grep the full tree). Also "Weather Scoring … Top 5 sites" is graded verified-current although `topSitesCount` is 3 for Free (`features.js`); A-01's hunk mentions the limit only indirectly.

**R5 — LOW. Finding/proposal gaps and nits.**
(a) A-07 lists omitted names (`PADDLE_PRICE_ID_30_DAY_PASS`/`_YEAR_PASS`, `VITE_RESEARCH_QUIZ_*`, and for CLAUDE.md `VITE_GA_MEASUREMENT_ID`, `ALLOWED_ORIGINS`) but neither the proposal nor the report says whether leaving them out is deliberate; state it. (b) Removing `DATABASE_URL`/`DATABASE_URL_UNPOOLED`: `api/` and the `scripts/` folder (I checked it: only `WV_SHARE_EXPORT_BASE_URL`) do not read them; the Neon/Vercel integration may still provision them (platform, UNKNOWN) — say so in the hunk rationale rather than "no decision". (c) `cc-report.md`/`audit.md` say 524 and 343 lines; `wc -l` gives 523 and 342 (ledger line anchors match mine, so cosmetic). (d) Regenerated route tables have a separator row one dash wider than the header cell; cosmetic. (e) A-01 drops "full campsite list" from the Pro one-liner; acceptable (covered under Campsite Tiers), but note it in the rationale.

### Checked and fine

Ledgers A/B with the three bold-run paragraphs and divergence table; A-02, A-03, A-08, A-09, A-11, A-12/A-13 handling (split fact vs policy, UNKNOWN commands kept UNKNOWN); A-10 as owner decision with README-aligned default; A-14/A-15 UNKNOWN; A-01b correct and recorded as fragile-not-wrong; Matrix A dispositions; dated/historical statements preserved (J12); no mention of #437 bugs as design; no unapproved workflow stage; `CURRENT.md` shows `CC_COMPLETE` with the correct paths and "Phase A only; no instruction file modified" stated in the report; scratch copies named and listed (J2). The "Vite proxies … → Vercel dev server" sentence is retained; it matches the config's own comment, though whether anything actually listens on port 3000 remains UNKNOWN (J9) — acceptable as-is.

### Required before PASS (Phase A) — for Ripley's correction prompt

1. **R1:** fix A-05/A-06 and the `/api/admin` row in both files (summary + blog actions + public reads); re-read `api/admin.js` default branches rather than only `action ===` matches.
2. **R2:** take the #432/#436 and #440 hunks out of the default patch (decision with corrected wording and placement), keep only true pointers (#452/#453); correct the `WeatherVoiceShareDialog` claim; fix `decision-summary.md` wording and the hunk→finding map.
3. **R3:** replace the unverified Method cells for the two cron rows.
4. **R4/R5:** regrade Architecture/Tech Stack (or add a finding), add the `src/data` items as findings or explicit UNKNOWN, state the reasons for the omitted env names, correct line counts. These may be recorded without patch changes except where a hunk is affected.
5. Regenerate `proposed-changes.patch` from the scratch copies; re-run `git apply --check` (allowlist only); re-hash both instruction files and state "unchanged"; update `cc-report.md` and `decision-summary.md`; keep `CURRENT.md` edits to the canonical transitions.

Everything else stands. The recommended next step in `decision-summary.md` (Róbert decides Decisions 1–2, Phase B via a normal prompt review) remains correct after these fixes.

### Phase lifecycle note (J15)

This is a **Phase A** review only. The verdict is REVISE for the proposal artifacts, not a ticket-level verdict; no stage beyond the canonical list is introduced. When R1–R5 are fixed I expect to return "PASS (Phase A audit only)".

### Limits of this review

Staged snapshots only; I did not run tests, lint, build, git, a browser or any repository script, and did not read `.env*` files, Vercel settings or live endpoints. The patch apply-check and byte comparison ran in a throw-away directory in my sandbox, not on the owner's machine. HEAD, `git status` before/after, `git diff --check` and the real working-tree `git apply --check` are CC-attributed. Absence claims about the full `src/` tree (R4 `src/data` importers, remaining `InstantComparison` consumers) rest on CC's full-tree greps, which I did not repeat. Vercel Cron's HTTP method and the Neon integration's variable names are platform facts I did not verify.


## Ripley Phase A assessment — 2026-10-23

Verdict: REVISE, proposal artifacts only. Accept R1–R5: default-admin summary/public blog auth needs accurate table; new voice/modal normative prose is not pointer-only and belongs in owner decisions; cron methods must reflect enforced contract, not outbound POST; ledger completeness/env rationale/campsite data observations need scope. Do not present current proposal to owner as ready to apply. Real instructions remain unchanged; no Phase B authorization.

Read CURRENT, Jonesy review, decision summary and CC report; status limited to CURRENT and expected untracked task437/task463 folders. No tests/build appropriate for documentation-only artifacts; Jonesy's sandbox patch check remains Jonesy-attributed. Created approved-prompt-v2.md as bounded Phase A correction, not application phase. CURRENT -> READY_FOR_CC. No instruction/app edits, commit/push/deploy/GitHub action by Ripley.


## Jonesy Phase A re-check (v2 correction) — 2026-10-24

**Verdict: PASS (Phase A audit only), narrow.** R1, R2 and R3 are fixed and verified against source. R4/R5 are fixed except for one wrong sub-claim (N1 below) and a few traceability/cosmetic gaps (N2-N4) that do not affect the patch's correctness. This is not a ticket-level verdict: #463 stays open, nothing in `CLAUDE.md`/`AGENTS.md` is authorized to change, and Phase B still needs a normal prompt review and a new approved-prompt version (J15).

### Verified fixed

- **R1 (`/api/admin`)**: Re-read `api/admin.js` dispatch including the default branch. Patch now has four rows: default GET = admin-gated summary; `listBlogPosts` = admin; `getPublishedBlogPosts` / `getPublishedBlogPostBySlug` = public (admin-only with `&preview=draft`); the six POST actions = admin. Matches source. The audit records the earlier gap (my Round 1 pre-finding and CC's re-run) factually; the "none refuted" line is now qualified in the audit header.
- **R2 (Matrix B)**: `#432/#436/#440` prose is out of the default patch; only the `#452/#453` pointer remains. Moved to decision-summary Decision 5 with the `WeatherVoiceShareDialog` mis-citation corrected and a placement note (not under Authentication). Default patch is now pointer-only for Matrix B.
- **R3 (cron)**: Method cells now "—" with the `Bearer CRON_SECRET` note and an explicit caveat. Both `api/cron/*` handlers do not check `req.method`; the old "POST" was an outbound-fetch inference. Correct.
- **Patch integrity**: In my sandbox `git apply --check --whitespace=error` passes against the staged originals, the applied output is byte-identical to `scratch/CLAUDE.md.proposed` and `scratch/AGENTS.md.proposed`, and the patch has no CR bytes. `.orig` copies, instruction-file hashes and HEAD are CC-attributed unchanged.
- **Other spot checks, all correct against source**: `/api/login-email` replaces `/api/login`; `/api/users` and `/api/db-health` removal; `POSTGRES_URL` vs `DATABASE_URL*` wording (code-consumption vs platform provisioning, no overclaim); `npm run dev` = Vite only; `selectBestCandidate` at `src/lib/comparisonUtils.js:101`; Free 3 / Pro 5 `topSitesCount`; "existing exception" wording for `.ts/.tsx`.

### Remaining items (none block Phase A PASS; fold into the Phase B prompt/artifact touch-up)

- **N1 — A-18 is partly wrong (correct before the owner reads it).** I compared the four campsite JSON files in my sandbox. `server_data/campsites.full.json` and `src/data/campsites.full.json` are content-identical. The two **limited** files are **not**: `server_data/campsites.limited.json` has 57 entries with legacy ids (`laugardalur_reykjavik`, `grindavik`, `hafnarfjordur`, `mosfellsbaer`, `selfoss`, `thingvellir`, ...) and 56 of 57 names do not appear in `server_data/campsites.full.json`; `src/data/campsites.limited.json` has 58 entries with OSM ids, all present in full. So "byte-size-identical" and "orphaned legacy copy" are wrong for the limited file. Verified fact: `api/campsites.js` serves `server_data/campsites.limited.json` to Free and `server_data/campsites.full.json` to Pro, so the two tiers are served from different id schemes. UNKNOWN: whether that is intentional or a defect, and whether anything maps ids across tiers (favorites, scores, URLs). Required restatement: "full copies identical; limited copies differ (57 vs 58, different id schemes); server limited is not a subset of server full"; recommend a **separate, scoped ticket** to investigate Free/Pro data consistency, and **no deletion recommendation** for `src/data/`. Still no patch hunk (out of `CLAUDE.md`/`AGENTS.md` scope). Not verified: that the project README rule ("limited must be a subset of full") applies to `server_data/`.
- **N2 — Traceability.** The Weather Scoring rewrite and the `campsites.full.json` Gotchas rewrite have no finding id in the hunk→finding map. The Gotchas rationale (tier gating rather than ~28 KB size) is INFERRED, and the candidate-list nuance (list is tier-filtered; locked teaser rows 4-5 in `Top5Leaderboard.jsx`) is only partly stated. Add finding ids and grade the rationale INFERRED, or soften the wording to what source shows.
- **N3 — Stale v1 text in `cc-report.md`.** The v1 body still says "none refuted", "pointer-only" for all four Matrix B items, and "scripts not checked" without a supersession marker. Mark them superseded by the v2 section (strike, do not delete).
- **N4 — Cosmetic.** Stale cross-references ("7 handlers", "open question 1"), "10 call sites" counts the definition, and "this session" wording in Matrix B. Fix when regenerating the patch/artifacts.

### Next

1. Ripley: final Phase A assessment. Suggested handling of N1-N4: either one tiny docs-only fix inside the Phase B prompt's step 0, or a short correction round. My view: N1 must be corrected before the owner reads A-18; N2-N4 are cheap and non-blocking.
2. Róbert decides Decisions 1, 2, 5 (and the Decision 3 question: are the removed routes meant to exist?).
3. Ripley appends the Phase B prompt to `prompt-review.md` for a normal Jonesy review; only then a new approved-prompt version. No Phase B execution file before review. I would also ask that the N1 Free/Pro id-scheme question get its own ticket rather than ride along in #463.

### Limits of this review

Staged snapshots only; I did not run tests, lint, build, git, a browser or any repository script, and did not read `.env*` files, Vercel settings or live endpoints. The patch apply-check, byte comparison and the campsite JSON comparison ran in a throw-away directory in my sandbox, not on the owner's machine. HEAD, `git status`, instruction-file hashes, `git diff --check` and the real working-tree `git apply --check` are CC-attributed. Absence claims over the full `src/` tree rest on CC's greps, which I did not repeat. Vercel Cron's inbound HTTP method, Neon integration variable names, `vercel dev` behavior, and whether the Free/Pro campsite id-scheme difference is intended are UNKNOWN to me.


## Ripley final Phase A assessment — 2026-10-24

Phase A verdict: PASS (audit/proposal only). Overall ticket remains REVISE/incomplete pending owner decisions, normal Phase B prompt review, application and final verification. CURRENT remains RESULT_REVIEW while owner considers concrete decisions; no invented stage or premature CLOSED.

Independent checks: git apply --check docs/ai/tasks/ticket-463/proposed-changes.patch passed without application; actual instruction hashes match recorded baseline (CLAUDE ab2b850d1274f5bc..., AGENTS9475e83936e919f2...). git status only expected CURRENT/task directories, no instruction/app modifications. Read current decision-summary and Jonesy re-check. No tests/build needed for documentation proposal.

N1 restatement: independently parsed JSON counts full242 in both, limited58 src/data versus57 server_data. Jonesy compared content/id schemes: full copies identical, limited sets differ, server limited not a subset of server full. Treat those identity findings as Jonesy-verified unless independently rechecked; no inference that all src/data is redundant, no deletion/migration authorization. Put a visible correction at audit.md start before owner reads A18. Separate follow-up recommendation only; no new issue created without owner instruction.

N2–N4 are non-blocking Phase A touch-ups REQUIRED in the Phase B proposal before application: assign finding IDs for scoring/gotchas, inferred rationale explicit, qualify candidate-list/display nuance, mark stale v1 claims superseded and fix counts/crossrefs. No need for another audit-only CC round. Default patch facts/pointers accepted subject to these touch-ups; policy decisions1/2/5 still pending. Missing users/db-health routes may be removed from current-route documentation regardless of potential future plans; future work is not an implemented endpoint.

No Phase B approved file created or instruction changes applied. No commit/push/deploy/GitHub action. Next owner sees concrete recommendations, then Ripley drafts Phase B for normal Jonesy review.


---

## Jonesy Phase B result review — 2026-10-24

**Verdict: REVISE (narrow, LOW severity).** The application itself is correct and safe: the real files equal the reviewed text, the binding wording is exact, nothing outside scope changed. Two small items remain, one of them in the instruction text itself: a rationale that the approved prompt told CC to soften (R1), and N3/N4 report hygiene that the report says is done but is not (R2). Both are fixable with a few annotation-level edits. Ripley may instead accept R1 as a known limitation by owner decision; I am not aware of any behavioral or safety consequence of leaving it.

### Verification basis (staged snapshots; nothing run on the owner's machine)

Read `approved-prompt-v3.md`, `cc-report.md` (Phase B section), `phase-b-applied.diff`, `proposed-changes-phase-b.patch`, both `*.phaseb.proposed` and `*.orig` scratch files, the real `CLAUDE.md` / `AGENTS.md`, `audit.md` (A-18, A-20, A-21), `preservation-matrix.md`, `decision-summary.md`, `docs/ai/README.md`, and the live source behind the changed claims (`api/campsites.js`, `api/admin.js`, `useLeaderboardScores.js`, `vite.config.js`, `RoutePlannerDetailsModal.jsx`, weather voice files, `campsites.*.json`).

In my sandbox (throw-away git repo, not the owner's machine):
- Real `CLAUDE.md` and `AGENTS.md` are **byte-equal** to `scratch/*.phaseb.proposed`; both have 0 CR bytes (LF only); sizes 30,150 and 18,666 B.
- `proposed-changes-phase-b.patch` passes `git apply --check --whitespace=error` against the `.orig` baselines (hashes `ab2b850d...` / `9475e839...` match the Phase A baseline) and the applied result equals the real files.
- My regenerated `git diff -- CLAUDE.md AGENTS.md` equals `phase-b-applied.diff` apart from `index` lines.
- `docs/ai/README.md` is still `8656f56bce6f846d...` (unchanged).
- All seven binding quotes from the v3 "Binding exact wording" section (backend, adjacent-fix, git addition, Subagent neutralization, Weather Voice, own assessment, modal) occur verbatim in **both** files.
- The "Execution discipline" block is byte-identical to the baseline in both files; the retained git lines ("Use descriptive commit messages...", "Never run git push...", "Show changes as diffs only...", "Cross-reference related issue numbers...") are present verbatim.
- The Weather Voice subsection sits after "Route Planner", not under "Authentication". The `Subagent git ops` heading is retained with only its body replaced (JB2 neutralization, as the prompt directed). `/api/users` and `/api/db-health` no longer appear in either file.
- A-18 data re-checked independently: both `full` files identical (242), `server_data` limited 57 entries with **0 of 57** ids in `server_data` full, `src/data` limited 58 entries, a subset of full. `api/campsites.js` serves limited to Free and full to Pro. The restated A-18 is accurate and carries no deletion advice.
- Report claims on `git diff --check` clean, the autocrlf warnings recorded as-is, and `git status` scope are CC-attributed; I did not rerun git.

### Required before PASS

**R1 (LOW) - `campsites.full.json` Gotchas bullet still states an inferred rationale as fact, and the report says otherwise.** The applied text (both files) reads "...must not be imported directly in frontend code - **the real reason is** Free/Pro tier gating (Free must never receive the Pro-only full list), **not the file's raw size** (currently ~28 KB)". `approved-prompt-v3.md` (B1 and the JB6 paragraph) told CC to prefer the observed serving fact over an inferred rationale. The observed fact is in `api/campsites.js:21-23`: full is served only to Pro, limited to Free. "The real reason" is an inference about why the original author wrote the rule. `audit.md` A-21 says the hunk is "already stated as an observed serving-contract fact, not an inferred file-size rationale", and `cc-report.md` N2 says both hunks were "reframed as VERIFIED SOURCE observed facts"; neither matches the applied text. Fix (both files plus A-21): state the observed fact only, for example "`campsites.full.json` (`server_data/`) must not be imported directly in frontend code; `api/campsites.js` serves it only to Pro (Free receives `campsites.limited.json`), so bundling it would bypass that gating." Drop "the real reason is" and the "not the file's raw size (~28 KB)" clause, or grade them INFERRED in A-21 and keep them out of the instruction text. This is new wording, so it needs Ripley's sign-off before CC applies it.

**R2 (LOW) - N3/N4 only partly done, and the report says "fixed".** Still stale in `cc-report.md` without a supersession note: (a) Deliverables lines 124-125 ("4 approved decisions... each classified pointer-only", "pointer-only additions only... not applied", "the 2 real policy decisions"); (b) the J7 header line 59 ("all results matched... none refuted"); (c) the Phase A lifecycle statement ("requires... a new `approved-prompt-v2`", but v3 was the Phase B prompt); (d) line 165 "10 call sites" for `requireAdmin` in `api/admin.js` - the file has 11 matching lines of which one is the definition and one a comment, so 9 call sites. `decision-summary.md` row A-04/A-05/A-06 still says "add 7 missing real handlers" and "see open question 1". Annotation-only (strike or dated note, no deletion) is enough; B-report required preserving history. No effect on the instruction files.

### Notes (no action required)

- **Command scope:** CC used inline `node -e` to read the four campsite JSON files and `python3 -c` for the CR count. The prompt bans `node` repo scripts and services; an inline JSON read touches no repo script or service, so I do not treat it as a violation, but it is not on the explicit allowlist. My independent Python read reproduces CC's numbers.
- **Remaining sentence:** `CLAUDE.md:435` / `AGENTS.md:308` still say "Vite proxies ... `/api/*` -> Vercel dev server during development". This matches the comment in `vite.config.js` (target `localhost:3000`, comment "Vercel dev") and was not a Phase A finding. Whether `vercel dev` is what listens on 3000 is UNKNOWN to me; the corrected `npm run dev` comment now points to `docs/open-meteo-auth.md`. Optional for Ripley to mention to the owner.
- **A-20 nuance:** The Weather Scoring sentence is accurate (`useLeaderboardScores(siteList, ...)` scores whatever list it is given; the 3/5 split is a display limit via `topSitesCount`), but A-20 does not also explain that the input list is itself tier-filtered (Free receives the limited campsite list) or mention the locked teaser rows in `Top5Leaderboard.jsx`. The instruction text does not claim otherwise, so I treat it as documentation-only.
- **autocrlf:** CC recorded Git "LF will be replaced by CRLF" warnings on `git diff`. That suggests `core.autocrlf` is enabled on the owner's machine (INFERRED, not checked by me). The files on disk are LF; no action taken or needed in this ticket.

### Checked and fine

Scope (only `CLAUDE.md`, `AGENTS.md`, ticket-463 artifacts and CURRENT; no app/test/config/data/`.env.example`/README edits); no commit, push, deploy or GitHub action; CC's CURRENT edits limited to the canonical `CC_IN_PROGRESS`/`CC_COMPLETE` transitions and report path; Phase A patch and scratch files preserved; Matrix A/B rows for backend line, adjacent-fix line, Subagent neutralization, route removals and Decision 5 additions are present and APPLIED, with owner Decision ids and the "not deleted - owner did not name deletion" note; exception wording for `.tsx`/`.ts` and import extensions does not authorize new files; #460-462 not described as shipped; A-18 contains no deletion/migration advice and no GitHub issue was opened.

### Limits of this review

Staged snapshots only; I did not run tests, lint, build, git, a browser or any repository script, and did not read `.env*` files, Vercel settings or live endpoints. The patch apply-check, byte comparison, diff regeneration and campsite JSON checks ran in my sandbox. HEAD, `git status`, `git diff --check` and the autocrlf warnings are CC-attributed. No application behavior was changed by this ticket and none is asserted. Vercel Cron's inbound method, Neon variable names, `vercel dev` behavior and the intent behind the Free/Pro campsite id-scheme difference remain UNKNOWN.

### Next

Ripley: final whole-ticket assessment. Options: (1) accept R1/R2 as-is by decision and close, or (2) approve a narrow correction round (a short `approved-prompt-v4`) covering the R1 wording in both files, A-21 and the R2 annotations, then a quick re-check from me. #463 stays open until Ripley sets the final state; the A-18 campsite id-scheme question remains a recommendation only, with no issue created.


## Ripley Phase B assessment — 2026-10-24

Verdict: REVISE, narrow R1/R2. Main application and exact owner policy accepted from Jonesy's byte/diff review. Do not accept an inferred original file-size/gating rationale as a factual instruction; v4 pins an observed api/campsites serving statement instead, preserving no-direct-import constraint. Historical report hygiene can be annotation-only. No new owner decision or policy needed.

Read CURRENT, Jonesy's full review and PhaseB report; independently ran git diff --stat and git diff --check (clean, only informational LF/CRLF notices). No application tests appropriate for instruction-only changes. Created approved-prompt-v4.md with single-bullet edits plus annotations. CURRENT -> READY_FOR_CC. No instruction/app edits by Ripley; no commit/push/deploy/GitHub action.


---

## Jonesy Phase B re-check (v4 correction) — 2026-10-24

**Verdict: PASS (Phase B instruction edits and R1/R2 corrections).** R1 and R2 are fixed. One trivial arithmetic slip remains in an annotation (below); it is documentation-only and does not block. This is not a whole-ticket verdict: #463 stays open until Ripley's final assessment, and there is no automatic CLOSED.

### Verification basis (staged snapshots; nothing run on the owner's machine)

Read `approved-prompt-v4.md`, the v4 section of `cc-report.md`, `proposed-changes-v4.patch`, `phase-b-v4-applied.diff`, `scratch/*.v4.{orig,proposed}`, the real `CLAUDE.md` / `AGENTS.md`, `audit.md` (A-21), `decision-summary.md` (A-04/05/06 row), `preservation-matrix.md`, `docs/ai/README.md`, and `CURRENT.md`.

In my sandbox:
- Real `CLAUDE.md` (30,154 B) and `AGENTS.md` (18,670 B) are **byte-equal** to `scratch/*.v4.proposed`; both have 0 CR bytes (LF only).
- `scratch/*.v4.orig` are byte-equal to the post-v3 `scratch/*.phaseb.proposed`, so the baseline for this round is exactly what I reviewed last time.
- A plain `diff` of post-v3 against the real files shows **exactly one changed line per file** (CLAUDE.md:458, AGENTS.md:331): the Gotchas `campsites.full.json` bullet, replaced by the verbatim v4 wording ("`api/campsites.js` serves `server_data/campsites.limited.json` to Free and `server_data/campsites.full.json` to Pro. Do not import `server_data/*.json` directly into the frontend bundle; use the existing `/api/campsites` flow."). Nothing else changed, so Execution discipline, the Decision 1/2/5 wording and all other text remain byte-identical to post-v3.
- `proposed-changes-v4.patch` (one hunk per file, 0 CR) passes `git apply --check --whitespace=error` against `*.v4.orig`, and the applied result equals the real files.
- `phase-b-v4-applied.diff` differs from the previous `phase-b-applied.diff` only by the two bullet lines and the blob `index` hashes (+8 bytes total, as expected).
- `docs/ai/README.md` is still `8656f56bce6f846d...`.
- Source check for the new wording: `api/campsites.js:21-23` branches `isPro ? full : limited`, and in my staged `src` copy the only consumer of `/api/campsites` is `useCampsites.js`, with no non-test import of `server_data/` anywhere. The bullet now states an observed serving fact plus the retained no-direct-import constraint, and no longer claims an original intent.

### R1 and R2 disposition

- **R1:** Fixed in both files with the exact approved wording. `audit.md` A-21 now strikes the earlier inaccurate "already observed-fact-only" claim and the superseded rationale, records the v4 wording, and agrees with the real files. `cc-report.md` states plainly that its earlier claim had been wrong.
- **R2:** The four stale statements are visibly annotated (struck through with dated notes, not deleted) at `cc-report.md` lines 59, 124, 144 and 165; the `requireAdmin` recount (11 matching lines = 1 definition + 1 comment + 9 calls) matches my own grep. The `decision-summary.md` row replaces the guessed "7 handlers" with explicit per-file path lists and points "open question 1" to Decision 3 as RESOLVED/APPLIED. The per-file new-path lists are correct (CLAUDE.md gains 5 new paths, AGENTS.md 3, because AGENTS.md already listed `blog-meta` and `cron/generate-blog-draft`). `preservation-matrix.md` was left unchanged; its Matrix B intro already states only #452/#453 is pointer-only, which I confirmed.

### Remaining note (non-blocking, documentation-only)

The `decision-summary.md` row says CLAUDE.md's table was "net +8 rows". Counting table rows beginning with `| `/api/`: CLAUDE.md went from 11 to 17, **net +6** (5 new paths + 3 from the `/api/admin` split, minus the 2 removed rows); AGENTS.md went from 11 to 17, net +6, which the row states correctly. Ripley or CC can fix the "+8" with a one-word annotation whenever convenient; it does not affect any instruction text.

### Checked and fine

Scope: only the two single-bullet instruction edits plus ticket-463 artifacts and the canonical `CURRENT.md` transition (`CC_COMPLETE`, approved-prompt path = v4); Phase A and Phase B patches and scratch files preserved; no commit, push, deploy, GitHub or index operation reported; no data/API/gating change; A-18 remains a recommendation only (no issue, no deletion advice).

### Limits of this review

Staged snapshots only; I did not run tests, lint, build, git, a browser or any repository script, and did not read `.env*`. The patch apply-check, byte comparisons, line counts and greps ran in my sandbox. HEAD, `git status`, `git diff --check`, the autocrlf warnings and the CC-reported new SHA-256 values for the two instruction files are CC-attributed (I verified bytes, not those hashes). My search for `server_data/` imports covers my staged `src` copy only. Vercel Cron's inbound method, Neon variable names, `vercel dev` behavior and the intent behind the Free/Pro campsite id-scheme difference remain UNKNOWN.

### Next

Ripley: whole-ticket final assessment. From my side nothing blocks closing #463 locally; remaining decisions are Ripley's (final state, whether to log the A-18 campsite id-scheme question as a separate follow-up) and the owner's (commit/push of the two instruction files, which I do not do).


## Ripley whole-ticket final assessment — 2026-10-24

Verdict: PASS. Phase A audit/proposal and Phase B owner-approved instruction edits complete. Accepted Jonesy's v4 PASS. Independently verified real CLAUDE.md/AGENTS.md equal *.v4.proposed bytes, have zero CR bytes, and retain Execution discipline byte-identical to PhaseA *.orig. Hashes: CLAUDE606a44bdb764bc1e56d8ade03def3db3fda89423de5cabe7f13ee5032290e32d; AGENTS404afe5d1f2a58ce6875029a91817dc4e9e93a4c8504f7b854cbf6f30948b2fa. Canonical docs/ai/README hash8656f56b...e558e2 unchanged. git status only expected instruction/CURRENT/task artifacts; git diff --check clean (informational LF->CRLF warnings retained). No application tests/build needed for instruction-only edits.

Non-blocking arithmetic clarification: CLAUDE route table grows11->17 rows, net+6; do not rely on decision-summary's net+8 annotation as an endpoint count. Route/action rows are not the same as handler files. No further correction round required; actual instruction tables reviewed against source.

Known unknowns remain Vercel/platform/deployment behavior and campsite id-scheme intent. A18 separate follow-up is recommended only, no new issue created; no deletion/migration authorized. #460–462 remain unimplemented work. No new policy beyond owner's four approved recommendations. CURRENT -> CLOSED. No commit/push/deploy/GitHub closure performed; owner controls those steps.

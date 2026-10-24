> Phase A close-out correction (Ripley, 2026-10-24): A-18's claim that all src/data campsite copies are identical/orphaned is superseded. Full copies match; limited copies differ (src/data58 vs server_data57, distinct id schemes). No deletion advice is valid. Intent/behavioral impact requires separate scoped investigation; no data change is part of463. See result-review.md final Phase A assessment.

# #463 — Phase A audit: CLAUDE.md / AGENTS.md vs. current project

Phase A only — read-only with respect to both instruction files. No instruction file was modified to produce this audit. Baseline, commands, and hashes are in `cc-report.md`.

## v2 correction notes (2026-10-24, Jonesy R1-R5) — read before the findings below

- **R1**: A-05/A-06 were wrong. `api/admin.js`'s GET branch, when no recognized `action` matches, falls through to `handleSummary()` (an admin-gated users/pro/revenue summary) — not an error, a real default behavior. `getPublishedBlogPosts` and `getPublishedBlogPostBySlug` (unless `&preview=draft`) are **public** reads, not admin-gated. Both my own `action === "..."` grep and Jonesy's own Round-1 pre-finding missed the default branch — neither read it. Corrected below, not silently rewritten over: see A-05/A-06 (superseded text struck, correction follows).
- **R2**: the #432/#436/#440 Matrix-B hunks were new rule prose, not pointer-only, and were misplaced under Authentication; the #440 hunk also wrongly cited `WeatherVoiceShareDialog.jsx` as an example of `isRendered`/`onCloseRef` patterns it does not have (confirmed: zero occurrences of either in that file this session — it is the *earlier, more limited* precedent `RoutePlannerDetailsModal.jsx`'s own comment cites, not an example of #440's later additions). These three are removed from the default patch entirely and moved to `decision-summary.md` as a new Decision 5, corrected. Only the true #452/#453 pointer (Open-Meteo doc link in the env block) remains in the default patch.
- **R3**: the cron routes' Method column previously said "POST" — unverified. Neither `generate-blog-draft.js` nor `refresh-aurora.js` checks the inbound HTTP method in code; the "POST" at `generate-blog-draft.js:47` is an *outbound* fetch call (to OpenAI), not an inbound method gate. Corrected to state the method is not handler-enforced and the platform's actual method is UNKNOWN.
- **R4**: "Architecture"/"Tech Stack" were graded verified-current but the tree is illustrative, not exhaustive (omits `api/cron/`, `api/_lib/aurora*`, `google-apps-script/`, `tests/e2e`, `docs/`, `src/data`, `src/ui`). Regraded below; new finding A-17 added. New finding A-18 added: `src/data/campsites.{full,limited}.json` (legacy copies, stale README, zero real importers found in a full `api`/`scripts`/`src`/`tests`/`google-apps-script`/`docs` search this session) vs. the real, actually-imported `server_data/` copies.
- **R5**: line counts reconciled (523/342 via `wc -l`, counting newline characters, vs. 524/343 used throughout this audit's own citations, which follow the Read-tool's 1-indexed line numbering — same bytes, two counting conventions, not a citation error); env-name omission rationale now stated explicitly in the patch itself (see A-07); `DATABASE_URL` removal rationale now distinguishes code-consumption from platform provisioning; table separator-row width fixed in the regenerated patch; A-01's "full campsite list" omission rationale stated.

No blame language is intended by naming where R1's gap came from — it is recorded once, factually, because the correction prompt asked for it, not repeated elsewhere in this file.

Grades: **VERIFIED SOURCE** (read the actual current file/behavior this session), **VERIFIED SAMPLE** (a scoped/partial check — directories/files named), **INFERRED** (reasoned from adjacent evidence, not directly executed), **UNKNOWN** (not derivable from the repository), **OWNER-CONFIRMED** (stated by the owner in a prior ticket, not independently re-verified here).

Every J7 pre-finding below was independently re-run with my own commands this session (listed in `cc-report.md`), not copied from Jonesy's wording. Every named J7 item matched Jonesy's claims exactly on re-run; none was refuted. **This does not mean every corner of both files was found error-free** — the v2 correction round (R1/R4, see notes above) found a real gap (`/api/admin`'s default branch) that neither this audit's own `action === "..."` grep nor Jonesy's Round 1 pre-finding caught, because neither explicitly named it as a J7 item to check. Several evidence grades are upgraded from Jonesy's SAMPLE to VERIFIED SOURCE here because the underlying grep was re-run against the full `src`/`api` tree, not a staged subset.

---

## Ledger A — CLAUDE.md (524 lines by this audit's own 1-indexed line citations; `wc -l` reports 523, counting newline characters — same bytes, see v2 correction notes above. SHA-256 in cc-report.md.)

| Lines | Section | Category | Finding ID |
|---|---|---|---|
| 1-3 | Preamble | verified-current | — |
| 7-13 | Dev Setup | unverified operational assertion | A-14 (gh auth login — UNKNOWN whether required/valid) |
| 17-34 | Architecture | incomplete, illustrative tree (not exhaustive) | A-17 |
| 38-60 | Tech Stack (Frontend/Backend/Testing) | incomplete, illustrative (not exhaustive) | A-17 |
| 66-70 | Campsite Tiers | verified-current | — |
| 72-74 | Weather Scoring | verified-current | — |
| 76-78 | Feature Gating | outdated/static count | A-01 |
| 80-98 | Free/Pro Gating — Forecast Data Rule | verified-current (policy, present) | matrix A |
| 100-102 | Canonical Decision Tone | verified-current (policy, present) | matrix A |
| 104-110 | Homepage Canonical Decision Surface | verified-current | — |
| 112-116 | Authentication | factual correction | A-02 |
| 118-122 | Payments (Paddle) | verified-current | — |
| 124-126 | Analytics Source vs. Checkout Attribution | verified-current (policy, present) | matrix A |
| 128-132 | Internationalization | verified-current | — |
| 134-139 | Route Planner | verified-current | — |
| 143-156 | UX Philosophy — Decision First (preamble+hierarchy) | verified-current | — |
| 158-167 | Core UX Principles | verified-current | — |
| 169-183 | Homepage Rules | verified-current | — |
| 185-193 | Brochure / Landing Pages | verified-current | — |
| 195-205 | Instant Comparison (goals) | contradictory policy / stale | A-03 |
| 207-211 | Radius Rule | verified-current | — |
| 213-221 | Distance Display | verified-current | — |
| 223-236 | Progressive Disclosure | verified-current | — |
| 238-252 | Analytics Priorities | verified-current | — |
| 254-261 | Analytics Conventions | verified-current | — |
| 263-270 | Primary homepage funnel | verified-current | — |
| 272 | **Bold-run: Homepage hero seasonal variants (Ticket 411)** | verified-current | — |
| 274 | **Bold-run: Event semantics change — `travel_advisor_destination_locked`** | verified-current (dated, attributed) | — |
| 276 | **Bold-run: Raw engine events vs. canonical display exposure** | verified-current (policy, present) | matrix A |
| 278-283 | Primary monetization funnel | verified-current | — |
| 285-292 | Tone | verified-current | — |
| 294-308 | Semantic Weather Labels | verified-current (policy, present) | matrix A |
| 310-313 | Analytics — Plausible Removed | verified-current | — |
| 315-321 | Blog — Bilingual Support | verified-current | — |
| 325-339 | API Routes (table) | factual correction (multiple rows) | A-04, A-05, A-06 |
| 343-350 | Database Schema | verified-current | — |
| 352 | No-ORM note | verified-current | — |
| 356-381 | Environment Variables | factual correction (wrong var name + omissions) | A-07 |
| 385-393 | Development (commands) | factual correction | A-08 |
| 395 | Unit-test file description | factual correction (incomplete) | A-09 |
| 397 | Vite proxy description | verified-current (matches `vite.config.js` exactly) | — |
| 399 | Deployment note | UNKNOWN (live platform fact) | A-15 |
| 403-411 | Conventions | contradictory policy (line 410 vs. Git workflow) | A-10 (tension, not a factual error) |
| 415-421 | Gotchas | verified-current | — |
| 425-432 | Project Rules | mixed: factual correction (431) + out-of-date-but-still-true-today exceptions (427-429) | A-11, A-12 |
| 436-445 | AI Collaboration Workflow | verified-current (canonical pointer intact) | — |
| 449-454 | Constraints — Execution discipline | verified-current (policy, present) | matrix A |
| 456-460 | Constraints — Git workflow | contradictory policy (vs. 410, vs. Subagent recipe) | A-10 |
| 462-464 | Constraints — Subagent git ops | contradictory policy / UNKNOWN command validity | A-13 |
| 468-503 | Branding | verified-current | — |
| 505-514 | Campsite comparison (Pro feature) | verified-current (policy, present) | matrix A |
| 507 | "32 unit tests" count | outdated/static count — **confirmed still accurate** | A-01b (no finding; recorded per J6 so the check isn't silently skipped) |
| 516-523 | Free preview — current behavior | verified-current (policy, present) | matrix A |

Missing approved decisions absent from this entire file (zero case-insensitive hits each, confirmed this session): "voice", "official", "modal", `#432`, `#436`, `#440`, `#452`, `#453`, `OPEN_METEO`, `docs/open-meteo`, `affiliate`, `POSTGRES_URL`, `BLOB`. See Matrix B in `preservation-matrix.md`.

## Ledger B — AGENTS.md (343 lines by this audit's own 1-indexed line citations; `wc -l` reports 342, same reason as Ledger A above. SHA-256 in cc-report.md.)

| Lines | Section | Category | Finding ID |
|---|---|---|---|
| 1-3 | Preamble | verified-current | — |
| 7-13 | Dev Setup | unverified operational assertion | A-14 |
| 17-34 | Architecture | incomplete, illustrative tree (not exhaustive) | A-17 |
| 38-60 | Tech Stack | incomplete, illustrative (not exhaustive) | A-17 |
| 66-70 | Campsite Tiers | verified-current | — |
| 72-74 | Weather Scoring | verified-current | — |
| 76-78 | Feature Gating | outdated/static count | A-01 |
| 80-84 | Authentication | factual correction | A-02 |
| 86-90 | Payments (Paddle) | verified-current | — |
| 92-96 | Internationalization | verified-current | — |
| 98-102 | Route Planner | verified-current | — |
| 104-106 | Free/Pro Gating — Forecast Data Rule (short form + pointer) | verified-current, pointer target exists | — |
| 108-110 | Canonical Decision Tone (short form + pointer) | verified-current, pointer target exists | — |
| 112-119 | **InstantComparison** | contradictory / stale (homepage ownership, wrong code location) | A-03 |
| 121-129 | Analytics (incl. monetization funnel folded in) | verified-current (policy, present) | matrix A |
| 131-139 | Blog — Bilingual | verified-current | — |
| 143-156 | UX Guardrails (AGENTS-only short form) | verified-current | — |
| 160-172 | Copy Tone (AGENTS-only short form) | verified-current (policy, present) | matrix A |
| 176-190 | Analytics Conventions (AGENTS-only short form) | verified-current | — |
| 194-208 | API Routes (table) | factual correction + misaligned columns (whitespace) | A-04, A-05, A-06, A-16 (formatting-only) |
| 212-219 | Database Schema | verified-current (AGENTS's `blog_posts` column list is fuller than CLAUDE's) | — |
| 221 | No-ORM note | verified-current | — |
| 225-259 | Environment Variables | factual correction (wrong var name + omissions, fewer than CLAUDE's gaps) | A-07 |
| 263-271 | Development (commands) | factual correction | A-08 |
| 273 | Unit-test file description | factual correction (incomplete) | A-09 |
| 275 | Vite proxy description | verified-current | — |
| 277 | Deployment note | UNKNOWN | A-15 |
| 281-289 | Conventions | contradictory policy (line 288 vs. Git workflow) | A-10 |
| 293-299 | Gotchas | verified-current | — |
| 303-310 | Project Rules | mixed, same as CLAUDE | A-11, A-12 |
| 314-323 | AI Collaboration Workflow | verified-current | — |
| 327-332 | Constraints — Execution discipline | verified-current (policy, present) | matrix A |
| 334-338 | Constraints — Git workflow | contradictory policy | A-10 |
| 340-342 | Constraints — Subagent git ops (`Codex --model haiku`) | contradictory policy / UNKNOWN command validity | A-13 |

Missing in AGENTS.md but present in CLAUDE.md: Homepage Canonical Decision Surface, UX Philosophy — Decision First (full version), Branding, Campsite comparison (Pro feature)/Free preview section. These are CLAUDE-only sections per J5; see divergence table.

## Divergence table (sections unique to one file)

| Section | CLAUDE.md only | AGENTS.md only |
|---|---|---|
| Homepage Canonical Decision Surface | ✓ | — |
| UX Philosophy — Decision First (full, with sub-headings) | ✓ | — (AGENTS has only the short "UX Guardrails" form) |
| Branding — CampCast → Eltum Veðrið | ✓ | — |
| Campsite comparison (Pro feature) / Free preview | ✓ | — |
| Semantic Weather Labels (long form with rationale) | ✓ (short form also exists in AGENTS as "Copy Tone") | — |
| UX Guardrails | — | ✓ (CLAUDE's equivalent is split across UX Philosophy subsections) |
| Copy Tone | — | ✓ (short form of CLAUDE's "Semantic Weather Labels") |
| Analytics Conventions as its own top-level heading | — | ✓ (CLAUDE has it as a `####` under Analytics Priorities) |

Both files are near-identical in Dev Setup/Architecture/Tech Stack/Gotchas/Project Rules/AI Collaboration Workflow/Constraints — byte-identical in several spans (confirmed by direct comparison this session).

---

## Findings

Each finding: instruction file:line (both files where applicable), excerpt, category/severity, evidence (code/config/approved-decision, separately from policy, separately from live-deployment status), proposed wording direction, confidence, owner decision needed (Y/N).

### A-01 — Pro-features one-liner omits 4 of 8 real features (LOW severity, factual correction)

- **CLAUDE.md:78 / AGENTS.md:78**: "Centralized free/pro feature definitions. `RequireFeature` component wraps gated UI. Pro features: wind direction, shelter index, advanced route planning, full campsite list."
- **Evidence** (VERIFIED SOURCE, `src/config/features.js`, read in full this session): `FEATURES` has 8 entries — `forecastDays` (limit, 7/7), `topSitesCount` (limit, free 3/pro 5), `windDirection` (tier pro), `shelterIndex` (tier pro), `bestRoutePlanner` (tier pro — "advanced route planning"), `campsiteComparison` (tier pro, `preview:false`), `weatherFinderResultsCount` (limit, free 3/pro 999), `northernLights` (tier pro, `freeDuringExperiment:true`, #431). "full campsite list" in the prose does not correspond to any `FEATURES` key — it refers to the separate `server_data/campsites.{limited,full}.json` tier mechanism documented under "Campsite Tiers". The one-liner omits `campsiteComparison`, `northernLights`, and both `limit`-type features entirely.
- **Proposed**: replace the hardcoded list with a short, explicitly-labelled example plus a pointer: "...Pro features include wind direction, shelter index, advanced route planning, and campsite comparison (see `src/config/features.js` for the current full list, including Free/Pro limits such as Top-sites count and Weather Finder results; the separate free/pro campsite *list length* — 'full campsite list' — is covered under 'Campsite Tiers' above, not a `FEATURES` entry)." A pointer is proposed instead of a longer hardcoded list because this list has already drifted once and will drift again. **(R5e, added in v2)**: "full campsite list" is deliberately dropped from the one-liner itself (it was never a `FEATURES` entry to begin with) but its rationale — that it's covered elsewhere, under "Campsite Tiers" — is now stated explicitly in the hunk text rather than left for the reader to infer.
- **Confidence**: high. **Owner decision needed**: N (factual/pointer).

### A-02 — Login route name wrong in CLAUDE.md, internally inconsistent in AGENTS.md (MEDIUM severity, factual correction)

- **CLAUDE.md:114**: "Email-only login → `/api/login` creates user + session". **CLAUDE.md:331** (route table): `/api/login` row.
- **AGENTS.md:82**: "Email-only login → `/api/login-email` creates user + session" (correct). **AGENTS.md:200** (route table): `/api/login` row (wrong — contradicts its own line 82).
- **Evidence** (VERIFIED SOURCE): `ls api/*.js` shows no `api/login.js`; the real handler is `api/login-email.js`. `src/hooks/useLoginFlow.js:46` calls `fetch("/api/login-email", ...)`. `vercel.json`'s only `/api/...` rule is the generic `/api/(.*)` → `/api/$1` passthrough — there is no handler-specific rewrite that would make a literal `/api/login` route resolve to anything.
- **Proposed**: CLAUDE.md:114 and :331, and AGENTS.md:200 → `/api/login-email`.
- **Confidence**: high (two independent code paths — handler listing and the hook's own fetch call — agree). **Owner decision needed**: N.

### A-03 — InstantComparison section describes stale homepage ownership and the wrong code location for `selectBestCandidate` (MEDIUM-HIGH severity, contradictory policy / stale)

- **AGENTS.md:112-119**: "Homepage component that compares current campsite against best nearby alternative... Selection logic lives in `selectBestCandidate()` inside `InstantComparison.jsx`."
- **CLAUDE.md:104-110, 195-197** (for contrast, already correct): `HomeDecisionCard.jsx` is "the single canonical stay/move/consider recommendation surface on the homepage"; `InstantComparison.jsx` "is not rendered on the homepage anymore," only standalone on `Brochure.jsx`.
- **Evidence** (VERIFIED SOURCE, full-`src` grep this session, not a sample): `grep -n "export function selectBestCandidate" src/lib/comparisonUtils.js` → `comparisonUtils.js:101`. `grep -rln "selectBestCandidate" src` → `HomeDecisionCard.jsx`, `InstantComparison.jsx`, `useComparisonState.js`, `comparisonUtils.js` itself (not inside `InstantComparison.jsx`). `grep -rln "import InstantComparison|<InstantComparison" src --include="*.jsx"` → only `src/pages/Brochure.jsx`; `App.jsx` does not import it. `HomeDecisionCard.jsx:29-39`'s own header comment states explicitly it "Replaces the separate `DecisionBanner` + `InstantComparison` banners... `InstantComparison.jsx` itself is untouched and still used by `Brochure.jsx`." `grep -c "HomeDecisionCard" AGENTS.md CLAUDE.md` → AGENTS.md: 0, CLAUDE.md: 6.
- **Proposed**: rewrite AGENTS.md's InstantComparison section to (a) state `HomeDecisionCard.jsx` is the canonical homepage surface (with a pointer to CLAUDE.md's fuller section, matching the existing pointer pattern at AGENTS.md:106,110), (b) correct `selectBestCandidate`'s location to `src/lib/comparisonUtils.js:101`, (c) keep the still-accurate radius/haversine/stay-positive rules, which do still describe real, shared logic. This is a readability/accuracy fix, not new policy — `HomeDecisionCard.jsx` is already documented, approved behavior in CLAUDE.md.
- **Confidence**: high. **Owner decision needed**: N for the factual correction itself; the exact prose wording is included as a proposed hunk, not a policy question.

### A-04 — Both route tables omit real, existing handlers (MEDIUM severity, factual correction — additive only)

- **CLAUDE.md:325-339, AGENTS.md:194-208.**
- **Evidence** (VERIFIED SOURCE, `ls api/*.js` + `vercel.json` crons this session): real handlers not in CLAUDE.md's table: `api/aurora-decision.js` (POST), `api/blog-upload.js` (POST, admin), `api/blog-meta.js` (GET, OG meta), `api/cron/generate-blog-draft.js`, `api/cron/refresh-aurora.js`. Real handlers not in AGENTS.md's table: `api/aurora-decision.js`, `api/blog-upload.js`, `api/cron/refresh-aurora.js` (AGENTS.md already has `blog-meta` and `cron/generate-blog-draft`, CLAUDE.md does not). **Corrected (v2, R3)**: the two cron routes' Method is NOT handler-verified — see A-19 below; do not read the methods listed for them anywhere in this document as a confirmed inbound contract.
- **Proposed**: add the missing rows to both tables with Method/Auth/Purpose columns matching each handler's own top-of-file comment or auth-check code. Per J14/contract item 2, a table is not a spec — the proposed wording adds a one-line caveat ("not necessarily exhaustive — see `api/` for the current handler list") rather than implying either table is now complete.
- **Confidence**: high for existence; MEDIUM for exact Auth-column wording per added row (see A-04 continued in `decision-summary.md`'s hunk map for the specific text used — kept literal/minimal, e.g. "admin email" for `blog-upload`, matching its own auth check).
- **Owner decision needed**: N (additive, factual).

### A-05 — CLAUDE.md's route table lists two routes that do not exist (MEDIUM-HIGH severity, factual correction — removal)

- **CLAUDE.md:337-338**: `/api/users` (GET, admin email, "List users (admin)") and `/api/db-health` (GET, —, "Database health check").
- **Evidence** (VERIFIED SOURCE): `ls api/*.js` lists no `users.js` or `db-health.js`. No file in `api/` implements either literal route name.
- **Proposed**: remove these two rows (unaffected by the R1 correction below — they are genuinely absent regardless of what `/api/admin` itself does). This is a removal of a factual error, not a policy choice.
- **Confidence**: high. **Owner decision needed**: N — unless the owner knows of a planned-but-unimplemented route, in which case the row should say so explicitly rather than presenting it as already live (flagged as a question in `decision-summary.md`, not assumed).

### A-06 — `api/admin.js`'s actual auth/dispatch surface, corrected (MEDIUM severity, factual correction)

~~**Superseded v1 claim** (wrong, kept here struck-through rather than deleted, per the correction prompt): "api/admin.js dispatches only blog actions... there is no non-blog admin action today." This was based only on grepping `action === "..."` branches and missed what happens when *no* action matches.~~

**Corrected (v2, R1)** — read `api/admin.js`'s full GET/POST dispatch this session, including the default branch, not just the named-action branches:
- `api/admin.js:1398-1415` (GET): if `?action=` matches `listBlogPosts`/`getPublishedBlogPosts`/`getPublishedBlogPostBySlug`, dispatch accordingly; **otherwise (no action, or an unrecognized one) it falls through to `handleSummary(req, res)` at line 1414 — a real default behavior, not an error.**
- `handleSummary` (`:476-497`) calls `requireAdmin` (`:478`) and returns `getUsersSummary`/`getProSummary`/`getRevenueSummary` — i.e. a plain `GET /api/admin` with no query string returns an **admin-gated summary of users/pro-subscriber counts/revenue**, not a 400/404.
- `handleListBlogPosts` (`?action=listBlogPosts`) is admin-gated (`requireAdmin` at `:505`) — this is the admin panel's own post list.
- `handleGetPublishedBlogPosts` (`?action=getPublishedBlogPosts`, `:1179-1225`) has **no `requireAdmin` call at all** — it is a fully **public** read.
- `handleGetPublishedBlogPostBySlug` (`?action=getPublishedBlogPostBySlug`, `:1227-...`) is **public**, EXCEPT when the request also carries `?preview=draft`, in which case it calls `requireAdmin` (`:1239`) first.
- `api/admin.js:1417-1445` (POST): the six write actions (`generateDraft`/`createBlogPost`/`createBlogMedia`/`updateBlogPost`/`publishBlogPost`/`deleteBlogPost`) are each admin-gated (confirmed via `grep -n "requireAdmin" api/admin.js` → 10 call sites total, matching: `handleSummary`, `handleListBlogPosts`, the 6 write handlers, and the conditional draft-preview branch — i.e. every one of the 9 non-public functions calls it, and only the 2 published-read functions (minus the draft-preview case) do not).
- **Proposed** (replaces v1's single "Blog admin operations" Purpose cell): split `/api/admin` into 4 table rows reflecting the real auth split — admin summary (default GET), admin's own blog list (GET), public published-reads (GET, admin-only with `&preview=draft`), and blog admin writes (POST). See the regenerated `proposed-changes.patch` for the exact row text.
- **Confidence**: high (every branch read directly, not inferred). **Owner decision needed**: N (factual).
- **Note on how this was missed**: Jonesy's own Round 1 pre-finding said "admin.js dispatches only blog actions," and my own v1 audit re-ran only an `action === "..."` grep and reported it confirmed — neither of us read the default (no-match) branch. Recorded once here, factually, per the correction prompt; not repeated as blame elsewhere in this file.

### A-07 — Environment Variables blocks name the wrong DB var and omit several real ones (MEDIUM severity, factual correction)

- **CLAUDE.md:356-381, AGENTS.md:225-259.**
- **Evidence** (VERIFIED SOURCE): `grep -rln "process.env.POSTGRES_URL\|process.env.DATABASE_URL" api --include="*.js"` (excluding tests) → 11 files, every one reads `process.env.POSTGRES_URL`; zero read `DATABASE_URL`/`DATABASE_URL_UNPOOLED` (confirmed by grepping the exact strings in each of the 11 files). `.env.example` (names only, `grep -o "^[A-Z_]*="` then corrected for the one entry that regex silently dropped — see `cc-report.md`) has `POSTGRES_URL=` and `DATABASE_URL=`/`DATABASE_URL_UNPOOLED=` both present (so the stale names are at least still accepted as a key in the example file, just not what the code actually reads) plus `PADDLE_PRICE_ID_30_DAY_PASS=`, `PADDLE_PRICE_ID_YEAR_PASS=`, `VITE_RESEARCH_QUIZ_CAMPAIGN/ENABLED/WEBAPP_URL=` — none of which appear in either instruction file's env block. `OPEN_METEO_API_KEY`, `CRON_SECRET`, `BLOB_READ_WRITE_TOKEN` are read in real code (`api/_lib/auroraDecision/openMeteo.js` / `api/forecast.js`'s auth helper per #453's own work; `api/cron/*.js`; `api/blog-upload.js`) but **`CRON_SECRET` and `BLOB_READ_WRITE_TOKEN` are absent from `.env.example` entirely** — a gap in the example file itself, not only in the two instruction files. AGENTS.md's own block already includes `VITE_GA_MEASUREMENT_ID`, `ALLOWED_ORIGINS`, `CRON_SECRET` (CLAUDE.md's block omits all three).
- **Proposed**: in both files, replace `DATABASE_URL`/`DATABASE_URL_UNPOOLED` with `POSTGRES_URL` (matching actual code), and add `OPEN_METEO_API_KEY` with a one-line pointer to `docs/open-meteo-auth.md` instead of restating that doc's operational status (per contract item 4's explicit instruction to link rather than copy). Add `BLOB_READ_WRITE_TOKEN` to both files (AGENTS.md already had `CRON_SECRET`; CLAUDE.md gets both `CRON_SECRET` and `BLOB_READ_WRITE_TOKEN`), and add `VITE_GA_MEASUREMENT_ID`/`ALLOWED_ORIGINS` to CLAUDE.md for parity with AGENTS.md (which already had both). Both files' Environment Variables heading now carries "Representative, not exhaustive — see `.env.example` for the full current list." (**added in v2, R5a** — this states explicitly, rather than leaving implicit, that `PADDLE_PRICE_ID_30_DAY_PASS`/`_YEAR_PASS` and `VITE_RESEARCH_QUIZ_*` are deliberately not individually listed: they are covered by the "representative" caveat and the existing `PADDLE_PRICE_ID_MONTHLY`/`_YEARLY` entries already establish the Paddle-price-ID pattern). The `DATABASE_URL`/`DATABASE_URL_UNPOOLED` removal is now accompanied by an inline comment (**added in v2, R5b**) distinguishing code-consumption fact (no handler reads them) from platform configuration (the Neon/Vercel integration may still provision them) — not an instruction to delete any platform-side setting. The `.env.example` gap (missing `CRON_SECRET`/`BLOB_READ_WRITE_TOKEN` there too) remains OUT OF SCOPE for this instruction-file audit (it's a different file) — recorded here as a related observation, not proposed for a patch in this ticket.
- **Confidence**: high for the var-name correction (11/11 handlers agree); high for the omissions (each confirmed read in real code this session).
- **Owner decision needed**: N for the var-name fix or any of the additions above.

### A-08 — "Vite dev server + Vercel dev (API proxy)" overstates what `npm run dev` actually starts (MEDIUM severity, factual correction)

- **CLAUDE.md:389, AGENTS.md:267**: `npm run dev       # Vite dev server + Vercel dev (API proxy)`.
- **Evidence** (VERIFIED SOURCE): `package.json:7` → `"dev": "vite"` — this single script starts Vite only; nothing in `package.json` also launches a Vercel dev process. `vite.config.js:76-93`'s `server.proxy` config: `/api/forecast` is hard-proxied directly to the public `https://api.open-meteo.com` host (bypassing `api/forecast.js` and any key entirely); `/api` (everything else) is proxied to `http://localhost:3000`, which is NOT started by `npm run dev` — something else (e.g. `vercel dev`) has to be running there separately for any other `/api/*` call to work locally. `docs/open-meteo-auth.md:39` already describes this correctly ("`vite.config.js`'s dev server (`npm run dev`, Vite alone) proxies `/api/forecast` directly... bypassing this helper entirely... To exercise the real, shared selection logic locally, run the backend itself (e.g. `vercel dev`) instead"). `playwright.config.js:20-21` confirms E2E tests' own `webServer.command` is literally `"npm run dev"` (Vite alone, port 5173 per `baseURL`), consistent with this reading.
- **Proposed**: `npm run dev       # Vite only — see docs/open-meteo-auth.md for the dev-only /api/forecast proxy exception and what else needs to be running for other /api/* calls`. Links to the already-correct auth doc instead of duplicating its operational detail, per contract item 4.
- **Confidence**: high (three independent pieces of evidence — the script itself, the proxy config, and the already-correct sibling doc — all agree). **Owner decision needed**: N.

### A-09 — Unit-test file description omits `.jsx` test files and the non-watch scripts (LOW severity, factual correction)

- **CLAUDE.md:395, AGENTS.md:273**: "Unit tests live alongside their modules as `*.test.js` files (e.g. `src/lib/scoring.test.js`). Test coverage is configured for `src/utils/**/*.js`."
- **Evidence** (VERIFIED SOURCE, `vitest.config.js:20-29,37-39`): `include` covers `src/**/*.test.js`, `src/**/*.spec.js`, **`src/**/*.test.jsx`, `src/**/*.spec.jsx`**, `api/**/*.test.js`, `google-apps-script/**/*.test.js`, `scripts/**/*.test.mjs`. Coverage `include` is exactly `src/utils/**/*.js` — this part of the sentence is accurate and unchanged. `package.json:11-16`: `test` (watch) is correctly described as watch mode by both files elsewhere, but `test:run`, `test:ci`, `test:coverage`, `test:ui` also exist and are what CI (`.github/workflows/ci.yml:26`, Node 20, `npm run lint` then `npm run test:coverage`) actually runs — neither file mentions these non-interactive scripts at all.
- **Proposed**: "...live alongside their modules as `*.test.js`/`*.test.jsx` files... Non-watch scripts also exist: `test:run`, `test:ci`, `test:coverage` (CI uses `test:coverage` after `lint`, Node 20)."
- **Confidence**: high. **Owner decision needed**: N.

### A-01b — "32 unit tests" (CLAUDE.md:507) independently re-counted: still accurate (no finding, recorded per J6)

- **Evidence** (VERIFIED SOURCE): `grep -c "^\s*it(\|^\s*test(" src/utils/compareCampsiteForecasts.test.js` → 32; `grep -c "\.each" src/utils/compareCampsiteForecasts.test.js` → 0 (no parameterized multiplier hiding a different real count). This count is fragile (will go stale on the next edit to that file) but is category "static count, verified-current" today, not an error — recorded explicitly so the audit doesn't silently skip re-checking a number that happens to still be right.

### A-10 — Git-workflow / adjacent-fix-scope policy tensions (MEDIUM severity, contradictory policy — owner decision)

- **CLAUDE.md:410** ("If a bug fix reveals an adjacent UX gap, fix it in the same commit if < 25 lines — note it in the commit message") and **:462-464** (Subagent git ops: "Run `git add` + `git commit`... inside an active Claude Code session") sit alongside **:456-460** ("Use descriptive commit messages referencing issue number", "Never run git push — the user always pushes manually", "Show changes as diffs only, I manage git myself"). AGENTS.md has the identical structure at :288, :334-338, :340-342.
- **Evidence**: `docs/ai/README.md:9` ("Default is no commit, no push. Only Róbert may explicitly override this default.") and `:122-128` (commit/push are Róbert's own post-CLOSED steps, not CC's). The "Show changes as diffs only, I manage git myself" line and the adjacent-fix-commit instruction are not simultaneously satisfiable as written — one says CC never commits, the other instructs CC to make a commit under a size condition.
- **This is a policy tension, not a factual error** — the code doesn't "violate" a policy here; the instruction files disagree with themselves and with the canonical workflow doc. Per the binding clarification, this goes to `decision-summary.md` as an owner decision, not into the default factual patch. Recommended default (stated as a recommendation, not applied): align both files with `docs/ai/README.md`'s "default no commit/no push, Róbert overrides explicitly" and either drop the adjacent-fix-commit instruction or rephrase it as "note the adjacent fix in the diff/PR description," not "in the same commit."
- **Confidence**: high that the tension exists as written. **Owner decision needed**: Y (which wording wins).

### A-11 — TypeScript/import-extension prohibitions are not literally true today (LOW-MEDIUM severity, needs "existing exceptions" wording per J10)

- **CLAUDE.md:428-429, AGENTS.md:306-307**: "Never use TypeScript type annotations in any file" / "Never use explicit file extensions in imports".
- **Evidence** (VERIFIED SOURCE): `src/components/WeatherIcon.tsx` contains `export type WeatherIconId = ...` (line 18) — a real, current TypeScript type annotation. 13 `.tsx` files exist under `src/components/icons/weather/` plus `index.ts` and `src/utils/WeatherIconMapping.ts` (2 more `.ts` files) — 16 TS/TSX files total. `eslint.config.js:12` lints only `**/*.{js,jsx}` — these files are not even linted against the rule that would catch a violation. Separately: `api/login-email.js:4` imports `"./_lib/setCookie.js"` (explicit `.js` extension) and `src/lib/auroraScoring.test.js:8` imports `"./auroraScoring.js"` — both are necessary because `package.json` sets `"type":"module"` and `api/`/some test files run under plain Node ESM, which requires the extension; this is a different, legitimate reason than the Vite-bundled `src/` components (which can and do omit extensions).
- **Proposed** (per J10 — forward-looking exception wording, not migration authority): append to both rules, e.g. "Existing exception: the legacy `.tsx`/`.ts` weather-icon files predate this rule and are not being migrated; do not create new `.tsx`/`.ts` files." and "Existing exception: `api/**` and some test/script files use explicit `.js`/`.mjs` extensions because they run under plain Node ESM (`type: module`), not Vite's bundler — this does not authorize adding extensions to `src/` component imports." Does not weaken "never create new" intent.
- **Confidence**: high. **Owner decision needed**: N for stating the exception exists; the exact wording is a judgment call but not a policy reversal, so treated as factual/clarifying here per J10's framing — flagged in `decision-summary.md` anyway for visibility since it touches a "never" rule.

### A-12 — Backend-scope line states a fact that is no longer true, next to a real, still-live policy intent (MEDIUM-HIGH severity, split fact from policy per J8)

- **CLAUDE.md:431, AGENTS.md:309**: "Keep everything client-side, no backend, no new libraries".
- **Evidence** (VERIFIED SOURCE): `api/` contains 20+ real serverless handlers; `package.json` dependencies include `postgres`, `@vercel/blob`, `@sentry/react`, `react-ga4`, and others — i.e. "no backend" is factually false today (a backend has existed since well before #452/#453), and "no new libraries" is itself a live-enforced rule that the project's own history has already made exceptions to (each addition presumably went through its own review). The *intent* behind the line — don't expand backend surface or add dependencies without a deliberate decision — is still a real, current, enforced policy (this very audit's own prompt required STOP conditions around exactly this).
- **Proposed split** (per J8, do NOT silently relax the policy in a factual patch): the factual correction is narrow — state plainly that a backend exists (`api/`, Postgres, Paddle, Open-Meteo proxy) — while the *scope-control* wording ("no unsolicited backend/dependency expansion without approval") is offered as a wording option in `decision-summary.md`, not applied here.
- **Confidence**: high that the current line is factually false; the replacement wording is a judgment call. **Owner decision needed**: Y (exact replacement wording for the policy half).

### A-13 — Subagent git-ops recipe names an unverifiable CLI and sits inside the same git-workflow tension as A-10 (LOW severity, UNKNOWN + policy)

- **CLAUDE.md:462-464** (`claude --model haiku`), **AGENTS.md:340-342** (`Codex --model haiku`).
- **Evidence**: neither command's validity (whether the named CLI/flag combination exists and behaves as described) is derivable from this repository — this is external tool behavior. No replacement command is invented here, per the binding clarification.
- **Proposed**: no factual change proposed (nothing to correct without guessing); flagged alongside A-10 as part of the same git-workflow decision, since any rewording of the git section should address this recipe's place in it too.
- **Confidence**: n/a (UNKNOWN by design). **Owner decision needed**: Y (bundled with A-10).

### A-14 — `gh auth login` in Dev Setup: operational validity UNKNOWN (LOW severity, unverified operational assertion)

- **CLAUDE.md:12, AGENTS.md:12**: `gh auth login  # required for issue lookup`.
- **Evidence**: whether `gh` is installed, authenticated, or actually required in the way this comment implies is a local/operational fact this repository cannot prove either way (this session's own `gh issue view` calls across #437/#463 history worked, which is weak circumstantial support that *some* working `gh` auth exists in at least one environment, but that is not the same as verifying this literal setup step for a fresh clone). Not changed; recorded as UNKNOWN per contract item 8's explicit instruction not to guess platform facts.
- **Confidence**: n/a. **Owner decision needed**: N (no change proposed; informational).

### A-15 — "Deployment is via Vercel Git integration — push to `main` deploys automatically." (LOW severity, UNKNOWN — live platform fact)

- **CLAUDE.md:399, AGENTS.md:277.**
- **Evidence**: this is a live Vercel project configuration fact, not derivable from the repository (no `vercel.json` setting controls this; it's a dashboard/Git-integration setting). Per contract item 8, treated as UNKNOWN rather than silently assumed true or false; not changed since there is no repository evidence against it either, and this matches the owner-confirmed operational pattern already documented elsewhere (`docs/open-meteo-auth.md`'s "owner-confirmed" key-presence table uses the same convention for platform facts).
- **Confidence**: n/a. **Owner decision needed**: N (no change proposed).

### A-16 — AGENTS.md route table has misaligned column whitespace at rows 205-208 (LOW severity, formatting-only)

- **AGENTS.md:205-208**: the four added rows (`paddle-webhook`, `admin`, `blog-meta`, `cron/generate-blog-draft`) use wider column padding than the table's other rows, breaking visual alignment (though the Markdown still renders correctly as a table either way).
- **Evidence** (VERIFIED SOURCE, direct read): confirmed visually inconsistent padding vs. rows 198-204.
- **Proposed**: per J14, left alone in the default patch, OR isolated as a separate, clearly-labelled formatting-only hunk if the owner wants it tidied in the same pass. Not bundled with any content change.
- **Confidence**: high (purely visual). **Owner decision needed**: Y, but trivial (cosmetic-only; default is "leave alone").
- **Update (v2)**: resolved as a side effect of the R1 route-table rewrite (the whole table was regenerated with consistent padding when the `/api/admin` rows were split) — no separate formatting-only hunk was needed.

### A-17 — Architecture/Tech Stack trees are illustrative, not exhaustive (added in v2, R4; LOW severity, ledger regrade)

- **CLAUDE.md:17-60, AGENTS.md:17-60** (byte-identical between the two files).
- **Evidence** (VERIFIED SOURCE, direct directory listing this session): the tree omits real, existing top-level paths: `api/cron/`, `api/_lib/auroraDecision/` (and other `_lib` helpers beyond "auth, Paddle" — e.g. aurora and Open-Meteo), `google-apps-script/`, `tests/e2e/`, `docs/`, `src/data/`, `src/ui/`. None of these are factually wrong to omit — a architecture overview is inherently a summary, not a full `find` listing — but the v1 audit's "verified-current" grade implied completeness it didn't have.
- **Proposed**: no patch hunk (rewriting the tree diagram to be exhaustive would be a much larger, lower-value change, and the tree is reasonably read as illustrative by any engineer skimming it). Regrade only: both ledger rows changed from "verified-current" to "incomplete, illustrative tree (not exhaustive)" above.
- **Confidence**: high. **Owner decision needed**: N (no change proposed, grading-only).

### A-18 — `src/data/` vs `server_data/` campsite copies: the FULL files match, but the LIMITED files use two different, non-overlapping ID schemes (restated in Phase B, N1 — v2's "likely orphan, safe to delete" framing was incomplete and is corrected here, not deleted)

~~**v2 claim (incomplete)**: "`src/data/` contains `campsites.full.json`... byte-size-identical to `server_data/campsites.full.json`... [src/data/ is] an orphaned legacy copy." True as far as it went, but it never checked the LIMITED files against each other, which is where a real, live discrepancy is — and it drew a "likely safe to delete" conclusion the data doesn't support without more investigation.~~

**Corrected (Phase B), re-verified directly this session** (`node -e` reading all four files, repo root):
- `server_data/campsites.full.json` and `src/data/campsites.full.json`: **242 entries each, byte-identical content** (not just matching size) — confirmed truly duplicated.
- `server_data/campsites.limited.json`: **57 entries**, using legacy slug-style ids (e.g. `laugardalur_reykjavik`, `grindavik`).
- `src/data/campsites.limited.json`: **58 entries**, using OSM-style ids (e.g. `osm_relation_12561703`) — the same scheme as both FULL files.
- **`server_data/campsites.limited.json`'s 57 ids have ZERO overlap with `server_data/campsites.full.json`'s 242 ids** (checked directly: 0 of 57 match) — i.e. the server pair's own limited list is not a subset of its own full list, unlike `src/data`'s pair, where the limited list IS a proper subset of its full list (same OSM-id scheme both sides).
- `api/campsites.js:21-23` serves exactly this mismatched pair live: `server_data/campsites.limited.json` to Free users, `server_data/campsites.full.json` to Pro users — **confirmed via direct read of the handler this session**, not inferred.
- **What this means and doesn't mean**: a Free user's served site list and a Pro user's served site list use two disjoint id namespaces for the "limited" side. Whether this has any actual user-facing consequence (e.g. a site selected while Free not resolving after upgrading to Pro, or vice versa; a favorite/bookmark keyed by id breaking across the tier boundary) is **UNKNOWN** — this audit did not trace every consumer of a campsite `id` across the Free/Pro boundary, and doing so is explicitly out of this instruction-file-audit's scope. This is reported as a **behavioral-impact-unknown finding**, not a confirmed bug, and **no deletion, migration, or data-fix action is recommended here** — only that it be investigated separately (a new, distinctly-scoped ticket), which is itself a recommendation, not an action taken in this round.
- **Proposed**: no patch hunk (this is a `server_data`/`src/data` data issue, not a CLAUDE.md/AGENTS.md instruction-file issue — out of this audit's literal scope, same as v2's original framing). The finding itself is restated above with accurate, complete data instead of v2's incomplete "probably an orphan, probably safe to delete" framing.
- **Confidence**: high for every number/overlap-check above (all directly computed this session, not inferred). The behavioral-impact question is explicitly UNKNOWN, not graded one way or the other. **Owner decision needed**: N for this audit (informational); the separate-investigation recommendation is for the owner to accept or decline, not something this round acts on.

### A-19 — Cron routes' Method column was unverified; corrected (added in v2, R3; LOW-MEDIUM severity, factual correction)

~~**Superseded v1 claim**: the route table listed `/api/cron/generate-blog-draft` and `/api/cron/refresh-aurora` with Method "POST".~~ **This was an unverified inference**, not a confirmed inbound contract.
- **Evidence** (VERIFIED SOURCE, this session): `grep -n "req.method|method:|CRON_SECRET|Authorization" api/cron/generate-blog-draft.js api/cron/refresh-aurora.js` → neither file checks `req.method` anywhere. The only `method: "POST"` found, at `generate-blog-draft.js:47`, is inside an **outbound** `fetch` call to the OpenAI API (confirmed by the adjacent `Authorization: Bearer ${process.env.OPENAI_API_KEY}` at `:50`) — it describes the request this handler *sends*, not the request it *receives*. Both handlers authenticate purely via `Authorization: Bearer $CRON_SECRET` (`generate-blog-draft.js:99`, `refresh-aurora.js:24`), with no method gate at all. The actual HTTP method Vercel Cron uses to invoke these is a platform fact, not derivable from this repository.
- **Proposed**: the regenerated route table (both files) now shows "—" in the Method column for both cron rows, with an inline note that the handler does not check the inbound method and the platform's actual method is unverified; Auth stays `Bearer CRON_SECRET`.
- **Confidence**: high (direct code read, both files, zero method checks found). **Owner decision needed**: N.

### A-20 — Weather Scoring hunk: Free/Pro Top-sites display limit (added in Phase B, N2; finding ID retroactively assigned to the v2 hunk)

- **CLAUDE.md:74, AGENTS.md:74**: v2 added "...the Top-sites *display* is limited to 3 for Free / 5 for Pro (see `topSitesCount` in `src/config/features.js`)" to the existing Weather Scoring sentence, but did not give that addition its own finding ID, leaving it unreferenced from the hunk map.
- **Evidence** (VERIFIED SOURCE, `src/config/features.js`, direct read): `topSitesCount: { type: "limit", free: 3, pro: 5, label: "Top campsites list length" }` — an observed, literal value, not an inference. `useLeaderboardScores` itself ranks all scored sites; the 3-vs-5 split is a *display* limit applied on top of that, not a difference in which sites get scored.
- **Proposed**: no change to the hunk text itself (already correct and already observed-fact-only, not inferred) — this entry exists solely to give it a stable finding ID.
- **Confidence**: high. **Owner decision needed**: N.

### A-21 — Gotchas hunk: `campsites.full.json` tier-gating rationale (added in Phase B, N2; finding ID retroactively assigned to the v2 hunk; wording corrected in v4 R1)

- **CLAUDE.md Gotchas, AGENTS.md Gotchas**: v2 reworded "`campsites.full.json` is large — do not import directly in frontend" to "...the real reason is Free/Pro tier gating (Free must never receive the Pro-only full list), not the file's raw size (currently ~28 KB)" without a finding ID. **Superseded in v4 R1** (Jonesy Phase B result review): this Phase-B wording stated an *inferred rationale* ("the real reason is...") as if it were documented original intent, not an observed fact. Replaced with: "`api/campsites.js` serves `server_data/campsites.limited.json` to Free and `server_data/campsites.full.json` to Pro. Do not import `server_data/*.json` directly into the frontend bundle; use the existing `/api/campsites` flow." — an observed serving fact plus the retained no-direct-import constraint, applied to both real files in the v4 round.
- **Evidence** (VERIFIED SOURCE, `api/campsites.js:21-23`, direct read — not inferred from file size alone; re-confirmed in the v4 round via `grep -n "campsites.limited.json\|campsites.full.json" api/campsites.js`): the handler explicitly branches `isPro ? "server_data/campsites.full.json" : "server_data/campsites.limited.json"` — this is the actual, observed tier-gating mechanism, independent of how large the file happens to be at any point in time. The file is in fact small (28,454 bytes) — "large" was never an accurate reason even before the v2 correction.
- **Proposed**: ~~no change to the hunk text itself (already stated as an observed serving-contract fact, not an inferred file-size rationale)~~ — this claim was itself wrong (the v2/Phase-B hunk did state an inferred rationale as fact, per Jonesy's R1 finding); the v4 wording above is the actual fix, applied directly to `CLAUDE.md`/`AGENTS.md`.
- **Confidence**: high. **Owner decision needed**: N.

---

## Section-by-section acceptance statement (contract item, "every section reviewed or explicitly unverified with why")

Every heading/subsection/bold-run paragraph listed in Ledger A and Ledger B above was read in full this session (not matched by keyword search alone) and assigned exactly one category. Sections marked "verified-current" with no finding ID were checked against the same evidence sources used for the sections that DID produce a finding (same `src`/`api`/`config` reads), not assumed correct by omission. The three bold-run paragraphs named in J5 are explicitly covered (lines 272, 274, 276 of CLAUDE.md). No heading was skipped; where a check could not be completed within this bounded correction's read-only/no-probe constraints, it is marked UNKNOWN with the specific reason (A-14, A-15), not silently dropped.

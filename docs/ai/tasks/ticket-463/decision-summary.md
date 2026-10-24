# #463 — Decision summary

**Phase B status (2026-10-24): APPLIED.** Róbert approved all four recommendations below ("Já samþykkt," 2026-10-24) — Decisions 1, 2, 5, and the Decision 3 route removal. Phase B then applied the full corrected patch (this file's "default patch" table below, plus Decisions 1/2/5's exact wording from `approved-prompt-v3.md`) directly to the real `CLAUDE.md`/`AGENTS.md`. Both files are confirmed byte-equal to the reviewed proposed text, 0 CR bytes, `docs/ai/README.md` hash unchanged. See `cc-report.md`'s Phase B section and `preservation-matrix.md` for exact commands/hashes and the applied-wording cross-reference. The sections below are left as they were written during Phase A (the original decision-request framing) so the history of what was asked and why is preserved; each decision is marked APPLIED where it was resolved.

## v2 correction note (2026-10-24, Jonesy R1/R2/R3)

This file is corrected from v1 in three ways:
- **R1**: the `/api/admin` row description was wrong (it described only blog actions; the real handler also has an admin-gated default summary and two genuinely public reads). Fixed below.
- **R2**: v1 wrongly said the #432/#436/#440 Matrix-B pointers needed "no decision." They were new rule prose, not pointers, and are moved here as a new **Decision 5** — removed from the default patch entirely, with the `WeatherVoiceShareDialog.jsx` citation error (R2) corrected and the placement moved away from "Authentication."
- **R3**: the cron rows' Method column is corrected (was an unverified "POST" inferred from an outbound fetch call, not an inbound method check).

## What's in the default patch (factual corrections + pointer-only additions, no policy choice needed)

| Finding | What it fixes | Owner decision needed? |
|---|---|---|
| A-01 | Pro-features one-liner → pointer to `src/config/features.js` instead of a hardcoded, already-stale list; states explicitly that "full campsite list" is covered under "Campsite Tiers," not dropped silently | No |
| A-02 | `/api/login` → `/api/login-email` (3 places: CLAUDE.md:114/331, AGENTS.md:200) | No |
| A-03 | AGENTS.md's InstantComparison section rewritten: `HomeDecisionCard.jsx` is the real homepage surface; `selectBestCandidate` is really in `comparisonUtils.js` | No (corrects AGENTS.md to match an already-approved, already-documented-in-CLAUDE.md fact) |
| A-04/A-05/A-06 (**corrected, R1; count corrected, v4 R2 dated 2026-10-24**) | ~~Both route tables: add 7 missing real handlers (`aurora-decision`, `blog-upload`, plus cron rows)~~ — corrected to an explicit per-file list, not a guessed count: CLAUDE.md's table gained 5 new route paths (`/api/aurora-decision`, `/api/blog-meta`, `/api/blog-upload`, `/api/cron/generate-blog-draft`, `/api/cron/refresh-aurora`) plus the `/api/admin` 1→4 row split (+3 rows, net +8 rows); AGENTS.md already listed `/api/blog-meta` and `/api/cron/generate-blog-draft`, so it gained 3 new route paths (`/api/aurora-decision`, `/api/blog-upload`, `/api/cron/refresh-aurora`) plus the same +3 admin split (net +6 rows). Both tables also remove 2 nonexistent rows (`/api/users`, `/api/db-health`, CLAUDE.md only) and **split `/api/admin` into 4 rows** reflecting its real auth split: admin-gated default summary (users/pro/revenue), admin-gated blog-post list, **public** published-blog reads (admin-only only with `&preview=draft`), and admin-gated blog writes | No, **except**: see ~~open question 1 below~~ Decision 3 above (RESOLVED 2026-10-24: owner confirmed removal, not planned work; APPLIED in Phase B) |
| A-07 | Both env blocks: `DATABASE_URL`/`DATABASE_URL_UNPOOLED` → `POSTGRES_URL` (what the code actually reads, with a comment distinguishing code-consumption from platform provisioning); add `OPEN_METEO_API_KEY` (pointer to `docs/open-meteo-auth.md`, not restated), `BLOB_READ_WRITE_TOKEN` (both files), `CRON_SECRET`/`VITE_GA_MEASUREMENT_ID`/`ALLOWED_ORIGINS` (CLAUDE.md only, AGENTS.md already had them); both files now say "Representative, not exhaustive — see `.env.example`" | No |
| A-08 | Dev command comment: stop claiming `npm run dev` starts "Vercel dev" too; point to `docs/open-meteo-auth.md` | No |
| A-09 | Test-file description: mention `.test.jsx`, and the non-watch scripts CI actually uses | No |
| A-11 | Add "existing exception" wording to the TS/import-extension rules (legacy icon files, Node-ESM `api/`/script files) — does not authorize new exceptions, per J10 | No (J10 explicitly allows stating the exception without a decision) |
| A-19 (**new, R3**) | Cron rows' Method column corrected to show the method is not handler-enforced (was an unverified "POST") | No |
| Matrix B — **#452/#453 only** (corrected, R2) | One true pointer: Environment Variables block in both files links to `docs/open-meteo-auth.md` for Open-Meteo host/key/production-fail-closed detail, without restating it | No — this is the one Matrix-B item that really is just a link to an existing canonical doc |

**#432, #436, and #440 are NOT in the default patch** — see Decision 5 below (moved there in this correction round, R2).

## What's NOT in the default patch — policy decisions for Róbert

### Decision 1 — Backend-scope line (A-12) — **RESOLVED: owner chose option (a); APPLIED in Phase B**

**Current text** (CLAUDE.md:431, AGENTS.md:309): "Keep everything client-side, no backend, no new libraries."

This is factually false today (a real `api/` backend has existed since before #452/#453) — but the *intent* behind it (don't expand backend surface or add dependencies without a deliberate decision) is still live and enforced. Options:

- **(a)** "A backend exists (`api/`, Postgres, Paddle, Open-Meteo proxy) — do not expand it or add new dependencies without an explicit decision." *(Recommended — closest to current enforced behavior, states the fact plainly.)*
- **(b)** Drop the line entirely and rely on the "Execution discipline" constraint (CLAUDE.md:449-454) to cover scope discipline.
- **(c)** Leave the line exactly as-is (do nothing) — not recommended, since it is read as a true factual claim by anyone unfamiliar with the project's history.

### Decision 2 — Git workflow / adjacent-fix-scope tension (A-10, A-13) — **RESOLVED: owner chose option (a); APPLIED in Phase B** (plus the Subagent-recipe neutralization, JB2)

Three things currently pull against each other: "Show changes as diffs only, I manage git myself" (CLAUDE.md:460) vs. "fix an adjacent UX gap in the same commit if < 25 lines" (CLAUDE.md:410) vs. the Subagent git-ops recipe instructing an actual `git add`+`git commit`. `docs/ai/README.md:9` states the canonical default (no commit/no push, Róbert overrides explicitly).

- **(a)** Align both entry files with `docs/ai/README.md`'s default; rephrase the adjacent-fix rule to "note the adjacent fix in the diff/PR description, not a separate commit" — since CC does not commit at all under the current canonical workflow. *(Recommended.)*
- **(b)** Keep the adjacent-fix-same-commit wording for contexts outside the Ripley/Jonesy/CC workflow (e.g. a different, direct collaboration mode) and add a clarifying sentence distinguishing the two contexts.
- **(c)** Leave as-is; treat the Subagent git-ops recipe as describing a mode of use this specific session doesn't currently exercise.

The `claude --model haiku` / `Codex --model haiku` command validity (A-13) is UNKNOWN either way — no replacement is proposed; whichever option above is chosen, the recipe's wording should be revisited together with it rather than separately.

### Decision 3 — Route-table completeness (open question, not a real policy choice) — **RESOLVED: owner confirmed removal (not planned work); APPLIED in Phase B**

Two of the removed rows (`/api/users`, `/api/db-health`) don't exist today. If either was planned work rather than a stale leftover, say so and the proposed removal should instead become "(planned, not yet implemented)" rather than a deletion. Flagging rather than assuming.

### Decision 4 — A-16, AGENTS.md route-table whitespace

Already resolved as a side effect of A-04/A-06's table rewrite in the default patch (the whole table was regenerated with consistent padding when the `/api/admin` rows were split). No separate decision needed unless Róbert wants the table's column widths done differently.

### Decision 5 (new, R2) — Add short rules/pointers for Weather Voice (#432), own-assessment-vs-official-warning (#436), and modal lifecycle lessons (#440)? — **RESOLVED: owner chose option (a), all three, with exact wording pinned by Ripley in `approved-prompt-v3.md`; APPLIED in Phase B**

These three are real, already-shipped, already-approved decisions with **no mention at all** in either entry file (confirmed by a zero-hit search, see `preservation-matrix.md` Matrix B). Unlike #452/#453, none of the three has an existing canonical doc to link to — adding anything for them means writing new rule prose, which is why they're a decision here rather than in the default patch.

**Corrected proposed wording** (fixes v1's placement-under-Authentication and its wrong `WeatherVoiceShareDialog.jsx` citation for #440):

- **#432 (Weather Voice)**: place near "Route Planner"/"Internationalization," not "Authentication." Proposed: "Weather Voice (#432): `src/lib/weatherVoiceEngine.js` + `weatherVoiceRules.js`; safety-tier copy in `src/i18n/weatherVoice/safety.js` is separate from the joke library and never a punchline."
- **#436 (own assessment vs. official warning)**: same placement question — not under Authentication. Proposed, with the spurious "canonical-tone rule above" cross-reference removed: "Own weather assessment must never read as an official warning (#436, closed) — see `HazardSourceNote.jsx`."
- **#440 (modal lifecycle)**: under Gotchas, as in v1, but citing only the real worked example. Proposed, corrected: "Modal focus-trap/lock lifecycle patterns (gate on an `isRendered`-style flag, keep the latest callback in a ref, distinguish a genuinely-outside-panel focus target from an in-panel-but-unlisted native stop): see `RoutePlannerDetailsModal.jsx` (#440) — not a mandated shared component." (`WeatherVoiceShareDialog.jsx` removed from this sentence — it does not contain `isRendered` or `onCloseRef`; it is only the earlier, narrower focus-trap precedent `RoutePlannerDetailsModal.jsx`'s own comment cites, not a second example of the newer pattern.)

Options:
- **(a)** Add all three, as corrected above, in a follow-up hunk once decided. *(Recommended — they're real gaps, the corrected wording is accurate, and each is short.)*
- **(b)** Add only some of the three (e.g. skip #440 as too implementation-specific for an instruction file).
- **(c)** Add none; rely on `preservation-matrix.md` Matrix B as the record of these gaps without putting anything in the entry files themselves.

## Hunk → finding-ID map

| Patch hunk (file, anchor text) | Finding ID(s) |
|---|---|
| CLAUDE.md, "Weather Scoring"/"Pro features: wind direction..." | A-01 |
| CLAUDE.md, "Email-only login →" | A-02 |
| CLAUDE.md, API Routes table (incl. split `/api/admin` rows, cron Method fix) | A-04, A-05, A-06, A-19 |
| CLAUDE.md, Environment Variables block | A-07, Matrix B (#452/#453 only) |
| CLAUDE.md, `npm run dev` comment + non-watch scripts line | A-08, A-09 |
| CLAUDE.md, Gotchas (`campsites.full.json` tier-gating rationale) | A-21 |
| CLAUDE.md, "Each campsite gets a numeric score..." (Free3/Pro5 display-limit clarification) | A-20 |
| CLAUDE.md, Project Rules (.tsx/.ts/extension bullets) | A-11 |
| AGENTS.md, "Weather Scoring"/"Pro features: wind direction..." | A-01 |
| AGENTS.md, InstantComparison section (renamed/rewritten) | A-03 |
| AGENTS.md, API Routes table (incl. split `/api/admin` rows, cron Method fix) | A-04, A-06, A-19 |
| AGENTS.md, Environment Variables block | A-07, Matrix B (#452/#453 only) |
| AGENTS.md, `npm run dev` comment + non-watch scripts line | A-08, A-09 |
| AGENTS.md, Gotchas (`campsites.full.json` tier-gating rationale) | A-21 |
| AGENTS.md, "Each campsite gets a numeric score..." (Free3/Pro5 display-limit clarification) | A-20 |
| AGENTS.md, Project Rules (.tsx/.ts/extension bullets) | A-11 |

Items NOT in any hunk above (deliberately excluded from the default patch): A-10, A-12, A-13 (Decisions 1-2), Matrix B #432/#436/#440 (Decision 5), A-14, A-15 (UNKNOWN, no change proposed), A-01b (confirmed-accurate count, no change needed), A-17/A-18 (ledger regrade / informational finding, no hunk).

## Recommended next step — superseded, Phase B complete

~~Róbert reviews this summary... decides Decisions 1, 2, and 5...~~ **This happened**: Róbert approved all four recommendations on 2026-10-24; Ripley pinned exact wording in `approved-prompt-v3.md`; Jonesy reviewed and approved Phase B (JB1-JB9); CC applied the changes directly to `CLAUDE.md`/`AGENTS.md` (see `cc-report.md`'s Phase B section for commands/hashes). Remaining next step: Jonesy's Phase B result review, then Ripley's whole-ticket final assessment (PASS/REVISE/BLOCKED) — only after that does the ticket close.


## Owner decision — 2026-10-24

Owner approved Ripley's presented recommendations: existing backend acknowledged with approved-scope/no-unsolicited-expansion/no-new-dependencies guard; git default no commit/push and no out-of-scope adjacent fix; concise approved Weather Voice/own-assessment/modal guidance; remove nonexistent current-route rows. Decisions1/2/5 resolved and route-table question settled for current documentation. Phase B draft is in prompt-review.md for Jonesy review, not executable yet. No data cleanup/new campsite issue authorized. Phase A N1–N4 touch-ups required before applying the regenerated proposal.

# Ticket #450 — CC report (research-only, approved-prompt-v1.md)

Executed from `docs/ai/tasks/ticket-450/approved-prompt-v1.md` (Ripley Round 1 + Jonesy conditions H1–H7). Research only: no application, test, config, scoring, threshold, model, or provider change was made. `CURRENT.md` moved `READY_FOR_CC → CC_IN_PROGRESS` before any work.

## Baseline

- HEAD at start: `abc61ff04fb8a15a5e2ddada671adfd084062f89`
- `git status --short` at start: `docs/ai/CURRENT.md` (pointer, modified) and `docs/ai/tasks/ticket-450/` (new, untracked — `prompt-review.md`/`approved-prompt-v1.md` already placed by Ripley) — nothing else pending, no conflicting active work found.
- `AGENTS.md`, `CLAUDE.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md` and the approved prompt were all read before starting (AGENTS.md in full this session; CLAUDE.md/README.md already established context from this same session's earlier tickets, re-confirmed against the fresh `CURRENT.md`).

## Methods

**Internal (repository) inventory** — direct `Read`/`Grep` of: `api/forecast.js`, `src/lib/forecastCache.js`, `vite.config.js`, `api/_lib/auroraDecision/openMeteo.js`, `src/lib/auroraScoring.js`, `api/_lib/aurora/fetchAurora.js`, `api/cron/refresh-aurora.js`, `src/lib/forecastNormalize.js`, `src/lib/scoring.js`, `src/hooks/useLeaderboardScores.js`, `src/components/CampsiteComparisonSection.jsx`, `api/admin.js`, `src/lib/weatherVoiceRules.js`/`weatherVoiceSupplement.js`, `scripts/` directory listing, `.env.example` (names only, per H2), `dist/sw.js` (already-built artifact present in this checkout from a prior session's `npm run build` — read-only, **not regenerated**, per H7/H1's "read-only inspection of already available generated artifacts" allowance). Repo-wide `grep` confirmed `src/lib/forecastCache.js` is the only caller of `/api/forecast`, and enumerated all 8 consumers of `getForecast`.

**GitHub context** — `gh issue view` (read-only) for #450 (full body, the actual meeting-excerpt bullet points), #437 (names the meeting source: "Expert Support fundur með Guðrúnu Nínu Petersen hjá Veðurstofu Íslands, 14. október 2026"), #429/#419/#170 (titles, #170's body, labels). `gh issue list --label vedurstofan-2026-10-14` to map the full cluster of related tickets from the same meeting (informational; not acted on). No comment, edit, or label change was made to any issue.

**External documentation** — `WebFetch`/`WebSearch` against: `open-meteo.com/en/docs`, `open-meteo.com/en/docs/dmi-api`, `dmi.dk/frie-data` and four of its linked sub-pages (HARMONIE DINI/IG product page, terms-of-use, authentication), `en.vedur.is/weather/articles/nr/3232` (Veðurstofa's own HARMONIE article). One search (`WebSearch`) was used to locate the DMI EDR collection names after two `opendatadocs.dmi.govcloud.dk` URLs 404'd for this session (noted as a limitation, not resolved by guessing).

**Bounded live samples (`curl`, Node built-ins only, no new dependency)** — all requests used an explicit public URL (never `customer-api.open-meteo.com`, never an API key), a descriptive `User-Agent: EltumVedridResearch/1.0 (ticket-450 research; contact: research-only)`, and were logged with UTC retrieval time:
1. Open-Meteo app-equivalent baseline: one bundled request, 4 comma-separated lat/lon points, same daily/hourly fields + units + `timezone=Atlantic/Reykjavik` as `forecastCache.js`.
2. Open-Meteo `models=dmi_seamless` experiment: one point, labelled an experiment per H3.1, kept separate from the baseline.
3. `api.vedur.is/weather/openapi.json` — catalog/docs request (not counted against the 2-data-request budget).
4. `api.vedur.is/weather/parameters?url=/observations/aws/hour` — catalog/docs request.
5. `api.vedur.is/weather/stations?station_id=1350` — data request 1 of 2 for this candidate product.
6. `api.vedur.is/weather/observations/aws/hour?station_id=1350&...` — data request 2 of 2 for this candidate product.

No account, registration, payment, or secret file was used or read. No request was retried after a 429 (none occurred). Full accounting in `samples/manifest.md`.

**Scripts**: no persistent `research-tools/` scripts were created — all external requests were one-off `curl`/`node -e` invocations (Node built-ins only: `fs`, `JSON`, no `dotenv`, no `process.env` reads). No dependency was installed.

## Secret-grep audit (H2)

```
grep -riEn "apikey|api_key|token|Authorization|Cookie|Bearer|[A-Za-z0-9+/]{40,}={0,2}" docs/ai/tasks/ticket-450/samples/*.json docs/ai/tasks/ticket-450/samples/*.txt
```
Narrowed re-check for the literal credential keywords only (excluding the long-base64-like heuristic, which produced expected false positives against the large `vedur-openapi.json` documentation prose):
```
grep -riEon "apikey|api_key|Authorization|Cookie|Bearer" docs/ai/tasks/ticket-450/samples/*.json docs/ai/tasks/ticket-450/samples/*.txt
```
**Result: zero matches.** A sample of the base64-heuristic hits in the first command's output was visually inspected and confirmed to be ordinary long description strings inside the public OpenAPI spec, not credentials.

## Existing tests run (read-only; not provider validation)

None were run. No targeted existing test was judged useful for this research-only, documentation/sample-gathering task (per the approved prompt: "No test is needed just to justify research"). `npm run test:run`/`lint`/`build` were **not** run — not required for a documentation-only deliverable with zero application file changes, consistent with H7 and the approved prompt's own instruction.

## Changed paths

```
M  docs/ai/CURRENT.md
?? docs/ai/tasks/ticket-450/   (provider-matrix.csv, research-report.md, source-register.md, cc-report.md, samples/)
```
`git diff --stat` confirms exactly one modified tracked file (`docs/ai/CURRENT.md`, the pointer). No `src/`, `api/`, `config/`, or test file was touched. No `dist/`, `coverage/`, `test-results/`, `.vercel/`, or `node_modules/` path was written to — `dist/sw.js` was only *read*, never regenerated (confirmed: no `npm run build` was run this session; the `dist/` directory present in this checkout predates this task, from an earlier session's work).

## Key findings (see `research-report.md` for the full narrative and decision memo)

1. **"IG" candidate identity**: DMI's own documentation (`dmi.dk/friedata/.../forecast-data-weather-model-harmonie-for-dini-and-ig`) names "IG" = "Iceland and Greenland", a 2km HARMONIE domain distinct from "DINI". Presented as a well-evidenced **hypothesis**, not a confirmed match to the meeting's exact meaning — the meeting excerpt itself (#450, #437) is an owner-supplied paraphrase, not a transcript, and one secondary (not independently re-fetched) source described IG differently.
2. **Open-Meteo's Iceland model**: confirmed (`open-meteo.com/en/docs`) that the app's default `best_match` selection uses DMI HARMONIE for "Northern Europe & Iceland" — i.e. the app's current forecast data for Iceland is DMI-sourced, not Veðurstofa-sourced. Whether the specific sub-domain is DINI or IG is **UNKNOWN**, confirmed by an actual live request (`models=dmi_seamless` does not suffix field names with the sub-model), not just by reading docs.
3. **Veðurstofa runs its own, separate HARMONIE** (2.5km, 4×/day, 66h) — distinct from DMI's IG/DINI (2km, hourly runs, 60-72h). Two different institutions, two different configurations, over an overlapping but not identical domain.
4. **A genuine, previously-undocumented unit-mismatch bug**, found as a direct consequence of H1.2's unit-audit instruction: `api/_lib/auroraDecision/openMeteo.js` never requests `windspeed_unit`, so it receives Open-Meteo's default **km/h**; `src/lib/auroraScoring.js`'s `HIGH_WIND_MS_THRESHOLD = 12` (labelled m/s) is then compared directly against those km/h values. Flagged as a research finding per the approved prompt's explicit instruction ("flag, not permission to fix") — **not corrected** in this round.
5. **A new, previously-unused Veðurstofa asset**: `api.vedur.is`, a modern, CC BY 4.0-licensed, key-free REST/OpenAPI observations API (stations, AWS/synop observations, precise per-field units and averaging windows) — found via H5's "check sibling products of the existing Veðurstofa XML service" instruction, not guessed. This is an **observations**, not forecast, source.
6. **Workbox's Open-Meteo caching rule is dead code**, confirmed against both source (`vite.config.js`) and the already-built `dist/sw.js`: the registered route matches the literal upstream URL, which the browser never requests directly (same-origin `/api/forecast` is requested instead; the server-side proxy rewrite is invisible to the service worker).
7. An internal (non-provider) inconsistency: `scoring.js` and `forecastNormalize.js` use two different WMO weathercode lists for "is this day snow" (the former includes codes 72/74/76, the latter's separate, non-scoring `precipType` list omits them).

## Evidence limitations

- DMI's HARMONIE IG/DINI live GRIB sample was **not** retrieved — the documented GRIB2 endpoint requires resolving a host/collection-path discrepancy between two secondary sources found via `WebSearch` (`opendataapi.dmi.dk` vs. an older `dmigw.govcloud.dk`+API-key account, and two `opendatadocs.dmi.govcloud.dk` URLs 404'd for this session); pursuing this was judged to exceed this round's bounded scope without first resolving that discrepancy. Documentation-level evidence (4 DMI pages, all successfully fetched and quoted) substitutes, graded accordingly in `provider-matrix.csv`.
- No GRIB/binary parsing was attempted — all retrieved samples are JSON.
- `athuganir.vedur.is` (the human-facing observations portal) returned no readable content to `WebFetch`; this is recorded as a tooling limitation (likely a JS-rendered SPA), not evidence that no API exists there — `api.vedur.is` (a very likely backend for it) was found and used instead.
- No measurement validation (comparing a forecast value against a matching real observation for the same time/place) was performed — every comparison in this report is contractual (units, resolution, domain), not an accuracy claim, per the approved prompt's explicit prohibition on inferring accuracy from provider disagreement alone.
- Commercial-tier licence terms for Open-Meteo's `customer-api` host were not independently re-fetched this round (NOT STARTED, recorded as such in `provider-matrix.csv`, not presented as a filled-in finding).
- Whether `OPEN_METEO_API_KEY` is actually set in the deployed environment is, and remains, **UNKNOWN from this repository** — not investigated, per H2's explicit boundary.

## Reproducibility

Every external claim in `research-report.md`/`provider-matrix.csv` is backed by either a cited, dated URL (`source-register.md`) or a retained sample file with its SHA256 (`samples/manifest.md`). The four internal-code findings (unit mismatch, dead Workbox rule, weathercode-list inconsistency, single-client-funnel/dev-vs-prod-proxy divergence) are each backed by exact `file:line` citations re-verifiable by re-reading the cited files, which are unchanged by this task.

## Boundaries confirmed held

No scoring, threshold, model, or provider-selection change. No `src/`/`api/`/`config/`/test edit. No dependency installed. No `.env*`/`.vercel/` file opened or globbed; environment variable names were taken only from `.env.example` and from source (`process.env.OPEN_METEO_API_KEY` reference in `api/forecast.js`), never from a real env file. No account, registration, or payment made with any provider. No commit, push, deploy, or GitHub/Project mutation. No process left running; no build regenerated.

## Lifecycle

`CURRENT.md` set to `CC_COMPLETE`, report path populated. Per the workflow: owner sends "CC búinn" to Jonesy next for result review, then Ripley's final assessment. Per the approved prompt: "All proposed next actions await separate owner approval" — nothing here authorizes any implementation, provider switch, or follow-up issue.

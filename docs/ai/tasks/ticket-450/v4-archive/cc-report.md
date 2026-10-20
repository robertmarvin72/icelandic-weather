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

## Lifecycle (v1)

`CURRENT.md` set to `CC_COMPLETE`, report path populated. Per the workflow: owner sends "CC búinn" to Jonesy next for result review, then Ripley's final assessment. Per the approved prompt: "All proposed next actions await separate owner approval" — nothing here authorizes any implementation, provider switch, or follow-up issue.

---

# v2 Correction Round — approved-prompt-v2.md

Executed from `docs/ai/tasks/ticket-450/approved-prompt-v2.md` (Ripley Round 2 + Jonesy conditions J1–J8), following Jonesy's v1 result-review (REVISE: R1–R7) and Ripley's v1 final assessment (REVISE, documentation-only). This round corrects five deliverables; **no new weather/observation/GRIB data was requested**, per the approved prompt's explicit boundary. Two new, separately-logged **catalog** requests were made (one Veðurstofa `/stations` catalog fetch, permitted by J4/J6; the rest of this round is pure recalculation/rewriting from already-retained evidence).

## Baseline

- HEAD at start of this round: `abc61ff04fb8a15a5e2ddada671adfd084062f89` (unchanged from v1 — no commit has occurred).
- `git status --short` at start: `docs/ai/CURRENT.md` (pointer) and the untracked `docs/ai/tasks/ticket-450/` tree (unchanged from the v1 end-state) — no conflicting work found.
- `AGENTS.md`/`CLAUDE.md`/`docs/ai/README.md`/`CURRENT.md` and `approved-prompt-v2.md` were (re-)read before this round began.

## J1 — v1 archive (done)

Before any edit, the five v1 deliverables were copied byte-identically into `v1-archive/`:

```
sha256sum research-report.md provider-matrix.csv source-register.md samples/manifest.md cc-report.md   (BEFORE, originals)
3dc93d3c59543566e310d39538d58ce7d80ae023faf63d206bbbe4cd943c8515  research-report.md
370459599bfc352818269d3cb02710353a56158c56879eabd0e57889bfc7b512  provider-matrix.csv
ba43c819d086d7f22899b12f0425e6ca0d34bdf565130b48aca9434809dc0beb  source-register.md
23bd40909f5791d5ac5303d84d02d8365e08c972785053907b4f3f8fa1cc119f  samples/manifest.md
3d029d0f77be7def0d7d969ba6d89a96b29de934e05cf12202f16632db7e2a6d  cc-report.md

sha256sum v1-archive/*   (AFTER copy — identical, confirmed)
3d029d0f77be7def0d7d969ba6d89a96b29de934e05cf12202f16632db7e2a6d  v1-archive/cc-report.md
23bd40909f5791d5ac5303d84d02d8365e08c972785053907b4f3f8fa1cc119f  v1-archive/manifest.md
3dc93d3c59543566e310d39538d58ce7d80ae023faf63d206bbbe4cd943c8515  v1-archive/research-report.md
ba43c819d086d7f22899b12f0425e6ca0d34bdf565130b48aca9434809dc0beb  v1-archive/source-register.md
370459599bfc352818269d3cb02710353a56158c56879eabd0e57889bfc7b512  v1-archive/provider-matrix.csv
```

The "v2-leiðréttingar" (R1–R7 → section) mapping table is in `research-report.md`'s own header, as required.

## J1/J8 — original 8 sample files: before/after hash table (unchanged, confirmed)

```
                                                                    BEFORE v2 edits          AFTER v2 edits (identical)
openmeteo-baseline-4point.json          035e26676f2d54a58...        035e26676f2d54a58...  (match)
openmeteo-dmi-seamless-experiment.json  234b7c9849f58d0fc...        234b7c9849f58d0fc...  (match)
vedur-obs-1350-20261018.json            82e372bceade5555f...        82e372bceade5555f...  (match)
vedur-openapi.json                      0359db043464be96e...        0359db043464be96e...  (match)
vedur-parameters-aws-hour.json          f1b0fd06228e372d5...        f1b0fd06228e372d5...  (match)
vedur-station-1350.json                 cd6b6548d2fb7c282...        cd6b6548d2fb7c282...  (match)
openmeteo-baseline-headers.txt          76089c4ec503d2a56...        76089c4ec503d2a56...  (match)
vedur-obs-headers.txt                   ffb72a84cf68f9d30...        ffb72a84cf68f9d30...  (match)
```
Full 64-char hashes are in `samples/manifest.md`. All eight files are **byte-identical** to v1; only the manifest's own metadata (URL/UTC columns) was added.

## New v2 evidence files (catalog request + local calculations)

| File | SHA256 |
|---|---|
| `samples/vedur-stations-all-v2.json` | `d8404ec4a7dc84ba57adf6a03674e4ca0417d8bb79a1cbd44586ab9faf7e27f4` |
| `samples/vedur-stations-all-v2-headers.txt` | `637bd254b163815a134c7330f6433902cf967518a624b1072084c4d9bfb834c7` |

`research-tools/compare-baseline-vs-dmi-seamless.mjs` + `.output.txt`, `research-tools/nearest-station-distance.mjs` + `.output.txt` — local calculation scripts and their saved output, not network samples (not hashed in the manifest; they are source-controlled research tooling, reproducible by re-running).

## R1–R7 disposition

- **R1 (memo grading) — done.** `research-report.md`'s decision memo rewritten: every outcome cites specific `provider-matrix.csv`/`source-register.md` cells; the Open-Meteo plan/key/commercial-use question moved to the top as an explicit owner question (incorporating the owner's direct confirmation that a paid subscription exists — OWNER-CONFIRMED, not independently verified — per the later owner clarification in `approved-prompt-v2.md`); direct-DMI and Veðurstofa-own-model rows changed from NO-GO to **PARTIAL** with attempted-vs-not-attempted evidence stated; the sole remaining NO-GO (measurement-validation row) is justified by an absence of measurement validation, not by a NOT STARTED/UNKNOWN cell. Grep verification:
  ```
  grep -rniE "NO-GO" research-report.md provider-matrix.csv source-register.md
  ```
  Result: 3 matches, all in `research-report.md` — one is the section heading reference ("GO/NO-GO"), one is the single justified NO-GO row with its corrected reasoning, one is the grep-confirmation sentence itself describing this very check. `provider-matrix.csv` and `source-register.md` contain zero "NO-GO" occurrences (they never carried memo-level verdict language). No old unqualified GO/NO-GO phrasing survives.
- **R2 (series comparison) — done.** Wrote and ran `research-tools/compare-baseline-vs-dmi-seamless.mjs` (Node built-ins only, reads only the two already-retained files, no new request). Result, independently reproduced (not copied from Jonesy's own numbers): point identity equal (lat/lon/elevation/units all match between the two retained files); `temperature_2m` 168/168 steps compared, 168 matching, 0 mismatching, 0 missing; `windspeed_10m` 168/168 steps compared, 168 matching, 0 mismatching, 0 missing. **⚠ SUPERSEDED (v3, K4) — segmentation figures below were computed by flooring the retrieval time to the nearest hour step and are wrong; see "v3 Correction Round" below for the corrected 18/72/78 figures and the method fix.** Segmented relative to the baseline's own retrieval hour (17:00 step, since the `Date` header read 17:47:22Z): 17 steps before, 72 steps from the first on/after-retrieval step, 79 steps remaining. The unsupported "ECMWF/GFS/ICON" sentence was removed from `research-report.md` §5; the new wording states the equality's precise, narrow scope (one point, two variables, one retrieval) and keeps DINI-vs-IG UNKNOWN.
- **R3 (observation contract) — done, with items honestly labelled where unresolved.** `research-report.md` §2 rewritten as a per-item status table: sensor height → NOT STARTED (confirmed via a full-text search of `vedur-openapi.json` for "height": only 4 occurrences, all unrelated EDR corridor/cube schema fields); timestamp zone → UNKNOWN (zero "UTC"/"GMT"/"timezone" occurrences in the spec, confirmed by search); the hour-24/day-17-vs-`time`-midnight-of-day-18 convention described exactly as observed, with an INFERRED interpretation and its reasoning; quality flags → none beyond `count_measurements` (confirmed: zero "quality flag"/"qc_flag"/"revision"/"revised" occurrences); `/observations/aws/{aggregation}/latest` contract → answered directly from the retained spec (most-recent-per-station, recency windows by aggregation); full field-by-field null count across the 24 retained observation rows (**⚠ SUPERSEDED, see "v3 Correction Round" below — these figures, 22/47 and 25/47, were wrong; corrected there**; `r` specifically 24/24 null with its meaning stated as UNKNOWN); station-to-point distance → Keflavík trivial (the point was itself defined by the station's own coordinates), the other three resolved via the one permitted new catalog request (see below) rather than left NOT STARTED. `provider-matrix.csv` row 37 downgraded from "VERIFIED SAMPLE" null-preserving-policy language to a precise counts-only claim with the policy question marked UNKNOWN.
- **R4 (point/elevation provenance) — done.** The "sea-level water cell" claim for the Ísafjörður point is withdrawn in both `research-report.md` §3 and `provider-matrix.csv` — re-graded as VERIFIED SAMPLE for the numeric value only, INFERRED for any water-cell explanation. Per-point coordinate offsets independently recomputed from the retained `openmeteo-baseline-4point.json` (not copied from Jonesy's figures, though consistent with them): Keflavík +0.0081/-0.0057°, Ísafjörður +0.0282/-0.0111°, Hveravellir +0.0069/+0.0039°, Egilsstaðir -0.0027/+0.0090° (requested-vs-returned lat/lon). The Hveravellir "≈641 m" figure, uncited in v1, is now **cited** — the new `/stations` catalog request (below) found a real Veðurstofa station literally named "Hveravellir" (IMO 6935) at elevation 641 m, independently confirming the figure. The Keflavík 50 m/50.9 m match is now described explicitly as "one coincidence," not cross-validation.
- **R5 (reproducibility) — done, better than expected.** Per J6, recovery is limited to this CC session's own retained commands/outputs. Because this session's own tool-call transcript retains the literal `curl` command text for all 8 original requests, **every original URL is EXACT** (verbatim, not reconstructed) — stronger than anticipated. Retrieval UTC is EXACT (response `Date` header) for the 2 requests where headers were captured (`openmeteo-baseline-4point.json`/`openmeteo-dmi-seamless-experiment.json`'s sibling baseline call, and `vedur-obs-1350-20261018.json`); RECONSTRUCTED (sequencing-based, reasoning and confidence stated) for the 4 requests where no header dump was taken. Full table in `samples/manifest.md`. No shell-history sweep, no environment inspection, no credential file, no unrelated chat log was used — only this session's own retained transcript and the retained sample files themselves.
- **R6 (DMI catalog metadata) — not done, accepted as non-blocking.** Per J7, DMI collection/domain metadata is listed as the first item of the next-step proposal rather than attempted here (optional; this correction round's boundary is documentation-only — it does not require new provider sampling). **(N1 fix, v3: removed stray garbled "J1's note10" reference — no such note exists in any retained review file; this disposition rests on J7 alone.)**
- **R7 (aurora wording) — done.** **⚠ SUPERSEDED (v4, W1/L2b) — the "Mikilvægur hliðarfundur" box named below never existed in this sentence's own research-report.md; this is now corrected, not deleted, per L2(b)'s instruction to mark rather than silently rewrite.** `research-report.md` (both the memo's "Mikilvægur hliðarfundur" box and §1) now states explicitly: the finding affects the `high_wind` **flag** only (citing `auroraScoring.js:70,334-336`'s own comment that the numeric score is unchanged); "~12 km/klst" wording used instead of asserting 12 m/s as a validated safety boundary; frequency of firing and downstream display impact are stated as **not measured**, and the earlier "fires almost always" phrasing is explicitly withdrawn as an estimate, not evidence. **Corrected location (v4):** the real, sole location of this wording is `research-report.md` §1 (last sentence of that section's paragraph, beginning "Leiðrétt orðalag (R7)") — there never was a separate "Mikilvægur hliðarfundur" memo box in any version of the report this sentence could have correctly described; see the corrected R7 row in that document's own v2-mapping table for the exact quoted sentence and line number.

## J4/J6 — the one new catalog request

```
curl -s -A "EltumVedridResearch/1.0 (ticket-450 v2 research; contact: research-only)" \
  "https://api.vedur.is/weather/stations" --max-time 20 \
  -o samples/vedur-stations-all-v2.json -w "HTTP %{http_code}, bytes: %{size_download}\n" \
  -D samples/vedur-stations-all-v2-headers.txt
```
Result: `HTTP 200, bytes: 152165`; `Date: Mon, 19 Oct 2026 18:10:46 GMT`. Public host, no key, logged exactly, one request, no retry (no 429 encountered). This is the only network request made in the v2 round; everything else is recalculation from already-retained files.

## Secret-grep audit (v2, J8)

```
grep -riEon "apikey|api_key|Authorization|Cookie|Bearer" research-report.md provider-matrix.csv source-register.md samples/manifest.md samples/vedur-stations-all-v2.json samples/vedur-stations-all-v2-headers.txt research-tools/*.mjs research-tools/*.output.txt cc-report.md
```
Result: all hits are benign — the literal substring `API_KEY` occurring only as part of the variable *name* `OPEN_METEO_API_KEY` (discussed as unset/unknown, never a value), and the keywords `apikey`/`api_key`/`Authorization`/`Cookie`/`Bearer` appearing only where this very audit command or its description is quoted in the deliverables themselves (self-referential, not a credential). A broader long-base64-like-string heuristic (`[A-Za-z0-9+/]{40,}={0,2}`) against the new `vedur-stations-all-v2.json` returned **zero** matches (unlike v1's `vedur-openapi.json`, which had benign documentation-prose false positives, already explained in the v1 report). **Zero actual secrets found.**

## J8 — CSV parse / cross-reference checks

- `provider-matrix.csv` parsed with a hand-written RFC4180-style quoted-field CSV parser (Node, built-in only, no library): **6 header columns, 46 data rows, 0 rows with a mismatched column count** (the first pass found 8 malformed rows from unquoted commas inside bracketed `[v2, ...]` annotations and one unquoted multi-comma Grade cell; both classes of error were fixed — brackets now use `-` instead of `,`, and the two affected Grade cells are quoted — then re-parsed clean).
- Every source ID referenced in `research-report.md`/`provider-matrix.csv` was cross-checked against `source-register.md` with a small Node script (regex-extracted defined IDs vs. referenced IDs, built-ins only, not retained as a file): defined = `D1-D5, E1-E4, OA1, S1-S18, V1-V8`; referenced = `D1-D5, E1-E4, S1-S9, S14-S15, V1-V6`; **missing: none**. (OA1, S10-S13, S16-S18, V7-V8 are defined but not literally referenced by ID in report/matrix prose — they are covered narratively instead, e.g. the owner attestation and GitHub-issue sources; this is not an error, just prose vs. ID-citation style.)

## Deviations from the approved prompt (stated explicitly, not "none")

1. The original plan was to mark all four non-Keflavík-request URLs/times as fully UNKNOWN if not recoverable; in practice this session's own retained transcript made the **URLs** recoverable as EXACT for all 8 files (stronger evidence than J6 anticipated) while **UTC** remained RECONSTRUCTED for 4 of them (weaker than "EXACT" would be) — both directions are reported precisely rather than rounding to a single convenient label.
2. R6 (DMI catalog metadata) remains genuinely not attempted, as Jonesy's own note accepted — listed here for completeness, not silently.

## Updated scope audit (v2)

`git status --short` at the end of this round: `docs/ai/CURRENT.md` (pointer) and the untracked `docs/ai/tasks/ticket-450/` tree only — identical in kind to the v1 end-state, HEAD unchanged (`abc61ff0...`). No `src/`, `api/`, `config/`, `dist/`, `coverage/`, `test-results/`, `.vercel/`, or `node_modules/` path was touched. No test/lint/build was run (not required for a documentation-only correction, per the approved prompt). No account, registration, payment, `.env*`, or `.vercel/` access occurred in this round.

## Lifecycle (v2)

No commit, push, deployment, production mutation, or GitHub issue/comment/closure/Project change was performed. `CURRENT.md` set to `CC_COMPLETE`. Per the workflow: owner sends "CC búinn" to Jonesy next for the narrow result re-check, then Ripley's final assessment. This round's PARTIAL-graded conclusions (direct DMI, Veðurstofa's own model) are transparently incomplete, not hidden — per the approved prompt, "a transparent PARTIAL research outcome can pass delivery review."

---

## v3 Correction Round

Executed against `approved-prompt-v3.md` (Jonesy's v2 narrow re-check findings V1–V3/N1, plus Ripley's own K3/K4 cross-checks). Scope: documentation-only corrections to already-written v2 deliverables; **no new network request of any kind**; no sample body/header edited; no `result-review.md`/`prompt-history` rewrite; no test/lint/build run.

### K1 — archive v2 before editing

`mkdir -p v2-archive/research-tools` then byte-for-byte copy of `research-report.md`, `provider-matrix.csv`, `source-register.md`, `samples/manifest.md` (as `v2-archive/manifest.md`), `cc-report.md`, and all `research-tools/*.mjs`/`*.output.txt` files, **before** any v3 edit. SHA256 before/after each copy:

```
98bb1e267c48b009e2d73dd1bfef1e698288ce361be80578455c626dc10006c2  research-report.md
6b973c8ecd2c22a171710687c5ca25184b70d4d0543168f4421c8df4a1a00ad4  provider-matrix.csv
24877c0ee93f2c3ae2844a8754c4b42c44e66993f98a968fe676b59e06bd55bf  source-register.md
1a2a7c868dfbd177481137394527bd77bcf77913da4da4a5ca7e26e9a0600a49  manifest.md
dc697d89114d6a52d6ee0b3fe3087c43d2fe34a9351473fa353e5a6fa10c64ad  cc-report.md
17cd15cbb804b2b4b839bbabd23588e345b7b3433519296615e4748cc7df5ccc  research-tools/compare-baseline-vs-dmi-seamless.mjs
a6b1c300f43223bcb424d60299bedf3d957b4509ffe0ebf010929eac74191d52  research-tools/nearest-station-distance.mjs
e86be786371c265555114d9eb2aeccf7a349036ee7b462e7106f4d788a4aad49  research-tools/compare-baseline-vs-dmi-seamless.output.txt
3dee638b110710aebd251caa10d9faccb4b94f145049892e9bda79c05c258b79  research-tools/nearest-station-distance.output.txt
```

Re-verified identical at the **end** of this round (re-run just now, see "Final hash re-verification" below) — confirming nothing in `v2-archive/` was touched while correcting the live files. Done.

### V1 — wrong null-count figures in §2 (22/25 instead of 20/27 of 47)

Wrote `research-tools/observation-field-table.mjs` (Node built-ins only; reads only the already-retained `vedur-obs-1350-20261018.json` and `vedur-parameters-aws-hour.json`, zero new requests) to independently recompute the per-key null/non-null/missing counts across all 24 retained rows and all 50 keys, rather than trust Jonesy's or Ripley's own arithmetic. Ran it; confirmed from scratch: 24 rows, identical key set across all rows, 50 keys/row. **All-non-null (23 keys):** `station, name, time, year, month, day, hour, t, tx, tn, rh, vp, td, f, fx, fg, fgfx, d, d_txt, dsdev, ps, p, count_measurements`. **All-null (27 keys):** `r, tg, tgn, t0, t0x, t0n, tug5, tug10, tug15, tug20, tug50, tug100, radgl, radglx, radsc, radscx, radsws, radswsx, radlwi, radlwix, radlws, radlwsx, raduv, raduvx, rsun, ts, sal`. Zero partially-null keys. Two denominators reported explicitly: **(A)** 23+27=50/50 of all keys including the three identifiers; **(B)** 20+27=47/47 of the 47 data fields excluding `station`/`name`/`time`. Both match Jonesy's and Ripley's independently-stated figures. Corrected with a visible **"⚠ SUPERSEDED (v3, K2)"** marker (not a silent rewrite) at all four locations that carried the wrong figure: `research-report.md` §2, `provider-matrix.csv` row 37, `source-register.md` V5, and `cc-report.md`'s R3 disposition line (above). Grep-confirmed the old wrong figure ("22/47", "25/47", "22 af", "25 breytur") now appears **only** inside a SUPERSEDED marker or in `v2-archive/`, never presented as current fact:
```
grep -rn "22/47\|25/47\|22 af 47\|25 breytur" research-report.md provider-matrix.csv source-register.md cc-report.md
```
Result: all remaining hits are inside the four SUPERSEDED markers themselves (quoting the old wrong number for correction purposes) — none present the old figure as current. Done.

### V2 — missing "next step" section despite being referenced

v2's `cc-report.md` (R6 disposition) and `research-report.md`'s own mapping table referenced a "next-step proposal"/"memo box" that did not exist in the v2 report body (dropped during a v1→v2 restructure and never replaced). Added a new `## 8. Næsta skref` section to `research-report.md` (before the old `#429`/`#419` impact section, which is renumbered `## 9.` — content of that section is otherwise unchanged from v1) with three ordered, explicitly-not-authorized next steps: (1) DMI catalog/domain metadata — **read-only**, not fetched this round; (2) a conditional GRIB sample, gated on step 1 and requiring its own separate approval; (3) a properly designed observation comparison, whose first sub-step is establishing which parameters nearby stations actually deliver (not just proximity) — citing the new precipitation-station-distance findings (N1, below). Ran the required reference-check afterward (K5.1): grepped every `§N`/"sjá kafla"/"næsta skref" citation across all four files and manually compared each to the actual heading list of `research-report.md` (now `## 1.`–`## 9.` plus the sub-heading inside §8). Result: every citation resolves to an existing heading; zero broken references found (full grep output is reproduced inline in `research-report.md`'s own §8 closing paragraph). Done. **⚠ SUPERSEDED (v4, W1/W4/L2c) — this "zero broken references found" claim was FALSE and is withdrawn, not silently fixed.** The v3 check above used exactly one grep pattern (`§[0-9]|sjá kafla|næsta skref`), which never matched named, non-`§N` references such as the "Mikilvægur hliðarfundur" memo-box citation (a reference to a section that did not exist in the document at the time) — so the check's own narrow pattern could not have found that defect, and "zero broken references" overstated what a narrower grep actually covers. There was, in fact, at least one broken reference the v3 check did not catch. The "reproduced inline in research-report.md's own §8 closing paragraph" pointer is also withdrawn: that inline text was itself the same narrow, now-superseded grep result, not an independent verification. The real, broadened, re-read inventory (built per L2(e) by reading the documents, not from one fixed grep) now lives in exactly one place, [`reference-check.md`](./reference-check.md); see the "v4 Correction Round" section below for its disposition. `research-report.md`'s own §8 closing paragraph has been corrected to point to that same single file rather than repeating the false claim.

### V3 — GO-rated memo rows read stronger than their evidence

Row 1 (Open-Meteo) was rated GO with "already correctly implemented," which the report's own F1 (aurora km/h-vs-m/s bug)/F2 (weathercode-list mismatch)/F3 (dead Workbox rule) findings contradict. Row 4 (`api.vedur.is`) was rated GO for a "scoped trial" despite the only sampled station having 100%-null precipitation and no check that nearby stations deliver precipitation data at all. Downgraded row 1 to **OWNER ACTION / PARTIAL** (narrowed to three owner-only questions: plan/tier, contract terms, per-path access match — explicitly an owner action, not a CC-executable research step) and row 4 to **PARTIAL** (first step: establish which parameters nearest stations actually deliver, precipitation specifically, before any trial comparison is designed). Both changes are in `research-report.md`'s decision-memo table; the "Grep-staðfesting" sentence below the table was updated to state there are now zero unqualified GO rows. Done.

### N1 — wording slips

- **"Two new catalog requests" → "one request, two files":** there was exactly one `GET /weather/stations` HTTP call, which produced two artifacts (a JSON body and a headers text file). Fixed in `research-report.md`'s v3 header paragraph and in the §2 station-distance row. Grepped `samples/manifest.md` and `cc-report.md` for the same error pattern — both already used "catalog request" (singular) or "catalog files" (correctly describing the two output files, not two requests); no further fix needed there.
- **"Returned grid elevation" wording:** replaced in `provider-matrix.csv` rows 9–10 (Keflavík/Ísafjörður) with "response elevation under Open-Meteo's documented 90m-DEM handling, not necessarily grid-cell elevation" — matching the more careful wording already used in `research-report.md` §3.
- **Undefined station-type codes:** added `sj`/`sk`/`ur`/`vf` definitions, sourced and cited directly from the retained `vedur-openapi.json`'s own `/stations` endpoint `station_type` parameter description (not assumed from Ripley's prompt text) — added as a new row in `research-report.md` §2 and inline in `research-tools/nearest-station-distance.mjs`'s own log output.
- **Stray "J1's note10" phrase in `cc-report.md`'s R6 disposition:** this referenced a note that does not exist in any retained review file. Removed the garbled reference; the disposition now rests on J7 alone (see the corrected line above, in the R1–R7 section).

Done, all four items.

### Ripley K3 — "same underlying product" overclaim

v2 stated the equal 168/168 baseline-vs-`dmi_seamless` series "resolved to the same underlying product" — an identity claim the data does not support (equal values at one point, for two variables, in one retrieval proves *equality*, not *identity*). Scrubbed "same underlying product/afurð", "resolved to", and "equivalence" wording everywhere it appeared — `research-report.md` §1 and §5, `provider-matrix.csv` row 3, `source-register.md` E4 — and replaced with the precise required grade label `VERIFIED SAMPLE (equal series at this point/two variables/two responses)`. Model/product identity of the default (`best_match`) remains explicitly **UNKNOWN**. Also added: the `dmi_seamless` experiment's own retrieval time is itself only **RECONSTRUCTED** (sequencing-based, not a captured header for that specific request), so not even "same model run" is established — this caveat is now stated alongside the grade label in both §1 and §5. Done.

### Ripley K4 — floored-hour vs. actual-timestamp segmentation

v2's `compare-baseline-vs-dmi-seamless.mjs` floored the retrieval time (`Date: Mon, 19 Oct 2026 17:47:22 GMT`) down to the "17:00" hourly step string and treated that step as "on/after retrieval" — but 17:00 precedes 17:47:22, so that step belongs in the "before" segment. This produced the wrong 17/72/79 split. Rewrote the segmentation block to construct real `Date` objects for both the retrieval instant and every hourly step, then use `findIndex` to find the true first step at/after the retrieval instant. Re-ran the script (old script + output preserved byte-identically in `v2-archive/research-tools/`, confirmed in the K1 hash table above): confirmed the underlying equality counts are completely unchanged (`temperature_2m` and `windspeed_10m` both still 168/168/0/0), while the segmentation is now correctly **18 steps before** (2026-10-19T00:00–17:00) / **72 steps from the first step at/after retrieval** (2026-10-19T18:00–2026-10-22T17:00) / **78 steps remaining** (2026-10-22T18:00–2026-10-25T23:00) — matching Ripley's expected 18/72/78 exactly. Explicitly documented in `research-report.md` §5 as a **method correction on the same retained data, not new evidence**, and explicitly stated that the 72-step window is counted from the retrieval instant, never described as "0–72h of the forecast" (the forecast model run time itself remains UNKNOWN). The old v2 figures in `cc-report.md`'s R2 disposition line (above) were given a visible "⚠ SUPERSEDED (v3, K4)" marker rather than silently rewritten. Done.

### Final hash re-verification (end of v3 round)

Re-ran `sha256sum` on all 10 `samples/*.json`/`*.txt` files and all `v2-archive/*` files at the end of this round, after all v3 text edits were complete:

- All 10 sample files: identical to the hashes recorded in the K1/v2 table and in `samples/manifest.md` — **zero sample files edited in v3** (only `research-report.md`, `provider-matrix.csv`, `source-register.md`, `cc-report.md`, and the two `research-tools/*.mjs` calculation scripts + their `.output.txt` were touched).
- All 5 `v2-archive/` top-level files and all 4 `v2-archive/research-tools/*` files: identical to the K1 before-copy hashes — confirming the archive was never touched after creation.

### CSV re-parse (end of v3)

Re-ran the same hand-written RFC4180-style Node CSV parser (built-ins only) against `provider-matrix.csv` after all v3 edits: **6 header columns, 46 data rows, 0 malformed rows.** No new comma-in-bracket issue was introduced by the v3 edits (rows 3, 9, 10, 37 — the ones touched this round — all parse cleanly with their existing quoting).

### Source-ID cross-reference (end of v3)

Re-ran the small Node regex-based ID cross-check (defined IDs in `source-register.md` vs. every `S`/`E`/`D`/`V`-prefixed ID literally cited in `research-report.md`, `provider-matrix.csv`, `cc-report.md`): defined = `D1-D5, E1-E4, OA1, S1-S18, V1-V8`; cited = `D1-D5, E1-E4, S1-S10, S13-S16, S18, V1-V8`; **missing: none**. Every citation resolves to a real `source-register.md` entry.

### Secret-grep audit (end of v3)

Re-ran the full audit (`apikey|api_key|Authorization|Cookie|Bearer|token` plus the `[A-Za-z0-9+/]{40,}={0,2}` long-base64-like heuristic) against every file touched in v3 (`research-report.md`, `provider-matrix.csv`, `source-register.md`, `cc-report.md`, `research-tools/*.mjs`, `research-tools/*.output.txt`). All hits are benign: the literal `OPEN_METEO_API_KEY` **variable name** (never a value, always discussed as unset/unknown); the keywords appearing only inside this very audit's own command text/description, quoted self-referentially; git commit hashes and SHA256 digests (40+ hex chars, matched by the base64-like heuristic but are plainly-labelled hashes/commit IDs, not secrets) in `cc-report.md`'s hash tables; a documentation URL fragment containing the word "authentication" (`dmi.dk/.../authentication`, a DMI docs page name, not a credential). **Zero actual secrets found.**

### Scope audit (end of v3)

```
git status --porcelain=v1
```
Result: ` M docs/ai/CURRENT.md` and `?? docs/ai/tasks/ticket-450/` only — identical in kind to the v1/v2 end-states. `git rev-parse HEAD` = `abc61ff04fb8a15a5e2ddada671adfd084062f89`, unchanged throughout all three rounds. No `src/`, `api/`, `config/`, `dist/`, `coverage/`, `test-results/`, `.vercel/`, or `node_modules/` path was touched. No test/lint/build run (not required for a documentation-only correction, per the approved prompt). No `.env*`/`.vercel/` file opened or globbed at any point in v3. No account, registration, or payment made. No commit, push, deploy, or GitHub/Project mutation.

### Remaining limitations (stated explicitly)

- R6/step 1 of the new §8 (DMI catalog/domain metadata) is still genuinely **not attempted** — accepted as non-blocking per Jonesy's own J7/V2 guidance, listed as the first future step rather than silently dropped.
- No external quotation (e.g. the Oct 14 Veðurstofa meeting notes, DMI's own documentation prose) was retained verbatim beyond what was already captured in v1/v2 — nothing new retained in v3.
- All `Date` response headers reflect **server** response time, not an independently-logged client retrieval clock; this remains true for every RECONSTRUCTED time in `samples/manifest.md`, unchanged from v2.
- The `dmi_seamless` experiment's own retrieval time is itself only RECONSTRUCTED (K3 finding, this round) — "same model run" as the baseline request is not established, only "equal series."
- The owner's OWNER-CONFIRMED statement that a paid Open-Meteo subscription exists is not independently verified against any billing/account record (H2 boundary: no `.env*`/`.vercel/` access).
- The observation null-count/field-table finding (V1) rests on **one day, one station** — not a general provider policy, as the table's own closing line states.
- The new per-station-type distance finding (N1) is a straight-line (haversine) heuristic among `ending:null` catalog entries only — it does **not** verify that any given station actually transmits the parameter its type code implies; this is exactly the open question §8's step 3 identifies as needing to be resolved before any trial comparison.

### Deviations from the approved prompt (stated explicitly, not "none")

1. K5.3 optionally allowed adding "nearest active station of each type (sj/sk/ur) per point" — this was done for all four points and all three types (not skipped), going slightly beyond the strict minimum of K5.3 because the resulting precipitation-station distances directly substantiate the K5.2 memo-row-4 rewrite; flagged here as an addition, not a silent scope expansion.
2. Jonesy's K5.1 asked for a next-step section "DMI catalog/domain metadata first... then conditional GRIB sample... then a designed observation comparison" without specifying exact wording for how non-authorization should be stated; this CC round chose to state non-authorization once, prominently, at the top of §8, rather than repeating a disclaimer after each of the three numbered items — a formatting choice, not a scope change.

## Lifecycle (v3)

No commit, push, deployment, production mutation, or GitHub issue/comment/closure/Project change was performed at any point in this round. `docs/ai/CURRENT.md` updated: handoff-log entry appended, `Stage` set to `CC_COMPLETE`. Per the workflow, the owner sends "CC búinn" to Jonesy next for the v3 narrow result re-check, then (if needed) a further Ripley final assessment — neither of those two steps is performed by CC.

---

## v4 Correction Round

Executed against `approved-prompt-v4.md` (Jonesy's v3 narrow re-check findings W1–W4, Round 4, and binding conditions L1–L7). Scope: W1–W4 only — reference/wording corrections, one extended-but-still-read-only comparison script, removal of an unsupported inference, and one saved reference-check record. **No new network request of any kind, no sample edited, no test/lint/build run, no new finding beyond W1–W4.**

### L6 — before/after checklist (offending text quoted verbatim)

| # | Issue | Offending text (file:line, BEFORE this round) | Corrected location (AFTER) | Evidence it is fixed |
|---|---|---|---|---|
| 1 | W1/L2(a) — R7 row pointed at a non-existent "Mikilvægur hliðarfundur" memo box | `research-report.md:15` (pre-v4): `"R7 — orðalag um norðurljósa-villu \| Minnisblaðskaflinn „Mikilvægur hliðarfundur" hér að ofan og í §1 \| Lagfært \|"` | `research-report.md:15` now names only the real location, `§1, lína 62`, and quotes that sentence verbatim in full | `grep -n "Mikilvægur hliðarfundur" research-report.md` → only hits left are the one at line 15 explaining the box never existed, and the general W1 mapping-row/§8 text explaining the same; no row claims the box as a real, current location any more (see "final focused grep results" below) |
| 2 | W1/L2(b) — `cc-report.md`'s own R7 disposition line repeated the same false box reference, uncorrected | `cc-report.md:155` (pre-v4): `"- **R7 (aurora wording) — done.** \`research-report.md\` (both the memo's "Mikilvægur hliðarfundur" box and §1) now states..."` (no marker) | `cc-report.md:155` now opens with `"**⚠ SUPERSEDED (v4, W1/L2b) — the "Mikilvægur hliðarfundur" box named below never existed..."`, historical sentence preserved per L2(b)'s "mark, don't delete" instruction | Re-read of `cc-report.md:155` (above) shows the marker; original sentence still present afterward, not deleted |
| 3 | W1/L2(c) — false "zero broken references" claim, two locations | `research-report.md:153` (pre-v4, now shifted): `"...öll tilvitnuð „§N"/„næsta skref"-tilvísanir í öllum fjórum skrám reyndust vísa á fyrirsögn sem er til staðar eftir þessa breytingu — engin brotin tilvísun fannst."`; `cc-report.md:226` (pre-v4): `"...zero broken references found (full grep output is reproduced inline in research-report.md's own §8 closing paragraph). Done."` | `research-report.md:175` now opens "⚠ Tilvísanaprófun — v3-fullyrðingin hér var FÖLSK, dregin til baka..."; `cc-report.md:226` now has a SUPERSEDED marker appended after "Done." withdrawing both the claim and the "reproduced inline" pointer, redirecting to `reference-check.md` | `grep -n "zero broken\|engin brotin" research-report.md cc-report.md` (see final focused grep results below) — every hit is inside a withdrawal/marker, none asserts the claim live |
| 4 | W1/L2(d) — ambiguous "sjá §1/S8" slash notation | `research-report.md:73` (pre-v4, now line 87): `"...nákvæmlega sú tegund dagmarkavillu sem núverandi app forðast með því að nota \`time\`-strengi beint (sjá §1/S8) \|"` | `research-report.md:87` now reads `"(leiðrétt tilvísun, v4/W1/L2d: sjá §1 hér í þessu skjali... og heimild S8 í source-register.md...)"` — two separate, named references | `grep -n "sjá §1/S8"` returns zero hits in the current file (only the historical mention inside the W1 mapping-row description of what was wrong, and inside this very checklist) |
| 5 | W2/L3 — comparison script gave only global 168/168/0/0 totals, no per-segment/per-variable breakdown; segment counts were inferred, not computed | `research-tools/compare-baseline-vs-dmi-seamless.mjs` (v3 version, archived) had no per-segment loop; `.output.txt` had no six-row breakdown | Script extended with a `segments`/per-variable loop (6 rows: 2 variables × 3 segments) plus a self-check against the global totals; `.mjs` converted to stdout-only (no internal `writeFileSync`) per L3's execution clarification; output regenerated via shell redirection | Re-ran: `node research-tools/compare-baseline-vs-dmi-seamless.mjs > research-tools/compare-baseline-vs-dmi-seamless.output.txt`; output shows all six rows (18/18, 72/72, 78/78 compared/matching, 0 mismatches each) plus `self-check PASS: true` for both variables — reproduced below under W2 |
| 6 | W3/L4 — unconfirmed single-cause "sensor absent" inference presented as the likely explanation for all-null `r` and sibling fields | `research-report.md` §2 null-count row (pre-v4): `"...gefa til kynna (INFERRED, ekki staðfest) að stöðin einfaldlega vanti þessa skynjara..."`; `provider-matrix.csv` row 37 Grade column (pre-v4): `"...VERIFIED SAMPLE (counts, both denominators) / UNKNOWN (general policy; r-null meaning) / INFERRED (sensor-absence explanation)"` | `research-report.md:92` now lists four unfavoured candidate causes, cause stated as UNKNOWN, no INFERRED term; `provider-matrix.csv:37` Grade column now reads `"...UNKNOWN (general policy; r-null meaning; cause of all-null pattern -- several unfavoured candidate causes listed, no INFERRED term used)"` | `grep -n "vanti þessa skynjara\|INFERRED (sensor-absence" research-report.md provider-matrix.csv` → the only hits are inside the withdrawal text explaining what was removed, never a live claim (see final focused grep results below); `observation-field-table.mjs`/`.output.txt` hash-confirmed byte-identical to the v3-archive copy (unchanged, per L4) |
| 7 | W4/L5 — reference-check result saved nowhere; `research-report.md` and `cc-report.md` pointed only at each other (circular) for "full output" | No file existed; `research-report.md`'s v3 §8 closing paragraph said "sjá fullt úttak... í `cc-report.md`, v3-kafla" while `cc-report.md`'s v3 R2/V2 text said "reproduced inline in `research-report.md`'s own §8" | New file `reference-check.md` created, containing method, per-file SHA256 at check time, the full `file:line \| reference text \| target \| resolves? \| class` table, unresolved count, and the six focused greps; `research-report.md:175` and `cc-report.md:226` both now point to `reference-check.md` only, which points to neither of them for its own result | `reference-check.md` exists (see below); both pointers verified to resolve (file exists, heading exists) — see "pointer verification" in that file |

### W1 (references) — disposition

All five sub-items (a)–(e) above are **done** (see L6 table rows 1–4, plus the broader inventory below). L2(e)'s instruction to build the inventory by reading the documents (not from one fixed grep pattern) was followed: `research-report.md`, `provider-matrix.csv`, `source-register.md`, and `cc-report.md` were each read in full (not sampled), and every `§N`, named-section ("memo"/"minnisblað(s)"/"box"/"next-step"/"Næsta skref"/"Grep-staðfesting"), "sjá …"/"hér að ofan/neðan"/"above/below", and backticked-file-plus-section citation was logged into `reference-check.md`'s table. Three further stale references were found during this read (beyond Jonesy's four named instances) and fixed under this same W1/L2(e) umbrella rather than left for a future round:

- `research-report.md`'s Viðaukar (appendix) bullet said "tvær nýjar...skriftur" (two new scripts) when a third (`observation-field-table.mjs`, added in v3) already existed — corrected to "þrjár" (three) and all three named explicitly.
- The adjacent appendix bullet for `cc-report.md` said "v2-kafli með R1–R7 ráðstöfun" (singular v2 section) when v3 and now v4 sections also exist — corrected to name all three.
- `research-report.md` §3's elevation paragraph had a garbled `"§-E1"` citation (conflating a section mark with a source-register ID) — corrected to cite `E1` as a source (not a section) plus the matching `provider-matrix.csv` row.
- `source-register.md`'s V7/V8 entries said "new this round" without naming which round, which reads ambiguously from a later round; V7 clarified as "added in the v2 round"; V8 corrected to list all three scripts (it previously omitted `observation-field-table.mjs`) and to note the v4/W2 extension of the comparison script.
- A numbering-convention mismatch was found and resolved: Jonesy's own L4 text calls the missing-data CSV row "row 36" (data-row count excluding the header), while every other reference in this project's own documents calls the identical physical row "row 37" (file-line count including the header) — same row, two conventions. `research-report.md`'s v4 mapping table now states this explicitly and standardizes on the file-line convention used everywhere else, rather than silently picking one without explanation.

### W2 (segment counts) — disposition, with full regenerated output

`research-tools/compare-baseline-vs-dmi-seamless.mjs` was inspected before running (confirmed: two `readFileSync` calls against already-retained sample files only, zero `writeFileSync`, zero network calls — the internal file-write from v2/v3 was removed per L3's execution clarification). Extended to compute, for `temperature_2m` and `windspeed_10m`, compared/matching/mismatching/missing-in-baseline/missing-in-experiment **per segment** (A=18 steps, B=72 steps, C=78 steps, as already established in v3/K4), with the experiment side looked up **by time string**, never by re-slicing the experiment array by index (L3's explicit requirement — a segment boundary on the baseline side cannot silently misalign with the experiment side this way). A self-check sums the three segments and compares the sum against the pre-existing global 168/168/0/0 totals for each variable.

Ran via `node research-tools/compare-baseline-vs-dmi-seamless.mjs > research-tools/compare-baseline-vs-dmi-seamless.output.txt` (stdout redirected to the task-local output file by the shell, never written by the script itself). Full new output, all six rows:

```
temperature_2m / segment A (strictly before retrieval instant): compared=18 matching=18 mismatching=0 missingInBaseline=0 missingInExperiment=0
temperature_2m / segment B (72 steps from first on/after retrieval instant): compared=72 matching=72 mismatching=0 missingInBaseline=0 missingInExperiment=0
temperature_2m / segment C (remaining): compared=78 matching=78 mismatching=0 missingInBaseline=0 missingInExperiment=0
windspeed_10m / segment A (strictly before retrieval instant): compared=18 matching=18 mismatching=0 missingInBaseline=0 missingInExperiment=0
windspeed_10m / segment B (72 steps from first on/after retrieval instant): compared=72 matching=72 mismatching=0 missingInBaseline=0 missingInExperiment=0
windspeed_10m / segment C (remaining): compared=78 matching=78 mismatching=0 missingInBaseline=0 missingInExperiment=0

temperature_2m: segment sums = {"compared":168,"matching":168,"mismatching":0,"missingInExperiment":0}; global = {"compared":168,"matching":168,"mismatching":0,"missingInExperiment":0}; self-check PASS: true
windspeed_10m: segment sums = {"compared":168,"matching":168,"mismatching":0,"missingInExperiment":0}; global = {"compared":168,"matching":168,"mismatching":0,"missingInExperiment":0}; self-check PASS: true
```

The expected values (18/18, 72/72, 78/78, 0 mismatches) given in L3 matched exactly — reported here as a cross-check result that happened to confirm the expectation, not as a target the script was built to hit; had any segment shown a mismatch or a non-zero missing count, it would be reported and diagnosed without touching the sample files (none were touched — the global 168/168/0/0 totals and point/unit identity checks are byte-for-byte unchanged from v3). `research-report.md` §5 now shows all six rows in a table plus the self-check result. `Date` remains documented as server response time only; retrieval clock and forecast model run time remain unknown, unchanged from v3/K4.

### W3 (sensor-absence inference) — disposition

The single-cause "the station simply lacks this sensor" inference was removed from `research-report.md` §2's null-count row and from `provider-matrix.csv` row 37's Grade column (the literal `INFERRED (sensor-absence explanation)` term is gone). In its place, both now state the cause of the all-null pattern as **UNKNOWN**, with four unfavoured, equally-unconfirmed candidate causes listed (sensor absent / pending QC / documented-but-not-enabled for this station / other unknown cause) — satisfying L4's instruction that a candidate-cause enumeration may stay only if it favours none and is labelled UNKNOWN. The null-count figures themselves (23/27 of 50 keys; 20/27 of 47 data fields; `r` 24/24 null) are **unchanged** — this was a wording/inference fix, not a re-count. `research-tools/observation-field-table.mjs` and its `.output.txt` were **not** re-run or edited in this round (hash-confirmed byte-identical to the v3-archive copy — see hash table below); the generated output was never hand-edited. `source-register.md`'s pre-existing V5 entry already listed multiple unfavoured causes and was already labelled UNKNOWN (no edit needed there — checked and left as-is per L4's "may stay" allowance); `research-report.md` §2's `r`-specific row likewise already satisfied this condition.

### W4 (saved reference-check result) — disposition

A new file, [`reference-check.md`](./reference-check.md), was created **after** all other v4 edits (including this section) were complete, per L5's explicit ordering instruction. It contains: the method (manual full-document reads plus six targeted automated greps, with the limits of each stated); the SHA256 of `research-report.md`, `provider-matrix.csv`, `source-register.md`, and `cc-report.md` at check time (the same four hashes recorded in the "Final hash re-verification" table below, taken at the same moment); the full `file:line | reference text | target | resolves? | class` table for every reference found per L2(e)'s read-based inventory; the unresolved count (0 found, reported as found — not assumed); and the final focused grep results for all six required strings, each hit classed as archive or historical-text-explicitly-withdrawn (none found as a live, unmarked repeat of the original defect). `research-report.md`'s §8 closing paragraph and `cc-report.md`'s R7/V2 dispositions both point to `reference-check.md` as the sole location; `reference-check.md` itself points to neither of them for its own result (no circular pointer — verified by reading `reference-check.md`'s own text, which cites exact commands and literal output instead of a cross-document pointer).

### Final hash re-verification (end of v4 round)

**v3-archive (created by this round's own L1 step) — confirmed unchanged at the end of the round:**
```
9532e4998aa2d7376c65a379eba0278244c0002b8fa446d0a3d8a37c1519e33e  v3-archive/research-report.md
cad4a80339a525851680385bdb565210ba3fe70d0b5e5e2855c0c66cdd16be5d  v3-archive/provider-matrix.csv
fee354d0da3cde11f4e42dc71bb9a68c8e128f406acc05b11e41de5ba6f473dd  v3-archive/source-register.md
1a2a7c868dfbd177481137394527bd77bcf77913da4da4a5ca7e26e9a0600a49  v3-archive/manifest.md
42645df1f86e40a2d2282f641682b65a656148bace6e819a109d9f221be71f46  v3-archive/cc-report.md
27141128a1954e54dddf664defea81243453efbe3ebd2088fa4796065b33fc45  v3-archive/research-tools/compare-baseline-vs-dmi-seamless.mjs
63dd66a6b8b34f6c1cb09a35498bc32f5aee209d99e547bd0b89418cb6756982  v3-archive/research-tools/compare-baseline-vs-dmi-seamless.output.txt
a79d2d090c97c98d1dff93d89e5381b82d1c2b63658accf60885c20ed2e7c670  v3-archive/research-tools/nearest-station-distance.mjs
2e15274ae1464b370f083e66e3cc73d834aa8f0265e3aae8b82338035e4c0ef3  v3-archive/research-tools/nearest-station-distance.output.txt
ddcdead4a48e1dd3d2bc63a2536dfac4b3c1647e2c906af09efe71380c78adf6  v3-archive/research-tools/observation-field-table.mjs
ec6057774d7d4fc44d09a5a8a5ee9caca8e765f90358b963f5864efee0fe4149  v3-archive/research-tools/observation-field-table.output.txt
```
These are identical to the BEFORE hashes taken at the start of this round (see L1 step), confirming nothing in `v3-archive/` was touched while correcting the live files.

**v2-archive and all 10 sample files — re-confirmed unchanged (expected, per L7):**
v2-archive's 5 top-level files + 4 research-tools files, and all 10 `samples/*.json`/`*.txt` files, hash identically to the values already recorded in the v3 Correction Round section above — no new divergence introduced in v4.

**Unchanged-file hashes within the live `research-tools/` directory (expected unchanged, per L7):**
```
a79d2d090c97c98d1dff93d89e5381b82d1c2b63658accf60885c20ed2e7c670  research-tools/nearest-station-distance.mjs
2e15274ae1464b370f083e66e3cc73d834aa8f0265e3aae8b82338035e4c0ef3  research-tools/nearest-station-distance.output.txt
ddcdead4a48e1dd3d2bc63a2536dfac4b3c1647e2c906af09efe71380c78adf6  research-tools/observation-field-table.mjs
ec6057774d7d4fc44d09a5a8a5ee9caca8e765f90358b963f5864efee0fe4149  research-tools/observation-field-table.output.txt
1a2a7c868dfbd177481137394527bd77bcf77913da4da4a5ca7e26e9a0600a49  samples/manifest.md
```
All five match their v3-archive/earlier-recorded counterparts exactly — confirming these specific files were genuinely untouched in v4.

**Changed file (expected changed, per W2/L3):**
```
ccb859ccabcd65a12652d9adacb2cd8e955bba544ee83eb401f42afc2c052b0f  research-tools/compare-baseline-vs-dmi-seamless.mjs
2626fd88808207f9008481b592f6ced68bee4d81e489011365d8fc6e2f531648  research-tools/compare-baseline-vs-dmi-seamless.output.txt
```
Differs from the v3-archive copy (`27141128...`/`63dd66a6...`) as expected — this is the one file this round was authorized to extend.

### CSV re-parse (end of v4)

Re-ran the hand-written RFC4180-style Node CSV parser (built-ins only) against `provider-matrix.csv` after all v4 edits: **6 header columns, 47 total rows (46 data rows), 0 malformed rows** — no row was added or removed in v4, only rows 3, 9, 10, and 37's content was edited (plus the already-existing SUPERSEDED markers from v3 left untouched where not in scope).

### Source-ID cross-reference (end of v4)

Re-ran the Node regex-based ID cross-check: defined in `source-register.md` = `D1-D5, E1-E4, OA1, S1-S18, V1-V8`; cited in `research-report.md`/`provider-matrix.csv`/`cc-report.md` = `D1-D5, E1-E4, S1-S10, S13-S16, S18, V1-V8`; **missing: none**.

### Secret-grep audit (end of v4)

Re-ran the full audit (`apikey|api_key|authorization|cookie|bearer|token` plus the `[A-Za-z0-9+/]{40,}={0,2}` long-base64-like heuristic) against every file touched or read in v4 (`research-report.md`, `provider-matrix.csv`, `source-register.md`, `cc-report.md`, `research-tools/*.mjs`). All hits are benign and of the same three classes seen in every prior round: the literal `OPEN_METEO_API_KEY` **variable name** (never a value); the keywords appearing only inside this audit's own command text, quoted self-referentially; and SHA256 digests / git commit hashes (40+ hex characters, matched by the base64-like heuristic but are plainly-labelled hashes/commit IDs in a hash table, not secrets) plus one documentation-URL fragment containing the word "authentication" (a DMI docs page name). **Zero actual secrets found.**

### Scope audit (end of v4)

```
git status --porcelain=v1
```
Result: ` M docs/ai/CURRENT.md` and `?? docs/ai/tasks/ticket-450/` only — identical in kind to every prior round's end-state. `git rev-parse HEAD` = `abc61ff04fb8a15a5e2ddada671adfd084062f89`, unchanged throughout all four rounds. No `src/`, `api/`, `config/`, `dist/`, `coverage/`, `test-results/`, `.vercel/`, or `node_modules/` path was touched. No test/lint/build run. No `.env*`/`.vercel/` file opened or globbed. No account, registration, or payment made. No commit, push, deploy, or GitHub/Project mutation.

### Remaining inherited limitations (unchanged from prior rounds, restated per L7)

- R6/§8 step 1 (DMI catalog/domain metadata) is still genuinely **not attempted** — read-only, listed as the first future step, not silently dropped.
- No external quotation (DMI docs prose, the Oct 14 Veðurstofa meeting notes) is retained beyond what v1/v2 already captured.
- All `Date` response headers are **server** response time, not an independently logged client retrieval clock — unchanged.
- The `dmi_seamless` experiment's own retrieval time remains only **RECONSTRUCTED** (v3/K3 finding) — "same model run" as the baseline is not established.
- The owner's OWNER-CONFIRMED statement that a paid Open-Meteo subscription exists is not independently verified against any billing/account record (H2 boundary unchanged).
- The observation null-count/field-table finding rests on **one day, one station** — not a general provider policy.
- The per-station-type distance finding (N1, v3) remains a straight-line heuristic, not a verified-parameter-delivery check — this is precisely what §8's step 3 identifies as still needing resolution.

### Deviations from the approved prompt (stated explicitly, not "none")

1. L2(e)'s read-based inventory surfaced three additional stale references beyond Jonesy's four named instances (the appendix's "two scripts"/"v2-kafli" undercounts, the "§-E1" typo, and the V7/V8 "new this round" ambiguity, plus the row-36-vs-row-37 numbering-convention mismatch) — all fixed under this same W1/L2(e) pass per L7's explicit instruction ("if the inventory finds further stale references, CC fixes them under W1/W4 in this pass and lists them"), rather than deferred to a future round.
2. `reference-check.md` is a new task-local file, not a new `cc-report.md` section — L5 explicitly offered this as the preferred option ("prefer separate reference-check.md to avoid self-hashing the same document that stores the hashes"), so this is the recommended choice, not a deviation in spirit, but is listed here because it is a new file the approved prompt's "allowed writes" list names as optional rather than mandatory-by-name.
3. The before/after checklist (L6) quotes the pre-v4 line numbers as they existed in each edit's own source context rather than one single frozen pre-v4 snapshot line count; because several edits were made sequentially and each insertion shifted subsequent line numbers, "pre-v4 line N" in the checklist refers to the line number at the moment that specific defect was first located and read, not a single consistent whole-document snapshot — this is noted explicitly rather than presented as more precise than it is.

## Lifecycle (v4)

No commit, push, deployment, production mutation, or GitHub issue/comment/closure/Project change was performed at any point in this round. `docs/ai/CURRENT.md` to be updated: handoff-log entry appended, `Stage` set to `CC_COMPLETE`. Per the workflow, the owner sends "CC búinn" to Jonesy next for the v4 narrow result re-check, then (if needed) a further Ripley final assessment — neither of those two steps is performed by CC.

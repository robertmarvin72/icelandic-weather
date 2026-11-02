# #485 — CC report

2026-11-02. CC. Executed `approved-prompt-v1.md` in full (Jonesy Round-2 APPROVED, R1–R6/C1–C4 folded in by Ripley). No production code/API/UI/DB/config change, no commit, no push, no deploy, no GitHub mutation, no accounts/keyed probes/secrets, no installs, no MVP proposal.

## Headline

**Route: PARTIAL. Overall: PARTIAL. Not GO.** Frozen as the ceiling before any request (`pre-sample-plan.md` §10, owner-attestation absent) and confirmed, not contradicted, by everything fetched. See `research-report.md` for the full writeup.

## Phase A — offline preparation and freeze (done before any provider request)

- Built `harness/wrapper.py` (durable, pre-flight-checked, ledgered HTTP client: 24-exchange/16+8 class split, 20MiB+8MiB decoded-byte caps with 4MiB/2MiB per-body limits, 45-minute window, 10-minute cumulative wait, manual redirect handling with no auto-follow, default TLS/hostname verification always on, no insecure override; every attempt's `attempts` record is written before the network call, with its outcome appended after). **Correction v2 (R3): this description overstated the code.** The class exchange-count/byte totals are incremented only in `append_outcome`, not at `reserve` time, so a crash between the two would under-count on a subsequent run; there is no origin/path allowlist, no redirect-chain hop counter inside the wrapper itself (the "3-hop" rule was a manual convention this round's calling script followed, not code the wrapper enforces), no remaining-global-byte-aware stream cutoff (only a per-body one), and `timeout=20` bounds each read/connect, not one hard total per exchange. The real run was clean regardless (see Phase B) — see `blocker-rights-register.md` for the full corrected list; `wrapper.py` itself is untouched and frozen.
- Self-tested it (`harness/selftest.py`, `selftest-output.txt`, exit 0, **5/5 PASS**) against local-loopback/synthetic fixtures only, in a throwaway scratch ledger, never touching the real provider ledger: redirect received and logged but never auto-followed; an over-limit body truncated at the exact configured cap (and an under-limit body correctly NOT truncated); a hung connection times out and is durably recorded as a failed, budget-consuming attempt; an exhausted exchange-count budget refuses the next attempt pre-flight without itself consuming budget; and — the one place a non-default TLS `verify` value is used anywhere in this task — an untrusted self-signed certificate (issued by real local `openssl`, not mocked) is rejected under default verification (RED), then the identical code path succeeds once given that same certificate as an explicitly-trusted test CA (GREEN), never via `verify=False` or a disabled hostname check.
- Froze `pre-sample-plan.md` (SHA256 `4c05ce469d41fd8bd68f70d12e89718157789c3822fba764c39b1c57772a4a61`, as-of 2026-11-02T13:16:55Z) before the first provider request (2026-11-02T13:20:22Z): reused-evidence SHA256 table, anchor/CRS method, sample-point/ETA rule (strict: missing approach length ⇒ downstream ETA UNKNOWN, no interval substitute), network allocation + priority/drop order, rights-gate decision procedure, deterministic forecast field-name rule, and the frozen capability/grade rubric — all method, no results, decided in advance.
- Confirmed `owner-attestation.md` **does not exist** (direct directory check, not inferred) — only the blank template is present. This alone caps axis 6 at PARTIAL for every Open-Meteo-dependent account/operational item, frozen as a fact of the plan before sampling, not discovered afterward.

## Phase B — bounded real requests (8 of 24 exchanges used; full detail in `samples/manifest.md`/`samples/ledger.json`)

1–2. `https://open-meteo.com/en/pricing` and `/en/terms` (doc, 2/8 used). **Rights-gate finding, applied exactly as frozen in §8**: the terms page states *"You may only use the free API services for non-commercial purposes"* and explicitly lists *"Websites or apps that have subscriptions"* as commercial use — Eltum Veðrið/CampCast has subscriptions. This is an **explicit restriction**, not ambiguity. Per the frozen procedure, the Open-Meteo forecast request was **never attempted** — axis 4 (fresh) is `NOT_TESTED` for every span, the two reserved forecast slots and the third Open-Meteo doc slot stayed genuinely unused. This does not affect production, which already uses the separate paid/keyed customer host (#453) — it blocks only this round's own ability to test the *public* host.

3–4. `https://gagnaveita.vegagerdin.is/api/faerdpunktar2017_1` and `/api/faerd2017_1` over HTTPS (data, 2/16 used). Both 200 directly, no redirect. **The point feed's HTTPS reachability is a genuinely new, positive finding — #483 never attempted it (plain HTTP only).**

5–8. Targeted WFS query for the Reykjavík-approach extension IDs (`914020037,903020037`), native EPSG:3057 and `srsName=EPSG:4326`, each attempted twice (data, 4/16 used against a 3-slot plan allocation — a deviation paid from reserve, not something specifically preregistered, per correction v2/R3: the first pair used `maxFeatures=100` against an actual 172-feature population and returned only 100; the retried pair at `maxFeatures=250` returned the complete 172/172 — the ledger retains all 4 outcomes' sizes, but the two incomplete bodies were overwritten on disk by the retries and their raw bytes/hashes are now permanently unavailable, a real evidence loss per correction v2/R5, not merely "superseded"). Using this geometry plus the #450-retained Reykjavík anchor: the two nearest candidates (`903020037` at 5924.6m, `914020037` at 5931.6m) sit within a 7.0m margin. **Correction v2 (R1): span 0 stays UNKNOWN NOT because of a "tie below 230m" — #483's own DATEX-control residual (61.9m) was mis-cited as a supported uncertainty bound E for this comparison; #483's own output states it explicitly is NOT a same-object positional-accuracy bound, and it was measured at a different location. With E unsupported, the ranking cannot be certified admissible at any margin.** The 7.0m figure is real and reported as descriptive color only. A specific connectivity path from the anchor-nearest candidate to the retained chain (traced this round via `harness/span0_path_analysis.py`, not merely asserted) IS topologically adjacent end-to-end — a genuine new finding — but adjacency alone does not establish an official through-route, so span 0 remains UNKNOWN for the E-unsupported reason regardless.

Final tallies: 6/16 data, 2/8 doc, 923,544 of 31,457,280 decoded bytes, 0.53s of 600s cumulative wait, entire round completed within ~90 seconds of the 45-minute window opening. Stopped by the frozen decision gates, not by exhaustion.

## Validation (approved prompt's explicit requirement: "485 checks nonzero on failed assertions")

`harness/validate.py` (`validate-output.txt`, exit 0): synthetic midpoint self-check; real-data re-derivation of IdPunktur 67861/67862/73801 association using THIS round's fresh point coordinates against the reused #483 chain geometry (0.089m/0.138m, identical to #483, independently reproduced not re-cited); full-ID presence/duplicate check against the fresh state feed (13/13 present, no duplicates); and a `coverage.csv` cross-check demonstrated with an expected-RED corrupted task-local copy (never the real file) that correctly raises `AssertionError`, followed by a GREEN pass on the real file. This fixes, in this round's own harness, the exact defect class #483's `harness/05` left open (a mismatch that prints but does not fail the process).

## AC mapping (approved prompt's "Frozen grades and delivery" + "Validate..." sections)

| Deliverable | Status |
|---|---|
| `pre-sample-plan.md` + freeze receipt/hashes | Done, §10 above |
| `research-report.md` | Done |
| Blocker/rights register + owner checklist | Done — `blocker-rights-register.md` |
| `coverage.csv` (status columns separate from numeric) | Done |
| Route/point mapping | Done — `route-point-mapping.csv` |
| Bounded samples/attempt ledger/SHA256 | Done — `samples/manifest.md`, `samples/ledger.json` |
| Offline harness/README/commands/stdout | Done — `harness/README.md`, `harness/*-output.txt` |
| cc-report AC mapping incl. attestation presence/hash | This section; attestation: **absent**, no hash (file does not exist) |
| Midpoint/ID+distance/full-ID/mapping/units/ETA/time-quality/limit/grade-cap validation, nonzero on failure | Done — `harness/validate.py`, see "Validation" above |
| Synthetic vs real evidence explicit | Done throughout — every synthetic check is labelled as such in its own output text |
| No full app tests/lint/build/browser | None run (not required, none needed — no application code touched) |

## Status

- Baseline HEAD (start of this round): `b1bc795244785197fc502f08289ac332c30fbbb2`.
- HEAD at end: `b1bc795244785197fc502f08289ac332c30fbbb2` (unchanged — no commit made).
- `git status --short` at end: ` M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-485/` — no other paths touched, no production/application/test/config/instruction file modified.
- `git diff --check`: clean (one line-ending notice on `CURRENT.md`, not a whitespace error).
- No `.env`/`.vercel`/secret access, no account/keyed probe, no npm install.
- `harness/selftest.py` and `harness/validate.py` both re-run fresh immediately before this report: exit 0 each. No stray `__pycache__`/`.pyc` left under `docs/ai/tasks/ticket-485/`.

## Known limitations carried forward

- Open-Meteo production key validity, customer-host response shape/wind-unit metadata, Preview configuration, VERCEL_ENV exposure — all owner-side, unchanged by this round, still the single largest remaining axis-6 gap (a general paid-path clause was found this round, see correction v2/R4, but establishes none of these account-specific facts).
- Span 0's anchor ranking is UNKNOWN because its uncertainty bound is unsupported, not because of an inherent/permanent dead end — corrected in v2/R1 (was previously overstated as "only Vegagerðin can answer").
- The nationwide point-incident count changed (43→26) between #483 and this round — disclosed, not investigated, consistent with ordinary real-world churn.
- Veðurstofa attribution/cache/redistribution conditions remain owner-unaccepted, unchanged (axis 3 is optional for this product definition, so this does not cap the result).
- `wrapper.py`'s execution-discipline gaps (no origin allowlist, counters incremented at outcome not reserve, no redirect-hop counter in the code itself, per-read not per-exchange timeout) — corrected description in v2/R3; code itself unchanged.

## Correction round v2 (R1–R5) — 2026-11-02, offline only, ZERO network

Jonesy's round-1 review (`result-review.md`) found the v1 headline (Route PARTIAL, Overall PARTIAL, not GO) correct, but several supporting claims wrong, unsupported, or missing a retained script behind them. Ripley folded these into `approved-prompt-v2.md`, explicitly ZERO network of any kind (not even loopback/selftest servers), `wrapper.py`/`selftest.py`/the frozen plan/the real ledger/raw samples/`approved-prompt-v1.md` all preserved byte-for-byte.

**R1 (span 0 reasoning) — fixed.** Added `harness/span0_path_analysis.py` (and its retained stdout), which: (a) actually computes the 5924.6/5931.6/7851.6m anchor-distance figures from retained geometry — the v1 round had these numbers only in prose/CSV, not behind any runnable command; (b) corrects the uncertainty-bound citation — E=61.9m (reused from #483's DATEX cross-check) was mis-cited as a supported same-object positional bound for this comparison; #483's own output says the opposite, and the figure was measured at a different location. With E unsupported, span 0 is UNKNOWN **because the admissibility test cannot be certified**, not because of a "7m tie" (which is now reported only as descriptive color); (c) traces a specific connectivity path (IDFERILL 9924→49926→42244→1431→54723→1436, from Jonesy's own leads, verified not assumed) end-to-end adjacent under the same <100m bound #483 used for its own chain — withdrawing the unsupported "only Vegagerðin can answer"/"further research cannot resolve this" claims from `research-report.md`/`blocker-rights-register.md`. Span 0's grade (UNKNOWN) is unchanged; only the stated reason and the supporting evidence changed.

**R2 (time-quality) — fixed.** Added `harness/time_quality_check.py` (and its retained stdout), computing real signed `DagsSkrad` ages against both acquisition and export reference times for all 13 chain segments and the 3 point events. `coverage.csv`'s span-1 note ("2-14590s", never actually computed by any retained script) is corrected to the real figures: span 1's own 4 segments are 96s/37,574s/37,575s/37,575s; the full 13-segment range is 96–37,575s (12 of 13 segments 8.0–10.4h old). No missing/negative/inconsistent timestamp found for any of the 13 segments or 3 point events (`NONE FOUND`, stated explicitly). Axis 5's PASS label in `research-report.md` is now explicitly scoped to the branches actually checked.

**R3 (wrapper claims vs. code) — fixed, report-only, `wrapper.py` untouched.** Corrected `cc-report.md` (this file), `research-report.md`, and `blocker-rights-register.md` to state exactly what the frozen wrapper code does and does not enforce (count/bytes incremented at outcome not reserve; no origin allowlist; per-body not remaining-global-aware truncation; no redirect-hop counter or in-flight window cancellation in the code itself; per-read not total timeout). The actual run was unaffected (8/8 clean exchanges) — these are corrected characterizations, not newly-discovered run defects. The WFS `maxFeatures` gap-fill retry (4 exchanges against a 3-slot plan allocation) is now described as a reserve-funded deviation, not something the plan specifically anticipated.

**R4 (paid-path evidence) — fixed.** Added the retained `openmeteo-pricing.html` clause to `blocker-rights-register.md` (quoted, dated, sourced, kept within this page's word-budget): a subscription grants a commercial-use licence and customer-host API key; Standard/Professional/Enterprise call-volume tiers exist. Explicitly scoped: this establishes only that a general paid path exists — not this owner's active tier, key validity, quota headroom, customer-host response shape, `VERCEL_ENV`, Preview, or attribution acceptance, all of which remain the standing owner-attestation gap.

**R5 (evidence loss / TLS / format) — fixed.** `samples/manifest.md` now states plainly that the two `maxFeatures=100` WFS response bodies were overwritten on disk by their complete retries and their raw bytes/SHA256 are permanently unavailable (an evidence loss, not merely "superseded"), and that no dedicated TLS certificate diagnostic was captured for any real request this round (200 + no `SSLError` under default verification supports, but is not the same as, an explicit certificate check). `research-report.md` §9 now states explicitly that the wide per-span `coverage.csv` format is acceptable only because axis 4 is NOT_TESTED, not evidence that long-form per-variable forecast coverage was ever produced.

**Validation/delivery.** `harness/validate.py`'s `coverage.csv` red/green demonstration was rewritten to mutate the parsed CSV row rather than a literal substring tied to the (now-corrected) "UNKNOWN_TIED" wording, and to use a task-local `../tmp/` directory (created and fully removed within this task's own tree) instead of the OS default temp dir, which failed under Ripley's sandbox permissions. Re-run fresh: exit 0. `wrapper.py`/`selftest.py` were NOT re-run (no network needed or permitted this round); their hashes are unchanged and reconfirmed below.

**Hash verification (before and after this correction round, confirming byte-for-byte preservation):**

| File | SHA256 | Unchanged? |
|---|---|---|
| `harness/wrapper.py` | `a7ca90fd101186c623ebdb63716f90b453b3c18ed3c94d683595414ad41b52f6` | YES |
| `harness/selftest.py` | `775abe35bd12b931f43a5315dbccc38c0a39a40b8a147414fe3b36314ee1d1b3` | YES |
| `pre-sample-plan.md` | `4c05ce469d41fd8bd68f70d12e89718157789c3822fba764c39b1c57772a4a61` | YES |
| `samples/ledger.json` | `ea7f36f9b13d115348d6800988e73490fd4729d5f382ceef5a2247cceb381c44` | YES |
| `approved-prompt-v1.md` | unchanged (not re-hashed here; not opened for writing this round) | YES |

**Status (end of v2 round):** HEAD unchanged. Offline checks re-run fresh with `python3 -B`: `span0_path_analysis.py`, `time_quality_check.py`, `validate.py` — all exit 0. No new `__pycache__`/`.pyc`, no leftover `tmp/` directory. Zero network requests of any kind this round.

## Next in the workflow

Per `docs/ai/README.md`: Róbert → Jonesy "CC búinn" → Jonesy writes `result-review.md` → Róbert → Ripley "Jonesy búinn að reviewa CC" → Ripley final assessment (PASS/REVISE/BLOCKED). PARTIAL here means the bounded research was delivered accurately and the rights-gate decision was applied exactly as frozen in advance — it is not implementation permission, and no MVP proposal accompanies this report regardless of outcome, per the approved prompt's own explicit instruction.

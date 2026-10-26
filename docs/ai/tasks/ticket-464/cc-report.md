# #464 — CC report

2026-10-26. CC. Round 1 executed `approved-prompt-v1.md` (research-only, J1–J10 incorporated). Round 2 (this appendix) executed `approved-prompt-v2.md` (Jonesy result-review R1–R3, accepted by Ripley). No production implementation, commit, push, deploy, or GitHub mutation performed in either round.

## Round 2 correction appendix (2026-10-26)

**Owner-facing corrected summary — supersedes the Round 1 CC/CURRENT headline below, which is no longer current guidance:**

Round 1 reported "an unreported gust of about 11.1 m/s or more is the most parsimonious sufficient driver of Oct-28's 'Bad'". That assumed the raw `daily.weathercode` was clear/mainly-clear, based on the owner's displayed description — but whether that displayed description is the separate, display-only field (`summaryCode`) rather than the raw code `scoreSiteDay` actually reads is an **inference from the code path, not confirmed**; stated as "possibly", not "most likely". The raw code is UNKNOWN. A real, independently re-executed sweep over 14 candidate codes, against a synthetic Oct-28 baseline (not a claim about the unknown historic raw code) and not merely adopting Jonesy's reviewer numbers, shows the first gust that reaches "Bad" is code-dependent: **≈11.1 m/s for clear codes, ≈8.0 m/s for most other non-wintry codes, or no gust at all for wintry codes (snow/freezing rain), which already reach "Bad" via the `getWintryPrecipPenalty` wintry-precipitation penalty — not from temperature or sky.** There is no single "most parsimonious" number. The underlying message is unchanged and, if anything, strengthened: the owner's reported rounded numbers alone do not reach "Bad" for **9 of the 14** codes checked (the non-wintry ones); for the remaining **5 wintry codes** they already do, with no gust needed. So an unreported input (gust, and/or the raw code itself if it turns out to be one of the 5 wintry codes) is still required to explain "Bad" for 9 of the 14 possibilities — but the previous single-number framing overstated what was shown, and the earlier "13 of 14" count in this paragraph was itself wrong and is corrected here (2026-10-26, v3). Separately, §6e's claim that the hourly label can "silently diverge" for viewers outside Iceland's timezone was simply wrong and has been retracted after real execution under three timezones showed no divergence for a plain (non-DST-gap) time; the related season-boundary bug (J6) is real for timezones west of UTC near Oct 1/May 1, now confirmed by real execution, and confirmed to not affect Oct 27/28. Full corrected detail: `research-report.md`'s own Round 2 notice, §4a, §6a, §6e, §6f, §9; `reproduction-cases.md`'s Round 2 rows; `next-steps-proposal.md` item 4 (relabelled from "verified bug" to "verified display gap, intent UNKNOWN").

**What was executed this round (all real, output retained):**
- `reference-cases-script-v2.mjs` — real `scoring.js`, 14-code sweep for Oct-28 + per-code first-Bad-gust search (step 0.1 m/s) + Oct-27 overcast (code 3, no gust) + no-gust-vs-gust-equal-windMax comparison. Output: `reference-cases-output-v2.txt`.
- `tz-check.mjs` — real `formatHourLabel` logic + real `getSeasonForDate`, run as three separate OS processes under `TZ=Atlantic/Reykjavik` / `America/New_York` / `Asia/Tokyo` (PowerShell `$env:TZ` — Git Bash's `TZ=`/`export TZ=` prefix did not propagate to `node.exe` on this Windows machine, confirmed by a direct `node -e` isolation test before switching tools). Output: `tz-check-output.txt`.
- `rule-gap-check.mjs` — real `gustPenaltyPoints`/`scoreSiteDay` confirming the hourly-Good-but-daily-penalized rule gap Jonesy noted. Output: `rule-gap-check-output.txt`.

**Status (Round 2):** HEAD unchanged at `24dcd8925287893249d6d5fd70edd6b4ce84158f`; `git status --short` still only ` M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-464/`; `git diff --check` clean. Only `docs/ai/tasks/ticket-464/` (new harness files + the four corrected deliverables) and `docs/ai/CURRENT.md` touched. No `.env`/secret access, no live provider call, no new dependency, no subagent. The real-component harness from Round 1 (`HourlyForecastModal.ticket464.spec.jsx`) was not changed and was not required to be re-run this round (no change to the component or its logic claims); Ripley's own independent re-run of it (per `result-review.md`'s final assessment, 17/17) is attributed to Ripley, not re-claimed here as a fresh CC run.

**Remaining limitation:** still NOT HISTORICALLY REPRODUCED — no original payload exists in scope. Root-cause confirmation still needs the owner's actual raw `weathercode` and `windGust` for Oct-28 (and ideally Oct-27), per `next-steps-proposal.md` item 6, now explicitly naming both UNKNOWN inputs rather than one.

## Round 3 correction appendix (2026-10-26)

Executed `approved-prompt-v3.md` (Jonesy's very narrow v2 re-check, text/harness-input corrections only; result-review.md's "2026-10-26 (Jonesy, #464 v2 re-check)" entry). Four corrections, all text/one-literal-input fixes, no new research:

1. **Count correction.** This file's own Round-2 owner-facing summary (paragraph above) said the reported numbers alone fail to reach "Bad" for "13 of the 14" codes checked. Wrong — corrected to **9 of the 14** (the non-wintry codes: `0,1,2,3,45,51,61,95,null`); the remaining **5 wintry codes** (`66,67,71,77,85`) already reach "Bad" with no gust at all. `research-report.md` §4a already said "9 of the 14" was the intended number once corrected there too (it previously also said 13; both files now agree).
2. **Attribution correction.** "Already reach 'Bad' from temperature/sky alone" (wintry codes) was wrong — corrected to "via the `getWintryPrecipPenalty` wintry-precipitation penalty, not from temperature or sky", matching `getPleasantnessModifier`'s actual composition (`sky - coldWind - wintry`).
3. **Inference-wording correction.** "The displayed description is most likely a separate, display-only field (`summaryCode`)" overstated an inference as a near-fact. Corrected to state explicitly that this is an inference from the code path, not a confirmed fact, using "possibly"/"an inference" rather than "most likely" (`research-report.md` §4a, this file).
4. **Harness input fix.** `tz-check.mjs`'s DST-gap check fed `is-IS` a different literal input (`"2026-03-08T02:30"`) than `en-GB` (`"2026-03-08T02:00"`), so the previously-reported differing minutes between locales were a differing-input artifact, not a locale-formatting finding. Fixed to feed both locales the identical `"2026-03-08T02:00"` input and re-ran all three timezones (`Atlantic/Reykjavik`, `America/New_York`, `Asia/Tokyo`) via PowerShell `$env:TZ` (shell `TZ` env var restored to its original unset state afterward, no system timezone changed). New output: both locales now agree exactly in all three timezones (`03:00`/`03:00` under New York's DST gap; `02:00`/`02:00` under Reykjavik and Tokyo). `tz-check-output.txt` and `research-report.md` §6e updated with a visible correction note, not a silent rewrite.

**Status (Round 3):** HEAD unchanged at `24dcd8925287893249d6d5fd70edd6b4ce84158f`; `git status --short` unchanged in shape (` M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-464/`); `git diff --check` clean. Only `docs/ai/tasks/ticket-464/` and `docs/ai/CURRENT.md` touched. No new code sweep, no component/full-suite/browser run (none required — Ripley's independent re-run of `reference-cases-script-v2.mjs` on 2026-10-26, exit 0, already confirmed the 9/5 split and the conditional gust thresholds; the retained 17/17 component-harness result from Round 1 remains attributed as before). No `.env`/secret access, no live provider call, no new dependency, no subagent, no commit/push/GitHub mutation.

**Acceptance (per approved-prompt-v3.md):** count/penalty-attribution/inference-wording now accurate and consistent across `research-report.md` and this file; DST-gap input identical across both locales with consistent output; historical raw-input limits (UNKNOWN raw code/gust for Oct-28) stated explicitly throughout; no new research performed; no production behavior changed; no issue closure implied.

---

## Round 1 report (superseded in part by the appendix above — kept for history, not current guidance)

## Scope actually executed

All 7 items of the read-only investigation contract, J1–J10, and all 8 issue-acceptance checklist items (see `research-report.md` §1) were addressed — answered with evidence, or marked UNKNOWN with the reason. Deliverables produced: `research-report.md`, `reproduction-cases.md`, `next-steps-proposal.md`, this `cc-report.md`, plus the retained harness under `docs/ai/tasks/ticket-464/harness/`.

## Status

- Baseline HEAD (start of this round): `24dcd8925287893249d6d5fd70edd6b4ce84158f`.
- HEAD at end of this round: `24dcd8925287893249d6d5fd70edd6b4ce84158f` (unchanged — no commit made).
- `git status --short` at end: ` M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-464/` — identical in shape to the status recorded at the start of the round (same two paths); no other file touched.
- `git diff --check`: clean (no whitespace errors), run against the one tracked modification (`docs/ai/CURRENT.md`).
- No `.env`/`.vercel`/secret file read or written. No live forecast/provider/account call made (the two Open-Meteo-shaped fixtures used in the harness are hand-authored synthetic JSON, never fetched). No cache write, no `localStorage` touched (the modal's own `getForecast` was mocked at the module boundary in every harness test, never the real `forecastCache.js`). No new npm dependency added. No subagent used.

## Source provenance (git blob hashes, this checkout, same HEAD throughout)

| File | Blob SHA-1 |
|---|---|
| `src/components/HourlyForecastModal.jsx` | `d5dbffd6ddde1609d860a3f94343e442e8437d82` |
| `src/lib/scoring.js` | `5db18656b020e6bb992525acd2d65f5f9b594b09` |
| `src/lib/forecastNormalize.js` | `0372916c87e82d067fdcd7eefc70f0a2b93806a6` |
| `src/hooks/useForecast.js` | `263e58244216dcb5eb6df55cc183421e0d4f0e3d` |
| `src/components/ForecastTable.jsx` | `e60d5b47764510098aca03dce2dcbebef3e6215d` |
| `src/lib/forecastCache.js` | `39201c0cfa4af12594694c09d4d184ec8d21afda` |
| `api/forecast.js` | `d0307cf7f80befc4c613b91e13e5d57166a599b0` |
| `src/config/hazards.js` | `aa77c3303f8ee64d3d2491f6bcc62e513c3bdd03` |
| `src/i18n/translations.common.js` | `9539b50e591466441f076ed8e757c9053d482259` |

All identical to the hashes recorded for the same files during the prior #444 round, confirming no drift since that audit.

## Real execution vs. model (J1 disclosure)

Everything cited as "VERIFIED EXECUTION" in `research-report.md` and `reproduction-cases.md` is real: either the unmodified `src/lib/scoring.js`/`src/lib/forecastNormalize.js` imported and called directly by a task-local Node script (via a resolver-hook loader, same pattern as #444, not a copy of the functions), or the unmodified `src/components/HourlyForecastModal.jsx` rendered by React Testing Library in a task-local Vitest config, with only the `getForecast` network/cache boundary mocked (same mocking pattern the repo's own `HourlyForecastModal.test.jsx` already uses). No part of this investigation relied on a hand-transcribed "model" substitute for either file's actual behaviour — the default-include-glob blocker J1 anticipated did not occur; the task-local Vitest config (`root` pointed at the real repo root, `include` restricted to the task folder) worked on the first corrected attempt. Nothing in this ticket needed the model-fallback path.

Two items in the report are explicitly **not** independently re-executed and are labelled as such inline: the J6 season-boundary counterfactual under an altered `TZ` (reasoned from source only, since the harness's own machine already defaults to `Atlantic/Reykjavik` and forcing a western TZ was not attempted this round), and the cross-browser generality of the midnight-label result (Node v24.11.0's bundled ICU only; no browser engine tested).

## Known limitation carried forward

No original raw payload or screenshot for the owner's Oct 27/28 observation exists anywhere in the scoped search paths (research-report.md §7: NOT HISTORICALLY REPRODUCED). All quantitative breakdowns are synthetic, built from the owner's own rounded, reported numbers, and are explicitly labelled "consistent with" rather than "the cause" wherever an unreported input (gust, weather code) was swept. The single most direct way to close the remaining gap is owner-supplied: the real `windGust` (and ideally the full raw `/api/forecast` response) for Oct-28, per `next-steps-proposal.md` item 6.

## Next in the workflow

Per `docs/ai/README.md`, this stage now goes to Jonesy for result review, then Ripley for final assessment. A PASS here means the research was delivered to the acceptance criteria — it does not mean any fix was implemented or the GitHub issue was closed; both remain explicitly out of this round's authority.

## Final text review note — Ripley, 2026-10-26

Applied Jonesy's three v3 confirmation conditions (research notice inference, wintry-penalty attribution and TZ invocation comment). Text/comment edits only, no script logic/output or production changes. Historical execution claims remain attributed to CC; final assessment in result-review.md.

# Ticket 412 — CC report

Executed per `docs/ai/tasks/ticket-412/approved-prompt-v1.md` (Jonesy APPROVED, Initial prompt Round 1; Ripley confirmed the raw issue text supports the approved missing-translation policy). Two source strands: EN parity for the existing 27 IS comments, and a mobile-visibility audit — kept separate per the approved prompt's requirement to report their root causes independently.

## Pre-edit audit (read-only, before any edit)

Read `AGENTS.md`, `CLAUDE.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, `docs/weather-voice/character-and-voice-bible.md`, the approved prompt, and prompt-review.md first. Then re-verified every "Verified before prompt drafting" claim directly against live source:

- `src/i18n/weatherVoice/en.js` genuinely exported `export const en = [];` — a real, empty, *supported* language, distinct from `null` (unsupported). `is.js` genuinely had exactly 27 entries.
- `src/lib/weatherVoiceSelector.js`: `selectWeatherVoiceComment` returns `{show:false}` whenever `library.length === 0` (the sole EN-disappearance mechanism) — confirmed, no render guard anywhere else in the chain.
- `src/hooks/useWeatherVoice.js`: `engineResult` is computed from `todayRow.{tmax,windMax,rain,code}` only — genuinely language-independent. `lang` enters only `episodeKey` (via `buildWeatherVoiceEpisodeKey`) and the library lookup inside the selection effect. `onVisible` requires episode-identity match before recording (Ticket 408 Revision 3's fix, confirmed unchanged and untouched by this ticket).
- `src/components/WeatherVoiceCard.jsx`: root is `flex`, image `h-20 w-20 shrink-0 object-contain md:h-[100px] md:w-[100px]` — 80px mobile / 100px desktop. Grepped the whole file for `hidden`, `md:hidden`, `display:none`-equivalent classes — **zero matches**. `src/App.jsx` renders exactly one `<WeatherVoiceCard>` (confirmed via grep — single call site), between `HomeDecisionCard` and `NorthernLightsCard`, gated only by `enabled: !showCampsitesGate && page === "home"` — a data-readiness gate, not a viewport gate. The surrounding container (`<div id="comparison-section" className="mx-auto max-w-6xl px-4 pt-3 pb-10 md:pt-4 md:pb-10">`) has no `hidden`/responsive-visibility class either. **No CSS/layout defect was found in the source audit** — the mobile-absence report remained an open question requiring real-browser reproduction, exactly as the approved prompt anticipated (requirement 6: "distinguish a card below the fold or correctly silent weather from unintended suppression").
- `weatherVoiceRules.js`/`weatherVoiceContent.js`'s `WEATHER_VOICE_COMMENT_METADATA` and `weatherVoicePresentation.js`'s mood→asset mapping are keyed purely by the language-independent `mood` string — "same asset in all four IS/EN × desktop/mobile combinations" is architecturally guaranteed by the existing design, confirmed by reading `weatherVoicePresentation.js` directly (no language parameter anywhere in `getTjaldurMoodAssetPath`).
- `validateWeatherVoiceLibrary` (existing, in `weatherVoiceContent.js`) checks metadata-match and duplicate-within-language for entries that ARE present, but never checked cross-language ID *completeness* — confirmed this is a genuine, real gap, not something already covered elsewhere.
- `getWeatherVoiceLibrary` already drops entries lacking registered metadata (`if (!meta) continue`) — confirmed the natural extension point for also dropping blank/invalid text existed already, requiring no selector change.

No STOP condition was triggered: nothing in the required implementation conflicts with the #413 safety boundary (see below), and Jonesy's approval already confirmed the missing-translation design needs no engine/selector change.

## Root cause 1 — EN disappearance (confirmed, fixed)

**Verified root cause:** `src/i18n/weatherVoice/en.js` exported a genuinely empty array. `getWeatherVoiceLibrary("en")` returned `[]`; `selectWeatherVoiceComment` returns `{show:false}` whenever the eligible pool (filtered from `library`) is empty. This is not a locale render guard, not a CSS issue, and not related to mobile — it was pure content absence. **Fixed by authoring all 27 EN entries** (below).

## Root cause 2 — mobile absence (audited, NOT reproduced)

Reproduced the exact same deterministic weather/site/day (excellent condition: `tmax:16, windMax:0, rain:0, code:0`) across desktop 1280px, mobile 390px, and mobile 320px, in both IS and EN, light and dark themes, using the real App/hook/card (not a mocked presentation prop) — see "Browser verification" below. **The Weather Voice card was visible in every single combination**, at the correct size (80px mobile / 100px desktop, per design, unchanged), with no clipping, no zero-dimension image, and no horizontal overflow. The card was also correctly *absent* for ordinary/silent weather in both languages, proving the fix (had there been one) would not have forced visibility onto legitimately silent weather.

**Conclusion: the mobile-absence report could not be reproduced with real App/hook/card and identical deterministic content.** Per the approved prompt's explicit instruction ("If not reproduced, document that finding and retain evidence... do not manufacture a CSS change"), **no rendering/layout change was made**. `WeatherVoiceCard.jsx`, `App.jsx`, and every other component file are untouched by this ticket. The most likely explanation for the original report is a below-the-fold or legitimately-silent-weather observation, not a code defect — this report documents that finding honestly rather than inventing a fix for a defect that does not reproduce.

## 27 bilingual pairs (ID / IS / EN)

Every EN line preserves the IS line's meaning and caution level — neither intensified nor softened — per the Character & Voice Bible (§2, §3, §8) and the approved prompt's #413 safety boundary. All 27 pairs, especially `wind_extreme_*` (severity 3) and `rain_heavy_*`, were reviewed contextually: none of the EN adaptations invent a new safety claim, add operational advice, or change the existing (documented, unresolved) fact that these lines remain sarcastic today — the same gap #413 already recorded, neither worsened nor silently resolved by translating it faithfully.

| ID | Condition/Mood | IS | EN |
|---|---|---|---|
| `wind_extreme_01` | extreme_wind/wrecked | „Vindur: Já." | "Wind: Yes." |
| `wind_extreme_02` | extreme_wind/wrecked | „Ég tek þetta sem persónulega árás." | "I take this as a personal attack." |
| `wind_extreme_03` | extreme_wind/wrecked | „Nei." | "No." |
| `wind_extreme_04` | extreme_wind/wrecked | „Vindurinn hefur orðið." | "The wind has become a whole thing." |
| `wind_extreme_05` | extreme_wind/wrecked | „Þetta var ekki í bæklingnum." | "This wasn't in the brochure." |
| `wind_strong_01` | strong_wind/struggling | „Lognið á frí." | "Calm is on vacation." |
| `wind_strong_02` | strong_wind/struggling | „Hárið hefur gefist upp." | "The hair has given up." |
| `wind_strong_03` | strong_wind/struggling | „Það blæs ekki af þessu." | "This isn't blowing over." |
| `rain_heavy_01` | heavy_rain/sad | „Bíllinn fær allavega þvott." | "At least the car gets a wash." |
| `rain_heavy_02` | heavy_rain/sad | „Þurrt er afstætt hugtak." | "Dry is a relative concept." |
| `rain_heavy_03` | heavy_rain/sad | „Þetta er fullmikill áhugi á vatni." | "This is an excessive interest in water." |
| `cold_wet_01` | cold_wet/unimpressed | „Ullin fær að vinna fyrir kaupinu." | "The wool earns its keep." |
| `cold_wet_02` | cold_wet/unimpressed | „Veðrið tók allan pakkann." | "The weather took the whole package." |
| `cold_wet_03` | cold_wet/unimpressed | „Ekki alveg stuttbuxnaveður." | "Not quite shorts weather." |
| `cold_01` | cold/freezing | „Lopapeysan hafði rétt fyrir sér." | "The sweater was right." |
| `cold_02` | cold/freezing | „Peysan fær framlengingu." | "The sweater gets an extension." |
| `cold_03` | cold/freezing | „Kaffið kólnar af samúð." | "The coffee cools out of sympathy." |
| `rain_01` | rain/unimpressed | „Það fylgir vatn með." | "Comes with water." |
| `rain_02` | rain/unimpressed | „Regnjakki með aðalhlutverk." | "Rain jacket, starring role." |
| `sun_wind_01` | sun_wind/suspicious | „Sólin mætir. Lognið ekki." | "The sun showed up. The calm didn't." |
| `sun_wind_02` | sun_wind/suspicious | „Bjart yfir. Hárið á hlið." | "Bright skies. Hair sideways." |
| `excellent_01` | excellent/excellent | „Þetta er grunsamlega gott." | "This is suspiciously good." |
| `excellent_02` | excellent/excellent | „Ekki segja neinum." | "Don't tell anyone." |
| `excellent_03` | excellent/excellent | „Nú vantar bara kaffið." | "All that's missing is the coffee." |
| `good_01` | good/happy | „Þetta má alveg." | "This'll do." |
| `good_02` | good/happy | „Jæja. Þetta er bara gott." | "Well. This is just good." |
| `good_03` | good/happy | „Engin kvörtun að sinni." | "No complaints for now." |

No new IDs, no joke-concept changes, no IS rewrites, no mood/condition/metadata/CTA/cooldown changes — all 27 EN entries share the exact same metadata as their IS counterparts via `weatherVoiceContent.js`'s single registry (verified by test, see below).

## Missing-translation policy — exact design and where it lives

1. **Release coverage (ship complete parity):** all 27 EN entries now exist, ID-for-ID matching IS — enforced by test (`validateWeatherVoiceLanguageCompleteness`, run against the real `is.js`/`en.js` content).
2. **Automated validation that fails on missing/blank/duplicate:** new pure function `validateWeatherVoiceLanguageCompleteness({ languages })` in `weatherVoiceContent.js` — checks every canonical ID (`WEATHER_VOICE_KNOWN_IDS`) has exactly one non-blank entry per language's raw `{id,text}` array; reports `"{lang}/{id}: missing"`, `"{lang}/{id}: text is missing or blank"`, or `"{lang}/{id}: duplicate id"`. Distinct from the existing `validateWeatherVoiceLibrary` (which validates entries that ARE present, never checks for missing ones). Test-only/build-tooling use, per the same convention as the existing validator — never called from a production render path.
3. **Runtime partial-pool recovery ("ignore invalid entries, use another valid entry"):** `getWeatherVoiceLibrary(lang)` now also drops any entry whose `text` is missing/blank (alongside its existing missing-metadata drop) — no selector change needed; the selector's existing eligibility/cooldown/pick logic already selects a different eligible entry once the invalid one is removed from the pool.
4. **Bounded, dev-only diagnostics — no user data/analytics/network/render-loop spam:**
   - `devWarnIncompleteLanguage(lang, rawEntries)` (internal, called from inside `getWeatherVoiceLibrary`): warns once per language per page session if any canonical ID is missing/blank for that language.
   - `devWarnEmptyEligiblePool(lang, condition, mood)` (exported, called from `useWeatherVoice.js`'s selection effect — the integration boundary that has both the engine result and the selector result): warns once per `(lang, condition, mood)` per page session when the engine wanted to show something but the resolved pool had zero eligible entries.
   - Both gated on `import.meta.env.DEV` (the same convention already used in `analytics.js`/`App.jsx`), both use a module-level dedup `Set` (mirrors this codebase's existing `clearAuroraDecisionCache` pattern), with an exported `clearWeatherVoiceDevDiagnosticsForTests()` test-only reset hook.
   - Neither `weatherVoiceEngine.js` nor `weatherVoiceSelector.js` was touched — both stay pure, exactly as required.
5. **Wholly-absent-pool fail-closed behavior (the exceptional case):** required no new selection logic — `selectWeatherVoiceComment` already returns `{show:false}` when the eligible pool is empty. This ticket adds the development diagnostic (`devWarnEmptyEligiblePool`) on top of that already-conservative behavior. **No Icelandic fallback, no fabricated generic line, no untranslated key, no stale text — confirmed by test** (`useWeatherVoice.test.js`'s unsupported-language test, and `weatherVoiceContent.test.js`'s empty-pool diagnostic tests). Per Ripley's issue-text confirmation ("Implementation skal hafa skýra fallback/dev handling svo auðvelt sé að finna comment sem vantar þýðingu"), this is exactly the fallback/dev-handling behavior the issue itself asked for — not a visible production fallback.

## Exact changed files

- `src/i18n/weatherVoice/en.js` — full rewrite: 27 entries (was `[]`), header comment updated (no longer claims EN is "deliberately empty for MVP").
- `src/lib/weatherVoiceContent.js` — `getWeatherVoiceLibrary` now drops blank/invalid text entries and calls the new bounded dev diagnostic; new `validateWeatherVoiceLanguageCompleteness` export; new `devWarnEmptyEligiblePool`/`clearWeatherVoiceDevDiagnosticsForTests` exports; stale "EN is empty" docstring language updated.
- `src/hooks/useWeatherVoice.js` — one narrow addition to the existing selection effect: calls `devWarnEmptyEligiblePool(lang, engineResult.condition, engineResult.mood)` when the engine was active but selection came back silent. No other logic changed; episode-key/exposure-lifecycle code (Ticket 408 Revision 3) is untouched.
- `src/lib/weatherVoiceContent.test.js` — added the full EN-parity describe block (mirroring IS's own), fixed the two obsolete "EN is empty" tests/describe-block names, added `validateWeatherVoiceLanguageCompleteness` tests (real content passes; missing/blank/duplicate fixtures), added `devWarnEmptyEligiblePool` bounded-diagnostic tests, added a synthetic-fixture partial-pool-recovery test.
- `src/hooks/useWeatherVoice.test.js` — replaced the obsolete "empty EN never falls back to IS" test (which relied on EN being empty) with two tests: a real active EN presentation (mirroring the IS test), and an unsupported-language (`lang="fr"`) silence test using the real `getWeatherVoiceLibrary` behavior instead of EN's now-obsolete emptiness.
- `src/hooks/useWeatherVoice.exposureLifecycle.test.jsx` — added `lang` as a `Harness` prop (default `"is"`, preserving every existing test unchanged); added a language-change stale-observer-replacement test and a real integrated IS→EN→IS test (condition/mood stability, correctly-localized text at each step, exact exposure-recording count with the "revisiting an identical unchanged episode does not double-record" behavior explained and asserted precisely).
- `docs/ai/CURRENT.md` — workflow stage.

No `src/components/WeatherVoiceCard.jsx`, `src/App.jsx`, `weatherVoiceEngine.js`, `weatherVoiceRules.js`, `weatherVoiceSelector.js`, `weatherVoiceTypes.js`, or `weatherVoicePresentation.js` change — the mobile report did not reproduce (no fix needed), and the engine/selector stayed pure throughout.

## Tests — added/updated, and why

1. **`weatherVoiceContent.test.js`** (37 tests total in the file): full "the real 27-entry EN library" describe block mirroring IS's own (count, unique IDs matching IS's set, exact reviewed text via a full `EXPECTED_EN_TEXT` table, all nine conditions covered, MVP defaults, shared metadata with IS for every ID, ≥2 eligible entries per real Phase-1 output); unsupported-language test kept as its own block; a synthetic-fixture partial-pool-recovery test; `devWarnEmptyEligiblePool` bounded-diagnostic tests (warns once, never twice for the same case, warns again for a genuinely different case); `validateWeatherVoiceLanguageCompleteness` tests against real content (zero errors) and synthetic fixtures (missing/blank/duplicate, each reported with exact ID and language).
2. **`useWeatherVoice.test.js`**: real EN presentation test (mirrors the existing real-IS test); unsupported-language (`fr`) silence test replacing the old EN-emptiness-dependent one.
3. **`useWeatherVoice.exposureLifecycle.test.jsx`** (10 tests total, up from 8): language-change replacement (stale IS observer cannot credit the EN episode); full IS→EN→IS integration test using the real hook + real card together.

No snapshot churn; no test merely restates a literal table without proving behavior (e.g., the diagnostic tests assert bounded-once-per-case behavior, not just "a warning exists").

## Regression / lint / build / diff-check

1. Targeted Weather Voice set: `npx vitest run src/lib/weatherVoiceEngine.test.js src/lib/weatherVoiceRules.test.js src/lib/weatherVoiceSelector.test.js src/lib/weatherVoiceHistory.test.js src/lib/weatherVoiceTypes.test.js src/lib/weatherVoicePresentation.test.js src/hooks/useWeatherVoice.test.js src/hooks/useWeatherVoice.exposureLifecycle.test.jsx src/components/WeatherVoiceCard.test.jsx src/App.weatherVoiceIntegration.test.jsx src/lib/weatherVoiceContent.test.js` → **11 files, 241 tests passed**.
2. Provenance/scoring-invariance/HomeDecisionCard regression: `npx vitest run src/hooks/useForecast.provenance.test.js src/hooks/useForecast.scoringInvariance.test.js src/components/HomeDecisionCard.test.jsx` → **3 files, 73 tests passed**, unmodified — confirms no unintended behavioral drift outside Weather Voice.
3. Full suite: `npm test -- --run` → **109 files, 1423 tests passed** (up from 1406 before this ticket). No flakes.
4. `npm run lint` → exit 0, no output (two `unused eslint-disable directive` warnings surfaced mid-work — `no-console` isn't actually a configured rule in this project — fixed by removing the unnecessary disable comments; confirmed clean afterward).
5. `npm run build` → succeeded, same pre-existing chunk-size advisory, no new errors.
6. `git diff --check` → **exit 0**, only pre-existing informational LF→CRLF autocrlf notices on every touched file (this project's established, harmless notice — not a real whitespace error; no `MapView.jsx`-style pre-existing-literal-CRLF file was touched by this ticket, so that specific quirk documented in Ticket 414's report doesn't apply here).

## Real-browser verification (evidence retained)

Read `useForecast.js`'s response-parsing contract (`normalizeDailyToScoreInput(data.daily, data.hourly)`, Open-Meteo daily field names) before writing the stub — same contract already established by this session's prior verification scripts. Script: `outputs/ticket-412-weather-voice-locale-evidence/verify-weather-voice-locale.cjs`. Uses the real App/hook/card end-to-end (never a hand-built mock of the presentation prop) with a real Chromium browser, real route stubs, today's actual Reykjavik date.

Fixtures run, all against the identical deterministic excellent-weather site/day (`tmax:16, windMax:0, rain:0, code:0`) except the two explicitly-silent cases:

| Fixture | Present | Visible | Image size | Mood asset | Text |
|---|---|---|---|---|---|
| Desktop 1280, IS, light | ✅ | ✅ | 100×100 | `/tjaldur/excellent.png` | „Þetta er grunsamlega gott." |
| Desktop 1280, EN, dark | ✅ | ✅ | 100×100 | `/tjaldur/excellent.png` | "This is suspiciously good." |
| Mobile 390, IS, light | ✅ | ✅ | 80×80 | `/tjaldur/excellent.png` | „Nú vantar bara kaffið." |
| Mobile 390, EN, dark | ✅ | ✅ | 80×80 | `/tjaldur/excellent.png` | "Don't tell anyone." |
| Mobile 320, IS, light | ✅ | ✅ | 80×80 | `/tjaldur/excellent.png` | „Þetta er grunsamlega gott." |
| Mobile 320, EN, light | ✅ | ✅ | 80×80 | `/tjaldur/excellent.png` | "Don't tell anyone." |
| IS→EN→IS session, step 1 (IS) | ✅ | ✅ | 100×100 | `/tjaldur/excellent.png` | „Þetta er grunsamlega gott." |
| IS→EN→IS session, step 2 (EN) | ✅ | ✅ | 100×100 | `/tjaldur/excellent.png` | "All that's missing is the coffee." |
| IS→EN→IS session, step 3 (IS again) | ✅ | ✅ | 100×100 | `/tjaldur/excellent.png` | „Ekki segja neinum." |
| Desktop, silent/ordinary weather, IS | absent (correct) | — | — | — | — |
| Mobile 390, silent/ordinary weather, EN | absent (correct) | — | — | — | — |

`documentOverflowing: false` on every present-card fixture — no horizontal overflow at any viewport. Mood asset was `/tjaldur/excellent.png` in every case regardless of language, confirming condition/mood/asset independence from locale. The IS→EN→IS session used ONE browser session/page (real toggle-language button click via the Toolbar's collapsed "Stillingar"/Settings panel, not a page reload), settling back to visible, correctly-localized IS content at step 3 — no permanent suppression, no stale-language flash observed. All 11 screenshots and `results.json` retained under `outputs/ticket-412-weather-voice-locale-evidence/`.

One cosmetic, out-of-scope observation (not a defect, not fixed): `WeatherVoiceCard.jsx` wraps the comment text in hardcoded „…" Icelandic-style quote characters regardless of language (pre-existing since Ticket 408, unrelated to this ticket's authorized scope of "translate 27 existing IDs" and "fix locale/viewport parity" — changing the component's quote-mark rendering would be a component/copy change beyond that, so it was left untouched and is flagged here for a future ticket to consider, not silently fixed or silently ignored).

## #413 safety boundary — unresolved limitations, explicitly carried forward

This ticket translates existing content only; it does not choose an authoritative danger classifier, does not map `severity=3` to DANGEROUS, does not implement `weatherSafetyMessages`, and makes no production safety-enforcement claim. Specifically still true after this ticket, exactly as #413 left it:

- No `voice_level` field exists anywhere in runtime.
- No safety-classification signal is wired into Weather Voice selection.
- The five `wind_extreme_*` entries (now translated into equally sarcastic English — "Wind: Yes.", "I take this as a personal attack.", "No.", "The wind has become a whole thing.", "This wasn't in the brochure.") remain, in both languages, un-gated by any safety-precedence check — translating them faithfully neither worsens nor resolves this pre-existing, already-documented gap.
- `rain_heavy_*` entries were reviewed with the same care; none of the three EN adaptations add a safety claim or minimize the source's tone.
- No faithful-adaptation conflict requiring a STOP was found for any of the 27 pairs — every EN line preserves its IS counterpart's meaning and caution level exactly.

## Confirmation

`docs/ai/CURRENT.md` updated: `Stage: CC_COMPLETE`, CC report path now populated (this file). **Not committed. Not pushed. Not deployed. No GitHub issue closed.**

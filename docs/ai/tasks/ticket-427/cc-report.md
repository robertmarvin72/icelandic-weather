# #427 — CC report (approved-prompt-v1.md)

`CURRENT.md` moved READY_FOR_CC → CC_IN_PROGRESS first. Working tree at start: only the ticket-427 prompt documents were untracked (#423/#425/#426 already committed/closed). No commit, push, deployment or issue closure performed.

## 1. What was implemented

### Removed Intl entirely (§1/§2)
`src/lib/auroraNightLabel.js` no longer imports or calls `Intl.DateTimeFormat` anywhere. Weekday resolution is now one shared internal helper, `weekdayName(date, t)`, indexing a fixed 7-entry `WEEKDAY_KEYS` array (Sunday at index 0) with `date.getUTCDay()`, resolved through the caller's own `t`. Both `formatNightWhenLabel` and `formatNightTabLabel` call this single path unconditionally for `daysAhead === 2`; the `daysAhead === 0/1` early returns and public argument shapes (`{date, daysAhead, lang, t}`) are unchanged, including the forced-English landing call sites (unmodified — they already pass `lang: "en"`/an English `t`). No duplicate weekday table exists anywhere else in production code — `NorthernLightsThreeNight.jsx`'s three call sites were re-verified unchanged (still call the same two exported functions with the same argument shape).

### Translation keys (§3/§4)
Seven new keys per language added to `translations.northernLights.js`, Sunday-to-Saturday, exact strings from the approved prompt:
- EN: `nlWeekdaySunday`…`nlWeekdaySaturday` = `Sunday`…`Saturday` (capitalized).
- IS: `nlWeekdaySunday`…`nlWeekdaySaturday` = `sunnudagur`…`laugardagur` (lowercase).

The existing Icelandic genitive-stem transform (`icelandicGenitiveWeekdayStem`, `ur$` → `s`) is reused **unchanged** and now runs against the *resolved translated* nominative name instead of Intl's output — the seven exact compounds (`sunnudagskvöld` … `laugardagskvöld`) are produced identically to before, verified by a direct table-driven test per weekday, plus an explicit regression asserting `"Wednesday"` never appears inside the Icelandic compound. `nlTabTonight`/`nlTabTomorrow`/`nlWhenTonight`/`nlWhenTomorrowNight` and all surrounding Pro-caption/comparison copy are untouched — confirmed by the full existing Aurora test suite passing unchanged.

### Comments updated
`auroraNightLabel.js`'s header comment now explains the #427 rationale (a real #425/#426 headless-runtime browser check silently resolved `is-IS` to English locale data) and that the table has no locale-data dependency at all. No other source file referenced Intl for this feature (`grep` for `Intl\.` across `src` confirms only unrelated files — hourly-forecast/date/share-image/admin utilities — plus this file's own new comment and its test's deliberate `Intl` stub). The `#425`/`#426` cc-reports themselves are left untouched, per the approved prompt's "preserve historical reports" instruction — this report is where the locale limitation is recorded as resolved, not a rewrite of theirs.

## 2. Verification — exact commands and results

- `npx vitest run src/lib/auroraNightLabel.test.js` → **25 tests, all passed.** Rewritten from scratch against **real translation dictionaries** (`northernLightsTranslations`, not a mock standing in for the weekday strings, per the approved prompt's explicit instruction): a table-driven `it.each` over a real, independently-computed consecutive Sunday→Saturday UTC week (2026-09-27…2026-10-03) for both `formatNightWhenLabel` and `formatNightTabLabel`, both languages, asserting the exact strings; a dedicated test proving `"Wednesday"` never appears inside the IS compound; two tests forcing `Intl.DateTimeFormat` to throw and `Intl` itself to be `undefined` (restored via `vi.unstubAllGlobals()` in `afterEach`) and asserting identical correct output — proving there is no residual Intl dependency, not merely that the happy path avoids it; two tests using a real `process.env.TZ` override (`Pacific/Honolulu` UTC-10 and `Pacific/Kiritimati` UTC+14) that independently demonstrate `.getDay()` *would* shift the calendar day backward under a negative offset (asserted directly: `new Date("2026-09-27T00:00:00Z").getDay()` returns Saturday under UTC-10) while `getUTCDay()`-based resolution stays correct; year-boundary (Dec 31→Jan 1), month-boundary (Jan 31→Feb 1), and a leap-day boundary (Feb 28→29→Mar 1, 2028).
- `npx vitest run src/lib/auroraNightLabel.test.js src/pages/NorthernLightsLanding.homeHandoff.test.jsx src/components/NorthernLightsThreeNight.test.jsx src/components/NorthernLightsThreeNight.round5.test.jsx src/pages/NorthernLightsLanding.test.jsx src/pages/NorthernLightsLanding.cardWiring.test.jsx src/App.northernLightsAnchor.test.jsx src/App.northernLightsHomepageCheckout.test.jsx` → **8 test files, 149 tests, all passed.**
- Full project `npx vitest run` → **142 test files, 2020 tests, all passed** (up from #426's 2000 — the delta is this ticket's 20 net-new/rewritten cases in `auroraNightLabel.test.js` and the new `#427` integration block, not a 1:1 addition since the label test file was rewritten rather than extended).
- `npm run lint` (whole repo): exit 0, no output.
- `npm run build`: succeeded, `built in 4.39s`.

### Real shared-module integration (new `#427` describe block in `NorthernLightsLanding.homeHandoff.test.jsx`, 4 tests)
Uses a dedicated fixed clock (a real Monday, 2026-09-28) so the real third selected date is a genuine Wednesday (2026-09-30) — the file's other fixtures (a different week) are untouched:
- IS homepage: selecting the third night shows `miðvikudagur` on the tab and `Fyrir miðvikudagskvöld` in the caption; `document.body.textContent` never matches `/Wednesday/`.
- EN homepage: shows `Wednesday` / `For Wednesday night`.
- Forced-English landing, deep-linked to the same date with `localStorage` saved as `"is"`, still shows `Wednesday` and never `miðvikudag*` — the forced-English contract is unaffected.
- Language switch (IS→EN) on an already-selected third night: same component instance (via the `homeAppTree` same-shape-rerender helper established in #426), selection stays on the same calendar date (now rendered in English), Aurora request count and `northern_lights_night_selected`/`northern_lights_card_viewed` counts are unchanged — a language-only rerender is not a new fetch, selection, or exposure event.

**One test-fixture bug found and fixed while writing this block**: the first draft of this integration test reused the file's shared `body()` helper, whose `sourceFetchedAt` is hardcoded to the *other* fixture week's timestamp. Under the new Monday clock that timestamp was ~74 hours old, so the #423-Round-5 freshness-expiration logic correctly (and unrelatedly) classified every night as expired, and the test failed for the right general reason (a real freshness rule) but the wrong specific one (a stale test fixture, not a weekday-label defect). Fixed by giving this block its own `wedBody()` helper with a `sourceFetchedAt` 2 hours before the fixed clock. Not a production defect — flagged for the record, matching #426's own similar test-authoring note.

## 3. Browser verification — the previously-failing scenario, closed

Real Vite dev server + Playwright Chromium (the **same** browser binary used for the #425/#426 checks that first surfaced this bug) + `page.clock.install({ time: ... })` to fix "today" to a real Monday (2026-09-28), so the real UTC third night is a real Wednesday (2026-09-30); deterministic `page.route` stubs for `/api/aurora-decision`, `/api/me`, `/api/campsites`, `/api/forecast`. 6 runs: {mobile 375px, desktop 1280px} × {IS homepage, EN homepage} plus {mobile, desktop} × forced-English landing with `localStorage` saved as `"is"`, deep-linked to the Wednesday date.

**Exact evidence, printed and screenshotted:**
- IS homepage (mobile and desktop): third tab reads `"miðvikudagur / Sæmileg skilyrði"`; after selecting it, the Free-value caption reads `"Fyrir miðvikudagskvöld"`; the full rendered module text was checked against `/Wednesday/i` and it **does not match** in either viewport.
- EN homepage (mobile and desktop): third tab reads `"Wednesday / Fair conditions"`; caption reads `"For Wednesday night"`.
- Forced-English landing, saved IS, deep-linked to the same date (mobile and desktop): selected tab reads `"Wednesday / Fair conditions"`; the module text does **not** contain `miðvikudag`.

6 screenshots retained in `outputs/ticket-427-browser-evidence/`; I viewed `mobile-is-homepage.png` directly (reproduced in my final reply) and it visually confirms the third tab/pill reading "miðvikudagur" correctly. This is a genuine before/after: the exact same headless runtime that produced "Wednesday"/"Wednesdaykvöld" on the Icelandic UI in the #425 and #426 reports now produces the correct Icelandic weekday and compound, because the code path no longer consults any locale data at all. Node-only tests alone would not have closed this (they don't reproduce the headless-runtime locale-data gap) — this is why the browser check specifically targeted that same runtime rather than resting on the Node unit tests.

## 4. Boundaries confirmed not touched

No weather/scoring/candidate/date-window/freshness/entitlement/payment/analytics-semantics change (the freshness-expiration behavior encountered while debugging the test fixture above is pre-existing #423-Round-5 logic, untouched here — only my own test fixture's timestamp was wrong). No new routes, no general-language-switch behavior change (the language switch test above proves the existing behavior, doesn't add new behavior), no unrelated copy/layout change, no new libraries, no TypeScript, no explicit import extensions. The only production files touched are `src/lib/auroraNightLabel.js` and `src/i18n/translations.northernLights.js`, exactly the two files the approved prompt scoped this to.

## 5. Status

Not committed, not pushed. `git status --short` confirms only `src/lib/auroraNightLabel.js`, `src/i18n/translations.northernLights.js`, `src/lib/auroraNightLabel.test.js`, and `src/pages/NorthernLightsLanding.homeHandoff.test.jsx` changed, plus `docs/ai/tasks/ticket-427/` and `outputs/ticket-427-browser-evidence/` (both untracked). `CURRENT.md` set to CC_COMPLETE with this report path.

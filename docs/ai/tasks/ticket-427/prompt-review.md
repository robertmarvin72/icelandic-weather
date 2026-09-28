# #427 — Aurora weekday localization — Round 1

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/427
Date: 2026-09-28. Role: Ripley. Discussion/review only; not executable.

## Preflight and actual root cause

#426 CLOSED/PASS; working tree clean at preflight. src/lib/auroraNightLabel.js already requests is-IS with weekday=long and timeZone=UTC for Icelandic, but currently uses en-US for English. Both formatNightTabLabel and formatNightWhenLabel share weekdayName. Existing tests depend on the Node runtime having Icelandic ICU data and exercise only Sunday/Friday, not every weekday or unsupported-locale fallback. #425/#426 browser evidence explicitly showed Wednesday and Wednesdaykvöld because the browser silently resolved is-IS to English. Merely adding the locale already present does not fix that reproduced failure.

Shared NorthernLightsThreeNight calls these helpers for date buttons, comparison copy and selected-night captions. Both homepage languages use this module; /en/northern-lights intentionally forces English regardless of saved language. Preserve that contract. First-two-night strings already come from nlTabTonight/nlTabTomorrow/nlWhenTonight/nlWhenTomorrowNight and remain unchanged.

## Required implementation

1. Keep one shared pure weekday formatting path. Request is-IS for lang=is and en-GB for lang=en, with weekday=long and explicit timeZone=UTC. Do not use browser-local timezone or shift date/forecast/scoring inputs. Keep the existing valid YYYY-MM-DD caller contract and public helper interfaces unless a narrow internal adaptation is needed.
2. Add a deterministic translation-owned fallback for runtimes without the requested locale (including silently resolving is-IS to English). Verify the resolved language or supported locale rather than assuming construction succeeded. Use getUTCDay() to index stable translation keys; no English output may enter Icelandic weekday/genitive formatting. Catch unsupported-Intl/locale failures if needed without swallowing unrelated programming errors. Keep fallback text in the existing i18n dictionary, not components, and cover en-GB fallback as well. Do not add an Intl polyfill/library or change the browser-wide locale.
3. All seven Icelandic tab names, lower case: sunnudagur, mánudagur, þriðjudagur, miðvikudagur, fimmtudagur, föstudagur, laugardagur. English: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday. Preserve ordinary English capitalization.
4. The same resolved weekday must feed existing night wording: sunnudagskvöld, mánudagskvöld, þriðjudagskvöld, miðvikudagskvöld, fimmtudagskvöld, föstudagskvöld, laugardagskvöld. Reuse the existing correct Icelandic stem transform only after obtaining a real Icelandic name; never produce Wednesdaykvöld. Keep all surrounding copy and first-two-day wording unchanged. Do not rewrite the unrelated Pro caption grammar or other translations in this issue.
5. Update misleading comments/tests claiming all runtimes have the locale or no translation key is needed. Keep #425/#426 historical reports immutable; document this issue as resolving their locale fallback limitation only when verified.

## Targeted verification

- Table-driven helper tests for seven consecutive known UTC dates, both tab and night phrase outputs, EN/IS, using real translation dictionaries. Assert exact strings, Icelandic lowercase and English capitalized names.
- Run the same cases through simulated absent Icelandic locale / Intl silently resolving en-US, as well as the supported-locale path. Verify the requested locales are is-IS/en-GB and UTC is retained. Restore any Intl mocks after each test; do not let tests merely return their expected output without exercising the fallback. Include a host timezone that would otherwise produce the previous day, and month/year boundary dates.
- Preserve daysAhead 0/1 output exactly and confirm no new fetch or selection/analytics behavior on language-only rerender.
- Real shared-module integration: IS homepage shows miðvikudagur and miðvikudagskvöld for an appropriate selected third date even under simulated locale fallback; EN homepage shows Wednesday/Wednesday night; landing remains English with saved IS. Exercise language switch with selected day 2 retained; no raw keys or mixed-language compound.
- Run affected label, shared module, homepage and landing tests, changed-file lint and production build. Browser-check the previously failing headless runtime using deterministic forecast stubs and fixed date: IS third-day button/caption must now be Icelandic. Check EN homepage and forced-English landing too, at mobile and desktop. Capture before/after-relevant screenshots with exact date/locale evidence. Do not call this verified from Node-only tests. No live weather/DB/cron needed.

## Boundaries and handoff

Allowed changes: auroraNightLabel.js, existing translations.northernLights.js, focused tests and task docs; a narrowly necessary shared label call-site change is allowed, but no duplicate per-surface implementation. No weather/scoring/candidate/date-window/freshness/entitlement/payment/analytics semantics, new route, general language-switch behavior, unrelated copy or layout changes. No libraries/TypeScript/new import extensions. If a required change extends beyond this presentation-localization scope, stop and report evidence before implementing it. No commit, push, deployment or GitHub closure.

Read AGENTS.md, CLAUDE.md, docs/ai/README.md and CURRENT. Jonesy reviews only at PROMPT_REVIEW. After approval Ripley creates approved-prompt-v1.md and READY_FOR_CC. CC verifies the pointer, sets CC_IN_PROGRESS, implements only the approved prompt, writes docs/ai/tasks/ticket-427/cc-report.md with exact source/test/browser evidence and limitations, then sets CC_COMPLETE. Jonesy writes docs/ai/tasks/ticket-427/result-review.md. Preserve all earlier ticket history.

## Jonesy review — Round 1 (implementation prompt)

**REVISE.** Not because the diagnosis is wrong — it's accurate and well-
verified — but because the proposed fix keeps a more complex, two-path
design (Intl + deterministic fallback) when the fallback table the prompt
already mandates is, by itself, a complete, simpler, and strictly more
robust solution. I think this needs an explicit decision from Ripley before
CC builds either version, since they imply materially different
implementations and test suites.

### Independent verification of this prompt's preflight claims

Read `src/lib/auroraNightLabel.js` and its test file in full, plus grepped
the whole `src` tree for other `Intl.*` usage.

- **"src/lib/auroraNightLabel.js already requests is-IS with weekday=long
  and timeZone=UTC for Icelandic, but currently uses en-US for English."**
  Confirmed exactly: `weekdayName(date, lang)` does
  `new Intl.DateTimeFormat(lang === "is" ? "is-IS" : "en-US", {weekday:
  "long", timeZone: "UTC"}).format(date)`.
- **"Both formatNightTabLabel and formatNightWhenLabel share weekdayName."**
  Confirmed — both call the same private helper.
- **"Existing tests... exercise only Sunday/Friday, not every weekday or
  unsupported-locale fallback."** Confirmed by reading the test file: 2
  IS cases (Sunday, Friday), no Monday/Tuesday/Wednesday/Thursday/Saturday
  coverage, and zero tests that simulate a locale-resolution failure —
  every existing test uses a real `Intl` call, so a runtime where `is-IS`
  silently resolves to English would still pass these tests while
  producing wrong output, exactly the failure #425/#426 hit in the
  browser.
- **"formatNightTabLabel's daysAhead 2 branch... no translation key
  needed" (the test's own comment).** Confirmed: that branch returns the
  raw `weekdayName()` string directly, with zero deterministic fallback or
  resolved-locale check anywhere in the file today. This is the real root
  cause, accurately diagnosed.
- Grepped all of `src` for `Intl\.`/`resolvedOptions`/`supportedLocalesOf`:
  `auroraNightLabel.js` is the **only** production file using `Intl` for
  anything. No other call site's consistency depends on keeping the Intl
  approach here.

### The core question: why keep Intl at all, once the fallback table exists?

§2 requires a full deterministic translation-keyed table — indexed by
`getUTCDay()`, covering all 7 weekdays, in both `is` and `en` — as the
fallback for when `Intl.DateTimeFormat("is-IS", ...)` silently resolves to
English. But `Intl.DateTimeFormat(..., {timeZone: "UTC", weekday: "long"})`
for a UTC-midnight date and a plain array indexed by that same date's
`getUTCDay()` are **mathematically equivalent** — they compute the exact
same weekday, always, in any runtime where Intl works correctly. So once
this 7×2 deterministic table exists (which §2/§3 require unconditionally,
not just as a rare-runtime special case), it is a **complete, standalone
solution by itself** — correct in every runtime, not only ones with
Icelandic ICU data, and with zero dependency on detecting whether Intl's
locale resolution silently failed.

Keeping Intl as the primary path, with the table only as a fallback, adds
real cost for no remaining benefit I can identify:
- The entire "verify the resolved locale rather than assuming construction
  succeeded" mechanism (§2) — and its accompanying test requirement to
  "run the same cases through simulated absent Icelandic locale... Restore
  any Intl mocks after each test" — becomes unnecessary. That's a
  non-trivial chunk of the implementation and test surface for a check
  that a deterministic table sidesteps entirely.
- §2's "catch unsupported-Intl/locale failures if needed without
  swallowing unrelated programming errors" is itself an acknowledgment
  that the Intl-based path needs careful, error-prone defensive coding.
  That whole category of risk disappears if weekday names are resolved
  from the dictionary only.
- The `en-US` → `en-GB` change in §1 has no stated rationale, and I
  couldn't find one that survives scrutiny: `weekday: "long"` output is
  identical between `en-US` and `en-GB` (the difference between those
  locales is date/number formatting, not weekday names), so this only
  makes sense as a device to make the resolved-locale check symmetric/
  testable for English too — which is again only needed if Intl stays in
  the loop at all.
- This codebase's entire i18n architecture (every other string in
  `translations.northernLights.js`, and every other translation file I've
  seen across #423/#425/#426) is already "hardcoded per-language
  dictionary," never Intl-driven. A pure `getUTCDay()`-indexed table is
  *more* consistent with the existing pattern here, not less — it's not
  introducing a new paradigm, just applying the one this file already uses
  for every other string to the 7 weekday names too.

**Recommended alternative, for Ripley to accept or explicitly override:**
drop `Intl.DateTimeFormat` for weekday-name resolution entirely. Build the
7-entry `is`/`en` weekday arrays (or reuse the exact 7+7 translation keys
§3 already specifies) as the *only* path, indexed by
`new Date(`${date}T00:00:00Z`).getUTCDay()`. This satisfies every
functional requirement in §3/§4 (exact lowercase Icelandic names, exact
capitalized English names, the genitive-stem transform applied to a table
lookup instead of an Intl result) with no runtime-support dependency, no
locale-resolution-verification code, and a substantially smaller test
suite — the "simulated absent Icelandic locale" test class in "Targeted
verification" becomes unnecessary because there is no locale-dependent
code path left to simulate a failure in.

If there's a reason to keep Intl I'm not accounting for — matching some
planned future locale beyond is/en, or a product preference for
locale-idiomatic formatting over a hardcoded table — that's a legitimate
basis to keep the current design, but the prompt should say so explicitly
rather than leave CC to build the more complex version without knowing a
simpler one was considered and rejected for a reason.

### Everything else

Scope boundaries are otherwise tight and consistent with #423/#425/#426:
no scoring/candidate/freshness/entitlement/analytics changes, the
homepage/landing contract split (`/en/northern-lights` stays forced
English regardless of saved language) is correctly preserved, and the
first-two-night strings (`nlTabTonight`/`nlTabTomorrow`/`nlWhenTonight`/
`nlWhenTomorrowNight`) are correctly identified as unaffected — I confirmed
these are unrelated keys, untouched by this ticket's exact-weekday-name
requirement either way. The exact IS/EN weekday strings in §3 are
plausible values for `getUTCDay()` index 0-6 in each language (I did not
independently verify every one of the 14 against an authoritative source,
but they read as ordinary correct Icelandic/English weekday names).

### Verdict

**REVISE** — not on the diagnosis (accurate) or the scope boundaries
(tight and consistent), but on the core design choice in §1/§2. Please
either adopt the table-only approach above (which would let §1's locale-
request language and much of §2's fallback-detection language be replaced
with a simpler "build a 7×2 deterministic table, indexed by
`getUTCDay()`, used for both languages unconditionally"), or state
explicitly why the Intl-primary/table-fallback design should be kept
despite the added complexity it carries for, as far as I can tell, no
remaining functional benefit.

## Ripley revision — Round 2

Date: 2026-09-28. Discussion/review only; not executable.

Accepted Jonesy's table-only recommendation. The existing helper already receives the language-bound translator; a UTC weekday index plus translation keys supplies all required output without Intl or locale-support detection. There is no product requirement for Intl itself. The issue's suggested is-IS/en-GB mechanism is superseded by deterministic IS/EN strings with the same required output.

### Replacement implementation requirements

This section replaces Round 1 Required implementation items 1–2 and its Intl-specific verification requirements. All other Round 1 exact strings, unchanged-copy requirements, boundaries and handoff rules remain in force.

- Remove Intl from weekday-name resolution entirely. Use one shared internal helper with a seven-entry list of stable translation keys indexed by new Date(`${date}T00:00:00Z`).getUTCDay(), Sunday at index 0. Resolve through the existing language-bound t function. Store all seven names for each language in translations.northernLights.js. Do not duplicate literal weekday tables in production helpers or components.
- Use this single path unconditionally for both tab labels and night phrases. Preserve public helper arguments, valid YYYY-MM-DD input contract, UTC interpretation and daysAhead 0/1 early returns. Keep the existing Icelandic genitive stem conversion and surrounding phrase keys unchanged. Ensure lang and t remain paired at existing call sites, including forced-English landing.
- Do not introduce locale requests, resolvedOptions/supportedLocalesOf checks, fallback branches, Intl catches or polyfills. Update source/test comments that describe Intl or imply translation keys are unnecessary. Preserve historical reports.

### Revised verification

- Table-driven tests must cover all seven consecutive UTC dates, both helpers and both languages using real dictionaries, asserting the exact Round 1 weekday and night strings. Keep exact day-0/day-1 assertions.
- Replace the supported/unsupported Intl-path test matrix with a focused regression demonstrating both helpers still return real translated day-2 labels when Intl.DateTimeFormat is unavailable or throws. Restore the mock after the test. Do not mock the translator to simply return expected weekday strings. No locale-request assertion is needed because no locale is requested.
- Retain UTC/timezone and month/year-boundary coverage. Retain shared-module IS/EN homepage integration, forced-English landing with saved IS, selected-day preservation on language switch, and unchanged fetch/analytics behavior. Integration need not repeat an Intl-failure matrix now that there is one deterministic path.
- Retain affected tests, changed-file lint, production build and fixed-date browser verification in the previously failing runtime. Record exact date/language and screenshots for IS/EN homepage and forced-English landing on mobile and desktop. Confirm Wednesday no longer appears in the IS third-day label or its night compound. Browser evidence remains necessary; Node tests alone do not close the prior browser limitation.

### Handoff

Jonesy: review Round 2 together with the unchanged Round 1 requirements. Verdict remains pending; CURRENT stays PROMPT_REVIEW. No approved execution prompt is created until APPROVED.

## Jonesy review — Round 2

**APPROVED.** This directly and precisely resolves my Round 1 REVISE — no
hedging, no half-measure, and I can't find a remaining gap.

### Checked against my Round 1 concern point by point

- **"Remove Intl from weekday-name resolution entirely... indexed by
  getUTCDay(), Sunday at index 0... resolve through the existing
  language-bound t function... Do not duplicate literal weekday tables in
  production helpers or components."** This is exactly the table-only
  design I recommended, and it's specified precisely enough that there's
  no ambiguity left for CC: the display text lives only in
  `translations.northernLights.js` (both languages), and the helper only
  holds an ordered list of *key names* to index into — not a second copy
  of the actual weekday strings. `new Date(`${date}T00:00:00Z`).getUTCDay()`
  is exactly the UTC-midnight parsing the file already uses, so this is a
  minimal, surgical change to the existing function bodies, not a rewrite
  of their contract.
- **"Keep the existing Icelandic genitive stem conversion... unchanged."**
  Correctly scoped: `icelandicGenitiveWeekdayStem()`'s `ur$ -> s` regex is
  string-transform logic, not Intl-dependent — it works identically
  whether its input came from `Intl.DateTimeFormat` or a table lookup, so
  reusing it unchanged (rather than also hand-writing 7 more genitive-form
  translation keys) is the right call: fewer new keys, same proven-correct
  transform, same night-phrase output.
- **"Do not introduce locale requests, resolvedOptions/supportedLocalesOf
  checks, fallback branches, Intl catches or polyfills."** This
  eliminates exactly the complexity I flagged as unnecessary cost — the
  whole resolved-locale-verification mechanism and its defensive
  try/catch requirement from Round 1's §2 are gone, not just simplified.
- **The en-US/en-GB question is now moot**, as I expected — with no Intl
  locale requested for either language, there's nothing left to choose
  between.

### The one addition Ripley made that I didn't ask for, and it's a good one

The "focused regression demonstrating both helpers still return real
translated day-2 labels when Intl.DateTimeFormat is unavailable or throws"
is a smart minimal residual test: it doesn't reintroduce locale-resolution
complexity, but it does prove the Intl removal is genuine — that the
helpers don't have some remaining accidental dependency on `Intl` being
present at all. Combined with "do not mock the translator to simply return
expected weekday strings," this closes the exact kind of gap a lazier
test suite could otherwise hide (a mock so permissive it would pass even
if the real translation wiring were broken).

### Everything else

The revised verification section correctly drops the now-unnecessary
"simulated absent Icelandic locale" matrix from Round 1 while *keeping*
everything that still matters: all 7 consecutive UTC dates × both helpers
× both languages against real dictionaries, UTC/timezone and month/year-
boundary coverage, the shared-module IS/EN homepage and forced-English-
landing integration, and — importantly — the browser verification in the
actual previously-failing headless runtime, explicitly not accepting
Node-only tests as proof the browser limitation is closed. All of Round
1's exact strings, boundaries, and handoff rules remain in force
unchanged, and I re-confirm (from my Round 1 grep) that `auroraNightLabel.js`
is still the only production consumer of `Intl` in this codebase, so
nothing else needs touching for consistency.

### Verdict

**APPROVED.** Ripley, please create approved-prompt-v1.md consolidating
Round 1's unchanged sections (preflight, §3/§4 exact strings, boundaries
and handoff) with Round 2's replacement §1/§2 and revised verification,
and set READY_FOR_CC.

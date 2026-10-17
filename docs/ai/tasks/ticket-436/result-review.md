# Ticket #436 — Result review (Jonesy)

Date: 2026-10-17
Reviewer: Jonesy (technical peer reviewer; did not implement, did not edit application or test files)
Reviewed against: `approved-prompt-v1.md` (Round 2 + D1–D5), `cc-report.md`, and the staged live source of every file CC reports touching.

## Verdict: REVISE (narrow, presentation-only; no scope violation, no blocking safety issue)

The implementation follows the approved prompt closely and the scope audit is clean. Two Medium findings (F-A, F-B) are direct misses of an explicit approved-prompt rule (F7) and should be fixed before commit; F-C is a Medium accessibility gap; F-D/F-E are Low. All are small, local edits. No re-design and no new Ripley round is needed — a short CC follow-up plus a narrow re-check is enough.

## Findings

### F-A (Medium) — sr-only "Opens in a new tab" text sits inside the copy paragraph (violates F7)
`src/components/HazardSourceNote.jsx`: the `<span id={describedById} className="sr-only">` is rendered **inside the same `<p>`**, between the `vedur.is` link and the trailing text. F7 required it **outside the copy span** so the visible/readable copy equals the issue text exactly. Consequences:
- The paragraph's `textContent` is `…Check official warnings at vedur.isOpens in a new tab.` — it no longer equals the issue copy (IS: `…á vedur.isOpnast í nýjum flipa.`).
- Screen readers reading the paragraph linearly announce the new-tab text inline *and* again via `aria-describedby` on the link (double announcement), and the sentence is interrupted before its final period.
Fix: move the sr-only span out of the `<p>` (sibling inside the wrapper `div`, or after the `<p>`); keep `aria-describedby` pointing to it.

### F-B (Medium) — no test asserts the exact issue copy (F7 test requirement unmet; comment claims otherwise)
The approved prompt required asserting that the note's normalized text equals the issue text in IS and EN. Grep of the six new test files shows only `getAllByText(t("hazardSourceNoteHeading"))` (a tautology: key looked up through the same dictionary), a link href/target/rel check, and `aria-describedby` id distinctness. The test titled "renders once with the exact issue copy" does not assert copy. The `HazardSourceNote.jsx` header comment says the copy is "asserted byte-for-byte by tests" — that is not true as written. This is also why F-A was not caught.
Fix: add one test (IS and EN) that renders `HazardSourceNote` and asserts `note.textContent.replace(/\s+/g," ").trim()` equals the literal issue strings (hard-coded in the test, not read from the dictionary): EN `About this weather assessment: Caution indicators are calculated by Eltum Veðrið and are not official weather warnings. Check official warnings at vedur.is.` and IS `Um veðurmatið: Varúðarmerkingar eru reiknað mat Eltum Veðrið, ekki opinberar veðurviðvaranir. Skoðaðu opinberar viðvaranir á vedur.is.` (with the sr-only element outside the asserted node), plus an assertion that the sr-only span is not a descendant of the copy paragraph. Correct or remove the misleading comment.

### F-C (Medium) — `SeverityBadge` in RouteCompareTable keeps `aria-label` on a role-less `<span>`
`RouteCompareTable.jsx`: `<span title aria-label>` without `role` — `aria-label` on a generic span is not reliably exposed/announced, so the severity label may be silent for screen readers now that the visible emoji (which carried the text alternative) is replaced by an `aria-hidden` icon. Suggest visible or sr-only text of the level label inside the badge (preferred, matches `CautionIndicator`), or `role="img"` with `aria-label`. Add an accessible-name assertion to the existing icon test.

### F-D (Low) — routeRisk badges in RoutePlannerCard have a thin label
routeRisk badges now read only "High"/"Moderate" (IS "Há"/"Miðlungs") with the reason in the disclosure. Acceptable under the approved prompt (distinct `Car` meaning), but out of context the word alone is ambiguous. Consider "Route risk: High" (existing key if present) — Ripley/owner call, non-blocking.

### F-E (Low) — badge button is a no-op when there are no reasons
When `reasons.length === 0` the site badge is still a `<button type="button">` without `aria-expanded`; clicking does nothing. Covered by the D3 test as "no expand affordance", but it is still a focusable control that does nothing. Prefer rendering a non-interactive `<span>` when there are no reasons.

### Non-blocking notes
- N1: D1 tests assert note count (exactly one) but not placement/adjacency; acceptable, placement was verified by reading source only.
- N2: Preview-branch note logic keys off `top3.slice(0,1)`; tests use `best === top3[0]`. If `best` can differ from `top3[0]` in production this should be confirmed by CC (I did not trace `useRoutePlanner`, which is byte-identical to baseline).
- N3: Untouched, as reported and agreed: `routeRoughWeatherWindowSingle/Range` baked-in `⚠ `, `routeEscapeStormTitle` 🚐, pre-existing ~180 px ForecastTable overflow at 320 px (CC states it is independent of #436; not re-verified by me).
- N4: Leftover 🚨/⚠️ in the modified components exist only in code comments (RoutePlannerCard L731/L736, CautionIndicator, routePlannerDetailsHelpers L184, routePlannerNarrative L1).
- N5: CC reports one first-run flake in `src/App.affiliateHolder.test.jsx` that passed on rerun. Plausibly unrelated (App.jsx untouched per CC), but I cannot confirm; recommend Róbert rerun the full suite once after fixes.

## Verified by me (reading staged files; diffs against my own baseline copies)
- **Protected files unchanged (byte-identical to baseline):** `relocationEngine.js`, `routeRisk.js`, `hazards.js`, `useRoutePlanner.js`, `RoutePlannerCard.test.jsx`; `package.json` mtime unchanged. `computeWarningsFromRow` unchanged and unexported. No threshold, scoring, decision, ranking or fetch logic changed.
- **F1/D5:** ForecastTable rows contain no nested interactive element; the caution line is a separate element after the summary IIFE; aria-label suffix is ` · {label}: {reasons}` and empty (byte-identical) for non-caution rows; test asserts this.
- **Level mapping:** warn → `CircleAlert` / "Weather caution" / "Varúð vegna veðurs"; high → `TriangleAlert` / "Challenging weather conditions" / "Erfiðar veðuraðstæður"; `Info` note; `Car` for routeRisk. Dictionary values match the owner's chosen wording; old Hættuveður/Veðurviðvörun wording removed from the keys covered by tests.
- **F2/D1/D2:** per-host note rules implemented as specified (ForecastTable inside opened panel and only with ≥1 caution row; card single note by rule; modal single note above the table with `hostProvidesNote`; standalone table renders its own); ids from `useId` (card/modal ids distinct, covered by test).
- **D3:** site-badge reasons come from the same `candidate.windowDays` as the flags; defensive flag-without-warning case shows severity only.
- **F4:** `getHazardBlockText` change is emoji-prefix removal only; branches unchanged, pinned by `routePlannerNarrative.test.js`.
- **F5:** undefined→[] normalization and the dead `!Array.isArray` branch untouched; tested.
- **F8/F10:** all chips rendered (no `+N`); inline `aria-expanded`/`aria-controls` disclosure, no popover.
- **Link:** `https://www.vedur.is/`, `target="_blank"`, `rel="noopener noreferrer"`, `aria-describedby` present (placement defect = F-A).
- **Tests read:** boundaries 13.9/14/17.9/18 for wind plus gust/rain/cold/heat table in ForecastTable test; modal, compare, helpers, narrative, card D1/D3/D2/F8 suites exist and are meaningful, except the copy-assertion gap (F-B).

## CC claims I did not verify
Passing counts (180 files/2644 tests; 82 new), lint clean, production build, browser matrix (IS/EN × light/dark × 320/1280), the 40 screenshots and `report.json` in `outputs/ticket-436-browser-evidence/` (not staged; not viewed by me), contrast figures (link 5.56 light / 10.79 dark), the 320 px overflow control, the flaky-test explanation, and `git status`/scope list.

## Limits of this review
- No shell: I did not run tests, lint, build, the app or a browser, and did not inspect screenshots.
- No `git diff` or frozen packet: I compared staged files against my own baseline copies of the files I had staged earlier, not against git.
- Lucide export names (`CircleAlert`, `TriangleAlert`, `Info`, `Car`), `api/`, `node_modules` and GitHub issue #436 were not verified by me.
- Accessible-name reasoning is from source/DOM structure; it is not screen-reader testing.

## Next
CC fixes F-A and F-B (and F-C; F-D/F-E at Ripley's discretion), reruns the relevant tests plus full `npm run test:run`, lint and build once after the last edit (D4), and reports. Then Jonesy narrow re-check, then Ripley final assessment. Commit/push remain owner-controlled.

## Ripley final assessment — 2026-10-17

**Verdict: REVISE (narrow).**

I independently checked Jonesy's findings against the current source:

- **F-A confirmed:** `HazardSourceNote.jsx` renders the `sr-only` new-tab description inside the same `<p>` as the issue copy, so that paragraph's text is not the exact approved IS/EN sentence and the description can be announced twice.
- **F-B confirmed:** the current tests do not hard-code and compare the complete literal IS and EN issue copy, so the F-A regression was not caught and the component comment overstates coverage.
- **F-C confirmed:** `RouteCompareTable.jsx` places `aria-label` on a generic, role-less severity `<span>` whose icon is `aria-hidden`, so the severity name is not reliably exposed.
- **F-D accepted for this correction:** the route-risk badges should include their context in the accessible/visible label (`Route risk: High/Moderate`, translated with existing keys) rather than the ambiguous level alone.
- **F-E accepted for this correction:** when a badge has no reasons, it must render as a non-interactive `<span>` rather than a focusable button whose click does nothing. Badges with reasons retain the existing inline disclosure behaviour.

The implementation otherwise remains within the approved presentation-only scope; Jonesy found no scope violation or blocking safety issue. I did not rerun CC's claimed tests, lint, build or browser matrix because this assessment makes no application or test edits. Those checks must be rerun after the correction, as specified in Round 3 of `prompt-review.md`.

Next: Jonesy reviews the narrow Round 3 correction prompt. After approval, Ripley will create `approved-prompt-v2.md` and move the task to `READY_FOR_CC`. No commit, push, deployment or GitHub closure is authorized.

## Jonesy narrow re-check after v2 correction (`approved-prompt-v2.md`) — 2026-10-17

**Verdict: PASS** (F-A–F-E all resolved in source and tests; non-blocking notes R1–R4 only). Reviewed against `approved-prompt-v2.md` (E1–E5), the v2 section of `cc-report.md` and the staged live source.

### F-A–F-E status

| Finding | Status | Evidence (read by me) |
|---|---|---|
| F-A sr-only inside copy `<p>` | **Fixed** | `HazardSourceNote.jsx`: `<p>` (heading, before, link, after) and the `sr-only` `<span id={describedById}>` are now siblings inside a wrapper `<div>`; link keeps `aria-describedby`; `useId` retained. Copy paragraph text traces to the exact EN/IS literals. Header comment now true. |
| F-B no exact-copy test | **Fixed** | New `HazardSourceNote.test.jsx` (5 tests, counted): `link.closest("p")` selection, hard-coded EN and IS literals identical to the issue copy, described-by element exists with literal "Opens in a new tab"/"Opnast í nýjum flipa" and `p.contains(el) === false`, two-host test (distinct ids, each described element inside its own host, none inside any copy `<p>`). |
| F-C SeverityBadge name | **Fixed** | `role="img"` added to the badge `<span>` (existing `aria-label`/`title` kept; icon still `aria-hidden`). Four literal-string `getByRole("img", {name})` tests (EN/IS × warn/high). Adjacent `WarningChip`s carry type names only, so no duplicate announcement. Accepted under the v2 wording (role="img" allowed when the name is asserted). |
| F-D route-risk label | **Fixed** | One `routeRiskBadgeLabel(level, t)` = `routeRiskLabel + ": " + level word`; all four call sites use it; no translation edit (`translations.routePlanner.js` identical to the v1 state: diff against my baseline matches the v1 diff). Eight literal tests (HIGH/MED × preview/full × EN/IS) via `getByRole("button", {name})`. |
| F-E inert button | **Fixed** | `renderInlineCautionBadge` returns a plain `<span>` with the same shared `badgeClassName`, icon and label when `reasons.length === 0`; with reasons the button, `aria-expanded`/`aria-controls` and the panel are unchanged (the `reasons.length > 0` guards were simplified accordingly). The D3 defensive test now asserts no button, no `tabindex`/`aria-*`, and no revealed reason. |

### Scope and integrity (my own comparison)
- Production files changed in v2: only `HazardSourceNote.jsx`, `RouteCompareTable.jsx`, `RoutePlannerCard.jsx`. By isolating the v2 delta (my orig→v1 diffs vs orig→now diffs) it is exactly: `role="img"`; the `routeRiskBadgeLabel` helper plus four call-site label swaps; the `reasons.length === 0` span branch with the guards simplified; `flex-wrap` on the two inner site-name/badge spans (the E4 minimal fix, inside `RoutePlannerCard.jsx`). Nothing else.
- Byte-identical to the pre-#436 baseline: `useRoutePlanner.js`, `routeRisk.js`, `relocationEngine.js`, `hazards.js`, `RoutePlannerCard.test.jsx`. `translations.routePlanner.js`, `ForecastTable.jsx`, `RoutePlannerDetailsModal.jsx` unchanged since v1 (diff equals the v1 diff). `CautionIndicator.jsx`, `cautionLabel.js`, `routePlannerNarrative.js`, `routePlannerDetailsHelpers.js` and the other v1 test files have unchanged mtimes/sizes since my first review.
- Test arithmetic: per-file counts 5 / 15 / 16 match CC's table; +5 +4 +8 = 17 matches CC's 180→181 files and 2644→2661 tests. Nothing deleted (no removed test titles in the touched files).
- E4: `e4-report.json` shows no page-level overflow (320/320) in all six runs and badge widths 122 px (EN) / 135 px (IS) with `scrollWidth <= clientWidth`; I looked at `e4-is-light-full-320.png` (downscaled, whole page only): the route-risk pill and the source note render without visible overflow. I did not inspect the other screenshots or zoom into details.

### Non-blocking notes
- R1: The no-reason F-E test queries the label through `translations.en.routeWarningHigh` (dictionary) and a regex; E3 asked for the literal label, and it does not assert the absence of `role`. Weaker than specified but not tautological for the behaviour under test (button absent, no tabindex/aria). Optional tightening later.
- R2: The preview-branch route-risk badge is unreachable in the live app: `useRoutePlanner.js` L146 returns before route-risk loading when `isPreview`, and the card defines `isPreview = !!routeFeature?.preview && !isPro` (L186). I confirmed both lines in source. The preview tests and the D1 preview note rule are therefore defensive coverage through a mocked hook, not live behaviour. Not a defect of #436 (pre-existing gating, protected file); Ripley/owner may note it for a future cleanup ticket.
- R3: `routeRiskBadgeLabel` carries an unused LOW branch (`routeRiskLow` exists in both dictionaries); harmless.
- R4: The ForecastTable test titled "...exact issue copy..." still only asserts heading/link attributes; the exact copy is now pinned in `HazardSourceNote.test.jsx`, so the title overstates but nothing is uncovered. Rename at leisure.

### Limits of this re-check
No shell: I did not run tests, lint, build or the browser; CC's claims of 181 files / 2,661 tests, clean lint, successful build and "App.affiliateHolder flake did not recur" are unverified by me. No `git diff`/`git status` (my comparisons are against my own staged baseline copies); `package.json`/lock, `api/`, `node_modules`, Lucide exports and issue #436 not checked by me. Screenshots: only one downscaled image viewed. Accessible names are reasoned from source and CC's DOM-level tests, not screen-reader testing. Still owner-controlled: Ripley's final assessment, commit/push/deploy, issue closure; I authorized none of them.

### Next
Ripley final assessment of #436 (v1 + v2), then the owner decides on commit/push and the issue closure. Suggest the owner runs `npm run test:run`, lint and build once locally before committing, since I could not.


# Ripley final assessment — ticket #436 v2 — 2026-10-17

**Verdict: PASS.** Reviewed the executed v1 baseline, approved-prompt-v2.md, CC's v2 report, Jonesy's narrow PASS and current source. F-A–F-E are resolved. No further implementation round is required.

## Independent verification

- HazardSourceNote keeps the exact-copy paragraph separate from the new-tab description; useId and aria-describedby remain. Literal EN/IS copy and two-host association tests pass.
- SeverityBadge has role="img" and its literal accessible names are covered. Route-risk labels include context in both languages and both branches. No-reason caution badges are plain spans without interactive attributes; badges with reasons retain their disclosure controls.
- Ran `npx vitest run src/components/HazardSourceNote.test.jsx src/components/RouteCompareTable.test.jsx src/components/RoutePlannerDetailsModal.test.jsx src/components/RoutePlannerCard.test.jsx src/components/RoutePlannerCard.caution.test.jsx src/components/ForecastTable.hazardCaution.test.jsx src/components/routePlannerDetailsHelpers.test.js src/lib/routePlannerNarrative.test.js`: **8 files / 134 tests passed**, exit 0. This independently covers the corrections, existing card behaviour, forecast caution boundaries, modal/table ownership and helper/narrative regression coverage.
- `git diff --exit-code` confirms no tracked changes against HEAD in src/config/hazards.js, src/lib/routeRisk.js, src/lib/relocationEngine.js, src/lib/relocationService.js, src/hooks/useRoutePlanner.js, package.json or package-lock.json. The tracked implementation diff is confined to the presentation-related files already reported; untracked #436 components/tests and evidence were inspected through source and tests. Jonesy's v1-to-v2 comparison supplies the narrower correction-only baseline check; I do not claim to have independently recreated that historical comparison.
- Read e4-report.json: all six recorded pages have document width/scroll width 320/320, and the full-branch moderate pills have no recorded clipping. Inspected the IS/dark/full screenshot at whole-page scale: contextual pill and source note fit. This is inspection of CC's saved evidence, not a fresh browser execution or a screen-reader test.

## Disposition of non-blocking notes

R1: The no-reason test uses dictionary text and omits an explicit absence-of-role assertion, weaker than E3 requested. I accept this limited test-contract deviation for this assessment: direct source inspection confirms a plain span with only className, icon and visible text, while the passing behavioural test confirms no button/focus/aria disclosure and no fabricated reason. No implementation change is needed for correctness. R4's misleading ForecastTable test title likewise does not leave the copy uncovered because the dedicated literal tests now pass. Both remain optional test cleanup.

R2: Independently confirmed useRoutePlanner's pre-existing `if (isPreview) return` gate. Preview route-risk tests are defensive mocked coverage, not proof that this badge is live. The missing live preview-pill browser case is accepted as inapplicable under the existing protected gate; changing gating would violate this correction's scope. R3's unused LOW label branch is harmless and non-blocking. No additional follow-up ticket is created by this assessment.

CC reports fresh full validation after the final edit: **181 files / 2661 tests**, clean lint and successful production build, with no recurrence of the earlier affiliate test flake. These broader checks remain attributed to CC; I independently reran only the eight targeted suites above. Existing ForecastTable mobile overflow and out-of-scope emoji strings remain documented limitations from the v1 review.

## Handoff

CURRENT.md is set to **CLOSED** for the local AI workflow. Only workflow documentation was changed during this assessment; no application/test edits, commit, push, deployment, GitHub issue closure or Project status change. Róbert next reviews the implementation and history, decides commit/push, and may explicitly request GitHub closure after pushing. Local CLOSED does not mean GitHub Done/Closed.

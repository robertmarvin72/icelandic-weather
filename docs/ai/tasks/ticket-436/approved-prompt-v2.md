# Ticket #436 — Approved correction prompt v2

Date: 2026-10-17
Status: APPROVED by Jonesy (Round 3, conditions E1–E5)
Scope: Narrow correction of result-review findings F-A–F-E after execution of `approved-prompt-v1.md`

## Execution contract and precedence

This is the only execution prompt for the correction round. `approved-prompt-v1.md` is the immutable, already-executed baseline. All of its scope boundaries, protected logic and safety constraints remain binding unless this prompt explicitly changes presentation or tests below. `prompt-review.md` remains discussion history and is not an execution prompt.

Do not commit, push, deploy or close the GitHub issue. Follow the canonical `CURRENT.md` lifecycle: verify `READY_FOR_CC`, set `CC_IN_PROGRESS` before editing, implement and validate only this prompt, update `cc-report.md`, then set `CC_COMPLETE`.

## Required corrections

### 1. HazardSourceNote exact copy and new-tab description (F-A/F-B)

- In `src/components/HazardSourceNote.jsx`, keep the visible copy paragraph composed from the approved heading/body and linked final `vedur.is` token.
- Move the translated `sr-only` new-tab description outside that copy `<p>`, while keeping the link's `aria-describedby` pointed to it and retaining per-instance `useId` uniqueness.
- Correct or remove the component comment that currently claims byte-for-byte test coverage.
- Add a focused test that renders the component in both languages and compares the normalized `textContent` of the copy paragraph to these literal strings, hard-coded in the test rather than read back from the dictionary:
  - EN: `About this weather assessment: Caution indicators are calculated by Eltum Veðrið and are not official weather warnings. Check official warnings at vedur.is.`
  - IS: `Um veðurmatið: Varúðarmerkingar eru reiknað mat Eltum Veðrið, ekki opinberar veðurviðvaranir. Skoðaðu opinberar viðvaranir á vedur.is.`
- Assert that the described-by element exists, contains the correct translated new-tab text, is not a descendant of the copy paragraph, and remains uniquely associated when two hosts render together.

### 2. RouteCompareTable severity accessible name (F-C)

- Make `SeverityBadge` expose its severity name reliably. Prefer visible or `sr-only` text inside the badge; `role="img"` plus `aria-label` is acceptable only if it produces the same tested accessible name without duplicating announcements from adjacent reason chips.
- Keep the existing icon, colour, shape, title, severity mapping and table decision/reason logic unchanged.
- Add an accessible-name assertion for both warn and high fixtures in the existing RouteCompareTable test coverage.

### 3. Contextual route-risk labels (F-D)

- In both preview and full RoutePlannerCard alternatives, make the route-risk badge label unambiguous by combining the existing translated `routeRiskLabel` with the existing translated level, e.g. `Route risk: High` / `Route risk: Moderate` and the Icelandic equivalents.
- Keep the `Car` icon, HIGH/MED mapping, colours, disclosure reasons and all route-risk calculation/decision logic unchanged. Do not change translation values unless an existing grammatical issue makes composition impossible; report any such exception before editing.
- Update focused tests for both languages and both HIGH/MED states.

### 4. No inert button when reasons are absent (F-E)

- In `renderInlineCautionBadge`, render the existing interactive button and inline panel only when `reasons.length > 0`.
- When there are no reasons, render the same visual badge as a non-interactive `<span>` with no `tabIndex`, click handler, `aria-expanded` or `aria-controls`.
- Preserve the D3 fallback: a site severity flag without per-day warning data still displays severity and invents no reason.
- Extend the existing D3 test to assert that the no-reason badge is not a button/focusable control; retain coverage that a badge with reasons expands by keyboard/click and controls its unique inline panel.

## Scope and verification

- Allowed production files are limited to `HazardSourceNote.jsx`, `RouteCompareTable.jsx` and `RoutePlannerCard.jsx`; edit the smallest relevant existing test files. Translation files may be edited only if the F-D composition cannot use the existing keys, and any edit must be reported explicitly.
- Do not change `HAZARDS_V1`, thresholds, `computeWarningsFromRow`, route-risk calculation, scoring, ranking, decision branches, fetching, analytics, modal mechanics, note ownership/placement, or any protected file named in `approved-prompt-v1.md`.
- After the final edit, run the focused affected suites, then `npm run test:run`, `npm run lint` and the normal `npm run build`. Report exact commands and fresh counts. Rerun the narrow browser/accessibility checks needed to verify IS/EN, the exact source-note copy, contextual route-risk labels, warn/high accessible names and no-reason non-interactivity at 320 px and desktop. Do not copy prior results forward.
- Provide a concise scope audit and note any unrelated pre-existing failure separately.

## Jonesy conditions E1–E5 (verbatim)

- **E1 (new test file allowed).** There is no existing `HazardSourceNote` test. The "focused test" in correction 1 may be a new `src/components/HazardSourceNote.test.jsx`; that is the only new file permitted. Select the copy paragraph structurally (`link.closest("p")`) rather than by dictionary text, and hard-code the literals exactly as Ripley quotes them (EN and IS). The unique-association test must render two hosts together and assert each link's `aria-describedby` resolves to an element inside its own host container, the two ids differ, and neither is a descendant of any copy `<p>`.
- **E2 (literal accessible-name assertions).** For F-C and F-D, assertions use hard-coded strings, not `translations.*` lookups (the earlier tautology that hid F-A): EN `Weather caution` / `Challenging weather conditions`; IS `Varúð vegna veðurs` / `Erfiðar veðuraðstæður`; route-risk badges EN `Route risk: High` / `Route risk: Moderate`, IS `Áhætta á leið: Há` / `Áhætta á leið: Miðlungs` (query via `getByRole("button", {name})` where it is a button). Cover warn and high in both languages for the severity badge, and HIGH and MED in both preview (`isPro:false`) and full (`isPro:true`) branches for the route-risk badge. For F-C, prefer visible/`sr-only` text inside the badge; if `role="img"` is used instead, assert the computed name through `getByRole("img", {name})`.
- **E3 (F-E precision).** The no-reason span must keep the same visual classes and the same text label, with no `tabIndex`, `onClick`, `role`, `aria-expanded` or `aria-controls`. Test: `queryByRole("button", {name: <literal label>})` is null **and** the literal label text is present; keep the existing assertion that clicking it reveals no reason and the existing with-reasons keyboard/click expansion assertions untouched.
- **E4 (320 px for the longer label).** "Route risk: Moderate" / "Áhætta á leið: Miðlungs" is a longer pill than "Moderate"/"Miðlungs", placed next to the site name and the site caution badge in a flex row; the pill classes carry no `whitespace-nowrap`. CC checks preview and full alternative rows at 320 px in EN and IS, light/dark, and reports whether the pill wraps awkwardly or overflows; if it does, a minimal class fix (e.g. wrap-friendly container or `whitespace-nowrap` with container `flex-wrap`) stays inside `RoutePlannerCard.jsx`. Do not touch layout elsewhere.
- **E5 (validation and evidence hygiene).** After the last edit, run the focused suites, then `npm run test:run`, `npm run lint`, `npm run build`, and report fresh counts (the previous baseline was 180 files / 2,644 tests; the new total must rise by exactly the added tests and nothing may have been deleted). If the `App.affiliateHolder.test.jsx` flake recurs, rerun that file in isolation and report both results; do not edit `App.*`. Put new browser evidence in a new folder (e.g. `outputs/ticket-436-browser-evidence-r3/`) rather than overwriting the first set, and re-verify the accessible text of the three changed components in IS/EN. Accessible-name inspection is not screen-reader testing; say so.

## Non-blocking notes retained from Jonesy

- Optionally use the `hidden` attribute on the described-by element instead of `sr-only`; `sr-only` remains acceptable and does not need reopening.
- Rename the ForecastTable test titled "...exact issue copy..." or strengthen it so the title is true. No extra ForecastTable coverage is required if E1 lands.
- The four route-risk call sites may share one local label expression to avoid divergence; style only.
- The ForecastTable 320 px overflow, baked-in `⚠ ` rough-weather strings and 🚐 escape title remain out of scope.

## Deliverable

Append the correction execution and fresh validation facts to `cc-report.md`, clearly separating this v2 round from the earlier v1 report. Include changed files, tests/counts, browser-evidence path, scope audit, deviations and any unrelated failures. Then update `CURRENT.md` to `CC_COMPLETE`. No commit, push, deployment or issue closure.

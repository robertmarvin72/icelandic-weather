# #440 — Jonesy result review (v1)

2026-10-22. Independent review of CC's execution of `approved-prompt-v1.md` against live files. Review material only; not an approval to commit, push or deploy.

## Verdict: REVISE (narrow evidence-and-report round; a small code change only if the lock finding below turns out to be real). The layout fix itself looks right; several acceptance criteria are unproven or mis-reported.

## What I read and verified (grades: VERIFIED SOURCE / VERIFIED SAMPLE = CC's saved evidence files, not re-run by CC or me)
- **Modal source** (`RoutePlannerDetailsModal.jsx`, 26,797 B): `isRendered = open && !!candidate` gates one effect; `onClose` read through a ref; one `window` keydown listener (Escape + Tab containment); initial focus on the `tabIndex={-1}` scroll region; exact prior `overflow`/`paddingRight` restored; focus restored with `preventScroll` if still connected; backdrop is a plain `<div onClick>`; `role="dialog"`, `aria-modal`, `aria-labelledby` via `useId`; the `aria-label="Close modal"` button and body-child portal are unchanged; all new hooks sit above the early returns. This matches J3–J8 as written.
- **Layout**: panel is `flex flex-col`, header/footer `shrink-0`, content `min-h-0 flex-1 overflow-y-auto overscroll-contain`. In the saved `dist/assets/index-D8g6RLK6.css` both `.max-h-\[85vh\]{max-height:85vh}` and `.max-h-\[85dvh\]\!{max-height:85dvh!important}` exist, so CC's Tailwind-v4 ordering finding and the `!` workaround are real (VERIFIED SAMPLE).
- **Scope**: of the files in `src/components/`, only `RoutePlannerDetailsModal.jsx` and the new `RoutePlannerDetailsModal.a11y.test.jsx` have new mtimes; `RoutePlannerCard.jsx`, the #436/#441 test files, the other modals and helpers have their old ones. The temporary harness is no longer in the repo root. The new test file has 24 `it` blocks, matching the report.
- **Browser data** (`outputs/ticket-440-browser-evidence/{before,after}/measurements.json`, `results.json`, PNGs; VERIFIED SAMPLE): at 320×568 the scroller goes from `clientHeight 1289 = scrollHeight` to `279 / 1289` and wheel moves `scrollTop` 0 → 600; at 667×320 from `986 = 986` to `116 / 986`, footer bottom 295 of 320. I opened the "after" PNGs: the footer Close button is visible and the content is scrolled mid-way. The layout fix is demonstrated for this fixture.
- Acknowledgement: in Round 1 I assumed two working opener sites. CC is right that the pill at `RoutePlannerCard.jsx:~1371` carries a static `disabled`; my J7 wording over-counted.

## Findings

### B1 — "page behind stays locked" criterion is unproven and the report's explanation does not hold (MEDIUM–HIGH, acceptance criterion)
Four checks (`*-page-behind-stays-locked`) fail after the fix; CC calls it "a pre-existing Chromium characteristic of the body-lock technique … documentElement is the scrollingElement" and out of scope. Problems:
1. The numbers (`pageScrollYBeforeOpen` → `pageScrollYWhileOpen`: 1075→2144, 826→1458, 501→1133, 17→1082, 994→2031) are identical before and after the fix but differ per scenario, in a way that tracks where the opener sits on the page, not the modal. That is what a harness would produce if "before open" is read before the opener click and Playwright's click scrolls the opener into view. I cannot confirm from the saved data; the harness script was deleted (B3). If so, the check measures the click, not the lock, and the failure is a measurement artifact.
2. The mechanism claimed is not what I get. In my own sandbox (Playwright Chromium, not the owner's machine), a standards-mode page with `body{overflow:hidden}` and nothing set on `html`: wheel over the page leaves `scrollY` unchanged (1075 → 1075) while the same wheel without the lock scrolls it (1075 → 1875); wheel at a scroll-region boundary with `overscroll-behavior: contain` did not chain to the page either. `index.css` and `index.html` set no `overflow` on `html`/`body` (checked), so propagation to the viewport would be expected here too. This is a minimal page, not the app, so it does not prove the app locks; it shows the stated explanation is not generally true.
3. The criterion is explicit in the approved prompt ("page behind stays locked during open") and in J8 (verify with real wheel/touch at the boundary, record `scrollY` before and after). A failing acceptance check cannot be reclassified as out of scope by the executor; the prompt says STOP, not "report as pre-existing".
Required: re-measure (see R3). If the lock really fails in the app, record computed `overflow` of `html`/`body`, identify the cause, and STOP for a Ripley decision on whether a fix inside this modal (for example also locking `documentElement`) is in scope. Do not call it pre-existing or fix other modals.

### B2 — the "advanced expanded" scenario never ran (MEDIUM)
For every viewport the "advanced" and "collapsed" PNGs are byte-identical (same MD5 for each pair, before and after) and `measurements.json` is identical field by field (scroller `scrollHeight` 1289 and 986 in both). The "after" landscape screenshot still shows the "Show scoring details" toggle collapsed. So the report's "identical result for both collapsed and advanced-expanded states" is vacuous: the 11-column table, its horizontal scroll, the longest-content case and Tab/Shift+Tab with the table present were not exercised in a browser. The prompt required long content with the advanced section expanded.

### B3 — required browser evidence missing and the harness was deleted (MEDIUM)
Not in the report or data: ArrowDown/PageDown/Space scrolling right after opening (J6: "Browser evidence must show this"), Tab/Shift+Tab sequence, Escape and close controls, reopening, focus return and page `scrollY` after close (acceptance: "scroll/focus restored after close"), horizontal table scroll, touch/pointer-equivalent scroll (only `page.mouse.wheel` was used and labelled), short-landscape IS/dark (desktop and IS/dark were only "opened" checks). The approved prompt also says to "retain a reproducible browser test/script … under outputs/ticket-440-browser-evidence"; the harness was deleted, citing an established convention. Earlier evidence folders holding only PNG/JSON may be that convention, but the approved prompt takes precedence, and without the script B1 and B2 cannot be audited. Also, the new test file header points to "RoutePlannerDetailsModal.round6-browser-evidence", which does not exist.

### B4 — report misstates the desktop result (LOW–MEDIUM)
The report says desktop 1280×900 "did not reproduce the clipping (85vh = 765px comfortably fits the content there)". The saved "before" data says otherwise: panel `clientHeight 763`, `scrollHeight 1140`, scroller `986 = 986` (about 377 px clipped); "after": scroller `609 / 986`, scrollable. So with this fixture the bug reproduces at desktop size too. This matters for how the issue is described ("short/narrow viewports") and for whoever reads the report.

### B5 — "after" evidence predates the last source edit (LOW)
Device mtimes: after-evidence files 1792691641961, modal source 1792691702274, `dist` build 1792691727642. CC says the late edit only removed an unused eslint-disable directive; plausible, but the browser run did not use the final file. The harness must be rerun on the final build anyway (R1).

### B6 — unexplained overflow inside the panel (LOW, needs an answer)
After the fix, `panel.scrollHeight` exceeds `clientHeight` at mobile (966 vs 481) and landscape (739 vs 270) but not at desktop (763 = 763). A properly bounded flex column should show equal values. My guess (INFERRED, not checked): an absolutely positioned or visually hidden element inside the scroll content whose containing block is the `relative` panel, so the scroller does not clip it. Ask CC to identify the element and confirm nothing visible, focusable or scroll-affecting results.

### B7 — test naming overclaims; keyboard observations to confirm in a browser (LOW)
- `covers both real opener sites…` is a duplicate of the previous focus-return test with a generic button; one opener is disabled, so the title and comment overclaim.
- INFERRED, to be settled by browser evidence: in recent Chrome a horizontally scrollable region with no focusable children can itself become a tab stop; the trap's item list would not contain it, so Tab from it re-enters at the header ✕ and skips the footer Close. Not a trap or a data-loss issue, but the keyboard order should be recorded with the advanced table open. The initial-focus scroller has `outline-none`, so keyboard users get no visible focus indicator on it; Ripley may accept this for a programmatic container focus.
- Short landscape leaves a 116 px scroller (about 36% of 320 px). J2 asked CC to say if that is unusable; the report is silent. By the screenshot it is usable but tight; Ripley decides.

## Required before PASS (for Ripley's approved-prompt-v2)
- **R1** Keep the browser harness in `outputs/ticket-440-browser-evidence/` with the exact run command; rerun it on a fresh build of the final source. Retain the existing baseline as historical.
- **R2** Make the "advanced" step real: assert the toggle label flips, the table is in the DOM, scroller `scrollHeight` grows, and the table container has `scrollWidth > clientWidth`; scroll it horizontally.
- **R3** Redo the lock check: record `scrollY` immediately after open settles, after wheel over the content (including at both ends), after wheel over the backdrop, and after close; record computed `overflow` of `html` and `body` while open. If it genuinely fails, STOP for Ripley rather than calling it pre-existing.
- **R4** Add the missing evidence from B3: keyboard scrolling right after open, Tab/Shift+Tab sequence (advanced collapsed and expanded), Escape, both close buttons, reopen, focus return and `scrollY` after close, and short-landscape IS/dark. Label wheel vs touch accurately.
- **R5** Correct the report: the desktop statement (B4), the lock explanation (B1), the advanced-state claim (B2), the "round6-browser-evidence" reference and the opener-coverage test name (B7).
- **R6** Answer B6.
- **R7** Rerun targeted suites, full `npm run test:run`, `npm run lint`, `npm run build` after any final edit and report fresh counts.
No change to `RoutePlannerCard.jsx`, other modals or the #441 helper contract.

## Not independently verified
Test counts (35 targeted, 184 files/2756 tests), lint, build success, `git diff --check` and CC's statement about the lint directive edit are CC-reported. I did not run the app or the harness; the sandbox experiment in B1 is a minimal page in my own environment (Chromium from Playwright 1.56, headless), not the repo. Coverage of the J5 tests is by reading, not mutation; they look capable of failing on an `[onClose]`-keyed effect but CC did not show an expected-red run.

## Limits of this review
No shell, git, test, lint, build or browser on the owner's machine. I reviewed the files named above, not the whole diff (no git access). No real-device or mobile-Safari evidence exists; the `dvh` rationale remains INFERRED. Not approval to commit, push or deploy; owner-side decisions and Ripley's final assessment follow.


## Ripley final assessment — 2026-10-22

Verdict: REVISE. Jonesy B1–B7/R1–R7 accepted. Main layout fix has saved evidence, but advanced expansion, lock measurement and required keyboard/focus/touch evidence do not establish acceptance. Deleting the harness conflicts with v1. The unsupported pre-existing Chromium explanation does not justify failing the explicit lock criterion. Approved correction prompt v2 requires controlled post-open baselines and STOP if lock genuinely fails before any mechanism change; no other-modal/card edits authorized.

Independent command: npx vitest run src/components/RoutePlannerDetailsModal.test.jsx src/components/RoutePlannerDetailsModal.a11y.test.jsx — 2 files / 35 tests passed. JSDOM green does not prove browser scrolling. Full 184-file / 2756-test run, lint/build and saved browser measurements remain CC-reported, not independently rerun. Reviewed CURRENT, CC report and Jonesy review; no application changes by Ripley. 116px short-landscape scroller requires demonstrated usability, not a speculative redesign. CURRENT -> READY_FOR_CC for v2. No commit/push/deploy/GitHub action.


## Jonesy re-check — v2 correction — 2026-10-22

Scope: `approved-prompt-v2.md` (R1–R7) against my B1–B7. Read the v2 section of `cc-report.md`, `capture-v2.mjs`, `v2-final/{results.json,measurements.json,build-identity.json}`, the v2-final screenshots I list below, `RoutePlannerDetailsModal.jsx`, the edited `RoutePlannerDetailsModal.a11y.test.jsx`, `RouteCompareTable.jsx` (container only), `CURRENT.md`.

### Verdict: REVISE (narrow). Most of v2 is verified and good. One real keyboard-access defect shows up in CC's own saved tab-order data, and the report states the opposite of that data. A small modal-only code change and a stronger harness check are needed.

### Resolved and verified
- **Source unchanged and hash matches.** `sha256(RoutePlannerDetailsModal.jsx)` = `f8fd78e6…18129a2` = the hash in `build-identity.json`; the file's mtime and size are unchanged since v1. Only the a11y test file (comment/title edits per CC) and the retained harness were added/changed. B5 closed: build, preview-server identity and capture are chained in `build-identity.json` (still CC-reported timing).
- **B1 (lock):** resolved. The new post-open baselines (2144 and 1458) equal v1's old "whileOpen" values, which confirms my suspicion that v1 measured the opener click's auto-scroll, not the lock. v2 data: wheel over content (top/middle/bottom), over the backdrop and a CDP touch swipe all leave `scrollY` at the baseline; computed `html` `visible`, `body` `hidden`. The retracted explanation is visibly retracted.
- **B2 (advanced):** resolved. Labels flip ("Show scoring details" → "Hide scoring details"), scroller `scrollHeight` grows (1289→1586, 986→1251), the nested table has `scrollWidth 980 / clientWidth 260 and 607`, `scrollLeft` moves to 150. The collapsed and advanced PNGs now have different MD5s, and I looked at the mobile320 and IS/dark landscape advanced PNGs: the table is really there.
- **B3 (partly):** harness retained with run command; keyboard scroll right after open works (`0→200`, `0→108`, active element is the scroll region); Escape, both close buttons, panel click, backdrop, reopen, focus return and `scrollY` after close pass; real CDP touch moves content and leaves the page. Counted in `results.json`: 60 entries, all `ok`.
- **B4:** report corrected visibly (desktop clipped before the fix).
- **B6:** accepted. The reported worst element is an `sr-only` span with `position:absolute` (overflow 485.5 px ≈ 966−481 on mobile, 470 on landscape, none on desktop), from `HazardSourceNote`. Number match is strong evidence; nothing visible or focusable. One loose end: in the full-battery pass the diagnostic names a normal-flow `div.mt-5` (a descendant inside the scroller, 725 px) instead, so that pass uses a looser walk than the matrix one. Harmless; mention in the report if convenient.
- **B7 (naming):** test title and comments corrected as described; I did not diff the assertions (no git), see limits.
- Scope held: no other component, helper, card or modal changed (directory listing).

### K1 — forward Tab skips "Show scoring details" and the footer Close; the report says the opposite (MEDIUM, keyboard access)
From `v2-final/measurements.json`, key `mobile320-en-light-full`, `tabOrderCollapsed` (real `document.activeElement` after each Tab press): scroll region → header ✕ → vedur.is link → **a `DIV` whose text is the compare table header ("Day Grunnstaður Test Betri Staður Langheit…", `tabIndex` reported `-1`)** → header ✕ → link → that DIV → ✕ … The cycle has four stops; the advanced toggle and the footer Close button never appear. `tabOrderExpanded` is the same at mobile320. At short landscape, collapsed: scroll region, ✕, link, toggle, Close (correct, because the table fits); expanded: scroll region, ✕, link, "Hide scoring details", **DIV (advanced table, "Date Base pts Option pts…")**, ✕, … : the footer Close is skipped.
Cause (INFERRED from the data plus the source, not stepped through): `RouteCompareTable.jsx:314` always renders `<div className="overflow-x-auto">`, and the advanced table has the same wrapper. In current Chromium a scroll container with no focusable children is a keyboard stop. It is not in the modal's `FOCUSABLE_SELECTOR` list, so when it holds focus `activeIndex === -1` and the handler treats that as "outside the dialog": `preventDefault()` and `first.focus()` (header ✕). So at 320 px wide, the primary viewport of this bug, a keyboard user pressing Tab can never reach the advanced toggle or the footer Close; only Shift+Tab from ✕ wraps to the footer. Escape and the header ✕ still close the dialog, so there is no trap, but "keyboard access to all content" is an explicit issue requirement and part of J6. Part of the origin is my own and Ripley's wording ("if focus is outside the known focusable set, re-enter at first/last") which does not distinguish "outside the dialog" from "inside the dialog but not in the list". jsdom cannot show this (it has no keyboard-focusable scrollers), which is why the 35 unit tests are green.
The report's B7 paragraph says the table container "did not become its own native tab stop … the recorded order matched the JS-computed focusable list exactly". The saved data contradicts that at mobile320 (both states) and at landscape expanded. That sentence must be corrected, and the limitation "other Chromium versions might" is not the situation: this Chromium build did it.

### K2 — the harness does not assert the tab sequence (MEDIUM, why K1 slipped through)
`walkTabOrder` only collects the Tab sequence into `measurements.json`; there is no `record()` for it, no Shift+Tab walk, no check that Escape fires once, and no check that focus stays inside the dialog. The report table says "Tab/Shift+Tab … all pass", but no check of that name exists in the 60. R4 asked for the sequence collapsed and expanded and for "browser script evidence must fail meaningfully"; here it cannot fail on this.

### Smaller points
- **K3 (LOW):** the new CDP touch swipe and keyboard checks are good. There is no negative control showing the lock check would fail on an unlocked page (my sandbox page showed 1075→1875 without the lock; a one-line control in the harness would make the 60/60 more convincing). Optional.
- **K4 (LOW):** record the Chromium version (`browser.version()`) and the Playwright version in `build-identity.json`, since K1 depends on the browser's keyboard-focusable-scroller behaviour.
- **K5 (LOW):** the 116 px landscape scroller is still tight, but the IS/dark landscape screenshot shows usable content plus scrolling; I leave that judgment to Ripley as the prompt said.
- Short landscape IS/dark advanced and mobile320 EN advanced screenshots look right (no clipping, header and footer visible).

### Required before PASS (for Ripley's approved-prompt-v3)
1. **Fix the Tab handler inside `RoutePlannerDetailsModal.jsx` only.** An element that is inside the panel but not in the computed list (browser-native scroll stops) must not be hijacked; intercept Tab only when focus is outside the panel, or at a true edge by DOM-order comparison with the first/last control. Forward Tab at mobile320 must reach the link, the advanced toggle (when collapsed and expanded) and the footer Close in order, then wrap to the first control; Shift+Tab symmetric. Initial focus on the scroll region and its keyboard scrolling stay as they are. Any alternative that satisfies this inside the modal (for example boundary sentinels) is acceptable; no changes to `RouteCompareTable` or the card.
2. **Tests:** add a jsdom test for "focus on a non-listed element inside the panel: Tab keydown is not default-prevented"; keep the existing wrap tests unchanged.
3. **Harness:** record Tab and Shift+Tab walks as named checks that fail if the toggle or footer Close is unreachable, focus leaves the dialog, or the cycle does not wrap; add an Escape-fires-once check if cheap. Show one expected-red run of the new checks against the current v2 build (the K1 behaviour), then green on the fixed build. Keep `v2-final` as historical, write `v3-final`, rebuild fresh and record the source hash and browser versions.
4. **Report:** correct the B7 tab-order paragraph and the "Tab/Shift+Tab all pass" row visibly, state that K1 was found by review, and keep historical text.
5. Rerun targeted modal/card/canonical-tone/caution/table suites, full `npm run test:run`, `npm run lint`, `npm run build`; no application edits after capture without recapture.
No changes to `RoutePlannerCard.jsx`, other modals, helpers or copy; no commit, push or deploy.

### Not independently verified
Test counts (35, 81, 184 files/2756), lint, build and the statement that only comments/titles changed in the a11y test file are CC-reported; I did not diff the file against v1. The harness was not rerun by me; I read its code and its saved output. The cause in K1 is reasoned from the data and the source, not reproduced by me.

### Limits of this re-check
No shell, git, test, lint, build or browser on the owner's machine. One sandbox observation from the earlier round (body `overflow:hidden` locks window wheel scroll on a minimal page) is unchanged and not a substitute for the app evidence above. Emulated Chromium only: no real device, no Safari or Firefox keyboard behaviour. Not approval to commit, push or deploy; owner decisions and Ripley's assessment follow.


## Ripley final assessment — v2 — 2026-10-22

Verdict: REVISE. K1/K2 accepted: source activeIndex===-1 branch conflates in-panel native scroller focus with outside focus, so saved sequences reveal a genuine keyboard reachability defect. Prior prompt wording contributed; v3 explicitly corrects it. Modal-only handler fix plus meaningful named forward/reverse browser assertions and expected-red baseline authorized in approved-prompt-v3.md. B1 lock and B2 advanced expansion resolved; no lock mechanism change needed.

Independent rerun: npx vitest run src/components/RoutePlannerDetailsModal.test.jsx src/components/RoutePlannerDetailsModal.a11y.test.jsx — 2 files / 35 tests passed. This does not prove native browser Tab order; full 2756 tests/lint/build/harness remain CC-reported. No application edits or browser rerun by Ripley. CURRENT -> READY_FOR_CC for v3. No commit/push/deploy/GitHub action.


## Jonesy narrow re-check — v3 correction — 2026-10-22

Scope: only `approved-prompt-v3.md` (K1 Tab-handler fix, K2 harness assertions, report correction). Read `approved-prompt-v3.md`, the v3 section of `cc-report.md`, `RoutePlannerDetailsModal.jsx` (Tab handler), the Tab-related tests in `RoutePlannerDetailsModal.a11y.test.jsx`, `capture-v2.mjs` results, `v3-expected-red/` and `v3-final/` JSON, and a directory listing of `src/components/`.

### Verdict: PASS (narrow). No blocking findings. One LOW observation.

### Verified
- **Source hash and scope.** `sha256(RoutePlannerDetailsModal.jsx)` = `ba8b6fcb…49ee5f`, equal to `sourceSha256` in `v3-final/build-identity.json` and to the hash in the report. In `src/components/` only `RoutePlannerDetailsModal.jsx` and `RoutePlannerDetailsModal.a11y.test.jsx` have new mtimes; `RoutePlannerCard.jsx`, `RouteCompareTable.jsx`, `HazardSourceNote.jsx`, the other modals, helpers and the #436/#441 test files are untouched. The harness `capture-v2.mjs` was extended in place, as the prompt allowed.
- **The fix is the right one.** The Tab branch now treats "outside" as `!panel.contains(active)` (re-enter at first or last), intercepts only at the true edges (`Shift+Tab` on first → last; `Tab` on last → first), and leaves everything else, including Chromium's implicit scroll-container stops, to native traversal. I walked the cases: scroll region focused on open (Tab goes natively to the vedur.is link, Shift+Tab to ✕), click on dialog text (focus lands on the scroll region or body, both handled), header text click (body → re-enter at first), listed and unlisted middle stops (native), edges (wrapped), empty list (prevented). Escape handling, listener count, body lock, focus capture/return are unchanged.
- **Expected-red proof is real.** `v3-expected-red/results.json`: 96 checks, 81 ok, 15 FAIL, all named K1 checks (mobile320 forward collapsed and expanded, mobile320 reverse expanded, landscape forward expanded, landscape reverse expanded), with the recorded sequences showing the old 4-stop cycle (scroll region, ✕, vedur.is link, table container). The run is tied to the v2 build by hash: `v3-final/build-identity.json` records the pre-fix dist hash `5548bab2…`, which equals `distJsSha256` in v2's `build-identity.json`.
- **Final run is green and the checks can fail.** `v3-final/results.json`: 96/96. Forward Tab at mobile320 collapsed now goes scroll region → link → compare-table container → "Show scoring details" (step 3) → footer Close (step 4) → wraps to the first control; expanded reaches "Hide scoring details" at step 3 and Close at step 5; landscape reaches them at steps 2–4; reverse walks reach Close and the toggle (and the advanced table container in between) and stay in the dialog. Each named check (`reaches-advanced-toggle`, `reaches-footer-close`, `reaches-targets-in-dom-order`, `wraps-to-first-after-footer-close`, `stays-in-dialog`) exists per direction/state/viewport and the 15 failures above prove they are not vacuous (K2 closed).
- **Build identity.** `build-identity.json` ties the capture to the source hash, the dist JS/CSS hashes, build timing, the preview-server check and the exact run command, and now records Chromium `147.0.7727.15` and Playwright `1.59.1` (K4 closed).
- **Tests.** The two jsdom tests that encoded the bug's premise were retargeted to a genuinely outside element, and two new tests assert that Tab and Shift+Tab on an in-panel element absent from `FOCUSABLE_SELECTOR` are not default-prevented and do not move focus (the scroll region is a fair stand-in for the decision; the file comment says jsdom cannot make a real implicit scroll stop). Changing those two tests inside the ticket's own new file is within v3 and was disclosed. By my `it(` count the file has 26 tests.
- **Report correction.** The v2 "did not become a native stop / order matched exactly" claim is retracted explicitly, with the reason (tab-order data was logged but never asserted). v1/v2 text and the `v2-final` artifacts remain as history.

### Observation (LOW, non-blocking)
The reverse-direction walks have no named "wraps to last after the first control" check; the wrap is exercised implicitly (the walk goes ✕ → footer Close and `reaches-footer-close` passes at step 2 only because of it). Acceptable for this ticket; a named check would make a future regression easier to read.

### Not independently verified
Test counts (37 in the modal files, 118 in the six targeted files, 184 files/2758 tests), lint, build, the unit-test mutation run (CC reports the two new tests failing red against the old `activeIndex === -1` branch and the revert being byte-identical) and the served-assets `curl` check are CC-reported. I did not run the harness or the app; I read its code and saved results. I viewed no new screenshots this round beyond the v2 ones; v3-final PNG sizes are mostly identical to v2's, consistent with an unchanged layout.

### Limits of this re-check
No shell, git, test, lint, build or browser on the owner's machine. Evidence is automated Chromium 147 (desktop emulation, CDP touch): no real device, no mobile Safari, no Firefox, no screen-reader testing. The keyboard-focusable-scroller behaviour is Chromium-specific, so other engines are untested rather than known-good. Overall #440 status remains "implemented/reviewed locally": production behaviour, the mobile-Safari `dvh` rationale and the real-phone feel are unverified owner-side items. Not approval to commit, push or deploy; Ripley's final assessment and the owner's decisions follow.


## Ripley final assessment — v3 — 2026-10-22

Verdict: PASS for local implementation/review. Jonesy narrow PASS accepted. Inspected final Tab handler: outside-panel re-entry is distinct from native in-panel stops, first/last wrapping retained. Read current review/report and parsed saved final results: 96/96 ok. This verifies the saved result set, not an independent rerun of Chromium. Expected-red evidence, harness execution, full 184-file/2758-test run, lint and build remain attributed to CC; Jonesy verified saved source/build identity and expected-red/final comparisons.

Independent execution: npx vitest run src/components/RoutePlannerDetailsModal.test.jsx src/components/RoutePlannerDetailsModal.a11y.test.jsx src/components/RoutePlannerCard.test.jsx src/components/RoutePlannerCard.canonicalTone.test.jsx src/components/RoutePlannerCard.caution.test.jsx src/components/RouteCompareTable.test.jsx — 6 files / 118 tests passed. No need to duplicate the full suite or browser matrix after this targeted pass and reviewed evidence.

Accepted non-blocking limitation: reverse wrap has implicit browser traversal coverage rather than a separately named assertion. No further correction required. Short-landscape space is tight but evidence demonstrates content access; no redesign required. Real-device/Safari/Firefox/screen-reader and production checks remain unverified, not claimed passed. No application changes by Ripley. CURRENT -> CLOSED for local workflow. No commit, push, deploy or GitHub closure performed.

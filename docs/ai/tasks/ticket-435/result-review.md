# #435 — Jonesy result review, Round 1

2026-10-06. Technical peer review of CC's execution of `approved-prompt-v1.md` (Settings row presentation). Reviewer only: I implemented nothing, and I have no shell on the owner's machine, so I did not run tests, lint, build or browser. Everything below is from reading the live files, the harness, `results.json`, the built bundle and a subset of screenshots.

## Verdict: PASS (local, presentation only)

The production change is what the approved contract specified, it touches only the allowed files, the evidence is internally consistent and I could independently reproduce its headline numbers from `results.json`. No finding blocks closure. Six non-blocking observations (N1–N6) are listed for Ripley/owner. No commit, push, deployment or issue closure is implied by this verdict, and #434's owner-controlled production-cookie check is untouched and still pending.

## What I verified independently

**Production code (`src/components/Toolbar.jsx`, mtime 1791313905739 = 19:11:45Z, 9501 bytes).**
- `SETTINGS_CONTROL_CLASS` equals Ripley's token string character for character (`inline-flex min-h-[44px] items-center justify-center gap-1 whitespace-nowrap px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800 focus-ring cursor-pointer transition-colors`), and it is applied to units, language, theme, logout (plus `disabled:opacity-60`) and passed to `<InstallPWA className=...>`.
- Logout is `<LogOut size={16} aria-hidden="true" focusable="false" />` plus the translated label/pending label; the 🚪 emoji, `basis-full`, `w-full`, `sm:w-auto` and `border-t` are gone.
- The logout group is `flex shrink-0 items-center border-l border-slate-200/80 pl-2 ml-1 dark:border-slate-700/60`, contains only the button, is rendered only inside `isSignedIn &&`, and is the last child (after DEV). The divider is owned by the group, not a sibling, and is not hidden by any breakpoint.
- Order is PWA → units → language → theme → DEV → logout group. `handleLogout`, `settingsOpen`/refs/effect, `isSignedIn` visibility, `disabled`, `aria-busy`, handlers, `type="button"`, aria-labels/titles on units/language/theme, the hero block and the Settings disclosure toggle (`px-2 py-1 text-xs`, no `min-h`) are unchanged versus the version I reviewed in #434.
- Logic-wise this is markup/classes only; the one added import is `{ LogOut } from "lucide-react"` (already a dependency, `^1.7.0`).

**Scope.** I listed the repo root, `src/` (recursive), `api/` (recursive), `dist/` and the task folder. Only `src/components/Toolbar.jsx` (19:11:45Z) and `src/components/Toolbar.logout.test.jsx` (19:12:40Z) have mtimes after the approved prompt (19:10:52Z); every other file in `src/` and `api/`, and `package.json`, `package-lock.json`, `tailwind.config.js`, `vite.config.js`, `vitest.config.js`, `eslint.config.js`, still carries its earlier mtime and the same value I recorded in the #434 review where I had one (for example `InstallPWA.jsx` 1779385722917, `DevProToggle.jsx` 1774034253018, `useLogout.js` 1791305982302, `useMe.js` 1791305957650, `translations.common.js` 1791305990009, `index.css` 1773776859691, `App.jsx` 1791306025157, `PageHeader.jsx` 1791306012286, `Toolbar.test.jsx` 1789501182535, `App.logoutWiring.test.jsx` 1791312574080). This is mtime evidence, not hash evidence; I could not recompute CC's SHA256 values.

**Build freshness (C3).** `dist/index.html` mtime 19:13:11.665Z, `sw.js` 19:13:13Z, versus `Toolbar.jsx` 19:11:45Z: the build is newer than the last production edit, matching CC's report. I also searched the built bundle `dist/assets/index-Br3GzfOK.js`: it contains the new shared class string, the `border-l border-slate-200/80 pl-2 ml-1 dark:border-slate-700/60` group string and the lucide `log-out` icon, and contains no 🚪, so the preview ran against the new code. The harness file (19:14:08Z) and `results.json` (19:14:34Z) are newer than the build.

**Tests (`Toolbar.logout.test.jsx`, 10,971 bytes, 16 tests).** The original 10 behavioural tests are intact (visibility, labels, DEV, success + focus return, failure, pending/disabled/aria-busy/repeat blocking, no focus pull when closed). The emoji assertion became: exactly one SVG, `aria-hidden="true"`, `focusable="false"`, width/height 16, no 🚪 text, visible label (class checks kept and labelled as guards). The "last row" test is now "last control". The C1 mechanics are all done: `vi.hoisted` switchable `InstallPWA` sentinel, `vi.stubEnv("DEV", false)` in every no-DEV test, and six new tests: PWA→units→language→theme→DEV→logout order via sentinels, anonymous with no PWA/DEV has exactly three direct `BUTTON` children and no `.border-l`, signed-in last child is the group holding only the logout button (4 children), units/language/theme callbacks fire once and are `type="button"` (found by their accessible names/titles), the PWA control receives the shared class, and the disclosure toggle keeps its own styling. `App.logoutWiring.test.jsx` is unchanged (mtime 1791312574080). My static count of `it(` calls is 13 + 16 + 13 + 7 in the four files plus four `it.each` calls in `Toolbar.test.jsx`, which is consistent with CC's 65 but is not a re-run.

**Theme/storage contract (E7).** The harness sets `localStorage.theme` and `localStorage.lang` as JSON strings. In source, `App.jsx` uses `useLocalStorageState("theme", "light")`, `darkMode = theme === "dark"`, and `useThemeClass` toggles `html.dark`; `useLocalStorageState` JSON-parses the stored value. So the harness keys match the real contract. Dark runs are also shown to be dark by the data: logout contrast is 7.25 in every light scenario and 11.09 in every dark scenario.

**`results.json` (reproduced).** 338 rows: 298 `pass: true`, 0 `pass: false`, 40 observations (`pass: null`); exactly 29 distinct scenarios, named as the matrix requires (16 layout `signed-in-nopwa-{320,375,768,1280}-{is,en}-{light,dark}`, 4 `pwa-visible`, 4 `pending`, 2 `anonymous`, 2 `keyboard`, 1 `failure`). Per-scenario assertion counts add up to 298, so "29/29 scenarios, 298/298 assertions" is accurate and the scenario/assertion counts are reported separately as required. Measured values in the data: four controls 44.0px high in every layout scenario; logout group 84px (IS) / 88px (EN) against panel widths 185–326px (content-sized); `cursor: pointer` on all four; no overflow; at 1280 without PWA one row in all four scenarios (the hard assertion); keyboard Tab reached logout in 4 presses in both keyboard scenarios, with a non-`none` box-shadow ring; pending groups 121px (EN) / 95px (IS) versus idle 88/84.

**Wrap table.** CC's table matches `results.json` row for row (320/375/1280 hidden: 1 row; 768 hidden: 2; 320 visible: 2; 768 visible: 3; 1280 visible: 1).

**Screenshots I viewed myself (6):** `signed-in-nopwa-320-en-light-panel`, `signed-in-nopwa-768-is-dark-panel`, `pwa-visible-320-is-dark-panel`, `pwa-visible-768-en-light-panel`, `keyboard-1280-is-dark-focus-panel`, `signed-in-nopwa-320-en-light-viewport`. They match CC's descriptions: a uniform row of equal-height controls with the logout icon + text, one row at 320 (no PWA), logout group wrapped to its own right-aligned line at 768 and with PWA at 320/768, a clear blue focus ring on logout, no Install button in the hidden scenarios I looked at, and the Settings disclosure visibly smaller than the controls under it (C5 observation, correctly not restyled).

## Conditions check (C1–C5, E1–E7)

- C1: met (details above). C2: met; exact tokens used; logout contrast 7.25:1 light / 11.09:1 dark in the harness's composited measurement (method approximate, margin large). C3: met (build after last edit, bundle checked, preview run on fresh dist per CC). C4: met (1280 hard assertion; 768 observational; light and dark keyboard scenarios with bounded Tab loop and recorded press count; scenario names carry language/theme; event dispatched after Settings is opened with `preventDefault`/`prompt`/`userChoice`). C5: met.
- E1–E7: met. The report-only items (InstallPWA event timing, pending width shift, #434 cookie check) are reported as report-only and nothing was fixed.

## Non-blocking observations (no action required for PASS)

**N1 — accessible-name assertion is a regex, not exact.** `logoutButton()` finds the button with `new RegExp(dict.logoutLabel)` and the IS test only asserts non-null plus the dictionary constant. Round 2 / my E5 asked for exact role names for IS/EN. Because the SVG is `aria-hidden` the risk is low, but a one-line `getByRole("button", { name: translations.is.logoutLabel })` (exact string) would close it. Optional hardening.

**N2 — hidden-PWA state is not asserted by the harness.** `snap.pwa` is measured in every scenario but only asserted when the event was dispatched. The "no event, no Install button" state rests on the real `InstallPWA` rendering nothing without the event plus the screenshots I saw (absent in all three hidden captures I viewed). Acceptable; a `snap.pwa === null` check in the 16 hidden scenarios would make it explicit.

**N3 — cosmetic comment placement.** The Toolbar JSDoc block (lines 10–19) now sits above the new `SETTINGS_CONTROL_CLASS` comment instead of directly above the component. No runtime effect; could be tidied in a later touch of the file.

**N4 — tablet width product note.** At 768 the right column is only about 185–220px wide next to the hero copy, so logout wraps to its own line without PWA and PWA makes it three lines. That is within the accepted E2 states and was reported as found. In the light and dark captures I viewed at that wrap state the leading `border-l` is hard to see (the harness confirms a non-zero left border; the tokens are intentionally subtle). Owner may want to look at it in a real browser; no change is required by the approved prompt.

**N5 — measurement method limits (as CC stated).** Contrast is computed from composited backgrounds over an assumed white / slate-950 base and ignores the body's `soft-grid` image; the harness uses two workaround stylesheets (Splash hidden, toast stack hidden except in the failure scenario). Both were declared in the report. Only Chromium at four widths was used.

**N6 — figures I could not re-run.** Vitest "4 files, 65 passed", `npm run lint` exit 0, `npm run build` exit 0, the SHA256 comparisons and `git status`/`git diff --stat` (including the HEAD `94daefe…` baseline and "CURRENT.md modified, task folder untracked") are CC's statements. I did not execute them and have no shell; my cross-checks above (mtimes, bundle contents, test file reading, `results.json`) are consistent with them but do not replace running the suite.

## Report accuracy

CC's report is accurate where I could check it: counts, wrap table, measured geometry, build and mtime times, workarounds, and the list of screenshots viewed (with the honest statement that not all 58 captures were opened individually). One small wording point: CC describes the dark focus ring's offset as white; in the capture I viewed the blue ring is the dominant visible feature and I could not confirm the white offset by eye. No effect on the verdict.

## Limits of this review

No shell: no tests, lint, build, browser or mutation checks were run by me; no hash computation; no git inspection (so no verification of uncommitted vs committed state, HEAD, or that nothing was staged). I reviewed 6 of CC's 58 screenshots. I did not observe real-device, Safari or Firefox rendering, and nothing here establishes production behavior or the pending #434 production-cookie verification on campcast.is and eltumvedrid.is.

## Recommendation

PASS. Ripley's final assessment may close #435 locally. Commit/push/deploy and GitHub closure remain owner decisions. Uncommitted changes to review before committing: `src/components/Toolbar.jsx`, `src/components/Toolbar.logout.test.jsx`, `docs/ai/` task files and `CURRENT.md`, and the new `outputs/ticket-435-browser-evidence/` folder (harness, `results.json` and about 58 screenshots).

---

## Ripley final assessment — 2026-10-06

Verdict: **PASS (local, presentation only).** I read CURRENT, CC's report and Jonesy's PASS against the approved contract, inspected the actual Toolbar diff and git status, and independently ran `npx vitest run src/components/Toolbar.test.jsx src/components/Toolbar.logout.test.jsx src/App.logoutWiring.test.jsx src/hooks/useLogout.test.jsx`: **4 files, 65 tests passed**, exit 0. The authorized run used outside-sandbox execution because of the earlier known esbuild directory-access limitation. No application/test edits made during this assessment.

The diff changes only presentation/imports in Toolbar: shared control classes, group-owned divider and decorative Lucide icon. Existing logout state/handler and App wiring remain unchanged. Current git status lists only Toolbar.jsx, Toolbar.logout.test.jsx, CURRENT and new task/evidence files, consistent with the permitted scope.

I independently viewed signed-in-nopwa-320-en-light-panel.png (uniform single row), pwa-visible-768-en-light-panel.png (accepted wrapping with logout/group divider adjacent), and keyboard-1280-is-dark-focus-panel.png (visible dark-mode focus). These captures support the intended layout and content-sized logout. I did not rerun the browser harness, lint or build; CC's 29 scenarios / 298 assertions, contrast/geometry measurements and successful lint/fresh build remain attributed to CC, cross-checked by Jonesy's evidence review.

Jonesy's N1–N6 are non-blocking. Exact-name/PWA-hidden assertion hardening is optional; source, SVG checks, screenshots and actual functional tests provide adequate evidence for this narrow change. Leading divider at tablet wrap and smaller disclosure toggle are explicitly accepted in the approved prompt. No additional production changes required.

CURRENT set CLOSED. No commit, push, deployment, production/Neon mutation or GitHub issue closure. #434's owner-controlled production-cookie verification remains pending; this local presentation PASS does not establish it. InstallPWA event timing remains a source-derived report-only observation for a separate owner-selected task.

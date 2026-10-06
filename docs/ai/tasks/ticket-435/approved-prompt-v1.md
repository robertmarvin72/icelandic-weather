# #435 — Approved implementation prompt v1

2026-10-06. Ripley consolidated Round 1 scope, Round 2 concrete specification and Jonesy's APPROVED conditions C1–C5 below (conditions copied verbatim). Execute only this approved file when CURRENT references it at READY_FOR_CC and owner sends `Prompt approved`. Immutable once CC starts. Do not execute prompt-review.md.

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/435

Precedence: concrete Round 2 specification overrides underspecified Round 1 presentation clauses; C1–C5 and the explicit token decision below refine that specification. All unchanged-behavior and STOP boundaries apply. This is presentation-only work; the following reviewed contract is consolidated here so CC need not interpret discussion history as instructions.
## Objective and scope

Make the existing Settings disclosure a compact coherent row: units, language, theme, subtle vertical separator, LogOut icon plus translated logout text. Fit one row where space permits; wrap naturally on small screens without a forced full-width logout row. Preserve #434 logout behavior, visibility, pending/error handling, focus and auth/campsite safeguards. No auth/backend/gating changes, other header redesign or new library.

Owner selected #435 in the established Ripley session. #434 is locally CLOSED/PASS; its owner-controlled production-cookie verification remains pending, not a blocker for this presentation task. Initial git status was clean (only git ignore-access warnings). Do not infer commit/push/deployment or production verification from clean status.

## Read-only audit findings

- Toolbar.jsx owns settingsOpen, success closure and focus return via refs. App -> PageHeader -> Toolbar already passes isSignedIn, onLogout, loggingOut. Existing entrypoint is reachable via Settings at / and /about.
- Current panel is flex flex-wrap, right-aligned inside a self-start column. Logout wrapper forces basis-full w-full with border-t; button has w-full sm:w-auto, min-h-[44px], neutral colors, focus-ring, disabled and aria-busy. These layout classes and emoji are the presentation targets.
- Units/language/theme buttons use small px-2 py-1 text-xs styling. Achieve similar visual height for all three and logout inside this panel while retaining comfortable touch targets. Local spacing/hit-area changes to these three settings controls are within scope; campsite/location/hero controls are not.
- InstallPWA is another panel child, conditionally visible after beforeinstallprompt. It accepts className; behavior and existing text are outside scope. DevProToggle renders only when DEV is true and MODE=development. Preserve both optional controls, order and functionality.
- lucide-react is already installed and used by other components. Import named LogOut, size 16, through the existing extensionless frontend pattern; no icon library installation.
- Existing logoutLabel/loggingOutLabel/logoutFailed keys provide IS/EN copy. No new copy required. Keep the pending label and accessible name behavior, not an icon-only action.
- Toolbar.logout.test.jsx currently asserts a decorative door emoji, min-h-[44px] and ordering after a DEV sentinel. Only obsolete visual assertions should change; behavioral tests must stay.
- #434 real App wiring tests cover resolved/anonymous/DEV/refetch visibility, Pro-to-Free selection/list behavior, success/failure and focus. Shared hooks/API need no edits.

## Implementation contract

1. Repeat read-only inspection of Toolbar, optional child controls and tests before editing. Restrict production changes to Toolbar.jsx presentation: import/icon, classes and necessary grouping markup. Prefer InstallPWA className prop if styling is required; do not change child logic or hardcoded legacy labels in this task.
2. Remove forced full-row wrapper and mobile full-width logout button. Render inline, content-sized logout last, following all existing settings controls including DEV toggle, within the same wrapping panel. Add subtle border-l separator on the logout group using existing light/dark border colors and modest spacing. Separator remains adjacent to logout when wrapped, not stranded alone; no top-border full-width separator.
3. LogOut size={16} is decorative aria-hidden, nonfocusable; text always visible (Skrá út / Log out or existing translated pending text). Neutral default text/icon and subtle hover background, pointer cursor, visible keyboard focus. No red default, lock icon or emoji door.
4. Keep compact visual proportions across units/language/theme/logout. Retain at least 44px-high operable targets for logout and make neighboring display controls comparable within this panel through local spacing classes. Do not shrink the #434 touch target solely to fit a row. Let controls wrap at narrow widths; use content-sized logout without w-full/basis-full. Constrain panel/parent width as needed locally to avoid overflow while leaving campsite/location layout unchanged.
5. Preserve native button, type, disabled, aria-busy, handlers and every state/ref/effect. Do not alter handleLogout, lift settingsOpen, change visibility derivation, navigation, hooks, preferences, analytics or API. Anonymous panel has no logout separator/gap. Preserve PWA and DEV controls, callback order and actual functions.

## Acceptance and targeted validation

- Update obsolete Toolbar logout icon/layout assertions to check decorative SVG and visible real-dictionary IS/EN label. Keep all existing success/failure/pending/focus/order assertions. Add relevant assertions for inline group/divider absence for anonymous and other Settings callbacks if existing tests do not cover them. Avoid treating class assertions or jsdom as proof of responsive geometry.
- Test DEV ordering with sentinel, and conditionally visible PWA control (sentinel acceptable for DOM/order tests; browser uses actual InstallPWA through a mocked beforeinstallprompt event). Do not remove optional controls to make row fit.
- Run Toolbar.test.jsx, Toolbar.logout.test.jsx, App.logoutWiring.test.jsx and existing useLogout tests, then lint and production build. Report commands/counts and any failures accurately. Broaden tests only if new changes expose concerns; no unnecessary full suite for CSS/markup-only work.
- Browser/visual checks at 320px, 375px, tablet 768px and desktop 1280px in IS and EN, light/dark themes. Use deterministic session/API mocks matching actual parsing contracts, no live accounts/Neon/GA/payment calls. Inspect actual screenshots, not only DOM measurements. Check default and pending text widths, horizontal overflow, neutral colors/divider, row alignment at ample width, clean wrapping at narrow width, logout content width (not full panel), touch dimensions and visible keyboard focus. Cover PWA visible and hidden at narrow/ample widths; optional controls may cause wrapping even on tablet.
- Confirm keyboard reaches logout and activates it; success still closes panel/returns focus, failure stays usable, pending blocks repeats, anonymous hides it. Existing behavioral suites prove unchanged auth flow; no new production cookie verification claim. Browser checks remain mocked and report limitations.
- Write any new screenshots/harness under outputs/ticket-435-browser-evidence/, preserving #434 evidence. If browser tooling unavailable, report the exact limitation and leave visual acceptance unverified rather than invent evidence.

## STOP and handoff

Stop and return to Ripley for required auth/logout/cookie/hooks, entitlement/payment, forecast/scoring, unrelated header redesign, child behavior, dependencies or backend changes. Presentation-only exceptions above do not authorize those changes. Preserve #434 implementation/history, production-verification caveat and all unrelated changes. No commit, push, deployment, production mutation or issue closure.


## Concrete presentation specification

**E1 — choose A.** Units, language, theme and logout share a single local class string: min-h-[44px], px-2, py-1, text-xs, rounded-lg, border, neutral light/dark backgrounds/text/borders and subtle hover. Include inline-flex items-center justify-center gap-1, whitespace-nowrap, focus-ring and cursor-pointer. Logout additionally retains its existing pending/disabled classes and behavior. Use the same string for PWA via Toolbar's className prop (E3). Compact means content-width actions in a uniform row, not reducing touch height; panel height may grow. Measure all four controls in the browser: each >=44px and equal height (allow <=1px rounding). DEV toggle remains unchanged and is exempt from uniform production height/style criteria.

**E2 — group owns divider.** Render logout as a content-sized non-wrapping group with border-l, pl-2 and ml-1 (or equally modest existing spacing), containing only logout button. No standalone separator sibling, basis-full, w-full or border-t. Accept either all controls sharing a row or logout group wrapping to its own right-aligned line, with a leading vertical bar immediately beside its button. That leading bar is explicitly accepted; show it in screenshots if it occurs and report wrap state. “Stranded” means bar separated from its group/button or left hanging on another row. Never hide divider by viewport breakpoint. Anonymous renders no group/border/extra gap. Group follows DEV where present, otherwise theme.

**E3 — PWA styling is decided.** Toolbar passes the complete shared class string to InstallPWA because className replaces its default, including focus-ring, cursor-pointer and dark variants. No InstallPWA/DevProToggle source edits, no changes to their labels/events/functionality. PWA remains first, then units, language, theme, DEV (when present), logout.

LogOut named import size 16 is explicitly aria-hidden="true" and focusable="false". Preserve visible translated normal/pending text and exact accessible name. No new labels, logic or libraries. Units/language/theme gain the shared visible focus/cursor styling only; preserve attributes/callbacks. Existing logout state/ref/effect/handler, pending blocking, success focus, visibility and error behavior are unchanged.

## Tests and scope evidence

**E5.** Real dictionary exact role names for IS/EN logout; exactly one SVG, explicit aria-hidden=true, width/height=16, no door emoji in text. Retain min-height/focus class guards but label them guards, not geometry proof. Keep success/failure/pending/focus tests unchanged except obsolete visual assertions. Rename “last row” test “last control”; use PWA and DEV sentinels to assert PWA -> units -> language -> theme -> DEV -> logout order. Separately no-PWA/no-DEV anonymous panel has exactly three direct button children; signed-in last child contains logout with nothing following. Add other settings callback checks if missing. App.logoutWiring.test.jsx must run unchanged; if an edit seems necessary, report before expanding tests unnecessarily.

Run Toolbar.test.jsx, Toolbar.logout.test.jsx, App.logoutWiring.test.jsx, useLogout.test.jsx, lint and build. Report exact commands/counts/failures. No full suite required unless new concerns justify it.

**E6.** Before editing record git rev-parse HEAD, git status --short and SHA256 of Toolbar.jsx/Toolbar.logout.test.jsx. Capture baseline contents/hashes of protected files or equivalent evidence so unchanged assertions can be substantiated. At end list every touched file, status and diff --stat. Allowed tracked production change only Toolbar.jsx; tests Toolbar.logout.test.jsx (Toolbar.test.jsx only if justified); task docs/CURRENT and new outputs/ticket-435-browser-evidence allowed. Explicitly verify unchanged package.json/lockfile, InstallPWA, DevProToggle, hooks, api, translations, index.css and other config. Dirty baseline is recorded and preserved, not an automatic blocker; compare against pre-edit state rather than claim HEAD diff was all this task. No commit/push.

## Browser matrix and evidence (E4/E7)

Use production preview (DEV false; DEV ordering proven by unit sentinel, not preview). Mock API session shapes, abort external requests, anchor me response before navigation and let rendering settle. Reuse documented #434 Splash CSS workaround only if needed with empty forecast; state every workaround. Set dark mode through the actual app theme storage contract read from source, not a guessed key.

Mandatory layout scenarios:
- Signed-in, PWA hidden: 320/375/768/1280 × IS/EN × light/dark = 16 scenarios.
- PWA visible: 320 light and dark, 768 light, 1280 light, in at least one language = 4 scenarios. Open Settings first, THEN dispatch mocked beforeinstallprompt with prompt/userChoice/preventDefault support; assert real InstallPWA appears. No-event scenario proves hidden state. Do not fire the event before component mounts.
- Pending: 320 and 1280 × IS/EN = 4 scenarios, hold logout response until capture then release. Report changes to wrap/neighbour position from longer pending labels; movement acceptable without clipping/overflow. Local min-width only if an observed jump warrants it; no unrelated hacks.
- Anonymous: 320 and 1280 = 2 scenarios with resolved me anchor.
- Keyboard focus: Tab to logout at 320 and 1280 = 2 scenarios; capture visible ring and activate by keyboard, assert successful closure/focus return.
- Failure once = 1 scenario; show translated feedback and enabled retry. Pending repeat prevention remains covered by existing unit suite.

These are 29 reportable scenarios; each may contain multiple assertions. Report both scenario count and assertion passed/total without conflating them. Measure overflow, content-sized logout width (against panel usable width), four equal >=44px control heights, computed cursor=pointer and layout row/wrap status. At ample width/no PWA normal controls must share one row; narrower columns or optional PWA may wrap. Confirm neutral light/dark defaults and adjacent divider. View generated screenshots for every distinct layout/state rather than relying solely on numbers; capture all matrix scenarios with deterministic names. Missing visual checks are reported unverified, never fabricated. Evidence under outputs/ticket-435-browser-evidence, #434 preserved; no live account/payment/GA/Neon calls.

## Report-only observation and handoff

InstallPWA listens for beforeinstallprompt only while Settings is open, so an earlier one-shot event may be lost. This is source-derived, not observed product behavior; report for a separate owner-selected ticket. Do not fix event timing or open a ticket automatically in #435. #434 owner production-cookie check remains pending and unchanged.


## Jonesy approval conditions C1–C5 (verbatim)

**C1 — test mechanics (traps in the current test file).**
- Vitest sets `import.meta.env.DEV` to true by default, so every test that expects "no DEV control" (including the anonymous three-button-children test) must `vi.stubEnv("DEV", false)` explicitly. The existing DEV-ordering test already stubs it.
- `Toolbar.logout.test.jsx` mocks `./InstallPWA` with a fixed `() => null`. For the PWA ordering test and the "exactly three direct button children" test to coexist, the mock must be switchable (for example a `vi.hoisted` flag the sentinel reads), not a second `vi.mock` of the same module in one file.
- Round 2 says to add "other settings callback checks if missing". They are missing: neither `Toolbar.test.jsx` nor `Toolbar.logout.test.jsx` touches the units, language or theme buttons (I grepped both). So this is required, not conditional: click each of the three and assert `onToggleUnits`, `onToggleLanguage` and `onToggleTheme` are called once, locating them by their existing accessible names/titles ("Switch to imperial units", the language button's `title`, "Switch to dark mode") so the test also proves those attributes survived the restyle. Each must still be `type="button"`.
- The SVG assertion also checks `focusable="false"` in addition to `aria-hidden="true"` and width/height 16.

**C2 — name the colour tokens; do not lower logout contrast.**
Round 2 says "neutral light/dark backgrounds/text/borders" without tokens. Today logout uses `text-slate-600 dark:text-slate-300` (hover 900/100) while the three neighbours use `text-slate-500 dark:text-slate-400`. At `text-xs` (12px) the shared string must not reduce logout's current contrast. v1 states the exact tokens; Jonesy recommendation: use logout's existing text/hover tokens for all four controls and keep the neighbours' existing border/background tokens. The harness reports computed text-vs-background contrast for the normal (non-disabled) state in light and dark; WCAG AA 4.5:1 is the target. The pending `disabled:opacity-60` state is inherited from #434 and is reported, not gated.

**C3 — fresh build for the evidence.**
Unlike #434, this task changes production code, and `vite preview` serves whatever `dist/` currently contains. v1 requires the production build to run after the last production edit and before the browser run, with the build completion time and the `Toolbar.jsx` mtime recorded in the report; any later edit to `Toolbar.jsx` means rebuild and re-run. State the preview port and that the run hit the fresh `dist/`.

**C4 — pin down the unspecified evidence details.**
- "At ample width, normal controls share one row": hard assertion at 1280 with PWA hidden (also report the PWA-visible 1280 row state); 768 is observational (report the wrap state and screenshot); 320/375 are expected to wrap.
- The two keyboard scenarios must cover light and dark between them (for example 320 light and 1280 dark, names recorded). The harness reaches logout by pressing Tab until `document.activeElement` is the logout button, with a bounded loop and the press count recorded, never a hard-coded count, then asserts the computed focus ring is not `none` (box-shadow or outline) and captures a screenshot. In dark mode inspect the screenshot, since `focus-ring` uses the default ring-offset colour.
- The PWA-visible scenarios and the anonymous/pending/failure scenarios each state their language and theme in the scenario name. The harness runs with default (non-standalone) display mode so `InstallPWA` is not suppressed, and the dispatched event provides `preventDefault`, `prompt` and `userChoice`.
- `index.css` defines `focus-ring` twice (L33 and L357); do not edit it, just report the rendered ring.

**C5 — Settings toggle stays as is.**
The disclosure button ("Stillingar ▼") keeps its current `px-2 py-1 text-xs` styling and is not part of the uniform string. With the panel controls now at 44px the toggle will look smaller than the controls beneath it; CC reports this in the screenshots as an observation only and does not restyle it unless Ripley/owner extend scope.


## Ripley token decision (C2)

Use the following exact shared class string for units/language/theme/logout and the InstallPWA className prop:

`inline-flex min-h-[44px] items-center justify-center gap-1 whitespace-nowrap px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800 focus-ring cursor-pointer transition-colors`

Logout retains disabled:opacity-60 and its existing native disabled/aria-busy behavior. No full-width sizing. Divider wrapper uses border-l border-slate-200/80 dark:border-slate-700/60 pl-2 ml-1 and a non-wrapping content-sized layout. Measure contrast against the rendered/composited background rather than treating translucent bg-slate-800/50 as opaque; target 4.5:1 normal-state text. If measured contrast requires different production tokens, STOP and return the measurements to Ripley, rather than silently changing the reviewed color specification. Pending inherited opacity is report-only.

## Required lifecycle and final report

Verify CURRENT at READY_FOR_CC referencing this file, then set CC_IN_PROGRESS before production edits. Implement only this presentation contract and its tests/evidence. Write docs/ai/tasks/ticket-435/cc-report.md with baseline hashes/status/HEAD, touched paths, exact commands/counts, build time and source mtime, 29 scenario results plus separate assertion totals, screenshots viewed, measured geometry/contrast/focus, workarounds and honest limits. Keep PWA timing observation and #434 pending production-cookie check explicitly report-only.

Populate CC report path in CURRENT, then set CC_COMPLETE after writing report. Owner next sends CC búinn to Jonesy; Jonesy writes result-review, Ripley assesses. No commit, push, deployment, production/Neon/live-user mutation or GitHub closure. Preserve other task history. Stop for any required behavior/backend/hooks/dependency change beyond the scope above.

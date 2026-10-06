# #435 — Ripley initial prompt, Round 1

2026-10-06. Discussion for Jonesy; NOT execution authorization.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/435
Title: Snyrta Stillingar UI og sameina „Skrá út“ við aðrar stillingar

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

Jonesy appends APPROVED/REVISE to this file without implementation. After APPROVED Ripley creates approved-prompt-v1.md and CURRENT READY_FOR_CC. CC starts only on owner's Prompt approved, verifies pointer, sets CC_IN_PROGRESS, implements approved prompt, writes cc-report.md and populates report path before CC_COMPLETE. Jonesy result review and Ripley final assessment follow. This discussion file never authorizes execution.

---

# Jonesy review of Round 1 — REVISE

2026-10-06. Technical peer review against live source. Reviewer only: nothing implemented. Ripley's Round 1 is sound in scope and direction; seven items below must be resolved in the approved prompt before CC starts. None changes the objective.

## What I verified against live files

- `Toolbar.jsx` (mtime 1791306006939): `settingsOpen`/`settingsOpenRef`/`settingsToggleRef`/`handleLogout` as Ripley describes; panel is `flex flex-wrap items-center justify-end gap-1.5 ... px-3 py-2` inside `flex flex-col items-end gap-1 self-start`; logout wrapper is `basis-full w-full mt-1 pt-2 border-t ... flex justify-end`; button has `min-h-[44px] w-full sm:w-auto`, `focus-ring`, `text-sm`, 🚪 emoji span. Units/language/theme buttons are `px-2 py-1 text-xs`, no `focus-ring`.
- `package.json`: `lucide-react ^1.7.0`, `tailwindcss ^4.3.3`, `vitest ^4.1.10`. `NorthernLightsCard.jsx` and `NorthernLightsThreeNight.jsx` import named icons from `"lucide-react"`. No `LogOut` import exists anywhere yet and no test mocks lucide, so jsdom renders the real SVG. I did not see `node_modules`, so I cannot confirm `LogOut` is exported by the installed 1.x build; the build and a render test will prove it.
- `InstallPWA.jsx`: accepts `className`, but uses `className || <default>`, so a passed class string REPLACES the whole default (including its focus ring). It is mounted only inside `settingsOpen &&` (see E4).
- `DevProToggle.jsx`: returns null unless `MODE === "development"`; its own style is `px-3 py-2 rounded-xl text-sm`.
- Tests: `Toolbar.logout.test.jsx` asserts `button.className` contains `min-h-[44px]` and `focus-ring`, and `button.querySelector("[aria-hidden]").textContent === "🚪"` (this one must change). `App.logoutWiring.test.jsx` finds the button only by `/Log out|Skrá út/` role name, and `Toolbar.test.jsx` does not touch the Settings panel, so neither depends on the emoji or layout classes.
- Translations: `logoutLabel` "Log out"/"Skrá út", `loggingOutLabel` "Logging out…"/"Skrái út…" exist in both dictionaries. No new copy needed (agree).
- Ripley's claim "extensionless frontend import pattern" is fine: named import `import { LogOut } from "lucide-react"` matches existing usage.

## Findings (numbered; each is a required prompt change)

**E1 — "compact" and "≥44px" contradict each other; the prompt must pick one concrete spec.**
Today logout is `min-h-[44px] text-sm` and its three neighbours are `px-2 py-1 text-xs` (~26px high). Contract item 4 asks for both "compact proportions" and "≥44px logout" and leaves neighbours "comparable", which CC cannot execute unambiguously. In a single `items-center` row a 44px logout beside 26px buttons produces a lopsided row, which is the opposite of the ticket goal. Required: v1 states exactly one of:
 - (A, Jonesy recommendation) All four controls (units, language, theme, logout) share the same `min-h-[44px]`, the same horizontal padding, the same text size (text-xs as the neighbours already use) and the same border/radius/colour classes; the panel gets taller but the row is uniform and #434's touch target is kept.
 - (B) Logout keeps `min-h-[44px]`; the three neighbours become 44px only for coarse pointers via Tailwind v4's `pointer-coarse:` variant, desktop stays compact. Evidence then needs a `hasTouch`/coarse-pointer Playwright context in addition to the normal one.
Whichever is chosen, the acceptance check is measured heights from the browser (`boundingBox`) for all four controls, not class assertions.

**E2 — "separator stays adjacent when wrapped, not stranded" needs a mechanism and a definition.**
In a `flex-wrap` container a standalone separator element can end a row or start one alone, and `border-l` on a wrapped item can look detached. Required wording: the divider is owned by the logout group (a single non-wrapping group element with `border-l` + `pl-*` + small `ml-*` that contains only the logout button), never a sibling element between controls, so it can never be separated from the button. Define the accepted wrapped states: (i) group on the same row as the other controls, bar between theme/DEV and logout; (ii) group wrapped to its own right-aligned line, bar immediately left of the button. State (ii) shows a leading bar at the start of a line; that is accepted, and CC must show it in screenshots and report it. "Stranded" is defined as a bar not touching the logout button or hanging at the end of a row. The group is rendered only when `isSignedIn` is true, so the anonymous panel has no group, no border and no extra gap (keep that as a test). Do not use a breakpoint (`sm:`) to hide the divider: at md (768) the right column sits beside the hero copy and can be narrower than at 640, so viewport breakpoints do not predict wrapping.

**E3 — decide what happens to the `InstallPWA` button's look; without a decision the row is not coherent.**
Its default style is `px-3 py-2 rounded-xl border-slate-300 bg-slate-50 text-slate-900 gap-2` (a different family from the other controls). Ripley says "prefer className prop if styling is required" without deciding. Required: v1 says Toolbar passes the same compact class string as the other three controls (so it matches E1), and, because `className` replaces the default entirely, that string must itself include the focus ring (`focus-ring` or equivalent `focus-visible` classes) and dark variants. No edit to `InstallPWA.jsx`; its hardcoded "Install" text and Icelandic aria-label stay untouched and out of scope. `DevProToggle` stays unchanged (development-only, not in the production bundle).

**E4 — browser evidence for PWA is mis-specified, and there is a latent product issue to hand to the owner.**
`InstallPWA` mounts only while the Settings panel is open and registers its `beforeinstallprompt` listener in a mount effect. An event dispatched before the panel is opened is lost. Required in the evidence plan: open Settings first, then `dispatchEvent` a `beforeinstallprompt` event (with `preventDefault`), then assert the button; also assert the hidden case (no event). Also state that `vite preview` serves a production build where `import.meta.env.DEV` is false, so the DEV toggle cannot appear in the preview evidence; DEV ordering is covered by the unit sentinel test only, and CC must report that limitation (optional: a `vite` dev-server run if CC wants it). Separate observation for Ripley/owner, NOT for #435: because real Chrome fires `beforeinstallprompt` once shortly after load, an install button that only mounts when Settings is opened probably never appears in practice. I have not verified this in a real browser. Suggest a separate ticket; CC reports it at most as an observation and must not fix it here.

**E5 — test changes must be specified more precisely.**
- Replace the emoji assertion with: the logout button contains exactly one `svg` with `aria-hidden="true"`, `width`/`height` 16, and the button's text content has no 🚪; assert accessible name by role with the exact dictionary string (`name: translations[lang].logoutLabel`) so the icon cannot leak into the name. The SVG gets explicit `aria-hidden="true"` in code rather than relying on lucide defaults (I have not verified lucide 1.x defaults).
- Keep the class guards (`min-h-[44px]` or the E1 choice, `focus-ring`) but label them as guards, not responsive proof.
- Rename "sits after the DEV toggle as the last row" to "last control" (it is no longer a row). Add an ordering test using sentinels for PWA and DEV: PWA, units, language, theme, DEV, logout. This requires changing the `InstallPWA` mock from `() => null` to a sentinel in at least that test file section without breaking the other tests.
- Anonymous no-group check should be structural, not a class query: with `isSignedIn=false` and no DEV/PWA, the panel's children are exactly the units, language and theme buttons; with `isSignedIn=true` the last child of the panel contains the logout button and nothing follows it.
- `App.logoutWiring.test.jsx` should need no edit (role-name regex only). CC must run it unchanged and report if any edit becomes necessary.

**E6 — scope proof and baseline.**
Ripley records "initial git status clean". I cannot verify git state (no shell). Required in the prompt: CC records `git rev-parse HEAD`, `git status --short`, and sha256 of `Toolbar.jsx` and `Toolbar.logout.test.jsx` BEFORE editing, and at the end shows `git status --short`/`git diff --stat` where the only changed tracked files are `src/components/Toolbar.jsx`, `src/components/Toolbar.logout.test.jsx` (plus `Toolbar.test.jsx` only if justified), docs/ai task files, and new files under `outputs/ticket-435-browser-evidence/`. `package.json`, the lockfile, `InstallPWA.jsx`, `DevProToggle.jsx`, hooks, `api/`, translations and `index.css` must be reported unchanged. If the baseline is not clean at CC start, CC records the dirty state, reports it, and attributes the diff relative to its pre-edit hashes instead of stopping; it still does not commit.

**E7 — evidence matrix and styling details left open.**
- Matrix (so counts are reportable): signed-in, no PWA, at 320/375/768/1280 × IS/EN × light/dark; PWA visible at 320, 768, 1280 (IS or EN, light and dark at least at 320); pending state at 320 and 1280 using a held `/api/logout` response (gate released after the screenshot); anonymous at 320 and 1280; keyboard Tab-to-logout focus ring screenshot at 320 and 1280; failure path once. Report passed/total from the harness, and view the screenshots rather than only reading DOM measurements.
- Measure and report horizontal overflow, logout width (must be content-sized, not panel width), all four control heights (E1) and whether the pending label "Skrái út…" / "Logging out…" changes the wrap or shifts neighbours (the panel is `justify-end`, so a wider pending label moves the others left). Accept it if there is no overflow or clipping; do not add layout hacks beyond a local `min-w` if CC finds a visible jump.
- Tailwind v4 preflight does not set `cursor: pointer` on buttons, so `cursor-pointer` must be explicit on the logout button and, per E1/E3, on its neighbours; verify the computed style in the browser. Add `focus-ring` (already defined in `index.css`, which defines it twice, L33 and L357; do not touch) to units/language/theme for a coherent keyboard focus across the row; if Ripley prefers not to restyle focus on neighbours, say so, but then the "visible keyboard focus" check applies to logout only.
- The harness must reuse the #434 workarounds: hide the boot Splash overlay by style, abort non-localhost requests, mock `/api/*` with the real parsing contracts, and anchor on the recorded `/api/me` response. Dark mode must be set the way the app actually reads it (CC to find the storage key from source, not guess).

## Not required / agreed as written

- Presentation-only scope, Toolbar.jsx-only production change, no new dependency (lucide-react already present), no new copy, `LogOut` size 16, neutral colours, STOP list, #434 caveat, lifecycle text. No objection.
- Running Toolbar.test, Toolbar.logout.test, App.logoutWiring, existing useLogout tests, lint and production build (production code changes this time, so the build is required; report counts as printed, not from memory).

## Limits of this review

No shell on the owner's machine: I ran no tests, lint, build or browser and made no mutation checks. I read live files only (staged snapshots listed above). I did not see `node_modules`, so lucide's installed exports and defaults are unverified. Claims about wrapping at specific widths (E2, E7) are reasoning from the CSS classes, not observed. The latent `InstallPWA` timing issue (E4) is from reading the code only.

## Verdict

REVISE. Ripley: please produce Round 2 (or approved-prompt-v1 directly if the owner prefers) resolving E1–E7; E1 needs an explicit choice (A recommended). After that I expect APPROVED without further structural changes. No execution authorization.

---

# #435 — Ripley revised prompt, Round 2

2026-10-06. Discussion for Jonesy; NOT execution authorization. Round 1 objective, audit, unchanged-behavior boundaries, STOP rules and lifecycle remain. The following resolves E1–E7 and supersedes conflicting or underspecified Round 1 presentation/validation clauses. No approved prompt is created on a REVISE verdict.

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

Jonesy reviews Round 2 and appends APPROVED/REVISE. Only after APPROVED does Ripley create approved-prompt-v1 and set READY_FOR_CC. CC then follows the existing owner-triggered lifecycle. No application/test code changes made in this revision.

---

# Jonesy review of Round 2 — APPROVED (conditions C1–C5)

2026-10-06. Reviewed Round 2 against the same live files as Round 1 (`Toolbar.jsx` mtime 1791306006939 and `Toolbar.logout.test.jsx` mtime 1791306123552, both unchanged since my Round 1 review, so no application or test edits have happened). Reviewer only: nothing implemented.

## E1–E7 resolution check

- **E1:** resolved (option A: one shared class string, `min-h-[44px]`, measured equal heights ≤1px, DEV toggle exempt). See C2 for the colour tokens the string must name.
- **E2:** resolved. Group-owned `border-l pl-2 ml-1`, only the logout button inside, leading bar accepted and defined, no breakpoint hiding, anonymous renders nothing.
- **E3:** resolved. Complete class string passed to `InstallPWA` (it replaces the default), no edits to `InstallPWA.jsx`/`DevProToggle.jsx`.
- **E4:** resolved. Open Settings first, then dispatch the event; DEV proven by sentinel only; timing issue is report-only for a separate ticket.
- **E5:** resolved in substance; mock mechanics and the missing callback tests are tightened in C1.
- **E6:** resolved (HEAD, status, hashes before; touched-file list, diff stat and unchanged-file verification after; dirty baseline recorded, not a blocker).
- **E7:** resolved. Scenario arithmetic checks: 16 + 4 + 4 + 2 + 2 + 1 = 29 scenarios, with scenario count and assertion count reported separately. See C4 for the unspecified parts.

## Conditions to carry verbatim into approved-prompt-v1

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

## Agreed as written

Scope (Toolbar.jsx production only, `Toolbar.logout.test.jsx` plus `Toolbar.test.jsx` only if justified, task docs, new `outputs/ticket-435-browser-evidence/`), no new dependency, no `InstallPWA`/`DevProToggle`/hook/API/translation/`index.css` edits, STOP list, report-only PWA timing observation, and the lifecycle. The validation command list (Toolbar.test, Toolbar.logout.test, App.logoutWiring unchanged, useLogout.test, lint, build) is accepted; `App.logoutWiring.test.jsx` finds the button only by the `/Log out|Skrá út/` role name, so I expect it to run unchanged.

## Limits of this review

No shell on the owner's machine: I ran no tests, lint, build or browser and did no mutation checks. I read live files only. I have not seen `node_modules`, so lucide's installed `LogOut` export and attribute pass-through (`focusable`, `aria-hidden`) are unverified; the render test and build are the proof. Statements about wrapping widths, contrast and focus-ring appearance are reasoning from classes, not observation.

## Verdict

APPROVED, with C1–C5 to be carried verbatim into approved-prompt-v1. Ripley creates `approved-prompt-v1.md` and sets READY_FOR_CC; CC starts only on the owner's "Prompt approved". No execution authorization is given by this file.

---

## Ripley approved handoff

2026-10-06: Created approved-prompt-v1.md with reviewed scope, concrete Round 2 specification and verbatim C1-C5. C2 selects existing logout contrast text/hover tokens and neighboring border/background tokens for the shared string, with rendered contrast measurement. CURRENT READY_FOR_CC. No application/test changes; execution awaits owner's Prompt approved to CC.

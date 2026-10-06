# #435 — CC execution report

Executed: `docs/ai/tasks/ticket-435/approved-prompt-v1.md` (owner `Prompt approved`; CURRENT.md was READY_FOR_CC). Presentation-only work on the Settings row. Issue: https://github.com/robertmarvin72/icelandic-weather/issues/435

No commit, no push, no deployment, no production/Neon/live-user mutation, no GitHub issue closure, no production cookie verification claim. #434 owner production-cookie check remains pending and is not established by this report.

## 0. Baseline (before edits, E6)

- HEAD: `94daefe9c34458bc6c6cd40fc5994459fb3d4115` (#434 commit).
- `git status --short` before edits: `M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-435/` (task docs only; no production changes).
- SHA256 before edits:
  - `src/components/Toolbar.jsx` 2974ab52c833eb10f2d3190963b52c4f443dedc2994956ace561e519fabcaa69
  - `src/components/Toolbar.logout.test.jsx` 60d85fce82fbfd97473d15ec27cef2190ec45511c837ab2bda7c4ff93fb9be0f
  - `src/components/Toolbar.test.jsx` 1a32403fd834fad262142ebba2b9fbf02e44e34c62d2f3c6e2e4cc15c03405f4
  - `src/components/InstallPWA.jsx` 68bc809b426984fabfb657be3e7caac5c42637370042c08fc6c17acd192779b8
  - `src/components/DevProToggle.jsx` a3f2bd14d7de0d51d00eea3b2ce2476b1496fa9205826357e7214d31e51c6ba1
  - `package.json` e3ec690b78914a2982258636bc4b0751ada593779eacd06f9015e4d7d33191ac
  - `package-lock.json` e2be69235c7e96db2f5172c9799bc2ecff0dda94525aabe98800ad32c447fc0f
  - `src/index.css` 398f64b2692ac62862c8273775a0c62205b4fb8d9325f05a4eb0695ffe18e404
  - `src/i18n/translations.common.js` 6956c6e04424ab61d8eb0934ef60068ab1e4ac8e3e484ae59abf268193da8ebd
  - `src/components/PageHeader.jsx` b93d3a6bea02031e58cc2d86cbe54c4c3435491f67015112bf65a11728493979
  - `src/App.jsx` 8c8a30fe5f6c84842e235dd6d8f657d7ddd76ec8d67c354fe29b7405f8b2608d

## 1. Touched paths and status (E6)

| Path | Status | Notes |
|---|---|---|
| `src/components/Toolbar.jsx` | modified | Presentation only: `LogOut` import, shared class constant, classes on units/language/theme/PWA/logout, content-sized logout group with `border-l`. No logic change. |
| `src/components/Toolbar.logout.test.jsx` | modified | Obsolete door-emoji assertion replaced; switchable InstallPWA mock; new layout describe block. Behavioural tests unchanged. |
| `docs/ai/CURRENT.md` | modified | Workflow lifecycle fields. |
| `docs/ai/tasks/ticket-435/cc-report.md` | new | This report. |
| `outputs/ticket-435-browser-evidence/` | new | Harness `settings-row-check.mjs`, `results.json`, screenshots. |

Protected files after the edits (compared by hand against the baseline hashes above): `Toolbar.test.jsx`, `InstallPWA.jsx`, `DevProToggle.jsx`, `package.json`, `package-lock.json`, `src/index.css`, `translations.common.js`, `PageHeader.jsx`, `App.jsx` — all unchanged. No hooks, api, translations, config or dependency change.

`git diff --stat` at end:
```
 docs/ai/CURRENT.md                     |  36 ++++------
 src/components/Toolbar.jsx             |  21 ++++--
 src/components/Toolbar.logout.test.jsx | 127 +++++++++++++++++++++++++++++++--
 3 files changed, 150 insertions(+), 34 deletions(-)
```
(Plus the untracked new files above. `Toolbar.jsx` now has 21 changed lines, not the full-row wrapper.)

## 2. Implementation (per the contract)

- Shared class constant `SETTINGS_CONTROL_CLASS` (exact owner-approved token string from the Ripley token decision): `inline-flex min-h-[44px] items-center justify-center gap-1 whitespace-nowrap px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800 focus-ring cursor-pointer transition-colors`.
- Applied to units, language and theme buttons (`className={SETTINGS_CONTROL_CLASS}`), passed to `InstallPWA` via its `className` prop (E3; InstallPWA source untouched), and to logout with `disabled:opacity-60` appended.
- Logout: `<LogOut size={16} aria-hidden="true" focusable="false" />` (lucide-react, already a dependency) + visible translated text. The 🚪 emoji is removed.
- Logout group: `<div className="flex shrink-0 items-center border-l border-slate-200/80 pl-2 ml-1 dark:border-slate-700/60">` wrapping only the button. No `basis-full`, `w-full`, or `border-t`. Anonymous renders no group, so no divider or extra gap.
- Order preserved: PWA (when present) → units → language → theme → DEV (when present) → logout group.
- Unchanged: `handleLogout`, refs/effects, `settingsOpen` (still local), visibility (`isSignedIn`), pending/disabled/aria-busy behaviour, success focus return, failure handling, the Settings disclosure toggle (`px-2 py-1 text-xs`, not the shared string, per C5).
- One comment line was added above the logout group explaining why the group owns its divider.

## 3. Tests (exact commands and results)

- `npx vitest run src/components/Toolbar.test.jsx src/components/Toolbar.logout.test.jsx src/App.logoutWiring.test.jsx src/hooks/useLogout.test.jsx` → 4 files, **65 tests passed**, exit 0 (final run, after the last test edit).
- Earlier intermediate run before the test update: 1 obsolete assertion failed (door emoji, expected); that assertion was replaced and no other test failed.
- Test changes:
  - Obsolete door-emoji/icon assertion replaced: exactly one SVG, `aria-hidden="true"`, `focusable="false"`, width/height 16, no 🚪 text, real EN label present. Class checks (`min-h-[44px]`, `focus-ring`) kept and labelled as class guards, not geometry proof.
  - Test renamed "last row" → "last control".
  - InstallPWA mock made switchable via `vi.hoisted` flag (`pwa.visible`), reset in `beforeEach`. Default still renders nothing.
  - New describe `Toolbar settings row layout (#435)` (6 tests):
    - ordering PWA → units → language → theme → DEV → logout with both sentinels visible (DEV stubbed true);
    - anonymous with no PWA and no DEV (DEV stubbed false): exactly three direct button children, no `.border-l`;
    - signed-in with no PWA and no DEV: logout group is last child, holds only the logout button, no `basis-full/w-full/border-t` class;
    - units, language and theme callbacks each called once and remain `type="button"` (located by their accessible names/titles);
    - InstallPWA receives the shared class (class guard);
    - Settings disclosure toggle keeps its own styling (class guard).
- `npm run lint` → exit 0 (full project, after all edits).
- `npm run build` → exit 0. Build finished `2026-10-06T19:13:13Z`; dist/index.html mtime `19:13:11Z`; `src/components/Toolbar.jsx` mtime `19:11:45Z` (last production edit before the build). No edit to Toolbar.jsx after the build.
- Not run: full `npm run test:run` (not required for presentation-only work per the prompt).

## 4. Browser evidence (production preview, fresh dist)

- Served by `npx vite preview --port 4173 --strictPort` from the build above (the run hit the fresh `dist/`). Preview stopped after the run; port 4173 closed.
- Harness: `outputs/ticket-435-browser-evidence/settings-row-check.mjs`. Result file: `outputs/ticket-435-browser-evidence/results.json`. Screenshots: `outputs/ticket-435-browser-evidence/*.png`.
- Mocks: `/api/me` (signed-in or anonymous), `/api/campsites`, `/api/logout` (ok, 500, or held), other `/api/*` → `{ok:true}`. External requests aborted. No live account, Neon, GA or payment call.
- `/api/me` is registered with `waitForResponse` before navigation and each scenario checks which state it answered (anchor).
- Language and theme set via the real storage keys: `localStorage.lang` and `localStorage.theme` (JSON strings, matching `useLocalStorageState` in `src/hooks`); `html.dark` drives dark mode.
- PWA: `beforeinstallprompt` dispatched only after Settings is open (InstallPWA listens while mounted), with `prompt`, `userChoice` and `preventDefault` provided. Default display mode, so InstallPWA is not suppressed.

### Workarounds (stated, as required)

1. Boot Splash overlay (`z-[9999]`) hidden via injected CSS. Same workaround as #434: the mocked forecast is empty, so the Splash never clears on its own.
2. Bottom-left toast stack (`div.fixed.bottom-4.left-4`) hidden via injected CSS for screenshots in every scenario except the failure scenario, where the toast must be visible. Unrelated forecast-error toasts from the empty mock would otherwise cover the panel.

### Scenario matrix (29 scenarios) — results

- **Scenarios run: 29 of 29. Scenarios with a failed assertion: 0. Assertions passed: 298/298.** Individual assertions are reported separately from the scenario count.
- Layout, signed-in, PWA hidden: 320/375/768/1280 × IS/EN × light/dark = 16.
- PWA visible: 320 EN light; 320 IS dark; 768 EN light; 1280 IS light = 4 (InstallPWA button present, ≥44px).
- Pending: 320 EN light; 320 IS light; 1280 EN dark; 1280 IS dark = 4 (button disabled, `aria-busy="true"`, pending label visible, all row controls ≥44px, no overflow; panel closes and focus returns on resolution).
- Anonymous: 320 EN light; 1280 IS dark = 2 (no logout control, exactly three direct buttons, no divider).
- Keyboard: 320 EN light; 1280 IS dark = 2. Tab from the Settings toggle reached logout in **4 presses** in both (bounded loop, count recorded). Focus ring present (computed box-shadow). Enter activates logout (one request), panel closes and focus returns to Settings.
- Failure: 375 EN light = 1. Translated feedback shown, logout re-enabled, panel stays open.

### Measured geometry and contrast

- No horizontal overflow in any scenario (`scrollWidth − innerWidth = 0`).
- Four row controls (units, language, theme, logout) each **44.0px** high, equal height, in every signed-in layout scenario that asserted it.
- Logout group width **88px** against a **248px** panel at 320 EN light (content-sized; the check requires <60% of panel width). Logout is not full-width.
- Pointer cursor on all four controls in every scenario that asserted it.
- Logout text contrast (composited normal state, light and dark): **7.25:1 light, 11.09:1 dark**; 4.5:1 target met in all signed-in layout scenarios.
- Method limits: colour sampled via canvas (oklch/color-mix parsed to sRGB); background composited over an assumed base (white light, slate-950 dark) and each ancestor's own background. The `soft-grid` body background image is not included. Treat as approximate; the margin (7.25 vs 4.5) is large.
- Ample width, PWA hidden, 1280: one row (hard assertion, passed in all four 1280 scenarios).

### Wrap observations (observational, reported as found)

| Width | PWA | Distinct row tops (units/lang/theme/logout) |
|---|---|---|
| 320 | hidden | 1 (single row) |
| 375 | hidden | 1 |
| 768 | hidden | 2 (logout group wraps to its own right-aligned line) |
| 1280 | hidden | 1 |
| 320 | visible | 2 |
| 768 | visible | 3 |
| 1280 | visible | 1 |

- Pending labels (`Logging out…`, `Skrái út…`) widen the logout group to 121px (EN) / 95px (IS) against the idle width. The row stays within the panel with no clipping or overflow; the neighbour shift is observed, not patched.
- At 768 (PWA hidden) the logout group sits on its own line with its leading `border-l` immediately beside its button (accepted per E2). The bar is never stranded on another row, and no bar is hidden by breakpoint.

## 5. Screenshots viewed

I viewed these at full size:
- `signed-in-nopwa-320-en-light-panel.png` — one row, divider beside logout, uniform controls.
- `signed-in-nopwa-1280-is-dark-panel.png` — one row, dark neutral controls, `Skrá út` with divider.
- `signed-in-nopwa-320-en-light-viewport.png` — full viewport. The Settings disclosure (`Settings ▲`) is visibly smaller than the 44px row beneath it. **C5 observation: reported only, not restyled.**
- `pwa-visible-320-en-light-panel.png` — Install and units/language/theme on the first line, logout group on the second line with its bar beside the button.
- `pwa-visible-768-en-light-panel.png` — three lines; logout group on its own right-aligned line with its bar beside it.
- `pending-320-en-light-pending-panel.png` — `Logging out…` fits; controls stay at 44px; divider intact.
- `keyboard-320-en-light-focus-panel.png` — visible focus ring around the logout button (light).
- `keyboard-1280-is-dark-focus-panel.png` — visible focus ring around `Skrá út` in dark mode. The ring's offset is white against the dark panel, which is what the rendered `focus-ring` produces; reported as observed.
- `failure-375-en-light-failure-panel.png` — panel stays open with logout enabled for retry (feedback toast is in the viewport screenshot, asserted by the harness).
- `anonymous-1280-is-dark-panel.png` — three buttons, no divider.

I did not view every one of the 58 files individually (29 viewport + 29 panel captures, plus pending/focus/failure extras). The scenario-level assertions cover all 29 scenarios; the screenshots above cover each distinct layout and state.

## 6. Other observations (report-only)

- **Settings disclosure size (C5):** the `Settings ▲/▼` toggle is smaller than the 44px row beneath it. Reported; not restyled per scope.
- **InstallPWA timing (report-only, source-derived):** InstallPWA listens for `beforeinstallprompt` only while mounted (Settings open), so an earlier one-shot event may be lost. Not observed as product behaviour; not fixed; for a separate owner-selected ticket.
- **Pending width shift:** the longer pending label widens the logout group (see above).
- **Browser harness limits:** Splash and toast CSS workarounds; approximate contrast method; mocked session only.
- #434 production cookie verification on campcast.is and eltumvedrid.is remains pending and owner-controlled. Nothing here establishes it.

## 7. Limitations and unverified items

- No real device or Safari/Firefox rendering; only Chromium (Playwright) was used.
- Responsive geometry verified in Chromium at the listed viewports only; widths between them, and other browsers, are unverified.
- DEV ordering is verified by the unit sentinel test only, not in the preview build (production semantics, DEV false).
- `npm run test:e2e` and the full suite were not run.
- No new production cookie verification claim.

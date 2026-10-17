# CC Report — Ticket #436: Aðgreina eigin veðurathugasemdir frá opinberum viðvörunum

Executed from `docs/ai/tasks/ticket-436/approved-prompt-v1.md` (approved, with binding conditions D1–D5 from `prompt-review.md` Round 2). No deviation from the approved prompt's scope; all production edits are presentation-only.

## Pre-edit audit (read-only, before any change)

Confirmed by direct code reading, not assumption:

- The entire weather-warning/hazard/caution presentation in this codebase is 100% self-computed from Open-Meteo forecast data against the locally-defined `HAZARDS_V1` thresholds (`src/config/hazards.js`). No part of the forecast/route-planner UI fetches or displays any live official Veðurstofa (vedur.is) warning feed.
- The only real network call to vedur.is anywhere in the codebase is `api/_lib/aurora/fetchAurora.js`'s aurora-activity-index fetch — an unrelated, pre-existing, legitimate feature (Northern Lights), explicitly out of scope and left untouched.
- `relocationEngine.js`'s `pickExplainDay(d, cfg)` always attaches `warnings: computeDayWarnings(d, cfg)` to every day object, and the aggregate `hasHighWarning`/`hasWarning` flags on each candidate are computed via `.some()` over that same `windowDaysExplained` array that becomes `candidate.windowDays` — confirming D3's data-integrity requirement (displayed reasons can be derived from the same data the flags came from) was achievable without touching engine code.
- `useRoutePlanner.js`'s `enrichWithBaseDays()` re-slices with the same `windowDaysCount` the engine used — no mismatched slicing between flags and displayed `windowDays`.

## Implementation summary

**New shared components:**
- `src/components/CautionIndicator.jsx` — icon (Lucide `CircleAlert`/`TriangleAlert`) + label + optional reasons, used by ForecastTable's new visible per-row caution line.
- `src/components/HazardSourceNote.jsx` — the exact-copy source note (Lucide `Info` + heading + body + a native `vedur.is` anchor spliced out of the translated body string so the rendered text stays byte-identical to the single translated sentence), `target="_blank" rel="noopener noreferrer"`.
- `src/lib/cautionLabel.js` — `cautionLevelLabel(level, t)`, split out of `CautionIndicator.jsx` to satisfy `react-refresh/only-export-components`.

**Production edits (all presentation-only; allowed paths per the approved prompt):**
- `src/components/ForecastTable.jsx` — 🚨/⚠️ corner badge replaced with decorative `TriangleAlert`/`CircleAlert`; new visible `<CautionIndicator>` line rendered **after** the existing summary-text IIFE (D5: untouched existing logic); row `aria-label` gets an appended suffix that is the empty string for a non-caution row (D5: byte-identical aria-label, tested); `<HazardSourceNote>` shown only when the details panel is open **and** ≥1 displayed row has a caution (F2).
- `src/components/RouteCompareTable.jsx` — `SeverityBadge`/`WarningChip` now render Lucide icons instead of emoji; the old "+N" title-only overflow truncation is **removed** — all chips now render and wrap normally (F8/F10); new `hostProvidesNote` prop (default `false`) so standalone usage always renders its own single note (including the empty/no-caution state) while a hosting parent can suppress the duplicate; `undefined → []` warnings normalization is unchanged (F5 — proven by new tests, not "fixed").
- `src/components/RoutePlannerCard.jsx` — `useId()`-based per-instance ids for note/disclosure `aria-describedby`/`aria-controls` (D2, since the card's own note and the details modal's note, a portal, can be mounted simultaneously, and multiple candidate rows each carry their own expand control); verdict-block 🚧/🚐 lines and per-candidate routeRisk HIGH/MED badges now use Lucide `Car`; site `hasHighWarning`/`hasWarning` badges use `CircleAlert`/`TriangleAlert` with reasons derived from that same candidate's `windowDays[].warnings` (D3) via the new `siteCautionReasonTypes()` helper — never a different/recomputed source, and never an invented reason when the flag is true but no per-day warning exists at that level; inline reason disclosure is a real `<button aria-expanded aria-controls>` in normal document flow, not a tooltip/popover (F8/F10); exactly one `<HazardSourceNote>` renders per card, placed adjacent to whichever section (alternatives vs. verdict block) actually has an indicator (D1).
- `src/components/RoutePlannerDetailsModal.jsx` — `Car` icon replaces the 🚐 emoji in the route-risk summary; exactly one `<HazardSourceNote>` renders unconditionally above `<RouteCompareTable ... hostProvidesNote />`, covering the day-by-day table **and** the advanced/raw table below it (no second note there); the advanced table's warning badges now key off `badge.level` (not an emoji) to pick the icon.
- `src/components/routePlannerDetailsHelpers.js` — `getWarningBadges()` now returns `level` instead of an emoji `icon` string; callers pick the Lucide icon.
- `src/lib/routePlannerNarrative.js` — **only** change: `getHazardBlockText`'s three emoji prefixes (🚨/⚠️/⚠️) removed; branch logic, interpolation, and sentence text are otherwise byte-identical (F4, the one narrow exception permitted in this file).
- `src/i18n/translations.routePlanner.js` — ~13 existing key values updated in both EN/IS (`routeWarningHigh`, `routeWarning`, `routeDetailsWarnings`, `routeCompareNoWarnings`, `routeCompareReasonClearer/Similar/Worse`, `routeCompareReasonHighHazard/WarnHazard/NoHazards`, `routeCompareReasonBetterDespiteWarning`, `routeStateFewerWarningsNearby(Description)` — confirmed zero consumers, updated anyway per F9); 3 new keys added (`hazardSourceNoteHeading`, `hazardSourceNoteBody`, `hazardSourceNoteNewTab`) with the exact issue copy in both languages.

## Observed but deliberately left untouched (out of this ticket's scope)

- `routeRoughWeatherWindowSingle`/`routeRoughWeatherWindowRange` still carry a baked-in `"⚠ "` prefix in their translation **values** (not a code-side emoji). These two keys are not in F9's explicit key list — left untouched by design, flagged here as an observed item for a future ticket if the owner wants full emoji parity.
- `routeEscapeStormTitle`'s "🚐 Escape the storm" — confirmed out of scope: it's a positive suggestion string, not a caution/warning indicator, so it doesn't fall under this ticket's own-vs-official distinction.
- A pre-existing ForecastTable horizontal-scroll characteristic at 320px width (confirmed via a control test with all-calm forecast data — i.e. zero #436 UI rendered — that the page already overflows ~180px beyond the viewport once the details panel opens, before any caution/note element exists). This ticket's own additions add only a modest amount more (~30–50px) on top of that pre-existing baseline; not a regression introduced here, and a general ForecastTable mobile-layout fix is outside this ticket's presentation-only caution/note scope.

## Tests

**New test files (6, all written for this ticket — these components/functions had zero prior coverage):**

| File | Tests | Result |
|---|---|---|
| `src/components/RoutePlannerCard.caution.test.jsx` | 8 | 8/8 pass |
| `src/components/ForecastTable.hazardCaution.test.jsx` | 29 | 29/29 pass |
| `src/components/RouteCompareTable.test.jsx` | 11 | 11/11 pass |
| `src/components/RoutePlannerDetailsModal.test.jsx` | 11 | 11/11 pass |
| `src/components/routePlannerDetailsHelpers.test.js` | 12 | 12/12 pass |
| `src/lib/routePlannerNarrative.test.js` | 11 | 11/11 pass |

`RoutePlannerCard.caution.test.jsx` and `RoutePlannerDetailsModal.test.jsx` use **real** `translations.en`/`translations.is` dictionaries (not key-only mocks), and the former deliberately leaves `RoutePlannerDetailsModal` unmocked so D2's "card note + modal note mounted simultaneously" case is exercised against real markup, per the approved prompt's explicit requirement that the existing `RoutePlannerCard.test.jsx` fixtures were insufficient for this.

All tests cover: every `HAZARDS_V1` threshold boundary (wind/gust/rain/cold/heat, warn and high), "high wins" with reasons scoped to the winning level only, D1 note placement in all four branch combinations, D2 unique ids with both notes mounted together, D3 reasons sourced from the candidate's own `windowDays` (plus the defensive "flag true, no matching per-day warning" case — severity shown, no invented reason), D5 byte-identical aria-label for non-caution rows, F5 normalization (`undefined`/`[]`/unknown type/invalid level), F8/F10 keyboard-reachable disclosure with no nested-interactive violation, and the `getHazardBlockText` emoji-removal being prefix-only.

**Existing regression suites run before writing any new code** (confirming zero regressions from the presentation-only changes): ForecastTable (3 files), RoutePlannerCard, relocationEngine (`badDayVeto`, `roughWindow`, core), Weather Voice (`weatherVoiceRules`, `useWeatherVoice`, `useWeatherVoice.shareSnapshot`), `routeRisk` — all passed before any edit and again after.

**D4 (binding) — full validation run, after the last edit:**

```
npm run test:run   → 180 test files, 2644 tests — all passing
npm run lint       → clean, zero errors/warnings
npm run build      → succeeded (pre-existing >500kB chunk-size advisory only, unrelated to this ticket)
```

One test (`src/App.affiliateHolder.test.jsx`) failed on the very first `test:run` pass with a cross-test-isolation symptom ("Not implemented: navigation to another Document"); confirmed via `git diff` that `App.jsx` and all affiliate-related files are byte-for-byte untouched by this ticket, confirmed the file passes in isolation, and confirmed the full suite passes clean (180/180, 2644/2644) on an immediate rerun — a pre-existing flake unrelated to #436, not a regression from this work.

## Scope audit

`git status --short` after all edits — only files in the approved prompt's allowed list changed:

```
M  docs/ai/CURRENT.md
M  src/components/ForecastTable.jsx
M  src/components/RouteCompareTable.jsx
M  src/components/RoutePlannerCard.jsx
M  src/components/RoutePlannerDetailsModal.jsx
M  src/components/routePlannerDetailsHelpers.js
M  src/i18n/translations.routePlanner.js
M  src/lib/routePlannerNarrative.js
?? src/components/CautionIndicator.jsx
?? src/components/HazardSourceNote.jsx
?? src/lib/cautionLabel.js
?? (6 new test files listed above)
?? docs/ai/tasks/ticket-436/  (this report + prior Ripley/Jonesy artifacts)
?? outputs/ticket-436-browser-evidence/
```

Confirmed via `git diff --stat` (zero output = byte-for-byte untouched): `package.json`, `package-lock.json`, `src/config/hazards.js`, `src/lib/relocationEngine.js`, `src/lib/relocationService.js`, `src/lib/routeRisk.js`, `src/hooks/useRoutePlanner.js`. No new dependency was added (Lucide icons used are from the already-installed `lucide-react`). Weather Voice, Top5, forecast providers, gating/entitlement logic, and scoring/hazard-threshold calculation are all untouched.

## Browser evidence

`outputs/ticket-436-browser-evidence/` — 40 screenshots + `report.json`, captured against a **fresh production build** (`npm run build` immediately before capture) served via `vite preview`, using Playwright/Chromium with mocked `/api/forecast` (deterministic payload hitting every `HAZARDS_V1` threshold: wind warn/high, rain warn/high, cold warn, heat warn), `/api/campsites`, and `/api/me` (Pro entitlement). Matrix: `{en, is} × {light, dark} × {1280px, 320px}` = 8 combinations, 5 screenshots each:

1. `*-01-forecasttable-collapsed.png` — details panel closed, no source note (F2).
2. `*-02-forecasttable-open.png` — details panel open: both caution levels visible, exactly one source note, `vedur.is` link.
3. `*-03-routeplannercard-expanded.png` — "Sjá nánar"/"See details" expanded: verdict block, alternatives list with site/route-risk badges, exactly one source note placed per D1.
4. `*-04-routeplannercard-reason-open.png` — an inline caution badge's reason disclosure opened (F8/F10: a real button in document flow, not a tooltip).
5. `*-05-detailsmodal-advanced.png` — `RoutePlannerDetailsModal` opened for a candidate with its advanced/raw table also opened: exactly one note above both tables, `Car` icon for route risk, advanced-table badges using the correct Lucide icon per level.

All 40 screenshots were rendered and visually inspected (not just asserted programmatically). Representative checks, consistent across all 8 combinations:

- `noteAbsentCollapsed: true` — no note while any host is collapsed.
- `forecastNoteCount: 1`, with `forecastHighIconCount: 2` and `forecastWarnIconCount: 8` — both caution levels genuinely rendered, never zero.
- `vedurLinkCount: 1`, `target: "_blank"`, `rel: "noopener noreferrer"`, `href: "https://www.vedur.is/"`.
- `vedurLinkContrast.ratio`: 5.56:1 (light) / 10.79:1 (dark) — both comfortably pass WCAG AA for the note's 12px body text.
- `rpcNoteCount: 2` (ForecastTable's own + RoutePlannerCard's own — each host renders exactly one; D1 is per-host, not page-wide) → `modalNoteCount: 3` once the modal opens (+1, the modal's own) → `modalNoteCountAfterAdvancedOpen: 3` (unchanged after opening the advanced table — confirms "no second note there").
- `modalCarIconCount: 4` — verdict-block line, alternatives-list badge, modal's own route-risk line, all consistently `Car`, never conflated with a site `CircleAlert`/`TriangleAlert`.
- `nestedInteractive.violations: 0` across every combination — no interactive element nested inside another.
- `overflowAfterForecastOpen` at 1280px: `0` (no page-level horizontal overflow). At 320px: confirmed via a separate control test (all-calm forecast, zero #436 UI) that this pre-existing ForecastTable characteristic exists independent of this ticket (see "Observed but deliberately left untouched" above); this ticket's own additions are not the cause.

Visual inspection (not just the programmatic checks) confirmed: correct dark-mode color tokens on all new elements (no `prefers-color-scheme`-only styling), readable IS copy ("Um veðurmatið:", "Erfiðar veðuraðstæður", "Varúð vegna veðurs", "Engar varúðarmerkingar í þessu mati"), per-row reason text lining up with the row's own icon level, and no visual overlap/clipping of the new note box or inline badges at either viewport width.

## Limitations

- The browser-evidence matrix uses mocked forecast data (not live Open-Meteo) to deterministically hit every threshold; this is appropriate for UI/presentation verification and does not touch the real scoring pipeline.
- `RouteCompareTable.test.jsx`/`RoutePlannerDetailsModal.test.jsx`/`routePlannerDetailsHelpers.test.js`/`routePlannerNarrative.test.js` are net-new coverage for files that had zero prior tests — reviewers should expect to see these as wholly new files, not diffs against prior versions.
- No GA dummy-ID evidence build and no repeat of the #430 local Qwen-model experiment were produced, per the approved prompt's explicit statement that neither is required for this ticket.

## Lifecycle (v1)

No commit, push, deployment, production mutation, or GitHub issue closure was performed. Per the approved prompt: owner sends "CC búinn" to Jonesy next; Jonesy writes `result-review.md`; Ripley does the final assessment.

---

# v2 Correction Round — approved-prompt-v2.md

Executed from `docs/ai/tasks/ticket-436/approved-prompt-v2.md` (APPROVED by Jonesy, Round 3, conditions E1–E5), following Jonesy's result-review (F-A–F-C Medium, F-D/F-E Low) and Ripley's final assessment (REVISE, narrow — F-A–F-E accepted for correction). `approved-prompt-v1.md` remains the immutable, already-executed baseline; this round is a narrow correction only.

## Corrections made

### 1. F-A/F-B — `HazardSourceNote.jsx`: sr-only new-tab text moved outside the copy paragraph

The `<span id={describedById} className="sr-only">{newTabText}</span>` was rendered **inside** the same `<p>` as the issue copy (between the `vedur.is` link and the trailing text), so the paragraph's own text included it and a screen reader could announce it twice (once inline, once via `aria-describedby`). Fixed by wrapping the `<p>` and the sr-only `<span>` in a new sibling `<div>` — the sr-only span is now a **sibling** of the copy paragraph, not a descendant, while `aria-describedby` still points to it (per-instance `useId` uniqueness unchanged). The misleading header comment ("asserted byte-for-byte by tests") was corrected to point at the actual new test file instead of the general claim.

New file (the only one this correction prompt permits, per Jonesy's E1): `src/components/HazardSourceNote.test.jsx` — 5 tests. Selects the copy paragraph structurally via `link.closest("p")`, never by dictionary text; hard-codes the literal EN and IS issue-copy strings (not read back from the dictionary — that tautology is what hid F-A in the first place); asserts the described-by element exists, holds the correct literal new-tab text, and `p.contains(describedEl)` is `false`; and a two-host test renders two `HazardSourceNote` instances together, asserting each link's `aria-describedby` resolves inside its own host container only, the two ids differ, and neither described element is a descendant of either host's copy `<p>`.

### 2. F-C — `RouteCompareTable.jsx`: `SeverityBadge` accessible name

Added `role="img"` to the badge `<span>` (which already carried `aria-label={title}`) so the severity name is reliably exposed now that its icon is `aria-hidden`. No change to icon, colour, shape, `title`, severity mapping, or any decision/reason logic. 4 new tests added to the existing `RouteCompareTable.test.jsx` (now 15 tests, was 11) asserting `getByRole("img", { name })` for EN warn (`Weather caution`), EN high (`Challenging weather conditions`), IS warn (`Varúð vegna veðurs`), IS high (`Erfiðar veðuraðstæður`) — literal strings per Jonesy's E2, not dictionary lookups.

### 3. F-D — `RoutePlannerCard.jsx`: contextual route-risk badge labels

Added one shared helper, `routeRiskBadgeLabel(level, t)`, combining the existing `routeRiskLabel` translation ("Route risk"/"Áhætta á leið") with the existing level word, producing `Route risk: High` / `Route risk: Moderate` and the Icelandic equivalents. All four call sites (preview HIGH, preview MED, full HIGH, full MED) now use this one helper instead of the bare level word, per the non-blocking note that they should share one expression to avoid divergence. No change to the `Car` icon, HIGH/MED mapping, colours, disclosure reasons, or any route-risk calculation/decision logic; no translation values were changed (the existing keys composed cleanly, so no exception to report). 8 new tests added to `RoutePlannerCard.caution.test.jsx` (now 16, was 8): HIGH/MED × preview(`isPro:false`)/full(`isPro:true`) × EN/IS, each asserting `getByRole("button", { name: <literal> })` with the literal composed string (not a dictionary lookup), per E2.

### 4. F-E — `RoutePlannerCard.jsx`: no inert button when reasons are absent

`renderInlineCautionBadge` now branches on `reasons.length`: with reasons, it renders the existing interactive `<button aria-expanded aria-controls>` (unchanged behaviour); with zero reasons, it renders the **same visual badge** (identical classes, icon, label) as a plain `<span>` with no `tabIndex`, `onClick`, `role`, `aria-expanded`, or `aria-controls`. The D3 defensive case (a site severity flag with no matching per-day warning data) now lands on this non-interactive span. The existing D3 "flag true, no per-day warning" test in `RoutePlannerCard.caution.test.jsx` was rewritten to assert `queryByRole("button", { name })` is `null`, the literal label text is present, `badge.closest("button")` is `null`, and `tabindex`/`aria-expanded`/`aria-controls` are all absent — while the existing with-reasons keyboard/click expansion test (`F8/F10` describe block) was left untouched and still passes.

### E4 — 320px check of the longer route-risk pill

Checked "Route risk: Moderate" / "Áhætta á leið: Miðlungs" (the longer of the two translated words, as flagged) in a real browser at 320px, EN/IS, light/dark, against a fresh production build, using mocked forecast data engineered to put the base site's wind at a constant 15 m/s (within `windWarn`–`windHigh`, i.e. MED route risk) with calm candidates.

- **Full branch (`isPro:true`)**: the badge renders on its own line under the site name in the alternatives list (both the verdict block's plain-text line and the per-candidate badge). Measured: no page-level horizontal overflow (`document.documentElement.scrollWidth === clientWidth === 320` in all 4 combinations), badge box width 122–135px, `scrollWidth <= clientWidth` on the badge itself (no internal clipping). Screenshots confirm clean wrapping, no awkward mid-word break, in both languages and both themes. A minimal defensive fix was applied anyway: the inner `<span className="inline-flex items-center gap-1.5">` wrapping the site name + risk badge + site-caution badge in both the preview and full alternatives rows did not itself carry `flex-wrap` (only its outer `<li>` container did) — added `flex-wrap` to both inner spans so a combination of site name + two badges that doesn't fit on one line wraps onto a new line within the row instead of risking overflow, per E4's suggested minimal fix. This stays inside `RoutePlannerCard.jsx`.
- **Preview branch (`isPro:false`)**: no route-risk badge renders at all, in any combination — confirmed both by reading `useRoutePlanner.js` (protected, byte-identical to baseline) and by live reproduction (screenshot: the preview card's "Best nearby option tomorrow" section shows a site-caution reason bullet but no route-risk badge). The hook's own `loadRouteRisk()` effect contains `if (isPreview) return;` before ever calling `estimateRouteRisk`, so `routeRiskData` is always `null` while `isPreview` is true — meaning the preview-branch route-risk badge code in `RoutePlannerCard.jsx` is unreachable in the live app today, regardless of this correction. The preview-branch unit tests (D1's existing test and this round's new F-D preview tests) still exercise that code path via a mocked `useRoutePlanner`, which remains correct as defensive/presentation-layer coverage (the component must not assume anything about the hook's internal gating), but no live 320px overflow finding is possible for that specific badge, because it cannot currently render outside a test.

New evidence folder (per E5, not overwriting the first set): `outputs/ticket-436-browser-evidence-r3/` — 6 screenshots (`e4-{en,is}-{light,dark}-full-320.png`, `e4-{en,is}-light-preview-320.png`) + `e4-report.json` (per-combination overflow measurements and route-risk-badge bounding-box/overflow data). All 6 screenshots were visually inspected, not just asserted programmatically.

## Tests — fresh counts (E5)

| File | Before this round | After this round |
|---|---|---|
| `src/components/HazardSourceNote.test.jsx` | 0 (did not exist) | 5 (new file) |
| `src/components/RouteCompareTable.test.jsx` | 11 | 15 (+4) |
| `src/components/RoutePlannerCard.caution.test.jsx` | 8 | 16 (+8) |

Net new this round: 17 tests. Nothing was deleted.

Focused suites run first: `HazardSourceNote.test.jsx`, `RouteCompareTable.test.jsx`, `RoutePlannerDetailsModal.test.jsx`, `RoutePlannerCard.test.jsx`, `RoutePlannerCard.caution.test.jsx`, `ForecastTable.hazardCaution.test.jsx` together — 6 files, 111 tests, all passing.

**E5 full validation, after the last edit:**

```
npm run test:run   → 181 test files, 2661 tests — all passing (180→181, 2644→2661, exactly +17/+1 file, nothing deleted)
npm run lint       → clean, zero errors/warnings
npm run build      → succeeded (same pre-existing >500kB chunk-size advisory, unrelated)
```

The `App.affiliateHolder.test.jsx` cross-test-isolation flake reported in the v1 round did **not** recur in this round's `test:run` — a clean pass on the first attempt, so no isolated rerun was needed. `App.jsx` and all affiliate files remain untouched (confirmed by their absence from `git status`).

## Scope audit (v2)

`git status --short` shows the same file set as the v1 report plus exactly: `src/components/HazardSourceNote.test.jsx` (new) and `outputs/ticket-436-browser-evidence-r3/` (new). `src/components/HazardSourceNote.jsx`, `RouteCompareTable.jsx`, `RoutePlannerCard.jsx`, `RouteCompareTable.test.jsx`, and `RoutePlannerCard.caution.test.jsx` carry this round's edits on top of their v1 content. `git diff --stat` against `src/i18n/translations.routePlanner.js`, `src/config/hazards.js`, `src/lib/relocationEngine.js`, `src/lib/relocationService.js`, `src/lib/routeRisk.js`, `src/hooks/useRoutePlanner.js`, `package.json`, `package-lock.json` shows **zero additional changes from this round** (the one diff present, on `translations.routePlanner.js`, is entirely the v1 round's pre-existing F9 key updates — this round added no translation edits at all, consistent with using only the existing `routeRiskLabel`/`routeRiskHigh`/`routeRiskMed` keys for F-D). No new dependency. Allowed production files per `approved-prompt-v2.md` — `HazardSourceNote.jsx`, `RouteCompareTable.jsx`, `RoutePlannerCard.jsx` — are the only production files touched.

## Deviations / exceptions to report

None. No translation value needed to change for F-D (existing keys composed cleanly); the E4 minimal class fix (`flex-wrap` on two inner spans) stayed inside `RoutePlannerCard.jsx` as required.

## Limitations (v2)

- Accessible-name inspection (`role="img"`/`aria-label`, `getByRole` queries) is DOM/axtree-level verification, not screen-reader testing — consistent with E5's explicit instruction to say so.
- The E4 live-browser check used mocked forecast data engineered to reach MED route risk deterministically; it is a presentation/layout check, not a scoring verification.
- The preview-branch route-risk badge's unreachability in live use (see above) is a pre-existing characteristic of `useRoutePlanner.js`, not something this correction introduced or could fix (that file is protected/out of scope).

## Lifecycle (v2)

No commit, push, deployment, production mutation, or GitHub issue closure was performed. `CURRENT.md` set to `CC_COMPLETE`. Per the workflow: owner sends "CC búinn" to Jonesy next for the narrow re-check; then Ripley's final assessment.

# #411 — Approved execution prompt v1

Approved by Jonesy, prompt-review.md Round 2, 2026-09-15. Consolidated by Ripley from Round 1 plus the owner-authorized Round 2 correction. This file is the sole execution prompt; do not execute the superseded two-variant draft in prompt-review.md.

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/411

## Objective and authorization

Adapt the existing homepage hero to year-round use without changing the decision flow. The owner explicitly approved September-March weather/aurora copy, April weather-only copy, and unchanged May-August camping copy. This overrides the issue's original September-April aurora wording and authorizes three presentation variants, not changes to the Aurora feature.

## Required workflow

Read repository instructions and docs/ai/README.md. Verify CURRENT.md references this prompt at READY_FOR_CC, then set it to CC_IN_PROGRESS before implementation. Audit current source read-only before edits. After implementation and validation, write docs/ai/tasks/ticket-411/cc-report.md, populate that path in CURRENT.md and set stage CC_COMPLETE. Preserve all review history. No commit, push, deployment, publication, or GitHub issue closure.

## Current implementation to verify

- Reachable entrypoint: App.jsx -> PageHeader.jsx -> Toolbar.jsx. Toolbar owns title, subtitle and primary CTA. Its handler scrolls to `comparison-section` with `{ behavior: "smooth", block: "start" }`, then calls `trackEvent("homepage_hero_cta_click")` without metadata.
- Summer IS/EN copy already exists under `heroStayMoveTitle`, `heroStayMoveSubtitle`, `heroCta` in src/i18n/translations.common.js. Preserve all six strings exactly.
- Toolbar's winter hints/badge use scoring.js's `getSeasonForDate`: October-April, browser-local month. This also serves scoring and must remain unchanged.
- auroraSeason.js gates Aurora September-March using UTC months. NorthernLightsCard uses that rule. Preserve it unchanged; the approved aurora hero window now matches it exactly.
- src/lib/analytics.js is the GA4 entrypoint. The requested new event is absent. Read src/hooks/useT.js, src/i18n/translations.js, PageHeader, Toolbar and relevant existing tests before implementing.

## Implementation

### 1. Centralized presentation configuration

Add a small helper/config, e.g. src/config/homepageHero.js, following repository conventions. Centralize date selection and the mapping from stable variant IDs to translation keys; keep month conditions out of UI code. Accept an injectable date for deterministic tests.

| Variant ID | Inclusive Atlantic/Reykjavik calendar dates |
|---|---|
| `winter_weather_aurora` | September 1-March 31 |
| `winter_weather` | April 1-April 30 |
| `summer_camping` | May 1-August 31 |

Use explicit Atlantic/Reykjavik calendar extraction or UTC calendar extraction with a clear explanation consistent with existing Iceland date code. Do not use host-local getMonth(). Define and test a deterministic safe fallback if the helper accepts invalid dates. Select the variant during render; copy and subsequent click metadata must agree after a date-boundary rerender. No idle-page midnight timer or background scheduler is required.

Keep the hero calendar independent of the scoring helper and Aurora's own rule. Jonesy suggested considering shared Aurora month constants to avoid drift; Ripley's disposition is to retain independent presentation configuration and boundary tests. Do not change auroraSeason.js merely to export its currently private constants. Document this choice in the report.

### 2. Copy and integration

Wire the existing Toolbar title, subtitle and CTA to selected translation keys. Summer reuses all existing copy unchanged. Add actual dictionary keys in both languages for the two winter titles/subtitles and one shared winter CTA key per language. No hardcoded component copy or new user-facing debug controls.

September-March IS:
- Title: `Finndu besta veðrið — og bestu líkurnar á norðurljósum`
- Subtitle: `Berðu saman veðrið um landið, finndu skárri áfangastað og sjáðu hvar aðstæður til norðurljósaskoðunar eru bestar.`
- CTA: `Skoða veðrið`

September-March EN:
- Title: `Find the best weather — and the best chances of seeing the Northern Lights`
- Subtitle: `Compare weather across Iceland, find a better destination, and see where conditions are best for watching the Northern Lights.`
- CTA: `Explore the weather`

April IS:
- Title: `Finndu besta veðrið`
- Subtitle: `Berðu saman veðrið um landið og finndu skárri áfangastað.`
- CTA: `Skoða veðrið`

April EN:
- Title: `Find the best weather`
- Subtitle: `Compare weather across Iceland and find a better destination.`
- CTA: `Explore the weather`

Preserve the button's scroll target/options, keyboard behavior and decorative arrow. Resolve the translated label once for rendering and analytics. Keep existing layout; small hero layout fixes are allowed only as needed for longer copy. Preserve existing winter hints/badge independently, including September versus October behavior. Add no new primary CTA, navigation destination or surrounding-control redesign.

### 3. Analytics

For each actual primary CTA click, emit exactly one unchanged `homepage_hero_cta_click` call and exactly one `homepage_primary_cta_clicked` call through trackEvent, with only:
- `hero_variant`: rendered variant ID from the table;
- `cta_label`: current translated button copy without the decorative arrow;
- `language`: current UI language, `is` or `en`.

April must emit `winter_weather`, despite sharing its label with the other winter variant. Do not infer variant from label. No emission on mount, rerender, theme/language changes, unrelated controls or scroll exposure. Each repeated intentional click counts once per event.

The four possible cta_label values (two shared winter labels and two existing summer labels) are bounded application copy, not user input or PII, and are accepted as metadata. Do not replace them with translation keys. Document the new event and three variants alongside the homepage analytics list in CLAUDE.md or equivalent concise analytics documentation. Legacy and new events represent the same click and must not be summed as distinct interactions.

## Scope and STOP conditions

Allowed: centralized hero helper/config, Toolbar integration, translations, focused tests, small necessary hero layout corrections, concise analytics documentation and validation evidence.

No changes to scoring, recommendation/candidate/canonical-tone logic, shared forecast inputs, Free/Pro gating, entitlement, payments, Aurora season/availability/requests, backend, dependencies, routes, other marketing pages or the canonical HomeDecisionCard flow. Follow existing JSX/JS conventions, no TypeScript or explicit import extensions.

Audit protected data flows read-only before any proposed change touching them. STOP if implementation requires a new feature/destination or changes beyond this scope. Do not extend Aurora to fulfill marketing copy. April's third presentation variant is explicitly authorized; no owner question remains on that split. Preserve unrelated changes and previous task history.

## Acceptance and validation

1. Test all 12 months, year rollover, exact March 31 23:59:59 / April 1 00:00, April 30/May 1 and August 31/September 1 boundaries. Include offset-bearing timestamps straddling UTC midnight to expose local-date mistakes, and invalid-date handling if supported.
2. Render all three variants x both languages using the actual assembled src/i18n/translations.js dictionary. Do not use identity translators or hand-built dictionaries for copy acceptance tests. Assert exact title/subtitle/CTA, unchanged summer copy, no raw missing keys, and saved new keys in both language blocks. Irrelevant child components may be mocked normally.
3. Assert exact new-event metadata, one call to each event per click, and unchanged scroll target/options. Cover no calls on mount/rerender/theme/language change or unrelated controls, repeated clicks, and a click after switching language in each variant. Explicitly cover April's distinct metadata despite its shared CTA.
4. On rerender across each seasonal boundary, rendered copy and subsequent event metadata must agree. Preserve September/October winter hint behavior. Run scoring and auroraSeason regressions, including the unchanged April Aurora boundary.
5. Real-browser verification: three seasons x two languages x light/dark x mobile (~375px)/desktop (~1280px), using controlled date fixtures. Check wrapping, no horizontal overflow/clipping, readable subtitle, reachable CTA and unchanged scrolling. April hero contains no aurora promise; the feature's out-of-season behavior is unchanged. Retain concise screenshots/results labeled by date, viewport, language and theme. Read hook response contracts before API stubbing. No production debug UI.
6. Run focused new suites, existing scoring/auroraSeason regressions, npm run test:run, npm run lint, npm run build, and git diff --check. Report commands/results and any pre-existing failures separately. Test/browser event emission does not establish production GA4 receipt; do not claim live receipt without verification.
7. Report changed files, implementation choices, tests, browser evidence, limitations and confirmation that protected flows remain untouched. Document the owner-authorized deviation from the original issue, not an unresolved April mismatch. Explicitly distinguish the two independent winter concepts: Reykjavik-calendar presentation variants versus existing October-April browser-local scoring-derived hints. Record the independent-configuration disposition of Jonesy's optional constants suggestion. Complete the report and CURRENT.md transitions specified above.

# Ticket #411 — Seasonal homepage hero

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/411
Title: UX: Aðlaga forsíðutitil að haust- og vetrarnotkun

## Ripley — Initial prompt, Round 1 (2026-09-15)

Ready for Jonesy. Discussion/review material only, not execution authorization. No application changes made.

### Current implementation and staleness audit

- The reachable hero is `App.jsx` -> `PageHeader.jsx` -> `Toolbar.jsx`. Toolbar renders the title, subtitle and primary CTA. The handler scrolls to `comparison-section` with smooth/start options and calls `trackEvent("homepage_hero_cta_click")`.
- Summer copy already exists in both languages under `heroStayMoveTitle`, `heroStayMoveSubtitle`, `heroCta` in `src/i18n/translations.common.js`. Preserve it exactly.
- Toolbar's existing winter hints/badge use `getSeasonForDate` from `src/lib/scoring.js`: October-April, browser-local calendar. This helper also serves scoring. Do not alter or reuse it for the September-April hero rule.
- `src/lib/auroraSeason.js` enables Aurora September-March; April is explicitly outside that season. The issue expressly requests aurora hero copy through April. This is a known product mismatch for Jonesy to assess, not authorization to extend Aurora availability or requests.
- `src/lib/analytics.js` is the existing GA4 helper. The requested new event is absent. Keep the legacy event for funnel continuity and add the requested event separately. They measure the same action and must not be summed as distinct clicks.

### Proposed implementation prompt

Before editing, reread repository instructions and the approved prompt, verify this audit against current code, and read `src/hooks/useT.js`, translation assembly, PageHeader and relevant tests. Follow README.md's required CURRENT.md execution transitions. Execute only the approved prompt, never this review file.

1. Add a small centralized presentation-only helper/config, e.g. `src/config/homepageHero.js`, with an injectable date and variant-to-translation-key mapping. Keep month conditions out of UI code.
   - `summer_camping`: May 1 through August 31 inclusive.
   - `winter_weather_aurora`: September 1 through April 30 inclusive.
   - Boundaries are midnight in Atlantic/Reykjavik. Use explicit timezone calendar extraction or UTC calendar extraction with a clear explanation consistent with existing Iceland date code. Never browser-local `getMonth()`.
   - Define/test a deterministic invalid-date fallback if accepting invalid dates. Select the variant during render. No midnight polling or background scheduler is required for an idle page.
2. Wire Toolbar title, subtitle and primary CTA to the selected translation keys. Reuse all existing summer strings unchanged. Add winter keys to both real translation dictionaries; no hardcoded component copy.

Winter IS, exactly:
- Title: `Finndu besta veðrið — og bestu líkurnar á norðurljósum`
- Subtitle: `Berðu saman veðrið um landið, finndu skárri áfangastað og sjáðu hvar aðstæður til norðurljósaskoðunar eru bestar.`
- CTA: `Skoða veðrið`

Proposed winter EN:
- Title: `Find the best weather — and the best chances of seeing the Northern Lights`
- Subtitle: `Compare weather across Iceland, find a better destination, and see where conditions are best for watching the Northern Lights.`
- CTA: `Explore the weather`

3. Preserve the primary button's scroll target/action, keyboard behavior and decorative arrow. Resolve the translated label once for visible copy and analytics.
4. Each actual primary CTA click must fire exactly one unchanged `homepage_hero_cta_click` and exactly one `homepage_primary_cta_clicked` with only `hero_variant` (rendered variant ID), `cta_label` (current translated label without decorative arrow), and `language` (`is`/`en`). Use `trackEvent`. No events on mount, rerender, language/theme changes, other controls or exposure. Repeated intentional clicks each count once per event.
5. Preserve existing winter hints/badge and their scoring-season rule. Keep existing layout; only make small hero layout corrections if the longer copy requires them. No new primary CTA or navigation destination.

### Scope and STOP rules

- Allowed: hero config/helper, Toolbar integration, winter translations, focused tests, necessary small hero layout fixes and concise analytics documentation.
- No changes to scoring, recommendations/candidates/canonical tone, forecast inputs, entitlement/free/pro, payments, Aurora season/availability, backend, dependencies, routes or other marketing pages. Preserve the canonical HomeDecisionCard flow.
- Before any change touching a protected data flow, audit it read-only. STOP if implementation requires changes beyond the stated scope. Do not build a new feature or destination to fulfill marketing copy.
- **Jonesy review question:** assess April's aurora promise against the September-March feature gate. This draft follows the explicit issue's copy/dates and preserves feature behavior. If a product decision is required, return REVISE with the concrete question. Do not silently extend the feature or introduce a third April hero variant.
- No commit, push, deployment, publication or GitHub issue closure. Preserve unrelated work and previous task history.

### Acceptance and validation

1. Unit-test all 12 months, exact April 30/May 1 and August 31/September 1 boundaries, year rollover, and offset-bearing timestamps straddling UTC midnight to catch host-local date mistakes.
2. Render both variants x both languages using the real assembled translations. Assert exact title/subtitle/CTA, unchanged summer copy, no missing-key strings, and label updates on language switch.
3. Assert exact metadata and one call per event per actual click, plus unchanged scroll target/options. Assert no calls on mount/rerender/theme/language changes or unrelated controls. Cover repeated clicks and a click after language change.
4. Verify September versus October existing winter hints remain unchanged. Run existing scoring and auroraSeason regressions, including April's unchanged Aurora boundary; do not modify those rules.
5. Real-browser verification: both seasons x both languages x light/dark at mobile (~375px) and desktop (~1280px), with controlled date fixtures. Check wrapping, no horizontal overflow/clipping, readable subtitle, reachable CTA and unchanged scroll behavior. Retain concise screenshots/results labeled with date, viewport, language and theme. Read hooks before stubbing their API contracts; add no production debug UI.
6. Run focused suites, scoring/auroraSeason regressions, `npm run test:run`, `npm run lint`, `npm run build`, and `git diff --check`. Report exact results and pre-existing failures separately. Event emission tests do not establish production GA4 receipt.
7. CC report: changed files, decisions, commands/results, browser evidence, limitations including the April discrepancy, and confirmation of untouched protected flows. Write the report and set CURRENT.md to CC_COMPLETE as README.md requires.

### Jonesy handoff

Review audit, timezone selection, dual-event semantics, translations, unchanged CTA behavior and April product caveat. Append APPROVED or REVISE. Do not implement.


## Jonesy — Initial prompt, Round 1 (2026-09-15)

**Verdict: REVISE** — narrowly, on the one point this draft itself flagged for me. Every code-audit claim in Ripley's draft checks out against live source with zero discrepancies; the implementation plan, scope/STOP rules, and acceptance criteria are otherwise sound and don't need rework. This isn't a rebuild request — it's returning the one structured question the draft asked me to answer, per its own "Jonesy review question" instruction.

### Audit verified line by line against live code

- Hero chain: `App.jsx` → `PageHeader.jsx` → `Toolbar.jsx` confirmed by direct read. `PageHeader.jsx` renders `<Header>` then `<Toolbar>` with no hero logic of its own; `Toolbar.jsx` renders `t("heroStayMoveTitle")`, `t("heroStayMoveSubtitle")`, and a button with `t("heroCta")` plus a literal `→` appended *outside* the translated string (line 61) — confirming the draft's point 3 instruction to "resolve the translated label once" is grounded in a real shape, not a guess, and that stripping the arrow from the analytics payload is a simple string, not a parsing problem.
- `scrollToComparison()` (Toolbar.jsx line 38-41): exactly `document.getElementById("comparison-section")?.scrollIntoView({behavior:"smooth", block:"start"})` then `trackEvent("homepage_hero_cta_click")` — matches the audit precisely.
- `heroStayMoveTitle`/`heroStayMoveSubtitle`/`heroCta` exist with real copy in both `translations.common.js` language blocks (EN lines 5-7, IS lines 574-576) — confirmed exact strings, nothing to reconstruct.
- `getSeasonForDate` (`scoring.js` lines 5-15): `dt.getMonth()` — genuinely browser-local, not UTC — winter = `m >= 10 || m <= 4`, i.e. October-April inclusive. Called at `scoring.js:313` inside the actual scoring computation, confirming it's load-bearing for scoring, not just the Toolbar hint — the instruction not to touch or reuse it is correct.
- `auroraSeason.js`'s `isAuroraSeason` (lines 14-20): `SEASON_START_MONTH=9`, `SEASON_END_MONTH=3`, `month >= 9 || month <= 3` — September through March inclusive, April explicitly and deliberately excluded, with a documented rationale (Iceland has no DST and is UTC+0 year-round, so `getUTCMonth()` reads as Icelandic local time — directly relevant precedent for the new hero helper's own timezone approach, which the draft correctly asks to stay consistent with).
- `homepage_primary_cta_clicked` does not exist anywhere in the current codebase (repo-wide grep: zero source hits, only this review document). `homepage_hero_cta_click` has exactly one call site (Toolbar.jsx) and is a documented key funnel event in `CLAUDE.md` ("Primary homepage funnel: homepage_loaded → homepage_hero_cta_click → comparison_viewed → ..."). Preserving it unchanged is genuinely load-bearing for existing funnel reporting, not a formality — worth CC also updating that `CLAUDE.md` event list when adding the new event, under the draft's existing "concise analytics documentation" scope item.
- `src/config/` already holds exactly this shape of file (`auroraCandidates.js`, `auroraNewBadge.js`, `hazards.js`, `features.js`, ...) — `homepageHero.js` fits the established convention.

### The one point requiring an owner decision before this can proceed

I checked whether April's aurora promise is really contradicted elsewhere on the page, not just theoretically: `NorthernLightsCard.jsx` (line 103) gates on the same `isAuroraSeason()` via `seasonActive`. So in April specifically, the homepage hero would say *"...og bestu líkurnar á norðurljósum"* / *"...and the best chances of seeing the Northern Lights"* — while the app's own, literally-named Northern Lights card, a few scrolls down the same page, presents as out-of-season. That's not a hypothetical gap; it's a direct, visible, same-page contradiction between what the hero promises and what the app's own feature area shows, for the entire month the issue explicitly asks to extend into.

Concrete question for the owner (Ripley, please relay and return with the answer):

**A. Extend the Aurora feature's own season to include April** (`auroraSeason.js`, `SEASON_END_MONTH` 3→4). If early-to-mid-April genuinely still has meaningful viewing darkness in Iceland, this may be the more honest fix — but it's a real feature/scoring change, not a homepage string, and needs its own ticket and review (it touches `NorthernLightsCard`, aurora candidate requests, and whatever downstream aurora scoring assumes a March cutoff) — out of scope for #411 as currently drafted.

**B. Keep the Aurora feature gated Sept-March as-is, and trim the hero copy to match it** — the aurora-flavored line only shows September through March; April falls back to a winter-weather-only line with no aurora mention (a genuine third variant, or "winter_weather_aurora" narrowed to Sep-Mar with April folded into a plain "winter_weather" copy, whichever Ripley prefers to draft). Lower risk, no feature-gate change, and removes the same-page contradiction entirely.

**C. Ship the drafted copy as-is (aurora phrase through April)**, treating "best chances of seeing the Northern Lights" as general seasonal/travel framing rather than a literal promise tied to the in-app card. I'd flag this as the riskiest of the three specifically because the app has a literal, named Aurora feature on the same page that will visibly contradict it that month — not a purely abstract concern.

I'd lean toward B as the lowest-risk path that still satisfies the issue's spirit (fall/winter hero copy) without either touching a gated feature outside this ticket's scope or shipping a same-page contradiction, but this is the owner's product call, not mine to make.

One process note for whoever drafts the correction prompt: the current STOP rule ("Do not silently extend the feature or introduce a third April hero variant") is correctly written to constrain CC *absent* an owner decision. If the owner picks B, the next prompt revision needs to actually authorize and specify that third variant (or narrowed date range) explicitly — that STOP language shouldn't be read as still applying once the owner has actually decided.

### Two small notes for the eventual correction/approved prompt (not blocking, carry forward)

1. **Acceptance criterion 2 is exactly right and should not be diluted during implementation** — "render both variants × both languages using the real assembled translations... assert no missing-key strings." Say this explicitly to CC: the test must import the real `translations.js`/`translations.common.js` dictionary (the same way `weatherVoiceContent.test.js`'s fixtures do), never a stub/identity `t()`. Grounding: ticket-410's Revision 2 shipped two i18n keys referenced in code but never actually added to `translations.common.js` — CC's own tests used a hand-rolled `realT` dictionary that happened to include the right strings, so the suite passed green while the shipped file was missing them. It was only caught in result review by grepping the real file directly. Cheap to prevent here by being explicit about it now rather than catching it again after the fact.
2. Confirm in the correction/approved prompt that `cta_label`'s four possible values (2 variants × 2 languages, all business-approved short copy) are fine as an analytics payload field as-is — no PII/free-text concern, consistent with #409/#410's minimal-payload precedent. Not a change, just worth stating explicitly so CC doesn't second-guess it.

Everything else — the injectable-date helper design, the dual-event handling, the September/October winter-hint edge case (already correctly identified and covered by acceptance criterion 4), the scope/STOP rules, and the real-browser multi-viewport verification plan — is sound as drafted and doesn't need changes.

## Ripley — Revised prompt, Round 2 (2026-09-15)

**Status: ready for Jonesy review; not approved for execution.** Round 1 remains the base prompt except where explicitly superseded below. This revision resolves Jonesy's sole blocking question and carries forward both non-blocking notes.

### Owner decision

Ripley proposed September-March weather/aurora copy, April weather-only copy, and unchanged May-August camping copy, retaining `Skoða veðrið` September-April. The owner explicitly accepted: "Þá samþykki ég þessa skiptingu."

This authorizes option B and overrides the issue's original September-April aurora-copy requirement. It authorizes a third presentation variant only. It does not change the Aurora feature's season, scoring, data requests or availability.

### Revised date and copy contract (supersedes Round 1's two-variant schedule)

Use one centralized hero configuration/helper with these exact stable analytics variant IDs and Atlantic/Reykjavik calendar boundaries:

| Variant | Inclusive dates | Copy |
|---|---|---|
| `winter_weather_aurora` | September 1-March 31 | Round 1 winter IS/EN title and subtitle, unchanged; CTA `Skoða veðrið` / `Explore the weather` |
| `winter_weather` | April 1-April 30 | April copy below; same CTA as September-March |
| `summer_camping` | May 1-August 31 | Existing summer IS/EN title, subtitle and CTA, unchanged |

April IS (owner-accepted proposal):
- Title: `Finndu besta veðrið`
- Subtitle: `Berðu saman veðrið um landið og finndu skárri áfangastað.`
- CTA: `Skoða veðrið`

April EN (corresponding translation proposed for review):
- Title: `Find the best weather`
- Subtitle: `Compare weather across Iceland and find a better destination.`
- CTA: `Explore the weather`

Store April title/subtitle in both real language dictionaries. Share the winter CTA translation key between the two winter variants. Keep all date conditions in the centralized presentation helper; do not derive the new hero schedule from the scoring-season helper or modify Aurora's own rule. Retain the existing winter hints/badge behavior independently.

### Revised analytics and translation requirements

- The new event's `hero_variant` now accepts all three IDs above. In April it must be `winter_weather`, never `winter_weather_aurora`, even though both have the same CTA label.
- Preserve one legacy event plus one new event per genuine primary CTA click, with unchanged scroll behavior and the same three metadata fields. The metadata must match the rendered variant and current language.
- `cta_label` remains a bounded set of four fixed translated strings: two shared winter CTA labels and two existing summer labels. These are application copy, not user input or PII; sending them as specified is accepted. Do not substitute translation keys or include the arrow.
- All copy assertions must import the actual assembled `src/i18n/translations.js` dictionary used by the app. Do not use an identity translator or hand-built dictionary for hero copy acceptance tests. Explicitly verify the saved new keys exist in both language blocks. Other irrelevant child components may be mocked normally.
- Include the new event and its three variants in concise analytics documentation, preferably alongside the existing homepage event list in CLAUDE.md. State that legacy and new events represent the same click, not two distinct interactions.

### Revised acceptance and STOP rules

- Expand Round 1's component and browser matrix from two variants to **three variants x two languages**; browser checks still cover light/dark and mobile/desktop. April must show the exact weather-only heading/subtitle and no aurora mention in hero copy. The existing Northern Lights out-of-season state is unchanged.
- Add exact March 31 23:59:59 / April 1 00:00 boundary tests alongside April 30/May 1, August 31/September 1, all 12 months, timezone-offset cases and year rollover. On a rerender across each boundary, displayed copy and subsequent click metadata must agree. No new idle-page timer is required.
- Test April's distinct variant metadata despite its shared winter CTA, and language changes for each variant with the real dictionary. Retain no-event-on-render/theme/language-change and repeated-intentional-click checks.
- **Replace** Round 1's unresolved April review question and prohibition on a third April hero variant with: the owner-authorized April `winter_weather` variant is in scope; all changes to Aurora season/availability, scoring or protected data flows remain out of scope and require STOP before implementation. No further owner decision is pending on this copy split.
- The report should document this owner-authorized deviation from the original issue rather than list April's copy mismatch as unresolved. All other Round 1 scope restrictions, validation commands, evidence requirements and workflow transitions remain in force.

### Jonesy Round 2 handoff

Review this narrow correction together with the unchanged Round 1 requirements. Confirm the owner's option B is fully reflected in copy, date boundaries, event variants, translation tests and STOP rules. Append APPROVED or REVISE; do not implement.


## Jonesy — Prompt review, Round 2 (2026-09-15)

**Verdict: APPROVED.**

### Owner decision correctly captured and fully resolves my Round 1 question

Option B — three variants, no touch to `auroraSeason.js` — is what the owner approved ("Þá samþykki ég þessa skiptingu"), and it's implemented exactly as I'd have hoped. One thing worth stating explicitly since it wasn't spelled out in the draft: `winter_weather_aurora`'s window (September 1 – March 31) is calendar-month-identical to `auroraSeason.js`'s own `isAuroraSeason` boundary (`month >= 9 || month <= 3`, confirmed by direct read in Round 1). So this isn't just "a reasonable compromise" — it's an exact match: the hero will now say "...bestu líkurnar á norðurljósum" only during the months the app's own Northern Lights card is actually live, and April gets weather-only copy with no aurora mention at all. The same-page contradiction I flagged against `NorthernLightsCard.jsx` is fully closed, not just narrowed.

### Both Round 1 notes fully incorporated, not just acknowledged

- The real-dictionary testing requirement is now explicit and specific: "import the actual assembled `src/i18n/translations.js` dictionary... Do not use an identity translator or hand-built dictionary... Explicitly verify the saved new keys exist in both language blocks." That's the ticket-410 i18n-key lesson written directly into the acceptance criteria, not just referenced.
- The `cta_label` note is addressed near-verbatim: "these are application copy, not user input or PII; sending them as specified is accepted."

### Internal consistency checked

- Date coverage is exhaustive and non-overlapping across all 12 months: Sep-Mar (7) + Apr (1) + May-Aug (4) = 12, no gaps.
- The "four fixed `cta_label` strings across three variants" math holds together on inspection: `winter_weather_aurora` and `winter_weather` deliberately share one CTA translation key per language (both say `Skoða veðrið` / `Explore the weather`), so 3 variants × 2 languages = 6 render combinations still only ever produce 4 distinct label strings. The explicit instruction that `hero_variant` must still read `winter_weather` in April "even though both have the same CTA label" is exactly the right guard against a lazy implementation that infers the variant from the label text instead of the date.
- April's proposed copy (IS and EN) makes no aurora claim and only promises what the comparison flow the CTA scrolls to can actually deliver — consistent with the rest of the app's honest-copy pattern.
- The revised STOP rules correctly narrow to "the third variant is authorized; Aurora/scoring/protected flows remain out of scope" rather than leaving the old blanket prohibition in place — exactly what I flagged as needing updating once the owner decided.

### Two light, non-blocking suggestions to carry into CC's report (not worth a REVISE)

1. Since `winter_weather_aurora`'s boundary is now numerically identical to `auroraSeason.js`'s own `SEASON_START_MONTH`/`SEASON_END_MONTH`, CC could import those constants into the new hero helper instead of re-hardcoding `9`/`3` a second time — purely to prevent silent drift if a future ticket ever changes Aurora's own season (e.g. if option A gets revisited later). This is a judgment call between DRY-ness and the deliberate architectural separation the prompt already asks for ("do not derive... or modify Aurora's own rule"), so I'm flagging it as worth CC's or Ripley's discretion, not requiring it.
2. Worth a one-line callout in CC's report distinguishing the two genuinely independent "winter" concepts now living in the same component: the new `winter_weather`/`winter_weather_aurora` hero variant IDs (Atlantic/Reykjavik-calendar, presentation-only) versus the pre-existing `getSeasonForDate` "winter" hint/badge (October-April, browser-local, scoring-derived). They're already correctly kept separate in the implementation plan and covered by the September-vs-October acceptance check — this is purely a documentation nicety so a future reader doesn't conflate them.

Everything else in the correction — the boundary test additions (including the new March 31/April 1 edge), the three-variant × two-language real-browser matrix, and the "displayed copy and click metadata must agree across a boundary rerender" requirement — is sound. Ready for the owner's Prompt approved handoff to CC.

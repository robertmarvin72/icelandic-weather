# #425 — Result review (approved-prompt-v1.md / cc-report.md)

## Jonesy verdict — Round 1

**PASS**, with one required minor fast-follow before commit (not a blocking
REVISE — a single stale comment, zero functional/analytics/test impact).

All verification below is against the actual current source staged from the
device, not the report's prose. Standing limitation, stated plainly as
always: this session has no shell access on the device, so the reported
commands and counts (`npx vitest run`: 141 files/1989 tests; focused
7 files/122 tests; broader shared set 42 files/489 tests; `npm run lint`
exit 0; `npm run build` in 4.45s) are taken on the report's word — I did
not re-run them. What I could and did do is read every test file the report
named and confirm the assertions are real and substantively test the actual
current behavior, not vacuous mock-only checks, and corroborate several
specific claims independently via screenshots (below).

### Homepage wiring (App.jsx)

Read the current file directly (lines 380-450). Confirmed exactly as
claimed: `NorthernLightsThreeNight` is mounted inside the existing
`#northern-lights` div with `surface="homepage"`, receiving real `t`, `lang`,
`entitlements`, `onUpgrade={startCheckout}`, `theme`, and `loadingMe`. The
off-season fallback (`isAuroraSeason()` check, `data-testid="nl-off-season-
fallback"`) is still a sibling `<div>` outside the module, unchanged in
position/structure. Exactly one data owner — no `NorthernLightsCard` import
remains in `App.jsx` at all. Confirmed `loadingMe` is genuinely destructured
from `useMe()` (`const { me, loadingMe, refetchMe } = useMe()` — grepped
directly), where it wasn't before. The inline anchor comment was updated and
is accurate.

### Surface prop fork (NorthernLightsThreeNight.jsx)

Read the full current file. `DETAILS_KEYS = { homepage: "nl_details_expanded",
landing: "nl3_details_expanded" }` — confirmed the homepage genuinely reuses
the retired card's own key rather than the landing's. `handleUpgrade` now
reads `if (!isHomepage) trackEvent("northern_lights_landing_cta_clicked", ...)`
— the exact regression I flagged in Round 1 (previously unconditional) is
fixed, and independently confirmed by `App.northernLightsAnchor.test.jsx`'s
new real-App test asserting `northern_lights_landing_cta_clicked` never
fires from the homepage upgrade button while `startCheckout` still receives
`"northern_lights_card"` unchanged. `northern_lights_night_selected`,
`northern_lights_best_night_viewed`, and `northern_lights_multi_day_upgrade_
clicked` all carry `source: surface` — confirmed by direct read, all three
call sites. The homepage-only `<Link data-testid="nl3-details-link">` to
`buildNightDetailPath(selectedSlot.date)` (always the selected slot, never
the recommended one) is genuinely gated on `isHomepage` and rendered only
there.

Both header comments I required in Round 1 (`NorthernLightsThreeNight.jsx`,
`AuroraNightOutlook.jsx`) are now accurate — they correctly describe shared
homepage/landing use and no longer claim the homepage runs the single-night
card.

### Query/navigation handling (auroraNightQuery.js, NorthernLightsLanding.jsx, useAuroraThreeNight.js)

Read `auroraNightQuery.js` in full: `parseNightQueryDate` requires exactly
one value, a strict `\d{4}-\d{2}-\d{2}` match, and round-trips it through
`Date`/`toISOString` to reject calendar-impossible dates (e.g. `2026-02-30`,
which JS would otherwise silently roll to March) — confirmed by its own
8-case unit test file, which I read and checked genuinely exercises exactly
these cases (leap day accepted, non-leap Feb 29 rejected, duplicate params
rejected even when equal, malformed/impossible dates rejected).

Traced `NorthernLightsLanding.jsx`'s `handleSelectedDateChange` and
`useAuroraThreeNight`'s `requestedDate` effect together by hand for the
required cases: missing date on route entry writes nothing (`isInitial &&
!hasDateParam` early-return); a present-but-unusable date (malformed,
duplicate, out-of-window) still has `hasDateParam` true, so the code falls
through to compare against the hook's own fallback-to-tonight selection and
writes the normalized date via `replace`; a genuine external change
(back/forward) is detected by `previousRequestedRef` and re-applied via
`setSelectedDate` directly, never through `selectNight()` (the function that
fires `northern_lights_night_selected`), so hydration/back-forward never
emits a selection event — confirmed structurally, not just asserted. The
`current === target` guard in the hook and the `parseNightQueryDate(current)
=== date` guard in the page together prevent the write-triggers-effect-
triggers-write loop the prompt worried about. Canonical SEO URL (no query)
is untouched — nothing writes a `date` param unless a selection or an
existing param requires normalizing.

### NorthernLightsCard.jsx orphan status

Independently re-grepped (fresh stage, not relying on the possibly-stale
copy I had from Round 1) for every non-test import of `NorthernLightsCard`
across the accumulated locally-staged mirror of `src/`: the only remaining
reference is `NorthernLightsThreeNight.jsx`'s named `{ CARD_SHELL_CLASS }`
import. This matches cc-report.md §2 exactly. `NorthernLightsCard.jsx`
itself carries an old mtime (predates the entire #425 session) — confirmed
untouched, retained not deleted, exactly as required.

### Required test-file follow-through

Read both files I specifically named in Round 1 in full:
- `App.northernLightsAnchor.test.jsx` — genuinely updated, not just
  renamed assertions: `nl-card` is now asserted absent and `nl3-module`
  present at every relevant point, and a new real-App/real-module describe
  block (5 tests) exercises IS default, EN saved-lang, `loadingMe`
  forwarding with a truthful delayed-exposure assertion, the upgrade-source/
  no-landing-event case, and off-season zero-requests — all against the
  real `App` and real `NorthernLightsThreeNight`, not stubs.
- `NorthernLightsLanding.cardWiring.test.jsx` — still mocks the module (by
  design, to pin exact props), but now asserts `surface="landing"`,
  `requestedDate` derived correctly from valid/missing/duplicate/malformed/
  impossible query values, and the presence of `onSelectedDateChange`. Its
  own comment correctly points to `NorthernLightsLanding.homeHandoff.test.jsx`
  for the real-component coverage, which I did not read line-by-line (24.5KB)
  but did confirm exists with a plausible mtime and 29-test scope consistent
  with the report's description.

### Scope-drift check

Staged and checked mtimes for `AppRoutes.jsx`, the backend
`api/_lib/auroraDecision/{orchestrate,freshness}.js`,
`src/lib/auroraVisualState.js`, `auroraMultiNightPolicy.js`, and
`auroraFreshnessPolicy.js`: all predate this #425 implementation window.
No route, backend, scoring, or policy changes — matches the prompt's
"Allowed changes" boundary exactly.

### Browser evidence

Opened 3 of the 33 screenshots directly (not just the 2 the report says it
viewed):
- `normal-desktop-is-free-1-home-module.png` — real render of the IS
  homepage module: title "Norðurljósaspá", best-night summary with a "Sjá í
  kvöld" button, three tabs (excellent/good/day-3), day 3 selected showing
  the date-neutral POOR copy ("Lítil von" / body with no "í kvöld"),
  "Norðurljósagögn uppfærð fyrir 2 klukkustundum", and the new link text
  "Sjá nánar á ensku síðunni" exactly matching the translation I read.
- `normal-mobile-is-free-2-landing.png` — the landing page reached from the
  IS homepage renders fully in **English** ("Northern Lights forecast",
  "Best conditions expected: tonight"), confirming forced-English holds
  regardless of the originating homepage locale, and shows the Free-only
  locked-value marketing block ("Know where to go tonight" / "Show me where
  to go tonight") that the homepage screenshot correctly does not have.
- `edge-mobile-en-pro-2-landing.png` — Pro tier, no locked-value block (as
  expected), day 3 "Status unavailable" with "Aurora data updated 16 hours
  ago" and a "Try again" retry link — consistent with the report's "edge"
  fixture. Both this and the previous screenshot show the sticky-header-
  overlay artifact the report discloses in §6 as a Playwright capture
  artifact, not an app defect — the overlap is cosmetic to the screenshot
  only and doesn't obscure functional claims.

All three genuinely corroborate specific source-level claims rather than
just looking plausible.

### The one finding: a third stale comment my Round 1 review didn't name

`NorthernLightsLanding.jsx`'s own file-header comment (lines ~14-23) still
reads: *"Ticket #423 Phase 2 (2026-09-25): this page now renders
NorthernLightsThreeNight.jsx... The homepage's own NorthernLightsCard usage
(App.jsx) is completely unaffected by this change."* That last sentence is
now false — App.jsx no longer uses `NorthernLightsCard` at all; both pages
render the same shared module. This is exactly the category of issue my
Round 1 review required fixing in `NorthernLightsThreeNight.jsx` and
`AuroraNightOutlook.jsx` (both of which were correctly fixed), but I only
named those two files, not this one, and CC's own comment sweep didn't catch
it either. It's a one-sentence, zero-functional-impact fix — not a reason to
send this back for a full REVISE round — but it should be corrected before
commit so a future reader (including a future me) isn't misled the same way
I warned about in Round 1. **Required before commit:** update that sentence
to reflect that App.jsx now renders the same shared module, not the retired
card.

### Verdict

**PASS.** The implementation matches approved-prompt-v1.md's requirements in
every area I could independently verify: homepage wiring, the surface fork
(including the landing-CTA-event regression fix), query/navigation identity
safety (no loop, no premature/duplicate events, correct fallback-and-
normalize behavior), analytics source-tagging, the `NorthernLightsCard.jsx`
orphan-status reporting and test follow-through I required in Round 1, and
scope discipline (no backend/routing/scoring drift). The one gap found — a
third stale file-header comment beyond the two I named in Round 1 — is
real but trivial and non-blocking; it should be fixed before commit.
Recommend CURRENT.md move to RESULT_REVIEW pending Ripley's final
assessment, per the ticket-423 pattern.

## Ripley final assessment — Round 1 — 2026-09-26

**PASS, with the documented locale fallback limitation below.** Reviewed CURRENT, approved v1, CC report and Jonesy's review; inspected the homepage/shared-module changes, query parser, external-date synchronization and selected-date URL reporting. The shared homepage/landing implementation preserves the canonical policy and gates, passes the selected evening through the existing route, and distinguishes analytics surface without changing checkout source. No backend/scoring/new-route scope drift found.

Independently ran the seven focused new/affected suites: **7 files /122 tests passed**. `npm run lint` passed. Production build initially failed on sandbox filesystem access while loading Vite config; the authorized retry outside that restriction passed (3027 modules, 4.47s, existing large-chunk advisory only). No test rerun was needed after the sole reviewer edit, which corrected NorthernLightsLanding.jsx's stale header comments as requested by Jonesy; lint/build ran after that edit.

Opened and inspected normal-desktop-is-free-1-home-module.png from CC's browser evidence: confirms three readable outlooks, selected poor state, actual data-age disclosure and the explicitly English detail-page link. I did not recreate CC's 16-run browser matrix or independently rerun the full 141-file/1989-test suite; those remain CC-reported.

Non-blocking limitation: the captured browser lacks Icelandic Intl locale support and displays the day-2 weekday as "Monday" within otherwise Icelandic UI. This is a real locale fallback limitation, not proof that every user's Chrome will display Icelandic. Native-locale browser validation or a translation-owned weekday fallback remains follow-up; no claim of universal browser localization support. Live provider/DB/cron checks remain unperformed. Homepage selection resets to tonight after a remount/back navigation, as reported; the required homepage-to-detail selected-date handoff is covered and passes.

Jonesy's sole required stale-comment follow-through is now resolved. CURRENT -> CLOSED. No commit, push, deployment or GitHub issue closure performed.

# #426 — Result review (approved-prompt-v1.md / cc-report.md)

## Jonesy verdict — Round 1

**PASS.** No findings. Every claim I checked against the current live
source and tests holds up exactly, including literal string- and
payload-level matches to the three clarifications I required in the prompt
review. Standing limitation restated as always: no shell access this
session, so the reported commands/counts (`npx vitest run`: 142 files/2000
tests full suite, 7 files/106 tests focused; `npm run lint` exit 0; `npm run
build` in 7.91s) are taken on the report's word — not re-run independently.
What I could verify directly (every specific test file named, the exact
source diffs, and 2 of 16 browser screenshots) is real and substantive, not
vacuous.

### Homepage Free value block (§1/§2)

Read `AuroraNightOutlook.jsx` in full. `FreeValueBlock` receives only `{t,
when, headingKey, bodyKey, ctaKey, onUpgrade}` — structurally incapable of
leaking a location name/coordinate/reason, matching the same pattern as
landing's `LockedValue`. `showHomepageFreeValue = isHomepage && !isPro &&
!loadingMe` gates it identically in both the qualifying branch (replacing
the old inline `nlMultiFreeHint`/`nlUpgradeCta` pair) and the poor branch
(previously zero Free upsell at all, now a genuinely separate, truthful
`nlMultiFreePoorHeading/Body/Cta` block that never claims a location is
recommended). The general forecast (pill/headline/body/notices/update-time)
renders unconditionally in both branches, never gated by this guard.
Landing's `{!isPro && !isHomepage && <LockedValue/>}` is untouched code,
correctly unconditioned on `loadingMe` — matches the explicit landing
exclusion in my required clarification #2.

Grepped every new translation key against Ripley's exact issue copy: all 7
EN and 7 IS strings (`nlMultiFreeValueHeading/Body/Cta`,
`nlMultiFreePoorHeading/Body/Cta`, `nlMultiFreeValueForNight`) are
byte-for-byte identical to the approved prompt's mandated text, in both
languages. The additive `"For {when}"/"Fyrir {when}"` caption (not one of
the mandated strings, but required by §1's "show a concise selected-night
label") is correctly built from the same `when` label the rest of the
module already uses — confirmed by the "For Sunday" assertion in the
loading-guard test after selecting day 2.

### Entitlement-loading guard (Jonesy requirement #2)

Read the full `loadingMe` threading: `NorthernLightsThreeNight.jsx` forwards
its own `loadingMe` prop straight into `AuroraNightOutlook`, which computes
`showHomepageFreeValue` once and reuses it for both branches — exactly the
"thread it through, cover both blocks" fix I required rather than a
poor-branch-only patch. Read
`NorthernLightsLanding.homeHandoff.test.jsx`'s dedicated describe block
("entitlement-loading guard, both qualifying and poor branches") in full:
four real tests exercise hidden-while-loading → shown-once-resolved-Free →
hidden-once-resolved-Pro for both branches, plus two tests specifically
proving the selected night/tab survives the `loadingMe` transition via a
same-shaped-tree `rerender` (not a remount) — matching cc-report's §7
process note about the remount trap it found and fixed. A fifth test
(exposure-events section) confirms `northern_lights_card_viewed` is held
back entirely while `loadingMe` is true and then fires with the real
resolved tier, consistent with the pre-existing exposure-event pattern from
#423/#425.

### Analytics (Jonesy requirement #1)

Read `handleUpgrade` in `NorthernLightsThreeNight.jsx` directly:
`const source = isHomepage ? "northern_lights_homepage" : rawSource` remaps
the click's attribution regardless of the literal string the button passed
in, then:
- `northern_lights_upgrade_clicked` (homepage): `{lang, source:
  "northern_lights_homepage", tier: "free", upgrade_source:
  "northern_lights_homepage"}` — exact match to the schema I required.
- `northern_lights_multi_day_upgrade_clicked` (homepage): existing fields
  unchanged, `upgrade_source: "northern_lights_homepage"` added via a
  conditional spread.
- Landing: both events keep their exact prior shape, no `upgrade_source`
  field added — confirmed by reading the unconditional/conditional branches
  directly, not just the report's description.
- The remapped `"northern_lights_homepage"` string is what's actually
  forwarded to the real `onUpgrade`/`startCheckout` callback (not the
  button's literal `"northern_lights_card"` argument) — confirmed by
  `App.northernLightsHomepageCheckout.test.jsx`'s real-adapter test
  asserting the resulting `/pricing?src=northern_lights_homepage&email=...`
  URL directly, through the genuine `useCheckoutFlow` (unmocked).

### IS detail link removal and the orphaned translation (§3, Jonesy requirement #3)

`{isHomepage && lang !== "is" && <Link .../>}` — confirmed the exact,
minimal gate. `nlHomeDetailsLink`'s IS value is still present in
`translations.northernLights.js` (retained per the requirement) and — since
`t` is already bound to the resolved `lang` before this call site, and the
call site itself only executes when `lang !== "is"` — the IS value has no
live read path, confirmed structurally, not just asserted. cc-report also
proactively disclosed a related fact I hadn't asked for: `nlMultiFreeHint`
(the key the old homepage branch used) is now also production-unused, while
`nlUpgradeCta`/`nlFreeHint` remain genuinely used by the retained
`NorthernLightsCard.jsx` — I independently grepped that file and confirmed
both claims directly (`nlUpgradeCta` at line 419, `nlFreeHint` at line 413,
`nlMultiFreeHint` absent from every non-test/non-translation production
file). This is exactly the transparent-reporting standard I've been asking
for since #425, extended here without being asked — worth noting
positively, not just as a box checked.

### Real-adapter checkout/login verification

Read `App.northernLightsHomepageCheckout.test.jsx` in full: `useCheckoutFlow`,
`useLoginFlow`, and `LoginModal` are genuinely real (only `useMe`,
data-fetching hooks, and unrelated presentational children are mocked,
matching the established `App.northernLightsAnchor.test.jsx` pattern). Four
tests directly confirm: the logged-in Free `/pricing?src=...&email=...` URL,
the logged-out real-modal-opens-instead-of-navigating path with the correct
trackEvent payload, an honest boundary-documentation test that doesn't fake
a real login submission, and selection/fetch-count preservation across
modal open/close.

### Scope-drift check

Staged and checked mtimes for `useCheckoutFlow.js`, `useLoginFlow.js`,
`checkoutSource.js`, `AppRoutes.jsx`, `auroraScoring.js`, and
`auroraMultiNightPolicy.js`: all predate this #426 implementation window —
no protected-flow, routing, or scoring changes, matching the prompt's
boundary exactly. `App.jsx` itself also carries an unchanged mtime (no
change needed there, since `surface="homepage"` was already wired in #425).

### Browser evidence

16 screenshots confirmed present, matching the claimed 8-run × 2-state
matrix. Opened 2 directly: `mobile-is-free-2-poor.png` shows the real IS
poor-state render — "Fyrir Wednesdaykvöld" (the same disclosed, pre-existing
ICU-locale browser limitation as #425, not a new regression), "Berðu saman
staðina með Pro" heading/body/button matching the translations file
exactly, and **no** detail link anywhere on the card. `mobile-en-free-2-poor.png`
shows the equivalent EN render with "For Wednesday night", "Compare
locations with Pro", and the "See full details for this night" link
correctly present. Both genuinely corroborate the IS-absence/EN-presence
claim pixel-for-pixel, not just plausibly.

### Verdict

**PASS.** This is a clean implementation: every one of the three
clarifications I required in Round 1 was incorporated precisely (down to
literal analytics-payload shape and the loading-guard covering both Free
blocks), scope discipline held (no backend/scoring/routing/payment-plumbing
touched), and the report's disclosures (the login-continuation boundary,
the orphaned translations, the known locale limitation) are honest and
match what I could independently verify. Recommend `CURRENT.md` move to
`RESULT_REVIEW` pending Ripley's final assessment, per the established
#423/#425 pattern.

## Ripley final assessment — Round 1 — 2026-09-28

**PASS within the approved scope.** Independently inspected the production diffs against approved v1 and the three consolidated clarifications. The homepage qualifying/poor Free blocks share the entitlement-loading guard, use the requested wording and selected-night caption, and receive no location data. Pro presentation and landing copy/CTA behavior remain unchanged. The IS homepage detail link is absent while EN retains its selected-date link. Both click payloads and the callback source match the approved homepage attribution schema; no payment/login/scoring implementation changed.

Independent validation: the specified seven focused suites passed (**7 files /106 tests**); npm run lint passed; npm run build passed (**3027 modules, 4.29s**, existing large-chunk advisory). The focused run emitted jsdom navigation-not-implemented warnings but no failing tests. CC's full 142-file/2000-test run and full browser matrix were not rerun; those remain CC-reported evidence.

Opened mobile-is-free-2-poor.png directly: confirms one truthful comparison CTA, poor-state disclosure, selected-night caption, and no IS detail link. The known missing-ICU fallback visibly produces "Wednesdaykvöld" in this browser; that remains a documented localization limitation from #425, not a claim of correct Icelandic rendering on every browser. Did not recreate CC's browser run or perform live provider/payment checks.

Reporting precision: CC's phrase "no attribution at all" after login is too broad. The existing pricing route supplies fallback attribution "pricing" when src is absent; what is lost is the homepage-specific attribution and selected date. That continuation limitation was explicitly excluded from this approved UX scope. The new CTA click itself is attributed, logged-in pricing navigation carries the homepage source, and selected night survives modal open/close. No date-through-purchase guarantee is claimed.

CURRENT -> CLOSED. No production edits by this assessment, no commit, push, deployment or GitHub issue closure. Retained unused IS link translation and legacy-key status are documented in CC's report.

# #431 — Jonesy result review (Round 1)

Date: 2026-10-01
Reviewed against: `docs/ai/tasks/ticket-431/approved-prompt-v1.md` (Jonesy APPROVED Round 1,
no required clarifications) and `docs/ai/tasks/ticket-431/cc-report.md`.

**Verdict: PASS. No findings.**

This was the most consequential ticket I've reviewed in this workflow — entitlements
semantics, analytics integrity, and public pricing copy all at once — so this review
went deeper than usual: every production file CC claims to have changed was read in
full (not diffed against the report's prose), every pricing/about copy fix was grepped
to its literal current string, the new test file was read and its real test count
counted independently, two browser screenshots were opened and visually checked against
specific claims, and `results.json` was read in full rather than sampled.

## Standing limitation

No `device_bash` this round (checked at the start, not found). The full-suite count
(147 files/2036 tests), lint, and build results are taken on CC's word. I did
independently verify the one test-count claim I could check directly (`features.test.js`:
12 tests, confirmed by counting `it`/`it.each` instances myself) and verified every
file CC claims as new/changed/unchanged against its actual mtime.

## What I verified against live source, file by file

**`src/config/features.js`**: `NL_FREE_EXPERIMENT_ID = "northern_lights_free_v1"`
exported; `northernLights` keeps `tier: "pro"` (rollback-documented) and gains
`freeDuringExperiment: true, experimentId: NL_FREE_EXPERIMENT_ID`.
`isFeatureAvailable()` checks `def.freeDuringExperiment` only inside the
`def.tier === "pro" && tier !== PRO` branch, before falling through to the normal
`requires_pro` denial — so this is surgical: `windDirection`, `shelterIndex`,
`bestRoutePlanner`, `campsiteComparison` (none of which set `freeDuringExperiment`)
are structurally untouched, and real Pro users never even reach this branch at all.
Hand-traced `isFeatureAvailable("northernLights", undefined)` (anonymous) through the
function and confirmed it resolves to `available: true, reason: "experiment_free"` —
matches the "including to anonymous/not-yet-resolved entitlements" claim.

**`src/components/NorthernLightsThreeNight.jsx`**: `hasNLAccess` (from the gate above)
and `tier` (from `getUserTier(entitlements)` directly, no longer derived from access)
are genuinely separate variables now. Both previously-hardcoded `tier: "pro"` literals
on `ranking_viewed`/`map_viewed` — the ones I flagged as more direct than the original
preflight's prose suggested — now read the real `tier`. `business_model_experiment:
NL_FREE_EXPERIMENT_ID` is present on all 8 event emissions in this file. `handleUpgrade`
and the `onUpgrade` prop are completely gone — not just unreachable, actually deleted
(confirmed: neither appears anywhere in the file, and the component's prop list no
longer declares `onUpgrade`). `northern_lights_upgrade_clicked`,
`_multi_day_upgrade_clicked`, and `_landing_cta_clicked` no longer have any `trackEvent`
call site in this file at all — confirms they'll naturally stop firing rather than being
faked/repurposed, as item 5 required. The IS-no-link/EN-link rule from #426 is
byte-for-byte unchanged.

**`src/components/AuroraNightOutlook.jsx`**: `LockedValue` and `FreeValueBlock` are
gone — not present anywhere in the file — along with the `onUpgrade`/`surface`/
`loadingMe` props and the `isHomepage`/`showHomepageFreeValue` variables that fed them.
The remaining `isPro`-gated disclosure (reason summaries, the named-location line,
the full details/ranking/map block) is otherwise byte-for-byte the same logic as
before — it now receives `hasNLAccess` instead of real Pro status, which is exactly the
intended behavior change and nothing more.

**`src/pages/NorthernLightsLanding.jsx`**: the lower Free-only conversion section is
gone — the page now has exactly hero / `NorthernLightsThreeNight` / "how it works" /
disclaimer / footer, nothing else. `useLoginFlow`, `useCheckoutFlow`, `LoginModal`,
`useToast`/`ToastHub`, `useNavigate` are all absent from the import list.
`useMe`/`entitlements`/`loadingMe` are kept and still feed `aurora_landing_viewed`,
whose tier derivation (`entitlements.isPro ? "pro" : "free"`) is untouched — correct,
since this emission point was already independently correct, as I noted in the prompt
review — and now additionally carries `business_model_experiment`.

**`src/App.jsx`**: `onUpgrade={startCheckout}` is gone from the one Northern Lights
mount site (confirmed by reading the exact prop list at that mount), while the same
`startCheckout` is still wired to all five other Pro-feature call sites elsewhere on
the page (Route Planner, comparison, leaderboard, forecast table, weather finder) —
confirmed via grep, matching "five other call sites... unmodified" exactly.

**`src/components/NorthernLightsCard.jsx`**: mtime unchanged from before this ticket
(confirmed against the mtime I recorded during the prompt-review round) — production
code genuinely untouched, consistent with "legacy, not mounted, out of scope." Its two
test files (`NorthernLightsCard.test.jsx`, `.landingVariant.test.jsx`) both show new
mtimes from during the implementation window, consistent with "only its tests were
updated."

## Pricing/about copy — my own Round 1 leads, checked against the actual fix

All five strings I flagged, plus the one CC found independently, verified by direct
grep against the live translation files and `Pricing.jsx`:
- `pricingFeatureAurora` bullet: confirmed zero remaining references in `Pricing.jsx`
  (removed from all four plan arrays); the translation string itself is still defined
  but orphaned, matching "left defined, unused" exactly.
- `pricingAuroraLearnMoreLink`: now "Learn more about Northern Lights" (EN) / "Sjá
  nánar um norðurljós" (IS) — "on Pro"/"í Pro" genuinely dropped in both languages.
- `pricingInfoAuroraTitle`: now "Northern Lights: same assessment and detail for
  everyone" (EN) / matching IS. `pricingInfoAuroraFreeBody` and `pricingInfoAuroraProBody`
  are now the identical verbatim string in both languages — read both directly, confirmed
  character-for-character equal, not just claimed equal.
- `auroraInfoSameAssessment` (the shared key): now "Free and Pro use the same nightly
  Northern Lights assessment, with the same level of detail and comparison." This one
  key is referenced by `About.jsx`, `PricingInfo.jsx`, and `Pricing.jsx` all three —
  confirmed via grep — so fixing it once genuinely does propagate to all three surfaces
  without further edits, exactly as claimed.
- `aboutAuroraProNote` (found by CC, not in my list): now "Named locations, reasons and
  place comparison, when results support them." — the "Pro" framing is genuinely gone.

## Tests

**`src/config/features.test.js`** (new): read in full. Exercises the real
`isFeatureAvailable`/`getUserTier`/`getFeatureLimit` directly, not mocked. I
hand-verified one of its assertions (`windDirection` with `{isPro:false}` →
`requires_pro`) against the actual `features.js` logic and it matches. Counted the test
instances myself (5 + 4 from `it.each` + 2 + 1) = **12**, matching the claimed count
independently rather than trusting it.

**`src/App.northernLightsHomepageCheckout.test.jsx`** (rewritten): read in full.
`useCheckoutFlow`/`useLoginFlow`/`LoginModal` are deliberately left real and unmocked
(confirmed by the file's own mock list, which stubs only irrelevant surfaces) — this
is a genuine adapter-reachability test, not a weakened one. It asserts the real details
toggle opens details with no dialog, no `navigate()` call, and none of the three removed
purchase-click events firing, for both a logged-in Free user and a logged-out visitor.
This is a legitimate inversion of the file's original purpose (previously proved
checkout WAS reached; now proves it never is), not a cover for lost coverage.

## Scope-drift check

`useAuroraThreeNight.js`, `auroraDisplaySelection.js`, and `auroraMultiNightPolicy.js`
all confirmed at the exact mtimes recorded during the prompt-review round, before any
CC work — the non-commercial scoring/ranking/eligibility rules this ticket was
explicitly forbidden from touching are untouched.

## Browser evidence

Confirmed exactly 24 screenshots + `results.json` (12 combinations × 2 states each) in
`outputs/ticket-431-browser-evidence/`, matching the claimed run matrix. Read
`results.json` in full (not sampled): all 12 combinations show `hasPaywallWordBefore:
false`, `detailsOpened: true`, `mapPresent: true`, `hasLoginDialogAfterOpeningDetails:
false` — and, notably, `bodyLength` is identical (or within 1 byte) between the Free
and Pro run of the same route/viewport pair, which is independent, structural evidence
that Free and Pro are rendering the same content, not just an assertion that they
should. Opened two screenshots directly:
- `desktop-free-is-homepage-2-details.png`: IS homepage, Free — shows "Bestu skilyrðin
  í kvöld: Test Spot 1" (named best location), the full 6-location ranked list with
  names and comfort labels, and the map with a visible marker. No lock, no "Pro" text,
  no upgrade button anywhere.
- `mobile-free-en-landing-2-details.png`: EN landing, Free, mobile — shows "Best
  conditions tonight: Test Spot 1", real reason tiles, expanded details, and no lower
  conversion section at all.
Both precisely match the specific claims made about them in §6 of the report.

## Experiment note

Read `experiment-note.md` in full. It is comprehensive and, importantly, intellectually
honest in two places worth calling out: §4 explicitly flags that `details_opened`/
`ranking_viewed`/`map_viewed` baseline counts are Pro-only by construction, so a raw
post-launch increase must be segmented by the new genuine `tier` field rather than read
as a naive win; and §5's rollback section states plainly that the fast flag-flip
rollback does **not** restore the deleted pre-#431 Free upgrade CTA, only the access
gate — a real, disclosed limitation rather than an implied full rollback. The launch
checklist correctly leaves every field (UTC datetime, commit SHA, deployment identity,
GA4 custom-dimension registration) marked PENDING, consistent with "NOT DEPLOYED."

## Assessment

Every substantive claim I could independently check — the access/tier split, the
teaser-UI removal, the five-plus-one pricing-copy fixes, the event inventory, the
scope boundaries, the new and rewritten tests, and the browser evidence — held up
exactly as described, including the two self-disclosed limitations in the experiment
note that a less careful report might have glossed over. I found nothing to send back.

— Jonesy

## Ripley final assessment — 2026-10-01

**REVISE.** Independently ran 8 focused suites (feature registry, three-night module and round5, home handoff, homepage checkout absence, landing, pricing and pricing-info): **118 tests passed**. Reviewed current production diff, experiment note and relevant handlers. Existing green tests do not cover two required measurement paths:

1. **[P1] Interaction tier is guessed while loading.** NorthernLightsThreeNight derives tier unconditionally via getUserTier(entitlements). While loadingMe is true, initial missing entitlements resolve to free. toggleDetails, selectNight and handleSeeRecommendedNight emit that guessed tier immediately, unlike the guarded exposure effects. A real Pro visitor clicking before /api/me resolves is recorded as Free. Approved v1 item 4 explicitly requires unknown or deferred attribution without blocking access. Add targeted click-before-resolution coverage, including eventual Pro resolution, and fix the interaction payloads.
2. **[P2] Existing location interaction remains unmeasured.** AuroraNightOutlook passes onSelect={() => {}} to NorthernLightsMap. MapView's aurora marker click already invokes that callback and opens a popup, but no NL location-interaction event is emitted. Approved v1 item 6 required tracking existing location/ranking actions where missing. map_viewed/ranking_viewed are exposure, not marker usage. Instrument this actual action through the NL adapter, preserving generic map behavior; no new interaction UI is required.

The experiment note must document unknown-tier interaction semantics and the new location action, including that it lacks a historical baseline. Keep deployment/GA4 registration pending. No production edits made by Ripley. The reported full suite/build/browser results remain attributed to CC; this assessment does not repeat them as independent validation.

These are corrections within already-approved v1 requirements, not a scope expansion. Created approved-prompt-v2.md for the corrective execution and moved CURRENT to READY_FOR_CC as required by the final-assessment REVISE transition. Preserve v1 and both original reviews/reports.

---

# #431 v2 — Jonesy result review (corrective execution)

Date: 2026-10-01
Reviewed against: `docs/ai/tasks/ticket-431/approved-prompt-v2.md` (Ripley's corrective prompt,
issued after Ripley's final-assessment REVISE on my own Round 1 PASS) and `cc-report.md`'s
v2 section.

**Verdict: PASS. No findings.**

## First: owning the miss this corrects

Ripley's REVISE caught two real measurement-integrity gaps that my own Round 1 review did
not — a premature "free" guess on immediate interaction events while `loadingMe` was still
true, and a completely untracked real user action (the aurora map marker click, wired to a
no-op). Both are genuine, not nitpicks: the first mislabels real Pro users as Free in
interaction data whenever they click before `/api/me` resolves, and the second is a real,
clickable, already-shipped-in-v1 action with zero instrumentation despite item 6 of the
v1 prompt explicitly requiring existing-interaction coverage. I verified the production
code structurally (gate vs. tier separation, exposure-effect `loadingMe` guards) but did
not trace what the *interaction handlers themselves* record before resolution, and did not
check whether the map's `onSelect` was wired to anything at all. Both are now logged as
things to check explicitly on any future ticket with async entitlement resolution or a map
component: trace every `trackEvent` call site's guard individually, not just the exposure
effects as a group, and check every prop passed to a child component against what that
child actually does with it (not just that a prop exists).

## What I verified against live source, file by file

**`src/components/NorthernLightsThreeNight.jsx`**: `const interactionTier = loadingMe ?
"unknown" : tier;` is a single new line, used only at the three interaction call sites
(`toggleDetails`, `selectNight`, the second `trackEvent` inside
`handleSeeRecommendedNight`) and the new `handleLocationSelect`. Confirmed directly by
reading all four call sites. The five exposure effects (`card_viewed`/`unavailable_viewed`/
`stale_viewed`, `ranking_viewed`, `map_viewed`, `best_night_viewed`) still use the genuine
`tier` (not `interactionTier`) and still keep their pre-existing `if (loadingMe) return;`
guards, byte for byte unchanged from what I read in Round 1 — exactly matching "explicitly
preserved, unchanged." `handleLocationSelect(locationId)` is a new, minimal function that
only calls `trackEvent("northern_lights_location_selected", {...})` with `interactionTier`
in `user_tier` — it does nothing else (no state, no side effect beyond the event), so it
cannot interfere with the actual map/selection behavior itself.

**`src/components/AuroraNightOutlook.jsx`**: gained exactly one new prop,
`onLocationSelect = () => {}` (default no-op, so nothing breaks if a future caller omits
it), forwarded as `onSelect={onLocationSelect}` to the real `NorthernLightsMap` at the one
place that component is rendered. No other change to this file — the previous inline
`() => {}` literal is simply replaced by the forwarded prop.

**`src/components/NorthernLightsMap.jsx`**: confirmed unchanged (mtime identical to the
pre-#431-v1 baseline I recorded in my own Round 1 review) — it already forwarded `onSelect`
straight through to `MapView` untouched; v2 needed no edit here, consistent with the
report's "read-only confirmation, zero changes" claim.

**`src/MapView.jsx`**: confirmed unchanged (mtime predates the entire ticket). Grepped the
actual marker click handler directly: `eventHandlers={{ click: async () => { onSelect?.
(site.id); if (!isAuroraMode && ...) { await loadForecast(site); } ... }}}` — this is the
real, pre-existing, generic marker-click mechanism (it already called `onSelect` for every
map mode; aurora mode just never had anyone listening). The non-aurora forecast-load branch
is explicitly guarded by `!isAuroraMode`, so generic campsite-map behavior is provably
unaffected by wiring the aurora side up. This is exactly the "exact, pre-existing mechanism
the new event now rides on" claim — I did not just trust CC's description of this handler,
I read it.

## New test file

**`src/components/NorthernLightsThreeNight.interactionTier.test.jsx`**: read in full, 10
tests across two `describe` blocks (5 + 5), matching the claimed count exactly. The tests
earn their claims:
- The rerender pattern reuses the *same* `fetchImpl` function reference across the initial
  render and the `rerender()` call that flips `loadingMe`/`entitlements` — the file's own
  comment explains why (a fresh mock reference would look like a new `fetchImpl` to the
  underlying hook and reset its loading state), and this matches the established convention
  I'd already seen in other NL test files this session.
- The "no retroactive relabel" claim is actually asserted, not just described: after the
  resolving `rerender()`, the test re-checks that exactly one `night_selected` call still
  exists and that its `user_tier` is still `"unknown"` — a weaker test could have only
  checked the *next* event and missed a bug that silently rewrote the old one.
- The marker-click tests use a local, richer `NorthernLightsMap` mock (one real clickable
  button per location, each wired to the real `onSelect` prop) specifically so the actual
  callback chain — `AuroraNightOutlook` → `NorthernLightsThreeNight` — gets exercised end
  to end, not just asserted by reading the prop. Confirmed `locationSelectedEventCount`
  stays at zero immediately after the map becomes visible (exposure alone never fires it)
  and becomes exactly one only after a simulated click.

## Browser evidence (v2)

Confirmed the 4 new `v2-*` screenshots plus `v2-marker-click-results.json` are present,
matching the claimed file list. Read the JSON in full: both Free and Pro runs show
`markerCount: 6`, `markerClicked: true`, exactly one `northern_lights_location_selected`
event (`eventsBeforeClick: 5` → `totalEventsAfterClick: 6`), with the expected
`location_id`/`selected_date`/`days_ahead`/`source`/`user_tier` fields. Opened two
screenshots directly:
- `v2-pro-landing-map-before-click.png`: the module renders normally pre-click — tabs,
  status pill, named best location, reason tiles, expanded ranked location list — no popup
  open yet.
- `v2-free-landing-map-after-click.png`: clicking the Test Spot 1 marker (Reykjavík) opens
  its popup — "Test Spot 1 — Aurora-viewing conditions: Excellent viewing conditions" — a
  real Leaflet popup, not a mock.

**The report's self-flagged discrepancy checks out.** CC noted the captured console-preview
text for the marker-click event doesn't visibly show `business_model_experiment` in its
printed string, while the production code does pass it. I read `v2-marker-click-results.json`
directly: `locationSelectedEventText` does end at `user_tier: free}` / `user_tier: pro}` with
no trailing field shown. I also reread the unit test's exact-match assertion
(`NorthernLightsThreeNight.interactionTier.test.jsx`, "fires exactly once..." test) — it
asserts the *complete* literal payload object, including `business_model_experiment:
NL_FREE_EXPERIMENT_ID`, with `toHaveBeenCalledWith` (not `objectContaining`), and that test
passes. A truncated console-preview string is consistent with a display artifact and not
with a missing field, given the unit test's stronger, exact-match evidence. I'd call this
resolved, not just plausibly explained — CC was right to flag it rather than silently drop
it, and right not to over-claim a fix for a display quirk in an ad hoc capture script that
was deleted after the run anyway.

## Experiment note (v2 addendum)

Read in full. §3b's description of `interactionTier` semantics and the new event's "no
previous baseline" caveat match the source and the test file precisely. §2's event
inventory table addition for `northern_lights_location_selected` correctly states it "did
not exist — map marker click was a no-op," which I independently confirmed by reading the
pre-v2 `AuroraNightOutlook.jsx` in my Round 1 review (the literal `onSelect={() => {}}`).

## Standing limitation (v2)

Still no `device_bash` this round. The full-suite delta (148 files/2046 tests, +10 over the
v1 baseline) is taken on CC's word beyond the one new file I counted directly. Lint/build
results likewise taken on CC's word.

## Scope check (v2)

`src/config/features.js` is explicitly stated unchanged in v2 and I have no reason to
doubt it (nothing in the v2 prompt touches entitlements/registry, and the v2 diff summary
names only the two component files plus the new test file). The five exposure effects'
`loadingMe` guards and genuine-`tier` usage, confirmed unchanged line-for-line against what
I read in Round 1. No scoring/ranking/candidate/freshness file in this diff.

## Assessment (v2)

Both of Ripley's REVISE items are fixed precisely as scoped, nothing more: `interactionTier`
only touches the four interaction call sites, never the exposure effects; the new location
event rides the real, pre-existing, unmodified marker-click mechanism with no new UI and no
change to generic (non-aurora) map behavior. The new test file actually exercises the
callback chain rather than asserting a prop was passed, and a self-reported discrepancy in
the browser evidence holds up as a display artifact once cross-checked against the unit
test's exact-match assertion. Nothing to send back.

— Jonesy

## Ripley final assessment v2 — 2026-10-01

**PASS — local implementation complete.** Both previous findings are resolved: immediate interaction payloads use unknown during loadingMe, genuine tier afterward; real aurora marker clicks reach the new location_selected handler with the selected night's metadata. Exposure guards remain intact, and map/scoring/entitlement behavior is not expanded.

Independent validation: read approved v2, source handlers/callback wiring and the new test file; ran 10 focused feature/module/interaction/homepage/landing/pricing/map suites: **139 tests passed**. Whole-repo lint passed. Production build passed (4.58s, existing large-chunk warning). Personally viewed v2-free-landing-map-after-click.png, confirming the real marker popup. Full-suite 2046-test result and browser run execution remain attributed to CC.

Evidence qualification: source and passing exact-payload tests confirm business_model_experiment is passed to trackEvent. The truncated browser console preview does not independently prove that field's browser transmission, and neither evidence proves live GA4 ingestion. That remains a launch verification item, not a local implementation blocker.

CURRENT -> CLOSED for development workflow only. Deployment has not been performed here. Actual UTC launch time, commit/deployment identity, GA4 custom-dimension registration and live event verification remain pending in experiment-note.md. No commit/push/deploy/GitHub closure performed by Ripley.

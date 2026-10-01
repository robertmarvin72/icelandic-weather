# #431 — Northern Lights Free experiment — Round 1

Date: 2026-10-01. Ripley. Discussion/review only, not executable.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/431

## Objective

Open the complete existing three-night Northern Lights experience to anonymous/Free users on the homepage (IS/EN) and /en/northern-lights, with the same data, recommendations, locations, ranking, map eligibility and details as Pro. Isolate paywall removal: no affiliate CTA, Facebook campaign or wider business-model redesign. Only Northern Lights access changes.

## Read-only preflight

#428 CLOSED; working tree clean. FEATURES.northernLights is tier=pro/preview=true. API aurora-decision is tier-independent; the three-night controller already fetches the same data for both tiers. Actual mounted entrypoints are App -> NorthernLightsThreeNight and NorthernLightsLanding -> NorthernLightsThreeNight. Legacy NorthernLightsCard is no longer mounted but exports the shared shell class; audit its reachable dependencies before deciding whether adaptation is necessary.

NorthernLightsThreeNight currently conflates gate.available with isPro and derives analytics tier from access. Ranking/map events hardcode tier=pro. Merely making the feature Free would corrupt measurement. AuroraNightOutlook gates identities, reasons and details on isPro; landing separately renders a Free-only conversion section and checkout handler. selectAuroraDisplay uses its isPro argument for presentation eligibility, while retaining qualifying-band/canonical-order/map rules. These non-commercial data rules must remain intact.

#426 deliberately removed the IS homepage link to the English landing. The shared homepage can itself provide full details after opening access. Preserve that IS link decision; retain the EN selected-date link and prove it is frictionless. /en/northern-lights remains forced English, including saved IS. Existing date/query, freshness and comparison semantics remain unchanged.

## Required implementation

1. Confirm the complete NL access/data/event flow before writes, including map mode, all rendered CTA/copy, feature registry consumers and any reachable old card. Implement access centrally through features.js (and a small named experiment configuration if useful), only for northernLights. Do not grant global Pro or mutate entitlements. Maintain a clear distinction between actual account tier (getUserTier/entitlements) and permission to view full NL details. Rename local/helper access arguments where needed rather than using effective access as analytics tier. Adapt consumers/tests consistently, not a global search-and-replace.
2. Remove NL-specific purchase locks, teaser/upgrade blocks and purchase callbacks from the active homepage/landing journey. The separate landing conversion section must not remain. Retain truthful result content, details disclosure, ranking/map and best-night interaction. No login or checkout required even before entitlement resolution. Preserve genuine Pro behavior. Audit user-facing NL copy (including any reachable pricing claim) for false promises that payment is required; change only directly contradictory NL claims, via IS/EN translations. No broad layout/copy redesign or dead-code cleanup.
3. Keep existing API requests, six-candidate set, score/ranking order, three-night window, 5-point comparison rule, freshness expiry and partial/unavailable/no-darkness/all-poor behavior unchanged. Full access does not mean bypassing non-commercial ranking/map eligibility or recommending poor locations. No backend change, forecast clipping, data duplication or extra requests on tier/language rerender.
4. Analytics: add business_model_experiment=northern_lights_free_v1 to appropriate NL semantic events using a consistent narrow mechanism. Preserve event names, meaningful existing source/placement/date/status fields and deduplication. Actual Free stays free and Pro stays pro in tier/user_tier; never hardcode pro on ranking/map exposure. Wait for truthful entitlement resolution for exposure tier attribution as currently done; if an interaction is possible during loading, use an explicitly documented unknown tier or defer recording without blocking access, rather than inventing Free/Pro.
5. Audit all issue-listed events: northern_lights_card_viewed, aurora_landing_viewed, northern_lights_state_viewed, northern_lights_ranking_viewed, northern_lights_landing_cta_clicked, northern_lights_details_opened, northern_lights_night_selected, northern_lights_best_night_viewed, plus map/upgrade/share events actually present. Document which exist and their current meaning. Removed purchase CTAs should naturally stop emitting purchase-click events; never fabricate events or repurpose a purchase event as forecast engagement just to preserve counts. Retain unrelated checkout attribution/conversion instrumentation so historical lost-subscription comparison remains possible.
6. For existing location/ranking/share actions, retain or add narrowly scoped interaction tracking where missing, with bounded non-PII metadata and actual action semantics. Do not count an impression as a click/share success. If no NL share UI exists, document that measurement gap; do not introduce a new share feature during this paywall-only baseline. Use existing GA4 page/session/user metrics for traffic, active/returning users, engaged sessions and views per user, not new client counters or duplicate pageviews. Identify any GA4 custom-dimension setup needed for the experiment parameter; code emission alone does not prove GA4 report registration.

## Experiment documentation and launch boundary

Create a task experiment/measurement note with event inventory, payload changes, before/after comparability limitations, rollback scope, baseline and launch checklist. Baseline supplied in issue, not independently fetched: 2026-09-01 to 2026-10-01; landing 442 views / 191 active users / 2.31 views per active user / 1407 events. Events (count/users): card 615/265, landing 197/158, state 56/34, ranking 54/7, landing CTA 43/38, details 39/8, night selected 39/5, best night 29/13. Reference the named baseline artifact without claiming to have opened it.

Launch status must remain NOT DEPLOYED / timestamp pending until an actual deployment is verified. Provide fields for exact UTC launch datetime, commit and deployment identity; never substitute coding date or commit time. Record the first measurement window as at least 3, preferably 7 days after launch. No affiliate/campaign starts, automatic monitoring, deployment or external GA4 configuration changes in this execution. Launch recording and live GA4 checks remain owner-controlled follow-up; distinguish local implementation completion from live experiment acceptance. Evaluate traffic + engagement + feature usage against lost subscription impact; do not claim causal success from raw growth alone or include affiliate revenue.

## Tests and validation

- Feature registry tests: anonymous/Free/Pro can access northernLights; representative unrelated premium features/limits remain exactly unchanged.
- Real shared-module/homepage/landing tests: anonymous and logged-in Free match Pro on same deterministic three-night fixtures; select every night, view recommendation, open details and qualifying ranking/map, follow EN homepage selected-date link without login/checkout. IS homepage has full local details and preserved no-English-link rule. Forced-English landing with saved IS works.
- Cover loading entitlements, resolved Free/Pro, rerender, persisted disclosure and qualifying/all-poor/unavailable/stale/expired states. No NL upsell flashes, callback/checkout calls or data request multiplication. Update obsolete Free-lock assertions explicitly; do not delete independent state/date/freshness protections.
- Analytics tests: experiment metadata on relevant events, correct actual tiers, exposure dedupe, real interaction counts, no event for removed purchase CTA, unchanged unrelated analytics. Verify best-night selection and ranking/map exposure reflect visible content, not background slots.
- Run affected suites (including prior #423/#425/#426/#427 regressions), lint and build. Browser-check mobile/desktop, IS/EN homepage and English landing with fixed-date stub data and anonymous/Free/Pro states; capture evidence of open details/ranking/map as eligible and absence of NL paywalls. Do not claim live GA4 ingestion from mocked trackEvent tests.

## Scope / STOP / workflow

Read AGENTS.md, CLAUDE.md, docs/ai/README.md and CURRENT. No scoring/recommendation algorithm, normalization, raw data, backend, pricing/payment entitlement semantics or unrelated premium gate changes. No new libraries, TypeScript, explicit import extensions. If audit finds opening NL requires broader entitlement/backend/data changes, stop and obtain owner approval with concrete evidence. No commit/push/deploy/issue closure; user manages git. No affiliate CTA/campaign or permanent-free decision.

Jonesy reviews at PROMPT_REVIEW. Following APPROVED Ripley consolidates approved-prompt-v1.md and sets READY_FOR_CC. CC verifies pointer, sets CC_IN_PROGRESS before implementation, writes docs/ai/tasks/ticket-431/cc-report.md with commands, browser evidence and pending launch/GA4 items, populates CURRENT and sets CC_COMPLETE. Result review: docs/ai/tasks/ticket-431/result-review.md. Preserve previous task history.

---

## Jonesy Round 1 review — 2026-10-01

**Verdict: APPROVED. No required clarifications.**

This is the most consequential prompt I've reviewed in this workflow — it touches
entitlements semantics, analytics integrity and public pricing copy, not just a single
component — so I read every file in the actual access/presentation/analytics chain
before forming a verdict, not just the preflight's characterization of them.

### What I independently verified, file by file

**`features.js`**: `northernLights: { tier: "pro", preview: true, label: "Northern
Lights" }` (line 28), and the file's own existing comment already states "the
underlying `/api/aurora-decision` request/response is identical for both" tiers —
confirms the preflight's two opening claims exactly, pulled from source the preflight
is itself quoting accurately.

**`NorthernLightsThreeNight.jsx`**: confirmed the conflation precisely — `const gate =
isFeatureAvailable("northernLights", entitlements); const isPro = !!gate.available;
const tier = isPro ? "pro" : "free"` (lines 146-148). `tier` is derived directly from
the access gate, not from account identity. This is a real, correctly-identified risk:
once `gate.available` becomes true for Free users, `tier` becomes `"pro"` for them too
unless this is split apart — which is exactly what item 1 requires ("Maintain a clear
distinction between actual account tier... and permission to view full NL
details... Rename local/helper access arguments where needed rather than using
effective access as analytics tier").

One thing worth surfacing because it's **more direct than the preflight's prose
suggests**: `northern_lights_ranking_viewed` and `northern_lights_map_viewed` (lines
273, 281) don't even go through the conflated `tier` variable — they hardcode the
literal string `"pro"` directly in the `trackEvent` call. This is good to know going
in: there's no `tier` plumbing to fix at those two call sites, there are two literal
strings to replace with the genuine account-tier value. Doesn't change the verdict;
just a concrete head start for whoever implements this.

**`AuroraNightOutlook.jsx`**: confirmed `isPro` is the single gate behind essentially
all Pro-only disclosure — reason summaries (line 302), the full "best on {when} at
{name}" line vs. the generic copy (line 309), the entire details-toggle/ranked-list/map
block (lines 344-398), and both teaser paths: `LockedValue` (landing, gated `!isPro &&
!isHomepage`, line 326) and `FreeValueBlock` (homepage, gated by `showHomepageFreeValue
= isHomepage && !isPro && !loadingMe`, used for both the qualifying and poor-result
branches, lines 255-266 and 331-342). This is good architectural news for the ticket:
the gating is centralized behind one prop, not scattered, so once "has NL access"
resolves to true for everyone, the full disclosure surface opens correctly everywhere
at once, and — because the teaser blocks are gated on the same `!isPro`, not a separate
flag — they become naturally unreachable without needing separate removal logic. CC
will still need to decide whether "remove... purchase callbacks" (item 2) means
physically deleting `LockedValue`/`FreeValueBlock`/`handleUpgrade` or leaving them
behaviorally dead; I don't think this needs to be resolved in the prompt — it's the
kind of call item 1's own "confirm the complete flow before writes" step is meant to
surface, and the required tests ("No NL upsell flashes, callback/checkout calls...")
will catch either approach if it's wrong.

**`auroraDisplaySelection.js`**: confirmed `selectAuroraDisplay`'s own doc comment
already describes its `isPro` parameter as "presentation-only gate; never affects which
locations qualify, only whether the ranking/list is actually rendered" (lines 17-18) —
the codebase's existing naming already supports exactly the access/tier split item 1
asks for; this isn't introducing a foreign concept into the code.

**`useAuroraThreeNight.js`**: grepped for `isPro`/`entitlements`/`tier` — zero matches.
Confirms "the three-night controller already fetches the same data for both tiers" is
not just asserted but structurally true: there is no tier input to this hook at all.

**Mounting**: confirmed via grep that `App.jsx` (line 426) and
`NorthernLightsLanding.jsx` (line 189) are the only two mount sites for
`NorthernLightsThreeNight`, and that `NorthernLightsCard` is imported nowhere outside
its own file and a header-comment mention — matches "legacy card no longer mounted"
exactly. `entitlements` is passed straight through to `NorthernLightsThreeNight` at
both sites (confirmed at `App.jsx` line 429), and `getUserTier(entitlements)` is
already exported from `features.js` — so the genuine-account-tier half of the fix has
a clean, already-available primitive to use; no new plumbing is required to implement
item 1 correctly.

**One thing I checked beyond the stated preflight, because item 2's "any reachable
pricing claim" line made me want to confirm a real target exists before trusting it's
not boilerplate:** `Pricing.jsx` and `PricingInfo.jsx` both have static,
translation-key-driven Northern Lights copy, completely independent of the
`FEATURES`/`isFeatureAvailable` registry (grepped the whole consumer set: only
`NorthernLightsCard.jsx` and `NorthernLightsThreeNight.jsx` call
`isFeatureAvailable("northernLights", ...)` — so loosening the registry gate cannot
accidentally leak into the pricing page's marketing copy through a shared code path).
But the copy itself is now a real risk: `pricingInfoAuroraFreeBody` currently reads
"An evening overview of tonight's chances" (IS: "Kvöldyfirlit yfir líkur kvöldsins"),
positioned directly against `pricingInfoAuroraProBody`'s fuller description under a
title that literally says "same assessment, more detail in Pro"
(`pricingInfoAuroraTitle`); `pricingFeatureAurora` ("Northern Lights: details and place
comparison") is listed as a Pro plan bullet; `pricingAuroraLearnMoreLink` says "Learn
more about Northern Lights on Pro". Once Free gets the same details/comparison as Pro,
this copy becomes a genuinely false "pay for more" claim, not a hypothetical one. This
confirms item 2's pricing-audit instruction is pointing at real, specific, already-located
strings — handing this exact key list to CC should save its own audit step some time,
without expanding scope: the prompt's "change only directly contradictory NL claims"
language already keeps this surgical, consistent with "no wider business-model
redesign."

**Event audit (item 5) spot-check**: confirmed `aurora_landing_viewed` exists
(`NorthernLightsLanding.jsx` line 115) and already derives its tier independently,
directly from `entitlements.isPro` rather than through the NL-access-conflated `isPro`
— so this emission point is already correctly separated and should just need the new
experiment field, not a tier-derivation fix. Confirmed `northern_lights_state_viewed`
(from the issue's event list) does **not** exist anywhere in `src` under that literal
name — closest real events are `northern_lights_unavailable_viewed` and
`northern_lights_stale_viewed`. This validates that item 5's "document which exist" is
doing real disambiguation work, not restating a list CC can just assume is accurate.

### Assessment

Every substantive risk I could independently locate by reading the actual access,
presentation and analytics code — the isPro/tier conflation, the hardcoded-pro
literals, the teaser-block removal shape, the pricing-copy contradiction, the
event-name mismatch — was already anticipated and correctly scoped by this prompt's
existing requirements. I found no gap large enough to send this back for a design
change, unlike #427's Intl-vs-table question. The "actual account tier vs. permission
to view" distinction in item 1 is the load-bearing design decision here, and it's
stated clearly, has a clean implementation path using primitives that already exist in
this codebase, and is reinforced by explicit, specific test and audit requirements
elsewhere in the prompt (no hardcoded pro on exposure, update obsolete Free-lock
assertions, document which issue-listed events actually exist). The launch-boundary
section is appropriately conservative (NOT DEPLOYED until a real deployment is
verified, no causal-success claims from raw growth) for a change this close to the
business model.

— Jonesy

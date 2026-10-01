# #431 — "northern_lights_free_v1" experiment note

Status: **NOT DEPLOYED**. Implementation complete locally; not committed, not pushed, not deployed. This note documents the local implementation only — launch timestamp, commit identity and GA4 configuration are all pending owner action.

## 1. What changed

Northern Lights access (`FEATURES.northernLights` in `src/config/features.js`) is opened to every tier via a narrow, named flag:

```js
northernLights: {
  tier: "pro",                 // unchanged — the real entitlement model, kept for rollback
  preview: true,
  label: "Northern Lights",
  freeDuringExperiment: true,  // new — bypasses the tier gate while the experiment runs
  experimentId: NL_FREE_EXPERIMENT_ID, // "northern_lights_free_v1"
}
```

`isFeatureAvailable()` checks `freeDuringExperiment` before falling through to the normal `requires_pro` denial, so `northernLights` is `available: true` for anonymous, Free, and Pro alike — no other feature's gate is touched.

In `NorthernLightsThreeNight.jsx` (the active three-night module, mounted on the homepage and `/en/northern-lights`), the presentation gate (`hasNLAccess`, from the feature gate above) is now kept strictly separate from the genuine account tier (`tier`, from `getUserTier(entitlements)`), which is the only thing ever recorded in analytics. Two previously hardcoded `tier: "pro"` literals (on `northern_lights_ranking_viewed` / `northern_lights_map_viewed`) are replaced with the real tier.

The former Free-only teaser/purchase UI is removed from the active journey: `LockedValue`/`FreeValueBlock` (in `AuroraNightOutlook.jsx`), `handleUpgrade` and the `onUpgrade` prop (in `NorthernLightsThreeNight.jsx` and both its mount sites), and the landing page's own lower conversion section plus the login/checkout machinery (`useLoginFlow`, `useCheckoutFlow`, `LoginModal`, `useToast`/`ToastHub`) that existed only to serve it (`NorthernLightsLanding.jsx`). No login or checkout is required to see full Northern Lights detail, ranking, or map, even before entitlement resolution completes.

Three directly contradictory "pay for more Northern Lights detail" copy claims were corrected (Pricing.jsx's Pro-plan bullet removed; `pricingAuroraLearnMoreLink`, `pricingInfoAuroraTitle`/`FreeBody`, `auroraInfoSameAssessment`, and `aboutAuroraProNote` reworded) — see `cc-report.md` §3 for the exact before/after text and reasoning.

The legacy, unmounted `NorthernLightsCard.jsx` (superseded by `NorthernLightsThreeNight.jsx` since #425) reads the same shared feature-registry entry, so it is also now effectively "always Pro" if it were ever mounted again — its own code was left untouched (out of this ticket's scope, per the preflight), only its tests were updated to that now-true reality.

Unchanged by this ticket: `/api/aurora-decision` request/response, the six-candidate set, score/ranking order, the three-night window, the 5-point comparison rule, freshness-expiry behavior, `selectAuroraDisplay`'s qualifying-band/canonical-order/map eligibility rules, and genuine Pro behavior (Pro sees exactly what it always saw).

## 2. Event inventory

### Events carrying the new `business_model_experiment: "northern_lights_free_v1"` field

| Event | Where | Pre-#431 population | Post-#431 population |
|---|---|---|---|
| `northern_lights_card_viewed` | `NorthernLightsThreeNight.jsx` | Free + Pro | Free + Pro (unchanged) |
| `northern_lights_unavailable_viewed` | same | Free + Pro | Free + Pro (unchanged) |
| `northern_lights_stale_viewed` | same | Free + Pro | Free + Pro (unchanged) |
| `northern_lights_details_opened` | same | **Pro only** (button didn't exist for Free) | Free + Pro |
| `northern_lights_ranking_viewed` | same | **Pro only**, `tier` hardcoded `"pro"` | Free + Pro, genuine `tier` |
| `northern_lights_map_viewed` | same | **Pro only**, `tier` hardcoded `"pro"` | Free + Pro, genuine `tier` |
| `northern_lights_night_selected` | same | Free + Pro (tier already genuine) | Free + Pro (unchanged population) |
| `northern_lights_best_night_viewed` | same | Free + Pro (tier already genuine) | Free + Pro (unchanged population) |
| `aurora_landing_viewed` | `NorthernLightsLanding.jsx` | Free + Pro (tier already genuine, independent of the NL access gate) | Free + Pro (unchanged population) |
| `northern_lights_location_selected` **(v2, new)** | same | Did not exist — map marker click was a no-op | Free + Pro, fires on an actual aurora-map marker click only |

### Events removed from the active journey (will stop appearing in new data)

| Event | Why |
|---|---|
| `northern_lights_upgrade_clicked` | The upgrade CTA it was attached to no longer exists in `NorthernLightsThreeNight.jsx`. |
| `northern_lights_multi_day_upgrade_clicked` | Same — was unique to the removed `handleUpgrade`. |
| `northern_lights_landing_cta_clicked` | The landing page's lower conversion section (its own CTA) is removed; the module's own card-placement firing of this event is also gone with `handleUpgrade`. |

These are **not** repurposed or merged into any other event — they simply stop firing, naturally, because the UI that fired them no longer exists.

### Issue-listed event not found in source (confirmed, not merely restated)

`northern_lights_state_viewed` does not exist anywhere in `src` under that literal name, before or after this ticket. The two real, distinct events covering that territory are `northern_lights_unavailable_viewed` and `northern_lights_stale_viewed` — do not treat the issue's baseline "state" row as directly attributable to either without checking which the baseline source actually counted.

### Unrelated instrumentation, confirmed unchanged

`pricing_page_viewed`, `subscription_cta_clicked`, `checkout_started`, `checkout_completed` and all other features' own `upgrade_source`/checkout attribution remain fully intact for every other Pro feature (Route Planner, wind/shelter, campsite comparison, full leaderboard) — only Northern Lights' own purchase path was touched.

### Measurement gap, explicitly noted (not newly introduced)

No Northern Lights share UI exists in the active journey; no share-action tracking was added, per the prompt's explicit instruction not to introduce a new share feature during this paywall-only baseline.

## 3. Payload changes, precisely

Every event in the first table above gains exactly one new field: `business_model_experiment: "northern_lights_free_v1"`. No existing field is renamed, removed, or reinterpreted. `northern_lights_ranking_viewed`/`northern_lights_map_viewed` additionally change their `tier` value from the previous hardcoded literal `"pro"` to the genuine account tier (`"free"` or `"pro"`, via `getUserTier(entitlements)`).

## 3b. v2 addendum — interaction-tier semantics and new location event

**`"unknown"` interaction tier while `loadingMe` is true.** `northern_lights_night_selected`, `northern_lights_details_opened`, the recommended-night CTA's pair of calls, and the new `northern_lights_location_selected` (below) use a distinct `interactionTier = loadingMe ? "unknown" : tier` value, not the genuine account `tier` used by the five exposure events (`card_viewed`/`unavailable_viewed`/`stale_viewed`/`ranking_viewed`/`map_viewed`/`best_night_viewed`, all already `loadingMe`-gated and unchanged by v2). Before this fix, a user who interacted before `/api/me` resolved was mislabeled `"free"` regardless of their real tier (the tier getter's pre-resolution default). `"unknown"` is a real, distinct value that will appear in this field's data — segment it out, or treat it as "tier not yet known at interaction time," rather than folding it into either `"free"` or `"pro"` counts. No event is re-fired or relabeled retroactively when the real tier later resolves; only the *next* interaction, if any, carries the genuine tier.

**`northern_lights_location_selected` (new event, no previous baseline).** Fires when a user clicks an actual marker on the aurora map (`NorthernLightsThreeNight.jsx` → `AuroraNightOutlook.jsx` → `NorthernLightsMap.jsx` → `MapView.jsx`'s real, pre-existing marker click handler) — never on map mount, render, or popup-open. Payload: `location_id`, `selected_date`, `days_ahead`, `source` (mount surface), `user_tier` (the `interactionTier` above), `business_model_experiment`. This event did not exist before v2 — the map's `onSelect` was previously wired to a no-op — so there is **no prior count to compare against**; treat all data from this event as a new baseline starting from its actual deployment, not as a continuation of any existing series.

## 4. Before/after comparability limitations

- **`northern_lights_details_opened` / `_ranking_viewed` / `_map_viewed`**: pre-launch counts (issue baseline: ranking 54/7, details 39/8) are **Pro-only by construction** — the UI that fires them literally did not exist for Free. Post-launch counts will include Free exposure too. A raw count increase here is expected and does **not** by itself indicate increased Pro engagement — it must be segmented by the new genuine `tier` field to recover a Pro-only, apples-to-apples comparison against the baseline.
- **`northern_lights_landing_cta_clicked` / `_upgrade_clicked` / `_multi_day_upgrade_clicked`**: will structurally drop to zero (baseline: landing CTA 43/38). This is an intentional, expected discontinuity from removing the CTA, not a measurement regression — do not alarm on it.
- **`northern_lights_card_viewed` / `_night_selected` / `_best_night_viewed` / `aurora_landing_viewed`**: population and eligibility are unchanged by this ticket (Free could already trigger all of these before #431); these remain directly comparable to baseline, field-for-field, with the one addition of `business_model_experiment`.
- **`northern_lights_state_viewed`** (issue baseline row, 56/34): does not correspond to any single real event name — see §2. Do not map this baseline row onto `unavailable_viewed` or `stale_viewed` without first checking which the baseline's own source actually aggregated.
- GA4's own existing page/session/user metrics (traffic, active/returning users, engaged sessions, views per user) are unaffected by any of the above — they come from GA4's standard collection, not from these custom events, and remain valid for before/after comparison on their own terms.

## 5. Rollback scope

**Partial, fast rollback** (re-gate access only): set `freeDuringExperiment: false` in `src/config/features.js` (one line). `isFeatureAvailable("northernLights", ...)` immediately reverts to denying Free/anonymous access; `hasNLAccess` in `NorthernLightsThreeNight.jsx` automatically becomes `false` for Free again, with no other code change required.

**Important caveat, stated plainly**: this partial rollback does **not** restore the pre-#431 Free experience. Because `LockedValue`, `FreeValueBlock`, `handleUpgrade`, the `onUpgrade` prop threading, and the landing page's conversion section were **deleted** (not merely hidden) as part of this ticket, flipping the flag alone leaves Free users seeing the generic visual-state copy with **no call-to-action at all** — a regression from the original pre-#431 Free experience, which had a working upgrade CTA. A full behavioral rollback to the exact pre-#431 state requires reverting this ticket's commit(s) in full, not just the one flag.

## 6. Baseline (supplied in issue #431, not independently fetched)

Window 2026-09-01 to 2026-10-01. Landing: 442 views / 191 active users / 2.31 views per active user / 1407 events.

| Event | Count | Users |
|---|---|---|
| `northern_lights_card_viewed` | 615 | 265 |
| `aurora_landing_viewed` | 197 | 158 |
| `northern_lights_state_viewed`* | 56 | 34 |
| `northern_lights_ranking_viewed` | 54 | 7 |
| `northern_lights_landing_cta_clicked` | 43 | 38 |
| `northern_lights_details_opened` | 39 | 8 |
| `northern_lights_night_selected` | 39 | 5 |
| `northern_lights_best_night_viewed` | 29 | 13 |

\* See §2/§4 — does not correspond to a single real event name; reference only, not independently reproduced.

This baseline is referenced as supplied by the issue; this report does not claim to have independently queried GA4 for it.

## 7. Launch checklist (owner-controlled; not performed in this execution)

- [ ] Exact UTC launch datetime: **PENDING** (never substitute coding date or commit time)
- [ ] Deployed commit SHA: **PENDING**
- [ ] Deployment identity (Vercel deployment URL/ID): **PENDING**
- [ ] First measurement window: at least 3, preferably 7, days after the actual launch datetime above
- [ ] GA4 custom dimension registration for `business_model_experiment` (event-scoped): **PENDING** — code emission alone does not register a GA4 custom dimension/report field; this requires GA4 admin configuration, out of scope for this execution
- [ ] No affiliate CTA, Facebook campaign, or other business-model change bundled with this launch (confirmed out of scope by this ticket's own boundary)

## 8. Evaluation guidance

Evaluate traffic + engagement + feature usage against the known lost-subscription impact of opening this feature — not raw growth alone, and not including any affiliate revenue (there is none in this change). Do not claim causal success from a raw increase in `northern_lights_card_viewed` or similar exposure counts without accounting for the population-expansion effects noted in §4. Local implementation completion (this note, this ticket) is distinct from live experiment acceptance — that remains the owner's call after real deployment and a real measurement window.

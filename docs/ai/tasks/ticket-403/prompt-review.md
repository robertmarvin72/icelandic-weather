# Ticket 403 — Prompt Review

## Ripley — Initial prompt (v1)

### Role and objective

You are Claude Code, the execution layer for ticket #403: **“Northern Lights: Revise landing page til að selja raunverulegt Pro-verðmæti.”**

Improve the English `/en/northern-lights` landing page so a Free or logged-out visitor understands the real value of Northern Lights Pro immediately after seeing the canonical free verdict. The page must sell the existing product truthfully: Pro reveals where to go, ranked alternatives, why they rank, and the map. Do not invent timing guidance, new forecast intelligence, or new entitlement behavior.

Before editing, read `AGENTS.md`, `CLAUDE.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, this approved prompt, and the current implementations/tests for:

- `src/pages/NorthernLightsLanding.jsx`
- `src/components/NorthernLightsCard.jsx`
- landing and Northern Lights translations/metadata
- Northern Lights analytics and checkout-source handling
- the homepage usage of `NorthernLightsCard`

Treat the code after ticket #399 as canonical. Preserve unrelated owner changes. Do not commit or push.

### Required implementation

#### 1. Rewrite the English landing-page hierarchy

- Change the H1 to exactly: `Find where to see the Northern Lights in Iceland tonight`.
- Use this supporting copy: `We compare aurora activity and cloud conditions across locations in Iceland to help you decide where to go.`
- Keep the real Northern Lights card as the preview directly below the hero.
- Put the conversion/value section below that preview and move “How it works” below the conversion section.
- Keep the existing disclaimer visible and truthful.
- Update landing-owned SEO metadata to match the revised value proposition without claiming a best viewing time, viewing window, peak time, or similar timing intelligence.

Do not use “best viewing time” or “viewing window” as marketing promises. The shared card's existing technical darkness-reference disclosure is not a new Pro promise and must not be removed or changed across surfaces unless the pre-edit audit proves the ticket cannot be completed truthfully without doing so; if so, STOP.

#### 2. Show the concrete Pro value without leaking Pro data

For Free/logged-out users, add a landing-specific locked-value treatment immediately after a qualifying canonical verdict inside the card. It must communicate these four existing capabilities in concise, benefit-led English:

1. the best location tonight;
2. recommended alternatives;
3. why locations rank as they do, based on aurora activity and cloud conditions;
4. the location map.

The locked treatment must be generic. It must not render or expose in the DOM, accessible names, attributes, or serialized client state any Pro-only location name, ranking, location-specific condition, reason, coordinate, or map marker.

Prefer an explicit landing-only presentation prop/variant on the canonical `NorthernLightsCard`, with the current default behavior unchanged. Do not duplicate forecast fetching, classification, scoring, verdict derivation, or result state in the page.

- For a qualifying positive result, the copy may connect the verdict to the offer (for example, “Tonight looks promising”) only by using an already-existing canonical state. Do not introduce a new score, band, or inferred state.
- Do not place a misleading result-level “where to go tonight” offer in all-poor, no-darkness, unavailable, transport-error, contract-error, loading, or other non-qualifying states.
- Pro users must continue to see the existing full result. They must not see locked previews or purchase CTAs.
- The homepage and every non-landing use of `NorthernLightsCard` must remain unchanged by default, including its existing CTA copy and behavior.

#### 3. Add the landing conversion section and outcome-led CTAs

Below the card, add a short Free-only conversion section headed `Know where to go tonight`. Restate the same four Pro capabilities in compact, mobile-readable form.

Use the primary CTA copy `Show me where to go tonight` and the supporting note `Included with Chase the Weather Pro` for both landing-specific purchase entry points where appropriate. Do not replace shared/homepage copy globally and do not use a generic “Upgrade to Pro” as the primary landing CTA.

The lower section describes product capability, not tonight's result; it must not imply that a good viewing outcome or better location has already been found. Hide its purchase CTA/value lock for Pro users. Reuse existing design primitives and icon dependencies; add no library.

All new visible strings must use the project's translation structure rather than being hardcoded in JSX. Keep the route explicitly English (`useT("en")` / `lang="en"`) and follow the existing bilingual-key convention where required by the translation file.

#### 4. Preserve checkout semantics and add precise CTA analytics

Ticket #399 established `aurora_landing_viewed` as the canonical landing-view event. Preserve its name, payload, entitlement-resolved timing, and exact-once behavior. Do **not** add or rename it to `northern_lights_landing_viewed`.

Add exactly one new event for landing-specific CTA interaction:

`northern_lights_landing_cta_clicked`

It must fire once per deliberate CTA click, before forwarding to the existing checkout flow, with lightweight non-PII metadata:

- `lang: "en"`
- resolved `tier`
- a stable, low-cardinality `placement` (`card` or `value_section`)
- a stable `source`

Preserve the card's existing `northern_lights_upgrade_clicked` event and its established checkout source (`northern_lights_card`). It is acceptable—and intentional—for the landing card click to emit both events because they represent separate semantic layers, but the new event itself must fire only once. Use `northern_lights_card` for the card source and a clear stable source such as `northern_lights_landing_value_section` for the lower CTA. Forward the same source to the existing `startCheckout(source)` path; do not alter entitlement, plan, price, or checkout attribution semantics.

Do not add UTM values, URLs, free-form copy, forecast data, or PII to analytics payloads.

### Acceptance criteria

- `/en/northern-lights` presents the exact new H1 and supporting sentence, followed by the live preview, the conversion section, then “How it works” and the disclaimer.
- Free qualifying results show the canonical verdict plus generic locked Pro value and the outcome-led CTA/note, with no Pro data leakage.
- Pro results retain the current full location, reasoning, list, and map experience and contain no purchase lock/CTA.
- Honest empty/error/all-poor/no-darkness behavior remains intact and does not acquire false result claims.
- The lower Free conversion section lists the four real Pro benefits and uses the approved outcome-led CTA without claiming a favorable result.
- Landing-owned copy and metadata contain no claim that the product supplies a best viewing time/window.
- Homepage and other card consumers remain visually and behaviorally unchanged.
- `aurora_landing_viewed` remains the sole canonical landing-view event and still fires once after entitlement resolution.
- Each landing CTA click emits one `northern_lights_landing_cta_clicked` with correct `lang`, `tier`, `placement`, and `source`, then starts checkout with that source.
- Existing `northern_lights_upgrade_clicked` behavior remains intact for the card CTA.
- New UI is accessible, keyboard-operable, responsive, and readable in light and dark mode.

### Required tests

Add or update focused tests that prove at least:

1. exact hero copy, section order, revised metadata, and absence of forbidden timing promises in landing-owned marketing/head content;
2. a Free qualifying result renders the locked four-part value treatment, CTA, and Pro inclusion note;
3. actual fixture location names, rankings, reasons, coordinates, and map content are absent from the Free locked output;
4. a Pro result retains the canonical detailed experience and omits all landing purchase locks/CTAs;
5. all-poor, no-darkness, unavailable/error, and loading states do not receive misleading result-level conversion claims;
6. the lower conversion section is Free-only and uses the four truthful value points;
7. the card's default/homepage rendering and existing CTA remain unchanged when the landing variant is not supplied;
8. `aurora_landing_viewed` is unchanged and fires exactly once after entitlement resolution, including rerenders;
9. each CTA placement emits exactly one `northern_lights_landing_cta_clicked` with the expected payload and forwards the matching source to checkout;
10. the existing card CTA still emits `northern_lights_upgrade_clicked` without causing a duplicate of the new landing event.

Use the hook's actual parsed response contract in test stubs. Add targeted coverage for every new branch; a green pre-existing suite alone is insufficient.

### Validation

Run, in this order:

1. the focused landing/card/analytics tests you changed or added;
2. the relevant existing Northern Lights, routing, checkout-source, and analytics tests;
3. `npm test -- --run`;
4. `npm run lint`;
5. `npm run build`;
6. inspect the final diff for scope, hardcoded copy, Pro-data leakage, duplicate analytics, and unrelated changes;
7. visually verify `/en/northern-lights` at a narrow mobile viewport (approximately 390 px) in light and dark mode for hierarchy, clipping, focus states, locks/icons, and CTA placement.

Record exact commands, results, and any environment limitation in `docs/ai/tasks/ticket-403/cc-report.md`. Update `docs/ai/CURRENT.md` through the required CC stages.

### STOP conditions

STOP and report rather than expanding scope if implementation would require any of the following:

- changing scoring, classification, forecast inputs, candidate selection, or canonical verdict semantics;
- changing Free/Pro entitlements, payment/price/plan behavior, or backend/API contracts;
- duplicating the card's fetch or result derivation in the landing page;
- exposing any Pro-only location/result data to Free users, including hidden or accessibility-only DOM;
- globally changing the homepage/shared card CTA or presentation to satisfy this landing-only ticket;
- renaming/replacing `aurora_landing_viewed` or introducing a second landing-view event;
- removing or redefining the existing technical darkness-reference disclosure across surfaces;
- adding a new dependency, backend route, or analytics provider;
- overwriting ambiguous owner changes or requiring work materially beyond ticket #403.

If a STOP condition is reached, make no speculative implementation around it. Document the evidence and the smallest decision needed from Róbert.

---

## Jonesy review — Round 1

**Verdict: APPROVED**

## Method

This is a substantially larger change than tickets 399–401, so I traced every load-bearing architectural claim against the live component rather than the prompt's narrative, focusing on the two things most likely to go wrong in a "sell Pro value without leaking Pro data" ticket: whether the required changes can actually be made without duplicating the card's fetch/classification logic in the page, and whether the free-tier data-safety guarantee the prompt demands is something the current code already structurally supports or something that has to be built from scratch (higher risk).

- `src/components/NorthernLightsCard.jsx` (full read) — data flow, all render branches, existing analytics, existing Free/Pro CTA code.
- `src/pages/NorthernLightsLanding.jsx` (full read, current post-ticket-399 state) — page structure, `onUpgrade` wiring, entitlement computation.
- `src/i18n/translations.landing.js` (`auroraLanding*` keys) and `src/i18n/translations.northernLights.js` (`nlFreeHint`/`nlUpgradeCta`) — current copy and naming convention.

## Confirmed: the architecture genuinely supports this without duplication

Three things the prompt asserts are load-bearing, and all three check out against source:

1. **"Prefer an explicit landing-only presentation prop/variant on the canonical `NorthernLightsCard`"** — realistic. The Free-tier CTA the ticket wants to change is a single, already-isolated `{!isPro && (...)}` block (lines 367–378) inside `AuroraResult`, itself only reached when `display.hasQualifyingLocations` is true (line 324's early return to `AllPoorResult` otherwise). A variant prop can extend just this one block without touching `isPro` rendering, `AllPoorResult`, or any of the non-result states (loading/transport-error/contract-defect/no-darkness/unavailable) — matching the requirement that those states never receive a CTA. None of those states currently render a CTA (confirmed by reading each branch, lines 245–277), so there's nothing to accidentally suppress.

2. **No Pro-data leak risk in the new locked-value block, structurally.** Today, the Free branch (lines 367–378) receives no location-specific data at all — `best.name`, `reasons`, coordinates, ranking, and the map are all inside a separate `{isPro && (...)}` block (lines 380–438) that the Free branch has no access to. The four benefit statements the ticket wants (best location, alternatives, why they rank, the map) are meant to be generic copy, not derived from `best`/`display.qualifyingLocations` — so as long as the new block is built the same way the existing Free block is (no per-location props passed in), the "no Pro-only location name/ranking/reason/coordinate/map marker" requirement holds by construction, not by discipline.

3. **The lower Free-only conversion section (§3) doesn't need the card's result state at all** — confirmed by rereading the prompt itself: it's explicitly *not* result-gated ("describes product capability, not tonight's result... must not imply a good outcome has already been found"), so the page only needs `entitlements.isPro` (already computed in `NorthernLightsLanding.jsx`, line 74–77) to decide whether to show it. This is what lets the prompt honestly claim no duplication of "forecast fetching, classification, scoring, verdict derivation, or result state in the page" — the page literally doesn't need any of that for this section, and the prompt's own scoping makes sure of it.

## Confirmed: existing CTA/analytics contracts are accurately described

- `northern_lights_upgrade_clicked` with `source: "northern_lights_card"` is real (`handleUpgrade`, lines 208–211) and untouched by anything this ticket requires.
- The homepage's existing Free CTA copy (`nlUpgradeCta`: *"See where and why (Pro)"*, `nlFreeHint`: *"Conditions may be worth checking somewhere in Iceland tonight."*) is a different, separately-keyed string from the new landing CTA (*"Show me where to go tonight"*) — so "do not replace shared/homepage copy globally" is achievable via new translation keys, not by touching `nlUpgradeCta`/`nlFreeHint`.
- `NorthernLightsLanding.jsx` currently passes `onUpgrade={startCheckout}` straight through (line 148) — to satisfy §4 ("fire `northern_lights_landing_cta_clicked` once... before forwarding to the existing checkout flow" for the card-placement click), this pass-through will need to become a wrapper (`(source) => { trackEvent(...); startCheckout(source); }`) rather than a direct reference. The prompt doesn't spell this out mechanically, but it's the only way to satisfy §4 without adding "landing" awareness to the shared card component itself (which would risk the homepage-must-stay-unchanged requirement) — flagging this so I can hold the CC report to it specifically when this comes back for result review, since a naive implementation might be tempted to thread a new `onCtaClick` prop into the card instead, which would work too but isn't necessary and adds surface area the STOP conditions would rather avoid.
- Existing landing metadata (`auroraLandingMetaTitle`/`HeroSubtitle`/etc.) doesn't currently contain "best time"/"viewing window" language, so the new constraint isn't fixing an existing violation — it's a forward-looking guard as the copy changes for the new value proposition, which is consistent with §1's instruction to update this copy anyway.

## No blocking gaps found

I didn't find a contradiction, an unverifiable claim, or a place where the prompt asks CC to do something the current architecture can't actually support cleanly. The scope boundaries and STOP conditions are specific enough (Pro-data leakage via "hidden or accessibility-only DOM" is explicitly called out, not just visible rendering) that I'm comfortable this can be implemented and verified without a second round purely on architecture grounds — the usual review after CC's implementation will focus on whether the actual DOM output for a Free qualifying result stays leak-free and whether the new analytics event fires with the exact payload shape specified.

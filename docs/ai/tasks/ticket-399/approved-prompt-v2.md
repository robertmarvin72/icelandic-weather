# Approved Corrective Implementation Prompt — Ticket 399 (v2)

## Context and verdict

Ticket 399 v1 implementation is functionally sound but is **not complete**. Jonesy and Ripley confirmed a visible header collision on `/en/northern-lights` and therefore return `REVISE`.

The cause is static and reproducible: `Brand.jsx`'s `size="slim"` variant renders a 40px logo followed by a tagline with Tailwind `-mt-7` (negative 28px top margin). The undefined `header-title`/`header-title-brand` classes do not compensate for it. This pulls the tagline over the logo. It is not an image-load or screenshot-timing artifact.

Execute only this narrow correction on top of the existing v1 implementation.

## Required correction

1. In `src/pages/NorthernLightsLanding.jsx`, keep using the shared `Brand` component but suppress its broken slim tagline on this route with the existing `hideTagline` prop. The header should contain the English logo with no overlapping tagline. Do not modify `Brand.jsx` or `CampaignLandingPage.jsx`; the shared pre-existing slim-tagline defect is outside this ticket's corrective scope.
2. Add a focused regression assertion in the landing-page test suite proving the route requests the no-tagline Brand composition and does not render the tagline in the header. Prefer an observable render assertion; a tightly scoped prop assertion at the mocked leaf boundary is acceptable if that test file already treats `Brand` as a leaf.
3. Correct `docs/ai/tasks/ticket-399/cc-report.md` §7. Remove the claim that the artifact was caused by the throwaway script/image-load timing. Record the confirmed negative-margin cause, state that it predates Ticket 399 and also affects the existing slim consumer, and document the route-local `hideTagline` correction. Do not rewrite historical test results; append or clearly label the corrective v2 validation results.
4. Preserve every other v1 implementation choice and behavior: forced `useT("en")`, route, page order/copy, canonical `NorthernLightsCard`, entitlement/login/checkout wiring, source forwarding, exact-once `aurora_landing_viewed`, metadata, and existing analytics semantics.

## Scope boundaries

- Do not edit `src/components/Brand.jsx` or repair other consumers in this ticket.
- Do not redesign the header or add replacement tagline text/CSS.
- Do not touch Aurora logic, shared Northern Lights card behavior, authentication, entitlements, checkout/payment plumbing, other routes, or unrelated code.
- Preserve owner-controlled changes.

## Acceptance criteria

- The `/en/northern-lights` header renders the correct English brand logo without a tagline/logo collision in light and dark themes.
- The page does not render the Brand tagline in its header.
- Existing v1 page functionality and tests remain green.
- The CC report no longer attributes the defect to screenshot timing and accurately records cause, scope, correction, and validation.
- No shared Brand or campaign-page behavior changes.

## Validation

Run at minimum:

1. All three Ticket 399 landing-page test files.
2. `src/AppRoutes.test.jsx`.
3. `src/components/NorthernLightsCard.test.jsx` and `src/hooks/useCheckoutFlow.analytics.test.js`.
4. Full Vitest suite.
5. `npm run lint`.
6. `npm run build`.
7. `git diff --check`.

Inspect the final diff and explicitly confirm that `Brand.jsx`, `CampaignLandingPage.jsx`, Aurora logic, and payment/auth plumbing remain untouched. If browser validation is repeated, wait for the logo image to complete loading and inspect both light and dark themes; report observed results accurately.

## STOP conditions

Stop and report if the collision cannot be removed route-locally with the existing `hideTagline` contract, if the correction requires a shared `Brand.jsx` change, or if any v1 behavior must be altered to complete it.

Do not commit and do not push.

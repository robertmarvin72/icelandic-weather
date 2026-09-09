# Approved Corrective Implementation Prompt — Ticket 399 (v3)

## Context and verdict

Ticket 399 Revision 2 correctly removed the logo/tagline collision, but the resulting `/en/northern-lights` header still uses `Brand size="slim"`, rendering the English logo at only 40px high. Jonesy and Ripley return **REVISE** because the established product header uses the full Brand size (`h-20 md:h-32`, 80px/128px), and the 40px campaign variant is materially smaller and poorly legible.

Execute only this narrow correction on top of the existing implementation.

## Required correction

1. In `src/pages/NorthernLightsLanding.jsx`, change the header Brand composition from `size="slim"` to `size="full"` and retain `hideTagline`:

```jsx
<Brand t={t} size="full" lang={lang} hideTagline />
```

This deliberately combines the established readable logo sizing with the already-approved no-tagline treatment. Do not restore the tagline and do not rely on the invalid non-slim `-mt-` class.

2. Update the focused landing-page regression coverage so it proves all three observable composition requirements:
   - the English `Chase the Weather` logo remains present;
   - the tagline remains absent;
   - the rendered logo uses the full responsive size contract (`h-20 md:h-32`), not `h-10`.

Use the real `Brand` rendering where the current test already does so. The test must fail if the route is changed back to `size="slim"` or if `hideTagline` is removed.

3. Append a clearly labeled Revision 3 section to `docs/ai/tasks/ticket-399/cc-report.md`. Record the 40px-versus-80/128px finding, the exact route-local change, test evidence, and new validation results. Preserve the corrected historical explanation from Revision 2.

4. Preserve every other v1/v2 behavior: forced `useT("en")`, routing, page order/copy, shared `NorthernLightsCard`, real entitlement/login/checkout wiring, source forwarding, exact-once `aurora_landing_viewed`, metadata, and no-tagline collision fix.

## Scope boundaries

- Do not modify `Brand.jsx`, `CampaignLandingPage.jsx`, the homepage header, or any other Brand consumer.
- Do not add custom logo CSS, fixed pixel overrides, new Brand variants, or replacement tagline markup.
- Do not alter Aurora logic/card behavior, analytics semantics, authentication, entitlements, checkout/payment plumbing, other routes, or unrelated code.
- Preserve owner-controlled changes.

## Acceptance criteria

- `/en/northern-lights` renders the correct English logo at the established `h-20 md:h-32` full size.
- No tagline is rendered and the original collision cannot recur.
- The result is verified in both light and dark themes at mobile and desktop widths.
- Focused regression coverage fails for either `size="slim"` or a missing `hideTagline`.
- All existing Ticket 399 behavior and tests remain green.
- `Brand.jsx`, `CampaignLandingPage.jsx`, and unrelated systems remain untouched.

## Validation

Run at minimum:

1. All three Ticket 399 landing-page test files.
2. `src/AppRoutes.test.jsx`.
3. `src/components/NorthernLightsCard.test.jsx` and `src/hooks/useCheckoutFlow.analytics.test.js`.
4. Full Vitest suite.
5. `npm run lint`.
6. `npm run build`.
7. `git diff --check`.

Perform a real-browser visual check after both logo variants have loaded, at mobile and desktop widths in light and dark themes. Report each of the four combinations accurately; do not dismiss or infer an unobserved state from unit tests.

## STOP conditions

Stop and report if readable established sizing cannot be obtained route-locally through `size="full"` plus `hideTagline`, if any shared Brand code/consumer must change, or if another v1/v2 behavior must be altered.

Do not commit and do not push.

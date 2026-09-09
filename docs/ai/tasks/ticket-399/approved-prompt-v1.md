# Approved Implementation Prompt — Ticket 399 (v1)

## Task

Implement GitHub issue #399, **“Landing page fyrir norðurljósa síðu á ensku”**, as a permanent English product-entry page at `/en/northern-lights`.

The page must answer the visitor's question quickly, reuse the existing live Northern Lights product surface, support the existing Free/Pro journey, and provide a clean analytics entry point for organic and paid traffic. Do not turn it into a long campaign or blog page.

## Confirmed repository constraints

- Register routes in `src/AppRoutes.jsx`; preserve the real-router coverage in `src/AppRoutes.test.jsx`.
- `src/components/NorthernLightsCard.jsx` is the canonical Northern Lights UI and owns its request, classification, Free/Pro presentation, details/ranking/map exposure, upgrade click, and analytics. Reuse it directly; do not fork it.
- The card requires `t`, `lang`, `entitlements`, `onUpgrade`, and `theme`.
- `usePageRouteProps().t` closes over the saved language. Overriding only `lang` is unsafe for this English route.
- Existing entitlement/login/checkout behavior lives in `useMe`, `useLoginFlow`, `useCheckoutFlow`, `useToast`, and `LoginModal`. Reuse those contracts; do not invent another payment or authentication flow.
- Global `AnalyticsTracker` already sends pageviews. Add the requested semantic event without duplicating the pageview.
- Follow the existing `react-helmet-async` metadata convention. There is no sitemap system; do not create one here.
- Preserve owner-controlled working-tree changes and isolate Ticket 399's diff.

## Requirements

### Route and forced-English contract

- Add public route `/en/northern-lights` rendering a dedicated page component. Query parameters, including UTMs, must not affect matching or be removed during the visit.
- Construct the English translation function independently at the route boundary with the real hook:

```jsx
const t = useT("en");
```

- Pass that exact English `t` and `lang="en"` consistently to the page and `NorthernLightsCard`.
- Do **not** spread `usePageRouteProps()` and override only `lang`; its `t` still uses the saved language. Do not copy the current `/en/blog` language-override pattern.
- Theme may come from `usePageRouteProps()` or the existing theme storage hook. Visiting this route must not overwrite the user's saved language.
- All visible states of the reused card must therefore remain English even when `localStorage.lang` is `is`: title, loading, pills, headline/body, stale/partial notices, details, reasons, list/map labels, unavailable states, and upgrade copy. Do not add fallback wrappers or duplicate English strings inside the card.

### Decision-first page

Keep the page compact, mobile-first, and ordered as follows:

1. Minimal branded header consistent with the product.
2. Short hero:
   - H1 intent: `Find the best Northern Lights conditions in Iceland tonight`
   - Supporting intent: `We compare cloud cover, aurora activity and darkness across locations to help you decide where to go.`
3. The real `NorthernLightsCard` immediately below the intro and above explanatory content.
4. Concise `How it works`: current viewing conditions are compared across Iceland using aurora activity, cloud conditions, and darkness.
5. Visible concise disclaimer: Northern Lights are a natural phenomenon and no forecast guarantees visibility.
6. Minimal footer/navigation consistent with public pages.

Do not add a long SEO article, blog content, screenshots, testimonials, dashboard sections, or unrelated campsite-weather modules above the tool. Put all user-facing page copy in the i18n translation structure, with Icelandic companion values only if repository translation-shape conventions require them; the route remains English-only.

### Canonical card behavior

- Render `NorthernLightsCard` directly with its existing hook/API data source unchanged.
- Do not duplicate, precompute, or reinterpret Aurora scoring, ranking, freshness, candidates, classification, map visibility, or seasonality.
- Preserve all result states, presentation rules, Free/Pro gating, analytics guards, and details persistence.
- Do not alter the shared card for page styling unless a tiny backwards-compatible composition prop is demonstrably necessary. Stop if that would change homepage behavior or analytics semantics.

### Entitlement, login, and upgrade flow

- Supply truthful current entitlement state through existing hooks/contracts; never assume all visitors are Free or Pro.
- Connect the card's `onUpgrade(source)` to the established login/checkout journey and preserve the source argument at the page callback boundary and through existing shared behavior.
- Reuse the existing modal, toast, and checkout infrastructure where needed. Do not create a login form or call Paddle/checkout APIs directly.
- Do not change feature definitions, pricing, entitlement computation, authentication behavior, checkout endpoints, or Paddle plumbing.
- Stop if the standalone page requires a broad app-wide auth/checkout refactor or if preserving attribution requires changing shared semantics. Report the dependency and smallest follow-up instead.

### Analytics

- Fire `aurora_landing_viewed` once per meaningful page mount/exposure, guarded against ordinary rerenders including theme, entitlement, and translation rerenders.
- Include lightweight non-PII metadata: `lang: "en"` and canonical `tier` (`free`/`pro`) only when entitlement resolution makes it truthful. Never send email, user ID, raw URL/query, or free-form UTM values.
- Audit `useMe`'s real loading contract before event timing. Do not label unresolved entitlement as Free; wait for truthful resolution or omit tier in a documented and tested way consistent with existing conventions.
- Keep the global route pageview and all existing Northern Lights event names/payload semantics unchanged. Add no teaser event.
- The landing event must not refire merely because the card resolves, details open, theme changes, or entitlement state rerenders.

Intended funnel: `aurora_landing_viewed` → existing card/details/ranking/map/upgrade events → pricing → checkout.

### Metadata

Use `Helmet` and existing conventions to provide:

- concise English title targeting Northern Lights conditions in Iceland tonight;
- truthful English meta description;
- query-free canonical URL for `/en/northern-lights`;
- matching Open Graph title, description, and URL;
- matching Twitter card, title, and description;
- English document-language signal if safely supported by current Helmet behavior.

Use the established production-origin convention. Make no guarantees or unsupported claims about real-time precision or coverage.

## Scope

In scope: one page and focused tests, route registration/tests, focused i18n additions, metadata, one landing-view event, and minimal existing-contract wiring for entitlements/login/upgrade.

Out of scope: Aurora API/cron/scoring/ranking/cache/freshness/candidates/data changes; card redesign or homepage placement changes; new backend/libraries; checkout/payment/auth behavior changes; campaign execution or hardcoded UTMs; sitemap framework; blog article; Icelandic route; broad navigation redesign; unrelated cleanup.

## Acceptance criteria

- `/en/northern-lights` and query-string variants resolve correctly; unknown routes retain existing behavior.
- The entire page and real shared card render English when saved language is Icelandic.
- Hero, live card, concise explanation, and disclaimer appear in the required order.
- Free/Pro access boundaries match the homepage.
- Upgrade uses existing behavior and forwards the card's source unchanged.
- `aurora_landing_viewed` is truthful, non-PII, and exact-once across ordinary rerenders.
- Existing card events are neither duplicated nor renamed.
- Metadata is accurate, English, and query-free.
- No Aurora decision logic, backend, payment plumbing, or unrelated behavior changes.

## Required tests

- Real `AppRoutes` matching for `/en/northern-lights`, including query string, while preserving NotFound behavior.
- Page structure/copy/order and disclaimer.
- With persisted language `is`, render far enough through the **real card translation path** to assert unmistakable English `t()` output such as `Northern Lights tonight` (distinct from `Norðurljós í kvöld`). A hero-only assertion or `lang`-prop-only mock is insufficient.
- Prove the exact independently built English `t`, `lang="en"`, real entitlement shape, theme, and upgrade callback reach `NorthernLightsCard`.
- Prove the card's supplied upgrade source reaches the existing checkout callback boundary unchanged.
- Prove `aurora_landing_viewed` payload/timing and no duplication on relevant rerenders.
- Verify title, description, canonical, OG, and Twitter metadata without query parameters.
- Confirm the homepage still uses the same shared card path if existing tests do not already prove this adequately.

Mock only genuine external or leaf boundaries. Do not recreate route tables, classifier output, or entitlement rules in tests.

## Validation

Run:

1. New page test files.
2. `src/AppRoutes.test.jsx`.
3. `src/components/NorthernLightsCard.test.jsx`.
4. Relevant checkout/login analytics tests if shared wiring is touched.
5. Full Vitest suite.
6. `npm run lint`.
7. `npm run build`.
8. `git diff --check`.

Report exact files changed; forced-English construction; entitlement/upgrade reuse; landing-event payload/dedupe/timing; metadata/canonical behavior; and confirmation that Aurora logic, other routes, payment plumbing, and unrelated changes were untouched.

## STOP conditions

Stop and report before implementation if:

- `CURRENT.md` is not `ticket-399` at `READY_FOR_CC` referencing this prompt;
- a single reusable canonical card/data path no longer exists;
- truthful entitlements or established upgrade behavior require a broad auth/checkout refactor;
- source preservation requires shared payment/login/entitlement semantic changes;
- English cannot be forced route-locally without mutating saved language or breaking bilingual routes;
- Aurora API/scoring/ranking/freshness/cache changes would be required;
- owner-controlled changes overlap required files ambiguously;
- proposed copy/metadata exceeds the real data contract.

Do not commit and do not push.

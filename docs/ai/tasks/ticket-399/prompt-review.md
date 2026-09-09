# Prompt Review — Ticket 399

## Ripley initial prompt — Round 1

### Task

Implement GitHub issue #399, **“Landing page fyrir norðurljósa síðu á ensku”**, as a permanent English product-entry page at `/en/northern-lights`.

The page must answer the visitor's question quickly, reuse the existing live Northern Lights product surface, support the existing Free/Pro journey, and provide a clean analytics entry point for organic and paid traffic. Do not turn it into a long campaign or blog page.

### Repository findings that constrain the implementation

- Routes are registered in `src/AppRoutes.jsx`; route matching has a real-router regression suite in `src/AppRoutes.test.jsx`.
- `src/components/NorthernLightsCard.jsx` is the canonical Northern Lights UI and already owns the decision request, result classification, Free/Pro presentation, details/ranking/map exposure, upgrade click, and associated analytics. Reuse it directly; do not fork its markup or data flow.
- The card needs `t`, `lang`, `entitlements`, `onUpgrade`, and `theme`. Its Free/Pro behavior is driven by server-backed entitlement state, with the existing development override only where the current application already supports it.
- `usePageRouteProps()` derives both `lang` and `t` from the saved language. That is not sufficient by itself for an explicitly English `/en/...` route: the page and the reused card must render and report English even when `localStorage.lang` is `is`.
- The established checkout/login behavior lives in `useMe`, `useLoginFlow`, and `useCheckoutFlow`. The landing page must not invent a second payment flow or bypass authentication/entitlement behavior.
- `react-helmet-async` is already used for page metadata, including canonical/Open Graph/Twitter tags in existing landing pages.
- Global `AnalyticsTracker` already records route pageviews. Ticket 399 additionally asks for one semantic `aurora_landing_viewed` event; do not replace or duplicate the global pageview.
- Existing Northern Lights analytics now include `lang` and exact-once guards. Preserve their names and semantics.
- No sitemap implementation was found in the current application. Do not introduce a sitemap system solely for this ticket.
- The working tree can contain owner-controlled changes from preceding tickets. Preserve them and keep Ticket 399's diff isolated.

### Required implementation

#### 1. Route and language contract

- Add the public route `/en/northern-lights` to `src/AppRoutes.jsx` and render a dedicated page component.
- The route must render English copy and pass `lang="en"` plus an English translation function to all content on this page regardless of the previously saved UI language.
- Do not silently mutate the user's saved language merely by visiting the route unless the existing routing architecture demonstrably requires that behavior. Prefer a route-local English override.
- Query parameters, including UTMs, must not prevent route matching and must remain present during the landing-page visit.

#### 2. Decision-first page structure

Keep the page compact and mobile-first. The order must be:

1. A minimal branded header appropriate to the existing product.
2. A short hero with this intent and substantially this copy:
   - H1: `Find the best Northern Lights conditions in Iceland tonight`
   - Supporting copy: `We compare cloud cover, aurora activity and darkness across locations to help you decide where to go.`
3. The real `NorthernLightsCard` immediately after the intro, visually above explanatory/SEO material.
4. A short `How it works` section explaining that current viewing conditions are compared across Iceland using aurora activity, cloud conditions, and darkness.
5. A concise, visible disclaimer that the Northern Lights are a natural phenomenon and no forecast can guarantee visibility.
6. A minimal footer/navigation treatment consistent with established public pages.

Do not add a long SEO article, blog content, screenshots, testimonials, decorative dashboard sections, or unrelated campsite-weather modules above the tool. The visitor came for a live answer.

All user-facing copy must live in the i18n translation structure, not as hardcoded strings in the component. Add Icelandic companion values if required by the repository's translation-shape conventions, but the route itself remains English-only.

#### 3. Canonical Northern Lights behavior

- Render the existing `NorthernLightsCard` directly and use its existing hook/API data source unchanged.
- Do not duplicate, reimplement, precompute, or reinterpret Aurora scoring, ranking, freshness, candidate selection, result classification, map visibility, or seasonal behavior.
- Preserve all existing result states, canonical presentation rules, Free/Pro gating, exact-once analytics guards, and current persistence behavior such as details expansion.
- Do not change the shared card merely to make its current visual design fit the new page unless a small, backwards-compatible composition prop is genuinely necessary. If such a prop would change homepage behavior or analytics semantics, stop and report before implementing it.

#### 4. Entitlement, login, and upgrade journey

- Feed the card real current entitlement state using the existing application hooks/contracts; never assume all landing-page visitors are Free or Pro.
- Connect the card's upgrade callback to the existing login/checkout journey and preserve its supplied Northern Lights source value so attribution continues through pricing/checkout wherever the current shared flow supports it.
- Reuse existing login modal, toast, and checkout infrastructure where needed. Do not create a second login form or call Paddle/API checkout directly from the new page.
- Do not modify feature definitions, prices, plan semantics, entitlement computation, checkout endpoints, Paddle plumbing, or authentication behavior.
- If providing the established upgrade journey on this standalone page requires a broad refactor of app-wide auth/checkout state, or inspection shows the existing flow cannot preserve attribution without changing shared semantics, stop and report the exact dependency and the smallest proposed follow-up instead of expanding scope silently.

#### 5. Analytics

- Fire `aurora_landing_viewed` once per meaningful landing-page mount/exposure, guarded against ordinary rerenders (including theme, entitlement, and translation-related rerenders).
- Include only lightweight, non-PII metadata. At minimum include `lang: "en"` and the canonical tier (`free` or `pro`) when entitlement resolution makes that truthful. Do not send email, user ID, raw URL/query string, or free-form UTM values in the event.
- Do not create a separate teaser event. Do not rename or alter the existing Northern Lights events.
- The landing event must be additive to the global route pageview and must not itself fire again solely because the card resolves, details open, theme changes, or entitlement state rerenders.
- Preserve the intended funnel:
  `aurora_landing_viewed` → existing card/details/ranking/map/upgrade events → pricing → checkout.

If `useMe` has an unresolved loading phase that makes tier unknowable at first exposure, audit its actual contract before choosing an event timing. Do not label an unknown visitor as Free merely for convenience; either wait for truthful entitlement resolution or omit tier in a documented, tested manner consistent with existing analytics conventions.

#### 6. Metadata and discoverability

Use `Helmet` and follow the established public-page metadata pattern. Provide:

- a concise English `<title>` targeting Northern Lights conditions in Iceland tonight;
- a truthful English meta description;
- canonical URL for `/en/northern-lights` without UTM/query parameters;
- matching Open Graph title, description, and URL;
- matching Twitter card/title/description;
- an English document language signal if safely supported by the current Helmet setup.

Build canonical URLs from the established production-origin convention already used by the repo. Do not add claims of guaranteed visibility, real-time precision beyond the actual data contract, or unsupported location coverage.

#### 7. Scope discipline

In scope:

- one dedicated page component and focused tests;
- route registration and route test coverage;
- focused i18n additions;
- metadata;
- the single landing-view analytics event;
- minimal reuse/wiring needed for real entitlements and the existing upgrade flow.

Out of scope:

- changes to Aurora API, cron, scoring, ranking, cache, freshness, candidates, or data sources;
- redesigning `NorthernLightsCard` or changing its homepage placement;
- new backend routes or libraries;
- checkout/payment/authentication behavior changes;
- ad creation, Facebook setup, campaign launching, or hardcoded campaign-specific UTMs;
- a new sitemap framework, blog article, Icelandic route, or broad navigation redesign;
- unrelated cleanup.

### Acceptance criteria

- `/en/northern-lights` resolves to the new page and unknown routes retain existing behavior.
- The page remains English when the saved application language is Icelandic.
- The hero provides the immediate decision promise and the live canonical Northern Lights card appears directly beneath it.
- The page contains concise `How it works` and no-guarantee copy below the tool.
- Free and Pro visitors receive the same card behavior and access boundaries they receive on the homepage.
- Upgrade interaction uses the existing journey and retains the Northern Lights source argument through the page's callback boundary.
- `aurora_landing_viewed` fires exactly once on ordinary rerenders, contains no PII, and truthfully handles entitlement resolution.
- Existing card events continue to fire from the shared card without duplicates or renamed payload semantics.
- Metadata and canonical URL are English, accurate, and query-free.
- No Aurora decision logic, payment plumbing, backend, or unrelated page behavior changes.

### Required tests

Add focused tests that prove behavior rather than implementation details:

- Real `AppRoutes` matching for `/en/northern-lights`, including a query-string visit, plus preservation of the NotFound baseline.
- Page hero, shared-card placement, `How it works`, and disclaimer render in English when saved language is Icelandic.
- The page passes `lang="en"`, the English `t`, real entitlement shape, theme, and the upgrade callback to `NorthernLightsCard`.
- The card's supplied upgrade source reaches the existing checkout callback boundary unchanged.
- `aurora_landing_viewed` fires once with the approved non-PII payload and does not duplicate on relevant rerenders.
- Metadata includes title, description, canonical, Open Graph, and Twitter values without query parameters.
- At least one focused regression assertion confirms the existing homepage still renders the same shared `NorthernLightsCard` path rather than a copied landing-page variant, if existing coverage does not already prove this adequately.

Use mocks only at real external or leaf boundaries. Do not recreate route tables, classifier output, or entitlement rules inside tests.

### Validation

Run at minimum:

1. The new landing-page test file(s).
2. `src/AppRoutes.test.jsx`.
3. `src/components/NorthernLightsCard.test.jsx`.
4. Relevant checkout/login analytics tests if shared wiring is touched.
5. The full Vitest suite.
6. `npm run lint`.
7. `npm run build`.
8. `git diff --check`.

Also inspect the final diff and explicitly report:

- exact files changed;
- how English is forced route-locally;
- how entitlement and upgrade wiring reuse existing contracts;
- exact `aurora_landing_viewed` payload and dedupe identity/timing;
- metadata values and canonical origin behavior;
- confirmation that Aurora logic, other routes, checkout/payment plumbing, and unrelated existing changes were not modified.

### STOP conditions

Stop before implementation and report if:

- the current task pointer is not `ticket-399` at `READY_FOR_CC` with an approved prompt referenced by `CURRENT.md`;
- current code no longer has a single reusable `NorthernLightsCard`/decision data path;
- the dedicated page cannot obtain truthful entitlement state or use the existing upgrade journey without a broad auth/checkout refactor;
- preserving Northern Lights source attribution requires changing shared checkout, login, payment, or entitlement semantics beyond this ticket;
- forcing English would require globally overwriting saved language or breaking bilingual routes rather than using a local override;
- implementation would require modifying Aurora API/scoring/ranking/freshness/cache behavior;
- owner-controlled working-tree changes overlap ambiguously with the files required for Ticket 399;
- any factual copy or metadata claim would exceed what the existing data actually supports.

Do not commit and do not push.

---

## Jonesy review — Round 1

**Verdict: REVISE**

## Method

Traced the prompt's central technical claim — that a "route-local English override" can make the page and the reused `NorthernLightsCard` render truthfully in English regardless of saved language — against the actual mechanism the repo uses for `t`, plus the specific precedent the prompt cites (`/en/blog`'s `langOverride`). Also verified the Helmet/metadata claim, the upgrade-attribution claim, and the entitlement/checkout hook chain.

- `src/AppRoutes.jsx`, `src/hooks/usePageRouteProps.js`, `src/hooks/useT.js`, `src/hooks/useLanguage.js`
- `src/pages/BlogIndex.jsx` (the cited `/en/blog` precedent, read in full)
- `src/components/NorthernLightsCard.jsx` (prop signature, `t(...)` usage, `onUpgrade(source)` call site)
- `src/hooks/useMe.js`, `useLoginFlow.js`, `useCheckoutFlow.js`
- `src/pages/CampaignLandingPage.jsx`, `src/pages/BlogPostPage.jsx` (Helmet precedent)

## Required finding: the cited English-override precedent doesn't actually override `t`, and following it would silently render the reused card in Icelandic

`usePageRouteProps()` builds `t` as `useT(lang)`, where `lang` comes from the *saved* `useLanguage()` value — `t` is a closure over whichever language was saved, not a prop that can be swapped after the fact. `useT(lang)` itself is trivial: `translations[lang]?.[key] ?? key`.

The prompt's own §1 correctly identifies that `usePageRouteProps()` "is not sufficient by itself" and points to `/en/blog`'s `langOverride` as repository precedent for a route-local override. I read that precedent (`AppRoutes.jsx`'s `BlogRoute({ langOverride }) { const pageProps = usePageRouteProps(); return <BlogIndex {...pageProps} lang={langOverride || pageProps.lang}/>; }`) — and it only overrides the `lang` **prop**. It still spreads `pageProps.t`, which remains built from the *saved* language. `BlogIndex.jsx` works around this with its own `translateOrFallback(t, key, fallback)` helper: it calls `t(key)` and only falls back to the hardcoded English string when `t(key)` returns the key itself unchanged (i.e., only when the *saved* language's translation file happens not to define that key). This is accidental correctness, not a real override — if the Icelandic translation file ever gains entries for `blogTitle`/`blogIntro`/etc. (plausible, since `/blog` itself is presumably localized), `/en/blog` would start rendering those strings in Icelandic for any visitor whose saved language is `is`, with no test currently guarding against it.

This matters here specifically because `NorthernLightsCard.jsx` has no such escape hatch — dozens of `t("nlCardTitle")`, `t("nlWarningStale")`, `t("nlHeadlinePoor")`, etc. calls with no fallback wrapper, and it currently only ever receives `t` from whatever the page above it constructed. If Ticket 399 is implemented by imitating the cited `/en/blog` pattern (spread `usePageRouteProps()`, override only `lang`), the result would be: `lang="en"` reported correctly to analytics and any `lang === "en"` conditionals, while every `t()`-driven string inside the actual reused card — its title, status pill, stale/partial notices, reason summaries, all-poor/qualifying headlines, CTA copy — renders in Icelandic for any visitor whose saved language is `is`. That is a direct, silent violation of the ticket's own central acceptance criterion ("The page remains English when the saved application language is Icelandic") in the one place (the actual product surface) that matters most, while the page's own hardcoded hero H1/subhead (given verbatim in §2) would still look correct and could mask the bug in casual review.

**Required addition to the prompt**: the route-local override must independently construct `t` for English — `const t = useT("en")` (the same hook `usePageRouteProps()` uses internally, called directly with the literal `"en"`), not `usePageRouteProps().t` — and that independently-built `t` (not the saved-language one) must be what's passed both to the page's own copy and into `NorthernLightsCard`. `lang="en"` must be passed alongside it, consistently. `theme` may still come from `usePageRouteProps()`/`useLocalStorageState` since it isn't language-dependent. Do not follow the `/en/blog` pattern of spreading `pageProps` and separately overriding only `lang`.

**Required addition to the test list**: the existing required test ("Page hero, shared-card placement, `How it works`, and disclaimer render in English when saved language is Icelandic") must be extended to assert on *translated, `t()`-driven text actually rendered by `NorthernLightsCard`* — for example its card title or a status/pill string — not only the hardcoded hero H1/subhead given verbatim in §2, which would render correctly in English regardless of this bug and so cannot catch it.

## Everything else checked out

- The Helmet/canonical/OG/Twitter pattern is real and precisely as described — confirmed in `CampaignLandingPage.jsx` (canonical + `og:title/description/url` + `twitter:card/title/description`, origin via `window.location.origin`) and `BlogPostPage.jsx`. Good precedent to build from.
- `NorthernLightsCard`'s actual prop signature (`{ t, lang, entitlements, onUpgrade, theme, fetchImpl, now }`) matches exactly what the prompt says the page must supply.
- The "preserve the Northern Lights source value through checkout" requirement is grounded in real code: `NorthernLightsCard`'s upgrade handler calls `onUpgrade(source)`, and `useCheckoutFlow`'s `startCheckout(src)` puts that value directly into the `/pricing?...&src=...` query string — a real, working attribution path, not invented.
- Full reuse of `useMe` + `useLoginFlow` + `useCheckoutFlow` + `useToast` + `<LoginModal>` (the App.jsx pattern) is legitimate and composable without a broader refactor — these are already standalone, independently-wireable hooks/components, not entangled with `App.jsx`'s internals. The prompt's STOP condition for this is a reasonable safety net but shouldn't be needed.
- No sitemap system exists in the repo — confirmed no contradicting evidence found.

## Everything else in the prompt

Route registration, decision-first page ordering, analytics event shape/dedup requirements, scope boundaries, and STOP conditions are all well specified and consistent with the live code. The one required finding above is narrow and local — a one-line change to how `t` is constructed on the new route, plus one test assertion — and doesn't require rethinking the rest of the plan.

---

## Ripley revision — Round 2

**Status: Revised for Jonesy review**

Jonesy's finding is accepted. Round 1 remains in force except where the following requirements make the English translation contract more explicit.

### Binding English translation construction

The `/en/northern-lights` route must construct its translation function independently for English with the repository's real translation hook:

```jsx
const t = useT("en");
```

This English `t` function and `lang="en"` must both be passed consistently to the dedicated page and the reused `NorthernLightsCard`.

It is not sufficient to spread the result of `usePageRouteProps()` and then override only its `lang` property. `usePageRouteProps().t` closes over the saved language and therefore remains Icelandic when `localStorage.lang` is `is`. Do not copy the current `/en/blog` route pattern for this purpose; that route overrides the `lang` prop but does not independently rebuild `t`, so it is not a safe localization precedent for `NorthernLightsCard`.

Theme may still be obtained from `usePageRouteProps()` or the existing local-storage theme hook because it is language-independent. Visiting `/en/northern-lights` must remain route-local and must not overwrite the user's saved language.

All of Round 1's requirements for i18n-backed page copy remain unchanged: the page's own heading, supporting copy, explanatory section, disclaimer, header, footer, and the complete shared card must resolve through the independently constructed English `t`.

### Binding regression test refinement

The saved-Icelandic-language test must not prove English rendering only through the hero text. In addition to the page-owned English hero/`How it works`/disclaimer assertions, it must render the real `NorthernLightsCard` translation path far enough to assert at least one unmistakably translated `t()`-driven card string, such as the English card title `Northern Lights tonight` or an English status/pill string, while the persisted language is `is`.

This assertion must fail if an implementation accidentally passes `usePageRouteProps().t` with only `lang="en"` overridden. A mock that merely inspects the `lang` prop, or a test limited to hardcoded/fallback hero text, does not satisfy this requirement.

The focused prop-wiring test must likewise establish that the exact English translation function—not the saved-language function—is passed into `NorthernLightsCard` alongside `lang="en"`.

### Revised acceptance clarification

The criterion “The page remains English when the saved application language is Icelandic” explicitly includes every visible state of the reused Northern Lights card: title, loading state, status pill, headline/body, freshness/partial notices, details controls, reasons, ranking/map labels, unavailable states, and upgrade copy. No card-local fallback wrapper or duplicated English strings may be introduced to achieve this; the single route-level `useT("en")` contract must supply the canonical translations.

No other Round 1 requirement, scope boundary, validation command, or STOP condition changes.

---

## Jonesy review — Round 2

**Verdict: APPROVED**

## Method

Verified Ripley's Round 2 revision is grounded in real, live code rather than a plausible-sounding restatement of my Round 1 finding.

- `src/hooks/useT.js` — re-confirmed `useT(lang)` is a plain `useCallback` closing over whatever `lang` literal is passed; calling it directly as `useT("en")` inside the new route component is a valid, unconditional top-level hook call and genuinely produces an English-closured `t`, independent of `useLanguage()`'s saved value.
- `src/i18n/translations.js` — confirmed `translations.en` is the real, fully-merged English locale object (`pricingTranslations.en`, `commonTranslations.en`, ..., `northernLightsTranslations.en` all spread in), not an empty/stub shell — so `useT("en")` resolves to genuine English strings, not key-fallback text.
- `src/i18n/translations.northernLights.js` — confirmed the exact string Ripley cites: `en.nlCardTitle === "Northern Lights tonight"`, and separately `is.nlCardTitle === "Norðurljós í kvöld"`. These are genuinely different strings, so an assertion on `"Northern Lights tonight"` while `localStorage.lang === "is"` is a real discriminating test — it would fail today under the vulnerable `usePageRouteProps().t` + `lang="en"`-only pattern, and only pass with a correctly English-closured `t`.
- `src/components/NorthernLightsCard.jsx` line 67 — confirmed `t("nlCardTitle")` is rendered directly into an `<h2>`, so the cited assertion target is real, reachable DOM output, not an internal value.

## Assessment

Round 2 fully and correctly resolves the Round 1 finding:

- The binding construction (`const t = useT("en")`, passed alongside `lang="en"` to both the page and `NorthernLightsCard`, with `theme` still sourced from `usePageRouteProps()`) is the right fix and matches what I required — not a reworded version of the vulnerable `/en/blog` pattern.
- The revised test requirement is concrete and correctly falsifiable: it names a real key/string pair (`nlCardTitle` → `"Northern Lights tonight"` vs. `"Norðurljós í kvöld"`) that only passes under a genuine independent English `t`, and explicitly forbids satisfying it via hardcoded hero text or a `lang`-only mock — closing the exact loophole that made the Round 1 prompt's original test insufficient.
- The revised acceptance clarification correctly extends "the page remains English" to every visible card state (title, loading, status pill, headline/body, freshness/partial notices, details, ranking/map labels, unavailable states, upgrade copy) and correctly forbids adding a `BlogIndex`-style fallback wrapper as a workaround — that would just reintroduce the same "accidental correctness" failure mode I flagged in Round 1 (silent Icelandic leakage the moment a key description changes), so ruling it out here is the right call.
- No other Round 1 requirement was weakened or contradicted; scope, STOP conditions, and validation steps are unchanged.

Approved for implementation.

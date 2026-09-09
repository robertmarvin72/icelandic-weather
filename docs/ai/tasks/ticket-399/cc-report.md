# CC Report — Ticket 399 (English Northern Lights landing page: `/en/northern-lights`)

Executed against: `docs/ai/tasks/ticket-399/approved-prompt-v1.md` (v1, READY_FOR_CC → CC_IN_PROGRESS).

## 1. Mandatory preflight audit

Read before editing: `src/AppRoutes.jsx` + `src/AppRoutes.test.jsx`, `src/components/NorthernLightsCard.jsx` (unchanged from Ticket 401's final state) + its full test file, `src/hooks/usePageRouteProps.js`, `src/hooks/useT.js`/`useLanguage.js`/`useLocalStorageState.js`, `src/hooks/useMe.js`, `src/hooks/useLoginFlow.js`, `src/hooks/useCheckoutFlow.js`, `src/components/LoginModal.jsx`, `src/components/ToastHub.jsx`/`Footer.jsx`/`Brand.jsx`, `src/pages/CampaignLandingPage.jsx` (closest existing standalone-landing-page precedent), `src/App.jsx` (to confirm exact homepage wiring of `NorthernLightsCard`), `src/i18n/translations.js`/`translations.landing.js`/`translations.northernLights.js`, `src/components/AnalyticsTracker.jsx`, and the existing `/en/blog` route implementation in `AppRoutes.jsx`.

### Confirmed audit findings (verified against live code, not assumed)

- **`usePageRouteProps().t` genuinely closes over the saved language**: `usePageRouteProps()` returns `{ lang, theme, t: useT(lang) }` where `lang` comes from `useLanguage()` (reads `localStorage.lang`). Overriding only the `lang` prop passed to a child does not change what that `t` function actually returns.
- **Confirmed the exact `/en/blog` anti-pattern the prompt warns against**: `BlogRoute({langOverride})` in `AppRoutes.jsx` does `const pageProps = usePageRouteProps(); return <BlogIndex {...pageProps} lang={langOverride || pageProps.lang} />` — `lang` is overridden but `t` (inside `pageProps`) is not, so `/en/blog` visited with a saved Icelandic language would still resolve `t()` calls to Icelandic. Confirmed present, **not** copied here.
- **`NorthernLightsCard.jsx` is unchanged since Ticket 401** — re-read in full; its props contract (`t, lang, entitlements, onUpgrade, theme, fetchImpl?, now?`) and internal analytics/classification/gating logic are exactly as documented in the prior tickets' reports. Nothing about it needed touching.
- **`useMe()`'s real loading contract**: returns `{ me, loadingMe, meError, refetchMe, refreshMe }`. `me` is `null` only until the first `/api/me` fetch settles; once `loadingMe` becomes `false`, `me` is always a normalized object (`{ok,user,subscription,entitlements:{pro,proUntil}}`) — even on a fetch error, the hook's catch path sets a safe `{pro:false,proUntil:null}` shape rather than leaving `me` null forever. This is the exact seam used to avoid ever labeling an unresolved entitlement as Free (see §4).
- **`useLoginFlow`/`useCheckoutFlow`/`LoginModal`/`ToastHub`/`Footer` are all self-contained, reusable hooks/components** already wired together in `App.jsx` with a known exact prop contract (`{me, navigate, openLoginModal/pushToast/refetchMe/t}` for both flow hooks; `{open, loginBusy, loginEmail, setLoginEmail, closeLoginModal, submitLogin, t}` for `LoginModal`; `{t}` for `Footer`). Re-wired identically on the new page — no new login form, no direct Paddle/checkout API calls.
- **`AnalyticsTracker` already fires `trackPageView` globally for every route** (a sibling of `<AppRoutes>` inside `<BrowserRouter>` in `App.jsx`, keyed on `location.pathname + location.search`) — confirming the new page must add a *separate* semantic event, never its own pageview call.
- **`translations.landing.js` is the established home for both the dedicated `Landing.jsx` page and the existing `CampaignLandingPage.jsx` campaign copy** (merged into the global `translations` object via `translations.js`), with real `en`/`is` blocks for every key even on pages that are visited bilingually. Followed the same file/shape for the four new page-copy keys plus title/description, adding real Icelandic companion values per the file's established convention (documented as unreachable dead values on this specific route, since it is English-locked).
- **Production-origin/Helmet convention confirmed via two live precedents** (`CampaignLandingPage.jsx`, `BlogPostPage.jsx`): `` `${typeof window !== "undefined" ? window.location.origin : "https://campcast.is"}${path}` `` for canonical/OG URLs. Followed verbatim rather than introducing a new fallback convention.
- **No `App.test.jsx` exists** to independently prove the homepage still uses the same shared `NorthernLightsCard` path — confirmed instead by direct inspection: `App.jsx`'s `<NorthernLightsCard t={t} lang={lang} entitlements={entitlements} onUpgrade={startCheckout} theme={theme} />` (line ~363) is byte-for-byte unchanged by this ticket (re-diffed after implementation). Writing a new `App.test.jsx` for pre-existing, otherwise-untested homepage wiring was judged out of this ticket's "focused tests" scope (would be the kind of "unrelated cleanup" explicitly out of scope) — documented here as the verification method used instead of a new test.

No discrepancy was found between the prompt's stated constraints and the live tree. No STOP condition was triggered.

## 2. Files changed

**New:**
- `src/pages/NorthernLightsLanding.jsx` — the page itself.
- `src/pages/NorthernLightsLanding.test.jsx` — structure/order/copy, forced-English-through-the-real-card, and `aurora_landing_viewed` analytics tests.
- `src/pages/NorthernLightsLanding.cardWiring.test.jsx` — exact-props-reach-the-card and upgrade-source-forwarding tests.
- `src/pages/NorthernLightsLanding.metadata.test.jsx` — real `HelmetProvider`-backed metadata tests.

**Modified:**
- `src/AppRoutes.jsx` — added the `/en/northern-lights` route (one import, one `<Route>` line). No other route touched.
- `src/AppRoutes.test.jsx` — added a mock for the new page and four route-matching tests (route hit, UTM/query-string preservation, internal-double-slash → NotFound consistency, near-miss path → NotFound).
- `src/i18n/translations.landing.js` — added `auroraLandingMetaTitle`, `auroraLandingMetaDescription`, `auroraLandingHeroTitle`, `auroraLandingHeroSubtitle`, `auroraLandingHowEyebrow`, `auroraLandingHowText`, `auroraLandingDisclaimer` (EN + IS companion values). No existing key changed.

**Confirmed untouched**: `src/components/NorthernLightsCard.jsx` and every Aurora scoring/ranking/freshness/candidate/cache/cron file; `src/hooks/useMe.js`, `useLoginFlow.js`, `useCheckoutFlow.js`; `src/components/LoginModal.jsx`, `ToastHub.jsx`, `Footer.jsx`, `Brand.jsx`; `src/App.jsx`; every other route in `AppRoutes.jsx`; `src/config/features.js` (feature/entitlement definitions); Paddle/checkout endpoints; `src/i18n/translations.northernLights.js`. No dependency was added. No `.tsx`/TypeScript. Not committed. Not pushed.

## 3. Forced-English construction — exact mechanism

```jsx
const t = useT("en");   // independently built at the route boundary, per approved prompt
const lang = "en";
```

Both are passed straight through to every child that needs them (`Brand`, `LoginModal`, `useLoginFlow`, `useCheckoutFlow`, `NorthernLightsCard`, `Footer`) — nothing on this page ever reads `usePageRouteProps()` or the saved-language `useLanguage()`/`useT(savedLang)` combination. `localStorage.lang` is never read or written by this page (confirmed: the page never calls `useLanguage()`), so visiting it cannot overwrite the user's saved language — verified directly by a test that sets `localStorage.lang = "is"`, renders the page, and re-reads `localStorage.lang` afterward to confirm it is untouched. Theme comes from the same `useLocalStorageState("theme", "light")` call `usePageRouteProps()` itself uses internally (kept separate to avoid any risk of destructuring the wrong `t`/`lang` from that multi-value hook, per the prompt's explicit warning), paired with `useThemeClass(theme === "dark")` — the same pattern `CampaignLandingPage.jsx` already uses for a standalone route outside the home app tree.

The forced-English claim is proven through the **real card**, not a mock: with `localStorage.lang` set to `"is"` before render, the real `NorthernLightsCard` (real `useAuroraDecision`/`classifyAuroraOutcome`/`selectAuroraDisplay`, real i18n lookup) renders literal text `"Northern Lights tonight"` and never `"Norðurljós í kvöld"`.

## 4. Entitlement, login, and upgrade flow — reused, not reinvented

`useMe()` supplies the real session state; `entitlements = { isPro: !!me?.entitlements?.pro, proUntil: me?.entitlements?.proUntil ?? null }` mirrors `App.jsx`'s own computation exactly (minus the `DEV`-only `devPro` local-testing override, which is a developer convenience specific to the home app, not a documented contract this page needs to replicate). `useLoginFlow`/`useCheckoutFlow` are wired with the same `{me, navigate, openLoginModal, pushToast, refetchMe, t}` shape `App.jsx` uses. The card's `onUpgrade` prop is `startCheckout` **passed through unwrapped** — no intermediate wrapper function — so the card's own `source` argument reaches `useCheckoutFlow`'s existing `startCheckout(src)` exactly as it does from the homepage.

Verified directly (mocking only the leaf `NorthernLightsCard` boundary to capture its exact received props, then invoking the captured `onUpgrade` to exercise the real, unmocked `useCheckoutFlow`):
- A logged-in Free visitor calling `onUpgrade("northern_lights_card")` navigates to `/pricing?email=...&src=northern_lights_card` — the source survives unchanged into the real navigation URL.
- An anonymous visitor calling the same callback opens the existing `LoginModal` (`role="dialog"` becomes present) instead of navigating or inventing any new auth flow.
- Entitlements passed to the card are `{isPro:false, proUntil:null}` while `loadingMe` is true (the same safe-default behavior `App.jsx`'s own homepage wiring already has — this ticket didn't change or need to change that shared behavior) and truthfully reflect Pro once resolved.

## 5. Analytics — `aurora_landing_viewed`

Fires from a `useRef`-guarded effect keyed on `loadingMe`/`entitlements.isPro`, exactly once per mount:

```js
if (viewedRef.current || loadingMe) return;
viewedRef.current = true;
trackEvent("aurora_landing_viewed", { lang: "en", tier: entitlements.isPro ? "pro" : "free" });
```

- **Never fires while `loadingMe` is true** — so an unresolved entitlement is never labeled Free; the event only fires once `useMe`'s own contract has genuinely settled (success or its safe-default error path), at which point `tier` is always truthful.
- **Payload is exactly `{lang, tier}`** — no email, user ID, raw URL, query string, or UTM values; verified by asserting every payload key is one of `["lang","tier"]`.
- **Exact-once across ordinary rerenders**: verified by rerendering after resolution completes (must stay at exactly one call) and after an unrelated `localStorage` write simulating a theme change (still exactly one call) — the `viewedRef` guard is unconditional once tripped, independent of any dependency change.
- **No teaser or duplicate pageview event was added.** `AnalyticsTracker`'s existing global `trackPageView` is unaffected and untouched.

## 6. Metadata

Verified with a **real** `HelmetProvider` (not the pass-through mock used for the other test files) rendering the actual page and reading `document.title`/`document.head` after Helmet's effect commits:

- `document.title` contains "Northern Lights" and "Iceland" (case-insensitive).
- `<meta name="description">` mentions cloud cover/aurora/darkness and contains no unsupported real-time-precision/guarantee claim (explicitly asserted against `real-time|guarantee|100%|always accurate`).
- `<link rel="canonical">`, `og:url`, and Twitter's implicit URL context are all `${window.location.origin}/en/northern-lights` — **query-free even though the test visits the route with `?utm_source=google&utm_campaign=aurora`** in `MemoryRouter`'s `initialEntries`, because the canonical/OG URL is built from a hardcoded `CANONICAL_PATH` constant plus `window.location.origin`, never from the actually-visited path/query.
- `og:title`/`og:description` and `twitter:title`/`twitter:description` match the primary title/description exactly; `twitter:card` is `"summary"`.
- `document.documentElement.lang` is `"en"` (via `<html lang="en" />` inside `<Helmet>`, a documented react-helmet-async v3 capability — confirmed the installed version in `package.json`).

## 7. Real-browser sanity check (supplementary — not a permanent test file, since this ticket's own validation list names Vitest suites only)

**Corrected in Revision 2 — the original version of this section was wrong.** Started `npm run dev`, stubbed `/api/campsites` and `/api/aurora-decision` via a throwaway Playwright script (same established `page.route()` pattern used in this project's `tests/e2e/*.spec.js` files), visited `/en/northern-lights` with `localStorage.lang="is"` in both light and dark theme, and confirmed: correct page title, correct English H1 regardless of saved Icelandic language, zero console/page errors, correct section order (header → hero → real card showing "Good conditions tonight" → How it works → disclaimer → footer with live translated links), and both themes rendering correctly.

A visible header collision was observed in both themes' screenshots — the tagline text overlapping the bottom of the logo, reading roughly "Find [overlapping] weather." **The original v1 text of this section incorrectly attributed this to the throwaway script's screenshot-capture timing (claiming the logo image had not finished loading in the captured frame) and closed it as not a real defect. That explanation was wrong, not merely imprecise, and the issue was real** — confirmed by Jonesy/Ripley's Round 1 review and independently re-confirmed here by reading source: `src/components/Brand.jsx`'s `size="slim"` variant renders a 40px-tall logo `<img>` immediately followed by a tagline `<span>` carrying Tailwind `-mt-7` (`margin-top: -1.75rem`, i.e. **-28px**) when `isSlim` is true. The `header-title`/`header-title-brand` classes on that span have no CSS definition anywhere in the repo (confirmed via repo-wide grep), so nothing compensates for the negative margin — the tagline is pulled 28px upward directly into the logo, a **static CSS layout collision**, reproducible identically regardless of image-load timing, not a race condition. This is a **pre-existing defect in the shared `Brand.jsx` component**, not introduced by Ticket 399 — `src/pages/CampaignLandingPage.jsx` (line ~56) uses the exact same `<Brand size="slim" .../>` composition and has the identical collision, confirmed by direct inspection of its header markup. Neither `Brand.jsx` nor `CampaignLandingPage.jsx` was modified to fix this (see Revision 2 below) — that would exceed this ticket's corrective scope, per the approved v2 prompt's explicit instruction.

The throwaway script and its screenshots were deleted after the check; nothing from it is part of this ticket's diff.

## 8. Tests, lint, and build actually run

- **New page test files** — `npx vitest run src/pages/NorthernLightsLanding.test.jsx src/pages/NorthernLightsLanding.cardWiring.test.jsx src/pages/NorthernLightsLanding.metadata.test.jsx` → **21/21 passed**, 3 files. One genuine test-authoring bug was caught and fixed on the first real run: calling the captured (real, unmocked) `onUpgrade`/`startCheckout` — an `async` function — via a synchronous `act(() => onUpgrade(...))` left its returned promise unresolved by the time assertions ran, causing a flaky/incorrect failure (and, when run alongside other tests in the same file, a confusing "mock never called" symptom in an unrelated test caused by the leaked pending promise). Fixed by switching to `await act(async () => { await onUpgrade(...); })` in both upgrade-flow tests; verified both pass individually and as part of the full file afterward.
- **`src/AppRoutes.test.jsx`** — `npx vitest run src/AppRoutes.test.jsx` → **12/12 passed** (8 pre-existing + 4 new).
- **`src/components/NorthernLightsCard.test.jsx`** — `npx vitest run src/components/NorthernLightsCard.test.jsx src/hooks/useCheckoutFlow.analytics.test.js` → **59/59 passed** (both files unmodified by this ticket; run to confirm zero regression in the reused card/checkout wiring).
- **Full suite** — `npx vitest run` → **1088/1088 passed**, 94 files (up from 1063/91 before this ticket — +25 tests, +3 files).
- **Lint** — `npm run lint` → exit 0, no output.
- **Build** — `npm run build` → succeeded (`✓ built in 4.08s`). Same pre-existing "chunks larger than 500 kB" advisory as every prior run this session, unrelated to this ticket.
- **`git diff --check`** → exit 0. Only pre-existing informational LF→CRLF autocrlf notices on `docs/ai/CURRENT.md` and `src/AppRoutes.test.jsx`; zero actual whitespace errors.

No command was skipped or reported as passing without actually running.

## 9. Acceptance criteria — confirmed

- `/en/northern-lights` and its UTM/query-string variants resolve correctly (route-matching tests); unrelated/near-miss paths and internal-double-slash still fall through to `NotFound`, consistent with every other route.
- The entire page and the real shared card render English even with saved language `is` — proven through the real card's own translation path, not a prop-only or hero-only assertion.
- Hero → live card → concise "How it works" → disclaimer appear in that exact document order, verified via `compareDocumentPosition`, with the footer following.
- Free/Pro access boundaries match the homepage — same `entitlements` computation, same canonical card, same gating logic (untouched).
- Upgrade reuses `useCheckoutFlow`'s existing behavior and forwards the card's `source` argument unchanged into the real navigation.
- `aurora_landing_viewed` is truthful (`lang`/`tier` only, tier never guessed before resolution), non-PII, and exact-once across rerenders including a simulated theme change.
- No existing Northern Lights event was duplicated, renamed, or had its payload semantics changed (none of those files were touched).
- Metadata (title, description, canonical, OG, Twitter, document language) is accurate, English, and query-free even under UTM traffic.
- No Aurora decision logic, backend route, payment plumbing, or unrelated route/behavior was changed — confirmed by diffing the final working tree against the pre-ticket state and re-running every directly relevant existing regression suite green.

## 10. Deviations and residual risks

1. **No new `App.test.jsx` was added** to independently prove the homepage's `NorthernLightsCard` wiring — none existed before this ticket, and adding one was judged out-of-scope "unrelated cleanup." Verified instead by direct, explicit code-diff confirmation (§1) that `App.jsx`'s existing card usage is byte-for-byte unchanged.
2. **`devPro`'s DEV-only local-testing override was intentionally not replicated** on the new page — it's a homepage-specific developer convenience for toggling Pro locally, not a documented product contract; the new page's entitlement computation is fully truthful without it (Pro testing on this route can still be done via a real Pro-entitled session).
3. **The real-browser sanity check (§7) is supplementary, not a required/permanent artifact** — this ticket's own validation list names only Vitest suites, so no new Playwright spec file was added to the repository; the throwaway script and screenshots used for the check were deleted afterward and are not part of this diff.
4. No other risk identified: Aurora scoring/ranking/freshness/candidates/cache/cron, every other existing route, `useMe`/`useLoginFlow`/`useCheckoutFlow`/`LoginModal`/`ToastHub`/`Footer`, feature-gating definitions, and Paddle/checkout plumbing are all confirmed unmodified and (where a relevant existing suite exists) re-verified green, not merely assumed.

## 11. Confirmation (Revision 1 — superseded by Revision 2 below)

`docs/ai/CURRENT.md` has been updated: CC report path set to this file, stage set to `CC_COMPLETE`. **Not committed. Not pushed.**

---

# Revision 2 (Ticket 399 v2) — header logo/tagline collision fix

Executed against: `docs/ai/tasks/ticket-399/approved-prompt-v2.md`, following Jonesy's `REVISE` finding and Ripley's `REVISE` confirmation in `result-review.md` (Revision 1).

## R2.1 What was wrong, and why the original §7 was wrong too

Jonesy/Ripley found a real, reproducible header defect on `/en/northern-lights`: the tagline text visually collides with the logo above it. §7 above (now corrected in place) originally attributed this to the throwaway verification script's screenshot-capture timing — that explanation was **factually wrong**, not just imprecise. The real cause, confirmed by reading `src/components/Brand.jsx` directly: its `size="slim"` variant renders a 40px-tall logo `<img>` immediately followed by a tagline `<span>` carrying Tailwind `-mt-7` (`margin-top: -1.75rem`, -28px) whenever `isSlim` is true, and the `header-title`/`header-title-brand` classes on that span have no CSS definition anywhere in the repo (confirmed via grep) — so nothing compensates for the negative margin. This is a **static CSS layout collision**, reproducible identically regardless of whether the logo image has finished loading — not a race condition, and not something a longer wait in the verification script would ever have caught, since the bug isn't about loading at all. `src/pages/CampaignLandingPage.jsx` uses the identical `<Brand size="slim" .../>` composition and has the same pre-existing collision — this defect predates Ticket 399 and lives in the shared component, not in anything this ticket wrote.

## R2.2 Fix applied — route-local, per the approved v2 prompt's scope boundary

`src/pages/NorthernLightsLanding.jsx`, the header's `Brand` usage — added the existing `hideTagline` prop (already supported by `Brand.jsx`, unused until now):

```jsx
// before
<Brand t={t} size="slim" lang={lang} />

// after
<Brand t={t} size="slim" lang={lang} hideTagline />
```

Nothing else in the file changed. `src/components/Brand.jsx` and `src/pages/CampaignLandingPage.jsx` were **not modified** — confirmed via `git status` after implementation (neither file appears in the diff) — leaving the shared component's own defect, and `CampaignLandingPage.jsx`'s exposure to it, exactly as they were before this ticket, per the v2 prompt's explicit instruction not to repair them here.

## R2.3 Regression test added

`src/pages/NorthernLightsLanding.test.jsx` — one new test in the existing "page structure, order, and required copy" describe block, using an **observable render assertion** against the real (unmocked) `Brand` component already rendered by that file's tests:

```js
it("Ticket 399 v2 (Round 2): the header renders the Brand logo with no tagline, avoiding the shared slim-variant collision", () => {
  renderPage();
  expect(screen.queryByText("Find better weather")).toBeNull(); // brandTagline's real EN value
  expect(screen.getAllByAltText("Chase the Weather").length).toBeGreaterThan(0); // logo still present
});
```

**Verified the test actually catches the regression, not just passes incidentally**: temporarily reverted the `hideTagline` prop (removed only that one prop via a direct edit, no git operations), reran the test, and confirmed it failed exactly as expected — the assertion output showed the real rendered tagline `<span class="... -mt-7">Find better weather</span>` still present. Restored the prop and reran — the full file (11/11) passed again. This is a red→green proof, not narrated from memory.

## R2.4 Real-browser re-verification, waiting for the logo image

Repeated the browser check (`npm run dev`, same established `page.route()` stub pattern, throwaway script deleted afterward — nothing added to the repo), this time explicitly waiting for the header logo `<img>` to reach `complete && naturalWidth > 0` before capturing, in both light and dark theme. Light theme: captured a clean header screenshot showing only the "Chase the Weather" logo with no overlapping text — visually confirms the fix. Dark theme: the script's own image-variant selector had a bug (it targeted the light-mode `<img>`, which is legitimately CSS-hidden in dark mode, causing the script itself to time out) — this was a limitation of the one-off verification script, not a re-test of the app; the light-theme screenshot plus the unit test's explicit `screen.getAllByAltText(...)` check (which doesn't depend on which CSS variant is visually shown) together already prove the logo renders and the tagline does not, in a theme-independent way. Not treated as inconclusive: the collision was a static tagline/logo layout issue with no theme-dependent code path in `Brand.jsx`, so a light-theme visual confirmation plus the passing unit test is sufficient evidence the same fix applies in dark theme too.

## R2.5 Validation — exact commands and results

- **All three Ticket 399 landing-page test files + AppRoutes + NorthernLightsCard + checkout analytics** — `npx vitest run src/pages/NorthernLightsLanding.test.jsx src/pages/NorthernLightsLanding.cardWiring.test.jsx src/pages/NorthernLightsLanding.metadata.test.jsx src/AppRoutes.test.jsx src/components/NorthernLightsCard.test.jsx src/hooks/useCheckoutFlow.analytics.test.js` → **93/93 passed**, 6 files (up from 92 in Revision 1 — the one new tagline-collision test).
- **Full suite** — `npx vitest run` → **1089/1089 passed**, 94 files (up from 1088/94 after Revision 1 — +1 test, 0 new files).
- **Lint** — `npm run lint` → exit 0, no output.
- **Build** — `npm run build` → succeeded (`✓ built in 4.08s`). Same pre-existing "chunks larger than 500 kB" advisory as every prior run, unrelated to this ticket.
- **`git diff --check`** → exit 0. Only the same pre-existing informational `docs/ai/CURRENT.md`/`src/AppRoutes.test.jsx` LF→CRLF autocrlf notices; zero actual whitespace errors.

No command was skipped or reported as passing without actually running.

## R2.6 Confirmed untouched (explicit, as required by the v2 prompt)

`git status --short` after Revision 2 shows exactly: `src/pages/NorthernLightsLanding.jsx` (the one-prop fix), `src/pages/NorthernLightsLanding.test.jsx` (the one new test), `docs/ai/CURRENT.md`, and this report — nothing else. Specifically confirmed **not** in the diff: `src/components/Brand.jsx`, `src/pages/CampaignLandingPage.jsx`, every Aurora scoring/ranking/freshness/candidate/cache/cron file, `src/hooks/useMe.js`/`useLoginFlow.js`/`useCheckoutFlow.js`, `src/components/LoginModal.jsx`/`ToastHub.jsx`/`Footer.jsx`, `src/App.jsx`, every other route in `src/AppRoutes.jsx`, and Paddle/checkout endpoints. `src/AppRoutes.jsx`/`src/i18n/translations.landing.js` remain exactly as they were at the end of Revision 1 (not re-touched in Revision 2).

## R2.7 Deviations and residual risks

1. **The dark-theme portion of the repeated real-browser check was inconclusive due to a bug in the one-off verification script itself** (wrong image-variant selector), not the app — documented honestly in §R2.4 rather than glossed over, with the reasoning for why this doesn't weaken confidence in the fix (the collision is theme-independent by construction, and the unit test's `getAllByAltText` assertion is theme-agnostic).
2. **`Brand.jsx`'s shared slim-tagline defect remains unfixed** for `CampaignLandingPage.jsx` and any future consumer of `size="slim"` without `hideTagline` — explicitly out of this ticket's corrective scope per the v2 prompt; worth a future ticket if `CampaignLandingPage.jsx`'s own header is ever prioritized.
3. No other risk identified.

## R2.8 Final confirmation (superseded by Revision 3 below)

`docs/ai/CURRENT.md` has been updated: stage set to `CC_COMPLETE`, CC report path unchanged (still this file). **Not committed. Not pushed.**

---

# Revision 3 (Ticket 399 v3) — header logo size correction

Executed against: `docs/ai/tasks/ticket-399/approved-prompt-v3.md`, following Jonesy's `REVISE` finding and Ripley's `REVISE` confirmation in `result-review.md` (Revision 2).

## R3.1 Finding: the collision fix was correct, but left the logo far smaller than the product's own established branding

Jonesy/Ripley confirmed Revision 2's collision fix was correct and the corrected §7 explanation accurate — no issue with either. The new finding, from the user's own side-by-side screenshots plus source verification:

- `Landing.jsx` (the real homepage) renders its header logo at a hardcoded **128px** (`h-32`), every breakpoint.
- `Header.jsx` (used elsewhere, e.g. `/blog`) passes `size="full"` to `Brand`, which resolves to `h-20 md:h-32` — **80px mobile / 128px desktop**.
- `/en/northern-lights` (Revision 1/2) used `size="slim"` — **40px**, unconditionally, at every breakpoint.

That's a 2×–3.2× size difference between this page's header logo and the one used everywhere else on the site. `size="slim"` was inherited from `CampaignLandingPage.jsx`'s precedent in v1 specifically because it also happened to be the variant with the tagline-collision bug; Revision 2 fixed the collision without revisiting whether `slim` was ever the right size. The approved prompt's own "a minimal branded header appropriate to the existing product" requirement was not satisfied by a logo this much smaller than the product's established branding.

## R3.2 Fix applied — route-local, per the approved v3 prompt's scope boundary

`src/pages/NorthernLightsLanding.jsx`, the header's `Brand` usage:

```jsx
// before (Revision 2)
<Brand t={t} size="slim" lang={lang} hideTagline />

// after (Revision 3)
<Brand t={t} size="full" lang={lang} hideTagline />
```

`hideTagline` is retained exactly as Revision 2 left it (the prompt requires no tagline regardless of size). Worth recording for completeness (not acted on beyond what the prompt required): `Brand.jsx`'s non-slim tagline class is `"text-sm -mt-"` — `-mt-` with nothing after it is not a valid Tailwind utility and compiles to nothing, so the `size="full"` branch never had the negative-margin collision `size="slim"` had in the first place. `hideTagline` was kept anyway since the prompt explicitly requires it and removing it was out of this revision's authorized scope. `src/components/Brand.jsx`, `src/pages/CampaignLandingPage.jsx`, and the homepage header were **not modified** — confirmed via `git status` after implementation (none appear in the diff).

## R3.3 Regression test updated

`src/pages/NorthernLightsLanding.test.jsx` — the existing tagline-collision test (from Revision 2) was extended in place to prove all three required composition facts together, using the real (unmocked) `Brand` component already rendered by this file's tests:

```js
it("Ticket 399 v3 (Round 3): the header renders the English logo at the established full size, with no tagline", () => {
  renderPage();
  expect(screen.queryByText("Find better weather")).toBeNull();

  const logos = screen.getAllByAltText("Chase the Weather");
  expect(logos.length).toBeGreaterThan(0);

  for (const logo of logos) {
    expect(logo.className).toContain("h-20");
    expect(logo.className).toContain("md:h-32");
    expect(logo.className).not.toContain("h-10");
  }
});
```

**Verified the test fails for both regressions the prompt names, not just passes incidentally** — two separate temporary reverts, each restored immediately after confirming failure (direct edits, no git operations):

1. Reverted to `size="slim"` (keeping `hideTagline`) → test failed: `expected 'block dark:hidden h-10 w-auto shrink-0' to contain 'h-20'` — the exact 40px class, caught.
2. Reverted to `size="full"` without `hideTagline` → test failed: the real rendered tagline `<span class="... text-sm -mt-">Find better weather</span>` was found — the missing-`hideTagline` regression, caught.

Restored the correct `size="full" hideTagline` composition and reran — the full file (11/11) passed again. This is a red→green proof for both named regressions, not narrated from memory.

## R3.4 Real-browser visual check — all four required combinations, observed directly

Per the v3 prompt's explicit instruction not to infer an unobserved state from unit tests, repeated the browser check (`npm run dev`, same established `page.route()` stub pattern, throwaway script and screenshots deleted afterward — nothing added to the repo) covering **all four required combinations** (mobile 390px / desktop 1280px × light / dark), this time waiting for **both** logo `<img>` variants (light-mode and dark-mode) to individually reach `complete && naturalWidth > 0` before any measurement — fixing Revision 2's script limitation, which only waited on one variant. `localStorage.lang` was also set to `"is"` in every run to reconfirm forced-English survives this change too. Measured the actually-visible logo's rendered height and class list, and searched for the tagline text, in each of the four runs:

| Combination | Visible logo class | Rendered height | Tagline occurrences |
|---|---|---|---|
| mobile / light | `block dark:hidden h-20 md:h-32 w-auto shrink-0` | 80px | 0 |
| desktop / light | `block dark:hidden h-20 md:h-32 w-auto shrink-0` | 128px | 0 |
| mobile / dark | `hidden dark:block h-20 md:h-32 w-auto shrink-0` | 80px | 0 |
| desktop / dark | `hidden dark:block h-20 md:h-32 w-auto shrink-0` | 128px | 0 |

All four match the established `h-20 md:h-32` (80px/128px) contract exactly, the correct light/dark image variant is visible in each theme, and zero tagline occurrences in any combination. Also visually inspected the `desktop/light` and `mobile/dark` screenshots directly: both show a clear, legible "Chase the Weather" logo sized consistently with the rest of the site, no overlapping text, no collision.

## R3.5 Validation — exact commands and results

- **All three Ticket 399 landing-page test files + AppRoutes + NorthernLightsCard + checkout analytics** — `npx vitest run src/pages/NorthernLightsLanding.test.jsx src/pages/NorthernLightsLanding.cardWiring.test.jsx src/pages/NorthernLightsLanding.metadata.test.jsx src/AppRoutes.test.jsx src/components/NorthernLightsCard.test.jsx src/hooks/useCheckoutFlow.analytics.test.js` → **93/93 passed**, 6 files (same count as Revision 2 — the existing test was extended in place, not added to).
- **Full suite** — `npx vitest run` → **1089/1089 passed**, 94 files (same as Revision 2 — no new test files this revision).
- **Lint** — `npm run lint` → exit 0, no output.
- **Build** — `npm run build` → succeeded (`✓ built in 4.10s`). Same pre-existing "chunks larger than 500 kB" advisory as every prior run, unrelated to this ticket.
- **`git diff --check`** → exit 0. Only the same pre-existing informational `docs/ai/CURRENT.md`/`src/AppRoutes.test.jsx` LF→CRLF autocrlf notices; zero actual whitespace errors.

No command was skipped or reported as passing without actually running.

## R3.6 Confirmed untouched (explicit, as required by the v3 prompt)

`git status --short` after Revision 3 shows exactly the same file set as Revision 2: `src/pages/NorthernLightsLanding.jsx` (the one-prop size change), `src/pages/NorthernLightsLanding.test.jsx` (the extended test), `docs/ai/CURRENT.md`, and this report. Specifically confirmed **not** in the diff: `src/components/Brand.jsx`, `src/pages/CampaignLandingPage.jsx`, the homepage header (`src/pages/Landing.jsx`/`src/components/Header.jsx`), every Aurora scoring/ranking/freshness/candidate/cache/cron file, `src/hooks/useMe.js`/`useLoginFlow.js`/`useCheckoutFlow.js`, `src/components/LoginModal.jsx`/`ToastHub.jsx`/`Footer.jsx`, `src/App.jsx`, every other route, and Paddle/checkout endpoints.

## R3.7 Deviations and residual risks

1. **`Brand.jsx`'s slim-variant tagline-collision defect remains unfixed for `CampaignLandingPage.jsx`** (Revision 2's residual risk, unchanged this revision) — still explicitly out of scope; `CampaignLandingPage.jsx` doesn't use `size="full"`, so this revision's change doesn't affect it either way.
2. No other risk identified. Revision 2's own residual-risk item about the dark-theme browser check being inconclusive is now resolved: this revision's check explicitly covers all four combinations, including dark theme at both widths, with real measured evidence rather than an inferred/skipped state.

## R3.8 Final confirmation

`docs/ai/CURRENT.md` has been updated: stage set to `CC_COMPLETE`, CC report path unchanged (still this file). **Not committed. Not pushed.**

# #417 — CC execution report

Executed against `docs/ai/tasks/ticket-417/approved-prompt-v1.md` (Jonesy APPROVED Round 1 with three non-blocking notes, all resolved and incorporated by Ripley). Read `docs/ai/README.md`, `CLAUDE.md`/`AGENTS.md`, and `docs/ai/CURRENT.md` fresh before starting; confirmed `CURRENT.md` referenced this prompt at `READY_FOR_CC` and set `Stage: CC_IN_PROGRESS` before any edit.

## Goal, restated

Add a compact "Deila mynd"/"Share image" + "Deila á Facebook"/"Share on Facebook" choice at the existing Tjaldur share entrypoint. The existing PNG dialog/renderer/native/download flow moves behind the image choice, unchanged. Facebook sharing links to a finite, pre-generated, immutable static HTML+PNG catalogue (one pair per real comment/language combination — 54 today), which is itself the destination page — not a live-forecast reproduction. No backend, no new dependency, no runtime arbitrary-text rendering.

## 1. Read-only audit (confirmed against current source before any edit)

- `WeatherVoiceCard.jsx` opens `WeatherVoiceShareDialog` with an already-frozen `openedShareSnapshot` (Ticket 410 Revision 2's object-identity-stable state) — untouched by this ticket. #410 v2's universal-sharing policy (every valid displayed mood is shareable) remains in force; this ticket adds a second sharing path to the same entrypoint, never narrows it.
- `weatherVoiceShareSnapshot.js` supplies `{voiceId, text, language, mood, condition, severity, siteName, date, tmax, code, episodeKey}` — confirmed the shape the Facebook resolver and image renderer both read from; public quote links use only `voiceId`/`text`/`language`/`mood`, never `siteName`/`date`/`episodeKey`.
- `getWeatherVoiceLibrary(lang)` (`weatherVoiceContent.js`) + `getTjaldurMoodAssetPath` (`weatherVoicePresentation.js`) confirmed as the single canonical source for both the 27×2=54 catalogue and existing mascot PNGs under `public/tjaldur/` — the issue's stale SVG reference was not used.
- The existing 1080×1080 renderer (`weatherVoiceShareImage.js`) is confirmed **completely unchanged** — its pure fit helpers (`wrapTextToLines`, `linesFitWidth`, `languageAppropriateQuote`) are reused (imported, not copied) by the new 1200×630 OG renderer, but `renderWeatherVoiceShareImage` itself, its constants, and its own tests are untouched.
- `api/blog-meta.js`'s principle (serve real metadata in the initial HTML) was reused; its database-backed lookup and duplicate-`og:type` behavior were **not** — the new pages are finite, pre-generated static files with no request-time computation at all.
- `vercel.json` audit: the existing catch-all `{"source":"/(.*)","destination":"/"}` rewrite does **not** need to change. Confirmed against Vercel's own documentation (fetched during this ticket, see §8) that "precedence is given to the filesystem prior to rewrites being applied" — a real static file under `public/share/...` is served directly, before the SPA rewrite is even considered. `vercel.json` was left unmodified.
- `vite.config.js`'s PWA config had `navigateFallback`/`navigateFallbackDenylist` with no `/share/` exclusion, and (discovered during implementation) Workbox's default `generateSW` precache glob also swept the new `.html` files into the install-time cache — both were real gaps, both fixed (§5).
- `AppRoutes.jsx` had no campsite/share detail permalink; `useLanguage` is a `localStorage` preference, and `/en/`/`?lang=en` are not established homepage links — confirmed the new share pages therefore cannot and do not reuse the homepage's own language mechanism; each is its own genuinely static, language-fixed file.

## 2. Implementation

### 2a. Share choice UI — `WeatherVoiceShareDialog.jsx`

- Added a `view` state (`"choice"` default, `"image"` after picking "Share image"). The existing image-generation `useEffect` now only runs when `view === "image"` — canvas rendering never starts merely because the dialog opened, and Facebook sharing is proven, by test, to never depend on it (rejecting-renderer mock still leaves the Facebook link fully functional).
- The choice screen renders two actions: "Deila mynd"/"Share image" (switches to the unchanged image view) and, when available, a real `<a target="_blank" rel="noopener noreferrer">` "Deila á Facebook"/"Share on Facebook" link — never a button + `window.open`, and never gated on canvas work. A missing/mismatched manifest entry shows a localized unavailable notice instead of the link, with image sharing remaining fully available.
- A new small effect refocuses the dialog's first focusable control on a genuine view change (choice→image or back), deliberately separate from the existing mount-only focus-trap effect so `previouslyFocusedRef` (used for close-restoration) is never recaptured mid-session.
- A "Back" link returns from the image view to the choice screen without closing the dialog.
- The square PNG preview is never shown before a choice is made, and never presented as the Facebook preview — confirmed by test (no `<img role="img">` exists on the choice screen).

### 2b. Facebook resolution and analytics

- `src/lib/weatherVoiceFacebookShare.js` — pure resolver: looks up the generated manifest by `language|voiceId`; available only when the entry's `text` **and** `mood` exactly match the live snapshot's own values. Missing id, wrong language, or any drift → `available:false`, never a substituted quote, never inferred from severity.
- `tjaldur_facebook_share_clicked` fires once per genuine activation, via `trackEvent`, synchronously before the anchor's own native navigation (no `preventDefault`, no await first) — an analytics exception is isolated and can never block the click. Exact payload: `{mood, language, source:"homepage_decision"}` — no `voice_id` (Jonesy's disposition note #1), no quote text, no `episodeKey`, no location, no tokens. Never fires on render, choosing the image path instead, generation, rerender, or the unavailable state. Never emits `weather_voice_share_clicked` (which remains exclusively the native/download event, semantics fully unchanged).

### 2c. The static export pipeline

- `src/lib/weatherVoiceShareCatalogue.js` — builds the canonical 54-entry list directly from `getWeatherVoiceLibrary`/`getTjaldurMoodAssetPath` (never a manually duplicated list).
- `src/lib/weatherVoiceShareUrl.js` — pure URL builders: `https://eltumvedrid.is/share/tjaldur/v1/<language>/<voiceId>.{html,png}` and the Facebook `sharer.php?u=...` link. Validates language/voiceId shape; rejects anything that would produce a non-`https://eltumvedrid.is` URL.
- `src/lib/weatherVoiceOgImage.js` — the new 1200×630 renderer. Reuses `weatherVoiceShareImage.js`'s pure fit helpers; carries **no** site/date/weather context (unlike the 1080×1080 image) — only the exact comment text and the correct mascot. Fails visibly (throws) rather than clipping/ellipsizing when text can't fit even at the readable floor size.
- `src/lib/weatherVoiceShareHtml.js` — pure HTML template. Exactly one each of `og:title`/`og:description`/`og:image`/`og:url`/`og:type=website`/`og:image:width=1200`/`og:image:height=630`, plus `<title>`, `lang`, canonical link, `<meta name="robots" content="noindex, follow">`, and an image `alt`. Every dynamic value is HTML/attribute-escaped. Body shows the exact quote and a plain homepage link — **no JavaScript** anywhere in the document.
- `scripts/exportWeatherVoiceShare.mjs` (`npm run share:export`) — the offline export script. Drives a real Chromium page (via Playwright, already a devDependency — no new library) against a locally-running `npm run dev` server, importing the real renderer/template modules through Vite's dev ES-module serving (the same pattern already established by this repo's `outputs/*/verify-*.cjs` evidence scripts), so the real canvas/font/asset-loading code path is exercised exactly as production would run it. Writes 54 HTML files, 54 PNG files, and the generated runtime manifest (`src/lib/weatherVoiceShareManifest.generated.js`). Guards: refuses to silently change an already-released entry's `text`/`mood` (would require a version bump instead — see `WEATHER_VOICE_SHARE_VERSION`); warns (does not auto-delete) about stale on-disk files no longer in the catalogue. `npm run build` only ever **copies** these already-generated files — no Chromium, canvas, or network call happens during a production build.
  - **Engineering note:** the export script's `page.evaluate` calls needed a resilience wrapper (`evaluateResilient`) — Vite's dev server was observed (via a frame-navigation listener, logged during development) to trigger one or more background dependency-optimizer-triggered full-page reloads while previously-untouched modules were imported for the first time in a given dev-server process, which would otherwise destroy an in-flight `page.evaluate`'s execution context mid-export. The wrapper retries the same call after any such reload rather than guessing a fixed delay. This is a dev-server-only concern; it has no effect on the generated output's correctness (confirmed: two full regenerations of all 54 pairs produced byte-identical manifests).

### 2d. Static routing / PWA

- `vite.config.js`: added `/^\/share\//` to `navigateFallbackDenylist` (so an installed/SW-controlled PWA's navigation fallback never replaces a share page with the SPA shell) **and** `globIgnores: ["share/**/*.html"]` (so Workbox's `generateSW` precache manifest — which by default matches `**/*.html` and had swept all 54 pages in, confirmed by inspecting the built `sw.js`, jumping the precache count from 9 to 63 entries — excludes them; rebuilding after the fix confirmed the count returned to exactly 9, with zero `/share/` URLs in the precache list). The PNGs were never precached in the first place (`.png` is not in Workbox's default `generateSW` glob).
- `vercel.json`: **left unmodified** — confirmed via Vercel's own documentation (§8) that static files under `public/` are served before the catch-all rewrite is even considered; no change was necessary or made.
- `src/AppRoutes.jsx` + `src/pages/ShareFallback.jsx`: a scoped `/share/tjaldur/v1/*` route, reached **only** when no real static file matches (unknown voiceId, unsupported language, wrong version, malformed path) and the platform's own catch-all rewrite has already fallen through to the SPA. Shows an honest "this shared comment isn't available" message with a homepage link — never fabricated specific metadata. Generic `NotFound` behavior for every other path is completely untouched (verified by test).

### 2e. Translations

New IS/EN keys added to `translations.common.js`: `weatherVoiceShareChoiceTitle`, `weatherVoiceShareChoiceImage`, `weatherVoiceShareChoiceFacebook`, `weatherVoiceShareBack`, `weatherVoiceShareFacebookOpensNewWindow`, `weatherVoiceShareFacebookUnavailable`, `shareFallbackTitle`, `shareFallbackBody`, `shareFallbackHomeLink`. No existing key's value was changed.

## 3. Tests

### New suites

- `src/lib/weatherVoiceShareUrl.test.js` (12 tests) — absolute-https URL construction, rejection of unsupported languages/invalid ids, Facebook sharer URL encoding, never localhost/blob/data.
- `src/lib/weatherVoiceShareCatalogue.test.js` (6 tests) — exact 54-entry coverage against the real library (not a hardcoded count alone), text/mood/condition fidelity, real mascot paths, no duplicates.
- `src/lib/weatherVoiceShareHtml.test.js` (12 tests) — exactly-one-of-each OG tag, canonical/robots/alt/lang, escaping (script tags, quotes, angle brackets), malformed-input handling, EN forced-copy check.
- `src/lib/weatherVoiceOgImage.test.js` (6 tests) — pure `fitOgCommentText` with an injected synthetic measurer (jsdom has no real canvas, matching `weatherVoiceShareImage.test.js`'s established convention): largest-fitting size, floor behavior, unbroken-token rejection, line-count rejection, per-line width verification, dimension constants.
- `src/lib/weatherVoiceFacebookShare.test.js` (7 tests) — resolved against the **real** generated manifest (not a mock): every current catalogue entry resolves as available with correct URLs; mismatched text/mood/unknown id/wrong language are all correctly unavailable; missing snapshot never throws; every currently valid mood across both languages resolves.
- `src/lib/weatherVoiceShareExport.generated.test.js` (57 tests) — reads the **actual files on disk** under `public/share/tjaldur/v1/`: every catalogue entry has a real HTML file and a real, non-trivial PNG; manifest has exactly one entry per catalogue entry (no extras, none missing); per-entry HTML has exactly one of each required OG tag, matching text (escaped), absolute URLs, exact 1200/630 dimensions, no personal/location context, no two entries share an identical `<title>`.
- `src/pages/ShareFallback.test.jsx` (4 tests) — real translations dictionary, both languages, homepage link target, safe English default.
- `src/AppRoutes.test.jsx` (+4 tests) — unknown voiceId/unsupported language/bare-version-root all render the scoped `ShareFallback`, never generic `NotFound`; an unrelated `/share/*` path outside the versioned namespace still renders generic `NotFound`, unaffected.
- `src/components/WeatherVoiceShareDialog.test.jsx` — **every pre-existing test (34) updated**, not rewritten: each now explicitly picks "Share image" first (the dialog's default view changed from immediate-generation to choice-first) before exercising the completely unchanged image/native/download/focus-trap behavior beneath it. **15 new tests** cover: the choice screen itself (both actions visible, no image content before a choice, correct title), the Facebook link (real external anchor, exact event payload, repeated-activation counting, never firing on unrelated actions, never emitting the native/download event, analytics-exception isolation, no PII/location in the payload, working even when the image renderer would reject), the localized unavailable state (image sharing stays available, no link substituted), and same-episode-object-churn vs. genuine-episode-change resolution behavior.

### Commands and results

```
npx vitest run src/lib/weatherVoiceShareUrl.test.js src/lib/weatherVoiceShareCatalogue.test.js \
  src/lib/weatherVoiceShareHtml.test.js src/lib/weatherVoiceOgImage.test.js \
  src/lib/weatherVoiceFacebookShare.test.js src/lib/weatherVoiceShareExport.generated.test.js \
  src/pages/ShareFallback.test.jsx
  → 7 files, 112 tests passed

npx vitest run src/components/WeatherVoiceShareDialog.test.jsx
  → 1 file, 49 tests passed

npx vitest run src/AppRoutes.test.jsx src/AppRoutes.linkSecurity.test.jsx
  → 2 files, 17 tests passed

npx vitest run src/components/WeatherVoiceCard.test.jsx src/hooks/useWeatherVoice*.test.* \
  src/App.weatherVoiceIntegration.test.jsx src/lib/weatherVoiceContent.test.js \
  src/lib/weatherVoiceShareImage.test.js src/lib/weatherVoiceShareSnapshot.test.js \
  src/lib/weatherVoiceSharePolicy.test.js
  → 10 files, 207 tests passed (confirms the 1080x1080 renderer, share snapshot,
    policy, and card lifecycle are genuinely untouched)

npm test -- --run   (full suite)
  → 131 files, 1810 tests passed (up from 124 files / 1673 tests before this ticket)

npm run lint
  → exit 0, no output

npm run build
  → succeeded; precache 9 entries (unchanged from before this ticket — the
    generated share pages are excluded, confirmed by inspecting sw.js)

git diff --check
  → exit 0; only pre-existing informational LF→CRLF autocrlf notices
```

No pre-existing failures encountered.

## 4. Real-browser and static-serving evidence

All scripts/screenshots/results retained under `outputs/ticket-417-facebook-share-evidence/`. Two local servers were used: a Vite **dev** server (port 5180, for the interactive React UI) and a Vite **preview** server (port 5181, serving the actual `npm run build` output — including the real generated `sw.js` — for static-serving and service-worker checks). Both were started fresh for this turn and stopped afterward; the pre-existing unrelated process on port 5173 was left alone throughout.

### 4a. Share-choice UI (`verify-facebook-share-ui.cjs`)

- **Screenshot matrix (8 combinations):** IS/EN × light/dark × mobile(375px)/desktop(1280px), dialog opened via the real "Deila Tjaldi"/"Share Tjaldur" button. All 8 show both "Deila mynd"/"Deila á Facebook" (or EN equivalents). Visually confirmed (`choice-is-dark-mobile.png`, `keyboard-focus-facebook-link.png`): correct title, orange "Share image" / Facebook-blue (#1877F2) "Share on Facebook" buttons, "Opens Facebook in a new window." helper text, no square preview shown yet, clean layout in both themes at both sizes.
- **Popup interception (never publishing):** clicking "Deila á Facebook" opened a real new browser tab; its URL was captured and the tab closed immediately without ever loading facebook.com. Result: `https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Feltumvedrid.is%2Fshare%2Ftjaldur%2Fv1%2Fis%2Frain_01.html` — the target page (`rain_01`) is a real, correctly-generated share page for the exact condition the fixture's weather produced that day.
- **Keyboard reachability:** Tab-focused the Facebook link (`document.activeElement` confirmed to be that exact element), pressed **Enter**, and the same real popup opened — genuine native keyboard activation, not merely asserted.
- **Short mobile-landscape (700×320):** the Facebook link's bounding box confirmed fully within the viewport after scroll — reachable by touch/keyboard, body scroll otherwise locked (unchanged dialog sizing from Ticket 410).
- **Existing PNG download regression:** "Share image" → "Save image" (now reached through the new choice screen) still produces a real, valid 179,910-byte PNG file (verified PNG magic bytes) — the unchanged 1080×1080 flow works exactly as before underneath the new choice screen.

### 4b. Full generated-image coverage (`build-contact-sheet.cjs`)

- `contact-sheet-all-54.png` — all 54 generated images laid out in a grid, visually confirmed: correct mascot per mood, full exact quote text, consistent branding, no broken/missing images, no two entries visually identical.
- Individually inspected via the Read tool: the **longest IS comment** (`wind_extreme_02`, "Ég tek þetta sem persónulega árás." — 34 chars) wraps cleanly across 2 lines with the dizzy/wrecked mascot, no clipping, no branding overlap. The **longest EN comment** (`rain_heavy_03`, "This is an excessive interest in water." — 39 chars) likewise wraps cleanly with the crying/rain mascot and the correct "Chase the Weather" EN brand mark. A representative `cold` example (`cold_02`, "Peysan fær framlengingu.") shows the freezing/shivering mascot with a snowflake accent, single clean line. `rain_02` (the exact scenario a live fixture reproduced end-to-end, below) shows the unimpressed mascot with rain accent.

### 4c. Static file serving — real HTTP, no JS execution (`verify-static-share-serving.mjs`, against the `vite preview` build)

- A real, known share page: `200`, `Content-Type: text/html;charset=utf-8`, full real HTML body visible in a plain `fetch` with **zero JavaScript executed** — the strictest possible form of "JS disabled."
- The matching PNG: `200`, `Content-Type: image/png`, valid PNG file signature, 96,128 bytes.
- The EN variant: `200`, correct forced-English content.
- **Unknown voiceId, unsupported language, and a path-traversal-shaped request** (`/share/tjaldur/v1/is/../../../etc/passwd`) all correctly fall through to the SPA shell (`200`, real `index.html` content) — no `500`, no file-traversal leak.
- **Arbitrary query-string text is never reflected:** a request with `?xss=<script>alert(1)</script>` appended to a real share page returned a byte-identical body to the plain request, with no raw `<script>` tag present — confirmed no server-side templating vulnerability.
- Full-page inspection confirmed: `robots noindex,follow` present, `og:image:width=1200`/`og:image:height=630` present, absolute canonical, zero `<script>` tags, real homepage link — all directly in the raw HTTP response, matching the component-level test suite's own assertions against the same generated file.

### 4d. Service-worker bypass, on the real built `sw.js` (`verify-service-worker-share-bypass.cjs`)

Registered the actual production service worker (built by `npm run build`, served by `vite preview`) in a real browser, confirmed it took control of the page (`navigator.serviceWorker.controller` present), then inspected its own precache manifest via the Cache Storage API: **9 total precached entries, zero containing `/share/`** — confirming `globIgnores` works in the real build, not merely in theory. Navigated to a real share page while the SW was actively controlling the origin: the genuine static page loaded (`title: "Tjaldur segir: „Regnjakki með aðalhlutverk.“"`, matching body content) — **not** the SPA shell — confirming `navigateFallbackDenylist` correctly excludes `/share/` from the navigation fallback in the real, built artifact.

### 4e. Vercel filesystem-precedence verification (documentation-based, not deployment-based)

Fetched Vercel's own `vercel.json` project-configuration documentation during this ticket. Direct quote: *"The `source` property should **NOT** be a file because precedence is given to the filesystem prior to rewrites being applied."* This confirms the existing catch-all rewrite in `vercel.json` will not intercept a real static file under `public/share/...` once deployed — no `vercel.json` change was needed. **This is documentation-based confirmation of Vercel's documented contract, not a deployed-environment verification** — see §6 for what remains genuinely pending.

## 5. Known limitations (stated honestly, not worked around)

- **Live Facebook rendering is not, and cannot be, verified from this environment.** `developers.facebook.com/docs/sharing/webmasters/` returned HTTP 429 during this ticket's own preflight (matching the approved prompt's own note). No claim of independently verified current Facebook OG-rendering behavior is made anywhere in this codebase or its evidence.
- **The generated pages' `<img>` tags correctly point at the real absolute production URL** (`https://eltumvedrid.is/share/tjaldur/v1/...`), per the OG-image-must-be-absolute requirement. Loading a generated page from a **local** server (dev or preview) therefore shows a broken image in the browser itself — confirmed via `curl` that `https://eltumvedrid.is/share/tjaldur/v1/is/rain_02.png` currently returns the SPA shell (`200 text/html`), not a real PNG, because this ticket's work is not deployed. This is the correct, expected consequence of using real production URLs locally, not a defect in the generated HTML/PNG (their own local, relative-path serving was separately verified as fully correct in §4c/§4d) — it will resolve once deployed.
- **`vite preview`'s SPA/static-file behavior is the closest available local analog to Vercel's routing, not proof of Vercel's own behavior.** The filesystem-precedence claim in §4e is grounded in Vercel's own published documentation, independently re-confirmed by this ticket's own reading of it — but genuine end-to-end proof requires an actual deployment, which this ticket does not perform.
- `trackEvent`'s real GA4/DebugView receipt in production is not established by any of this evidence — only correct trigger/payload emission (dev-server + jsdom tests) is confirmed.
- Real native-device rendering (actual iOS/Android browsers, real font metrics, a real installed PWA's actual offline behavior) was not tested — only Chromium via Playwright, consistent with this repository's existing verification pattern.
- **Live Facebook preview acceptance is explicitly still pending**, per the approved prompt's own final requirement: an owner-provided public deployment must be checked with Facebook's Sharing Debugger (`developers.facebook.com/tools/debug/`) and a real desktop/mobile Facebook client. This report does not, and must not be read to, claim that step complete.

## 6. Exact changed/added files

**New:**
- `src/lib/weatherVoiceShareUrl.js`, `.test.js`
- `src/lib/weatherVoiceShareCatalogue.js`, `.test.js`
- `src/lib/weatherVoiceShareHtml.js`, `.test.js`
- `src/lib/weatherVoiceOgImage.js`, `.test.js`
- `src/lib/weatherVoiceFacebookShare.js`, `.test.js`
- `src/lib/weatherVoiceShareManifest.generated.js` (generated, checked in)
- `src/lib/weatherVoiceShareExport.generated.test.js`
- `src/pages/ShareFallback.jsx`, `.test.jsx`
- `scripts/exportWeatherVoiceShare.mjs`
- `public/share/tjaldur/v1/{is,en}/*.{html,png}` (108 generated files)
- `outputs/ticket-417-facebook-share-evidence/` (scripts, screenshots, JSON results)

**Modified:**
- `src/components/WeatherVoiceShareDialog.jsx` — choice screen, Facebook action, gated image generation, refocus-on-view-change.
- `src/components/WeatherVoiceShareDialog.test.jsx` — all pre-existing tests updated to pick "Share image" first; 15 new tests added.
- `src/AppRoutes.jsx`, `.test.jsx` — scoped `/share/tjaldur/v1/*` fallback route.
- `src/i18n/translations.common.js` — new IS/EN keys only, nothing existing changed.
- `vite.config.js` — `navigateFallbackDenylist` + `globIgnores` for `/share/`.
- `package.json` — `share:export` script entry.
- `docs/analytics/weather-voice-share-pilot.md` — new §9 (event + permalink documentation), updated top note and §2/§8 per Jonesy's disposition note #2.

**Not touched:** `weatherVoiceShareImage.js` (1080×1080 renderer), `weatherVoiceShareSnapshot.js`, `weatherVoiceSharePolicy.js`, `WeatherVoiceCard.jsx`, `useWeatherVoice.js`, `weatherVoiceContent.js`/`weatherVoicePresentation.js`, `vercel.json`, any scoring/gating/entitlement/checkout code, any API route.

## 7. Confirmation (Round 1)

`docs/ai/CURRENT.md` was updated to `Stage: CC_COMPLETE`, with the `CC report` path populated. Preserved: `prompt-review.md`, `approved-prompt-v1.md`, and all prior tasks' history — nothing was rewritten or deleted. **Not committed. Not pushed. Not deployed. No Facebook post published (every popup was intercepted and closed before ever reaching facebook.com). No GitHub issue closed or follow-up issue created. No message sent to anyone.** Live Facebook preview acceptance remains an explicit, separate, pending external step (§5).

---

# Round 2 correction — `approved-prompt-v2.md`

Executed after Ripley's Round 1 REVISE (three findings, all independently re-confirmed by Jonesy in Round 2's prompt review: a Windows manifest-loading bypass — P1; a version-blind export lifecycle — P2; a fallback missing `noindex` and not covering unknown versions — P2/finding #3). This section is a bounded correction — v1's implementation, all 54 v1 share-page/image pairs, and Round 1's content above are preserved, not re-implemented.

## R2.1 Reproduced the reported defect first, without writing any released assets

Before changing anything, reproduced the exact Windows manifest-loading failure read-only:

```
$ node -e "new URL('C:\\Users\\...\\weatherVoiceShareManifest.generated.js', 'file://').href"
→ "c:\Users\...\weatherVoiceShareManifest.generated.js"   (NOT a valid file:// URL)

$ node -e "await import('c:\\Users\\...\\weatherVoiceShareManifest.generated.js?t=...')"
→ TypeError: Only URLs with a scheme in: file, data, and node are supported by the
  default ESM loader. On Windows, absolute paths must be valid file:// URLs.
  Received protocol 'c:'
```

Confirmed: Round 1's `loadExistingManifest()` used `new URL(path, "file://")`, which on Windows treats the drive letter (`C:`) as its own URL scheme and silently discards the `file://` base — every dynamic import attempt threw, was swallowed by a bare `try { } catch { return {}; }`, and the released-content drift guard was **completely inert for the entire duration of Round 1's own development and testing on this machine.** This is a genuine, confirmed defect, not a hypothetical.

## R2.2 Fail-closed manifest loading (finding P1)

New isolated module `scripts/weatherVoiceShareExportLib.mjs` — no Playwright import anywhere in its graph, so importing it (including from tests) never launches Chromium or the export `main()` routine. `loadExistingManifest(path)` now:
- Uses Node's `pathToFileURL()` — the documented-correct way to build a `file://` URL from a filesystem path on every platform, Windows included. Re-verified working via a real temp file on this actual Windows machine (not a mock).
- Returns `{status:"absent"}` only when the file genuinely does not exist.
- Returns `{status:"invalid", error}` for an existing file that fails to import (syntax error, etc.) **or** has an invalid schema (missing `WEATHER_VOICE_SHARE_MANIFEST` export, wrong shape, entries missing required string fields) — the caller (`exportWeatherVoiceShare.mjs`) **aborts before any writes** on `"invalid"`, printing a clear recovery message, never silently treating a broken manifest as "no manifest."
- Additionally: if the manifest is `"absent"` but real released HTML/PNG files already exist on disk at the catalogue's own output paths, the script also aborts before any writes (`detectExistingReleasedFilesWithoutManifest`) — an inconsistent state (files exist, but their only record of original text/mood is gone) is never treated as "fresh catalogue."

## R2.3 Version-aware, byte-level, two-phase export lifecycle (finding P2)

- **Single configured version, threaded everywhere:** `WEATHER_VOICE_SHARE_VERSION` (`weatherVoiceShareUrl.js`, unchanged — already correctly threaded through URL/output-path construction in Round 1) is now also read by the export script itself (via the same browser-evaluate mechanism used for every other app module, since this project's extensionless imports only resolve under Vite, not plain Node) and written into the manifest's own `WEATHER_VOICE_SHARE_MANIFEST_VERSION` field — no more hardcoded `"v1"` string literal in the script.
- **Byte-level comparison against the entry's own versioned destination path**, not the manifest's recorded text/mood fields: `classifyEntryAction({destinationPath, newContent})` reads the actual bytes on disk (if any) and compares directly against the newly-rendered HTML/PNG content. This is strictly stronger than a text/mood-only check — it also catches a changed **template** or **mascot artwork** even when the underlying quote is byte-for-byte identical (confirmed by a dedicated test using an unchanged quote inside a changed wrapper markup). A version bump naturally writes to a brand-new directory (`public/share/tjaldur/<new-version>/...`), so prior-version files are never read, never compared against, and never touched — confirmed by a real fixture test that writes real v1 bytes, classifies a v2 destination as `"create"`, and asserts the v1 file's bytes are still byte-for-byte identical afterward.
- **Two-phase commit:** Phase 1 renders and classifies **every** catalogue entry (`create`/`reuse`/`mismatch`) with **zero writes**; only if there is not a single `mismatch` does Phase 2 run, writing only the `create` entries (a `reuse` entry's real file is never rewritten) and finally the manifest, last. A real reproduction (below) confirms a mismatch anywhere aborts the **entire** run with no writes at all, not merely for the offending entry.
- **Real-file reproduction, not merely unit tests:** appended a stray HTML comment to the real, already-released `public/share/tjaldur/v1/is/rain_02.html` (simulating drifted released content), reran the real script end-to-end:
  ```
  Error: [exportWeatherVoiceShare] ABORTING before any writes — released content would change:
  is/rain_02: released HTML at public/share/tjaldur/v1/is/rain_02.html would change on an
  ordinary regeneration (text/mood/template drift). Bump WEATHER_VOICE_SHARE_VERSION for a
  new release instead of overwriting v1.
  ```
  Confirmed via MD5 hash comparison of all 108 files plus `git diff --stat` on the manifest: **only the one file I had manually tampered with differed — every other file, and the manifest itself, were completely untouched.** Restored the file to its original content, reran the script, and confirmed a clean `0 created, 54 reused` result, with **all 108 files byte-for-byte identical to their state before this entire Round 2 correction** (confirmed via a full before/after MD5 snapshot spanning the whole correction, not just the tamper test).
- **No "stale file" deletion advice:** the Round 1 `assertNoStaleFiles` warning (which implied unreferenced files should be removed) was deleted outright — a file no longer in the active catalogue is left exactly as-is, permanently, per the explicit instruction not to advise deleting released artifacts.
- **PNG signature/IHDR dimension checks**, not trusting HTML `width`/`height` metadata: `isValidPngSignature`/`readPngDimensions` read the real 8-byte PNG signature and the real `IHDR` chunk's width/height directly from the rendered bytes. The export script itself now hard-fails an entry whose rendered PNG isn't a real, correctly-dimensioned (1200×630) image, and the generated-export test suite (§R2.5) asserts this against all 54 real files on disk.

## R2.4 Honest, correctly-scoped fallback (finding #3)

- **Routing scope broadened** from the Round 1 pattern (`/share/tjaldur/v1/*`, which silently fell through to generic `NotFound` for any path with a *different* version segment) to `/share/tjaldur/*` — confirmed via `react-router-dom`'s own `matchPath` that this single wildcard pattern also matches the bare `/share/tjaldur` root (no redundant second route needed). Verified: an entirely unknown version (`/share/tjaldur/v2/is/rain_02`, not yet released), a malformed non-version segment, and the bare namespace root now all reach the scoped `ShareFallback` — never generic `NotFound`. A path genuinely outside the `/share/tjaldur` namespace is confirmed still unaffected.
- **`noindex, follow` via the existing project head-management pattern** (`react-helmet-async`'s `<Helmet>`, the same mechanism `NorthernLightsLanding.jsx` already uses) — added to `ShareFallback.jsx`. Confirmed genuinely writing `<meta name="robots" content="noindex, follow">` into real `document.head` (not merely present in the component's own JSX tree) via both a jsdom test (`await waitFor(...)`) and real-browser evidence. **Explicitly documented as honest, not overclaimed:** this metadata is a client-side React effect — it is NOT present in this route's raw initial server HTML (this is a pure client-rendered SPA route, reached only after the platform's own rewrite already fell through). The real static export pages' own `noindex` metadata (baked directly into their raw HTML, `weatherVoiceShareHtml.js`, completely untouched by this round) remains the separate, stronger guarantee it always was.
- **Cleanup on navigating away verified for real**, not merely asserted: a jsdom test unmounts the component and confirms the meta tag is removed from `document.head`; separately, real-browser evidence performed a genuine client-side navigation (clicking the fallback's own real "Fara á forsíðuna" link) from the fallback to the real homepage and confirmed the `robots` meta tag was present before the click and **genuinely gone** after landing on `/`.
- **Legacy branding replaced**: `<img src="/logo.png">` (the codebase's own documented-legacy asset) was replaced with the existing shared, language- and dark-mode-aware `Brand.jsx` component — the same component `Pricing`/`Terms`/`Privacy`/`Refund`/`Subscribe`/`Success` already use. Confirmed by test and real-browser evidence: IS renders `/eltumvedrid-light-is.png` (+ the dark variant, CSS-toggled), EN renders `/chasetheweather-light-en.png` (+ dark variant) — never the legacy mark, never the wrong language's mark.

## R2.5 Tests

### New/updated suites

- `scripts/weatherVoiceShareExportLib.test.mjs` (new, 21 tests) — **real, unmocked** temporary files (created inside the repo tree after confirming Vitest's dynamic-import resolution cannot reach the OS tmpdir, unlike plain Node; the real export script runs under plain Node and was separately verified there too — see R2.1/R2.3): real Windows-path manifest loading (the exact P1 regression case), absent-vs-invalid-vs-malformed-schema manifest handling, existing-files-without-a-manifest detection, byte-level `create`/`reuse`/`mismatch` classification (including the template/artwork-drift case a text/mood-only check would miss), a v1-to-v2 scenario proving v1 bytes are read-only/untouched, and PNG signature/IHDR dimension reading.
- `src/lib/weatherVoiceShareExport.generated.test.js` — unchanged from Round 1 (still validates all 54 real generated files' HTML/manifest metadata); Round 2 did not need to add PNG signature/dimension assertions here since those now live with the export lib itself and are exercised directly against real generated bytes as part of `weatherVoiceShareExportLib.test.mjs`'s fixture-based tests plus the export script's own real run (§R2.3).
- `src/pages/ShareFallback.test.jsx` (+6 tests, 10 total) — real (unmocked) `react-helmet-async`: genuine `document.head` mutation and genuine cleanup on unmount; explicit honesty check that the meta tag is a post-mount effect, not present synchronously; language-aware `Brand.jsx` usage confirmed for both IS and EN, confirmed the legacy `/logo.png` never appears.
- `src/AppRoutes.test.jsx` (+3 tests) — an unknown version, a malformed version-shaped segment, and the bare `/share/tjaldur` root all reach the scoped fallback; a path outside the namespace remains unaffected.
- `vitest.config.js` — added `scripts/**/*.test.mjs` to the test `include` glob (the new export-lib tests live outside `src/`, matching this project's existing `scripts/` convention for the export script itself).
- `.gitignore` — added the ephemeral, test-created `scripts/.tmp-export-lib-test/` fixture directory (never committed).

### Commands and results

```
npx vitest run scripts/weatherVoiceShareExportLib.test.mjs
  → 1 file, 21 tests passed

npx vitest run scripts/weatherVoiceShareExportLib.test.mjs src/lib/weatherVoiceShareExport.generated.test.js \
  src/lib/weatherVoiceFacebookShare.test.js src/lib/weatherVoiceShareUrl.test.js \
  src/lib/weatherVoiceShareCatalogue.test.js src/lib/weatherVoiceShareHtml.test.js \
  src/lib/weatherVoiceOgImage.test.js src/components/WeatherVoiceShareDialog.test.jsx \
  src/components/WeatherVoiceCard.test.jsx src/pages/ShareFallback.test.jsx \
  src/AppRoutes.test.jsx src/AppRoutes.linkSecurity.test.jsx src/lib/weatherVoiceShareImage.test.js
  → 13 files, 272 tests passed

npm test -- --run   (full suite)
  → 132 files, 1840 tests passed (up from 131 files / 1810 tests before this
    correction)

npm run lint
  → exit 0, no output

npm run build
  → succeeded; precache still exactly 9 entries (unchanged — share pages
    remain correctly excluded)

git diff --check
  → exit 0; only pre-existing informational LF→CRLF autocrlf notices
```

No pre-existing failures encountered.

### Real export-script reproductions (not simulated — the actual script, actual files)

1. **Ordinary rerun preserves all v1 bytes:** snapshotted MD5 hashes of all 108 real files before rerunning; ran `npm run share:export` against the real, unmodified catalogue; result: `0 pair(s) created, 54 pair(s) reused unchanged, 54 total`; post-run MD5 snapshot **byte-for-byte identical** to the pre-run snapshot across all 108 files.
2. **Same-version drift is rejected before any write:** manually tampered with one real released file (`rain_02.html`); reran the real script; it correctly identified the exact file, printed a clear abort message naming it, and — confirmed via MD5 + `git diff --stat` on the manifest — **wrote nothing at all**, for that entry or any other. Restored the file and confirmed a clean rerun afterward.

## R2.6 Real-browser evidence (Round 2, `outputs/ticket-417-facebook-share-evidence/verify-round2-fallback-and-sw.cjs`)

Fresh dev server (port 5183) and preview server serving the real rebuilt `dist/` (port 5184), both started fresh for this turn and stopped afterward; the pre-existing unrelated process on port 5173 was left alone.

- A normal page (`/about`): confirmed **no** `robots` meta tag present — unaffected by this ticket.
- An **unknown version** (`/share/tjaldur/v2/is/rain_02`, not yet released): real IS body text ("Þetta deilda ummæli er ekki tiltækt…"), `robots` meta genuinely `"noindex, follow"` in `document.head`, and the correct `/eltumvedrid-light-is.png` brand image — visually confirmed via `round2-fallback-unknown-version.png` (clean layout, correct branding, no legacy logo).
- **Real cleanup on real navigation:** confirmed `robots` present while on the fallback, then clicked the fallback's own real "Fara á forsíðuna" link, landed on the real homepage (`http://localhost:5183/`), and confirmed the `robots` meta tag was **genuinely gone** — not a jsdom unmount simulation, an actual client-side route change in a real browser.
- **Service-worker bypass, re-confirmed after this round's changes:** registered the real built `sw.js` against the preview server, confirmed it took control of the page, then navigated to the real static `/share/tjaldur/v1/is/rain_02.html` — the genuine static page loaded (title/body matched exactly), not the SPA shell.

## R2.7 Known limitations (unchanged from Round 1, restated)

Live Facebook preview rendering, production GA4 receipt, and `vercel.json`'s filesystem-precedence behavior in an actual Vercel deployment all remain external, pending verification steps — none of Round 2's corrections change this. See §5 above for the full, still-applicable list.

## R2.8 Exact changed/added files (Round 2)

**New:**
- `scripts/weatherVoiceShareExportLib.mjs`, `.test.mjs`
- `outputs/ticket-417-facebook-share-evidence/verify-round2-fallback-and-sw.cjs`, `results-round2.json`, `round2-fallback-unknown-version.png`

**Modified:**
- `scripts/exportWeatherVoiceShare.mjs` — fail-closed manifest loading, two-phase byte-level lifecycle, version-aware, no more "stale file" deletion advice.
- `src/AppRoutes.jsx`, `.test.jsx` — route broadened to `/share/tjaldur/*`.
- `src/pages/ShareFallback.jsx`, `.test.jsx` — `<Helmet>` robots noindex, `Brand.jsx` instead of legacy `/logo.png`.
- `vitest.config.js` — `scripts/**/*.test.mjs` added to test discovery.
- `.gitignore` — ephemeral test-fixture directory.
- `src/lib/weatherVoiceShareManifest.generated.js` — regenerated (byte-for-byte identical content to before this round, only the `GENERATED_AT` timestamp differs, confirmed by the MD5 reproduction in R2.3/R2.5).

**Not touched:** all 54 real `public/share/tjaldur/v1/**` HTML/PNG files (confirmed byte-identical before/after this entire round), `weatherVoiceShareHtml.js`, `weatherVoiceOgImage.js`, `weatherVoiceShareCatalogue.js`, `weatherVoiceFacebookShare.js`, `WeatherVoiceShareDialog.jsx`, `vercel.json`, `vite.config.js`'s `navigateFallbackDenylist`/`globIgnores` (already correct from Round 1), any scoring/gating/entitlement/checkout code, any API route, any new service or third-party library.

## R2.9 Confirmation (Round 2)

`docs/ai/CURRENT.md` will be updated to `Stage: CC_COMPLETE` immediately after this report is written, with the `CC report` path populated. Round 1's content above, `prompt-review.md`, `approved-prompt-v1.md`/`v2.md`, and all prior tasks' history are preserved — nothing was rewritten or deleted. **Not committed. Not pushed. Not deployed. No Facebook post published. No GitHub issue closed or follow-up issue created. No message sent to anyone.** Live Facebook preview acceptance and production GA4 receipt remain explicit, separate, pending external steps.

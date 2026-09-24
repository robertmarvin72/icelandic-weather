# #417 — Approved execution prompt v1

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/417

Jonesy APPROVED Round 1 on 2026-09-23 with three non-blocking notes. Ripley consolidated the approved scope below, retaining the issue-defined analytics payload and incorporating documentation and indexability clarifications. This is the sole approved execution prompt; prompt-review.md remains review history.
### Read-only findings

- WeatherVoiceCard opens WeatherVoiceShareDialog with an actual frozen snapshot. #410 v2 explicitly authorizes sharing every valid displayed mood, including severe conditions. Preserve that policy and the PNG/native/download implementation.
- `weatherVoiceShareSnapshot.js` supplies voiceId, exact text, language, mood, episodeKey and daily/site context. Public quote links need only the catalogue identity, never site context or episodeKey.
- `getWeatherVoiceLibrary` in `weatherVoiceContent.js` joins 27 stable IDs and shared mood metadata with complete IS/EN text libraries: 54 current combinations. Existing mascot assets are PNGs under `public/tjaldur/`, resolved by `getTjaldurMoodAssetPath`; the issue's SVG reference is stale.
- The current renderer is browser canvas at 1080x1080. Blob URLs are not public OG images.
- `api/blog-meta.js` supplies metadata in initial HTML, but its database-backed blog lookup is unnecessary for this finite catalogue. Reuse the principle, not its database or duplicate-og:type behavior.
- `vercel.json` has API/blog rewrites then SPA fallback. `vite.config.js` has a service-worker navigation fallback with no share-path exclusion. Both need verification for static share pages.
- AppRoutes has no campsite detail permalink. `useLanguage` persists local preference; `/en/` and `?lang=en` are not established English homepage links.

### Approved bounded design

Pre-generate static HTML pages and 1200x630 PNGs for each existing language/comment pair. Use existing Playwright/browser canvas tooling for a finite checked-in asset catalogue, manifest and reproducible local export script. Production builds copy and verify artifacts without Chromium, a running server, network calls or image rendering. No backend, database, new library, external service or arbitrary-user-text renderer.

One image per comment preserves the exact displayed words, unlike a generic mood image. Proposed public URL: `https://eltumvedrid.is/share/tjaldur/v1/<language>/<voice-id>.html`, paired with static PNGs. Released versions remain immutable; future copy changes get new versioned entries. Match snapshot text AND mood to the manifest before offering Facebook sharing.

The public share page is itself the destination: it shows the quote/mascot, identifies it as a shared comment rather than a live forecast, and links to the public homepage. No invented location deep link or claim of reproducing the original forecast. The page language follows its URL; the homepage retains its existing language preference. No automatic redirect discarding the OG page.

## Execution requirements

### Workflow and scope

Read AGENTS.md, CLAUDE.md, docs/ai/README.md and CURRENT.md. Execute only the approved version while READY_FOR_CC; set CC_IN_PROGRESS before editing. Confirm the audited data flow read-only. Write cc-report.md then set CURRENT to CC_COMPLETE. No commit, push, deploy, issue closure or Facebook post.

Allowed: share UI, manifest/URL helper, finite static export assets/tooling, necessary i18n, tests/docs and narrowly scoped static routing/PWA changes. Preserve weather rules, selection/history/exposure, shared forecast, scoring/recommendation, gating/entitlements, checkout and existing blog behavior.

### Implementation

1. Offer `Deila mynd` / `Share image` and `Deila á Facebook` / `Share on Facebook` at the existing Tjaldur share entrypoint. A compact two-action choice is sufficient. Keep the existing image dialog/renderer/native/download flow behind the image choice. Facebook must not depend on successful canvas generation or file-sharing support. Do not present the square PNG preview as the Facebook preview. Preserve keyboard focus, restoration and episode invalidation.
2. Resolve Facebook sharing from the actual current/frozen snapshot. Exact voiceId, text, language and mood must match the generated manifest; never select another joke or infer mood from severity. Missing/mismatched entries retain image sharing and a localized Facebook-unavailable state, never substitute another quote. Same-episode object churn must not swap a frozen choice; genuine episode changes invalidate it. Cover every currently valid mood and both languages.
3. Export all 54 current combinations from canonical library/asset lookups, not a manually duplicated catalogue. Use existing mascot and language-appropriate brand assets. Images are exactly 1200x630 with full exact comment, correct mascot, brand/domain and readable mobile typography. No clipped/ellipsized text, invented site/date/weather context, stock imagery or new character. Await fonts/decoded assets and measure every text bound; fail visibly if content does not fit. Reuse pure fit helpers where useful without altering the 1080x1080 export behavior. Keep this a small offline asset-export script, not general rendering infrastructure. Document regeneration and guard against missing/stale catalogue exports. Never overwrite released versioned quote content.
4. Static HTML contains exactly one each of og:title (localized Tjaldur says + actual text), og:description, og:image, og:url, og:type=website, og:image:width=1200 and og:image:height=630. Include suitable title, lang, canonical and image alt. Escape HTML/attributes. Canonical/image URLs are absolute HTTPS on eltumvedrid.is, never localhost/current host/blob/data/session URLs. Body shows the same quote and a normal public-homepage link without JavaScript. Translate new copy in i18n; keep serious-weather sharing copy neutral.
5. Ensure files are served before SPA fallback and installed PWA navigation cannot replace them with index.html. Prefer actual `.html` files and minimal configuration. These immutable quote URLs do not expire. Unknown IDs/languages/versions/malformed paths must have a safe public fallback and homepage link, never fabricated specific metadata. Register a scoped AppRoutes fallback if needed for unknown share paths, leaving unrelated NotFound behavior intact. Verify production output; local Vite behavior alone does not prove Vercel routing.
6. Use `https://www.facebook.com/sharer/sharer.php?u=<encoded-share-url>`. Prefer a real accessible external anchor opening a new window with noopener/noreferrer and immediate user activation, without awaiting image work. No PNG upload, Facebook SDK/secret, automatic posting or prefilled personal post text. Keep a usable link if popup opening is blocked; never claim successful publication.
7. Emit `tjaldur_facebook_share_clicked` once per actual activation with exactly `{mood, language, source: 'homepage_decision'}` from the shared snapshot. No event on render, opening choices, generation, rerender, unavailable state or public-page visit. Later intentional clicks count again. Analytics exceptions cannot block navigation. Preserve native/download `weather_voice_share_clicked` semantics; Facebook must not emit that event. No location, quote text, episodeKey, tokens or user identifiers in URLs/analytics. This is an attempt event, not confirmation of a post.

### Acceptance and validation

- Real UI/helper tests: exact non-default quote/language/mood selection, every catalogue entry, mismatched text/mood, unsupported language, event once per activation and absent on unrelated actions, analytics exceptions, same-episode churn and true invalidation. Preserve PNG native/download cancellation/error/fallback and existing exposure semantics.
- Verify every generated HTML/PNG pair: unique complete escaped metadata, matching text/mood, absolute URLs, dimensions, full coverage, immutable version integrity and no personal context. Test malformed/unknown paths and ensure arbitrary query text or redirects are not reflected.
- Browser: IS/EN, desktop/mobile, light/dark, keyboard, short landscape, intercepted real popup URL without publishing, and actual PNG download regression. Inspect contact sheets for all generated images plus full-size longest IS/EN comments and representative rain/wind/cold/good images. Check every text bound and readability at reduced Facebook-preview size.
- Fetch built HTML with JS disabled/crawler-like requests; check HTML/image MIME types and actual file paths. Verify service-worker navigation handling. Retain scripts/results/screenshots under outputs/ticket-417-facebook-share-evidence/.
- Run affected share/hook/card/App/content/analytics tests, full suite once, lint, build and git diff --check. Report failures and limitations separately.
- Live Facebook preview acceptance stays pending until an owner-provided public deployment is checked with Sharing Debugger and desktop/mobile Facebook. Do not deploy automatically or treat a green build/intercepted URL as live verification. Explicitly preserve this external acceptance item in cc-report and final assessment.

### STOP conditions

Stop with a concrete bounded proposal if exact quote images require a backend, new dependency/service/table, runtime arbitrary-text rendering, substantial image-generation infrastructure, scoring/gating changes or unrelated routing redesign. Never silently downgrade to a mood image with missing/different text. The static proposal stays within the client-side/no-new-backend project rules. Only this approved file, when referenced by CURRENT.md at READY_FOR_CC, authorizes implementation.

### Primary references and limits

- https://ogp.me/ — initial HTML metadata and image structured properties.
- https://vercel.com/docs/project-configuration/vercel-json — filesystem precedence; deployed behavior still requires verification.
- https://developers.facebook.com/docs/sharing/webmasters/ returned HTTP 429 during preflight. No claim of independently verified current Facebook rendering; the issue supplies the sharer URL and size requirement. External verification: https://developers.facebook.com/tools/debug/ after deployment.

## Disposition of Jonesy's non-blocking notes

1. Keep the exact issue-defined Facebook event payload `{mood, language, source: 'homepage_decision'}`. Do not add `voice_id` in this ticket. Exact quote fidelity is enforced by the manifest/URL and tests; per-comment analytics is a separate optional expansion, not required for fidelity. Preserve the existing native/download event's `voice_id` unchanged.
2. Update `docs/analytics/weather-voice-share-pilot.md`: add the new event and its attempt-only semantics; distinguish the new immutable comment/mood/language permalink from a reproducible site/date/weather forecast. Native/download behavior remains unchanged. Preserve the distinction between universal user-initiated sharing and separately reviewed editorial publication; do not claim pilot completion or live Facebook/GA4 verification.
3. Add `<meta name="robots" content="noindex, follow">` to static share pages and any share-specific fallback page. These pages are public social-sharing artifacts, not search landing pages. Do not block Facebook or other crawlers from fetching their HTML/images through robots.txt, authentication or crawler-specific responses. Test the robots metadata alongside OG tags; live Facebook compatibility remains an external verification item.

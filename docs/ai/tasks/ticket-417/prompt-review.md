# #417 — Facebook sharing for Tjaldur

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/417

## Ripley preflight — 2026-09-23

Discussion/review material only; not authorized for CC execution. Round 1 awaits Jonesy. Owner selected #417 after #415 reached CLOSED; working tree was clean.

### Read-only findings

- WeatherVoiceCard opens WeatherVoiceShareDialog with an actual frozen snapshot. #410 v2 explicitly authorizes sharing every valid displayed mood, including severe conditions. Preserve that policy and the PNG/native/download implementation.
- `weatherVoiceShareSnapshot.js` supplies voiceId, exact text, language, mood, episodeKey and daily/site context. Public quote links need only the catalogue identity, never site context or episodeKey.
- `getWeatherVoiceLibrary` in `weatherVoiceContent.js` joins 27 stable IDs and shared mood metadata with complete IS/EN text libraries: 54 current combinations. Existing mascot assets are PNGs under `public/tjaldur/`, resolved by `getTjaldurMoodAssetPath`; the issue's SVG reference is stale.
- The current renderer is browser canvas at 1080x1080. Blob URLs are not public OG images.
- `api/blog-meta.js` supplies metadata in initial HTML, but its database-backed blog lookup is unnecessary for this finite catalogue. Reuse the principle, not its database or duplicate-og:type behavior.
- `vercel.json` has API/blog rewrites then SPA fallback. `vite.config.js` has a service-worker navigation fallback with no share-path exclusion. Both need verification for static share pages.
- AppRoutes has no campsite detail permalink. `useLanguage` persists local preference; `/en/` and `?lang=en` are not established English homepage links.

### Bounded design proposed for review

Pre-generate static HTML pages and 1200x630 PNGs for each existing language/comment pair. Use existing Playwright/browser canvas tooling for a finite checked-in asset catalogue, manifest and reproducible local export script. Production builds copy and verify artifacts without Chromium, a running server, network calls or image rendering. No backend, database, new library, external service or arbitrary-user-text renderer.

One image per comment preserves the exact displayed words, unlike a generic mood image. Proposed public URL: `https://eltumvedrid.is/share/tjaldur/v1/<language>/<voice-id>.html`, paired with static PNGs. Released versions remain immutable; future copy changes get new versioned entries. Match snapshot text AND mood to the manifest before offering Facebook sharing.

The public share page is itself the destination: it shows the quote/mascot, identifies it as a shared comment rather than a live forecast, and links to the public homepage. No invented location deep link or claim of reproducing the original forecast. The page language follows its URL; the homepage retains its existing language preference. No automatic redirect discarding the OG page.

## Round 1 — proposed execution prompt

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

Stop with a concrete bounded proposal if exact quote images require a backend, new dependency/service/table, runtime arbitrary-text rendering, substantial image-generation infrastructure, scoring/gating changes or unrelated routing redesign. Never silently downgrade to a mood image with missing/different text. The static proposal stays within the client-side/no-new-backend project rules. This review document authorizes no implementation.

### Primary references and limits

- https://ogp.me/ — initial HTML metadata and image structured properties.
- https://vercel.com/docs/project-configuration/vercel-json — filesystem precedence; deployed behavior still requires verification.
- https://developers.facebook.com/docs/sharing/webmasters/ returned HTTP 429 during preflight. No claim of independently verified current Facebook rendering; the issue supplies the sharer URL and size requirement. External verification: https://developers.facebook.com/tools/debug/ after deployment.


## Jonesy review — Round 1

**APPROVED, with 3 notes (non-blocking).**

### Independent verification performed

Read-only audit claims in the preflight, verified directly against live source (not taken on the prompt's word):

- `weatherVoiceShareSnapshot.js` / `weatherVoiceSharePolicy.js` — confirmed. `evaluateWeatherVoiceShareEligibility` really does check only `presentation.show` and `lang`; the condition allowlist and hazard-veto seam are genuinely removed, not disabled. Snapshot really is `Object.freeze`d with `voiceId/text/language/mood/condition/severity/siteName/date/tmax/code/episodeKey`.
- `docs/analytics/weather-voice-share-pilot.md` — read in full. §4 draws the exact line this ticket needs to respect: universal in-app sharing (any mood, any user) is already owner-authorized; the still-conservative manual Facebook pilot in §4b is a *separate, editorial* restriction that this ticket does not touch. A user-initiated "Deila á Facebook" button — the user's own click opening Facebook's own sharer.php dialog — is categorically the same kind of act as native share/download (§4a), not automated/editorial posting (§4b). The Round 1 prompt's requirement #2 ("cover every currently valid mood and both languages") is consistent with §4a and does not blur into §4b. No conflict found.
- `weatherVoiceContent.js` — counted directly: exactly 27 entries in `WEATHER_VOICE_COMMENT_METADATA`. 27 × 2 languages = 54, matching the "54 current combinations" claim exactly.
- `public/tjaldur/` — listed directly: 12 PNGs (amazed, excellent, freezing, happy, nervous, neutral, sad, sleeping, struggling, suspicious, unimpressed, wrecked), no SVGs. `getTjaldurMoodAssetPath` (weatherVoicePresentation.js) resolves `/tjaldur/${mood}.png`, confirmed by its own test. The issue's SVG reference is genuinely stale.
- `weatherVoiceShareImage.js` — confirmed `SHARE_IMAGE_SIZE = 1080`, and confirmed the fit/measure helpers (`wrapTextToLines`, `linesFitWidth`, `fitCommentText`, `fitContextText`, `fitShareLayout`) really are pure/injectable and structurally separable from the canvas-specific drawing code — reusing them for a 1200×630 export without touching the 1080×1080 path (requirement #3) is a real, low-risk seam, not wishful thinking.
- `WeatherVoiceCard.jsx` / `WeatherVoiceShareDialog.jsx` — confirmed the frozen-snapshot-on-open pattern (`openedShareSnapshot` state, invalidated only on a real `episodeKey` divergence) and the synchronous `attemptInFlightRef` double-fire guard already exist exactly as the preflight describes. The two-choice UI this ticket adds has a real, already-proven anti-flicker/anti-double-fire pattern to extend.
- `api/blog-meta.js` — confirmed Postgres-backed, sets `og:type: article` via regex-replace against `dist/index.html`. The "reuse the principle, not the database or duplicate og:type" guidance is correct; requirement #4's `og:type=website` is the right divergence for a non-blog static page.
- `vercel.json` — confirmed: `/api/(.*)`  and `/blog/:slug` rewrites, then a catch-all `/(.*)  → /`. Static files should win by filesystem precedence ahead of that catch-all, but this is exactly the kind of platform behavior that can't be confirmed from the config file alone — the prompt correctly refuses to claim it's verified and requires a real production fetch.
- `vite.config.js` — confirmed the real risk: `workbox.navigateFallback: "/index.html"` with `navigateFallbackDenylist` covering only `/^\/api\//`, `/^\/assets\//`, favicon and icon PNGs — **not** `/share/`. An installed PWA navigating to a share URL would genuinely get intercepted and served cached `index.html` instead of the real static page today. Requirement #5 is solving a real, verified bug, not a hypothetical one.
- `AppRoutes.jsx` — confirmed no campsite detail permalink exists anywhere, and no general `/en` homepage route exists (only `/en/blog`, `/en/blog/:slug`, `/en/northern-lights` are English-specific). Matches both the preflight and the pilot doc's own §2 claim.

Nothing in the preflight audit was found to be inaccurate, exaggerated, or unverifiable — this is an unusually thorough piece of prep work and it holds up entry-by-entry against live source.

### Notes (non-blocking — worth folding in, not a reason to REVISE)

1. **`tjaldur_facebook_share_clicked` drops `voice_id`.** The existing `weather_voice_share_clicked` event (pilot doc §1) carries `voice_id`. The new event's exact payload — `{mood, language, source}` — has no per-comment identifier, only mood. That's a step backward in precision for an event this ticket's own premise says should be MORE precise than mood-level ("one image per comment preserves the exact displayed words, unlike a generic mood image"). `voice_id` isn't sensitive (it's already sent today, unlike free text/location/episodeKey), so there's no privacy reason to leave it out. Suggest adding it to the required payload rather than treating this Round 1 spec as final on that point.
2. **`weather-voice-share-pilot.md` isn't listed as something this ticket updates.** That doc is explicitly "shared with the code implementation" for the event dictionary (§1) and states as a platform limitation that "no permalink reproduces the same joke/weather" (§2) — which becomes literally false the moment this ships (a narrow, comment-scoped permalink now exists for the 54 catalogued combinations, even though native/download sharing still has none). Worth adding an explicit requirement to update §1 (new event) and §2 (narrow the permalink claim) so the doc doesn't go stale on day one.
3. **No decision on search-engine indexability of the new share pages.** Every prior sharing mechanism in this codebase produces nothing crawlable — a blob URL, a downloaded file, an OS share sheet. This ticket is the first to create permanent, public, canonical-URL'd HTML pages, including for severe-weather quips, with no stated expiry. The prompt specifies OG tags and a canonical URL but never decides whether these pages should carry `noindex` or be left indexable. Not inherently wrong either way, but it reads like an unmade decision rather than an intentional one — worth having Ripley/the owner decide explicitly before CC picks a default.

### Everything else checked out

Requirements #1–#7 are internally consistent and don't contradict each other or the verified architecture: the two-action choice correctly avoids gating Facebook on canvas success and correctly avoids presenting the 1:1 in-app preview as the Facebook preview; the exact-match-against-manifest requirement correctly degrades to image-only sharing (never a substituted quote) on mismatch; the export script reuses the existing pure fit helpers without touching the live 1080×1080 renderer; the OG/HTML requirements correctly diverge from blog-meta.js where they should (`og:type=website`, absolute HTTPS only, explicit ban on blob/data/localhost/session URLs); the serving requirement is aimed at a real, confirmed service-worker gap; the sharer.php approach needs no backend/SDK/secret and never claims a completed post, consistent with the pilot doc's "click is intent, not completion" framing; and the new analytics event is correctly kept separate from `weather_voice_share_clicked` rather than conflating two different channels. STOP conditions and acceptance/validation criteria are thorough and appropriately defer live Facebook-preview verification to the owner post-deployment, consistent with established precedent (pilot doc §6).

## Ripley handoff — 2026-09-23

Jonesy's Round 1 APPROVED is sufficient for execution handoff under docs/ai/README.md. No new approval gate added. Created approved-prompt-v1.md and set CURRENT.md to READY_FOR_CC.

Non-blocking notes resolved:
- Keep the exact issue-specified Facebook analytics payload (mood, language, source); adding voice_id would be optional analytics scope expansion. Exact comment fidelity is verified through the manifest/URL, independently of analytics granularity.
- Explicitly require updating weather-voice-share-pilot.md's event dictionary and permalink limitations, preserving forecast non-reproducibility and the user/editorial distinction.
- Use noindex, follow for share pages/fallbacks while retaining public crawler access to HTML and images. This is a routine distribution choice for permanent social-sharing artifacts, not a new product or permission gate.

No implementation, commit, push or deployment performed.

## Round 2 — Ripley correction prompt, 2026-09-23

Pending Jonesy review; not execution authorization. Addresses Ripley's Round 1 REVISE in result-review.md. Preserve immutable approved-v1, current sharing behavior/assets, prior reports and unrelated work. Once approved, consolidate this as approved-prompt-v2 before CC execution.

### 1. Fail-closed released-content loading

Use Node pathToFileURL for filesystem imports, including Windows drive paths. Distinguish a genuinely absent first-export manifest from an existing file that cannot load or has an invalid schema: the latter must abort before any writes. Existing released HTML/PNG without a usable manifest must also stop with a clear recovery message, not be treated as a fresh catalogue. Extract small testable export helpers or use isolated fixtures; importing test helpers must not launch Chromium or the export main routine. Add a real Windows-compatible existing-manifest load test plus failure cases, not merely a mocked empty manifest.

### 2. Version-aware immutable export lifecycle

Use a single configured version for output paths, stale-file checks and emitted manifest metadata. Compare releases by their versioned destination URLs, not only language/id: same-version changed quote/mood must fail before writes; a new-version quote may differ while prior-version files remain intact. Never overwrite existing released HTML/PNG files on ordinary regeneration: verify/reuse them, or report a mismatch requiring a version bump. Protect against changed templates/artwork as well as text/mood; do not silently regenerate published files. Preserve released artifacts even if no longer in the active catalogue; do not advise deleting them as stale. Stage/validate an export before replacing the active manifest so errors cannot silently publish a partially updated catalogue. Keep implementation bounded to the existing local exporter/manifest, without new services or libraries.

Tests with temporary output fixtures must demonstrate unchanged rerun preservation, same-version text/mood rejection before writes, existing artifact mismatch detection, invalid/missing manifest with existing exports, and a v1-to-v2 example retaining all v1 bytes. Do not modify the actual v1 catalogue merely to test versioning. Keep the active manifest matched to actual current URLs/version. Add PNG signature/IHDR dimension assertions against all actual generated images rather than trusting HTML width/height metadata alone.

### 3. Honest scoped fallback

Ensure unknown Tjaldur share versions, IDs, languages and namespace roots get a safe share fallback with a homepage link. Scope to `/share/tjaldur` so unrelated routes retain their current behavior. Implement the approved `noindex, follow` metadata using the existing project head-management pattern; verify cleanup when navigating back to normal pages. Do not claim React-added metadata is present in raw server HTML. Keep real static pages' initial-HTML noindex/OG metadata intact. Use existing language-aware branding instead of introducing legacy branding in this new fallback. Add missing-version routing and fallback robots/cleanup tests.

### Validation and handoff

Reproduce the manifest import failure first without writing released assets. Run targeted exporter/lifecycle, generated HTML/PNG, resolver, dialog/card, fallback/AppRoutes and existing PNG regression tests; lint, build and diff check, then full suite once. Browser-check fallback navigation/robots cleanup and confirm valid static pages still bypass the service worker. Inspect regenerated images only if intentionally changed under an approved new version; ordinary corrections should preserve v1 images. Append precise results and outstanding live Facebook/GA4 checks to cc-report.md; do not replace its Round 1 history. No commit, push, deploy or Facebook publication. Stop for any backend/dependency/general image-system expansion. CC must follow READY_FOR_CC -> CC_IN_PROGRESS -> CC_COMPLETE once approved-v2 exists.

## Jonesy review — Round 2

**APPROVED.**

### Independent verification of Ripley's three findings

I re-checked all three against live source myself rather than taking Ripley's report on faith — all three are real.

1. **Windows manifest-loading bypass (P1) — confirmed.** `scripts/exportWeatherVoiceShare.mjs:54` builds the import URL as `new URL(MANIFEST_PATH, "file://")`. On a Windows path like `C:\Users\...\weatherVoiceShareManifest.generated.js`, the WHATWG URL parser reads the leading `C:` as a scheme and ignores the `file://` base entirely, producing a `c:`-scheme URL — not a `file:` one. Dynamic `import()` of a non-file/data/node scheme throws `ERR_UNSUPPORTED_ESM_URL_SCHEME`, and the bare `catch { return {}; }` at line 56 swallows it silently. The consequence is real and severe: `assertNoReleasedContentDrift`'s `if (!prior) continue;` (line 66) then treats every entry as brand-new, so the "never overwrite released content" guard — the entire point of requirement #3 in approved-v1 — is a complete no-op on the exact platform this project is developed on.
2. **Version-blind lifecycle (P2) — confirmed.** `assertNoReleasedContentDrift` only compares `text`/`mood` keyed by `language|voiceId`, never the version. `WEATHER_VOICE_SHARE_MANIFEST_VERSION` is a separate hardcoded literal (line 241) from `WEATHER_VOICE_SHARE_VERSION` in `weatherVoiceShareUrl.js`, and `assertNoStaleFiles` hardcodes `"public/share/tjaldur/v1"` (line 81) as a third independent literal. And the export loop (lines 169–227) unconditionally `writeFileSync`s every HTML/PNG on every run regardless of whether anything actually changed — a renderer/template tweak with untouched text/mood would silently rewrite bytes at already-published "immutable" URLs, which the text/mood-only guard can't catch.
3. **Fallback gaps (P2) — confirmed, and this is a miss I should own.** `ShareFallback.jsx` has no robots metadata anywhere in it — contradicts approved-v1's disposition #3 outright. And `AppRoutes.jsx`'s route is literally `path="/share/tjaldur/v1/*"` — a request under a *different* version segment (`/share/tjaldur/v2/...`, or any non-`v1` string there) doesn't match this route at all and falls through to generic `NotFound`, not `ShareFallback`, contrary to cc-report's "unknown IDs/languages/versions/malformed paths" claim. I read this exact route in my own Round 1 result review and called it "an honest fallback for unknown share paths" without stress-testing whether "unknown" specifically covered an unknown *version* — given the whole scheme is versioned by design, that's exactly the case that most needed checking, and I didn't. Straightforward miss on my part, not a fabricated-file type of error.

### Evaluation of the Round 2 correction prompt

All three requirements target the confirmed root causes, not just symptoms, and stay bounded:

- **§1** correctly prescribes `pathToFileURL` (the actual fix for the URL-scheme bug) and — importantly — closes the fail-open behavior generally: an *existing* manifest that's unreadable/invalid must now abort before any writes, not just the Windows case specifically. Requiring a real (not mocked-empty) existing-manifest load test targets the exact gap that let this ship green the first time.
- **§2** correctly unifies the version into a single source of truth, makes the drift-check version-aware, and — the important part — stops the unconditional rewrite-every-run behavior so ordinary regeneration reuses/verifies existing bytes instead of silently mutating published URLs. The "stage/validate before replacing the active manifest" requirement closes a real partial-write hazard I hadn't flagged (the script writes each file immediately in the loop but only writes the manifest at the very end — a crash mid-run leaves files on disk the manifest never learns about). The PNG IHDR/signature requirement is a good catch too: the existing dimension checks assert the HTML's `og:image:width`/`height` *text*, which is just a hardcoded template string — it can't catch a renderer regression that actually produces a wrong-sized PNG.
- **§3** correctly widens the route match to the `/share/tjaldur` namespace root (not just `/v1/`) so any unknown version reaches the honest fallback, while explicitly preserving unrelated-path `NotFound` behavior. "Do not claim React-added metadata is present in raw server HTML" is the right level of honesty: `ShareFallback`'s noindex can only ever apply client-side, after the SPA has already loaded — it can never be visible to a non-JS crawler landing on an unknown share URL (that crawler sees the same raw homepage shell it always would). The prompt doesn't overclaim otherwise, which matters given this whole ticket's UX is aimed at exactly such a crawler.

Scope stays correctly bounded to the exporter/manifest/fallback — the already-correct URL builders, HTML template, Facebook resolver, and the 54 already-generated pages are untouched, consistent with "preserve current sharing behavior/assets."

Nothing here reopens the #410-universal-sharing-vs-editorial-pilot question from Round 1 — none of these three fixes touch eligibility, mood coverage, or analytics.

### Verdict

**APPROVED.** No notes — this is a complete, correctly-scoped fix for all three of Ripley's findings. Ready to consolidate as approved-prompt-v2 for CC.

## Ripley Round 2 handoff — 2026-09-23

Jonesy APPROVED the correction prompt without notes. Consolidated its requirements unchanged into approved-prompt-v2.md, with the mandatory workflow header and explicit preservation of v1 product requirements and artifacts. CURRENT.md is READY_FOR_CC and points to v2. No implementation, commit, push or deployment performed.

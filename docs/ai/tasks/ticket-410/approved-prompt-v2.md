# Ticket 410 — Approved prompt v2

Jonesy APPROVED Round 2 corrections and the latest universal-sharing owner override in prompt-review.md. This immutable correction prompt supersedes v1's sharing eligibility policy and its conflicting tests/documentation. Preserve v1's unaffected image design, event contract, architecture, scope and manual-pilot requirements. Do not execute earlier discussion drafts or the superseded rain-only addendum.

Execute only after the owner's `Prompt approved` handoff with CURRENT.md at READY_FOR_CC referencing this file. Read AGENTS.md, CLAUDE.md, docs/ai/README.md, CURRENT.md, v1 and the Round 1 result findings. Set CC_IN_PROGRESS before implementation. Append the correction report to cc-report.md, preserve prior history/evidence, then populate the report pointer and set CC_COMPLETE. No commit, push, deployment or posting. The owner authorized proceeding independently of #409; its outstanding production checks remain outstanding.

## 1. Every displayed Tjaldur is shareable

Whenever the Weather Voice card displays a valid comment and mascot, show the neutral secondary action 'Deila Tjaldi' / 'Share Tjaldur', regardless of condition, mood, severity or warning signals. Cover extreme_wind, heavy_rain, strong_wind, cold_wet, cold, rain, sun_wind, excellent and good. Remove condition allowlists and sharing-only hazard vetoes, including dead policy that could suppress the entrypoint. No additional permission is required for this owner-authorized behavior.

Keep Weather Voice's own conditional visibility unchanged: no card means no share entrypoint. Preserve structural validity, supported-language (is/en), episode and provenance checks. Invalid/stale data must never fabricate context or mix episodes. Generation failure must retain the entrypoint and offer clear localized error/retry handling, rather than becoming editorial ineligibility.

Serious messages use the same secondary action without celebratory encouragement or minimization. Export the actual displayed text faithfully. Do not alter weather rules, warning display, content selection or safety classification; this does not resolve #413's safety gap. Universal user sharing does not authorize automated posting or editorial Facebook promotion during hazardous conditions.

Explicitly report whether weatherVoiceSharePolicy.js is removed or reduced to structural validity; update/remove its tests accordingly. Retain and report the unsupported-language rejection. Do not add a warning classifier, hourly data dependency or private-site flag.

## 2. Truthful localized daily context

Clearly label daily forecast and daily maximum temperature through i18n. Fix the English date in the IS export with robust locale fallback and a persistent unambiguous date including year. No current-hour claims or changed weather inputs. Use the same normalized daily context as the displayed episode, with public campsite name and no precise user coordinates or personal location labels.

## 3. Full renderer geometry

Retain the standalone 1080x1080 canvas PNG, warm surface, prominent transparent mascot/comment, modest branding and visible eltumvedrid.is. Await fonts/image decoding; preserve aspect ratio and IS/EN typography.

Every comment line must fit measured width; comment plus wrapped context must fit above reserved branding/domain. Handle long real campsite names and unbroken tokens without cropping actual comment text or overlapping branding. Reduce within documented readable limits or reject clearly. Reproduce the retained failing width test under outputs/ticket-410-weather-voice-share-evidence/ before editing, adapting its import location as needed. Add meaningful width, height and context tests plus real canvas exports covering long names, four/five comment lines and an unfit token/message. Merely raising line limits or hiding overflow is insufficient.

## 4. Frozen opening snapshot

Capture the actual immutable opening snapshot in the card/share flow, rather than only its episode key while passing live snapshots to the dialog. Keep preview, downloaded/native file and analytics tied to that frozen object across same-episode refetches and object rebuilding. Genuine locale/site/date/outcome changes or invalid provenance must invalidate the preview without stale share actions or late generation results. Condition severity or warning-based editorial ineligibility must not be reintroduced.

Add integrated tests for same-key changed row/object while open and genuine invalidation. Include object-identity churn for at least one non-good/excellent condition. Preserve exposure/history and weather_voice_viewed semantics.

## 5. Dialog and method guards

Require both navigator.share and navigator.canShare({files}) support for the native method. Prepare the file before the final explicit user gesture; do not lose transient user activation by rendering in that final handler. Keep a working localized download fallback.

Make rapid-repeat download suppression effective despite React batching, using a synchronous ref/attempt guard with bounded release and later deliberate retry. Handle download exceptions without uncaught errors or success claims. Test rapid clicks, retry, canShare without share, native cancellation and errors. Preserve blob URL lifetime for an immediately initiated download, then clean up after close/replacement/unmount. Never download blank output after generation failure.

Bound the dialog to viewport height with reachable scrolling content/actions. Verify short mobile landscape and keyboard access, Escape, focus containment/restoration, a valid fallback when the trigger disappears, and focus behavior through unrelated parent rerenders.

## 6. Preserved analytics and pilot contract

Emit weather_voice_share_clicked only for an accepted explicit final native/download method attempt, never preview opening. Use exactly voice_id, language, severity, weather_type, surface='homepage_decision' and share_method='native'|'download' from the frozen snapshot. Suppress duplicate attempts; later intentional retries may emit again. Isolate analytics exceptions. Cancellation/failure still means an attempt, never a completed post. No completion event or additional personal/context payloads. Preserve weather_voice_viewed unchanged; mock analytics in local browser verification.

Update docs/analytics/weather-voice-share-pilot.md to distinguish universally available user sharing from separately reviewed, owner-published Facebook examples. Retain truthful attempt-rate semantics, manual UTM captions (facebook/social/weather_voice_pilot plus nonpersonal post identifiers), no Facebook attribution for unknown native destinations, and no promise of a live/reproducible weather permalink. Existing attribution behavior stays unchanged. Drafts/fixtures must be labeled; real publication requires the owner's handoff and contemporaneous context review. Deployment, real platform engagement/GA4 evidence and actual pilot completion remain pending unless independently evidenced. Code readiness is not pilot completion.

## 7. Validation and report

Test the real hook/card/snapshot flow across all nine conditions in IS and EN, including extreme_wind, heavy_rain and cold_wet. Assert visible Tjaldur has the entrypoint and severity/mood/warning signals cannot suppress it. Preserve silent, unsupported-language, invalid and provenance cases. Prove the owner's rain_02 scenario through preview and real downloadable output with matching text/mood/context, not only fabricated snapshots.

Run affected share/hook/card/App, engine/content/selector/history, exposure and analytics regressions, lint, build and whitespace checks. Browser-check IS/EN at 320/390/1280px in light/dark, short landscape, keyboard flow, mocked native branches and real downloads. Inspect actual PNG exports covering representative rain, wind, cold and good/excellent, longest current IS/EN comments and geometry edge cases. Retain scripts, results, screenshots and exports under outputs/ticket-410-weather-voice-share-evidence/. Report failures and limitations honestly; API mocks do not prove real OS share-sheet behavior.

Append exact changed files, checks/results, inspected images and remaining external verification to cc-report.md. Explicitly address Jonesy's three notes: policy module disposition, unsupported-language preservation, and non-good/excellent same-episode object-churn coverage.

Keep changes client-side within existing JSX/helpers/i18n/tests/docs patterns. No new libraries, backend, assets, joke IDs/library changes, scoring, thresholds, forecast normalization, entitlement, checkout, Northern Lights or unrelated module changes. STOP if implementation requires those out-of-scope changes or unsupported live-weather claims; routine reversible implementation choices need no extra approval. Preserve all earlier workflow artifacts, including immutable v1.

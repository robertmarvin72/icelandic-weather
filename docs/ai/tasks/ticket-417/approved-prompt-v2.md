# #417 — Approved execution prompt v2

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/417

Jonesy APPROVED Round 2 without notes on 2026-09-23. This is the approved correction prompt for Ripley's Round 1 REVISE. Preserve the existing implementation, all 54 v1 share-page/image pairs, prior reports and immutable approved-prompt-v1.md. The original product requirements and scope constraints in v1 remain applicable; execute only the bounded corrections below, not a fresh implementation of v1.

## Required workflow

Read repository instructions, docs/ai/README.md and CURRENT.md. Confirm CURRENT is READY_FOR_CC and references this file, then set CC_IN_PROGRESS before editing. Confirm current implementation read-only and reproduce the reported manifest-loading failure without overwriting artifacts. After implementation and validation, append the Round 2 execution report to docs/ai/tasks/ticket-417/cc-report.md, preserve Round 1 history, populate that path in CURRENT and set CC_COMPLETE. No commit, push, deployment, issue closure or Facebook publication. Live Facebook preview acceptance and production GA4 receipt remain pending external checks.

### 1. Fail-closed released-content loading

Use Node pathToFileURL for filesystem imports, including Windows drive paths. Distinguish a genuinely absent first-export manifest from an existing file that cannot load or has an invalid schema: the latter must abort before any writes. Existing released HTML/PNG without a usable manifest must also stop with a clear recovery message, not be treated as a fresh catalogue. Extract small testable export helpers or use isolated fixtures; importing test helpers must not launch Chromium or the export main routine. Add a real Windows-compatible existing-manifest load test plus failure cases, not merely a mocked empty manifest.

### 2. Version-aware immutable export lifecycle

Use a single configured version for output paths, stale-file checks and emitted manifest metadata. Compare releases by their versioned destination URLs, not only language/id: same-version changed quote/mood must fail before writes; a new-version quote may differ while prior-version files remain intact. Never overwrite existing released HTML/PNG files on ordinary regeneration: verify/reuse them, or report a mismatch requiring a version bump. Protect against changed templates/artwork as well as text/mood; do not silently regenerate published files. Preserve released artifacts even if no longer in the active catalogue; do not advise deleting them as stale. Stage/validate an export before replacing the active manifest so errors cannot silently publish a partially updated catalogue. Keep implementation bounded to the existing local exporter/manifest, without new services or libraries.

Tests with temporary output fixtures must demonstrate unchanged rerun preservation, same-version text/mood rejection before writes, existing artifact mismatch detection, invalid/missing manifest with existing exports, and a v1-to-v2 example retaining all v1 bytes. Do not modify the actual v1 catalogue merely to test versioning. Keep the active manifest matched to actual current URLs/version. Add PNG signature/IHDR dimension assertions against all actual generated images rather than trusting HTML width/height metadata alone.

### 3. Honest scoped fallback

Ensure unknown Tjaldur share versions, IDs, languages and namespace roots get a safe share fallback with a homepage link. Scope to `/share/tjaldur` so unrelated routes retain their current behavior. Implement the approved `noindex, follow` metadata using the existing project head-management pattern; verify cleanup when navigating back to normal pages. Do not claim React-added metadata is present in raw server HTML. Keep real static pages' initial-HTML noindex/OG metadata intact. Use existing language-aware branding instead of introducing legacy branding in this new fallback. Add missing-version routing and fallback robots/cleanup tests.

### Validation and handoff

Reproduce the manifest import failure first without writing released assets. Run targeted exporter/lifecycle, generated HTML/PNG, resolver, dialog/card, fallback/AppRoutes and existing PNG regression tests; lint, build and diff check, then full suite once. Browser-check fallback navigation/robots cleanup and confirm valid static pages still bypass the service worker. Inspect regenerated images only if intentionally changed under an approved new version; ordinary corrections should preserve v1 images. Append precise results and outstanding live Facebook/GA4 checks to cc-report.md; do not replace its Round 1 history. No commit, push, deploy or Facebook publication. Stop for any backend/dependency/general image-system expansion. CC must follow READY_FOR_CC -> CC_IN_PROGRESS -> CC_COMPLETE once approved-v2 exists.

# #430 v2 — commands and results

Base HEAD: `2091263f031b2fa8a6acf5a7ad7bb04281775ded` (unchanged from v1). All commands below ran after the F1 source edit and the new/updated test files.

## Targeted #430 suite (9 files, run together)

```
npx vitest run src/components/AffiliateCta.test.jsx src/lib/affiliateImpressionHolder.test.js \
  src/App.affiliateHolder.test.jsx src/App.affiliateHolder.inPlaceNavigation.test.jsx \
  src/pages/NorthernLightsLanding.affiliateHolder.test.jsx src/lib/analytics.affiliateGA.test.js \
  src/components/NorthernLightsThreeNight.affiliateCta.test.jsx \
  src/components/NorthernLightsThreeNight.affiliateCtaFallback.test.jsx \
  src/i18n/translations.northernLights.affiliateParity.test.js
```
Result: **9 files, 73 tests passed**, exit 0. (v1's equivalent 8-file run was 66 tests; v2 adds 1 new file/test for F4 and 1 new assertion for F1 — this number is not copied forward from v1, it is a fresh run.)

## Full suite

```
npm run test:run
```
Result: **174 files, 2562 tests passed**, exit 0. No pre-existing failure. (v1 was 173 files / 2560 tests; the delta is exactly the 1 new test file and 1 new assertion above.)

## Lint

```
npm run lint
```
Result: exit 0, including with `review-packet-v2/`'s `.txt` copies present (verified empirically, same as v1).

## Build

```
npm run build
```
Result: exit 0. Completed `2026-10-14T10:17:11Z`, after the F1 source edit (`AffiliateCta.jsx` mtime `10:09:53Z`). `dist/` remains the normal release build, no GA id.

## v2 GA dummy-ID evidence build (fresh, after the F1 edit)

```
VITE_GA_MEASUREMENT_ID=G-TEST430 node ./node_modules/vite/bin/vite.js build --outDir <system temp>/ticket430-v2-ga-evidence-dist
npx vite preview --outDir <system temp>/ticket430-v2-ga-evidence-dist --port 4531
node outputs/ticket-430-browser-evidence/browser-check-v2.mjs
```
Build completed `2026-10-14T10:15:10Z`, after the F1 edit. Directory path re-verified against the expected `.../scratchpad/ticket430-v2-ga-evidence-dist` prefix before deletion (same system-temp location pattern as v1, a different leaf name). Normal `dist/` confirmed to contain no `G-TEST430` both before and after this build (`grep -c G-TEST430 dist/assets/*.js` → 0). `git status --short` lists no bundle/dist files anywhere.

Result: **9 scenarios, 59/59 gating assertions passed** (plus 49 informational measurements — font-size/contrast numbers and the informational hover sample). See `outputs/ticket-430-browser-evidence/results-v2.json` (copy also in `review-packet-v2/evidence/results-v2.json`) and the screenshots in the same directory. Full numeric detail is in `cc-report.md`'s v2 section.

## Candidate freeze (v2)

```
git rev-parse HEAD                              # unchanged: 2091263f031b2fa8a6acf5a7ad7bb04281775ded
git diff -- <tracked candidate files>            # 4 modified production files (2 of them, AffiliateCta.jsx/.test.jsx, now also carry the F1 change)
git diff --no-index -- /dev/null <new file>      # 12 new source/test files (11 from v1 + 1 new for F4)
sha256sum <each of the 16 v2 candidate files>    # manifest.txt
```
No `git add`/staging used.

## Report/runbook hashes (D6 — these are edited documents, not frozen packet files)

Computed after each file's v2 content was finalized (neither file records its own hash inline, for the same self-hash-recursion reason `manifest.txt` doesn't hash itself):

| File | SHA-256 (lowercase) |
|---|---|
| `docs/ai/tasks/ticket-430/cc-report.md` (after its v2 section) | `d11c7067bff30d56e4a4294b3e951bf5bab82889e6776cc68a089451fd44fb32` |
| `docs/ai/tasks/ticket-430/experiment-note.md` (after its v2 corrections) | `2072a76457367235f7873a391fe3c8f1c8c997193dcda9c5e65b99238e8404a7` |

If either file is read later and its hash does not match the value above, it was edited after this report was completed — treat such a change as not part of this v2 correction.

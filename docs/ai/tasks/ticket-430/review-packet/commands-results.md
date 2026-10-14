# #430 — commands and results

Base HEAD: `2091263f031b2fa8a6acf5a7ad7bb04281775ded`. All commands below ran from the repo root after that commit, against the uncommitted candidate in `candidate.diff`.

## Targeted suites (NL/aurora/affiliate, run together)

```
npx vitest run src/App.northernLightsAnchor.test.jsx src/App.northernLightsHomepageCheckout.test.jsx \
  src/components/NorthernLightsCard.landingVariant.test.jsx src/components/NorthernLightsCard.test.jsx \
  src/components/NorthernLightsThreeNight.affiliateCta.test.jsx src/components/NorthernLightsThreeNight.affiliateCtaFallback.test.jsx \
  src/components/NorthernLightsThreeNight.interactionTier.test.jsx src/components/NorthernLightsThreeNight.round5.test.jsx \
  src/components/NorthernLightsThreeNight.test.jsx src/hooks/useAuroraDecision.test.js src/hooks/useAuroraThreeNight.test.js \
  src/lib/auroraBandPresentation.test.js src/lib/auroraCandidateRequest.test.js src/lib/auroraDecisionCache.test.js \
  src/lib/auroraDecisionClassify.test.js src/lib/auroraDisplaySelection.test.js src/lib/auroraFreshnessPolicy.test.js \
  src/lib/auroraMultiNightPolicy.test.js src/lib/auroraNightIndicator.test.js src/lib/auroraNightLabel.test.js \
  src/lib/auroraNightQuery.test.js src/lib/auroraReasonSummaries.test.js src/lib/auroraScoring.test.js \
  src/lib/auroraSeason.test.js src/lib/auroraVisualState.test.js src/pages/NorthernLightsLanding.affiliateHolder.test.jsx \
  src/pages/NorthernLightsLanding.cardWiring.test.jsx src/pages/NorthernLightsLanding.homeHandoff.test.jsx \
  src/pages/NorthernLightsLanding.metadata.test.jsx src/pages/NorthernLightsLanding.test.jsx \
  src/App.affiliateHolder.test.jsx src/lib/affiliateImpressionHolder.test.js src/components/AffiliateCta.test.jsx
```
Result: **33 files, 466 tests passed.**

## GA equivalent-validation and i18n parity

```
npx vitest run src/lib/analytics.affiliateGA.test.js
npx vitest run src/i18n/translations.northernLights.affiliateParity.test.js
```
Result: **5 passed** and **4 passed** respectively (both included in the full suite below too).

## Full suite

```
npm run test:run
```
Result: **173 files, 2560 tests passed**, exit 0. No pre-existing failure.

## Lint

```
npm run lint
```
Result: exit 0, both before and after the review-packet `.txt` copies were added (the `.txt` suffix keeps them out of ESLint's JS/JSX globs; verified empirically, not just by reading the config).

## Build

```
npm run build
```
Result: exit 0. Build completed `2026-10-14T09:30:25Z`, after the last production source edit (`src/pages/NorthernLightsLanding.jsx`, mtime `09:14:53Z`). `dist/` is the normal release build (no `VITE_GA_MEASUREMENT_ID`); it does not contain the dummy id.

## GA dummy-ID evidence build (C3 option (i) — outside the repository)

```
VITE_GA_MEASUREMENT_ID=G-TEST430 node ./node_modules/vite/bin/vite.js build --outDir <system temp>/ticket430-ga-evidence-dist
npx vite preview --outDir <system temp>/ticket430-ga-evidence-dist --port 4530
node outputs/ticket-430-browser-evidence/browser-check.mjs
```
The build directory was a task-specific folder under the OS temp directory (`AppData/Local/Temp/...`), never under `outputs/` or any tracked path. It was deleted immediately after the browser run, and its path was re-verified against the expected temp prefix before deletion. The normal `dist/` was never touched by this build (`grep -c G-TEST430 dist/assets/*.js` → 0). `git status --short` at the end lists no bundle/dist files.

Result: **8 scenarios, 50/50 assertions passed.** See `outputs/ticket-430-browser-evidence/results.json` and the accompanying screenshots. Full detail, GA transport method, and limitations are in `cc-report.md`.

## Candidate freeze

```
git rev-parse HEAD                              # base HEAD recorded above
git diff -- <tracked candidate files>            # 4 modified production files
git diff --no-index -- /dev/null <new file>      # 11 new source/test files, one per file
sha256sum <each of the 15 candidate files>       # manifest.txt
```
No `git add`/staging was used to produce the diff or the packet.

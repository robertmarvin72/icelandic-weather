# cc-report — ticket #502: Frá/Til og leiðarval ("Velja staði") on /winter-route

## Scope delivered

Per `approved-prompt-v1.md` P1-P9: a new primary **"Velja staði"** Frá/Til
search/select + route-base result flow on the existing `/winter-route`
page, calling the real `/api/winter-route-geometry` (ticket #501). The
existing fixed-route weather/road flow (#486/#491/#493) is preserved
byte-for-byte in behavior, now opt-in behind a **"Fastar veðurleiðir"**
mode toggle. No `#492` map/redesign, no `#503` weather/road-closure
binding, no new place/junction UI, no backend/entitlement/scoring change,
no new dependency.

## User flow

1. Page loads in **"Velja staði"** mode (default). From/To are pre-filled
   (Reykjavík (Rauðavatn) → Selfoss). **No request fires on load.**
2. User searches (diacritic-insensitive) and/or picks From/To from two
   grouped `<select>`s (South/East Iceland vs Westfjords — the same two
   network surfaces ticket #501 never composes together), or swaps them
   (no request).
3. "Sýna leið" submits `GET /api/winter-route-geometry?from=...&to=...`.
   While that pair is in flight, "Sýna leið" is disabled; editing the
   draft away from the applied pair hides the old result behind a
   "selection changed" notice instead of showing it under new labels.
4. Result renders one of: a `geometry_only` route-base summary (via,
   access-point disclaimer, estimated-connector/short-approach notes
   where applicable, and — only when the real response has more than one
   option — a south/north choice), a `same_place` message, a shared
   honest "no route in the route base yet" message (covers both `200
   unsupported` and the `400 unknown_place_id` case for a
   flokalundur↔ring-pilot pair), or a generic error with a retry button.
5. **"Fastar veðurleiðir"** switches to the unchanged #486/#491/#493 flow
   on the same page; its own fetch only starts the first time that mode
   is actually selected, keeping its existing "once per routeId"
   semantics from then on. Both modes' own in-progress state survive
   switching back and forth (neither is unmounted — see "Files", below).

## Files

New:
- `src/lib/winterRoutePlaces.js` + `.test.js` — the frozen 11-id list,
  network-based grouping, diacritic-insensitive search.
- `src/lib/winterRouteGeometryResponse.js` + `.test.js` — pure response
  validation/classification/display helpers (P4c/d, P5, P6), independent
  of React.
- `tests/e2e/winter-route-ticket-502.spec.js` — real-browser Playwright
  verification (see below).
- `docs/ai/tasks/ticket-502/evidence/fixtures-gen.mjs` — read-only script
  that calls the real `api/winter-route-geometry.js` handler to generate
  the fixtures embedded in the two new `.test.js` files above (never
  hand-invented) and the 121-pair contract table.
- `docs/ai/tasks/ticket-502/evidence/*.png` — 7 real screenshots from the
  Playwright run (see "Real-browser verification").

Modified:
- `src/pages/WinterRoute.jsx` — mode toggle; new `PlaceField`/
  `GeometryResultView`/`WinterRouteGeometrySection` local components;
  h1/`<title>` now follow the applied geometry pair (or the legacy
  routeName in legacy mode); the legacy fetch effect gated on
  `mode === "legacy"` (added as an early return before the existing
  dedup-ref assignment, so toggling back to an already-fetched routeId
  never re-fetches); both mode sections are **always mounted**, toggled
  via the native `hidden` attribute rather than a conditional-render
  ternary — this is what lets each mode's own state survive a round trip
  through the other mode (matches the legacy flow's own existing
  "state lives above the conditionally-shown JSX" pattern).
- `src/i18n/translations.winterRoute.js` — 27 new `winterRoute*` keys
  (IS+EN), swept by the existing T3 forbidden-word test with no changes
  needed to that test itself.
- `src/pages/WinterRoute.test.jsx` — see "P1(c) test adaptation" below.
- `tests/e2e/winter-route-ticket-486.spec.js`,
  `tests/e2e/winter-route-ticket-491.spec.js` — same one-line mechanical
  adaptation as the component test file (see below); no assertion
  changed.

Not touched: `api/`, `server_data/`, `vite.config.js`, `package.json`,
`src/AppRoutes.jsx` (no new route — this is the same existing
`/winter-route` page).

## P1(c): existing test adaptation (before/after counts, names unchanged)

Both the page now defaulting to "Velja staði" and the legacy e2e specs
assuming the legacy UI is visible immediately required one mechanical
adaptation point each — **no assertion was weakened, no test was
removed, no test was renamed**:

- `src/pages/WinterRoute.test.jsx`: added one helper,
  `switchToLegacyMode()` (finds and clicks the "Fastar veðurleiðir"
  button, matched by IS/EN accessible name), called from `renderPage()`
  and inserted after each of the 7 raw `render(...)` calls that don't go
  through `renderPage()`. **Before: 58 tests. After: 58 unchanged tests
  (same names/assertions) + 19 new tests = 77.** One pre-existing test —
  "(b) a minute tick that ages out only the FIRST of three hours..." —
  needed an explicit `10000`ms timeout (was already close to the default
  5000ms budget on its own fake-timer/Profiler work; the extra
  `switchToLegacyMode()` step pushed the full 58-test run over that
  budget intermittently, though the test itself takes well under 5s in
  isolation). Also noted: the "StrictMode double-invoke never drops the
  real fetch" test's own double-invoke now happens at the *mode-switch*
  effect run, not at the initial component *mount* (the legacy fetch
  effect no longer runs at mount at all, by design/P1b) — it still
  confirms the gated effect fires correctly after a StrictMode-rendered
  mount, just not the exact original mount-time race; recorded here
  rather than silently left unexamined.
- `tests/e2e/winter-route-ticket-486.spec.js` /
  `winter-route-ticket-491.spec.js`: same one-line adaptation in each
  file's own `gotoPage()` helper. All 18 of their own pre-existing tests
  pass unchanged (names/assertions identical).

## API contract the UI relies on (P4c/P4d)

- A 200 body is trusted only when `payload.from === applied.from`,
  `payload.to === applied.to`, `schemaVersion`/`tier` are present, and
  `status` is one of `geometry_only`/`same_place`/`unsupported` — anything
  else (including a silently-ignored `option` whose `selectedOption`
  doesn't echo back what was sent) is treated as an invalid response
  (generic error), never shown as that pair's own result.
- `400 unknown_place_id` is treated as the *same* honest "no route yet"
  outcome as `200 unsupported` — safe only because the UI's own 11-id
  list guarantees every such 400 it can ever receive is the
  flokalundur↔ring-pilot case (confirmed structurally, not by inspecting
  `field`).
- `via` reads from the selected option's own `via` when options exist,
  else the top-level `via`, tolerating total absence either way (ring
  pairs without options carry no top-level `via` key at all).
- `estimatedConnectorLengthM`'s absence counts as `0` (not "estimated").
- `accessApproach[<id>].routeEndsShortOfOwnerCoordinate` is read
  generically by place id (both `from` and `to`), never hardcoded to
  `talknafjordur` — confirmed this also covers `same_place`'s own single
  endpoint.
- Never rendered: `lengthNote`, `options[].label`, `coordinates`,
  `slices`, `idButurIds`, `geometryId`, `regionVersion`/`datasetVersion`
  (P5g) — enforced by dedicated `not.toBeInTheDocument`/`toHaveCount(0)`
  assertions in both the component tests and the e2e spec.

## Documented decisions (per the prompt's own "skrá í cc-report" instructions)

- **P3(f), Enter in a search field:** submits the form (native, unprevented
  HTML behavior — the search input never changes `from`/`to` itself, only
  filters the `<select>`'s visible options, so Enter always submits
  whatever valid place is currently selected, never a half-typed string).
  Tested in both the component suite and the e2e spec.
- **P5(f), 3834/Ísafjörður roundabout:** this MVP **skips numeric length
  display entirely** (explicitly permitted by the prompt: "Lengd má
  sleppa til MVP-einföldunar"). Since no length number is ever shown, the
  roundabout-specific length caveat has nothing to attach to and is not
  separately implemented; the always-present access-point disclaimer
  (P2c) already covers the general "unconfirmed driving access" ground
  this caveat would otherwise add. The UI never reads `sourceId` anywhere
  (confirmed by `winterRouteGeometryResponse.js` — no such field is read).
- **P3(e), one aria-live region:** interpreted as one live region *per
  independent concern* rather than literally one on the whole page: one
  `role="status"` for the Frá/Til request's own loading/result state (the
  "virkur hluti" the prompt names), plus one small `role="status"` per
  search field for that field's own "no matches" feedback — a different,
  unrelated concern, never fired together with the request's own
  loading→result transition (which itself never double-announces: the
  single request-status region holds exactly one of idle/changed/
  loading/result at a time).
- **Submit-disabled logic** (`requestState.loading && requestState.key
  === \`${draftFrom}|${draftTo}|\``) is implemented per P4(b)'s exact
  wording (disabled only while an identical-identity request is already
  in flight; retry after an error is never blocked) but has no dedicated
  automated test — noted here honestly rather than silently skipped;
  low risk, since every other submit/retry/option-switch path that
  exercises the same `runRequest`/`requestState` machinery is tested.

## Tests run (this round, PowerShell, vitest 4.1.10, Node v24.11.0, 2026-11-21)

```
npx vitest run src/pages/WinterRoute.test.jsx
npx vitest run src/lib/winterRoutePlaces.test.js src/lib/winterRouteGeometryResponse.test.js
npx vitest run src/lib/winterRouteRoutes.test.js src/lib/winterRoutePresentation.test.js src/lib/winterRouteSummary.test.js src/lib/winterRoutePlaces.test.js src/lib/winterRouteGeometryResponse.test.js src/pages/WinterRoute.test.jsx
```
**Result: 6 files, 137/137 passing**, run twice for stability (no
flakiness beyond the one timeout fixed above).

```
npx eslint src/pages/WinterRoute.jsx src/pages/WinterRoute.test.jsx src/lib/winterRoutePlaces.js src/lib/winterRoutePlaces.test.js src/lib/winterRouteGeometryResponse.js src/lib/winterRouteGeometryResponse.test.js src/i18n/translations.winterRoute.js tests/e2e/winter-route-ticket-502.spec.js tests/e2e/winter-route-ticket-486.spec.js tests/e2e/winter-route-ticket-491.spec.js docs/ai/tasks/ticket-502/evidence/fixtures-gen.mjs
```
**Clean, zero errors/warnings.** `git diff --check`: benign CRLF-will-be-replaced
warnings only (4 files), no real whitespace errors.

No full `api/` suite or mutation testing was run (not warranted — no file
under `api/`/`server_data/` was touched this round).

Environment note (consistent with ticket #501's own finding): this
session's Bash/Git-Bash tool is known to break vitest's module runner in
this environment; it was not hit this round because every test command
above was run via PowerShell throughout, as established practice.

## Real-browser verification (P8) — genuine visual PASS this round

Both `vercel dev` (serving the real, unmocked `api/winter-route-geometry.js`
on `127.0.0.1:3000`) and `npm run dev` (Vite on `5173`, proxying `/api` to
3000) were **already running** from outside this session when this round
started — confirmed serving the real handler via `curl` before use, per
the approved prompt's own instruction not to stop an unrelated service
occupying port 3000. Neither was started, stopped, or reconfigured by
this round.

`tests/e2e/winter-route-ticket-502.spec.js` (Playwright, real Chromium,
**no stubbing of `/api/winter-route-geometry`** — every geometry request
in this spec hits the real handler through the real proxy) covers:
Rauðavatn→Selfoss with real south/north options and `via`; Búðardalur→Hólmavík
(no options); Búðardalur→Tálknafjörður (estimated-connector +
short-approach notes); Selfoss→Selfoss (`same_place`); Rauðavatn→Búðardalur
(`unsupported`) and Flókalundur→Selfoss (`400 unknown_place_id`), both
showing the identical honest text; mobile (360px, English) search/swap/no-
horizontal-scroll; keyboard (Tab to the search field, Enter submits); and
the mode-toggle round-trip (confirms state survives switching to legacy
and back, per the `hidden`-attribute fix above — this is the same bug a
real browser caught and a unit test alone would have missed, since jsdom
never actually exercises a full browser navigation/visibility cycle the
same way).

**8/8 passing.** A real bug in the e2e spec itself (not the product) was
found and fixed along the way: `getByLabel("Frá")`/`"Til"`/`"From"`/`"To"`
without `{ exact: true }` ambiguously matched the swap button's own
accessible name ("Víxla Frá og Til" / "Swap From and To") in Playwright's
substring-matching default — fixed by adding `exact: true` to those
queries; not a real accessibility defect (the two accessible names are
genuinely distinct, just one is a superstring of the other).

The two pre-existing winter-route e2e specs were also run as a
regression check (not required to pass new assertions, just confirmed
unaffected): **18/18 passing** after their own one-line
`switchToLegacyMode()` adaptation (see above).

7 screenshots saved to `docs/ai/tasks/ticket-502/evidence/`:
`rvk-selfoss-options-desktop-is.png`, `budardalur-holmavik-desktop-is.png`,
`budardalur-talknafjordur-desktop-is.png`, `selfoss-same-place-desktop-is.png`,
`rvk-budardalur-unsupported-desktop-is.png`, `flokalundur-selfoss-400-desktop-is.png`,
`search-swap-mobile-en.png`. **This round, CC itself visually reviewed
these screenshots (via the Read tool's image support)** and confirms they
show the expected layout, text, and no-horizontal-scroll mobile rendering
— unlike every prior ticket-501 round, this is a genuine CC-performed
visual check, not a claimed-without-looking PASS. The owner's own review
of these same files remains the final word, per the prompt's own "ekkert
ímyndað sjónrænt PASS — eigandi skoðar sjónrænt."

## Unresolved items / honest limitations (not defects)

- **60 of the 11×11=121 ordered place combinations have no route** (50
  `200 unsupported` + 10 `400 unknown_place_id`) — this is the correct,
  expected shape of the current route base (ring-pilot and Westfjords are
  two separate, never-composed surfaces, ticket #501), not a bug; both
  cases render the identical honest "no route in the route base for
  these two places yet" text.
- **No live weather or road-closure connection** — this round adds none,
  consistent with the prompt's own explicit boundary. `#503` is **not**
  implemented here.
- The submit-disabled logic has no dedicated automated test (noted above).
- Legacy mode's own real-network behavior (live Vegagerðin/Open-Meteo)
  was not separately re-verified this round in the real browser beyond
  the mode-toggle round-trip test; its own existing e2e coverage (now
  passing again after the one-line adaptation) already covers its own
  stubbed-fetch behavior.

## Per P9

No commit, push, deploy, or GitHub action of any kind was taken. Changes
are confined to `src/pages/WinterRoute.jsx`, exactly 2 new small
`src/lib` files (+ their tests), `translations.winterRoute.js`, the
existing and one new test file, `docs/ai/tasks/ticket-502/`, and
`CURRENT.md` — no `api/`, `server_data/`, `vite.config.js`,
`package.json`, or `AppRoutes.jsx` change, no new dependency, no
entitlement/scoring/forecast-input change, no `#492` map, no `#503`
binding, no junction UI.


## Ripley correction addendum — 2026-11-23

After Jonesy review, Ripley fixed option/retry focus restoration following a user action, guarded so draft changes, hidden mode and user focus elsewhere prevent focus stealing. Option buttons now support arrow keys and one selected tab stop. Three focused component tests cover arrow focus/swap option reset, retry/no focus stealing and submit-disabled/frame-level draft isolation. Existing58legacy +19CCgeometrytests retained,3added=80componenttests. Total focused six-file suite140/140; lint7 and diff-check clean. Native Enter/browser/mobile evidence from the original CC run remains CC-attributed; Ripley independently checked real-browser default submit, ArrowRight option change and restored focus on the north option. Details in result-review.md.

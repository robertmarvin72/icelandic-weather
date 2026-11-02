# #485 — Pre-sample plan (FROZEN before any provider request)

**Frozen as-of (UTC): 2026-11-02T13:16:55Z.** This file is written and saved after that as-of timestamp (both before the first provider request) — the as-of time is the freeze instant, not this file's own last-write timestamp; the two are not conflated (same convention as #483 S5).

Governing document: `approved-prompt-v1.md` (Ripley, 2026-11-02, Jonesy Round-2 APPROVED). Issue: https://github.com/robertmarvin72/icelandic-weather/issues/485. This plan implements Phase A of that prompt. Nothing below may be changed after the freeze hash (bottom of this file) without a STOP and new review round.

---

## 1. Product scope (restated, not re-negotiated)

Source-labelled road-state/closures, OPTIONAL observations, and LIMITED point-labelled forecast at an assumed constant-speed ETA, for the Reykjavík→Vík Route 1 corridor. No safety verdict, no departure optimisation, no risk score, no future-open promise, no continuous-coverage claim. No production/API/UI/DB/config changes. No installs. No accounts/keyed probes/secrets. No MVP proposal regardless of outcome.

## 2. Reused evidence (recomputed SHA256, not assumed from historical reports)

Historical samples dated 2026-10-19/27/28 establish only their OWN fetch-time status, never present status.

| File | SHA256 | Bytes |
|---|---|---|
| `docs/ai/tasks/ticket-483/coverage.csv` | `341366dcaaec711a5ef5b00b6c287df3fa69f339f984803970b9aaaf0dc0547c` | 5634 |
| `docs/ai/tasks/ticket-483/route-segments.csv` | `5f0b18b7549fa7bfa9024c2c2535976cacf5b0b486c9145be0323a85e86e0f57` | 2284 |
| `docs/ai/tasks/ticket-483/research-report.md` | `a627fcef7dfed2142d95a2bcae1f5b1afcaff7391c83eb9b639490d469e64053` | 27017 |
| `docs/ai/tasks/ticket-483/source-register.md` | `ead95717d9341edda7b7cc462741d3242d23caa6ee9cb0f213b9fb959b04b9e3` | 24138 |
| `docs/ai/tasks/ticket-483/pre-sample-plan.md` | `ab04857f1ed6527ac090132b32d2fcf3e9e35fd8c6c200a55dd00f3087cc72c8` | 20680 |
| `docs/ai/tasks/ticket-483/samples/manifest.md` | `bcd44b0dc51804f536b2006c540a122c2602b23698f1f8e4e93ddc006248219d` | 9157 |
| `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` | `305f60d6f1f17918c058cbd047735681e56d6f9aad99f9e16f50de9419d6983a` | 1242779 |
| `docs/ai/tasks/ticket-483/samples/wfs-chain-4326.json` | `966848554f0ce205c919625c3e6209da1fe05bcc50e7e8084ae96840ad519af4` | 178153 |
| `docs/ai/tasks/ticket-450/samples/vedur-stations-all-v2.json` | `d8404ec4a7dc84ba57adf6a03674e4ca0417d8bb79a1cbd44586ab9faf7e27f4` | 152165 |
| `docs/ai/tasks/ticket-453/cc-report.md` | `0fece05083ebfba793aafc8c488a61b49b9de68ef084534f24e7ec7c5ecaaefd` | 39522 |
| `docs/open-meteo-auth.md` | `106ce6d3b635baba5489935c91dcbe647d3c3d21393e68ff4629186ca351ca9d` | 7952 |
| `api/forecast.js` | `1c81af478fec1b34a2e97b26fc3cec1e1d1911d699c30a23a720a9e439b508fe` | 6100 |
| `api/_lib/auroraDecision/openMeteo.js` | `ef47c67f199bf9bba97b457b300ca1d333639ebf87935a07d0e6eb0672146804` | 7015 |
| `api/_lib/openMeteoAuth.js` | `340c9fff32cc30d06e085e1a37fcb6171320ee213c767672f0f70184776ebdca` | 3445 |

`ticket-483/pre-sample-plan.md`'s hash matches the value quoted in #483's own `research-report.md`/`cc-report.md` exactly — unchanged since that round, confirms no silent drift before reuse.

Inherited #483 result (PASS, route/overall PARTIAL): unresolved Open-Meteo rights/account/operational evidence; point feed only HTTP-tested; Reykjavík-approach span 0 unresolved (no WGS84 geometry retained for extension IDs `914020037`/`903020037`, no verified transform); six original forecast points interior-support only on spans 1/2/3/6, shared P5 boundary-only for spans 4/5; nearby stations do not prove whole-span observation coverage. The old #483 next-task implementation suggestion is superseded by this ticket's own GO gate. #483's `harness/05` prints mismatches but still exits 0 — **this round's own assertions must exit nonzero on failure**, not rely on exit code alone (independently re-confirmed as still true by reading `harness/05_coverage_consistency_check.py` directly, not merely citing the prior report).

## 3. Client — built and self-tested BEFORE any provider request

| File | SHA256 | Bytes |
|---|---|---|
| `docs/ai/tasks/ticket-485/harness/wrapper.py` | `a7ca90fd101186c623ebdb63716f90b453b3c18ed3c94d683595414ad41b52f6` | 8426 |
| `docs/ai/tasks/ticket-485/harness/selftest.py` | `775abe35bd12b931f43a5315dbccc38c0a39a40b8a147414fe3b36314ee1d1b3` | 12858 |

Self-test run: `python3 -B selftest.py`, 2026-11-02, exit 0, **5/5 PASS**, entirely against local-loopback/synthetic fixtures in a throwaway scratch directory, never touching `samples/ledger.json`:
1. HTTP redirect received (302) and logged, never auto-followed.
2. Over-limit decoded body truncated at the exact configured cap, `truncated=True`; an under-limit body is NOT marked truncated (both directions exercised).
3. A hung connection times out and is durably recorded as a failed, budget-consuming attempt — not a silent hang.
4. Once a class's exchange-count cap is reached, the next attempt is refused *before* any network call, and the refusal itself does not consume budget.
5. An untrusted self-signed TLS certificate is rejected under default verification (RED, real local OpenSSL-issued cert, not a mocked/bypassed check) — then the identical code path succeeds (GREEN) once given that same certificate as an explicitly-trusted test CA (`verify=<path>`, still full chain+hostname validation, never `verify=False`). This is the only place in this task a non-default `verify` value is used, and only against a throwaway local test certificate — never against a real provider host.

Per Phase A's own STOP condition ("if trustworthy wrapper cannot be tested, no provider requests; deliver PARTIAL blocker report"): the wrapper IS trustworthy per the above, so bounded real requests may proceed.

## 4. Owner-attestation — absent, confirmed by directory listing

`docs/ai/tasks/ticket-485/owner-attestation.md` does **not exist** (checked directly: `ls` returns "No such file or directory", not inferred from silence). Only `owner-attestation-template.md` is present (template, not evidence; its own content is a blank checklist, never filled). Per the approved prompt: absent attestation is permitted and **knowingly caps the outcome at PARTIAL** for every axis-6 item that depends on it (Open-Meteo tier/quota/Production-key validity/customer-host response shape/VERCEL_ENV exposure, Preview configuration). CC does not fill this template, infer answers, or inspect any account. This is treated as a frozen fact of this plan, not re-checked later in the round.

## 5. Route/CRS/anchor selection — method frozen now, evidence gathered after

**Anchor** (city-side convention, not a road endpoint): Veðurstofa station 1 "Reykjavík", full-precision coordinates from the retained `vedur-stations-all-v2.json` catalog (#450) — `lat=64.1288833618, lon=-21.9081897736` (verified by direct field read of the retained file above, matching the value Jonesy's prompt-review round cited). This is a RETAINED catalog value, not an imported public-knowledge coordinate.

**Candidates**: `1410010037` ("Rauðavatn", already WGS84-retained from #483), `914020037` ("Suðurlandsv. um Hádegismóa"), `903020037` ("Vesturlandsvegur") — leads, not a predetermined answer.

**Admissibility rule** (frozen, unchanged by any later evidence): winner anchor-to-line distance ≤ 8000m AND runner-up margin > 100m + 2·E, where E is an auditable, non-fitted positional/transform/metric uncertainty bound. If uncertainty is unsupported, the ranking ties/is inadmissible, distance is too large, or route direction/connection is ambiguous: **span 0 stays UNKNOWN, axis 1 cannot PASS for it** — this is the default outcome unless the evidence below clears the bar.

**Planned evidence path for E** (frozen BEFORE fetching): #483's `harness/02` already validated the WFS `srsName=EPSG:4326` reprojection against an independent DATEX control point (`IRCA_MP_1`) at 61.9m residual — a genuine "service-provided paired same-object coordinates with independent held-out residual" per the permitted-evidence list. This round's plan is to REUSE that existing residual as E (no new control fetch budgeted unless the reused value is judged insufficient after the real data arrives, in which case one reserve-slot control fetch may be used — not a new formula, just filling the preregistered E calculation with fresh input per the prompt's own allowance). E is therefore provisionally **61.9m**, rounded up for conservatism to **65m** for the margin test only; this rounding rule is frozen now, not chosen after seeing results. 2·E = 130m, so the runner-up margin threshold is **> 230m**.

Both candidate extension IDs will be fetched this round via the SAME retained WFS endpoint and query mechanism #483 already used successfully (`gis:faerdferlar2017_1`), once with no `srsName` (native EPSG:3057, for VEGHLUTI role/tier documentation consistent with #483's existing methodology) and once with `srsName=EPSG:4326` (service-side reprojection, giving a WGS84 coordinate directly — no local transform library is installed or will be installed; none is needed if the service reprojects). Only the IDs `914020037,903020037` are requested — no national re-fetch, no re-fetch of the already-retained 13-ID chain.

VEGHLUTI role/precision-tier selection rules, ramp/opposing-carriageway exclusion, and the "do not sum full roundabout rings as driven distance" rule are reused unchanged from #483 (`research-report.md` §1, `source-register.md` S3).

## 6. Sample points and ETA — frozen now

Interior midpoint (by cumulative selected through-line length) of each resolved span 1–6, plus span 0 **only if** §5 resolves it this round. Ambiguities are recorded, never resolved by picking a favourable point.

**Departure: 2026-11-03T08:00:00Z** (the next calendar UTC day after this freeze). Illustrative constant speed **60 km/h**, no stops. Required ETA = departure + (cumulative selected through-route distance to the point ÷ 60 km/h), rounded to the nearest forecast hour within 30 minutes (ties round earlier). **Strict rule**: if the approach/traversal length needed for a given point is missing (this applies to span 0 unless §5 resolves it), the downstream required ETA for that point is **UNKNOWN** — no sensitivity interval substitutes, and the 8000m anchor-offset bound is explicitly NOT a stand-in for a missing driven-approach length.

One point is representative sampling only, never continuous coverage — stated here so it is not re-litigated after results arrive.

## 7. Network ceilings, allocation and drop order — frozen now

Implemented exactly in `harness/wrapper.py` (self-tested §3): one 45-minute provider-request window (first attempted request → final exchange), 10-minute cumulative network wait, 20s per exchange, 24 total exchanges (16 data + 8 doc), 20MiB decoded data / 8MiB decoded docs, per-body 4MiB data / 2MiB doc, max 3 exchanges per redirect chain. Every attempt of any kind (success, failure, timeout, redirect, retry) consumes one exchange slot from its class and counts toward the byte/time ceilings — confirmed by the wrapper's own code and self-test §3 item 3/4.

**Planned sequence (priority order; drop order is the REVERSE of this list — lowest-numbered item is dropped last):**

| # | Class | Target | Purpose | Required? |
|---|---|---|---|---|
| 1 | doc | `https://open-meteo.com/en/pricing` (then explicit linked terms/API-docs pages found there, within the doc8 allocation) | Rights-gate: does official text explicitly permit this intended commercial-research public-host retrieval? Also freezes the current documented parameter-name set (axis4 field-name rule). | Gates axis 4/6 scope — must run first |
| 2 | data | `https://gagnaveita.vegagerdin.is/api/faerdpunktar2017_1` | Required point/closure feed, HTTPS (axis 2/6) | Required |
| 3 | data | `https://gagnaveita.vegagerdin.is/api/faerd2017_1` | Required state feed, HTTPS (axis 2/6) | Required |
| 4 | data | WFS `gis:faerdferlar2017_1`, `CQL_FILTER=IDBUTUR IN (914020037,903020037)`, native EPSG:3057 | Span-0 role/tier evidence (axis 1) | Needed for span 0 only |
| 5 | data | Same WFS query, `srsName=EPSG:4326` | Span-0 anchor-distance evidence (axis 1) | Needed for span 0 only |
| 6 | data | Open-Meteo bundled forecast for resolved spans' sample points | Axis 4 | **Only if item 1's rights-gate reading explicitly permits it** — otherwise OMITTED outright, not attempted and not merely recorded as failed |
| 7 | doc | `api.vedur.is` OpenAPI/linked terms (reuse-check only; axis 3 is OPTIONAL) | Confirms/updates #450's reused CC BY finding | Optional, lowest priority, dropped first under time/budget pressure |
| — | reserve | up to 7 data + remaining doc slots | Preregistered exact gap checks, redirects, or retries only (at most 1 IMO observation fetch if item 7 motivates one) — never new-feed exploration | — |

If the 45-minute window or any budget is exhausted before reaching an item, that item is reported `NOT TESTED`, never silently assumed or inferred. Items 2–5 are attempted regardless of item 1's outcome (they do not depend on Open-Meteo rights). Item 6 is structurally gated on item 1 — this is decided now, not after seeing how convenient the terms text turns out to be.

## 8. Rights-gate decision procedure — frozen now, applied after reading

Official terms must be read BEFORE any Open-Meteo data request. The forecast request (item 6) proceeds **only if** the fetched text contains an explicit sentence that readably supports this specific intended use (commercial-research retrieval via the public host) with no contrary restriction found on the same page. A general CC BY data licence, a subscription offering, a historical HTTP 200, or "customer-host permission" alone are each explicitly INSUFFICIENT per the approved prompt. Missing, ambiguous, or JS-rendered/unreadable terms text resolves to UNKNOWN, with no further reserve search for alternate phrasing — item 6 is omitted, axis 4 (fresh) becomes `NOT TESTED`, and its two reserved slots stay unused. An explicit public prohibition means omit, but must not be over-read as "all paid use is prohibited" beyond what the text actually says.

## 9. Deterministic forecast field-name rule — frozen now

If item 1's fetched current API docs document the **new** standard names, request `hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,snowfall,weather_code,visibility` and map explicitly to production's legacy names (`windspeed_10m`→`wind_speed_10m`, `windgusts_10m`→`wind_gusts_10m`, `weathercode`→`weather_code`) in the report. If docs document only the legacy names, use those names unchanged. If neither is reliably documented from what was actually fetched, no alias is guessed — axis 4 (fresh) is `NOT TESTED` for that reason specifically. Required semantics regardless of the name used: `temperature_2m`, mean `wind_10m`, `gust_10m`, `precipitation`, `snowfall`, `weather_code`; `visibility` is OPTIONAL (`null` → UNKNOWN, never fails the required axis). Parameters to send if item 6 proceeds: `wind_speed_unit=ms`, `temperature_unit=celsius`, `precipitation_unit=mm`, `timezone=UTC`, `forecast_days=3`, derived latitude/longitude lists, no `models` parameter. Units actually returned (`hourly_units`) are read from the live response regardless — never hardcoded from the parameter name sent.

**Production-vs-research query differences, read directly from the current files above (not from memory of #483):**
- `api/forecast.js`: legacy field names (`windspeed_10m`, `windgusts_10m`, `weathercode`); `hourly` additionally includes `precipitation_probability` and 4 cloudcover fields plus `visibility` (shared with this round's optional field); `daily` output requested (this round requests none); `forecast_days=7` (vs this round's 3); `timezone` is caller-supplied or `"auto"` (vs this round's fixed `UTC`); unit params (`windspeed_unit`/`temperature_unit`/`precipitation_unit`) are only sent if the caller supplies them — by default NONE are sent, so production's default request receives Open-Meteo's own default units, not an explicit `m/s`.
- `api/_lib/auroraDecision/openMeteo.js`: also legacy wind field name (`windspeed_10m`); shares `visibility`/`precipitation`/4 cloudcover fields; uses the canonical `wind_speed_unit=ms` parameter (not the legacy `windspeed_unit` name) — the one place production already uses a canonical-named parameter; `timezone=UTC` (same as this round); uses `start_date`/`end_date` (not `forecast_days`); requests no temperature/snowfall field at all (not needed for aurora scoring).
- Neither production caller sets `models`. This sample cannot validate the keyed customer-host deployment, Preview, or any `models`-pinned behaviour — those remain owner-side, per §4.
- No existing production request is mirrored wholesale; this round's query is deliberately its own minimal, documented-name-first construction per §9's rule above, not a copy of either caller.

## 10. Frozen capability/grade rubric (restated verbatim from the approved prompt, not reworded)

Axes: **1** geometry/IDs, **2** required current state/closures, **3** OPTIONAL observations, **4** required point-labelled variable/ETA forecast, **5** time/failure/unknown contract, **6** required-source rights/HTTPS/account evidence. Each axis per span: PASS / PARTIAL / FAIL / UNKNOWN / NOT TESTED, with an explicit reason. **GO** only if every REQUIRED axis is PASS for every critical span (0–6) under this limited point-labelled display scope, with required rights/operational/transport proof. Optional-axis UNKNOWN is permitted if that display is simply omitted and disclosed. Any required unresolved condition caps the result at **PARTIAL**; affirmative evidence that the product cannot be supported is **NO-GO** (distinct from merely untested). No averaging, no crediting speculative future rights, no treating "unknown" as "low risk". This table is written before any network request (§10 above) and will be filled in, never redefined, by `research-report.md` after sampling.

**Given §4 (attestation absent) alone, axis 6 cannot reach PASS for the Open-Meteo-dependent account/operational items this round, regardless of what §8/§9 find — so PARTIAL is the ceiling already, before a single byte is fetched. This is written here, now, so it cannot be read later as a conclusion reverse-engineered from the results.**

## 11. Delivery checklist (frozen)

`research-report.md`, blocker/rights register + owner checklist, `coverage.csv` (status columns kept separate from nullable numeric columns), route/point mapping, `samples/` + `samples/ledger.json` (attempt ledger, SHA256 per retained body), `harness/` scripts + README + exact commands/stdout retained, `cc-report.md` with AC mapping including attestation presence/hash. All failures/redirects/truncations/start-end UTC/export/valid times/byte counts/hashes are retained in the ledger as they actually occurred — never overwritten or reconstructed after the fact.

---

**Freeze hash of this file**: computed and recorded in `samples/manifest.md` immediately after this file is saved, before the first provider request — per the same as-of/last-write distinction as line 1 of this file.

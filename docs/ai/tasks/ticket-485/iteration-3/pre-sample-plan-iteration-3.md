# #485 iteration-3 — Pre-sample plan (FROZEN before any provider request)

**Frozen as-of (UTC): 2026-11-02T15:18:43Z.** Written after that as-of instant, both before the first provider request of this round.

Governing document: `approved-prompt-v3.md` (Ripley, 2026-11-02, Jonesy iteration-3 Round-2 APPROVED). This file implements its Phase A.

## 1. Credential boundary and key-presence check (done FIRST, offline-safe, before any network)

`OPEN_METEO_API_KEY` presence in this process's environment: **ABSENT** (boolean-only check, value never read/printed/logged — see `key-presence-check.txt`). Per the approved prompt: *"blank/missing=>skip customer probes and deliver offline portion"*. **Every keyed/paid portion of this round is therefore skipped entirely this run**: no customer-host request, no secret ever enters this process beyond the boolean absence-check itself. Axis 4's paid-forecast/routeETA-at-customer-host item and axis 6's bounded-paid-access item are `NOT_TESTED`/`UNKNOWN` for that reason alone — this is a frozen, advance fact of this plan, not a conclusion reached after trying and failing.

Owner may supply `OPEN_METEO_API_KEY` in a *future* authorised execution's launching process (never in chat/files/CLI arguments); this plan and its mandatory pre-key client self-tests remain valid for that future run without needing to be redone, since the key presence is checked at run time, not baked into this plan.

## 2. New iteration-3 bounded client — built and self-tested BEFORE any provider request

`iteration-3/client.py` (NOT a reuse of `../harness/wrapper.py` for network, per the approved prompt). Structurally fixes the three gaps Jonesy's prior correction-round review found in the old client:
- the per-class exchange **count is incremented at `reserve()` time**, before the network call — a crash between reserve and outcome still durably consumes the slot on the next run (proven by self-test [5]);
- an **exact origin+path allowlist** is enforced (not "any https:// URL");
- the decoded-byte stream stop is against the **remaining global** allowance for that class, not only the fixed per-body cap;
- a **hard total deadline** (connect+full capped read combined, via a worker-thread future with `result(timeout=...)`), not merely `requests`' own per-read timeout (proven by self-test [1], where individual reads succeed but the aggregate exceeds the deadline).

Mandatory self-test suite (`iteration-3/client_selftest.py`, `client_selftest-output.txt`, exit 0, **8/8 PASS**), entirely against local-loopback/synthetic fixtures and a throwaway scratch ledger, run BEFORE the key-presence check above was even examined by this plan (the self-test file itself contains no reference to the real key or environment):
1. Slow drip beyond the total deadline → `TOTAL_DEADLINE_EXCEEDED`, not a hang.
2. Fully stalled connection → bounded failure (either our custom deadline or `requests`' own per-read timeout, whichever fires first — both are a correctly-bounded outcome, not a hang).
3. Oversized gzip-compressed body (2MB decoded from a small wire payload) → stopped at the **decoded** cap, not the wire size.
4. Fake-key redirect → never followed; Location is **unconditionally** reduced to scheme+host+path (query/fragment always dropped by construction, never scanned-for-and-redacted) — the fake key never appears in the outcome or the ledger file.
5. Simulated crash (reserve without an outcome) then a fresh ledger load ("restart") → the slot is already consumed; a further attempt against an exhausted budget is correctly refused pre-flight.
6. Fake-key leak scan: a response body containing the fake key is detected and refused (RED, nothing persisted containing it); the identical mechanism lets a clean response through normally (GREEN).
7. The keyed-client URL constructor (`build_keyed_url`) refuses a missing key, and for a present key returns **only** the fixed `https://customer-api.open-meteo.com:443/v1/forecast` target — there is no parameter by which a caller could redirect the secret to HTTP, loopback, or an alternate host/port/path, because the target is a module constant, not an argument.
8. TLS test (separate from the above): real local `openssl`-issued self-signed certificate rejected under this client's hardcoded `verify=True` — classified `TLS_FAILURE`, no raw exception/URL persisted. This client exposes no `verify=` override anywhere, so there is no insecure path to demonstrate a "green" bypass case against — by design.

Per the approved prompt's own STOP condition, the client IS trustworthy per the above, so bounded nonsecret doc/data requests may proceed. (No keyed request will be attempted this round regardless, per §1.)

## 3. Endpoint, partition, geometry and direction — resolved offline, ZERO new WFS fetch

Full detail and every intermediate number in `geometry_analysis.py`/`geometry_analysis-output.txt` (exit 0), computed entirely from already-retained files (`../samples/wfs-extension-native3057.json`, `../samples/wfs-extension-4326.json`, `../../ticket-483/samples/wfs-chain-4326.json` — hashes reconfirmed in that script's own output, unchanged from prior rounds).

**ETA zero** = IDFERILL 49926's own stored START vertex: native EPSG:3057 `[364380.1477, 405259.4325, 0]`, reprojected EPSG:4326 `[-21.78470739, 64.12336394, 0]`. A named research connection convention, not an official cadastral endpoint or city-street route; Veðurstofa station 1 plays no role in this definition (no nearest-anchor/8000m/E gate applies).

**Oriented span-0 path** (every lead independently vertex-matched, not assumed): ETA-zero↔42244-start (2.34m residual) → 42244 forward (1259.3m) → 42244-end↔1431-end (3.59m residual, 1431 traveled REVERSED) → 1431 reversed (909.9m) → ring bridge **1734** (role 5, confirmed closed ring; entry/exit residuals 0.00m/0.00m; shorter arc 54.6m, longer 76.2m) → 54723 forward (787.7m) → ring bridge **8677** (role 5, confirmed closed ring; entry/exit residuals 0.00m/1.31m; shorter arc 45.8m, longer 72.9m) → entry at IDFERILL 1436's stored end (chain boundary, `[-21.75906405, 64.10152894, 0]`), 1436's own interior excluded (already counted as span 1 territory). `9924` (north spur) and all of `49926`'s own length are excluded per the frozen rule.

**Span 0 oriented length**: **3057.4m** (shorter-arc hypothetical scenario) / **3106.1m** (longer-arc sensitivity) — neither is a proven driven distance; ring circulation direction is not established by geometry alone.

**Role documentation**: VEGHLUTI 5 = "hringtorg" (roundabout), cited from the retained #483 owner-source PDF page 3 — both bridge pieces independently confirmed as genuine closed rings (first vertex == last vertex) in the retained geometry itself, not merely trusted from the tag. Roles 1/8 remain undocumented in every retained source; checked against the live Vegagerðin data-format page in §4 below.

**Spans 1–6**: reused unchanged from `../../ticket-483/coverage.csv`/`route-segments.csv` (SHA256 `341366dc...` for coverage.csv, reconfirmed unchanged) — oriented through-lengths (respecting the established chain adjacency order, not an unordered tier/fragment sum) recomputed directly from `route-segments.csv`'s own per-segment `length_km_vegnr1_tier0`/`roundabout_km` fields, grouped by span: span1=33.23km, span2=12.28/12.63km (without/with ring), span3=35.81/36.15km, span4=12.81km, span5=67.42km, span6=13.40km. Total (without rings, span0 shorter-arc): matches #483's own 174.95km exactly for spans 1-6, confirming no drift.

**CRS**: no new WFS fetch (none needed — all geometry reused). The station-road 61.9m DATEX figure is, again, explicitly NOT treated as a positional-accuracy bound (unchanged from the prior correction round's finding) — this round does not invent a new E either; §4 below documents what the EPSG pages can and cannot establish on this point.

## 4. Sample points and times (frozen BEFORE any request)

Span-0's midpoint IS supported (a real, if hypothetical, numeric oriented length) → **7 sample points** (span0 + spans 1–6), not 6.

Departure **D = 2026-11-03T08:00:00Z** (next UTC calendar day after this freeze). 60 km/h illustrative constant speed, no stops.

| Point | Cumulative-to-start (km) | Own length (km) | Midpoint cumulative (km) | Required route ETA (raw) | Rounded to nearest hour (≤30min, tie earlier) |
|---|---|---|---|---|---|
| span0 | 0.0000 | 3.0574 | 1.5287 | 2026-11-03T08:01:32Z | **08:00** |
| span1 | 3.0574 | 33.2300 | 19.6724 | 2026-11-03T08:19:40Z | **08:00** |
| span2 | 36.2874 | 12.2800 | 42.4274 | 2026-11-03T08:42:26Z | **09:00** |
| span3 | 48.5674 | 35.8100 | 66.4724 | 2026-11-03T09:06:28Z | **09:00** |
| span4 | 84.3774 | 12.8100 | 90.7824 | 2026-11-03T09:30:47Z | **10:00** |
| span5 | 97.1874 | 67.4200 | 130.8974 | 2026-11-03T10:10:54Z | **10:00** |
| span6 | 164.6074 | 13.4000 | 171.3074 | 2026-11-03T10:51:18Z | **11:00** |

These "required route ETA" values depend on the shorter-arc, exclusion, and direction choices in §3 (none of them axis-1-directional-PASS-certified) — they are frozen now so they cannot be picked after seeing any forecast result (none will be fetched this round regardless, per §1), not because they are claimed accurate driven times.

**Separate fixed availability-test times** (per the approved prompt, NOT a substitute for the above): span0 D08:00, span1 D09:00, span2 D10:00, span3 D11:00, span4 D12:00, span5 D13:00, span6 D14:00 — i.e. 2026-11-03T08:00:00Z through 2026-11-03T14:00:00Z. These would only ever have been used to test "does the API return SOME data for this UTC hour", not to claim a real route ETA. **Moot this round**: no forecast request of any kind is being made (§1).

## 5. Deterministic forecast field-name rule, alias table and 400-classifier (frozen now; NOT exercised this round — no key)

Per the approved prompt's required semantics: `temperature_2m, wind_speed_10m, wind_gusts_10m, precipitation, snowfall, weather_code` (visibility optional). Alias mapping (current→legacy, for citing against production code only, never guessed by probing): `wind_speed_10m`→`windspeed_10m`, `wind_gusts_10m`→`windgusts_10m`, `weather_code`→`weathercode`. Current-name confirmation against Open-Meteo's own live docs is attempted in §6 below (doc fetch, non-keyed) — if that fetch is unreadable/ambiguous, no alias is guessed and this item stays `NOT_TESTED` regardless of key presence.

Frozen 400-classifier (would only apply if a keyed request were ever made and returned 400 — **not exercised this round**):
- `OPTIONAL_VISIBILITY_REJECTED`: parsed reason matches `^Cannot initialize WeatherVariable from invalid String value visibility\.?$` AND `error=true`/`status=400`.
- `DOCUMENTED_ALIAS_REJECTED`: same anchored form with exactly one frozen required/optional variable name substituted, only when the (if confirmed) alias table contains a documented same-semantic alternative.
- Any unmatched 400 text → stop, no second request. At most one second request total, which may omit optional `visibility` or substitute the one frozen documented alias; never drops required semantics; never retried on auth/rate errors.
- Safe transport-retry category (connect/read/total-deadline only, never 401/403/429, never on suspected disclosure) — frozen here, unused this round.

## 6. Doc targets this round (data targets below)

Planned, in priority order, using the new client, exact-allowlisted:

| # | URL | Purpose | Priority |
|---|---|---|---|
| 1 | `https://open-meteo.com/en/docs` | Confirm current documented parameter names (§5) | High — gates the alias-confirmation item |
| 2 | `https://gagnaveita.vegagerdin.is/vefthjonustur/faerd-gagnasnid` | Check for official VEGHLUTI role documentation (1/8), beyond #483's retained PDF | High — affects axis-1 role-documentation status |
| 3 | `https://epsg.org/crs_3057/ISN93-Lambert-1993.html` | ISN93/Lambert-1993 CRS definition citation | Medium — CRS evidence, not a transform |
| 4 | `https://epsg.org/method_9802/Lambert-Conic-Conformal-2SP.html` | Lambert Conformal Conic method definition/accuracy citation | Medium — CRS evidence, not a transform |

**Deliberately NOT re-fetched**: `https://open-meteo.com/en/terms` (explicitly forbidden — reuse the retained 2026-11-02 `openmeteo-terms.html`, ledger seq 1 from the prior round) and `https://open-meteo.com/en/pricing` (already retained same-day from the prior round, unchanged content expected — re-fetching identical content would waste a doc slot for zero new information; reused instead, a judgment call recorded here rather than silently made).

**No data-class targets planned this round.** Refreshing `faerd2017_1`/`faerdpunktar2017_1` is explicitly optional ("necessary for claims of contemporaneous required state"); this round's focus is axis 1 (geometry/direction) and axis 4/6 (paid-path mechanics, which the absent key already makes moot) — skipping the refresh and disclosing axis 2 fresh-state as **historical, not re-verified this round** is the stated tradeoff, not an oversight.

Redirect hosts allowed (HTTPS only): `epsg.org`, `www.epsg.org`, `gagnaveita.vegagerdin.is`, `www.vegagerdin.is`, `open-meteo.com`, `www.open-meteo.com`. No installs, no opportunistic reserve spend, no target added after seeing an outcome.

## 7. Grades frozen in advance

Given §1 (no key) and the standing owner-attestation gap already established in prior rounds: axis 6 cannot reach PASS for any Open-Meteo-dependent paid-access item this round either. Axis 1 cannot reach directional PASS without circulation evidence this round has not yet found (§3). **PARTIAL is the ceiling, frozen here before sampling** — exactly as it was for every prior #485 round, now for a more specific and better-evidenced reason (geometry/direction progress real; paid-access mechanics built and proven but never exercised due to no key).

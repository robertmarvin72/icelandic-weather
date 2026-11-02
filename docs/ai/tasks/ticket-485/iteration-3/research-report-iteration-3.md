# #485 iteration-3 — Research report: new Reykjavík-area connection convention, bounded paid-path mechanics

2026-11-02. CC. Executed `approved-prompt-v3.md` (Ripley, Jonesy iteration-3 Round-2 APPROVED). Research only — no production code/API/UI/DB/config change, no accounts/purchases/installs, no MVP proposal. Frozen plan: `pre-sample-plan-iteration-3.md`, SHA256 `1eab5588637475bc5417675e68da11c5a36ff999675fc40a698c20c64078b4a6` (as-of 2026-11-02T15:18:43Z), before the first provider request at 2026-11-02T15:20:30Z. Baseline HEAD `ea6d28731983c04f90a822a7750589e496e7a5b5`, unchanged.

**CORRECTION v4 NOTICE:** Jonesy's review of this execution found real, confirmed secret-leak paths in the client code this report describes as self-tested, plus several overclaims and a methodological inconsistency. See **§8 "Correction v4 (R1–R5)"** at the end of this document before relying on anything in §2, §3's length figures, or §6's grade table below — several of those are superseded, not merely footnoted. The headline (PARTIAL/PARTIAL, not GO) is unchanged and was already correct.

## Headline

### Route result: **PARTIAL**. Overall: **PARTIAL**. Not GO, not NO-GO.

Frozen as the ceiling before any request: no `OPEN_METEO_API_KEY` in this process's environment (§1), and no circulation evidence yet found for the new span-0 path's ring bridges (§3) — both known in advance, not discovered after the fact.

## 1. Credential boundary — key absent, every keyed/paid item skipped by design

`OPEN_METEO_API_KEY` presence check (boolean only, value never read/printed): **False**. Per the approved prompt's own fallback rule, every keyed/paid portion of this round is skipped entirely — no customer-host request was made, no secret ever entered this process beyond the boolean check itself. Axis 4's paid-forecast/route-ETA-at-customer-host item and axis 6's bounded-paid-access item are `NOT_TESTED`/`UNKNOWN` for this reason alone.

## 2. New iteration-3 client — built, self-tested, used only for nonsecret doc fetches

`iteration-3/client.py` (a new client, not a reuse of `../harness/wrapper.py`), self-tested with `iteration-3/client_selftest.py` (**8/8 PASS**, exit 0, `client_selftest-output.txt`) entirely against local-loopback/synthetic fixtures before the key-presence check was even examined. The suite proves, not merely claims: a hard TOTAL exchange deadline (not per-read) catches a slow-drip response that individual per-read timeouts would miss; a stalled connection is bounded either way; a decoded (not wire) byte cap stops an expanding gzip body; redirect Locations are unconditionally reduced to scheme+host+path, never scanned-and-redacted (safer by construction); a simulated crash-before-outcome still durably consumes its budget slot on "restart" (the exact gap the prior client had); a fake-key leak in a response body is detected and nothing persists it; the keyed-URL constructor refuses a missing key and, when given one, returns only the fixed customer-host target with no parameter a caller could misuse; and the default-TLS-only design (no `verify=` override exists anywhere in this client) is demonstrated by a real local self-signed certificate being rejected under default verification. One real bug found and fixed during this process: the worker thread's header dict lost `requests`' case-insensitive lookup when naively converted with `dict()` — fixed to use `requests.structures.CaseInsensitiveDict` explicitly (caught via a real 308 redirect in Phase B, §4, not merely in the synthetic suite — disclosed, not hidden).

Used for **5 nonsecret doc exchanges** only (§4); zero data-class exchanges; zero keyed exchanges (none attempted, per §1).

**CORRECTED (§8, R1): the paragraph above overclaims what the self-test suite actually established.** The suite proved the nonsecret loopback mechanics it names — it did **not** prove the client is safe for a keyed request, and two real leak paths exist in code none of those 8 tests exercised: `client.py:139`'s `reserve()` persists the full raw request URL (including any query string) into the durable ledger before any redaction, and `do_fetch.py:38` prints the raw exception string on any failure, which for `requests` exceptions commonly embeds the full URL. Neither path was simulated by any self-test. §8 has the full correction; the client remains historical and is not fit for keyed use.

## 3. Endpoint, partition, geometry and direction — a new, named research convention, fully reproducible

`iteration-3/geometry_analysis.py` (`geometry_analysis-output.txt`, exit 0) computes everything below from **already-retained** files — zero new WFS fetch, per the frozen rule.

**ETA zero** = IDFERILL 49926's own stored START vertex: native EPSG:3057 `[364380.1477, 405259.4325, 0]`, reprojected EPSG:4326 `[-21.78470739, 64.12336394, 0]`. This is a named research connection convention, not an official cadastral endpoint or city-street route; Veðurstofa station 1 plays no role in this definition — the old nearest-anchor/8000m/E-ranking gate from rounds 1–2 simply does not apply here, and that old PARTIAL result stays historical, not retroactively changed.

**Oriented span-0 path**, every lead independently vertex-matched against the retained geometry (not assumed from Jonesy's review text):

| Hop | Residual | Note |
|---|---|---|
| ETA-zero (49926 start) ↔ 42244 start | 2.34m | within 5m bound |
| 42244 end ↔ 1431 end | 3.59m | within 5m bound; **1431 traveled REVERSED** |
| 1431 start ↔ ring 1734 entry (vertex idx 2) | 0.00m | exact shared vertex |
| ring 1734 exit (vertex idx 5) ↔ 54723 start | 0.00m | exact shared vertex |
| 54723 end ↔ ring 8677 entry (vertex idx 3) | 0.00m | exact shared vertex |
| ring 8677 exit (vertex idx 0) ↔ 1436 stored end | 1.31m | within 5m bound (close to, not identical to, Jonesy's own ~0.7m estimate — independently computed, not copied) |

Both ring 1734 and 8677 are **independently confirmed genuine closed rings** (first vertex == last vertex, checked directly in the retained coordinate arrays, not merely trusted from the VEGHLUTI=5 tag). Ring 1734: total 130.8m, arcs 54.6m/76.2m. Ring 8677: total 118.7m, arcs 45.8m/72.9m. Per the frozen rule, only the **shorter** arc is used as a hypothetical numerical ETA scenario; the longer arc is reported separately as sensitivity, never summed with or substituted for the shorter one, and neither is treated as proof of actual circulation direction.

**CORRECTED (§8, R5): disclosed approximation, not previously stated plainly enough.** `geometry_analysis.py`'s entry/exit matching (`nearest_vertex_index`) finds the **nearest already-stored vertex** on each ring, not a true point-to-segment line projection. For these two rings the residuals happened to be ≤1.31m (effectively exact shared vertices), so the approximation made little practical difference here — but the method itself is a vertex-snap, not the "fully satisfied projection method" a reader could have inferred. All numerical scenarios in this section remain approximate for that reason, independent of the direction/circulation caveat already stated.

**Span 0 oriented length: 3057.4m (shorter-arc)** / **3106.1m (longer-arc sensitivity)** — excludes IDFERILL 1436's own interior (already span-1 territory) and all of `9924`/`49926`'s own length (the north spur and the zero-anchor piece itself contribute no traveled distance, per the frozen exclusion rule).

**Spans 1–6**: reused unchanged from `../../ticket-483/coverage.csv` (SHA256 `341366dc...`, reconfirmed identical) / `route-segments.csv`, grouped by span from the per-segment `length_km_vegnr1_tier0`/`roundabout_km` fields: span1=33.23km, span2=12.28/12.63km, span3=35.81/36.15km, span4=12.81km, span5=67.42km, span6=13.40km — totalling 174.95km without rings.

**CORRECTED (§8, R5): "recomputed" and "confirming no drift from this round's recomputation method" above are WITHDRAWN.** This is the same #483 per-IDBUTUR tier-0 sum, not a freshly oriented/travel-direction-recomputed length — no new computation happened this round for spans 1–6, only a regrouping of already-existing numbers. That it matches #483's own total exactly is not independent validation; it is the same arithmetic on the same source data, so agreement was guaranteed, not earned. These lengths are INHERITED/PROVISIONAL (see `coverage-iteration-3.csv`'s `length_status` column), not fresh. Separately: span 0 above uses explicit shorter/longer ring-ARC projections, while spans 2 and 3 (which also contain their own `roundabout_km` component) merely sum without/with the FULL ring length — this is a real methodological inconsistency for claiming one comparable, complete driven distance across the whole route, left as a disclosed limitation, not reconciled this round.

**Role documentation, cited not assumed**: VEGHLUTI 5 = "hringtorg" (roundabout) per #483's retained owner-source PDF page 3 — and now independently geometry-confirmed as genuine closed rings for both bridge pieces, not merely tag-trusted. Roles 1 and 8 remain **UNDOCUMENTED**.

**CORRECTED (§8, R4): the sentence above describing why roles 1/8 remain undocumented was wrong about the cause.** The live Vegagerðin data-format page redirected to a second page (308) that itself had a further, real redirect target visible in its own response body — this target was **not reached**, but not because the doc budget was exhausted (one doc slot and one allowed redirect hop both remained unused) and not because the target is known to lack role content. It was not reached because a real bug in `client.py` (the header case-insensitivity issue, §8) caused this round to misread that response as having no further `Location` at all. The correct statement is: role 1/8 documentation was **not obtained** this round, for a specific, fixable reason — not that it is absent, and not that the budget ran out.

**Circulation evidence**: no retained or newly-fetched source this round states which direction traffic may legally travel around either ring, or confirms this specific `42244→1431→1734→54723→8677→1436` sequence is an authorised through-route rather than merely a topologically-connected one. **Axis 1 does not reach directional PASS this round** — topology/availability progress is real and reported, PARTIAL by the frozen design, not FAIL.

## 4. CRS evidence — citation, not a new transform

Fetched `https://epsg.org/crs_3057/ISN93-Lambert-1993.html` (200, retained): official definition confirms EPSG:3057 = "ISN93 / Lambert 1993", Projected CRS, **Scope: "Topographic mapping (medium and small scale)"**, Extent: Iceland, Cartesian 2D easting/northing in metres, Base CRS ISN93, Conversion "Iceland Lambert 1993". This is citable context about the CRS's intended precision regime, not a numeric accuracy bound — no claim beyond what the page states is made. `https://epsg.org/method_9802/Lambert-Conic-Conformal-2SP.html` returned **404** (a real CMS 404 page, not chased further per the no-search rule) — the Lambert-Conformal-Conic method's own accuracy page is UNKNOWN this round. **No installs, no unretained projection constants, no fitted transform** — the station-road 61.9m DATEX figure is, again, explicitly not treated as a positional-accuracy bound for this or any comparison (unchanged from the prior correction round's finding).

**Parameter-name freeze, now independently confirmed from the live docs**: fetched `https://open-meteo.com/en/docs` (200, retained) and confirmed the **current** documented names are `wind_speed_10m`, `wind_gusts_10m`, `weather_code` — the legacy names (`windspeed_10m`, `windgusts_10m`, `weathercode`) do **not** appear anywhere in the current docs page at all. This confirms the alias table frozen in `pre-sample-plan-iteration-3.md` §5 was the right choice, now evidenced rather than assumed.

Doc exchanges used: **5 of 6** (the Vegagerðin data-format page, its one followed redirect hop, the EPSG CRS page, the EPSG method page (404), and the Open-Meteo docs page). `openmeteo-terms.html`/`openmeteo-pricing.html` deliberately reused, not re-fetched (§6 of the plan). Zero data-class exchanges (state-feed refresh judged optional and skipped this round, disclosed as a tradeoff, not an oversight — axis 2 fresh state stays historical/not re-verified this round).

## 5. Sample points and times (frozen before any request, never fetched against this round — no key)

Span 0's midpoint is supported (a real, if hypothetical, oriented length) → **7 sample points** (span0 + spans 1–6), per the frozen rule. Full cumulative/midpoint/required-route-ETA table is in `pre-sample-plan-iteration-3.md` §4 (departure 2026-11-03T08:00:00Z, 60km/h illustrative). The separate fixed availability-test times (span0 D08:00 … span6 D14:00) were frozen but never exercised — no forecast request of any kind was made this round.

**CORRECTED (§8, R5): every `eta_route_utc` value anywhere in this task (this document, `pre-sample-plan-iteration-3.md` §4, `coverage-iteration-3.csv`) is HYPOTHETICAL, not a route-valid ETA.** This was implied but not labelled explicitly enough before. Required route ETA is, strictly, UNKNOWN while direction/traversal-length evidence remains unsupported (§3) — the numbers are kept because they are a useful, honestly-computed scenario, not withdrawn, but must never be read as verified.

## 6. Grades (frozen format)

| Axis | Status | Reason |
|---|---|---|
| 1 — endpoint/topology/direction/IDs | **PARTIAL** | Topology/ordered-path progress real and reproducible (§3); directional circulation evidence absent → not PASS, not FAIL, by design. **Correction v4 (R5): this PARTIAL also now applies to spans 1–6**, not only span 0 — their lengths are inherited/not freshly re-verified this round either (see §3 correction), so this round does not re-assert their prior PASS without redoing that work. |
| 2 — current state/closures/time | **PARTIAL (historical)** | No fresh refresh attempted this round (disclosed tradeoff); #485-round-2's confirmation stands as historical, not re-verified |
| 3 — optional observations | UNKNOWN (unused, no cap) | Not pursued this round, optional axis |
| 4 — paid required variables + route ETA | **NOT_TESTED** | No key present (§1) |
| 5 — units/gaps/failure/secret contract | ~~PASS (for what was actually run)~~ **CORRECTED → PARTIAL** | **Correction v4 (R1/R2): withdrawn.** The forward-looking keyed-safety contract (the part of axis 5 that matters for any *future* keyed run) is NOT proven — confirmed leak paths exist in `client.py`/`do_fetch.py` (§2 correction, §8). The nonsecret mechanics that WERE actually exercised (geometry assertions, ceiling/ledger checks) remain correctly verified, but axis 5 as a whole must read PARTIAL, not PASS, until the client is repaired and independently re-reviewed. |
| 6 — required-source rights + bounded paid access | **PARTIAL** | Paid path mechanics were built but are **not fit for keyed use** (§2 correction) and were never exercised (no key); standing owner-attestation gap from prior rounds unchanged |

**Research GO is not reached.** No continuous-coverage or safety claim is made. Deployment-side facts (routing, `VERCEL_ENV`, Preview, quota, uptime) remain separately UNKNOWN, as stated before any sampling, not relaxed afterward.

## 7. What stays explicitly unresolved

- Whether `OPEN_METEO_API_KEY` is actually configured for a future authorised run — owner-side, checked fresh each run, never cached across rounds. **Not re-checked in the v4 correction round — see §8; that round made zero network/key-presence access of any kind.**
- Circulation direction/legality around ring bridges 1734 and 8677 — a real, specific, nameable gap (not "further research cannot resolve this" — the opposite framing from the prior round's withdrawn overclaim).
- VEGHLUTI roles 1 and 8 — not obtained this round, for the specific client-bug reason in §8/R4, not because the content is absent.
- The EPSG Lambert-Conformal-Conic method's own accuracy page (404 this round, not re-guessed).
- Whether `client.py`/`do_fetch.py` can be made genuinely safe for a keyed request — unresolved; repair and independent review are explicitly deferred to a future, separately-approved round (§8).
- All items already listed in `../blocker-rights-register.md` from the prior round, unchanged by this one.

## 8. Correction v4 (R1–R5) — 2026-11-02, offline only, ZERO network (not even loopback or a key-presence check)

Jonesy's review of this iteration-3 execution found the headline correct (PARTIAL/PARTIAL, not GO) but several supporting claims wrong, unsupported, or methodologically inconsistent. Ripley's `approved-prompt-v4.md` authorises **report/grade/provenance/geometry-narrative corrections only** — no code repair, no network of any kind (including the self-test loopback servers and the `OPEN_METEO_API_KEY` presence check itself), no new sampling.

**R1 (the headline finding) — the client is NOT fit for keyed use; carried as a hard prohibition, not repaired here.** Two confirmed leak paths exist in code none of the 8 self-tests exercised:
- `client.py:139` — `reserve()` writes the caller's full, raw request `url` string into the durable `samples/ledger.json` **before any redaction logic runs**. A keyed URL built as `.../v1/forecast?apikey=<real key>` would be persisted to disk verbatim.
- `do_fetch.py:38` — `except Exception as e: print(f"FAILED: {type(e).__name__}: {e}")` prints the raw exception text, which for `requests` exceptions typically embeds the full request URL.
- `allowed_exact_urls` (`client.py:195`) is optional, and `build_keyed_url()` is only a URL-string constructor — there is no actual locked, end-to-end "keyed request" code path that forces an allowlist, forces `never_redirect`, or guarantees a redacted ledger write. Self-test [7] tested the constructor helper in isolation; it never drove a real request through `fetch_once` with a key attached, so it could not have caught either leak above.

No real key or request was involved in finding this — it is confirmed by reading the source, not by reproducing a leak with real secret material; this correction round made no network request and did not even check whether `OPEN_METEO_API_KEY` is present. `client.py`/`do_fetch.py`/`client_selftest.py` remain unchanged, historical, and are now explicitly marked (`iteration-3/README.md`) as **not fit for keyed use** — no repair is authorised here; a future keyed run needs a separately reviewed prompt, a client with a real locked-down keyed path, and independent review before any real key is ever read.

**R2 — grade corrections.** Axis 5 is corrected from PASS to **PARTIAL** (§6) — the forward-looking keyed-safety contract is not proven; the nonsecret mechanics that were genuinely tested stay verified, but the axis as a whole cannot read PASS. Axis 6 stays PARTIAL (unchanged in value, corrected in reasoning: unfit client, not merely "unexercised"). Axis 4 stays NOT_TESTED. Route/overall stay PARTIAL — no GO/NO-GO change.

**R3 — provenance.** The plan was frozen before the first request, as originally claimed — but `client.py`/`do_fetch.py` were never hash-pinned at that freeze point, and both were edited afterward (`do_fetch.py` at 2026-11-02T15:20:51Z to add the Vegagerðin redirect target to its allowlist; `client.py` at 2026-11-02T15:21:16Z for the header-case-insensitivity fix) — real-time reactions to what the live run found, not pre-planned, and previously undocumented as deviations. Full timestamps, current post-hoc SHA256 of every iteration-3 script, and the explicit "this is a snapshot now, not a reconstructed pre-request hash" caveat are in `iteration-3/README.md`'s "Correction v4 — provenance disclosure" section.

**R4 — the Vegagerðin role-documentation attempt.** Corrected above (§3) and in `samples/manifest-iteration-3.md`: the second redirect (308) had a further, real target visible in its own body; it was not followed because of the client's header-casing bug, not because of exhausted budget (one doc slot, one allowed hop both remained) and not because the target is known to lack content. "Not obtained," not "absent," not "budget exhausted."

**R5 — geometry method and ETA honesty.** Corrected above (§3, §5, §6) and in `coverage-iteration-3.csv` (new `length_status`, `axis1_direction` per span, `eta_route_status` columns): spans 1–6's lengths are inherited #483 sums, not freshly recomputed this round — the "exact match confirms no drift" framing was circular and is withdrawn. Span 0's ring arcs use shorter/longer hypothetical scenarios while spans 2/3's own internal roundabouts use a cruder without/with-ring sum — a real, disclosed methodological inconsistency, not reconciled this round. Span 0's ring entry/exit points are matched by nearest-stored-vertex, not a true line projection — disclosed, not previously stated plainly. Every `eta_route_utc` is labelled HYPOTHETICAL, never route-valid, while direction/traversal evidence remains unsupported. Per-span `axis1_direction` no longer silently inherits PASS for spans 1–6 either (§6).

**Validation:** `iteration-3/validate_iteration3.py` was extended (not replaced) with checks that fail nonzero if `axis1_direction`/`axis5_keyed_safety_contract` ever reads PASS, if `eta_route_status` is ever anything but `HYPOTHETICAL_NOT_ROUTE_VALID`, if a keyed-host URL ever appears in the ledger, or if forbidden client-readiness language remains in `README.md`/this report/the samples manifest — each demonstrated with an expected-RED mutation in a task-local in-memory copy, then a GREEN pass on the real files, no network. Re-run fresh, offline, immediately before this report: exit 0.

**Status:** HEAD unchanged. No new network request of any kind (provider, doc, loopback, or key-presence check). `pre-sample-plan-iteration-3.md` and `samples/ledger.json` hashes reconfirmed byte-for-byte unchanged. `client.py`/`do_fetch.py`/`client_selftest.py` source unchanged (their post-hoc hashes are recorded for provenance, not as evidence anything was fixed in them).

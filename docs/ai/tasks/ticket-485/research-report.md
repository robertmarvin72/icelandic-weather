# #485 — Research report: Reykjavík→Vík Route 1, source-labelled state/closures/observations/limited forecast

**Dated owner clarification2026-11-02:** reuse the previously recorded OWNER-REPORTED API Standard subscription and453 configuration facts. Absence of the optional attestation file is not absence of subscription evidence and does not prevent research. Newly unverified technical items stay UNKNOWN separately. See [owner clarification](owner-clarification-2026-11-02.md) for exact missing inputs and the conclusions each prevents; this supersedes blanket-form wording below without altering frozen historical results. No implementation/publication approval or new technical verification is implied.

2026-11-02. CC. Executed `approved-prompt-v1.md` (Ripley, Jonesy Round-2 APPROVED). Research only — no production code/API/UI/DB/config change, no accounts/keyed probes/secrets, no installs, no MVP proposal. Frozen plan: `pre-sample-plan.md`, SHA256 `4c05ce469d41fd8bd68f70d12e89718157789c3822fba764c39b1c57772a4a61` (as-of 2026-11-02T13:16:55Z, written 2026-11-02T13:19:52Z, both before the first provider request at 2026-11-02T13:20:22Z). Baseline HEAD `b1bc795244785197fc502f08289ac332c30fbbb2`, unchanged.

Grading: **VERIFIED SAMPLE** (fetched this round), **VERIFIED DOCUMENT CONTENT** (official text, read this round), **OWNER-REPORTED**, **INFERRED**, **UNKNOWN/NOT TESTED**.

---

## Headline

### Route result: **PARTIAL**
### Overall result: **PARTIAL**
### Not GO. Not NO-GO either — no affirmative evidence the product cannot be supported; required conditions remain unresolved, some newly and more precisely so.

This was already the stated ceiling before a single byte was fetched — `pre-sample-plan.md` §10 froze this conclusion in advance because owner-attestation is absent, and axis 6 (required-source rights/account evidence) therefore cannot reach PASS regardless of what the rest of this round found. Everything below is real, independently-gathered evidence; none of it is presented as reverse-engineered to justify a conclusion decided in advance — the conclusion was frozen BECAUSE the attestation gap was already known, not because of anything found afterward.

## 1. What is NEW this round (not a re-statement of #483)

**(a) Open-Meteo's public-host terms explicitly restrict this app's intended use.** Fetched `https://open-meteo.com/en/terms` (2026-11-02): *"You may only use the free API services for non-commercial purposes."* The same page's own commercial-use examples list includes *"Websites or apps that have subscriptions or display advertisements"* and *"Undisclosed research at commercial entities."* Eltum Veðrið/CampCast has Paddle subscriptions (`AGENTS.md`/`CLAUDE.md`) — it is commercial by the site's own stated definition. Per the frozen rights-gate procedure (`pre-sample-plan.md` §8), this is an **explicit restriction found on the official page itself**, not mere ambiguity — the forecast request was therefore **not attempted at all**, zero network cost. Axis 4 (fresh) is `NOT TESTED` for every span, a distinct category from `FAIL` (no attempt was made to fail). This does not affect production itself, which already uses the paid, keyed `customer-api.open-meteo.com` host per #453 — the restriction applies to THIS research round's own ability to independently verify fresh *public*-host forecast data, not to the app's existing paid path.

**(b) The point-incident feed now works over HTTPS — #483's last open transport gap, closed.** `https://gagnaveita.vegagerdin.is/api/faerdpunktar2017_1` returned 200 directly (`samples/legacy-faerdpunktar-https.json`), no redirect. #483 never attempted HTTPS for this feed at all (plain `http://` only). Both required Vegagerðin feeds are now confirmed HTTPS-reachable.

**(c) Span 0 (Reykjavík-approach anchor) moved from "no coordinates at all" to a real, reproducible — but still UNKNOWN — geometric picture. CORRECTED in this v2 round; the v1 text below was wrong about the reason, not the raw numbers.** #483 could not compare the anchor to candidates `914020037`/`903020037` because neither had any retained WGS84 geometry. This round fetched both IDs fresh via the SAME WFS mechanism #483 already validated (`srsName=EPSG:4326`, a server-side reprojection — no local transform library was installed or used), complete after a gap-fill retry (172/172 features; the first attempt capped at `maxFeatures=100` and only got 100, a deviation paid from reserve, not something `pre-sample-plan.md` specifically preregistered — see `samples/manifest.md`). Using the anchor retained from #450 (Veðurstofa station 1, 64.1288833618/-21.9081897736) and VEGNR='1', tier 0 (documented):

A retained script now computes this (`harness/span0_path_analysis.py`, `span0_path_analysis-output.txt`, exit 0) — the v1 round left these figures only in prose/CSV with no runnable command behind them, which Jonesy correctly flagged:

| Candidate | Nearest through-road point distance from anchor | Role set |
|---|---|---|
| `903020037` ("Vesturlandsvegur") | **5924.6 m** | {1,6,7} and {1,7} agree; {7}-only still ranks it first |
| `914020037` ("Suðurlandsv. um Hádegismóa") | **5931.6 m** ({1,6,7}/{1,7}) or 6024.5m ({7}-only) | role-set sensitive |
| `1410010037` ("Rauðavatn", reused #483 geometry) | 7851.6 m | role-set stable |

**Correction (R1b): the uncertainty bound E is UNSUPPORTED, and that — not a "7m tie" — is the real reason span 0 stays UNKNOWN.** The v1 round cited E=61.9m, reused from #483's DATEX-control residual, as a "service-provided paired same-object coordinate residual" for this comparison. That citation was wrong: #483's own `harness/02` output states plainly that this figure "is NOT a same-object projection-accuracy bound for lengths" (`02_srs_validation_and_length-output.txt`), and it was measured at Hellisheiði, a different location from this junction. No other retained source supplies a supported E for an anchor-point-to-road-geometry comparison at this specific location. Per `approved-prompt-v1.md`'s own rule ("if uncertainty unsupported ... ranking tied/inadmissible ... span 0 remains UNKNOWN, axis 1 cannot PASS"), an unsupported E makes the admissibility test impossible to certify at ANY margin — this holds whether the raw margin is 7m or 1000m. **Span 0 stays UNKNOWN because E is unsupported, not because the candidates are "tied."** The ~7m margin between the two nearest candidates is reported only as descriptive geometric color (both roads converge near the same interchange, which is physically unsurprising) — never as the basis for the verdict, and never re-used as a new, self-certified E.

**Correction (R1c): connectivity to the retained chain was traced this round, not asserted.** The v1 round's claim that "research cannot resolve this further" and "only Vegagerðin could answer" is **withdrawn as an unsupported overclaim** — it was never actually tested in v1. This round traced a specific candidate sequence from Jonesy's own leads (IDFERILL 9924 on `903020037`, then 49926/42244/1431/54723 on `914020037`) to the retained chain's first segment (`1410010037`, IDFERILL 1436), using the retained tier-0 geometry only: endpoint gaps of 11.0m, 2.3m, 3.6m, 42.2m and 38.2m — every hop within the same <100m adjacency bound #483 used to certify its own 13-segment chain's continuity. **This sequence IS topologically adjacent end-to-end.** That is a real, useful geometry finding — but adjacency alone does not establish an official, directionally-designated through-route: VEGHLUTI roles 1 and 8 remain undocumented/inferred (per #483), and no owner/Vegagerðin confirmation of travel direction at this specific junction exists in any retained evidence. This is recorded as a geometry observation for a later owner/Ripley decision, not a resolved endpoint, and it does not by itself change span 0's UNKNOWN status (which rests on R1b's unsupported-E finding regardless of connectivity).

**Net effect: span 0 is still UNKNOWN, axis 1 still cannot PASS for it, exactly as the v1 headline said — but for the right, now-reproducible reason**, and without the overclaim that nothing further could ever be investigated. Per the frozen strict ETA rule, every downstream span's required ETA is therefore also formally UNKNOWN this round (missing/unresolved approach length cascades downstream) — moot in practice this round since no forecast request was ever attempted, but stated for the record per the frozen contract.

## 2. Required state/closures (axis 2) — fresh, HTTPS, re-verified independently

Fresh `faerd2017_1` (708 records nationwide): all 13 chain segments present (no missing/duplicate IDBUTUR), all **GREIDFAERT**. Fresh `faerdpunktar2017_1` (26 records nationwide — down from #483's 43, five days later; disclosed as a real-world count change, not investigated further, out of this round's scope): the two VEGAVINNA notices from #483 are still present and still active (`GildirTil` unchanged, 2029-03-09 dates — long-running permits, consistent with #483's own non-ETA-guarantee caveat).

**Correction (R2): the signed-age figures are now actually computed by a retained script, not approximated in prose.** The v1 round's `coverage.csv` said span 1's segments were "2-14590s" old — that number was never computed by any retained script and was wrong. `harness/time_quality_check.py` (`time_quality_check-output.txt`, exit 0) computes the real signed `DagsSkrad` age against BOTH the acquisition time (`REQUEST_TIME_UTC` from the retained headers, 2026-11-02T13:21:15Z) and the export time (`DagsKeyrtUt`, 2026-11-02T13:21:00Z) for all 13 chain segments and all 3 point events: span 1's own 4 segments are `252090037`=96s, `1410010037`=37,574s, `903010037`=`253020037`=37,575s against acquisition. Across all 13 chain segments the full range is **96s to 37,575s** (12 of 13 segments are 8.0–10.4 hours old; only `252090037` is under two minutes old). No missing/unparseable/negative/inconsistent timestamp was found for any of the 13 segments or the 3 point events (printed explicitly as `NONE FOUND`, not silently omitted).

**Independently re-derived, not merely re-cited**, using this round's OWN fresh point coordinates against the reused #483 chain geometry (point-to-polyline, clamped projection — same method, same code shape as #483's `harness/03`):

- IdPunktur 67861 (segment `902030037`): **0.089m** — identical to #483's figure, now reproduced with fresh data.
- IdPunktur 67862 (segment `902040037`): **0.138m** — identical to #483's figure, now reproduced with fresh data.
- IdPunktur 73801 (`901330037`, not on the chain): present this round, still a different `IdButur`, still correctly not associated by the own-ID-AND-distance rule.

See `harness/validate.py` (exit 0, `validate-output.txt`) for the exact assertions and real numbers.

## 3. Observations (axis 3, OPTIONAL) — unchanged, not re-pursued

No fresh Veðurstofa/DATEX observation sampling this round (axis 3 is explicitly optional for this product definition, per the approved prompt, and no new axis-6 rights cap applies to an unused optional source). The CC BY 4.0 licence for `api.vedur.is` was reconfirmed by directly re-reading the already-retained `docs/ai/tasks/ticket-450/samples/vedur-openapi.json`'s own `info.license` field — no new network request. Station-within-3km findings (#483: Hellisheiði 22.7m, Sandskeið 81.3m, point-to-line distance) are unchanged, not re-measured.

## 4. Required forecast (axis 4) — NOT TESTED this round, by deliberate rights-gate decision

See §1(a). No Open-Meteo data request of any kind was made. #483's historical finding (geometric interior-point support existed for spans 1/2/3/6, boundary-only for spans 4/5) is NOT re-claimed or re-verified by this round and is cited only as historical context in `coverage.csv`'s notes column — it does not substitute for this round's own axis 4 status, which is `NOT_TESTED` for every span.

**Production-vs-research query differences** (read directly from current files, not from memory of #483):
- `api/forecast.js`: legacy field names (`windspeed_10m`, `windgusts_10m`, `weathercode`); requests `daily` output (this round's frozen contract requests none); `forecast_days=7`; `timezone` caller-supplied or `"auto"`; unit parameters only sent if the caller supplies them (default: none, so production's own default request gets Open-Meteo's own default units, not an explicit `m/s`).
- `api/_lib/auroraDecision/openMeteo.js`: also legacy wind field name; uses the canonical `wind_speed_unit=ms` parameter (the one production caller that already does); `timezone=UTC`; `start_date`/`end_date` instead of `forecast_days`; no temperature/snowfall field.
- Neither sets `models`. Neither was mirrored wholesale — this round's frozen (but never-sent) query would have been its own minimal, documented-name-first construction.

## 5. Time/failure/unknown contract (axis 5) — followed and verified for the scope actually run

All fetched timestamps (`DagsSkrad`, `DagsKeyrtUt`, `GildirTil`) are parseable, non-negative-age, and correctly ordered for every one of the 13 chain segments and 3 point events re-examined this round — no missing/negative/inconsistent findings, computed by `harness/time_quality_check.py` and stated explicitly as `NONE FOUND` (not silently omitted; see §2). The synthetic midpoint self-check and real-data association re-derivation (`harness/validate.py` [1]/[2]) both pass with exit 0. **Scope label (R2): axis 5 PASS is supported for exactly these two checked branches (signed-age quality, association method) — it is not a claim that every conceivable time/failure/unknown branch of the frozen contract was exercised; axis 4's contract branches (e.g. forecast-ETA-gap handling) were never reached because no forecast request was made, and are `NOT_TESTED`, not silently credited as PASS.**

## 6. Rights and transport (axis 6) — PARTIAL, for a more precisely-characterized reason than #483

Both required Vegagerðin feeds are now confirmed HTTPS-reachable (§1(b)) — a real improvement over #483. The remaining cap is entirely on the Open-Meteo side: an explicit non-commercial restriction on the public host (§1(a)), a general paid-path clause that exists but establishes nothing about this owner's actual account (R4 — see `blocker-rights-register.md` for the exact quoted clause and what it does/doesn't establish), PLUS the standing absence of any owner-attestation covering the paid/keyed path's actual operational status. None of this is new uncertainty — it is now better-evidenced certainty about exactly what remains closed and why.

## 7. Network discipline — self-tested, then bounded for real (with corrected, not overclaimed, limits)

`harness/wrapper.py` was built and self-tested (`harness/selftest.py`, 5/5 PASS, exit 0, entirely against local-loopback/synthetic fixtures, never touching the real ledger — see `harness/selftest-output.txt`) BEFORE any real request, per the Phase A STOP condition. Real usage: **8 exchanges** (6 data + 2 doc) of the 24 allowed, **923,544 of 31,457,280 decoded bytes** allowed, **0.53s** of 600s cumulative wait allowed, well inside the 45-minute window — full detail in `samples/manifest.md` and `samples/ledger.json`. One self-identified gap, corrected: the first WFS extension-ID query used `maxFeatures=100` against an actual 172-feature population; retried at `maxFeatures=250`, paid from the reserve allocation. **Correction (R3): this retry was a deviation from the frozen plan, not something specifically preregistered there** — stated plainly rather than described as already anticipated. **Correction (R3, wrapper claims):** the v1 round's `cc-report.md` described protections stronger than `wrapper.py`'s actual code (e.g. implying every attempt is counted strictly before any crash could lose it, or that an origin allowlist exists). The real run was clean (8/8 outcomes recorded, no redirects/truncation/TLS failures), but the code itself does not structurally guarantee several of these — see `blocker-rights-register.md`'s "Wrapper execution-discipline limitations" section for the full, corrected list. `wrapper.py` itself is unchanged and frozen; any fix belongs to a separately approved iteration, not this correction round. **Correction (R5): no dedicated TLS certificate diagnostic was captured for the real requests** (unlike #483/#453's `openssl s_client` inspections) — every real exchange returned 200 under default certificate verification with no `SSLError`, which supports but is not the same as a retained explicit certificate check. The two incomplete `maxFeatures=100` WFS bodies were overwritten on disk by their complete retries; their raw bytes and SHA256 are now permanently unavailable (a real evidence loss, not merely "superseded" — see `samples/manifest.md`).

## 8. Validation (per the approved prompt's explicit requirement: "485 checks nonzero on failed assertions")

`harness/validate.py` (exit 0, `validate-output.txt`): synthetic midpoint check, real-data association re-derivation, full-ID presence/duplicate check, and — unlike #483's `harness/05`, which could print `** MISMATCH **` and still exit 0 — a `coverage.csv` cross-check demonstrated with an expected-RED corrupted copy (a task-local temporary file, never the real `coverage.csv`) that correctly raises `AssertionError`, followed by a GREEN pass on the real file. This specific defect class (detection without consequence) cannot recur in this round's own harness without an actual process failure.

## 9. Capability/grade table (frozen format, filled in after sampling — not redefined)

See `coverage.csv` for the full per-span table. Summary: axis 1/2/5 PASS for spans 1–6 (reused geometry + fresh state/time contract); axis 1 UNKNOWN for span 0, corrected reason (E unsupported — §1(c) above, not a "tie"); axis 3 PARTIAL (span 1 only) / UNKNOWN (others), unchanged, optional; axis 4 NOT_TESTED for every span (deliberate rights-gate omission); axis 6 PARTIAL for every span (HTTPS gap closed, Open-Meteo rights/account gap remains and is now more precisely characterized). **Format note (R5c): the table stays in wide per-span form rather than long-form per-variable rows because axis 4 is NOT_TESTED outright this round — there is no fresh forecast/ETA data to break out per variable. This wide format must not be read as evidence that long-form per-span/variable/point/ETA coverage was ever actually produced; it simply reflects that nothing forecast-shaped was fetched.**

## 10. Issue acceptance mapping

| # | Item | Answer |
|---|---|---|
| 1 | Reusable table | **YES** — `coverage.csv`, reused `route-segments.csv` (#483, unchanged) |
| 2 | Coverage distinguished from station existence | **YES** — unchanged from #483, not re-litigated |
| 3 | Time/closure data verified | **YES, re-verified with fresh data** — §2, §5 |
| 4 | Terms/HTTPS confirmed or marked unresolved | **PARTIAL** — HTTPS now fully confirmed for required feeds; Open-Meteo rights now an EXPLICIT restriction, not merely unresolved |
| 5 | Verified/inferred/UNKNOWN distinguished | **YES** |
| 6 | Single PASS/PARTIAL/FAIL + GO/PARTIAL/NO-GO | **YES — PARTIAL/PARTIAL, not GO** |
| 7 | Next-task proposal only if data supports it | **N/A this round** — no MVP proposal is authorized regardless of outcome, per the approved prompt; none is made |
| 8 | Jonesy/Ripley logged | Performed in the workflow |

## 11. What stays explicitly unresolved

See `blocker-rights-register.md` for the full table and the exact owner actions (if any) that could change each item. In short: Open-Meteo production key validity/customer-host shape/Preview config (owner-side, unchanged — the general paid-path clause found this round does not establish any of these), span 0's anchor ranking (unsupported E, not an inherent dead end — a future round with a genuinely applicable held-out residual could revisit it), Vegagerðin per-service licence applicability (still an inference, unchanged from #483), and `wrapper.py`'s execution-discipline gaps (code unchanged this round; see the register for the full list).

## 12. Correction-round v2 summary (this round, offline only, zero network)

Jonesy's round-1 review of the v1 execution found the headline (PARTIAL/PARTIAL, not GO) correct but several supporting claims wrong, unsupported, or missing a retained script. Fixed, entirely from already-retained data, with **zero new network requests of any kind** (no provider, no docs, no loopback/selftest servers):

- **R1**: added `harness/span0_path_analysis.py` (anchor-ranking + role-set sensitivity + ordered connectivity trace, all reproducible from retained samples); corrected the E citation (unsupported, not 61.9m); withdrew the "only Vegagerðin can answer" overclaim.
- **R2**: added `harness/time_quality_check.py` (real signed ages for 13 segments + 3 point events vs both acquisition and export); corrected `coverage.csv`'s wrong "2-14590s" note to the real 96–37,575s range.
- **R3**: corrected `cc-report.md`/this report/`blocker-rights-register.md` to state exactly what `wrapper.py` does and does not enforce, without editing the (frozen) wrapper itself; relabelled the WFS gap-fill retry as an unpreregistered deviation, not an anticipated check.
- **R4**: added the Open-Meteo pricing-page paid-path clause to `blocker-rights-register.md`, explicit about what it does and does not establish about this owner's actual account.
- **R5**: disclosed the two overwritten `maxFeatures=100` WFS bodies as a genuine evidence loss (not merely "superseded"); added an explicit TLS-result note (default verification, no certificate diagnostic retained); labelled the wide-CSV format as acceptable only because axis 4 is NOT_TESTED, not as proof of long-form coverage.
- **Validation/delivery**: `harness/validate.py`'s red/green demonstration was rewritten to mutate the parsed CSV row rather than a literal substring tied to the old "UNKNOWN_TIED" wording (so it survives future wording changes), and to use a task-local temp directory instead of the OS default (which failed under Ripley's sandbox permissions). Re-run: exit 0.

**Headline unchanged: Route PARTIAL, Overall PARTIAL, not GO.** Nothing in this correction round touched the real provider ledger, the frozen plan, or `wrapper.py`/`selftest.py` — all remain byte-for-byte as hashed in `pre-sample-plan.md`/`samples/manifest.md`.

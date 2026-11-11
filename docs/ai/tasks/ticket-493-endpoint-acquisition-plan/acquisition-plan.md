# #493 — Offline gagnaöflunaráætlun fyrir R1/E1/S2 (acquisition-plan)

2026-11-11, CC. Executes `approved-prompt-v1.md` (EP1–EP7). **This is a
plan, not a data-collection round.** No network call is made or
authorised by this document. `request-plan.json` lists NOT_AUTHORISED
requests for the owner's and Jonesy's review; `coverage-matrix.json`
records which of R1/E1/S2's own sub-questions are already answered by
retained data, which need one of those requests, and which are an
EXACT_GAP no request can resolve. A read-only snapshot of every
retained input cited below (`samples/retained_inputs_baseline.json`,
20 files) was taken BEFORE this file was written, per EP7(a).

## EP1–EP7, copied verbatim from `approved-prompt-v1.md`

- **EP1 (Verkefni 1–3, retained-first; merking staða):** `acquisition-plan.md` og `coverage-matrix.json` skilgreina fyrirfram: `RETAINED_SUFFICIENT` = ákveðin varðveitt skrá með slóð, lykli/línu og gildi sem inniheldur nákvæmlega þá staðreynd sem línan krefst (heimsókn, nafnnefning eða snerting er ekki nóg); `NEEDS_REQUEST` = aðeins ef beiðni er í `request-plan.json` með sýnda varðveitta uppsprettu; `EXACT_GAP` = host/lag/sía/reitir verða ekki leidd af varðveittum gögnum. Plan listar varðveitt inntök **með slóð og SHA** sem notuð eru til að meta hvort retained dugi (að lágmarki `road-links.csv`, `continuity-pairs.csv`, `chain-walks-v4.json`, `endpoint-candidates-v3.json`, `wfs93-raw.json`, `wfs-north-4326.json`, bæði `exchange-ledger.jsonl`, `place-inventory`-skrárnar og, ef skoðað, landsskrá `VEGNR=1` úr #483). **R1:** þar sem eigandi lét nákvæman punkt vera PENDING velur planið hvorki né afleiðir candidate og býr ekki til hnit; upptalning varðveittra stykkja kringum 1436 (með ID, ekki bbox) má vera listi óvalinna möguleika, ekki val. **S2 heiti:** skipt í (a) heiti staðarins (varðveittur Hagstofu-listi) og (b) notendaheiti aðkomunnar; `STADARLYSING` er vegkaflalýsing, ekki örnefnaskrá (varðveitt stafsetningarmunur Hánefsstaðavegur/Hánesstaðavegur sýnir það) og (b) er EXACT_GAP nema heimild sé nefnd.
- **EP2 (Verkefni 2–3, aðgengi/áttir; snerting ≠ akstursheimild):** Plan vitnar í eiginleikasett lagsins (skrá+lykill) og segir að enginn varðveittur reitur lýsir stefnu, einstefnu, beygjum eða aðgengi; `SNJOMOKSTURSREGLA`, `THJONUSTUFLOKKUR`, opnunartímar og `NAKVAEMNIFERLIS` eru ekki akstursheimild eða aðgengisgögn. Akstursaðgengi er því `EXACT_GAP` fyrir R1/E1/S2 nema metadata-beiðni (hér að neðan) sýni reit eða lag; geometrísk snerting er áfram aðskilin og hefur sína eigin línu í matrix. Metadata-skref í röð með STOP: fyrst `DescribeFeatureType` fyrir þekkta lagið `gis:faerdferlar2017_1` (lítið, afmarkað) og `GetCapabilities` aðeins ef það dugar ekki og með lægra bæta-hámarki en 8 MiB sem rökstutt er; hvort tveggja er staðlað OGC-form á varðveittum hýsli en **ekki sýnt í varðveittu ledger** og skal merkt `OPERATION_NOT_DEMONSTRATED_IN_RETAINED_LEDGER`. Ekkert feature-kall byggt á niðurstöðu metadata er smíðað í þessari lotu; planið segir aðeins hvaða niðurstaða myndi opna næsta (aðskilið) prompt.
- **EP3 (Verkefni 2–3, WGS84; engin vörpun):** WGS84-beiðnir fyrir E1/S2 nota aðeins sýnt form (`gis:faerdferlar2017_1`, `srsName=EPSG:4326`, `CQL_FILTER=IDBUTUR IN (…)`) með IDBUTUR-gildum sem plan sýnir úr `road-links.csv`/`wfs93-raw.json` (`911040037`, `911170037`). Væntanlegur fjöldi features er **reiknaður af varðveittum gögnum** (með ofangreindri fjölföldun á IDBUTUR og 4 stigum á kafla), hámark kalla/bæta fylgir honum með skráðri ónákvæmni og STOP ef fleiri features koma en hámarkið; ekki bbox, ekki landsniðurhal, ekki óstaðfestir rekstraraðilar (t.d. `ILIKE`) nema skráðir `UNKNOWN` með ástæðu. Planið skráir **fyrirfram** hvernig WGS84-par er paraður við native-par án vörpunar: sama `IDFERILL` og sama `NAKVAEMNIFERLIS`, sami hornafjöldi og native-feature úr varðveittu 3057-svari, rétt átt (fyrsti/síðasti punktur) og sami WGS84-endapunktur á öllum fjórum stigum; frávik er STOP/EXACT_GAP, aldrei útreikningur. Gróf athugun á gildissviði Íslands er leyfð sem skynsemispróf, ekki sem sönnun.
- **EP4 (Afhending, hver beiðni; ekkert gisk):** Hver beiðni í `request-plan.json` ber auk upptalinna reita `precedent_status` ∈ {`DEMONSTRATED_IN_RETAINED_LEDGER`, `OPERATION_NOT_DEMONSTRATED_IN_RETAINED_LEDGER`, `EXACT_GAP`} með tilvísun (ledger-skrá+lína), `request_id`s eru einkvæm og matrix-tilvísanir leysast, og sama gildir um `forbidden_variants` (t.d. bbox, ótakmarkað `maxFeatures`, nýr hýsill). Við hýsil/lag/síu án varðveittrar heimildar er `url` `null` með `EXACT_GAP`-ástæðu; slóð er ekki búin til. `px.hagstofa.is` er ekki varanleg heimild (phase2-bókun) og beiðni þangað, ef einhver, er merkt „þarf nýja heimild"; varðveittur Hagstofu-listi nægir líklega fyrir staðarheiti.
- **EP5 (Request-budget og framfylgd):** Budget-taflan er reiknuð í kóða úr `request-plan.json` (heildarkall, heildarbæti, hámark á svar, tímamörk, vindu), með 0 endurtekningum, tilvísanir = STOP (ekki fylgt) og kvittun á hverja beiðni jafnvel við villu. Töflan sýnir hvernig hámarkið er **framfylgt**: aðeins varðveitta `bounded_fetch.py` (phase2, SHA-fest, host-allowlist án `px.hagstofa.is` nema nauðsyn sé skráð) en ekki `curl --max-filesize`, vegna varðveitts chunked-svars. Hámörk ættu að vera innan fyrri þaks (12 köll/32 MiB/8 MiB/20 s/30 mín) eða frávik rökstutt. Ledger-reitir: UTC byrjun/lok, aðferð, slóð/líkami (engin leyndarmál, engin lykla- eða auðkenni úr umhverfi), status, content-type, bæti, SHA-256, tilvísun og truncated; auk `CRS`, `feature-id` (OBJECTID/IDFERILL) og `DAGSFERILS` úr svarinu sem ferskleikamerki.
- **EP6 (Acceptance næstu lotu; „ekki kalla coverage-heimsókn gildissönnun"):** Acceptance-listi er forskráður og krefst fyrir **hvert** nýtt hnitapar: gildissamanburðar við svarið (ekki aðeins að par sé til), rétts end/start fyrir hlutverk, finite/null-schema, tímasettrar heimildar (UTC + ledger-lína + SHA), að snerting sé skráð sérstaklega frá akstursheimild, að engin hnit komi úr vörpun, og að `candidate` verði ekki sjálfkrafa „promoted". Sértækt: leyfisstaða Vegagerðar (varðveitt tilvísun CC BY 4.0 á „Skilmálar vefþjónustur") og `LICENSE_NOT_DETERMINED` fyrir Hagstofu eru skráð þar sem við á. BB1–BB5 eru þekktar takmarkanir fyrri validator; hér er aðeins krafist þess að ný próf beri saman gildi, ekki að fyrri validator sé hertur.
- **EP7 (Heilindi áætlunar og niðurstöðumerki):** (a) SHA/stærð allra varðveittra inntaka sem vitnað er í er skráð **áður en fyrsta skjal er skrifað** og endurstaðfest í lokin; (b) niðurstöður sjálfstæðra athugana (JSON parse, einkvæm `request_id`, matrix-tilvísanir, þrjár staðaafmarkanir, budget úr lista) fara í `cc-report.md`/niðurstöðukafla, ekki inn í þegar hashaðar reglur; ef áætlun er breytt eftir athuganir er breytingin skráð með gamla og nýja SHA; (c) hash-tafla síðast, `cc-report.md` og CURRENT utan hennar; (d) niðurstaðan er `PLAN_WITH_EXACT_GAPS` ef einhver matrix-lína er `EXACT_GAP` (R1 nákvæmur punktur og akstursaðgengi eru þegar líkleg), `PLAN_READY_FOR_REVIEW` aðeins ef engin er það; (e) stutt scope-note um 72 tengingar eins og drögin segja, án þess að leggja til nýja framkvæmd; (f) EP1–EP7 orðrétt í `approved-prompt-v1.md` og í `acquisition-plan.md`.

## Retained inputs cited (path + SHA-256, snapshot taken before this file was written)

See `samples/retained_inputs_baseline.json` for the full machine-readable list (20 files). Summary:

| Label | Path | SHA-256 (first 12) | Size |
|---|---|---|---|
| endpoint-candidates-v3.json | `ticket-493-access-points/endpoint-candidates-v3.json` | `9dcb47c048a3` | 9,879 B |
| evidence-v4.md | `ticket-493-access-points/evidence-v4.md` | `d098ec34a0a0` | 14,854 B |
| result-review.md (access-points) | `ticket-493-access-points/result-review.md` | `b9f0aaff8909` | 47,341 B |
| endpoint-owner-decisions-2026-11-11.md | `ticket-493/endpoint-owner-decisions-2026-11-11.md` | `e820a09c8b9d` | 1,745 B |
| endpoint-decision-table-2026-11-11.md | `ticket-493/endpoint-decision-table-2026-11-11.md` | `122bacf50bac` | 5,296 B |
| akureyri-endpoint-decision.md | `ticket-493/akureyri-endpoint-decision.md` | `c2a57e96d1f3` | 2,330 B |
| release-definition-proposal.md | `ticket-493/release-definition-proposal.md` | `37c267cf1cda` | 3,774 B |
| road-links.csv | `ticket-493-place-network/samples/road-links.csv` | `bf25ff0f68f0` | 35,424 B |
| continuity-pairs.csv | `ticket-493-place-network/samples/continuity-pairs.csv` | `3ba573220653` | 14,855 B |
| chain-walks-v4.json | `ticket-493-place-network/samples/chain-walks-v4.json` | `640efec931a3` | 53,750 B |
| place-inventory.csv (phase-1) | `ticket-493-place-network/place-inventory.csv` | `e0acd2c2ae57` | 14,955 B |
| wfs93-raw.json | `ticket-493-place-data-phase2/samples/wfs93-raw.json` | `1d8c9cf880df` | 37,991 B |
| place-inventory-v3.csv (phase-2) | `ticket-493-place-data-phase2/place-inventory-v3.csv` | `d5606a4fa74e` | 6,476 B |
| exchange-ledger.jsonl (phase2) | `ticket-493-place-data-phase2/samples/exchange-ledger.jsonl` | `901d8d7c8d64` | 4,805 B |
| owner-authorisation.md (phase2) | `ticket-493-place-data-phase2/owner-authorisation.md` | `7a59deb72e16` | 3,219 B |
| bounded_fetch.py (phase2) | `ticket-493-place-data-phase2/samples/bounded_fetch.py` | `c2610ebfbfdc` | 6,226 B |
| pre-sample-plan.md (phase2) | `ticket-493-place-data-phase2/pre-sample-plan.md` | `c6605688c1c5` | 10,996 B |
| wfs-north-4326.json | `ticket-493-north-data/samples/wfs-north-4326.json` | `7075416ca463` | 302,849 B |
| exchange-ledger.jsonl (north-data) | `ticket-493-north-data/samples/exchange-ledger.jsonl` | `780fc0c5e330` | 7,398 B |
| manifest.md (north-data) | `ticket-493-north-data/samples/manifest.md` | `0ca4b658b2db` | 6,860 B |

The national `VEGNR=1` register from #483 was **not examined** this round (EP1's own "ef skoðað" qualifier) — not cited, not re-derived.

## What is already settled (not reopened)

- R1 product rule (named Reykjavík approach, both ring directions) is **approved**; the exact point is **PENDING**.
- E1 is **selected**: piece 2345 stored END = piece 2344 stored START, native EPSG:3057 `(715153.74, 536679.93)`. This is a product choice, not a fresh confirmation of driving access or WGS84.
- S2 is an **approved candidate**, not a confirmed boundary: piece 2894 stored END = piece 2892 stored START, native EPSG:3057 `(732875.6740, 538207.0762)`. Name, access/direction, and WGS84 are **PENDING**.
- Akureyri C stands (2940 END = 3876 START) — not reopened.
- BB1–BB5 are known limitations of the prior validator (`ticket-493-access-points`), not additional hardening tasks for this plan.

## R1 — Reykjavík

Piece 1436's own two ends are retained, **unselected** Rauðavatn comparison candidates (`endpoint-candidates-v3.json`): ENTRY/stored-END `(365522.0175, 402772.7620)` and EXIT/stored-START `(367768.9400, 401667.0900)`, both EPSG:3057, `piece_cost_m=2560.1497`. Neither is a confirmed Reykjavík core (`rey_core.coordinate_source=NO_COORDINATE_SOURCE`). `continuity-pairs.csv` additionally shows piece 1436's own retained geometric neighbours without selecting among them: `1735` (exact contact at 1436's start), `8677` (1.3157 m, "contact_5m" band, at 1436's end), and `54723`/`1477` (looser ~37–38 m "contact_100m" band) — listed here as an unselected possibility set per EP1, not a candidate.

**No request is planned for R1's own exact node, name, or ring-direction display.** This is a product/selection gap, not a data-availability gap: no retained file identifies a specific VEGNR=1 piece, node, or address as "the Reykjavík approach," so no host/layer/filter can be derived to resolve it. Resolving it requires one of:

1. an owner-provided reference point (a named junction or address in or near Reykjavík) to then locate in retained or newly-proposed geometry;
2. an owner decision to use one of the two already-retained Rauðavatn ends as the named approach (which would make this `RETAINED_SUFFICIENT` with no request at all); or
3. a proposal for a new, currently-unretained in-city dataset/host — itself a separate authorisation step, not something this plan proposes.

Driving access in both ring directions is covered by the shared metadata request below (`REQ-META-DFT-01`/`REQ-META-CAPS-01`), since it is the same open question for E1 and S2.

## E1 — Egilsstaðir

Native coordinate origin and the veg93/veg1 contact are both `RETAINED_SUFFICIENT` (already verified 0.0 m contact in `evidence-v4.md`) — not re-derived here.

**WGS84 gap:** no retained WGS84 geometry exists for road 93 (`endpoint-candidates-v3.json`'s own `wgs84_note`). `REQ-E1-WGS84-01` plans a `CQL_FILTER=IDBUTUR IN (911040037)` request in the already-demonstrated WGS84 form.

**A correction to the prior round's own sandbox note, found while building this plan:** IDBUTUR `911040037` is shared by **four** VEGNR=1 ring pieces — `1483` (kaflanr t1), `2349` (t2), `2347` (t3), `2345` (t4), a contiguous chain through Fellabær up to the Seyðisfjarðarvegur junction — not just pieces `2344`/`2345` as the access-points round's own prompt-review stated. This is confirmed by a direct `grep` of `road-links.csv` (see `samples/verify_plan.py`), not assumed. Because `road-links.csv` carries no tier field for VEGNR=1 pieces, whether these four pieces repeat road-93's own 4-`NAKVAEMNIFERLIS`-tier pattern in the live WFS layer is genuinely **unknown** from retained data — `request-plan.json` registers a confirmed minimum (4, from piece 2344's own retained tiers), a reasoned plausible range (8–20), and a generous stop cap (40), rather than asserting a single guessed number.

Driving access: see the shared metadata request below.

## S2 — Seyðisfjörður

The settlement's own Hagstofa name/code (900, MATCHED) is `RETAINED_SUFFICIENT` — a separate fact from the **user-facing approach name**, which is `EXACT_GAP`: no retained file names a label for the approach itself, and `STADARLYSING` is a road-segment description, not a place-name registry (the spelling inconsistency between piece 2894's own "Hánefsstaðavegur" and piece 2892's own "Hánesstaðavegur" is itself the evidence for this, per EP1).

The geometric contact (piece 2894 stored END = piece 2892 stored START, exact coordinate match) is `RETAINED_SUFFICIENT` — already established, not re-derived, and kept explicitly separate from any driving-access or town-boundary claim.

**WGS84 gap:** `REQ-S2-WGS84-01` plans `CQL_FILTER=IDBUTUR IN (911170037)`. Unlike E1's own request, this IDBUTUR is confirmed (by the same `grep`) to belong to **no** VEGNR=1 piece — it covers exactly the five already-fully-retained VEGNR=93 pieces (`3410`, `3409`, `2894`, `2892`, `2891`) × 4 tiers = **20 features**, an exact, not merely minimum, expected count. This incidentally includes piece 2891's own ferry-pier end (sharing the same IDBUTUR as S2's own junction) — the pier is explicitly out of this acquisition package per the approved prompt's own Verkefni §3, and this plan does not propose using that incidental feature for anything.

Driving access: see the shared metadata request below.

## Shared metadata step (R1/E1/S2 driving access), with STOP

No retained field in `gis:faerdferlar2017_1`'s own known feature set (`OBJECTID, STUTTNAFNLEIDAR, STADARLYSING, IDFERILL, IDBUTUR, VEGNR, KAFLANR, VEGHLUTI`, weekday/opening flags, `SNJOMOKSTURSREGLA`, `HELMINGAMOKSTUR`, `THJONUSTUFLOKKUR`, `NAKVAEMNIFERLIS`, `DAGSFERILS`) describes direction, one-way status, turn restriction, or driving access of any kind. Two requests, in order, with a STOP gate between them:

1. **`REQ-META-DFT-01`** — `DescribeFeatureType` for `gis:faerdferlar2017_1` alone. A standard OGC schema-description operation on an already-used host, but **not demonstrated in any retained ledger** — marked `OPERATION_NOT_DEMONSTRATED_IN_RETAINED_LEDGER`, not `DEMONSTRATED`.
2. **`REQ-META-CAPS-01`** — `GetCapabilities`, sent **only if** step 1 does not resolve the question. A `GetCapabilities` call WAS made once in a prior round (status 200 confirmed, north-data ledger line 1), but its body was discarded (`curl -o /dev/null`) and never retained — so the HTTP-level success is attested but the content is not, hence the same `OPERATION_NOT_DEMONSTRATED_IN_RETAINED_LEDGER` marking, with that caveat recorded explicitly. Capped at 4 MiB (half the project's own 8 MiB default, per EP2's own "lower cap, reasoned" instruction), since a capabilities document's size is bounded by this one GeoServer instance's own layer count, not by feature volume.

**No feature call of any kind is built from either response in this round.** The plan states only what result would open the next, separate, scoped prompt — exactly as EP2 requires.

## Acceptance for the next data-acquisition round (EP6)

For **every** new coordinate pair the next round introduces, the pre-registered acceptance list requires:

1. Value comparison against the actual response — not merely that a pair exists.
2. The correct `end`/`start` field for the role being claimed (same discipline as `validate_final_outputs_v4.py`'s own `stored_field` check).
3. Finite/null schema (never a string in a numeric-pattern field, never a bare number in an unrecognised key) — same allowlist discipline as the access-points round's own `assert_numeric_schema()`.
4. A timestamped authority: UTC retrieval time + ledger file + line + SHA-256 of the bytes actually read.
5. Geometric contact recorded on its own line, separate from any driving-access claim — contact is never read as access, and access is never asserted from contact alone.
6. No coordinate derived by reprojection — WGS84 must come from the host's own `srsName=EPSG:4326` response, never computed offline from the EPSG:3057 pair.
7. No `candidate` is auto-promoted to a selected product endpoint by the mere existence of a successful response — promotion remains a separate, explicit owner/Ripley step.

**License/freshness, specifically:** Vegagerðin's own "Skilmálar vefþjónustur" terms are retained as CC BY 4.0; Hagstofa stays `LICENSE_NOT_DETERMINED` until the owner separately confirms it (unchanged from phase2's own P1). BB1–BB5 are the prior validator's own known limitations — this acceptance list asks the next round's own new tests to compare values, not that the prior validator be re-hardened.

**"A visit is not proof of value"** (EP6's own framing): the next round's acceptance tests must compare the actual response value against the expectation computed here, not merely confirm that a request completed or that a coordinate field is non-null.

## Request budget (computed from `request-plan.json`, not hand-typed)

See `samples/verification_report.json`'s own `budget_table` (produced by `samples/verify_plan.py`, reading `request-plan.json` directly):

| | |
|---|---|
| Requests planned | 4 (`REQ-E1-WGS84-01`, `REQ-S2-WGS84-01`, `REQ-META-DFT-01`, `REQ-META-CAPS-01` — the last conditional on the third) |
| Total max calls | 4 |
| Total max bytes | 5,767,168 B (~5.5 MiB) |
| Per-request caps | E1/S2 WGS84: 262,144 B each; DescribeFeatureType: 1,048,576 B; GetCapabilities: 4,194,304 B |
| Timeout per request | 20 s (reused from phase2's own ceiling) |
| Acquisition window | 30 minutes (reused) |
| Retries | 0 |
| Redirects | STOP — ledgered as a completed exchange, never followed |

All four totals are well inside the prior precedent ceiling (12 exchanges / 32 MiB total / 8 MiB per response / 20 s / 30 min, `docs/ai/tasks/ticket-493-place-data-phase2/owner-authorisation.md`) — each per-request cap here is a *tighter*, reasoned deviation from the 8 MiB default, not a loosening. Enforcement is via the retained, SHA-cited `bounded_fetch.py` (phase2) — streamed read capped at `min(per_body_cap, remaining_total_budget)`, host allowlist checked before connecting, no automatic redirect following, no retries, a ledger entry written for every call including failures — **not** `curl --max-filesize`, because the one retained precedent that used `curl` hit a chunked response with no `Content-Length`, against which `--max-filesize` is documented not to apply (north-data ledger, correction lines 3–4).

## Next round's own ledger/record-keeping (what it must preserve)

Per EP5: UTC start/end, method, URL/query (no secrets, no environment-sourced keys/tokens), HTTP status, content-type, bytes received, SHA-256 of the bytes actually read, `truncated` flag, and the `precedent_status`/`forbidden_variants` this plan assigned — plus, from the response body itself: the feature's own CRS declaration, its own feature-id (`OBJECTID`/`IDFERILL`), and `DAGSFERILS` as a freshness marker. Raw response bodies are saved verbatim (as `wfs93-raw.json`/`wfs-north-4326.json` were), never only summarised.

## Scope note — the other 61 connections (EP7e)

This plan covers only R1/E1/S2 (and leaves Akureyri C untouched). It does not assess any of the other 61 `NODE_UNDETERMINED` places or the full 72-place worklist. A comparable retained-first acquisition-planning method as used here could be applied to that list in a later round — this is noted as a scope boundary, not a new task, approval, or commitment.

## Independent checks (EP7b) — summary; full results in `cc-report.md`

JSON parse (both files), unique `request_id`s, every matrix-referenced `request_id` resolving in `request-plan.json`, all three locations present with at least one matrix item each, the budget table computed from the request list, and retained host/identifier cross-checks against disk (IDBUTUR membership in both `road-links.csv` and `wfs93-raw.json`, the demonstrated layer name, and the cited SHA-256 values) all ran in `samples/verify_plan.py` and passed — see `samples/verification_report.json` and `cc-report.md` for the full, code-produced results. These results are NOT folded into this already-hashed section; they are reported separately, per EP7(b).

## Outcome

**`PLAN_WITH_EXACT_GAPS`** (EP7d) — `coverage-matrix.json` has `EXACT_GAP` lines (R1's own exact node, name, both-ring-connection display, and S2's own user-facing approach name), each with a precise description of what is missing and, where applicable, what would resolve it. Neither this outcome nor `PLAN_READY_FOR_REVIEW` would have granted any execution or network authorisation — that remains a separate, future, scoped execution prompt's own owner/Jonesy approval gate. `LICENSE_NOT_DETERMINED` (Hagstofa) stands. #493/From-To routing is not completed by this planning round.

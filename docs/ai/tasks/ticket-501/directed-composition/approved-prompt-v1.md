# #501 — Directed composition approved prompt v1 — 2026-11-18

Jonesy APPROVED án blockera með bindandi P1–P6, afrituð óbreytt neðar. Eigandi samþykkti stefnumiðað core-skref, ekki runtime akstursforsendur. CC aðeins eftir eiganda “Prompt approved” og CURRENT READY_FOR_CC sem vísar hingað; CC_IN_PROGRESS áður, CC_COMPLETE eftir skýrslu. Sögulegur pending-review texti Round1 afgreiddur með þessum haus.

## Precedence / afgreidd smáatriði

P1–P6 ganga framar Round1 þar sem nákvæmari. Engin optional performance/provider/runtime-policy vinna. Regla fyrir sourceID utan innsendra lína er validated eins og allar reglur og síðan hunsuð sem out-of-scope (ekki villugildi falið); hún bætir ekki edge eða áhrifum á ID. PolicyVersion sjálft er samt partur ID. Prófa þessa skýru reglu. P5 “UNVERIFIED í öllum niðurstöðum” á við ný directed mode outcomes, ekki breytingu á undirected object-shape sem P4 bannar.

Ekki hækka núverandi GEOMETRY_COMPOSITION_VERSION eða breyta gömlum API/status/ID. Directed hefur sér mode/policy ID-descriptor. Endapunktar eru til í input geometry þó rules séu missing/blocked; traversal-edges síaðar fyrir ordered dedup. Full validation fyrir same_place, engin policy-bypass og enginn directed reverse-helper success.

Real B2 regression notar aðeins TEST_FIXTURE_HYPOTHETICAL reglur, ekki staðfesta akstursheimild; directional “success” er enn geometry_only/UNVERIFIED. Tóm valid policy á R1→Selfoss gefur no_directed_path, ekki endpoint_not_in_graph. Þetta er working mekaník, ekki afhent directed notendavirkni.

Keyra focused new+existing geometry/API/dataset/winter-route/routes/segments/cache/frontend-contract tests og lint2 snertum JS. Ekkert nýtt net/app deployment/fullsuite/build. Gamla API/loader/runtime JSON byte-identical. P7 valfrjálst; sjálfstæð slice-length staðfesting úr retained data er eðlileg focused evidence en ekki auka all-tier/all-pair coverage skyldubundin. Þegar working mechanics/P1–P6 standast, stoppa.

## Samþykkt Round1

# #501 — Stefnumiðaður samsetningarkjarni, Round 1 — 2026-11-18

Eigandi samþykkti að gera samsetninguna stefnumiðaða áður en UI er tengt. Fyrsta afmarkaða framkvæmd: bæta **explicit directed traversal mode** við núverandi pure geometry-kjarna. Ekki innleiða ályktaða akstursstefnu í runtime-gögnum eða breyta gildandi geometry-only API. Ný ferðastefnuheimild er ekki til staðar: UNKNOWN er ekki sjálfgefið tvístefna.

Þetta er prompt-review, ekki execution authorization. Jonesy APPROVED → Ripley approved-prompt/READY_FOR_CC → eigandi Prompt approved. Lágmarks vinnandi core-breyting með focused tests, engin ný provider/metadata leit.

## Lesa / hvað er þegar til

AGENTS/CLAUDE/README/CURRENT; geometry-composition approved-v2/result-review, geometry-api approved-v1/contract-note/result-review; source geometryComposition.js/test og geometryDataset.js/endpoint ósnert til samanburðar. Metadata-acquisition report JE1: AKSTURSSTEFNA úr öðru layeri með óstaðfestri lag-sértækri merkingu; engin staðfest IDKAFLI→IDFERILL vörpun. Ekki nota systurlags-PDF eða VEGHLUTI6/7 eða teiknistefnu sem sjálfvirka akstursheimild. B2-sókn er stöðvuð.

## Lítið contract / backwards compatibility

Núverandi composeGeometryPath/input án mode heldur **nákvæmlega óstefndri hegðun/ID** og geometry-only API/255line runtime JSON óbreytt. Bæta explicit `mode: directed` (eða jafnskýru optional argumenti) með source-piece traversal reglum sem input. Ekkert nýtt routing framework eða annað Dijkstra-afrit; endurnýta graph/path/slice logic.

Traversal-policy per numeric sourceId og sama tier/source identity: `forward | reverse | both | unknown | blocked`, með `policyVersion` og `evidenceRef`/`basis` fyrir allar heimilaðar áttir. Forward/reverse afstætt raunverulegri source vertex-röð. Engin compass-ályktun. Missing/unknown ⇒ engar traversable edges frá þeirri línu; blocked ⇒ engar; both ⇒ báðar; forward/reverse ⇒ aðeins réttar adjacent edges. Ekki sannreyna lögmæti evidence string sjálfvirkt; þetta er input contract, ekki heimildagreining. Mótsagnakenndar/ógildar reglur fyrir sama identity ⇒ skýrt unsupported/invalid_policy; ekki silently last-wins. Engar reglur lesa docs/net eða global runtime policy. Engin regex á STUTTNAFN/role til að búa reglur til.

Directed graph má **ekki** nota núverandi undirected pair-dedup sem fjarlægir alternative source fyrir hina áttina. Velja deterministic parallel edge á ordered(from,to) eftir *heimiluðum* áttum: ef source10 leyfir bara A→B en source20 B→A, verða báðar að lifa með réttum source refs. Tveir eins oriented edges mega nota núverandi stable numeric source tie-break. Óstefnd branch óbreytt. Sama XY-vertex graph/native tier/slicing/no epsilon/Z-source semantics eins og áður.

Skila áfram `geometry_only/same_place/unsupported` og `drivingAccess: UNVERIFIED`, en svar hefur explicit directed mode + `policyVersion` og refs svo enginn rugli þessu við fyrri óstefnd niðurstöðu. Geometry-ID inniheldur directed-policy contract/útgáfu og valda stefnu, þannig að mode/policy-útgáfa geti ekki endurnýtt gamla undirected ID. Gild directed same_place krefst validated policy contract og endpoints en engin travel edges; invalid input ekki successful. Status/reason fyrir no directed path er skýrt (`no_directed_path` eða sambærilegt), ekki búin til reverse úr forward niðurstöðu.

`reverseGeometryPath` getur aðeins reversað geometry; hann má ekki fá að búa til directed-success án endurmats á leyfðum áttum. Minnsta lausn: hafna reversal-helper á directed result með skýru unsupported/reason og biðja caller að compose aftur með víxluðum endpoints/policy. Núverandi undirected helper óbreytt. Prófa a.m.k. one-way A→B success en B→A unsupported. Full metadata status-nefnun skjalfest í module.

## Nauðsynleg próf (engin net)

1. Sama production compose export og api nýtir, ekki annað test-algrím: forward/reverse/both, unknown/missing/blocked, invalid/conflicting policy; source orientation. Hringur með forward-only: A→B þarf rétta lengri boga, ekki óstefnda stutta reverse-bogann. Opposite query getur notað rest hringbogans ef source leyfir hann, ekki bara spegla slice.
2. Ordered-edge parallel source fixture sem hefði glatast við undirected dedup. Deterministic input/policy permutation og same_place/ID distinctions. Old undirected fixtures/IDs/results óbreytt og symmetric tie-break próf standast. Directed reversal-helper getur ekki framleitt óheimilaða átt.
3. Retained B2/36807 tier2 geometric regression með **explicitly hypothetical test-only policy forward**, heimild merkt test-fixture, ekki production/eigandasamþykkt akstursstefna: directed A→B bogi ~72,549288m, undirected ~40,406375m; source indices/length sjálfstætt staðfest, engin source raw breyting. Prófið sýnir mekaník, ekki merkingu VEGHLUTI5. Fyrir retained R1→Selfoss með **engar staðfestar input-reglur** skila no-directed-path; ekki merkja retained heimildir complete eða fylla all both til að fá “real direction” grænt. Fullyrða ekki að nú sé rétt að keyra þessa leið í appi.
4. Endpoint/loader runtime óbreytt; keyra focused geometry-core + geometry-api/dataset + gamla routes/segments/cache/winter-route/frontend-contract próf og lint snertum JS. Engin fullsuite/build/browser. Prófunargildi ekki ný authority datasource og ekki vistað í server_data.

## Skrár / afmörkun

Leyfðar kóðabreytingar aðeins api/_lib/winterRoute/geometryComposition.js og .test.js, þessi directed-composition skjöl og CURRENT CRLF. Ekki endurskrifa gömul review/approved sögu eða raungögn. Eitt stutt contract-note.md og cc-report.md með implemented input/output, prófunum, afturábaksvernd og raunverulegri vöntun á runtime-policy. Engin net/provider/account/env/credentials/dependency/gagnaöflun/geometrydata breyting, UI/API/loader/cache/fixed routes/entitlement/analytics/scoring/GitHub/commit/push/deploy.

Verkhlutinn leysir ekki stefnuforsendur sem eigandi hefur ekki samþykkt. Þegar directed mechanical core og tests virka, stoppa. Runtime direction-map og hvort það megi nota ályktaðar forsendur bíður sérstaklega reviewable policy/eigandaákvörðunar, engin ný leit sjálfvirkt. Ekki nýtt perf-cache abstraction/turn-restriction system/fullring/all56 eða “routable” promotion.

Ef kjarna-viðbót krefst annars API-breaking contract eða gömlu ID breytast: sýna minnsta árekstur og stoppa; ekki refactor út fyrir scope. CC_IN_PROGRESS/CC_COMPLETE, síðan Jonesy result-review og Ripley final; PASS aðeins explicit directed core, ekki full501 eða akstursheimild.

Jonesy: APPROVED/REVISE fyrir mechanical directed scope og backwards compatibility, sérstaklega ordered-edge filtering áður en dedup og reversal-bypass. Ekki bæta provider research/runtime policy sem acceptance: það er sérstaklega aðskilið, óstaðfest og ekki unnið hér. Nauðsynlegar direction-rules sýndar í test contract án þess að ljúga um heimild. Valfrjáls heildaröryggishönnun ekki blocker.


## Bindandi P1–P6 Jonesy — óbreytt

### Bindandi execution-atriði (setja í approved-prompt)

**P1 — Sía á heimilaðar áttir *áður* en parallel-edge val á ordered (from,to).** Lægra sourceId með `unknown`/missing/`blocked`/rangri átt má aldrei skyggja á hærra ID sem leyfir áttina. Próf (bæði): (a) synthetic: source 10 `blocked` (eða missing) og source 20 `forward` á sama XY-pari ⇒ brúin notar 20; source 10 `forward` og 20 `reverse` á sama pari ⇒ báðar lifa með réttum refs; tveir eins stefndir ⇒ lægra ID vinnur (óbreytt tie-break); (b) **raunfixture** ofan: lines `[2117,2134,2135,36807]`, policy aðeins `36807 forward` ⇒ A→B 72,549288, ein slice `36807 forward 2→5`. Mutation „dedup áður en sía“ á að fella (b).

**P2 — Mode/policy hlið án þöglrar undirected-sjálfgefningar.** Enginn `mode` ⇒ nákvæmlega núverandi hegðun. `mode` sem er ekki `"directed"` (og ekki fjarverandi) ⇒ `unsupported` með skýru reason (t.d. `invalid_mode`). `policy` gefið án `mode:"directed"` ⇒ `unsupported`, ekki þögul óstefnd leið. `mode:"directed"` án policy-hlutar ⇒ `invalid_policy`. **Tómur** policy (gild útgáfa, 0 reglur) er gild og gefur `no_directed_path` (R1→Selfoss-prófið).

**P3 — Policy validate upp front, óháð því hvort regla er notuð.** Allt policy staðfest áður en graf er byggt: `policyVersion` til staðar; hver regla hefur tölulegt sourceId, `tier` (sama og `input.tier`, annars `invalid_policy`), gildi úr `forward|reverse|both|unknown|blocked`, og `forward|reverse|both` krefjast óinnihaldslauss `basis`/`evidenceRef` streng. Nákvæm tvítekning leyfð; mótsagnakennd regla fyrir sama (sourceId,tier) ⇒ `invalid_policy` (ekki last-wins). Regla fyrir sourceId sem er ekki í `lines`: ákveða og prófa (tillaga: hunsuð, hefur ekki áhrif á niðurstöðu/ID). Ógilt policy ⇒ aldrei success, líka ekki `same_place`. Policy les ekki docs/net/global.

**P4 — Afturábakssamhæfni og ID.** Ekki hækka `GEOMETRY_COMPOSITION_VERSION` (gömul ID og `compositionVersion` í API verða óbreytt). Óstefnt niðurstöðu-objekt fær **engin ný lykla** (API-prófin og núverandi `toEqual`-próf haldast). Directed ID-descriptor: sér `mode:"directed"` + `policyVersion` + hver slice með valda átt **og** beittu reglugildi (forward/reverse/both); þannig geta sömu slices undir `both` og `forward` ekki deilt ID og directed ID ≠ óstefnt ID (festa: allt-`both` gefur sömu slices/lengd en **annað** `geometryId`). Regression: núverandi 50-próf kjarna og geometry-api/dataset-próf óbreytt; auk þess fest gamalt ID (t.d. Selfoss→Hella `1e5ec24e068b90156c1c9b0ec1c00d39` úr geometry-api) sem óbreytt í kjarnaprófi. Permutation-próf: röð lína og röð reglna ⇒ sama ID.

**P5 — Niðurstöðusnið og reason-merking.** Directed niðurstaða hefur `mode:"directed"`, `policyVersion`, og slice-viðmið í reglu (`basis`, nafn skjalfest, t.d. `directionBasis`). Engin leið ⇒ `no_directed_path` (aldrei `disconnected_graph` í directed mode). `endpoint_not_in_graph` heldur merkingu sinni: endapunktaleit notar **allar** innsendar línur (líka þær án reglu/`blocked`), svo R1→Selfoss án reglna gefur `no_directed_path`, ekki `endpoint_not_in_graph`. Directed `same_place` krefst gildrar policy + endapunkta í grafi, 0 slices, ID ≠ óstefnt same_place ID. `drivingAccess:"UNVERIFIED"` í öllum niðurstöðum.

**P6 — `reverseGeometryPath` má ekki framleiða directed success.** Directed `geometry_only` ⇒ `unsupported` með skýru reason (t.d. `directed_result_not_reversible`), enginn `isReverseOf`. Prófa á hring: reversal á A→B (72,549288 forward) hafnað; **ný compose B→A** gefur 40,406375 m forward 0→2 — ekki spegil. Undirected helper óbreytt og óbreytt próf. Einfaldur one-way keðju-fixture: A→B success, B→A `no_directed_path`.


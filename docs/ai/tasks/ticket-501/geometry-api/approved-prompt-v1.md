# #501 — Geometry-only backend API approved prompt v1 — 2026-11-18

Jonesy APPROVED án blockera. Eigandi bað um þetta næsta backend-skref eftir geometry-core PASS. CC keyrir aðeins eftir eiganda “Prompt approved” og CURRENT READY_FOR_CC sem vísar hingað; CC_IN_PROGRESS fyrir vinnu, CC_COMPLETE eftir report. Sögulegar pending-review klausur í Round1 eru afgreiddar.

## Forgangur / afgreiðsla P1–P6

Round1 gildir með eftirfarandi precedence; P1–P6 Jonesy eru einnig tekin óbreytt inn neðar. Engin ný hönnunar/prompt-umferð nauðsynleg. Source prototype-tölur eru cross-check, ekki forced golden.

- **P1 ákvörðun Ripley:** halda fyrirhuguðum API-samningi “from/to af fimm mappuðum stöðum”: allar20 raðaðar ólíkar tvenndir leyfðar sem geometry_only, ekki þriggja-para allowlist. Þetta er ekki 20 akstursleiðir eða ný 56-þekja. Ekki þvinga disconnected_graph á raunpar þar sem gögn tengjast. Próf á disconnected dataset er synthetic injection og merkt sem slíkt. Bæta einu real langparaprófi R1→E1 með shape-continuity/distance/geometric-only, engin ný gögn.
- **P2:** dataset varðveitir veghluti og name úr source; API-slice pass-through veghluti/name með join eftir sourceId, ekki breyta geometry-kjarna. Það er provenance, ekki traversal constraint. Allt routing áfram óstefnt, drivingAccess UNVERIFIED. Optional reverse-role samantekt ekki skylda.
- **P3:** task-local build-pilot-dataset.* leyft, eitt einfalt offline script, engin dependency/ETL framework. Runtime data255lines/946vertices skv prototype þarf að staðfesta í eigin endurgerðarprófi með retained raw og source SHA. API les ekki docs. DatasetVersion er canonical-content hash reiknað við loading yfir normalized runtime samning (schema/tier/CRS, stable ordered lines með geometry/source metadata og mapping5). Hash reitur ekki sjálfinnifalinn. Forgangur fram yfir Round1 sem sagði geymt datasetVersion í JSON: JSON má geyma schema_version/normalization-version; hash af canonical payload afleiddur í loader. Óviðkomandi lína getur breytt datasetVersion án að breyta geometryId óbreyttrar source/slóðar. Ekki Date.now/random eða self-hash.
- **P4:** vercel.json þegar includeFiles server_data/**: engin config-breyting. STOP ef raunverulegt deployment-þörf kemur upp sem krefst annars. Ekki kalla local fs success sönnun Vercel deployment; deployment ekki heimilað hér.
- **P5:** lengthNote/tag segir tier2 planar geometry-lengd, ekki akstursvegalengdarsamning. Coordinates eru **XY** eins og Round1, source Z varðveitt í dataset/slice-source en ekki merge í global node. Sleppa duplicate XY við samskeyti slices; source Z frávik ekki “leiðrétt”.
- **P6:** mapped same_place en unmapped valid sameID unsupported. Schema500 próf injected invalid loader fixture, aldrei skemma realdata. Ekkert performance/cache verkefni.

Allir56 staðir áfram þekktir;51 unmapped ekki ósýnilegir/óþekktir. Nýtt API eingöngu geometry/native; engin UI/akstursheimild/forecast/road runtime samþætting. Vinna aðeins nauðsynlegt scope og focused tests, stöðva þegar það virkar.

## Samþykkt Round1

# #501 — Staðapar → geometry backend, Round 1 — 2026-11-18

PROMPT_REVIEW, ekki framkvæmdarheimild. Eigandi bað um áframhald eftir geometry-kjarna PASS (50 focused tests). Næsta afmarkaða innleiðing: **sérstakur geometry-only backend inngangur**, sem tengir staða-ID við native endpoints og kallar vinnandi kjarnann. Ekki breyta gamla winter-route routeId/forecast/road/cache/UI samningnum. Ekki lögleg leiðarvél/fullur hringur/all56 eða lokun#501. Lágmarks viðvörun er véllesanleg `geometry_only` + `drivingAccess: UNVERIFIED` + óstefnd geometri; ekki senda hana í existing winter-route weather/færð-flæði eins og akstursleið.

## Lesa fyrst / núverandi staðreyndir

AGENTS/CLAUDE/README/CURRENT; geometry-composition approved-v2/result-review/implementation-note og raun module/test; server_data/winter-route-places.json (56 IDs), #500 places-v1/selections aðeins eftir þörfum; phase2 **place_nodes-v3.json/evidence.md síðari v3**, retained raw wfs93-raw.json og ticket483 wfs-vegnr1-all.json; api/winter-route.js/routes/cache/segments og api/campsites.js fs read-path pattern. Geyma fyrri geometryComposition.js/test óbreytt nema sýnd nauðsynleg interface-villa kalli á STOP/skýringu. Node test source-input er ekki production data-loading lausn: API má ekki lesa/importa docs/ í keyrslu.

## Skýrt lágmarkssvið

Nýr `GET /api/winter-route-geometry?from=<place-id>&to=<place-id>` með nýrri api/winter-route-geometry.js. From/to báðir skyldubundnir, strict strings, ekki arrays/blank/objects/óþekkt ID. Validation með Map/own keys, ekki inherited prop. API notar 56 staða-ID listann sem gild þekkt nöfn; ekki fækka staðaskránni. Full endpoint mapping aðeins fyrir **fimm** áður pinnuð ID í þessari undirlotu: reykjavik-raudavatn, selfoss, hella, egilsstadir, seydisfjordur. Önnur gild ID fá skýrt `unsupported/endpoint_mapping_unavailable`, ekki 400 og ekki ranglega “staður ekki til”. Keflavík/Þórshöfn hnitagöt áfram sýnileg, enginn geocoder/nearest/snap. Skýrt í report: fimm mappings er fyrsta backend-pilot, ekki samþykkt fækkun56 eða loforð um hin51. Sama þekkta ID án mapping fær unsupported, ekki fabricated same_place; mapped sama ID skilar geometry-kjarna same_place.

Þau fimm native endpoints nákvæmlega sem fyrri approved prompt pinnaði: R1 vestari1436; Selfoss2138 exit, Hella3591 exit úr place_nodes-v3; E1=2344 start og S2=2894 end (sama native pinning). Nota native evidence, ekki afrita WGS84 yfir sem native. Engin cum1436/entry-exit endurákvörðun.

## Deployment-gagnagrunnur / leyfðar nýjar skrár

Ný ein JSON-skrá `server_data/winter-route-geometry-pilot.json` með `schema_version`, `datasetVersion`, native CRS, tier2, normalized lines fyrir retained249 VEGNR1+6 veg93 tier2 pieces (engin ný gögn/net). Endpoint mapping5 og per-source references/SHA einnig þar. Ekki copy allt4tiers eða rannsóknarsöguna; aðeins inntak sem kjarni þarf. Reikna normalized data úr raw með einfaldri staðbundinni forskrift, varðveita stable numeric IDs/sourceRef, XYZ per sourcevertex og source hashes. Raw bytes/source refs varðveitt í docs en API les eingöngu þessa runtime JSON og gildandi56places. Report segir generation source/command; ekki afhenda almennt ETL/gagnakerfi. Ef raw mixed/conflicting identities eða leyfi/deployment sýnir vandamál: skrá/STOP, ekki silently velja/laga retained raw.

API má lesa JSON samkvæmt núverandi project fs/path venju með einni lítilli helper-einingu `api/_lib/winterRoute/geometryDataset.js` ef þarf. Engin production import úr docs, ný dependencies eða WGS84 converter. Eitt fixed pilot tier, ekki query-val á tiers/model/dataset/geometry skrám. Native EPSG3057 í svarinu með skýru CRS, engin Leaflet/WGS84 UI-birting í þessari lotu.

Leyfðar nýjar skrár: endpoint .js og .test.js, geometryDataset.js (+samliggjandi .test.js ef sinnir raun-check), server_data JSON og geometry-api skjöl/CURRENT. Gamla geometry-core/test og routes/forecast/road/cache/frontend/places/selections/source raw unchanged. Heimilt ef nauðsynlegt að bæta **nákvæmu nýja server_data file** við existing Vercel includeFiles reglu eingöngu, með sýndu bundling-behov; ekki proxy/runtime/config redesign. Ef ekki nauðsynlegt, engin config-breyting. Staðfesta ný API dependency native-json næði deployment með núverandi repo pattern fremur en að treysta working-directory heppni.

## API-samningur og afleiðingar

- GET200 fyrir mapped geometry_only/same_place og þekkt en unsupported par, með top-level `schemaVersion`, `datasetVersion`, `compositionVersion`, `from`, `to`, `crs`, `tier`, niðurstöðu/status/reason, `drivingAccess: UNVERIFIED`. Successful path inniheldur geometryId, lengthM, **raðaðar XY-coordinates** reconstructaðar úr source slices og slice/evidence refs svo neytandi geti skilið svarið án docs aðgangs. Native XY merkt sérstaklega, Z ekki láta einn global node-Z yfirskrifa sourceZ. Ekki auglýsa “routeId” sem gömul fixed-route allowlist tekur við; identity heitir geometryId.
- GeometryID kjarnans varðveitt, datasetVersion sér á svarinu. Sama query/data ⇒ sama geometryID; datasetVersion tekur breytingu ef deployment-data bytes/content breytast. Ekki nota Date.now/random í ID. Reverse geometry frá query með skýrum óstefndum fyrirvara, aldrei “báðar akstursáttir studdar”.
- Unknown/missing/repeated param ⇒400 stöðug error án þess að endurspegla innslegið string/stack; method !=GET ⇒405 samkvæmt einfaldri repo venju (OPTIONS valfrjálst ef hún krefst þess). Data-load/invalid pilot schema ⇒500 stutt error, ekki200 unsupported sem felur bilun í þjónustu.
- Source5ID valid en disconnected R1↔E1 (ef raw graf disconnect) ⇒ kjarnans unsupported/disconnected_graph, ekki tilbúinn heill hringur. Öll unsupported svör halda from/to og óstaðfestu-aðgengismerkingu eftir valid identity.
- Engin road/forecast/upstream fetch, ETA, lokunarstýring eða sjálfvirk hjáleið. Ekki cache með gamla routeId bucket, ekki mutate forecast cache. `Cache-Control: no-store` nægir í þessari lotu; ekkert nýtt cache framework. Nýtt API ekki tengt UI (#502) eða veður/færð (#503).

## Nauðsynleg focused próf / working end-to-end check

1. Raun handler + raun loader/runtime JSON + raun composer: R1→Selfoss/Hella og E1→S2 (tier2) skila geometry_only, pinned endum, source-bókstaflegri samfelldri XY línu, distance sjálfstætt endursummanlegri. E1→S2 ekki ferjubryggju, langur hringur ekki búinn til. Enginn stub/fs/net/composer-output bypass á þessum integration-prófum.
2. Reverse og same_place fyrir mapped ID. Missing/empty/unknown/prototype-name/repeated params; þekkt ID utan5 mappings; Keflavík/Þórshöfn. Cross-component par án graph-tengingar ⇒ skýrt unsupported ef það er raunstaða. Prófa HTTP500 á loader-failure með afmarkaðri dependency-mock í því prófi, ekki breyta runtime source til að valda bilun.
3. JSON data contract validation: ein tier2, count/uniqueIDs, refs/source hashes, 5 native endpoints literal vertices. Ekkert próf þarf að festa allar255 geometry-tölur orðrétt, en expected5 endpoints bera við independently pinned literal/native source. Prófa sama HTTPquery tvisvar og permutation þar sem loader input adapter leyfir án framework ⇒ stable identity. Vernda geometry_only og UNVERIFIED í öllum valid outcomes.
4. Keyra focused endpoint/dataset + geometryComposition + eldri routes/segments/cache + src/lib/winterRouteRoutes tests, eslint á snertum JS. Engin fullsuite/build/browsers skyldubundin því frontend ósnert; ef includeFiles raunverulega breytt þarf viðeigandi config/scope check. Staðbundið handler integration kallar ekki upstream. Ekki stofna lifandi production call til að “prófa”.

cc-report.md og contract-note.md stutt: API invocation dæmi, hvað5pilot gerir og51 unmapped þýðir, actual tests og takmörk. Leggja eitt raun handler invocation/result dæmi fram (JSON stytt í docs), ekki bara module test pass. No new UI endpoint entrypoint needed before backend-focused handoff; það er API-inngangurinn, ekki afhent notendavirkni.

## Mörk og STOP

Engin net/gagnaöflun, gömulB2sókn endurvakin, ný graph-heuristic/snap/stefnukóðar/route steering, akstursheimild eða dataset-mark SUPPORTED. Engin 56-lista breyting, breyting á núverandi fixed API/routeId, frontend/translations/analytics/payment/entitlement/scoring/dependencies/secrets, GitHub/commit/push/deploy. CURRENT CRLF, fyrri samþykktir/reviews immutable.

Ef rétt endpoint-pinning/runtime data krefst nýrrar öflunar, stórs data migration eða akstursstefnuákvörðunar: sýna minnsta konkrete vandamál og stöðva þann hluta áður en scope breikkar. Working afmarkað geometry-API með skýrum unsupported er lotumarkmiðið; ekki öllunsupported eða mock-only árangur. Ekki láta nýja API lofa full501 eða kalla geometryóvissu “örugga leið”.

Eftir Jonesy APPROVED Ripley approved-prompt/READY_FOR_CC og eiganda Prompt approved; CC_IN_PROGRESS/CC_COMPLETE, Jonesy result review/Ripley final. PASS lokar aðeins þessari backend undirlotu, ekki issue501 eða fullhring/all56. Þegar scope og focused checks standast, stoppa; ekki speculative production-hardening.

Jonesy: yfirfarðu þessa lágmarks backend lotu gegn retained/runtime contract. Sérstaklega mapping-pinning, docs ekki runtime dependency, hæfilega lítið portable dataset, native XY/shape/from-to/identity, UNVERIFIED í hverju outcome og gamla fixed-flow óbreytt. Sýndur blocker og minnsta fix, optional release/polish ekki blocker. APPROVED/REVISE; engin kóða-/netvinna í review.


## P1–P6 Jonesy — óbreytt

### P1 — raunveruleg tenging er önnur en promptið gerir ráð fyrir (mikilvægast)
Promptið segir „disconnected R1↔E1 (ef raw graf disconnect) ⇒ unsupported“. Í sandbox eru **öll 5 pinnuðu hnitin í sama component** (VEGNR1+veg93 tier 2: 6 components, aðalcomponentið 635 hnútar; E1 er sameiginlegur hornpunktur 2345/2344). Því skila **allar 20 raðaðar tvenndir geometry_only**, ekki unsupported. Stystu óstefndu vegalengdir (tier 2): R1↔Selfoss 44,985 km; R1↔Hella 80,631; Selfoss↔Hella 35,646; E1↔S2 24,149; **R1↔E1 615,333 km (121 slices) og R1↔S2 639,482 (125) fara norðurleiðina** (Vesturlandsvegur, Kjalarnes, Borgarnes–Baulan, Holtavörðuheiði, Akureyri, Mývatnsöræfi, Jökuldalur); Selfoss↔E1 620,629 (87); Selfoss↔S2 644,777 (91); Hella↔E1 584,989 (78) og Hella↔S2 609,138 (82) fara suðurleiðina. Afleiðingar:
- Prófið „cross-component par ⇒ unsupported ef það er raunstaða“ er **ekki hægt að sýna með raungögnum** (engin slík tvenna); CC á ekki að þvinga unsupported. **Fix (ein setning):** `disconnected_graph` er prófað með **innspýttu syntetísku dataset/loader**, ekki rauntvennu.
- Bæta við **einu raunprófi á langri tvennu** (t.d. R1→E1 ≈ 615,333 km) með bókstaflegri samfelldri XY-línu, sjálfstæðri endursummun og `geometry_only`/`UNVERIFIED`, svo handlerinn sé prófaður á þeirri stærð sem hann raunverulega svarar (um 120 slices).
- **Ákvörðun fyrir Ripley/eiganda (ekki mín):** samþykkja að öll 20 pör svari geometry_only (mín tillaga, MVP — merkið er skýrt og enginn „hringur“ er seldur), eða takmarka pilot við þrjár pinnaðar tvenndir. Geometry-tenging er ekki akstursheimild; þetta breytir ekki fyrri niðurstöðu um að fullur hringur/akstursstefna er óstaðfest.

### P2 — einstefnu-akbrautir sjást ekki í svarinu (varðar „illegal direction by accident“)
Óstefnd stysta leið fer yfir VEGHLUTI 6/7-hluta á móti teiknistefnu í sumum fyrirspurnum (sandbox, tier 2): Selfoss→R1 og Hella→R1: 3 VEGHLUTI-7 slices „reverse“ (R1→Selfoss/Hella: 3 „forward“); R1→E1: 8 VEGHLUTI-6 „forward“ og 2 VEGHLUTI-7 „reverse“; E1→R1 öfugt (8 „reverse“ af 6). Promptið segir óstefndan fyrirvara, en hann er óskýr þeim sem les JSON. **Minnsta fix:** dataset-lína hefur `veghluti` og `name` (STUTTNAFNLEIDAR; þegar í raw), og hver slice í svarinu ber `veghluti` (pass-through; **ekki notað í leiðarvali, engin staðbundin breyting á stöðu**). Valfrjálst: samantekt `oneWayRoleSlicesReverse` (fjöldi VEGHLUTI 6/7 slice með `direction: reverse`). Merkingin á 6/7 er **ályktun** (eldri reglur: „undocumented majority pattern“), ekki staðfest umferðarstefna.

### P3 — uppruni/endurgerð dataset (eina nýja gagnaskráin)
- „Reikna normalized data úr raw með einfaldri staðbundinni forskrift“ en leyfðar skrár í promptinu innihalda ekki forskriftina. **Fix:** leyfa task-local `docs/ai/tasks/ticket-501/geometry-api/build-pilot-dataset.*` (ekki production, ekki ETL-framework) og skrá skipunina í cc-report.
- Bæta við **einu prófi sem endurgerir** línurnar úr retained raw (`wfs-vegnr1-all.json`, `wfs93-raw.json`, tier 2; próf mega lesa docs, fordæmi: `acquiredGeometry.test.js`) og ber þær saman við runtime JSON (fjöldi 255/946, IDFERILL-mengi, hornpunktar bókstaflega, Z á source-vertex, raw SHA-256 í skránni = raun-SHA). Annars grípur ekkert generation-villu (týnt Z, rangt tier) nema endapunktaprófin.
- `datasetVersion` **afleitt við hleðslu** úr canonical línuinnihaldi (t.d. sha256), ekki geymt í sömu skrá sem hash af sjálfri sér; prófa að breyting á línu breytir `datasetVersion` en ekki `geometryId` fyrir óbreytta slóð.

### P4 — config
Engin `vercel.json`-breyting (sjá ofan). Ef CC telur hana nauðsynlega: STOP og sýna rökin, ekki breyta. Svarsstaða-kóðar: 400 (óþekkt/vantar/endurtekið), 405, 500 (loader/skema), 200 (þar með þekkt en ómappað), `Cache-Control: no-store` — samræmist núverandi `winter-route.js`; CORS/OPTIONS má fylgja því fordæmi eða sleppa (promptið segir valfrjálst).

### P5 — tier/lengd og samskeyti í svari
Tier 2 er grófasta línan (946 hornpunktar vs t.d. tier −1 sem er um 14× fleiri í VEGNR1): R1→Selfoss 44 984,770 m (tier 2) á móti 45 650,044 m (tier −1), −1,46 %. Svarið ber nú þegar `tier`; bæta við stuttu `lengthNote`/tag að þetta sé tier-2 geometry-lengd, ekki vegalengdarsamningur (#502/#503 neytendur). Samskeyti: við uppbyggingu `coordinates` úr slices sleppa fyrsta hornpunkti slice n>0 (sami XY og lok fyrri slice); Z kemur af source-vertex hvers slice (72 XY-hnit eru með >1 Z í tier 2), aldrei sameinað.

### P6 — smærra
- Tvenna „þekkt en ómappað“ með sama ID (t.d. `keflavik→keflavik`) ⇒ `endpoint_mapping_unavailable` samkvæmt promptinu; mappað sama ID ⇒ `same_place` (kjarninn skilar því með `lengthM: 0`, tómum slices).
- Dataset-skemaprófun (500 við bilað skema) ætti að nota **tilbúið skemafrávik** (innspýttan loader), ekki breyta raun-JSON.
- `geometryComposition.js` byggir graf í hverju kalli (946 hornpunktar, O(V²)); það er viðráðanlegt hér; ekkert cache/perf nauðsynlegt í þessari lotu.


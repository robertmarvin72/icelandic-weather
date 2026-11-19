# #501 — Fyrsta leiðasamsetningarinnleiðing, Round 1 — 2026-11-17

PROMPT_REVIEW, ekki execution-prompt. Eigandi bað um afmörkun fyrstu innleiðingarlotu eftir staðfesta offline B1/C1 og B2 geometry-niðurstöðu. Þetta er **geometry-samsetningarkjarni**, ekki endanleg akstursleiðarvél, UI eða fullgerð #501. Engin ný öflun, enginn heill hringur eða 56-staða þekjuloforð. Markmið er vinnandi, prófaður kjarni á raunverulegum retained gögnum, ekki enn ein rannsóknarlota.

## Núverandi grunnur / lestrarlisti

AGENTS/CLAUDE/README/CURRENT; ticket-501 audit-report/result-review með Ripley leiðréttingum; offline-vertex-check-b1-c1.md; b2-final-attempt/final-report.md/result-review.md. Native raw ticket-483/samples/wfs-vegnr1-all.json; phase2 road93-candidate.json/wfs93-raw.json og evidence.md **síðari v3** / place_nodes-v3.json; gildandi places/selections eftir endpoint-þörf. api/winter-route.js, routes.js/segments.js/cache.js og próf, núverandi frontend route-contract. #500 handoff er ekki tæmandi retained inventory.

Staðreyndir: B1 er innri vertex-tenging um1735 (0,234m stubbur); B2 er lokaður36807 með A/B vertices (ekki degenerate); C1 tengist um3454 og3767 vertices. Nákvæm tenging getur verið innri vertex, ekki aðeins whole-feature endi. 4tiers ekki blanda; geometría/vegalengd mismunandi eftir tier. R1 er vestari endi1436; ekki tvítelja hana. Road93 E1→S2 endar við2894 END, ekki ferjubryggju. Akstursstefna/native topology enn ekki staðfest. Fullur Akureyri↔Borgarnes hringgrunnur ekki til sem staðfest heild.

## Leyfð lágmarksútfærsla

Ein ný pure backend JS-eining `api/_lib/winterRoute/geometryComposition.js` og ein samhliða `.test.js`. Má bæta einni lítilli task-local fixture-adapter skrá ef nauðsynlegt fyrir retained integration-próf; ekki nýr graph/framework/dependency eða runtime gagnasafn. Kjarni tekur normalized native línur og endpoint-hnit **sem argument**, engin fs/net/import úr docs í production-einingunni. Retained raw lesin aðeins í Node-prófum. Schema/interface stutt og skjalfest í einingunni, ekki almennt routing-SDK.

Minnsta gagnlega contract: native EPSG:3057, eitt numeric precision tier, array lines með stable source-piece ID/IDBUTUR, ordered XY vertices og evidence-reference. From/To eru staða-ID ásamt skýrum native coordinate úr staðfestum retained heimildum (ekki WGS84 samanburður). Validate invalid/missing endpoints/CRS/tier input með skýrum unsupported/reason. Stable unique input-piece identity; duplicates af sama source/tier mega ekki tvítelja edges, mótsagnakennd geometry fyrir sama identity ⇒ skýrt conflict, ekki hljóðlaust velja.

Hnýta **bókstaflega jöfn XY vertices**, búa edges milli aðliggjandi vertices og skera línur við sameiginlegan vertex. Engin snapping/epsilon/innri línuskurðarályktun/nálægðarbrúun. Z varðveitt sem source metadata ef það er til en ekki notað sem lóðrétt tengisönnun. Lokaður hringur með endurteknum enda er nonzero lína; zero-length consecutive edges sleppt án þess að eyða hringnum. Nota eitt tier í allri leið; mismunandi tiers aldrei sameinuð til að fylla gögn.

Skila deterministic stystu **óstefndri geometry-path** með XY-planar vegalengd (native metrar) þegar hún er til; lexical source/node tie-break svo shuffle input breyti ekki niðurstöðu. Röðuð source-parts með from/to vertex indices, traversal orientation, XY coordinates og IDBUTUR-tengjum (ekki búa til weather points). Sameina samliggjandi slices sama piece eftir þörf til læsilegrar niðurstöðu; ekki runnið yfir valda enda. Hring-edge ekki tvisvar í sama path, 1436 aðeins í þeirri slice sem raunverulega er farin. Sami staður/native sami punktur ⇒ skýr same_place með0 lengd og tómri geometry; ekki sjálfvirk legit travel-heimild.

Niðurstaða inniheldur stöðugt versionað geometry-ID sem byggir á efni/version/source/tier/from-to/ordered slices, lengd, from/to, source refs, shape og `drivingAccess: UNVERIFIED` (eða jafnskýrt contract). Status skal heita `geometry_only` / `same_place` / `unsupported`, aldrei SUPPORTED/ROUTABLE/safe. Engin leið ef enginn literal vertex-path; reason til að greina missing endpoint frá disconnected graph og invalid input. Reverse query þarf að skila viðsnúinni geometry/slice-röð/hlutverkum fyrir sama geometry-path þar sem stysta leið er einstök; með óstefndu grafi er þetta **ekki** sönnun akstursáttanna.

Þessi fyrsta lota skilar **einum geometry-path**, ekki tveimur hringvalkostum eða valreglu í appi. Lokaður geometry-hringur getur haft tvo boga en styttri bogi er aðeins niðurstaða offline kjarnans; hann má ekki verða runtime ferðaleið í gegnum hringtorg án sérstakrar stefnuákvörðunar. Þetta er bein takmörkun til að forðast að stysti óstefndi bogi verði seldur sem lögleg leið.

## Raunpróf og nægileg sannprófun

- Prófa sömu exported composition-föll og raunpróf nota, ekki parallel imitation. Pínulitlar synthetic fixtures fyrir same_place, missing/unknown endpoint, disconnected graph, duplicate/conflicting identity, closed ring/nonzero, input permutation deterministic ID, reverse unique path og mixed-tier rejection.
- Retained integration við fast **tier2** til að festa fyrstu niðurstöðu (ekki “besta tier”, bara skýrt selected source); taka allar raw tier2 línur sem þarf. Endpoints R1/Selfoss/Hella/E1/S2 úr native heimildum, ekki manually fabricated coords. Sýna R1→Selfoss og R1→Hella path sem fer um B1/B2/C1 eftir því sem á við, og E1→S2 beint veg93 að S2, án2892/2891/ferjubryggju eða hringferð. Full end-to-end path gæti haft önnur retained göt; ef raungögn tengjast ekki, skila heiðarlegu unsupported með nákvæmum blocker og hætta við þá acceptance-fullyrðingu — ekki bæta við snap/netöflun. A.m.k. B1, B2 og C1 staðbundnu source-pörin og E1→S2 þurfa working real-data geometry niðurstöðu, ekki bara synthetic tests eða öll unsupported.
- Raunpróf staðfesta innri vertex slicing, source IDs, nákvæma endapunkta og length sem sjálfstæð summa returned adjacent vertices, reverse, engin keyrsluheimild. R1-1436 counted once, ekki bæta piece1436 aftur við prefix. Ekki nota eldri45,740/81,769km með straight gaps sem golden fyrir vertex-boga; geometry-munur þarf að skýrast með slices. Ekki láta app route definitions eða heildarlandskort leiðréttast af prófunum.
- Run focused new suite + núverandi winterRoute routes/segments/cache og frontend route-contract próf; lint nýja module/test. Engin fullsuite/build eða vafraúttekt nauðsynleg því pure module ekki tengdur appi. Ef breyting breiðist í runtime er það STOP, ekki ástæða til breiðari prófunarumferðar. Old fixed-route definitions/cache/fetch/UI byte-identical og gömul próf óveikt.

## Afhending / mörk

cc-report.md og stutt implementation-note.md undir þessari möppu: interface, hvað vinnur á raun-pörum, explicit unsupported, commands/counts, stable IDs, geometric-versus-driving fyrirvarar, nákvæm næsta runtime/contract ákvörðun. Engin endurtekning á rannsóknarsögu. Gömul files/sources/data og fyrri reviews immutable. Enginn frontend/UI-entrypoint í þessari backend undirlotu; núverandi `/winter-route` heldur sér og tenging við endpoint bíður næsta afmarkaða prompts. Nýja einingin verður ekki kynnt sem afhent notendavirkni.

Leyfðar breytingar eingöngu ný module/test (+task-local adapter ef nauðsynlegt), þessi geometry-composition skjöl og CURRENT CRLF. Engin server_data/#500/retained raw/fixed route/fetch/cache/frontend/translations/analytics/entitlement/threshold/scoring/dependency/net/credentials/GitHub/commit/push/deploy breyting. Ef correct geometry krefst stærra contract/gagna/leiðarvalsstefnu: sýna nákvæmt blocker/val og bíða eiganda, ekki lofa full#501 eða stækka sjálfvirkt.

CC byrjar aðeins eftir Jonesy APPROVED, approved-prompt og READY_FOR_CC + eiganda Prompt approved. CC_IN_PROGRESS/CC_COMPLETE lifecycle; Jonesy result review/Ripley final. PASS aðeins vinnandi geometry-kjarna, ekki lokun#501/all56/heilan hring eða akstursleiðir. Eftir að vinnandi afmarkað scope og focused checks standast: stoppa, ekki optional hardening.

Jonesy: Yfirfarðu þessa fyrstu afmörkun gegn raungögnum. Sýndur blocker þarf áhrif á correctness eða skiljanlega afhendingu og minnsta fix. Sérstaklega: native same-place endpoint mapping, closed-ring/internal-vertex slices, not routing illegal-direction by accident, real-data path án broad data schema, stable ID/reversal og engin föst app-leið brotin. Valfrjáls performance/algeng routing-engine flækja eða full56 þekja ekki acceptance-krafa hér. APPROVED eða REVISE; ekki innleiða.

## Jonesy review — umferð 1 (2026-11-17)

**Niðurstaða: APPROVED — enginn blocker.** Afmörkunin (ein pure eining + ein test-skrá, einn tier, bókstaflegir XY-hornpunktar, `geometry_only`/`drivingAccess: UNVERIFIED`, einn geometry-path, engin tenging við app) er lítil og framkvæmanleg. Athugasemdir P1–P6 eru skýringar sem Ripley bætir inn í approved-prompt; engin þeirra krefst nýrrar umferðar. Ekkert keyrt á vél eiganda og engin net-köll; allt hér að neðan er **sandbox** (mitt prototype í Python 3 á retained skrám: óstefndur Dijkstra yfir bókstaflega jöfnum XY-hornpunktum, engin snapping, einn tier í einu). Það er ekki sönnun á JS-innleiðingu CC.

### Sandbox-staðfest gegn raungögnum
- **Retained inntak:** `wfs-vegnr1-all.json` = 996 LineString, CRS EPSG:3057, 249 IDFERILL × 4 tiers, öll hnit 3D (Z til staðar). `wfs93-raw.json` = 6 IDFERILL × 4 tiers. Engar núll-lengdar samliggjandi línur í neinum tier.
- **B1** (1735-exit → 2071-entry): geometry-path til í öllum 4 tiers, 0,234270 m, eitt slice í 1735 (vertex 0→1). **B2** (2117-exit A → 2135-entry B): 40,406375 m (tier 2/1/0), 42,478516 m (tier −1), eitt slice í 36807. **C1** (3768-exit → 3767-entry): [3454, 3767], 43,488921 / 43,488921 / 56,991060 / 61,668757 m (tier 2/1/0/−1). Þetta stemmir við `offline-vertex-check-b1-c1.md` óháð (sjálfstæð útfærsla).
- **E1→S2** (2344-start (715153,74; 536679,93) → 2894-end (732875,674; 538207,0762)): tengist í öllum tiers um 2344→3410→3409→2894; 24 148,861 / 25 895,077 / 26 196,441 / 26 252,294 m (tier 2/1/0/−1) = nákvæmlega summa piece-lengda; leiðin snertir hvorki 2892 né 2891.
- **R1→Selfoss / R1→Hella** (R1 = 1436 vestari endi (365522,0175; 402772,762); Selfoss = 2138-exit (401739,85; 383119,047); Hella = 3591-exit (430972,1263; 370845,6043)): **tengjast bókstaflega í öllum 4 tiers**, þ.e. „unsupported“-varaleiðin er ekki væntanleg niðurstaða. Tier 2: 44 984,770 m / 80 630,948 m; tier 1: 45 435,701 / 81 361,610; tier 0: 45 615,810 / 81 645,565; tier −1: 45 650,044 / 81 701,454. Sandbox-víxlsannprófun fyrir CC, **ekki golden** (sama regla og Ripley setti um eldri tölur).

### P1 — B2: stysta óstefnda leiðin liggur á móti teiknistefnu hringsins (mikilvægast; svarar „illegal-direction by accident“)
36807 er lokaður hringur (v0=v5=B, v1, v2=A, v3, v4), rangsælis að teiknistefnu (shoelace). Stysta óstefnda A→B er **A→v1→v0, 40,406375 m, 36807 farin „rev“ (á móti teiknistefnu)**; boginn í teiknistefnu A→v3→v4→v5 er **72,549288 m** (tier −1: 42,478516 vs 79,065864) og kjarninn skilar honum ekki. Prompt segir þetta rétt í orðum en raunprófið mun festa 40,406 m sem „B2-útkomu“. **Minnsta fix (ein setning í approved-prompt):** B2 raunpróf festir slice-stefnu `rev` og tilgreinir að 40,406 m er stysti óstefndi bogi, ekki B2-bil eða leið; cc-report kallar hann ekki „B2-lengd“. Engin algrímsbreyting. Tengt: **R1→Selfoss/Hella stysta leiðin fer ekki um B**; hún fer A→v3→v4 (44,973 m, í teiknistefnu) og sameinast 2135 á innri vertex v4 (2135 deilir v4→B-lokabút með hringnum). Prófin mega því ekki fullyrða að leiðin „fari um B1/B2/C1“ á B-hnit; B1 og C1 eru á leið, B2 aðeins sem hringbogi A→v4.

### P2 — pinna endapunkta nákvæmlega (annars velur CC)
Prompt segir „staða-ID + native coordinate úr retained heimildum“ en ekki entry vs exit. 2138 er 2 007,563 m langt, svo entry/exit á Selfoss munar ~2 km. Pinna í approved-prompt: R1 = 1436 vestari endi; **Selfoss = 2138 exit; Hella = 3591 exit** (`place_nodes-v3.json`; sama hnút og eldri 45,740/81,769 miðuðu við, án þess að nota þær tölur); E1 = 2344 start, S2 = 2894 end. Allir eru bókstaflegir hornpunktar í öllum 4 tiers (sandbox). Endapunktur sem er ekki hornpunktur ⇒ `unsupported` (endpoint_not_in_graph), ekki næsti punktur.

### P3 — slices: lokaður hringur, innri hornpunktar, endurtekið piece
- Hringendinn hefur tvo vísa (v0 og v5). **Slice from/to index = vísir hornpunkts sem raunverulega er farinn** (bakboginn endar í 0, framboginn í 5); jafna hnútinn en skrá ekki vísi úr öðrum enda.
- Á R1→Selfoss tier 2 kemur 2138 fyrir í **tveimur ósamliggjandi slices** (2138, 52491, 2138; 52492 einnig). Sameina aðeins **samliggjandi** slices sama piece; „einstakt piece“ má ekki vera próf — prófa **edge-level** einkvæmni (enginn edge tvisvar) og að summa slice-lengda = path-lengd.

### P4 — samsíða edges frá mismunandi pieces
Prompt dekkar aðeins tvítekningu sama source/tier. Raungögn hafa **17 samsíða yfirlappandi edges (tier 2) og 52 (tier −1)** milli sömu tveggja hornpunkta frá ólíkum pieces (t.d. 2135/36807 deila v4→B; 2138/52491/52492; 2532/32321; 2791/2796; 32964/33604). Lengd breytist ekki, en slice-merking gerir það. Skilgreina á **edge-stigi**: jafnlöng samsíða edge ⇒ lægsta source-ID (taka fram talna- eða strengjaröð) vinnur, og próf með víxluðu inntaki sem breytir hvorki ID né slices. Ég sá ekki raunverulegt brot í 40 handahófskenndum röðum á R1→Selfoss tier 2 (handahófskennd röð breytti ekki niðurstöðu í mínu prototype), svo þetta er forvörn, ekki sýnd villa.

### P5 — tier 2 er grófasta línan
Tier 2 hefur 923 hornpunkta samtals (tier −1: 12 745). R1→Selfoss er 44 984,770 m (tier 2) á móti 45 650,044 m (tier −1), −1,46 %. Að festa fyrsta raunprófið við tier 2 er í lagi (tier er inntak, aldrei blandað); cc-report skal segja að tier-2 tölur séu ekki vegalengdarsamningur. Valfrjálst (ekki skilyrði): B1/B2/C1 með `describe.each` á alla 4 tiers, þar sem offline-athugunin sýnir að öll tengjast.

### P6 — smáatriði
- **Z:** 72 XY-hnit hafa >1 Z innan sama tier. Geyma Z á source-vertex, ekki á hnút, og nota aldrei í tengingu.
- **Fjórða skarðið:** 2138-exit → 3737-entry (30,097 m í eldri chain) er ekki B1/B2/C1; það tengist bókstaflega um VEGHLUTI-5 piece 8676 (R1→Hella fer um 8676, 3454, 16641). Það er eðlilegt að R1→Hella noti það, en C1-acceptance er enn aðeins 3768→3767.
- **Reverse:** prófa líka reverse(reverse(x)) = x (slices, ID) og að fram- og öfug leið hafi mismunandi ID; Selfoss→R1 fer 7-piece (austurakbraut) í öfuga átt í óstefndum grafi — fyrirvarinn í promptinu stendur, passa að orðalag í reverse-prófi lofi ekki akstursstefnu.

### Takmörk
Prototype er mitt, ekki CC; hvorki Windows-keyrsla né JS/vitest/eslint staðfest. Engin staðfesting á topology, akstursstefnu eða hringtorgi (rangsælis teiknistefna er túlkun). Hornpunkta-samanburður er XY (Z hunsað); skurður inni í línubili án sameiginlegs hornpunkts ekki prófaður (eins og í promptinu). Retained skrár lesnar úr stöguðum afritum og ekki breyttar; tilvist `server_data`/frontend ekki skoðuð fyrir þessa umferð.

### Næsta skref
Ripley býr til `approved-prompt-v1.md` með P1–P6 (P1–P4 helst, P5–P6 stuttar) og setur READY_FOR_CC; eigandi segir „Prompt approved“ við CC. Stage helst PROMPT_REVIEW.

# #501 Þröskuldar — approved prompt v1 — 2026-11-20

Jonesy „samþykkjanlegt með bindandi P1–P9“ afgreitt APPROVED með atriðunum felldum inn. P1–P9 eru afrituð óbreytt neðar og ganga framar Round1 þar sem nákvæmari. CC setur CURRENT CC_IN_PROGRESS áður en framkvæmd hefst og CC_COMPLETE með report-path þegar afhending/próf eru tilbúin.

Afmörkun: eitt par junction-60-61-throskuldar↔holmavik, fjórar literal línur, enginn connector/nýtt core. P6 notar fyrirliggjandi fulla tier0-fitju offline og grænt neikvætt próf sem festir að önnur keðja eftir brot uppfyllir ekki samþykkta Þröskuldakeðju. Engin ný öflun/runtime-landsvíkkun. CC reiknar eigin raunlengdir/full hash; sandbox-tölur eru Jonesy-eignuð viðmið±0.05m.

P2 „ekki3754/3755-hnútar“ vísar til source-lína/auðkenna: endpoint-source er3321v0, ekki val á veg60. XY er samkvæmt sömu P2 og retained gögnum sameiginlegt öllum þremur; próf má ekki krefjast ólíkra XY. Varðveita z42.058 úr3321, ekki z41.9942 úr3754. Owner-Þröskuldar er viðmið inni á heiðinni, ekki junction eða aðkoma að leið.

P9 bætir við raun605-grein3321v7 á korti; engin heimild til að útfæra hana. Fyrsta route-slice er heil3321[0→47], ekki gömul neikvæð hlutsneið. Via fest nákvæmlega ["Þröskuldar"]. Valfrjáls S1–S3 og framtíðarsamsetning opna enga nýja lotu. Þegar par/focusedpróf/kort tilbúin, stoppa; sjónrænt eigandasamþykki eftir tæknilegt lokamat. Engin commit/push/deploy/GitHub.

# #501 — Vegamót 60/61 ↔ Hólmavík um Þröskulda — MVP

## Samþykkt Round1 — 2026-11-20

Eigandi heimilaði áframhald eftir samþykkta veg68-lotu og tillögu um Þröskuldaleiðina. Eitt nýtt API-par, báðar áttir, focused próf og task-local kort. Samþykkt með bindandi P1–P9 neðar. Framkvæmd aðeins eftir eiganda „Prompt approved“ og CURRENT READY_FOR_CC.

## Grunnur

Lesa AGENTS/CLAUDE, docs/ai/README.md og CURRENT; remaining-mvp-plan.md (nýrri164-staða ákvörðun ræður), owner-packages-2026-11-19/source-note.md, project/Island-akstursrod-og-GPS.csv og Vestfirdir-Hringvegur.png ásamt vegagerdin-ids GeoJSON/ID-CSV/heimildum. Nota núverandi geometryComposition, tier0-adapter og samþykkt loader/API/kort-mynstur úr westfjords-road68-mvp og westfjords-holmavik-mvp. Eigandapakkarnir eru samhengi og gögn, ekki sjálfstæð víðari framkvæmdarheimild.

Read-only undirbúningur Ripley á retained GeoJSON, án netöflunar:

- 3321 (veg61, IdButur907000037, VEGHLUTI1,48hnútar) START **[-21.93362908,65.47846693]** = 3754 START = 3755 END. Þetta eru raunveruleg vegamót60/61, ekki owner-punktur á heiðinni.
- 3321 END = 3324 START **[-21.83224971,65.5523516]**. 3324 er veg61, samaIdButur, VEGHLUTI1,64hnútar.
- 3324 END **[-21.66881151,65.66128096]** = 3611 START = 2690 END. Hér mætist veg68; ekki fara hann í þessari lotu.
- 3611 END = 3883 START = 3347 START, innri J-hnúturinn. Hólmavíkurendi sami3883hnút3 og í báðum síðustu lotum.

Því er vænt keðja **3321 → 3324 → 3611 → 3883[0→3]**, öll forward frá60/61, öfug röð/direction til baka. Þetta staðfestir geymd XY-samskeyti; native-lengd, z, allar eigindir og raunúttak CC sannprófar áður en fest. Ekki afrita hlutsneið3321[47→7] úr eldri neikvæðu prófi: þessi leið hefst á3321START.

## Framkvæmd eftir samþykki

1. Ný sjálfstæð svæðisruntime-skrá og loader fyrir nákvæmlega `junction-60-61-throskuldar` ↔ `holmavik`, lítil API-grein fyrir almennu known-ID-hliði. Junction-ID táknar60/61vegamót, ekki owner-staðinn Þröskuldar. Ekki bæta því í almenna winter-route-places.json eða opna önnur pör. Fyrri loaders/regionVersion/geometryId/gögn/kjarni/vercel óbreytt.
2. Aðeins fjórar retained tier0-línur, offline WGS84→EPSG3057 með núverandi aðferð. Varðveita sourceId/IdButur/VEGHLUTI/z/CRS/tier/upprunavísun og source-hash. Engin ný dependency, provider, leiðarvél, snapping, connector eða global epsilon. Samskeyti verða literal; finnist raunverulegt gat: STOP með sourceId/hnit og minnsta nauðsynlega skrefi áður en viðbót er gerð.
3. Junction-endi = bókstaflegur3321hnút0;3754/3755 deila XY en eru ekki slices í nýju svæðisskránni. Hólmavíkurendi/3883 óbreytt orðrétt afrit úr samþykktri fyrri svæðisskrá (engin runtime-deiling), samaowner65.705/-21.680 og offset um437.32m utanlengthM. J er innri hnútur, ekki endi; lokastubbur3883[0→3] um517.4m er með. Eigandapunkt Þröskulda má sýna á korti sem viðmið, ekki færa junction að honum eða telja loftlínu í leiðarlengd.
4. Raunhandler báðar áttir: nákvæm fjögurra sourceId/slice-röð, full3321[0→47],3324[0→63],3611[0→26],3883[0→3] frájunction; öfugt öfugt. Engin tvítalin raunbrún, samfelld hnitaruna, lengd úr hnitum/slices=lengthM og sama lengd öfugt með floating-point vikmörkum. CC mælir lengd/fullgeometryId/regionVersion sjálft og festir raunútkomu; engin uppspunnin lengd í prompti.
5. Vegnr61 á fyrstu þremur,67 á3883, VEGHLUTI1 samkvæmt retained grunninum. IdButur úr völdum slices í ferðarröð: **907000037,707040037,907040037**, öfugt öfugt. Tvær samliggjandi línur á907000037 sameinast aðeins í IdButur-lista, ekki geometry. 907040037 nær líka yfir3347, svo próf útilokar ranga sourceId, ekki alltIdButur. Engin kandidat/nálægð→roadConditionIds, engin livefærð/#503.
6. Via auðkennir Þröskuldaleið úr raunkeðju/heimildum, ekki veg68/Innstrandaveg, F66/Kollafjarðarheiði,608/Þorskafjarðarheiði eða Ísafjörð vegna Djúpvegarheitis. Fest sourceId/vegnr og rétta via-merkingu. Engin veg60leið með í nýju pari; endi á vegamótum nægir. Ekki fara um3347/Djúp/3370/53466 eða2690/68.
7. Eitt raunverulegt neikvætt próf á **fyrirliggjandi fullri1564-lína tier0-fitju**, samkvæmt sama mynstri og síðast: fjarlægja3324 eða3321 og sýna að alternate geometry, ef hún finnst, uppfyllir ekki samþykkta Þröskuldakeðju (eða skýrt unsupported ef aftengist). Keyra fyrst og festa raunútkomu/sourceleið, ekki gera ráð fyrir disconnection eða finna upp hjáleiðartölu. Prófið sjálft grænt. Engin ný netöflun/runtime-landsvíkkun eða mutation/fuzz-lota.
8. Athuga raunVEGHLUTI og aðkomustefnu, skrá tvístefnuMVP-forsendu á venjulegum vegi. Þekkti3834Ísafjarðarhringbogi er ekki á þessari leið og fyrirvarinn á ekki við. Nýr sýndur hring-/aðskildra-akbrauta-vafi þarf afmarkaða lausn áður en umfang er aukið. `drivingAccess: UNVERIFIED`, tier0 planar lengthNote, enginETA/turn-by-turn/öryggis-/færðarfullyrðing.
9. Focused regressions festa fyrri fimm Vestfjarðapör báðar áttir, Hringvegsvalkosti Selfoss/Hella, veg93, same_place og núverandi unsupported/400-samninga. Nýja junction-ID með öðru enholmavik (þ.m.t.sjálfu sér) áfram400unknown_place_id; holmavik með öðrum pörum heldur fyrra hlið/svari, þar á meðal400meðflokalundur. Engin sjálfvirk samsetning allra leggja.

## Kort, sannprófun og skil

Eitt task-local map-view.html/build-map-data samkvæmt fyrri mynstri, báðar áttir, raunendar/sourceId, owner-Hólmavík og mögulegt owner-Þröskuldaviðmið aðskilin, J merkt innri hnútur. Raungreinipunktar60/61 (3321v0),61/68 (3324v63), J (3611v26) sýndir á leið og aðrar greinar merktar „possible future connection, not confirmed“. Ekki sýna veg60/68 sem staðfestan hluta valinnar leiðar. Canonical OSM/referrer/attribution, sama native↔WGS84-aðferð og tolerance≤0.056m. Nýtt laust localhost-port t.d.8775, eldri8765–8774ótrufluð; aðeins task-mappa. Staðfesta raunvirkan hlekk eða segja tæknibilun hreinskilnislega. Sjónrænt PASS aðeins ef raunverulega skoðað; annars eigandakortasamþykki eftir tæknilegt lokamat.

Afhenda nýja runtimeJSON/loader/lítilAPI-grein/focusedpróf og task-local build/kort/cc-report.md með raunlengdum, keðju, endum,IdButur,forsendum/offsetum og raunkeyrðum athugunum. Keyra focused nýsvæðis/API/core + viðeigandi fyrri regressions, lint snertumJS og git diff --check; ekki fullsuite/build/mutation nema sýnd ástæða. CC fylgir READY_FOR_CC→CC_IN_PROGRESS→CC_COMPLETE með report-path í CURRENT; Jonesy review og Ripley lokamat/eigandakortasamþykki.

STOP þegar eina parið/focusedpróf/kort eru tilbúin. Engin ný öflun, UI/veður/livefærð/cache/scoring/pricing/dependency, nýjar Suðurfjarða-/Drangsnessgreinar, ferja, samsetning allra para, commit/push/deploy/GitHub eða sjálfvirk næsta lota. Blocker sýnir ranga/ónothæfa raunleið eða umfangsbrot; valfrjáls herðing tefur ekki MVP.



## Bindandi Jonesy P1–P9 (óbreytt afrit)

**P1 — Keðjan fest sem raðaðir sourceIds, bókstafleg.**
Próf á raunsvari báðar áttir: sourceId-röð `3321[0→47], 3324[0→63], 3611[0→26], 3883[0→3]` (frá vegamótum öll `forward`; frá Hólmavík öll `reverse`, öfug röð); vegnr „61“×3, „67“; VEGHLUTI 1; **engin connector, engin snapping** (finnist gat: STOP með sourceId/hnit). Viðmið **30 555,32 m ±0,05** (mín 30 555,315457179793), 4 slices, 0 tvítalin brún, hnitakeðja = `lengthM`, sama lengd öfugt. **Fyrsta sneið er heil 3321 (hnútar 0→47, 10 052,13 m), ekki 3321[7→47]** (hnútur 7 = vegur 605-greinin, hjáleiðin er lengri); próf festir `fromIndex 0`. **CC mælir sjálft** og ber saman við mína tölu — frávik > 0,05 m = STOP.

**P2 — Vegamótaendi (`junction-60-61-throskuldar`).**
Endapunktur = **3321 hnútur 0** orðrétt (364 140,5366828249; 556 496,1735236224; **z 42,058 — ekki núllað**), enginn innskotshnútur, 3321 óbreytt (48 hnútar). ID táknar **vegamótin 60/61 við Gilsfjörð**, ekki owner-staðinn Þröskulda. 3754/3755 eru **ekki** í svæðisskrá. **Enginn `ownerCoordinateOffsetM` fyrir þann enda** (eins og `junction-1-60-baulan`/`junction-1-68-stadarskali`). Ef owner-Þröskuldar er sýndur: aðeins kortaviðmið — **809,51 m frá næstu línu (3324) og 15 074 m eftir leiðinni frá vegamótum, 14 402,92 m í loftlínu** — aldrei endapunktur, aldrei í `lengthM`, aldrei flutt endapunktinn. Próf: endahnit = 3321 v0 bókstaflega og **ekki** 3754/3755-hnútar, CSV-næsti punktur eða owner-hnit.

**P3 — Hólmavíkurendi og J.**
Endapunktur = 3883 hnútur 3 **byte-eins** og í `westfjords-region-1-68-holmavik.json` / `westfjords-region-isafjordur-holmavik.json` (sjálfstætt afrit, engin runtime-deiling), `offsetM` 437,31993395679643 utan `lengthM`. **J (3611 v26 = 3883 v0) er innri hnútur** og lokasneið `3883[0→3]` = **517,42 m (vegur 67 stubbur)** heimil; **ekki** J sem endir (30 037,89 m væri rangt). Próf festir endahnit + lokasneið, ekki bara IdButur (`907040037` er sami á 3883 og 3347).

**P4 — IdButur úr völdum slices, ferðarröð, aðeins:**
`907000037, 707040037, 907040037` (öfugt öfugt; 3321+3324 sameinast aðeins í listanum, ekki í geometry). **Ekki með:** 905110037 (3754), 805090037 (3755), 506050037 (2109/605), 907060037 (608), 907050037, 761220037, 907070037 (Djúp), 906120037, 907350037 (68) og aðrar 68-IdButur. `907040037` nær yfir 3347 — útilokun á **sourceId** (3347, 3754, 3755, 2109, 3750, 3718, 2321, 2322, 3415, 53466, 3370, 2690 og aðrar 68-línur), ekki á IdButur. Engin candidate→`roadConditionIds`, engin #503/lifandi færð; CSV-tillaga 907000037 (807 m) er „TILLAGA_EKKI_STADFEST“ — staðfesting kemur frá slices, ekki nálægð.

**P5 — Nöfn og `via`.**
Raunheiti: 907000037 = „Djúpvegur: Þröskuldar“, línuheiti „Þröskuldar“, STADARLYSING „Hólmavík - Vestfjarðavegur“ (3321/3324/3611); 3611 = „Djúpvegur: Hrófá - Hólmavík“. `via` aðeins **„Þröskuldar“** (raunheiti línanna sem leiðin fer um), **ekki** „Djúpvegur“ (nafnið á við 61 til Ísafjarðar og er ruglingslegt hér; engin Ísafjarðar-ályktun), **ekki** „Hólmavík“/„Gilsfjörður“/„Geiradalsvegur“/„Innstrandavegur“/„Þorskafjarðarheiði“/„Ísafjörður“ af substring-passun. Prompt-lýsingin „Þröskuldaleið“ má koma fram sem `via`-merki aðeins sem „Þröskuldar“. **Próf: `via` er nákvæmlega `["Þröskuldar"]` (`toEqual`), ekki bara `toContain`** — síðasta lota sýndi að `via`-nafnagildrur lifa af ef aðeins `toContain` er prófað.

**P6 — Neikvætt próf á FULLU neti (ekki bara þröngum grunni).**
Prompt segir „keyra fyrst og festa raunútkomu“ — ég hef keyrt: sama gagnasafn **án 3324** (sama með 3321 eða 3611) fellir P1-keðjuprófið og kjarninn velur **71 909,50390853 m, 10 slices** um `3754[0→61], 3750[0→14], 3718[0→20], 2322[0→62], 2321[0→53], 3415[23→0], 53466[14→0], 3370[42→0], 3347[56→0], 3883[0→3]` (vegur 60 → 608 Þorskafjarðarheiði → Djúp 61 → Hólmavík), **+41 354,2 m**. Prófið festir lengd og sourceId-röð í báðar áttir. Þröng-grunns „disconnected“-próf má fylgja en kemur ekki í stað þessa. Auk þess í jákvæðu svari: **engin** slice með vegnr ∉ {61, 67} og **engin** sourceId ∈ {3754, 3755, 2109, 3750, 3718, 2321, 2322, 3415, 53466, 3370, 3347, 2690, 2773, 2427, 3411, 1796, 3460, 3771}.

**P7 — Stefna og hringtorg.**
Skrá: engin hringtorg og engir aðskildir akbrautir (VEGHLUTI 1 alls), enginn `directed` policy, tvístefnu-MVP-forsenda óbreytt; **ekki** flytja Ísafjarðarhringbogafyrirvarann yfir (3834 ekki á leið). `lengthNote`: tier-0 planar lengd, ekki akstursvegalengd; engin ETA/leiðsögn/færðar-/öryggisfullyrðing (Þröskuldar eru fjallvegur — engin fullyrðing um færð eða vetrarlokun úr gögnum); `drivingAccess: "UNVERIFIED"`.

**P8 — API og gagnaskrá.**
Nýtt par `junction-60-61-throskuldar`↔`holmavik` í nýrri sjálfstæðri svæðisskrá (4 línur, ein tier 0, ný `regionVersion`), grein **á undan** almennu hliðinu; nýja ID er **ekki** í `winter-route-places.json` / KNOWN_PLACE_IDS. **Óbreytt, bókstaflegt í prófi:** `junction-1-68-stadarskali↔holmavik` 110 073,97484054108 m / 12 slices / `124d9ec9…` (öfugt `f1933968…`) / `c1e9cd24a2aaa02c`; `isafjordur↔holmavik` 223 136,98949144362 m (`2d47312f…`/`ffe68470…`, `adfc38ce4897744c`); `flokalundur↔isafjordur` 87 618,54830414167 m (`8b97e2e4…`, `06fca99f301d1444`); `flokalundur↔budardalur` 172 474,22283601554 m (`751dbdae…` flokalundur→budardalur, `9d3e8ed9…` öfugt, `2f68aa481848357b`); `junction-1-60-baulan↔budardalur` 42 155,20284701861 m (`742bbdea…`); Rauðavatn/Selfoss/Hella, Egilsstaðir↔Seyðisfjörður, veg 93, `same_place`. **`holmavik` með öðru en `isafjordur`/`junction-1-68-stadarskali`/`junction-60-61-throskuldar`** → núverandi svar (`200 unsupported endpoint_mapping_unavailable`; `holmavik↔flokalundur` 400); **`junction-60-61-throskuldar` með öllu öðru** (líka `junction-1-68-stadarskali`, `isafjordur`, `junction-1-60-baulan`, `budardalur`, sjálfu sér) → `400 unknown_place_id`, og **`junction-1-68-stadarskali` með `junction-60-61-throskuldar`** → 400. `option` hunsað, engin ný svarlyklar umfram fyrri svæðispar. Kjarni, fyrri svæðisskrár/loaders, `places.json`, `vercel.json` byte-eins.

**P9 — Kort og mörk.**
Eitt task-local `map-view.html` (báðar áttir): leiðin, endar (3321 v0, 3883 v3), owner-Hólmavík og (ef notað) owner-Þröskuldar **aðskilin og merkt viðmið (809,51 m frá línu, ekki endapunktur)**, J merkt innri hnútur; greinipunktar: **60/61 (3321 v0 ↔ 3754/3755, endapunkturinn sjálfur)**, **605 Geiradalsvegur (3321 v7 = 2109 v17)**, **61/68 (3324 v63 = 3611 v0 = 2690 v74)**, **J/3347 (3611 v26)** — aðrar greinar merktar „possible future connection, not confirmed“ og **vegur 60/68 ekki sýndur sem hluti valinnar leiðar**; kortatolerance ≤0,056 m; nýtt laust port (t.d. **8775**, ekki 8765–8774); canonical OSM/referrer/attribution. **Ekkert sjónrænt PASS frá CC** nema skoðað. Stoppa þegar parið, focused próf og kort virka: ekki vegur 60/605/68, Drangsnes, Reykhólar, Búðardalur-tenging eða samsetning leggja. Enginn commit/push/deploy.

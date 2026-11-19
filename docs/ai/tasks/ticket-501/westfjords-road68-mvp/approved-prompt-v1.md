# #501 veg68 — approved prompt v1 — 2026-11-19

Jonesy „samþykkjanlegt með bindandi P1–P9“ afgreitt sem APPROVED með atriðunum felldum inn. P1–P9 neðar ganga framar Round1 þar sem nákvæmari. Aðeins keyra eftir eiganda „Prompt approved“ og CURRENT READY_FOR_CC; CC setur CC_IN_PROGRESS áður og CC_COMPLETE með report-path eftir.

Afmörkun: eitt par Hólmavík↔junction-1-68-stadarskali, tólf literal línur, enginn connector eða nýtt core. P6 full-net neikvætt próf notar þegar varðveitta fitju eins og fyrri Hólmavíkurlota; ekki ný öflun eða runtime-landsvíkkun. Það er grænt próf sem sýnir að önnur keðja eftir brot uppfyllir ekki samþykkta68-keðju, ekki viljandi rauð test-keyrsla. CC staðfestir eigin raunlengdir/full geometryId; sandbox-forskeyti ekki full hash-gildi.

P2 „ekki1481/3828“ merkir að þær Hringvegslínur eru ekki endpoint-source eða slices í nýju svæðisskránni. XY-hnitið er einmitt sameiginlegt þeirra og1796; ekki skrifa mótsagnakennt próf sem krefst mismunandi XY. Native z er varðveitt samkvæmt1796. P8 almenn fullyrðing um holmavik með öðrum pörum varðveitir fyrri samning: t.d. holmavik↔flokalundur er áfram400, ekki breytt í200. Eldri branches/routing-gate ráða utan nýja parsins.

Engin valfrjáls S1-herðing eða framtíðarleggjarsamsetning í þessari lotu. Kort/pair/focusedpróf og síðan stoppa. Engin ný review-umferð nauðsynleg fyrir þessa samþykktu afmörkun.

# #501 — Hólmavík ↔ Hringvegur um veg 68 — MVP

## Samþykkt Round1 — 2026-11-19

Eigandi: „gerum það“ eftir tillögu um næstu afmörkuðu veg68-lotu. Round1 er samþykkt með P1–P9 hér neðar. Fyrri Ísafjörður↔Hólmavík lota PASS/CLOSED með eigandakortasamþykki. Eitt nýtt par báðar áttir; ekki allt Vestfjarðanet.

## Grunnur og stutt staðbundin athugun Ripley

Lesa AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT. Endurnýta geometryComposition og tier0-adapter/fyrri svæðis-loader mynstur. Lesa westfjords-holmavik-mvp samþykkt prompt, result-review, JSON og build-script; eigandapakkana owner-packages-2026-11-19/source-note.md, project/Island-akstursrod-og-GPS.csv og Vestfirdir-Hringvegur.png ásamt vegagerdin-ids/GeoJSON/ID-CSV/heimildum. Taflan164 er gildur MVP-grunnur; eldri56-listi er runtime-staða, ekki vöruhámark. Nálægðartillaga er ekki route-validated færðartenging.

Ripley las retained GeoJSON (engin netöflun): veg68 hefur tíu línur, allar tier0/VEGHLUTI1. Frá Hringvegi til Hólmavíkur er bókstafleg XY-endakeðja:

`1796 → 1720 → 1717 → 1444 → 3278 → 24002 → 3411 → 2427 → 2773 → 2690 → 3611 → 3883`.

Fyrstu tíu eru veg68; 3611 veg61; 3883 veg67. Öll liggja í geymdri START→END átt í þessari röð. Við Hringveginn er sami WGS84-hnútur **(-21.07604777, 65.14668361)**: 1481 END (hnút15), 3828 START og 1796 START. Við norðurenda68 er 2690 END = 3611 START = 3324 END, **(-21.66881151,65.66128096)**; 3324 er Þröskuldaleggur, ekki hluti þessa pars. 3611 END = 3883 START = 3347 START. Hólmavíkurendi = sama3883hnút3 og samþykktur áður. Þetta er athugun á geymdum XY-endum, ekki sjálfstæð staðfesting allra native-hnúta/lengdar/stefnu; CC sannprófar á raunkjarna áður en niðurstaða er fest.

## Minnsta framkvæmd CC eftir samþykki

- Nýtt nákvæmlega afmarkað API-par `holmavik` ↔ **`junction-1-68-stadarskali`**, með nýjum sjálfstæðum runtime-svæðisgrunni og loader samkvæmt fyrri mynstri. Nýtt junction-ID táknar raunveruleg vegamót1/68, ekki miðju Staðarskála eða eigandastaðarins Hrútafjörður (65.153,-21.094). Eigandahnitið má sýna sem aðskilinn viðmiðspunkt en ekki færa junction þangað. Ekki bæta164 stöðum í almenna runtime-listann eða opna önnur pör.
- Endurnýta orðrétt Hólmavíkurendpoint/3883 úr síðustu svæðisskrá, sjálfstætt afrit, sourceId/IdButur og óbreyttir hnútar. Sama owner65.705/-21.680 og um437.32m offset, utanlengthM. Junction við1/68 = literal1796START; hvorki nearest-candidate né innskot nauðsynlegt samkvæmt retained-athugun. Sýna báða enda nákvæmlega.
- Offline-normalisera aðeins þessar tólf raunlínur úr WGS84 í EPSG3057 með fyrirliggjandi tier0-aðferð. Varðveita uppruna/hash/sourceId/IdButur/VEGHLUTI/tier. Geometry-kjarni óbreyttur, enginn nýr provider/dependency, connector, global epsilon eða snapping. Ef bókstafleg keðja bregst: STOP með nákvæmum sourceId/hnitum og minnsta nauðsynlega skrefi áður en geometry er breytt.
- Raunhandler báðar áttir, exact12 sourceId-röð að ofan/öfug, endaslices3883[0→3]/öfugt, engin tvítalin raunbrún, hnitakeðjusumma=lengthM, sama lengd öfugt innan floating-point vikmarka. CC mælir lengd/geometryId/regionVersion sjálfur og festir raunútkomu; engin tilbúin lengdarviðmið úr prompti.
- IdButur í ferðarröð úr völdum slices, samliggjandi endurtekningar sameinaðar: fráHringvegi **907350037,907010037,907020037,907030037,707040037,907040037**; öfugt öfugt. Staðfesta gegn raungögnum; engin candidate→roadConditionIds eða livefærð/#503.
- Leiðin verður um68, ekki3324/3321/Þröskulda,608/60/F66 eða lengri Djúp-krók. Via aðeins raunverulega studdir staðir/leiðarheiti, ekki allarCSVraðir eða substring-ályktaðir bæir. Próf festir sourceId/slice/vegnr, ekki aðeins lengd eða IdButur.
- Eitt neikvætt próf á fullri retained tier0-fitju án3411 samkvæmt P6 hér neðar; þröng disconnected-athugun má fylgja en nægir ekki. Engin ný öflun eða landsruntime-víkkun.
- Staðfesta allar raunlínur/VEGHLUTI og aðkomustefnu. Fyrri tvístefnuMVP-forsenda má gilda venjulegum vegum, en nýr hringtorgs-/aðskilinna-akbrauta-vafi þarf að koma skýrt fram áður en aukin lausn er framkvæmd. Ekki flytja þekktan Ísafjarðarhringbogafyrirvara yfir á þetta par; 3834 er ekki á þessari leið. `drivingAccess: UNVERIFIED`, tier0 planar lengthNote, enginETA, leiðsagnar-/öryggis-/færðarfullyrðing.
- Lítil sérgrein fyrir parið í API; aðrar branches/regionVersions/geometryIds/gögn/loaders/vercel óbreytt. Regressions á fyrri fjórum Vestfjarðapörum, Hringvegsvalkostum, veg93, same_place og unsupported-samningi annarra para. Nýja junction-ID er aðeins þekkt í nýja parinu; ekki almenn all-pairs opnun.

## Kort og afhending

Task-local map-view.html/build-map-data samkvæmt fyrri mynstri: báðar áttir, endar/sourceId, owner-Hólmavík aðskilin/offset, raunverulegur1/68-hnútur með1481/3828, Hrútafjörður-viðmið ef notað merkt sem slíkt. Sýna61/68/Þröskuldar-grein og J við3347/3611/3883 sem raun-greinipunkta „possible future connection, not confirmed“; Drangsnes/Þröskuldar eru ekki nýir áfangastaðir í þessari lotu. Canonical OSM/referrer/attribution, sama transform/map-tolerance og áður (≤0.056m). Nýtt laust localhost-port t.d.8774, eldri8765–8773 ótrufluð, aðeins task-mappa. Sjónrænt PASS aðeins eftir raunverulega skoðun; annars virkur hlekkur til eiganda. Eigandakortasamþykki eftir tæknilegt lokamat.

Afhenda runtimeJSON/loader/lítilAPI-grein/focusedpróf, task-local build/kort og stutta cc-report.md. Keyra focused nýsvæðis/API/core og viðeigandi fyrri regressions, lint snertumJS og diff-check. Ekki fullsuite/build/fuzz/mutation nema sýnd ástæða. Skrá raunlengd, endaval, sourcekeðju/IdButur, offsets/forsendur og raunkeyrðar athuganir. CC setur READY_FOR_CC→CC_IN_PROGRESS→CC_COMPLETE með report-path samkvæmt README. Jonesy review og Ripley lokamat.

Engin ný netöflun, UI/veður/livefærð/cache/scoring/pricing, ný dependency, samsetning allra Vestfjarða, Þröskuldaleið, ferja, commit/push/deploy/GitHub eða sjálfvirkt næsta verkefni. Þegar eina parið/focusedpróf/kort tilbúin, stoppa. Blocker sýnir ranga eða ónothæfa raunleið/umfangsbrot; valfrjáls herðing tefur ekki MVP.



## Bindandi Jonesy P1–P9 (óbreytt afrit)

**P1 — Keðjan fest sem raðaðir sourceIds, bókstafleg.**
Próf á raunsvari báðar áttir: sourceId-röð `1796, 1720, 1717, 1444, 3278, 24002, 3411, 2427, 2773, 2690, 3611, 3883[0→3]` (öfugt öfugt, `from=junction`: allar `forward`, `from=holmavik`: allar `reverse`); vegnr "68" ×10, "61", "67"; VEGHLUTI 1; **engin connector, engin snapping** (finnist gat: STOP með sourceId/hnit). Viðmið **110 073,97 m ±0,05** (mín 110 073,97484053829 / …827), 12 slices, 0 tvítalin brún, hnitakeðja = `lengthM`, sama lengd öfugt (floating-point vikmörk). **CC mælir sjálft** (prompt-krafa) og ber saman við mína tölu — frávik > 0,05 m = STOP, ekki „festa“.

**P2 — Hringvegsendi (`junction-1-68-stadarskali`).**
Endapunktur = **1796 hnútur 0** orðrétt (402 624,2594; 517 951,9698; **z 4,585 — ekki núllað**), enginn innskotshnútur, 1796 óbreytt (31 hnútur). ID táknar **vegamótin**, ekki miðju Staðarskála og ekki owner-staðinn Hrútafjörður. **Enginn `ownerCoordinateOffsetM` fyrir þann enda** (eins og `junction-1-60-baulan`), því owner-punkturinn er ekki endapunkturinn. Ef Hrútafjörður er sýndur: aðeins kort-viðmið, **1 097,72 m frá endapunkti** (næsta línupunkt 403,51 m á 1796 ekki notað og ekki kallað „aðkoma“), aldrei í `lengthM`, aldrei flutt endapunktinn. Hringvegslínur 1481/3828 **ekki** í svæðisskrá (ekki á leið); hnútur 1796 v0 má vera skráður sem að þær deili honum aðeins í korti/athugasemd. Próf: endahnit = 1796 v0 bókstaflega og **ekki** 1481/3828/CSV-næsta/owner-hnit.

**P3 — Hólmavíkurendi og J.**
Endapunktur = 3883 hnútur 3 (376 742,4202; 580 824,7021; z 0) **byte-eins** og í `westfjords-region-isafjordur-holmavik.json` (sjálfstætt afrit, ekki runtime-deiling), `offsetM` 437,31993395679643 utan `lengthM`. **J (3611 v26 = 3883 v0) er nú innri hnútur leiðarinnar**: skipting 3611→3883 er bókstafleg og lokasneið **3883[0→3] = 517,4 m (vegur 67 stubbur)** er heimil „bæjargrein“ eins og áður; síðasta lota „J ekki notað“ gildir ekki hér — **J er hvorki endapunktur né `junctionJ`-reitur sem má koma í stað Hólmavíkurenda** (109 556,57 m væri rangur endir). Próf festir endahnit + lokaslice (sourceId 3883, 0→3, 517,4 m), ekki bara IdButur (`907040037` er sami á 3883 og 3347).

**P4 — IdButur úr völdum slices, ferðarröð, aðeins:**
`907350037, 907010037, 907020037, 907030037, 707040037, 907040037` (öfugt öfugt; samliggjandi eins sameinuð). **Ekki með:** 904060037 (1481), 907150037 (3828), 905050037 (59), 907000037 (Þröskuldar), 907060037 (608), 906120037/907070037/907050037/761220037 (Djúp), 806110037. **`707040037` er nú með (3611 á leið)** — ekki afrita „útilokað“ úr fyrri lotu. `907040037` nær yfir 3347 — útilokun á **sourceId** (3347, 3324, 3321, 2744, 1481, 3828), ekki á IdButur. Engin candidate→`roadConditionIds`, engin #503/lifandi færð; CSV-tillaga 907350037 (402 m) er „TILLAGA_EKKI_STADFEST“ — staðfesting kemur frá slices, ekki frá nálægð.

**P5 — Nöfn og `via`.**
`via` aðeins úr raunverulegum línuheitum (t.d. „Innstrandavegur“ úr IdButur-heiti, „Broddanes“ úr „Þambárvellir-Broddanes/Broddanes-Hrófá“), **ekki** „Laxárdalsheiði“ (línuheitin „Staðarskáli-Laxárdalsheiði“/„Laxárdalsheiði-Þambárvellir“ eru 68-kaflar; heiðin sjálf er á **vegi 59** og er **ekki farin**), **ekki** „Þröskuldar“, **ekki** „Djúpvegur“ (STADARLYSING „Djúpvegur - Broddadalsá“ á 2427/2773/2690 er 68-kafli; „Djúpvegur: Hrófá - Hólmavík“ er 3611 — nafnið á ekki að leiða til Ísafjarðar-merkingar) og **ekki** „Ísafjörður“/„Hólmavík“/„Staðarskáli“ af substring-passun. Próf: `via` inniheldur ekkert af þeim.

**P6 — Neikvætt próf á FULLU neti (ekki bara þröngum grunni).**
Þröng-grunns prófið í prompti er innantómt (allt aftengist). Skylt: **eitt** raunverulegt próf á fullri 1564-lína tier-0 fitju (sama tækni og P6 síðustu lotu): sama gagnasafn **án 3411** fellir P1-keðjuprófið — kjarninn velur þá Þröskulda/60-krókinn **126 491,12 m, 20 slices** (3324[63→0], 3321[47→7], … 1481[3→15]). Valfrjálst annað: án 3611 → **168 331,07 m, 25 slices** um 3347/3370/53466/3415/2321. Þröngt „disconnected“-próf má fylgja, en má ekki koma í stað þessa. Auk þess í jákvæðu svari: **engin** slice með vegnr ∉ {61, 67, 68} (t.d. 1, 59, 60) og **engin** sourceId ∈ {3324, 3321, 3347, 3370, 53466, 3415, 2321, 2322, 2744, 1481, 3828, 2109, 3755, 3771}.

**P7 — Stefna og hringtorg.**
Skrá: engin hringtorg og engir aðskildir akbrautir á leiðinni (VEGHLUTI 1 alls), enginn `directed` policy, tvístefnu-MVP-forsenda óbreytt; **ekki** flytja Ísafjarðarhringbogafyrirvarann yfir (3834 ekki á leið; ekkert +23 m). `lengthNote`: tier-0 planar lengd, ekki akstursvegalengd; engin ETA/leiðsögn/færðarfullyrðing; `drivingAccess: "UNVERIFIED"`.

**P8 — API og gagnaskrá.**
Nýtt par `holmavik`↔`junction-1-68-stadarskali` í nýrri sjálfstæðri svæðisskrá (12 línur, ein tier 0, ný `regionVersion`), grein **á undan** almennu hliðinu (nýja ID er ekki í KNOWN_PLACE_IDS og má ekki bætast í `winter-route-places.json`). **Óbreytt, bókstaflegt í prófi:** `isafjordur↔holmavik` 223 136,98949144362 m / 26 slices / `2d47312f…` (öfugt `ffe68470…`) / `adfc38ce4897744c`; `flokalundur↔isafjordur` 87 618,5483 m (`8b97e2e4…`/`0eebee66…`, `06fca99f…`); `flokalundur↔budardalur` 172 474,2228 m (`9d3e8ed9…`/`751dbdae…`, `2f68aa48…`); `junction-1-60-baulan↔budardalur` 42 155,2028 m (`742bbdea…`/`559dde16…`); Rauðavatn/Selfoss/Hella (44 984,7704 / 45 101,8095 / 35 646,1774 / 80 681,3119), Egilsstaðir↔Seyðisfjörður 24 148,8609, `same_place`. **`holmavik` með öðru en `isafjordur`/`junction-1-68-stadarskali`** → núverandi svar (`200 unsupported endpoint_mapping_unavailable`); **`junction-1-68-stadarskali` með öllu öðru** (líka `isafjordur`, `junction-1-60-baulan`, `budardalur`, sjálfum sér) → `400 unknown_place_id` eins og fyrir `junction-1-60-baulan`; `option` hunsað, engin ný svarlyklar umfram fyrri svæðispar. Kjarni, fyrri svæðisskrár/loaders, `places.json`, `vercel.json` byte-eins.

**P9 — Kort og mörk.**
Eitt task-local `map-view.html` (báðar áttir): leiðin, endar (1796 v0, 3883 v3), owner-Hólmavík og (ef notað) owner-Hrútafjörður **aðskilin og merkt viðmið**, J og greinipunktar úr lið 8: **Hringvegur 1 (1481/3828)**, **59 Laxárdalsheiði (1720 v9)**, **Þröskuldar 3324 (2690 v74)**, **61 Djúpvegur 3347 (J)** — merktir „possible future connection, not confirmed“; kortatolerance ≤0,056 m; nýtt laust port (t.d. **8774**, ekki 8765–8773); canonical OSM/referrer/attribution. **Ekkert sjónrænt PASS frá CC** nema skoðað. Stoppa þegar parið, focused próf og kort virka: ekki 59/Búðardalur-tenging, Þröskuldaleið, Drangsnes, Hringvegur norður/suður eða samsetning leggja. Enginn commit/push/deploy.

# #501 — Hólmavík ↔ Hringvegur um veg 68 — MVP

## Ripley initial prompt — umferð 1, 2026-11-19

Eigandi: „gerum það“ eftir tillögu um næstu afmörkuðu veg68-lotu. Prompt til Jonesy, ekki framkvæmdarheimild. Fyrri Ísafjörður↔Hólmavík lota PASS/CLOSED með eigandakortasamþykki. Eitt nýtt par báðar áttir; ekki allt Vestfjarðanet.

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
- Eitt merkingarbært neikvætt próf: fjarlægja miðlínu68 (t.d.3411) úr þröngum gagnagrunni; kjarni skilar unsupported/disconnected og engin bein brú yfir gatið. Þetta er einangruð12lína lota; ekki krefjast nýrrar fullrar landsfitju/mutation-rannsóknar.
- Staðfesta allar raunlínur/VEGHLUTI og aðkomustefnu. Fyrri tvístefnuMVP-forsenda má gilda venjulegum vegum, en nýr hringtorgs-/aðskilinna-akbrauta-vafi þarf að koma skýrt fram áður en aukin lausn er framkvæmd. Ekki flytja þekktan Ísafjarðarhringbogafyrirvara yfir á þetta par; 3834 er ekki á þessari leið. `drivingAccess: UNVERIFIED`, tier0 planar lengthNote, enginETA, leiðsagnar-/öryggis-/færðarfullyrðing.
- Lítil sérgrein fyrir parið í API; aðrar branches/regionVersions/geometryIds/gögn/loaders/vercel óbreytt. Regressions á fyrri fjórum Vestfjarðapörum, Hringvegsvalkostum, veg93, same_place og unsupported-samningi annarra para. Nýja junction-ID er aðeins þekkt í nýja parinu; ekki almenn all-pairs opnun.

## Kort og afhending

Task-local map-view.html/build-map-data samkvæmt fyrri mynstri: báðar áttir, endar/sourceId, owner-Hólmavík aðskilin/offset, raunverulegur1/68-hnútur með1481/3828, Hrútafjörður-viðmið ef notað merkt sem slíkt. Sýna61/68/Þröskuldar-grein og J við3347/3611/3883 sem raun-greinipunkta „possible future connection, not confirmed“; Drangsnes/Þröskuldar eru ekki nýir áfangastaðir í þessari lotu. Canonical OSM/referrer/attribution, sama transform/map-tolerance og áður (≤0.056m). Nýtt laust localhost-port t.d.8774, eldri8765–8773 ótrufluð, aðeins task-mappa. Sjónrænt PASS aðeins eftir raunverulega skoðun; annars virkur hlekkur til eiganda. Eigandakortasamþykki eftir tæknilegt lokamat.

Afhenda runtimeJSON/loader/lítilAPI-grein/focusedpróf, task-local build/kort og stutta cc-report.md. Keyra focused nýsvæðis/API/core og viðeigandi fyrri regressions, lint snertumJS og diff-check. Ekki fullsuite/build/fuzz/mutation nema sýnd ástæða. Skrá raunlengd, endaval, sourcekeðju/IdButur, offsets/forsendur og raunkeyrðar athuganir. CC setur READY_FOR_CC→CC_IN_PROGRESS→CC_COMPLETE með report-path samkvæmt README. Jonesy review og Ripley lokamat.

Engin ný netöflun, UI/veður/livefærð/cache/scoring/pricing, ný dependency, samsetning allra Vestfjarða, Þröskuldaleið, ferja, commit/push/deploy/GitHub eða sjálfvirkt næsta verkefni. Þegar eina parið/focusedpróf/kort tilbúin, stoppa. Blocker sýnir ranga eða ónothæfa raunleið/umfangsbrot; valfrjáls herðing tefur ekki MVP.


---

## Jonesy review — umferð 1 (2026-11-19)

**Niðurstaða: PROMPT_REVIEW — samþykkjanlegt með bindandi P1–P9. Engin gagnagat og engin connector þörf** (öll 11 samskeyti keðjunnar eru bókstafleg). Þrjár hættur: (a) **neikvæða prófið í prompti („fjarlægja 3411 úr þröngum grunni → disconnected“) er innantómt** — hvaða lína sem er hverfur úr 12 lína grunni gefur `disconnected_graph`; raunverulega hættan er að á **fullu neti** velur kjarninn **Þröskulda/60-krók (126 491,12 m, aðeins +16,4 km)** ef 68-lína vantar (P6); (b) **`707040037` (3611) er nú á leið** en var útilokað í síðustu lotu — og `907040037` nær líka yfir 3347 (ekki á leið), svo útilokun verður að vera á **sourceId** (P4); (c) vegamótin J (3611 v26) eru nú **millipunktur** á leiðinni, ekki lengur „ónotað“ — Hólmavíkurendinn er 517,4 m stubbur *handan* J (P3).

### Merking: sandbox vs CC

- **Sandbox (mitt, Linux):** allar 1564 tier-0 línur pakkans umreiknaðar með pyproj í EPSG:3057 (4 aukastafir), **raunverulegur `composeGeometryPath`** úr núverandi lotu (ekki nýr handler; hann er ekki til enn), Dijkstra-samanburður óháður kjarna. Allar tölur eru **mínar**, viðmið ±0,05 m.
- **CC-fullyrt:** ekkert enn. Ég las **ekki** Ripley-fullyrðingar sem staðfestingu; ég endurreiknaði úr hráum gögnum.

### Sandbox-niðurstöður

1. **Bókstafleg keðja Hringvegur → Hólmavík** (11 samskeyti, `end==start` í WGS84, **0 gat**): **1796 → 1720 → 1717 → 1444 → 3278 → 24002 → 3411 → 2427 → 2773 → 2690 → 3611 → 3883[0→3]**. VEGNR: tíu línur **68**, 3611 = **61**, 3883 = **67**; **VEGHLUTI 1 á öllum 12**; allar tier 0; engar tvíteknar IDFERILL (hver lína ein færsla). Allar tíu 68-línur retained-gagna eru á keðjunni (engar aðrar 68-línur til).
2. **Raunkjarni, báðar áttir** (þröng 12-lína skrá og fullt 1564-lína net gefa **sama svar**): vegamót 1796 hnútur 0 → 3883 hnútur 3 = **110 073,97484053829 m, 12 slices**, öll `forward`; öfugt **110 073,97484053827 m**, sama sourceId-röð öfug, öll `reverse`; **0 tvítalin brún**; engin afmörkun þarf — kjarninn velur þetta sjálfur á fullu neti.
3. **Slice-lengdir (m):** 1796 7 180,7 · 1720 1 915,5 · 1717 13 637,7 · 1444 14 961,4 · 3278 7 186,1 · 24002 11 631,6 · 3411 16 938,7 · 2427 7 523,2 · 2773 8 160,8 · 2690 15 213,7 · 3611 5 207,0 · 3883[0→3] 517,4. Summa að vegamótum J (3611 v26) = **109 556,57 m**; + stubbur 517,4 = 110 073,97.
4. **IdButur (6, frá Hringvegi, ferðarröð):** `907350037, 907010037, 907020037, 907030037, 707040037, 907040037` — stemmir við prompt; öll til í CSV-708 (907350037 = „Innstrandavegur sunnan Laxárdalsheiðar“ 1796;1720; 707040037 = „Djúpvegur: Hrófá - Hólmavík“ 61, **aðeins 3611**). **Varúð:** `907040037` = 3883 **og 3347** (3347 er ekki á leið).
5. **Vegamót 1/68:** 1796 hnútur 0 = (−21,07604777; 65,14668361), EPSG:3057 **(402 624,2594; 517 951,9698; z 4,585)**; sami hnútur er **1481 hnútur 15 (END, Hringvegur, Holtavörðuheiði 904060037)** og **3828 hnútur 0 (START, Hringvegur, „Staðarskáli-Hvammstangavegur“ 907150037)** — engar aðrar línur. Línuheiti 1796: „Hringvegur við Staðarskála - Laxárdalsheiði“. Hringvegslínurnar eru **ekki** á leiðinni (endinn er upphaf 1796).
6. **Owner Hrútafjörður (65,153/−21,094)** → EPSG:3057 (401 805,849; 518 683,543): **1 097,72 m frá vegamótum**; næsti punktur á línu er **1796, hluti 7→8, 403,51 m** (CSV tillaga 1 = 907350037, 402 m, „nálægð eingöngu / TILLAGA_EKKI_STADFEST_LEIDARTENGING“). Hvorugt er „Staðarskáli-staðurinn“ eða akstursaðkoma; Hrútafjörður er ekki í 56-lista `winter-route-places.json`.
7. **Vegamót J (61/67/Hrófá):** 3611 hnútur 26 = 3883 hnútur 0 = 3347 hnútur 0 = (376 234,0238; 580 853,0576; z 23,2108 á 3611, z 0 á 3883). Nú **innri hnútur leiðarinnar** (3611→3883 skipting bókstafleg), Hólmavíkurendinn 3883 hnútur 3 (376 742,4202; 580 824,7021; z 0, 437,32 m frá owner, = `places.json`) er **517,4 m stubbur utan** J.
8. **Greinipunktar á keðjunni** (aðrar línur deila hnút): 1796 v0 → 1481/3828 (Hringvegur 1); **1720 v9 = 1717 v0 → 2744 v17 (vegur 59 Laxárdalsheiði, 905050037)**; **2690 v74 = 3611 v0 → 3324 v63 (61 Þröskuldaleggur)**; **3611 v26 = 3883 v0 → 3347 v0 (61 Djúpvegur)**. Engir aðrir.
9. **Neikvæð tilvik á fullu 1564-lína neti** (kjarninn svarar án villu):
   - án **3411** (sama útkoma án 3278, 2690, 2427, 1717 eða 1796): **126 491,12180579 m, 20 slices** um 3883[3→0], 3611[26→0], **3324[63→0], 3321[47→7]** (Þröskuldar), 2109, 3755, 3771, 3460, 40961, 3462, 3247, 3197, 2769, 2647, 2648, 2161, 2354, 2096, 2462, **1481[3→15]** (aðkoma að sama Hringvegshnúti úr suðri); **aðeins +16 417,1 m** lengri en rétta leiðin.
   - án **3611**: **168 331,07484 m, 25 slices** um 3347, 3370, 53466, 3415, 2321/2322 (608), 3718, 3750, 3754 … 1481[3→15].
   - **þröng 12-lína skrá:** hver sem er fjarlæging → `disconnected_graph` (3611/3278/2690/2427/1717/3411) eða `endpoint_not_in_graph` (1796) — sannar ekkert um val kjarnans.
10. **Hringtorg/stefna:** engin hringtorg á leiðinni (enginn hnútur í keðjunni deilir hring með annarri línu; VEGHLUTI 1 alls). Geymd átt er Hringvegur→Hólmavík í öllum 12; kjarninn er óstefnubundinn. **Ísafjarðarhringbogafyrirvarinn á ekki við** (3834 ekki á leið).
11. **Núverandi API (raunhandler síðustu lotu):** `holmavik` með öðrum en `isafjordur` → `200 unsupported endpoint_mapping_unavailable`; `junction-1-60-baulan` aðeins með `budardalur`. Nýtt ID `junction-1-68-stadarskali` er ekki í 56-lista → **400 `unknown_place_id`** annars staðar (eins og `junction-1-60-baulan`).

### Bindandi atriði (P1–P9)

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

### Valfrjálst (ekki blockerar)

- **S1 (endurtekið):** eitt próf sem ber **alla hnúta** svæðisskrárinnar saman við hrátt GeoJSON (umreiknað) — síðasta lota sýndi að 1 m færsla á innri hnút lifir af prófin í öllum svæðisskrám.
- **S2 (skipulag síðar):** samsetning **Ísafjörður → Hólmavík → Hringvegur** úr tveimur leggjum tvítelur 3883-stubbinn: 223 136,99 + 110 073,97 = **333 210,96 m**, en bein leið um vegamót J er 222 619,57 + 109 556,57 = **332 176,14 m** (munur = 2 × 517,4 = 1 034,8 m). Framtíðarsamsetning skal nota J, ekki Hólmavíkurenda, sem skeytipunkt.
- **S3:** 110,07 km er tier-0 planar lengd EPSG:3057 (ekki akstur); vegurinn sveigir mikið (24002 fer vestur að ~−21,47° og til baka) — skoða ber á korti að leiðin sé samfelld Innstrandavegur-lína án óvæntra lykkja (gögnin sjálf, 0 tvítalin brún, styðja það).
- **S4:** sama óþekkta fullyrðing og áður: vetrarfærð á 68 (t.d. Laxárdalsheiði-/Broddanes-kaflar) er ekki úr gögnum; MVP-forsenda um venjulegan tvístefnuveg stendur (VEGHLUTI 1).

### Mörk þessarar yfirferðar

- Enginn kóði CC til að skoða; raunhandler nýja parsins ekki keyrður (er ekki til). Tölur úr **mínum** pyproj-umreikningi af pakka-GeoJSON og raunkjarna `composeGeometryPath` á þröngri skrá og fullu neti, ±0,05 m. Ekkert keyrt á Windows-vél eiganda; ég sá ekki `Vestfirdir-Hringvegur.png`-teikningu eiganda né rendered kort.
- Owner-hnit eru MVP-forsenda; 403,51 m / 1 097,72 m Hrútafjarðartölur eru nálægð í gögnum, ekki staðfest aðkoma. Umferð 2 aðeins ef eigandi biður um hana.

### Næsta skref

Ripley skrifar `approved-prompt-v1.md` með P1–P9 og setur CURRENT á READY_FOR_CC; eigandi segir „Prompt approved“ við CC.

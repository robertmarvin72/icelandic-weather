# #501 — Vegamót 60/61 ↔ Hólmavík um Þröskulda — MVP

## Ripley initial prompt — umferð 1, 2026-11-20

Eigandi heimilaði áframhald eftir samþykkta veg68-lotu og tillögu um Þröskuldaleiðina. Eitt nýtt API-par, báðar áttir, focused próf og task-local kort. Prompt-review eingöngu; framkvæmd bíður Jonesy-samþykkis, approved-prompt/CURRENT READY_FOR_CC og eiganda „Prompt approved“.

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


---

## Jonesy review — umferð 1 (2026-11-20)

**Niðurstaða: PROMPT_REVIEW — samþykkjanlegt með bindandi P1–P9. Engin gagnagat og engin connector þörf** (öll 3 samskeyti keðjunnar eru bókstafleg). Keðjan er stutt og einföld; hætturnar eru í kringum hana: (a) **neikvæða prófið velur 608 Þorskafjarðarheiði/Djúp-krók (71 909,50 m, +41,4 km)**, ekki „disconnected“ — og sá krókur snertir allt sem P6 á að útiloka (P6); (b) **IdButur-heitið „Djúpvegur: Þröskuldar“ (907000037) og STADARLYSING „Hólmavík - Vestfjarðavegur“** eru nafnagildrur fyrir `via` (P5); (c) **3321 hnútur 7 deilir hnút með vegi 605 (2109)** — raunveruleg grein á leiðinni sem prompt nefnir ekki, og 3321[0→7] (1 876,0 m) er styttri en hjáleiðin um 3755+2109 (4 444,7 m), svo kjarninn tekur alla 3321 (P1); (d) **owner-punktur Þröskulda er 809,5 m frá leiðinni og 15 074 m eftir henni frá vegamótum** — ekki endapunktur (P2).

### Merking: sandbox vs CC

- **Sandbox (mitt, Linux):** allar 1564 tier-0 línur pakkans umreiknaðar með pyproj í EPSG:3057 (4 aukastafir), **raunverulegur `composeGeometryPath`** úr núverandi lotu (ekki nýr handler; hann er ekki til enn) á þröngri 4-lína skrá og á fullu neti. Allar tölur eru **mínar**, viðmið ±0,05 m. Ég tók ekki fullyrðingar úr Ripley-hluta sem staðfestingu; ég endurreiknaði úr hráum gögnum.
- **CC-fullyrt:** ekkert enn.

### Sandbox-niðurstöður

1. **Bókstafleg keðja vegamót 60/61 → Hólmavík** (3 samskeyti, `end==start` í WGS84, **0 gat**): **3321 → 3324 → 3611 → 3883[0→3]**. VEGNR „61“ á 3321/3324/3611, „67“ á 3883; **VEGHLUTI 1 á öllum 4**; tier 0; hver IDFERILL ein færsla. Hnútafjöldi 48 / 64 / 27 / 4.
2. **Raunkjarni, báðar áttir** (þröng 4-lína skrá og fullt 1564-lína net gefa **sama svar**): 3321 hnútur 0 → 3883 hnútur 3 = **30 555,315457179793 m, 4 slices** `3321[0→47] 3324[0→63] 3611[0→26] 3883[0→3]`, öll `forward`; öfugt **30 555,315457179793 m**, `3883[3→0] 3611[26→0] 3324[63→0] 3321[47→0]`, öll `reverse`. Kjarninn velur þetta sjálfur á fullu neti.
3. **Slice-lengdir (m):** 3321 10 052,13 · 3324 14 778,72 · 3611 5 207,04 · 3883[0→3] 517,42. Summa að J (3611 v26) = 30 037,89 m; + stubbur 517,42 = 30 555,32.
4. **IdButur (3, frá vegamótum):** `907000037, 707040037, 907040037` — stemmir við prompt; 907000037 = „Djúpvegur: Þröskuldar“ (3321;3324 — tvær línur, sameinast aðeins í listanum), 707040037 = „Djúpvegur: Hrófá - Hólmavík“ (aðeins 3611), 907040037 = **3883 og 3347** (3347 ekki á leið → útilokun á sourceId).
5. **Vegamót 60/61 (endapunktur):** 3321 hnútur 0 = (−21,93362908; 65,47846693), EPSG:3057 **(364 140,5366828249; 556 496,1735236224; z 42,058)**; sami hnútur og **3754 hnútur 0 (vegur 60, „Djúpvegur-Reykhólasveitarv.“, 905110037)** og **3755 hnútur 15 (vegur 60, „Gilsfjörður“, 805090037)**; engar aðrar línur. 3754/3755 eru **ekki á leið** (endinn er upphaf 3321). z á 3321 v0 = 3755 v15 = 42,058 (3754 v0 41,9942).
6. **Grein á leiðinni sem prompt nefnir ekki:** **3321 hnútur 7 = 2109 hnútur 17 (vegur 605 Geiradalsvegur, 506050037)**, (−21,90114379; 65,48786494; z 55,8723). 3321[0→7] = **1 876,03 m**; hjáleið um 3755[15→8] + 2109 = 1 527,23 + 2 917,50 = **4 444,73 m** — því er hún lengri og kjarninn heldur öllum 3321 (ég keyrði raunkjarna; niðurstaða liðar 2). Þetta er sama hnútur og kemur fram í gömlu neikvæðu prófi (`3321[47→7]` + 2109), þar sem leiðin kemur að sunnan.
7. **Aðrir greinipunktar á keðjunni:** 3324 hnútur 63 = 3611 hnútur 0 = **2690 hnútur 74 (vegur 68 Innstrandavegur)**; 3611 hnútur 26 = 3883 hnútur 0 = **3347 hnútur 0 (61 Djúpvegur)** = J (z 23,2108 á 3611, z 0 á 3883). Engir aðrir.
8. **Hólmavíkurendi:** 3883 hnútur 3 (376 742,4202; 580 824,7021; z 0), óbreyttur, 437,32 m frá owner-punkti; J (3611 v26) er innri hnútur, 517,4 m stubbur utan.
9. **Neikvæð tilvik á fullu 1564-lína neti** (kjarninn svarar án villu):
   - án **3324** (sama útkoma án 3321 eða án 3611): **71 909,50390853 m, 10 slices** `3754[0→61] 3750[0→14] 3718[0→20] 2322[0→62] 2321[0→53] 3415[23→0] 53466[14→0] 3370[42→0] 3347[56→0] 3883[0→3]` — þ.e. **vegur 60 (3754) → 608 Þorskafjarðarheiði (2321/2322) → 3415/53466/3370/3347 (61 Djúp) → 3883**; **+41 354,2 m**. Báðar áttir sama lengd.
   - **þröng 4-lína skrá:** án 3324 / 3611 → `disconnected_graph`; án 3321 → `endpoint_not_in_graph` — sannar ekkert um val kjarnans.
10. **Owner Þröskuldar (65,592/−21,785)** → EPSG:3057 (371 576,617; 568 831,032): næsti línupunktur **3324 v24, 812,83 m** (næsta lína 809,51 m; CSV tillaga 907000037, 807 m, „nafn_og_nalaegd / TILLAGA_EKKI_STADFEST_LEIDARTENGING“); **14 402,92 m í loftlínu frá vegamótunum og 15 074 m eftir leiðinni að næsta punkti**. Owner-punkturinn er því inni á heiðinni, ekki á vegamótunum.
11. **Hringtorg/stefna:** engin hringtorg og engir aðskildir akbrautir á leiðinni (VEGHLUTI 1); geymd átt er vegamót→Hólmavík á öllum 4 línum; kjarninn óstefnubundinn. Ísafjarðarfyrirvarinn á ekki við (3834 ekki á leið).
12. **Núverandi API (raunhandler síðustu lotu):** `holmavik` með öðrum en `isafjordur`/`junction-1-68-stadarskali` → `200 unsupported endpoint_mapping_unavailable`; `holmavik↔flokalundur` → 400; `junction-1-68-stadarskali` með öllu öðru → 400 `unknown_place_id`. Nýtt ID `junction-60-61-throskuldar` er ekki í 56-lista → 400 annars staðar.

### Bindandi atriði (P1–P9)

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

### Valfrjálst (ekki blockerar)

- **S1 (fyrri eyða, nánast lokuð):** síðasta lota sýndi að 1 m skekkja á innri hnút næst nú, en 0,01 m ekki; ekki nauðsyn.
- **S2 (skipulag síðar):** Þröskuldaleiðin og 68-leiðin skarast á 3611 + 3883 (5 724,5 m); samsetning t.d. Hringvegur → Hólmavík → Þröskuldar um tvo legga tvítelur 3883-stubbinn (2 × 517,4 m) og 3611; framtíðarleiðir skulu nota J, ekki Hólmavíkurenda, sem skeytipunkt. Á fullu neti er Hólmavík↔Hringvegur 1/68 um 68 (110 073,97 m) enn stysta leið — Þröskuldaleiðin skilar sér að 60, ekki að 1/68, og því er ekkert „stutt vs löng“ val í þessu pari.
- **S3:** 30,56 km er tier-0 planar EPSG:3057 lengd, ekki akstursvegalengd; Þröskuldar eru fjallvegur (almenn þekking mín, ekki úr gögnum) — MVP-forsenda um venjulegan tvístefnuveg stendur (VEGHLUTI 1) og engin færðarfullyrðing.

### Mörk þessarar yfirferðar

- Enginn kóði CC til að skoða; raunhandler nýja parsins ekki keyrður (er ekki til). Tölur úr **mínum** pyproj-umreikningi af pakka-GeoJSON og raunkjarna `composeGeometryPath` á þröngri skrá og fullu neti, ±0,05 m. Ekkert keyrt á Windows-vél eiganda; ég sá ekki `Vestfirdir-Hringvegur.png`-teikningu eiganda né rendered kort.
- Owner-hnit eru MVP-forsenda; 809,51 m / 437,32 m frávik eru nálægð í gögnum, ekki staðfest aðkoma. Umferð 2 aðeins ef eigandi biður um hana.

### Næsta skref

Ripley skrifar `approved-prompt-v1.md` með P1–P9 og setur CURRENT á READY_FOR_CC; eigandi segir „Prompt approved“ við CC.

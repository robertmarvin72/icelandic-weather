# #501 — Ísafjörður ↔ Hólmavík um Djúpveg61 — MVP Round1 — 2026-11-19

Eigandi bað um áframhald eftir samþykkta Flókalundur↔Ísafjörður lotu. Afhenda næsta stofnleiðarbút Ísafjörður↔Hólmavík umDjúpveg61/Steingrímsfjarðarheiði, báðar áttir. Ekki Djúpvegur á nafnalíkingu: Ísafjörður bær aðgreindur frá firðinum Ísafirði innst íDjúpi í source-heitum. Prompt-review, ekki execution heimild fyrr en approved prompt/CURRENT READY_FOR_CC og eigandi Prompt approved.

## Lesa og endurnýta

AGENTS/CLAUDE/README/CURRENT; westfjords-isafjordur-mvp samþykkt prompt/lokamat/build/JSON/loader/próf; geometry API/core og validated tier0-adapter. Báðir eigandapakkar owner-packages-2026-11-19: source-note/manifest,164staðaCSV/Vestfirdir-Hringvegur.png og ID-CSV/GeoJSON/heimildir/tillögur. Jonesy notar sömu heimildir í báðum review-stigum. Hnit eiganda gild MVP, ekki ný nákvæmnissannprófun eða landsrannsókn.

## Minnsta framkvæmd

- Nákvæmlega nýtt API-par `isafjordur`↔`holmavik`, lítil sjálfstæð svæðisruntime-skrá og loader/API-próf. Engin sameining allra Vestfjarða/parátta í einu, enginn nýr route engine/provider/dependency. Sama literal tier0/EPSG3057-core; aðrir dataset/geometryId/regionVersion óbreyttir.
- Ísafjarðarendi sami orðrétti3834hnút5 úr samþykktri fyrri svæðisskrá, ekki gamli places-hnút12 eða owner-hnitið. Ný leið fer frá þessum enda til baka að raunverulegriDjúp-grein; eðlileg sameiginleg aðkoma getur skarast milli A→B og B→C ferðaleggja og má ekki búa til sourceId-unique-reglu yfir alla framtíðarferðina. Engin tvítalning raunbrúna í EINNI leið.
- Hólmavík owner-punktur65.705/-21.680 varðveittur aðskilinn frá route-endpoint. Velja rétta vegaðkomu í bænum eða á nauðsynlegri bæjartengingu úr raunkeðju/vegamótum, projection/innskot ef þarf eins og fyrri lotur, sourceId/IdButur óbreytt. Candidate907040037/707040037 eru vísbendingar, ekki endpoint-sönnun; næsti skráði candidate436m er ekki staðfest436m aklína. Offset sýnt/utanlengthM, enginn loftlínuakstur. Stable `holmavik` ID og gamla places-hnit óbreytt fyrir aðra neytendur.
- Raunkeðja um61 frá Ísafirði, Súðavíkurhlíð/Súðavík og firðina íDjúpi yfir Steingrímsfjarðarheiði aðHólmavík. Rétt síðasta bæjargrein (t.d.67 ef geometry styður) heimil ef þarf fyrir owner-aðkomu; ekki gera öll non61veg-númer aðblindum bannlista. Endanleg keðja/sourceId/veg-eigindir mæld offline áður en fest. Enginn suðurkrókur um60/608/F66 eða Þröskulda/68 í staðDjúpstofns. Engin ferð norður íBolungarvík/Eyrarhlíð eða út íDrangsnes/Strandir sem millistöð aðHólmavík. Ferjur/bátar utan umfangs.
- IdButur aðeins úr VALINNI geometry; varðveita nauðsynlega ferla samaIdButur og ferðarröð. Tilvist ID í708-skrá eða nálægð við stað er ekki staðfest notkun. Engin candidate→roadConditionIds/live-færð/#503. Via úr raunverulegri keðju/heitum, ekki allaCSVstaði semmillistöðvar.
- Nota bókstafleg samskeyti fyrst. Ef gat finnst eða literal-net finnur rangt „velheppnað“ svar: sýna nákvæm sourceId/hnit/veg-val og minnsta nauðsynlega lausn áður en nýir connectorar bætast við. Fyrri5mmconnector−4er ekki almenn snapping-heimild og ekki á þessari leið nema raunkeðja sanni það. Ekkert global epsilon, engin silent heuristic eða ný landsöflun.

## Stefna og lokaskilyrði

Allar raunlínur/VEGHLUTI athugaðar; venjuleg tvístefnuMVPforsenda áfram, hringtorg/aðskild akbraut á aðkomu ekki falin. Þekkti3834hringbogi39,18m er samþykkt sýnilegt MVP-vafaatriði úr fyrri lotu ef hann kemur fyrir, en skrá nákvæmlega á hvaða nýju átt hann er öfugur; ekki gera ráð fyrir því óprófað. Fyrri heimild nær ekki sjálfkrafa nýjum hringstefnufrávikum áHólmavíkurenda; sýna afmarkað val ef slíkt kemur íljós, ekki krefjast opinberrar staðfestingar eða breyta core sjálfvirkt.

Raunhandler báðar áttir: réttir endar, samfelld hnitaruna, sourceId/slices/átt og metralengd sjálfstætt endursummuð, stable geometryId/regionVersion,0tvítalin raunbrún. Focused próf festir réttaDjúp/Steingrímsfjarðarheiðar-keðju, ekki eingöngu heildarlengd. Eitt neikvætt próf með raunhæfri brotinni keðju/afleggjara sýnir að leið sem tekur annan fjallveg eða ranganfirði er ekki samþykkt stofnleið. Ný óstudda leið skal ekki kynna sem allparavirkni.

FyrriFlókalundur↔Ísafjörður, Búðardalur↔Flókalundur, entry, hringvalkostir,veg93 ogsame_place óbreytt með focused regressions. `holmavik`/`isafjordur` með öðru staðapari heldur eldri samningi; ekki útvíkka automatically allar samsetningar. Eitt tier íkalli, docs ekki runtime, existing server_data includeFiles.

Eitt task-local map-view.html sýnir báðar áttir umDjúp/Steingrímsfjarðarheiði, source-enda, owner-punkta og raun-greinipunkta fyrir áframhald (61/Þröskuldar/68/Strandir eftir legu) semframtíðarleiðir, ekki staðfestar færðartengingar. Nafnið Ísafjörður íDjúpi ekki bæjarmiðjupinni. Endurnýta map/transform, nýtt laust127.0.0.1-port, aðeins task-mappa, fyrri8765–8772ótrufluð, canonical OSM/Referer/attribution. Sjónrænt PASS aðeins ef skoðað, annars virkur hlekkur til eiganda.

Keyra focused nýsvæðis/API/core og viðeigandi fyrri regressions, lint snertumJS oggit diff --check; ekki fullsuite/build/mutation/fuzz nema sýnd ástæða. Stutt cc-report með raunlengdum/sourcekeðju/IdButur, greinavali, forsendum/prófum/kortahlekk. Ekkert UI/livefærð/veður/cache/pricing/scoring/dependencies/önnur ticket; engin ný netöflun/skilaboð/commit/push/deploy/GitHub. drivingAccess UNVERIFIED, tier0planar lengthNote,enginETA/öryggisfullyrðing/sjálfvirk hjáleið.

CC READY_FOR_CC→CC_IN_PROGRESS→CC_COMPLETE, Jonesy review, Ripley lokamat ogeigandakortasamþykki. Þegar eina parið/focused próf/kort tilbúin, stoppa.68tilHringvegar/Þröskuldar/Bolungarvík/Suðurfirðir ogaðrir afleggjarar síðar íplaninu, ekki ný landslota. Blocker sýnir ranga/ónothæfa raunleið eðaumfangsbrot, ekki valfrjálsa útgáfuherðingu.


---

## Jonesy review — umferð 1 (2026-11-19)

**Niðurstaða: PROMPT_REVIEW — samþykkjanlegt með bindandi P1–P9. Engin gagnagat og engin connector þörf** (öll 25 samskeyti keðjunnar eru bókstafleg). Hættan er önnur en síðast: (a) **„Djúpvegur: Ísafjörður“ er fjörðurinn innst í Djúpi, ekki bærinn** — nafnalíking í `via` eða merkjum væri röng (P5); (b) ef **einn** bútur vantar í svæðisskrá velur kjarninn án villu 608/Þröskulda-krók (+45,7 km) eða F66-krók (+5,4 km) — P6; (c) Hólmavíkurendinn er **stubbur á vegi 67**, ekki 61 (P3).

### Merking: sandbox vs CC

- **Sandbox (mitt, Linux):** allar 1564 tier-0 línur pakkans umreiknaðar með pyproj í EPSG:3057 (4 aukastafir), raunverulegur `composeGeometryPath` úr svæðislotum CC (ekki nýr handler; hann er ekki til enn), raunhandler núverandi lotu til að staðfesta óbreytta samninga. Allar tölur eru **mínar**, viðmið ±0,05 m, ekki fyrirskipuð geometryId.
- **CC-fullyrt:** ekkert enn.

### Sandbox-niðurstöður

1. **Bókstafleg keðja Ísafjörður → Hólmavík** (25 samskeyti athuguð í WGS84 með `==`, **0 gat**): 3834[5→0] (61, 906120037) → 3833 → 3830 (906120037) → 3392 + 3298 + 3535 (Súðavíkurhlíð, 906140037; 3535 er `Súðavík: Höfðabrekka–Grundarstræti`) → 3627 + 3629 + 3609 + 3244 + 3218 + 3217 (Súðavík–Hjallar/„Reykjanes–Súðavík“, 906150037) → 3216 + 3220 + 3194 (Hjallar–Skálavík, 906160037) → 3148 (Vatnsfjarðarháls, 906170037) → 3195 + 3626 + 3605 + 3419 („Djúpvegur: Ísafjörður“, 907070037) → 3418 + 3415 + 53466 (Steingrímsfjarðarheiði, 907050037) → 3370 (Staðardalur, 761220037) → 3347 (Hólmavík–Strandavegur, 907040037) → **3883[0→3] (vegur 67 Hólmavíkurvegur, 907040037)**. Allt vegnr 61 nema 3883 = 67; **VEGHLUTI 1 á öllum 26 bútum.**
2. **Raunkjarni, báðar áttir:** ÍSA(3834 hnútur 5) → HÓL(3883 hnútur 3) = **223 136,9897 m, 26 slices**, `geometry_only`; öfugt sama lengd, sama sourceId-röð öfug; **0 tvítalin brún**. Kjarninn velur þetta sjálfur án afmörkunar.
3. **Slice-lengdir (m):** 3834[5→0] 870,1 · 3833 2 260,3 · 3830 1 633,2 · 3392 6 296,4 · 3298 8 453,3 · 3535 1 742,4 · 3627 9 526,6 · 3629 13 567,2 · 3609 13 410,7 · 3244 13 820,1 · 3218 11 745,7 · 3217 13 682,8 · 3216 13 782,6 · 3220 13 136,3 · 3194 1 785,4 · 3148 4 578,3 · 3195 4 518,7 · 3626 15 611,3 · 3605 13 542,1 · 3419 11 405,6 · 3418 19 387,6 · 3415 5 960,2 · 53466 2 244,5 · 3370 9 980,3 · 3347 9 677,8 · 3883[0→3] 517,4.
4. **IdButur (9, ferðarröð):** `906120037, 906140037, 906150037, 906160037, 906170037, 907070037, 907050037, 761220037, 907040037`; öll til í CSV-708 (líka útilokuðu). **Varúð:** IdButur `907070037` („Djúpvegur: Ísafjörður“) nær yfir línur 3195/3626/3605/3419 (á leið) **og 2086 (vegur 634, ekki á leið)**; `906120037` nær yfir 3830/3833/3834 (á leið) og 3829 (631), 25602, 25603 (ekki á leið). Útilokun verður því að vera á **sourceId**, ekki IdButur.
5. **Hólmavíkurendinn:** owner (65.705/−21.680) → EPSG:3057 (376 949,4518; 581 209,9119). Næsti punktur á öllum 1564 línum = **3883 hnútur 3 (376 742,4202; 580 824,7021; z 0), 437,32 m** (CSV tillaga 1 = 907040037, 436 m; ekki „staðfest 436 m aðkoma“, bara næsta lína). **Núverandi `places.json`-hnit Hólmavíkur (65.70147/−21.68415) er nákvæmlega sá sami hnútur (0,0 m)**, öfugt við Ísafjörð. 3883 er **4 hnúta stubbur** á vegi 67 (KAFLANR 01, „Hólmavíkurvegur“), enginn önnur lína deilir hnút 3. Næstu aðrar: 3347 (61) 676 m, 3611 (61, 707040037 Hrófá–Hólmavík) 799 m.
6. **Vegamót 61/67 (J):** 3347 hnútur 0 = 3611 endi = 3883 hnútur 0 = (376 234,0238; 580 853,0576; z 23,2108), 799,5 m frá owner. Leið til J: 222 619,567 m (25 slices, án 3883). **IdButur er sá sami hvort sem endinn er á 3883 hnút 3 eða J** (3347 og 3883 eru bæði 907040037), þ.e. IdButur-listinn greinir ekki endapunktinn — slice-röð/hnit þurfa að gera það.
7. **Neikvæð tilvik (kjarninn svarar án villu):**
   - án **3415** (eða 3347 eða 3370 — hver sem er af þeim): **268 841,202 m, 30 slices** (+45,7 km) um 3418→**2321/2322 (608)→3718→3750/3754 (60)→3321/3324 (61 Þröskuldar)→3611→3883**; IdButur 906120037, 906140037, 906150037, 906160037, 906170037, 907070037, 907050037, **907060037, 560800037, 905130037, 905110037, 907000037, 707040037**, 907040037.
   - án **3626**: **228 544,395 m, 31 slices** (+5,4 km) um 3835/60 → Dýrafjarðargöng → 3648 → 3868…3672 → **2077 (F66 Kollafjarðarheiði)** → 3605.
   - án 3418 eða 3605 eða báðum 3418+3415: `disconnected_graph` (engin ósvífin krókur).
8. **Greinipunktar á keðjunni** (aðrar línur deila hnút): 3834 v2–v7 hringtorg 25602/25603; 3834 v12 → 3846 Eyrarhlíð (61, Bolungarvík); 3833 v0/3830 v8 → 3835 (60 Vestfjarðagöng); 3830 v0/3392 v14 → 3829 (631); 3220 v0/3194 v12 → 2038 (633 Mjóifjörður); 3148 v1/v28 → 2087 (633 Vatnsfjarðarnes); 3195 v0/3626 v58 → 2086 (634); **3605 v8 → 2077 (F66 Kollafjarðarheiði)**; 3419 v0/3418 v94 → 2977 (635 Skjaldfönn); **3418 v0/3415 v23 → 2321 (608 Þorskafjarðarheiði)**; 3370 v0/3347 v56 → 3890 (643 Drangsnes); **3347 v0/3883 v0 → 3611 (61 til Hrófá/Þröskulda/68)**.
9. **Hringtorg/stefna:** eina hringtorgið er 3834 hnútar 2–4 (= 25602, 39,18 m). Nú fer leiðin ÍSA→HÓL bogann **á móti stefnu** (3834[5→0], eins og ÍSA→FLK síðast, ~+23 m); HÓL→ÍSA fylgir stefnu. Engin ný hringtorg/aðskildar akbrautir (VEGHLUTI 1 alls staðar, líka 3883).
10. **Núverandi API (raunhandler síðustu lotu):** `isafjordur↔holmavik`, `holmavik` með budardalur/hella/Rauðavatn/holmavik → `200 unsupported endpoint_mapping_unavailable`; `holmavik↔flokalundur` → 400 `unknown_place_id`. Þetta á að haldast fyrir allt nema parið.

### Bindandi atriði (P1–P9)

**P1 — Keðjan fest sem raðaðir sourceIds, bókstafleg.**
Próf á raunsvari báðar áttir: sourceId-röð `3834[5→0], 3833, 3830, 3392, 3298, 3535, 3627, 3629, 3609, 3244, 3218, 3217, 3216, 3220, 3194, 3148, 3195, 3626, 3605, 3419, 3418, 3415, 53466, 3370, 3347, 3883[0→3]` (öfugt öfugt); vegnr "61" nema 3883 = "67"; VEGHLUTI 1 alls staðar; **engin connector, engin snapping** (öll samskeyti bókstafleg; finnist gat: STOP með sourceId/hnit). Viðmið **223 136,99 m ±0,05**, 26 slices, 0 tvítalin brún, hnitakeðja = `lengthM`, sama lengd öfugt.

**P2 — Ísafjarðarendi.**
Sami orðrétti hnútur 5 á 3834 (313 430,1109; 625 946,2219; z 0) og í `westfjords-region-flokalundur-isafjordur.json` (x/y/z eins; sjálfstætt afrit, ekki runtime-deiling); 3834 óbreytt (13 hnútar). Sneið 3834[5→0] = 870,1 m. **Skörun við Flókalundarleggina er heimil** (3833 og 3834[0→5] eru sameiginleg aðkoma, 3 130,4 m); engin sourceId-uniqueness-regla milli para. Ekkert innskot, ekki 3834 endi/`places.json`-punktur Ísafjarðar.

**P3 — Hólmavíkurendi.**
Endapunktur = **núverandi hnútur 3 á 3883** (376 742,4202; 580 824,7021; z 0), **frávik 437,32 m** frá owner-punkti (skráð sér, utan `lengthM`, `accessApproach.ownerCoordinateOffsetM`); enginn innskotshnútur. Lokasneið **3883[0→3] = 517,4 m, vegnr 67, VEGHLUTI 1** er heimil „bæjargrein“ (3883 er stubbur, ekki leið til Drangsness; engin lína á eftir). **Ekki** vegamótin J (3347 v0) sem endi (222 619,567 m, 799,5 m frá owner), ekki 3611/707040037 (Hrófá–Hólmavík), ekki innskotshnútur á 3347. Skrá í skýrslu: sami hnútur og núverandi `places.json`-hnit `holmavik` (0,0 m) — `places.json` byte-eins, ekki breytt. Þar sem IdButur-listi greinir ekki J frá 3883-enda (lið 6) skal próf festa **sourceId/slice-röð og endahnit**, ekki bara IdButur.

**P4 — IdButur úr völdum slices, ferðarröð, aðeins:**
`906120037, 906140037, 906150037, 906160037, 906170037, 907070037, 907050037, 761220037, 907040037` (öfugt öfugt, sameinað aðeins þegar samliggjandi gildi eru jöfn). **Ekki með:** 906130037 (Eyrarhlíð), 806110037 (60 Tungudalur), 906180037/906190037 (633), 907080037 (635), 907060037 (608), 906520037 (F66), 907100037/907120037 (643/645), 907000037 (Þröskuldar), **707040037** (tillaga 2), 907030037 (68). IdButur-tilvist í 708-skrá eða nálægð er ekki staðfest notkun; candidates aldrei `roadConditionIds`; engin #503-tenging.

**P5 — Nöfn og `via` (Ísafjörður bær vs fjörður).**
Línuheitin „Djúpvegur: Ísafjörður“ (3195, 3626, 3605, 3419; IdButur 907070037) eru **fjörðurinn innst í Djúpi**, ekki bærinn. `via`/merki mega **ekki** leiða „Ísafjörður“ af þessum heitum (substring-passun á „Ísafjörður“ er röng). `via` úr raunheitum sem velja viljandi t.d. Súðavík (3535 „Súðavík: …“/„Súðavíkurhlíð“), Steingrímsfjarðarheiði; ekki öllum CSV-stöðum sem millistöðvum. Próf: `via` inniheldur ekki „Ísafjörður“. Á korti: engin bæjarmiðjupinni á firðinum.

**P6 — Neikvætt próf = „Djúpkeðja nauðsynleg“.**
Eitt raunverulegt neikvætt próf á **fullri landsfitju** (þrönga skráin aftengist bara): sama gagnasafn **án 3415** fellir P1-keðjuprófið — kjarninn velur þá 608/60/Þröskulda-krókinn, **268 841,20 m, 30 slices**, með IdButur 907060037, 560800037, 905130037, 905110037, 907000037, 707040037. Valfrjáls annað próf: án 3626 → 228 544,40 m um F66 (2077) og Dýrafjarðargöng. Auk þess í jákvæðu svari: **engin** slice með vegnr ∈ {60, 62, 63, 631, 633, 634, 635, 608, 643, 645, 68, F66} og **engin** sourceId ∈ {2077, 2321, 2322, 3718, 3750, 3754, 3321, 3324, 3611, 2690, 2086, 2038, 2087, 2977, 3890, 3185, 3829, 3846, 3835, 25602, 25603}. Ekki bara lengdarpróf.

**P7 — Hringtorg og stefna (sýnilegt vafaatriði, ekki blocker).**
Skrá nákvæmlega: ÍSA→HÓL fer 3834[2→4]-bogann (39,18 m) á móti stefnu línunnar (rétt umferðarstefna væri 62,45 m, ~+23 m); HÓL→ÍSA fylgir. Í `lengthNote` báðar áttir (eins og síðast). Engin ný stefnufrávik (VEGHLUTI 1 alls staðar). Engin `directed` policy-regla, engin ný lína/hnútar.

**P8 — API og gagnaskrá.**
Nýtt par `isafjordur`↔`holmavik` í nýrri sjálfstæðri svæðisskrá (26 línur, ein tier 0, ný `regionVersion`), grein **á undan** almennu hliðinu en eftir/óháð fyrri greinum. **Óbreytt, bókstaflegt í prófi:** `flokalundur↔isafjordur` 87 618,5483 m / 18 slices / `8b97e2e4…` (öfugt `0eebee66…`) / `06fca99f…`; `flokalundur↔budardalur` 172 474,2228 m / `9d3e8ed9…` / `751dbdae…` / `2f68aa48…`; `junction-1-60-baulan↔budardalur` 42 155,2028 m / `742bbdeda4fa…`; Rauðavatn/Selfoss/Hella/Egilsstaðir og `same_place`. **`holmavik` með öðru en `isafjordur`** og **`isafjordur` með öðru en `flokalundur`/`holmavik`** → núverandi svar (`200 unsupported endpoint_mapping_unavailable`; `holmavik↔flokalundur` 400). Fyrri svæðisskrár/loaders/`places.json`/kjarni byte-eins; `vercel.json` óbreytt.

**P9 — Kort og mörk.**
Eitt task-local `map-view.html` (báðar áttir): leiðin, endapunktar (3834 hnútur 5, 3883 hnútur 3), owner-punktar aðskildir, `places.json`-punktar sér (Ísafjörður notaður ekki; Hólmavík = endinn), hringtorg 25602, og greinipunktar úr lið 8 (a.m.k. 608 Þorskafjarðarheiði, F66 Kollafjarðarheiði, 635 Skjaldfönn, 633 ×2, 634, 643 Drangsnes, **61/Hrófá–Þröskuldar–68 við J**, 60 Vestfjarðagöng, Eyrarhlíð) merktir „possible future connection, not confirmed“. Nýtt laust port (t.d. **8773**; ekki 8765–8772), canonical OSM/referrer/attribution, kortatolerance ≤0,056 m. **Ekkert sjónrænt PASS frá CC** nema skoðað. Stoppa þegar parið, focused próf og kort virka: ekki 68/Þröskuldar/Drangsnes/Bolungarvík/Suðurfirðir, engin ferja. `drivingAccess: UNVERIFIED`, tier-0 planar `lengthNote`, engin ETA.

### Valfrjálst (ekki blockerar)

- **S1:** Eitt próf sem ber **alla hnúta** svæðisskrárinnar saman við hrátt GeoJSON (umreiknað) lokar festingareyðunni sem fannst síðast (innri hnit lína féllu ekki próf).
- **S2 (skipulag síðar):** Samsetning Flókalundur→Hólmavík **í gegnum Ísafjörð** (87 618,5 + 223 137,0 = 310 755,5 m) tvítalar 3833 og 3834[0→5]; bein samsetning í einu kalli á landsfitju velur F66-leið **140 925,8 m**. Þetta snertir ekki þetta par, en framtíðarleiðir mega ekki treysta á sourceId-uniqueness né á að kjarninn velji Ísafjörð sem millistöð.
- **S3:** Steingrímsfjarðarheiði/Djúp eru í raun vetrarerfið (almenn þekking mín, ekki úr gögnum); MVP-forsendur um venjulegan tvístefnuveg standa (data: VEGHLUTI 1) — ekki blocker.

### Mörk þessarar yfirferðar

- Enginn kóði CC til að skoða; raunhandler nýja parsins ekki keyrður (er ekki til). Tölur úr **mínum** pyproj-umreikningi af pakka-GeoJSON, ±0,05 m. Ekkert keyrt á Windows-vél eiganda.
- Owner-hnit eru MVP-forsenda; 437 m frávik á Hólmavík er næsta lína í gögnum, ekki staðfest akstursaðkoma. Umferð 2 aðeins ef eigandi biður um hana.

### Næsta skref

Ripley skrifar `approved-prompt-v1.md` með P1–P9 og setur CURRENT á READY_FOR_CC; eigandi segir „Prompt approved“ við CC.

# #501 Flókalundur ↔ Patreksfjörður — approved prompt v1 — 2026-11-20

Jonesy „samþykkjanlegt með bindandi P1–P10“ afgreitt APPROVED með atriðunum innfelldum. P1–P10 eru afrituð óbreytt neðar og ganga framar Round1 þar sem nákvæmari. CC setur CURRENT CC_IN_PROGRESS áður en framkvæmd hefst og CC_COMPLETE með skýrslu/report-path eftir.

**Sérstakt framkvæmdarumfang sem eigandi samþykkir með „Prompt approved“:** nákvæmlega ein sýnileg estimated connector-lína sourceId−5,2271END→53127START, um4.3932m og mest5m, samkvæmtP2; engin hliðrun upprunahnita eða snapping. Hún er áætluð tenging í geometry, ekki staðfestur akvegur. estimatedConnectorLengthM og estimated:true ásamt lengthNote/kortamerki gera bilið sýnilegt. Engin önnur connector-heimild. Eitt endpoint-innskot á53127 samkvæmtP3,3648 orðrétt afrit samkvæmtP4.

Tölur Jonesy eru sandbox-viðmið, CC mælir sjálft áður en niðurstaða/full hash er fest; ±0.05m lengdarvikmörk. P7 neikvæð próf eru græn próf á þegar varðveittri fullri tier0-fitju, ekki ný runtime-landsvíkkun eða viljandi rauð keyrsla. Via nákvæmlega Brjánslækur/Kleifaheiði, engin ferja. Valfrjáls herðing S1–S3/samsetning ekki með.

Þröng túlkun gagnagats: „engin önnur lína innan80m“ merkir engin áður ógreind tengilína/akbraut sem leysir bilið. Þekkt3361START deilir2271END og er veg63-grein samkvæmt sama prompti; hún veldur ekki ein og sér STOP. Ef nýtt tengisamhengi/óvæntur stefnuvafi finnst: STOP samkvæmtRound1/P2. Vegnr/VEGHLUTI kröfurP1/P8 eiga við raunWFS-línur; connector er estimated sérlína með nullIdButur, ekki tilbúin WFS-sönnun.

P9 utan nýja parsins varðveitir fyrri API-hlið nákvæmlega: patreksfjordur með þekktum venjulegumID gefur200unsupported, en pör með óþekktum/sérstökumjunction-ID halda fyrra400svari. Ekki víkka almenna allowlist eða breyta samningum til að láta almennan P9-texta ná yfir óleyfðID.

Eigandi skoðar kort eftir tæknilegt lokamat; ekkert sjónrænt PASS án raunverulegrar skoðunar. Þegar par/focusedpróf/kort virka, stoppa. Engin commit/push/deploy/GitHub.

# #501 — Flókalundur ↔ Patreksfjörður um veg 62 — MVP

## Samþykkt Round1 — 2026-11-20

Eigandi heimilaði áframhald eftir tillögu um Suðurfirði, fyrst Flókalundur↔Patreksfjörður. Þessi lota er eitt par báðar áttir, focused próf og kort, ekki allir Suðurfirðir. Round1 samþykkt með P1–P10 hér neðar. Framkvæmd aðeins eftir eiganda „Prompt approved“ og CURRENT READY_FOR_CC.

## Heimildir og undirbúningur

Lesa AGENTS/CLAUDE/README/CURRENT; fyrri Flókalundar- og Ísafjarðalotur, síðustu veg68/Þröskuldalotur og geometryComposition/tier0-adapter/loader/API/kort-mynstur. Lesa báða owner-packages-2026-11-19 pakka með source-note/manifest, project/164-staðaCSV og Vestfirdir-Hringvegur.png ásamt ID-CSV/GeoJSON/heimildum. UpprunaCSV er nýr MVP-vörugrunnur, ekki krafa um alla164 í þessari lotu. Owner-hnit duga fyrir MVP, engin ný nákvæmnis-/landsrannsókn. Kortteikning er leiðarsamhengi, ekki geometry-sönnun. Nálægðartillögur ekki færðarsönnun.

Ripley read-only athugun á retained GeoJSON, engin netöflun:

- Geymd veg62-keðja **3698 → 3339 → 3334 → 3332 → 2271 → 53127**; fyrstu fimm samsvara Flókalundur–Brjánslækur–Kleifaheiði–Raknadalshlíð, síðasta Patreksfjörður. Allar VEGHLUTI1/tier0. IdButur röð **905180037,905190037,905200037,905250037,562070037** (3339/3334 sameina aðeins í ID-lista).
- 3698 START WGS84[-23.17046039,65.57614379] =3648END =3009START, raun60/62vegamót. Núverandi Flókalundarendi er samþykktur innskotshnútur á3648, rétt austan þess; hann er ekki junction og skal endurnýttur óbreyttur.
- 2271END[-23.97171688,65.58993261] =3361START (veg63/Miklidalur). **53127START[-23.97181157,65.58993681] er annar punktur, um4.4m frá** samkvæmt grófri XY-athugun (ekki native-mæling). Engin önnur retained lína sást innan65m í þessari afmörkuðu athugun. Ekki kalla þetta bókstaflegt samskeyti eða nota almennt epsilon.
- Owner-Patreksfjörður65.597/-23.994, owner-Flókalundur65.576/-23.163. Fyrri Flókalundarendi/offset51.300364468m í westfjords-region-budardalur-flokalundur.json er samþykktur grunnur. Runtime-places Patreksfjörður er ekki sjálfkrafa rétt owner-aðkoma þessarar lotu.

## Framkvæmd eftir samþykki

1. Nýtt nákvæmlega par `flokalundur`↔`patreksfjordur`, sjálfstæð svæðisruntimeJSON/loader og lítil API-grein fyrir almenna known-ID-hliðið samkvæmt fyrri mynstri. Engin önnur ný pör, engin víkkun á almennum known-ID-lista. Fyrri branches/gögn/loaders/regionVersions/geometryIds/vercel/kjarni óbreytt.
2. Frá samþykktum Flókalundarhnúti á3648 að60/62vegamótum, síðan3698,3339,3334,3332,2271 og53127 að bæjaraðkomu Patreksfjarðar. Nota literal samskeyti þar sem þau eru til. Endurnýta alla3648 orðrétt úr samþykktu fyrri svæðisskránni, sjálfstætt afrit; sneið aðeins réttan hluta frá núverandi Flókalundarhnúti tilenda. Ekki byrja á junction í staðFlókalundar eða velja60/Dynjandisheiði/63/Suðurfjarðakrók.
3. Patreksfjarðarendi: staðbundin vörpun owner-punkts á raun53127, með sömu afmörkuðu projection/innskotsaðferð og samþykktum fyrri lotum. Fyrst staðfesta að þessi lína sé rétt bæjaraðkoma með retained geometry/nafnasamhengi, ekki candidate-fjarlægð einni. Ef vörpun er við núverandi hnút nota hann, annars eitt skýrt innskot á réttu segmenti. Varðveita sourceId/IdButur, geymda röð og alla aðra hnúta. Offset owner→routeendi skráð sér/utanlengthM, ekki loftlínuakstur. Gömlu places.json hnit/ID óbreytt fyrir aðra neytendur. Ef owner-staður bindst ekki þessari bæjarlínu, STOP með nákvæmri lágmarkstillögu.
4. **Sýnt gagnagat og tillaga háð framkvæmdarsamþykki:** mæla2271END→53127START í EPSG3057 og skoða skýrt source-/aðkomusamhengi. Tillagan að lágmarks-MVP er ein afmörkuð sýnileg ESTIMATED connector-lína milli þessara tveggja upprunalegu enda, nýtt reserved negative sourceId án árekstra, idbutur:null og sérstök evidenceRef; engin breyting upprunahnita, ekkert global snapping. Aðeins þetta tiltekna bil, ≤5m, og aðeins ef staðbundin athugun styður sama veg62-aðkomusamhengi. Lengd connectors með ígeometry/lengthM og birt sem óstaðfest gögn/estimated, ekki WFS/staðfest akstursaðgengi. Bil>5m, ný grein/akbrautar-/stefnuvafi eða önnur göt => STOP áður en ný lausn er bætt við. Jonesy meti þessa nákvæmu tillögu; approved-prompt og eiganda „Prompt approved“ þurfa að ná sérstaklega yfir hana áður en framkvæmd hefst. Engin uppspunnin akstursheimild.
5. Offline WGS84→EPSG3057 með fyrirliggjandi tier0-aðferð, source-hash/tier/CRS/IDFERILL/IdButur/VEGHLUTI/z varðveitt. Fyrri3648innskot og nýtt53127innskot afmörkuð. Raunhandler báðar áttir: rétt sourceId/slice-röð þar á meðal eina estimatedconnectorinn ef samþykktur, full millilínur, réttar endpoints/directions; samfelld hnitaruna,0tvítalin raunbrún, hnit-/slice-summa=lengthM, sama lengd öfugt. CC mælir/festir sjálft raunlengd/fullgeometryId/regionVersion/offset/connectorlengd. Ekki finna upp viðmið.
6. IdButur úr völdum slices í ferðarröð:3648búturinn905170037 ef raunnotaður, síðan905180037,905190037,905200037,905250037,562070037; öfugt öfugt, connectornull sleppt, samliggjandi samaID aðeins sameinað í ID-lista. Ekki útiloka3361/veg63 með IdButur-nálægð heldur sourceId/slices. Engin candidate→roadConditionIds/livefærð/#503. Via raunveruleg leiðarheiti/tengingar t.d.Brjánslækur/Kleifaheiði eftir heimildum, ekki ferja tilFlateyjar eða allirCSVstaðir sem millistöðvar.
7. Focused próf á nýju pari, literalupprunahnútum/leyfðum innskotum, skýrum estimatedconnector og réttum endum. Eitt neikvætt próf fjarlægir connectorinn: leið má ekki halda áfram með silent snapping. Auk þess eitt retained-full-net próf (núverandi1564fitja offline, samkvæmt fyrra mynstri) fjarlægir miðlínu á62 og sýnir að alternate route, ef til er, uppfyllir ekki samþykkta62keðju; ef aftengist skrá raunástæðu. Keyra fyrst og festa raunútkomu, ekki giska á hjáleið. Engin ný öflun/runtime-landsvíkkun/mutation/fuzz.
8. Athuga allar raunVEGHLUTI/aðkomustefnu; nýr hring-/aðskildra-akbrauta-vafi ekki falinn í almennri tvístefnuMVP-forsendu eða connector. Fyrri3834Ísafjarðarhringbogi á ekki við. `drivingAccess: UNVERIFIED`, tier0planarlengd/estimated-gap fyrirvari, enginETA/turn-by-turn/færðar-/öryggis-/heilsársfullyrðing. Ferja utanumfangs, vegurinn hjáBrjánslæk aðgreindur frá ferjuferð.
9. Regressions á fyrri sex Vestfjarðapörum, Hringvegsvalkostum/veg93/same_place og unsupported/400-samningum. `flokalundur`/`patreksfjordur` með öðru en samþykktu parslýsingunum haldi fyrra svari; ekki opnaallpairs eða breyta almenna hliðinu. Ekki sameina sjálfkrafa Flókalundur→Patreksfjörður við fyrri ferðaleggi.

## Kort og skil

Task-local map-view.html/build-map-data: báðar áttir, réttar endpoints/owner-punktar/offsets, 60/62junction aðgreint fráFlókalundarenda, nýja innskotið á53127 og estimatedconnectorinn stækkanlegur/sérmerktur með mældri lengd. Raungrein63 við2271END og aðrar viðeigandi retained greinar á valinni keðju merktar „possible future connection, not confirmed“, engir nýir áfangastaðir/ferjuleggir. CanonicalOSM/referrer/attribution og fyrirliggjandi transform/map-tolerance≤0.056m. Nýtt laustlocalhostport t.d.8776, eldri8765–8775ótrufluð, aðeins task-mappa. Virkur hlekkur eða hreinskilin tæknitakmörkun, ekki sjónræntPASS án skoðunar. Eigandi samþykkir kort eftir tæknilegt lokamat.

Afhenda nýruntimeJSON/loader/litlaAPI-grein/próf og task-localbuild/kort/cc-report.md með rauntölum/sourcekeðju/endavali/estimated-gap/forsendum. Focusednýsvæðis/API/core og fyrri regressions, lint snertumJS, diff-check; ekki fullsuite/build/mutation nema sýnd ástæða. CC fylgir README READY_FOR_CC→CC_IN_PROGRESS→CC_COMPLETE með reportpath; Jonesy review/Ripley lokamat/eigandakortasamþykki.

Engin ný net-/landsöflun, UI/veður/livefærð/cache/scoring/pricing/dependency/core-arkitektúr, Tálknafjarðar-/Bíldudals-/Látrabjargs-/Rauðasandsleiðir, ferja, commit/push/deploy/GitHub eða sjálfvirk næsta lota. Sýnt gap/stefnuvandamál utan þessa eina connector/samþykktu innskota krefst eigandaákvörðunar áður en víkkað er. Þegar par/focusedpróf/kort virka, stoppa. Valfrjáls herðing tefur ekki MVP.



## Bindandi Jonesy P1–P10 (óbreytt afrit)

**P1 — Keðjan og lengd fest, báðar áttir.**
Próf á raunsvari báðar áttir: sourceId-röð `3648[50→53], 3698[0→22], 3339[0→53], 3334[0→49], 3332[0→69], 2271[0→59], −5[0→1], 53127[0→7]` (öfugt öfugt, `from=flokalundur`: allar `forward`, `from=patreksfjordur`: allar `reverse`); vegnr „60“ á 3648 og „62“ á hinum; VEGHLUTI 1; slice-lengdir eins og í lið 3. Viðmið **61 400,10 m ±0,05** (mín 61 400,09896512219), 8 slices, 0 tvítalin raunbrún, hnitakeðja = `lengthM`, sama lengd öfugt. **CC mælir sjálft** og ber saman; frávik > 0,05 m = STOP. Engin önnur snapping, engin önnur connector.

**P2 — Eini estimated connector (samþykktur).**
`sourceId: −5` (laust; −1…−3 pilot, −4 Búðardalur–Flókalundur), `idbutur: null`, `tier: 0`, tvö hnit = **bókstafleg afrit** af 2271 END og 53127 START (x/y óbreytt, **z 0 afritað af endahnútunum, ekki null** — loku F1 frá fyrri lotum), `evidenceRef` t.d. `pilot-connector:estimated-westfjords-2271-53127`. Lengd (mæld af CC, mín 4,3932 m) með í `lengthM`; **`estimatedConnectorLengthM` í svari (≈4,39) og slice merkt `estimated:true`**; `lengthNote` segir að 4,39 m bil sé brúað með áætlaðri línu, ekki staðfest. Ekki `snapping`, ekki global epsilon, engin breyting á upprunahnitum. Próf festir: connector nákvæmlega ein, bilið ≤5 m, tvö hnit = endahnútar upprunalínanna (og **0 `z:null`** í `coordinates`).

**P3 — Patreksfjarðarendi.**
Eitt innskot á **53127 milli hnúta 6 og 7** við t = 0,46778779 (269 924,767312771; 575 660,3516744102; z 0; ±1e-6 m), ný vísitala 7, 53127 með 12 hnúta, aðrir hnútar óbreyttir; `ownerCoordinateOffsetM` = **8,7759 m** (skráð sér, utan `lengthM`); lokasneið `53127[0→7]` = 1 380,24 m. **Ekki** `places.json`-punkturinn (53127 hnútur 0, 1 291 m frá owner) og ekki næsti hnútur (56,3 m). `places.json` byte-eins; 53127 staðfest sem bæjaraðkoma með heiti „Patreksfjörður“, IdButur 562070037 (aðeins sú lína), vegnr 62, 8,78 m frá owner — **ekki** nálægð eingöngu.

**P4 — Flókalundarendi og 3648.**
**JSON-eins afrit** af `3648` (54 hnútar, innskot á vísitölu 50) og `flokalundur.insertedNode` úr `westfjords-region-budardalur-flokalundur.json` (`offsetM` 51,30036446804795); sjálfstætt afrit, engin runtime-deiling. 60/62-vegamót (vísitala 53) er **innri hnútur**, ekki endir; 3009/3868 (60, Dynjandisheiði/Bíldudalsvegur) **ekki** í svæðisskrá.

**P5 — IdButur.**
`905170037, 905180037, 905190037, 905200037, 905250037, 562070037`; öfugt öfugt; **útilokun á sourceId**, ekki IdButur: {34245, 3868, 3869, 3651, 3009, 2102, 3361, 2318, 2319, 2997, 34243, 3111, 2088} (aðeins sourceId sem ekki eru á leið). Engin candidate→`roadConditionIds`, engin #503/lifandi færð; connector-null sleppt.

**P6 — Nöfn og `via`.**
Raunheiti: 3698 „Flókalundur-Brjánslækur“, 3339/3334 „Brjánslækur-Siglunesvegur“ (905190037 „Barðastrandarvegur: Brjánslækur - Siglunesvegur“), 3332 „Kleifaheiði“, 2271 „Raknadalshlíð“, 53127 „Patreksfjörður“. **`via` nákvæmlega `["Brjánslækur","Kleifaheiði"]`** (`toEqual`), **ekki** „Siglunesvegur“, „Flókalundur“, „Patreksfjörður“ (endar), „Raknadalshlíð“, „Dynjandisheiði“, „Bíldudalur“, „Tálknafjörður“, „Miklidalur“, „Flatey“/„Baldur“/ferja. Brjánslækur er raunheiti vegarins; **engin ferjufullyrðing** (34245/610 ekki farin).

**P7 — Neikvæð próf (tvö, bæði á FULLU neti).**
(a) **Án connectors** → `unsupported disconnected_graph` og **engin hljóð snapping** (próf fellur ef kjarninn skilar `geometry_only`). (b) **Án 3339** (eða hvaða 62-miðlínu sem er) → kjarninn velur **72 208,40778649 m, 11 slices** um `3648[50→53], 3009[0→39], 2318[66→0], 2319[79→0], 2997[22→0], 34243[13→0], 3111[34→0], 2088[93→0], 3361[53→0], −5[0→1], 53127[0→7]` (60→63→Miklidalur); prófið festir lengd og sourceId-röð og að þetta uppfylli ekki P1. Í jákvæðu svari: **engin** sourceId ∈ {3009, 2318, 2319, 2997, 34243, 3111, 2088, 3361, 3868, 3869, 3651, 34245, 2102} og vegnr aðeins {„60“ (aðeins 3648), „62“}.

**P8 — Stefna/hringtorg/mörk.**
VEGHLUTI 1 alls, engin hringtorg, enginn `directed` policy; tvístefnu-MVP-forsenda óbreytt; **ekki** flytja Ísafjarðarfyrirvarann yfir. `drivingAccess: "UNVERIFIED"`; `lengthNote`: tier-0 planar lengd + áætluð 4,39 m brú; engin ETA/leiðsögn/færðar-/öryggis-/heilsársfullyrðing (Kleifaheiði er fjallvegur — engin fullyrðing um færð); **ferja Baldur/Brjánslækur utan umfangs**; vegurinn um Brjánslæk aðgreindur frá ferjuferð.

**P9 — API, einangrun og regressions.**
Nýtt par `flokalundur`↔`patreksfjordur` í nýrri sjálfstæðri svæðisskrá (7 línur + connector, ein tier 0, ný `regionVersion`), grein **á undan** almennu hliðinu; `flokalundur` bætist **ekki** í `winter-route-places.json`; `patreksfjordur` er þegar í 56-lista. **Óbreytt, bókstaflegt í prófi:** `flokalundur↔isafjordur` 87 618,54830414167 (`8b97e2e4…`/`0eebee66…`, `06fca99f301d1444`); `flokalundur↔budardalur` 172 474,22283601554 (`751dbdae…`/`9d3e8ed9…`, `2f68aa481848357b`); `junction-1-60-baulan↔budardalur` 42 155,20284701861 (`742bbdea…`); `isafjordur↔holmavik` 223 136,98949144362 (`2d47312f…`/`ffe68470…`, `adfc38ce4897744c`); `junction-1-68-stadarskali↔holmavik` 110 073,97484054108 (`124d9ec9…`/`f1933968…`, `c1e9cd24a2aaa02c`); `junction-60-61-throskuldar↔holmavik` 30 555,315457176555 (`e72b5d84…`/`3faa1848…`, `af6b37ce8086a587`); Rauðavatn/Selfoss/Hella, Egilsstaðir↔Seyðisfjörður, veg 93, `same_place`. **`flokalundur` með öðru en `budardalur`/`isafjordur`/`patreksfjordur`** → áfram 400 `unknown_place_id`; **`patreksfjordur` með öðru en `flokalundur`** → áfram `200 unsupported endpoint_mapping_unavailable`; `option` hunsað; engin sjálfvirk samsetning leggja. Kjarni, fyrri loaders/svæðisskrár, `places.json`, `vercel.json` byte-eins.

**P10 — Kort og skil.**
Eitt task-local `map-view.html` (báðar áttir): leiðin, endar (3648 innskot v50, 53127 innskot v7), **60/62-vegamót sér og aðgreind frá Flókalundarenda**, owner-Flókalundur og owner-Patreksfjörður aðskilin með offsetum (51,30 m / 8,78 m), **connectorinn sérmerktur og stækkanlegur með mældri lengd (≈4,39 m)**, `places.json`-punktur Patreksfjarðar (53127 v0) sér og merktur ekki notaður; greinipunktar „possible future connection, not confirmed“: **60 (3698 v0/3009 v0), 610 Brjánslækur (3698 v22), 612 (3332 v69), 63 Miklidalur (2271 END/3361 START)**; engir nýir áfangastaðir/ferjuleggir. Kortatolerance ≤0,056 m; nýtt laust port (t.d. **8776**, ekki 8765–8775); canonical OSM/referrer/attribution. **Ekkert sjónrænt PASS frá CC** nema skoðað. Stoppa þegar parið, focused próf og kort virka: ekki Tálknafjörður/Bíldudalur/Látrabjarg/Rauðisandur, 60/63-leiðir eða samsetning. Enginn commit/push/deploy.

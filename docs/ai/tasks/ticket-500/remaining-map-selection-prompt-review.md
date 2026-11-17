# #500 — Festa27 kortayfirfarna vörupunkta;2 afmörkuð source-göt

## Ripley initial prompt — umferð1, 2026-11-16

Til Jonesy-yfirferðar, ekki keyranlegt enn. Eigandi heimilaði sameiginlega yfirferð allra29 staða sem eftir voru. Ripley hefur gert27 kortaskoðanir með myndsýn og staðbundna gagnaúttekt fyrir hina2. Engin vörugögn breytt. Markmið er **ein gagnalota**, ekki sérstakt prompt/review fyrir hvern stað.

## Grunnur og samþykki

Lesa AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md; east-selection/result-review.md er síðasta PASS-staða. Síðan:

- **docs/ai/tasks/ticket-500/remaining-map-selection/map-review.md**: lýsingar, skoðuð kort og fyrirvarar Ripley.
- **docs/ai/tasks/ticket-500/remaining-map-selection/candidate-review.json**: föst29 outcomes,27 ráðlagðir source-endar með raw-skrá/SHA/OBJECTID/tier/CRS/source-hniti/WGS84/staðarlýsingu/OSM-slóð;2 án kandídats. Þetta er prompt-grunnur, ekki sjálfvirkt eigandaval.
- Núverandi winter-route-places.json og winter-route-approach-selections.json:27/56 með punkt,29null;23 afgreiðslur, allar valdar; enginn routable.
- approachSelections.test.js og hina sex gagnaprófasöfnin, acquisition/samples/raw-*.json, retained ticket-483/samples/wfs-vegnr1-all.json og ticket-493-place-network/samples/road-links.csv eftir source-vísum.

Jonesy metur gagnabreytingu/source-rekjanleika; kortaskoðun er Ripley-eignuð heimild. CC þarf ekki vafra, myndsýn eða nýtt net. Eftir Jonesy APPROVED gerir Ripley approved-prompt/READY_FOR_CC; nýtt eiganda „Prompt approved“ til CC heimilar nákvæmlega þessa27 punkta. Engin A/B-vinna fyrir eiganda eða ný punkta-samþykktarlykkja.

## Nákvæmt mengi og val

| Place-ID | Source-stykki / geymdur endi | WGS84: breidd, lengd (námundun8 aukastafir) |
|---|---|---|
| `kopavogur` | 3073 START | 64.10411666, -21.90418005 |
| `hafnarfjordur` | 10287 START | 64.07380373, -21.93959097 |
| `mosfellsbaer` | 2469 END | 64.17602806, -21.67652824 |
| `akranes` | 3797 END | 64.32768822, -22.05256417 |
| `stykkisholmur` | 3466 START | 65.06799806, -22.73935627 |
| `budardalur` | 2769 START | 65.10591772, -21.76505686 |
| `reykholar` | 2662 END | 65.44592572, -22.20532007 |
| `isafjordur` | 3834 END | 66.08035668, -23.12399231 |
| `sudavik` | 3535 START | 66.02459271, -22.99225430 |
| `holmavik` | 3883 END | 65.70146962, -21.68414766 |
| `drangsnes` | 3245 END | 65.69125093, -21.44027942 |
| `hvammstangi` | 3487 START | 65.39804115, -20.94389335 |
| `blonduos` | 2593 END | 65.65634119, -20.28373541 |
| `skagastrond` | 2455 END | 65.82381799, -20.29628289 |
| `dalvik` | 3567 START | 65.96755395, -18.52948806 |
| `husavik` | 3092 START | 66.03234853, -17.34984614 |
| `kopasker` | 8674 START | 66.30152838, -16.44081709 |
| `raufarhofn` | 3169 START | 66.44545468, -15.94764087 |
| `neskaupstadur` | 2832 START | 65.14719331, -13.71556128 |
| `eskifjordur` | 2834 END | 65.07554219, -14.02122438 |
| `djupivogur` | 3761 END | 64.65406062, -14.29799027 |
| `hofn` | 3652 END | 64.27847390, -15.19843537 |
| `skaftafell` | 3513 END | 64.00546696, -16.94397824 |
| `kirkjubaejarklaustur` | 2313 END | 63.79468083, -18.03973357 |
| `thorlakshofn` | 2280 END | 63.86300272, -21.39133110 |
| `fludir` | 3548 START | 64.13080082, -20.32143333 |
| `laugarvatn` | 3252 START | 64.21194753, -20.74278069 |

**Keflavík bær og Þórshöfn eru utan valda mengisins.** Enginn retained source-punktur fannst fyrir þau í núverandi aðfangagrunni. Engin hnit af kortasmelli, nearest endpoint eða KEF-staðgengill; places-færslur þeirra haldast óbreyttar/null. Bæði heiti haldast á56-staða listanum. Sértæk öflun fyrir þau er ekki heimiluð í þessari lotu.

## Minnsta framkvæmd

1. Fyrsta raunpróf: bera eitt nýtt val, t.d. Búðardal2769 START, við raw-skrá/sha/tier−1/OBJECTID/geymdan endahnút og núverandi null-færslu. Staðfesta síðan hina26 á sama einfalda hátt. Raða ekki kringum misræmi: ef source-vertex/endi/hnit stemmir ekki skal stoppa og skrá nákvæman blocker; ekki velja annan punkt eða fara í vefleit.
2. **25 punktar** í manifesti eiga beina EPSG:4326-hnúta í acquisition-raw. **Skaftafell3513 END og Kirkjubæjarklaustur2313 END** nota native EPSG:3057 úr retained wfs-vegnr1-all.json; bera einnig við CSV-native-endana. Endurnýta litla Lambert-vörpun fyrri lotu (GRS80/ISN93-færibreytur) og bera hana við nokkur óháð retained native/WGS84-pör (≤1e-7°); halda native/source og wgs84_derivation í þessum2. Engin dependency eða ný geometry-öflun. WGS84 manifest/töflu er vænting, ekki source-sannprófun ein og sér.
3. Bæta27 færslum við **núverandi** winter-route-approach-selections.json: SELECTED_PRODUCT_APPROACH, `selection_basis: MAP_PRODUCT_APPROVED_VIA_PROMPT`, access_status EXACT_GAP; source.idferill/stored_field, skýr source.database/file/OBJECTID/tier/SHA og hnit, stutt approach_is/approach_en eftir núverandi mynstri. Nota `source.database: acquisition-raw` fyrir25 acquisition-hnúta og `road-links` fyrir2 native-punkta, með réttri beinni raw-skrátilvísun í báðum. Ekki ný almenna source/selection-kerfið.
4. Á hverri nýrri afgreiðslu er `map_reference: docs/ai/tasks/ticket-500/remaining-map-selection/map-review.md`; `map_observation` ber `source_role: RIPLEY_VISUAL_CHECK`, nákvæma URL og athugun viðkomandi staðar úr candidate-review.json. Hér er engin nákvæm fjarlægðarmæling á öllum27: ekki búa til 0–10m eða50m-gildi til að líkja eftir fyrri tveggja-gatnamóta-lotu. `map_recommendation_reason` greinir vöruval frá óstaðfestum vegatengingum. Engin ný CC/Jonesy-kortaskoðun ályktuð.
5. Í places.json fyllast **aðeins þessir27**: source-hnit, approach á mannamáli, sama selection_basis, selectionReference, núverandi state ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED og reason með Ripley-kortastoð/EXACT_GAP/viðeigandi fyrirvörum. Varðveita alla gamla reference-reiti. Fyrir native2 bæta coordinateDerivationReference í rétta selections-færslu. Eldri27 staðafærslur og Keflavík/Þórshöfn haldast bókstaflega óbreyttar —29 óbreyttar alls.
6. Eldri23 selections-færslur halda sér bókstaflega, þar á meðal previous_disposition hjá Reyðarfirði/Fáskrúðsfirði. Ný heild50 selections, allar SELECTED_PRODUCT_APPROACH;54/56 places með hnit,2null. Uppfæra topp-note í báðum skrám til að lýsa raunverulegum tölum og mörkum. Engin ný vöruskrá eða product-gap-framework.

## Sérstakir fyrirvarar úr raunverulegum gögnum

- **Kópavogur3073 START:** hnúturinn er í sameiginlegu acquisition-safni sem fylgdi upphaflega Hafnarfjarðar-IDBUTUR. Source-STADARLYSING er Hafnarfjarðarvegur; það er ekki bæjarmerking. Kortaskoðun Ripley sýndi staðinn við Kópavogsdal og styður gegnumvegspunkt þar. Ekki krefjast rangrar „tilheyrir upprunalega place-batch“ nafnajöfnunar eða kalla hann bæjarmörk/gatnamót.
- **Hafnarfjörður10287 START:** þetta er annar punktur en afturkallaður2807 START. Ekki endurvekja gömlu tillöguna eða reiða sig á óstaðfest leitarbrot.
- **Akranes3797 END:** kortið sýnir innkomuhringtorg, en fyrra2,5m bil að samnefndu hring21441 helst. Nýtt staðsetningarval leysir ekki exact graph-snertingu; segja það í reason.
- **Dalvík3567 START:** sami áður greindi innri hnútur við3501. Nú valinn vegna þess að kortið sýnir punkt við syðri byggð/skóla, **ekki** vegna þess að samskeytin séu ytri tenging. Approach segir „Punktur á Dalvíkurvegi við syðri byggð á Dalvík“, ekki staðfest aðkoma/bæjarmörk. Eldri OD1-niðurstaða haldast rétt.
- **Höfn3652 END:** kortið sýnir1/99/987-tengingu sem vörustoð. Ekki nota Flugvallarveg982/3170 sem bæjarpunkt, og ekki fullyrða að ný Hornafjarðarleið eða akstursleið hafi verið sannreynd.
- **Skaftafell3513 END:** kortið sýnir tengingu að Skaftafellsvegi998; þetta er punktur við Hringveg, ekki þjónustumiðstöðvarhnit. **Kirkjubæjarklaustur2313 END:** við Hringveg/205-hringtorg, retained endi ekki færður að hringmiðju; source-bil að2409 START haldast óleyst (færa/native brúa ekki).
- Aðrir valdir punktar eru ýmist við byggð/gatnamót eða innri gegnumvegapunktar eins og lýst er í manifesti. **Vöruval krefst ekki opinberra bæjarmarka eða ytri graph-samskeyta**, en má ekki fullyrða þau. Allir56 halda sér og enginn verður SUPPORTED/ROUTABLE. Gating/scoring/forecast og notendaflæði eru ósnert.

## Markviss sannprófun

Framlengja núverandi approachSelections.test.js með **óháðum föstum lista** yfir þessi27 ID/source-enda og hnit (töflu að ofan), ekki lesa manifest og nota sama object sem eina væntingu. Staðfesta nákvæma raw-endahnúta/source/tier/SHA og föstu CRS/vörpunarvæntingarnar fyrir2. Probe/heimildaeign sé rétt, map-URL fylgi réttum stað og approach_is=places.approach. Afmörkuð orðalagsvörn fyrir sýndu áhættutilvikin (Dalvík innri/Kópavogur gegnumvegur/Akranes bil/Höfn aðgreind frá flugvelli), ekki almenn vél sem túlkar allan texta.

Neikvæðar athuganir: rangur source-endi eða source-skrá, rangt CRS fyrir native, hnit fært af source, Akranes/Dalvík ranglega kynnt sem nákvæm ytri graph-tenging, viðbót á Keflavík/Þórshöfn eða breyting á eldri vali. Engin ósönn routability. Prófa raunverulegar upplýsingar, ekki sjálfhverf hjálparfallapróf.

Aðlaga **aðeins** úrelt fjölda/null/state/selection_basis/reference-próf í approachSelections/places/remainingCoverage/southConnections/acquiredGeometry/approachAnalysis/placeEvidence. Fyrri null-kröfur fyrir óvalda breytast nú í Keflavík/Þórshöfn, en ekki fella allar null-væntingar eða source-próf niður. Víð blind undantekning „öll hnit leyfileg“ óheimil; krefjast réttra punkta hjá hverjum völdum. Sérstaklega: placeEvidence hefur25 af þessum27 í sínu29-setti — sögulegt evidence-snapshot haldast óbreytt, en null-kröfur á **núverandi places** þurfa nákvæma uppfærslu; Nota raunverulegt ID-mengi úr núverandi skrám, ekki álykta talningu úr eldri athugasemd. Selection_basis-flokkar eru eldri MAP11, RETAINED10, MAP_JUNCTION2, ný MAP_PRODUCT27 og enginn reitur á4 upprunalegum/2óvöldum.

CC gerir einfaldan fyrir/eftir-samanburð: aðeins27 target-place-færslur breyttar,29 óbreyttar; gamlar23 selections-færslur óbreyttar; nöfn/ID/röð/svæði/aliases allra56 óbreytt og KEF≠Keflavík. Skýrslutalningar54hnit/2null/50selections miðast við raunverulegt úrval, ekki framtíðarlandsþekju. Keyra ofangreind sjö gagnasöfn, ESLint á snertum JS og git diff --check. Engin frontend-suite/build/vafraregression fyrir þessi óinnbundnu gögn.

## Mörk og skil

Leyfðar vöruskrár: winter-route-places.json, winter-route-approach-selections.json og ofangreind próf eftir þörf; nýjar litlar hjálparskrár/cc-report undir docs/ai/tasks/ticket-500/remaining-map-selection/ og CURRENT.md. candidate-review.json og map-review.md frystur yfirferðargrunnur, engin breyting CC. Eldri raw/ledger/analysis/coverage/acquisition/south/place-evidence/workflow-saga óbreytt. Engin breyting á forrits-UI/leiðarvél, engin netleit/geometry-öflun/dependency/delegation/forecast/scoring/gating/greiðslubreyting eða commit/push/GitHub/deploy/#500-lokun.

Ef eitthvert nákvæmt source-val stenst ekki, skrá raunverulegan blocker og einfaldasta leiðréttingu í stað sjálfvirks nýs punkts/öflunar. Gagnagat Keflavíkur/Þórshafnar stoppar ekki þessa27-punkta afhendingu og heimilar ekki hliðarrannsókn. CC þarf engin kortatól; byrjar á staðbundnu raw-probe. READY_FOR_CC → CC_IN_PROGRESS → CC_COMPLETE eftir nýtt eiganda „Prompt approved“, skrifar cc-report með eigin prófum/source-staðfestingu og aðgreinir Ripley-kortamat. Jonesy yfirfer, Ripley lokamet. Valfrjáls herðing tefur ekki; fyrir þriðju review-umferð sama verks þarf eiganda-checkpoint samkvæmt README.

## Jonesy review — umferð 1 (2026-11-16)

**Niðurstaða: APPROVED.** Engir blockerar. OR1–OR3 eru stuttar skýringar sem Ripley getur sett í approved-prompt án nýrrar Jonesy-umferðar. Stage helst PROMPT_REVIEW. Ég vel enga punkta; kortaskoðun Ripley á 27 stöðum er Ripley-heimild sem ég hef ekki séð (ég hef enga kort-/netaðgang). Ég met gagnabreytinguna, source-rekjanleika og prófaumfang.

### Sandbox-staðfest (mitt, engin netköll)

- **Öll 27 source-gildi stemma við raw.** Fyrir hvern stað: source-skráin er til, **SHA-256 í candidate-review.json = raunverulegt SHA** (25 acquisition-raw-skrár og `wfs-vegnr1-all.json`), IDFERILL finnst með tier −1 og OBJECTID = tilgreint (einn tier −1-hlutur á hvert), og tilgreindur START/END-hnútur = `source_vertex` (mismunur 0,0). Fyrir Skaftafell 3513 END og Kirkjubæjarklaustur 2313 END (native EPSG:3057) stemmir native við **`road-links.csv` end_x/end_y** (600573.7864, 390763.9840 og 547336.4823, 365988.0290; canonical OBJECTID 5875 og 5747) og WGS84 frá minni Lambert-útfærslu (= pyproj) er innan 4e-15° frá manifest-gildum — „bera við CSV“ og `source.database: road-links` fyrir þessa tvo er því framkvæmanlegt.
- **Taflan í prompt-inu = manifest = map-review.md:** 27/27 raðir með sama IDFERILL/START-END, hnit innan 6e-9° (8 aukastafir), map-URL innihalda sömu hnit og eru í map-review.md.
- **Talningar:** 27 núverandi null-staðir í places.json (+2) = 29 null; þeir 27 eru nákvæmlega valda mengið og hin tvö eru `keflavik` (heiti „Keflavík“) og `thorshofn`, núverandi state `NO_RETAINED_MATCH_CHECKED`/`NAME_MENTION_ONLY_NO_GEOMETRY`. 23 afgreiðslur + 27 = 50; 27 + 27 = 54/56 með hnit, 2 null; „29 óbreyttar“ = 27 eldri + 2. Hafnarfjörður 10287 START er annar punktur en 2807 START (2807 = Hafnarfjarðarvegur í sama Hafnarfjarðar-IDBUTUR, ~1,1 km norðar).
- **Hermun á afriti (ekki raunverulegt val):** ég bætti 27 færslum við selections og places samkvæmt prompt-inu (`acquisition-raw`/`road-links`, `MAP_PRODUCT_APPROVED_VIA_PROMPT`) og keyrði sjö söfnin með núverandi prófum (102 próf eftir OP1): **11 próf falla í sex skrám** (approachSelections 5, acquiredGeometry 2, approachAnalysis 1, placeEvidence 1, places 1, remainingCoverage 1); southConnections helst grænt. Þetta eru fjölda-/null-/state-/selection_basis-væntingar sem prompt-ið heimilar að aðlaga, þar með talið placeEvidence.test.js (null-krafa á 29 stöðum) sem prompt-ið nefnir sérstaklega; það passar við „aðlaga aðeins úrelt“.
- **Snerting við nágranna í retained gögnum (tier −1, 60 m, aðeins 82 acquisition-IDBUTUR + vegnr 1-safn)** — flokkun sem prompt-ið vísar til sem „eins og lýst er í manifesti“ en listar ekki:
  - **13 punktar við annan nafngreint stykki, 0,0 m:** Hafnarfjörður (Reykjanesbraut 41; auk tveggja Reykjanesbrautarstykkja í 3,5 og 4,0 m — ekki sameiginleg hnit), Mosfellsbær (lokað hringstykki 2489, bæði enda 0,0 m), Stykkishólmur, Búðardalur, Súðavík, Drangsnes, Blönduós (tvö stykki: Hringvegur og 731), Dalvík (3501, **sama VEGNR 82**, aðeins STADARLYSING ólíkt — innri hnútur eins og OD1 sagði), Húsavík, Neskaupstaður, Höfn (55362 „Hafnarvegur–Hornafjarðarvegur“), Skaftafell (3514), Þorlákshöfn (Krýsuvíkurvegur 427).
  - **9 punktar við sama-heitis stykki, 0,0 m (innri gegnumvegasamskeyti, ekki gatnamót):** Kópavogur, Reykhólar, Hvammstangi (sama heiti, VEGNR 711→72), Skagaströnd, Kópasker, Raufarhöfn, Djúpivogur, Flúðir, Laugarvatn (liggur auk þess á lokuðu stykki, hringtorg).
  - **2 punktar nálægt sama-heitis hring en ekki sameiginleg hnit:** Akranes (hring 21441, **2,49 m** — stemmir við „2,5 m“) og Kirkjubæjarklaustur (hring 8675, **2,36 m**; 2409 START **~32,7 m** frá — stemmir við „source-bil að 2409 START“).
  - **3 punktar án retained nágranna innan 60 m:** Ísafjörður 3834 END, Hólmavík 3883 END, Eskifjörður 2834 END (endar retained stykkja; ég get ekki stutt þá umfram kortaskoðun Ripley).
  Þetta samræmist lýsingum Ripley (hringtorg við Mosfellsbæ/Akranes/Kirkjubæjarklaustur/Laugarvatn, tengingar við Reykjanesbraut, 731, 427, 72/711) en sannar þær ekki.

### Athugasemdir (ekki blockerar)

- **OR1 — gerðu áhættuorðalagið prófanlegt með föstum orðum.** Prompt-ið krefst „afmarkaðrar orðalagsvarnar“ fyrir Dalvík, Kópavog, Akranes og Höfn, en án tilgreindra orða lenda prófin í sömu stöðu og OP1 í síðustu lotu. Tillaga: `map_recommendation_reason` (selections) og `connectionStatus.reason` (places) skulu innihalda — Akranes „2,5“ og „21441“; Dalvík „3501“ og „innri“; Kirkjubæjarklaustur „2409“ (og „2,4“ eða „32,7“ ef Ripley vill tölu); Höfn „982“ eða „3170“ sem *ekki notað*; Kópavogur „gegnumveg“/„ekki gatnamót“. Og `approach_is` fyrir Kópavog, Dalvík og Akranes má ekki innihalda „gatnamót“, „aðkoma“, „bæjarmörk“, „staðfest“ nema sem neitun (ekki hrá bannleit að „tenging“ eða „hringtorg“, því Hafnarfjörður, Akranes, Þorlákshöfn og Laugarvatn nota þau orð réttilega).
- **OR2 — þröskuldur WGS84.** Í síðustu lotu notaði prófið `toBeCloseTo(…, 6)` (±5e-7°) þótt prompt-ið segði 1e-7°. Skrifið „`Math.abs(Δ) < 1e-7`“ (eða `toBeCloseTo(…, 7)`) beint í prompt-ið; manifest-gildin eru nákvæm á 8 aukastöfum svo þetta er framkvæmanlegt.
- **OR3 — `approach_en`.** Manifest geymir aðeins `approach_is`; CC þarf að skrifa `approach_en` sjálfur. Segið að það sé bein þýðing á `approach_is` án nýrra fullyrðinga (engin „entrance/town limit/confirmed“) og að prófið krefjist aðeins að það sé til staðar og ekki tómt — ekki að það sé þýðingaprófað.

### Takmörk

Kortaskoðun 27 punkta er Ripley-heimild; engin fjarlægðarmæling, og prompt-ið bannar réttilega að búa til „0–10 m“/„50 m“ gildi. Hún sannar ekki ytri graph-tengingu, stefnu, opnun né akstursleið. Enginn staður verður SUPPORTED/ROUTABLE; EXACT_GAP áfram. Keflavík og Þórshöfn eru óleyst og krefjast sérstakrar eigandaheimilaðrar öflunar. Eftir lotuna: 54/56 með punkt, 2 null; #500 er áfram opið.

### Næsta skref

Ripley setur (valfrjálst) OR1–OR3 í `remaining-map-selection/approved-prompt-v1.md` og Stage READY_FOR_CC; eigandi sendir „Prompt approved“ til CC. Engin önnur Jonesy-umferð nauðsynleg.

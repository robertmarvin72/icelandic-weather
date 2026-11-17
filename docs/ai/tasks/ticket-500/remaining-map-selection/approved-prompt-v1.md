# #500 — Festa27 kortayfirfarna vörupunkta;2 afmörkuð source-göt

## Approved prompt v1 — 2026-11-16

Jonesy APPROVED án blockera; OR1–OR3 skýringar teknar inn. Keyranlegt aðeins eftir nýtt eiganda „Prompt approved“ til CC meðan CURRENT er READY_FOR_CC. Eigandi heimilaði sameiginlega yfirferð allra29 staða sem eftir voru. Ripley hefur gert27 kortaskoðanir með myndsýn og staðbundna gagnaúttekt fyrir hina2. Engin vörugögn breytt. Markmið er **ein gagnalota**, ekki sérstakt prompt/review fyrir hvern stað.

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

## Skýringar úr samþykktri yfirferð (OR1–OR3)

- **OR1 — þröng og prófanleg varnaðarorð:** bæði map_recommendation_reason og connectionStatus.reason skulu varðveita þessi atriði: Akranes „2,5“ og „21441“ ásamt því að bil sé óleyst; Dalvík „3501“ og „innri“, ekki ytri tenging; Kirkjubæjarklaustur „2409“ og að source-bil sé óleyst; Höfn „982“ eða „3170“ með skýrri neitun um að sá flugvallarpunktur sé notaður; Kópavogur „gegnumveg“ og ekki gatnamót. Stuttu approach_is-lýsingarnar fyrir Kópavog/Dalvík/Akranes fylgja varfærna jákvæða orðalaginu í candidate-review.json, og mega ekki bæta við fullyrðingu um staðfesta aðkomu/gatnamót/bæjarmörk. Ekki beita hráu banni á orð eins og „hringtorg“ eða „tenging“ sem geta lýst kortaatriði réttilega. Prófa beinlínis varðveislu þessa afmarkaða inntaks.
- **OR2 — WGS84-vikmörk:** staðfesta frávik frá föstum væntingum og vörpun með `Math.abs(actual - expected) < 1e-7` gráðu fyrir hvorn ás, ekki `toBeCloseTo(..., 6)` sem gefur víðari mörk. Endahnútar úr sama EPSG:4326-raw eiga að vera bókstaflega jafnir source-hnitum þegar þeir eru ekki námundaðir.
- **OR3 — enski textinn:** approach_en er bein þýðing á approach_is, án nýrra fullyrðinga um entrance/town limits/confirmation. Nægir að prófa að enski textinn sé til og ekki tómur; ekki bæta við þýðingaprófakerfi.

## Markviss sannprófun

Framlengja núverandi approachSelections.test.js með **óháðum föstum lista** yfir þessi27 ID/source-enda og hnit (töflu að ofan), ekki lesa manifest og nota sama object sem eina væntingu. Staðfesta nákvæma raw-endahnúta/source/tier/SHA og föstu CRS/vörpunarvæntingarnar fyrir2. Probe/heimildaeign sé rétt, map-URL fylgi réttum stað og approach_is=places.approach. Afmörkuð orðalagsvörn fyrir sýndu áhættutilvikin (Dalvík innri/Kópavogur gegnumvegur/Akranes bil/Höfn aðgreind frá flugvelli), ekki almenn vél sem túlkar allan texta.

Neikvæðar athuganir: rangur source-endi eða source-skrá, rangt CRS fyrir native, hnit fært af source, Akranes/Dalvík ranglega kynnt sem nákvæm ytri graph-tenging, viðbót á Keflavík/Þórshöfn eða breyting á eldri vali. Engin ósönn routability. Prófa raunverulegar upplýsingar, ekki sjálfhverf hjálparfallapróf.

Aðlaga **aðeins** úrelt fjölda/null/state/selection_basis/reference-próf í approachSelections/places/remainingCoverage/southConnections/acquiredGeometry/approachAnalysis/placeEvidence. Fyrri null-kröfur fyrir óvalda breytast nú í Keflavík/Þórshöfn, en ekki fella allar null-væntingar eða source-próf niður. Víð blind undantekning „öll hnit leyfileg“ óheimil; krefjast réttra punkta hjá hverjum völdum. Sérstaklega: placeEvidence hefur25 af þessum27 í sínu29-setti — sögulegt evidence-snapshot haldast óbreytt, en null-kröfur á **núverandi places** þurfa nákvæma uppfærslu; Nota raunverulegt ID-mengi úr núverandi skrám, ekki álykta talningu úr eldri athugasemd. Selection_basis-flokkar eru eldri MAP11, RETAINED10, MAP_JUNCTION2, ný MAP_PRODUCT27 og enginn reitur á4 upprunalegum/2óvöldum.

CC gerir einfaldan fyrir/eftir-samanburð: aðeins27 target-place-færslur breyttar,29 óbreyttar; gamlar23 selections-færslur óbreyttar; nöfn/ID/röð/svæði/aliases allra56 óbreytt og KEF≠Keflavík. Skýrslutalningar54hnit/2null/50selections miðast við raunverulegt úrval, ekki framtíðarlandsþekju. Keyra ofangreind sjö gagnasöfn, ESLint á snertum JS og git diff --check. Engin frontend-suite/build/vafraregression fyrir þessi óinnbundnu gögn.

## Mörk og skil

Leyfðar vöruskrár: winter-route-places.json, winter-route-approach-selections.json og ofangreind próf eftir þörf; nýjar litlar hjálparskrár/cc-report undir docs/ai/tasks/ticket-500/remaining-map-selection/ og CURRENT.md. candidate-review.json og map-review.md frystur yfirferðargrunnur, engin breyting CC. Eldri raw/ledger/analysis/coverage/acquisition/south/place-evidence/workflow-saga óbreytt. Engin breyting á forrits-UI/leiðarvél, engin netleit/geometry-öflun/dependency/delegation/forecast/scoring/gating/greiðslubreyting eða commit/push/GitHub/deploy/#500-lokun.

Ef eitthvert nákvæmt source-val stenst ekki, skrá raunverulegan blocker og einfaldasta leiðréttingu í stað sjálfvirks nýs punkts/öflunar. Gagnagat Keflavíkur/Þórshafnar stoppar ekki þessa27-punkta afhendingu og heimilar ekki hliðarrannsókn. CC þarf engin kortatól; byrjar á staðbundnu raw-probe. READY_FOR_CC → CC_IN_PROGRESS → CC_COMPLETE eftir nýtt eiganda „Prompt approved“, skrifar cc-report með eigin prófum/source-staðfestingu og aðgreinir Ripley-kortamat. Jonesy yfirfer, Ripley lokamet. Valfrjáls herðing tefur ekki; fyrir þriðju review-umferð sama verks þarf eiganda-checkpoint samkvæmt README.

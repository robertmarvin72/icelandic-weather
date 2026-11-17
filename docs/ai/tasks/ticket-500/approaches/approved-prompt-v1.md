# #500 — Samþykkt framkvæmdarprompt v1: aðkomugreining

## Ripley — 2026-11-14; Jonesy APPROVED án skilyrða

Jonesy samþykkti í umferð 1 án skilyrða. Keyranlegt aðeins þegar CURRENT vísar hingað í READY_FOR_CC og eigandi sendir nýtt „Prompt approved“. Eigandi bað um næsta prompt eftir PASS á raunöflun. Nú vinna úr **þeim 39 staðasöfnum sem gögn fengust fyrir**, í einni afhendingu. Allir 56 eigandastaðir haldast. Engin ný netköll eða önnur endurtekning gagnaöflunar.

## Útkoma

Nýtanlegar aðkomutillögur á raunverulegum veglínum, skýr rök fyrir tillögunum og eitt sameiginlegt eigandaákvörðunaryfirlit. Fyrri flokkun 2/7/30 var aðeins nákvæm nafnajöfnun; hún er **ekki** niðurstaða um hvaða staði hægt er að tengja. Ekki skila sömu flokkum með nýjum nöfnum. Nota geometry, samskeyti, veg-/staðarlýsingar og fyrirliggjandi tengsl saman. Þar sem það dugar ekki skal segja nákvæmlega hvað greinir ekki milli valkosta; ekki fela staðinn eða búa til bæjarhnit.

## Lesa fyrst

AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md; síðan:

- server_data/winter-route-places.json, winter-route-remaining-coverage.json og winter-route-acquired-geometry.json; ticket-500/acquisition/result-review.md og evidence.md, sérstaklega OB3/OB4 og lokamat Ripley.
- `ticket-500/acquisition/samples/raw-*.json`: **raunverulegu fullu línurnar**, ekki aðeins start/end-útdráttur product-skrár. Nota eitt tier (−1, eins og útdrátturinn), OBJECTID/IDFERILL og source-SHA.
- Fyrirliggjandi retained geometry/tengsl í ticket-493-place-network/samples/road-links.csv og chain-walks-v4.json, ticket-491/final-validation/route-data-candidate.json og viðeigandi lokamat, aðeins þar sem þau tengjast skoðuðum línum. Ekki enduryfirfara heila landsrannsókn eða fyrri prompt-söfn.
- Eldri níu óvaldir kandídatar: fimm suður úr winter-route-south-connections.json og fjórir úr remaining-coverage.json. Aðeins tilvísun í lokaákvörðunaryfirliti, engin endursmíð þeirra. R1/E1/S2/C eigandaval óbreytt.

## Verkefni CC

1. Afmarka nákvæmlega 39 `place_results` úr acquisition-skránni. Smíða í minni sameiginlega skrá source-features eftir OBJECTID/tier; sama geometry sem fleiri staðir vísa á er ekki nýr eða tvítekinn vegur. Hver niðurstaða varðveitir staða-ID úr 56-listanum.
2. Rekja fyrir hvern stað raunverulegar línur og **samskeyti/útenda/greinar** við tengiveg, ekki krefjast að vegheiti jafngildi bæjarnafni. Bein endapunktajöfnun gefur geometry-snertingu. Mæld nálæg bil eru aðskildar ályktanir, ekki samfelld vegtenging. Ekki brúa þau með beinni línu eða gera nálægasta enda að réttri bæjaraðkomu. Ekki nota EPSG:4326 gráður sem metra; ef mæla þarf fjarlægð nota einfalt fyrirliggjandi haversine, ekki nýja reprojection-umgjörð.
3. Fyrir sjö fjölstykkjasöfn (Grindavík/Bíldudalur/Þingeyri/Bolungarvík/Siglufjörður/Ólafsfjörður/Vopnafjörður), sýna hvaða samnefndu stykki tengjast hvert öðru og tengivegi utan þeirra; setja raunveruleg greinarmörk í tillöguna. Fyrir þrjátíu án nafnajöfnunar nýta vegheiti, STADARLYSING, samliggjandi vegi og varðveitt staðartengsl — ekki losa eingöngu regex eða lýsa öllum sem bandstriksheitum. Nafn/rökrétt samfella ein sannar ekki hvaða endi sé við byggðina.
4. Endurmeta sérstaklega **rök fyrir END-valinu** hjá tveimur núverandi acquisition-kandídötum: Patreksfjörður 53127 og Sauðárkrókur 2485. Ekki samþykkja fyrri handahófsenda vegna þess að flokkunin sagði „eitt nafn“. Sauðárkrókur-END er samskeyti við 2715/3067, ekki staðfest miðja bæjar. Ef báðir endar eru raunhæfir, sýna báða; ekki finna upp gagnarök fyrir valinu. Skrá stored START/END og traversal-hlutverk aðskilið.
5. Leggja fram **eina ráðlagða aðkomu þar sem heimildir réttlæta hana**, með stuttri aðkomulýsingu, hnitum af raunverulegri source-línu, tengdum stykki-ID og nákvæmri heimild/rökum. Þegar tveir eða fleiri kostir eru jafn raunhæfir skrá litla afmarkaða valkosti. Ef ekkert heimildatengt aðkomuval er hægt, skrá nákvæma hindrun og einfaldasta vantar-gagn. „Geometry til, staðarendi óákveðinn“ er heiðarleg niðurstaða, ekki „engin gögn“. Ekki búa til nýja staði, sveitarfélagamiðjur, veðurpunkta sem staðaenda eða hnit af mynd.
6. Geometry-aðkomutillaga/val, lagaleg akstursstefna og tímabundin færð eru aðskilin. Ekki gera VEGHLUTI/stored-direction/samfellu að akstursheimild. Aðkomugreiningin getur klárast með óstaðfestu aðgengi, en skráir það skýrt og má ekki hækka í supported. Ekkert eigandaval ályktað og engin núverandi veglokun leidd af gömlum svörum.

## Skýringar OC1–OC3, innan samþykkts umfangs

Snerting við tengiveg utan aflaðra stykkja er hér aðeins staðfest með geometry í sama CRS (retained EPSG:4326, t.d. wfs-north-4326.json/wfs-vesturland-4326.json). EPSG:3057-tölur úr road-links/eldri raw eru ekki sambærilegar við 4326 án umbreytingar. Þar sem sambærileg ytri geometry vantar skrá nákvæmt CRS-/þekjugat; ekki sleppa staðnum eða álykta tengingu úr nálægð. Samskeyti innan aflaðs mengis eru engu að síður nýtanleg gögn.

Lokað source-stykki með fyrsta hnút = síðasta hnút er hringur, ekki lína með tveimur ólíkum byggðarendum. Merkja hringi í niðurstöðum; kandídat þar þarf tiltekinn source-hnútavísi og rök, ekki sjálfvirkt END-val. Þetta á m.a. við átta KEF-stykki. STADARLYSING er heimildabundin textastoð, ekki ein og sér sönnun um bæjaraðkomu eða endaval.

## Afhending og leyfðar breytingar

- Ný `server_data/winter-route-approach-analysis.json`: nákvæmlega 39 niðurstöður með source-feature-tilvísunum, aðgreindum geometry-/staðarnafns-/aðgangs-/eigandavalsrökum, ráðlögðum/tvíræðum kandídötum eða nákvæmu gati. Source-geometry er til nú þegar; ekki afrita fullar línur í aðra stóra skrá. Kandídatpunktar vísa á source OBJECTID/tier/stored-enda eða raunverulegan hnútavísi. Tillögur eru óvaldar.
- Aðeins bæta `approachAnalysisReference` við þessar 39 færslur í winter-route-places.json og `approach_analysis_reference` við samsvarandi coverage-færslur. Fyrri acquisition-status, source-/candidate-snapshot, hnit/approach, aliases/heiti/ID/svæði/röð og hinir 17 staðir óbreytt. Ný greining er aðskilin fyrri nafnajöfnunarflokkun svo upprunasannprófun hennar haldist gild. Engin runtime-tenging.
- Ein stutt `docs/ai/tasks/ticket-500/approaches/owner-decisions.md`: hópa ráðlagðar aðkomur, raunverulegt tvíval og sýnd gagnagöt, allt merkt staða-ID. Viðbótartilvísanir í fimm suður/fjóra eldri kandídata til að eigandi geti afgreitt **allt sem er nógu rökstutt í einu**, ekki ný prompt fyrir hvern stað. Ekki biðja eiganda að velja óstaðsettan línuenda út frá nafni einu. Ekki gera þetta að 39 löngum skýrslum; ítarefni er í JSON.
- `approaches/cc-report.md`: hversu margar raunverulega nýjar aðkomutillögur/greinarmörk fengust, hvað er enn tvírætt og hvað þurfi utan retained gagna. Ekki telja prósa- eða flokkunarbreytingu nýja vegtengingu. Ef gögn duga ekki, sýna takmörkin; ekki sjálfvirk ný gögn, prompt eða viðbótarloop.
- Ný `api/_lib/winterRoute/approachAnalysis.test.js`; leyfileg þröng breyting places.test.js aðeins ef nýju reference-reitirnir þarfnast prófs. Engar breytingar acquiredGeometry.test.js til að losa núverandi raw-samanburð.

## Markviss próf og viðtaka

Sannreyna nákvæmt 39-mengi og óbreytt 56 ID/heiti/röð. Hver emitted candidate, líka valkostir, finnst á tilgreindum raw-feature/tier/hnút og SHA er rétt; tilvísuð samskeyti og orðalag um nákvæma samfellu stemma við endapunkta. Mæld bil verða ekki merkt jafnir hnútar. Ný analysis-reference leysist í rétta niðurstöðu fyrir sama staða-ID. Negative tilvik: punktur færður af línu, rangt samskeyti eða víxlað source-stykki og óheimil supported/eigandavals-hækkun; prófa raunverulega athugun, ekki eigin mutation-sjálfssamanburð.

Keyra snert nýtt prófasafn og fjögur núverandi gagnaprófasöfn places/remainingCoverage/southConnections/acquiredGeometry, lint á snertu JS og diff-check. Ekki frontend-suite/build/vafri eða hundruð mutation-prófa. Enginn nýr almennur graf-/validator-framework; lítil einnota úrvinnsla undir approaches/ leyfð ef þarf, með prófuðum tilvísunum í afhendingu.

Viðtaka er efnisleg aðkomugreining allra 39 með raunverulegum heimildatengdum tillögum eða sýndum óleystum greinarmörkum; **ekki** skylda að framleiða öruggt val þegar gögn leyfa það ekki. Stoppa þegar gögnin hafa verið nýtt að þessu marki. PASS er ekki full #500-lokun eða akstursleiðarvottun. Meginframhald er ein eigandaafgreiðsla á nægilega rökstuddum tillögum og eitt sameiginlegt mat á afmörkuðu gagnagötunum.

## Mörk og handoff

Engin netköll, ný geometry/þjónusta/dependency, delegation, almenn landsleiðarvél, UI/API/#501-tenging, veður-/ETA-/scoring-/FreePro-/greiðslubreyting, commit/push, GitHub-birting/lokun eða deploy. Leyfðar skrár aðeins framangreindar, nýjar hjálpar-/skýrsluskrár undir approaches/ og CURRENT.md. Eldri raw/ledger/samþykkt prompt/yfirferðir, acquisition geometry og suðurkaflar óbreytt. Ekki breyta eftiráskýringum í gömlu skýrslunum til að láta þær líta út sem nýjar sönnunarfærslur.

Keyranlegt aðeins sem approved-prompt úr CURRENT í READY_FOR_CC eftir eiganda „Prompt approved“. CC notar CC_IN_PROGRESS → CC_COMPLETE og skýrsluslóðir úr CURRENT. Ein sameinuð Jonesy-yfirferð á afhendingu; aðeins sýnd nauðsynleg villa er blocker, valfrjáls herðing ekki ný lota. Þriðja review-umferð þarf sérstaka eigandaákvörðun samkvæmt README.

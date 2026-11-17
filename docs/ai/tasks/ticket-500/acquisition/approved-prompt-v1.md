# #500 — Samþykkt framkvæmdarprompt v1: raunöflun geometry

## Ripley — 2026-11-14; Jonesy APPROVED án skilyrða

Jonesy samþykkti prompt og óbreytt request-manifest í umferð 1. Keyranlegt aðeins þegar CURRENT vísar hingað í READY_FOR_CC og eigandi sendir nýtt „Prompt approved“. Eigandi bað um næsta gagnaöflunarprompt eftir lokið sameinaðri retained-yfirferð. Markmið: **sækja raunverulegar veglínur sem vantar**, ekki gera sömu yfirferð aftur.

### Afmörkun og afhending

39 staðir hafa retained færðarauðkenni en vantar geometry/aðkomu. Núverandi coverage gefur 82 einstök IDBUTUR fyrir þá (ekki tæmandi vegakerfi). Afhenda nýjar source-línur sem fást fyrir þessi auðkenni, rekjanlega tengingu þeirra við núverandi coverage og tillögur að raunverulegum aðkomum **þar sem gögnin styðja það**. Auðkenni kennt við stað sannar ekki að línan þjóni réttri bæjaraðkomu. Enginn punktur verður eigandavalinn eða routable af því geometry fékkst.

Keflavík/Skaftafell/Þórshöfn án nýtanlegrar auðkennasamsvörunar, Kirkjubæjarklausturs-textanefning og WGS84-göt þriggja eldri kandídata eru utan köllunar þessarar lotu. Þau halda sýnilegum götum í heildarcoverage; enginn af 56 stöðum hverfur. Þetta er ein sameinuð geometry-öflun fyrir stærsta sameiginlega gatið, ekki yfirlýsing um lokið #500.

### Lesa fyrst

AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md; server_data/winter-route-remaining-coverage.json og winter-route-places.json; ticket-500/remaining/evidence.md og result-review.md (NF1 leiðrétting gildir). Lesa `ticket-500/acquisition/request-manifest.json`: þar eru **orðréttar átta encoded URL**, source-SHA, 39 target place-ID og föst auðkennasett. Manifest er review-gagn, ekki heimild eitt og sér. Ekki búa til aðra stem-leit eða breyta þessum auðkennum eftir raunsvar.

Endurnýta `ticket-493-place-data-phase2/samples/bounded_fetch.py` og `ticket-499/samples/driver.py` (flutningsmörk/ledger), aðeins með staðbundnu afriti/afturhvarfslausri notkun undir acquisition/. Ekki nota gamla live_driver óbreyttan með E1/S2-föstum pörum/slóðum. Gamlar heimildir og ledger eru ekki heimild eða budget þessarar keyrslu. Enginn nýr HTTP-client eða dependency.

### OA1/OA2 — skýringar Jonesy, óbreytt manifest og budget

Níu ID hafa þegar retained native geometry: 907150037, 907160037, 907210037, 908020037, 908030037, 912010037, 912020037, 912040037, 912060037 í ticket-483/samples/wfs-vegnr1-all.json. Fyrstu fimm hafa einnig retained WGS84 í ticket-493-north-data/samples/wfs-north-4326.json. Gatið getur því verið aðkoma/tenging, ekki tilvist línu. Þau haldast í föstu manifest-hópunum, nýtast sem CRS/ás/skema-víxlsannprófun og teljast „þegar retained“, ekki öll sem ný geometry. Nota má þau offline til rökstuddra aðkomutillagna án nýrra kalla.

Nota **eitt ferli** sem keyrir PROBE, metur gát og heldur aðeins áfram með sjö hópum ef hún stenst. Staðbundið driver-afrit stillist á max_calls=8, max_total_bytes=67108864, window_minutes=20 og framfylgt wall_clock_cap_s=20. Socket-timeout eitt nægir ekki. Ekki endurræsa eða opna resume-leið yfir fyrirliggjandi ledger; ef keyrsla rofnar skila varðveittum árangri og slepptum köllum, ekki gera þau aftur. Þetta er lítil afmörkuð aðlögun fyrirliggjandi drivers, ekki nýr HTTP-client.

Tómt en heilt PROBE getur þýtt að 341190037 sé ekki í laginu, ekki að þjónustan sé biluð eða hin 81 ID vanti. Fylgja samt föstu STOP og gera ekki önnur prófkall sjálfkrafa. Staðfesta ódýrt að lon/lat-gildi séu töluleg og innan rannsóknarglugga Íslands (lon −25…−13, lat 63…67) áður en ný geometry er notuð; utan hans er nákvæmt gagnaformsgat, ekki hnit sem má snúa eða laga þegjandi. CRS-víxlsamanburður við retained fimm ID ber saman sömu feature/tier, ekki handahófsröð.

### Ný afmörkuð netheimild eftir approved-prompt og eigandahandoff

Eingöngu HTTPS `gagnaveita.vegagerdin.is/geoserver/gis/ows`, GET, engin auth/cookies/secrets. Allar URL í manifest nota WFS 1.0.0, `gis:faerdferlar2017_1`, CQL `IDBUTUR IN (...)`, `srsName=EPSG:4326`, JSON og maxFeatures=5000.

**Fyrst aðeins PROBE-KEF**, IDBUTUR 341190037. Staðfesta að raunþjónustan skili heilu, réttu geometry-svari fyrir þetta retained auðkenni áður en fleiri köll hefjast. Þetta er heimildar-/aðferðarpróf, ekki staðfesting á að KEF-aðkomupunktur sé fundinn. Ef það skilar villu, engu feature, röngu skema/CRS/layer/IDBUTUR eða skerðingu: varðveita svar/gat og **ekki keyra hinar sjö slóðirnar**. Ekki skrifa nýjan driver eða umfangsmikil prófasöfn áður en þessi litla integration-prófun hefur farið fram; aðeins nauðsynleg endurnýting budget/ledger fyrst.

Ef prófunin stenst má keyra BATCH-1…BATCH-7 úr manifest í röð, hvert auðkenni aðeins einu sinni í þessari keyrslu. Hóparnir eru remaining 81 auðkenni í föstum 12-ID hópum (síðasti níu); enginn nýr leitarflokkur, bbox, paging eða endurtekning.

Mest **8 HTTPS-skipti**, **8 MiB body á kall / 64 MiB samtals**, 20 sekúndna veggklukkutímaþak á kall og 20 mínútna öflunargluggi. TLS staðfest; engin retries/redirects. Prófunin telst eitt af átta. Skrá approved-prompt SHA og nýtt eigandahandoff í skýrslu fyrir fyrsta kall. Manifest/source-SHA sannreynist fyrir tengingu; ef frumcoverage hefur breyst stoppa og lýsa misræmi, ekki búa þegjandi til nýja URL.

Ledger skráir request_id, nákvæma URL, UTC, status, bytes, raw-SHA og stöðvunarástæðu; budget lifir endurræsingu. Ekki endurtaka kall eftir crash. Flutnings-/öryggisbrot (TLS/redirect/timeout/body-cap/budget) stöðvar allt. Eftir heila PROBE má gagnaformsstopp í einstökum bulk-hópi skilja hann eftir ónotaðan með skýrri ástæðu og halda áfram með aðra sjálfstæða manifest-hópa innan budget; engin viðgerð/endurtekning á sama kalli.

### Athuga raunsvör og vinna gögn

1. FeatureCollection, rétt EPSG:4326, feature-layer og IDBUTUR aðeins úr viðkomandi hópi; heil svör með matched=returned=len og len<5000. Vantar talningargögn/heilleika, rangt CRS/layer/ID, invalid JSON eða >=5000 features → ófullnægjandi hópur, ekki full þekja. Ekki krefjast að hvert beðið ID skili feature: listi requested-ID án features er **exact missing-ID finding**, ekki ályktun um að allir staðir hópsins séu óstuddir. Undantekning: PROBE þarf a.m.k. eitt rétt feature.
2. Ekki fyrirframgefa expected IDFERILL eða „eitt feature á hvert IDBUTUR“. Sama IDBUTUR getur náð yfir margar línur/vegi og fjögur precision-tier. Varðveita source feature-ID/IDFERILL/tier/OBJECTID. Tvítekinn sami auðkenndur feature-lykill með ósamræmdum gögnum er gat; ekki sameina samkeppnislínur hljóðlaust.
3. Nota source geometry með skráðri x/y röðun (lon/lat). Z er ekki staðfest hæð. Ekki summa precision-tier eða gera WGS84 gildi að native-metrum. Til einfaldrar candidate-vinnu nota eitt nefnt tier í einu, halda hinum sem heimild og flagga ósamræmi; ekki nýtt multi-tier scoring.
4. Skoða eingöngu nýlega aflaðar línur ásamt fyrirliggjandi referenced geometry til að rekja nothæfa aðkomutillögu/vegtengingu. Nafn eða IDBUTUR eitt nægir ekki. Ef punktur verður ekki rökstuddur, afhenda raunverulegu geometry með nákvæmu áframhaldsgati, ekki sleppa henni eða velja handahófsendapunkt. Engin eigandaákvörðun álykttuð; skrá native/stored START–END vs traversal skýrt. Engar tilbúnar línubrýr, F-vegir/ferjur sem sjálfgefnar eða almenn landsleiðarleit.
5. Nýjar línur sanna ekki leyfða akstursstefnu eða núverandi opnun. Access stendur óstaðfest nema svör sjálf hafi raunverulega slíka heimild með skilgreindri merkingu; annars skrá gat án þess að halda fram að engin opinber heimild sé til. Þetta prompt felur ekki í sér heimildaleit á vefsíðum eða nýjan leiðaveitanda.

### Afhending og skrár

- Raw/ledger, afrit/helper og ein stutt evidence/cc-report undir `docs/ai/tasks/ticket-500/acquisition/`; fyrri manifest varðveitt. Skrá stöðu á öllum átta manifest-köllum, þar með talin sleppt köll. Ef PROBE stöðvar verkið, skila aðeins raunprófi/ástæðu og hætta — ekki tómu stóru gagnalíkani.
- Ef gögn fást: ný `server_data/winter-route-acquired-geometry.json`, source-SHA/CRS og geometry einu sinni á hvert notað feature með staða-/coverage-tilvísunum. Ekki afrita sama veg fyrir hvert par. Stór raw-svör eru uppruni; product-gögn aðeins nothæfar línur og viðeigandi vísar, ekki forskýring um frontend-import.
- Uppfæra aðeins aðgreinda geometry/candidate/gap-stöðu og tilvísanir viðkomandi 39 í remaining-coverage.json og places.json, með source-tengingu; öll 56 heiti/ID/röð/svæði/aliases óbreytt og coordinates/approach í places halda fyrri gildum þar til eigandi velur. Hinir 17 staðir, suðurkaflaskrá og eldri raw óbreytt. Enginn SUPPORTED/ROUTABLE án staðreynda/eigandavals.
- Ein samantekt segir hversu mörg af 82 ID gáfu geometry, fyrir hvaða staði það nýtist og nákvæmu götin sem standa. Tilvísun í ákvörðunartillögur, ekki ný prompt fyrir hvern stað. PASS á gagnasókn er ekki full #500-lokun.

### Hófleg prófun og mörk

Ef PROBE virkar og ný gögn verða afhent: lítið `api/_lib/winterRoute/acquiredGeometry.test.js` sem les afhenta skrá gegn raw/SHA, feature-ID/tier/geometry, requested-vs-returned ID og samræmi tilvísana. Prófa heilleikastopp með einni skertri fixture og að ný geometry ein geti ekki hækkað unsupported. Afmörkuð aðlögun remainingCoverage.test.js/places.test.js aðeins þar sem nýjar leyfðar stöður kalla á hana; ekki leysa eldri valfrjálsa alias/mutation-herðingu. Keyra snert gagnapróf + southConnections regression og lint á snertum JS; ekki full frontend-suite/build/vafri.

Leyfðar skrár eru framangreind gögn/próf, acquisition-skjöl og CURRENT. Engin UI/API/#501-runtime-/veður-/ETA-/skorunar-/entitlement-/greiðslubreyting. Engin ný dependency, delegation, commit/push, GitHub-birting/lokun eða deploy. Fyrri samþykkt prompt og rannsóknargögn óbreytt.

CC notar README-lifecycle READY_FOR_CC → CC_IN_PROGRESS → CC_COMPLETE eftir nýtt „Prompt approved“. Ein sameinuð afhending og ein Jonesy-yfirferð; valfrjáls herðing býr ekki til nýja lotu. Ef heimiluð gögn duga ekki, sýna nákvæmu hindrunina og stoppa án sjálfvirks nýs prompts. Þriðja review-umferð þarf sérstakt eigandaval samkvæmt README.

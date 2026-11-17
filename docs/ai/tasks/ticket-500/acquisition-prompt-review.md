# #500 — Raunöflun geometry: ein prófun og sameinaðir afmarkaðir hópar

## Ripley initial prompt — umferð 1, 2026-11-14

Til Jonesy-yfirferðar; ekkert netkall heimilað af þessu drafti. Eigandi bað um næsta gagnaöflunarprompt eftir lokið sameinaðri retained-yfirferð. Markmið: **sækja raunverulegar veglínur sem vantar**, ekki gera sömu yfirferð aftur.

### Afmörkun og afhending

39 staðir hafa retained færðarauðkenni en vantar geometry/aðkomu. Núverandi coverage gefur 82 einstök IDBUTUR fyrir þá (ekki tæmandi vegakerfi). Afhenda nýjar source-línur sem fást fyrir þessi auðkenni, rekjanlega tengingu þeirra við núverandi coverage og tillögur að raunverulegum aðkomum **þar sem gögnin styðja það**. Auðkenni kennt við stað sannar ekki að línan þjóni réttri bæjaraðkomu. Enginn punktur verður eigandavalinn eða routable af því geometry fékkst.

Keflavík/Skaftafell/Þórshöfn án nýtanlegrar auðkennasamsvörunar, Kirkjubæjarklausturs-textanefning og WGS84-göt þriggja eldri kandídata eru utan köllunar þessarar lotu. Þau halda sýnilegum götum í heildarcoverage; enginn af 56 stöðum hverfur. Þetta er ein sameinuð geometry-öflun fyrir stærsta sameiginlega gatið, ekki yfirlýsing um lokið #500.

### Lesa fyrst

AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md; server_data/winter-route-remaining-coverage.json og winter-route-places.json; ticket-500/remaining/evidence.md og result-review.md (NF1 leiðrétting gildir). Lesa `ticket-500/acquisition/request-manifest.json`: þar eru **orðréttar átta encoded URL**, source-SHA, 39 target place-ID og föst auðkennasett. Manifest er review-gagn, ekki heimild eitt og sér. Ekki búa til aðra stem-leit eða breyta þessum auðkennum eftir raunsvar.

Endurnýta `ticket-493-place-data-phase2/samples/bounded_fetch.py` og `ticket-499/samples/driver.py` (flutningsmörk/ledger), aðeins með staðbundnu afriti/afturhvarfslausri notkun undir acquisition/. Ekki nota gamla live_driver óbreyttan með E1/S2-föstum pörum/slóðum. Gamlar heimildir og ledger eru ekki heimild eða budget þessarar keyrslu. Enginn nýr HTTP-client eða dependency.

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

## Jonesy review — umferð 1 (2026-11-14)

**Niðurstaða: APPROVED án skilyrða** (stöðva ekkert; OA1–OA4 eru stuttar skýringar sem mælt er með að Ripley taki beint inn í approved-prompt, ekki ný review-lota). Prompt-ið er afmarkað, ein prófun á undan sjö föstum hópum, með ströngu budget og skýrri stöðvunarreglu. Stage helst PROMPT_REVIEW. **Ég gerði engin netköll**; allt hér að neðan er sandbox-lestur á retained skrám.

### Sandbox-staðfest

- **Manifest = coverage.** `source_sha256` (3792a090…) = SHA256 `winter-route-remaining-coverage.json` núna (eftir NF1(b)). 39 `target_place_ids` = nákvæmlega þær færslur með status `ROAD_IDENTIFIER_RETAINED_NO_GEOMETRY`; 82 einstök IDBUTUR úr `road_condition_refs` þeirra = nákvæmlega mengið í manifest (82, engin tvítekning; þrjú ID, 904300037/907040037/908070037, deilast milli tveggja staða og eru sótt einu sinni). Hópastærðir: 1 + 6×12 + 9 = 82.
- **URL.** Allar átta slóðir: https, host `gagnaveita.vegagerdin.is`, `/geoserver/gis/ows`, GET, WFS 1.0.0, `typeName=gis:faerdferlar2017_1`, `CQL_FILTER=IDBUTUR IN (…)` sem afkóðast í nákvæmlega ID-listann hverrar beiðni, `srsName=EPSG:4326`, `application/json`, `maxFeatures=5000`; 235–367 stafir. Sama form og #499/#485 notuðu.
- **Budget stemmir.** 1 + 7 = 8 skipti; 8 × 8 MiB = 64 MiB; öll ID < 2³¹ (hæst 1 441 610 037). Hinir 17 staðir = 56 − 39 (4 valdir + 5 suður + 4 kandídatar + 1 textanefning + 3 án samsvörunar).
- **Þjónustusnið.** Retained svör á sama lagi (`wfs-vegnr1-all.json`, `wfs-vesturland-4326.json`) bera `totalFeatures`/`numberMatched`/`numberReturned`, `IDBUTUR` er heiltala, og EPSG:4326-gögn eru [lon, lat, z] — svo „matched=returned=len“-krafan og lon/lat-röðin eru framkvæmanleg. Öll 77 IDBUTUR sem ég sé í retained lagasettum eru líka í færðarskránum.
- **Endurnýtanleg hjálparskrá.** `bounded_fetch.py` (host-allowlist með `gagnaveita.vegagerdin.is`, TLS á, engin redirect, engin retry, streymdur lestur með body-cap) og `driver.py` (`wall_clock_cap_s`, ledger, neitar að ræsa ef ledger er til) eru til og passa lýsingu prompt-sins.

### Athugasemdir

- **OA1 — 9 af 82 ID hafa þegar retained geometry (mælt með skýringu í approved-prompt).** Prompt segir „39 staðir hafa retained færðarauðkenni en vantar geometry/aðkomu“ og „veglínur sem vantar“. Gegn retained skrám: IDBUTUR 907150037 og 907160037 (Hvammstangi), 907210037 (Blönduós), 908020037 og 908030037 (Varmahlíð), 912010037 og 912020037 (Djúpivogur), 912040037 og 912060037 (Höfn) eru öll í `ticket-483/samples/wfs-vegnr1-all.json` (EPSG:3057, VEGNR=1, t.d. 908020037 = IDFERILL 2477/3237/3238), og fimm þeirra (907150037, 907160037, 907210037, 908020037, 908030037) einnig í `ticket-493-north-data/samples/wfs-north-4326.json` (EPSG:4326). Það eru líka stykkin sem coverage-færslurnar sjálfar nefna sem `name_mention_ref` (3570, 3106, 2477). „No geometry“ í NF1(b)-lagfærðu coverage á því við **aðkomu/staðartengingu**, ekki að engin lína sé til fyrir þessi ID. Áhrif: níu kall-auðkenni af 82 sækja gögn sem þegar eru til; engin skaði fyrir budget (þau eru innan sömu 12-ID hópa, engin aukakall) og ekkert þarf að breyta í manifest/URL/SHA. Minnsta lagfæring: ein setning í approved-prompt — „níu ID (talin upp) hafa retained geometry; verða áfram í hópunum og nýtast sem víxlsannprófun á CRS/ás/skema (fersk 4326-svör ættu að jafngilda retained wfs-north-4326 fyrir fimm þeirra) og skýrslan telur þau ‚þegar retained‘, ekki ‚ný geometry‘“. Þannig svarar samantektin „hversu mörg af 82 gáfu geometry“ ekki villandi. Auk þess má CC sjálfur nota þessar níu retained línur strax offline til aðkomutillagna fyrir Hvammstanga/Blönduós/Varmahlíð/Djúpivog/Höfn — án nets.
- **OA2 — veggklukkuþak og ræsing driversins (framkvæmdarathugun).** `bounded_fetch.py` hefur aðeins socket-timeout (20 s) á hverja lesaðgerð, ekki heildarveggklukku; heildarþakið (20 s/kall) er í `driver.py` (`wall_clock_cap_s`) og þarf að vera raunverulega framfylgt í staðbundna afritinu (ekki bara tilgreint). Auk þess er `driver.py` sjálfgefið `max_calls=3`, `max_total_bytes=4 718 592`, `window_minutes=30` og **neitar að ræsa** ef ledger er þegar til — þá myndi önnur keyrsla (hóparnir sjö eftir prófun) verða hafnað. Einfaldast: ein ferli keyrir PROBE, metur gát í kóðanum (heil FeatureCollection, rétt layer/CRS/ID, ≥1 feature) og heldur svo áfram með hópana í sömu keyrslu; breyta sjálfgefnum gildum í 8 / 64 MiB / 20 mín. Ef CC vill frekar tvær keyrslur þarf skýr, prófuð „resume án endurtekningar“-hegðun. Báðir kostir eru innan prompt-sins („staðbundið afrit/afturhvarfslaus notkun“).
- **OA3 — tómt PROBE-svar (valfrjáls skýring).** Prompt stoppar ef PROBE skilar engu feature; það er rétt og ódýrt (eitt kall). Athuga að IDBUTUR 341190037 er enn ekki í neinu retained lagasetti (aðeins í færðarskránni), svo tómt en heilt svar gæti þýtt „ID ekki í layerinu“ fremur en „aðferðin bilar“. Ég mæli ekki með breytingu (það myndi breyta föstu URL); aðeins að CC lýsi þá nákvæmlega hvað fékkst og stoppi án þess að álykta um hin 81 — eigandi ákveður hvort ný prófun á öðru ID verði heimiluð.
- **OA4 — ódýr heilbrigðisathugun á CRS/ás án nýs kalls.** Aukalega við „rétt EPSG:4326“: staðfesta að allar hnitaþrenndir liggi innan Íslands (lon ≈ −25…−13, lat ≈ 63…67) áður en nokkur lína er flokkuð sem lon/lat, og bera fersk svör fyrir ID í OA1 við retained 4326-skrána. Ekkert netkall, nokkrar línur.

### Takmörk

Ég hef ekkert sótt og tek enga afstöðu til þess hvað þjónustan skilar; allt ofan er lestur á retained gögnum og afritum í sandbox. „Prompt approved“ frá eiganda er afhending til CC, ekki mín. Samþykki mitt nær aðeins yfir þetta draft og þetta manifest; ef Ripley breytir ID-mengi, URL eða budget þarf manifest/SHA að endurreiknast. PASS á gagnasókn væri ekki lokun #500 né leiðarvalhæfni; aðgengi er áfram EXACT_GAP.

### Næsta skref

Ripley tekur OA1 (og helst OA2) inn í approved-prompt-v1.md í einni stuttri setningu hvort; síðan setur eigandi „Prompt approved“ fyrir CC. Engin önnur Jonesy-umferð nauðsynleg.

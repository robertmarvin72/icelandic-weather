# #501 — Afmörkuð öflunaráætlun, drög 2026-11-17

**ÁÆTLUN EINGÖNGU. Engin netöflun eða innleiðing heimiluð.** Eigandi samþykkti að þessi áætlun yrði útbúin. Endanlegar beiðnir og gagnasvið fara í yfirferð áður en sótt er.

## Markmið og niðurstaða þessarar lotu

Skilgreina minnstu næstu öflun sem getur upplýst #501, ekki reyna að klára landsnet í einni lotu. Almenn #501 samsetning/báðar hringáttir þurfa meiri grunn en fleiri fastar routeId. Öll 56 staðanöfn halda sér; áfangaskipting rannsóknar er ekki samþykki fyrir minni vöruþekju.

Fyrsta tillaga er **metadata/heimildaskref fyrst**, ekki stór geometry-sókn. Skýrt þarf að vera hvort opinber þjónusta hafi tengi-/stefnu-/aðgengisreiti sem geta svarað vandanum. `VEGHLUTI`, geometry-röð og current færð eru ekki sjálfkrafa heimild um löglega akstursstefnu. Ef slíkt contract fæst ekki, skila þeirri takmörkun og eigandaspurningu í stað þess að stækka leit sjálfvirkt.

## 1. Nákvæmur vöntunarlisti úr retained gögnum

| Forgangur / markmið | Núverandi stoð | Það sem vantar / minnsta spurning |
|---|---|---|
| A — Heimild um tengingu og ferðastefnu | `routes.js` H1 og veg93 direction_grade INFERRED; #499 retained capabilities/manifest; #500 selections EXACT_GAP | Er til opinber reitur/þjónusta fyrir one-way/traversal/löglegt aðgengi og native node-tengsl? Staðfesta skilgreiningu, gildi og gildissvið, ekki álykta út frá nöfnum. |
| B — R1→Selfoss innri samskeyti | `chain-walks-v4.json#selfoss_closure_target`: 2071 með 0,234m gap, 2135 með 34,749m gap | Heimildatengingar 1735→2071 og 2117→2135: raunverulegur connector/hnútur eða staðfest önnur merking. 30,097m 2138→3737 er handan Selfoss, ekki gap þessa pars. Ekki leiðrétta með snapping/epsilon. |
| C — R1→Hella viðbótarbil | cw_long að exit 3591: B auk 2138→3737 (30,097m) og steps 3→4 suðurútdráttar (42,302m) | Festa nákvæm source-ID/endapunkta beggja hliða 42,302m úr retained JSON áður en beiðni er smíðuð; heimild til connector/tengingar. 3591→3638 (32,63m) er handan Hellu, ekki gap þessa pars. |
| D — Veg93 E1→S2, sterkt geometry-par | `road93-candidate.json`, `road93_section-v2.json`, `place_nodes-v3.json`: 2344→3410→3409→2894 að S2, 0m samskeyti | Ferðastefnu-/aðgengisheimild fyrir báðar ferðastefnur, ef tiltæk. Ekki sækja aftur geometry sem þegar er varðveitt. 2892/2891 og fjórði gamli veðurpunkturinn eru handan valins S2. Veðurpunktaákvörðun tilheyrir síðari innleiðingu. |
| E — Báðir hringvalkostir | cw_long R1→Akureyri, ccw_short R1→Borgarnes, R1-norðurútdráttur til 3025 | Samfelldur hringgrunnur og staðfest join við endpoint: sérstaklega Akureyri↔Borgarnes vantar í þessari retained keðjuskipan. Ekki nóg að snúa cw_long. Fyrst finna hvort retained raw hafi gögnin þótt keðjuútdrátt vanti; ekki setja “engin gögn til” án þess. Stór öflun aðeins sérstakur síðari áfangi. |
| F — Hinir 56 staðir / tvö hnitagöt | 54 valdir punktar; Keflavík bær/Þórshöfn null | Almenn staðatenging og punktaval þessara tveggja er ólokið. Þessi áætlun endurvelur ekki punkta eða heimilar nýja landfræðilega leit; afmarka sérstaklega síðar. |

Vegalengdargrunnur: R1-prefix telur 1436 einu sinni. Selfoss 45 740,460m, Hella 81 769,554m samkvæmt óafrúnnaðri retained prefix-summu; bil á leið 34,983m / 107,382m. E1-entry er 677,6344km með 1436 úr phase2 v3, ekki tvítalda v2 680,1945. Þessar tölur eru staðbundinn rannsóknargrunnur, ekki leiðar- eða akstursheimild.

## 2. Tillaga að netkallabudgeti — ekki virkt leyfi

**Áfangi M (fyrsta mögulega öflun): hámark 3 GET-köll alls**, metadata/official documentation eingöngu, engin GetFeature/geometry. Fyrst lesa retained `ticket-499/request-manifest.json` og tilheyrandi capabilities; ef það svarar spurningu, sleppa kalli. Budget er hámark, ekki kvóti sem á að fylla.

1. Allt að eitt uppfært GetCapabilities á retained opinberu hosti `gagnaveita.vegagerdin.is`, path `/geoserver/gis/ows`, WFS 1.0.0; aðeins ef retained útgáfa nægir ekki. Aldrei sækja aftur sem “freshness” venju án ástæðu.
2. Allt að eitt DescribeFeatureType fyrir **eitt** staðfest relevant layer úr capabilities. `gis:faerdferlar2017_1` er þekkt geometry-layer, ekki fyrirfram staðfest direction-layer. Ekki finna upp layer/parameter-heiti.
3. Allt að ein bein opinber reitaskilgreining/docs GET sem er tilvísuð í metadata eða retained heimild. Ef engin slóð er staðfest, er kallið NOT PLANNED/UNKNOWN, ekki heimild til vefleitar eða domain-hops.

Fyrir seinni execution-prompt þarf request-manifest með **nákvæmri URL/query fyrir hvert heimilað kall**, tilgangi, expected content/schema, source til slóðar/layers, skip-if-retained reglu og föstu call order. Óþekkt target getur verið tveggja þrepa dependency en ekki opið leyfi: þá lýkur M eftir capabilities og eigandi yfirfer afleidda beiðni áður en kallað er. Ekki láta tóma request-slóð tákna wildcard.

Tillögutakmörk M: 20 sekúndur á kall, 2 MiB response-cap á kall, 6 MiB alls, 0 retries, 0 fylgdar redirects. Hvert sent HTTP-kall telur, líka 4xx/5xx/HEAD; engar laumulegar probe-/search-beiðnir. Bæði headers og body skráð með UTC client-tíma og server Date aðgreindum. Public URLs, engin credentials/registration/kaup/skilaboð til stofnana. Redirect eða yfirskriðið svarþak ⇒ skrá blocker og stöðva viðkomandi kall, ekki hækka budget.

**Áfangi G (geometry) er ekki inni í M.** Eftir metadata og samþykki: velja eitt markmið, t.d. B eða C, með nákvæmum native endpoints/source-ID, layer/filter/tier, expected aukafeatures-reglu og feature/byte/call-cap fyrirfram. Óleyfilegt að sækja allan Hringveg eða öll 56 staðapör til að finna connector. Aftur-sókn retained veg93 er ekki næsta skref. E er sérstök síðari ákvörðun, ekki automatic escalation.

## 3. Sannprófun og STOP

Varðveita source response óbreytt með SHA256, request-log, raunverulegum HTTP-stöðu/content-type og takmörkunum. Ekki handbreyta svarinu til að passa væntingar. Documentation-definition, observed sample, inference og UNKNOWN aðgreint. Skortur á direction-reit í einu layer sannar ekki að engin slík heimild sé til; skila nákvæmlega hvar leitað var.

STOP við óvæntu layer/schema/aukagögnum sem ekki hafa samþykkta reglu, redirect/host-breytingu, auth/billing, byte/time cap, 429 eða þörf á öðru en samþykktu kallinu. Lokun/current færð, role-kóði, myndræn snerting og nokkur metra gap eru ekki heimild til að staðfesta löglega akstursstefnu eða brúa gap.

Hvorki metadata-niðurstaða né PASS á öflun heimilar graph-implementation, UI, nýjar fastar routeId eða uppfærslu #500/server_data. Skila stuttri ákvörðun: hvort eitt nákvæmt geometry-skref er rökstutt eða hvaða heimild vantar. Engin aðgerð í þessari áætlun breytir GitHub, commit/push eða deploy.

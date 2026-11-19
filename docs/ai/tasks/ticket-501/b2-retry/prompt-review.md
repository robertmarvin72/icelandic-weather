# #501 — B2 endurtilraun, Round 1 — 2026-11-17

Eigandi samþykkti skýrt “já” við lágmarksviðgerð, local prófum og einni nýrri tilraun með sömu mörkum eftir týnt svar fyrri lotu. Þetta er nýtt 1-kalls budget, ekki endurkeyrsla gömlu möppunnar. Jonesy yfirfer prompt áður en Ripley gefur út approved-prompt / READY_FOR_CC og eigandi sendir Prompt approved. Engin upstream beiðni í prompt-review eða viðgerðaprófum.

## Óbreytt öflun / varðveisla

request-manifest.json hér er afrit samþykktrar fyrri URL/query/bbox með nýju attempt-ID. Sama GET GetFeature faerdferlar2017_1 við B2, EPSG:3057, max100 features, 1MiB body, 20s whole-request wall, 0 retry/redirect/probe/HEAD/pagination. URL/hash_basis óbreytt, 50m envelope ekki tolerance. Eitt nýtt sent kall leyft aðeins ef local viðgerðapróf standast; bilun eyðir budgeti og er skráð án frekari tilraunar.

Gamla b2-geometry mappan öll óbreytt (script/marker/report/raw-absence varðveitt); ekki eyða marker til að komast framhjá vörn. Ný raw/ledger/dispatch-marker og wrapper aðeins í b2-retry/. Skoða fyrri result-review JG1-JG4/R1-R3 og approved prompt N1-N4, ekki endurhanna fetch framework eða taka upp ný dependency.

## Lágmarksviðgerð áður en sent er

- Afrita wrapper staðbundið, ekki keyra gamla --dispatch. Nýr atomic O_EXCL dispatch-marker áður en tengst er; tilvist hans eða live ledger/raw hér stöðvar nýja sendingu. Prófanir nota sérstaka task-local temp möppu svo þær eyði ekki live-marker eða masquerade sem upstream.
- Varanleg tilraunarskrá strax við dispatch og eftir getresponse: exact URL, client UTC start/end, state, status/headers ef fengust, server Date aðgreint. Breið Exception-meðhöndlun nær sérstaklega HTTPException/IncompleteRead/BadStatusLine ásamt OSError/timeouts/AttributeError. finally vistar fengna body-búta (partial skýrt), count/SHA og failure_reason; þótt engir bætur berist er ledger til. Ekki grípa SystemExit/KeyboardInterrupt þannig að ný beiðni verði send; interrupted tilraun merkt eins vel og hægt er, marker helst.
- Ekki reiða sig á conn.sock eftir getresponse; Connection: close svar þarf að virka. Catch-all/persistence er nauðsynlegt þótt close-haus sé sleppt. Read í bounded chunks svo bætur sem komu geymist, ekki aðeins eftir EOF. Ólöglegt status getur skilið status UNKNOWN, ekki búa hann til.
- Full transport aðeins þegar Content-Length (ef gefið) passar byte count, og engin timeout/truncation/exception. Aðgreina transport-complete frá evidence-usable: JSON FeatureCollection parse, numberReturned/len(features), numberMatched/totalFeatures þar sem tiltækt, rétta CRS urn:ogc:def:crs:EPSG::3057. numberReturned==100 eða stytt svar ⇒ PARTIAL, engin no-connector ályktun. Ekkert sjálfvirkt follow-up.
- Virkt 20s overall deadline/watchdog og 1MiB stream cap, host allowlist gagnaveita.vegagerdin.is eingöngu, TLS sannprófun, ekkert retry/redirect. Deadline yfir DNS/connect/TLS/headers/read; idle-only timeout ekki nóg. Bæti/hash af varðveittu partial eru raunbætur, ekki full-body hash.

## Focused local próf á keyrsluvél

Built-ins/mock eða 127.0.0.1 eingöngu, engin ný dependency/app test-framework. Sýna rétt body/status/ledger og marker-vörn fyrir: (1) Connection: close eðlilegt svar; (2) truncated chunked/IncompleteRead; (3) bad status line; (4) Content-Length50 en 5 bætur; (5) trickle/slow-header wall deadline; (6) byte-cap overflow; (7) endurkeyrslu sem sendir ekkert; (8) redirect ekki fylgt. Einnig litlir offline JSON/count/CRS validator positive/negative fixtures; prófgögn ekki kölluð raunverulegt B2-svar. Fullnægjandi þegar nauðsynleg villutilvik skila varðveittri ledger/partial og ekkert er falsely complete. Keyrsluvélin er Windows; ekki krefjast Linux-stýringar sem nýrrar forsenda, en catch HTTPException er portable. Skrá exact commands/results. Engin sjálfvirk sending úr self-test, self-test þarf að vera örugg og aðskilin frá --dispatch.

Ef próf/mörk/persistence ófullnægjandi: stoppa fyrir net, skila skýru blocker; ekki eyða nýja call-budgeti til að prófa client gegn upstream. Aðeins eftir grænar local staðfestingar senda eina manifest-beiðni.

## Raunsvar og niðurstaða

Raw bytes/headers/ledger og SHA undir b2-retry. Endurnýta retained baseline16 (2117/2134/2135/36807 × tiers) og samanburðarreglur fyrri approved prompt, ekki sækja baseline aftur. Við gilt fullkomið svar: tafla native endpoints/ID/tier, ný/breytt/retained geometry og hvort literal geometry-path fæst. Engin epsilon/snapping/tier-blöndun, geometry-afleiðsla ekki akstursheimild. Neikvætt eða týnt svar er ekki raunheima-vegaleysi. Við hluta/bilun: engin connectivity-niðurstaða, skila því heiðarlega.

retry-report.md og cc-report.md stutt: viðgerð/próf, actual nýtt dispatch 0 eða1, niðurstaða/caps/SHA/limitations, eitt næsta ákvörðunaratriði. Fyrri attempt verður ekki “successful” með nýja svarinu. Engin B1/C1/önnur box/graph/routeId/UI/server_data/gömul docs breyting. Leyfð skrif aðeins b2-retry/ og CURRENT CRLF. Engin env/credentials/GitHub/commit/push/deploy. Engin app-suite/lint/build; local fetch/validator regression + diff-check nægja. Ekki skilja processes eftir.

CC_IN_PROGRESS fyrir vinnu, CC_COMPLETE með report-path að lokum. Jonesy narrow result review síðan Ripley lokamat; #501 áfram óinnleitt. Þessi lota er eitt nauðsynlegt viðgerð+afla verk, ekki endurtekning á metadata/rannsókn.

Jonesy: APPROVED eða REVISE fyrir R1-R3 lágmarksfix og nýtt óbreytt1-kalls scope. Optional hardening ekki blocker. Engin stækkun geometry/heimilda/kerfishönnunar.

## Jonesy review — umferð 1 (2026-11-17)

**Niðurstaða: APPROVED fyrir R1–R3 lágmarksviðgerð og eina nýja óbreytta B2-beiðni (attempt-2). Engin REVISE-krafa; engin blocker.** Ekki netheimild: kallið krefst áfram approved-prompt frá Ripley, READY_FOR_CC og „Prompt approved“ frá eiganda. Engin net-/GitHub-köll, ekkert keyrt á vél eiganda; allt hér er **sandbox-staðfest (mitt)** nema annað sé sagt.

### Staðfest
- **Beiðnin er óbreytt:** `url`, `decoded_params`, bbox, caps, `encoded_request_sha256` í `b2-retry/request-manifest.json` eru allt sama og í `b2-geometry/request-manifest.json`; `sha256("GET "+url)` = 8719083019b6…35fe ✓. Aðeins `status`, `request_id` (nýtt attempt-ID) og `previous_attempt` breytast — rétt og nægilegt til að aðgreina nýtt 1-kalls budget frá notuðu marker-i.
- **Hver niðurstaða úr umferð 1 (JG1–JG4, R1–R3) hefur beina samsvörun í prompt:** JG1 (Connection: close/`conn.sock` ⇒ „ekki reiða sig á conn.sock“, close-svar prófað, catch-all óháð close-haus); JG2 (HTTPException/IncompleteRead/BadStatusLine/AttributeError gripin; Windows sem keyrsluvél, ekkert Linux-skilyrði); JG3 (full transport aðeins ef Content-Length passar; transport-complete aðgreint frá evidence-usable; `numberReturned==100` ⇒ PARTIAL; CRS-urn staðfest); JG4 (ledger strax við dispatch og eftir `getresponse()`, body-búta vistaðir í `finally`, partial merkt, status UNKNOWN ekki búinn til). Prófunarlistinn (1)–(8) nær nákvæmlega þeim fjórum tilvikum sem ég sýndi í sandbox (close-svar, truncated chunked, bad status, 50/5-bæta body) auk deadline, cap, endurkeyrsluvarnar og redirect.
- **Öryggi og afmörkun er skýr:** nýtt `O_EXCL` marker aðeins í `b2-retry/`; gamla marker/script/skýrslur óbreytt og ekki eytt til að sniðganga vörn; prófanir í sérstakri tímabundinni möppu og aðskildar frá `--dispatch`; ef prófin eru ekki græn ⇒ stoppa fyrir net, ekki eyða budgeti í að prófa client gegn upstream; bilun eyðir budgeti án þriðju tilraunar; engin víkkun, B1/C1, graph, routeId, UI eða server_data.

### Skilyrði/ábendingar (ekki blockerar; setja í approved-prompt ef Ripley vill)
**O1 — prófin keyri sama kóðann og dispatch.** Prófin eiga að kalla nákvæmlega þann `bounded_get` (innflutt úr sömu skrá, ekki afrit) sem `--dispatch` notar, með sömu valkostum nema `require_https`/host í prófum. Í fyrri lotunni fann prófasettið ekki villuna því það keyrði tilvik sem svöruðu ekki með close; nýtt tilvik (1) lagar það, en samsvörun prófs og framleiðslukóða er forsenda þess.
**O2 — orðaforði niðurstöðu og atomic ledger.** Fastur orðaforði í ledger: `complete_usable` / `transport_complete_unusable` (parse/CRS/count mistókst) / `partial` / `failed` / `interrupted`. Ledger skrifað atomic (temp-skrá + `os.replace`) svo hrun í miðri skrift skilji ekki eftir hálft JSON. Sýnt í prófi: ef ledger-skrift sjálf bilar skal það vera hávært (non-zero exit), ekki þögult.
**O3 — staðfesta óbreytt fyrra attempt.** Skrá sha256 af `b2-geometry/dispatch-marker-B2-LOCAL-GEOMETRY.json` og `b2-geometry/b2_fetch.py` fyrir og eftir; sýna að þau eru óbreytt (immutability er í prompt, en án hashs er ekki hægt að sanna það síðar).
**O4 — validator-fixtures.** Jákvætt/neikvætt: JSON með réttu CRS og `numberReturned == len(features)`; rangt CRS; `numberReturned == 100`; `numberReturned != len(features)`; ekki-JSON body. Aðeins `complete_usable` leyfir geometry-samanburð við baseline 16.
**O5 — hvað „neikvætt“ þýðir fyrirfram (óbreytt frá umferð 1):** engin ný feature í boxinu eða aðeins retained 16 ⇒ „B2 ósannað í færðarlaginu“, ekki „enginn vegur“; gap-meðferð er eigandaákvörðun.
**O6 — stöðvunarregla fyrir næsta skref.** Þetta er önnur umferð B2. Ef þetta attempt mistekst líka (tooling eða server), ætti **engin þriðja tilraun** að vera sett af stað án nýrrar, skýrrar eigandaákvörðunar, og Ripley ætti þá frekar að leggja til að hætta B2 (bilið er 34,7 m af 45,7 km, 0,08 %). Skráð hér svo þetta verði ekki sjálfvirkt.

### Athugasemd (valfrjálst)
Ég get ekki staðfest af stöguðum skrám hvernig Vegagerðarþjónninn svarar BBOX+EPSG:3057 (fyrri tilraun skilaði engu varðveittu); líkur á „ekkert nýtt“ eru enn mestar. Ég styð ákvörðun eiganda, enda ódýr og afmörkuð, en hvet ekki til frekari tilrauna ef niðurstaðan verður neikvæð eða týnd.

### Takmörk
Ég hef ekki séð nýja wrapperinn (hann er ekki til enn) og get því ekki staðfest að R1–R3 verði rétt útfærð — prompt-yfirferð nær aðeins til þess hvort kröfurnar séu nægilega skýrar og rétt afmarkaðar; niðurstöður prófa verða yfirfarnar í result review. Keyrsluvélin er Windows; hegðun þar getur verið önnur en í mínum sandbox-prófum (Linux, Python 3.13.18). Engin umferð 2 nauðsynleg fyrir þennan prompt nema Ripley breyti beiðninni eða mörkum.

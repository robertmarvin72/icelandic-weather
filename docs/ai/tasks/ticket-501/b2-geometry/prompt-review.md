# #501 — B2 geometry öflun, prompt review

## Round 1 — Ripley — 2026-11-17

Eigandi samþykkti næsta afmarkaða skref (“ok gerðu það”) eftir lokna offline-gap-check.md: kanna geometry við 34,749m bilið 2117→2135. Engin beiðni send við prompt-gerð. Eitt netkall eftir Jonesy APPROVED, Ripley approved-prompt og eiganda Prompt approved. Þetta heimilar ekki aðra öflun eða leiðarvél.

## Markmið og retained grunnur

2117 exit (392674.357,389846.132) → 2135 entry (392703.5,389865.057), EPSG:3057, bil 34,748670m. Offline athugun fann engan bókstaflega samfelldan endpoint-path í lesnum retained GeoJSON. Stykki 36807 við 2135 er til en staðfestir ekki brú yfir bilið. Gömul raw-sókn á VEGNR=1 getur hafa sleppt connector á öðrum vegi/role; ný spatial-sókn prófar þetta, ekki forsendu um að connector sé til.

Lesa AGENTS/CLAUDE/README/CURRENT, offline-gap-check.md, acquisition-prompt-review.md JD4, request-manifest.json í þessari möppu og retained #499 WFS/#429 DescribeFeatureType. Staðfesta SHAPE/CRS og source endpoints offline. Ekki sækja capabilities/schema aftur. Metadata AKSTURSSTEFNA er annað layer/ID-nafnarými og leysir ekki B2.

## Ein föst beiðni

Nákvæm encoded URL og decoded params í request-manifest.json. BBOX utan um báða punkta með 50m jaðri: 392624.357,389796.132,392753.5,389915.057 í EPSG:3057, um 129×119m. Þetta er leitarsvæði, aldrei snap/bridge tolerance. GetFeature gis:faerdferlar2017_1, output native EPSG:3057, JSON, maxFeatures=100. Engin VEGNR/IDBUTUR/role/tier sía — allir spatial hits innan budget leyfðir, líka ný ID/vegnúmer/tier. Það er samþykkt aukafeatures-regla, ekki óvænt scope. Skilað geometry getur teygt sig út fyrir box; það er eðlileg whole-feature svörun, ekki heimild til að sækja næstu box.

Hámark eitt HTTP GET, 1MiB body stream-cap, 20s raunverulegur wall-timer, 0 retry/redirect/pagination/probe/HEAD. HTTP failures/429/redirect/auth/schema/CRS mismatch/byte-time limit ⇒ skrá og stoppa, ekki stækka box eða endurkeyra. 100 features eða numberMatched>numberReturned/merki um truncation ⇒ partial/truncated, ekki álykta að enginn connector sé til og ekkert annað kall. Fjöldi sentra beiðna telst þótt bilun verði. Ekki endurkeyra ef ledger/raw/dispatch-marker er til.

Endurnýta staðbundið afrit af áður prófuðum bounded_fetch.py/driver.py úr #493 phase2/#499 ef það getur framfylgt nákvæmum mörkum; ekki keyra gamla driver með innbyggðum gömlum requestum. Nýtt lítið built-ins-only wrapper leyft hér, ekki ný dependency. Staðfesta whole-request timeout, stream cap og ledger tilvistarvörn fyrir dispatch; fyrri metadata fetch_schema.mjs er idle-only/non-rerunnable og má ekki endurnýta óbreytt.

## Afhending og hófleg sannprófun

Skrifa hér raw JSON bytes + headers + ledger með actual URL/status/start-end UTC/server Date aðgreind, byte/feature count og SHA256, complete/partial/error. Ófullkomið svar er skráð, ekki notað sem full gagnasöfnun. Við árangur: tafla actual IDFERILL/IDBUTUR/OBJECTID/VEGNR/VEGHLUTI/tier og native endpoints fyrir viðeigandi returned features. Greina nýtt versus retained geometry; sömu ID með breyttum bætum er ný source-útgáfa, ekki endurskrifa gömlu.

Svara nákvæmlega: sýnir þetta svar connector/geometry-path milli beggja B2-punkta eða ekki? Literal endpoint equality eða mæld bil skráð; ekki snapping, epsilon, að skeyta tiers, geometry-reversal sem akstursheimild eða brúa með beinni línu. Ef innri vertex/intersection þarf til að skilja connector má reikna það staðbundið og merkja að það sé geometry-túlkun, ekki heimild um node/topology/löglega átt. Ekki fylla við það sem vantar. CRS 3057 staðfest áður en metrar reiknaðir. Smávægilegur hnitamunur er mældur, ekki sjálfvirkt “tengdur”.

Skrifa b2-report.md með stuttri niðurstöðu og einum næsta ákvörðunarpunkti, cc-report.md með actual köllum/mörkum/skráabreytingum og takmörkunum. Hash/raw/talningar og diff-check nægja; engin app-próf/build/lint eða nýtt prófakerfi. Ekki lofa að þetta klári hringgrunn/B1/C1/akstursstefnu. Enginn sjálfvirkur næsti fetch þótt niðurstaða sé neikvæð.

Leyfð skrif aðeins þessi b2-geometry mappa + CURRENT-lífsferill CRLF. Engar eldri heimildir/#500/server_data/src/api/próf/config/dependency/env/credentials/GitHub/commit/push/deploy breytingar. Fyrri úttekt/metadata PASS varðveitt. CC setur CC_IN_PROGRESS fyrir dispatch og CC_COMPLETE með report eftir; Jonesy result review og Ripley lokamat. PASS aðeins B2-afla/niðurstöðu, ekki #501 innleiðingu eða lokaheimild.

Jonesy: APPROVED eða REVISE fyrir þessa eina beiðni/manifest. Sýndir blockerar aðeins: rangt spatial contract/CRS, óljós budget/regla eða möguleiki á ósönnu connectivity-svari. Valfrjáls landsþekja er ekki krafa. Samþykkt einn request, engin sjálfvirk víkkun.

## Jonesy review — umferð 1 (2026-11-17)

**Niðurstaða: APPROVED fyrir þessa einu beiðni/manifest (B2-LOCAL-GEOMETRY), með skilyrðum N1–N4 sem fara í approved-prompt, ekki endurskoðun á manifestinu.** Engin REVISE-krafa; spatial contract, CRS, budget og regla um aukafeatures eru rétt og nógu nákvæm. Ekki netheimild: eitt kall krefst áfram approved-prompt, READY_FOR_CC og „Prompt approved“ frá eiganda. Engin net-/GitHub-köll, ekkert keyrt á vél eiganda; allt hér er **sandbox-staðfest (mitt)** úr stöguðum retained skrám nema annað sé sagt.

### Staðfest
- **Hnit og box:** 2117 exit (392674,357; 389846,132) og 2135 entry (392703,5; 389865,057) stemma við chain-walks-v4 (steps 4/5); bil 34,7487 m (2D). BBOX 392624,357/389796,132/392753,5/389915,057 = báðir punktar ±50 m nákvæmlega; 129,143 × 118,925 m. Röð `minx,miny,maxx,maxy` (x = austur, y = norður) stemmir við retained native gögn.
- **CRS/snið staðfest sem virkt á þessum þjóni (retained):** `srsName=EPSG:3057` + `outputFormat=application/json` á `faerdferlar2017_1` gaf native hnit með `crs: urn:ogc:def:crs:EPSG::3057` (#485 wfs-extension-native3057.json; #493 phase2 CQL-kall); `BBOX=…,EPSG:4326` á WFS 1.0.0 er varðveitt úr #499 Reykjavík. Samsetningin BBOX+EPSG:3057 er ekki varðveitt orðrétt, en báðir hlutar hafa virkað hvor fyrir sig — áhætta lág, og bilun væri skráð (STOP-regla) en ekki ályktuð sem „enginn connector“.
- **Svar er lítið:** retained VEGNR=1 gögn (#483 `wfs-vegnr1-all.json`, #429 routeA) hafa **16 features** innan boxins (IDFERILL 2117, 2134, 2135, 36807 × 4 tiers; samtals ≈ 34,6 KB). 100 features/1 MiB er ríflegt; áætlaður fjöldi aukafeatures (aðrir VEGNR/hlutverk) kemst auðveldlega innan caps.
- Allar fyrri reglur halda: engin sía, engin víkkun, ekkert snap/epsilon, óviss eða stytt svar ⇒ ekki „enginn connector“.

### Skilyrði fyrir approved-prompt
**N1 — bounded_fetch.py óbreytt uppfyllir EKKI „20 s whole-request wall“ (sýnt).** Retained `ticket-493-place-data-phase2/samples/bounded_fetch.py` notar `http.client … timeout=timeout_s` (per-socket idle timeout, sama galla og JE3), les án deadline-athugunar í lykkjunni, hefur enga dispatch-marker/ledger-guard og leyfir líka host `px.hagstofa.is` í allowlist. Því er „endurnýta ef það getur framfylgt mörkum“ í prompt-review ekki uppfyllt án breytingar. Approved-prompt ætti að segja beint: nýr/patched wrapper (built-ins) með (a) `deadline = monotonic()+20` og socket-timeout endurstillt á `max(0.1, deadline-now)` fyrir hvert read, stöðva við deadline, (b) dispatch-marker búinn til með `O_EXCL` **áður** en tengst er (ef til ⇒ hætta, ekki senda), (c) allowlist eingöngu `gagnaveita.vegagerdin.is`, (d) stream-cap 1 MiB með 1-byte yfirskriftarprófi, (e) staðbundið próf áður en dispatch: retained `ticket-493-endpoint-acquisition/samples/test_server.py` hefur hæg-svör (sleep 1,5 s) — nota það eða sambærilegt til að sýna wall-deadline og cap, án nets. Ef ekki er hægt að sýna (a)–(e) ⇒ CC stoppar fyrir dispatch (þegar skrifað í prompt-review; ég bæti aðeins við að óbreytt skrá nægir ekki).

**N2 — baseline fyrir „nýtt vs retained“ (sýnt):** retained innan boxins: 16 features (2117, 2134, 2135, 36807, hvert í tiers 2/1/0/−1). **2134 er ekki nefnt í prompt-review** en er í boxinu: „Hellisheiði til vesturs“, IDBUTUR 902020037, VEGHLUTI 6; upphafspunktur (392687,724; 389866,716) er 15,863 m frá 2135 entry og 24,5 m frá 2117 exit (næsti vertex). 2117 er „til austurs“ (VEGHLUTI 7). 36807 (VEGHLUTI 5, 113 m) hefur **sama xy í báðum endum** (392703,5; 389865,057; z 34,298→0) — það snertir 2135 entry en hefur engan annan endapunkt við 2117; þetta er geometry-athugun, ekki ályktun um hringtorg/topology. Útkomutaflan ætti að merkja þessi 16 sem retained (bera saman bæti/ID) og telja allt annað nýtt; engin túlkun á 2134 sem akstursheimild.

**N3 — truncation/CRS:** retained JSON hefur `totalFeatures/numberMatched/numberReturned`; regla Ripley er nothæf, en bæta við: `numberReturned == 100` ⇒ partial óháð hinum reitunum, og staðfesta `crs.properties.name == urn:ogc:def:crs:EPSG::3057` áður en mælt er (stoppa annars, ekki umreikna).

**N4 (smátt) — manifest:** bæta við `encoded_request_sha256`, `per_body_cap` og `status` í lokaútgáfu (eins og #499 manifest) og taka fram að URL verði staðfest orðrétt eftir `urlsplit`-prófi fyrir dispatch. Valfrjálst en ódýrt.

### Athugasemd um væntan ávinning (valfrjálst, ekki blocker)
Líklegasta niðurstaðan er **„engin ný feature í boxinu“** eða aðeins retained 16: færðarleiða-lagið er leiðageometría fyrir færðarskýrslur, ekki tengdur netgraf, og bilið er 34,7 m af 45,7 km (0,08 %). Jafnvel jákvæð útkoma sannar ekki löglega tengingu. Raunverulega ákvörðunin um að hylja slík bil (t.d. skjalfest, takmörkuð vegalengdarmörk með eigandasamþykki) er vöru-/eigandaákvörðun sem þetta kall breytir ekki. Þetta er ekki ástæða til að hafna beiðninni (ódýr, afmörkuð, eigandi samþykkti) — en Ripley ætti að skrá fyrirfram hvað „neikvætt“ þýðir: skila B2 sem ósannað í færðarlaginu og vísa gap-meðferð til eigandans, ekki halda áfram með B1/C1 sjálfvirkt.

### Takmörk
Ég keyrði ekkert á vél eiganda og gerði engin net-köll. Ég get ekki staðfest hvernig Vegagerðarþjónninn svarar BBOX+EPSG:3057 fyrr en kallið er sent, né að retained afrit hafi verið óbreytt frá upprunalegu svari (hash er í #500/offline-athugun, ekki endurreiknað hér). Z-gildi (34,298 o.fl.) eru ekki túlkuð. Þetta er fyrsta umferð; engin umferð 2 nauðsynleg nema Ripley breyti beiðninni sjálfri.

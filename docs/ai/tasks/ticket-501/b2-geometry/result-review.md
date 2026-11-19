# #501 B2-LOCAL-GEOMETRY — Jonesy result review

## Jonesy result review — umferð 1 (2026-11-17)

**Niðurstaða: INCOMPLETE (tæknibilun) — ekki PASS á B2-niðurstöðu, því engin niðurstaða er til.** Eina heimilaða kallið er skráð sem notað (dispatch-marker) en svarið var aldrei vistað. Skýrslurnar (`b2-report.md`, `cc-report.md`) eru **heiðarlegar og að mestu réttar** og greina rétt á milli „týnt svar“ og „neikvætt svar“; B2 er hvorki staðfest né hafnað og offline-niðurstaðan úr `offline-gap-check.md` stendur óbreytt. Engin blocker á skýrslurnar sjálfar; hins vegar þarf **R1–R3 hér að neðan áður en nokkur endurtekning er rædd** (ákvörðun eiganda, ekki mín).

Merking: **sandbox** = staðfest af mér úr stöguðum skrám/staðbundnum prófum á 127.0.0.1 (engin netköll út fyrir sandbox, ekkert keyrt á vél eiganda). **CC-eignað** = það sem CC segir um keyrslu á Windows; ég get ekki staðfest það.

### Sandbox-staðfest
- Manifest: `sha256("GET "+url)` = `encoded_request_sha256` (8719083…935fe) ✓; URL og BBOX óbreytt frá umferð 1; dispatch-marker `dispatch_started_utc 2026-11-17T18:38:39Z` hefur **sama URL** og manifest ✓. Engin `raw-B2*`/`request-ledger.json` í möppunni — í samræmi við skýrslu (ekkert varðveitt).
- Retained baseline 16 features (2117, 2134, 2135, 36807 × tiers 2/1/0/−1) stemmir við mína eigin útreikninga úr `wfs-vegnr1-all.json` í umferð 1.
- Utan leyfðs sviðs: `ticket-493-endpoint-acquisition/samples/` hefur enga `__pycache__` og `test_server.py` er óbreytt (mtime 1794425378638) ⇒ hreinsun CC staðfest; `server_data/*` og `api/*` ósnert (mtime ≤ fyrri lotur).
- Mekanisminn að baki hruninu er raunverulegur: með venjulegum `http.client` og `Connection: close` í beiðni+svari er `conn.sock is None` eftir `getresponse()` og `will_close=True` (endurgert á staðbundnum raw-socket þjóni).
- Lagaða skriftan les rétt svar með `Connection: close` og body (mitt próf: outcome complete, 200, 5 B) ⇒ sértæka regression-villan er löguð.

### Athugasemdir (sýndar, flokkaðar)
**JG1 — rótarorsök er CC-eigin beiðnishaus, ekki „þessi þjónn“.** `b2_fetch.py` sendir sjálft `Connection: close` (`conn.putheader("Connection","close")`); sérhver samhæfður þjónn svarar þá með close ⇒ `will_close=True` ⇒ `conn.sock=None` ⇒ AttributeError í lesturslykkju. Villan var því nær örugg við hvert alvöru svar, ekki háð þessum þjóni. cc-report/b2-report orða það sem „apparently triggered by this particular server’s actual response“ — nákvæmara: kallað af eigin haus + endurlesturs `conn.sock`; staðbundna prófið (`test_server.py`) svarar ekki með close og fann þetta því ekki. (Skriftan fyrir lagfæringu er ekki varðveitt; ég get aðeins staðfest að núverandi útgáfa sendir hausinn.)

**JG2 — lagaða skriftan getur enn tapað niðurstöðu (sýnt, sama flokkur bilunar).** Í `bounded_get` eru aðeins `BoundedFetchError`, `socket.timeout/TimeoutError` og `OSError` gripin. `http.client.IncompleteRead` og `BadStatusLine` eru `HTTPException`, ekki `OSError`. Staðbundið próf (127.0.0.1): (a) chunked svar sem lokast áður en lokabút kemur ⇒ `IncompleteRead` sleppur út úr `bounded_get`; (b) ólöglegt status-línu-svar ⇒ `BadStatusLine` sleppur út. Þá hrynur `main()` áður en nokkuð er skrifað — **nákvæmlega sama afleiðing og í B2-lotunni**. Auk þess hrynur `b2_fetch.py --self-test` hjá mér (Linux, Python 3.13.18) í wall-deadline prófinu með `IncompleteRead` eftir að watchdog lokar socket (á Windows gæti sama lokun gefið `OSError`, sem skýrir hvers vegna CC sá 6/6 PASS — **CC-eignað, ekki endurgert af mér**). Wall-deadline-trygging (a) er því háð stýrikerfi/undantekningarflokki.

**JG3 — stutt body er skráð „complete“ (sýnt).** Þjónn sem lýsir `Content-Length: 50` en sendir 5 B gefur `outcome: complete, byte_count 5`, því `resp.read(amt)` skilar tómu við EOF án villu. Slíkt væri skráð sem fullt svar og gæti endað sem ógilt/stytt JSON. Þetta er það sem varðar „ósönn connectivity-svör“: `complete` þarf að krefjast byte_count == Content-Length (ef gefið) **og** að JSON-parse og `numberReturned == len(features)` gangi upp.

**JG4 — enginn undirstöðu-persistence.** Prompt segir „ófullkomið svar er skráð“ og „fjöldi sentra beiðna telst þótt bilun verði“, en skriftan skrifar ekkert (hvorki haus/status né hluta body) fyrr en `bounded_get` hefur skilað. Eldri `bounded_fetch.py` hafði breiða `except Exception` sem ledgeraði alltaf tilraunina; nýi wrapperinn missti þá vörn. Dispatch-marker sannar aðeins að tilraun hófst (hann er skrifaður fyrir tengingu); að beiðni hafi verið send er CC-ályktun af hrunstað — rétt og heiðarlega merkt „indirectly“ í skýrslunni.

### Skilyrði ef eigandi ákveður endurtekningu (R1–R3; ekki heimild)
- **R1 (smæsta nauðsynlega fix):** í `bounded_get` grípa `BaseException`/`Exception` ⇒ `outcome=failed` með `failure_reason=<tegund:texti>`; skrifa `request-ledger.json` (UTC start/end, status, hausar) **strax eftir `getresponse()`** og skrifa body í `finally` (jafnvel hluta) með sha256 og `partial`-merkingu; `main()` hrynur aldrei án þess að ledger sé til.
- **R2:** `complete` aðeins ef Content-Length (ef til) = byte_count, annars `partial/short_body`; síðan JSON-parse + `numberReturned == len(features)` + `crs == urn:ogc:def:crs:EPSG::3057` áður en nokkur geometry-ályktun (N3 óbreytt: `numberReturned==100` ⇒ partial). Íhuga að senda ekki `Connection: close` (óþarft; dregur úr einni bilunarleið) en R1 er það sem skiptir máli.
- **R3:** sýna að `--self-test` standist á þeirri vél sem keyrir (í sandbox/Linux og á Windows) með nýju prófunum: truncated chunked, bad status, short body, close-svar; engin ný upstream prófbeiðni.
- Hvort endurtekning teljist ný heimiluð beiðni eða brot á „0 retry“ er **eigandaákvörðun** (fyrsta kallið skilaði engu varðveittu svari; marker er áfram til og þarf að vera skráður sem sögulegur, ekki eytt).

### Ráðgjöf (valfrjálst)
Bilið er 34,7 m af 45,7 km (0,08 %) og líklegasta niðurstaða er „ekkert nýtt í boxinu“. Hafi eigandi litla þörf fyrir B2 sérstaklega er rökrétt að **hætta B2-öflun** og taka ákvörðun um skjalfesta gap-meðferð sem vöru-/eigandaákvörðun; endurtekning er ódýr en hefur lítið vægi. Ég hvet ekki til sjálfvirkrar endurtekningar.

### Takmörk
Ég keyrði ekkert á vél eiganda og gerði engin net-köll. Prófin mín voru á 127.0.0.1 í sandbox (Linux, Python 3.13.18); hegðun á Windows gæti verið önnur (sjá JG2). CC-eignað og óstaðfest af mér: dispatch var sendur nákvæmlega einu sinni, að svar barst, „6/6 PASS“, git HEAD/status/diff --check. Fyrri útgáfa skriftunnar er ekki til til skoðunar.

### Næsta skref
Ripley lokamat: skrá lotuna sem tæknibilun/INCOMPLETE, B2 ósannað, engin sjálfvirk endurtekning; ef eigandi vill reyna aftur þarf sérstakt samþykki + R1–R3. PASS (ef Ripley velur) nær aðeins til heiðarleika/skráningar þessarar lotu, ekki B2-niðurstöðu.


## Ripley lokamat — 2026-11-17

**BLOCKED / INCOMPLETE — tæknibilun, ekki PASS á B2-niðurstöðu.** Jonesy niðurstaða lesin gegn b2-report/cc-report. Sjálfstætt staðfest manifest GET+URL hash, dispatch-marker til staðar og ekkert request-ledger/raw-svar varðveitt. Fetch-skriftan ekki keyrð hér, engin endurtekning/netbeiðni og engin ný tooling-viðgerð. Að raunbeiðni hafi verið send og svarið borist eru CC-eignaðar upplýsingar studdar hrunstað, ekki sjálfstæð netstaðfesting Ripley.

JG1–JG4 samþykkt sem takmörk: eigin Connection: close haus og conn.sock endurlestur olli villu; núverandi lagfæring er ekki sönnuð fullnægjandi því HTTPException/short-body/persistence bilanir standa eftir. Orðalag “bug fixed” í eldri skýrslu nær aðeins til sérstaka conn.sock regression, ekki allra R1–R3 krafna. Ekki fullyrða að verkfærið sé tilbúið í nýtt kall. R1 varanleg ledger/partial-body skráning við bilun, R2 fullleika/JSON/count/CRS staðfesting og R3 local regression-próf á keyrsluvél eru nauðsynleg áður en nýtt kall verður sent. Engin þörf á að krefja eiganda um Linux-umhverfi til að staðfesta Windows keyrslu; undantekningaflokkar þurfa samt rétt meðhöndlun. Engin ný app-test/build/lint þar sem application óbreytt.

B2 er hvorki staðfest né hafnað; offline-gap-check stendur með sínum takmörkum. Samþykkt 1-kalls budget þessa áfanga talið notað og marker varðveittur. CURRENT BLOCKED merkir hér að áframhald krefjist nýrrar eigandaákvörðunar, ekki að provider eða leið hafi verið sannað ófær. Fyrri metadata/audit PASS óbreytt, #501 óinnleitt.

Eigandi velur: hætta þessari B2-sókn og ræða sérstaklega gagnagatameðferð, eða heimila eina nýja eins-afmarkaða tilraun eftir lágmarks R1–R3 viðgerð og local próf (engin upstream prófköll). Hvorugt gert sjálfvirkt. Ekki fleiri endurskoðunarlotur til að laga skýrslurnar; þær eru heiðarleg afhending bilunar. Engin commit/push/deploy/GitHub aðgerð.

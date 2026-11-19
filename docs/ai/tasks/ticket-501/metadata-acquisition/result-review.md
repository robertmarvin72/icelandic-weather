# #501 metadata-acquisition — Jonesy result review

## Jonesy result review — umferð 1 (2026-11-17)

**Niðurstaða: PASS fyrir afmarkaða öflunarlotu (eitt ROAD-REGISTER-SCHEMA kall), með leiðréttingum JE1–JE3 sem Ripley má laga beint í lokamati/skýrslu; engin blocker, engin umferð 2 nauðsynleg.** PASS nær aðeins yfir þessa lotu: ekki #501 innleiðingu, ekki akstursstefnuheimild, ekki frekari kall.

Merking: **sandbox** = staðfest af mér úr stöguðum skrám (engin net-/GitHub-köll, ekkert keyrt á vél eiganda). **CC-eignað** = sem CC segir um keyrslu á Windows; ég get ekki staðfest það.

### Sandbox-staðfest
- Raw svar `raw-ROAD-REGISTER-SCHEMA.xml`: 3 815 B, SHA-256 `33b7405c…8b72cb` stemmir við request-ledger.json og cc-report.md; XML Schema fyrir nákvæmlega `vegakerfi_ist120_2024_1Type` (rétt layer, ekkert óvænt). Ledger: URL stemmir orðrétt við samþykkta prompt (`typeName=gis%3Avegakerfi_ist120_2024_1`), GET, HTTP 200, `text/xml`, server Date 2026-11-17 18:10:16 GMT aðgreind frá client_start/end (18:10:16,879/,917Z), 37 ms, outcome complete, 0 redirect/retry í kóða; streaming 262 144 B cap í `fetch_schema.mjs`; aðeins eitt kall skráð (ledger hefur eina færslu).
- Forval staðfest: retained #499 capabilities listar layerið með vegaskrá-Abstract; N1–N3 virt (ekkert capabilities, ekkert faerdferlar-kall, ekkert docs-GET).
- Aðrar skrár ósnertar (mtime): server_data/*, api/*, ticket-500, fyrri ticket-501 skrár (audit-report, plan, result-review o.fl.); aðeins `metadata-acquisition/`, metadata-request-proposal.json og CURRENT eru ný/breytt.
- Cross-layer kóðataflan er rétt endursögð: `docs/planning/nature-roads-source-2026-10-28/extracted-text.txt:224–229` (−1 einstefna á móti stefnu línu, 0 óþekkt, 1 einstefna með, 2 tvístefna; „Stefna línu sýnir hvernig hún er teiknuð“) og source-note.md:19; PDF SHA-256 `4e2845cf…59fa7` stemmir. Þetta er **sama lag-fjölskylda (ÍST120), ekki sama lag**.
- Reitasamanburður (mín talning): 22 af 28 frumefnum eru nafnalega eins í báðum lögum (þ.m.t. AKSTURSSTEFNA, EININGVEGAKERFIS, VEGFLOKKUN, VEGTEGUND, SLITLAG, HRADI, BREIDD, HEIMILD, dagsetningareitir); aðeins í vegakerfi: ARSLITLAG, DAGSGRUNNUR, IDKAFLI, KAFLANR, OBJECTID, VEGNR; aðeins í náttúruvegum: IDVEGUR, OPIDFRA/OPIDTIL, ATHS, NRSVEITARFELAG, HEITISVEITARFELAG, DAGSSTJORNARTIDINDI, NRUTGAFA. Enginn from/to-hnútareitur í hvorugu ⇒ CC rétt.
- `AKSTURSSTEFNA` finnst í `docs/` aðeins í nature-roads skjölunum og nýju lotuskránum — fullyrðing CC um „fyrsta stefnu-nefnda reit“ stenst innan docs/ (ég grepaði ekki src/api).

### Leiðréttingar (lágar, ekki blockerar)
**JE1 — „ANSWERED (strongly suggested)“ er of sterkt orðalag.** Rétt staða A er tvískipt: **A1 tenging/hnútar (from/to): ekkert í schema — svar er „enginn slíkur reitur í þessum tveimur lögum“**, ekki að enginn heimild sé til; **A2 ferðastefna: reitur til (`AKSTURSSTEFNA`, xsd:decimal, nillable), merking fyrir *þetta* lag óskjalfest í retained gögnum — UNKNOWN með sterkri vísbendingu**, og jafnvel sú merking sem til er (systurlag) er geometry-afstæð einstefna, ekki löggild stefna. CC sjálf sýnir fyrirvarann í texta; aðeins fyrirsögn/„Niðurstaða“ ætti að segja PARTIAL/UNKNOWN-semantics, ekki ANSWERED. Athugið einnig að kóðalistar eru lag-sértækir í öðrum reitum: VEGFLOKKUN-taflan í nature-PDF sýnir aðeins 5 og 12, sem getur ekki átt við landsvegaskrá í heild — því er „sömu kóðar“ líkleg en óstaðfest forsenda fyrir AKSTURSSTEFNA, ekki fullyrðing.

**JE2 — talning:** schema hefur **28** frumefni í sequence (OBJECTID + 26 eigindi + SHAPE), ekki 27 eins og metadata-report/cc-report segja; taflan í metadata-report hefur þó alla reiti (engin úrfelling). Óveruleg talningavilla.

**JE3 — timeout og endurkeyrsla í `fetch_schema.mjs`.** `req.setTimeout(20000)` er **socket-idle** timeout, ekki „20 s whole-request wall“ eins og samþykktur prompt og cc-report segja; hægfara svar gæti farið yfir 20 s. Engin áhrif hér (37 ms, kallið kláraðist), en cc-report ætti ekki að segja „wall timeout enforced“. Auk þess hefur skriftan **enga endurkeyrsluvörn**: ef einhver keyrir hana aftur sendir hún annað kall og **skrifar yfir** retained raw + ledger (prompt: „do not repeat“). Lágmark: Ripley/CC skráir að skriftan sé executed/non-rerunnable og ekki endurnýtt án nýs wall-timers; valfrjálst að bæta guard (hætta ef ledger er til). Ekki blocker, kallið var eitt.

### Hvað niðurstaðan þýðir fyrir #501 (mín skoðun, valfrjálst)
1. **Seam-gapin B1/B2/C1 lokast ekki af þessum reit.** AKSTURSSTEFNA fjallar um einstefnu m.t.t. teikniáttar, ekki um það hvort tvö stykki með 0,234/34,749/42,302 m bil tengist. Engin tengingarheimild fannst í hvorugu laginu ⇒ næsta skref fyrir bilin er enn rökstudd geometry-/offline raw-athugun (JD4), óháð stefnu.
2. **Gildi AKSTURSSTEFNA á Hringvegi er líklega aðallega 2 (tvístefna)** — það er tilgáta, ekki mælt; þess vegna er verðmæti næsta kalls óvíst. Ég styð valkost 1 (eigandi/Ripley útvegar gagnabók/PDF fyrir `vegakerfi_ist120_2024_1`, núll net) áður en nokkurt GetFeature er rætt. Valkostur 2 (GetFeature) þarf eigin áætlun: nákvæm URL, `propertyName=`/CQL-afmörkun (t.d. `VEGNR` með þekktu gildi — athugið að vegakerfi og faerdferlar nota ólík ID-nafnarými (IDKAFLI vs IDFERILL/IDBUTUR), join á VEGNR/KAFLANR væri ályktun), feature/byte-cap, og fyrirfram regla um hvað ákvörðun breytist við hvert gildi. Ekki heimilt í þessari lotu.
3. Tillaga um eigandaákvörðun: ef ekkert gildi AKSTURSSTEFNA breytir innleiðingunni (R1 er tvístefna, `direction_grade: INFERRED` er áfram birt takmörkun), gæti verið rökrétt að **hætta stefnuleit hér** og setja fókus á geometry/gap-ákvarðanir. Þetta er ráðlegging, ekki skilyrði.

### Takmörk
Ég keyrði ekkert á vél eiganda og gerði engin net-köll. CC-eignað (ekki staðfest af mér): „Prompt approved“-ferill, CC_IN_PROGRESS, git HEAD óbreytt, `git diff --check` hreint, git status, að kallið hafi verið sent nákvæmlega einu sinni (ledger sýnir eitt, en ég sé ekki netlög). Ég get ekki staðfest að skjalið í `docs/planning/…` lýsi núverandi þjónustu (source-note segir sjálft að „2022_1“ sé ekki staðfest útgáfudagsetning) né að merking gildi fyrir `vegakerfi_ist120_2024_1`.

### Næsta skref
Ripley lokamat (leiðrétta JE1–JE3 í metadata-report/cc-report eða skrá þær sem athugasemdir); PASS lokar aðeins þessari lotu. Engin sjálfvirk frekari öflun; allar ákvarðanir um GetFeature/PDF/Phase G eru eigandans.


## Ripley lokamat — 2026-11-17

**PASS fyrir afmarkaða metadata-öflunarlotu, með skráðu JE3-fráviki.** Jonesy PASS lesið; JE1/JE2 orðalag/talning leiðrétt beint í metadata-report/cc-report. Sjálfstætt staðfest raw 3815 bæti, SHA256 33b7405c11b4272382dcfd9f31e82f4ab0f15cab8d03ce25128a6af0468b72cb, XML sequence 28 reitir og AKSTURSSTEFNA til. Engin script-keyrsla/netbeiðni við lokamat; git diff --check keyrt, engin application-próf/build/lint því aðeins skjöl. Ledger/eitt sent kall og 37ms eru CC-eignaðar keyrsluupplýsingar, ekki sjálfstæð netstaðfesting Ripley.

A PARTIAL: A1 enginn from/to-reitur í skoðuðu schema, ekki algild fjarveruályktun. A2 lag-sértæk merking UNKNOWN, systurlags-PDF vísbending. AKSTURSSTEFNA leysir ekki samskeytabil og eitt GetFeature-gildi sannar ekki merkingu. JE3 socket-idle ekki wall; skrifta executed/non-rerunnable, ekkert keyrt aftur og engin heimild til endurnotkunar. Frávik raunverulegt en engin observed overrun á loknu kalli; ekki blocker á afhendingu staðreyndanna.

CURRENT CLOSED aðeins þessi lota. #501 óinnleitt, engin ný öflun/graph/routeId eða Github-lokun. Næsta rökstæða skref er offline athugun retained raw fyrir B1/B2/C1 áður en frekari geometry-kall er rætt; eða eigandaveitt lag-sértæk gagnabók ef þegar tiltæk. Hvorugt framkvæmt sjálfvirkt hér. Engin önnur review-umferð, commit/push/deploy/GitHub aðgerð.

# #501 B2-LOCAL-GEOMETRY-ATTEMPT-3 — Jonesy result review

## Jonesy result review — umferð 1 (2026-11-17)

**Niðurstaða: öflunin sjálf PASS; niðurstöðukaflinn („enginn bókstaflegur connector milli 2117 og 2135“) er RANGUR — NOT PASS aðeins vegna hans (JI1).** Ripley getur leiðrétt `final-report.md`/`cc-report.md` beint í lokamati (eins og í fyrri lotum); engin ný keyrsla, ekkert nýtt net-kall og engin fjórða tilraun er nauðsynleg til að svara B2.

Merking: **sandbox** = staðfest af mér úr stöguðum skrám og staðbundnum prófum (ekkert net, ekkert keyrt á vél eiganda). **CC-eignað** = sem CC segir um keyrslu á Windows. Öll hnit eru native EPSG:3057 og samanburður er bókstaflegur 2D-jöfnuður (engin snapping, epsilon eða tier-blöndun).

### Sandbox-staðfest: öflun og vistun
- Raw `.bin` 36 267 B, SHA-256 `34bd1d01…0123` stemmir við ledger; HTTP 200, `complete_usable`, `crs = urn:ogc:def:crs:EPSG::3057`, `numberReturned = numberMatched = totalFeatures = 20` (ekki stytt, langt undir 100). Marker `2026-11-17T19:17:50Z`, URL = manifest; server Date 19:17:49 aðgreind frá client tíma.
- **Host-fixið virkar:** sama URL og skilaði 400 tvisvar skilar nú 200 (staðfestir JH1). `diff b2-retry/b2_fetch.py b2-final-attempt/b2_fetch.py`: eina hegðunarbreytingin er eydd lína 271 `putheader("Host", …)`; restin eru docstring/attempt-ID/ný próf (ég las ekki hverja athugasemd línu fyrir línu). `--self-test` á minni Linux/Python 3.13.18: **14/14 PASS**, þar með rauð/græn Host-prófið (RED=2 Host-línur á óbreyttri attempt-2, GREEN=1).
- Óbreytt fyrri tilraun: mtime á `b2-retry/` (script, marker, ledger, raw) og `b2-geometry/` (script, marker) óbreytt frá fyrri lotum (hash-samanburður CC er CC-eignaður).
- 20 features = 5 IDFERILL × 4 tiers. **16 retained features (2117, 2134, 2135, 36807 × 4) eru nákvæmlega eins og retained gögn** (properties og öll geometry jöfn við `ticket-483/…/wfs-vegnr1-all.json`); **4 ný** (IDFERILL 2310, IDBUTUR 902410037, VEGNR 38, „Hringvegur-Þrengsli“, VEGHLUTI 1; OBJECTID 1068/2685/4227/5745), aldrei í neinni retained skrá (leitað í öllum retained JSON). CC rétt um þetta.

### JI1 — rangt: „ekkert bókstaflegt connector-samband“ (sýnt, afgerandi)
CC (og `offline-gap-check.md`) báru aðeins saman **endapunkta** features (upphaf/endi). `36807` er ekki „degenerate/zero-length“ eins og final-report segir: þetta er **lokaður 113 m hringur** (upphaf = endi, 6 hornpunktar í tier 2/1/0, 16 í tier −1) sem ég benti á í umferð 1 (113 m, sama xy í báðum endum). **Innri hornpunktar hans eru bókstaflega (0,0 m) allir lykilpunktarnir:**

| Hornpunktur í 36807 (tier 2) | Hnit | Bókstaflega jafnt við |
|---|---|---|
| v0 = v5 (upphaf = endi) | (392703,5; 389865,057) | **B = endir 2135** |
| v1 | (392687,724; 389866,716) | upphaf 2134 |
| **v2** | **(392674,357; 389846,132)** | **A = endir 2117** |
| v3 | (392682,8404; 389832,0355) | upphaf 2310 (nýtt, VEGNR 38) |
| v4 | (392710,637; 389838,42) | (enginn annar endapunktur) |

Þetta gildir í **öllum fjórum tiers** (í tier −1 eru fleiri hornpunktar en sömu A, B, 2134-upphaf og 2310-upphaf eru þar bókstaflega). Þ.e.: **bókstafleg (0,0 m) hornpunkta-keðja 2117 → [36807] → 2135 er til** í geometry, í bæði nýja svarinu og í retained gögnum (hringurinn í `wfs-vegnr1-all.json` er eins og í nýja svarinu og hefur A og B sem hornpunkta). CC bar saman endapunkta og taldi 36807 „snerta aðeins B“; það er rangt — hann snertir A sem **innri** hornpunkt.

Geometry-staðreyndir (mælt, tier 2): hringurinn er **rangsælis** (shoelace +852 m², x=austur, y=norður); lengd 112,956 m. Frá A að B eftir hringnum **í teiknistefnu** (A→v3→v4→B) = **72,549 m** (tier −1: 79,066 m); öfugt (A→v1→B) = 40,406 m (tier −1: 42,479 m); bein lína A–B = 34,749 m. Aðrir armar á hringnum: 2134 (vestur, út), 2310 (Route 38, suður), 2135 (austur/Selfoss) og 2117 (inn).

**Túlkun (merkt sem slík, ekki heimild):** hringur með fjórum örmum, rangsælis, og 2117/2134/2135/2310 enda/byrja á honum, er mjög í samræmi við **hringtorg**; í hægri umferð er rangsælis stefna rétt. Það er geometry-ályktun, **ekki** staðfest topology, löglega akstursstefna, né að 36807 (VEGHLUTI 5) sé „hringtorg“ í gagnaskrá. Hvort leiðin A→B eigi að teljast 72,549 m (hringstefna) eða 34,749 m bil er **ákvörðun Ripley/eiganda**, ekki niðurstaða mín. Vísbending (reikningur, ekki ákvörðun): ef 34,749 m bilið í `cw_long` er skipt út fyrir 72,549 m hringleið bætast +37,80 m við R1→Selfoss (45 740,46 → ≈45 778,26 m) og við R1→Hella; B1 0,234 m er óbreytt.

Af hverju missti þetta af: `offline-gap-check.md` skráði sjálft „endpoint-only, engin innri vertex“ sem takmörk; lotan afritaði aðferðina. Ég missti líka af því í umferð 1 (N2 sagði „snertir 2135 entry en hefur engan annan endapunkt við 2117“ — ég skoðaði endapunkta; innri hornpunktur A lá í retained gögnum allan tímann). **Svarið við B2 lá því þegar í retained gögnum;** nýja svarið bætir við 2310 sem bókstaflega tengdum hringnum (v3) og staðfestir hringinn í ferskri, óstyttri útgáfu.

### Aðrar athugasemdir (lágar)
**JI2 — „36807 degenerate/zero-length“** í final-report-töflu er rangt (113 m hringur) — leiðréttist með JI1.
**JI3 — „coordinates identical across tiers (confirmed directly)“** er rangt: tiers hafa mismunandi fjölda hornpunkta (t.d. 2117: 207/72/24/11) — **endapunktar** eru eins í öllum tiers; fullyrðingin stenst aðeins um endapunkta og lykilhornpunkta hringsins.
**JI4 — „sama niðurstaða og offline-gap-check“** stenst ekki (sjá JI1); „B2-sókn stöðvuð“ er rétt og ekkert af þessu krefst frekari öflunar.

### Ábending um B1/C1 (mín skyndiathugun á retained, ekki niðurstaða)
Sama endapunkta-takmörk gætu gilt: í retained `wfs-vegnr1-all.json` (tier 2/1) er **B1** upphafspunktur 2071 (369350,3714; 400623,7933) bókstaflega **innri hornpunktur nr. 1** í 1735 (4 hornpunktar), og „exit“ 1735 (369350,568; 400623,6659) er fyrsti hornpunktur hennar — 0,234 m „bilið“ er þá fyrsti stubbur 1735 sjálfrar, ekki bil milli tveggja ótengdra stykkja. **C1:** 3768-exit (403269,528; 383219,0345) er innri hornpunktur í stykki 3454 (tier 2/1) og 3767-entry er síðasti hornpunktur 3767; ég fann ekki bókstaflegt samband milli 3454 og 3767 í skyndiathugun, svo C1 er óleyst á hornpunkta-stigi. Mæli með að Ripley endurgeri B1/C1 athugunina á **hornpunkta-stigi úr retained gögnum (núll net)** áður en nokkur frekari öflun er rædd.

### Takmörk
Ég keyrði ekkert á vél eiganda og gerði engin net-köll; prófin mín voru á 127.0.0.1/fake-socket í sandbox (Linux, Python 3.13.18). Hvorki löglega akstursstefna, hringtorgs-merking né notkun hringleiðar í vöruútreikningi eru staðfest — aðeins bókstafleg geometry-snerting. CC-eignað og óstaðfest af mér: eitt dispatch, hash-samanburður á fyrri möppum, að 14/14 hafi keyrt á Windows, git HEAD/status/diff --check. Skyndiathugun mín á B1/C1 er ekki fullrannsökuð.

### Næsta skref
Ripley lokamat: leiðrétta niðurstöðukafla (JI1–JI4) — B2 er geometry-bókstaflega tengt í gegnum 36807-hringinn (A og B bæði hornpunktar), hringleið 72,549 m (tier 2) í stað 34,749 m bils; engin fjórða tilraun; gap-/hringleiðameðferð í leiðaútreikningi er eigandaákvörðun (geometry er ekki akstursheimild). Mælt: endurgera B1/C1 á hornpunkta-stigi offline.


## Ripley lokamat — 2026-11-17

**PASS eftir beinar JI1–JI4 niðurstöðuleiðréttingar.** Öflun tókst; hrátt svar SHA/CRS/20features staðfest sjálfstætt. Python athugun staðfesti A/B hornpunkta í 36807 í öllum4 tiers og retained geometry-jöfnuð hringsins við sama OBJECTID; STUTTNAFNLEIDAR er encoding-frávik í nýja svarinu og því ekki fullyrt property-bæta-jafnt; lokaður hringur ekki zero-length. Per-tier lengdir reiknaðar og skráðar í leiðréttu final-report. Fyrri CC-skýrsla final-report-cc-before-ripley.md varðveitt óbreytt, en niðurstaða hennar “no connector” afturkölluð. B2 geometry-tenging til, akstursheimild/topology ekki staðfest. Engin runtime-gap meðferð ákveðin.

14/14 local-próf/eitt dispatch CC/Jonesy-eignað, ekki endurkeyrt af Ripley; engin net/fetch-keyrsla. Diff-check eftir skjalaleiðréttingar. Fyrri endpoint-only offline niðurstaða takmörkuð, ekki almenn fjarverusönnun. B1/C1 vertex ábendingar Jonesy ófullrannsakaðar hér, engin sjálfvirk ný lota. CURRENT CLOSED fyrir síðustu B2-lotu, B2-sókn stöðvuð varanlega samkvæmt eigandaákvörðun (engin fjórða tilraun). #501 óinnleitt og GitHub ekki lokað. Engin app-data/code/test/build/commit/push/deploy.

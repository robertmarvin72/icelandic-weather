## Jonesy result review — umferð 1 (2026-11-18)

**Verdict: PASS. Engir blockerar.** Handler, loader og dataset uppfylla approved-prompt-v1 + P1–P6. Fimm valfrjáls atriði (OP1–OP5), öll prófagöt eða smáatriði — ekkert þeirra stoppar afhendingu. Ég les þetta sem tillögu að lokamati; lokamat er Ripley/eiganda.

Merking: **[sandbox]** = keyrt af mér í skýjasandbox (Node 22, afrit af repo, eigið vitest v3 utan repo; ekkert net, ekkert á vél eiganda). **[CC]** = fullyrt af CC á Windows, óstaðfest af mér.

### 1. Sandbox-staðfest

1. **Raunverulegt handler-kall gegn raundata, öll 20 röðuð pör** (5 mappaðir endapunktar): öll `200 geometry_only`, `Cache-Control: no-store`, `drivingAccess: "UNVERIFIED"`. Lengdir bera saman við mína óháðu Python-Dijkstra á hráum tier-2 gögnum: max munur 2,3e-10 m. Dæmi: R1→Selfoss 44 984,770378; R1→Hella 80 630,947828; Selfoss→Hella 35 646,177449; E1→S2 24 148,860881 (fer ekki út á ferjubryggju); R1→E1 615 333,340381; R1→S2 639 482,201262.
2. **Coordinates samfelld og samsvara slices:** óháð summa `coordinates` = `lengthM` = summa `slices[].lengthM` í öllum 20 (≤1e-9). **0 af 3 140 samliggjandi hnitapörum** eru tvítekin (samskeytapunktur sleppt, P5). XY-runa svars = XY-runa míns Dijkstra-slóða í prófuðum pörum.
3. **119 vs 121 slices (R1→E1):** skýrt — mínir „pieces“ eru óunnin edge-runur; kjarninn velur eina línu (lægsta sourceId) fyrir samsíða edges á sama XY-par (t.d. 3591 í stað 16641 á einum bút, 8676/3737 á Selfoss-enda). XY-slóðin er samt nákvæmlega sú sama. CC-talan 119 stenst.
4. **Dataset óháð:** 255 línur / 946 hornpunktar; sourceId-sett = tier-2 í hráskránum (249+6, 0 tvítekin IDFERILL); hver lína: hnit x/y/z, veghluti, name, idbutur stemma við hrá 0 frávik. `sources[].sha256` stemma við raunverulegar hráskrár. **`build-pilot-dataset.mjs` keyrt í afriti ⇒ byte-identical `winter-route-geometry-pilot.json`** (154 142 B). Endapunktar = pinnuðu hnitin (R1 1436 vestri endi, Selfoss 2138 exit_coord, Hella 3591 exit_coord, E1 2344 start, S2 2894 end).
5. **Villu-/jaðartilvik:** vantar from/to → 400 `missing_param` (+`field`); tómt/fylki/tala → 400 `invalid_param`; óþekkt/`constructor`/hástafir/bil → 400 `unknown_place_id`, aldrei endurspeglað; erfður (prototype) `from` → `missing_param`; POST/OPTIONS/HEAD → 405; ómappað þekkt → 200 `unsupported/endpoint_mapping_unavailable`; `keflavik→keflavik` → `unsupported`, ekki same_place (P6); `selfoss→selfoss` → `same_place`, `slices: []`, lengd 0. **Allar 56×56 = 3 136 samsetningar:** 20 geometry_only, 5 same_place, 3 111 unsupported/endpoint_mapping_unavailable, 0 villur. ~6 ms/kall (loader les+hash-ar 154 KB á hvert kall; P6 bað ekki um cache), stærsta svar 43,7 KB.
6. **Raunverulegt vitest (v3, utan repo, óbreytt prófaskrár): 8 skrár / 101 próf PASS** — geometry-api 20, geometryDataset 11, geometryComposition 23, winter-route 20, cache 9, routes 12, segments 3, winterRouteRoutes 3. Heildartala CC (101/8 skrár) stenst; **merkimiði CC „geometryComposition 50“ er rangur (23 próf)**.
7. **`vercel.json`:** `functions."api/**/*.js".includeFiles = "server_data/**"` til staðar ⇒ P4 rétt, engin breyting þörf. `process.cwd()`-mynstur eins og `campsites.js`. Listing á vél (aðeins `api/`, `docs/ai/tasks/ticket-501/`): engar eldri winterRoute-/api-skrár með nýjum mtime (`vercel.json`/`server_data` aðrar skrár ekki mtime-skoðaðar; vercel.json innihald lesið); geometryComposition.js/.test.js óbreytt (mtime 1795021876964 / 1795022307916); nýjar skrár aðeins þær fimm + build-skripta + docs.
8. **Mutation (21 stökkbreytingar á handler/loader, prófin keyrð óbreytt):** 13 fellt, 8 lifa:
   - Fellt: own-key guard (M1), `from===to` ómappað → same_place (M2), 500 → 200 (M5), `lengthNote` (M6), `no-store` (M7a), `drivingAccess` (M8), reverse-slice ekki snúið (M9, 4 próf), vantar `to`-check (M10), 405 (M12), z→0 (M13), same_place coordinates (M14), reason (M15), lines úr datasetVersion-hash (L1).
   - Lifa (sjá OP1–OP4): M3 samskeytapunktur ekki sleppt, M4/M4b veghluti/name → null, M11 óþekkt `from` ekki athugað, M16 fylki/tómt gefur annan villukóða (sama 400), M17 `value` endurspeglað í 400, L2 endapunktar úr datasetVersion-hash, L4 CRS-athugun fjarlægð.

### 2. P1–P6

- **P1** ✔ öll 20 pör svara geometry_only (ekki 3-para listi); raunlangt R1→E1 próf (>100 slices); disconnected_graph með injected tilbúnu dataset.
- **P2** ✔ (virkni) veghluti/name join-að á hverja slice, aldrei notað í leiðarval; raun-svör hafa gildi (sandbox). Prófið sjálft fullyrðir aðeins að lykill sé til — OP2.
- **P3** ✔ build-skripta task-local, keyrð byte-identical; `datasetVersion` afleitt við hleðslu, ekki geymt, ekkert Date.now/random; endurbyggingarpróf úr hrá.
- **P4** ✔ engin vercel.json-breyting.
- **P5** ✔ (virkni) `lengthNote` til staðar; samskeyti sleppt; Z ekki „leiðrétt“. Prófin verja ekki samskeyti — OP1.
- **P6** ✔ unmapped-same → unsupported; 500 með injected bilun; engin perf/cache vinna.

### 3. Valfrjáls atriði (ekki blockerar; „Prompt approved“ þarf ekki að bíða)

- **OP1 (prófagat, P5):** ekkert próf ver „sleppa samskeytapunkti“ — stökkbreyting `startAt = 0` fer í gegn í öllum 31 prófum (summur óbreyttar því núll-lengd). Smæsta lagfæring: eitt próf á raunsvari: `coordinates.length === Σ(|toIndex−fromIndex|+1) − (slices−1)` og engin samliggjandi tvítekin XY. Raunúttak í dag er rétt (0 tvítekin).
- **OP2 (prófagat, P2):** `toHaveProperty("veghluti"/"name")` samþykkir `null`. Smæsta lagfæring: `expect(s.veghluti).toEqual(<gildi úr dataset-línu>)` fyrir einn raun-slice.
- **OP3 (prófagat, P6):** engin próf fyrir óþekkt `from` með gilt `to` (M11), né að `from`-gildi sé ekki endurspeglað (M17; núverandi próf nær aðeins `to`); fylki/tómt prófað á status en ekki `invalid_param`-kóða (M16, nær jafngilt).
- **OP4 (loader):** `datasetVersion` er í kóða reiknað yfir `endpoints`, en ekkert próf sýnir að breyting á endapunkti breyti því (L2); CRS-athugun er hulin af schema-invalid fixture sem bilar líka á `lines: []` (L4). Loader athugar ekki hverja línu/vertices — slæm lína gefur almennt `500 winter_route_geometry_error` í handler (ekki fabricated 200), ásættanlegt fyrir pilot.
- **OP5 (smáatriði):** (a) `KNOWN_PLACE_IDS` lesið við import — vanti `winter-route-places.json` springur modúllinn í stað JSON-500 (sama mynstur og aðrir endpoints, `places.json` er í sömu `includeFiles`); (b) `same_place` skilar `z: null` þótt hornpunkturinn hafi Z (Selfoss 16,877 í leiðarsvari) — skjalfest „z ?? null“-hegðun en ósamræmi milli staða í svari; (c) `cc-report.md` merkir composition „50“ próf — á að vera 23 (heild 101 rétt); (d) HEAD/OPTIONS → 405 (samræmist prompt: aðeins GET).

### 4. Takmörk þessa review

- Ekki keyrt af mér: ESLint, `git status`/`git diff --check`, Windows-vitest, vafri, raunverulegt Vercel-deploy/`includeFiles`-pökkun — **[CC]**-eignað eða óstaðfest. Ég sé ekki hvort `server_data`-JSON pakkast í Vercel function; aðeins að `includeFiles`-mynstur nær yfir slóðina.
- Staðfesti ekki akstursheimild, stefnu eða lögmæti: geometry ≠ topology ≠ driving authority; veghluti 6/7-reverse slices eru **ekki** flaggaðar (skjalfest takmörk í contract-note, ályktað mynstur).
- Aðeins 5/56 staðir mappaðir; fast tier-2 skurður; engin UI/#502/#503-tenging; #501 ekki lokað.
- Engin ný umferð opnuð; ef OP1–OP3 verða að lagfæringu er það ein þröng CC-lota, ekki þriðja review-umferð án eiganda.

**Next:** Ripley lokamat (PASS tillaga; OP1–OP3 valfrjáls herðing að mati Ripley).


## Ripley lokamat — 2026-11-18

**PASS fyrir afmarkað geometry-only backend API.** Jonesy PASS og OP1–OP5 lesið gegn approved-prompt/CC report og raun handler. Enginn sýndur blocker í afhentu scope; valfrjáls prófagöt eru ekki ný correction-lota. Engin þriðja umferð eða viðbótarherðing heimiluð sjálfvirkt.

Sjálfstætt raun-Vitest4.1.10: `npx vitest run api/winter-route-geometry.test.js api/_lib/winterRoute/geometryDataset.test.js api/_lib/winterRoute/geometryComposition.test.js api/winter-route.test.js api/_lib/winterRoute/routes.test.js api/_lib/winterRoute/segments.test.js api/_lib/winterRoute/cache.test.js src/lib/winterRouteRoutes.test.js` — **8 skrár / 101 próf PASS**, exit0. Sjálfstætt ESLint ný endpoint/test/loader/test og task-local builder hreint. Source-read staðfestir strict known-place validation, unmapped unsupported, no-store, actual loader/composer/coordinate/slice result og drivingAccess UNVERIFIED. Engin live netbeiðni/deploy eða fetch-script keyrt í lokamati.

`git diff --exit-code` á gamla winter-route endpoint, routes/segments/cache/roadFetch/forecastFetch, WinterRoute.jsx/frontend route-lista, vercel.json/package/lock staðfestir engar tracked breytingar; git status sýnir einungis áður tilkomnar geometry-core skrár og leyfðar nýjar geometry API/dataset/task skrár ásamt CURRENT. Diff-check hreint. Núverandi includeFiles server_data/** er repo-stuðningur fyrir bundling, ekki staðfest deployment; engin deploy-heimild.

OP1–OP4 og OP5a/b samþykkt sem skráð valfrjáls test-/pilot-takmörk, ekki gallað requested behavior samkvæmt raunathugunum Jonesy/green integration. Engar application/test breytingar frá Ripley í þessari yfirferð. OP5c: merkimiði CC “composition50” leiðrétt í viðauka — composition sjálf23, routes/segments/cache/frontend-contract saman voru50 í fyrri5skráa lotu; núverandi8skráa heild101 er rétt. Ekki kalla þetta full#501.

Afhent GET /api/winter-route-geometry tekur from/to, skilar geometry_only/same_place/unsupported, native EPSG3057 og UNVERIFIED;5/56 mappings, allar20 ólíkar raðtvenndir eru geometry en ekki akstursheimild. Hin51 þekkt ID skila unsupported; staðalista ekki fækkað. Fullur hringvalkostur/akstursstefnur/öll56/UI/#502/#503 og Vercel runtime sannprófun eru ekki afgreidd í þessari lotu. Engin gömul fixed-route samningsbreyting.

CURRENT CLOSED fyrir geometry-api undirlotu, #501 ekki lokað á GitHub og ekki fullinnleitt. Enginn nýr prompt eða scope sjálfvirkt. Engin commit/push/deploy/GitHub breyting.

# #501 — read-only úttekt á leiðasamsetningargrunni, 2026-11-17

Heimild: `docs/ai/tasks/ticket-501/approved-prompt-v1.md` (Jonesy
APPROVED umferð 1 með bindandi JA1; Ripley 2026-11-17). Þetta er
**read-only úttekt**, ekki leiðarvélarinnleiðing. Engin kóða-/vörugagna-
breyting, netöflun eða GitHub-aðgerð í þessari lotu. Git-staða fyrir og
eftir óbreytt — sjá `cc-report.md`.

## 1. Núverandi data-flow / endpoint / cache-samningur

Núverandi kóði útfærir **ekkert almennt staðapar → leið**-hugtak. Það
sem er til er ein `GET /api/winter-route` endastöð sem velur á milli
**tveggja fastra, nafngreindra leiða** með einum `routeId`-breytu:

- `api/winter-route.js:213` — `resolveRouteId(req.query?.routeId)` er
  **eina** lesna query-breytan (B2, línur 207–212). Allt annað er
  ósnert. Óþekkt/tómt/endurtekið gildi → `400 invalid_route_id`
  (`api/_lib/winterRoute/routes.js:134-142`), án þess að endurspegla
  innslegna gildið.
- `routes.js:94-119` — `ROUTE_DEFS` er `Map` með **tveimur** föstum
  lyklum: `"raudavatn-vik"` (sjálfgefið, `DEFAULT_ROUTE_ID` lína 92,
  endurnýtir `segments.js` óbreytt) og `"raudavatn-borgarnes"` (átta
  fastar IDBUTUR-stærðir, lína 33-42). Ekkert staðapar, enginn
  almennur leiðarsamsetningarreitur.
- `winter-route.js:225-231` — `getRoadData`/`getForecastData`
  (`cache.js:81-87`) taka `routeId` sem cache-lykil
  (`cache.js:29-43`): hvert `routeId` fær sína eigin TTL-bundnu
  road/forecast-fötu (B4), lazily sköpuð. `DEFAULT_BUCKET_KEY` 
  (`cache.js:29`) er notuð þegar `routeId` er `undefined` — gamla
  Vík-only hegðunin er óbreytt.
- `roadFetch.js:63,117` — `fetchRoadSegments`/`fetchRoadPoints` taka
  `idButurList` sem **breytu**; `WINTER_ROUTE_IDBUTUR_LIST` (úr
  `segments.js:31`) er aðeins sjálfgefið gildi fyrir eldri kallstaði —
  `winter-route.js:47-48` sendir alltaf `route.idButurList` beint, svo
  Borgarnes fær réttar eigin IDBUTUR-stærðir, ekki Víkur-listann.
  `forecastFetch.js:52,228` sama mynstur fyrir `forecastPoints`.
- Frontend-kallstaður: **`src/pages/WinterRoute.jsx:389-421`** —
  einfalt `fetch(url)` í `useEffect`, bundið við `routeId`-state
  (lína 311). **Ekkert `useWinterRoute.js` hook er til** (staðfest með
  `rg` — núll fundnar skrár með því nafni). `src/lib/winterRouteRoutes.js:15-20`
  er sjálfstætt, viljandi tvítekið frontend-afrit af sömu tveimur
  `routeId`-um (fyrir samningsstaðfestingu gegn backend-svari, sjá
  `winter-route.js:239-241` → `payload.routeId`/`expectedPointCount`
  athugun í `WinterRoute.jsx:401-409`).
- UI-innganga: `<select>` með tveimur `<option>`-um
  (`WinterRoute.jsx:492-497`), engin Frá/Til-leit, ekkert frjálst
  staðaval. Skráð á `/winter-route` án færibreytu
  (`src/AppRoutes.jsx:199`).

**Niðurstaða:** Að byggja almenna staðapar-leiðasamsetningu (#501) er
**ekki** útvíkkun á núverandi samningi — `routeId` er í grunninn ein
föst leið af tveimur, ekki eitt af mörgum reiknuðum staðapörum. Nýr
`routeId`-líkur lykill (t.d. `"<fromId>-<toId>"`) gæti endurnýtt
cache-/fetch-munstrið (per-lykill fötur, óháð TTL), en sjálf
leiðarsamsetningin (hvaða IDBUTUR-runa, hvaða átt) er ekki til neins
staðapars nema þeirra tveggja sem nú eru föst í `routes.js`.

## 2. Sönnunartafla — fjögur pör

Öll pör: `access_status`/`driving_access_and_direction` **EXACT_GAP**
á hverjum völdum punkti (`places.json`, `approach-selections.json`).
Eigandaval punkts sannar hvorki vegtengingu, akstursstefnu né lögmæta
umferð. „Hringátt" = cw/ccw-ganga um stærri hring (ekki viðeigandi
fyrir línulegar undirkeðjur, sjá lið 4).

| Par | Valdir endpoint-ID | Varðveitt stykki/keðja | Nákvæm þekkt bil/óstaðfest tenging | Vegalengdarstoð | Veður/færð-join stoð | Staða fyrir #501 |
|---|---|---|---|---|---|---|
| **Reykjavík–Selfoss** | R1 = `reykjavik-raudavatn` (IDFERILL 1436 vestari endi); Selfoss = `selfoss` (IDFERILL 2138 START, `selections.selfoss`) | **Hlutagögn**: Selfoss sjálfur er stykki 1/25 í `south-connections.json`'s suðurkorridor; þessi 25 stykki eru fíngerð idferill-útgáfa AF SÖMU fastleiðar-IDBUTUR-runu og `segments.js`'s `WINTER_ROUTE_SEGMENTS` (staðfest: Selfoss-stykkis eigin IDBUTUR `902030037` er þegar í WINTER_ROUTE_SEGMENTS, lína 20). R1→Selfoss er því **hlutleið af núverandi fastri Rauðavatn–Vík-keðju**, ekki ný leið. | Á leið R1→valins 2138 START: bil 0,234 m inn í 2071 og 34,749 m inn í 2135, samtals 34,983 m. 30,097 m milli 2138→3737 er handan Selfoss, ekki innan þessa pars. Bil óbrúuð; akstursheimild óstaðfest. | Retained cw_long skref 0–6 / selfoss_closure_target: **45 740,460 m með 1436 einu sinni**, 43 180,311 m án. Valinn punktur er exit 2138; 33,23 km var aðeins upphaf IDBUTUR-segments, ekki endpoint. | **Hlutagögn**: `902030037` er ÞEGAR í framleiðslu-IDBUTUR-listanum sem `roadFetch.js` sækir færð fyrir á Víkur-leiðinni — sama færð-API-kall myndi þegar ná yfir þetta IDBUTUR án nýrrar join-vinnu. | Hlutagögn til hugsanlegrar sérstaklega heimilaðrar fastrar leiðar; 34,983 m bil og H1 INFERRED standa, engin ný heimild til að brúa eða lýsa akstursaðgengi. |
| **Reykjavík–Hella** | R1; Hella = `hella` (IDFERILL 3591 START, `selections.hella`) | **Hlutagögn**: Hella er stykki 9/25 í sama suðurkorridor; eigin IDBUTUR `901130037` er þegar í WINTER_ROUTE_SEGMENTS (lína 22, „Hella – Þjórsá"). Sama mynstur og Selfoss: hlutleið af þegar-fastri keðju. | Á leið R1→valins 3591 START: bil 0,234 / 34,749 / 30,097 / 42,302 m, samtals 107,382 m. 32,63 m milli 3591→3638 er handan Hellu. Bil óbrúuð, akstursheimild óstaðfest. | Retained cw_long skref 0–14: **81 769,600 m með 1436 einu sinni**, 79 209,450 m án. Valinn punktur er exit 3591; 64,37 km var upphaf IDBUTUR-segments, ekki endpoint. | **Hlutagögn**: `901130037` er einnig þegar í framleiðslu-IDBUTUR-listanum. | Hlutagögn til hugsanlegrar sérstaklega heimilaðrar fastrar leiðar; 107,382 m bil og H1 INFERRED standa, engin ný brúunarheimild. |
| **Egilsstaðir–Seyðisfjörður (veg93)** | E1 = `egilsstadir` (IDFERILL 2344 START = IDFERILL 2345 END); S2 = `seydisfjordur` (IDFERILL 2894 END) | **JA1-fundur (bindandi):** `handoff-to-501.md` nefnir ENGA varðveitta keðju fyrir þetta par („—"). Það er ónákvæmt — sjá kafla 3 fyrir fulla umfjöllun. Veg93-keðjan `2344→3410→3409→2894→2892→2891` ER varðveitt í `docs/ai/tasks/ticket-493-place-data-phase2/samples/road93-candidate.json` (SHA-256 `1d8c9c…` á `wfs93-raw.json`, **staðfest beint þessa lotu** — sjá kafla 3), öll 5 samskeyti **0,0 m**, `contact_grade: CONTINUOUS_EXACT`. E1 = START 2344 (= END 2345, hringtenging 0,0 m — `road93-candidate.json`'s `ring_junction`). S2 = END 2894 (ekki endapunktur keðjunnar sjálfrar — keðjan heldur 2 stykki lengra að ferjubryggju 2891). | Engin mæld bil innan E1→S2-keðjunnar (0,0 m öll samskeyti) — eldri cum-km-villur eru þegar leiðréttar í phase2 v3, sjá kafla 3. Akstursstefna/lögmæt umferð áfram **ekki** staðfest af neinu þessara gagna (VEGHLUTI=1, „INFERRED (undocumented majority-pattern role)"). | **Beint úr gögnum**: E1→S2 (END 2894) = **26 252,294 m** (= 26,25 km) tier −1; E1→ferjubryggju (allur keðjuendinn) = 26 926,55 m. Tier 2 (grófari) gefur **24 752,45 m** (−8,07% frá tier −1) — sjá kafla 3. | **Hlutagögn, óstaðfest sem vara**: `road_condition_footprint-v2.json` staðfestir að IDBUTUR `911040037`/`911170037` HAFA raunveruleg færð-gögn í varðveittu `legacy-faerd`-sýnunum (ekki „NOT_AVAILABLE" — sú staðhæfing er beinlínis AFTURKÖLLUÐ í skránni). `worklist_and_weatherpoints-v2.json` ber fram 4 ÓVALDA veðurpunkta-TILLÖGU (línuleg jöfn skipting, ekki eigandasamþykkt) — ekki hægt að nota óbreytta: fjórði punkturinn er við ferjubryggju handan S2 og tillagan er ósamþykkt. | **Sterkasta parið gagnafræðilega** (CONTINUOUS_EXACT, engin óleyst source-bil innan keðjunnar), EN akstursstefna er jafn óstaðfest og hin, eldri cum-km-villur hafa þegar leiðrétta v3-heimild (kafli 3); þær kalla ekki á nýja eigandaákvörðun. |
| **Rauðavatn–Vík/Borgarnes** *(til samanburðar — nú virkar)* | R1; `vik`/`borgarnes` | `segments.js`/`routes.js` — **nú þegar í framleiðslu**, 13+8 fastar IDBUTUR-stærðir, fastir veðurpunktar. | `vik`'s EIGIN valinn punktur (IDFERILL 3849 START) er EKKI sami punktur og leiðarendinn (629,448 m munur — handoff [^vik]). `borgarnes` punktur = leiðarendi (P4). | Fastar, þegar kóðaðar `lengthKm`-summur, í framleiðslu. | Fastir veðurpunktar, í framleiðslu. | **Nú virkt** — óháð #500/#501-staðagrunninum, breytist ekki af þessari úttekt. |

**Leiðrétt aðferð (Ripley/JB1–JB2, 2026-11-17):** summa retained
`cw_long.steps` af `piece_cost_m + gap_into_m` að exit valins stykkis,
ekki upphafi IDBUTUR-segments. Fyrsta skref er 1436 og því þegar talið
einu sinni; ekki bæta `piece_1436_length_m` aftur við. Selfoss er einnig
staðfestur með `selfoss_closure_target`. Þetta eru retained lengdir með
skráðum bilum, ekki ný heimild til að brúa þau. Allur 25-stykkja
suðurkorridor hefur 30,097/42,302/32,63 m innri bil = 105,029 m;
34,749 m og 0,234 m liggja fyrr á R1-leiðinni utan útdráttarins.
`CONTINUOUS_EXACT` með 0,0 m samskeytum á hér við veg93, ekki suðurkorridor.

## 3. JA1 — veg93-ósamræmi við #500-handoff, skráð nákvæmlega

**Fundið staðfest:** `handoff-to-501.md` kafli 3 lýsir „tveimur
varðveittum keðjuútdráttum" (suðurkorridor, R1-norður) og setur „—" í
`egilsstadir`/`seydisfjordur`-röðum töflunnar (engin tenging). Þetta
er **ónákvæmt sem lýsing á varðveittum gögnum í heild** (ekki rangt um
þau gögn sem #500-lotan sjálf skoðaðl): `docs/ai/tasks/ticket-493-place-data-phase2/samples/`
ber fram sjálfstæða, aðskilda, jafn-raunverulega keðju fyrir
Egilsstaðir↔Seyðisfjörður (veg93, VEGNR='93'), sem #500's eigin
lestrarlisti náði ekki yfir. Ripley's eigin JA1-athugun (sjá
`approved-prompt-v1.md`) staðfesti þetta áður en þessi lota hófst;
**ég endurstaðfesti sjálfstætt þessa lotu** (ekki aðeins endursagði):

- `sha256sum docs/ai/tasks/ticket-493-place-data-phase2/samples/wfs93-raw.json`
  → `1d8c9cf880df374b9cb8120e1053e8ffd5acfba3d4bf55714e57ffdd8c49eb33`
  — **stemmir** við `road93-candidate.json`'s eigin tilvísun.
- Keðjuröðin `2344→3410→3409→2894→2892→2891`, öll 5 `gap_from_prev_m: 0.0`,
  `contact_grade: CONTINUOUS_EXACT` — staðfest beint úr
  `road93-candidate.json` (lesið orðrétt, ekki endursagt).
  `road93_section-v2.json`'s eigin `continuity_canonical.passes: true`
  og þrjú neikvæð próf (random permutation/duplicated piece/>100m gap)
  öll `passes: false` eins og þau ættu að vera (sjálfstæð samningsstaðfesting).
- E1 = START 2344 = END 2345 (hringtenging, 0,0 m, `road93-candidate.json`'s
  `ring_junction`); þessi hnit eru nákvæmlega jöfn `places-v1.json`'s
  eigin E1-hnit (715153,74/536679,93 í native EPSG:3057 — sama tala í
  báðum skrám, línu-fyrir-línu).

**Áhrif ef #501 hefði einfaldlega fylgt `handoff-to-501.md` orðrétt:**
Egilsstaðir–Seyðisfjörður, sem í reynd er **sterkasta** (CONTINUOUS_EXACT,
engin source-bil) af öllum fjórum pörunum í þessari úttekt, hefði verið
skráð óstudd/engin tenging — raunverulega til tjóns fyrir næsta
þróunarskref. `handoff-to-501.md` er ekki breytt í þessari lotu (utan
umfangs); þetta er skráð hér sem sjálfstætt áreksturs-/viðbótaratriði,
eins og JA1 og samþykkti promptinn sjálfur heimila.

**Leiðrétting JB3 og nýrri retained v3-heimild:** þetta er ekki nýr
óleystur árekstur sem krefst eigandaákvörðunar. `phase2/evidence.md`
R3 lýsir eldri 676,0013 km tilvísun að öðrum phase1-hnút, án 1436.
En einnig verður að lesa síðari leiðréttingu sama skjals (§10–§11,
tafla um 2345 og superseded-tafla): v2 `egilsstadir_nodes-v2.json`
680,1945/677,6344 merkti running-summuna rangt og taldi 1436 aftur.
Gildandi leiðrétt heimild er `samples/place_nodes-v3.json` ásamt
`evidence.md` §10–§11: E1 við entry 2345 = **677,6344 km með 1436 /
675,0743 km án**. Exit 2345 (annar phase1-hnútur) er 678,5614 /
676,0013 km. Ripley endurreiknaði prefix-summu úr `cw_long.steps`
sem byrjar sjálf á 1436; hún staðfestir E1-entry 677,6344 km.
Ekki nota 680,1945 sem með-1436 gildi eða bæta 1436 tvisvar.
E1→S2-keðjan og eigin 26 252,294 m vegalengd haggast ekki.

## 4. Lágmarksviðmið fyrir sértæk #501-tilvik

- **Sama staður (From = To):** Enginn kóði eða próf í núverandi
  samningi fjallar um þetta — `resolveRouteId` ber ekki staðapör yfir
  höfuð. Þyrfti nýja útfærslu-ákvörðun (t.d. augljós villa-/no-op-svar),
  ekki til núna.
- **Viðsnúningur:** Hvorki `routes.js` né `segments.js` skráir tvær
  áttir — `H1`/`direction_grade: INFERRED` (`routes.js:12-15`,
  `road93-candidate.json`'s `direction_grade`-reitir) segir
  **stafrænt stigveldi**, ekki lögmæta akstursstefnu, fyrir ALLAR
  fjórar línurnar hér að ofan jafnt. Ekkert gagnasafn hér sannar að
  öfug akstursstefna sé lögleg EÐA ólögleg — það er heiðarlegt gagnagat,
  ekki ályktanlegt af geometry-viðsnúningi (sbr. prompt: „geometry-
  reversal er ekki sú heimild").
- **Sameiginlegur tengivegur (veg93):** Sjá kafla 3 að ofan í heild —
  þetta ER lesið og skráð hér, JA1-skylda uppfyllt.
- **Hringlokun/1436-tvítalning:** almennt hringval er ekki innleitt.
  R1 er vestari endi 1436, svo R1-prefix inniheldur það einu sinni.
  Prefix úr cw_long byrjar þegar á því; endurviðbót er tvítalning.
- **Brotinn/óstaðfestur grafur:** R1→Selfoss/Hella hafa raunveruleg
  innri retained samskeytabil á leið, ekki aðeins bil handan endpoint.
  Veg93 E1→S2 hefur 0,0 m geometry-samskeyti en akstursheimild óstaðfesta.
  Almenn samsetning þarf heiðarlegt unsupported/gap svar; hún er ekki
  til nú. Hringnet er ekki heilt: cw_long R1→Akureyri og ccw_short
  R1→Borgarnes sanna ekki Akureyri→Borgarnes eða báðar hringáttir.

- **Lokun á valinni leið:** Núverandi kóði höndlar þetta þegar (ekki
  nýtt fyrir #501): `WinterRoute.jsx` prófin „a closed segment shows
  the closed label regardless of the other passable segments" (lína
  149) staðfesta að lokun birtist per-stykki, án sjálfvirkrar hjáleiðar
  — nákvæmlega samræmi við eigandakröfu („Lokun vegar á valinni leið
  er ekki heimild til nýrrar hjáleiðar"). Sama munstur myndi gilda
  fyrir ný pör án breytingar.

## 5. Niðurstaða og einfaldasta næsta skref

**Má raunhæft innleiða næst, án nýrrar gagnaöflunar:**

1. „Stutt útgáfa" af núverandi Rauðavatn–Vík fastri leið sem stoppar
   við Selfoss eða Hellu (kafli 2) — endurnýtir `segments.js`'s þegar
   kóðaða IDBUTUR-runu og lengdir óbreytt, bætir aðeins við nýjum
   `routeId`-lyklum (t.d. `"raudavatn-selfoss"`) í `routes.js`'s
   `ROUTE_DEFS`-mynstur. Þetta er sama stærðargráðu breyting og
   Borgarnes-leiðin var (#491) — **ekki** full #501-almenn samsetning,
   heldur tvær fastar leiðir í viðbót við þær tvær sem eru til.
2. Veg93 E1→S2 getur verið grunnur að sérstaklega heimilaðri fastri
   leiðartillögu; nota leiðrétt v3-endpoint/cum-gögn. Ekki nauðsynlegt
   að ákveða eldri cum-árekstur að nýju. Akstursheimild og veðurpunktar
   eru enn óstaðfest; fjórði gamli punkturinn er handan S2.

**Krefst sérstaklega heimilaðrar öflunar eða eigandaákvörðunar:**

- **Almenn staðapar → leið-samsetning** (allir 56 staðir, ekki bara
  þessi fjögur pör) er ekki til í núverandi gögnum eða kóða yfirhöfuð
  — það er alvöru #501-innleiðingarverk, ekki eitthvað sem fannst
  „þegar til" í þessari úttekt.
- Keflavík bær og Þórshöfn (hnitagöt úr #500) hafa enga keðju að ræða
  um fyrr en punktur er valinn.
- Veðurpunktatillagan fyrir veg93 (`worklist_and_weatherpoints-v2.json`)
  er **ekki** eigandasamþykkt — þarf ákvörðun áður en hún yrði notuð,
  ekki sjálfkrafa samþykkt af þessari úttekt.
- Lögmæt akstursstefna (bæði leiðir) er ekki staðfest af neinu gagni
  hér og er ekki leyst af þessari úttekt — hvorki ný né gömul gögn
  sanna hana.

**Stysta næsta skref fyrir einn þróunaraðila:** útfæra Selfoss/Hella
sem tvær nýjar fastar `routeId`-færslur í `routes.js`, nákvæmlega eftir
Borgarnes-mynstrinu (#491), með skýrum `EXACT_GAP`/`INFERRED`-merkingum
óbreyttum úr gögnunum hér að ofan — ekkert nýtt gagnasafn, engin ný
öflun. Þetta er ekki sjálfvirkt framkvæmt af þessari úttekt; það er
eigandans/næsta prompts ákvörðun að heimila.

Hvorki fækkar þessi úttekt 56-staða listanum, telur gamalt gagnasafn
sönnun akstursheimildar, né lofar báðum hringáttum þar sem gögn styðja
þær ekki. #441/#450 ekki endurvakin; #502–#504 ekki unnin hér.

## Ripley lokayfirferð — 2026-11-17

JB1–JB5 leiðrétt beint eftir Jonesy. Tölur sannreyndar úr retained
cw_long prefix/gap summum; phase2 evidence.md síðari v3-leiðrétting
tekin fram yfir bæði gamla v2 og review-orðalag. Tillaga um fleiri
fastar routeId er ekki almenn #501-leiðasamsetning, ekki framkvæmdarheimild
og ekki lokun #501. Engin ný gagnaöflun eða vörugagnabreyting.

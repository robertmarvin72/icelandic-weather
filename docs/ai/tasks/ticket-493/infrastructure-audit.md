# #493 — Infrastructure audit: Winter Route Advisor Frá/Til

CC, 2026-11-05. Framkvæmt eftir `approved-prompt-v1.md` (A1–A5 felld inn). A-lota, docs-only: rekja raunverulegt gagnaflæði, rekja studda þekju, leggja til gagnalíkan (engin innleiðing), skrá gagnagöt, skrá réttindi/mörk, skila niðurstöðumerki og tillögu að acceptance-matrix. Engin breyting á appkóða/prófum/dependencies/frumgögnum. Skrifað í áföngum (N1) — hver kafli er sjálfstætt nýtilegur.

**2026-11-05 — v2 leiðrétting (`approved-prompt-v2.md`, Jonesy R1–R5/B1–B2):** Jonesy's result review (umferð 1) fann að §5/§8/§10 lýstu sameiginlegum spátíma/engum komutímum sem þegar uppfylltum, sem er rangt (kóðinn reiknar per-punkts ETA og birtir komutíma, sbr. W1 hér neðar); að item 6 (nú §6) skilaði ekki umbeðinni afkastatillögu (W2); og að §2/G1 vitnuðu í rangt P4-gildi og ónákvæma bilsstærð (W3). Ripley samþykkti REVISE; þessi v2-leiðrétting er bundin við §2/§5/§6/§8/§10 og cc-report, engin önnur breyting. `BLOCKED_PENDING_OWNER_SCOPE_DECISION` stendur óbreytt — leiðréttingin breytir ekki niðurstöðumerkinu, aðeins lýsingu á núverandi hegðun/tillögu.

---

## 0. Aðalniðurstaða

**`BLOCKED_PENDING_OWNER_SCOPE_DECISION`**

Studd undirmengi er til og er vel skjalfest: tvær fastar, nafngreindar, einstefnu leiðir (Rauðavatn–Vík, Rauðavatn–Borgarnes), hvor með sína eigin fast-skilgreinda vegkafla- og veðurpunktalista, afhentar í #486/#489/#490/#491 og óbreyttar hér. Þær fela EKKI í sér Frá/Til-flæði — þær eru lokaður tveggja-kosta `<select>`, ekki leitarbær upphafs-/áfangastaðavalkostur. Full Hringvegsþekja sem #493 krefst (frjálst Frá/Til úr skilgreindum stöðum, báðar áttir, millistaðanöfn, lengdarháður punktafjöldi) er **ekki byggð** og krefst nýrrar, afmarkaðrar gagnaöflunar fyrir stærstan hluta hringsins (sjá §3/§8). Engin af núverandi niðurstöðumerkjum (`GO`, `BLOCKED_FOR_IMPLEMENTATION`) passar: það er ekki hrein stöðvun (hluti er nýtilegur óbreyttur), og það er ekki tilbúið fyrir fulla innleiðingu án nýrrar rannsóknar + eigandaákvörðunar um umfang.

**Óstaðfestar forsendur sem þessi niðurstaða byggir á:** (a) að "studd staður" í #493's skilningi þýðir stað með VERIFIED keðju-tengingu við Hringveginn, ekki eingöngu nafn/hnit; (b) að núverandi tveggja-leiða hönnun (routeId-allowlist, fast punktafjöldi per leið) er ásættanlegur grunnur til að alhæfa úr, ekki endurskrifa frá grunni — tillaga í §4 gerir ráð fyrir þessu en er ekki samþykkt hönnun.

---

## 1. Raunverulegt gagnaflæði (núverandi kóði, ekki gamlar athugasemdir)

**Request → route resolution:** `api/winter-route.js` les EINGÖNGU `req.query.routeId` (allt annað ósamþykkt gleymist). `resolveRouteId()` (`api/_lib/winterRoute/routes.js`) er ströng Map-undirstaða allowlist með nákvæmlega 2 færslum (`raudavatn-vik` sjálfgefið, `raudavatn-borgarnes`) — `undefined` ⇒ sjálfgefin leið óbreytt; tómur strengur/fylki/óþekktur strengur ⇒ `400` án þess að endurspegla innslátt. Map#has/#get kemur í veg fyrir `__proto__`/`constructor`-árás.

**Feeds/forecast (samhliða, óháð hvort öðru):**
- `getRoadData()`/`getForecastData()` (`cache.js`) — EITT óháð skyndiminnis-par PER `routeId` (lazy-stofnað), 5 mín TTL (vegur) / 15 mín TTL (spá), 30/60 mín stale-fallback, single-flight fyrir samhliða kallara á sama bili. Sjálfgefinn (`undefined` routeId) kallari lendir í sama `__default__`-bili og allir eldri test/kallstaðir — óbreytt hegðun fyrir Vík.
- `fetchRoadSegments`/`fetchRoadPoints` (`roadFetch.js`) sækja ALLT landsvísu-straum (708+ skrár) frá `https://gagnaveita.vegagerdin.is/api/faerd2017_1`/`faerdpunktar2017_1` og sía EFTIR SÓKN að leiðarinnar eigin `idButurList` — ekki afmarkað í fyrirspurninni sjálfri. Margræðar/tvíteknar `IdButur`-skrár eru sérstaklega höndlaðar (R2: lokun meðal tvítekninga vinnur).
- `fetchWinterRouteForecast` (`forecastFetch.js`) byggir EINA Open-Meteo-fyrirspurn með leiðarinnar eigin `forecastPoints` (6 fyrir Vík, 4 fyrir Borgarnes) sem comma-joinaðan lat/lon-lista, fastur 24-klst UTC-gluggi (næsta heila klst → +23 klst). Lykilvöntun ⇒ núll-fyrirspurn, ÖLLUM umhverfum (þrengri regla en sameiginlega `openMeteoAuth.js`-hjálparið). `validateForecast.js` er strangt: röng röð/einingar/tími/form gerir ÞANN punkt ónothæfan, ekki allan hópinn.
- `roadConditionCodes.js` sameinar kafla-/punkta-ástand í 6 flokka (`passable…closed…unknown_unclassified`), með "worst-wins" reglu og útrunnin-lokun-mildun (R2/N2).
- `boundedFetch.js` er eina sameiginlega frumstæðan fyrir ÖLL þrjú ytri köll: 15s/2MiB, engin redirect, engar sjálfvirkar endurtekningar.

**Svar:** `{ routeId, expectedPointCount, segments[], roadMeta, forecast{points[], window, stale} }`.

**Frontend (`src/pages/WinterRoute.jsx`):** native `<select>` með nákvæmlega 2 völdum úr `winterRouteRoutes.js` (SÍN EIGIN litla fasta routeId→nafn/punktafjölda-tafla — EKKI innflutt frá `api/_lib/`, sama mynstur og `winterRouteEta.js`'s eigin doc-comment um api/<->src-mörkin). Á `routeId`-breytingu: `fetch("/api/winter-route"[?routeId=...])`, svarið er VALIDATEAÐ gegn FRONTEND-ins eigin vænta `routeId`/`expectedPointCount`/punktafjölda ÁÐUR en það er samþykkt — ósamræmi ⇒ leiðarbundin villa, ekki þögul hálf-/ranga-leið birting. `requestIdRef`+`AbortController`+`lastRequestedRouteIdRef` verja gegn kapphlaupi (A→B→A, StrictMode tvíköllun). `view`/`viewErrorKey` (ticket #491 V2) hylja gögn/villu sem ekki passa við VALDA `routeId` Á RENDER-TÍMA — þetta er núverandi, staðfest lagfæring á stale-flash-vandamáli, óbreytt hér.

**Brottfarartími er AÐEINS staðbundið val** meðal 24 þegar-sóttra klst-gilda (ENGIN ný netbeiðni). `winterRouteEta.js`: `computeEta()` er `distanceKm/speedKmh` (FASTUR 70 km/klst staðgengill, EKKI akstursleiðbeining) + `Math.ceil` í næstu heilu klst — `distanceKm` kemur úr `approxDistanceFromStartKm`, sem er FASTUR, KÓÐASKRÁÐUR fasti PER PUNKTI (í `segments.js`/`routes.js`), EKKI reiknaður úr raunverulegri leiðarlengd við fyrirspurn. `winterRouteSummary.js`/`winterRouteComparison.js` endurnýta ÞESSA SÖMU punkts-upplausn fyrir hámark/samanburð — engin önnur ETA-reiknilíkan er til í kóðanum.

**Fastar stærðarmörk / hvar 6/4 lifa:** `WINTER_ROUTE_SEGMENTS` (13)/`BORGARNES_SEGMENTS` (8) í `api/_lib/winterRoute/{segments,routes}.js`; `WINTER_ROUTE_FORECAST_POINTS` (6)/`BORGARNES_FORECAST_POINTS` (4) sömu skrám; `WINTER_ROUTE_OPTIONS`'s eigin `expectedPointCount` (6/4) í `src/lib/winterRouteRoutes.js` — TVÍTEKIÐ gagnasafn (bakendi+framendi), VISVIS aðskilið (api/<->src-mörk), krosstjékkað í keyrslu, ekki í byggingartíma. **Engin leiðarvél, engin "pathfinding", engin samsetning úr handahófskenndum vegkaflum er til í kóðanum neins staðar** — "leið" þýðir í dag "velja eina af nákvæmlega tveimur harðkóðuðum `ROUTE_DEFS`-færslum."

**Engin breyting á gating/scoring/entitlement/payment eða sameiginlegum forecast-inntökum** var gerð eða þarf að gera fyrir þessa úttekt — Winter Route er ólögskráð/án greiðsluveggs síða (`usePageRouteProps`, ekkert `RequireFeature`), óbreytt.

---

## 2. Varðveitt gögn fyrst — uppruni, takmörk, leiðrétting eldri fullyrðinga

Allar fullyrðingar hér eru rekjanlegar til #429/#483/#485/#491's eigin, margendurskoðuðu skrár — EKKI endurteknar án athugunar. Nýjasta leiðrétting ræður (t.d. #483's v4 leysir v1-v3's rangar tölur; #491's v5 leysir v4's eigin reiknivillu).

- **#429** (2026-10-27, PARTIAL): fann `faerd2017_1`/`faerdpunktar2017_1`/DATEX-þjónustur, en **engin WFS-geometry var sótt fyrir leið B (Reykjavík-Akureyri) eða C (Reykjavík-Borgarnes)** — rubric cap.1 = **FAIL** fyrir báðar sérstaklega, óháð öðrum atriðum. `OTHEKKT`/`LOKAD` eru raunveruleg, aðgreind source-native gildi (leiðrétt v2, 49/1 tilvik af 708). Nafnaárekstur fundinn (`910330037` "Hellisheiði eystri" er á Austurlandi, ekki á leiðinni) — nafnaleit eitt og sér er ekki öruggt join.
- **#483** (2026-10-28, PARTIAL — leyfisþakvandi, EKKI geometry): `VEGNR='1'`-fyrirspurn landsvísu fann samfellda 13-kafla keðju Rauðavatn→Vík (0–34,7m tengingar). Lengd er BIL (174,95–175,64 km, háð hringtorgs-vali), ekki ein tala. `914020037`/`903020037` ("kaflasvæði 0", Reykjavíkur-álman) eru tengd en hafa ENGA varðveitta WGS84-geometríu og span-0 "næsti akkeri"-röðun er UNKNOWN (unsupported-E, #485). Punktafóðrið (`faerdpunktar2017_1`) var AÐEINS sótt yfir HTTP, HTTPS aldrei reynt.
- **#485** (2026-11-02/03, RESEARCH GO — afmarkað): Open-Meteo opinn/almennur hýsill hefur **beina, útgefna banni á atvinnunotkun** ("non-commercial purposes only"; "websites/apps that have subscriptions" eru dæmi um atvinnunotkun í skilmálunum sjálfum) — þessi vara ER atvinnunotkun (Paddle-áskriftir). Greidd `customer-api.open-meteo.com`-leið (núverandi framleiðsluhegðun, #453) er EINA leiðin sem styðst við skjölun, EKKI almenni hýsillinn. Account-stig atriði (lykilgildi, Preview, kvóti, customer-host-svarform/einingar) eru ÁFRAM UNKNOWN — eigandastaðfest áskrift (`API Standard`, 2026-10-20) ER endurnýtanleg sem staðreynd, EKKI sem sönnun um núgildandi lykilgildi eða kvótaslaka. Einn afmarkaður, lykillaus prufu-net-kall (RESEARCH GO) sannaði svarform/einingar/röð fyrir ÞENNAN tiltekna sex-punkta/24klst-glugga — ENGIN alhæfing um önnur gluggastærð/punktafjöldi.
- **#491** (2026-11-04/05, CLOSED/PASS): Rauðavatn→Borgarnes keðja VERIFIED (37,39m upphafsbil + 15 bil ≤41,45m, H1 INFERRED norðurátt-nálgun — EKKI sönnuð umferðarstefna). **W3-leiðrétting:** gildandi punktmat fyrir P4 (Borgarnes-aðkoma, `routes.js`'s fast `approxDistanceFromStartKm`) er **70,566 km** — afleitt í `derivation-29-pieces.md` (v5) sem haversine-summa (R=6.371.008,8 m) yfir 29 WGS84-stykkin PLÚS mældu native-ISN93 tengibilin, óháð endurreiknað P1 23,5594/P2 34,2877/P3 53,7379/P4 70,5664 km, innan 0,0004 km af `routes.js`'s föstu tölum. **70,780 km er EKKI þessi tala** — það er `route-data-candidate.json`'s eigin PLANAR-ISN93-summa (sama 29 stykki, engin umvarpspeglun í WGS84, sem #491's eigin `evidence-table-final.md` sjálft merkir sérstaklega "EKKI afrita planar-km úr candidate" sem viðmið). v1-útgáfa þessa skjals vitnaði rangt í 70,780 km sem "staðfest sjálfstætt tvisvar" — sú fullyrðing er afturkölluð hér; 70,566 km er eina gildandi, samþykkta mælistærðin. Borgarnes-endapunktsregla (fyrsta VEGHLUTI5-hringtorg eftir norðanmunna Hvalfjarðargangna) er tæmandi athuguð, ótvíræð. v4-umferð fann falska "~0,037km hindrun" sem reyndist vera EIGIN reiknivilla (gleymt upphafsbil) — leyst í v5, engin raunveruleg leiðargagnavilla. `routes.js` er EKKI endurreiknað eða breytt í þessari v2-leiðréttingarlotu.

**Aðgreining geometry-pieces/IDFERILL ↔ færðarkaflar/IDBUTUR ↔ punktatilkynningar:** `IDFERILL` er WFS-línubrota-auðkenni (margt-á-móti-einum við `IDBUTUR` — t.d. 108 brot fyrir 9 `IDBUTUR` í #429's sýni). `IDBUTUR` er færðarfóðrunar-samsöfnunarlykillinn (ástand+ferskleiki). Punktatilkynningar (`faerdpunktar2017_1`) deila `IDBUTUR` með kaflanum en hafa EKKI eigin staðsetningu innan kaflans — `winter-route.js`'s `buildSegmentPayload` fær ALLAR tilkynningar fyrir þann `IDBUTUR`, óháð hvar á kaflanum þær eru. **Hægt að afmarka tilkynningar innan hlutkafla með fyrirliggjandi gögnum? NEI** — hvorki `faerd2017_1` né `faerdpunktar2017_1` ber neitt staðsetningarhnit/undirkafla-auðkenni fyrir tilkynningu sjálfa (aðeins `IDBUTUR`); aðeins WFS-geometrían (`IDFERILL`) hefur hnit, og tilkynningin vísar ekki í `IDFERILL`. Þetta er núverandi, viðurkennd takmörkun (`winterRouteSectionCoverageNote`-strengurinn í framendanum, og #491's eigin §5 "GREIDFAERT-staðan á við allan skráðan kaflann, ekki sérstaklega staðfest fyrir hinn stutta notaða hlutann").

**A2 — CSV-reitafjöldapróf (`docs/ai/tasks/ticket-429/coverage.csv`), keyrt sjálfstætt þessa umferð:**

```
python3 -I: csv.reader, utf-8-sig
header_fields = 28
MISMATCH row 8  (29 reitir) -> A, Skógar
MISMATCH row 11 (29 reitir) -> B, Borgarnes
MISMATCH row 13 (29 reitir) -> B, Holtavörðuheiði
MISMATCH row 16 (29 reitir) -> B, Vatnsskarð
total_rows_incl_header = 22
```

Staðfestir Jonesy's fund ÓBREYTT: 29 reitir á móti 28-reita haus, nákvæmlega þessar 4 raðir. Þessar 4 raðir eru EKKI notaðar sem heimild fyrir neinni tölu í þessari úttekt — hvar þörf er á gögnum fyrir Skógar/Borgarnes/Holtavörðuheiði/Vatnsskarð er vísað annað (t.d. Borgarnes-DATEX `IRCA_MP_1181` úr `research-report.md` prósa, ekki CSV-línunni sjálfri) eða merkt UNKNOWN.

**A3 — stefna er INFERRED, ekki sönnuð:** Hvorki Vík→Rauðavatn (öfug átt núverandi Vík-leiðar) né Borgarnes→Rauðavatn (öfug átt núverandi Borgarnes-leiðar) er kóðalega eða gagnalega aðgreind frá fram-áttinni — fylkisröðin ER áttin í dag, ekki tvær óháðar, sjálfstætt staðfestar keðjur. H1 (Borgarnes-leiðin) er VEGHLUTI6-í-geymdri-stafrænni-stefnu-nálgun, með nefndri 814700037/2982 "til suðurs"-útilokun til að forðast tvítalningu á göngunum — EKKI mælda umferðarstefnu. Viðsnúningur listaraðar ER EKKI látinn sanna gagnstæða átt hér (eins og krafist er): öfug átt er UNKNOWN/INFERRED þar til VEGHLUTI7/andstæð-akbraut-gögn eru sérstaklega skoðuð — sem #491 sjálft nefnir sem framkvæmanlega, afmarkaða framtíðar-rannsóknaraðgerð (sama varðveittu tier0/VEGHLUTI-reitir, bara "7" í stað "6"), EKKI eitthvað sem krefst nýrrar Vegagerðar-heimildar.

**A5 — útgáfumiði:** `docs/ai/tasks/ticket-493/issue-493-2026-11-05.json` er læsilegt, dagsett (2026-11-05), sótt af Ripley. Innihald lesið í fullu — sjá §8 fyrir beinan lið-fyrir-lið samanburð við þessa úttekt.

---

## 3. Þekjuskrá og gagnagöt (VERIFIED/INFERRED/UNKNOWN, rekjanlegt)

| # | Bil/atriði | Staða | Heimild | Áhrif | Næsta afmarkaða aðgerð | Eigandaákvörðun / ný gagnaöflun? |
|---|---|---|---|---|---|---|
| G1 | Rauðavatn → Vík, FRAM-átt | **VERIFIED** keðja — **W3-leiðrétting:** tengibil milli kaflanna eru **0,0–34,7 m** (`route-segments.csv`'s `adjacency_to_prev_m` dálkur, sjálfstætt endurlesinn þessa umferð: 0.0/0.2/0.0/34.7/30.1/0.0/5.2/0.0/0.0/0.0/0.0/0.0), EKKI "0 m milli allra 13 kafla" eins og v1-útgáfa þessa skjals sagði rangt | #483 v4, `route-segments.csv` | Núverandi, skipandi leið virkar óbreytt | Engin | Engin — þegar í framleiðslu |
| G2 | Rauðavatn → Vík, ÖFUG átt | **UNKNOWN/INFERRED** (sama fylki, engin sjálfstæð stefnurannsókn) | A3, engin sérstök gagnaöflun fyrir öfuga átt gerð í neinni lotu | Ekki hægt að bjóða "Vík→Rauðavatn" sem sjálfstætt sannreynda leið í dag | Skoða VEGHLUTI7/andstæð akbraut fyrir sömu kafla | Ný, lítil gagnaöflun (sömu varðveittu skrár, ný greining) |
| G3 | Rauðavatn → Borgarnes, FRAM-átt (H1) | **VERIFIED** keðja, H1 **INFERRED** stefnutilgáta | #491 v5, `derivation-29-pieces.md` | Núverandi, skipandi leið virkar óbreytt | Engin | Engin — þegar í framleiðslu |
| G4 | Rauðavatn → Borgarnes, ÖFUG átt | **UNKNOWN/INFERRED** | A3, sama rök og G2 | Sama og G2, fyrir þessa leið | Sama aðferð og G2 | Sama og G2 |
| G5 | Reykjavík → Akureyri ("Leið B") — geometry | **FAIL** (engin WFS-fyrirspurn gerð, í neinni lotu, fyrir þessa leið) | #429 Síða1/§9b cap.1 | Blokkar algerlega að bæta þessari leið/þessum hluta hringsins við hvaða Frá/Til-líkan sem er | Ný, bundin WFS-rannsóknarlota (sama aðferð og #483/#491) | Ný gagnaöflun — EKKI docs-fix |
| G6 | Borgarnes → Akureyri (áframhald hringsins norður) | **UNKNOWN** (aldrei rannsakað í neinni lotu) | — | Sama og G5 | Sama og G5 | Sama og G5 |
| G7 | Vík → Höfn → ... → til Reykjavíkur (austur-/suðurhluti hringsins austan Víkur) | **UNKNOWN** (aldrei rannsakað í neinni lotu — #429/#483/#485/#491 stoppa öll við Vík eða Borgarnes) | — | Algerlega óstutt; stærsti hluti hringsins | Margar nýjar, bundnar rannsóknarlotur, líkt stórt verkefni og #483+#491 samanlagt eða stærra | Eigandaákvörðun um umfang fyrst — sjá §0 |
| G8 | Reykjavíkur-álma / "span 0" akkeri (914020037 vs 903020037 vs Rauðavatn) | **UNKNOWN**, unsupported E | #485 blocker-rights-register.md | Hefur AÐEINS áhrif á hvort "Reykjavík borg" sjálf (ekki Rauðavatn) væri boðin sem staður — hefur EKKI áhrif á núverandi tvær leiðir | Krefst nýs, gildis studds "held-out residual" mælingar, ekki eigandaákvörðun eina sér | Hvort tveggja — tæknilegt + vöruspurning (er "Reykjavík" þörf, eða er Rauðavatn nóg?) |
| G9 | Millistaðanöfn ("Um Vík og Höfn" stíll) | **ekki til í gagnalíkani eða kóða** — hvor núverandi leið er EIN föst slóð, ekkert val um varíant | Lestur á `routes.js`/`WinterRoute.jsx` | Blokkar #493's eigin krafðu framsetningu beint | Hluti af §4's tillögu, ekki ný gagnaöflun fyrr en G5-G7 eru leyst | Vöruákvörðun (hönnun, ekki rannsókn) |
| G10 | Tilkynningar bundnar við undirhluta langs IDBUTUR-kafla | **Ekki mögulegt með fyrirliggjandi gögnum** (staðfest, ekki ágiskað — §2) | `faerdpunktar2017_1` skortir staðsetningarhnit/undirkafla-ID | 904040037 (Borgarnes–Baula, 19,7km) og 904690037 (göng+aðkomur) sýna "ástand allan kaflann" óháð hvað leiðin sjálf notar (~1,9km) | Engin — þegar skjalfest/birt notendum (`winterRouteSectionCoverageNote`) | Engin — viðurkennd takmörkun, ekki lausnarkrafa |
| G11 | Punktafóðrið (`faerdpunktar2017_1`) yfir HTTPS | **UNKNOWN** (aldrei reynt yfir HTTPS í neinni lotu — aðeins HTTP) | #483 §6 N4 | Lítið — virkar í dag yfir HTTP; hreint tæknilegt flutningsgat, ekki leyfisgat | Ein ný HTTPS-tilraun á sömu slóð (lítil, afmörkuð) | Lítil ný gagnaöflun, EKKI eigandaákvörðun |
| G12 | Vegalengdarformúla fyrir samsetta (margra-kafla) leið — lengdarháður punktafjöldi | **Ekki hannað** — `approxDistanceFromStartKm` er í dag fastur kóðafasti per punkti, ekki reiknaður úr breytilegri leiðarlengd | §1/§4 | Blokkar #493's "fjöldi punkta má ráðast af lengd leiðar" kröfu fyrir hvaða samsetta leið sem er umfram núverandi 2 | Hluti af §4's tillögu | Vöruákvörðun (hönnun), framkvæmanlegt EFTIR að G5-G7 eitthvað er leyst |

**Þétt yfirlit Hringvegsins (grófar sektorar):** Rauðavatn→Vík = VERIFIED (ein átt); Rauðavatn→Borgarnes (gegnum Hvalfjarðargöng) = VERIFIED (ein átt, INFERRED stefna); Borgarnes→Akureyri = UNKNOWN; Akureyri→(áfram hringinn, austur/norður) = UNKNOWN (aldrei nefnt í neinni lotu); Vík→Höfn→...→Selfoss/Reykjavík (lokun hringsins) = UNKNOWN. **Samtals: tveir stuttir, einstefnu "stikkar" út frá Rauðavatni eru byggðir; drjúgur meirihluti sjálfs hringvegarins (bæði mældur í km og í fjölda óstaðfestra kafla) er algerlega órannsakaður.** Þetta er ekki "óséð bil" (unexamined gap) sem er sagt fjarverandi gögn — þetta er einfaldlega ekki enn rannsakað, nákvæmlega eins og #493's eigin fyrsta skref krefst að sé skráð skýrt.

---

## 4. Lágmarksútfærslutillaga — EKKI samþykkt hönnun, EKKI innleiðing

Markmið: lýsa einföldu gagnalíkani sem gæti alhæft núverandi tveggja-leiða mynstur í fleiri nafngreinda staði/tengingar, ÁN þess að krefjast ytri leiðaþjónustu — háð því að G5–G7's gagnaöflun fari fram fyrst fyrir hvaða nýja hluta sem bætt er við.

**Samanburður þörf á ytri leiðaþjónustu:** Núverandi tvær leiðir voru BÁÐAR byggðar með handvirkri, margendurskoðaðri WFS-keðju-rakningu (sömu aðferð #483 og #491 notuðu, hvor um sig margra-umferða rannsóknarverkefni). Þetta ALGEBRULEGA virkar (sannað tvisvar), en skalast EKKI augljóslega sjálfkrafa yfir á heilan hring án margra nýrra, jafn-stórra rannsóknarlota — sjá G5-G7. Ytri leiðaþjónusta (t.d. almenn vegaleiðarvél) var EKKI valin hér (ekki heimilt þessa lotu, A1/item7) og er ekki lögð til — en áhættan af "handvirkt, margra-umferða" nálguninni fyrir ALLAN hringinn er nefnd skýrt sem eigandaákvörðunarefni, ekki falin.

**Tillagað gagnalíkan (proposal, ekki tilbúin leið):**

1. **`WAYPOINT`-skrá:** `{ id, nameIs, nameEn, lat, lon, nearestChainAnchor }` — alhæfing núverandi tveggja fastra enda-punkta (Rauðavatn/Vík/Borgarnes) í endurnýtanlega skrá, ÁN frjálsrar heimilisfangaleitar (sem er úr umfangi #493's eigin texta). `nearestChainAnchor` er sama hugtak og G8's óleysta "span 0" vandamál fyrir Reykjavík sjálfa.
2. **`ROUTE_LINK`-líkan:** röð `{ idButur, chainPieces[], gapsBridged[] }` milli TVEGGJA aðlægra `WAYPOINT`a — nákvæmlega sama form og #483/#491 þegar handafleiddu, bara almennt gagnasnið í stað einnar bespoke fastar fylkju per leið. **Hver tengill er STEFNUBUNDINN** — tvær aðskildar, sjálfstætt sannreyndar færslur (eða einn tengill + skýrt merkt, SÉRSTAKLEGA sannreynt "öfugt"-flagg) — ALDREI ályktað með því að snúa röðinni (A3).
3. **Samsetning leiðar** = að tengja `ROUTE_LINK`a milli valinna Frá/Til `WAYPOINT`a eftir hringnum; sjálfgefið = styttri leið miðað við lengd (án "öruggari/betri" fullyrðingar, per #493's eigin orðalag); sami staður í báðum reitum ⇒ skýr skilaboð, ekki þögul óbein full-hringferð.
4. **Veðurpunktar** = áfram fastir, nafngreindir punktar PER TENGLI (endurnýtir núverandi punkta-hönnun óbreytt), en SAMANTEKINN punktafjöldi fyrir samsetta leið verður FALL af fjölda samantengdra tengla, EKKI fastur leiðarfasti eins og í dag — þetta er hönnunarhlutinn sem þarf NÝJA vinnu (í dag er `expectedPointCount` fast gildi per route, ekki summa).
5. **Færð/tilkynningar** halda sama `IDBUTUR`-lykli og í dag — alhæfist sjálfkrafa án nýrrar rökfræði, því `roadFetch.js`/`roadConditionCodes.js` taka `idButurList` sem breytu þegar (frá #491).
6. **Hringlokun**: heilan hring MÁ nota sem INNRA afkastaviðmið (t.d. mæla stærsta mögulega N fyrir §6's útreikning), EKKI sem nýtt notendaflæði — sami upphafs/enda-staður gefur skilaboð, ekki óbeinan heilhring (per #493's eigin krafa).

**Hvað núverandi tvær leiðir geta gert óbreytt eða flutt yfir:** Báðar núverandi leiðir eru lesnar sem SÉRSTÖK, nú-þegar-til tilvik af `ROUTE_LINK`-forminu (Vík-leiðin er í raun 13 `IDBUTUR` í einum tengli; Borgarnes-leiðin 8 í einum tengli) — flutningur er framsetningar-/gagnaformsbreyting, EKKI nýtt gagnasafn eða ný stefnurannsókn fyrir þessar tvær. Engin "ósönnuð regression"-fullyrðing er gerð hér — þetta er EKKI sýnt að virka með kóða, bara nefnt sem rökrétt samræmi milli núverandi og tillagaðs forms.

---

## 5. Tími og UI-áhrif

**W1-leiðrétting (Jonesy R1): v1-útgáfa þessa kafla sagði "sameiginlegur spátími er NÚ ÞEGAR uppfyllt" — það er RANGT.** Núverandi kóði gerir EKKI sameiginlegan spátíma: hver punktur leysir SINN EIGIN spáklukkutíma með `resolvePointAtDeparture(point, departureHour)` (`src/lib/winterRouteEta.js`), byggt á áætlaðri komu (`distanceKm/70 km/klst`, `Math.ceil` í næstu heilu klst). `ForecastCard` (`WinterRoute.jsx` ~lína 163–190) birtir "Áætluð koma: {time} UTC" (`winterRouteEstimatedArrival`) á HVERJU punktakorti og `winterRouteEtaApproximationNote` ("70 km/klst...; ekki akstursleiðbeiningar") er virkur strengur. `winterRouteSummary.js`/`winterRouteComparison.js` endurnýta ÞESSA SÖMU per-punkts upplausn — `winterRouteComparison.js` er bókstaflega ±2 klst. brottfarartíma-samanburður (`winterRouteComparisonHeading`/`-EarlierLabel`/`-LaterLabel`/`-SelectedAnnouncement`). Þetta er nákvæmlega það sem #493's útgáfumiði setur UTAN UMFANGS ("ETA, aksturstími og ferðahraðaforsendur", "Ráðleggingar um brottfarartíma") og krefst beint ("Í þessari útgáfu gildir sami valdi spátími fyrir alla punkta leiðarinnar", "Ekki reikna komutíma á einstaka punkta").

**Yfirfærslutafla — hvað þarf að fjarlægja/aðlaga fyrir #493, hvað má endurnýta:**

| Skrá/fall eða strengjalykill | Núverandi hegðun | #493-krafa | Aðgerð | Regression síðar |
|---|---|---|---|---|
| `resolvePointAtDeparture` (`winterRouteEta.js`) | Leysir per-punkts klst út frá fjarlægð+70km/klst+ceil | Allir punktar nota SAMA valda spátíma, ekkert komutíma-afleitt val | FJARLÆGJA úr #493-flæði eða halda í aðskildu eldra flæði (eigandaákvörðun, sjá næst) | Próf sem staðfestir sama tímamerki óháð fjarlægð punkts |
| `computeEta` (`winterRouteEta.js`) | `distanceKm/speedKmh`+ceil, hrein stærðfræði | Ekki notuð í #493-flæði (engin fjarlægðar-/hraðaforsenda) | AÐGREINA: hrein reiknifallið er ekki sjálft skaðlegt, en INNTAKIÐ (per-punkts fjarlægð→klst) má ekki drífa #493's tímaval | Próf sem staðfestir `computeEta` ekki kallað af #493's eigin tímavalskóða |
| `winterRouteEstimatedArrival` strengur + "Áætluð koma" UI-blokk (`ForecastCard`) | Birt á hverju punktakorti | Komutímar mega EKKI birtast | FJARLÆGJA úr #493-flæði | Próf sem staðfestir strengurinn ekki renderaður |
| `winterRouteEtaApproximationNote` strengur | Birt þegar `routeId !== DEFAULT` | 70km/klst-forsenda ekki við hæfi þegar engin ETA er reiknuð | FJARLÆGJA/AÐLAGA fyrir #493-flæði | Próf sem staðfestir ekki birt án ETA |
| `winterRouteHourLabel`/brottfararval (`<select id="winter-route-hour">`) | Notandi velur EINN tíma af 24 sóttum, deilt `selectedHour`-state | Samræmist #493 ("sami valdi spátími") AÐEINS að því marki að `selectedHour` sjálft ER deilt — vandinn er að ÚTREIKNINGUR á hverjum punkti er ekki samstilltur við það val | ENDURNÝTA `selectedHour`-valið sjálft; BREYTA hvernig hver punktur les sitt gildi (beint á `selectedHour`-vísitölu, ekki gegnum `resolvePointAtDeparture`) | Próf sem staðfestir öll punktakort lesa sömu klukkustundarvísitölu |
| `winterRouteComparison.js` (±2 klst. samanburður) + `winterRouteComparisonHeading`/`-EarlierLabel`/`-LaterLabel`/`-SelectedAnnouncement`/-merki | Þrjú brottfararvalkostir, sinn eigin ETA-samantekt hvor | Brottfararráðleggingar eru UTAN UMFANGS #493 | FJARLÆGJA úr #493-flæði eða halda í aðskildu eldra flæði | Próf sem staðfestir samanburðar-UI ekki birt í #493-flæði |
| `winterRouteForecastNotAvailableAtComputedTime`/`winterRouteNoHoursAvailable`/`winterRouteComparisonReasonArrivalOutsideWindow` (out-of-window-strengir) | Þrjár aðskildar "ekki tiltækt" tilvísanir, tengdar núverandi ETA-líkani | #493 krefst skýrra skilaboða þegar VALINN tími er utan spátímabils (ekki punkts-sértæk ETA-útreikning) | AÐLAGA: halda strengjamynstrinu (missing/out-of-window er sitt eigið ástand), en binda við VALINN tíma-vs-gluggi, ekki per-punkts ETA-vs-gluggi | Ný T11 (sjá neðar) |
| `computeWeatherExtremaSummary`/`computeActiveNoticeSegmentCount` (`winterRouteSummary.js`) | Hámark/lágmark MEÐAL punkta Á SÍNUM EIGIN ETA-tíma hvor | #493 þarf hámark/lágmark MEÐAL punkta Á SAMA VALDA TÍMA | AÐLAGA: breyta inntakinu úr `resolvePointAtDeparture` í beina `selectedHour`-vísitölu; sjálf summustærðfræðin (max/min-val, `isPartial`/`isMissing`) er endurnýtanleg óbreytt | Próf sem staðfestir sömu vísitölu notuð fyrir öll þrjú mæligildi |
| `formatDecimal`/`formatHourLabel`/`formatInstantHHMM`/`hourOfDayFromHourString` (`winterRoutePresentation.js`) | Hrein framsetningarföll, ekkert tímaval-ákvörðunarvald | Óbreytt þörf | ENDURNÝTA ÓBREYTT | Ekkert nýtt þarf |
| `roadFetch.js`/`roadConditionCodes.js`/`freshness.js`/`cache.js`/`boundedFetch.js`/`validateForecast.js` | Óháð tímavals-líkaninu að ofan | Óbreytt þörf | ENDURNÝTA ÓBREYTT | Ekkert nýtt þarf |

ETA-reikniregla (`computeEta`/`resolvePointAtDeparture`) er því EKKI "endurnýtanlegt óbreytt" fyrir #493 — það er nákvæmlega andstæðan af því sem #493 þarf fyrir tímaval. Hrein mæligildisregla (summur/hámark/lágmark/framsetning) MÁ aðgreina frá núverandi tímainntaki án þess að endurskrifa hana núna — sjá töfluna.

**Eigandaákvörðun (ekki tekin hér, kynnt hlutlaust per N2):** Núverandi tvær leiðir (Rauðavatn–Vík, Rauðavatn–Borgarnes) SENDU ETA-/±2-eiginleika sem hluta af #486/#489/#490. #493 setur þessa eiginleika utan umfangs fyrir SÍNA EIGIN leiðarsamsetningu og krefst að núverandi leiðir "virki áfram eða hafi verið færðar yfir með sannreyndum hætti." Tveir valkostir, settir fram án tilmæla:
  - **(a) Flytja núverandi tvær leiðir yfir í sameiginlegan spátíma** (fjarlægja ETA/±2 af þeim líka) — afleiðing: núverandi sendir eiginleikar (#486/#489/#490) breytast/minnka fyrir Vík og Borgarnes; þarf nýja regression-prófun sem staðfestir ÖLL þrjú þrep (Vík, Borgarnes, ný #493-leið) lesa sama tímalíkanið.
  - **(b) Halda núverandi tveimur leiðum í aðskildu, eldra ETA-/±2-flæði** og byggja #493's nýja leiðarsamsetningu (hvort sem er sem þriðja/fjórða val eða almennt Frá/Til-flæði) með SÉRSTÖKU, sameiginlegu-spátíma-flæði samhliða — afleiðing: tvö mismunandi tímalíkön í kóðanum samtímis; þarf sérstaklega samþykkt umfang (hvenær/hvort eldra flæðið er fjarlægt síðar) og regression-prófun sem staðfestir hvort flæðið lekur ekki inn í hitt.
  - Hvor leið er valin hefur ekki áhrif á `BLOCKED_PENDING_OWNER_SCOPE_DECISION`-niðurstöðuna sjálfa (§0) en MÁ EKKI gera #493's eigin samþykktarskilyrði ("sami spátími", "engir komutímar") að engu með því að einfaldlega endurnýta núverandi ETA-kóða óbreyttan fyrir nýju leiðina.

- **Gagnaskortur** er núna skýrt aðgreindur frá "góðum skilyrðum" á ÖLLUM stigum sem lesin voru: `ForecastCard`'s "not available", `RouteSummary`'s hlutaþekju-viðskeyti (`{count} af {total}`), `RouteComparison`'s fjórar nefndar ástæður (`NOT_UPCOMING`/`ARRIVAL_OUTSIDE_WINDOW`/`POINT_UNAVAILABLE`/`METRIC_GAP`), og `computeActiveNoticeSegmentCount`'s "unconfirmed" (ekki "0") þegar punktafóðrið er niðri/úrelt. Þetta mynstur (aðskilin, nefnd gagnaástand) er nýtilegt áfram, EN sjálf ástæðulistinn í `RouteComparison` (t.d. `ARRIVAL_OUTSIDE_WINDOW`) er bundin við per-punkts ETA-líkanið sem W1 segir að þurfi að fjarlægja/aðlaga — sjá yfirfærslutöfluna.
- **UI-inngangur í dag** uppfyllir ENGAN af #493's fjórum kröfðu UI-þáttum: það er EIN `<select>` með nákvæmlega 2 nöfnum — ENGIN leitarbær Frá-reitur, ENGIN leitarbær Til-reitur, ENGIN víxlhnappur, ENGIN millistaðamerkt leiðarval. Þetta er alveg ný UI, ekki aðlögun á núverandi `<select>`.
- **Sími/lyklaborð:** núverandi `<select>`-einingar eru innfæddar (native), fá sjálfkrafa síma-/lyklaborðsaðgengi. Ný leitarbær Frá/Til-stýring (combobox-líkt) þyrfti EIGIN síma-/lyklaborðssönnun — ekki eitthvað sem docs-only úttekt getur staðfest; skjáskot eru afhendingarkrafa SEINNI innleiðingar (approved-prompt-v1 item 8's eigin orð), ekki þessarar lotu.
- **Engin ferðaframvindu-/öryggisfullyrðing** er í núverandi texta (staðfest með beinum lestri á `translations.winterRoute.js`: "Þetta er ekki öryggisráðgjöf...", "ekki bein mæling á vegi", "Opinberar lokanir ganga alltaf framar") — #493 ítrekar þessa sömu útilokun, engin breyting þörf eða lögð til. Þetta er AÐSKILIÐ frá komutíma-vandamálinu að ofan: "ekki framvindufullyrðing" í núverandi texta þýðir ekki "engir komutímar" — báðar kröfur eru til staðar í #493, aðeins fyrri er núna uppfyllt.

---

## 6. Afköst, mörk og notkun

**W2-leiðrétting (Jonesy R2):** v1-útgáfa þessa kafla skilaði ekki umbeðinni afmörkuðu tillögu og misskrifaði "hver ný leið tvöfaldar" sem O(N) í leiðarhlutum. Hér er bætt við tillögu (merkt TILLAGA, ekki samþykkt hönnun), leiðrétt cardinality-formúla, og sjálfstætt framkvæmd (ekki aðeins Jonesy-eignuð) skörunarathugun á þremur stigum.

- **Núverandi köll per fyrirspurn:** nákvæmlega **3** óháð ytri HTTP-köll, óháð hvaða leið er valin — 1× `faerd2017_1` (landsvísu, síað EFTIR sókn), 1× `faerdpunktar2017_1` (sama), 1× Open-Meteo margra-punkta-kall (leiðarins eigin fasti punktafjöldi: 6 eða 4 hnit Í EINNI fyrirspurn). Þetta er **raunverulegt núverandi cache hit/miss/cold-start-ástand** — ekkert af þessu er tillaga. Open-Meteo-kvóti/mörk eru líklega punkta-/breytutalningar-byggð, ekki HTTP-kalla-talningar-byggð (sbr. `samples/openmeteo-pricing.html`'s eigin FAQ: "one API call corresponds to one HTTP API request" venjulega, EN "more than 10 weather variables or... more than 2 weeks for a single location are considered multiple API calls" — margra-punkta/staða-samlagning er ekki orðrétt tilgreind í þeirri FAQ), svo "1 HTTP-kall" ≠ "1 reikningsfærð einingin" nauðsynlega — þessi aðgreining er haldið sem ÁLYKTUN, ekki staðfest tölulegt samband fyrir margra-punkta-kall sérstaklega.

### Cardinality — leiðrétt formúla (B1)

**v1-villan:** "hver ný leið tvöfaldar" var ekki rétt líkan. **Leiðrétt líkan:** ef S nafngreindir staðir og TVEIR hringvalkostir (hvor leið um Hringveginn) eru studdir per RAÐAÐ endapunktapar (Frá, Til) — raðað par ber áttina nú þegar — er hámark MÖGULEGRA LYKLA **2·S·(S−1)**, án sömu-upphafs/enda-pöra og ÁÐUR en samhverfu-/dedup-nýting er beitt. Þetta er merkt líkan fyrir mögulega lykla, EKKI fjöldi sannreyndra leiða og EKKI fjöldi raunverulega tilkominna cache-entries — þrjú aðskilin hugtök (B1):
  - **Mögulegir lyklar** (2·S·(S−1)): fræðilegt hámark sem gagnalíkanið í §4 leyfði formlega, ef S staðir væru skráðir.
  - **Cache-bucket-fjöldi**: aðeins buckets sem EINHVER notandi hefur raunverulega beðið um (lazy-stofnað, eins og núverandi `cache.js` gerir fyrir `routeId` í dag) — getur verið mun minni en mögulegir lyklar.
  - **Fjöldi sannreyndra leiða**: aðeins leiðir sem hafa VERIFIED keðju-gögn (§3's gap-tafla) — í dag nákvæmlega 2, óháð hinum tveimur tölunum.
  
  Gagnstæð átt er ÁFRAM INFERRED/UNKNOWN per A3 — formúlan telur MÖGULEGA lykla fyrir báðar áttir, ekki staðfestingu á að báðar áttir séu raunverulega keyrðar/sannreyndar.

### Tillaga — hámark punkta/beiðni, batching, partial failure (TILLAGA, ekki hönnun/samþykkt)

- **Parameter M** (tillögugildi, EKKI sannreynt veituhámark): hámark forecast-punkta í einni Open-Meteo-fyrirspurn. M þyrfti að staðfesta gegn raunverulegum þjónustumörkum (ekki gert hér — A1 bannar netköll þessa lotu; `samples/openmeteo-pricing.html`/`-terms.html` nefna köll-á-mánuði/mínútu/klst/dag, EKKI punkta-í-einni-fyrirspurn-hámark sérstaklega).
- **B = ⌈U/M⌉** fyrir U einstaka spápunkta í samsettri leið: fjöldi Open-Meteo-fyrirspurna sem þyrfti ef U > M. Merkt dæmi (U óþekkt fyrir fullan hring, G5-G7 óleyst): við U=6 (núverandi Vík) eða U=4 (núverandi Borgarnes), B=1 óháð M (bæði innan hvers raunhæfs M). Við óþekkt stærra U (t.d. heill hringur) er B=⌈U/M⌉ eina gefna talan — EKKI reiknuð heildartala, því bæði U og M eru óstaðfest.
- **Batching/takmörkuð samhliða vinnsla:** tillaga, ekki hönnuð: B fyrirspurnir send í takmörkuðum fjölda samtímis (ekki allar í einu), hver með sinn eigin bounded-fetch-ramma (15s/2MiB, óbreytt). Bilun í EINNI batch/punkti skilar þeim punktum `available: false` (sama `ForecastCard`-mynstur og í dag) — ALDREI jafngilt "góðum skilyrðum" og ALDREI felur önnur, gild batch-gögn (sama "per-point failure, not whole-batch" regla sem `validateForecast.js` þegar notar fyrir einn-kall-marga-punkta í dag, útvíkkuð yfir margra-kalla-tilvik).
- **Landsvísu Vegagerðar-feed deiling:** í dag sækir HVERT `routeId`-bucket sitt EIGIN landsvísu-afrit af `faerd2017_1`/`faerdpunktar2017_1` (óháð því að báðar beiðnir sækja SAMA, óbreytta landsvísu-gagnasafn). TILLAGA (eigandasamþykki þarf): deila EINU landsvísu-afriti milli allra routeId/tengla-buckets (sían að `idButurList` gerist EFTIR sameiginlega sókn, nákvæmlega eins og einn bucket gerir í dag innbyrðis) — myndi ekki vaxa með fjölda leiða/tengla yfirleitt. Þetta er UNDAN núverandi hönnun; ENGIN breyting lögð til án eigandasamþykkis, og engin ný dreifð innviði er lögð til.
- **Punkta-/tengils-stigs cache í stað leiðar-stigs:** TILLAGA — ef sama veðurpunkt er notaður á fleiri en einni samsettri leið (#493's eigin krafa, "Sama veðurpunkt skal hægt að nota á fleiri en einni leið"), gæti punktur-/tengils-stigs cache-lykill (í stað heilrar-leiðar-lykils) komið í veg fyrir tvísóknir á sama punkti þegar tveir Frá/Til-pör deila einum tengli. ÞETTA ER EKKI núverandi hönnun (sem er leiðar-stigs, `routeId`) og er ekki metin hér hvort hún uppfyllir kröfuna að fullu — nefnt sem valkostur fyrir næstu hönnunarlotu.
- **Nauðsynleg auðkenni fyrir samsetta leið (TILLAGA):** punkta-ID/hnit, breytulisti (sömu 5 og í dag), tímaglugga (sama 24klst-UTC-mynstur), og gagnaversjón (t.d. route-definition-version, til að ógilda cache ef `WAYPOINT`/`ROUTE_LINK`-gögn breytast). TTL/ferskleiki/in-flight/fallback-einangrun þyrfti að haldast PER lykli (hvort sem lykillinn er leið, tengill eða punktur) — sama grunnmynstur og `cache.js` notar í dag, bara með fleiri mögulegum lyklum.
- **Route-response identity í nýju líkani:** núverandi `routeId`-samningur (routeId/expectedPointCount/punktafjöldi krosstjékkaður, `requestId`+`AbortController`, `view`/`viewErrorKey`) VERNDAR AÐEINS núverandi tvær föstu leiðir — hann SANNAR EKKI sjálfkrafa upphaf/enda/átt/gagnaversjón fyrir eina samsetta leið úr `WAYPOINT`/`ROUTE_LINK`-gögnum (§4), því samsett leið hefur ekki einn fastan `routeId`-streng að bera saman við. Ný hönnun þyrfti sambærilegt, en útvíkkað, auðkenni (t.d. hlutlaust hash af {from, to, direction, link-version-list}) — EKKI hannað hér, EKKI á við að álykta að núverandi vörn alhæfist sjálfkrafa.
- **Mörk óbreytt, halda gildi:** 15s/2MiB `boundedFetch`, lykilvöntun-fail-closed (ALLT umhverfi fyrir þessa leið, þrengra en sameiginlega hjálparið), engin lyklaskráning í annál.
- **Engin ný dreifð/deild skyndiminniskerfi er lögð til án eigandasamþykkis** — núverandi cache er module-memory (einn volur-invocation), EKKI dreift; áhrif kaldra starta (núll-cache við kalda byrjun) halda gildi óbreytt fyrir hvaða framtíðarlykil sem er.

### Sjálfstætt skörunarpróf núverandi tveggja leiða (B2) — ekki bara Jonesy-eignað

Framkvæmt sjálfstætt þessa umferð (lítil offline Python-athugun á varðveittum skrám, ENGIN ný rúmfræðiafleiðsla/gagnaöflun):

| Stig | Aðferð/heimild | Niðurstaða |
|---|---|---|
| **IDBUTUR** | Vík: `WINTER_ROUTE_IDBUTUR_LIST` (`segments.js`, 13 gildi) vs. Borgarnes: `BORGARNES_IDBUTUR_LIST` (`routes.js`, 8 gildi) — settamunur | **EKKERT sameiginlegt gildi** |
| **IDFERILL/geometry-bútar** | Vík: tier0 (`NAKVAEMNIFERLIS==0`) `VEGNR=="1"`-bútar í `docs/ai/tasks/ticket-483/samples/wfs-chain-4326.json` (36 bútar, python-lesið þessa umferð) vs. Borgarnes: 29-stykkja listinn úr `derivation-29-pieces.md`'s eigin `CHAIN29` (`FIRST11`+`REMAIN18`) | **EKKERT sameiginlegt IDFERILL-gildi** (36∩29 = ∅) |
| **Spápunktar/hnit** | Vík: `FORECAST_POINT_DEFS` (`segments.js`, 6 lat/lon) vs. Borgarnes: `BORGARNES_FORECAST_POINTS` (`routes.js`, 4 lat/lon) — beinn samanburður úr þegar-lesnum kóða | **EKKERT sameiginlegt hnit** (algerlega aðskildir breiddar-/lengdarbil) |
| **Rauðavatn-akkeri, sérstaklega** | Vík's EIGIN `idButurList` inniheldur `1410010037` (fyrsti kafli). Borgarnes's EIGIN `BORGARNES_IDBUTUR_LIST` inniheldur `1410010037` **EKKI** — en `derivation-29-pieces.md`'s upphafsbil er mælt FRÁ `IDFERILL 1436` (sama `IDBUTUR 1410010037`) sem viðmiðunarpunktur, ekki sem sóttur færðarkafli fyrir Borgarnes | **EINN sameiginlegur punktur** (`IDBUTUR 1410010037`/`IDFERILL 1436`), en AÐEINS sem Vík's eigin kafli + Borgarnes's vegalengdar-UPPHAFSVIÐMIÐUN — EKKI sem sameiginlegur SÓTTUR færðarkafli á báðum leiðum |

**Niðurstaða:** staðfestir Jonesy's fund sjálfstætt (eigin keyrsla, ekki endurtekning á hennar orðum) — núverandi tvær leiðir deila ENGU á IDBUTUR-, IDFERILL- eða spápunkta-stigi, en deila EINNI akkerispunkti (Rauðavatn/1410010037/1436) sem viðmiðun, ekki sóttan gögn. Fullyrðingin "leiðir deila engu" í hvaða framtíðar-tillögu sem er MÁ EKKI alhæfast yfir þennan akkerisskiptingarpunkt eða yfir óskoðaða þætti (t.d. hvort tvær FRAMTÍÐAR leiðir gætu deilt heilum kafla, sem núverandi 2 leiðir einfaldlega gera ekki).

**Full-hrings-tala er EKKI gefin upp hér** — það væri að gefa upp tölu fyrir óbyggt líkan (G5-G7 óleyst), nákvæmlega það sem A4 varar við. Formúlurnar/dæmin hér að ofan eru það sem er gefið, ekki tilbúin fullhrings-mæling. Öll afkastatillagan í þessum kafla er docs-only og óprófuð — engin af þessu er framkvæmd eða samþykkt hönnun.

---

## 7. Þjónustur og heimildir

**Vegagerðin** (færð + WFS-geometry): CC BY 4.0 staðfest með orðum á "Skilmálar vefþjónustur"-síðu (VERIFIED DOCUMENT CONTENT, #483 §6) — gildissvið PER EINSTAKA ÞJÓNUSTU (legacy/WFS/DATEX) er ÁLYKTUN ("öll gögn Vegagerðarinnar"), EKKI orðrétt tilgreint per þjónustu. Tilvísunarskilyrði (leyfisgjafi, gagnasett, öflunardagur, leyfistengill) eru ÞEGAR uppfyllt í `WinterRoute.jsx`'s attribution-kafla, óbreytt. Punktafóðrið yfir HTTPS er UNKNOWN (G11) — tæknilegt flutningsgat, ekki leyfisgat. Engin reikningur/kvóti fannst fyrir neina Vegagerðarþjónustu (nafnlaus aðgangur staðfestur, #429).

**Open-Meteo**: núverandi framleiðslunotkun er ÞEGAR á greiddri `customer-api.open-meteo.com`-leið (#453/`docs/open-meteo-auth.md`) — EINA leiðin sem styðst við skjölun fyrir þessa vöru, því almenni/ókeypis hýsillinn BANNAR atvinnunotkun orðrétt og þessi vara hefur greiddar áskriftir (#485's bindandi fund, ekki endurrannsakað hér — A1 bannar netköll þessa lotu). Production bilar LOKAÐ (núll fyrirspurn) ef lykill vantar — óbreytt, óháð #493. **Lykilgildi, Preview-staða, raunveruleg customer-host-svarform/einingar, og kvótaslaki fyrir vaxandi punktafjölda (§6) eru ÁFRAM EIGANDA-HLIÐ UNKNOWN** (#485) — staðfest EKKI endurrannsakað þessa lotu, og er VARANLEGT, ekki eins-umferðar, krafa per #485's eigin owner-clarification.

**Ný þjónusta:** EKKI valin, EKKI mælt með sjálfkrafa. Núverandi tveir birgjar virðast í grunninn nægja fyrir tengt-vegkafla-líkan (§4) — EN handvirk, margra-umferða WFS-keðju-aðferðin sem byggði núverandi 2 leiðir skalast ekki augljóslega sjálfkrafa yfir á heilan hring án margra viðbótar rannsóknarlota af sömu stærðargráðu og #483/#491 hvor um sig. Þetta er NEFNT sem áhættu-/ákvörðunarefni fyrir eigandann, EKKI tillaga um að taka upp greidda leiðaþjónustu — sú leið myndi sjálf krefjast eigin réttinda-/kostnaðarrannsóknarlotu ef hún yrði nokkru sinni lögð til.

---

## 8. A5 — Samsvörun við útgáfumiða #493 (`issue-493-2026-11-05.json`)

| Útgáfumiða-krafa (bein tilvitnun/samantekt) | Studd núna? | Þessi úttekt |
|---|---|---|
| "Fyrsta skref: Yfirfara núverandi innviði" | **Þetta skjal** | Lokið með þessari úttekt |
| Tveir leitarbærir Frá/Til-valreitir úr skilgreindum stöðum | **NEI** | §5, §0 — ekki til |
| Víxlhnappur Frá/Til | **NEI** | §5 — ekki til |
| Sami staður í báðum ⇒ skýr skilaboð | **NEI** (ekkert tilvik er til að gefa skilaboð um) | §4 tillaga nefnir þetta sem hönnunarkröfu |
| Listi yfir studda staði fylgir afhendingu | **Að hluta** — 2 nafngreind endapunktar + 2 (Vík/Borgarnes) eru "studdir staðir" í dag, EKKERT annað | §3 gap-tafla |
| Leið byggist á tengdum vegköflum eftir Hringveginum | **Að hluta** — tveir stikkar, EKKI hringurinn | §1, §3 |
| Veðurpunktar/færðarkaflar í akstursröð | **JÁ fyrir núverandi 2 leiðir** | §1 (fastar fylki í réttri röð) |
| Styttri leið sjálfgefið val, ekki kölluð öruggari | **Ekki á við enn** (engin valkvæð tvö leiðaform til að bera saman) | §4 tillaga |
| Notandi getur valið hina leiðina um Hringveginn | **NEI** (hringurinn er ekki byggður) | §3 G5-G7 |
| Millistaðanöfn ("Um Vík og Höfn") | **NEI** | §3 G9 |
| Lokun birtist skýrt, ekki sjálfvirk hjáleið | **JÁ fyrir núverandi 2 leiðir** (engin hjáleiðarökfræði er til neins staðar, sem þegar uppfyllir "ekki skipta sjálfkrafa") | §1 |
| Tengingar frá valstöðum að Hringveginum skilgreindar sérstaklega | **JÁ fyrir núverandi 2** (Rauðavatn-tengingin er VERIFIED keðja) | §2, §3 G1/G3 |
| Veðurbreytur/einingar endurnýttar | **JÁ** | §1 (sömu 5 breytur, sömu einingar, óbreytt) |
| Punktar skilgreindir þannig að fjallvegir/berskjaldaðir kaflar falli ekki milli punkta | **JÁ fyrir núverandi 2** (P3 Hafnarfjall, Hellisheiði-punktar sérstaklega valdir af þessari ástæðu, #491/#486) | §1 |
| Fjöldi punkta má ráðast af lengd leiðar | **NEI** — fastur per leið í dag | §3 G12, §4 |
| Punktur/heiti/hnit/tenging per punkti | **JÁ fyrir núverandi 2** | §1 |
| Þetta er punktspá, ekki samfelld þekja/mæling | **JÁ** (`winterRouteGridDisclaimer` strengur) | §1 |
| Gagnaskortur skýr, ekki góð skilyrði | **JÁ** | §5 |
| Tengja leið við færðarkafla/tilkynningar Vegagerðarinnar | **JÁ fyrir núverandi 2** | §1 |
| Birta aðeins upplýsingar sem tengjast valinni leið | **JÁ** (idButurList-sían er leiðarbundin) | §1 |
| Aðgreina færðarstöðu frá tilkynningum (vegavinna/grjóthrun) | **JÁ** (`roadConditionCodes.js`'s aðgreind flokkun) | §1 |
| Sýna hvenær færðargögn sótt | **JÁ** (`winterRouteAcquiredAt`) | §1 |
| Merkja óþekkta stöðu/úrelt gögn/mistök sérstaklega | **JÁ** (stale/unavailable/unknown eru öll aðskilin) | §1, §5 |
| Varðveita heimildatilvísanir | **JÁ** (attribution-kafli óbreyttur) | §1, §7 |
| Merkja valinn tíma sem tíma veðurspár | **JÁ** (`winterRouteValidFor`) | §1 |
| Sami spátími fyrir alla punkta leiðar | **NEI — W1-leiðrétting.** `selectedHour` er einn deildur stöðubreyta, EN hvert punktakort leysir sitt EIGIN spáklukkutíma gegnum `resolvePointAtDeparture` (fjarlægð+70km/klst+ceil), ekki beint af `selectedHour`-vísitölunni. Tveir punktar á sama völdum tíma geta því sýnt gögn frá TVEIM MISMUNANDI klukkustundum | §5 (yfirfærslutafla) |
| Aðgreina framtíðarspá frá nýjustu færðarstöðu | **JÁ** (tveir aðskildir hlutar síðunnar) | §1 |
| Skýr skilaboð utan spátímabils | **JÁ** (`winterRouteForecastNotAvailableAtComputedTime`) | §1 |
| ENGIN komutímaútreikning á einstaka punkta / ENGIN framvindufullyrðing | **NEI — W1-leiðrétting.** `resolvePointAtDeparture` reiknar per-punkts komutíma, og "Áætluð koma: {time} UTC" birtist á hverju punktakorti í dag (`ForecastCard`). Engin ferðaframvindu-/öryggisfullyrðing er gerð (það atriðið ER uppfyllt), en komutímaútreikningurinn sjálfur ER til og er nákvæmlega það sem #493 útilokar | §1, §5 (yfirfærslutafla) |
| Endurnýta skyndiminni/gagnasókn | **JÁ** (routeId-bil, óbreytt mynstur) | §6 |
| Sama veðurpunkt notanlegur á fleiri en einni leið | **NEI í dag** (hvor leið hefur sína eigin punktalista, engin deiling) | §6, §4 |
| Hámark punkta/fyrirspurn + lengri-leiða-meðferð skilgreind | **TILLAGA gefin (W2), EKKI samþykkt hönnun** — parameter M, B=⌈U/M⌉, batching/partial-failure-regla | §6 |
| Sannreyna fjölda þjónustukalla/notkun fyrir langa leið/heilan hring | **Formúla/tillaga gefin, EKKI full-hrings-tala** (óbyggt líkan, óstaðfest M) | §6 |
| Breyting á leið lætur ekki eftir gögn frá fyrra vali | **JÁ, þegar sannreynt** (#491 V2 `view`/`viewErrorKey`) | §1, §6 |
| Bæta reitum í NÚVERANDI síðu, EKKI heildarendurhönnun | Óbreytt krafa, viðurkennd | §5 |

**Samþykktarskilyrði-gátlisti úr miðanum** (14 atriði, hrein já/nei-staða): "Núverandi innviðir yfirfarnir" = JÁ (þetta skjal). Öll önnur 13 atriði miðans eru ÓUPPFYLLT í dag að einhverju eða öllu leyti — nákvæmlega samræmt §0's `BLOCKED_PENDING_OWNER_SCOPE_DECISION`-niðurstöðu. Miðinn sjálfur segir beint: "Miðinn telst ekki fullgerður með því einu að bæta fleiri föstum leiðum í fellilista" — þessi úttekt leggur EKKERT til sem myndi brjóta þá reglu (tillagan í §4 er sett fram sem almennt tengt-vegkafla-líkan, ekki "bæta við þriðju fastri leið").

---

## 9. Acceptance-/test-matrix tillaga fyrir seinni innleiðingu

(Tillaga, ekki framkvæmt — engin skjáskot/raunpróf í þessari docs-only lotu.)

| # | Sviðsmynd | Hvað sannreynist |
|---|---|---|
| T1 | Stutt leið (t.d. núverandi Borgarnes, 4 punktar) | Grunnflæði, fastur punktafjöldi |
| T2 | Löng leið (t.d. núverandi Vík, 6 punktar, eða samsett leið eftir §4 ef byggð) | Lengri punktalisti, lengri segment-listi |
| T3 | Báðar áttir sama leiðarpars | Stefna er sjálfstætt sannreynd EÐA skýrt merkt INFERRED/UNKNOWN í UI — ekki þögul viðsnúin fylki |
| T4 | Víxlaðir endar (Frá↔Til takki) | Sama leið, viðsnúin röð punkta/kafla, ekki endurteikning á rangri átt |
| T5 | Sami staður í Frá og Til | Skýr skilaboð, ekki villu-ástand eða þögull hringur |
| T6 | Jafnlangir valkostir (tvær áttir ~sama lengd) | Sjálfgefið val er stöðugt/ákvarðanlegt, ekki slembin flökt |
| T7 | Deildir endapunktar/sameiginlegir punktar milli leiða án tvítalningar | Sami punktur sýndur einu sinni, ekki tvisvar í samtengdri leið |
| T8 | Óviðkomandi kaflar/tilkynningar útilokaðar | `idButurList`-sían heldur réttilega leiðarbundinni einangrun |
| T9 | Lokun á valinni leið | Birt skýrt, ENGIN sjálfvirk hjáleið |
| T10 | Missing/stale/error gagnaástand (öll þrjú, sérstaklega) | Hvert ástand hefur sinn eigin, aðgreindan streng/hegðun |
| T11 | Sameiginlegur spátími + utan-glugga sviðsmynd, mismunandi fjarlægir punktar | **W1-uppfærsla:** sami UTC-spátímamerki fyrir TVO punkta í ólíkri fjarlægð frá upphafi (t.d. 5km og 60km) — BÁÐIR lesa SAMA klukkustundarvísitölu, óháð km/klst-forsendu eða ETA; skýr "ekki tiltækt" ef valinn tími er utan sótts 24klst-glugga (ekki punkts-sértæk ETA-útreikning) |
| T12 | Lengsta studda leið / batch-failure (ef §4's N-punkta-batching er byggt) | Hluti bilun hylur ekki allt, skýr delvis-gögn |
| T13 | Kapphlaup/skyndiminnis-einangrun (A→B→A, hröð víxlun) | Engin gömul gögn leka milli leiða — endurnýtir #491 V2's staðfesta mynstur |
| T14 | Sími/lyklaborð, IS/EN, fyrir NÝJU Frá/Til-stýringuna sérstaklega | Ekki falið undir "núverandi `<select>` er aðgengilegt" — þetta er ný stýring |
| T15 | **Nýtt (W1):** Engir komutímar/ferðahraðaforsendur/brottfararráðleggingar birtast í #493-flæði | Engin "Áætluð koma"-strengur, engin 70km/klst-copy, engin ±2klst-samanburðar-UI sýnileg fyrir samsetta #493-leið — þessi próf eru EKKI fullyrt keyrð hér, aðeins tillögð fyrir seinni innleiðingu |

---

## 10. Samantekt — hvað má endurnýta núna / hvað þarf yfirfærslu / hvað er BLOCKED

- **Endurnýtanlegt ÓBREYTT í dag:** `boundedFetch.js`, `roadFetch.js`/`roadConditionCodes.js`/`freshness.js` (taka `idButurList` sem breytu þegar), skyndiminnis-mynstrið (`cache.js`, per-routeId), `validateForecast.js`, hrein framsetningarföll (`winterRoutePresentation.js`), `view`/`viewErrorKey`-race-vörnin, öll attribution-/disclaimer-copy, og hrein summu-/hámarks-/lágmarksstærðfræðin innan `winterRouteSummary.js`/`winterRouteComparison.js` (EN EKKI inntakið sem þær fá í dag — sjá næst).
- **W1-leiðrétting:** ETA-/komutíma-/±2-samanburðar-reiknirinn (`winterRouteEta.js`'s `computeEta`/`resolvePointAtDeparture`, og `winterRouteComparison.js` í heild) er **EKKI** "endurnýtanlegt óbreytt" fyrir #493 — þetta er nákvæmlega eiginleikinn #493 setur utan umfangs. Yfirfærsla þarf hér (sjá §5's yfirfærslutafla og eigandaákvörðun um núverandi tvær leiðir), ekki einföld endurnýting.
- **Þarf yfirfærslu (hönnunarbreyting, EKKI ný gagnaöflun fyrir núverandi 2 leiðir):** `routes.js`'s `ROUTE_DEFS`-fasta-Map → almennt `WAYPOINT`/`ROUTE_LINK`-gagnasafn (§4); `expectedPointCount` úr föstum leiðarfasta í summu-af-tenglum; frontend `<select>` → leitarbær Frá/Til + víxlhnappur + millistaðanöfn (alveg ný UI, §5); tímavals-kóðinn úr per-punkts-ETA í sameiginlegt-val (§5's yfirfærslutafla).
- **BLOCKED (krefst nýrrar gagnaöflunar, EKKI docs/hönnunarvinnu):** G5 (Reykjavík-Akureyri geometry, FAIL), G6/G7 (restin af hringnum, aldrei rannsökuð), G2/G4 (öfug átt fyrir núverandi 2 leiðir, ef krafist sjálfstæðrar sönnunar frekar en UI-einfaldrar "sama leið viðsnúin" nálgunar), G8 (Reykjavíkur-álma span-0, aðeins viðkomandi ef "Reykjavík" sjálf þarf að vera valkostur).

**Eigandaákvörðun sem þarf ÁÐUR en nokkur ný rannsóknarlota er samþykkt:** Hvaða undirmengi hringsins er í v1-umfangi — núverandi 2 stikkar + öfug átt þeirra (lítil ný gagnaöflun), EÐA stærri hluti hringsins (Akureyri-leiðin, austurhlutinn framhjá Vík) sem krefst margra nýrra, stórra WFS-rannsóknarlota líkt #483/#491. Þessi úttekt tekur EKKI þá ákvörðun — hún leggur fram kostina og kostnaðinn (§3/§6/§7) svo eigandinn geti.

**Önnur eigandaákvörðun, aðskilin frá þeirri að ofan (§5):** hvort núverandi tveggja-leiða ETA-/±2-eiginleikar (#486/#489/#490) flytjast yfir í sameiginlegan spátíma eða haldast í aðskildu eldra flæði — hvorki valið né falið hér, sjá §5's hlutlausa framsetning.

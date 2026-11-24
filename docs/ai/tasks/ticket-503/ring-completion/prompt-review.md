# #503 — Síðustu átta Hringvegspörin

## Ripley initial prompt — umferð 1 — 2026-11-24

Eigandi heimilaði lotuna („gerðu það“). Fyrri ring-options er PASS/CLOSED. Þetta er review-skjal; CC framkvæmir aðeins approved prompt sem CURRENT vísar á við READY_FOR_CC og eigandi „Prompt approved“.

## Markmið og umfang

Tengja veður og færð á núverandi /winter-route fyrir átta óröðuð pör, báðar áttir:

1. Rauðavatn ↔ Egilsstaðir
2. Rauðavatn ↔ Seyðisfjörður
3. Selfoss ↔ Hella
4. Selfoss ↔ Egilsstaðir
5. Selfoss ↔ Seyðisfjörður
6. Hella ↔ Egilsstaðir
7. Hella ↔ Seyðisfjörður
8. Egilsstaðir ↔ Seyðisfjörður

Nota nákvæmlega þá einu canonical leið sem geometry-API skilar nú þegar. **Engir nýir north/south-valkostir á þessum pörum.** Fyrri tvö option-pör og 15 Vestfjarðapör óbreytt. Eftir lotu eru **25/25 núverandi valhæf pör** tengd, 25/28 API-pör (3 junction-pör eftir). Þetta jafngildir ekki fullri lands-/veðurþekju eða samþykki fyrir sjálfvirkri GitHub-lokun #503.

## Lesa / staðfesta data-flow áður en skrifað er

AGENTS/CLAUDE, docs/ai/README/CURRENT, docs/open-meteo-auth.md, fyrri ring-options og westfjords-completion approved/report/result-review/remaining. api/winter-route-data.js, api/winter-route-geometry.js, geometryDataset/geometryComposition, ringOptionsRoute/ringOptionGeometry, forecastFetch/validateForecast/cache/roadFetch/freshness/roadSegmentPresentation, WinterRoute.jsx/i18n og focused próf.

Ripley gerði **offline read-only** athugun á raunhandler: allar 16 áttir eru geometry_only. Evidence/offline-matrix.mjs og .json geyma nákvæma geometryId/datasetVersion, IdButur, source/vertex-hnit og fryst ID-mengi. Engin upstream-köll eða appbreyting í promptagerð.

| Par | Planar lengd um km | Punktar hvor átt | IdButur hvor átt |
|---|---:|---:|---:|
| R–E |615,3|14|37|
| R–Sey |639,5|16|38|
| Selfoss–Hella |35,6|2|2|
| Selfoss–E |620,6|14|29|
| Selfoss–Sey |644,8|15|31|
| Hella–E |585,0|13|28|
| Hella–Sey |609,1|14|30|
| E–Sey |24,1|3|2|

Union þessara leiða er **67 IdButur og 31 punkt-ID**. Nákvæmar raðir/bindingar í matrix; ekki nota aðeins samantektartölu sem próf.

## Fryst punktaval — endurnýta, aðeins þrír nýir

Endurnýta registry-hnit/ID í RING_OPTION_POINTS óbreytt þar sem valið er í matrix. Bæta þremur:

| ID | IS/EN heiti | Native source/vertex og hnit |
|---|---|---|
| egilsstadir-route | Egilsstaðir / Egilsstaðir |2344v0:715153.74/536679.93/z56.3606|
| seydisfjordur-route | Seyðisfjörður / Seyðisfjörður |2894v1:732875.674/538207.0762/z3.0279|
| fjardarheidi-route | Nærri Fjarðarheiði / Near Fjarðarheiði |3409v0:722827.8006/537350.2933/z615.7701|

Fjarðarheiðarhnútur er hæsti geymdi z-hnútur innan nafngreindra lína, ekki staðfest opinber fjallhæð eða fullkomin spáreitsbinding. Endar E/Sey eru raun dataset.endpoints, ekki frjálst miðbæjarval. WGS84 reiknað offline með fyrri litlu GRS80/Lambert-aðferð, engin dependency/ný heimildaleit. Próf lesa raun source-vertices/tier/hash/CRS og nota óháða útreikningsaðferð/retained akkeri þar sem til. Native z er ekki returnedElevation; ekki bæta elevation-færibreytu við spá.

Matrix er **föst tillaga til samþykktar í þessari yfirferð**, ekki runtime sampling. Script valdi enda + til staðar named mountain-punkta og aðra eldri registry-punkta í ferðarröð ef þeir eru minnst15 km frá þegar völdum (native planar og chainage). Frystar **16 raðaðar ID-raðir** verða notaðar við keyrslu, ekki sjálfvirk hnit-aðild alls registry. Það kemur í veg fyrir draugapunkta úr öðrum options/áttum og breytingu á fyrri átta option-variants. Native-same hnit fá sama stableID, ekki index-alias; per-route source-aðild má vera á öðru source:vertex með sama nativehniti en verður prófuð gegn raun slices.

Þröng E–Fjarðarheiði–Seyðisfjörður tenging er raunprófsforsenda: ef nearest-requested-order fellur verður STOP með minnstu lausn, ekki sjálfvirk færsla/eyðing punkts eða slökun á validator. Engin göngaspá: föst göngu-IdButur-vörn úr fyrri lotu, ekki substring-leit.

## Fyrst bounded raunpróf, síðan innleiðing

Task-local skripta í evidence/, núverandi fetchRoadSegments/fetchRoadPoints/fetchWinterRouteForecast, 15s/2MiB, 24klst UTC og núverandi auth fail-closed. Engin publicfallback/hostleit/geocoding/provider/ný forecast-breyta.

Fyrsta minnstu próf: **ein segment-feed og ein point-feed fyrir 67-ID union + ein 3-punkta forecastbatch fyrir E→Sey**, samtals3upstream-köll. Sannreyna þrjá nýju punktana áður en API/UI er útvíkkað. Ef grænt, forecast fyrir hinar15áttir, eitt batch hver, án roadrefetch: **hámark18 proof-köll (2road+16forecast)**. Engin óþörf endurtekning milli prófa; mest2tilraunir vegna tólbilunar, ekki endurtaka heppnaðan hluta. Sem einfaldara jafnsterkt val má nota eitt union-batch með31punktum ef helper/2MiB rúmar það, en þá þarf offline endurvalideringu á16raunleiðarhlutmengjum úr sama svari og má ekki láta union-only order-mismatch fela gögn; **ekki byggja nýtt fetch/chunk-framework til þess**. Sjálfgefið er litlu föstu per-route batch-köllin.

Vista `evidence/probe-output.json` strax: timestamps/status/reason/callcount/elapsed/bytes, 67ID found/missing/ambiguous/noticeexpiry/freshness; per-point requested/returned latlon/snap/elevation/nativeZ; 24UTC-gildi og order-margin per-route/minimum/ID. Lykill aðeins boolean, engin URL/env/apikey/stór feedsnapshot. Missing road row = unknown ef auðkenni rétt; ambiguous áfram heiðarlegt. Key_missing/too_large/timeout/invalidforecast/order_mismatch á raunleið => STOP háða innleiðingu og lýsa minnstu lausn. Engin mock-only samþættingar-PASS. Mæla stærsta16punkta batch; fyrra18punkta proof stendur en ekki fullyrða að ný gögn séu sótt án keyrslu.

## API / canonical geometry / cache

Sama winter-route-data.js, litlir helperar/route-færslur. Resolve með núverandi **óstefndum** composeGeometryPath á geometryDataset og sömuendpoints og generic-grein geometry-handler, ekki north/south resolver eða handstytting á einum hringvariant. Leiðirnar eru núverandi varðveittur geometry-grunnur með UNVERIFIED takmörkum, ekki ný lögleg akstursleið. GeometryId/datasetVersion verða nákvæmlega eins og raunhandler fyrir báðar áttir.

Nýju pörin hafa **ekkert selectedOption og ekkert policyVersion** í geometry-svari; svar og UI-validation fá skýra þriðju identity-gerð:
- Vestfirðir: regionVersion;
- fyrri option-pör: datasetVersion + policyVersion + selectedOption;
- þessi generic hringpör: datasetVersion eingöngu (auk from/to/geometryId).

Gerðirnar útiloka ósamræmda blöndu, ekki gera alla identity-reiti valfrjálsa. Stray option á þessum pörum hunsað eins og geometry-handler, ekki ný option-routing. Fyrri option-pör krefjast south/north óbreytt. Rangt/vantar geometryId, unsupported/same-place =>400 fyrir upstream. Engin clientcoords/IdButur/host/routeID notuð.

RoadSections leidd úr actual slices, global first-come IdButur-aggregation eins og ringOptionsRoute til að forðast duplicateReactkeys/tvítalningu. Lengd kafla + unmappedLengthM = routeLengthM. Null-ID tengingar ekki færðar á næsta veg. Hringjaðarregla<100m, ekki1% af600km; texti ekki0,0%. Nafnatafla endurnýtir núverandi72heiti þarsemviðá, aðeins ný heiti bætast í litla fasta EN-töflu. Engin vélþýðingarþjónusta. R1a, pointfeedstale/down=>no-positive, missingunknown, closure/work/notices/expiry aðgreind, engin heildarleið-opin/lokuð/hjáleið.

**16 föst direction-specific cache-fötur** halda innleiðingu einfaldri og óháðri hugsanlegri reverse-samhverfu. Sama exactrequest single-flight3coldcalls, warm0; forward+reverse6; all16cold48 (32landsfeedniðurhöl), ásamt fyrri23? Ekki nota óstaðfesta heildartölu: report telji fyrri15Vestfjarðapör og8optionsvariant sérstaklega (45+24), ný16variant48, samtals117coldcalls ef allt kaldkeyrt. Þetta er reikningur, ekki SLA/raunmæling. Engin shared-national-feed architecture ílotunni, engin refetch perhour/perpoint eða preload á öðrumleiðum. Hámark16punktar á nýrri productionbeiðni; núverandi18hámark óbreytt.

## UI / correctness / próf

Núverandi eitt gagnaviðmót; gateaukinn um8pör, nýju geometry-only svörin kveikja gagnasókn **án option**. Dataidentity from/to/geometryId/datasetVersion, render-mask/abort/requestId. Langar≥400kmleiðir halda samaUTC-samanburðarfyrirvara; engin ETA/arrival/departure. Defaultval/hugsanleg optionstýring verður ekki birt á genericpörum. Stale/partial/nohours/per-pointunknown, unavailablealdrei0punktar, sr-onlystatus utan korta, samaUTCslot áöllum, timechangeekki fetch/fókus. IS/EN/T3 oghreinbilheiti.

Skipti optionsnorth→genericR–E→E–Sey→Vestfirðir→ótengt/same-place með seinkaðPromise/Profiler: engar gamlar upplýsingar undir nýjum haus. Sérstaklega sanna að gamla selectedOption fylgi ekki næstupörum. Fyrri502örvalyklar/fókus/defaultoptions og15Vestfjarðapör/8ringvariants regression óbreytt.

Focused próf:
1. Allar16áttir geometry-handler ↔ data-handler/resolver: geometryId/datasetVersion/lengd/slices/pointmembership/föstIDröð/chainage/vegID/unmapped/jaðar. Próf setji ekki exactreversekröfu nema matrix sannar það.
2. Auðkennd forecastgildi með eiginrequestedcoords: hver punktur available:true og sínspá íöllum16áttum, cachedisolation/köll/coldwarm; auth/keymissing/unknown/stale/failure/rangtID/expirednotices.
3. Front/back parity yfir alla11valhæfa staði: **25tengd óröðuðpör,50áttir**, aukfyrrioptionvariants; mixedRing–Westfirðir áfram unsupported ogsame-placeekkiweatherfetch. Skýr aðgreining25tengdra vsalls55mögulegra para meðal11staða.
4. UI races/3identitygerðir/malformed200/gap/perpoint unavailable/UTC/no0/status/focus. Regressions eftir raunbreytingum, ESLint snertJS/diffcheck; enginfullsuite/mutation/optionalreviewloops. Fyrir/eftirfjöldi ogskipanir íreport.

Raunbackend+Vite sýnishorn: R↔Egilsstaðir, Selfoss↔Seyðisfjörður (lengst), Egilsstaðir↔Seyðisfjörður (Fjarðarheiði), Selfoss↔Hella (styst), aukskiptaúr gömluoptionsnorth ígeneric. Mobile360/desktop,ISEN,UTC/keyboard. Ekki screenshotkrafa fyrirhverja16áttar; matrixpróf næröllum. Nýscreenshots aðeinsring-completion/evidence, ekki eldri myndir. Computer-use reglur, mest2tóltilraunir/honesthandoff; skráraun/stub/óprófað,ekkisjónræntPASS afCC.

## Skil / lokamörk

cc-report.md +remaining.md íþessarimöppu: vistaðrealproof,3nýpunktbinding/transform,31union/16perrequest,matrix/köll/cache/gaps/próf/screenshots/óprófað. Eftirlotu25/25núverandiUI,25/28API,3junctionáframótengd. Þetta tekur ekki56staði ílandslista ínotkun og ekki fulla samfellda veðurþekju. Ekki opna nýjaumferðtilvalfrjálsraþekjupunkta.

Stuttur efnislegur lokunarstatus #503 íreport: hvað acceptance nærnúþegar og hvaða raunbil standa (m.a.3junction,thinpointcoverage); ekki löng compliance/releasechecklist, ekki lokaGitHub. Eigandi ákveður síðar hvort #503 lokast áþessumMVPmörkum eðaþarfafmarkaðviðbót. Enginn nýmiði/comment/nextprompt sjálfkrafa.

Heimilt að breyta datahandler/litlumapihelpers/núverandiJSX/i18n/prófum/taskdocs/CURRENT. Engin nýdependency/handler/geometryJSON/policy/endpoints/provider/scoring/tierclip/entitlement/checkout/#492kort. Ef þriggjapunkta binding/order proof/genericidentity krefst annars scope STOPmeðnákvæmu vandamáli/minnstulausn. Ekki færahnúta/fela óþekkt eða endurhanna architecture sjálfkrafa.

CC READY_FOR_CC→CC_IN_PROGRESS→CC_COMPLETE meðreport, Jonesy/Ripley/eigandasamþykki. Stoppaþegar þetta virkar/prófstandast. Enginncommit/push/deploy/GitHub/sjálfvirknæstalota.

---

## Jonesy review — umferð 1 (2026-11-24)

**Niðurstaða: PROMPT_REVIEW — samþykkjanlegt með bindandi P1–P9. Engin gat í matrix eða umfangi: ég endurframleiddi `offline-matrix.json` byte-eins og allar tölur töflunnar standast óháða athugun (16 áttir, 31 punktur, 67 IdButur). P-atriðin herða mælingar, auðkennisgerðir, cache og próf; þau breyta ekki frysta punktavalinu.** Mikilvægasta nýja staðreyndin er að E–Fjarðarheiði–Seyðisfjörður er þrengsta punktaröð sem hefur farið í raunpróf (hnit aðeins 7,7 og 10,0 km á milli), svo raunprófið í fyrsta skrefi er raunverulegt hlið, ekki formsatriði (P2).

**Merking:** *sandbox (mitt)* = Linux/Node v22, raun-`api/winter-route-geometry.js`, `geometryDataset`, raun-`server_data/*` (afrit af repo eftir ring-options), núverandi `winter-route-data.js` og `WinterRoute.jsx`; engin net-köll. *Ekki gert af mér:* Vegagerðin/Open-Meteo, React/vafri/Windows/ESLint, GitHub #503; CC er ekki byrjaður.

### Sandbox-staðfesting á forsendum prompt

- **Matrix:** `evidence/offline-matrix.mjs` keyrt óbreytt (úr rót repo, því handler les `server_data` miðað við cwd) gefur **byte-eins `offline-matrix.json`** (`cmp`). Lengdir 615,3 / 639,5 / 35,6 / 620,6 / 644,8 / 585,0 / 609,1 / 24,1 km, punktar 14/16/2/14/15/13/14/3 og IdButur 37/38/2/29/31/28/30/2 stemma. Union **67 IdButur og 31 punkta-ID**. Samtals 182 punktafærslur (91 á par), 31 ólík source:vertex = 31 ólík native hnit (engin alias-pör).
- **Öfug átt:** í öllum átta pörum er punktaröðin nákvæm öfug, IdButur-röðin nákvæm öfug, lengd jöfn (<0,01 m) og `geometryId` ólíkt milli átta — 16 sjálfstæðar fötur eru réttar og prófin **mega** gera nákvæma öfuga kröfu (matrix sannar hana, sbr. skilyrðið í prompt).
- **Geometry-svar nýju paranna:** `schemaVersion, datasetVersion, compositionVersion, from, to, crs, tier, drivingAccess, status, geometryId, lengthM, lengthNote` (+ `coordinates`, `slices`); **ekkert** `selectedOption`/`policyVersion`/`options`. `option=north`/`bogus` á R–E og `option=south` á Selfoss–Hella gefa `200` með sama `geometryId` (hunsað). Núverandi data-handler: öll átta pör `400 unsupported_pair`; Rauðavatn↔Selfoss án `option` áfram `400 invalid_option`.
- **Kaflar:** fjöldi hlaupa = fjöldi ólíkra IdButur í öllum 16 áttum (37/38/2/29/31/28/30/2), **engin ósamliggjandi endurtekning og enginn null-ID tengikafli** (`unmapped` 0 í öllum 16). Kaflar < 100 m eru aðeins `1410010037` (1,3 m; R–E og R–Sey báðar áttir) og `901130037` (38,9 m; Hella–E og Hella–Sey). Aggregation-/null-tengiprófin þurfa því tilbúin gögn; raungögn sanna aðeins „ekkert slíkt“.
- **Göng:** `904690037` Hvalfjarðargöng og `909000037` Vaðlaheiðargöng á R–E/R–Sey, `911260037` Fáskrúðsfjarðargöng á Selfoss/Hella–E/Sey; engin á Selfoss–Hella og E–Sey. Næsti valinn punktur við göngvertex er 4,2 km (Grundartangi), 10,9 km (Fagridalur), 13,9 km (Ljósavatnsskarð).
- **Nöfn:** 66 af 67 IdButur-heitum eru þegar í 72-heita EN-töflu ring-options; **eina nýja er `911170037` „Fjarðarheiði“** (samanburður á IdButur-mengi: 72 úr ring-options ∪ 67 = 73; 6 af 72 eru ekki á nýju leiðunum).
- **Nýju hnútarnir** (mitt óháða WGS84, sama LCC/GRS80-aðferð, ≤1e-6°): Egilsstaðir 2344v0 = 65.25862, −14.39029 (sami punktur og E1 í norðurvalkosti), Fjarðarheiði 3409v0 = 65.25951, −14.22540, Seyðisfjörður 2894v1 = 65.26022, −14.00953. 3409v0 og 3410v5 eru sama hnit (z 615,7701, eini hæsti hnútur nefndra Fjarðarheiðar-lína; hinar þrjár línurnar ná mest 5,07 m); Seyðisfjörður er síðasti vertex 2894 (vertexIndex 1, z 3,03), Egilsstaðir fyrsti vertex 2344.
- **Þrengsta röðun (haversine milli valinna punkta):** E–Fjarðarheiði **7,7 km**, Fjarðarheiði–Seyðisfjörður **10,0 km**, E–Seyðisfjörður 17,7 km. Ég reikna svigrúm = (næsti annar − eigin) ≤ 7,7/10,0 km og „bisector“ 3,85/5,0 km frá hverjum punkti. Mesti snap í ring-options raunprófi var 2,67 km (79 punktar), lægsta svigrúm þar 16,06 km. Þetta er líklegt til að standast, en ekki tryggt; aðrar leiðir hafa lágmark 10,0 km (R–Sey/Selfoss–Sey/Hella–Sey, sami Fjarðarheiði–Seyðisfjörður hluti), 17,8 km (R–E), 18,6 km (Selfoss/Hella–E).
- **Bil milli punkta (km):** R–E mest 80,5 (Egilsstaðir→Hæreksstaðir) og 78,6 (Ljósavatnsskarð→Öxnadalsheiði); R–Sey 78,7 (Öxnadalsheiði→Ljósavatnsskarð); Selfoss/Hella–E/Sey mest 67,3 (Djúpivogur↔Þvottá); Selfoss–Hella 35,6; E–Sey 13,5.
- **Talning:** 11 staðir ⇒ 55 pör; 25 tengd (15 Vestfirðir + 2 option-pör + 8 ný) og 30 blönduð hring–Vestfirðir sem verða áfram `unsupported`. Cache-reikningur prompt stenst: 16 × 3 = 48 köll (32 landsfeed-niðurhöl); 45 + 24 + 48 = 117 ef allt kalt.

### Bindandi atriði

**P1 — Frysta matrix + nýju hnútana í skrá, ekki aðeins í skýrslu.** Matrix er samþykktur eins og hann stendur (16 raðaðar ID-raðir). Bæta þremur færslum í `RING_OPTION_POINTS` (eða sér tafla sem sameinast henni) með `sourceId`, `vertexIndex`, native x/y/z, **frystu `lat`/`lon`** (mín gildi að ofan, tolerance ≤1e-6° gegn óháðum LCC-reikningi í prófi), `labelIs`/`labelEn` („Egilsstaðir“, „Seyðisfjörður“, „Nærri Fjarðarheiði“/„Near Fjarðarheiði“; ekkert „göng“ í heiti). `offline-matrix.json` hefur ekki lat/lon fyrir nýju þrjá; prófið les þau úr skránni, ekki úr scripti. Frystar raðir prófaðar sem **töflugögn** (`from→to` ⇒ nákvæm ID-röð, 182 færslur), ekki hnit-aðild; nákvæm öfug röð leyfð (sjá hér að ofan). Fyrri 30 punktar og átta ring-option-raðir (79 færslur) óbreyttar.

**P2 — Röðunarhlið E–Fjarðarheiði–Seyðisfjörður er hörð skilyrt.** Fyrsta raunprófið skráir fyrir hvern þriggja punkta: requested/returned lat-lon, snap (km), `ownDistance`, `nearestOther`, **svigrúm** og lágmark. Skráir líka beinar vegalengdir 7,7/10,0/17,7 km. Svigrúm ≤ 0 eða `order_mismatch` ⇒ **STOP** með minnstu lausn (eins og í prompt). Ef svigrúm > 0 en < 1 km: halda áfram, en skýrsla segir það beint („þunnt“) og S-atriði fer í remaining; engin slökun á `validateForecast` og engin sjálfvirk færsla á hnút. Svigrúm á hinum 15 áttum skráð per punkt (lágmark per átt), ekki bara samtals-lágmark.

**P3 — Þrjár sundurgreindar auðkennisgerðir, töfludrifin neikvæð próf.** Gerðirnar eru: Vestfirðir `regionVersion`; option-pör `datasetVersion`+`policyVersion`+`selectedOption`; ný generic pör `datasetVersion` eingöngu (+ `from`/`to`/`geometryId`). Bæði bakendi og `validRouteData` í UI hafnar **öllum** blandaðri gerðum: generic svar með `selectedOption`, `policyVersion` eða `regionVersion`; option-par án `selectedOption`/`policyVersion`; Vestfjarðasvar með `datasetVersion`; rangt/vantar `geometryId`/`datasetVersion`. `compositionVersion` kemur úr geometry-svari en **bætist ekki** við data-auðkenni (óbreytt ring-options hegðun). Dispatch-próf yfir öll 55 pör (110 áttir): nákvæmlega ein af fjórum greinum eða `unsupported`; engin grein skarast; 30 blönduð pör `400 unsupported_pair` fyrir upstream-kall.

**P4 — `option` og cache á nýju pörunum.** Stray `option` (líka `bogus`) á nýju pörunum er hunsað ⇒ `200`, **sama fata og sama svar** og án `option` (geometry-handler gerir þetta í dag, mælt að ofan); á option-pörum gildir óbreytt `400 invalid_option`. Cache-lykill með **sérstöku forskeyti** (ekki `winter-route-data:ring:` og ekki Vestfjarða-forskeytið) og `from|to|geometryId` (+ `datasetVersion`); engin deiling milli átta, 16 fötur. Próf: hvert af 16 lyklum ólíkt, engin árekstur við átta option-lykla eða 15 Vestfjarðapör; kalt = 3 köll, heitt = 0, áfram+öfugt samtímis = 6, öll 16 köld = 48; geymd einangrun þannig að bilun einnar áttar spillir ekki fötum annarra.

**P5 — Kaflar, jaðar, göng og nöfn úr raungögnum.** Prófa á raunhandler-slices: kaflafjöldi 37/38/2/29/31/28/30/2; `unmappedLengthM` = 0 og kaflasumma = `routeLengthM` í öllum 16; `isEdgeSegment` ⇔ lengd < 100 m ⇒ nákvæmlega `1410010037` (R–E/R–Sey) og `901130037` (Hella–E/Hella–Sey), ekkert annað; engin „0,0 %“; Vestfjarðareglan (1 %) óbreytt. Göngavörn aðeins með föstu IdButur-listanum (904690037, 909000037, 911260037), skoðað per leið eins og talið er hér að ofan. Þar sem raungögn sýna enga ósamliggjandi endurtekningu eða null-tengi: aggregation/null-tengi skal prófa með **tilbúnum** gögnum gegn sama helper og ring-options, og skýrsla má ekki segja að raungögn hafi prófað þau. EN-tafla: bæta aðeins `911170037` „Fjarðarheiði“ (annars núverandi 72); próf að enginn kafli í 16 áttum falli á óþýtt heiti nema þar sem EN = IS.

**P6 — Raunprófið: skýrar mörk og skráning.** Skref 1 óbreytt (1 segment + 1 point + 1 þriggja punkta spá E→Sey, 3 köll), síðan eitt batch per hinar 15 áttir, **hámark 18 köll samtals**. Skráir sérstaklega að `911170037` er fundið, óflókið (ekki ambiguous) og með eða án tilkynningar; hin 66 IdButur voru þegar fundin í ring-options-raunprófi (72/72), en endurstaðfest núna af því sama feed-kalli. Mæla stærsta 16 punkta batch (R–Sey) í bætum/tíma. Ef valið er union-batch (31 punktar) þarf samt að mæla 16 punkta per-route-svar (sjá S1). Engin URL/apikey í úttaki, `OPEN_METEO_API_KEY` aðeins boolean.

**P7 — Paritetspróf í repo (lokar S1 úr ring-options).** Eitt **innskráð** próf les pörin úr framenda (`WinterRoute.jsx`: `isWinterRouteDataPair` + `RING_OPTION_PAIR_KEYS` + ný generic listi) og bakenda (allar resolver-leiðir) og ber saman yfir öll 11 valhæf UI-sæti: 25 tengd pör = 50 áttir (+ átta option-variant), 30 blönduð `unsupported`, same-place engin spá. Prófið á að falla ef annað hvort listi breytist án hins. Prompt kallar þetta próf 3; gera það að sérstakri skrá sem CC nefnir í skýrslu.

**P8 — UI: skipti, races og auðkenni.** Gagnasókn á nýjum pörum **án** `option` í URL og lykli; `selectedOption` eldra pars lekur ekki yfir (R→Selfoss north → R–E → E–Sey → Vestfirðir → ótengt/same-place með seinkaðri Promise-keðju og aborti; engar gamlar upplýsingar undir nýjum haus; aftur á R→Selfoss fær nýja sjálfgefna south, ekki gamla north). Langar leiðir (≥ 400 km: R–E, R–Sey, Selfoss/Hella–E/Sey) fá „sami UTC-tími“-fyrirvarann, Selfoss–Hella og E–Sey ekki. 3 punkta E–Sey og 2 punkta Selfoss–Hella sýna per-punkts `unavailable` heiðarlega, aldrei „0 punktar“. Fyrri 103 UI-próf og 15 Vestfjarðapör/átta option-variant eru regression-grunnur; skrá fyrir/eftir fjölda.

**P9 — Skýrsla og lokunarstaða #503.** Skrá: fyrir/eftir próffjölda og skipanir; raunpróf (köll, bæti, svigrúm per punkt); bilin hér að ofan (mest 80,5 / 78,7 / 67,3 / 35,6 / 13,5 km) sem „þunn punktaþekja“, ekki „full þekja“; að R–E og R–Sey fylgja **eingöngu** norðurleið (mælt) og enginn suður-valkostur er í boði á þeim pörum; 25/25 UI og 25/28 API þýðir ekki 56 staði eða samfellda veðurþekju, 3 junction-pör eftir. CC reiknar ekki út „lokað #503“; eigandi ákveður.

### Athugasemdir (S, ekki bindandi)

**S1 — Union-batch (31 punktar).** Ef „eitt union-batch“ er notað: standist öll 31 punktar röðunarprófið á union-listanum, þá standast þeir líka á hverri undirlista (næsti-annar yfir fleiri punkta ≥ yfir færri), svo það er sterkara á *röðun*. En það mælir hvorki 16 punkta svarstærð/tíma né sannar að hver route-pöntun sjálf skili 200, og fall á union væri falskt STOP. Sjálfgefna per-route leiðin í prompt er rétt; union aðeins viðbót.

**S2 — Bara ein leið á R–E/R–Sey.** Geometry velur norðurleið (615 og 640 km); suðurleiðin um Selfoss er ekki í boði á R–E/R–Sey, en Rauðavatn↔Selfoss hefur south/north. Ekki breyta umfangi, en eigandi ætti að vita af því þegar hann skoðar síðuna.

**S3 — Orðalag í prompt.** Setningin „ásamt fyrri23?“ í cache-málsgrein er ófullgerð; talan 117 (45+24+48) er rétt og nægir. „Native z er ekki returnedElevation“ er rétt og á að standa óbreytt.

**S4 — Fjarðarheiði sem „hæsti hnútur“.** Prompt segir rétt að þetta er hæsti geymdi hnútur (615,77 m), ekki staðfest opinber hæð; Open-Meteo hæð á punktinum verður skráð sem `returnedElevation` í raunprófi og á ekki að bera saman við 615,77 sem „skekkju“.

### Mörk þessarar yfirferðar

- Engin net-köll á Vegagerðina/Open-Meteo; röðunarsvigrúm nýju punktanna er **reiknuð áætlun** úr fjarlægðum og fyrri snap, ekki mæling. Engin React/vafra/Windows/ESLint/`git`-keyrsla, GitHub #503 ekki lesið, enginn sjónrænn dómur.
- Ég breytti engum kóða; CC byrjar ekki fyrr en `READY_FOR_CC` og „Prompt approved“ frá eiganda.
- Engin umferð 2 nema eigandi biðji.

**Næsta:** Ripley skerar `approved-prompt-v1.md` með P1–P9 (matrix óbreytt), eigandi samþykkir og CC fær verkið.


## Ripley afhending — 2026-11-24

Jonesy samþykkiP1–P9 fellt óbreytt í approved-prompt-v1.md ásamt sandboxviðmiðum. Matrixóbreytt. Per-routeproof valið(max18köll),P2hardgate≤0/flag<1km;3identitygerðir oginnskráðparitypróf bindandi. Ný lat/lonviðmið fryst íapprovedprompt. Cacheófullgerðsetningfjarlægð,117coldmathskýr. Stage READY_FOR_CC; eigandi→CC„Prompt approved“. Enginapp/net/commit/push/deploy/GitHub.

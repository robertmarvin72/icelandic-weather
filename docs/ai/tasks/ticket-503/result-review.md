# #503 Búðardalur↔Hólmavík veður og færð (fyrsta lota) — Jonesy result review — 2026-11-23

Yfirfarið: `cc-report.md`, `503-remaining.md`, `approved-prompt-v1.md`, `prompt-review.md`, `CURRENT.md`, `evidence/probe-and-registry.mjs` (ekki endurkeyrt), `api/winter-route-data.js`, `api/winter-route.js` (diff á móti fyrri útgáfu), `api/_lib/winterRoute/{roadSegmentPresentation,budardalurHolmavikRoute}.js` (+ próf), `src/pages/WinterRoute.jsx` (nýju hlutarnir), `translations.winterRoute.js`, öll þrjú skjáskotin og til samanburðar `cache.js`, `forecastFetch.js`, `validateForecast.js`, `roadFetch.js`, `freshness.js`.

## Niðurstaða

**PASS á bakenda og gagnabindingu; UI er PASS með þremur göllum (S1–S3) sem ég mæli með að verði lagaðir í einni stuttri, focused lagfæringu áður en eigandi lokar lotunni.** Bakendinn stenst allt sem ég hef bindandi: raunprófið gert á undan, punktaskráin rétt (WGS84 innan 1e-6° af mínum viðmiðum), 7 IdButur leidd úr raun-slices í réttri röð í báðar áttir, jaðarkaflar flaggaðir (205 m / 517 m), `geometryId` sannreynt server-side, cache lykluð á gögnin (samtímis báðar áttir = **3** upstream-köll, ekki 6) og útdráttur úr `winter-route.js` er orðrétt tilfærsla. Gallarnir eru í UI-hlutanum: **S1** allur gagnahlutinn (spákort, 7 kaflar og tímaval) liggur *inni í* `role="status" aria-live="polite"` sem brýtur beint úrslitaákvæði P6(c); **S2** nýja sýnin merkir hvorki stale spá/vegagögn né liðna klukkutíma, þótt gamla flæðið geri það; **S3** misformað `200`-svar frá gagnaendapunkti veldur ómeðhöndluðu `TypeError` í render. #503 er ekki lokið (CC segir það sjálfur og það er rétt) og engin „örugg/opin/fær“-fullyrðing er gefin.

## Merking: sandbox vs CC

- **Sandbox (mitt, Linux, Node v22, vitest 4.1.10, jsdom):** endurkeyrsla á sömu 8 skrám; orðrétt diff á útdrætti; raunhandler `api/winter-route-data.js` keyrður með stubbuðum upstream-svörum (sjá hér að neðan); samanburður á registry-hnitum við mín viðmið; UI-könnun með raunhöndlurum; lestur á kóða; öll skjáskot skoðuð.
- **CC-fullyrt, ekki endurkeyrt af mér:** raunprófið gegn Vegagerðinni/Open-Meteo (7/7 IdButur fundin, 4 raunvirkar tilkynningar, spá 24 klst. með 4 staðfestum punktum, hæðarmunur 2,5 / 1,1 / **0,1** / 20,0 m, `OPEN_METEO_API_KEY` til staðar), Windows/PowerShell 297/297 (vitest 4.1.10, Node 24.11.0, tvær keyrslur), ESLint, `git diff --check`, Playwright **5/5** (503) og **26/26** (502/486/491) gegn raun-`vercel dev` + Vite, og fjöldi falla `16 → 17`. Skjáskotin samræmast raunprófsfullyrðingunum (Gilsfjörður `Vegavinna` ×2, Búðardalur–Laugar `Holur í vegi` ×2, jaðarathugasemdir á réttum köflum), en þau sanna ekki sjálf að gögnin séu raun.
- **Ekkert sjónrænt PASS frá mér;** eigandi skoðar síðuna.

## Sandbox-staðfesting (óháð)

1. **Prófin:** 8 skrár (`winter-route.test.js`, `winter-route-data.test.js`, `winter-route-geometry.test.js`, `roadSegmentPresentation.test.js`, `budardalurHolmavikRoute.test.js`, `WinterRoute.test.jsx`, `winterRoutePlaces.test.js`, `winterRouteGeometryResponse.test.js`): **297/297 PASS með `--testTimeout=60000`**. Með sjálfgefnum mörkum falla áfram **tvö próf** í `WinterRoute.test.jsx`, V1 (a) (5010 ms) og V1 (b) (10 005 ms) — sama viðkvæmni og ég skráði í #502 (S5); sjá S4.
2. **Approved-prompt:** P1–P9 eru bókstaflega eins og mín (hvert atriði `in`-athugað); Ripley leiðrétti 24 klst./WGS84/jaðarkafla/cache.
3. **Útdráttur úr `winter-route.js`:** diff á móti fyrri útgáfu sýnir að **aðeins** `computePointsFeedUnavailableOrStale`, `classifySegmentAmbiguous` og `buildNoticePayload` (ásamt ónotuðum imports) voru fjarlægð og flutt orðrétt í `roadSegmentPresentation.js`; engin rökfræðibreyting. `api/winter-route-geometry.js` er byte-eins og fyrir lotuna (`cmp`).
4. **Registry:** lat/lon í `budardalurHolmavikRoute.js` eru 65.10937097662715/−21.761935218653928, 65.47846693/−21.93362908, 65.5523516/−21.83224971, 65.70146962/−21.68414766 — innan 1e-6° af mínum viðmiðum í prompt-review; native x/y/z eru eins og í `westfjords-region-combined.json`; `sourceId`/`vertexIndex` rétt (2769v3, 3321v0, 3321v47, 3883v3).
5. **Raunhandler með stubbuðum upstream (mitt skrifta, ekki í repo):** `geometryId` úr `/api/winter-route-geometry` (`b19c8443…d64c`, öfugt `1295e077…f029`) = `geometryId` í gagnasvari báðar áttir; **samtímis B→H og H→B á köldum vef = 3 upstream-köll** (segment, point, spá), endurtekning innan TTL = 0 ný köll, ~17 ms/beiðni úr cache; IdButur-röð rétt báðar áttir (öfug fyrir H→B), spápunktaröð rétt báðar áttir, spágluggi 24 klst.; jaðarkaflar 805030037 (205 m) og 907040037 (517 m) með `isEdgeSegment: true`, lokun á jaðarkafla gefur `closed` aðeins á *þeim kafla* (engin leiðar-heildarstaða í svarinu); neikvæð tilvik: rangt `geometryId` → `400 geometry_mismatch`, vantar `geometryId` → `400 missing_param`, öfugt `geometryId` í ranga átt → `400 geometry_mismatch`, `selfoss→hella` og `budardalur→budardalur` → `400 unsupported`, endurtekin `from`-breyta → `400 missing_param`, POST → `405`, `Cache-Control: no-store`, lykill ekki í svari.
6. **UI-könnun (raunhandlerar, stubbuð net):** gagnasvar birtist aðeins eftir `geometry_only` fyrir B↔H; 24 tímar í vali; tengingar-fyrirvarinn („Veður og færð eru tengd á fjórum …“) kemur aðeins eftir staðfest gögn; jaðarathugasemdir birtast á nákvæmlega tveimur köflum; **hins vegar sjá S1 og S3.**
7. **Skjáskot (3 af 3 skoðuð):** B→H desktop IS, B→H mobile EN, H→B desktop IS: 4 spákort með sama UTC-tíma, 7 kaflar í réttri röð, jaðarathugasemdir (0.3 % / 0.7 %), `Óþekkt ástand` á Búðardalur–Laugar (ódokumentuð kóðinn `HOLUR_I_VEGI` fellur í `unknown_unclassified` — heiðarlegt, ekki „gott“), `Aðgát – tilkynning` á Gilsfjörður.

## Athugasemdir (S)

**S1 — UI brýtur úrslitaákvæði P6(c): allur gagnahlutinn er inni í `role="status" aria-live="polite"` (staðfest í sandbox).** P6(c) krafðist þess að gagnablokkin lægi *utan* 502-svæðisins eða hefði eigið svæði „þannig að *aðeins* staða er tilkynnt, ekki fjögur spákort upp aftur“. CC bjó til eigið svæði (túlkun skráð í cc-report), en setti *bæði* stöðutexta og allan gagnahlutann (`BudardalurHolmavikDataView`: tímaval, 4 spákort, 7 kaflar) innan þess. Í sandbox-könnun: tímavalið, spákortin og kaflarnir eru öll `closest('[role="status"]')` sama svæðis. Afleiðing: skjálesari les upp allt innihaldið þegar svarið berst og **les öll fjögur spákortin aftur við hverja breytingu á spátíma**. Lagfæring: halda `role="status"` aðeins utan um stöðulínuna („Sæki …“/villa/„tengt“) og setja gagnahlutann í venjulegt sibling-element; bæta við prófi sem fullyrðir að `#winter-route-data-hour` og spákortin séu *ekki* afkomendur live-svæðis.

**S2 — stale gögn og liðnir klukkutímar eru ekki merkt í nýja hlutanum (P6/P4; gamla flæðið gerir það).** Bakendinn getur skilað `forecast.stale`/`roadMeta.stale`/`roadMeta.available` (stale-fallback: spá allt að 60 mín., vegur 30 mín.), og `cacheAgeMs`. Gamla `WinterRoute.jsx` birtir þetta (`forecast.stale` l. 1151, `roadMeta.available/stale` l. 1180–1187); **`BudardalurHolmavikDataView` birtir ekkert af því**, og `winterRouteDataConnectedDisclaimer` segir „tengd“ án fyrirvara. Auk þess er tímalistinn *óföltaður* (`availableHours = window.expectedHours`), en gamla flæðið síar `> now`: spá sem er allt að ~15 mín. í cache (TTL) eða í stale-fallback getur því boðið liðinn klukkutíma sem „spá“ og valið hann sjálfgefið (`availableHours[0]`). Lagfæring: endurnýta sömu stale-/liðinn-reglur (síun á `now` með `useNowTicking`, stale-athugasemdir), og próf með `forecast.stale: true` og glugga sem byrjar á liðnum tíma.

**S3 — misformað `200`-svar veldur ómeðhöndluðu `TypeError` (staðfest).** Gagnasvar er talið „ok“ þegar `httpStatus === 200` og `geometryId` stemmir; **form svarsins er ekki sannreynt** (`from/to`, `roadSections` fylki, `forecast` hlutur). Sandbox: svar `{geometryId}` án `forecast` → `TypeError: Cannot read properties of undefined (reading 'available')` í render, ekkert „Eitthvað fór úrskeiðis“ birtist. Líkurnar eru litlar (bakendinn skilar alltaf rétt form), en 502-flæðið gerði fulla svarvalidering (P4c) einmitt til að forðast þetta; sama ætti við hér. Lagfæring: lítill `classify`-hjálpari (sama mynstur og `winterRouteGeometryResponse.js`) sem hafnar svari með vantar `roadSections`/`forecast`/rangt `from`/`to` → almenn villa.

**S4 — V1 (a)/(b) próf viðkvæm fyrir hraða (áfram óleyst frá #502).** Sömu tvö próf fara yfir 5000/10 000 ms á 2-CPU sandbox með sjálfgefnum mörkum; standast með `--testTimeout=60000`. Viðbótar mounted tré (nú líka gagnahlutinn) gerir það ekki betra. Ódýrari fyrirspurn (nákvæmur nafnastrengur í stað regex yfir stórt tré) eða breiðara timeout á þessum tveimur.

**S5 — smávægilegt:** (a) jaðarathugasemdin notar *punkt* sem tugabrot á íslensku („0.3 %“); íslenskt snið er „0,3 %“ (EN rétt); (b) tvær eins tilkynningar á sama kafla birtast sem tvær eins línur („Holur í vegi — Tilkynning í gildi“ ×2, „Vegavinna“ ×2) án staðsetningar — gögnin eru raun (CC sá 2+2 í raunprófi), en UI mætti sameina eins línur með „×2“ eða sleppa tvítekningu (ekki blocker); (c) cc-report/CURRENT segja „25 af 28 pörum“ og `503-remaining.md` „26 af 28“ — ef B↔H er eitt af 28 óröðuðum pörum eru 27 eftir; leiðrétta (hrein skjalaleiðrétting).

**S6 — hliðaráhrif á lokuðu #502-skrám.** CC viðurkennir að endurkeyrsla á 502-e2e prófinu *endurskrifaði* þrjú skjáskot í `docs/ai/tasks/ticket-502/evidence/` (`budardalur-holmavik-desktop-is.png`, `flokalundur-selfoss-400-desktop-is.png`, `rvk-budardalur-unsupported-desktop-is.png`) með gögnum dagsins. #502 er lokað; eigandi gæti viljað `git checkout` á þessi þrjú áður en commit (eða samþykkja þau sem myndræn sýnishorn, eins og CC bendir á).

**S7 — fallafjöldi óstaðfestur af mér.** CC segir `api/**` handlerar fara úr 16 í 17; ég sé aðeins hluta repo í mínu staged afriti og staðfesti hvorki töluna né áætlun eiganda. Eigandi þarf að staðfesta að 17 rúmist (CC bendir sjálfur á þetta í `503-remaining.md` fyrir frekari endapunkta).

**S8 — túlkun á P6(c) (ákvörðun Ripley):** CC skráir sína túlkun („tvö aria-live svæði“) heiðarlega; ég tek *hluta* hennar gildan (eigið svæði fyrir stöðu), en ekki þá niðurstöðu að *innihaldið* megi vera inni í því (S1).

## Mörk þessarar yfirferðar

- Ég keyrði engin net-köll á Vegagerðina/Open-Meteo; öll raunprófsgögn eru CC-fullyrt (en samræmast skjáskotunum). Mín „raun“-keyrsla notar raunhandlera og raun-geometry en **stubbuð upstream-svör**.
- Ég keyrði ekki Playwright/raunvafra, Windows, ESLint, `git status`/`diff --check`, og endurkeyrði ekki `probe-and-registry.mjs` eða e2e-skrána; ég las ekki GitHub #503.
- Allar UI-staðhæfingar (S1–S3) eru úr jsdom-könnun á raun-React-trénu með raunhöndlurum, ekki úr raunvafra.
- Ekkert sjónrænt PASS; engin umferð 2 nema eigandi biðji.

**Næsta:** Ripley lokamat; ákveða hvort S1–S3 (+ prófin) fari í eina stutta CC-lagfæringu (focused, ekki umferð 2) áður en eigandi skoðar B↔H á `/winter-route`, fer yfir S5–S7, commitar/pushar. #503 helst opið (`503-remaining.md`).


## Ripley lokamat — 2026-11-23

**Tæknilegt PASS fyrir fyrstu B↔H-lotuna eftir beinar afmarkaðar S1–S3-lagfæringar. Eigandaskoðun viðmóts bíður; CURRENT helst RESULT_REVIEW þar til henni lýkur. #503 í heild er áfram opið.**

Read-only yfirferð staðfesti S1–S3 í raunútfærslu. Lagfært beint innan approved umfangs, engin ný CC-/Jonesy-umferð:
- S1: aðeins stöðulína er live; tímaval og öll spá-/vegakort eru sibling utan hennar. Próf staðfestir DOM-aðskilnaðinn; engin ný skjálesararaunkeyrsla fullyrt.
- S2: sama useNowTicking/regla (> now) og legacy síar liðna tíma; virkur tími fellur á fyrsta gilt slot án fókushreyfingar. Núverandi i18n-texti endurnýttur fyrir stale spá/veg og unavailable vegafeed.
- S3: lítil staðbundin svarathugun staðfestir from/to/geometryId, roadSections/roadMeta og forecast/glugga/punkta/series sem render notar; gallað 200 fer í almennu villuna. Fjögur targeted tilvik prófuð.
- S5(a,c): formatDecimal endurnýtt fyrir íslenskt jaðarhlutfall; remaining leiðrétt í 27 af 28. Fyrri talningar í CC/CURRENT eru söguleg röng tala; þessi leiðrétting gengur framar þeim. Tvíteknar raun-tilkynningar eru ekki blocker og haldast.

**Óháð keyrt hér á Windows/PowerShell:** `npx vitest run api/winter-route-data.test.js api/_lib/winterRoute/budardalurHolmavikRoute.test.js src/pages/WinterRoute.test.jsx` — **121/121 í 3 skrám PASS**, sjálfgefin timeout (17+11+93). Component-próf 87→93, sex ný regression-tilvik. `npx eslint src/pages/WinterRoute.jsx src/pages/WinterRoute.test.jsx` PASS; `git diff --check` PASS (aðeins LF/CRLF viðvaranir). Ekki endurkeyrð öll 297 fyrri próf eða e2e; fyrri raunnet-/Playwright-/skjáskotsniðurstöður áfram eignaðar CC, óháðar sandbox-athuganir eignaðar Jonesy. Engin ný net-/vafra-/framleiðsluprófun hér.

S6: þrjú endurskrifuð #502-skjáskot ekki endurheimt sjálfkrafa; eigandi fer yfir diff fyrir commit. S7: Vercel-áætlun óstaðfest, ekki fullyrt deploy-PASS. Enginn commit/push/deploy/GitHub. Næst eigandi skoðar `/winter-route`, Búðardalur↔Hólmavík og tímaval; samþykki eiganda lýkur þessari lotu, ekki öllu #503.


## Endanlegt PASS — samþykki eiganda 2026-11-23

Eigandi svaraði „Samþykkt“ eftir beiðni um skoðun á Búðardalur↔Hólmavík og tímavali. Fyrsta afmarkaða #503-lotan er samþykkt og CURRENT → CLOSED. Fyrri prófaniðurstöður og skráð takmörk standa; engin ný keyrsla. Þetta lokar lotunni, ekki GitHub-miða #503 í heild. Frekari þekja/langhringmælingar samkvæmt 503-remaining.md eru eftir. Enginn commit/push/deploy/GitHub eða ný lota hér.

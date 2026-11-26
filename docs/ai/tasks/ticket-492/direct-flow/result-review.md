# Jonesy — result review: ticket-492 / direct-flow (2026-11-25)

**Niðurstaða: REVISE.** Meginhluti breytinganna stenst mína sjálfstæðu athugun (flipar horfnir, tvö ný pör virka í adapternum, allar C3-varnir halda í raunkeyrslu, C4 virkar, 13 staðir/2 pör rétt, `api/` óbreytt, eldri þrjár identity-gerðir óbreyttar). En **afhendingin er ekki samþykkjanleg eins og hún er**: (1) eitt eldra parity-próf **fellur** (CC keyrði það ekki), (2) **retry á fixed-villu sendir geometry-beiðni og sýnir rangt „engin leið ennþá“**, (3) **ekkert component-próf ver fixed-flæðið** — ég fjarlægði allan adapterinn og öll CC-próf héldust græn, (4) P6(a) (ambiguous) er ekki leyst og er skráð sem „utan umfangs“ þótt prompt kveði á um það, (5) vafra-evidence uppfyllir ekki bindandi C7/P8. Ekkert af þessu er stórt í kóða; þetta eru þrjú lítil kóða-/prófaatriði og ein endurtekin keyrsla á evidence.

## Merking: sandbox (mitt) vs CC-fullyrt

*Sandbox (mitt, Linux/Node 22, vitest 4 + jsdom, afrit af staðfestum skrám CC; OPEN_METEO_API_KEY óstillt):* keyrði `src/lib` + `src/pages` (288 próf: **287 græn, 1 fellur**); eigin component-probe `jonesy_fixed.test.jsx` (20 próf, ekki í repo) gegn raunhandler-mótuðum fixtures CC (`direct-flow-fixtures.json`, tímagluggi færður fram); **10 mutations** (tafla neðar); kóðalestur á `WinterRoute.jsx`, `winterRouteRoutes.js`, `winterRoutePlaces.js`, `winterRouteGeometryResponse.js`, `winterRouteRoadConditionCodes.js` + prófunum; samanburður á `api/` og `winterRoutePairClassification.js` við síðasta samþykkta afrit mitt (óbreytt); skoðaði 5 evidence-myndir (aðeins staðreyndir, **ekkert sjónrænt PASS**), `results.json` og evidence-script.
*CC-fullyrt, ekki endurkeyrt af mér:* 212 próf græn á 8 skrám (PowerShell), `eslint` hreint, `npm run build` tókst, `git diff --stat -- api/` tómt, evidence keyrt í Playwright/vite dev. Ég sá ekki git; „api óbreytt“ byggi ég á samanburði við mitt eigið afrit + CC.

## Sandbox-staðfesting (stenst)

- **Flipar/fyrirsögn (P3):** engin `Fastar veðurleiðir`/`Velja staði` í viðmótstextum eða JSX (aðeins í athugasemdum); `<h1>` hlutlaus (`winterRouteDefaultHeading`, próf til staðar).
- **C1/C2 (mínar keyrslur):** Rauðavatn→Vík: **nákvæmlega 1 fetch** `/api/winter-route?routeId=raudavatn-vik`, 0 geometry, `winterRouteDataConnectedDisclaimer` sýnt, `winterRouteBaseDisclaimer` og `radiogroup` ekki til staðar.
- **C3 (9 neikvæð tilvik, allt hafnað með almennri villu):** rangt routeId, Borgarnes-svar á Vík-beiðni, vantar punkt, víxlaðir punktar, víxlaðir kaflar, aukakafli, `geometryId`/`datasetVersion` til staðar, rangur `expectedPointCount`.
- **C4:** svar þar sem hver kafli er `segmentDataAvailable:false` **án `registration`** er samþykkt og sýnir gagnaskjá (helper sameiginlegur, gildir líka gömlu pörin skv. kóða).
- **C6:** `reykjavik-raudavatn→vik|borgarnes` eru einu pörin sem fara í fixed-slóð; `vik→R`, `borgarnes→R`, `vik→borgarnes`, `hella→vik` fara í geometry og sýna núverandi „engin leið“-texta; `vik→vik`/`borgarnes→borgarnes`: **0 fetch** + same-place texti; swap fixed→unsupported→swap til baka gefur fetch-röð `winter-route`, `geometry`, `winter-route`. Röð punkta/IDBUTUR í framhlið = bakendi (`winterRoutePairParity.test.js` í `src/lib` grænt).
- **P6 (A og C):** A sýnir pilluna „Greiðfært“ ásamt báðum tilkynningunum beint (mynd 05 + `results.json`); ambiguous-vörn í `winterRouteSurfaceDisplayCategory` er varin af prófi (mutation M6 féll).
- **P4:** ein stýring (`<button aria-expanded aria-controls>`), aðeins einn listi mountaður; ekkert `<details>`.

## Bindandi atriði (R1–R6)

**R1 — Retry á fixed-villu er rangt (galli, endurgerður).** `ERROR`-greinin kallar alltaf `runRequest(...)` (geometry). Fyrir fast par: netvilla/ógilt svar → „Reyna aftur“ → `/api/winter-route-geometry?from=reykjavik-raudavatn&to=vik` → `unsupported` → **„Engin leið er í leiðargrunninum“** fyrir tímabundna bilun á leið sem *er* studd (mín keyrsla B: urls = `[winter-route?routeId=raudavatn-vik, winter-route-geometry?…]`, texti „engin leið“ sýnilegur). Brýtur C2 (0 geometry-köll, retry-vörn). Krafa: retry endurkeyrir fixed-beiðnina (sama routeId, sama requestId/abort-vél); próf: bilun → retry → 2× `/api/winter-route?routeId=…`, 0 geometry, gögn birtast; fókus-endurheimt (`data-route-retry`) óbreytt.

**R2 — Eldra parity-próf fellur: `src/pages/winterRoutePairParity.test.js`.** `expected 78 to be 55` (13 staðir ⇒ C(13,2)=78). C6 krafðist beinlínis uppfærslu þessa prófs „með tilgreindri ástæðu“ (13 staðir, 156 stefnubundin pör, **nákvæmlega 25 eldri + 2 ný studd ⇒ 52 stefnur**, öll önnur óstudd á báðum hliðum). CC bjó til nýtt próf í `src/lib/` sem prófar aðeins röð/`resolveDirectPairRouteId` en sleppti því að uppfæra/keyra þetta; 212-talan nær ekki þessu. Krafa: uppfæra prófið (55→78, upptalning 156/52, `vik`/`borgarnes` pör og öfug átt sem óstudd á frontend- **og** backend-hlið eftir því sem á við), keyra, og skrá fyrir/eftir fjölda.

**R3 — Engin component-próf á fixed-flæðinu (þekjugat, mutation-sannað).** `grep` finnur engin próf sem senda `vik`/`borgarnes` í `WinterRoute`. Mutation-töflu sjá neðar: að slökkva á **allri** fixed-dispatch (M5), identity-vörnum (M1/M1b/M2/M2b), same-place (M3), `registration`-lagfæringu (M4), requestId-vörn (M8), Borgarnes-fyrirvara (M7) og teljarasemantík (M9) skilar **283/283 grænum**. cc-report segir „covered by … component tests“ — það á ekki við um þessi atriði. Krafa (próf í `WinterRoute.test.jsx`, raunhandler-mótuð fixture má sækja úr `direct-flow-fixtures.json`): fetch-talning 1/0/0 (inkl. tímaskref, 0 aukafetch); C3 neikvæðu tilvikin; **C4 með raunlögun** (kafli `segmentDataAvailable:false` **án** `registration`; veitur niðri + spá í lagi ⇒ veðurraðir og „færð ekki tiltæk“; spá niðri + færð í lagi) bæði fyrir fast par og eitt gamalt par — núverandi `regionDataFixture` setur enn `registration` á kafla B og hylur gallann; `vik→vik`/`borgarnes→borgarnes` 0 fetch; öfug átt/`vik→borgarnes`/`hella→vik` ⇒ „engin leið“; swap-hringur; gamalt svar (kapphlaup: tvö fixed/geometry-svör í öfugri röð); Borgarnes sýnir `winterRouteSectionCoverageNote`, Vík ekki; **teljari** skv. P5(iv): 0/1/margar, 2 tilkynningar á 1 kafla ⇒ 1, útrunnin tilkynning telst, unknown-only án tilkynningar telst ekki, IS/EN fleirtala. Hver nýr próf skal sýna að hann fellur við samsvarandi mutation (má nota mína töflu).

**R4 — P6(a)/(b) ekki leyst að fullu; „utan umfangs“ stenst ekki.** Prompt: „ambiguous alltaf óstaðfest og **ekki taka description úr einni misræmisröð sem örugga yfirborðslýsingu**“, og óþekkt yfirborð/viðbótarreitur nefnt nákvæmlega. Raun (mynd 06 + `results.json` B/D): pilla „Óþekkt ástand“ **með línunni „Greiðfært“** undir (B ambiguous) og eins í D (þekkt yfirborð + óskráður `AstandVidbotaruppl`). CC skráði þetta sem „fyrirliggjandi, utan umfangs“; það er innan bindandi texta þessarar lotu. Krafa: B: engin `astandLysing`-lína sem þekkt yfirborð (sýna t.d. einungis „óstaðfest/misræmi í gögnum“ með núverandi i18n eða litlum nýjum texta — Ripley/eigandi velur); D: nefna óskráða viðbótarreitinn/kóðann í stað þess að láta „Greiðfært“ standa óskýrt; C er þegar rétt. Component-próf (jsdom) fyrir A/B/C/D í `SegmentRow` — í dag eru P6-próf aðeins á fallstigi; mutation M10 (`SegmentRow` notar `segment.category` í stað `winterRouteSurfaceDisplayCategory`, þ.e. P6-lagfæringin óvirk í viðmóti) skilar **283/283 grænum**.

**R5 — Vafra-evidence uppfyllir ekki C7/P8 (bindandi, ekki aðeins ráðlegging).** Í `direct-flow-evidence.mjs`/`results.json`: **engin fryst klukka**, **ekkert n/fyrsta slot úr DOM**, **engin mæling á `header.sticky` né `elementFromPoint`-hit-test**, enginn tímasleði/tímaskref og engin fetch-talning við tímaskref/tungumál; **Borgarnes aðeins ein mynd (1280/IS)** þótt C7 krefjist beggja fastra para í 1280/360×IS/EN; fixture Víkar er „allt úrelt“ (CC viðurkennir) svo þröngt = opið = 13 kaflar og aðgerðin „þröngt→opið→lokað“ sannar því **ekkert um muninn** (`namesNarrowCount 13 = namesOpenCount 13`). Raun (mynd 01/360/IS): stikla/sleði sjást, en ég get ekki staðfest hit-test né fyrsta slot úr þessu. Krafa: endurkeyra með ferskum fixtures (færð ekki úrelt, svo þröngur listi er styttri en sá fulli), frystri klukku, n og fyrsta slot í JSON, header-mælingu + hit-test (sleði og fyrsta tilkynningalína), báðum föstum pörum × 4 samsetningar × þröngt/opið/lokað, 0 aukafetch við tímaskref, einu gömlu hring-pari sem regression.

**R6 — Frávik frá „Festar ákvarðanir“ án skráningar sem frávik (ákvörðun, ekki endilega kóðabreyting).** Prompt: client-side same-place vörn „fyrir **alla** þekktu UI-staði … sendir enga beiðni“. CC gerði hana aðeins fyrir `vik`/`borgarnes` og lætur hina 11 fara í geometry (1 fetch, t.d. `selfoss→selfoss`; ég staðfesti í keyrslu). Rök CC (eldra próf á raun-`accessApproach` fyrir `talknafjordur|talknafjordur`) eru trúverðug og hegðun gömlu paranna er óbreytt, en þetta er **ekki** það sem prompt segir. Krafa: annaðhvort samræma við prompt (og laga prófið með ástæðu) **eða** að Ripley/eigandi samþykki skýrt frávikið; cc-report á að kalla þetta frávik.

## Mutation-tafla (mín, á kóða CC; baseline 283 græn í `lib` + þremur pages-skrám)

| # | Mutation | Niðurstaða |
|---|---|---|
| M1/M1b | sleppa röðun-/auðkennaskoðun IDBUTUR / punkta | 283 græn (ekki varið) |
| M2/M2b | sleppa höfnun á `geometryId/regionVersion/…` / routeId-skoðun | 283 græn |
| M3 | fjarlægja client same-place | 283 græn |
| M4 | krefjast `registration` alltaf (C4 aftur) | 283 græn |
| M5 | slökkva á fixed-dispatch (parin fara í geometry) | **283 græn** |
| M6 | fjarlægja ambiguous-vörn | 1 fellur (varið) |
| M6b | fjarlægja „surface-own unknown“-vörn | 283 græn (jafngild mutation, engin virkni) |
| M10 | SegmentRow notar `segment.category` (P6-lagfæring óvirk í UI) | 283 græn |
| M7 | fjarlægja Borgarnes-kaflaþekjufyrirvara | 283 græn |
| M8 | fjarlægja requestId-vörn á fixed | 283 græn |
| M9 | teljari telur aðeins virkar tilkynningar | 283 græn |

## Athugasemdir (S, ekki bindandi)

**S1 —** Prófið „P2(b)/(c)“ heitir enn „shared 11-place list“ en listinn er nú 13 (aðeins texti).
**S2 —** `expectedPointIdOrderForRoute`/`expectedIdButurOrderForRoute` eru útfluttar en ónotaðar; annaðhvort nota eða fjarlægja (CC skráði þetta sjálft).
**S3 —** Vík-aðkomufyrirvari (~629 m) og „Borgarnes = P4“ ekki endurtekin í UI: ég samþykki rökin í cc-report (C5), en `winterRouteAccessPointDisclaimer` birtist áfram á tengdri leið (staðfest á mynd 01).
**S4 —** Fixture sýnir „Þessi færðarútflutningur gæti verið úreltur.“ á hverjum kafla í öllum evidence-myndum (óvart úrelt klukka, sjá R5); myndirnar eru því ekki lýsandi fyrir venjulegt ástand.
**S5 —** Staðfest óbreytt hjá CC: `?routeId` á síðunni gerir ekkert, enginn nýr URL-lesari (P2); enginn nýr IS/EN-rofi (P7); `#492` helst opið.

## Mörk þessarar yfirferðar

- Ég keyrði **ekki** forritið í vafra og **ekki** evidence-script CC; myndir skoðaðar sem staðreyndir, **ekkert sjónrænt PASS** (útlit/pillur/litir/200% þysjun/snerting/skjálesari eru NOT_TESTED og í höndum eiganda).
- Ég keyrði ekki ESLint, `npm run build`, Windows-umhverfi, git né GitHub; „212 græn“, lint og build eru CC-fullyrðingar.
- Component-probe mín (`jonesy_fixed.test.jsx`) eru sandbox-skrár, ekki afhent í repo; jsdom-niðurstöður eru ekki vafrasönnun.
- UX-R1–R6 úr eldri lotum og #492 sjálft eru enn opin; engin IS↔EN lifandi-skipting á síðunni (rofi ekki til).

**Næsta:** CC lagar R1–R5 (lítil kóðabreyting: retry-leið og P6(a)-lína; próf og evidence-keyrsla), Ripley/eigandi ákveður R6 og efnistexta B/D í R4; síðan „CC búinn“ fyrir eina endurskoðun mína. Ég breytti engu í repo; commit/push/GitHub/lokun #492 er eiganda.

## Ripley — lokamat direct-flow fyrstu keyrslu, 2026-11-25

REVISE. Óháð keyrsla pages/winterRoutePairParity.test.js + lib/winterRoutePairParity.test.js: 10PASS/1FAIL, eldri pages-próf reiknar13staði→78pör en krefst55. Kóðalestur retryonClick staðfestir beina runRequest geometrykallið ístað fixeddispatch. Jonesy staðfestir raunretrygalla og fixedidentity/C4 með eigincomponentprobe; hans/CCtölur ekki nýpróf Ripley. Engin appfix hér.

R1–R5 nauðsynlegar afmarkaðar leiðréttingar til að uppfylla samþykkt MVP, ekki ný vöruverkefni. R4 er innan scope, ekki valfrjáls adjacent. Tímasleði/API/fixedsourcegögn halda sér. R6 samþykkt sem þröng fráviksákvörðun Ripley: gamla11same-place fer áfram gegnum geometry til að varðveita approachmetadata (ekki vöruhegðunargalli); nýjuvik/borgarnes local0fetch einsognú. Prófa/skrá muninn, ekki gera óþarfa nýja breytingu á gömlu réttuflæði. Þetta víkur skýrt frá v1all-places0fetch orðalagi, ekki ósýnilegt undanþáguflæði.

R4textaákvörðun: ambiguous sýnir óstaðfest/misræmi í færðargögnum og EKKI ast andLysing úr einni misræmisröð sem þekkt færð. Knownsurface+unknownaddition sýnir yfirborðslýsingu sem slíka og sérmerktar óþekktar viðbótarupplýsingar með safeplaincode, ekki genericunknownpillu yfir knownsurface. Enginbackendflokkun breytist. NýISENlyklar efþarf, escapingReact sjálfgefið.

Prompt-review umferð2 ísömu direct-flowmöppu tilbúin, Stage PROMPT_REVIEW þar tilJonesy samþykkirv2. Enginþriðjaumferðsjálfkrafa. #492ennopið. Enginapp/veituköll/commit/push/GitHubwrite.


---

## Jonesy — result review umferð 2: framkvæmdarviðgerð (approved-v2), 2026-11-26

**Niðurstaða: PASS með fyrirvörum — R1–R6 eru lokaðar.** Retry fer nú um fixed-adapterinn, parity-prófið er lagað, fixed-flæðið er varið af component-prófum sem ég sannaði með mutations, R4-textinn og closure-vörn virka í viðmótinu og evidence er nú keyrt með frystri klukku og ferskum fixtures. Eftir standa **tvö óvarin atriði í prófum (S1–S2)** og nokkrar evidence-athugasemdir (S3–S5); ekkert þeirra krefst nýrrar umferðar. Ég bið ekki um fleiri umferðir nema eigandi vilji; útlit/UX er eigandans.

**Merking: sandbox (mitt) vs CC-fullyrt.**
*Sandbox (mitt, Linux/Node 22, vitest 4 + jsdom, `OPEN_METEO_API_KEY` óstillt):* afrit af uppfærðum skrám CC (`WinterRoute.jsx`, `winterRouteRoadConditionCodes.js`, `translations.winterRoute.js`, `WinterRouteFixed.test.jsx`, `winterRoutePairParity.test.js`, fixtures-JSON); `src/lib` + `src/pages` með `--testTimeout=60000`: **340/340 græn** (tvær heildarkeyrslur; ein fyrri keyrsla felldi *eitt* fókus-próf í `WinterRoute.test.jsx` — „arrow-key option selection restores focus…“ — sem stóðst í öllum 5 endurkeyrslum, einnig á umferð-1 kóða; ég met það sem flökt undir álagi, ekki regression); **kóðadiff** umferð 1 → 2; **18 mutations** á kóða CC (tafla neðar); **endurkeyrði `c4-fixtures.mjs`** (raun-`api/winter-route.js`/`api/winter-route-data.js` með stubbuðu upstream-fetch): fixtures fást aftur (mismunur aðeins tímastimpill), hver kafli er `segmentDataAvailable:false` **án `registration`** og `roadMeta.available:false` — þ.e. raunverulegt gallaform, ekki handgerð; `results-v2.json`, evidence-script og 3 myndir skoðaðar sem staðreyndir (**ekkert sjónrænt PASS**).
*CC-fullyrt, ekki endurkeyrt af mér:* „269 græn á 10 skrám“, `eslint` hreint, `npm run build`, `git diff --stat -- api/` tómt, og að vafra-evidence hafi verið keyrt í Playwright/vite dev. (Mín 340 er önnur heildartala — allar `src/lib` + `src/pages` skrár — ekki sambærileg við 269.)

### R1–R6 — staða

- **R1 (retry): lokað.** `onClick` finnur `resolveDirectPairRouteId(applied)` og kallar `runFixedRequest(..., "retry")`; `runFixedRequest` tekur nú `focusTarget`. Mutation N1 (retry aftur um geometry) fellir **2 próf** (netvilla á Vík og ógilt-200 á Borgarnes). *Fyrirvari S1:* mutation N2 (fixed-retry án `focusTarget`) skilar **340/340 grænum** — fókus-endurheimt á fixed-retry er því óvarin af prófi.
- **R2 (parity): lokað.** Eldra `src/pages/winterRoutePairParity.test.js` er nú 10 próf, öll græn hjá mér; lagskipt (gömul classification 50 stefnur sér, fixed 2 sér, heild 156/52/104 reiknuð úr `PLACES`).
- **R3 (component-próf): lokað.** `WinterRouteFixed.test.jsx` (42 próf). Mutations CC **staðfestar óháð**: M1, M1b, M2, M2b, M3, M4, M5, M7, M8, M9, M10 falla öll á nafngreindum prófum (M5 fellir 37 próf; M8 fellur aðeins á nýja *same-key* race-prófinu, eins og CC sagði; M9 fellur á 2 teljarapróf). M6b er jafngild mutation (sammála CC).
- **R4 (óþekkt ástand): lokað.** Ambiguous sýnir „Ósamræmi í færðargögnum“/„Conflicting road-condition data“ í stað lýsingar (mutation N3 fellur á 3 próf, þ.m.t. closure-tilvikið — lokunarpilla helst); D: pilla úr yfirborði aðeins `!ambiguous && astandYfirbord þekkt`, `positiveStyleEligible` óbreytt úr payload, og „Óþekktar viðbótarupplýsingar: {code}“ sýnileg sjálfgefið sem plain text (N4 fellur á 2 próf; N7 — kóði fyrir ambiguous — fellur á lib-próf; N6 — ambiguous-vörn í swap — fellur á 3 próf). Mynd `vik-1280-is-01-narrow.png` sýnir í sama skjá: „Greiðfært“-pillu með tveimur tilkynningum (A) og „Óþekkt ástand“ með „Ósamræmi í færðargögnum“ (B). *Fyrirvari S2:* mutation N5 (óflokkuð tilkynning án `lysing` fellur aftur á `astand`-kóða, V4(3)) skilar **340/340 grænum** — fallbackið er óvarið af prófi.
- **R5 (evidence): lokað að mestu.** Fixtures búnar til úr `withFakeNow` 2026-11-26T09:15Z; vafraklukka fryst á sama tíma; í `results-v2.json`, fyrir **báðar** fixed leiðir × 1280/360 × IS/EN (8 samsetningar): `n=24`, fyrsta slot „fimmtudagur, 26. nóvember kl. 10:00 UTC“ (EN jafngilt), `header.sticky` bottom 153/105 px, scroll + `elementFromPoint` á sleða (`INPUT`) og fyrstu tilkynningalínu (neðan við haus), `staleLinePresent:false`, `narrowLessThanOpen:true` og `narrowEqualsClosedAgain:true` í öllum 8, **1 fixed / 0 geometry** og 0 aukafetch við tímaskref; auk 0-/1-tilkynninga-keyrslna og eins R→Selfoss-regression. Þetta lagar bein vandamál mín úr R5 (umferð 1: þröngt = opið, engin klukka).
- **R6 (frávik): lokað.** cc-report kallar gömlu 11 same-place → geometry (1 fetch) og `vik`/`borgarnes` → 0 fetch **berum orðum frávik frá v1**; prófin lýsa báðum (`vik→vik`/`borgarnes→borgarnes` 0 fetch + `selfoss→selfoss` 1 geometry-fetch skv. cc-report; hið fyrra staðfest í mínum mutation M3).

### Mutation-tafla (mín, umferð 2; baseline 340 græn)

| # | Mutation | Niðurstaða |
|---|---|---|
| M1/M1b | idButur-/punktaröðun sleppt | fellur á „…swapped order“ (1 próf hvor) |
| M2/M2b | identity-reitir / routeId-skoðun | fellur á 3 / 2 próf |
| M3 | client same-place af | fellur á 2 |
| M4 | `registration` krafist aftur | fellur á 2 (C4 fixed + gamalt par) |
| M5 | fixed-dispatch af | fellur á 37 |
| M7 / M8 / M9 / M10 | coverage-note / requestId-vörn / teljari / `segment.category` í SegmentRow | fellur á 1 / 1 / 2 / 3 |
| N1 | retry aftur um geometry | fellur á 2 |
| **N2** | **fixed-retry án `focusTarget`** | **340 græn (óvarið)** |
| N3 / N4 | ambiguous-lýsing aftur / óþekkt-viðbót-lína af | fellur á 3 / 2 |
| **N5** | **notice án `lysing` án `astand`-fallback** | **340 græn (óvarið)** |
| N6 / N7 | ambiguous-vörn í swap af / viðbótarkóði fyrir ambiguous | fellur á 3 / 1 |

### Athugasemdir (S, ekki bindandi)

**S1 —** Fókus-endurheimt á fixed-retry (V1) er innleidd en óprófuð (N2). Eitt lítið próf (fókus á retry-hnapp → smellur → fókus á „Sýna leið“ eða gagnahluta) myndi loka því; jsdom-fókus er þó takmarkaður, svo raunfókus er áfram eigandans/NOT_TESTED.
**S2 —** `notice.astand`-fallback (V4(3)) óprófað (N5); lítið próf með tilkynningu án `lysing`.
**S3 —** `results-v2.json` skráir **ekki** fonts/DPR/lang/theme/frysta tímann per keyrslu (aðeins `frozenNowIso` í `r5-fixtures.json`); V5 bað um það í JSON. Tæknilega staðfest atriði (n/slot/header/hit/fetch) eru þar.
**S4 —** `namesNarrowCount/namesOpenCount` telja `li span.font-medium` og því einnig tilkynningalínur (Vík 4 vs 15 = 13 kaflar + 2; Borgarnes 10 = 8 + 2); „narrow < open“ er því rétt en tölurnar eru ekki hrein kaflaheiti. Tvítekningarathugun (duplicates) úr umferð 1 er ekki endurtekin í vafra-JSON; hún er í jsdom (`WinterRouteOverview`).
**S5 —** Engin sérstök B/D-mynd eða JSON-tilvik í `followup/` (B sést í `vik-1280-is-01-narrow.png`; D er aðeins í component-prófum). Regression-parið R→Selfoss notar handgerðar geometry-/data-stubs (ekki raunhandler); ásættanlegt sem regression, ekki sem gagnasönnun.
**S6 —** Prófið „P3/P6 arrow-key option selection restores focus…“ flöktaði einu sinni undir heildarálagi (sjá ofar); fylgist með ef það endurtekur sig hjá CC/CI.

### Mörk þessarar yfirferðar

- Ég keyrði **ekki** forritið í vafra og **ekki** evidence-skriptu CC; JSON og 3 myndir lesin sem staðreyndir — **ekkert sjónrænt PASS** (litir, útlit, 200% þysjun, snerting, skjálesari eru NOT_TESTED, eigandans).
- Engin ESLint/`npm run build`/Windows/git/GitHub-keyrsla af mér; `api/` óbreytt er CC-fullyrðing (afrit mitt af `api/` er frá fyrri yfirferð, ekki endurstaðið núna).
- Component-niðurstöður eru jsdom, ekki vafrasönnun; raunveitugögn ekki notuð (fixtures úr raunhandlerum með stubbuðu `fetch`).
- UX-R1–R6 úr eldri lotum, IS↔EN lifandi rofi (er ekki til) og **#492 sjálft eru enn opin**.

**Næsta:** Eigandi skoðar útlit/UX á raunskjám (IS/EN, 1280/360) og ákveður hvort S1–S2 (tvö lítil próf) séu gerð núna eða með næstu lotu; commit/push/GitHub/lokun #492 er eiganda. Ég stofna ekki fleiri umferðir að eigin frumkvæði.

## Ripley — endanlegt mat direct-flow lotu, 2026-11-26

PASS fyrir afmarkaða direct-flow lotu: hamflipar fjarlægðir, föstu útleiðirnar Rauðavatn→Vík/Borgarnes varðveittar í Frá/Til, sýnilegur einn tilkynningalisti og unknown/ambiguous framsetning með closurevörn. R1–R6 þessarar lotu lokaðar samkvæmt Jonesy; CURRENT CLOSED fyrir þessa undirlotu, EKKI GitHub#492íheild.

Óháð keyrsla mín: `npx vitest run src/pages/WinterRouteFixed.test.jsx src/pages/winterRoutePairParity.test.js src/lib/winterRoutePairParity.test.js src/lib/winterRouteRoadConditionCodes.test.js --testTimeout=60000` — 74/74 í4skrám. Fyrra fellt pagesparity nú grænt. `git diff --stat -- api/` tómt. Approved-v2 og báðar skýrslur lesnar; evidence-followup skrár til. Aðrar340/269tölur, mutations, lint/build og vafra8samsetningasönnun eru athuganir CC/Jonesy, ekki nýjar keyrslur mínar. Engin ný vafrakeyrsla eða raunveituköll hér.

MVPkjarni staðfestur með focusedprófum: fixedroute identity/röð/race/partialdata/retry/counts,13staðir156áttir52studdar104unsupported, gömlu50áttir+2fixed, einnlistiíeinu, ambiguouslýsing ekki fullviss og unknownaddition sérmerkt. Sama-stað frávik samþykkt áfram: gömlu11geometry1fetchtilmetadata, nýju20fetch.

Óbindandi S1–S6 Jonesy varðveittar sem fyrirvarar: fixedretryfocus/fallbacknoticecode vantar eiginpróf, vafraJSON skortir nokkurmetadata og kaflanafnateljari telurnotice-li, Dmynd vantar en Dcomponentprófstanda; ekkert afþessu sýnir nýjan notkunargalla sem blokkar afmarkað MVP. Ekki bæta við nýrri prófalotu sjálfkrafa. Eitt þekkt flakyfocuspróf samkvæmt Jonesy er ekki nýttfráþessumfix; fylgjaefnýbilun, ekki óumbeðinCIvinna.

#492 er enn ólokið: liveISENrofi, kort og eldri ekki-afgreiddarUXkröfur/raun200%zoom/snerting/skjálesari ekki samþykkt með þessu. IS/ENevidence hér er sérpage-load, ekki rofi sem varðveitirval. Eigandi metur útlit á raunskjám. Tímasleðalotunnar eldri sönnunargöt haldast sögulega skráð, ekki þögultfullPASS. #493landsþekja aðskilin.

Núverandi framkvæmdarlotu lokið, stoppa. Eigandi getur yfirfarið/committað/pushað handvirkt; engin sjálfvirk útgáfa/GitHublokun eða ný promptlota. Enginn commit/push/deploy/GitHubwrite hjá Ripley.

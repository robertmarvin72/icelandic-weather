# #491 B — Jonesy result review, implementation (umferð 1)

Dagsetning: 2026-11-04. Hlutverk: tæknilegur rýnir, útfærði ekkert. Efni: `approved-prompt-v3.md` gegn `cc-report-implementation.md` og kóða/prófum á tækinu. Stage í CURRENT var CC_COMPLETE og passaði við skrárnar.

## Niðurstaða: REVISE (afmörkuð UI-leiðrétting + eitt skjal; bakendi/gögn standast)

Bakendi, cache-einangrun, routeId-sannprófun, leiðargögn og race-meðhöndlun standast sjálfstæða sandbox-athugun mína. Tveir gallar í `WinterRoute.jsx` brjóta þó beint gegn lið 4 í samþykkta prompti og CC-skýrslan nefnir hvorugan: (R1) fyrirsögn og `<title>` segja áfram „Rauðavatn–Vík“ þegar Borgarnes er valið, og (R2) leiðarskipti skila einum commit-ramma með nýju vali en gömlum Vík-gögnum, þvert á fullyrðingu CC. Auk þess vantar afleidda lengdartöflu/hash/skipun í docs (R3). **Production NOT_TESTED. Þetta er ekki heimild til birtingar.**

## Hvað var athugað (merkt eftir uppruna)

**Sandbox (mitt, án nets, án lykils; ekkert keyrt á vél eiganda):**
- Las `approved-prompt-v3.md`, `cc-report-implementation.md` og allar breyttar skrár: `api/winter-route.js`, `_lib/winterRoute/{routes,cache,roadFetch,forecastFetch}.js`, `src/lib/{winterRouteRoutes,winterRouteComparison}.js`, `src/pages/WinterRoute.jsx`, `src/i18n/translations.winterRoute.js` og prófin. Skráalisti tækisins (mtime) sýnir engar aðrar breyttar skrár í `src/` eða `api/` en þær sem skýrslan nefnir; `segments.js` og `winterRouteEta.js` óbreyttar.
- Keyrði `api/**` og `src/lib/winterRoute*` próf í afriti: **13 skrár, 172 próf standast** (sandbox, einangrað afrit; ekki öll vitest-svítan).
- Setti upp sjálfstætt harness utan um raunverulega `WinterRoute.jsx` (með stubbum fyrir `Brand`, `WeatherIcon`, `usePageRouteProps`, `useThemeClass`, `weatherPresentation`, `react-helmet-async`; texti úr raunverulegum `translations.winterRoute.js`) og mældi hvern commit-ramma með React `Profiler`. Niðurstöður í R1/R2 og hér að neðan eru úr því harness. Það er **ekki** raunvafri.
- Staðfest: leiðarstalar `routes.js` jafnast á við Jonesy-viðmiðið (P1 23,559 / P2 34,288 / P3 53,738 / P4 70,566 km), hnit P1–P4 jafnast á við fyrri staðfest gildi, 8 IDBUTUR í röð B6, `nearIdButur` 903030037/904690037/804020037/904040037.

**CC-eignað, ekki endurkeyrt af mér:** full vitest-svíta (207 skrár / 3086 próf), lint, build, Playwright 19/19, „þrjú ónefnd óstöðug próf einu sinni“, `git status`, B1-endurreikningur og Vík-stýring (0,0039 km) — ég sá niðurstöður í skýrslu, ekki keyrslur. Tölur B1 stemma þó við mitt sandbox-viðmið.

**Ekki athugað af mér (NOT_TESTED/UNKNOWN):** raunvafri (Chromium/Playwright), lint, build, git/diff, Production, texti GitHub-miða, raunkort/akstursstefna. H1 er áfram INFERRED.

## Gallar

**R1 — HIGH (notendasýnilegt, sandbox-staðfest) — fyrirsögn og `<title>` fylgja ekki völdu leiðarvali.** `WinterRoute.jsx` línur 606, 617–618 nota fasta lykla `winterRouteTitle`/`winterRouteSubtitle` („Rauðavatn–Vík“ bæði á IS og EN). Í harness: eftir skipti í Borgarnes og að gögn hafa borist er `h1` = „Rauðavatn–Vík“ á meðan `select` sýnir „Rauðavatn – Borgarnes“ og kaflar/punktar eru Borgarnes. Liður 4 í v3 segir „Val stýrir titli, köflum, ETA-kortum…“ og B6 „UI-leiðarnöfn skýr Rauðavatn–Vík og Rauðavatn–Borgarnes“. Ekkert próf skoðar h1/title á Borgarnes (e2e-prófið aðeins „h1 visible“). Þetta er rangmerking á nýju leiðinni, ekki útlitsatriði. *Lagfæring:* h1 og `<title>` úr völdum `WINTER_ROUTE_OPTIONS` færslu (`nameIs`/`nameEn`); próf fyrir báðar leiðir og bæði tungumál; undirtexti má haldast almennur.

**R2 — MED (sandbox-staðfest) — einn commit-rammi með nýju vali en gömlum gögnum; fullyrðing CC stenst ekki.** `setData(null)`/`setLoadError(null)` eru kölluð **inni í `useEffect`** (línur ~519–520), ekki í sömu render-umferð og `routeId` breytist, þrátt fyrir athugasemdina „cleared synchronously … same render pass“ og skýrslu. Profiler-mæling: við skipti Vík→Borgarnes verður einn commit með `select = raudavatn-borgarnes`, Borgarnes-ETA-athugasemd sýnileg **og Vík-kaflar enn í DOM**; næsti commit hreinsar. Liður 4: „hreinsa/fela gömlu leiðargögn STRAX á sömu render-skiptum, ekki eitt frame með nýjum titli/gömlu gildi“. Hvort ramminn málast í raunvafra er óprófað af mér (INFERRED: React 18+ keyrir passive effects discrete-atburða áður en málað er, svo sennilega ósýnilegt), en kröfuna og lýsinguna þarf samt að uppfylla/leiðrétta; prófið `WinterRoute.test.jsx` ~836 mælir aðeins stöðuna eftir `act`, ekki ramma, svo það grípur ekki þetta. *Lagfæring:* leiða út á render-tíma, t.d. `const view = data?.routeId === routeId ? data : null` (og villa bundin routeId) og nota `view` í allri myndgerð; próf með Profiler/ramma-skráningu; lagfæra athugasemd og skýrslu.

**R3 — LOW-MED — afleidd lengdartafla/hash/skipun ekki afhent í docs (liður 1 og 7).** Prompt: „Afhenda afleidda lengdartöflu/hash/skipun í docs“. Í `docs/ai/tasks/ticket-491/` er engin ný skrá nema `cc-report-implementation.md` (4 punktgildi og lýsing; skriftan var „disposable, not committed“). Gildin eru rétt (mitt sandbox-viðmið stemmir), en endurskapanleiki er ekki til staðar. *Lagfæring:* ein skrá í ticket-491 með uppsafnaðri km töflu á stykki (29 stykki), heimildaskrám + sha256, aðferð/skipun og Vík-stýringarniðurstöðu. Engin ný rannsókn eða net.

**R4 — LOW (athugasemd, ekki skilyrði)** — `fetchRoadSegments`/`fetchRoadPoints` fengu `idButurList` sem **fyrsta** staðbundna færibreytu (áður `fetchOptions`). Allar kallstöðvar í repo eru uppfærðar og prófin græn, en eldri kallmáti `fn(fetchOptions)` mundi nú misskilja hlut sem lista. Valkostur: options-hlutur. Ekki krafa.

**R5 — LOW (athugasemd)** — skýrslan segir „implicit no-routeId path … same single bucket“. Það á við beina kallara/próf; handler sendir alltaf `routeId` (Vík = `raudavatn-vik`), svo Vík-framleiðsla notar nafngreint bucket. Hegðun jafngild, orðalag ónákvæmt.

## Staðfest (sandbox, með fyrirvörum hér að ofan)

- **B2:** `resolveRouteId` notar `Map#has/get`; vantar (líka `req.query` undefined) ⇒ Vík; tómt/fylki/óþekkt/`__proto__` ⇒ 400 án endurspeglunar; önnur query hunsuð. Prófuð í routes/winter-route prófum (172 græn).
- **B4:** cache.js: sjálfstætt road+forecast bucket-par á routeId; prófað að stale/fallback leki ekki milli leiða og að skýr `routeId` og óskilgreindur deili ekki bucket. Unknown route nær aldrei í cache (400 á undan).
- **B3:** UI hefur eigin 6/4 töflu án backend-import; `routeId`, `expectedPointCount` eða `forecast.points.length` ósamræmi ⇒ route-scoped villa, **ekki** hlutasýn (harness: sýnir villutexta, engin kort). Jafnræðispróf til.
- **Race:** StrictMode upphafshleðsla = 1 beiðni; Vík→Borgarnes→Vík = 3 beiðnir (`/api/winter-route`, `?routeId=raudavatn-borgarnes`, `/api/winter-route`); seint Vík-svar eftir skipti í Borgarnes yfirskrifar ekki. Fókus á route-select óbreyttur (onChange kallar `setRouteId` beint).
- **Orðalag:** ETA-athugasemd Borgarnes samræmist samþykktum texta; kafla-þekju-athugasemd bætt við; engin „sex punktar“ í nýju strengjunum ({count}/{total}); engin akstursleiðar-/öryggisfullyrðing sést.

## Skilyrði fyrir PASS (þrjú, öll bundin við v3)

- **V1 (R1, liður 4/B6):** h1 og `<title>` úr völdu leiðarvali, með prófi (IS/EN, báðar leiðir).
- **V2 (R2, liður 4):** engin myndgerð með gögnum/villu annarrar leiðar en valinnar, á render-tíma; próf sem mælir ramma (Profiler eða jafngildi), ekki aðeins stöðu eftir `act`; leiðrétta athugasemd/skýrslu.
- **V3 (R3, liður 1/7):** afleiðingarskjal í docs eins og lýst er.

Ekkert hér krefst nýrrar rannsóknar, nets, lykils, nýs umfangs eða breytingar á ETA-reglu. Ég mæli með mjög afmarkaðri CC-umferð (3 liðir) og endurkeyrslu viðkomandi prófa/lint/build/Playwright á vél CC; ég keyri ekkert á vél eiganda.

## Mörk

Sandbox-harness minn stubbar fimm einingar utan breytingasviðs (listi hér að ofan) og er ekki raunvafri; fjöldi próf (172) nær aðeins til `api/**` og `src/lib/winterRoute*`, ekki `WinterRoute.test.jsx` eða Playwright. Production NOT_TESTED. B er ekki birt og engin birtingarheimild er fólgin í þessum dómi. Næsta skref: Ripley lokamat; ef REVISE stendur, afmarkaður prompt fyrir V1–V3; Róbert commit-ar sjálfur.

## Ripley lokamat — 2026-11-04

**REVISE**, afmarkað við V1–V3. Samþykkt prompt v3 krefst leiðarheita sem fylgja vali, myndgerðar án gagna annarrar leiðar í nokkrum ramma og endurskapanlegrar lengdarafleiðslu í docs. Jonesy sýnir skýr frávik frá þessum skilyrðum. Kóðalestur staðfestir fasta titillykilinn og hreinsun data/loadError inni í useEffect; commit-mælingin er sönnun Jonesy úr sandbox, ekki raunvafraprófun Ripley. R4 krefst engrar aðgerðar; R5 aðeins skýrsluleiðréttingar.

approved-prompt-v4.md afmarkar leiðréttinguna og varðveitir v3/gagnayfirferð. Engin ný rannsókn, netköll eða breytingar á appkóða framkvæmdar í þessu lokamati; engin próf endurkeyrð hér. Fyrri CC-próf og Jonesy sandbox-próf eru áfram eignuð þeim. Production NOT_TESTED og engin birtingarheimild. CURRENT → READY_FOR_CC; eigandi → CC „Prompt approved“, síðan ný Jonesy-yfirferð og Ripley lokamat. Engin commit/push/GitHub-aðgerð.


---

## Jonesy result review — v4 leiðréttingarlota (umferð 2, 2026-11-04)

Hlutverk: tæknilegur rýnir, útfærði ekkert. Efni: `approved-prompt-v4.md` (V1–V3, R5) gegn `cc-report-implementation.md` (v4-kafli), `WinterRoute.jsx`, `WinterRoute.test.jsx`, `translations.winterRoute.js`, e2e-sérskrám og `derivation-29-pieces.md`. Stage í CURRENT var CC_COMPLETE og passaði við skrárnar.

### Niðurstaða: V1 PASS, V2 PASS, V3 REVISE (skjal eingöngu; engin frekari kóðabreyting krafin)

Appkóðinn (R1/R2) er lagaður og stenst sjálfstæða sandbox-mælingu mína. **V3-skjalið er rangt á afgerandi stað:** „hindrunin“ sem CC skráir (P1/P3/P4 ≈0,037 km lág, P2 0,0101 yfir) er villa í skriftu CC, ekki galli í `routes.js`, og CC dró auk þess til baka rétta fullyrðingu úr v3-skýrslu. Lagfæringin er smá og skýr (sjá D1–D4). **Production NOT_TESTED; engin birtingarheimild.**

### Sandbox-athuganir (mínar; án nets, án lykils; ekkert keyrt á vél eiganda)

- **Raunveruleg kóðaathugun:** Prófaði `WinterRoute.jsx` með raunverulegum hooks, translations, `Brand`, `WeatherIcon` (staged af tæki; aðeins `react-helmet-async` stubbað). `WinterRoute.test.jsx` + `api/**` + `src/lib/winterRoute*` próf: **14 skrár, 227 próf standast** (þ.m.t. öll 55 próf WinterRoute-skrárinnar, 7 ný). Þetta er ekki full vitest-svíta, lint, build né vafri.
- **V2 (ramma-mæling mín, Profiler):** við skipti Vík→Borgarnes verður nú **einn commit**: `select` = Borgarnes, h1 = „Rauðavatn – Borgarnes“, Borgarnes-ETA-athugasemd sýnileg, **engin Vík-gögn**. Fyrri mæling á v3-kóða gaf commit með Vík-köflum; nú 0 blönduð frame. Seint svar gömlu leiðar yfirskrifar ekki; StrictMode upphaf = 1 beiðni, Vík→Borgarnes→Vík = 3 beiðnir; `routeId`/`expectedPointCount` ósamræmi ⇒ villa, engin kort.
- **V1:** h1 eftir að Borgarnes-gögn berast: „Rauðavatn – Borgarnes“ (val sýnir sama); h1 fylgir valinu strax á meðan hleðsla stendur.
- **Umfang:** skráalisti tækis (mtime) sýnir að `api/**` og `src/lib/**` eru óbreytt frá v3-lotu; breytt eru aðeins `WinterRoute.jsx`/`.test.jsx`, `translations.winterRoute.js`, e2e-skrár 486/491 og skjöl. Samræmist „engin breyting á bakenda/cache/leiðargögnum/ETA“.
- **V3 endurskapað:** sjá D1.

**CC-eignað, ekki endurkeyrt af mér:** full vitest 207 skrár / 3093 próf, lint, build, Playwright 19/19, `git status`.
**Ekki athugað af mér:** raunvafri, lint, build, Playwright, git/diff, Production, texti GitHub-miða. `<title>`-gildi í vafra: sjá D4.

### Gallar (V3 og skýrsla)

**D1 — MED — „hindrun“ í `derivation-29-pieces.md` er skriftuvilla; `routes.js` stenst.** Skriftan byrjar uppsöfnun við upphaf 1477 og sleppir **upphafsbilinu 37,39 m** (frá `start_raudavatn.native_3057_end` að upphafi 1477), sem B1 og v4 liður 3 fyrirskipa að telja einu sinni. Auk þess prentar hún „P2“ eftir að 27,62 m bilinu **eftir** 3796 hefur verið bætt við. Endurreikningur minn (sömu skrár, sama aðferð, haversine R=6 371 008,8 m + native-bil): **án upphafsbils** P1 23,5221 / P2 34,2503 / P3 53,7005 / P4 70,5290 (þ.e. −0,037…−0,038 km, nákvæmlega mynstrið hjá CC); **með upphafsbili** P1 23,5594 / P2 34,2877 / P3 53,7379 / P4 70,5664 ⇒ frávik gagnvart `routes.js` (23,559 / 34,288 / 53,738 / 70,566) **≤0,0004 km**. CC-stíls P2 (34,2779) er 34,2503 + 27,62 m ≠ P2 við enda 3796. Skjalið segir líka að 15 bil „til 3025“ séu 0,330 km; það stemmir með upphafsbilinu **útilokuðu** (0,368 − 0,037). Því: töflu vantar upphafsbils-röð, Kafli 2 og 3 eru rangir, og skýrsla CC dregur til baka „0,000 km frávik“ ranglega (raunfrávik ≤0,0004 km, innan ±0,01). *Lagfæring:* bæta upphafsbilsröð við töflu og skriftu, skilgreina P2 við enda 3796 (fyrir tengibil), skipta „Obstacle“-kafla út fyrir niðurstöðu „allir fjórir innan ±0,01 km“, leiðrétta „Correction“-kafla í `cc-report-implementation.md` (halda sögunni). `routes.js` breytist ekki.

**D2 — LOW-MED — Vík-stýring: lýst aðferð er röng þótt tölurnar stemmi.** Skjalið útilokar „óbókstafaða KAFLANR“. Í gögnunum eru útilokuðu stykkin 3592/3710 (VEGNR `261`) og 20165 (VEGNR `33`); dálkur CSV heitir `length_km_vegnr1_tier0`. Rétt regla er **`VEGNR == "1"` og `NAKVAEMNIFERLIS == 0`** (sú sem upphaflega stýringin notaði; mín stýring skilaði hámarki 0,004 km með henni). KAFLANR-sían er ósönnuð vísbending sem tilviljun færir sama mengi. *Lagfæring:* skipta út reglu og lýsingu; engin ný gögn.

**D3 — LOW — skriftan les JSON með `latin-1`.** `wfs-vegnr1-all.json` er strangt UTF-8 (sama atriði og fyrri E4-leiðrétting). Tölur verða eins, en þetta endurtekur þekkta villu; nota `utf-8`.

**D4 — LOW-MED — `<title>` er ósannreynt og skýrslan er ósamkvæm.** V1-hluti skýrslunnar segir að document title sé „covered in a real browser via a new `page.toHaveTitle(...)` assertion“ í `winter-route-ticket-491.spec.js`; Validation-hlutinn segir sömu fullyrðingu fjarlægða, og grep yfir 486/491 e2e sýnir **enga** `toHaveTitle`. Kóðinn (`<title>{routeName} · …`) er réttur að lestri, og h1 er prófaður í unit + vafra, en **document.title fyrir Borgarnes er ósannreynt** (CC skráir það sem UNKNOWN; harness gefur tóman titil líka fyrir Vík). *Lagfæring:* leiðrétta V1-málsgrein skýrslu; UNKNOWN stendur fyrir Ripley/eiganda að meta. Ég krefst ekki kóðabreytingar.

**INFO — ekki galli:** ef notandi fer A→B→A áður en B-svar berst, sýnir `view` strax fyrri A-gögn úr state (rétt leið, örlítið gömul, stale-while-revalidate) meðan ný A-beiðni er í gangi. Ekkert rangrar leiðar sést.

### Skilyrði fyrir PASS (öll skjalaleg)

- **W1 (D1):** `derivation-29-pieces.md`: upphafsbil í töflu/skriftu/tölum, P2 við enda 3796, P1–P4 með frávikum ≤0,0004 km, „Obstacle“-kafli fjarlægður; leiðrétt „Correction“ í cc-report. Keyra skriftuna aftur á vél CC og skrá úttak.
- **W2 (D2–D3):** Vík-regla `VEGNR == "1"` + tier 0; `utf-8`.
- **W3 (D4):** leiðrétta V1-málsgrein; `<title>` skráð UNKNOWN.

Engin ný rannsókn, net, lykill eða appbreyting; ekkert af þessu snertir `routes.js`. Ef Ripley kýs má taka skjalaleiðréttinguna inn án nýrrar CC-lotu með því að samþykkja tölur mínar hér að ofan sem sandbox-viðmið; ég mæli með stuttri CC-umferð (skjöl eingöngu) svo skjalið sé endurskapanlegt úr skipun sem keyrð er á raunverulegum skrám.

### Mörk

Sandbox-niðurstöður mínar sýna samræmi, ekki raunvafrahegðun né réttmæti veganets/akstursstefnu (H1 INFERRED). Production NOT_TESTED. Ekkert keyrt á vél eiganda. Næsta skref: Ripley lokamat; Róbert commit-ar sjálfur.

## Ripley lokamat v4 — 2026-11-04

**REVISE, skjöl eingöngu W1–W3. V1/V2 app-lagfæringar samþykktar.** Jonesy staðfestir með 227 sandbox-prófum og Profiler að leiðarheiti/gögn fylgi vali án blandaðs ramma; þær niðurstöður eru eignaðar Jonesy. CC eignað full-suite/lint/build/Chromium. Ripley reyndi `npx vitest run src/pages/WinterRoute.test.jsx`: sandbox EPERM við temp rename áður en import/próf hófust, 0 próf keyrð; engin ályktun um appbilun af því.

V3 ósamræmið er samkvæmt endurreikningi Jonesy skriftuvilla: vantar upphafsbil og P2 er tekið eftir næsta bili. Ekki heimild til að breyta leiðargildum eða enduropna leiðarrannsókn. approved-prompt-v5.md takmarkar CC við skjöl og eina offline endurkeyrslu afleiðslunnar, rétta VEGNR1/tier0 reglu, UTF-8 og leiðréttingu skýrslu. Fyrri sönnun/viðmið áfram eignuð uppruna; CC skráir eigin raunúttak.

Document title er UNKNOWN: kóðabreytingin er rétt að lestri Jonesy og h1 prófað, en raunverulegt title ekki staðfest. Ekki opna Helmet-viðgerð í þessari skjalalotu; það atriði verður hluti síðari production-yfirferðar beggja leiða og er ekki talið prófað nú. Production NOT_TESTED. CURRENT → READY_FOR_CC; eigandi → CC „Prompt approved“. Enginn appkóði breyttur, engin ný gagnaöflun/commit/push/GitHub/deploy.


## Jonesy result review — v5 skjalaleiðréttingarlota (umferð 3, 2026-11-05)

### Niðurstaða: PASS (W1–W3 uppfyllt; skjöl eingöngu; tvö LOW athugasemdarefni, ekki skilyrði)

Umfang lotunnar var `approved-prompt-v5.md`: aðeins `derivation-29-pieces.md`, viðbót í `cc-report-implementation.md` og `CURRENT.md`. Production NOT_TESTED. Ekkert birt, ekkert keyrt á vél eiganda.

### Sandbox-athuganir (mínar; án nets, án lykils)

- **Heimildaskrár:** SHA256 allra fimm varðveittra heimildaskráa (`wfs-extension-4326.json`, `wfs-vesturland-4326.json`, `wfs-vegnr1-all.json`, `wfs-chain-4326.json`, `route-segments.csv`) passa við hashana í skjalinu.
- **Skipun CC keyrð óbreytt hjá mér:** ég dró inline-skipunina úr §5 í skjalinu og keyrði hana með `python3 -I` á staged afritum. Útkoma: upphafsbil 37,39 m; 29 liðir með entry/len/exit; P1 23,5594 / P2 34,2877 / P3 53,7379 / P4 70,5664 km; 13 Vík-raðir, max frávik 0,0039 km. Öll 29 exit-gildin koma fyrir orðrétt í töflu skjalsins. Tölurnar eru óháðar mínum fyrri útreikningi (sama niðurstaða til 0,0000 km) og `routes.js` (23,559/34,288/53,738/70,566) innan 0,0004 km (≤ ±0,01).
- **W2:** `wfs-chain-4326.json` tier 0 staðfestir að IDFERILL 3592 og 3710 (IDBUTUR 901230037) hafa VEGNR `"261"` og 20165 (IDBUTUR 902040037) VEGNR `"33"`; skjalið lýsir nú reglunni `VEGNR == "1"` + `NAKVAEMNIFERLIS == 0`, ekki KAFLANR-getgátu. Skipunin les JSON sem UTF-8 (CSV `utf-8-sig`); ég keyrði hana án villu.
- **Skjalið:** „Obstacle“-kaflinn er horfinn sem opið atriði; orðið kemur aðeins fyrir í skýringu á v4-villunni (§3, söguleg leiðrétting). Upphafsbil talið einu sinni; P2 við útgang 3796 fyrir 27,62 m bilið; P1 = inngangur 3025, P3 = inngangur 47042, P4 = útgangur 2819.
- **cc-report-implementation.md:** v4-saga varðveitt; V1-málsgreinin hefur W3-leiðréttingu (`toHaveTitle` dregin til baka, `document.title` UNTESTED/UNKNOWN, „pre-existing/environment“-fullyrðing dregin til baka sem óstaðfest, engin Helmet-/harness-viðgerð); Validation-liðurinn samræmdur; nýr dagsettur kafli „v5 — derivation correction“ lýsir D1/D2/D3/D4 og að v4-„hindrunin“ var skriftuvilla, ekki gagnagalli.
- **Umfang (mtime á tæki eiganda, lesið úr skráalista):** engin skrá í `src/`, `api/` eða `tests/e2e/` er yngri en v4-umferðin (nýjasta: `WinterRoute.test.jsx` 1793835347185, e2e 1793835572195, á undan `approved-prompt-v5.md` 1793836030194); `routes.js` óbreytt (1793826696098). Í `docs/ai/tasks/ticket-491/` eru `derivation-29-pieces.md`, `cc-report-implementation.md` og `CURRENT.md` einu skrárnar sem breyttust eftir v5-promptið (ásamt þessu review). Að CC hafi staðfest þetta með `git status` er **CC-eignað**; ég keyrði ekki git.

### Athugasemdir (LOW, ekki PASS-skilyrði)

- **L1:** v3-kaflinn „Independent recomputation (B1)“ og v4 V3-málsgreinin standa óbreytt sem saga. V4-málsgreinin segir enn að fyrri fullyrðingin „0,000 km frávik“ hafi verið röng og að P1/P3/P4 væru óleyst. V5-kaflinn leiðréttir þetta í reynd (hindrunin var skriftuvilla; P1–P4 passa), en afturköllunin á v3-fullyrðingunni er ekki nefnd berum orðum. Lesandi þarf að lesa v5-kaflann til enda. Ripley getur tekið þetta fram í lokamati; engin ný CC-lota nauðsynleg.
- **L2:** Validation-liður v4-kaflans vísar í „run this round (see v5 correction below)“ — tímaröð er óskýr (v4-kafli lýsir v5-keyrslu). Efnislega rétt, aðeins orðalag.

### Mörk

Þetta er skjalalota. CC keyrði aðeins afleiðsluskipunina, ekki vitest/lint/build/Playwright í þessari lotu; v4-niðurstöður (full suite, lint, build, Playwright 19/19) eru áfram eignaðar CC v4-lotu og mínar eigin v4 sandbox-niðurstöður (227 próf, Profiler) óbreyttar því kóði er óbreyttur. Ég keyrði ekki próf/lint/build/git/vafra á vél eiganda. Document `<title>` er UNKNOWN og bíður production-yfirferðar eiganda á báðum leiðum. H1-leiðin er INFERRED nálgun, ekki sannreynd akstursstefna; Production NOT_TESTED; B ekki birt. Næsta skref: Ripley lokamat; Róbert commit-ar sjálfur.

## Ripley lokamat v5 — 2026-11-05

**PASS. Innleiðingar- og yfirferðarlotu #491 lokið; CURRENT → CLOSED.** Jonesy PASS W1–W3 samþykkt. Ripley keyrði sjálfstætt óbreyttan Python-kóða úr §5 derivation-29-pieces.md með Python -I, offline á varðveittum skrám: upphafsbil 37,39 m; allar 29 raðir; P1 23,5594 / P2 34,2877 / P3 53,7379 / P4 70,5664 km; allar 13 Vík-raðir, hámarksfrávik 0,0039 km. Þetta staðfestir endurskapanleika innan samþykktra marka. SHA256-yfirferð allra fimm heimilda er eignuð Jonesy í umferð 3.

Skýring á L1/L2: v4-frásögn um óleyst leiðargagnafrávik og afturköllun á fyrra samræmi er felld úr gildi með v5-keyrslunni. Villan var í afleiðsluskipunni (upphafsbil/P2), ekki föstu leiðargildunum. V5 er leiðrétta staðan; fyrri málsgreinar eru saga. Leiðrétta keyrslan átti sér stað í v5, ekki v4. Engin ný CC-lota þarf vegna þessa orðalags.

V1/V2 app-lagfæringar samþykktar í fyrri yfirferð. App-próf, lint/build/Chromium eru áfram eignuð CC og sandbox/Profiler-próf Jonesy; engin app-próf endurkeyrð í þessari skjalalotu. Fyrri Ripley Vitest-tilraun stöðvaðist fyrir próf með sandbox EPERM. Enginn appkóði breyttur hér.

Document title er UNKNOWN og Production NOT_TESTED. H1-leiðarval/nálganir og ETA-takmarkanir standa óbreytt; engin fullyrðing um sannreynda akstursstefnu. CLOSED merkir lok þessarar yfirferðarlotu, ekki að GitHub-miða sé lokað eða production staðfest. Næst eigandi yfirfer, commit-ar og push-ar sjálfur; síðan production-yfirferð beggja leiða, leiðarskipta og document title áður en GitHub-lokun er samþykkt. Engin commit/push/GitHub/deploy framkvæmd.

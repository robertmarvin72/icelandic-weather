# #490 — Jonesy result review (umferð 1)

Dagsetning: 2026-11-04. Hlutverk: tæknilegur rýnir, útfærði ekkert. Efni: approved-prompt-v1.md (S1–S4 innfelld) gegn raunkóða CC og cc-report.md.

## Niðurstaða: REVISE (ein lagfæring á fókushegðun; rótin er mitt eigið skilyrði S3)

Rökfræði samanburðarins er rétt og stenst sjálfstæð próf. Eftir stendur eitt raunvandamál í lyklaborðshegðun `<select>` sem stafar beint af orðalagi S3-skilyrðisins sem ég setti í prompt-yfirferðinni. CC útfærði S3 eins og það var skrifað; villan er mín, ekki CC. Auk þess ein lítil orðalagsfrávik (R2).

## Hvað var athugað (merkt eftir uppruna)

**Sandbox / lestur (mitt, án nets, án lykils, vitest 4.1.10 með `unshare -rn`):**
- Las `winterRouteComparison.js`, `DepartureOptionCard`/`RouteComparison`/`handleUserSelectHour` og fókus-effect í `WinterRoute.jsx`, þýðingaskrá og prófskrár.
- Keyrði CC-prófin `winterRouteEta`, `winterRouteSummary`, `winterRouteComparison` úr staged skrám ásamt þremur mínum: samtals 4 skrár, **50 próf standast**.
- Mín fuzz-próf (3000 slembitilvik, upphafstími sem fer yfir UTC-miðnætti, hermdir liðnir tímar, ótiltækir punktar, gagnagöt í öllum þremur mæligildum) bera `computeDepartureOptionSet` saman við óháðan brute-force: röð −2/0/+2, `departureHour`, `available`, og ástæðuforgangur 1→2→3→4 stemma í öllum tilvikum; tiltækt sæti hefur alltaf `validCount === 6` á öllum þremur mæligildum og `summary`; ótiltækt hefur `summary: null`. Dagamót/mánaðamót/hlaupár í `offsetHourString` rétt. Núll/null/tómt val og tómur punktalisti kasta ekki og gefa ótiltækt. Raunverulegt 0 er gilt; brottför á vísitölu 20 virkar en 21 ekki (24 klst. gluggi), í samræmi við útreikning úr prompt-yfirferð.
- **Hegðun vafra (Chromium í sandbox, staðgengilssíða, ekki appið sjálft):** `<select>` í fókus, ArrowDown → `change` kemur einu sinni; ef `change`-handlerinn flytur fókus á annan hnút (eins og S3-útfærslan gerir) gerir næsta ArrowDown ekkert — valið festist á „b“ og fókus er á hnútnum. Sjá R1.
- Backend/ETA/summary-skrár óbreyttar (sama mtime og í prompt-yfirferð: `winter-route.js`, `segments.js`, `winterRouteEta.js`, `winterRouteSummary.js`).
- Þýðingar: 68 lyklar í IS og 68 í EN, enginn vantar hvorum megin.

**CC-eignað, ekki endurkeyrt af mér:** React/jsdom-próf (+8 ný), lint, build, full suite 205/205 skrár og 3035/3035 próf, Playwright e2e 11/11 (S3 Tab→Enter, S4 farsímamæling við 375 px, skjámynd sem ég hef ekki séð).

**Ekki keyrt af mér (NOT TESTED):** React-próf, lint, build, e2e í appinu, git, vercel dev, Production. Ekkert keyrt á vél eiganda.

## Samræmi við prompt og S1–S4

| Liður | Niðurstaða |
|---|---|
| 2: þrjú merkt sæti í föstu röðinni, UTC-reikningur yfir dagamót | Staðfest (fuzz) |
| 3/S1(a): tiltækileiki = ekki bara `!isPartial`, heldur `validCount === 6` á öllum þremur; fastur ástæðulisti með forgangi 1→2→3→4, aðeins ein ástæða sýnileg | Staðfest (fuzz + lestur). Sjá R2 um orðalag |
| 4: hvert sæti endurnýtir #489-extrema á eigin komutímum, með sömu orðalagi (fyrri klukkustund), einingum og sniði | Staðfest (sömu `SummaryMetricLine`/lyklar) |
| 5: val færir `selectedHour`, kort og #489-samantekt úr sama gagnasetti, samanburður endurmiðjast (reiknaður úr `selectedHour`), engin ný fetch | Staðfest í kóða; UI-próf CC-eignað |
| S2: ekkert samanburðarsvæði þegar `forecast.available` er false eða `selectedHour` ekki valið | Staðfest í kóða (`selectedHour ? <RouteComparison/> : null` innan `forecast.available`) |
| 6: stale-lína, föst athugasemd um að færð sé nýjasta staða, ekki spá | Staðfest í kóða |
| S3 (bókstaflega): fókus á stöðugan hnút eftir notandaaðgerð, `aria-live`, ekki stolinn við sjálfvirkt val/mínútutík | Útfært eins og skrifað (`userInitiatedRef`); **en select-hluti S3 veldur R1** |
| S4: 375 px mæling, fókushringur | CC-eignað (e2e), ekki endurkeyrt |
| Backend/ETA/cache óbreytt | Staðfest (mtime) |

## Gallar

**R1 — MED — fókus er rifinn af `<select>` við hverja breytingu með lyklaborði (rót: S3-skilyrðið mitt).**
`onChange` á brottfararvalinu kallar á `handleUserSelectHour` → effect flytur fókus á `comparisonBaselineRef`. Í vafra fer `change` af stað við hvert ArrowDown á lokuðu `<select>`; eftir fyrsta skref er fókus kominn af valinu og notandinn getur ekki farið áfram klukkustund fyrir klukkustund nema fara aftur í valið með Tab í hvert sinn (staðfest á staðgengilssíðu í Chromium). Þetta er óvæntar samhengisbreytingar við inntak (WCAG 2.2, 3.2.2 On Input) og brýtur lyklaborðsaðgengi sem prompt atriði 7 leggur áherslu á. Prófin staðfesta núverandi hegðun (`WinterRoute.test.jsx` ~línur 676–684 krefjast að fókus fari á samanburðarsvæðið eftir select-breytingu) og e2e prófar aðeins takkaleiðina. Ég skrifaði „gildir einnig þegar valið fer í gegnum núverandi select“ í S3 og „einnig select-breyting“ í prófkröfuna; sá hluti var rangur og ég leiðrétti hann hér.
Lágmarkslausn: (a) val í gegnum `<select>` flytur ALDREI fókus; fókus er áfram á valinu; (b) takkaleiðin (+2/−2) heldur núverandi S3-hegðun (fókus á stöðugan hnút, `aria-live`); (c) `aria-live`-tilkynning fyrir select-leiðina er valkvæð (skjálesari les nýja gildið í valinu sjálfu), Ripley ræður; (d) próf: Playwright ýtir tvisvar á ArrowDown í valinu og athugar að tveir tímar færðust fram og `document.activeElement` er enn valið; jsdom-prófið við línu ~676 breytist til að krefjast þess að fókus HALDIST á valinu. Ekkert annað breytist.

**R2 — LOW — S1(c) orðalag á ástæðum 2 og 3.**
S1 krafðist þess að ófull þekja bæri skýringarorð um að samanburðurinn krefjist gagna fyrir alla sex punktana. Aðeins ástæða 4 („Samanburðurinn þarf gildi fyrir alla sex punktana …“) segir þetta beint; ástæða 2 („Komutími á a.m.k. einum punkti er utan sótts spáglugga“) og 3 („Gögn vantar fyrir a.m.k. einn af sex punktunum“) gefa það aðeins í skyn. Texti 3 er nálægt og ég tel hann ásættanlegan; ástæða 2 mætti enda á „…; samanburðurinn þarf alla sex punktana“ (IS/EN). Ripley ræður hvort þetta er gert í sömu lagfæringu.

## Athugasemdir (ekki skilyrði)

- **N1:** Baseline-sætið er `<div tabIndex={-1}>` án hlutverks; fókus þangað er hljóðlaus fyrir skjálesara nema `aria-live` skili tilkynningu. Þetta er það sem S3 bað um; ef R1 er lagað stendur takkaleiðin með tilkynninguna.
- **N2:** Óvirk sæti eru `<button disabled>` með ástæðu sem sýnilegan texta; óvirkur takki er ekki fókusanlegur, svo lyklaborðsnotendur ná ástæðunni aðeins með skjálesara-vafrastillingu eða sjónrænt. Samþykkt í S3; engin aðgerð.
- **N3:** Mín villa er skráð hér til gagnsæis; öll önnur skilyrði S1–S4 voru útfærð eins og þau voru skrifuð.

## Eftirstandandi takmörk (UNKNOWN / NOT_TESTED)

- **Production:** NOT_TESTED, áfram skilyrði GitHub-lokunar #490.
- Raunvafrayfirferð og skjámyndir eru CC-eignuð; ég sá þær ekki.
- Ekki lögfræðiráðgjöf. Engin commit/push/deploy.

## Ripley lokamat — umferð 1, 2026-11-04

**REVISE, afmörkuð R1 og R2.** Kóðalestur staðfestir sameiginlegan handleUserSelectHour fyrir select og takka og effect sem færir fókus. S3 select-hlutinn var rangur og er leiðréttur í approved-prompt-v2.md; CC fylgdi samþykktu prompti. Select heldur fókus, takkaleið óbreytt. R2 sex-punkta orðalag tekið með sem smá skýring innan sama samþykkisskilyrðis. Jonesy 50 próf/fuzz 3000 tilvik eru Jonesy-eignuð; CC full suite/lint/build/11 e2e eru CC-eignuð, ekki endurkeyrt hér enda engin appbreyting í þessu mati. N1–N3 ekki ný lokaskilyrði. CURRENT → READY_FOR_CC með v2. Production NOT_TESTED áfram. Enginn forritskóði/net/lykill/commit/push/GitHub hér. Eigandi → CC „Prompt approved“.

---

# #490 — Jonesy result review (umferð 2)

Dagsetning: 2026-11-04. Hlutverk: tæknilegur rýnir, útfærði ekkert. Efni: approved-prompt-v2.md (R1 + R2) gegn raunkóða CC og addendum í cc-report.md.

## Niðurstaða: PASS (með takmörkum hér að neðan; ekkert skilyrði opið)

R1 og R2 eru bæði útfærð eins og approved-prompt-v2.md krafðist. Rökfræði samanburðarins er óbreytt og stenst sjálfstæð próf aftur.

## Hvað var athugað (merkt eftir uppruna)

**Sandbox / lestur (mitt, án nets, án lykils, vitest 4.1.10 með `unshare -rn`):**
- `WinterRoute.jsx`: `onChange` á brottfararvalinu er nú `setSelectedHour(e.target.value)` beint; það snertir hvorki `handleUserSelectHour` né `userInitiatedRef`. Eini notandi `handleUserSelectHour` er `onSelect` á `RouteComparison` (takkaleiðin). Fókus-effectinn er óbreyttur og keyrir aðeins þegar `userInitiatedRef` var sett, svo sjálfvirkt val fyrsta tíma og mínútutík-endurútreikningur flytja áfram aldrei fókus. Engin `.focus()` á valinu. Athugasemd fyrir ofan effectinn leiðrétt og rétt.
- `WinterRoute.test.jsx`: nýtt próf „R1: the hour <select> itself keeps focus…“ gerir `select.focus()` sem uppsetningu, kallar `fireEvent.change` á `hours[3]`, bíður eftir að `select.value` og samanburðarsvæðið hafi raunverulega uppfærst og krefst svo `document.activeElement === select`. Það myndi falla á gamla kóðanum (þar sem effectinn kallaði `comparisonBaselineRef.current.focus()`), svo það er ekki tóm fullyrðing. Takkaprófið (S3, fókus á stöðugan hnút inni á svæðinu + `aria-live` texti) er óbreytt og stendur.
- `tests/e2e/winter-route-ticket-486.spec.js`: nýtt próf „#490 keyboard (R1)…“ notar raunverulegt `Tab` frá body upp í valið (engin `.focus()`/`selectOption` í stað lyklaborðsleiðarinnar), tvö raunveruleg `ArrowDown`, og eftir hvort skref bæði `toHaveValue(EXPECTED_HOURS[n])` og `document.activeElement === select`. Fyrra Tab→Enter prófið á takkanum er óbreytt.
- Þýðingar: `winterRouteComparisonReasonArrivalOutsideWindow` og `…ReasonPointUnavailable` enda nú á „samanburðurinn þarf alla sex punktana“ / „the comparison needs all six points“ í IS og EN; enginn enskur texti í IS-hlutanum; 68 lyklar í hvorum hluta (136 með tvítekningu, 68 einstakir), engin lykil vantar. Forgangur ástæðna, tiltækileikaregla og stærðfræði ekki snert.
- `winterRouteComparison.js`, `winterRouteEta.js`, `winterRouteSummary.js` og backend (`winter-route.js`, `segments.js`) óbreytt miðað við fyrri yfirferð. Staged afrit mín af lib-skrám eru þau sem ég keyrði.
- Endurkeyrsla á lib-prófum: CC-prófin `winterRouteEta`, `winterRouteSummary`, `winterRouteComparison` ásamt mínum þremur fuzz/brute-force skrám, **4 skrár / 50 próf standast**; tvær viðbótarskrár mínar (24 + 6 próf) einnig. Fuzz niðurstöður óbreyttar frá umferð 1.

**CC-eignað, ekki endurkeyrt af mér:** skoped vitest á 4 skrám (81/81), lint hreint, Playwright spec-skrá 12/12 (þar með bæði #490 lyklaborðspróf), engin full suite/build í þessari umferð samkvæmt prompt.

**Ekki keyrt af mér (NOT TESTED):** React/jsdom-prófin, lint, build, Playwright í appinu, git, vercel dev, Production. Ekkert keyrt á vél eiganda. Ég keyrði ekki appið í raunvafra; hegðun á ArrowDown byggi ég á lestri kóðans, á CC-eignuðu e2e prófi og á Chromium-staðgengilssíðunni úr umferð 1 (sýndi vandamálið, ekki appið).

## Samræmi við approved-prompt-v2.md

| Liður | Niðurstaða |
|---|---|
| 1: select flytur ekki fókus, takkaleið óbreytt, sjálfvirkt val/mínútutík flytja ekki fókus | Staðfest í kóða |
| 2: jsdom-próf uppfært | Staðfest (nýtt próf; sjá leiðréttingu hér að neðan) |
| 3: raunverulegt Playwright-próf, Tab + 2×ArrowDown, `activeElement` enn select, endurmiðjun | Próf til staðar og rétt skrifað (lestur); keyrsla CC-eignuð |
| 4/R2: sex-punkta orðalag á ástæðum 2 og 3, IS+EN, engin breyting á reglu | Staðfest |
| Afmörkun: engar breytingar á libs/backend/ETA | Staðfest (mtime við staging; lib-hegðun auk þess prófuð, sjá ofan) |

## Leiðrétting á minni eigin fullyrðingu úr umferð 1

Í umferð 1 skrifaði ég að `WinterRoute.test.jsx` ~línur 676–684 krefðust fókusflutnings eftir *select*-breytingu. Það var ónákvæmt: þar kemur `fireEvent.change(select, …)` aðeins sem uppsetning og fókus-fullyrðingarnar koma á eftir `fireEvent.click` á „2 klst. síðar“ takkann, þ.e. þær prófa takkaleiðina. CC hafði því rétt fyrir sér að ekkert fyrra próf staðfesti ranga select-hegðun og að viðbót prófs (ekki viðsnúningur) væri rétt. Rót R1 stendur óbreytt (kóðinn kallaði `handleUserSelectHour` úr select-`onChange`); ónákvæmnin var aðeins í lýsingu minni á prófunum.

## Athugasemdir (ekki skilyrði)

- **N1:** Endurmiðjunarfullyrðingin í nýju prófunum er veik: „Núverandi val“ (e2e) og baseline-merki (jsdom) sjást við hvaða viðmið sem er. Raunveruleg sönnun á endurmiðjun er `toHaveValue`/`select.value` ásamt eldri takkaprófinu sem ber saman tímasetningar. Engin aðgerð; ekki samþykkisskilyrði.
- **N2:** Í e2e prófinu er „Tab frá body“ lykkjan háð fókusröð síðunnar (leit í allt að 20 Tab); ef fókusröð breytist síðar fellur prófið hávært, ekki hljótt. Engin aðgerð.
- **N3:** Select-leiðin tilkynnir ekki gegnum `aria-live`; skjálesari les nýja gildið í valinu sjálfu (valkvætt samkvæmt v2). Óbreytt.

## Eftirstandandi takmörk (UNKNOWN / NOT_TESTED)

- **Production:** NOT_TESTED, áfram skilyrði GitHub-lokunar #490, eigandastýrt.
- Raunvafrakeyrsla (e2e 12/12) er CC-eignuð; ég sá hvorki keyrslu né skjámyndir.
- Texti GitHub-miðans ólesinn af mér (gh GraphQL lokað). Ekki lögfræðiráðgjöf. Engin commit/push/deploy.

## Ripley lokamat — umferð 2, 2026-11-04

**PASS á innleiðingarafhendingu.** Sjálfstæður lestur staðfestir að select onChange kallar aðeins setSelectedHour; aðeins samanburðartakkar setja userInitiatedRef og færa fókus á baseline. R1 lagfært og ný jsdom-/raunvafrapróf fyrir Tab + tvö ArrowDown til staðar. R2 skýr sex-punkta umfangsorð á ástæðum 2/3 á IS/EN; engin ný reikniregla. Jonesy leiðrétting á lýsingu fyrra prófs samþykkt: gömlu fókusprófin voru fyrir takkaleið, nýja select-prófið bætir vantaðri grein. N1–N3 eru óhindrandi skráðar takmarkanir.

Sjálfstæð tilraun `npx vitest run src/pages/WinterRoute.test.jsx src/lib/winterRouteComparison.test.js` stöðvaðist áður en próf keyrðu vegna sandbox-temp EPERM rename; núll próf, ekki eigin PASS-keyrsla. CC 81/81 markviss próf, lint og 12/12 Chromium e2e eru CC-eignuð; Jonesy 50 próf/sjálfstæð fuzz-próf úr umferð 2 eru Jonesy-eignuð. Fyrra build/full-suite úr umferð 1 ekki endurkeyrt hér.

CURRENT → CLOSED fyrir staðbundna innleiðingar-/review-afhendingu. **Production NOT_TESTED og GitHub #490 má ekki loka fyrr en eigandastýrð production-staðfesting eftir yfirfarna birtingu liggur fyrir.** Eigandi sér um commit/push og birtingarákvörðun, síðan afmarkaða staðfestingu þriggja sæta/ótiltækileika, tímavals, kortasamstillingar og núverandi færðar. Engin undanþága frá skilyrði miðans, engin ný rannsókn og engin sjálfvirk birting. Enginn forritskóði/raunnet/lykill/commit/push/GitHub/deploy í þessu lokamati.

## Production-athugun — 2026-11-04

Eigandi segir commit/push/birting búin. Nýr IAB-flipi á https://www.eltumvedrid.is/winter-route, síðan ný síðuhleðsla með ?verify=490-20261104 til að forðast endurnotkun sömu síðuslóðar. Fullt AX-tré eftir gagnasókn í báðum tilvikum sýnir #489 samantekt, brottfararselect, sex komutímaspákort og 13 færðarkafla; sóknartími 16:50 UTC. #490 þriggja sæta samanburður/takkar sjást ekki á hvorri síðu. **Production #490 ekki staðfest í þessari athugun.** Birt commit/cache/CDN/PWA orsök UNKNOWN, ekki ályktað að kóði sé rangur eða að birting hafi ekki átt sér stað. Engin viðgerð, bein veitubeiðni, lykilaðgangur eða GitHub-lokun. Innleiðingar-PASS óbreytt; lokaskref bíður sýnilegrar nýrrar útgáfu.

## Production-staðfesting eftir lok build — 2026-11-04

**PASS.** Eigandi skýrði að fyrri athugun var á meðan build stóð yfir og tilkynnti nú nýja útgáfu tilbúna. Nýr IAB-flipi á https://www.eltumvedrid.is/winter-route?verify=490-final sýnir þriggja sæta samanburð. Fyrri athugun á eldri birtingu er ekki núverandi niðurstaða; enginn kóðagalli ályktaður.

Raungögn, engir stubbar: sóknartími 2026-11-04 16:51 UTC. Viðmið 17:00, fyrr 15:00 sýnt disabled með skýrri ástæðu liðinn/utan glugga, síðar 19:00 tiltækt. Smellt á 19:00: viðmið varð 19:00, fyrr 17:00 og síðar 21:00; select/kort/#489-samantekt uppfærðust samhljóða og fókus fór á nýtt viðmið. Valkosturinn hafði áður sýnt hviður 12,7 m/s Hvolsvöllur–Skógar kl.21, úrkomu 0,3 mm Skógar–Vík kl.22, hita 3,8°C P1 kl.20; sömu gildi/kaflar/gildistímar birtust í núverandi samantekt og kortum eftir val. Öll sex kort voru sýnileg; færðarlisti/talning 4 óbreytt og skýr aðgreining núverandi færðar frá framtíðarspá sýnileg.

Lyklaborð: ör niður á select færði 19→20; önnur ör niður án endurfókusar færði 20→21. AX-fókus var áfram select eftir bæði skref; samantekt/kort/samanburður endurmiðjuðust. Við 21:00 var hámarkshviða 12,0 m/s við P2 kl.22 (jafnt gildi við P5, fyrsti punktur valinn), hámarksúrkoma 1,2 mm P5 kl.23 og lágmarkshiti 3,7°C P1 kl.22, í samræmi við birt kort. UTC-dagamót sýndust rétt á P6 kl.00 næsta dag. Birt commit-id ekki tiltækt í UI; útgáfuauðkenni óstaðfest. Engin villuástand þvinguð á production; það er stutt af fyrirliggjandi stubbuðum prófum.

Jonesy-review, Ripley innleiðingar-PASS og afmörkuð production-staðfesting liggja nú fyrir. GitHub #490 má loka eftir eigandafyrirmælum; ekki lokað sjálfkrafa. Enginn lykill lesinn, bein veitubeiðni, kóðabreyting, commit/push/deploy hér.

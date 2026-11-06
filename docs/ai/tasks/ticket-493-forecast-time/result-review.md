# #493 forecast-time — Result review

## Jonesy result review — umferð 1 (2026-11-06)

### Niðurstaða: REVISE (lítil, aðeins próf og skýrsla: þrjú af skyldu-prófum T2/T3/T5 vantar og skýrslan segir það ekki; engin breyting á vörukóða virðist nauðsynleg)

Vörukóðinn gerir það sem approved prompt biður um og ég fann enga virkniverkju við lestur: sameiginlegt `effectiveHour` er reiknað í render, nákvæm `indexOf`-uppflettining er notuð bæði í ForecastCard og samantekt, ETA/±2/70 km/klst. er horfið, API og route config óbreytt, og leiðarskipta-/fetch-hegðun #491 er ósnert. Það sem vantar eru prófin sem T2, T3 og T5 kváðu sérstaklega á um. Cc-report nefnir þau hvorki sem gerð né sem ógerð.

### Sandbox-athuganir mínar (lestur og grep á staged afritum; ekkert keyrt, ekkert net, enginn lykill)

- **Staða:** CURRENT var CC_COMPLETE, approved prompt = `approved-prompt-v1.md` (T1–T5, N1–N4), CC report = `cc-report.md`. Ég las CURRENT-handoff, approved prompt, cc-report og breyttar skrár: `WinterRoute.jsx`, `winterRouteSummary.js`, `winterRoutePresentation.js`, `translations.winterRoute.js`, `WinterRoute.test.jsx`, `winterRouteSummary.test.js` og bæði e2e-spec.
- **Vörukóði (lestur):** `effectiveHour = selectedHour && availableHours.includes(selectedHour) ? selectedHour : null` er reiknað beint í render (WinterRoute.jsx ~l. 460), sent til `RouteSummary` og hvers `ForecastCard`; `point.hours.indexOf(effectiveHour)` án nálægðarleitar; `null`-gildi/gagnagat gefa „—“/missing, núll er áfram gilt gildi, jafngildi heldur fyrsta punkti, `isPartial` notar `validCount < points.length` og `expectedPointCount` í texta. Dag/nótt-tákn er lesið úr `point.hours[hourIndex]`. Hlutlaus textabreyting: lykillinn `winterRouteForecastNotAvailableAtComputedTime` heitir enn „Computed“ en gildið er „Spá ekki tiltæk“.
- **Fjarlæging (grep yfir `src` og `tests`):** engin neytandi eftir af `winterRouteEta`, `winterRouteComparison`, `formatInstantHHMM`, `resolvePointAtDeparture`, `computeEta`, `ASSUMED_AVERAGE_SPEED_KMH`, `EtaApproximation`, `EstimatedArrival`; aðeins skýringar-athugasemdir. `approxDistanceFromStartKm` er hvergi lesið í `src` (aðeins fixtures og athugasemdir) og er enn í `api/` (15 tilvik, `api/_lib/winterRoute/` mtime óbreytt frá fyrri umferðum). `winterRouteEta.js`/`winterRouteComparison.js` (+ próf) eru horfin af tæki (`src/lib` listi); staged afrit mín af þeim eru gömul.
- **Þýðingar (grep):** regexp `departure|arrival|\bETA\b|70 ?km|brottf|komutím|áætluð|samanburð` finnur engin tilvik í `translations.winterRoute.js`; `winterRouteHourLabel` = „Spátími“ / „Forecast time“; `winterRouteSameForecastTimeNote` = „Sami spátími gildir fyrir alla punkta.“ / „The same forecast time applies to all points.“; mæligildalínur, „Gildir fyrir {time} UTC“, `GridDisclaimer`, `NotSafetyAdvice`, `LatestStatusNote` eru orðrétt eins og fyrir breytingu (borið saman við fyrri lestur minn). Engir comparison/ETA-lyklar eru eftir.
- **Umfang á tæki (mtime):** `src/pages/WinterRoute.jsx` 1793986675937, `.test.jsx` 1793986946967, `winterRouteSummary(.test).js` 1793986548030 / 1793987026399, `winterRoutePresentation.js` 1793986554635, `winterRouteRoutes.js` 1793986776837, `translations.winterRoute.js` 1793986748493, e2e-spec 1793987479885 / 1793987544089; allar aðrar skrár í `src/lib` og `api/_lib/winterRoute/` eru með eldri mtime (engin óskyld breyting sjáanleg). Ekki endurskoðuð: `src/components`, `src/hooks`, aðrar `src/i18n`-skrár og `.git`.
- **CC-eignað (ekki sannreynt af mér):** 72/72 markviss Vitest, 3052 staðust/1 féll (`App.affiliateHolder.test.jsx`, sagt eldra/óskylt), lint hreint, build 5,61 s, Playwright 16/16 í Chromium, `git status` yfirlit.

### Gallar

- **U1 (MED, T2) — prófin sem T2 krafðist vantar.** T2: „Prófaðu tóman glugga, mínútutikk sem fellir val út og fyrsta render eftir leiðarskipti með ósamhæfðum gluggum … Prófaðu fyrsta render með sömu aðferð og V2 leiðarskiptapróf.“ Í `WinterRoute.test.jsx` er aðeins próf sem hefst með `expectedHours: []` (aldrei með valið `selectedHour`, svo gamla villan — stale val í tómum glugga — er ekki útfærð), engin fake timers/`setSystemTime`/mínútutikk og ekkert Profiler-frame-próf fyrir leiðarskipti með ósamhæfðan glugga. Án þeirra er kjarni T2 óvarinn gegn afturför.
- **U2 (MED–LOW, T3) — próf á „engin brottfarar-/komuhugtök“ vantar.** T3: „Staðfestu með prófi að IS/EN textagildi innihaldi hvorki …“. CC lýsir handvirku `grep` sem „zero matches“. Ég endurkeyrði sambærilega leit og fékk líka núll, en ekkert próf varðveitir það. Prófið sem er til (l. 275) athugar aðeins nýja label/athugasemd.
- **U3 (MED–LOW, T5) — varðveisla vals við leiðarskipti óprófuð.** T5: „Prófaðu varðveislu vals sem er í báðum gluggum og fyrsta tiltæka tíma þegar fyrra val fellur út.“ Engin tilvísun í slíkt próf (leit að preserve/first available/val yfir leiðir: ekkert). Núverandi A→B→A-próf snúast um fetch og gögn, ekki val.
- **U4 (LOW, T1/liður 4) — lyklaborðsprófun á mjóum skjá ekki gerð.** T1: „Notaðu uppfærð spec fyrir lyklaborðsprófun á mjóum skjá.“ Bæði ný lyklaborðspróf (486 l. 204, 491 l. 293) setja 1280×900; 375px-prófin eru án lyklaborðs. Skýrsla segir „Chromium keyrt, ekki NOT_RUN“ en nefnir ekki að breiddin hafi ekki verið mjó.
- **U5 (LOW, skýrsla) — ógerð atriði ekki skráð.** Skýrslan hefur „Not done“ en nefnir ekki U1–U4. Raunveruleg takmörk (hvað var ekki prófað) eiga að koma fram, sbr. lið 4 „Skráðu keyrslur og raunverulegar takmarkanir“.

### Skilyrði fyrir PASS (öll tengd approved-prompt-v1 T1–T5/N3; aðeins próf og skýrsla, engin vörubreyting)

- **V1 (U1):** (a) próf þar sem `selectedHour` er þegar sett og glugginn verður síðan tómur → engar mælitölur í sama render (Profiler eða `waitFor`+commit-athugun), veljari sýnir „engin tími“; (b) fake timers/`setSystemTime` færir `now` fram yfir valda klukkustund → ekkert commit með gildum fyrir liðna tímann, fyrsti tiltæki tími valinn; (c) frame-level (sama aðferð og V2) leiðarskipti þar sem nýr gluggi inniheldur ekki fyrra val → ekkert commit með gildum fyrir gamla tímann.
- **V2 (U2):** vitest-próf sem fer í gegnum öll `winterRoute*`-gildi í `translations.is` og `translations.en` og athugar heil orð/orðmyndir (`departure`, `arrival`, `\bETA\b`, `70 ?km`, `brottför`/`brottfar-`, `komutím-`) og finnur ekkert; gætt að óskyldum texta (t.d. „departure“ í öðrum lyklum utan `winterRoute*`).
- **V3 (U3):** tvö próf: val sem er í báðum gluggum helst við skipti A→B (og B→A) án sér-sögu; val sem er ekki í nýja glugganum fellur á fyrsta tiltæka tíma nýju leiðar.
- **V4 (U4):** keyra lyklaborðs-e2e (a.m.k. nýja Borgarnes-prófið) við 375px breidd, eða skrá berum orðum að það var ekki gert; engin staðhæfing um „mjóan skjá“ án þess.
- **V5 (U5):** uppfæra cc-report „Not done/Limits“ með því sem enn er óprófað eftir V1–V4 og með nákvæmri keyrsluskrá (skipanir, fjöldi, niðurstaða) fyrir endurkeyrslu.

### Athugasemdir (ekki skilyrði)

- **N3 (LOW):** dag/nótt-prófið (l. 261) athugar aðeins að „unknown symbol“ birtist ekki; það sannar hvorki að sameiginlegi tíminn ráði dag/nótt né að tákn breytist. Gott en valfrjálst að bæta við einni hlið við hlið athugun með tveimur klukkustundum (dag/nótt) ef táknið gerir greinarmun.
- **N-lykill:** `winterRouteForecastNotAvailableAtComputedTime` mætti endurnefna síðar; ekki nauðsynlegt og utan þessarar lotu.
- **N-orðalag:** „Engin framtíðartími er tiltækur núna.“ (óbreytt) — málfræðileg lítil athugasemd fyrir eiganda, ekki í umfangi.

### Mörk

Þetta er yfirferð á kóða og prófum í staged afritum. Ég keyrði ekki Vitest, Playwright, lint, build, git eða vafra á vél eiganda og gerði engin netköll; allar niðurstöður úr keyrslum (72/72, 3052/1, lint, build, 16/16) eru CC-eignaðar. Ég get ekki sannreynt að `App.affiliateHolder.test.jsx` sé fyrirliggjandi flaky án keyrslu eða git-sögu. Production NOT_TESTED. Næsta skref: Ripley ákveður hvort V1–V5 fari í stutta CC-umferð (mælt með, því T2/T3/T5 kváðu skýrt á um prófin og þau verja kjarna breytingarinnar) eða séu samþykkt sem fyrirvarar í lokamati; Róbert commit-ar sjálfur.

## Ripley lokamat, 2026-11-06

**REVISE V1–V5.** Samþykkt prófunarskilyrði fyrir ógilt tímaval, varðveislu vals, þýðingar og 375px lyklaborðsnotkun vantar í afhendingu. Markviss eigin Vitest-keyrsla stöðvaðist við EPERM við endurnefningu tímaskrár áður en prófin hlóðust. Fyrri keyrslutölur eru CC-eignaðar. Ástæða falls í App.affiliateHolder.test.jsx er óstaðfest. Leiðréttingardrög fara í PROMPT_REVIEW. Production NOT_TESTED.

## Jonesy result review — umferð 2 (prófunarlota V1–V5/W1–W5, 2026-11-06)

### Niðurstaða: PASS (með fjórum LOW athugasemdum Z1–Z4; engin þeirra breytir vörukóða, vörustöðu eða niðurstöðumerki)

V1–V5 eru uppfyllt að efni: ný próf verja `effectiveHour` í render (tómur gluggi með valið enn í state og mínútutikk sem fellir aðeins fyrsta tímann), þýðingarprófið er Unicode-meðvitað með lyklasafn > 0 og jákvæðu viðmiði, varðveisla og fallback vals milli leiða eru prófuð í báðar áttir með aðgreinanlegum gildum, 375px lyklaborðspróf eru í báðum e2e-spec, og cc-report hefur dagsettan append-only viðauka með keyrsluskrá. Ég fann einn veikleika í prófi (V1(c) staðhæfir meira en það getur sannað, Z1); hann veikir ekki T2-þekju því V1(a) og V1(b) bera hana.

### Sandbox-athuganir mínar (lestur á staged afritum og lítil offline Node-keyrsla; ekkert net, enginn lykill, ekkert keyrt á vél eiganda)

- **Staða:** CURRENT var CC_COMPLETE, approved prompt = `approved-prompt-v2.md`, CC report = `cc-report.md` (viðauki „Addendum, 2026-11-06 — correction round“). Ég las CURRENT-handoff, approved v2, allan viðaukann og ný próf í `WinterRoute.test.jsx` og bæði e2e-spec.
- **Umfang (mtime á tæki):** vörukóði og stillingar óbreytt frá fyrstu lotu: `WinterRoute.jsx` 1793986675937, `translations.winterRoute.js` 1793986748493, `winterRouteSummary.js` 1793986548030 (óbreytt frá result review umferð 1), `vitest.config.js`/`playwright.config.js`/`package.json` með gömlum mtime. Breytt í þessari lotu: `WinterRoute.test.jsx` 1793988826429, `winter-route-ticket-486.spec.js` 1793988718243, `-491.spec.js` 1793988737536, `cc-report.md`, `CURRENT.md`. Samræmist W5(d). `git status` er CC-eignað.
- **Talnasamræmi (útreikningur minn):** `WinterRoute.test.jsx` fjölgar úr 49 í 58 = V1: 2 + V2: 4 + V3: 2 + V1(c): 1 = 9 ✓; Vitest heild 3052 + 1 fallið = 3053 áður, +9 = 3062 ✓; e2e 9→10 og 7→8 = +1 hvort ✓ (18 próf í heild).
- **V2 þýðingarpróf — eigin keyrsla (sandbox, Node 22):** ég keyrði sömu sjö regex-mynstur og prófið notar á **öll 58 gildi** í `winterRouteTranslations` (is og en; 57 `winterRoute*` + `footerWinterRoute` hvort) og fékk **0 samsvörun**; jákvætt viðmið: „Estimated departure time“, „Áætlaður brottfarartími“, „Estimated arrival“, „Áætluð koma“, „70 km/h“, „komutími“ greinast allt; „Úrkoma“ og „Mest úrkoma (síðasta klukkustund)“ greinast ekki (lookbehind virkar). Lyklafjöldi er jafn í báðum málum (57/57).
- **V1(a)/(b) (lestur á prófum):** báðar nota `vi.useFakeTimers({ toFake: ["setInterval","Date"] })`, `vi.setSystemTime`, `act(advanceTimersByTimeAsync(60000))`, ≥3 klst. fixtures og `vi.useRealTimers()` í `afterEach`. (a): vörðuð skilyrðið „ekkert commit með ‚engin tími‘-skilaboðum ásamt raunverulegu mæligildi“ og non-vacuity „tóma-glugga-staðan sást“. Með gamla útfærslu (kort lesa `selectedHour` beint) myndi commit eftir tikkið sýna −9 ásamt „engin tími“ og prófið falla — af lestri, ekki keyrt. (b): öll commit eftir tikkið mega ekki sýna fyrsta tímagildið (−1) og commit með öðrum tíma (−2) verður að sjást. Sama ályktun: fellur með stale-útfærslu.
- **V3:** fixtures hafa þrjá tíma í glugga og skarast í tveimur, valið er h2 (ekki fyrsti kostur), A→B→A staðfestir `select`-gildi og **gildi korta** (55 á Borgarnes ×4, −2 á Vík ×6); fallback-próf staðfestir h2 og 55 ×4.
- **V4:** bæði ný e2e-próf setja 375×800, staðfesta `page.viewportSize().width === 375`, fókusa veljarann, stíga 10× með `ArrowDown`, staðfesta samantektargildi, kortagildi, óbreytta beiðnafjölda (486: 1; 491: 0 eftir endurstillingu í lok route-switch) og `scrollWidth ≤ clientWidth`. Borgarnes-prófið endurstillir teljarann eftir að spátíma-veljari er sýnilegur (laga úr fyrstu lotu).
- **CC-eignað (ekki sannreynt af mér):** Vitest 58/58 og 3062/0, lint hreint, build 5,84 s, Playwright 18/18, og að `App.affiliateHolder.test.jsx` hafi staðist í þessari keyrslu (orsök fyrra falls óstaðfest — orðað rétt samkvæmt W5(c), ekki endurmerkt „flaky“). Engin EPERM-hindrun í umhverfi CC.

### Athugasemdir (LOW; ekki skilyrði fyrir PASS)

- **Z1 — V1(c) getur ekki fallið, þótt skýrslan kalli það regression guard.** Prófið skiptir yfir í Borgarnes með fullkomlega óskarast glugga og krefst þess að ekkert commit sýni h1 Borgarnes ásamt gamla Vík-gildinu (−7). En (i) `view` grímir gömul gögn þar til ný berast, og (ii) þegar Borgarnes-gögnin koma finnur nákvæmt `indexOf` gamla valið ekki í Borgarnes-`hours` og kortin sýna gagnaskort óháð `effectiveHour`. Gildið −7 getur því aldrei birst með Borgarnes-h1, jafnvel þótt `effectiveHour` væri tekið út. Prófið er skaðlaust en sannar ekki T2; T2 hvílir á V1(a) og V1(b). Skýrslan (viðauki, V1) ætti að orða (c) sem „samræmisathugun á leiðarskiptum með skarast ekki glugga“, ekki sem vörn gegn stale-tíma. Hefði gagnast: leiðarskipti þar sem gamla valið er enn í `point.hours` en liðið (úr tómum glugga, eins og í V1(a)).
- **Z2 — W1(b)(i) er ekki staðhæft bókstaflega.** W1 krafðist þess að probe-ið sæi commit þar sem gamla valið er enn í state en kortin sýna gagnaskort. Ekkert V1-próf staðhæfir það millistigs-commit (a: „engin tími“ + ekkert gildi; b: aðeins „ekkert gamalt gildi“). Prófin (a)/(b) falla samt við stale-útfærslu (sjá ofar), svo hættan er lítil; en þetta er frávik frá orðalagi W1.
- **Z3 — titlar ofmæla.** Bæði V4-próf segja „updates … all six/four cards“ en staðhæfa `page.getByText("-2,2 °C").first()` / `("-3,0 °C").first()` (eitt kort). Allir punktar hafa sama gildi í þessum fixtures, svo `toHaveCount(6)`/`(4)` væri bein staðfesting. Annaðhvort laga titil eða talningu.
- **Z4 — afmarkanir sem skýrslan nefnir réttilega:** route-`<select>` með lyklaborði við 375px, dag/nótt-sjónræn athugun (N3 í umferð 1), raunverulegur vegg-klukkutími (fake timers) og Production eru óprófað; engin þeirra er skilyrði. `footerWinterRoute` er utan `winterRoute*`-síunar en ég staðfesti í eigin keyrslu að það gildi er laust við bönnuð hugtök.

### Mörk

Þetta er yfirferð á prófum og skýrslu. Ég keyrði ekki Vitest, Playwright, lint, build, git eða vafra á vél eiganda og gerði engin netköll; eina keyrsla mín var lítil offline Node-keyrsla á þýðingarmynstrunum í sandbox. Ályktanir um að V1(a)/(b) falli við stale-útfærslu eru af lestri, ekki af mutation-keyrslu (ég hef ekki verkefnið uppsett í sandbox). Allar niðurstöður úr keyrslum CC (58/58, 3062/0, lint, build, 18/18) eru CC-eignaðar. Production NOT_TESTED. Næsta skref: Ripley lokamat (taka Z1–Z3 sem fyrirvara eða biðja um stutta lagfæringu á titlum/skýrslu); Róbert commit-ar sjálfur.

## Ripley lokamat, 2026-11-06

**PASS með skráðum prófunarfyrirvörum.** Samþykki lokamat Jonesy. V1(a)/(b) bera vörn gegn útrunnu vali. V1(c) er samræmisathugun á leiðarskiptum með ósamliggjandi tímaglugga og sannar ekki sjálfstætt render-vörnina. Prófin staðhæfa ekki sérstaklega að gamla gildið sitji enn í state í millistöðu. 375px prófin athuga samantekt og eitt kort hvort þótt titlar segi öll kort. Z1–Z4 eru skráðir fyrirvarar við prófunarsönnun.

Eigin markviss keyrsla á WinterRoute.test.jsx og winterRouteSummary.test.js stöðvaðist við EPERM í endurnefningu tímaskrár fyrir prófahleðslu. Núll próf keyrð hjá Ripley. Vitest 58/58 og 3062/3062, Playwright 18/18, lint og build eru niðurstöður CC. Production NOT_TESTED. CURRENT fer í CLOSED fyrir þessa spátímalotu undir #493.

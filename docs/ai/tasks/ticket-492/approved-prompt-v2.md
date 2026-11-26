# #492 — Approved prompt v2: laga skörun á 360px

Samþykkt 2026-11-24. Jonesy samþykkti umferð 2 með bindandi P1–P5. Framkvæma aðeins þegar CURRENT vísar á þessa skrá, Stage er READY_FOR_CC og eigandi segir Prompt approved.

Þetta er öll framkvæmdarheimild viðbótarlotunnar. P1–P5 hér að neðan ganga framar grunntexta Ripley þar sem skarast. Approved-v1 er óbreytt saga, ekki fyrirmæli um að endurtaka innleiðinguna. Umfang aðeins staðfest mobile-skörun, narrow CSS/markup, vaframæling og skýrsluleiðréttingar. Engin ný kort/þekja/CI/API/veituköll/dependency eða git-mutation. Engin full #492-lokun.

## Fyrsta aðgerð og sönnun

Varðveita núverandi ólagfærða stöðu án stash/reset/checkout áður en app-kóða er breytt. Mæla núverandi gölluðu töfluna einu sinni fyrst með sama STUB sýni og verður notað eftir lagfæringu, samkvæmt P1–P4. Þetta uppfyllir baseline-kröfu án git-aðgerða. Ef núverandi tafla hefur þegar verið breytt af öðrum og baseline er ekki fáanlegt read-only, skrá það og leysa ekki með stash eða yfirskrift notandabreytinga. Bíða fonts.ready; skrá letur, viewport, DPR, lang/theme og STUB-klukku. Þá minnsta CSS/markup-fix og sömu mælingu eftir breytingu; vista mælingarskriptu og JSON og nýjar IS/EN myndir í evidence/mobile-fix/.

Engin mæling skal fá PASS með falinni klippingu eða unavailable-gildum í stað breiðra talna. 360px er samþykktarmark; 320px eingöngu upplýsingaviðmið, ekki nýr blocker. ≥4px slaki samkvæmt P4. Ef lágmarks CSS dugir ekki, heimilt tvílínu-markup innan sömu raðar/töflu samkvæmt P5; engin sjálfvirk þriðja review-lota.

### Bindandi atriði

**P1 — Versta-tilfelli gildi og heiti í sýninu (ekki aðeins „neikvætt gildi, löng heiti, gust ≥ 10“).** Fixture-ið þarf að innihalda að minnsta kosti eina röð með hámarksbreidd sem íslenskt vetrarveður gefur: t.d. hiti `-12,5 °C` (IS) / `-12.5 °C` (EN), gust `28,4 m/s`, úrkoma `12,0 mm`, vindur `18,0 m/s`; auk raun-`labelIs` **og** `labelEn` fyrir alla 18 punkta úr handlernum (íslensku heitin eru lengri en þau ensku og IS ljós 360 px er erfiðasta samsetningin, ekki EN dökkt). Núverandi sýni (hitastig −3 … 3,8) sannar ekki lagfæringuna fyrir raun-vetur. Ein röð með löngu heiti **og** breiðu neikvæðu gildi **og** gust ≥ 10 skal vera til.

**P2 — Beinasta ósamræmið mælt: texti/tákn innan eigin hólfs, ekki aðeins pörun.** Skörunin var „efni fer út úr eigin hólfi inn í nágrannann“. Mæla því fyrir **hvert** `th`/`td` (haus og raðir, 18 raðir × 2 tungumál): (a) `Range`/`getBoundingClientRect` á texta og tákni liggi innan hólfsins (±1 px), (b) `scrollWidth ≤ clientWidth` fyrir hvert hólf, (c) engin skörun milli neinna tveggja hólfa-efnis (Ripley) og (d) ekkert brot í gildi+einingu („10.0“ / „m/s“ á tveim línum) — mæla fjölda línuboxa gildis-textans (`Range.getClientRects().length === 1`). Skrá fjölda hólfa mældra og núll-brot í skýrslu, ekki bara „í lagi“.

**P3 — Mæling skal sönnuð á gallaða kóðanum áður en hún er notuð.** Keyra sömu mælingarskriptu **einu sinni á ólagfærðum kóða** (stash/hrein útgáfa af v1; engin framleiðsla) með sama fixture og skrá að hún finnur galla (t.d. ≥ 1 skörun á Holtavörðuheiði/Öxnadalsheiði-röðunum og haus-skörun á EN); síðan á lagfærða kóðanum og skrá núll. Mæling sem hefði einnig staðist fyrir lagfæringu sannar ekki neitt. Skriptan (og niðurstöðu-JSON) vistuð í `evidence/mobile-fix/` eins og Ripley mælir fyrir um.

**P4 — Letur og mæliskilyrði skráð; slaki en ekki jaðartilvik.** Bíða eftir `document.fonts.ready` áður en mælt er (mæling á fallback-letri gefur ranga breidd) og skrá computed `font-family` og hvort vefletrið var raunverulega hlaðið. Chromium-mæling gildir fyrir Chromium; sími notandans notar önnur kerfisletur (iOS/Android), svo krefjast **≥ 4 px slaka** í tæpustu röð/hausi á 360 px og skrá einnig sömu mælingu á 320 px sem upplýsingaviðmið (blokkar ekki PASS, en skráir hvar breidd þrýtur). Viewport nákvæmlega 360, DPR skráð, tungumál/þema skráð (`localStorage` aðferðin úr v1 óbreytt).

**P5 — Þrep ef lágmarkslausnin dugar ekki; prófabreytingar skráðar, ekki veiktar.** Ef CSS-lagfæring (styttri hausar með réttum IS/EN lyklum, brjóta löng orð, `whitespace-nowrap` á gildum, aðeins breiðari stað-dálkur/þéttari padding, tákn á eigin línu **innan sama hólfs**) uppfyllir ekki P2 á 360 px, er næsta minnsta skref að breyta markup þannig að hvert punkt-lína verði tveggja-línu gerð **innan sömu `<table>`/sömu raðar** (t.d. staður+tákn á línu 1, gildi á línu 2) án þess að fela dálka; ekki taka upp aðra framsetningu eða mynda þriðju lotuna. Breyting á `getAllByRole("row")`/`rowheader`/hólfa-athugunum í nýju overview-prófunum er heimil **aðeins** ef markup breytist, með hverri breyttri athugun og ástæðu skráðri; legacy-, identity-, race- og draft-athuganir snertast ekki. Ef ekkert af þessu dugar án þess að fela gögn ⇒ STOP og lýsa orsök (ekki `overflow-hidden`).

## Samþykktur grunntexti — P1–P5 að ofan ganga framar

## Ripley — umferð 2, þröng lagfæring eftir result review (2026-11-24)

Lokamat fyrstu afhendingar: REVISE. Óháð keyrsla Ripley: `npx vitest run src/pages/WinterRouteOverview.test.jsx src/lib/winterRoutePresentation.test.js --testTimeout=60000` 33/33. Ég skoðaði 03-mobile360-EN myndina: tákn/texti fara inn í hitadálk, hausar skarast og einingar brotna. Þetta er sýnd læsileikavilla í samþykktu MVP, ekki valfrjáls fínpússun. Engin ný veituköll eða app-breyting hér.

### Næsta CC-heimild sem Jonesy yfirfer

Aðeins laga staðfestan 360px skörunargalla í nýju choose-yfirliti og samræma skýrslu. Ekki endurtaka v1-innleiðingu, endurhanna önnur svæði, gera kort/hnitavörpun eða útvíkka leiðaþekju. Legacy/form/fetch/identity/race/tímaval haldast óbreytt.

1. Minnsta responsive CSS/markup lagfæring sem lætur öll staðarheiti, tákn, mínusmerki, hausana og gildi+einingar vera læsileg án skörunar á 360px IS/EN. Halda einni DOM-framsetningu. Leyfa löngum heitum að brjóta innan síns reits; tákn má færa innan sama staðarhólfs í sérlínu. Ekki fela tákn, mínusmerki, veðurgildi, dálka eða gagnamörk til að fá próf græn. Gildi+eining haldast saman; hausar geta styst með réttum IS/EN lyklum. Ekki fela yfirflæði með overflow-hidden sem klippir efni. Desktop-tafla áfram læsileg, sama punktaröð/fjöldi.
2. Ný vafrasönnun með STUB fixtures, engin lifandi veituköll: 18 punkta north-sýnið á 360px EN dökkt og IS ljóst, nýjar myndir í evidence/mobile-fix/ án yfirskriftar gamalla. Stýra klukku miðað við varðveitt fixture expectedHours eða búa til handler-gerð svör með skráðum nýjum tíma; ekki sýna eingöngu unavailable raðir til að komast hjá tölunum. Neikvætt hitagildi, löng raunheiti og gust≥10 m/s verða að vera í sýninu.
3. Skrá DOM-mælingar fyrir bæði sýni: documentElement.scrollWidth ≤ viewport360, wrapper scrollWidth ≤ clientWidth; getBoundingClientRect fyrir tákn/staðartexta og aðliggjandi hitareit, engin skörun í neinni röð, þ.m.t. langt heiti+neikvætt gildi. Mæla hausana líka þannig að Temperature/Wind eða IS jafngildi skarist ekki. Range fyrir texta má nota til að mæla actual texta fremur en aðeins ytra hólf. Skoða myndirnar sjálfar, ekki einungis mæla. Mæling í jsdom er ekki útlitssönnun. Vista litla task-local mælingarskriptu ef hún er notuð svo þessi eina regression sé endurprófanleg, ekki nýtt almennt prófakerfi. Ein desktop staðfesting nægir gegn regressjón, ekki fullt víxlfeldi.
4. Keyra nýju overview-prófin og presentation-prófin og viðeigandi WinterRoute.test.jsx með --testTimeout=60000 einu sinni; ekki breyta legacy/identity/race-assertions til að fela regressjón. Lint/build/diff-check fyrir breytinguna. Engin CI/hash/timeout-lagfæring eða 957 prófa endurkeyrsla. CSS-gallann sannar vaframæling, ekki próf sem speglar className.
5. Dagsett viðbót við cc-report, varðveita sögu: viðurkenna eldri 360px skörun, leiðrétta fyrri fullyrðingar um engin skörun og að before/after myndir hafi verið til (aðeins gömlu5myndirnar voru til). Nýjar myndir og mælingar eru after-sönnun. Presentation-próf voru24=15eldri+9ný, heild159, ekki30. Reverse-fixture sannar móttekna18punkta röð, ekki raun15punkta Selfoss→R north; ekki kalla það staðfest raunreverse. Mynd05 sýnir unavailable, ekki stale; stale var prófað í unitprófum. Skrá fixture-tíma og endurspilun. Verdict aðeins um þessa yfirlitslotu eftir mælingu, engin full#492lokun.

Raunzoom/raunskjálesari áfram NOT_TESTED ef tól skortir. Lyklaborð/details skoða stutt í sama STUB vafra ef hægt; ekki ný prófunarlota vegna ótiltækra tóla. Engin CSS/viewporthermun kölluð raunzoom. S3 úr Jonesy (per-section stale/old sýnt aðeins í details) varðveitt sem þekktur takmarkandi fyrirvari, ekki leyst með þessari CSS-lotu og ekki almennt fullyrða að allir stale-fyrirvarar séu alltaf lyftir upp. Annað samþykkt scope stendur.

Enginn commit/push/deploy/GitHub-write. Engin ný API/provider/route/coverage/ETA/dependency. Ef þetta krefst utan-scope breytingar STOP og skýra ástæðu áður en farið er lengra. Eftir samþykki gefur Ripley út immutable approved-prompt-v2, READY_FOR_CC; CC fer CC_IN_PROGRESS→CC_COMPLETE og skrifar viðbót við skýrslu. Næsta result-review nær aðeins lagfæringunni og nýrri regressjón; engin sjálfvirk þriðja review-umferð.


---

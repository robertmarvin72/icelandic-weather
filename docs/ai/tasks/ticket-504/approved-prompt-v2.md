# #504 — Approved prompt v2: aðeins fersk vafralota

Samþykkt 2026-11-24. Eigandi heimilaði nýjan kvóta („Já heimilt“); Jonesy samþykkti umferð 2 með bindandi P1–P5. Framkvæma aðeins þegar CURRENT vísar á þessa skrá, Stage er READY_FOR_CC og eigandi segir „Prompt approved“.

Þetta skjal er öll framkvæmdarheimild þessarar viðbótarlotu. Approved-prompt-v1 er söguleg heimild, ekki fyrirmæli um að endurtaka fyrri lotu. Hér fyrir neðan eru grunnviðbót Ripley og bindandi P1–P5 Jonesy. P1–P5 ganga framar grunnviðbótinni þar sem orðalag skarast, sérstaklega röð sýna, beiðnatalning, væntigildi UI og óbreytt skýrslusaga. Setningar grunntextans um að bíða samþykkis eru söguleg forsaga; samþykkið er nú skráð hér.

## Fyrst — samþykkt áætlun

Teljari á allar /api/* beiðnir virkur áður en síðan er opnuð. Fyrirfram skrá tólgetu fyrir talningu, raunzoom og viewport/DPR; án teljara engar gagnabeiðnir. Ekki opna „Fastar veðurleiðir“. Telja winter-route-data og winter-route 3 cold-call-equivalent hvort, líka afbrotnar beiðnir og tilraunir. Mest 10 taldar beiðnir / 30 kalla jafngildi í þessari nýju lotu, óháð fyrri 30/30. Bíða eftir hverri beiðni; engar diagnostic-endurtekningar.

| Röð | UI-aðgerð | Beiðnir | Uppsöfnuð köll |
|---|---|---:|---:|
|1|E→Sey, Sýna leið|1|3|
|2|Rauðavatn→Selfoss, Sýna leið (south)|1|6|
|3|Velja north, skoða 18 spjöld|1|9|
|4|Strax E→Sey, Sýna leið; nákvæmlega 3 spjöld|1|12|
|5|Swap Sey→E, Sýna leið|1|15|
|6|Lyklaborð: Rauðavatn→Hella, Sýna leið (south)|1|18|
|7|Ör í north, 17 spjöld|1|21|

Þrjár beiðnir / 9 kalla jafngildi til vara, ekki krafa um að nota afgang. Raunzoom 200%, mobile 360px og IS/EN á niðurstöðum sem þegar eru komnar; teljarinn staðfestir hvort það kostar viðbótarbeiðni. Nota 18-spjalda niðurstöðuna fyrir zoom/lesanleika áður en skipt er aftur í E→Sey, án nýrrar gagnabeiðni. Væntigildi bils eru ekki heildarlengd leiðar: Selfoss north ≈101,8 km stærsta bil, heildarlengd ≈1236,0 km. Nákvæm UI-viðmið í P3.

### Bindandi atriði

**P1 — Kallabókhald úr kóða, ekki úr ágiskun.** Fyrirfram skráð tafla (aðgerð → væntar gagnabeiðnir → köll) með eftirfarandi kostnaði: síðuopnun 0; *Sýna leið* 1; ring-option par byrjar alltaf á `south` (1) og valkostaval í north/south er 1 í viðbót; swap 0 en síðan *Sýna leið* 1; tímaval 0; zoom/viewport/tungumál 0 (staðfest með teljara, ekki gert ráð fyrir). **Tillaga að röð (7 af 10 beiðnum, 3 til vara):** (1) E→Sey [1]; (2) R→Selfoss [south 1] + valkostaval north [1] = 18 spjöld [samtals 3]; (3) *strax* skipta í E→Sey [1] til að sanna „engin gömul 18 spjöld undir nýjum haus“ [4]; (4) swap Sey→E + *Sýna leið* [5]; (5) lyklaborðsflæði R→Hella: submit [south 1] + ör í north [1] [7]; zoom/mobile/EN eru skoðuð á þeim niðurstöðum sem þegar eru á skjá (0). Bíða eftir að hver beiðni klárist áður en næsta aðgerð er gerð (afbrotin beiðni kostar samt). **Ekki** smella á „Fastar veðurleiðir“; geri CC það óvart skal það skráð sem `/api/winter-route` og talið 3 köll. Engin diagnostic-endurtekning, engin „til að sjá warm-hit“.

**P2 — Teljari sem telur allar `/api/*` beiðnir, og tól valin fyrirfram.** Skrá fyrir fyrstu gagnabeiðni hvaða tól gerir eftirfarandi þrennt, og hvað ekki: (i) telur beiðnir (slóð, `option`, tímasetning) frá því áður en síðan opnast; (ii) framkvæmir raunverulegan vafrazoom (OS-/vafra-stig, Ctrl/Cmd +, sýnileg „200%“ í vafra) — **ekki** page-injected lyklaborðsatburður, CDP-/Playwright-`deviceScaleFactor`, viewport-breyting eða CSS-zoom (Ripley útilokar þetta rétt); (iii) les `devicePixelRatio`/`innerWidth` fyrir og eftir í sömu lotu. Ef ekkert eitt tól gerir allt, skrái CC hvaða mælingu vantar (t.d. „zoom raunverulegur, tala ekki mæld“ eða „tala mæld, zoom ekki raunverulegur ⇒ NOT_TESTED“) og blandi ekki aðferðum. Hver sýnileg `/api/*` beiðni er flokkuð (frí: `winter-route-geometry`, `me` o.þ.h.; talin: `winter-route-data` ×3; talin: `winter-route` ×3) og talan í skýrslu kemur úr teljaranum; `cacheAgeMs === 0` er aðeins aukaathugun. Ef teljari er ekki virkur ⇒ engin gagnabeiðni (Ripley segir þetta þegar).

**P3 — Væntigildi fyrir UI-texta, skráð áður en sýni er tekið.** Fyrir hvert sýni skrái CC væntanlega: fyrirsögn „Veður á N punktum“ (N: E→Sey 3; R→Selfoss south 3 / north 18; R→Hella south 3 / north 17), stærsta-bils-línu (E↔Sey 13,5 km; R→Selfoss north ≈101,8 km, Selfoss→R north ≈111,4 km; viðmið úr matrix með ±0,5 km þol því UI notar `approxDistanceFromStartKm` úr svari), „langleið“-athugasemd á north-leiðum og engin á E↔Sey, og að fjöldi `ForecastCard` jafngildi N. Frávik er niðurstaða (REVISE/BLOCKED eftir STOP-reglum), ekki leyfi til að uppfæra töluna í skýrslu. „Ekkert gamalt undir nýjum haus“ sannast með því að spjöld eftir skiptin séu nákvæmlega 3 og fyrirsögnin „3 punktum“, auk þess sem seinkað *race* kemur áfram úr prófum (ekki skjáskoti).

**P4 — Skýrsla: dagsett viðbót, þröngt verdict, óbreytt saga.** `cc-report.md` og `release-report.md` fá dagsetta viðbót („umferð 2, vafralota“) með: ferskt prófað vs retained vs NOT_TESTED/NOT_MEASURED í aðskildum listum; call ledger úr teljara (P2) með röð, beiðni og kostnaði; hver mynd skráð með raun/stub, vafra, viewport, zoom, tungumál, tímastimpil og slóð í `ticket-504/evidence/browser-followup/`; `git status --short` fyrir og eftir (aðeins ný skjöl/myndir leyfð). Verdict-línan má aðeins nefna það sem raunverulega var prófað (t.d. „UI-flæði PASS fyrir E↔Sey og R→Selfoss north, zoom NOT_TESTED“) og ber „fyrir 11 staða/25 para MVP, ekki #493“ í sömu setningu. Fyrri hluti skýrslu og saga helst óbreytt; leiðréttingar á identity-prófi (resolver-reitur, ekki bann við blöndu í raunhandler) og CI („fyrirliggjandi, 2 af 3 tengjast Winter Route“) fara í viðbótina eins og Ripley mælir fyrir um.

**P5 — STOP-reglur og mörk.** Raunveruleg runtime-villa ⇒ skrá repro/áhrif/minnstu lausn og STOP áður en app-kóða er breytt; engin CI-/hash-/timeout-lagfæring, ekkert endurkeyrsla 957 prófa, engin ný dependency; ef umhverfi bregst (ræsing `vercel dev`/Vite) gilda áfram mest tvær venjulegar tilraunir, síðan skráð óprófað. Hver slík tilraun sem endar í gagnabeiðni telst með í kvótanum. Engin gömul mynd yfirskrifuð; engin mynd utan `browser-followup/`.

## Samþykkt grunnviðbót — P1–P5 að ofan ganga framar

# Ripley — umferð 2, #504: aðeins fersk vafraprófun

Dagsetning: 2026-11-24. Eigandi svaraði „Já heimilt“ við nýjum hámarki 30 veitukalla fyrir eina stutta vafralotu. Þetta afléttir kvótabið, ekki heimild til CI-lagfæringa eða app-breytinga. Fyrri approved-prompt-v1 er óbreytt söguleg heimild; þessi viðbót bíður Jonesy-samþykkis áður en approved-prompt-v2 er gefið út.

## Verk fyrir CC eftir samþykki

Ljúka aðeins ferska UI-hlutanum sem vantaði í fyrri afhendingu #504. Endurnýta gögn/API/offline próf og lint/build úr fyrri skýrslu ef kóði hefur ekki breyst. Ekki endurtaka 957 próf, byggja nýtt prófakerfi eða laga CI. Lesa README/CURRENT, núverandi result-review, release-report og call-accounting fyrst. Varðveita fyrri niðurstöður með dagsettri viðbót.

Fyrsta raunathugun skal vera í vafra: frá Frá/Til vali Egilsstaðir→Seyðisfjörður að 3 punkta niðurstöðu (24,1 km, gloppa um 13,5 km). Engin curl-prófun eða sérstök provider-probe fyrst. Nota núverandi dev-umhverfi, heimilt að ræsa venjulegar project-dev skipanir ef þarf, engar env-breytingar eða lyklar í úttaki. Mest tvær venjulegar tilraunir ef umhverfi bregst, svo skrá raunástæðu.

Fyrir fyrsta data-fetch: nýtt task-local kallabókhald, aðskilið frá fyrri 30/30. Telja hverja /api/winter-route-data beiðni fyrirfram sem 3 cold-call-equivalent, þar með reload, mode/hour/option/swap breytingar og sjálfvirkar endurtekningar; ekki gera ráð fyrir warm-cache í vercel dev. Virkt neteftirlit frá áður en síða opnast, ekkert nýtt data-fetch þegar minna en 3 er eftir. Hámark 10 data-beiðnir / 30 cold-call-equivalent; við mörk STOP net. Geometry/assets teljast ekki veituköll. Engar diagnostic-endurtekningar eða raunveitu-bilanaprófanir. Ef ekki er hægt að halda bókhaldinu öruggu, stoppa frekari lifandi gagnabeiðnir og skrá óprófað.

Forgangsröð: (1) E→Sey úr UI; (2) Rauðavatn→Selfoss north, 18 punktar/um 1236,0 km; skoða allt 18 spjalda flæðið; (3) raunverulegur 200% browserzoom á vali og niðurstöðu, skrá actual zoom-action og fyrir/eftir devicePixelRatio/innerWidth, ekki CSS transform; (4) lyklaborðsflæði með vali, skiptingu, submit, option-arrow og fókus eftir því sem raunverulega er hægt innan kvóta; (5) skipta aftur í E→Sey, tryggja að ekki séu gömul 18 spjöld undir nýjum haus, og swap Sey→E ef kvóti leyfir. Fyrirfram áætla sjálfvirk fetch vegna vals/submit eftir núverandi UI; ekki gera ráð fyrir einni beiðni á skref. Afmarkað mobile 360px og IS/EN með núverandi niðurstöðu ef hægt án endurhleðslu; telja annars köll. Ekki bæta öðrum leiðum við; þær hafa fyrri sannanir. Samastað/óstuddu pari má athuga án data-fetch. Tímasetningarace er staðfest með fyrri prófum, skjáskot sýna aðeins lokastöðu.

Nýjar myndir aðeins í ticket-504/evidence/browser-followup/, með raun/stub, browser, viewport, zoom, tungumáli og tíma skráðum. Engin gömul mynd yfirskrifuð. Raunskjálesari aðeins ef þegar tiltækur, annars NOT_TESTED. Ekki fullyrða öll UI-atriði PASS ef aðeins hluti var prófaður.

Uppfæra cc-report og release-report með dagsettri viðbót: nýtt prófað, retained og NOT_TESTED skýrt aðgreint; call ledger; nákvæm sýni/niðurstöður og myndatilvísanir. Leiðrétta ofmat identity-prófs (resolver-reitur, ekki bann við blöndu í raunhandler); CI er fyrirliggjandi rautt, tvær Winter Route prófbilanir og sér affiliate-bilun. Enginn CI-rerun, timeout/hash-fix eða víðari skjalaendurgerð. Niðurstaða aðeins fyrir 11 staða/25 para MVP, ekki landsþekju #493; #492 utan.

Raunveruleg runtime-villa: skrá repro/áhrif/minnstu lausn, stoppa háð PASS og tilkynna eiganda áður en app-kóða er breytt. Engin ný dependency, provider, framleiðsluprófun, commit/push/deploy/GitHub-write/lokun. Stoppa þegar þessi vafrasannprófun er búin; engin sjálfvirk viðbótarlota.

Eftir samþykki Jonesy gefur Ripley út approved-prompt-v2. CC fylgir READY_FOR_CC→CC_IN_PROGRESS→CC_COMPLETE og skrifar viðbót við cc-report; result-review saga varðveitt. Jonesy yfirfer aðeins þessa viðbót, ekki opna aftur fyrri samþykkt atriði án nýs raunblocker.

---

# #492 yfirlitslota (læsilegt leiðaryfirlit) — Jonesy result review — 2026-11-24

Yfirfarið: `cc-report.md`, `approved-prompt-v1.md`, `prompt-review.md` (P1–P8 mín), kóðabreytingar í `src/pages/WinterRoute.jsx`, `src/lib/winterRoutePresentation.js` (+ próf), `src/i18n/translations.winterRoute.js`, `src/pages/WinterRouteOverview.test.jsx`, breyttar athuganir í `WinterRoute.test.jsx`, `evidence/` (myndir 01, 03, 04, 05; `stub-s1.json`, `stub-s4.json`), `CURRENT.md`.

## Niðurstaða

**REVISE (þröng lagfæring) — rökfræði, gagnameðhöndlun, i18n og próf eru PASS og afmörkun er rétt (aðeins gagnaskjárinn, legacy/form/identity/race óbreytt). En 360 px útlitið hefur raunverulegan galla sem sést í eigin sönnunarmynd CC: veðurtáknið í stað-dálknum lendir ofan á hitagildinu í sumum röðum og hylur mínusmerkið (-2,2 °C les sem 2,2 °C), og enski dálkahausinn „Temperature“ rennur ofan í „Wind“. CC fullyrðir í skýrslu að þetta skarist ekki; myndin sýnir annað. Það er ekki hægt að kalla 360 px töfluna PASS fyrr en þetta er lagað og mælt. Engin umfangsaukning; kort/EPSG:3057 áfram DEFERRED og #492 ekki lokað.**

## Merking: sandbox vs CC

- **Sandbox (mitt, Linux/Node v22, vitest 4.1.10, jsdom):** próf keyrð á afriti af skránum; stökkbreytingarprófanir; eigin probe-próf; diff á móti stöðu fyrir lotuna; skoðun á myndum 01, 03 (líka stækkað), 04 og 05; lestur á kóða og stub-skrám.
- **CC-fullyrt, ekki endurkeyrt af mér:** Playwright-keyrslan sjálf og að engin beiðni hafi náð til `vercel dev`/veitna (`page.route`), að fixtures séu úr raun-handlerum, að skriptan hafi verið eytt, `git status`, ESLint, `npm run build`, `git diff --check`, `html.dark`-aflestur, að `localStorage`-snið stemmi.
- **Mitt sjónræna mat er takmarkað við galla sem ég sé; ég veiti ekkert sjónrænt PASS.** Ég skoðaði ekki mynd 02 (desktop, 18 raðir).

## Sandbox-staðfesting (óháð)

1. **Próf:** `WinterRoute.test.jsx` **126/126** (með `--testTimeout=60000`, 20 s), `WinterRouteOverview.test.jsx` **9/9**, `winterRoutePresentation.test.js` **24/24** — samtals 159, eins og CC. (Sundurliðun CC „30 = 24 + 6“ er röng, sjá S1.)
2. **Umfang kóðabreytinga staðfest með diff:** `WinterRoute.jsx` breytist aðeins í gagnaskjás-hlutanum (`RoadOverviewSection`, `WinterRoutePointRow`, `WinterRoutePointsTable`, `WinterRouteDataView`) og einum import; `ForecastCard`/`SegmentRow`/`RouteSummary`, form, `GeometryResultView`, request/identity/race-kóði og legacy-flipinn eru óbreytt. `translations.winterRoute.js`: aðeins viðbætur í IS og EN (T3-banned-orðaprófið standast). Breytingar á `WinterRoute.test.jsx` eru **nákvæmlega** þær þrjár sem CC lýsir (tvítekin lokuð kafli, edge-note 2→3, merkimiði `winterRouteDataHourLabel`); engin identity/race/draft-athugun snert.
3. **Prófin eru raunveruleg (stökkbreytingar):** (a) fjarlægja `pointsFeedUnavailableOrStale` úr `roadOverviewIsConfirmedClear` ⇒ 2 próf falla; (b) láta `flaggedRoadSegments` hunsa tilkynningar á passable kafla ⇒ 2 falla; (c) fella edge-note af lyftum röðum ⇒ 1 fellur (núverandi #503-prófið). Allt endurheimt.
4. **Eigin probe (P1 mín):** valinn tími (`HOURS[1]`) **helst** yfir mínútu-tikk og endurrender, **engin** ný `/api/winter-route-data` beiðni, nákvæmlega **ein** `<table>` á svæðinu og grid-fyrirvarinn („Punktspá úr veðurlíkani…“) einu sinni.
5. **Fixtures:** `stub-s1.json` og `stub-s4.json` hafa raunlögun (`geo` með `geometryId`/hnit/slices, `data` með `datasetVersion`, `roadMeta`-flögg, `forecast.window.expectedHours` miðað við keyrslutíma — 20:00/21:00 UTC á keyrsludegi, ekki frosið). `stub-s4` er `roadMeta.available:false` + `forecast.available:false`. Ég sé ekki sjálf handlerinn keyra; það er CC-fullyrt.
6. **Skjáskot (skoðað):** 01 (E↔Sey, desktop IS ljós): „Færð og lokanir“ efst með útkeyrslutíma/cache-aldri, „Engar tilkynningar eða lokanir á leiðinni núna.“, `<details>` „Sjá alla kafla í akstursröð“, „Veður á 3 punktum“, tímaval „Tími veðurspár“ beint yfir töflu, ein tafla, fyrirvarar einu sinni, heimildablokk neðst. 04 (R→Hella, lokun + tilkynning á 360 px): lokaði kaflinn og „Aðgát – tilkynning“ sýnileg fyrir ofan `<details>`. 05 (Selfoss→Hella, ótiltækt á 360 px): „Færðargögn eru ekki tiltæk“, gul viðvörun, „Ekki er hægt að staðfesta að engar tilkynningar séu…“, „Veðurspá er ekki tiltæk“ — enginn falskur „allt í lagi“. 03 (18 punktar, 360 px, EN, dökkt): 5 dálkar innan 360 px án láréttrar skruns í myndinni, **en gallinn að ofan** (sjá P1).

## Bindandi atriði (lagfæring innan lotunnar)

**P1 — 360 px taflan skarast: tákn ofan á hitagildi og dálkahaus ofan á haus.** Á mynd 03 (stækkuð í 1:1 sjást raðirnar „Near Holtavörðuheiði“, „Near Öxnadalsheiði“, „Near Mývatnsöræfi“): `WeatherIcon` í stað-hólfi lendir yfir fyrsta staf hitagildis og **hylur mínusmerkið** (-2,2 / -1,0 / -0,2 °C). Orsök að sjá í kóða: `<th scope="row">` er ~30% í `table-fixed` og inniheldur `flex`-span með merkimiða og `h-5 w-5 shrink-0` tákni; löng óbrjótanleg orð („Holtavörðuheiði“) fara út fyrir hólfið og táknið endar í hitadálkinum. Að auki rennur „Temperature“ (EN haus) ofan í „Wind“, og gust-gildi ≥ 10 m/s brjótast í tvær línur („10.0 / m/s“). Þetta er veðurvarúðarsíða: mínusmerki má aldrei hverfa. **Krafa:** engin skörun texta/tákna á 360 px, IS og EN, við 18 punkta (t.d. tákn í eigin þröngum dálki eða á eftir gildum í stað inni í flex-röð staðarins; `overflow-wrap:anywhere`/`break-words` á staðarheiti; `whitespace-nowrap` á gildi+einingu; styttri haus („Temp.“/„Hitastig“ á þann hátt sem passar) eða minni leturstærð). **Sönnun:** ný 360 px mynd á 18 punkta í EN dökku **og** IS ljósu (núverandi myndir *ekki* yfirskrifaðar), og DOM-mæling skráð í skýrslu: `document.documentElement.scrollWidth ≤ 360`, töfluumbúðir `scrollWidth ≤ clientWidth`, og að `getBoundingClientRect` á tákni/staðartexta skarist ekki við næsta `td` í neinni röð. Bæta við röð með neikvæðu hitagildi og löngu orði í jsdom/DOM-próf eða a.m.k. í mælinguna. Jsdom sýnir ekki útlit; sönnunin er vafrinn.

**P2 — Skýrslan verður að samræmast myndunum.** (a) Fjarlægja/leiðrétta „legible, not overlapping in actual rendering“ um dálka-/staðarraðir — myndin sýnir skörun; (b) cc-report segir að „before/after“ myndir fyrir 360 px yfirflæðisgallann séu varðveittar, en í `evidence/` eru aðeins 5 skrár (01, 02, 03, 04, 05) — engin „before“-mynd; segja það eða skila henni; (c) verdict „PASS … works as specified“ takmarkast við það sem mælt er; PASS á 360 px töflu aðeins eftir P1; (d) 05 heitir „unavailable-stale“ en `stub-s4` sýnir aðeins ótiltækt (ekki stale-ástand) — leiðrétta nafn eða lýsingu (stale er prófað í jsdom/#503, ekki í mynd).

## Athugasemdir (S, ekki bindandi)

**S1 — Prófatölur:** `winterRoutePresentation.test.js` er með 24 próf (15 áður + **9** ný), ekki „24 existing + 6 new = 30“; heildarsumman 159 stemmir. Leiðrétta orðalag.

**S2 — „Reverse“-prófið ofmetur:** fixture-ið í „Selfoss→Rauðavatn north“ er sömu 18 auðkenni í öfugri röð; raunverulega leiðin Selfoss→R north hefur **15** punkta og annað mengi. Prófið sannar að taflan hrærir ekki í röðinni sem hún fær (gagnlegt) en ekki „own real order, not a client-side mirror“. Breyta orðalagi; raun-handler-röð fyrir öfuga leið er ekki prófuð hér.

**S3 — Hvað telst „lyft“:** `flaggedRoadSegments` lyftir ekki kafla sem er `passable` en með `export.isStale` eða `registration.isOld` (samkvæmt kóðanum, ég prófaði ekki); þá getur „Engar tilkynningar eða lokanir…“ birst á meðan kafli segir „gömul gögn“ aðeins inni í lokuðu `<details>`. Ákvörðun Ripley/eiganda: telja „gamalt“ sem óstaðfest eða leyfa núverandi hegðun (setningin segir aðeins um tilkynningar/lokanir). Ekki blokk.

**S4 — Of víð lyfting er örugg en getur lengt yfirlitið:** *hver* tilkynning (líka útrunnin) á passable kafla lyftir kaflanum; á löngum leiðum með mörgum útrunnum tilkynningum getur „stutta“ yfirlitið orðið langt. Samþykkjanlegt í dag; fylgjast með.

**S5 — Hvað vantar í prófin miðað við mínar S3/P1:** ekkert Westfjords-par án `approxDistanceFromStartKm` (engin bil-lína), engin athugun á „—“ fyrir `null` hitagildi (núverandi próf athugar að gamalt gildi hverfi, ekki að strik birtist), enginn mínútu-tikk-test (ég keyrði eigin probe, hann stóðst). Ekki blokk.

**S6 — Fixtures eru bundin við keyrslutíma:** `expectedHours` í `stub-*.json` er miðað við 2026-11-24 ~19:50 UTC; endurspilun síðar sýnir „ekki tiltækt“ (síað á núverandi tíma) og skriptan var eydd, svo myndirnar eru ekki endurskapanlegar nema skrifa skriptuna aftur. Fínt sem sönnunargagn þessarar lotu; skrá það.

**S7 — NOT_TESTED (CC skráir): ** raunverulegur 200% zoom (eigandaskref gefið: R→Selfoss langa leiðin, Ctrl/Cmd + þrisvar, ath. töflu og færðarkafla — sem gagnast sérstaklega eftir P1), skjálesari, lyklaborð/`<details>` í raunvafra (aðeins jsdom). Engin 360 px DOM-mæling hefur verið skráð í þessari lotu; það er það sem P1 bætir við.

## Mörk þessarar yfirferðar

- Engin vafrakeyrsla, net-köll, Windows, ESLint, build eða `git`; ég sá ekki `git status` og las hvorki GitHub né #492. Sjónræna matið er mitt á fjórum myndum (ekki 02) og einni stækkun.
- „Engin skörun“ í P1 er mitt sjónmat á 1:1 stækkun, ekki DOM-mæling; CC mælir.
- Ég breytti engum kóða í repo; stökkbreytingar og probe voru á afritum í mínu umhverfi.
- Engin umferð 2 nema eigandi biðji.

**Næsta:** Ripley metur REVISE og P1–P2 (þröng CSS-/skýrslulagfæring, ekkert annað í umfangi) og ákveður hvort CC fær eina þrönga viðbótarkeyrslu; eigandi ákveður hvort S3 breyti því hvað er „staðfest“. Eftir P1: ný 360 px mynd + mæling, svo er hægt að merkja töfluhlutann PASS. Commit/push, GitHub og #492-lokun áfram eiganda; kortið er áfram DEFERRED.

## Ripley — lokamat fyrstu afhendingar, 2026-11-24

REVISE: sýndur 360px læsileikagalli hylur hitagildi/mínusmerki. Sjálf skoðaði ég mynd03 og staðfesti skörun; óháð overview+presentation próf 33/33. Aðrar prófatölur og lint/build frá CC/Jonesy, ekki endurkeyrð hér. Enginn app-fix eða veitukall hjá mér. Þröng CSS/markup+vaframæling+skýrslulagfæring til prompt-review umferðar2; engin aukin vara/þekja. CURRENT PROMPT_REVIEW meðan ný framkvæmdarheimild bíður samþykkis; ekki READY_FOR_CC með gamla v1, sem er þegar framkvæmt og óbreytt. S3 um kafla-stale varðveitt sem takmörkun, ekki sjálfvirkt aukaverk í CSS-lotu. #492 í heild áfram ólokið, kort DEFERRED.


---

## Jonesy — viðbót umferð 2 (lagfæring á 360 px skörun) — 2026-11-24

Yfirfarið: `cc-report.md` (viðbót „umferð 2: laga 360px skörun“), `approved-prompt-v2.md` (P1–P5), `evidence/mobile-fix/` (`baseline-measurements.json`, `after-measurements.json`, `after-fixture.json`, myndir `after-is-light-360`, `after-en-dark-360`, `baseline-is-light-360`), `WinterRoute.jsx` (`WinterRoutePointRow`, `WinterRoutePointsTable`), `WinterRouteOverview.test.jsx`, `translations.winterRoute.js`, `CURRENT.md`.

### Niðurstaða

**PASS á lagfæringunni sjálfri: skörunin er horfin á báðum samþykktarsamsetningum (IS ljóst, EN dökkt, 360 px), bæði mæld (núll skörun/yfirflæði/brot) og sýnileg á myndum — mínusmerki sjást, engin haus-árekstur, ekkert brot í gildi+einingu — og skýrslan leiðréttir öll röng atriði úr fyrstu afhendingu. Lotan er hins vegar ekki fullkláruð: tvö atriði sem approved-prompt-v2 krafðist vantar (P1: mælingarskriptan var eydd í stað þess að vera vistuð; P2: engin desktop-staðfesting þótt taflan hafi nú tvo dálka á öllum breiddum). Auk þess er ný próf-athugun marklaus og ein breytt athugun veikari en skýrslan segir (P3). Ég tel þetta þrjú þröng skjala-/próf-atriði, ekki nýja útlitslotu; Ripley getur staðfest þau með skráalista og keyrslu, ekki þriðju review-umferð.**

### Merking: sandbox vs CC

- **Sandbox (mitt, Linux/Node v22, vitest 4.1.10, jsdom):** `WinterRouteOverview.test.jsx` + `winterRoutePresentation.test.js` + `WinterRoute.test.jsx` keyrð saman með `--testTimeout=60000`; tvær stökkbreytingar; lestur á kóða, prófum, i18n og mælinga-JSON (baseline/after); skoðun á eftir-myndum (IS ljóst 360, EN dökkt 360, 1:1 útskurður á töfluna).
- **CC-fullyrt, ekki endurkeyrt af mér:** vafrakeyrslan og mælingarskriptan (hún er ekki til — sjá P1), `fonts.ready`-aflestur, fixture-gerð úr raun-resolvernum, ESLint, `npm run build`, `git diff --check`, `git status`, að engin veituköll hafi átt sér stað.
- **Sjónrænt:** ég sá skörunina horfna á tveimur eftir-myndum; ekkert sjónrænt PASS á útliti í heild. Ég skoðaði ekki 320 px-myndina né `baseline-en-dark-360`/`baseline-is-light-320`.

### Sandbox-staðfesting (óháð)

1. **Próf:** **160/160** (10 + 24 + 126), eins og CC.
2. **Mælingar-JSON samræmist skýrslunni:** *baseline* (ólagfærður kóði, sama fixture) á IS/360: 3 skörun, 4 út-úr-hólfi, 15 yfirfljótandi, 12 gildisbrot, lágmarksslaki −46 px; EN/360: 3 skörun (þ.m.t. „Temperature“↔„Wind“ og „Kirkjubæjarklaustur“↔„−12,5 °C“), −51 px. *After*: 38 hólf mæld (2 haus + 18 × 2), 0/0/0/0 á IS/360 og EN/360, `documentScrollWidth` = 360, `wrapperScrollWidth` = `wrapperClientWidth` = 302; fonts „loaded“ (`Inter`), DPR 1. P3 mín (mælingin finnur gallann á ólagfærðum kóða) er því uppfyllt og skýrsluliðurinn „P3 baseline“ stenst.
3. **Fixture er versta-tilfelli veturs (P1 mín):** 18 punktar með raun-`labelIs`/`labelEn`; Kirkjubæjarklaustur-röðin: −12,5 °C, vindur 18,0, gust 28,4 m/s, úrkoma 12,0 mm; Holtavörðuheiði −9,5 °C/21,5 m/s; Öxnadalsheiði −8,0 °C/19,0 m/s; tímar reiknaðir miðað við keyrslu (`2026-11-24T21:00`…).
4. **Eftir-myndir:** á IS/360 og EN/360 eru allar 18 raðir með nafni og tákn á sinni línu, fjögur gildi í 2×2-neti í breiðum dálki; „−9,5 °C“, „−12,5 °C“ og öll mínusmerki sjást; engin skörun, engin brot. Hausinn er „Staður | Veður“ / „Place | Weather“.
5. **Kóði:** breytingin er í `WinterRoutePointRow`/`WinterRoutePointsTable` + i18n-lyklar og eina prófaskrá; legacy, form, identity/race/draft og `ForecastCard` ósnert (diff á móti stöðu eftir fyrstu afhendingu: breytt eru `WinterRoutePointRow`, `WinterRoutePointsTable` og ein klassalína á ytri gagnaskjás-umbúðum — sjá S6). Ein DOM-framsetning (ein `<table>`, tvær `th`; ein `<tr>` á punkt) — 19 raða athuganirnar í overview-prófunum standa því óbreyttar.

### Bindandi atriði (loka lotunni)

**P1 — Mælingarskriptan á að vera í `evidence/mobile-fix/`.** `approved-prompt-v2.md` segir orðrétt „vista mælingarskriptu og JSON og nýjar IS/EN myndir í evidence/mobile-fix/“ (og P3 mín: „Skriptan … vistuð í `evidence/mobile-fix/`“). CC eyddi henni og útskýrir það með „ekki nýtt almennt prófakerfi“ — sú setning í umferð 2 Ripley átti við að byggja *ekki* kerfi, ekki að eyða skriptunni („Vista litla task-local mælingarskriptu … svo þessi eina regression sé endurprófanleg“). Afleiðing: engin leið að endurprófa, sannreyna hvernig „gildisbrot“ er mælt núna þegar hvert gildi er `dd` í eigin línu (aðferð við mælingu á „multiLineValueCellCount“ hefur breyst frá 5 dálka töflu í 2), og enginn varanlegur vörn gegn endurkomu. **Krafa:** skrifa skriptuna aftur, vista, keyra einu sinni á núverandi kóða og skrá að niðurstaðan jafngildi `after-measurements.json` (sömu 38 hólf, núll), og skrá þar hvernig brot á gildi+einingu er mælt (per `dd`).

**P2 — Ein desktop-staðfesting eftir breytinguna.** Taflan er núna tveggja dálka á *öllum* breiddum (`table-fixed`, `w-[38%]` + breiður „Veður“-dálkur með `grid-cols-2`). Á 1280 px þýðir það stað-dálk ≈ 370 px og fjögur gildi í 2×2-neti yfir ≈ 600 px; það er læsilegt í grundvallaratriðum en hefur ekki verið skoðað og er verulega ólíkt 5 dálka töflunni sem ég skoðaði í fyrri umferð (mynd 01). approved-prompt-v2 segir „Desktop-tafla áfram læsileg“ og Ripley „ein desktop staðfesting nægir“. **Krafa:** ein ný desktop-mynd (1280 px, IS ljóst, 18 punkta fixture) + sama DOM-mæling (hólf innan marka, engin skörun) í `evidence/mobile-fix/`, og í skýrslu hvort 2×2 á breiðum skjá er ásættanlegt eða hvort `sm:grid-cols-4` (CSS einungis, sama DOM) sé valið. Ekkert af þessu opnar aftur 360 px-niðurstöðuna.

**P3 — Prófin verja ekki lagfæringuna og ein athugun var veikt.** (a) Nýja prófið „each value+unit stays on a single line“ athugar að `dd`-texti innihaldi ekki `\s{2,}|\n` — jsdom hefur enga útlitsvinnslu, svo þetta getur ekki fallið vegna línubrots; nafnið „jsdom proxy for the real DOM measurement“ ofmetur það. (b) Athugunin „column headers…“ var breytt úr `getByRole("columnheader", { name: "Hviður" })` í `getAllByText("Hviður", { exact: false }).length > 0`, sem passar líka á *neðanmálsgrein* („Hviður eru hámark síðustu klukkustundar…“) — hún sannar því ekki lengur að merkin séu við gildin. **Stökkbreyting:** ég tæmdi `<dt>` (öll metric-merki hvers gildis) — **öll 10 overview-prófin standast áfram**; ég fjarlægði `whitespace-nowrap` af `dd` — **126+10 standast áfram**. CC segir í skýrslu að athugunin hafi verið uppfærð „ekki veikt“ — það stenst ekki. **Krafa:** (i) skipta (b) út fyrir athugun sem fellur við brottfall merkis: t.d. í fyrstu röð eru fjögur `dt` með texta lyklanna `winterRouteTableColumnTemp/Wind/Gust/Precip` og hvert `dt` hefur systur `dd` með væntu gildi (hvort tveggja uppbyggingarathugun, ekki className); (ii) fjarlægja (a) eða endurnefna sem staðfestingu á `dd`-byggingu (ekki línubrot) — raunvörnin gegn línubroti er mælingarskriptan (P1).

### Athugasemdir (S, ekki bindandi)

**S1 — Leturstærð niður:** töflutexti er `text-[11px]` á síma (var `text-xs` = 12 px) og hausar `text-[10px]`. Þetta er afleiðing af leitinni að slaka og er ekki nefnt í skýrslu. Læsilegt á myndum, en gildin eru nú minnsti texti í viðmótinu; eigandi metur á raunsíma og getur beðið um 12 px ef slakinn leyfir (IS/360 slakinn er 3,9 px).

**S2 — P4-slaki:** IS/360 mælist 3,9 px (markmið ≥ 4 px), EN/360 7,8 px, IS/320 0,9 px (upplýsingar). CC skráir það hreinskilnislega; 0,1 px frá markmiði er ekki efni til endurtekinnar lotu. Lýsingin „nokkrar stillingar prófaðar (22→40 %, leturstærð, gap)“ er þó ósönnuð — engin mæling þessara tilrauna er varðveitt; væri nóg að skrá hana sem „reynt, ekki varðveitt“.

**S3 — Zoom-eigandaskrefið** (R→Selfoss langa leiðin, Ctrl/Cmd + þrisvar) er í fyrri hluta skýrslunnar en ekki í viðbótinni; endurtaka orðrétt þar því 200% zoom á tveggja dálka töflu er nú einmitt þröngt tilvik. Raunzoom, skjálesari og lyklaborð/`<details>` í raunvafra eru áfram NOT_TESTED.

**S4 — Aðgengi:** `dl` með `display:inline` `dt`/`dd` í `td` er löglegt HTML en lesið þannig að skjálesari les „Hiti −3,0 °C“ sem eina einingu aðeins ef merkingin helst; ég prófaði það ekki; tvö `th scope="col"` („Staður/Veður“) merkja ekki lengur einstaka mælikvarða, sem er í lagi svo lengi sem hvert gildi ber eigið merki (P3 (b) tryggir það).

**S6 — Ótilkynnt breyting:** ytri umbúðir gagnaskjásins (`data-testid="winter-route-data"`) fengu `px-4` → `px-3 … sm:px-4`, sem gefur 8 px meiri breidd á síma (töfluumbúðir 294 → 302 px í mælingunum) en er hvergi nefnt í skýrslunni; hún nýtist öllu gagnaskjásinu (færðarkafli, athugasemdir), ekki aðeins töflunni. Skrá í skýrslu; ekki blokk.

**S5 — Óbreytt:** S3 úr fyrri umferð (kafla-stale/old), reverse-fixture-orðalag og mynd 05 voru leiðrétt rétt í viðbótinni.

### Mörk þessarar yfirferðar

- Engin vafrakeyrsla, DOM-mæling, net, Windows, ESLint, build eða `git`; ég las ekki #492. „Engin skörun“ byggir á mælingaskrá CC (skriptan er ekki til) og mínu sjónmati á tveimur myndum.
- Stökkbreytingar voru gerðar á afritum í mínu umhverfi; ég breytti engu í repo.
- Engin umferð 3 nema eigandi biðji; P1–P3 hér eru lokaatriði þessarar lotu, ekki ný review-umferð.

**Næsta:** Ripley metur niðurstöðuna og biður CC um P1–P3 (skripta + desktop-mynd/mæling + traustari prófaathuganir; annað óbreytt) eða skráir þau sem þekkt takmörkun ef eigandi vill; eigandi ákveður hvort 11 px sé ásættanlegt og framkvæmir zoom-skrefið; commit/push, GitHub og #492-lokun eru eiganda; kortið er áfram DEFERRED og #492 í heild ólokið.

## Ripley — lokamat umferðar 2, 2026-11-24

PASS á 360px-skörunarviðgerðinni sjálfri; BLOCKED á lokaafhendingu yfirlitslotu meðan eigandi velur hvernig ljúka skuli eftirstöðvum. Óháð overview+presentation keyrsla 34/34 með --testTimeout=60000. Skoðaði after-is-light-360.png: mínusmerki sýnileg og fyrri tákn/hita-skörun horfin. Aðrar160prófatölur/mælingar frá CC/Jonesy, ekki ný lifandi vaframæling mín.

Staðfest með skráalista að mælingarskriptan vantar og engin ný desktop-sönnun fylgir tveggja dálka útlitinu. Eftirstöðvar P1–P3 Jonesy eru skýrar: varðveita og keyra litlu mælingarskriptuna á núverandi kóða; ein desktop1280mynd/mæling; próf sem tengir hvert metric-merki við gildi, fjarlægja ósanna jsdom-línubrotclaim. Engin ný útlits-/þekju-/API-lota nauðsynleg. IS360slaki3,9px fremur en4 er skráð frávik, ekki sýndur notkunargalli og ekki ástæða til annarrar CSS-umferðar.

Sjálfvirkur review-hringur stöðvaður samkvæmt README áður en þriðja umferð hefst. Ekki búið til nýtt prompt né framkvæmdarheimild. Eigandi fær stutt val: ljúka þessum þremur afmörkuðu lokaatriðum án nýrrar hönnunar eða samþykkja afhendingu með skráðum prófunargötum. Fyrri runtime-viðgerð stendur. Kort/#492heild og #493landsþekja enn ólokið. Engin veituköll/app-breyting/commit/push/GitHub-write hjá Ripley.


---

## Jonesy — viðbót umferð 3 (UX-forgangslota, sex kröfur) — 2026-11-25

Yfirfarið: `cc-report.md` (viðbót „round 3“), `approved-prompt-v3.md` (P1–P9), `ux-priority-source.md`, `evidence/ux-priority/` (`results.json` og myndir 00–05), `WinterRoute.jsx` (`PlaceField`, `RoadOverviewSection`, `FlaggedSegmentChip`, `WinterRoutePointRow`/`Table`, `WinterRouteDataView`, form-hluti), `winterRoutePresentation.js`, `translations.winterRoute.js` og prófin þrjú.

### Niðurstaða

**Ekki PASS á lotunni í heild. Kóði og próf eru græn (188/188 endurkeyrt hjá mér), og fjórar kröfur virðast uppfylltar í kóða (3 tafla, 4 heitahjálpari, 5 tímar, 6 via) auk kjarna combobox. En tvær kröfur eigandans eru ekki uppfylltar eins og þær voru skrifaðar og CC fullyrðir „Done and verified“ fyrir þær: (a) krafa 2 — „þétt færðarsamantekt“: eigin mynd CC (01, 1280 px) sýnir um 55+ flögg-spjöld (hvert með „Úreltur útflutningur“ + „Greiðfært“) undir „Færð og lokanir“ og vefsíðan er 5 411 px (1280) / 9 533 px (360) há með veðurtöfluna langt niðri; (b) krafa 1 — víxla-hnappurinn er óbreyttur (neðst við hlið „Sýna leið“, heiti „Víxla Frá og Til“), ekki milli reita og ekki með heitið „Víxla upphafsstað og áfangastað“. Þar að auki: Enter með óstaðfestan texta sendir form, mælingarskriptan var aftur eydd, og tvær af mínum stökkbreytingum lifa af.** Ekkert af þessu kallar á nýja hönnun — sjá R1–R6.

### Merking: sandbox vs CC

*Sandbox (mitt, Linux/vitest 4.1.10 + jsdom):* `winterRoutePresentation.test.js` 38 + `WinterRouteOverview.test.jsx` 19 + `WinterRoute.test.jsx` 131 = **188/188** með `--testTimeout=60000` (stemmir við CC); kóðalestur; fjórar stökkbreytingar á afriti (aftur sett, `diff` staðfest hreint); jsdom-könnun á Enter/swap; myndalestur (stærðir úr PNG). *CC-fullyrt, ég endurkeyrði ekki:* full 243/3 940 keyrsla, `lint`, `build`, `git diff --check`, vafrakeyrsla og mæling (skriptan er eydd), sönnun þess að `git status` sýni aðeins skráð skjöl.

### Sandbox-staðfesting (óháð)

- **Stökkbreytingar á prófunum (afrit, ekki repo):** (M1) víxla `labelKey` vind↔hviða í töflulínu ⇒ **19/19 standast** — „mutation-provable label/value“ prófið tengir gildi við **stöðu í röðinni**, ekki við merkimiðann; (M2) víxla gildum vind↔hviða ⇒ fellur (gott); (M3) fjarlægja fókus-`useEffect` ⇒ fellur (gott); (M4) telja tilkynningar í stað kafla ⇒ **19/19 standast** — fixture hefur engan kafla með tveimur tilkynningum, svo P3(i) („kaflar, ekki tilkynningar“) er ósannað.
- **Enter (P2/v3-lína 13):** `handleKeyDown` kallar `preventDefault` aðeins þegar listi er opinn **og** merkt tilboð er til. Könnun: slá „xyzzy“ (engin samsvörun), `keyDown Enter` ⇒ `defaultPrevented === false`, reitur sýnir „xyzzy“, staðfest ID er enn `reykjavik-raudavatn`. Í vafra framkallar það form-sendingu með gömlu ID á meðan sýnilegur texti er annar — beint gegn „Enter í reit hindrar form-submit; submit má ekki senda ósamræmd query/ID“. (jsdom framkvæmir ekki implicit submission; þetta er ályktun af `defaultPrevented`, ekki vafrakeyrsla.) Ekkert próf nær þessu.
- **Listi og lyklaborð:** `max-h-60` listi (11 staðir, ≈ 6–7 sýnilegir) og **engin** `scrollIntoView` á virka tilboðið; ↓ yfir sýnileg mörk færir `aria-activedescendant` utan sjónsviðs (ekki mælt í vafra).
- **Swap:** `aria-label="Víxla Frá og Til"` / „Swap From and To“; hnappurinn er í sömu línu og „Sýna leið“ (form-uppbygging óbreytt), ekki milli reita. `ux-priority-source.md` lína 15 og gátlisti 65 krefjast annars.
- **Færðarsamantekt:** `flaggedRoadSegments` merkir nú líka „greiðfæran“ kafla með `isStale`/`isOld` og `staleOldUniformity` einfaldar aðeins þegar **allir** merktir kaflar eru eingöngu stale/old. Um leið og einn kafli hefur tilkynningu/lokun (mynd 01: „Aðgát – tilkynning“) fær **hver** kafli spjald með eigin merkjum. `isStale` er >30 mín frá útflutningi, svo í raun gerist þetta hvenær sem vegagögn tefjast — nákvæmlega sú hávaðahætta sem ég skráði í umferð-3 P3(iv) („ef aðeins sumir, nefna þá“ gerir ráð fyrir fáum).
- **Tafla/tákn:** ein DOM-gerð (`role="table|row|columnheader|cell"`, `div`-ar, `md:grid` með `WR_GRID`), engin `matchMedia`; tákn `aria-hidden` + sýnilegur texti; hver mælikvarði eigin `cell`; `null` ⇒ „—“; óaðgengilegur punktur heldur röð. Stærð tákns 24 px (`h-6 w-6`) án mælingar. Neðanmálsgreinar (`<p>`) eru innan `role="table"` (ARIA-formlega ekki leyfð börn; S4).
- **Tímar/via/heiti:** valinn spátími (hour-select) kemur fyrst; „Færð: Vegagerðin keyrði gögnin út {tími}“ úr elsta gilda `dagsKeyrtUt` (sjá S2), „óþekktur“ ef vantar; `generatedAt` aðeins í „Um gögnin“ sem „Svar útbúið“; heitahjálpari strippar eingöngu forskeytið (Vestfjarðaformið `X — leiðarpunktur` óbreytt) og er aðeins notaður í choose-íhlutum; via-línan er ennþá `winterRouteDisplayVia` (óbreytt frá fyrri lotu).
- **Myndir (aðeins staðreyndalestur, ekkert sjónrænt PASS):** mynd 03 („road summary closed“, 360×800) sýnir **efst á síðunni** (titill, form, valkostir) og enga færðarsamantekt; mynd 05 er 4 punkta grunnlína, ekki „mobile 360 IS ljóst með closure/stale og lokaðan/opinn lista“; mynd 04 sýnir spjöld **og** opnaðan lista þar sem sama stale-texta er endurtekin í hverri línu. Fixture-ið skilaði „ekki staðfest“-stöðu, svo talningarlínan („N kaflar með tilkynningum“) sést hvergi í vafra, aðeins í jsdom.
- **Mæling í `results.json`:** neikvæð viðmiðun (90 brot) er raunveruleg og gott; en mælingin var aðeins `scrollWidth > clientWidth` á gildis-spönnum + lárétt síðuskrun. Ekkert `Range`-í-hólfi, engin skörun, engin `getClientRects`, enginn ≥ 4 px slaki, ekkert `font-family`/`fonts.ready` skráð í JSON, enginn 320 px, og engin fjöldi mældra hólfa — þrátt fyrir P9(ii) og P3/P4 úr umferð 2.

### Bindandi atriði (þröng lokalota, engin ný hönnun)

**R1 — Færðarsamantekt má ekki verða 55 spjöld.** Spjöld í aðalsýn aðeins fyrir kafla með **lokun/óaðgengileg gögn/tilkynningu**; kaflar sem eru eingöngu stale/old fara í **eina** línu með fjölda („N kaflar með gömul/úrelt gögn“) og per-kafla merki aðeins í ítarlista. Þak á fjölda spjalda ef þörf (t.d. „+ N fleiri“ sem opnar listann). Próf: fixture með 1 tilkynningu + ≥ 50 stale-only köflum ⇒ aðeins 1 spjald + ein stale-lína. Ný mynd (ein, 1280 IS) með mældri síðuhæð fyrir og eftir (nú 5 411 px).

**R2 — Swap samkvæmt heimild.** Hnappur milli reita á desktop og á skýrum stað á síma; aðgengisheiti „Víxla upphafsstað og áfangastað“ (EN jafngilt) úr i18n; prófin sem leita að `Víxla Frá og Til` uppfærð með ástæðu.

**R3 — Enter og lyklaborð.** `preventDefault` á Enter í reit þegar listi er opinn (eða þegar `query` ≠ staðfest heiti) án merkts tilboðs; próf: `keyDown Enter` á „xyzzy“ gefur `defaultPrevented` og ekkert fetch. `scrollIntoView({ block: "nearest" })` á virkt tilboð (próf með stubbaðri aðferð eða eigin athugun í vafra).

**R4 — Sönnun sem hægt er að endurtaka.** Vista eina mælingarskriptu í `evidence/ux-priority/` (P9(i) og lærdómur umferða 1–2: þetta er **þriðja** skiptið sem hún er eydd; „úrelt“-rökin um umferð-2 P1 breyta því ekki að nýju skriptan er nú sú sem vantar). Bæta við því sem P9(ii) krafðist eða skrá „ekki gert“: `Range` innan hólfs, skörun, ≥ 4 px slaki, `fonts.ready` + `font-family`, 320 px (upplýsingar), fjöldi mældra hólfa. Skipta út mynd 03 (rétt klipping á lokaðri samantekt) og bæta við IS ljós 360 með closure/stale og **staðfestu** ástandi þar sem talningarlínan sést.

**R5 — Prófin þurfa að geta fallið.** (a) hverjum töflureit bætt athugun á **sínu** merki (`within(cell)` á merkimiða), svo M1 falli; (b) fixture með kafla með 2 tilkynningum þannig að talan sé 1 en ekki 2 (M4); (c) prófið „each value+unit stays on a single line (jsdom proxy …)“ enn óbreytt og getur ekki fallið — fjarlægja/endurnefna (eldra lokaatriði, CC viðurkennir það sjálft). Ég hef ekki sannreynt að via-próf nái öllum þremur formum (efsta stig, aðeins valkostur, ekkert).

**R6 — Skýrsla.** Leiðrétta kröfu-töfluna (krafa 4 og 5 eru blönduð saman; tímakrafan — export-tími í aðalsýn, `generatedAt` í „Um gögnin“ — er ekki nefnd sem krafa 5); fjarlægja „Done and verified“ fyrir kröfur 1–2 þar til R1–R3 eru unnin; skrá ákvörðun um bil-setninguna („milli Nærri A og Nærri B“ — P5 bað um skráða ákvörðun) og að „elsta“ útgáfutíminn sé nafngreindur ef kaflar eru ólíkir (S2).

### Athugasemdir (S, ekki bindandi)

**S1 —** Mynd 04 sýnir „Outdated export“ í spjaldi og „This status export may be outdated.“ í sömu röð listans — endurtekin sama staða tvisvar (leysist að mestu með R1).
**S2 —** „Vegagerðin keyrði gögnin út {tími}“ er elsta tímastimpil án þess að segja „elsta“; í reynd sama feed, en ef tímar eru ólíkir er fullyrðingin of nákvæm.
**S3 —** Síað ástand (`noticesOnly`) helst eftir að notandi lokar og opnar `<details>` með örinni; „Sjá alla kafla“ endurstillir. Fókus fer aðeins á `summary` þegar `detailsOpen` breytist — ef listinn er þegar opinn og notandi ýtir á „Sjá tilkynningar“ færist fókus ekki (ég prófaði ekki í vafra).
**S4 —** `<p>` neðanmálsgreinar inni í `role="table"`; hviðu-/úrkomutímabil nú aðeins í einni neðanmálsgrein, ekki á hvert gildi (heimildin: „sýnilegt og tengt gildum“).
**S5 —** Tákn 24 px án mælingar; „stærra samræmt“ er ósannað nema með mynd.
**S6 —** Raunþysjun 200% (R→Selfoss langa leiðin, Ctrl/Cmd + að 200%) og skjálesaraprófun: NOT_TESTED, áfram eigandaskref; gátlistaatriðið „Staðfesta 200% þysjun“ helst opið.

### Mörk þessarar yfirferðar

- Engin vafrakeyrsla, DOM-mæling, Windows, ESLint, build, `git`, GitHub; ég las ekki lifandi #492. Myndir lesnar til staðreynda (hvað er á þeim, PNG-stærðir) — **ekkert sjónrænt PASS**, eigandi skoðar síðurnar.
- Enter-niðurstaðan byggir á `defaultPrevented` í jsdom, ekki á raunvafra; „55+ spjöld“ er talið af mynd, ekki úr DOM; skriptur CC eru eyddar svo ég gat ekki endurkeyrt vafra-mælingu.
- Stökkbreytingarnar voru gerðar á afriti í sandbox og aftur settar (`diff` hreint); ég breytti engu í repo.

**Næsta:** Ripley metur og velur: R1–R3 eru notendasýnilegir gallar á skýrum kröfum eigandans og R4–R6 sönnun/skýrsla — þröng lokalota, eða skrá sem takmörkun. Ekki frekari umferð nema eigandi biðji; commit/push/GitHub/#492-lokun eiganda; kort/landsþekja DEFERRED.

## Ripley — lokamat UX-forgangslotu, 2026-11-25

BLOCKED á lokaafhendingu; ekki PASS á öllum sex kröfum. Óháð overview+presentation keyrsla 57/57 með --testTimeout=60000. Prófin eru græn en sanna ekki kröfufyllingu: las Enter-handler (preventDefault aðeins þegar virk tillaga til), form (swap enn við submit fremur en milli reita) og samantekt (stale-sameining aðeins ef öll flagged atriði eru stale-only). Skráalisti staðfestir að ný mælingarskripta var ekki varðveitt. Þetta styður R1–R4 Jonesy; 188/fullsuite/lint/build/vaframæling frá CC/Jonesy, ekki ný athugun mín.

Raunverulegir afhendingargallar: samantekt getur enn orðið tugir stale-korta og ýtt veðri langt niður; swap-kröfu ekki fylgt; Enter án tillögu er ekki varið gegn óstaðfestu query/ID ósamræmi. Tenging metric-merkis við gildi og talning kafla með mörgum notices þarf focused prófasönnun samkvæmt R5; R6 leiðréttingar eru réttmætar. Engin ástæða að endurhanna veðurtöflu, stækka kort/þekju eða enduropna fjórar kröfur sem þegar virka í kóða.

STOP sjálfvirks review-hrings: eigandi heimilaði sexkröfulotuna fyrst, ekki ótakmarkaðar framhaldslotur. Nú fær eigandi stutta stöðu og tillögu um eina afmarkaða lokaviðgerð R1–R3 ásamt nauðsynlegum prófum/varðveittri sönnun og heiðarlegri skýrslu R4–R6. Ekkert nýtt prompt eða framkvæmdarheimild fyrr en eigandi velur framhald. CURRENT BLOCKED. Engin app-breyting/veituköll/commit/push/deploy/GitHub-write hér. #492 ekki lokað; kort áfram ólokið, landsþekja #493 sérverk.

## Ripley — lokun fyrri keyrslu sem afhendingar, ný eigandaforgangsröðun 2026-11-25

Fyrri CC-keyrsla lokið og lokamat hennar varðveitt: BLOCKED/ekki PASS á sexkröfulotu; R1–R6 standa óleyst. Eigandi bað um að varðveita niðurstöðuna og undirbúa tímasleða næst. Engin runtime-viðgerð gerð og engin græn niðurstaða fundin upp. Fyrri execution er ekki lengur virk; næsta prompt-review í time-slider/ undir SAMA ticket-492. #492 ekki lokað og fyrri eftirstöðvar/kort ekki felld niður. Þetta er ný lotuforgangsröðun eiganda, ekki nýtt samhliða task. Engin commit/push/GitHubwrite.

# #503 — Heimildir og tímaupplýsingar í Velja staði

## Ripley initial prompt — umferð 1 — 2026-11-24

Eigandi heimilar stutt prompt til að klára sýnilega heimilda-/tímabirtingu. Fyrri ring-completion er PASS/CLOSED. Þetta er prompt-review; CC bíður approved prompt og CURRENT READY_FOR_CC + eiganda „Prompt approved“.

## Minnsta MVP

Í núverandi `WinterRouteDataView` sýna heimildir og tímaupplýsingar fyrir nýja Frá/Til-flæðið, öll 25 studdu pörin með sama component. Engin ný API-beiðni, bakendareitur, cachebreyting eða endurhönnun. Fyrirliggjandi stale/unknown/error og gömlu föstu leiðirnar halda sinni hegðun.

Lesa AGENTS/CLAUDE, docs/ai/README/CURRENT, ticket-503/closure-assessment.md, síðasta ring-completion result-review, WinterRoute.jsx, translations.winterRoute.js, winter-route-data.js/buildForecastPayload og cache.js read-only. Ef rauncontract víkur frá lýsingu hér skal skrá það áður en skrifað er; ekki byggja nýja þjónustu.

### Það sem kóðinn staðfestir nú

- `generatedAt` er `now` sett áður en road/forecast fetch er awaitað í handler. Þetta er **server-tímastimpill gagnasvars**, ekki upstream-útgáfutími og ekki tryggður nákvæmur sóknartími.
- `roadMeta.cacheAgeMs` og `forecast.cacheAgeMs` koma úr cache.js: aldur við cache-athugun/endurheimt; ferskt upstream-svar gefur0, warm/stale gefur liðinn tíma frá geymdri færslu. Það eru tveir óháðir gagnahlutar.
- `roadMeta.available` getur verið true með aðeins hluta feeda í lagi; segmentsAvailable/pointsAvailable og pointsFeedUnavailableOrStale sýna takmörkin. Ekki kalla hlutann ferskan/góðan vegna available einnar sér.
- Forecast unavailable hefur ekki endilega cacheAgeMs. `??0` má ekki breyta vantar-gögnum í staðfest0mín.
- Núverandi `winterRouteAcquiredAt` segir „Færðargögn sótt“ og er **ekki réttur lykill fyrir generatedAt** í nýja flæðinu. Ekki breyta gamla lykli/legacy í þessari lotu.

## Birting / merking

1. Neðst í nýju gagnasýninni, utan live-status, bæta litlum textablokk í núverandi stíl. Endurnýta `winterRouteAttributionRoadLine` (Vegagerðin, CC BY4.0), `winterRouteAttributionWeatherLine` (Open-Meteo). Endurnýta núverandi official-source link labels/URL frá legacy ef auðvelt; engin ný netleit/provider. Heimildir birtast einnig þegar annar gagnahluti er unavailable, því þær lýsa gagnauppruna, ekki staðfesta sóknarárangur.
2. **Tímastimpill svars: {time} UTC** (IS/EN nýr narrowly scoped lykill), nota fyrirliggjandi UTC-formatTimestamp ef það ræður gildi. Ekki segja „gögn nýsótt kl...“ eða upstreamgeneratedtime. Valinn spátími er áfram sérstakur og óbreyttur.
3. **Færð: aldur gagna í skyndiminni við afgreiðslu svars um {minutes} mín.** og samsvarandi fyrir veður, aðskilið. Textinn segir skýrt viðmið svarsins, ekki lifandi aldur veðursins núna og ekki aldur forecast-model eða gildistíma. Aldur byggður á raunfinite nonnegative cacheAgeMs og réttu available flaggi; birta ekki jákvæðan0þegar vantar. Velja einfalda heiðarlega mínútnabirtingu: við0–<60sek „innan við mínútu“ eða≈0mín, ekki falskt nákvæmt timestamp. Gildi sýnt sem cache-aldur, ekki merki um góð ferðaskilyrði.
4. Ógildur/vantar generatedAt eða cacheAgeMs => skýrt „tími/aldur ekki tiltækur“ eða sleppa aðeins þeirri tölulínu; heimildir haldast. Unavailable hlutinn segir ekki nýsótt/0mín, núverandi unavailabletexti stendur. Stale-bann og ambermerking standa; ekki fella niður úrslit til að „einfalda“ tímablokk.
5. IS/EN lyklar, engin hardcodedUIcopy, ekki ETA/arrival/departure/koma/brottför. Tímaval heldur fókus og kallar ekki á fetch; ný blokk hvorki live-announce öll kort né sýnir data annars pars. Ekkert floating tooltip/framework.

**Nákvæmur fetchedAt frá upstream/cache er utan þessarar lotu.** Ekki draga hann fram sem `generatedAt-cacheAgeMs` og kalla staðfestan sóknartíma (serverstamp er tekinn fyrir fetch). Núverandi source timestamp + cache age fullnægir þessu litla MVP ef orðalagið greinir þetta skýrt. Ef Jonesy telur criterion6 krefjast nákvæmari tímareits skal sýna konkret hvers vegna; ekki gera óþarfa backendvinnu sjálfkrafa.

## Markviss próf og skil

- Component-próf: fresh0 og warm ólík road/forecast cacheage; stale með eldri aldri; einn unavailable; bæðiunavailable; vantar/ógildur/neikvæður tími/aldur. Þurfa ekki allar permutations eða próf sem aðeins hermir formatter; sanna að rangur gagnahluti/tímategund sé ekki sýnd og heimildir séu sýnilegar.
- Eitt raunfixture velur annaðhvort Vestfirði eða genericring og annað identityform ef breyting krefst; blokk er sameiginleg, ekki sérstakt próf hvers25pars.
- Núverandi focused `WinterRoute.test.jsx`, ESLint snertJS/i18n og diffcheck. Engin fullsuite, nýdependency/backend eða endurkeyrsla allra upstreamproofa.
- Raunbackend+Vite sýnishorn áeinu studdupari, desktop/mobile360 ogIS/EN ef tól leyfir; skjáskot aðeins source-time/evidence, ekkert eldriimage overwrite. Computer-use reglur, mest2tilraunir viðtólbilun; annars skrá nákvæma takmörkun/eigandaskoðun, ekkert fabricatedvisualPASS. Browsergagnabeiðni notar núverandi handler, engin sérstök nýprobe-skripta eða keyprint.
- `cc-report.md`: hvað birtist, merking generatedAt/cacheAge, raunkeyrðpróf/skipanir/fjöldi ogscreenshots/óprófað. Uppfæra ticket-503/closure-assessment.md criterion6 með efnislegri stöðu eftir check; ekki merkja GitHubmiðannlokaðan. Eigandaskoðun/lokamat eftir venjuleguworkflow.

## Umfang / STOP

Aðeins WinterRoute.jsx, translations.winterRoute.js, focusedpróf, source-time taskdocs/closure-assessment/CURRENT. Engin API/cache/rawforecast/scoring/tierclip/entitlement/checkout/geometry/staðaval/punktaþétting/#492kort. Ef núverandi metadata dugir ekki til þessarar heiðarlegu birtingar STOP með minnstu lausn áður en backend er breytt. Stöðva þegar þetta virkar/targetedchecks standast; ekki ný sjálfvirk review-/þekjulota.

CC READY_FOR_CC→CC_IN_PROGRESS→CC_COMPLETE meðreport; Jonesy/Ripley/eigandi. Enginn commit/push/deploy/GitHub eða sjálfvirk lokun #503.

---

## Jonesy review — umferð 1 (2026-11-24)

**Niðurstaða: PROMPT_REVIEW — samþykkjanlegt með bindandi P1–P7. Allar tæknilegar forsendur Ripley um `generatedAt`, `cacheAgeMs` og `??0` standast mína mælingu á raun-handler. Tvö atriði vantar í umfangið og eitt sem ég tel að þurfi að breyta: (1) nýja Velja staði-sýnin sýnir hvorki „breytt/túlkað“, „engin stuðningsyfirlýsing“, „opinberar lokanir ganga framar“ né „ekki öryggisráðgjöf“ — þær fjórar línur eru aðeins í gömlu sýninni; (2) `formatTimestamp` staðfestir ekkert, svo „ógildur tími“ krefst eigin athugunar; (3) raunverulegur upstream-tími færðar er þegar í svarinu (`roadSections[].export.dagsKeyrtUt`) og „aldur í skyndiminni 0“ segir ekkert um hann — þess vegna mæli ég með að sýna hann, án bakendabreytingar.**

**Merking:** *sandbox (mitt)* = Linux/Node v22, raun-`api/winter-route-data.js` og `cache.js` (byte-eins og repo, `cmp`) með stubbuðum upstream og föstum kerfistíma (aðeins `Date`), og lestur á `WinterRoute.jsx`, `translations.winterRoute.js`, `winterRoutePresentation.js`; engin net-köll. *Ekki gert af mér:* Vegagerðin/Open-Meteo, React-render, vafri/Windows/ESLint, GitHub #503 (closure-assessment vitnar í hann; ég las hann ekki); CC er ekki byrjaður.

### Sandbox-staðfesting á forsendum prompt

- **`generatedAt`:** er `new Date()` tekið áður en road/forecast er awaitað og kemur óbreytt í svarið. Mælt með 300 ms seinum upstream: `generatedAt` var tekið 303 ms áður en svarið var tilbúið; með raun-tímamörkunum (15 s á hvert fetch) getur bilið verið allt að ~15 s. Prompt hefur því rétt fyrir sér að `generatedAt − cacheAgeMs` er ekki sóknartími.
- **`cacheAgeMs` (cache.js):** TTL færð 5 mín, spá 15 mín; stale-glugginn 30 / 60 mín. Fastur kerfistími 12:00:00 UTC: fersk fetch ⇒ 0/0; +4 mín 30 s ⇒ 270 000 ms á báðum (warm); 12:06 ⇒ færð endurheimt (0) en spá warm 360 000 ms — aldurinn er **óháður** milli hlutanna; upstream-bilun á færð eftir TTL ⇒ `stale: true`, 360 000 ms; spá-bilun eftir TTL ⇒ `stale: true`, 1 200 000 ms. Samhliða kall sem deilir in-flight fetch fær 0 (kóðalestur).
- **`??0`-hættan er raunveruleg fyrir færð, ekki spá:** kalt og báðir færðarfeedar bila ⇒ `roadMeta = { available: false, stale: false, cacheAgeMs: 0, … }` — **jákvæð 0 þótt ekkert sé til**. Spá-bilun kalt ⇒ `forecast = { available: false, reason, points: [] }` **án** `cacheAgeMs`-lykils. Prompt-liður 4 er réttur; það er færðarhliðin sem þarf `available`-hlið.
- **Upstream-tími færðar er þegar í svarinu:** hver kafli ber `export: { dagsKeyrtUt, ageMinutes, isStale }` (útflutningstími Vegagerðarinnar og aldur hans miðað við `generatedAt`). Fersk fetch með 2 mín gömlum útflutningi: `cacheAgeMs` 0, `ageMinutes` 2; warm +4,5 mín: `cacheAgeMs` 270 000, `ageMinutes` 6,5 (heildaraldur, þ.m.t. skyndiminni); færðarfeed bilar kalt: `dagsKeyrtUt: null`, `ageMinutes: null`, `isStale: true`. Spáin ber **engan** upstream-tíma (aðeins `window.expectedHours`).
- **`formatTimestamp`** (`winterRoutePresentation.js`): skilar „—“ fyrir ekki-streng eða streng < 16 stafir, en fyrir **hvaða** streng ≥ 16 stafir skilar það fyrstu 16 stöfunum með „T“→bil — engin Date-athugun. `validRouteData` athugar hvorki `generatedAt` né `cacheAgeMs`.
- **Núverandi lyklar:** `winterRouteAttributionRoadLine`, `winterRouteAttributionWeatherLine`, tenglarnir `winterRouteOfficialSourceLinkRoad`/`…Weather` (+ `VEGAGERDIN_LINKS`, `OPEN_METEO_TERMS_LINK`) og `winterRouteAcquiredAt` („Færðargögn sótt: {time} UTC“) eru aðeins notaðir í `WinterRouteSummary`/gömlu sýninni. Þar eru líka `winterRouteModifiedBy`, `winterRouteNoEndorsement`, `winterRouteOfficialOverride` og `winterRouteNotSafetyAdvice` — **hvergi í `WinterRouteDataView` eða Velja staði**.
- **Stale-texti er þegar til** í gagnasýninni: „Sýnir síðustu þekktu stöðu/spá (N mín. gömul)“ með `Math.round(cacheAgeMs/60000)`, og `segment.export?.isStale` sýnir „úreltur útflutningur“ á kaflanum.
- **Orðalagsskoðun (T3):** próf sem sópar öll `winterRoute*` gildi á móti departure/arrival/ETA/komu/brottfarar-orðalagi gildir sjálfkrafa um ný orð.
- **Lint-gildra:** `react-refresh/only-export-components` bannar að flytja hjálparfall út úr `WinterRoute.jsx` (sama og felldi pörlistann í ring-completion).

### Bindandi atriði

**P1 — Sama laga-/öryggistexti í nýju sýninni og í þeirri gömlu (enginn nýr texti).** Nýja blokkin endurnýtir, auk attribution-línanna tveggja og tveggja tengla, **`winterRouteModifiedBy`, `winterRouteNoEndorsement`, `winterRouteOfficialOverride` og `winterRouteNotSafetyAdvice`** (til á IS/EN). Ég er ekki lögfræðingur; viðmiðið er einfaldlega að sýn sem sýnir lifandi Vegagerðargögn fyrir 25 pör beri að minnsta kosti sömu fyrirvara og sýnin sem gerði það fyrst. Heimildir og fyrirvarar birtast líka þegar færð eða spá er `available: false` (svar `200` með óaðgengilegum hluta); þeir birtast ekki við villu (sýnin er þá ekki sýnd) og það á ekki að breytast.

**P2 — Færðartími = upstream-útflutningur úr núverandi `export.dagsKeyrtUt`, ekki aðeins skyndiminnisaldur.** Konkret ástæða fyrir criterion 6: „aldur í skyndiminni: innan við mínútu“ segir ekkert um hve gamalt Vegagerðarskjalið er (fersk fetch gefur 0 þótt útflutningurinn sé 25 mín gamall; stale-mörkin eru 30 mín). Svarið ber raunverulegan tíma, svo ekkert bakendi þarf. Línan: „Færð: Vegagerðin keyrði gögnin út {time} UTC“ (nýr IS/EN lykill, **ekki** `winterRouteAcquiredAt`). Veldu **elsta gilda** `dagsKeyrtUt` meðal kafla (varfærnara en fyrsta; mælt: allir kaflar deila feed-tímanum), staðfest með `Date.parse` og skilyrði `finite`; engin gild gildi (feed bilað, `null`) ⇒ línan er **sleppt**, ekki „—“ og ekki 0. Þetta er *ekki* `fetchedAt` — prompt-bannið við honum stendur. Spá fær engan upstream-tíma (Open-Meteo-svarið ber ekkert slíkt í payload); texti spár segir aðeins skyndiminnisaldur og lofar engu um ferskleika líkans.

**P3 — Reglur skyndiminnisaldurs.** (a) Færð: aldurslína aðeins ef `roadMeta.available === true` **og** `Number.isFinite(cacheAgeMs) && cacheAgeMs >= 0`; mældur 0-gildi þegar `available: false` má aldrei verða „innan við mínútu“. (b) Spá: aðeins ef `forecast.available === true` og finite ≥ 0 (lykillinn vantar þegar óaðgengilegt). (c) Ein hrein hjálparfall í **`src/lib/winterRoutePresentation.js`** (+ próf í `winterRoutePresentation.test.js`) — bæta báðum skrám við umfangið, annars rekst CC á lint-gildruna. (d) Námundun: `< 60 000 ms` ⇒ „innan við mínútu“; annars `Math.round(ms/60000)` — **sama** og núverandi stale-línur svo tvær mínútutölur í sömu sýn stangist aldrei á (með `floor` gæfi stale-lína 6 mín og ný lína 5 mín við x:30–x:59 s). (e) Stale-svar (`stale: true`): amber-textinn er óbreyttur og nýja línan má ekki stangast á við hann (sama hjálparfall). (f) `roadMeta.available: true` þar sem aðeins annar feed er í lagi er áfram „aldur færðar“ að skyndiminnisfötu (ein fata fyrir báða feeda); P2-línan sleppist ef `segmentsAvailable` er false. (g) Texti segir „aldur gagna í skyndiminni þegar svarið var gert“, ekki „núverandi aldur“ — síðan tikkar ekki.

**P4 — `generatedAt`: sannreyna og orða rétt.** Ekki nota `formatTimestamp` án athugunar: krefjast `typeof === "string"`, `Number.isFinite(Date.parse(...))` og lögun `YYYY-MM-DDTHH:MM`; annars sleppa línunni (eða „tími ekki tiltækur“ eins og prompt kveður á um) — aldrei „— UTC“ (það gerir `formatTimestamp` í dag fyrir ógilt). Orðalag: „Svar útbúið {time} UTC“ (server-stimpill tekinn **áður** en upstream er sótt; mælt bil = seinkun upstream, allt að ~15 s); ekki „sótt“/„nýsótt“ og ekki afleiddur sóknartími `generatedAt − cacheAgeMs`. `winterRouteAcquiredAt` í gömlu sýninni er óbreyttur (sjá S1).

**P5 — Staðsetning og hegðun.** Blokkin er neðst í `WinterRouteDataView`, **utan** `role="status"`-svæðisins (sr-only `<p>` yfir sýninni heldur áfram að lesa aðeins stöðu/fyrirsögn), engin ný `aria-live`; spátímaval kallar ekki á fetch og tapar ekki fókus; blokkin kemur aðeins úr `dataView.payload` núverandi pars (ekkert úr gamla svari — `dataView` er þegar lykilbundið á from/to/geometryId/option). Heimildir sýnilegar í öllum fjórum `available`-samsetningum. Engin ETA/komu/brottfarar-orð (T3-sóparinn gildir).

**P6 — Markviss próf.** Component-próf á hlutanum, ekki formatterinn einan: (1) fersk 0/0: báðar línur „innan við mínútu“, P2-tími birtur; (2) **ólík** færð/spá-gildi (t.d. 4 mín / 9 mín) svo röng víxlun sjáist; (3) stale-færð og stale-spá með eldri aldur, amber og ný lína sammála; (4) færð `available: false` **með** `cacheAgeMs: 0` í payload (eins og raun-handler gefur) ⇒ engin „0 mín/innan við mínútu“-lína en núverandi „færð ekki tiltæk“-texti og heimildir sjást; (5) spá `available: false` án `cacheAgeMs`-lykils; (6) báðir óaðgengilegir; (7) ógilt/vantar/neikvætt/NaN/streng `cacheAgeMs`, ógilt `generatedAt`, `export.dagsKeyrtUt: null`/rusl ⇒ línan sleppt, heimildir óbreyttar, enginn kast; (8) hjálparfall í `winterRoutePresentation.test.js`: mörkin 59 999 / 60 000 / 89 999 / 90 000 ms og `Math.round`-samræmi. Eitt fixture af annarri auðkennisgerðinni (Vestfirðir **eða** generic hringur) nægir; blokkin er sameiginleg. Þar sem núverandi fixtures setja `cacheAgeMs: 0`/`generatedAt` munu eldri próf nú sjá nýju línurnar — keyrið alla `WinterRoute.test.jsx` (ekki aðeins ný próf) með `--testTimeout=60000` á þéttri vél; eldra #502-fókusprófið er þekkt tímaflöktandi (ekki frá þessari lotu).

**P7 — Skýrsla og `closure-assessment.md` criterion 6.** `cc-report.md`: nákvæm merking hvers sýnds tíma (svar-stimpill ≠ sóknartími; færðarútflutningstími = upstream; aldur = skyndiminni við afgreiðslu), prófafjöldi fyrir/eftir og skipanir, raun-vafrasýnishorn eða skráð takmörkun. Criterion 6 uppfært með efnislegri stöðu: færð hefur raunverulegan upstream-tíma, **spá hefur aðeins skyndiminnisaldur** (enginn líkans-/keyrslutími í payload) — það er samþykkt takmörk, ekki falin. Miðinn er ekki merktur lokaður.

### Athugasemdir (S, ekki bindandi)

**S1 — Gamla „Færðargögn sótt: {time} UTC“ merkir `generatedAt` sem sóknartíma.** Það er ónákvæmt af sömu ástæðu og prompt nefnir (stimpillinn er tekinn fyrir fetch). Prompt segir réttilega að ekki skuli breyta lyklinum í þessari lotu; skrá í remaining/closure-assessment að þetta orðalag standi eftir í gömlu sýninni.

**S2 — Cache er á hverri heitri function-instance.** Kald instance gefur alltaf `cacheAgeMs` 0 þótt Vegagerðarskjalið sé eldra — enn ein ástæða fyrir P2. Ekki breyta þessu hér.

**S3 — Valkostur við P2.** Ef Ripley vill ekki P2 í þessari lotu: skrá í criterion 6 að færðartími sé *aðeins* skyndiminnisaldur og að upstream-tími sé til í payload en ósýndur. Ég tel það veikari niðurstöðu en bind ekki.

**S4 — Aldur við útflutning.** `export.ageMinutes` (heildaraldur við `generatedAt`) má sýna sem „(N mín. fyrir svar)“; ekki krafist, og tvær tölur í sömu línu auka hættu á rugli.

### Mörk þessarar yfirferðar

- Engin net-köll, engin React-render- eða vafrakeyrsla; allar tölur hér koma úr raun-handler/cache með stubbuðum upstream og föstum kerfistíma, og úr kóðalestri. Ég keyrði ekki framendann með nýju blokkinni (hún er ekki til enn). Ég las ekki GitHub #503.
- Ég breytti engum kóða; CC byrjar ekki fyrr en `READY_FOR_CC` og „Prompt approved“ frá eiganda.
- Engin umferð 2 nema eigandi biðji.

**Næsta:** Ripley skerar `approved-prompt-v1.md` með P1–P7 (eða hafnar P2 með rökum, sjá S3), eigandi samþykkir og CC fær verkið.


## Ripley afhending — 2026-11-24

Jonesy samþykkiP1–P7 varðveitt óbreytt í approved-prompt-v1.md. P2tekiðinn: upstreamútflutningstími færðar úrnúverandipayload,spácacheAgeaðeins. P1existingfyrirvarar/tenglar endurnýtt, presentationhelper/próf bættviðheimilaðarUI-skrár vegna lint. Enginbackend/cachebreyting. Stage READY_FOR_CC; eigandi→CC„Prompt approved“. Enginapp/net/commit/push/deploy/GitHub hér.

# #489 — Samantekt á veðri og færð á leiðinni

## Ripley — umferð 1, 2026-11-04

Til Jonesy review, ekki execution-heimild. Issue lesið beint: https://github.com/robertmarvin72/icelandic-weather/issues/489 . Vinnusvæði hreint; HEAD 4c76bb17 (arrival-time-based forecasts) á eftir f9d5f565 (#486). CURRENT #486 CLOSED; varðveitt í previous-current-ticket-486.md. Nýrri raunkóði ræður ETA-endurnýtingu, ekki eldri #486-lýsing um sama gildistíma á öllum kortum.

### Vöruspurning og sönnun

Getur notandi séð hámark hviða/klukkustundarúrkomu, lágmark hita og fjölda kafla með gildar færðartilkynningar, úr sömu gögnum og núverandi kort/listi, án þess að gögn sem vantar eða eru gömul verði túlkuð jákvætt? Nægilegt: litil samantekt, sama gildistímasemantík og kort, markviss eininga/UI-próf og raunvafrayfirferð. Production-staðfesting er sérstakt afhendingarskref miðans, ekki heimild til sjálfvirkrar birtingar.

### Fyrirhugað execution-prompt

Lestu AGENTS.md, uppfært CLAUDE.md, docs/ai/README.md og CURRENT.md; fylgdu CC-lífsferli eftir eigandasamþykki. Innleiddu aðeins #489.

1. **Upphafsaudit:** Lestu WinterRoute.jsx, winterRouteEta.js og próf, winterRoutePresentation.js, translations.winterRoute.js, api/winter-route.js og núverandi payload/cache/ferskleikareiti. Endurnýttu #486 skráðar reglur um lokun, útrunna tilkynningu, hlutabilun og viðvaranir. Staðfestu computeEta og hvernig hvert kort finnur sína forecastHour úr departureHour og approxDistanceFromStartKm áður en breytt er. Engin ný veitugögn, lykilprófun eða ETA-rannsókn. Ekki breyta hraða, vegalengdum, hnitum, námundun, komutímasemantík eða backend/spáinntökum.
2. **Einföld samantekt:** Settu eitt stutt IS/EN-samantektarsvæði ofarlega á núverandi síðu, fyrir kortin/listann, með núverandi útliti og læsilegri farsímauppsetningu. Ekki ný controls, kortasýn eða heildarendursmíði. Fjórar upplýsingar: mestu hviður (m/s), mesta úrkoma (mm yfir fyrri klukkustund), lægsti hiti (°C), fjöldi vegkafla með gildar punkttilkynningar. Veðurgildi eru aðeins meðal sex punktanna á leiðinni, ekki fullyrt samfelld leiðarþekja eða hámark yfir daginn.
3. **Sama tímaval og kort:** Fyrir hvern tiltækan punkt nota óbreytt computeEta(selectedDepartureHour, point.approxDistanceFromStartKm), finna forecastHour í point.hours á sama hátt og ForecastCard. Samantekt velur max wind_gusts_10m/max precipitation/min temperature_2m úr ÞESSUM sex gildum. Hvert veðurgildi ber sama kaflaheiti og kortið og nákvæman gildistíma (dagsetning+UTC-klukkutími; endurnýta formatter þar sem hægt er). Þetta er tímagildi valið af núverandi ETA-nálgun, ekki nýtt ETA-líkan. Við jafntefli velja fyrsta punkt í föstu leiðarröð, með stöðugu prófi. Nota point label á IS/EN, ekki handsmíðuð kaflaheiti. Smátt hreint hjálparfall fyrir samantekt er leyfilegt; engin almenn aggregation-vél. Ef tímavalning er dregin í sameiginlegt lítið fall fyrir kort/samantekt skal sýna að kortagögn hegði sér óbreytt.
4. **Vöntun og úrelding:** Null, undefined, NaN, ótiltækur punktur og komutími utan point.hours eru ekki 0. Sía hvert mæligildi sjálfstætt; sýna að hluta gögn vanti ef færri en sex punktar hafa gilt viðkomandi gildi. Með engum gildum sýnum birta vöntun. Max/min úr hlutasýni merkt sem slíkt, aldrei „gott/öruggt“. forecast.stale skal merkt með raunaldri úr cacheAgeMs við samantektina svo gömul gildi líti ekki út sem ný; núverandi viðvörun neðar er áfram. Ekki bæta nýjum veðurfræðilegum/ferskleikaþröskuldum eða álykta að hætta sé engin út frá 0 mm/hviðum eða gagnagati.
5. **Tilkynningatalning:** Telja EINKVÆMA vegkafla með að minnsta kosti eina punkttilkynningu með núverandi status===active, ekki fjölda tilkynninga og ekki almenna yfirborðsflokka eins og HALKA/GREIDFAERT. Ekki telja expired/unknown-validity sem staðfest gildar; þær haldast í núverandi lista með viðvörunum. Tvær tilkynningar á einum kafla teljast einn; sambærileg tilkynning á tveimur mismunandi köflum telst tveir. Talning er færð núna og óháð brottfarartíma. Ef pointsFeedUnavailableOrStale, pointsAvailable false eða roadMeta.stale er satt, birta ótiltæka/óstaðfesta talningu eða skýrt síðast þekkt gildi með gömlumerkingu, aldrei óskilyrt „0 tilkynningar“. Einfaldasta val: óstaðfest talning án tölunnar. Nýr þýðingatexti segir „kaflar með gildar tilkynningar“, ekki „hættulegir kaflar“ eða „lokaðir kaflar“. Óþekkt gildistími skal merktur ef hann kemur fyrir og talning útilokar hann; engin fullyrðing um engar athugasemdir.
6. **Samstilling/UI:** Breyting brottfarartíma uppfærir öll þrjú veðursamantektargildi og tíma/kafla úr sömu þegar sóttu gögnum, engin viðbótar fetch. Tilkynningatalning óbreytt. Núverandi sex kort og færðarlisti haldast, þar með talið lokunarforgangur, heimildir og aðgangur. IS/EN, íslensk kommutölusnið og bil fyrir einingar. Ekki áhættuskor, jákvætt akstursverdict eða brottfararráð.
7. **Markviss próf:** Tilbúið/varðveitt sýni, engin raunveita. Prófa extrema með réttum kafla/forecastHour, mismunandi komutímum á punktum, UTC-dagskiptum, jafntefli, 0 vs null, vöntun á einni breytu vs öðrum, ETA utan glugga og stale-merki. Telja tvo punkttilkynningar á sama kafla einu sinni, á tveimur köflum tvisvar, expired/unknown útilokaðar, almenn færðarstaða ekki tilkynning, feed-niður/stale ekki staðfest 0. UI-próf á IS/EN: brottfararval uppfærir samantekt og kort samhljóða án auka fetch; listi/talning óháð tíma. Raunvafrapróf með núverandi Playwright/Chromium og stubbum á síma/skjáborði fyrir samantekt, tímaval og hlutavöntun/stale. Nota fyrirliggjandi tól, engin uppsetning/hjálparkerfi. Keyra viðeigandi ETA/page/prófunarskrár ásamt nýjum prófum, lint og build; ekki endurtaka fulla suite án ástæðu.
8. **Afhending og lokamörk:** Stutt cc-report.md með breytingum, prófum/vafrasönnun, óbreyttum ETA-reglum og skráðum takmörkunum. Engin ný dependency, backend/DB/config, scoring/entitlement/checkout, ný leið eða gagnaveita, commit/push/GitHub/deploy. Ef raunveruleg hindrun krefst víðara umfangs, tilgreina hvaða samþykkisskilyrði hún hindrar og minnsta lausn; ekki víkka sjálfkrafa. CURRENT → CC_COMPLETE; Jonesy result review og Ripley lokamat.

**Production-skilyrði #489:** Staðbundin/stubbuð próf eru ekki production-staðfesting. Innleiðingarafhending má teljast yfirfarin þegar ofangreint stenst, en GitHub-miða má ekki loka fyrr en Jonesy-review OG production-staðfesting liggja fyrir. Eftir eigandastýrða birtingu þarf stutta staðfestingu á birtu /winter-route, samantekt/tímavali/kafla/gildistímum og sýnilegri villumerkingu ef gögn vantar; skrá dagsetningu og birt commit/útgáfu ef tiltækt. Þetta prompt heimilar ekki birtingu né lifandi prófun núna; ef production er ekki prófað skrá NOT_TESTED sem eftirstandandi lokaskref, ekki hefja nýja rannsókn eða kalla það framleiðslu-PASS. Eigandi ákveður birtingu og næsta handoff.

### Review-áhersla

Nákvæm ETA/tímavalning, gilt-vs-óþekkt tilkynning og vöntunarmerking styðja bein samþykkisskilyrði #489. Enginn nýr risk-/leiðarútreikningur. Jonesy verdict: PENDING.


## Jonesy review - umferð 1 - 2026-11-04

### Verdict: APPROVED með S1–S3 (foldable, engin ný rannsókn)

Execution-promptið er skýrt, afmarkað og byggir á réttum forsendum. Ég tel það tilbúið til execution ef Ripley fellir inn S1–S3 hér að neðan. S1 er það eina sem skiptir máli fyrir kjarna miðans; S2–S3 eru litlar.

### Hvað var athugað (merkt eftir uppruna)

**Lesið í vinnutré (staged, ekki git; HEAD 4c76bb17 óstaðfest af mér):** `winterRouteEta.js` + próf, `WinterRoute.jsx`, `WinterRoute.test.jsx`, `winterRoutePresentation.js`, `translations.winterRoute.js`, `api/winter-route.js`, `api/_lib/winterRoute/segments.js`. Ekkert keyrt; ekkert tengt neti eða lykli.

**Forsendur promptsins sem standast:**
- `computeEta(departureHour, point.approxDistanceFromStartKm)` skilar `{ rawArrivalMs, forecastHour }` með `Math.ceil` á heila klukkustund og null (aldrei 0) fyrir ógilda vegalengd/tíma; `ForecastCard` finnur `hourIndex = point.hours.indexOf(forecastHour)` og sýnir „ekki tiltækt“ utan glugga. Atriði 3 lýsir þessu rétt. `approxDistanceFromStartKm` er miðpunktur `nearIdButur`-kafla (fáanlegt í svari), ekki nákvæm staðsetning.
- Svarið inniheldur reiti sem atriði 4–5 treysta á: `forecast.stale`, `forecast.cacheAgeMs`, `roadMeta.stale`, `roadMeta.pointsAvailable`, `roadMeta.pointsFeedUnavailableOrStale`, `segments[].notices[].status` (`active`/`expired`/`unknown`, reiknað á þjóninum með `now` í hverri beiðni) og fasta röð `forecast.points`. Jafnteflisregla „fyrsti punktur í leiðarröð“ er því framkvæmanleg.
- `segments[].notices` fylgja kafla þótt `segmentDataAvailable` sé false (sandbox-staðfest í #486), svo talning á köflum virkar þegar kaflafeed bregst en punktafeed lifir.
- Gust/úrkomu-merkingar í kortum eru þegar „hámark síðustu klukkustundar“ / „síðasta klukkustund“ (#486 R4).

**Ekki athugað (UNKNOWN):** texti GitHub-miðans #489 sjálfs — `gh issue view` er lokað úr þessu sandbox (GraphQL ekki leyft) og ég opnaði hann ekki með öðrum leiðum. Ég treysti lestri Ripley; S1 hér að neðan þarf að bera saman við orðalag miðans (sjá N1).

### Skilyrði

**S1 — MED-HIGH — talningin „0“ má ekki lesast sem „allt í lagi“ þegar kafli er merktur Lokað/Ófært af yfirborðsflokki.**
Atriði 5 telur eingöngu kafla með virka punkttilkynningu og útilokar yfirborðsflokka (rétt, samkvæmt miðanum). Afleiðing í heilbrigðu feedi: kafli með `AstandYfirbord = LOKAD`/`OFAERT_*` (eða tvítekin mótsögn sem gefur `closed`) og enga punkttilkynningu gefur flokkinn Lokað/Ófært í listanum, en samantektin segir „0 kaflar með gildar tilkynningar“ efst á síðunni. Það brýtur markmið miðans („ekki túlkað jákvætt“) án þess að nokkurt gagnagat sé til staðar, því atriði 5 verndar aðeins feed-niðri/stale-tilvikið.
Lágmarkslausn (ekki ný flokkun, ekkert nýtt telja): talningarlínan ber alltaf föst IS/EN skýringarorð um umfang — t.d. „Gildar punkttilkynningar (lokanir/vegavinna á stöðum): N kaflar. Ekki heildarstaða færðar — sjá færðarlistann.“ — án jákvæðs stíls (enginn grænn litur/hak) hvort sem N er 0 eða meira. Prófa: kafli með `LOKAD` og engin punkttilkynning → talning 0, föstu skýringarorðin sýnileg, enginn jákvæður stíll; sama með `unknown_unclassified`.

**S2 — LOW — merkingar samantektargilda sömu og kortanna.**
Atriði 2 nefnir „mestu hviður“ og „mesta úrkoma (… fyrri klukkustund)“ en hviðumerkingin er ekki nefnd. Samantektin endurnýti núverandi lykla `winterRouteGust` („hámark síðustu klukkustundar“) og `winterRoutePrecip` („síðasta klukkustund“) frekar en ný orð, svo S4-merking #486 haldist. Próf: bæði orðasamböndin birtast í samantektinni á IS og EN.

**S3 — LOW — tími vegafærðar við talninguna.**
Atriði 5 kallar talninguna „færð núna“ en síðan sækir gögn einu sinni og endurhleður ekki; eini sóknartíminn (`winterRouteAcquiredAt`) er neðst í heimildakafla. Samantektin (eða talningarlínan) vísi í sama sóknartíma (`generatedAt` með núverandi sniði) svo opin flipi sem er klukkustundum gamall sýni ekki gamla talningu sem núverandi. Engin ný fetch/polling. Próf: tíminn birtist á IS og EN.

### Athugasemdir (ekki skilyrði)

- **N1:** Ripley staðfesti hvort S1 stangist á við orðalag miðans (er talningin skilgreind sem „fjöldi kafla með gildar færðartilkynningar“?). Ef miðinn krefst nákvæmlega þessarar talningu heldur S1 (umfangsorð) gildi; ef hann skilgreinir hana víðar (t.d. með yfirborðsflokkum) ræður Ripley og S1 einfaldast.
- **N2:** Raunstaða í retained sýni: þrír kaflar hafa virka VEGAVINNA-tilkynningu (til 30.11.), svo talningin verður að jafnaði 3 án nokkurrar lokunar. Orðalagið í atriði 5 („gildar tilkynningar“, ekki „hættulegir kaflar“) er rétt; engin aðgerð.
- **N3:** Production-skilyrðið er skýrt. Bendi á að production-staðfesting á /winter-route krefur að Open-Meteo-lykill sé settur í Vercel og að Vegagerðin sé aðgengileg þaðan — hvort tveggja er UNKNOWN frá #486. Ef spá er ótiltæk í production verður samantektin að hluta staðfest; miðinn helst þá opinn, sem er í samræmi við skilyrðið. Ripley mætti nefna hver framkvæmir staðfestinguna (eigandi) til að forðast tvíræðni; ekki skilyrði.
- **N4:** Fyrsta render áður en `selectedHour` er valið gefur „ekki tiltækt“ í kortunum í augnablik (núverandi hegðun). Samantektin ætti að fylgja sömu stöðu frekar en að sýna endanlega „engin gildi“; prófin nota `waitFor` eins og í #486. Ekki skilyrði.

### Takmörk

Rýni á texta og lestur á staged kóða; ekkert keyrt á vél eiganda, ekkert prófað í sandbox fyrir þetta verkefni, engin raunveita eða lykill. GitHub-miðinn ólesinn af mér. Ekki lögfræðiráðgjöf.

## Ripley — afgreiðsla samþykkis, 2026-11-04

S1–S3 felld inn í approved-prompt-v1.md. Lesinn #489 krefst aðgreiningar færðartilkynninga frá almennri færðarstöðu; fast umfangsorð við punktatilkynningatalningu samræmist því. Endurnýtt tímabilsmerking og generatedAt aðeins merkt sóknartími, ekki skoðun/upstream-nýjun. Production er eigandastýrt lokaskref síðar. CURRENT → READY_FOR_CC. Enginn forritskóði/net-/lyklapróf hér. Eigandi → CC „Prompt approved“.

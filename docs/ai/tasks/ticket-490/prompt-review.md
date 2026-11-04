# #490 — Samanburður brottfarartíma, Rauðavatn–Vík

## Ripley — umferð 1, 2026-11-04

Til Jonesy review; ekki execution-heimild. Issue lesið beint: https://github.com/robertmarvin72/icelandic-weather/issues/490 . #489 workflow CLOSED og production-staðfesting PASS skráð. Vinnusvæði hafði fyrirliggjandi ócommitaðar lokaskráningar í CURRENT og ticket-489/result-review.md; þær varðveittar, ekki hluti innleiðingar #490. Fyrra CURRENT vistað í previous-current-ticket-489.md.

### Vöruspurning / nægileg sönnun

Hvernig breytast þrjú veðursamantektargildi meðal sömu sex punkta ef brottför er tveimur klukkustundum fyrr eða síðar? Einfaldur upplýsingasamanburður úr þegar sóttum gögnum; ekki ráðlegging, heildarskor eða nýr ETA. Nægileg staðbundin sönnun: réttir tímar/kaflar/gildi, ótiltækir valkostir við gagnavöntun, val sem uppfærir kort og markviss próf/raunvafri.

### Fyrirhugað execution-prompt

Lestu AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md. Fylgdu CC-lífsferli eftir eigandasamþykki. Innleiddu aðeins #490.

1. **Read-only fyrst:** Lestu WinterRoute.jsx (selectedHour/availableHours/RouteSummary/ForecastCard), winterRouteEta.js og próf, winterRouteSummary.js og próf, þýðingar og fyrirliggjandi e2e. Endurnýttu resolvePointAtDeparture/computeEta og computeWeatherExtremaSummary óbreytt að merkingu, með fyrirliggjandi max/min/jafntefli/gagnagat-reglum. Engin ný API/net-/lyklaprófun, gögn, hnit, vegalengdir, 70 km/klst.-forsenda, námundun eða backend/cache-breyting.
2. **Þrír tímar:** Lítið samanburðarsvæði við núverandi brottfararval/samantekt: viðmið = selectedHour, valkostir = viðmið −2 klst., viðmið, viðmið +2 klst. Reikna UTC yfir dagamót, ekki strengjaskurð á klukkutíma eða local Date-tíma. Sýna alltaf þrjú merkt sæti; ef ekki tiltækt sýna tíma + ástæðu, aldrei núll eða hljóðlaust sleppa sætinu. Viðmið kalla „Valinn brottfarartími“, hin „2 klst. fyrr/síðar“, IS/EN. Engin sjálfvirk röðun eða „best/öruggast“.
3. **Tiltækileiki heillar samanburðarsýnar:** Valkostur telst tiltækur ef brottfarartími er framtíðartími í núverandi availableHours og fyrir ALLA sex föstu punkta finnst viðkomandi komutímamiðað forecastHour í point.hours samkvæmt núverandi resolver, available=true og öll þrjú samantektarmæligildi á þeim tíma eru endanlegar tölur. Gagnagat í einu mæligildi, ótiltækur punktur eða komutími utan sótts glugga gerir ÞANN valkost ótiltækan með skýringu. Ekki reikna heilar samantektir úr hlutasýni sem lítur út fyrir fullan samanburð. Raunverulegt 0 er gilt. Þetta er aðeins hæfisskilyrði nýja samanburðarins; núverandi kort/#489 samantekt mega áfram sýna sín heiðarlegu hlutagögn óbreytt. Ekki lengja glugga eða sækja ný gögn til að bæta þekjuna.
4. **Samanburðargildi:** Fyrir hvern tiltækan valkost endurnýta #489 extrema yfir punktana á þeirra EIGIN komutímum, aldrei einn sameiginlegan tíma. Sýna mestu hviður, mestu klukkustundarúrkomu og lægsta hita, hvert með sama kaflaheiti og gildistíma (dagsetning+UTC) og viðeigandi kort myndi sýna fyrir þá brottför. Endurnýta merkingar fyrri klukkustundar fyrir hviður/úrkomu, réttar einingar og IS/EN-talnasnið. Hlutlaus útlitsmerking, engin veðurfræðileg þröskuldun, áhættulitir eða sjálfvirkt val.
5. **Val / samstilling:** Tiltækur valkostur hefur aðgengilegan takka til að skoða ítarleg gögn. Hann setur selectedHour á viðkomandi brottfarartíma, svo núverandi sex kort og #489 samantekt uppfærast saman. Samanburður endurmiðjast þá um NÝJA selectedHour (fyrra +2 verður nýtt viðmið), engin aukaleg baseline-state eða óskýr tvö tímaval. Núverandi select endurmiðjar á sama hátt. Ótiltækir takkar disabled með sýnilegri ástæðu; þeir breyta ekki vali. Ótiltækt viðmið í samanburði felur ekki fyrirliggjandi kort eða löglegt núverandi val. Uppfæra hæfi þegar núverandi useNowTicking lætur fyrri tíma falla út, án polling/netbeiðna.
6. **Ferskleiki / færð:** Ef forecast.stale, merkja allt samanburðarsvæði síðast þekktri spá og aldri úr cacheAgeMs, eins og #489; engin ósýnileg gömul gildi. Engin ný TTL-regla. Færð/lokanir og fjöldi gildra tilkynninga eru EITT sameiginlegt núverandi gagnahlutverk, aldrei endurtekin sem spáð færð fyrir hvert brottfararsæti. Við samanburð stendur IS/EN skýrt að færð og lokanir eru nýjasta tiltæka staða, ekki spá fyrir valkostina. Halda núverandi færðarlista, tilkynningum/heimildum og fyrirvörum. Engin Stay/Move, örugg ferð, bestur tími eða brottfararráð.
7. **Lítið UI:** Einföld kort/töflur eftir núverandi venjum; á síma staflast þrír valkostir án lárétts skrolls, á skjáborði mega vera hlið við hlið. Merktir tímar, sýnilegur fókus og merking valins tímans, lyklaborð með Tab/Enter. Ekki endurhanna forsíðu/síðuna, bæta korti eða controls utan valsins. Nýtt lítið hreint samanburðarfall leyfilegt ef það einfaldar prófun, ekki almennt comparison-kerfi eða ný dependency.
8. **Markviss próf:** Nota tilbúið/varðveitt svar, engin raunveita. Prófa −2/0/+2 með UTC-dagskiptum, mismunandi ETA-klukkutímum fyrir alla sex, sömu extrema og computeWeatherExtremaSummary, jafntefli, 0/null og einn vantaðan punkt/mæligildi/komutíma. Prófa að brottför innan glugga dugi ekki ef síðasti komutími er utan hans; liðnir brottfarartímar ekki valkvæðir. UI IS/EN: þrjú sæti, ástæður vöntunar, val færir kort og #489 samantekt/viðmið rétt, fyrri/síðari sæti endurmiðjast, engin auka fetch; færsla/listi/talning óháð brottför, stale skýrt. Núverandi ETA/#489 próf + ný markviss próf, lint/build. Raunvafri með núverandi Playwright/Chromium/stubbum á síma og skjáborði, lyklaborð og einn ótiltækur/stale valkostur. Engin tólauppsetning eða nýr biðlari.
9. **Afhending / umfangsvörn:** Stutt cc-report.md með breytingum, endurnýtingu, prófum/browser-sönnun og takmörkunum. Fyrirliggjandi ócommitaðar #489 lokaskráningar ekki skrifað yfir eða flokkað sem ný appbreyting. Hvert verkþrep styður samþykkisskilyrði #490; ef núverandi gögn duga ekki sýna ótiltækt og skrá, ekki rannsaka eða víkka. Engin backend/DB/config/forecast/scoring/entitlement/checkout-breyting, ný leið/gagnaveita/áhættulíkan, commit/push/GitHub/deploy. Nauðsyn á víðari breytingu: tilgreina hindrað skilyrði/minnstu lausn og stöðva háða vinnu fyrir eigandaákvörðun. CURRENT → CC_COMPLETE; eigandi → Jonesy → Ripley.

**Production-lokaskref:** #490 krefst production-staðfestingar auk Jonesy-review og Ripley-samþykkis. Þessi framkvæmd nær aðeins til innleiðingar/prófa. Birting bíður yfirferðar og eigandastýringar; engin sjálfvirk deployment/lifandi próf. Eftir samþykkta birtingu þarf afmarkaða athugun á raunútgáfu /winter-route: þrjú sæti eða skýrt ótiltækt, val uppfærir kort, réttir kaflar/tímar og skýr aðgreining núverandi færðar. Skrá NOT_TESTED þar til það gerist, GitHub-miða ekki loka fyrr. Engin viðbótarrannsókn sem lokakrafa.

### Review-áherslur

Heil ferð innan sótts spáglugga, endurmiðjun eftir val og óbreytt núverandi ETA eru beinar kröfur #490. Ferskleiki/færð ekki túlkuð sem framtíðaröryggi. Jonesy verdict: PENDING.


## Jonesy review - umferð 1 - 2026-11-04

### Verdict: APPROVED með S1–S4 (foldable, engin ný rannsókn)

Promptið er skýrt og afmarkað, og forsendur þess standast gegn raunkóða. Fjögur lítil skilyrði gera tiltækileikareglurnar og lyklaborðshegðunina óyggjandi; ekkert þeirra bætir við umfangi umfram atriði 2–8.

### Hvað var athugað (merkt eftir uppruna)

**Lesið í vinnutré (staged, ekki git):** `WinterRoute.jsx` (`selectedHour`, `availableHours`, `RouteSummary`, `ForecastCard`, `useNowTicking`), `winterRouteSummary.js`, `winterRouteEta.js` (`computeEta`, `resolvePointAtDeparture`) og `api/_lib/winterRoute/segments.js`. Skrárnar hafa sama mtime og við #489-yfirferð mína (óbreyttar síðan). Ekkert keyrt á vél eiganda; ekkert net eða lykill.

**Forsendur sem standast:**
- `availableHours` = 24 spátímar sem eru strangt eftir `now`, endurreiknaðir á hverri mínútu af `useNowTicking`; `selectedHour` fellur aftur á `availableHours[0]` ef valinn tími fellur út. Atriði 3 og 5 lýsa þessu rétt.
- `computeWeatherExtremaSummary(points, departureHour)` skilar `validCount`, `isMissing`, `isPartial` per mæligildi, og `resolvePointAtDeparture` er sameiginlegt með kortunum. Endurnýting án breytinga á merkingu er framkvæmanleg.
- Bæði föst vegalengd og röð punkta eru í svarinu (`approxDistanceFromStartKm`).

**Reiknað í sandbox úr `segments.js` (engin netnotkun):** fjarlægðir punkta eru 25,0 / 39,5 / 73,2 / 88,4 / 125,5 / 175,0 km; fjarlægasti punktur kemur 2,5 klst. eftir brottför, námundað upp í +3 klst. Af 24 brottfarartímum í glugganum (brottför á heila tímanum) geta aðeins tímar 0–20 fengið gögn fyrir alla sex punktana; tímar 21–23 geta það aldrei. Fullt þriggja sæta samanburðarsvið (−2/0/+2) fæst því aðeins fyrir viðmið 2–18 (miðað við spáglugga), og sjálfgefið val við hleðslu (fyrsti tími, `availableHours[0]`) hefur alltaf „2 klst. fyrr“ ótiltækt. Það er hegðun hönnunarinnar, ekki galli (sjá N2).

**Ekki athugað (UNKNOWN):** texti GitHub-miðans #490 sjálfs (`gh` GraphQL er lokað úr sandbox); ég treysti lestri Ripley. Staðfesting á #489 production PASS er höfð eftir Ripley/eiganda í CURRENT, ekki staðfest af mér.

### Skilyrði

**S1 — LOW-MED — tiltækileikareglan og ástæður skilgreindar nákvæmlega (atriði 3).**
(a) Tiltækileiki sætis ræðst af `validCount === 6` (föst fjöldi leiðarpunkta) fyrir ÖLL þrjú mæligildi úr núverandi extrema-niðurstöðu, ekki af `!isPartial`, því `isPartial` er afstætt við lengd `points`-listans (sem er tómur þegar spáin er ótiltæk). (b) Ástæðurnar séu fastur, takmarkaður listi með IS/EN-texta, enginn innri kóði eða enskt lykilorð í IS-viðmóti: liðinn/utan valkvæðra tíma, komutími einhvers punkts utan sótts glugga, punktur ótiltækur, gagnagat í mæligildi. (c) Í ástæðu sætis sem er ótiltækt vegna ófullrar þekju komi fram að samanburðurinn krefst gagna fyrir alla sex punktana, svo „Valinn brottfarartími: ótiltækt“ stangist ekki á við #489-samantektina sem sýnir hlutagögn (merkt „byggt á N af 6 punktum“) fyrir sama tíma. Próf: ein ástæða per flokk á IS og EN, og 5 af 6 gildum → ótiltækt en #489-samantektin heldur hlutagildum.

**S2 — MED — hegðun þegar samanburðurinn á ekki við (atriði 2 vs 5).**
Atriði 2 segir „sýna alltaf þrjú sæti“ en skilgreinir ekki tvö ástand: (i) `forecast.available === false`, (ii) `selectedHour` ekki enn valið (fyrsta render). Skilgreina: (i) samanburðarsvæðið sýnir ekki þrjú eins sæti heldur lætur núverandi „Veðurspá er ekki tiltæk“-skilaboð nægja (eða sýnir þau sjálft, ekkert annað); (ii) ekkert samanburðarsvæði fyrr en viðmið er valið (sama loading-staða og kortin), ekki þrjú „ótiltækt“-sæti sem blikka. Hvorugt felur kort/lista/talningu. Próf fyrir bæði.

**S3 — LOW-MED — lyklaborðsfókus eftir val (atriði 5 + 7).**
Við val á +2 verður sá takki nýja viðmiðið og er að líkindum óvirkur/endursettur; óvirkur takki missir fókus og lyklaborðsnotandi lendir efst á síðunni. Krafa: eftir virkjun sætis með Enter/Space haldist fókus á hnút innan samanburðarsvæðisins (t.d. nýja „Valinn brottfarartími“-sætið, með `tabIndex={-1}` ef þarf, eða sætið sem var virkjað ef það er enn virkt) og breytingin sé tilkynnt hjálpartækjum (`aria-live="polite"` á valinn tíma); gildir einnig þegar valið fer í gegnum núverandi select. Óvirkir takkar hafa sýnilega ástæðu sem texta (ekki bara `title`). Próf: Playwright með lyklaborði (Tab → Enter) sem athugar `document.activeElement` innan svæðisins eftir val.

**S4 — LOW — mælanlegur farsímaeiginleiki (atriði 7 + 8).**
„Staflast án lárétts skrolls“ sé athugað með mælingu í raunvafra við 375 px: `document.scrollingElement.scrollWidth <= clientWidth` með þremur sætum (þ.m.t. lengstu IS og EN texta ástæðum og lengsta punktaheiti „Rauðavatn–Sandskeið–vestari Hellisheiði“), auk sýnilegs fókushrings á takka. Ekki lýsandi skjámynd eingöngu.

### Athugasemdir (ekki skilyrði)

- **N1:** Texti miðans #490 ólesinn af mér (sjá ofan). Ef hann skilgreinir tiltækileika öðruvísi en atriði 3 ræður Ripley.
- **N2:** Sjálfgefið val við hleðslu er fyrsti tími glugga, svo „2 klst. fyrr“ er alltaf ótiltækt á fyrstu sýn, og viðmið 21–23 (eða 19–20 fyrir +2) fá ótiltæk sæti. Þetta er rétt og heiðarlegt; ástæðan ætti að vera orðuð þannig að notandinn skilji að tími sé liðinn/utan glugga, ekki bilun.
- **N3:** Ströng regla (ein vöntun í einu mæligildi gerir sæti ótiltækt) er viljandi og skynsamleg; hún getur gert allan samanburðinn ótiltækan ef einn punktur bregst í staðfestingu. Samþykkt, ekki breyta.
- **N4:** Þrjú sæti × þrjú gildi × (gildi + punktaheiti + tími) er þétt á síma; prófið í S4 grípur ef það flæðir yfir.
- **N5:** Production-skilyrði #490 er skýrt og heimilar ekkert nú. Óbreytt: NOT_TESTED þar til eigandi birtir og staðfestir.

### Takmörk

Rýni á texta og lestur á staged kóða plús útreikningur á fjarlægðum úr `segments.js` í sandbox; ekkert keyrt á vél eiganda, engin raunveita eða lykill, engin próf keyrð fyrir þetta verkefni. Ekki lögfræðiráðgjöf.

## Ripley — afgreiðsla samþykkis, 2026-11-04

S1–S4 felld inn í approved-prompt-v1.md. Föst sex-punkta hæfisregla/ástæður, skýr loading/ótiltæk grunnstaða, stöðugur fókus við notandaval og mælanleg 375px-prófun. Engin ný rannsókn eða ETA/API-breyting. Sjálfgefin −2 vöntun samþykkt sem gagnamörk. CURRENT → READY_FOR_CC; enginn forritskóði/net/lykill. Eigandi → CC „Prompt approved“.

# #429 — Tillaga að minnsta næsta miða (óbirt, ekki samþykkt til útgáfu)

Þessi tillaga er **ekki birt** og **ekki samþykkt til innleiðingar**. Hún er afhent sem leiðarvísir fyrir Ripley/eigandann til að ákveða næsta skref, í samræmi við heildarniðurstöðuna **PARTIAL** (sjá `research-report.md` Síða 1). Ef eigandi samþykkir, verður þetta efni endurskrifað sem alvöru GitHub-miði af Ripley/eigandanum — CC gerir það ekki hér.

## Afmörkun gagnvart upprunalegu Winter Route Advisor

Þessi tillaga nær **EKKI** til upprunalegu hugmyndarinnar (route/risk scoring, best-departure algorithm, sjálfvirk vetrartúlkun, UI, saved trips). Hún nær aðeins til þeirrar **þrengdu upplýsingasýnar** sem skilgreind er í `pre-sample-plan.md` lið (a): per-segment source-status og ástandssýn fyrir eitt notandaskilgreint ETA-sviðsmyndi, án öryggisúttektar.

## Markmið (eitt, nákvæmt)

Smíða EINA read-only API-aðgerð (`GET /api/route-conditions?route=A|B|C&eta=<ISO8601>`) sem skilar, fyrir hvern checkpoint á valinni leið, núverandi færðarástand (frá `faerd2017_1`), nýjustu tiltæku veðurathugun (Veðurstofa EÐA Vegagerðar-DATEX, hvort sem er til), og spá fyrir notandaskilgreinda ETA-tímapunktinn (Open-Meteo), hvert með eigin tímastimpli og heimild. Engin samantekin einkunn, engin "best time", engin sjálfvirk túlkun.

## Gagnaboð (data contract), bundið af þessari rannsókn

- **Leiðrétt v2 (R9):** v1 sagði "nákvæmlega 11 checkpoints" — rangt. `coverage.csv` hefur **13 raðir** með `coord_grade = VERIFIED SAMPLE` (hnit úr Veðurstofu-stöðvaskrá), **12 einstök checkpoints** (Borgarnes kemur fram bæði á leið B og C, sami staður, ekki tvítalinn). Skipting per leið (vélrituð talning, `harness/05_coverage_consistency_check-output.txt`): **leið A = 5** (Reykjavík, Hellisheiði, Selfoss, Hella, Vík), **leið B = 6** (Borgarnes, Holtavörðuheiði, Blönduós, Vatnsskarð, Öxnadalsheiði, Akureyri), **leið C = 2** (Kjalarnes, Borgarnes — sami staður og B). AC-liðirnir hér að neðan eru löguð til að passa við þessar tölur, ekki 11/9/5/2 eins og v1 hafði. Checkpoints merkt `UNKNOWN` í `coverage.csv` eru UTAN UMFANGS fyrir þennan fyrsta miða — bætast við í síðari miða EFTIR að hnitaheimild er leyst (t.d. með því að stilla saman WFS LineString-brotin, sem þessi rannsókn sýndi að er framkvæmanlegt en ekki framkvæmt).
- **Leiðrétt v2:** checkpoint-hnitin fyrir þessa 12 koma úr Veðurstofu-STÖÐVASKRÁNNI, ekki úr óháðri vegamælingu — "checkpoint" hér þýðir í reynd "staður þar sem veðurstöð er", ekki sjálfstætt valinn vegpunktur. Hönnuður sem útfærir `routeConditionsCheckpoints.js` þarf að hafa þetta í huga: frosna listanum fylgir þessi skekkja, ekki falin.
- **Ósamfelldir vegakaflar (R9, nýtt):** Milli checkpoints sem ERU í listanum eru ómerktir kaflar sem þessi rannsókn benti á en kortlagði ekki: Reykjavík–Sandskeið–Hellisheiði (leið A), Selfoss–Hella (leið A, Hvolsvöllur liggur á milli án eigin stöðvar), Skógar–Vík (leið A), og megnið af leið B/C milli checkpoints (t.d. Borgarnes–Holtavörðuheiði, Blönduós–Öxnadalsheiði) þar sem engin WFS-geometry var sótt í þessari lotu. Næsti miði sem reynir að "fylla í eyðurnar" milli checkpoints þarf að taka þetta sem sjálfstætt verkefni, ekki gefið sem aukaverk.
- `IdButur`-lykill: notaður EXACT eins og hann kemur úr `faerd2017_1` (mixed-case `IdButur` í því API-svari) — ENGIN tilraun gerð til að tengja við WFS-lagsins `IDBUTUR` eða við DATEX's `PredefinedLocation`-ID í þessum fyrsta miða; það er `faerd2017_1`-lykillinn EINN sem er notaður, þar sem hann er sá eini sem bæði ástand og tímastimplar koma beint úr.
- Athugun: EF Veðurstofu-stöð er virk á staðnum (`vedur_station_active=active` í `coverage.csv`), nota hana; ANNARS, EF DATEX-mælipunktur fannst (`datex_measurement_site_id` ekki UNKNOWN), nota hann; ANNARS skila `"observation": "UNKNOWN"` — ekki sleppt úr svarinu.
- Spá: ein Open-Meteo-fyrirspurn per checkpoint-sett (bundlað per leið, eins og þessi rannsókn gerði), `forecast_source` reitur í SVARINU segir alltaf `"open-meteo (product identity unconfirmed)"` — orðalagið er BINDANDI, ekki valfrjálst.
- `fetched_at` fyrir HVERN hluta svars (ástand/athugun/spá) er aðskilið — ENGIN samantekin "last updated" tímasetning.

## Skrár (files boundary)

- Ný skrá: `api/route-conditions.js` (serverless handler, sama munstur og `api/forecast.js`).
- Ný skrá: `src/lib/routeConditions.js` (hrein, prófanleg samsetningarfunkt sem tekur þegar-sótt gögn og skilar formuðu svari — EKKI endurnýtt `routeRisk.js`, sem er óviðkomandi tjaldsvæða-kóði, sbr. `research-report.md` §8).
- Ný skrá: `src/config/routeConditionsCheckpoints.js` (frosin, hardcoded listi af checkpoints/hnitum/`IdButur` fyrir þær 11 staðfestu staðsetningar — EKKI reiknað á keyrslutíma úr WFS).
- ENGIN breyting á `src/lib/routeRisk.js`, `src/hooks/useRoutePlanner.js`, eða neinu Route Planner-tengdu.
- ENGIN UI-skrá í þessum fyrsta miða (afhendingin er API-svar, ekki component) — UI er sérstakur, SÍÐARI miði, EKKI hluti af þessari tillögu.

## Samþykktarviðmið (AC)

- [ ] `GET /api/route-conditions?route=A&eta=<future-ISO8601>` skilar 200 með öllum **5** leið-A checkpoints sem hafa `coord_grade=VERIFIED SAMPLE` (leiðrétt v2, ekki 9 — sjá `harness/05_coverage_consistency_check-output.txt`), hvert með `roadState`, `observation` (eða `"UNKNOWN"`), `forecast` (fyrir ETA-tímann), og `fetchedAt` per hluta.
- [ ] Sama fyrir leið B (**6** staðfest checkpoints, leiðrétt v2, ekki 5) og leið C (2 staðfest checkpoints — Kjalarnes, Borgarnes).
- [ ] `forecast_source`-reitur er ORÐRÉTT strengurinn skilgreindur hér að ofan í HVERJU svari.
- [ ] Ef `eta` er meira en `forecast_days` fram í tímann, skilar svarið `"forecast": "BEYOND_HORIZON"`, ekki auka-gisk.
- [ ] Ef `faerd2017_1`-fyrirspurnin bilar, skilar svarið `"roadState": "UNKNOWN"` fyrir ALLA checkpoints þeirrar leiðar — EKKI fallback í "open"/"clear".
- [ ] Einingaprófanir fyrir `routeConditions.js` ná yfir: öll 3 ástand (virk stöð / DATEX-stöð / engin stöð), `BEYOND_HORIZON`, og `faerd2017_1`-bilun.
- [ ] Engin tilraun gerð til að reikna, birta eða gefa til kynna "öruggt að keyra"/"stay"/"move" — aðeins hráar, heimildarmerktar tölur.

## Utan umfangs (þessa fyrsta miða)

Route/risk scoring; best-departure algorithm; checkpoints án staðfestra hnita (bætast við í síðari miða); DATEX section-geometry (blocker, sjá §4); söguleg veðurgögn lengri en einn dagur; SafeTravel; UI/component; vélbúnaðarsamhengi (ökutæki); sjálfvirk hálku/skafrenningstúlkun.

## Ósjálfstæði (dependencies) — leiðrétt v2 (R9)

**v1 sagði "engin ný ósjálfstæði KRAFIST" — of afdráttarlaust.** Raunveruleg staða: ENGIN ný KÓÐA-ósjálfstæði (npm-pakki o.þ.h.) er krafist til að byrja — gagnaboðið er frosið af þessari rannsókn og kóðinn sjálfur þarf ekkert nýtt bókasafn. EN eftirfarandi eru ÓLEYST FORSENDUR (prerequisites), ekki "engin ósjálfstæði":

- **Leyfis-/endurnotkunarskilmálar Vegagerðarins (bæði `faerd2017_1` og DATEX)**: UNKNOWN — engin skilmálatexti fannst á sóttum síðum í hvorugri lotunni. Eitt almennt netfang fannst fyrir DATEX (`datex@vegagerdin.is`). Þetta er VÖRUÁKVÖRÐUN-forsenda (eigandi eða Ripley staðfestir, eða samþykkir áhættuna sem útskýrða) — ekki eitthvað CC getur leyst með kóða.
- **Open-Meteo production-rétt** (#453): óstaðfest hvort núverandi almenni hýsill er ætlaður/leyfður fyrir production-álag af þessu tagi til viðbótar við núverandi notkun — sama óvissa og restin af appinu notar nú, ekki ný fyrir þennan miða, en verður að vera nefnd forsenda, ekki gefin fyrir.
- **HTTP, ekki HTTPS**: `http://gagnaveita.vegagerdin.is/...`-slóðirnar sem þessi rannsókn notaði eru ALLAR yfir plain HTTP (ekki TLS). Hvort HTTPS er yfirhöfuð í boði á þessum hýsli var EKKI prófað í hvorugri lotu (v2-reglan bannaði nýjar fyrirspurnir). Framleiðslukóði sem kallar þetta úr `api/route-conditions.js` (server-side) ætti að athuga þetta fyrst, ekki gefa sér plain HTTP sem öruggt-nóg sjálfgefið.

EF einhver af þessum forsendum er óleyst þegar þróun byrjar, er rétt viðbrögð að skila minni, nánar afmörkuðum næsta miða (t.d. "staðfestu Vegagerðar-skilmála fyrst") — EKKI að halda áfram og vona að það leysist af sjálfu sér, og EKKI að túlka "public GET virkaði" sem leyfis-staðfestingu (opið API ≠ leyfi til endurdreifingar/production-notkunar).

EF síðari miði vill bæta við checkpoints án hnita, þarf fyrst að leysa WFS-brota-samsetningu (framkvæmanlegt, sýnt í þessari rannsókn, ekki framkvæmt). EF bein DMI-tenging er æskileg í stað Open-Meteo, er það #456's umfang — ekki ósjálfstæði þessa miða, sem er hannaður til að virka óbreytt með Open-Meteo eins og er.

## Vinnumatstal (effort range)

**Forsendu-byggt mat (assumption-based), ekki loforð** — miðast við EINN þróunaraðila sem þekkir kóðabasann OG að ofangreindar ósjálfstæðis-forsendur (leyfi, HTTPS) séu þegar leystar áður en þróun byrjar; ef þær eru óleystar við upphaf verkefnis, framlengist þetta mat óháð kóðavinnunni sjálfri. Áætlað **2–4 dagar** við þessar forsendur: `api/route-conditions.js` + `routeConditions.js` + checkpoint-config + einingaprófanir. Óvissuþættir sem gætu lengt þetta: (a) `faerd2017_1`'s raunverulega svörunartíð/stöðugleiki yfir lengri tíma var ekki mælt (aðeins einn sóknarpunktur í þessari rannsókn); (b) Open-Meteo-samantvinnun (bundling) fyrir allar 3 leiðir samtímis gæti þurft að endurskoða skyndiminnis-stefnu (`forecastCache.js`'s núverandi 30-mín TTL er hannað fyrir einn stað í einu, ekki marga checkpoints).

## Rökstuðningur

Þetta er minnsti raunhæfi næsta skref sem **(a)** nýtir beint það sem þessi rannsókn sannreyndi (checkpoints MEÐ staðfestum hnitum, `faerd2017_1`-samningurinn, tveggja-neta athugana-fallback-reglan), **(b)** kemur EKKI nálægt neinni öryggisúttekt eða scoring-ákvörðun sem krefst frekari vöruákvörðunar, og **(c)** er nógu lítið til að einn þróunaraðili afgreiði það án þess að þurfa að leysa DATEX-section-geometry-blockerinn eða hnitavandamál checkpoints-án-stöðva fyrst.

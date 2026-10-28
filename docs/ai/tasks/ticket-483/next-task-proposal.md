# #483 — Tillaga að minnsta næsta miða (óbirt, ekki samþykkt til útgáfu)

Þessi tillaga er **ekki birt** og **ekki samþykkt til innleiðingar**. Afhent sem leiðarvísir fyrir Ripley/eigandann. Ef eigandi samþykkir, verður þetta efni endurskrifað sem alvöru GitHub-miði af Ripley/eigandanum — CC gerir það ekki hér. Þessi tillaga afmarkast af og notar **beint** gögnin sem þessi rannsókn sannreyndi — hún er EKKI endurnotkun á #429's óbirtu next-task-proposal.md (sem approved-prompt-v1.md bannar sérstaklega).

**Leiðrétt (v2): rannsóknarniðurstaðan fyrir þessa upplýsingasýn er PARTIAL/PARTIAL, ekki PASS/GO** (sjá `research-report.md` Síða 1, R1). Þetta ÚTILOKAR EKKI að þessi minni miði sé smíðaður — en forsendulistinn hér að neðan verður að vera heiðarlegur um ÓLEYSTU réttindamálin (Open-Meteo, Veðurstofa) sem settu þakið, ekki fela þau á bak við "rannsókn sýndi GO".

## Afmörkun

**Nákvæmlega** sú þrönga upplýsingasýn sem skilgreind er í `pre-sample-plan.md` §1: heimildarmerkt ástand/lokun/athugun/spá fyrir 13 opinberlega staðfesta, samfellda Hringvegar-kafla milli Rauðavatns og Víkur, við notandaskilgreinda ETA-tímapunkta. **EKKI** leiðarvalsreiknirit, áhættumat, sjálfvirk hálku-/skafrenningstúlkun, "best time to go"-bestun, eða UI.

## Markmið

Smíða EINA read-only API-aðgerð, `GET /api/route-conditions-483?eta=<ISO8601>`, sem skilar — fyrir hvern af þeim 13 köflum í `route-segments.csv` — núverandi færðarástand (`faerd2017_1`), virk punkta-atvik (`faerdpunktar2017_1`) sem vísa í þann kafla, nýjustu tiltæku DATEX-mælingu EÐA Veðurstofu-athugun ef stöð er innan **3km** (sama mark og þessi rannsókn notaði — rannsóknarverkfræðilegt val, ekki öryggisviðmið, ÞARF að vera skráð þannig í kóðanum), og spá fyrir notandaskilgreinda ETA-tímann. Hvert svið með eigin tímastimpli/heimild. Engin samantekin einkunn.

## Gagnaboð, bundið af þessari rannsókn

- **Kaflar**: nákvæmlega þeir 13 í `route-segments.csv` (frosið, EKKI reiknað á keyrslutíma úr WFS — WFS-fyrirspurnin sem fann þá er sannreynd en TÍMAFREK/stór, ekki ætluð til endurtekinnar framleiðslu-keyrslu án skyndiminnis).
- **Athugun**: EF Veðurstofu-stöð EÐA DATEX-mælipunktur er innan 3km af kaflanum (sjá `coverage.csv` dálkinn `station_within_3km`, reiknað með punkt-til-línu fjarlægð, leiðrétt v3/N1 — EKKI næsta-hnitpunkts), nota hann; ANNARS skila `"observation": "UNKNOWN"`. Núverandi gögn: aðeins kaflar `252090037`/`253020037` (Hellisheiði/Sandskeið) hafa stöð innan marka (22,7m/81,3m). Orðalag API-svars ÞARF að segja "nærstöð innan 3km frá EINUM PUNKTI á kaflanum", EKKI "kaflinn er dekkaður" (leiðrétt v3/N7: hlutfalls-fullyrðingar um kaflaþekju eru FJARLÆGÐAR, ekki endurteknar). 11 af 13 köflum skila `UNKNOWN` við fyrstu útgáfu, þetta er VÆNT HEGÐUN, ekki villa.
- **Lokunar-samtenging (leiðrétt v3, N1)**: punkta-atvika-samtenging VIÐ kafla ÞARF að nota punkt-til-línu fjarlægð (ekki næsta-hnitpunkts) — þessi rannsókn fann að næsta-hnitpunkts-aðferð gaf RANGA niðurstöðu (310m í stað réttra 0,138m) fyrir eitt raunverulegt atvik. Kóði sem notar næsta-hnitpunkts-fjarlægð til samtengingar mun gefa ranga "ekki tengt"-niðurstöðu fyrir atvik sem ERU á kaflanum.
- **Sýnileikis-/útrunnin-regla (ný, N3)**: API-svar/skjölun ÞARF að fylgja reglunni sem lögð er fram í `research-report.md` §2: tímastimpill+aldur ALLTAF sýndur, óþekktur tímastimpill=óþekktur ferskleiki, útrunnið atvik ≠ sönnun um greiðfært, þekkt lokun ekki ógilt af spá, vantandi/of-gömul krafin heimild=ófáanlegt (EKKI sjálfgefið opið). `GildirTil`-gildi langt í framtíðinni (t.d. 2029) ÞARF að birtast með skýringu að það sé framkvæmdaleyfi, ekki ETA-ábyrgð.
- **Lokanir**: SAMEINA `faerd2017_1` (kafla-stigs ástand), `faerdpunktar2017_1` (punkta-atvik með `GildirTil`) OG kafla-reitinn `AstandVidbotaruppl` (`ALLUR_AKSTUR_BANN` getur birst þar EÐA í punkta-`Astand` — leiðrétt v2, A5) — ENGIN þessara kemur í stað annarrar. Óþekkt `Astand`-gildi (t.d. `GRJOTHRUN`, `HOLUR_I_VEGI`, `TONN_ALLS` — fundin lifandi, ekki í eigandaskjali) berast ÁFRAM með upprunatexta, ALDREI kortlögð sem "opið".
- **Spá**: Open-Meteo, EITT atriði úr svarinu sem er BINDANDI: **lesa `hourly_units`-reitinn úr HVERJU svari og skila honum ÁFRAM óbreyttum í API-svarinu** — þessi rannsókn fann að þessi lotu's eigin beiðni (án `wind_speed_unit`) fær `km/h`; kóði sem gefur sér fasta einingu er rangur af hönnun óháð því hvað #429 fékk.
- **Leyfisskylda tilvísun**: HVERT API-svar (eða að minnsta kosti skjölun endapunktsins) VERÐUR að innihalda Vegagerðar-tilvísunina sem skilmálarnir krefjast (nafn leyfisgjafa, heiti gagnasetts, ÖFLUNARDAGSETNING hvers straums — EKKI PDF-prentdagsetning, tilvísun CC BY 4.0) — þetta er BINDANDI skilyrði leyfisins, ekki valfrjáls kurteisi. Gildissvið leyfisins per einstaka þjónustu er ÁLYKTUN (leiðrétt v2, S2) — ekki fullyrt sem orðrétt staðfest.
- **Full ID-vörsla (leiðrétt v2, A1)**: varðveita heila (9-10 tölustafa) `IDBUTUR`-gildi, EKKI stytta; samræma JSON-float (`506070037.0`) í heiltölu/streng FYRIR samtengingu; kafli sem vantar í `faerd2017_1`-svari skilar `"roadState": "unavailable"`, EKKI "ekkert mál".

## Skrár

- Ný skrá: `api/route-conditions-483.js` (sama munstur og `api/forecast.js`).
- Ný skrá: `src/lib/routeConditions483.js` (hrein samsetningarfunkt).
- Ný skrá: `src/config/routeSegments483.js` (frosinn, hardcoded listi — BEINT afrit af `route-segments.csv`, EKKI reiknað úr WFS á keyrslutíma).
- ENGIN breyting á `src/lib/routeRisk.js` eða neinu Route Planner-tengdu — óviðkomandi, staðfest #429 §8.
- ENGIN UI-skrá — afhendingin er API-svar.

## Samþykktarviðmið (AC)

- [ ] `GET /api/route-conditions-483?eta=<future-ISO8601>` skilar 200 með öllum 13 köflum, hvert með `roadState`, `pointIncidents[]` (getur verið tómt), `observation` (eða `"UNKNOWN"`), `forecast` (með `windUnits`-reit sem ÞARF að koma úr Open-Meteo-svarinu, ekki hardcode-að), og `fetchedAt` per hluta.
- [ ] Ef `eta` er utan `forecast_days`-glugga, skilar `"forecast": "BEYOND_HORIZON"`.
- [ ] Ef `faerd2017_1`-fyrirspurnin bilar, skilar `"roadState": "UNKNOWN"` fyrir ALLA 13 kafla — EKKI fallback í "open".
- [ ] Attribution-texti til staðar í svari eða skjölun, orðrétt samkvæmt skilmálunum.
- [ ] Einingaprófanir: öll 3 athugunarástand (stöð innan marka / engin stöð / DATEX-sönnuð villa), `BEYOND_HORIZON`, `faerd2017_1`-bilun, og EININGAMISRÆMI-prófun (hermt svar með `km/h` og annað með `m/s`, staðfesta að API-svarið beri réttan reit áfram í báðum tilvikum).
- [ ] (Leiðrétt v2) Óþekkt `Astand`-gildi berast áfram með upprunatexta, ekki sleppt eða kortlögð sem opið — prófað með hermdu, ekki-í-eigandaskjali-skráðu gildi.
- [ ] (Leiðrétt v2) Heil `IDBUTUR`-gildi varðveitt, JSON-float samræmd í heiltölu/streng, kafli sem vantar í svari skilar `"unavailable"`.
- [ ] (Leiðrétt v2) Aldur (`DagsSkrad`) per kafla sýndur í svari/skjölun, ekki falinn — merktur `UNKNOWN` ef tímstimpill vantar.
- [ ] (Nýtt v3, N1) Punkta-atvika-samtenging við kafla nota punkt-til-línu fjarlægð, EKKI næsta-hnitpunkts — einingaprófun með atviki sem er raunverulega á kaflanum EN fjarri öllum skráðum hnitpunktum (eins og atvik 67862 í þessari rannsókn).
- [ ] (Nýtt v3, N3) Sýnileikis-/útrunnin-reglan (research-report.md §2) útfærð: aldur sýndur, óþekkt=óþekkt, útrunnið≠greiðfært, lokun ekki ógilt af spá, vantandi krafin heimild=ófáanlegt. `GildirTil` í fjarlægri framtíð merkt sem framkvæmdaleyfi, ekki ETA-trygging.
- [ ] (Nýtt v3, N4) HTTPS-staða API-kalla til Vegagerðarins skráð PER ÞJÓNUSTU í skjölun — punktafóðrið hefur ENGA staðfesta HTTPS-stuðning (aðeins HTTP reynt í þessari rannsókn); framleiðslukóði ætti að staðfesta þetta sjálfstætt áður en treyst er á dulkóðun fyrir þá þjónustu.

## Utan umfangs

Varasjóðsstöðvar (Selfoss/Vík, ef vill bæta við 2 fleiri stöðvum, þarf fyrst ferska sókn og 3km-mark endurreiknað fyrir þær); ellipsoid-geodesic nákvæmni; leiðin Rauðavatn→Reykjavík-miðborg ("kaflasvæði 0": leiðrétt v3/N6 — EKKI aðeins "lengd óreiknuð", heldur er sjálf spurningin HVAÐA vegamót er "réttur" endapunktur ÓSVARAÐ, vegna umvörpunarhindrunar; sjá `coverage.csv` röð 0) — þessi miði nær AÐEINS yfir Rauðavatn→Vík, ekki alla leið inn í miðborgina; leiðir B/Akureyri og C/Borgarnes (utan þessa miða, sjá #429); `roadconditions_lineincident`; `vedur2014_1`-lifandi sýni; sjálfvirk túlkun af nokkru tagi.

## Vinnumatstal

**2–3 dagar** fyrir einn þróunaraðila sem þekkir kóðabasann, GEFIÐ að: (a) Vegagerðar-skilmálar eru samþykktir af eiganda sem fullnægjandi fyrir þessa notkun (CC BY 4.0 með tilvísunarskyldu, gildissvið per þjónustu ÁLYKTAÐ ekki orðrétt staðfest — líklega nægilegt en EKKI eigandi-staðfest ÁKVÖRÐUN enn), (b) Open-Meteo production-réttindi (#453) eru óbreytt frá núverandi ástandi appsins OG eigandi samþykkir að byggja á þeim óbreyttum þrátt fyrir að rannsóknin sjálf grædaði þetta PARTIAL, EKKI GO, vegna þeirra. Ef eigandi vill EKKI byggja meðan þessi tvö atriði eru óleyst, er rétta næsta skrefið að FYRST leysa þau (eigandaákvörðun, ekki rannsóknarverkefni), ekki þennan kóðamiða.

## Rökstuðningur

Þessi miði er minnsti raunhæfi næsti skref sem **(a)** nýtir beint sannreynda 13-kafla keðju og 3km-athugunarmark þessarar rannsóknar, **(b)** innbyggir BÁÐAR nýjar lexíur (tvíhliða lokunarstraumur, einingaóvissa) sem kóðakröfur frá fyrsta degi, ekki eftir-á-lagfæringar, og **(c)** krefst ENGRAR frekari rannsóknar til að byrja — allar forsendur hans eru þegar frosnar og sannreyndar hér.

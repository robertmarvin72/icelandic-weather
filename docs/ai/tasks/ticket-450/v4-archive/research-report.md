# Ticket #450 — Rannsóknarskýrsla: Open-Meteo, DMI/IG, íslensk veðurlíkön og athuganir

**v4 (fjórða leiðrétt útgáfa, W1–W4-afmörkuð).** v1/v2/v3 eru varðveittar óbreyttar í `v1-archive/`/`v2-archive/`/`v3-archive/` (öll með sömu SHA256-gildi og upprunalega, staðfest í `cc-report.md`). Engin ný veður-/athugana-/GRIB-fyrirspurn var gerð í neinni leiðréttingarlotu; í v2-lotunni var gerð **ein** ný, aðskilin **vörulista**-fyrirspurn (Veðurstofu stöðvaskrá — ein HTTP-fyrirspurn sem skilaði tveimur skrám, líkama + hausum; ekki tvær fyrirspurnir), sem J4/J6 leyfa sérstaklega. Engin ný fyrirspurn er gerð í v3- eða v4-lotunni. v4 er hrein tilvísunar-/orðalags-/talningarleiðrétting (W1–W4) — engin ný rannsóknarniðurstaða umfram þessar fjórar lagfæringar.

## v2-leiðréttingar — kortlagning á R1–R7

| Niðurstaða Jonesy | Breytt hér | Staða |
|---|---|---|
| R1 — ákvörðunarminnisblað stenst ekki eigin sönnunargögn | Minnisblaðið að neðan, `provider-matrix.csv` raðir 14/óháð, `source-register.md` | Lagfært (sjá líka v3 V3 að neðan) |
| R2 — §5 ósannað ECMWF/GFS/ICON-fullyrðing, ósamræmi við varðveitt sýnishorn | §5 að neðan, ný samanburðarskrifta (`research-tools/compare-baseline-vs-dmi-seamless.mjs`) | Lagfært (sjá líka v3 K3/K4 að neðan) |
| R3 — athugana-samningur hvorki gerður né merktur NOT STARTED | §2 að neðan, `provider-matrix.csv` röð 37 | Lagfært í v2; tölur leiðréttar aftur í v3 (sjá V1) |
| R4 — punkta-/hæðartúlkun og uppruni | §3 að neðan | Lagfært |
| R5 — endurgerðarhæfni (nákvæmar slóðir/tímar) | `samples/manifest.md` | Lagfært (flestar slóðir reyndust EXACT úr eigin CC-lotu) |
| R6 — DMI-vörulistagögn ekki sótt | Nú efst í **§8. Næsta skref** (nýr hluti, v3) | Viðurkennt, ekki framkvæmt (valfrjálst) |
| R7 — orðalag um norðurljósa-villu | **⚠ Leiðrétt tilvísun (v4, W1/L2a):** fyrri útgáfa þessarar raðar vísaði á minnisblaðskafla sem heitir „Mikilvægur hliðarfundur" — **sá kafli er ekki til** í núverandi skjali (aldrei endurskapaður eftir v1→v2-umskrifun). Rétta staðsetningin er `research-report.md` **§1, lína 62** (síðasta setning efnisgreinarinnar), sem hljóðar nákvæmlega svo: „**Leiðrétt orðalag (R7):** þetta hefur áhrif á `high_wind`-**flaggið** eingöngu; tölulegt norðurljósastig breytist ekki af þessu (staðfest í kóðaathugasemd við `auroraScoring.js:70,334-336`). Hversu oft flaggið kviknar í raun, og hvort/hvernig það birtist notanda, var **ekki mælt** í þessari rannsókn — fyrri orðalag um að það „kvikni nánast alltaf" var mat, ekki mæling, og er hér með dregið til baka." | Lagfært (sjá líka v4 W1 að neðan) |

## v3-leiðréttingar — kortlagning á V1–V3, N1, K3, K4

| Niðurstaða Jonesy (v2 narrow re-check) | Breytt hér | Staða |
|---|---|---|
| V1 — null-talningar í §2 röngar (22/25 í stað 20/27 af 47) | §2 að neðan, ný tafla-skrifta (`research-tools/observation-field-table.mjs`), `provider-matrix.csv` röð 37, `source-register.md` V5 — allar með sýnilegri „SUPERSEDED"-merkingu við gömlu töluna | Lagfært, sjálfstætt endurreiknað |
| V2 — engin raunveruleg „næsta skref"-málsgrein til þrátt fyrir tilvísanir | Ný **§8. Næsta skref** hér að neðan; tilvísanaprófun framkvæmd (sjá neðst í þeim kafla) | Lagfært |
| V3 — GO-raðir í minnisblaði of sterkar miðað við sönnunargögn | Minnisblaðsraðir 1 og 4 endurorðaðar | Lagfært |
| N1 — orðalagsslys (ein fyrirspurn/tvær skrár, „grid elevation", stöðvakóðar, J1-note10) | Hér að ofan, `provider-matrix.csv` raðir 9–10, §2 (stöðvakóðar), `cc-report.md` | Lagfært |
| Ripley K3 — „sama undirliggjandi afurð" orðalag | §1, §5 að neðan, `provider-matrix.csv` röð 3, `source-register.md` E4 | Lagfært |
| Ripley K4 — tímabilaskipting námunduð á klukkustund í stað raunverulegs tímastimpils | §5 að neðan (18/72/78 í stað 17/72/79) | Lagfært |

## v4-leiðréttingar — kortlagning á W1–W4 (Jonesy v3 narrow re-check)

| Niðurstaða Jonesy (v3 narrow re-check) | Breytt hér | Staða |
|---|---|---|
| W1 — tilvísanir í ólistaðan „Mikilvægur hliðarfundur"-kafla; fölsk „zero broken references"-fullyrðing; ónákvæm tilvísun í cc-report-úttak; óljós „sjá §1/S8" | Núverandi (eftir þessa umferð) línunúmer í þessu skjali: **15** (R7-röð), **59** (Grep-staðfesting), **87** (S8-tilvísun), **175** (Tilvísanaprófunarmálsgrein); `cc-report.md` línur **155**, **226**; full tilvísanaskrá með öllum línunúmerum og SHA256-gildum á skoðunartíma í **`reference-check.md`** (nýtt, sjá W4) — **athugið (v4/L2e):** þar sem þetta kort er sjálft hluti skjalsins, breytast þessi línunúmer við hvern eftirfarandi lestur/innskot; `reference-check.md` er þar með eina örugga, tímasetta heimildin, ekki þessi tafla | Lagfært |
| W2 — tímabilasamanburður skorti breytu-/tímabila-sundurliðun (18/72/78), aðeins heildartölur gefnar | §5 að neðan, nýtt úttak `research-tools/compare-baseline-vs-dmi-seamless.output.txt` (6 raðir: 2 breytur × 3 tímabil) | Lagfært |
| W3 — „stöðin vanti skynjara"-ályktun í §2 (null-gilda-röðinni) og í `provider-matrix.csv`-fylkisröðinni „Missing/quality data handling" fór fram úr gögnum. (**Talningarsamræmi, v4/W1/L2e:** Jonesy's L4 kallar þessa CSV-röð „row 36" (gagnaraðatalning án fyrirsagnar); þessi skýrsla og fyrri útgáfur kalla sömu, eðlisfræðilega röð „röð 37"/„row 37" (skráarlínutalning með fyrirsögn talin með) — **sama líkamlega röð, tvær mismunandi talningarvenjur, ekki tvær mismunandi raðir** — hér er skráarlínutalning (37) notuð áfram samkvæmt venju restar skjalsins.) | §2 að neðan (null-gilda-röðin), `provider-matrix.csv` röð 37 að neðan — INFERRED/skynjara-ályktun fjarlægð, orsök núll-gilda er ÓÞEKKT | Lagfært |
| W4 — tilvísanaprófunarniðurstaða hvergi vistuð; mögulegt hringvísunarvandamál | Ný skrá **`reference-check.md`** (aðferð, SHA256, full tafla, ólausnar-talning, lokagreinar fyrir „hliðarfund"/„vanti þessa skynjara"/„zero broken"/„reproduced inline") — bæði `research-report.md` og `cc-report.md` vísa á þessa einu staðsetningu | Lagfært |

Eigandi staðfesti beint í Ripley-spjalli að áskrift að Open-Meteo sé greidd (OWNER-CONFIRMED, 2026-10-19). Áætlun/réttindi og hvort framleiðsla noti samsvarandi aðgang eru áfram **ÓÞEKKT** — greiðsla ein og sér staðfestir hvorugt. Þetta er eigandayfirlýsing, ekki sjálfstætt staðfest reikningsgagn. Þessi eigandastaðfesting er ekki framleiðslu-samþykki (owner action, ekki GO) — sjá endurorðaða minnisblaðsröð 1 að neðan.

---

## Ákvörðunarminnisblað (lesið fyrst)

### Eigandaspurning (efst, áður en nokkur GO/NO-GO er lesin)

**Hvaða Open-Meteo-áætlun/réttindi gilda í framleiðslu, og notar hver leið í appinu samsvarandi aðgang?**

Þekkt úr geymslusafninu: `api/forecast.js` les `process.env.OPEN_METEO_API_KEY` og velur `customer-api.open-meteo.com` ef hann er settur, annars almenna `api.open-meteo.com`; `.env.example` nefnir **ekki** `OPEN_METEO_API_KEY`; `api/_lib/auroraDecision/openMeteo.js` notar **alltaf** almenna (public) vefslóðina, óháð lykli. Eigandi staðfestir að greidd áskrift er til (sjá að ofan). Óþekkt: hvaða áætlun/stig er keypt, nákvæm samnings-/leyfisskilmálar hennar, og hvort framleiðsluumhverfið notar lykilinn í raun (þ.e. hvort `OPEN_METEO_API_KEY` er sannarlega sett í Vercel). Engin ályktun er dregin um samræmi eða vanefnd — þetta er hreinlega opin spurning sem aðeins eigandi/innviðaaðgangur getur svarað, ekki þessi rannsókn (H2-mörk: engin umhverfisskrá var skoðuð).

### Hvaða notkun er studd af hvaða sönnunargögnum

| Fyrirhuguð notkun | Niðurstaða | Hvaða hólf (provider-matrix.csv) þetta hvílir á |
|---|---|---|
| Halda áfram að nota Open-Meteo `best_match` fyrir núverandi 7 daga spá appsins | **OWNER ACTION / PARTIAL** (v3-leiðrétt per K5.2 — ekki lengur GO, orðalagið „núverandi tæknileg notkun er þegar réttilega útfærð" er fellt niður: skýrslan sjálf skráir F1 (norðurljósa-eininga-flagg), F2 (ósamræmi í veðurkóðalistum) og F3 (dauður Workbox-regla) — ekkert af þessu er „rétt útfærsla" fullyrðing sem rannsóknin getur gefið) | Þröngar spurningar fyrir eiganda: (1) hvaða áætlun/stig er keypt (OWNER-CONFIRMED að greiðsla er til, en ekki stigið sjálft); (2) hver eru nákvæm samnings-/réttindaskilmál hennar; (3) notar hver framleiðsluleið (sérstaklega norðurljósaleiðin, sem alltaf notar almenna vefslóð óháð lykli) samsvarandi aðgang. Þetta er eigandaaðgerð (athuga reikning/samning), ekki rannsóknarskref sem CC getur framkvæmt |
| Taka ákvörðun um beina DMI-tengingu (framhjá Open-Meteo) | **PARTIAL** — ófullnægjandi sönnunargögn til að heimila flutning, ekki „ófæranlegt" | Lén-auðkenning (DINI vs. IG) er **UNKNOWN**, staðfest með raunverulegri fyrirspurn (ekki bara skjalalestri); ekkert GRIB-sýnishorn var sótt (**NOT STARTED**, ekki „ekki tiltækt"); leyfi/aðgangur er VERIFIED DOCUMENTATION (ókeypis, lykillaus frá des. 2025). Fyrsta skref ef haldið er áfram: sjá **§8. Næsta skref** |
| Nota Veðurstofunnar eigin HARMONIE-líkan beint | **PARTIAL** — ófullnægjandi sönnunargögn, ekki „ófæranlegt" | Líkanið sjálft er VERIFIED DOCUMENTATION (2,5km/66klst/4x-daglega); engin opinber spá-API-leið fannst í **einni** tilraun (`api.vedur.is` hefur aðeins athuganir) — þetta er takmörkuð leit, ekki sönnun um að engin slík leið sé til |
| Nota `api.vedur.is` (athuganir) sem viðbótar- eða staðfestingargagn fyrir núverandi veður | **PARTIAL** (v3-leiðrétt per K5.2 — ekki lengur hrein GO): fyrsta skref er að **staðfesta hvaða breytur næstu virku stöðvar raunverulega skila, sérstaklega úrkomu**, áður en nokkur tilraunasamanburður er gerður — nálægð stöðvar ein og sér er ekki næg forsenda | Leyfi CC BY 4.0 er VERIFIED DOCUMENTATION; einingar/mælitímar eru VERIFIED SAMPLE; en skynjarhæð, tímabelti, endurskoðunarstefna og gæðaflögg (utan `count_measurements`) eru **UNKNOWN/NOT STARTED** (sjá §2). Nýtt (v3): næsta sjálfvirka („sj") stöð er ekki endilega úrkomustöð („ur") — fjarlægð í sérstaka úrkomustöð er **45,55 km** (Keflavík), **3,72 km** (Ísafjörður), **65,33 km** (Hveravellir), **24,42 km** (Egilsstaðir) — sjá §2 og `research-tools/nearest-station-distance.output.txt` |
| Nota rannsóknina til að ákveða 72-klst-sértæka reglu eða afgerandi „bestu" gagnaveitu | **NO-GO** (þetta er eina hreina NO-GO-röðin — studd af vöntun á mælingavottun, ekki af NOT STARTED/UNKNOWN hólfum) | Engin mælingavottun (athuganir bornar saman við spár á sama tíma/stað) var framkvæmd í þessari né fyrri lotu |

**Grep-staðfesting (J2, endurkeyrt í v4 — W1/L2c leiðrétting: nákvæmt úttak gefið beint hér í stað óljósrar tilvísunar í „cc-report.md, v3-kafla" sem reyndist ekki vera staðfestanleg sem nákvæm tilvitnun):**

```
grep -rniE "NO-GO" research-report.md provider-matrix.csv source-register.md
```
Nákvæmt úttak (keyrt eftir allar v4-breytingar): 2 samsvörun, bæði í `research-report.md` — línan sem kynnir „GO/NO-GO" í fyrirsögn þessa kafla, og hin eina rétt rökstudda NO-GO-röð sjálf (mælingavottunarröðin). `provider-matrix.csv` og `source-register.md` sýna núll „NO-GO"-tilvik. Engin röð er lengur merkt hrein „GO" — eftir leiðréttingarnar eru allar raðir annaðhvort PARTIAL, OWNER ACTION/PARTIAL, eða hin eina NO-GO.

### „IG" og rekstraraðilar — óbreytt frá v1, staðfest aftur

Sjá v1-niðurstöðu (óbreytt, ekki gagnrýnd af Jonesy): DMI-frumheimild nefnir „IG" = „Iceland and Greenland"; Veðurstofa keyrir sitt eigið, aðskilið HARMONIE; Open-Meteo notar DMI (ekki Veðurstofu) fyrir Ísland sjálfgefið; nákvæmt undirlén (DINI/IG) er áfram **UNKNOWN**, nú staðfest tvöfalt: bæði með því að `models=dmi_seamless` sýnir ekkert lén-auðkenni í svarinu, OG — nýtt í þessari lotu — með beinum samanburði sem sýnir að grunnbeiðni appsins og `dmi_seamless`-tilraunin skiluðu **nákvæmlega sömu** 168 klukkustunda gildum fyrir hita og vind á þessum eina punkti (sjá §5). **(v3-leiðrétt per K3):** þetta sýnir **jafngildar runur** (`equal series`) á þessum eina punkti/tíma/tveimur breytum — **ekki** að sjálfgefið val „leysi til sama undirliggjandi afurðar" eða neina líkans-/vöru-auðkenningu. Líkans-/vöruauðkenni sjálfgefna valsins er áfram **UNKNOWN**, og tilraunabeiðnin (`dmi_seamless`) var sjálf aðeins sótt á **endurgerðum** (RECONSTRUCTED) tíma, svo jafnvel „sama keyrslulota" er ekki staðfest.

---

## 1. Gagnaflæði appsins — óbreytt frá v1

(Óbreytt frá v1 — Jonesy gerði enga athugasemd við þennan kafla. Sjá `v1-archive/research-report.md` §1 fyrir óstytt efni; endurtekið ekki hér til að halda þessari skýrslu stuttri eins og tilskipunin biður um.)

Stysta samantekt: `src/lib/forecastCache.js` er eini skjólstæðingurinn sem kallar `/api/forecast` (8 neytendur neðar í keðjunni); framleiðslu-proxy (`api/forecast.js`) setur FASTAN daily/hourly-lista óháð því sem skjólstæðingurinn bað um (þ.m.t. viðbótarreitir fyrir Northern Lights); þróunar-proxy (vite) fer framhjá þessu og sendir skjólstæðingslistann beint á almenna Open-Meteo-slóð, aldrei með lykli. Sjálfstæð leið: `api/_lib/auroraDecision/openMeteo.js`, sem fær sjálfgefið km/klst-vind vegna vöntunar á `windspeed_unit`-breytu — samanborið við `HIGH_WIND_MS_THRESHOLD=12` í `auroraScoring.js` eins og um m/s væri að ræða. **Leiðrétt orðalag (R7):** þetta hefur áhrif á `high_wind`-**flaggið** eingöngu; tölulegt norðurljósastig breytist ekki af þessu (staðfest í kóðaathugasemd við `auroraScoring.js:70,334-336`). Hversu oft flaggið kviknar í raun, og hvort/hvernig það birtist notanda, var **ekki mælt** í þessari rannsókn — fyrri orðalag um að það „kvikni nánast alltaf" var mat, ekki mæling, og er hér með dregið til baka.

---

## 2. Athuganir vs. spá — athugana-samningur (leiðrétt, R3)

| Atriði | Staða | Heimild/ástæða |
|---|---|---|
| Gagnategund (`api.vedur.is`) | Athuganir frá sjálfvirkum stöðvum (ekki spá) | VERIFIED DOCUMENTATION (`vedur-openapi.json`) |
| Skynjarahæð (hæð mælis yfir jörðu) | **NOT STARTED** | Ekkert í varðveittum gögnum nefnir skynjarahæð; vindmeðaltalstíminn (10 mín o.s.frv.) er **ekki** hæð, og stöðvarhæð (`ele`, t.d. Keflavík 50,9m) er landhæð stöðvarinnar, ekki mælishæð vindmælis (oftast 10m skv. alþjóðlegum staðli, en það er **bakgrunnsþekking, ekki staðfest hér**, merkt INFERRED ef notað) |
| Tímabelti tímastimpla | **UNKNOWN** | Ekkert `UTC`/`GMT`/`timezone`-orð finnst í `vedur-openapi.json` (staðfest með textaleit — núll tilvik). Bakgrunnsþekking um að Ísland er UTC+0 allt árið er INFERRED, ekki úr varðveittum Veðurstofugögnum sjálfum |
| „Klukkustund 24"-venja | Svarað beint úr sýnishorni | Fyrsta röð `vedur-obs-1350-20261018.json`: `time: "2026-10-18T00:00:00"` en `day: 17, hour: 24` — þ.e. kerfið lýsir sama augnabliki sem „klukkustund 24 á degi 17" OG sem miðnætti dags 18 í `time`-reitnum. **Afleiðing (INFERRED, með rökstuðningi):** ef einhver framtíðarnotkun flokkar eftir `day`/`hour`-reitunum í stað `time`-reitsins, lendir þessi tiltekna klukkustund í **öðrum** almanaksdegi en `time` gefur til kynna — nákvæmlega sú tegund dagmarkavillu sem núverandi app forðast með því að nota `time`-strengi beint (**leiðrétt tilvísun, v4/W1/L2d:** sjá **§1 hér í þessu skjali** fyrir appsins eigin gagnaflæðislýsingu, og heimild **S8** í `source-register.md` fyrir `forecastNormalize.js`-dagmarkarútfærsluna sem lýsingin vísar til — fyrri „§1/S8" var tvíræð skástrik-nótun, nú skrifuð út sem tvær aðskildar, nafngreindar tilvísanir) |
| Gæðaflögg | Aðeins `count_measurements` fannst sem flagg-líkur reitur (ekkert `quality_flag`/`qc_flag`/„quality flag"-orð í skjölunum — staðfest núll tilvik í textaleit) | VERIFIED DOCUMENTATION (fjarvera staðfest) |
| Endurskoðunar-/úreldingarstefna (hvort gildi geta breyst eftir birtingu) | **UNKNOWN** | Ekkert „revision"/„revised" orð í skjölunum |
| `latest`-samningur (fyrir „núverandi veður") | Svarað beint úr sýnishorni | `/observations/aws/{aggregation}/latest`: skilar nýjustu mælingu á stöð, innan 24 klst. fyrir 10mín/klst-stig, 7 daga fyrir dag-stig o.s.frv. (VERIFIED DOCUMENTATION, `vedur-openapi.json`) |
| `r` (úrkoma) null-gildi | **24 af 24 röðum null** í eina varðveitta sýnishorninu (sótt ~18–41 klst. eftir mælingartíma). Merking óþekkt: getur þýtt enga úrkomu, enn óklára gæðaleiðréttingu, eða að þessi stöð vanti úrkomumæli — **ekkert af þessu er staðfest**, og null er hér **ekki** túlkað sem „engin rigning" | VERIFIED SAMPLE (talning), merking UNKNOWN |
| Önnur svæði — **⚠ SUPERSEDED (v3, K2):** fyrri útgáfa þessarar raðar nefndi „25 breytur" og „0 af 24 ekki-null" — **röng tala, leiðrétt hér að neðan**; upprunalega talan var reiknuð rangt (ekki endurspeglandi raunverulegan lykla-/gildafjölda í sýnishorninu) og lifir nú aðeins í `v2-archive/` sem söguleg villa. | Full, nákvæm tafla á öllum 50 lyklum (ekki bara flokkasamantekt) er í `research-tools/observation-field-table.output.txt` (vistað úttak handritsins `research-tools/observation-field-table.mjs`, les eingöngu varðveittu skrárnar, engin ný fyrirspurn). Staðfestar samantektartölur (tvö mismunandi nefnarar, bæði gefin upp skýrt): **(A) allir 50 lyklar** (þ.m.t. auðkennin `station`/`name`/`time`): **23 lyklar stöðugt ekki-null** + **27 lyklar stöðugt null** = 50/50. **(B) 47 gagnabreytur** (án auðkenna): **20 stöðugt ekki-null** + **27 stöðugt null** = 47/47. Engin breyta er aðeins **að hluta** null (0 af 50). `r` er meðtalin í 27-null-hópnum hér að ofan (sérstök röð fyrir hana er samt gefin, enda kjarnabreyta). Full lykla-/lýsingartafla (þ.m.t. að `d_txt` hefur enga skráða lýsingu, og `sal` hefur einingu skráða sem bókstaflega „?") er í handritsúttakinu. **⚠ Leiðrétt (v4, W3/L4):** fyrri útgáfa þessarar raðar ályktaði (INFERRED) að stöðug núll-gildi í öllum 24 röðum þýði að stöðin „vanti þessa skynjara" — **þessi ályktun er hér felld niður**, enda getur ein breyta (24 röð, 1 stöð, 1 dagur) ekki skilið á milli nokkurra jafn-mögulegra skýringa. Orsök núll-gildanna er og verður **ÓÞEKKT** úr þessu sýnishorni eingöngu. Mögulegar, jafn-óstaðfestar skýringar (engin þeirra er hér valin fram yfir aðra): (a) stöðin skortir viðeigandi skynjara fyrir þessa breytu; (b) skynjari er til staðar en viðeigandi gögn hafa ekki enn verið gæðayfirfarin/birt; (c) breytan er skráð almennt í API-samningnum en ekki virkjuð fyrir þessa tilteknu stöð; (d) einhver önnur, óþekkt ástæða. Enginn þessara valkosta er studdur sterkar en annar af þessu eina sýnishorni. | VERIFIED SAMPLE (talning, bæði nefnarar) + UNKNOWN (orsök núll-gilda — nokkrir jafn-mögulegir, óvalfnir valkostir taldir upp hér að ofan, ekki INFERRED-ályktun) |
| Fjarlægð stöðvar frá rannsóknarpunkti | Keflavík: **0,00 km** (punkturinn var sjálfur skilgreindur út frá stöðvarhnitum, því er fjarlægðin tilgangslaus sem fulltrúamæling, ekki „sönnun um gæði"). Hinir þrír punktar: leyst með **einni** nýrri, aðskildri vörulista-fyrirspurn (ein `GET /weather/stations`-fyrirspurn, öll virk stöðvagögn, sótt 2026-10-19 18:10:46Z, skilaði einum líkama + einum hausaskjali — ekki tvær fyrirspurnir, leiðrétt orðalag per N1) og haversine-fjarlægðarreikningi (`research-tools/nearest-station-distance.mjs`): Ísafjörður → næsta „virka" stöð (sjá skilgreiningu hér næst) „Ísafjörður - vindur" (IMO 2642, 2,2m hæð) **2,83 km** frá punktinum; Hveravellir → stöð „Hveravellir" (IMO 6935, **641m** hæð — þetta staðfestir töluna sem notuð var óstaðfest í v1, nú beint úr stöðvarskrá) **0,21 km**; Egilsstaðir → „Egilsstaðaflugvöllur" (IMO 4271, 23,5m hæð) **1,13 km**. „Virk" er hér skilgreint eingöngu sem `ending == null` í stöðvaskránni — þ.e. **landfræðileg/skráarsviðs-nálgun, ekki staðfesting á að stöðin skili tilteknum breytum né á dæmigerði hennar fyrir tjaldsvæðið**. Aðferð: hornbogaformúla (haversine) á kúlulaga jörð — tekur **ekki** tillit til vegalengdar eftir landslagi, hæðarmunar, skjóls í þröngum fjörðum, né mælisetu stöðvar/punkts | VERIFIED SAMPLE |
| Stöðvartegundir og úrkomu-sértæk nálægð (nýtt, v3/N1) | Varðveitti OpenAPI-samningurinn (`/stations` færibreytan `station_type`) skilgreinir sjálfur: `sj` = Automatic stations, `sk` = Synop stations, `ur` = Precipitation stations, `vf` = Climate stations. Þar sem úrkomuspurningin er opin (sjá **§8. Næsta skref**), var fjarlægð í næstu **virku `ur`-stöð** (úrkomusértæka) reiknuð sérstaklega úr sömu varðveittu skrá, engin ný fyrirspurn: Keflavík → „Vogsósar" (IMO 971) **45,55 km**; Ísafjörður → „Hnífsdalur" (IMO 253) **3,72 km**; Hveravellir → „Brúsastaðir" (IMO 333) **65,33 km**; Egilsstaðir → „Hánefsstaðir" (IMO 616) **24,42 km**. Næsta almenna (`sj`) stöð er m.ö.o. **ekki** endilega sú sem skilar úrkomu — fyrir 3 af 4 punktum er næsta úrkomustöð tugum kílómetra fjær en næsta almenna stöð. Full tafla í `research-tools/nearest-station-distance.output.txt` | VERIFIED DOCUMENTATION (kóðaskilgreiningar) + VERIFIED SAMPLE (fjarlægðir) |

---

## 3. Punktar og hæð — uppruni og túlkun (leiðrétt, R4)

**Umbeðin hnit** komu aðeins fram í texta v1-skýrslunnar sjálfrar (og, fyrir Keflavík, í varðveittri stöðvarskrá) — þau eru **ekki** til staðar í neinu varðveittu API-svari/-beiðni sjálfri. Það þýðir að tengingin milli hvers af 4 niðurstöðum í `openmeteo-baseline-4point.json` og nafngreinds punkts hvílir á **röð** gagnanna í fylkinu (sama röð og beðið var um) og er sennileikaprófuð með því að athuga að skilað hnit liggi innan nokkurra hundraðshluta úr gráðu frá umbeðnu hnitunum (sjá töflu að neðan) — **ekki** óháð staðfest úr svarinu sjálfu.

**Endurreiknaðir frávik** (umbeðið vs. skilað, bein úttekt úr varðveittu `openmeteo-baseline-4point.json`, óháð endurreiknuð — ekki afrituð frá Jonesy, en samhljóða):

| Punktur | Umbeðið (lat, lon) | Skilað (lat, lon) | Frávik (lat, lon) | Skilað `elevation` |
|---|---|---|---|---|
| Keflavíkurflugvöllur | 63.9828987122, -22.6005191803 | 63.99095, -22.606262 | +0,0081°, -0,0057° | 50m |
| Ísafjörður | 66.0750, -23.1200 | 66.10316, -23.131096 | +0,0282°, -0,0111° | 0m |
| Hveravellir | 64.8667, -19.5667 | 64.873634, -19.56276 | +0,0069°, +0,0039° | 633m |
| Egilsstaðir | 65.2669, -14.3948 | 65.26425, -14.385803 | -0,0027°, +0,0090° | 40m |

**Um `elevation`-reitinn:** þetta er gildið sem Open-Meteo skilar undir sinni eigin, skjalfestu hæðarmeðhöndlun (sjálfgefið 90m stafrænt hæðarlíkan notað til tölfræðilegrar niðurkvörðunar, sbr. heimild **E1** í `source-register.md` / `provider-matrix.csv` röð 8 — leiðrétt skástrika-nótun, v4/W1/L2e: „§-E1" var tvíræður samruni af kaflamerki og heimildarnúmeri, E1 er heimild (source-register.md), ekki kafli) — **ekki** endilega „reiknireits-hæð" eða „sjávarbotnshæð" í nokkrum sérstökum skilningi. Fyrri fullyrðing um að Ísafjarðar-punkturinn hafi lent á „sjávarreit" er hér **felld niður sem ósönnuð fullyrðing** (R4) — það eina sem er staðfest er að skilað `elevation`-gildi er 0m fyrir þennan punkt, sem er lágt og í samræmi við að punkturinn er nærri sjó í þröngum firði, en nákvæm orsök (vatnsreitur vs. einfaldlega lágur strandreitur) er **INFERRED**, ekki VERIFIED.

**Umbeðin hæð rannsóknarpunktanna sjálfra** er **UNKNOWN** fyrir Ísafjörð, Hveravelli og Egilsstaði — engin heimild var vitnuð í v1 fyrir þær (t.d. var „≈641m" fyrir Hveravelli notað án tilvitnunar). **Leiðrétting:** §2 hér að ofan staðfestir nú að Veðurstofu-stöðin „Hveravellir" (IMO 6935) er einmitt í 641m hæð — þessi tala er nú **tilvitnuð** (stöðvarskrá, ekki bakgrunnsþekking), en er samt stöðvarhæð, ekki endilega nákvæmlega sama hæð og Open-Meteo-reikniregilinn sjálfur stendur í.

**Keflavík 50m/50,9m samsvörunin** er hér útskýrð sem **eitt tilfelli af samræmi**, ekki sem „krossstaðfesting" eða almenn sönnun um nákvæmni Open-Meteo's hæðarlíkans — einn punktur dugar ekki til að alhæfa.

---

## 4. Samhæfni við núverandi normalization — óbreytt frá v1

(Óbreytt — Jonesy gerði enga athugasemd við þennan kafla. Sjá `v1-archive/research-report.md` §4.)

---

## 5. 0–72 klst. vs. lengra tímabil (leiðrétt, R2)

**Felld niður:** fullyrðingin um að dagar 3–7 séu blandaðir „ECMWF/GFS/ICON" — ekkert varðveitt gagn sýnir þetta (Open-Meteo's eigin `dmi-api`-skjal nefnir blöndun `dmi_seamless`-afurðarinnar við ECMWF IFS HRES eftir 2,5 daga, en appið sjálft sendir enga `models`-breytu, svo hvaða nákvæm blöndunarregla gildir fyrir sjálfgefið `best_match` er ekki staðfest hér).

**Nýtt, óháð endurreiknað (ekki bara endurtekið frá Jonesy):** keyrði `research-tools/compare-baseline-vs-dmi-seamless.mjs` á varðveittu skrárnar tvær (`openmeteo-baseline-4point.json`[0] fyrir Keflavík, og `openmeteo-dmi-seamless-experiment.json`). Niðurstaða:

- Punktaeinkenni eins í báðum skrám: `lat=63.99095 lon=-22.606262 elevation=50`, einingar `°C`/`m/s` eins.
- `temperature_2m`: 168 af 168 klukkustundargildum **nákvæmlega eins** í báðum skrám (engin misræmi, engin vöntun).
- `windspeed_10m`: sama — 168 af 168 **nákvæmlega eins**.
- **Tímabilaskipting (v3-leiðrétt, K4 — raunveruleg tímastimpilsútreikning, ekki námundun):** svarhaus `Date: Mon, 19 Oct 2026 17:47:22 GMT` er **þjónustusvartími, ekki sjálfstætt skráður staðartími**. Fyrri útgáfa (v2) námundaði þennan tíma niður í „17:00"-skrefið og taldi það skref vera „á/eftir sóknartíma" — en 17:00 er strangt til tekið **fyrir** 17:47:22, svo það skref á heima í „fyrir"-hlutanum. Leiðrétt, tímastimpilsbundin skipting (sama handrit, lagfært — gamla úttakið varðveitt í `v2-archive/`): **18 skref strangt fyrir** sóknartíma (2026-10-19T00:00 til 17:00), **72 skref frá og með fyrsta skrefi á/eftir sóknartíma** (2026-10-19T18:00 til 2026-10-22T17:00), **78 skref** þar á eftir. Þetta er leiðrétting á **aðferð**, ekki ný gögn — tölurnar 168/168/0/0 fyrir hita og vind breytast ekkert. Þetta 72-skrefa tímabil er talið frá **sóknartímanum sjálfum**, ekki frá neinni líkans-keyrslustund (sem er óþekkt — sjá `provider-matrix.csv`) — því má **ekki** kalla það „0–72 klst. af spánni sjálfri".
- **Talning á hverju tímabili fyrir sig (nýtt, v4/W2/L3) — áður var aðeins heildartala (168/168/0/0) gefin og tímabilaskiptingin eftirá ÁLYKTUÐ, ekki talin sérstaklega.** Handritið var útvíkkað (sama skrá, `research-tools/compare-baseline-vs-dmi-seamless.mjs`, keyrt að nýju — gamla, óútvíkkaða útgáfan varðveitt óbreytt í `v2-archive/` og `v3-archive/`) til að bera saman/telja samsvörun á **hverju af þremur tímabilunum fyrir sig**, fyrir **hvora breytu** — sex raðir í allt — með uppflettingu tilraunargagna eftir `time`-strengnum (ekki fylkisvísitölu) fyrir hvert tímabil:

  | Breyta | Tímabil A (18 skref) | Tímabil B (72 skref) | Tímabil C (78 skref) |
  |---|---|---|---|
  | `temperature_2m` | borið=18, samsvarar=18, misræmi=0, vantar í grunnlínu=0, vantar í tilraun=0 | borið=72, samsvarar=72, misræmi=0, vantar=0/0 | borið=78, samsvarar=78, misræmi=0, vantar=0/0 |
  | `windspeed_10m` | borið=18, samsvarar=18, misræmi=0, vantar=0/0 | borið=72, samsvarar=72, misræmi=0, vantar=0/0 | borið=78, samsvarar=78, misræmi=0, vantar=0/0 |

  Sjálfspróf handritsins staðfestir að summa allra þriggja tímabila fyrir hvora breytu er **nákvæmlega jöfn** heildartölunum að ofan (168/168/0/0 hvor breyta) — `self-check PASS: true` fyrir bæði `temperature_2m` og `windspeed_10m`. Vænt gildi (18/18, 72/72, 78/78, 0 misræmi) var hér **þversannreynt, ekki sett sem markmið** — ef misræmi hefði fundist hefði það verið skráð og greint án þess að breyta sýnishornunum. Fullt úttak handritsins (vistað með shell-tilvísun á stdout, aldrei `writeFileSync` innan handritsins sjálfs, per L3) er í `research-tools/compare-baseline-vs-dmi-seamless.output.txt`.

**Nákvæm túlkun (ekkert víðtækara, v3-leiðrétt per K3):** þetta sýnir **jafngildar runur** (`equal series`) fyrir þennan eina punkt, þessar tvær breytur, þessa einu sóknarlotu — **ekki** að sjálfgefið val „leysi til sömu undirliggjandi afurðar" eða neina líkans-/vöruauðkenningu. Rétt orðalag: jafngildi staðfest (VERIFIED SAMPLE, `equal series at this point/two variables/two responses`), en líkans-/vöruauðkenni sjálfgefna valsins er áfram **UNKNOWN**. Tilraunabeiðnin sjálf (`dmi_seamless`) var aðeins sótt á **endurgerðum** (RECONSTRUCTED) tíma — svo „sama keyrslulota" er heldur ekki staðfest, hvað þá hegðun á öðrum punktum/tímum/breytum eða framtíðar-/nákvæmnisgildi. DINI-vs-IG er áfram **UNKNOWN**.

Fyrstu ~60–72 klst. (eftir léni) koma frá DMI HARMONIE (skjalfest, `source-register.md` D2/E2); nákvæm blöndunarregla fyrir daga 3–7 í appsins sjálfgefna vali er **NOT STARTED** — ekkert í þessari rannsókn staðfestir hana umfram það sem Open-Meteo's eigin skjalasíða segir almennt um `dmi_seamless`-afurðina (ekki endilega sama og `best_match`).

---

## 6. Leyfi, aðgangur og rekstrarbyrði

(Óbreytt frá v1 fyrir DMI/Veðurstofu — sjá `v1-archive/research-report.md` §6. Open-Meteo-hlutinn er nú leiðréttur: sjá eigandaspurninguna efst í minnisblaðinu — greidd áskrift ER til (eigandastaðfest), en áætlun/stig/samræmi er áfram UNKNOWN, ekki lengur bara „ekki athugað".)

---

## 7. Óvissa og vöntuð staðfesting

- „IG" er áfram tilgáta, ekki staðfest sem nákvæmlega það sem sagt var á fundinum.
- DINI-vs-IG-val Open-Meteo er staðfest **tvöfalt óþekkt** núna (skjöl + bein tilraun).
- Skynjarahæð, tímabelti athugana, endurskoðunarstefna og flest gæðaflögg hjá `api.vedur.is` eru UNKNOWN/NOT STARTED, ekki giskuð.
- Engin mælingavottun milli spágilda og athugana var framkvæmd.
- Open-Meteo-áætlun/samningsskilmálar í framleiðslu eru áfram UNKNOWN þrátt fyrir staðfestingu á að greiðsla er til.
- DMI-vörulistagögn (til að leysa DINI-vs-IG endanlega) voru ekki sótt — merkt NOT STARTED, lagt til sem fyrsta skref ef rannsókn heldur áfram.

---

## 8. Næsta skref (nýr hluti, v3 — svarar R6/V2)

**Mikilvægt fyrst:** engin af eftirfarandi aðgerðum er hér með samþykkt eða framkvæmd. Þetta er aðeins uppskrift á röð og eðli næstu skrefa **ef** rannsókninni er fram haldið í framtíðarlotu, hver með sinni eigin samþykktarbeiðni (`approved-prompt`) — í samræmi við að þessi rannsókn í heild er lesin-aðeins og óheimilt er að gera nýja gagnabeiðni án sérstaks leyfis.

1. **DMI vörulista-/léns-lýsigögn fyrst (lestur skjala, ekki sótt í þessari lotu).** Áður en nein ný gagnabeiðni er gerð til DMI, ætti næsta lota að lesa (ekki sækja gögn frá, einfaldlega lesa skjalfest API-lýsigögn á `dmi.dk`/opnum vörulistasíðum þeirra) hvaða lén/afurðarkenni (t.d. `IG` vs. `DINI`) eru skráð fyrir opið aðgengi, og hvort auðkenni fylgir með í svörum þeirra API-leiða — þannig leysist DINI-vs-IG-óvissan (§5, §7) **án** þess að treysta á jafngildi-ályktun frá Open-Meteo-hliðinni. Þetta skref er NOT STARTED, ekki UNKNOWN: því hefur einfaldlega ekki verið leitast við.
2. **Skilyrt GRIB-sýnishorn (aðeins ef skref 1 bendir á raunhæfa leið, og þá með sérstöku samþykki).** Ef skjalalesturinn í skrefi 1 staðfestir aðgengilega, lykillausa GRIB-skrá fyrir réttan lén/afurð, væri næsta — algerlega aðskilið og sérstaklega samþykkt — skref að sækja **eitt** slíkt sýnishorn fyrir einn punkt/tíma, með sama beiðnafjölda-/User-Agent-aðhaldi og í þessari rannsókn, til að staðfesta lén-/afurðarauðkenni milliliðalaust frá frumheimild frekar en frá Open-Meteo's eigin svari.
3. **Hannaður athugana-samanburður (á eftir skrefum 1–2, ekki í staðinn fyrir þau).** Fyrsta hluti þessa skrefs er að **staðfesta hvaða breytur nálægar virkar stöðvar raunverulega skila** (§2's nýja stöðvartegundar-/úrkomufjarlægðartafla sýnir að næsta `sj`-stöð er ekki alltaf úrkomustöð) — ekki að gera ráð fyrir að nálægð þýði gagnaframboð. Aðeins eftir að það er staðfest væri hægt að hanna réttan mælingavottunar-samanburð (athugun á móti spá, sama stund/stað, sbr. §7's „engin mælingavottun var framkvæmd"). Hin varðveitta OpenAPI-forskrift nefnir sjálf (en er ekki sótt hér) `/capabilities`-endapunkt sem **gæti** verið gagnlegur vörulisti-uppspretta fyrir slíkt — nefnt hér aðeins sem mögulegur stuðull fyrir næstu lotu, ekki sem eitthvað sem var sótt eða staðfest í þessari.

**⚠ Tilvísanaprófun — v3-fullyrðingin hér var FÖLSK, dregin til baka (v4, W1/W4/L2c):** v3-útgáfa þessarar málsgreinar sagði „engin brotin tilvísun fannst / zero broken references found" byggt á einni grep-skipun sem leitaði aðeins að `§[0-9]`/„sjá kafla"/„næsta skref" — sú leit **missti** t.d. nafngreindu „Mikilvægur hliðarfundur"-tilvísunina (sem vísaði á kafla sem er ekki til, sjá leiðrétta R7-röð í kortlagningartöflunni hér að ofan) og aðrar nafngreindar/orðaðar tilvísanir (minnisblað/box/skrár-línu-tilvísanir). „Zero broken references" var þar með **ósannað og í þessu tilviki rangt** — ein brotin tilvísun var þegar til staðar sem leitin náði ekki. Full, endurgerð tilvísanaskrá — byggð á handlestri skjalanna, ekki einni grep-mynstri — er nú vistuð í **einum stað**: [`reference-check.md`](./reference-check.md). Sú skrá, ekki þessi málsgrein, er heimildin fyrir tilvísanastöðu; `cc-report.md` vísar einnig á sömu skrá (sjá v4-kafla þar), ekki hringvísun milli skjalanna tveggja.

---

## 9. Áhrif á #429 (Winter Route Advisor) og #419 (Ski Weather)

Óbreytt frá v1 — sjá `v1-archive/research-report.md` §8 (upprunalega tölusetningin; efni óbreytt, aðeins kaflanúmer breytt hér í v3 vegna innskots nýs §8 að ofan). Ekkert í v2- eða v3-leiðréttingunum breytir þeirri niðurstöðu.

---

## Viðaukar

- `provider-matrix.csv` — full gagnafylki, leiðrétt.
- `source-register.md` — allar heimildir, leiðrétt.
- `samples/` — hrá sýnishorn óbreytt (sömu 8 upprunaskrár, sömu SHA256), auk 2 nýrra vörulistaskráa frá þessari lotu, `manifest.md` með EXACT/RECONSTRUCTED/UNKNOWN merkingum.
- `research-tools/` — **leiðrétt, v4/W1/L2e (fann þrjár, ekki tvær skriftur):** þrjár samanburðar-/fjarlægðar-/talningarskriftur (Node, engar viðbótarpakkar — `compare-baseline-vs-dmi-seamless.mjs`, `nearest-station-distance.mjs`, `observation-field-table.mjs`) og vistuð úttök þeirra.
- `cc-report.md` — **leiðrétt, v4/W1/L2e:** aðferðir, með sérstökum köflum fyrir v2 (R1–R7 ráðstöfun), v3 (V1–V3/N1/K3/K4 ráðstöfun) og v4 (W1–W4 ráðstöfun, sjá einnig `reference-check.md`).
- `v1-archive/` — upprunalegar v1-skrár, óbreyttar.

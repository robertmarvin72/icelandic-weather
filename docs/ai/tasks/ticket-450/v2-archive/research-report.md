# Ticket #450 — Rannsóknarskýrsla: Open-Meteo, DMI/IG, íslensk veðurlíkön og athuganir

**v2 (leiðrétt útgáfa).** v1 er varðveitt óbreytt í `v1-archive/` (sömu SHA256-gildi og upprunalega `manifest.md`, staðfest í `cc-report.md`). Þessi útgáfa leiðréttir ákvörðunarminnisblaðið, §5 (sjóndeildarhringur), athuganakaflann og punkta-/hæðarumfjöllunina samkvæmt Jonesy's R1–R5 (`result-review.md`) og Ripley's J1–J8 (`approved-prompt-v2.md`). Engin ný veður-/athugana-/GRIB-fyrirspurn var gerð í þessari leiðréttingarlotu; aðeins tvær nýjar, aðskildar **vörulista**-fyrirspurnir (Veðurstofu stöðvaskrá, sjá `samples/manifest.md`) sem J4/J6 leyfa sérstaklega.

## v2-leiðréttingar — kortlagning á R1–R7

| Niðurstaða Jonesy | Breytt hér | Staða |
|---|---|---|
| R1 — ákvörðunarminnisblað stenst ekki eigin sönnunargögn | Minnisblaðið að neðan, `provider-matrix.csv` raðir 14/óháð, `source-register.md` | Lagfært |
| R2 — §5 ósannað ECMWF/GFS/ICON-fullyrðing, ósamræmi við varðveitt sýnishorn | §5 að neðan, ný samanburðarskrifta (`research-tools/compare-baseline-vs-dmi-seamless.mjs`) | Lagfært |
| R3 — athugana-samningur hvorki gerður né merktur NOT STARTED | §2 að neðan, `provider-matrix.csv` röð 37 | Lagfært (sum atriði UNKNOWN/NOT STARTED, heiðarlega merkt) |
| R4 — punkta-/hæðartúlkun og uppruni | §3 að neðan | Lagfært |
| R5 — endurgerðarhæfni (nákvæmar slóðir/tímar) | `samples/manifest.md` | Lagfært (flestar slóðir reyndust EXACT úr eigin CC-lotu) |
| R6 — DMI-vörulistagögn ekki sótt | Óbreytt forgangsröðun í næsta-skref-tillögu, núna efst | Viðurkennt, ekki framkvæmt (valfrjálst) |
| R7 — orðalag um norðurljósa-villu | Hér að ofan í minnisblaði og §-fyrirsögn hér að neðan | Lagfært |

Eigandi staðfesti beint í Ripley-spjalli að áskrift að Open-Meteo sé greidd (OWNER-CONFIRMED, 2026-10-19). Áætlun/réttindi og hvort framleiðsla noti samsvarandi aðgang eru áfram **ÓÞEKKT** — greiðsla ein og sér staðfestir hvorugt. Þetta er eigandayfirlýsing, ekki sjálfstætt staðfest reikningsgagn.

---

## Ákvörðunarminnisblað (lesið fyrst)

### Eigandaspurning (efst, áður en nokkur GO/NO-GO er lesin)

**Hvaða Open-Meteo-áætlun/réttindi gilda í framleiðslu, og notar hver leið í appinu samsvarandi aðgang?**

Þekkt úr geymslusafninu: `api/forecast.js` les `process.env.OPEN_METEO_API_KEY` og velur `customer-api.open-meteo.com` ef hann er settur, annars almenna `api.open-meteo.com`; `.env.example` nefnir **ekki** `OPEN_METEO_API_KEY`; `api/_lib/auroraDecision/openMeteo.js` notar **alltaf** almenna (public) vefslóðina, óháð lykli. Eigandi staðfestir að greidd áskrift er til (sjá að ofan). Óþekkt: hvaða áætlun/stig er keypt, nákvæm samnings-/leyfisskilmálar hennar, og hvort framleiðsluumhverfið notar lykilinn í raun (þ.e. hvort `OPEN_METEO_API_KEY` er sannarlega sett í Vercel). Engin ályktun er dregin um samræmi eða vanefnd — þetta er hreinlega opin spurning sem aðeins eigandi/innviðaaðgangur getur svarað, ekki þessi rannsókn (H2-mörk: engin umhverfisskrá var skoðuð).

### Hvaða notkun er studd af hvaða sönnunargögnum

| Fyrirhuguð notkun | Niðurstaða | Hvaða hólf (provider-matrix.csv) þetta hvílir á |
|---|---|---|
| Halda áfram að nota Open-Meteo `best_match` fyrir núverandi 7 daga spá appsins óbreytt, **sem nákvæmlega afmarkað næsta skref: staðfesta leyfisstöðu áður en nokkur stækkun eða ný notkun er byggð ofan á núverandi samband** | **GO** (fyrir þetta afmarkaða næsta skref eitt og sér — ekki „halda áfram óbreytt" sem fullyrðing út af fyrir sig) | Einingar/tímabelti rétt umbeðin (VERIFIED DOCUMENTATION + VERIFIED SAMPLE); leyfi fyrir ókeypis stig er VERIFIED DOCUMENTATION en viðskiptaleyfi/stig er **NOT STARTED** — GO hvílir ekki á því hólfi, heldur á að núverandi tæknileg notkun appsins er þegar réttilega útfærð |
| Taka ákvörðun um beina DMI-tengingu (framhjá Open-Meteo) | **PARTIAL** — ófullnægjandi sönnunargögn til að heimila flutning, ekki „ófæranlegt" | Lén-auðkenning (DINI vs. IG) er **UNKNOWN**, staðfest með raunverulegri fyrirspurn (ekki bara skjalalestri); ekkert GRIB-sýnishorn var sótt (**NOT STARTED**, ekki „ekki tiltækt"); leyfi/aðgangur er VERIFIED DOCUMENTATION (ókeypis, lykillaus frá des. 2025) |
| Nota Veðurstofunnar eigin HARMONIE-líkan beint | **PARTIAL** — ófullnægjandi sönnunargögn, ekki „ófæranlegt" | Líkanið sjálft er VERIFIED DOCUMENTATION (2,5km/66klst/4x-daglega); engin opinber spá-API-leið fannst í **einni** tilraun (`api.vedur.is` hefur aðeins athuganir) — þetta er takmörkuð leit, ekki sönnun um að engin slík leið sé til |
| Nota `api.vedur.is` (athuganir) sem viðbótar- eða staðfestingargagn fyrir núverandi veður | **GO** fyrir nákvæmlega afmarkað næsta skref: ein tilraunanotkun til samanburðar við eitt tjaldsvæði, ekki almenn innleiðing | Leyfi CC BY 4.0 er VERIFIED DOCUMENTATION; einingar/mælitímar eru VERIFIED SAMPLE; en skynjarhæð, tímabelti, endurskoðunarstefna og gæðaflögg (utan `count_measurements`) eru **UNKNOWN/NOT STARTED** (sjá §2) — GO nær ekki yfir þau atriði |
| Nota rannsóknina til að ákveða 72-klst-sértæka reglu eða afgerandi „bestu" gagnaveitu | **NO-GO** (þetta er eina hreina NO-GO-röðin — studd af vöntun á mælingavottun, ekki af NOT STARTED/UNKNOWN hólfum) | Engin mælingavottun (athuganir bornar saman við spár á sama tíma/stað) var framkvæmd í þessari né fyrri lotu |

**Grep-staðfesting (J2):** `grep -rniE "NO-GO" research-report.md provider-matrix.csv source-register.md` eftir þessa breytingu sýnir aðeins setningar sem fylgja ofangreindri, leiðréttri orðræðu (sjá nákvæmt úttak í `cc-report.md`, v2-kafla).

### „IG" og rekstraraðilar — óbreytt frá v1, staðfest aftur

Sjá v1-niðurstöðu (óbreytt, ekki gagnrýnd af Jonesy): DMI-frumheimild nefnir „IG" = „Iceland and Greenland"; Veðurstofa keyrir sitt eigið, aðskilið HARMONIE; Open-Meteo notar DMI (ekki Veðurstofu) fyrir Ísland sjálfgefið; nákvæmt undirlén (DINI/IG) er áfram **UNKNOWN**, nú staðfest tvöfalt: bæði með því að `models=dmi_seamless` sýnir ekkert lén-auðkenni í svarinu, OG — nýtt í þessari lotu — með beinum samanburði sem sýnir að grunnbeiðni appsins og `dmi_seamless`-tilraunin skiluðu **nákvæmlega sömu** 168 klukkustunda gildum fyrir hita og vind á þessum eina punkti (sjá §5). Það sannar að sjálfgefið val leysti til sama undirliggjandi afurð og `dmi_seamless` **á þessum eina punkti/tíma/breytum** — ekki hvaða undirlén (DINI eða IG) það er.

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
| „Klukkustund 24"-venja | Svarað beint úr sýnishorni | Fyrsta röð `vedur-obs-1350-20261018.json`: `time: "2026-10-18T00:00:00"` en `day: 17, hour: 24` — þ.e. kerfið lýsir sama augnabliki sem „klukkustund 24 á degi 17" OG sem miðnætti dags 18 í `time`-reitnum. **Afleiðing (INFERRED, með rökstuðningi):** ef einhver framtíðarnotkun flokkar eftir `day`/`hour`-reitunum í stað `time`-reitsins, lendir þessi tiltekna klukkustund í **öðrum** almanaksdegi en `time` gefur til kynna — nákvæmlega sú tegund dagmarkavillu sem núverandi app forðast með því að nota `time`-strengi beint (sjá §1/S8) |
| Gæðaflögg | Aðeins `count_measurements` fannst sem flagg-líkur reitur (ekkert `quality_flag`/`qc_flag`/„quality flag"-orð í skjölunum — staðfest núll tilvik í textaleit) | VERIFIED DOCUMENTATION (fjarvera staðfest) |
| Endurskoðunar-/úreldingarstefna (hvort gildi geta breyst eftir birtingu) | **UNKNOWN** | Ekkert „revision"/„revised" orð í skjölunum |
| `latest`-samningur (fyrir „núverandi veður") | Svarað beint úr sýnishorni | `/observations/aws/{aggregation}/latest`: skilar nýjustu mælingu á stöð, innan 24 klst. fyrir 10mín/klst-stig, 7 daga fyrir dag-stig o.s.frv. (VERIFIED DOCUMENTATION, `vedur-openapi.json`) |
| `r` (úrkoma) null-gildi | **24 af 24 röðum null** í eina varðveitta sýnishorninu (sótt ~18–41 klst. eftir mælingartíma). Merking óþekkt: getur þýtt enga úrkomu, enn óklára gæðaleiðréttingu, eða að þessi stöð vanti úrkomumæli — **ekkert af þessu er staðfest**, og null er hér **ekki** túlkað sem „engin rigning" | VERIFIED SAMPLE (talning), merking UNKNOWN |
| Önnur svæði (25 breytur: jarðvegshiti, geislun, sjávarhiti, selta, vegahiti) | **0 af 24 ekki-null** fyrir öll þessi svið í sýnishorninu — stöðug núll-gildi í öllum röðum frekar en stöku vantar bendir til að stöðin einfaldlega **vanti þessa skynjara** (INFERRED, ekki staðfest), ekki að um handahófskennt gagnatap sé að ræða | VERIFIED SAMPLE (talning) + INFERRED (ástæða) |
| Fjarlægð stöðvar frá rannsóknarpunkti | Keflavík: **0,00 km** (punkturinn var sjálfur skilgreindur út frá stöðvarhnitum, því er fjarlægðin tilgangslaus sem fulltrúamæling, ekki „sönnun um gæði"). Hinir þrír punktar: leyst með **einni** nýrri, aðskildri vörulista-fyrirspurn (`GET /weather/stations`, öll virk stöðvagögn, sótt 2026-10-19 18:10:46Z) og haversine-fjarlægðarreikningi (`research-tools/nearest-station-distance.mjs`): Ísafjörður → næsta virka stöð „Ísafjörður - vindur" (IMO 2642, 2,2m hæð) **2,83 km** frá punktinum; Hveravellir → stöð „Hveravellir" (IMO 6935, **641m** hæð — þetta staðfestir töluna sem notuð var óstaðfest í v1, nú beint úr stöðvarskrá) **0,21 km**; Egilsstaðir → „Egilsstaðaflugvöllur" (IMO 4271, 23,5m hæð) **1,13 km**. Aðferð: hornbogaformúla (haversine) á kúlulaga jörð — tekur **ekki** tillit til vegalengdar eftir landslagi, hæðarmunar, skjóls í þröngum fjörðum, né mælisetu stöðvar/punkts. Fjarlægð ein og sér er **ekki** sönnun um dæmigerð gildi fyrir tjaldsvæði | VERIFIED SAMPLE |

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

**Um `elevation`-reitinn:** þetta er gildið sem Open-Meteo skilar undir sinni eigin, skjalfestu hæðarmeðhöndlun (sjálfgefið 90m stafrænt hæðarlíkan notað til tölfræðilegrar niðurkvörðunar, sbr. v1 §-E1/matrix röð 8) — **ekki** endilega „reiknireits-hæð" eða „sjávarbotnshæð" í nokkrum sérstökum skilningi. Fyrri fullyrðing um að Ísafjarðar-punkturinn hafi lent á „sjávarreit" er hér **felld niður sem ósönnuð fullyrðing** (R4) — það eina sem er staðfest er að skilað `elevation`-gildi er 0m fyrir þennan punkt, sem er lágt og í samræmi við að punkturinn er nærri sjó í þröngum firði, en nákvæm orsök (vatnsreitur vs. einfaldlega lágur strandreitur) er **INFERRED**, ekki VERIFIED.

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
- Tímabilaskipting miðað við sóknartíma (svarhaus `Date: Mon, 19 Oct 2026 17:47:22 GMT` — **þjónustusvartími, ekki sjálfstætt skráður staðartími**): 17 skref fyrir sóknarstund, 72 skref frá og með fyrsta skrefi á/eftir sóknarstund (2026-10-19T17:00 til 2026-10-22T16:00), 79 skref þar á eftir.

**Nákvæm túlkun (ekkert víðtækara):** þetta sýnir að sjálfgefið `best_match`-val og skýra `dmi_seamless`-valið skiluðu **sömu gildum fyrir þennan eina punkt, þessar tvær breytur, þessa einu sóknarlotu**. Það er VERIFIED-SAMPLE-stigs vísbending um að sjálfgefið val hafi leyst til sömu undirliggjandi afurðar og `dmi_seamless` **hér og nú** — það sannar **ekki** hvaða undirlén (DINI/IG) er notað, hegðun á öðrum punktum/tímum/breytum, né framtíðar- eða nákvæmnisgildi. DINI-vs-IG er áfram **UNKNOWN**.

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

## 8. Áhrif á #429 (Winter Route Advisor) og #419 (Ski Weather)

Óbreytt frá v1 — sjá `v1-archive/research-report.md` §8. Ekkert í v2-leiðréttingunum breytir þeirri niðurstöðu.

---

## Viðaukar

- `provider-matrix.csv` — full gagnafylki, leiðrétt.
- `source-register.md` — allar heimildir, leiðrétt.
- `samples/` — hrá sýnishorn óbreytt (sömu 8 upprunaskrár, sömu SHA256), auk 2 nýrra vörulistaskráa frá þessari lotu, `manifest.md` með EXACT/RECONSTRUCTED/UNKNOWN merkingum.
- `research-tools/` — tvær nýjar samanburðar-/fjarlægðarskriftur (Node, engar viðbótarpakkar) og vistuð úttök þeirra.
- `cc-report.md` — aðferðir, v2-kafli með R1–R7 ráðstöfun.
- `v1-archive/` — upprunalegar v1-skrár, óbreyttar.

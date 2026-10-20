# Ticket #450 — Rannsóknarskýrsla: Open-Meteo, DMI/IG, íslensk veðurlíkön og athuganir

Dagsetning: 2026-10-19. Framkvæmt af CC samkvæmt `approved-prompt-v1.md` (Ripley Round 1 + Jonesy skilyrði H1–H7). Eingöngu rannsókn — engin kóða-, scoring-, þröskulda- eða gagnaveitubreyting var gerð. Heimildir og nákvæm tilvitnanagildi eru í `source-register.md`; full gagnafylki í `provider-matrix.csv`; hrá sýnishorn og SHA256 í `samples/manifest.md`.

---

## Ákvörðunarminnisblað (lesið fyrst)

### Samhengi

Fundur Expert Support með Guðrúnu Nínu Petersen hjá Veðurstofu Íslands 14. október 2026 (heimild: eigandi afhenti úrdrátt, ekki orðrétt afrit — staðfest í texta miða #437/#450 sjálfra). Setningin „líkan nefnt IG" (45:40) er rannsóknarspurning, ekki fyrirfram samþykkt val. Fundurinn er **ekki** formleg staðfesting Veðurstofunnar á líkani appsins.

### Hvað „IG" líklega er

Fann frumheimild hjá DMI sjálfu (`dmi.dk/friedata/.../forecast-data-weather-model-harmonie-for-dini-and-ig`, skoðuð 2026-10-19) sem nefnir **„IG" = „Iceland and Greenland"** — HARMONIE-útgáfa DMI með 2 km upplausn, 72 klst. spálengd, keyrð klukkustundarlega, landfræðilegt svæði lon 109V–37A / lat 56N–86N. Þetta samræmist mjög vel orðalagi fundarins, en er **tilgáta studd af frumheimild, ekki staðfest sem nákvæmlega það sem sagt var á fundinum** — úrdrátturinn er endursögn, og ein önnur (ótraustari, ekki endurskoðuð beint) heimild fullyrti að „IG" þekji aðeins Grænland, sem stangast á við DMI-síðuna sjálfa sem ég las orðrétt. Þessi mótsögn er skráð, ekki leyst með ágiskun.

### Hver keyrir hvað

- **Veðurstofa Íslands** keyrir **sitt eigið** HARMONIE (útgáfa 38h1.2): 2,5 km upplausn, 500×480 reitir yfir „Iceland and the surrounding seas", 4 keyrslur/dag, 66 klst. spá.
- **DMI** keyrir **sitt eigið, aðskilið** HARMONIE: 2 km upplausn, lén IG (Ísland+Grænland) eða DINI (Danmörk/Ísland/Holland/Írland), klukkustundarlegar keyrslur, 72/60 klst. spá, á ofurtölvu staðsettri á Íslandi (en engin yfirlýst samvinna við Veðurstofuna fannst í þeirri heimild).
- **Open-Meteo** (núverandi gagnaveita appsins) notar sjálfgefið (`best_match`) „DMI HARMONIE" fyrir „Northern Europe & Iceland" — þ.e. appið fær **DMI-gögn, ekki Veðurstofu-gögn**, og ekki er hægt að staðfesta úr svarinu sjálfu hvort DINI eða IG lénið er notað fyrir tiltekinn íslenskan punkt (staðfest með raunverulegri fyrirspurn, ekki bara lestri á skjölum — sjá `E4` í heimildaskrá).

### Mikilvægur hliðarfundur: staðfest villa, ekki gagnaveituspurning

Rannsóknin fann, sem beina afleiðingu af einingaskoðun (H1.2), að `api/_lib/auroraDecision/openMeteo.js` biður **ekki** um `windspeed_unit`, og fær því sjálfgefið **km/klst** frá Open-Meteo (staðfest í opinberum skjölum: sjálfgefin eining er `kmh`, ekki m/s). Þessi gildi eru síðan geymd ómerkt sem `windSpeed` og borin saman við `HIGH_WIND_MS_THRESHOLD = 12` í `src/lib/auroraScoring.js` **eins og um m/s væri að ræða**. 12 km/klst ≈ 3,3 m/s — mjög lágur vindhraði sem kviknar nánast alltaf, á meðan raunveruleg hætta (≈12 m/s ≈ 43 km/klst) er það sem flagginu var ætlað að merkja. Þetta er forritsvilla, ekki val milli gagnaveita — skráð hér sem rannsóknarniðurstaða, **ekki lagfærð** í þessum áfanga (utan umfangs/STOP-skilyrðis).

### GO / PARTIAL / NO-GO eftir notkun

| Fyrirhuguð notkun | Niðurstaða | Rökstuðningur (stutt) |
|---|---|---|
| Halda áfram að nota Open-Meteo/`best_match` fyrir núverandi 7 daga spá appsins óbreytt | **GO** | Núverandi einingar/tímabelti eru rétt beðin um af eina skjólstæðingnum (`forecastCache.js`); `elevation`/grid-snap er þekkt takmörkun sem þegar er upplýst notendum (#170, þegar útfært: „Weather based on nearby forecast data"). Engin ný gagnaveita þarf fyrir óbreytta virkni. |
| Skipta kjarnaspá appsins yfir í beint DMI-samband (framhjá Open-Meteo) | **NO-GO** að svo stöddu | Virkur, lykilalaus aðgangur er nýlegur (frá 2. des. 2025) og skjalfestur, en nákvæm lén-auðkenning (DINI vs. IG), rauntíma-GRIB-úrvinnsla og rekstrarbyrði (nýtt þáttunarlag, nýtt snið) er ekki metin í þessari umferð. Enginn mælingasamanburður er til sem sýnir DMI-beinttenging gefi betri niðurstöðu en Open-Meteo-milliliðurinn sem þegar notar sömu gögn. |
| Nota `api.vedur.is` (athuganir) sem viðbótar- eða staðfestingargagn fyrir núverandi veður | **PARTIAL → efnilegt fyrir næstu rannsóknarlotu** | Fann óvænt, vel skjalfesta, ókeypis, CC-BY-leyfða athugana-API hjá Veðurstofunni sjálfri (ekki áður þekkt af appinu) með nákvæmum einingum/mælitímum á hverja breytu og stöðvalýsigögnum (hæð, upphafsár). Þetta er **ekki spá** — eingöngu athuganir frá stöðvum, sem þarf að meta sérstaklega m.t.t. fjarlægðar frá tjaldsvæðum (ekki gert hér). |
| Nota Veðurstofunnar eigin HARMONIE-líkan beint | **NO-GO að svo stöddu** | Engin opinber API-leið fannst fyrir spágögn (aðeins athuganir fundust á `api.vedur.is`); `athuganir.vedur.is` skilaði ekki lesanlegu innihaldi til skoðunar (líklega JS-forrit, ekki API-skortur). Krefst frekari eftirgrennslan áður en hægt er að meta. |
| Nota rannsóknina til að ákveða 72-klst-sértæka reglu eða afgerandi „bestu" gagnaveitu | **NO-GO** | Engin mælingavottun (athuganir bornar saman við báðar spár á sama tíma/stað) var framkvæmd — munur milli tveggja spáveita sannar ágreining, ekki nákvæmni, eins og tilskipunin kveður skýrt á um. |

### Næsta skref (eitt, afmarkað, bíður samþykkis eiganda)

Ein þróunarviðráðanleg næsta rannsóknarlota: (a) sækja eitt GRIB-sýnishorn beint frá DMI IG/DINI fyrir sama punkt og Open-Meteo-sýnishornið hér, og (b) bera saman við rauntíma `api.vedur.is`-athugun fyrir sama tímapunkt, til að meta raunverulegan mun — ekki framkvæmt hér vegna tvíræðni um núverandi EDR-slóð (sjá `source-register.md`). **Engin framkvæmd er samþykkt með þessari skýrslu sjálfri.**

---

## 1. Gagnaflæði appsins — heildarsýn

```
api/forecast.js (framleiðsla)                    vite dev proxy (þróun)
  └─ customer-api.open-meteo.com EÐA                └─ api.open-meteo.com beint
     api.open-meteo.com (eftir OPEN_METEO_API_KEY)      (fer FRAM HJÁ api/forecast.js,
  └─ FÖST daily/hourly listi                            engin apikey nokkurn tímann,
     (þ.m.t. cloudcover/visibility —                    skjólstæðingslisti gildir —
     viðbót fyrir Northern Lights,                       ENGIN cloudcover/visibility)
     ekki notuð í stigagjöf ennþá)
        ↑
   src/lib/forecastCache.js  ← EINI skjólstæðingurinn sem kallar /api/forecast
   (celsius, m/s, mm, Atlantic/Reykjavik, 7 dagar, 30 mín cache)
        ↑
   8 neytendur: useForecast, useLeaderboardScores, useRoutePlanner,
   relocationService, routeRisk, CampsiteComparisonSection,
   HourlyForecastModal, MapView
```

**Sjálfstæð leið (ótengd ofangreindu):** `api/_lib/auroraDecision/openMeteo.js` — eigin, óháð Open-Meteo-fyrirspurn fyrir Norðurljósastuðul, almenningsslóð, `timezone=UTC`, **engin eining tilgreind** (sjá villu hér að ofan). Notar `windSpeed`/`cloudcover*`/`visibility`/`precipitation`.

**Önnur virk inntök:**
- `api/_lib/aurora/fetchAurora.js` — Veðurstofu XML-vísitala (`xmlweather.vedur.is/aurora?op=xml&type=index`), eingöngu ræst af cron-starfi, aldrei frá vafra.
- `api/admin.js` (`normalizeForecastRawInput`/`parseForecastLine`) — **handvirkt afritaður texti** sem stjórnandi límir inn fyrir blogg-gerð. Ekki sjálfvirk gagnaveita; uppruni textans er ósannreynanlegur úr kóðanum.
- Weather Voice (`weatherVoiceRules.js` o.fl.) — staðfest núll `fetch`/`getForecast` köll; hrein framsetningarsmíð ofan á þegar sóttum gögnum.
- `scripts/` — engin virk veðursókn fannst (aðeins OSM-tjaldsvæðagögn).
- Vetrar-/skíðaeiginleikar (#429/#419): **áætluð, ekki virk** — ekkert gagnaflæði til að kortleggja ennþá.

---

## 2. Athuganir vs. spá — skýr aðgreining

| Heimild | Flokkun | Athugasemd |
|---|---|---|
| `/api/forecast` (Open-Meteo `best_match`) | **Spá** (líkansúttak), ekki athugun | Jafnvel „current weather"-líkar hourly-tölur eru líkansúttak fyrir næsta klukkutíma, ekki mæling frá stöð |
| `api.vedur.is` (`/observations/aws/*`, `/observations/synop`) | **Rauntímaathugun** frá sjálfvirkum stöðvum | Tímasett, gæðaflöggum merkt (`r` er sagt „quality-checked and corrected"), ekki alltaf til fyrir hvern punkt — næsta stöð er ekki endilega dæmigerð fyrir tjaldsvæði/fjörð/hálendi |
| Veðurstofunnar eigin HARMONIE | **Spá** | Engin bein API-leið fannst fyrir þetta líkan sérstaklega í þessari lotu |
| `xmlweather.vedur.is/aurora` | Afleidd **virknivísitala**, hvorki hrein athugun né hefðbundin spá | Þegar notað af appinu, ótengt þessari rannsókn að öðru leyti |
| Admin-límdur texti | **Ómarkviss/ósannreynanleg** flokkun | Handvirkt, líklega byggt á Veðurstofu-vefsíðu en ósannreynt úr kóðanum |

Engin núverandi stöðvamæling er notuð sem „ground truth" í stigagjöf appsins — allt stigakerfi dagsins byggir á spálíkani (Open-Meteo), ekki athugun.

---

## 3. Fjögurra punkta sýnishornaáætlun og hvað fannst

| Punktur | Hnit (uppruni) | Open-Meteo niðurstaða (sótt 2026-10-19 17:47 UTC) |
|---|---|---|
| Sjávarmál/strönd — Keflavíkurflugvöllur | 63.9828987122, -22.6005191803 (**staðfest stöðvarhnit** frá `api.vedur.is`, stöð 1350) | Grid-hæð 50m (mjög nálægt raunverulegri 50,9m hæð stöðvarinnar — góð krossstaðfesting) |
| Þröngur fjörður — Ísafjörður | 66.0750, -23.1200 (algeng, opinberlega birt bæjarhnit; **ekki** stöðvarstaðfest í þessari lotu) | Grid-hæð **0m** — reiknireiturinn sem valinn var virðist vera sjávarreitur, ekki dæmigerður fyrir bæinn sjálfan. Þetta er nákvæmlega sú takmörkun sem fundurinn nefndi um „reiknipunkta í þröngum fjörðum" |
| Hálendi — Hveravellir | 64.8667, -19.5667 (algeng birt hnit; ekki stöðvarstaðfest) | Grid-hæð 633m (nálægt þekktri ≈641m hæð, sæmileg samsvörun) |
| Annað landshlutasvæði — Egilsstaðir | 65.2669, -14.3948 (algeng birt hnit) | Grid-hæð 40m |

Öll fjögur stig voru sótt í **einni** búntaðri fyrirspurn (Open-Meteo styður kommu-aðskilin hnit) til að halda sig innan takmarkana H3. Full hrá svör eru í `samples/openmeteo-baseline-4point.json`.

**Lokuð/ónáð gögn (merkt skýrt, ekki falin):** Ekkert DMI IG/DINI sýnishorn var sótt (sjá ástæðu í kafla um DMI hér að ofan og í `source-register.md`). Ekkert Veðurstofu-eigin-líkan sýnishorn var sótt (engin opinber API-leið fannst fyrir það í þessari lotu).

---

## 4. Samhæfni við núverandi normalization (H1.6 taflan)

| Atriði | Núverandi hegðun appsins | Áhætta/athugasemd |
|---|---|---|
| Dagsmörk (local vs. UTC) | `forecastNormalize.js` notar `ts.startsWith(date)` — strengjasamsvörun, virkar aðeins af því að `forecastCache.js` biður alltaf um `timezone=Atlantic/Reykjavik` svo bæði `daily.time` og `hourly.time` eru þegar staðbundin, einföld strengjagildi | Brothætt ef einhver framtíðar-kallari sleppir `timezone` — þá myndi samsvörunin hljóðlega bila |
| null vs. 0 | Aðalleiðin (`forecastNormalize.js`) varðveitir núll sums staðar en `auroraDecision/openMeteo.js` er hrein null-preserving leið (`numOrNull`) | Tvær mismunandi heimspekilegar nálganir í sitt hvoru gagnaflæðinu — ekki endilega villa, en vert að hafa í huga |
| m/s-forsendur í þröskuldum | Megnið af appinu (stigagjöf, HAZARDS_V1 o.fl.) gerir ráð fyrir m/s og **fær** m/s (af því `forecastCache.js` biður um það) — **nema** `auroraScoring.js`'s `HIGH_WIND_MS_THRESHOLD`, sem fær km/klst óvart (sjá villu hér að ofan) | **Staðfest villa**, ekki gagnaveituspurning |
| Klukkustundar- vs. dagvigin stigainntak | `getTimeWeight`: nótt 0,45 / morgun 0,75 / dagur 1,0 / kvöld 0,75 — vísvitandi hönnun, óbreytt | — |
| WMO-veðurkóðafjölskyldur fyrir snjó | `scoring.js` telur kóða 71–77 + 85/86 sem snjó (hefur áhrif á stigagjöf); `forecastNormalize.js`'s eigin, aðskilda `SNOW_CODES`-listi sleppir 72/74/76 fyrir sína eigin (ekki-stigagjafartengdu) `precipType`-flokkun | Innri ósamræmi milli tveggja skráa — ekki gagnaveituvandi, en skráð skýrt |
| Workbox þjónustuvinnsluregla | Skráð `StaleWhileRevalidate`-regla fyrir `https://api.open-meteo.com/v1/forecast` — en appið biður **aldrei** beint um þá slóð (alltaf `/api/forecast`, sama-upprunaslóð) — staðfest bæði í kóða og í þegar byggðu `dist/sw.js` að þessi regla á aldrei við | Dauður kóði, ekki virkt vandamál, en vert að hreinsa í framtíðinni (ekki gert hér) |

---

## 5. 0–72 klst. vs. lengra tímabil

- Open-Meteo `best_match`: fyrstu ~60–72 klst. koma frá DMI HARMONIE (eftir léni), restin af 7 dögum blandast við ECMWF/GFS/ICON gegnum Open-Meteo's eigin „seamless"-samsetningu — **appið biður ekki um `models`-breytuna sjálft**, svo nákvæm blöndunarregla fyrir dagana 3–7 er ekki stjórnað af appinu og er ekki fyllilega skjalfest fyrir þennan stað í þessari lotu (NOT STARTED).
- Veðurstofunnar eigin HARMONIE nær aðeins 66 klst. — þ.e. innan við 72 klst. — og nær ekki yfir dagana 3–7 sem appið sýnir í dag.
- DMI IG nær 72 klst., DINI 60 klst.
- **Engin tilraun var gerð til að meta nákvæmni fyrstu 72 klst. sérstaklega með mælingasamanburði** — það krefst samtíma athugana (t.d. frá `api.vedur.is`) bornar saman við spágildi fyrir sama tíma/stað, sem er NOT STARTED í þessari lotu.

---

## 6. Leyfi, aðgangur og rekstrarbyrði — yfirlit

Sjá `provider-matrix.csv` fyrir fullt yfirlit. Stysta samantekt:

- **Open-Meteo** ókeypis (almenningslykil-laus) stig notað af appinu í dag; viðskiptavinalykils-stig (`customer-api.open-meteo.com`) er til staðar í kóðanum en hvort lykillinn er settur í framleiðslu er **ekki hægt að staðfesta úr þessu geymslusafni** (H2-mörk) — jafnvel `.env.example` sjálft nefnir ekki `OPEN_METEO_API_KEY`.
- **DMI**: nú (frá 2. des. 2025) algjörlega lykil-/skráningarlaust, CC-BY-stílað leyfi, viðskiptanotkun og endurdreifing sérstaklega leyfð.
- **Veðurstofa (`api.vedur.is`)**: lykil-/skráningarlaust í þessari lotu (byggt á árangursríkum fyrirspurnum), CC BY 4.0 lýst beint í API-lýsingunni sjálfri.
- **Rekstrarbyrði** ef bein DMI-/Veðurstofu-tenging yrði bætt við: nýtt GRIB-þáttunarlag (DMI) eða ný samhæfingarvinna milli athugana og núverandi spákerfis (Veðurstofa) — hvorugt er metið í smáatriðum hér (utan umfangs fyrir research-only lotu).

---

## 7. Óvissa og vöntuð staðfesting (ekki falin)

- „IG" er **ekki** endanlega staðfest sem nákvæmlega það sem Guðrún Nína átti við — aðeins sterk, heimildarstudd tilgáta.
- Hvort Open-Meteo notar DINI eða IG lénið fyrir íslenska punkta er **óstaðfest** (staðfest með raunverulegri fyrirspurn að ekki er hægt að greina þetta úr svarinu).
- Engin mælingavottun milli spágilda og athugana var framkvæmd — allur samanburður í þessari skýrslu er samningstæknilegur (einingar, upplausn, lén), ekki nákvæmnismat.
- Framleiðslu-staða `OPEN_METEO_API_KEY` er óþekkt úr geymslusafninu, viljandi ekki rannsökuð frekar.
- `athuganir.vedur.is`'s eigin API-samningur (ef frábrugðinn `api.vedur.is`) var ekki leystur.
- DMI-leyfi fyrir viðskiptanotkun í gegnum **Open-Meteo sjálft** (frekar en beint frá DMI) var ekki sérstaklega skoðað — Open-Meteo og DMI hafa hvort sitt leyfi, og appið notar hvorugt beint í dag.

---

## 8. Áhrif á #429 (Winter Route Advisor) og #419 (Ski Weather)

Þessi rannsókn **leysir ekki** og **endurtekur ekki** sérhæfð verkefni #429 (leiðalag, IDBUTVEGUR/þjóðvegalokanir, komutímaspár) eða #419 (skíðaeftirspurn, snjómælingar á skíðasvæðum). Endurnýtanlegt héðan: (a) sama óvissa um hvort DMI/IG er aðgengilegt fyrir Ísland gildir fyrir hvaða framtíðarfeature sem er sem vildi nota DMI beint; (b) `api.vedur.is`'s athugana-API (stöðvar, m/s-vindur, gæðaflögg) er hugsanlega gagnlegt fyrir bæði #429 (vegstöðvar — athugið að `/rodeo`-endapunktarnir taka sérstaklega fram að þeir **vanti** gögn frá Vegagerðinni, en `/observations/aws`-leiðin gæti náð til sumra sömu stöðva) og #419 (snjó-/hitamælingar); (c) ekkert í þessari rannsókn staðfestir eða afsannar sérhæfðar forsendur þeirra tveggja miða.

---

## Viðaukar

- `provider-matrix.csv` — full gagnafylki, hólf-fyrir-hólf með heimildamerkingum.
- `source-register.md` — allar heimildir, slóðir, dagsetningar, tilvitnanagildi.
- `samples/` — hrá sýnishorn (JSON), haus-skrár, `manifest.md` með SHA256 og varðveislurétti.
- `cc-report.md` — aðferðir, skipanir, umfangsúttekt, leyndarmálaúttekt.

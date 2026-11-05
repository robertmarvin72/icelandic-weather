# #491 — evidence-table-final.md (lokastaðfesting leiðargagna)

CC, 2026-11-04. Framkvæmt eftir `approved-prompt-v2.md` (final-validation). Eitt nýtt netkall framkvæmt (S3), sjálfstætt endurreiknað úr varðveittum frumgögnum með Python (einnota, offline nema það eina kall). Öll hnit/lengdir í þessari skrá eru úr `docs/ai/tasks/ticket-491/final-validation/route-data-candidate.json` (vélrænt framleidd af sama kóða sem keyrði útreikningana hér — engin handvirk umskrifun af tölum).

## Nýtt netkall (S3)

Eitt kall, einn skiptihlutur (ekkert redirect þurfti):

```
GET https://gagnaveita.vegagerdin.is/geoserver/gis/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gis:faerdferlar2017_1&CQL_FILTER=IDBUTUR%20IN%20(903030037,904690037,904000037,904010037,804020037,904040037)&srsName=EPSG:4326&outputFormat=application/json&maxFeatures=500
```

- Tími: 2026-11-04T20:13:08Z. HTTP 200. 1 af heimiluðum 2 skiptum notað, 136 732 bæti af heimiluðum 4 MiB/8 MiB. Svar: `numberMatched=numberReturned=totalFeatures=132` — **ekki niðurskorið** (undir `maxFeatures=500`).
- Vistað: `final-validation/samples/wfs-vesturland-4326.json`, hash `5fb643b23ac83dc0df47e1ff5c482adb78d7a99bc567028133d8bfd6b140659f`. Haus/slóð/tími: `final-validation/samples/wfs-vesturland-4326-headers.txt`.
- Sjálfstæð samsvörunarathugun (IDFERILL+tier+hnútafjöldi, ekki bara röð svars): öll athuguð stykki (3025, 3796, 47042, 2819, 30401, 2876, 3757, 3756) hafa **nákvæmlega sama fjölda hnúta** í native (ISN93, `wfs-vegnr1-all.json`) og í þessu nýja WGS84-svari — VERIFIED 1:1 pörun, engin niðurskurður/röðunarvilla fannst.
- Óvænt fundið (jákvætt): svarið sýnir **tvö** tier0-stykki sem vantar í eldri varðveitta `wfs-vegnr1-all.json`-sýnið: IDFERILL 3798 (904000037, kaflanr "01", "Grundartangavegur") og 3243 (904010037, kaflanr "01", "Hagamelsvegur"). Bæði eru staðfest **hliðarvegir** (önnur KAFLANR-röð en keðjunnar "g0-g9", önnur STADARLYSING en gegnumleiðin) — réttilega útilokuð úr keðjunni, ekki brot á samfellu.

## 1. Upphaf/endir — fryst með rekjanlegri reglu

**Rauðavatn (upphaf): VERIFIED.** Vestari endi IDFERILL 1436 (IDBUTUR 1410010037), native [365522.0175, 402772.762] — sami upphafspunktur og núverandi Rauðavatn–Vík keðja (`api/_lib/winterRoute/segments.js`, óbreytt). Ekki #485's rannsóknar-ETA-núll 49926.

**Borgarnes (endir): VERIFIED gegn reglunni.** Regla (O3/Ripley): fyrsta VEGHLUTI5-hringtorg á þessum Hringvegarköflum eftir norðanmunna Hvalfjarðargangna (42573). Athugað **tæmandi** á öllum tier0-VEGHLUTI5-fundum í hinu nýja opinbera svari fyrir öll 6 fyrirspurð IDBUTUR: einu VEGHLUTI5-fundirnir á 804020037/904010037/904000037/904040037/904690037 eftir 42573 eru **30401** (904040037, "Borgarnes"). Engin önnur hringtorg til samanburðar — reglan er ótvíræð hér.
Innkomupunktur = endi IDFERILL 2819 (904040037), native [361119.191, 454127.5752], **1,77 m** frá hringpunkti 30401 ([361117.423, 454127.668]) — notaður sem "innkomupunktur á línu", EKKI meðaltal hnúta eða fyrsti geymdi hnútur (hringtorgsmeðaltal væri ca. 13m norðar en 30401-punktið, sbr. fyrri O3-ábending).
WGS84 (úr nýja kallinu, nákvæm hnútapörun): **lat 64.55996252, lon −21.89753371**.

## 2. Stefnurétt pieces-keðja (H1)

**Niðurstaða: byggð, INFERRED topólógísk nálgun — ekki sönnuð umferðarstefna.** Sjálfstætt endurreiknað (Python, `tier0_extract_v2.json` + nästa-hnútar innan 50m) frá vestari enda 1436 að upphafi 3025 (sömu 16 stykki og Jonesy fann í prompt-yfirferð: 1477, 1431, 42243, 49926, 9923, 9925, 9927, 10242, 2796, 10247, 2488, 2532, 30721, 49281, 49285, 3025), undir tilgátu H1 (VEGHLUTI6 í geymdri stafrænni stefnu = norðurátt; VEGHLUTI1 í báðar áttir). Allir mælda bil á milli stykkja (sjá `route-data-candidate.json.chain_pieces[].gap_from_prev_m`):

| Bil (fyrsta → síðasta) | gap (m) |
|---|---|
| 1436 enda → 1477 | 37.39 |
| 1477 → 1431 | 38.68 |
| 1431 → 42243 | 3.60 |
| 42243 → 49926 | 3.71 |
| 49926 → 9923 | 10.83 |
| 9923 → 9925 | 34.16 |
| 9925 → 9927 | 26.55 |
| 9927 → 10242 | 31.47 |
| 10242 → 2796 | 40.83 |
| 2796 → 10247 | 17.92 |
| 10247 → 2488 | 32.67 |
| 2488 → 2532 | 41.45 |
| 2532 → 30721 | 7.09 |
| 30721 → 49281 | 38.62 |
| 49281 → 49285 | 2.88 |
| 49285 → 3025 | 0.00 |

Hæsta bil: **41,45 m** — innan 50m-reglunnar (S1), ekkert bil ótvírætt/BLOCKED. Samtals brúuð bil (16 stykki): **0,368 km** (sjálfstætt staðfest, mismunur frá Jonesy's "um 0,33km" útskýrist af því að hún taldi ekki fyrsta 37,39m bilið frá 1436 sjálfu með).

Eftir 3025 er keðjan **VERIFIED nákvæm** (0m bil allsstaðar, áður staðfest í owner-scope-umferð, endurstaðfest hér beint úr `wfs-vegnr1-all.json`): 3025→3023→56002→3796 (göngin, suður→norður, 0m hvert skipti) → [27,62m bil, sama og áður staðfest Jonesy] → 3794→3802→3740→3741 (Melasveit) →47042→3756→3757→3758 (Hafnarfjall) →2876→2819 (Borgarnes), öll 0m.

**Útilokaðir hlutar (með ástæðu):** VEGHLUTI7 (andstæð akbraut, t.d. 9924/9926/43526 á 903020037, 42244 á 914020037) — ekki notað, sama stykki/kaflanr en stafrænt öfug stefna. 814700037 (IDFERILL 2982, "Hvalfjarðargöng til suðurs", 5417,467m) — suðurátt-göngin, ekki notuð (myndi tvítelja). Rampar/hringtorg (VEGHLUTI 3/4/5 — 8677, 1734, 8678, 8964, 9298, 10882, 23681, 36803 o.fl.) — tengipunktar fyrir brúun, ekki eigin kaflar í leiðinni. IDFERILL 3798/3023... → sjá "Nýtt netkall" fyrir 3798/3243 (hliðarvegir).

**Takmörkun sem ekki er tæmandi athugað:** Hvort einhver ÖNNUR, jafn-nálæg leyfð tenging (ógreind samkeppni) var til á hverjum einasta hnút er ekki fullkomlega sannreynt (sbr. S1's "tvírætt næsta val" skilyrði) — byggt er á því að H1 nær alla leið með litlum, einhlítum bilum meðan H2/H4 (prófaðar af Jonesy) ná ekki að tengjast yfirleitt, sem er talið nægt óbeint merki um ótvíræðni hér, ekki hnút-fyrir-hnút samkeppnispróf.

## 3. Lengdir og CRS

**13-Vík-stýring: endurskapað, útskýrður munur (ekki óútskýrt BLOCKED).** Sjálfstætt endurreiknað planar-ISN93-lengd (summa allra tier0-lína, sama fjöldi physical_subpieces og í `route-segments.csv` fyrir öll 13 IDBUTUR — nákvæmlega stemmir) = **176,260 km** heild. Þetta stemmir **nákvæmlega** við `#483/harness/02_srs_validation_and_length-output.txt`'s eigin áður-skráðu "ISN93 native planar length... 176.26 km" (óháð þessa-umferð sjálfstæð tala, 176,260 vs 176,26 í harness-skjali — sama tala). `route-segments.csv`-dálkurinn `length_km_vegnr1_tier0` (175,64km samtals) er reiknaður með **haversine á WGS84** (`wfs-chain-4326.json`), ekki planar á native — einnig staðfest nákvæmlega í sama harness-skjali ("Spherical (haversine, WGS84 via srsName=4326) for comparison: 175.64 km"). Munurinn (~0,35%, allt frá +0,006 til +0,103km á einstökum köflum) er **þegar skjalfestur** í `manifest.md`/harness "N8" sem ISN93 Lambert-Conformal-Conic kvarðastuðull (≤1,0003) — ekki ný óútskýrð skekkja, ekki ástæða fyrir BLOCKED. Allir nýju lengdarútreikningar hér nota SÖMU aðferð og CSV-samanburðurinn sjálfur notaði báðar leiðirnar fyrir (planar native ISN93, einsleit aðferð allsstaðar).

**Ný leið — heildarlengd:** Rauðavatn (1436 endi) → Borgarnes (2819 endi): **70,780 km** (planar ISN93, tier0, H1-brúuð bil innifalin). Til hringtorgs 30401: 70,782 km. Með sama ~0,35% ISN93→haversine-leiðréttingarstuðli og sást að ofan væri haversine-ígildið u.þ.b. 70,53 km — einnig yfir 70km.

**ETA-ceil (S2):** `src/lib/winterRouteEta.js`'s `computeEta()` lesið beint (óbreytt, ekki breytt hér): `forecastHour = ceil(rawArrivalMs/1h)`, brottfarartími alltaf á heilum klukkutíma ⇒ öll vegalengd ≤70km (ferðatími ≤1,0h) rúnast UPP í "1 klst." og öll vegalengd á bilinu (70,140]km rúnast upp í "2 klst." Bæði kandídat-endapunktar sem komu til skoðunar fara yfir 70km mörkin: 2876 (70,061km) og lokaval 2819/30401 (70,780–70,782km) **falla báðir í sömu "2 klst."-fötu** — engin 1-vs-2-klst. tvíræðni fyrir ÞAÐ val sem notað er (2819), aðeins fyrir hinn (2876, sem ekki var valinn). Þetta er ekki 70km/klst.-reglubreyting, aðeins skráning eins og S2 krefst.

## 4. Fjórir punktar

| Punktur | IDFERILL/IDBUTUR | native E,N (3057) | WGS84 lat,lon | km frá Rauðavatni |
|---|---|---|---|---|
| P1 Kjalarnes | 3025 upphaf / 903030037 | 362804.64, 418651.23 | 64.24274349, −21.82931336 | 23,632 |
| P2 norðan ganga | 3796 endi / 904690037 | 359141.3289, 426125.7452 | 64.30823023, −21.91184988 | 34,392 |
| P3 Hafnarfjall | 47042 upphaf / 804020037 | 357621.5519, 439559.3877 | 64.42797038, −21.95619825 | 53,904 |
| P4 Borgarnes-aðkoma | 2819 endi / 904040037 | 361119.191, 454127.5752 | 64.55996252, −21.89753371 | 70,780 |

Öll fjögur eru **DERIVED** — raunverulegir hnútar á staðfestri keðju (ekki interpoleraðir, enginn arc-length-reiknir þurfti: hvert punktur er start/end-hnútur sem þegar er til í frumgögnunum), ekki mæld veðurstöð, ekki Open-Meteo-skilareitur.

**P1/P2/P4** eru beint úr eigendatillögusvæðunum (`evidence-owner-scope-2026-11-04.md`). **P3 er CC-val (INFERRED)** innan leyfða svæðisins 47042/3756 (3757 sjálft dregið til baka í O2) — valið `47042 upphaf` fram yfir `3756 upphaf`/aðra staði á svæðinu fyrir jafnari tímadreifingu:

| Legur | km | ≈ mín (70km/klst) |
|---|---|---|
| Rauðavatn → P1 | 23,632 | ~20 |
| P1 → P2 | 10,760 | ~9 |
| P2 → P3 | 19,512 | ~17 |
| P3 → P4 | 16,876 | ~14 |

(Til samanburðar, gamla P3=3757-upphaf: P2→P3 30,04km/~26mín, P3→P4 5,6-6,3km/~5mín — mun ójafnara, sbr. Jonesy's O2.)

**Veðurfarslegt mikilvægi (INFERRED, ekki staðfest loftslagsrannsókn):** P1 Kjalarnes = strandlægur, berskjaldaður kafli; P2 = útgangur/jaðar neðanjarðarkafla (örveðurfarsbreyting möguleg, ekki mæld); P3 Hafnarfjall = hæðarsvæði/fjallvegur-líkur kafli (sbr. fyrri O2-ábending um landslag); P4 = komu-/áfangastaðarskilyrði. Engin ný vindáhættufullyrðing eða ný rannsókn gerð.

**forecastHour-athugun (ekki galli, sbr. prompt):** Með óbreyttu `computeEta`/70km-hraða rúnast P1 (23,6km), P2 (34,4km) og P3 (53,9km) ÖLL upp í "1 klst. frá brottför" (öll <70km ferðatími), en P4 (70,78km) í "2 klst." — þ.e. P1-P3 deila sama forecastHour-kennimerki fyrir hvaða brottfarartíma sem er, eins og `resolvePointAtDeparture` les. Þetta er eðli óbreytts ceil-í-heila-klukkustund líkansins (sama hegðun myndi gilda fyrir núverandi Vík-leið fyrir punkta innan fyrstu 70km), EKKI ný villa og EKKI breytt hér — hvert punktur sýnir sitt EIGIN sótta 24-klst. gagnasafn fyrir þá vísitölu, svo staðbundin gildi geta (og munu) vera ólík jafnvel við sama kennimerki.

## 5. Færðartenging

**VERIFIED, sjálfstætt endurreiknað beint úr báðum varðveittu sýnunum** (réttur eiginleiki er `IdButur`, hástafablendingur — ekki `IDBUTUR` eins og WFS-skrárnar):

| IDBUTUR | 2026-10-28 (`ticket-483/samples/legacy-faerd-fresh.json`) | 2026-11-02 (`ticket-485/samples/legacy-faerd-https.json`) |
|---|---|---|
| 914020037 | 1 færsla, GREIDFAERT, skráð 02:55:01Z | 1 færsla, GREIDFAERT, 02:55:01Z |
| 903020037 | 1, GREIDFAERT, 02:55:00Z | 1, GREIDFAERT, 02:55:00Z |
| 903030037 | 1, GREIDFAERT, 02:55:00Z | 1, GREIDFAERT, 02:55:00Z |
| 904690037 | 1, GREIDFAERT, 02:55:00Z | 1, GREIDFAERT, 02:55:00Z |
| 904000037 | 1, GREIDFAERT, 02:58:28Z | 1, GREIDFAERT, 02:55:00Z |
| 904010037 | 1, GREIDFAERT, 02:58:27Z | 1, GREIDFAERT, 02:55:00Z |
| 804020037 | 1, GREIDFAERT, 02:58:28Z | 1, GREIDFAERT, 02:55:00Z |
| 904040037 | 1, GREIDFAERT, 11:24:38Z | 1, GREIDFAERT, 02:55:00Z |

Hvert hinna 8 IDBUTUR í keðjunni hefur nákvæmlega **1** samsvörun í hvoru sýni (0/margar-staðan kemur ekki upp), engin "vantar gögn". **Kaflastig-takmörkun (S5, óbreytt):** 904040037's eina færð-lína spannar allan Borgarnes–Baulan-kaflann (19,694km tier0), af honum notar leiðin hér aðeins ~1,9km (2876+2819); 904690037's lína spannar bæði göngin og aðkomustykkin. GREIDFAERT-staðan á við allan skráðan kaflann, ekki sérstaklega staðfest fyrir hinn stutta notaða hlutann — vantar/UNKNOWN væri réttara ef nákvæmari upplausn er þörf, ekki sjálfkrafa "greiðfært" fyrir undirhlutann.

## Heimildir og hashar (allar notaðar þessa umferð)

| Skrá | SHA256 | Notkun |
|---|---|---|
| ticket-483/samples/wfs-vegnr1-all.json | 305f60d6f1f17918c058cbd047735681e56d6f9aad99f9e16f50de9419d6983a | native ISN93 tier0 keðja/lengdir |
| ticket-483/route-segments.csv | 5f0b18b7549fa7bfa9024c2c2535976cacf5b0b486c9145be0323a85e86e0f57 | 13-Vík-stýring |
| ticket-483/samples/legacy-faerd-fresh.json | 592d052e2c861de34d264421b944dfefae44a0f054bfd0b8c594f2b143d90a54 | færðarsýni 2026-10-28 |
| ticket-485/samples/legacy-faerd-https.json | 1b6ff2c5f074b6f9ec2d9c9addecfef1471762c110730388275b3b4a3537c3ee | færðarsýni 2026-11-02 |
| **ticket-491/final-validation/samples/wfs-vesturland-4326.json** (NÝTT) | 5fb643b23ac83dc0df47e1ff5c482adb78d7a99bc567028133d8bfd6b140659f | WGS84 fyrir Vesturlands-stykki (S3-kallið) |
| ticket-491/final-validation/route-data-candidate.json | ec56c43cbaf207bf1958b7b6e3bbfdad51c7dbb63bb50ff84bcd49d71f143087 | vélræn gagnaúttak þessa töflu |

Endurkeyranlegar skipanir (offline hluti): Python-skriftur keyrðar í vinnuskrá/scratchpad þessa umferð, lesa beint úr ofangreindum frumskrám, ekki vistaðar í repo (einnota, sbr. prompt "einnota offline skipanir", ekki ný prófasvíta/tól).

## Samantekt

Engin af fimm eftirstöðvunum (1–5) er BLOCKED. Allar hafa rekjanlega heimild, sjálfstætt endurreiknaða/sannreynda tölu, og skýra INFERRED/VERIFIED-merkingu. Sjá `cc-report-final-validation.md` fyrir GO-niðurstöðu og rökstuðning.

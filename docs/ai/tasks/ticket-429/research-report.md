# #429 — Rannsóknarskýrsla: Afmarkað coverage/gap mat fyrir Winter Route Advisor

2026-10-27. CC. Framkvæmt eftir `approved-prompt-v1.md` (J1–J10). Hrein rannsókn — engin framleiðslubreyting, engin GitHub-aðgerð. Öll ný gagnaöflun er skráð í `samples/manifest.md` (gögn) og `source-register.md` (skjöl), innan samþykktra marka úr `pre-sample-plan.md` (frosið **2026-10-27T19:05:26Z**, SHA256 `48f1934d8211c960fc2dbe7bb12354a5e2c000724145dafcf7431474016f1384`, áður en nokkur ný fyrirspurn var gerð). Grunnlína: HEAD `349ff6889111f5d91021cf0de4033e5c17042f0f`, óbreytt í lok lotu.

Einkunnastig: **VERIFIED SAMPLE** (raunveruleg, varðveitt svörun úr þessari lotu eða endurnýtt úr #450), **VERIFIED DOCUMENTATION** (opinber skjölun, lesin), **OWNER-REPORTED** (eigandafullyrðing, ekki sjálfstætt staðfest), **INFERRED** (ályktun af staðfestu efni, merkt sem slík), **UNKNOWN/NOT TESTED** (engin gögn hvorki til né frá).

---

## Síða 1 — Heildarniðurstaða og route-niðurstöður

### Heildarniðurstaða: **PARTIAL**

Gögnin eru **ekki** nægilega góð til að byggja upprunalega, fulla Winter Route Advisor (route/risk scoring, best-departure algorithm, sjálfvirk vetrartúlkun) — en þau eru nægilega góð til að byggja **þrengri, afmarkaða upplýsingasýn** (sjá `pre-sample-plan.md` lið (a)): per-segment source-status og ástandssýn með notandaskilgreindu ETA-sviðsmyndi, án öryggisúttektar. Þessi PARTIAL-niðurstaða gildir um **þrengt umfang**, ekki upprunalegu MVP-hugmyndina — sú er áfram ekki samþykkt til innleiðingar af þessari rannsókn, óháð niðurstöðu.

### Niðurstaða á leið

**Leiðrétt í v2-yfirferð (R4):** `PASS/PARTIAL` er EKKI gild einkunn — rubrikan í `pre-sample-plan.md` (b) gefur nákvæmlega PASS, PARTIAL eða FAIL, ekki tvinnform. Sá einn stafur blokkar PASS fyrir leið (1=geometry, 2=join, 3=lokanir) óháð öðrum liðum. Leiðréttar, nákvæmar einkunnir með tilvísuðu viðmiði hér að neðan — allar þrjár eru **PARTIAL**, engin er PASS:

| Leið | Niðurstaða | Megin rök (leiðrétt v2) |
|---|---|---|
| **A: Reykjavík → Vík** | **PARTIAL** | Cap.1/2 (geometry+join) PARTIAL, ekki PASS: WFS-sýnið (108 brot, 9 `IDBUTUR`) staðfestir join/geometry fyrir 6 af 9 checkpoints (Hellisheiði, Selfoss/Hveragerði-segmentið, Hella, **Hvolsvöllur og Skógar — leiðrétt v2: þeirra `IdButur`-gildi ERU í sama 108-brota svari, v1-merkingin "road-state only" var ÓRÉTT**, sjá `harness/02_wfs_join_analysis-output.txt`), Vík. Sandskeið og Reykjavík (origin) ekki prófuð fyrir geometry/join. Cap.4 (stöð/mæling): leiðrétt v2 (R3) — Sandskeið hefur RAUNVERULEG DATEX-mæligögn (`IRCA_MP_17`, fundin með hnit/ID-mátun, ekki nafnaleit sem v1 notaði); 4 af 9 checkpoints hafa nú staðfesta mælingu. Cap.6 (forecast): 4 af 9. Cap.3 (lokanir): PARTIAL — raunveruleg `LOKAD`/`roadClosed` skrár eru til í kerfinu (sjá §4 v2), en direction/time-validity er óprófað. Ekkert FAIL í 1/2/3, en ekkert nær PASS fyrir öll checkpoints — því PARTIAL. |
| **B: Reykjavík → Akureyri** | **PARTIAL** | Cap.1/2 (geometry): **FAIL fyrir þessa leið sérstaklega** — engin WFS-geometry var sótt fyrir leið B í þessari lotu (v1 sagði réttilega "ekki endurtekið", en það FAIL blokkar route-PASS per rubrikuna, óháð öllum öðrum liðum). Road-state/`IdButur`-join er staðfest fyrir alla 9 checkpoints (ekki geometry, bara ástand). Cap.4: Bifröst/Baulan og Varmahlíð hafa hvorki virka Veðurstofu- né DATEX-stöð fundna. Hvalfjarðargöng hafa enga veðurstöð að eðlisfari. Holtavörðuheiði, Blönduós, Öxnadalsheiði, Vatnsskarð, Akureyri og Borgarnes eru vel studd (Vatnsskarð leiðrétt v2: `IRCA_MP_24` fannst með hnit/ID-mátun, ekki nafnaleit). Niðurstaða: PARTIAL, geometry-FAIL er nefndur blocker, ekki falinn. |
| **C: Reykjavík → Borgarnes** | **PARTIAL** | Sama geometry-FAIL og leið B (engin WFS-geometry sótt fyrir þessa leið), sama rök. Öll 3 checkpoints hafa staðfest færðarástand. Borgarnes sjálft hefur enga virka Veðurstofustöð (sú eina er óvirk frá 1988) en **virkan Vegagerðar-DATEX mælipunkt (`IRCA_MP_1181`) fannst á sama stað** — gapið er fyllt af öðru netinu, ekki ágiskun. PARTIAL, ekki PASS, vegna geometry-FAIL. |

Full rubric-viðmiðun og hvaða checkpoints eru taldir "critical" fyrir þessa ákvörðun: sjá §9b (nýtt í v2) og `harness/05_coverage_consistency_check-output.txt` fyrir vélrituð talning sem þessi tafla byggir á.

**Forsendur sem gilda um ALLAR þrjár:** Spágjafi er Open-Meteo í gegnum núverandi proxy, **vöruauðkenni óstaðfest** (endurnýtt úr #450 — bein DMI-tenging er óútkljáð, sjá #456). SafeTravel er **ekki** hluti af þessu mati — valkvætt, óstaðfest, ekki MVP-forsenda (eigandaskýrsla 2026-10-27). Engin öryggisúttekt, engin „öruggt að keyra"-ályktun, engin sjálfvirk hálku/skafrennings-líkan er lögð til eða gefið í skyn hér.

---

## 1. Samræming eldri route-grada (#429 comments) við nýja staðfestingu

| Leið | Eldri fullyrðing (comment) | Varðveitt sýni til samræmingar | Fersk staðfesting þessarar lotu | Eftirstandandi takmörkun |
|---|---|---|---|---|
| A (Vík) | PASS/PARTIAL; "DMI HARMONIE IG ~2km/72h/8x-daily (3h runs)"; "a station not required at every checkpoint" | Engin — gamla comment-ið vísar ekki í neitt varðveitt sýni, bara prósu | **Leiðrétt v2: `IdButur`/`AstandYfirbord` staðfest lifandi fyrir 6 af 9 checkpoints (Hellisheiði, Selfoss, Hella, Hvolsvöllur, Skógar, Vík) — EKKI öll 9, v1 ofsagði þetta; Reykjavík/Sandskeið/Hveragerði hafa ekkert eigið `IdButur`. Geometry-join sýndur með raunverulegu GeoJSON-sýni fyrir sama 6 (`harness/02_wfs_join_analysis-output.txt`).** Resolution/horizon/cadence-tölurnar úr gamla comment-inu eru EKKI staðfestar af #450 (sem segir HARMONIE er 2.5km/66klst/4x-daglega skv. eigin skjalaheimild) — misræmi skráð, ekki samþykkt sem núverandi samningur. | Hvolsvöllur/Skógar hafa enga virka veðurstöð í neinu netinu sem fannst (Sandskeið leiðrétt v2 — sjá §5) |
| B (Akureyri) | PASS/PARTIAL; "DMI HARMONIE IG provides ~2km gridded forecast across the entire route"; "IDBUTUR values still need to be extracted programmatically during implementation" | Sama sem ofan | **Sama staðfesting og A, auk þess að Vatnsskarð er nú formlega með (J4).** DATEX section-geometry (sem hefði verið óháð önnur staðfesting) gat EKKI verið sótt (timeout, sjá §4). | Bifröst/Baulan, Varmahlíð: engin virk stöð fannst í hvorugu netinu |
| C (Borgarnes) | PASS; "No coverage gap was identified" | Sama | **Staðfest að Borgarnes-staðurinn hefur ENGA virka Veðurstofustöð (sú eina endaði 1988) — gamla PASS-fullyrðingin um "relevant observation/monitoring points" er því ÓSTUTT af Veðurstofunetinu sjálfu.** Gapið fyllist af Vegagerðar-DATEX (`IRCA_MP_1181`), sem gamla comment-ið nefndi ekki sérstaklega. | DATEX-netið sjálft er ekki tæmandi kortlagt (leiðrétt v3: EKKI framkvæmt í neinni lotu — ekki fjárhagsskortur, sbr. R2) |

**Mikilvæg athugasemd um gömlu "Coverage: COMPLETE ✅" fullyrðinguna:** gamla comment-röðin lýsir yfir "Acceptance criterion: Coverage on 3 routes = COMPLETE" eftir aðeins prósulýsingu, ENGIN varðveitt sýni, ENGIN raunveruleg API-kall. Þessi rannsókn finnur raunveruleg gögn sem **að mestu styðja** sömu áttina (PASS/PARTIAL), en með mun fleiri nefndum göllum (stöðvagöt, ein DATEX-tímaþurrð, nafnaárekstur í "Hellisheiði eystri") en gamla comment-ið gaf til kynna. Gamla "COMPLETE"-fullyrðingin er því endurmetin sem **ótímabær** — rétt í meginátt, en ekki með því gagnsæi sem núverandi samþykktarreglur krefjast.

---

## 2. Opinberar heimildir — hvað var raunverulega skjalfest og sótt

Sjá `source-register.md` fyrir fulla töflu. Samantekt:

- **Vegagerðin `faerd-gagnasnid`** (skjalfest + lifandi sýni, 708 segment nationwide): `IdButur` (int, aldrei null), `DagsSkrad` (skráningartími ástands, breytilegt), `DagsKeyrtUt` (útflutningstími, endurnýjast á nokkurra mínútna fresti, **"aldrei mikið eldri en 10 mínútur"** — staðfest lifandi: 2,5 mín munur á útflutnings- og sóknartíma). `AstandYfirbord` hefur 14 fast skilgreind gildi, þ.m.t. **`OTHEKKT`** ("unknown") sem sérstakt, aðskilið gildi frá `GREIDFAERT` (opið) og `LOKAD` (lokað) — þetta er OPINBER grundvöllur fyrir "unknown ≠ open" aðgreiningu, ekki ágiskun frá litum.
- **Vegagerðin WFS (`faerdferlar2017_1`)**: CRS `EPSG:3057` (ISN93), staðfest bæði í `GetCapabilities` og í sóttu GeoJSON-svari. Join-lykill er `IDBUTUR` (hástafir — **ekki** sama stafsetning og í `faerd-gagnasnid`-straumnum, sem notar `IdButur`). Ein `IDBUTUR`-fyrirspurn með 9 gildum skilaði **108 LineString-brotum** — margt-á-móti-einum, ekki einn-á-móti-einum.
- **Vegagerðin DATEX II 3.1** (ný skjölun þessarar lotu, PDF-forskrift sótt): 5 þjónustur með skýrum HTTP-GET-slóðum. `MeasurementSiteTablePublicationService` og `MeasureDataService` virkuðu og gáfu raunveruleg gögn, þ.m.t. **`roadSurfaceTemperature`** sem SÉRSTAKUR, beint-merktur reitur (ekki ályktun úr lofthita). `PredefinedLocationsPublicationService` (section-geometry) **tímaðist út tvisvar** — raunverulegur, skráður blocker fyrir ÞESSA EINU þjónustu, ekki sönnun um að allt DATEX-kerfið sé óaðgengilegt (hinar 4 virkuðu).
- **Veðurstofan (`api.vedur.is`)**: endurnýtt úr #450 (athuganir, ekki spá; CC BY 4.0). Ný leit í varðveittri 778-stöðva skrá (núll ný fyrirspurn) fann virkar stöðvar fyrir flest checkpoints en **enga virka stöð á Borgarnesi, Bifröst eða Varmahlíð**.
- **Open-Meteo**: endurnýtt úr #450 (vöruauðkenni óstaðfest, `dmi_seamless` vs. sjálfgefið val tvöfalt óþekkt). Nýjar sýni þessarar lotu: 3 samantvinnaðar (bundled) fyrirspurnir, 11 checkpoints samtals, allar 200 OK, 3 daga spá.
- **SafeTravel**: ekki sótt, ekki skráð fyrir aðgangi. UNCONFIRMED/OPTIONAL skv. eigandaskýrslu.
- **`docs/open-meteo-auth.md` samræming**: eigandastaðfest Development/Production lykill (2026-10-20); misræmi við #450's fullyrðingu um að Northern Lights-leiðin noti alltaf almenna hýsil er FLAGGAÐ, EKKI leyst í þessari lotu (utan umfangs — route-coverage spurning, ekki auth-spurning).

---

## 3. Leiðargeometry og checkpoint-hnit

Sjá `coverage.csv` fyrir fulla töflu með hnitum/heimildum per checkpoint. Samantekt heimilda:

- **Öll hnit sem merkt eru "VERIFIED SAMPLE" koma úr Veðurstofu-stöðvaskránni** (WGS84, breidd/lengd), ENDURNÝTT úr #450's varðveittu `vedur-stations-all-v2.json` — núll ný fyrirspurn fyrir þessi hnit.
- **Checkpoints án virkrar stöðvar** (Sandskeið, Hveragerði, Hvolsvöllur, Skógar, Hvalfjarðargöng-sem-göng, Bifröst/Baulan, Varmahlíð) hafa **ENGIN hnit úr þessari rannsókn** — merkt UNKNOWN í `coverage.csv`, ekki ágiskuð úr staðarnafni (J4-regla).
- **Geodesic vegalengd** eftir leiðinni er **UNKNOWN** í þessari lotu: WFS-sýnið gaf ISN93-hnit fyrir LineString-brotin (raunveruleg leiðargeometry), en að reikna heildarlengd krefst að stilla saman öll 108+ brotin í réttri röð per `IdButur`, sem var ekki framkvæmt (NOT ATTEMPTED); gagnabeiðna- eða niðurhalsmörk voru ekki ástæðan. Samsetning brotanna og staðfest aðferð við leiðarlengd liggja ekki fyrir. Þetta er því UNKNOWN, ekki 0 eða ágiskun.
- **Nafnaárekstur-uppgötvun (ekta finding þessarar lotu):** `IdButur 910330037`, nefnt "Hellisheiði eystri" í færðarstraumnum, er landfræðilega á **Austurlandi** (ISN93 ~706.000–711.000 E), EKKI á Reykjavík–Vík leiðinni. Ísland hefur fleiri en einn stað kallaðan "Hellisheiði". Réttu segmentin fyrir leið A eru `902020037`/`252090037` ("Hellisheiði til vesturs/austurs"), staðfest landfræðilega rétt staðsett. Nafnaleit ein og sér hefði villt um fyrir þessari rannsókn.

---

## 4. Geometry→IDBUTUR→road-state join (raunverulegt sýni)

Sýnt með alvöru fyrirspurn (ekki lesið úr skjali): `GetFeature` á `gis:faerdferlar2017_1`, `CQL_FILTER=IDBUTUR IN (9 gildi úr leið A)`, skilaði 200 OK, GeoJSON, 108 `LineString`-eiginleikum, CRS `EPSG:3057`. **Fyrsta tilraun með hástaf-stillingu `IdButur` (eins og í færðarstraumnum) mistókst með `InvalidParameterValue`** — WFS-lagið notar `IDBUTUR` (allt hástafir), staðfest með `DescribeFeatureType`. Þetta er raunveruleg, ekki ágiskuð, stafsetningar-aðgreining milli tveggja Vegagerðar-kerfa sem vísa í "sama" gagnareit.

DATEX-section-geometry (GML LineString + OpenLR Linear, **önnur framsetning en legacy WFS**) var EKKI sótt — `PredefinedLocationsPublicationService` tímaðist út tvisvar (raunverulegur `curl` villukóði 28, 10,0 sek í hvort sinn). Samkvæmt J6 er þetta skráð sem blocker, ekki sönnun um að þjónustan sé ekki til — hinar fjórar DATEX-þjónusturnar á sama hýsil svöruðu án vandkvæða samstundis.

**DATEX-vs-legacy ID crosswalk — leiðrétt v2 (R7):** öll 271 `IRCA_ROADCONDITIONS_<n>`-viðskeyti OG öll 271 einstök `IRCA_PredefinedLocation_segments_<n>`-viðskeyti í varðveitta DATEX RoadCondition-sýninu eru full undirmengi af þeim 708 `IdButur`-gildum sem eru í legacy-straumnum — staðfest með beinni mengjasamlagningu (`harness/03_datex_roadcondition_analysis-output.txt`), EKKI bara "líking". Þetta er **sýnis-stigs tölutala-viðskeyta-sönnun** (VERIFIED SAMPLE), EKKI merkingarleg samsvörun (sama vegarkafla-mörk, sama átt) — það krefst `PredefinedLocationsPublicationService`, sem tímaðist út og var ekki endurreynt í þessari lotu (R5-ákvörðun: engin ný fyrirspurn). Halda INFERRED-merkingu fyrir merkingarlega samsvörun; VERIFIED SAMPLE-merkingu fyrir tölumengjasamsvörunina sjálfa.

**Lokunar-merkingasemantík — leiðrétt v2 (R2):** v1-skýrslan sagði `LOKAD` "kom EKKI fyrir" og `OTHEKKT` "3 tilvik" — BÁÐAR fullyrðingar voru rangar. Raunveruleg talning úr `harness/01_road_state_counts-output.txt` (708 skrár, legacy `faerd2017_1`): `GREIDFAERT` 443, `EKKI_I_THJONUSTU` 89, `OFAERT_ANNAD` 63, **`OTHEKKT` 49** (ekki 3), `HALKUBLETTIR` 21, `HALKA` 20, `SNJOTHEKJA` 8, `FAERT_FJALLABILUM` 6, `OFAERT_VEDUR` 6, `THUNGFAERT` 2, **`LOKAD` 1** (`IdButur` 903270037, "Nesjavallaleið", `AstandVidbotaruppl=ALLUR_AKSTUR_BANN`, `Snjomokstursregla=EKKI_MOKAD`). Sama mynstur í `AstandVidbotaruppl`-reitnum: 49 `OTHEKKT`. Auk þess sýnir varðveitt DATEX RoadConditionService-sýnið (271 `situation`, 273 `situationRecord`) **80 `roadClosed`** og **89 `closedPermanentlyForTheWinter`** sem tvær aðskildar tegundir innan 169 `RoadOrCarriagewayOrLaneManagement`-færslna, auk 49 `WeatherRelatedRoadConditions` (21 `icyPatches`, 20 `slippery`, 8 `snow`). **Ekkert af þessu var á einhverjum af okkar 23 (síðar leiðrétt 22, sjá §9b) checkpoint-segmentum við sóknartímann** — fullyrðingin "engin lokun sást á leiðunum þremur" er ÁFRAM SÖNN og styðst nú við raunverulega talningu, ekki ágiskun. Það sem var RANGT var fullyrðingin að lokunar-semantík sjálf væri ÓPRÓFUГ — hún er nú sýnd með raunverulegri `LOKAD`-skrá og raunverulegum DATEX-lokunarfærslum; það sem ÁFRAM er ÓPRÓFAÐ er átt/tímagildi-semantík (direction/validity-time), ekki tilvist lokunarástands sjálft.

---

## 5. Athuganir/spá per checkpoint

Sjá `coverage.csv`. Samantekt af raunverulegum, sóttum tölum (öll frá 2026-10-27, ~19:00–19:15 UTC):

| Checkpoint | Lofthiti (°C) | Yfirborðshiti vegar (°C) | Munur | Heimild |
|---|---|---|---|---|
| Hellisheiði (IRCA_MP_1) | 2.012 | 1.076 | -0.936 | DATEX MeasureDataService, `RoadSurfaceConditionInformation` (sérmerktur reitur) |
| **Öxnadalsheiði (IRCA_MP_4)** | **0.62** | **-0.087** | **-0.707** | sama — **lofthiti er yfir frostmarki, yfirborðshiti vegar er UNDIR frostmarki** — raunverulegt, ekki smíðað dæmi um að lofthiti ≥0 sanni EKKI að vegur sé íslaus |
| Blönduós (IRCA_MP_38) | 5.207 | 2.585 | -2.622 | sama |
| Kjalarnes (IRCA_MP_36) | 6.085 | 4.149 | -1.936 | sama |
| Hella (IRCA_MP_142) | 3.75 | 1.206 | -2.544 | sama |

Þessar tölur eru **raunmælingar**, ekki ályktun — `roadSurfaceTemperature` er eigin, sérmerktur DATEX-reitur, ekki reiknaður úr lofthita. **Engin ís/hálku-ályktun er dregin hér** — aðeins tölurnar sjálfar, eins og leiðbeiningarnar krefjast.

Veðurstofan (`t0`-reitur í `vedur-obs`-sýnum) sýnir svipaðan, en **ekki jafn skýrt merktan**, munur (t.d. Hellisheiði stöð 31392: `t`=-0,5, `t0`=-1,2 á einum tímapunkti) — `t0`-merkingin er EKKI staðfest að þýða "yfirborð vegar" í þessari rannsókn (ólíkt DATEX-reitnum sem er sérstaklega merktur) og er því UNKNOWN-merkt, ekki endurnýtt sem jafngildi.

**Leiðrétt v2 (R3) — athugunardekking var vanmetin af nafnaleit:** v1 merkti Sandskeið, Holtavörðuheiði og Vatnsskarð `UNKNOWN (ekki fundið með nafnaleit)` í `coverage.csv`, en varðveitta DATEX mælistöðvaskráin (205 stöðvar, með WGS84-hnitum og `measurementSiteIdentification`) sýnir þessar stöðvar MEÐ raunverulegum, lifandi mæligildum í varðveitta `MeasureData`-sýninu, fundnar með hnit/ID-mátun (ekki nafni): Sandskeið `IRCA_MP_17` (`measurementSiteIdentification=31488`, sama tala og Veðurstofu-stöðin): lofthiti 3.576°C, yfirborð 1.38°C, hámarksvindur 3.822 m/s. Holtavörðuheiði `IRCA_MP_3` (32097): 1.747/0.488°C, hámarksvindur 14.01 m/s. Vatnsskarð `IRCA_MP_24` (33431): 2.117/0.263°C, hámarksvindur 10.68 m/s. Að auki fundust Mýrdalssandur (`IRCA_MP_6`), Steinar og Hvammur undir Eyjafjöllum (`IRCA_MP_29`/`IRCA_MP_53`) — staðir á Route 1 milli Hvolsvöllur og Skógar sem v1 sagði "enga stöð í neinu netinu fundið" (sú fullyrðing var of breið; leitarumfangið var "nafnaleit", ekki "öll möguleg stöð"). `coverage.csv` er leiðrétt (sjá sama-skjals breytingar); `source-register.md` V3 taldi áður 11 samsvaraðar stöðvar en CSV sýndi 8 — nú samræmt. **`measurementSiteIdentification`-reiturinn jafngildir Veðurstofu/Vegagerðar-stöðvatölu** (31392, 33357, 31579, 6300, 3471 staðfest, auk 31488/32097/33431 núna) — þetta er nýtanlegur join-lykill sem v1 ekki notaði, nú staðfestur (`harness/04_datex_sites_match_analysis-output.txt`: 147 af 148 DATEX-stöðvum með `measurementSiteIdentification` samsvara beint `#450`'s 778-stöðva skrá).

**Fjarlægð stöðvar frá vegi — leiðrétt v2 (R3):** `vedur_station_distance_m=0` í v1-skjalinu var AÐEINS satt vegna þess að checkpoint-hnitin VORU TEKIN úr stöðvaskránni sjálfri — það er EKKI mæld fjarlægð að vegi. Leiðrétt í `coverage.csv`: þar sem checkpoint=stöð er þetta nú merkt skýrt "N/A (checkpoint = stöð, by construction)", ekki "0". Raunveruleg fjarlægð að vegpunkti (úr WFS-geometry, sem er í `EPSG:3057`) er EKKI reiknuð í þessari lotu og er merkt UNKNOWN með skýrðum blocker: ENGINN staðfestur WGS84↔ISN93-umbreytingartól er til í þessu umhverfi án þess að bæta við nýju ósjálfstæði (t.d. `pyproj`), og að handskrifa Lambert Conformal Conic-formúluna án óháðs, nákvæms sannprófunarpunkts hefði verið **ágiskuð umbreyting** — nákvæmlega það sem v2-leiðbeiningin bannar. Þetta er því UNKNOWN með nefndum blocker, ekki ágiskuð 0 og ekki smíðuð "lausn".

**Söguleg gögn/recent history**: `day_from=day_to=í dag` fyrirspurnin fyrir Hellisheiði (stöð 31392) skilaði klukkustundargögnum fyrir allan sólarhringinn — tæknilega aðgengilegt, en lengra sögulegt tímabil (t.d. síðustu 48 klst þvert á margar stöðvar) var EKKI prófað í þessari lotu (fjárhagsáætlun forgangsraðað í aðra þætti). Merkt NOT TESTED, ekki ófáanlegt.

**Spá**: 3 samantvinnaðar Open-Meteo-fyrirspurnir (4+5+2 punktar) skiluðu öllum 11 checkpoints 3 daga daily+hourly röð. Vöruauðkenni er **óstaðfest** (endurnýtt frá #450 — hvorki `dmi_seamless` svarið sjálft né bein samanburður leysir hvaða undirliggjandi líkan er notað).

---

## 6. Ferskleiki (freshness)

| Reitur | Merking | Staðfest hegðun þessarar lotu |
|---|---|---|
| `DagsSkrad` (Vegagerðin færð) | Hvenær ÁSTANDIÐ var raunverulega skráð | **Leiðrétt v2 (R6):** v1-talan "05:2x–13:3x UTC" var RÖNG. Raunverulegt bil yfir allar 708 skrár (`harness/01_road_state_counts-output.txt`): `02:55:00Z`–`18:19:41Z`. **340 af 708 skrám (48%)** hafa `DagsSkrad` nákvæmlega `02:55:00Z` eða `02:55:01Z` (~16 klst fyrir sóknartíma), þ.m.t. corridor-segment Kjalarnes, Selfoss–Hveragerði og Hvalfjarðargöng. Hvort þetta er næturkeyrsla/endurstilling er UNKNOWN, ekki ályktað — en hvers kyns ferskleikastefna sem byggir á `DagsSkrad` verður að taka tillit til þessa klasa. |
| `DagsKeyrtUt` (Vegagerðin færð) | Hvenær ÚTFLUTNINGURINN var keyrður, óháð innihaldsbreytingu | 2,5 mín munur á útflutnings- og sóknartíma í lifandi sýni — **staðfestir "aldrei >10mín" skjölunina**, EN segir EKKERT um hvenær `AstandYfirbord` sjálft breyttist síðast |
| DATEX `publicationTime`/`measurementTimeDefault` | Útgáfutími straums / mælitími per stöð | ~4 mín munur staðfestur fyrir Hellisheiði |
| Veðurstofa `time` (athugun) | Klukkustundartímapunktur mælingar | Beint úr sýni, ekkert sérstakt freshness-vandamál staðfest í þessari lotu |
| Open-Meteo forecast | `forecast_days=3`, engin run-time/model-version upplýsing í svarinu sjálfu | Óbreytt frá #450's niðurstöðu — keyrslutími líkans er ekki í svarinu |

**Lokunar-varanleiki**: engin lokuð leið (`LOKAD`) kom fyrir í sýninu, svo "lokun í dag tryggir ekki opnun á morgun" er EKKI prófanlegt með þessu sýni — meginreglan er eftir sem áður bindandi fyrir hvers kyns framtíðarhönnun (ósamþykkt hér), ekki staðfest með raunverulegu lokunartilviki.

---

## 7. Issue acceptance-gátlisti (núverandi #429 — 8 atriði, J10)

| # | Gátlistaatriði (úr lifandi issue) | Svar |
|---|---|---|
| 1 | Þrjár leiðir og current evidence frá eldri comments samræmd í einni töflu | **JÁ** — §1 hér að ofan |
| 2 | IDBUTUR geometry→road-state join sýnt með sýni eða skráðum blocker | **JÁ** — §4, raunverulegt sýni (108 features) PLUS raunverulegur DATEX-blocker skráður |
| 3 | Spá/athugun/opinber lokun/eigin túlkun og freshness aðgreind | **JÁ** — §5–6; engin eigin túlkun er lögð til í þessari rannsókn (utan umfangs) |
| 4 | Shared #450 findings endurnýtt; engin provider-switch/accuracy fullyrðing án gagna | **JÁ** — §2, J1-hashar staðfestir, engin ný app-wide rannsókn gerð |
| 5 | Blind spots, licensing/quota/access og missing/stale/unknown closure cases skráð | **JÁ** — §4 (`OTHEKKT`), `source-register.md` (UNKNOWN-merkt licence fyrir Vegagerðina/DATEX) |
| 6 | Must-have/nice-to-have og winter history/arrival-time þörf afmörkuð | **JÁ** — §9 hér að neðan |
| 7 | Route-level PASS/PARTIAL/FAIL og overall GO/PARTIAL/NO-GO rökstudd | **JÁ** — Síða 1 |
| 8 | Niðurstaða segir nákvæmlega hvað er raunhæft fyrir einn þróunaraðila og hvað er ekki stutt | **JÁ** — `next-task-proposal.md` |

## 7b. Gamli spike-gátlistinn (10 atriði, SÖGULEGUR, EKKI STÝRANDI, J10)

Varðveittur fyrir samhengi, EKKI endurmetin sem gildandi samþykktarviðmið (núverandi #429-líkami ræður):

1. Reykjavík→Vík kortlögð — gert, §1/§3/`coverage.csv`
2. Reykjavík→Akureyri kortlögð — gert
3. Reykjavík→Borgarnes kortlögð — gert
4. `IDBUTUR` staðfest þar sem við á — gert, §4
5. Færðargögn prófuð á öllum leiðum — gert
6. Vegagerðarveður/raunmælingar kortlagðar — gert að hluta (DATEX MeasurementSiteTable/MeasureData), ekki tæmandi
7. DMI HARMONIE IG forecast coverage staðfest — **EKKI staðfest í þessari lotu** (endurnýtt UNKNOWN frá #450/#456; Open-Meteo notað í staðinn, vöruauðkenni óstaðfest)
8. Blindir blettir skráðir — gert, víðar í þessari skýrslu
9. Route PASS/PARTIAL/FAIL — gert, Síða 1
10. Heildar GO/PARTIAL/NO-GO — gert, Síða 1 (PARTIAL, ekki hreint GO eins og gamla comment-röðin fullyrti)

---

## 8. `routeRisk.js` — umfangskort (J9), EKKI leiðargeometry

Staðfest með innihaldsleit (ekki bara skráarnafni): **einn** framleiðslu-ákallandi fannst, `src/hooks/useRoutePlanner.js:200-205`, sem kallar `estimateRouteRisk({origin, destination, getForecast, hazards: HAZARDS_V1, samples: 7})`. `origin`/`destination` eru **tjaldsvæða-hnit** (núverandi + kandídat-tjaldsvæði fyrir Route Planner-endurstaðsetningu), EKKI vegapunktar. `getForecast` er `../lib/forecastCache`'s sama Open-Meteo-í-gegnum-proxy sem allt appið notar — þetta staðfestir sjálft J3's kröfu: hvaða "forecast source" sem núverandi kóði notar fyrir hvað sem líkist "leið" er **Open-Meteo í gegnum núverandi proxy, vöruauðkenni óstaðfest**, ekki DMI beint.

`interpolateRoutePoints` (línurit 1-15) er **línuleg lat/lon-millibilun** milli tveggja punkta — EKKI vegfylgjandi geometry. `samples` default 7, minimum 2 (`Math.max(2, Number(samples)||7)`, línurit 61). `TOMORROW_INDEX = 1` (línurit 65) — vísitala 1 í daily-fylkjunum. `rain`/`rainMax` er TRACKAÐ (línurit 69,99,114-120) en **fer EKKI inn í `classifyRouteRisk`** (línurit 28-52) — eingöngu `maxWind`/`maxGust`. `dateVerified` (línurit 160) = `anyDateSeen && !dateMismatch`. Lykkjan (línurit 82-130) er **sequential `for...of`**, enginn eigin timeout-vafningur um `getForecast`-kallið sjálft (hvaða timeout sem er kemur frá `getForecast`-innleiðingunni, ekki frá `estimateRouteRisk`). Per-punkts `try/catch` (línurit 85-93) kemur í veg fyrir að einn bilaður punktur stoppi alla keyrsluna (#460).

**Þetta flyst EKKERT yfir á vegaöryggi.** `estimateRouteRisk` er núverandi, ÓVIÐKOMANDI tjaldsvæða-skimunarkóði fyrir Route Planner — ekki grunnur, ekki hluti af, og ekki endurnýtanlegur óbreyttur fyrir Winter Route Advisor, sem þyrfti raunverulega vegageometry og checkpoint-raðir, ekki tvípunkta-millibilun milli tjaldsvæða.

---

## 9. Must-have / nice-to-have / blocked (með takmörkunum)

| Flokkur | Atriði | Staða þessarar rannsóknar |
|---|---|---|
| **Must-have** | Route geometry + checkpoints | PARTIAL fyrir leið A (6 af 9 checkpoints, leiðrétt v2); **FAIL fyrir leið B/C sérstaklega** (engin WFS-geometry sótt fyrir þær, leiðrétt v2 — sjá Síða 1) |
| | IDBUTUR/road-state join | PARTIAL fyrir allar þrjár — leið A: join SÝNDUR fyrir 6/9 (ekki PASS fyrir "alla", leiðrétt v2); B/C: `IdButur`-ástand staðfest fyrir alla checkpoints en geometry-hluti joinsins ekki endurtekinn |
| | Núverandi lokanir/atvik | PARTIAL — leiðrétt v2 (R2): raunveruleg `LOKAD`-skrá (1) og `OTHEKKT` (49, ekki 3) fundin í legacy-straumnum; raunveruleg `roadClosed`(80)/`closedPermanentlyForTheWinter`(89) fundin í DATEX-sýninu — lokunarsemantík ER sýnd með raunverulegum skrám, en átt/tímagildi er áfram ÓPRÓFAÐ. DATEX Point Incidents-þjónusta EKKI prófuð í neinni lotu (leiðrétt v3: ekki fjárhagsskortur, einfaldlega ekki reynt, sbr. R2) |
| | Nýjustu veðurathuganir per segment | PARTIAL — leiðrétt v2 (R3/R4): 12 af 21 röðum í `coverage.csv` hafa staðfesta, lifandi mælingu frá annaðhvort Veðurstofu eða Vegagerðar-DATEX (ekki "9 af 17" eins og v1 sagði — CSV hefur 21 raðir/20 einstök checkpoints, ekki 17; sjá `harness/05_coverage_consistency_check-output.txt`) |
| | Vegahiti ("road temperature") | **PASS fyrir checkpoints með DATEX-sýni** — sérmerktur `roadSurfaceTemperature`-reitur, raunmældur, aðgreindur frá lofthita (§5) |
| | ETA-byggt mat (sjá `pre-sample-plan.md`) | Ekki enn hannað í kóða — þetta er afhendingaratriði í `next-task-proposal.md`, ekki þessi rannsókn |
| | Opinberar lokanir yfirtaka útreiknað mat | Reglan er skráð sem bindandi fyrir framtíðarhönnun; EKKI útfærð, EKKI prófuð með raunverulegu lokunartilviki (engin lokun í sýninu) |
| **Nice-to-have** | Söguleg veðurgögn (48 klst+) | NOT TESTED þessa lotu (tæknilega mögulegt skv. einnar-stöðvar sýni, ekki stigstærðarprófað) |
| | Umferð/mynadavélar | DATEX hefur `trafficFlow`-gögn (sést í MeasuredData-sýni) — ekki sérstaklega eftirsótt hér, nefnt sem aukaupplýsing sem er til |
| | Ökutækjasamhengi (caravan/bíll) | Ekki rannsakað — vöruákvörðun, ekki gagnaveituspurning |
| **Blocked/UNKNOWN** | Bein DMI-tenging | #456's umfang, ekki endurtekið hér |
| | DATEX section-geometry | Tvær 10 sekúndna tilraunir tímaðust út; skráð aðgengishindrun í sýnatöku |
| | SafeTravel | UNCONFIRMED/OPTIONAL, ekki reynt í þessari lotu |
| | Leyfi/endurnotkunarskilmálar fyrir Vegagerðargögn (bæði legacy og DATEX) | UNKNOWN — engin skilmálatexti fannst á sóttum síðum |

---

## 9b. Rubric-viðmiðun fyrir leiðar-einkunnir (nýtt í v2, R4)

Reiknað beint úr `coverage.csv` (sjá `harness/05_coverage_consistency_check-output.txt` fyrir fulla, vélritaða úttekt sem þessi tafla endursegir):

| Cap. | Lýsing | Leið A | Leið B | Leið C |
|---|---|---|---|---|
| 1 | Official geometry | PARTIAL (6/9 checkpoints, WFS-sýni) | **FAIL (engin WFS-fyrirspurn gerð fyrir B þessa lotu)** | **FAIL (sama, engin fyrir C)** |
| 2 | IDBUTUR/road-state join | PARTIAL (6/9 sýnt með raunverulegu sýni) | PARTIAL (road-state fyrir alla 9, geometry-hluti ekki) | PARTIAL (sama, 3/3 road-state) |
| 3 | Lokanir/atvik | PARTIAL (semantík sýnd með raunverulegum skrám, átt/tímagildi óprófað) | sama (sama feed, allar leiðir) | sama |
| 4 | Stöð/mæling | PARTIAL (dreifni-fjarlægð UNKNOWN, ekki 0; sjá §5) | sama | sama |
| 6 | Forecast | PARTIAL (4/9 checkpoints) | PARTIAL (6/9) | PARTIAL (2/3) |
| 7 | Freshness | PASS (sýnt með raunverulegum tímastimplum fyrir hvert cap., þó 02:55Z-klasinn sé sjálfur UNKNOWN-orsök) | sama | sama |

Rubrikan (`pre-sample-plan.md` lið b): "Ein FAIL í 1 (geometry), 2 (join) eða 3 (lokanir) blokkar route-PASS óháð öðrum." Leið A: ekkert FAIL í 1-3, en ekki allar 9 checkpoints ná PARTIAL-lágmarki samtímis (sjá §5-leiðréttingar) → **PARTIAL**. Leið B/C: FAIL í cap.1 → **PARTIAL** (ekki FAIL-heildareinkunn — rubrikan segir FAIL í 1-3 blokkar PASS, ekki að route sjálft verði FAIL; restin af gögnunum er of sterk til að kalla leiðina FAIL í heild). Niðurstaða samræmist Jonesy's R4-ályktun ("All three look PARTIAL").

**Hvaða checkpoints eru "critical"?** Þessi rannsókn tók ekki formlega ákvörðun um það — frosna planið skilgreinir það ekki annars staðar en óbeint ("checkpoint judged critical"). Fyrir þessa úttekt er sá listi einfaldlega öll checkpoints sem skráð eru í `coverage.csv` fyrir viðkomandi leið (9/9/3) — ef eigandi vill þrengja "critical"-hugtakið (t.d. sleppa jarðgöngum eða upprunastað), breytist PARTIAL-rökstuðningurinn en ekki PARTIAL-niðurstaðan sjálf fyrir neina af leiðunum þremur miðað við núverandi gögn.

---

## 10. Takmörkunarsamantekt (fjárhagsáætlun)

Sjá `samples/manifest.md` fyrir fullt bókhald. **Gögn: 14 nettengingar skráðar (12 náðu árangri, 2 voru tvær leyfðar tilraunir sem báðar tímaðust út á sama endapunkti), ~2,4 MB flutt — langt innan 30-fyrirspurna/20MiB marka.** **Skjöl: 4 fyrirspurnir, ~790 KB — langt innan 20-fyrirspurna/10MiB marka.** Umtalsverður varasjóður (16+ fyrirspurnir í hvorum lið) var EKKI notaður. **Leiðrétt v2 (R5, Ripley-ákvörðun):** sá varasjóður er sjálfur EKKI ástæðan fyrir því að tiltekin vinna var ekki unnin í v1 — mörg af þeim atriðum sem v1 útskýrði með "fjárhagsáætlun forgangsraðað" (t.d. Route B/C-geometry, Sandskeið/Holtavörðuheiði/Vatnsskarð-mátun) voru í raun LEIÐRÉTT með ENDURGREININGU á gögnum sem þegar voru sótt — þau voru NOT ATTEMPTED af öðrum ástæðum (tímaforgangsröðun innan lotunnar, ekki tæmdur fjárhagur), og þessi v2-lota lagaði það með því að endurnýta sömu sýni dýpra, ekki með nýrri fyrirspurn (sem var EKKI leyfð í þessari v2-lotu, sjá R5 hér að ofan). Það sem er ÁFRAM ekki gert (Route B/C WFS-geometry, Sandskeið/Vík DATEX-mátun, geodesic-lengd, leyfisskilmálar, HTTPS-próf) er skráð sem **ÓFRAMKVÆMT, sönn ástæða gefin** — ekki sem "innan fjárhagsáætlunar" blekkjandi skýring.

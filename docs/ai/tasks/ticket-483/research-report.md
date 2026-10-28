# #483 — Rannsóknarskýrsla: Staðfesting leiðartenginga og gagnasamninga fyrir Reykjavík–Vík

2026-10-28. CC. Framkvæmt eftir `approved-prompt-v1.md` og leiðrétt eftir `approved-prompt-v2.md` (Jonesy R1–R5/S1–S5 + owner-source A1–A7, felld inn af Ripley). Hrein rannsókn — engin framleiðslubreyting, engin GitHub-aðgerð. Frosið plan: `pre-sample-plan.md`, SHA256 `ab04857f1ed6527ac090132b32d2fcf3e9e35fd8c6c200a55dd00f3087cc72c8` (frosið "as-of" 18:45:36Z; skráin sjálf síðast skrifuð 18:47:47Z, báðar á undan fyrstu fyrirspurn 18:48:02Z — S5, ekki ruglað saman). Grunnlína: HEAD `1272ff4281017e98337a68b6d638b66a77c1b94b`, óbreytt. **ENGIN ný ytri fyrirspurn í þessari leiðréttingarlotu** — öll leiðrétting byggir á endurgreiningu varðveittra sýna og eigandaveittra skjala.

Einkunnastig: **VERIFIED SAMPLE**, **VERIFIED DOCUMENT CONTENT** (eigandaveitt, ekki lifandi sýni), **INFERRED**, **UNKNOWN/NOT TESTED**.

**Fyrri PASS/GO-niðurstaða þessarar skýrslu er ÚRELT og ÓGILD — sjá leiðrétting hér að neðan.** Hún er varðveitt í breytingasögu, ekki endurtekin sem núverandi ráðgjöf.

---

## Síða 1 — Niðurstaða (LEIÐRÉTT)

### Leiðarniðurstaða: **PARTIAL**

### Heildarniðurstaða: **PARTIAL**

**R1 — leiðrétting á einkunn (MEÐALHÁ alvarleiki, Jonesy):** Frosna reglan í `approved-prompt-v1.md` J2 er ótvíræð: *"Unresolved reuse permission or plain-HTTP-only required feed caps route at PARTIAL and overall at PARTIAL at most ... No GO for speculative later rights."* Spá (Open-Meteo) er SKILGREINDUR hluti af afurðinni (hæfni 4), og Open-Meteo-framleiðsluréttindi (#453: eigandi greinir frá lykli, Preview-staða óstaðfest, customer-host-hegðun óprófuð) eru ÓLEYST — þau eru EKKI óbeint samþykkt með því að vera "borin áfram sem forsendur" í fyrri útgáfu þessarar skýrslu. Veðurstofu-skilmálar eru ENDURNÝTTIR úr #450, EKKI endurlesnir í þessari lotu. Vegagerðar-skilmálasíðan (§6) er VERIFIED DOCUMENT CONTENT en hvort hún nákvæmlega gildir um HVERJA einstaka þjónustu (legacy, WFS, DATEX) sem notuð er er ÁLYKTUN ("öll gögn Vegagerðarinnar"), ekki orðrétt tilgreint per þjónustu.

**Þess vegna: hæfni 6 (aðgangur/endurnotkun) = PARTIAL, ekki PASS, fyrir ALLAR 6 kaflasvæðin.** Frosna reglan segir að þetta eigi SJÁLFKRAFA að setja leiðar- og heildarniðurstöðu í PARTIAL hámark — óháð því að hæfni 1 og 2 (geometry, færð) ná PASS fyrir öll kaflasvæði. Fyrri PASS/GO-niðurstaða braut þessa frosnu reglu og er **felld niður sem úrelt, ekki núverandi ráðgjöf**. Raunveruleg framför (keðjufundur, SRS-sönnun, leyfisfundur, HTTPS-staðfesting) er ÁFRAM sönn og skráð — hún lyftir einfaldlega ekki þakinu.

**Óbreytt frá fyrri útgáfu:** þetta er rannsóknarniðurstaða fyrir nákvæmlega þá þröngu upplýsingasýn sem skilgreind er í `pre-sample-plan.md` §1 — EKKI fyrir upprunalegu Winter Route Advisor-hugmyndina, sem er áfram ekki samþykkt óháð niðurstöðu. SafeTravel óstaðfest/valfrjálst; #456 sérstakt umfang.

### Hvað er raunverulega satt (framför frá #429, óbreytt af R1-leiðréttingunni):

| Hindrun (frá #429) | Staða núna | Fyrirvari |
|---|---|---|
| "Reykjavík–Sandskeið–Hellisheiði" — engin IDBUTUR fannst | Leyst AÐ MESTU | **R2-leiðrétting:** keðjan byrjar við `1410010037` "Rauðavatn", EKKI alveg inn í Reykjavík — Hringvegur heldur áfram í gegnum `914020037`/`903020037` (staðfest tengt, 1,3m/10,8m), en lengd þess hluta er EKKI reiknuð (margræð akbrautar-/hringtorgs-/aðrein-staða á því svæði, ekki heimilt að ágiska) |
| "Selfoss–Hella" / "Hvolsvöllur–Skógar" / "Skógar–Vík" — engin IDBUTUR fannst | Leyst | Óbreytt frá fyrri útgáfu — samfelld keðja fundin með `VEGNR='1'`-fyrirspurn |
| Vegalengd — UNKNOWN | **R3/N8-leiðrétting:** 174,95–175,64 km bil (ekki 179,2km eins og áður sagt, EKKI ein tala) | Fyrri tala innihélt 3,6km af `VEGNR 33`/`261` óvart. Bilið (ekki stök tala) endurspeglar hringtorgs-óvissu (sjá §1) — Reykjavíkur-álman er AUK ÞESS ekki innifalin (§1, span 0) |
| Leyfi Vegagerðarins — UNKNOWN í #429 | Fundið, en ályktað per-þjónustu | CC BY 4.0 staðfest með orðum, en ekki orðrétt tilgreint fyrir hverja einstaka þjónustu — INFERRED, ekki VERIFIED per service |
| HTTPS — ekki prófað í #429 | Staðfest fyrir TVÆR þjónustur, ÓNÝTT fyrir eina | **N4-leiðrétting:** `faerd2017_1` hefur BÆÐI HTTP-sýni OG sérstakt HTTPS-próf; WFS var SÓTT yfir HTTPS (ekki sérstakt vottorðspróf, en raunveruleg HTTPS-fyrirspurn); punktafóðrið (`faerdpunktar2017_1`) var AÐEINS sótt yfir plain HTTP, HTTPS ALDREI reynt — þetta er krafin lokunarheimild, óleyst gagnaflutningsstaða |
| Athugunarstöð-fjarlægð | Reiknuð með réttri aðferð núna | **N1/N7-leiðrétting:** fyrri tala (34,9m/95,1m) notaði NÆSTA-HNITPUNKTS fjarlægð (vitlaust); rétt punkt-til-línu fjarlægð er 22,7m/81,3m. Hlutfalls-prósentur (33%/49%) FJARLÆGÐAR, ekki endurteknar með fyrirvara — einfaldara, heiðarlegra: næsta-lína fjarlægð aðeins, restin af kaflanum UNKNOWN |

---

## 1. Leiðargeometry: aðferðin stóðst, lengdarsýnið var mengað (R2/R3)

`VEGNR='1'`-fyrirspurnin (landsvísu, 996 eiginleikar, 74 `IDBUTUR`) fann samfellda 13-kafla keðju frá Rauðavatni til Víkur, hver kafli tengdur næsta með raunverulegri hnitasamsvörun (0,0–34,7m, `harness/01`). Full nöfn (`FulltNafnButs`) staðfesta "Hringvegur" fyrir alla 13 — ekki ágiskun.

**R3 — lengdarsýnið var ekki hreint:** `wfs-chain-4326.json` (sýnið sem lengdin var reiknuð úr) var sótt með `CQL_FILTER=IDBUTUR IN (13 gildi)` — EKKI `VEGNR='1'`. Það inniheldur **144 VEGNR=1, 4 VEGNR=33, 8 VEGNR=261** eiginleika (staðfest sjálfstætt, `harness/02`). Fyrri fullyrðing "hrein með smíði fyrirspurnar" átti við landsvísu-sýnið (sem ER hreint), ekki þetta sýni. Leiðrétt: öll lengdarútreikning síuð á `VEGNR='1'` FYRST.

**VEGHLUTI-hlutverk (ný regla þessa lotu, A2):** Skjalfest: `0`=miðlína, `3`=aðrein inn, `4`=aðrein út, `5`=hringtorg, `6`/`7`=akbrautir í og á móti ferðarátt. Lifandi gögn hafa AUK ÞESS óskjalfesta gilda `1` (flest kaflar okkar, ÁLYKTUN: líklega "ódeild akbraut") og `8`. Keðjan okkar ber EINGÖNGU `1`, `5` og `7` — ENGIN `3`/`4` (engar aðreinar), ENGIN `6` (því aðeins "til austurs"-átt valin samkvæmt, sjá næst). **Ferðarátt yfirlýst: Reykjavík→Vík, austur/suður** — `252090037` ("Hellisheiði til austurs", `VEGHLUTI=7`) er valið, EKKI vesturátta-parið `902020037` ("til vesturs", `VEGHLUTI=6`), sem ER í landsvísu-sýninu en EKKI í keðjunni. Þetta er yfirlýst stefnuval, ekki vestur-átta-þekja gefin í skyn.

**Hringtorgs-brot (`VEGHLUTI=5`):** 0,69km af keðjunni er hringtorgs-brot (3 kaflar: Selfoss-Hveragerði, Þjórsá-Selfoss, Hella-Þjórsá — líklega Ölfusár-brúar-svæðið, sbr. punkta-atvikið í §2). Ákvörðun: INNIFALIÐ með yfirlýstu, mörkuðu ofureikningsfyrirvara (bíll keyrir ekki heilan hring) — ekki útilokað með ágiskun um hvaða hluta hringsins er raunverulega ekinn.

**Nákvæmnisstig (`NAKVAEMNIFERLIS`):** lifandi gögn hafa 4 stig: `-1` (ÓSKJALFEST, flest hnitapunktar), `0`/`1`/`2` (skjalfest, 2019-PDF: `0`=lítið þynnt). Næmnistafla (hvert stig gefur, `VEGNR=1` eingöngu):

| Stig | Lengd |
|---|---|
| -1 (óskjalfest) | 175,78 km |
| 0 (skjalfest, valið) | **175,64 km** |
| 1 (skjalfest) | 175,06 km |
| 2 (skjalfest) | 173,40 km |

**N8-leiðrétting — lengd gefin upp sem BIL, ekki ein tala:** raunveruleg ekin braut gegnum hringtorg er óleyst (bíll ekur ekki heilan hring) — rétt framsetning er bil milli ÚTILOKA og INNIFELA fulla hringtorgs-geometríu, ekki ein "besta" tala sem gefur falska nákvæmni. **Heildarlengd keðjunnar (13 kaflar, `VEGNR=1` eingöngu, stig 0): 174,95–175,64 km** (án/með fullum hringtorgshring, kúluform/haversine) — EKKI 179,2km eins og áður sagt (það innihélt 33/261-mengun), EKKI ein 175,64km-tala án fyrirvara. **ISN93-flatarmál (frumgögn, engin umvörpun) sama 13 kaflar/sía/stig: 176,26 km** — ÞRIÐJA, AÐGREIND aðferð, EKKI lögð saman við kúluform-bilið; ~0,3–0,4% munur samræmist skjalfestum ISN93-skalastuðli (≤1,0003 á þessu svæði, eigandaskjals-reikningur, ekki endursannreiknt hér). Þetta bil nær AÐEINS yfir þessa 13 varðveittu kafla — EKKI Reykjavíkur-álmuna (sjá næst) og ekki endanlega, óyggjandi "heildarlengd Reykjavík–Vík".

**N6-leiðrétting — Reykjavíkur-endapunktur: regla reynd, ekki leyst (ný "kaflasvæði 0" röð í `coverage.csv`).** Frosna reglan krefst NÆSTA-Reykjavíkur-akkeris-endapunkts. Akkeri notað: Veðurstofu-stöð 1 "Reykjavík" (VARÐVEITT, úr #450's eigin stöðvaskrá — EKKI ágiskað almennt-þekkingar-hnit). Frambjóðendur: `1410010037`, `914020037`, `903020037` (öll tengd, sjá §1 adjacency). **HINDRUN:** `914020037`/`903020037` hafa ENGA varðveitta WGS84-geometríu (aðeins frumgerð ISN93 í landsvísu-sýninu) — að bera akkerið (WGS84) saman við þá geometríu krefst umvörpunar sem er EKKI til staðfest hér án nýrrar fyrirspurnar (ekki heimilt) eða ágiskaðra vörpunarfasta (nákvæmlega það sem þessi lota MÁ EKKI gera). **Niðurstaða: hvaða frambjóðandi er raunverulega "næstur" er UNKNOWN**, ekki ákveðið með ágiskun. Þetta er nú sérstök, yfirlýst óleyst "kaflasvæði 0" röð í `coverage.csv` — EKKERT er falið eða gefið í skyn leyst.

**Viðbót við N6 hér að ofan:** Hringvegurinn heldur áfram frá `1410010037` í gegnum `914020037` ("Suðurlandsv. um Hádegismóa") og `903020037` ("Vesturlandsvegur") — tengt staðfest (1,3m, 10,8m, `harness/01`). `903020037` tengist AUK ÞESS `903030037` ("Kjalarnes"), þ.e. mótum Reykjavík–Vík-leiðarins og ALGERLEGA ANNARRAR leiðar (Reykjavík–Akureyri) — ekki frekari framvinda í átt að Vík, heldur staðfesting þess að þetta svæði er samgöngumiðstöð, ekki leiðin áfram. Hvort `914020037` eða `903020037` (eða hvort tveggja) er "réttur" endapunktur er UNKNOWN, eins og N6 segir — tenging er staðfest, en REGLAN sjálf (næsti-akkeri) er ekki framkvæmanleg að fullu án umvörpunar sem ekki er til hér.

`z=0` í ISN93-hnitum þýðir "engin hæð skráð" (skjalfest) — EKKI sjávarmál. Kaflarnir Rauðavatn–Hellisheiði hafa `z=0` á ÖLLUM hnitapunktum (hæð ófáanleg úr geometríunni fyrir þann hluta); hinir 9 kaflarnir hafa að hluta raunverulega hæð (6–121m). Gamla hæðartafla (2010) er AÐEINS samhengi, EKKI kvörðun — ekki notuð til að fylla `z=0`.

---

## 2. Færð og lokanir (ferskt sýni)

Fersk `faerd2017_1`-sókn (708 skrár) sýnir **ALLA 13 kafla GREIDFAERT**. Landsvísu: `GREIDFAERT` 465, `EKKI_I_THJONUSTU` 90, `OFAERT_ANNAD` 62, `OTHEKKT` 56, `HALKUBLETTIR` 19, **`LOKAD` 2** (`907090037`, `903270037` — hvorugt á leiðinni), `KRAP` 1, `FAERT_FJALLABILUM` 6, `THUNGFAERT` 1, `OFAERT_VEDUR` 6.

`faerdpunktar2017_1` (43 skrár landsvísu, EKKI sótt í #429): **R5/A5 — tengingarregla sett fram skýrt núna.** Eigið `IdButur`-gildi EINN SÉR er ekki nóg, OG nálægð EIN SÉR er ekki nóg — bæði eru athuguð aðskilið.

**N1-leiðrétting, DREGUR TIL BAKA v2's fullyrðingu:** v2 sagði atvik 67862 vera "310m frá keðjunni, óleyst ósamræmi við rýnanda" — það var RANGT, af því að fjarlægðaraðferðin mældi til NÆSTA HNITPUNKTS, ekki til LÍNUNNAR milli punkta. Rétt punkt-til-línu fjarlægð (frumgerð ISN93, `harness/03`): **67861 = 0,089m, 67862 = 0,138m** — BÁÐIR eru TENGDIR (langt innan 50m marksins). Bæði VEGAVINNA-atvikin ERU á keðjunni — "310m-ósamræmið" er AFTURKALLAÐ, ekki endurtekið með fyrirvara. (Rýnandans eigin fyrri 1m/15m-tölur eru LÍKA afturkallaðar af rýnanda sjálfum — hvorugt sett talna var endurgeranlegt réttum hætti; núverandi 0,089m/0,138m ERU endurgeranleg og staðfest sjálfstætt.) Atvik 73801 (STEINKAST, `IdButur=901330037`, EKKI á keðjunni) er 262,5m frá næsta keðjusegmenti með SÖMU réttu aðferð — nálægð EIN SÉR gerir það EKKI að hluta leiðarins; óstaðfest hvort það er á Hringvegi eða hliðarvegi.

**Óskjalfest `Astand`-gildi fundin (A5):** `GRJOTHRUN`, `HOLUR_I_VEGI`, `TONN_ALLS` eru EKKI í eigandaskjalinu. Reglan fyrir framtíð: þessi gildi berast ÁFRAM með upprunatexta ("óþekkt ástand"), ALDREI sleppt eða kortlögð sem "opið".

`ALLUR_AKSTUR_BANN` getur birst í BÆÐI punkta-`Astand` OG kafla-`AstandVidbotaruppl` — lokunarlestur sem skoðar aðeins `LOKAD` er ófullkominn (A5).

**N3 — ferskleiki/útrunnið-regla, nú raunverulega lögð fram (v2 lofaði þessu en skilaði ekki):** Útflutnings-til-öflunar-töf mæld BEINT (ekki aðeins fullyrt): kaflafóðrið `faerd2017_1` 4 mín 12 sek, punktafóðrið `faerdpunktar2017_1` 16 sek — bæði innan skjalfestrar ~10-mín-væntingar, EINN mælipunktur hvort, EKKI SLA. Öll 708 `IdButur`-gildi landsvísu enda á `0037` (sjálfstætt endurstaðfest, ekki aðeins vitnað í rýnanda) — staðfestir aðra útgáfukynslóð en 2019-skjalsins eigin dæmi (sem enda á `0010`/`0006`).

**C2-leiðrétting (v4) — tímastimpla-sannprófun kláruð, var ÓFULLGERÐ í v3:** v3 reiknaði aldur `DagsSkrad` (mat/skráning) AÐEINS gegn öflunar-tímanum (fetch), EKKERT gegn útflutnings-tímanum (`DagsKeyrtUt`), og hafði ENGA sjálfvirka athugun á vantandi/ólæsilegum/neikvæðum/ósamkvæmum tímastimplum þrátt fyrir að v3's eigin fyrirmæli hafi beðið um það. Núna (`harness/03`) er aldur reiknaður gegn BÁÐUM viðmiðum (öflun OG útflutning, einingar/tilvísun skýrt merkt) fyrir alla 13 kaflana, og athugað sérstaklega: vantandi kafla, ólæsilegan `DagsSkrad`, neikvæðan aldur, mat-SKRÁÐ-EFTIR-útflutning, og (á fóður-stigi) útflutning-EFTIR-öflun. **Niðurstaða: ENGIN slík villa fannst** (sagt BEINT, ekki þagað um) — öll 13 `DagsSkrad`-gildi eru læsileg, jákvæð aldur, og á undan bæði útflutnings- og öflunar-tímanum, í réttri röð. Að auki er NÝ athugun á punkta-ATVIKUM sjálfum (IdPunktur 67861/67862/73801) bætt við — áður var AÐEINS fóður-stigs útflutnings/öflunar-töfin mæld, EKKI aldur hvers atviks. **Ný staðreynd, ekki fyrri villa:** bæði VEGAVINNA-tilkynningarnar (67861, 67862) voru SKRÁÐAR 2026-03-09, þ.e. **233 dögum** fyrir þessa sókn — langur skráningaraldur, EKKI sjálfkrafa merki um úrelt gögn (sbr. reglu #4 hér að ofan: `GildirTil` til 2029 lýsir langtíma-leyfi), en skjalfest sem athugunarvert gagnsæi-atriði. `GildirTil`-fyrir-`DagsSkrad` (rökvillt gildistími) var einnig athugað — EKKI fundið hjá neinu af þessum þremur atvikum.

**Lögð fram sýnileikis-/útrunnin-regla (vöruákvörðun, EKKI veðuröryggisviðmið EÐA skjalfest SLA):**
1. Sýna ALLTAF upprunalegan tímastimpil hverrar heimildar OG reiknaðan aldur við hliðina.
2. Óþekktur/vantandi tímastimpill þýðir ÓÞEKKTUR ferskleiki — aldrei gefið í skyn ferskt.
3. Útrunnið punkta-atvik (eftir `GildirTil`) er ekki virkt fyrir þann gildistíma, EN það er EKKI sönnun að vegurinn sé greiðfær.
4. Þekkt lokun (`LOKAD`/`ALLUR_AKSTUR_BANN`) er ALDREI ógilt af hagstæðri spá.
5. Vantandi/misvísandi/of-gömul KRÖFUÐ heimild skilar "ófáanlegt"/"takmarkað", EKKI sjálfgefið "opið".
6. Hvers kyns tölulegt úreldingarmark er YFIRLÝST vöruákvörðun ("merkja ef aldur > 20klst" t.d.) — EKKI sett fram sem öryggis- eða SLA-viðmið.

`GildirTil`-gildi sem ná til 2029 lýsa LANGTÍMA framkvæmdaleyfum — EKKI trygging að vinna sé í gangi á tilteknum framtíðar-ETA-tíma, EKKI sönnun nýlegrar endurskoðunar.

---

## 3. Ferskt DATEX-sýni

`IRCA_MP_1` (Hellisheiði): loft 0,005°C, vegyfirborð -0,04°C. `IRCA_MP_17` (Sandskeið): loft 2,93°C, vegur 0,855°C. `Veghiti` er AÐEINS núgildi, ekki sögulegt — J7's "ekkert þekkt vegyfirborðs-sögu-heimild" er ÁFRAM UNKNOWN, ekki leyst (A4).

---

## 4. Athuganir: "innan 3km" er næsta-punkts fjarlægð, ekki kaflaþekja (S3)

| Stöð | Næsti kafli | Fjarlægð (punkt-til-línu, leiðrétt v3) |
|---|---|---|
| Hellisheiði (31392) | `252090037` | **22,7m** (var 34,9m — næsta-hnitpunkts-aðferð, rangt) |
| Sandskeið (31488) | `253020037` | **81,3m** (var 95,1m) |

**N1-leiðrétting:** fyrri fjarlægðartölur (34,9m/95,1m) mældu til NÆSTA HNITPUNKTS, ekki til LÍNUNNAR sem tengir punktana — rétt punkt-til-línu fjarlægð (staðbundin lon/lat-metra-nálgun, sama aðferð og §2's leiðrétting, YFIRLÝST takmörkun: aðeins gild á stuttu bili, ekki geodetísk umvörpun) er 22,7m og 81,3m. Niðurstaðan breytist ekki (báðar innan 3km marksins).

**N7-leiðrétting:** fyrri útgáfa gaf líka upp "hlutfall kaflans innan 3km" (33%/49%) með aðferð sem var MERKT "hnit-fyrir-hnit" en var í raun gróf miðpunkts-sýnataka. Þessar prósentur eru FJARLÆGÐAR, EKKI endurteknar með fyrirvara — einfaldari, heiðarlegri framsetning: NÆSTA-LÍNU fjarlægð EIN SÉR, restin af hvorum kafla (og allir 11 aðrir kaflar) ÁFRAM `UNKNOWN` fyrir athugana-getu, ekki vegna vöntunar gagna heldur vegna þess að frosna planið úthlutaði aðeins 2 upphafsstöðvum.

24 klst saga sótt fyrir báðar stöðvar, 2 UTC-dagar hvor. Úrkomu-/snjóreitir `null` á sýnatökutímum — `UNKNOWN`, ekki ályktað þurrt.

---

## 5. Spá: punkta-kortlagning nú REIKNUÐ úr geometríu, ekki handskrifuð (R4/N2)

**N2-leiðrétting: v2's kortlagning var EKKI reiknuð — hún var handskrifaður listi (`zip` af bókstöfum) sem LEIT ÚT fyrir að vera leidd af gögnum.** Þessi lota endurgerir kortlagninguna RAUNVERULEGA: þráir beiðnarslóðina sjálfa fyrir umbeðin hnit, reiknar punkt-til-línu fjarlægð (sama staðbundna aðferð og §4) frá hverjum punkti til HVERS kafla, og tilkynnir BINDINGAR (tvo eða fleiri kafla jafn-nálægt) í stað þess að þegja um þær (`harness/04`):

| Punktur | Nánasti kafli | Bundið við | Kaflasvæði | Grid-fjarlægð | Hæð (grid) |
|---|---|---|---|---|---|
| P1 | `1410010037` | `903010037` (sama kaflasvæði, ekki vandamál) | **1** | 605m | 93m |
| P2 | `252090037` | (ekkert) | **1** | 660m | 347m |
| P3 | `902030037` | (ekkert) | **2** | 777m | 34m |
| P4 | `902040037` | `901130037` (sama kaflasvæði, ekki vandamál) | **3** | 919m | 43m |
| P5 | `901230037` | **`901220037` — ÞVERT Á KAFLASVÆÐI 4/5** | **4 OG 5 (mörk)** | 772m | 32m |
| P6 | `801100037` | (ekkert) | **6** | 2.138m | 4m |

**N2-leiðrétting á fullyrðingunni "kafli 4 hefur ENGAN punkt":** Þetta er ÓNÁKVÆMT. P5 liggur NÁKVÆMLEGA á sameiginlegum ISN93-endapunkti `901230037` (kaflasvæði 4) og `901220037` (kaflasvæði 5) — ekta, reiknuð binding, ekki ágiskun. Rétt framsetning: kaflasvæði 4 hefur ENGAN INNRI punkt — einn MARKAPUNKT, deildur með kaflasvæði 5, ekki tvítekinn sem innri þekja fyrir hvort svæðið. Spá fyrir INNRI hluta kaflasvæðis 4 er ÁFRAM `UNAVAILABLE`/ósýnt — markapunkturinn er EKKI látinn sanna þekju. ETA-tímar: 08:00→09:00→09:00→10:00→11:00→12:00, nánasta klukkustund, ágiskun per J8.

**C1-leiðrétting (v4) — `coverage.csv` samræmt við þessa málsgrein, var EKKI áður.** Þessi málsgrein sagði RÉTT frá upphafi (v3) að markapunkturinn sé DEILDUR með kaflasvæði 5 og sanni EKKI þekju fyrir hvort svæðið — EN `coverage.csv` sjálft hélt áfram að merkja kaflasvæði 5's `forecast_cap` sem `PASS`, í mótsögn við þessa eigin skýrslu og `harness/04`'s eigin niðurstöðu. Leiðrétt: BÆÐI kaflasvæði 4 OG 5 eru nú `UNAVAILABLE` fyrir spá-hæfni, samhverft. `harness/05` kallar nú SÖMU deilda fallið og `harness/04` (ekki aðskilin, hugsanlega-ósamræm útreikning) og MISLYKKAST HÁVÆRT ef `coverage.csv` ósammála — þannig að þessi tiltekna villa getur ekki endurtekið sig án þess að skriftan sjálf vari við því.

**S1 — vindhraða-einingar útskýrðar, ekki óútskýrð ráðgáta:** Þessi lota's beiðnarslóð (varðveitt í heild) hefur **ENGA** `wind_speed_unit`-breytu — það útskýrir `km/h`-merkinguna beint. #429's slóð er EKKI varðveitt í heild (styttist með "..."), svo `m/s`-merking þess er EKKI endurgeranleg héðan. Þetta ER EKKI "óútskýrt ósamræmi" eins og fyrri útgáfa sagði — #483's eigin merking ER útskýrð; #429's er einfaldlega ekki endurgeranleg. Reglan stendur: lesa `hourly_units` úr HVERJU svari, aldrei gefa sér fasta einingu af reitanafni.

---

## 6. Aðgangur/endurnotkun/flutningur: leyfi fannst, en þakið lyftist ekki (R1/S2/S4)

Opinber "Skilmálar vefþjónustur" síða fannst: **"Öll gögn Vegagerðarinnar sem gerð eru aðgengileg eru gefin út samkvæmt ... CC BY 4.0 ... nr. 45/2018."** Tilvísunarskilyrði: leyfisgjafi, gagnasett-heiti, öflunardagsetning (NOTA sóknartíma hvers straums, EKKI prentdagsetningu PDF-skjals), tilvísun CC BY 4.0.

**S2 — gildissvið er ÁLYKTUN, ekki orðrétt:** "Öll gögn" er almennt orðalag — að það gildi sérstaklega um legacy-/WFS-/DATEX-þjónusturnar HVER FYRIR SIG er ÁLYKTUN (INFERRED), ekki orðrétt tilgreint. Síðan hefur AUK ÞESS fyrirvara: engin trygging um framboð, aðgangur getur verið takmarkaður/lokaður án fyrirvara, raungögn eru EKKI gæðatryggð, "Takmarkanir og undantekningar" kafli. Hvorki CC né neinn gefur lögfræðilegt mat.

**N4-leiðrétting — flutningsstaða PER ÞJÓNUSTU, lesin af raunverulegum varðveittum slóðum (ekki ágiskun):**

| Þjónusta | Staðfest flutningur |
|---|---|
| `faerd2017_1` (kafla-ástand) | HTTP-sýni OG sérstakt, SIGLT HTTPS-próf — BÁÐIR staðfestir |
| `faerdpunktar2017_1` (punkta-atvik) | AÐEINS `http://` sótt — HTTPS ALDREI reynt þessa lotu (leiðrétt frá v2's loðnu "ekki prófað" sem gaf í skyn óvissu; raunin er einfaldlega aldrei reynt) |
| WFS (`faerdferlar2017_1`) | SÓTT yfir `https://` (bæði landsvísu- og keðju-fyrirspurnir) — RAUNVERULEG HTTPS-fyrirspurn, EKKI aðeins sérstakt vottorðspróf eins og `faerd2017_1` fékk, en samt staðfest sótt yfir dulkóðun (leiðrétt frá v2's ranga fullyrðingu að WFS væri "ekki HTTPS-prófað") |
| DATEX, Open-Meteo, Veðurstofa | Allar sóttar yfir `https://` |
| `vedur2014_1` | EKKI sótt í þessari rannsókn yfirhöfuð (aðeins eigandaskjal) |

Punktafóðrið er KRAFIN heimild fyrir lokunar-getu (hæfni 2) og HTTPS-staða þess er ÓLEYST — þetta er nefnt forsendugat, ekki falið. Sama breiðvottorð (`*.vegagerdin.is`) er ekki sönnun að hver þjónusta sé sjálfstætt vottorðsprófuð. Vottorðsupplýsingar (`openssl`-útkoma, trausts-store) EKKI varðveittar sem skrá.

**S4 — leiðarbók-göt, nú í þessari skýrslu (ekki aðeins í `samples/manifest.md`):** 5 greiningarfyrirspurnir (raðir 2–6 í leiðarbókinni) voru EKKI vistaðar sem eigin skrár; ein mistókst DATEX-tilraun var skrifuð yfir af sinni eigin endurtekningu áður en hún var vistuð sérstaklega; bætatöluheildin (~2,62MB) er ÁÆTLUÐ, ekki nákvæm fyrir þessar óvistuðu fyrirspurnir. Þetta er skráð hér sem heiðarleg takmörkun, ekki sem fullkomið, nákvæmt bókhald.

Owner-source A7: fjögur eigandaskjöl hafa ENGIN leyfi — leiðin að leyfinu lá í gegnum `nature-roads`-skjalsins eigin tilvísun til sömu gagnaveitu-síðu CC þegar hafði varðveitt, ekki ný fyrirspurn.

---

## 7. Issue acceptance-gátlisti (óbreytt kortlagning, leiðrétt svör)

| # | Atriði | Svar |
|---|---|---|
| 1 | Endurkeyranleg tafla | **JÁ** — `route-segments.csv`, `coverage.csv` (leiðrétt) |
| 2 | Þekja aðgreind frá stöð-tilvist | **JÁ** — §4 sýnir næsta-línu fjarlægð með réttri aðferð (N1); hlutfalls-fullyrðing fjarlægð (N7), kaflasvæði 0 bætt við sem sérstaklega óleyst (N6) |
| 3 | Tímagögn/lokunargildi sannreynd | **JÁ, styrkt** — §2 (rétt tengingarregla leiðrétt v3, óskjalfest Astand, útflutnings-töf mæld, sýnileikis-/útrunnin-regla lögð fram), aldur per kafla (`coverage.csv`/`route-segments.csv`) |
| 4 | Skilmálar/HTTPS staðfest EÐA merkt óleyst | **AÐ HLUTA** — leyfi fundið en gildissvið ályktað; HTTPS aðeins fyrir einn straum (§6) |
| 5 | Staðfest/ályktað/UNKNOWN aðgreind | **JÁ** |
| 6 | Ein PASS/PARTIAL/FAIL + GO/PARTIAL/NO-GO | **JÁ — PARTIAL/PARTIAL**, leiðrétt frá rangri PASS/GO |
| 7 | Næsti-miða tillaga aðeins ef gögn styðja | **JÁ** — `next-task-proposal.md`, leiðrétt forsendur |
| 8 | Jonesy/Ripley skráð | Framkvæmt í vinnuflæðinu |

---

## 8. Takmörkunarsamantekt

**ENGIN ný fyrirspurn í þessari EÐA fyrri leiðréttingarlotu** (v2, v3 OG v4 eru allar endurgreining varðveittra sýna/skjala — EKKERT ný gagnaskipti í v4 heldur, aðeins endursamsetning þegar-varðveittra niðurstaðna úr `harness/04` inn í `coverage.csv`/`harness/05`). Upprunalega gagnanotkun óbreytt: 20/24 gögn (~2,62MB/20MiB, áætlað — sjá §6 leiðarbók-göt), 8/12 skjöl (~403KB/8MiB).

**N5 — samræmi talna, nú tryggt:** `source-register.md`, `harness/03`, og þessi skýrsla sýna nú ALLAR 9 aðgreind `Astand`-gildi (ekki 13 eins og v2's `source-register.md` S2 sagði) og BÁÐAR VEGAVINNA-atvik tengd keðjunni (ekki "eitt tengt, eitt óleyst" eins og v2's mismunandi skjöl sögðu ósamræmt).

**C1 — samræmi `coverage.csv` ↔ `harness/04`, nú tryggt með deildu falli (v4):** v3 skildi eftir eitt ósamræmi af þessari sömu "tölur-passa-ekki" tegund: `harness/04` fann réttilega að kaflasvæði 5 er AÐEINS markapunktur (sama og kaflasvæði 4), en `coverage.csv` hélt áfram að segja `forecast_cap=PASS` fyrir kaflasvæði 5. Leiðrétt með því að færa útreikninginn í EITT deilt fall (`_shared.derive_forecast_mapping()`) sem BÆÐI `harness/04` OG `harness/05` kalla — `harness/05` ber nú `coverage.csv` saman við þá sömu niðurstöðu og MISLYKKAST HÁVÆRT við ósamræmi, svo þessi tiltekna villuflokkur getur ekki endurtekið sig án viðvörunar.

**Óuppgert (nefnt satt, ekki falið):** varasjóðsstöðvar (Selfoss, Vík); kaflasvæði 0 (Reykjavík-álman) — tenging staðfest, EN hvort `914020037` eða `903020037` er "réttur" næsti-akkeris-endapunktur er UNKNOWN, lengd ekki reiknuð; HTTPS fyrir punktafóðrið og `vedur2014_1` aldrei reynt; ensk skilmálasíða; `roadconditions_lineincident`; `DescribeFeatureType` fyrir WFS; hráar XML-bytes; vesturátta-kaflarnir (`902020037`/`902010037`); 5 óvistaðar greiningarfyrirspurnir og eitt yfirskrifað DATEX-svar í leiðarbókinni.

**S5:** "frosið 18:45:36Z" er as-of-tími; skráin sjálf skrifuð 18:47:47Z — bæði á undan fyrstu fyrirspurn (18:48:02Z). Ekki ruglað saman sem "mælt frystitímamark".

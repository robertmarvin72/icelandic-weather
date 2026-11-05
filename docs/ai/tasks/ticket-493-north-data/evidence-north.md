# #493-north-data — evidence-north.md

CC, 2026-11-05. Framkvæmt eftir `approved-prompt-v1.md` (C1–C3/N1–N3 felld inn). Data-only rannsóknarlota: Borgarnes→Akureyri Hringvegskeðja, báðar akstursáttir, tengd við #491's eigin Borgarnes-aðkomu. Engin appvinna, engin eigandaákvörðun tekin, enginn ETA/±2/Open-Meteo-kall. Sjá `pre-sample-plan.md` fyrir C3-sönnunarregluna (skrifuð fyrst), C2-offline-inventory-niðurstöður og C1-budget-áætlun; sjá `samples/manifest.md`/`exchange-ledger.jsonl` fyrir nákvæma netnotkun.

**2026-11-05 — v3 leiðrétting (`approved-prompt-v3.md`, Jonesy L1–L4/Y1–Y4):** Jonesy's result review (umferð 2) fann að v2 (a) skráði ekki `exact_xy_equal`/óafrúnnaða fjarlægð sem sérstaka reiti og sagði rangt "45 af 46" í `direction_grade` (leiðrétt: 44 af 46), (b) reiknaði sýnisaldur rangt ("7d 1h" í stað réttra 8d 0h 6m 23s, "3-7 daga" í stað "3-8 daga") og hafði ekki varðveitt þann útreikning sem endurkeyranlegt forrit, (c) giskaði á "sömu mínútu og exchange 2" fyrir exchange 1's óstaðfesta tíma í ledger/manifest/report, og (d) tilgreindi ekki hvernig JSON-hashið var reiknað (CRLF vs LF). Allt leiðrétt (Y1–Y4): sjá `samples/inventory_chain.py`/`build_candidate.py` (endurskrifuð, ný `exact_xy_equal`-reit, canonical UTF-8/LF-skrif), nýja dagsetta ledger-línu #4, og `cc-report-north-data.md`'s "## v3 — leiðrétting"-kafla. `BLOCKED_PENDING_OWNER_SCOPE_DECISION`/eigandaákvarðanir/316,7123km-lengdin/sönnunargráða stefnu ÓBREYTT — þetta er orðalags-/bókhaldsleiðrétting, ekki ný niðurstaða.

**2026-11-05 — v2 leiðrétting (`approved-prompt-v2.md`, Jonesy K1–K3/W1–W5):** Jonesy's result review (umferð 1) og correction-prompt-review (umferð 2) fundu að v1 (a) blandaði saman "VERIFIED nákvæm hnútasnerting" og "VERIFIED akstursleið" fyrir öll 46 tengibil, (b) talaði hringtorgsins 30401 eigin lokaða lykkju (124,7m) INN í vegalengdina (ætti að vera sér evidence, útilokuð frá lengdinni), (c) sagði rangt "45 VEGHLUTI1 + 2 VEGHLUTI5" (réttur fjöldi: 46+1 — hringtorg 33604 var ALDREI í chain_order), (d) lýsti B-punktinum (33604) loðið sem "nærri miðju" án aðgreindrar chord-/along-line-mælingar, (e) sagði "Akureyri-aðkoma" um N5/A sem er í raun bara mörk við útilokaða IDBUTUR 909000037, (f) hafði ónákvæmt C1-bókhald (exchange 1's "0 bæti" var retained-bæti, ekki móttekin-bæti; óvarðveitt skipun), og (g) ofsagði "öll önnur 15 IDBUTUR notuð í heild" þegar sum þeirra deila lyklum með hliðarvegum. Allt leiðrétt hér neðar (W1–W5); sjá `samples/build_candidate.py`, nýtt `samples/inventory_chain.py`, og `cc-report-north-data.md`'s v2-kafla fyrir sjálfstæða endurkeyrslu sem staðfestir hvert leiðrétt gildi. `BLOCKED_PENDING_OWNER_SCOPE_DECISION`/eigandaákvarðanir ÓBREYTT; niðurstöðumerkið `EVIDENCE_READY_FOR_OWNER_REVIEW` stendur fyrir LEIÐRÉTTA afhendingu, ekki framkvæmdarheimild.

---

## 0. Niðurstöðumerki

**`EVIDENCE_READY_FOR_OWNER_REVIEW`**

Candidate-keðja (47 tier0-stykki, 16 IDBUTUR) frá #491's eigin Borgarnes-útgangi (IDFERILL 2819) til Akureyrar-svæðis er byggð, rekjanleg, og sjálfstætt endurreiknanleg (nú tvisvar: upprunalega og aftur með sjálfstæðu, frá-grunni `inventory_chain.py`, sem fann SÖMU 47-stykkja röð óháð). **K1-leiðrétting:** af 46 tengibilum eru 44 nákvæmlega 0,00 m — þetta er VERIFIED að kortlagðar línur SNERTAST í sama hnút, EKKI VERIFIED akstursheimild. Hin 2 (1,77 m og 42,84 m, bæði við Borgarnes-hringtorgið) eru brúuð samkvæmt forskráðri hringtorgsreglu með nefndri heimild — EKKI "VERIFIED akstursleið" heldur. Ekkert VEGHLUTI 6/7-par fannst neins staðar á leiðinni, svo bæði áttir deila sömu, einu kortlögðu línu (INFERRED-tvíátta-venjulegur-vegur, ekki sjálfstætt vottuð per átt — sjá §3). Akureyrar-endinn er EKKI samþykktur — tveir candidate-punktar eru settir fram með afleiðingum, auk ónefndra valkosta. Þetta þýðir EKKI að báðar áttir eða hnit/leyfi séu sjálfkrafa samþykkt fyrir app — sjá §7 fyrir nákvæmar næstu ákvarðanir sem eigandi þarf að taka.

---

## 1. Endapunktar

**Upphaf (fast, VERIFIED, frá #491):** IDFERILL 2819 (IDBUTUR 904040037, kaflanr "g7"), native ISN93 enda-hnit [361119.191, 454127.5752] — nákvæmlega `route-data-candidate.json`'s (#491) eigin `end_borgarnes.entry_point_native_3057`. Engin ný ákvörðun hér; þessi punktur er endurnotaður óbreyttur sem keðju-samfellupunktur, ekki endurmældur.

**Endi (Akureyri) — EKKI samþykktur. W2-leiðrétting: "A" er EKKI "Akureyri-aðkoma" — það er bókstaflega aðeins mörkin við útilokaða IDBUTUR, ekki nafngreindur/kennileitamerktur punktur:**

| Candidate | Lýsing (leiðrétt) | IDFERILL | WGS84 | Staða |
|---|---|---|---|---|
| **A** | Síðasta tier0-línuendi á VEGNR=1, í 0,00m nákvæmri snertingu við útilokaða stykkið 32961 (IDBUTUR 909000037, Vaðlaheiðargöng). Keðjan fer um Akureyrar-bæjargötur (909360037 "Tvöfaldi kaflinn", 909350037) ÁÐUR en hún nær þessum mörkum. Þetta er candidate scope-boundary — EKKI sjálfgefið réttur vöruendi. | 32964 (IDBUTUR 909350037) | lon −18.053713, lat 65.693714 | Feature-tilvist VERIFIED; sem vöru-endapunktur ÓVALIÐ |
| **B** | Hringtorg (VEGHLUTI=5) sem er NÆRRI, EKKI Á ENDA, stykkis 32964 — **W1/K2-leiðrétting:** reference-hnútur B liggur **38,4% inni í** 687,839m-langri línu 32964 (ekki "við miðju" eins og fyrri útgáfa sagði loðið). Mælt frá frumhnútum: point-to-line fjarlægð 0,0m (B liggur Á línunni); meðfram línunni 264,381m frá upphafi / 423,458m frá enda (A); bein lína (chord) 264,381m til upphafs / **398,103m til A** (EKKI ~440m eins og fyrri útgáfa sagði). | 33604 (IDBUTUR 909350037) | lon −18.052665, lat 65.690170 | Feature-tilvist VERIFIED (raunverulegt kortlagt hringtorg); leiðar-TENGING er INFERRED, EKKI keðjuendi — engin lengdar-fullyrðing til B er gerð umfram þessar mældu fjarlægðir |
| **Órannsakaður valkostur** | Mót 909030037/909360037 (stykki 2940→3876) — nefnt af Jonesy í result-review, EKKI skoðað sem endapunktur í þessari lotu | — | — | Nefnt til að fela ekki valkost, ekki metið |

Hvorki A né B er valinn "réttur" endapunktur fyrir vöruna — það er framsetningarval sem eigandi tekur, EKKI rannsóknarspurning. Engin almenn heimilisfangaleit eða bæjarmiðju-hnit var notað (fylgir item 2's banni). Engin ný gögn voru sótt austan við þessi mörk (N3/W2).

**Akureyrar-nálgunarátt:** keðjan kemur inn í Akureyrar-bæjarsvæðið úr suðri/suðvestri (gegnum 909010037/909020037/909030037's Öxnadalsheiði-Moldhaugaháls-leið), EKKI úr austri (Vaðlaheiðargöng er sjálf útilokuð, N3). Þetta er sama átt og raunveruleg Hringvegslega krefst — engin eldri lega eða önnur tenging var valin af nafni einu saman.

---

## 2. Keðja og báðar áttir

**Aðferð (C2, sjá `pre-sample-plan.md` §3):** offline-fyrst — byrjað á varðveittu landsvísu `wfs-vegnr1-all.json` (996 eiginleikar, EPSG:3057, `VEGNR='1'`, tier -1/0/1/2, SHA256 endurstaðfest óbreytt). Síað að tier0 (`NAKVAEMNIFERLIS==0`, 249 stykki/74 IDBUTUR landsvísu). Nálægðar-ganga (nearest-unused-endpoint) frá piece 2819's eigin enda, EKKI fyrirfram-valinn IDBUTUR-listi úr nöfnum — þetta FANN sjálft IDBUTUR **770040037** ("Víðigerði - Blönduós (Efstabraut)", sama nafn og 907210037!), sem brúar 14,5km "gap" sem hefði annars virst vera ófundið bil milli 907160037 og 907210037. Þetta sýnir beint af hverju nafnalisti eitt og sér (N1's eigin varnaðarorð) hefði misst af réttri keðju.

**Niðurstaða: 47 tier0-stykki, 16 IDBUTUR, EKKERT samkeppnistilvik fundið** (næst-nálægasti valkostur í hverju skrefi var ævinlega hundruðum til þúsundum metra fjær en valinn hnútur — engin raunveruleg greinótt tvíræðni). **W4-staðfesting:** keðjan var ENDURFUNDIN frá grunni þessa umferð með nýju, sjálfstæðu `samples/inventory_chain.py` (óháð leit yfir landsvísu-safnið, ekki endurspilun á hardkóðaðri röð) — fann NÁKVÆMLEGA sömu 47-stykkja röð. Full tafla í `route-data-candidate.json`.

**Tengibil (46 samtals milli 47 stykkja) — K1-leiðrétting á sönnunargráðu:**
- **44 af 46: nákvæmlega 0,00 m** — VERIFIED að kortlagðar línur SNERTAST í sama native-hnút. Þetta er EKKI "VERIFIED akstursleið" — aðeins að tvær aðskildar mældar línur deila sama hniti.
- **1: 1,77 m** — Borgarnes-hringtorg (IDFERILL 30401), NÁKVÆMLEGA sama tala og #491's eigin áður-skráða `gap_entry_to_roundabout_m: 1.77`. Brúað samkvæmt forskráðri hringtorgsreglu (heimild: #491), EKKI "VERIFIED akstursleið".
- **1: 42,84 m** — innan sama IDBUTUR (904040037), hringtorgs-útgangur til stykkis 2816. Brúað samkvæmt sömu reglu, heimild: samfelld KAFLANR "g8" báðum megin. EKKI "VERIFIED akstursleið" — nálægð eitt og sér er aldrei nóg (C3's eigin regla), hér er stuðningurinn KAFLANR-samfellan, ekki bara fjarlægðin.

Fyrri útgáfa þessa skjals sagði "46 af 46 tengipunktar VERIFIED" án þessarar aðgreiningar — AFTURKALLAÐ hér (K1): rétt orðalag er "44 VERIFIED nákvæm snerting + 2 brúuð samkvæmt hringtorgsreglu", ekkert af þessu er "VERIFIED akstursheimild."

**VEGHLUTI-samsetning — leiðrétt talning (v1 sagði rangt "45+2"):** **46 af 47 stykkjum eru VEGHLUTI=1** (óskjalfest hlutverk, INFERRED "ódeild akbraut" per #483's eigin ályktun). **Nákvæmlega 1 er VEGHLUTI=5** — hringtorgið 30401, sem ER í keðjunni (`chain_order`). Hringtorgið 33604 ("B" í §1) var ALDREI í keðjunni — það er sérstakt, nálægt kennileiti, ekki annar innri VEGHLUTI=5-hlekkur. **ENGINN VEGHLUTI 6 eða 7 fannst neins staðar á þessari leið** — ólíkt Rauðavatn–Borgarnes-keðjunni (sem notaði VEGHLUTI=6-stefnutilgátu, H1), er ENGIN tvískipt akbraut til að velja milli hér. Það þýðir: bæði áttir (Borgarnes→Akureyri og Akureyri→Borgarnes) nota ÓHJÁKVÆMILEGA SÖMU, einu kortlögðu línuna — ekki tvær sjálfstætt sannreyndar keðjur.

**Sönnunargráða fyrir átt (pre-registered C3-regla, `pre-sample-plan.md` §2, EKKI breytt eftir á):**
- **VERIFIED:** öll 47 stykki eru tengd í keðju (sjálfstætt endurreiknanlegt, sjá §5).
- **INFERRED:** að VEGHLUTI=1 þýðir ein, venjulega tvíátta akbraut — #483's eigin ályktun, EKKI staðfest skilgreining. Bæði akstursáttir eru JAFN INFERRED hér (ekki ein átt "meira sönnuð" en hin), því það er bókstaflega sama línan.
- **UNKNOWN:** hvort einhver hluti leiðarins hefur óskjalfest einstefnutakmörkun (skilti/árstíðabundin lokun) — engin varðveitt heimild nefnir þetta hvort heldur er.
- **Lista-viðsnúningur sannar EKKERT hér um of** (eins og item 3 krefst) — en það er heldur EKKI þörf á sérstakri "viðsnúnings-sönnun" þegar engin tvískipt akbraut er til að rugla saman áttum á.

---

## 3. Lengdir og endurkeyranleiki

**W1-leiðrétting (stærsta efnislega villa v1-útgáfunnar):** fyrri útgáfa taldi hringtorgsins 30401 EIGIN lokuðu lykkjulengd (124,7m) INN Í vegalengdina, eins og það væri ekið-í-gegn stykki. VEGHLUTI=5-hringtorg er LOKAÐ, eigin upphafs- og endahnit þess eru EINS — það er EKKI keyrt sem "vegalengd", heldur sérstakt evidence-atriði. Leiðrétt hér: hringurinn er algerlega UTAN lengdarútreiknings, varðveittur sem sitt eigið gagnafelti (`ring_30401_evidence_only` í JSON).

**Tvær aðferðir, báðar reiknaðar, hvor um sig merkt — NORÐUR-HLUTI EINN, ÁN hrings OG án endurtalningar á 2819, MEÐ fyrirliggjandi bilunum (1,77m+42,84m) talið einu sinni:**

| Aðferð | Norður-hluti (án hrings, án 2819) |
|---|---|
| Planar ISN93 (Euclidean, native projected metrar) | **317,7261 km** |
| Haversine WGS84 (R=6.371.008,8 m, #491 v5 aðferð) | **316,7123 km** |

Munur (~1,01 km / ~0,32%) samræmist þegar-skjalfestum ISN93 Lambert-Conformal-Conic kvarðastuðli (#483/#491's eigin ≤0,03-0,4% fundur) — ekki ný óútskýrð skekkja. **Þessar tölur sanna EKKI raunverulega akstursvegalengd** — engin akstursstefnu-/akreina-/beygjugagnagrunnur er til fyrir þennan kafla, aðeins fjarlægð-eftir-kortlagðri-línu nálgun.

**Hringtorgið 30401's EIGIN lengd (sér evidence, ÚTILOKUÐ frá ofangreindum tölum):** 124,672 m planar / 124,277 m haversine.

**Fyrri rangar tölur (v1, afturkallaðar):** 317,8507/316,8366 km (með hring, án 2819) og 318,5701/317,5539 km (með hring OG 2819) — BÁÐAR rangar vegna hringtalningarins. "17,818 km" (úr §4's IDBUTUR-904040037-skörunarumfjöllun) er ALLS ÓSKYLT magn (full-IDBUTUR-partition-bókhald MEÐ hring talið) og var ALDREI þessa lotu eigin norður-vegalengd — sjá §4.

**Pörun á ID/tier/hnútafjölda (ekki svarröð), sjálfstætt endurreiknuð TVISVAR (upprunalega og aftur með `inventory_chain.py`):** öll 47 stykki hafa NÁKVÆMLEGA sama hnútafjölda í native ISN93 (`wfs-vegnr1-all.json`) og í nýja WGS84-svarinu (`wfs-north-4326.json`) — 0 ósamræmi. Sama sannprófunaraðferð #491 notaði fyrir sína eigin keðju.

**Piece 2819 — ekki tvítalið (item 2's krafa):** þetta stykki ER #491's eigin síðasta suður-stykki, útilokað frá öllum ofangreindum "norður-hluti"-tölum.

**B-punktsins (hringtorg 33604) mæling — ný, K2-krafa (sjá §1):** reiknuð úr frumhnútum, ekki hardkóðuð: point-to-line fjarlægð 0,0m, meðfram línu 264,381m (frá upphafi) / 423,458m (frá enda), bein lína (chord) 264,381m (til upphafs) / 398,103m (til enda/A). 38,4% af 687,839m-langri línu 32964's eigin lengd.

**Endurkeyranleg skipun (tvö scripts núna, W4):** `samples/build_candidate.py` — keyrð offline á varðveittum+nýfengnum skrám, framleiðir leiðrétt `route-data-candidate.json`. `samples/inventory_chain.py` — SJÁLFSTÆÐ, frá-grunni keðjuleit + node/z-prófíll, úttak varðveitt í `samples/inventory_chain-output.txt`. Hvorugt þarf nýja dependency (hrein Python stdlib).

---

## 4. Færð og tilkynningar

**W5-leiðrétting — grunnregla:** 16-IDBUTUR lyklasamsvörun úr gömlum sýnum sannar HVORKI núverandi færð NÚNA (2026-11-05) NÉ að engin óviðkomandi tilkynning sé til. Þetta er lykilpörun (IDBUTUR-stigs), EKKI samfelld, staðfest leiðarstaða.

**Skilgreindur UTC-viðmiðunartími þessarar lotu:** 2026-11-05T18:57:23Z (sama tímapunktur og exchange 2, §C1). ALLAR aldursútreikningar hér eru miðaðar við ÞENNAN tíma, ekki núverandi raunstund.

**Y2/L1-leiðrétting (v3):** aldur hér er núna reiknaður af endurkeyranlegu `samples/inventory_chain.py` (fall `section_feed_ages_y2_l1`) úr SKRÁARSTIGS `DagsKeyrtUt`-stimpli hverrar af 4 varðveittum skrám (staðfest fyrst að hver skrá hafi EINN einstakan slíkan stimpil yfir allar eigin raðir — assertion), EKKI lauslega áætlað. Eldri tölur ("7 dagar, ~1 klst"/"7d 1h") voru RANGAR — AFTURKALLAÐAR.

**Retained-fyrst (engin ný legacy-fyrirspurn þurfti):** tvö þegar-varðveitt landsvísu-sýni (#483, `faerd2017_1` DagsKeyrtUt 2026-10-28T18:51:00Z — **8 dagar, 0 klst, 6 mín, 23 sek gamalt miðað við viðmiðunartímann**; #485, DagsKeyrtUt 2026-11-02T13:21:00Z — **3 dagar, 5 klst, 36 mín, 23 sek gamalt**) hafa BÁÐI ÖLL 16 IDBUTUR þessarar lotu, hvert með EINNI skráningu. (Tilkynningasýnið `faerdpunktar2017_1` frá sama degi, 2026-10-28, hefur SINN EIGIN, lítið ólíkan stimpil — DagsKeyrtUt 18:56:00Z, 8d 0h 1m 23s gamalt — ekki sama og `faerd`-skráarins eigin 18:51:00Z.)

| IDBUTUR | 2026-10-28 AstandYfirbord (8d 0h 6m 23s gamalt) | 2026-11-02 AstandYfirbord (3d 5h 36m 23s gamalt) |
|---|---|---|
| 904040037, 904050037, 907150037, 907160037, 770040037, 907210037, 908010037, 908030037, 908040037, 909020037, 909030037, 909350037, 909360037 | GREIDFAERT | GREIDFAERT |
| 904060037 | HALKUBLETTIR | GREIDFAERT |
| 908020037 | HALKUBLETTIR | GREIDFAERT |
| 909010037 | HALKUBLETTIR | GREIDFAERT |

Nákvæmlega þessar þrjár IDBUTUR (904060037=Holtavörðuheiði-svæði, 908020037=Vatnsskarð-svæði, 909010037=Öxnadalsheiði-svæði) sýndu HALKUBLETTIR í eldra sýninu og GREIDFAERT í því nýrra — SÖMU þrjú IDBUTUR sem §5's óháða z-hæðar-greining sjálfstætt bendir á sem hæstu hluta leiðarins. **Þessar tvær skráningar eru BÁÐAR 3–8 daga GAMLAR SÖGULEGAR SÝNI (v3-leiðrétt bil, var rangt "3–7"), EKKI lifandi staða** — engin ný legacy-sókn var gerð þessa lotu til að fá yngra sýni (var ekki talið nauðsynlegt, sjá `pre-sample-plan.md` §4), svo "núverandi" (2026-11-05) ástand er einfaldlega ÓÞEKKT fyrir allar 16 IDBUTUR, ekki ályktað GREIDFAERT úr því nýrra sýninu.

**Tilkynningar (`faerdpunktar2017_1`) — lykilpörun EIN SÉR, ekki tæmandi:** eldra sýnið (#483, 43 skrár landsvísu) hefur EINA tilkynningu Á NÁKVÆMLEGA ÞESSUM 16 IDBUTUR: IDBUTUR 904040037, IdPunktur 72671, Astand "ANNAD", GildirTil 2026-10-31T16:00Z — ÚTRUNNIN miðað við viðmiðunartímann (2026-11-05T18:57Z, >5 dögum eftir GildirTil). Nýrra sýnið (#485, 26 skrár) hefur ENGA tilkynningu á lyklamátun við neitt af þessum 16 IDBUTUR.

**W5 — mismatched-key dæmi, fundið og skráð (ekki falið):** tilkynning **IdPunktur 73688** (Astand VEGAVINNA, "Road reconstruction... scheduled to be completed by the end of August 2027", DagsSkrad 2026-10-20, GildirTil **2027-10-20T16:00Z** — í gildi langt fram í tímann) er skráð undir **IDBUTUR 772210037** — EKKERT af okkar 16 lyklum. Lyklapörun EIN SÉR myndi því ALDREI finna þessa tilkynningu, sem gæti verið landfræðilega nærri keðjunni. Sjálfstætt reiknuð fjarlægð (hnit úr `Breidd`/`Lengd`-reitum punktsins, haversine að NÆSTA HNÚT (ekki línu) í WGS84-keðjunni, 47 stykki): **1.515,3 m frá nálægasta hnút** (stykki IDFERILL 2594, IDBUTUR 907210037). Þetta er **EFRI MÖRK á fjarlægð að línu** (næsti-hnútur-fjarlægð er ævinlega ≥ punkt-til-línu-fjarlægð), EKKI nákvæm point-to-line mæling, og SANNAR HVORKI að tilkynningin varði leiðina NÉ að hún sé óviðkomandi — aðeins að lyklamátun eitt og sér hefði misst af henni.

**Hliðarvegastykki sem deila route-IDBUTUR-lyklum (fundið í nýfengnu WGS84-svari, ekki áður skráð):** fjögur tier0-stykki á ÖÐRUM vegnúmerum deila einum af okkar 16 IDBUTUR-lyklum:

| IDFERILL | IDBUTUR (deilt) | VEGNR (ekki Hringvegur) | Kaflanr | Tier0-lengd (m) |
|---|---|---|---|---|
| 3372 | 904050037 | 5240 | 01 | 190,4 |
| 3587 | 907150037 | 7020 | 01 | 1.016,2 |
| 3824 | 907150037 | 704 | 04 | 1.720,8 |
| 3865 | 907210037 | 731 | 01 | 199,3 |

Samtals ~3,127 km — EKKI hluti Hringvegskeðjunnar, EKKI bætt við hana. Þetta leiðréttir v1's of-sterku fullyrðingu "öll önnur 15 IDBUTUR notuð í heild": IDBUTUR er ÁSTANDS-/stjórnsýslulykill sem getur náð yfir FLEIRI en eina nafngreinda leið — "full notkun" átti aðeins við VEGNR=1-hlutann, ekki allt sem deilir lyklinum.

**Kaflastigs-takmörkun fyrir 904040037 (full-IDBUTUR-partition-bókhald, AÐGREINT frá §3's vegalengd):** IDBUTUR 904040037's EIGIN fulla tier0-umfang er 19,694 km — #491 notar 1,876 km af því (stykki 2876+2819), ÞESSI lota notar 17,818 km (stykki 2816+2800+hringtorg 30401, **MEÐ hringsins eigin 124,7m lykkju talið hér** — þetta er lyklabókhald, EKKI vegalengd, og 17,818km-talan MÁ EKKI lesast sem §3's norður-vegalengd). Samtals 19,694 km = allt umfangið fyrir ÞENNAN eina IDBUTUR-lykil, engin skörun. Þetta segir EKKERT um hin 15 IDBUTUR, sem hafa sinn eigin, aðskildan status (sjá hliðarvega-töfluna að ofan fyrir þau þrjú sem hafa auka-umfang).

---

## 5. Tillaga að veðurpunktum

**W4-leiðrétting (N1):** fimm candidate-punktar, EKKI fyrirfram ákveðinn fjöldi:

| ID | Lýsing (leiðrétt) | Hæð (m, native z) | WGS84 | Staða |
|---|---|---|---|---|
| N1 | **Endi stykkis 2800** (IDBUTUR 904040037) — bókstaflega bara línuendi, EKKI afleiddur dal-lágpunktur | — (z=38,8m við þennan hnút) | lon −21.666962, lat 64.674402 | "Baula/Norðurárdalur" er TILLÖGUHEITI, staðarstaðfesting UNKNOWN — EKKI sönnuð af IDBUTUR-nafninu "Borgarnes" eða neinu öðru í gögnunum |
| N2 | Hæsti SKRÁÐI z-hnútur á stykki 3408 (IDBUTUR 904060037) | 395,2098 | lon −21.056584, lat 64.989565 | Vertex-stigs staðbundið hámark, EKKI DEM/terrain-greining. "Holtavörðuheiði" er sennilegt svæðisheiti (fundið óháð, ekki nafngreint af gögnunum), EKKI staðfest |
| N3 | Hæsti skráði z-hnútur á stykki 3237 (IDBUTUR 908020037) | 422,9379 | lon −19.694664, lat 65.509129 | Sama fyrirvari; "Vatnsskarð" sennilegt, ekki staðfest |
| N4 | Hæsti skráði z-hnútur á stykki 3258 (IDBUTUR 909010037) — **hæsta SKRÁÐA gildi meðal allra 1.107 hnúta** | 544,4727 | lon −18.695611, lat 65.468002 | Sama fyrirvari; "Öxnadalsheiði" sennilegt, ekki staðfest. **Þetta er EKKI sama og "hæsti punktur allrar leiðarinnar"** — 141 af 1.107 hnútum (38,4 km af stykkjalengd) hafa EKKERT skráð z-gildi (sjá z-prófíl neðar), svo hærri punktar GETA verið til án skráningar |
| N5 | Síðasta tier0-línuendi fyrir útilokaða IDBUTUR 909000037 | — | lon −18.053713, lat 65.693714 | Sama og Akureyri-candidate A (§1) — EKKI "Akureyri-aðkoma" |

**Z-prófíll (nýtt, W4) — endurkeyranlegt úr `samples/inventory_chain.py`:** 47 stykki bera samtals **1.107 hnúta**, þar af **141 með z=0** (ekkert skráð hæðargildi — EKKI sönnun um sjávarmál, sama viðurkennda regla og #483 setti). Af þeim 141 eru stykki sem eru HEILT OG ALGERLEGA z=0: samtals **38,395 km** af stykkjalengd (án viðmiðunarstykkis 2819), þar af **25,37 km milli Blönduóss og Svínvetningabrautar** (stykki 2456/2478, IDBUTUR 908010037) og **8,075 km innan Akureyrar sjálfrar** (stykki 909360037/909350037-hópurinn) og 4,95km (stykki 2940, IDBUTUR 909030037). Topp-5 skráð hámörk: 544,47m (3258)/477,04m (3233)/422,94m (3237)/420,16m (3238)/395,21m (3408) — öll í 909010037/908020037/904060037, sömu þremur svæðum sem §4's HALKUBLETTIR-sögulega-fundur bendir óháð á.

**Sjálfstæð z-hæðar-greiningaraðferð (ekki frá #429):** staðbundin hámörk voru fundin ÁN þess að vísa í fjallvega-nöfn fyrirfram — nafngiftin er eftir-á-staðfesting, ekki forsenda. Lauslegur samanburður (EKKI heimild) við #429's eigin (skökku) CSV-línur fyrir "Holtavörðuheiði"/"Vatnsskarð" sýnir <0,002° munur — samræmi, ekki eitthvað sem þessi úttekt treysti á.

**Sameign auðkenna:** Rauðavatn–Borgarnes-leiðarins eigin P4 ("Borgarnes-aðkoma", `routes.js`'s `BORGARNES_FORECAST_POINTS`) ER sama hnit og þessarar leiðar eigin upphafspunktur (IDFERILL 2819) — ÞESSI punktur ætti að DEILAST, ekki endurnefnast sem nýtt "N0", ef einhver seinni útfærsla sameinar leiðirnar. Engin önnur sameign fannst (N2-N5 eru öll ný, fjarri núverandi tveggja leiða punktum).

**Hvað er ÓÞAKIÐ/óstaðfest:** bilið milli N1 og N2 (Norðurárdalur-Holtavörðuheiði-klifrið sjálft, ~25km) hefur engan eigin punkt; sama fyrir N3-N4 (Varmahlíð-Skagafjörður-Öxnadalur, ~60km) og N4-N5 (Öxnadalsheiði niður í Akureyri, ~25km). Þetta er EKKI samfelld þekja — hver punktur er ein grindarspá, ekki vegamæling (sama disclaimer og núverandi tveimur leiðum). Enginn þröskulds-/fjölda-regla var fundin upp sem eigandasamþykkt — þetta er hrein tillaga.

---

## 6. Gagnaskrá (VERIFIED/INFERRED/UNKNOWN)

| # | Atriði | Staða | Heimild |
|---|---|---|---|
| N-G1 | 47-stykkja keðja Borgarnes→Akureyri-svæði | **VERIFIED** keðja-tilvist/samfella, 0 samkeppni, endurfundin TVISVAR sjálfstætt — en 44/46 tengibil eru nákvæm snerting, 2/46 brúuð samkvæmt hringtorgsreglu; ENGIN af þessu er "VERIFIED akstursleið" (K1) | `wfs-vegnr1-all.json` (offline) + `wfs-north-4326.json` (§C1) + `inventory_chain.py` (ný) |
| N-G2 | Átt (bæði) | **INFERRED** (ein lína, ekkert 6/7-par) | §2 |
| N-G3 | Akureyri-endapunktur | **Candidate-ar (A=mörk, B=INFERRED-tengt hringtorg, + órannsakaður valkostur), EKKI samþykktur** | §1 |
| N-G4 | Lengd norður-hluta (haversine, án hrings/2819) | **VERIFIED** (**316,7123 km**, leiðrétt — ekki 316,8366 km, sjá §3) | §3 |
| N-G5 | Núverandi færð | **DAGSETT SÖGULEGT SÝNI (3-8 daga gamalt miðað við þessa lotu's eigin viðmiðunartíma, leiðrétt í v3 — var rangt "3-7"), EKKI lifandi, EKKI "VERIFIED núverandi"** | §4 |
| N-G6 | Virk tilkynning (lyklapörun) | **Engin fundin Á lyklamátun — en lyklapörun er EKKI tæmandi (sjá mismatched-key dæmi 73688)** | §4 |
| N-G7 | Óskjalfest einstefnutakmörkun | **UNKNOWN** (engin heimild hvort heldur er) | §2 |
| N-G8 | Veðurpunktatillaga | **TILLAGA, ekki samþykkt** | §5 |
| N-G9 | Punkta-millibil (N1-N2, N3-N4, N4-N5) | **ÓÞAKIÐ** | §5 |
| N-G10 | Hliðarvegastykki undir deildum IDBUTUR-lyklum (904050037/907150037/907210037) | **VERIFIED tilvist, EKKI hluti Hringvegskeðju** (~3,127 km) | §4 |

---

## 7. Næstu afmörkuðu ákvarðanir (fyrir eigandann, ekki tekin hér)

1. **Hvor Akureyri-endapunktur-candidate (A=mörk við útilokaða IDBUTUR, B=INFERRED-tengt hringtorg 33604, §1)** — eða órannsakaði valkosturinn (mót 909030037/909360037, stykki 2940→3876) — verður notaður, EÐA hvort frekari rannsókn á sjálfri Akureyrar-bæjarumferðinni (t.d. hvort "Höepfnerbryggja" sjálf er æskilegri) er æskileg fyrst.
2. **Hversu margir af N1-N5 veðurpunktunum (§5)** eru í v1-umfangi þessarar nýju leiðar, og hvort millibilin (N-G9) þurfa viðbótarpunkta.
3. **Hvort þessi norðurleið verður sameinuð við Rauðavatn–Borgarnes** (sömu-IDFERILL-2819-samfellu, §1/§3) í eina lengri "Rauðavatn–Akureyri"-leið, EÐA höfð sjálfstæð — hvort tveggja er tæknilega mögulegt af þessari úttekt, EKKI ákveðið hér.
4. **Hvenær (eða hvort) 770040037's eigin nafnaárekstur við 907210037** (sama `STADARLYSING`-strengur, §2) þarf frekari skýringu frá Vegagerðinni sjálfri, eða hvort núverandi geometry-staðfesting er nægjanleg fyrir vöruna (hún ER nægjanleg til að byggja keðjuna, EKKI endilega til að útskýra HVERS VEGNA tvær IDBUTUR deila nafni).
5. **Hvort og hvenær** samþykkta tímalíkansbreytingin (owner-decisions-2026-11-05.md, lið 1 — sameiginlegur spátími, fjarlæging ETA/±2 af núverandi tveimur leiðum) og þessi nýja gagnalota sameinast í eitt innleiðingarprompt, eða fara hvor sína leið.

Engin af þessum fimm er ákveðin í þessari lotu. `BLOCKED_PENDING_OWNER_SCOPE_DECISION`-niðurstaðan úr #493's eigin A-úttekt er ÓBREYTT — þessi gagnalota stækkar studda keðjuna, EKKI umfangsákvörðunina sjálfa.

# #501 — Öflunaráætlun, prompt review

## Round 1 — Ripley — 2026-11-17

Eigandi samþykkti að útbúa litla öflunaráætlun með nákvæmum götum og kallahámarki til yfirferðar áður en sótt yrði. `acquisition-plan.md` er afhent áætlun, **ekki netöflunarheimild**. Fyrri read-only úttekt er CLOSED/PASS; saga hennar varðveitt, #501 enn óinnleitt.

Jonesy yfirfer beint þessa áætlun gegn gildandi audit-report.md/result-review.md, phase2 evidence.md síðari v3-leiðréttingum og retained metadata. Ekki láta gamla v2 eða gamalt #500 “engin veg93-keðja” orðalag ráða. Athuga source-ID fyrir bil, skip-if-retained, separation geometry/topology/driving authority, hvort budget er nægilega nákvæmt og hvort markmið svarar næsta innleiðingarskrefi. Engin netköll eða application edits í yfirferð.

Skrá APPROVED eða REVISE með minnsta sýnda nauðsynlega fix. Valfrjáls heildarþekja/framleiðsluherðing ekki blocker á áætluninni. Ef APPROVED: Ripley skráir niðurstöðu og leggur **nákvæm execution-köll** fyrir eiganda; ekki færa beint READY_FOR_CC fyrir netöflun með ófylltum slóðum. Samþykki á áætlun er ekki leyfi fyrir óafmörkuðu metadata-discovery. Ekki setja af stað CC-lotu til að endurskrifa áætlun sem þegar svarar spurningunni.

Leyfð skrif reviewers: append hér og nauðsynleg CURRENT-færsla. Engin ný rannsókn, ný gögn, kóði/próf/build, GitHub/commit/push/deploy. Við lok þessarar yfirferðar er markmiðið samþykkt afmörkun fyrir eigandaákvörðun um fyrsta raunverulega kallið, ekki fullgerð leiðasamsetning.

## Jonesy review — umferð 1 (2026-11-17)

**Niðurstaða: APPROVED (sem áætlun/afmörkun — ekki netheimild).** Engin REVISE-krafa; þrjár þrengingar N1–N3 koma í execution-prompt Ripley, ekki í áætlunina sjálfa (hún hefur skip-if-retained regluna nú þegar). Engin net-/GitHub-köll, engin keyrsla á vél eiganda; allt hér að neðan er **sandbox-staðfest (mitt)** úr stöguðum retained skrám, nema annað sé tekið fram.

### Staðfest (sandbox)
- **Bilatafla A–F stemmir við chain-walks-v4.json (cw_long / selfoss_closure_target):** 1735→2071 0,234 m (IDBUTUR 903010037→253020037, mismunandi nöfn ⇒ raunverulegt samskeyti); 2117→2135 34,749 m (252090037→902030037); 2138→3737 30,097 m (handan Selfoss, rétt flokkað); 3768→3767 42,302 m (step 9; bæði IDBUTUR 902040037); 3591→3638 32,63 m (handan Hellu, rétt flokkað).
- **Summur:** R1→Selfoss 45 740,4602 m (1436 einu sinni, step 0) og bil 34,9829 m; R1→Hella cum við 3591 = 81 769,554 m, bil 0,2343+34,7487+30,0966+42,3022 = 107,382 m; `bridge_summary_to_hella` nonzero_count 4. Allt stemmir við kafla „Vegalengdargrunnur“. E1 677,6344 km (með 1436 einu sinni) er rétt; **ég leiðrétti mitt eigið JB3-orðalag úr #501 result-review:** ég merkti 680,1945/677,6344 öfugt (með/án 1436); v3-leiðrétting Ripley stendur, 680,1945 er tvítalning.
- Skipting geometry / topology / akstursheimild er hrein í áætluninni (VEGHLUTI, röð og current færð ekki heimild); áfangi G er utan M; engin fullyrðing um 56 staði/UI/routeId.

### Niðurstöður (engin blocker)
**JD1 — kall 1 og 2 eru þegar svöruð af retained gögnum (sýnt, ekki ályktað).**
- GetCapabilities er varðveitt tvisvar: `ticket-499/samples/raw-ACCESS-CAPABILITIES.xml` (38 416 B, SHA-256 bd10b61e…a4a1d stemmir við discovery-gaps.json; 61 FeatureType, 28 discovery_candidates) og eldra `ticket-429/samples/vegagerdin-wfs-capabilities.xml` (60 lög; munar aðeins `gis:vindhvidustadir_2026_1`). Ferskt GetCapabilities breytir ekki ákvörðun ⇒ **N1: kall 1 = SKIPPED (retained #499)**.
- DescribeFeatureType fyrir `gis:faerdferlar2017_1` er varðveitt: `ticket-429/samples/vegagerdin-wfs-describe-faerdferlar.xml` (3 481 B, SHA-256 43b3e984…7b98): 24 reitir + SHAPE (LineString). Enginn reitur um one-way/stefnu/aðgengi/node-tengsl. Næst stefnu/aðgengi eru VEGHLUTI, vikudagareitir (SUNNUDAGUR…LAUGARDAGUR), VIRKURDAG/HELGI OPIDFRA/TIL, SNJOMOKSTURSREGLA, HELMINGAMOKSTUR, THJONUSTUFLOKKUR, NAKVAEMNIFERLIS — þetta er **þjónustu-/mokstursáætlun, ekki löggild ferðastefna**; ekki nota sem heimild. Svar við A fyrir þetta layer er því þegar „enginn slíkur reitur“ (observed, og sama og E1-raw 24 properties). ⇒ **N2: DescribeFeatureType kall má ekki vera fyrir faerdferlar2017_1.**
- Af því leiðir að M er í raun **≤1 kall**, ekki 3: eitt DescribeFeatureType fyrir annað layer sem Ripley nefnir sérstaklega, annars 0 köll.

**JD2 — kall 3 (docs-GET) hefur enga slóð.** Capabilities-skráin inniheldur engin MetadataURL, aðeins `http://geoserver.org`, WFS-schema og ows/wfs-endapunkta. Samkvæmt eigin reglu áætlunarinnar er kall 3 **NOT PLANNED/UNKNOWN (N3)**; ekki leyfa vefleit/domain-hop.

**JD3 — ef eitt layer á að velja, hér eru retained forsendur (fyrir Ripley; engin ný rannsókn).** Úr 28 candidates hafa aðeins þessi lýsingu sem tengist vegakerfi: `gis:vegakerfi_ist120_2024_1` („Vegakerfi landsins … vegaskrá“), `gis:veggrennd_2024_1` (viðhaldssvæði), `gis:vegirinatturuislands_2022_1`, `gis:samgongurisv50` (afrit frá Náttúrustofnun, ekki Vegagerðar-autoritet); `gis:vegleid_*` (5 lög) og `gis:umferdinferlar2022_1` hafa enga Abstract; `roadconditions_*`/`test_*` eru prófunar-/færðarlög. Ég get ekki fullyrt út frá retained gögnum að neitt þeirra beri stefnu-/aðgengisreit — það er einmitt spurningin. Ábending: ef Ripley velur eitt, rökstyðja valið úr retained Abstract/nafni (ekki finna upp); vegakerfi_ist120_2024_1 er eina lagið með nefnda heimild („vegaskrá“), en það er ekki stefnuheimild. **Valfrjálst (ekki blocker):** skilgreina fyrirfram hvaða niðurstaða breytir innleiðingu — „reitur fannst“ ⇒ eitt Phase G skref má rökstyðja; „enginn reitur“ ⇒ skila eigandaspurningu (A) í stað frekari leitar. Það er þegar skrifað í áætlun §1/§3; ég bendi aðeins á að líkur á „reitur fannst“ eru lágar, svo eigandi ætti að sjá það áður en hann samþykkir kallið.

**JD4 — B/C bilin má festa án nets (nákvæm retained source-ID; ekkert af þessu þarf kall):**

| Bil | Frá → til (idferill) | IDBUTUR | Native 3057 útgangur → inngangur | m |
|---|---|---|---|---|
| B1 | 1735 → 2071 | 903010037 → 253020037 | (369350,568; 400623,6659) → (369350,3714; 400623,7933) | 0,234 |
| B2 | 2117 → 2135 | 252090037 → 902030037 | (392674,357; 389846,132) → (392703,5; 389865,057) | 34,749 |
| C1 | 3768 → 3767 | **902040037 → 902040037** | (403269,528; 383219,0345) → (403311,6927; 383222,4427) | 42,302 |

C1 er frábrugðið: báðir hlutar eru **sama IDBUTUR** — þetta er innanlinks-hlé (hugsanlega vantandi/óútdreginn hluti eða annað VEGHLUTI), ekki samskeyti tveggja nafngreindra leiða. Ég leitaði í staged retained JSON (ticket-493*/ticket-429 samples) og fann ekki geometry-skrá sem inniheldur IDBUTUR 902040037 við þetta bil; get því ekki fullyrt að gögn vanti í raw, bara að ég fann þau ekki — **offline athugun á retained raw (ekki net) á að koma á undan Phase G** fyrir C1 (sama regla og áætlun E).

**JD5 (valfrjálst, ekki blocker) — budget.** Í ljósi JD1 er 6 MiB / 2 MiB-á-kall of rúmt fyrir ≤1 DescribeFeatureType (svar ≈ nokkur KB; faerdferlar-svarið er 3,5 KB). Mæli með 256 KiB á kall, 1 kall, 20 s, 0 retry, 0 redirect, sama stop-lista.

### Skilyrði fyrir execution-prompt (N1–N3 + áfram í áætlun)
- **N1** GetCapabilities: SKIPPED, retained #499 (SHA bd10b61e…).
- **N2** Eitt DescribeFeatureType í mesta lagi, fyrir **nefnt** layer ≠ faerdferlar2017_1 (retained #429 SHA 43b3e984…), með nákvæmri URL (host `gagnaveita.vegagerdin.is`, `/geoserver/gis/ows`, `service=WFS&version=1.0.0&request=DescribeFeatureType&typeName=<layer>`), tilgangi og expected schema; ef Ripley/eigandi telur líkur á stefnureit of lágar til að réttlæta kall ⇒ 0 köll og eigandaspurning A strax.
- **N3** Kall 3: NOT PLANNED.
- Án fyllts request-manifest með nákvæmri URL ekki READY_FOR_CC (áætlunin segir þetta sjálf); engin ný routeId/graph/UI/#500/server_data; áfangi G sérstakt samþykki.

### Takmörk
Ég keyrði ekkert á vél eiganda og gerði engin net-köll. Kort-/mynd-athuganir Ripley (t.d. snerting, Akureyri↔Borgarnes) eru Ripley-heimild sem ég get ekki staðfest. Ég staðfesti ekki hvort Vegagerðin eigi aðra dokumentation; áætlunin tekur það rétt fram sem UNKNOWN. Þetta er fyrsta umferð; engin umferð 2 er þörf nema Ripley breyti kalla-fjölda umfram N1–N3.


## Ripley ákvörðun eftir APPROVED — 2026-11-17

N1/N3 samþykkt: GetCapabilities og faerdferlar DescribeFeatureType sleppt (retained); docs GET NOT PLANNED. Eina tillagan er ROAD-REGISTER-SCHEMA í metadata-request-proposal.json: DescribeFeatureType gis:vegakerfi_ist120_2024_1, valið vegna retained vegaskrá-Abstract, ekki sem staðfest stefnuheimild. Hámark 1 GET/256KiB/20s/0retry/0redirect. Eigandi þarf að samþykkja þetta nákvæma kall áður en execution-prompt/READY_FOR_CC er búið til. Engin ný Jonesy-umferð nauðsynleg innan N1-N3. Engin netbeiðni gerð. JD4 bil/nákvæm IDs varðveitt í review; offline C1-raw athugun áður en Phase G verður heimilað.

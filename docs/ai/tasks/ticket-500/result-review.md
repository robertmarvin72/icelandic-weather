# #500 — Fyrsta MVP-lota, result review

## Ripley lokamat — 2026-11-14

**PASS fyrir fyrstu afmörkuðu gagnalotu #500.** Samþykkt prompt, CC-skýrsla og yfirferð Jonesy styðja að fjórar rekjanlegar staðafærslur og R1-keðjuútdráttur með unsupported-stöðu séu afhent. Ég las samþykkta afmörkun og viðeigandi gagnalýsingar og endurkeyrði sjálfur `python -B docs/ai/tasks/ticket-500/verify.py`: 5/5 PASS. Þetta eru markvissar athuganir með takmörkunum KD3, ekki full provenance-vörn; allar tíu skráðar SHA-tilvísanir og ítarlegur hnit/sniðsamanburður eru staðfesting Jonesy, ekki endurreikningur minn.

KD1 leiðrétt beint í evidence.md og r1-north-connection.json: mæld nálægð með 15 skráðum bilum um 2,9–41,5 m, ekki samfelld snerting; síðasta bil að upphafi 3025 er 0,0 m. KD2 stafsetning tveggja heimildarheitisreita leiðrétt í places-v1.json (Hánefsstaðavegur/Hánesstaðavegur). Engin tölugildi, röð eða aðgengisstaða hækkuð. 5/5 athuganir standast einnig eftir textaleiðréttingarnar og git diff --check fyrir ticket-500 standast. KD3/KD4 valfrjáls og skapa enga nýja lotu.

CURRENT → CLOSED fyrir þessa gagnalotu. #500 í heild áfram opinn: 68 vinnulistastaðir eftir og R1-norðurtenging unsupported þar til nauðsynleg heimild um akstursstefnu/bogaval liggur fyrir. Þessi samningur einn gefur #501 enga staðfesta akstursleið. Næsta efnislega skref er að afmarka hvernig afla megi þeirrar heimildar; það hefur ekki verið framkvæmt eða heimilað sjálfkrafa hér. Engin önnur yfirferðarlota nauðsynleg. Engin app-/net-/GitHub-aðgerð eða commit/push; frontend/build/vafri ekki viðeigandi fyrir gagnatextann.

## Jonesy result review — umferð 1 (2026-11-14)

**Niðurstaða: PASS fyrir fyrsta gagnasamning (fjórar staðafærslur + R1-norðurútdráttur með unsupported-stöðu). Engir sýndir blockerar. Fjórar athugasemdir (KD1–KD4), allar ekki-blockerandi; engin ný review-umferð nauðsynleg.** #500 í heild er ekki lokið (68 staðir eftir, R1-norðurtenging unsupported); PASS þýðir „fyrsti gagnasamningur tilbúinn“.

Mat samkvæmt MVP-reglum README: aðeins sýndir blockerar eru viðtökuskilyrði; KD1–KD4 eru orðalags-/valfrjálsar athugasemdir. KD1 er ráðlögð bein textaleiðrétting (Ripley/CC), ekki ný lota.

### Sandbox (mitt, Linux/Python 3.13, aðeins lestur á afritum, engin net-/provider-köll) vs CC-eignað

**CC-eignað (Windows, ekki endurkeyrt af mér):** „Prompt approved“ á READY_FOR_CC; að verify.py hafi verið keyrt á Windows (5/5) og að engin git/net/GitHub-aðgerð hafi verið gerð; að ekkert utan `ticket-500/` + CURRENT breyttist (ég staðfesti aðeins að ticket-499-skrár hafa óbreyttan mtime).

**Staðfest í sandbox:**

1. **Heimild/afmörkun.** SHA approved-prompt-v1.md = `4b0b36af…1e01` (MB1 er fellt inn í textann). Á tækinu eru aðeins nýjar skrár í `ticket-500/` (places-v1.json, r1-north-connection.json, evidence.md, cc-report.md, verify.py) auk prompt-skráa; ticket-499-skrár hafa óbreyttan mtime (registry `1794606430913`).
2. **SHA-tilvísanir.** Ég fór yfir **allar** SHA sem skráðar eru í `places-v1.json` og `r1-north-connection.json` (10 pör) og reiknaði þær aftur úr skrám á tækinu: **10/10 stemma** (wfs-chain-4326, wfs-vegnr1-all, endpoint-wgs84.json, raw-E1, raw-S2, rp1_native_reference, ticket-493-north-data/route-data-candidate, #491 route-data-candidate, #491 evidence-table-final).
3. **Staðir og hnit.** Fjögur einstök ID (reykjavik-raudavatn, egilsstadir, seydisfjordur, akureyri), engin Hagstofa-auðkenni. R1 64.10152894/−21.75906405 = vestari endi 1436 (stemmir við #499/ég áður); E1 65.25861764/−14.39028964 = endpoint-wgs84.json (2345/2344, tier −1); S2 65.26021788/−14.00953135 = raw-S2 (2894 END); C −18.12371406/65.69570405 = 2940 wgs84_end í ticket-493-north-data. IDBUTUR: E1 911040037 og S2 911170037 stemma við raw; C: 909030037/909360037 (tvö gildi, rétt gerð grein fyrir).
4. **R1-útdráttur.** `chain_segments` eru nákvæmlega fyrstu 15 stykki #491-keðjunnar (1477 … 49285) í sömu röð, með sömu `gap_from_prev_m`, hlutverk, orientation og native-endapunktum; terminal-punktur 3025 = P1 (native og WGS84). Áður staðfesti ég í sandbox að IDBUTUR/VEGHLUTI/KAFLANR/native-endapunktar stykkjanna stemmi við `wfs-vegnr1-all.json` (tier 0). Engin ETA, veðurpunktar P2–P4 eða cumulative-km eru flutt. MB1 er efnt: útdrátturinn segir að „Kjalarnes“ hefst við 2532 (~11,7 km) og að upphaf 3025 sé P1-viðmið ~12 km inni, ekki innkoma; 37,39 m fyrsta bilið er skráð sem *bil* (ekki snerting); hringtorg 8677 nefnt sem utan C1-síu; R1-austur (Vík) merkt „ekki metin“. Rétt túlkun á „Útilokaðir hlutar“ í #491 evidence-table (ramp/hringtorg = tengipunktar fyrir brúun).
5. **Staða.** `status_for_501 = unsupported`, H1 = INFERRED („not proven legal traffic direction“), driving_access = EXACT_GAP fyrir alla fjóra, `routability: NOT routable yet` fyrir alla; ekkert „supported“ hvar sem er. Næsta gagnagat er eitt og nákvæmt (heimild um leyfða akstursstefnu og bogaval við Kjalarnes-mótin), retained gögn leysa það ekki og lotan stöðvaði þar (engin ný öflun).
6. **verify.py.** 5/5 PASS hér (`-I`, `PYTHONDONTWRITEBYTECODE=1`). Mutation-prófin kalla raunveruleg föll (`find_duplicate_ids`, `sha_matches_file`, `is_wrongly_promoted`) með raunverulegri breytingu — KB1/KC1-krafan er efnd (tvítekið ID, röng SHA, tilraun til að hækka í „supported“ og að sleppa INFERRED).

### Athugasemdir (ekki blockerar — engin ný vinna krafist)

- **KD1 — „raunveruleg snerting alla leið“ er ofmat.** `evidence.md` segir keðjan „proves real geometric contact all the way to the start of IDFERILL 3025 (including one exact 0.0 m contact at the terminal point)“ og `r1-north-connection.json` (`status_for_501`) segir „connects R1 toward the Kjalarnes section with real measured contacts“. Í útdrættinum sjálfum eru **öll 15 bilin óþekkt sem 0,0 m**: 2,88–41,45 m (hámark 41,45 m; aðeins bilið 49285→3025, sem er *utan* 15 stykkja listans, er 0,0 m). Þetta er skráð réttilega í `gap_from_prev_m` og `first_gap`, en prósinn stangast á við þau. Áhrif: engin á gagnasamninginn (staðan er unsupported og gap-gildin eru rétt), en lesandi gæti haldið að keðjan sé samfelld. Ráðlegging: bein textaleiðrétting í tveimur setningum — „mæld nálægð með 15 skráðum bilum 2,9–41,5 m (brúuð af útilokuðum tengirömpum skv. #491), 0,0 m við P1“. Ekki skilyrði; ekki ný umferð.
- **KD2 — stafsetning í tilvitnuðum vegaheitum (S2).** `places-v1.json` (`role`) hefur „Húnefsstaðavegur“ og „Húnesstaðavegur“; raw hefur **„Hánefsstaðavegur“** (2894) og **„Hánesstaðavegur“** (2892). Skaðlaust fyrir hnit/ID/stöðu; aðeins tilvitnun í STADARLYSING. Valfrjálst að laga.
- **KD3 — verify.py ber saman við hörðkóðuð gildi.** SHA- og hnitaprófin nota fasta í skriftunni en ekki gildin sem eru skráð í JSON-skránum (a.m.k. SHA-listi fjögur af tíu). Ég staðfesti sjálfur öll tíu skráðu pörin og hnitin (liðir 2–3), svo engin áhrif. Túlka skriftuna sem fimm samræmisathuganir + þrjú raunveruleg mutation-próf, ekki sem fulla rekjanleikavörn. Valfrjálst; ekki skilyrði.
- **KD4 — birtingarheiti með innri kóða.** Display-nöfn „Egilsstaðir (E1)“ og „Akureyri (C)“ bera innri endapunktakóða; ef þau eiga að birtast notendum þarf síðar annað nafn. E1 `native_reference.sha256 = null` (ER1) stendur samkvæmt prompti; ég staðfesti að `rp1_native_reference.json` í #493 og afritið í #499 er sama skrá (`bc1a6dbc…`), svo mætti fylla reitinn síðar án ágiskunar. Hvort tveggja valfrjálst.

### Takmörk

Ég las ekki GitHub-miðana (hef engan aðgang) og treysti tilvitnunum Ripley í prompti. Ég keyrði ekkert á vél eiganda (ekkert git/test/build/vafri) og gerði engin netköll. Ég bar ekki WGS84-hnit R1-útdráttarins (aðeins P1 og 1436-endapunktana) saman við `wfs-vesturland-4326.json` stykki fyrir stykki; útdrátturinn byggir á native-hnitum og P1-WGS84 úr #491-skránni. Ég bar README ekki línu fyrir línu við fyrri útgáfu (mtime óbreytt). `git status`, röð atburða og „Prompt approved“ eru CC-eignuð.

### Næsta skref

Ripley: lokamat (PASS/PARTIAL) á þessari lotu; mælt er með beinni textaleiðréttingu á KD1 ef eigandi vill, annars má láta það standa sem athugasemd. #500 helst opið: R1-norðurtenging er unsupported þar til heimild um akstursstefnu/bogaval er fengin (eigandi ákveður hvort og hvernig), og 68 staðir bíða afmarkaðra svæðislota. Engin önnur Jonesy-umferð nauðsynleg nema eigandi biðji um hana.

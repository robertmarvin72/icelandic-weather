# #499 — Result review

## Ripley lokamat — 2026-11-13

**PASS fyrir þessa afmörkuðu gagnaafhendingu; niðurstaða verkefnis #499 er áfram PARTIAL.** Samþykkt prompt leyfir skýrt afhendingu með rekjanlegum gögnum og merktum götum. E1/S2/C eru varðveitt eða sótt samkvæmt þeirri afmörkun; R1 er hvorki valinn né tilbúinn. Engin akstursheimild í báðar áttir er staðfest. Þetta mat heimilar ekki Frá/Til-innleiðingu eða lokun GitHub-miða.

Ég las approved-prompt-v1.md, cc-report.md, endpoint-registry.json og yfirferð Jonesy. Ég endurkeyrði sjálfur `python -B docs/ai/tasks/ticket-499/samples/validator_499.py`: 17/17 standast. Að auki staðfesti ég beint úr raw S2 að matched=returned=len=20, mót 2894 END/2892 START eru jöfn á öllum fjórum tierum, allar átta registry-hnitafærslur stemma og SHA frumskráa S2/E1/C stemma við registry. Engin netköll voru gerð í lokamatinu. Nákvæm röð heimildar/handoff og netkeyrslu er áfram CC-eignuð; aðrar ítarlegar sannprófanir Jonesy eru eignaðar hans yfirferð.

KB1–KB3 skapa ekki nýja vinnulotu: sjálfsgild mutation-próf sanna ekki sjálfvirka villugreiningu, E1 er tilvísun fremur en sjálfstæð uppbyggð hnitafærsla og röð handoff verður ekki sönnuð af lokaskrám. Beinar athuganir styðja núverandi gögn; enginn sýndur blocker á þessa afmörkuðu afhendingu. Engin app-breyting var til yfirferðar; frontend/build/vafri/production ekki prófað í þessu lokamati.

CURRENT → CLOSED lokar þessari framkvæmdar-/yfirferðarlotu eingöngu. #499 helst PARTIAL/opinn. Næst þarf eigandaákvörðun um afmarkaða leit að nafngreindri Reykjavíkuraðkomu; tillagan í registry er ekki tilbúin kallalýsing og engin ný gagnaöflun er heimiluð hér. Engin önnur review-umferð, commit, push eða issue-lokun.

## Jonesy result review — umferð 1 (2026-11-13)

**Niðurstaða: PASS fyrir afhendinguna eins og hún er skilgreind (PARTIAL með R1 opinn, sbr. approved-prompt-v1.md). Engir sýndir blockerar. Þrjár athugasemdir (KB1–KB3), allar ekki-blockerandi; engin ný vinna og engin önnur review-umferð nauðsynleg.**

Mat samkvæmt MVP-reglum README: aðeins sýndir blockerar eru viðtökuskilyrði; KB1–KB3 eru valfrjáls herðing/skýringar og mynda ekki vinnu eða aðra lotu.

### Hvað er sandbox (mitt) og hvað CC-eignað

- **Sandbox (mitt, Linux/Python 3.13, aðeins lestur á afritum, engin net-/provider-köll, ekkert keyrt á vél eiganda):** SHA-256 af approved-prompt-v1.md, raw-S2-WGS84.json, raw-ACCESS-CAPABILITIES.xml, rp1_native_reference.json, request-manifest.json og driver.py (afrit vs #493-original); ledger-línur; URL í ledger = `full_url` í manifest; S2-svarið sjálft (talning, pör, CRS, IDBUTUR, hnit); öll 8 S2-registry-færslur borin saman við raw (id/IDFERILL/tier/OBJECTID/lat/lon); native-viðmiðun; E1 raw (8/8 hnit jöfn); C í `route-data-candidate.json`; capabilities-talning; 17 validator-próf keyrð (Python 3.13 hér); HASHES.json fyrir #493 (47/47 óbreytt, CRLF/LF-jafngilt).
- **CC-eignað (Windows, ekki endurkeyrt af mér):** að netköllin voru raunverulega gerð í þeirri röð og á þeim tíma sem ledger segir; að CC-skýrslan var skrifuð (authorization-kaflinn) *áður* en fyrsta kallið fór; að owner „Prompt approved“ kom á READY_FOR_CC; `git status` í skýrslunni; að `__pycache__` var fjarlægt; að AGENTS/CLAUDE/README breytingarnar voru fyrirliggjandi.

### Staðfest í sandbox

1. **Heimild/afmörkun.** approved-prompt-v1.md SHA = `a0b7b1d5…d4f4` eins og cc-report skráir. Ledger: nákvæmlega 2 GET, bæði 200, engin redirect, `truncated:false`, 36 943 + 38 416 = 75 359 B af 4 456 448, 0,10 s / 0,06 s, 0 stop_reasons, báðar slóðir á `gagnaveita.vegagerdin.is/geoserver/gis/ows`. `sha256_of_received_bytes` í ledger = SHA raw-skránna (`b1b8aa63…`, `bd10b61e…`). Ledger-URL = manifest `full_url`; encoded SHA 0d57d61f…/b00320ca… = #493-gildin. E1 ekki kallað (engin E1-lína í ledger).
2. **S2.** FeatureCollection, `numberMatched = numberReturned = len(features) = 20`, CRS `urn:ogc:def:crs:EPSG::4326`, allt IDBUTUR 911170037 / lag `faerdferlar2017_1`, 20/20 vænt pör ({3410,3409,2894,2892,2891} × {−1,0,1,2}), engin tvítekning, engin aukafeatures, 24 properties. Í öllum 4 tierum: 2894 síðasti punktur = 2892 fyrsti punktur = (lon −14.00953135, lat 65.26021788); rétt snúið í registry (lat/lon) og z er ekki notað. Allar 8 registry-færslur stemma við raw (0 frávik). Native (732875.674, 538207.0762) kemur fyrir sem 2894 last_xy / 2892 first_xy á öllum 4 tierum í rp1_native_reference.json.
3. **Capabilities.** 61 `wfs:FeatureType` (DescribeFeatureType er aðgerð, ekki layer — rétt talið), nöfn í discovery-gaps.json = nöfn í XML (0 munur), 28 discovery_candidates; `driving_access_both_directions = EXACT_GAP`. Ekkert fullyrt um akstursheimild.
4. **E1.** raw-E1 SHA `cb938294…` = #493-ledger; 32 features, 24 properties; 2345-END og 2344-START hafa sama WGS84-punkt (65.25861764, −14.39028964) á öllum 4 tierum (8/8). Registry geymir E1 sem tilvísun, ekki ný hnit.
5. **C Akureyri.** `route-data-candidate.json` SHA `094fb5d3…` stemmir; 2940 native_end = 3876 native_start = (540259.2615, 577843.7582); WGS84 (−18.12371406, 65.69570405) á báðum. Merkt „RETAINED — ekki endursótt“ eins og JA3 krafðist. IDBUTUR 2940 = 909030037, 3876 = 909360037 stemma við chain_pieces.
6. **R1.** Ekkert hnit, enginn valinn candidate, Rauðavatn rétt merkt „unselected comparison candidate“, minnsta næsta skref skráð en ekki framkvæmt. Ekki merkt eigandasamþykkt. Heiðarlegt PARTIAL.
7. **JA1–JA3 efnd.** driver.py afrit er byte-eins og #493-originalinn; live_driver.py afrit: E1-kall fjarlægt, `max_calls=2`, 4 456 448 B, 10 mín; aukafeatures með sama IDBUTUR = finding; talningarskilyrði `matched == returned == len(features)`; STOP aðeins fyrir CRS/vantandi/tvítekið/rangt lag-IDBUTUR/matched>returned/≥300; capabilities keyrð nema flutnings-/öryggisstopp. Engin „>40“. C heimildir (JA3) komnar. #493-skrár óbreyttar (HASHES 47/47). Skráalisti ticket-499 á tækinu er innan afmörkunar; ekkert utan ticket-499 + CURRENT sést í mínum lestri (en sjá takmörk).
8. **Validator.** 17/17 standast í sandbox (staðfest með `bounded_fetch.py` SHA `c2610ebf…` óbreyttri).

### Athugasemdir (ekki blockerar — engin ný vinna krafist)

- **KB1 — þrjú „regression“-próf sanna ekkert um villu-greiningu.** `test_s2_raw_sha256_mismatch_is_detected`, `test_missing_tier_is_detected_by_removal` og `test_mutated_start_coordinate_fails_junction_check` búa til breytt gildi og staðhæfa `assertNotEqual`/`assertFalse` á því — þau kalla á engan validator-kóða sem „fellir“. Aðeins `validate_response`-prófin (extras/dup/missing/CRS/limit-hit) prófa raunverulegan kóða. Afleiðing: orðalag í cc-report/evidence („shown to diverge (caught)“, „mismatch detected“) ofmetur það sem prófin sanna; engin sjálfvirk athugun er á registry gegn raw/ledger/native. **Áhrif á afhendinguna: engin** — ég staðfesti þessi atriði sjálfur (liðir 1–2 hér að ofan) og þau stemma. Ráðlegging: túlka validatorinn sem „17 samræmisathuganir á núverandi gögnum + 8 prófa validate_response“, ekki sem mutation-vörn. Ef eigandi vill síðar raunverulega vörn er það valfrjáls ný lota (ein föll sem tekur registry+raw+ledger+native og skilar villum) — ekki skilyrði fyrir #499.
- **KB2 — E1-færslan er tilvísun, ekki uppbyggð hnit.** Lat/lon fyrir E1 eru aðeins í textareit (`owner_choice`) og í #493 `endpoint-wgs84.json`; native-viðmiðun nefnir skrá + native_xy en ekki skráar-SHA né hornpunktsvísi (sama skrá `bc1a6dbc…` á við; ER1-gatið er skráð af CC án þess að vera lagað, í samræmi við „ekki breyta gömlu afhendingunni“). E1-junction-jafnræði (8/8) var ekki staðfest með kóða af CC; ég staðfesti það í sandbox. Frá/Til-smíðin þarf annaðhvort að lesa `endpoint-wgs84.json` fyrir E1 eða að tveimur uppbyggðum reitum sé bætt við — valfrjálst, ekki blocker.
- **KB3 — röð/heimildaskrá er CC-eignuð.** cc-report.md hefur lokabreytingar-mtime eftir köllin (eðlilegt fyrir skýrslu sem er uppfærð), svo „skrifað fyrir fyrsta kall“ verður ekki sannreynt af tímastimplum; „Prompt approved“ frá eiganda er ekki bókað orðrétt í CURRENT-handoff (aðeins Ripley-færslan „Næst eigandi til CC: Prompt approved“). SHA approved-prompt og ledger-tímar (19:56:32 UTC, eftir mtime approved-prompt) eru samrýmanleg. Eigandi veit sjálfur hvort hann sendi handoff; engin aðgerð.

### Takmörk

Ég keyrði ekkert á vél eiganda (ekkert test/lint/build/git/vafri) og gerði engin netköll; `git status`, AGENTS/CLAUDE/README-breytingar og röð atburða eru CC-eignuð. Ég las README-reglurnar sem skipta máli (MVP, blockerar vs herðing, þriðja umferð) en bar ekki README saman línu fyrir línu við fyrri útgáfu. Staðfesting á WGS84-gildunum sjálfum er samræmisathugun gegn native-gögnum, ekki sjálfstæð sönnun (EA5d), og engin akstursheimild er staðfest.

### Næsta skref

Ripley: lokamat (PASS/PARTIAL) á #499; #499 helst PARTIAL þar til eigandi tekur **eina** ákvörðun um R1 (Reykjavík): hvort leyfa eigi minnsta næsta gagnaöflunarskref sem cc-report/registry leggur til, eða velja annan hátt. Engin önnur Jonesy-umferð þarf nema eigandi biðji um hana.

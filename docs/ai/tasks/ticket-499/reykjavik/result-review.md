# #499 — Reykjavík approach, result review

## Ripley lokamat — 2026-11-13

**PASS fyrir afmarkaða tillöguafhendingu; #499 áfram PARTIAL/opinn.** Ég las samþykkt prompt, CC-skýrslu, candidate.md, validator og yfirferð Jonesy. Ég endurkeyrði sjálfur `python -B docs/ai/tasks/ticket-499/reykjavik/validator.py`: 9/9 standast, þar með talin núverandi frumskrár-SHA, hnit á öllum fjórum tierum og endurreiknuð línuendabil. Engin ný netköll eða app-próf í þessu lokamati. Niðurstöður Jonesy um einstaka tengienda og fyrri akkerissamanburð eru eignaðar hans yfirferð; keyrsluröð og upphaflegt handoff áfram CC-eignuð.

Afhending uppfyllir MVP-viðtökuna um rekjanlegan tillögupunkt með merktum gagnagötum. KC1–KC4 kalla ekki á nýja framkvæmdar- eða review-lotu. Tvö mutation-próf sanna ekki þá villugreiningu sem skýrslan gefur til kynna; samræmisprófin á núverandi gögnum standast. „Óháðar heimildir“ er ofmat: endurmælingar byggja á sama veglagi. Engin framleiðslustaðfesting eða akstursheimild leiðir af því að keðja sé í segments.js.

Fyrir eigandaákvörðun: tillagan er **vestari endi 1436 við Rauðavatn**, latitude 64.10152894 / longitude -21.75906405, ekki miðbær Reykjavíkur eða sannað næsta borgarakkeri. Vík-tengingin 0,0 m er við austari enda sama stykkis; frá tillögupunktinum liggur hún fyrst um allt stykki 1436, um 2,56 km. Tengingin við Reykjavík/Kjalarnes hefur mælda nálægð en nákvæmur bogi og akstursstefna eru óleyst. Akstursaðgengi í báðar áttir er enn EXACT_GAP; vörunafn/staðarval leysir það ekki.

Ég mæli með Rauðavatni sem skýrt merktu MVP-viðmiði „Reykjavík — Rauðavatn“, ef eigandi samþykkir þann staðarpunkt. Það er staðarvalsákvörðun, ekki samþykki á óstaðfestri akstursleið. R1 helst PROPOSED_AWAITING_OWNER_SELECTION. Næst þarf aðeins já/nei eiganda við þeim punkti; engin frekari rannsókn eða nýtt prompt er stofnað sjálfkrafa.

CURRENT → CLOSED lokar þessari gagnalotu eingöngu. Engin app-innleiðing, registry-breyting, commit/push eða GitHub-lokun framkvæmd.

## Jonesy result review — umferð 1 (2026-11-13)

**Niðurstaða: PASS fyrir afhendinguna (einn tillögu-candidate, PROPOSED_AWAITING_OWNER_SELECTION). Engir sýndir blockerar. Fjórar athugasemdir (KC1–KC4), allar ekki-blockerandi; engin ný vinna og engin önnur review-umferð nauðsynleg.** #499 helst PARTIAL þar til eigandi tekur R1-ákvörðun.

Mat samkvæmt MVP-reglum README: aðeins sýndir blockerar eru viðtökuskilyrði; KC1–KC4 eru skýringar/valfrjáls herðing.

### Sandbox (mitt, Linux/Python 3.13, aðeins lestur á afritum, engin net-/provider-köll) vs CC-eignað

**CC-eignað (Windows, ekki endurkeyrt af mér):** að „Prompt approved“ kom frá eiganda á READY_FOR_CC; `git status` og að ekkert utan `reykjavik/` + CURRENT hafi breyst; að validator var keyrður á Windows (9/9) og REPO_ROOT-villan sem er sögð löguð.

**Staðfest í sandbox:**

1. **Heimild/afmörkun.** SHA approved-prompt-v1.md = `b2523be9…7171`, eins og cc-report skráir. Engin net-köll: `reykjavik/` inniheldur aðeins approved-prompt, candidate.md/json, cc-report.md og validator.py — engin raw-svör eða ledger, sem stemmir við „engin köll gerð“. Slík sleppa er leyfð af prompt step 1 þegar retained gögn gefa rekjanlegan candidate. Gamla `endpoint-registry.json` (mtime óbreytt) og aðrar skrár í ticket-499 rót eru óbreyttar samkvæmt mtime.
2. **Tilvitnaðar skrár.** SHA stemma allar fjórar: `wfs-vegnr1-all.json` `305f60d6…`, `wfs-chain-4326.json` `96684855…`, harness-úttak `495dda62…`, ticket-491 evidence `eaec601b…`.
3. **Nafn.** `STUTTNAFNLEIDAR = "Rauðavatn - Nesjavallaleið"` fyrir IDFERILL 1436 / IDBUTUR 1410010037 (VEGNR 1, KAFLANR e2), `STADARLYSING = "Geirland - Norðlingavað"`; sama nafn og í `api/_lib/winterRoute/segments.js` (fyrsta af 13 IDBUTUR í sömu röð og í #486).
4. **Hnit.** `wfs-chain-4326.json` (156/156/156, CRS EPSG:4326, server-reprojection): 1436 síðasti punktur (vestari endi) = lon −21.75906405, lat 64.10152894 á öllum 4 tierum, fyrsti punktur (austari) = −21.71204873, 64.09249225. Native (365522.0175, 402772.762) / (367768.94, 401667.09) — pyproj-niðurstaða mín (3057→4326) frá fyrri yfirferð stemmir við 64.10152892/−21.75906405.
5. **Fjarlægðir endurreiknaðar úr native (óháð texta):** 1436 austari endi ↔ 903010037: **0,0 m** (við *austari* endann); 1436 vestari endi ↔ 914020037: **1,3 m** (stykki 8677, VEGHLUTI 5, hringtorg), **37,4 m** (1477, VEGHLUTI 6), **38,3 m** (54723, VEGHLUTI 7); keðjan 914020037→903020037 10,8 m og 903020037→903030037 (Kjalarnes) 20,9 m eru tekin úr retained harness-úttaki (og stemma við skráð úttak) — ég endurreiknaði 0,0/1,3/37,4/38,3 m beint.
6. **Validator.** 9/9 standast hér (`PYTHONDONTWRITEBYTECODE=1`, engar skrár skrifaðar).
7. **R1 ekki merkt samþykkt.** candidate.md/json segja skýrt PROPOSED_AWAITING_OWNER_SELECTION og að #491-samþykki (2026-11-04) sé fyrir aðra vöru, ekki sjálfkrafa R1. Akstursheimild báðar áttir = EXACT_GAP, ekki fullyrt. Staða tenginga er heiðarleg: Vík-átt rúmfræðilega VERIFIED (keðjan er framleiðsluleiðin úr #486), Reykjavík/Kjalarnes-átt tenging VERIFIED en nákvæmur bogi/akstursstefna UNKNOWN.

### Athugasemdir (ekki blockerar — engin ný vinna krafist)

- **KC1 — „röng SHA“-prófið kallar ekki á athugun (KB1 endurtekið að hluta).** `test_mutated_sha_is_detected` og `test_mutated_coordinate_is_detected` bera saman hreina bókstafi/gildi (`"0"*64` á móti skráðri SHA; `lat+1.0` á móti skráðu hnit) og sanna því lítið; promptið krafðist raunverulegrar athugunar með einni rangri SHA. Hinn helmingurinn (breyttur endapunktur í raunverulegt `min_endpoint_distance`) uppfyllir kröfuna. **Áhrif á afhendinguna: engin** — ég staðfesti SHA, hnit og fjarlægðir beint (liðir 2–5). Túlka validatorinn sem 9 samræmisathuganir + eitt raunverulegt mutation-próf, ekki sem vörn gegn rangri SHA. Valfrjálst; ekki skilyrði.
- **KC2 — „0,0 m“ gildir um austari endann, ekki um birta punktinn.** Birti punkturinn er *vestari* endi 1436; stykki 1436 er sjálft 2 560 m. Snerting 0,0 m við 903010037 er við *austari* endann, og 1,3/37,4/38,3 m við 914020037 eru við *vestari* endann. Vík-átt frá birta punktinum liggur því um allt stykki 1436 (rúmfræðilega samfellt, eitt stykki), en skýrslan og validatorinn (`min_endpoint_distance` tekur lágmark yfir alla endapunkta) tilgreina ekki hvor endinn á við. Áhrif: lesandi gæti haldið að punkturinn sjálfur snerti 903010037. Lagfæring væri ein lína í candidate.md; valfrjáls.
- **KC3 — „óháðar heimildir“ er ofmat.** Cross-check í O5 (1,3/37,4/38,3 m) eru, samkvæmt O5-textanum sjálfum, „Jonesy-endurreiknaðar“ nálægðir úr sama ISN93 faerdferlar-gagnasafni (sömu stykki 8677/1477/54723 og ég endurreiknaði í dag), og `road-links.csv` er unnið úr sama lagi; „two independent retained datasets“ á við endurtekningarhæfni, ekki óháða öflun. Tengingarfullyrðingarnar sjálfar standast; aðeins styrkleikaorðalagið er of sterkt.
- **KC4 — upplýsing fyrir eigandaákvörðun um nafnið „Reykjavík“.** (a) Í #483 harness-úttaki (mín R2-leiðrétting) kemur fram að 1410010037 er *ekki* nálægasti Reykjavíkur-akkerispunktur: VEGNR 1 heldur áfram að 914020037 („Suðurlandsv. um Hádegismóa“) og 903020037 (Vesturlandsvegur) nær borginni, og nálægasti kostur þeirra þriggja var óákveðinn. candidate.md nefnir þetta ekki beint. (b) Vestari endi 1436 er um **7,9 km** í sandbox-útreikningi frá retained Veðurstofu-akkerinu fyrir Reykjavík (64,12888 N, −21,90819 V, úr #450-skrá sem harness-úttakið vísar í). (c) 914020037/903020037 hafa engin retained WGS84-hnit (harness „BLOCKER“); föstu BBOX-köllin í prompti hefðu getað bætt úr því, en voru ekki nauðsynleg fyrir þennan candidate. Þetta breytir ekki því að Rauðavatn er rekjanlegt og sama punkt og eigandi valdi fyrir #491; eigandi ætti bara að vita að það er viðmið „Reykjavíkuraðkoma ≈ Rauðavatn“, ekki miðbær.

### Takmörk

Ég keyrði ekkert á vél eiganda (ekkert test/lint/build/git/vafri) og gerði engin netköll. `git status`, röð atburða og að „Prompt approved“ hafi verið sent eru CC-eignuð. Ég endurmældi ekki 10,8 m og 20,9 m sjálfstætt (tekið úr retained harness-úttaki með SHA) en endurreiknaði 0,0/1,3/37,4/38,3 m. Ég bar README ekki línu fyrir línu við fyrri útgáfu (mtime óbreytt). Hnit eru server-skilað WGS84 (EA5d), ekki sjálfstæð sönnun, og engin akstursheimild er staðfest.

### Næsta skref

Ripley: lokamat á Reykjavík-framhaldinu. Eigandi tekur **eina** ákvörðun: samþykkja eða hafna Rauðavatn/IDBUTUR 1410010037 (vestari endi 1436) sem R1 fyrir #499 (sérstaklega frá #491-samþykkinu), vitandi KC4. Ef samþykkt er „hvaða bogi/rampi“ á Reykjavíkur-hliðinni (914020037, hringtorg 8677) minni, aðskilið eftirfylgniatriði. Engin önnur Jonesy-umferð nauðsynleg nema eigandi biðji um hana.

# #499 — MVP-frágangur, prompt-review

## Ripley initial prompt — umferð 1, 2026-11-13

Til Jonesy-yfirferðar, ekki framkvæmdarheimild. Eigandi bað um prompt fyrir frágang sem gerir kleift að loka gagnaundirbúningi #499 og halda áfram. Þetta er texta-/gagnafrágangur á yfirfarinni afhendingu, ekki ný rannsókn eða innleiðing leiðarvélar.

### Markmið og grunnur

Gera núverandi afhendingu og eftirfylgni skýra: R1 er eigandavalinn „Reykjavík — Rauðavatn“; E1/S2/C hafa rekjanleg gögn. Óleyst aðgengi eða bogaval er áfram óleyst, ekki merkt staðfest til að loka miða.

Lesa AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md; síðan ticket-499/endpoint-registry.json, bæði result-review.md (rót og reykjavik/), reykjavik/owner-decision.md og candidate.json. Nota frumskrár aðeins til að sannreyna núverandi tilvísanir; engin ný öflun.

Ripley las #499/#500/#501 á GitHub 2026-11-13. #499 krefst enn heimildabundins S2-heitis og segir að opin aðgengisgöt jafngildi ekki fullri lokun innleiðingarhliðs. Því þarf að kalla lokunina afmarkaðan MVP-gagnaundirbúning og varðveita hvað var fært áfram. #500 fjallar um staðaskrá og staðfestar vegtengingar; #501 notar þær til leiðarsamsetningar og á að skila unsupported fyrir óstaðfestar tengingar. Ekki fullyrða að upphafleg öll release-skilyrði séu uppfyllt.

### Verkefni CC

1. Uppfæra aðeins S2-heitalýsingu í endpoint-registry.json í hlutlaust MVP-heiti: **„Seyðisfjörður — aðkoma við mót 2894/2892“**. Það lýsir eigandavöldu mótunum sem raw-gögn styðja; ekki opinbert staðarheiti eða staðfest bæjarmörk. Varðveita latitude/longitude, ID, raw/ledger/native tilvísanir, eigandaval og allar EXACT_GAP-stöður. Ekki breyta nafni í hráum gögnum eða sögulegum afhendingum.
2. Skrifa eina stutta `docs/ai/tasks/ticket-499/closure/github-handoff.md` með tilbúnum textablokkum fyrir eiganda:
   - **#499 lokayfirlit/umfangsleiðrétting:** fjórir grunnendapunktar, R1-samþykki, S2-lýsing og tilvísun í registry/owner-decision. Telja sérstaklega hvað er afhent og hvað er fært áfram. Lokun er „MVP-gagnaundirbúningur afhentur með skráðum tengingargötum“, ekki fullgerð Frá/Til eða staðfest akstursleið. Óuppfyllt eldri skilyrði eru merkt flutt/óleyst, ekki einfaldlega hakað við sem uppfyllt.
   - **#500 eftirfylgni:** nákvæmur norðurbogi frá vestari enda 1436 um Reykjavík/Kjalarnes-tengingar, akstursstefna/aðgengi og heimildir. Einnig varðveita óstaðfest aðgengi hinna endapunktanna. Engin ný 72-staða úttekt hér; þetta er viðbót við fyrirliggjandi miðann. Mælda geometry-snertingu má ekki jafna við leyfða akstursleið.
   - **#501 háð:** nota aðeins studdar tengingar frá #500; óstaðfest norðurtenging skal vera unsupported þar til nauðsynleg gögn liggja fyrir. Engin ný krafa um almenna leiðaleitarvél.
   Textablokkirnar eiga að vera stuttar og tilbúnar til birtingar, ekki ný löng review-skýrsla. Ekki breyta öðrum lokaskilyrðum #500/#501 eða hefja vinnu þeirra.
3. Skrifa stutt `closure/cc-report.md`: hvaða reitir breyttust, hvað er tilbúið til eigandafragangs og hvað er enn óleyst. Eldri skýrslur halda sögulegri PARTIAL-niðurstöðu; ekki skrifa yfir yfirferð Jonesy/CC eða eigandasamþykki.

### Sannprófun og viðtaka

Ein JSON-lestrar-/samanburðarkeyrsla nægir: registry parsast; R1/E1/S2/C hnit, auðkenni og upprunatilvísanir óbreytt; engin EXACT_GAP-staða hækkuð í staðfest aðgengi. Athuga að afhendingartexti tengi óleysta norðurtengingu við #500 og unsupported-hegðun við #501, og að S2 sé hlutlaus aðkomulýsing. `git diff --check` fyrir breyttar skrár. Engin ný test-framework, frontend-próf, build, vafri eða endurkeyrsla eldri rannsóknarprófa þarf fyrir þessar textabreytingar.

Viðtaka er samræmd endpoint-skrá og tilbúinn, heiðarlegur GitHub-frágangstexti. Ekki bæta valfrjálsri SHA-/mutation-herðingu KC1/KB1 við. Stoppa þegar þetta er tilbúið.

### Mörk og handoff

Heimilar aðeins endpoint-registry.json, nýjar skrár undir ticket-499/closure/ og CURRENT.md. Engar app/UI/API-, routing-, scoring-, veður-, gating- eða greiðslubreytingar. Engin netköll, ný gögn/dependencies, delegation, commit eða push. Ekki birta GitHub-texta eða loka miða í þessari keyrslu: eigandi sér fyrst tilbúinn texta og tekur birtingu/lokun eftir commit og push samkvæmt README. Að útbúa prompt er ekki staðfesting á að push hafi farið fram.

CC framkvæmir aðeins approved-prompt sem CURRENT vísar á í READY_FOR_CC eftir eiganda „Prompt approved“, notar CC_IN_PROGRESS → CC_COMPLETE og report-slóð úr CURRENT. Jonesy yfirfer þennan afmarkaða frágang, ekki aftur eldri gagnalotur. Þetta er fyrsta umferð þessa textafragangs; valfrjáls atriði mynda ekki nýja lotu. Eftir PASS getur eigandi notað tilbúna textann til að uppfæra #500/#501 og loka #499 sem afmörkuðum MVP-gagnaundirbúningi eftir push.

## Jonesy review — umferð 1 (2026-11-13)

**Niðurstaða: APPROVED MEÐ SKILYRÐUM — eitt skilyrði, LA1.** Annað er í lagi og afmarkað. Stage helst PROMPT_REVIEW; þetta er ekki framkvæmdar- eða netheimild. Keyranlegt aðeins eftir að Ripley fellir LA1 inn í approved-prompt-vN og CURRENT vísar á hann í READY_FOR_CC og eigandi sendir „Prompt approved“.

Mat samkvæmt MVP-reglum README: aðeins sýndur blocker er skilyrði; athugasemdirnar hér að neðan eru valfrjálsar og mynda enga aðra lotu.

### Sandbox (mitt, aðeins lestur á afritum; engin köll, ekkert keyrt á vél eiganda)

- `endpoint-registry.json` (núverandi, 23 206 B) borið saman við eintakið sem ég yfirfór í fyrri umferð: `e1_egilsstadir`, `s2_seydisfjordur`, `c_akureyri`, `discovery_metadata` og `note` eru **óbreytt** (JSON-jafngildi); aðeins `r1_reykjavik` og `open_items` breyttust, eins og Ripley lýsir. R1 hnit/ID (1436 / 1410010037, 64.10152894 / −21.75906405) = `candidate.json`; staða `OWNER_SELECTED`, driving access `EXACT_GAP` ekki hækkað. `owner-decision.md` stemmir við þetta og tekur skýrt fram að valið sé ekki akstursleiðarstaðfesting.
- S2-nafnið „Seyðisfjörður — aðkoma við mót 2894/2892“ er hlutlaust og á sér stuðning í retained gögnum: STADARLYSING stykkjanna er „Seyðirfj.v.: kirkjugarðshorn - Hánefssta…“ (2894) og „Hánesstaðavegur - Vestdalseyrarvegur“ (2892), auk eigandavals í decision-table. Prompt kallar það ekki opinbert staðarheiti. Í registry kemur „Seyðisfjörður (S2)“ fyrir í `place` í 8 færslum, í `name_status` og í `open_items`.
- Umfang (aðeins registry, nýjar skrár undir `closure/`, CURRENT; engin net-/app-/commit-/GitHub-aðgerð; ekki birta texta fyrr en eftir push), stop-regla („stoppa þegar tilbúið“) og útilokun KC1/KB1-herðingar eru skýr. Ekkert í lýsingunni leyfir að aðgengi sé „hækkað“ til að loka miða.

### Skilyrði (sýndur blocker)

- **LA1 — CC hefur enga heimild fyrir því efni sem hann á að skrifa um #499/#500/#501.** Concrete: prompt biður CC að merkja „óuppfyllt eldri skilyrði“ #499 sem „flutt/óleyst“ og að skrifa #500/#501-texta án þess að breyta „öðrum lokaskilyrðum“ þeirra. Hins vegar er engin staðbundin skrá með texta #499/#500/#501 (ég leitaði: aðeins `issue-493-2026-11-05.json` er til, og hún nefnir ekki #499–#501), CC hefur engin netköll, og promptið gefur aðeins tveggja setninga samantekt Ripley („#499 krefst enn heimildabundins S2-heitis…“). Afleiðing: CC verður annaðhvort að giska/smíða lista yfir #499-skilyrði eða sleppa þeim, og eigandi birtir síðan texta á GitHub sem getur rangtúlkað opin skilyrði #499 (t.d. merkt „flutt“ sem aldrei var skilyrði, eða vantar raunverulegt skilyrði). Minnsta lagfæring — approved-prompt tilgreini **annað** af: (a) Ripley límir inn orðrétt þau #499-skilyrði (og stuttar viðeigandi línur úr #500/#501) sem texti á að vísa í, og CC má aðeins nefna þau; eða (b) texti nefnir ekki einstök eldri skilyrði heldur setur eina fasta línu „skilyrði #499 sannreyna gegn miðanum áður en lokað er“, og CC sækir hvorki né giskar á miðatexta. Hvort tveggja er stutt og krefst ekki nýrrar umferðar.

### Athugasemdir (ekki skilyrði)

- **S2-reitir.** „S2-heitalýsing“ nær yfir 8 `place`-reiti, `name_status` og `open_items`-línuna; ef aðeins hluti er uppfærður verður registry ósamræmt. Ein setning í approved-prompt („allir S2-reitir sem bera „Seyðisfjörður (S2)““) nægir; CC finnur þá hvort sem er. Valfrjálst.
- **`git diff --check`.** Nær ekki yfir óskráðar (untracked) nýjar skrár undir `closure/`; það sem hún sannprófar er því registry-breytingin. Valfrjálst að tilgreina; ekki krafa.
- **Samanburður.** „Óbreytt hnit/ID/tilvísanir“ þarf grunnlínu: CC ætti að bera nýja registry við eintakið *fyrir* breytingu (ekki við git HEAD, því registry hefur þegar breyst frá síðustu skuldbindingu). Valfrjálst að tilgreina.

### Takmörk

Ég las ekki #499/#500/#501 á GitHub (hef engan aðgang) og get því ekki staðfest samantekt Ripley; LA1 byggir á því að hvorki CC né ég höfum miðatextann staðbundið. Ég keyrði ekkert á vél eiganda og gerði engin netköll. Ég bar README ekki línu fyrir línu við fyrri útgáfu (mtime óbreytt).

### Næsta skref

Ripley: búa til `closure/approved-prompt-v1.md` (eða slóð úr CURRENT) með LA1 felldu inn, setja CURRENT á READY_FOR_CC. Eigandi sendir síðan „Prompt approved“ til CC. Engin önnur Jonesy-umferð nauðsynleg nema LA1 sé túlkað á annan hátt en hér er lýst.

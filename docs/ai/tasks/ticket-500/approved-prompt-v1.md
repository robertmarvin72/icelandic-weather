# #500 — Samþykkt framkvæmdarprompt v1: grunnstaðaskrá og R1-norðurtenging

## Ripley — 2026-11-14; Jonesy APPROVED með MB1

MB1-orðalagsleiðrétting felld inn eftir Jonesy umferð 1. Keyranlegt aðeins þegar CURRENT vísar hingað í READY_FOR_CC og eigandi sendir „Prompt approved“. Eigandi bað um að byrja #500. #499 vinnulota er CLOSED; ekki fullyrða að GitHub-lokun eða push hafi farið fram.

### Markmið og afmörkun

Afhenda litla, útgáfumerkta gagnaskrá fyrir fjóra þegar valda grunnstaði R1/E1/S2/C og rekjanlega stöðu norðurtengingar R1. Nota fyrirliggjandi gögn; ekki endurtaka loknar rannsóknir. Skráin er fyrsta gagnagrunnslag handa #501, ekki app-runtime tenging eða full staðaskrá landsins. Fyrirhugað UI-entrypoint síðar er Frá/Til; ekkert nýtt UI í þessari gagnalotu.

Ripley las #500 á GitHub 2026-11-14. Þar stendur: „72-staða vinnulistinn er tillaga, ekki samþykktur release-listi“ og „Yfirfara í afmörkuðum svæðislotum, ekki einni óafmarkaðri þjóðarskönnun.“ Lokaskilyrði miðans ná áfram yfir alla 72, eigandaval endanlegs lista, sjálfstæð staðaauðkenni, prófaðar tengingar og útgáfumerkt gögn fyrir leiðarvél. Þessi fjögurra staða byrjun lokar ekki #500 og útilokar ekki aðra staði. Engin 72-raða endurflokkun núna.

### Lesa fyrst

- AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md.
- ticket-499/endpoint-registry.json, reykjavik/owner-decision.md, closure/github-handoff.md og lokamöt í result-review.md, reykjavik/result-review.md og closure/result-review.md. Gagnagöt ER1–ER3 og KC2/KC3 standa; eldri „independent sources“/„production verified“ orðalag er ekki ný sönnun.
- ticket-491/final-validation/route-data-candidate.json, evidence-table-final.md og **result-review-final-validation.md**, sérstaklega lokamat Ripley/C1–C4. Gömul 29-stykkja H1-keðja er þegar varðveitt; ekki finna hana aftur með nýrri leiðarleit. H1 er INFERRED, ekki sönnuð umferðarstefna. C1–C4 gilda ef viðeigandi gögn eru notuð; ETA/lengdarútreikningar ekki í þessari lotu.
- Frumskrár sem þessi skjöl vísa í, aðeins fyrir notaða reiti/stykki. Ekki lesa allar rannsóknarlotur eða endurkeyra gömlu prófasöfnin.

### Framkvæmd CC

1. Búa til `docs/ai/tasks/ticket-500/places-v1.json`: einfaldan `schema_version: 1` og fjórar staðafærslur, með stöðugum auðkennum t.d. reykjavik-raudavatn, egilsstadir, seydisfjordur og akureyri. Nota ekkert ID úr Hagstofuhópun sem sameinar sveitarfélög. Hver færsla hefur IS/EN birtingarheiti, svæði, hlutlausa aðkomulýsingu, owner-selection tilvísun, lat/lon/CRS, road/piece/IDBUTUR/end/start eftir heimild, provenance (slóð/SHA og viðeigandi raw/ledger/native vísun) og skýra stöðu aðgengis/tengingar/valhæfis. Þýdd lýsing er vörutexti, ekki ný opinber nafnheimild. Engar dependencies eða almenn schema-bókasöfn.
2. Endurnýta nákvæmlega eigandavaldar staðsetningar #499: R1 vestari endi 1436; E1 2345 END/2344 START; S2 2894 END/2892 START; C 2940 END/3876 START. E1-hnit finnast í tilvísuðu endpoint-wgs84.json; ekki láta E1 vera án hnita vegna þess að registry vísar á aðra skrá. S2-heiti er hlutlaus MVP-lýsing, ekki staðfest bæjarmörk. Varðveita fyrirvara um native-SHA/vísi sem sannanlega vantar; fylla ekki með ágiskun. Ef viðbótarreitur á ekki heimild, nota null ásamt stuttri ástæðu.
3. Fyrir R1 skrá í `r1-north-connection.json` afmarkaðan útdrátt retained keðjunnar frá vestari enda 1436 að **upphafi 3025 = P1-viðmiðspunkti #491** (IDBUTUR 903030037, „Kjalarnes“, um 12 km inn í kaflann sem hefst við 2532). Útdrátturinn sýni að kaflaheitið „Kjalarnes“ byrjar við stykki 2532; upphaf 3025 er ekki innkoma að kaflanum. Nota röð/hlutverk/orientation/gap úr #491-frumkandídat, ekki endurreikna alla Borgarnesleið eða búa til nýjan kandidat. Staðfesta að raunveruleg IDBUTUR/native-endapunktar í útdrættinum samsvari tilvísuðum native-frumgögnum. Rekja tengsl við R1 í places-v1.json. Hver stykki-/keðjutilvísun hafi notað tier, source/SHA, og INFERRED/UNKNOWN fyrirvarana þar sem við á. Ekki flytja ETA, veðurpunkta eða planar cumulative-km úr #491 inn í nýja contractið. Fyrsta 37,39 m bilið frá R1/1436 að 1477 er skráð bil, ekki snerting; hringtorg 8677 er utan hlutverkasíu C1. Austurtenging R1 (Vík-átt) er ekki metin í þessum samningi.
4. Aðskilja þrjár staðreyndir: eigandi valdi punkt; mæld geometry-nálægð er til; akstursstefna/aðgengi er óstaðfest. R1-norðurtenging er **unsupported fyrir #501** á meðan H1/akstursheimild/bogaval eru óstaðfest. Ekki snúa keðjunni við og fullyrða að hún sé akstursleið suður. Skrá að skortur á gagnastaðfestingu sé ekki yfirlýsing um raunverulega veglokun. E1/S2/C hafa einnig skráða EXACT_GAP-stöðu fyrir akstursaðgengi; eigandaval eitt gerir þau ekki leiðarvalhæf. Þetta er gagnasamningur, ekki ný runtime-gating innleiðing.
5. Skrifa eina stutta `evidence.md` með því sem þessi fyrsta lota afhendir, hvaða gögn voru endurnýtt og **einu nákvæmu næsta gagnagati** fyrir R1: heimild um leyfða akstursstefnu og nauðsynlegt bogaval. Ekki kalla ósannaða akstursstefnu „bara hönnunarákvörðun“. Ef retained gögn leysa það ekki, segja það og stoppa; ekki hefja nýja öflunaráætlunar-/kortaleitarvinnu sjálfkrafa. Aðrir staðir bíða síðari afmarkaðra lota án þess að vera útilokaðir úr #500.

### Markviss sannprófun

Lítil offline-athugun við gagnaskrárnar nægir: fjögur einstök ID; hnit/stykkjaval stemma við eigandaval og frumgögn; notaðar SHA-tilvísanir stemma; R1-útdráttur varðveitir röð/tier/endapunkta úr #491 og H1 fyrirvara; aðgengisgat veldur unsupported, ekki supported. Prófa raunverulega athugun með tvíteknu staða-ID, einum röngum source-SHA og tilraun til að hækka R1 í supported þrátt fyrir UNKNOWN. Prófin verða að kalla kóðann sem finnur villuna, ekki bera eigin mutation saman við sjálfa sig. Ekki almenn validator-umgjörð eða hundruð mutation-prófa. Engin frontend-suite/build/vafri þar sem appkóði breytist ekki.

Viðtaka: fjórar rekjanlegar staðafærslur og retained R1-keðjuútdráttur með heiðarlegu unsupported-gati, staðfest með þessum fáu prófum. Ekki áskilja nýja akstursheimild sem afmarkað retained-only prompt hefur enga heimild til að sækja. PASS á þessari lotu þýðir fyrsta gagnasamning tilbúinn, ekki að #500 eða norðurtenging sé fullkláruð. Skila stuttu cc-report.md og stoppa.

### Mörk og handoff

Aðeins nýjar skrár undir docs/ai/tasks/ticket-500/ og CURRENT.md. Fyrri #499/#491 frumskrár og samþykki óbreytt. Engin app/API/UI-/ETA-/veður-/scoring-/FreePro-/greiðslubreyting. Engin almenn leiðaleit, nýtt netkall/þjónusta/dependency, delegation, GitHub-birting, issue-lokun, commit/push eða deploy. Gögn eru hér gagnaundirbúningur, ekki rannsóknarskrár fluttar beint í frontend. Ef raunveruleg framkvæmd þarf utan þessa umfangs, skrá ástæðu og spyrja eiganda áður en hún hefst.

Jonesy samþykkti með MB1, sem er fellt inn hér. Framkvæmd aðeins með þessu approved-prompt í READY_FOR_CC og eiganda „Prompt approved“. CC notar README-lifecycle CC_IN_PROGRESS → CC_COMPLETE og report-slóðir CURRENT. Þetta er fyrsta prompt-review-lota #500; ekki enduryfirfara lokið #499 eða gera valfrjálsa herðingu að blocker.

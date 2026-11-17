# #500 — Fyrsta MVP-lota: grunnstaðaskrá og R1-norðurtenging

## Ripley initial prompt — umferð 1, 2026-11-14

Til Jonesy-yfirferðar; ekki keyranlegt framkvæmdarprompt. Eigandi bað um að byrja #500. #499 vinnulota er CLOSED; ekki fullyrða að GitHub-lokun eða push hafi farið fram.

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
3. Fyrir R1 skrá í `r1-north-connection.json` afmarkaðan útdrátt retained keðjunnar frá vestari enda 1436 að **upphafi 3025**, innkomu að Kjalarneskaflanum. Nota röð/hlutverk/orientation/gap úr #491-frumkandídat, ekki endurreikna alla Borgarnesleið eða búa til nýjan kandidat. Staðfesta að raunveruleg IDBUTUR/native-endapunktar í útdrættinum samsvari tilvísuðum native-frumgögnum. Rekja tengsl við R1 í places-v1.json. Hver stykki-/keðjutilvísun hafi notað tier, source/SHA, og INFERRED/UNKNOWN fyrirvarana þar sem við á. Ekki flytja ETA, veðurpunkta eða planar cumulative-km úr #491 inn í nýja contractið.
4. Aðskilja þrjár staðreyndir: eigandi valdi punkt; mæld geometry-nálægð er til; akstursstefna/aðgengi er óstaðfest. R1-norðurtenging er **unsupported fyrir #501** á meðan H1/akstursheimild/bogaval eru óstaðfest. Ekki snúa keðjunni við og fullyrða að hún sé akstursleið suður. Skrá að skortur á gagnastaðfestingu sé ekki yfirlýsing um raunverulega veglokun. E1/S2/C hafa einnig skráða EXACT_GAP-stöðu fyrir akstursaðgengi; eigandaval eitt gerir þau ekki leiðarvalhæf. Þetta er gagnasamningur, ekki ný runtime-gating innleiðing.
5. Skrifa eina stutta `evidence.md` með því sem þessi fyrsta lota afhendir, hvaða gögn voru endurnýtt og **einu nákvæmu næsta gagnagati** fyrir R1: heimild um leyfða akstursstefnu og nauðsynlegt bogaval. Ekki kalla ósannaða akstursstefnu „bara hönnunarákvörðun“. Ef retained gögn leysa það ekki, segja það og stoppa; ekki hefja nýja öflunaráætlunar-/kortaleitarvinnu sjálfkrafa. Aðrir staðir bíða síðari afmarkaðra lota án þess að vera útilokaðir úr #500.

### Markviss sannprófun

Lítil offline-athugun við gagnaskrárnar nægir: fjögur einstök ID; hnit/stykkjaval stemma við eigandaval og frumgögn; notaðar SHA-tilvísanir stemma; R1-útdráttur varðveitir röð/tier/endapunkta úr #491 og H1 fyrirvara; aðgengisgat veldur unsupported, ekki supported. Prófa raunverulega athugun með tvíteknu staða-ID, einum röngum source-SHA og tilraun til að hækka R1 í supported þrátt fyrir UNKNOWN. Prófin verða að kalla kóðann sem finnur villuna, ekki bera eigin mutation saman við sjálfa sig. Ekki almenn validator-umgjörð eða hundruð mutation-prófa. Engin frontend-suite/build/vafri þar sem appkóði breytist ekki.

Viðtaka: fjórar rekjanlegar staðafærslur og retained R1-keðjuútdráttur með heiðarlegu unsupported-gati, staðfest með þessum fáu prófum. Ekki áskilja nýja akstursheimild sem afmarkað retained-only prompt hefur enga heimild til að sækja. PASS á þessari lotu þýðir fyrsta gagnasamning tilbúinn, ekki að #500 eða norðurtenging sé fullkláruð. Skila stuttu cc-report.md og stoppa.

### Mörk og handoff

Aðeins nýjar skrár undir docs/ai/tasks/ticket-500/ og CURRENT.md. Fyrri #499/#491 frumskrár og samþykki óbreytt. Engin app/API/UI-/ETA-/veður-/scoring-/FreePro-/greiðslubreyting. Engin almenn leiðaleit, nýtt netkall/þjónusta/dependency, delegation, GitHub-birting, issue-lokun, commit/push eða deploy. Gögn eru hér gagnaundirbúningur, ekki rannsóknarskrár fluttar beint í frontend. Ef raunveruleg framkvæmd þarf utan þessa umfangs, skrá ástæðu og spyrja eiganda áður en hún hefst.

Framkvæmd aðeins eftir Jonesy-samþykki, approved-prompt í READY_FOR_CC og eiganda „Prompt approved“. CC notar README-lifecycle CC_IN_PROGRESS → CC_COMPLETE og report-slóðir CURRENT. Þetta er fyrsta prompt-review-lota #500; ekki enduryfirfara lokið #499 eða gera valfrjálsa herðingu að blocker.

## Jonesy review — umferð 1 (2026-11-14)

**Niðurstaða: APPROVED MEÐ SKILYRÐUM — eitt skilyrði, MB1 (orðalagsleiðrétting).** Annað er afmarkað, framkvæmanlegt og í samræmi við MVP-reglur og lærdóm #499 (KB1/KC1, JA-reglur, ER1–ER3, KC2/KC3). Stage helst PROMPT_REVIEW; þetta er ekki framkvæmdar- eða netheimild. Keyranlegt aðeins eftir approved-prompt í READY_FOR_CC og „Prompt approved“ frá eiganda.

Mat samkvæmt MVP-reglum README: aðeins sýndur blocker er skilyrði; athugasemdir eru valfrjálsar og mynda enga aðra lotu.

### Sandbox (mitt, aðeins lestur á afritum; engin köll, ekkert keyrt á vél eiganda)

- **Útdrátturinn er framkvæmanlegur.** `ticket-491/final-validation/route-data-candidate.json` (29 stykki) — fyrstu 16 stykkin (1477 … 49285, og 3025) ber ég saman við `ticket-483/samples/wfs-vegnr1-all.json` (tier 0): **IDBUTUR, VEGHLUTI, KAFLANR og native entry/exit-endapunktar (±0,01 m) stemma í öllum 16** (0 frávik). Pöntunin (start→end), gap og hlutverk (1/6) eru í candidate-skránni. Skref 3 í prompti (staðfesta native-endapunkta) er því mögulegt án nýrrar öflunar.
- **Endurnýttar staðsetningar #499 stemma:** R1 vestari endi 1436 (hnit í `endpoint-registry.json`), E1 2345 END / 2344 START (hnit í `ticket-493-endpoint-acquisition/endpoint-wgs84.json`, 8/8 jöfn — ég staðfesti áður), S2 2894 END / 2892 START (staðfest í #499), C 2940 END / 3876 START (route-data-candidate, ticket-493-north-data).
- **Stop-/mörkunarreglur** eru skýrar og hæfilegar: aðeins nýjar skrár undir `ticket-500/` og CURRENT, engin ný öflun, H1 áfram INFERRED, R1-norðurtenging `unsupported` á meðan H1/akstursheimild/bogaval eru óstaðfest, E1/S2/C EXACT_GAP, ETA/planar-km ekki flutt. Prófkrafan nefnir raunverulega athugun (tvítekið ID, röng SHA, tilraun til að hækka í supported) og bannar sjálfsgild mutation-próf — rétt lærdómur af KB1/KC1.

### Skilyrði (sýndur blocker)

- **MB1 — „upphaf 3025 = innkoma að Kjalarneskaflanum“ stangast á við retained gögn.** Concrete: í prompti (skref 3) er endapunktur útdráttarins lýstur sem „upphaf 3025, innkoma að Kjalarneskaflanum“. Í raw-gögnum (`wfs-vegnr1-all.json`, STUTTNAFNLEIDAR) hefst „Kjalarnes“-kaflinn (IDBUTUR 903030037, STADARLYSING „Þingvallavegur - Hvalfjarðargöng“) við **stykki 2532** (hlekkur 11 í keðjunni, ~11,7 km frá R1-endanum), og 2532, 30721, 49281, 49285 og 3025 eru öll „Kjalarnes“. Upphaf 3025 er P1-viðmiðspunktur eigandatillögu í #491 (cum 23,632 km, „fulltrúi leiðar sunnan Hvalfjarðargöng“) — um 12 km *inni* í kaflanum, ekki innkoma. Afleiðing: CC fylgir prompt orðrétt og skrifar `r1-north-connection.json`/evidence með fullyrðingunni „innkoma að Kjalarnesi“, sem retained gögn hrekja; #501 gæti lesið útdráttinn sem leið *að* Kjalarnesi þótt 11 hlekkir (Suðurlandsvegur-/Vesturlandsvegur-hluti) séu þegar innan hans. Minnsta lagfæring (aðeins orðalag í approved-prompt): lýsa endapunktinum sem „upphaf 3025 = P1-viðmiðspunktur #491 (IDBUTUR 903030037, ‚Kjalarnes‘, um 12 km inn í kaflann sem hefst við 2532)“ og láta útdráttinn bera sjálfur hvar kaflaheitið ‚Kjalarnes‘ byrjar (stykki 2532) — ekki breyta lengd útdráttarins eða bæta við vinnu.

### Athugasemdir (ekki skilyrði)

- **Fyrsti hlekkur er bil, ekki snerting.** R1-endinn 1436 → 1477 er **37,39 m bil** í candidate-skránni; sama endi snertir hringtorg 8677 (VEGHLUTI 5) á 1,3 m, sem er undanskilið af hlutverkasíu C1, og 1477/54723 á 37,4/38,3 m (sbr. #499 KC2/KC4). Útdrátturinn ætti að skrá þetta bil sem skráð bil (ekki „snerting“) og sleppa ekki að nefna að síað hringtorg er til — annars fær #501 of fallega mynd. Engin ný vinna; ein lína í JSON/evidence.
- **R1-austur (Vík) er utan útdráttarins.** Útdrátturinn nær aðeins norður; `places-v1.json` ætti að segja „austurtenging R1 (Vík-átt) ekki metin í þessum samningi“ svo hún lesist ekki sem studd eða óstudd af þögn. Valfrjálst.
- **Fjórir óstuddir staðir.** Verði E1/S2/C allir EXACT_GAP og R1-norður unsupported mun #501 ekkert studd leið skila úr þessum samningi einum og sér; það er heiðarlegt og samræmist MVP-umfangi, en eigandi ætti að vita það (ekki breyting á prompti).
- **Prófskrá** (lítið check-skript undir `ticket-500/`) er innan afmörkunar „nýjar skrár undir ticket-500“.

### Takmörk

Ég las ekki GitHub-miðana (hef engan aðgang) og treysti orðréttum tilvitnunum Ripley í prompti. Ég keyrði ekkert á vél eiganda og gerði engin netköll. Ég bar ekki #491-gögnin saman við WGS84-skrána `wfs-vesturland-4326.json` (aðeins native-endapunkta); hnit útdráttarins eru því ekki endurstaðfest hér. Ég bar README ekki línu fyrir línu við fyrri útgáfu.

### Næsta skref

Ripley: búa til approved-prompt með MB1-orðalagsleiðréttingu, setja CURRENT á READY_FOR_CC. Eigandi sendir „Prompt approved“ til CC. Engin önnur Jonesy-umferð nauðsynleg nema MB1 sé túlkað á annan hátt.

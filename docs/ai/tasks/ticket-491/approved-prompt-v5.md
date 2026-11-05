# #491 — Lokaleiðrétting skjala, v5

Byggir eingöngu á Jonesy result review umferð 2, W1–W3/D1–D4, og Ripley lokamati. V1/V2 app-lagfæringar samþykktar; engin frekari appvinna í þessari lotu. Eigandi → CC „Prompt approved“. Engin birtingarheimild.

Lestu AGENTS.md, CLAUDE.md, docs/ai/README.md/CURRENT.md, approved-prompt-v4.md og nýjasta result-review-implementation.md/cc-report-implementation.md. Staðfestu READY_FOR_CC; settu CC_IN_PROGRESS. Aðeins derivation-29-pieces.md, viðbót við cc-report-implementation.md og CURRENT.md mega breytast.

1. **W1:** Leiðrétta inline offline skipunina og afleiddar töflur í derivation-29-pieces.md. Telja upphafsbil frá candidate.start_raudavatn.native_3057_end að upphafi 1477 nákvæmlega einu sinni (~37,39 m), með sérstakri röð. Aðgreina uppsafnað við upphaf/enda stykkis frá næsta tengibili. P1 = upphaf 3025, P2 = endi 3796 FYRIR 27,62 m tengibilið, P3 = upphaf 47042, P4 = endi 2819. Ekki tvítelja bil við P3 eða annars staðar. Skipunin þarf að prenta alla 29 stykki, upphafsbil, P1–P4 og 13 Vík-stýriröðurnar sem skjaltöflurnar sýna, ekki aðeins valdar summur.

   Keyra leiðréttu skipunina einu sinni á varðveittum skrám (offline, staðlað Python, engin ný dependency). Jonesy sandbox-viðmið, ekki fyrirfram CC-staðfest: P1 23,5594 / P2 34,2877 / P3 53,7379 / P4 70,5664 km; routes.js fastar 23,559/34,288/53,738/70,566, vænt frávik ≤0,0004 km og samþykkt mörk áfram ±0,01 km. Staðfesta frumskrár/SHA256, skrá raunúttak og frávik; ekki afrita viðmið sem eigin keyrsluniðurstöðu. Uppfæra tölur og skipta virkum Obstacle-kafla út fyrir rétta niðurstöðu ef keyrslan staðfestir hana. Varðveita söguna í cc-report með viðbót: v4 ósamræmi var villa í endurreikningi (upphafsbil/P2), ekki staðfestur galli í leiðargildum. Ekki breyta routes.js.

2. **W2:** Vík-control velur VEGNR sem streng "1" og NAKVAEMNIFERLIS == 0, ekki KAFLANR-mynstur. Skýra að útilokuð 3592/3710 tilheyra VEGNR261 og 20165 VEGNR33. Nota utf-8 fyrir JSON (CSV utf-8-sig ef þarf). Endurreikna 13 raðir og hámarksfrávik; fyrra viðmið ~0,0039 km, mörk ±0,02 km. Leiðrétta aðferðarlýsingu og töflur samkvæmt raunúttaki.

3. **W3:** Leiðrétta ósamkvæma V1-málsgrein cc-report sem segir toHaveTitle enn til staðar. Rétt staða: h1 prófað, routeName notað í Helmet að kóðalestri; raunverulegt document.title UNKNOWN, fullyrðingin um vafrasönnun afturkölluð. Ekki staðhæfa sannaða orsök eða að vandinn sé pre-existing án sönnunar. Engin Helmet-/harness-viðgerð eða ný vafralota. Document title skal athuga við síðari eigandastýrða production-yfirferð beggja leiða; ekki telja það staðfest núna.

Afhenda stuttan v5-kafla í cc-report með keyrðri skipun/úttaki, niðurstöðu og takmörkunum. Aðeins þessi offline afleiðsla er nauðsynleg sannprófun; engin endurkeyrsla fullrar appsvítu/lint/build/Playwright fyrir þessar skjalabreytingar. Ef rétt útfærð afleiðsla víkur enn umfram samþykkt mörk, skrá nákvæma hindrun og stöðva; engin rannsóknar-/viðgerðarlota.

Engar breytingar á src/api/prófum, leiðargögnum, ETA, bakenda, cache, veitum, DB eða stillingum. Engin netköll/lyklar, ný rannsókn/hjálparkerfi/dependencies/subagents, commit/push/GitHub/deploy. Varðveita fyrri prompt/review-sögu og óskyldar breytingar. CURRENT CC report slóð óbreytt; CC_COMPLETE eftir skýrslu. Eigandi → Jonesy → Ripley. Production NOT_TESTED.

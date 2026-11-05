# #491 — samþykkt prompt v1: gagnahlið A eingöngu

Jonesy APPROVED með S1–S4, 2026-11-04; Ripley velur aðskilda A-afhendingu og vísvitandi STOP á óákveðnum leiðar-/punktavali. B-innleiðing er EKKI heimiluð með þessari útgáfu, jafnvel þótt einhver gögn reynist næg. Keyrsla bíður eiganda „Prompt approved“ til CC.

## Spurning, umfang og stöðvun

Lestu AGENTS.md, CLAUDE.md, docs/ai/README.md, CURRENT.md og prompt-review.md/Jonesy umferð 1. Færðu CURRENT í CC_IN_PROGRESS. Finndu hvað er raunverulega endurnýtanlegt úr varðveittum gögnum fyrir Reykjavík–Borgarnes og hvað vantar samkvæmt STOP-skilyrði #491. Aðeins offline lestur, afmarkaðir útreikningar og skjöl; engin ný veitu-/lykilbeiðni, dependencies, rannsóknarbiðlari eða appbreyting.

Endurnýttu sérstaklega:
- ticket-429/research-report.md, coverage.csv, source-register.md og samples/openmeteo-routeC.json. Leið C var PARTIAL án staðfestrar WFS-keðju; þrír færðarpunktar eru ekki full leið.
- ticket-483/samples/wfs-vegnr1-all.json (EPSG:3057), route-segments.csv, source-register.md, varðveitt harness 01/02 og úttak. Skjalið inniheldur raunverulega Vesturlands-geómetríu þótt #429 hafi ekki staðfest hana; ekki segja að öll geómetría vanti. Jonesy nefndi 903020037, 903030037, 814700037, 904690037, 904000037, 904010037, 804020037, 904040037 og 904050037 sem innihald — sannreyna í skránni, ekki samþykkja akstursröð af nöfnum. 904260037 þarf að athuga sérstaklega, ekki gera ráð fyrir að sé í Vegnr1-skrá.
- viðeigandi varðveitt #485 iteration-3 gögn um ISN93/WGS84 aðferð (EPSG 9802), aðeins ef þarf að sýna hnit úr því sem þegar er til. Stöðvar-/skiluð Open-Meteo-hnit ekki talin staðfestir vegpunktar.
- núverandi api/_lib/winterRoute/segments.js/eta.js og #486/#489/#490 lokaniðurstöður til að tengja gagnagöt við væntanlega virkni. Ekkert af því breytt.

## evidence-table.md

Tafla yfir upphaf/endastað, samfellu/stefnu vegkafla/IDBUTUR, spápunkta/hnit/CRS, lengdir/uppsafnaða fjarlægð og færðartengingu. Fyrir hvern lið: nákvæm heimild/skrá, VERIFIED (með þröngu umfangi), INFERRED eða UNKNOWN; hvaða samþykkisskilyrði #491 er hindrað og minnsta gögn/ákvörðun sem vantar. Rökstuddur kandidat er ekki staðfest leið.

S2: Hrá summa línulengda er ekki nothæf. Skrá VEGNR=1, NAKVAEMNIFERLIS/tier, VEGHLUTI (rampar 3/4, hringtorg 5, stefnubrautir 6/7), KAFLANR og stefnuval. Ekki láta suðurstefnu-göng standa fyrir norðurferð eða stuttan munnakafla fyrir öll göngin. EF reiknuð/valin leiðarlengd er lögð fram sem studd niðurstaða, endurskapa fyrst 13 varðveittar Vík-lengdir úr route-segments.csv með sömu aðferð sem stýring, gefa viðeigandi lengdarbil/næmi og áhrif á ETA-ceil fyrir viðkomandi punkt. Nota fyrirliggjandi aðferð, ekki smíða nýtt rannsóknarkerfi. Ef stýring eða pieces/stefna/hlutatengingar vantar, merkja lengd UNKNOWN og skýra hvað vantar, ekki eyða tíma í nýja viðgerðarlotu. Ekki reikna alla þá liði að óþörfu þegar óákveðnir endapunktar/punktar gera niðurstöðu ómögulega; sýna þá nákvæma gagnabirgðastöðu og hætta.

S3 ákvörðun Ripley: Engir nýir upphafs-/endapunktar eða Borgarnes-spápunktar eru frystir/heimilaðir hér. Ekki velja þá af handahófi eða með óheimilaðri midpoint-/hlutfallsreglu. Því getur A EKKI orðið PASSED nema skýr fyrri eigandasamþykkt með fullnægjandi heimildum finnist í fyrirliggjandi gögnum. Annars skrá vísvitandi A: BLOCKED og aðgreina (a) eigandastýrða skilgreiningu upphafs/endastaðar og valreglu punkta frá (b) tæknilegum gagnagötum sem eigandastaðhæfing ein getur ekki staðfest. Kandidatar úr varðveittri raunlínu mega vera sýndir sem INFERRED til að gera síðar ákvörðun nákvæma, en ekki ný full leið/ETA eða spáþekjufullyrðing. Engin ný customer-beiðni; raunveruleg spá/skálduð vikmörk fyrir ný hnit eru NOT_TESTED. Fyrirliggjandi validateForecast-regla ekki breytt eða gerð staðfest með tilbúnu prófi.

## Afhending og mörk

cc-report.md byrjar á **A: PASSED** eða **A: BLOCKED**, ásamt liðaskrá VERIFIED/INFERRED/UNKNOWN. evidence-table.md nægir; afmarkað staðlað offline útreikningsúttak aðeins ef það styður niðurstöðu beint. Ekki þróa hjálpartæki/prófakerfi eða hefja víðtæka leiðargeómetríurannsókn. Skila hnitum/auðkennum/tímum/hashes þeirra raunskráa sem niðurstaða byggir á eftir þörfum; engar nýjar formkröfur eða stór gagnaafrit.

Báðar niðurstöður stoppa í CC_COMPLETE með skýrsluslóð fyrir Jonesy→Ripley review. B úr prompt-review.md er framtíðarumfang, ekki keyrslufyrirmæli núna. Ef A PASSED þarf nýtt samþykkt B-prompt; ef BLOCKED þarf fyrst nákvæma eigandaákvörðun eða afmarkað vantað gagnastykki, ekki sjálfvirka rannsókn/innleiðingu.

Enginn appkóði, leiðarval, cache-refactor, ETA/hnit/reglu/gagnaveitubreyting, frontend/backend/config/DB eða ný dependency. git diff utan docs á ekki að breytast frá grunnstöðu. Þar sem CURRENT.md og ticket-490/result-review.md voru þegar breytt skal skrá baseline og varðveita fyrri efni; leyfðar nýjar breytingar aðeins docs/ai/tasks/ticket-491/ og nauðsynleg CURRENT-lífsferlisfærsla, ekki krefjast falsks hreins git diff. Engin subagents, commit/push/GitHub/deploy eða production-athugun. Ef A stoppar er #491 ekki innleiddur og ekki fullgerður.

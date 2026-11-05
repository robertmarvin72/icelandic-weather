# #491 — Reykjavík–Borgarnes og leiðarval

## Ripley — umferð 1, 2026-11-04

Til Jonesy review. Issue lesið: https://github.com/robertmarvin72/icelandic-weather/issues/491 . #490 CLOSED, eigandi segir GitHub lokað, production PASS skráð. Fyrirliggjandi ócommitaðar lokaskráningar CURRENT/ticket-490/result-review.md varðveittar.

### Staðreynd sem ræður framkvæmd

#429 research-report.md §leið C og coverage.csv staðfesta PARTIAL: færðarpunktar Kjalarnes 903030037, Hvalfjarðargöng 904690037, Borgarnes 904260037; **WFS-leiðargeómetría var ekki sótt/staðfest fyrir leið C**. Borgarnes stöðvarhnit/DATEX eru ekki sjálfkrafa vegpunktar. #483 var Rauðavatn–Vík-afmörkun, ekki staðfest Borgarnes-leið. Núverandi kóði er fastur við 13 kafla, sex punkta, fasta cache-færslu og fixed-six samanburð. Að þekkja stöðvanöfn er ekki sönnun fyrir fullri leið/vegalengd/IDBUTUR-röð. Þessi þekkta takmörkun má ekki hverfa í almennri „reuse“ fullyrðingu.

### Vöruspurning / nægileg sönnun

Er fyrirliggjandi, heimildastudd leiðarskilgreining næg til að bæta við annarri leið með sameiginlegu UI/útreikningum? Ef já: leiðarval og leiðarskipt gögn/ETA/samantekt/samanburður án leka. Ef nei: nákvæm gagnahindrun og minnsta vantaða staðfesting, engin ágiskun eða hálfvirkur nýr valkostur kynntur sem fullgerð leið.

### Fyrirhugað execution-prompt

Lestu AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md. Fylgdu CC-lífsferli þegar eigandi samþykkir. Innleiddu #491 aðeins að uppfylltu gagnahliði A; annars STOP-afhending.

**A — gagnahlið, áður en forritskóða er breytt:** Endurnýttu #429 research-report/source-register/coverage og viðeigandi varðveitt samples; #483 scope/route-segments/source-register; #485/#486 gögn og núverandi api/_lib/winterRoute/segments.js/eta.js. Leitaðu aðeins í fyrirliggjandi verkefnagögnum eftir viðbótarstaðfestingu, ekki nýjar veitubeiðnir, lyklar, pakkar eða rannsóknartól. Skila evidence-table.md: nákvæmur upphafs-/endapunktur (ekki „Reykjavík“ án skilgreinds vegtengipunkts), leið um Kjalarnes/Hvalfjarðargöng (ekki Hvalfjarðarhringur), fullir kaflar/IDBUTUR í akstursröð, hnit hvers spápunkts og uppruni, kaflalengdir/uppsöfnuð fjarlægð og reikniaðferð, færðartenging/auðkennaútgáfa. Aðgreina VERIFIED/INFERRED/UNKNOWN; ekki mælistöð í stað akstursleiðar, bein lína í stað veglengdar, Vík-gögn eða tilbúin midpoint-hnit. Hreinn offline útreikningur á raunverulega varðveittri viðeigandi geómetríu er heimill ef öll forsendugögn eru til og aðferðin skjalfest, en ekki ný leiðarleit eða endurbygging úr óstaðfestum punktum.

Ef nauðsynleg hnit, lengdir eða IDBUTUR-tengingar/röð vantar: **STOP áður en appkóði er breyttur**. Skrá nákvæmlega hvaða samþykkisskilyrði vantar stuðning, hvaða heimild var til og minnsta vantaða gagnastykki/staðfestingu. UNKNOWN er ekki heimild til að framleiða ETA eða auglýsa fulla leið. Ekki byggja leiðarval/refactor sem verður eftir án studdrar nýrrar leiðar. Engin ný umfangsmikil eða smá netrannsókn sjálfkrafa. Skila cc-report með BLOCKED/afhendingu hindrunar, CURRENT → CC_COMPLETE fyrir review; ekki kalla miða fullgerðan. Þetta er STOP-skilyrði #491, ekki ný rannsóknarkrafa.

**B — aðeins ef A staðfestir nauðsynleg gögn:**

1. Audit á lágmarks leiðarbundnum stöðum: segments/points/uppsafnaðri fjarlægð, route handler, roadFetch/forecastFetch/validateForecast/cache, winterRouteSummary/Comparison (fast 6), WinterRoute.jsx og prófum. Sýna afmarkaða breytingaáætlun í skýrslu. Engin almenn router-vél eða stór endurskipulagning; tvær fastar heimilaðar leiðarskilgreiningar sem gögn og sameiginleg UI/reikniföll. Núverandi Rauðavatn–Vík sjálfgefin; varðveita hnit/lengdir/ETA/gildi/70 km/klst./ceil og merkingu hennar.
2. /winter-route sami inngangur með merktu IS/EN-leiðarvali efst. Ein canonical routeId-staða stýrir titli, köflum, punktum, spá, ETA, #489 og #490. Fast allowlist routeId á bakenda; missing id notar Vík, óþekkt id gefur 400, ekki hljóðlausa Vík-birtingu. Engar frjálsar upstream-slóðir/hnit úr query. Opinberir heimildatenglar/freshness/lykilregla óbreytt. Litlar backend-breytingar til að styðja valda leið eru innan #491, sameiginleg forecast/scoring/auth-hegðun annarra apphluta er utan.
3. Við leiðarskipti fela/hreinsa gömlu leiðargögnin STRAX og sýna loading/ótiltækt fyrir nýju leið. Request/response bundið routeId; seinkað svar A má aldrei yfirskrifa B (abort eða request-id/cleanup samkvæmt núverandi React-venjum, prófa StrictMode). Cache/last-known/inflight lyklar á routeId fyrir spá og leiðarunnið færðarsvar; aldrei Vík-cache í Borgarnesi, líka við bilun og A→B→A. Þjóðarfeed má endurnýta aðeins ef leiðarsíun og upprunatímar rétt varðveitt; ekki byggja nýtt dreift cache-kerfi. Varðveita núverandi TTL/mörk/no-store og engar lykilslóðir í frontend/annálum.
4. Spá/ETA nota staðfesta punkta og vegalengdir valinnar leiðar og sömu reikniföll. Punktfjöldi er staðfestur fjöldi í viðkomandi leiðarskilgreiningu, ekki krafa um að finna upp sex Borgarnes-punkta. Aðlaga aðeins fixed-six heildarþekju/partial-texta/prófunarreglu að expectedPointCount leiðarinnar; ekki draga fjölda af styttu/villufullu svari. Fullur −2/0/+2 samanburður þarf öll þrjú mæligildi á ÖLLUM skilgreindum punktum valinnar leiðar við rétt ETA, annars ótiltækt. Fyrri dagamóta/jafntefli/null-vs-0/stale-reglur haldast. Hnit/punktaröð prófuð gegn staðfestum gögnum. Ekki breyta spáglugga eða sækja við tímaval/samanburðarsmell.
5. Við leiðarskipti má halda brottfarartíma aðeins ef hann er löglegur í nýjum gögnum; annars fyrsta tiltæka framtíðartíma eftir að rétta svarið kemur. Engin ný sjálfvirk ráðlegging. Núverandi select heldur fókus, comparison-takkar halda stöðugum fókus/aria-live innan nýrrar leiðar. Færðarlisti/tilkynningatalning aðeins IDBUTUR valinnar leiðar, lokuð/óþekkt/útrunnin/ferskleikamerking óbreytt, engin framtíðarfærð. Ekki endurflokkun opinberra kóða.
6. IS/EN nöfn/leiðarmerki/tilkynningaumfang/punktfjöldatexti uppfærð innan núverandi þýðingakerfis og útlits. Aðgreina skilgreindan upphafsstað frá víðu markaðsheiti „Reykjavík“. Engin kortasýn, ný gating/pricing eða almenn UX-endurhönnun.
7. Prófa routeId default/unknown, rétt leiðarröð/punktar/lengdir samkvæmt evidence, mismunandi route-cache/singleflight/stale, tvö routesvar í öfugri röð, A→B→A og bilun við skipti án gamla gagnaleka. Prófa ETA/#489/#490 á báðum leiðum, expectedPointCount vs vantar stak, null/0/útrunnið/óþekkt og engin ný fetch við tímaval. Regression fyrir óbreytt Vík-gildi og lyklaborð. Lykilvöntun í öllum umhverfum gerir enn núll customer/public-beiðnir; enginn raunlykill/netkrafa í prófum. Markviss Vitest + lint/build; núverandi Playwright/Chromium stubbar fyrir síma/skjáborð, leiðarval og samstillingu beggja leiða, loading/partial/error og fókus. Engin ný dependency/tólauppsetning.

**Afhending/mörk:** Stutt cc-report.md og evidence-table með heimildum/prófum/raunvafrasönnun eða nákvæmri A-hindrun. Núverandi ócommitaðar ticket-490 lokaskráningar varðveittar, ekki endurskrifaðar sem #491-kóði. Engin ný gagnaveita, Akureyri, kortasafn, ETA-hraðabreyting, leiðarleit/áhættulíkan, DB, entitlement/checkout eða backend-stækkun umfram val þessara tveggja leiða. Ekki commit/push/GitHub/deploy/subagents. Nauðsyn á nýrri dependency/víðara umfangi → nákvæm hindrun og eigandaákvörðun, ekki sjálfvirk rannsókn. CURRENT → CC_COMPLETE með skýrslu; eigandi → Jonesy → Ripley.

Production er NOT_TESTED þar til eigandi ákveður birtingu EFTIR yfirferð og staðfestir báðar leiðir á raunútgáfu. Engin birting/lifandi prófun heimiluð í þessu prompti; GitHub-lokun bíður þess skilyrðis. Ef A STOP á við er engin full innleiðingar-PASS, production ekki viðeigandi næsta skref.

### Review-áhersla

Gagnahlið A er mikilvægasta atriðið: staðfestingar #429 segja að samfelld Borgarnes-geómetría var ekki rannsökuð, ekki að þrír checkpoints séu næg leið. B-hlutinn er skilyrtur og má ekki keyra á ágiskunum. Jonesy verdict: PENDING.

## Jonesy review — umferð 1, 2026-11-04

Hlutverk: tæknilegur rýnir, útfærði ekkert, engin raunveita, enginn lykill, ekkert keyrt á vél eiganda. Stage staðfestur sem PROMPT_REVIEW (CURRENT, ticket-491), Approved prompt: (none), og stage helst PROMPT_REVIEW.

### Verdict: APPROVED með S1–S4 (allt fellanlegt í prompt án nýrrar rannsóknar)

Uppbygging prompts er rétt: gagnahlið A er skilyrði, STOP er skýrt og B er ekki leyft á ágiskunum. Fjórir hlutir þarf samt að laga áður en CC fær prompt, annars er líklegasta niðurstaðan annaðhvort ónauðsynlegt STOP eða að A „standist“ á veikum grunni. Ég gef einnig skýra viðvörun um hvað A mun líklega skila eins og prompt er skrifað (sjá S3).

### Hvað var athugað (merkt eftir uppruna)

**Sandbox / lestur (mitt, án nets, án lykils, python yfir staged skrár):**
- Las prompt-review.md (umferð Ripley), CURRENT, #429 `research-report.md` (leið C), `coverage.csv` (leið C línur), `samples/manifest.md` og `samples/openmeteo-routeC.json`, #483 `route-segments.csv`, harness 01/02 með varðveittu úttaki, `samples/wfs-vegnr1-all.json`, og `api/_lib/winterRoute/segments.js`.
- Staðfest úr #429: leið C er PARTIAL; engin WFS-geómetría sótt fyrir leið C; færðarpunktar Kjalarnes 903030037, Hvalfjarðargöng 904690037, Borgarnes 904260037 (Borgarnes-Hitara) með staðfest ástand í þeirri sýnatöku; Hvalfjarðargöng-hnit eru UNKNOWN, Borgarnes-hnit koma úr óvirkri Veðurstofustöð 142 (óvirk frá 1988). Staðhæfing Ripley um þetta stenst.
- Úr varðveittri `wfs-vegnr1-all.json` (#483, EPSG:3057, 996 eiginleikar, 74 IDBUTUR, VEGNR=1): hún **inniheldur raunverulega línugeómetríu** fyrir 903020037 Vesturlandsvegur, 903030037 Kjalarnes, 904690037, 814700037 „Hvalfjarðargöng til suðurs“, 904000037 Hvalfjarðargöng–Grundartangi, 904010037 Melasveit, 804020037 Hafnarfjall, 904040037 Borgarnes–Baulan, 904050037 Baulan–Norðurá. **904260037 (Borgarnes–Hitara) er ekki í skránni** (0 eiginleikar). #483 harness 01 sýnir varðveitt samliggjandi mörk 903020037 → 903030037 á 20,9 m, og að 914020037 og 903020037 vantar WGS84-geómetríu (aðeins ISN93).
- Hrá lengd er ekki nothæf: í sömu skrá hefur Kjalarnes 56 eiginleika (46 einstakar línur, VEGHLUTI 1, 3, 4, 5, 6, 7, KAFLANR f2/f5/f6) og samtals 79,65 km af einstökum línum, Vík-kaflinn 801100037 gefur 4,01 km á móti 1,34 km í #483 aðferðinni, Reynisfjall 47,75 km á móti 12,06 km. Aðferð #483 (VEGNR=1, NAKVAEMNIFERLIS tier 0, VEGHLUTI-hlutverkaval, hringtorg afmarkað) var **aðeins sannreynd fyrir Vík-keðjuna**; #483 skráir sjálft að lengd Reykjavíkur-framlengingar var „NOT COMPUTED“ vegna VEGHLUTI-vals við margra-ramp/hringtorg.
- Úr `openmeteo-routeC.json` (#429): beðið var um 64,2106/−21,7667 (Kjalarnes) og 64,55/−21,917 (Borgarnes) og skilað var 64,19549/−21,748016 (hæð 36 m) og 64,54352/−21,910202 (hæð 0 m), um 1,9 km og 0,8 km frá beiðni (reikningur minn); #429 merkir auðkenni „unconfirmed“. Þetta eru ekki vegpunktar.
- `segments.js` er fastur við 13 kafla, sex fryst hnit (#485), lengdir úr CSV og miðpunktsfjarlægð; engin hluti hans er leiðarbreytilegur í dag (staðfestir lýsingu Ripley).

**Ekki athugað af mér (NOT TESTED / UNKNOWN):** texti GitHub-miða #491 (gh GraphQL lokað), allur forritskóði umfram segments.js, kerfisprófanir, lint, build, vafri, git, Production, öll raunveita. Fullyrðingar um IDBUTUR-röð Kjalarness→Hvalfjarðargöng→Borgarnes eru mín ályktun af nöfnum og endapunktahnitum (INFERRED), ekki sönnuð tenging.

### Skilyrði

**S1 — MED — A skilar evidence-töflu sem enginn hefur rýnt áður en B hefst.**
Sem skrifað fer CC beint í B í sömu lotu ef A „stenst“. Saga #429/#483 (margar leiðréttingar á geómetríu- og lengdarfullyrðingum) sýnir að slík tafla þarf rýni áður en kóði byggir á henni. Tillaga (Ripley ræður): ef A stenst stoppar CC samt í CC_COMPLETE með evidence-table.md og cc-report, og B fer í sérstakan samþykktan prompt (v2). Annars að lágmarki: B hefst aðeins ef evidence-taflan sýnir allar kröfur A sem VERIFIED og stýrireikning (S2) sem stenst. Rök: B er stór (route-keyed cache, race-vörn, expectedPointCount), óafturkræf vinna á ósannreyndum gögnum er dýr.

**S2 — MED — nefna ákvarðandi varðveitt gögn og skilgreina lengdaraðferð með samanburði.**
Prompt nefnir „#483 route-segments/source-register“ en ekki skrána sem ræður úrslitum: `ticket-483/samples/wfs-vegnr1-all.json` ásamt harness 01/02. Án þess er hætta á rangri STOP-niðurstöðu („geómetría vantar“ er rétt um #429 en ekki um allt varðveitt efni). Auk þess verður evidence-table að: (a) tilgreina nákvæma pieces-valsreglu (VEGNR=1, NAKVAEMNIFERLIS, VEGHLUTI-hlutverk: rampar 3/4, hringtorg 5, stefnuháðar akbrautir 6/7, KAFLANR) og stefnuháð auðkenni (t.d. „til suðurs“ gildir ekki sjálfkrafa fyrir norðurferð; 904690037 er stutt sunnanmunni-kafli, ekki göngin sjálf, samkvæmt hnitum), (b) **endurskapa fyrst 13 þekktar Vík-lengdir úr route-segments.csv með sama kóða** (stýring) áður en reglan er notuð á Vesturland, (c) gefa lengd sem bil með næmi eins og #483 gerði, og (d) segja hvort bilið getur breytt ETA-klukkustund (ceil) fyrir einhvern punkt; ef já er fjarlægð UNKNOWN fyrir þann punkt. Fyrir 914020037/903020037 þarf ISN93 → WGS84 offline (aðferðin er varðveitt í #485 iteration-3, EPSG 9802), ekki net.

**S3 — MED–HIGH — upphafs-/endastaður og spápunktar eru hönnunarákvarðanir, ekki gögn sem finnast.**
Prompt bannar „tilbúin midpoint-hnit“ en krefst „hnit hvers spápunkts og uppruna“. Vík-leiðin hafði fryst sex punkta úr #485; fyrir Borgarnes er enginn slíkur frystur punktur til, varðveitt hnit eru aðeins stöðvar-/Open-Meteo-hnit sem eru ekki vegpunktar (sjá ofan), Hvalfjarðargöng-hnit UNKNOWN og Borgarnes-Hitara er utan Vegnr 1 skrárinnar. Eins og prompt er skrifað verður A því **nær örugglega STOP** á punktunum, án þess að CC hafi vitað hvað væri leyfilegt. Ripley/eigandi þarf að ákveða fyrir CC, án nýrrar rannsóknar: (a) endastað (hvaða vegtengipunktur telst „Borgarnes“, líklega endapunktur 904040037 eða mörk við Borgarnes–Hitara, og upphafsstað ekki bara „Reykjavík“), (b) reglu fyrir spápunkta, t.d. fjöldi og hlutföll eftir sannreyndri leið, reiknaðir offline á staðfestri línu og merktir DERIVED með reiknireglu, og hvort slík afleiðsla telst leyfð eða ekki, og (c) hvað á að gera um Open-Meteo skilahnit og `validateForecast` vikmörk fyrir nýja punkta, því staðfesting á nýjum punktum krefst raunbeiðni sem prompt bannar. Valkostur: samþykkja að A stoppi viljandi þarna og að ákvörðun um punkta verði eigandastýrð áður en B.

**S4 — LOW–MED — A-STOP verður að vera greinilega aðgreint frá PASS í skilum.**
Krafa: cc-report byrjar á einni línu „A: PASSED/BLOCKED“ með nákvæmri liðaskrá (hver A-liður VERIFIED/INFERRED/UNKNOWN), og ef BLOCKED skilar CC engum appbreytingum (git diff tómt utan docs/ai/tasks/ticket-491). Þetta stemmir við „engin full PASS“ í prompti en gerir rýni mína mælanlega.

### Athugasemdir (ekki skilyrði)

- **N1:** B-liðir 3–7 (route-keyed cache/single-flight, abort/request-id, expectedPointCount, −2/0/+2 þarf öll gildi á öllum punktum) eru vel skilgreindir og samræmast reglum #486/#489/#490. Ég fer ítarlega yfir þá í result-review ef B verður að veruleika.
- **N2:** Þessi leið er augljóslega mun styttri en Vík-leiðin (175 km; nákvæm lengd er ekki reiknuð af mér, INFERRED), svo „fyrsti klukkutími sjálfgefinn“ og full −2/0/+2 þekja gæti hegðað sér öðruvísi en á Vík; prófin ættu ekki að gefa sér Vík-mörkin (0–20 af 24).
- **N3:** #489 production PASS og #490 lokun eru frá Ripley/eiganda og ekki staðfest af mér. Production fyrir #491 er NOT_TESTED. Ekki lögfræðiráðgjöf.

### Næst

Ripley fellir inn S1–S4 (eða hafnar einstökum með rökum) og býr til approved prompt. Róbert sér um commit. Verdict hér að ofan kemur í stað „PENDING“.

## Ripley — afgreiðsla samþykkis, 2026-11-04

S1–S4 felld inn í approved-prompt-v1.md, A eingöngu. Tekinn kostur S1 að skila alltaf áður en B hefst. Varðveitt WFS/harness gögn nefnd og lengdarstýring aðeins nauðsynleg ef lengdarniðurstaða er lögð fram; ekki smíða rannsóknartól fyrir augljóst STOP. S3: vísvitandi BLOCKED nema fyrri skýr samþykkt finnist; ekki frysta nýja endapunkta eða punkta án eigandaákvörðunar. Kandidatar mega styðja nákvæma síðari ákvörðun, aldrei staðfest leið. S4 baseline-relative diff vegna fyrirliggjandi docs-breytinga, CURRENT-lífsferli leyfilegt. CURRENT → READY_FOR_CC. Enginn appkóði/net/lykill hér. Eigandi → CC „Prompt approved“.

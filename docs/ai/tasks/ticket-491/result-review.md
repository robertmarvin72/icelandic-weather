# #491 — Jonesy result review (umferð 1)

Dagsetning: 2026-11-04. Hlutverk: tæknilegur rýnir, útfærði ekkert. Efni: approved-prompt-v1.md (A-hlið eingöngu) gegn cc-report.md og evidence-table.md. Stage í CURRENT var CC_COMPLETE og passaði við skrárnar (approved-prompt-v1, cc-report, evidence-table til staðar).

## Niðurstaða: REVISE (afmörkuð, aðeins skjalaleiðrétting; **A: BLOCKED stendur**)

Meginniðurstaða CC er rétt og rétt sett fram: samkvæmt S3 í approved-prompt-v1.md getur A ekki orðið PASSED nema fyrri eigandasamþykkt fyrir upphafs-/endastað og spápunktareglu finnist, og hún finnst ekki. cc-report byrjar á „A: BLOCKED“ með liðaskrá, enginn appkóði var snertur (CC-eignað) og B var ekki hafið. Eftir stendur að evidence-table.md inniheldur þrjár fullyrðingar sem standast ekki þegar ég endurreikna úr sömu varðveittu skrám, og eina rangt greinda athugasemd um skráarkóðun. Þær breyta ekki A: BLOCKED, en taflan verður grunnur að eigandaákvörðun um hvaða IDBUTUR teljast leiðin, svo hún má ekki innihalda ósannaðar eða mótmæltar fullyrðingar sem staðreyndir. Villa 4 hér að neðan er mín eigin (EPSG 9802) og var upphaflega í prompt-yfirferð minni.

## Hvað var athugað (merkt eftir uppruna)

**Sandbox / lestur (mitt, án nets, án lykils, python yfir staged skrár; hash skrárinnar `wfs-vegnr1-all.json` stemmir við manifest #483, sha256 305f60d6…):**
- Las approved-prompt-v1.md, cc-report.md, evidence-table.md, CURRENT.
- Endurreiknaði úr `ticket-483/samples/wfs-vegnr1-all.json` fyrir IDBUTUR í evidence-table §3, úr `ticket-485/samples/wfs-extension-4326.json` og `native3057.json`, og úr #429 `openmeteo-routeC.json`.
- Staðfest óháð CC: 904260037 hefur 0 eiginleika í skránni; fjöldi eiginleika og tier/VEGHLUTI-bil fyrir hin IDBUTUR-in; 814700037 heitir bókstaflega „Hvalfjarðargöng til suðurs“; Open-Meteo hliðrun 1912,7 m (Kjalarnes) og 790,7 m (Borgarnes); mæld aðlægni 903020037 → 903030037 er 20,9 m; #485 span-0 fjarlægðir 5924,6 / 5931,6 / 7851,6 m og skýring á UNKNOWN (óstudd óvissumörk E, ekki „jafntefli“); engin skrá í #429 coverage um Borgarnes-vegpunkt (hnit eru stöð 142, óvirk frá 1988).

**CC-eignað, ekki endurkeyrt af mér:** `git status` (aðeins CURRENT.md og ticket-491 skrár, auk fyrirliggjandi ticket-490/result-review.md), `grep` yfir docs/ai/ að fyrri eigandasamþykkt, HEAD 54e6ae3a óbreytt, engin ný beiðni/dependency/subagent.

**Ekki athugað af mér (NOT TESTED / UNKNOWN):** appkóði, próf, lint, build, vafri, git, Production, raunveita, texti GitHub-miða. Ekkert keyrt á vél eiganda.

## Gallar (evidence-table.md)

**E1 — MED — „Raunlengd Kjalarness er nærri 6–7 km“ (§5) er ósönnuð og líklega röng.**
Engin varðveitt heimild er nefnd fyrir 6–7 km og talan er sett fram sem staðreynd. Úr sömu skrá (sandbox): 903030037 hefur 14 línur á hvert tier (−1, 0, 1, 2), og summa tier 0 er **20,70 km** (tier −1: 20,75, tier 1: 20,61, tier 2: 20,33); rammi þeirra er 11,3 km norður–suður og 7,4 km austur–vestur, svo bein lína er yfir 13 km. Hrá summa 82,40 km er því um fjórföld einn tier (82,40 / 4 ≈ 20,6), ekki „margfalt“ of há; sama hlutfall og Vík-kaflinn 801100037 (5,33 km hrátt / 4 ≈ 1,33 ≈ 1,34 í segments.js; tier 0 summa 1,35 km). Niðurstaða S2 („hrá summa ónothæf“) stendur, en ástæðan er fyrst og fremst tvítekning yfir fjögur tier, ofan á VEGHLUTI-hlutverkaval (rampar, hringtorg, stefnubrautir). Þetta er tilgáta mín úr tölunum, merkt INFERRED, ekki sannreynd keðjulengd; um lengd gildir áfram að hún er UNKNOWN fyrr en stýring (13 Vík-lengdir) er endurskapað.

**E2 — MED — „904690037 er stuttur munnakafli, ekki göngin sjálf“ (§3) er mótmælt af geómetríunni.**
CC tekur þetta af `STADARLYSING` („sunnanmunni Hvalfjarðarganga“). Úr skránni (sandbox): 904690037 hefur 4 línur á tier, tier 0 samtals **7,30 km**, rammi 4,6 km norður–suður × 3,7 km austur–vestur (um 5,9 km á ská); 814700037 „til suðurs“ er **5,42 km** á tier 0; 904000037 7,12 km. Þetta passar ekki við stuttan munnakafla. Hvaða auðkenni/hlutar tákna göngin og í hvora átt er því **UNKNOWN**, ekki „INFERRED: ekki göngin“. Þessa villu setti ég sjálfur fyrst í prompt-yfirferð (S2: „904690037 er stutt sunnanmunni-kafli … samkvæmt hnitum“), byggða á endapunktum fyrsta eiginleika aðeins (0,9 km); sú fullyrðing var röng og er hér dregin til baka. Prompt Ripley (v1) tók hana upp sem varúðarorð; varúðin um stefnu gildir áfram, fullyrðingin um „stuttan munna“ ekki.

**E3 — LOW–MED — liður 3 segir „engin önnur mæld aðlægni“, en hún er mælanleg með fáum línum úr sömu skrá.**
Prompt-v1 bað um að sannreyna í skránni, „ekki samþykkja akstursröð af nöfnum“. Með sömu aðferð og #483 harness 01 (lágmarksfjarlægð milli endapunkta, ISN93-metrar; sandbox): 903020037→903030037 20,9 m; 903030037→904690037 0,0; 814700037→904690037 0,0; 904690037→904000037 27,6; 904000037→904010037 0,0; 904010037→804020037 0,0; 804020037→904040037 0,0; en 903030037→814700037 910,1 m. Sjö af átta hoppum eru því samliggjandi innan 30 m. 904690037 tengist bæði 903030037, 814700037 og 904000037, svo stefna og hvaða hluti er „göngin“ er áfram óleyst (sjá E2); liður 3 ætti að vera „samliggjandi mælt, stefna/göng UNKNOWN“, ekki „röð eingöngu af nöfnum“. Þetta breytir ekki A-niðurstöðunni (1, 2 og 4 eru S3).

**E4 — LOW — athugasemd um skráarkóðun er röng (§3, cc-report).**
CC segir að `wfs-vegnr1-all.json` sé latin-1/cp1252 en ekki UTF-8. Í mínu sandbox les ég skrána sem gilt UTF-8 án villu (strict decode OK, 1 242 779 bæti, hash stemmir við manifest); „mojibake“ myndast aðeins við rangt val á afkóðun (til dæmis cp1252/latin-1 á Windows). Leiðrétta athugasemdina svo næsti prompt kenni ekki röng kóðunarbrögð.

**Eigin leiðrétting (EPSG 9802):** í prompt-yfirferð skrifaði ég að ISN93→WGS84 aðferðin væri „varðveitt í #485 iteration-3, EPSG 9802“. Það byggði ég á skráarnafni; skráin `epsg-method-9802.html` er 404-síða (`STATUS: 404` í capture-haus og manifest). CC hafði rétt fyrir sér og leiðréttingin í §6 stendur. Bætt við (sandbox): #485 geymir hins vegar **paraða** WGS84- og ISN93-geómetríu fyrir 903020037 og 914020037 (`wfs-extension-4326.json` og `native3057.json`, 100 og 72 eiginleikar í báðum), sem §1/§6 nefna ekki; hún sleppir þörf á ummyndun fyrir þessi tvö auðkenni og gæti verið samanburðargögn ef ummyndun yrði síðar nauðsynleg fyrir kaflana lengra norður.

## Samræmi við approved-prompt-v1.md

| Liður | Niðurstaða |
|---|---|
| cc-report byrjar á „A: BLOCKED“ með VERIFIED/INFERRED/UNKNOWN-skrá | Staðfest |
| S3: engir endapunktar/spápunktar valdir eða fundnir upp, engin midpoint-regla | Staðfest (lestur) |
| Leit að fyrri eigandasamþykkt | CC-eignað (grep), niðurstaða trúverðug; ég sá engan stað sem mótmælir |
| Ekki segja að öll geómetría vanti; 904260037 athugað sérstaklega | Staðfest (0 eiginleikar) |
| S2: engin hrá summa notuð sem niðurstaða; lengd UNKNOWN | Staðfest, með E1 um skýringarnar |
| Stefnu-/munnakaflavarúð | Hluti stenst, hluti rangur (E2) |
| Engar app-/netbreytingar, ekkert commit | CC-eignað, engin merki um annað í skýrslunni |
| Stoppa í CC_COMPLETE, B ekki hafið | Staðfest |

## Lágmarksleiðrétting (aðeins docs/ai/tasks/ticket-491/evidence-table.md og cc-report.md ef þarf)

1. E1: fjarlægja „6–7 km“ eða merkja það sem ósannað; skrá tier-tvítekningu sem líklega orsök hrárrar summu (INFERRED), án þess að gefa upp studda lengd.
2. E2: breyta stöðu „göngin“ í UNKNOWN með mældum hnitum/lengdum hér að ofan; fjarlægja „ekki göngin sjálf“.
3. E3: færa mæld hopp í töflu með merkingunni „samliggjandi mælt (≤30 m)“, og skrá að stefna/göng séu UNKNOWN.
4. E4: leiðrétta kóðunarathugasemd.
Engin ný rannsókn, engin ný veitubeiðni, ekkert breytt utan skjala. Ripley ræður hvort leiðréttingin er sérstök CC-lota eða er felld inn í næsta CC-verkefni (eigandaákvörðun um upphafs-/endastað og spápunktaregla); mín ráðlegging er sú fyrri, fljótleg, áður en taflan er notuð til ákvörðunar.

## Eftirstandandi takmörk (UNKNOWN / NOT_TESTED)

- **Production:** NOT_TESTED og á ekki við um A: BLOCKED.
- #491 er ekki innleitt og ekki fullgert; B er ekki heimilað. Eigandaákvörðun þarf um (a) upphafsstað, (b) endastað, (c) fjölda og valreglu spápunkta, og hvort Borgarnes-Hitara (904260037, utan Vegnr 1 skrárinnar) eða annað auðkenni á að tákna áfangastað.
- Texti GitHub-miða ólesinn af mér. Ekki lögfræðiráðgjöf. Engin commit/push/deploy.

## Ripley lokamat — 2026-11-04

**BLOCKED fyrir #491-innleiðingu; A-afhending með skjalaleiðréttingum samþykkt.** Rökstudd S3-stöðvun rétt. E1–E4 voru sjálfstætt sannreynd og leiðrétt af Ripley í ráðandi kafla efst á evidence-table.md og viðbót cc-report.md: strict UTF-8/hash, tier-0 lengdarsummur 20,702/7,298/5,417/7,124/1,346 km og átta endapunktapör. Engin summa túlkuð sem aksturslengd eða aðlægni sem stefnurétt leið. Paruð CRS-gögn tilgreind sem Jonesy-staðfest, ekki Ripley-prófuð. Prófasuite/lint/build ekki viðeigandi fyrir þessar skjala-/offline-athuganir. Engin ný CC-lota nauðsynleg eingöngu fyrir skjalaleiðréttingu.

Ólokið: vöruákvörðun um nákvæma upphafs-/endapunkta og punktafjölda/valreglu; tæknileg staðfesting leiðarstefnu/hlutavals og lengda að því loknu. Þessar tvær tegundir hindrana aðgreindar; samþykki getur ekki gert óstaðfest geómetríu að sannreyndri. B ekki heimilað, production ekki viðeigandi, GitHub #491 áfram opinn. CURRENT → BLOCKED samkvæmt repository-ferli; enginn forritskóði/raunnet/lykill/commit/push/GitHub/deploy. Næst þarf afmarkaða vöruákvörðun, ekki almenna rannsóknar- eða hjálpartækjalotu.

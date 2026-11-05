# #491 — Jonesy yfirferð á gagnatöflu eftir ákvarðanir eiganda (owner-scope)

Dagsetning: 2026-11-04. Hlutverk: tæknilegur rýnir, útfærði ekkert og gerði enga nýja rannsókn eða veitubeiðni. Efni: evidence-owner-scope-2026-11-04.md og geometry-inventory-owner-scope.json (skv. owner-scope-review.md), borið saman við varðveittu frumskrárnar. Stage í CURRENT var PROMPT_REVIEW og bendir á þessar skrár; stage helst óbreytt (þetta er gagnayfirferð, ekki execution-heimild).

## Niðurstaða: PASS sem gagnayfirferð; BLOCKED fyrir innleiðingu staðfest

Allar tölur, hnit, lengdir og hashar í töflunni og í JSON-sýninu stemma við frumskrárnar, og taflan segir hvorki að kandídatar séu akstursleið né að punktar séu veðurþekja. Engin leiðrétting á töflunni er skilyrði. Ég gef fimm ábendingar (O1–O5). O2 skiptir máli fyrir næstu ákvörðun: út frá lengdum töflunnar sjálfrar uppfylla fjórar tillögur P1–P4 ekki „dreifingu“ sem eigandi nefndi.

## Hvað var athugað (merkt eftir uppruna)

**Sandbox (mitt, án nets, án lykils, python yfir staged frumskrár):**
- SHA256 staðfest: `wfs-vegnr1-all.json` 305f60d6…, `wfs-chain-4326.json` 966848…, `wfs-extension-4326.json` 84e560e3…; allt stemmir við töfluna. Hash JSON-sýnisins sjálfs (`geometry-inventory-owner-scope.json`) er 4bb47672b60540c0a8b41a5153338ba2e79ace3d812f8173d21dc1837d693098; taflan vísar í „skrá/hash í skýrslu“ en nefnir hann hvergi (sjá O4).
- Öll tíu JSON-sýnin (IDFERILL 3025, 56002, 3796, 3740, 3757, 3758, 2876, 2819, 2816, 30401) borin saman við frumskrána: IDBUTUR, VEGHLUTI, KAFLANR, upphafs- og endahnit og línulengd stemma nákvæmlega við **tier 0** (NAKVAEMNIFERLIS=0) í öllum tilvikum. Hin þrjú tier (−1, 1, 2) hafa sömu endapunkta en aðrar lengdir (t.d. 56002: 5788,4 / 5783,4 / 5752,6 / 5662,9 m).
- Tier 0 heildarsummur: 914020037 7,515; 903020037 18,309; 903030037 20,702; 904690037 7,298; 904000037 7,124; 904010037 12,360; 804020037 15,000; 904040037 19,694 km. Allt stemmir.
- Rauðavatn: 1410010037 / IDFERILL 1436 tier 0 hefur native enda 367768,94;401667,09 og 365522,0175;402772,762, og WGS84-enda 64,09249225/−21,71204873 (eystri) og 64,10152894/−21,75906405 (vestari), eins og taflan segir. Fyrstu línuendar Vík-keðjunnar eru þannig staðfestir.
- Hnit 804020037 (3758) endi = 904040037 (2876) upphaf er nákvæmlega [360414,21; 452447,79]. 2876 endi = 2819 upphaf nákvæmlega. 2819 endi er 1,77 m frá punkti hringtorgs 30401 (VEGHLUTI 5, lokuð lína, upphaf = endir, 7 punktar) og 42,9 m frá upphafi 2816 (sú tenging er ekki nákvæm).
- Taflan segir að „stuttur munnakafli“ fullyrðingin sé röng: staðfest (sjá O1).

**Ekki athugað af mér (NOT TESTED / UNKNOWN):** hvað eigandi sagði sjálfur (ég sé aðeins endursögn Ripley, OWNER-REPORTED); texti GitHub-miða; staðsetning punkta á korti eða í raunheimi; ISN93→WGS84 ummyndun (ekkert nýtt reiknað); appkóði, próf, lint, build, vafri, git, Production, raunveita. Ekkert keyrt á vél eiganda.

## Gagnaflokkun: hvað er raunskrágagn

| Atriði | Staða |
|---|---|
| Native EPSG:3057 upphafs-/endahnit og línulengdir í JSON-sýninu (tíu hlutar) | VERIFIED sem varðveitt tier 0 frumgögn; JSON merkir þau sjálft „NOT_DRIVEN_ROUTE“ |
| WGS84-endar Rauðavatns (1436) | VERIFIED (varðveitt, paraðir við native enda) |
| Nákvæm samliggjandi pieces-keðja sem taflan nefnir (3758→2876→2819) | VERIFIED nákvæm aðlægni |
| „Norðurleið“ sem akstursleið, stefna, hringtorgsval, Rauðavatnstenging | UNKNOWN (taflan segir það rétt) |
| Lengdarsummur | Línuhlutasummur tier 0, ekki aksturslengd (taflan segir það rétt og bannar ETA-notkun) |
| P1–P4 | INFERRED tillögur, ekki staðfest veðurþekja (taflan segir það rétt) |
| WGS84 fyrir P1–P4 og Borgarnes-enda | Ekki til (rétt tilgreint sem óstaðfest) |

## Ábendingar

**O1 — göngin: taflan vanmetur það sem skráin segir, og sýnið vantar nálægan hluta.**
`STADARLYSING` á IDFERILL 56002 (904690037) er bókstaflega „Hvalfjarðargöng“; 3023 (939 m, upphafið er nákvæmlega endi 3025 og endir er nákvæmlega upphaf 56002) er „sunnanmunni Hvalfjarðarganga“; 3796 og hringtorg 42573 eru „norðanmunni Hvalfjarðarganga“. IDFERILL 2982 (814700037) er „Hvalfjarðargöng til suðurs“, 5417,5 m, með öfuga stafræna stefnu (frá norðri til suðurs), á meðan 56002 er stafrænt frá suðri til norðurs. Þetta er VERIFIED sem skráareigindi og stafræn stefna og er INFERRED stuðningur við að 56002 sé norðurátt, en umferðarstefna er ekki vottuð af því; taflan gerir rétt í að segja það. Munurinn á 5783 m (norður) og 5417 m (suður) sýnir að lengdir ólíkra stefna eru ekki skiptanlegar. 3023 vantar í JSON-sýnið en þarf í hvaða lengdarútreikning sem er milli P1 og ganga.

**O2 — MED — P1–P4 uppfylla ekki „dreifingu“ miðað við lengdir sem eru þegar í skránni.**
Eftirfarandi raðir hafa nákvæma aðlægni (bil 0,00 m nema 27,6 m milli 3796 og 3794) og tier 0 lengdir; öll lengdarsumma er línuhlutasumma á INFERRED samliggjandi röð, ekki aksturslengd, og tími miðast við 70 km/klst. sem núverandi ETA-regla (ekki nýtt gildi):

| Bil | Línulengd | Tími við 70 km/klst. |
|---|---|---|
| P1 (3025 upphaf) → P2 (3796 endi) | 10,76 km | um 9 mín |
| P2 → P3 (3757 upphaf) | 30,04 km | um 26 mín |
| P3 → P4 (2876 endi / 2819 endi) | 5,60 / 6,32 km | um 5 mín |
| P1 → P4 samtals | 47,12 km | um 40 mín |

Allir fjórir punktar liggja því innan um 40 mínútna aksturs, P3 og P4 innan 5 mín. Með núverandi „námunda upp í næstu klukkustund“ lenda P3 og P4 nær alltaf í sömu klukkustund og P1/P2 oftast í sömu eða aðliggjandi, og 40 mínútna bil getur í mesta lagi spannað tvær ólíkar námundaðar spáklukkustundir, svo fjórir punktar skila í reynd 1–2 sjálfstæðum klukkustundagildum. Auk þess er P3 (3757 upphaf) **eftir** Hafnarfjall-hlutana 47042 (4,13 km) og 3756 (6,42 km) sem liggja á undan í sömu röð, svo „Hafnarfjall“ nafnið lýsir þar enda fjallsvegarins, ekki honum miðjum. Bilið frá upphafi leiðarinnar að P1 er ekki mælt (Rauðavatnstengingin er óleyst), en beint norður–suður bil frá Rauðavatnsenda (N 402,8) að P1 (N 418,65) er 15,9 km (um 16 km í beinni línu), svo P1 er ekki nær upphafi en það. Þetta er ábending, ekki ákvörðun; Ripley/eigandi ráða hvort P3 færist (t.d. á hlutana á undan 3757 eða í Melasveit) og hvort fjórði punkturinn á að vera endapunkturinn sjálfur eða eitthvað í þeim hluta sem er enn ókannaður.

**O3 — Borgarnes-endir: skilgreina val sem reglu, ekki sem rannsókn.**
Taflan biður um „afmarkað opinbert staðfræðilegt viðmið“ fyrir aðkomu. Það getur orðið opin rannsókn sem prompt-reglur banna. Varðveittir kandídatar eru fáir og nákvæmir: lok 2876 ([360755,24; 453516,21]), lok 2819 ([361119,191; 454127,575]) og hringtorg 30401. Tillaga: eigandi/Ripley skilgreini regluna í orðum (til dæmis „fyrsta hringtorg á Hringvegi við inngang að Borgarnesi“) og tæknilega staðfestingin verður að bera regluna saman við þessi þrjú varðveittu hnit. Athugið að hnit 30401 er punktur á lokuðum hring, ekki miðja (meðaltal hnútanna er um 13 m norðar; hringurinn er um 125 m langur, þvermál ca. 40 m). 2816 (8,58 km áfram í norðaustur) byrjar 43 m frá enda 2819 og er ekki nákvæmlega tengt.

**O4 — LOW — JSON-sýnið vantar `tier`, hash í skýrslu og sumt sem taflan vísar í.**
Öll tíu sýnin eru tier 0, en JSON nefnir það hvergi; bæta við `"tier": 0` og hash skrárinnar (sjá ofan) í töfluna. IDFERILL 3740 er í sýninu án þess að nokkur tillaga eða lína í töflunni noti hann; 2982, 3023 og 42573 eru nefnd eða nauðsynleg en vantar. Þetta er hreinlætisatriði.

**O5 — LOW — Rauðavatn: tengingin er flóknari en „hringtorg og stefnubrautir“ í almennum orðum.**
Vestari endi 1436 (365522,0175; 402772,762) liggur 1,3 m frá hring 8677 (914020037, VEGHLUTI 5) og 37,4 m frá upphafi 1477 (VEGHLUTI 6) og 38,3 m frá enda 54723 (VEGHLUTI 7). Þetta eru þau stykki sem stefnurétt tenging (eftirstaða 1) þarf að velja milli. Þetta var ekki nefnt með auðkennum.

## Aðgreining: eigandaákvörðun til staðar og tæknilegar eftirstöðvar

**Eigandaákvarðanir sem nú eru til (OWNER-REPORTED í gegnum Ripley, ekki séð af mér):** upphaf er Rauðavatn eins og núverandi Rauðavatn–Vík; endir er aðkoma að Borgarnesi á Hringvegi (nákvæmur staður ekki ákveðinn, sjá O3); fjórir spápunktar valdir eftir vegköflum, veðurfarslegu mikilvægi og dreifingu. Þar með á „engin eigandaákvörðun“ úr fyrri umferð ekki lengur við, með fyrirvörum um endastað og vægi „dreifingar“ (O2).

**Fjórar tæknilegar eftirstöðvar töflunnar eru réttar og fullnægjandi sem listi**, með einni forsendu sem taflan nefnir ekki lengur: (1) stefnurétt tenging Rauðavatns við norðurleið (sjá O5), (2) nákvæmur Borgarnes-aðkomustaður, (3) aksturslengdir og punktafjarlægðir, (4) endanleg WGS84-hnit fjögurra punkta. Liðir (2) og (4) kalla báðir á ISN93→WGS84 ummyndun fyrir hluta (þ.e. 3025/3796/3757/2876/2819) sem ekki eru til í WGS84 í varðveittum skrám; aðferðarsíða EPSG 9802 er 404-síða (sjá fyrri yfirferð) og varðveitt eru aðeins paraðar WGS84/ISN93 skrár fyrir 903020037 og 914020037. Þessa forsendu þarf að nefna sem hluta af (2) og (4) svo næsta skref verði ekki hugmynd um „bara staðfesta“; ég legg ekki til nýja rannsókn, aðeins að aðferðin sé tilgreind.

## Eftirstandandi takmörk (UNKNOWN / NOT_TESTED)

- #491 er ekki innleitt og ekki fullgert; B er ekki heimilað. Production er NOT_TESTED og á ekki við.
- Engin lengd, punktur eða röð í þessari yfirferð er samþykkt sem akstursleið, ETA-forsenda eða veðurþekja.
- Ekki lögfræðiráðgjöf. Engin commit/push/deploy.

## Ripley — afgreiðsla O1–O5, 2026-11-04

PASS gagnayfirferð samþykkt, BLOCKED innleiðing stendur. O1/O4/O5 gagna-/heimildaskýringar felldar inn í evidence-owner-scope-2026-11-04.md; JSON útvíkkað í 18 tier0-raunhluta, nýtt hash þar. Sjálfstæður frumskráarlestur/útreikningur staðfesti viðbótarhluta, engin ný netnotkun. O2 P3=3757 upphaf dregið til baka sem endanleg tillaga; skoða þarf fyrr á Hafnarfjall-hlutum47042/3756, ekki tímahliðrun vegna sömu forecastHour (tveir staðir geta gefið ólík gildi á sama tíma). O3 regla afmörkuð við fyrsta Hringvegar-hringtorg við suðuraðkomu, 30401/2819 kandidat sem þarf að bera saman, ekki staðfest landfræðileg niðurstaða. CRS-umvörpun skráð sem skýr tæknileg forsenda.

Þetta APPROVED/PASS er á gagnayfirferð eingöngu, ekki samþykkt execution-prompt: approved-prompt er áfram none og engin READY_FOR_CC eða B-heimild stofnuð. CURRENT PROMPT_REVIEW áfram fyrir afmörkun næsta skrefs. Engin próf/lint/build nauðsynleg fyrir docs/raunskráasýni; enginn appkóði/veita/lykill/commit/push/GitHub/deploy.

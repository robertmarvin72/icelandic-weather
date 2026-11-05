# #491 — Jonesy result review, final validation (umferð 1)

Dagsetning: 2026-11-04. Hlutverk: tæknilegur rýnir, útfærði ekkert. Efni: `approved-prompt-v2.md` gegn `cc-report-final-validation.md`, `final-validation/evidence-table-final.md`, `route-data-candidate.json` og nýju WFS-svari. Stage í CURRENT var CC_COMPLETE og passaði við skrárnar.

## Niðurstaða: PASS með skilyrðum (aðeins gagnahlið; B er ekki heimiluð)

Gagnagrunnurinn undir CC-GO stenst sjálfstæða endurútreikninga mína: keðjan, bilin, lengdirnar og fjórir WGS84-punktarnir stemma. CC ofsagði þó á þremur stöðum (S1 samkeppnispróf, S2 tier-samanburður, S4 vikmörk) og „engin 1-vs-2-klst. tvíræðni“ stenst ekki sem almenn staðhæfing. Ég hef lokað þessum götum sjálfur í sandbox (tölur hér að neðan) svo ekki þarf aðra CC-umferð, en skilyrðin C1–C4 fara inn í B-prompt. **PASS er gagnadómur, ekki heimild fyrir umferðarstefnu og ekki heimild fyrir B.**

## Hvað var athugað (merkt eftir uppruna)

**Sandbox (mitt, án nets, án lykils, python yfir staged skrár; ekkert keyrt á vél eiganda):**
- sha256 nýju skránna stemmir við CC (`wfs-vesturland-4326.json` 5fb643b2…659f, `route-data-candidate.json` ec56c43c…3087).
- Nýja WFS-svarið: 132/132/132 eiginleikar, engin tvítekning, 6 IDBUTUR. Aðeins 3243 og 3798 eru ný (hliðarvegir, KAFLANR 01); hin 124 para 1:1 við native eftir IDFERILL+tier, 0 hnútafjöldamunur.
- Óháð LCC-andhverfa mín (GRS80, 64,25/65,75, 65, −19, FE=FN=500000) vs. 4326 frá þjóni: mesti munur 0,003 m yfir 1623 hnúta. Hnit upphafs og P1–P4 hjá CC stemma við mína andhverfu upp á 0,00 m.
- Keðjan, 29 stykki: lengd hvers stykkis endurreiknuð (0 frávik); bil endurreiknuð; summa stykkja 70,385 km, bil samtals 0,3955 km (16 fyrstu = 0,368 km eins og CC segir, + 27,6 m bil 3796→3794), samtals **70,780 km** (stemmir við CC).
- Vegástand: bæði varðveitt sýni (2026-10-28, 2026-11-02) hafa nákvæmlega 1 línu á hvert af 8 IDBUTUR keðjunnar, öll GREIDFAERT við töku. Sýnin eru 2+ daga gömul; þetta er gagnatenging, ekki ástandsfullyrðing.
- Appkóði (`winterRouteEta.js`, `segments.js`) óbreyttur skv. mtime á tæki.

**CC-eignað, ekki endurkeyrt af mér:** að S3-kallið hafi verið nákvæmlega eitt (2026-11-04T20:13:08Z; haus sýnir HTTP 200), að engin önnur net-/API-köll hafi verið gerð, og `git status`/HEAD. Ég sé aðeins afurðirnar.

**Ekki athugað af mér (NOT_TESTED / UNKNOWN):** appkóði, próf, lint, build, vafri, git, Production; texti GitHub-miða; samanburður við raunkort eða skilti; raunveruleg umferðarstefna/aksturheimild (H1 er áfram INFERRED); B er ekki heimiluð.

## Gallar og leiðréttingar á skýrslu CC

**F1 — MED — S1 samkeppnispróf ekki framkvæmt (CC viðurkennir það sjálft í evidence-table §2 „ógreind samkeppni“).** Ég keyrði það (sandbox, tier 0, allir eiginleikar í `wfs-vegnr1-all.json`, leyft hlutverk VEGHLUTI 1 (báðar áttir) og 6 (stafræn átt), útgangur → inngangur innan 50 m, 28 útgangar):
- 26 af 28 útgöngum hafa **nákvæmlega einn** leyfðan inngang. Mesta bil 41,45 m. Öll bil ≤ 50 m (stemmir við CC).
- 2 útgangar hafa tvo kandídata á 0,0 m: 3023→56002 og 56002→3796, þar sem 2982 („Hvalfjarðargöng til suðurs“, 814700037, N→S) deilir hnútum. CC leysti þetta með heiti/stefnu 2982 og útilokaði til að forðast tvítalningu. Það var heimilað í prompti (lína 13) en er **heitisrök, ekki mælt rök**; sjá C1.
- Útgangar með hringtorg (VEGHLUTI 5) innan 50 m: 10 (1734, 25924, 10241, 2793, 2792, 2791, 10245, 2489, 49284, 42573). Hjá 9923→9925 er hringur 25924 jafnnálægur (34,2 m) og 9925. „Nálægasti leyfði inngangur“ ræður því ekki þar; það er hlutverkasían sem útilokar hringi, ekki fjarlægð.
- Niðurstaða: ekkert BLOCKED-ástand finnst, en „allt einhlítt“ er aðeins rétt **að teknu tilliti til hlutverkasíu og heitisraka**, ekki sem hrein fjarlægðarregla.

**F2 — MED — Hringtorg og inn-/útstig ekki metin (prompt lína 13 og S1 krefjast þess).** Hringirnir eru slepptir með beinu bili 30–40 m. Hringir á leiðinni eru 107–151 m að ummáli (lokaðir, ekki miðja). Bein bil ná ekki yfir boga hringsins; raunveruleg yfirferð um hring gæti verið um hálfur hringur á hring (u.þ.b. 50–75 m hver, **INFERRED stærðargráða, ekki mæld**) og leiðin fer um allt að 10 hringi. Áhrif á flokka punkta: P1–P3 (23,6/34,4/53,9 km) haldast langt undir 70 km, þannig að ekkert þeirra getur skipt um forecastHour. Hringbogar geta aðeins lengt P4 (öruggari yfir 70 km), ekki stytt. Tilgreint sem UNKNOWN fyrir lengd, ekki sem galla á flokkun.

**F3 — MED — S2 tier-samanburður vantar (prompt S2 krafðist hans).** Mínar tölur (sandbox, planar ISN93, 29 stykki, allar tengingar og 37,4 m upphafsbil; haversine = WGS84 úr `wfs-vesturland-4326` + #485 `wfs-extension-4326`, R=6 371 008,8 m, bil planar):

| tier | planar stykki | planar + bil | haversine stykki | haversine + bil |
|---|---|---|---|---|
| −1 | 70,451 | 70,847 | 70,237 | 70,633 |
| **0 (punktmat)** | 70,385 | **70,780** | **70,171** | **70,566** |
| 1 | 70,052 | 70,447 | 69,839 | 70,235 |
| 2 | 68,851 | 69,246 | 68,642 | 69,037 |

forecastHour á P4 (≤70 km → „+1 klst.“, >70 km → „+2 klst.“): tier −1 og 0 gefa „+2 klst.“ undir öllum fjórum mælingum. Tier 1 gefur „+1 klst.“ aðeins ef bil eru ekki talin og haversine notað (69,839). Tier 2 gefur „+1 klst.“ í öllum dálkum. Skekkjumörk tier 0 gagnvart 70 km: **0,17–0,78 km (0,24–1,1 %)**. CC sagði „engin 1-vs-2-klst. tvíræðni fyrir það val sem notað er“; það á við um tier 0 og tier −1, ekki um tier 1/2 né um lengdarreglu án bila. Ekki BLOCKED (S2 segir að straddle sé það ekki sjálfkrafa), en þetta er **raunveruleg næmni sem Ripley verður að sjá**.

**F4 — LOW-MED — Endapunktsval ræður flokk undir haversine.** CC bar 2876 (70,061 km planar) saman við 2819 (70,780) og taldi báða í „+2 klst.“. Undir haversine-hlutfalli leiðarinnar (0,99696) er 2876 ≈ 69,85 km → „+1 klst.“, en 2819/30401 ≈ 70,57 → „+2 klst.“. Endareglan (fyrsti VEGHLUTI 5 eftir 42573 = 30401, inngangur 2819, 1,77 m) stendur og er ákvörðuð fyrirfram, svo valið er réttlætt; en „báðir í sömu fötu“ er rangt sem almenn fullyrðing.

**F5 — LOW-MED — S4 vikmörk ekki uppfyllt með aðferð CC.** S4 setti ≤0,02 km mun á stykki gegn CSV. CC notaði planar ISN93 (mismunur +0,006…+0,103 km, samtals 176,260 vs. 175,64) og skýrði með kvarðastuðli — sú skýring er rétt (mitt hlutfall fyrir nýju leiðina 0,99696 passar við „~0,35 %“) — en stýringin var þar með samanburður á **tveimur ólíkum aðferðum**, ekki endurskapandi stýring. Ég keyrði rétta stýringu: haversine yfir WGS84 tier 0 úr `wfs-chain-4326.json` fyrir 13 Vík-IDBUTUR gegn `route-segments.csv`: **mesti munur 0,004 km** (≤ 0,02, S4 uppfyllt). Aðferð CSV er því endurskapanleg; nýja leiðin getur notað sömu aðferð (haversine, tafla F3) án frekari gagnaöflunar. Stýringin gildir áfram aðeins um línusummu, tier-val og hringtorgsfjölda, **ekki** um stefnukeðjuna (eins og S4 segir).

**F6 — LOW — Fjölnotkun orðalags.** „Allir 15 útgangar ≤41,45 m, enginn tvírætt“ (skýrsla, liður 2) á við um tilgátu H1 og hlutverkasíu, ekki sannaða stefnu; CC merkir H1 sem INFERRED og það stendur. P3 (47042 upphaf, 53,904 km) er val CC (INFERRED) — innan samþykkts svæðis 47042/3756, ekki sannað sem æskilegt; P1–P3 gefa öll „+1 klst.“ og P4 „+2 klst.“ (prompt: ekki krefjast eigandaákvörðunar vegna sömu forecastHour).

**Jákvætt (staðfest):** 29-stykkja keðjan, bilin og hnitin eru rekjanleg og reiknuð rétt; WFS-svarið er heilt og parast við native; Borgarnes-endareglan skoðuð tæmandi yfir öll 6 IDBUTUR (aðeins 30401 eftir 42573; 1,77 m frá hringpunkti, ekki miðja); aðeins eitt netkall; enginn appkóði breyttur; H1 aldrei kallað sannað.

## Skilyrði fyrir B-prompt (hvert bundið við samþykkisskilyrði)

- **C1** (S1): B-prompt festi hlutverkasíu (1, 6; útilokun 3/4/5/7/8) og skráðan úrskurð fyrir 2982-tvíræðnina sem **handvirka, nefnda undantekningu** (heiti „til suðurs“ + stafræn stefna), ekki sem „nálægasti inngangur“.
- **C2** (S1/lína 13): B-prompt segi beinlínis hvort hringbogar eru taldir í ETA-lengd eða aðeins sem skráð bil; fram að því er hringlengd UNKNOWN. Ekki áskilið að B reikni hringstefnu nema ákveðið verði að telja bogana.
- **C3** (S2): B-prompt festi **lengdaraðferð** (haversine WGS84 eins og `route-segments.csv`, stykki + skráð bil eða án bila) og viðurkenni að P4 er innan 0,24–1,1 % frá 70 km-mörkum; tier 0 er skráð punktmat, tier 1/2 skráð sem næmi. Ákvörðun um þetta er Ripley/eiganda; ég mæli ekki með að breyta ETA-reglunni.
- **C4** (S4): stýring í B/prófum noti sömu aðferð og CSV (haversine, ≤0,02 km á stykki; ég fékk 0,004). Ekki nota planar-til-CSV samanburð sem stýringu.

Engu bætt við umfram þessi skilyrði; hvert er tengt S1, S2 eða S4 í samþykktum prompti.

## Mörk þessarar yfirferðar

Sandbox-útreikningar mínir sýna samræmi gagna, ekki réttmæti veganets, umferðarstefnu eða lagalegt gildi. Vegástandssýnin eru frá 2026-10-28 og 2026-11-02 (ekki fersk). Production NOT_TESTED. B er ekki heimiluð af þessum dómi. Næsta skref: Ripley lokamat; Róbert commit-ar sjálfur.

## Ripley lokamat — 2026-11-04

**PASS á afmarkaðri gagnayfirferð; skilyrt GO til undirbúnings B-prompt, ekki óskilyrt GO á sannaðri akstursleið eða heimild til B.** Jonesy gagnaprófun samþykkt með C1–C4. Sjálfstætt staðfest hér: raw-WFS hash 5fb643b23ac83dc0df47e1ff5c482adb78d7a99bc567028133d8bfd6b140659f, 132/132/132 eiginleikar; candidate hash ec56c43cbaf207bf1958b7b6e3bbfdad51c7dbb63bb50ff84bcd49d71f143087, 29 hlutar og fjórir punktar. Engin ný netbeiðni/lykill. Nákvæmar lengths/gap/CRS/samkeppnistölur eru sjálfstæðar Jonesy-sandbox-niðurstöður, ekki endurreiknaðar af Ripley hér; netframkvæmdarfullyrðingar eru CC-eignaðar. Apppróf/lint/build ekki viðeigandi fyrir þessi gögn.

Leiðréttingar F1–F6 ráða yfir CC-frumskýrslu: ekki „allt einhlítt“ án hlutverkasíu og nefndrar 2982-undantekningar; hringbogar ekki reiknaðir sem akstur; tier0 >70km niðurstaða er ekki tier-/aðferðaráháð; planar samanburður við haversine CSV var ekki gild endursköpun. Jonesy haversine-stýring max0,004km stenst 0,02km, að teknu tilliti til sömu tier-/hlutverkasíu. Tölurnar 70,780km planar og 70,566km haversine+native-bil eru tvö ólík mæligildi, ekki tvær óháðar fullar sannprófanir.

### Ákvarðanir/takmörk sem B-prompt verður að bera með sér

- C1: föst 29-stykkja kandidatkeðja, hlutverk1/6 með nefndri útilokun2982 vegna „til suðurs“/öfugrar stafrænnar stefnu; H1 áfram INFERRED, ekki vottun um umferðarheimild. Ekki almenn nearest-neighbour leiðarleit eða ný sönnun af stysta stíg.
- C2: tillaga Ripley fyrir samþykki B er að halda fyrirliggjandi bilum sem sýnilegri lengdarnálgun, hringbogar ekki nýreiknaðir; ekki kalla það nákvæma aksturslengd. Ef eigandi/B-review krefst stefnurétts boga eða sannreyndrar akstursleiðar er sú forsenda enn UNKNOWN og B ekki keyranlegt á því grundvelli. Ekki fela þessa takmörkun með því að færa hana eingöngu í framtíðarskjöl.
- C3: tillaga Ripley fyrir samþykki B er haversine-WGS84 tier0 línusumma + sérstaklega varðveitt native-3057 tengibil, sama línulengdaraðferð og Vík CSV. Afleidd punkt-km þarf að reikna með ÞEIRRI reglu úr varðveittum gögnum áður en appconfig er sett; ekki afrita planar km úr candidate óbreytt. P4 nálægt70km, tier-næmi getur gefið +1/+2klst.; skrá báða möguleika og valið punktmat, óbreytt70km/klst./ceil. Gögnin eru tillaga að nálgun fyrir upplýsingasýn, ekki staðfestur aksturstími. Ekkert nýtt rannsóknarverkefni eða netkall þarf fyrir endurreikning sömu gagna.
- C4: próf/stýring B endurnýti haversine gegn13 CSV-köflum og <=0,02km, ekki planar-samanburð. Stýring vottar línulengd/tier/hlutverkasíu, ekki stefnu. Varðveita Vík-reglur/gögn óbreytt.

Upphaf/endir/fjórir raunlínupunktar og coarse-IDBUTUR-gagnatenging eru tilbúin til B-umfjöllunar. Nákvæm leiðarstefna/hringakstur eru **ekki fullstaðfest** þótt gagnayfirferð fái PASS. Ekki endurskrifa eldri samþykkiskröfu sem hún hafi verið tæknilega uppfyllt: B-prompt þarf að kynna ofangreinda nálgun og eigandasamþykki hennar áður en framkvæmd hefst. Engin B-keyrsla, appbreyting eða production hér.

CURRENT → CLOSED fyrir gagnayfirferðarlotu, #491 feature áfram opið/óinnleitt. Næst er sérstakt B-prompt fyrir Jonesy-review og eigandasamþykki á þessum nálgunum, ekki önnur almenn rannsóknarlota. Engin commit/push/GitHub/deploy.

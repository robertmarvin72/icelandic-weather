# #500 — Samþykkt framkvæmdarprompt v1: Hveragerði–Vík

## Ripley — 2026-11-14; Jonesy APPROVED án skilyrða

Jonesy samþykkti í umferð 1 án skilyrða. Keyranlegt aðeins þegar CURRENT vísar hingað í READY_FOR_CC og eigandi sendir nýtt „Prompt approved“. Eigandi bað um næsta prompt til að tengja 56-staða vöruskrána við vegakerfið. Fyrsta framkvæmdarlota tekur **Hveragerði, Selfoss, Hellu, Hvolsvöll og Vík**, þar sem fyrirliggjandi Rauðavatn–Vík-gögn nýtast best. Þetta velur vinnuröð, ekki minni release-lista: allir 56, þar með taldir Vestfirðir/Snæfellsnes/Reykjanes, halda óbreyttum heitum/ID og áframhaldandi þekjumarkmiði. Aðrir sex Suðurlandsstaðir bíða síðari lotu; enginn er útilokaður.

### Markmið

Afhenda raunverulegar, rekjanlegar aðkomutillögur þessara fimm staða og **sameiginlega vegkafla milli þeirra**, svo næsta leiðarvélarvinna geti notað gögnin. Ekki önnur afritastaðaskrá eða almenn úttekt. Akstursaðgengi þarf heimild, ekki aðeins línusnertingu; þar sem það vantar er tengingin áfram unsupported. Aðkomutillaga er ekki sjálfkrafa eigandaval.

### Lesa fyrst og staðfesta data-flow

AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md. Síðan:

- server_data/winter-route-places.json og api/_lib/winterRoute/places.test.js; nationwide-owner-scope.md og lokamat í nationwide/result-review.md undir ticket-500. Engin ný staðafærsla eða alias/ID-breyting.
- src/lib/winterRouteRoutes.js, api/_lib/winterRoute/routes.js og segments.js: núverandi fastar leiðir og færðarauðkenni. Þau eru endurnýtingargrunnur, ekki ný sönnun um leyfða umferðarstefnu. Engar runtime-breytingar í þessari lotu.
- docs/ai/tasks/ticket-493-access-points/place-access-status-v3.csv og samples/v3/place-node-references-v3.json. Selfoss (2138), Hella (3591), Hvolsvöllur (3593) hafa tvær retained endatillögur með óleystu vali — ekki velja aðra þegjandi. Vík hefur retained START á 3849, en er ekki eigandavalinn aðkomupunktur í nýju vöruskránni. Hveragerði var NODE_UNDETERMINED, ekki sannað gagnaleysi.
- ticket-493-place-network/samples/road-links.csv, chain-walks-v4.json og viðeigandi frumskrár; ticket-483/samples/wfs-vegnr1-all.json og wfs-chain-4326.json. Fylgja aðeins tilvísunum fyrir þennan veggang. Endurnýta tier/OBJECTID/pörun; ekki summa fjóra precision-tier eða nota IDBUTUR eitt sem geometry-heimild.

### Framkvæmd

1. Finna raunverulegar aðkomur á fyrirliggjandi veggangi. Fyrir hverja af fimm færslunum: nákvæmur punktur á heimildalínu, lat/lon/CRS, IDFERILL/IDBUTUR, tier/OBJECTID, staðarheiti/aðkomulýsing og source-slóð/SHA. Gögn mega ekki vera sveitarfélagamiðjur, veðurpunktar eða hnit af hönnunarmynd. Ef WGS84 er ekki í retained gögnum, ekki birta native x/y sem lat/lon eða giska á umbreytingu.
2. Meta og leggja fram **eina ráðlagða aðkomutillögu fyrir hvern stað**, með stuttri ástæðu. Fyrir þrjá tvíkandídatana segja báða kosti og af hverju mælt er með öðrum. Vörureglan er einn skýr staðarvalkostur með nafngreindri aðkomu og leiðartengingu í hvora átt sem hægt er að styðja, ekki endilega miðbær eða næsti hnútur. Fyrri óvalin tillaga er ekki samþykkt. Ef heimildir greina ekki milli kosta, segja það í sama litla ákvörðunaryfirliti; ekki búa til regluna eftir hentugleika.
3. Útbúa eina sameiginlega kaflaskrá fyrir vegganginn með stöðugum kafla-ID, raðaðri raunverulegri geometry og staða-/innri tengihnútum. Nota einfalt JSON, ekki almennt graf-framework eða sérleið fyrir hvert staðapar. Klippa við raunverulega valda kandídatpunkta án tvítalningar kafla; varðveita mæld bil og takmarkanir fremur en að teikna tilbúna brú sem veg. Endurnýta geometry milli nágrannastaða, ekki afrita sömu leiðina fyrir hvert par. Binda færðarauðkenni við notuðu stykkin og merkja ef færðarauðkenni er grófara en geometry.
4. Aðskilja staðarval, geometry og leyfða akstursstefnu/aðgengi. Skrá hvora átt sérstaklega; ekki gera stafræna línustefnu að akstursheimild eða viðsnúning að sönnun tvístefnu. Engin núverandi opnunarstaða leidd af gömlu færðarsýni. Staðfest varanleg vegtenging getur síðar borið tímabundna lokun án sjálfvirkrar hjáleiðar.
5. Nota afmörkuðu opinberu heimildaleitina hér að neðan **aðeins ef hún leysir tiltekið gat** í þessum fimm staða-/vegtengingum. Stöðva leit þegar fullnægjandi heimild finnst. Ef ekki, skrá nákvæmlega hvaða staðreynd vantar, ekki endurtaka almennt „EXACT_GAP“ eða hefja nýtt rannsóknarkerfi.

### Yfirfarnar leiðbeiningar ND1–ND3 (engin aukavinna)

Hveragerði-tillaga úr 2135/heiti „Selfoss-Hveragerði“ er NAME_MATCH_INFERRED, ekki staðfest bæjaraðkoma; 2117 er merkt austurakbraut og 34,75 m samskeytabil er ekki leyfð vegbrú. Við samanburð Selfoss/Hellu/Hvolsvallar skal nefna 0,0 m snertingar og 30,1/32,63 m bil þar sem við á, án þess að láta bilið ráða staðarvali eitt og sér. Austurgeometry cw_long fer þessi stykki öfugt við geymda vesturstefnu; það sannar ekki leyfða akstursstefnu í hvora átt. Retained WGS84 er til fyrir notaðan gang; enginn nýr umbreytingarkóði þarf.

### Ný heimildaleit, aðeins eftir samþykkt framkvæmdarprompt

Eftir Jonesy-samþykki og nýtt eigandahandoff „Prompt approved“ má gera mest **þrjár vefleitir og sex síðu-/skjalaopnanir**, bundnar við opinber lén `vegagerdin.is` og `umferdin.is` og undirlén þeirra. Eingöngu um aðkomur/akstursstefnu á vegganginum Hveragerði–Vík. Engin ný WFS-GetFeature/DescribeFeatureType öflun, landsskönnun, ný routing-þjónusta, innskráning, lyklar eða dependency. Heimildaleitin er til að leysa lýsingu/aðgengi, ekki leysa af hólmi retained geometry með nýrri kortaþjónustu.

Leitarniðurstöðubrot eitt nægir ekki. Skrá URL, titil, aðgangsdag og stutta nákvæma staðreynd sem heimild styður; aðgreina beina heimild frá ályktun. Opinber grein sem aðeins nefnir veginn eða vetrarþjónustu sannar ekki allt aðgengi í báðar áttir. Ef þessi mörk duga ekki til nauðsynlegrar öflunar, varðveita gagnlegan heimilaðan árangur, segja eina nákvæma ástæðu og stoppa áður en ný tegund öflunar hefst. Engin fleiri köll sjálfkrafa og enginn nýr HTTP-client.

### Afhending og uppfærsla vörugagna

- Ný `server_data/winter-route-south-connections.json`: aðeins þessi sameiginlegu kafla-/kandídatgögn, aðskilin APPROACH_CANDIDATE/OWNER_SELECTION_PENDING og geometry/access-staða. Ekki merkja supported ef annað af eigandavali/nauðsynlegri tengingu/aðgengisheimild vantar.
- Í server_data/winter-route-places.json má aðeins uppfæra connectionStatus/provenance og bæta candidate-reference við þessar fimm færslur. Name/id/region/order/aliases allra 56 óbreytt. Coordinates/approach þessara fimm haldast null uns eigandi hefur samþykkt tillöguna; kandídathnit eru aðeins í nýju tengiskránni og skýrt merkt. R1/E1/S2/C óbreytt. Pending-gat hverfur ekki bara af því tillaga er til.
- Ein stutt ákvörðunartafla í `docs/ai/tasks/ticket-500/south/evidence.md`: fimm staðir, ráðlögð aðkoma, heimild, valkostur ef við á, það sem vantar og hvort gögn geti farið til #501 eftir eigandaval. Eigandi fær þannig **eina sameiginlega afgreiðslu**, ekki fimm ný prompt.
- `south/cc-report.md`: hvað varð nýtt/rekið áfram og hvað er enn óleyst. Engin löng endursögn fyrri rannsóknarlota.

### Markviss próf og viðtaka

Ný `api/_lib/winterRoute/southConnections.test.js` og nauðsynleg afmörkuð aðlögun places.test.js: nákvæm 56-staða auðkenni/listi stendur, aðeins fimm leyfðar færslur fá candidate-reference; engin kandídatkoordinata laumast í samþykktan staðarpunkt. Staðfesta nýja skrá gegn raunverulegum notuðum frumgögnum: endapunktar á réttum stykki/tier, raðaðir kaflar án tvítekningar, bil sýnileg, öfug röð samræmist geometry en hækkar ekki aðgengi.

Neikvæð tilvik: rofin tenging, tvítalinn kafli og tilraun til supported án nauðsynlegrar heimildar/eigandavals. Prófin lesa afhentu skrárnar og kalla raunverulegu athugunina, ekki aðeins staðhæfa að eigin mutation sé ólík. Lítil staðbundin prófhjálparföll nægja; engin almenn validation-umgjörð eða hundruð mutation-prófa. Keyra bæði snertu gagnaprófasöfnin og lint fyrir nýja/breytta JS-prófskrá. Ekki frontend-suite/build/vafri þegar runtime breytist ekki.

Viðtaka: afmarkaður sameiginlegur veggangur með rekjanlegum aðkomutillögum eða nákvæmum hindrunum fyrir fimm staðina. Skýrt segja hvort niðurstaðan sé aðeins kandidat eða raunverulega leiðarvalhæf — rétt gagnavinna telst ekki full tilbúin akstursleið án staðreyndanna. Ef ekkert nýtt verður hægt að staðfesta eða leggja til út frá tiltækum heimildum, skila hindrun fremur en annarri afritaskrá með sömu götum. Stoppa þegar heimilaða lotan er afgreidd; ekki stækka í alla Suðurlandsstaði eða landið.

### Mörk og lifecycle

Leyfðar skrár: tvær tilgreindar server_data-skrár, southConnections.test.js, nauðsynleg aðlögun places.test.js, ný skjöl undir ticket-500/south/ og CURRENT.md. Eldri raw/ledger/samþykkt prompt/yfirferðir óbreytt. Engin UI/API-tenging, #501-leiðarvél, veður-/skorunar-/ETA-/FreePro-/greiðslubreyting, delegation, commit/push, GitHub-birting/lokun eða deploy. Allir 56 verða áfram í vöruskránni.

Framkvæma aðeins approved-prompt úr CURRENT í READY_FOR_CC eftir eiganda „Prompt approved“. CC notar CC_IN_PROGRESS → CC_COMPLETE og report-slóðir CURRENT. Jonesy yfirfer þetta svæðisverk, ekki aftur réttmæti samþykkta 56-listans. Engin valfrjáls herðing eða ný sjálfvirk lota; þriðja review-umferð þarf sérstaka eigandaákvörðun samkvæmt README.

# #500 — Fyrsta svæðislota: Hveragerði–Vík

## Ripley initial prompt — umferð 1, 2026-11-14

Til Jonesy-yfirferðar, ekki framkvæmdarheimild. Eigandi bað um næsta prompt til að tengja 56-staða vöruskrána við vegakerfið. Fyrsta framkvæmdarlota tekur **Hveragerði, Selfoss, Hellu, Hvolsvöll og Vík**, þar sem fyrirliggjandi Rauðavatn–Vík-gögn nýtast best. Þetta velur vinnuröð, ekki minni release-lista: allir 56, þar með taldir Vestfirðir/Snæfellsnes/Reykjanes, halda óbreyttum heitum/ID og áframhaldandi þekjumarkmiði. Aðrir sex Suðurlandsstaðir bíða síðari lotu; enginn er útilokaður.

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


## Jonesy review — umferð 1 (2026-11-14)

**Niðurstaða: APPROVED — engin skilyrði, engir sýndir blockerar.** ND1–ND4 eru leiðbeiningar/valfrjálsar og mega hvorki tefja „Prompt approved“ né skapa nýja vinnu. Stage helst PROMPT_REVIEW þar til Ripley skrifar approved-prompt (`south/approved-prompt-v1.md`).

### Sandbox-staðfest (mitt; aðeins lestur á retained skrám; engin net-/GitHub-köll)

- **Tilvísanir í promptinu stemma við retained gögn.** `place-access-status-v3.csv`: Selfoss (2138), Hella (3591) og Hvolsvöllur (3593) hafa hvert tvær retained endatillögur (phase-1 ENTRY/stored-END og phase-2 EXIT/stored-START, `CANDIDATE_NOT_PROMOTED`, óleyst); Vík hefur eina retained tillögu, START á 3849 (native 499985.9121, 323611.5093, `NAME_MATCH_INFERRED`, ekki eigandaval); Hveragerði er `NODE_UNDETERMINED`/`NO_COORDINATE_SOURCE` (ekki sannað gagnaleysi). `place-node-references-v3.json` hefur aðeins Selfoss/Hellu/Hvolsvöll, Vík kemur úr CSV — eins og promptið segir.
- **Veggangurinn er til og samfelldur að mældum bilum**: `chain-walks-v4.json` → `cw_long`, stykki 2117 → 2135 → 2138 → 3737 → 3768 → 3767 → 3781 → 3613 → 3614 → 3615 → 3591 → 3638 → 3643 → 3593 → 3555 → 3576 → 3639 → 3848 → 3854 → 3839 → 3853 → 3852 → 3851 → 3850 → 3849 (→ 23041), alls ≈158,2 km frá 2117. Aðeins fjögur bil > 0: **34,75 m** (2117→2135, Hveragerði-skil), **30,1 m** (2138→3737, Selfoss), **42,3 m** (3768→3767) og **32,63 m** (3591→3638, Hella); öll önnur 0,0 m. Þetta eru þau „mældu bil“ sem promptið biður um að varðveita, ekki brúa.
- **WGS84 er retained fyrir allan ganginn**: öll 26 stykki frá 2117 til 23041 eru í `wfs-chain-4326.json` með sama OBJECTID/tier og í `wfs-vegnr1-all.json` (3057), og fyrsti/síðasti hnútur 2135, 2138, 3591, 3593, 3849 og 23041 stemmir við 3057-hnút innan 0,003 m (óháð umbreyting með pyproj í sandbox). „Ekki giska á umbreytingu“ er því uppfyllanlegt með því að lesa 4326-hnút úr retained skrá — engin þörf á nýrri öflun eða umbreytingarkóða. (Eina stykkið sem vantar í 4326 er 2134, vesturbraut Hellisheiðar, sem þessi lota notar ekki.)
- **SHA-tilvísanir** (CC getur vísað beint í þessar): `wfs-vegnr1-all.json` 305f60d6f1f1…, `wfs-chain-4326.json` 966848554f0c…, `road-links.csv` bf25ff0f68f0…, `chain-walks-v4.json` 640efec931a3… — allar stemma við manifest/HASHES-skrár.
- **Afmörkun og lifecycle samræmast README**: fimm staðir, ein sameiginleg kaflaskrá, ein ákvörðunartafla, engin ný staðafærsla, öll 56 óbreytt; sex Suðurlandsstaðir bíða (Höfn, Skaftafell, Kirkjubæjarklaustur, Þorlákshöfn, Flúðir, Laugarvatn = 11 − 5); leitarheimild aðeins eftir approved-prompt og „Prompt approved“, ≤3 leitir/≤6 opnanir, aðeins vegagerdin.is/umferdin.is, stöðvast við fullnægjandi heimild, beint/ályktað aðgreint; negatíf próf eiga að kalla raunverulega athugun (KB1/KC1-lærdómur); engin UI/API/leiðarvél.

### Athugasemdir (ekki blockerar)

- **ND1 — Hveragerði er aðeins nafnaályktun á retained gögnum.** Ekkert stykki heitir „Hveragerði“; nafn stykkjanna 2135/2138 er „Selfoss-Hveragerði“. Hveragerði-hnúturinn í promptinu verður því að vera stykki 2135 (VEGHLUTI 1), annað hvort END (native 392703.5, 389865.057; 4326: 63.99538228, −21.19270972) eða hjálparhnútur, og merktur sem ályktun (eins og NAME_MATCH_INFERRED), ekki staðfestur bær. Þetta er einmitt samskeytin við Hellisheiði: 2117 („til austurs“, VEGHLUTI 7, ein akbraut) endar 34,75 m frá 2135, brúað af útilokuðu VEGHLUTI 5 stykki 36807. Ekki nota 2117/2134 sem Hveragerði-aðkomu án þess að segja hvaða akbraut.
- **ND2 — bilin liggja á tveimur af þremur „EXIT/START“-kandídötum.** Í austurátt: ENTRY/END-hnútar Selfoss (2138 END), Hellu (3591 END) og Hvolsvallar (3593 END) eru 0,0 m frá fyrra stykki; EXIT/START-hnútur Selfoss (2138 START, 401739.85, 383119.047) og Hellu (3591 START, 430972.1263, 370845.6043) eru þar sem 30,1 m og 32,63 m bil taka við, en Hvolsvallar (3593 START) er 0,0 m. Fjarlægð milli kandídata er 2008 m (Selfoss), 832 m (Hella) og 279 m (Hvolsvöllur). Ráðlögð tillaga á að nefna þetta sem hluta af „af hverju þessi valkostur“ og ekki fela bilin; bil er ekki sönnun um lokun né leyfða brú.
- **ND3 — stefna stykkja.** Stafræn (geymd) stefna þessara stykkja er vestur, svo austurganga Rauðavatn–Vík fer þau öfugt (`direction: rev` í cw_long). Þetta er aðeins geometry — promptið bannar réttilega að gera það að akstursheimild; kaflaskráin á að skrá báðar akstursáttir sem aðskildar staðhæfingar með orientation á hvort stykki.
- **ND4 — valfrjáls einföldun.** Þar sem coordinates/approach þessara fimm halda `null` og tillögurnar fara í ákvörðunartöflu og nýju tengiskrána, þarf `winter-route-places.json` ekki að breytast fyrr en eigandi velur (smærri breyting, enginn þörf á að laga `places.test.js`). Ripley/eigandi ráða; promptið leyfir báðar leiðir og hvorug er blocker.

### Takmörk

Mitt er aðeins lestur á retained skrám og umbreytingarsamanburður í sandbox; ég hef ekki keyrt próf/lint/git/build á vél eiganda, ekki GitHub, og ekki gert heimildaleit (hún er CC-verk eftir „Prompt approved“). Ég tek enga afstöðu til þess hvaða kandídat er réttur (það er CC-tillaga og eigandaval) né hvort Hveragerði/Selfoss/Hella/Hvolsvöllur/Vík séu rétt staðsett á landakorti.

### Næsta skref

Ripley skrifar approved-prompt (ND-athugasemdir mega fylgja sem ein lína eða sleppast), setur READY_FOR_CC; eigandi segir CC „Prompt approved“. Fyrsta Jonesy-umferð þessa prompts; engin önnur nauðsynleg.

# #493 north-data — Leiðrétting gagnaskjala, umferð 2

## Ripley, 2026-11-05 — til Jonesy review

Ekki execution-heimild. Jonesy result-review umferð 1 og Ripley lokamat: REVISE W1–W5. Kjarni retained gagna er nýtilegur en ranga endpoint-/lengdar-/budget-framsetningu og vantaða afleiðslusönnun þarf að laga áður en eigandi tekur gagnatillögur til ákvörðunar. Eftir review verður approved-prompt-v2.md búið til; v1/frumsvör/fryst plan óbreytt.

### Fyrirhugað execution-prompt

Lestu AGENTS.md, CLAUDE.md og docs/ai/README.md/CURRENT.md. Framkvæmdu aðeins approved v2 eftir eigandahandoff í READY_FOR_CC; CC_IN_PROGRESS fyrir vinnu, uppfært cc-report-north-data.md og CC_COMPLETE eftir afhendingu. Skrifaðu eingöngu undir ticket-493-north-data og lögboðnar CURRENT-færslur. Engin netexchange, credentials/.env, ný gögn/dependencies, app/test/config/routes.js breyting, subagents, commit/push, GitHub-mutation eða deploy. Production NOT_TESTED.

Skyldulestur í þessari lotu: v1, pre-sample-plan.md, result-review.md (Jonesy og Ripley), evidence-north.md, route-data-candidate.json, samples/build_candidate.py, manifest/ledger/headers og retained native/WGS84 frumgögn; #491 endpoint-/v5 derivation-heimildir og relevant retained legacy-feed-sýni #483/#485. Skráðu nákvæmlega fullan/markvissan lestur og ólesnar heimildir; ekki nota samtalsminni sem staðreyndaheimild. Eigandi hefur þegar samþykkt sameiginlegan spátíma án ETA/±2 fyrir núverandi tvær leiðir í ticket-493/owner-decisions-2026-11-05.md; sú ákvörðun er ekki opin aftur og er ekki framkvæmd hér. Akureyrar-endi, punktaval og ný geometry-/stefnuforsenda eru enn tillögur.

**W1 — Lengdir, role-talning og endapunktur B.** Leiðréttu build_candidate.py, endurgerðu candidate JSON offline og samræmdu evidence/report. Taktu lokaða hringtorgslínu 30401 út úr vegalengdarnálgun eftir frystu reglunni; varðveittu fulla stykkjalengd hrings sem sér evidence, ekki ætlaðan akstursboga. Haltu mældum tengibilum aðgreindum og talið einu sinni; enginn nýr bogi eða akstursstefnugreining. Gefðu aðskildar geometry-heildir með/án hrings og með/án viðmiðunarstykkis 2819 svo engin tvítalning við #491 verði. Jonesy/Ripley viðmið norður-only án hrings en með fyrirliggjandi bilum: ~316.7123 km haversine / ~317.7260 km planar; sannprófaðu sjálfur úr frumhnútum, ekki með því að harðkóða viðmiðið. Coverage-note aðgreinir full geometry-partition frá vegalengdarnálgun án hrings; 17.818 km planar með hring er ekki lengd án hrings. Þetta sannar ekki raunverulega akstursvegalengd.

Keðja hefur 47 evidence-stykki (46 ný norðurstykki + viðmiðunarstykki2819), 46 x VEGHLUTI1 og 1 x VEGHLUTI5 (30401). 33604 er ekki í chain_order. B er til sem geometry feature og liggur nærri/á línu 32964 miðju, en er ekki keðjuendi: mæld planar fjarlægð við reference-hnút B ~264.4m frá byrjun og ~398.1m frá enda32964/A; A–B ~398.1m, ekki ~440m. Tilgreindu hvort tölur eru chord/point-to-line eða meðfram línu. Merktu B route-connection INFERRED; feature-existence má vera VERIFIED. Ekki fullyrða lengd að B eða endurskera línuna til vöruendapunkts án sérgreindrar tillögu; enginn endpoint valinn. Upprunalega rangar talningar í frystu plani eru leiðréttar í sér dagsettri viðbót, ekki í plani sjálfu.

**W2 — Heiti og umfang Akureyrar.** N5/A er síðasti retained keðjuendi við útilokað IDBUTUR909000037, ekki „Akureyri-aðkoma“. Lýstu tengingu hans við excluded stykki32961 og því að keðjan fer um Akureyrar-bæjargötur áður en hún endar við þessi mörk. Þetta er candidate scope-boundary, ekki sjálfgefið rétti vöruendi. Nefndu að aðrir endar, t.d. mót909030037/909360037 við2940→3876, eru ekki rannsakaðir sem endapunktar. Ekki víkka gögn austur fyrir mörkin eða rannsaka nýja bæjargötuleið. Candidate heiti/rök og koordinatar haldist rekjanleg og ósamþykkt.

**W3 — Heiðarlegt C1-bókhald án nýrrar netvinnu.** Fryst pre-sample-plan og upprunalegar ledger-línur/frumsvör/headers eru immutable. Bættu við dagsettu correction-addendum, append-only correction-færslu í ledger með tilvísun í upprunalegt exchange, og skýrri viðbót við manifest/report. Exchange1: body hent er ekki 0 bytes received, aðeins 0 retained; received bytes og nákvæmt UTC upphaf/lok eru UNKNOWN nema raunveruleg varðveitt sönnun finnist. Ekki búa til tíma/byte-mat. Heildarmóttekin bæti eru þekkt neðri mörk302849 B + óþekkt probe-body, ekki sannreynd heild/remaining-budget. 32MiB er heildarhámark; laga einingavillur (ekki „32768 MiB“). C1 plan-before-first-exchange brot stendur sem frávik, ekki endurskrifuð saga.

Varðveittu raunskipun exchange2 aðeins ef hana er að finna í raunverulegum retained execution-record; tilgreindu heimild og hvað var í raun framfylgt (host, timeout, body-cap, remaining total, redirect). Ef skipun eða enforcement-sönnun er ekki til, merktu UNKNOWN/NOT_DOCUMENTED og segðu að full C1-framfylgd sé ekki staðfest. Endurgerð illustrative skipun er ekki sú sem var keyrð og má ekki vera sett fram þannig. Ekki senda aftur neina beiðni til að fylla sögugat. Að sýni sé lítið/fullkomið sýnir ekki fyrirfram budget-vörn. Skýr aðgreining: data-integrity staðfesting, framkvæmdarfrávik og óstaðfest budget-enforcement.

**W4 — Endurkeyranleg inventory-afleiðsla og hæðartakmörk.** Bættu við litlu scoped samples/inventory_chain.py og retained úttaki sem endurskapar offline candidate-walk frá2819 með lýstri regla/stöðvun við excluded909000037, stykkjaröð, orientation, native bil, næsta keppinaut og ties, IDBUTUR/VEGHLUTI-talningu, node-pörun og z-profile. Harðkóðuð chain_order í build_candidate er candidate input, ekki sjálfstæð sönnun á uppgötvun keðju. Inventory má endurskapa geometric candidate-selection en ekki útnefna nearest-neighbour niðurstöðu VERIFIED traffic direction eða heimila nýja bilabrúun. Láttu misræmi við retained candidate verða skýra hindrun, ekki sjálfvirka skiptingu á keðju.

Úttak skal bera per-piece node/zero-z-talningu og staðsetningu/umfang núll-z-stykkja; 141/1107 í allri47-stykkja evidence-keðju er viðmið Jonesy/Ripley, ekki harðkóða. Aðgreindu 2819 frá norður-only og hringtorg frá lengd í talningum. Z=0 er óstaðfest/mögulega vantar-hæð, ekki áreiðanleg sönnun á sjávarmáli. Reikna og skilgreina staðbundin hámörk á þekktum z-hnútum með endurkeyranlegri reglu, án nýs terrain/DEM og án þess að kalla vertex-maxima fulla veðurþekju eða allan kaflann hæstan. N2–N4 eru tilteknir vertex-candidates; hæðarbil takmarka „hæsta allrar keðju“ fullyrðingar. N1 er endi2800, ekki afleiddur dal-lágpunktur; Baula/Norðurárdalur er tillöguheiti/UNKNOWN staðarstaðfesting, ekki sönnun af IDBUTUR-nafni. Samræmdu JSON/evidence/report.

**W5 — Færð/notice er lykilpörun, ekki samfelld leiðarstaða.** Leiðréttu §4 og gap-töflu: 16 IDBUTUR-match úr gömlum sýnum sanna hvorki núverandi færð né enga óviðkomandi tilkynningu. Sýna nákvæma export/capture tíma og aldur miðað við skilgreindan UTC-reference í þessari lotu; 28.10./2.11. eru söguleg sýni. Skráðu notice73688 / IDBUTUR772210037 (Vatnsdalvegur vestan megin, vegavinna til2027-10-20) sem mismatched-key dæmi þar sem gögn sýna ekki sjálfkrafa route relevance. Ef nefnd er ~1.5km fjarlægð þarf afleiðslu/CRS/reference; hún sannar hvorki viðkomandi né óviðkomandi. Ekki draga lokun/óöryggi af nálægð eða segja notice tilheyra leið án gagna. Lýsa því sem ekki er hægt að staðsetja innan hlutkafla.

Nýja retained WGS84-svarið hefur tier0-hliðarvegastykki VEGNR5240/7020/731/704 undir sameiginlegum route-IDBUTUR904050037/907150037/907210037. Gefa nákvæma IDFERILL-/IDBUTUR-/vegnúmera-töflu og merktar lengdir ef reiknaðar; ~3.1km er viðmið, ekki akstursviðbót. Fullyrðing um „öll önnur15 IDBUTUR notuð í heild“ er of sterk þegar key inniheldur aðra vegi. Ekki bæta þeim við Hringvegskeðju. Greina route geometry frá coarse state/notice footprint og sýna áhrif á acceptance #493 án þess að eigandasamþykkja nýja takmörkun.

### Afhending og sannprófun

- Skrif: leiðrétt evidence-north.md, samples/build_candidate.py og offline endurgert route-data-candidate.json; nýtt inventory_chain.py + úttak; correction-addendum/append-only ledger/manifest og dagsett v2 í cc-report. Ekki breyta frystu plani, upprunalegum ledger-færslum eða raw sample-bætum. Hashar frumheimilda staðfestir; JSON-output-hash skilgreinir line endings eða canonical encoding (R8), gömul CRLF-tala ekki nýtt kross-platform sannleiksgildi.
- Keyra aðeins nauðsynlegar offline afleiðslur; candidate-framleiðsla endurkeyranleg og heimildir/skipanir/úttak skráð. Afleidd stykkjatalning/lengdir/endpoint-/z-/notice-takmörk samræmd í öllum núgildandi artifacts. Afturkalla rangar v1-fullyrðingar í dagsettri v2-skýrslu, fyrri saga rekjanleg.
- Outcome EVIDENCE_READY_FOR_OWNER_REVIEW getur staðið fyrir leiðrétta candidate-afhendingu, ekki framkvæmdarheimild; ef gögn mótmæla grunnkeðju, skila BLOCKED_WITH_EXACT_GAPS. #493 heildarmiði áfram ólokinn og tímalíkansinnleiðing sér lota. Ekki enduropna samþykkta ETA-brottnámsákvörðun vegna eldri „owner decision pending“ texta.
- W1–W5 tékklisti í cc-report: eigin keyrslur vs CC/Jonesy fyrri claims aðgreindar, app-próf/lint/build/vafri ekki keyrð enda engin appbreyting. CURRENT CC_COMPLETE; eigandi → Jonesy → Ripley lokamat.

### Jonesy review

PENDING. Meta hvort W1–W5 leiðrétti niðurstöður án nýrrar gagnaöflunar, hvort netfrávik séu heiðarlega skráð án falskra execution-records og hvort geometric candidate-walk/hæðarsnið séu endurkeyranleg án þess að fá sterkari sönnunargráðu.

## Jonesy review — umferð 2 (2026-11-05)

### Niðurstaða: APPROVED WITH CONDITIONS K1–K3 (skjalaleg; felld inn í approved-prompt-v2 áður en READY_FOR_CC)

Promptið er þröngt og rétt afmarkað: offline eingöngu, engin netexchange, ekkert app/test/config, v1/fryst plan/frumsvör/ledger-línur óbreytt, tímalíkansákvörðun ekki enduropnuð, ekkert val tekið um Akureyrar-endi eða punkta, og W1–W5 svara R1–R7 (R8 í „Afhending“). Ég hef sannreynt viðmiðstölur þess sjálfstætt í sandbox.

### Sandbox-athuganir mínar (lestur og lítil offline Python `-I` á staged afritum; ekkert net, enginn lykill, ekkert keyrt á vél eiganda)

- **Staða:** CURRENT var PROMPT_REVIEW, Prompt review = `correction-prompt-review.md`, Ripley lokamat umferð 1 (REVISE W1–W5) í `result-review.md`. Ég las promptið, lokamatið og handoff.
- **Viðmið stemma við mína eigin útreikninga:** 47 evidence-stykki = 2819 + 46 norðurstykki; VEGHLUTI 46 × 1 + 1 × 5 (30401); hringur 30401 = 124,277 m haversine / 124,672 m planar; norður-only án hrings en með bilum: 316,7123 km haversine / 317,7260 km planar; 141 af 1107 hnútum z = 0; wfs-north-4326 SHA256 óbreytt (`7075416c…`). Hringtorg 33604 er ekki í keðjunni.
- **Viðmið eru ekki hardkóðuð:** promptið segir réttilega „sannprófaðu sjálfur úr frumhnútum, ekki hardkóða viðmiðið“; tölurnar eru viðmið til samanburðar, ekki inntak.
- **Aðrar athuganir (fyrir K2/W5):** tilkynning 73688: 1 515 m frá næsta hnút WGS84-keðjunnar (vertex-fjarlægð með haversine, því efri mörk á fjarlægð að línu; sandbox-útreikningur, ekki heimild um leiðarviðkomu). Fjarlægð að B: hringtorgs-viðmiðunarhnútur `[543532.5, 577273.8]` er 0,0 m frá línu 32964; **meðfram línunni** 264,4 m frá upphafi og 423,5 m frá enda (línan er 687,8 m, B er ~38 % inni); **bein lína (chord)** að upphafi 264,4 m og að enda/A 398,1 m. Beint bil upphafsendi 2819 → upphaf 2816 er 42,92 m (aftur: 1,77 + 42,84 = 44,61 m eru bilin um hringtorgið).
- **Mörk:** hvorki app-próf/lint/build/git/vafri keyrð né net notað; ekki lesin í heild #491 derivation eða #483/#485 feed-sýni í þessari umferð umfram það sem stendur í sandbox-athugunum hér.

### Hvað er gott

W1 krefst þess að tölur séu endurreiknaðar úr frumhnútum; W3 ritar ekki söguna aftur og bannar „illustrative“ skipun sem keyrða; W4 krefst þess að nearest-neighbour-gangan sé varðveitt án þess að veita henni VERIFIED stefnu-/bilabrúunarstöðu; W5 aðgreinir lykilpörun frá leiðarstöðu og bannar ályktun af nálægð.

### Skilyrði (öll tengd approved-prompt-v1 C3/liðum 2–6 og W1–W5; ekkert nýtt umfang)

- **K1 — Sönnunargráða tengibila (W1/W4, C3).** Forskráð regla (`pre-sample-plan.md` §2): nálægð ein og sér er aldrei VERIFIED; hringtorg er „bridged by its own recorded native gap“, ekki akstursboga. Núverandi texti („46 af 46 tengipunktar VERIFIED“, plan §3 „exact/near-exact“) blandar því saman. Ég sá það ekki í umferð 1 og viðurkenni það hér. v2 á að krefjast þess að leiðrétt evidence/JSON aðgreini: 44 × 0,00 m = snerting í sameiginlegum native hnút (VERIFIED snerting kortlagðra lína, ekki umferðarheimild); 1,77 m (2819→hringtorg 30401) og 42,84 m (30401→2816) = brúað samkvæmt forskráðri hringtorgsreglu með tilgreindri heimild (heimild 1,77 m = #491; 42,84 m = KAFLANR g8 báðum megin); hvorugt er „VERIFIED akstursleið“. Inventory-úttak skráir fyrir hvert skref bæði nákvæma snertingu (0,00 m) og nálægð; engin þröskuldur fundinn upp.
- **K2 — Orðalag og mæling B (W1).** „liggur nærri/á línu 32964 miðju“ er ónákvæmt: B er ~38 % inni í línunni. v2 á að fyrirskipa að CC reikni og skrái bæði beina fjarlægð (chord) og fjarlægð meðfram línunni og merki hvor er hvor; viðmið Jonesy: meðfram línu 264,4 m frá upphafi / ≈ 423,5 m frá enda (línan 687,8 m), bein lína 264,4 m / 398,1 m; sannprófast úr frumhnútum, ekki hardkóðað. Ekki fullyrða lengd að B.
- **K3 — Einingavilla og afgangs-budget (W3).** „32 768 MiB“ er aðeins í sögufærslu CURRENT (handoff CC), ekki í task-skjölum; hún er sagan og má ekki endurskrifa. v2 á að segja CC að leiðrétta í nýrri dagsettri færslu í v2-handoff og cc-report, og að „~31,7 MiB afgangur“ í `samples/manifest.md` sé aðeins neðri-mörk-fullyrðing (probe-body óþekktur), ekki staðfest remaining-budget.

### Athugasemdir (ekki skilyrði)

- **N1:** CC á ekki að breyta frystu plani; leiðrétting á „45 af 47 … 2 × VEGHLUTI 5“ og „exact/near-exact“ fer í dagsetta viðbót (promptið segir þetta þegar um taltalninguna; ég styð það líka um K1).
- **N2:** W5 „~1,5 km“ þarf afleiðslu; mín gildi (1 515 m) er vertex-fjarlægð í WGS84 og efri mörk á fjarlægð að línu; CC reiknar og skráir aðferðina, eða sleppir tölunni.
- **N3:** Engin skilyrði um CURRENT eru nauðsynleg umfram CC_IN_PROGRESS/CC_COMPLETE og dagsetta v2-færslu.

### Mörk

Prompt-review; ekkert gagna- eða appskjal breytt og engin keyrsla eða sókn heimiluð. Allar tölur eru úr lestri/talningu á staged afritum í sandbox. Núgildandi skilmálar/verð/kvótar óstaðfest umfram dagsett retained sýni. Stage helst PROMPT_REVIEW. Næsta skref: Ripley býr til approved-prompt-v2.md með K1–K3 og setur READY_FOR_CC; Róbert commit-ar sjálfur.

## Ripley — samþykki fellt inn, 2026-11-05

Approved-prompt-v2.md búið til með K1–K3/N1–N3: nákvæm native-snerting vs brúuð bil, B chord/along-line mæling, immutable saga og leiðrétt budget-eining. Talnaleg skýring K3: óþekkt probe-byte gerir þekkta notkun að neðra marki en ~31.7MiB mögulegan afgang að EFRA marki; ekki tryggðum afgangi. Þetta er leiðrétting á stefnu ójafnunnar í review-orðalagi, sama krafa um að fullyrða ekki budget-framfylgd. Engin ný sókn/appvinna. CURRENT READY_FOR_CC; eigandi → CC „Prompt approved“.

# #501 — Búðardalur ↔ Flókalundur um veg60 — MVP Round1 — 2026-11-19

Eigandi bað um áframhald eftir samþykkta1/60↔Búðardalur tengingu. Næsta afmarkaða working-MVP: framlengja stofnleið60 frá Búðardal að Flókalundi, í báðar áttir. Þetta er prompt-review, ekki execution heimild fyrr en approved prompt/CURRENT READY_FOR_CC og eigandi Prompt approved.

## Lesa og endurnýta

AGENTS/CLAUDE/README/CURRENT; westfjords-entry-mvp approved prompt/lokamat/build og region loader/JSON/próf; núverandi geometry API/próf. Báðir pakkar undir owner-packages-2026-11-19: source-note/manifest, project/Island-akstursrod-og-GPS.csv og Vestfirdir-Hringvegur.png, vegagerdin-ids CSV/GeoJSON/heimildir. Jonesy notar sömu pakka á báðum review-stigum.164staðataflan er grunnur, owner-hnit duga MVP; engin ný nákvæmnis-/heimildaleit.

## Framkvæmd

- Endurnýta validated offline WGS84→EPSG3057 adapter og literal tier0-core, ekki afrita hnitaformúluna aftur eða búa til nýja leiðarvél. Lítil svæðisgagnaskrá/loader-aðlögun og afmarkað geometry API-par `budardalur`↔`flokalundur` heimilt. Flókalundur ef ekki í56-runtime-lista fær litla svæðisallowlist-færslu, ekki all164 migration. Kjarni/tier2-Hringvegur/policy óbreytt.
- Búðardalur-endapunktur er SÁ SAMI samþykkti innskotshnútur á2769, ekki gamli runtime-hnúturinn eða eigandapunkturinn. Varðveita innskot og source-identities. Sameiginlegi búturinn við Búðardal er raunveruleg sneið, ekki tvítalning á fullum2769 í samsettri framtíðarleið.
- Flókalundur owner-hnit65.576/-23.163 varðveitt sem product-punktur. Finna vegaðkomu á réttri stofn60-línu í samhengi við60/62-grein, ekki nearest kandidat sjálfkrafa. Projection/innskot á réttan raungeometry-lið eins og síðast heimilt, óbreytt IDFERILL/IdButur; offset aðskilið/ekki lengthM, enginn loftlínuakstur að owner-punkti. Núverandi places.json annarra neytenda ósnert.
- Velja raunsamfellda veg60-keðju úr pakkageometry: Búðardalur–Laugar/Svínadalur/Gilsfjörður og áfram um60 að Flókalundi. Þetta eru corridor-vísar, ekki fyrirfram staðfest sourceId-röð; CC keyrir offline raunleið og staðfestir rétt veg/grein með geometry, vegnúmerum og heitum. Ekki fara inn á61/Þröskulda, inn á Reykhóla-afleggjara eða62 að Brjánslæk sem leiðarbút til að ná réttum enda. Þeir greinipunktar má merkja sem framtíðartengingar á korti, án þess að innleiða afleggjarana.
- IdButur-listi aðeins úr VALINNI geometry í ferðarröð. Allir nauðsynlegir IDFERILL sama IdButur varðveittir, sourceId ekki ruglað viðIdButur.905070037 var réttilega ekki í fyrri leið en GETUR nú verið réttur út frá nýrri keðju; ekki frysta candidate-fjarveru síðustu lotu sem landsreglu. Canditates eina sér aldrei roadConditionIds/færðarjoin. Engin ný live-færð/#503 tenging.
- Literal samskeyti fyrst. Engin sjálfvirk global snapping eða ný langri línu-connector til að fela vantaðan kafla. Ef raunnet slitnar eða tvær raunhæfar ólíkar60-keðjur eru óuppgerðar: sýna nákvæm sourceId/hnit/veg-val og minnsta nauðsynlega ákvörðun áður en umfang vex, ekki nýtt landsaudit/öflunarloop.

## Lokaskilyrði

Raunhandler í báðar áttir með réttum API-ID, pinned samþykktum Búðardalsenda og skýrum Flókalundsenda. Continuous chain, lengd endurreiknuð úr hnitum, sourceId/slices rétt röðuð/viðsnúin, stable geometryId/regionVersion og IdButur-listi úr raunleið. Allir bútar/VEGHLUTI athugaðir; venjulegir tvístefnuvegir undir MVP-forsendu eins og fyrri svæðisbútur, hringtorg ef til staðar ekki gleymd. drivingAccess UNVERIFIED, lengthNote tier0-planar; engin ETA eða færð/öryggisfullyrðing.

Eitt raunverulegt neikvætt greinipróf: nálæg62/61/afleggjarakandidat sem er ekki á stofnleiðinni bætist ekki í ID-listann. Prófa að905070037 sé valið eða hafnað vegna raunleiðar, ekki eingöngu candidate-stöðu. Fyrri1/60↔Búðardalur svar (hnit/slices/lengd/geometryId/regionVersion) óbreytt; frekar ný afmörkuð gagnaskrá en að breyta gömludataset-hashi fyrir öll pör. Hringvalkostir/veg93/óskyld pör/same_place óbreytt samkvæmt focused regressions. Eitt tier í kalli, engin docs runtime-lestur, server_data includeFiles endurnýtt.

Keyra viðeigandi focused svæðis/API/core/Hringvegsregression-próf, lint snertum JS og git diff --check. Ekki fullsuite/build/fuzz/mutation nema sýnd ástæða. Eitt task-local map-view.html með báðum áttum, owner-punktum/aðkomum og greinipunktum sem skipta máli. Endurnýta fyrri map/transform; nýtt laust127.0.0.1-port, aðeins task-mappa (fyrri8765–8770 ótrufluð), canonical OSM/Referer/attribution. Sjónrænt PASS aðeins ef skoðað, annars virkur hlekkur til eiganda.

Stutt cc-report: raunlengdir/keðjur/ID, staðfest greinival, próf og kort. Þetta er working svæðisframlenging, ekki öll60/61/68 eða allt164. Ekkert nýtt UI/live-færð/cache/veður/scoring/pricing/dependencies eða önnur ticket; engin netöflun/skilaboð/ferja/commit/push/deploy/GitHub. Approved prompt immutable; CC READY_FOR_CC→CC_IN_PROGRESS→CC_COMPLETE, Jonesy review og Ripley lokamat. Blocker sýnir ranga/ónothæfa leið eða raunverulegt umfangsbrot; valfrjáls nákvæmni/opinber MVP-stefnustaðfesting ekki blocker. Þegar parið/focused próf/kort virka, stoppa.


---

## Jonesy review — umferð 1 (2026-11-19)

**Niðurstaða: PROMPT_REVIEW — samþykkjanlegt með bindandi P1–P9.** Stefnan (endurnýta adapter/kjarna/Búðardalsinnskot, eitt par, engin 61/62/607-afleggjara) er rétt. **En það er einn falinn blocker í gögnunum sem prompturinn nefnir ekki (P1).** Án P1 skilar kjarninn „velheppnuðu“ svari á röngum vegi.

### Merking: sandbox vs CC

- **Sandbox (mitt, Linux):** öll 1564 tier-0 lína úr pakkanum umreiknuð með pyproj í EPSG:3057 (4 aukastafir), raunverulegur `composeGeometryPath` úr svæðislotu CC (ekki nýr handler — hann er ekki til enn), innskotshnútar á 2769 (Búðardalur, samþykktur) og 3648 (Flókalundur, mín vörpun). Allar tölur hér að neðan eru **mínar** og eru viðmið ±0,05 m, ekki fyrirskipuð geometryId.
- **CC-fullyrt:** ekkert enn.

### Sandbox-niðurstöður

1. **Bókstafleg 60-keðja Búðardalur → Flókalundur** (25 samskeyti athuguð í WGS84 með `==` á lengd/breidd): 2769 → 3197 → 3247 → 3462 → 40961 → 3460 → 3771 → 3755 → 3754 → 3750 → 49925 → **(gat)** → 50566 → 3678 → 3677 → 3675 → 3672 → 3651 → 3869 → 3868 → 3648. Allir bútar vegnr 60, VEGHLUTI 1 (engin hringtorg/sérbútar á leiðinni). **24 af 25 samskeytum eru bókstafleg.**
2. **Eina gatið: 49925 endi ↔ 50566 upphaf = 0,005 m** (WGS84 `-22.33466812/65.529546` vs `-22.33466807/65.52954604`; EPSG:3057 345 884,4588/563 104,0398 vs 345 884,4613/563 104,0441). Gröf–Hallsteinsnes (560250037) → Djúpifjörður (560260037).
3. **Hvað gerist án úrlausnar:** kjarninn skilar **ekki** villu (`disconnected_graph` kemur aðeins ef maður einangrar vegnr 60). Hann velur stystu bókstaflega leið: fer af 3750 við hnút 14 inn á 608 Þorskafjörður A (3718) → 608 Þorskafjarðarheiði (2322, 2321) → **61** Steingrímsfjarðarheiði/Djúpvegur (3418, 3419, 3605) → **F66** Kollafjarðarheiði (2077, 205 hnútar) → aftur inn á 3672. **204 217,199 m, 22 slices, status `geometry_only`** — lítur eðlilega út, er röng leið. IdButur þar: 560800037, 907060037, 907050037, 907070037, 906520037 (í stað 560250037/560260037/805140037/905150037). Að fjarlægja 49925/50566/3678 breytir engu; að fjarlægja 3754 gefur 218 103 m um 61/Þröskulda.
4. **Með einni estimated connector-línu (-1, 49925 endi → 50566 upphaf, 0,005 m):**
   - Búðardalur(innskot 2769) → Flókalundur(innskot 3648) = **172 474,223 m, 21 slices** (20 raunbútar + connector), öfugt **sama lengd, öfug röð**, hnitakeðja = `lengthM`, **0 tvítalin brún**.
   - Fjarlæging allra 608/61/F66 lína breytir engu (staðfestir að leiðin er stofnleið, ekki tilviljun).
   - Til samanburðar um 60/62-vegamót í stað Flókalundarvörpunar: 172 820,996 m (+346,773 m).
   - **Samsetning við fyrri lotu:** `junction-1-60-baulan` → Flókalundur í einu kalli = 214 629,426 m = 42 155,203 (entry) + 172 474,223 (ný) með 0,0002 m mun (námundun) → 2769 [0→3] (entry) og [3→4] (ný, 205,4 m) eru réttu hlutarnir, engin tvítalning.
5. **Flókalundur:** owner-punktur (65.576/-23.163) → EPSG:3057 (307 992,815; 570 542,155). Næsta lína **3648** (905170037, Skálmardalsá–Flókalundur), vörpun (307 969,5327; 570 587,8678) á hluta 49→50, **frávik 51,30 m** (stemmir við CSV, tillaga 1 = 51 m). 3648 endi (hnútur 52 af 53) = **60/62-vegamót**: þar byrja 3009 (vegnr 60 Helluskarð, 660350037, áfram til Ísafjarðar) og 3698 (vegnr 62 Flókalundur–Brjánslækur, 905180037), báðar **343–345 m** frá owner-punkti (CSV tillögur 2 og 3). Frá vörpun að vegamótum: 346,773 m eftir á 3648.
6. **Greinipunktar á bókstaflegri keðju** (aðrar línur deila hnút með keðjunni): 3197 v1 → 587 Hjarðarholtsvegur; 3197 v45/3247 v0 → 590 Fellsströnd (905090037); 3247 v3 → 589 Sælingsdalsvegur; 40961 v13/3460 v0 → 590 Skarðströnd (905100037); 3460 v10 → 690 Sunnanverður Gilsfjörður; 3771 v18/3755 v0 → 602 Garpsdalsvegur; 3755 v8 → 605 Geiradalsvegur; **3755 v15/3754 v0 → 61 Þröskuldar (3321, 907000037)**; **3754 endi/3750 v0 → 607 Reykhólasveitarvegur (2973, 905120037)**; **3750 v14 → 608 Þorskafjörður A (3718)**; **3675 v60/3672 v0 → F66 Kollafjarðarheiði (2077, 906520037)**; **3648 endi → 60 Helluskarð + 62 Brjánslækur**.
7. **IdButur í CSV-708:** öll 12 IdButur á leiðinni og öll útilokuðu (905180037, 660350037, 907000037, 905120037, 560800037, 906520037) eru til — engin vantar.

### Bindandi atriði (P1–P9)

**P1 — Eina bókstafsgatið (49925↔50566), BLOCKER ef sleppt.**
Prompturinn bannar „nýja lengri connector“ og segir að ef netið slitnar skuli CC sýna sourceId/hnit. Hér slitnar netið **ekki** sýnilega (kjarninn finnur 608/61/F66-krók), svo CC gæti fengið grænt „par virkar“ með 204 km röngu svari. Þess vegna: leyfð er **nákvæmlega ein** estimated connector-lína (neikvætt sourceId, `estimated:true`, einstefnulaus), frá **49925 síðasta hnút til 50566 fyrsta hnút**, lengd ≤ 0,01 m (mín mæling 0,005 m), skráð með báðum hnitum í svæðisgagnaskrá og skýrslu. Fordæmi: Hádegismóa-samskeyti hringvalkosta. **Ekki** snapping í kjarna, **ekki** breyting á tier-0 hnitum, **ekki** önnur eða lengri connector. Connector er ekki IdButur, ekki í `via`, og `estimatedConnectorLengthM` ≈ 0,005 skráð sér (ef svarið ber slíkan reit). Ef CC finnur annað gat eða getur ekki staðfest þetta: stoppa og sýna sourceId/hnit.

**P2 — Keðjan fest sem raðaðir sourceIds, ekki bara IdButur-listi.**
Próf fest á raunsvar: sourceId-röð `2769[3→4], 3197, 3247, 3462, 40961, 3460, 3771, 3755, 3754, 3750, 49925, connector, 50566, 3678, 3677, 3675, 3672, 3651, 3869, 3868, 3648[0→vörpun]` (öfugt í hina áttina); **allir raunbútar vegnr "60" og VEGHLUTI 1**; **enginn** slice með vegnr ∈ {61, 607, 608, 62, F66} eða sourceId ∈ {3718, 2322, 2321, 3418, 3419, 3605, 2077, 3321, 2973, 3009, 3698}. Viðmið: **172 474,22 m ±0,05**, 21 slices, 0 tvítalin brún, hnitakeðja = `lengthM`, sama lengd og öfug röð öfugt. (geometryId-gildi mín eru upplýsing, ekki bindandi — þau ráðast af útfærslu.)

**P3 — Neikvæða greinipróf = „connector nauðsynlegur“-próf.**
Eina neikvæða prófið á að sanna hættuna, ekki aðeins að candidate sé ekki á leiðinni: sama gagnasafn **án** connector verður að valda því að P2-keðjuprófið **falli** (kjarninn velur þá 3718/608/61/F66-krók, 204 217,2 m). Þannig er tryggt að P2 greini rangt val. Auk þess: engin 61/607/608/62/F66/Þröskuldar-lína í svari.

**P4 — Flókalundur-endapunktur.**
Endapunktur = innskotshnútur (bókstafleg vörpun) á **3648** hluta 49→50 (þ.e. verður hnútur 50 af 54), IDFERILL/IdButur 3648/905170037 óbreytt, **frávik 51,30 m skráð sér og utan `lengthM`**, enginn loftlínuakstur að owner-punkti. Eftir innskot eru 346,77 m eftir á 3648 og þeir **ekki** í leiðinni. **Endapunktur má ekki vera 60/62-vegamótin** (3648 endi): þau eru 346,8 m lengra, gefa 172 821,0 m og eru greinipunktur, ekki Flókalundur. 3009 og 3698 eru aldrei í leið. Tillögur 660350037 og 905180037 (343 m) eru **ekki** á leiðinni og koma ekki í IdButur. Z á innskotshnút = brúað gildi eins og á 2769 (F1/S3-fjölskylda, skrá).

**P5 — IdButur-listi úr völdum geometry, í ferðarröð (án connector):**
Búðardalur→Flókalundur: `805030037, 905070037, 905080037, 805090037, 905110037, 905130037, 560250037, 560260037, 805140037, 905150037, 905160037, 905170037` (öfugt öfugt). **905070037 er með vegna þess að 3197 er á bókstaflegri keðju** (ekki vegna candidate-stöðu). **Ekki með:** 505870037 (Hjarðarholtsvegur), 905090037/905100037 (590), 907000037 (Þröskuldar), 905120037 (607), 560800037 (608), 906520037 (F66), 660350037, 905180037. Candidates aldrei `roadConditionIds`/færðarjoin; engin #503-tenging.

**P6 — Búðardalsendi og samsetning við entry.**
Sami innskotshnútur á 2769 og áður; ný leið notar aðeins sneið **2769 [3→4] = 205,4 m** (ekki 487,3 m heila línu). Eitt próf/skýrslulína: entry-sneið [0→3] + ný sneið [3→4] = heil 2769 (487,268 m) og Baulan→Flókalundur í einu kalli = 42 155,203 + 172 474,223 ≈ 214 629,426 m (±0,05) án tvítalningar. Þetta er sönnun fyrir framtíðarsamsetningu, ekki ný API-leið.

**P7 — Greinipunktar á korti (aðeins merki, ekki leið).**
Kort sýnir greinipunktana í lið 6 (að minnsta kosti Þröskuldar 3755/3754, Reykhólar 607, 608, F66, 60/62-vegamót) sem „mögulegar framtíðartengingar, ekki staðfestar“; owner-punkt Flókalundar og Búðardals sýnd aðskilin frá leið; connector sýnd sem estimated (eins og Hádegismóa-samskeyti). Engin nálægðartillaga sett fram sem staðfest ID-tenging.

**P8 — API/gagnaskrá/óbreytt svör.**
`flokalundur` aðeins pöruð við `budardalur` (annað → 400 `unknown_place_id`, sama venja og `junction-1-60-baulan`); 56-lista og `places.json` óbreytt. Ný afmörkuð gagnaskrá/ný `regionVersion` frekar en að breyta `westfjords-region-1-60-budardalur.json` (byte-eins sönnun). Svar `junction-1-60-baulan`↔`budardalur` óbreytt: lengd 42 155,202847 m, 7 slices, geometryId `742bbdeda4fa…` (öfugt `559dde16d368…`). Hringvegur/Hella/ring-options/road93/`same_place` óbreytt (focused regression). Eitt tier í kalli.

**P9 — Lotumörk.**
Nýtt laust port (t.d. **8771**; ekki 8765–8770), canonical OSM/referrer/attribution, 6 aukastafa kortatolerance eins og áður (≤0,056 m). **Ekkert sjónrænt PASS frá CC nema skoðað** — annars virkur hlekkur til eiganda. Þegar parið, focused próf og kort virka: **stoppa** (ekki 61/Þröskuldar/Reykhólar/62/Brjánslækur/Ísafjörður, engin ferja).

### Valfrjálst (ekki blockerar)

- **S1:** WGS84-gögn Vegagerðarinnar eru til á 8 aukastöfum; 5 mm gatið er líklega útreikningsmunur hjá útgefanda. Má nefna í skýrslu, ekki laga.
- **S2:** CC má birta samtals 214,63 km „Baulan→Flókalundur“ sem upplýsingalínu í skýrslu; ekki ný API-leið.
- **S3:** Lengd 172,47 km er tier-0 planar EPSG:3057 lengd, ekki akstursvegalengd; `lengthNote` áfram.

### Mörk þessarar yfirferðar

- Enginn kóði CC til að skoða enn; þetta er prompt-review. Raunhandler ekki keyrður (er ekki til).
- Tölur byggðar á **mínum** pyproj-umreikningi (4 aukastafir) af pakka-GeoJSON, ekki á keyrslu CC; ±0,05 m viðmið.
- Ekkert keyrt á Windows-vél eiganda. `drivingAccess: UNVERIFIED`; owner-punktar eru MVP-forsenda, ekki opinber staðfesting; ekki turn-by-turn.
- Þetta er **umferð 1**; umferð 2 aðeins ef eigandi biður um það.

### Næsta skref

Ripley skrifar `approved-prompt-v1.md` með P1–P9 (P1–P3 sérstaklega óbreytt) og setur CURRENT á READY_FOR_CC; eigandi segir „Prompt approved“ við CC.

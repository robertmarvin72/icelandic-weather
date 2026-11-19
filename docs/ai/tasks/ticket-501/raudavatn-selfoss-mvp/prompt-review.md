# #501 — Rauðavatn ↔ Selfoss working MVP — Round 1 — 2026-11-18

## Bindandi ákvörðun eiganda og markmið

Eigandi: „Hringvegurinn er tvístefna ... Erum við ekki að flækja þetta of mikið?“ og „Mund minimum viable product ... Farðu í næsta skref.“ Afla staðfestingar frá Vegagerðinni er EKKI forsenda. Engin frekari heimildaleit eða acquisition-lota. Fyrri CURRENT-færsla um að bíða heimildarsvars er yfirtekin af þessari ákvörðun.

Afhenda raunverulega samsetta leið Rauðavatn → Selfoss og Selfoss → Rauðavatn gegnum núverandi geometry API með einföldum, sýnilegum MVP-forsendum. Þetta er veður-/færðaryfirlitsgrunnur, ekki turn-by-turn leiðsögukerfi. Ekki útvíkka á alla staði, allt landið eða #502/#503. Þetta prompt bíður Jonesy; CC framkvæmir aðeins approved prompt sem CURRENT vísar á í READY_FOR_CC eftir eiganda Prompt approved.

## Lesa og endurnýta

AGENTS/CLAUDE/README/CURRENT, api/winter-route-geometry.js og próf, geometryDataset.js og próf, geometryComposition.js og próf, server_data/winter-route-geometry-pilot.json. directed-composition lokamat og direction-authority RA1–RA3 aðeins sem tæknilegt samhengi, ekki ný staðfestingarskilyrði. Retained B1/B2/C1 geometry-skýrslur aðeins ef þarf til að tengja þessa leið. Núverandi engine styður directed policy og literal vertex-slices; ekki ný leiðarvél.

## Minnsta framkvæmd

1. Ein einföld pilot-policy fyrir ÞETTA staðapar, í báðar áttir. Venjulegir Hringvegsbútar eru tvístefna. VEGHLUTI 1/8 fá both sem MVP-forsendu; 3/4/6/7 fylgja vertex-röð sem upphafleg MVP-forsenda. Hringtorg (5) fylgja einni samfelldri umferðarstefnu að réttum útakstri; retained hringir eru teiknaðir rangsælis, nota forward á þeim í þessum pilot. Ekki gera 7 að reverse eingöngu vegna heitisins „á móti kaflastefnu“. Skrá basis sem OWNER_APPROVED_MVP_ASSUMPTION, aldrei opinber staðfesting. Óþekktur flokkur ekki sjálfkrafa heimilaður.
2. Keyra samsetningu sjálfstætt í báðar áttir; aldrei spegla directed-result. Ef einföld forsenda velur ranga akbraut við sjónræna skoðun, leiðrétta með fáum explicit sourceId-reglum fyrir þessa leið, ekki nýtt almennt reglukerfi.
3. Tengja pilotinn við api/winter-route-geometry fyrir nákvæmlega reykjavik-raudavatn/selfoss og öfugt. Önnur pör halda núverandi hegðun; gamla winter-route veður-/færðar-API og UI ósnert. Skila mode/policyVersion og skýrri assumption-merkingu fyrir pilotinn, drivingAccess helst UNVERIFIED. Geometry-ID notar núverandi directed ID. Dataset/policy útgáfumerking þarf að endurspegla runtime-inntakið sem er raunverulega notað; ekkert cache/framework-verkefni.
4. Ef literal-netið slitnar vegna akbrautaskipta: nota fyrst varðveitta millipunkta/full geometry sem þegar eru til (B1/B2). Ef enn þarf stutta samskeytatengingu má gera explicit pilot-connector milli tilgreindra source-vertices við sömu vegamót, eftir sjónræna skoðun; lengd mest 45 m á tengingu. Ekkert global nearest-neighbour snapping, engin tenging milli samsíða akbrauta nema raunveruleg vegamót styðji hana. Merkja connector sem áætlaða tengingu, ekki upprunalega Vegagerðar-fitju; ekki falsa IDFERILL/IDBUTUR/evidence. Fáein afmörkuð gögn og einföld aðlögun eru heimil, ekki ný topology-arkitektúr. Ef tenging fæst ekki án stærri breytingar, skila nákvæmu sýnilegu dæmi og minnsta nauðsynlega vali eiganda, ekki nýrri rannsóknarlykkju.

## Sýnileg afhending og staðfesting

- Báðar raunleiðir þurfa að skila samfelldri hnitakeðju milli sömu pinnuðu endapunkta. Rétt akbraut og áframhald um hringtorg að útakstri athugað á korti, sérstaklega Hellisheiði og Selfoss. Endapunktarnir haldast óbreyttir.
- Búa til EINA einfalda staðbundna kortasýn fyrir yfirferð, með tveimur litum/áttum og merktum áætluðum tengingum. Nota fyrirliggjandi korta-/hnitaumbreytingartól ef til eru; engin ný npm dependency eða almenn UI-viðbót. Má vera task-local HTML eða núverandi dev-sýn. Tile-basemap má nota fyrir venjulega sjónræna skoðun; engin WFS/gagnaöflun. Ef kortaskoðun er ekki möguleg, skila opnanlegri sýn og segja nákvæmlega hvað var/var ekki skoðað, ekki fullyrða sjónrænt PASS.
- Focused próf: bæði raunpör ná endum og eru samfelld, sérhver slice virðir pilot-policy, hringtorg fara rétt eftir valinni stefnu, connector ef notaður er merktur og lengd talin. Ein regression sýnir að pilot-policy sé raunverulega notuð (ekki bara gamalt undirected success). Staðfesta að óskyld pör og gamli API-samningurinn haldist óbreytt. Ekki exhaustive all-pair/fuzz/mutation eða öll landsgögn.
- Keyra viðeigandi geometry/API/dataset og eldri winter-route focused próf, lint á snertum JS og git diff --check. Engin fullsuite/build nema breytingin gefi sérstaka ástæðu.
- cc-report.md: hvað virkar í báðar áttir, lengd/source-bútar, áætlaðar tengingar og mynd/slóð á kortasýn. Stuttur assumptions.md ef þarf, ekki ný skýrsluröð. Ekki fullyrða að #501 í heild sé lokið.

## Umfang og STOP

Heimilt að breyta geometry pilot API/prófum, bæta litlu pilot-policy hjálpartæki/prófi og nauðsynlegum pilot-gögnum. Pure-kjarni aðeins ef sýnd nauðsyn fyrir þessa tvo ferla, ekki valfrjáls OP-lagfæring. Ekki breyta src UI, gamla api/winter-route.js, veður/færð, scoring, pricing, packages eða öðrum ticketum. Engin Vegagerðar-fyrirspurn send, ekkert GetFeature/metadata-net, commit/push/deploy/GitHub.

CC lífsferill: READY_FOR_CC → CC_IN_PROGRESS → CC_COMPLETE með skýrslu; Jonesy result-review síðan Ripley lokamat. Blocker verður að sýna að annar raunferillinn sé rangur/ónothæfur eða að umfang sé brotið. Vöntun opinberrar heimildar fyrir SKRÁÐRI eigandasamþykktri MVP-forsendu er ekki blocker. Þegar báðar leiðir virka og focused athuganir standast, stoppa.

## Jonesy review — umferð 1 (2026-11-18)

**Niðurstaða: APPROVED með bindandi P1–P6. Engir blockerar í promptinu sjálfu.** Promptið er raunhæft og nægilega þröngt; P-atriðin lagfæra tvennt sem sandbox sýndi að það gerir ráð fyrir rangt (hvar netið slitnar og hvernig connector kemst í gegnum kjarnann). Engin ný rannsókn, engin Vegagerðar-fyrirspurn, ekkert net frá mér.

### Hvað ég sannreyndi (sandbox = mitt, Linux; CC-niðurstöður Windows eru EKKI fullyrtar)

Raunkjarni (óbreyttur geometryComposition.js) + raunverulegt pilot-gagnasafn (255 línur, tier 2), policy eins og promptið lýsir (VEGHLUTI 1/8 both; 3/4/6/7/5 forward; allt annað unknown; 0 af 255 línum ómappaðar), basis OWNER_APPROVED_MVP_ASSUMPTION:

| Átt | Niðurstaða (sandbox) |
|---|---|
| Rauðavatn → Selfoss | geometry_only, **44 984,770 m**, 11 slices (1436r, 1735r, 2071f, 2024f, 2117f, hringur 36807 f 2→4, 2135r, 52492f, 2138r, 52491f, 2138r). Sama lengd og undirected. |
| Selfoss → Rauðavatn | **unsupported / no_directed_path** án connectors |
| Hella → Rauðavatn | no_directed_path án connectors (sama orsök; utan umfangs) |
| Með EINUM connector (sjá P1) | Selfoss → Rauðavatn geometry_only, **45 101,810 m** (þar af connector 44,215 m), 9 slices (2138f, 2135f, 36807f 0→1, 2134f, 2116f, 2021f, connector, 1735f, 1436f). Rauðavatn → Selfoss óbreytt 44 984,770 m og notar ekki connectorinn. |

Python-óháð Dijkstra yfir sömu stefnumörkuðu brúnir gefur sömu lengd (45 101,8095 m) og raunkjarninn — tvær óháðar útfærslur sammála.

**Leiðrétting á fyrri ályktun minni:** Hellisheiðar-/B2-samskeytin eru EKKI það sem slítur netið í vesturátt. Hringur 36807 hefur hnútpunkt sem fellur nákvæmlega á upphaf 2134, svo vesturakbrautin (2134→2116→2021) tengist literal í gegnum hringinn. Eina rofið er við Rauðavatn-enda: síðasti hnútur 2021 (VEGHLUTI 6) (369314,313; 400649,381) ↔ sameiginlegur hnútur 1735/2071 (369350,3714; 400623,7933) = **44,215 m**. Næsti valkostur (1735-hnútur (369350,568; 400623,666)) er 44,45 m. Þetta er í samræmi við að andstæðar akbrautir eru 25–44 m frá hvor annarri (ályktun af rúmfræði, ekki skjalfest).

### Bindandi P-atriði

**P1 — Connector er nauðsynlegur og staðsetningin er þekkt. Byrja á minnsta athugun.** CC keyrir fyrst policy án connectors í báðar áttir og staðfestir að rofið sé þar sem ég lýsi (Selfoss→R1 og R1→Selfoss án B1/B2-viðbóta; B1/B2 millipunktar þarf ekki). Síðan EINN connector 2021-endi → sameiginlegur 1735/2071-hnútur, einstefna (2021-endi → 1735), lengd 44,215 m. Mörkin 45 m eru uppfyllt með 0,8 m svigrúmi: **ekki hækka þau hljóðlega**. Ef sjónræn skoðun sýnir að þetta eru ekki raunveruleg vegamót, eða annar tengipunktur >45 m þarf: STOP og skila mynd + minnsta vali eiganda (eins og prompt atriði 4 segir).

**P2 — Connector-líkan án kjarnabreytingar.** Kjarninn krefst tölulegs sourceId í policy (`isFiniteNumber` → streng-ID gefur `invalid_policy`; sandbox-staðfest). Notið *syntetíska línu* með frátekið tölulegt sourceId sem getur aldrei rekist á IDFERILL (sandbox: bæði `-1` og `900000001` virka; neikvætt er skýrara), tvö hnit (nákvæmlega hnútar 2021-endans og 1735/2071-hnútsins sem *bókstafleg* hnit úr gagnasafninu, ekki endurreiknuð), `idbutur`/IDFERILL ekki falsað, evidenceRef ekki WFS-lítandi (null eða skýr `pilot-connector:estimated`). Slice-úttak kjarnans hefur föst lyklasett, svo **API-lagið merkir** slices þar sem sourceId ∈ connector-mengi (`estimated: true`) og gefur upp samanlagða lengd connectora í envelope (`estimatedConnectorLengthM`). Pure-kjarni breytist ekki (sandbox sannar að þess þarf ekki); allar kjarnabreytingar eru utan umfangs nema CC sýni nauðsyn.

**P3 — Connector bara í pilot-pari, ekki í sameiginlega gagnasafnið.** Setja connector inn í directed-keyrsluna fyrir nákvæmlega reykjavik-raudavatn↔selfoss, ekki í `winter-route-geometry-pilot.json` línurnar (það breytir datasetVersion allra para og gæti breytt undirected leiðum annarra para). Sandbox með connector til staðar: undirected Selfoss→Hella (35 646,177 m) og R1→Hella (80 630,948 m) óbreytt, en directed R1→Hella væri 80 681,312 m — því MÁ API ekki beita policy á önnur pör. Prófa: óskyld pör skila sama geometryId/lengd og fyrir breytinguna (pinna núverandi gildi úr óbreyttu API), gamla API-samningnum óbreyttum.

**P4 — Útgáfumerking.** datasetVersion nær ekki yfir policy (aðeins lines/endpoints). policyVersion þarf því að breytast þegar reglur EÐA connector breytast (t.d. fastur strengur + hash af canonical reglum og connector-hnitum). Eitt próf: breyta connector-hniti eða reglu ⇒ policyVersion/geometryId breytist (CC staðfestir, ekki gert ráð fyrir). Engin cache.

**P5 — Prófin sanna að policy sé raunverulega notuð.** Lágmark: (a) báðar áttir continuous, endar = pinnuðu endapunktar, tolerance ≤0,01 m á lengdum; (b) vesturátt ≠ undirected-lengd (44 984,770) og inniheldur 2134/2116/2021 (ekki gamla undirected-slóðin), austurátt inniheldur 2071/2024/2117; (c) neikvætt próf: sama policy án connectors ⇒ `no_directed_path` fyrir Selfoss→R1 (sannar að connector sé eina ástæðan fyrir velgengninni); (d) öll forward-eingöngu slices (6/7/5/connector) í drawn-stefnu; hringur 36807 notar forward (austur 2→4, vestur 0→1); (e) connector merktur og lengd talin; (f) óskyld pör óbreytt (P3). Ekki all-pair/fuzz/mutation.

**P6 — Sjónræn heiðarleiki.** Mitt sandbox sér ekki kort; ég fullyrði ekkert um sjónrænt PASS. CC segir nákvæmlega hvað var skoðað (eða að ekki var skoðað). Skoðunarpunktar eiganda: (1) connector við (369314; 400649) → (369350; 400624): raunveruleg vegamót? (2) hringur 36807 við Hellisheiði: inn-/útakstur í báðar áttir; (3) Selfoss 2138/52491/52492 svæðið. Ef einfalda forsendan velur ranga akbraut: fáar sourceId-reglur fyrir þessa leið (prompt atriði 2) — og aðeins eftir sýnilega mynd.

### Athugasemdir (ekki blockerar)

- Engin sourceId-regla virðist þörf fyrir þessar tvær leiðir: forward-eingöngu bútar eru notaðir í drawn-stefnu og ekkert ómappað VEGHLUTI. Ekki bæta við reglum á ágiskun.
- Stefnuforsendan er áfram OWNER_APPROVED_MVP_ASSUMPTION; drivingAccess UNVERIFIED; ekki túlka sem opinbera staðfestingu.
- Stopp: þegar báðar leiðir virka og P5 próf standast, stoppa. Þetta er umferð 1; ég ræð frá þriðju umferð án eiganda.

**Næsta skref:** Ripley skrifar approved-prompt-v1.md með P1–P6 → eigandi: „Prompt approved" til CC.

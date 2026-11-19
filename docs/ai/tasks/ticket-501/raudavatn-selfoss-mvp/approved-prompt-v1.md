# #501 — Rauðavatn ↔ Selfoss MVP — approved prompt v1 — 2026-11-18

Jonesy APPROVED með bindandi P1–P6, engir blockerar. P1–P6 eru afrituð óbreytt neðar og ganga framar Round 1 þar sem nákvæmari. Sögulegur pending-review texti Round 1 er afgreiddur með þessum haus. Eigandi „Prompt approved“ + CURRENT READY_FOR_CC og pointer hingað heimilar framkvæmd; CC_IN_PROGRESS áður, CC_COMPLETE eftir skýrslu.

## Framkvæmdarafmörkun

Afhenda aðeins Rauðavatn↔Selfoss working pilot. Engin ný heimildaleit eða Vegagerðar-svar sem forsenda. Nota núverandi kjarna óbreyttan, pilot-policy og EINN explicit estimated connector ef sjónræn athugun styður tenginguna. Connector aðeins í þessum tveimur directed API-keyrslum, ekki sameiginlega runtime JSON. Ekkert annað staðapar, UI eða veður-/færðar-API breytist.

Jonesy sandbox-tölur eru viðmið til sjálfstæðrar keyrslu CC, ekki Windows- eða sjónræn staðfesting. P1 hnit og lengd þarf að lesa/stafa úr raunverulegum gagnasafnshnútum. Frátekið neikvætt synthetic sourceId er staðbundin auðkennisregla, aldrei kynnt sem IDFERILL; staðfesta að það rekist ekki á neina innlesna línu. Ekki falsa idbutur eða heimild. Pure-core breyting ekki nauðsynleg samkvæmt sandbox; engin optional hardening.

P1/P6 sjónræn takmörk ráða connector-samþykki: ef CC getur ekki skoðað raunveruleg vegamót á korti, afhenda opnanlega kortasýn og segja að connector bíði þeirrar athugunar. Ekki fullyrða að full pilot sé sjónrænt samþykktur eingöngu af því próf standast. Ekkert nýtt rannsóknarferli; sýna eiganda eina afmarkaða tengingu ef þarf. Staðbundin skoðunarsýn er heimil; engin ný dependency eða product-UI.

## Samþykkt Round 1

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

## Bindandi Jonesy P1–P6 (óbreytt afrit)

**P1 — Connector er nauðsynlegur og staðsetningin er þekkt. Byrja á minnsta athugun.** CC keyrir fyrst policy án connectors í báðar áttir og staðfestir að rofið sé þar sem ég lýsi (Selfoss→R1 og R1→Selfoss án B1/B2-viðbóta; B1/B2 millipunktar þarf ekki). Síðan EINN connector 2021-endi → sameiginlegur 1735/2071-hnútur, einstefna (2021-endi → 1735), lengd 44,215 m. Mörkin 45 m eru uppfyllt með 0,8 m svigrúmi: **ekki hækka þau hljóðlega**. Ef sjónræn skoðun sýnir að þetta eru ekki raunveruleg vegamót, eða annar tengipunktur >45 m þarf: STOP og skila mynd + minnsta vali eiganda (eins og prompt atriði 4 segir).

**P2 — Connector-líkan án kjarnabreytingar.** Kjarninn krefst tölulegs sourceId í policy (`isFiniteNumber` → streng-ID gefur `invalid_policy`; sandbox-staðfest). Notið *syntetíska línu* með frátekið tölulegt sourceId sem getur aldrei rekist á IDFERILL (sandbox: bæði `-1` og `900000001` virka; neikvætt er skýrara), tvö hnit (nákvæmlega hnútar 2021-endans og 1735/2071-hnútsins sem *bókstafleg* hnit úr gagnasafninu, ekki endurreiknuð), `idbutur`/IDFERILL ekki falsað, evidenceRef ekki WFS-lítandi (null eða skýr `pilot-connector:estimated`). Slice-úttak kjarnans hefur föst lyklasett, svo **API-lagið merkir** slices þar sem sourceId ∈ connector-mengi (`estimated: true`) og gefur upp samanlagða lengd connectora í envelope (`estimatedConnectorLengthM`). Pure-kjarni breytist ekki (sandbox sannar að þess þarf ekki); allar kjarnabreytingar eru utan umfangs nema CC sýni nauðsyn.

**P3 — Connector bara í pilot-pari, ekki í sameiginlega gagnasafnið.** Setja connector inn í directed-keyrsluna fyrir nákvæmlega reykjavik-raudavatn↔selfoss, ekki í `winter-route-geometry-pilot.json` línurnar (það breytir datasetVersion allra para og gæti breytt undirected leiðum annarra para). Sandbox með connector til staðar: undirected Selfoss→Hella (35 646,177 m) og R1→Hella (80 630,948 m) óbreytt, en directed R1→Hella væri 80 681,312 m — því MÁ API ekki beita policy á önnur pör. Prófa: óskyld pör skila sama geometryId/lengd og fyrir breytinguna (pinna núverandi gildi úr óbreyttu API), gamla API-samningnum óbreyttum.

**P4 — Útgáfumerking.** datasetVersion nær ekki yfir policy (aðeins lines/endpoints). policyVersion þarf því að breytast þegar reglur EÐA connector breytast (t.d. fastur strengur + hash af canonical reglum og connector-hnitum). Eitt próf: breyta connector-hniti eða reglu ⇒ policyVersion/geometryId breytist (CC staðfestir, ekki gert ráð fyrir). Engin cache.

**P5 — Prófin sanna að policy sé raunverulega notuð.** Lágmark: (a) báðar áttir continuous, endar = pinnuðu endapunktar, tolerance ≤0,01 m á lengdum; (b) vesturátt ≠ undirected-lengd (44 984,770) og inniheldur 2134/2116/2021 (ekki gamla undirected-slóðin), austurátt inniheldur 2071/2024/2117; (c) neikvætt próf: sama policy án connectors ⇒ `no_directed_path` fyrir Selfoss→R1 (sannar að connector sé eina ástæðan fyrir velgengninni); (d) öll forward-eingöngu slices (6/7/5/connector) í drawn-stefnu; hringur 36807 notar forward (austur 2→4, vestur 0→1); (e) connector merktur og lengd talin; (f) óskyld pör óbreytt (P3). Ekki all-pair/fuzz/mutation.

**P6 — Sjónræn heiðarleiki.** Mitt sandbox sér ekki kort; ég fullyrði ekkert um sjónrænt PASS. CC segir nákvæmlega hvað var skoðað (eða að ekki var skoðað). Skoðunarpunktar eiganda: (1) connector við (369314; 400649) → (369350; 400624): raunveruleg vegamót? (2) hringur 36807 við Hellisheiði: inn-/útakstur í báðar áttir; (3) Selfoss 2138/52491/52492 svæðið. Ef einfalda forsendan velur ranga akbraut: fáar sourceId-reglur fyrir þessa leið (prompt atriði 2) — og aðeins eftir sýnilega mynd.

# #501 raudavatn-selfoss-mvp — Jonesy result review — 2026-11-18

Yfirfarið: CC-skýrsla (`cc-report.md`), `assumptions.md`, `map-view.html`, `api/winter-route-geometry.js` + `.test.js`, `api/_lib/winterRoute/raudavatnSelfossMvpPolicy.js` + `.test.js`; óbreyttur kjarni (`geometryComposition.js`), `geometryDataset.js` og `winter-route-geometry-pilot.json` (stærðir/mtime óbreytt frá fyrri lotu).

## Niðurstaða

**PASS — engir blockerar.** Báðar raunleiðir eru réttar og nothæfar innan samþykkts MVP-umfangs; P1–P5 uppfyllt; P6 heiðarlega afgreitt (enginn sjónrænn PASS fullyrtur). Þrjár athugasemdir (F1–F3) eru valfrjálsar og opna ekki nýja lotu.

**Eitt opið atriði er eiganda, ekki CC/Jonesy:** að opna `map-view.html` og skoða connector-vegamótin, hring 36807 (Hellisheiði) og Selfoss-svæðið. Ég sé ekki kort; ekkert sjónrænt PASS kemur frá mér heldur.

## Merking: sandbox vs CC

- **Sandbox (mitt, Linux, vitest v3.2.7, node, python/pyproj):** allt merkt „sandbox“ hér að neðan.
- **CC-fullyrt (Windows, ekki endurkeyrt af mér):** ESLint hreint, `git status`/`git diff --check` hreint, 9 skrár / 151 próf með `npx vitest run` (þ.m.t. eldri winter-route/routes/segments/cache próf sem ég keyrði EKKI).

## Sandbox-staðfesting

1. **Próf:** `winter-route-geometry.test.js` (25), `raudavatnSelfossMvpPolicy.test.js` (14), `geometryComposition.test.js` (54, óbreytt), `geometryDataset.test.js` (11) = **104/104 PASS**. Kjarni og dataset byte-eins og í fyrri lotu.
2. **Raunverulegur handler, báðar áttir (sandbox, óháð CC-prófum):**
   - Rauðavatn → Selfoss: 200 `geometry_only`, **44 984,770 m**, 11 slices, 34 hnit, `mode: directed`, `estimatedConnectorLengthM: 0`.
   - Selfoss → Rauðavatn: 200 `geometry_only`, **45 101,810 m**, 9 slices, 38 hnit, connector (`-1`, `estimated: true`) nákvæmlega einu sinni, `estimatedConnectorLengthM` = 44,2147 m.
   - Báðar: fyrsta/síðasta hnit = pinnuðu endapunktarnir (nákvæm jafna), engin tvítekin samliggjandi hnit, hnitakeðjan endurreiknuð = `lengthM` (munur 0,000 m), `policyVersion` `raudavatn-selfoss-mvp-v1-a73f8191242a0938`, `drivingAccess: UNVERIFIED`. Tölurnar stemma við mitt umferð-1 sandbox (óháð Python-Dijkstra og raunkjarni).
3. **Policy virt (sandbox):** 0 brot — öll VEGHLUTI 3/4/5/6/7 slices (og connector) eru `forward` í teiknaðri stefnu; öll slices bera `appliedRule` + `directionBasis`. Austur notar 7-bútana 2071/2024/2117 („Hellisheiði til austurs“, teiknaðir austur), vestur 6-bútana 2134/2116/2021 („til vesturs“, teiknaðir vestur).
4. **Hringtorg (sandbox, rúmfræði):** 36807, 52491 og 52492 eru allir lokaðir og rangsælis (jákvætt signed area). Allar hringtorgsyfirferðir eru áfram í teiknaðri (rangsælis) stefnu: Hellisheiði austur 36807 2→4, vestur 0→1; Selfoss vestur fer 2138 1→3 og 5→6 sem eru bókstaflega sömu brúnir og hringirnir (52491 0→2, 52492 2→3→1), austur 52492 1→2 og 52491 2→4. Þetta er rúmfræðileg/vélræn athugun, ekki kortaskoðun.
5. **Óskyld pör (sandbox, P3):** R1→Hella 80 630,948 m og Hella→R1 80 630,948 m, Selfoss→Hella 35 646,177 m (geometryId `1e5ec24e…` óbreytt, pinnað frá geometry-api lotu), R1→R1 og Selfoss→Selfoss `same_place`, R1→Egilsstaðir óbreytt: engin `mode`/`policyVersion`/`estimatedConnectorLengthM` lyklar. Policy/connector eru ekki í sameiginlega JSON-inu.
6. **Connector (sandbox):** hnitin eru bókstaflega hnútar úr gagnasafninu (2021-endi, sameiginlegur 1735/2071-hnútur), 44,214688 m < 45 m; `-1` rekst ekki á línu; `idbutur: null`; `evidenceRef: "pilot-connector:estimated"`. Án connectors er vestur `no_directed_path` (neikvætt próf CC; ég staðfesti sjálfur í umferð 1).
7. **policyVersion (sandbox):** breytir bæði reglu og connector-hniti — að færa connector um 1 mm gefur annað `policyVersion` (`…a73f…` → `…1d3d…`). Kóðinn er réttur (sjá F2 um prófið).
8. **Kortasýn:** ég las `map-view.html` (Leaflet 1.9.4 af unpkg, OSM-tiles, engin ný dependency, engin Vegagerðar-köll). Öll 34 + 38 innbyggð WGS84-hnit endurreiknuð með **pyproj EPSG:3057→4326**: hámarksfrávik **0,006 m**; connector í 64,08396°N 21,67951°V ↔ 64,08375°N 21,67875°V; R1 og Selfoss-endapunktar rétt. Þetta staðfestir að ISN93→WGS84 umbreyting CC sé rétt; ég **opnaði ekki** síðuna í vafra og sé ekki rendered kort.

## Mutation á nýju kóðanum (sandbox, 23 mutantar)

Drepnir: 7→reverse, 6→reverse, hringur→both, connector reverse, óþekktur flokkur→both, par-predicate víkkað, policyVersion hunsar reglur, connector-hnit færð/ekki bókstafleg (2), connector `sourceId` árekstur, fölsuð `idbutur`, WFS-lík `evidenceRef`, handler sleppir policy, handler beitir á öll pör, `estimated` flaggi/lengd/mode+policyVersion sleppt, `drivingAccess` breytt.

Lifðu (raunverulegir): connector `both` í stað `forward` (afleiðingalaus á þessum tveimur pörum — vegna þess að 2021 er forward-eingöngu er connectorinn blindgata í austurátt; í reynd jafngildur mutant), policyVersion hunsar connector-hnit (F2), tvítekið samskeytahnit í `coordinates` (F3), `z`-gildi á samskeytahnitum (F1).

## Athugasemdir (allar valfrjálsar, ekki blockerar)

**F1 — z á samskeytahnitinu í vesturátt.** Vestur-`coordinates` hefur nákvæmlega eitt hnit með `z: null` (junction (369350,3714; 400623,7933)): connectorinn á `z: null` og `buildCoordinates` heldur síðasta hnútnum úr connector-sneiðinni, þótt 1735-hnúturinn sé `z: 0`. Austurátt hefur ekkert `null`. `z` er ekki hluti af tier-2 lengdarsamningi; hefur engin áhrif á XY, lengd, geometryId eða kortið. Eins línu lagfæring ef einhver notar z síðar (afrita `z` úr tengdum raunhnút).

**F2 — próf-/skýrslumunur á P4.** Prófið „policyVersion changes if a rule OR the connector's own coordinates change“ breytir aðeins reglu (`veghluti: 999`), ekki connector-hnitum, og skýrslan segir „verified by direct test: mutating either“. Kóðinn gerir rétt (staðfest handvirkt í sandbox, sjá lið 7), en connector-hlutinn er ekki prófaður (mutant M8 lifir). Valfrjálst: einu `expect` til viðbótar.

**F3 — engin próf-fullyrðing um tvítekin hnit/`z`.** Þau tvö frávik sem enginn próf grípur eru þau sem að ofan: tvítekið samskeytahnit og `z`. Hvorugt er sýnilegt á kortinu; ekki ástæða til lotu.

## Mörk þessarar yfirferðar

- Ekkert keyrt á Windows-vél eiganda; ESLint/git/eldri próf eru CC-fullyrt.
- Ekkert sjónrænt PASS: ég sá ekki kort. Hvort connectorinn sé raunveruleg vegamót, hvort hringirnir séu teknir rétt inn/út og hvort Selfoss-svæðið líti rétt út er eiganda að meta á `map-view.html`. Rúmfræðin (rangsælis forward, bókstaflegir hnútar, 44,2 m, sömu brúnir og hringir) bendir til að svo sé, en það er ekki sjón.
- Stefnuforsendan er áfram OWNER_APPROVED_MVP_ASSUMPTION; `drivingAccess: UNVERIFIED`; ekki opinber staðfesting og ekki turn-by-turn.
- Þetta lokar ekki #501 í heild og nær ekki öðrum pörum.

## Næsta skref

Ripley lokamat. Eigandi: opna `map-view.html` (connector, hringur 36807, Selfoss) og segja Ripley ef eitthvað lítur rangt út — þá er blocker (sýnileg röng leið), annars má loka áfanganum. Engin umferð 2 af minni hálfu; F1–F3 eru valfrjálsar.


## Ripley lokamat — 2026-11-18

**PASS fyrir tæknilega MVP-útfærslu; sjónræn afgreiðsla enn opin.** Jonesy PASS án blockera samþykkt. Sjálfstætt keyrt á raunverulegu Windows-checkout með Vitest 4.1.10: 9 skrár / 151 próf PASS; ESLint hreint á handler/prófi og pilot-policy/prófi; git diff --check hreint. Lesið pair-gating, MVP-reglur, connector-líkan og API-svarsmíði. Engin fullsuite/build eða sjálfstæð endurkeyrsla mutation/pyproj; þær niðurstöður eignaðar Jonesy.

Afhent: geometry API fyrir nákvæmlega Rauðavatn↔Selfoss með owner-approved MVP-forsendum, austur ~44,985 km, vestur ~45,102 km; áætluð 44,215 m tenging merkt estimated. Önnur pör halda gömlu samningi samkvæmt focused regression. Engin opinber heimild gerð að forkröfu og engin ný rannsókn/viðbótarprófaumferð. F1–F3 valfrjáls, ekki blockerar.

F2 skýrsluleiðrétting: prófið breytir reglu, ekki connector-hniti. Breyting connector-hnita á policyVersion var staðfest handvirkt af Jonesy; ekki fullyrt sem sjálfvirkt próf CC eða sjálfstæð staðfesting Ripley.

P6 óafgreitt: enginn þessara þriggja aðila hefur staðfest rendered kort. map-view.html tilbúið til skoðunar: áætluð tenging við Rauðavatn, hringur 36807 báðar áttir og Selfoss-svæðið. Ekki fullyrt að connector hafi verið staðfestur sem raunveruleg vegamót. Eigandi skoðar þessa þrjá punkta; sýnileg röng leið kallar á afmarkaða leiðréttingu, annars má loka þessum áfanga. CURRENT helst RESULT_REVIEW þar til sjónræn afgreiðsla kemur, ekki ný CC-umferð eða BLOCKED-staða. #501 í heild enn ólokið.

Ripley breytti aðeins skýrslu/workflow. Enginn kóði, commit, push, deploy eða GitHub-aðgerð.


## Eigandasamþykki og lokun MVP-áfanga — 2026-11-18

Eigandi opnaði virka kortasýn og staðfesti: „Sé þetta og það lítur vel út“, með skjáskot af leiðaryfirliti Rauðavatn↔Selfoss. Þetta er samþykki eiganda á sýndri MVP-kortasýn og afgreiðir sjónræna handoffið fyrir þennan áfanga. Skjáskotið er yfirlitsmynd; ekki fullyrt að nærmynd af hverjum connector/hringtorgi hafi verið skoðuð eða að opinber akstursheimild hafi verið staðfest.

**Endanlegt PASS — þessi MVP-áfangi CLOSED.** Fyrra tæknilega PASS (151 próf og lint) ásamt samþykki eiganda nægir innan bindandi MVP-umfangs. Engin frekari rannsókn eða review-umferð. Skráðar forsendur og estimated tenging haldast óbreytt. #501 í heild enn ólokið; engin GitHub-lokun, commit, push eða deploy.

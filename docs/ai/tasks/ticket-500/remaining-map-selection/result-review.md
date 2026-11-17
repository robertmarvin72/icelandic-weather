# #500 remaining-map-selection — result review

## Jonesy result review — umferð 1 (2026-11-16)

**Niðurstaða: NOT PASS aðeins vegna eins prófs sem fellur; vörugögnin sjálf eru PASS.** CC gat ekki keyrt vitest í sínu umhverfi og sagði það hreinskilnislega; ég keyrði prófin og eitt þeirra fellur. Lagfæringin er þrjár línur í prófi (OQ1). Engin gagnabreyting nauðsynleg. Stage → RESULT_REVIEW.

### Sandbox-staðfest (mitt, engin netköll)

- **selections.json:** 50 afgreiðslur; **fyrri 23 bókstaflega óbreyttar** (deep-equal og sama röð, þar á meðal `previous_disposition` hjá Reyðarfirði/Fáskrúðsfirði); 27 nýjar = nákvæmlega valda mengið í candidate-review.json. Allar 27: SELECTED_PRODUCT_APPROACH, `MAP_PRODUCT_APPROVED_VIA_PROMPT`, EXACT_GAP, idferill/stored_field og WGS84 stemma við manifest (<1e-8°), `map_reference` = map-review.md, `map_observation` (RIPLEY_VISUAL_CHECK, rétt URL, athugun), `approach_is` = manifest, `approach_en` til staðar, engin tilbúin fjarlægðartala. `source.database`: `acquisition-raw` (25) og `road-links` (2, með `native_xy`, `native_crs`, `wgs84_derivation`).
- **places.json:** 56/56 í sömu röð; **nákvæmlega 27 breyttar (= valda mengið), 29 óbreyttar** (þar á meðal fyrri 27 með punkt og `keflavik`/`thorshofn`); 54/56 með hnit, aðeins `keflavik` og `thorshofn` null. Hnit og approach = selections; state `ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED`, `selection_basis`, `selectionReference` réttar; eldri reference-reitir varðveittir; `coordinateDerivationReference` á báðum native.
- **OR1-orðalag í gögnum, bæði í `map_recommendation_reason` og `connectionStatus.reason`:** Akranes „2,5“/„21441“/„óleyst“; Dalvík „3501“/„innri“; Kirkjubæjarklaustur „2409“/„óleyst“; Höfn „982“/„3170“ með „EKKI notaður“; Kópavogur „gegnumveg“ og „gatnamót“ kemur hvergi fyrir; Hafnarfjörður nefnir afturkallaðan 2807 START. Aðrar server_data-skrár og southConnections.test.js óbreytt (mtime).
- **Prófin í mínu umhverfi (vitest 4.1.12, Node 22; 13 hlaðanlegar prófaskrár, `forecastFetch.test.js` hleðst ekki í mínu afriti — utan lotu):** **200/201 PASS, 1 fellur** (sjá OQ1). Sjö gagnasöfnin: 118/119. Með þrem línum lagfærðum í mínu afriti: **201/201 og 119/119**. Önnur prófin sem CC breytti (places, remainingCoverage, acquiredGeometry, approachAnalysis, placeEvidence) eru græn og aðlögun þeirra er afmörkuð (undirmengi 25/27 í eigin `SELECTED_PRODUCT_APPROACH_IDS`).
- **Mutation-próf á afriti (40 breytingar, með lagfæringu OQ1 í mínu afriti):** 35 greinast, 5 sleppa. Greinast m.a.: hnit fært 2e-7° og 5e-7° (OR2 virkar), rangur endi/idferill, Hafnarfjörður 2807 endurvakinn, native 50 m færður, `native_crs` rangt, rangt `source.database`, `selection_basis` rangt/fjarlægt, SUPPORTED/ROUTABLE, `CC_VISUAL_CHECK`, tilbúin 0–10 m tala, `map_reference` breytt, OR1-orðalag fjarlægt (Akranes, Dalvík, Kirkjubæjarklaustur), „gatnamót“ hjá Kópavogi, „staðfest aðkoma“ hjá Dalvík, „bæjarmörk“ hjá Akranesi, `approach` ≠ `approach_is`, tómur `approach_en`, hnit á Keflavík, afgreiðsla á Þórshöfn, eldri val fært, `previous_disposition` fjarlægt, `selectionReference`/`coordinateDerivationReference`/`coverageReference` fjarlægð, víxluð hnit.

**CC-eignað (ekki keyrt af mér):** ESLint á 6 prófskrám, `git diff --check`, `git status`, eigin 145 atriða Python-samanburður (144/145; 1 falsk-jákvæð í eigin regex), og fullyrðingin að `vitest run` bili í CC-umhverfinu fyrir allar prófaskrár (Node 24.11 vs CI-Node 20). Ég get ekki staðfest umhverfi CC; í mínu (Node 22) keyrir vitest án vandkvæða.

### Kröfur

- **OQ1 — nauðsynleg lagfæring: próf fellur.** `approachSelections.test.js`, prófið „distinguishes prompt-approved map selections, retained-approved selections, map-junction selections, and the earlier owner-selected places (four categories, not a binary)“ (línur ~625–641): `for (const p of places)` fer í `else`-grein sem krefst `selection_basis === undefined` fyrir hvern stað sem er ekki í MAP/RETAINED/JUNCTION-listunum, svo allir 27 nýju staðirnir falla: `expected 'MAP_PRODUCT_APPROVED_VIA_PROMPT' to be undefined`. Áhrif: prófasvítan er rauð (CI). Minnsta lagfæring — bæta grein á undan `else`:
  ```js
  } else if (EXPECTED_PRODUCT[p.id] || EXPECTED_PRODUCT_NATIVE[p.id]) {
    expect(p.selection_basis).toBe("MAP_PRODUCT_APPROVED_VIA_PROMPT");
  } else {
  ```
  (og titillinn „four categories“ → „five“). Ég staðfesti að þessi eina breyting gerir allar 201 próf græn í mínu afriti. Þetta er afleiðing þess að CC gat ekki keyrt prófin — rétt skráð sem opið atriði í skýrslunni, en ekki hægt að samþykkja sem PASS á meðan það fellur.
- **OQ2 — ætti að lagast í sömu umferð (ódýrt; ekki gagnabreyting sem breytir niðurstöðu):** 
  1. **Prófið pinnar ekki map-URL á hvern stað.** Línur ~205 og ~405 athuga aðeins `^https://www.openstreetmap.org/`; sé URL Húsavíkur og Kópaskers víxlað sleppur það (M16). Approved-prompt krafðist „map-URL fylgi réttum stað“. Sama atriði og OP1 í síðustu lotu (þá aðeins fyrir tvö gatnamót). Lagfæring: fastur listi (eða `mlat`/`mlon` í URL = `wgs84` hvers staðar, ≤1e-7°).
  2. **`source`-reiturinn vantar `file`/`sha256`/`objectid`/`tier`.** Approved-prompt (liður 3) sagði „skýr source.database/file/OBJECTID/tier/SHA … með réttri beinni raw-skrátilvísun“; færslurnar bera aðeins `database`, `idferill`, `stored_field`. OBJECTID og „tier −1“ standa í `map_recommendation_reason`; raw-skrá er aðeins nefnd hjá Skaftafelli/Kirkjubæjarklaustri (í `wgs84_derivation.native_source`); SHA kemur hvergi fyrir og er heldur ekki prófað (prompt: „Staðfesta nákvæma raw-endahnúta/source/tier/SHA“). Ég staðfesti sjálf að allar 27 SHA/OBJECTID/tier stemma við raw (sjá prompt-yfirferð), svo þetta er rekjanleiki, ekki röng gögn. Lagfæring: bæta `file`, `sha256`, `objectid`, `tier: -1` við `source` hjá öllum 27 (gildin eru í candidate-review.json) og SHA-athugun í prófi — eða Ripley merkir þetta sem samþykkt frávik.
  3. **`connectionStatus.reason` í places hjá 26 af 27 nefnir ekki Ripley** („eftir kortaráðleggingu (MAP_PRODUCT…)“); aðeins Kópavogur nefnir „Ripley-kortaskoðun“. Approved-prompt (liður 5) bað um „Ripley-kortastoð“. Ekkert ósatt (selections-færslurnar nefna Ripley), en bæta „Ripley-kortastoð“ í textann.
  4. **Innsláttarvilla í topp-`note` í places.json:** „Þershöfn“ á að vera „Þórshöfn“ (og „Keflavík bær“ er í textanum þótt place heiti „Keflavík“).
- **OQ3 — valfrjáls herðing:** M08 `wgs84_derivation.parameters` Kirkjubæjarklausturs er óvarið (aðeins Skaftafell prófað); M23 „EKKI notaður“ hjá Höfn er ekki pinnað því prófið leitar að hvaða „EKKI“ sem er; M37/M38 topp-`note` (fjöldi) óvarin; `wgs84_derivation.validation` hjá nýju native-færslunum fullyrðir að endurútreikningur hafi verið gerður „this round“ gegn 5 retained pörum — CC-eignuð fullyrðing, ég staðfesti hnitin sjálf en ekki þessa setningu.
- **Athugasemd (ekki krafa): CURRENT.md breyttist úr CRLF í LF.** Fyrir lotuna var skráin 766/766 línur CRLF; nú 0 CRLF og 770 LF. Líklega skrifuð af CC-verkfæri; veldur heildar-diffi. Ég skrifa mína handoff-línu í LF til að blanda ekki; ef eigandi vill CRLF aftur er það sérstakt, lítið atriði.

### Takmörk

Kortaskoðun 27 punkta er Ripley-heimild sem ég hef ekki séð; engin ytri graph-tenging, stefna, opnun né akstursleið er staðfest. Enginn staður er SUPPORTED/ROUTABLE; EXACT_GAP á öllum. 54/56 með punkt; `keflavik` og `thorshofn` óleyst (engin retained source-geometry; krefst sérstakrar eigandaheimilaðrar öflunar). #500 er áfram opið.

### Næsta skref

Lagfæra OQ1 (þrjár línur) — og helst OQ2 í sömu umferð. Ripley hefur sjálfstætt vitest (laga prófakóða beint eins og síðast) eða lítil CC-lagfæring í umhverfi þar sem vitest keyrir (Node 20 samkvæmt CI). Engar gagnabreytingar nauðsynlegar fyrir utan valfrjálsu `source`-reitina og „Þórshöfn“-innsláttinn. Svo Ripley lokamat. Þetta er fyrsta result-review umferð þessarar lotu.

## Ripley lokamat — 2026-11-16

**PASS eftir beinar OQ1/OQ2-leiðréttingar. Lota CLOSED; #500 áfram opinn.**

Fimmti selection_basis-flokkurinn bættur í eldra prófið sem féll. Rekjanleiki27 source-færslna fullgerður með file/sha256/objectid/tier, hvertSHA borið beint við heimildarskrá. Markpróf sannreynir source-feature/hnút, rétt map-URL per stað (hnit í URL), Ripley í reason og native CRS/vörpunarfæribreytur beggja native-punkta. Þórshafnar-innsláttur leiðréttur í topp-note. Hnit/source-endaval óbreytt, eldri val ekki snert. Aðrar valfrjálsar OQ3-tillögur ekki gerðar að nýju verki.

Sjálfstætt staðbundið Vitest4.1.10 keyrt á **allri api/_lib/winterRoute/**: **215/215 PASS,15 skrár**. ESLint á sex snertum prófskrám og git diff --check hrein; aðeins line-ending-viðvörun um CURRENT. Fyrri CC-verkfærabilun er ekki endurtekin eða skýrð af þessari keyrslu; prófin keyra nú rétt hér. Jonesy fyrir/eftir-samanburður á gömlu23 selections og29 óbreyttum place-færslum er Jonesy-eignaður. Kortaskoðunin er fyrri Ripley-heimild, ekki ný CC/Jonesy-sjónstaðfesting. Engin ný netköll, dependency eða review-lota.

Nú54 af56 með punkt, aðeins Keflavík bær/Þórshöfn án. Allir56 halda sér. Enginn SUPPORTED/ROUTABLE; ytri tengingar/stefna/opnun óstaðfest, Akranes/Dalvík/Kirkjubæjarklaustur/Höfn halda afmörkuðum fyrirvörum. Frá/Til-/leiðarvél enn óafhent. Engin ný öflun fyrir hina2 sjálfkrafa, enginn commit/push/GitHub eða #500-lokun.

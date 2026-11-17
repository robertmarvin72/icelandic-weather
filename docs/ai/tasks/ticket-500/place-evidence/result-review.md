# #500 place-evidence — result review

## Jonesy result review — umferð 1 (2026-11-15)

**Niðurstaða: EKKI PASS eins og skilað er — tveir sýndir blockerar (OF1, OF2) með litlum beinum lagfæringum; engin ný leit/öflun nauðsynleg.** Heiðarlegu hlutarnir eru traustir (kostnaðarbókhald, NOT_CHECKED_THIS_RUN, Ísafjörður-hindrun, Keflavík ≠ KEF, engin supported/routable). Vandinn er sá að staðhæfingar sem byggja eingöngu á ólesnum leitarbrotum fá stöðuna CONFIRMED, og að ein þeirra (Hafnarfjörður) er gerð að kandídat fyrir eigandann. Stage → RESULT_REVIEW. Ég sótti ekkert af vefnum og dæmi ekki um innihald vegagerdin.is/umferdin.is; allt hér að neðan er um samræmi gagna, geometry og prófa.

### Hvað er sandbox-staðfest (mitt) og hvað CC-eignað

**Sandbox (mitt, afrit í scratch, engin netköll):**
- Vitest 4.1.12: placeEvidence (12) + places/remainingCoverage/southConnections/acquiredGeometry/approachAnalysis (57) = **69/69 PASS**.
- 29 target-ID = mitt óháða mengi (25 PRECISE_GAP + keflavik/skaftafell/thorshofn/kirkjubaejarklaustur); hinir 27 hafa enga tilvísun; allir 56 til staðar; KEF og Keflavík aðskilin.
- Samanburður við fyrri útgáfur: `places.json` og `remaining-coverage.json` eru **eins og áður** að frátöldum 29 nýjum reference-reitum hvor; `approach-analysis.json` er eins og Ripley-leiðrétta útgáfan að frátöldum einum reit (`hafnarfjordur.place_evidence_reference`; stærð 30 675 → 30 785 B, nákvæmlega þessi lína). Fullyrðingin „fyrri snapshot óbreytt“ stenst — en **prófið sannreynir hana ekki** (það athugar aðeins fjölda/auðkenni og að hinir 27 hafi enga tilvísun; ég sannreyndi með samanburði).
- Bókhald: 12 leitarlínur og 9 opnanir í `search-ledger.md` = `search_budget` í JSON; innan 12/24. Tölumisræmið sem CC fann sjálfur (11 → 9) er leiðrétt í JSON/skýrslu.
- Hafnarfjörður-kandídat: hnit (64.08379213, −21.9441883) = nákvæmlega START-hnútur raw-stykkis IDFERILL 2807, OBJECTID 5116, raw-BATCH-7, VEGNR 415, tier −1. Hnit/auðkenni eru því rétt skráð; vandinn er í rökstuðningnum (OF1).
- Mutation-próf á afriti (17 breytingar, kjarni prófa + eldri söfn): 9 greinast (rangt OBJECTID, hnit fært, staða lækkuð með kandídat, kandídat á NOT_CHECKED, heimildir tæmdar, tilvísun fjarlægð, connectionStatus SUPPORTED, eldri coverage-staða, eldra heiti), **8 sleppa** (sjá OF3).

**CC-eignað (ekki keyrt af mér):** vitest 166/166 á allri möppunni, ESLint, `git diff --check`, `git status`, og öll vefleit/-opnun og innihald þeirra (ég get ekki sannreynt það).

### Blockerar

**OF1 — Hafnarfjörður-kandídatinn (`CONFIRMED_WITH_CANDIDATE`, „RECOMMENDED“ í addendum) er ekki studdur af heimildinni.**
- *Heimildin:* aðeins eitt leitarbrot (leit 8), **ekki opnað** („not independently re-opened“), engin URL/titill/dagsetning varðveitt — prompt-ið segir leitarniðurstöðubrot nægja ekki eitt og krefst URL/titils. Brotið nefnir **fjögur** gatnamót á Hafnarfjarðarvegi (Lyngás, Álftanesvegur, Fjarðarhraun, Arnarnesvegur) án þess að tengja bæinn við neitt þeirra; valið á Álftanesvegi kemur úr STADARLYSING-texta („Álftanesvegur að Garðahraunsvegi“), sem er stoð en ekki sönnun (OC3).
- *Geometry:* START 2807 snertir **engan** annan endapunkt: næstu eru 2810 END 7,06 m, 10284 START 9,78 m, 2910 END 13,37 m (VEGNR 40). Þetta er nærmiss, ekki samnýtt hnit — sama lexía og Akranes (OD1). Rökstuðningur CC („A að B“-röð „seen elsewhere in this dataset“) er óþarfur og veikari en gögnin; hann viðurkennir sjálfur „textual reading, not an independently re-measured seam“.
- *Staðsetning:* þetta er upphaf hliðarvegar (415) á miðjum Hafnarfjarðarvegi, 1,9 km norðan við miðbæ; vegur 40 heldur áfram ~0,75 km sunnan við miðbæ (10287/10288). Ekkert segir að þetta sé aðkoma að bænum frekar en Fjarðarhraun/Lyngás sem heimildin nefnir líka. Þetta er sama gerð og OD1: innri liður á gegnumvegi settur fram sem aðkomuhnútur.
- *Áhrif:* ný „ráðlögð“ tillaga bætist í eigandayfirlitið (16 → 17 kandídatar) án raunverulegs stuðnings; eigandi gæti samþykkt hana.
- *Minnsta lagfæring:* taka `candidate` af Hafnarfirði (staða á við OF2), skrá í `geometry_gap` að 2807 START er 7,06/9,78/13,37 m nærmiss við vegi 40 og að heimildin nefnir fjögur gatnamót án vals; leiðrétta talningu 17 → 16 í `owner-decisions-addendum.md`, `cc-report.md` og `evidence.md`; fjarlægja „RECOMMENDED“-orðalag. Hafnarfjörður má vera áfram í „authority“-flokki sem veikt/leitarbrots-stig (OF2). Engin ný leit þarf.

**OF2 — „CONFIRMED_AUTHORITY…“ er notað fyrir staðhæfingar sem byggja á ólesnum leitarbrotum án URL.**
- *Fullkomlega snippet-eingöngu:* **Hvammstangi** („Hvammstangavegamót“, Búland), **Mosfellsbær** (2007-skýrsla: „main route into Mosfellsbær“) og Hafnarfjörður. Heimild: aðeins fyrirspurn („see search-ledger.md“), engin URL/titill/dagsetning.
- *Blandað:* **Þórshöfn** (gatnamót Langanesvegar/Norðausturvegar) og **Skagaströnd** (stöð 7380, 2023-11-06) — síðan sem var opnuð staðfestir aðeins verkefnisheiti („Um Brekknaheiði“, „Skagastrandarvegur (74) …“, „Framkvæmd lokið“); gatnamótaupplýsingarnar sjálfar komu úr leitarbroti. JSON setur „directly verified“ yfir bæði.
- *Rétt staðfest með opnun:* Skaftafell (998, 1,88 km), Höfn (hringtorg við Hafnarveg/Nesjahverfi), Súðavík (area-level, rétt merkt).
- *Samræmi:* prompt-ið krefst að vegheiti með bæjarstofni („Hvammstangavegur“, „Skagastrandarvegur“) og leitarbrot nægi ekki eitt; CC notaði 9 af 24 opnunum (15 ónotaðar) og `evidence.md` segir opnanir „used efficiently… without a separate open“ — það er einmitt það sem reglan bannar.
- *Áhrif:* gögn í vörunni segja „confirmed authority“ um staðhæfingar sem enginn getur endurtekið (engin slóð), og seinni lota gæti byggt á þeim.
- *Minnsta lagfæring (ein af tveimur, Ripley/eigandi velur):* (a) endurmerkja Hvammstanga, Mosfellsbæ og Hafnarfjörð sem leitarbrots-stig (sama fjölskylda og `LEAD_NOT_INDEPENDENTLY_VERIFIED` hjá Keflavík) og skipta Þórshöfn/Skagaströnd í „opnað: verkefni“ og „leitarbrot: gatnamót“; eða (b) CC notar ≤4 af ónotuðum 15 opnunum til að opna skjölin og vista URL/titil/tilvitnun. (a) er nóg fyrir PASS; (b) er kostur ef eigandi vill fá raunverulega staðfestingu. Leiðrétta „efficiently“-setninguna í `evidence.md`.

### Ábendingar (ekki blockerar)

- **OF3 — prófin (aðeins þau atriði sem fylgja OF1/OF2 eru nauðsynleg).** Sleppa í gegn: (M3) kandídat endurbeint samkvæmt á annað raunverulegt stykki (Dalvík 3567) með réttu id/OBJECTID/hnit — prófið tengir ekki kandídat við stað/veg/snertingu; (M7/M12) CONFIRMED-staða með heimild án URL eða með uppspunna staðreynd og fyrirspurn eingöngu; (M8) CONFIRMED_WITH_CANDIDATE án kandídats; (M18) ógild stöðutexti; (M16) `place_evidence_reference` í analysis bendir á rangan stað; (M17) `disposition` RECOMMENDED án kandídats í analysis (eldra bil í approachAnalysis-prófi, ekki CC). Nauðsynlegt með OF1/OF2: ein staðfesting á leyfðum stöðugildum, og að CONFIRMED_AUTHORITY krefjist ≥1 heimildar með `url` (annars leitarbrots-staða). Ef kandídat helst (hann ætti ekki að gera það): krefjast nákvæmrar snertingar við stykki með annað VEGNR/heiti. Hitt er valfrjáls herðing.
- **OF4 — skjalasamræmi (leiðrétta þegar skrárnar eru snertar hvort eð er).** (a) `search-ledger.md`: tilvísanir „(open 5/6/10/11)“ eiga að vera opnanir 6/7/8/9. (b) JSON-tímastimpill Hafnarfjarðar-heimildar 01:12:00Z vs leit 8 í ledger 01:14:40Z; Skaftafell/Þórshöfn/Höfn/Skagaströnd: „see search-ledger.md“ í stað raunverulegrar fyrirspurnar/URL. (c) `cc-report.md`: „authority found for 11 of 29“ — staðreyndir eru 8 (1 + 6 + 1 area-level); hin 3 eru leiðbeining/óskýr/lokuð. (d) addendum segir „RECOMMENDED“ en JSON „CONFIRMED_WITH_CANDIDATE“. (e) Eldra: í `approach-analysis.json` (Hafnarfjörður-note) stendur IDBUTUR 814640037 fyrir 3073/2910/2823; raw og acquired-geometry hafa 914500037 (sama flokkur og OD3) — laga ef skráin er snert vegna OF1.
- **Rétt og skal haldast:** 18 NOT_CHECKED_THIS_RUN án staðhæfingar um skort; Ísafjörður merktur hindrun án framhjáhlaups; Keflavík-bærinn sem „lead, 404“ án ályktunar; engin ný WFS-/hnit-öflun; driving access EXACT_GAP.

### Takmörk

Ég hef ekki sótt vefinn og met ekki hvort fullyrðingar um vegamót eru réttar; aðeins samræmi heimildarstigs, gagna, geometry og prófa. Þetta er ekki afstaða til #500 í heild: enginn staður er SUPPORTED/ROUTABLE/OWNER_SELECTED og 18 af 29 voru ekki skoðaðir. Þetta er fyrsta result-review umferð; eftir lagfæringu OF1/OF2 ætti ein stutt lokayfirferð að duga, ekki ný lota.

### Næsta skref

Ripley (eða CC) lagar OF1 og OF2 beint í `winter-route-place-evidence.json`, addendum/evidence/cc-report og þeim prófum sem þeim fylgja (og OF4 sem fer með); engin ný leit nema eigandi velji (b). Svo „CC búinn“ eða Ripley-lokamat; ekki þriðja umferð án eigandaákvörðunar.

## Ripley lokamat — 2026-11-15

**PASS eftir beina OF1/OF2-lagfæringu; þessi afmarkaða lota CLOSED, #500 áfram opinn.**

Hafnarfjarðar-kandídat tekinn út; Hafnarfjörður/Hvammstangi/Mosfellsbær og blandaðar Þórshafnar-/Skagastrandarheimildir merktar LEAD_NOT_INDEPENDENTLY_VERIFIED. Hjá síðustu tveimur er opnað verkefnisheiti/stöðulýsing aðskilið frá óstaðfestum gatnamótaupplýsingum. Engin ný leit/opnun. Skaftafell/Höfn áfram með opnaðar heimildir samkvæmt CC; Súðavík aðeins svæðisstaðreynd. Niðurstaða: 2 staðfestar vegheimildir án hnitingar, 6 leads, 1 svæðisstaðreynd, 1 óljós, 1 tólahindrun, 18 óskoðaðir; enginn nýr kandídat.

OF3: markviss próf hafna óleyfilegum stöðugildum, CONFIRMED án opnaðrar URL-heimildar og endurkomu óstudds kandídats. OF4: ledger-opnunartilvísanir/tímastimpill leiðrétt, IDBUTUR 914500037 leiðrétt í Hafnarfjarðar-note, skýrslur/talningar samræmdar. Fyrri 17/16 kandídatatalning var röng: núverandi approaches-yfirlit telur 7 ráðlagða og 7 tvívalstaði, auk tilvísana í 9 eldri óvalda staði; ekki fjöldi emitted hnita. Upprunaleg CC-skýrsla varðveitt undir skýru superseded-merki.

Sjálfstætt keyrt: staðbundið Vitest 4.1.10, sex gagnasöfn (placeEvidence/places/remainingCoverage/southConnections/acquiredGeometry/approachAnalysis), **70/70 PASS**; ESLint á snertu JS hreint; git diff --check hreint. Vefleit, efni opnaðra síðna, UTC-skráning og stærri 166-prófa keyrsla eru áfram CC-eignuð; engin sjálfstæð vefsannprófun gerð. Git status inniheldur eldri ókommittuð gögn/yfirferðir, ekki staðfesting á að allt þar tilheyri þessari lotu.

Allir 56 haldast, engin stöðuhækkun/eigandaval eða ný Frá/Til-/leiðarvél. Engin ný review-lota eða öflun ræst. Enginn commit/push/GitHub.

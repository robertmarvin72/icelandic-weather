# #500 — Festa 11 valda vörupunkta eftir kortayfirferð

## Ripley initial prompt — umferð 1, 2026-11-15

**Til Jonesy-yfirferðar, engin framkvæmdarheimild enn.** Þetta er eitt lítið gagnaverk eftir kortayfirferð, ekki ný almenn rannsókn. Eigandi bað um að færa ráðleggingarnar í venjulegt prompt-vinnuferli. Jonesy yfirfer hér bæði ráðleggingagrunn og framkvæmanleika þess að festa þessa nákvæmu 11 punkta.

## Markmið og eigandahandoff

Festa eftirfarandi 11 punkta sem valdar **vöruaðkomur** í núverandi 56-staða vöruskrá. Fyrir Reyðarfjörð og Fáskrúðsfjörð skráist að núverandi tillögupunktur er ekki valinn vegna staðsetningar; þeir haldast óafgreiddir. Allir 56 staðir haldast.

Þetta draft eða APPROVED frá Jonesy eitt velur enga punkta fyrir eigandann. Eftir APPROVED býr Ripley til approved-prompt og READY_FOR_CC. Nýtt eiganda „Prompt approved“ til CC er þá samþykki framkvæmdar **þessa tiltekna 11-punkta vöruvals**, án þess að eigandinn þurfi að afgreiða A/B-punkta í kortatæki. Engin sérstök önnur samþykktarlykkja þarf. Fyrri tíu tillögur úr owner-selection-proposal.md eru utan þessarar afhendingar og ekki sjálfsamþykktar.

## Lesa fyrst og staðfesta grunninn

AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md. Síðan:

- docs/ai/tasks/ticket-500/approaches/plain-language-recommendations.md — rök á mannamáli og kortaslóðir. Kortaskoðun er Ripley-eignuð; ekki eigna CC nýja vefsannprófun.
- server_data/winter-route-places.json og núverandi places.test.js.
- server_data/winter-route-approach-analysis.json, winter-route-south-connections.json, winter-route-remaining-coverage.json og próf þeirra; raw-gögn eftir source-tilvísunum.
- place-evidence/result-review.md — óstuddur Hafnarfjarðar-kandídat afturkallaður; má ekki endurvekja.

Fyrsta raunpróf er staðbundinn samanburður á einum valpunkti (t.d. Þingeyri 2272 START) við raunverulegan raw-endahnút og núverandi place-færslu. Staðfesta síðan hina tíu á sama einfalda hátt. Enginn nýr rannsóknarrammi, validator-framework eða netleit á undan þessu. Ef raw-punktur/endi/auðkenni stenst ekki er það sýndur blocker: skrá nákvæmlega misræmið og stoppa frekar en að skipta um staðsetningu sjálfkrafa.

## Nákvæmt val — ekki velja eftir A/B-heiti einu

| Staða-ID | Source-stykki / geymdur endi | WGS84: breidd, lengd | Fyrirliggjandi source-skrá |
|---|---|---|---|
| `thingeyri` | 2272 START | 65.8665326, -23.47396873 | `approach-analysis` |
| `bildudalur` | 2273 START | 65.67709936, -23.61288347 | `approach-analysis` |
| `saudarkrokur` | 2485 END | 65.74380077, -19.62028698 | `approach-analysis` |
| `varmahlid` | 2477 END | 65.55340044, -19.44533505 | `approach-analysis` |
| `patreksfjordur` | 53127 START | 65.58993681, -23.97181157 | `approach-analysis` |
| `talknafjordur` | 2889 END | 65.62399623, -23.81359943 | `approach-analysis` |
| `keflavikurflugvollur-kef` | 3488 END | 63.99929831, -22.62803395 | `approach-analysis` |
| `selfoss` | 2138 START | 63.93759503, -21.00380428 | `south-connections` |
| `hella` | 3591 START | 63.83460817, -20.40236144 | `south-connections` |
| `hvolsvollur` | 3593 END | 63.75128586, -20.23549109 | `south-connections` |
| `reykjahlid-myvatn` | 3566 START | 65.63990944593598, -16.910730687949837 | `remaining-coverage` |

Hin tíu WGS84-hnitin eru endurnýtt bókstaflega úr viðeigandi candidate. Reykjahlíð er sérstök: 3566 START hefur native EPSG:3057 [596178.6007, 572933.0514]; WGS84 í töflu er ný vörpun þess sama varðveitta hnúts, ekki nýtt geometry eða hnit af kortasmelli. Varðveita native-hnit/source og merkja vörpunina. Nota fyrirliggjandi lausn ef hún er til; annars nægir lítil staðbundin Lambert-vörpun með GRS80, lat_1=64.25, lat_2=65.75, lat_0=65, lon_0=-19, x_0=y_0=500000. Engin ný dependency. Sannreyna vörpunina gegn nokkrum óháðum varðveittum native/WGS84-pörum úr south-connections; frávik ≤1e-7 gráðu. Ekki setja önnur hnit til að láta próf standast.

## Framkvæmd — minnsta varanlega breytingin

1. Ný `server_data/winter-route-approach-selections.json` með nákvæmlega 13 afgreiðslum: 11 `SELECTED_PRODUCT_APPROACH` með source-ID/endi, hnitum, source-tilvísun, stuttri mannamálslýsingu og `access_status: EXACT_GAP`; 2 `CURRENT_CANDIDATE_NOT_SELECTED` án valinna hnita. Ekki búa til nýtt almennt kerfi; þetta er einföld skrá yfir valið.
2. Á **aðeins þessum 11** í `winter-route-places.json`: setja coordinates og stutta íslenska approach-lýsingu samkvæmt mannamálsráðleggingunum; nota núverandi state `ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED`, með ástæðu sem aðgreinir vöruval og óstaðfest aðgengi. Bæta nákvæmri source-tilvísun í selections-skrána við provenance, án þess að fella út eldri reference-reiti. Ekki sýna A/B eða innri kóða sem aðkomulýsingu. Almenn note á places má uppfæra til að lýsa að nú séu 15 valdir punktar (4 eldri + 11 nýir) og 41 óvalinn.
3. Reyðarfjörður 2520 START og Fáskrúðsfjörður 2536 START fá aðeins óvalda niðurstöðu í nýju selections-skránni: sá fyrri er á gegnumvegi utan réttrar bæjartengingar, sá síðari við göng utan byggðar. Places-færslur beggja haldast óbreyttar með null-hnitum/approach. Enginn nýr staðgengilspunktur, engin eyðing staðanna eða lokun #500.
4. Eldri analysis/coverage/acquisition/south/place-evidence-gögn eru sögulegar athuganir og haldast óbreytt. Ný selections-skrá og places-val ráða vöruvali framvegis; ekkert gamalt `RECOMMENDED` eða `candidate` er endurskrifað til að láta líta út fyrir nýja staðfestingu.

Kortamat styður **vöruval**, ekki opinber bæjarmörk, ytri graph-tengingu, leyfða stefnu eða núverandi opnun. Enginn staður verður SUPPORTED/ROUTABLE. Selfoss 30,1 m og Hella 32,63 m source-bil haldast sérstaklega óleyst í ástæðu/selections; ekki brúa eða fela þau. Aðra einangraða source-kafla má velja sem vörupunkt án þess að fullyrða að þeir séu tengdir leiðarvél. Hér er engin notenda-UI-innleiðing; staðalisti er enn óinnbundinn gagnagrunnur fyrir síðar samþykkt Frá/Til-flæði.

## Markviss sannprófun

- Ný `api/_lib/winterRoute/approachSelections.test.js`: óháður væntingalisti yfir þessi 11 source-ID/enda og hina 2 óvöldu; emitted hnit tengd raunverulegum raw-source-hnútum, ekki aðeins nýju skránni sjálfri. Native-vörpun Reykjahlíðar sannreynd sem að ofan.
- Beri places-val við sama fasta væntingalista: nákvæmlega 11 breyttar staðafærslur, 45 aðrar bókstaflega óbreyttar; nöfn/ID/svæði/röð/aliases allra 56 óbreytt, KEF≠Keflavík, fjögur eldri hnit óbreytt. Nota einfaldan fyrir/eftir samanburð í CC-skýrslu; ekki nýtt snapshot-framework.
- Aðlaga eldri places/remainingCoverage/southConnections/acquiredGeometry/approachAnalysis/placeEvidence-próf **aðeins þar sem þau krefjast nú úrelts null/state fyrir valda 11**. Nota skýra óháða undantekningu fyrir þessi nákvæmu ID, krefjast réttra valinna hnita/state hjá þeim og halda null-kröfu hjá óvöldum. Ekki fella niður próf eða leyfa hvaða non-null punkt sem er. Source-/SHA-/samskeytapróf eldri gagna haldast.
- Nýjar raunverulegar neikvæðar athuganir: rangur geymdur endi/hnit, valinn Reyðarfjarðar- eða Fáskrúðsfjarðarpunktur, staða sem fullyrðir routability, óheimil breyting á öðrum stað. Ekki próf sem endurtaka bara implementation.
- Keyra nýtt safn og ofangreind sex gagnasöfn; ESLint á snertum JS, git diff --check. Engin frontend-suite/build/vafraregression fyrir þessi óinnbundnu gögn.

## Afhending og mörk

Leyfðar vöruskrár: ný selections-skrá, places.json og fyrrnefnd próf þar sem raunverulega þarf. Nýjar staðbundnar hjálparskrár aðeins undir docs/ai/tasks/ticket-500/approach-selection/, ásamt cc-report.md og CURRENT.md. CC-skýrsla lýsir 11 völdum/2 óvöldum, source-sannprófun/vörpun og raunverulega keyrðum prófum; greinir Ripley-kortamat frá eigin niðurstöðum. Eldri prompt/review/skýrslusaga og raw/ledger eru óbreytanleg.

Engin ný netleit, WFS/API-öflun, dependency, delegation, UI, route engine, scoring/forecast/gating/greiðslubreyting, GitHub-aðgerð, commit/push eða deploy. Ef rétta punkta fyrir hina tvo þarf að sækja er það sérstakt afmarkað verk með eigandaheimild, ekki hliðarskilyrði þessarar afhendingar. Ekki loka #500 sjálfkrafa.

CC keyrir aðeins approved-prompt sem CURRENT vísar á eftir eigandahandoff; READY_FOR_CC → CC_IN_PROGRESS → CC_COMPLETE og skráir cc-report. Jonesy yfirfer niðurstöðu, Ripley lokamet. Stöðva eftir rétt val og viðeigandi græn próf; valfrjáls herðing tefur ekki. Fyrir þriðju review-umferð gildir eiganda-checkpoint README.

## Jonesy review — umferð 1 (2026-11-15)

**Niðurstaða: APPROVED án skilyrða** (OG1–OG3 eru stuttar skýringar sem mælt er með að Ripley taki beint inn í approved-prompt; OG4 valfrjálst; ekki ný review-lota). Stage helst PROMPT_REVIEW. Prompt-ið er afmarkað (11 punktar, ný lítil selections-skrá, engin ný öflun), byrjar á einum samanburði við raw, heldur Reyðarfirði/Fáskrúðsfirði óvöldum og bannar nýtt framework. Þetta APPROVED velur enga punkta; það segir aðeins að grunnur og framkvæmd standast. „Prompt approved“ frá eiganda er afhending til CC. Ég gerði engin netköll og dæmi ekki um kortamat Ripley (OpenStreetMap-yfirferð er Ripley-eignuð).

### Sandbox-staðfest (mitt)

- **Hnit og endar stemma.** Allir 7 acquisition-punktar (Þingeyri 2272 START, Bíldudalur 2273 START, Sauðárkrókur 2485 END, Varmahlíð 2477 END, Patreksfjörður 53127 START, Tálknafjörður 2889 END, KEF 3488 END) eru nákvæmlega candidate í `approach-analysis.json` (sama hnit á 8 aukastöfum, sama idferill/stored_field) **og** nákvæmlega sá hnútur/endi á tier −1 raw-stykkinu (raw-BATCH-1/2/5, raw-PROBE-KEF). Allt línustykki, ekki hringir. Þingeyri/Bíldudalur/Sauðárkrókur/Varmahlíð hafa 0,0 m snertingu við annað nafngreint stykki; Patreksfjörður, Tálknafjörður og KEF snerta ekkert innan 40 m (einangruð stykki, eins og prompt-ið segir).
- **Selfoss/Hella/Hvolsvöllur:** hnitin eru nákvæmlega WGS84 candidate í `south-connections.json`, og native-hnitin (2138 START 401739,85/383119,047; 3591 START 430972,1263/370845,6043; 3593 END 439003,2622/361386,4806) eru nákvæmlega start/end-dálkarnir í `road-links.csv` (hinir endarnir sömuleiðis chain-walk-v4 entry/exit). Bil 30,1 m / 32,63 m eru í heimildinni eins og prompt-ið segir.
- **Reykjahlíð 3566 START:** native (596178,6007; 572933,0514) = `road-links.csv`. Lambert-færibreytur prompt-ins (GRS80, 64,25/65,75, 65, −19, 500000) eru rétt ISN93-skilgreining: sjálfstæð innleiðing mín og pyproj gefa báðar 65,63990944593598 / −16,91073068794984 — töflugildi stemmir (frávik < 1e-13°). Sama formúla ber alla 11 retained suðurpör með mesta fráviki 2,3e-8° (< 1e-7° viðmið prompt-ins).
- **Staðan í dag:** þessir 11 hafa `coordinates: null`, `approach: null` og 5 ólík state-gildi (7 ACQUIRED_*/CANDIDATE_*, 3 APPROACH_CANDIDATE_PROPOSED, 1 RETAINED_CANDIDATE_NAME_MATCH_INFERRED); 4 eldri valdir (R1/E1/S2/C) eru með hnit; 56 → 15 valdir/41 óvaldir stemmir. Reyðarfjörður/Fáskrúðsfjörður hafa enn null og haldast óvaldir.
- **Mat á umfangi próf-lagana:** á afriti þar sem aðeins þessi 11 fá hnit/approach/state fá **8 próf í 5 söfnum** (places 3, acquiredGeometry 2, approachAnalysis 1, remainingCoverage 1, southConnections 1) til að falla — nákvæmlega þau sem krefjast null/gamals state; placeEvidence (70/70 núna) er ósnert. Það passar við „aðlaga aðeins þar sem krafist er úrelts null/state“.

### Athugasemdir

- **OG1 — merkja uppruna vals, svo 4 eigandavaldir og 11 vörupunktar blandist ekki (mælt með).** `ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED` þýðir í dag „eigandavalin mót“ (approach-textar R1/E1/S2/C segja „eigandavalin“). Nýju 11 eru valdir af Ripley á korti og framkvæmdir við „Prompt approved“. Prompt-ið heimilar sama state; þá þarf hver ný færsla (og selections-skráin) að bera skýran `selection_basis`-streng (t.d. „MAP_RECOMMENDATION_APPROVED_VIA_PROMPT“) og approach-lýsing má ekki segja „eigandavalin“. Ein setning í prompt-inu; próf: nákvæmlega 4 færslur með eigandavals-orðalag.
- **OG2 — Selfoss og Hella eru valdir á hinn endann en `RECOMMENDED` í south-connections (mælt með).** Þar er END merkt RECOMMENDED (samfelld snerting) og START ALTERNATIVE_NOT_RECOMMENDED (30,1 m / 32,63 m bil); Ripley velur START vegna nálægðar við byggð (≈0,5 km frá Selfossi, ≈0,2 km frá Hellu miðað við bæjarmiðju; óformleg áætlun mín, ekki gagn). Valið er vöruákvörðun og prompt-ið segir bilin haldast óleyst, en selections-ástæðan á að segja berum orðum: „valið er endinn sem south-connections merkir ALTERNATIVE; valinn vegna nálægðar við byggð, ekki samfellu; bil að næsta stykki er X m“. Annars les hver sem les báðar skrárnar mótsögn. Eldra south-evidence breytist ekki.
- **OG3 — nefna hvaða skrár staðfesta hvern punkt (ein setning).** Sjö punktar: `acquisition/samples/raw-*.json` tier −1 (hnit = start/end-hnútur); Selfoss/Hella/Hvolsvöllur og Reykjahlíð: native-endar í `road-links.csv` (+chain-walks-v4) og WGS84 úr south-connections / Lambert-vörpun. Þetta tryggir að próf bera saman við raunverulega heimild, ekki selections-skrána sjálfa — sem prompt-ið krefst þegar.
- **OG4 (valfrjálst) — KEF: ekki orða punktinn sem „við flugstöðina“.** 3488 END (63,9993; −22,6280) er vesturendi Reykjanesbrautar-keðjunnar (heiti stykkisins er „Hafnavegur - Flugstöð“), ≈1,9 km frá flugstöðvarbyggingu (óformleg landfræðileg áætlun mín, ekki staðfest gagn) og vestan við hringtorgin sem keðjan fer um; hinn kosturinn (3552 START) er ≈3,5 km. Valið er rétt „nær en hinn“, en lýsingin í selections/places ætti að segja „vesturendi veg 41 í keðjunni nálægt flugstöðinni“, ekki „aðkoma að flugstöð“. Breytir engu um samþykki.
- **Rétt og skal haldast:** fyrsta próf á einum punkti áður en hinir; blocker ef raw/endi stenst ekki; Reyðarfjörður/Fáskrúðsfjörður óvaldir án staðgengils; engin eldri RECOMMENDED endurskrifuð; Selfoss/Hella-bil ekki brúuð; enginn SUPPORTED/ROUTABLE; Hafnarfjörður-afturköllun virt; KEF ≠ Keflavík; 45 aðrar færslur bókstaflega óbreyttar.

### Takmörk

Ég met ekki hvort kortavalið sé rétt (það er Ripley-eignað og vöruákvörðun eiganda), né nýja aðgengis-/stefnuheimild; hvort tveggja er EXACT_GAP áfram. Vörpun Reykjahlíðar er sönnuð gegn sömu retained pörum, ekki gegn nýjum netsvörum. Ef Ripley breytir mengi (11), endum eða hnitum þarf nýtt mat.

### Næsta skref

Ripley tekur OG1–OG3 (og OG4 ef vill) inn í approved-prompt í einni setningu hver; síðan sendir eigandi „Prompt approved“ til CC. Engin önnur Jonesy-umferð nauðsynleg.

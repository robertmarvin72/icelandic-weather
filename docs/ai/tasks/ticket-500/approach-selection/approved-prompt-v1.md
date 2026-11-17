# #500 — Festa 11 valda vörupunkta eftir kortayfirferð

## Approved prompt v1 — 2026-11-15

**Jonesy APPROVED án skilyrða; OG1–OG4 skýringar teknar inn. Keyranlegt aðeins eftir nýtt eiganda „Prompt approved“ til CC meðan CURRENT er READY_FOR_CC.** Þetta er eitt lítið gagnaverk eftir kortayfirferð, ekki ný almenn rannsókn. Eigandi bað um að færa ráðleggingarnar í venjulegt prompt-vinnuferli. Jonesy hefur yfirfarið gagnagrunn og framkvæmanleika þess að festa þessa nákvæmu 11 punkta; kortamat er áfram Ripley-eignað.

## Markmið og eigandahandoff

Festa eftirfarandi 11 punkta sem valdar **vöruaðkomur** í núverandi 56-staða vöruskrá. Fyrir Reyðarfjörð og Fáskrúðsfjörð skráist að núverandi tillögupunktur er ekki valinn vegna staðsetningar; þeir haldast óafgreiddir. Allir 56 staðir haldast.

Samþykki Jonesy eitt velur enga punkta fyrir eigandann. Þetta approved-prompt og READY_FOR_CC vísa á afmörkuðu afhendinguna. Nýtt eiganda „Prompt approved“ til CC er þá samþykki framkvæmdar **þessa tiltekna 11-punkta vöruvals**, án þess að eigandinn þurfi að afgreiða A/B-punkta í kortatæki. Engin sérstök önnur samþykktarlykkja þarf. Fyrri tíu tillögur úr owner-selection-proposal.md eru utan þessarar afhendingar og ekki sjálfsamþykktar.

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

## Skýringar úr samþykktri yfirferð (OG1–OG4)

- **OG1 — uppruni vals:** hver ný afgreiðsla í selections-skrá og hver af þessum 11 places-færslum fær `selection_basis: MAP_RECOMMENDATION_APPROVED_VIA_PROMPT`; approach-textar þeirra mega ekki segja „eigandavalin“. Fjögur eldri eigandavals-orðalög haldast óbreytt og próf greinir þau frá þessum ellefu kortaráðleggingum sem verða staðfestar með eigandahandoff.
- **OG2 — Selfoss/Hella:** segja skýrt í selections-ástæðu og connectionStatus.reason að valinn START-endi sé merktur `ALTERNATIVE_NOT_RECOMMENDED` í sögulegri south-connections-skrá, valinn nú vegna nálægðar við byggð fremur en samfellu; bil að næsta stykki sé áfram 30,1 m / 32,63 m. Ekki breyta eldri RECOMMENDED/ALTERNATIVE-merkingu.
- **OG3 — beinar source-heimildir:** sjö acquisition-punktar sannreynast við geymdan start/end-hnút tier −1 í `docs/ai/tasks/ticket-500/acquisition/samples/raw-*.json`; Selfoss/Hella/Hvolsvöllur og Reykjahlíð við native start/end í `docs/ai/tasks/ticket-493-place-network/samples/road-links.csv` (og `chain-walks-v4.json` þar sem við á), ásamt WGS84 í south-connections eða staðfestri Lambert-vörpun Reykjahlíðar. Prófin mega ekki nota nýju selections-skrána eina sem sannleiksgildi.
- **OG4 — KEF-lýsing:** lýsa 3488 END sem „vesturenda vegar 41 í keðjunni nær flugstöðvarsvæðinu“, ekki sem punkt við flugstöðvarbygginguna eða staðfesta flugstöðvaraðkomu. Engin ný fjarlægðartala eða aðgengisfullyrðing þarf.

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

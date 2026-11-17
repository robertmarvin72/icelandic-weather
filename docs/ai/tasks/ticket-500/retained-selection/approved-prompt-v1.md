# #500 — Festa síðustu 10 fyrirliggjandi aðkomutillögur

## Approved prompt v1 — 2026-11-16

Jonesy APPROVED án skilyrða; OI1–OI2 skýringar teknar inn. Keyranlegt aðeins eftir nýtt eiganda „Prompt approved“ til CC meðan CURRENT er READY_FOR_CC. Eigandi samþykkti að Ripley yfirfæri þessar tíu fyrirliggjandi tillögur og setti fram eitt afmarkað MVP-framkvæmdarprompt. Ekki senda eigandann aftur í A/B-hnitaval.

## Markmið og handoff

Bæta þessum nákvæmu tíu vörupunktum í núverandi staðagrunn með sama einfalda gagnamynstri og síðasta PASS-lota, án nýrrar rannsóknar eða app-innleiðingar. Eftir afhendingu verða 25 af 56 með valinn punkt (15 eldri + 10 nýir), 31 óvalinn. Allir 56 staðir halda sér; enginn verður SUPPORTED/ROUTABLE.

Jonesy APPROVED samþykkir framkvæmdargrunn en er ekki eigandaval. Ripley gerir þá approved-prompt og READY_FOR_CC; nýtt eiganda „Prompt approved“ til CC heimilar nákvæmlega þetta tíu-punkta vöruval. Engin önnur punktasamþykktarlykkja þarf. Engin breyting á 11 síðast völdum eða fjórum eldri eigandapunktum; ekki vinna að Reyðarfirði/Fáskrúðsfirði í þessari lotu.

## Lesa fyrst

AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md. Síðan:

- server_data/winter-route-places.json og winter-route-approach-selections.json.
- docs/ai/tasks/ticket-500/approach-selection/result-review.md: síðasta PASS og OH1–OH3-leiðréttingar eru núverandi grunnur, ekki eldri CC-skýrsla ein.
- docs/ai/tasks/ticket-500/approaches/owner-selection-proposal.md: aðeins fyrstu tíu tillögurnar eiga við; síðari 13-staða frestun þar er úrelt, sjá síðustu PASS-lotu.
- server_data/winter-route-approach-analysis.json, winter-route-south-connections.json og winter-route-remaining-coverage.json ásamt beinum source-gögnum sem vísað er á hér neðar.

## Nákvæmt val

| Place-ID | Stykki / geymdur endi | WGS84: breidd, lengd | source.database |
|---|---|---|---|
| `grindavik` | 53459 START | 63.85083976, -22.43242783 | `approach-analysis` |
| `bolungarvik` | 2215 START | 66.14305273, -23.2225211 | `approach-analysis` |
| `siglufjordur` | 3564 START | 66.1605843, -18.90330291 | `approach-analysis` |
| `olafsfjordur` | 15361 END | 66.06730376, -18.65429271 | `approach-analysis` |
| `vopnafjordur` | 3707 END | 65.7641206, -14.82399559 | `approach-analysis` |
| `grundarfjordur` | 3774 START | 64.92345384, -23.27382147 | `approach-analysis` |
| `olafsvik` | 2698 START | 64.90014373, -23.72850184 | `approach-analysis` |
| `hveragerdi` | 2135 END | 63.99538228, -21.19270972 | `south-connections` |
| `vik` | 3849 START | 63.41782798, -19.00028197 | `south-connections` |
| `borgarnes` | 2819 END | 64.55996252, -21.89753371 | `remaining-coverage` |

## Ripley-yfirferð — hvað liggur þegar fyrir

Þetta er **retained-gagnayfirferð**, ekki ný kortaskoðun eða vefrannsókn. Sjö efstu eru einvalstillögur úr leiðréttri RECOMMENDED-greiningu: ég bar hverja við nákvæman start/end-hnút tier −1 í acquisition-raw, og öll sjö hnit/endar stemma. Samskeyti sýna vegagerð gögnanna en sanna ekki bæjarmörk eða aðgengi.

- Grindavík: source-punktur við samskeyti við Norðurljósavegur–Grindavík. Engin fullyrðing um núverandi opnun eða færð.
- Bolungarvík: source lýsir Bolungarvíkurgöng–Grundarkambur; einföld vöruaðkoma við tengingu gangakaflans.
- Siglufjörður: source lýsir Hólavegur–Hafnarvegur, með tengingu við Siglufjörður–Strákagöng.
- Ólafsfjörður: source lýsir Aðalgata–Hornbrekka og tengingu við Ólafsfjörður–Vermundarstaðir.
- Vopnafjörður: source lýsir Leiðarhafnarvegur–Norðausturvegur, með tengingu við Vopnafjörður–Skógavegur.
- Grundarfjörður: 3774 START við 2059; gamla END-tillagan var innri framhaldspunktur og er ekki endurvakin.
- Ólafsvík: 2698 START við 2617; gamla 2740 END-tillagan er ekki endurvakin.
- Hveragerði: eldri eini kandídat, nafnaályktun á vestasta enda retained suðurkaflans. **34,75 m bil að Hellisheiðarkafla áfram óleyst.** Ekki lýsa sem miðbæ eða nákvæmum bæjarmörkum.
- Vík: eldri eini kandídat, **innri samskeyti 3849/23041**, ekki endapunktur núverandi föstu runtime-leiðar; hún heldur um 629 m austur. Þetta er meðvitað vöruval, ekki ný ytri tenging.
- Borgarnes: sama hnit og #491 P4, nákvæmur END-hnútur 2819 í retained WGS84; fyrri ccw_short/cw_long-fyrirvari helst. Endurnýting er ekki ný leiðar-/aðgengissannprófun.

Fyrir Hveragerði/Vík/Borgarnes bar ég native-endana við road-links.csv; fyrir Borgarnes einnig WGS84 við #491 raw. Engin hnit framleidd eða færð. Þetta mat er Ripley-eignað; CC þarf aðeins eigin afmarkaða source-staðfestingu hér að neðan.

## Skýringar úr samþykktri yfirferð (OI1–OI2)

- **OI1 — sýnileg staðarlýsing:** approach-lýsing Víkur skal segja „Punktur á þjóðvegi í Vík, við innri samskeyti vegkafla“, Hveragerðis „Punktur vestast á varðveitta vegkaflanum við Hveragerði“ og Borgarness „Endapunktur Borgarnes–Baulan-vegkafla“. Nota samsvarandi varfærni í ensku. Ekki kalla þessa þrjá punkta staðfestar bæjaraðkomur, miðbæ eða bæjarmörk; 34,75 m / 629 m / cw_long-fyrirvarar haldast í reason eins og áður. Prófa þetta afmarkaða orðalagsinntak svo staðsetningarval verði ekki ósönn aðkomufullyrðing.
- **OI2 — Vopnafjörður:** END á 3707 snertir bæði samnefnt 3671 og Vopnafjörður–Skógavegur 3182; ef samskeyti eru sannreynd skal bera nákvæma snertingu og rétta seam_with_name við **3182**, ekki velja fyrsta snertistykki eftir röðun. Ekki endurskrifa eldri analysis-snapshot.

## Framkvæmd — endurnýta það sem er til

1. Fyrsta raunpróf: einn punktur, t.d. Bolungarvík 2215 START, við raw tier −1 og núverandi null-færslu áður en nokkuð er skrifað. Síðan staðfesta hina níu á sama einfalda hátt. Sjö acquisition-punktar: `docs/ai/tasks/ticket-500/acquisition/samples/raw-*.json`. Hveragerði/Vík: native start/end í `docs/ai/tasks/ticket-493-place-network/samples/road-links.csv`, WGS84 bókstaflega úr south-connections. Borgarnes: CSV-native END + `docs/ai/tasks/ticket-491/final-validation/samples/wfs-vesturland-4326.json`, IDFERILL2819/tier−1/OBJECTID5082. Ekki nota nýju selections-skrána eina sem sönnun.
2. **Bæta tíu færslum í núverandi** winter-route-approach-selections.json. Endurnýta núverandi schema: SELECTED_PRODUCT_APPROACH, source.database/idferill/stored_field, hnit, stutt íslensk/ensk aðkomulýsing eftir því mynstri sem þar er og access_status EXACT_GAP. Engin önnur selections-skrá eða almennt selection-framework. Eldri 13 afgreiðslur (11 valdir + 2 óvaldir) haldast nákvæmlega óbreyttar. Heild nú23 afgreiðslur =21 valinn vörupunktur +2 óvaldar tillögur.
3. **Uppruni vals** á bæði hverri nýrri selections-færslu og hverri þessara tíu places-færslna: `selection_basis: RETAINED_CANDIDATE_APPROVED_VIA_PROMPT`. Ekki nota MAP_RECOMMENDATION_APPROVED_VIA_PROMPT um þessa retained-yfirferð eða kalla punktana „eigandavalin“. Eldri11 halda sínu MAP-merki og4 upphaflegir punktar sínu orðalagi.
4. Á aðeins þessum tíu í places.json: fylla coordinates og stutta mannamáls-approach-lýsingu, nota núverandi `ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED`, selectionReference í rétta selections-færslu og skýra ástæðu. Varðveita alla eldri reference-reiti. Almenn note má uppfæra í25 valda/31 óvalinn. Ekki breyta öðrum46 staðafærslum, þar á meðal síðustu15 völdum og Reyðarfirði/Fáskrúðsfirði.
5. Í reason/recommendation-ástæðu fyrir Hveragerði skal nefna nafnaályktun og óleyst34,75m bil; fyrir Vík innri samskeyti og að runtime-leiðin heldur629m austur; fyrir Borgarnes endurnýtt P4 og ósannreynda cw_long-tengingu. Nota provenance/source eða reason fyrir tæknifyrirvara, stutta skýra staðarlýsingu í approach. Ekki færa punkt, brúa bil eða fullyrða akstursleiðarvalhæfni.

Engin ný UI-innganga verður til í þessu gagnaverki. Núverandi Frá/Til-staðagrunnur er óinnbundinn; notendaflæði/leiðarvél eru sér verk. Ekki kynna þessa afhendingu sem nothæfa landsdekkandi leiðarþjónustu.

## Markviss próf og viðtaka

Framlengja núverandi approachSelections.test.js með óháðum föstum væntingalista fyrir **þessa tíu** til viðbótar við eldri11; aðgreina source og selection_basis þeirra. Prófa nákvæma enda/hnit við ofangreindar beinar heimildir, samanburð á selections/places og varðveislu eldri13 afgreiðslna. Prófa raunverulegt rangt endaval/hnit, rangt source.database, óheimila breytingu á eldri vali og ósannaða routability. Enginn almennur validator eða ný test-framework.

Aðlaga null/state/count/reference-kröfur í núverandi places/remainingCoverage/southConnections/acquiredGeometry/approachAnalysis/placeEvidence/approachSelections-prófum aðeins þar sem þessir tíu gera þær úreltar. Nú eru15→25 hnit,41→31 null,11→21 selectionReference. Í approachSelections-prófi þarf sérstaklega að láta nýju tíu bera RETAINED-merki, eldri11 MAP-merki og hina35 ekkert selection_basis. Gamlar kröfur um að allir aðrir en11 hafi engan selection_basis eru ekki lengur gildar; ekki eyða merkingarsannprófun til að fá græn próf.

Engin víð undantekning „non-null er leyfilegt“. Nákvæmir fastir source-punktar fyrir alla21 vörupunkta, eldri4 óbreyttir, hinir31 null. Eldri source-/SHA-/samskeyta-/vörpunarpróf og OH1–OH3-kröfur haldast. Nýja10-settið skarast ekki við29 targets í placeEvidence; aðlaga það safn aðeins ef raunveruleg krafa þarf breytingu, annars láta ósnert.

CC tekur einfaldan fyrir/eftir-samanburð: nákvæmlega tíu staðafærslur breyttar,46 óbreyttar, eldri13 selections-afgreiðslur óbreyttar. Allir56 með sama ID/heiti/aliases/svæði/röð, KEF≠Keflavík, enginn SUPPORTED/ROUTABLE. Nefna rekjanleika Hveragerði/Vík/Borgarnes í cc-report.

Keyra ofangreind sjö gagnasöfn, ESLint á snertum JS og git diff --check. Engin frontend-suite/build/vafraregression fyrir óinnbundin gögn. Þegar þessar afmörkuðu kröfur standast er verkið búið.

## Leyfðar skrár, stoppskilyrði og skil

Aðeins winter-route-places.json, winter-route-approach-selections.json og ofangreind próf eftir raunverulegri þörf. Nýjar staðbundnar hjálparskrár/cc-report undir docs/ai/tasks/ticket-500/retained-selection/ og CURRENT.md. Eldri gagnasnapshot (analysis/coverage/south/acquisition/place-evidence), raw/ledger og fyrri workflow-saga óbreytt. Nýjar skýrslur ekki búnar til á hvern stað.

Ef eitthvert tilgreint source/endi/hnit stenst ekki: skrá raunverulegt misræmi og stoppa, ekki skipta um punkt eða sækja ný gögn sjálfkrafa. Aðgangs-/stefnugöt sem þegar eru skráð hindra ekki staðsetningarval eitt og sér; þau mega heldur ekki kallast leyst. Engin ný vefleit/WFS/API/hnitaöflun/dependency/delegation/UI/route-engine/scoring/forecast/gating/greiðslubreyting. Enginn commit/push/GitHub/deploy eða lokun #500.

Eftir Jonesy APPROVED gerir Ripley approved-prompt og READY_FOR_CC. CC bíður nýs eigandahandoffs „Prompt approved“, staðfestir CURRENT og fer CC_IN_PROGRESS → CC_COMPLETE með cc-report. Jonesy result-review og Ripley lokamat samkvæmt README; ekki nýjar valfrjálsar rannsóknar-/herðingarlykkjur. Fyrir þriðju yfirferð sömu afhendingar þarf eiganda-checkpoint.

# #493 access-points — leiðréttingarprompt til yfirferðar

2026-11-10, Ripley. Umferð 2 eftir REVISE í result-review.md (H1–H8).
Þetta er yfirferðardrög, ekki framkvæmdarheimild. approved-prompt-v1.md er óbreytt og sögulegt. Ný approved-prompt-v2.md verður aðeins til eftir Jonesy APPROVED.

## Umfang og forsendur

Lestu AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md, approved-prompt-v1.md, cc-report.md og result-review.md. G1–G8 standa með neðangreindum leiðréttingum. Aðeins offline leiðrétting afhentra gagna, validators og skjala undir þessari verkefnismöppu og CURRENT.md. Engin app/API-breyting, ný gögn, net, hnitavörpun, dependencies, delegation, GitHub, commit eða push. Production NOT_TESTED. Engin ný endpoint-, akstursheimildar- eða release-ákvörðun. Akureyri C stendur; 72-staða marklistinn er PROPOSAL.

Varðveittu v1 úttök, reglur, skriftur og hash-skrár óbreytt. Notaðu nýjar v2-skrár eða v2-undirmöppu með skýrri leiðbeiningu um authoritative úttök. cc-report.md og result-review.md eru append-only. Skráðu v2-reglur og hash þeirra áður en bygging er keyrð. Reglur þurfa að tilgreina nákvæma numeric-reiti, node_role og áttarreglu. Keyrðu validator-neikvæð viðmið áður en ný lokaúttök eru skrifuð.

## H1 — sama hnit, sami hnútur, sama vegalengd

Bættu við skýru node_role ENTRY/EXIT og stored_field START/END (eða aðskildum entry/exit dálkum). Hnit og báðir cum-grunnar verða að tilheyra sama cw_long-skrefi og sama hlutverki. Fyrir Selfoss 2138, Hellu 3591 og Hvolsvöll 3593 sýndu sérstaklega phase-1 ENTRY gegn phase-2 EXIT; varðveittu báða sem merkt candidate-records í stað þess að velja nýjan staðarendapunkt. Fyrir Vík 3849, Fáskrúðsfjörð 2536, Reyðarfjörð 2520 og Reykjahlíð 3566 varðveittu phase-1 stored START/EXIT sem skýrt heimildabundið viðmið. Engin hljóðlaus staðarendapunktsákvörðun. Egilsstaðir ENTRY og Akureyri C EXIT eiga áfram að vera samræmd.

Validator verður að lesa ENDANLEGA afhenta CSV/JSON-færslu og bera hnit, piece-id, hlutverk, reit og merkt cum-par saman við retained geometry og sjálfstæðan fram-/aftursummuútreikning. Ekki nægir að sannprófa millifærslu. Vikmörk 0,1 m; gap_into_m og 1436 nákvæmlega einu sinni. Próf með orðréttri afhentri rangri Selfoss-röð verður að falla. Prófaðu einnig hlutverka-, hnita-, merkja- og tvítalningarvillur á fleiri en einu stykki. Ósannprófað cum er null/NOT_VALIDATED, Borgarnes utan cw_long áfram þannig.

## H2 — Reykjavík úr skrefi 0

Afleiddu lengd og báða enda 1436 úr cw_long skrefi 0, rev END→START. ENTRY/stored END: incl 0, excl mínus lengd 1436 (um −2,5601 km). EXIT/stored START: incl lengd 1436, excl 0. Ekki klippa neikvætt rannsóknaroffset. Ekkert harðkóðað 2560.1497. Bæði endaviðmið eru óvaldir Rauðavatns-candidates; Reykjavíkurkjarni áfram NO_COORDINATE_SOURCE. Staðfestu bæði (gildi, merki)-pör og hnit í lokaúttaki. Neikvætt próf með afhentum víxluðum offsetum verður að falla. Skráðu að fyrra G3-orðalag Jonesy um START/END var ónákvæmt og leiðrétt í result review.

## H3 — numeric schema nær yfir öll úttök

Sama finite-number/null regla fyrir alla skilgreinda hnit-, lengdar- og cum-reiti, líka nested endpoint-candidates JSON, ekki aðeins tvo CSV-dálka. Notes geyma texta. Hnútur 2345 fær rétt skilgreindar tölur eða null/NOT_VALIDATED ef lengdargrunnur á ekki við. Báðir afhentu strengirnir í cum_km_tier_minus1 og cum_km_tier_2 verða sjálfstæð neikvæð viðmið. Varðveittu fyrra Seyðisfjarðarviðmið. Validator keyrir aftur á skrifuðum lokaúttökum.

## H4 — rekjanleg heimild hvers hnits

Sérhvert native- og WGS84-hnit ber repo-relative skrá, sha256 eða ótvíræðan lykil í input_hashes, feature/piece-id, reit og CRS. Lesa gildi úr heimildum; ef heimildabundinn literal er óhjákvæmilegur þarf nákvæma tilvísun og samanburðarpróf við heimild. Þetta nær sérstaklega til Akureyri C native/WGS84 og Reykjavíkur-/road93-candidates. Lengdir 1436, 26,9266 og 27,8536 eru afleiddar úr varðveittum gögnum með merktum grunni, ekki sjálfstæð literals. Án leyfðrar retained hnitheimildar: null og NO_COORDINATE_SOURCE. Engin EPSG:3057→4326 umbreyting.

## H5 — sértæk gagnagöt og varðveittar vísbendingar

Hver gatafærsla tengist nafni, Hagstofupörunarstöðu/kóðum, raunverulegri veg-/hnit-/áttarvöntun og næstu nauðsynlegu gögnum (reitir, CRS, nákvæmni, tilgangur). Reykholt þarf sértækt svæðisgreiningargat fyrir 193/1162. Kópavogur, Garðabær, Hafnarfjörður og Reykjanesbær þurfa sína UNMATCHED-skýringu; aðgreindu INFERRED code-50-hópun þar sem hún er heimildabundin frá staðfestu pörunargildi.

Bættu afmarkaðri, fyrirfram skráðri stofnaleit við varðveitt road-links gögn og birtu gagnsæjar leitarsamsvaranir. Sannprófaðu vísbendingar Jonesy: Skagastrandarvegur 2423/2456, Þorlákshafnarvegur 22722/22725 og Eyrarbakkavegur. Þetta eru aðeins INFERRED leitarvísbendingar, ekki uppfærsla road_connection eða staðfest byggðartenging. Ekki fullyrða almennt að engar vísbendingar séu fyrir 48 staði út frá orðamarkaleit einni.

host_candidates mega aðeins nefna hýsla sem retained heimild sýnir, með tilvísun, UNVERIFIED_PROPOSAL og NOT_AUTHORISED; tilvist lags, leyfi og hæfni UNKNOWN nema retained gögn sýni annað. Ef enginn hýsill er lagður til, segðu það með staðreyndabundinni ástæðu. Ekki búa til slóðir/lagaheiti eða gera fyrri netheimild að nýrri heimild. Almennar kröfur mega endurtakast þar sem þær eiga við, en pairing og tilteknar vísbendingar mega ekki hverfa í almennum texta.

## H6–H8 — áttarregla, endurkeyrsla, nákvæmt uppgjör

H6: Skráðu retained heimild og afmarkaða inference-reglu fyrir direction_status áður en keyrt er, eða notaðu UNKNOWN. Aðgreindu cw_long traversal frá lagalegri akstursátt; engin ný heimild um akstur.

H7: Notaðu Path.as_posix() fyrir repo-relative slóðir í provenance og öllum input/output-hash-skrám. Endurkeyrsla gefur bæti-eins úttök án tímastimpla. Ekki fullyrða prófun á öðru stýrikerfi nema hún hafi í raun farið fram.

H8: Keyrðu raunverulega candidate-leit á öllum níu afturkölluðu stöðunum og sýndu að vísbendingar geta ekki hækkað road_connection yfir heimildamörkin. Skýrðu fjölda mutation-prófa nákvæmlega (ekki fjögur á níu ef þrjú á níu og eitt á 2345). Leiðréttu Vopnafjarðarsetninguna og útreikninginn 68 = 70 − 2 ef tölurnar standa; endurreiknaðu talningar úr v2 í stað fasts texta. Endurmetið EVIDENCE_READY_FOR_OWNER_REVIEW aðeins eftir öll próf og lokaúttaksvalidators; opin gögn áfram BLOCKED_WITH_EXACT_GAPS undirliðir.

## Afhending og lokapróf

72 nöfn í sömu röð, engar tvítekningar eða mannfjöldatölur. Sérhver óstaðfest tenging hefur gat. G4 samanburður allra sjö hnúta stendur óvalinn. H1/H2 lokaúttakspróf, H3 nested schema og raunveruleg neikvæð viðmið verða að standast. Skráðu próf/niðurstöður nákvæmlega í evidence-v2 og append-only CC-skýrslu, með H1–H8 disposition og takmörkunum. Staðfestu óbreytt v1 og retained inntök með SHA fyrir/eftir. Hash-tafla nýrrar afhendingar síðast; CURRENT/cc-report/review utan hennar. Athugaðu diff/scope, ekkert utan leyfðra skjala. Fylgdu CC_IN_PROGRESS → CC_COMPLETE og fylltu réttar skýrsluslóðir. Stöðvaðu með nákvæmu gagnagati ef retained gögn styðja ekki niðurstöðu; ekki fylla í með ágiskun.

## Jonesy review — umferð 1 (2026-11-10)

Yfirferð á þessum drögum (umferð 2 eftir REVISE í `result-review.md`). CURRENT las ég ferskt af tækinu: Stage `PROMPT_REVIEW`, prompt-review-slóð `correction-prompt-review.md`; stage og skrár stemma. Ég las drögin, `result-review.md`, `evidence.md`-hluta sem vísað er í og sannreyndi fullyrðingar í drögunum í sandbox gegn varðveittum gögnum (`place-inventory.csv`, `road-links.csv`, `endpoint-candidates.json`, `place-access-status.csv`). Ekkert keyrt á vél eiganda, ekkert net.

### Niðurstaða: APPROVED MEÐ SKILYRÐUM (J1–J6)

Drögin taka á öllum H1–H8, halda umfangi offline og óbreyttu (engin ný gögn, engin hnitavörpun, v1 varðveitt, validatorar og neikvæð próf á undan nýjum úttökum, hash-tafla síðast). Ég geri engar athugasemdir við umfang. Skilyrðin hér að neðan loka eyðum þar sem drögin leyfa CC að velja (eða fella) leiðir sem réðu úrslitum í v1; hvert er bundið við tiltekinn lið H1–H8. Þau þurfa að vera orðrétt í `approved-prompt-v2.md` og í `rules-v2.md` áður en bygging er keyrð.

### Sannreynt í sandbox (til stuðnings skilyrðunum)

- **H1-lýsingin stenst:** `place-inventory.csv` (phase-1) skráir `access_node_end` = `end` fyrir Selfoss (2138), Hellu (3591) og Hvolsvöll (3593), og `start` fyrir Vík (3849), Fáskrúðsfjörð (2536), Reyðarfjörð (2520) og Reykjahlíð (3566). Þetta er sama skipting og í `result-review.md`.
- **Vísbendingar H5, allar til í varðveittum gögnum, en aðeins í `desc`-reit, ekki `name`:** `Skagastrandarvegur` á **þremur** stykkjum (2423, 2456 **og 2478**), `Þorlákshafnarvegur` á tveimur (22722, 22725) og `Eyrarbakkavegur` á tíu (2116, 2117, 2134, 2135, 2138, 3737, 8676, 36807, 52491, 52492). Drögin nefna aðeins 2423/2456 fyrir Skagastrandarveg, sem er ófullkominn listi. Staðirnir Skagaströnd, Þorlákshöfn og Eyrarbakki eru allir í 72-lista og allir `NODE_UNDETERMINED` með almenn gat (GAP-032/064/065).
- **Stofnaleit krefst hljóðbreytinga:** Skagaströnd → Skagastrandar og Þorlákshöfn → Þorlákshafnar finnast aðeins ef ö↔a-víxl er með; Eyrarbakki → Eyrarbakka þarf endingarfall. Orðrétt leit með orðamörkum finnur ekkert af þessu, sem skýrir að v1 skilaði núlli.
- **Hnútur 2345:** `endpoint-candidates.json` hefur þar tvo strengi í tölureitunum; hringvegagrunnur hans (677,6344/675,0743 inngangur, 678,5614/676,0013 útgangur) er staðfestur í fyrri umsögn, en samkvæmt v1-strengnum er road-93 eigin grunnur (tier −1/tier 2) 0-byggður frá hringvegamótunum (óstaðfest af mér að öðru leyti).

### Skilyrði

- **J1 (H1; uppbygging færslna, fyrirfram skráð):** `rules-v2.md` skal skrá lokað orðaforðaval áður en keyrt er: `node_role` ∈ {ENTRY, EXIT}, `stored_field` ∈ {START, END}, auk `record_source` (phase-1 `access_node_end` / phase-2 v3 `place_nodes-v3.json`) og `reference_status` (til dæmis PHASE1_REFERENCE / PHASE2_V3_NODE / CANDIDATE_NOT_PROMOTED). Ein færsla = eitt hnit + eitt cum-par úr sama `cw_long`-skrefi og sama hlutverki. Hlutverk hvers staðar eru **lesin úr `place-inventory.csv` (`access_node_end`) og `place_nodes-v3.json` í keyrslu og prentuð**, ekki harðkóðuð úr lista í prompti. Skráið fyrirfram fyrir hvern af sjö stöðunum hvaða færslur eru gefnar út: Selfoss, Hella, Hvolsvöllur: tvær merktar færslur (phase-1 ENTRY og phase-2 EXIT), engin gerð að staðarendapunkti; Vík, Fáskrúðsfjörður, Reyðarfjörður, Reykjahlíð: phase-1 START/EXIT sem tilvísun, og skýrt skráð hvort ENTRY-færslan (v1-hnitið) er einnig gefin út sem ótekin candidate-færsla eða ekki gefin út (með ástæðu). Aðaltaflan heldur 72 röðum í sömu röð; aukafærslur fara í aðskilda skrá eða dálkahópa (`entry_*`/`exit_*`) án þess að raðatalan breytist.
- **J2 (H1 og H2; lokaúttaksvalidator og neikvæð próf):** Validatorinn les **skrifuðu lokaskrárnar** og er sjálfstæður frá byggingarskriftunni (engin innflutningstenging, sama static-próf og í v1). Hann ber (hnit, piece-id, hlutverk, reit, cum með/án) saman við varðveitta rúmfræði og fram-/aftursummuútreikning. Neikvæðu viðmiðin lesa **v1-gögnin orðrétt úr varðveittum v1-skrám** (með tilvísun í sha þeirra): afhenta Selfoss-röðin (hnit ENTRY, cum EXIT) og afhentu víxluðu Reykjavíkur-offsetin. Hlutverka-, hnita-, merkja- og tvítalningarafbrigði keyra á að minnsta kosti tveimur stykkjum (helst öllum níu); fjöldi prófa og á hvaða stykki skráður nákvæmlega og reiknaður í kóða.
- **J3 (H2; Reykjavík):** Lengd 1436 og báðir enda-offset eru lesin úr `cw_long` skrefi 0 með nafngreindum reit (`piece_cost_m`, `gap_into_m` sem skal vera 0 á skrefi 0; skriftan fullyrðir það) og gerð að (gildi, merki)-pörum fyrir bæði grunnana. Lýsingartexti leggjanna (v1 sagði "starts_at START … traverses backward") skal endurskrifaður í samræmi við `rev` END→START, og ekkert harðkóðað lengdargildi (2560.1497) er eftir í skriftunni.
- **J4 (H3; schema og hnútur 2345):** Listi yfir tölureiti er **leiddur sjálfvirkt** (gengið yfir alla lykla sem tákna hnit, lengd, cum eða offset í báðum úttökum), ekki handtalinn, svo reitur sem gleymist falli ekki utan prófs. Staða (`NOT_VALIDATED`) fer í sérstakan status-reit, aldrei í tölureit; ógilt = tómt/null. Fyrir 2345 skal `rules-v2.md` skrá fyrirfram: hringvegagrunnur sem staðfest (gildi, merki)-pör, og road-93 eigin tier-reitir fyrir hringvegamótin annaðhvort 0,0 sem merkt uppruni eða null með ástæðu. Báðir afhentu strengirnir fara orðrétt úr v1 sem neikvæð viðmið.
- **J5 (H5, H8; stofnaleit og gatalisti):** Stofnareglan skal vera skráð í `rules-v2.md` **áður** en hún er keyrð og vera almenn fyrir allar 72 nafnastöður (föst afleiðsla: viðskeytisstripping, skráð hljóðbreyting ö↔a ef hún er notuð, lágmarkslengd stofns), ekki sniðin að þremur vísbendingunum. Leitarsvið skráð nákvæmlega (skrá, reitir; í ljós kemur að þrjú tilvikin eru öll í `desc`) og **allar samsvaranir birtar** (stykki, reitur, texti), ekki aðeins nefndu stykkin; falskar jákvæður (fordæmi: "Laugar" í "Laugardælavegur") metnar og skráðar. Recall-próf: reglan verður að finna vísbendingarnar þrjár (þar með 2478), án þess að þær séu forsenda stofnanna. Samsvörun á stykki annars staðar (t.d. Eyrarbakkavegur nefndur í `desc` Selfoss-stykkja) er vísbending um vegamót í lýsingu, hvorki hnit né tenging, og er skráð sem INFERRED-ábending án áhrifa á `road_connection`. Níu afturkölluðu staðirnir fá raunverulega leit með niðurstöðu skráðri. `host_candidates` nefna aðeins hýsla úr nafngreindum varðveittum skrám (skrá + lína) eða "enginn hýsill lagður til" með staðreyndabundinni ástæðu; gatafærslur eru byggðar úr staðarsértækum reitum (Hagstofustaða/kóðar, vísbendingar, vöntun), og Reykholt fær sérstakt svæðisgreiningargat. Talningar (gat, samsvaranir, 68/70) reiknaðar í kóða.
- **J6 (H6, H7, H8; varðveisla, staðsetning, forskráning):** Staðsetning og nöfn v2 skal ákveðin fyrirfram (ekki "eða"): ný v2-nefnd skrá í sömu möppu og undir `samples/v2/` (til dæmis `place-access-status-v2.csv`, `endpoint-candidates-v2.json`, `rules-v2.md`/`rules-v2.sha256`, `evidence-v2.md`, `HASHES-v2.*`), engin v1-skrá breytt (ekki einu sinni SUPERSEDED-merking; `evidence-v2.md` er vísitala yfir authoritative úttök). SHA allra v1-skráa og 12 inntaka skráð **áður en nokkuð er skrifað** og borin saman í lokin; append-only skrár (`cc-report.md`, `result-review.md`) sannreyndar með forskeytis-SHA upprunalegra bæta. Áttarreglan (H6) og niðurstöðumerkið (G8; hvaða próf, þar með lokaúttaksvalidatorar J2/J4, ráða merkinu) eru skráð í `rules-v2.md` fyrir keyrslu; `as_posix()` í öllum slóðum í bæði inntaks- og úttaks-hash-skrám, tvær keyrslur í röð bæti-eins, engin fullyrðing um annað stýrikerfi nema hún hafi farið fram.

### Takmörk og athugasemdir

Skilyrðin bæta engu við umfang (offline, engin ný gögn); þau skylda CC til að skrá ákvarðanir fyrirfram sem drögin skilja eftir opnar. Ég hef ekki sannreynt `git status`/scope og ekkert keyrt á vél eiganda. Production NOT_TESTED. Eftir að Ripley hefur fellt J1–J6 í `approved-prompt-v2.md` og sett READY_FOR_CC má Róbert ræsa CC. Næsta yfirferð mín er "CC búinn" með V2-úttökin (result review umferð 2, append í `result-review.md`).

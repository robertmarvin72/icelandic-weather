# #500 — Lokaafhending gagna og gagnagata til #501

## Approved prompt v1 — 2026-11-16

Jonesy APPROVED í umferð 1 án blockera. Keyra aðeins eftir fyrirmæli eiganda „Prompt approved“ þegar CURRENT er READY_FOR_CC; CC setur fyrst CC_IN_PROGRESS. Eigandi samþykkti eina afmarkaða lokafrágangslotu eftir closure-assessment.md. Markmiðið er nothæf afhending núverandi gagna til #501 og skýr ákvörðunargrunnur um lokun #500. Ekki fullgera landsdekkandi leiðastuðning í þessari lotu. Engin sjálfvirk lokun GitHub-miða eða samþykki fyrir minni vörulista.

## Lesa fyrst

- AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md.
- ticket-500/closure-assessment.md, nationwide-owner-scope.md og remaining-map-selection/result-review.md. nationwide-status.md er söguleg staða, ekki núverandi talning.
- server_data/winter-route-places.json og winter-route-approach-selections.json: gildandi 56-staða listi og valdar aðkomur. 54 með hnit, Keflavík bær/Þórshöfn null; enginn almennur leiðastuðningur staðfestur af þeirri talningu.
- Eftir tilvísunum: ticket-500/places-v1.json, r1-north-connection.json, server_data/winter-route-south-connections.json, winter-route-remaining-coverage.json, winter-route-acquired-geometry.json, winter-route-approach-analysis.json og winter-route-place-evidence.json.
- Varðveitt chain-walks-v4.json/road-links.csv í ticket-493-place-network/samples og 72-raða ticket-493-access-points/place-access-status-v3.csv. Lesa viðeigandi kafla/heimildir eftir þörfum; ekki endurtaka allar fyrri rannsóknir.
- src/lib/winterRouteRoutes.js og api/_lib/winterRoute/routes.js til að greina núverandi föstu leiðirnar frá framtíðarleiðasamsetningu.

## Framkvæmd CC

1. Staðfesta með litlum staðbundnum samanburði 56 einstök auðkenni/nöfn/röð gegn eigandalistanum, 54/2 hnitastöðu og 50 selection-færslur + fjóra upphaflegu punktana. Engin netköll eða gagnaöflun.
2. Skrifa **docs/ai/tasks/ticket-500/closure-handoff/handoff-to-501.md**. Eitt hnitmiðað afhendingarskjal, ekki nýtt gagnakerfi:
   - Gildandi skrár/hlutverk, schema_version þar sem til er og SHA-256 þeirra gagna sem skjalið vísar á sem afhendingargrunn. Sögulegar rannsóknir skýrt merktar; þær yfirskrifa ekki nýtt punktaval. Tilvísanir repo-relative.
   - Ein 56-raða tafla: place-ID/heiti, punktur valinn eða hnitagat, tilvísun á val/source, tilvísun á varðveitta graph-tengingu/keðju ef hún er til, þekkt tengi-/stefnu-/aðgengisgat og afleiðing fyrir #501. Ekki afrita öll hnit/hrágögn. Heimild vantar => segja nákvæmlega hvað er óstaðfest, ekki álykta að vegur sé ófær eða að engin tenging sé til í raunheimum.
   - Varðveittar keðjur/tengingar sem #501 getur nýtt sem rannsóknar-/gagnagrunn, með gildissviði og takmörkunum. Greina geometry, tengingu við valinn punkt og akstursstefnu. Ekki gera óstaðfestar keðjur routable. Núverandi föstu runtime-leiðirnar tvær standa sjálfstætt og óbreyttar.
   - Sérstaklega sýnileg: Keflavík bær ≠ KEF, tvö hnitagöt; R1-norðurtenging; áður skráð suður-/hring-/Akranes-/Dalvíkur-göt. Varðveita mæld bil og fyrirvara með tilvísun; hvorki ný mæling né ný graph-leit nauðsynleg. Nýtt vörupunktaval eyðir ekki gömlu tengigati sjálfkrafa.
   - 72-raða rannsóknarsafnið varðveitt með núverandi niðurstöðum/tilvísun; 56-staða eigandalistinn er vörugrunnurinn. Eldri krafa um Reykholt/Garðabæ bætir þeim ekki við vöruna. Ekki túlka nöfn utan listans sem nýjar eigandasamþykktar útilokanir.
   - Stutt lokunartafla gagnvart #500 samkvæmt closure-assessment.md: uppfyllt / afhent sem nákvæmt gagnagat / ólokið. Gagnagat verður ekki sjálfkrafa samþykkt frestun. Segja skýrt hvort tæknileg gagnaafhending sé tilbúin og hvaða ákvörðun eigandinn á enn um áhrif gagnagatanna. Ekki lýsa landsþekju eða öllum 56 sem routable.
   - Afmörkun: #501 leiðasamsetning, #502 Frá/Til, #503 veður/færð, #504 heildarprófun. Ekki semja ný framkvæmdarprompt fyrir þá miða.
3. Skrifa **closure-handoff/issue-500-closure-draft.md**: stutt tilbúin tillaga að GitHub-lokaathugasemd með 56-staða umfangi, núverandi stuðningi/götum og tilvísun á handoff. Merkja drög og ákvörðun eiganda eftir. Ekki birta eða breyta GitHub.
4. Skrifa closure-handoff/cc-report.md með raunathugunum, niðurstöðu og takmörkunum; fylgja CURRENT-lífsferli í README.

## Leyfðar breytingar og utan umfangs

Aðeins ný skjöl undir docs/ai/tasks/ticket-500/closure-handoff/ og nauðsynleg CURRENT.md workflow-færsla. Prompt-review saga bætist við af Jonesy/Ripley samkvæmt hlutverkum. Ekki breyta eldri samþykktum promptum, heimildum, vörugögnum, prófum, kóða eða issue-textum. Engin ný dependency, leiðarvél, frontend-import, UI, kortaskoðun, netöflun, nýtt staðaval, commit eða push. Þetta er gagnahandoff; ekkert nýtt UI-entrypoint þarf.

## Samþykktarskilyrði og hófleg sannprófun

- 56-raða taflan nær nákvæmlega yfir samþykktan lista án tvítekninga eða hljóðlausrar fækkunar. Staðfesta töflumengi/talningar, tilvísunarskrár og skráð SHA staðbundið; einföld tímabundin Python/Node-athugun nægir, ekkert nýtt prófakerfi.
- 54 valdir punktar, tvö hnitagöt, staðfestar geometry-heimildir og óstaðfest akstursaðgengi haldast aðgreind. Nákvæmt gagnagat þarf source-tilvísun/skýra lýsingu, ekki almenna EXACT_GAP-stimplun án samhengis.
- #501 getur séð hvað er gildandi, hvað er aðeins sögulegt og hvað má ekki nota sem sönnun um studda leið. Ekki þarf að leysa gagnagötin til að þessi skjalalota fái PASS.
- Eigandamarkmiðið allir 56 helst óbreytt; PASS þessarar lotu er ekki samþykki fyrir útgáfu með minni þekju eða sjálfvirk lokun #500.
- Engar kóðabreytingar: engin þörf á build/lint/fullri test-keyrslu. `git diff --check` og sannprófun ofangreindra staðhæfinga nægir; skoða einnig nýju skrárnar því git diff sýnir ekki untracked innihald. Fyrri 215/215 próf eru fyrra Ripley-lokamati eignuð, ekki sögð endurkeyrð hér.

## STOP

Ef heimildir stangast raunverulega á, skrá nákvæmt ósamræmi og áhrif í handoff/cc-report; ekki lagfæra vörugögn eða endurvekja fyrri valákvarðanir. Ef ómögulegt er að afhenda heiðarlega nothæfan grunn án nýrrar gagnaöflunar eða scope-breytingar, tilgreina einfaldasta nauðsynlega skref og stöðva þann hluta. Gagnagöt sem þegar eru heiðarlega skráð kalla ekki ein og sér á nýja rannsóknarlotu. Þegar handoff og sannprófun standast, stoppa.

Valfrjáls herðing eða ólokin vinna á #501–#504 er ekki blocker á þessari afhendingu.


## Skýringar teknar úr OS1–OS6, án aukins umfangs

- 72-raða safnið er ekki yfirmengi 56-listans. Ekki varpa Reykjanesbæ yfir á Keflavík. Aðeins bókstafleg nafnasamsvörun eða skýrt merkt vörpun (t.d. Reykjahlíð ↔ Reykjahlíð (Mývatn)); önnur nöfn eru ekki sjálfkrafa eigandasamþykktar útilokanir.
- Greina fasta leið frá völdum vörupunkti: R1 upphaf beggja, Borgarnes/P4 með varðveittum fyrirvara, Vík-punktur 3849 START um 629 m vestan enda föstu leiðarinnar samkvæmt varðveittum gögnum. Síðasta talan lýsir punktamun, ekki mældu samskeytabili. Engin ný mæling hér.
- Reikna SHA á raunverulegum bætum skráa í vinnutré við afhendingu. Skrá línulok CRLF/LF og að breytingar/línulokanormalisering breyti SHA; ekki lofa sömu bætagildum í CI-checkout. Ekki breyta heimildaskrám til að láta þær passa við eldri hash.
- Keðjutilvísun aðeins þar sem viðeigandi auðkenni valda punktsins finnst í varðveittum keðjuskrefum; tilvist staks raw-vegbúts sannar ekki keðju. Annars „engin varðveitt keðja staðfest í þessum afhendingargrunni“, án fullyrðingar um raunverulegt vegaleysi. Greina heilar varðveittar keðjur frá 25-stykkja suðurútdrætti og R1-norðurútdrætti; ekki telja útdrátt heila leið.
- Núverandi per-place JSON-reitir ráða gagnastöðu fram yfir sögulegan CURRENT/cc-report eða gamlan topp-note. Óstaðfest place-evidence vísbending verður ekki staðfest heimild með tilvísun í eldri skýrslu.
- Tímabundin forskrift til að mynda 56-raða grind og sannprófa talningar er nægileg; skoða lýsingar síðan. Ekki afhenda nýtt forskriftakerfi. Halda CURRENT.md í CRLF; ný skjöl mega vera LF.

CC lýkur með cc-report.md og CURRENT → CC_COMPLETE, með réttum report-path. Ekki framkvæma result-review eða lokun GitHub-miða sjálfur.

# #500 — Samþykkt framkvæmdarprompt v1: sameiginleg 56-staða vöruskrá

2026-11-14, Ripley. Byggt á APPROVED samhengi og staðalista í nationwide-prompt-review.md, Jonesy umferð 1. NB1 ræður afmörkun: aðeins vöruskráin, engin leiðarvél/UI eða GitHub-miðabreyting. Nýtt eigandahandoff „Prompt approved“ þarf þegar CURRENT vísar hingað í READY_FOR_CC. Ekki keyra eldri road93-draft eða prompt-review.md.

## Útkoma

Ein lítil sameiginleg vöruskrá nákvæmlega allra **56** eigandastaðanna. Hún verður grunnur beggja Frá/Til-reita síðar; engir staðir bætast við eða hverfa vegna skorts á leiðargögnum. Skráin staðfestir staðaval, ekki fulla leiðarþekju. Þetta er fyrsta raunbreyting á gagnagrunni vörunnar eftir samhengi-review, ekki ný landsrannsókn eða annað fjögurra staða afrit.

## Lesa fyrst

- AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md.
- docs/ai/tasks/ticket-500/nationwide-owner-scope.md: nafngreindi listinn er bindandi, 56 staðir samþykktir af eiganda. nationwide-prompt-review.md, Jonesy NB1–NB4.
- ticket-500/places-v1.json og lokamat í result-review.md; ticket-499/endpoint-registry.json og reykjavik/owner-decision.md, aðeins til endurnýtingar R1/E1/S2/C. Fyrri EXACT_GAP-stöður standa. Ekki enduryfirfara rannsóknarsafnið.

## Leyfðar breytingar

- Ný `server_data/winter-route-places.json` — sameiginleg vörugögn, ekki frontend-import eða API-tenging í þessari lotu.
- Ný `api/_lib/winterRoute/places.test.js` — markviss Vitest-gagnapróf, samkvæmt fyrirliggjandi test-mynstri.
- `docs/ai/tasks/ticket-500/nationwide/cc-report.md` og CURRENT.md samkvæmt lifecycle.

Engar aðrar skrár nema nauðsynlegt frávik sé fyrst lagt fyrir eiganda. Enginn nýr almennur loader/validator/framework, engin dependency eða schema-bókasafn. Engin breyting á apphegðun enn; entrypoint síðar er fyrirliggjandi `/winter-route`, ekki ný síða í þessari lotu.

## Gagnaskrá

Nota einfalt JSON með schema_version: 1 og places-lista. Hver staður hefur stöðugt id, name (orðrétt eigandaheiti), region (flokk úr eigandalista), aliases-lista og aðskilin coordinates, approach og connectionStatus. Provenance má vera stutt source-tilvísun fyrir þá fjóra aðkomupunkta sem eru til. Ekki búa til stóra almenna gagnalíkanshönnun.

- Afrita **nákvæmlega öll 56 heitin** úr kaflanum „Lokaður listi veljanlegra staða“ í nationwide-owner-scope.md. Varðveita svæðisflokkun og röð. Enginn Rauðavatns-valstaður til viðbótar við Reykjavík; enginn Garðabær, Reykholt eða önnur viðbót úr gamla 72-listanum.
- Varðveita fyrirliggjandi fjögur staða-ID: reykjavik-raudavatn, egilsstadir, seydisfjordur, akureyri. Velja einföld einstök ASCII-slug-ID fyrir hina 52. ID Reykjavík má bera Rauðavatnsheiti af sögulegum ástæðum en name er eigandaheitið „Reykjavík“; approach lýsir skýrt R1/Rauðavatni, ekki borgarkjarna. Ekki gera sjálfstæða nýja borgarkjarnaákvörðun.
- Birtingarheiti eru eigandaheitin, án innri E1/S2/C-kóða. „Reykjahlíð (Mývatn)“ og „Keflavíkurflugvöllur (KEF)“ halda svigum eins og eigandi skrifaði. KEF og Keflavík hafa ólík ID og aðskilda reiti.
- Aliases eru aðeins samheiti/leitarheiti sömu færslu. `KEF` má vera alias flugvallarins en ekki Keflavíkur. Engin ný staðafærsla vegna alias. Öðrum aliases má sleppa (tómur listi); ekki ný nafnasöfnun eða leitarkerfi.
- R1/E1/S2/C coordinates og aðkomur eru nákvæmlega endurnýtt úr yfirfarinni places-v1.json/registry. Coordinates merkja aðkomupunkt, ekki almenna miðju staðar. S2 approach er hlutlaus mótalýsing, ekki opinbert staðarheiti. Eigandastaðurinn „Seyðisfjörður“ er name.
- Fyrir hina 52: coordinates = null, approach = null og skýr pending-staða/ástæða. Það segir „ekki yfirfarið fyrir þessa vöruskrá“, ekki „engin gögn til“ eða „vegur lokaður“. Ekki nota myndina, loftlínu, sveitarfélagamiðju eða heitasamsvörun sem staðfestan aðkomupunkt. Eldri retained gögn fyrir t.d. Vík/Borgarnes/Reykjahlíð nýtast í síðari tengingarlotu; nýtt val/samþykki á þeim er ekki hluti þessa prompts.
- ConnectionStatus er aðskilið staðavalinu: fjórir aðkomupunktar eru valdir en hafa óstaðfest aðgengi; hinir hafa pending leiðartengingu. Enginn verður supported/routable í þessari lotu. Allir 56 eru í vörulistanum og ætlaðir til vals; óstudd tenging fær síðar gagnagatsniðurstöðu, ekki hljóðlaust brottfall staðar.
- Veðurpunktar og innri geometry-/færðarhnútar fara ekki í þessa skrá. Ekkert ETA, skor, brottfarartími eða route-per-pair. Engin ný landsþekju- eða akstursfullyrðing.

## Viðtaka og prófun

Eitt markvisst Vitest-prófasafn les raunverulegu JSON-skrána og sannreynir:

1. Nákvæmlega 56 einstök ID og orðrétt heiti, í réttri svæðisflokkun/röð. Nota óháðan væntanlegan lista úr eigandakröfunni í prófinu, ekki `expected = actual` eða fjölda einan.
2. Keflavík og KEF eru tvær færslur; `KEF` alias vísar aðeins á flugvöllinn; alias verður ekki 57. staður. Engin veðurpunkta-/innri hnúta-/72-lista viðbót.
3. Nákvæm fjögur fyrirliggjandi ID/hnit; R1-aðkoma skýr Rauðavatn og enginn miðbæjarhnitauppspuni. Hin 52 coordinates/approach null með pending-stöðu. Enginn staður route-supported vegna þess að hann er í listanum.

Keyra þetta eina prófasafn og viðeigandi lint fyrir nýja JS-prófskrá (ef verkefnismynstur krefst). `git diff --check` fyrir tracked breytingar og lesa nýjar skrár beint. Engin build/vafrapróf/full-suite fyrir hreina óinnbundna gagnaskrá. Ekki ný mutation-/provenance-umgjörð eða endurkeyrsla eldri gagnaprófa.

Skila stuttri CC-skýrslu með skrám, prófun og því sem er/er ekki afhent: vöruskrá 56 tilbúin; engin ný leiðarþekja, UI eða landsnet. Þegar listinn er réttur og markviss próf standast, stoppa.

## Mörk

Engin netöflun, kortaleit, ný þjónusta/dependency, delegation, GitHub-miðabreyting/birting/lokun, commit/push eða deploy. Engin breyting á fyrri samþykktum promptum/rannsóknargögnum. Engin API-/UI-/leiðarvél-/cache-/forecast-/scoring-/entitlement-/checkout-innleiðing. Samræming miðatexta og #501–#504 eru aðskilin næstu verk, ekki falið framhald þessarar keyrslu. Eigandamarkmiðið er áfram landsþekja fyrir alla 56; svæðislotur raða vinnu en fækka ekki stöðum.

CC sannreynir READY_FOR_CC, setur CC_IN_PROGRESS áður en breytingar hefjast og skilar skýrslu áður en CURRENT verður CC_COMPLETE. Slóðir skýrslna úr CURRENT. Engin ný review-lota á þegar samþykktu samhengi; result-review metur aðeins þessa gagnaskrá og samþykkta viðtöku.

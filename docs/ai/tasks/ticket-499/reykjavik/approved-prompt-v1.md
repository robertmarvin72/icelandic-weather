# #499 — Reykjavíkuraðkoma, samþykkt framkvæmdarprompt v1

2026-11-13, Ripley. Jonesy APPROVED án skilyrða. Byggt á reykjavik-prompt-review.md, umferð 1; eingöngu slóð bounded_fetch.py leiðrétt samkvæmt athugasemd Jonesy. Fyrri #499-afhending stendur óbreytt. Þetta prompt eitt ræsir engin köll; nýtt eigandahandoff „Prompt approved“ þarf á READY_FOR_CC.

### Markmið

Finna einn nafngreindan Reykjavíkuraðkomu-candidate fyrir Frá/Til, með rekjanlegum hnitum og tengingu að báðum hringáttum. Leggja hann fyrir eiganda til vals. E1/S2/C standa óbreytt. Þetta er gagnaskref fyrir innleiðingu; enginn nýr UI-entrypoint í þessari lotu. Fyrirhugað notendaflæði síðar er einn Reykjavík-valkostur með stuttri aðkomulýsingu, ekki heimilisfangaleiðsögn.

### Lesa fyrst og endurnýta

- AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md.
- ticket-499/endpoint-registry.json og result-review.md: staðfest gögn og opin gögn aðskilin.
- ticket-493/endpoint-owner-decisions-2026-11-11.md og endpoint-decision-table-2026-11-11.md: R1 er samþykkt vöruregla, ekki valinn punktur. Hvorugur Rauðavatnsendi1436 er sjálfkrafa samþykktur.
- ticket-493-access-points/endpoint-candidates-v3.json og þar tilgreindar frumskrár/vegkeðjur fyrir Reykjavík. Nota retained gögn úr ticket-483 og ticket-491 aðeins eftir raunverulegum tilvísunum þeirra, ekki endursækja sömu gögn.
- ticket-499/samples/raw-ACCESS-CAPABILITIES.xml: tilvist `gis:vegleid_stadur` og `gis:faerdferlar2017_1` er þekkt; innihald fyrra lagsins er óstaðfest. Ekki túlka lagheiti sem staðfestingu á staðarheiti, akstursheimild eða leyfi.
- Fyrirliggjandi bounded_fetch.py undir ticket-493-place-data-phase2/samples/ og driverar undir ticket-493-endpoint-acquisition/samples/ og ticket-499/samples/. Endurnýta einfalt kall, ekki nýtt öflunarkerfi.

### Framkvæmd

1. Skoða fyrst retained Reykjavíkurgögn, nöfn og raunverulega vegenda. Ef þau gefa einn rekjanlegan candidate sem uppfyllir markmiðið, sleppa nýjum köllum. Ekki endurtaka almenna yfirferð allra staða.
2. Ef vantar heiti/hnit eða Reykjavíkurtengingar má nota aðeins tvö föstu GET-köllin hér að neðan. Fyrra aflar staðarnafnagagna; síðara afmarkaðra veglína. Sleppa kalli ef retained gögn leysa nákvæmlega sama gat. Engin leitarvél/kortaskoðun eða nýr þjónustuaðili í þessari lotu.
3. Velja mest einn ráðlagðan candidate úr gögnunum. Nafn verður að eiga heimild, hnit að vera raunverulegur punktur úr heimild og tengingar að hafa skýrt upphaf/lok og stykki/ID. Bera saman við retained leiðarleggi í báðar hringáttir; ekki kalla snertingu lína sönnun á akstursheimild. Ekki velja nálægan punkt eingöngu af því hann er næstur.
4. Tengingar: skrá mæld bil á milli línuenda í metrum með aðferð, hvaða línur eru notaðar og hvort stefna/aðgengi er VERIFIED, INFERRED eða UNKNOWN. Engin sjálfvirk brúun bila eða ágiskuð akstursstefna. Ef gögn sýna aðeins rúmfræðilega tengingu, afhenda hana sem slíka og segja nákvæmlega hvað vantar fyrir báðar akstursáttir.
5. Afhenda candidate með stuttri notendalýsingu og rekjanlegum heimildum, merkt PROPOSED_AWAITING_OWNER_SELECTION. Ef gögn duga ekki, afhenda nákvæmt gat og eina einföldustu tillögu að lausn, án framkvæmdar hennar. R1 helst óvalinn þar til eigandi velur.

### Fyrirhuguð netheimild eftir samþykkt prompt og nýtt eigandahandoff

Eingöngu HTTPS `gagnaveita.vegagerdin.is`, path `/geoserver/gis/ows`, engin auth/cookies/secrets. Fyrir fyrsta kall skrá handoff og approved-prompt SHA í nýja CC-skýrslu; ekki nota fyrri #499-heimild.

1. Staðir: `service=WFS&version=1.0.0&request=GetFeature&typeName=gis:vegleid_stadur&srsName=EPSG:4326&outputFormat=application/json&maxFeatures=1000`.
2. Reykjavíkurlínur: `service=WFS&version=1.0.0&request=GetFeature&typeName=gis:faerdferlar2017_1&srsName=EPSG:4326&outputFormat=application/json&BBOX=-21.98,64.05,-21.65,64.18,EPSG:4326&maxFeatures=3000`.

BBOX er tillaga að föstum rannsóknarglugga, ekki heimild um bæjarmörk eða valinn endapunkt. Ekki breyta glugga eða síu eftir niðurstöðu. Búa til encoded URL með staðlaðri URL-encoding og varðveita nákvæma slóð með svari. Ekki nota óþekkt attribute-heiti í síu. `vegleid_stadur` getur reynst óhæft; það er rannsóknarniðurstaða, ekki tilefni til nýrrar þjónustuleitar.

Mest tvö HTTPS-skipti, 4 MiB body á kall / 8 MiB samtals, 20 sekúndna veggklukkutímaþak á kall og 10 mínútna gluggi. TLS staðfest, engar retries/redirects/paging. Afrit/helper aðeins undir ticket-499/reykjavik/; gömul gögn og driverar óbreytt. Nota fyrirliggjandi bounded-fetch til flutnings, með þessum mörkum; engin ný dependency.

Flutnings-/öryggisbrot stöðvar frekari köll. Gagnaformsstopp á fyrra svari hindrar ekki sjálfstætt síðara kall innan heimildar. Ógilt JSON, rangt lag/CRS, villusvar, vöntun á talningu sem útilokar skert svar, `matched > returned`, talning sem stenst ekki fjölda features eða fjöldi >= maxFeatures þýðir ófullnægjandi svar fyrir viðkomandi niðurstöðu. Varðveita hrátt svar og gat; ekki byggja heilleika- eða tengingarfullyrðingu á því. Aldrei sækja næstu síðu eða endurtaka kall. Óviðkomandi gögn innan heils svars eru ónotuð, ekki sjálfkrafa STOP.

### Afhending og markviss staðfesting

Undir `docs/ai/tasks/ticket-499/reykjavik/` eingöngu: stutt `candidate.md`, lítið `candidate.json` ef candidate finnst, ný raw-svör og ledger ef köll voru gerð. Nýr `cc-report.md` segir í fáum línum hvað fannst, hvað er óstaðfest og eina næstu eigandaákvörðun. Frumskrár hafa slóð/SHA, og sótt gögn nákvæma URL/tíma/status/talningu. Hnit latitude/longitude með CRS; ekki nota z sem staðfesta hæð. Halda gömlu registry óbreyttu þar til val liggur fyrir.

Ein offline-keyrsla nægir: staðfesta SHA/talningu sóttra svara, finna birtan punkt aftur í frumgögnum og endurreikna notuð línuendabil. Ef skrifaður er validator skulu próf kalla raunverulega athugun með einni rangri SHA og einum breyttum notuðum endapunkti; `assertNotEqual` á eigin mutation nægir ekki. Ekkert almennt validator-framework eða frontend-suite fyrir þetta gagnaskref.

Viðtaka: einn rekjanlegur tillögupunktur með heiti/hnitum og heiðarlegri stöðu beggja tenginga, eða nákvæm niðurstaða um það sem föstu heimildirnar leysa ekki. Að hafa fundið candidate er ekki full innleiðing #499; engin akstursheimild eða eigandasamþykki má vera tilbúið. Stöðva þegar niðurstaðan liggur fyrir, ekki elta öll aðgengis-/metadata-göt annarra staða.

### Umfang og handoff

Engar app/UI/API-, veður-, scoring-, gating-, greiðslu- eða routing-engine breytingar. Engin vinna á E1/S2/C, KB1–KB3, 72-staða skrá, #500–#504 eða #498. Engin delegation, commit/push, GitHub-breyting eða deploy. Ef annað gagnakall eða umfang þarf, skrá ástæðu og spyrja eiganda áður en það hefst.

Jonesy APPROVED án skilyrða 2026-11-13, umferð 1. Aðeins þessi samþykkta útgáfa sem CURRENT vísar á í READY_FOR_CC er keyranleg eftir nýtt eigandahandoff „Prompt approved“. CC notar README-lifecycle og skilar CC_COMPLETE með nýjum report-slóðum úr CURRENT. Þetta er fyrsta review-umferð þessa afmarkaða framhalds; engin valfrjáls aukalota.

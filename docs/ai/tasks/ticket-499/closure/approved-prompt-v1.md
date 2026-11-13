# #499 — MVP-frágangur, samþykkt framkvæmdarprompt v1

## Ripley — 2026-11-13; Jonesy APPROVED með LA1

Samþykkt prompt eftir Jonesy umferð 1; LA1 valkostur (a) felldur inn hér að neðan. Keyranlegt aðeins eftir nýtt eigandahandoff „Prompt approved“ á READY_FOR_CC. Eigandi bað um prompt fyrir frágang sem gerir kleift að loka gagnaundirbúningi #499 og halda áfram. Þetta er texta-/gagnafrágangur á yfirfarinni afhendingu, ekki ný rannsókn eða innleiðing leiðarvélar.

### Markmið og grunnur

Gera núverandi afhendingu og eftirfylgni skýra: R1 er eigandavalinn „Reykjavík — Rauðavatn“; E1/S2/C hafa rekjanleg gögn. Óleyst aðgengi eða bogaval er áfram óleyst, ekki merkt staðfest til að loka miða.

Lesa AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md; síðan ticket-499/endpoint-registry.json, bæði result-review.md (rót og reykjavik/), reykjavik/owner-decision.md og candidate.json. Nota frumskrár aðeins til að sannreyna núverandi tilvísanir; engin ný öflun.

Ripley las #499/#500/#501 á GitHub 2026-11-13. #499 krefst enn heimildabundins S2-heitis og segir að opin aðgengisgöt jafngildi ekki fullri lokun innleiðingarhliðs. Því þarf að kalla lokunina afmarkaðan MVP-gagnaundirbúning og varðveita hvað var fært áfram. #500 fjallar um staðaskrá og staðfestar vegtengingar; #501 notar þær til leiðarsamsetningar og á að skila unsupported fyrir óstaðfestar tengingar. Ekki fullyrða að upphafleg öll release-skilyrði séu uppfyllt.

### Verkefni CC

1. Uppfæra aðeins S2-heitalýsingu í endpoint-registry.json (alla átta entries[].place-reiti, name_status og viðeigandi open_items-línu) í hlutlaust MVP-heiti: **„Seyðisfjörður — aðkoma við mót 2894/2892“**. Það lýsir eigandavöldu mótunum sem raw-gögn styðja; ekki opinbert staðarheiti eða staðfest bæjarmörk. Varðveita latitude/longitude, ID, raw/ledger/native tilvísanir, eigandaval og allar EXACT_GAP-stöður. Ekki breyta nafni í hráum gögnum eða sögulegum afhendingum.
2. Skrifa eina stutta `docs/ai/tasks/ticket-499/closure/github-handoff.md` með tilbúnum textablokkum fyrir eiganda:
   - **#499 lokayfirlit/umfangsleiðrétting:** fjórir grunnendapunktar, R1-samþykki, S2-lýsing og tilvísun í registry/owner-decision. Telja sérstaklega hvað er afhent og hvað er fært áfram. Lokun er „MVP-gagnaundirbúningur afhentur með skráðum tengingargötum“, ekki fullgerð Frá/Til eða staðfest akstursleið. Óuppfyllt eldri skilyrði eru merkt flutt/óleyst, ekki einfaldlega hakað við sem uppfyllt.
   - **#500 eftirfylgni:** nákvæmur norðurbogi frá vestari enda 1436 um Reykjavík/Kjalarnes-tengingar, akstursstefna/aðgengi og heimildir. Einnig varðveita óstaðfest aðgengi hinna endapunktanna. Engin ný 72-staða úttekt hér; þetta er viðbót við fyrirliggjandi miðann. Mælda geometry-snertingu má ekki jafna við leyfða akstursleið.
   - **#501 háð:** nota aðeins studdar tengingar frá #500; óstaðfest norðurtenging skal vera unsupported þar til nauðsynleg gögn liggja fyrir. Engin ný krafa um almenna leiðaleitarvél.
   Textablokkirnar eiga að vera stuttar og tilbúnar til birtingar, ekki ný löng review-skýrsla. Ekki breyta öðrum lokaskilyrðum #500/#501 eða hefja vinnu þeirra.
3. Skrifa stutt `closure/cc-report.md`: hvaða reitir breyttust, hvað er tilbúið til eigandafragangs og hvað er enn óleyst. Eldri skýrslur halda sögulegri PARTIAL-niðurstöðu; ekki skrifa yfir yfirferð Jonesy/CC eða eigandasamþykki.

### Sannprófun og viðtaka

Grunnlína samanburðar er registry-eintakið sem CC les fyrir breytingu, ekki git HEAD. Ein JSON-lestrar-/samanburðarkeyrsla nægir: registry parsast; R1/E1/S2/C hnit, auðkenni og upprunatilvísanir óbreytt; engin EXACT_GAP-staða hækkuð í staðfest aðgengi. Athuga að afhendingartexti tengi óleysta norðurtengingu við #500 og unsupported-hegðun við #501, og að S2 sé hlutlaus aðkomulýsing. `git diff --check` fyrir tracked breytingar; lesa nýjar untracked textaskrár beint þar sem diff --check nær ekki yfir þær. Engin ný test-framework, frontend-próf, build, vafri eða endurkeyrsla eldri rannsóknarprófa þarf fyrir þessar textabreytingar.

Viðtaka er samræmd endpoint-skrá og tilbúinn, heiðarlegur GitHub-frágangstexti. Ekki bæta valfrjálsri SHA-/mutation-herðingu KC1/KB1 við. Stoppa þegar þetta er tilbúið.


### LA1 — orðréttur miðagrunnur (Ripley las á GitHub 2026-11-13)

Þessar tilvitnanir eru framkvæmdargrunnur CC án netaðgangs. Ekki giska á önnur skilyrði eða skrifa yfir miðana. Handoff er viðbótartexti/umfangstillaga fyrir eiganda, ekki ný heildarútgáfa þeirra.

#499, „Lokaskilyrði“ (orðrétt):

- [ ] Nákvæmur R1-punktur/heiti samþykkt og tengingar norður/suður rekjanlegar.
- [ ] E1 endurnýtt með réttum raw/ledger/native SHA, vísum og þvert-á-stykki mótprófi; ER1–ER3 tekin með þar sem gögnin eru notuð.
- [ ] S2 WGS84 staðfest gegn báðum mótshliðum og öllum nákvæmnistigum, aðkomuheiti ákveðið á heimildabundnum grunni.
- [ ] Akureyri C varðveitt án endurvals.
- [ ] Akstursaðgengi/áttir hafa heimild eða skýra óleysta stöðu; ekkert merkt leiðarvalhæft án þeirra staðreynda sem það þarfnast.
- [ ] Afhent endpoint-skrá greinir eigandaval, staðfest gögn, candidate og óuppfyllt release-skilyrði.

#499, fyrirvari (orðrétt):

> Opin aðgengisgöt mega vera skjalfest niðurstaða rannsóknarlotu; þau teljast ekki staðfest tenging eða full lokun þessa innleiðingarhliðs.

#500, viðeigandi línur (orðrétt):

> Útbúa útgáfustýrða staðaskrá og rekjanlegar tengingar helstu staða við hringveg og skilgreinda tengivegi. Depends on: grunnendapunktaákvarðanir úr undirmiða 1; retained rannsókn má nýta strax.

> Hvorki nafnasamsvörun, geometry-snerting né vetrarþjónustuflokkur einn gerir stað valhæfan.

#501, viðeigandi línur (orðrétt):

> Samsetja rétta leið milli studdra staða úr samþykktri staðaskrá og vegkeðjum. Depends on: undirmiða 2, staðfest gagnasnið/endpoint-contract úr 1.

> Brotinn graf/óstaðfest tenging skilar skýru unsupported/gagnagati, ekki uppspunninni leið.

CC má aðeins vísa í þessi eldri miðaskilyrði og gögnin sem „Lesa“ skilgreinir. Ekki merkja allt uppfyllt: E1-provenance-takmarkanir úr lokamati standa; hlutlaus S2-lýsing staðfestir ekki opinbert aðkomuheiti; R1-bogaval/akstursaðgengi standa óleyst. Greina afhent gögn frá takmörkunum í stuttum texta. Tillaga um lokun #499 sem MVP-gagnaundirbúnings er sýnileg umfangsleiðrétting fyrir eiganda, ekki sönnun þess að eldri innleiðingarhlið sé fullnægt. Ekki útvíkka viðtöku #500/#501 umfram þessa eftirfylgni.

### Mörk og handoff

Heimilar aðeins endpoint-registry.json, nýjar skrár undir ticket-499/closure/ og CURRENT.md. Engar app/UI/API-, routing-, scoring-, veður-, gating- eða greiðslubreytingar. Engin netköll, ný gögn/dependencies, delegation, commit eða push. Ekki birta GitHub-texta eða loka miða í þessari keyrslu: eigandi sér fyrst tilbúinn texta og tekur birtingu/lokun eftir commit og push samkvæmt README. Að útbúa prompt er ekki staðfesting á að push hafi farið fram.

CC framkvæmir aðeins approved-prompt sem CURRENT vísar á í READY_FOR_CC eftir eiganda „Prompt approved“, notar CC_IN_PROGRESS → CC_COMPLETE og report-slóð úr CURRENT. Jonesy yfirfer þennan afmarkaða frágang, ekki aftur eldri gagnalotur. Þetta er fyrsta umferð þessa textafragangs; valfrjáls atriði mynda ekki nýja lotu. Eftir PASS getur eigandi notað tilbúna textann til að uppfæra #500/#501 og loka #499 sem afmörkuðum MVP-gagnaundirbúningi eftir push.

# #501 — Framhaldsáætlun MVP — 2026-11-18

Eigandi: „Flott hafðu þá með í planinu. Hvað er næst“ — Vestfirðir skulu vera sýnilegur hluti framhalds, ekki falla sjálfkrafa úr þekju. Þetta er áætlun; engin ný framkvæmdarlota virkjuð með skjalinu. Fylgja approved-prompt ferli fyrir hvert næsta afmarkaða verk.

## Tilbúið

Samsetningarkjarni, geometry API og samþykkt MVP-pör Rauðavatn↔Selfoss, Rauðavatn↔Hella og Egilsstaðir↔Seyðisfjörður. Núverandi runtime pilot hefur fimm mappaða enda; þetta sannar ekki þekju allra 56 staða.

## Röð framhalds

1. **Báðir Hringvegsvalkostir.** Næsta afmarkaða framkvæmd: Rauðavatn↔Selfoss, stutta suðurleiðin og hinn valkosturinn norður um land, í báðar ferðastefnur. Endurnýta raunverulegar varðveittar keðjur og samþykktar MVP-forsendur. Lítið sameiginlegt valkostasvar: stöðug ID/útgáfa, endar, raðaðir kaflar og raunverulegir millistaðir; styttri valkostur sjálfgefinn án öryggisfullyrðingar. Ekki ný leiðarvélararkitektúr. Undirbúningsathugun þarf að staðfesta hvort retained hringkeðja sé full, ekki lofa samfelldum hring af því stutt leið virkar. Síðan endurnýta fyrir Hellu.
2. **Vestfirðir sem tengt leiðanet.** Tengja við Hringveginn og útfæra stofnleiðir/greinar fyrir þá Vestfjarðastaði sem eru í samþykktri staðaskrá. Fyrsta raunpar/tenging valin eftir stutta skoðun fyrirliggjandi gagna; ekki gera allt Vestfjarðanet að einni risalotu. Nota staðaskrá og retained coverage/acquired-geometry/approach skrár, ekki byrja rannsókn frá grunni. Ferðalisti eiganda er vöru- og landfræðilegt samhengi, ekki nákvæm línuleg röð allra afleggjara. Staðir utan stofnleiðar tengjast sem greinar. Nýjar heimsóknir/áfangastaðir úr ferðalistanum bætast ekki sjálfkrafa við 56-staðaskrána. Engin forsenda um að þjónusta sé heilsársopin eða vegir færir.
3. **Staðaþekja og sameiginleg niðurstaða.** Gera upp alla 56 samþykkta staði: raunverulega studd pör/leiðir, afleggjarar og skýr gagnagöt. Ekki telja staðaval eitt og sér akstursleið og ekki hljóðlega fækka vöruþekju í fimm. Sameiginlegt leiðarsvar hefur valkost, ordered geometry/vegkafla og tengipunkta fyrir veður/færð. Raunveruleg veður-/færðartenging kemur í #503; Frá/Til-UI í #502.
4. **Lokapróf gegn #501.** Báðar áttir/valkostir, beina veg93-leiðin, same_place, engin tvítalning sameiginlegra kafla/hringlokunar, skýr unsupported fyrir óstudda tengingu, lokun ekki sjálfvirk hjáleið og gömlu föstu leiðirnar áfram virkar. Nýta fyrirliggjandi próf, ekki útgáfuherðing. Gera upp opin gagnagöt/þekju við eiganda áður en #501 er talið fullgert; ekki loka miðanum aðeins af því pilot-próf standast.

## Vinnuregla

Minimum viable product, einfaldar skráðar vinnuforsendur, engin Vegagerðar-staðfesting sem almenn forkröfa. Sýnd röng leið eða raunverulegt gagnagat þarf afmarkaða lausn; valfrjáls nákvæmni opnar ekki sjálfvirka rannsóknarlykkju. Þessi áætlun er ekki heimild til netöflunar, kóða utan approved prompt, commit/push/deploy eða GitHub-breytinga. Fyrri loknir áfangar haldast CLOSED.


## Uppfærsla eiganda — 2026-11-19, báðir Íslandspakkar

Þessi færsla gengur framar fyrri föstum 56-staða mörkum hér að ofan: upprunatafla164staða er nýr innleiðingargrunnur og hnit hennar duga fyrir MVP. Núverandi runtime56 er söguleg implementation-staða, ekki endanleg vöruafmörkun. Útvíkka svæðisbundið, ekki allt landið í einu. Ferjur utan umfangs, akstur að ferjuhöfnum má með. Endurnýta núverandi Hringveg; ljúka virkri Hella-lotu án nýrra pakkakrafna. Næst Vestfirðir: fyrst1/60→Búðardalur, síðan stofn60/61 og68/Þröskuldar með greinum samkvæmt eigandakorti. Staðaþekjuuppgjör fylgir nýju svæðisumfangi fremur en gömlu56-lokunarskilyrði. Sjá owner-packages-2026-11-19/source-note.md og westfjords-entry-mvp/next-prompt-draft.md; drög óvirk þar til núverandi lotu lokið og prompt-review ferlið hafið. Nálægðartillögur aldrei sjálfvirkt staðfestar færðartengingar.

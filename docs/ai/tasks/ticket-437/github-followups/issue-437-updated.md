## Tilgangur og vandamál

Rannsaka vindorð og flokkun með hliðsjón af Veðurstofunni. Markmiðið er að bregðast við eftirfarandi fundarathugasemd innan afmarkaðs umfangs, með yfirferð núverandi útfærslu áður en breyting er ákveðin.

## Heimild og athugasemd úr fundarúrdrætti

Heimild: Expert Support fundur með Guðrúnu Nínu Petersen hjá Veðurstofu Íslands, 14. október 2026; fundarúrdráttur afhentur af eiganda. Athugasemdir eru endursagnir úr úrdrætti, ekki orðréttar tilvitnanir. Fundurinn er ekki formleg staðfesting Veðurstofunnar á líkani Eltum Veðrið.

Fundur: 10:00, 19:30, 39:40. Athugasemd: nota vindhraðaflokkun og varast skilgreind orð á borð við storm/rok; hviður túlkaðar í samhengi.

## Okkar tillaga að útfærslu

Vandamál/útfærsla okkar: kortleggja núverandi orð/viðmið og mælieiningar, bera við opinbera töflu, aðgreina vindhraða og hviður. Rannsóknarskýrsla og tillaga áður en flokkun breytist. Ekki yfirfæra vindstig á hviður eða breyta safety-viðmiðum án sérstakrar yfirferðar.

## Acceptance criteria

núverandi orð/gagnategundir skráð, frávik og óvissa greind, rökstudd tillaga/heimildir.

## Prófunarkröfur og tengdir eldri miðar

viðmiðunardæmi/mörk/einingar, sértilvik hviður; engin framleiðslubreyting í rannsókninni. Tengist #142/#117 Done og N1; ekki sama umfang.

Heimild: https://www.vedur.is/vedur/frodleikur/greinar/nr/349 (skoðuð 2026-10-14).

<html>
<body>
<!--StartFragment--><h2 style="margin-top: 1.57em; margin-bottom: 0.55em; color: rgb(81, 103, 138); font-size: 1.42em; font-family: Arial, sans-serif; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; letter-spacing: normal; orphans: 2; text-align: left; text-indent: 0px; text-transform: none; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; white-space: normal; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">Vindhraðaflokkun</h2><p style="margin-top: 0px; margin-bottom: 0.7em; color: rgb(51, 51, 51); font-family: Arial, sans-serif; font-size: 12px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: left; text-indent: 0px; text-transform: none; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; white-space: normal; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">Til þess að auðvelda skilning á vindhraðaeingunni m/s má notast við eftirfarandi töflu:</p><p style="margin-top: 0px; margin-bottom: 0.7em; color: rgb(51, 51, 51); font-family: Arial, sans-serif; font-size: 12px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: left; text-indent: 0px; text-transform: none; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; white-space: normal; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">   </p>
Vindhraði í m/s | Lýsing
-- | --
<5 | Mjög hægur vindur
5-10 | Fremur hægur vindur
10-20 | Talsverður vindur
20-30 | Mjög hvasst, fólk þarf að gá að sér
>30 | Stórviðri, fólk ætti ekki að vera á ferli að nauðsynjalausu, hættulegt

<!--EndFragment-->
</body>
</html>

## Forgangur og mörk

P1 · Project #3 · Todo.

Engar scoring-, veðurfræðilegar þröskulda- eða gagnagjafabreytingar án rannsóknar og sérstakrar samþykktrar útfærslu. Þessi miði heimilar ekki sjálfkrafa provider-skipti eða nýtt áhættulíkan.


---

## Rannsókn lokið — framhaldsverkefni (2026-10-23)
Staðbundin rannsókn fékk PASS eftir Jonesy/Ripley yfirferð. Skjöl: `docs/ai/tasks/ticket-437/research-report.md`, `inventory.md`, `reference-cases.md`, `source-register.md` og `result-review.md`. Engin app-/þröskuldabreyting var gerð og fundurinn er ekki formleg staðfesting Veðurstofunnar.

Framhaldsútfærsla fer í aðskilda miða:
- #460 (P0): gagnavöntun í leiðarmati má ekki birtast sem staðfest LOW.
- #461 (P1): aðgreina birt/textatúlkuð vindgildi frá vigtuðu skorunarinntaki; skorun óbreytt.
- #462 (P1): samþykkt IS/EN orðalagsvörpun fyrir hvassviðri/stormaskeið, án viðmiðabreytinga.

F-01 er ekki staðfest einingavilla: varðveitt public-host sýni 19.10.2026 sýnir m/s með legacy parameter. Núverandi customer-host behavior/rekstrarstaðfesting er óstaðfest. Önnur óvissa og ókannaðar birtingar haldast samkvæmt lokamati. GitHub-miðanum er ekki lokað sjálfvirkt; commit/push og lokun eru eigandastýrð.

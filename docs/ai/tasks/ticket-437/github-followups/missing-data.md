## Tilgangur og vandamál
P0. #437 F-04/RC-17 sýnir að estimateRouteRisk skilar LOW og núllum þegar allar spásóknir leiðarpunkta bregðast. Óþekkt gögn mega ekki gefa sömu fullvissu og staðfest lág áhætta.

## Tillaga að útfærslu
Rekja routeRisk.js → alla núverandi neytendur áður en gagnasamningur breytist. Skilgreina skýrt unavailable/unknown og þekju fyrir enga/gallaða/hlutlæga gagnasókn. Ekki framleiða logn úr null/NaN eða staðfesta LOW á ófullnægjandi þekju. Varðveita núverandi LOW/MED/HIGH viðmið þegar gögn eru fullnægjandi. Sýna IS/EN óvissu í núverandi leiðarmatsbirtingu, engin öryggistrygging. Fyrst þarf skýra ákvörðun um hlutþekju, ekki nýtt óútskýrt hlutfallsmark.

## Acceptance criteria
- Allar sóknir bila/engin gild vindgögn → óþekkt/ótiltækt mat, aldrei staðfest LOW eða tilbúin núll.
- Hlutþekja og vöntun vinds/hviða hafa skilgreindan gagnasamning og sýnilega takmörkun.
- Fullgild gögn halda núverandi flokkun og þröskuldum.
- Allir neytendur meðhöndla nýja stöðu án villu eða fallbacks í rólegt veður.

## Prófunarkröfur
All-failed, empty, null/undefined/NaN, hluti punkta bilaður, vantar aðeins eina breytu, fullgild róleg og slæm gögn, núverandi mörk, IS/EN birting. Endurskapa RC-17 fyrir/eftir.

## Tengsl og utan umfangs
#439 skýrir merkinguna eftir lagfæringu. #429 er framtíðarvetrarrannsókn; #204 er endastaða-gluggi. Ekki tvítekningar. Engin almenn endurskrifun scoring/normalization; aðrir núll-defaults F-05 fá sér afmarkað mat.

## Heimild og afmörkun
Framhald rannsóknar #437: `docs/ai/tasks/ticket-437/research-report.md`, inventory og reference-cases. Expert Support fundur 14.10.2026 (10:00, 19:30, 39:40), eigandafenginn úrdráttur; þessi tæknilega tillaga er okkar niðurstaða, ekki orðrétt athugasemd eða formleg staðfesting Veðurstofunnar. Engin gagnaveituskipti, ný veðurfræðileg mörk eða opinbert viðvörunarlíkan. Ekki endurkeyra alla rannsókn #437.

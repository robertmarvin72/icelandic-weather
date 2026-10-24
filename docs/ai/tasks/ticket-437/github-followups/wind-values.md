## Tilgangur og vandamál
P1. #437 F-02 og INV-A09–A14 sýna að windMax getur verið tímavigtað skorunarinntak þegar hourly er til, en hrátt daily-hámark annars. Þetta er birt/túlkað á mörgum stöðum sem vindhraði eða meðalvindur.

## Tillaga að útfærslu
Kortleggja hvern neytanda úr #437 og skilgreina aðskilin merkingarbær birtingar-/textagerðargildi, með skýru tímabili, einingum og uppruna. Aðgreina vind og hviður. Skilgreina hegðun þegar hourly vantar; ekki búa til meðalvind eða logn. Varðveita núverandi vigtuð skorunarinntök og reiknireglur. Birtingar-, ráðlegginga- og textagerðarleiðir geta deilt kóða; ef leiðrétting myndi breyta stay/move/consider, röðun, textagerðarviðmiðum eða safety-trigger þarf að sýna áhrif og fá sérstaka samþykkta afmörkun áður en hún er innleidd.

## Acceptance criteria
- Sýnd vindgildi og tölulegar forsendur texta hafa skjalfesta merkingu og tímabil, óháð því hvort hourly er til.
- Vigtuð skorunargildi eru ekki merkt sem hrá veðurmælistærð.
- Skor, röðun og recommendation-reglur halda óbreyttri hegðun; víðari áhrif fara í sér ákvörðun.
- Allir valdir neytendur og afmarkaðir óleystir neytendur eru skráðir; engin blind endurnefning sameiginlegs windMax.

## Prófunarkröfur
Sama 18 m/s atvik að degi/nóttu, daily-only fallback, vindur vs hviða, vöntun/NaN, m/s og notandaeiningar, IS/EN. Parity-próf á skorun/röðun og sýnileg viðmiðunardæmi fyrir hvern breyttan neytanda.

## Tengsl og utan umfangs
#442 sér um samanburðarframsetningu og þarf réttar mælistærðir úr þessum miða. #439 skýringar byggja á þessum skilgreiningum. #444 er sérstaklega um hita og verður ekki víkkaður. Engar skorunarbreytingar, viðmiðabreytingar, tier-klipping eða provider-skipti.

## Heimild og afmörkun
Framhald rannsóknar #437: `docs/ai/tasks/ticket-437/research-report.md`, inventory og reference-cases. Expert Support fundur 14.10.2026 (10:00, 19:30, 39:40), eigandafenginn úrdráttur; þessi tæknilega tillaga er okkar niðurstaða, ekki orðrétt athugasemd eða formleg staðfesting Veðurstofunnar. Engin gagnaveituskipti, ný veðurfræðileg mörk eða opinbert viðvörunarlíkan. Ekki endurkeyra alla rannsókn #437.

# #490 — afmörkuð lagfæring v2

Ripley 2026-11-04: REVISE samkvæmt Jonesy R1; leiðrétting á röngu select-skilyrði S3 sem Ripley felldi inn í v1. CC fylgdi fyrirmælum. V1 varðveitt; mörk þess gilda áfram nema select-fókusreglan sem er leiðrétt hér. Keyrsla bíður eiganda „Prompt approved“.

Lestu README/CURRENT, result-review.md og cc-report.md. CURRENT → CC_IN_PROGRESS. Aðeins eftirfarandi UI-/prófabreytingar:

1. **R1:** Brottfarar-select heldur fókus við ALLAR eigin onChange-breytingar; það uppfærir selectedHour/kort/samantekt/samanburð án þess að focus() sé kallað. Aðgreina þessa leið frá samanburðartökkum með minnstu staðbundnu breytingu, t.d. setSelectedHour beint á select. Takkaleiðin −2/+2 heldur núverandi fókus á stöðugan hnút og aria-live-tilkynningu. Select má áfram tilkynna aria-live ef það gerist án fókusflutnings; ekki krafa um nýja tilkynningarleið. Sjálfvirkt fyrsta val/mínútutík flytur áfram aldrei fókus.
2. Uppfæra núverandi jsdom-próf sem krafðist rangrar hegðunar: focus á select, breyta gildi og staðfesta að select haldi focus meðan gögn/tímar uppfærast. Halda takkafókusprófi óbreyttu að tilgangi.
3. Raunverulegt Playwright-próf í appinu með stubbuðu API: Tab að brottfararselect, ArrowDown tvisvar með eðlilegri native-hegðun; staðfesta tvö tímaskref, document.activeElement enn select og kort/samanburður endurmiðjast. Ef vettvangur þarf Enter til að staðfesta native-popup er það eðlileg lokun valsins; ekki focus() milli örvaskrefa eða kalla selectOption sem staðgengil örvaprófs. Endurkeyra fyrirliggjandi Tab→Enter samanburðartakkapróf til að tryggja að sú leið haldist.
4. **R2 smá orðalag:** Bæta skýru IS/EN orðalagi við ástæður ARRIVAL_OUTSIDE_WINDOW og POINT_UNAVAILABLE um að samanburður krefjist gagna fyrir alla sex punktana, eins og METRIC_GAP gerir þegar. Engin breyting á ástæðuforgangi, hæfisreglu eða útreikningi. Uppfæra viðeigandi strengjapróf.

Keyra breytt page-próf, viðeigandi samanburðarpróf, lint og núverandi Playwright-skrá með nýju lyklaborðsprófi. Ekki endurtaka fulla suite/build eða óbreytta bakendaprófun án ástæðu. Lestur/próf með stubbum, engin raunveita/lykill/netrannsókn. Engin hjálpartækjasmíði/dependency eða breyting á ETA/summary/comparison-mathematík, backend/cache, færðarlista eða gagnaglugga. Production NOT_TESTED áfram; ekki birta eða loka GitHub-miða.

Bæta dagsettri viðbót við cc-report.md með breytingum/prófum/takmörkunum og varðveita fyrri texta. CURRENT → CC_COMPLETE. Engin commit/push/GitHub/deploy. Eigandi → Jonesy „CC búinn“, síðan Ripley lokamat. Önnur óskilyrt atriði úr yfirferð samþykkt, ekki ný verkefni.

# #492 tímasleði — heimild

Lesið af https://github.com/robertmarvin72/icelandic-weather/issues/492 2026-11-25. Orðrétt viðbót; þetta er kröfuheimild, ekki framkvæmdarheimild.

## Viðbót 25. nóvember 2026: Tímasleði fyrir veðurspá

### Markmið og staðsetning

Skipta núverandi fellilista fyrir tíma veðurspár út fyrir tímasleða og skrefahnappa. Notandi geti auðveldlega borið saman veður á mismunandi tímum án þess að opna fellilista ítrekað.

Setja tímastýringuna beint fyrir ofan veðurtöfluna, innan veðurhlutans. Færð og lokanir eru í sérhluta fyrir ofan tímastýringuna. Þessi staðsetning gengur framar eldri fyrirmælum þessa miða um tímaval ofan við færðarhlutann.

### Framsetning og virkni

- Sýnilegt heiti: **„Tími veðurspár“**.
- Sýna valda dagsetningu og tíma áberandi, með vikudegi, degi, mánuði og klukkustund. Staðfæra samkvæmt núverandi IS/EN- og tímabeltisreglum verkefnisins.
- Sleðinn færist í klukkustundarskrefum innan þess tímabils sem fyrirliggjandi gögn styðja. Ekki lengja spátímabil eða búa til gildi milli tiltækra spátíma.
- Birta dagskil og fáar, læsilegar tímamerkingar. Aðlaga fjölda merkinga að skjábreidd.
- Hnappar fyrir **fyrri klukkutíma** og **næsta klukkutíma** fylgja sleðanum. Slökkva á viðeigandi hnappi við upphaf/enda tiltæks tímabils.
- Veðurgildi og viðeigandi veðursýn á korti, ef hún er til staðar, fylgi völdum tíma. Sama val gildir fyrir alla veðurpunkta.
- Uppfæra úr fyrirliggjandi gögnum þar sem hægt er. Ef ný gagnasókn er nauðsynleg, sameina hraðar breytingar svo drag valdi ekki einu netkalli fyrir hvert smáskref.
- Sýna hleðslustöðu meðan ný gögn berast. Ekki sýna eldri gildi sem niðurstöðu nýs tíma; seint svar fyrir eldra val má ekki yfirskrifa nýjasta val.
- Varðveita núverandi merkingu og gildissvið spátímavals við leiðarskipti. Ef tími er ekki lengur tiltækur skal sýna skýra niðurstöðu.
- Ef engir spátímar eru tiltækir skal sýna gagnaskort og óvirkja tímastýringu.

### Aðgreining veðurs og færðar

Við sleðann:
> Sami spátími fyrir alla veðurpunkta.

Við færðarhlutann:
> Nýjasta færðarstaða, óháð völdum spátíma.

Tímastýringin breytir aðeins veðurspá. Hún velur ekki færð í framtíðinni, komutíma á punkta eða brottfarartíma. Færðargögn mega áfram uppfærast samkvæmt venjulegri gagnasókn, en færð má ekki túlka sem spá fyrir valinn tíma.

### Aðgengi og mörk MVP

- Sleðinn virki með snertingu, mús og lyklaborði, hafi sýnilegan fókus og aðgengilegt heiti og lesanlega dagsetningu/tíma sem gildi fyrir skjálesara.
- Skrefahnappar geri nákvæmt tímaval mögulegt án dráttar.
- Stýring og merkingar séu læsileg í síma og við 200% þysjun.
- Nýta núverandi íhluti eða innbyggða vafravirkni þar sem við á.
- Spilunarhnappur og sjálfvirk tímakvikun eru utan þessarar viðbótar.
- Engar breytingar á veðurlíkani, gagnagjöfum, spátímabili, leiðaþekju, ETA eða ráðleggingum.

### Samþykktarskilyrði tímasleða

- [ ] Tímasleði og fyrri/næsti-klukkutíma-hnappar koma í stað fellilistans í síma og tölvu.
- [ ] Valin dagsetning og tími eru áberandi og passa við birt veðurgildi.
- [ ] Aðeins tiltækir spátímar eru veljanlegir; mörk og gagnaskortur eru meðhöndluð skýrt.
- [ ] Allir veðurpunktar sýna sama valda spátíma.
- [ ] Sleðinn er beint yfir veðurtöflunni; færðarhlutinn er aðskilinn fyrir ofan.
- [ ] Færð breytist ekki í framtíðarspá við tímaval og skýringar um aðgreininguna sjást.
- [ ] Hratt tímaval og hæg gagnasókn birta ekki gömul svör sem niðurstöðu nýjasta vals.
- [ ] Mús, snerting, lyklaborð, skjálesaragildi og mörk skrefahnappa eru yfirfarin.
- [ ] Skjáskot úr síma og tölvu sýna sleðann og uppfært veðuryfirlit.
- [ ] Engin sjálfvirk spilun, ETA eða brottfararráðlegging bætist við.


# #500 — lokunarmat, 2026-11-16

Ripley: samanburður á lifandi GitHub-miðum #500–#504, núverandi vörugögnum og samþykktu 56-staða eigandaumfangi. Þetta er stöðumat, ekki nýtt framkvæmdarprompt eða samþykki fyrir útilokun staða.

## Niðurstaða

54/56 segir til um valda vörupunkta, ekki staðfestar vegtengingar. #500 er því ekki sjálfkrafa lokið þegar síðustu tvö hnitin finnast. Miðinn leyfir hins vegar nákvæmt gagnagat sem rekjanlega niðurstöðu; ekki þarf að fullgera alla leiðarvélina eða allt viðmótið til að loka gagnamiðanum.

| Atriði | Núverandi staða | Merking fyrir lokun |
| --- | --- | --- |
| Endanlegur vörulisti | Eigandi samþykkti alla 56; `nationwide-owner-scope.md`, `server_data/winter-route-places.json` | Eldri 72-staða vinnulisti er rannsóknarsafn, ekki krafa um 72 staði í vörunni. Ekki bæta við Reykholti/Garðabæ vegna eldra miðatexta. |
| Rekjanlegar rannsóknir | Eldra 72-raða `ticket-493-access-points/place-access-status-v3.csv` varðveitt; nýjar heimildir og ákvarðanir í ticket-500/server_data | Eldri tafla er söguleg, ekki núverandi stuðningslisti. Lokahandoff þarf að vísa skýrt á gildandi gögn og umfangsbreytingu. |
| Vörupunktar | 54 með hnit; Keflavík bær og Þórshöfn án hnita | Tvö afmörkuð göt. KEF er sjálfstæður staður og leysir ekki Keflavík bæ af hólmi. Engin heimild hér til að sleppa þessum stöðum úr vörumarkmiði. |
| Vegtengingar og aðgengi | 54 `ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED`, 2 `NO_RETAINED_MATCH_CHECKED`; valdir punktar eru ekki almenn leiðastuðningsyfirlýsing | Aðkomupunktur einn sannar ekki akstur milli staða. Afhenda þarf skýrt hvaða varðveittu tengingar/keðjur má nota og hvaða tengingar eru nákvæmlega óstaðfestar. Ekki merkja þær SUPPORTED án sönnunar. |
| Afhending til #501 | Skrá með `schema_version: 1`, heimildatilvísanir og varðveitt keðju-/tengigögn eru til | Vantar eitt samræmt lokahandoff sem skilgreinir gildandi gagnasett, nothæfan stuðning og áhrif gagnagata. Ekki búa til nýtt gagnakerfi eða endurtaka loknar rannsóknir. |
| Leiðasamsetning og Frá/Til | Núverandi UI notar enn föst routeId-val; almenn leiðasamsetning ekki afhent | Innleiðing tilheyrir #501/#502, ekki #500. |

## Minnsta leið að ákvörðun um lokun

Ein afmörkuð lokafrágangslota á #500: nýta núverandi gögn, sameina gildandi stuðnings-/gatastöðu í skýrt handoff til #501 og samræma lokaskilyrðin við samþykkta 56-staða listann. Þar þarf að greina tvö hnitagöt frá óstaðfestum vegtengingum. Ekki krefjast nýrrar þjóðarskönnunar, allra mögulegra leiða eða viðmóts hér.

Ef Keflavík bær/Þórshöfn eða aðrar tengingar verða áfram gagnagöt þarf lokunarákvörðunin að segja það berum orðum og tilgreina áhrif á fyrstu leiðaútgáfu. Eigandinn hefur ekki með þessu mati samþykkt minni landsþekju eða að fjarlægja staði. Ef eigandinn vill enga slíka frestun þarf að leysa þau tilteknu gagnagöt áður en full þekja er sögð afhent.

## Aðskildir eftirfylgnimiðar

- [#501](https://github.com/robertmarvin72/icelandic-weather/issues/501): samsetja leiðir úr samþykktum tengingum, leiðaauðkenni og báðar áttir þar sem gögn styðja.
- [#502](https://github.com/robertmarvin72/icelandic-weather/issues/502): Frá/Til, víxlun og leiðaval í núverandi viðmóti.
- [#503](https://github.com/robertmarvin72/icelandic-weather/issues/503): veður/færð á valinni leið og sameiginlegur spátími.
- [#504](https://github.com/robertmarvin72/icelandic-weather/issues/504): heildarflæði og útgáfuþekja.

Heimild að lokaskilyrðum: [#500](https://github.com/robertmarvin72/icelandic-weather/issues/500), sérstaklega „staðfest/studd tenging, nákvæmt gagnagat eða eigandasamþykkt útilokun“ og afhending gagna handa leiðarvél.

Engin vörugögn, workflow-stig, GitHub-miðar eða kóði breytt í þessu mati. Engin ný prófakeyrsla nauðsynleg fyrir þetta skjal; fyrra lokamat á gagnalotu stendur óbreytt í remaining-map-selection/result-review.md.

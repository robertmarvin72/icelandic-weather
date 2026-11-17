# Sameiginleg yfirferð 29 óvalinna staða — Ripley

2026-11-16. Tillögur fyrir prompt-yfirferð; engin vörugögn eða eigandaval breytt.27 source-punktar skoðaðir í OpenStreetMap með myndsýn,27 kortaopnanir, engin vefleit eða ný geometry-öflun. Keflavík bær/Þórshöfn fengu gagnagataathugun án kortavals. Endar/WGS84/native-vörpun/source-SHA í candidate-review.json.

## Ráðlagðir vörupunktar

| Staður | Source-endi | Staðarlýsing / beint sýnilegt á korti |
|---|---|---|
| kopavogur | 3073 START | Punktur á Hafnarfjarðarvegi við Kópavogsdal. Á gegnumvegi sunnan miðhluta Kópavogs við Kópavogsdal og íþróttasvæði; ekki gatnamót eða staðfest bæjaraðkoma. [Kort](https://www.openstreetmap.org/?mlat=64.10411666&mlon=-21.90418005#map=15/64.108/-21.906) |
| hafnarfjordur | 10287 START | Punktur við tengingu Hafnarfjarðarvegar og Reykjanesbrautar í Hafnarfirði. Við vegi40/41 innan byggðarsvæðis. Annar source-punktur en afturkallaði2807 START; ekki nákvæm graph-tenging staðfest. [Kort](https://www.openstreetmap.org/?mlat=64.07380373&mlon=-21.93959097#map=15/64.071/-21.945) |
| mosfellsbaer | 2469 END | Punktur við Vesturlandsveg og Þingvallaveg í Mosfellsbæ. Við hringtorgið með merktum vegum1/36; source-endi við arminn, ekki miðja hringtorgsins. [Kort](https://www.openstreetmap.org/?mlat=64.17602806&mlon=-21.67652824#map=15/64.175/-21.682) |
| akranes | 3797 END | Punktur við Akranesveg og innkomuhringtorgið við byggðina. Við hringtorg Akranesvegar/Kalmansbrautar/Þjóðbrautar. Eldra2,5m raw-bil að hring21441 helst; kortamat er ný stoð fyrir vörupunkt, ekki leiðrétting á eldri exact-seam-niðurstöðu. [Kort](https://www.openstreetmap.org/?mlat=64.32768822&mlon=-22.05256417#map=16/64.32768822/-22.05256417) |
| stykkisholmur | 3466 START | Punktur við Aðalgötu og syðri byggð í Stykkishólmi. Pinninn á Aðalgötu58 við suðurjaðar samfelldrar byggðar, nálægt Tjarnarási. [Kort](https://www.openstreetmap.org/?mlat=65.06799806&mlon=-22.73935627#map=15/65.071/-22.733) |
| budardalur | 2769 START | Punktur við Vestfjarðaveg og Brekkuhvamm í Búðardal. Á vegi60 við Brekkuhvamm og syðri byggð. [Kort](https://www.openstreetmap.org/?mlat=65.10591772&mlon=-21.76505686#map=15/65.108/-21.764) |
| reykholar | 2662 END | Punktur á Karlseyjarvegi við Reykjabraut á Reykhólum. Vegur606 liggur við byggðina og Reykjabraut; ekki fjarri gatnamót607 í stað bæjarins. [Kort](https://www.openstreetmap.org/?mlat=65.44592572&mlon=-22.20532007#map=15/65.446/-22.205) |
| isafjordur | 3834 END | Punktur á Djúpvegi við norðurhluta byggðar á Ísafirði. Pinninn við norðurenda Urðarvegarbyggðar og Djúpveg61; ekki punktur við flugvöllinn. [Kort](https://www.openstreetmap.org/?mlat=66.08035668&mlon=-23.12399231#map=15/66.078/-23.129) |
| sudavik | 3535 START | Punktur á Aðalgötu við suðurhluta byggðar í Súðavík. Á vegi61 við suðurhluta núverandi byggðar; ekki aðeins svæðisheitið Súðavíkurhreppur. [Kort](https://www.openstreetmap.org/?mlat=66.02459271&mlon=-22.99225430#map=15/66.029/-22.991) |
| holmavik | 3883 END | Punktur við Hólmavíkurveg og Höfðagötu í byggðinni. Á vegi67 í syðri byggð, nær bænum en gatnamót67/61 utan byggðar. [Kort](https://www.openstreetmap.org/?mlat=65.70146962&mlon=-21.68414766#map=15/65.702/-21.682) |
| drangsnes | 3245 END | Punktur á Aðalbraut við norðurhluta byggðar á Drangsnesi. Pinninn þar sem Aðalbraut/Drangsnesvegur645 liggur við norðurhluta byggðar; ekki fullyrðing um aðalinnkomu frá Hólmavík. [Kort](https://www.openstreetmap.org/?mlat=65.69125093&mlon=-21.44027942#map=15/65.69/-21.443) |
| hvammstangi | 3487 START | Punktur á Norðurbraut við byggð á Hvammstanga. Við byggð og skipti vegar72/711, nálægt Hvammstangaheiti; ekki Hringvegsgatnamót fjarri bænum. [Kort](https://www.openstreetmap.org/?mlat=65.39804115&mlon=-20.94389335#map=15/65.398/-20.944) |
| blonduos | 2593 END | Punktur við Hringveg og Flóðabakka á Blönduósi. Pinninn við veg1/731 í byggð sunnan Blöndu. [Kort](https://www.openstreetmap.org/?mlat=65.65634119&mlon=-20.28373541#map=15/65.659/-20.285) |
| skagastrond | 2455 END | Punktur við Fellsbraut og austari byggð á Skagaströnd. Á Skagastrandarvegi74/Fellsbraut við byggðina, fremur en fjarlægri73/74-tengingu. [Kort](https://www.openstreetmap.org/?mlat=65.82381799&mlon=-20.29628289#map=15/65.825/-20.302) |
| dalvik | 3567 START | Punktur á Dalvíkurvegi við syðri byggð á Dalvík. Við skóla/íþróttasvæði sunnan byggðar. Er enn innri samskeyti sama vegar við3501; kortastaðsetning styður vörupunkt, ekki áður rangt ytra samskeyti. [Kort](https://www.openstreetmap.org/?mlat=65.96755395&mlon=-18.52948806#map=15/65.97/-18.531) |
| husavik | 3092 START | Punktur á Norðausturvegi við Kringlumýri á Húsavík. Pinninn á vegi85 við Kringlumýri, sunnan samfelldrar meginbyggðar. [Kort](https://www.openstreetmap.org/?mlat=66.03234853&mlon=-17.34984614#map=15/66.036/-17.35) |
| kopasker | 8674 START | Punktur við Sléttuveg og Austurtröð á Kópaskeri. Við veg870 og Austurtröð við austurjaðar byggðar. [Kort](https://www.openstreetmap.org/?mlat=66.30152838&mlon=-16.44081709#map=15/66.3015/-16.443) |
| raufarhofn | 3169 START | Punktur á Aðalbraut við syðri byggð á Raufarhöfn. Vegur874/Aðalbraut við syðri íbúðabyggð og íþróttasvæði. [Kort](https://www.openstreetmap.org/?mlat=66.44545468&mlon=-15.94764087#map=15/66.448/-15.948) |
| neskaupstadur | 2832 START | Punktur á Strandgötu við vestari byggð í Neskaupstað. Við Strandgötu92 og Urðarteigsbyggð; ekki ferjubryggjuendi hinum megin. [Kort](https://www.openstreetmap.org/?mlat=65.14719331&mlon=-13.71556128#map=15/65.148/-13.709) |
| eskifjordur | 2834 END | Punktur á Strandgötu við vestari byggð á Eskifirði. Pinninn á vegi950/Strandgötu við höfn/íbúðabyggð; ekki suðurmunna Norðfjarðarganga. [Kort](https://www.openstreetmap.org/?mlat=65.07554219&mlon=-14.02122438#map=15/65.075/-14.016) |
| djupivogur | 3761 END | Punktur á Djúpavogsvegi við byggðina á Djúpavogi. Á vegi98 þar sem hann liggur inn í byggð, nálægt Borgarlandi og íþróttasvæði. [Kort](https://www.openstreetmap.org/?mlat=64.65406062&mlon=-14.29799027#map=15/64.655/-14.29) |
| hofn | 3652 END | Punktur við Hringveg og Hafnarveg áleiðis til Hafnar. Pinninn við veg1/99/987-tengingu, Hafnarvegur99 heldur suður. Núverandi kortastoð; ekki Flugvallarvegur982 eða full staðfesting á nýrri Hornafjarðarleið. [Kort](https://www.openstreetmap.org/?mlat=64.27847390&mlon=-15.19843537#map=14/64.278/-15.2) |
| skaftafell | 3513 END | Punktur við Hringveg og Skaftafellsveg áleiðis til Skaftafells. Pinninn við grein Skaftafellsvegar norðvestur frá Hringvegi; ekki visitor-centre-hnit. Source endi endurnýttur úr stærra retained vegnr1-setti. [Kort](https://www.openstreetmap.org/?mlat=64.00546696&mlon=-16.94397824#map=16/64.006/-16.946) |
| kirkjubaejarklaustur | 2313 END | Punktur við Hringveg og Klausturveg áleiðis í Kirkjubæjarklaustur. Við hringtorg1/205 með203 til norðvesturs. Native-endi ekki færður í miðju hringtorgs; bil að2409 START er áfram source-bil. [Kort](https://www.openstreetmap.org/?mlat=63.79468083&mlon=-18.03973357#map=15/63.792/-18.045) |
| thorlakshofn | 2280 END | Punktur við Þorlákshafnarveg og Suðurstrandarveg við byggðina. Pinninn við norðari hringtorg38/427/379; byggð og höfn sunnan/austan við. [Kort](https://www.openstreetmap.org/?mlat=63.86300272&mlon=-21.39133110#map=15/63.859/-21.388) |
| fludir | 3548 START | Punktur við Skeiða- og Hrunamannaveg og Langholtsveg á Flúðum. Á vegi30 við miðhluta byggðar og Langholtsveg341; ekki norðlægt Brúarhlaðasvæði. [Kort](https://www.openstreetmap.org/?mlat=64.13080082&mlon=-20.32143333#map=15/64.133/-20.323) |
| laugarvatn | 3252 START | Punktur við Laugarvatnsveg og Gjábakkaveg við Laugarvatn. Pinninn við hringtorg37/365 við suðvestari byggð; ekki fjarlæga35/37-tengingu. [Kort](https://www.openstreetmap.org/?mlat=64.21194753&mlon=-20.74278069#map=15/64.216/-20.738) |

## Fyrirvarar sem haldast

- Akranes: fyrra2,5m bil er enn ekki exact seam. Dalvík:3567/3501 enn innri sami vegur. Nýtt kortamat styður aðeins vörupunkt. Ekki endurskrifa eldri réttmætar greiningarniðurstöður.
- Hafnarfjörður:10287 START er annar punktur en afturkallaður2807 START. Ekki endurvekja gömlu tillöguna. Kópavogur notar3073 úr sameiginlegu acquired safni sem upphaflega fylgdi Hafnarfjarðar-IDBUTUR; tenging við Kópavog er ný Ripley-kortaskoðun, ekki réttlæting úr nafni sóknarhóps.
- Hluti punkta eru gegnumvegir/innri kaflaendar, ekki staðfestar gatnamót. Engin almennt „innan50m frá gatnamótum“-fullyrðing gerð um þessa27; skoðaður kvarði er15/16, Höfn14, samhengi byggðar/vegaheita sést. Hnit eru source-hnútar, enginn færður að kortalínu eða bæjarmiðju. Kortafrálag hefur ekki verið mælt nákvæmlega.
- Höfn: staðsetning við1/99/987 samkvæmt skoðuðu korti; ekki sönnun á fullri/nýrri Hornafjarðarleið eða legal direction. Skaftafell: junction-only við998, ekki þjónustumiðstöð. Kirkjubæjarklaustur: þjóðvegarhnútur við205-hringtorg, ekki source-samfella/brú yfir bil að2409.
- 25 þegar valdir punktar og23 afgreiðslur óbreyttar. Engin routability, núverandi opnun, stefna eða leiðarvél staðfest; aðgengi EXACT_GAP.

## Tvö afmörkuð gögn vantar

**Keflavík bær:** enginn retained punktur fyrir bæinn fannst í aðfangagrunninum; ekki nota KEF-terminal-keðju. **Þórshöfn:** veg-/verkefnislead úr fyrri leit en engin retained source-geometry sem bindur punkt. Öflun þessara tveggja er næsta afmarkaða gagnaskref, ekki almenn landsrannsókn og ekki hafin hér.

## Framkvæmdargrunnur

Eitt prompt getur fært þessa27 nákvæmu source-punkta í sama selections/places-mynstur. CC þarf ekki kortatól eða nýja netöflun; source-staðfesting og próf eru staðbundin. Eftir nýtt eigandahandoff verða54/56 með punkt og2 null ef allt stenst. Þeir tveir halda sér í fullum56-staða lista.

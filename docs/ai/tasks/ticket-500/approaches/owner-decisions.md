# #500 — Sameiginlegt eigandaákvörðunaryfirlit

Leiðrétt af Ripley 2026-11-15 eftir OD1–OD4. Þetta eru geometry-/aðkomutillögur, ekki staðfestur bæjarkjarni, eigandaval eða akstursheimild. Allir 56 staðir halda sér. Ítarefni og source-vísar: server_data/winter-route-approach-analysis.json.

## 7 ráðlagðar aðkomutillögur

| Staður | Source-punktar (lat, lon) | Fyrirvari |
|---|---|---|
| Grindavík | 53459 START: 63.85083976, -22.43242783 | Geometry-samskeyti er tillaga, ekki staðfest bæjaraðkoma. |
| Bolungarvík | 2215 START: 66.14305273, -23.2225211 | Geometry-samskeyti er tillaga, ekki staðfest bæjaraðkoma. |
| Siglufjörður | 3564 START: 66.1605843, -18.90330291 | Geometry-samskeyti er tillaga, ekki staðfest bæjaraðkoma. |
| Ólafsfjörður | 15361 END: 66.06730376, -18.65429271 | Geometry-samskeyti er tillaga, ekki staðfest bæjaraðkoma. |
| Vopnafjörður | 3707 END: 65.7641206, -14.82399559 | Geometry-samskeyti er tillaga, ekki staðfest bæjaraðkoma. |
| Grundarfjörður | 3774 START: 64.92345384, -23.27382147 | Piece 3774 is named Grundarfjörður-Vatnaleið. START has an exact seam to 2059 (Grundarfjörður-Ólafsvík). The former END option only continued the same named road via 3773 and is withdrawn as an independently grounded alternative. This structural boundary is a proposed approach, not a confirmed town centre. |
| Ólafsvík | 2698 START: 64.90014373, -23.72850184 | Pieces 2698/2740 are named Grundarfjörður-Ólafsvík. 2698 START meets 2617 (Hellissandur-Ólafsvík). The former 2740 END option only continued the same named road via 2741 and is withdrawn. This structural boundary is a proposed approach, not a confirmed town centre. |

## 7 staðir með tvo raunverulega kosti

| Staður | Source-punktar (lat, lon) | Fyrirvari |
|---|---|---|
| Þingeyri | 2272 START: 65.8665326, -23.47396873; 2759 END: 65.87976033, -23.50106733 | Two real boundaries: Vestfjarðavegur-Þingeyri and Þingeyri-Flugvöllur. Neither is automatically primary for this product. |
| Bíldudalur | 2697 END: 65.69021883, -23.59693047; 2273 START: 65.67709936, -23.61288347 | A 2-piece connected chain (2697-2273, both named Bildudalur). Neither loose-end seam is to a confirmed main highway in this acquired set -- one is a side valley road, the other the airport road; no basis to prefer one as the town approach. |
| Sauðárkrókur | 2485 START: 65.75996091, -19.64960631; 2485 END: 65.74380077, -19.62028698 | Re-examined per the approved prompt's own OB4/step-4 instruction. The prior round's unjustified END pick is replaced here: END is a real 3-way junction (meets two other roads), START meets one road (from Skagastrond direction) -- a real difference in connectivity, but not proof either is the town centre. Both shown. |
| Varmahlíð | 2477 START: 65.54703577, -19.44173885; 2477 END: 65.55340044, -19.44533505 | Piece 2477 is named Vatnsskarð (IDBUTUR 908020037). Each proposed endpoint has recorded contacts with the cited roads. The choice is not determined as a town approach by these contacts alone. |
| Patreksfjörður | 53127 START: 65.58993681, -23.97181157; 53127 END: 65.59851455, -24.00201874 | Re-examined per the approved prompt's own OB4/step-4 instruction. This piece is isolated in the acquired dataset -- no seam to any other acquired or retained-4326 piece was found at either end. The prior round's unjustified END pick is retracted; both ends are shown with equal (lack of) evidence, not a continued default. |
| Tálknafjörður | 2889 START: 65.60508239, -23.77520392; 2889 END: 65.62399623, -23.81359943 | No geometry seam at either end (isolated piece). A textual hint favors END but is explicitly not promoted to RECOMMENDED per OC3. |
| Keflavíkurflugvöllur (KEF) | 3552 START: 63.97204952, -22.54106585; 3488 END: 63.99929831, -22.62803395 | All 8 acquired pieces for this IDBUTUR are named Hafnavegur - Flugstod (terminal road) -- real evidence this serves the airport terminal specifically, even though the literal string doesn't match Keflavikurflugvollur/KEF. 5 of the 8 are closed-ring roundabout features (VEGHLUTI 5) per OC2 and excluded as line candidates. The remaining 3 form one connected chain (3552-3465-3488); its two loose ends are shown here. Neither touches an external connecting-road piece in this acquired set, so neither is preferred. This is a transport/method result (per approved-prompt-v1.md's own framing), not a confirmed KEF approach. |

## 25 nákvæm gagnagöt

Dalvík, Akranes, Hvammstangi, Skagaströnd, Kópasker, Raufarhöfn, Reykhólar, Súðavík, Ísafjörður, Höfn, Hafnarfjörður, Mosfellsbær, Blönduós, Búðardalur, Djúpivogur, Drangsnes, Eskifjörður, Flúðir, Hólmavík, Húsavík, Kópavogur, Laugarvatn, Neskaupstaður, Stykkishólmur, Þorlákshöfn.

Dalvík: fyrri tillaga var innri liður sama vegar. Akranes: 2,5 m bil við samnefndan hring, ekki nákvæm snerting. Hjá öðrum stöðum þarf heimild sem greinir réttan staðarenda; það að vegheiti finnist er vísbending, ekki sönnun. Ekki velja þessar færslur á forsendu rangra samskeyta.

## Eldri níu kandídatstaðir

Fimm suðurstaðir: sjá ticket-500/south/evidence.md. Fjórir eldri: Borgarnes, Reykjahlíð, Reyðarfjörður og Fáskrúðsfjörður í remaining-coverage.json; síðustu tveir eru nafnaályktanir, ekki þegar rökstuddir bæjarendar. Engin gömul tillaga samþykkt hér.

## Hvernig afgreiða skal

Nú eru 14 staðir með 21 tillögupunkt í þessari greiningu (7 einval + 7 tvíval). Eigandi má samþykkja/velja/hafna nægilega rökstuddum aðkomum saman; ekki þarf að velja þar sem staðsetning er enn óljós. Fyrri acquisition-skrá geymir óbreytt sögulegt END-val Patreksfjarðar/Sauðárkróks; þessi greining leysir þá ráðleggingu af hólmi með tvívali, ekki gömlu raw-gögnin. Akstursaðgengi er áfram EXACT_GAP jafnvel þótt staðarpunktur verði valinn.

# #500 — ein sameiginleg tillaga að eigandavali

Dagsetning: 2026-11-15. Staða: TILLAGA TIL EIGANDA, ekki samþykkt eða framkvæmd. Eigandi bað Ripley að fara yfir lotuna. Yfirferð aðeins á fyrirliggjandi gögnum; engin ný heimildaleit, hnitaöflun eða breyting á vörugögnum.

Markmið: velja afmarkaða aðkomupunkta fyrir vöruna þar sem núverandi gögn gefa nothæfan kost. Þetta staðfestir ekki bæjarmörk, akstursheimild eða leiðarvalhæfni. Allir 56 staðir haldast.

## Tillaga: velja þessa 10 punkta sem vöruaðkomur

Fyrstu sjö fylgja leiðréttri RECOMMENDED-greiningu. Síðustu þrír eru sérstaklega merkt vöruval á eldri kandídötum. Eigandasamþykki velur punktinn en leysir ekki óstaðfest aðgengi/tengingar.

| Staður | Stykki / geymdur endi | Breidd, lengd (WGS84) | Forsenda og fyrirvari |
|---|---|---|---|
| Grindavík | 53459 START | 63.85083976, -22.43242783 | Nákvæm geometry-samskeyti við 2972. Engin ályktun um núverandi aðgengi. |
| Bolungarvík | 2215 START | 66.14305273, -23.2225211 | Ein ráðlögð samskeytatillaga úr leiðréttri greiningu. |
| Siglufjörður | 3564 START | 66.1605843, -18.90330291 | Ein ráðlögð samskeytatillaga úr leiðréttri greiningu. |
| Ólafsfjörður | 15361 END | 66.06730376, -18.65429271 | Ein ráðlögð samskeytatillaga úr leiðréttri greiningu. |
| Vopnafjörður | 3707 END | 65.7641206, -14.82399559 | Ein ráðlögð samskeytatillaga úr leiðréttri greiningu. |
| Grundarfjörður | 3774 START | 64.92345384, -23.27382147 | Samskeyti við 2059; fyrra END var innri framhaldspunktur og er ekki kostur. |
| Ólafsvík | 2698 START | 64.90014373, -23.72850184 | Samskeyti við 2617; fyrra 2740 END var innri framhaldspunktur og er ekki kostur. |
| Hveragerði | 2135 END | 63.99538228, -21.19270972 | Eldri eini kandídat, NAME_MATCH_INFERRED. Vöruval á vestasta enda þessa kafla, með 34,75 m bili að Hellisheiðar-kafla; ekki bæjarkjarni eða staðfest tenging. |
| Vík | 3849 START | 63.41782798, -19.00028197 | Eldri eini kandídat, innri samskeyti 3849/23041. Meðvitað vöruval; ekki endapunktur föstu runtime-leiðarinnar sem heldur um 629 m austur. |
| Borgarnes | 2819 END | 64.55996252, -21.89753371 | Endurnýttur #491 P4-punktur; NAME_MATCH_INFERRED. Utan fyrri cw_long-sannprófunar, engin ný tengingarstaðfesting. |

## Tillaga: fresta vali hjá þessum 13

Ekki nægur grundvöllur til að velja án viðbótarforsendu frá eiganda. Engin ný rannsókn ræst hér.

| Staður | Fyrirliggjandi kostir / hindrun |
|---|---|
| Þingeyri | 2272 START við Vestfjarðaveg eða 2759 END að flugvallarvegi; hvaða aðkoma á að tákna staðinn er vöruákvörðun. |
| Bíldudalur | 2697 END eða 2273 START; tengingar við hliðar-/flugvallarveg greina ekki aðal-aðkomu. |
| Sauðárkrókur | 2485 START eða END; mismunandi tengingar sanna ekki hvor aðkoma hentar vörunni. |
| Varmahlíð | 2477 START eða END; stykkið heitir Vatnsskarð, samskeyti ein velja ekki Varmahlíðarpunkt. |
| Patreksfjörður | 53127 START eða END; einangrað stykki, engin staðfest ytri samskeyti. |
| Tálknafjörður | 2889 START eða END; einangrað stykki, textavísbending nægir ekki til að velja. |
| KEF | 3552 START eða 3488 END; terminal-keðja, engin staðfest ytri tenging. Ekki sameina við Keflavík. |
| Selfoss | 2138 END eða START; END samfelldur í átt að Hveragerði, START með 30,1 m bili hinum megin. Samfella ein velur ekki staðinn. |
| Hella | 3591 END eða START; END samfelldur í átt að Selfossi, START með 32,63 m bili hinum megin. Samfella ein velur ekki staðinn. |
| Hvolsvöllur | 3593 END eða START; báðir samfelldir og jafngildir í núverandi gögnum. |
| Reykjahlíð | 3566 START, aðeins native EPSG:3057-hnit í eldri tillögu; engin retained WGS84-binding í þeirri niðurstöðu. |
| Reyðarfjörður | 2520 START, nafnaályktun og native EPSG:3057; bæjarendi ekki rökstuddur. |
| Fáskrúðsfjörður | 2536 START, nafnaályktun og native EPSG:3057; bæjarendi ekki rökstuddur. |

## Afgreiðsla í einu svari

Eigandi getur samþykkt þessa afmörkuðu tillögu: „Veljum þessa 10 og frestum hinum 13“, eða nefnt undantekningar. Þangað til er ekkert skráð sem OWNER_SELECTED og engin hnit færð í places.json.

Eftir slíkt val má útbúa eitt lítið framkvæmdarprompt sem festir nákvæmlega valda punkta með source-tilvísunum og heldur aðgengi/leiðarvalhæfni óstaðfestu. Það prompt fer venjulega leið samkvæmt docs/ai/README.md. Engin heimild er hér til nýrrar gagnaöflunar, UI eða leiðarvélar.

## Heimildir í repo

- docs/ai/tasks/ticket-500/approaches/owner-decisions.md og server_data/winter-route-approach-analysis.json: 14 staðir, 21 tillögupunktur.
- docs/ai/tasks/ticket-500/south/evidence.md og server_data/winter-route-south-connections.json: fimm eldri suðurstaðir.
- server_data/winter-route-remaining-coverage.json: Borgarnes/Reykjahlíð/Reyðarfjörður/Fáskrúðsfjörður.
- docs/ai/tasks/ticket-500/place-evidence/result-review.md: Hafnarfjarðartillaga afturkölluð; enginn nýr kandídat úr þeirri lotu.

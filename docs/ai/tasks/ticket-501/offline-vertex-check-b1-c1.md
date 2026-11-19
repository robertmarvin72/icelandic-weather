# #501 — Offline hornpunkta-athugun B1/C1 — 2026-11-17

Aðeins retained GeoJSON með skýru EPSG:3057 lesin. XY-hnit bókstaflega jöfn; engin snapping/tolerance, CRS-vörpun eða tier-blöndun. Línur eru skoðaðar óstefndar eingöngu til geometry-athugunar, ekki löglegs aksturs. Innri vertices tengja hluta ef hnit þeirra eru jöfn; skurður inni á línubili án sameiginlegs vertex er ekki prófaður.

4 source-skrár, 1300 línuhlutar (afrit milli skráa eru leyfð í scan en jafnar edges tvítelja ekki lengd).

## B1: 1735 → 2071
A=(369350.568, 400623.6659), B=(369350.3714, 400623.7933); bein fjarlægð 0.234269759 m.

| Tier | Geometry-path A→B | Lengd m | IDFERILL á fundinni stystu leið |
|---|---|---|---|
| -1 | JÁ | 0.234269759 | [1735] |
| 0 | JÁ | 0.234269759 | [1735] |
| 1 | JÁ | 0.234269759 | [1735] |
| 2 | JÁ | 0.234269759 | [1735] |

### Hornpunktaheimildir (index frá 0)
- Tier -1 A_vertices: [(1735, 0, 8, 'docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json', 4833)]
- Tier -1 B_vertices: [(1735, 1, 8, 'docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json', 4833), (2071, 0, 36, 'docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json', 4877)]
- Tier 2 A_vertices: [(1735, 0, 4, 'docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json', 129)]
- Tier 2 B_vertices: [(1735, 1, 4, 'docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json', 129), (2071, 0, 4, 'docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json', 188)]

## C1: 3768 → 3767
A=(403269.528, 383219.0345), B=(403311.6927, 383222.4427); bein fjarlægð 42.302219248 m.

| Tier | Geometry-path A→B | Lengd m | IDFERILL á fundinni stystu leið |
|---|---|---|---|
| -1 | JÁ | 61.668756971 | [3454, 3767] |
| 0 | JÁ | 56.991059934 | [3454, 3767] |
| 1 | JÁ | 43.488920510 | [3454, 3767] |
| 2 | JÁ | 43.488920510 | [3454, 3767] |

### Hornpunktaheimildir (index frá 0)
- Tier -1 A_vertices: [(3768, 0, 5, 'docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json', 5765), (3454, 9, 18, 'docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json', 5880)]
- Tier -1 B_vertices: [(3767, 58, 59, 'docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json', 5764)]
- Tier 2 A_vertices: [(3454, 2, 5, 'docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json', 966), (3768, 0, 2, 'docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json', 1362)]
- Tier 2 B_vertices: [(3767, 5, 6, 'docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json', 1361)]

## Niðurstaða fyrir #501

B1 STAÐFEST GEOMETRY: upphaf 2071 er vertex index1 í 1735 í öllum fjórum tiers. 0,234m er því fyrsti stubbur 1735, ekki tómt svæði. Framtíðarleið þarf að skera við tengihnút og forðast afturábak-stubb/tvítalningu; engin runtime-lengd breytt hér. C1 STAÐFEST GEOMETRY: A (3768-exit) er innri vertex í 3454; það stykki deilir tveimur bókstaflegum XY-vertices með 3767. Path A→3454→3767→B er til í öllum fjórum tiers. Sýndar lengdir eru óstefndar stystu geometry-lengdir í hverju tier, ekki valin akstursleið eða nýr distance-contract. Ekkert krefst nýs B2-kalls; B2-sókn áfram stöðvuð. Engin runtime/gagna-/kóðabreyting hér.

Næsta innleiðing þarf að aðgreina full geometry-samskeyti frá skráðum óleystum götum og akstursheimildum. Ekki lýsa heilu hringneti eða 56-staða stuðningi af þessari athugun.

## Source-skrár / SHA256

- `docs/ai/tasks/ticket-493-place-data-phase2/samples/wfs93-raw.json`: 24 features, SHA256 `1d8c9cf880df374b9cb8120e1053e8ffd5acfba3d4bf55714e57ffdd8c49eb33`
- `docs/ai/tasks/ticket-485/samples/wfs-extension-native3057.json`: 172 features, SHA256 `23c4225a8021cc33867ba38558c87c805c9b7e1a40ae3fdf5fabb56fd90aa34f`
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json`: 996 features, SHA256 `305f60d6f1f17918c058cbd047735681e56d6f9aad99f9e16f50de9419d6983a`
- `docs/ai/tasks/ticket-429/samples/vegagerdin-wfs-routeA-geometry.json`: 108 features, SHA256 `9b8403a2498648c3c0025e1f881c313d16bec0992f318f2ccc51a6f9bdeba997`


## C1 — sjálfstæð source-hnitastaðfesting

`ticket-483/samples/wfs-vegnr1-all.json`, IDFERILL3454 er VEGNR1,
IDBUTUR902040037, VEGHLUTI5. Sama native CRS og A/B. Sameiginleg XY-vertices
3454/3767 í öllum tiers: `(403311.95,383221.48)` og
`(403312.1652,383220.1527)`. B er innri/endpoint vertex í 3767 eftir tier,
ekki annað native CRS. Engin tolerance notuð.

| Tier | OBJECTID 3454 | OBJECTID 3767 | A index í 3454 | B index í 3767 |
|---|---|---|---|---|
| -1 | 5880 | 5764 | 9 | 58 |
| 0 | 4482 | 4400 | 3 | 25 |
| 1 | 2546 | 2874 | 2 | 9 |
| 2 | 966 | 1361 | 2 | 5 |

## Afleiðing fyrir næsta skref

B1, B2 og C1 hafa nú geometry-stoð á hornpunktastigi. Ekki þarf nýtt
netkall bara til að finna þá connectora. Fyrri endpoint-only greining
var takmörkuð og gefur ekki fjarverusönnun; ekki endurskrifaðar eldri
source-skrár. Þetta klárar ekki allan hringinn, tengir ekki alla 56
staði og staðfestir ekki löglega akstursstefnu.

Næst er hægt að afmarka litla staðbundna leiðasamsetningarinnleiðingu
sem sker retained línur við sameiginlega vertices, greinir stefnutakmörk
og skilar skýru unsupported þar sem grunn vantar. Fullur hringvalkostur
er enn sjálfstætt óleystur hluti #501. Engin slík innleiðing eða
ákvörðun um gap-/hringstefnu framkvæmd með þessari offline athugun.

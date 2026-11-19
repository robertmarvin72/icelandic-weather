# #501 — offline retained geometry athugun — 2026-11-17

Engin netköll, engar heimilda-/kóðabreytingar. Aðeins JSON FeatureCollection í docs/ai/tasks og server_data lesin. Endapunktar á native-hnitastærð bornir saman við cw_long EPSG:3057. Ekki hnitavörpun, snapping eða staðfest akstursheimild.

19 FeatureCollection-skrár fundnar; 1300 native LineString/MultilineString-hlutar teknir til skoðunar. Stærðarsía útilokar WGS84; CRS þarf að staðfesta fyrir einstaka jákvæða niðurstöðu.

## 1735→2071: 0.234270 m
Frá [369350.568, 400623.6659] → til [369350.3714, 400623.7933]
Heil stök geometry með báða gap-endapunkta innan 0,001m: 0. Þetta er samanburðarviðmið, ekki heimild til brúunar.
Nærliggjandi endpoint-hlutar (einstök source/ID/tier/dist):
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 129, 'IDFERILL': 1735, 'IDBUTUR': 903010037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': 2}: frá 0.000000m, til 0.234270m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 188, 'IDFERILL': 2071, 'IDBUTUR': 253020037, 'VEGNR': '1', 'VEGHLUTI': 7, 'NAKVAEMNIFERLIS': 2}: frá 0.234270m, til 0.000000m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 1662, 'IDFERILL': 2071, 'IDBUTUR': 253020037, 'VEGNR': '1', 'VEGHLUTI': 7, 'NAKVAEMNIFERLIS': 1}: frá 0.234270m, til 0.000000m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 1693, 'IDFERILL': 1735, 'IDBUTUR': 903010037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': 1}: frá 0.000000m, til 0.234270m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 3197, 'IDFERILL': 1735, 'IDBUTUR': 903010037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': 0}: frá 0.000000m, til 0.234270m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 3312, 'IDFERILL': 2071, 'IDBUTUR': 253020037, 'VEGNR': '1', 'VEGHLUTI': 7, 'NAKVAEMNIFERLIS': 0}: frá 0.234270m, til 0.000000m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 4833, 'IDFERILL': 1735, 'IDBUTUR': 903010037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': -1}: frá 0.000000m, til 0.234270m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 4877, 'IDFERILL': 2071, 'IDBUTUR': 253020037, 'VEGNR': '1', 'VEGHLUTI': 7, 'NAKVAEMNIFERLIS': -1}: frá 0.234270m, til 0.000000m
8 einstakar source-færslur í nágrennisskoðun; þetta er ekki staðfest graph-path.

## 2117→2135: 34.748670 m
Frá [392674.357, 389846.132] → til [392703.5, 389865.057]
Heil stök geometry með báða gap-endapunkta innan 0,001m: 0. Þetta er samanburðarviðmið, ekki heimild til brúunar.
Nærliggjandi endpoint-hlutar (einstök source/ID/tier/dist):
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 97, 'IDFERILL': 2117, 'IDBUTUR': 252090037, 'VEGNR': '1', 'VEGHLUTI': 7, 'NAKVAEMNIFERLIS': 2}: frá 0.000000m, til 34.748670m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 112, 'IDFERILL': 2135, 'IDBUTUR': 902030037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': 2}: frá 34.748670m, til 0.000000m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 1463, 'IDFERILL': 36807, 'IDBUTUR': 902030037, 'VEGNR': '1', 'VEGHLUTI': 5, 'NAKVAEMNIFERLIS': 2}: frá 34.748670m, til 0.000000m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 1732, 'IDFERILL': 2135, 'IDBUTUR': 902030037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': 1}: frá 34.748670m, til 0.000000m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 1725, 'IDFERILL': 2117, 'IDBUTUR': 252090037, 'VEGNR': '1', 'VEGHLUTI': 7, 'NAKVAEMNIFERLIS': 1}: frá 0.000000m, til 34.748670m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 2918, 'IDFERILL': 36807, 'IDBUTUR': 902030037, 'VEGNR': '1', 'VEGHLUTI': 5, 'NAKVAEMNIFERLIS': 1}: frá 34.748670m, til 0.000000m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 3288, 'IDFERILL': 2117, 'IDBUTUR': 252090037, 'VEGNR': '1', 'VEGHLUTI': 7, 'NAKVAEMNIFERLIS': 0}: frá 0.000000m, til 34.748670m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 3303, 'IDFERILL': 2135, 'IDBUTUR': 902030037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': 0}: frá 34.748670m, til 0.000000m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 4159, 'IDFERILL': 36807, 'IDBUTUR': 902030037, 'VEGNR': '1', 'VEGHLUTI': 5, 'NAKVAEMNIFERLIS': 0}: frá 34.748670m, til 0.000000m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 4891, 'IDFERILL': 2135, 'IDBUTUR': 902030037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': -1}: frá 34.748670m, til 0.000000m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 4916, 'IDFERILL': 2117, 'IDBUTUR': 252090037, 'VEGNR': '1', 'VEGHLUTI': 7, 'NAKVAEMNIFERLIS': -1}: frá 0.000000m, til 34.748670m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 5766, 'IDFERILL': 36807, 'IDBUTUR': 902030037, 'VEGNR': '1', 'VEGHLUTI': 5, 'NAKVAEMNIFERLIS': -1}: frá 34.748670m, til 0.000000m
- `docs/ai/tasks/ticket-429/samples/vegagerdin-wfs-routeA-geometry.json` {'OBJECTID': 97, 'IDFERILL': 2117, 'IDBUTUR': 252090037, 'VEGNR': '1', 'VEGHLUTI': 7, 'NAKVAEMNIFERLIS': 2}: frá 0.000000m, til 34.748670m
- `docs/ai/tasks/ticket-429/samples/vegagerdin-wfs-routeA-geometry.json` {'OBJECTID': 112, 'IDFERILL': 2135, 'IDBUTUR': 902030037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': 2}: frá 34.748670m, til 0.000000m
- `docs/ai/tasks/ticket-429/samples/vegagerdin-wfs-routeA-geometry.json` {'OBJECTID': 1463, 'IDFERILL': 36807, 'IDBUTUR': 902030037, 'VEGNR': '1', 'VEGHLUTI': 5, 'NAKVAEMNIFERLIS': 2}: frá 34.748670m, til 0.000000m
- `docs/ai/tasks/ticket-429/samples/vegagerdin-wfs-routeA-geometry.json` {'OBJECTID': 1732, 'IDFERILL': 2135, 'IDBUTUR': 902030037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': 1}: frá 34.748670m, til 0.000000m
- `docs/ai/tasks/ticket-429/samples/vegagerdin-wfs-routeA-geometry.json` {'OBJECTID': 1725, 'IDFERILL': 2117, 'IDBUTUR': 252090037, 'VEGNR': '1', 'VEGHLUTI': 7, 'NAKVAEMNIFERLIS': 1}: frá 0.000000m, til 34.748670m
- `docs/ai/tasks/ticket-429/samples/vegagerdin-wfs-routeA-geometry.json` {'OBJECTID': 2918, 'IDFERILL': 36807, 'IDBUTUR': 902030037, 'VEGNR': '1', 'VEGHLUTI': 5, 'NAKVAEMNIFERLIS': 1}: frá 34.748670m, til 0.000000m
- `docs/ai/tasks/ticket-429/samples/vegagerdin-wfs-routeA-geometry.json` {'OBJECTID': 3288, 'IDFERILL': 2117, 'IDBUTUR': 252090037, 'VEGNR': '1', 'VEGHLUTI': 7, 'NAKVAEMNIFERLIS': 0}: frá 0.000000m, til 34.748670m
- `docs/ai/tasks/ticket-429/samples/vegagerdin-wfs-routeA-geometry.json` {'OBJECTID': 3303, 'IDFERILL': 2135, 'IDBUTUR': 902030037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': 0}: frá 34.748670m, til 0.000000m
24 einstakar source-færslur í nágrennisskoðun; þetta er ekki staðfest graph-path.

## 3768→3767: 42.302219 m
Frá [403269.528, 383219.0345] → til [403311.6927, 383222.4427]
Heil stök geometry með báða gap-endapunkta innan 0,001m: 0. Þetta er samanburðarviðmið, ekki heimild til brúunar.
Nærliggjandi endpoint-hlutar (einstök source/ID/tier/dist):
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 1361, 'IDFERILL': 3767, 'IDBUTUR': 902040037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': 2}: frá 42.302219m, til 0.000000m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 1362, 'IDFERILL': 3768, 'IDBUTUR': 902040037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': 2}: frá 0.000000m, til 42.302219m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 2874, 'IDFERILL': 3767, 'IDBUTUR': 902040037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': 1}: frá 42.302219m, til 0.000000m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 2875, 'IDFERILL': 3768, 'IDBUTUR': 902040037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': 1}: frá 0.000000m, til 42.302219m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 4400, 'IDFERILL': 3767, 'IDBUTUR': 902040037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': 0}: frá 42.302219m, til 0.000000m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 4401, 'IDFERILL': 3768, 'IDBUTUR': 902040037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': 0}: frá 0.000000m, til 42.302219m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 5765, 'IDFERILL': 3768, 'IDBUTUR': 902040037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': -1}: frá 0.000000m, til 42.302219m
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` {'OBJECTID': 5764, 'IDFERILL': 3767, 'IDBUTUR': 902040037, 'VEGNR': '1', 'VEGHLUTI': 1, 'NAKVAEMNIFERLIS': -1}: frá 42.302219m, til 0.000000m
8 einstakar source-færslur í nágrennisskoðun; þetta er ekki staðfest graph-path.

## Exact-endpoint geometry-path athugun

Öll orientation/tier með í rúmu offline prófi; ekkert af þessu er aksturs- eða route-val. Hnitapör verða að vera bókstaflega jöfn, engin tolerance/snapping í þessari keðjuleit. Aðeins endar LineString-hluta, ekki innri vertices eða línuskurðir.
- 1735→2071: path_found=False; explored endpoints=3; path=[]
- 2117→2135: path_found=False; explored endpoints=4; path=[]
- 3768→3767: path_found=False; explored endpoints=3; path=[]

## Niðurstaða og mörk

Engin heimild til að brúa bilin eða hefja innleiðingu fæst af neikvæðu endpoint-prófi. Þetta skannar retained GeoJSON FeatureCollections, ekki öll möguleg skráasnið/CRS, og framkvæmir ekki línuskurðar- eða akstursgreiningu. 36807 er nálægur retained hluti við B2 en endpoint-snerting hans ein staðfestir ekki að hann brúi B2. Næsta nauðsynlega öflun, ef eigandi kýs hana, ætti að beinast að einu native gap-svæði og topology/connector-heimild, ekki endursækja allt netið. Metadata AKSTURSSTEFNA leysir ekki þetta gap-próf.

## Skráasvið / SHA256

- `docs/ai/tasks/ticket-500/acquisition/samples/raw-BATCH-1.json`: 120 features; SHA256 `11ef45937cfcf473dc47f9d5167121502696fdeff4ea8ce1de217a9686c311da`
- `docs/ai/tasks/ticket-500/acquisition/samples/raw-BATCH-2.json`: 152 features; SHA256 `7cc87498d632993e0b0c21f5fd0f68a488083bce0c397aaad6021d59546c571f`
- `docs/ai/tasks/ticket-500/acquisition/samples/raw-BATCH-3.json`: 312 features; SHA256 `61567c561c19b539d83ae4d6544da4646578c781bf32d57b6a44df15e95cd7bd`
- `docs/ai/tasks/ticket-500/acquisition/samples/raw-BATCH-4.json`: 156 features; SHA256 `f39a5f68f96e85f93f08f3672f60d52ad1421dbffa727b03a09408fd71a95575`
- `docs/ai/tasks/ticket-500/acquisition/samples/raw-BATCH-5.json`: 132 features; SHA256 `51389c9224cdf898f858d639517d1240d5383738ab4229095d966b7d62fabbe6`
- `docs/ai/tasks/ticket-500/acquisition/samples/raw-BATCH-6.json`: 172 features; SHA256 `ae33e4644b94abc363514507522af5feaf3b4f9a829dce05db16f75c34800c7e`
- `docs/ai/tasks/ticket-500/acquisition/samples/raw-BATCH-7.json`: 200 features; SHA256 `35ea82930bf346e67f88da4dfeab5318cfb2228379d00787d7adf4dd02984c6c`
- `docs/ai/tasks/ticket-500/acquisition/samples/raw-PROBE-KEF.json`: 32 features; SHA256 `3abd5e422b8baf75f62db1b2727bce5d153c91daefd2d219d6bb5355c26e8590`
- `docs/ai/tasks/ticket-499/samples/raw-S2-WGS84.json`: 20 features; SHA256 `b1b8aa63571d6377de742a02b4e2e4f35860182191846e4a88afabddf463628a`
- `docs/ai/tasks/ticket-493-place-data-phase2/samples/wfs93-raw.json`: 24 features; SHA256 `1d8c9cf880df374b9cb8120e1053e8ffd5acfba3d4bf55714e57ffdd8c49eb33`
- `docs/ai/tasks/ticket-493-north-data/samples/wfs-north-4326.json`: 212 features; SHA256 `7075416ca4635e4dea058b43124cfdefa7caec9d860d2dd43208504022eedb9b`
- `docs/ai/tasks/ticket-493-endpoint-acquisition/samples/raw-E1-WGS84.json`: 32 features; SHA256 `cb9382946098c2040dbc5c151985977974a1b7bf38aede520a7c1a312ee78355`
- `docs/ai/tasks/ticket-491/final-validation/samples/wfs-vesturland-4326.json`: 132 features; SHA256 `5fb643b23ac83dc0df47e1ff5c482adb78d7a99bc567028133d8bfd6b140659f`
- `docs/ai/tasks/ticket-485/samples/wfs-extension-4326.json`: 172 features; SHA256 `84e560e3303f655779b09b1f43949032b238d5c18c4ad3679416161003b8222e`
- `docs/ai/tasks/ticket-485/samples/wfs-extension-native3057.json`: 172 features; SHA256 `23c4225a8021cc33867ba38558c87c805c9b7e1a40ae3fdf5fabb56fd90aa34f`
- `docs/ai/tasks/ticket-483/samples/wfs-chain-4326.json`: 156 features; SHA256 `966848554f0ce205c919625c3e6209da1fe05bcc50e7e8084ae96840ad519af4`
- `docs/ai/tasks/ticket-483/samples/wfs-srstest-4326.json`: 4 features; SHA256 `364b49d08c425703703c79a9f9c30d15ccc27d275da2a88e7f4eb7c04d2fc3fb`
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json`: 996 features; SHA256 `305f60d6f1f17918c058cbd047735681e56d6f9aad99f9e16f50de9419d6983a`
- `docs/ai/tasks/ticket-429/samples/vegagerdin-wfs-routeA-geometry.json`: 108 features; SHA256 `9b8403a2498648c3c0025e1f881c313d16bec0992f318f2ccc51a6f9bdeba997`

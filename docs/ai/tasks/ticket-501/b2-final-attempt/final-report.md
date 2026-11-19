# #501 B2 attempt-3 — leiðrétt lokaniðurstaða, 2026-11-17

**Öflun PASS; JI1–JI4 túlkun leiðrétt beint af Ripley. B2 hefur bókstaflega geometry-tengingu um hornpunkta í 36807. Engin ný akstursheimild eða runtime-breyting. B2-sókn stöðvuð.**

## Varðveitt svar

Raw 36267 bæti; SHA256 `34bd1d011ee5a5433ee1394825650c212951c611847393cb68337d0765a70123`. HTTP200/complete_usable samkvæmt ledger, GeoJSON CRS EPSG:3057, 20 features / 5 IDFERILL ×4 tiers, óstytt samkvæmt count metadata. Ripley staðfesti SHA/CRS/20 features offline, ekki nýtt netkall. 14/14 local tests og eitt dispatch eru CC/Jonesy-eignaðar keyrslur, ekki endurkeyrt hér. Host-fix/new-byte-proof skráð í cc-report og Jonesy review.

## JI1–JI2: 36807 er hringur með A og B sem hornpunkta

A = 2117 exit `(392674.357, 389846.132)`, B = 2135 entry `(392703.5, 389865.057)`. Í öllum fjórum tiers í raw svarinu eru A og B **bókstaflega** XY-hornpunktar í 36807; engin snapping/tolerance/CRS-vörpun eða tier-blöndun. Upphaf=endi merkir lokaða línu, ekki núll-lengd. Ripley staðfesti einnig geometry jafnt retained fyrir sama OBJECTID (STUTTNAFNLEIDAR texti hefur encoding-frávik) wfs-vegnr1-all fyrir öll fjögur 36807 eintökin. Þetta svar lá því þegar í retained gögnum en fyrri endpoint-only leit greindi það ekki.

| Tier | Hornpunktafjöldi með endurteknum enda | Heildarlengd m | A→B í teiknistefnu m | A→B öfugt m |
|---|---|---|---|---|
| -1 | 16 | 121.544380 | 79.065864 | 42.478516 |
| 0 | 6 | 112.955663 | 72.549288 | 40.406375 |
| 1 | 6 | 112.955663 | 72.549288 | 40.406375 |
| 2 | 6 | 112.955663 | 72.549288 | 40.406375 |

Teiknistefna er ekki sönnun á löglegri akstursstefnu. Lögun er samrýmanleg hringtorgi (túlkun), en enginn nýr reitakóði/topology/traffic-authority staðfestur. Ekki skipta 34,749m beinu bilinu í cw_long út fyrir boga í vörugögnum hér; sú gap-/hringleiðameðferð krefst sérstakrar ákvörðunar og samræmdrar geometry-stefnu.

## JI3–JI4: nákvæmni og fyrri niðurstaða

Endapunktar og lykilhornpunktar samsvara milli tiers; **öll hnit/vertex-fjöldi eru ekki eins**. Ekki lengur fullyrt að live-svar staðfesti “engan connector” eða almenna niðurstöðu endpoint-only offline-gap-check. Sú skýrsla stendur aðeins sem afmarkað endpoint-próf, ekki fjarverusönnun á innri hornpunkta-tengingu. 2310 (VEGNR38) er nýtt gagnvart baseline16 og byrjar á öðrum hornpunkti hringsins; 16 gömlu features samkvæmt Jonesy samanburði óbreytt, 4 ný.

## Stöðvun og næsta ákvörðun

B2-sókn lýkur hér samkvæmt eiganda. Engin fjórða tilraun, stærra box eða VEGNR38-öflun. Rökstætt framhald, ef eigandi kýs, er lítil offline hornpunkta-athugun B1/C1 úr retained gögnum; Jonesy ábendingar eru ekki fullstaðfest niðurstaða þessara para. #501 leiðasamsetning/áttir/graph/UI óinnleitt. Engin runtime/gagnabreyting eða samþykki á gap-brúun. Engin GitHub/commit/push/deploy.

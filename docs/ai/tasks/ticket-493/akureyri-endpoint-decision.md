# #493 — Tillaga að Akureyrarenda

2026-11-06, Ripley. Eigandi samþykkti C 2026-11-06. Mat á varðveittum gögnum úr ticket-493-north-data. Markmiðið hér er að afmarka veður- og færðarleið að Akureyri.

| Kostur | Staða í gögnunum | Áhrif á leið |
|---|---|---|
| A, endi 32964 | Endahnútur við mörk útilokaðra Vaðlaheiðarganga. | 316,7123 km frá Borgarnesi samkvæmt varðveittri nálgun. Keðjan fer um bæjargötur áður en hún nær endanum. N5 er við þessi mörk. |
| B, hringtorg 33604 | Viðmiðunarhnútur liggur inni á línu 32964. Tengingin er INFERRED. | Vöruendinn krefst sérstakrar hlutkaflaafmörkunar. Fyrri lota skilaði mælingu innan stykkisins. |
| C, mót 2940 → 3876 | Endi 2940 og upphaf 3876 hafa sama native xy og sömu WGS84 hnit. | Um 308,66 km frá Borgarnesi. Sjö síðustu stykkin, færðarlyklarnir 909360037 og 909350037 og N5 falla utan leiðar. |

**Tillaga Ripley er C sem „Akureyri-aðkoma“.** Velji eigandi þennan enda er viðmiðið endahnútur IDFERILL 2940, IDBUTUR 909030037, WGS84 65.69570405° N, 18.12371406° V. Þetta gefur skýran enda áður en keðjan heldur áfram um bæjarkaflana. Ef vöruþörfin er akstur í gegnum Akureyri að gangamörkum styður A þá afmörkun.

Við samanburð voru sjö stykkin eftir 2940 lögð saman úr piece_length_m_haversine_wgs84 í route-data-candidate.json. Þau eru samtals 8,049661 km og skráð tengibil þeirra eru núll. C er því 316,7123 − 8,049661 ≈ 308,66 km með sömu nálgun. Undirliggjandi gögn styðja snertingu kortlagðra lína. Sönnunargráða akstursátta er áfram INFERRED/UNKNOWN.

N1–N4 eru innan afmörkunar C og áfram punktatillögur. Staðfesta þarf í næsta skrefi hvort sérstakur veðurpunktur eigi að vera við C og hvaða viðbótarpunktar skipta máli á lengri bilum. Tengingu við Rauðavatn–Borgarnes má meta á sameiginlega Borgarnesakkerinu. Endapunktaval eitt samþykkir hvorki þá samsetningu né nýtt UI.

Heimildir: ../ticket-493-north-data/evidence-north.md §§1, 3, 5 og 7, route-data-candidate.json chain_pieces og candidate_points og result-review.md lokamat v3.

## Eigandaákvörðun, 2026-11-06

Eigandi samþykkti C með „Já“ við beinni spurningu um Akureyrarenda. Endahnútur 2940 er samþykkt afmörkun.

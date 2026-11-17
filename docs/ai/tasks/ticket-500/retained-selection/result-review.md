# #500 retained-selection — result review

## Jonesy result review — umferð 1 (2026-11-16)

**Niðurstaða: PASS.** Engir blockerar, engar nauðsynlegar leiðréttingar og engin ný lota. OJ1–OJ2 eru valfrjálsar ábendingar. Stage → RESULT_REVIEW. Ég sótti ekkert af vefnum; ég dæmi hvorki vöruvalið né ytri tengingar/aðgengi.

### Sandbox-staðfest (mitt) og CC-eignað

**Sandbox (afrit í scratch, engin netköll):**
- Vitest 4.1.12: approachSelections (nú 30 próf) + placeEvidence/places/remainingCoverage/southConnections/acquiredGeometry/approachAnalysis = **97/97 PASS**.
- **selections.json:** 23 afgreiðslur = 21 SELECTED + 2 NOT_SELECTED; upprunalegu 13 eru **óbreyttar** (samanburður við fyrri útgáfu, bókstaflega jafnar); toppstig óbreytt. 10 nýjar: source-ID/endi/gagnagrunnur/hnit = fasti listinn í approved-prompt (á 12 aukastöfum), `selection_basis: RETAINED_CANDIDATE_APPROVED_VIA_PROMPT`, `access_status: EXACT_GAP`.
- **Source-sannprófun (mín, á hráu):** 7 acquisition-punktar = start/end-hnútur tier −1 raw-stykkis (línustykki) og 0,0 m snerting við nafngreint **annað** stykki; Vopnafjörður END snertir 0,0 m bæði 3182 (Vopnafjörður–Skógavegur) og samnefnt 3671 — textinn nefnir 3182 (OI2). Hveragerði/Vík = RECOMMENDED WGS84 í south-connections, native-endar = `road-links.csv`; Borgarnes native = CSV, WGS84 = `wfs-vesturland-4326.json` tier −1, OBJECTID 5082, = #491 P4.
- **places.json fyrir/eftir:** 56/56, sama röð; nákvæmlega **10 færslur breyttar** (coordinates, approach, connectionStatus, selectionReference, selection_basis; allir eldri reference-reitir varðveittir), **46 óbreyttar** bókstaflega (þar á meðal fyrri 15 valdir og Reyðarfjörður/Fáskrúðsfjörður null); note rétt (25 valdir/31 óvaldir); 25 af 56 með hnit. Aðrar server_data-skrár óbreyttar (mtime).
- **OI1:** approach-textar Víkur („Punktur á þjóðvegi í Vík, við innri samskeyti vegkafla“), Hveragerðis („vestast á varðveitta vegkaflanum“) og Borgarness („Endapunktur Borgarnes–Baulan-vegkafla“) lesast ekki sem bæjaraðkoma/-mörk; 34,75 m, 629 m og ccw_short/cw_long-fyrirvarar eru í `connectionStatus.reason`.
- **Mutation-próf á afriti (24 breytingar):** 23 greinast — m.a. hnit fært samkvæmt í selections og places, rangur endi, rangt `source.database`, gamla END-tillagan endurvakin (Grundarfjörður), `selection_basis` rangt/fjarlægt, Vopnafjörður-texti vísar á 3671, Vík „Aðkoma“, Hveragerði án 34,75 m, Borgarnes „bæjarmörk“, eldri 13 afgreiðsla breytt, aukastaður fær val, Reyðarfjörður með hnit, KEF-Keflavík blöndun, SUPPORTED/ROUTABLE, eldri eigandahnit fært, analysis-snapshot fiktað. **1 sleppur:** orðalag Vopnafjarðar-approach („Staðfest bæjarmörk“) — óvarið af prófi (OJ2).
- Aðlögun eldri prófa: 10 ný ID bætt við núverandi nafngreind `SELECTED_PRODUCT_APPROACH_IDS`-sett í fimm söfnum og aðeins fyrir það sem á við hvert; ekkert null-skilyrði veikt fyrir aðra staði (mutation staðfestir). placeEvidence ósnert (mtime óbreytt), eins og prompt-ið sagði.

**CC-eignað (ekki keyrt af mér):** vitest 192/192 á allri möppunni, ESLint, `git diff --check`, `git status`.

### Ábendingar (valfrjálst, ekki blockerar)

- **OJ1 — heiti reita:** nýju retained-færslurnar nota reitina `map_recommendation_reason` og `map_reference` (vísar á approved-prompt) þótt valið sé retained en ekki kortaráðlegging. Þetta er afleiðing þess að prompt-ið krafðist sama schema og `selection_basis` ber merkinguna, svo ekkert er rangt í gögnunum; ef reitir verða lesnir síðar án `selection_basis` getur nafnið villt. Ekki laga nú.
- **OJ2 — Vopnafjörður-prófið er slakt:** það ber END við 3182/3671 með vikmörkum 0,0005° (um 25–55 m) í stað jafnaðar; raunsnertingin er 0,0 m (sannað af mér). Auk þess er texti Vopnafjarðar-approach óvarinn. Herðing (`toBe`-jafnaður) er valfrjáls; OI2-krafan sjálf (3182, ekki 3671) er varin (mutation M10 greinist).
- Vík-punkturinn er innra samskeyti sama vegar (bæði stykki heita „Vík“) og 629 m frá enda runtime-leiðarinnar; það er sagt berum orðum og þarf að koma aftur til skoðunar þegar #501 velur upphafs-/endahnúta — engin aðgerð nú.

### Takmörk

Enginn staður er SUPPORTED/ROUTABLE; akstursaðgengi/stefna er EXACT_GAP á öllum 21 völdum punktum; Hveragerði 34,75 m bil, Vík 629 m og Borgarnes cw_long-fyrirvari eru óleyst; Reyðarfjörður/Fáskrúðsfjörður þurfa sérstakt eigandaheimilað verk; 31 af 56 eru án punkts. Þetta er ekki lokun #500.

### Næsta skref

Ripley lokametur. Engin lagfæring nauðsynleg; OJ1–OJ2 ef eigandi vill, án nýrrar lotu.

## Ripley lokamat — 2026-11-16

**PASS. Engar nauðsynlegar lagfæringar; lota CLOSED. #500 áfram opinn.**

Afhending stenst afmarkaða promptið: tíu retained-vörupunktar bættir við, aðgreint RETAINED-selection_basis, eldri13 afgreiðslur varðveittar,25 af56 með valinn punkt og31 óvalinn. OI1-fyrirvarar fyrir Hveragerði/Vík/Borgarnes og OI2-tilvísun Vopnafjarðar á3182 til staðar. Jonesy sannreyndi raw/source og fyrir/eftir-samanburð á46 óbreyttum staðafærslum; það er Jonesy-eignað. Engin ný vef-/kortaskoðun við lokamat.

Sjálfstætt keyrt staðbundið Vitest4.1.10: sjö gagnasöfn (approachSelections/placeEvidence/places/remainingCoverage/southConnections/acquiredGeometry/approachAnalysis), **97/97 PASS**. ESLint á sex snertum prófskrám og git diff --check hrein. Stærri192-prófa keyrsla er áfram CC-eignuð. OJ1–OJ2 eru valfrjálsar ábendingar, enginn sýndur gagnagalli; engin viðbótarherðing eða review-lota ræst.

Akstursaðgengi/stefna og ytri leiðartengingar eru óstaðfest þar sem áður; enginn SUPPORTED/ROUTABLE. Reyðarfjörður/Fáskrúðsfjörður áfram óvaldir; source-bil Hveragerðis og innri Vík-punktur halda fyrirvörum sínum.31 óvalinn staður er ekki fullyrðing um að allir séu án kandídats. Engin UI/leiðarvél afhent eða #500-lokun. Enginn commit/push/GitHub.

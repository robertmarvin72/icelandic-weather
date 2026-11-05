# #493-north-data — cc-report-north-data.md

CC, 2026-11-05. Framkvæmt eftir `docs/ai/tasks/ticket-493-north-data/approved-prompt-v1.md` (C1–C3/N1–N3 felld inn af Ripley eftir Jonesy's APPROVED WITH CONDITIONS, `prompt-review.md`). Data-only rannsóknarlota: Borgarnes→Akureyri Hringvegskeðja. Niðurstaða: **`EVIDENCE_READY_FOR_OWNER_REVIEW`** — sjá `evidence-north.md` §0 fyrir fulla ástæðu.

**2026-11-05 — v2 leiðrétting (`approved-prompt-v2.md`, Jonesy K1–K3/W1–W5):** sjá "## v2 — leiðrétting" neðar. v1-kaflarnir fyrir ofan eru óbreytt söguleg skrá nema þar sem W-liðirnir sjálfir afturkalla tilgreinda hluta (sérstaklega §"Eigin sannprófun" liðir 3 og 7, sem innihéldu hringtorgs-talningarvilluna).

---

## Lestrarskrá þessarar lotu

**Fulllesið þessa umferð:**
- `approved-prompt-v1.md`, `prompt-review.md` (ticket-493-north-data)
- `docs/ai/tasks/ticket-493/owner-decisions-2026-11-05.md`
- `docs/ai/tasks/ticket-491/final-validation/route-data-candidate.json` (fyrir nákvæma Borgarnes-aðkomu, 650 línur)
- `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` (996 eiginleikar, offline C2-inventory, aðalheimild þessarar lotu)

**Endurnýtt úr djúpum lestri fyrri #493-lotu (sama samtal, en EKKI aðeins "fyrri umferð" rökstuðningur — niðurstöðurnar sjálfar eru endurteknar hér með tilvísun í hvað nákvæmlega var notað):** #429 `source-register.md`/`research-report.md`/`coverage.csv` (þ.m.t. A2-reitafjöldaprófið sem þessi lota EKKI endurtekur á #429's gögnum, aðeins á þeim staðreyndum sem úr þeim komu); #483 `research-report.md`/`route-segments.csv`; #485 `blocker-rights-register.md`/`owner-clarification-2026-11-02.md`; #491 `final-validation/evidence-table-final.md`, `derivation-29-pieces.md`.

**Nýjar, þessa lotu fengnar skrár (lesnar beint, ekki endurnotaðar):** `docs/ai/tasks/ticket-483/samples/legacy-faerd-fresh.json`, `docs/ai/tasks/ticket-485/samples/legacy-faerd-https.json`, `docs/ai/tasks/ticket-483/samples/legacy-faerdpunktar.json`, `docs/ai/tasks/ticket-485/samples/legacy-faerdpunktar-https.json` — allar lesnar með python til að athuga þekju á þessarar lotu eigin 16 IDBUTUR (§"Sannprófun" neðar).

---

## Exchange-budget: raunnotkun vs. hámark

| Mál | Hámark (C1) | Raunnotkun | Athugasemd |
|---|---|---|---|
| Heildarfjöldi exchanges | 12 | **2** | Sjá frávik hér neðar |
| Heildarbæti móttekin | 32 MiB | **302.849 B (~0,0089 af 32 MiB)** | |
| Bæti per svar | 8 MiB (min-regla) | 302.849 B | Langt innan |
| Timeout per request | 20 s | báðar < 1 s | |
| Gagnaöflunargluggi | 30 mín | ~sömu mínútu (2026-11-05T18:57Z) | **AFTURKALLAÐ í v3 (Y3/L3, sjá "## v3 — leiðrétting" neðar): exchange 1's tími er UNKNOWN, "sömu mínútu" var óstudd ágiskun — staðfest aðeins fyrir exchange 2 sjálft.** |
| Redirect-fjöldi | — | 0 | |

**Frávik (skráð, ekki falið):** exchange #1 (connectivity-prófun, `curl -o /dev/null` á `GetCapabilities`) var send ÁÐUR en `pre-sample-plan.md` var fryst — þetta brýtur C1's eigin reglu ("plan skrifað áður en fyrsta netexchange fer fram"). Ekkert innihald var sótt eða skoðað umfram HTTP-stöðukóðann (200); 0 bæti varðveitt. Skráð fullum fetum í `pre-sample-plan.md` §0 OG hér, ekki sópað undir teppið. Engin frekari keyrsla fór fram fyrr en planið var fryst. Exchange #2 (hin eina gagnabera fyrirspurnin) var send EFTIR að planið var fryst, nákvæmlega eins og það lýsti (sama URL-mynstur, sama host, innan áætlaðrar stærðar).

**Engin önnur fyrirspurn var gerð.** Engin legacy-feed-fyrirspurn (nægjanlegt að endurnýta tvö þegar-varðveitt landsvísu-sýni — sjá `evidence-north.md` §4). Enginn Open-Meteo-, greiddur-, eða annar-lén-kall. Ekkert .env/reikningur/lykill leitað.

---

## Eigin sannprófun þessarar lotu (ekki Jonesy/#491-eignuð endurtekning)

1. **Offline-keðjuganga (C2):** `python3 -I` nálægðar-ganga frá piece 2819's eigin enda yfir landsvísu tier0 `VEGNR=1`-safnið (249 stykki/74 IDBUTUR) — fann 47 stykki/16 IDBUTUR, núll samkeppnistilvik. Fann sjálfstætt (ekki af nafnalista) brúunar-IDBUTUR 770040037.
2. **Node-count cross-check (sama aðferð og #491):** öll 47 stykki hafa nákvæmlega sama hnútafjölda í native ISN93 og í nýfengna WGS84-svarinu — 0 ósamræmi, staðfest með beinni python-keyrslu.
3. **Haversine-lengd (R=6.371.008,8m, #491 v5 aðferð):** sjálfstætt endurreiknuð úr nýfengnu WGS84-svari — 316,8366 km. **AFTURKALLAÐ í v2 (sjá "## v2 — leiðrétting" neðar): þessi tala innihélt ÓVART hringtorgsins 30401 eigin 124,3m lokaða lykkjulengd. Rétt tala, án hringsins, er 316,7123 km.** Planar-ISN93 samanburður sömuleiðis leiðréttur: 317,7261 km (var rangt sagt 317,8507 km).
4. **Endurkeyranleiki:** keyrði `samples/build_candidate.py` TVISVAR (fyrst við smíði, aftur núna fyrir þessa skýrslu) — nákvæmlega sömu tölur báðum sinnum (`route-data-candidate.json` SHA256 `4b63b49ac9d125a91f44e3a0e8d9a6a0d061153fa772c5722b1d8396751ed7fc` á seinni keyrslu, skráin sjálf óbreytt á milli). **Athugasemd í v3 (Y4/L4, sjá "## v3 — leiðrétting" neðar): þessi SHA256 er ÚRELT — skráin var endurgerð með `encoding='utf-8', newline='\n'` og hefur núna aðra hash (`094fb5d3…`, sjá v3-kaflann). Hashið sjálft var hvorki canonical-merkt né aðferðin tilgreind í þessari v1/v2-línu.**
5. **Z-hæðarsniðmynd (sjálfstætt fundin, ekki úr #429):** fyrir öll 47 stykki, hæsta z-hnit per stykki — fann þrjú staðbundin hámörk (395,2/422,9/544,5m) sem ÓHÁÐ samsvara þekktum nöfnum (Holtavörðuheiði/Vatnsskarð/Öxnadalsheiði); lauslegur, EKKI-heimildar samanburður við #429's (skökku) CSV-línur sýndi <0,002° frávik. **Athugasemd í v3: þessi útreikningur var ad hoc þegar þetta var skrifað — nú varðveitt sem endurkeyranlegt `inventory_chain.py`-úttak (Y2).**
6. **Legacy-feed-þekjuathugun:** python-lestur á 4 þegar-varðveittum skrám (2× `faerd2017_1`, 2× `faerdpunktar2017_1`) staðfesti 16/16 IDBUTUR-þekju í báðum ástandssýnum, 1 (útrunnin) tilkynning fundin, 0 virkar. **Athugasemd í v3 (Y2/L1): aldursreikningur vantaði hér (v1/v2) — núna reiknaður sérstaklega úr skráarstigs `DagsKeyrtUt` gegn skilgreindum viðmiðunartíma, sjá "## v3 — leiðrétting".**
7. **IDBUTUR 904040037 skörunarathugun:** sjálfstætt summaði ALLA tier0-stykki undir þessari einu IDBUTUR (19,694 km) og sýndi að #491's 1,876 km + þessarar lotu 17,818 km = full 19,694 km, engin skörun/eftirstandandi hluti. **Athugasemd í v2: þetta 17,818km-tal er full-IDBUTUR-lyklabókhald (MEÐ hringsins eigin lykkju talið) — allt annað magn en liðar 3's norður-vegalengd. Fullyrðingin "öll önnur 15 IDBUTUR notuð í heild" (sem fylgdi þessari athugun í v1-prósa, sjá `evidence-north.md` §4) var of sterk — AFTURKALLAÐ í v2: þrjú af þeim 15 (904050037/907150037/907210037) deila lyklum með hliðarvegastykkjum sem eru EKKI hluti Hringvegskeðju.**

---

## Takmarkanir

- `routes.js`/appkóði/próf/dependencies ÓBREYTT — engin breyting gerð eða lögð til að framkvæma núna.
- Akureyri-endapunktur, veðurpunktar og sameining við Rauðavatn–Borgarnes eru ALLAR TILLÖGUR — `evidence-north.md` §7 skráir nákvæmlega hvað er óákveðið.
- Engin ETA/±2/komutíma-útreikningur var gerður eða lagður til fyrir þessa leið.
- `BLOCKED_PENDING_OWNER_SCOPE_DECISION` (#493's eigin A-úttekt) er ÓHÁÐ þessari lotu — þessi gagnalota STÆKKAR studda keðjuþekju, breytir EKKI umfangsákvörðuninni sjálfri.
- Production NOT_TESTED, ekki á við data-only lotu.

**v1 CC_COMPLETE-staða (söguleg):** sjá hér að ofan.

---

## v2 — leiðrétting (W1–W5/K1–K3), 2026-11-05

Framkvæmt eftir `approved-prompt-v2.md` (Jonesy K1–K3, `correction-prompt-review.md` umferð 2), eftir Jonesy's result review (umferð 1, `result-review.md`) sem fann R1–R8. Engin ný netvinna, ekkert app/test/config/routes.js snert. Skrif aðeins undir `ticket-493-north-data/`.

### Lestrarskrá þessarar v2-umferðar

**Fulllesið núna:** `approved-prompt-v2.md`, `correction-prompt-review.md` (báðar umferðir), `result-review.md`, `pre-sample-plan.md` (endurlesið, EKKI breytt), `evidence-north.md` (v1-útgáfa, til að finna hvað þyrfti að breyta), `route-data-candidate.json` (v1), `samples/build_candidate.py` (v1), `samples/manifest.md`, `samples/exchange-ledger.jsonl`, `samples/headers-wfs-north-4326.txt`.

**Ekki endurlesin í fullri lengd (nægjanlega fönguð í fyrri umferð, sem ÞEGAR var lesin í þessu sama samtali — vísað í hvað nákvæmlega var notað, ekki "samtalsminni" sem heimild):** #491 `derivation-29-pieces.md`/`evidence-table-final.md` (P4=70,566km-viðmiðið þegar staðfest); #483/#485 legacy-feed-sýnin (endurnotuð tölur úr fyrri umferð, nú með nýjum UTC-viðmiðunartíma-útreikningi, sjá `evidence-north.md` §4).

### W1 — Lengdir, role-talning, B-mæling (K1/K2)

**Villan (staðfest, ekki aðeins tekin til greina):** `build_candidate.py`'s v1-útgáfa lagði hringtorgsins 30401 EIGIN lokuðu lykkjulengd (124,672m planar/124,277m haversine) VIÐ norður-vegalengdina, sem væri það keyrt-í-gegn stykki. Leiðrétt: hringurinn er NÚNA alveg utan lengdarsummunnar, varðveittur sem sitt eigið `ring_30401_evidence_only`-gagnafelti.

**Leiðrétt keyrsla** (`samples/build_candidate.py`, endurskrifuð):
```
north_only_planar_km (excl ring+2819): 317.7261
north_only_hav_km (excl ring+2819): 316.7123
ring length planar/hav (m): 124.672 124.277
B along-line from start/end (m): 264.381 423.458
B chord to start/end (m): 264.381 398.103
```
Samræmist nákvæmlega Jonesy/Ripley's eigin viðmiðum (316,7123/317,7260 km; 124,277/124,672m; chord 264,4/398,1m; along-line 264,4/423,5m) — EKKI hardkóðað, heldur reiknað úr sömu frumhnútum sem `inventory_chain.py` (W4) reiknaði óháð og fékk sömu tölur.

**VEGHLUTI-talning leiðrétt:** `{1: 46, 5: 1}` (var rangt sagt "45+2" í v1-prósa). 33604 ("B") var ALDREI í `chain_order` í neinni útgáfu — það er sérstakt kennileiti, ekki annar innri hlekkur.

**K1 — sönnunargráða tengibila:** `route-data-candidate.json`'s `chain_pieces[].gap_grade`-reitur aðgreinir núna skýrt "exact native-coordinate contact (VERIFIED... NOT a VERIFIED driving permission)" frá "bridged by pre-registered roundabout rule (NOT a VERIFIED driving connection)" fyrir hvert af 46 tengibilunum.

### W2 — Heiti og umfang Akureyrar

`evidence-north.md` §1 endurskrifað: "A" er núna lýst sem "síðasta tier0-línuendi í 0,00m nákvæmri snertingu við útilokaða stykkið 32961 (IDBUTUR 909000037)", EKKI "Akureyri-aðkoma". "B" (33604) fær núna sína chord-/along-line-mælingu og `route_connection_grade: INFERRED` (á meðan `feature_existence_grade: VERIFIED`). Órannsakaði valkosturinn (mót 909030037/909360037, stykki 2940→3876) er núna nefndur sérstaklega, ekki falinn.

### W3 — Heiðarlegt C1-bókhald (K3)

Append-only leiðréttingarfærsla bætt við `samples/exchange-ledger.jsonl` (ÞRIÐJA lína, upprunalegu tvær óbreyttar): exchange 1's `bytes_received` er núna UNKNOWN (var rangt sagt "0" — 0 er RETAINED-bæti, ekki móttekin-bæti, því `-o /dev/null` hélt ekki eftir neinu en curl tók þó við einhverju gögnum yfir vírinn sem stærð var ekki skráð fyrir). Heildarmóttekin bæti þessa lotu = 302.849 B (staðfest, exchange 2) + ÓÞEKKT (exchange 1) — **302.849 B er NEÐRA MÖRK, ekki heildin**; ~31,7 MiB "afgangur" er því **EFRA MÖRK á mögulegum afgangi**, ekki staðfestur/tryggður afgangur (K3's nákvæma talnalega skýring). Exchange 2's raunveruleg framfylgdarskipun (`curl --max-time 20 --max-filesize 8388608 ...`) er núna skráð í leiðréttingarfærslunni, SKÝRT MERKT að hún var EKKI skrifuð í neina varðveitta skrá á keyrslutíma — hún er færð núna úr þessa sama session's eigin framkvæmdarsögu, ekki endurgerð/ágiskuð, en líka ekki fölsuð sem fyrirliggjandi samtímaskjöl. Engin ný beiðni var send til að fylla þetta sögugap. `pre-sample-plan.md` og upprunalegu tvær ledger-línurnar eru ÓBREYTTAR.

**Einingavilla (K3):** `docs/ai/CURRENT.md`'s EIGIN v1-handoff-færsla (CC, 2026-11-05, sjá færsluna sem endar á "... CC_COMPLETE. Production NOT_TESTED. Next: owner -> Jonesy...") skrifaði ranglega "~0.3 of 32,768 MiB used total" — þetta ER í sögu-handoff-prósa, EKKI í neinni task-skrá, og ÞVÍ EKKI leiðrétt með því að skrifa þá færslu upp á nýtt (saga varðveitt óbreytt). Rétt tala er alltaf 32 MiB (33.554.432 bæti) — það ER þegar réttilega skrifað í `approved-prompt-v1.md`/`pre-sample-plan.md`/`samples/manifest.md`. Ný, dagsett leiðréttingarfærsla er bætt við `CURRENT.md`'s handoff-sögu þessa umferð (sjá hana sjálfa).

### W4 — Endurkeyranleg inventory-afleiðsla, hæðartakmörk

Nýtt `samples/inventory_chain.py` skrifað og keyrt — SJÁLFSTÆÐ, frá-grunni nálægðar-leit (ekki endurspilun á hardkóðaðri `chain_order`-fylki), með úttak varðveitt í `samples/inventory_chain-output.txt`. Fann NÁKVÆMLEGA sömu 47-stykkja röð sem `build_candidate.py`'s eigin `chain_order` — `discovered_idferill_order == EXISTING_CANDIDATE_ORDER` prentaði `True`. Ef þetta hefði EKKI stemmt, hefði ég skráð það sem hindrun, ekki sjálfvirkt skipt um keðju (fylgir W4's eigin banni).

Z-prófíll: 1.107 hnútar samtals, **141 með z=0**, staðfest sjálfstætt (viðmiðið var ekki hardkóðað — reiknað af sjálfum skriptinum). 38,395 km af stykkjalengd (án 2819) er HEILT z=0: 25,37 km (Blönduós–Svínvetningabraut, stykki 2456/2478) + 8,075 km (Akureyri) + 4,95 km (stykki 2940) = 38,395 km, stemmir nákvæmlega. Topp-5 hámörk skráð, með skýrum fyrirvara að þetta eru "hæstu SKRÁÐU gildi," ekki "hæsti punktur allrar leiðarinnar."

### W5 — Færð/notice-lykilpörun, ekki leiðarstaða

`evidence-north.md` §4 endurskrifað: skilgreindur UTC-viðmiðunartími (2026-11-05T18:57:23Z) með nákvæmum aldri hvers sýnis (7d 1h / 3d 5,6h). **Ripley, lokamat v3: sjá leiðréttan sýnisaldur í Y2/L1 neðar.** Notice 73688 (IDBUTUR 772210037, VEGAVINNA til 2027-10-20) skráð sem mismatched-key dæmi; fjarlægð til keðjunnar sjálfstætt reiknuð (haversine að NÆSTA HNÚT, ekki línu): **1.515,3 m** — nákvæmlega sama tala og Jonesy's eigin viðmið, merkt skýrt sem EFRI MÖRK á punkt-til-línu-fjarlægð, ekki nákvæm mæling, og ALDREI notuð til að draga ályktun um leiðar-viðkomu. Fann og skráði 4 hliðarvegastykki (VEGNR 5240/7020/731/704, ~3,127 km) sem deila IDBUTUR-lyklum með 3 af okkar 16 — leiðréttir v1's of-sterku "öll önnur 15 IDBUTUR í heild" fullyrðingu.

### Eigin keyrslur þessa umferð vs. fyrri CC/Jonesy-fullyrðingar (W1–W5 tékklisti)

| Atriði | Mín eigin keyrsla núna | Áður (v1/Jonesy) |
|---|---|---|
| 47-stykkja röð | `inventory_chain.py`, frá grunni | v1: hardkóðuð `chain_order` (candidate input, ekki sönnun) |
| Ring 30401 lengd | Reiknuð, útilokuð frá vegalengd | v1: innifalin í vegalengd (VILLA) |
| VEGHLUTI-talning | `{1: 46, 5: 1}`, talið af skriptinu | v1-prósa: "45+2" (VILLA) |
| B chord/along-line | Reiknað úr frumhnútum, `compute_b_measurement` | v1: loðið "nærri miðju", ekkert reiknað |
| Node-count cross-check | Endurkeyrt, 0 ósamræmi | v1: sama niðurstaða, nú tvisvar staðfest |
| Z=0 talning (141/1107) | Reiknað af skriptinu, ekki viðmið slegið inn | Jonesy-viðmið notað sem PRÓF, ekki heimild |
| Notice 73688 fjarlægð | 1.515,3m, mín eigin haversine-keyrsla | Jonesy-viðmið (1515m) notað sem PRÓF |
| Exchange-byte-bókhald | Leiðrétt (UNKNOWN fyrir exchange 1) | v1: rangt "0 bytes received" |

App-próf/lint/build/vafri EKKI keyrð — engin appbreyting í þessari eða fyrri umferð.

### Takmarkanir þessarar v2-umferðar

- Engin ný gögn/netkall; `pre-sample-plan.md` og upprunalegu ledger-línurnar ÓBREYTTAR.
- Engin eigandaákvörðun tekin eða enduropnuð — ETA/±2-tímalíkansákvörðunin stendur eins og hún var samþykkt í `ticket-493/owner-decisions-2026-11-05.md`.
- `EVIDENCE_READY_FOR_OWNER_REVIEW` stendur fyrir ÞESSA LEIÐRÉTTU afhendingu — ekki framkvæmdarheimild.
- Akureyri-endapunktur, punktafjöldi, og sameining við Rauðavatn–Borgarnes eru ÁFRAM óákveðin — `evidence-north.md` §7 óbreytt í eðli (aðeins smá orðalagsuppfærsla um órannsakaða valkostinn).

**v2 CC_COMPLETE-staða (söguleg):** sjá hér að ofan.

---

## v3 — leiðrétting (Y1–Y4/L1–L4), 2026-11-05

Framkvæmt eftir `approved-prompt-v3.md` (Jonesy L1–L4, `correction-prompt-review-v3.md` umferð 3), eftir Jonesy's result review (umferð 2, `result-review.md`) sem fann X1–X5. Engin ný netvinna, ekkert app/test/config/routes.js snert. `pre-sample-plan.md` og ledger-línur 1–3 (þar með talið v2-leiðréttingin) ÓBREYTTAR — allar leiðréttingar eru nýjar, dagsettar viðbætur.

### Lestrarskrá þessarar v3-umferðar

**Fulllesið núna:** `approved-prompt-v3.md`, `correction-prompt-review-v3.md` (umferð 3), `result-review.md` (umferð 2, X1–X5), `samples/inventory_chain.py` (v2-útgáfa, til að vita hverju ætti að bæta við), `samples/build_candidate.py` (v2-útgáfa), `samples/exchange-ledger.jsonl`, `samples/manifest.md`, `evidence-north.md` (v2-útgáfa).

**Keyrt beint, ekki endurnotuð prósa:** `docs/ai/tasks/ticket-483/samples/legacy-faerd-fresh.json`, `docs/ai/tasks/ticket-485/samples/legacy-faerd-https.json`, `docs/ai/tasks/ticket-483/samples/legacy-faerdpunktar.json`, `docs/ai/tasks/ticket-485/samples/legacy-faerdpunktar-https.json` — allar lesnar AF SKRIPTUNNI (`inventory_chain.py`'s `section_feed_ages_y2_l1`/`section_notice_73688_and_side_roads`), ekki af mér handvirkt, og úttak varðveitt.

### Y1/L2 — Nákvæmni- og assert-regla fyrir tengibil

`inventory_chain.py` og `build_candidate.py` reikna núna `exact_xy_equal` (bool á FULLU float-tuple, ekki afrúnnað) og óafrúnnaða fjarlægð í sitt hvorum reit fyrir hvert skref. Sjálfstæð keyrsla þessa umferð:

```
Exact-contact count (exact_xy_equal==True): 44 of 46 inter-piece transitions.
Non-exact transitions (idferill, unrounded_gap_m): [(30401, 1.7704337999295003), (2816, 42.8408915829423)]
  idferill 30401: documented=1.77m, measured(unrounded)=1.770434m, deviation=+0.000434m
  idferill 2816: documented=42.84m, measured(unrounded)=42.840892m, deviation=+0.000892m
  Assertion passed: both documented constants are within 1cm of their own unrounded measurement
```

`build_candidate.py` sett upp með samsvarandi `assert`-köllum (keyrslan sjálf mistekst með `AssertionError` ef mæld fjarlægð einhvers staðar víki >1cm frá skjalfestu fastanum, eða ef ónafngreint bil finnist) — þetta ER skjalfesting á samsvörun við þegar-skráða heimild, EKKI nýr nálægðarþröskuldur, og breytir EKKI sönnunargráðunni (bæði bil eru áfram "bridged by pre-registered rule", ekki "VERIFIED driving connection", K1 óbreytt). `route-data-candidate.json`'s `direction_grade` leiðrétt úr "45 of 46" í **"44 of 46"**. 316,7123 km og sönnunargráða stefnu ÓBREYTT.

### Y2/L1 — Sýnisaldur úr skráarstigs DagsKeyrtUt

Ný `section_feed_ages_y2_l1()`-fall í `inventory_chain.py`, keyrt og varðveitt í `inventory_chain-output.txt`:

```
faerd2017_1, 2026-10-28 capture: export_ts=2026-10-28T18:51:00Z, age=8d 0h 6m 23s (total_seconds=691583), n_rows=708
faerd2017_1, 2026-11-02 capture: export_ts=2026-11-02T13:21:00Z, age=3d 5h 36m 23s (total_seconds=279383), n_rows=708
faerdpunktar2017_1, 2026-10-28 capture: export_ts=2026-10-28T18:56:00Z, age=8d 0h 1m 23s (total_seconds=691283), n_rows=43
faerdpunktar2017_1, 2026-11-02 capture: export_ts=2026-11-02T13:21:00Z, age=3d 5h 36m 23s (total_seconds=279383), n_rows=26
Age range across all 4 feed files: 3.2336 to 8.0044 days -> stated range '3-8 days' (not '3-7 days').
```

Hvert af 4 skránum er fyrst STAÐFEST (assertion) að hafa EINN einstakan `DagsKeyrtUt`-stimpil yfir allar eigin raðir, áður en aldur er reiknaður — eldra `faerd`-sýnið er 8d 0h 6m 23s (ekki "7d 1h" eins og v2 sagði), og `faerdpunktar`-sýnið frá sama degi hefur SINN EIGIN, LÍTIÐ ÓLÍKAN stimpil (18:56:00Z, ekki 18:51:00Z). `DagsSkrad` er aðskilið, ekki ruglað saman. `evidence-north.md` §4 leiðrétt í samræmi.

### Y3/L3 — Hreinsun á ágiskuðum tíma

Ný, dagsett ledger-lína (#4, sjá `samples/exchange-ledger.jsonl`) afturkallar "sömu mínútu og exchange 2" ágiskunina sem stóð í LÍNU 3 — línu 3 sjálf er ÓBREYTT (söguleg skrá), nýja línan er viðbót. Sama afturköllun bætt við `samples/manifest.md` (nýr kafli "Dated correction, v3 round") og þessa skýrslu (sjá budget-töfluna að ofan). Varðveitt: probe-röðun (exchange 1 ÁÐUR en plan var skrifað, mtime 18:57:10Z — eignað Jonesy's fyrri sandbox-athugun, EKKI nýrri mælingu hér) er aðskilin frá probe-TÍMA (UNKNOWN). 30-mín-gluggi ÓSTAÐFESTUR fyrir exchange 1. "Enforcing"-orðalagið um 8 MiB-þakið er afturkallað: retained headers sýna `Transfer-Encoding: chunked` ÁN `Content-Length`, svo `--max-filesize`-flaggið er ekki staðfest að hafa raunverulega heft neitt hér (svarið kláraðist hreint innan marka, en það er niðurstaða, ekki sönnun á framfylgdarbúnaði). Full C1-framfylgd er NOT_DOCUMENTED. Engin ný beiðni send.

### Y4/L4 — Canonical encoding

`build_candidate.py` skrifar núna `route-data-candidate.json` með `encoding='utf-8', newline='\n'` útgefið (áður aðeins `encoding='utf-8'`, sem lætur línuenda ráðast af keyrslukerfi). Endurlesið í tvíundarham strax eftir skrift til að reikna bæti/SHA256 ÚR SÖMU bætunum á disk (ekki endurröðuð/normalíseruð eftir á), með `assert`i sem staðfestir ENGIN CRLF-bæti eru í skránni:

```
byte count (re-read from disk, binary mode): 52691
SHA256 (of those exact on-disk bytes): 094fb5d3615c1d5f0e7b372706d134bf48e9c5e954ab3ec7af61fa825b0fb4a8
```

Sjálfstætt endurstaðfest með `sha256sum` á skránni eftir á — sama gildi. Keyrt margsinnis meðan á þessari umferð stóð (tölurnar breyttust einu sinni milli keyrslna vegna þess að `generated_by`-metadata-strengurinn var sjálfur uppfærður til að vísa í v3 — sjálf gagnagildin breyttust ekki, aðeins þessi eina lýsingarstrengur); lokaniðurstaða er byte-fyrir-byte endurkeyranleg frá núverandi skriftu. v1/v2 budget-tafla og liðir 4–6 í "Eigin sannprófun"-kaflanum fengu innlínumerki hér að ofan sem vísa í þessa leiðréttingu.

### Eigin keyrslur þessa umferð vs. fyrri fullyrðingar (Y1–Y4 tékklisti)

| Atriði | Mín eigin keyrsla núna | Áður (v1/v2/Jonesy) |
|---|---|---|
| exact_xy_equal + óafrúnnuð fjarlægð | Reiknað per skref, bæði forrit | v2: aðeins afrúnnuð gildi/hardkóðaður dict |
| direction_grade-orðalag | "44 of 46" | v2: rangt "45 of 46" |
| Sýnisaldur | Reiknað úr skráarstigs DagsKeyrtUt, assertion á einsleitni | v2: ekki reiknað í neinni skriftu, aðeins nefnt "7d 1h" lauslega |
| Exchange-1-tími | UNKNOWN, röðun aðskilin frá tíma | v2: ágiskað "sömu mínútu" |
| Body-cap-framfylgd | NOT_DOCUMENTED, chunked-fyrirvari | v2: "enforcing" (of sterkt orðalag) |
| JSON-hash | Canonical LF, byte-endurlesið, aðferð tilgreind | v2: ótilgreint hvort CRLF/LF |

App-próf/lint/build/vafri EKKI keyrð — engin appbreyting.

### Takmarkanir þessarar v3-umferðar

- Engin ný gögn/netkall; `pre-sample-plan.md` og ledger-línur 1–3 ÓBREYTTAR.
- Engin eigandaákvörðun tekin eða enduropnuð.
- `EVIDENCE_READY_FOR_OWNER_REVIEW` stendur fyrir ÞESSA LEIÐRÉTTU afhendingu.
- Akureyri-endapunktur, punktafjöldi, sameining við Rauðavatn–Borgarnes ÁFRAM óákveðin.

**CC_COMPLETE (v3 leiðrétting). Production NOT_TESTED. Næst: eigandi → Jonesy ("CC búinn") → Ripley lokamat.**

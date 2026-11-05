# #493 — Docs-only leiðrétting eftir A-úttekt

## Ripley — umferð 2, 2026-11-05

Til Jonesy prompt-review. Lokamat A-afhendingar er REVISE, ekki PASS. Þetta skjal er ekki execution-heimild. v1 er óbreytt og immutable. Eftir samþykki verður þetta gefið út sem approved-prompt-v2.md; engin appvinna er heimiluð. Heimild: result-review.md, Jonesy W1–W3 og Ripley lokamat.

### Fyrirhugað execution-prompt

Lestu AGENTS.md, CLAUDE.md og docs/ai/README.md/CURRENT.md. Framkvæmdu aðeins þegar CURRENT er READY_FOR_CC, vísar á samþykkta v2-skrá og eigandi segir „Prompt approved“. Settu CC_IN_PROGRESS áður en leiðrétting hefst og CC_COMPLETE eftir uppfærðan cc-report. Niðurstöðumerkið BLOCKED_PENDING_OWNER_SCOPE_DECISION stendur; leiðrétting afhendingar er ekki samþykki á innleiðingu eða umfangi.

Skyldulestur: approved-prompt-v1.md, infrastructure-audit.md, cc-report.md, result-review.md og issue-493-2026-11-05.json undir ticket-493; núverandi WinterRoute.jsx, winterRouteEta/Summary/Comparison.js, translations.winterRoute.js, cache.js, roadFetch.js, forecastFetch.js og routes.js. Lestu einnig nákvæmlega retained heimildirnar sem þarf til W3 hér að neðan. Ekki nota fyrra samtalsminni sem heimild.

**W1 — Rétt tímasemantík og eigandaákvörðun (Jonesy R1).** Leiðréttu audit §5/§8/§10 og öll sambærileg mótsagnakennd atriði í skjalinu/cc-report: sameiginlegt departureHour er ekki sameiginlegur spátími. Núverandi resolvePointAtDeparture velur eigin tíma per punkt út frá áætlaðri komu; spákort sýna winterRouteEstimatedArrival og 70 km/klst.-forsendu, Summary notar sömu per-punkts upplausn og Comparison ber saman ±2 klst. brottfarir. Þetta uppfyllir ekki #493 sameiginlegan spátíma/enga komutíma. Skráðu skýra yfirfærslutöflu: skrá/fall eða strengjalykill, núverandi hegðun, hvað þarf að fjarlægja/aðlaga, hvað má endurnýta og hvaða regression þarf síðar. Nefndu raunverulega strengjalykla við lestur, m.a. winterRouteEstimatedArrival, winterRouteEtaApproximationNote, brottfararval, comparison-merki/announcement og out-of-window texta. ETA-reikniregla er ekki „endurnýtanleg óbreytt“ fyrir #493; hreinar mæligildareglur/presentation má aðgreina frá tímainntakinu án refactors núna.

Skráðu eigandaákvörðun hvort afhent ETA-/±2 hegðun #486/#489/#490 verði færð yfir fyrir núverandi tvær leiðir eða haldist í sérstöku eldra flæði. Ekki velja lausn eða fela hana í scope-tillögu. Öll ný #493 leiðarsamsetning verður að uppfylla sama spátíma og engir komutímar; möguleg varðveisla eldra flæðis þarf sérstaklega samþykkt umfang og má ekki gera #493 acceptance að engu. Uppfærðu T11 með sama UTC forecast timestamp á mismunandi fjarlægum punktum, óháð km/h/ETA, og skýrri out-of-window hegðun; bættu við matrix-línu sem sannreynir að engir komutímar, ferðahraðaforsendur eða brottfararráðleggingar birtist í #493 flæði. Ekki fullyrða að þessi próf hafi verið keyrð.

**W2 — Tillaga um afköst og cache (Jonesy R2).** Bættu við afmarkaðri tillögu, ekki útfærslu eða samþykktri hönnun: skilgreindu parameter M fyrir hámark punkta per uppstreymisbeiðni, hvernig staðfesta þarf M gegn þjónustumörkum, og B=ceil(U/M) fyrir U einstaka spápunkta. Skilgreindu batching, takmarkaða samhliða vinnslu og hvernig bilun í batch/punkti skilur eftir explicit missing án þess að jafngilda góðum skilyrðum eða fela önnur gild gögn. Tillögugildi eru ekki sannreynt veituhámark eða samþykkt aukin notkun. Gefðu merkt stutt/langt/fullhrings dæmi eða formúlur þar sem U er óþekkt; greindu actual current cache hit/miss/cold start frá nýrri tillögu og HTTP frá billable einingum.

Leiðréttu O(N)/„hver ný leið tvöfaldar“: ef S staðir og tvær áttir per ordered endapunktapar eru studd er hámark mögulegra leiðarvalkosta 2*S*(S-1), án same-origin og áður en samhverfa/dedup er nýtt; þetta er merkt líkan, ekki fjöldi raunverulega tilkominna cache entries. Nefndu bounded cardinality/eviction tillögu eða afmarkað allowlist/version-bound líkan og áhrif cold starts; núverandi cache er module-memory, ekki dreift.

Berðu saman route-level cache við stöðuga sameiginlega point-/link-lykla og deilingu tveggja landsfeed áður en leiðarsía er keyrð. Lýstu nauðsynlegum auðkennum (punkta-/hnita-/breytu-/tímaglugga-/gagnaversjón sem við á), TTL/ferskleika/in-flight/fallback einangrun og route-response identity sem þyrfti við samsetta leið. Núverandi routeId verndar núverandi tvær föstu leiðir; hann sannar ekki sjálfkrafa upphaf/enda/átt/gagnaversjón í nýju líkani. Samþykkt eiganda þarf fyrir breytingar á cache-/feed-deilingu; ekki leggja til nýja dreifða innviði. Skoðaðu fullyrðingar um óskörun núverandi leiða gegn definitions; ekki alhæfa án lestrar. Öll afkastatillagan er docs-only og óprófuð.

**W3 — Heimildir, tölur og sannprófunarorðalag (Jonesy R3–R5).** Leiðréttu audit §2/G1: #491 gildandi punktmat P4 er 70,566 km (afleiðsla 70,5664, haversine R=6371008,8m + native tengibil), ekki 70,780 km planar úr candidate; #483 kaflatengibil eru 0,0–34,7m, ekki öll 0m. Ekki endurreikna geómetríu eða breyta routes.js. Varðveittu INFERRED stefnu/aksturslengdartakmarkanir.

Lestu eða merktu nákvæmlega ólesnar skylduheimildir v1: #485 blocker-rights-register.md, owner-clarification-2026-11-02.md, research-report.md, coverage.csv, route-point-mapping.csv, final-bounded-report.md, samples/openmeteo-pricing.html, samples/openmeteo-terms.html, samples/manifest.md; #429 source-register.md, research-report.md, coverage.csv, samples/manifest.md; #483 research-report.md, route-segments.csv, samples/manifest.md, samples/vegagerdin-skilmalar.html; #491 final-validation/evidence-table-final.md, final-validation/route-data-candidate.json, derivation-29-pieces.md, nýjustu result-review-implementation.md leiðréttingar; docs/open-meteo-auth.md. Allar task-slóðir miðast við docs/ai/tasks/. Greindu fullan lestur, markvissan kaflalestur og ólesið. Lestur núna má ekki vera lýstur sem framkvæmd í v1. Retained sýni sanna ekki núgildandi þjónustuskilmála/verð/kvóta.

Uppfærðu cc-report með dagsettri v2-leiðréttingu, skýrum afturköllunum á röngum v1-fullyrðingum og eigin staðfestingu núna. Varðveittu rekjanlega sögu; ekki láta mótsagnir standa án leiðréttingar. Fyrri git-/skráalistakröfur eru CC-eignaðar og „ætti að sýna“ er ekki mæling. Núverandi read-only git status/diff má nota og skrá sem athugun þessarar lotu, án þess að sanna fyrri breytingasögu. Ekki fullyrða um liðna millistigsbreytingu CURRENT án retained sönnunar; fylgdu og skráðu eigin núverandi lifecycle rétt.

### Mörk, sannprófun og afhending

- Skrif aðeins í ticket-493/infrastructure-audit.md, ticket-493/cc-report.md og lögboðnar CURRENT-færslur. Ekki breyta approved-prompt-v1, review-sögu, issue snapshot, frumgögnum, appkóða, prófum eða dependencies. Engin eigandaákvörðun tekin sjálfkrafa.
- Engin netköll, lyklar/.env, ný þjónusta, gagnasöfnun, subagents, commit/push, GitHub-mutation eða deploy. Production NOT_TESTED.
- Sannprófaðu W1–W3 með markvissum lestri/search gegn kóða og retained heimildum, og samræmi §0/§5/§6/§8/§9/§10/cc-report. App-próf/lint/build/vafri eru ekki nauðsynleg fyrir docs-only breytinguna; merktu ókeyrt. Engin ný rúmfræðikeyrsla eða provider-prófun.
- Afhenda leiðrétta audit, uppfærðan cc-report með W1–W3 tékklista og nákvæmum heimildum/óstaðfestum atriðum. BLOCKED_PENDING_OWNER_SCOPE_DECISION stendur. CURRENT → CC_COMPLETE; eigandi → Jonesy „CC búinn“ → Ripley lokamat. #493 heildarmiði er áfram ólokinn.

### Jonesy review

PENDING. Staðfesta að prompt leiðrétti W1–W3 án app-/gagna-/rannsóknarútvíkkunar. Sérstaklega að tillaga um cache/point budget sé skýr en ekki tekin sem samþykkt hönnun, og að engin scope-/legacy-ETA ákvörðun sé tekin fyrir eiganda.

## Jonesy review — umferð 1 (2026-11-05)

### Niðurstaða: APPROVED MEÐ SKILYRÐUM B1–B2 (skjalaleg; brjóta inn í approved-prompt-v2.md)

Leiðréttingarpromptið er rétt afmarkað: docs-only, skrif aðeins í `infrastructure-audit.md`, `cc-report.md` og CURRENT, v1 óbreytt og immutable, engin netköll/lyklar/ný gögn, `BLOCKED_PENDING_OWNER_SCOPE_DECISION` stendur, og engin eigandaákvörðun er tekin fyrir hann. W1–W3 samsvara R1–R5 í `result-review.md` og ná einnig yfir önnur ósamræmi (§0/§5/§6/§8/§9/§10 og cc-report). Production NOT_TESTED. Ekkert keyrt á vél eiganda; engin próf/lint/build/git/vafri og engin netköll frá mér.

### Sandbox-athuganir mínar (lestur og lítil offline talning á staged afritum; ekkert net, enginn lykill)

- **Staða skráa:** CURRENT var PROMPT_REVIEW og vísaði á `correction-prompt-review.md`; v1 (`approved-prompt-v1.md`) og `infrastructure-audit.md` óbreytt frá því ég las þau (mtime 1793901630678 og 1793902250215); `result-review.md` var uppfært af Ripley með lokamati (REVISE samþykkt, W1–W3 samþykkt).
- **W1 staðfest við kóða:** `WinterRoute.jsx` kallar `resolvePointAtDeparture` per punkt og birtir `winterRouteEstimatedArrival`; strengjalyklarnir `winterRouteEstimatedArrival`, `winterRouteEtaApproximationNote`, `winterRouteHourLabel` og `winterRouteComparisonReasonArrivalOutsideWindow` eru til í `translations.winterRoute.js`; `winterRouteComparison.js` er ±2 klst. brottfarasamanburður. Lýsing Ripley á núverandi hegðun er rétt.
- **W2, "óskörun núverandi leiða":** ég bar leiðaskilgreiningarnar saman við fyrirliggjandi gögn. Vík-leiðin og Borgarnes-leiðin deila **engum `IDBUTUR`** (8 Borgarnes-`IDBUTUR` á móti Vík-listanum), **engum `IDFERILL`-bútum** (29 bútar Borgarnes á móti tier0 `VEGNR=="1"` Vík-keðjunni í `wfs-chain-4326.json`) og **engum spápunktum** (ólík hnit); þær deila hins vegar Rauðavatn-akkerinu (upphafsbilið 1436 endi → 1477 upphaf í Borgarnes-leiðinni). Fullyrðing um "engin sameiginleg kafli" er því rétt á `IDBUTUR`-/`IDFERILL`-/punktastigi en ekki á akkerisstigi; CC ætti að orða það svo.
- **W2, formúla:** með S stöðum eru S·(S−1) raðaðir endapunktar. "2" í `2*S*(S-1)` verður að vera hinar tvær leiðir um hringinn (miðinn: "Notandi getur valið hina leiðina um Hringveginn"), ekki akstursátt, því raðað par (Frá, Til) ber áttina nú þegar. Orðalag promptsins "tvær áttir per ordered endapunktapar" gæti tvítalið (sjá B1).
- **W3 staðfest:** P4 70,5664 km (v5 `derivation-29-pieces.md`) og 0,0–34,7 m bil (#483) eru rétt gildandi gildi.

### Skilyrði

- **B1 — skýra hvað "2" í cardinality-formúlunni stendur fyrir.** Í W2: skipta "tvær áttir per ordered endapunktapar" út fyrir "tveir hringvalkostir (hvor leið um hringinn) per ordered endapunktapar (Frá, Til)", og taka fram að formúlan telur mögulega *lykla*, ekki sannreyndar leiðir: gagnstæð átt er áfram INFERRED/UNKNOWN (A3), og lyklafjöldi, cache-bucket-fjöldi og fjöldi sannreyndra leiða eru þrjú ólík hugtök sem má ekki blanda. Annars gæti CC tvítalið eða lesið formúluna sem fjölda studdra leiða.
- **B2 — skýra "óskörun" í W2.** Bæta við að CC skuli prófa skörun á þremur stigum (`IDBUTUR`, `IDFERILL`/geometry-bútar, spápunktar/hnit) og greina frá akkerisdeilingu (Rauðavatn) sérstaklega, svo setningin "núverandi leiðir deila engu" sé ekki alhæfð út fyrir lesin gögn. Til upplýsinga: mín sandbox-athugun hér að ofan sýnir enga skörun á þessum þremur stigum.

### Athugasemdir (ekki skilyrði)

- **N1:** skyldulesturslistinn í W3 er langur. Það er heimilt að merkja "markvissan kaflalestur" og "ólesið", en cc-report ætti að skrá hvaða skrár voru opnaðar *í þessari lotu* og hvað var lesið í heild; rök á borð við fyrra samtalsminni teljast ekki heimild (prompt segir þetta nú þegar).
- **N2:** W1 bannar vel að velja lausn fyrir legacy-ETA/±2. Gagnlegt væri að valkostir eigandans séu settir fram hlutlaust með afleiðingum (t.d. færa núverandi tvær leiðir yfir í sameiginlegan spátíma, halda eldra flæði með sérstaklega samþykktu umfangi, eða fjarlægja), án tilmæla, í anda "Minni staðaþekja er valkostur til eigandaákvörðunar".

### Mörk

Prompt-review; engin gögn eða appkóði breytt og engin keyrsla heimiluð. Allar tölur hér eru úr lestri/talningu á staged afritum í sandbox. Stage helst PROMPT_REVIEW. Next: Ripley býr til `approved-prompt-v2.md` með B1–B2 og setur READY_FOR_CC; Róbert commit-ar sjálfur.

## Ripley — samþykki fellt inn, 2026-11-05

Jonesy APPROVED með B1–B2 tekið til greina í approved-prompt-v2.md. B1 greinir tvo hringvalkosti per raðað Frá/Til-par frá akstursátt og aðskilur mögulega lykla/cache-buckets/sannreyndar leiðir. B2 krefst offline skörunarathugunar á IDBUTUR/IDFERILL/spápunktastigi með akkerisdeilingu sérstaklega. N1/N2 felld inn: lotubundinn heimildalestur og hlutlausir legacy-ETA/±2 valkostir. Mörk óbreytt, docs only; engin appvinna eða eigandaákvörðun tekin. CURRENT → READY_FOR_CC; eigandi → CC „Prompt approved“.

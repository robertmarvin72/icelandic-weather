# #500 — Fyrsta nothæfa staðapar MVP: Egilsstaðir–Seyðisfjörður

## Ripley initial prompt — umferð 1, 2026-11-14

Til Jonesy-yfirferðar, ekki framkvæmdarheimild. Eigandi bað um næsta MVP-prompt. Ripley leggur til E1–S2 sem fyrsta staðapar vegna fyrirliggjandi veg93-gagna og samþykktra endapunkta. Þetta er tillaga um fyrsta par, ekki þegar samþykktur endanlegur release-listi; samþykkt framkvæmdarhandoff tekur til þessarar afmörkunar. R1-norður, Akureyri og aðrir staðir bíða; þeir eru ekki útilokaðir úr heildarmarkmiði #500.

### Útkoma

Gera beina tengingu **Egilsstaðir E1 ↔ Seyðisfjörður S2 um veg93** tilbúna fyrir #501 ef nauðsynlegar heimildir fást. Ekki búa til enn eina almenna staðaskrá eða endurpakka öllum fjórum staðafærslunum. Meginvinnan er að leysa það sem vantar um akstursstefnu/aðgengi þessarar tilteknu tengingar, ekki nýtt sniðskerfi. Fyrirhugað UI síðar: velja þessa tvo staði og fá eina beina leið, ekki gervihringferð. UI/leiðarvél eru utan þessarar #500-lotu.

### Lesa og endurnýta

- AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md.
- ticket-500/places-v1.json og result-review.md; ticket-499/endpoint-registry.json og lokamöt. E1 = 2345 END/2344 START, S2 = 2894 END/2892 START. Eigandaval, hnit og hlutlaus S2-lýsing óbreytt.
- ticket-493-place-data-phase2/samples/road93_section-v2.json, road93-candidate.json og evidence.md; ticket-493-place-network/samples/road-links.csv og chain-walks-v4.json. Nota aðeins veg93-keðjuna E1→S2 og frumskrár sem hún vísar í, sérstaklega wfs93-raw.json. Ekki fara aftur yfir landslistann.
- ticket-499/samples/raw-S2-WGS84.json og retained E1-svar samkvæmt registry. Fyrirliggjandi EXACT_GAP staðfestir að faerdferlar-eiginleikar einir sanna ekki leyfða akstursstefnu.

### Framkvæmd eftir samþykkt

1. Staðfesta afmarkað að retained keðjan nær milli valinna móta, með réttri röð/endapunktum. Endurnýta gögn og athuganir sem þegar eru til; ekki endurkeyra stór rannsóknarsöfn. Ekki taka með stykki eftir S2 að ferjubryggju eða nota aukafeatures með sama IDBUTUR sem veg93-leið án heimildar.
2. Leita að **heimild fyrir tvístefnu/akstursaðgengi á þessari almennu veg93-tengingu**. Samfelld geometry, VEGHLUTI, heiti vegar eða vetrarþjónustuflokkur eitt nægir ekki. Aðgreina venjulega leiðartengingu frá tímabundinni færð/lokun; gömul færðarsýn eru ekki núverandi opnunarstaða. Ekki krefjast nýrrar landsdekkandi leyfisrannsóknar eða vottunar á hverjum geometry-hnút. Skýr opinber lýsing/gögn sem eiga sannanlega við þennan veg og báðar áttir nægja; skrá mörk þeirra.
3. Ef nauðsynleg gögn eru ekki retained má nota afmörkuðu heimildaleitina hér að neðan. Stöðva þegar ein fullnægjandi heimild finnst. Ekki leita áfram til að safna fleiri staðfestingum.
4. Ef heimild fæst: afhenda eina litla `road93/connection.json`, tengda núverandi staða-ID, með raðaðri keðju og orientation fyrir hvora átt, uppruna og aðskildum geometry/access-stöðum. Tilgreina nákvæmlega hvaða staðreyndir heimila supported fyrir þetta par. Engin sjálfvirk breyting á EXACT_GAP fyrir önnur staðapör eða allan IDBUTUR-flokkinn. Reikna ekki nýtt ETA, veðurskor eða fullan hring.
5. Ef heimild fæst ekki: halda unsupported, skila stuttri skýrslu um **nákvæmu óleystu staðreyndina og hvaða heimild þarf** og stoppa. Ekki framleiða aðra óstudda afritastaðaskrá, nýja öflunaráætlun eða sjálfvirkt framhaldsprompt. Eigandi ákveður einföldun/annað par eða áframhald. Ekki kalla slíka niðurstöðu tilbúna akstursleið þótt heimildaleitin hafi verið rétt framkvæmd.

### Afmörkuð heimildaleit

Þetta draft heimilar engin köll. Eftir Jonesy-samþykkt approved-prompt og nýtt eigandahandoff „Prompt approved“ má gera mest **þrjár vefleitir** með opinberum lénasíum `vegagerdin.is` og `umferdin.is`, aðeins um veg93/Seyðisfjarðarveg og akstursstefnu/aðgengi. Mest **sex opnanir opinberra heimildasíðna/skjala** úr þeim niðurstöðum eða beinum tenglum þeirra, á sömu lénum/undirlénum. Leitarniðurstöðubrot eitt er ekki sönnun. Engin óafmörkuð korta-/þjónustuleit, ný WFS-öflun, bulk-download, API-lykill, innskráning, ný þjónusta/dependency eða þriðja aðila leiðavél. Ef önnur öflun þarf, stoppa og segja hvers vegna. Þetta er lítil heimildaleit, ekki nýr HTTP-client eða gagnaöflunarkerfi.

Varðveita aðeins heimild sem niðurstaðan byggir á: URL, titil, aðgangsdag, viðeigandi stutt efnisatriði og SHA ef heimild er vistuð sem skrá. Heimild má ekki segja meira en hún styður; ekki afrita heilar greinar eða birta óstaðfesta akstursleið. Tímabundnar upplýsingar skulu merktar með dagsetningu, ekki gerðar að varanlegu aðgengi.

### Prófun og afhending

Aðeins nýtt efni undir `docs/ai/tasks/ticket-500/road93/` og CURRENT.md. Ef supported-connection verður til: markvissar offline-athuganir á E1/S2-endum, keðjuröð, viðsnúningi, engri lengingu að ferjubryggju og því að missing-access-evidence falli í unsupported. Neikvæð próf kalla raunverulega athugun með brotinni keðju og fjarlægðri aðgengisheimild; ekki hundruð mutation-prófa. Ef aðgengisheimild vantar, enginn validator eða nýtt schema þarf að vera byggt til að segja það.

Stutt cc-report.md: „tilbúið fyrir #501“ með heimild eða „enn óstutt“ með einu nákvæmu gati. Engin löng ný audit-skýrsla. Fyrri gögn/prompt/yfirferðir óbreytt. Engin app/API/UI-/scoring-/entitlement-/checkout-/ETA-breyting, delegation, commit/push, GitHub-birting/lokun eða deploy. #500 í heild ekki lokað af þessari lotu og 72-staða markmið ekki merkt uppfyllt.

CC keyrir aðeins approved-prompt sem CURRENT vísar á í READY_FOR_CC eftir eiganda „Prompt approved“ og notar README-lifecycle til CC_COMPLETE. Jonesy metur þetta tiltekna par og raunverulega MVP-blockera, ekki enduryfirferð lokins R1-gagnasamnings. Fyrsta review-umferð þessa afhendingar; ekki hefja þriðju umferð án eigandaákvörðunar.


## Jonesy review — umferð 1 (2026-11-14)

**Niðurstaða: APPROVED — engin skilyrði, engir sýndir blockerar.** Athugasemdir NA1–NA3 eru valfrjálsar og mega ekki tefja „Prompt approved“ né skapa vinnu.

### Sandbox-staðfest (mitt, aðeins lestur á retained skrám, engin köll)

- `wfs93-raw.json` SHA-256 = 1d8c9cf8…49eb33 (stemmir við `road93-candidate.json`); numberMatched/Returned/total = 24/24/24; 6 IDFERILL × 4 NAKVAEMNIFERLIS-þrep; öll sex stykki eru IDBUTUR 911040037 (2344) eða 911170037 (hin fimm), VEGNR 93.
- **E1→S2 keðjan er til og er rétt tengd**: 2344 → 3410 → 3409 → 2894, frá E1-mótum native (715153.74, 536679.93) (= START 2344) til S2-móta native (732875.674, 538207.0762) (= END 2894 = START 2892). Öll þrjú innri bil mæld sjálfstætt úr raw: 0,0 m. Þrep −1 (fínasta, canonical OBJECTID 5882/5839/5838/4980): lengd 1716,2 + 9882,1 + 14011,2 + 642,9 = **26 252,3 m planar**. Viðsnúin röð (S2→E1) er nákvæm speglun, báðir endar rétt.
- **Engin lenging að ferjubryggju nauðsynleg eða falin**: 2892 og 2891 eru *handan* S2-mótanna (2892 START = S2). Retained veg93-keðjan er sex stykki; ekkert annað VEGNR 93-stykki er í raw.
- Prompt-staðhæfingar stemma: E1 = 2345 END/2344 START og S2 = 2894 END/2892 START eins og í `places-v1.json`; S2-heitið hlutlaust; E1-hnit og S2-hnit óbreytt; `driving_access_both_directions` = EXACT_GAP á báðum; stefna VEGHLUTI=1 er INFERRED, ekki sönnuð.
- Aðgengissvið raw (THJONUSTUFLOKKUR 2, SNJOMOKSTURSREGLA 7X, opið 06:30–22:00, dagsetning 2026-10-07) sanna **ekki** akstursstefnu; þetta er vetrarþjónusta/tímabundið og passar við prompt-regluna að slíkt eitt og sér nægi ekki.
- Afmörkun leitarheimildar er skýr: engin köll fyrir „Prompt approved“, ≤3 leitir / ≤6 opnanir á vegagerdin.is og umferdin.is, stopp við fyrstu fullnægjandi heimild, unsupported + eitt nákvæmt gat ef ekkert finnst, aðeins úttak undir `ticket-500/road93/`. Þetta er MVP-stórt og ekki nýtt kerfi.

### Valfrjálsar athugasemdir (ekki blockerar)

- **NA1 — lengdargildi í retained skrám eru fyrir sex stykki.** `road93-candidate.json` (26,93 km) og `road93_section-v2.json` (26,9266/27,8536 km, `canonical_order` með 2892+2891) ná *út fyrir* S2. Ef CC endurnýtir þær óbreyttar yrði keðjan of löng, þvert á „ekki lengja að ferjubryggju“. Prompt bannar þetta þegar; hjálplegt er aðeins að `connection.json` skrái fjögur stykki og endi við 2894 END, og að CC reikni lengdina úr þeim fjórum (≈26,25 km þrep −1), ekki afriti 26,93.
- **NA2 — hvað telst „báðar áttir“.** Líklegasta niðurstaða er að opinberar síður lýsi vegi 93 sem opnum þjóðvegi án þess að segja orðrétt „tvístefna“. Til að forðast ágiskun við samþykkt: CC tilgreini orðrétt hvað heimildin segir um stefnu/aðgengi og merki skýrt hvort það sé *beint* sagt eða *dregið ályktun af*; sé aðeins ályktun, þá unsupported með því gati. Ripley/eigandi meta þá í lokamati hvort almenn „opinn þjóðvegur“-lýsing nægi, ekki CC sjálft.
- **NA3 — geometry-val.** Skrá í `connection.json` hvaða þrep/OBJECTID eru notuð (retained canonical regla E2d, þrep −1) og SHA wfs93-raw.json (1d8c9cf8…), svo #501 geti endurframleitt. Ekki ný gagnaöflun.

### Takmörk

Ekki GitHub, ekkert keyrt á vél eiganda, engin vefleit/heimildaleit gerð af mér (þeirra þarf ekki í þessari prompt-yfirferð; hvort heimild er til er einmitt spurningin sem CC svarar eftir „Prompt approved“). Sjálfstæð uppreikningur á keðjunni er úr retained raw, ekki ný WFS-öflun. CC-eignað: allt sem gerist á Windows, git, og leitin sjálf.

### Næsta skref

Ripley skrifar approved-prompt (NA1–NA3 má taka með sem ein lína, eða sleppa), Stage → READY_FOR_CC; eigandi segir CC „Prompt approved“. Þetta er fyrsta Jonesy-umferð þessa prompts; ekki þarf aðra.

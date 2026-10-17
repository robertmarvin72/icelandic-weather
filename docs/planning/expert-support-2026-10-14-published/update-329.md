## Staða — audit 13. ágúst 2026

**STILL RELEVANT / NARROW QUALITY FOLLOW-UP TO `#326`**

`#326` lagaði stóran hluta af weather-severity vandanum, en `#329` er ekki að fullu leyst.

Þetta mál á að vera afmarkað prompt/content-quality calibration. Ekki breyta underlying weather classification eða scoring nema sérstakt data-audit sýni þörf.

## Það sem `#326` kláraði

Núverandi shared prompt-reglur innihalda:

- vikuflokkun:
  - `Mostly calm`
  - `Mixed`
  - `Predominantly poor`
- introduction/conclusion eiga að fylgja dominant weekly pattern,
- vindmörk:
  - `<10 m/s` light/moderate,
  - `10–14 m/s` breezy,
  - `15–19 m/s` strong,
  - `20+ m/s` very strong/challenging,
- bann við dramatískri weather/safety framsetningu án threshold-stuðnings,
- trace precipitation `<1 mm` má sleppa eða kalla little-to-no precipitation,
- almennar natural-Icelandic reglur,
- raw forecast input sem source of truth fyrir nákvæm gildi.

Forecast normalization býr einnig til weekly classification og merkir rain day aðeins við `>=10 mm` í summary logic.

Þessi atriði eiga ekki að vera endurinnleidd eða endurskrifuð í þessum miða.

## Staðfest eftirstandandi göt

### 1. Trace/light precipitation: 1–2 mm gap

Núverandi prompt segir:

- `<1 mm` má ekki lýsa sem disruptive/wet/rainy,
- operational rain-impact orðalag er leyfilegt frá `1 mm`.

`#329` byggir á observed output þar sem u.þ.b. `0.2–1.3 mm` var ofmetið. Gapið stendur því enn fyrir `1.0–1.9 mm`.

Núverandi `campsite_weather` prompt segir einnig almennt að útskýra:

> rain (wet ground, mud, setup difficulty)

án þess að binda áhrifin skýrt við rainfall threshold. Þetta getur ýtt undir operational-impact copy þrátt fyrir litla úrkomu.

### 2. Daily clarity

Promptið biður AI um að:

- lýsa breytingum yfir vikuna,
- nefna roughest days,
- draga weekly pattern úr raw inputi.

En enginn skýr contract segir:

- eitt day-specific claim per day/time window,
- ekki tengja gildi frá ólíkum dögum í eina causal setningu,
- ekki flytja peak value frá einum degi yfir á annan.

Dagaskil eru því aðeins prompt-vænting, ekki staðfest guardrail.

### 3. Natural Icelandic

Almennar reglur segja að nota náttúrulegt íslenskt mál, en þekktu óeðlilegu orðasamböndin eru ekki explicitly bönnuð eða normaliseruð:

- „Veðurblíðan verður ekki góð“
- „Aðstæður verða raktar“
- „Veðrið gæti haft áhrif á tjaldaðferðina“

Það er því ekkert sem sannreynir að þessi output-pattern séu horfin.

### 4. Advice calibration

Severity-reglur eru til, en practical-effect instructions geta enn ýtt undir of miklar ráðleggingar fyrir hóflegt veður.

Sérstaklega þarf að tryggja:

- lítil úrkoma → engin fullyrðing um blautan jarðveg, búnað eða erfiða uppsetningu,
- moderate/breezy conditions → practical note má vera vægt, ekki plan-change recommendation,
- plan-change/postpone wording → aðeins við skýrt challenging/hazardous signal,
- cold nights → proportional comfort note, ekki dramatísk niðurstaða.

## Scope

### A. Evidence-first fixture set

Áður en prompt er breytt skal vista sanitized dæmi úr raunverulegum eða representative generation-inputum:

1. Generally good week með 0–2 mm úrkomu.
2. Mixed week með einum greinilega verri degi.
3. Wind-focused week undir og yfir 15/20 m/s mörkum.
4. Rain-focused week með greinilegri úrkomu.
5. Day-separation dæmi þar sem peaks eru á ólíkum dögum.

Fyrir hvert dæmi skal skrá:

- input data,
- weekly classification,
- observed problematic output pattern,
- expected tone/claim boundary.

Ekki geyma PII eða unpublished proprietary copy í issue-comment; nota sanitized fixtures.

### B. Prompt-contract calibration

Afmarka reglur fyrir öll blog types sem nota shared severity tone, en sértækar breytingar aðeins þar sem actual prompt skapar vandann.

#### Rain

- `<2 mm/day` skal almennt lýsa sem little/light precipitation eða sleppa.
- `<2 mm/day` má ekki eitt og sér leiða til claims um:
  - blautan jarðveg,
  - drullu,
  - erfiða uppsetningu,
  - áhrif á búnað,
  - plan change.
- Compound exception aðeins ef annar skýr og sjálfstæður weather factor réttlætir practical impact; textinn má ekki kenna trace rain um áhrifin.
- `>=2 mm` er ekki sjálfkrafa disruptive; wording skal enn fylgja actual magnitude/duration og weekly pattern.

#### Daily clarity

- Halda day-specific metrics bundnum við réttan dag/time window.
- Ekki sameina peak wind frá einum degi og rain/temp frá öðrum sem eina samhliða atburðarás.
- Ef dagur er ekki auðkennanlegur skal sleppa day-specific claim frekar en að giska.

#### Icelandic language

Banna þekktu óeðlilegu patternin og gefa stutt natural alternatives, án þess að búa til langan phrase blacklist sem gerir textann vélrænan.

#### Advice

- Advice skal leiða af supplied severity/classification.
- Mild/typical weather má aðeins fá low-friction comfort/preparation note.
- Adjust/postpone/move wording þarf threshold- eða warning-stuðning.

### C. Validation strategy

Aðgreina tvennt:

1. **Deterministic tests**
   - prompt contract inniheldur rainfall/day/tone guardrails,
   - öll viðeigandi blog types fá réttu shared reglurnar,
   - threshold boundary fixtures fyrir `<1`, `1–<2`, `2+`, `10+ mm`.

2. **LLM output evaluation**
   - keyra fixture matrix fyrir IS og EN,
   - handvirkt review-a naturalness, day separation og proportional advice,
   - ekki kalla nondeterministic single-run snapshot „unit test“.

Ef automatic post-generation validation er talin nauðsynleg skal tengja hana við/samræma við `#224`, ekki byggja annað almennt validation layer hér.

## Acceptance criteria

### Rain calibration

- [ ] 0–<1 mm fær ekki operational impact wording.
- [ ] 1–<2 mm fær ekki operational impact wording eitt og sér.
- [ ] `>=2 mm` er metið proportionalt; ekki sjálfkrafa kallað disruptive.
- [ ] Generic `wet ground/mud/setup difficulty` instruction er threshold-gated þar sem hún er notuð.

### Daily clarity

- [ ] Day-specific claims nota aðeins gildi frá sama degi/time window.
- [ ] Fixture með peaks á ólíkum dögum myndar ekki sameinaða atburðarás.
- [ ] Óljós input leiðir til þess að claimi er sleppt frekar en að dagur sé giskaður.

### Natural language

- [ ] Þekktu óeðlilegu íslensku patternin koma ekki fram í reviewed fixture outputs.
- [ ] IS texti er endurskipulagður náttúrulega, ekki orð-fyrir-orð úr EN.
- [ ] EN og IS halda sömu factual severity, þótt orðalag sé ólíkt.

### Advice calibration

- [ ] Generally good week fær ekki plan-change advice.
- [ ] Mixed week er balanced og einn verri dagur skilgreinir ekki alla vikuna.
- [ ] Strong/challenging/postpone orðalag fylgir staðfestum thresholds.
- [ ] Advice stangast ekki á við weekly classification.

### Verification

- [ ] Sanitized fixture matrix nær yfir good/mixed/wind/rain/day-separation.
- [ ] Deterministic prompt-contract tests eru til.
- [ ] IS + EN LLM outputs hafa verið handvirkt reviewed.
- [ ] Engin regression í `#326` severity/week rules.

## Tengsl við aðra miða

- `#326` — lokið baseline fyrir severity og weekly classification; ekki enduropna.
- `#330` — forced winner í two-campsite comparison; annað data-contract/classification mál.
- `#224` — almennt validation layer fyrir AI drafts; samræma ef post-generation validation verður valin.
- `#214` — meta blog performance áður en workflow/CMS er stækkað.

## Scope guardrails

Ekki breyta í þessum miða:

- weather scoring eða recommendation logic,
- homepage forecast data,
- comparison winner/classification úr `#330`,
- blog DB schema,
- admin editor/CMS workflow,
- SEO/meta architecture,
- automatic publishing,
- öðrum content categories nema shared prompt-regla hafi sannanleg áhrif.

## Forgangsmat

**KEEP OPEN — relevant quality/trust issue.**

Ekki blocker fyrir Facebook-prófið. Forgangur hækkar áður en weather-driven blog drafts eru birt reglulega eða automation fær minni handvirka yfirferð.

Engin kóðabreyting var gerð við þessa backlog-yfirferð.

---

## Expert Support — fundur 2026-10-14

Heimild: Expert Support fundur með Guðrúnu Nínu Petersen hjá Veðurstofu Íslands, 14. október 2026; fundarúrdráttur afhentur af eiganda. Athugasemdir eru endursagnir úr úrdrætti, ekki orðréttar tilvitnanir. Fundurinn er ekki formleg staðfesting Veðurstofunnar á líkani Eltum Veðrið.

### Afmörkuð viðbót (athugasemdir og okkar tillaga aðgreind)

Staða/forgangur haldast Todo/P2. Fundur: 14:30. Bloggmiði #329 hefur þegar trace rain/1–2mm/samantektarvandann; ekki nýr blog-miði. Tillaga okkar: bæta heimild og acceptance um ekki „þurrt“ þegar niðurstaða er aðeins minni úrkoma, ekki operational-impact fullyrðingar frá litlu magni án gagna. Prófun: báðir dagar blautir og litlir munir án nýs sjálfvirks 2mm-viðmiðs. #330 samanburðar-sigurvegarar tengdur en ekki útvíkkaður sjálfkrafa.

Engar scoring-, veðurfræðilegar þröskulda- eða gagnagjafabreytingar án rannsóknar og sérstakrar samþykktrar útfærslu. Þessi miði heimilar ekki sjálfkrafa provider-skipti eða nýtt áhættulíkan.

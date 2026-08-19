# Lesson 01 — UX audit, visual verification og minimum fix

## Tilgangur

Fyrsta æfingin í advanced Claude Code workflow fyrir Eltum Veðrið.

Markmiðið var ekki bara að leysa UX-miða, heldur að meta hvernig Claude Code hegðar sér þegar hann fær:

- audit-first fyrirmæli,
- skýrt scope,
- STOPP-reglur,
- canonical source-of-truth reglur,
- og kröfu um að gera minnsta örugga breytingasett.

UX-miðinn snerist um að einfalda primary decision area á homepage þannig að notandinn fái eina skýra fyrstu ákvörðun:

**„Á ég að vera áfram eða færa mig?“**

---

## Upphaflegt workflow

Fyrirhuguð röð var:

1. Read-only audit.
2. Kortleggja controls, state og recommendation surfaces.
3. Staðfesta hvort breyting væri í raun nauðsynleg.
4. STOPPA ef scoring/data-flow eða canonical semantics þyrfti að breytast.
5. Gera minnsta örugga implementation ef audit sýndi raunverulegt vandamál.
6. Keyra targeted tests og full verification.

---

## 1. Source-code audit

Claude Code framkvæmdi read-only audit á homepage.

Audit-ið staðfesti meðal annars:

- eitt canonical `siteId` source of truth,
- GPS/location flow skrifar í sama location-state,
- ekkert duplicate location selector var til staðar,
- `RoutePlannerCard` radius/window semantics voru þegar rétt vernduð,
- `WeatherFinder` controls voru ótengd primary decision area,
- ekkert forecast-day control var í primary decision area,
- `HomeDecisionCard` var canonical decision surface,
- `RoutePlannerCard` verdict/content var þegar default-collapsed,
- engin önnur augljós duplicate recommendation surface fannst.

### Fyrsta niðurstaða

**`already satisfied / no code change`**

Claude Code breytti engri skrá.

Þetta var rétt niðurstaða út frá source-code auditinu.

---

## 2. Verification gap

UX-miðinn innihélt einnig kröfur um:

- initial viewport,
- desktop,
- mobile,
- visual hierarchy,
- semantic competition.

Claude Code hafði ekki browser/screenshot capability í sínu environment.

Það sagði það skýrt og reyndi ekki að fullyrða að visual verification hefði farið fram.

Því var staðan:

**Source audit passed. Visual verification pending.**

---

## 3. Manual visual verification

Homepage var síðan skoðuð handvirkt í browser.

### Desktop

Desktop útlit staðfesti að:

- location control var aðeins eitt,
- `HomeDecisionCard` var skýr primary decision,
- secondary controls trufluðu ekki fyrstu ákvörðun,
- `RoutePlannerCard` var collapsed.

**Desktop: PASS**

### Mobile

Mobile sýndi hins vegar semantic UX-vandamál sem source-code audit hafði ekki greint.

Beint undir canonical `HomeDecisionCard`, sem gat sagt:

**„Best að vera kyrr í bili“**

birtist collapsed `RoutePlannerCard` teaser með textanum:

**„Betra veður í nágrenninu“**

Þótt Route Planner verdict/content væri collapsed var teaser-textinn sjálfur sýnilegur og bar með sér recommendation claim.

Þetta skapaði semantic competition við canonical decision.

---

## 4. Targeted teaser audit

Claude Code framkvæmdi síðan þröngt audit á collapsed teaser-copyinu.

Audit-ið staðfesti að:

- teaser notaði shared `travelAdvisorTitle` / `travelAdvisorSubtitle`,
- copy-ið var tone-independent,
- sama copy birtist óháð canonical stay/move niðurstöðu,
- shared keys voru notaðir víðar í RoutePlannerCard,
- aðeins collapsed-teaser pairingið var vandamálið.

### Root cause

**Collapsed er ekki sama og neutral.**

Sýnilegur teaser-title/subtitle er sjálfur semantic surface, jafnvel þó megininnihald component-sins sé falið.

---

## 5. Minimum fix

Lausnin var vísvitandi haldið mjög þröngri.

Ný teaser-specific i18n keys:

- `travelAdvisorTeaserTitle`
- `travelAdvisorTeaserSubtitle`

### IS

**Title**

`Skoða aðstæður í nágrenninu`

**Subtitle**

`Sjáðu fleiri upplýsingar um nálæga staði.`

### EN

**Title**

`Explore nearby conditions`

**Subtitle**

`See more details about nearby campsites.`

Collapsed teaser notar nú aðeins þessi neutral keys.

### Ekki breytt

- expanded RoutePlanner content,
- `travelAdvisorTitle`,
- `travelAdvisorSubtitle`,
- `resultsExpanded`,
- tone logic,
- recommendation logic,
- scoring,
- `useComparisonState`,
- `comparisonUtils`,
- `relocationEngine`,
- Route Planner radius/window semantics.

---

## 6. Verification

Targeted og full verification eftir breytingu:

- `RoutePlannerCard.test.jsx`: **35/35 green**
- full test suite: **492/492 green**
- `npm run build`: **green**
- ESLint á breyttum skrám: **0 errors**

Ný regression tests staðfesta meðal annars að:

- neutral teaser copy birtist þegar component er collapsed,
- tone-bearing expanded copy birtist ekki meðan collapsed,
- expanded view heldur áfram að nota upprunalegt expanded copy.

---

## Lærdómur 1 — Collapsed ≠ neutral

Disclosure state segir aðeins hvort megininnihald sé sýnilegt.

Allt sem er áfram sýnilegt þegar component er collapsed telst enn hluti af UX surface:

- title,
- subtitle,
- badge,
- CTA,
- status text,
- icon/label combinations.

Teaser sem inniheldur recommendation claim getur því keppt við canonical decision þó verdict-detail sé falið.

---

## Lærdómur 2 — Source audit finnur structure, ekki perception

Static code audit er mjög gott til að staðfesta:

- state ownership,
- data-flow,
- duplicate sources,
- component usage,
- guardrails,
- dead/active code,
- literal strings.

En það getur ekki fullkomlega metið:

- visual hierarchy,
- juxtaposition,
- semantic competition,
- perceived contradiction,
- actual viewport density.

Fyrir visual/semantic UX þarf rendered verification.

---

## Lærdómur 3 — Tool limitation er verification gap, ekki PASS

Ef agent getur ekki sannreynt kröfu vegna tool/environment limitation skal það skráð sem:

**not verified**

ekki:

**passed**

Dæmi:

- ekkert browser tool → visual UX ekki staðfest,
- ekkert production dashboard → production metric ekki staðfest,
- ekkert runtime access → runtime behaviour ekki staðfest.

Mikilvægur munur:

**„Ég fann ekkert vandamál“ er ekki það sama og „ég staðfesti að ekkert vandamál sé til staðar.“**

---

## Lærdómur 4 — Do not manufacture a diff

Ef audit sýnir að miðinn er þegar uppfylltur skal agent ekki finna upp á breytingu til að réttlæta vinnuna.

Rétt niðurstaða getur verið:

**`already satisfied / no code change`**

en fyrir visual UX ticket skal sú niðurstaða vera provisional þar til rendered UI hefur verið staðfest af:

- browser-capable agent,
- automated visual tooling,
- eða manni.

---

## Lærdómur 5 — Minimum fix eftir root-cause audit

Þegar visual verification fann vandamál var ekki farið beint í refactor.

Röðin var:

1. finna symptom,
2. gera targeted audit,
3. finna root cause,
4. kortleggja blast radius,
5. velja minnsta mögulega fix,
6. bæta við regression test.

Útkoman varð:

- 2 ný i18n keys,
- 2-line key swap í collapsed branch,
- targeted regression coverage.

Engin ný state, conditional logic eða architecture breyting var nauðsynleg.

---

## Workflow pattern sem Lesson 01 staðfesti

Fyrir sambærilega UX-miða:

**Audit → classify → verify → identify gap → targeted audit → minimum fix → regression test → full verification**

Sérstaklega:

> For visual or semantic UX tickets, a source-only `already satisfied / no code change` result should remain provisional until the rendered UI has been visually verified.

---

## Hvað á ekki að flytja strax í CLAUDE.md

Þessi Lesson er case study og ætti fyrst um sinn að vera undir `docs/`.

Ekki flytja allar reglurnar sjálfkrafa í `CLAUDE.md`.

Bíða eftir fleiri Lessons og sjá hvaða patterns endurtaka sig.

Reglur sem endurtaka sig yfir fleiri verkefni geta síðar orðið:

- project invariant í `CLAUDE.md`,
- reusable Claude Code Skill,
- eða hluti af almennu UX implementation workflow.

---

## Staða

**Lesson 01: complete**

Niðurstaða:

- audit discipline: PASS
- scope discipline: PASS
- STOP/guardrails: PASS
- no-change discipline: PASS
- tooling-limit honesty: PASS
- manual visual verification: PASS
- minimum-fix discipline: PASS
- regression coverage: PASS

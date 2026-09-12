# Tjaldur — Character & Voice Bible

**Staða skjals:** Editorial og brand specification, samþykkt sem docs-only afurð (issue #413). Þetta skjal er *ekki* kóði, *ekki* runtime-breyting og *ekki* yfirlýsing um að eitthvað sem hér er lýst sé þegar innleitt. Sjá **§11, Núverandi útfærsla — status og gap-listi** neðst í skjalinu fyrir nákvæman greinarmun á því sem er *skilgreint hér* og því sem er *raunverulega í keyrslu í dag*.

**Tilgangur:** Þetta er canonical source-of-truth fyrir persónuleika, tón og raddar-mörk Tjalds — grunnurinn sem 100-comment Weather Voice content library (næsta verkefni á eftir #413) á að byggja á. Enginn nýr texti á að fara í production án þess að standast reglurnar hér.

**Heimildir:** Issue [#413](https://github.com/robertmarvin72/icelandic-weather/issues/413), byggt ofan á #405 (Weather Voice Phase 1 — regluvél), #406 (Phase 2 — content/selector/history) og #408 (Phase 3 — UI, kort, þögn, exposure history). Runtime-staðreyndir í þessu skjali eru staðfestar beint gegn `src/lib/weatherVoiceEngine.js`, `weatherVoiceRules.js`, `weatherVoiceContent.js`, `weatherVoiceSelector.js`, `weatherVoiceTypes.js`, `src/i18n/weatherVoice/is.js` og `en.js`.

---

## 1. Bakgrunnur og persónuleiki

Tjaldur hefur séð allt íslenskt veður. Tvisvar.

Hann hefur staðið í sól, slyddu, láréttri rigningu og roki sem hefði átt að fá eigið nafn. Þess vegna verður hann ekki sérstaklega spenntur yfir venjulegu íslensku veðri.

Tjaldur er veðurvanur, orðfár og örlítið skeptískur. Hann reynir ekki að vera fyndinn — hann segir einfaldlega það sem honum finnst um stöðuna. Það er yfirleitt það sem gerir hann fyndinn.

**Tjaldur er:**

- mjög þurr (dry/deadpan)
- kaldhæðinn
- orðfár
- örlítið fúll
- skeptískur
- veðurvanur
- yfirvegaður
- stundum óvænt ánægður

**Tjaldur er ekki:**

- barnalegur
- „hyper”
- „LOL”-fyndinn
- fullur af emoji
- dónalegur
- að gera grín að notandanum
- að reyna of mikið að vera fyndinn
- að gera lítið úr slæmu eða hættulegu veðri

## 2. Raddarmörk (Voice boundaries)

**Grunnregla:** Tjaldur segir helst minna en maður býst við. Styttra er yfirleitt betra — en þetta er leiðbeining um stíl, ekki hörð orðatakmörkun. Alvarlegur texti (voice level SERIOUS, sjá §4) má vera eins langur og skýrleiki og öryggi krefjast; aldrei skal stytta öryggisboð niður fyrir skýrleikamörk bara til að „hljóma eins og Tjaldur.”

Gott:

> „Vindur: Já.”
> „Sumar.”
> „Nei.”
> „Það fylgir vatn með.”

Ekki gott:

> „Úff! Það er sko heldur betur brjálað veður úti í dag! 😂🌧️”

**Húmor beinist að veðrinu — aldrei að notandanum.** Húmorinn má beinast að íslenska veðrinu, vindinum, rigningunni, kuldanum, óstöðugleikanum, óvenjulega góðu veðri, og stundum Tjaldi sjálfum. Hann gerir aldrei lítið úr notanda, ákvörðunum hans eða reynslu — ekki af vali hans um að ferðast, ekki af því hvernig hann er klæddur, ekki af fyrri ákvörðunum.

## 3. Skriftarprófið (Writing test) og context-dependent eligibility

Áður en nýr texti er samþykktur skal spyrja:

1. Myndi Tjaldur segja þetta?
2. Er hægt að segja það með færri orðum?
3. Er textinn fyndinn vegna þess að hann er þurr — eða er hann að reyna að vera fyndinn?
4. Er verið að gera grín að veðrinu frekar en notandanum?
5. Gæti textinn gert lítið úr raunverulegri hættu?

**Ef svar við spurningu #5 er já fyrir EITTHVAÐ samhengi sem textinn gæti birst í, er textinn ekki eligible fyrir þau samhengi** — ekki bara "óæskilegur," heldur útilokaður. Þetta er höfnunarviðmið, ekki stílráð.

**Góð lína er ekki sjálfkrafa gild í öllu samhengi.** Ein og sama setningin getur verið fullkomlega í anda Tjalds við eina veðurstöðu og algjörlega óviðeigandi við aðra — sama setning sem er skemmtileg við `sun_wind`/`suspicious` gæti verið óviðunandi ef hún birtist ranglega tengd alvarlegri stöðu. Eligibility er alltaf metin gagnvart tilteknu `condition`/`mood`/voice-level samhengi, aldrei sem almenn eiginleiki textans út af fyrir sig. Sjá §6 fyrir hvernig condition, mood og voice level eru aðskilin.

**Dæmi um Tjald sem ekki víkka umfang annarra eiginleika sjálfkrafa:** Ein af issue-dæmunum nefnir norðurljós („Norðurljósin eru þarna. Einhvers staðar.”) sem stílræna tilvísun um hversu lítið orðfár Tjaldur er — það er ekki heimild til að búa til nýtt Northern Lights-yfirborð fyrir Weather Voice né tengja Tjald við núverandi Northern Lights kort (#408's `NorthernLightsCard`, ósnert af þessu verkefni). Á sama hátt gefur skipandi (imperative) setningastíll eins og „Út með þig. Ég meina það.” ekki heimild til að búa til navigation CTA eða öryggisyfirlýsingu — CTA-heimildir stjórnast eingöngu af `ctaType`-vélbúnaðinum (í dag alltaf `null`, sjá §9), ekki af setningarforminu.

### Dæmi um Tjald

**Mjög Tjaldur:**

> „Vindur: Já.”
> „Nei.”
> „Sumar.”
> „Það fylgir vatn með.”
> „Sólin mætti. Vindurinn líka.”
> „Jæja. Þetta er óþægilega gott.”
> „Norðurljósin eru þarna. Einhvers staðar.”
> „Út með þig. Ég meina það.”

**Ekki Tjaldur:**

> „Úps! Veðurguðirnir eru greinilega ekki í góðu skapi í dag!”
> „Ekki gleyma regnhlífinni! ☔😂”
> „Brrrr! Það er sko kalt úti!”
> „Fullkomið veður til að kúra undir teppi!”

## 4. Þrjú voice levels

Weather Voice hefur þrjú mismunandi tónstig (voice levels), stjórnað af alvarleika aðstæðna — ekki af `severity` (0–3) gildinu úr núverandi vél, sjá skýra aðgreiningu í §6.

| Flokkun (classification) | Tónn (tone) | Lýsing |
|---|---|---|
| **SAFE** | **SARCASTIC** | Venjulegar eða áhugaverðar aðstæður, engin sérstök hætta. Tjaldur má vera fullkomlega kaldhæðinn. |
| **POOR** | **CAUTIOUS** | Aðstæður orðnar það slæmar að brandarinn skal víkja fyrir skýrleika. Persónuleiki má halda sér, en ráðleggingin skal vera skýr. |
| **DANGEROUS** | **SERIOUS** | Veður/aðstæður geta raunverulega verið hættulegar. Tjaldur hættir að djóka: engin kaldhæðni, enginn punchline, enginn texti sem gæti látið aðstæður virðast minna alvarlegar en þær eru. |

**Þetta er kortlagning, ekki tvö nöfn á sama hlut:** flokkunin (SAFE/POOR/DANGEROUS, vinstri dálkur) lýsir raunverulegum aðstæðum — heimild hennar er óákveðin, sjá §5.7. Tónninn (SARCASTIC/CAUTIOUS/SERIOUS, hægri dálkur, `voice_level` í framtíðar-skemanu, §9) er authored eigind textans sjálfs. Flokkunin ákvarðar hvaða tónn er leyfilegur — aldrei öfugt: að höfundur velji `voice_level: serious` fyrir eina línu er ekki, og getur aldrei orðið, sönnun eða heimild fyrir því að raunverulegar aðstæður séu DANGEROUS.

**Mikilvæg athugasemd um SAFE:** SAFE er ritstjórnarleg flokkun um *hvaða tón* er viðeigandi fyrir textann — hún er **ekki** yfirlýsing eða trygging um að ferðalag sé öruggt. Notandi getur verið í SAFE-tón aðstæðum sem eru samt ekki endilega hentugar til ferðalaga af öðrum ástæðum sem Weather Voice fjallar ekki um.

**Dæmi (úr issue, til að sýna tón — ekki alhæfð hættumörk):**

- SAFE/SARCASTIC — „8 m/s + rigning” → „Sumar.” Þetta dæmi sýnir *tóninn* sem hentar við óþægilegt-en-ekki-hættulegt veður; það er ekki fullyrðing um að 8 m/s + rigning sé alltaf, alls staðar, réttmætt SAFE-mörk. Nákvæm SAFE/POOR/DANGEROUS mörk (tölugildi, veðurskilyrði, gagnaheimild) eru **ekki skilgreind í þessu skjali** — sjá §5.5 og §5.7.
- SAFE/SARCASTIC — Rigning → „Það fylgir vatn með.”
- SAFE/SARCASTIC — Mjög gott veður → „Jæja. Þetta er óþægilega gott.”
- SAFE/SARCASTIC — Sól + vindur → „Sólin mætti. Vindurinn líka.”
- POOR/CAUTIOUS — „Ég myndi endurskoða planið.” / „Þetta er farið að verða óþægilegt.” / „Kannski ekki dagurinn.”
- DANGEROUS/SERIOUS — „Mjög slæmt veður framundan. Ferðalög geta verið varasöm. Athugaðu opinberar viðvaranir áður en þú leggur af stað.”

## 5. Hard safety precedence

Þetta er harða reglan sem #413 er til út af, og hún hefur forgang yfir allt annað í þessu skjali:

1. **Öryggisflokkun (DANGEROUS) hefur alltaf forgang yfir visual mood, venjulegt eligibility-flæði og cooldown-fallback.** Ef aðstæður eru flokkaðar DANGEROUS, skiptir engu hvaða mood myndavélin sýnir, hvaða condition er virkt, eða hvort venjulegur texti ætti annars að vera "eligible" — DANGEROUS-flæðið vinnur alltaf fyrst.
2. **DANGEROUS má EINGÖNGU nota efni úr sérstöku, yfirförnu safni** — hér kallað `weatherSafetyMessages` (eða sambærilegt) — aldrei úr venjulega kaldhæðna content library-inu (`weatherVoiceContent.js`/`is.js`/`en.js` í dag). Þetta á við í **öllum** eftirfarandi tilvikum, án undantekninga:
   - safety-safnið er tómt fyrir þessa condition/mood samsetningu,
   - tungumálið sem beðið er um vantar í safety-safnið,
   - öll safety-skilaboð sem passa eru í cooldown.
3. **Ekkert fallback á brandara, nokkurn tímann.** Ef ekkert gilt safety-skilaboð er tiltækt þegar aðstæður eru DANGEROUS, er **ekki** heimilt að falla til baka í venjulega content library-ið — hvorki fyrsta besta né minnst-nýlega-sýnda færslu þaðan. Nákvæmlega hvað gerist í staðinn (t.d. hljóð þögn, kyrrstæður öryggis-texti án húmors, eða vísun í annað núverandi (innra) viðvörunar-yfirborð) er **ákvörðun sem á eftir að taka fyrir runtime-innleiðingu** — hún er ekki tekin í þessu skjali.
4. **Innri hazard-tilkynningar appsins og opinberar viðvaranir frá utanaðkomandi yfirvöldum eru tvö aðskilin hlutir — hvorugt á að vera truflað.** Appið hefur nú þegar sitt eigið INNRA hazard-þröskuldakerfi, óháð Weather Voice (`src/config/hazards.js`'s `HAZARDS_V1`, `src/lib/hazardWindow.js`, `src/lib/routeRisk.js`, og hazard-flaggið sem `HomeDecisionCard.jsx` neytir nú þegar af `HAZARDS_V1.windWarn`/`gustWarn`/`rainWarn`) — þetta eru þröskuldar sem appið sjálft hefur ákveðið, EKKI viðvaranir gefnar út af Veðurstofunni, almannavörnum eða öðru utanaðkomandi yfirvaldi. `HAZARDS_V1` veitir enga „opinbera” stöðu eða vald; það er innri afurð þessa kóðabasa, ekkert annað. Appið tengist í dag **engri** ytri, opinberri viðvörunarveitu — engin slík samþætting er til í kóðanum í dag, og þetta skjal finnur ekki upp neina slíka tengingu né gefur í skyn að hún sé til. Weather Voice safety-routing er viðbót sem á aldrei að skipta út, tvítaka rökrétt, eða á nokkurn hátt draga úr **hvorugu** — hvorki núverandi innra `HAZARDS_V1`-kerfinu né (ef/þegar innleitt) tengingu við raunverulegar, ytri opinberar viðvaranir.
5. **Engin ný tölumörk eru fundin upp hér.** Þetta skjal skilgreinir ekki hvaða vindhraði, úrkomumagn eða annað magn telst DANGEROUS. Það er vísvitandi ákvörðun sem krefst eigin, sérstakrar úttektar (val á "authoritative danger classifier" er beinlínis STOP-skilyrði í samþykkta prompt-inu fyrir þetta verkefni).
6. **Engin sjálfvirk tenging milli `severity = 3` og DANGEROUS.** `severity` í núverandi vél (`weatherVoiceEngine.js`) er eingöngu tjáningarleg styrkleikavísitala (expressive intensity) — hún hefur *aldrei* verið ætluð sem öryggisflokkun, og er það ekki í dag. Að láta `severity === 3` sjálfkrafa þýða DANGEROUS væri nákvæmlega sú villa sem þetta skjal er skrifað til að koma í veg fyrir.
7. **Safety-merki (signal) og heimild þess er óákveðin — og hún er ekki það sama og textans eigin `voice_level`.** Hvaðan DANGEROUS-flokkun raunverulegra AÐSTÆÐNA ætti að koma — núverandi `HAZARDS_V1`, ný sjálfstæð hazard-lesning, eða opinber veðurviðvörun (Veðurstofan) — er ákvörðun sem þarf að taka áður en runtime-innleiðing hefst; þetta skjal tekur hana ekki fyrir CC. **Mikilvæg aðgreining:** að höfundur merki eina línu handvirkt með `voice_level: serious` (§9) er EKKI, og getur aldrei orðið, heimild eða sönnun fyrir því að aðstæðurnar sjálfar séu DANGEROUS — authored tónn lýsir skilaboðunum, ekki ástandinu. Ástandsflokkunin (SAFE/POOR/DANGEROUS, um raunverulegar veðuraðstæður) og skilaboða-tónninn (sarcastic/cautious/serious, authored eigind hverrar línu) eru tveir aðskildir hlutir með kröfu um eina-áttar kortlagningu — ástandsflokkun takmarkar hvaða tónn er leyfilegur, aldrei öfugt. Heimild ástandsflokkunarinnar er áfram óákveðin, viljandi, og verður ekki leyst með því að láta hana verða afleiðu af content-metadata.
8. **Óþekkt ástand (unknown) má aldrei sjálfgefið teljast SAFE.** Ef safety-merkið er ekki tiltækt, mistekst, eða er tvírætt, er sjálfgefna niðurstaðan **ekki** að meðhöndla ástandið eins og það sé öruggt — nákvæm framkvæmd þess (t.d. sjálfgefið í POOR/CAUTIOUS, eða þögn, eða vísun annað) er önnur ákvörðun sem bíður runtime-hönnunar, ekki tekin hér, en meginreglan — "unknown ≠ SAFE" — er hörð krafa nú þegar.

## 6. Condition, mood og voice level eru aðskildir hlutir

Þrjú aðskilin hugtök stjórna Weather Voice, og þau mega **aldrei** vera samasemmerkt hvert við annað:

- **Condition** — hvaða veðurregla átti við (t.d. `strong_wind`, `extreme_wind`) — í dag níu gildi úr `weatherVoiceEngine.js`.
- **Mood** — hvaða mynd/svipur Tjaldur sýnir (t.d. `struggling`, `wrecked`) — sjónrænt, ekki textatengt.
- **Voice level** — hvaða tónn (SARCASTIC/CAUTIOUS/SERIOUS) er leyfilegur fyrir textann, sjá §4 — **er ekki til í núverandi vél eða content-safni í dag** (staðfest gegn `weatherVoiceTypes.js`, `weatherVoiceContent.js`, `weatherVoiceSelector.js`: hvergi finnst `voice_level`/`voiceLevel` reitur).

Dæmi úr issue-inu sem sýnir hvers vegna þessi aðgreining skiptir máli:

```
condition: strong_wind
mood: struggling
voice_level: sarcastic
```

getur gefið „Vindur: Já.”

En:

```
condition: dangerous_wind   ← conceptual dæmi, EKKI raunveruleg condition í dag
mood: wrecked
voice_level: serious
```

má **aldrei** gefa fyndinn `wrecked`-texta. Safety level hefur alltaf forgang yfir mood (sjá §5).

**Áríðandi skýring á `dangerous_wind`:** þetta merki er tilbúið, myndrænt dæmi úr issue-inu til að sýna hugtakið — það er **ekki** núverandi condition í `weatherVoiceEngine.js`. Núverandi vél á eina raunverulega alvarlegustu condition, `extreme_wind` (mood `wrecked`, `severity: 3`, `windMax > 15 m/s`), og **öll fimm núverandi `wind_extreme_01`–`05` skilaboð í `is.js` eru kaldhæðin** (t.d. „Ég tek þetta sem persónulega árás.”, „Þetta var ekki í bæklingnum.”). Það er ekki sjálfgefið að `extreme_wind` == DANGEROUS þegar/ef voice_level er innleitt — það er ein af ákvörðununum í §5.7 sem á eftir að taka. Þangað til hún er tekin, er `extreme_wind`/`wrecked`/severity-3 einfaldlega **ekki flokkað sem DANGEROUS af Weather Voice sjálfu í dag** — hvorki af hönnun né tilviljun. Þetta skjal fullyrðir ekkert um hvort ÖNNUR kerfi í appinu (t.d. `HAZARDS_V1`'s eigin, sjálfstæðu vindþröskuldar `windWarn`/`windHigh` í §5.4) myndu merkja sömu raunverulegu aðstæður á einhvern hátt — það er utan gildissviðs Weather Voice og þar með þessa skjals.

**Ein `wrecked`-mynd gerir aldrei brandara "öryggis-eligible."** Sjónræn ásýnd Tjalds hefur engin áhrif á hvort texti er leyfilegur — það er eingöngu voice level sem ræður því, og voice level er algjörlega óháð mood.

## 7. Þögn (Silence)

Tjaldur þarf ekki alltaf að tala. Weather Voice birtist aðeins þegar aðstæður eru "comment-worthy" — ef ekkert áhugavert er að segja, á kortið að vera algjörlega fjarverandi, ekki fyllt með hlutlausu/áhugalausu spjalli bara til að sýna karakterinn.

**Núverandi API-kortlagning:** issue-hugtakið `show_weather_voice = false` samsvarar nákvæmlega núverandi `{ show: false }` niðurstöðu bæði úr `evaluateWeatherVoice()` (Phase 1, `weatherVoiceEngine.js`) og úr `selectWeatherVoiceComment()` (Phase 2, `weatherVoiceSelector.js`) — **þetta skjal krefst ekki að neinu sé endurnefnt** í kóðanum; `show_weather_voice` er einfaldlega concept-heitið sem issue-ið notar um sama hlut.

**Alvarlegar viðvaranir mega aldrei þagna vegna skorts á brandara.** Þetta er krafa sem á eingöngu við um *framtíðar* DANGEROUS/SERIOUS-flæðið (§5): ef aðstæður eru raunverulega hættulegar, er þögn (`show: false`) *ekki* ásættanleg staðgengill fyrir að hafa ekkert kaldhæðið að segja — sjá §5.3 um að öryggis-flæðið verður að hafa sitt eigið efni, ekki treysta á sama "hvað ef ekkert er eligible" fallback og venjulegt efni gerir í dag. **Að ekkert sérstakt safety-flæði sé til í dag leysir þetta áhyggjuefni ekki upp — það er einmitt kjarni málsins.** Án slíks flæðis er ekkert í núverandi keyrslu sem myndi meðhöndla raunverulega hættulegar aðstæður öðruvísi en venjulegt kaldhæðið efni; fjarvera safety-flæðisins er ástæðan fyrir kröfunum í §5, ekki sönnun fyrir að þeirra sé ekki þörf. Sjá §11 fyrir nákvæman lista yfir hvað vantar í dag.

## 8. IS/EN samræmi

Íslenska og enska Weather Voice deila sömu persónu, sömu raddarmörkum (§2) og *nákvæmlega sömu* öryggisreglum (§5) — öryggisregla gildir jafnt óháð tungumáli, engin undantekning.

**Ensk útgáfa er náttúruleg aðlögun, ekki skyldubundin orðrétt þýðing.** Markmiðið er að enskumælandi notandi upplifi sömu persónu og þann sama þurra tón — ekki að hver íslensk setning eigi sér orð-fyrir-orð enska tvíbura.

Núverandi staða: `en.js` er tómur, studdur listi (staðfest — `getWeatherVoiceLibrary("en")` skilar `[]`, ekki `null`; `null` er frátekið fyrir *óstutt* tungumál). Engin production ensk skilaboð eru skrifuð í þessu verkefni — dæmin hér að neðan eru **ritstjórnarlegar sýnishorn (editorial illustrations) eingöngu, ekki tilbúin production-lína og ekki samþykkt operational safety-ráðgjöf.**

| Level | Íslenska (IS) | Enska (EN) — editorial illustration only |
|---|---|---|
| SAFE/SARCASTIC | „Það fylgir vatn með.” *(núverandi production-lína, `rain_01`)* | „Comes with complimentary rinsing.” |
| POOR/CAUTIOUS | „Ég myndi endurskoða planið.” *(issue-dæmi, ekki núverandi production-texti)* | „I'd reconsider the plan.” |
| DANGEROUS/SERIOUS | „Mjög slæmt veður framundan. Ferðalög geta verið varasöm. Athugaðu opinberar viðvaranir áður en þú leggur af stað.” *(issue-dæmi, varðveitt orðrétt)* | „Severe weather ahead. Travel could be risky. Check official warnings before heading out.” |

Enska DANGEROUS-dæmið bætir **engum** nýjum veður- eða vega-fullyrðingum við umfram það sem íslenska setningin þegar segir — engin sértæk hættutegund, ekkert tölugildi, engin tilvísun í tiltekinn veg er fundin upp.

## 9. Framtíðar-skema fyrir 100-comment library

Þessi tafla skilgreinir reitina sem næsta verkefni (100-comment library) á að nota fyrir hverja línu, og kortleggur þá á núverandi camelCase runtime-reiti þar sem þeir eiga sér samsvörun nú þegar.

| Framtíðarreitur (snake_case, issue #413) | Núverandi samsvörun í runtime | Athugasemd |
|---|---|---|
| `comment_id` | `id` (`weatherVoiceContent.js`, `is.js`/`en.js`) | Þegar til: stöðugt ASCII-auðkenni, óháð tungumáli. Engin breyting þörf. |
| `condition` | `condition` (`WeatherVoiceCondition`, 9 gildi) | Sama orðaforði og í dag, óbreytt. |
| `mood` | `mood` (`TjaldurMood`, 12 gildi, 8 náanleg í Phase 1) | Sama orðaforði og í dag, óbreytt. |
| `voice_level` | **Ekkert í dag** | **Nýr reitur — authored eigind SKILABOÐSINS, ekki flokkun AÐSTÆÐNANNA.** Leyfileg gildi (lagt til hér, í samræmi við issue-dæmið `voice_level: sarcastic`): `"sarcastic" \| "cautious" \| "serious"`. Þessi þrjú orð samsvara tóndálknum í §4-töflunni og eru **kortlögð frá**, ekki það sama og, ástandsflokkunin SAFE/POOR/DANGEROUS — SAFE/POOR/DANGEROUS lýsir raunverulegum veðuraðstæðum og heimild þess er óákveðin (§5.7); `voice_level` er authored eigind sem hver lína fær út frá því hvaða ástandsflokkun hún er ætluð fyrir. Að úthluta `voice_level` á eina línu er **aldrei** sönnun eða heimild fyrir því hvernig raunverulegar aðstæður eru flokkaðar (sjá §5.7). Hvernig `voice_level` er *úthlutað* á hverja línu — handvirkt authored, eða staðfest af öðru ferli — er ákvörðun sem á eftir að taka; sjá §9.1 hér að neðan. |
| `text_is` | `is.js` entries' `text` (per `id`) | Óbreytt lögun. |
| `text_en` | `en.js` entries' `text` (per `id`) | Í dag tómur, studdur listi. Production enskur texti er utan gildissviðs þessa verkefnis. |
| `cta_type` | `ctaType` (`WeatherVoiceCtaType \| null`) | Óbreytt; má vera `null`; öll 27 núverandi færslur eru `null` í dag. |
| `repeat_cooldown` | `repeatCooldownDays` | **Einingar: dagar** (samræmi við núverandi kóða — `weatherVoiceSelector.js`'s `isAvailable()` reiknar `entry.repeatCooldownDays * MS_PER_DAY`). Sjálfgefið í dag: 7. |

### 9.1 Opin ákvörðun sem issue-listinn skilur eftir: `severity`

Núverandi runtime hefur einnig `severityMin`/`severityMax` á hverri metadata-færslu (sjálfgefið 0–3), notað af `weatherVoiceSelector.js`'s eligibility-síu. **Issue #413's átta-reita listi fyrir 100-comment library inniheldur ekki `severity` í neinni mynd.** Þetta skjal tekur enga afstöðu um hvort framtíðar-skemað á að:

- (a) halda `severityMin`/`severityMax` óbreyttu til viðbótar við nýja `voice_level`, eða
- (b) fella tjáningarstyrkinn (severity) inn í `voice_level`-hugtakið á einhvern hátt, eða
- (c) sleppa því alfarið.

Þetta er skráð hér sem **ákvörðun sem þarf að taka áður en 100-comment verkefnið hefst**, ekki gefið í skyn af þessu skjali á neinn hátt. `severity` og `voice_level` eru í öllum tilvikum aðskildir ásar (sjá §6) — jafnvel ef báðir eru varðveittir, mega þeir aldrei vera afleiddir hvor af öðrum sjálfkrafa (sjá §5.6).

### 9.2 Aðskilnaður venjulegs efnis frá öryggis-efni

Framtíðar-skemað hér að ofan lýsir **venjulegu** (ordinary) Weather Voice efni — SAFE/SARCASTIC og POOR/CAUTIOUS línum. **DANGEROUS/SERIOUS-efni á heima í sérstöku, sjálfstæðu safni** (`weatherSafetyMessages` eða sambærilegt, sjá §5.2) sem er yfirfarið með öðrum og strangari ritstjórnarferli en venjulegt efni — ekki bara annar `voice_level`-flokkur innan sama safns. Nákvæm lögun þess safns (hvort það deilir `comment_id`/`text_is`/`text_en` laginu, eða er algjörlega sér-hannað) er hluti af sömu framtíðar-ákvörðun og §5.7's safety-merki.

## 10. Ritstjórnarleg yfirferð (Editorial review checklist)

Fyrir hverja nýja línu, í þessari röð:

1. Keyrðu skriftarprófið (§3) — öll fimm spurningarnar. Ef svar við #5 er já fyrir eitthvað samhengi, útilokaðu línuna fyrir það samhengi (ekki línuna í heild, nema hún eigi ekkert annað gilt samhengi eftir).
2. Úthlutaðu `condition`/`mood` úr núverandi canonical Phase-1 samsvörun (sjá `weatherVoiceEngine.js`'s forgangsröð) — aldrei nýtt par sem vélin sjálf getur ekki framleitt.
3. Ákveddu fyrst hvaða ástandsflokkun (SAFE/POOR/DANGEROUS) samhengið sem línan er ætluð fyrir tilheyrir — þetta er ritstjórnarlegt mat um samhengið sjálft, ekki eitthvað sem línan sjálf sannar eða ákvarðar (sjá §5.7, §9's `voice_level`-athugasemd). Úthlutaðu svo `voice_level` sem passar við þá flokkun, sjálfstætt frá `mood` (§6).
4. Ef `voice_level = serious` (DANGEROUS): staðfestu að línan fer í `weatherSafetyMessages`-safnið (eða arftaka þess), aldrei í venjulega content library-ið, og að hún inniheldur enga kaldhæðni, engan punchline, ekkert sem gæti látið aðstæður virðast minna alvarlegar.
5. Farðu yfir IS/EN samræmi (§8) — sama persónuleiki, sömu öryggismörk, náttúruleg (ekki endilega orðrétt) aðlögun.
6. Vísaðu til þessa skjals (`docs/weather-voice/character-and-voice-bible.md`) í hvaða framtíðar-PR eða content-ferli sem bætir við nýjum línum — nýtt efni sem ekki er hægt að rekja til reglnanna hér er ekki gilt.

### Acceptance-coverage — issue #413's gátlisti á móti þessu skjali

| Issue-krafa | Fjallað í | Staða |
|---|---|---|
| Bakgrunnur og persónuleiki Tjalds skilgreindur | §1 | Skilgreint |
| Tone of voice skilgreint | §1, §2 | Skilgreint |
| SAFE → SARCASTIC regla skilgreind | §4 | Skilgreint |
| POOR → CAUTIOUS regla skilgreind | §4 | Skilgreint |
| DANGEROUS → SERIOUS regla skilgreind | §4, §5 | Skilgreint |
| Dangerous conditions geta ekki valið úr sarcastic content library | §5 | **Skilgreint sem harða regla — EKKI innleitt í runtime, sjá §11 (gap-listi)** |
| Tjaldur gerir grín að veðrinu, ekki notandanum | §2 | Skilgreint |
| Writing test skilgreint fyrir ný Weather Voice comment | §3 | Skilgreint |
| Character Bible notað sem grunnur að 100-comment library | §9, §10 | Skema og ferli skilgreind; sjálft 100-comment safnið er ekki hluti af þessu verkefni |
| IS og EN fylgja sama persónuleika; EN náttúruleg aðlögun | §8 | Skilgreint |

## 11. Núverandi útfærsla — status og gap-listi

**Ekkert í þessum kafla er innleitt af þessu skjali.** Þetta er heiðarlegur listi yfir bilið milli þess sem hér er *skilgreint* og þess sem raunverulega keyrir í dag, staðfest beint gegn núverandi kóða (2026-09-12):

1. **Ekkert `voice_level` (eða samsvarandi) reitur er til** í `weatherVoiceTypes.js`, `weatherVoiceContent.js`, `weatherVoiceSelector.js`, `is.js` eða `en.js`.
2. **Ekkert `weatherSafetyMessages` safn (eða sambærilegt) er til** — hvergi í kóðabasanum.
3. **`weatherVoiceSelector.js` hefur enga safety-precedence grein — en hún SÍAR sannarlega eftir `severity`, það er ekki hunsað.** `isEligible()` (línur 26–27) og `eligible`-síunin (lína 104) sía eftir `severityMin`/`severityMax` á hverri metadata-færslu. En þessi sía er eingöngu tjáningarstyrkleikasía (expressive-intensity gate) — hún hefur ekkert hugtak um SAFE/POOR/DANGEROUS og ekkert í henni kemur í veg fyrir að kaldhæðið efni sé "eligible" fyrir alvarlegustu (severity 3) stöðu sem vélin framleiðir. Í reynd þýðir þetta að öll fimm `wind_extreme_01`–`05` skilaboðin (kaldhæðin, `extreme_wind`/`wrecked`/`severity: 3`) eru að fullu eligible samkvæmt núverandi severity-sviðum og geta valist í dag — ekki vegna þess að severity sé hunsað, heldur vegna þess að engin AÐSKILIN öryggisflokkun er til sem gæti stöðvað þau, óháð severity-gildi þeirra.
4. **Ekkert safety-CLASSIFICATION-merki er tengt Weather Voice — en einn tölulegur þröskuldur ER raunverulega deildur, og það er ekki það sama.** `weatherVoiceRules.js` flytur inn `HAZARDS_V1` (lína 13) og setur `RAIN_HEAVY_MM = HAZARDS_V1.rainWarn` (lína 54); `weatherVoiceEngine.js` notar þennan þröskuld beint til að meta `heavy_rain`-condition (lína 102). Það er því RANGT að segja að þessi kerfi séu „algjörlega ótengd” — þau deila einu tölugildi. En það sem ER áfram satt: ENGIN safety-flokkunarNIÐURSTAÐA (SAFE/POOR/DANGEROUS, eða neitt sambærilegt) er reiknuð annars staðar í appinu (`HomeDecisionCard.jsx`, `hazardWindow.js`, `routeRisk.js`) og send inn í `evaluateWeatherVoice()` eða `selectWeatherVoiceComment()` — það sem er deilt er eitt tölugildi (mm-þröskuldur fyrir "heavy" rigningarmagn), ekki merki um hættuflokkun. Deiling á einu tölugildi jafngildir ekki því að safety-merki sé til.
5. **Ekkert unknown-state handling er til**, því ekkert safety-CLASSIFICATION-merki er til að hafa óþekkt ástand í fyrsta lagi (sjá lið 4 hér að ofan um muninn á því og deildum tölugildum).
6. **Samræmi 27 núverandi IS-lína (og tóma EN-listans) við SAFE/POOR/DANGEROUS-skemað er hvorki staðfest né hrakið — það er einfaldlega ósannreynt.** Þetta skjal fullyrðir **ekki** að þessar 27 línur uppfylli nýju öryggisreglurnar. Það fullyrðir heldur **ekki** að þær hafi þegar verið sannreynt brjóta þær — hvort tveggja krefst þess að `voice_level` og ástandsflokkun (§5.7) séu fyrst innleidd. Það sem ER staðfest: að fimm `wind_extreme_*` línurnar eru kaldhæðnar í dag er sönnun fyrir að selection-pipeline-ið hefur **enga leið** til að koma í veg fyrir að kaldhæðið efni birtist við alvarlegustu aðstæður sem vélin framleiðir í dag — þetta er sönnun fyrir ROUTING-GAPINU sjálfu, EKKI sönnun fyrir því að `extreme_wind` hafi þegar verið flokkað DANGEROUS (sjá §6: sú flokkun er enn óákveðin). Samhengisbundin endurskoðun 27-línu safnsins, framkvæmd eftir að ástandsflokkun er skilgreind, er nauðsynlegt sjálfstætt verkefni — ekki hluti af #413.

### Nauðsynleg framtíðar-acceptance-próf (áður en runtime safety-enforcement má teljast "gert")

- Þegar `voice_level`/safety-merki er innleitt: sannreyna að ekkert DANGEROUS-samhengi getur nokkurn tímann skilað texta úr venjulega content library-inu, óháð `severity`-gildi.
- Sannreyna að tómt safety-safn fyrir gefna condition/mood samsetningu leiðir **ekki** til fallback í venjulegt efni.
- Sannreyna að vantandi tungumál í safety-safninu leiðir **ekki** til fallback í venjulegt efni eða til annars tungumáls.
- Sannreyna að öll söfn í cooldown í safety-safninu leiðir **ekki** til fallback í venjulegt efni.
- Sannreyna að óþekkt/villuástand í safety-merkinu leiðir aldrei til að ástandið sé meðhöndlað eins og SAFE.
- Sannreyna að núverandi innri, `HAZARDS_V1`-drifnu hazard-tilkynningar (ekki að rugla saman við ytri opinberar viðvaranir, sjá §5.4) eru óbreyttar og virka nákvæmlega eins og fyrir þessa breytingu.

---

*Þetta skjal er samþykkt sem source-of-truth fyrir Tjaldur's persónuleika og raddar-reglur. Framtíðar Weather Voice content (100-comment library) og hvers kyns runtime-innleiðing á öryggis-reglunum í §5 eru sjálfstæð, síðari verkefni sem eiga að vísa til þessa skjals — ekki hluti af því sem #413 skilar.*

# Winter Route Advisor: Kanna gagnaveitur og skilgreina MVP

## Markmið

Staðfesta hvort raunhæft sé að byggja **Winter Route Advisor** fyrir Eltum Veðrið sem hjálpar notanda að svara spurningunni:

> „Er skynsamlegt að keyra þessa leið á þessum tíma og hvenær virðast bestu aðstæðurnar vera?“

Áður en farið er í þróun á scoring, leiðagreiningu eða UI þarf að kortleggja hvaða gögn eru í boði, hversu fersk þau eru, hvernig þau tengjast leiðum og hvort þau séu nægilega áreiðanleg til að byggja ákvörðunartæki ofan á þau.

Þessi miði er rannsóknar- og skilgreiningarmiði. Engin framleiðsluinnleiðing á að fara fram hér.

---

## Bakgrunnur

Eltum Veðrið stefnir að því að verða heilsárs ákvörðunartæki fyrir útivist og ferðalög á Íslandi.

Yfir veturinn er líklegt að eitt stærsta ákvörðunarvandamálið sé ekki eingöngu:

> „Hvernig verður veðrið?“

heldur:

> „Get ég farið þessa leið, hvernig verða aðstæður á leiðinni og hvenær er best að leggja af stað?“

Notendur þurfa í dag að skoða upplýsingar á fleiri en einum stað, til dæmis:

- Veðurspá
- Vind og vindhviður
- Úrkomu
- Hita
- Veðurviðvaranir
- Færð og ástand vega
- Lokanir
- Hálku eða snjó
- Mögulega skyggni

Winter Route Advisor ætti ekki aðeins að safna þessum upplýsingum saman heldur umbreyta þeim í einfalt ákvörðunarstuðning.

---

# Rannsóknarspurning

Getum við með tiltækum gögnum byggt áreiðanlega MVP útgáfu sem getur sagt:

1. hvernig aðstæður eru líklegar á ákveðinni akstursleið,
2. hvaða kaflar leiðarinnar gætu orðið erfiðastir,
3. hvort aðstæður breytist mikið yfir ferðatímann,
4. og hvort einhver tímagluggi næstu 24–48 klst virðist hagstæðari en annar?

---

# Scope

## 1. Kortleggja mögulegar gagnaveitur

Kanna sérstaklega gögn frá:

### Veðurstofa Íslands

Kanna aðgengi að:

- Vindhraða
- Vindhviðum
- Vindstefnu
- Hita
- Úrkomu
- Veðurlýsingu
- Skyggni
- Veðurviðvörunum
- Staðaspám
- Veðurstöðvum
- Mögulegum fjallastöðvum eða stöðvum nálægt mikilvægum vegköflum

Skrá fyrir hverja gagnategund:

- endpoint / þjónustu
- gagnasnið
- update frequency
- coverage
- takmarkanir
- hvort gögn séu athuganir eða spá

---

### Umferðin / Vegagerðin

Kanna hvort hægt sé að sækja sjálfvirkt:

- Færð
- Vegalokanir
- Hálku
- Snjó eða skafrenning
- Vindmælingar
- Vegahita
- Umferð
- Atvik
- Opnun/lokun fjallvega
- Staðsetningar mælistöðva

Sérstaklega þarf að kanna hvort til sé:

- API
- XML
- JSON
- WFS / GIS þjónusta
- önnur opin gagnaveita

---

### SafeTravel

Kanna hvort aðgengileg séu skipulögð gögn um:

- Travel alerts
- Lokanir
- Hættusvæði
- Sérstakar ferðaviðvaranir

Meta hvort þau séu hentug sem:

- sjálfvirk gagnaveita,
- viðbótargagn,
- eða aðeins tilvísun fyrir notanda.

---

### Open-Meteo

Kanna hvort núverandi gagnatenging Eltum Veðrið geti nýst fyrir:

- Wind speed
- Wind gusts
- Temperature
- Precipitation
- Snowfall
- Visibility
- Weather codes
- Forecast next 48h+

Meta hvort Open-Meteo eigi að vera:

- aðalspágjafi,
- fallback,
- eða viðbót við opinber íslensk gögn.

---

# 2. Kortleggja hvaða gögn þarf fyrir MVP

Flokka gögn í:

## Must have

Lágmarksupplýsingar sem þarf til að Winter Route Advisor geti gefið gagnlega niðurstöðu.

Líklegir kandidatar:

- Leið
- Tími ferðar
- Vindur
- Vindhviður
- Hiti
- Úrkoma
- Færð
- Vegalokanir
- Veðurviðvaranir

## Nice to have

Gögn sem gætu bætt niðurstöðuna en eru ekki nauðsynleg í fyrstu útgáfu.

Dæmi:

- Skyggni
- Vegahiti
- Snjódýpt
- Umferð
- Myndavélar
- Historical data
- Snjókoma síðustu klukkustundir

---

# 3. Staðsetning gagna gagnvart leið

Kanna hvernig best sé að tengja veður- og vegagögn við akstursleið.

Dæmi:

```text
Reykjavík
   ↓
Sandskeið
   ↓
Hellisheiði
   ↓
Hveragerði
   ↓
Selfoss
   ↓
Hella
   ↓
Vík

<html>
<body>
<!--StartFragment--><div><div><div><div><div><div><div><div><div><div><div><div><div><div><div><div><div><pre dir="ltr"><code># Winter Route Advisor: Kanna gagnaveitur og skilgreina MVP

## Markmið

Staðfesta hvort raunhæft sé að byggja **Winter Route Advisor** fyrir Eltum Veðrið sem hjálpar notanda að svara spurningunni:

&gt; „Er skynsamlegt að keyra þessa leið á þessum tíma og hvenær virðast bestu aðstæðurnar vera?“

Áður en farið er í þróun á scoring, leiðagreiningu eða UI þarf að kortleggja hvaða gögn eru í boði, hversu fersk þau eru, hvernig þau tengjast leiðum og hvort þau séu nægilega áreiðanleg til að byggja ákvörðunartæki ofan á þau.

Þessi miði er rannsóknar- og skilgreiningarmiði. Engin framleiðsluinnleiðing á að fara fram hér.

---

## Bakgrunnur

Eltum Veðrið stefnir að því að verða heilsárs ákvörðunartæki fyrir útivist og ferðalög á Íslandi.

Yfir veturinn er líklegt að eitt stærsta ákvörðunarvandamálið sé ekki eingöngu:

&gt; „Hvernig verður veðrið?“

heldur:

&gt; „Get ég farið þessa leið, hvernig verða aðstæður á leiðinni og hvenær er best að leggja af stað?“

Notendur þurfa í dag að skoða upplýsingar á fleiri en einum stað, til dæmis:

- Veðurspá
- Vind og vindhviður
- Úrkomu
- Hita
- Veðurviðvaranir
- Færð og ástand vega
- Lokanir
- Hálku eða snjó
- Mögulega skyggni

Winter Route Advisor ætti ekki aðeins að safna þessum upplýsingum saman heldur umbreyta þeim í einfalt ákvörðunarstuðning.

---

# Rannsóknarspurning

Getum við með tiltækum gögnum byggt áreiðanlega MVP útgáfu sem getur sagt:

1. hvernig aðstæður eru líklegar á ákveðinni akstursleið,
2. hvaða kaflar leiðarinnar gætu orðið erfiðastir,
3. hvort aðstæður breytist mikið yfir ferðatímann,
4. og hvort einhver tímagluggi næstu 24–48 klst virðist hagstæðari en annar?

---

# Scope

## 1. Kortleggja mögulegar gagnaveitur

Kanna sérstaklega gögn frá:

### Veðurstofa Íslands

Kanna aðgengi að:

- Vindhraða
- Vindhviðum
- Vindstefnu
- Hita
- Úrkomu
- Veðurlýsingu
- Skyggni
- Veðurviðvörunum
- Staðaspám
- Veðurstöðvum
- Mögulegum fjallastöðvum eða stöðvum nálægt mikilvægum vegköflum

Skrá fyrir hverja gagnategund:

- endpoint / þjónustu
- gagnasnið
- update frequency
- coverage
- takmarkanir
- hvort gögn séu athuganir eða spá

---

### Umferðin / Vegagerðin

Kanna hvort hægt sé að sækja sjálfvirkt:

- Færð
- Vegalokanir
- Hálku
- Snjó eða skafrenning
- Vindmælingar
- Vegahita
- Umferð
- Atvik
- Opnun/lokun fjallvega
- Staðsetningar mælistöðva

Sérstaklega þarf að kanna hvort til sé:

- API
- XML
- JSON
- WFS / GIS þjónusta
- önnur opin gagnaveita

---

### SafeTravel

Kanna hvort aðgengileg séu skipulögð gögn um:

- Travel alerts
- Lokanir
- Hættusvæði
- Sérstakar ferðaviðvaranir

Meta hvort þau séu hentug sem:

- sjálfvirk gagnaveita,
- viðbótargagn,
- eða aðeins tilvísun fyrir notanda.

---

### Open-Meteo

Kanna hvort núverandi gagnatenging Eltum Veðrið geti nýst fyrir:

- Wind speed
- Wind gusts
- Temperature
- Precipitation
- Snowfall
- Visibility
- Weather codes
- Forecast next 48h+

Meta hvort Open-Meteo eigi að vera:

- aðalspágjafi,
- fallback,
- eða viðbót við opinber íslensk gögn.

---

# 2. Kortleggja hvaða gögn þarf fyrir MVP

Flokka gögn í:

## Must have

Lágmarksupplýsingar sem þarf til að Winter Route Advisor geti gefið gagnlega niðurstöðu.

Líklegir kandidatar:

- Leið
- Tími ferðar
- Vindur
- Vindhviður
- Hiti
- Úrkoma
- Færð
- Vegalokanir
- Veðurviðvaranir

## Nice to have

Gögn sem gætu bætt niðurstöðuna en eru ekki nauðsynleg í fyrstu útgáfu.

Dæmi:

- Skyggni
- Vegahiti
- Snjódýpt
- Umferð
- Myndavélar
- Historical data
- Snjókoma síðustu klukkustundir

---

# 3. Staðsetning gagna gagnvart leið

Kanna hvernig best sé að tengja veður- og vegagögn við akstursleið.

Dæmi:

```text
Reykjavík
   ↓
Sandskeið
   ↓
Hellisheiði
   ↓
Hveragerði
   ↓
Selfoss
   ↓
Hella
   ↓
Vík</code></pre></div><p><span>Kanna hvort:</span></p><ul><li><span>gögn séu punktagögn frá stöðvum,</span></li><li><span>gögn séu bundin við vegkafla,</span></li><li><span>við þurfum að tengja mælistöð við næsta route segment,</span></li><li><span>eða hvort spágögn megi sækja með latitude/longitude fyrir ákveðin checkpoints.</span></li></ul><hr><h1><span>4. Prófunarleiðir</span></h1><p><span>Nota nokkrar raunhæfar leiðir til að meta coverage.</span></p><h2><span>Route A</span></h2><p><strong><span>Reykjavík → Vík</span></strong></p><p><span>Áhugaverð vegna meðal annars:</span></p><ul><li><span>Hellisheiðar</span></li><li><span>Suðurlandsvegar</span></li><li><span>vinds</span></li><li><span>hálku</span></li><li><span>úrkomu</span></li></ul><h2><span>Route B</span></h2><p><strong><span>Reykjavík → Akureyri</span></strong></p><p><span>Áhugaverð vegna:</span></p><ul><li><span>langrar ferðaleiðar</span></li><li><span>Holtavörðuheiðar</span></li><li><span>mismunandi veðursvæða</span></li><li><span>mögulegra mikilla breytinga yfir ferðatímann</span></li></ul><h2><span>Route C</span></h2><p><strong><span>Reykjavík → Borgarnes</span></strong></p><p><span>Nota sem einfaldara baseline-test.</span></p><hr><h1><span>5. Skilgreina MVP output</span></h1><p><span>Rannsóknin skal enda með tillögu að einfaldri fyrstu niðurstöðu fyrir notanda.</span></p><p><span>Dæmi:</span></p><div><pre dir="ltr"><code>Reykjavík → Vík
Laugardagur 10:00

Aðstæður: Varúð

Erfiðasti kafli:
Hellisheiði

Helsta ástæða:
Vindhviður 18–22 m/s og snjókoma

Betri ferðagluggi:
13:00–16:00

Gögn uppfærð:
09:15</code></pre></div><p><span>Athugið:</span></p><p><span>Þetta er aðeins dæmi um UX-output og á ekki að festa scoring eða orðalag á þessu stigi.</span></p><hr><h1><span>6. Öryggi og ábyrgð</span></h1><p><span>Winter Route Advisor má ekki gefa til kynna meiri vissu en gögnin styðja.</span></p><p><span>Kanna þarf hvernig aðgreina:</span></p><ul><li><span>opinberar viðvaranir,</span></li><li><span>staðfestar lokanir,</span></li><li><span>raunmælingar,</span></li><li><span>veðurspá,</span></li><li><span>og útreiknað mat Eltum Veðrið.</span></li></ul><p><span>MVP þarf að geta sagt skýrt hvaðan niðurstaðan kemur.</span></p><p><span>Dæmi:</span></p><blockquote><p><span>„Mat byggt á veðurspá og nýjustu upplýsingum um færð. Athugaðu alltaf opinberar upplýsingar áður en lagt er af stað.“</span></p></blockquote><p><span>Nákvæmt orðalag verður skilgreint síðar.</span></p><hr><h1><span>Deliverable</span></h1><p><span>Við lok miðans skal liggja fyrir stutt tæknileg samantekt með:</span></p><h2><span>Gagnaveitur</span></h2><p><span>Fyrir hverja gagnaveitu:</span></p><div><div><div>
Gagnaveita | Gögn | Format | Refresh | Coverage | Aðgengi | Athugasemd
-- | -- | -- | -- | -- | -- | --
Veðurstofa | TBD | TBD | TBD | TBD | TBD |  
Umferðin/Vegagerðin | TBD | TBD | TBD | TBD | TBD |  
SafeTravel | TBD | TBD | TBD | TBD | TBD |  
Open-Meteo | TBD | TBD | TBD | TBD | TBD |  

</div></div></div><h2><span>MVP fields</span></h2><p><span>Skýr listi yfir:</span></p><ul><li><span>Must have</span></li><li><span>Nice to have</span></li><li><span>Ekki tiltækt</span></li></ul><h2><span>Route mapping</span></h2><p><span>Tillaga að því hvernig:</span></p><div><pre dir="ltr"><code>Route
→ segments/checkpoints
→ weather data
→ road data</code></pre></div><p><span>verður tengt saman.</span></p><h2><span>Go / No-Go niðurstaða</span></h2><p><span>Í lok rannsóknar þarf að svara:</span></p><h3><span>GO</span></h3><p><span>Gögnin eru nægilega góð til að halda áfram með MVP.</span></p><p><span>eða</span></p><h3><span>PARTIAL</span></h3><p><span>MVP er mögulegt en þarf einfaldara scope.</span></p><p><span>eða</span></p><h3><span>NO-GO</span></h3><p><span>Gögnin eru ekki nægilega áreiðanleg eða aðgengileg til að réttlæta þróun að svo stöddu.</span></p><hr><h1><span>Acceptance Criteria</span></h1><ul><li><input type="checkbox" disabled=""><span>Veðurstofa Íslands hefur verið könnuð sem gagnaveita</span></li><li><input type="checkbox" disabled=""><span>Umferðin/Vegagerðin hefur verið könnuð sem gagnaveita</span></li><li><input type="checkbox" disabled=""><span>SafeTravel hefur verið kannað</span></li><li><input type="checkbox" disabled=""><span>Open-Meteo hefur verið metið fyrir þetta use case</span></li><li><input type="checkbox" disabled=""><span>Tiltæk fields frá hverri þjónustu hafa verið skráð</span></li><li><input type="checkbox" disabled=""><span>Refresh frequency hefur verið staðfest þar sem hægt er</span></li><li><input type="checkbox" disabled=""><span>Coverage hefur verið metið fyrir a.m.k. 3 prófunarleiðir</span></li><li><input type="checkbox" disabled=""><span>Greint hefur verið hvaða gögn eru Must have og Nice to have</span></li><li><input type="checkbox" disabled=""><span>Tillaga liggur fyrir um route → checkpoint/segment mapping</span></li><li><input type="checkbox" disabled=""><span>Tillaga liggur fyrir að MVP outputi</span></li><li><input type="checkbox" disabled=""><span>Þekktar takmarkanir og áhættur hafa verið skráðar</span></li><li><input type="checkbox" disabled=""><span>GO / PARTIAL / NO-GO niðurstaða liggur fyrir</span></li></ul><hr><h1><span>Out of scope</span></h1><p><span>Ekki gera í þessum miða:</span></p><ul><li><span>Route scoring</span></li><li><span>Risk scoring</span></li><li><span>Best departure algorithm</span></li><li><span>UI implementation</span></li><li><span>Map UI</span></li><li><span>Notifications</span></li><li><span>Saved trips</span></li><li><span>Pro paywall</span></li><li><span>Northern Lights integration</span></li><li><span>Production database schema</span></li><li><span>Full route engine</span></li></ul><p><span>Þessi atriði fá sér miða ef niðurstaða þessa rannsóknarmiða er jákvæð.</span></p><hr><h1><span>Næsti miði</span></h1><p><span>Ef niðurstaðan er GO eða PARTIAL:</span></p><p><strong><span>Winter Route Advisor: Gagnalíkan fyrir leiðir, checkpoints og veðurkafla</span></strong></p><p><span>Þar verður skilgreint hvernig akstursleið er brotin niður og hvernig veður- og vegagögn eru tengd við hana.</span></p><div><pre dir="ltr"><code>
Ég myndi setja þennan **fyrstan og merkja hann sem `research` / `spike`**, ekki feature. Þá er mjög skýrt fyrir Jonesy, Claude Code og okkur sjálf að markmiðið er að koma til baka með **staðfest gögn og Go/No-Go ákvörðun**, ekki byrja að smíða hálft vetrarkerfið af eintómum eldmóði. 😄</code></pre></div></div></div></div><span></span></div></div><div><div><span></span><span></span><span> </span><span> </span><span></span>   </div></div></div></div></div></div></div></div></div></div></div></div></div><div><div><div><div><div><div></div></div></div></div></div></div><!--EndFragment-->
</body>
</html

---

## Expert Support — fundur 2026-10-14

Heimild: Expert Support fundur með Guðrúnu Nínu Petersen hjá Veðurstofu Íslands, 14. október 2026; fundarúrdráttur afhentur af eiganda. Athugasemdir eru endursagnir úr úrdrætti, ekki orðréttar tilvitnanir. Fundurinn er ekki formleg staðfesting Veðurstofunnar á líkani Eltum Veðrið.

### Tengd almenn gagnaveiturannsókn

Almenn rannsókn fyrir ALLT Eltum Veðrið er https://github.com/robertmarvin72/icelandic-weather/issues/450 (#450, P1). Endurnýta staðfestar niðurstöður hennar um Open-Meteo/DMI/IG/íslensk líkön og athuganir; ekki tvöfalda þá rannsókn hér.

### Athugasemdir úr fundi

42:40–48:14: gagnauppruni, athuganir vs spá, fyrstu þrír dagar, hæðarmunur og staðsetning reiknipunkta.

### Okkar vetrarráðgjafa-sértæka viðbót

Meta hvernig þessi gögn tengjast leiðarköflum/checkpoints, fjallvegum/fjörðum, ferðatíma og gagnadekkingu næstu 24–48 klst. Aðgreina mælingar/spá/opinberar viðvaranir/vegaupplýsingar/eigin mat. Fyrstu þrír dagar og IG eru rannsóknarspurningar, ekki ný provider-regla.

### Acceptance criteria og prófun

- Gagnaveitufylki og GO/PARTIAL/NO-GO endurnýta heimildir úr #450.
- Route-sértækar takmarkanir á stöðvafjarlægð, hæð, uppfærslutíma og úreldingu skráðar.
- Read-only dæmi á núverandi þremur prófunarleiðum í #429, þ.m.t. vantar/úrelt gögn, sýna hvort niðurstaða nýtist leiðargreiningu.
- Engin route/risk scoring eða framleiðsluinnleiðing í þessari rannsókn.

P0 / In Progress haldast; fyrra umfang og rannsóknarreglur miðans standa. Engar scoring-, veðurfræðilegar þröskulda- eða gagnagjafabreytingar án rannsóknar og sérstakrar samþykktrar útfærslu. Þessi miði heimilar ekki sjálfkrafa provider-skipti eða nýtt áhættulíkan.

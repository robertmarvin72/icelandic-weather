# Eigandakröfur — landsdekkandi Winter Route, 2026-11-14

Heimild: innsendur texti eiganda. Talningarleiðrétting samþykkt í samtali: „Já, allir 56 staðirnir“. Öll 56 heitin varðveitt orðrétt; aðeins fjöldinn 55 leiðréttur í 56 hér. Mynd úr samtali er sjónrænt viðmið eingöngu. Þetta er vörukrafa; framkvæmd fylgir samþykktu prompti og CURRENT.

# Winter Route: Skýra og festa staðaval fyrir landsþekju

## Verkefni

Ripley desktop og Jonesy skulu samræma núverandi Winter Route-miða og útfærslu við kröfurnar hér að neðan.

Byrjið á að skoða núverandi kóða, viðeigandi miða og samþykkt verkefnisgögn. Greinið hvað er þegar til staðar og hvað vantar. Fylgið síðan venjulegu prompt-, innleiðingar- og review-ferli verkefnisins.

Ekki bæta við stöðum, skipta þeim út eða fækka þeim án ákvörðunar verkefniseiganda.

## Það sem við erum að byggja

Notandi velur:
1. Upphafsstað í „Frá“.
2. Áfangastað í „Til“.
3. Studda leið milli staðanna, ef fleiri en ein er í boði.
4. Tíma veðurspár.

Kerfið sýnir valda akstursleið, veðurpunkta og tengdar færðartilkynningar.

Staðavalið nær yfir allt landið, þar með talið Vestfirði, Snæfellsnes og Reykjanes. Það er ekki takmarkað við Hringveginn.

Þessi útgáfa er A-til-B leiðaval. Fjöláfangaleiðir og hringferðir með viðkomustöðum eru utan umfangs.

## Lokaður listi veljanlegra staða

Sami listi skal vera í Frá og Til. Alls 56 staðir.

### Höfuðborgarsvæði
- Reykjavík
- Kópavogur
- Hafnarfjörður
- Mosfellsbær

### Reykjanes
- Keflavík
- Keflavíkurflugvöllur (KEF)
- Grindavík

### Vesturland og Snæfellsnes
- Akranes
- Borgarnes
- Stykkishólmur
- Grundarfjörður
- Ólafsvík
- Búðardalur

### Vestfirðir
- Reykhólar
- Patreksfjörður
- Tálknafjörður
- Bíldudalur
- Þingeyri
- Ísafjörður
- Bolungarvík
- Súðavík
- Hólmavík
- Drangsnes

### Norðurland vestra
- Hvammstangi
- Blönduós
- Skagaströnd
- Sauðárkrókur
- Varmahlíð
- Siglufjörður

### Norðurland eystra
- Ólafsfjörður
- Dalvík
- Akureyri
- Húsavík
- Reykjahlíð (Mývatn)
- Kópasker
- Raufarhöfn
- Þórshöfn

### Austurland
- Vopnafjörður
- Egilsstaðir
- Seyðisfjörður
- Neskaupstaður
- Eskifjörður
- Reyðarfjörður
- Fáskrúðsfjörður
- Djúpivogur

### Suðurland
- Höfn
- Skaftafell
- Kirkjubæjarklaustur
- Vík
- Hvolsvöllur
- Hella
- Selfoss
- Hveragerði
- Þorlákshöfn
- Flúðir
- Laugarvatn

## Þrjú aðskilin gagnahugtök

### 1. Veljanlegir staðir
Aðeins staðirnir 56 hér að ofan eru veljanlegir sem upphaf og endir.

Hver staður þarf stöðugt auðkenni, birtingarheiti, staðfest hnit og skilgreinda tengingu við vegakerfið.

Keflavík og Keflavíkurflugvöllur eru tveir aðskildir staðir.

Leitarheiti og samheiti mega vísa á sama stað, en mega ekki búa til nýjan stað.

### 2. Veðurpunktar
Veðurpunktar birtast sjálfkrafa eftir valinni leið. Þeir geta verið á heiðum, fjallvegum og öðrum mikilvægum köflum.

Þeir eru ekki sjálfkrafa veljanlegir í Frá/Til.

Ekki takmarka veðurspána við bæina sem notandi velur.

### 3. Færðarkaflar og leiðarhnútar
Þetta eru innri gögn sem tengja leiðina við vegi og færðarupplýsingar.

Innri leiðarhnútar mega vera fleiri en 56. Þeir eiga ekki að birtast sem viðbótarstaðir í staðavalinu.

Ekki rugla þessum þremur hugtökum saman.

## Leiðir og þekja

- Leið skal fylgja raunverulegum, studdum vegtengingum.
- Ekki teikna beina línu milli bæja og kalla hana akstursleið.
- Ekki gera ráð fyrir að Hringvegurinn einn tengi alla staðina.
- Ekki búa til sérskráða leið fyrir hvert mögulegt staðapar ef hægt er að samsetja leiðir úr sameiginlegu leiðakerfi.
- Engin krafa er um að sýna allar hugsanlegar leiðir. Sýna aðeins studda og sannreynda valkosti.
- Ekki nota hálendisvegi, F-vegi eða ferjur sem sjálfgefna tengingu í þessari útgáfu.
- Lokanir skulu birtast skýrt. Ekki fela lokaða kafla eða búa sjálfkrafa til hjáleið.
- Veljanlegur staður jafngildir ekki staðfestri gagnaþekju alla leiðina.

Markmiðið er að allir staðirnir 56 séu studdir. Ef það tekst ekki með núverandi gögnum skal skrá nákvæma hindrun, ekki fjarlægja staðinn hljóðlega eða þykjast hafa fulla þekju.

Óstudd tenging þarf skýr skilaboð í viðmóti.

## Kort og UI

- Frá/Til eru leitarbærir reitir með stöðunum 56.
- Sýna víxla-hnapp og „Sýna leið“.
- Kort og niðurstöðulisti sýna sömu völdu leið.
- Allir studdir staðir eiga að vera finnanlegir í leit, óháð því hvaða örnefni sjást á kortinu.
- Þegar allt landið sést má fækka sýnilegum örnefnum til að halda kortinu læsilegu.
- Fleiri örnefni birtast við aðdrátt.
- Hönnunarmyndir úr samtalinu eru aðeins sjónræn viðmið. Þær eru ekki heimild fyrir hnitum, vegtengingum, þekju eða staðalista.
- Myndin sem sýnir Reykjavík → Ísafjörður sýnir aðeins hluta staðanna. Það er ekki heimild til að fækka stöðum.

## Afmörkun MVP

Markmiðið er að geta valið Frá/Til og séð aðstæður á studdri leið.

Ekki bæta við:
- Almennri heimilisfangaleit.
- Frjálsu punktavali á korti.
- Fjöláfangaleiðum eða viðkomustöðum.
- ETA eða komutímum á veðurpunkta.
- Brottfararráðleggingum eða öryggisskori.
- Nýjum stöðum utan listans.

## Fyrsta afhending Ripley desktop

Skilið stuttri stöðugreiningu áður en umfangsmikil innleiðing hefst:

1. Hvar staðaval og leiðargögn eru skilgreind núna.
2. Hvaða staðir af listanum eru þegar studdir.
3. Hvaða vegtengingar eða gögn vantar.
4. Hvernig landsþekja verður útfærð með endurnýtanlegum leiðarköflum.
5. Hvaða eldri kröfur um „eingöngu Hringveginn“ þarf að uppfæra.

Ekki halda áfram með rangar eldri umfangsforsendur.

## Review Jonesy

Staðfestið sérstaklega:

- Að staðalistinn sé nákvæmlega þessi 56 staðir, án viðbóta eða brottfalls.
- Að Frá og Til noti sömu staðaskrá.
- Að innri veðurpunktar og leiðarhnútar fjölgi ekki veljanlegum stöðum.
- Að leiðir séu tengdar raunverulegum vegum.
- Að Vestfirðir, Snæfellsnes og Reykjanes séu hluti af umfangi.
- Að skortur á leiðar- eða veðurgögnum sé sýnilegur.
- Að hönnunarmynd sé ekki notuð sem landfræðileg gagnalind.
- Að prófuð séu dæmi innan landshluta og milli landshluta, auk víxlaðrar akstursstefnu.

Ef hindrun kemur upp skal lýsa henni nákvæmlega og leggja fram afmarkaða lausn. Ekki endurskilgreina vöruna til að komast hjá hindruninni.
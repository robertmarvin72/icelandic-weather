# #492 — beint leiðaval og sýnilegar tilkynningar

Heimild: https://github.com/robertmarvin72/icelandic-weather/issues/492, lesið 2026-11-25. Orðrétt nýjustu tvær viðbætur sem eigandi velur saman. Nýjasta tilkynningakrafa gengur framar eldri samantekt/földum tilkynningum. Þetta er ekki framkvæmdarheimild.

## Viðbót 25. nóvember 2026: Fjarlægja „Fastar veðurleiðir“ úr notendaviðmóti

### Markmið

Eitt skýrt leiðavalsflæði: **Frá → Til → Sýna leið**. Notandi þarf ekki að velja milli tveggja viðmótshama til að skoða leið.

### Kröfur og afmörkun

- Fjarlægja bæði hamflipann **„Fastar veðurleiðir“** og óþarfan fylgiflipa **„Velja staði“**. Sýna Frá/Til-valið beint við opnun síðunnar, í síma og tölvu og á IS/EN.
- Þetta fjarlægir hamvalið, ekki leiðarvalkosti innan valins staðapars. Halda vali á studdum stuttum/löngum leiðum og öðrum fyrirliggjandi leiðarvalkostum þar sem við á.
- Áður en fasti hamurinn hverfur skal bera núverandi föstu leiðir saman við Frá/Til-valið og staðfesta að sömu studdu leiðir/valkostir séu aðgengilegir þar. Ef vantar tengingu skal leysa hana með endurnýtingu fyrirliggjandi samþykktra gagna áður en flipinn er fjarlægður. Ekki fela þekjutap.
- Varðveita undirliggjandi fastar leiðaskilgreiningar, endapunkta og prófunargögn þar sem þau eru enn notuð. Þessi viðbót er ekki heimild til almennrar hreinsunar eða eyðingar á leiðakóða.
- Athuga eldri slóðir/tengla sem velja fasta leið. Þar sem hægt er skal færa slíkt val yfir í samsvarandi Frá/Til og leiðarvalkost án tapaðrar merkingar. Ef samsvörun vantar skal birta skýr skilaboð, ekki sýna aðra leið sem sömu niðurstöðu.
- Varðveita valda leið, spátíma og tungumál í núverandi flæði samkvæmt öðrum kröfum #492.
- Ekki bæta við „Vinsælum leiðum“, nýjum flýtivölum, nýjum stöðum eða aukinni leiðaþekju í þessari viðbót.

### Samþykktarskilyrði

- [ ] „Fastar veðurleiðir“ og „Velja staði“ birtast ekki lengur sem hamflipar, hvorki á IS né EN.
- [ ] Frá/Til, víxla-hnappur og „Sýna leið“ eru sýnileg beint í síma og tölvu.
- [ ] Fyrirliggjandi studdar fastar leiðir og nauðsynlegir leiðarvalkostir eru aðgengilegir með Frá/Til; samanburður þeirra fylgir yfirferð.
- [ ] Val milli leiðarvalkosta fyrir sama staðapar virkar áfram.
- [ ] Eldri fastleiðatenglar eru meðhöndlaðir án rangrar eða hljóðlegrar breytingar á leið.
- [ ] Undirliggjandi skilgreiningum og prófunargögnum sem enn eru notuð hefur ekki verið eytt vegna þess að hamflipinn hverfur.
- [ ] Staðfest í síma og tölvu á IS/EN að staðaval, tímasleði og tungumálaval virki áfram.


## Viðbót 25. nóvember 2026: Sýna tilkynningar beint, án tvítekninga

Taka þessa úrbót í sömu afmörkuðu innleiðingarlotu og að fjarlægja „Fastar veðurleiðir“. Fylgja áfram núverandi prompt- og review-ferli verkefnisins.

Þessi viðbót gengur framar eldri fyrirmælum um að birta aðeins samantekt tilkynninga með opnanlegum ítarlista. Markmiðið er að minnka endurtekningar án þess að fela efni tilkynninganna.

### Framsetning

- Sýna sjálfgefið einn þéttan lista yfir kafla með tilkynningum, lokunum eða atriðum sem krefjast sýnilegrar skýringar, svo sem gagnaskorti eða úreltum gögnum.
- Hver lína/kort sýnir **kaflaheiti, færð og sjálft efni tilkynninga**, til dæmis „Hálkublettir“ og „Vegavinna · Holur í vegi“.
- Nota tölvutöflu eða samstilltar línur í tölvu og þétt kort/línur í síma. Texti má vefjast án þess að efni klippist.
- Fjarlægja efri lista sem endurtekur aðeins kaflaheiti og stöðumerki án efnis tilkynninga.
- Fjarlægja „Sjá tilkynningar“ þar sem efnið er þegar sýnilegt.
- Halda einni skýrri opnanlegri aðgerð **„Sjá alla vegkafla“** fyrir heildaryfirlit, lokað sjálfgefið. Ekki hafa tvær aðgerðir sem opna sama yfirlit.
- Þegar heildaryfirlit opnast skal sýna kaflana þar einu sinni í akstursröð og skipta út þrengri sjálfgefna listanum meðan það er opið. Ekki birta sömu kafla tvisvar samtímis.
- Varðveita aðskilda merkingu yfirborðsfærðar og tilkynninga og allar aðgreindar tilkynningar á sama kafla. Ekki endurtaka almennt „Tilkynning í gildi“ við hverja línu ef það bætir engum upplýsingum við.
- Fjöldi í fyrirsögn samsvari því sem er talið. Ekki kalla kafla sem hafa eingöngu óþekkta stöðu „kafla með tilkynningum“ nema raunveruleg tilkynning fylgi.

### Skýrar stöðumerkingar

Á skjáskotinu birtist „Óþekkt ástand“ við hlið „Hálkublettir“. Skoða þarf hvaða eigind merkið lýsir:
- Ef yfirborðsfærð er þekkt má ekki kalla hana óþekkta vegna þess að annar reitur er óþekktur.
- Ef óvissa á við aðra eigind skal nefna hana sérstaklega og varðveita skýringuna.
- Ekki fela raunverulegan gagnaskort eða breyta gögnum til að losna við mótsögn. Endurnýta fyrirliggjandi gögn og leiðrétta framsetningu/merkingu þeirra.

### Samþykktarskilyrði

- [ ] Efni gildra tilkynninga er sýnilegt við fyrstu birtingu án aukasmells.
- [ ] Kaflaheiti, færð og tilkynningar sjást saman í þéttri og læsilegri uppsetningu í síma og tölvu.
- [ ] Enginn aðskilinn efri kaflalisti eða „Sjá tilkynningar“ tvítekur sýnilega upplýsingalistann.
- [ ] „Sjá alla vegkafla“ er eina aðgerðin fyrir heildarlistann og hann er lokaður sjálfgefið.
- [ ] Opnun heildarlistans tvítekur ekki kafla samtímis í öðrum lista; lokun endurheimtir sjálfgefna sýn.
- [ ] Lokanir, óþekkt staða, gagnaskortur og úrelt gögn haldast sýnileg og skýrt útskýrð.
- [ ] Þekkt yfirborðsfærð er ekki merkt „Óþekkt ástand“ vegna óþekktrar annarrar eigindar.
- [ ] Teljari tilkynningakafla passar við raunveruleg gögn og texti er réttur á IS og EN.
- [ ] Núverandi tímasleði, tungumálaval og Frá/Til-flæði virka áfram.
- [ ] Yfirferð nær yfir engar/eina/margar tilkynningar, margar tilkynningar á sama kafla og þekkta færð samhliða óþekktri annarri eigind.

Engar nýjar gagnaveitur, leiðarútreikningar, áhættuflokkar eða aukin leiðaþekja fylgja þessari viðbót.


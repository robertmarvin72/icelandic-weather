# Heimild næstu UI/UX-lotu #492

Lesið af lifandi GitHub 2026-11-24: https://github.com/robertmarvin72/icelandic-weather/issues/492

Eigandi bað um þessa viðbót fyrst. Þrjú eldri lokaatriði bíða. Þetta er kröfuheimild, ekki framkvæmdarheimild.

## UI/UX-úrbætur eftir yfirferð 24. nóvember 2026

Byggt á skjáskotum af Selfoss → Egilsstaðir eftir breytingar. Þessi viðbót skýrir framsetningarkröfur innan núverandi umfangs. Eldri kortakröfur haldast. Viðbótin felur ekki í sér nýja kortavirkni, leiðarútreikninga, staði, gagnatengingar eða breytingar á veðurlíkani.

### 1. Einn leitarbær reitur fyrir hvorn stað

- Sameina núverandi aðskilda leit og fellilista í einn leitarbæran Frá-reit og einn Til-reit.
- Sýnilegt heiti og valinn staður séu skýr; texti má ekki klippast vegna óþarflega þröngrar uppsetningar.
- Setja víxla-hnapp á milli reitanna í tölvu og á skýran stað í síma. Aðgengisheiti: „Víxla upphafsstað og áfangastað“.
- Varðveita „Sýna leið“ og núverandi hegðun gagnasóknar. Aðgreina val í vinnslu frá þeirri leið sem niðurstaðan á við.

### 2. Þétt færðarsamantekt og engar óþarfa tvítekningar

- Birta stutta samantekt, til dæmis „3 kaflar með vegavinnu“, með aðgerðum til að skoða tilkynningar og alla vegkafla.
- Heildarlisti vegkafla sé lokaður sjálfgefið.
- Ekki sýna full kort sömu tilkynningakafla bæði í samantekt og heildarlista. Nota samantekt sem tengist einum ítarlista.
- Ekki endurtaka „Greiðfært“ bæði sem stöðumerki og sams konar texta innan sama korts.
- Aðgreina áfram yfirborðsfærð frá vegavinnu og öðrum tilkynningum.
- Lokanir, gagnaskortur, óþekkt staða og úrelt gögn séu sýnileg í aðalsýn án þess að opna heildarlista. Aðrar tilkynningar séu aðgengilegar úr samantekt.
- Ekki láta stutta samantekt gefa til kynna að öll leiðin sé greiðfær eða örugg.

### 3. Veðurgildi í samstilltum dálkum

- Í tölvu: dálkar fyrir Stað, Veður, Hita, Vind, Hviður og Úrkomu.
- Gildi sömu breytu raðist lóðrétt í sama dálki; heiti breyta og einingar þurfa ekki að endurtakast sem texti við hverja tölu.
- Í síma: læsileg uppsetning með skýrum heitum og einingum, án þess að fela gildi eða krefjast þess að notandi þysji inn.
- Stækka og samræma veðurtákn svo þau séu auðgreinanleg. Tákn hafi aðgengilega lýsingu þar sem þau miðla upplýsingum.
- Varðveita skilgreiningar á tímabilum hviða og úrkomu og tengja þær við viðeigandi dálka/gildi.
- Engin ný litaviðmið, veðuráhættuflokkun eða breyting á gildum fylgir þessari úrbót.

### 4. Styttri heiti veðurpunkta

- Stytta endurtekið „Leiðarpunktur nærri …“ í „Nærri …“, til dæmis „Nærri Hvolsvelli“.
- Birta eina sameiginlega skýringu um að hér séu spápunktar við leiðina.
- Ekki breyta nálægum spápunkti í nákvæman bæjarpunkt með orðalagi. Hnit, auðkenni og merking staðsetningar haldist.

### 5. Einfaldari skýringar og tímaupplýsingar

- Sýna tíma veðurspár og tíma færðargagna skýrt í aðalsýn. Aðgreina gildistíma spár, útgáfutíma heimildar og sóknartíma; ekki gefa þeim sama heiti.
- Færa innri tæknilýsingar, svo sem „aldur gagna í skyndiminni þegar svarið var útbúið“, og ítarlega tímastimpla undir „Um gögnin“.
- Engin breyting á útreikningi eða greiningu á aldri gagna. Úrelt gögn og villur séu áfram áberandi.
- Varðveita þekjuupplýsingar, þar á meðal stærsta bil milli veðurpunkta og hvaða punkta það er á milli. Setja þær í stutta, læsilega þekjuskýringu með ítarupplýsingum eftir þörfum. Talan 67,3 km á skjáskotinu er dæmi, ekki fast gildi.
- Halda skýrri aðgreiningu nýjustu færðarstöðu og framtíðarveðurspár, og að sami valdi spátími gildi fyrir punktana.
- Varðveita nauðsynlegar heimildatilvísanir, leyfismerkingar og fyrirvara.

### 6. Auðkenna valda leið með millistöðum

- Undir leiðarheitinu, til dæmis „Selfoss → Egilsstaðir“, birtist hvaða leið er valin, til dæmis „Um Vík og Höfn“ þegar það samsvarar raunverulegu vali.
- Nota millistaði úr völdum leiðargögnum; ekki harðkóða dæmatexta.
- Leiðarheiti og lýsing uppfærist með niðurstöðunni og passi við kort, veður og færð.

### Upplýsingaforgangur

Eftir staðaval og leiðarval: skýr lýsing valinnar leiðar og spátími → stutt færðarsamantekt → veðuryfirlit → ítarupplýsingar. Heildarlisti vegkafla má ekki ýta veðuryfirliti langt niður sjálfgefið. Í síma er kort áfram opnanlegt samkvæmt eldri kröfum; kort má vera sýnilegt við hlið yfirlits í tölvu ef það skerðir ekki aflestur.

### Samþykktarskilyrði viðbótarinnar

- [ ] Aðeins einn leitarbær Frá-reitur og einn Til-reitur birtast; val virkar með snertingu og lyklaborði.
- [ ] Víxla-hnappur hefur skýrt aðgengisheiti og „Sýna leið“ virkar áfram.
- [ ] Heildarlisti færðarkafla er lokaður við fyrstu birtingu; samantekt og ítarlisti tvítaka ekki full tilkynningakort.
- [ ] Lokanir, gagnaskortur, óþekkt staða og úrelt gögn eru sýnileg án þess að opna lista.
- [ ] „Greiðfært“ er ekki tvítekið innan sama kaflakorts.
- [ ] Veðurgildi raðast í samstillta dálka í tölvu og öll gildi eru læsileg í síma.
- [ ] Veðurtákn eru auðgreinanleg og heiti punkta styttri án breyttrar staðsetningarmerkingar.
- [ ] Spátími og tími færðarheimildar eru skýr; innri skyndiminnistexti er í ítarupplýsingum.
- [ ] Þekjuskýring varðveitir stærsta bil milli punkta og viðeigandi punktaheiti úr gögnum.
- [ ] Valin leið er auðkennd með réttum millistöðum og passar við niðurstöðugögn.
- [ ] Skjáskot úr síma og tölvu sýna staðaval, lokaðan/opinn færðarlista og veðuryfirlit. Staðfesta einnig 200% þysjun og lyklaborðsnotkun.
- [ ] Fyrirliggjandi útreikningar, leiðaþekja, gagnatengingar, heimildir og eldri kortakröfur haldast.


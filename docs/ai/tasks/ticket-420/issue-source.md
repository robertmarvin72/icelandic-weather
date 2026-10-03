# Issue #420 source snapshot

Source: https://github.com/robertmarvin72/icelandic-weather/issues/420
Issue updatedAt: 10/03/2026 17:07:16
Captured: 2026-10-03. Reference content only; owner decisions in prompt-review.md override conflicts. Not an execution prompt.



Markmið
Stækka núverandi Weather Voice content library þannig að Tjaldur virðist sjaldan vera að endurtaka sig og fái sterkari, samkvæmari persónuleika.
Tjaldur á að vera:
mjög þurr
kaldhæðinn
deadpan
orðfár
örlítið skeptískur
stundum óvænt ánægður
aldrei að reyna of mikið að vera fyndinn
Markmiðið er ekki ákveðinn heildarfjöldi texta.
Markmiðið er að byggja nægilega stórt og fjölbreytt personality library til að reglulegur notandi upplifi Tjald sjaldan endurtaka sig.
Stærri og algengari SAFE conditions mega því hafa 20+ texta ef gæði og semantic variety haldast góð.
Ekki skal skera niður samþykkta texta eingöngu til að ná fyrirfram ákveðnum fjölda.
Núverandi staða
Production library inniheldur í dag:
27 IS comments
27 EN comments
9 conditions
fullkomið IS/EN ID parity
7 daga cooldown á hvert comment ID
Núverandi dreifing:

Condition | Núna
-- | --
extreme_wind | 5
heavy_rain | 3
strong_wind | 3
cold_wet | 3
cold | 3
rain | 2
sun_wind | 2
excellent | 3
good | 3
Samtals | 27

extreme_wind skal ekki fá fleiri sarcastic personality-texta.
Safety/serious layer sér um dangerous conditions.
Global content rules
Canonical personality library hér að neðan er source of truth fyrir implementation.
Tjaldur comments on the weather. He does not address the user directly.
No commands such as „Farðu út“, „Taktu mynd“, „Klæddu þig“ etc.
Do not infer season, month, time of day or other context that is not part of the condition.
A comment may only reference weather information actually known by that condition.
Short, dry and deadpan beats explanatory humor.
Sarcasm is aimed at the weather, never the user.
Avoid multiple comments built around essentially the same joke.
IS is canonical in tone. EN should be a natural adaptation, not necessarily literal.
DANGEROUS / SERIOUS never uses this personality library.
Safety classification always overrides personality content.
Grunnregla:
Ef hægt er að segja það með færri orðum, prófa það.

Sérstök áhersla: gott veður
Tjaldur má ekki verða karakter sem birtist aðallega þegar veðrið er leiðinlegt.
good og excellent eiga saman að vera stór hluti library.
Tjaldur er vanur íslensku veðri og má því verða svolítið tortrygginn þegar veðrið er óvenju gott.
Tone examples:
good
„Ég finn ekkert að þessu.“

„Þetta er eiginlega bara fínt.“

„Engin ástæða til dramatíkur.“

„Ég samþykki þetta.“

„Það hefur verið verra.“

„Veðrið hagar sér.“

excellent
„Þetta er útiveður.“

„Jæja. Þetta er óþægilega gott.“

„Ég var ekki undirbúinn fyrir þetta.“

„Eitthvað hlýtur að vera að.“

„Þetta þarf eiginlega ljósmyndasönnun.“

„Ég hef... ekkert að kvarta yfir.“

Fjölbreytni innan sama condition
Ekki búa til margar útgáfur af sama brandaranum bara til að stækka library.
Stærri content pools eiga að innihalda mismunandi comedic beats.
Dæmi fyrir rain:
Deadpan
„Vatn. Að ofan.“

Resigned
„Auðvitað.“

Mild irritation
„Já já. Rigning.“

Observation
„Þurrt fær frí í dag.“

Icelandic cliché
„Þetta er víst gott fyrir gróðurinn.“

Markmiðið er semantic variety, ekki bara mismunandi orðalag.
Textareglur
Hver personality-texti skal:
vera stuttur
helst ein setning
vera skiljanlegur án útskýringar
passa við condition
hljóma eins og Tjaldur
kommentera á veðrið eða aðstæðurnar
ekki ávarpa notandann
ekki gefa notandanum fyrirmæli
gera grín að veðrinu, ekki notandanum
forðast hype
forðast emoji í textanum
forðast „AI-húmor“
ekki gera lítið úr mögulegri hættu
ekki álykta um árstíð, mánuð eða tíma dags
aðeins vísa í upplýsingar sem viðkomandi condition veit raunverulega
IS og EN
Hvert comment skal hafa sama canonical ID á báðum tungumálum.
Dæmi:
rain_05

IS:
„Auðvitað.“

EN:
“Of course.”
Enska útgáfan þarf ekki að vera orðrétt þýðing.
Hún skal varðveita:
punchline
deadpan tón
persónuleika Tjalds
Natural adaptation hefur forgang yfir literal translation.
Metadata
Halda núverandi content architecture.
Hvert comment þarf a.m.k. að tengjast:
comment_id
condition
mood
voice_level
text_is / text_en
cooldown
Önnur núverandi metadata skulu varðveitt þar sem þau eiga við.
Rotation
Halda núverandi 7 daga cooldown sem baseline.
Selector skal áfram:
finna eligible comments fyrir condition/mood/voice level
útiloka nýlega sýnd comments ef hægt er
velja úr remaining pool
fallbacka í least-recently-shown þegar allur pool er í cooldown
Ekki breyta selector logic nema prófanir sýni raunverulega þörf.
Safety
Nýja safety-layerið hefur alltaf forgang.
DANGEROUS / SERIOUS skal aldrei sækja texta úr þessu personality library.
POOR / CAUTIOUS skal aðeins nota texta sem eru eligible fyrir cautious voice.
Ekki bæta sarcastic textum við condition bara til að auka fjölda ef safety classification útilokar þá.
Betra er að sýna engan personality-texta en texta með röngum safety-tón.
Canonical personality library
good
Keep existing
good_01
IS: Þetta má alveg.
EN: This'll do.

good_02
IS: Jæja. Þetta er bara gott.
EN: Well. This is just good.

good_03
IS: Engin kvörtun að sinni.
EN: No complaints for now.
Add
good_04
IS: Ég finn ekkert að þessu.
EN: I can't find anything wrong with this.

good_05
IS: Veðrið hagar sér.
EN: The weather is behaving.

good_06
IS: Það hefur verið verra.
EN: It's been worse.

good_07
IS: Ég samþykki þetta.
EN: I approve.

good_08
IS: Engin ástæða til dramatíkur.
EN: No need for drama.

good_09
IS: Þetta er furðulega eðlilegt.
EN: This is strangely normal.

good_10
IS: Ég ætla ekki að eyðileggja þetta með kvörtunum.
EN: I'm not ruining this with complaints.

good_11
IS: Þetta stenst skoðun.
EN: This passes inspection.

good_12
IS: Jæja. Engin gild afsökun.
EN: Well. No valid complaints.

good_13
IS: Ég hafði áhyggjur að óþörfu.
EN: Apparently I worried for nothing.

good_14
IS: Veðrið kom undirbúið.
EN: The weather came prepared.

good_15
IS: Ég get unnið með þetta.
EN: I can work with this.

good_16
IS: Þetta verður ekki mikið betra án þess að verða grunsamlegt.
EN: Much better than this would be suspicious.

good_17
IS: Ég ætla bara að njóta þessa í hljóði.
EN: I'll just quietly appreciate this.

good_18
IS: Ekkert vesen. Skrítið.
EN: No trouble. Strange.

good_19
IS: Þetta er næstum því fullorðinslegt veður.
EN: This is almost responsible weather.

good_20
IS: Íslenska veðrið gleymdi sér.
EN: Icelandic weather forgot itself for a moment.

good_21
IS: Allt í lagi. Þú vinnur.
EN: Fine. You win.

good_22
IS: Ég var tilbúinn að kvarta.
EN: I was ready to complain.

good_23
IS: Þetta er eiginlega bara fínt.
EN: This is actually quite nice.
good_21 er Tjaldur að tala við veðrið, ekki notandann. Það er leyfilegt samkvæmt voice-reglunni.
excellent
Keep existing
excellent_01
IS: Þetta er grunsamlega gott.
EN: This is suspiciously good.

excellent_03
IS: Nú vantar bara kaffið.
EN: All that's missing is coffee.
Retire
excellent_02
IS: Ekki segja neinum.
EN: Don't tell anyone.
Ástæða: imperative/direct address passar ekki lengur við voice-regluna.
Add
excellent_04
IS: Þetta er útiveður.
EN: This is outdoor weather.

excellent_05
IS: Jæja. Þetta er óþægilega gott.
EN: Well. This is uncomfortably good.

excellent_06
IS: Ég var ekki undirbúinn fyrir þetta.
EN: I wasn't prepared for this.

excellent_07
IS: Eitthvað hlýtur að vera að.
EN: Something must be wrong.

excellent_08
IS: Þetta þarf eiginlega ljósmyndasönnun.
EN: This almost requires photographic evidence.

excellent_09
IS: Ég hef... ekkert að kvarta yfir.
EN: I have... nothing to complain about.

excellent_10
IS: Þetta gerist víst.
EN: Apparently this happens.

excellent_11
IS: Ég ætla að láta þetta eiga sig.
EN: I'm leaving this one alone.

excellent_12
IS: Nei sko.
EN: Well, look at that.

excellent_13
IS: Þetta er eiginlega óþarfi.
EN: This is almost excessive.

excellent_14
IS: Veðrið er að sýna sig.
EN: The weather is showing off.

excellent_15
IS: Ég kann ekki alveg við þetta.
EN: I'm not entirely comfortable with this.

excellent_16
IS: Hver pantaði þetta?
EN: Who ordered this?

excellent_17
IS: Þetta er ekki mjög íslenskt.
EN: This isn't very Icelandic.

excellent_18
IS: Ég athugaði tvisvar.
EN: I checked twice.

excellent_19
IS: Þetta er gott. Grunsamlega gott.
EN: This is good. Suspiciously good.

excellent_20
IS: Ég er orðlaus. Næstum því.
EN: I'm speechless. Almost.

excellent_21
IS: Allt í lagi. Þetta er frábært.
EN: Fine. This is excellent.

excellent_22
IS: Ég ætla ekki að spyrja spurninga.
EN: I'm not asking questions.

excellent_23
IS: Svona á víst að gera þetta.
EN: Apparently this is how it's done.
rain
Keep existing
rain_01
IS: Það fylgir vatn með.
EN: Comes with water.

rain_02
IS: Regnjakki með aðalhlutverk.
EN: Rain jacket, starring role.
Add
rain_03
IS: Vatn. Að ofan.
EN: Water. From above.

rain_04
IS: Já já. Rigning.
EN: Yes, yes. Rain.

rain_05
IS: Auðvitað.
EN: Of course.

rain_06
IS: Þurrt fær frí í dag.
EN: Dry has the day off.

rain_07
IS: Himinninn lekur.
EN: The sky is leaking.

rain_08
IS: Þetta þurfti greinilega að vera blautt.
EN: Apparently this needed to be wet.

rain_09
IS: Veðrið valdi vatn.
EN: The weather chose water.

rain_10
IS: Rigningin mætti á réttum tíma. Eins og alltaf.
EN: The rain arrived right on time. As always.

rain_11
IS: Þurrkur var greinilega ekki á dagskrá.
EN: Dry clearly wasn't on the agenda.

rain_12
IS: Vatnsheldur er fallegt orð.
EN: Waterproof is a beautiful word.

rain_13
IS: Þetta er mjög íslenskt.
EN: Very Icelandic.

rain_14
IS: Regnið er komið. Það fannst öllum vanta.
EN: The rain is here. Apparently it was missed.

rain_15
IS: Nú er allt aðeins blautara.
EN: Everything is slightly wetter now.

rain_16
IS: Himinninn er í þvottaham.
EN: The sky is on wash cycle.

rain_17
IS: Rigningin hefur tekið vaktina.
EN: Rain has taken the shift.

rain_18
IS: Það þurfti víst að vökva.
EN: Apparently something needed watering.

rain_19
IS: Veðrið fór blautu leiðina.
EN: The weather took the wet route.

rain_20
IS: Þurrt hefði verið of einfalt.
EN: Dry would have been too simple.

rain_21
IS: Rigning. Klassískt.
EN: Rain. Classic.

rain_22
IS: Skýin eru greinilega með verkefni.
EN: The clouds clearly have a job to do.

rain_23
IS: Þetta er víst gott fyrir gróðurinn.
EN: Apparently it's good for the plants.
cold
Keep existing
cold_01
IS: Lopapeysan hafði rétt fyrir sér.
EN: The wool sweater was right.

cold_03
IS: Kaffið kólnar af samúð.
EN: Even the coffee is getting cold in sympathy.
Retire
cold_02
IS: Peysan fær framlengingu.
EN: The sweater gets an extension.
Ástæða: of nálægt cold_01.
Add
cold_04
IS: Þetta er bara hressandi.
EN: It's just refreshing.

cold_05
IS: Það er víst enginn kuldi.
EN: Apparently there's no such thing as cold.

cold_06
IS: Bara spurning um að klæða sig.
EN: Apparently it's all about the clothing.

cold_07
IS: Hitinn er með mjög hófleg markmið.
EN: The temperature has modest ambitions.

cold_08
IS: Þetta telst víst ferskt.
EN: Apparently this counts as fresh.

cold_09
IS: Hitamælirinn er ekkert sérstaklega metnaðarfullur.
EN: The thermometer isn't feeling ambitious.

cold_10
IS: Stuttbuxurnar fá frí.
EN: The shorts get the day off.

cold_11
IS: Þetta er peysuveður.
EN: Sweater weather.

cold_12
IS: Hitinn mætti ekki.
EN: The warmth didn't show up.

cold_13
IS: Það er allavega ekki of heitt.
EN: At least it's not too warm.

cold_14
IS: Hitinn fór eitthvað annað.
EN: The warmth went somewhere else.

cold_15
IS: Jæja. Ull.
EN: Well. Wool.

cold_16
IS: Ferskt. Mjög ferskt.
EN: Fresh. Very fresh.

cold_17
IS: Þetta er ein leið til að vakna.
EN: That's one way to wake up.

cold_18
IS: Hlýtt er afstætt hugtak.
EN: Warm is a relative term.

cold_19
IS: Hitamælirinn heldur aftur af sér.
EN: The thermometer is holding back.

cold_20
IS: Ekki alveg hitabylgja.
EN: Not exactly a heatwave.

cold_21
IS: Hitinn lætur lítið fyrir sér fara.
EN: The warmth is keeping a low profile.

cold_22
IS: Kuldinn mætti.
EN: The cold showed up.

cold_23
IS: Það vantar nokkrar gráður.
EN: A few degrees appear to be missing.

cold_24
IS: Það er enginn kuldi, bara lélegur klæðnaður.
EN: There's no bad cold, only bad clothing.
sun_wind
Keep existing
sun_wind_01
IS: Sólin mætir. Lognið ekki.
EN: The sun showed up. The calm didn't.

sun_wind_02
IS: Bjart yfir. Hárið á hlið.
EN: Bright skies. Hair sideways.
Add
sun_wind_03
IS: Sólin kom. Vindurinn líka.
EN: The sun came. So did the wind.

sun_wind_04
IS: Bjart og blásið.
EN: Bright and breezy.

sun_wind_05
IS: Sólin gerir sitt. Vindurinn líka.
EN: The sun is doing its thing. So is the wind.

sun_wind_06
IS: Fallegt. Með mótvindi.
EN: Beautiful. With a headwind.

sun_wind_07
IS: Sólin lofar góðu. Vindurinn hefur aðrar hugmyndir.
EN: The sun looks promising. The wind has other ideas.

sun_wind_08
IS: Bjart yfir. Rólegt, síður.
EN: Bright skies. Calm, less so.

sun_wind_09
IS: Sólin er saklaus af þessu.
EN: The sun is innocent in all this.

sun_wind_10
IS: Vindurinn lætur sólina ekki eiga sviðið.
EN: The wind won't let the sun have the stage.

sun_wind_11
IS: Sól með aukahljóðum.
EN: Sunshine with sound effects.

sun_wind_12
IS: Bjart. En ekki beint kyrrt.
EN: Bright. Not exactly still.

sun_wind_13
IS: Sólin mætti ekki ein.
EN: The sun didn't come alone.

sun_wind_14
IS: Fallegt úr fjarlægð.
EN: Looks lovely from a distance.

sun_wind_15
IS: Sól og vindur. Klassískt samstarf.
EN: Sun and wind. A classic partnership.

sun_wind_16
IS: Veðrið gat ekki bara verið gott.
EN: The weather couldn't just be nice.

sun_wind_17
IS: Sólin reynir.
EN: The sun is trying.

sun_wind_18
IS: Bjartviðri með fyrirvara.
EN: Clear skies, with conditions attached.

sun_wind_19
IS: Sólskin. Með smá mótþróa.
EN: Sunshine. With some resistance.

sun_wind_20
IS: Vindurinn vill líka athygli.
EN: The wind wants attention too.

sun_wind_21
IS: Sól að ofan. Vindur frá hlið.
EN: Sun above. Wind from the side.

sun_wind_22
IS: Næstum því fullkomið.
EN: Almost perfect.
cold_wet
Keep existing
cold_wet_01
IS: Ullin fær að vinna fyrir kaupinu.
EN: The wool earns its keep.

cold_wet_02
IS: Veðrið tók allan pakkann.
EN: The weather went for the full package.

cold_wet_03
IS: Ekki alveg stuttbuxnaveður.
EN: Not quite shorts weather.
Add
cold_wet_04
IS: Kalt og blautt. Klassík.
EN: Cold and wet. Classic.

cold_wet_05
IS: Tveir fyrir einn.
EN: Two for one.

cold_wet_06
IS: Blautt var greinilega ekki nóg.
EN: Wet clearly wasn't enough.

cold_wet_07
IS: Kalt var greinilega ekki nóg.
EN: Cold clearly wasn't enough.

cold_wet_08
IS: Veðrið ákvað að klára dæmið.
EN: The weather decided to complete the set.

cold_wet_09
IS: Þetta er metnaðarfull óþægindi.
EN: This is ambitious discomfort.

cold_wet_10
IS: Bæði. Auðvitað.
EN: Both. Of course.

cold_wet_11
IS: Kuldinn fékk félagsskap.
EN: The cold got company.

cold_wet_12
IS: Rigningin þurfti greinilega kælingu.
EN: Apparently the rain needed cooling.

cold_wet_13
IS: Vatn. Nú kaldara.
EN: Water. Now colder.

cold_wet_14
IS: Þurrt og hlýtt var ekki í boði.
EN: Dry and warm wasn't on offer.

cold_wet_15
IS: Veðrið valdi allan pakkann.
EN: The weather chose the full package.

cold_wet_16
IS: Kalt. Blautt. Næsta mál.
EN: Cold. Wet. Next.

cold_wet_17
IS: Hitinn fór. Rigningin varð eftir.
EN: The warmth left. The rain stayed.

cold_wet_18
IS: Þetta vinnur vel saman. Því miður.
EN: These work well together. Unfortunately.

cold_wet_19
IS: Blaut kuldatilfinning. Frábær uppfinning.
EN: Wet cold. Wonderful invention.

cold_wet_20
IS: Rigning með kælingu.
EN: Rain, now refrigerated.

cold_wet_21
IS: Kuldinn einn hefði alveg dugað.
EN: The cold alone would have been enough.

cold_wet_22
IS: Þetta er óþarflega blautt miðað við hitastig.
EN: This is unnecessarily wet for the temperature.

cold_wet_23
IS: Veðrið er að leggja sig fram.
EN: The weather is really making an effort.
strong_wind
Keep existing
wind_strong_01
IS: Lognið á frí.
EN: Calm is on vacation.

wind_strong_02
IS: Hárið hefur gefist upp.
EN: The hair has given up.
Retire
wind_strong_03
IS: Það blæs ekki af þessu.
EN: This isn't blowing over.
Ástæða: tvírætt orðalag sem getur lesist sem reassurance.
Add
wind_strong_04
IS: Vindurinn hefur skoðanir.
EN: The wind has opinions.

wind_strong_05
IS: Lognið kemur greinilega ekki.
EN: Calm clearly isn't coming.

wind_strong_06
IS: Það er hreyfing á loftinu.
EN: There's some movement in the air.

wind_strong_07
IS: Vindurinn lætur vita af sér.
EN: The wind is making itself known.

wind_strong_08
IS: Þetta er orðið töluvert af lofti.
EN: That's becoming quite a lot of air.

wind_strong_09
IS: Loftið er á ferðinni.
EN: The air is on the move.

wind_strong_10
IS: Vindurinn tók aðeins of mikið pláss.
EN: The wind is taking up a little too much space.

wind_strong_11
IS: Það er ekkert feimið við þennan vind.
EN: This wind isn't shy.

wind_strong_12
IS: Vindurinn er kominn í aðalhlutverk.
EN: The wind has taken the starring role.

wind_strong_13
IS: Logn var greinilega ekki í boði.
EN: Calm clearly wasn't on offer.

wind_strong_14
IS: Vindurinn hefur tekið vaktina.
EN: The wind has taken the shift.

wind_strong_15
IS: Þetta er meira en léttur andvari.
EN: This is more than a light breeze.

wind_strong_16
IS: Loftið er með læti.
EN: The air is making a scene.

wind_strong_17
IS: Vindurinn mætir af fullum krafti.
EN: The wind showed up in force.

wind_strong_18
IS: Þetta blæs aðeins meira en kurteislegt er.
EN: This is windier than strictly polite.

wind_strong_19
IS: Vindurinn er greinilega með dagskrá.
EN: The wind clearly has an agenda.

wind_strong_20
IS: Það er nóg af vindi fyrir alla.
EN: There's enough wind for everyone.

wind_strong_21
IS: Vindurinn þarf greinilega athygli.
EN: The wind clearly needs attention.

wind_strong_22
IS: Loftið gat ekki bara verið kyrrt.
EN: The air couldn't just stay still.

wind_strong_23
IS: Jæja. Vindur.
EN: Well. Wind.
heavy_rain
Keep existing
rain_heavy_02
IS: Þurrt er afstætt hugtak.
EN: Dry is a relative concept.

rain_heavy_03
IS: Þetta er fullmikill áhugi á vatni.
EN: This is an excessive interest in water.
Retire
rain_heavy_01
IS: Bíllinn fær allavega þvott.
EN: At least the car gets a wash.
Ástæða: „at least“ framing getur gert lítið úr heavy-rain condition.
Add
rain_heavy_04
IS: Þetta er orðið töluvert af vatni.
EN: That's becoming quite a lot of water.

rain_heavy_05
IS: Himinninn er greinilega ekki að spara.
EN: The sky clearly isn't holding back.

rain_heavy_06
IS: Rigningin tók þetta alvarlega.
EN: The rain took this seriously.

rain_heavy_07
IS: Vatnið er komið í aðalhlutverk.
EN: Water has taken the starring role.

rain_heavy_08
IS: Þetta er meira en smá væta.
EN: This is more than a little damp.

rain_heavy_09
IS: Skýin eru að tæma lagerinn.
EN: The clouds are clearing out the inventory.

rain_heavy_10
IS: Það er nóg af vatni í boði.
EN: There's plenty of water on offer.

rain_heavy_11
IS: Rigningin hefur tekið yfir.
EN: The rain has taken over.

rain_heavy_12
IS: Þurrt er ekki orðið sem kemur upp í hugann.
EN: Dry isn't the word that comes to mind.

rain_heavy_13
IS: Himinninn opnaði kranann.
EN: The sky opened the tap.

rain_heavy_14
IS: Þetta er metnaðarfull rigning.
EN: This is ambitious rain.

rain_heavy_15
IS: Rigningin ætlar greinilega að klára þetta.
EN: The rain clearly intends to finish the job.

rain_heavy_16
IS: Vatn. Töluvert af því.
EN: Water. Quite a lot of it.

rain_heavy_17
IS: Skýin eru með dagskrá.
EN: The clouds have an agenda.

rain_heavy_18
IS: Þetta er orðið persónulegt.
EN: This is getting personal.

rain_heavy_19
IS: Rigningin er ekkert að hálfkáka.
EN: The rain isn't doing things by halves.

rain_heavy_20
IS: Það er enginn skortur á úrkomu.
EN: No shortage of precipitation.

rain_heavy_21
IS: Himinninn hefur gefið sig.
EN: The sky has given way.

rain_heavy_22
IS: Þetta telst ekki lengur nokkrir dropar.
EN: This no longer qualifies as a few drops.

rain_heavy_23
IS: Jæja. Meira vatn.
EN: Well. More water.

rain_heavy_26
IS: Það mætti fara að huga að örkinni.
EN: Might be time to start thinking about the ark.

rain_heavy_27
IS: Nói hafði kannski punkt.
EN: Noah may have had a point.

rain_heavy_28
IS: Þetta er farið að kalla á örk.
EN: This is starting to call for an ark.
Reserve, ekki active
Ekki setja of mörg Noah/ark joke concepts í active pool.
Eftirfarandi skulu því vera reserve content en ekki active:
rain_heavy_24
IS: Er ekki kominn tími á örkina?
EN: Is it time for the ark yet?

rain_heavy_25
IS: Örkin hlýtur að vera í smíðum.
EN: The ark must be under construction.

rain_heavy_29
IS: Hvar er Nói þegar maður þarf á honum að halda?
EN: Where's Noah when you need him?
Canonical active ark jokes eru:
rain_heavy_26
rain_heavy_27
rain_heavy_28
extreme_wind
Engum nýjum sarcastic personality-textum skal bætt við.
Núverandi condition skal fara í gegnum safety classification layerið.
Ef:
voice_level = serious
þá skal aðeins nota:
weatherSafetyMessages
Ekki personality library.
Ekki skal bæta við fleiri extreme_wind personality comments sem hluta af þessum miða.
Content review
Áður en texti fer í production skal hann standast:
Myndi Tjaldur segja þetta?
Er þetta raunverulega annað joke concept en textar sem fyrir eru?
Er hægt að stytta textann?
Passar hann við condition?
Virkar hann án þess að útskýra brandarann?
Kommenterar hann á veðrið frekar en notandann?
Ávarpar hann notandann óvart?
Gefur hann notandanum fyrirmæli?
Vísar hann aðeins í context sem condition þekkir?
Er öruggt að sýna hann fyrir skilgreint voice_level?
Virkar EN adaptation jafn vel og IS?
Final validation
Áður en implementation er samþykkt skal keyra validation yfir allt final safnið, ekki aðeins nýju línurnar.
Validate the complete Weather Voice content library.

Check:

1. Every IS ID has exactly one EN counterpart.
2. No duplicate IDs.
3. No exact duplicate text.
4. Flag semantic near-duplicates.
5. No personality comment directly addresses the user.
6. No personality comment tells the user what to do.
7. No comment assumes season, month or time of day.
8. Every comment only references information known by its condition.
9. No serious/dangerous outcome can select personality content.
10. All EN lines are natural adaptations of the IS intent.
11. Existing cooldown/history behavior still works with the expanded library.
12. Retired comments are no longer eligible.
13. Reserve comments are not eligible in the active selector.
14. Report final active comment count by condition and language.

Do not silently rewrite approved content during validation.

If a problem is found, report the ID, problem and suggested fix before changing the approved text.
Acceptance criteria
Canonical personality library í þessum miða er implementað.
Final active comment count er skráð per condition.
Full IS/EN ID parity.
Engin duplicate IDs.
Engir exact duplicate textar.
Semantic near-duplicates yfirfarnir.
Personality comments ávarpa ekki notandann beint.
Personality comments gefa notandanum ekki fyrirmæli.
Enginn texti ályktar um árstíð, mánuð eða tíma dags nema condition viti það.
Hver texti vísar aðeins í weather context sem viðkomandi condition þekkir.
EN textar eru natural adaptations af IS intent, ekki blindar þýðingar.
Retired comments eru ekki lengur eligible.
Reserve comments eru ekki active í selector.
DANGEROUS / SERIOUS getur aldrei sótt texta úr personality library.
Safety layer hefur alltaf forgang.
7 daga cooldown/history heldur áfram að virka.
Existing Weather Voice analytics halda áfram að virka.
Virkar á IS og EN.
Virkar á mobile og desktop.
Final validation report sýnir active count fyrir hvert condition.
Final validation report sýnir öll issues sem fundust áður en editorial breytingar eru gerðar.
Ekki hluti af þessum miða
Ný Weather Voice conditions.
Breyting á weather thresholds.
Breyting á weather scoring.
Ný Tjaldur assets.
UI redesign.
Breyting á safety classification.
LLM-generated runtime comments.
Admin-interface fyrir textana.
Ný selector logic nema nauðsynlegt sé til að styðja retired / reserve stöðu.
Implementation instruction
Treat the canonical personality library in this ticket as the source of truth.
Implement the approved content and then run the final validation.
Do not silently rewrite, shorten, translate differently, remove or add approved content during implementation.
If implementation or validation reveals a conflict with the rule engine, safety layer, existing metadata structure or Character & Voice Bible, report the conflict before making an editorial change.

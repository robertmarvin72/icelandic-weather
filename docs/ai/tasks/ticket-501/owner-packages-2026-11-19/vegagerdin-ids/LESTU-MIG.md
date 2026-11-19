# Vegagerðar-ID tengd við Íslandspakkann, 19. nóvember 2026

## Niðurstaða og mörk
Sótt voru 708 raunveruleg IdButur og 1.564 línuhlutar frá Vegagerðinni. Öll 708 ID í færðargagnasafninu eiga samsvörun í sóttu línugögnunum og öfugt. IDBUTUR/IdButur er tengilykillinn, ekki OBJECTID, IDFERILL eða númer línu í GeoJSON.

164 staðir eru varðveittir úr upprunalegri töflu. Hnit eiganda eru notuð óbreytt og teljast nægileg fyrir MVP. Ekki þarf sérstaka nákvæmnissannprófun þeirra.

Þetta er gagnaundirstaða fyrir innleiðingu. Full tenging allra leiðarkafla milli staða við færðarkafla er EKKI lokið með nálægðarleit. Ein staðfest nafnsamsvörun milli staðapars og opinbers kafla er í sérskrá: Hveragerði–Selfoss = 902030037.

## Skrár
- Island-stadir-med-IdButur-tillogum.csv: upprunadálkar ásamt allt að þremur nálægum IdButur-tillögum innan 2 km. IdButur_stadfest er viljandi autt: nálægð staðarpunkts staðfestir ekki leiðarkafla.
- Stadur-faerdarkafli-tengitillogur.csv: ein lína fyrir hverja tillögu, með opinberu heiti, vegnúmerum, fjarlægð og aðferð. 288 tengitillögur við 147 staði.
- Vegagerdin-faerdarkaflar-708.csv: heildarskrá staðfestra auðkenna úr heimild með heitum, vegnúmerum, IDFERILL og breytingadagsetningum.
- Vegagerdin-faerdferlar-WGS84.geojson: allir sóttir línuhlutar með opinberum eigindum. Fleiri en einn ferill getur borið sama IdButur.
- Stadfest-kaflasamsvorun.csv: Hveragerði–Selfoss, staðfest með fullu heiti kaflans hjá Vegagerðinni. Sama ID gildir fyrir báðar akstursáttir; röðun geometry er sérstök útfærsluvinna.
- Island-akstursrod-og-GPS-upprunalegt.csv: óbreytt upprunatafla.
- heimildir.json: fyrirspurnir, sóknartími, talningar og SHA256.

## Aðferð og stöður
Nálægð er lágmarksfjarlægð að línu, reiknuð með staðbundinni jafnhyrndri vörpun. Áætlaður staðarpunktur getur legið frá vegi. 2 km er leitarmörk til að finna kandidata, ekki öryggis-, þekju- eða gæðaviðmið. Allt að þrjú nálægustu mismunandi IdButur innan þessara marka eru varðveitt. Nafn_og_nalaegd merkir einfalda textasamsvörun auk nálægðar, ekki handstaðfestingu. Þessar tillögur má ekki flytja sjálfvirkt yfir í route roadConditionIds.

11 staðir hafa enga línu innan 2 km. Það þýðir ekki að þeir séu óaðgengilegir eða að færðargögn vanti örugglega. Skoða þarf vegtenginguna. Tveir göngustaðir, Eldborg og Gatklettur, fá ekki sjálfvirka aksturstengingu. Fjögur eyjastopp, Flatey, Grímsey, Hrísey og Heimaey, eru undanskilin vegna ferju. Vegir að ferjuhöfnum haldast inni.

## Næsta notkun í #501/#503
Endurnýta núverandi Hringveg. Fyrir hvern tengikafla úr kortum eiganda skal velja rétta vegkeðju og tengja við eitt eða fleiri IdButur úr heildarskránni. Nota legu og vegnúmer ásamt opinberum kaflaheitum. Varðveita alla nauðsynlega ferla sama IdButur og röð þeirra. Ekki tengja samliggjandi CSV-raðir sjálfkrafa; afleggjarar, valleiðir og ferjur blandast í upprunaröðinni. Ekki rugla opinberu IdButur saman við innra route-segment-id.

Lifandi færð er ekki föst eigind í staðatöflu. Sækja hana við keyrslu eftir IdButur. ID geta breyst þegar kaflar breytast; bera skrána reglulega saman við heimildina. Engin breyting var gerð á kóða eða GitHub-miðum í þessari afhendingu.

Heimild: Vegagerðin, gagnaveita fyrir færð og færðarferla. Nánari uppruni og nákvæmar fyrirspurnir í heimildir.json.

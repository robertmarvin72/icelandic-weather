# #501 — Direction authority approved prompt v1 — 2026-11-18

Jonesy APPROVED án blockera. P1–P4 hér neðar eru afrituð óbreytt og ganga framar upprunalegu Round 1 þar sem nákvæmari. Sögulegur prompt-review/pending-approval texti Round 1 er afgreiddur með þessum haus. Framkvæmd aðeins eftir eiganda „Prompt approved“, CURRENT READY_FOR_CC og pointer hingað; CC_IN_PROGRESS áður en byrjað er, CC_COMPLETE eftir skýrslur.

## Skýringar fyrir framkvæmd

- Þrjár spurningar í niðurstöðutöflu: AKSTURSSTEFNA lag-sértæk merking, identity/orientation crosswalk og VEGHLUTI 6/7 merking í færðarlaginu. Sama afmarkaða skjalabudget, ekkert gagnakall.
- P1: retained lendingarsíða er skjal 1; eitt tengt lýsingarskjal er skjal 2. Leitir að hámarki tvær aðeins ef retained slóð bregst; aldrei meira en tvö heimildaskjöl. Engin sjálfvirk redirect-fylgni/endursókn; skrá tilvísun sem takmörkun ef ekki er hægt að afgreiða innan heimilda. HTTP/bæti/SHA-256 mega vera UNKNOWN ef lestrartólið gefur ekki aðgang að hráum svörum; skrá takmörkun og aldrei búa þau til eða endursækja eingöngu fyrir mælingar. Ef beinn lesari hefur bytes, reikna hash í minni án varanlegrar vistunar heils skjals.
- P3 ákvörðunarprófun er rökstutt mat, ekki ný gögn. Gildið 0/unknown má ALDREI meðhöndla sem staðfesta tvístefnu eða jafngilda 2; óþekkt heldur engum leyfðum brúnum í directed mode. Tölur 8 pör/13 stykki og tilgátur eru eignaðar sandbox-athugun Jonesy nema CC staðfesti þær sjálft offline; ekki ný skyldubundin exhaustive greining. Ekki nefna allt tier-2 safnið sem 13 línur alls af tegundum 6/7 (Jonesy greinir 13 af hvorri tegund, en aðeins 13 í umræddum leiðum).
- Ekkert net framkvæmt af Ripley eða Jonesy í þessari lotu. Ekki senda skilaboð til stofnunar. UNKNOWN er fullgild afhending og veldur ekki sjálfvirkri framhaldslotu.

## Samþykkt Round 1

# #501 — Heimild fyrir akstursstefnu, Round 1 — 2026-11-18

## Markmið og staða

Eigandi sagði „Ok höldum áfram“ eftir PASS directed-composition. Næsta afmarkaða skref er að finna hvort opinber heimild geti staðfest stefnu fyrir núverandi geometry-gögn. Þetta er prompt til Jonesy; ekki framkvæmdarheimild fyrr en approved prompt er til og eigandi segir Prompt approved.

Stefnumiðaði kjarninn er samþykktur. Ekki breyta honum, bæta valfrjálsum prófum eða enduropna CF1/OP1–OP4. Núverandi geometry API er enn óstefnt geometry_only, drivingAccess UNVERIFIED. Engin runtime-akstursregla til. Ekki smíða nýtt kerfi til að komast hjá gagnaskortinum.

## Lesa fyrst

AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md. Síðan directed-composition/result-review.md (Ripley lokamat), metadata-acquisition/metadata-report.md og result-review.md (JE1–JE3 leiðréttingar ráða), raw-ROAD-REGISTER-SCHEMA.xml, docs/planning/nature-roads-source-2026-10-28/source-note.md og extracted-text.txt. Skoða retained #499/#429 source-notes/schema og geometry-api/contract-note.md aðeins eftir þörfum fyrir source identity.

## Tvær nákvæmar spurningar

1. Er opinber lag-sértæk skilgreining á AKSTURSSTEFNA í gis:vegakerfi_ist120_2024_1, þ.m.t. kóðagildi og afstaða við vertex-röð? Systurlag vegirinatturuislands_2022_1 er vísbending, ekki staðfesting.
2. Er skjalfest tenging þessara fitja/IDKAFLI yfir í faerdferlar2017_1 IDFERILL/IDBUTUR og samsvarandi geometry-átta? Sameiginlegt VEGNR/KAFLANR, nálæg hnit eða eins nafn eitt og sér sanna ekki identity eða orientation.

## Framkvæmd CC eftir samþykki

Byrja á retained heimildum, engin endurkeyrsla eldri acquisition-skrifta. Ef svörin eru þar, nota þau og sleppa netleit. Annars er heimil ein stutt opinber skjalaleit: leita nákvæmu lagsnafni og gagnalýsingu/kóðalista hjá Vegagerðinni eða opinberri lýsigagnaskrá sem vísar á upprunagögnin. Að hámarki tvær leitarfyrirspurnir og opnun tveggja líklegustu heimildaskjala (HTML/PDF). Skrá leitartexta, URL, dagsetningu, hvað var raunverulega lesið og stutta niðurstöðu. Aðgangur ómögulegur eða mörk nást: skila UNKNOWN, ekki leita áfram sjálfvirkt. Ekki senda skilaboð eða fyrirspurn til stofnunar.

Engin WFS/WMS/ArcGIS gagnaköll, GetFeature, ný geometry/metadata-schema öflun, bulk-download eða B2-sókn. Ekki opna innfelldar þjónustur til að prófa gildi. Engin sjálfvirk endurtilraun. Opinber skjöl mega vera stoð fyrir nákvæma næstu tillögu, ekki heimild til runtime-breytingar. Ekki álykta lagaheimild, tímabundna opnun eða aksturshæfi út frá geometry-stefnu.

## Afhending og lágmarkssönnun

Skrifa direction-authority/authority-report.md og cc-report.md. Skýrslan á að vera stutt: tafla fyrir spurningar 1 og 2 (CONFIRMED / PARTIAL / UNKNOWN), nákvæm heimild/staðsetning og hvað hún sannar. Aðgreina bein orð heimildar frá ályktun. Varðveita aðeins nauðsynlegan útdrátt og upprunaslóð; ekki afrita heilu höfundarréttarvörðu skjali í skýrslu. Skrá sérstaklega að staðfest kóðatafla leysir ekki sjálf geometry-orientation/join.

Ljúka með EINNI ráðleggingu: ef bæði atriði staðfest, lýsa minnsta afmarkaða raunprófi á einu þegar varðveittu source-piece (engin framkvæmd hér); annars tilgreina nákvæmlega hvaða heimild vantar og einföldustu leið eiganda til að afla hennar. Ekki setja á stað aðra rannsóknar- eða CC-lotu sjálfvirkt. UNKNOWN er gild og heiðarleg afhending.

Engin runtime policy búin til. Engin breyting á api/, src/, server_data/, config, dependencies eða eldri sönnunargögnum. Aðeins ný lotuskráargögn og nauðsynleg CURRENT-lífsferilsfærsla. Enginn commit/push/deploy/GitHub. Engin app-próf/lint/build nauðsynleg fyrir skjalaleit; staðfesta breytingasvið og git diff --check. Skrá próf ekki keyrð, ekki búa til prófaniðurstöður.

CC staðfestir READY_FOR_CC og approved-prompt pointer áður en byrjað er, setur CC_IN_PROGRESS, síðan CC_COMPLETE með skýrsluslóðum. STOP ef heimildaleit krefst annars umfangs; skila niðurstöðu og tillögu án frekari aðgerða.

## Jonesy yfirferð

Meta hvort þessi afmörkun svari næstu raunverulegu hindrun án nýrrar rannsóknarlykkju. Aðeins sýnd rökvilla, óheimil öflun eða ónothæf afhending er blocker. Ekki gera fulla lögfræðilega akstursstaðfestingu, allt landið eða umfangsmikla harðeningu að skilyrði þessa skrefs.

## Bindandi Jonesy P1–P4 (óbreytt afrit)

**P1 — Heimildabudget: eitt hopp frá retained slóðinni.** `source-note.md` p1 geymir slóð á gagnaveitu Vegagerðarinnar (`https://www.vegagerdin.is/upplysingar-og-utgafa/gagnaveita-vegagerdarinnar/`). Leyfa að opna **hana sem skjal 1** og eitt tengt lýsingar-/gagnabókarskjal (PDF/HTML) fyrir `vegakerfi_ist120_2024_1` sem skjal 2 — leitir (≤2) aðeins ef retained slóð bregst. Annars gæti skjal 1 verið lendingarsíða sem klárar budgetið án raunverulegrar lýsingar. Skrá fyrir hvert opnað skjal: URL, dagsetning, HTTP-staða, bæti og SHA-256 af móttekinni vistun; halda ekki höfundarréttarvörðu skjali í endurbirtingu (aðeins stutt orðrétt tilvitnun + slóð; vistun á skránni sjálfri er ákvörðun eiganda).

**P2 — Bæta við hlið-spurningu 3 (aðeins skjalaleit, sama budget): hvernig er VEGHLUTI (sér í lagi 6/7) skilgreint fyrir `faerdferlar2017_1` og skjalfestir það stefnu?** Rök: nákvæmlega þetta lag (ekki `vegakerfi_ist120`) hefur raun-sönnunargögnin sem þegar eru í notkun, og 8/20 pörin sem stefna gæti breytt snerta 6/7. Merking: CONFIRMED/PARTIAL/UNKNOWN eins og Q1/Q2; bein orð skjals aðgreind frá ályktun; **engin regla búin til, engin regex á nafn/hlutverk, enginn „til austurs/vesturs“-lestur sem heimild**. Ef Ripley kýs að halda tveimur spurningum: setja þá setningu í lokaráðleggingu að VEGHLUTI-skilgreining sé ósvöruð.

**P3 — Væntingastjórnun í skýrslusniði.** Q2 skal skilað sem UNKNOWN sjálfgefið nema skjal sýni orðrétta tengingu; ekki rökstyðja „PARTIAL“ með nafna-/hnitasamsvörun (prompt bannar það nú þegar — gera það að beinni skýrslureglu). Ráðlegging (ein) þarf auk þess **ákvörðunarprófun**: nefna hvaða ákvörðun gildi úr heimildinni gæti breytt (t.d. ef AKSTURSSTEFNA er 2/0 á öllum köflum á Hringvegi: engin breyting; ef 1/−1 á tilteknum köflum: hvaða 8 pör/13 stykki) — svo ekki sé lagt til GetFeature ef ekkert gildi breytir innleiðingunni. Ef bæði Q1 og Q2 staðfest: „minnsta raunpróf“ á **einu** retained stykki; tillaga frá mér til CC að nefna Hellisheiðar-parið 2117/2134 sem dæmi (aðeins sem dæmi, ekki ákvörðun), því það er í retained gögnum og hefur nöfn sem lýsa stefnu.

**P4 — Hörð stöðvun á tenglum.** Ef skjal/síða vísar á WFS/WMS/ArcGIS REST/`GetCapabilities`/`DescribeFeatureType`/gagnapakka (zip, shapefile, GeoJSON, CSV) er það **ekki skjal**: ekki opna, ekki sækja, ekki prófa. Bara texta- og PDF-lýsingar. Ef eina leiðin að svari er gagnaslóð: skila UNKNOWN og nefna slóðina. Engin sjálfvirk endurtilraun né fylgt tilvísun út fyrir `vegagerdin.is` (eða skjalið sem retained slóð vísar á).

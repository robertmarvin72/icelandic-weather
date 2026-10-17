Titill:

Ski Weather — Discovery & demand validation

Hypothesis:

Users in Iceland may value a decision tool that compares ski areas based on forecast conditions and identifies where skiing conditions are likely to be best.

Þar myndum við byrja á:

Hvaða skíðasvæði? → hvaða gögn höfum við? → hvaða gögn vantar? → hvað þýðir „gott skíðaveður“? → landing-page interest test.

Ekki byrja strax á scoring engine.

Og ég sé jafnvel fjórða miðann, en hann kemur aðeins seinna:

Ski Weather — Scoring model v0.1

Hann verður aðeins stofnaður ef discovery/validation gefur okkur ástæðu til að halda áfram. Þar skilgreinum við vind, hviður, hitastig, snjókomu, snjódýpt, skyggni o.s.frv.

Þetta heldur roadmapinu mjög hreinu:

Northern Lights validation
→ Seasonal product/pricing hypothesis
→ Ski Weather demand validation
→ ef validated → Ski scoring/MVP

Og stærri product-hugmyndin sem við fundum í þessari umræðu verður umbrella-stefnan:

Eltum Veðrið fylgir árstíðinni — sama ákvörðunarvélin, mismunandi ástæða til að nota hana.

Ég myndi búa til Seasonal pricing miðann og Ski Weather Discovery miðann núna. Þeir eru báðir orðnir nógu vel afmarkaðir til að eiga heima í roadmapinu.

---

## Expert Support — fundur 2026-10-14

Heimild: Expert Support fundur með Guðrúnu Nínu Petersen hjá Veðurstofu Íslands, 14. október 2026; fundarúrdráttur afhentur af eiganda. Athugasemdir eru endursagnir úr úrdrætti, ekki orðréttar tilvitnanir. Fundurinn er ekki formleg staðfesting Veðurstofunnar á líkani Eltum Veðrið.

### Afmörkuð viðbót (athugasemdir og okkar tillaga aðgreind)

Staða/forgangur haldast Todo/P2. Fundur: 49:21, 51:06. Athugasemdir: takmarkaðar snjódýptarmælingar, mæliaðferð stika; ófundin „blue eitthvað“ síða.

Þegar til: Ski Weather discovery nefnir snjódýpt sem framtíðargagnategund. Tillaga okkar: gagnayfirlit snjódýptar/mæliaðferða/dekkingar/freshness og hvaða vöntun hindrar MVP. Óþekkt síða skráð sem óstaðfest vísbending, ekki uppspunnin vefslóð/provider. Acceptance: mæling vs spálíkans-depth aðgreind og provenance/dekking/leyfi skráð, eða skýrt ekki tiltækt. Prófun: gagnasýnishorn með tíma/einingum og tilvik vantar gögn. Engin ný snow scoring eða snjódýptarfullyrðing á campsite án gagna.

Engar scoring-, veðurfræðilegar þröskulda- eða gagnagjafabreytingar án rannsóknar og sérstakrar samþykktrar útfærslu. Þessi miði heimilar ekki sjálfkrafa provider-skipti eða nýtt áhættulíkan.

Tengd app-wide gagnaveiturannsókn: https://github.com/robertmarvin72/icelandic-weather/issues/450. Snjódýptarhluti Ski Weather heldur sértæku discovery-umfangi sínu.

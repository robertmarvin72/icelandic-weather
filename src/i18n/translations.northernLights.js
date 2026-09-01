export const northernLightsTranslations = {
  en: {
    nlCardTitle: "Northern Lights tonight",
    // #397 Ticket 397: natural copy that explains the feature directly,
    // replacing the awkward "not the main recommendation" framing.
    nlCardSubtitle: "We compare cloud cover and Aurora conditions across a few locations.",
    nlLoading: "Checking conditions…",

    // #398 (Ticket 398): visual-state pill/headline/body — grouped from the
    // precise canonical band via src/lib/auroraVisualState.js. Never a
    // guarantee/probability claim; "gæti sést"/"could be visible" style
    // qualitative phrasing only.
    nlNewBadge: "New",
    nlPillGood: "Good conditions",
    nlHeadlineGood: "Good conditions tonight",
    nlBodyGood: "Skies look favorable for spotting the Aurora tonight.",
    nlCtaGood: "See the best spots",

    nlPillFair: "Fair conditions",
    nlHeadlineFair: "Might be visible with a bit of luck",
    nlBodyFair: "Conditions are mixed — worth a look, but nothing is guaranteed.",
    nlCtaFair: "Check conditions",

    nlPillPoor: "Low chance tonight",
    nlHeadlinePoor: "Little hope tonight",
    nlBodyPoor: "Cloud cover or other conditions make the Aurora unlikely to be visible tonight.",

    nlPillNeutral: "Status unavailable",
    nlHeadlineNeutral: "Aurora status unavailable",
    nlBodyNeutral: "We couldn't determine tonight's Aurora-viewing conditions.",

    // #398: Pro qualifying supporting sentence — keeps the exact canonical
    // best-location name visible while the card is collapsed.
    nlBestTonight: "Best conditions tonight: {name}",

    nlBandExcellent: "Excellent viewing conditions",
    nlBandGood: "Good viewing conditions",
    nlBandFair: "Fair viewing conditions",
    nlBandPoor: "Poor viewing conditions",
    nlBandVeryPoor: "Very poor viewing conditions",

    nlReasonMeaningfulActivity: "Meaningful aurora activity forecast",
    nlReasonLowActivity: "Low aurora activity forecast",
    nlReasonClearSky: "Clear sky",
    nlReasonPartialCloud: "Partly cloudy",
    nlReasonHeavyCloud: "Heavy cloud cover",
    nlReasonCloudHardCap: "Cloud cover is likely to block visibility",
    nlReasonPrecipitation: "Precipitation may reduce visibility",
    nlReasonMoonlight: "Moonlight may reduce visibility",

    nlFreeHint: "Conditions may be worth checking somewhere in Iceland tonight.",
    nlUpgradeCta: "See where and why (Pro)",

    nlHighWindNote: "Windy conditions expected — dress warmly if you go out to look.",

    nlDetailsShow: "See details",
    nlDetailsHide: "Hide details",

    nlViewingWindowLabel: "Viewing window is based on",
    nlNationalReferenceCaveat: "a national darkness estimate, not this exact location.",

    // #397: renamed from nlAlternativesHeading — "checked tonight" implied
    // "all locations checked," which is exactly the framing this ticket
    // removes. Describes actual worthwhile places instead.
    nlQualifyingHeading: "Recommended locations tonight",
    nlSomeExcludedNote: "Some locations could not be checked and are not shown.",

    nlWarningPartial: "Some locations could not be checked tonight.",
    nlWarningStale: "Data was last updated {ago} — it may be out of date.",

    nlAgeLessThanHour: "less than an hour ago",
    nlAgeOneHour: "1 hour ago",
    nlAgeHours: "{hours} hours ago",

    nlNoDarknessTitle: "Not dark enough to check tonight",
    nlNoDarknessBody: "This isn't an error — it's simply too light right now for a meaningful check.",

    // #397: honest no-qualifying-place result — distinct from unavailable/
    // no-darkness/transport/contract-defect. Never implies missing data,
    // danger, or a guaranteed future improvement.
    // #398: the all-poor headline/body now come from the shared "poor"
    // visual-state tokens (nlHeadlinePoor/nlBodyPoor) — all-poor IS the
    // poor visual state (qualifying results are excellent/good/fair only by
    // construction, so there is no separate "qualifying but poor" case).
    // nlAllPoorTitle/nlAllPoorBody were removed as obsolete (no remaining
    // consumer) once this ticket consolidated the two.
    nlAllPoorBestLabel: "Best of the checked options (still poor):",

    nlUnavailableBody: "Northern Lights data isn't available right now.",
    nlContractDefectBody: "Something is temporarily misconfigured with this feature.",
    nlTransportErrorBody: "Couldn't check conditions right now.",
    nlRetry: "Try again",

    nlMapLoading: "Loading map…",
    // #397: MapView's Aurora presentation mode — explicitly labels the
    // dimension shown so it can never be confused with generic 7-day
    // campsite weather (the Höfn contradiction this ticket fixes).
    mapAuroraConditionLabel: "Aurora-viewing conditions",
    mapAuroraLegendTitle: "Aurora-viewing conditions",
  },
  is: {
    nlCardTitle: "Norðurljós í kvöld",
    nlCardSubtitle: "Við berum saman skýjahulu og norðurljósaskilyrði á nokkrum stöðum.",
    nlLoading: "Athuga aðstæður…",

    nlNewBadge: "Nýtt",
    nlPillGood: "Góð skilyrði",
    nlHeadlineGood: "Góð skilyrði í kvöld",
    nlBodyGood: "Himininn lítur vel út til að sjá norðurljós í kvöld.",
    nlCtaGood: "Sjá bestu staðina",

    nlPillFair: "Sæmileg skilyrði",
    nlHeadlineFair: "Gæti sést með smá heppni",
    nlBodyFair: "Skilyrðin eru blönduð — þess virði að athuga, en ekkert er tryggt.",
    nlCtaFair: "Skoða skilyrði",

    nlPillPoor: "Litlar líkur í kvöld",
    nlHeadlinePoor: "Lítil von í kvöld",
    nlBodyPoor: "Skýjahula eða önnur skilyrði gera ólíklegt að norðurljós sjáist í kvöld.",

    nlPillNeutral: "Staða ekki tiltæk",
    nlHeadlineNeutral: "Staða norðurljósa ekki tiltæk",
    nlBodyNeutral: "Við gátum ekki ákvarðað norðurljósaskilyrði kvöldsins.",

    nlBestTonight: "Bestu skilyrðin í kvöld: {name}",

    nlBandExcellent: "Frábærar aðstæður til að sjá norðurljós",
    nlBandGood: "Góðar aðstæður til að sjá norðurljós",
    nlBandFair: "Sæmilegar aðstæður til að sjá norðurljós",
    nlBandPoor: "Slæmar aðstæður til að sjá norðurljós",
    nlBandVeryPoor: "Mjög slæmar aðstæður til að sjá norðurljós",

    nlReasonMeaningfulActivity: "Marktæk norðurljósavirkni í spá",
    nlReasonLowActivity: "Lítil norðurljósavirkni í spá",
    nlReasonClearSky: "Heiðskírt",
    nlReasonPartialCloud: "Hálfskýjað",
    nlReasonHeavyCloud: "Mikil skýjahula",
    nlReasonCloudHardCap: "Skýjahula gæti byrgt sýn algjörlega",
    nlReasonPrecipitation: "Úrkoma gæti skert skyggni",
    nlReasonMoonlight: "Tunglsljós gæti skert skyggni",

    nlFreeHint: "Aðstæður gætu verið þess virði að skoða einhvers staðar á Íslandi í kvöld.",
    nlUpgradeCta: "Sjá hvar og af hverju (Pro)",

    nlHighWindNote: "Búast má við vindasömu veðri — klæddu þig vel ef þú ferð út að skoða.",

    nlDetailsShow: "Sjá nánar",
    nlDetailsHide: "Fela nánar",

    nlViewingWindowLabel: "Skoðunartími byggir á",
    nlNationalReferenceCaveat: "landsviðmiði fyrir myrkur, ekki þessum nákvæma stað.",

    nlQualifyingHeading: "Mælt með þessum stöðum í kvöld",
    nlSomeExcludedNote: "Ekki var hægt að athuga suma staði og þeir birtast því ekki.",

    nlWarningPartial: "Ekki var hægt að athuga alla staði í kvöld.",
    nlWarningStale: "Gögn voru síðast uppfærð fyrir {ago} — þau gætu verið úrelt.",

    nlAgeLessThanHour: "innan við klukkustund",
    nlAgeOneHour: "1 klukkustund",
    nlAgeHours: "{hours} klukkustundum",

    nlNoDarknessTitle: "Ekki nógu dimmt til að athuga í kvöld",
    nlNoDarknessBody: "Þetta er ekki villa — það er einfaldlega of bjart núna til að marktæk athugun sé möguleg.",

    nlAllPoorBestLabel: "Besti af skoðuðum stöðum (samt slæmur):",

    nlUnavailableBody: "Norðurljósagögn eru ekki tiltæk núna.",
    nlContractDefectBody: "Þetta atriði er tímabundið rangstillt.",
    nlTransportErrorBody: "Ekki tókst að athuga aðstæður núna.",
    nlRetry: "Reyna aftur",

    nlMapLoading: "Hleð upp korti…",
    mapAuroraConditionLabel: "Norðurljósaskilyrði",
    mapAuroraLegendTitle: "Norðurljósaskilyrði",
  },
};

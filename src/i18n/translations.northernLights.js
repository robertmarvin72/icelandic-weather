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
    // Ticket 414 (#414): narrow status-pill override for excellent — headline/
    // body/CTA still come from the shared GOOD copy below, unchanged.
    nlPillExcellent: "Excellent conditions",
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

    // Ticket 414 (#414) — short map-legend-only labels, distinct from the
    // descriptive nlBand* labels above (kept unchanged for popups/lists).
    nlLegendExcellent: "Excellent",
    nlLegendGood: "Good",
    nlLegendFair: "Fair",

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

    // Ticket 403 (#403) — landing-only locked-value treatment (variant
    // "landing" on NorthernLightsCard) shown to Free/logged-out visitors in
    // place of nlFreeHint/nlUpgradeCta, only for a qualifying result. Names
    // the four real Pro capabilities truthfully; no invented data, no
    // timing/"best time" claims. nlLandingCtaPrimary/nlLandingCtaNote are
    // reused verbatim by the landing page's own lower conversion section
    // (same keys, same copy, two placements).
    nlLandingLockedHeading: "Pro shows you:",
    nlLandingLockedBestLocation: "Where conditions are best tonight",
    nlLandingLockedAlternatives: "Ranked alternatives nearby",
    nlLandingLockedReasons: "Why each spot ranks — aurora activity & cloud conditions",
    nlLandingLockedMap: "All of it on the map",
    nlLandingCtaPrimary: "Show me where to go tonight",
    nlLandingCtaNote: "Included with Chase the Weather Pro",

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

    // Ticket 416 (#416) — homepage-level off-season fallback for the
    // `/#northern-lights` anchor (App.jsx, outside NorthernLightsCard.jsx).
    // Shown only when isAuroraSeason() is false, so the anchor never lands
    // on an empty div outside September-March.
    nlOffSeasonFallback: "Northern Lights forecasts return in September.",

    // Ticket 416 (#416) — shared cross-page Aurora marketing copy (About,
    // PricingInfo, Pricing). Kept separate from the in-card nl* presentation
    // strings above: these are prose for marketing/info pages, not literal
    // card UI. Reused verbatim wherever the same claim is made, per the
    // approved prompt's "reuse shared translation keys for identical claims"
    // instruction.
    auroraInfoSameAssessment:
      "Free and Pro use the same nightly Northern Lights assessment — Pro reveals more information and comparison, not a better prediction.",
    auroraInfoNoGuarantee: "Good conditions do not guarantee that the Northern Lights will be visible.",
    auroraInfoSeasonalNote:
      "Northern Lights forecasts are shown from September through March, when Iceland has enough darkness for a meaningful check.",

    // Ticket #423 Phase 2 — multi-night (landing three-night forecast).
    // Additive only: none of the keys above are reused/reworded, so the
    // homepage single-night card's copy is completely unchanged. These
    // exist because several homepage strings above hardcode "tonight" and
    // would be actively wrong if reused for a future selected night — see
    // data-audit.md §6's "audit every reused visible string for tonight
    // references" requirement.
    nlMultiSectionTitle: "Northern Lights forecast",
    nlMultiPillPoor: "Low chance",
    nlMultiHeadlineGood: "Good conditions",
    nlMultiBodyGood: "Skies look favorable for spotting the Aurora.",
    nlMultiHeadlinePoor: "Little hope",
    nlMultiBodyPoor: "Cloud cover or other conditions make the Aurora unlikely to be visible.",
    nlMultiBodyNeutral: "We couldn't determine this night's Aurora-viewing conditions.",
    nlMultiBestOn: "Best conditions {when}: {name}",
    nlMultiFreeHint: "Conditions may be worth checking somewhere in Iceland.",
    nlMultiQualifyingHeading: "Recommended locations",
    nlMultiWarningPartial: "Some locations could not be checked for this night.",
    nlMultiNoDarknessTitle: "Not dark enough to check",
    nlMultiLandingLockedBestLocation: "Where conditions are best",
    nlMultiLandingCtaPrimary: "Show me where to go",

    // Night-reference phrases, shared by the selected-night body copy above
    // ({when} placeholders) and the selector tabs below.
    nlWhenTonight: "tonight",
    nlWhenTomorrowNight: "tomorrow night",
    nlWhenWeekdayNight: "{weekday} night",
    nlTabTonight: "Tonight",
    nlTabTomorrow: "Tomorrow night",

    // Cross-night comparison summary (src/lib/auroraMultiNightPolicy.js's
    // states/kinds map 1:1 to these keys).
    nlCompPending: "Comparing the next three nights…",
    nlCompUnavailableAll: "We couldn't determine conditions for the next three nights.",
    nlCompSoleAvailable: "Only {when} has a result right now — the other nights aren't available yet.",
    nlCompIneligible: "We can't reliably compare these nights right now.",
    nlCompAllThreeLowChance: "Low chance across the next three nights.",
    nlCompNoFavorable: "No favorable conditions among the available nights.",
    nlCompBestNight: "Best conditions expected: {when}",
    nlCompSimilar: "Similar conditions expected: {dates}",
    nlCompExactTie: "Conditions are evenly matched: {dates}",
    nlCompSeeNight: "See {when}",

    // Round 5 additions: tab outlook text, data-update line, expired state,
    // and comparison conclusions explicitly limited to available nights.
    nlTabLoading: "Checking…",
    nlTabNoDarkness: "Not dark enough",
    nlTabExpired: "Data expired",
    nlMultiDataUpdated: "Aurora data updated {ago}",
    nlMultiDataUpdatedUnknown: "Aurora data update time unavailable",
    nlMultiExpiredBody: "This Aurora forecast has expired. Refresh to check again.",
    nlCompBestNightScoped: "Best conditions among the available nights: {when}",
    nlCompSimilarScoped: "Similar conditions among the available nights: {dates}",
    nlCompExactTieScoped: "Conditions are evenly matched among the available nights: {dates}",

    // #425: homepage link to the existing English detail page.
    nlHomeDetailsLink: "See full details for this night",
  },
  is: {
    nlCardTitle: "Norðurljós í kvöld",
    nlCardSubtitle: "Við berum saman skýjahulu og norðurljósaskilyrði á nokkrum stöðum.",
    nlLoading: "Athuga aðstæður…",

    nlNewBadge: "Nýtt",
    nlPillExcellent: "Frábær skilyrði",
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

    nlLegendExcellent: "Frábær",
    nlLegendGood: "Góð",
    nlLegendFair: "Sæmileg",

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

    // Ticket 403 (#403) — companion values; the "landing" variant is only
    // ever rendered on the English-locked /en/northern-lights route today,
    // but kept real/translated per this file's established convention.
    nlLandingLockedHeading: "Pro sýnir þér:",
    nlLandingLockedBestLocation: "Besta staðsetningin í kvöld",
    nlLandingLockedAlternatives: "Röðaða valkosti í nágrenninu",
    nlLandingLockedReasons: "Af hverju hver staður raðast — norðurljósavirkni og skýjahula",
    nlLandingLockedMap: "Allt á kortinu",
    nlLandingCtaPrimary: "Sýndu mér hvert ég á að fara í kvöld",
    nlLandingCtaNote: "Innifalið í Chase the Weather Pro",

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

    nlOffSeasonFallback: "Norðurljósaspáin kemur aftur í september.",

    auroraInfoSameAssessment:
      "Free og Pro nota sama kvöldmat á norðurljósum — Pro sýnir meiri upplýsingar og samanburð, ekki betri spá.",
    auroraInfoNoGuarantee: "Góð skilyrði tryggja ekki að norðurljós sjáist.",
    auroraInfoSeasonalNote:
      "Norðurljósaspá er sýnd frá september til mars, þegar nægilegt myrkur er á Íslandi til að gera marktæka athugun.",

    // Ticket #423 Phase 2 — multi-night (landing three-night forecast).
    nlMultiSectionTitle: "Norðurljósaspá",
    nlMultiPillPoor: "Litlar líkur",
    nlMultiHeadlineGood: "Góð skilyrði",
    nlMultiBodyGood: "Himininn lítur vel út til að sjá norðurljós.",
    nlMultiHeadlinePoor: "Lítil von",
    nlMultiBodyPoor: "Skýjahula eða önnur skilyrði gera ólíklegt að norðurljós sjáist.",
    nlMultiBodyNeutral: "Við gátum ekki ákvarðað norðurljósaskilyrði þessa kvölds.",
    nlMultiBestOn: "Bestu skilyrðin {when}: {name}",
    nlMultiFreeHint: "Aðstæður gætu verið þess virði að skoða einhvers staðar á Íslandi.",
    nlMultiQualifyingHeading: "Mælt með þessum stöðum",
    nlMultiWarningPartial: "Ekki var hægt að athuga alla staði þetta kvöld.",
    nlMultiNoDarknessTitle: "Ekki nógu dimmt til að athuga",
    nlMultiLandingLockedBestLocation: "Hvar aðstæður eru bestar",
    nlMultiLandingCtaPrimary: "Sýndu mér hvert ég á að fara",

    nlWhenTonight: "í kvöld",
    nlWhenTomorrowNight: "annað kvöld",
    nlWhenWeekdayNight: "{weekday}kvöld",
    nlTabTonight: "Í kvöld",
    nlTabTomorrow: "Annað kvöld",

    nlCompPending: "Ber saman næstu þrjár nætur…",
    nlCompUnavailableAll: "Við gátum ekki ákvarðað aðstæður fyrir næstu þrjár nætur.",
    nlCompSoleAvailable: "Aðeins {when} er með niðurstöðu núna — hinar næturnar eru ekki tiltækar enn.",
    nlCompIneligible: "Við getum ekki borið þessar nætur saman með vissu núna.",
    nlCompAllThreeLowChance: "Litlar líkur næstu þrjár nætur.",
    nlCompNoFavorable: "Engin hagstæð skilyrði meðal tiltækra nátta.",
    nlCompBestNight: "Bestu skilyrðin: {when}",
    nlCompSimilar: "Svipaðra skilyrða að vænta: {dates}",
    nlCompExactTie: "Skilyrðin eru jöfn: {dates}",
    nlCompSeeNight: "Sjá {when}",

    nlTabLoading: "Athuga…",
    nlTabNoDarkness: "Ekki nógu dimmt",
    nlTabExpired: "Gögn útrunnin",
    nlMultiDataUpdated: "Norðurljósagögn uppfærð fyrir {ago}",
    nlMultiDataUpdatedUnknown: "Uppfærslutími norðurljósagagna ekki tiltækur",
    nlMultiExpiredBody: "Þessi norðurljósaspá er útrunnin. Endurnýjaðu til að athuga aftur.",
    nlCompBestNightScoped: "Bestu skilyrðin meðal tiltækra nátta: {when}",
    nlCompSimilarScoped: "Svipuð skilyrði meðal tiltækra nátta: {dates}",
    nlCompExactTieScoped: "Skilyrðin eru jöfn meðal tiltækra nátta: {dates}",

    nlHomeDetailsLink: "Sjá nánar á ensku síðunni",
  },
};

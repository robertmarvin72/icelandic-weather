export const routePlannerTranslations = {
  en: {
    routeReasonRainStreak: "Less rain streak penalty",
    routeReasonGust: "Calmer gust conditions",
    routeReasonWind: "Lower wind impact",
    routeReasonRain: "Less rainfall",
    routeReasonTmax: "Warmer days",

    routeVerdictStayTitle: "Stay put",
    routeVerdictStayBody: "Conditions nearby do not look meaningfully better.",

    routeVerdictConsiderTitle: "Consider moving",
    routeVerdictConsiderBody: "There may be a slightly better option nearby.",

    routeVerdictMoveTitle: "Move camp",
    routeVerdictMoveBody: "There appears to be a clearly better option nearby.",

    routePlannerTitle: "Route Planner",
    routePlannerSelectBase:
      "Select a campsite (or use your location) to see if better weather may be nearby.",
    routePlannerBaseLabel: "Base",
    routePlannerRadius: "Travel radius",
    routePlannerWindowDays: "Window (days)",
    routePlannerWetThreshold: "Wet day threshold",
    previewPill: "Preview",
    routePlannerBestTomorrow: "Best nearby option tomorrow",
    routePlannerPreviewBody:
      "CampCast looks at nearby campsites and highlights where weather conditions may be better tomorrow. \n\nWith Pro you can search a larger area, explore more days and see detailed comparisons.",
    routePlannerPreviewNoBetter:
      "No clearly better option was found within 30 km tomorrow. Pro searches a larger area and more days.",
    routePlannerCandidatesPreselected: "Nearby campsites checked",
    routePlannerCandidatesScored: "Scored",
    routePlannerTopAlternatives: "Nearby alternatives",
    routePlannerNoAlternatives: "No clearly better nearby options found.",
    routePlannerNoReasons: "No clear reasons available yet.",

    routePlannerLockedBody:
      "Unlock Route Planner to see when nearby campsites may offer better weather.",

    routePlannerBaseForecastMissing: "Missing forecast for the selected base campsite.",
    routePlannerAlternativesCount: "Alternatives evaluated",
    routePlannerMinimalDifference: "Weather conditions are very similar.",

    routePlannerTrendMove: "Conditions look clearly better over the next {days} days.",
    routePlannerTrendMoveWithReasons:
      "Conditions look clearly better over the next {days} days — mainly because of: {reasons}.",

    routePlannerTrendConsider:
      "It may be worth moving over the next {days} days, but the weather difference is small.",
    routePlannerTrendConsiderWithReasons:
      "It may be worth moving over the next {days} days — mainly because of: {reasons}.",

    routePlannerTrendStay: "No nearby location looks noticeably better over the next {days} days.",

    routeDetailsComparedTo: "Compared to",
    routeDetailsDelta: "Difference",
    routeDetailsWhy: "Why this looks better",
    routeDetailsNoReasons: "No explanation data available.",
    routeDetailsDayByDay: "Day by day",
    routeDetailsNoDays: "No day breakdown available.",
    routeDetailsDate: "Date",
    routeDetailsBasePts: "Base pts",
    routeDetailsCandPts: "Option pts",
    routeDetailsWindPen: "Wind penalty",
    routeDetailsGustPen: "Gust penalty",
    routeDetailsRainPen: "Rain penalty",
    routeDetailsStreakPen: "Rain streak penalty",
    routeDetailsShelter: "Shelter",
    routeDetailsOpenHint: "Open details",
    routeBase: "Base",

    routeReason_wind: "Lower wind penalty",
    routeReason_gust: "Lower gust penalty",
    routeReason_rain: "Lower rain penalty",
    routeReason_rainStreak: "Fewer rainy days in a row",
    routeReason_shelter: "More shelter",
    routeReason_temp: "Warmer daytime temperatures",
    routeReason_tmax: "Warmer daytime temperatures",
    routeReason_score: "Higher overall weather score",

    routeImproveNone: "Minimal difference",
    routeImproveSlight: "Slightly better",
    routeImproveBetter: "Better",
    routeImproveMuchBetter: "Much better",

    routeDayBetter: "Better",
    routeDaySame: "Similar",
    routeDayWorse: "Worse",

    routeDetailsShowAdvanced: "Show scoring details",
    routeDetailsHideAdvanced: "Hide scoring details",

    routeDayBetterSingular: "better day",
    routeDayBetterPlural: "better days",

    routeDaySameSingular: "similar day",
    routeDaySamePlural: "similar days",

    routeDayWorseSingular: "worse day",
    routeDayWorsePlural: "worse days",

    routeOverallResult: "Overall result for the selected days",
    routeOverallNote: "Some individual days may still be worse or similar.",
    routeDetailsPositiveDrivers: "Main reasons",

    routeOverallNextNDays: "next",
    routeOverallDays: "days",
    routeOverallTotalDelta: "Overall difference",
    routeOverallSeeBreakdown: "see breakdown",

    routeDecisionCounts: "{better} better days, {same} similar, {worse} worse.",
    routePlannerTopAlternativesNoBetter:
      "Nearby options (none clearly better over the next {days} days)",

    routeDaysBetter: "better days",
    routeDaysSame: "similar",
    routeDaysWorse: "worse",

    routeDetailsTempBase: "Temperature base",

    routeAdaptiveRadiusUsed: "Searched out to {used} km (max {max} km)",
    routeAdaptiveFoundBeyond:
      "No better option within {prev} km — but found a better one within {used} km.",
    routeAdaptiveNoBetterWithin: "No better option found within {used} km (max {max} km).",
    routeAdaptiveUsedShort: "Searched up to",

    routeWarningHigh: "Dangerous weather",
    routeWarning: "Weather alert",
    routeDetailsWarnings: "Warnings",

    routeCompareDay: "Day",
    routeCompareBase: "Current",
    routeCompareCandidate: "Option",
    routeCompareDiff: "Difference",
    routeCompareWhy: "Why",
    routeCompareNoWarnings: "No warnings",
    routeCompareReasonLessSevere: "Less severe weather",
    routeCompareReasonClearer: "Fewer warnings",
    routeCompareReasonStillBad: "Still rough",
    routeCompareReasonSimilar: "Similar warnings",
    routeCompareReasonWorse: "More warnings",
    routeCompareReasonGeneral: "Better conditions",

    routeWarnTypeWind: "Wind",
    routeWarnTypeGust: "Gusts",
    routeWarnTypeRain: "Rain",
    routeWarnTypeTempLow: "Cold",
    routeWarnTypeTempHigh: "Heat",

    routeCompareReasonHighHazard: "Dangerous weather",
    routeCompareReasonWarnHazard: "Weather warning",
    routeCompareReasonNoHazards: "No warnings",

    routeCompareDiffNA: "—",
    routeCompareBaseNoDataTip: "Warnings for the current campsite are not available yet.",

    routeAggregateSlight: "Slightly better weather",

    routeDetailsRequiredDelta: "Required improvement for this distance",
    routeDetailsHazardImproved: "Lower weather risk here than at your current campsite",
    routeImproveSlightWorse: "Slightly worse",
    routeDetailsRawHint:
      "Scores shown as 0.0 can still hide a real difference when both values appear as 0 or 10.",
    routeCompareReasonBetterDespiteWarning: "Better conditions despite a warning",

    routeHazardBlockerStay: "A high-risk weather day blocks a move recommendation.",
    routeHazardBlockerConsider: "A rough-weather day weakens this recommendation.",
    routeHazardBlockerShort: "Weather risk lowered this result.",

    routeRoughWeatherWindowSingle: "⚠ Rough weather may affect {date}.",
    routeRoughWeatherWindowRange: "⚠ Rough weather window: {start} → {end} ({days} days).",

    routeStayReasonHazard: "Weather risk elsewhere makes moving less advisable.",
    routeStayReasonSmallDifference: "The difference is too small to make moving worthwhile.",
    routeStayReasonAlreadyBest: "You are likely already in one of the better nearby spots.",
    routeStayGoodSpot: "Reasonable place to stay.",

    routeEscapeStormTitle: "🚐 Escape the storm",
    routeEscapeStormBody: "Better conditions may be available nearby.",
    routeEscapeStormDestination: "{km} km → {site}",
    routeEscapeStormBaseWindow: "Hazardous weather may affect {place}.",
    routeEscapeStormCalmerNearby: "Calmer conditions may be available nearby.",

    routeRiskLabel: "Route risk",
    routeRiskLow: "Low",
    routeRiskMed: "Moderate",
    routeRiskHigh: "High",

    routeRiskTomorrow: "Weather on the route tomorrow",

    routeRiskMaxWind: "Maximum wind",
    routeRiskMaxGust: "Maximum gust",
    routeRiskBasedOn: "Based on forecast wind and gust conditions along the route.",

    routeRiskAffectsDecision: "Driving conditions may affect this recommendation.",

    routeRiskHighTooltip: "Difficult driving conditions may occur along the route.",
    routeRiskMedTooltip: "Wind may affect driving conditions along the route.",

    routeDisclaimerTitle: "Route Planner disclaimer",

    routeDisclaimerBody1:
      "Route Planner uses weather forecasts to estimate conditions along travel routes and at nearby campsites.",

    routeDisclaimerBody2:
      "Weather in Iceland can change rapidly and actual conditions may differ from what is shown in the app.",

    routeDisclaimerBody3:
      "CampCast provides informational guidance only. Users remain responsible for their own travel decisions.",

    routeDisclaimerConfirm: "I understand",

    routeHazardWindowPassingStorm: "A short passing storm is expected.",
    routeHazardWindowRoughWeather: "Rough weather may persist for several hours.",
    routeHazardWindowStormyPeriod: "A longer stormy period is expected in this window.",

    routeNarrativeBetterNearby: "Better conditions may be nearby: {destination}.",
    routeNarrativeRouteRiskHigh: "Road conditions on the way may currently be difficult.",
    routeNarrativeRouteRiskMed: "Road conditions on the way may be somewhat difficult.",

    routePlannerValue: "Find better weather nearby before you move.",

    decisionConsiderTitle: "Consider moving",
    decisionConsiderBody: "Better weather is likely at {site}.",
    decisionConsiderBodyWindowAware:
      "Slightly better conditions may be available at {site} over the next few days.",

    decisionStayTitle: "Stay put for now",
    decisionStayBodyGood: "Conditions aren’t great, but no nearby option clearly looks better.",
    decisionStayBodyRough: "Weather won't be perfect, but no nearby option clearly looks better.",
  },
  is: {
    routeReasonRainStreak: "Minni rigningarruna",
    routeReasonGust: "Minni vindhviður",
    routeReasonWind: "Minni vindáhrif",
    routeReasonRain: "Minni úrkoma",
    routeReasonTmax: "Hlýrri dagar",

    routeVerdictStayTitle: "Best að vera kyrr í bili",
    routeVerdictStayBody:
      "Aðstæður í nágrenninu virðast ekki nógu mikið betri til að það borgi sig að færa sig.",

    routeVerdictConsiderTitle: "Íhugaðu að færa þig",
    routeVerdictConsiderBody: "Það gæti verið aðeins betri kostur í nágrenninu.",

    routeVerdictMoveTitle: "Færðu þig",
    routeVerdictMoveBody: "Það virðist vera greinilega betri kostur í nágrenninu.",

    routePlannerTitle: "Ferðaráðgjafi",
    routePlannerSelectBase:
      "Veldu tjaldsvæði (eða notaðu staðsetningu) til að sjá hvort betra veður gæti verið í nágrenninu.",
    routePlannerBaseLabel: "Grunnstaður",
    routePlannerRadius: "Ferðafjarlægð",
    routePlannerWindowDays: "Gluggi (dagar)",
    routePlannerWetThreshold: "Votur dagur (viðmið)",
    previewPill: "Forsýn",
    routePlannerBestTomorrow: "Besti kostur í nágrenninu á morgun",
    routePlannerPreviewBody:
      "CampCast ber saman nærliggjandi tjaldsvæði og bendir á þegar veðuraðstæður gætu verið betri annars staðar.\n\nMeð Pro geturðu skoðað stærra svæði, fleiri daga og séð nánari samanburð.",
    routePlannerPreviewNoBetter:
      "Enginn greinilega betri kostur fannst innan 30 km á morgun. Pro leitar á stærra svæði og yfir fleiri daga.",
    routePlannerCandidatesPreselected: "Skoðuð svæði í kringum þig",
    routePlannerCandidatesScored: "Metið",
    routePlannerTopAlternatives: "Valkostir í nágrenninu",
    routePlannerNoAlternatives: "Engir greinilega betri valkostir fundust í nágrenninu.",
    routePlannerNoReasons: "Engar skýrar ástæður tiltækar ennþá.",

    routePlannerLockedBody:
      "Opnaðu Ferðaráðgjafa til að sjá hvenær betra veður gæti verið á nærliggjandi tjaldsvæðum.",

    routePlannerBaseForecastMissing: "Vantar veðurspá fyrir valið tjaldsvæði.",
    routePlannerAlternativesCount: "Metin svæði",
    routePlannerMinimalDifference: "Veðuraðstæður eru mjög svipaðar.",

    routePlannerTrendMove: "Aðstæður líta greinilega betur út næstu {days} daga.",
    routePlannerTrendMoveWithReasons:
      "Aðstæður líta greinilega betur út næstu {days} daga — helst vegna: {reasons}.",

    routePlannerTrendConsider:
      "Það gæti borgað sig að færa sig næstu {days} daga, en veðurmunurinn er ekki mikill.",
    routePlannerTrendConsiderWithReasons:
      "Það gæti borgað sig að færa sig næstu {days} daga — helst vegna: {reasons}.",

    routePlannerTrendStay:
      "Það lítur ekki út fyrir að neinn staður í nágrenninu verði greinilega betri næstu {days} daga.",
    routeDetailsComparedTo: "Borið saman við",
    routeDetailsDelta: "Mismunur",
    routeDetailsWhy: "Af hverju þetta lítur betur út",
    routeDetailsNoReasons: "Engin skýringargögn tiltæk.",
    routeDetailsDayByDay: "Dag-fyrir-dag",
    routeDetailsNoDays: "Engin dagleg sundurliðun tiltæk.",
    routeDetailsDate: "Dagsetning",
    routeDetailsBasePts: "Grunnstig",
    routeDetailsCandPts: "Stig valkosts",
    routeDetailsWindPen: "Vindrefsing",
    routeDetailsGustPen: "Hviðurefsing",
    routeDetailsRainPen: "Rigningarrefsing",
    routeDetailsStreakPen: "Rigning í röð refsing",
    routeDetailsShelter: "Skjól",
    routeDetailsOpenHint: "Sjá nánar",
    routeBase: "Grunnstaður",

    routeReason_wind: "Minni vindrefsing",
    routeReason_gust: "Minni hviðurefsing",
    routeReason_rain: "Minni rigningarrefsing",
    routeReason_rainStreak: "Færri rigningardagar í röð",
    routeReason_shelter: "Meira skjól",
    routeReason_temp: "Hlýrra yfir daginn",
    routeReason_tmax: "Hlýrra yfir daginn",
    routeReason_score: "Hærra heildarveðurskor",

    routeImproveNone: "Lítill munur",
    routeImproveSlight: "Örlítið betra",
    routeImproveBetter: "Betra",
    routeImproveMuchBetter: "Miklu betra",

    routeDayBetter: "Betra",
    routeDaySame: "Svipað",
    routeDayWorse: "Lakara",

    routeDetailsShowAdvanced: "Sýna stig og sundurliðun",
    routeDetailsHideAdvanced: "Fela stig og sundurliðun",

    routeDayBetterSingular: "dagur betri",
    routeDayBetterPlural: "dagar betri",

    routeDaySameSingular: "dagur svipaður",
    routeDaySamePlural: "dagar svipaðir",

    routeDayWorseSingular: "dagur verri",
    routeDayWorsePlural: "dagar verri",

    routeOverallResult: "Heildarniðurstaða næstu daga",
    routeOverallNote: "Sumir dagar geta samt verið lakari eða svipaðir.",
    routeDetailsPositiveDrivers: "Helstu ástæður",

    routeOverallNextNDays: "næstu",
    routeOverallDays: "daga",
    routeOverallTotalDelta: "Heildarmismunur",
    routeOverallSeeBreakdown: "sjá sundurliðun",

    routeDecisionCounts: "{better} dagar betri, {same} svipaðir, {worse} verri.",
    routePlannerTopAlternativesNoBetter:
      "Nálægir valkostir (engir greinilega betri næstu {days} daga)",

    routeDaysBetter: "dagar betri",
    routeDaysSame: "svipaðir",
    routeDaysWorse: "verri",

    routeDetailsTempBase: "Hita-grunnur",

    routeAdaptiveRadiusUsed: "Leitaði út í {used} km (max {max} km)",
    routeAdaptiveFoundBeyond:
      "Enginn betri kostur fannst innan {prev} km — en betri kostur fannst innan {used} km.",
    routeAdaptiveNoBetterWithin: "Enginn betri kostur fannst innan {used} km (max {max} km).",
    routeAdaptiveUsedShort: "Leitað út í",

    routeWarningHigh: "Hættuveður",
    routeWarning: "Veðurviðvörun",

    routeDetailsWarnings: "Viðvaranir",

    routeCompareDay: "Dagur",
    routeCompareBase: "Núverandi",
    routeCompareCandidate: "Valkostur",
    routeCompareDiff: "Munur",
    routeCompareWhy: "Af hverju",
    routeCompareNoWarnings: "Engar viðvaranir",
    routeCompareReasonLessSevere: "Minni hætta",
    routeCompareReasonClearer: "Færri viðvaranir",
    routeCompareReasonStillBad: "Enn slæmt veður",
    routeCompareReasonSimilar: "Svipaðar viðvaranir",
    routeCompareReasonWorse: "Fleiri viðvaranir",
    routeCompareReasonGeneral: "Betri aðstæður",

    routeWarnTypeWind: "Vindur",
    routeWarnTypeGust: "Hviður",
    routeWarnTypeRain: "Rigning",
    routeWarnTypeTempLow: "Kuldi",
    routeWarnTypeTempHigh: "Hiti",

    routeCompareReasonHighHazard: "Hættuveður",
    routeCompareReasonWarnHazard: "Veðurviðvörun",
    routeCompareReasonNoHazards: "Engar viðvaranir",
    routeCompareDiffNA: "—",
    routeCompareBaseNoDataTip: "Viðvaranir fyrir núverandi tjaldsvæði eru ekki tiltækar ennþá.",
    routeAggregateSlight: "Örlítið betra veður",

    routeDetailsRequiredDelta: "Lágmarksbæting miðað við fjarlægð",
    routeDetailsHazardImproved: "Minni veðuráhætta hér en á núverandi stað",
    routeImproveSlightWorse: "Örlítið lakara",
    routeDetailsRawHint:
      "0.0 stig geta samt falið raunverulegan mun þegar bæði gildi birtast sem 0 eða 10.",
    routeCompareReasonBetterDespiteWarning: "Betri aðstæður þrátt fyrir viðvörun",

    routeHazardBlockerStay: "Dagur með slæmu veðri kemur í veg fyrir flutningsráðleggingu.",
    routeHazardBlockerConsider: "Dagur með slæmu veðri veikir þessa ráðleggingu.",
    routeHazardBlockerShort: "Veðuráhætta dró úr niðurstöðunni.",

    routeRoughWeatherWindowSingle: "⚠ Slæmt veður gæti haft áhrif {date}.",
    routeRoughWeatherWindowRange:
      "⚠ Slæmt veður gæti verið framundan: {start} → {end} ({days} dagar).",

    routeStayReasonHazard: "Veðuráhætta annars staðar gerir flutning síður ráðlegan.",
    routeStayReasonSmallDifference: "Munurinn er of lítill til að það borgi sig að færa sig.",
    routeStayReasonAlreadyBest: "Þú ert líklega nú þegar á einum af betri stöðunum í nágrenninu.",
    routeStayGoodSpot: "Ágætur staður til að vera á.",

    routeEscapeStormTitle: "🚐 Forðastu óveðrið",
    routeEscapeStormBody: "Betri aðstæður gætu verið í nágrenninu.",
    routeEscapeStormDestination: "{km} km → {site}",
    routeEscapeStormBaseWindow: "Slæmt veður gæti haft áhrif á {place}.",
    routeEscapeStormCalmerNearby: "Rólegra veður gæti verið í nágrenninu.",

    routeRiskLabel: "Áhætta á leið",
    routeRiskLow: "Lág",
    routeRiskMed: "Miðlungs",
    routeRiskHigh: "Há",

    routeRiskTomorrow: "Veður á leiðinni á morgun",

    routeRiskMaxWind: "Hámarksvindur",
    routeRiskMaxGust: "Hámarkshviða",

    routeRiskBasedOn: "Byggt á spáðri vind- og hviðustyrk á leiðinni.",

    routeRiskAffectsDecision: "Akstursaðstæður geta haft áhrif á þessa ráðleggingu.",

    routeRiskHighTooltip: "Erfiðar akstursaðstæður geta komið upp á leiðinni.",
    routeRiskMedTooltip: "Vindur gæti haft áhrif á akstur á leiðinni.",

    routeDisclaimerTitle: "Fyrirvari fyrir Ferðaráðgjafa",

    routeDisclaimerBody1:
      "Ferðaráðgjafinn notar veðurspár til að meta aðstæður á ferðaleiðum og nálægum tjaldsvæðum.",

    routeDisclaimerBody2:
      "Veður á Íslandi getur breyst hratt og raunverulegar aðstæður geta verið frábrugðnar því sem birtist í appinu.",

    routeDisclaimerBody3:
      "CampCast veitir eingöngu upplýsingar til viðmiðunar. Notendur bera sjálfir ábyrgð á eigin ferðarákvörðunum.",

    routeDisclaimerConfirm: "Ég skil",

    routeHazardWindowPassingStorm: "Stuttur veðurskafli gæti gengið yfir.",
    routeHazardWindowRoughWeather: "Slæmt veður gæti staðið yfir í nokkrar klukkustundir.",
    routeHazardWindowStormyPeriod: "Lengra stormaskeið er líklegt á þessu tímabili.",

    routeNarrativeBetterNearby: "Betri aðstæður gætu verið í nágrenninu: {destination}.",
    routeNarrativeRouteRiskHigh: "Aðstæður á leiðinni gætu þó verið erfiðar núna.",
    routeNarrativeRouteRiskMed: "Aðstæður á leiðinni gætu verið aðeins erfiðar.",

    routePlannerValue: "Finndu betra veður í nágrenninu áður en þú færir þig.",

    decisionConsiderTitle: "Íhugaðu að færa þig",
    decisionConsiderBody: "Betra veður er líklegt hjá {site}.",
    decisionConsiderBodyWindowAware: "Aðeins betri aðstæður gætu verið hjá {site} næstu daga.",

    decisionStayTitle: "Best að vera kyrr í bili",
    decisionStayBodyGood:
      "Aðstæður eru ekki frábærar, en enginn nálægur staður lítur greinilega betur út.",
    decisionStayBodyRough:
      "Veðrið verður ekki fullkomið, en enginn nálægur valkostur virðist vera greinilega betri.",
  },
};

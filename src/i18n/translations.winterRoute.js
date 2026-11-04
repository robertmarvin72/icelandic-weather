// src/i18n/translations.winterRoute.js
//
// Ticket #486 — Rauðavatn–Vík winter road + forecast page. All user-facing
// text for /winter-route lives here (never hardcoded in the component).

export const winterRouteTranslations = {
  en: {
    footerWinterRoute: "Rauðavatn–Vík road status",

    winterRouteTitle: "Rauðavatn–Vík",
    winterRouteSubtitle: "Road conditions now and forecast along the route",
    winterRouteLatestStatusNote: "Latest available status, not a forecast of road conditions.",

    winterRouteHourLabel: "Estimated departure time",
    winterRouteNoHoursAvailable: "No upcoming time is available right now.",

    winterRouteForecastSectionTitle: "Forecast at six points along the route",
    winterRouteRoadSectionTitle: "Road conditions and closures",

    winterRouteCategoryPassable: "Passable",
    winterRouteCategoryHazardNotice: "Caution — notice",
    winterRouteCategoryOutOfService: "Out of service",
    winterRouteCategoryImpassable: "Impassable",
    winterRouteCategoryClosed: "Closed",
    winterRouteCategoryUnknownUnclassified: "Unknown condition",

    winterRouteExportStale: "This status export may be outdated.",
    winterRouteRegistrationOld: "This section's registration is more than a day old.",
    winterRouteSegmentDataUnavailable: "No road data available for this section.",
    winterRouteRoadFeedUnavailable: "Road-condition data is currently unavailable.",
    winterRouteRoadStaleServed: "Showing the last known status ({minutes} min old).",
    winterRoutePointsFeedUnavailable:
      "Closure and roadworks notices are currently unavailable — confirm with Vegagerðin (the Icelandic Road Administration).",

    winterRouteNoticeActive: "Active notice",
    winterRouteNoticeExpired: "Expired notice — confirm with Vegagerðin (the Icelandic Road Administration)",
    winterRouteNoticeUnknownValidity: "Unknown validity period",
    winterRouteExpiredClosureNoticeProminent: "Expired closure notice — confirm with Vegagerðin",

    winterRouteForecastUnavailable: "Forecast unavailable.",
    winterRouteForecastStaleServed: "Showing the last known forecast ({minutes} min old).",
    winterRoutePointUnavailable: "No forecast data available for this point.",
    winterRouteEstimatedArrival: "Estimated arrival: {time} UTC",
    winterRouteForecastNotAvailableAtComputedTime: "Forecast not available",
    winterRouteGridDisclaimer: "A forecast grid point from a weather model — not a direct measurement on the road.",
    winterRouteValidFor: "Valid for {time} UTC",
    winterRouteTemperature: "Temperature",
    winterRouteWind: "Wind",
    winterRouteGust: "Gusts (max, previous hour)",
    winterRoutePrecip: "Precipitation (previous hour)",
    winterRouteUnknownWeatherSymbol: "Unknown weather symbol",

    // #489 — route-level summary (max gust/precip, min temp among the six
    // points at their own already-resolved ETA hour; count of segments
    // with a currently active point notice). Gust/precip wording
    // deliberately repeats the same "(max, previous hour)"/"(previous
    // hour)" period phrasing as winterRouteGust/winterRoutePrecip above.
    winterRouteSummaryHeading: "Along the route now",
    winterRouteSummaryGust: "Highest gusts (max, previous hour): {value} m/s — {point}, {time} UTC",
    winterRouteSummaryGustMissing: "Highest gusts: data not available",
    winterRouteSummaryPrecip: "Most precipitation (previous hour): {value} mm — {point}, {time} UTC",
    winterRouteSummaryPrecipMissing: "Most precipitation: data not available",
    winterRouteSummaryMinTemp: "Lowest temperature: {value} °C — {point}, {time} UTC",
    winterRouteSummaryMinTempMissing: "Lowest temperature: data not available",
    winterRouteSummaryPartialSuffix: " (based on {count} of 6 points)",
    winterRouteSummaryNoticeCount: "Sections with valid notices: {count}",
    winterRouteSummaryNoticeCountUnconfirmed: "The count of sections with valid notices is unconfirmed right now.",
    winterRouteSummaryNoticeScope: "Not the overall road condition — see the road-condition list below.",

    // #490 — departure-time comparison (−2h / selected / +2h), reusing
    // #489's own extrema per option. Reason strings are a fixed, closed
    // set (S1b) — never an internal code leaking into the UI.
    winterRouteComparisonHeading: "Departure time comparison",
    winterRouteComparisonBaselineLabel: "Selected departure time",
    winterRouteComparisonEarlierLabel: "2 hours earlier",
    winterRouteComparisonLaterLabel: "2 hours later",
    winterRouteComparisonViewButton: "View this time",
    winterRouteComparisonSelectedBadge: "Currently selected",
    winterRouteComparisonRoadNote:
      "Road conditions and closures show the latest available status — not a forecast for these options.",
    winterRouteComparisonSelectedAnnouncement: "Selected departure time is now {time} UTC.",
    winterRouteComparisonReasonNotUpcoming: "This time has passed or is outside the available departure times.",
    winterRouteComparisonReasonArrivalOutsideWindow:
      "At least one point's estimated arrival falls outside the fetched forecast window; the comparison needs all six points.",
    winterRouteComparisonReasonPointUnavailable:
      "Data is missing for at least one of the six points; the comparison needs all six points.",
    winterRouteComparisonReasonMetricGap:
      "The comparison needs a value for all six points; a data gap prevents it right now.",

    winterRouteAttributionRoadLine:
      "Road-condition and closure data: Vegagerðin (the Icelandic Road Administration), CC BY 4.0.",
    winterRouteAttributionWeatherLine: "Weather forecast data: Open-Meteo.",
    winterRouteModifiedBy: "Modified/interpreted by Chase the Weather.",
    winterRouteNoEndorsement: "No endorsement by the data providers is implied.",
    winterRouteOfficialOverride: "Official closures always take precedence over this automated data.",
    winterRouteNotSafetyAdvice: "This is not safety advice and does not forecast future road conditions.",
    winterRouteOfficialSourceLinkRoad: "View road conditions at Vegagerðin",
    winterRouteOfficialSourceLinkWeather: "Open-Meteo licence and terms",
    winterRouteAcquiredAt: "Road data acquired: {time} UTC",
  },

  is: {
    footerWinterRoute: "Færð Rauðavatn–Vík",

    winterRouteTitle: "Rauðavatn–Vík",
    winterRouteSubtitle: "Færð núna og veðurspá á leiðinni",
    winterRouteLatestStatusNote: "Nýjasta tiltæka staða, ekki spáð færð.",

    winterRouteHourLabel: "Áætlaður brottfarartími",
    winterRouteNoHoursAvailable: "Engin framtíðartími er tiltækur núna.",

    winterRouteForecastSectionTitle: "Veðurspá á sex punktum á leiðinni",
    winterRouteRoadSectionTitle: "Færð og lokanir",

    winterRouteCategoryPassable: "Greiðfært",
    winterRouteCategoryHazardNotice: "Aðgát – tilkynning",
    winterRouteCategoryOutOfService: "Ekki í þjónustu",
    winterRouteCategoryImpassable: "Ófært",
    winterRouteCategoryClosed: "Lokað",
    winterRouteCategoryUnknownUnclassified: "Óþekkt ástand",

    winterRouteExportStale: "Þessi færðarútflutningur gæti verið úreltur.",
    winterRouteRegistrationOld: "Skráning þessa kafla er eldri en sólarhringur.",
    winterRouteSegmentDataUnavailable: "Engin færðargögn tiltæk fyrir þennan kafla.",
    winterRouteRoadFeedUnavailable: "Færðargögn eru ekki tiltæk sem stendur.",
    winterRouteRoadStaleServed: "Sýnir síðustu þekktu stöðu ({minutes} mín. gömul).",
    winterRoutePointsFeedUnavailable:
      "Tilkynningar um lokanir og vegavinnu eru ekki tiltækar núna – staðfestu hjá Vegagerðinni.",

    winterRouteNoticeActive: "Tilkynning í gildi",
    winterRouteNoticeExpired: "Útrunnin tilkynning – staðfestu hjá Vegagerðinni",
    winterRouteNoticeUnknownValidity: "Óþekktur gildistími",
    winterRouteExpiredClosureNoticeProminent: "Útrunnin lokunartilkynning — staðfestu hjá Vegagerðinni",

    winterRouteForecastUnavailable: "Veðurspá er ekki tiltæk.",
    winterRouteForecastStaleServed: "Sýnir síðustu þekktu spá ({minutes} mín. gamla).",
    winterRoutePointUnavailable: "Engin spágögn tiltæk fyrir þennan punkt.",
    winterRouteEstimatedArrival: "Áætluð koma: {time} UTC",
    winterRouteForecastNotAvailableAtComputedTime: "Spá ekki tiltæk",
    winterRouteGridDisclaimer: "Punktspá úr veðurlíkani — ekki bein mæling á vegi.",
    winterRouteValidFor: "Gildir fyrir {time} UTC",
    winterRouteTemperature: "Hiti",
    winterRouteWind: "Vindur",
    winterRouteGust: "Hviður (hámark síðustu klukkustundar)",
    winterRoutePrecip: "Úrkoma (síðasta klukkustund)",
    winterRouteUnknownWeatherSymbol: "Óþekkt veðurtákn",

    // #489 — sjá samsvarandi EN athugasemd að ofan.
    winterRouteSummaryHeading: "Á leiðinni núna",
    winterRouteSummaryGust: "Mestar hviður (hámark síðustu klukkustundar): {value} m/s — {point}, {time} UTC",
    winterRouteSummaryGustMissing: "Mestar hviður: gögn ekki tiltæk",
    winterRouteSummaryPrecip: "Mest úrkoma (síðasta klukkustund): {value} mm — {point}, {time} UTC",
    winterRouteSummaryPrecipMissing: "Mest úrkoma: gögn ekki tiltæk",
    winterRouteSummaryMinTemp: "Lægsti hiti: {value} °C — {point}, {time} UTC",
    winterRouteSummaryMinTempMissing: "Lægsti hiti: gögn ekki tiltæk",
    winterRouteSummaryPartialSuffix: " (byggt á {count} af 6 punktum)",
    winterRouteSummaryNoticeCount: "Kaflar með gildar tilkynningar: {count}",
    winterRouteSummaryNoticeCountUnconfirmed: "Fjöldi kafla með gildar tilkynningar er óstaðfestur núna.",
    winterRouteSummaryNoticeScope: "Ekki heildarstaða færðar — sjá færðarlistann neðar.",

    // #490 — sjá samsvarandi EN athugasemd að ofan.
    winterRouteComparisonHeading: "Samanburður brottfarartíma",
    winterRouteComparisonBaselineLabel: "Valinn brottfarartími",
    winterRouteComparisonEarlierLabel: "2 klst. fyrr",
    winterRouteComparisonLaterLabel: "2 klst. síðar",
    winterRouteComparisonViewButton: "Skoða þennan tíma",
    winterRouteComparisonSelectedBadge: "Núverandi val",
    winterRouteComparisonRoadNote:
      "Færð og lokanir sýna nýjustu tiltæku stöðu — ekki spá fyrir þessa valkosti.",
    winterRouteComparisonSelectedAnnouncement: "Valinn brottfarartími er nú {time} UTC.",
    winterRouteComparisonReasonNotUpcoming: "Þessi tími er liðinn eða utan tiltækra brottfarartíma.",
    winterRouteComparisonReasonArrivalOutsideWindow:
      "Komutími á a.m.k. einum punkti er utan sótts spáglugga; samanburðurinn þarf alla sex punktana.",
    winterRouteComparisonReasonPointUnavailable:
      "Gögn vantar fyrir a.m.k. einn af sex punktunum; samanburðurinn þarf alla sex punktana.",
    winterRouteComparisonReasonMetricGap:
      "Samanburðurinn þarf gildi fyrir alla sex punktana; gagnagat kemur í veg fyrir hann núna.",

    winterRouteAttributionRoadLine: "Færðar- og lokanargögn: Vegagerðin, CC BY 4.0.",
    winterRouteAttributionWeatherLine: "Veðurspágögn: Open-Meteo.",
    winterRouteModifiedBy: "Breytt/túlkað af Eltum Veðrið.",
    winterRouteNoEndorsement: "Engin stuðningsyfirlýsing fylgir frá gagnaveitum.",
    winterRouteOfficialOverride: "Opinberar lokanir ganga alltaf framar þessum sjálfvirku gögnum.",
    winterRouteNotSafetyAdvice: "Þetta er ekki öryggisráðgjöf og spáir ekki framtíðarfærð.",
    winterRouteOfficialSourceLinkRoad: "Skoða færð hjá Vegagerðinni",
    winterRouteOfficialSourceLinkWeather: "Leyfi og skilmálar Open-Meteo",
    winterRouteAcquiredAt: "Færðargögn sótt: {time} UTC",
  },
};

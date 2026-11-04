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

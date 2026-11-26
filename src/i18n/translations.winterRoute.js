// src/i18n/translations.winterRoute.js
//
// Ticket #486 — Rauðavatn–Vík winter road + forecast page. All user-facing
// text for /winter-route lives here (never hardcoded in the component).

export const winterRouteTranslations = {
  en: {
    footerWinterRoute: "Rauðavatn–Vík road status",

    winterRouteRoadSectionTitle: "Road conditions and closures",
    winterRouteSectionCoverageNote:
      "Road-condition data for some sections may cover a longer stretch of road than the part this route actually uses.",

    winterRouteCategoryPassable: "Passable",
    winterRouteCategoryHazardNotice: "Caution — notice",
    winterRouteCategoryOutOfService: "Out of service",
    winterRouteCategoryImpassable: "Impassable",
    winterRouteCategoryClosed: "Closed",
    winterRouteCategoryUnknownUnclassified: "Unknown condition",

    winterRouteExportStale: "This status export may be outdated.",
    winterRouteRegistrationOld: "This section's registration is more than a day old.",
    winterRouteSegmentDataUnavailable: "No road data available for this section.",
    // Ticket #492, direct-flow round 2, R4/V4 -- Ripley-approved exact
    // wording. Conflicting data: shown instead of a representative row's
    // own description for an ambiguous segment (never presented as a
    // known surface). Unknown addition: shown by default, as plain text,
    // whenever a segment has a real but unclassified AstandVidbotaruppl.
    winterRouteConflictingRoadData: "Conflicting road-condition data",
    winterRouteUnknownAdditionCode: "Unknown supplementary condition: {code}",
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
    winterRouteForecastNotAvailableAtComputedTime: "Forecast not available",
    winterRouteGridDisclaimer: "A forecast grid point from a weather model — not a direct measurement on the road.",
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

    // Ticket #502 — "Velja staði" Frá/Til search + route-base result flow.
    // T3 note: no departure/arrival/ETA/70km wording (same sweep as above);
    // the access-point disclaimer deliberately avoids "arrival"-adjacent
    // phrasing too, per approved-prompt-v1.md's own intro note.
    // Ticket #492, direct-flow -- the page's own h1/<title> fallback
    // before any pair has been applied (the former mode toggle and its
    // "Choose places" button label are both removed; this is a plain
    // neutral heading, not tied to any button).
    winterRouteDefaultHeading: "Winter road weather",
    winterRouteFromLabel: "From",
    winterRouteToLabel: "To",
    winterRouteFromSearchLabel: "Search starting point",
    winterRouteToSearchLabel: "Search destination",
    winterRouteGroupRingLabel: "South and East Iceland",
    winterRouteGroupWestfjordsLabel: "Westfjords",
    // Ticket #492, direct-flow, C6 -- a listbox-group label only, not a
    // claim that these two places connect to each other or to the ring/
    // Westfjords groups above.
    winterRouteGroupOtherLabel: "Other supported places",
    winterRouteNoSearchResults: "No place matches this search.",
    winterRouteSwapLabel: "Swap From and To",
    winterRouteShowRouteButton: "Show route",
    winterRouteRetryButton: "Try again",
    winterRouteSelectionChangedNotice: "Your selection has changed — press “Show route” to see the new result.",
    winterRouteIdleHint: "Choose From and To, then press “Show route”.",
    winterRouteGeometryLoading: "Finding a route…",
    winterRouteNoRouteYet: "There is no route in the route base for these two places yet.",
    winterRouteGenericError: "Something went wrong.",
    winterRouteSamePlaceMessage: "The same place is selected — there is no route to show.",
    winterRouteBaseDisclaimer: "Route base only; weather and road conditions for this route are not yet connected.",
    winterRouteAccessPointDisclaimer: "Chosen points near each place; the route may not run between town centres. Driving access is unconfirmed.",
    winterRouteEstimatedConnectorNote: "Part of this route is an estimated connection between retained road sections, not a direct measurement.",
    winterRouteApproachShortNote: "The route ends near the place itself, not inside the town.",
    winterRouteViaLabel: "Via: {via}",
    winterRouteOptionsLabel: "Route option",
    winterRouteOptionSouth: "Short route",
    winterRouteOptionNorth: "Long route via the Ring Road",
    winterRouteOptionGeneric: "Option",

    // Ticket #503 — the first B<->H (Búðardalur<->Hólmavík) weather/road
    // data binding, layered under a geometry_only result in "Velja
    // staði" mode. T3: no departure/arrival/ETA/70km/koma wording.
    winterRouteDataConnectedDisclaimer: "Weather and road conditions are connected at defined points and road sections for this route.",
    winterRouteDataLoading: "Fetching weather and road data…",
    winterRouteNoCoveragePointsNote: "Weather at selected points along the route; sections between them have no point of their own.",
    winterRouteLargestGapNote: "The largest gap without a point is about {km} km, between {pointA} and {pointB}.",
    winterRouteEdgeSegmentNote: "This section covers only a short part of the route ({percent}%).",
    winterRouteEdgeSegmentNoteShort: "This section is a very short part of the route.",
    winterRouteLongRouteComparisonNote: "Weather is compared at the same time across selected points along the route. This is not a forecast for the whole trip.",
    winterRouteDataForecastHeading: "Weather at {count} points",
    // Ticket #503 source-time -- narrowly scoped to the new "Velja staði"
    // data view (WinterRouteDataView); the legacy winterRouteAcquiredAt
    // key/text is unchanged (see src/pages/WinterRoute.jsx's own notes).
    winterRouteDataGeneratedAtLine: "Response generated {time} UTC.",
    winterRouteRoadExportedAtLine: "Road data: Vegagerðin exported this at {time} UTC.",
    winterRouteRoadCacheAgeLine: "Road: cache age when the response was generated: {minutes} min.",
    winterRouteRoadCacheAgeUnderMinuteLine: "Road: cache age when the response was generated: under a minute.",
    winterRouteForecastCacheAgeLine: "Weather: cache age when the response was generated: {minutes} min.",
    winterRouteForecastCacheAgeUnderMinuteLine: "Weather: cache age when the response was generated: under a minute.",

    // Ticket #492, first overview round -- "Velja staði" data-view-only key
    // for the forecast-time control, positioned directly above the weather
    // table rather than above the form (the legacy view's own equivalent
    // key, winterRouteHourLabel, no longer exists -- ticket #492's
    // direct-flow round removed that whole legacy view).
    winterRouteDataHourLabel: "Forecast time",
    // Ticket #492, time-slider -- keys for the native-range control that
    // replaced the former <select> above.
    winterRoutePrevHourButton: "Previous hour",
    winterRouteNextHourButton: "Next hour",
    winterRouteSameForecastTimeNoteChoose: "The same forecast time applies to all weather points.",
    winterRouteRoadCurrentRegardlessOfTimeNote: "Latest road status, regardless of the selected forecast time.",
    winterRouteTimeNoLongerAvailable: "The time you selected is no longer available — showing the next available time instead.",
    winterRouteTableColumnPlace: "Place",
    // Short table-column versions of the existing winterRouteTemperature/
    // winterRouteWind/winterRouteGust/winterRoutePrecip labels -- the EN
    // word "Temperature" alone overflowed its own 360px column header
    // (real measured evidence, round 2 of this ticket: it does not
    // contain a break point a browser can wrap at). The full wording is
    // kept, stated ONCE, in winterRouteGustPrecipNote below the table.
    winterRouteTableColumnTemp: "Temp.",
    winterRouteTableColumnWind: "Wind",
    winterRouteTableColumnGust: "Gusts",
    winterRouteTableColumnPrecip: "Precip.",
    // Ticket #492, round 3 (UX priority) -- the real "Weather" column
    // (icon + short condition text), one of 6 real synchronised columns.
    winterRouteTableColumnWeather: "Weather",
    winterRouteGustPrecipNote: "Gusts are the maximum of the previous hour; precipitation is from the previous hour.",
    winterRouteRoadOverviewAllClear: "No notices or closures on the route right now.",
    winterRouteRoadOverviewUnconfirmed: "Unable to confirm there are no notices on the route right now — data is incomplete.",
    winterRouteRoadOverviewDetailsSummary: "See all sections in driving order",

    // Ticket #492, round 3 (UX priority) — req 2: compact road summary.
    winterRouteRoadSummaryCountOne: "1 section with a notice",
    winterRouteRoadSummaryCount: "{count} sections with notices",
    winterRouteRoadAllDataOld: "All road data shown here is older than expected.",
    winterRouteViewAllSectionsAction: "View all road sections",
    winterRouteAllSectionsHeading: "All road sections, in driving order",

    // Ticket #492, round 3 — req 5/6: "About the data" details, and the
    // clarified time wording (never "fetched/updated" for generatedAt).
    winterRouteAboutDataSummary: "About the data",
    winterRouteRoadReleaseTimeUnknown: "Road data release time is unknown.",
  },

  is: {
    footerWinterRoute: "Færð Rauðavatn–Vík",

    winterRouteRoadSectionTitle: "Færð og lokanir",
    winterRouteSectionCoverageNote:
      "Færðargögn fyrir suma kafla geta náð yfir lengri vegkafla en þann hluta sem þessi leið notar.",

    winterRouteCategoryPassable: "Greiðfært",
    winterRouteCategoryHazardNotice: "Aðgát – tilkynning",
    winterRouteCategoryOutOfService: "Ekki í þjónustu",
    winterRouteCategoryImpassable: "Ófært",
    winterRouteCategoryClosed: "Lokað",
    winterRouteCategoryUnknownUnclassified: "Óþekkt ástand",

    winterRouteExportStale: "Þessi færðarútflutningur gæti verið úreltur.",
    winterRouteRegistrationOld: "Skráning þessa kafla er eldri en sólarhringur.",
    winterRouteSegmentDataUnavailable: "Engin færðargögn tiltæk fyrir þennan kafla.",
    // Ticket #492, direct-flow umferð 2, R4/V4 — texti Ripley samþykkti orðrétt.
    winterRouteConflictingRoadData: "Ósamræmi í færðargögnum",
    winterRouteUnknownAdditionCode: "Óþekktar viðbótarupplýsingar: {code}",
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
    winterRouteForecastNotAvailableAtComputedTime: "Spá ekki tiltæk",
    winterRouteGridDisclaimer: "Punktspá úr veðurlíkani — ekki bein mæling á vegi.",
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

    // Ticket #492, direct-flow — sjá samsvarandi EN athugasemd að ofan.
    winterRouteDefaultHeading: "Veður á vetrarvegum",
    winterRouteFromLabel: "Frá",
    winterRouteToLabel: "Til",
    winterRouteFromSearchLabel: "Leita að upphafsstað",
    winterRouteToSearchLabel: "Leita að áfangastað",
    winterRouteGroupRingLabel: "Suður- og Austurland",
    winterRouteGroupWestfjordsLabel: "Vestfirðir",
    winterRouteGroupOtherLabel: "Aðrir studdir staðir",
    winterRouteNoSearchResults: "Enginn staður fannst með þessari leit.",
    winterRouteSwapLabel: "Víxla Frá og Til",
    winterRouteShowRouteButton: "Sýna leið",
    winterRouteRetryButton: "Reyna aftur",
    winterRouteSelectionChangedNotice: "Valið hefur breyst — smelltu á „Sýna leið“ til að sjá nýja niðurstöðu.",
    winterRouteIdleHint: "Veldu Frá og Til, og smelltu á „Sýna leið“.",
    winterRouteGeometryLoading: "Leitar að leið…",
    winterRouteNoRouteYet: "Engin leið er í leiðargrunninum fyrir þessa tvo staði ennþá.",
    winterRouteGenericError: "Eitthvað fór úrskeiðis.",
    winterRouteSamePlaceMessage: "Sami staður valinn — engin leið til að sýna.",
    winterRouteBaseDisclaimer: "Leiðargrunnur; veður og færð fyrir þessa leið eru ekki enn tengd.",
    winterRouteAccessPointDisclaimer: "Valdir punktar við staðina; leiðin nær ekki endilega milli miðbæja. Akstursaðgengi er óstaðfest.",
    winterRouteEstimatedConnectorNote: "Hluti leiðarinnar er áætluð tenging milli varðveittra vegkafla, ekki bein mæling.",
    winterRouteApproachShortNote: "Leiðin endar nálægt staðnum, ekki í bænum sjálfum.",
    winterRouteViaLabel: "Um: {via}",
    winterRouteOptionsLabel: "Leiðarval",
    winterRouteOptionSouth: "Stutta leiðin",
    winterRouteOptionNorth: "Langa leiðin um Hringveginn",
    winterRouteOptionGeneric: "Valkostur",

    // Ticket #503 — sjá samsvarandi EN athugasemd að ofan.
    winterRouteDataConnectedDisclaimer: "Veður og færð eru tengd á skilgreindum punktum og vegköflum fyrir þessa leið.",
    winterRouteDataLoading: "Sæki veður og færð…",
    winterRouteNoCoveragePointsNote: "Veður á völdum punktum leiðarinnar; kaflar á milli þeirra hafa engan eigin punkt.",
    winterRouteLargestGapNote: "Stærsta bilið án punkts er um {km} km, milli {pointA} og {pointB}.",
    winterRouteEdgeSegmentNote: "Þessi kafli nær aðeins yfir stuttan hluta leiðarinnar ({percent}%).",
    winterRouteEdgeSegmentNoteShort: "Þessi kafli er örstuttur hluti leiðarinnar.",
    winterRouteLongRouteComparisonNote: "Veður er borið saman á sama tíma á völdum punktum leiðarinnar. Þetta er ekki spá fyrir ferðina í heild.",
    winterRouteDataForecastHeading: "Veður á {count} punktum",
    winterRouteDataGeneratedAtLine: "Svar útbúið {time} UTC.",
    winterRouteRoadExportedAtLine: "Færð: Vegagerðin keyrði gögnin út {time} UTC.",
    winterRouteRoadCacheAgeLine: "Færð: aldur gagna í skyndiminni þegar svarið var útbúið: {minutes} mín.",
    winterRouteRoadCacheAgeUnderMinuteLine: "Færð: aldur gagna í skyndiminni þegar svarið var útbúið: innan við mínútu.",
    winterRouteForecastCacheAgeLine: "Veður: aldur gagna í skyndiminni þegar svarið var útbúið: {minutes} mín.",
    winterRouteForecastCacheAgeUnderMinuteLine: "Veður: aldur gagna í skyndiminni þegar svarið var útbúið: innan við mínútu.",

    // Ticket #492 -- sjá samsvarandi EN athugasemd að ofan.
    winterRouteDataHourLabel: "Tími veðurspár",
    winterRoutePrevHourButton: "Fyrri klukkutími",
    winterRouteNextHourButton: "Næsti klukkutími",
    winterRouteSameForecastTimeNoteChoose: "Sami spátími fyrir alla veðurpunkta.",
    winterRouteRoadCurrentRegardlessOfTimeNote: "Nýjasta færðarstaða, óháð völdum spátíma.",
    winterRouteTimeNoLongerAvailable: "Valinn tími er ekki lengur tiltækur — næsti tiltæki tími er sýndur í staðinn.",
    winterRouteTableColumnPlace: "Staður",
    winterRouteTableColumnTemp: "Hiti",
    winterRouteTableColumnWind: "Vindur",
    winterRouteTableColumnGust: "Hviður",
    winterRouteTableColumnPrecip: "Úrkoma",
    winterRouteTableColumnWeather: "Veður",
    winterRouteGustPrecipNote: "Hviður eru hámark síðustu klukkustundar; úrkoma er frá síðustu klukkustund.",
    winterRouteRoadOverviewAllClear: "Engar tilkynningar eða lokanir á leiðinni núna.",
    winterRouteRoadOverviewUnconfirmed: "Ekki er hægt að staðfesta að engar tilkynningar séu á leiðinni núna — gögn eru ófullnægjandi.",
    winterRouteRoadOverviewDetailsSummary: "Sjá alla kafla í akstursröð",

    // Ticket #492, umferð 3 (UX-forgangslota) — krafa 2: þétt færðarsamantekt.
    winterRouteRoadSummaryCountOne: "1 kafli með tilkynningu",
    winterRouteRoadSummaryCount: "{count} kaflar með tilkynningum",
    winterRouteRoadAllDataOld: "Öll vegagögn hér eru eldri en vænst er.",
    winterRouteViewAllSectionsAction: "Sjá alla vegkafla",
    winterRouteAllSectionsHeading: "Allir vegkaflar, í akstursröð",

    // Ticket #492, umferð 3 — krafa 5/6: „Um gögnin" ítarefni og skýrari tímar.
    winterRouteAboutDataSummary: "Um gögnin",
    winterRouteRoadReleaseTimeUnknown: "Útgáfutími færðargagna er óþekktur.",
  },
};

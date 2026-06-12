// Supported blog generation types
export const BLOG_POST_TYPES = [
  "campsite_weather",
  "weather_comparison",
  "best_this_week",
  "wind_safety",
  "avoid_bad_weather",
  // Future types — add prompt handler below when ready:
  // "better_weather_nearby",
  // "stay_or_move",
  // "nearby_highlights",
  // "weather_warning",
  // "regional_weather_window",
];

// ─── Shared building blocks ───────────────────────────────────────────────────

function languageLine(lang) {
  return `Language: ${lang === "is" ? "Icelandic" : "English"}`;
}

function sharedTone() {
  return `Tone:
- Weather-first: lead with what the weather means for the reader, not with descriptions of places
- Practical and advice-driven
- Clear and direct — short sentences, no filler
- Written like advice from someone who knows Iceland well
- Written for someone making an active travel or camping decision
- Not promotional, not touristic, not clickbait
- Icelandic-first: write primarily for an Icelandic-speaking audience making real decisions`;
}

function sharedSeverityToneRules() {
  return `Severity-based tone rules:
Match the tone to actual forecast severity — do not over- or under-state conditions.

Favorable weather (light wind, little/no precipitation, no active warnings):
- Tone: positive and useful
- Highlight good camping conditions clearly

Mixed/typical Icelandic weather (drizzle, scattered showers, cool temperatures, light-to-moderate wind):
- Tone: balanced and practical
- Allowed: "gott að vera undirbúinn", "fylgjast með þróuninni"
- Avoid: "hættulegt", "forðast svæðið", "slæm veðurskilyrði"
- Do NOT escalate drizzle or typical Icelandic conditions into dramatic warnings

Challenging weather (heavy rain, strong sustained wind, repeated poor days):
- Tone: cautious
- Allowed: "aðstæður geta orðið krefjandi", "ferðaplön gætu þurft að breytast"
- Do not frame as dangerous unless thresholds or official warnings support it

Hazardous weather (official severe weather warnings, dangerous gust thresholds, flooding risk, travel safety impact):
- Tone: direct and safety-focused
- Allowed: "íhugaðu að fresta ferð", "fylgdu leiðbeiningum yfirvalda"
- This language is only appropriate when justified by explicit data or warnings in the input

Wind speed reference — use these thresholds when describing wind:
- Sustained wind < 10 m/s: "light to moderate winds" or equivalent
- Sustained wind 10–14 m/s: "breezy conditions" or equivalent
- Sustained wind 15–19 m/s: "strong winds" — use cautiously
- Sustained wind 20+ m/s: "very strong winds" / "challenging conditions" — only here
Do NOT use "strong winds", "high winds", "windy conditions", or "challenging" for wind below 15 m/s.

Precipitation reference:
- Precipitation below 1 mm per day must NOT be described as disruptive, wet, or rainy
- Phrases such as "rain may affect camping", "wet weather expected", or "damp conditions" require at least 1 mm per day in the forecast data
- Trace precipitation (< 1 mm) may be omitted entirely or noted as "little to no precipitation"

Hard rules:
- Moderate drizzle and cool temperatures must NOT produce dramatic safety warnings
- "hættulegt", "forðast svæðið", "jafnvel hættulegt", "ráðlagt að forðast" must ONLY appear when forecast data or active official warnings explicitly justify them
- Write like an experienced Iceland travel guide, not an emergency broadcaster`;
}

function sharedAntiHallucinationRules() {
  return `Anti-hallucination rules:
- Do NOT invent specific weather observations unless explicitly provided in the forecast data
- Do NOT invent terrain details, shelter, facilities, or amenities
- Do NOT invent nearby attractions, roads, or points of interest
- Do NOT invent road conditions or road closures
- Do NOT invent weather warnings or safety claims
- Do NOT claim live conditions unless they are explicitly provided in the input data
- Do NOT generate generic tourism content
- If nearby highlights are not provided in the input, keep the section general or omit it entirely
- If a detail is unknown, omit it — do not guess
- Only use information explicitly provided in the input data
- Avoid all of the following phrases or anything similar:
  "Iceland offers", "stunning", "breathtaking", "unique experience", "nestled", "picturesque", "perfect for",
  "hidden gem paradise", "best place in Iceland", "guaranteed perfect weather", "safe to drive", "official warning"
- The following phrases are only permitted when wind/rain thresholds defined in sharedSeverityToneRules() are explicitly exceeded by the forecast data:
  "strong winds" (below 15 m/s threshold), "challenging conditions" (below 20 m/s threshold),
  "rough weather", "not ideal for camping", "difficult conditions"`;
}

function sharedWeatherDataPriority() {
  return `Weather data priority:
1. Forecast summary (highest priority)
2. Raw forecast input
3. General knowledge (only if nothing else is provided)

If forecast summary is provided:
- Use it to identify the roughest period and the most important risks
- Lead with the dominant weather pattern across the forecast period — if most days are calm and dry, open with that. Only highlight poor days when they represent a significant portion of the forecast period or exceed wind/rain thresholds defined above.
- Clearly state which days look roughest if applicable

Use raw forecast input as the source of truth for detailed weather values.
Do not invent weather details beyond the provided forecast summary or raw forecast input.`;
}

function sharedWeatherDataPriorityStrict() {
  return `Weather data priority:
- Focus on the worst weather, not average conditions
- Clearly state which days look roughest if applicable
- The worst weather conditions must dominate the assessment
- Use wind/rain thresholds from severity tone rules to calibrate language
- Do not downplay poor conditions to reflect a weekly average
`;
}

function sharedCtaInstruction() {
  return `CTA instruction:
- End the article with a brief, natural call to action encouraging the reader to check live conditions
- Do not make the CTA feel like an advertisement or a call to buy something
- The CTA should feel like a practical next step, not a marketing pitch`;
}

function sharedInternalLinkingInstruction() {
  return `Internal linking:
- Where naturally relevant, suggest that the reader compare nearby locations
- Do not force internal links — only include if it fits the content organically`;
}

function sharedMovementGuidance() {
  return `Movement guidance:
- If the forecast data suggests conditions are significantly better at a nearby location, mention it briefly
- Use phrasing such as: "weather may be calmer further east", "drier conditions expected in the south this week", "more shelter available in nearby valleys"
- Icelandic examples: "veðrið lítur betur út í austurátt", "minnsta rigning er spáð á Suðurlandi þessa viku", "minni vindur er á völlunum neðar"
- Do NOT invent specific alternative campsites unless they are provided in the input data
- Do NOT claim a specific place is better unless the forecast data supports it
- If no nearby alternatives are provided, use directional or regional guidance only (e.g. "further south", "the eastern fjords")
- Frame movement as a practical option, not a requirement`;
}

function sharedNearbyPlacesRules() {
  return `Nearby places rules:
- Only mention nearby places if they are explicitly provided in the input data or structured context
- Acceptable nearby place types (if provided): waterfalls, hot springs, viewpoints, towns, scenic drives, swimming pools, short walks
- Do NOT invent nearby attractions, distances, or access routes
- Do NOT describe scenery unless it directly affects camping conditions (e.g. exposed ridge, valley shelter)
- If no nearby places are provided, omit this section entirely — do not generalize`;
}

function icelandicOutputRules(lang) {
  if (lang !== "is") return "";
  return `Extra rules for Icelandic output:
- Use natural Icelandic
- Prefer simple, direct sentences
- Avoid stiff machine-like phrasing
- Avoid overly formal wording
- Write like practical advice, not a brochure
- Do not use slang or idioms that translate poorly from English
- Do not mimic English sentence structure — restructure for Icelandic where needed
- Avoid compound words that sound unnatural in spoken Icelandic
- Aim for sentences that would feel natural if read aloud by an Icelander`;
}

function jsonOutputShape() {
  return `Return ONLY valid JSON.
Do not wrap the JSON in markdown code fences.
Do not include any extra commentary.

Return this exact shape. Required fields must always be present. Optional fields must be null if you do not have sufficient grounded input data — never invent content for them:

{
  "title": "...",
  "excerpt": "...",
  "slug": "...",
  "content": "...",
  "metaTitle": "...",
  "metaDescription": "...",
  "language": "...",
  "weatherNarrative": null,
  "movementNarrative": null,
  "nearbyHighlights": null,
  "nearbyAttractions": null,
  "whyThisArea": null
}

Optional field rules:
- "language": Required. Must match the language this post was written in — "is" for Icelandic, "en" for English.
- "weatherNarrative": A focused 1-3 sentence narrative about the weather conditions. Only fill if forecast data was provided. Otherwise null.
- "movementNarrative": A practical stay-vs-move narrative. Only fill if comparing locations or if forecast clearly suggests moving. Otherwise null.
- "nearbyHighlights": Only fill if nearby highlights were explicitly stated in the input. Do NOT invent. Otherwise null.
- "nearbyAttractions": Only fill if nearby attractions were explicitly stated in the input. Do NOT invent. Otherwise null.
- "whyThisArea": A 1-2 sentence explanation of why this area or period is recommended. Only fill if there is a clear positive signal from the provided data. Otherwise null.

Content must be markdown.`;
}

// ─── Type handlers ────────────────────────────────────────────────────────────

function promptWeatherComparison(lang, context) {
  const language = lang === "is" ? "Icelandic" : "English";
  return `
Write a blog post comparing two nearby campsites in Iceland.

Language: ${language}

Base campsite: ${context.baseCampsite || "Campsite A"}
Compare campsite: ${context.compareCampsite || "Campsite B"}
Region: ${context.region || "Iceland"}

Forecast summary:
${context.forecastSummary || "No forecast summary available."}

Raw forecast input:
${context.forecastRawInput || "No forecast data provided."}

Tone:
- Practical and experience-based
- Written like advice from someone who knows Iceland
- Not promotional

${sharedSeverityToneRules()}

Structure:
- Title
- Short intro (set context quickly, no fluff)
- Comparison (bullet points, concrete differences only)
- Practical weather impact (explain wind, shelter, exposure, and what it means for camping)
- Decision section: "Should you stay or move?" based on conditions
- Soft conclusion
- End with one short, strong takeaway sentence

Rules:
- Do not start with generic introductions or setup sentences
- Start directly with the key condition or difference
- If one weather factor is clearly dominant (e.g. heavy snow, extreme wind), center the comparison around that instead of listing all factors equally
- Do not use section headers like "Comparison", "Practical Impact", "Conclusion", or "Takeaway"
- Write as a continuous, natural comparison
- If one campsite has extreme conditions (e.g. very high wind, heavy snow, heavy rain), this should strongly influence the conclusion
- Do not treat all factors equally if one risk is clearly more severe
- The comparison must clearly indicate which campsite is better, worse, or if both are poor choices
- If one campsite is clearly worse overall, state that explicitly
- Avoid neutral conclusions when the data shows a meaningful difference
- Do not structure the content as a list of attributes (e.g. wind, rain, temperature)
- Do not present the comparison as a table or bullet-style breakdown
- Write as a continuous comparison driven by the actual conditions
- Do not invent terrain details, shelter elements, campsite facilities, or amenities unless explicitly provided in the context
- Do not invent road conditions or road closures
- Do not invent weather warnings or safety claims
- Do not claim live conditions unless explicitly provided in the input data
- If a detail is unknown, do not guess
- Focus on helping the reader make a decision, not describing a destination
- Avoid all generic travel descriptions
- Do not describe scenery unless it directly affects camping conditions

- Treat campsites as decision options, not destinations
- Clearly explain differences between the campsites
- Do not present both campsites as equally good if there is a meaningful difference
- Be specific and decisive when describing differences
- If one campsite is more exposed to wind or weather, state it clearly
- Always explain WHY differences matter in practice (tents, comfort, sleep, driving conditions)

- Keep the content grounded, practical, and specific
- Avoid hedging language ("can", "may", "might", "often") unless absolutely necessary
- Avoid ALL of the following phrases or anything similar:
  "Iceland offers", "stunning", "breathtaking", "unique experience", "nestled", "picturesque", "perfect for"

- Use the following priority for weather data:
  1. Forecast summary (highest priority)
  2. Raw forecast input
  3. General knowledge (only if nothing else is provided)

- If forecast summary is provided:
  - Use it to identify the roughest period and the most important risks
  - Lead with the dominant weather pattern across the forecast period — if most days are calm and dry, open with that. Only highlight poor days when they represent a significant portion of the forecast period or exceed wind/rain thresholds defined above.
  - Clearly state which days look roughest if applicable
  - If cold nights are present, explain their practical impact

- Use raw forecast input as the source of truth for detailed weather values
- Extract the weekly pattern from the raw forecast input before writing
- Do not invent weather details beyond the provided forecast summary or raw forecast input

- If weather data is provided:
  - Prioritize it over generic advice
  - Explain real-world impact of wind, gusts, rain, and temperature on camping decisions

Important:
- Campsites in Iceland can feel very different even if they are close together
- Focus on micro-differences in weather and shelter
- Write like you are helping someone decide where to sleep tonight
- Prioritize practical decision value over general travel writing
- The reader is actively deciding where to stay under uncertainty

${sharedMovementGuidance()}

${sharedNearbyPlacesRules()}

Meta rules:
- Meta title must include location and decision intent (e.g. where to camp, which is better, wind conditions)
- Meta description must clearly state the practical benefit for the reader
- Avoid generic descriptions in meta text

${jsonOutputShape()}
`;
}

function promptCampsiteWeather(lang, context) {
  const language = lang === "is" ? "Icelandic" : "English";
  return `
Write a practical campsite weather article for ONE campsite in Iceland.

Language: ${language}

Campsite: ${context.baseCampsite || "Unknown campsite"}
Region: ${context.region || "Iceland"}

Forecast summary:
${context.forecastSummary || "No forecast summary available."}

Raw forecast input:
${context.forecastRawInput || "No forecast data provided."}

Important grounding rules:
- You are writing about ONE campsite only
- Do NOT compare it to any other campsite
- Do NOT mention any second campsite
- Use the provided region exactly as context
- Do NOT replace the region with another region
- Do NOT invent specific current weather observations unless they were explicitly provided
- If forecast details are not provided, write in general practical terms for camping decisions, not fake live conditions
- Do NOT invent facilities, amenities, roads, terrain, shelter, or scenery unless explicitly provided
- Do NOT invent road conditions or road closures
- Do NOT invent weather warnings or safety claims
- Do NOT claim live conditions unless explicitly provided in the input data
- Do NOT guess facts about the campsite
- Keep the text grounded, practical, and specific
- Avoid tourism language and avoid dramatic filler

Tone:
- Practical
- Clear
- Human
- Advice-driven
- Not promotional
- Written for someone deciding how to camp safely and comfortably

${sharedSeverityToneRules()}

Structure:
- Title
- Short intro
- What campers should pay attention to
- Practical effects on camping
- What to check before staying overnight
- Short conclusion
- One short takeaway sentence at the end

Rules:
- Describe how conditions change over the week (early, mid, late) when relevant
- Clearly state if this is a good or bad week to stay at this campsite
- Do not soften negative conditions when the forecast is clearly poor
- Do not give general camping advice (gear, preparation, equipment)
- Focus on evaluating conditions, not teaching how to handle them
- Start by summarizing the overall week in 1–2 sentences, focusing on the worst conditions
- Clearly identify when the worst conditions occur (e.g. early week, mid-week, specific days)
- Do not structure the article as generic sections like "What to check" or "Practical effects"
- Keep the structure natural and driven by the actual forecast, not a template
- If conditions are difficult, state it clearly and do not soften the message
- The goal is to help the reader decide if staying is a good idea this week
- Focus on how weather affects camping decisions, not describing a destination
- Treat the reader as someone deciding whether to stay overnight at this campsite
- Do not write generic travel content
- Avoid vague statements unless necessary

- Explain practical effects of weather:
  - rain (wet ground, mud, setup difficulty)
  - wind and gusts (exposure, tent stability, comfort)
  - temperature (cold nights, sleeping conditions)
- Always explain what the conditions mean in practice for campers

- Avoid all of the following phrases or anything similar:
  "Iceland offers", "stunning", "breathtaking", "unique experience", "nestled", "picturesque", "perfect for"

- Use the following priority for weather data:
  1. Forecast summary (highest priority)
  2. Raw forecast input
  3. General knowledge (only if nothing else is provided)

- If forecast summary is provided:
  - Use it to identify the roughest days and the most important risks
  - Lead with the dominant weather pattern across the forecast period — if most days are calm and dry, open with that. Only highlight poor days when they represent a significant portion of the forecast period or exceed wind/rain thresholds defined above.
  - If the week starts rough or ends colder, say that clearly
  - Explain practical impact of those conditions

- Use raw forecast input as the source of truth for detailed weather values
- Extract the weekly pattern from the raw forecast input before writing
- Do not invent weather details beyond the provided forecast summary or raw forecast input

- If weather data is provided:
  - Prioritize it over generic advice
  - Clearly explain impact of wind, gusts, rain, and temperature on camping conditions

- If no forecast data is provided:
  - Stay general
  - Do not imply knowledge of specific current conditions

- If conditions look difficult, state that clearly and do not soften the message

Extra rules for Icelandic output:
- Use natural Icelandic
- Prefer simple, direct sentences
- Avoid stiff machine-like phrasing
- Avoid overly formal wording
- Write like practical advice, not a brochure

${sharedMovementGuidance()}

${sharedNearbyPlacesRules()}

Meta rules:
- Meta title must include the campsite name and region
- Meta description must explain the practical value for campers
- Do not use clickbait
- Do not invent live forecast details in meta text

${jsonOutputShape()}
`;
}

function promptBestThisWeek(lang, context) {
  return `
${languageLine(lang)}

Audience: Campers in Iceland deciding where to go this week based on weather.

Task: Write a weather-first article identifying the best camping area or region in Iceland for the coming week, based on the forecast data provided.

Region or locations: ${context.region || "Iceland"}
${context.baseCampsite ? `Focus location: ${context.baseCampsite}` : ""}
${context.campsites ? `Candidate locations: ${context.campsites}` : ""}

Forecast summary:
${context.forecastSummary || "No forecast summary available."}

Raw forecast input:
${context.forecastRawInput || "No forecast data provided."}

${sharedTone()}

${sharedSeverityToneRules()}

Structure:
- Title that clearly signals "best this week" and the region
- One-paragraph summary of the forecast window
- Why this location or region stands out this week (weather reasons only)
- What to expect day by day (rough pattern, not precise predictions)
- Practical planning note — what to watch for before confirming plans
- End with a brief CTA to check live conditions

${sharedWeatherDataPriority()}

${sharedMovementGuidance()}

${sharedNearbyPlacesRules()}

${sharedAntiHallucinationRules()}

${sharedCtaInstruction()}

${sharedInternalLinkingInstruction()}

${icelandicOutputRules(lang)}

Meta rules:
- Meta title must include the region and "this week" context
- Meta description must explain why this is a good week and for whom

${jsonOutputShape()}
`;
}

function promptWindSafety(lang, context) {
  return `
${languageLine(lang)}

Audience: Campers in Iceland who are concerned about wind exposure at a specific location.

Task: Write a practical wind safety article for the campsite or location provided, based on the forecast data.

Campsite or location: ${context.baseCampsite || "Unknown location"}
Region: ${context.region || "Iceland"}

Forecast summary:
${context.forecastSummary || "No forecast summary available."}

Raw forecast input:
${context.forecastRawInput || "No forecast data provided."}

${sharedTone()}

${sharedSeverityToneRules()}

Structure:
- Title that includes the location and wind as the key theme
- Opening: what does the wind look like this week at this location?
- When is wind worst? (specific days or window if forecast data available)
- Practical impact: what does this wind level mean for tents, driving, comfort?
- What should campers check or decide before arriving?
- Brief conclusion with a practical recommendation
- End with a CTA to check live conditions

Rules:
- Lead with the actual wind data — do not start with general wind education
- Quantify wind where possible (use m/s values from forecast data if available)
- Explain wind in practical camping terms: tent stability, exposure, gusts vs sustained wind
- Do not soften dangerous wind conditions
- Do not invent shelter details or terrain that would reduce wind unless explicitly provided
- Focus on wind as the primary risk — mention rain and temperature only if they compound the wind risk

${sharedWeatherDataPriorityStrict()}

${sharedMovementGuidance()}

${sharedNearbyPlacesRules()}

${sharedAntiHallucinationRules()}

${sharedCtaInstruction()}

${icelandicOutputRules(lang)}

Meta rules:
- Meta title must include the campsite name and wind as the key concern
- Meta description must explain the wind situation and why it matters for campers

${jsonOutputShape()}
`;
}

function promptAvoidBadWeather(lang, context) {
  return `
${languageLine(lang)}

Audience: Campers in Iceland trying to plan around a poor weather window at a specific location.

Task: Write a practical article about when to avoid this location due to the forecast, and what alternative options may be worth considering if they were provided in the input.

Primary location to avoid: ${context.baseCampsite || "Unknown location"}
Region: ${context.region || "Iceland"}
${context.alternatives ? `Alternative locations provided: ${context.alternatives}` : "No alternative locations provided — do not invent alternatives."}

Forecast summary:
${context.forecastSummary || "No forecast summary available."}

Raw forecast input:
${context.forecastRawInput || "No forecast data provided."}

${sharedTone()}

${sharedSeverityToneRules()}

Structure:
- Title that signals a poor-weather window and the location
- Opening: what makes this window a poor time to visit?
- Which days or period is worst? (use forecast data)
- What specific conditions make it problematic (wind, rain, temperature)?
- If alternatives were provided: briefly note why they may be better — only based on what is stated in the input data
- If no alternatives provided: focus purely on the "when to avoid" angle without suggesting specific alternatives
- Practical planning note — when could conditions improve?
- End with a CTA to check current conditions before making final plans

Rules:
- Do NOT invent alternative locations if none were provided
- Do NOT invent road conditions or closures
- Do NOT soften genuinely bad forecasts
- Only compare to alternatives if they were explicitly provided in the input
- Do not make this article feel like a "do not travel" warning — frame as decision support

${sharedWeatherDataPriorityStrict()}

${sharedMovementGuidance()}

${sharedNearbyPlacesRules()}

${sharedAntiHallucinationRules()}

${sharedCtaInstruction()}

${icelandicOutputRules(lang)}

Meta rules:
- Meta title must include the location and the "avoid" or "bad weather" framing
- Meta description must state the forecast concern clearly and who this article helps

${jsonOutputShape()}
`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildBlogPrompt(type, { lang = "en", context = {} } = {}) {
  switch (type) {
    case "weather_comparison":
      return promptWeatherComparison(lang, context);
    case "campsite_weather":
      return promptCampsiteWeather(lang, context);
    case "best_this_week":
      return promptBestThisWeek(lang, context);
    case "wind_safety":
      return promptWindSafety(lang, context);
    case "avoid_bad_weather":
      return promptAvoidBadWeather(lang, context);
    default:
      throw new Error(`Unsupported blog post type: "${type}". Supported: ${BLOG_POST_TYPES.join(", ")}`);
  }
}

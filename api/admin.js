import { isAdminEmail } from "./_lib/admin.js";
import { getMeFromRequest } from "./_lib/getMe.js";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });

/* =========================
   SHARED HELPERS
========================= */

function slugify(str = "") {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeBlogPost(row) {
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title || "",
    excerpt: row.excerpt || "",
    content: row.content || "",
    metaTitle: row.meta_title || "",
    metaDescription: row.meta_description || "",
    coverImage: row.cover_image || "",
    ctaHint: row.cta_hint || "",
    status: row.status || "draft",
    publishedAt: row.published_at || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

async function requireAdmin(req, res) {
  const me = await getMeFromRequest(req);
  const email = me?.user?.email;

  if (!email || !isAdminEmail(email)) {
    res.status(403).json({ ok: false, error: "Forbidden" });
    return null;
  }

  return me;
}

function normalizeForecastRawInput(raw = "") {
  const text = String(raw || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!text) {
    return {
      normalizedText: "",
      summaryText: "",
      metrics: null,
    };
  }

  const lines = text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (!lines.length) {
    return {
      normalizedText: "",
      summaryText: "",
      metrics: null,
    };
  }

  const parsed = lines.map(parseForecastLine).filter(Boolean);

  if (!parsed.length) {
    return {
      normalizedText: lines.join("\n"),
      summaryText: "",
      metrics: null,
    };
  }

  let maxWind = null;
  let maxWindDay = "";
  let maxGust = null;
  let maxGustDay = "";
  let maxRain = null;
  let maxRainDay = "";
  let minTemp = null;
  let minTempDay = "";

  const roughDays = [];
  const coldDays = [];

  for (const row of parsed) {
    if (typeof row.wind === "number" && (maxWind == null || row.wind > maxWind)) {
      maxWind = row.wind;
      maxWindDay = row.day;
    }

    if (typeof row.gust === "number" && (maxGust == null || row.gust > maxGust)) {
      maxGust = row.gust;
      maxGustDay = row.day;
    }

    if (typeof row.rain === "number" && (maxRain == null || row.rain > maxRain)) {
      maxRain = row.rain;
      maxRainDay = row.day;
    }

    if (typeof row.minTemp === "number" && (minTemp == null || row.minTemp < minTemp)) {
      minTemp = row.minTemp;
      minTempDay = row.day;
    }

    const isRough =
      (typeof row.wind === "number" && row.wind >= 9) ||
      (typeof row.gust === "number" && row.gust >= 14) ||
      (typeof row.rain === "number" && row.rain >= 2);

    const isCold = typeof row.minTemp === "number" && row.minTemp <= 0;

    if (isRough) roughDays.push(row.day);
    if (isCold) coldDays.push(row.day);
  }

  const summaryLines = [];

  if (maxWind != null) {
    summaryLines.push(`Highest sustained wind: ${maxWind} m/s on ${maxWindDay}`);
  }

  if (maxGust != null) {
    summaryLines.push(`Highest gust: ${maxGust} m/s on ${maxGustDay}`);
  }

  if (maxRain != null) {
    summaryLines.push(`Highest rain: ${maxRain} mm on ${maxRainDay}`);
  }

  if (minTemp != null) {
    summaryLines.push(`Coldest minimum temperature: ${minTemp}°C on ${minTempDay}`);
  }

  if (roughDays.length) {
    summaryLines.push(`Roughest days: ${roughDays.join(", ")}`);
  }

  if (coldDays.length) {
    summaryLines.push(`Cold nights/days: ${coldDays.join(", ")}`);
  }

  return {
    normalizedText: lines.join("\n"),
    summaryText: summaryLines.join("\n"),
    metrics: {
      maxWind,
      maxWindDay,
      maxGust,
      maxGustDay,
      maxRain,
      maxRainDay,
      minTemp,
      minTempDay,
      roughDays,
      coldDays,
    },
  };
}

function parseForecastLine(line = "") {
  const text = String(line || "").trim();
  if (!text) return null;

  const dayMatch = text.match(
    /^((mið|fim|fös|lau|sun|mán|þri|þrið|miðv|þri\.|mið\.)[^0-9]*\d{1,2}\.\s*[a-záðéíóúýþæö]{3,}\.?)/i
  );

  const day =
    dayMatch?.[1]?.trim() || text.split(/\s{2,}|\s(?=[A-ZÁÐÉÍÓÚÝÞÆÖ])/)[0] || "Unknown day";

  const temps = [...text.matchAll(/-?\d+(?:[.,]\d+)?\s*°C/gi)].map((m) =>
    Number(m[0].replace(",", ".").replace(/[^0-9.\-]/g, ""))
  );

  const msValues = [...text.matchAll(/-?\d+(?:[.,]\d+)?\s*m\/s/gi)].map((m) =>
    Number(m[0].replace(",", ".").replace(/[^0-9.\-]/g, ""))
  );

  const mmValues = [...text.matchAll(/-?\d+(?:[.,]\d+)?\s*mm/gi)].map((m) =>
    Number(m[0].replace(",", ".").replace(/[^0-9.\-]/g, ""))
  );

  let wind = null;
  let gust = null;

  if (msValues.length === 1) {
    wind = msValues[0];
  } else if (msValues.length >= 2) {
    wind = msValues[0];
    gust = Math.max(...msValues.slice(1));
  }

  const minTemp = temps.length >= 1 ? Math.min(...temps) : null;
  const maxTemp = temps.length >= 1 ? Math.max(...temps) : null;
  const rain = mmValues.length ? Math.max(...mmValues) : null;

  return {
    day,
    raw: text,
    minTemp,
    maxTemp,
    wind,
    gust,
    rain,
  };
}

/* =========================
   SUMMARY LOGIC
========================= */

async function getUsersSummary() {
  const rows = await sql`
    select
      count(*)::int as total,
      count(*) filter (where created_at >= now() - interval '7 days')::int as new7d,
      count(*) filter (where created_at >= now() - interval '30 days')::int as new30d
    from app_user
  `;

  const row = rows[0] || {};

  return {
    total: Number(row.total || 0),
    new7d: Number(row.new7d || 0),
    new30d: Number(row.new30d || 0),
  };
}

async function getProSummary() {
  const rows = await sql`
    with sub_flags as (
      select
        user_id,
        case
          when current_period_end > now()
           and lower(coalesce(status, '')) in ('active', 'trialing', 'past_due', 'canceled', 'cancelled')
          then true
          else false
        end as is_active
      from user_subscription
    ),
    totals as (
      select count(*)::int as total_users
      from app_user
    )
    select
      coalesce(count(*) filter (where is_active), 0)::int as active,
      coalesce(count(*) filter (where not is_active), 0)::int as expired,
      coalesce(
        round(
          (
            (count(*) filter (where is_active))::numeric
            / nullif((select total_users from totals), 0)::numeric
          ) * 100,
          1
        ),
        0
      ) as conversion_rate
    from sub_flags
  `;

  const row = rows[0] || {};

  return {
    active: Number(row.active || 0),
    expired: Number(row.expired || 0),
    conversionRate: Number(row.conversion_rate || 0),
  };
}

async function getRevenueSummary() {
  const rows = await sql`
    select
      coalesce(
        sum(amount) filter (
          where lower(coalesce(status, '')) in ('completed', 'paid')
            and occurred_at >= date_trunc('month', now())
            and upper(coalesce(currency, '')) = 'EUR'
        ),
        0
      )::numeric as month,

      coalesce(
        sum(amount) filter (
          where lower(coalesce(status, '')) in ('completed', 'paid')
            and occurred_at >= now() - interval '30 days'
            and upper(coalesce(currency, '')) = 'EUR'
        ),
        0
      )::numeric as last30d,

      coalesce(
        sum(amount) filter (
          where lower(coalesce(status, '')) in ('completed', 'paid')
            and upper(coalesce(currency, '')) = 'EUR'
        ),
        0
      )::numeric as lifetime
    from paddle_transaction
  `;

  const row = rows[0] || {};

  return {
    month: Number(row.month || 0),
    last30d: Number(row.last30d || 0),
    lifetime: Number(row.lifetime || 0),
  };
}

async function handleSummary(req, res) {
  try {
    const me = await requireAdmin(req, res);
    if (!me) return;

    const [users, pro, revenue] = await Promise.all([
      getUsersSummary(),
      getProSummary(),
      getRevenueSummary(),
    ]);

    return res.status(200).json({
      ok: true,
      users,
      pro,
      revenue,
    });
  } catch (err) {
    console.error("[admin/summary] failed", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

/* =========================
   BLOG LIST / EDIT / PUBLISH
========================= */

async function handleListBlogPosts(req, res) {
  try {
    const me = await requireAdmin(req, res);
    if (!me) return;

    const rows = await sql`
      select
        id,
        slug,
        title,
        excerpt,
        content,
        meta_title,
        meta_description,
        cover_image,
        cta_hint,
        status,
        published_at,
        created_at,
        updated_at
      from blog_post
      order by
        case when lower(coalesce(status, 'draft')) = 'published' then 0 else 1 end,
        coalesce(published_at, created_at) desc,
        created_at desc
    `;

    return res.status(200).json({
      ok: true,
      posts: rows.map(normalizeBlogPost),
    });
  } catch (err) {
    console.error("[admin/listBlogPosts] failed", err);
    return res.status(500).json({ ok: false, error: "Failed to load blog posts" });
  }
}

async function handleUpdateBlogPost(req, res) {
  try {
    const me = await requireAdmin(req, res);
    if (!me) return;

    const { id, title, excerpt, content, metaTitle, metaDescription, coverImage, ctaHint, slug } =
      req.body || {};

    if (!id) {
      return res.status(400).json({ ok: false, error: "Missing post id" });
    }

    const existingRows = await sql`
      select
        id,
        slug,
        title,
        excerpt,
        content,
        meta_title,
        meta_description,
        cover_image,
        cta_hint,
        status,
        published_at,
        created_at,
        updated_at
      from blog_post
      where id = ${id}
      limit 1
    `;

    const existing = existingRows[0];

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Blog post not found" });
    }

    const nextTitle = title ?? existing.title ?? "";
    const nextExcerpt = excerpt ?? existing.excerpt ?? "";
    const nextContent = content ?? existing.content ?? "";
    const nextMetaTitle = metaTitle ?? existing.meta_title ?? "";
    const nextMetaDescription = metaDescription ?? existing.meta_description ?? "";
    const nextCoverImage = coverImage ?? existing.cover_image ?? "";
    const nextCtaHint = ctaHint ?? existing.cta_hint ?? "";
    const nextSlug = slugify(slug ?? nextTitle ?? existing.slug ?? existing.title ?? "post");

    const duplicateRows = await sql`
      select id
      from blog_post
      where slug = ${nextSlug}
        and id <> ${id}
      limit 1
    `;

    if (duplicateRows[0]) {
      return res.status(409).json({
        ok: false,
        error: "Slug already exists",
      });
    }

    const rows = await sql`
      update blog_post
      set
        slug = ${nextSlug},
        title = ${nextTitle},
        excerpt = ${nextExcerpt},
        content = ${nextContent},
        meta_title = ${nextMetaTitle},
        meta_description = ${nextMetaDescription},
        cover_image = ${nextCoverImage},
        cta_hint = ${nextCtaHint},
        updated_at = now()
      where id = ${id}
      returning
        id,
        slug,
        title,
        excerpt,
        content,
        meta_title,
        meta_description,
        cover_image,
        cta_hint,
        status,
        published_at,
        created_at,
        updated_at
    `;

    return res.status(200).json({
      ok: true,
      post: normalizeBlogPost(rows[0]),
    });
  } catch (err) {
    console.error("[admin/updateBlogPost] failed", err);
    return res.status(500).json({ ok: false, error: "Failed to update blog post" });
  }
}

async function handlePublishBlogPost(req, res) {
  try {
    const me = await requireAdmin(req, res);
    if (!me) return;

    const { id } = req.body || {};

    if (!id) {
      return res.status(400).json({ ok: false, error: "Missing post id" });
    }

    const existingRows = await sql`
      select id, published_at
      from blog_post
      where id = ${id}
      limit 1
    `;

    const existing = existingRows[0];

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Blog post not found" });
    }

    const rows = await sql`
      update blog_post
      set
        status = 'published',
        published_at = coalesce(published_at, now()),
        updated_at = now()
      where id = ${id}
      returning
        id,
        slug,
        title,
        excerpt,
        content,
        meta_title,
        meta_description,
        cover_image,
        cta_hint,
        status,
        published_at,
        created_at,
        updated_at
    `;

    return res.status(200).json({
      ok: true,
      post: normalizeBlogPost(rows[0]),
    });
  } catch (err) {
    console.error("[admin/publishBlogPost] failed", err);
    return res.status(500).json({ ok: false, error: "Failed to publish blog post" });
  }
}

/* =========================
   BLOG GENERATION
========================= */

async function handleGenerateDraft(req, res) {
  try {
    const me = await requireAdmin(req, res);
    if (!me) return;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "AI service not configured",
      });
    }

    const { type, lang = "en", context = {} } = req.body || {};

    const forecastData = normalizeForecastRawInput(context?.forecastRawInput);

    if (!type) {
      return res.status(400).json({ ok: false, error: "Missing blog type" });
    }

    const isComparison = type === "weather_comparison";

    if (!context?.baseCampsite || !context?.region || (isComparison && !context?.compareCampsite)) {
      return res.status(400).json({
        ok: false,
        error: "Missing required campsite context",
        details: {
          baseCampsite: !context?.baseCampsite,
          compareCampsite: isComparison && !context?.compareCampsite,
          region: !context?.region,
        },
      });
    }

    const allowedTypes = ["campsite_weather", "weather_comparison"];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid blog type",
        allowedTypes,
      });
    }

    const prompt = buildPrompt({
      type,
      lang,
      context: {
        ...context,
        forecastRawInput: forecastData.normalizedText,
        forecastSummary: forecastData.summaryText,
      },
    });
    const aiResponse = await callAI(prompt);
    const draft = normalizeDraft(aiResponse);

    let baseSlug = slugify(draft.slug || draft.title || "post");
    if (!baseSlug) baseSlug = "post";

    let nextSlug = baseSlug;
    let counter = 2;

    while (true) {
      const duplicateRows = await sql`
        select id
        from blog_post
        where slug = ${nextSlug}
        limit 1
      `;

      if (!duplicateRows[0]) break;

      nextSlug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    const insertedRows = await sql`
      insert into blog_post (
        slug,
        title,
        excerpt,
        content,
        meta_title,
        meta_description,
        status
      )
      values (
        ${nextSlug},
        ${draft.title || "Untitled"},
        ${draft.excerpt || ""},
        ${draft.content || ""},
        ${draft.metaTitle || draft.title || ""},
        ${draft.metaDescription || ""},
        'draft'
      )
      returning
        id,
        slug,
        title,
        excerpt,
        content,
        meta_title,
        meta_description,
        cover_image,
        cta_hint,
        status,
        published_at,
        created_at,
        updated_at
    `;

    return res.status(200).json({
      ok: true,
      draft: normalizeBlogPost(insertedRows[0]),
    });
  } catch (err) {
    console.error("generate-blog-draft error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to generate draft",
      details: err?.message || String(err),
    });
  }
}

function buildPrompt({ type, lang, context }) {
  const language = lang === "is" ? "Icelandic" : "English";

  if (type === "weather_comparison") {
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
- The worst weather conditions must dominate the comparison, not averages
- If one campsite has extreme conditions (e.g. very high wind, heavy snow, heavy rain), this should strongly influence the conclusion
- Do not treat all factors equally if one risk is clearly more severe
- The comparison must clearly indicate which campsite is better, worse, or if both are poor choices
- If one campsite is clearly worse overall, state that explicitly
- Avoid neutral conclusions when the data shows a meaningful difference
- Do not structure the content as a list of attributes (e.g. wind, rain, temperature)
- Do not present the comparison as a table or bullet-style breakdown
- Write as a continuous comparison driven by the actual conditions
- Do not invent terrain details, shelter elements, campsite facilities, or amenities unless explicitly provided in the context
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
  - Focus on the worst weather, not average conditions
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

Meta rules:
- Meta title must include location and decision intent (e.g. where to camp, which is better, wind conditions)
- Meta description must clearly state the practical benefit for the reader
- Avoid generic descriptions in meta text

Return ONLY valid JSON.
Do not wrap the JSON in markdown code fences.
Do not include any extra commentary.

Return this exact shape:
{
  "title": "...",
  "excerpt": "...",
  "slug": "...",
  "content": "...",
  "metaTitle": "...",
  "metaDescription": "..."
}

Content must be markdown.
`;
  }

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
  - Focus on the worst weather, not average conditions
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

Meta rules:
- Meta title must include the campsite name and region
- Meta description must explain the practical value for campers
- Do not use clickbait
- Do not invent live forecast details in meta text

Return ONLY valid JSON.
Do not wrap the JSON in markdown code fences.
Do not include any extra commentary.

Return this exact shape:
{
  "title": "...",
  "excerpt": "...",
  "slug": "...",
  "content": "...",
  "metaTitle": "...",
  "metaDescription": "..."
}

Content must be markdown.
`;
}

async function callAI(prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "AI request failed");
  }

  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("AI returned empty response");
  }

  return text;
}

function normalizeDraft(text) {
  try {
    const parsed = JSON.parse(text);

    return {
      title: parsed.title || "Untitled",
      excerpt: parsed.excerpt || "",
      slug: slugify(parsed.slug || parsed.title || "post"),
      content: parsed.content || "",
      metaTitle: parsed.metaTitle || parsed.title || "",
      metaDescription: parsed.metaDescription || "",
    };
  } catch (e) {
    return {
      title: "Draft generation failed",
      excerpt: "",
      slug: "draft-error",
      content: text || "",
      metaTitle: "",
      metaDescription: "",
    };
  }
}

/* =========================
   PUBLIC BLOG READS
========================= */

async function handleGetPublishedBlogPosts(req, res) {
  try {
    const rows = await sql`
      select
        id,
        slug,
        title,
        excerpt,
        content,
        meta_title,
        meta_description,
        cover_image,
        cta_hint,
        status,
        published_at,
        created_at,
        updated_at
      from blog_post
      where lower(coalesce(status, 'draft')) = 'published'
      order by published_at desc nulls last, created_at desc
    `;

    return res.status(200).json({
      ok: true,
      posts: rows.map(normalizeBlogPost),
    });
  } catch (err) {
    console.error("[admin/getPublishedBlogPosts] failed", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to load blog posts",
    });
  }
}

async function handleGetPublishedBlogPostBySlug(req, res) {
  try {
    const { slug } = req.query || {};

    if (!slug || typeof slug !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Missing slug",
      });
    }

    const rows = await sql`
      select
        id,
        slug,
        title,
        excerpt,
        content,
        meta_title,
        meta_description,
        cover_image,
        cta_hint,
        status,
        published_at,
        created_at,
        updated_at
      from blog_post
      where slug = ${slug}
        and lower(coalesce(status, 'draft')) = 'published'
      limit 1
    `;

    const post = rows[0];

    if (!post) {
      return res.status(404).json({
        ok: false,
        error: "Blog post not found",
      });
    }

    return res.status(200).json({
      ok: true,
      post: normalizeBlogPost(post),
    });
  } catch (err) {
    console.error("[admin/getPublishedBlogPostBySlug] failed", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to load blog post",
    });
  }
}

async function handleDeleteBlogPost(req, res) {
  try {
    const me = await requireAdmin(req, res);
    if (!me) return;

    const { id } = req.body || {};

    if (!id) {
      return res.status(400).json({ ok: false, error: "Missing post id" });
    }

    const existingRows = await sql`
      select id, status
      from blog_post
      where id = ${id}
      limit 1
    `;

    const existing = existingRows[0];

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Blog post not found" });
    }

    if (existing.status === "published") {
      return res.status(400).json({
        ok: false,
        error: "Only drafts can be deleted",
      });
    }

    await sql`
      delete from blog_post
      where id = ${id}
    `;

    return res.status(200).json({
      ok: true,
      deletedId: id,
    });
  } catch (err) {
    console.error("[admin/deleteBlogPost] failed", err);
    return res.status(500).json({ ok: false, error: "Failed to delete blog post" });
  }
}

/* =========================
   MAIN HANDLER
========================= */

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { action } = req.query || {};

    if (action === "listBlogPosts") {
      return handleListBlogPosts(req, res);
    }

    if (action === "getPublishedBlogPosts") {
      return handleGetPublishedBlogPosts(req, res);
    }

    if (action === "getPublishedBlogPostBySlug") {
      return handleGetPublishedBlogPostBySlug(req, res);
    }

    return handleSummary(req, res);
  }

  if (req.method === "POST") {
    const { action } = req.body || {};

    if (action === "generateDraft") {
      return handleGenerateDraft(req, res);
    }

    if (action === "updateBlogPost") {
      return handleUpdateBlogPost(req, res);
    }

    if (action === "publishBlogPost") {
      return handlePublishBlogPost(req, res);
    }

    if (action === "deleteBlogPost") {
      return handleDeleteBlogPost(req, res);
    }

    return res.status(400).json({ ok: false, error: "Unknown action" });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, error: "Method not allowed" });
}

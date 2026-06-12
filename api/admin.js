import { randomUUID } from "crypto";
import { isAdminEmail } from "./_lib/admin.js";
import { getMeFromRequest } from "./_lib/getMe.js";
import { buildBlogPrompt, BLOG_POST_TYPES } from "./_lib/buildBlogPrompt.js";
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

async function deduplicateSlug(base) {
  let slug = base || "post";
  let counter = 2;
  while (true) {
    const dup = await sql`SELECT id FROM blog_post WHERE slug = ${slug} LIMIT 1`;
    if (!dup[0]) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
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
    sourceType: row.source_type || null,
    topic: row.topic || null,
    ctaTitle: row.cta_title || null,
    ctaText: row.cta_text || null,
    ctaButton: row.cta_button || null,
    ctaTarget: row.cta_target || null,
    nearbyHighlights: row.nearby_highlights || null,
    nearbyAttractions: row.nearby_attractions || null,
    status: row.status || "draft",
    publishedAt: row.published_at || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    language: row.language || "is",
    translationGroupId: row.translation_group_id || null,
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
  let text = String(raw || "")
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

  const DAY_BOUNDARY = /^(mán|þri|mið|fim|fös|lau|sun)\./i;
  const STATUS_BADGE = /^(slæmt|gott|ok|sæm|best)\.?$/i;
  const STRIP_CHARS = /[›⚠️🌬]/g;

  text = text.replace(/\t/g, " ");

  // Ensure every day abbreviation+date starts on its own line before grouping
  const rawText = text
    .replace(/ (mán|þri|mið|fim|fös|lau|sun)\. /gi, "\n$1. ")
    .replace(/\n{2,}/g, "\n")
    .trim();

  const allLines = rawText
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (!allLines.length) {
    return {
      normalizedText: "",
      summaryText: "",
      metrics: null,
    };
  }

  // Group multi-line day blocks into single joined lines for parseForecastLine
  const dayGroups = [];
  let currentGroup = null;
  for (const line of allLines) {
    if (DAY_BOUNDARY.test(line)) {
      if (currentGroup) dayGroups.push(currentGroup);
      currentGroup = [line];
    } else if (currentGroup !== null) {
      currentGroup.push(line);
    }
    // Lines before the first day boundary (e.g. leading status badge) are dropped
  }
  if (currentGroup) dayGroups.push(currentGroup);

  const lines = dayGroups.length
    ? dayGroups
        .map((group) => {
          const clean = group
            .filter((l) => !STATUS_BADGE.test(l))
            .map((l) => l.replace(STRIP_CHARS, "").trim())
            .filter(Boolean);
          if (!clean.length) return null;
          // Strip weather description prefix before day abbreviation so parseForecastLine matches the day name
          const dayStart = clean[0].match(/\b(mán|þri|mið|fim|fös|lau|sun)\b/i);
          if (dayStart) clean[0] = clean[0].slice(dayStart.index);
          return clean.join(" ").replace(/\s+/g, " ").trim();
        })
        .filter(Boolean)
    : allLines; // fallback: treat each line individually (original behaviour)

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

  const elevatedWindDays = [];
  const rainDays = [];
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

    const isElevatedWind =
      (typeof row.wind === "number" && row.wind >= 10) ||
      (typeof row.gust === "number" && row.gust >= 20);

    const isRainy = typeof row.rain === "number" && row.rain >= 10;

    const isCold = typeof row.minTemp === "number" && row.minTemp <= 0;

    if (isElevatedWind) elevatedWindDays.push(row.day);
    if (isRainy) rainDays.push(row.day);
    if (isCold) coldDays.push(row.day);
  }

  const totalDays = parsed.length;
  const thresholdDaysUnion = new Set([...elevatedWindDays, ...rainDays]);
  const thresholdCount = thresholdDaysUnion.size;

  let weekClassification;
  if (thresholdCount <= 1) {
    weekClassification = "Mostly calm";
  } else if (thresholdCount <= 3) {
    weekClassification = "Mixed";
  } else {
    weekClassification = "Predominantly poor";
  }

  const summaryLines = [
    `Week classification: ${weekClassification} (${thresholdCount} of ${totalDays} days above wind/rain threshold)`,
  ];

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

  if (elevatedWindDays.length) {
    summaryLines.push(`Elevated wind days: ${elevatedWindDays.join(", ")}`);
  }

  if (rainDays.length) {
    summaryLines.push(`Rain days: ${rainDays.join(", ")}`);
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
      elevatedWindDays,
      rainDays,
      coldDays,
      weekClassification,
      thresholdCount,
      totalDays,
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
        source_type,
        topic,
        cta_title,
        cta_text,
        cta_button,
        cta_target,
        nearby_highlights,
        nearby_attractions,
        status,
        published_at,
        created_at,
        updated_at,
        language,
        translation_group_id
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

    const {
      id,
      title,
      excerpt,
      content,
      metaTitle,
      metaDescription,
      coverImage,
      ctaHint,
      slug,
      sourceType,
      topic,
      ctaTitle,
      ctaText,
      ctaButton,
      ctaTarget,
      nearbyHighlights,
      nearbyAttractions,
    } = req.body || {};

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
        source_type,
        topic,
        cta_title,
        cta_text,
        cta_button,
        cta_target,
        nearby_highlights,
        nearby_attractions,
        status,
        published_at,
        created_at,
        updated_at,
        language,
        translation_group_id
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
    const nextSourceType = sourceType ?? existing.source_type ?? null;
    const nextTopic = topic ?? existing.topic ?? null;
    const nextCtaTitle = ctaTitle ?? existing.cta_title ?? null;
    const nextCtaText = ctaText ?? existing.cta_text ?? null;
    const nextCtaButton = ctaButton ?? existing.cta_button ?? null;
    const nextCtaTarget = ctaTarget ?? existing.cta_target ?? null;
    const nextNearbyHighlights =
      nearbyHighlights !== undefined
        ? nearbyHighlights || null
        : (existing.nearby_highlights ?? null);
    const nextNearbyAttractions = nearbyAttractions ?? existing.nearby_attractions ?? null;
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
        source_type = ${nextSourceType},
        topic = ${nextTopic},
        cta_title = ${nextCtaTitle},
        cta_text = ${nextCtaText},
        cta_button = ${nextCtaButton},
        cta_target = ${nextCtaTarget},
        nearby_highlights = ${nextNearbyHighlights},
        nearby_attractions = ${nextNearbyAttractions},
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
        source_type,
        topic,
        cta_title,
        cta_text,
        cta_button,
        cta_target,
        nearby_highlights,
        nearby_attractions,
        status,
        published_at,
        created_at,
        updated_at,
        language,
        translation_group_id
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
        source_type,
        topic,
        cta_title,
        cta_text,
        cta_button,
        cta_target,
        nearby_highlights,
        nearby_attractions,
        status,
        published_at,
        created_at,
        updated_at,
        language,
        translation_group_id
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

    const { type, lang = "en", context = {}, coverImage = "" } = req.body || {};

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

    const allowedTypes = BLOG_POST_TYPES;

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid blog type",
        allowedTypes,
      });
    }

    const enrichedContext = {
      ...context,
      forecastRawInput: forecastData.normalizedText,
      forecastSummary: forecastData.summaryText,
    };

    console.log("=== FORECAST SUMMARY ===");
    console.log(enrichedContext.forecastSummary);
    console.log("=== END ===");

    // Generate IS version
    const isPrompt = buildBlogPrompt(type, { lang: "is", context: enrichedContext });
    const isAiResponse = await callAI(isPrompt);
    const isDraft = normalizeDraft(isAiResponse);

    // Generate EN version — failure does not abort the request
    let enDraft = null;
    try {
      const enPrompt = buildBlogPrompt(type, { lang: "en", context: enrichedContext });
      const enAiResponse = await callAI(enPrompt);
      enDraft = normalizeDraft(enAiResponse);
    } catch (enErr) {
      console.error("[generate-draft] EN generation failed:", enErr?.message);
    }

    const groupId = randomUUID();

    const RETURNING_COLS = sql`
      id, slug, title, excerpt, content,
      meta_title, meta_description, cover_image, cta_hint,
      source_type, topic,
      cta_title, cta_text, cta_button, cta_target,
      nearby_highlights, nearby_attractions,
      status, published_at, created_at, updated_at,
      language, translation_group_id
    `;

    // Insert IS row
    const isSlug = await deduplicateSlug(
      slugify(isDraft.slug || isDraft.title || "post") || "post"
    );
    const isRows = await sql`
      insert into blog_post (
        slug, title, excerpt, content,
        meta_title, meta_description, cover_image,
        source_type, topic,
        cta_title, cta_text, cta_button, cta_target,
        nearby_highlights, nearby_attractions,
        status, language, translation_group_id
      ) values (
        ${isSlug},
        ${isDraft.title || "Untitled"},
        ${isDraft.excerpt || ""},
        ${isDraft.content || ""},
        ${isDraft.metaTitle || isDraft.title || ""},
        ${isDraft.metaDescription || ""},
        ${coverImage || null},
        'automated',
        ${null},
        ${null}, ${null}, ${null}, ${null},
        ${null},
        ${isDraft.nearbyAttractions || null},
        'draft', 'is', ${groupId}
      )
      returning ${RETURNING_COLS}
    `;

    // Insert EN row — failure logged, not thrown
    let enRows = null;
    if (enDraft) {
      try {
        const enSlug = await deduplicateSlug(
          slugify(enDraft.slug || enDraft.title || "post") || "post"
        );
        enRows = await sql`
          insert into blog_post (
            slug, title, excerpt, content,
            meta_title, meta_description, cover_image,
            source_type, topic,
            cta_title, cta_text, cta_button, cta_target,
            nearby_highlights, nearby_attractions,
            status, language, translation_group_id
          ) values (
            ${enSlug},
            ${enDraft.title || "Untitled"},
            ${enDraft.excerpt || ""},
            ${enDraft.content || ""},
            ${enDraft.metaTitle || enDraft.title || ""},
            ${enDraft.metaDescription || ""},
            ${coverImage || null},
            'automated',
            ${null},
            ${null}, ${null}, ${null}, ${null},
            ${null},
            ${enDraft.nearbyAttractions || null},
            'draft', 'en', ${groupId}
          )
          returning ${RETURNING_COLS}
        `;
      } catch (enInsertErr) {
        console.error("[generate-draft] EN insert failed:", enInsertErr?.message);
      }
    }

    return res.status(200).json({
      ok: true,
      draft: {
        ...normalizeBlogPost(isRows[0]),
        weatherNarrative: isDraft.weatherNarrative,
        movementNarrative: isDraft.movementNarrative,
        nearbyHighlights: isDraft.nearbyHighlights,
        nearbyAttractions: isDraft.nearbyAttractions,
        whyThisArea: isDraft.whyThisArea,
      },
      ...(enRows?.[0]
        ? {
            draftEn: {
              ...normalizeBlogPost(enRows[0]),
              weatherNarrative: enDraft?.weatherNarrative,
              movementNarrative: enDraft?.movementNarrative,
              nearbyHighlights: enDraft?.nearbyHighlights,
              nearbyAttractions: enDraft?.nearbyAttractions,
              whyThisArea: enDraft?.whyThisArea,
            },
          }
        : {}),
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
      weatherNarrative:
        typeof parsed.weatherNarrative === "string" ? parsed.weatherNarrative : null,
      movementNarrative:
        typeof parsed.movementNarrative === "string" ? parsed.movementNarrative : null,
      nearbyHighlights: Array.isArray(parsed.nearbyHighlights) ? parsed.nearbyHighlights : null,
      nearbyAttractions:
        typeof parsed.nearbyAttractions === "string" ? parsed.nearbyAttractions : null,
      whyThisArea: typeof parsed.whyThisArea === "string" ? parsed.whyThisArea : null,
    };
  } catch (e) {
    return {
      title: "Draft generation failed",
      excerpt: "",
      slug: "draft-error",
      content: text || "",
      metaTitle: "",
      metaDescription: "",
      weatherNarrative: null,
      movementNarrative: null,
      nearbyHighlights: null,
      nearbyAttractions: null,
      whyThisArea: null,
    };
  }
}

/* =========================
   PUBLIC BLOG READS
========================= */

async function handleGetPublishedBlogPosts(req, res) {
  try {
    const language = req.query?.language || "is";

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
        source_type,
        topic,
        cta_title,
        cta_text,
        cta_button,
        cta_target,
        nearby_highlights,
        nearby_attractions,
        status,
        published_at,
        created_at,
        updated_at,
        language,
        translation_group_id
      from blog_post
      where lower(coalesce(status, 'draft')) = 'published'
        and coalesce(language, 'is') = ${language}
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
    const { slug, language = "is" } = req.query || {};

    if (!slug || typeof slug !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Missing slug",
      });
    }

    if (req.query?.preview === "draft") {
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
          source_type,
          topic,
          cta_title,
          cta_text,
          cta_button,
          cta_target,
          nearby_highlights,
          nearby_attractions,
          status,
          published_at,
          created_at,
          updated_at,
          language,
          translation_group_id
        from blog_post
        where slug = ${slug}
        order by
          case when coalesce(language, 'is') = ${language} then 0 else 1 end,
          case when coalesce(language, 'is') = 'is' then 0 else 1 end
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
        source_type,
        topic,
        cta_title,
        cta_text,
        cta_button,
        cta_target,
        nearby_highlights,
        nearby_attractions,
        status,
        published_at,
        created_at,
        updated_at,
        language,
        translation_group_id
      from blog_post
      where slug = ${slug}
        and lower(coalesce(status, 'draft')) = 'published'
      order by
        case when coalesce(language, 'is') = ${language} then 0 else 1 end,
        case when coalesce(language, 'is') = 'is' then 0 else 1 end
      limit 1
    `;

    const post = rows[0];

    if (!post) {
      return res.status(404).json({
        ok: false,
        error: "Blog post not found",
        slug,
        language,
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

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

    if (!type) {
      return res.status(400).json({ ok: false, error: "Missing blog type" });
    }

    if (!context?.baseCampsite || !context?.compareCampsite || !context?.region) {
      return res.status(400).json({
        ok: false,
        error: "Missing required campsite context",
        details: {
          baseCampsite: !context?.baseCampsite,
          compareCampsite: !context?.compareCampsite,
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

    const prompt = buildPrompt({ type, lang, context });
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
- Do not invent terrain details, shelter elements, or campsite facilities unless explicitly provided in the context
- If a detail is unknown, do not guess
- Focus on helping the reader make a decision
- Avoid all generic travel descriptions
- Do not describe scenery unless it affects camping conditions
- Explain WHY differences matter, especially wind, shelter, and exposure
- Treat campsites as decision options, not destinations
- If weather differs, explain the real-world impact (tents, comfort, driving, overnight conditions)
- Keep the content grounded and specific
- Do not invent facilities, amenities, or activities unless clearly implied by the context
- Do not make the campsites sound equally good if there is a meaningful difference
- Be specific and decisive when describing differences
- Avoid hedging language ("can", "may", "might", "often") unless absolutely necessary
- If one campsite is more exposed to wind, state it clearly
- Avoid ALL of the following phrases or anything similar:
  "Iceland offers", "stunning", "breathtaking", "unique experience", "nestled", "picturesque", "perfect for"

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
Write a campsite weather blog post.

Language: ${language}

Tone:
- Practical and experience-based
- Clear and grounded
- Decision-focused
- Not promotional

Structure:
- Title
- Short intro (set context quickly, no fluff)
- Main weather insight
- Practical impact for campers
- Decision section: what the reader should consider
- Soft conclusion
- End with one short, strong takeaway sentence

Rules:
- Do not invent terrain details, shelter elements, or campsite facilities unless explicitly provided in the context
- If a detail is unknown, do not guess
- Focus on helping the reader make a camping decision
- Avoid generic travel writing
- Focus on useful weather insight
- Keep the content specific and grounded
- Explain why the weather matters in practice (wind, rain, gusts, exposure, comfort, overnight conditions, driving if relevant)
- Treat campsites as decision options, not destinations
- Do not invent facilities, amenities, or activities unless clearly implied by the context
- Be specific and decisive
- Avoid hedging language ("can", "may", "might", "often") unless absolutely necessary
- Prefer direct, practical statements
- Include location and decision intent in the meta title
- Make the meta description useful and click-worthy, not generic

Important:
- The reader is actively deciding where to stay or whether to move
- Small weather differences can matter a lot in Iceland
- Prioritize practical decision value over general travel writing
- Write like advice for someone planning where to sleep tonight

Avoid:
- "Iceland offers"
- "stunning views"
- "unique experience"
- "breathtaking"
- "nestled"
- "picturesque"
- "perfect for"
- generic tourism language

Meta rules:
- Meta title must include location and decision intent (e.g. where to camp, weather conditions, wind, rain)
- Meta title should be clear and slightly SEO-oriented, not generic
- Meta description must explain the practical benefit to the reader
- Meta description should feel like a helpful summary, not marketing text
- Avoid vague descriptions like "explore", "discover", "learn about"
- Prefer phrasing that reflects real user intent (e.g. "where to camp", "should you move", "best option in wind")
- Prefer including location (e.g. Westfjords, South Iceland) in meta title

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

    return res.status(400).json({ ok: false, error: "Unknown action" });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, error: "Method not allowed" });
}

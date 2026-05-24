import postgres from "postgres";
import { buildBlogPrompt } from "../_lib/buildBlogPrompt.js";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });

// Only types with prompt handlers that work without live forecast data
const CRON_TYPES = ["best_this_week", "wind_safety", "avoid_bad_weather"];

// Static context pool — no live forecast; AI writes general seasonal guidance
const CRON_CONTEXTS = {
  best_this_week: [
    { region: "Suðurland", lang: "is" },
    { region: "Vesturland", lang: "is" },
    { region: "Norðurland eystra", lang: "is" },
    { region: "Austurland", lang: "is" },
  ],
  wind_safety: [
    { baseCampsite: "Þórsmörk", region: "Suðurland", lang: "is" },
    { baseCampsite: "Skaftafell", region: "Suðurland", lang: "is" },
    { baseCampsite: "Snæfellsnes", region: "Vesturland", lang: "is" },
    { baseCampsite: "Mývatn", region: "Norðurland eystra", lang: "is" },
  ],
  avoid_bad_weather: [
    { baseCampsite: "Landmannalaugar", region: "Suðurland", lang: "is" },
    { baseCampsite: "Þórsmörk", region: "Suðurland", lang: "is" },
    { baseCampsite: "Kjölur", region: "Hálendið", lang: "is" },
    { baseCampsite: "Hornstrandir", region: "Vestfirðir", lang: "is" },
  ],
};

function slugify(str = "") {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
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
  if (!text) throw new Error("AI returned empty response");
  return text;
}

function parseDraft(text) {
  try {
    const parsed = JSON.parse(text);
    return {
      title: typeof parsed.title === "string" ? parsed.title : null,
      excerpt: typeof parsed.excerpt === "string" ? parsed.excerpt : "",
      slug: slugify(parsed.slug || parsed.title || ""),
      content: typeof parsed.content === "string" ? parsed.content : null,
      metaTitle: typeof parsed.metaTitle === "string" ? parsed.metaTitle : "",
      metaDescription: typeof parsed.metaDescription === "string" ? parsed.metaDescription : "",
      nearbyAttractions: typeof parsed.nearbyAttractions === "string" ? parsed.nearbyAttractions : null,
    };
  } catch {
    return null;
  }
}

function isValidDraft(draft) {
  return (
    draft !== null &&
    typeof draft.title === "string" && draft.title.trim().length > 0 &&
    typeof draft.content === "string" && draft.content.trim().length > 100 &&
    typeof draft.slug === "string" && draft.slug.trim().length > 0
  );
}

export default async function handler(req, res) {
  const authHeader = req.headers?.authorization;
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("[cron/generate-blog-draft] OPENAI_API_KEY not configured");
    return res.status(500).json({ ok: false, error: "AI service not configured" });
  }

  try {
    // Duplicate protection: skip if any automated draft was created within last 5 days
    const recentRows = await sql`
      SELECT id FROM blog_post
      WHERE source_type = 'automated'
        AND created_at > now() - interval '5 days'
      LIMIT 1
    `;

    if (recentRows.length > 0) {
      console.log("[cron/generate-blog-draft] Automated draft exists within last 5 days, skipping");
      return res.status(200).json({ ok: true, skipped: true, reason: "recent_draft_exists" });
    }

    // Rotation: prefer types not used in the last 5 automated drafts
    const recentTypeRows = await sql`
      SELECT topic FROM blog_post
      WHERE source_type = 'automated'
        AND topic IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const recentTypes = recentTypeRows.map((r) => r.topic).filter(Boolean);
    const available = CRON_TYPES.filter((t) => !recentTypes.includes(t));
    const type = available.length > 0 ? pickRandom(available) : pickRandom(CRON_TYPES);

    const contextPool = CRON_CONTEXTS[type];
    const { lang, ...context } = pickRandom(contextPool);

    const prompt = buildBlogPrompt(type, { lang, context });

    let aiText;
    try {
      aiText = await callAI(prompt);
    } catch (err) {
      console.error("[cron/generate-blog-draft] AI call failed:", err?.message);
      return res.status(500).json({ ok: false, error: "AI generation failed" });
    }

    const draft = parseDraft(aiText);

    if (!isValidDraft(draft)) {
      console.error("[cron/generate-blog-draft] Invalid draft shape from AI");
      return res.status(500).json({ ok: false, error: "AI returned invalid draft shape" });
    }

    // Deduplicate slug
    let baseSlug = draft.slug || "post";
    let nextSlug = baseSlug;
    let counter = 2;

    while (true) {
      const dup = await sql`SELECT id FROM blog_post WHERE slug = ${nextSlug} LIMIT 1`;
      if (!dup[0]) break;
      nextSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    await sql`
      INSERT INTO blog_post (
        slug,
        title,
        excerpt,
        content,
        meta_title,
        meta_description,
        source_type,
        topic,
        nearby_attractions,
        status
      ) VALUES (
        ${nextSlug},
        ${draft.title},
        ${draft.excerpt},
        ${draft.content},
        ${draft.metaTitle || draft.title},
        ${draft.metaDescription},
        'automated',
        ${type},
        ${draft.nearbyAttractions},
        'draft'
      )
    `;

    console.log(`[cron/generate-blog-draft] Saved draft: "${draft.title}" (type=${type})`);
    return res.status(200).json({ ok: true, type, title: draft.title });
  } catch (err) {
    console.error("[cron/generate-blog-draft] Unexpected error:", err?.message);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
}

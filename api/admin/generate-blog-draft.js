export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("cwd:", process.cwd());
    console.log("API KEY EXISTS:", !!process.env.OPENAI_API_KEY);
    console.log("API KEY PREFIX:", process.env.OPENAI_API_KEY?.slice(0, 7));

    const { type = "weather_comparison", lang = "en", context = {} } = req.body || {};

    if (!type) {
      return res.status(400).json({ error: "Missing type" });
    }

    const prompt = buildPrompt({ type, lang, context });

    const aiResponse = await callAI(prompt);

    const draft = normalizeDraft(aiResponse);

    return res.status(200).json(draft);
  } catch (err) {
    console.error("generate-blog-draft error:", err);
    return res.status(500).json({
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
- Practical
- Observational
- Not promotional

Structure:
- Title
- Short intro
- Comparison (bullet points)
- Insight about local weather differences
- Soft conclusion

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
Write a simple campsite weather blog post.

Language: ${language}

Return ONLY valid JSON with:
title, excerpt, slug, content, metaTitle, metaDescription
`;
}

async function callAI(prompt) {
  // replace with your actual AI call
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

function slugify(str = "") {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

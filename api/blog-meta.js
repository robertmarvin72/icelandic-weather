import postgres from "postgres";
import fs from "fs";
import path from "path";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });

const FALLBACK_IMAGE = "https://eltumvedrid.is/social-preview.png";
const SITE_ORIGIN = "https://eltumvedrid.is";

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function injectBlogMeta(html, { title, description, ogImage, ogUrl }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImage = escapeHtml(ogImage);
  const safeUrl = escapeHtml(ogUrl);

  let result = html;

  result = result.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`);
  result = result.replace(/<meta\s+name="description"[^>]*>/, `<meta name="description" content="${safeDesc}">`);
  result = result.replace(/<meta\s+property="og:title"[^>]*>/, `<meta property="og:title" content="${safeTitle}">`);
  result = result.replace(/<meta\s+property="og:description"[^>]*>/, `<meta property="og:description" content="${safeDesc}">`);
  result = result.replace(/<meta\s+property="og:image"[^>]*>/, `<meta property="og:image" content="${safeImage}">`);
  result = result.replace(/<meta\s+property="og:url"[^>]*>/, `<meta property="og:url" content="${safeUrl}">`);

  const extraMeta = [
    `  <meta property="og:type" content="article">`,
    `  <meta name="twitter:title" content="${safeTitle}">`,
    `  <meta name="twitter:description" content="${safeDesc}">`,
    `  <meta name="twitter:image" content="${safeImage}">`,
  ].join("\n");

  result = result.replace("</head>", `${extraMeta}\n</head>`);

  return result;
}

function readBaseHtml() {
  const candidates = [
    path.join(process.cwd(), "dist", "index.html"),
    path.join(process.cwd(), "index.html"),
  ];
  for (const p of candidates) {
    try {
      return fs.readFileSync(p, "utf-8");
    } catch {
      // try next candidate
    }
  }
  return null;
}

export default async function handler(req, res) {
  const slug = typeof req.query?.slug === "string" ? req.query.slug.trim() : "";

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  const baseHtml = readBaseHtml();

  if (!baseHtml) {
    console.error("[blog-meta] Could not read index.html");
    return res.status(200).send("<!doctype html><html><head></head><body><div id='root'></div></body></html>");
  }

  if (!slug) {
    return res.status(200).send(baseHtml);
  }

  let post = null;
  try {
    const rows = await sql`
      SELECT title, excerpt, meta_title, meta_description, cover_image, slug
      FROM blog_post
      WHERE slug = ${slug}
        AND lower(coalesce(status, 'draft')) = 'published'
      LIMIT 1
    `;
    post = rows[0] || null;
  } catch (err) {
    console.error("[blog-meta] DB query failed:", err?.message);
    return res.status(200).send(baseHtml);
  }

  if (!post) {
    return res.status(200).send(baseHtml);
  }

  const title = post.meta_title || `${post.title || "Eltum Veðrið"} | Eltum Veðrið`;
  const description = post.meta_description || post.excerpt || "";
  const ogImage = post.cover_image || FALLBACK_IMAGE;
  const ogUrl = `${SITE_ORIGIN}/blog/${post.slug}`;

  const modifiedHtml = injectBlogMeta(baseHtml, { title, description, ogImage, ogUrl });

  return res.status(200).send(modifiedHtml);
}

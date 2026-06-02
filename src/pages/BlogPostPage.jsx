import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import BlogPostCta from "../components/blog/BlogPostCta";
import { Helmet } from "react-helmet-async";

function formatPublishedDate(dateString, lang = "en") {
  try {
    return new Date(dateString).toLocaleDateString(lang === "is" ? "is-IS" : "en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function translateOrFallback(t, key, fallback) {
  const value = t?.(key);
  if (!value || value === key) return fallback;
  return value;
}

function BlogContent({ content, isLight }) {
  return (
    <div className="mt-8 max-w-2xl mx-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h2: ({ node, ...props }) => (
            <h2
              {...props}
              className={`mt-10 text-3xl font-semibold tracking-tight ${
                isLight ? "text-slate-900" : "text-slate-100"
              }`}
            />
          ),
          p: ({ node, ...props }) => (
            <p
              {...props}
              className={`mt-4 text-lg leading-8 ${isLight ? "text-slate-700" : "text-slate-300"}`}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              {...props}
              className="text-sky-600 underline underline-offset-4 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
            />
          ),
          img: ({ node, ...props }) => (
            <img
              {...props}
              className="my-6 w-full rounded-2xl border border-black/10 dark:border-white/10"
              loading="lazy"
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              {...props}
              className={`mt-4 list-disc pl-6 ${isLight ? "text-slate-700" : "text-slate-300"}`}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              {...props}
              className={`mt-4 list-decimal pl-6 ${isLight ? "text-slate-700" : "text-slate-300"}`}
            />
          ),
          li: ({ node, ...props }) => <li {...props} className="mt-2" />,
          strong: ({ node, ...props }) => (
            <strong
              {...props}
              className={isLight ? "font-semibold text-slate-900" : "font-semibold text-slate-100"}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function BlogPostPage({ t, lang, theme }) {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const isLight = theme === "light";

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      setLoading(true);
      setLoadError("");

      try {
        const language = lang || "is";

        const res = await fetch(
          `/api/admin?action=getPublishedBlogPostBySlug&slug=${encodeURIComponent(slug)}&language=${language}`,
          {
            cache: "no-store",
          }
        );

        if (res.status === 404) {
          const draftRes = await fetch(
            `/api/admin?action=getPublishedBlogPostBySlug&slug=${encodeURIComponent(slug)}&preview=draft&language=${language}`,
            {
              cache: "no-store",
              credentials: "include",
            }
          );

          if (draftRes.status === 403) {
            if (!cancelled) {
              setPost(null);
              setLoadError("");
            }
            return;
          }

          const draftJson = await draftRes.json().catch(() => ({}));

          if (draftRes.ok && draftJson?.ok) {
            if (!cancelled) {
              setPost(draftJson.post || null);
            }
            return;
          }

          throw new Error(draftJson?.error || "Failed to load blog post");
        }

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "Failed to load blog post");
        }

        if (!cancelled) {
          setPost(json.post || null);
        }
      } catch (err) {
        if (!cancelled) {
          setPost(null);
          setLoadError(err?.message || "Failed to load blog post");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (slug) {
      loadPost();
    } else {
      setPost(null);
      setLoadError("Missing blog slug");
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [slug, lang]);

  const postLang = post?.language || lang;
  const title = `${post?.title || "Eltum Veðrið"} | Eltum Veðrið`;
  const description = post?.excerpt || "Weather tips and campsite planning for Iceland.";
  const url = `${typeof window !== "undefined" ? window.location.origin : "https://campcast.is"}/blog/${post?.slug || slug || ""}`;
  const image = post?.coverImage || "https://eltumvedrid.is/og-default.jpg";

  if (loading) {
    return (
      <div
        className={`min-h-screen ${
          isLight ? "bg-[#fffaf0] text-slate-900" : "bg-slate-950 text-slate-100"
        }`}
      >
        <Header
          t={t}
          rightSlot={
            <Link
              to="/blog"
              className="text-sm font-medium text-sky-700 underline-offset-4 hover:underline dark:text-sky-400"
            >
              {translateOrFallback(t, "backToBlog", "Back to blog")}
            </Link>
          }
        />
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            Loading article...
          </p>
        </main>
        <Footer t={t} lang={lang} theme={theme} />
      </div>
    );
  }

  if (!post) {
    return (
      <div
        className={`min-h-screen ${
          isLight ? "bg-[#fffaf0] text-slate-900" : "bg-slate-950 text-slate-100"
        }`}
      >
        <Header
          t={t}
          rightSlot={
            <Link
              to="/blog"
              className="text-sm font-medium text-sky-700 underline-offset-4 hover:underline dark:text-sky-400"
            >
              {translateOrFallback(t, "backToBlog", "Back to blog")}
            </Link>
          }
        />
        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <Link
            to="/blog"
            className={`text-sm font-medium underline-offset-4 hover:underline ${
              isLight ? "text-sky-700" : "text-sky-400"
            }`}
          >
            ← {translateOrFallback(t, "backToBlog", "Back to blog")}
          </Link>

          <div
            className={`mt-6 rounded-3xl border p-8 ${
              isLight ? "border-black/10 bg-white" : "border-white/10 bg-slate-900"
            }`}
          >
            <h1 className="text-3xl font-bold tracking-tight">
              {translateOrFallback(t, "blogPostNotFoundTitle", "Article not found")}
            </h1>
            <p className={`mt-4 text-lg ${isLight ? "text-slate-600" : "text-slate-300"}`}>
              {loadError
                ? loadError
                : translateOrFallback(
                    t,
                    "blogPostNotFoundText",
                    "The article you tried to open does not exist or may have been removed."
                  )}
            </p>
          </div>
        </main>

        <Footer t={t} lang={lang} theme={theme} />
      </div>
    );
  }

  return (
    <>
      {post.status !== "draft" && (
        <Helmet>
          <title>{title}</title>

          <meta name="description" content={description} />

          <meta property="og:type" content="article" />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:url" content={url} />
          <meta property="og:image" content={image} />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={image} />
        </Helmet>
      )}

      <div
        className={`min-h-screen ${
          isLight ? "bg-[#fffaf0] text-slate-900" : "bg-slate-950 text-slate-100"
        }`}
      >
        <Header
          t={t}
          rightSlot={
            <Link
              to="/blog"
              className="text-sm font-medium text-sky-700 underline-offset-4 hover:underline dark:text-sky-400"
            >
              {translateOrFallback(t, "backToBlog", "Back to blog")}
            </Link>
          }
        />
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          {post.status === "draft" && (
            <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-600/40 dark:bg-amber-900/20 dark:text-amber-300">
              {translateOrFallback(
                t,
                "blogDraftPreviewBanner",
                "Draft preview — this post is not published."
              )}
            </div>
          )}
          <article className="mt-6">
            <div className="max-w-3xl">
              {post.status !== "draft" && (
                <div className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {translateOrFallback(t, "blogPublishedLabel", "Published")}{" "}
                  {formatPublishedDate(post.publishedAt, lang)}
                </div>
              )}

              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{post.title}</h1>

              <p
                className={`mt-4 text-xl leading-8 ${isLight ? "text-slate-600" : "text-slate-300"}`}
              >
                {post.excerpt}
              </p>
            </div>

            {post.coverImage ? (
              <div className="mt-10 overflow-hidden rounded-3xl border border-black/10 dark:border-white/10">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="h-[280px] w-full object-cover sm:h-[380px]"
                  loading="lazy"
                />
              </div>
            ) : null}

            <div className="mt-8">
              <BlogContent content={post.content} isLight={isLight} />

              {post.weatherNarrative && (
                <div className="mt-10 max-w-2xl mx-auto">
                  <h2
                    className={`text-xl font-semibold ${
                      isLight ? "text-slate-900" : "text-slate-100"
                    }`}
                  >
                    {postLang === "is" ? "Veðurleg samhengi" : "Weather context"}
                  </h2>
                  <p
                    className={`mt-3 text-base leading-7 ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    {post.weatherNarrative}
                  </p>
                </div>
              )}

              {post.movementNarrative && (
                <div className="mt-10 max-w-2xl mx-auto">
                  <h2
                    className={`text-xl font-semibold ${
                      isLight ? "text-slate-900" : "text-slate-100"
                    }`}
                  >
                    {postLang === "is" ? "Fara eða vera?" : "Stay or move?"}
                  </h2>
                  <p
                    className={`mt-3 text-base leading-7 ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    {post.movementNarrative}
                  </p>
                </div>
              )}

              {post.whyThisArea && (
                <div className="mt-10 max-w-2xl mx-auto">
                  <h2
                    className={`text-xl font-semibold ${
                      isLight ? "text-slate-900" : "text-slate-100"
                    }`}
                  >
                    {postLang === "is" ? "Af hverju þetta svæði?" : "Why this area?"}
                  </h2>
                  <p
                    className={`mt-3 text-base leading-7 ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    {post.whyThisArea}
                  </p>
                </div>
              )}

              {Array.isArray(post.nearbyHighlights) && post.nearbyHighlights.length > 0 && (
                <div className="mt-10 max-w-2xl mx-auto">
                  <h2
                    className={`text-xl font-semibold ${
                      isLight ? "text-slate-900" : "text-slate-100"
                    }`}
                  >
                    {postLang === "is" ? "Í nágrenninu" : "Nearby"}
                  </h2>
                  <ul
                    className={`mt-3 space-y-2 ${isLight ? "text-slate-700" : "text-slate-300"}`}
                  >
                    {post.nearbyHighlights.map((item, i) => (
                      <li key={i} className="flex items-baseline gap-2 text-base">
                        <span className="font-medium">{item.name}</span>
                        {item.type && (
                          <span
                            className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}
                          >
                            {item.type}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {post.nearbyAttractions && (
                <div className="mt-10 max-w-2xl mx-auto">
                  <h2
                    className={`text-xl font-semibold ${
                      isLight ? "text-slate-900" : "text-slate-100"
                    }`}
                  >
                    {postLang === "is" ? "Vert að skoða" : "Places Worth Visiting"}
                  </h2>
                  <ul
                    className={`mt-3 list-disc pl-5 space-y-1 text-base ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    {post.nearbyAttractions
                      .split("\n")
                      .map((line) => line.replace(/^[-*]\s*/, "").trim())
                      .filter(Boolean)
                      .map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                  </ul>
                </div>
              )}

              <BlogPostCta
                t={t}
                isLight={isLight}
                to="/"
                slug={post.slug}
                ctaTitle={post.ctaTitle}
                ctaText={post.ctaText}
                ctaButton={post.ctaButton}
                ctaTarget={post.ctaTarget}
              />
            </div>
          </article>
        </main>

        <Footer t={t} lang={lang} theme={theme} />
      </div>
    </>
  );
}

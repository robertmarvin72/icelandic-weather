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
  if (!post?.slug) return;

  console.log("Blog Post View tracked:", post.slug);

  window.plausible?.("Blog Post View", {
    props: { slug: post.slug },
  });
}, [post]);

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      setLoading(true);
      setLoadError("");

      try {
        const res = await fetch(
          `/api/admin?action=getPublishedBlogPostBySlug&slug=${encodeURIComponent(slug)}`,
          {
            cache: "no-store",
          }
        );

        if (res.status === 404) {
          const draftRes = await fetch(
            `/api/admin?action=getPublishedBlogPostBySlug&slug=${encodeURIComponent(slug)}&preview=draft`,
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
  }, [slug]);

  const title = `${post?.title || "CampCast"} | CampCast`;
  const description = post?.excerpt || "Weather tips and campsite planning for Iceland.";
  const url = `https://campcast.is/blog/${post?.slug || slug || ""}`;
  const image = post?.coverImage || "https://campcast.is/og-default.jpg";

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
              <BlogPostCta t={t} isLight={isLight} to="/" slug={post.slug} />
            </div>
          </article>
        </main>

        <Footer t={t} lang={lang} theme={theme} />
      </div>
    </>
  );
}

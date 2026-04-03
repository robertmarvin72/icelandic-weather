import { Link, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { getBlogPostBySlug } from "../data/blogPosts";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

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
  const post = getBlogPostBySlug(slug);
  const isLight = theme === "light";

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
              {translateOrFallback(
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
        <article className="mt-6">
          <div className="max-w-3xl">
            <div className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {translateOrFallback(t, "blogPublishedLabel", "Published")}{" "}
              {formatPublishedDate(post.publishedAt, lang)}
            </div>

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

            <div
              className={`mt-8 rounded-3xl border p-6 sm:p-8 ${
                isLight
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-emerald-900/60 bg-emerald-950/30"
              }`}
            >
              <h3 className="text-xl font-semibold">
                {translateOrFallback(t, "blogCtaTitle", "Check live campsite conditions")}
              </h3>

              <p className={`mt-2 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                {translateOrFallback(
                  t,
                  "blogCtaText",
                  "Compare nearby campsites and see where the weather is better right now."
                )}
              </p>

              <div className="mt-4">
                <Link
                  to="/"
                  className={`inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium transition ${
                    isLight ? "bg-slate-900 text-white" : "bg-white text-slate-950"
                  }`}
                >
                  {translateOrFallback(t, "blogCtaButton", "Open CampCast")}
                </Link>
              </div>
            </div>
          </div>
        </article>
      </main>

      <Footer t={t} lang={lang} theme={theme} />
    </div>
  );
}

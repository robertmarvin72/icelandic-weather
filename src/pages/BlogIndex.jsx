import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { track } from "@vercel/analytics";

function formatPublishedDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString("en-GB", {
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

export default function BlogIndex({ t, lang, theme }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin?action=getPublishedBlogPosts", {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "Failed to load blog posts");
        }

        if (!cancelled) {
          setPosts(Array.isArray(json.posts) ? json.posts : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load blog posts");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header
        t={t}
        rightSlot={
          <Link to="/" className="text-sm font-medium hover:underline">
            Open CampCast
          </Link>
        }
      />

      <header className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 font-semibold">
          <span className="text-lg">CampCast</span>
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
            {translateOrFallback(t, "blogBadge", "CampCast Blog")}
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {translateOrFallback(t, "blogTitle", "Weather tips and campsite planning for Iceland")}
          </h1>

          <div className="mt-6">
            <a
              href="/"
              onClick={() => track("blog_index_top_cta_click")}
              className="inline-block rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:opacity-90"
            >
              Check live campsite conditions
            </a>
          </div>

          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            {translateOrFallback(
              t,
              "blogIntro",
              "Practical articles focused on camper travel, wind, rain, campsite decisions, and better weather nearby."
            )}
          </p>
        </div>

        {loading ? (
          <div className="mt-10 text-sm text-slate-500 dark:text-slate-400">Loading blog...</div>
        ) : error ? (
          <div className="mt-10 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        ) : (
          <div className="mt-10 grid gap-6">
            {posts.map((post, i) => (
              <div key={post.id}>
                <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-slate-900">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Published {formatPublishedDate(post.publishedAt)}
                  </div>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="hover:text-emerald-700 dark:hover:text-emerald-400"
                    >
                      {post.title}
                    </Link>
                  </h2>

                  <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
                    {post.excerpt}
                  </p>

                  {post.ctaHint ? (
                    <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                      {post.ctaHint}
                    </p>
                  ) : null}

                  <div className="mt-5">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      {translateOrFallback(t, "blogReadArticle", "Read article")}
                    </Link>
                  </div>
                </article>

                {(i + 1) % 3 === 0 && (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                    <h3 className="mb-2 text-lg font-semibold">Not sure where to go next?</h3>
                    <p className="mb-4 text-sm text-slate-600">
                      Compare nearby campsites and see where the weather is better right now.
                    </p>
                    <a
                      href="/"
                      onClick={() => track("blog_index_mid_cta_click")}
                      className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
                    >
                      Open CampCast
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer t={t} lang={lang} theme={theme} />
    </div>
  );
}

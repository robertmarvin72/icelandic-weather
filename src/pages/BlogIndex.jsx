import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { blogPosts } from "../data/blogPosts";

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
            CampCast Blog
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Weather tips and campsite planning for Iceland
          </h1>

          {/* TOP CTA */}
          <div className="mt-6">
            <a
              href="/"
              onClick={() => trackEvent("blog_index_top_cta_click", { slug })}
              className="inline-block bg-slate-900 text-white px-5 py-3 rounded-xl font-medium hover:opacity-90 transition"
            >
              Check live campsite conditions
            </a>
          </div>

          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Practical articles focused on camper travel, wind, rain, campsite decisions, and better
            weather nearby.
          </p>
        </div>

        <div className="mt-10 grid gap-6">
          {blogPosts.map((post, i) => (
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

                <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">{post.ctaHint}</p>

                <div className="mt-5">
                  <Link
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-slate-950"
                  >
                    Read article
                  </Link>
                </div>
              </article>

              {/* MID CTA AFTER 2nd POST */}
              {i === 1 && (
                <div className="mt-6 p-6 rounded-2xl border bg-emerald-50/60 backdrop-blur">
                  <h3 className="text-lg font-semibold mb-2">Not sure where to go next?</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Compare nearby campsites and see where the weather is better right now.
                  </p>
                  <a
                    href="/"
                    onClick={() => trackEvent("blog_index_mid_cta_click", { slug })}
                    className="inline-block bg-slate-900 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Open CampCast
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <Footer t={t} lang={lang} theme={theme} />
    </div>
  );
}

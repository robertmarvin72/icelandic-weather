import React, { useEffect, useMemo, useState } from "react";
import { useAdminBlogPosts } from "../hooks/useAdminBlogPosts";

function formatMoney(value) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("is-IS");
  } catch {
    return value;
  }
}

function StatRow({ label, value, muted = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-200/70 dark:border-slate-800/80 last:border-b-0">
      <div
        className={`text-sm ${
          muted ? "text-slate-500 dark:text-slate-400" : "text-slate-600 dark:text-slate-300"
        }`}
      >
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <section
      className="
        rounded-3xl border border-slate-200/70 bg-white/75 p-5 shadow-sm backdrop-blur
        dark:border-slate-800/80 dark:bg-slate-900/75
      "
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      <div>{children}</div>
    </section>
  );
}

function SummaryPill({ label, value }) {
  return (
    <div
      className="
        rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 shadow-sm
        dark:border-slate-800/80 dark:bg-slate-900/80
      "
    >
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
      {children}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
    />
  );
}

function GenerateDraftCard({ onGenerated }) {
  const [form, setForm] = useState({
    type: "weather_comparison",
    lang: "en",
    baseCampsite: "",
    compareCampsite: "",
    region: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generateDraft",
          type: form.type,
          lang: form.lang,
          context: {
            baseCampsite: form.baseCampsite.trim(),
            compareCampsite: form.compareCampsite.trim(),
            region: form.region.trim(),
          },
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to generate draft");
      }

      setSuccess(`Draft created: ${json?.draft?.title || "Untitled"}`);

      if (typeof onGenerated === "function") {
        await onGenerated(json.draft);
      }
    } catch (err) {
      setError(err?.message || "Failed to generate draft");
    } finally {
      setLoading(false);
    }
  }

  const disabled =
    loading || !form.baseCampsite.trim() || !form.compareCampsite.trim() || !form.region.trim();

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Generate blog draft
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Create a new draft from campsite comparison context.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
          {success}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>Type</FieldLabel>
          <Select
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
          >
            <option value="weather_comparison">weather_comparison</option>
            <option value="campsite_weather">campsite_weather</option>
          </Select>
        </div>

        <div>
          <FieldLabel>Language</FieldLabel>
          <Select
            value={form.lang}
            onChange={(e) => setForm((prev) => ({ ...prev, lang: e.target.value }))}
          >
            <option value="en">English</option>
            <option value="is">Icelandic</option>
          </Select>
        </div>

        <div>
          <FieldLabel>Base campsite</FieldLabel>
          <TextInput
            value={form.baseCampsite}
            onChange={(e) => setForm((prev) => ({ ...prev, baseCampsite: e.target.value }))}
            placeholder="e.g. Vík Campsite"
          />
        </div>

        <div>
          <FieldLabel>Compare campsite</FieldLabel>
          <TextInput
            value={form.compareCampsite}
            onChange={(e) => setForm((prev) => ({ ...prev, compareCampsite: e.target.value }))}
            placeholder="e.g. Skógar Campsite"
          />
        </div>

        <div className="md:col-span-2">
          <FieldLabel>Region</FieldLabel>
          <TextInput
            value={form.region}
            onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
            placeholder="e.g. South Iceland"
          />
        </div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          disabled={disabled}
          onClick={handleGenerate}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
        >
          {loading ? "Generating..." : "Generate draft"}
        </button>
      </div>
    </section>
  );
}

function BlogEditorCard({ post, onSave, onPublish, saving, publishing }) {
  const [draft, setDraft] = useState({
    title: post.title || "",
    excerpt: post.excerpt || "",
    content: post.content || "",
  });

  useEffect(() => {
    setDraft({
      title: post.title || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
    });
  }, [post.id, post.title, post.excerpt, post.content]);

  const dirty = useMemo(() => {
    return (
      draft.title !== (post.title || "") ||
      draft.excerpt !== (post.excerpt || "") ||
      draft.content !== (post.content || "")
    );
  }, [draft, post]);

  const isPublished = post.status === "published";

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {post.title || "Untitled draft"}
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                isPublished
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
              }`}
            >
              {post.status || "draft"}
            </span>
          </div>

          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            slug: <span className="font-mono">{post.slug}</span>
          </div>

          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            publishedAt: {formatDateTime(post.publishedAt)}
          </div>

          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            updatedAt: {formatDateTime(post.updatedAt)}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => onSave(post.id, draft)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>

          <button
            type="button"
            disabled={publishing || isPublished}
            onClick={() => onPublish(post.id)}
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            {publishing ? "Publishing..." : isPublished ? "Published" : "Publish"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <div>
          <FieldLabel>Title</FieldLabel>
          <TextInput
            value={draft.title}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <div>
          <FieldLabel>Excerpt</FieldLabel>
          <TextArea
            value={draft.excerpt}
            onChange={(e) => setDraft((prev) => ({ ...prev, excerpt: e.target.value }))}
            rows={3}
          />
        </div>

        <div>
          <FieldLabel>Content</FieldLabel>
          <TextArea
            value={draft.content}
            onChange={(e) => setDraft((prev) => ({ ...prev, content: e.target.value }))}
            rows={14}
          />
        </div>
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    data: null,
  });

  const {
    posts,
    loading: loadingPosts,
    savingId,
    publishingId,
    error: blogError,
    reloadPosts,
    updatePost,
    publishPost,
  } = useAdminBlogPosts();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin", {
          credentials: "include",
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "Failed to load admin summary");
        }

        if (!cancelled) {
          setState({
            loading: false,
            error: "",
            data: json,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            loading: false,
            error: err?.message || "Failed to load admin summary",
            data: null,
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGenerated() {
    await reloadPosts();
  }

  if (state.loading) {
    return (
      <main className="min-h-screen bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-3xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/75">
            <h1 className="text-2xl font-semibold">CampCast Admin</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Hleð admin yfirliti...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (state.error) {
    return (
      <main className="min-h-screen bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-3xl border border-rose-200/80 bg-white/80 p-6 shadow-sm dark:border-rose-900/70 dark:bg-slate-900/80">
            <h1 className="text-2xl font-semibold">CampCast Admin</h1>
            <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
              Gat ekki hlaðið admin gögnum: {state.error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { users, pro, revenue } = state.data || {
    users: { total: 0, new7d: 0, new30d: 0 },
    pro: { active: 0, expired: 0, conversionRate: 0 },
    revenue: { month: 0, last30d: 0, lifetime: 0 },
  };

  return (
    <main className="min-h-screen bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <header className="mb-6 rounded-3xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/75">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                Internal admin
              </div>
              <h1 className="mt-3 text-2xl font-semibold md:text-3xl">CampCast Admin</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Admin yfirlit yfir notendur, áskriftir og blog workflow.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:w-[340px]">
              <SummaryPill label="Users" value={users.total} />
              <SummaryPill label="Active Pro" value={pro.active} />
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Users" subtitle="Notendavöxtur og nýskráningar">
            <StatRow label="Total users" value={users.total} />
            <StatRow label="New last 7 days" value={`+${users.new7d}`} />
            <StatRow label="New last 30 days" value={`+${users.new30d}`} />
          </Card>

          <Card title="Pro" subtitle="Yfirlit yfir áskriftastöðu">
            <StatRow label="Active subscriptions" value={pro.active} />
            <StatRow label="Expired subscriptions" value={pro.expired} />
            <StatRow label="Conversion rate" value={formatPercent(pro.conversionRate)} />
          </Card>

          <Card title="Revenue" subtitle="Kemur þegar revenue persistence er tilbúin">
            <StatRow label="This month" value={formatMoney(revenue.month)} muted />
            <StatRow label="Last 30 days" value={formatMoney(revenue.last30d)} muted />
            <StatRow label="Lifetime" value={formatMoney(revenue.lifetime)} muted />
          </Card>
        </div>

        <section className="mt-8">
          <GenerateDraftCard onGenerated={handleGenerated} />
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Blog drafts and posts
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Edit title, excerpt and content. Publish when ready.
            </p>
          </div>

          {blogError ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
              {blogError}
            </div>
          ) : null}

          {loadingPosts ? (
            <div className="rounded-3xl border border-slate-200/70 bg-white/75 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/75 dark:text-slate-400">
              Hleð blog póstum...
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/70 bg-white/75 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/75 dark:text-slate-400">
              Engir blog póstar fundust.
            </div>
          ) : (
            <div className="grid gap-5">
              {posts.map((post) => (
                <BlogEditorCard
                  key={post.id}
                  post={post}
                  saving={savingId === post.id}
                  publishing={publishingId === post.id}
                  onSave={updatePost}
                  onPublish={publishPost}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

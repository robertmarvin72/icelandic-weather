import React, { useEffect, useState } from "react";

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

function StatRow({ label, value, muted = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-200/70 dark:border-slate-800/80 last:border-b-0">
      <div
        className={`text-sm ${muted ? "text-slate-500 dark:text-slate-400" : "text-slate-600 dark:text-slate-300"}`}
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

export default function AdminDashboard() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    data: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/summary", {
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

  if (state.loading) {
    return (
      <main className="min-h-screen bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-10">
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
        <div className="max-w-6xl mx-auto px-4 py-10">
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

  const { users, pro, revenue } = state.data;

  return (
    <main className="min-h-screen bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        <header className="mb-6 rounded-3xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/75">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                Internal admin
              </div>
              <h1 className="mt-3 text-2xl md:text-3xl font-semibold">CampCast Admin</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Read-only yfirlit yfir notendur, áskriftir og helstu rekstrartölur.
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
      </div>
    </main>
  );
}

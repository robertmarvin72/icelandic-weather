import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Brand from "../components/Brand";

const QR_PARTNERS = {
  gocampers: "Go Campers",
};

function ComparisonCard() {
  return (
    <div className="w-full rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Current campsite
          </p>
          <div className="flex flex-col gap-1.5 text-sm text-slate-700 dark:text-slate-300">
            <span>🌬️ Wind: <strong>12 m/s</strong></span>
            <span>🌧️ Rain: <strong>8 mm</strong></span>
            <span>🌡️ Temp: <strong>9°C</strong></span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Best nearby (18 km)
          </p>
          <div className="flex flex-col gap-1.5 text-sm text-slate-700 dark:text-slate-300">
            <span>🌬️ Wind: <strong>5 m/s</strong></span>
            <span>🌧️ Rain: <strong>0 mm</strong></span>
            <span>🌡️ Temp: <strong>13°C</strong></span>
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-slate-200/70 pt-3 text-center text-sm font-semibold text-emerald-600 dark:border-slate-700/70 dark:text-emerald-400">
        ✓ Much calmer
      </div>
    </div>
  );
}

export default function Welcome() {
  const { search } = useLocation();
  const navigate = useNavigate();

  const qr = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get("qr") || "";
  }, [search]);

  useEffect(() => {
    localStorage.setItem("lang", JSON.stringify("en"));
    if (qr) sessionStorage.setItem("qr_source", qr);
  }, [qr]);

  const partnerName = QR_PARTNERS[qr] || null;
  const welcomeLine = partnerName
    ? `Welcome, ${partnerName} travellers`
    : "Welcome, Iceland travellers";
  const pricingUrl = qr ? `/pricing?qr=${encodeURIComponent(qr)}` : "/pricing";

  return (
    <main className="min-h-screen bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col items-center px-6 py-8">
      <div className="w-full max-w-md flex flex-col items-center gap-4 text-center">

        <Brand t={() => undefined} lang="en" hideTagline />

        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {welcomeLine}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Find a better campsite before the weather changes.
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Before you drive, check if there&apos;s a calmer campsite nearby. It only takes a few seconds.
          </p>
        </div>

        <div className="w-full flex flex-col gap-2">
          <p className="text-xs text-slate-400 dark:text-slate-500 text-left">
            Example comparison
          </p>
          <ComparisonCard />
        </div>

        <button
          type="button"
          onClick={() => navigate(pricingUrl)}
          className="w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
        >
          Compare nearby campsites →
        </button>

        <p className="text-xs text-slate-500 dark:text-slate-500">
          Try it free. Upgrade anytime for €4.99/month.
        </p>
      </div>
    </main>
  );
}

import { useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Brand from "../components/Brand";
import InstantComparison from "../components/InstantComparison";
import { trackEvent } from "../lib/analytics";

// Static mock data for the comparison demo — no API calls on this page
const MOCK_CURRENT = { id: "brochure-laugarvatn", name: "Laugarvatn", lat: 64.12, lon: -20.72 };
const MOCK_NEARBY  = { id: "brochure-selfoss",    name: "Selfoss",     lat: 63.93, lon: -20.99 };
const MOCK_SITE_LIST = [MOCK_CURRENT, MOCK_NEARBY];

const MOCK_CURRENT_ROWS = [
  { windMax: 9,   rain: 5,   tmax: 11 },
  { windMax: 7,   rain: 3,   tmax: 12 },
  { windMax: 8,   rain: 4,   tmax: 12 },
];
const MOCK_NEARBY_ROWS = [
  { windMax: 2.5, rain: 0.5, tmax: 15 },
  { windMax: 3.0, rain: 1.0, tmax: 14 },
  { windMax: 3.5, rain: 0.5, tmax: 15 },
];

const MOCK_SCORES = {
  "brochure-laugarvatn": { score: 42, rows: MOCK_CURRENT_ROWS },
  "brochure-selfoss":    { score: 58, rows: MOCK_NEARBY_ROWS },
};

const content = {
  en: {
    tagline:  "Find better weather",
    title:    "Better weather might be nearby",
    subtitle: "Compare nearby areas before you set off.",
    bullets:  ["Calmer camping nearby", "Drier nearby conditions", "Shelter from strong wind", "Less chance of getting stuck inside"],
    footer:   "Built for Icelandic conditions",
  },
  is: {
    tagline:  "Finndu betra veður",
    title:    "40 km geta breytt öllu",
    subtitle: "Berðu saman nærliggjandi svæði áður en þú ferð af stað.",
    bullets:  ["Rólegra veður í nágrenninu", "Þurrara svæði í nágrenninu", "Skjól frá sterkum vindi", "Minni líkur á að sitja fastur inni"],
    footer:   "Hannað fyrir íslenskar aðstæður",
  },
};

const ctaCopy = {
  A: { en: "See where the weather is calmer", is: "Sjá hvar veðrið er rólegra" },
  B: { en: "See where the weather is calmer", is: "Sjá hvar veðrið er rólegra" },
};

export default function Brochure() {
  const { search } = useLocation();
  const navigate = useNavigate();

  const lang = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get("lang") === "is" ? "is" : "en";
  }, [search]);

  const variant = useMemo(() => {
    const stored = localStorage.getItem("brochure_variant");
    if (stored === "A" || stored === "B") return stored;
    const assigned = Math.random() < 0.5 ? "A" : "B";
    localStorage.setItem("brochure_variant", assigned);
    return assigned;
  }, []);

  const copy = { ...(lang === "is" ? content.is : content.en), cta: ctaCopy[variant][lang] };

  const ctaTo = useMemo(() => {
    const params = new URLSearchParams(search);
    if (!params.has("utm_source")) {
      params.set("utm_source", "brochure");
    }
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }, [search]);

  const handleComparisonCta = useCallback(() => {
    trackEvent("brochure_comparison_cta_click", { lang, source: "brochure_comparison" });
    navigate(ctaTo);
  }, [lang, ctaTo, navigate]);

  return (
    <main className="min-h-screen bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">

        <Brand t={() => undefined} lang={lang} hideTagline />

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            {copy.tagline}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {copy.title}
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            {copy.subtitle}
          </p>
        </div>

        {/* Comparison demo is the visual focal point — sits directly below hero text */}
        <div className="w-full" id="comparison-section">
          <InstantComparison
            site={MOCK_CURRENT}
            currentScore={42}
            rows={MOCK_CURRENT_ROWS}
            siteList={MOCK_SITE_LIST}
            scoresById={MOCK_SCORES}
            radiusKm={50}
            homepageRecommendation="move"
            onCtaClick={handleComparisonCta}
            lang={lang}
          />
        </div>

        <ul className="w-full flex flex-col gap-2">
          {copy.bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm font-medium text-slate-800 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-200"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
              {bullet}
            </li>
          ))}
        </ul>

        <Link
          to={ctaTo}
          className="w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white text-center dark:bg-white dark:text-slate-950"
        >
          {copy.cta}
        </Link>

        <p className="text-xs text-slate-500 dark:text-slate-500">
          {copy.footer}
        </p>

      </div>
    </main>
  );
}

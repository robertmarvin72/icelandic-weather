import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import Brand from "../components/Brand";

const content = {
  en: {
    title: "Chase better weather",
    subtitle: "Find better weather nearby before you set off.",
    bullets: ["Sun in one place", "Rain 40 km away", "Shelter in the valley", "Wind by the coast"],
    cta: "Check the weather",
    footer: "Built for Icelandic conditions",
  },
  is: {
    title: "Eltu veðrið",
    subtitle: "Finndu betra veður nálægt þér áður en þú ferð af stað.",
    bullets: ["Sól á einum stað", "Rigning í 40 km fjarlægð", "Logn í dalnum", "Hvass við ströndina"],
    cta: "Skoða veðrið",
    footer: "Hannað fyrir íslenskar aðstæður",
  },
};

const ctaCopy = {
  A: { en: "Find better weather nearby", is: "Finndu betra veður nálægt þér" },
  B: { en: "See better weather nearby",  is: "Sjáðu betra veður nálægt þér" },
};

export default function Brochure() {
  const { search } = useLocation();

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

  return (
    <main className="min-h-screen bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center">
        <Brand t={() => undefined} />

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {copy.title}
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400">
            {copy.subtitle}
          </p>
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
          onClick={() => {
            window.plausible?.("Brochure CTA Click", { props: { variant, lang } });
          }}
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

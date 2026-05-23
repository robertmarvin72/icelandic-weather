import { Link } from "react-router-dom";

function translateOrFallback(t, key, fallback) {
  const value = t?.(key);
  if (!value || value === key) return fallback;
  return value;
}

export default function BlogPostCta({ t, isLight, to = "/", slug, ctaTitle, ctaText, ctaButton, ctaTarget }) {
  const resolvedTo = ctaTarget || to;
  const resolvedTitle = ctaTitle || translateOrFallback(t, "blogCtaTitle", "Check live campsite conditions");
  const resolvedText = ctaText || translateOrFallback(t, "blogCtaText", "Compare nearby campsites and see where the weather is better right now.");
  const resolvedButton = ctaButton || translateOrFallback(t, "blogCtaButton", "Open CampCast");

  return (
    <div
      className={`mt-10 rounded-3xl border p-6 sm:p-8 ${
        isLight ? "border-emerald-200 bg-emerald-50" : "border-emerald-900/60 bg-emerald-950/30"
      }`}
    >
      <h3 className="text-xl font-semibold">
        {resolvedTitle}
      </h3>

      <p className={`mt-2 text-base leading-7 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
        {resolvedText}
      </p>

      <div className="mt-4">
        <Link
          to={resolvedTo}
          onClick={() => {
            window.plausible?.("Blog CTA Click", {
              props: { slug: slug || "unknown" },
            });
          }}
          className={`inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium transition hover:opacity-90 ${
            isLight ? "bg-slate-900 text-white" : "bg-white text-slate-950"
          }`}
        >
          {resolvedButton}
        </Link>
      </div>
    </div>
  );
}

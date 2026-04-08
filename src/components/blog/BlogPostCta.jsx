import { Link } from "react-router-dom";
import { track } from "@vercel/analytics";

function translateOrFallback(t, key, fallback) {
  const value = t?.(key);
  if (!value || value === key) return fallback;
  return value;
}

export default function BlogPostCta({ t, isLight, to = "/", slug }) {
  return (
    <div
      className={`mt-10 rounded-3xl border p-6 sm:p-8 ${
        isLight ? "border-emerald-200 bg-emerald-50" : "border-emerald-900/60 bg-emerald-950/30"
      }`}
    >
      <h3 className="text-xl font-semibold">
        {translateOrFallback(t, "blogCtaTitle", "Check live campsite conditions")}
      </h3>

      <p className={`mt-2 text-base leading-7 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
        {translateOrFallback(
          t,
          "blogCtaText",
          "Compare nearby campsites and see where the weather is better right now."
        )}
      </p>

      <div className="mt-4">
        <Link
          to={to}
          onClick={() => track("blog_post_bottom_cta_click", { slug })}
          className={`inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium transition hover:opacity-90 ${
            isLight ? "bg-slate-900 text-white" : "bg-white text-slate-950"
          }`}
        >
          {translateOrFallback(t, "blogCtaButton", "Open CampCast")}
        </Link>
      </div>
    </div>
  );
}

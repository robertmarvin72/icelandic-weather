// src/pages/ShareFallback.jsx
//
// Ticket 417 (#417) — scoped SPA fallback for any path under /share/tjaldur
// that doesn't match a real generated static file (unknown/malformed
// voiceId, unsupported language, unknown version, or the bare namespace
// root). A real static file under
// public/share/tjaldur/<version>/<language>/<voiceId>.html is served
// directly by the host's filesystem precedence and never reaches this
// component at all — this only renders for genuinely unknown share paths,
// after the platform's catch-all rewrite falls through to the SPA. Shows a
// safe, honest "not available" message and a homepage link — never
// fabricated specific metadata (no guessed quote/mood/mascot), and
// distinct from the generic NotFound page since this is a known share
// namespace, just an unrecognized entry within it.
//
// Round 2 correction (#417, Ripley Round 1 REVISE, finding #3):
// - noindex,follow via <Helmet> — this codebase's existing head-management
//   pattern (see NorthernLightsLanding.jsx) — since this route is reached
//   by client-side React only; the real static export pages already carry
//   this metadata in their raw server HTML directly (unchanged, untouched
//   by this file). React-added metadata is NOT present in this page's raw
//   initial HTML — only after client-side render — and this report/comment
//   does not claim otherwise. react-helmet-async reverts the document head
//   automatically on unmount, so navigating away restores whatever meta
//   tags the next page declares (or none) — verified in cc-report.md's
//   real-browser evidence, not merely asserted here.
// - Uses the existing shared, language/dark-mode-aware Brand.jsx component
//   (the same one Pricing/Terms/Privacy/Refund/Subscribe/Success already
//   use) instead of the legacy, non-language-aware /logo.png.
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Brand from "../components/Brand";

export default function ShareFallback({ t, lang = "is" }) {
  const title = t?.("shareFallbackTitle") || "This shared comment isn't available";
  const body =
    t?.("shareFallbackBody") ||
    "This link may be outdated or the comment is no longer part of the current catalogue.";
  const cta = t?.("shareFallbackHomeLink") || "Go to the homepage";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 px-4 text-center dark:bg-slate-950">
      <Helmet>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="mb-4">
        <Brand t={t} lang={lang} size="slim" hideTagline />
      </div>
      <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">{title}</h1>
      <p className="max-w-sm text-sm text-slate-600 dark:text-slate-300 mb-6">{body}</p>
      <Link
        to="/"
        className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        {cta}
      </Link>
    </div>
  );
}

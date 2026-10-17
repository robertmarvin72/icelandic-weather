// src/components/HazardSourceNote.jsx
//
// Ticket #436 — the visible "about this weather assessment" source note.
// Exact issue copy (asserted byte-for-byte by HazardSourceNote.test.jsx):
// the heading and body are each one translatable sentence; the "vedur.is"
// token inside the body is wrapped in a native, new-tab anchor by splitting
// the translated string on that exact substring — so the rendered copy
// paragraph is always identical to the plain translated strings, never a
// fragment rebuilt from independently-mutable pieces. The sr-only new-tab
// description is a SIBLING of that paragraph (not nested inside it), so the
// paragraph's own text never includes it and a screen reader doesn't get it
// announced twice (once inline, once via aria-describedby).
import { useId } from "react";
import { Info } from "lucide-react";

const VEDUR_IS_URL = "https://www.vedur.is/";
const LINK_TOKEN = "vedur.is";

export default function HazardSourceNote({ t, className = "" }) {
  const describedById = useId();

  const heading = t?.("hazardSourceNoteHeading") || "About this weather assessment:";
  const body =
    t?.("hazardSourceNoteBody") ||
    "Caution indicators are calculated by Eltum Veðrið and are not official weather warnings. Check official warnings at vedur.is.";
  const newTabText = t?.("hazardSourceNoteNewTab") || "Opens in a new tab";

  const tokenIndex = body.indexOf(LINK_TOKEN);
  const before = tokenIndex >= 0 ? body.slice(0, tokenIndex) : body;
  const after = tokenIndex >= 0 ? body.slice(tokenIndex + LINK_TOKEN.length) : "";

  return (
    <div
      className={`flex items-start gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 px-3 py-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300 ${className}`}
    >
      <Info aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
      <div>
        <p className="m-0">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{heading}</span>{" "}
          {before}
          {tokenIndex >= 0 ? (
            <a
              href={VEDUR_IS_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-describedby={describedById}
              className="font-medium underline decoration-dotted underline-offset-2 text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-sky-100"
            >
              {LINK_TOKEN}
            </a>
          ) : null}
          {after}
        </p>
        {tokenIndex >= 0 ? (
          <span id={describedById} className="sr-only">
            {newTabText}
          </span>
        ) : null}
      </div>
    </div>
  );
}

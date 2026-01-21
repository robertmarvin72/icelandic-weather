import { useEffect, useMemo, useRef, useState } from "react";

export default function CampsitePicker({
  siteList,
  siteId,
  onSelectSite,
  placeholder = "Search campsites…",
  t,
}) {
  placeholder = t?.("searchCampsites") || placeholder;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const panelRef = useRef(null);

  const selected = useMemo(
    () => siteList.find((s) => s.id === siteId) || siteList[0],
    [siteList, siteId]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return siteList;

    return siteList.filter((s) => {
      const name = (s.name || "").toLowerCase();
      // Optional: add region/area fields if you have them:
      // const region = (s.region || "").toLowerCase();
      return name.includes(query);
    });
  }, [siteList, q]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handlePick = (id) => {
    onSelectSite(id);
    setOpen(false);
    setQ("");
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm focus-ring smooth
                   text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100
                   inline-flex items-center gap-2 text-sm whitespace-nowrap"
        aria-haspopup="dialog"
        aria-expanded={open}
        title={t?.("selectCampsite")}
      >
        <span className="truncate max-w-[220px]">{selected?.name || "Select campsite"}</span>
        <span className="opacity-70">▾</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Campsite picker"
          className="absolute z-50 mt-2 w-[360px] max-w-[90vw]
                     rounded-2xl border border-slate-200 bg-white shadow-lg p-3
                     dark:bg-slate-900 dark:border-slate-700"
        >
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm
                       text-slate-900 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
          />

          <div className="mt-2 max-h-72 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-slate-600 dark:text-slate-300">No matches.</div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((s) => {
                  const active = s.id === siteId;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => handlePick(s.id)}
                        className={`w-full text-left px-3 py-2 text-sm
                          hover:bg-sky-50 dark:hover:bg-slate-800/60
                          ${active ? "bg-sky-50 dark:bg-slate-800/60" : ""}`}
                      >
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {s.name}
                        </div>
                        {/* Optional subline if you have extra metadata */}
                        {/* <div className="text-xs text-slate-500 dark:text-slate-400">{s.region}</div> */}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-xl text-sm border border-slate-300
                         dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

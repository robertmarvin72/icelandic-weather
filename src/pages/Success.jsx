// src/pages/Success.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function Success({ lang = "is", theme = "dark", t }) {
  const [status, setStatus] = useState("checking"); // checking | active | pending
  const [logoOk, setLogoOk] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");

  const isDark = theme === "dark";

  const copy = useMemo(() => {
    const isIS = lang === "is";

    return {
      title: isIS ? "Greiðsla móttekin" : "Payment received",
      subtitle: isIS
        ? "Takk! Við erum að staðfesta áskriftina þína."
        : "Thanks! We’re confirming your subscription.",
      checking: isIS ? "Staðfesti..." : "Checking...",
      activeTitle: isIS ? "Pro virkt ✓" : "Pro active ✓",
      pendingTitle: isIS ? "Næstum komið" : "Almost there",
      pendingBody: isIS
        ? "Áskriftin gæti tekið nokkrar sekúndur að virkjast. Prófaðu að endurhlaða eftir smá stund."
        : "It can take a few seconds for the subscription to activate. Try refreshing shortly.",
      home: isIS ? "Til baka á forsíðu" : "Back to home",
      support: isIS ? "Hafa samband" : "Contact support",
      manage: t?.("manageSubscription") ?? (isIS ? "Stjórna" : "Manage"),
      manageHint:
        t?.("proManageHint") ??
        (isIS ? "Stjórnaðu áskrift og kvittunum." : "Manage your subscription and invoices."),
      opening:
        t?.("openingBillingPortal") ?? (isIS ? "Opna greiðslugátt…" : "Opening billing portal…"),
      notReady:
        t?.("billingPortalUnavailable") ??
        (isIS
          ? "Greiðslugátt er ekki tilbúin fyrir þennan notanda enn."
          : "Billing portal not ready for this account yet."),
    };
  }, [lang, t]);

  // Optional: you might already be calling /api/me somewhere else
  // Here we poll a few times because entitlements may take a moment after webhook
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const r = await fetch("/api/me", { credentials: "include" });
        const j = await r.json().catch(() => ({}));

        if (!r.ok || !j?.ok) {
          if (!cancelled) setStatus("pending");
          return;
        }

        const isPro = !!j?.entitlements?.isPro;
        if (!cancelled) setStatus(isPro ? "active" : "pending");
      } catch {
        if (!cancelled) setStatus("pending");
      }
    }

    check();

    const timers = [];
    // gentle polling (fast at first, then stops)
    [1200, 2000, 3000, 4000].forEach((ms) => {
      const id = setTimeout(check, ms);
      timers.push(id);
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  async function onManage() {
    setPortalError("");
    setPortalLoading(true);

    try {
      const r = await fetch("/api/billing-portal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j?.ok || !j?.url) {
        const msg =
          j?.error ||
          (j?.code === "MISSING_PADDLE_CUSTOMER"
            ? copy.notReady
            : `Billing portal failed (${r.status})`);
        throw new Error(msg);
      }

      window.location.assign(j.url);
    } catch (e) {
      setPortalError(String(e?.message || e));
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}
    >
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center gap-3">
          {logoOk ? (
            <img
              src="/logo.png"
              alt="CampCast"
              className="h-10 w-10 rounded-xl"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <div
              className={`h-10 w-10 rounded-xl ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
              aria-hidden="true"
            />
          )}

          <div>
            <div className="text-xl font-bold">{copy.title}</div>
            <div className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              {copy.subtitle}
            </div>
          </div>
        </div>

        <div
          className={`mt-6 rounded-2xl border p-5 ${
            isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
          }`}
        >
          {status === "checking" && (
            <>
              <div className="text-lg font-semibold">{copy.checking}</div>
              <div className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {lang === "is"
                  ? "Ef þetta hangir lengi, þá er það líklega bara webhook-ið að ná sér í kaffi."
                  : "If this takes a bit, it’s usually just the webhook grabbing a coffee."}
              </div>
            </>
          )}

          {status === "active" && (
            <>
              <div className="text-lg font-semibold">{copy.activeTitle}</div>

              <div className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {copy.manageHint}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onManage}
                  disabled={portalLoading}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold border ${
                    isDark
                      ? "border-slate-700 bg-slate-950 hover:bg-slate-800"
                      : "border-slate-300 bg-white hover:bg-slate-50"
                  } ${portalLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                  title={t?.("billingPortal") ?? "Billing portal"}
                >
                  {portalLoading ? copy.opening : copy.manage}
                </button>

                <Link
                  to="/"
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                    isDark
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white"
                  }`}
                >
                  {copy.home}
                </Link>
              </div>

              {portalError && (
                <div className={`mt-3 text-sm ${isDark ? "text-rose-300" : "text-rose-700"}`}>
                  {portalError}
                </div>
              )}
            </>
          )}

          {status === "pending" && (
            <>
              <div className="text-lg font-semibold">{copy.pendingTitle}</div>
              <div className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {copy.pendingBody}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onManage}
                  disabled={portalLoading}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold border ${
                    isDark
                      ? "border-slate-700 bg-slate-950 hover:bg-slate-800"
                      : "border-slate-300 bg-white hover:bg-slate-50"
                  } ${portalLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                  title={t?.("billingPortal") ?? "Billing portal"}
                >
                  {portalLoading ? copy.opening : copy.manage}
                </button>

                <Link
                  to="/"
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                    isDark
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white"
                  }`}
                >
                  {copy.home}
                </Link>

                <a
                  href="mailto:support@campcast.is"
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                    isDark
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-100"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-900"
                  }`}
                >
                  {copy.support}
                </a>
              </div>

              {portalError && (
                <div className={`mt-3 text-sm ${isDark ? "text-rose-300" : "text-rose-700"}`}>
                  {portalError}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginModal({
  open,
  t,
  loginBusy,
  loginEmail,
  setLoginEmail,
  closeLoginModal,
  submitLogin,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeLoginModal();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl p-4
             dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-base font-semibold">{t?.("login") ?? "Login"}</div>

          <button
            type="button"
            onClick={closeLoginModal}
            disabled={loginBusy}
            className="rounded-lg px-2 py-1 text-sm border border-slate-300 text-slate-700 hover:bg-slate-50
                 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="text-sm text-slate-600 mb-3 dark:text-slate-300">
          {t?.("enterEmailToContinue") ?? "Enter your email to continue."}
        </div>

        <form onSubmit={submitLogin} className="grid gap-3">
          <input
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900
                 placeholder:text-slate-400
                 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400
                 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400
                 dark:focus:ring-sky-400/30 dark:focus:border-sky-400"
            autoFocus
          />

          <button
            type="submit"
            disabled={loginBusy}
            className={`rounded-xl px-4 py-2 text-sm font-semibold
                  bg-slate-900 text-white hover:opacity-100
                  dark:bg-white dark:text-slate-900
                  ${loginBusy ? "opacity-60 cursor-not-allowed" : "opacity-95"}`}
          >
            {loginBusy ? (t?.("loading") ?? "Loading…") : (t?.("continue") ?? "Continue")}
          </button>
        </form>

        <div className="mt-3 text-xs text-slate-500 dark:text-slate-300">
          {t?.("noPasswordNeeded") ?? "No password. Because life is hard enough already."}
        </div>
      </div>
    </div>
  );
}

import React from "react";

export default function RefundPage({
  t = (k, fallback) => fallback || k,
  lang = "is",
  theme = "light",
}) {
  const isDark = theme === "dark";

  const T = (key, fallback) => {
    if (typeof t === "function") {
      const v = t(key);
      return v == null || v === key ? fallback : v;
    }
    return fallback;
  };

  function handleClose() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    try {
      window.close();
    } catch {
      // ignore
    }
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 ${isDark ? "dark" : ""}`}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 md:p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <img
              src={isDark ? "/campcast-dark.png" : "/campcast-light.png"}
              alt="CampCast"
              className="w-40 md:w-52 lg:w-64 object-contain mb-6"
            />

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {T("refundTitle", "Endurgreiðslustefna")}
            </h1>
          </div>

          <div className="space-y-6 text-sm leading-8 text-slate-700 dark:text-slate-300">
            <p>
              {T(
                "refundIntro1",
                "CampCast er áskriftarþjónusta sem innheimtir gjöld mánaðarlega eða árlega fyrir aðgang að Pro eiginleikum."
              )}
            </p>

            <p>
              {T(
                "refundIntro2",
                "Notendur geta sagt upp áskrift hvenær sem er í gegnum greiðslugátt eða með því að hafa samband við þjónustuaðila. Aðgangur helst virkur út greitt tímabil."
              )}
            </p>

            <p>
              {T(
                "refundGeneralRule",
                "Að jafnaði eru greiðslur ekki endurgreiddar eftir að nýtt áskriftartímabil hefur hafist."
              )}
            </p>

            <p>
              {T(
                "refundExceptions",
                "Ef notandi telur að ranglega hafi verið innheimt eða að sérstakar aðstæður eigi við, má hafa samband við support@campcast.is og beiðni verður metin í hverju tilviki fyrir sig."
              )}
            </p>

            <p>
              {T(
                "refundDiscretion",
                "CampCast áskilur sér rétt til að meta endurgreiðslubeiðnir í undantekningartilvikum."
              )}
            </p>

            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {T("refundContactTitle", "Samskipti")}
              </div>

              <p>
                {T(
                  "refundContactText",
                  "Ef þú hefur spurningar um áskriftir eða endurgreiðslur geturðu haft samband við okkur á:"
                )}{" "}
                <a
                  href="mailto:support@campcast.is"
                  className="font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  support@campcast.is
                </a>
              </p>
            </div>

            <p>
              {T(
                "refundChanges",
                "CampCast kann að uppfæra þessa endurgreiðslustefnu af og til. Nýjasta útgáfa verður ávallt birt á vefsvæðinu."
              )}
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleClose}
              className="
                inline-flex items-center justify-center
                rounded-xl px-5 py-2.5
                text-sm font-semibold
                bg-emerald-600 text-white
                hover:bg-emerald-500
                focus:outline-none focus:ring-2 focus:ring-emerald-400/60
                dark:bg-emerald-500 dark:hover:bg-emerald-400
              "
            >
              {T("refundClose", "Loka")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

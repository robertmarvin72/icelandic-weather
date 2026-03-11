import React from "react";

export default function TermsPage({ t = (k, fallback) => fallback || k, lang = "is" }) {
  const isIcelandic = String(lang || "")
    .toLowerCase()
    .startsWith("is");

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 md:p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <img
              src="/logo.png"
              alt="CampCast"
              className="w-40 md:w-52 lg:w-64 object-contain mb-6"
            />

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {T("termsTitle", "Skilmálar og fyrirvari")}
            </h1>
          </div>

          <div className="space-y-6 text-sm leading-8 text-slate-700 dark:text-slate-300">
            <p>
              {T(
                "termsIntro1",
                "CampCast veitir veðurspár og mat á veðurskilyrðum á ferðaleiðum byggt á tiltækum veðurgögnum. Upplýsingarnar eru ætlaðar til viðmiðunar og geta verið ónákvæmar, ófullkomnar eða úreltar."
              )}
            </p>

            <p>
              {T(
                "termsIntro2",
                "Veður á Íslandi getur breyst hratt og raunverulegar aðstæður geta verið frábrugðnar því sem birtist í þjónustunni."
              )}
            </p>

            <p>
              {T(
                "termsIntro3",
                "CampCast veitir ekki akstursleiðsögn og ábyrgist ekki öryggi ferðalaga. Notendur bera sjálfir ábyrgð á eigin ferðarákvörðunum og skulu ávallt kynna sér opinberar upplýsingar um veður og færð áður en lagt er af stað."
              )}
            </p>

            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {T(
                  "termsSourcesTitle",
                  "Mælt er með að notendur skoði sérstaklega upplýsingar frá:"
                )}
              </div>

              <ul className="list-disc pl-6 space-y-1">
                <li>
                  {isIcelandic ? "Veðurstofa Íslands" : "Icelandic Meteorological Office"}{" "}
                  (vedur.is)
                </li>
                <li>{isIcelandic ? "Vegagerðin" : "Icelandic Road Administration"} (road.is)</li>
                <li>SafeTravel Iceland (safetravel.is)</li>
              </ul>
            </div>

            <p>
              {T(
                "termsLiability",
                "CampCast og rekstraraðilar þjónustunnar bera enga ábyrgð á slysum, tjóni, töfum eða öðru tjóni sem kann að verða vegna notkunar þjónustunnar eða upplýsinga sem þar koma fram."
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
              {T("termsClose", "Loka")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

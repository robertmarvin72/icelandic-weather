import React from "react";

export default function PrivacyPage({ t = (k, fallback) => fallback || k, theme = "light" }) {
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
              {T("privacyTitle", "Persónuverndarstefna")}
            </h1>
          </div>

          <div className="space-y-6 text-sm leading-8 text-slate-700 dark:text-slate-300">
            <p>
              {T(
                "privacyIntro1",
                "CampCast virðir persónuvernd notenda og leitast við að meðhöndla persónuupplýsingar á ábyrgan og öruggan hátt."
              )}
            </p>

            <p>
              {T(
                "privacyIntro2",
                "Við kunnum að safna grunnupplýsingum um notendur, svo sem netfangi, reikningsupplýsingum og almennum notkunargögnum, til að geta veitt þjónustuna, viðhaldið áskriftum og bætt upplifun notenda."
              )}
            </p>

            <p>
              {T(
                "privacyPayments",
                "Greiðsluupplýsingar eru unnar af Paddle og eru ekki geymdar á netþjónum CampCast."
              )}
            </p>

            <p>
              {T(
                "privacyUsage",
                "Við kunnum einnig að safna nafnlausum eða samanteknum notkunargögnum í greiningarskyni til að bæta virkni, stöðugleika og notendaupplifun þjónustunnar."
              )}
            </p>

            <p>
              {T(
                "privacySharing",
                "CampCast selur ekki persónuupplýsingar notenda og deilir þeim ekki með þriðju aðilum nema það sé nauðsynlegt til að vinna greiðslur, reka þjónustuna eða uppfylla lagaskyldur."
              )}
            </p>

            <p>
              {T(
                "privacyRetention",
                "Persónuupplýsingar eru aðeins varðveittar eins lengi og þörf krefur vegna reksturs þjónustunnar eða samkvæmt lögum."
              )}
            </p>

            <p>
              {T(
                "privacyRights",
                "Notendur geta óskað eftir upplýsingum um gögn sem tengjast reikningi þeirra eða eftir eyðingu þeirra með því að hafa samband við þjónustuaðila."
              )}
            </p>

            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {T("privacyContactTitle", "Samskipti")}
              </div>

              <p>
                {T(
                  "privacyContactText",
                  "Ef þú hefur spurningar um persónuvernd eða vilt óska eftir eyðingu gagna geturðu haft samband við okkur á:"
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
                "privacyChanges",
                "CampCast kann að uppfæra þessa persónuverndarstefnu af og til. Nýjasta útgáfa verður ávallt birt á vefsvæðinu."
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
              {T("privacyClose", "Loka")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

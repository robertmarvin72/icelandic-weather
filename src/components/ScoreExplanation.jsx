import React from "react";

export default function ScoreExplanation({ t, lang = "en" }) {
  // Fallback copy (works even if you don't add translation keys yet)
  const copy =
    lang === "is"
      ? {
          title: "Hvernig CampCast metur aðstæður til útilegu",
          intro:
            "CampCast gefur hverjum degi einkunn frá 0 til 10 byggt á veðuraðstæðum á tjaldsvæðinu.",
          bullets: [
            {
              h: "Hiti",
              p: "Hlýir og mildir dagar fá hærri einkunn, en kaldari dagar lægri.",
              icon: "🌡️",
            },
            {
              h: "Vindur",
              p: "Mikill vindur gerir tjaldlíf óþægilegra og lækkar einkunnina.",
              icon: "🌬️",
            },
            {
              h: "Rigning",
              p: "Þurrir dagar eru bestir. Lítil rigning lækkar einkunnina aðeins, en mikil rigning meira.",
              icon: "🌧️",
            },
          ],
          finalH: "Lokaeinkunn",
          finalP:
            "Einkunnin byggir fyrst og fremst á hitastigi og er síðan aðlöguð eftir vindi og úrkomu. Lokaeinkunnin er alltaf á bilinu 0–10.",
          outro: "Hærri einkunn þýðir yfirleitt rólegri og þægilegri aðstæður til útilegu.",
        }
      : {
          title: "How CampCast scores camping conditions",
          intro:
            "CampCast gives each day a score from 0 to 10 based on weather conditions at the campsite.",
          bullets: [
            {
              h: "Temperature",
              p: "Mild and warm days score higher, while colder days score lower.",
              icon: "🌡️",
            },
            {
              h: "Wind",
              p: "Strong wind makes camping less comfortable and lowers the score.",
              icon: "🌬️",
            },
            {
              h: "Rain",
              p: "Dry days score highest. Light rain reduces the score slightly, while heavy rain lowers it more.",
              icon: "🌧️",
            },
          ],
          finalH: "Final score",
          finalP:
            "The score starts from temperature and is adjusted based on wind and precipitation. The final score is always kept between 0 and 10.",
          outro: "Higher scores generally mean calmer and more comfortable camping conditions.",
        };

  // If you later add translation keys, these will automatically override the fallback.
  const TT = (key, fallback) => (t ? t(key) : fallback);

  return (
    <details className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 px-3 py-2">
      <summary className="cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-200">
        {TT("scoreExplanationTitle", copy.title)}
      </summary>

      <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed">
        <p>{TT("scoreExplanationIntro", copy.intro)}</p>

        <div className="space-y-4">
          {copy.bullets.map((b) => (
            <div key={b.h} className="flex gap-2.5">
              <div className="mt-0.5 shrink-0">{b.icon}</div>
              <div>
                <div className="font-semibold text-slate-700 dark:text-slate-200">
                  {TT(`scoreExplanation_${b.h}`, b.h)}
                </div>
                <div className="mt-0.5">{b.p}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="font-semibold text-slate-700 dark:text-slate-200">
            {TT("scoreExplanationFinalTitle", copy.finalH)}
          </div>
          <div className="mt-0.5">{TT("scoreExplanationFinalText", copy.finalP)}</div>
        </div>

        <div className="font-medium text-slate-700 dark:text-slate-200">
          {TT("scoreExplanationOutro", copy.outro)}
        </div>
      </div>
    </details>
  );
}

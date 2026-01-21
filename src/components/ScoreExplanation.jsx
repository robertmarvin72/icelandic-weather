import React from "react";

export default function ScoreExplanation({ t, lang = "en" }) {
  // Fallback copy (works even if you don't add translation keys yet)
  const copy =
    lang === "is"
      ? {
          title: "Hvernig stigagjöfin virkar",
          intro:
            "CampCast gefur hverjum degi einkunn frá 0 til 10 til að sýna fljótt hversu góðar aðstæður eru til útilegu.",
          bullets: [
            {
              h: "Hiti",
              p: "Hlýir dagar henta betur. Kaldir dagar fá lægri einkunn, mildir og hlýir fá hærri.",
              icon: "🌡️",
            },
            {
              h: "Vindur",
              p: "Mikill vindur gerir tjaldlíf óþægilegt. Því sterkari sem vindurinn er, því fleiri stig dragast frá.",
              icon: "🌬️",
            },
            {
              h: "Rigning",
              p: "Þurrir dagar eru bestir. Lítil rigning lækkar aðeins, mikil rigning lækkar meira.",
              icon: "🌧️",
            },
          ],
          finalH: "Lokaeinkunn",
          finalP:
            "Byrjað er á grunneinkunn út frá hita og síðan dregin frá stig fyrir vind og rigningu. Lokaeinkunnin er alltaf á bilinu 0–10.",
          outro: "Hærri einkunn = betri aðstæður til útilegu.",
        }
      : {
          title: "How scoring works",
          intro:
            "CampCast gives each day a score from 0 to 10 to show how good the camping conditions are.",
          bullets: [
            {
              h: "Temperature",
              p: "Warmer days are better. Cold days score lower, mild and warm days score higher.",
              icon: "🌡️",
            },
            {
              h: "Wind",
              p: "Strong wind makes camping uncomfortable. The stronger the wind, the more points are deducted.",
              icon: "🌬️",
            },
            {
              h: "Rain",
              p: "Dry days are best. Light rain reduces the score a little, heavy rain lowers it more.",
              icon: "🌧️",
            },
          ],
          finalH: "Final score",
          finalP:
            "We start with a base score from temperature, then subtract penalties for wind and rain. The score is always kept within 0–10.",
          outro: "Higher score = better camping conditions.",
        };

  // If you later add translation keys, these will automatically override the fallback.
  const TT = (key, fallback) => (t ? t(key) : fallback);

  return (
    <details className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 px-3 py-2">
      <summary className="cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-200">
        {TT("scoreExplanationTitle", copy.title)}
      </summary>

      <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-2">
        <p>{TT("scoreExplanationIntro", copy.intro)}</p>

        <div className="space-y-2">
          {copy.bullets.map((b) => (
            <div key={b.h} className="flex gap-2">
              <div className="mt-0.5">{b.icon}</div>
              <div>
                <div className="font-semibold text-slate-700 dark:text-slate-200">
                  {TT(`scoreExplanation_${b.h}`, b.h)}
                </div>
                <div>{b.p}</div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="font-semibold text-slate-700 dark:text-slate-200">
            {TT("scoreExplanationFinalTitle", copy.finalH)}
          </div>
          <div>{TT("scoreExplanationFinalText", copy.finalP)}</div>
        </div>

        <div className="font-semibold text-slate-700 dark:text-slate-200">
          {TT("scoreExplanationOutro", copy.outro)}
        </div>
      </div>
    </details>
  );
}

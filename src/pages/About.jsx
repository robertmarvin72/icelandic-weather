import React from "react";

export default function About({ t }) {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">{t("aboutTitle")}</h1>

      <p className="mb-3">{t("aboutIntro")}</p>
      <p className="mb-6">{t("aboutGoal")}</p>

      <h2 className="font-semibold mb-2">{t("aboutFeaturesTitle")}</h2>
      <ul className="list-disc ml-5 mb-6">
        {(t("aboutFeatures") ?? []).map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <h2 className="font-semibold mb-2">{t("aboutProTitle")}</h2>
      <ul className="list-disc ml-5 mb-6">
        {(t("aboutProFeatures") ?? []).map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <p className="mb-6">{t("aboutOutro")}</p>

      <h2 className="font-semibold mb-2">{t("aboutSupportTitle")}</h2>
      <div className="mb-6">
        <p className="mb-3">{t("aboutSupportBody")}</p>
        <div className="inline-block rounded-lg bg-white p-2 shadow-sm dark:shadow-md">
          <img
            src="/Tthrsj_logo-netto.jpg"
            alt={t("aboutSupportLogoAlt")}
            className="block w-24 sm:w-40 md:w-52 h-auto"
          />
        </div>
      </div>

      <p className="text-sm">
        {t("aboutContact")}
        <br />
        {t("aboutEmailLabel")}:{" "}
        <a
          href="mailto:hello@eltumvedrid.is"
          className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 underline-offset-4 hover:underline"
        >
          hello@eltumvedrid.is
        </a>
      </p>
    </main>
  );
}

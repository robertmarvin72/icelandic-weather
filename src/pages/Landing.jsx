import React from "react";
import { motion } from "framer-motion";
import { landingTranslations } from "../i18n/translations.landing";
import {
  MapPin,
  CloudRain,
  Wind,
  ArrowRight,
  Route,
  ShieldCheck,
  Check,
  AlertTriangle,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function AdvisorPreview({ t, title, subtitle, variant = 3 }) {
  const tr = typeof t === "function" ? t : (key) => key;

  const variants = {
    1: {
      badge: tr("landingAdvisorBadgeStay"),
      mainTitle: tr("landingAdvisorStayTitle"),
      mainSubtitle: tr("landingAdvisorStaySubtitle"),
      benefits: [
        tr("landingAdvisorStayBenefit1"),
        tr("landingAdvisorStayBenefit2"),
        tr("landingAdvisorStayBenefit3"),
      ],
      riskTitle: tr("landingAdvisorStayRisk"),
      riskText: tr("landingAdvisorStayExtra"),
      shellClass: "border-sky-200 bg-sky-50/60",
      badgeClass: "bg-sky-100 text-sky-700",
      checkClass: "bg-sky-100 text-sky-700",
      riskToneClass: "bg-sky-50 text-sky-800 ring-1 ring-sky-200",
    },
    2: {
      badge: tr("landingAdvisorBadgeConsider"),
      mainTitle: tr("landingAdvisorConsiderTitle"),
      mainSubtitle: tr("landingAdvisorConsiderSubtitle"),
      benefits: [
        tr("landingAdvisorConsiderBenefit1"),
        tr("landingAdvisorConsiderBenefit2"),
        tr("landingAdvisorConsiderBenefit3"),
      ],
      riskTitle: tr("landingAdvisorConsiderRisk"),
      riskText: tr("landingAdvisorConsiderExtra"),
      shellClass: "border-amber-200 bg-amber-50/60",
      badgeClass: "bg-amber-100 text-amber-700",
      checkClass: "bg-amber-100 text-amber-700",
      riskToneClass: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    },
    3: {
      badge: tr("landingAdvisorBadgeMove"),
      mainTitle: tr("landingAdvisorMoveTitle"),
      mainSubtitle: tr("landingAdvisorMoveSubtitle"),
      benefits: [
        tr("landingAdvisorMoveBenefit1"),
        tr("landingAdvisorMoveBenefit2"),
        tr("landingAdvisorMoveBenefit3"),
      ],
      riskTitle: tr("landingAdvisorMoveRisk"),
      riskText: tr("landingAdvisorMoveExtra"),
      shellClass: "border-emerald-200 bg-emerald-50/60",
      badgeClass: "bg-emerald-100 text-emerald-700",
      checkClass: "bg-emerald-100 text-emerald-700",
      riskToneClass: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    },
  };

  const current = variants[variant] || variants[3];

  return (
    <div className="rounded-[28px] border border-black/10 bg-white p-4 shadow-xl shadow-black/5">
      <div className="overflow-hidden rounded-[24px] border border-black/5 bg-neutral-50">
        <div className="border-b border-black/5 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xl font-semibold tracking-tight text-neutral-950">
                {tr("landingAdvisorModuleTitle")}
              </div>
              <div className="mt-1 text-sm text-neutral-500">
                {tr("landingAdvisorModuleSubtitle")}
              </div>
            </div>

            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${current.badgeClass}`}>
              {current.badge}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className={`rounded-[24px] border p-5 ${current.shellClass}`}>
            <div className="text-3xl font-bold tracking-tight text-neutral-950">
              {current.mainTitle}
            </div>
            <p className="mt-2 text-lg leading-8 text-neutral-700">{current.mainSubtitle}</p>

            <div className="mt-5 space-y-3">
              {current.benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3 text-base font-medium text-neutral-900"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${current.checkClass}`}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                  {benefit}
                </div>
              ))}
            </div>

            <div className={`mt-5 rounded-2xl ${current.riskToneClass}`}>
              <div className="flex items-center gap-3 px-4 py-3 font-semibold">
                <AlertTriangle className="h-5 w-5" />
                {current.riskTitle}
              </div>
              <div className="border-t border-black/5 bg-white/65 px-4 py-3 text-sm leading-7 text-neutral-700">
                {current.riskText}
              </div>
            </div>
          </div>

          <div className="px-1">
            <div className="text-lg font-semibold text-neutral-950">{title}</div>
            <div className="mt-1 text-base text-neutral-600">{subtitle}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, text, center = false }) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? (
        <div className="mb-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
          {eyebrow}
        </div>
      ) : null}
      <h2 className="text-3xl font-bold tracking-tight text-neutral-950 md:text-4xl">{title}</h2>
      {text ? <p className="mt-4 text-lg leading-8 text-neutral-600">{text}</p> : null}
    </div>
  );
}

export default function Landing({ t }) {
  const [lang, setLang] = React.useState("en");
  const tr = (key) => landingTranslations[lang]?.[key] || key;

  const steps = [
    {
      icon: MapPin,
      title: tr("landingStep1Title"),
      text: tr("landingStep1Text"),
    },
    {
      icon: CloudRain,
      title: tr("landingStep2Title"),
      text: tr("landingStep2Text"),
    },
    {
      icon: Route,
      title: tr("landingStep3Title"),
      text: tr("landingStep3Text"),
    },
  ];

  const benefits = [
    {
      icon: Wind,
      title: tr("landingBenefit1Title"),
      text: tr("landingBenefit1Text"),
    },
    {
      icon: ShieldCheck,
      title: tr("landingBenefit2Title"),
      text: tr("landingBenefit2Text"),
    },
    {
      icon: CloudRain,
      title: tr("landingBenefit3Title"),
      text: tr("landingBenefit3Text"),
    },
  ];

  const screenshots = [
    {
      title: tr("landingScreenshot1Title"),
      subtitle: tr("landingScreenshot1Subtitle"),
      variant: 1,
    },
    {
      title: tr("landingScreenshot2Title"),
      subtitle: tr("landingScreenshot2Subtitle"),
      variant: 2,
    },
    {
      title: tr("landingScreenshot3Title"),
      subtitle: tr("landingScreenshot3Subtitle"),
      variant: 3,
    },
  ];

  const comparisonRows = [
    [tr("landingCompareLeft1"), tr("landingCompareRight1")],
    [tr("landingCompareLeft2"), tr("landingCompareRight2")],
    [tr("landingCompareLeft3"), tr("landingCompareRight3")],
  ];

  return (
    <div className="min-h-screen bg-[#faf8f2] text-neutral-900">
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_50%)]" />

      <header className="sticky top-0 z-30 border-b border-black/5 bg-[#faf8f2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-6">
          <a href="/" className="flex items-center gap-2">
            <img
              src="/landing-light.png"
              alt="CampCast logo"
              className="h-20 w-20 object-contain shrink-0"
            />

            <div className="leading-tight">
              <div className="text-xl font-semibold tracking-tight text-neutral-950">CampCast</div>
              <div className="text-sm text-neutral-500">{tr("landingBrandSubtitle")}</div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm text-neutral-600 md:flex">
            <a href="#how-it-works" className="transition hover:text-neutral-950">
              {tr("landingNavHow")}
            </a>
            <a href="#why-campcast" className="transition hover:text-neutral-950">
              {tr("landingNavWhy")}
            </a>
            <a href="#screenshots" className="transition hover:text-neutral-950">
              {tr("landingNavScreenshots")}
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLang?.("is")}
              className={`text-sm font-medium ${lang === "is" ? "text-neutral-950" : "text-neutral-500"}`}
            >
              IS
            </button>
            <span className="text-neutral-300">/</span>
            <button
              type="button"
              onClick={() => setLang?.("en")}
              className={`text-sm font-medium ${lang === "en" ? "text-neutral-950" : "text-neutral-500"}`}
            >
              EN
            </button>
          </div>

          <a
            href="https://www.campcast.is"
            className="inline-flex items-center gap-2 rounded-2xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            {tr("landingOpenCampcast")}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-5 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
              {tr("landingEyebrow")}
            </div>

            <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-neutral-950 md:text-6xl">
              {tr("landingHeroTitle")}
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-600 md:text-xl">
              {tr("landingHeroSubtitle")}
            </p>

            <p className="mt-3 max-w-xl text-base font-medium text-neutral-900 md:text-lg">
              {tr("landingHeroUrgency")}
            </p>

            <div className="mt-8">
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="https://www.campcast.is"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5"
                >
                  {tr("landingPrimaryCta")}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#screenshots"
                  className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-6 py-3.5 text-base font-semibold text-neutral-900 transition hover:bg-neutral-50"
                >
                  {tr("landingSecondaryCta")}
                </a>
              </div>

              <div className="mt-3 text-sm font-medium text-neutral-500">
                {tr("landingHeroNoSignup")}
              </div>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3 opacity-90">
              <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="text-sm text-neutral-500">{tr("landingStat1Label")}</div>
                <div className="mt-1 font-semibold">{tr("landingStat1Value")}</div>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="text-sm text-neutral-500">{tr("landingStat2Label")}</div>
                <div className="mt-1 font-semibold">{tr("landingStat2Value")}</div>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="text-sm text-neutral-500">{tr("landingStat3Label")}</div>
                <div className="mt-1 font-semibold">{tr("landingStat3Value")}</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-emerald-200/40 blur-2xl" />
            <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-amber-200/40 blur-2xl" />

            <AdvisorPreview
              t={tr}
              title={tr("landingHeroMockTitle")}
              subtitle={tr("landingHeroMockSubtitle")}
              variant={3}
            />
          </motion.div>
        </section>

        <section className="border-y border-black/5 bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-16 md:grid-cols-3 lg:px-8">
            <div className="rounded-3xl border border-black/5 bg-neutral-50 p-6">
              <div className="text-lg font-semibold text-neutral-950">
                {tr("landingProblem1Title")}
              </div>
              <p className="mt-3 text-neutral-600">{tr("landingProblem1Text")}</p>
            </div>
            <div className="rounded-3xl border border-black/5 bg-neutral-50 p-6">
              <div className="text-lg font-semibold text-neutral-950">
                {tr("landingProblem2Title")}
              </div>
              <p className="mt-3 text-neutral-600">{tr("landingProblem2Text")}</p>
            </div>
            <div className="rounded-3xl border border-black/5 bg-neutral-50 p-6">
              <div className="text-lg font-semibold text-neutral-950">
                {tr("landingProblem3Title")}
              </div>
              <p className="mt-3 text-neutral-600">{tr("landingProblem3Text")}</p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionTitle
            eyebrow={tr("landingHowEyebrow")}
            title={tr("landingHowTitle")}
            text={tr("landingHowText")}
            center
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeUp}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="rounded-[28px] border border-black/5 bg-white p-7 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="mt-5 text-xs font-medium uppercase tracking-wide text-neutral-500">
                    {tr("landingStepLabel")} {index + 1}
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold leading-tight text-neutral-950">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-lg leading-8 text-neutral-600">{step.text}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section id="why-campcast" className="bg-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div>
              <SectionTitle
                eyebrow={tr("landingWhyEyebrow")}
                title={tr("landingWhyTitle")}
                text={tr("landingWhyText")}
              />

              <div className="mt-10 overflow-hidden rounded-[28px] border border-black/5 bg-neutral-50">
                <div className="grid grid-cols-2 border-b border-black/5 bg-white text-sm font-semibold text-neutral-950">
                  <div className="px-5 py-4">{tr("landingCompareHeaderLeft")}</div>
                  <div className="border-l border-black/5 px-5 py-4">
                    {tr("landingCompareHeaderRight")}
                  </div>
                </div>

                {comparisonRows.map((row) => (
                  <div key={row[0]} className="grid grid-cols-2 text-sm md:text-base">
                    <div className="border-b border-black/5 px-5 py-4 text-neutral-600">
                      {row[0]}
                    </div>
                    <div className="border-b border-l border-black/5 px-5 py-4 font-medium text-neutral-900">
                      {row[1]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 self-start">
              {benefits.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.25 }}
                    variants={fadeUp}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="rounded-[28px] border border-black/5 bg-[#faf8f2] p-7"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-neutral-900 shadow-sm">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-neutral-950">{item.title}</h3>
                    <p className="mt-3 leading-7 text-neutral-600">{item.text}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="screenshots" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionTitle
            eyebrow={tr("landingScreenshotsEyebrow")}
            title={tr("landingScreenshotsTitle")}
            text={tr("landingScreenshotsText")}
            center
          />

          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {screenshots.map((item) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
              >
                <AdvisorPreview
                  t={tr}
                  title={item.title}
                  subtitle={item.subtitle}
                  variant={item.variant}
                />
              </motion.div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-24 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-[36px] border border-black/5 bg-neutral-950 px-8 py-14 text-white shadow-2xl shadow-black/10 md:px-14 md:py-16">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-white/80">
                  {tr("landingFinalEyebrow")}
                </div>
                <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-5xl">
                  {tr("landingFinalTitle")}
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-white/75">
                  {tr("landingFinalText")}
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <a
                  href="https://www.campcast.is"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-neutral-950 transition hover:-translate-y-0.5"
                >
                  {tr("landingFinalCta")}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <div className="text-sm text-white/60">{tr("landingFinalNote")}</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

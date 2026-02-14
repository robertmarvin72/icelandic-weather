import { useNavigate } from "react-router-dom";

export default function Pricing({ me, t }) {
  const navigate = useNavigate();

  const isPro = me?.pro;
  const plan = me?.subscription?.plan;
  const proUntil = me?.proUntil;

  const isYearly = isPro && plan === "yearly";
  const isMonthly = isPro && plan === "monthly";

  function goMonthly() {
    navigate("/subscribe?plan=monthly");
  }

  function goYearly() {
    navigate("/subscribe?plan=yearly");
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Pricing</h1>

      {isYearly && (
        <div className="p-4 rounded bg-green-100 dark:bg-green-900">
          {t("pricingAlreadyYearly")} <br />
          {t("pricingActiveUntil")} {new Date(proUntil).toLocaleDateString()}
        </div>
      )}

      <div className="space-y-4">
        <button
          disabled={isMonthly || isYearly}
          onClick={goMonthly}
          className="w-full p-3 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {isMonthly ? t("pricingMonthlyAlreadyActive") : "Monthly"}
        </button>

        <button
          disabled={isYearly}
          onClick={goYearly}
          className="w-full p-3 bg-purple-600 text-white rounded disabled:opacity-50"
        >
          {isYearly
            ? t("pricingYearlyActive")
            : isMonthly
              ? t("pricingCtaUpgradeToYearly")
              : "Yearly"}
        </button>
      </div>
    </div>
  );
}

import { useSearchParams } from "react-router-dom";

export default function Subscribe({ me, t }) {
  const [params] = useSearchParams();
  const plan = params.get("plan");

  const isPro = me?.pro;
  const currentPlan = me?.subscription?.plan;
  const proUntil = me?.proUntil;

  const isYearly = isPro && currentPlan === "yearly";
  const isMonthly = isPro && currentPlan === "monthly";

  async function startCheckout() {
    const priceId =
      plan === "yearly"
        ? import.meta.env.VITE_PADDLE_PRICE_YEARLY
        : import.meta.env.VITE_PADDLE_PRICE_MONTHLY;

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: me.email,
        priceId,
      }),
    });

    const data = await res.json();

    if (res.status === 409) {
      alert("Subscription already active.");
      return;
    }

    if (data.upgraded) {
      window.location.href = "/?checkout=success&upgrade=1";
      return;
    }

    window.location.href = data.checkoutUrl;
  }

  if (isYearly) {
    return (
      <div className="p-6">
        {t("subscribeAlreadyActive")} {new Date(proUntil).toLocaleDateString()}
      </div>
    );
  }

  if (isMonthly && plan === "monthly") {
    return <div className="p-6">{t("subscribeAlreadyMonthly")}</div>;
  }

  return (
    <div className="p-6">
      <button onClick={startCheckout} className="p-3 bg-blue-600 text-white rounded">
        Confirm {plan}
      </button>
    </div>
  );
}

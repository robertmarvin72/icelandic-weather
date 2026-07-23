import { useCallback, useEffect } from "react";
import { trackEvent } from "../lib/analytics";

export function useCheckoutFlow({ me, navigate, openLoginModal, pushToast, t, refetchMe }) {
  const startCheckout = useCallback(async (src) => {
    if (!me?.user) {
      pushToast({
        type: "info",
        title: t?.("loginRequired") ?? "Login required",
        message: t?.("pleaseLoginToContinue") ?? "Please log in to continue.",
      });
      openLoginModal();
      return;
    }

    if (me?.entitlements?.pro) {
      pushToast({
        type: "success",
        title: t?.("proActive") ?? "Pro",
        message: t?.("alreadyPro") ?? "You already have Pro 👌",
      });
      return;
    }

    const params = new URLSearchParams();
    params.set("email", me?.user?.email || "");
    if (src) params.set("src", src);
    navigate(`/pricing?${params.toString()}`);
  }, [me, navigate, openLoginModal, pushToast, t]);

  const openBillingPortal = useCallback(async () => {
    if (!me?.user) {
      openLoginModal();
      return;
    }

    trackEvent("cancellation_started", {
      source: "app",
      currentTier: me?.entitlements?.pro ? "pro" : "free",
    });

    try {
      pushToast({
        type: "info",
        title: t?.("billingPortal") ?? "Billing",
        message: t?.("openingBillingPortal") ?? "Opening billing portal…",
      });

      const r = await fetch("/api/billing-portal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j?.ok || !j?.url) {
        const msg =
          j?.error ||
          (j?.code === "MISSING_PADDLE_CUSTOMER"
            ? (t?.("billingPortalUnavailable") ?? "Billing portal not ready for this account yet.")
            : `Billing portal failed (${r.status})`);

        throw new Error(msg);
      }

      window.location.assign(j.url);
    } catch (err) {
      pushToast({
        type: "error",
        title: t?.("billingPortal") ?? "Billing",
        message: String(err?.message || err),
      });
    }
  }, [me, openLoginModal, pushToast, t]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const status = url.searchParams.get("checkout");
    if (!status) return;

    if (status === "success") {
      pushToast({
        type: "success",
        title: "Pro",
        message: t?.("checkoutSuccess") ?? "Pro unlocked!",
      });
      refetchMe();
    } else if (status === "cancel") {
      pushToast({
        type: "info",
        title: "Checkout",
        message: t?.("checkoutCancelled") ?? "Checkout cancelled.",
      });
      refetchMe();
    }

    url.searchParams.delete("checkout");
    window.history.replaceState({}, "", url.toString());
  }, [pushToast, refetchMe, t]);

  return {
    startCheckout,
    openBillingPortal,
  };
}

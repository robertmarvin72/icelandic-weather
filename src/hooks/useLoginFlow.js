import { useCallback, useEffect, useState } from "react";

export function useLoginFlow({ me, navigate, pushToast, t, refetchMe }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const openLoginModal = useCallback(() => {
    setLoginEmail(me?.user?.email || "");
    setLoginOpen(true);
  }, [me]);

  const closeLoginModal = useCallback(() => {
    if (loginBusy) return;
    setLoginOpen(false);
  }, [loginBusy]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const shouldUpgrade = url.searchParams.get("upgrade");

    if (shouldUpgrade === "1" && !me?.user) {
      openLoginModal();
      url.searchParams.delete("upgrade");
      window.history.replaceState({}, "", url.toString());
    }
  }, [me, openLoginModal]);

  const submitLogin = useCallback(
    async (e) => {
      e?.preventDefault?.();

      const email = String(loginEmail || "").trim();
      if (!email || !email.includes("@")) {
        pushToast({
          type: "error",
          title: t?.("login") ?? "Login",
          message: t?.("invalidEmail") ?? "Please enter a valid email.",
        });
        return;
      }

      setLoginBusy(true);

      try {
        const r = await fetch("/api/login-email", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await r.json().catch(() => null);

        if (!r.ok || !data?.ok) {
          if (data?.code === "USER_NOT_FOUND") {
            navigate(`/pricing?email=${encodeURIComponent(email)}`);
            setLoginOpen(false);
            return;
          }

          const msg = data?.error || `Login failed (${r.status})`;
          pushToast({
            type: "error",
            title: t?.("login") ?? "Login",
            message: msg,
          });
          return;
        }

        await refetchMe();

        pushToast({
          type: "success",
          title: t?.("login") ?? "Login",
          message: t?.("loggedIn") ?? "You're logged in.",
        });

        setLoginOpen(false);
        navigate(`/pricing?email=${encodeURIComponent(email)}`);
      } catch (err) {
        pushToast({
          type: "error",
          title: t?.("login") ?? "Login",
          message: String(err?.message || err),
        });
      } finally {
        setLoginBusy(false);
      }
    },
    [loginEmail, navigate, pushToast, refetchMe, t]
  );

  return {
    loginOpen,
    loginEmail,
    setLoginEmail,
    loginBusy,
    openLoginModal,
    closeLoginModal,
    submitLogin,
  };
}

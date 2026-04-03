export function trackEvent(name, data = {}) {
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(name, { props: data });
  }

  if (import.meta.env.DEV) {
    console.log("[event]", name, data);
  }
}

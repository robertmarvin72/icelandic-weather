import ReactGA from "react-ga4";

const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function initAnalytics() {
  if (gaId) {
    ReactGA.initialize(gaId);
  }
}

export function trackPageView(path) {
  if (!gaId) return;
  ReactGA.send({ hitType: "pageview", page: path });
}

export function trackEvent(name, data = {}) {
  if (gaId) {
    ReactGA.event(name, data);
  }

  if (import.meta.env.DEV) {
    console.log("[event]", name, data);
  }
}

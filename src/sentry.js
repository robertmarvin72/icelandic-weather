// src/sentry.js
import * as Sentry from "@sentry/react";

// Only initialize if DSN exists (so local/dev can run without it if you want)
const dsn = import.meta.env.VITE_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // "development" | "production"
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0),

    // Enable performance tracing (no extra package needed)
    integrations: [Sentry.browserTracingIntegration()],

    // Keep noise down: ignore common non-actionable errors
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
    ],
  });
}

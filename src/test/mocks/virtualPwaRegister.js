// Test-only stand-in for Vite PWA's "virtual:pwa-register" module, which
// only exists via the real vite-plugin-pwa build pipeline (not present in
// vitest.config.js's plugin list). Aliased in vitest.config.js so App.jsx
// can be imported in tests at all — registerSW() is a no-op here; tests
// that need to observe onNeedRefresh/onOfflineReady still mock this module
// directly with vi.mock() to control those callbacks.
export function registerSW() {
  return () => {};
}

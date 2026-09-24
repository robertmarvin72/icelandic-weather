import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: false,
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],

      devOptions: {
        enabled: false
      },

      workbox: {
        navigateFallback: "/index.html",

        // Ticket 417 (#417) — the 54 static Weather Voice share HTML pages
        // must NOT be force-downloaded into every visitor's install-time SW
        // cache (Workbox's default generateSW globPatterns match **/*.html
        // under the build output, which would otherwise sweep all of them
        // in). These are optional, rarely-visited social-share landing
        // pages — they should be fetched fresh over the network when an
        // actual visitor or crawler follows a share link, not precached for
        // every homepage visit. The PNGs are already excluded by default
        // (png is not in the default precache glob); this only needed to
        // add the .html files.
        globIgnores: ["share/**/*.html"],

        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/assets\//,
          /\/favicon\.ico$/,
          /\/icon-.*\.png$/,
          // Ticket 417 (#417) — static Weather Voice share pages. Without
          // this, an installed/SW-controlled PWA would intercept every
          // navigation to /share/tjaldur/... and replace it with the SPA
          // shell (index.html), defeating the entire point of a real,
          // crawlable static HTML page at that URL.
          /^\/share\//
        ],

        cleanupOutdatedCaches: true,

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/v1\/forecast/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-open-meteo",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 60
              }
            }
          },
          {
            urlPattern:
              /^https:\/\/{1,3}\.tile\.openstreetmap\.org\/.*\.(png|jpg|jpeg|webp)/i,
            handler: "CacheFirst",
            options: {
              cacheName: "osm-tiles",
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 7 * 24 * 60 * 60
              }
            }
          }
        ]
      }
    })
  ],

  server: {
    proxy: {
      // 🔹 Keep your existing Open-Meteo proxy
      "/api/forecast": {
        target: "https://api.open-meteo.com",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/forecast/, "/v1/forecast")
      },

      // 🔹 NEW: Proxy all other /api/* to Vercel dev
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false
      }
    }
  },

  build: {
    sourcemap: true
  }
});

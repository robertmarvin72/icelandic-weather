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

        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/assets\//,
          /\/favicon\.ico$/,
          /\/icon-.*\.png$/
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

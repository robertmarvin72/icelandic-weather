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
      workbox: {
        navigateFallback: "/offline.html",
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/v1\/forecast/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-open-meteo",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 60,
              },
            },
          },
          {
            urlPattern: /^https:\/\/{1,3}\.tile\.openstreetmap\.org\/.*\.(png|jpg|jpeg|webp)/i,
            handler: "CacheFirst",
            options: {
              cacheName: "osm-tiles",
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],

  // 👇 DEV-ONLY proxy (npm run dev)
  server: {
    proxy: {
      "/api/forecast": {
        target: "https://api.open-meteo.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/forecast/, "/v1/forecast"),
      },
    },
  },

  build: {
    sourcemap: true,
  },
});

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // we already have public/manifest.json
      manifest: false,
      registerType: 'autoUpdate',
      includeAssets: [
        'icon-192.png',
        'icon-512.png',
        // add any other assets in /public you want precached
      ],
      workbox: {
        // Show a friendly offline page for navigations
        navigateFallback: '/offline.html',

        // Precache patterns (built assets are auto-included)
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],

        runtimeCaching: [
          // Open-Meteo API — Stale-While-Revalidate (30 min TTL)
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/v1\/forecast/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-open-meteo',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 60, // 30 minutes
              }
            }
          },
          // OpenStreetMap tiles — Cache First with a reasonable TTL
          {
            urlPattern: /^https:\/\/{1,3}\.tile\.openstreetmap\.org\/.*\.(png|jpg|jpeg|webp)/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              }
            }
          }
        ]
      }
    })
  ],
  
  build: {
    sourcemap: true,
  },
})

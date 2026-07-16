import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/white_noise/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Icons are generated from public/favicon.svg by @vite-pwa/assets-generator
      // (see pwa-assets.config.ts); this injects the <link>s and manifest icons.
      pwaAssets: {
        config: true,
        overrideManifestIcons: true,
      },
      // scope / start_url / id are derived from Vite `base` ("/white_noise/"),
      // which is what makes the service worker install correctly on the
      // GitHub Pages project subpath.
      manifest: {
        name: "Sleep Noise",
        short_name: "Sleep Noise",
        description:
          "Evidence-based colored-noise generator for soothing babies to sleep.",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "portrait",
        categories: ["health", "lifestyle", "music"],
      },
      workbox: {
        // Defaults precache only js/css/html; add the generated icons so the
        // installed app is fully offline-capable (it plays overnight, offline).
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
      devOptions: {
        // Serve the service worker in `vite dev` so installability is testable
        // without a production build.
        enabled: true,
      },
    }),
  ],
});

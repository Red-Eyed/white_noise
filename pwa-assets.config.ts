import {
  defineConfig,
  minimal2023Preset,
} from "@vite-pwa/assets-generator/config";

// Generates every PWA icon (favicon, 192/512 "any", maskable, apple-touch) from
// the single source public/favicon.svg. vite-plugin-pwa's `pwaAssets` integration
// reads this at dev/build time and injects the head <link>s + manifest icons.
export default defineConfig({
  headLinkOptions: {
    preset: "2023",
  },
  preset: {
    ...minimal2023Preset,
    // The source SVG is already full-bleed dark with the crescent centered in
    // the safe zone, so no padding is needed — this keeps the maskable and
    // apple tiles fully opaque (#0a0a0a) instead of adding a transparent ring.
    maskable: { ...minimal2023Preset.maskable, padding: 0 },
    apple: { ...minimal2023Preset.apple, padding: 0 },
  },
  images: ["public/favicon.svg"],
});

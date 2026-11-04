// @ts-check
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"

// SITE_URL is the public address (canonical links, sitemap, Open Graph). Set it in the host's build env.
export default defineConfig({
  site: process.env.SITE_URL ?? "http://localhost:4321",
  // React islands: Slipway parts work here (`node <slipway>/scripts/pack.mjs copy <part> --to src`).
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  // Content-Security-Policy as a <meta> tag with hashes of every script and style Astro emits, so
  // islands hydrate without 'unsafe-inline'. frame-ancestors can't live in <meta>: see public/_headers.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self' https:",
        "frame-src https://postcode.map.daum.net",
        "form-action 'self'",
      ],
      // The Daum postcode search (AddressInput part) loads its script from this host.
      scriptDirective: { resources: ["'self'", "https://t1.daumcdn.net"] },
    },
  },
})

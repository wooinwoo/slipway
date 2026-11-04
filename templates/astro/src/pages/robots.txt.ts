import type { APIRoute } from "astro"

// Points crawlers at the sitemap that @astrojs/sitemap writes at build time.
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL("/sitemap-index.xml", site)}\n`)

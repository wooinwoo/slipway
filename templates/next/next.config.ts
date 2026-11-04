import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Security headers on every response. The Content-Security-Policy comes from src/proxy.ts (per-request nonce).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The postcode popup reports back through window.opener.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ]
  },
  turbopack: {
    // The mock backend's worker exists only in the browser build of msw.
    resolveAlias: { "msw/browser": { browser: "msw/browser", default: "./src/mocks/server-stub.ts" } },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig

import { type NextRequest, NextResponse } from "next/server"

// A fresh nonce per request lets Next.js's own inline scripts run under a strict Content-Security-Policy
// ('strict-dynamic', no 'unsafe-inline' for scripts). Pages render dynamically because of it.
// The Daum postcode search (AddressInput) loads its script from t1.daumcdn.net.
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const dev = process.env.NODE_ENV === "development"
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://t1.daumcdn.net${dev ? " 'unsafe-eval'" : ""}`,
    // Components set style attributes (Radix positioning, CSS variables); scripts stay strict.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' https:${dev ? " ws:" : ""}`,
    "frame-src https://postcode.map.daum.net",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ")

  const headers = new Headers(request.headers)
  headers.set("x-nonce", nonce)
  headers.set("Content-Security-Policy", csp)
  const response = NextResponse.next({ request: { headers } })
  response.headers.set("Content-Security-Policy", csp)
  return response
}

export const config = {
  // Pages only: static files, images and the mock service worker don't need a policy per request.
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.svg|robots.txt|mockServiceWorker.js).*)",
      missing: [{ type: "header", key: "next-router-prefetch" }],
    },
  ],
}

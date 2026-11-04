import type { Metadata } from "next"
import { headers } from "next/headers"
import type { ReactNode } from "react"

import "./globals.css"
import { product } from "@/config"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: { template: `%s · ${product.name}`, default: `${product.name} · ${product.tagline}` },
  description: product.tagline,
}

// Runs before first paint so a saved dark theme or brand hue never flashes (theme-provider and lib/brand
// use the same storage keys).
const beforePaint = `try{var t=localStorage.getItem("theme");var d=t==="dark"||((!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.add(d?"dark":"light");var h=localStorage.getItem("slipway.brand-h");if(h!==null)document.documentElement.style.setProperty("--brand-h",h)}catch(e){}`

export default async function RootLayout({ children }: { children: ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: beforePaint }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

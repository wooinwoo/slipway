import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  // Tests use an isolated API port; ordinary development uses :3000.
  server: { proxy: { "/api": process.env.API_PROXY_TARGET ?? "http://localhost:3000" } },
  preview: { proxy: { "/api": process.env.API_PROXY_TARGET ?? "http://localhost:3000" } },
})

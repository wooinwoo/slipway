// msw/browser has no server build. The mock worker only starts in the browser (src/app/providers.tsx),
// but the bundler still resolves the import for server rendering; this stands in there.
export function setupWorker(): never {
  throw new Error("The mock service worker runs in the browser only.")
}

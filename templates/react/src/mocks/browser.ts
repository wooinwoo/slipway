import { setupWorker } from "msw/browser"

import { authHandlers } from "./handlers/auth"
// Import domain resource handlers here as they are added.

// An array, not call arguments: formatters keep the trailing comma here, so `pnpm gen resource`
// can always add a line above the marker.
export const handlers = [
  ...authHandlers,
  // gen:handlers
]

export const worker = setupWorker(...handlers)

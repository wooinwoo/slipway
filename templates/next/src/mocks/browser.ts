import { setupWorker } from "msw/browser"

import { authHandlers } from "./handlers/auth"
// Import domain resource handlers here as they are added.

export const worker = setupWorker(
  ...authHandlers,
  // gen:handlers
)

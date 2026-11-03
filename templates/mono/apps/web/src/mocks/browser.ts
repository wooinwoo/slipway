import { setupWorker } from "msw/browser"

import { authHandlers } from "./handlers/auth"
// gen:imports (pnpm gen resource adds handler imports above this line)

export const worker = setupWorker(
  ...authHandlers,
  // gen:handlers
)

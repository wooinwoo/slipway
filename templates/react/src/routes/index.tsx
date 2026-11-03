import { createFileRoute, redirect } from "@tanstack/react-router"

import { meQuery } from "@/api/auth"

// No landing page in the kit: signed-in users go to the app, everyone else to login.
export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(meQuery).catch(() => null)
    throw redirect({ to: user ? "/home" : "/login" })
  },
})

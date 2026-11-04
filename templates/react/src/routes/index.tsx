import { createFileRoute } from "@tanstack/react-router"

// Intentionally empty. Build the first screen from the parts in src/shared/patterns/ (see CODEPACK.md).
export const Route = createFileRoute("/")({
  component: () => <main className="min-h-svh" />,
})

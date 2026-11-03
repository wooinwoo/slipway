// In-browser database for the mock backend, persisted to localStorage so a demo
// survives reloads. Clear site data to start over.
import type { User } from "@/api/auth"
// Import domain resource types here as they are added.

const KEY = "slipway.mock-db.v1"

type Db = {
  users: (User & { password: string })[]
  sessions: Record<string, string>
  // gen:tables
}

function seed(): Db {
  return {
    users: [{ id: "u_demo", name: "김슬립", email: "demo@slipway.dev", password: "demo1234", provider: "email" }],
    sessions: {},
    // gen:seed
  }
}

function load(): Db {
  try {
    const saved = localStorage.getItem(KEY)
    // Spread over a fresh seed so tables added after the data was saved still exist.
    if (saved) return { ...seed(), ...(JSON.parse(saved) as Partial<Db>) }
  } catch {
    // Corrupt or foreign data: start over from the seed.
  }
  return seed()
}

export const db = load()

export function save() {
  localStorage.setItem(KEY, JSON.stringify(db))
}

// In-browser database for the mock backend, persisted to localStorage so a demo
// survives reloads. It starts over each day, so sample data dated from today stays current.
// Clear site data to start over sooner.
import { demoAccount, type User } from "@/shared/api/auth"
import { DEMO_USER_ID, scenario } from "./scenario"
// Import domain resource types here as they are added.

const KEY = "slipway.mock-db.v1"

export type Db = {
  /** The day this data was seeded (YYYY-MM-DD). */
  seededOn: string
  users: (User & { password: string })[]
  sessions: Record<string, string>
  // gen:tables
}

const today = () => new Date().toLocaleDateString("sv-SE")

function seed(): Db {
  return {
    seededOn: today(),
    // The demo account (demoAccount): put the sample data the screens show on u_demo.
    users: [{ id: DEMO_USER_ID, name: "데모", ...demoAccount, provider: "email" }],
    sessions: {},
    // gen:seed
    // The demo account's sample data (src/mocks/scenario.ts) fills the tables above.
    ...scenario(),
  }
}

function load(): Db {
  try {
    const saved = localStorage.getItem(KEY)
    // Spread over a fresh seed so tables added after the data was saved still exist.
    const data = saved ? (JSON.parse(saved) as Partial<Db>) : null
    if (data?.seededOn === today()) return { ...seed(), ...data }
  } catch {
    // Corrupt or foreign data: start over from the seed.
  }
  return seed()
}

export const db = load()

export function save() {
  localStorage.setItem(KEY, JSON.stringify(db))
}

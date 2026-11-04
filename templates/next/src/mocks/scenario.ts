// The demo account's sample data: what the screens show before anyone types. Fill it from the
// design's scenario (k-style: out/journey.md), dates counted from today (isoDaysFrom in @/shared/lib/kr).
// Fixed ids keep detail routes stable for "slipway.routes" in package.json, shots and design:compare.
//
//   classes: [demoRow({ id: "c_morning", title: "모닝 매트", date: isoDaysFrom(0), ... })],
import type { Db } from "./db"

export const DEMO_USER_ID = "u_demo"

let order = 0
/** A row of the demo account: its owner, and creation times a minute apart in the order written. */
export function demoRow<T extends object>(row: T) {
  const at = new Date(Date.now() - 86_400_000 + order++ * 60_000).toISOString()
  return { ...row, userId: DEMO_USER_ID, createdAt: at, updatedAt: at }
}

/** Tables to start the demo with; anything left out starts empty. */
export function scenario(): Partial<Db> {
  return {}
}

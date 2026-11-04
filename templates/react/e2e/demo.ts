import { expect, type Page } from "@playwright/test"

import { demoAccount } from "../src/api/demo-account.js"

/**
 * Opens `path` signed in as the demo account (the seeded sample data), with the clock frozen at `now`
 * when given, the moment the design draws: `await openAsDemo(page, "/today", { now: "2026-11-04T18:50" })`.
 */
export async function openAsDemo(page: Page, path: string, { now }: { now?: string | Date } = {}) {
  if (now) await page.clock.setFixedTime(new Date(now))
  // A page without a sign-in redirect, so the mock backend is up before the request.
  await page.goto("/__signing-in")
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true")
  const signedIn = await page.evaluate(async (account) => {
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(account) })
    const body = response.ok ? ((await response.json()) as { token: string }) : null
    if (body) localStorage.setItem("slipway.token", body.token)
    return !!body
  }, demoAccount)
  expect(signedIn, "the demo account signs in").toBe(true)
  await page.goto(path)
  // The mock backend starts again on every page load; wait for it before the test sends requests.
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true")
}

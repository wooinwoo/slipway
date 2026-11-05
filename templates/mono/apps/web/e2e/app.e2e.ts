import { expect, test } from "@playwright/test"

import { openAsDemo } from "./demo.js"

// Smoke tests for the bare app. Add one `test("REQ-n ...")` per requirement in docs/requirements.md.
test("the app boots and names the tab from src/shared/config.ts", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/.+ · .+/)
})

test("a frozen local time reads the same in the test and the page, on UTC CI runners too", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-04T18:50"))
  await page.goto("/")
  expect(await page.evaluate(() => new Date().getHours())).toBe(18)
})

test("an unknown address shows the not-found state", async ({ page }) => {
  await page.goto("/nope")
  await expect(page.getByText("페이지를 찾을 수 없습니다")).toBeVisible()
})

test("the API answers the auth contract", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true")
  // Same-origin request: the mock backend answers it here, the real API in the monorepo.
  const session = await page.evaluate(async () => {
    const response = await fetch("/api/auth/guest", { method: "POST" })
    const body = (await response.json()) as { token: string; user: { provider: string } }
    return { status: response.status, body }
  })
  expect(session.status).toBe(200)
  expect(session.body.token).toEqual(expect.any(String))
  expect(session.body.user.provider).toBe("guest")
})

test("the demo account signs in with its sample data", async ({ page }) => {
  await openAsDemo(page, "/")
  const me = await page.evaluate(() =>
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${localStorage.getItem("slipway.token")}` } }).then(
      (r) => r.json() as Promise<{ email: string }>
    )
  )
  expect(me.email).toBe("demo@slipway.dev")
})

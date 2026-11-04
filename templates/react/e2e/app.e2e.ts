import { expect, test } from "@playwright/test"

// Smoke tests for the bare app. Add one `test("REQ-n ...")` per requirement in docs/requirements.md.
test("the app boots and names the tab from src/config.ts", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/.+ · .+/)
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

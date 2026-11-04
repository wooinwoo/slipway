import { expect, test } from "@playwright/test"

// Smoke tests for the bare site. Add a test per page or section you build.
test("the home page names itself for people, search engines and link previews", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/.+ · .+/)
  await expect(page.locator("html")).toHaveAttribute("lang", "ko")
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https?:\/\//)
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /.+/)
})

test("crawlers find robots.txt and the sitemap", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text()
  expect(robots).toContain("Sitemap:")
  expect((await request.get("/sitemap-index.xml")).ok()).toBe(true)
})

test("an unknown address shows the not-found page", async ({ page }) => {
  await page.goto("/nope")
  await expect(page.getByRole("heading", { name: "페이지를 찾을 수 없습니다" })).toBeVisible()
})

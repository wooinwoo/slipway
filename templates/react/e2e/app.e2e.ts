import { expect, test, type Page } from "@playwright/test"

// Each test gets a fresh browser context, so the mock database starts from the seed every time.
async function enterAsGuest(page: Page) {
  await page.goto("/login")
  await page.getByRole("button", { name: "가입 없이 둘러보기" }).click()
  await expect(page.getByRole("heading", { name: "게스트님, 환영합니다" })).toBeVisible()
  // Let the first document finish loading; Firefox aborts a goto that interrupts it.
  await page.waitForLoadState("load")
}

test("REQ-1 guest gets in with one click", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveURL(/\/login$/)
  await page.getByRole("button", { name: "가입 없이 둘러보기" }).click()
  await expect(page.getByRole("heading", { name: "게스트님, 환영합니다" })).toBeVisible()
})

test("REQ-2 email login returns to the page you asked for", async ({ page }) => {
  await page.goto("/settings")
  await expect(page).toHaveURL(/\/login/)

  await page.getByLabel("이메일").fill("demo@slipway.dev")
  await page.getByLabel("비밀번호").fill("wrong-password")
  await page.getByRole("button", { name: "로그인", exact: true }).click()
  await expect(page.getByText("이메일 또는 비밀번호가 맞지 않습니다")).toBeVisible()

  await page.getByRole("button", { name: /데모 계정/ }).click()
  await page.getByRole("button", { name: "로그인", exact: true }).click()
  await expect(page).toHaveURL(/\/settings$/)
})

test("REQ-3 signup validates and signs in", async ({ page }) => {
  await page.goto("/signup")
  await page.getByLabel("이름").fill("박해커")
  await page.getByLabel("이메일").fill("demo@slipway.dev")
  await page.getByLabel("비밀번호").fill("short")
  await page.getByRole("button", { name: "가입하기" }).click()
  await expect(page.getByText("8자 이상 입력하세요")).toBeVisible()

  await page.getByLabel("비밀번호").fill("long-enough-1")
  await page.getByRole("button", { name: "가입하기" }).click()
  await expect(page.getByText("이미 가입된 이메일입니다")).toBeVisible()

  await page.getByLabel("이메일").fill(`hacker-${Date.now()}@example.com`)
  await page.getByRole("button", { name: "가입하기" }).click()
  await expect(page.getByRole("heading", { name: "박해커님, 환영합니다" })).toBeVisible()
})

test("REQ-4 the app shell guards, navigates, and handles missing pages", async ({ page }) => {
  await page.goto("/home")
  await expect(page).toHaveURL(/\/login/)
  await page.getByRole("button", { name: "가입 없이 둘러보기" }).click()
  await expect(page.getByRole("heading", { name: "게스트님, 환영합니다" })).toBeVisible()
  await page.waitForLoadState("load")

  await page.getByRole("link", { name: "설정" }).click()
  await expect(page.getByRole("navigation", { name: "breadcrumb" })).toContainText("설정")
  await expect(page).toHaveTitle(/^설정 · /)

  await page.goto("/home/nope")
  await expect(page.getByText("페이지를 찾을 수 없습니다")).toBeVisible()
})

test("REQ-5 command menu jumps to pages and switches theme", async ({ page }) => {
  await enterAsGuest(page)
  await page.keyboard.press("ControlOrMeta+k")
  const dialog = page.getByRole("dialog")
  await dialog.getByPlaceholder("페이지, 명령 검색").fill("설정")
  await dialog.getByRole("option", { name: "설정" }).click()
  await expect(page).toHaveURL(/\/settings$/)

  await page.keyboard.press("ControlOrMeta+k")
  await dialog.getByRole("option", { name: /다크 모드로|라이트 모드로/ }).click()
  await expect(page.locator("html")).toHaveClass(/dark|light/)
})

test("REQ-6 theme and brand color persist", async ({ page }) => {
  await enterAsGuest(page)
  await page.goto("/settings")
  await page.getByRole("radio", { name: "다크" }).click()
  await page.getByRole("button", { name: "색상 168" }).click()
  await page.reload()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(page.locator("html")).toHaveAttribute("style", /--brand-h: 168/)
})

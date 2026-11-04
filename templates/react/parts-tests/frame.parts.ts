import { expect, test, type Page } from "@playwright/test"

async function part(page: Page, name: string, dark: boolean) {
  await page.goto(
    `/fixtures/parts/index.html?part=${name}${dark ? "&theme=dark" : ""}`
  )
}

test("login form reports failures, fills the demo account, and hands off callbacks", async ({
  page,
}, info) => {
  await part(page, "login", info.project.name.includes("dark"))
  await page.getByLabel("이메일").fill("demo@slipway.dev")
  await page.getByLabel("비밀번호").fill("wrong")
  await page.getByRole("button", { name: "로그인", exact: true }).click()
  await expect(page.getByRole("alert")).toHaveText("이메일 또는 비밀번호가 맞지 않습니다")

  await page.getByRole("button", { name: "데모 계정으로 채우기" }).click()
  await expect(page.getByRole("alert")).toBeHidden()
  await expect(page.getByLabel("비밀번호")).toHaveValue("demo1234")
  await page.getByRole("button", { name: "로그인", exact: true }).click()
  await expect(page.locator("output")).toHaveText("login demo@slipway.dev")

  await page.getByRole("button", { name: "카카오로 계속하기" }).click()
  await expect(page.locator("output")).toHaveText("kakao")
  await page.getByRole("button", { name: "가입 없이 둘러보기" }).click()
  await expect(page.locator("output")).toHaveText("guest")
})

test("signup form shows field errors next to the field and keeps the draft", async ({
  page,
}, info) => {
  await part(page, "signup", info.project.name.includes("dark"))
  await page.getByLabel("이름").fill("박해커")
  await page.getByLabel("이메일").fill("hacker@example.com")
  await page.getByLabel("비밀번호").fill("short")
  await page.getByRole("button", { name: "가입하기" }).click()
  await expect(page.getByText("8자 이상 입력하세요")).toBeVisible()
  await expect(page.getByLabel("비밀번호")).toHaveAttribute("aria-invalid", "true")
  await expect(page.getByLabel("이름")).toHaveValue("박해커")

  await page.getByLabel("비밀번호").fill("long-enough-1")
  await page.getByRole("button", { name: "가입하기" }).click()
  await expect(page.locator("output")).toHaveText("signup 박해커")
})

test("app shell navigates, names the page, jumps with Ctrl+K, and logs out", async ({
  page,
}, info) => {
  await part(page, "shell", info.project.name.includes("dark"))
  const mobile = (page.viewportSize()?.width ?? 1280) < 768
  if (mobile) await page.getByRole("button", { name: "Toggle Sidebar" }).click()
  await page.getByRole("link", { name: "주문" }).click()
  await expect(page.getByRole("heading", { name: "주문 화면" })).toBeVisible()
  await expect(page.getByRole("navigation", { name: "breadcrumb" })).toContainText("주문")

  await page.keyboard.press("ControlOrMeta+k")
  const dialog = page.getByRole("dialog", { name: "빠른 이동" })
  await dialog.getByPlaceholder("페이지, 명령 검색").fill("홈")
  await dialog.getByRole("option", { name: "홈" }).click()
  await expect(page.getByRole("heading", { name: "홈 화면" })).toBeVisible()

  await page.keyboard.press("ControlOrMeta+k")
  await dialog.getByRole("option", { name: /다크 모드로|라이트 모드로/ }).click()
  await expect(page.locator("html")).toHaveClass(/dark|light/)

  if (mobile) await page.getByRole("button", { name: "Toggle Sidebar" }).click()
  await page.getByRole("button", { name: /김슬립/ }).click()
  await page.getByRole("menuitem", { name: "로그아웃" }).click()
  await expect(page.locator("output")).toHaveText("로그아웃")
})

test("theme settings switch theme and brand hue, and survive a reload", async ({
  page,
}, info) => {
  await part(page, "theme-settings", info.project.name.includes("dark"))
  await page.getByRole("radio", { name: "다크" }).click()
  await page.getByRole("button", { name: "색상 168" }).click()
  await expect(page.locator("html")).toHaveAttribute("style", /--brand-h: 168/)
  await page.reload()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(page.getByRole("button", { name: "색상 168" })).toHaveAttribute("aria-pressed", "true")
})

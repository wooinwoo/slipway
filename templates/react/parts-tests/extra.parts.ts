import { expect, test } from "@playwright/test"
import { readFile } from "node:fs/promises"

test.beforeEach(async ({ page }, info) => {
  if (info.project.name.includes("dark"))
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () =>
        document.documentElement.classList.add("dark")
      )
    })
})
test("advanced table sorts, selects across pages, and retries a failed batch", async ({
  page,
}) => {
  await page.goto("/fixtures/parts/index.html?part=advanced-table")
  await page.getByRole("button", { name: "숫자", exact: true }).click()
  await expect(page.locator("tbody tr").first()).toContainText("값 E")
  await page.getByRole("checkbox", { name: "현재 페이지 선택" }).check()
  await page.getByRole("button", { name: "다음 페이지" }).click()
  await page.getByRole("checkbox", { name: "현재 페이지 선택" }).check()
  await expect(page.getByText("4개 선택", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "일괄 처리" }).click()
  await expect(page.getByRole("alert")).toHaveText("검증 실패")
  await expect(page.getByText("4개 선택", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "일괄 처리" }).click()
  await expect(page.locator("output")).toHaveText("a,b,d,e")
  await expect(page.getByText("4개 선택", { exact: true })).toHaveCount(0)
})
test("advanced filters combine conditions and reset without fetching data", async ({
  page,
}) => {
  await page.goto("/fixtures/parts/index.html?part=filters")
  await page.getByRole("combobox", { name: "분류" }).click()
  await page.getByRole("option", { name: "A", exact: true }).click()
  await expect(page.locator("output")).toHaveText("1,3")
  await page.getByRole("spinbutton", { name: "숫자 시작" }).fill("5")
  await expect(page.locator("output")).toHaveText("3")
  await page.getByRole("spinbutton", { name: "숫자 끝" }).fill("1")
  await expect(page.getByRole("alert")).toContainText("범위")
  await expect(page.locator("output")).toHaveText("")
  await page.getByRole("button", { name: "초기화" }).click()
  await expect(page.locator("output")).toHaveText("1,2,3")
  await page.getByRole("button", { name: "팀", exact: true }).click()
  await page.getByRole("checkbox", { name: "팀 B" }).check()
  await expect(page.locator("output")).toHaveText("3")
})
test("chart kinds expose the underlying values as a readable table", async ({
  page,
}) => {
  await page.goto("/fixtures/parts/index.html?part=chart")
  for (const kind of ["bar", "line", "area"]) {
    await page.getByRole("combobox", { name: "차트 종류" }).selectOption(kind)
    await expect(page.getByRole("img", { name: "전달한 수치" })).toBeVisible()
  }
  await page.getByText("데이터 표 보기", { exact: true }).click()
  await expect(page.getByRole("table")).toContainText("-2")
  await expect(page.getByRole("table")).toContainText("—")
})
test("step form validates before advancing and keeps data after server rejection", async ({
  page,
}) => {
  await page.goto("/fixtures/parts/index.html?part=wizard")
  await page.getByRole("button", { name: "다음", exact: true }).click()
  await expect(page.getByText("값을 입력하세요")).toBeVisible()
  await page.getByLabel("값", { exact: true }).fill("보존할 값")
  await page.getByRole("button", { name: "다음", exact: true }).click()
  await page.getByRole("spinbutton", { name: "숫자", exact: true }).fill("3")
  await page.getByRole("button", { name: "완료", exact: true }).click()
  await expect(page.getByRole("alert")).toHaveText("서버 검증 실패")
  await expect(page.getByLabel("값", { exact: true })).toHaveValue("보존할 값")
  await page.getByRole("button", { name: "다음", exact: true }).click()
  await expect(
    page.getByRole("spinbutton", { name: "숫자", exact: true })
  ).toHaveValue("3")
  await page.getByRole("button", { name: "완료", exact: true }).click()
  await expect(page.locator("output")).toHaveText("완료")
})
test("date ranges preserve invalid input for correction and apply calendar presets", async ({
  page,
}) => {
  await page.goto("/fixtures/parts/index.html?part=date-range")
  await page.getByLabel("기간 시작일").fill("2026-11-10")
  await page.getByLabel("기간 종료일").fill("2026-11-01")
  await expect(page.getByRole("alert")).toContainText("종료일")
  await page.getByRole("button", { name: "최근 7일" }).click()
  await expect(page.locator("output")).toHaveText(
    '{"from":"2026-10-29","to":"2026-11-04"}'
  )
  await page.getByRole("button", { name: "초기화" }).click()
  await expect(page.locator("output")).toHaveText("{}")
})
test("timeline displays caller order, action slots and an empty state", async ({
  page,
}) => {
  await page.goto("/fixtures/parts/index.html?part=timeline")
  await expect(
    page.getByRole("list", { name: "진행 기록" }).getByRole("listitem")
  ).toHaveCount(3)
  await page.getByRole("button", { name: "슬롯 동작" }).click()
  await expect(page.locator("output")).toHaveText("1")
  await page.getByRole("button", { name: "비우기" }).click()
  await expect(page.getByText("표시할 기록이 없습니다")).toBeVisible()
})
test("CSV validates, previews, preserves failed imports and exports protected values", async ({
  page,
}) => {
  await page.goto("/fixtures/parts/index.html?part=csv")
  const file = page.getByLabel("CSV 파일")
  await file.setInputFiles({
    name: "invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("a,a\nx,y"),
  })
  await expect(page.getByRole("alert")).toContainText("헤더")
  await file.setInputFiles({
    name: "values.csv",
    mimeType: "text/csv",
    buffer: Buffer.from('a,b\n"값, A",1\nB,2'),
  })
  await expect(page.getByRole("table")).toContainText("값, A")
  await page.getByRole("button", { name: "2행 가져오기" }).click()
  await expect(page.getByRole("alert")).toHaveText("검증 실패")
  await expect(page.getByRole("table")).toBeVisible()
  await page.getByRole("button", { name: "2행 가져오기" }).click()
  await expect(page.locator("output")).toHaveText("전달 2행")
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "CSV 내보내기" }).click(),
  ])
  expect(download.suggestedFilename()).toBe("part-data.csv")
  const path = await download.path()
  expect(path).toBeTruthy()
  const content = await readFile(path!, "utf8")
  expect(content).toContain("'=A1")
  expect(content).toContain("-2")
})
test("new parts stay within narrow layouts without APIs or runtime errors", async ({
  page,
}, info) => {
  const errors: string[] = [],
    calls: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/"))
      calls.push(request.url())
  })
  for (const name of [
    "advanced-table",
    "filters",
    "chart",
    "wizard",
    "date-range",
    "timeline",
    "csv",
  ]) {
    await page.goto(
      `/fixtures/parts/index.html?part=${name}${info.project.name.includes("dark") ? "&theme=dark" : ""}`
    )
    await expect(
      page.getByRole("heading", { name: `부품 검증: ${name}` })
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({
      path: info.outputPath(`${name}.png`),
      fullPage: true,
      animations: "disabled",
    })
  }
  expect(errors).toEqual([])
  expect(calls).toEqual([])
})

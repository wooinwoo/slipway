import { expect, test, type Page } from "@playwright/test"

async function part(page: Page, name: string, dark: boolean) {
  await page.goto(
    `/fixtures/parts/index.html?part=${name}${dark ? "&theme=dark" : ""}`
  )
}

test("table pagination, selection and shrinking rows", async ({
  page,
}, info) => {
  await part(page, "table", info.project.name.includes("dark"))
  await page.getByRole("button", { name: "다음 페이지" }).click()
  await page.getByRole("button", { name: "값 3", exact: true }).click()
  await expect(page.locator("output")).toHaveText("값 3")
  await page.getByRole("button", { name: "행 줄이기" }).click()
  await expect(
    page.getByRole("button", { name: "값 1", exact: true })
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "다음 페이지" })).toBeDisabled()
})
test("form keeps draft and field errors across a failed callback", async ({
  page,
}, info) => {
  await part(page, "form", info.project.name.includes("dark"))
  await page.getByLabel("값", { exact: true }).fill("실패")
  await page.getByLabel("메모").fill("남겨둘 입력")
  await page.getByRole("button", { name: "저장", exact: true }).click()
  await expect(page.getByRole("alert")).toHaveText("검증 실패")
  await expect(page.getByText("다른 값을 입력하세요")).toBeVisible()
  await expect(page.getByLabel("메모")).toHaveValue("남겨둘 입력")
  await page.getByLabel("값", { exact: true }).fill("성공")
  await page.getByRole("button", { name: "저장", exact: true }).click()
  await expect(page.locator("output")).toHaveText("저장 완료")
})
test("details is controlled by caller state and action slot", async ({
  page,
}, info) => {
  await part(page, "details", info.project.name.includes("dark"))
  await page.getByRole("button", { name: "열기" }).click()
  await expect(page.getByRole("dialog")).toContainText("선택한 값")
  await page.getByRole("button", { name: "작업 완료" }).click()
  await expect(page.getByRole("dialog")).not.toBeVisible()
})
test("board change invokes the caller without a backend", async ({
  page,
}, info) => {
  await part(page, "board", info.project.name.includes("dark"))
  await page.getByRole("combobox").click()
  await page.getByRole("option", { name: "그룹 B", exact: true }).click()
  await expect(page.getByRole("region", { name: "그룹 B 보드" })).toContainText(
    "값 A"
  )
})
test("file validation rejects an entire batch and permits retry and removal", async ({
  page,
}, info) => {
  await part(page, "files", info.project.name.includes("dark"))
  const input = page.getByLabel("파일 선택", { exact: true })
  await input.setInputFiles({
    name: "one.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("one"),
  })
  await input.setInputFiles({
    name: "large.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(1025),
  })
  await expect(page.getByRole("alert")).toContainText("크기")
  await expect(page.getByRole("button", { name: "one.pdf 제거" })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "large.pdf 제거" })
  ).toHaveCount(0)
  await input.setInputFiles({
    name: "wrong.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("wrong"),
  })
  await expect(page.getByRole("alert")).toContainText("형식")
  await input.setInputFiles([
    {
      name: "two.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("two"),
    },
    {
      name: "three.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("three"),
    },
  ])
  await expect(page.getByRole("alert")).toContainText("최대 2개")
  await expect(page.getByRole("button", { name: "two.pdf 제거" })).toHaveCount(
    0
  )
  await input.setInputFiles({
    name: "two.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("two"),
  })
  await expect(page.getByRole("alert")).toHaveCount(0)
  await page.getByRole("button", { name: "one.pdf 제거" }).click()
  await expect(page.getByRole("button", { name: "one.pdf 제거" })).toHaveCount(
    0
  )
})
test("async states show loading, retry and empty action independently", async ({
  page,
}, info) => {
  await part(page, "async-state", info.project.name.includes("dark"))
  await expect(page.getByRole("status")).toBeVisible()
  await page.getByRole("button", { name: "error", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText("검증 오류")
  await page.getByRole("button", { name: "다시 시도" }).click()
  await expect(page.getByText("콘텐츠 준비 완료")).toBeVisible()
  await page.getByRole("button", { name: "empty", exact: true }).click()
  await page.getByRole("button", { name: "추가", exact: true }).click()
  await expect(page.getByText("콘텐츠 준비 완료")).toBeVisible()
})
test("confirmation keeps errors open and retries without double execution", async ({
  page,
}, info) => {
  await part(page, "confirm", info.project.name.includes("dark"))
  await page.getByRole("button", { name: "실행", exact: true }).click()
  await page.getByRole("button", { name: "확인", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "취소", exact: true })
  ).toBeDisabled()
  await expect(page.getByRole("alert")).toHaveText("검증 실패")
  await expect(page.locator("output")).toHaveText("실행 횟수 1")
  await page.getByRole("button", { name: "확인", exact: true }).click()
  await expect(page.getByRole("alertdialog")).not.toBeVisible()
  await expect(page.locator("output")).toHaveText("실행 횟수 2")
})
test("Korean controlled inputs format values without a form or router", async ({
  page,
}, info) => {
  await part(page, "kr-inputs", info.project.name.includes("dark"))
  await page.getByLabel("전화번호").fill("01012345678")
  await expect(page.getByLabel("전화번호")).toHaveValue("010-1234-5678")
  await page.getByLabel("사업자번호").fill("1234567890")
  await expect(page.getByLabel("사업자번호")).toHaveValue("123-45-67890")
  await page.getByLabel("금액").fill("1234000")
  await expect(page.getByLabel("금액")).toHaveValue("1,234,000")
})
test("parts render at desktop and narrow widths without app routes or API requests", async ({
  page,
}, info) => {
  const requests: string[] = [],
    errors: string[] = []
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/"))
      requests.push(request.url())
  })
  page.on("pageerror", (error) => errors.push(error.message))
  for (const name of [
    "table",
    "form",
    "details",
    "board",
    "metrics",
    "files",
    "async-state",
    "confirm",
    "kr-inputs",
  ]) {
    await part(page, name, info.project.name.includes("dark"))
    await expect(
      page.getByRole("heading", { name: `부품 검증: ${name}` })
    ).toBeVisible()
    if (name === "details") {
      await page.getByRole("button", { name: "열기", exact: true }).click()
      await page.getByRole("dialog").waitFor()
    }
    if (name === "confirm") {
      await page.getByRole("button", { name: "실행", exact: true }).click()
      await page.getByRole("alertdialog").waitFor()
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({
      path: info.outputPath(`${name}.png`),
      fullPage: true,
    })
  }
  expect(requests).toEqual([])
  expect(errors).toEqual([])
})

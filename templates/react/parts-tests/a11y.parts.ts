import { expect, test } from "@playwright/test"

import {
  accessibilityIssues,
  cursorIssues,
  focusIssues,
  overflowIssues,
} from "../scripts/ui-checks.mjs"

// Every part, in light (desktop project) and dark (mobile project): WCAG 2.1 A/AA (contrast included),
// no sideways scrolling, the pointer cursor on everything clickable, and a visible keyboard focus.
const parts = [
  "table",
  "form",
  "details",
  "board",
  "metrics",
  "files",
  "async-state",
  "confirm",
  "kr-inputs",
  "advanced-table",
  "filters",
  "chart",
  "wizard",
  "date-range",
  "timeline",
  "csv",
  "login",
  "signup",
  "shell",
  "theme-settings",
]

for (const name of parts) {
  test(`${name}: accessible, focus visible, pointer on clickables`, async ({
    page,
  }, info) => {
    const dark = info.project.name.includes("dark")
    await page.goto(
      `/fixtures/parts/index.html?part=${name}${dark ? "&theme=dark" : ""}`
    )
    await expect(
      page.getByRole("heading", { name: `부품 검증: ${name}` })
    ).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    expect([
      ...(await accessibilityIssues(page)),
      ...(await overflowIssues(page)),
      ...(await cursorIssues(page)),
      ...(await focusIssues(page)),
    ]).toEqual([])
  })
}

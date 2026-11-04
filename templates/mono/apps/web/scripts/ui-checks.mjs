// Browser checks shared by `pnpm check:ui` and the part tests. Each returns a list of problems.
import AxeBuilder from "@axe-core/playwright"

/** WCAG 2.1 A/AA issues rated serious or critical (color contrast, names, labels, structure). */
export async function accessibilityIssues(page) {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
  return violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`)
}

/** How far the page scrolls sideways, in pixels (0 when it fits the viewport). */
export async function overflowIssues(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  return overflow > 1 ? [`page scrolls sideways by ${overflow}px`] : []
}

/** Visible, enabled clickable elements that do not show the pointer cursor. */
export async function cursorIssues(page) {
  return page.evaluate(() => {
    const clickable = 'button, a[href], summary, select, label[for], [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="checkbox"], [role="radio"], [role="switch"], input[type="checkbox"], input[type="radio"], input[type="range"]'
    return [...document.querySelectorAll(clickable)]
      .filter((el) => {
        const box = el.getBoundingClientRect()
        const style = getComputedStyle(el)
        return box.width > 0 && box.height > 0 && style.visibility !== "hidden" && style.pointerEvents !== "none"
          && !el.matches(':disabled, [aria-disabled="true"], [data-disabled]')
          // Resize and drag handles (the sidebar rail) keep their own cursor on purpose.
          && !/pointer|resize|grab|move/.test(style.cursor)
      })
      .slice(0, 5)
      .map((el) => `no pointer cursor: <${el.tagName.toLowerCase()}> "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 30)}"`)
  })
}

/**
 * Tabs through the page and reports focus stops without a visible indicator (an outline or ring on the
 * element or a wrapper up to three levels up, as input groups draw it).
 */
export async function focusIssues(page, stops = 30) {
  const issues = []
  const seen = new Set()
  await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : undefined))
  // How each focusable element looks unfocused: a focus style may change the border or background
  // color instead of drawing an outline or ring (a filled input whose border turns the brand color).
  await page.evaluate(() => {
    const look = (node) => {
      const s = getComputedStyle(node)
      return `${s.borderTopColor} ${s.borderBottomColor} ${s.backgroundColor}`
    }
    window.__slipwayLook = look
    window.__slipwayUnfocused = new Map(
      [...document.querySelectorAll("a[href], button, input, select, textarea, summary, [tabindex]")].map((node) => [node, look(node)])
    )
  })
  for (let i = 0; i < stops; i++) {
    await page.keyboard.press("Tab")
    const stop = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      // A modal's focus guard (Radix, vaul) is an invisible stop that hands focus back inside the dialog.
      if (el.hasAttribute("data-radix-focus-guard")) return { key: "guard", guard: true }
      const shows = (node) => {
        const s = getComputedStyle(node)
        return (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || (s.boxShadow !== "none" && s.boxShadow !== "")
      }
      const before = window.__slipwayUnfocused?.get(el)
      let visible = before !== undefined && before !== window.__slipwayLook(el)
      for (let node = el, depth = 0; node instanceof Element && depth < 4; node = node.parentElement, depth++) {
        if (shows(node)) {
          visible = true
          break
        }
      }
      const name = (el.getAttribute("aria-label") ?? el.textContent ?? el.getAttribute("name") ?? "").trim().slice(0, 30)
      return { key: `${el.tagName}|${name}|${el.id}`, name: `<${el.tagName.toLowerCase()}> "${name}"`, visible }
    })
    if (stop?.guard) continue
    if (!stop || seen.has(stop.key)) break
    seen.add(stop.key)
    if (!stop.visible) issues.push(`no visible focus: ${stop.name}`)
  }
  return issues
}

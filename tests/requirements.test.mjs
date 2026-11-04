import assert from "node:assert/strict"
import test from "node:test"
import { checkRequirements } from "../templates/react/scripts/check-reqs.mjs"

test("requires a declared requirement, route, and named browser test", () => {
  assert.deepEqual(checkRequirements("## REQ-1 로그인", ["// REQ-1 로그인"], 'test("REQ-1 login", () => {})'), { count: 1, errors: [] })
  assert.deepEqual(checkRequirements("", [], ""), { count: 0, errors: [] })
  assert.equal(checkRequirements("## REQ-1 로그인", [], "").errors.length, 2)
})

test("rejects duplicate requirements and references to missing requirements", () => {
  const result = checkRequirements("## REQ-1 A\n## REQ-1 B", ["// REQ-1 A\n// REQ-2 typo"], 'test("REQ-1 A", () => {})')
  assert.ok(result.errors.includes("REQ-1: duplicate requirement"))
  assert.ok(result.errors.includes("REQ-2: referenced but not declared"))
})

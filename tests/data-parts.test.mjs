import assert from "node:assert/strict"
import test from "node:test"
import { sortRows, togglePageSelection } from "../templates/react/src/lib/table-model.ts"
import { isDateOnly, validateDateRange, dateRangePresets } from "../templates/react/src/lib/date-range.ts"
import { normalizeChartData } from "../templates/react/src/lib/chart-model.ts"
import { parseCsv, stringifyCsv } from "../templates/react/src/lib/csv.ts"

test("stable numeric sorting keeps missing values last in both directions", () => {
  const rows = [{ id: "a", n: 2 }, { id: "b", n: null }, { id: "c", n: 2 }, { id: "d", n: -4 }, { id: "e", n: NaN }]
  assert.deepEqual(sortRows(rows, row => row.n, "asc").map(row => row.id), ["d", "a", "c", "b", "e"])
  assert.deepEqual(sortRows(rows, row => row.n, "desc").map(row => row.id), ["a", "c", "d", "b", "e"])
  assert.deepEqual(rows.map(row => row.id), ["a", "b", "c", "d", "e"])
  assert.deepEqual(sortRows(["값 10", "값 2"], row => row, "asc"), ["값 2", "값 10"])
})
test("page selection preserves other pages and never duplicates IDs", () => {
  assert.deepEqual(togglePageSelection(["a", "x"], ["a", "b"], true), ["a", "x", "b"])
  assert.deepEqual(togglePageSelection(["a", "x", "b"], ["a", "b"], false), ["x"])
})
test("date-only validation respects leap days and rejects reversed intervals", () => {
  assert.equal(isDateOnly("2024-02-29"), true)
  for (const value of ["2025-02-29", "2026-13-01", "2026-04-31", "2026-1-01", "not-a-date"]) assert.equal(isDateOnly(value), false)
  assert.equal(validateDateRange({}), undefined)
  assert.equal(validateDateRange({ from: "2026-11-04" }), undefined)
  assert.match(validateDateRange({ from: "2026-11-04", to: "2026-11-01" }), /종료일/)
})
test("date presets cross month and year boundaries without UTC day shifts", () => {
  const presets = dateRangePresets(new Date(2026, 0, 3, 0, 15))
  assert.deepEqual(presets[0].range, { from: "2026-01-03", to: "2026-01-03" })
  assert.deepEqual(presets[1].range, { from: "2025-12-28", to: "2026-01-03" })
  assert.deepEqual(presets[2].range, { from: "2026-01-01", to: "2026-01-03" })
})
test("charts preserve zero and negatives and treat non-numeric values as gaps", () => {
  const source = [{ x: "A", n: 0 }, { x: "B", n: -3 }, { x: "C", n: Infinity }, { x: "D", n: "5" }]
  assert.deepEqual(normalizeChartData(source, "x", [{ key: "n", label: "값" }]), [{ x: "A", n: 0 }, { x: "B", n: -3 }, { x: "C", n: null }, { x: "D", n: null }])
  assert.equal(source[2].n, Infinity)
})
test("CSV reads BOM, quoted commas, escaped quotes, CRLF and multiline cells", () => {
  const parsed = parseCsv('\uFEFFname,note\r\n"이름, A","첫 줄\r\n둘째 줄 ""인용"""\r\n')
  assert.deepEqual(parsed, { headers: ["name", "note"], rows: [["이름, A", '첫 줄\r\n둘째 줄 "인용"']] })
  assert.deepEqual(parseCsv('value\n""\n').rows, [[""]])
  assert.deepEqual(parseCsv("a,b\n\nx,\n\n").rows, [["x", ""]])
})
test("CSV rejects malformed quoting, duplicate headers and mismatched rows", () => {
  for (const value of ['a\n"unfinished', 'a\n"x"bad', 'a\nx"y', "a,a\nx,y", "a,\nx,y", "a,b\nx", ""]) assert.throws(() => parseCsv(value))
  assert.throws(() => parseCsv("a\nx\ny", { maxRows: 1 }), /행 제한/)
  assert.throws(() => parseCsv("a,b", { maxColumns: 1 }), /열 제한/)
  assert.throws(() => parseCsv("a\nx", { maxChars: 2 }), /너무 큽니다/)
})
test("CSV exports spreadsheet-safe strings while keeping numeric negatives", () => {
  const columns = [{ key: "s", label: "값", value: row => row.s }, { key: "n", label: "숫자", value: row => row.n }]
  const output = stringifyCsv(columns, [{ s: " \t=SUM(A1)", n: -2 }, { s: '쉼표, "인용"\n다음', n: 0 }])
  assert.ok(output.startsWith("\uFEFF"))
  const parsed = parseCsv(output)
  assert.equal(parsed.rows[0][0], "' \t=SUM(A1)")
  assert.equal(parsed.rows[0][1], "-2")
  assert.equal(parsed.rows[1][0], '쉼표, "인용"\n다음')
  assert.deepEqual(parseCsv(stringifyCsv(columns, [{ s: "+raw", n: null }], { delimiter: ";", protectFormulas: false }), { delimiter: ";" }).rows, [["+raw", ""]])
  assert.deepEqual(parseCsv(stringifyCsv([{ key: "s", label: "값", value: row => row.s }], [{ s: "" }, { s: null }])).rows, [[""], [""]])
})

import { describe, expect, it } from "vitest"
import { applyFilters, validateFilters, type FilterField } from "./filter-model"

const fields: FilterField[] = [
  { id: "name", label: "이름", type: "text" },
  { id: "group", label: "분류", type: "select" },
  { id: "team", label: "팀", type: "multi" },
  { id: "count", label: "개수", type: "number-range" },
  { id: "date", label: "날짜", type: "date-range" },
]
const rows = [
  { name: "Alpha", group: "a", team: "x", count: 0, date: "2024-02-29" },
  { name: "Beta", group: "b", team: "y", count: -2, date: "2024-03-01" },
  { name: "Gamma", group: "a", team: "z", count: 5, date: "2024-03-02" },
]
const read = (row: (typeof rows)[number], key: string) =>
  row[key as keyof typeof row]

describe("local filter predicates", () => {
  it("combines fields with AND and multi selections with OR without changing rows", () => {
    expect(
      applyFilters(
        rows,
        fields,
        { group: "a", team: ["x", "z"], count: { min: "0", max: "2" } },
        read
      )
    ).toEqual([rows[0]])
    expect(applyFilters(rows, fields, { name: " ALP " }, read)).toEqual([
      rows[0],
    ])
    expect(
      applyFilters(
        rows,
        fields,
        { date: { min: "2024-02-29", max: "2024-03-01" } },
        read
      )
    ).toEqual(rows.slice(0, 2))
    expect(rows).toHaveLength(3)
  })
  it("rejects impossible dates, reversed ranges and non-finite numbers", () => {
    for (const range of [
      { min: "2025-02-29" },
      { min: "2024-03-02", max: "2024-03-01" },
    ]) {
      expect(validateFilters(fields, { date: range }).date).toBeTruthy()
      expect(applyFilters(rows, fields, { date: range }, read)).toEqual([])
    }
    for (const range of [
      { min: "NaN" },
      { max: "Infinity" },
      { min: "2", max: "-1" },
    ])
      expect(validateFilters(fields, { count: range }).count).toBeTruthy()
  })
  it("ignores blank ranges and excludes missing values from active ranges", () => {
    expect(
      applyFilters(rows, fields, { count: { min: "  " }, team: [] }, read)
    ).toEqual(rows)
    expect(
      applyFilters(
        [{ count: null }, { count: "" }, { count: -1 }, { count: 0 }],
        fields,
        { count: { min: "0" } },
        (row, key) => row[key as "count"]
      )
    ).toEqual([{ count: 0 }])
  })
})

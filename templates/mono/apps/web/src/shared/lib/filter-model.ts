import { isDateOnly } from "./date-range"
export type FilterOption = { value: string; label: string }
export type FilterField = {
  id: string
  label: string
  type: "text" | "select" | "multi" | "number-range" | "date-range"
  options?: readonly FilterOption[]
}
export type FilterValue = string | string[] | { min?: string; max?: string }
export type FilterValues = Record<string, FilterValue | undefined>

export function isActiveFilter(value: FilterValue | undefined): boolean {
  return typeof value === "string"
    ? !!value.trim()
    : Array.isArray(value)
      ? value.length > 0
      : !!(value?.min?.trim() || value?.max?.trim())
}
export function validateFilters(
  fields: readonly FilterField[],
  values: FilterValues
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of fields) {
    const value = values[field.id]
    if (!value || typeof value === "string" || Array.isArray(value)) continue
    const min = value.min?.trim() ?? "",
      max = value.max?.trim() ?? ""
    if (
      field.type === "number-range" &&
      ((min && !Number.isFinite(Number(min))) ||
        (max && !Number.isFinite(Number(max))) ||
        (min && max && Number(min) > Number(max)))
    )
      errors[field.id] = "숫자 범위를 확인해 주세요"
    if (
      field.type === "date-range" &&
      ((min && !isDateOnly(min)) ||
        (max && !isDateOnly(max)) ||
        (min && max && min > max))
    )
      errors[field.id] = "날짜 범위를 확인해 주세요"
  }
  return errors
}
/** AND across fields, OR within a multi-select. The caller decides when to filter. */
export function applyFilters<T>(
  rows: readonly T[],
  fields: readonly FilterField[],
  values: FilterValues,
  read: (row: T, id: string) => unknown
): T[] {
  if (Object.keys(validateFilters(fields, values)).length) return []
  return rows.filter((row) =>
    fields.every((field) => {
      const value = values[field.id]
      if (!isActiveFilter(value)) return true
      const actual = read(row, field.id)
      if (Array.isArray(value)) return value.includes(String(actual ?? ""))
      if (typeof value === "string")
        return field.type === "text"
          ? String(actual ?? "")
              .toLocaleLowerCase()
              .includes(value.trim().toLocaleLowerCase())
          : String(actual ?? "") === value
      if (value && actual != null && actual !== "") {
        const min = value.min?.trim(),
          max = value.max?.trim()
        if (field.type === "number-range") {
          const number = Number(actual)
          return (
            Number.isFinite(number) &&
            (!min || number >= Number(min)) &&
            (!max || number <= Number(max))
          )
        }
        const date = String(actual).slice(0, 10)
        return (
          isDateOnly(date) && (!min || date >= min) && (!max || date <= max)
        )
      }
      return false
    })
  )
}

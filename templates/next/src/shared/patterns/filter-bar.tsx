"use client"

import { useId } from "react"
import { SlidersHorizontalIcon, XIcon } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Checkbox } from "@/shared/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import {
  isActiveFilter,
  validateFilters,
  type FilterField,
  type FilterValue,
  type FilterValues,
} from "@/shared/lib/filter-model"

export function FilterBar({
  fields,
  value,
  onChange,
}: {
  fields: readonly FilterField[]
  value: FilterValues
  onChange: (value: FilterValues) => void
}) {
  const prefix = useId(),
    errors = validateFilters(fields, value)
  const count = fields.filter((field) => isActiveFilter(value[field.id])).length
  function change(id: string, next: FilterValue) {
    const result = { ...value }
    if (isActiveFilter(next)) result[id] = next
    else delete result[id]
    onChange(result)
  }
  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <SlidersHorizontalIcon className="size-3.5" />
        <span>필터 {count ? `${count}개 적용` : ""}</span>
        {count > 0 && (
          <Button
            size="xs"
            variant="ghost"
            className="ml-auto"
            onClick={() => onChange({})}
          >
            <XIcon />
            초기화
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-start gap-4">
        {fields.map((field) => {
          const id = `${prefix}-${field.id}`,
            current = value[field.id]
          const range =
            typeof current === "object" && !Array.isArray(current)
              ? current
              : {}
          return (
            <div key={field.id} className="grid min-w-0 flex-1 basis-40 gap-2">
              <Label htmlFor={id}>{field.label}</Label>
              {field.type === "text" ? (
                <Input
                  id={id}
                  value={typeof current === "string" ? current : ""}
                  onChange={(event) => change(field.id, event.target.value)}
                />
              ) : field.type === "select" ? (
                <Select
                  value={
                    typeof current === "string" && current
                      ? JSON.stringify(current)
                      : "all"
                  }
                  onValueChange={(next) =>
                    change(
                      field.id,
                      next === "all" ? "" : (JSON.parse(next) as string)
                    )
                  }
                >
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {field.options?.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={JSON.stringify(option.value)}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "multi" ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id={id}
                      variant="outline"
                      className="justify-between"
                    >
                      {Array.isArray(current) && current.length
                        ? `${current.length}개 선택`
                        : "전체"}
                      <SlidersHorizontalIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="grid max-h-72 w-56 gap-3 overflow-y-auto">
                    {field.options?.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={
                            Array.isArray(current) &&
                            current.includes(option.value)
                          }
                          onCheckedChange={(checked) => {
                            const selected = Array.isArray(current)
                              ? current
                              : []
                            change(
                              field.id,
                              checked === true
                                ? [...selected, option.value]
                                : selected.filter(
                                    (item) => item !== option.value
                                  )
                            )
                          }}
                        />
                        {option.label}
                      </label>
                    ))}
                  </PopoverContent>
                </Popover>
              ) : (
                <div
                  className={
                    field.type === "date-range"
                      ? "grid min-w-0 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]"
                      : "flex min-w-0 items-center gap-2"
                  }
                >
                  <Input
                    id={id}
                    aria-label={`${field.label} 시작`}
                    type={field.type === "date-range" ? "date" : "number"}
                    value={range.min ?? ""}
                    onChange={(event) =>
                      change(field.id, { ...range, min: event.target.value })
                    }
                    aria-invalid={!!errors[field.id]}
                  />
                  <span
                    aria-hidden
                    className={
                      field.type === "date-range"
                        ? "hidden sm:block"
                        : undefined
                    }
                  >
                    –
                  </span>
                  <Input
                    aria-label={`${field.label} 끝`}
                    type={field.type === "date-range" ? "date" : "number"}
                    value={range.max ?? ""}
                    onChange={(event) =>
                      change(field.id, { ...range, max: event.target.value })
                    }
                    aria-invalid={!!errors[field.id]}
                  />
                </div>
              )}
              {errors[field.id] && (
                <p role="alert" className="text-xs text-destructive">
                  {errors[field.id]}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

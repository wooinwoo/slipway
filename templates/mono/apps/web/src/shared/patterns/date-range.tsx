import { useId } from "react"
import { CalendarDaysIcon } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
  dateRangePresets,
  validateDateRange,
  type DateRangeValue,
} from "@/shared/lib/date-range"

export function DateRangePicker({
  value,
  onChange,
  label = "기간",
  presets = dateRangePresets(),
  disabled = false,
}: {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  label?: string
  presets?: { label: string; range: DateRangeValue }[]
  disabled?: boolean
}) {
  const id = useId(),
    error = validateDateRange(value)
  return (
    <fieldset
      disabled={disabled}
      className="grid min-w-0 gap-3 rounded-xl border bg-card p-4"
    >
      <legend className="sr-only">{label}</legend>
      <Label htmlFor={`${id}-from`} className="flex items-center gap-2">
        <CalendarDaysIcon className="size-4" />
        {label}
      </Label>
      <div className="grid min-w-0 gap-2 sm:grid-cols-[1fr_auto_1fr]">
        <Input
          id={`${id}-from`}
          type="date"
          aria-label={`${label} 시작일`}
          value={value.from ?? ""}
          onChange={(event) =>
            onChange({ ...value, from: event.target.value || undefined })
          }
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span className="hidden self-center text-muted-foreground sm:block">
          –
        </span>
        <Input
          type="date"
          aria-label={`${label} 종료일`}
          value={value.to ?? ""}
          onChange={(event) =>
            onChange({ ...value, to: event.target.value || undefined })
          }
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            type="button"
            key={preset.label}
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...preset.range })}
          >
            {preset.label}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onChange({})}
        >
          초기화
        </Button>
      </div>
    </fieldset>
  )
}

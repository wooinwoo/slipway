"use client"

import { useId, useState } from "react"
import type { ReactNode } from "react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"

export type Option = { value: string; label: string }
export type RecordField<T> = {
  key: Extract<keyof T, string>
  label: string
  type?: "text" | "email" | "tel" | "textarea"
  placeholder?: string
  options?: readonly Option[]
  wide?: boolean
  render?: (
    value: string,
    onChange: (value: string) => void,
    id: string
  ) => ReactNode
}
export type FormFailure = { message: string; fields?: Record<string, string> }

/** Only owns draft UI. The recipe supplies validation and persistence. */
export function RecordForm<T extends Record<string, string>>({
  initial,
  fields,
  submit,
  cancel,
  submitLabel = "저장",
}: {
  initial: T
  fields: RecordField<T>[]
  submit: (values: T) => Promise<FormFailure | undefined>
  cancel: () => void
  submitLabel?: string
}) {
  const prefix = useId()
  const [draft, setDraft] = useState(initial)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<FormFailure>()
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault()
        if (pending) return
        setPending(true)
        setError(undefined)
        try {
          setError(await submit(draft))
        } catch {
          setError({
            message:
              "저장하지 못했습니다. 입력값을 확인하고 다시 시도해 주세요.",
          })
        } finally {
          setPending(false)
        }
      }}
    >
      <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => {
          const id = `${prefix}-${field.key}`
          const invalid = error?.fields?.[field.key]
          const change = (value: string) =>
            setDraft((prev) => ({ ...prev, [field.key]: value }))
          return (
            <div
              key={field.key}
              className={field.wide ? "grid gap-2 sm:col-span-2" : "grid gap-2"}
            >
              <Label htmlFor={id}>{field.label}</Label>
              {field.render ? (
                field.render(draft[field.key], change, id)
              ) : field.options ? (
                <Select value={draft[field.key]} onValueChange={change}>
                  <SelectTrigger
                    id={id}
                    className="w-full"
                    aria-invalid={!!invalid}
                    aria-describedby={invalid ? `${id}-error` : undefined}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "textarea" ? (
                <Textarea
                  id={id}
                  value={draft[field.key]}
                  onChange={(e) => change(e.target.value)}
                  placeholder={field.placeholder}
                  aria-invalid={!!invalid}
                  aria-describedby={invalid ? `${id}-error` : undefined}
                  rows={4}
                />
              ) : (
                <Input
                  id={id}
                  type={field.type ?? "text"}
                  value={draft[field.key]}
                  onChange={(e) => change(e.target.value)}
                  placeholder={field.placeholder}
                  aria-invalid={!!invalid}
                  aria-describedby={invalid ? `${id}-error` : undefined}
                />
              )}
              {invalid && (
                <p id={`${id}-error`} className="text-xs text-destructive">
                  {invalid}
                </p>
              )}
            </div>
          )
        })}
      </fieldset>
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error.message}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-2 border-t pt-5">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={cancel}
        >
          취소
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

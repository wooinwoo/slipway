import { useState } from "react"
import type { ReactNode } from "react"
import { CheckIcon } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Spinner } from "@/shared/ui/spinner"

export type StepFailure = {
  message: string
  fields?: Partial<Record<string, string>>
  stepId?: string
}
export type StepContext<T> = {
  values: T
  change: <K extends keyof T>(key: K, value: T[K]) => void
  errors: Partial<Record<string, string>>
  pending: boolean
}
export type FormStep<T> = {
  id: string
  title: string
  description?: string
  render: (context: StepContext<T>) => ReactNode
  validate?: (
    values: T
  ) =>
    | Partial<Record<string, string>>
    | void
    | Promise<Partial<Record<string, string>> | void>
}

export function StepForm<T extends object>({
  initial,
  steps,
  submit,
  cancel,
  completeLabel = "완료",
}: {
  initial: T
  steps: FormStep<T>[]
  submit: (values: T) => Promise<StepFailure | void>
  cancel?: () => void
  completeLabel?: string
}) {
  const [values, setValues] = useState(initial),
    [index, setIndex] = useState(0)
  const [pending, setPending] = useState(false),
    [failure, setFailure] = useState<StepFailure>()
  const current = Math.min(index, steps.length - 1),
    step = steps[current]
  if (!step)
    return (
      <p className="text-sm text-muted-foreground">등록된 단계가 없습니다</p>
    )
  return (
    <form
      className="grid min-w-0 gap-6"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault()
        if (pending) return
        setPending(true)
        setFailure(undefined)
        try {
          const fields = await step.validate?.(values)
          if (fields && Object.values(fields).some(Boolean)) {
            setFailure({ message: "입력값을 확인해 주세요", fields })
            return
          }
          if (current < steps.length - 1) {
            setIndex(current + 1)
            return
          }
          const result = await submit(values)
          if (result) {
            setFailure(result)
            if (result.stepId) {
              const target = steps.findIndex(
                (item) => item.id === result.stepId
              )
              if (target >= 0) setIndex(target)
            }
          }
        } catch (error) {
          setFailure({
            message:
              error instanceof Error
                ? error.message
                : "처리하지 못했습니다. 다시 시도해 주세요.",
          })
        } finally {
          setPending(false)
        }
      }}
    >
      <ol
        aria-label="진행 단계"
        className="flex flex-wrap gap-x-5 gap-y-3 border-b pb-5"
      >
        {steps.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              aria-current={i === current ? "step" : undefined}
              disabled={pending || i > current}
              className={`inline-flex items-center gap-2 text-xs ${i === current ? "font-medium text-foreground" : "text-muted-foreground"}`}
              onClick={() => {
                setIndex(i)
                setFailure(undefined)
              }}
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full border ${i === current ? "border-primary bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                {i < current ? <CheckIcon className="size-3" /> : i + 1}
              </span>
              {item.title}
            </button>
          </li>
        ))}
      </ol>
      <div>
        <h2 className="text-lg font-semibold">{step.title}</h2>
        {step.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {step.description}
          </p>
        )}
      </div>
      <fieldset disabled={pending} className="grid gap-4">
        {step.render({
          values,
          change: (key, value) =>
            setValues((previous) => ({ ...previous, [key]: value })),
          errors: failure?.fields ?? {},
          pending,
        })}
      </fieldset>
      {failure && (
        <p role="alert" className="text-sm text-destructive">
          {failure.message}
        </p>
      )}
      <div className="flex items-center gap-2 border-t pt-5">
        {cancel && (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={cancel}
          >
            취소
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending || current === 0}
            onClick={() => {
              setIndex(current - 1)
              setFailure(undefined)
            }}
          >
            이전
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Spinner />}
            {current === steps.length - 1 ? completeLabel : "다음"}
          </Button>
        </div>
      </div>
    </form>
  )
}

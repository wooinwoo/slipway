"use client"

import { useId, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

/** Same shape as an API error: a message plus per-field messages. */
export type AuthFailure = { message: string; fields?: Record<string, string> }
export type LoginValues = { email: string; password: string }
export type SignupValues = { name: string; email: string; password: string }
export type SocialProvider = "kakao" | "naver"

/** Frame for sign-in content. The page decides where it sits. */
export function AuthCard({
  title,
  description,
  footer,
  children,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("w-full max-w-sm", className)}>
      <div className="rounded-2xl border bg-card p-6 shadow-xs sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-balance">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-7 grid gap-5">{children}</div>
      </div>
      {footer && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </p>
      )}
    </div>
  )
}

export function AuthDivider({ children = "또는" }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {children}
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

const providers = {
  kakao: {
    label: "카카오로 계속하기",
    className: "bg-[#FEE500] text-[#191919]",
    icon: "M12 3C6.48 3 2 6.58 2 11c0 2.83 1.88 5.32 4.71 6.74l-.96 3.53c-.08.31.27.56.54.38l4.2-2.78c.5.06 1 .1 1.51.1 5.52 0 10-3.58 10-8S17.52 3 12 3Z",
  },
  naver: {
    label: "네이버로 계속하기",
    // Naver's white button variant: white text on #03C75A is below WCAG AA contrast.
    className: "border bg-background text-foreground [&_svg]:text-[#03C75A]",
    icon: "M16.27 12.84 7.38 0H0v24h7.73V11.16L16.62 24H24V0h-7.73z",
  },
} as const

/** Kakao and Naver buttons in their brand colors. `pending` marks the provider in progress. */
export function SocialButtons({
  onSelect,
  pending,
  only = ["kakao", "naver"],
}: {
  onSelect: (provider: SocialProvider) => void
  pending?: SocialProvider | null
  only?: readonly SocialProvider[]
}) {
  return (
    <div className="grid gap-2">
      {only.map((id) => {
        const provider = providers[id]
        return (
          <button
            key={id}
            type="button"
            disabled={!!pending}
            onClick={() => onSelect(id)}
            className={cn(
              "relative flex h-11 w-full items-center justify-center rounded-lg text-sm font-medium transition-[filter] outline-offset-2 hover:brightness-95 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60",
              provider.className
            )}
          >
            <span className="absolute left-4 flex size-4 items-center justify-center">
              {pending === id ? (
                <Spinner />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className={id === "naver" ? "size-3.5" : "size-[18px]"}
                  aria-hidden
                >
                  <path fill="currentColor" d={provider.icon} />
                </svg>
              )}
            </span>
            {provider.label}
          </button>
        )
      })}
    </div>
  )
}

export function GuestButton({
  onClick,
  pending,
  children = "가입 없이 둘러보기",
}: {
  onClick: () => void
  pending?: boolean
  children?: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full"
      disabled={pending}
      onClick={onClick}
    >
      {pending && <Spinner />}
      {children}
    </Button>
  )
}

type Field<T> = {
  key: Extract<keyof T, string>
  label: string
  type: "text" | "email" | "password"
  autoComplete: string
  hint?: string
}

/** Draft, pending and error state shared by the login and signup forms. */
function CredentialsForm<T extends Record<string, string>>({
  initial,
  fields,
  submit,
  submitLabel,
  extra,
}: {
  initial: T
  fields: Field<T>[]
  submit: (values: T) => Promise<AuthFailure | undefined>
  submitLabel: string
  extra?: (fill: (values: T) => void) => ReactNode
}) {
  const prefix = useId()
  const [draft, setDraft] = useState(initial)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<AuthFailure>()
  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={async (event) => {
        event.preventDefault()
        if (pending) return
        setPending(true)
        setError(undefined)
        try {
          setError(await submit(draft))
        } catch {
          setError({ message: "잠시 후 다시 시도해 주세요." })
        } finally {
          setPending(false)
        }
      }}
    >
      <fieldset disabled={pending} className="grid gap-4">
        {fields.map((field) => {
          const id = `${prefix}-${field.key}`
          const invalid = error?.fields?.[field.key]
          const note = invalid ?? field.hint
          return (
            <div key={field.key} className="grid gap-2">
              <Label htmlFor={id}>{field.label}</Label>
              <Input
                id={id}
                type={field.type}
                autoComplete={field.autoComplete}
                className="h-10"
                value={draft[field.key]}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))
                }
                aria-invalid={!!invalid}
                aria-describedby={note ? `${id}-note` : undefined}
              />
              {note && (
                <p
                  id={`${id}-note`}
                  className={cn(
                    "text-xs",
                    invalid ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {note}
                </p>
              )}
            </div>
          )
        })}
      </fieldset>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          {error.message}
        </p>
      )}
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending && <Spinner />}
        {submitLabel}
      </Button>
      {extra?.((values) => {
        setDraft(values)
        setError(undefined)
      })}
    </form>
  )
}

/** Email login. `submit` signs in and returns a failure to show, or nothing on success. */
export function LoginForm({
  submit,
  demo,
}: {
  submit: (values: LoginValues) => Promise<AuthFailure | undefined>
  /** Shows a one-click fill for a demo account. */
  demo?: LoginValues
}) {
  return (
    <CredentialsForm<LoginValues>
      initial={{ email: "", password: "" }}
      submit={submit}
      submitLabel="로그인"
      fields={[
        { key: "email", label: "이메일", type: "email", autoComplete: "email" },
        { key: "password", label: "비밀번호", type: "password", autoComplete: "current-password" },
      ]}
      extra={
        demo &&
        ((fill) => (
          <button
            type="button"
            onClick={() => fill(demo)}
            className="justify-self-center rounded-sm text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            데모 계정으로 채우기
          </button>
        ))
      }
    />
  )
}

export function SignupForm({
  submit,
}: {
  submit: (values: SignupValues) => Promise<AuthFailure | undefined>
}) {
  return (
    <CredentialsForm<SignupValues>
      initial={{ name: "", email: "", password: "" }}
      submit={submit}
      submitLabel="가입하기"
      fields={[
        { key: "name", label: "이름", type: "text", autoComplete: "name" },
        { key: "email", label: "이메일", type: "email", autoComplete: "email" },
        { key: "password", label: "비밀번호", type: "password", autoComplete: "new-password", hint: "8자 이상" },
      ]}
    />
  )
}

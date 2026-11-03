// REQ-1 가입 없이 둘러보기 (login page button)
// REQ-2 이메일 로그인
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { loginSchema, meQuery, useGuestLogin, useLogin, useSocialLogin } from "@/api/auth"
import { BASE_URL } from "@/api/client"
import { AuthLayout, KakaoButton, NaverButton } from "@/components/auth-layout"
import { FormField } from "@/components/form-field"
import { Button } from "@/components/ui/button"
import { FieldGroup, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { isDemo } from "@/config"

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  beforeLoad: async ({ context }) => {
    if (await context.queryClient.ensureQueryData(meQuery).catch(() => null)) throw redirect({ to: "/home" })
  },
  component: LoginPage,
})

function LoginPage() {
  const { redirect: next } = Route.useSearch()
  const router = useRouter()
  const done = () => router.history.push(next ?? "/home")
  const onError = (error: Error) => toast.error(error.message)

  const login = useLogin()
  const guest = useGuestLogin()
  const social = useSocialLogin()
  const form = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } })

  function socialLogin(provider: "kakao" | "naver") {
    // A real backend owns the OAuth redirect; the demo signs in a sample account.
    if (isDemo) social.mutate(provider, { onSuccess: done, onError })
    else window.location.assign(`${BASE_URL}/api/auth/${provider}`)
  }

  return (
    <AuthLayout
      title="다시 오신 걸 환영합니다"
      description="가입 없이 둘러보거나, 계정으로 로그인하세요."
      footer={<>처음이신가요? <Link to="/signup" className="font-medium text-foreground underline underline-offset-4">회원가입</Link></>}
    >
      <Button size="lg" variant="secondary" className="h-10 w-full" onClick={() => guest.mutate(undefined, { onSuccess: done, onError })} disabled={guest.isPending}>
        {guest.isPending && <Spinner />}
        가입 없이 둘러보기
      </Button>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <KakaoButton onClick={() => socialLogin("kakao")} disabled={social.isPending} />
        <NaverButton onClick={() => socialLogin("naver")} disabled={social.isPending} />
      </div>
      <FieldSeparator className="my-6">또는 이메일로</FieldSeparator>
      <form onSubmit={form.handleSubmit((values) => login.mutate(values, { onSuccess: done, onError }))} noValidate>
        <FieldGroup className="gap-5">
          <FormField control={form.control} name="email" label="이메일">
            {(field) => <Input type="email" autoComplete="email" className="h-10" {...field} />}
          </FormField>
          <FormField control={form.control} name="password" label="비밀번호">
            {(field) => <Input type="password" autoComplete="current-password" className="h-10" {...field} />}
          </FormField>
          <Button type="submit" size="lg" className="h-10" disabled={login.isPending}>
            {login.isPending && <Spinner />}
            로그인
          </Button>
        </FieldGroup>
      </form>
      {isDemo && (
        <button
          type="button"
          className="mt-4 w-full rounded-md border border-dashed px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted"
          onClick={() => form.reset({ email: "demo@slipway.dev", password: "demo1234" })}
        >
          데모 계정 <span className="font-mono text-foreground">demo@slipway.dev / demo1234</span> 채우기
        </button>
      )}
    </AuthLayout>
  )
}

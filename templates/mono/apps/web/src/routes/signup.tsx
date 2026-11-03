// REQ-3 회원가입
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { signupSchema, useSignup } from "@/api/auth"
import { ApiError } from "@/api/client"
import { AuthLayout } from "@/components/auth-layout"
import { FormField } from "@/components/form-field"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export const Route = createFileRoute("/signup")({ component: SignupPage })

function SignupPage() {
  const navigate = useNavigate()
  const signup = useSignup()
  const form = useForm({ resolver: zodResolver(signupSchema), defaultValues: { name: "", email: "", password: "" } })

  const submit = form.handleSubmit((values) =>
    signup.mutate(values, {
      onSuccess: () => navigate({ to: "/home" }),
      onError: (error) => {
        if (error instanceof ApiError) {
          for (const [name, message] of Object.entries(error.fields)) form.setError(name as keyof typeof values, { message })
        }
        toast.error(error.message)
      },
    }),
  )

  return (
    <AuthLayout
      title="계정 만들기"
      description="1분이면 끝납니다."
      footer={<>이미 계정이 있나요? <Link to="/login" className="font-medium text-foreground underline underline-offset-4">로그인</Link></>}
    >
      <form onSubmit={submit} noValidate>
        <FieldGroup className="gap-5">
          <FormField control={form.control} name="name" label="이름">
            {(field) => <Input autoComplete="name" className="h-10" {...field} />}
          </FormField>
          <FormField control={form.control} name="email" label="이메일">
            {(field) => <Input type="email" autoComplete="email" className="h-10" {...field} />}
          </FormField>
          <FormField control={form.control} name="password" label="비밀번호" description="8자 이상">
            {(field) => <Input type="password" autoComplete="new-password" className="h-10" {...field} />}
          </FormField>
          <Button type="submit" size="lg" className="h-10" disabled={signup.isPending}>
            {signup.isPending && <Spinner />}
            가입하기
          </Button>
        </FieldGroup>
      </form>
    </AuthLayout>
  )
}

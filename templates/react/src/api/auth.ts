import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { api, token } from "./client"

export type User = { id: string; name: string; email: string; provider: "email" | "guest" | "kakao" | "naver" }
type Session = { token: string; user: User }

export const loginSchema = z.object({
  email: z.email("이메일 형식이 아닙니다"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
})

export const signupSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력하세요").max(20, "20자 이하로 입력하세요"),
  email: z.email("이메일 형식이 아닙니다"),
  password: z.string().min(8, "8자 이상 입력하세요"),
})

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: () => (token.get() ? api<User>("/api/auth/me") : null),
  staleTime: Infinity,
  retry: false,
})

/** Every way of signing in ends the same: store the token, prime the `me` cache. */
function useSessionMutation<TInput>(request: (input: TInput) => Promise<Session>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: ({ token: value, user }) => {
      token.set(value)
      queryClient.setQueryData(meQuery.queryKey, user)
    },
  })
}

export const useLogin = () =>
  useSessionMutation((input: z.infer<typeof loginSchema>) => api<Session>("/api/auth/login", { method: "POST", json: input }))

export const useSignup = () =>
  useSessionMutation((input: z.infer<typeof signupSchema>) => api<Session>("/api/auth/signup", { method: "POST", json: input }))

export const useGuestLogin = () =>
  useSessionMutation(() => api<Session>("/api/auth/guest", { method: "POST" }))

/** Real backends redirect to the provider; the mock backend signs in a sample account directly. */
export const useSocialLogin = () =>
  useSessionMutation((provider: "kakao" | "naver") => api<Session>(`/api/auth/social/${provider}`, { method: "POST" }))

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api<void>("/api/auth/logout", { method: "POST" }),
    onSettled: () => {
      token.clear()
      queryClient.clear()
    },
  })
}

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import type { z } from "zod"

import { loginSchema, signupSchema, type User } from "@slipway/shared/auth"
import { api, token } from "./client"

export { loginSchema, signupSchema, type User }
type Session = { token: string; user: User }

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

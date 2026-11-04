import { queryOptions, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import type { z } from "zod"

import { loginSchema, signupSchema, type User } from "@slipway/shared/auth"
import { isDemo } from "@/config"
import { ApiError, api, BASE_URL, token } from "./client"
import { demoAccount } from "./demo-account"

export { demoAccount }
export { loginSchema, signupSchema, type User }
type Session = { token: string; user: User }

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: () => (token.get() ? api<User>("/api/auth/me") : null),
  staleTime: Infinity,
  retry: false,
})

/**
 * The signed-in user, or null when there is none (no token, or the API answers 401: the token is
 * cleared). Any other error throws, so a server hiccup shows the error screen instead of signing the
 * person out. In a signed-in layout's `beforeLoad`:
 * `const user = await currentUser(context.queryClient); if (!user) throw redirect({ to: "/login", search: { redirect: location.href } })`
 */
export async function currentUser(queryClient: QueryClient): Promise<User | null> {
  try {
    return await queryClient.ensureQueryData(meQuery)
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) throw error
    token.clear()
    return null
  }
}

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

/** "둘러보기" with sample data: signs in as `demoAccount`. A guest starts empty. */
export const useDemoLogin = () =>
  useSessionMutation(() => api<Session>("/api/auth/login", { method: "POST", json: demoAccount }))

/**
 * Kakao or Naver. The mock backend signs in a sample account at once; a real API sends the browser to
 * the provider, which comes back to /auth/callback (so the mutation never settles there).
 */
export const useSocialLogin = () =>
  useSessionMutation((provider: "kakao" | "naver") => {
    if (isDemo) return api<Session>(`/api/auth/social/${provider}`, { method: "POST" })
    // A full page load: the API answers with a redirect to the provider (not an app route).
    window.location.href = `${BASE_URL}/api/auth/${provider}`
    return new Promise<Session>(() => {})
  })

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

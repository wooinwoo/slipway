import { queryOptions, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { isDemo } from "@/shared/config"
import { ApiError, api, BASE_URL, token } from "./client"
import { demoAccount } from "./demo-account"

export { demoAccount }

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

/**
 * Where to go after signing in, from a `?redirect=` the sign-in guard added: a path on this site only
 * ("/today?x=1"), otherwise "/", so a crafted link can't send people to another site.
 */
export function safeRedirect(value: unknown, fallback = "/") {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : fallback
}

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
    window.location.href = new URL(`${BASE_URL}/api/auth/${provider}`, window.location.origin).href
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

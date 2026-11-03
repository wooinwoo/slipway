// Landing page for real Kakao/Naver sign-in: the API redirects here with #token=...
// (the mock backend signs in directly and never comes through this page).
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { meQuery } from "@/api/auth"
import { token } from "@/api/client"
import { RouteNotFound } from "@/components/route-states"
import { Spinner } from "@/components/ui/spinner"

export const Route = createFileRoute("/auth/callback")({
  staticData: { title: "로그인 중" },
  component: AuthCallback,
})

function AuthCallback() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [value] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token"))

  useEffect(() => {
    if (!value) return
    token.set(value)
    // Drop the token from the address bar and history before anything else renders.
    history.replaceState(null, "", window.location.pathname)
    queryClient.removeQueries({ queryKey: meQuery.queryKey })
    navigate({ to: "/home", replace: true })
  }, [value, queryClient, navigate])

  if (!value) return <RouteNotFound title="로그인 정보를 받지 못했습니다" backTo="/login" />
  return (
    <div className="flex min-h-svh items-center justify-center gap-2 text-sm text-muted-foreground">
      <Spinner />
      로그인 중
    </div>
  )
}

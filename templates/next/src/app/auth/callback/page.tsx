"use client"

// Landing page for real Kakao/Naver sign-in: the API redirects here with #token=...
// (the mock backend signs in directly and never comes through this page).
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { meQuery } from "@/api/auth"
import { token } from "@/api/client"
import { Spinner } from "@/components/ui/spinner"

export default function AuthCallback() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [value] = useState(() =>
    typeof window === "undefined" ? null : new URLSearchParams(window.location.hash.slice(1)).get("token"),
  )

  useEffect(() => {
    if (!value) return
    token.set(value)
    // Drop the token from the address bar and history before anything else renders.
    history.replaceState(null, "", window.location.pathname)
    queryClient.removeQueries({ queryKey: meQuery.queryKey })
    router.replace("/")
  }, [value, queryClient, router])

  if (!value)
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-3 text-sm">
        <p>로그인 정보를 받지 못했습니다.</p>
        <Link href="/" className="font-medium underline underline-offset-4">
          돌아가기
        </Link>
      </main>
    )
  return (
    <main className="flex min-h-svh items-center justify-center gap-2 text-sm text-muted-foreground">
      <Spinner />
      로그인 중
    </main>
  )
}

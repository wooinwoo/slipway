import { createFileRoute } from "@tanstack/react-router"
import { FilePlusIcon, PlugIcon, ShieldCheckIcon, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { PageHeader } from "@/components/page-header"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { isDemo } from "@/config"

export const Route = createFileRoute("/_app/home")({
  staticData: { title: "홈" },
  component: Home,
})

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.8125rem] text-foreground">{children}</code>
)

// The kit's start screen. Delete this file's content and build your product's first screen.
function Home() {
  const { user } = Route.useRouteContext()
  const steps: { icon: LucideIcon; title: string; body: ReactNode }[] = [
    {
      icon: FilePlusIcon,
      title: "화면 추가",
      body: <>파일 <Code>src/routes/_app/이름.tsx</Code>를 만들고 <Code>app-sidebar.tsx</Code>의 <Code>nav</Code>에 한 줄 넣으면 사이드바와 Ctrl+K에 같이 나옵니다.</>,
    },
    {
      icon: PlugIcon,
      title: isDemo ? "지금은 Mock API" : "실서버 연결됨",
      body: <><Code>.env</Code>의 <Code>VITE_API_URL</Code>을 비우면 브라우저 안의 Mock API, 넣으면 같은 호출이 실서버로 갑니다.</>,
    },
    {
      icon: ShieldCheckIcon,
      title: "끝내기 전에",
      body: <><Code>pnpm verify</Code>로 타입, 린트, 테스트, 요구사항, E2E를 한 번에 돌리고 <Code>pnpm shots</Code>로 화면을 찍어 봅니다.</>,
    },
  ]
  return (
    <div className="grid gap-8">
      <PageHeader title={`${user.name}님, 환영합니다`} description="Slipway 시작 화면입니다. src/routes/_app/home.tsx를 고쳐 첫 화면을 만드세요." />
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardHeader>
              <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4.5" />
              </span>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="leading-relaxed">{body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}

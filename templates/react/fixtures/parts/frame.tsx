import { useState } from "react"
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router"
import { HouseIcon, ReceiptIcon } from "lucide-react"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppShell, type NavItem } from "@/patterns/app-shell"
import {
  AuthCard,
  AuthDivider,
  GuestButton,
  LoginForm,
  SignupForm,
  SocialButtons,
} from "@/patterns/auth-forms"
import { ThemeSettings } from "@/patterns/theme-settings"

function LoginFixture() {
  const [log, setLog] = useState("")
  return (
    <>
      <AuthCard title="로그인" description="계정으로 계속하세요." footer="처음이신가요? 회원가입">
        <SocialButtons onSelect={(provider) => setLog(provider)} />
        <AuthDivider>또는 이메일로</AuthDivider>
        <LoginForm
          demo={{ email: "demo@slipway.dev", password: "demo1234" }}
          submit={async (values) => {
            if (values.password !== "demo1234")
              return { message: "이메일 또는 비밀번호가 맞지 않습니다" }
            setLog(`login ${values.email}`)
            return undefined
          }}
        />
        <GuestButton onClick={() => setLog("guest")} />
      </AuthCard>
      <output>{log}</output>
    </>
  )
}

function SignupFixture() {
  const [log, setLog] = useState("")
  return (
    <>
      <AuthCard title="계정 만들기">
        <SignupForm
          submit={async (values) => {
            if (values.password.length < 8)
              return {
                message: "입력값을 확인해 주세요",
                fields: { password: "8자 이상 입력하세요" },
              }
            setLog(`signup ${values.name}`)
            return undefined
          }}
        />
      </AuthCard>
      <output>{log}</output>
    </>
  )
}

const shellNav: NavItem[] = [
  { to: "/", label: "홈", icon: HouseIcon },
  { to: "/orders", label: "주문", icon: ReceiptIcon },
]

function ShellFixture() {
  const [loggedOut, setLoggedOut] = useState(false)
  const [router] = useState(() => {
    const root = createRootRoute({
      component: () => (
        <AppShell
          brand="Slipway"
          nav={shellNav}
          user={{ name: "김슬립", email: "kim@slipway.dev" }}
          onLogout={() => setLoggedOut(true)}
        >
          <Outlet />
        </AppShell>
      ),
    })
    const page = (path: string, title: string) =>
      createRoute({
        getParentRoute: () => root,
        path,
        staticData: { title },
        component: () => <h1>{title} 화면</h1>,
      })
    return createRouter({
      routeTree: root.addChildren([page("/", "홈"), page("/orders", "주문")]),
      history: createMemoryHistory(),
    })
  })
  return (
    <ThemeProvider>
      <TooltipProvider>
        <RouterProvider router={router} />
        <output>{loggedOut ? "로그아웃" : ""}</output>
      </TooltipProvider>
    </ThemeProvider>
  )
}

export const frameFixtures = {
  login: LoginFixture,
  signup: SignupFixture,
  shell: ShellFixture,
  "theme-settings": () => (
    <ThemeProvider>
      <ThemeSettings />
    </ThemeProvider>
  ),
}

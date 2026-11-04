import { useState, type ReactNode } from "react"
import {
  Link,
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router"
import { HouseIcon, ReceiptIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppShell, type NavItem } from "@/patterns/app-shell"
import { BottomSheet, BottomSheetTitle, MobileShell, TopBar, type TabItem } from "@/patterns/mobile-shell"
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

const tabs: TabItem[] = [
  { to: "/", label: "홈", icon: HouseIcon },
  { to: "/orders", label: "주문", icon: ReceiptIcon },
]

function SheetFixture() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState("접수")
  return (
    <>
      <Button variant="outline" className="m-4" onClick={() => setOpen(true)}>
        상태 바꾸기 ({status})
      </Button>
      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetTitle className="text-lg font-semibold">주문 상태</BottomSheetTitle>
        {["접수", "배송"].map((option) => (
          <Button key={option} variant="ghost" onClick={() => { setStatus(option); setOpen(false) }}>
            {option}
          </Button>
        ))}
      </BottomSheet>
    </>
  )
}

/** `?part=mobile&path=/orders/new` opens a screen directly, with no page to go back to. */
function MobileFixture() {
  const [saved, setSaved] = useState(false)
  const [router] = useState(() => {
    const root = createRootRoute({ component: () => <Outlet /> })
    const tabbed = (path: string, title: string, body?: ReactNode) =>
      createRoute({
        getParentRoute: () => root,
        path,
        component: () => (
          <MobileShell tabs={tabs}>
            <h1 className="p-4 text-xl font-semibold">{title} 화면</h1>
            {body}
          </MobileShell>
        ),
      })
    const form = createRoute({
      getParentRoute: () => root,
      path: "/orders/new",
      component: () => (
        <MobileShell
          className="bg-card"
          top={<TopBar title="주문 받기" back={{ to: "/orders" }} />}
          bottom={
            <Button className="h-12 w-full" onClick={() => setSaved(true)}>
              저장
            </Button>
          }
        >
          {Array.from({ length: 30 }, (_, i) => (
            <p key={i} className="px-4 py-2">
              {i === 29 ? "마지막 줄" : `내용 ${i + 1}`}
            </p>
          ))}
        </MobileShell>
      ),
    })
    const path = new URLSearchParams(location.search).get("path") ?? "/"
    return createRouter({
      routeTree: root.addChildren([
        tabbed("/", "홈"),
        tabbed("/orders", "주문", (
          <>
            <Link to="/orders/new" className="m-4 underline">주문 받기</Link>
            <SheetFixture />
          </>
        )),
        form,
      ]),
      history: createMemoryHistory({ initialEntries: [path] }),
    })
  })
  return (
    <>
      <RouterProvider router={router} />
      <output>{saved ? "저장함" : ""}</output>
    </>
  )
}

export const frameFixtures = {
  mobile: MobileFixture,
  login: LoginFixture,
  signup: SignupFixture,
  shell: ShellFixture,
  "theme-settings": () => (
    <ThemeProvider>
      <ThemeSettings />
    </ThemeProvider>
  ),
}

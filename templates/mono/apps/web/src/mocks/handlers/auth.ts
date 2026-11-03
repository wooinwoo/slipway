import { HttpResponse, http } from "msw"

import { loginSchema, signupSchema, type User } from "@/api/auth"
import { db, save } from "../db"
import { API, currentUser, fail, parseBody } from "../http"

function startSession(user: User) {
  const value = crypto.randomUUID()
  db.sessions[value] = user.id
  save()
  const { id, name, email, provider } = user
  return HttpResponse.json({ token: value, user: { id, name, email, provider } })
}

function ensureUser(user: User) {
  const existing = db.users.find((u) => u.id === user.id)
  if (existing) return existing
  const created = { ...user, password: "" }
  db.users.push(created)
  return created
}

export const authHandlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const { data, error } = await parseBody(request, loginSchema)
    if (error) return error
    const user = db.users.find((u) => u.email === data.email && u.password === data.password && u.password !== "")
    return user ? startSession(user) : fail(401, "이메일 또는 비밀번호가 맞지 않습니다")
  }),

  http.post(`${API}/auth/signup`, async ({ request }) => {
    const { data, error } = await parseBody(request, signupSchema)
    if (error) return error
    if (db.users.some((u) => u.email === data.email)) {
      return fail(400, "입력값을 확인해 주세요", { email: "이미 가입된 이메일입니다" })
    }
    const user = { id: `u_${crypto.randomUUID().slice(0, 8)}`, provider: "email" as const, ...data }
    db.users.push(user)
    return startSession(user)
  }),

  http.post(`${API}/auth/guest`, () =>
    startSession(ensureUser({ id: "u_guest", name: "게스트", email: "guest@slipway.dev", provider: "guest" })),
  ),

  http.post(`${API}/auth/social/:provider`, ({ params }) => {
    const provider = params.provider === "naver" ? "naver" : "kakao"
    const name = provider === "kakao" ? "카카오 사용자" : "네이버 사용자"
    return startSession(ensureUser({ id: `u_${provider}`, name, email: `${provider}@slipway.dev`, provider }))
  }),

  http.get(`${API}/auth/me`, ({ request }) => {
    const user = currentUser(request)
    if (user instanceof Response) return user
    const { id, name, email, provider } = user
    return HttpResponse.json({ id, name, email, provider })
  }),

  http.post(`${API}/auth/logout`, ({ request }) => {
    const value = request.headers.get("Authorization")?.replace(/^Bearer /, "")
    if (value) delete db.sessions[value]
    save()
    return new HttpResponse(null, { status: 204 })
  }),
]

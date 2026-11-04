// Small helpers so handlers read like a real backend: auth, validation, errors.
import { HttpResponse } from "msw"
import type { z } from "zod"

import { db } from "./db"

export const API = `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api`

export function fail(status: number, message: string, fields?: Record<string, string>) {
  return HttpResponse.json({ message, fields }, { status })
}

/** Returns the signed-in user, or a 401 response to return as-is. */
export function currentUser(request: Request) {
  const value = request.headers.get("Authorization")?.replace(/^Bearer /, "")
  const userId = value ? db.sessions[value] : undefined
  const user = db.users.find((u) => u.id === userId)
  return user ?? fail(401, "로그인이 필요합니다")
}

/** Parses the JSON body with the same zod schema the form uses; 400 with field errors on failure. */
export async function parseBody<T extends z.ZodType>(request: Request, schema: T) {
  const result = schema.safeParse(await request.json().catch(() => undefined))
  if (result.success) return { data: result.data as z.infer<T> }
  const fields = Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]))
  return { error: fail(400, "입력값을 확인해 주세요", fields) }
}

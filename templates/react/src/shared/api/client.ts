// One fetch wrapper for every endpoint. With VITE_API_URL unset, requests go to the
// in-browser mock backend (src/mocks); set it and the same calls hit a real server.
// "/" means same origin (a dev proxy or one domain for both); no trailing slash either way.
import { z } from "zod"

// Every schema module imports this client, so this runs before any parse: no eval-compiled parsers,
// so a strict Content-Security-Policy (no 'unsafe-eval') stays quiet.
z.config({ jitless: true })

export const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")
const TOKEN_KEY = "slipway.token"

export const token = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (value: string) => localStorage.setItem(TOKEN_KEY, value),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  /** Field-level messages from a 400 response, keyed by form field name. */
  fields: Record<string, string>

  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

type ApiInit = Omit<RequestInit, "body"> & { json?: unknown }

export async function api<T>(path: string, { json, headers, ...init }: ApiInit = {}): Promise<T> {
  const auth = token.get()
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(json === undefined ? {} : { "Content-Type": "application/json" }),
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      ...headers,
    },
    body: json === undefined ? undefined : JSON.stringify(json),
  })

  if (response.status === 204) return undefined as T
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? "요청을 처리하지 못했습니다", body?.fields)
  }
  return body as T
}

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number }

export type Failure = { message: string; fields: Record<string, string> }

/**
 * What a form shows after a failed submit, from either side: a zod error from `schema.safeParse`
 * or an `ApiError` from the server, as one message plus messages keyed by field name.
 * `const parsed = schema.safeParse(values); if (!parsed.success) return setFailure(failureOf(parsed.error))`
 */
export function failureOf(error: unknown): Failure {
  if (error instanceof z.ZodError)
    return { message: "입력값을 확인해 주세요", fields: Object.fromEntries(error.issues.map((issue) => [issue.path.join("."), issue.message])) }
  if (error instanceof ApiError) return { message: error.message, fields: error.fields }
  return { message: "잠시 후 다시 시도해 주세요", fields: {} }
}

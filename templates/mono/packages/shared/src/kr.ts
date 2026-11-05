// Korean-specific formatting and validation. Pure functions, no UI, so they work in
// forms, tables, mock handlers, and tests alike.
import { z } from "zod"

// Korean defaults for every zod rule that has no message of its own.
z.config(z.locales.ko())

const digits = (value: string) => value.replace(/\D/g, "")

/** Formats as the user types: 01012345678 -> 010-1234-5678, 0212345678 -> 02-1234-5678. */
export function formatPhone(value: string) {
  const d = digits(value).slice(0, 11)
  if (d.startsWith("02")) {
    if (d.length <= 2) return d
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`
  }
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

export const phoneSchema = z
  .string()
  .regex(/^(01[016789]|02|0[3-6][1-5]|070)-\d{3,4}-\d{4}$/, "전화번호 형식이 아닙니다")

/**
 * A number field that also takes the text an input holds: "" is no value (null), "1,200" is 1200, so a form
 * passes its strings straight to the schema. Wraps the field's `z.number()`.
 */
export const numberInput = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value ?? null
    const text = value.replaceAll(",", "").trim()
    return text ? Number(text) : null
  }, schema)

/** 1234567890 -> 123-45-67890 */
export function formatBizNo(value: string) {
  const d = digits(value).slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

/** National Tax Service checksum for a 10-digit business registration number. */
export function isValidBizNo(value: string) {
  const d = digits(value)
  if (d.length !== 10) return false
  const n = d.split("").map(Number)
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5]
  let sum = weights.reduce((acc, w, i) => acc + n[i] * w, 0)
  sum += Math.floor((n[8] * 5) / 10)
  return (10 - (sum % 10)) % 10 === n[9]
}

export const bizNoSchema = z
  .string()
  .refine(isValidBizNo, "사업자등록번호가 올바르지 않습니다")

/** 1234000 -> "1,234,000원" */
export function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`
}

/** Reads the way people say amounts: 125000000 -> "1억 2,500만원", 34000 -> "3만 4,000원". */
export function formatWonKorean(amount: number) {
  if (amount === 0) return "0원"
  const units: [number, string][] = [
    [1_0000_0000_0000, "조"],
    [1_0000_0000, "억"],
    [1_0000, "만"],
  ]
  let rest = Math.floor(Math.abs(amount))
  const parts: string[] = []
  for (const [size, label] of units) {
    const q = Math.floor(rest / size)
    if (q > 0) parts.push(`${q.toLocaleString("ko-KR")}${label}`)
    rest %= size
  }
  if (rest > 0) parts.push(rest.toLocaleString("ko-KR"))
  return `${amount < 0 ? "-" : ""}${parts.join(" ")}원`
}

/** Short form for dense UI such as table cells and KPI cards: 125000000 -> "1.3억". */
export function formatWonCompact(amount: number) {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? "-" : ""
  if (abs >= 1_0000_0000) return `${sign}${+(abs / 1_0000_0000).toFixed(1)}억`
  if (abs >= 1_0000) return `${sign}${Math.round(abs / 1_0000).toLocaleString("ko-KR")}만`
  return `${sign}${abs.toLocaleString("ko-KR")}`
}

export const banks = [
  "KB국민", "신한", "우리", "하나", "NH농협", "IBK기업", "SC제일", "씨티",
  "카카오뱅크", "토스뱅크", "케이뱅크", "iM뱅크", "부산", "경남", "광주", "전북",
  "제주", "수협", "새마을금고", "신협", "우체국", "산업",
] as const

/** "3분 전", "어제", "3월 4일" — relative time the way Korean UIs show it. */
export function formatRelative(date: Date | string, now = new Date()) {
  const d = typeof date === "string" ? new Date(date) : date
  const sec = Math.round((now.getTime() - d.getTime()) / 1000)
  if (sec < 60) return "방금 전"
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`
  if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`
  if (sec < 172800) return "어제"
  if (sec < 604800) return `${Math.floor(sec / 86400)}일 전`
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString("ko-KR", sameYear ? { month: "long", day: "numeric" } : { year: "numeric", month: "long", day: "numeric" })
}

// Dates as Korean screens write them. A string is a calendar day ("2026-11-04") or an ISO date-time;
// a day is read in local time, so "2026-11-04" stays the 4th in any time zone.
const weekdays = ["일", "월", "화", "수", "목", "금", "토"]
const toDate = (date: Date | string) => (typeof date === "string" && date.length === 10 ? new Date(`${date}T00:00:00`) : new Date(date))
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

/** "2026-11-04": the local calendar day, the format of `<input type="date">` and the `date` field type. */
export const toIsoDate = (date: Date | string = new Date()) => toDate(date).toLocaleDateString("sv-SE")

/** The local calendar day `days` from `from` (negative is the past): `isoDaysFrom(1)` is tomorrow. */
export const isoDaysFrom = (days: number, from: Date | string = new Date()) => {
  const date = startOfDay(toDate(from))
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

/** "11월 4일 수요일" */
export const formatDateLong = (date: Date | string) => {
  const d = toDate(date)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${weekdays[d.getDay()]}요일`
}

/** "11월 4일" */
export const formatMonthDay = (date: Date | string) => {
  const d = toDate(date)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** "11/4 수": date chips, compact rows */
export const formatDateShort = (date: Date | string) => {
  const d = toDate(date)
  return `${d.getMonth() + 1}/${d.getDate()} ${weekdays[d.getDay()]}`
}

/** "오늘", "내일", "어제", or "11월 6일" (with the year when it isn't this year) */
export function formatDateWord(date: Date | string, now = new Date()) {
  const d = startOfDay(toDate(date))
  const days = Math.round((d.getTime() - startOfDay(now).getTime()) / 86_400_000)
  if (days === 0) return "오늘"
  if (days === 1) return "내일"
  if (days === -1) return "어제"
  return `${d.getFullYear() === now.getFullYear() ? "" : `${d.getFullYear()}년 `}${d.getMonth() + 1}월 ${d.getDate()}일`
}

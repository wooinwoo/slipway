import { describe, expect, it } from "vitest"

import {
  formatBizNo,
  formatDateLong,
  formatDateShort,
  formatDateWord,
  formatPhone,
  formatRelative,
  formatWonCompact,
  formatWonKorean,
  isoDaysFrom,
  isValidBizNo,
  phoneSchema,
  toIsoDate,
} from "./kr"

describe("phone", () => {
  it("formats while typing", () => {
    expect(formatPhone("010")).toBe("010")
    expect(formatPhone("0101234")).toBe("010-1234")
    expect(formatPhone("01012345678")).toBe("010-1234-5678")
    expect(formatPhone("010-1234-56789")).toBe("010-1234-5678")
    expect(formatPhone("0212345678")).toBe("02-1234-5678")
    expect(formatPhone("0311234567")).toBe("031-123-4567")
  })
  it("validates", () => {
    expect(phoneSchema.safeParse("010-1234-5678").success).toBe(true)
    expect(phoneSchema.safeParse("02-123-4567").success).toBe(true)
    expect(phoneSchema.safeParse("010-12-5678").success).toBe(false)
  })
})

describe("business registration number", () => {
  it("formats", () => expect(formatBizNo("1248100998")).toBe("124-81-00998"))
  it("checks the checksum", () => {
    expect(isValidBizNo("124-81-00998")).toBe(true)
    expect(isValidBizNo("124-81-00997")).toBe(false)
    expect(isValidBizNo("124-81-0099")).toBe(false)
  })
})

describe("won", () => {
  it("reads like spoken Korean", () => {
    expect(formatWonKorean(125_000_000)).toBe("1억 2,500만원")
    expect(formatWonKorean(34_000)).toBe("3만 4,000원")
    expect(formatWonKorean(0)).toBe("0원")
  })
  it("compacts for dense UI", () => {
    expect(formatWonCompact(125_000_000)).toBe("1.3억")
    expect(formatWonCompact(3_400_000)).toBe("340만")
    expect(formatWonCompact(900)).toBe("900")
  })
})

describe("relative time", () => {
  const now = new Date("2026-11-03T12:00:00+09:00")
  it("uses Korean phrasing", () => {
    expect(formatRelative(new Date(now.getTime() - 30_000), now)).toBe("방금 전")
    expect(formatRelative(new Date(now.getTime() - 5 * 60_000), now)).toBe("5분 전")
    expect(formatRelative(new Date(now.getTime() - 30 * 3600_000), now)).toBe("어제")
  })
})

describe("calendar days", () => {
  const now = new Date(2026, 10, 4, 18, 50)
  it("writes days the way Korean screens do", () => {
    expect(formatDateLong("2026-11-04")).toBe("11월 4일 수요일")
    expect(formatDateShort("2026-11-05")).toBe("11/5 목")
    expect(formatDateWord("2026-11-04", now)).toBe("오늘")
    expect(formatDateWord("2026-11-05", now)).toBe("내일")
    expect(formatDateWord("2026-11-03", now)).toBe("어제")
    expect(formatDateWord("2026-11-08", now)).toBe("11월 8일")
    expect(formatDateWord("2027-01-02", now)).toBe("2027년 1월 2일")
  })
  it("counts days in local time", () => {
    expect(toIsoDate(now)).toBe("2026-11-04")
    expect(isoDaysFrom(1, now)).toBe("2026-11-05")
    expect(isoDaysFrom(-4, now)).toBe("2026-10-31")
  })
})

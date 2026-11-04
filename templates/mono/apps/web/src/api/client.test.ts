import { describe, expect, it } from "vitest"
import { z } from "zod"

import { ApiError, failureOf } from "./client"

describe("failureOf", () => {
  it("keys zod issues by field path", () => {
    const parsed = z.object({ name: z.string().min(1, "이름을 입력하세요"), age: z.number() }).safeParse({ name: "", age: "x" })
    expect(parsed.success).toBe(false)
    const failure = failureOf(parsed.error)
    expect(failure.message).toBe("입력값을 확인해 주세요")
    expect(failure.fields.name).toBe("이름을 입력하세요")
    expect(failure.fields.age).toBeTruthy()
  })

  it("passes a server error's message and field messages through", () => {
    expect(failureOf(new ApiError(400, "정원이 찼습니다", { classId: "자리가 없습니다" }))).toEqual({
      message: "정원이 찼습니다",
      fields: { classId: "자리가 없습니다" },
    })
  })

  it("falls back to a retry message for anything else", () => {
    expect(failureOf(new TypeError("Failed to fetch"))).toEqual({ message: "잠시 후 다시 시도해 주세요", fields: {} })
  })
})

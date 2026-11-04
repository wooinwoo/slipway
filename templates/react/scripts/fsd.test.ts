import { resolve } from "node:path"
import { Linter } from "eslint"
import tseslint from "typescript-eslint"
import { expect, it } from "vitest"
import fsd from "./fsd.mjs"

function messages(file: string, code: string) {
  return new Linter().verify(
    code,
    [
      {
        files: ["**/*.{ts,tsx}"],
        languageOptions: { parser: tseslint.parser },
        plugins: { fsd },
        rules: { "fsd/layers": "error" },
      },
    ],
    { filename: resolve("src", file) }
  )
}

it.each([
  ["shared/lib/probe.ts", 'import { x } from "@/entities/orders/api"'],
  ["shared/lib/probe.ts", 'import { x } from "../../entities/orders/api"'],
  [
    "shared/lib/probe.ts",
    'export * from "@/shared/../../src/entities/orders/api"',
  ],
  ["entities/orders/probe.ts", 'import type { X } from "@/entities/users/api"'],
  ["features/orders/probe.ts", 'export { x } from "../users/api"'],
  ["features/orders/probe.ts", 'const x = import("../users/api")'],
  ["shared/lib/probe.ts", 'export * from "../../main"'],
])("blocks forbidden imports in %s: %s", (file, code) => {
  expect(messages(file, code).map((message) => message.ruleId)).toEqual([
    "fsd/layers",
  ])
})

it.each([
  ["features/orders/probe.ts", 'import { x } from "@/entities/orders/api"'],
  ["entities/orders/probe.ts", 'import { x } from "./api"'],
  ["entities/orders/probe.ts", 'import { x } from "@/entities/orders/api"'],
  ["shared/lib/probe.ts", 'import { x } from "../api/client"'],
  ["mocks/handlers/probe.ts", 'import { x } from "@/entities/orders/api"'],
  ["routes/index.tsx", 'import { x } from "@/widgets/orders/list"'],
  ["shared/lib/probe.ts", 'import { x } from "react"'],
])("allows imports in %s: %s", (file, code) => {
  expect(messages(file, code)).toEqual([])
})

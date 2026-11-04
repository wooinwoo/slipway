// pnpm gen resource <plural> <한글 이름> --fields "<name>[?]:<type>[:<라벨>] ..."
//
//   pnpm gen resource orders 주문 --fields "title:text:주문명 amount:won:금액 status:enum(접수|배송|완료):상태 dueAt?:date:납기 memo?:textarea:메모"
//
// Types: text, textarea, email, phone, number, won, date, time (HH:MM), enum(a|b|c), ref(<plural>).
// `?` after the name makes it optional. `classId:ref(classes):수업` points at a resource generated
// earlier: the API and mock check it exists for the same user, and deleting it deletes the rows here.
// Fields are split on spaces, so write a space inside a label as `_`: `startTime:text:시작_시간` -> "시작 시간".
// Writes the data layer of every part the project has, from one field list. No screens: build those
// from src/patterns/ (see CODEPACK.md).
//   web (react, mono):  src/entities/<plural>/api.ts (schema, query, save and delete hooks), the mock
//                       handlers in src/mocks/handlers/<plural>.ts plus the mock table,
//                       e2e/<plural>-api.e2e.ts (the same requests against the mock or the real API)
//   api (nest, mono):   zod contract, Drizzle table + migration, service/controller/module (scoped to the
//                       signed-in user), contract test
//   mono:               the zod schema lives once in packages/shared
// Generated files are ordinary code: edit them afterwards. Existing files are never overwritten.
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

const layout = existsSync("apps/web") && existsSync("apps/api") ? "mono"
  : existsSync("src/mocks/browser.ts") ? "react"
  : existsSync("src/db/schema.ts") ? "nest"
  : null
if (!layout) exit("Run this in the root of a Slipway project (react, nest or mono).")
const web = layout === "mono" ? "apps/web" : layout === "react" ? "." : null
const api = layout === "mono" ? "apps/api" : layout === "nest" ? "." : null
const shared = layout === "mono" ? "packages/shared/src" : null

/** Runs pnpm the same way this script was started (`corepack pnpm gen ...` puts it in npm_execpath). */
function pnpm(args) {
  const bin = process.env.npm_execpath
  if (bin) execFileSync(process.execPath, [bin, ...args], { stdio: "inherit" })
  else execFileSync("pnpm", args, { stdio: "inherit" })
}

// Run package JavaScript with Node directly. .bin launchers are shell scripts on Unix and
// .cmd files on Windows; execFileSync cannot execute those portably.
function packageBin(root, name) {
  const file = resolve(root, "node_modules", name, "package.json")
  if (!existsSync(file)) return null
  const manifest = JSON.parse(readFileSync(file, "utf8"))
  const bin = typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.[name]
  if (!bin) throw new Error(`No CLI registered for ${name}`)
  return resolve(dirname(file), bin)
}

function exit(message) {
  console.error(message)
  process.exit(1)
}

// ---------------------------------------------------------------------------- arguments

const USAGE = `usage: pnpm gen resource <plural> <한글 이름> --fields "<name>[?]:<type>[:<라벨>] ..." [--singular <name>]

  types   text, textarea, email, phone, number, won, date, time (HH:MM), enum(a|b|c),
          ref(<plural>): points at a resource generated earlier (classId:ref(classes):수업)
  ?       after the name: optional field
  라벨    shown in forms and messages; write a space as _ (startTime:time:시작_시간)
  --singular  the singular when it isn't derived right (people -> --singular person)

  pnpm gen resource orders 주문 --fields "title:text:주문명 amount:won:금액 status:enum(접수|배송|완료):상태 dueAt?:date:납기"`

function parseArgs(args) {
  const options = {}
  const positional = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--fields" || args[i] === "--singular") options[args[i].slice(2)] = args[++i]
    else if (args[i].startsWith("--")) exit(`unknown option ${args[i]}`)
    else positional.push(args[i])
  }
  const [plural, label] = positional
  if (!plural || !label) exit(USAGE)
  if (!/^[a-z][a-z0-9]*$/.test(plural)) exit(`"${plural}" must be lowercase letters and digits, like "orders"`)
  // categories -> category, classes -> class, boxes -> box, statuses -> status, orders -> order
  const singular = options.singular ?? (plural.endsWith("ies") ? `${plural.slice(0, -3)}y` : /(ss|x|ch|sh|z|us)es$/.test(plural) ? plural.slice(0, -2) : plural.replace(/s$/, ""))
  if (singular === plural || !/^[a-z][a-z0-9]*$/.test(singular)) exit(`can't derive a singular from "${plural}"; pass --singular`)
  const spec = options.fields ?? `name:text:${label} 이름`
  const fields = spec.trim().split(/\s+/).map(parseField)
  for (const field of fields.filter((f) => f.type === "ref")) {
    const parent = registry()[field.target]
    if (!parent) exit(`"${field.name}" points at ${field.target}, which isn't generated yet (package.json "slipway.resources"). Generate ${field.target} first.`)
    field.parent = { plural: field.target, singular: parent.singular, label: parent.label, fields: parent.fields.trim().split(/\s+/).map(parseField) }
    if (field.parent.fields.some((f) => f.type === "ref")) exit(`${field.target} has references of its own: a reference two levels deep isn't generated yet`)
  }
  if (new Set(fields.map((f) => f.name)).size !== fields.length) exit("field names must be unique")
  if (fields.every((f) => f.optional)) exit("make at least one field required: the generated tests check its validation")
  return { plural, singular, label, fields, spec }
}

/** Resources generated so far, recorded in package.json so a later one can point at them. */
const registry = () => JSON.parse(readFileSync("package.json", "utf8")).slipway?.resources ?? {}

const TYPES = ["text", "textarea", "email", "phone", "number", "won", "date", "time", "ref(<plural>)"]

function parseField(spec) {
  const match = /^([a-z][a-zA-Z0-9]*)(\?)?:(text|textarea|email|phone|number|won|date|time|enum\(([^)]+)\)|ref\(([a-z][a-z0-9]*)\))(?::(.+))?$/.exec(spec)
  if (!match) exit(`bad field "${spec}". Use name[?]:type[:라벨] with type one of ${TYPES.join(", ")}, enum(a|b)`)
  const [, name, optional, type, values, target, label] = match
  if (target && optional) exit(`"${name}" is a reference: references are required`)
  if (["id", "userId", "createdAt", "updatedAt"].includes(name)) exit(`"${name}" is added automatically`)
  return {
    name,
    optional: !!optional,
    type: values ? "enum" : target ? "ref" : type,
    values: values?.split("|").map((v) => v.trim()).filter(Boolean),
    target,
    label: label?.replaceAll("_", " ") ?? name,
  }
}

// ---------------------------------------------------------------------------- helpers

const cap = (word) => word[0].toUpperCase() + word.slice(1)
const snake = (word) => word.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
const q = (value) => JSON.stringify(value)
const sq = (value) => `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`

// Korean particles follow the last syllable: 제목을 but 메모를.
function particle(word, pair) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  const batchim = code >= 0 && code <= 11171 && code % 28 !== 0
  return word + (batchim ? pair[0] : pair[1])
}

function write(file, content) {
  if (existsSync(file)) exit(`${file} already exists. Remove it or pick another name.`)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
  created.push(file)
}

function edit(file, change) {
  const before = readFileSync(file, "utf8")
  const after = change(before)
  if (after !== before) {
    writeFileSync(file, after)
    created.push(file)
  }
}

/** Inserts `text` on the line above the `// gen:<marker>` comment. */
function above(file, marker, text) {
  edit(file, (source) => {
    const at = source.search(new RegExp(`^[ \\t]*// gen:${marker}\\b`, "m"))
    if (at === -1) exit(`${file} lost its "// gen:${marker}" marker. Add the line back where new entries go.`)
    let before = source.slice(0, at)
    // A list entry needs a comma after the entry above it; a formatter may have dropped that trailing comma.
    if (text.trimEnd().endsWith(",")) {
      const lines = before.split("\n")
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trimEnd()
        if (!line.trim() || line.trim().startsWith("//")) continue
        if (!/[,([{]$/.test(line)) lines[i] = `${line},`
        break
      }
      before = lines.join("\n")
    }
    return before + text + "\n" + source.slice(at)
  })
}

/** Adds an import after the last import statement. */
function addImport(file, line) {
  edit(file, (source) => {
    if (source.includes(line)) return source
    const imports = [...source.matchAll(/^import[\s\S]*?from\s+["'][^"']+["'];?\n/gm)]
    const end = imports.length ? imports.at(-1).index + imports.at(-1)[0].length : 0
    return source.slice(0, end) + line + "\n" + source.slice(end)
  })
}

// ---------------------------------------------------------------------------- field rules

/** zod for one field. `kr` is the import path of the Korean helpers. */
function zodFor(field) {
  const required = particle(field.label, ["을", "를"]) + " 입력하세요"
  const text = (max) => field.optional ? `z.string().trim().max(${max})` : `z.string().trim().min(1, ${q(required)}).max(${max})`
  const blankOr = (schema) => field.optional ? `z.union([z.literal(""), ${schema}])` : schema
  const nullable = (schema) => field.optional ? `${schema}.nullable()` : schema
  switch (field.type) {
    case "text": return text(200)
    case "textarea": return text(2000)
    case "email": return blankOr(`z.email("이메일 형식이 아닙니다")`)
    case "phone": return blankOr("phoneSchema")
    case "number": return nullable(`z.number({ error: ${q(required)} }).int("정수를 입력하세요")`)
    case "won": return nullable(`z.number({ error: ${q(required)} }).int().min(0, "0원 이상 입력하세요")`)
    case "date": return nullable(`z.iso.date({ error: "날짜를 선택하세요" })`)
    // A time of day as typed in <input type="time">; stored as text.
    case "time": return blankOr(`z.string().regex(/^([01]\\d|2[0-3]):[0-5]\\d$/, ${q(field.optional ? "시각을 00:00 형식으로 입력하세요" : particle(field.label, ["을", "를"]) + " 입력하세요")})`)
    case "enum": return `z.enum(${optionsName(field)})`
    case "ref": return `z.string().trim().min(1, ${q(particle(field.label, ["을", "를"]) + " 고르세요")})`
  }
}

const optionsName = (field) => `${state.singular}${cap(field.name)}Options`
const state = {}

/** The zod schema and types for a resource: `imports` lines plus the `body`. */
function schemaParts(resource, krImport) {
  const { singular, label, fields } = resource
  const Single = cap(singular)
  const enums = fields.filter((f) => f.type === "enum")
    .map((f) => `export const ${optionsName(f)} = ${q(f.values)} as const\n`).join("")
  const imports = ['import { z } from "zod"']
  if (fields.some((f) => f.type === "phone")) imports.push(`import { phoneSchema } from ${q(krImport)}`)
  const body = `// ${label}: fields and validation rules, shared by the form, the mock backend and the API.
${enums}
export const ${singular}InputSchema = z.object({
${fields.map((f) => `  ${f.name}: ${zodFor(f)},`).join("\n")}
})

export type ${Single}Input = z.infer<typeof ${singular}InputSchema>
export type ${Single} = ${Single}Input & { id: string; createdAt: string; updatedAt: string }
`
  return { imports, body }
}

function schemaModule(resource, krImport) {
  const { imports, body } = schemaParts(resource, krImport)
  return `${imports.join("\n")}\n\n${body}`
}

// ---------------------------------------------------------------------------- resource

function genResource(resource) {
  Object.assign(state, resource)
  // Check every insertion point first, so a missing marker never leaves half a resource behind.
  const markers = [
    ...(web ? [["src/mocks/browser.ts", "handlers"], ["src/mocks/db.ts", "tables"], ["src/mocks/db.ts", "seed"]].map(([f, m]) => [join(web, f), m]) : []),
    ...(api ? [[join(api, "src/app.module.ts"), "modules"]] : []),
  ]
  for (const [file, marker] of markers) {
    if (!new RegExp(`^[ \\t]*// gen:${marker}\\b`, "m").test(readFileSync(file, "utf8"))) exit(`${file} lost its "// gen:${marker}" marker. Add the line back where new entries go.`)
  }
  const taken = [
    web && join(web, `src/entities/${resource.plural}/api.ts`),
    api && join(api, `src/${resource.plural}`),
    shared && join(shared, `${resource.plural}.ts`),
  ].filter((f) => f && existsSync(f))
  if (taken.length) exit(`already exists:\n  ${taken.join("\n  ")}`)
  const refs = resource.fields.filter((f) => f.type === "ref")
  for (const ref of refs) {
    const parentMock = web && join(web, `src/mocks/handlers/${ref.target}.ts`)
    if (parentMock && !/^[ \t]*\/\/ gen:cascade\b/m.test(readFileSync(parentMock, "utf8")))
      exit(`${parentMock} has no "// gen:cascade" line in its delete handler. Add it after the splice so deleting a ${ref.parent.label} deletes its ${resource.label}.`)
  }
  if (shared) genShared(resource)
  if (api) genApi(resource)
  if (web) genWeb(resource)
  edit("package.json", (source) => {
    const pkg = JSON.parse(source)
    pkg.slipway = { ...pkg.slipway, resources: { ...pkg.slipway?.resources, [resource.plural]: { singular: resource.singular, label: resource.label, fields: resource.spec } } }
    return JSON.stringify(pkg, null, 2) + "\n"
  })
}

function genShared(resource) {
  write(join(shared, `${resource.plural}.ts`), schemaModule(resource, "./kr.js"))
  edit(join(shared, "index.ts"), (source) => `${source}export * from "./${resource.plural}.js"\n`)
}

// ---- web

function genWeb(resource) {
  const { plural, singular, label } = resource
  const refs = resource.fields.filter((f) => f.type === "ref")
  const Single = cap(singular)
  const Plural = cap(plural)
  const src = join(web, "src")

  // Schema and queries. In the monorepo the schema comes from packages/shared.
  const schema = layout === "mono"
    ? { imports: [`import { ${singular}InputSchema, type ${Single}, type ${Single}Input } from "@slipway/shared/${plural}"`], body: `export * from "@slipway/shared/${plural}"\n` }
    : schemaParts(resource, "@/shared/lib/kr")
  write(join(src, `entities/${plural}/api.ts`), `import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
${schema.imports.join("\n")}

import { api, type Page } from "@/shared/api/client"

${schema.body}
/** One page, newest first. The API caps \`pageSize\` at 100. */
export const ${plural}Query = (page = 1, pageSize = 20) =>
  queryOptions({
    queryKey: [${q(plural)}, { page, pageSize }],
    queryFn: () => api<Page<${Single}>>(\`/api/${plural}?page=\${page}&pageSize=\${pageSize}\`),
  })

// ponytail: pages through the whole list on the client; past a few hundred rows, add server filters.
/** Every ${label}, all pages, newest first: for screens that count or join across the whole list. */
export const all${Plural}Query = () =>
  queryOptions({
    queryKey: [${q(plural)}, "all"],
    queryFn: async () => {
      const items: ${Single}[] = []
      for (let page = 1; ; page++) {
        const next = await api<Page<${Single}>>(\`/api/${plural}?page=\${page}&pageSize=100\`)
        items.push(...next.items)
        if (items.length >= next.total || next.items.length === 0) return items
      }
    },
  })

/** The input fields of a saved ${label}, for saving it again with one value changed. */
export const to${Single}Input = (row: ${Single}): ${Single}Input => ${singular}InputSchema.parse(row)

/** One ${label} by id, for a detail screen. Saving or deleting any ${label} refreshes it. */
export const ${singular}Query = (id: string) =>
  queryOptions({
    queryKey: [${q(plural)}, id],
    queryFn: () => api<${Single}>(\`/api/${plural}/\${id}\`),
  })

/** Creates when \`id\` is missing, updates otherwise. */
export function useSave${Single}() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ${Single}Input }) =>
      id
        ? api<${Single}>(\`/api/${plural}/\${id}\`, { method: "PATCH", json: input })
        : api<${Single}>("/api/${plural}", { method: "POST", json: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [${q(plural)}] }),
  })
}

export function useDelete${Plural}() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => api<void>(\`/api/${plural}/\${id}\`, { method: "DELETE" }))),
    onSuccess: (_, ids) => {
      // Drop the deleted rows' own queries first: refreshing them would only answer 404. Then refresh
      // everything: rows of other resources that pointed at them were deleted too.
      for (const id of ids) queryClient.removeQueries({ queryKey: [${q(plural)}, id] })
      return queryClient.invalidateQueries()
    },
  })
}
`)

  // Mock backend
  write(join(src, `mocks/handlers/${plural}.ts`), `import { HttpResponse, http } from "msw"

import { ${singular}InputSchema, type ${Single}${refs.length ? `, type ${Single}Input` : ""} } from "@/entities/${plural}/api"
import { db, save } from "../db"
import { API, currentUser, fail, parseBody } from "../http"

// Same routes and rules as the API: every row belongs to the signed-in user.
const mine = (userId: string) => db.${plural}.filter((row) => row.userId === userId)
const notFound = () => fail(404, ${q(particle(label, ["을", "를"]) + " 찾을 수 없습니다")})
${refs.length ? `// What a ${label} points at must exist and belong to the same user.
const missingRef = (userId: string, data: ${Single}Input) =>
${refs.map((f) => `  !db.${f.target}.some((row) => row.id === data.${f.name} && row.userId === userId)
    ? fail(400, "입력값을 확인해 주세요", { ${f.name}: ${q(particle(f.label, ["을", "를"]) + " 찾을 수 없습니다")} })
    :`).join("\n")} null
` : ""}
export const ${singular}Handlers = [
  http.get(\`\${API}/${plural}\`, ({ request }) => {
    const user = currentUser(request)
    if (user instanceof Response) return user
    const url = new URL(request.url)
    const page = Math.max(1, Math.floor(Number(url.searchParams.get("page"))) || 1)
    const pageSize = Math.min(100, Math.max(1, Math.floor(Number(url.searchParams.get("pageSize"))) || 20))
    const rows = mine(user.id).toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    return HttpResponse.json({ items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pageSize })
  }),

  http.get(\`\${API}/${plural}/:id\`, ({ request, params }) => {
    const user = currentUser(request)
    if (user instanceof Response) return user
    const row = mine(user.id).find((item) => item.id === params.id)
    return row ? HttpResponse.json(row) : notFound()
  }),

  http.post(\`\${API}/${plural}\`, async ({ request }) => {
    const user = currentUser(request)
    if (user instanceof Response) return user
    const { data, error } = await parseBody(request, ${singular}InputSchema)
    if (error) return error${refs.length ? "\n    const missing = missingRef(user.id, data)\n    if (missing) return missing" : ""}
    const now = new Date().toISOString()
    const row = { id: \`${singular}_\${crypto.randomUUID()}\`, userId: user.id, ...data, createdAt: now, updatedAt: now }
    db.${plural}.push(row)
    save()
    return HttpResponse.json(row, { status: 201 })
  }),

  http.patch(\`\${API}/${plural}/:id\`, async ({ request, params }) => {
    const user = currentUser(request)
    if (user instanceof Response) return user
    const row = mine(user.id).find((item) => item.id === params.id)
    if (!row) return notFound()
    const { data, error } = await parseBody(request, ${singular}InputSchema)
    if (error) return error${refs.length ? "\n    const missing = missingRef(user.id, data)\n    if (missing) return missing" : ""}
    Object.assign(row, data, { updatedAt: new Date().toISOString() })
    save()
    return HttpResponse.json(row)
  }),

  http.delete(\`\${API}/${plural}/:id\`, ({ request, params }) => {
    const user = currentUser(request)
    if (user instanceof Response) return user
    const index = db.${plural}.findIndex((item) => item.id === params.id && item.userId === user.id)
    if (index < 0) return notFound()
    db.${plural}.splice(index, 1)
    // gen:cascade
    save()
    return new HttpResponse(null, { status: 204 })
  }),
]

export type ${Single}Row = ${Single} & { userId: string }
`)
  addImport(join(src, "mocks/browser.ts"), `import { ${singular}Handlers } from "./handlers/${plural}"`)
  // Deleting the row a reference points at deletes the rows here too, like the API's foreign key.
  for (const ref of refs)
    above(join(src, `mocks/handlers/${ref.target}.ts`), "cascade", `    db.${plural} = db.${plural}.filter((row) => row.${ref.name} !== params.id)`)
  above(join(src, "mocks/browser.ts"), "handlers", `  ...${singular}Handlers,`)
  addImport(join(src, "mocks/db.ts"), `import type { ${Single}Row } from "./handlers/${plural}"`)
  above(join(src, "mocks/db.ts"), "tables", `  ${plural}: ${Single}Row[]`)
  above(join(src, "mocks/db.ts"), "seed", `    ${plural}: [],`)

  write(join(web, `e2e/${plural}-api.e2e.ts`), apiE2eSource(resource))
}

/** A value the field accepts, for tests. */
function sample(field, variant = "") {
  switch (field.type) {
    case "text": return `${field.label} ${variant || "샘플"}`
    case "textarea": return `${field.label} 내용 ${variant}`.trim()
    case "email": return "hello@example.com"
    case "phone": return "010-1234-5678"
    case "number": return 3
    case "won": return 15000
    case "date": return "2026-11-04"
    case "time": return "09:30"
    case "ref": return "" // replaced by a row the test creates first
    case "enum": return field.values[0]
  }
}

function apiE2eSource({ plural, label, fields }) {
  const valid = Object.fromEntries(fields.map((f) => [f.name, sample(f)]))
  // A reference needs a row to point at: the test creates one for the owner first.
  const refs = fields.filter((f) => f.type === "ref")
    .map((f) => ({ field: f.name, path: `/api/${f.target}`, body: Object.fromEntries(f.parent.fields.map((p) => [p.name, sample(p)])) }))
  const required = fields.find((f) => !f.optional)
  return `import { expect, test } from "@playwright/test"

// Generated by \`pnpm gen resource\`. The same requests the app sends, answered by the mock backend
// here and by the real API in the monorepo. Screen tests belong next to the screens you build.
test(${q(`${label} API: 로그인한 사용자 것만 저장·조회·수정·삭제한다`)}, async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true")
  const result = await page.evaluate(async ({ valid, refs }: { valid: Record<string, unknown>; refs: { field: string; path: string; body: unknown }[] }) => {
    const call = async <T,>(path: string, init: RequestInit = {}, token?: string) => {
      const response = await fetch(path, {
        ...init,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: \`Bearer \${token}\` } : {}) },
      })
      return { status: response.status, body: (response.status === 204 ? null : await response.json()) as T }
    }
    const guest = async () => (await call<{ token: string }>("/api/auth/guest", { method: "POST" })).body.token
    const owner = await guest()
    const other = await guest()
    for (const ref of refs) valid[ref.field] = (await call<{ id: string }>(ref.path, { method: "POST", body: JSON.stringify(ref.body) }, owner)).body.id
    const created = await call<{ id: string }>("/api/${plural}", { method: "POST", body: JSON.stringify(valid) }, owner)
    const id = created.body.id
    return {
      signedOut: (await call("/api/${plural}")).status,
      created: created.status,
      list: (await call<{ items: unknown[]; total: number }>("/api/${plural}?pageSize=1", {}, owner)).body,
      hidden: (await call(\`/api/${plural}/\${id}\`, {}, other)).status,
      invalid: await call<{ fields: Record<string, string> }>("/api/${plural}", { method: "POST", body: JSON.stringify({ ...valid, ${required.name}: ${required.type === "won" || required.type === "number" ? '"abc"' : '""'} }) }, owner),
      updated: (await call(\`/api/${plural}/\${id}\`, { method: "PATCH", body: JSON.stringify(valid) }, owner)).status,
      deleted: (await call(\`/api/${plural}/\${id}\`, { method: "DELETE" }, owner)).status,
      gone: (await call(\`/api/${plural}/\${id}\`, {}, owner)).status,
    }
  }, { valid: ${JSON.stringify(valid)}, refs: ${JSON.stringify(refs)} })
  expect(result).toMatchObject({ signedOut: 401, created: 201, hidden: 404, updated: 200, deleted: 204, gone: 404 })
  expect(result.list).toMatchObject({ total: 1, items: [expect.objectContaining({ id: expect.any(String) })] })
  expect(result.invalid.status).toBe(400)
  expect(result.invalid.body.fields.${required.name}).toEqual(expect.any(String))
})
`
}

// ---- api

function genApi(resource) {
  const { plural, singular, label, fields } = resource
  const Single = cap(singular)
  const Plural = cap(plural)
  const src = join(api, "src")
  const refs = fields.filter((f) => f.type === "ref")

  write(join(src, `contracts/${plural}.ts`), layout === "mono"
    ? `// The schema lives in packages/shared so the web app validates with the same rules.\nexport * from '@slipway/shared/${plural}';\n`
    : schemaModule(resource, "./kr.js"))

  // Table
  const column = (f) => {
    const name = sq(snake(f.name))
    const required = f.optional ? "" : ".notNull()"
    switch (f.type) {
      case "number": return `integer(${name})${required}`
      case "won": return `bigint(${name}, { mode: 'number' })${required}`
      case "date": return `date(${name}, { mode: 'string' })${required}`
      case "enum": return `text(${name}, { enum: ${optionsName(f)} }).notNull()`
      // Deleting the row it points at deletes this one too.
      case "ref": return `text(${name}).notNull().references(() => ${f.target}.id, { onDelete: 'cascade' })`
      default: return `text(${name}).notNull().default('')`
    }
  }
  const schemaFile = join(src, "db/schema.ts")
  const needs = ["index", "pgTable", "text", "timestamp", ...new Set(fields.map((f) => ({ number: "integer", won: "bigint", date: "date" })[f.type]).filter(Boolean))]
  edit(schemaFile, (source) => source.replace(/import \{([^}]+)\} from 'drizzle-orm\/pg-core';/, (_, names) => {
    const all = [...new Set([...names.split(",").map((n) => n.trim()).filter(Boolean), ...needs])].sort()
    return `import { ${all.join(", ")} } from 'drizzle-orm/pg-core';`
  }))
  const enumImports = fields.filter((f) => f.type === "enum").map(optionsName)
  if (enumImports.length) addImport(schemaFile, `import { ${enumImports.join(", ")} } from '../contracts/${plural}.js';`)
  edit(schemaFile, (source) => source.includes("// gen:tables") ? source : `${source.trimEnd()}\n\n// gen:tables\n`)
  above(schemaFile, "tables", `// ${label}. Every row belongs to one user; the service filters by it.
export const ${plural} = pgTable('${snake(plural)}', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
${fields.map((f) => `  ${f.name}: ${column(f)},`).join("\n")}
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // Lists read one user's rows newest first.
  index('${snake(plural)}_user_created_idx').on(t.userId, t.createdAt),
]);
`)

  const notFound = sq(particle(label, ["을", "를"]) + " 찾을 수 없습니다")
  write(join(src, `${plural}/${plural}.service.ts`), `import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq } from 'drizzle-orm';

import { newId } from '../common/crypto.js';
import { fail, type Page } from '../common/http.js';
import type { ${Single}Input } from '../contracts/${plural}.js';
import { DB, type Db } from '../db/client.js';
import { ${[plural, ...new Set(refs.map((f) => f.target))].join(", ")} } from '../db/schema.js';

/** ${label}. Every query is scoped to the signed-in user. */
@Injectable()
export class ${Plural}Service {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(
    userId: string,
    { page, pageSize }: { page: number; pageSize: number },
  ): Promise<Page<typeof ${plural}.$inferSelect>> {
    const mine = eq(${plural}.userId, userId);
    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(${plural})
        .where(mine)
        .orderBy(desc(${plural}.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db.select({ total: count() }).from(${plural}).where(mine),
    ]);
    return { items, total, page, pageSize };
  }

  async get(userId: string, id: string) {
    const [row] = await this.db
      .select()
      .from(${plural})
      .where(and(eq(${plural}.id, id), eq(${plural}.userId, userId)));
    if (!row) throw fail(404, ${notFound});
    return row;
  }

  async create(userId: string, input: ${Single}Input) {${refs.length ? "\n    await this.ownsRefs(userId, input);" : ""}
    const [row] = await this.db
      .insert(${plural})
      .values({ id: newId('${singular}'), userId, ...input })
      .returning();
    return row;
  }

  async update(userId: string, id: string, input: ${Single}Input) {${refs.length ? "\n    await this.ownsRefs(userId, input);" : ""}
    const [row] = await this.db
      .update(${plural})
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(${plural}.id, id), eq(${plural}.userId, userId)))
      .returning();
    if (!row) throw fail(404, ${notFound});
    return row;
  }

  async remove(userId: string, id: string) {
    const [row] = await this.db
      .delete(${plural})
      .where(and(eq(${plural}.id, id), eq(${plural}.userId, userId)))
      .returning({ id: ${plural}.id });
    if (!row) throw fail(404, ${notFound});
  }
${refs.length ? `
  /** What a ${label} points at must exist and belong to the same user. */
  private async ownsRefs(userId: string, input: ${Single}Input) {
${refs.map((f) => `    const [${f.name}Row] = await this.db
      .select({ id: ${f.target}.id })
      .from(${f.target})
      .where(and(eq(${f.target}.id, input.${f.name}), eq(${f.target}.userId, userId)));
    if (!${f.name}Row)
      throw fail(400, '입력값을 확인해 주세요', { ${f.name}: ${sq(particle(f.label, ["을", "를"]) + " 찾을 수 없습니다")} });`).join("\n")}
  }
` : ""}}
`)
  write(join(src, `${plural}/${plural}.controller.ts`), `import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import { pageQuery, parse } from '../common/http.js';
import type { User } from '../contracts/auth.js';
import { ${singular}InputSchema } from '../contracts/${plural}.js';
import { ${Plural}Service } from './${plural}.service.js';

@Controller('${plural}')
@UseGuards(AuthGuard)
export class ${Plural}Controller {
  constructor(@Inject(${Plural}Service) private readonly ${plural}: ${Plural}Service) {}

  @Get()
  list(@CurrentUser() user: User, @Query() query: unknown) {
    return this.${plural}.list(user.id, parse(pageQuery, query));
  }

  @Get(':id')
  get(@CurrentUser() user: User, @Param('id') id: string) {
    return this.${plural}.get(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() body: unknown) {
    return this.${plural}.create(user.id, parse(${singular}InputSchema, body));
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.${plural}.update(user.id, id, parse(${singular}InputSchema, body));
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.${plural}.remove(user.id, id);
  }
}
`)
  write(join(src, `${plural}/${plural}.module.ts`), `import { Module } from '@nestjs/common';

import { ${Plural}Controller } from './${plural}.controller.js';
import { ${Plural}Service } from './${plural}.service.js';

@Module({
  controllers: [${Plural}Controller],
  providers: [${Plural}Service],
})
export class ${Plural}Module {}
`)
  addImport(join(src, "app.module.ts"), `import { ${Plural}Module } from './${plural}/${plural}.module.js';`)
  above(join(src, "app.module.ts"), "modules", `    ${Plural}Module,`)

  const body = Object.fromEntries(fields.map((f) => [f.name, sample(f)]))
  const required = fields.find((f) => !f.optional)
  write(join(api, `test/${plural}.e2e-spec.ts`), `// Contract tests for ${label}, generated by \`pnpm gen resource\`.
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';

import { AppModule } from '../src/app.module.js';
import { setup } from '../src/setup.js';

let app: INestApplication<App>;
const api = () => request(app.getHttpServer());
const guest = async () =>
  \`Bearer \${(await api().post('/api/auth/guest').expect(200)).body.token}\`;
const valid = ${JSON.stringify(body, null, 2).replace(/\n/g, "\n")};
${refs.length ? `// A reference needs a row of the same user to point at: create it first.
const validFor = async (auth: string) => ({
  ...valid,
${refs.map((f) => `  ${f.name}: (await api().post('/api/${f.target}').set('Authorization', auth).send(${JSON.stringify(Object.fromEntries(f.parent.fields.map((p) => [p.name, sample(p)])))}).expect(201)).body.id,`).join("\n")}
});` : "const validFor = async (_auth: string) => valid;"}

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = setup(moduleRef.createNestApplication());
  await app.init();
});

afterAll(async () => {
  await app.close();
});

describe('${plural}', () => {
  it('requires a signed-in user', async () => {
    await api().get('/api/${plural}').expect(401);
  });

  it('creates, lists, updates and deletes the owner\\'s rows', async () => {
    const auth = await guest();
    const input = await validFor(auth);
    const created = await api()
      .post('/api/${plural}')
      .set('Authorization', auth)
      .send(input)
      .expect(201);
    expect(created.body).toMatchObject({ ...input, id: expect.any(String) });

    const list = await api().get('/api/${plural}').set('Authorization', auth).expect(200);
    expect(list.body).toMatchObject({ total: 1, page: 1, pageSize: 20 });
    expect(list.body.items).toHaveLength(1);

    await api()
      .patch(\`/api/${plural}/\${created.body.id}\`)
      .set('Authorization', auth)
      .send(input)
      .expect(200);
    await api()
      .delete(\`/api/${plural}/\${created.body.id}\`)
      .set('Authorization', auth)
      .expect(204);
    await api()
      .get(\`/api/${plural}/\${created.body.id}\`)
      .set('Authorization', auth)
      .expect(404);
  });

  it('hides rows from other users', async () => {
    const owner = await guest();
    // Build the input before starting the request: supertest binds the server per request.
    const input = await validFor(owner);
    const created = await api()
      .post('/api/${plural}')
      .set('Authorization', owner)
      .send(input)
      .expect(201);
    const other = await guest();
    await api()
      .get(\`/api/${plural}/\${created.body.id}\`)
      .set('Authorization', other)
      .expect(404);
    const list = await api().get('/api/${plural}').set('Authorization', other).expect(200);
    expect(list.body.total).toBe(0);
  });

  it('pages newest first and caps the page size', async () => {
    const auth = await guest();
    for (let i = 0; i < 3; i++) {
      const input = await validFor(auth);
      await api().post('/api/${plural}').set('Authorization', auth).send(input).expect(201);
    }
    const first = await api()
      .get('/api/${plural}?page=1&pageSize=2')
      .set('Authorization', auth)
      .expect(200);
    expect(first.body).toMatchObject({ total: 3, page: 1, pageSize: 2 });
    expect(first.body.items).toHaveLength(2);
    const second = await api()
      .get('/api/${plural}?page=2&pageSize=2')
      .set('Authorization', auth)
      .expect(200);
    expect(second.body.items).toHaveLength(1);
    await api()
      .get('/api/${plural}?pageSize=1000')
      .set('Authorization', auth)
      .expect(400);
  });

  it('rejects invalid input with a message on the field', async () => {
    // Sign in before starting the request: supertest binds the server per request.
    const auth = await guest();
    const res = await api()
      .post('/api/${plural}')
      .set('Authorization', auth)
      .send({ ...valid, ${required.name}: ${required.type === "won" || required.type === "number" ? "'abc'" : "''"} })
      .expect(400);
    expect(res.body.fields.${required.name}).toEqual(expect.any(String));
  });
});
`)

  // Migration: drizzle-kit reads the schema and writes SQL into drizzle/.
  const kit = packageBin(api, "drizzle-kit")
  const manual = `${shared ? "pnpm --filter @slipway/shared build && " : ""}pnpm --dir ${api} db:generate`
  if (!kit) {
    console.warn(`\nDependencies are not installed: run \`pnpm install\`, then \`${manual}\` for the migration.`)
    return
  }
  // The schema imports the shared package, which resolves to its built output.
  if (shared) pnpm(["--filter", "@slipway/shared", "build"])
  const migrations = join(api, "drizzle")
  const before = new Set(readdirSync(migrations))
  execFileSync(process.execPath, [kit, "generate", "--name", plural], { cwd: api, stdio: "inherit" })
  const added = readdirSync(migrations).filter((file) => !before.has(file))
  if (!added.some((file) => file.endsWith(".sql"))) exit(`drizzle-kit wrote no migration. Fix the error above, then run \`${manual}\`.`)
  created.push(...added.map((file) => join(migrations, file)))
}

// ---------------------------------------------------------------------------- run

const [command, ...rest] = process.argv.slice(2)
const created = []
if (command === "resource") genResource(parseArgs(rest))
else exit(USAGE)
format()
console.log(`created or updated:\n  ${[...new Set(created)].join("\n  ")}\n\nnext: pnpm verify`)

/** Formats the generated TypeScript with each package's own prettier config, when installed. */
function format() {
  for (const root of [web, api].filter(Boolean)) {
    const prettier = packageBin(root, "prettier")
    const prefix = root === "." ? "" : `${root}/`
    const files = created.filter((f) => /\.tsx?$/.test(f) && f.startsWith(prefix) && !(root === "." && f.startsWith("packages/")))
      .map((f) => f.slice(prefix.length))
    if (files.length && prettier) execFileSync(process.execPath, [prettier, "--write", "--log-level", "warn", ...new Set(files)], { cwd: root, stdio: "inherit" })
  }
}

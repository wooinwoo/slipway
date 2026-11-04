// pnpm gen app
// pnpm gen resource <plural> <한글 이름> --fields "<name>[?]:<type>[:<라벨>] ..." [--icon <LucideIcon>]
//
//   pnpm gen resource orders 주문 --fields "title:text:제목 amount:won:금액 status:enum(접수|배송|완료):상태 dueAt?:date:납기 memo?:textarea:메모"
//
// Types: text, textarea, email, phone, number, won, date, enum(a|b|c). `?` after the name makes it optional.
// Writes every layer the project has, from one field list:
//   web (react, mono):  src/api/<plural>.ts, mock handler + table, list/detail/form route, sidebar entry, e2e test
//   api (nest, mono):   zod contract, Drizzle table + migration, service/controller/module (scoped to the
//                       signed-in user), contract test
//   mono:               the zod schema lives once in packages/shared
// `gen app` adds the sign-in, sign-up and signed-in frame routes; `gen resource` runs it when missing.
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

function exit(message) {
  console.error(message)
  process.exit(1)
}

// ---------------------------------------------------------------------------- arguments

function parseArgs(args) {
  const options = {}
  const positional = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--fields" || args[i] === "--icon" || args[i] === "--singular") options[args[i].slice(2)] = args[++i]
    else if (args[i].startsWith("--")) exit(`unknown option ${args[i]}`)
    else positional.push(args[i])
  }
  const [plural, label] = positional
  if (!plural || !label) exit('usage: pnpm gen resource <plural> <한글 이름> --fields "..."')
  if (!/^[a-z][a-z0-9]*$/.test(plural)) exit(`"${plural}" must be lowercase letters and digits, like "orders"`)
  const singular = options.singular ?? (plural.endsWith("ies") ? `${plural.slice(0, -3)}y` : plural.replace(/s$/, ""))
  if (singular === plural || !/^[a-z][a-z0-9]*$/.test(singular)) exit(`can't derive a singular from "${plural}"; pass --singular`)
  const icon = options.icon ?? "LayoutList"
  if (!/^[A-Z][A-Za-z0-9]*$/.test(icon)) exit(`--icon takes a lucide icon name like "Receipt"`)
  const fields = (options.fields ?? `name:text:${label} 이름`).trim().split(/\s+/).map(parseField)
  if (new Set(fields.map((f) => f.name)).size !== fields.length) exit("field names must be unique")
  if (fields[0].type !== "text" || fields[0].optional) exit("the first field names the record: make it a required text field")
  return { plural, singular, label, fields, icon: `${icon}Icon` }
}

const TYPES = ["text", "textarea", "email", "phone", "number", "won", "date"]

function parseField(spec) {
  const match = /^([a-z][a-zA-Z0-9]*)(\?)?:(text|textarea|email|phone|number|won|date|enum\(([^)]+)\))(?::(.+))?$/.exec(spec)
  if (!match) exit(`bad field "${spec}". Use name[?]:type[:라벨] with type one of ${TYPES.join(", ")}, enum(a|b)`)
  const [, name, optional, type, values, label] = match
  if (["id", "userId", "createdAt", "updatedAt"].includes(name)) exit(`"${name}" is added automatically`)
  return {
    name,
    optional: !!optional,
    type: values ? "enum" : type,
    values: values?.split("|").map((v) => v.trim()).filter(Boolean),
    label: label ?? name,
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
    return source.slice(0, at) + text + "\n" + source.slice(at)
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

function nextRequirement(file) {
  const ids = [...readFileSync(file, "utf8").matchAll(/^## REQ-(\d+)\b/gm)].map((m) => Number(m[1]))
  return Math.max(0, ...ids) + 1
}

function addRequirement(dir, title, body) {
  const file = join(dir, "docs/requirements.md")
  const id = `REQ-${nextRequirement(file)}`
  edit(file, (source) => `${source.trimEnd()}\n\n## ${id} ${title}\n\n${body}\n`)
  return id
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
    case "enum": return `z.enum(${optionsName(field)})`
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
    ...(web && existsSync(join(web, "src/nav.ts")) ? [[join(web, "src/nav.ts"), "nav"]] : []),
    ...(api ? [[join(api, "src/app.module.ts"), "modules"]] : []),
  ]
  for (const [file, marker] of markers) {
    if (!new RegExp(`^[ \\t]*// gen:${marker}\\b`, "m").test(readFileSync(file, "utf8"))) exit(`${file} lost its "// gen:${marker}" marker. Add the line back where new entries go.`)
  }
  const taken = [
    web && join(web, `src/api/${resource.plural}.ts`),
    api && join(api, `src/${resource.plural}`),
    shared && join(shared, `${resource.plural}.ts`),
  ].filter((f) => f && existsSync(f))
  if (taken.length) exit(`already exists:\n  ${taken.join("\n  ")}`)
  if (web && !existsSync(join(web, "src/routes/_app.tsx"))) genApp()
  if (shared) genShared(resource)
  if (api) genApi(resource)
  if (web) genWeb(resource)
}

function genShared(resource) {
  write(join(shared, `${resource.plural}.ts`), schemaModule(resource, "./kr.js"))
  edit(join(shared, "index.ts"), (source) => `${source}export * from "./${resource.plural}.js"\n`)
}

// ---- web

function genWeb(resource) {
  const { plural, singular, label, fields, icon } = resource
  const Single = cap(singular)
  const Plural = cap(plural)
  const src = join(web, "src")

  // Schema and queries. In the monorepo the schema comes from packages/shared.
  const schema = layout === "mono"
    ? { imports: [`import type { ${Single}, ${Single}Input } from "@slipway/shared/${plural}"`], body: `export * from "@slipway/shared/${plural}"\n` }
    : schemaParts(resource, "@/lib/kr")
  write(join(src, `api/${plural}.ts`), `import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
${schema.imports.join("\n")}

import { api } from "./client"

${schema.body}
export const ${plural}Query = queryOptions({
  queryKey: [${q(plural)}],
  queryFn: () => api<${Single}[]>("/api/${plural}"),
})

/** Creates when \`id\` is missing, updates otherwise. */
export function useSave${Single}() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ${Single}Input }) =>
      id
        ? api<${Single}>(\`/api/${plural}/\${id}\`, { method: "PATCH", json: input })
        : api<${Single}>("/api/${plural}", { method: "POST", json: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ${plural}Query.queryKey }),
  })
}

export function useDelete${Plural}() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => api<void>(\`/api/${plural}/\${id}\`, { method: "DELETE" }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ${plural}Query.queryKey }),
  })
}
`)

  // Mock backend
  write(join(src, `mocks/handlers/${plural}.ts`), `import { HttpResponse, http } from "msw"

import { ${singular}InputSchema, type ${Single} } from "@/api/${plural}"
import { db, save } from "../db"
import { API, currentUser, fail, parseBody } from "../http"

// Same routes and rules as the API: every row belongs to the signed-in user.
const mine = (userId: string) => db.${plural}.filter((row) => row.userId === userId)
const notFound = () => fail(404, ${q(particle(label, ["을", "를"]) + " 찾을 수 없습니다")})

export const ${singular}Handlers = [
  http.get(\`\${API}/${plural}\`, ({ request }) => {
    const user = currentUser(request)
    if (user instanceof Response) return user
    return HttpResponse.json(mine(user.id).toSorted((a, b) => b.createdAt.localeCompare(a.createdAt)))
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
    if (error) return error
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
    if (error) return error
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
    save()
    return new HttpResponse(null, { status: 204 })
  }),
]

export type ${Single}Row = ${Single} & { userId: string }
`)
  addImport(join(src, "mocks/browser.ts"), `import { ${singular}Handlers } from "./handlers/${plural}"`)
  above(join(src, "mocks/browser.ts"), "handlers", `  ...${singular}Handlers,`)
  addImport(join(src, "mocks/db.ts"), `import type { ${Single}Row } from "./handlers/${plural}"`)
  above(join(src, "mocks/db.ts"), "tables", `  ${plural}: ${Single}Row[]`)
  above(join(src, "mocks/db.ts"), "seed", `    ${plural}: [],`)

  // Screen
  const req = addRequirement(web, `${label} 관리`, `${particle(label, ["을", "를"])} 목록에서 찾고, 추가·수정·삭제한다. 입력이 틀리면 해당 칸에 이유를 보여 준다. 다른 사용자의 ${label}은 보이지 않는다.`)
  write(join(src, `routes/_app/${plural}/index.tsx`), routeSource(resource, req))
  addImport(join(src, "nav.ts"), `import { ${icon} } from "lucide-react"`)
  edit(join(src, "nav.ts"), (s) => mergeLucide(s))
  above(join(src, "nav.ts"), "nav", `  { to: "/${plural}", label: ${q(label)}, icon: ${icon} },`)
  write(join(web, `e2e/${plural}.e2e.ts`), e2eSource(resource, req))
}

/** Folds repeated `import { X } from "lucide-react"` lines into one. */
function mergeLucide(source) {
  const lines = [...source.matchAll(/^import \{([^}]+)\} from "lucide-react"\n/gm)]
  if (lines.length < 2) return source
  const names = [...new Set(lines.flatMap((m) => m[1].split(",").map((n) => n.trim()).filter(Boolean)))].sort()
  let out = source
  for (const m of lines.slice(1)) out = out.replace(m[0], "")
  return out.replace(lines[0][0], `import { ${names.join(", ")} } from "lucide-react"\n`)
}

function routeSource({ plural, singular, label, fields }, req) {
  const Single = cap(singular)
  const Plural = cap(plural)
  const first = fields[0]
  const has = (type) => fields.some((f) => f.type === type)
  const enums = fields.filter((f) => f.type === "enum")
  const display = (f, row) => {
    const v = `${row}.${f.name}`
    switch (f.type) {
      case "won": return f.optional ? `${v} == null ? "—" : formatWon(${v})` : `formatWon(${v})`
      case "number": return f.optional ? `${v} ?? "—"` : v
      case "enum": return `<Badge variant="outline">{${v}}</Badge>`
      default: return f.optional ? `${v} || "—"` : v
    }
  }
  const cell = (f) => {
    const value = display(f, "row")
    if (f.type === "enum") return value
    if (f.type === "won" || f.type === "number") return `<span className="tabular">{${value}}</span>`
    return `${value}`
  }
  const columns = fields.filter((f) => f.type !== "textarea").map((f) => `  {
    key: ${q(f.name)},
    title: ${q(f.label)},
    render: (row) => ${cell(f).startsWith("<") ? cell(f) : `(${cell(f)})`},
    sortValue: (row) => row.${f.name},
  },`).join("\n")
  const formField = (f) => {
    const base = `{ key: ${q(f.name)}, label: ${q(f.label)}`
    switch (f.type) {
      case "textarea": return `${base}, type: "textarea", wide: true }`
      case "email": return `${base}, type: "email" }`
      case "enum": return `${base}, options: ${optionsName(f)}.map((value) => ({ value, label: value })) }`
      case "phone": return `${base}, render: (value, onChange, id) => <PhoneInput id={id} value={value} onChange={onChange} /> }`
      case "won": return `${base}, render: (value, onChange, id) => <WonInput id={id} value={value === "" ? 0 : Number(value)} onChange={(next) => onChange(String(next))} /> }`
      case "number": return `${base}, render: (value, onChange, id) => <Input id={id} type="number" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} /> }`
      case "date": return `${base}, render: (value, onChange, id) => <Input id={id} type="date" value={value} onChange={(event) => onChange(event.target.value)} /> }`
      default: return base + " }"
    }
  }
  const toForm = (f) => {
    switch (f.type) {
      case "number": case "won": return `${f.name}: row?.${f.name} == null ? "" : String(row.${f.name}),`
      case "enum": return `${f.name}: row?.${f.name} ?? ${optionsName(f)}[0],`
      default: return `${f.name}: row?.${f.name} ?? "",`
    }
  }
  const fromForm = (f) => {
    switch (f.type) {
      case "number": case "won": return `${f.name}: values.${f.name} === "" ? ${f.optional ? "null" : "undefined"} : Number(values.${f.name}),`
      case "date": return `${f.name}: values.${f.name} === "" ? ${f.optional ? "null" : "undefined"} : values.${f.name},`
      default: return `${f.name}: values.${f.name},`
    }
  }
  const searchable = fields.filter((f) => ["text", "email", "phone", "enum"].includes(f.type))
  const imports = [
    `import { useSuspenseQuery } from "@tanstack/react-query"`,
    `import { createFileRoute } from "@tanstack/react-router"`,
    `import { PlusIcon } from "lucide-react"`,
    `import { useState } from "react"`,
    `import { toast } from "sonner"`,
    `import type { z } from "zod"`,
    ``,
    `import { ApiError } from "@/api/client"`,
    `import {\n  ${[...enums.map(optionsName), `${plural}Query`, `${singular}InputSchema`, `useDelete${Plural}`, `useSave${Single}`, `type ${Single}`].join(",\n  ")},\n} from "@/api/${plural}"`,
    has("phone") || has("won") ? `import { ${[has("phone") && "PhoneInput", has("won") && "WonInput"].filter(Boolean).join(", ")} } from "@/components/kr-inputs"` : null,
    `import { PageHeader } from "@/components/page-header"`,
    enums.length ? `import { Badge } from "@/components/ui/badge"` : null,
    `import { Button } from "@/components/ui/button"`,
    `import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"`,
    has("number") || has("date") ? `import { Input } from "@/components/ui/input"` : null,
    has("won") ? `import { formatWon } from "@/lib/kr"` : null,
    `import { AdvancedTable, type AdvancedColumn } from "@/patterns/advanced-table"`,
    `import { AsyncState } from "@/patterns/async-state"`,
    `import { ConfirmAction } from "@/patterns/confirm-action"`,
    `import { SearchInput } from "@/patterns/data-table"`,
    `import { DetailPanel } from "@/patterns/detail-panel"`,
    `import { RecordForm, type FormFailure, type RecordField } from "@/patterns/record-form"`,
  ].filter((line) => line !== null).join("\n")
  const newLabel = `새 ${label}`
  return `// ${req} ${label} 관리
${imports}

export const Route = createFileRoute("/_app/${plural}/")({
  staticData: { title: ${q(label)} },
  loader: ({ context }) => context.queryClient.ensureQueryData(${plural}Query),
  component: ${Plural}Page,
})

type Values = Record<${fields.map((f) => q(f.name)).join(" | ")}, string>

const columns: AdvancedColumn<${Single}>[] = [
${columns}
]

const formFields: RecordField<Values>[] = [
${fields.map((f) => `  ${formField(f)},`).join("\n")}
]

const toForm = (row?: ${Single}): Values => ({
${fields.map((f) => `  ${toForm(f)}`).join("\n")}
})

const fromForm = (values: Values) => ({
${fields.map((f) => `  ${fromForm(f)}`).join("\n")}
})

function invalid(error: z.ZodError): FormFailure {
  return {
    message: "입력값을 확인해 주세요",
    fields: Object.fromEntries(error.issues.map((issue) => [issue.path.join("."), issue.message])),
  }
}

function failure(error: unknown): FormFailure {
  return error instanceof ApiError
    ? { message: error.message, fields: error.fields }
    : { message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }
}

function ${Plural}Page() {
  const { data: rows } = useSuspenseQuery(${plural}Query)
  const [query, setQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [opened, setOpened] = useState<${Single}>()
  const [editing, setEditing] = useState<${Single} | "new">()
  const save = useSave${Single}()
  const remove = useDelete${Plural}()

  const needle = query.trim().toLowerCase()
  const visible = needle
    ? rows.filter((row) => [${searchable.map((f) => `row.${f.name}`).join(", ")}].some((value) => value?.toLowerCase().includes(needle)))
    : rows
  const create = <Button onClick={() => setEditing("new")}><PlusIcon />${newLabel}</Button>

  return (
    <div className="grid gap-6">
      <PageHeader title=${q(label)} actions={rows.length > 0 && create} />
      {rows.length === 0 ? (
        <AsyncState empty emptyTitle=${q(`아직 ${particle(label, ["이", "가"])} 없습니다`)} emptyDescription=${q(`첫 ${particle(label, ["을", "를"])} 추가해 보세요.`)} emptyAction={create}>
          {null}
        </AsyncState>
      ) : (
        <div className="grid gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder=${q(`${label} 검색`)} />
          <AdvancedTable
            rows={visible}
            columns={columns}
            onOpen={setOpened}
            rowLabel={(row) => row.${first.name}}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            actions={[
              {
                id: "delete",
                label: "삭제",
                destructive: true,
                run: async (selected) => {
                  await remove.mutateAsync(selected.map((row) => row.id))
                  toast.success(\`\${selected.length}개를 삭제했습니다\`)
                },
              },
            ]}
          />
        </div>
      )}

      <DetailPanel
        open={!!opened}
        onOpenChange={(open) => !open && setOpened(undefined)}
        title={opened?.${first.name}}
        description=${q(`${label} 상세`)}
        fields={
          opened
            ? [
${fields.slice(1).map((f) => `                { label: ${q(f.label)}, value: ${display(f, "opened").startsWith("<") ? display(f, "opened") : display(f, "opened")} },`).join("\n")}
              ]
            : []
        }
        actions={
          opened && (
            <>
              <Button variant="outline" onClick={() => { setEditing(opened); setOpened(undefined) }}>수정</Button>
              <ConfirmAction
                trigger={<Button variant="destructive">삭제</Button>}
                title=${q(`${particle(label, ["을", "를"])} 삭제할까요?`)}
                description="삭제하면 되돌릴 수 없습니다."
                confirmLabel="삭제"
                destructive
                run={async () => {
                  await remove.mutateAsync([opened.id])
                  setOpened(undefined)
                  toast.success("삭제했습니다")
                }}
              />
            </>
          )
        }
      />

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(undefined)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? ${q(newLabel)} : ${q(`${label} 수정`)}}</DialogTitle>
            <DialogDescription>저장하면 목록에 바로 반영됩니다.</DialogDescription>
          </DialogHeader>
          {editing && (
            <RecordForm
              key={editing === "new" ? "new" : editing.id}
              initial={toForm(editing === "new" ? undefined : editing)}
              fields={formFields}
              cancel={() => setEditing(undefined)}
              submit={async (values) => {
                const parsed = ${singular}InputSchema.safeParse(fromForm(values))
                if (!parsed.success) return invalid(parsed.error)
                try {
                  await save.mutateAsync({ id: editing === "new" ? undefined : editing.id, input: parsed.data })
                } catch (error) {
                  return failure(error)
                }
                setEditing(undefined)
                toast.success("저장했습니다")
                return undefined
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
`
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
    case "enum": return field.values[0]
  }
}

function e2eSource({ plural, label, fields }, req) {
  const first = fields[0]
  const fill = fields.filter((f) => f.type !== "enum").map((f) => {
    const value = f.type === "won" ? "15000" : String(sample(f))
    return `  await dialog.getByLabel(${q(f.label)}, { exact: true }).fill(${q(value)})`
  }).join("\n")
  const firstMessage = particle(first.label, ["을", "를"]) + " 입력하세요"
  const renamed = first.type === "text" ? sample(first, "수정") : null
  return `import { expect, test } from "@playwright/test"

// Generated by \`pnpm gen resource\`. Runs against the mock backend and, in the monorepo, the real API.
test(${q(`${req} ${label}: 추가, 검증, 수정, 삭제`)}, async ({ page }) => {
  await page.goto("/${plural}")
  await page.getByRole("button", { name: "가입 없이 둘러보기" }).click()
  await expect(page.getByRole("heading", { name: ${q(label)}, level: 1 })).toBeVisible()
  await expect(page.getByText(${q(`아직 ${particle(label, ["이", "가"])} 없습니다`)})).toBeVisible()

  await page.getByRole("button", { name: ${q(`새 ${label}`)} }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: "저장", exact: true }).click()
  await expect(dialog.getByText(${q(firstMessage)})).toBeVisible()

${fill}
  await dialog.getByRole("button", { name: "저장", exact: true }).click()
  await expect(dialog).toBeHidden()
  const name = ${q(String(sample(first)))}
  await expect(page.getByRole("button", { name, exact: true })).toBeVisible()
${renamed ? `
  await page.getByRole("button", { name, exact: true }).click()
  await page.getByRole("dialog").getByRole("button", { name: "수정" }).click()
  await page.getByRole("dialog").getByLabel(${q(first.label)}, { exact: true }).fill(${q(renamed)})
  await page.getByRole("dialog").getByRole("button", { name: "저장", exact: true }).click()
  await expect(page.getByRole("button", { name: ${q(renamed)}, exact: true })).toBeVisible()
` : ""}
  await page.getByRole("button", { name: ${renamed ? q(renamed) : "name"}, exact: true }).click()
  await page.getByRole("dialog").getByRole("button", { name: "삭제" }).click()
  await page.getByRole("alertdialog").getByRole("button", { name: "삭제" }).click()
  await expect(page.getByText(${q(`아직 ${particle(label, ["이", "가"])} 없습니다`)})).toBeVisible()
})
`
}

// ---- api

function genApi(resource) {
  const { plural, singular, label, fields } = resource
  const Single = cap(singular)
  const Plural = cap(plural)
  const src = join(api, "src")

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
      default: return `text(${name}).notNull().default('')`
    }
  }
  const schemaFile = join(src, "db/schema.ts")
  const needs = ["pgTable", "text", "timestamp", ...new Set(fields.map((f) => ({ number: "integer", won: "bigint", date: "date" })[f.type]).filter(Boolean))]
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
});
`)

  const notFound = sq(particle(label, ["을", "를"]) + " 찾을 수 없습니다")
  write(join(src, `${plural}/${plural}.service.ts`), `import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';

import { newId } from '../common/crypto.js';
import { fail } from '../common/http.js';
import type { ${Single}Input } from '../contracts/${plural}.js';
import { DB, type Db } from '../db/client.js';
import { ${plural} } from '../db/schema.js';

/** ${label}. Every query is scoped to the signed-in user. */
@Injectable()
export class ${Plural}Service {
  constructor(@Inject(DB) private readonly db: Db) {}

  list(userId: string) {
    return this.db
      .select()
      .from(${plural})
      .where(eq(${plural}.userId, userId))
      .orderBy(desc(${plural}.createdAt));
  }

  async get(userId: string, id: string) {
    const [row] = await this.db
      .select()
      .from(${plural})
      .where(and(eq(${plural}.id, id), eq(${plural}.userId, userId)));
    if (!row) throw fail(404, ${notFound});
    return row;
  }

  async create(userId: string, input: ${Single}Input) {
    const [row] = await this.db
      .insert(${plural})
      .values({ id: newId('${singular}'), userId, ...input })
      .returning();
    return row;
  }

  async update(userId: string, id: string, input: ${Single}Input) {
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
}
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
  UseGuards,
} from '@nestjs/common';

import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import { parse } from '../common/http.js';
import type { User } from '../contracts/auth.js';
import { ${singular}InputSchema } from '../contracts/${plural}.js';
import { ${Plural}Service } from './${plural}.service.js';

@Controller('${plural}')
@UseGuards(AuthGuard)
export class ${Plural}Controller {
  constructor(@Inject(${Plural}Service) private readonly ${plural}: ${Plural}Service) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.${plural}.list(user.id);
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
    const created = await api()
      .post('/api/${plural}')
      .set('Authorization', auth)
      .send(valid)
      .expect(201);
    expect(created.body).toMatchObject({ ...valid, id: expect.any(String) });

    const list = await api().get('/api/${plural}').set('Authorization', auth).expect(200);
    expect(list.body).toHaveLength(1);

    await api()
      .patch(\`/api/${plural}/\${created.body.id}\`)
      .set('Authorization', auth)
      .send(valid)
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
    const created = await api()
      .post('/api/${plural}')
      .set('Authorization', owner)
      .send(valid)
      .expect(201);
    const other = await guest();
    await api()
      .get(\`/api/${plural}/\${created.body.id}\`)
      .set('Authorization', other)
      .expect(404);
    const list = await api().get('/api/${plural}').set('Authorization', other).expect(200);
    expect(list.body).toHaveLength(0);
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
  const kit = join(api, "node_modules/.bin/drizzle-kit")
  const manual = `${shared ? "pnpm --filter @slipway/shared build && " : ""}pnpm --dir ${api} db:generate`
  if (!existsSync(kit)) {
    console.warn(`\nDependencies are not installed: run \`pnpm install\`, then \`${manual}\` for the migration.`)
    return
  }
  // The schema imports the shared package, which resolves to its built output.
  if (shared) pnpm(["--filter", "@slipway/shared", "build"])
  const migrations = join(api, "drizzle")
  const before = new Set(readdirSync(migrations))
  execFileSync(resolve(kit), ["generate", "--name", plural], { cwd: api, stdio: "inherit" })
  const added = readdirSync(migrations).filter((file) => !before.has(file))
  if (!added.some((file) => file.endsWith(".sql"))) exit(`drizzle-kit wrote no migration. Fix the error above, then run \`${manual}\`.`)
  created.push(...added.map((file) => join(migrations, file)))
}

// ---------------------------------------------------------------------------- app frame

function genApp() {
  const src = join(web, "src")
  if (existsSync(join(src, "routes/_app.tsx"))) exit(`${join(src, "routes/_app.tsx")} already exists; the app frame is in place.`)
  const req = addRequirement(web, "로그인과 앱 틀", "이메일·카카오·네이버·게스트로 로그인하고, 로그인한 사용자만 앱 화면에 들어온다. 로그인 후 원래 가려던 페이지로 돌아간다.")

  write(join(src, "routes/login.tsx"), `// ${req} 로그인과 앱 틀
import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { z } from "zod"

import { useGuestLogin, useLogin, useSocialLogin } from "@/api/auth"
import { ApiError, BASE_URL } from "@/api/client"
import { isDemo, product } from "@/config"
import { AuthCard, AuthDivider, GuestButton, LoginForm, SocialButtons } from "@/patterns/auth-forms"

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  staticData: { title: "로그인" },
  component: LoginPage,
})

export const failure = (error: unknown) =>
  error instanceof ApiError
    ? { message: error.message, fields: error.fields }
    : { message: "잠시 후 다시 시도해 주세요." }

function LoginPage() {
  const { redirect: next } = Route.useSearch()
  const router = useRouter()
  const done = () => router.history.push(next ?? "/")
  const login = useLogin()
  const guest = useGuestLogin()
  const social = useSocialLogin()

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <AuthCard
        title={product.name}
        description="계정으로 계속하거나 가입 없이 둘러보세요."
        footer={
          <>
            처음이신가요?{" "}
            <Link to="/signup" className="font-medium text-foreground underline underline-offset-4">
              회원가입
            </Link>
          </>
        }
      >
        <SocialButtons
          pending={social.isPending ? social.variables : null}
          onSelect={(provider) =>
            // The real API redirects to the provider and back to /auth/callback; the mock signs in directly.
            isDemo ? social.mutate(provider, { onSuccess: done }) : location.assign(\`\${BASE_URL}/api/auth/\${provider}\`)
          }
        />
        <AuthDivider>또는 이메일로</AuthDivider>
        <LoginForm
          demo={isDemo ? { email: "demo@slipway.dev", password: "demo1234" } : undefined}
          submit={(values) => login.mutateAsync(values).then(() => void done(), failure)}
        />
        <GuestButton pending={guest.isPending} onClick={() => guest.mutate(undefined, { onSuccess: done })} />
      </AuthCard>
    </main>
  )
}
`)
  write(join(src, "routes/signup.tsx"), `// ${req} 로그인과 앱 틀
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"

import { useSignup } from "@/api/auth"
import { AuthCard, SignupForm } from "@/patterns/auth-forms"
import { failure } from "./login"

export const Route = createFileRoute("/signup")({
  staticData: { title: "회원가입" },
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const signup = useSignup()
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <AuthCard
        title="계정 만들기"
        footer={
          <>
            이미 계정이 있나요?{" "}
            <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
              로그인
            </Link>
          </>
        }
      >
        <SignupForm submit={(values) => signup.mutateAsync(values).then(() => void navigate({ to: "/" }), failure)} />
      </AuthCard>
    </main>
  )
}
`)
  write(join(src, "routes/_app.tsx"), `// ${req} 로그인과 앱 틀
import { Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router"

import { meQuery, useLogout } from "@/api/auth"
import { token } from "@/api/client"
import { product } from "@/config"
import { nav } from "@/nav"
import { AppShell } from "@/patterns/app-shell"

// Every route under src/routes/_app/ requires a signed-in user.
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(meQuery).catch(() => null)
    if (!user) {
      token.clear()
      throw redirect({ to: "/login", search: { redirect: location.href } })
    }
    return { user }
  },
  component: AppLayout,
})

function AppLayout() {
  const { user } = Route.useRouteContext()
  const logout = useLogout()
  const navigate = useNavigate()
  return (
    <AppShell
      brand={product.name}
      nav={nav}
      user={user}
      onLogout={() => logout.mutate(undefined, { onSettled: () => navigate({ to: "/login" }) })}
    >
      <Outlet />
    </AppShell>
  )
}
`)
  write(join(src, "nav.ts"), `import type { NavItem } from "@/patterns/app-shell"

// Sidebar and Ctrl/⌘+K entries. \`pnpm gen resource\` adds a line above the marker.
export const nav: NavItem[] = [
  // gen:nav
]
`)
  // The blank start page now sends people into the first menu page.
  const index = join(src, "routes/index.tsx")
  if (readFileSync(index, "utf8").includes("Intentionally empty.")) {
    writeFileSync(index, `import { createFileRoute, redirect } from "@tanstack/react-router"

import { nav } from "@/nav"

// Into the first menu page; its guard sends signed-out visitors to /login.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (nav[0]) throw redirect({ to: nav[0].to })
  },
  component: () => <main className="min-h-svh" />,
})
`)
    created.push(index)
  }
  write(join(web, "e2e/auth.e2e.ts"), `import { expect, test } from "@playwright/test"

// Generated by \`pnpm gen app\`.
test(${q(`${req} 로그인과 앱 틀: 잘못된 비밀번호를 알리고, 로그인하면 원래 페이지로 돌아간다`)}, async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel("이메일").fill("demo@slipway.dev")
  await page.getByLabel("비밀번호").fill("wrong-password")
  await page.getByRole("button", { name: "로그인", exact: true }).click()
  await expect(page.getByRole("alert")).toBeVisible()

  await page.getByRole("button", { name: "가입 없이 둘러보기" }).click()
  await expect(page).not.toHaveURL(/\\/login/)
})
`)
}

// ---------------------------------------------------------------------------- run

const [command, ...rest] = process.argv.slice(2)
const created = []
if (command === "app") {
  if (!web) exit("`gen app` needs a web app (react or mono preset).")
  genApp()
} else if (command === "resource") {
  genResource(parseArgs(rest))
} else {
  exit('usage:\n  pnpm gen app\n  pnpm gen resource <plural> <한글 이름> --fields "title:text:제목 amount:won:금액 ..."')
}
format()
console.log(`created or updated:\n  ${[...new Set(created)].join("\n  ")}\n\nnext: pnpm verify`)

/** Formats the generated TypeScript with each package's own prettier config, when installed. */
function format() {
  for (const root of [web, api].filter(Boolean)) {
    const prettier = join(root, "node_modules/.bin/prettier")
    const prefix = root === "." ? "" : `${root}/`
    const files = created.filter((f) => /\.tsx?$/.test(f) && f.startsWith(prefix) && !(root === "." && f.startsWith("packages/")))
      .map((f) => f.slice(prefix.length))
    if (files.length && existsSync(prettier)) execFileSync(resolve(prettier), ["--write", "--log-level", "warn", ...new Set(files)], { cwd: root, stdio: "inherit" })
  }
}

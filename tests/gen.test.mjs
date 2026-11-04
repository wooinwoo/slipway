import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import test from "node:test"
import { createProject } from "../scripts/create-project.mjs"

// File-level checks without installing dependencies. Compiling and running the generated code is
// covered by generating into a real project and running its `pnpm verify`.
async function project(t, preset) {
  const root = await mkdtemp(join(tmpdir(), "slipway-gen-test-"))
  t.after(async () => {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()))
    assert.ok(basename(root).startsWith("slipway-gen-test-"))
    await rm(root, { recursive: true, force: true })
  })
  const target = join(root, "app")
  await createProject(target, { preset })
  return target
}

const fields = "title:text:주문_이름 phone?:phone:연락처 amount:won:금액 status:enum(접수|완료):상태 dueAt?:date:납기 pickupAt:time:수령_시각 memo?:textarea:메모"
const gen = (cwd, ...args) => execFileSync(process.execPath, ["scripts/gen.mjs", ...args], { cwd, encoding: "utf8", stdio: "pipe" })
const read = (cwd, file) => readFile(join(cwd, file), "utf8")

for (const preset of ["react", "nest"]) {
  test(`${preset}: installed package CLIs run with Node, including paths containing spaces`, async t => {
    const cwd = await project(t, preset)
    for (const name of preset === "nest" ? ["prettier", "drizzle-kit"] : ["prettier"]) {
      const folder = join(cwd, "node_modules", name)
      await mkdir(folder, { recursive: true })
      await writeFile(join(folder, "package.json"), JSON.stringify({ name, bin: { [name]: "cli with space.cjs" } }))
      await writeFile(join(folder, "cli with space.cjs"), `
        const fs = require("node:fs");
        fs.writeFileSync(${JSON.stringify(name + "-run.json")}, JSON.stringify(process.argv.slice(2)));
        ${name === "drizzle-kit" ? 'fs.writeFileSync("drizzle/0001_generated.sql", "-- generated\\n");' : ""}
      `)
    }
    gen(cwd, "resource", "records", "기록", "--fields", "title:text:제목")
    assert.deepEqual(JSON.parse(await read(cwd, "prettier-run.json")).slice(0, 3), ["--write", "--log-level", "warn"])
    if (preset === "nest") {
      assert.deepEqual(JSON.parse(await read(cwd, "drizzle-kit-run.json")), ["generate", "--name", "records"])
      assert.match(await read(cwd, "drizzle/0001_generated.sql"), /generated/)
    }
  })
}

test("react: data layer only, no screens", async t => {
  const cwd = await project(t, "react")
  gen(cwd, "resource", "orders", "주문", "--fields", fields)
  assert.match(await read(cwd, "src/entities/orders/api.ts"), /export const orderInputSchema = z\.object/)
  assert.match(await read(cwd, "src/entities/orders/api.ts"), /title: z\.string\(\)\.trim\(\)\.min\(1, "주문 이름을 입력하세요"\)/)
  assert.match(await read(cwd, "src/entities/orders/api.ts"), /export function useSaveOrder\(\)/)
  assert.match(await read(cwd, "src/entities/orders/api.ts"), /export const orderQuery = \(id: string\) =>/)
  assert.match(await read(cwd, "src/entities/orders/api.ts"), /export const allOrdersQuery = \(\) =>/)
  assert.match(await read(cwd, "src/entities/orders/api.ts"), /removeQueries\(\{ queryKey: \["orders", id\] \}\)/)
  assert.match(await read(cwd, "src/entities/orders/api.ts"), /pickupAt: z\.string\(\)\.regex\(\/\^\(\[01\]\\d\|2\[0-3\]\):\[0-5\]\\d\$\/, "수령 시각을 입력하세요"\)/)
  assert.match(await read(cwd, "src/mocks/browser.ts"), /\.\.\.orderHandlers,\n\s+\/\/ gen:handlers/)
  assert.match(await read(cwd, "src/mocks/db.ts"), /orders: OrderRow\[\]/)
  // The data layer is the entity; the mock endpoints are app-level wiring.
  assert.match(await read(cwd, "src/mocks/handlers/orders.ts"), /export const orderHandlers = \[/)
  assert.match(await read(cwd, "src/mocks/browser.ts"), /from "\.\/handlers\/orders"/)
  assert.match(await read(cwd, "e2e/orders-api.e2e.ts"), /fetch\(path/)
  // Screens are assembled from src/shared/patterns/ by whoever builds the app.
  assert.deepEqual((await readdir(join(cwd, "src/routes"))).sort(), ["__root.tsx", "auth", "index.tsx"])
  assert.doesNotMatch(await read(cwd, "docs/requirements.md"), /^## REQ-/m)
  const manifest = JSON.parse(await read(cwd, "package.json"))
  assert.equal(manifest.scripts.gen, "node scripts/gen.mjs")
})

test("nest: table, scoped CRUD module and contract test", async t => {
  const cwd = await project(t, "nest")
  gen(cwd, "resource", "orders", "주문", "--fields", fields)
  const schema = await read(cwd, "src/db/schema.ts")
  assert.match(schema, /export const orders = pgTable\('orders'/)
  assert.match(schema, /amount: bigint\('amount', \{ mode: 'number' \}\)\.notNull\(\)/)
  assert.match(schema, /dueAt: date\('due_at', \{ mode: 'string' \}\),/)
  assert.match(await read(cwd, "src/app.module.ts"), /OrdersModule,\n\s+\/\/ gen:modules/)
  assert.match(await read(cwd, "src/orders/orders.service.ts"), /eq\(orders\.userId, userId\)/)
  assert.match(await read(cwd, "test/orders.e2e-spec.ts"), /hides rows from other users/)
  await assert.rejects(readdir(join(cwd, "src/routes")))
})

test("mono: the schema lives once in packages/shared", async t => {
  const cwd = await project(t, "mono")
  gen(cwd, "resource", "orders", "주문", "--fields", fields)
  assert.match(await read(cwd, "packages/shared/src/orders.ts"), /export const orderInputSchema/)
  assert.match(await read(cwd, "packages/shared/src/index.ts"), /export \* from "\.\/orders\.js"/)
  assert.match(await read(cwd, "apps/api/src/contracts/orders.ts"), /export \* from '@slipway\/shared\/orders'/)
  assert.match(await read(cwd, "apps/web/src/entities/orders/api.ts"), /export \* from "@slipway\/shared\/orders"/)
  assert.doesNotMatch(await read(cwd, "apps/web/src/entities/orders/api.ts"), /z\.object/)
})

test("a reference checks its target, deletes with it, and tests against a row it creates", async t => {
  const cwd = await project(t, "react")
  assert.throws(() => gen(cwd, "resource", "bookings", "예약", "--fields", "classId:ref(classes):수업"), /isn't generated yet/)
  gen(cwd, "resource", "classes", "수업", "--fields", "title:text:수업명")
  gen(cwd, "resource", "bookings", "예약", "--fields", "memberName:text:회원명 classId:ref(classes):수업")
  const api = await read(cwd, "src/entities/bookings/api.ts")
  assert.match(api, /classId: z\.string\(\)\.trim\(\)\.min\(1, "수업을 고르세요"\)/)
  const mock = await read(cwd, "src/mocks/handlers/bookings.ts")
  assert.match(mock, /!db\.classes\.some\(\s*\(row\) => row\.id === data\.classId && row\.userId === userId\s*\)/)
  assert.match(await read(cwd, "src/mocks/handlers/classes.ts"), /db\.bookings = db\.bookings\.filter\(\s*\(row\) => row\.classId !== params\.id\s*\)/)
  assert.match(await read(cwd, "e2e/bookings-api.e2e.ts"), /"path":"\/api\/classes"/)
  const manifest = JSON.parse(await read(cwd, "package.json"))
  assert.equal(manifest.slipway.resources.bookings.fields, "memberName:text:회원명 classId:ref(classes):수업")
})

test("derives English singulars, and prints the field syntax when asked", async t => {
  const cwd = await project(t, "react")
  gen(cwd, "resource", "classes", "수업", "--fields", "title:text:수업명")
  assert.match(await read(cwd, "src/entities/classes/api.ts"), /export const classInputSchema/)
  gen(cwd, "resource", "categories", "분류", "--fields", "name:text:이름")
  assert.match(await read(cwd, "src/entities/categories/api.ts"), /export const categoryInputSchema/)
  assert.throws(() => gen(cwd), /types\s+text, textarea, email, phone, number, won, date, time/)
})

test("refuses bad input and never overwrites", async t => {
  const cwd = await project(t, "react")
  assert.throws(() => gen(cwd, "resource", "Orders", "주문"), /lowercase/)
  assert.throws(() => gen(cwd, "resource", "orders", "주문", "--fields", "title:money"), /bad field/)
  assert.throws(() => gen(cwd, "resource", "orders", "주문", "--fields", "memo?:text"), /at least one field required/)
  gen(cwd, "resource", "orders", "주문", "--fields", fields)
  assert.throws(() => gen(cwd, "resource", "orders", "주문", "--fields", fields), /already exists/)
})

test("a second resource still leaves valid list syntax, even after a formatter dropped a comma", async t => {
  const cwd = await project(t, "react")
  gen(cwd, "resource", "orders", "주문", "--fields", fields)
  // What prettier with trailingComma "es5" does to call arguments: drop the comma after the last one.
  const browser = join(cwd, "src/mocks/browser.ts")
  const { writeFile } = await import("node:fs/promises")
  await writeFile(browser, (await read(cwd, "src/mocks/browser.ts")).replace("...orderHandlers,", "...orderHandlers"))
  gen(cwd, "resource", "bookings", "예약", "--fields", "memberName:text:회원명")
  const source = await read(cwd, "src/mocks/browser.ts")
  assert.match(source, /\.\.\.orderHandlers,\n\s+\.\.\.bookingHandlers,\n\s+\/\/ gen:handlers/)
})

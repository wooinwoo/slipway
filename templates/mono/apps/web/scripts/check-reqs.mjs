// Every requirement in docs/requirements.md must be named by a route file and by an e2e test.
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const read = (path) => readFileSync(path, "utf8")
const files = (dir, pattern) =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name))

const ids = [...read("docs/requirements.md").matchAll(/^## (REQ-\d+)\b/gm)].map((m) => m[1])
const routes = files("src/routes", /\.tsx?$/).map((path) => ({ path, text: read(path) }))
const tests = files("e2e", /\.e2e\.ts$/).map((path) => read(path)).join("\n")

const missing = []
for (const id of ids) {
  const pattern = new RegExp(`^// ${id}\\b`, "m")
  if (!routes.some((route) => pattern.test(route.text))) missing.push(`${id}: no route file has a "// ${id} ..." header comment`)
  if (!new RegExp(`test\\(["'\`]${id}\\b`).test(tests)) missing.push(`${id}: no e2e test named "${id} ..."`)
}

if (missing.length) {
  console.error(`Requirements check failed (${missing.length}):\n  ${missing.join("\n  ")}`)
  process.exit(1)
}
console.log(`Requirements check passed: ${ids.length} requirements, each with a route and an e2e test.`)

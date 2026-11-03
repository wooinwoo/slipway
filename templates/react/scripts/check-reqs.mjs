// Checks traceability, not behavior: the E2E suite verifies the implementation.
import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

export function checkRequirements(requirements, routes, tests) {
  const ids = [...requirements.matchAll(/^## (REQ-\d+)\b/gm)].map(m => m[1])
  const errors = []
  if (!ids.length) errors.push("No requirements declared in docs/requirements.md")
  for (const id of new Set(ids)) {
    if (ids.filter(value => value === id).length > 1) errors.push(`${id}: duplicate requirement`)
    if (!routes.some(route => new RegExp(`^// ${id}\\b`, "m").test(route))) errors.push(`${id}: no route header`)
    if (!new RegExp(`test\\(["'\`]${id}\\b`).test(tests)) errors.push(`${id}: no named e2e test`)
  }
  const referenced = [...routes.join("\n").matchAll(/^\/\/ (REQ-\d+)\b/gm), ...tests.matchAll(/test\(["'`](REQ-\d+)\b/g)]
  for (const id of new Set(referenced.map(match => match[1]))) {
    if (!ids.includes(id)) errors.push(`${id}: referenced but not declared`)
  }
  return { count: new Set(ids).size, errors }
}

function files(dir, pattern) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && pattern.test(entry.name))
    .map(entry => readFileSync(join(entry.parentPath, entry.name), "utf8"))
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = checkRequirements(readFileSync("docs/requirements.md", "utf8"), files("src/routes", /\.tsx?$/), files("e2e", /\.e2e\.ts$/).join("\n"))
  if (result.errors.length) {
    console.error(`Requirements check failed:\n  ${result.errors.join("\n  ")}`)
    process.exitCode = 1
  } else console.log(`Requirements check passed: ${result.count} requirements, each with a route and an e2e test.`)
}

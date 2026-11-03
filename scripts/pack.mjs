import { readFile, writeFile, mkdir, lstat, realpath, open, unlink, rename } from "node:fs/promises"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { randomUUID } from "node:crypto"

const root = fileURLToPath(new URL("../", import.meta.url))
const source = join(root, "templates/react/src")
const catalog = JSON.parse(await readFile(join(root, "codepack/catalog.json"), "utf8"))
const manifest = JSON.parse(await readFile(join(root, "templates/react/package.json"), "utf8"))
const versions = { ...manifest.devDependencies, ...manifest.dependencies }
const within = (parent, child) => { const rel = relative(parent, child); return !isAbsolute(rel) && rel !== ".." && !rel.startsWith("..\\") && !rel.startsWith("../") }
const outputName = name => name === "index.css" ? "styles/slipway.css" : name.replaceAll("\\", "/")
const forbidden = /^(?:routes\/|features\/|mocks\/|main\.|routeTree\.|config\.)/

export function listParts() { return catalog.parts }

async function locate(filename) {
  const target = resolve(source, filename)
  if (!within(source, target)) throw new Error(`부품 경로가 소스 밖을 가리킵니다: ${filename}`)
  for (const candidate of [target, ...[".ts", ".tsx", ".js", ".jsx", ".css"].map(ext => target + ext), join(target, "index.ts"), join(target, "index.tsx")]) {
    try { if ((await lstat(candidate)).isFile()) return candidate }
    catch (error) { if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error }
  }
  throw new Error(`의존 파일을 찾을 수 없습니다: ${filename}`)
}

export async function planParts(ids) {
  if (!ids.length) throw new Error("부품 ID를 하나 이상 지정하세요.")
  const parts = [...new Set(ids)].map(id => {
    const part = catalog.parts.find(item => item.id === id)
    if (!part) throw new Error(`없는 부품: ${id}. list로 목록을 확인하세요.`)
    return part
  })
  const pending = parts.flatMap(part => [...part.entries, ...(part.theme ? ["index.css"] : [])])
  const files = new Map(), packages = {}
  while (pending.length) {
    const filename = await locate(pending.pop())
    const rel = relative(source, filename).replaceAll("\\", "/")
    if (files.has(rel)) continue
    if (forbidden.test(rel)) throw new Error(`독립 부품이 앱 코드에 의존합니다: ${rel}`)
    const content = await readFile(filename, "utf8")
    files.set(rel, content)
    const imports = [...content.matchAll(/\b(?:from\s*|import\s*(?:\(\s*)?|require\(\s*)["']([^"']+)["']/g)].map(match => match[1])
    for (const specifier of imports) {
      if (specifier.startsWith("@/")) pending.push(specifier.slice(2))
      else if (specifier.startsWith(".")) pending.push(relative(source, resolve(dirname(filename), specifier)))
      else if (!specifier.startsWith("node:")) {
        const pkg = specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0]
        if (!versions[pkg]) throw new Error(`패키지 버전이 등록되지 않았습니다: ${pkg}`)
        packages[pkg] = versions[pkg]
      }
    }
  }
  return {
    parts, files: [...files].map(([name, content]) => ({ source: name, path: outputName(name), content })).sort((a, b) => a.path.localeCompare(b.path)),
    packages: Object.fromEntries(Object.entries(packages).sort(([a], [b]) => a.localeCompare(b))),
    requirements: { alias: "@/* → 대상 src/*", css: parts.some(part => part.theme || part.id === "theme") ? '전역 진입점에서 "./styles/slipway.css" import; Tailwind CSS 4 필요' : null },
  }
}

export async function copyParts(ids, destination) {
  const plan = await planParts(ids)
  const target = resolve(destination)
  if (within(source, target)) throw new Error("코드팩 원본 src 안에는 복사할 수 없습니다.")
  await mkdir(target, { recursive: true })
  const canonical = await realpath(target)
  if (within(await realpath(source), canonical)) throw new Error("코드팩 원본 src 안에는 복사할 수 없습니다.")
  const lockPath = join(canonical, ".slipway-parts.lock")
  let lock
  try { lock = await open(lockPath, "wx") }
  catch (error) { if (error.code === "EEXIST") throw new Error("다른 복사가 실행 중입니다. .slipway-parts.lock을 확인하세요."); throw error }
  const created = []
  const recordPath = join(canonical, "slipway-parts.json")
  const temporary = join(canonical, `.slipway-parts-${randomUUID()}.tmp`)
  try {
    let previous = { format: "slipway-parts/v1", parts: [], files: [], packages: {} }
    try {
      previous = JSON.parse(await readFile(recordPath, "utf8"))
      if (previous.format !== "slipway-parts/v1" || !Array.isArray(previous.parts) || !Array.isArray(previous.files)) throw new Error("기존 slipway-parts.json 형식을 확인하세요.")
    } catch (error) { if (error.code !== "ENOENT") throw error }
    const pending = [], skipped = [], conflicts = []
    for (const file of plan.files) {
      const filename = resolve(canonical, file.path)
      if (!within(canonical, filename)) throw new Error("복사 경로가 대상 폴더를 벗어납니다.")
      let ancestor = dirname(filename)
      while (true) {
        try {
          if (!within(canonical, await realpath(ancestor))) throw new Error("대상 내부의 디렉터리 연결이 외부를 가리킵니다.")
          break
        } catch (error) {
          if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error
          ancestor = dirname(ancestor)
        }
      }
      try {
        if ((await lstat(filename)).isSymbolicLink()) throw new Error(`기존 파일 연결을 보존하기 위해 중단했습니다: ${file.path}`)
        const existing = await readFile(filename, "utf8")
        if (existing.replaceAll("\r\n", "\n") === file.content.replaceAll("\r\n", "\n")) skipped.push(file.path)
        else conflicts.push(file.path)
      } catch (error) { if (error.code === "ENOENT") pending.push(file); else throw error }
    }
    if (conflicts.length) throw new Error(`기존 파일을 보존하기 위해 복사를 중단했습니다:\n${conflicts.join("\n")}`)
    for (const file of pending) {
      const filename = resolve(canonical, file.path)
      await mkdir(dirname(filename), { recursive: true })
      if (!within(canonical, await realpath(dirname(filename)))) throw new Error("대상 내부의 디렉터리 연결이 외부를 가리킵니다.")
      await writeFile(filename, file.content, { flag: "wx" })
      created.push(filename)
    }
    const record = {
      format: "slipway-parts/v1", parts: [...new Set([...previous.parts, ...ids])].sort(),
      files: [...new Set([...previous.files, ...plan.files.map(file => file.path)])].sort(),
      packages: { ...previous.packages, ...plan.packages }, requirements: { ...plan.requirements, css: plan.requirements.css ?? previous.requirements?.css ?? null },
    }
    await writeFile(temporary, JSON.stringify(record, null, 2) + "\n", { flag: "wx" })
    await rename(temporary, recordPath)
    return { ...record, copied: pending.map(file => file.path), skipped }
  } catch (error) {
    for (const filename of created.reverse()) {
      if (!within(canonical, filename)) throw new Error("롤백 경로를 확인하세요.")
      await unlink(filename)
    }
    throw error
  } finally {
    try { await unlink(temporary) } catch (error) { if (error.code !== "ENOENT") throw error }
    await lock.close()
    await unlink(lockPath)
  }
}

export async function checkCatalog() {
  const ids = catalog.parts.map(part => part.id)
  if (new Set(ids).size !== ids.length) throw new Error("중복 부품 ID가 있습니다.")
  for (const part of catalog.parts) {
    if (!/^[a-z][a-z0-9-]*$/.test(part.id) || !part.summary || !part.inputs?.length || !part.outputs?.length || !part.edit?.length) throw new Error(`부품 규약이 누락됐습니다: ${part.id}`)
    const contents = (await Promise.all(part.entries.map(async entry => readFile(await locate(entry), "utf8")))).join("\n")
    for (const name of part.exports) if (!new RegExp(`export\\s+(?:async\\s+)?(?:function|const|class|type|interface)\\s+${name}\\b`).test(contents)) throw new Error(`공개 export를 찾을 수 없습니다: ${part.id}/${name}`)
    await planParts([part.id])
  }
  return { parts: ids.length, ids }
}

async function main(argv) {
  const command = argv.shift() ?? "list"
  const json = argv.includes("--json")
  argv = argv.filter(arg => arg !== "--json")
  if (command === "list") {
    if (argv.length) throw new Error("list에는 ID를 지정하지 않습니다.")
    if (json) console.log(JSON.stringify(catalog, null, 2))
    else for (const part of catalog.parts) console.log(`${part.id.padEnd(13)} ${part.name} — ${part.summary}`)
  } else if (command === "show") {
    const plan = await planParts(argv)
    const output = { ...plan, files: plan.files.map(({ source: sourceFile, path }) => ({ source: sourceFile, path })) }
    if (json) console.log(JSON.stringify(output, null, 2))
    else {
      for (const part of plan.parts) console.log(`\n${part.id}: ${part.name}\n${part.summary}\n입력: ${part.inputs.join("; ")}\n출력: ${part.outputs.join("; ")}\n수정: ${part.edit.join("; ")}\n주의: ${part.notes.join("; ")}`)
      console.log(`\n파일 ${plan.files.length}개:\n${plan.files.map(file => file.path).join("\n")}\n\n패키지: ${Object.entries(plan.packages).map(([name, version]) => name + "@" + version).join(" ")}\n별칭: ${plan.requirements.alias}\n스타일: ${plan.requirements.css ?? "없음"}`)
    }
  } else if (command === "copy") {
    const flag = argv.indexOf("--to")
    if (flag < 1 || flag !== argv.length - 2 || !argv[flag + 1] || argv.some((arg, index) => arg.startsWith("--") && index !== flag)) throw new Error("copy <부품 ID...> --to <대상 src 폴더>")
    const result = await copyParts(argv.slice(0, flag), argv[flag + 1])
    console.log(json ? JSON.stringify(result, null, 2) : `복사 ${result.copied.length}개 · 동일 파일 유지 ${result.skipped.length}개\n라우트·메뉴·의존성 설치는 수행하지 않습니다.\n${result.requirements.alias}\n${result.requirements.css ?? "전역 스타일 추가 불필요"}\n필요 패키지: ${Object.entries(result.packages).map(([name, version]) => name + "@" + version).join(" ") || "없음"}`)
  } else if (command === "check") console.log(JSON.stringify(await checkCatalog()))
  else if (["--help", "-h", "help"].includes(command)) console.log("node scripts/pack.mjs list [--json]\nnode scripts/pack.mjs show <ID...> [--json]\nnode scripts/pack.mjs copy <ID...> --to ../project/src [--json]\nnode scripts/pack.mjs check")
  else throw new Error(`알 수 없는 명령: ${command}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1 })
}

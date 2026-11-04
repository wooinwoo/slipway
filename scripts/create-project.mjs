import { cp, lstat, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises"
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const templates = fileURLToPath(new URL("../templates/", import.meta.url))
const presets = new Set(["mono", "react", "nest"])
const excluded = new Set([".git", "node_modules", "dist", "dist-demo", ".next", ".data", ".turbo", ".tanstack", ".shots", ".cache", ".tmp", "coverage", ".pnpm-store", "test-results", "playwright-report"])
const inside = (parent, child) => {
  const rel = relative(parent, child)
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))
}

export async function createProject(destination, { preset = "react", name, tagline } = {}) {
  if (!presets.has(preset)) throw new Error("프리셋은 mono, react, nest 중에서 선택하세요.")
  const target = resolve(destination)
  if (inside(templates, target)) throw new Error("템플릿 폴더 안에는 프로젝트를 생성할 수 없습니다.")
  const slug = basename(target)
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("폴더 이름은 영문 소문자로 시작하고 숫자와 하이픈만 사용하세요.")
  try {
    await lstat(target)
    throw new Error("대상 경로가 이미 있습니다. 비어 있는 새 경로를 지정하세요.")
  } catch (error) { if (error.code !== "ENOENT") throw error }

  const parent = dirname(target)
  await mkdir(parent, { recursive: true })
  const stage = await mkdtemp(join(parent, ".slipway-"))
  try {
    await cp(join(templates, preset), stage, {
      recursive: true,
      // Never copy ignored local secrets, build output, or database state.
      filter: source => {
        const entry = basename(source)
        return !excluded.has(entry) && !entry.endsWith(".tsbuildinfo") && !entry.endsWith(".log")
          && !(entry.startsWith(".env") && entry !== ".env.example")
      },
    })
    const manifestPath = join(stage, "package.json")
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
    manifest.name = slug
    manifest.packageManager = "pnpm@10.33.2"
    // `pnpm gen app` and `pnpm gen resource ...` write every layer from one field list.
    manifest.scripts = { ...manifest.scripts, gen: "node scripts/gen.mjs" }
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n")
    try {
      const lockPath = join(stage, "package-lock.json")
      const lock = JSON.parse(await readFile(lockPath, "utf8"))
      lock.name = slug
      if (lock.packages?.[""]) lock.packages[""].name = slug
      await writeFile(lockPath, JSON.stringify(lock, null, 2) + "\n")
    } catch (error) { if (error.code !== "ENOENT") throw error }

    if (preset !== "nest") {
      const configPath = join(stage, preset === "mono" ? "apps/web/src/config.ts" : "src/config.ts")
      let config = await readFile(configPath, "utf8")
      config = config.replace(/name: "Slipway"/, () => `name: ${JSON.stringify(name ?? slug)}`)
      if (tagline !== undefined) config = config.replace(/tagline: "서비스 한 줄 소개"/, () => `tagline: ${JSON.stringify(tagline)}`)
      await writeFile(configPath, config)
    }
    if (preset === "mono") {
      await writeFile(join(stage, "apps/web/.env"), "# Same origin; Vite proxies /api to the local API.\nVITE_API_URL=/\n")
      await writeFile(join(stage, "apps/web/.env.demo"), "VITE_API_URL=\n")
    }
    await cp(new URL("../docs/feature-workflow.md", import.meta.url), join(stage, "FEATURE-WORKFLOW.md"))
    await cp(new URL("../docs/codepack.md", import.meta.url), join(stage, "CODEPACK.md"))
    await cp(new URL("../docs/deploy.md", import.meta.url), join(stage, "DEPLOY.md"))
    await mkdir(join(stage, "scripts"), { recursive: true })
    await cp(new URL("./gen.mjs", import.meta.url), join(stage, "scripts/gen.mjs"))
    await writeFile(join(stage, "README.md"), projectReadme(slug, preset, name ?? slug))
    // The target was checked above; recheck just before the atomic publish as well.
    try { await lstat(target); throw new Error("생성 도중 대상 경로가 만들어졌습니다. 다른 경로를 사용하세요.") }
    catch (error) { if (error.code !== "ENOENT") throw error }
    await rename(stage, target)
    return { target, preset, name: name ?? slug }
  } finally {
    // Only remove the unique staging directory allocated by this invocation.
    if (dirname(stage) !== parent || !basename(stage).startsWith(".slipway-")) throw new Error("Invalid staging path")
    await rm(stage, { recursive: true, force: true })
  }
}

function projectReadme(slug, preset, name) {
  const web = preset === "mono" ? "apps/web/" : ""
  return `# ${name}\n\nSlipway ${preset} 프리셋으로 생성한 ${slug} 프로젝트입니다.\n\n`
    + "## 시작\n\nNode.js 22.23.4 이상과 pnpm 10.33.2를 사용합니다. pnpm 실행 파일이 PATH에 있어야 합니다. Corepack을 사용한다면 최초 한 번 `corepack enable`로 실행 파일을 활성화하세요.\n\n```sh\ncorepack pnpm install --frozen-lockfile\ncorepack pnpm dev\n```\n\n"
    + (preset === "mono" ? "웹은 :5173, API는 :3000입니다. DB는 내장 PGlite로 시작합니다. `pnpm dev:demo`로 백엔드 없이 실행할 수 있습니다.\n\n" : "")
    + (preset === "react" ? "웹은 :5173에서 Mock API로 실행됩니다. 실제 API를 연결할 때 `.env`의 `VITE_API_URL`을 설정하고 다시 빌드하세요.\n\n" : "")
    + (preset === "nest" ? "API는 :3000/api에서 실행됩니다. `.env.example`과 내장 PGlite로 시작할 수 있습니다.\n\n" : "")
    + (preset !== "nest" ? `제품 이름·설명: \`${web}src/config.ts\`, 테마: \`${web}src/index.css\`.\n\n` : "")
    + ("## 리소스 생성\n\n```sh\ncorepack pnpm gen resource orders 주문 --fields \"title:text:주문명 amount:won:금액 status:enum(접수|배송중|완료):상태\"\n```\n\n스키마, DB 테이블과 마이그레이션, API, Mock, 조회·저장 훅, 테스트 가운데 이 프리셋에 있는 층을 한 번에 만듭니다. 화면은 만들지 않습니다. `CODEPACK.md`의 부품으로 조립합니다. 사용법은 `node scripts/gen.mjs`를 인자 없이 실행해 확인합니다.\n\n")
    + "## 조립과 검증\n\n`CODEPACK.md`에서 독립 표·폼·상세·보드 부품의 입력과 콜백 규약을 확인하세요. `AGENTS.md`와 `FEATURE-WORKFLOW.md`에서 요구사항·권한·검증 기준을 이어갑니다.\n\n```sh\n"
    + (preset === "mono" ? "corepack pnpm --filter @slipway/web exec playwright install firefox\n" : preset === "react" ? "corepack pnpm exec playwright install firefox\n" : "")
    + "corepack pnpm verify\n```\n\n"
    + (preset === "mono" ? "verify는 공통 패키지, API, 실제 API를 사용하는 웹과 Mock 모드 웹을 모두 검증합니다.\n\n" : "")
    + "## 운영 설정\n\n배포 방법은 `DEPLOY.md`에 있습니다. "

    + (preset !== "react" ? "API `.env.example`을 참고해 영구 `DATABASE_URL`, 실제 `WEB_URL`·`API_URL`, `DEMO=false`, `ALLOW_GUEST=false`를 설정하세요. OAuth는 공급자 콘솔의 콜백 URL도 등록해야 합니다. DB 마이그레이션은 API 시작 시 적용됩니다.\n\n" : "배포 환경의 `VITE_API_URL`은 빌드 시 반영됩니다. Mock 빌드에는 브라우저 내부 데모 데이터만 있습니다.\n\n")
    + (preset === "mono" ? "운영 프록시에서 /api는 API 서버로, 나머지 웹 경로는 정적 SPA로 연결하세요. Vite 개발 프록시는 운영 서버에 포함되지 않습니다.\n\n" : "")
    + "인증 기본 기능이 포함되어 있습니다. 역할·조직·도메인 데이터 권한, 이메일 소유 확인, 비밀번호 재설정은 제품 요구사항에 맞춰 추가해야 합니다.\n"
}

function options(argv) {
  const parsed = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--help" || arg === "-h") return { help: true }
    if (arg.startsWith("--")) {
      if (!["--preset", "--name", "--tagline"].includes(arg) || !argv[i + 1] || argv[i + 1].startsWith("--")) throw new Error(`옵션을 확인하세요: ${arg}`)
      parsed[arg.slice(2)] = argv[++i]
    } else if (!parsed.destination) parsed.destination = arg
    else throw new Error(`알 수 없는 인자: ${arg}`)
  }
  if (!parsed.destination) throw new Error("새 프로젝트 경로를 입력하세요. --help로 사용법을 확인할 수 있습니다.")
  return parsed
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = options(process.argv.slice(2))
    if (args.help) console.log('node scripts/create-project.mjs ../my-app [--preset react|mono|nest] [--name "서비스 이름"] [--tagline "한 줄 소개"]\n기본 프리셋: react (별도 서버 없이 시연). 실제 API가 필요하면 --preset mono.')
    else {
      const result = await createProject(args.destination, args)
      console.log(`생성 완료: ${result.target} (${result.preset})\n\ncd ${JSON.stringify(result.target.replaceAll("\\", "/"))}\ncorepack pnpm install --frozen-lockfile\ncorepack pnpm dev`)
    }
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}

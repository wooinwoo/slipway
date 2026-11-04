import { cp, lstat, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises"
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const templates = fileURLToPath(new URL("../templates/", import.meta.url))
const presets = new Set(["mono", "react", "next", "nest", "astro", "flutter"])
// Skills shipped into each project's .claude/skills, so plain requests ("주문 목록 화면 만들어줘",
// "배포해줘") follow them without installing the plugin. AGENTS.md points other AI tools at the same files.
const projectSkills = { react: ["screen", "resource", "deploy"], next: ["screen", "resource", "deploy"], mono: ["screen", "resource", "deploy"], nest: ["resource", "deploy"], astro: ["deploy"], flutter: [] }
// Presets with an API or a mock API get the resource generator and the API-side docs.
const dataPresets = new Set(["mono", "react", "next", "nest"])
const webPresets = new Set(["mono", "react", "next", "astro"])
const excluded = new Set([".git", "node_modules", "dist", "dist-demo", ".next", ".astro", ".lighthouseci", ".data", ".turbo", ".tanstack", ".shots", ".cache", ".tmp", "coverage", ".pnpm-store", "test-results", "playwright-report", "build", ".dart_tool", ".gradle", "Pods", ".flutter-plugins-dependencies", ".idea"])
const inside = (parent, child) => {
  const rel = relative(parent, child)
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))
}

export async function createProject(destination, { preset = "react", name, tagline } = {}) {
  if (!presets.has(preset)) throw new Error("프리셋은 react, next, mono, nest, astro, flutter 중에서 선택하세요.")
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
    for (const skill of projectSkills[preset]) {
      await mkdir(join(stage, ".claude/skills", skill), { recursive: true })
      await cp(new URL(`../plugin/skills/${skill}/SKILL.md`, import.meta.url), join(stage, ".claude/skills", skill, "SKILL.md"))
    }
    if (preset === "flutter") {
      await nameFlutterApp(stage, name ?? slug)
      await writeFile(join(stage, "README.md"), projectReadme(slug, preset, name ?? slug))
    } else {
      const manifestPath = join(stage, "package.json")
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
      manifest.name = slug
      manifest.packageManager = "pnpm@10.33.2"
      // `pnpm gen resource ...` writes the data layer from one field list.
      if (dataPresets.has(preset)) manifest.scripts = { ...manifest.scripts, gen: "node scripts/gen.mjs" }
      // `pnpm brand logo.svg` wires the user's own logo (favicon, public/). Slipway never makes one.
      if (webPresets.has(preset)) manifest.scripts = { ...manifest.scripts, brand: "node scripts/brand.mjs" }
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
        // The HTML shell shows the same name before the app runs (tab title, link previews).
        const htmlPath = join(stage, preset === "mono" ? "apps/web/index.html" : "index.html")
        if (preset === "react" || preset === "mono") {
        const escape = value => value.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
        let html = await readFile(htmlPath, "utf8")
        html = html.replace("<title>Slipway</title>", () => `<title>${escape(name ?? slug)}</title>`)
        if (tagline !== undefined) html = html.replace('content="서비스 한 줄 소개"', () => `content="${escape(tagline)}"`)
        await writeFile(htmlPath, html)
        }
      }
      if (preset === "mono") {
        await writeFile(join(stage, "apps/web/.env"), "# Same origin; Vite proxies /api to the local API.\nVITE_API_URL=/\n")
        await writeFile(join(stage, "apps/web/.env.demo"), "VITE_API_URL=\n")
      }
      await cp(new URL("../docs/codepack.md", import.meta.url), join(stage, "CODEPACK.md"))
      await cp(new URL("../docs/deploy.md", import.meta.url), join(stage, "DEPLOY.md"))
      if (dataPresets.has(preset)) {
        await cp(new URL("../docs/feature-workflow.md", import.meta.url), join(stage, "FEATURE-WORKFLOW.md"))
        await cp(new URL("../docs/security.md", import.meta.url), join(stage, "SECURITY.md"))
        await mkdir(join(stage, "scripts"), { recursive: true })
        await cp(new URL("./gen.mjs", import.meta.url), join(stage, "scripts/gen.mjs"))
      }
      if (webPresets.has(preset)) {
        await mkdir(join(stage, "scripts"), { recursive: true })
        await cp(new URL("./brand.mjs", import.meta.url), join(stage, "scripts/brand.mjs"))
      }
      await writeFile(join(stage, "README.md"), projectReadme(slug, preset, name ?? slug))
    }
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

/** Display name of the Flutter shell: app config, Android launcher label, iOS home screen. */
async function nameFlutterApp(stage, name) {
  const edits = [
    // Dart single-quoted string: escape backslash, quote and $ (interpolation).
    ["lib/config.dart", "static const name = 'Slipway';", `static const name = '${name.replace(/[\\'$]/g, c => `\\${c}`)}';`],
    ["android/app/src/main/AndroidManifest.xml", 'android:label="Slipway"', `android:label="${name.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])}"`],
    ["ios/Runner/Info.plist", "<key>CFBundleDisplayName</key>\n\t<string>Slipway</string>", `<key>CFBundleDisplayName</key>\n\t<string>${name.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])}</string>`],
  ]
  for (const [file, from, to] of edits) {
    const path = join(stage, file)
    const text = await readFile(path, "utf8")
    if (!text.includes(from)) throw new Error(`${file}: 앱 이름 위치를 찾지 못했습니다.`)
    await writeFile(path, text.replace(from, () => to))
  }
}

function projectReadme(slug, preset, name) {
  if (preset === "flutter") {
    return `# ${name}\n\nSlipway flutter 프리셋으로 만든 ${slug} 앱입니다. Slipway 웹 앱(react·next·mono)을 Android·iOS 앱으로 감싸는 셸이고, 화면은 웹 앱에서 만듭니다.\n\n`
      + "## 시작\n\nFlutter(stable)와 Android SDK 또는 Xcode가 필요합니다.\n\n```sh\nflutter pub get\nflutter run --dart-define=APP_URL=http://10.0.2.2:5173   # Android 에뮬레이터에서 이 컴퓨터의 웹 개발 서버\n```\n\n"
      + "앱 이름·시작 주소·앱 안에서 여는 주소·브랜드 색은 `lib/config.dart`에 있습니다. 웹 앱에서 쓰는 `window.SlipwayApp`(공유·진동·외부 브라우저)은 `AGENTS.md`에 있습니다.\n\n"
      + "## 검증\n\n```sh\nflutter analyze\nflutter test\n```\n\nGitHub에 올리면 `.github/workflows/verify.yml`이 분석·테스트·Android 빌드를 돌립니다.\n\n"
      + "## 출시\n\n```sh\nflutter build apk --dart-define=APP_URL=https://app.example.com\nflutter build ipa --dart-define=APP_URL=https://app.example.com\n```\n\n스토어에 올리기 전에 애플리케이션 ID(`android/app/build.gradle.kts`)와 iOS 번들 ID를 바꿉니다. 릴리스 빌드는 https 주소만 엽니다.\n"
  }
  const run = {
    react: "웹은 :5173에서 브라우저 Mock API로 실행됩니다. 실제 API를 붙일 때는 `.env`의 `VITE_API_URL`을 설정하고 다시 빌드합니다.",
    next: "웹은 :3000에서 브라우저 Mock API로 실행됩니다. 실제 API(nest 프리셋)를 붙일 때는 `NEXT_PUBLIC_API_URL`을 설정하고 다시 빌드합니다.",
    mono: "웹은 :5173, API는 :3000입니다. DB는 내장 PGlite로 시작합니다. `pnpm dev:demo`는 백엔드 없이 Mock으로 웹만 띄웁니다.",
    nest: "API는 :3000/api에서 실행됩니다. 설정 없이 내장 PGlite로 시작하고, 바꿀 값은 `.env.example`에 있습니다.",
    astro: "사이트는 :4321에서 실행됩니다. 공개 주소는 빌드 환경 변수 `SITE_URL`로 정합니다(canonical, sitemap, Open Graph).",
  }[preset]
  const identity = {
    react: "이름·소개 `src/config.ts`, 테마 토큰 `src/index.css`.",
    next: "이름·소개 `src/config.ts`, 테마 토큰 `src/app/globals.css`.",
    mono: "이름·소개 `apps/web/src/config.ts`, 테마 토큰 `apps/web/src/index.css`.",
    nest: "설정 `src/config.ts`(환경 변수).",
    astro: "이름·소개 `src/config.ts`, 테마 토큰 `src/styles/global.css`.",
  }[preset]
  const browsers = { react: "corepack pnpm exec playwright install firefox\n", next: "corepack pnpm exec playwright install firefox\n", mono: "corepack pnpm --filter @slipway/web exec playwright install firefox\n", astro: "corepack pnpm exec playwright install firefox\n", nest: "" }[preset]
  const verify = {
    react: "타입·린트·단위 테스트·요구사항·빌드·번들 예산·E2E·UI 검사(접근성·대비·넘침·커서·포커스)를 돌립니다.",
    next: "타입·린트·단위 테스트·빌드·번들 예산·E2E(CSP nonce 포함)·UI 검사(접근성·대비·넘침·커서·포커스)를 돌립니다.",
    mono: "공통 패키지, API(계약·보안 테스트), 실제 API와 Mock 양쪽의 웹 E2E, 번들 예산, UI 검사를 돌립니다.",
    nest: "타입·린트·단위·계약·보안 테스트와 빌드를 돌립니다.",
    astro: "`astro check`, 빌드, E2E, UI 검사(접근성·대비·넘침·커서·포커스)를 돌립니다.",
  }[preset]
  const operate = {
    react: "Mock 빌드는 브라우저 안 데모 데이터로만 동작합니다. 배포 환경의 `VITE_API_URL`은 빌드할 때 들어갑니다.",
    next: "`next start`로 실행하는 Node 서버입니다(Vercel·Railway·Render, Docker 없이 `pnpm build && pnpm start`). 페이지마다 CSP nonce를 붙이므로 정적 내보내기는 쓰지 않습니다.",
    mono: "운영 모드(`NODE_ENV=production`)에서는 데모 계정과 게스트 로그인이 꺼지고, `WEB_URL`·`API_URL`이 없으면 API가 시작하지 않습니다. 공개 전 점검은 `SECURITY.md`를 봅니다.",
    nest: "운영 모드(`NODE_ENV=production`)에서는 데모 계정과 게스트 로그인이 꺼지고, `WEB_URL`·`API_URL`이 없으면 시작하지 않습니다. 공개 전 점검은 `SECURITY.md`를 봅니다.",
    astro: "정적 사이트라 Vercel, Cloudflare Pages, Netlify, S3 어디든 `dist`를 올리면 됩니다. 보안 헤더는 `public/_headers`와 `vercel.json`에 있습니다.",
  }[preset]
  const generate = dataPresets.has(preset)
    ? "## 리소스 생성\n\n```sh\ncorepack pnpm gen resource orders 주문 --fields \"title:text:주문명 amount:won:금액 status:enum(접수|배송중|완료):상태\"\n```\n\n"
      + "스키마, DB 테이블과 마이그레이션, API, Mock, 조회·저장 훅, 테스트 가운데 이 프리셋에 있는 층을 한 번에 만듭니다. 화면은 만들지 않습니다. "
      + "사용법은 `node scripts/gen.mjs`를 인자 없이 실행해 확인합니다.\n\n"
    : ""
  return `# ${name}\n\nSlipway ${preset} 프리셋으로 만든 ${slug} 프로젝트입니다. 화면은 \`AGENTS.md\`의 기준과 \`CODEPACK.md\`의 부품으로 조립합니다.\n\n`
    + "## 시작\n\nNode.js 22.23.4 이상과 pnpm 10.33.2를 씁니다. Corepack을 쓴다면 처음 한 번 `corepack enable`을 실행합니다.\n\n"
    + "```sh\ncorepack pnpm install --frozen-lockfile\ncorepack pnpm dev\n```\n\n"
    + `${run}\n\n${identity}`
    + (webPresets.has(preset) ? " 로고는 제품의 실제 로고 파일을 `corepack pnpm brand logo.svg`로 연결합니다(`public/`, 파비콘). Slipway는 로고를 만들지 않습니다." : "")
    + "\n\n"
    + (preset === "nest" ? "" : "## 화면과 디자인\n\nSlipway는 화면도 디자인 기준도 주지 않습니다. 부품(`src/patterns/`, `CODEPACK.md`)과 데이터 층만 있습니다. "
      + "화면의 방향과 모양은 디자인 하네스로 정합니다. 웹은 [Impeccable](https://impeccable.style)이 사용자와 함께 `PRODUCT.md`·`DESIGN.md`를 만들고 "
      + "화면을 짓고 다듬습니다. 모바일 소비자 앱 초안은 [k-style-ui-ux](https://github.com/vmc-inner-circle/k-style-ui-ux)를 씁니다. "
      + "어떤 디자인이든 `pnpm check:ui`(접근성·대비·포커스·넘침)와 E2E는 통과해야 합니다.\n\n")
    + generate
    + `## 검증\n\n\`\`\`sh\n${browsers}corepack pnpm verify\n\`\`\`\n\n${verify} GitHub에 올리면 \`.github/workflows/verify.yml\`이 같은 검증에 웹 점수(Lighthouse)와 의존성 검사를 더해 돌립니다.\n\n`
    + `## 배포와 운영\n\n방법은 \`DEPLOY.md\`에 있습니다. ${operate}\n`
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
    if (args.help) console.log('node scripts/create-project.mjs ../my-app [--preset react|next|mono|nest|astro|flutter] [--name "서비스 이름"] [--tagline "한 줄 소개"]\n기본 프리셋: react (별도 서버 없이 시연). 실제 API가 필요하면 --preset mono, 소개·랜딩 사이트는 --preset astro.')
    else {
      const result = await createProject(args.destination, args)
      console.log(`생성 완료: ${result.target} (${result.preset})\n\ncd ${JSON.stringify(result.target.replaceAll("\\", "/"))}\ncorepack pnpm install --frozen-lockfile\ncorepack pnpm dev`)
    }
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}

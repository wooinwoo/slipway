// Product identity in one place. Rename the demo by editing this file;
// re-skin it by changing --brand-h / --brand-c in src/index.css.
export const product = {
  name: "Slipway",
  tagline: "서비스 한 줄 소개",
  description: "src/config.ts에서 이름과 소개를 바꾸세요. 로그인 화면과 브라우저 탭에 쓰입니다.",
}

// Presentation switches live here, not inside reusable patterns.
export const codepack = { showEnvironment: false }

/** True when no backend is configured and the in-browser mock API answers requests. */
export const isDemo = !import.meta.env.VITE_API_URL

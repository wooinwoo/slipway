// Product identity in one place. Rename the demo by editing this file;
// re-skin it by changing --brand-h / --brand-c in src/index.css.
export const product = {
  name: "Slipway",
  tagline: "서비스 한 줄 소개",
  description: "src/config.ts에서 이름과 소개를 바꾸세요. 브라우저 탭과 화면에서 가져다 씁니다.",
}

/** True when no backend is configured and the in-browser mock API answers requests. */
export const isDemo = !import.meta.env.VITE_API_URL

// The account the mock backend seeds (src/mocks/db.ts) and the API creates outside production.
// Its own file with no imports, so e2e tests and scripts/ui.mjs can read it too.
export const demoAccount = { email: "demo@slipway.dev", password: "demo1234" }

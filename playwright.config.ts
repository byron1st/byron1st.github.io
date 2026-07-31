import { defineConfig, devices } from "@playwright/test";

// ponytail: no @types/node in package.json; CI flags via globalThis to avoid Node typings
const env = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env;
const isCI = Boolean(env?.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? "html" : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    // scripts/serveClient.mjs: GH Pages directory-index, not vite SPA fallback
    command: "pnpm preview 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !isCI,
  },
});

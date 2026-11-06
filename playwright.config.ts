import { defineConfig, devices } from "@playwright/test";

const E2E_SECRET = "rsi-quiz-e2e-secret-0123456789-abcdef";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3200",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
  },
  globalSetup: "./tests/e2e/global-setup.ts",
  webServer: {
    command: "npm run dev -- -p 3200",
    url: "http://127.0.0.1:3200/login",
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      DATABASE_URL: "file:./e2e.db",
      SESSION_SECRET: E2E_SECRET,
      DEMO_MODE: "true",
      TZ: "Asia/Jakarta",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

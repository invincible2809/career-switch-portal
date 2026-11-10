import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

const PORT = 3100;
const testDb = process.env.TEST_DATABASE_URL;
if (!testDb) throw new Error("Set TEST_DATABASE_URL in .env (see .env.example) – e2e tests wipe that database.");

export default defineConfig({
  testDir: "tests/e2e",
  // Tests share one seeded database and some change admin settings, so they run one at a time.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  globalSetup: "./tests/e2e/global-setup.ts",
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `pnpm exec next dev --port ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: testDb,
      APP_URL: `http://localhost:${PORT}`,
      SMTP_HOST: "",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});

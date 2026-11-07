import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 2,
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:4317", trace: "retain-on-failure", screenshot: "only-on-failure", launchOptions: process.env.PLAYWRIGHT_CHROME_CHANNEL ? { channel: "chrome" } : {} },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "npm run start -- --hostname 127.0.0.1 --port 4317", url: "http://127.0.0.1:4317", reuseExistingServer: !process.env.CI, timeout: 60_000 },
});

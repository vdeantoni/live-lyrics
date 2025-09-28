import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? "github" : "html",
  /* Global timeout for each test */
  timeout: 30 * 1000, // 30 seconds per test
  /* Global timeout for the entire test run */
  globalTimeout: 15 * 60 * 1000, // 15 minutes total
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.CI
      ? "http://172.17.0.1:4173"
      : "http://127.0.0.1:4173",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Take screenshot only on failure */
    screenshot: "only-on-failure",
    /* Record video only on failure */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers - reduced for CI performance */
  projects: process.env.CI
    ? [
        // Only run Chrome in CI for speed
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
        },
      ]
    : [
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
        },

        {
          name: "firefox",
          use: { ...devices["Desktop Firefox"] },
        },

        {
          name: "webkit",
          use: { ...devices["Desktop Safari"] },
        },

        /* Test against mobile viewports. */
        {
          name: "Mobile Chrome",
          use: { ...devices["Pixel 5"] },
        },
        {
          name: "Mobile Safari",
          use: { ...devices["iPhone 12"] },
        },

        /* Test against tablet viewports. */
        {
          name: "iPad",
          use: { ...devices["iPad Pro"] },
        },
      ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "pnpm preview",
    url: process.env.CI ? "http://172.17.0.1:4173" : "http://127.0.0.1:4173",
    reuseExistingServer: true, // Always reuse existing server
    timeout: 120 * 1000, // 2 minutes to start the server
  },
});

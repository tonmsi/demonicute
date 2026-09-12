import { defineConfig } from '@playwright/test';
const baseURL = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:2571';
export default defineConfig({
  testDir: 'tests', testMatch: '**/*.spec.ts', workers: 1, timeout: 40000,
  expect: { timeout: 10000 }, reporter: 'list',
  use: {
    baseURL, viewport: { width: 1440, height: 1000 },
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } }
      : { channel: 'chrome' }),
    screenshot: 'only-on-failure', trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node dist/runtime/src/server/index.js', url: `${baseURL}/api/health`,
    reuseExistingServer: Boolean(process.env.TEST_BASE_URL), timeout: 30000,
    env: { NODE_ENV: 'test', DEMONICUTE_TEST_SEED: '42', PORT: new URL(baseURL).port || '2571', HOST: '127.0.0.1', PUBLIC_ORIGIN: baseURL },
  },
});

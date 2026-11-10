import 'dotenv/config'; // loads variables from a local .env file (never committed)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // fail the build if test.only is left in the code
  // Default to 1 worker against public parabank.parasoft.com to avoid Cloudflare Error 1015 rate-limiting.
  // Override with WORKERS=4 in .env when running against a local ParaBank container.
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : 1,
  reporter: [['html', { open: 'never' }]], // never block the terminal with a report server
  use: {
    baseURL: process.env.BASE_URL ?? 'https://parabank.parasoft.com/parabank/',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

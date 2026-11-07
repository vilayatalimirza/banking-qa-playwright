import 'dotenv/config'; // loads variables from a local .env file (never committed)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // fail the build if test.only is left in the code
  workers: process.env.CI ? 1 : 2, // be gentle with the shared public demo
  reporter: [['html', { open: 'never' }]], // never block the terminal with a report server
  use: {
    baseURL: process.env.BASE_URL ?? 'https://parabank.parasoft.com/parabank/',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

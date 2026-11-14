import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
import base from './playwright.config';

// The "full" configuration: everything in the base config, plus cross-browser smoke runs, a visual project,
// retries and machine-readable reports. Use it locally with:  npx playwright test -c playwright.ci.config.ts
const isCI = Boolean(process.env.CI);

const reporter: ReporterDescription[] = [
  ['list'],
  ['html', { open: 'never' }],
  ['junit', { outputFile: 'test-results/junit.xml' }], // read by GitLab / Jenkins / most CI dashboards
  ['json', { outputFile: 'test-results/results.json' }], // input for the traceability matrix and the evidence bundle
  ['./reporters/requirements-reporter.ts'], // writes test-results/traceability.md (requirement results)
];
if (process.env.PW_BLOB) {
  reporter.push(['blob', { outputDir: 'blob-report' }]); // sharded runs: each shard saves a blob, a final job merges them
}
if (process.env.GITHUB_ACTIONS) {
  reporter.push(['github']); // inline failure annotations on the pull request
}

export default defineConfig({
  ...base,
  retries: isCI ? 2 : 0, // a test that passes on retry is reported as FLAKY, never silently green
  workers: isCI ? 1 : 2, // one worker: the demo is shared and rate-limited
  reporter,
  use: {
    ...base.use,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // The whole suite, in Chromium. (Visual tests have their own project.)
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /visual/ },
    // Visual regression: Chromium only, so one set of baselines.
    { name: 'visual', use: { ...devices['Desktop Chrome'] }, testMatch: /visual\/.*\.spec\.ts/ },
    // Cross-browser: only the tests tagged @smoke (the critical journeys), in the other engines and a phone viewport.
    { name: 'firefox-smoke', use: { ...devices['Desktop Firefox'] }, testMatch: /e2e\/.*\.spec\.ts/, grep: /@smoke/ },
    { name: 'webkit-smoke', use: { ...devices['Desktop Safari'] }, testMatch: /e2e\/.*\.spec\.ts/, grep: /@smoke/ },
    { name: 'mobile-smoke', use: { ...devices['Pixel 7'] }, testMatch: /e2e\/.*\.spec\.ts/, grep: /@smoke/ },
  ],
});

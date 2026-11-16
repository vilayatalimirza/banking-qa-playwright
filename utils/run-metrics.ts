export interface PlaywrightTestRecord {
  status?: string;
  expectedStatus?: string;
}
export interface RunMetrics {
  firstAttemptPasses: number; passedOnRetry: number; unexpectedFailures: number;
  staleDefectGuards: number; expectedDefectFailures: number; skipped: number; notRun: number;
  denominator: number; firstAttemptPassRate: number | null; finalPassRate: number | null;
}
interface JsonTest extends PlaywrightTestRecord {}
interface JsonSuite { specs?: { tests?: JsonTest[] }[]; suites?: JsonSuite[] }

/** Flatten a Playwright JSON report into one record per test execution. */
export function collectTestRecords(report: unknown): PlaywrightTestRecord[] {
  const records: PlaywrightTestRecord[] = [];
  const walk = (suite: JsonSuite): void => {
    for (const spec of suite.specs ?? []) for (const test of spec.tests ?? [])
      records.push({ status: test.status, expectedStatus: test.expectedStatus });
    for (const child of suite.suites ?? []) walk(child);
  };
  if (report !== null && typeof report === 'object') walk(report as JsonSuite);
  return records;
}

/**
 * Expected failures are open defect probes, not requirement passes. Keep them separate.
 * A known-defect guard that unexpectedly passes is also separate pending human triage.
 */
export function summarizeRun(records: readonly PlaywrightTestRecord[]): RunMetrics {
  let firstAttemptPasses = 0, passedOnRetry = 0, unexpectedFailures = 0;
  let staleDefectGuards = 0, expectedDefectFailures = 0, skipped = 0, notRun = 0;
  for (const record of records) {
    if (record.status === 'expected' && record.expectedStatus === 'failed') expectedDefectFailures++;
    else if (record.status === 'expected') firstAttemptPasses++;
    else if (record.status === 'flaky') passedOnRetry++;
    else if (record.status === 'unexpected' && record.expectedStatus === 'failed') staleDefectGuards++;
    else if (record.status === 'unexpected') unexpectedFailures++;
    else if (record.status === 'skipped') skipped++;
    else notRun++;
  }
  const denominator = firstAttemptPasses + passedOnRetry + unexpectedFailures + staleDefectGuards;
  return {
    firstAttemptPasses, passedOnRetry, unexpectedFailures, staleDefectGuards,
    expectedDefectFailures, skipped, notRun, denominator,
    firstAttemptPassRate: denominator ? firstAttemptPasses / denominator * 100 : null,
    finalPassRate: denominator ? (firstAttemptPasses + passedOnRetry) / denominator * 100 : null,
  };
}
const pct = (n: number | null): string => n === null ? 'n/a' : n.toFixed(1) + '%';
export function formatRunMetrics(m: RunMetrics): string {
  return [
    '# Full Chromium suite: run metrics', '',
    '| Outcome | Count |', '|---|---:|',
    '| First-attempt passes | ' + m.firstAttemptPasses + ' |',
    '| Passed after retry (flaky) | ' + m.passedOnRetry + ' |',
    '| Unexpected test failures | ' + m.unexpectedFailures + ' |',
    '| Known-defect guards that passed unexpectedly (triage required) | ' + m.staleDefectGuards + ' |',
    '| Known-defect probes that failed as expected | ' + m.expectedDefectFailures + ' |',
    '| Skipped | ' + m.skipped + ' |',
    '| No recorded outcome | ' + m.notRun + ' |', '',
    '| Rate | Result |', '|---|---:|',
    '| First-attempt pass rate | ' + pct(m.firstAttemptPassRate) + ' |',
    '| Final pass rate (includes retry-passed tests) | ' + pct(m.finalPassRate) + ' |', '',
    'The denominator includes first-attempt passes, retry-passed tests, unexpected failures and known-defect guards that passed unexpectedly.',
    'Expected failures for documented defects, skipped tests and tests without a recorded outcome are excluded.',
    'A retry-passed test improves the final pass rate but remains visible as flaky.',
    'Scope: merged full Chromium shards only. Unit/typecheck, Firefox, WebKit, mobile and visual jobs are reported separately.',
    ''
  ].join('\n');
}

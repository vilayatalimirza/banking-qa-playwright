import { expect, test } from '@playwright/test';
import { formatRunMetrics, summarizeRun } from '../../utils/run-metrics';

test('pass rates exclude expected defect failures and skipped tests', () => {
  const metrics = summarizeRun([
    { status: 'expected', expectedStatus: 'passed' },
    { status: 'flaky', expectedStatus: 'passed' },
    { status: 'unexpected', expectedStatus: 'passed' },
    { status: 'expected', expectedStatus: 'failed' },
    { status: 'skipped', expectedStatus: 'passed' },
    { status: 'unexpected', expectedStatus: 'failed' },
  ]);
  expect(metrics).toMatchObject({
    firstAttemptPasses: 1, passedOnRetry: 1, unexpectedFailures: 1,
    staleDefectGuards: 1, expectedDefectFailures: 1, skipped: 1,
    denominator: 4, firstAttemptPassRate: 25, finalPassRate: 50,
  });
});

test('empty report has no misleading zero percent pass rate', () => {
  const metrics = summarizeRun([]);
  expect(metrics.denominator).toBe(0);
  expect(metrics.firstAttemptPassRate).toBeNull();
  expect(metrics.finalPassRate).toBeNull();
  expect(formatRunMetrics(metrics)).toContain('n/a');
});

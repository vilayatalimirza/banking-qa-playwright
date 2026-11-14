import { expect, test } from '@playwright/test';
import { REQUIREMENTS } from '../../data/requirements';
import { buildMatrix, matches, mergeOutcomes, outcomesFromJson, riskScore, riskTier, type TestOutcome } from '../../utils/traceability';

const t = (over: Partial<TestOutcome>): TestOutcome => ({ file: 'e2e/transfer.spec.ts', title: 'moves money', tags: [], ...over });

test('risk score and tier', () => {
  expect(riskScore({ impact: 5, likelihood: 4 })).toBe(20);
  expect(riskTier(20)).toBe('Critical');
  expect(riskTier(9)).toBe('Standard');
  expect(riskTier(8)).toBe('Low');
});

test('matchers AND their fields; an empty matcher matches nothing', () => {
  expect(matches(t({}), { file: 'e2e/transfer', title: 'MOVES' })).toBe(true);
  expect(matches(t({}), { file: 'e2e/transfer', title: 'other' })).toBe(false);
  expect(matches(t({ tags: ['sca'] }), { tag: 'sca' })).toBe(true);
  expect(matches(t({}), {})).toBe(false);
});

test('same spec in several projects merges, worst outcome wins', () => {
  const merged = mergeOutcomes([t({ outcome: 'expected' }), t({ outcome: 'unexpected' })]);
  expect(merged).toHaveLength(1);
  expect(merged[0]?.outcome).toBe('unexpected');
});

test('result states: no coverage, not run, verified, defect open, failing', () => {
  const req = { id: 'R', title: 'x', area: 'a', impact: 5, likelihood: 5, matchers: [{ file: 'e2e/transfer' }] };
  expect(buildMatrix([req], [], true).rows[0]?.result).toBe('NO COVERAGE');
  expect(buildMatrix([req], [t({})], false).rows[0]?.result).toBe('NOT RUN');
  expect(buildMatrix([req], [t({ outcome: 'expected' })], true).rows[0]?.result).toBe('VERIFIED');
  expect(buildMatrix([req], [t({ outcome: 'expected', trackedFailure: true, defects: ['BUG-1'] })], true).rows[0]?.result).toBe('DEFECT OPEN');
  expect(buildMatrix([req], [t({ outcome: 'unexpected' })], true).rows[0]?.result).toBe('FAILING');
  expect(buildMatrix([req], [t({})], true).rows[0]?.result).toBe('NOT RUN');
  expect(buildMatrix([req], [t({ outcome: 'expected' }), t({ title: 'other' })], true).rows[0]?.result).toBe('PARTIAL RUN');
});

test('parses the Playwright JSON structure', () => {
  const report = {
    suites: [{ suites: [{ specs: [{ title: 'a', file: 'x\\y.spec.ts', tags: ['@smoke'], tests: [{ status: 'expected', expectedStatus: 'failed', annotations: [{ type: 'bug', description: 'BUG-2 (confirmed)' }], results: [{}] }] }] }] }],
  };
  const [o] = outcomesFromJson(report);
  expect(o).toMatchObject({ file: 'x/y.spec.ts', tags: ['smoke'], outcome: 'expected', trackedFailure: true, defects: ['BUG-2'] });
});

test('requirement ids are unique and ratings are 1 to 5', () => {
  expect(new Set(REQUIREMENTS.map((r) => r.id)).size).toBe(REQUIREMENTS.length);
  for (const r of REQUIREMENTS) {
    expect(r.impact).toBeGreaterThanOrEqual(1);
    expect(r.impact).toBeLessThanOrEqual(5);
    expect(r.likelihood).toBeGreaterThanOrEqual(1);
    expect(r.likelihood).toBeLessThanOrEqual(5);
  }
});

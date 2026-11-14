import { mkdirSync, writeFileSync } from 'node:fs';
import type { FullConfig, FullResult, Reporter, Suite, TestCase } from '@playwright/test/reporter';
import { REQUIREMENTS } from '../data/requirements';
import { buildMatrix, mergeOutcomes, renderMatrix, type TestOutcome } from '../utils/traceability';

/**
 * Custom reporter: at the end of every run, writes test-results/traceability.md, a requirement-by-requirement
 * result table (verified / defect open / failing), so a reviewer sees risk coverage, not just a list of tests.
 * Registered in playwright.ci.config.ts.
 */
export default class RequirementsReporter implements Reporter {
  private suite?: Suite;

  onBegin(_config: FullConfig, suite: Suite): void {
    this.suite = suite;
  }

  onEnd(_result: FullResult): void {
    if (!this.suite) {
      return;
    }
    const outcomes = mergeOutcomes(this.suite.allTests().map(toOutcome));
    const { rows, unmapped } = buildMatrix(REQUIREMENTS, outcomes, true);
    mkdirSync('test-results', { recursive: true });
    writeFileSync(
      'test-results/traceability.md',
      `# Requirement results for this run\n\n${renderMatrix(rows, unmapped, { mode: 'this run', generated: new Date().toISOString() })}\n`,
    );
  }

  printsToStdio(): boolean {
    return false;
  }
}

function toOutcome(test: TestCase): TestOutcome {
  return {
    // Spec path relative to tests/, with forward slashes (the same shape as the JSON report).
    file: test.location.file.replace(/\\/g, '/').replace(/^.*\/tests\//, ''),
    title: test.title,
    tags: test.tags.map((tag) => tag.replace(/^@/, '')),
    outcome: test.outcome(),
    trackedFailure: test.expectedStatus === 'failed',
    defects: test.annotations
      .filter((a) => a.type === 'bug' && a.description)
      .map((a) => (a.description ?? '').split(' ')[0] ?? ''),
  };
}

import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { KNOWN_DEFECTS } from '../../data/known-defects';

// Quality gate: a defect may only be tracked if it is written up. If one of these goes red,
// add a "## BUG-0xx" section to docs/BUG-REPORTS.md (use docs/bug-report-template.md).

const report = readFileSync('docs/BUG-REPORTS.md', 'utf8');
const ids = [...new Set(Object.values(KNOWN_DEFECTS).map((defect) => defect.id))];

for (const id of ids) {
  test(`${id} has a written report`, () => {
    expect(report, `docs/BUG-REPORTS.md needs a "## ${id}" section`).toMatch(new RegExp(`^## ${id}\\b`, 'm'));
  });
}

test('every defect has a non-empty summary', () => {
  for (const [title, defect] of Object.entries(KNOWN_DEFECTS)) {
    expect(defect.summary.trim(), `summary of "${title}"`).not.toBe('');
  }
});

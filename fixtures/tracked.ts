import { KNOWN_DEFECTS } from '../data/known-defects';
import { test as base, expect } from './index';

/**
 * Same as the normal `test`, plus an automatic fixture that marks tests listed in KNOWN_DEFECTS
 * as "expected to fail". Import `test` from here in specs that hit known defects.
 */
export const test = base.extend<{ knownDefect: void }>({
  knownDefect: [
    async ({}, use, testInfo) => {
      const defect = KNOWN_DEFECTS[testInfo.title];
      if (defect) {
        testInfo.fail(true, `${defect.id}: ${defect.summary}`);
        testInfo.annotations.push({ type: 'bug', description: `${defect.id} (${defect.status})` });
      }
      await use();
    },
    { auto: true },
  ],
});

export { expect };

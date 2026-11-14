import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

// Safety net: known defects only show as "expected failures" when a spec imports a fixture that applies
// data/known-defects.ts. A spec that quietly imports the plain fixtures would report every open bug as a failure.
// If one of these goes red, change that file's `test` import to '../../fixtures/tracked' (or '../../fixtures/api').

for (const dir of ['negative', 'api', 'hybrid', 'resilience', 'security', 'a11y', 'visual', 'compliance']) {
  for (const file of readdirSync(join('tests', dir)).filter((name) => name.endsWith('.spec.ts'))) {
    test(`${dir}/${file} imports a fixture that tracks known defects`, () => {
      const source = readFileSync(join('tests', dir, file), 'utf8');
      expect(source).toMatch(/from '\.\.\/\.\.\/fixtures\/(tracked|api)'/);
    });
  }
}

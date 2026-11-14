import { readFileSync } from 'node:fs';

// One short line per failed test from the last run: npx tsx scripts/failures.ts   (reads test-results/results.json)
interface Spec { title: string; file: string; tests?: { status?: string; results?: { status?: string; duration?: number; error?: { message?: string } }[] }[] }
interface Suite { specs?: Spec[]; suites?: Suite[] }

const report = JSON.parse(readFileSync('test-results/results.json', 'utf8')) as Suite;
const strip = (text: string): string => text.replace(/\u001b\[[0-9;]*m/g, '');
let count = 0;
const walk = (suite: Suite): void => {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      if (test.status !== 'unexpected' && test.status !== 'flaky') continue;
      const last = test.results?.at(-1);
      const message = strip(last?.error?.message ?? 'no error message').split('\n').filter((l) => l.trim()).slice(0, 3).join(' | ');
      count += 1;
      console.log(`[${test.status}] ${spec.file} > ${spec.title}\n    ${Math.round((last?.duration ?? 0) / 1000)}s  ${message.slice(0, 300)}`);
    }
  }
  (suite.suites ?? []).forEach(walk);
};
walk(report);
console.log(`${count} failed or flaky`);

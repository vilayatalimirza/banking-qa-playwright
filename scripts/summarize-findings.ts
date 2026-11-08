import { existsSync, readFileSync } from 'node:fs';

// Prints the observations from the last test run as markdown tables you can paste into a chat or a bug report.
// Usage: npx tsx scripts/summarize-findings.ts

const FILE = 'findings/observations.jsonl';

if (!existsSync(FILE)) {
  console.log('No findings yet. Run the negative tests first: npx playwright test --grep @negative');
  process.exit(0);
}

type Row = Record<string, unknown>;

const rows = readFileSync(FILE, 'utf8')
  .split('\n')
  .filter((line) => line.trim() !== '')
  .map((line) => JSON.parse(line) as Row);

const bySuite = new Map<string, Row[]>();
for (const row of rows) {
  const suite = String(row.suite ?? 'unknown');
  bySuite.set(suite, [...(bySuite.get(suite) ?? []), row]);
}

for (const [suite, items] of bySuite) {
  const columns = [...new Set(items.flatMap((item) => Object.keys(item)))].filter((c) => c !== 'suite');
  console.log(`\n### ${suite}\n`);
  console.log(`| ${columns.join(' | ')} |`);
  console.log(`|${columns.map(() => '---').join('|')}|`);
  for (const item of items) {
    const cells = columns.map((c) => String(item[c] ?? '').replace(/\|/g, '/').slice(0, 170));
    console.log(`| ${cells.join(' | ')} |`);
  }
}

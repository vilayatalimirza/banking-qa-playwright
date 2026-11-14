import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { REQUIREMENTS } from '../data/requirements';
import { buildMatrix, outcomesFromJson, renderMatrix } from '../utils/traceability';

// Builds the requirements traceability matrix.
//   npx tsx scripts/traceability.ts                                  static: which tests cover which requirement (nothing is run)
//   npx tsx scripts/traceability.ts --results test-results/results.json   with the results of a real run (JSON reporter)
//   --out <file>   default docs/TRACEABILITY.md          --check   exit 1 if a requirement has no test

const args = process.argv.slice(2);
const flag = (name: string): boolean => args.includes(name);
const option = (name: string): string | undefined => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

function readJsonFromOutput(text: string): unknown {
  // Tolerate stray lines before or after the JSON (npm notices, warnings).
  return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
}

function listAllTests(): unknown {
  const cli = require.resolve('@playwright/test/cli');
  const output = execFileSync(process.execPath, [cli, 'test', '-c', 'playwright.ci.config.ts', '--list', '--reporter=json'], {
    encoding: 'utf8',
    maxBuffer: 200 * 1024 * 1024,
  });
  return readJsonFromOutput(output);
}

const resultsFile = option('--results');
// Always start from the full listing, so a partial run (e.g. only unit tests) shows the rest as NOT RUN instead of "no coverage".
const listed = outcomesFromJson(listAllTests());
const ran = resultsFile ? outcomesFromJson(readJsonFromOutput(readFileSync(resultsFile, 'utf8'))) : [];
const ranByKey = new Map(ran.map((t) => [`${t.file}::${t.title}`, t]));
const outcomes = listed.map((t) => ranByKey.get(`${t.file}::${t.title}`) ?? t);
const { rows, unmapped } = buildMatrix(REQUIREMENTS, outcomes, Boolean(resultsFile));

const out = option('--out') ?? 'docs/TRACEABILITY.md';
const mode = resultsFile ? `results of ${resultsFile}` : 'static listing, nothing was run';
writeFileSync(
  out,
  `# Requirements traceability matrix\n\nRequirements live in \`data/requirements.ts\`. Regenerate with \`npx tsx scripts/traceability.ts\`.\n\n${renderMatrix(rows, unmapped, { mode, generated: new Date().toISOString().slice(0, 10) })}\n`,
);

const uncovered = rows.filter((row) => row.result === 'NO COVERAGE');
console.log(`${outcomes.length} tests, ${REQUIREMENTS.length} requirements, ${unmapped.length} unmapped tests, ${uncovered.length} requirements without a test -> ${out}`);
for (const row of uncovered) {
  console.log(`NO COVERAGE: ${row.requirement.id} ${row.requirement.title}`);
}
if (flag('--check') && uncovered.length > 0) {
  process.exit(1);
}

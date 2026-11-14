import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { KNOWN_DEFECTS } from '../data/known-defects';
import { REQUIREMENTS } from '../data/requirements';
import { buildMatrix, outcomesFromJson, renderMatrix } from '../utils/traceability';

// Builds an audit-evidence bundle for ONE pipeline run: everything an auditor needs to see what was tested,
// against which commit, with what result, plus a manifest of SHA-256 hashes proving the files were not altered afterwards.
//   npx tsx scripts/evidence-bundle.ts [--no-attachments]
// Output: evidence/<run id>/   (run id = CI run number, or a timestamp locally)

const withAttachments = !process.argv.includes('--no-attachments');
const runId = process.env.GITHUB_RUN_ID ?? process.env.CI_PIPELINE_ID ?? new Date().toISOString().replace(/[:.]/g, '-');
const root = join('evidence', runId);
mkdirSync(root, { recursive: true });

const sha256 = (file: string): string => createHash('sha256').update(readFileSync(file)).digest('hex');

function copyIfExists(from: string, to: string): boolean {
  if (!existsSync(from)) {
    return false;
  }
  mkdirSync(dirname(join(root, to)), { recursive: true });
  copyFileSync(from, join(root, to));
  return true;
}

function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

// 1. Raw results from the run.
copyIfExists('test-results/results.json', 'results/results.json');
copyIfExists('test-results/junit.xml', 'results/junit.xml');
copyIfExists('findings/observations.jsonl', 'results/observations.jsonl');

// 2. Requirement-by-requirement outcome, computed from the results (not from memory).
if (existsSync('test-results/results.json')) {
  const report: unknown = JSON.parse(readFileSync('test-results/results.json', 'utf8'));
  const { rows, unmapped } = buildMatrix(REQUIREMENTS, outcomesFromJson(report), true);
  writeFileSync(
    join(root, 'traceability.md'),
    `# Requirement results (run ${runId})\n\n${renderMatrix(rows, unmapped, { mode: `run ${runId}`, generated: new Date().toISOString() })}\n`,
  );
}

// 3. The open defects at the time of the run.
const defectLines = Object.entries(KNOWN_DEFECTS).map(([title, d]) => `| ${d.id} | ${d.status} | ${title} | ${d.summary} |`);
writeFileSync(
  join(root, 'open-defects.md'),
  `# Open defects tracked at run time\n\n| ID | Status | Test | Summary |\n|---|---|---|---|\n${defectLines.join('\n')}\n`,
);

// 4. Run metadata: what exactly was tested.
writeFileSync(
  join(root, 'run-metadata.json'),
  JSON.stringify(
    {
      runId,
      generatedAt: new Date().toISOString(),
      commit: process.env.GITHUB_SHA ?? process.env.CI_COMMIT_SHA ?? 'local run (no commit recorded)',
      branch: process.env.GITHUB_REF_NAME ?? process.env.CI_COMMIT_REF_NAME ?? 'unknown',
      runUrl: process.env.GITHUB_SERVER_URL
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : (process.env.CI_PIPELINE_URL ?? 'local run'),
      baseUrl: process.env.BASE_URL ?? 'https://parabank.parasoft.com/parabank/',
      node: process.version,
      playwright: (JSON.parse(readFileSync(join('node_modules', '@playwright', 'test', 'package.json'), 'utf8')) as { version: string }).version,
      os: process.platform,
    },
    null,
    2,
  ),
);

// 5. Traces, videos and screenshots of failed or retried tests, named after the test that produced them.
if (withAttachments) {
  for (const file of filesUnder('test-results')) {
    if (/(trace\.zip|\.webm|\.png)$/.test(file)) {
      copyIfExists(file, join('attachments', relative('test-results', file)));
    }
  }
}

// 6. Integrity manifest: every file with its size and SHA-256, then a hash of the manifest itself.
const manifest = filesUnder(root).map((file) => ({
  path: relative(root, file).replace(/\\/g, '/'),
  bytes: statSync(file).size,
  sha256: sha256(file),
}));
const manifestPath = join(root, 'manifest.json');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
writeFileSync(join(root, 'manifest.sha256'), `${sha256(manifestPath)}  manifest.json\n`);
writeFileSync(
  join(root, 'README.txt'),
  [
    `Audit evidence bundle for run ${runId}.`,
    'results/            raw test results (JSON, JUnit) and what the application actually did (observations.jsonl)',
    'traceability.md     requirement-by-requirement outcome of this run',
    'open-defects.md     defects that were open and tracked when the run happened',
    'run-metadata.json   commit, branch, run URL, base URL, tool versions',
    'attachments/        traces, videos and screenshots (if captured)',
    'manifest.json      size and SHA-256 of every file above; manifest.sha256 is the hash of manifest.json',
    'Verify integrity later: recompute the hashes and compare; any change to a file changes its hash.',
  ].join('\n'),
);

console.log(`Evidence bundle written to ${root} (${manifest.length} files, attachments ${withAttachments ? 'included' : 'skipped'})`);

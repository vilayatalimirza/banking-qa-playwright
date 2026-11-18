import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { collectTestRecords, formatRunMetrics, summarizeRun } from '../utils/run-metrics';

const input = process.argv[2] ?? 'test-results/results.json';
if (!existsSync(input)) throw new Error(`Playwright JSON results not found: ${input}. Run the full Chromium suite first.`);
const report: unknown = JSON.parse(readFileSync(input, 'utf8'));
const records = collectTestRecords(report);
if (records.length === 0) throw new Error(`No test records found in ${input}; refusing to publish an empty pass-rate report.`);
const markdown = formatRunMetrics(summarizeRun(records));
mkdirSync('test-results', { recursive: true });
writeFileSync('test-results/run-metrics.md', markdown);
process.stdout.write(markdown);

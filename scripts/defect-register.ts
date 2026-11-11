import { KNOWN_DEFECTS } from '../data/known-defects';

// Prints the open-defect register as a markdown table (used in the CI job summary and in chat).
// Usage: npx tsx scripts/defect-register.ts

interface Row {
  status: string;
  summary: string;
  tests: string[];
}

const byId = new Map<string, Row>();
for (const [title, defect] of Object.entries(KNOWN_DEFECTS)) {
  const row = byId.get(defect.id) ?? { status: defect.status, summary: defect.summary, tests: [] };
  row.tests.push(title);
  byId.set(defect.id, row);
}

console.log('### Open defect register\n');
console.log('| ID | Status | Tests tracking it | Summary |');
console.log('|---|---|---|---|');
for (const [id, row] of [...byId].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))) {
  console.log(`| ${id} | ${row.status} | ${row.tests.length} | ${row.summary} |`);
}
console.log(`\n${byId.size} open defects, ${Object.keys(KNOWN_DEFECTS).length} tracked tests.`);

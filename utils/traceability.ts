// Traceability: which requirement is covered by which tests, and what the latest run says about each requirement.
// Pure functions only (no file or process access), so they are unit-tested and shared by the CLI, the reporter
// and the evidence bundle.

export interface Matcher {
  /** Substring of the spec path relative to tests/, e.g. 'negative/transfer-amounts'. */
  file?: string;
  /** Case-insensitive substring of the test title. */
  title?: string;
  /** Tag without the leading @, e.g. 'idempotency'. */
  tag?: string;
}

export interface Requirement {
  id: string;
  title: string;
  area: string;
  /** 1 (cosmetic) to 5 (money lost, regulatory breach). */
  impact: number;
  /** 1 (rare) to 5 (very likely to break or already shaky). */
  likelihood: number;
  /** A test covers the requirement when ANY matcher matches (fields inside one matcher are ANDed). */
  matchers: Matcher[];
}

export type Outcome = 'expected' | 'unexpected' | 'flaky' | 'skipped';

export interface TestOutcome {
  file: string;
  title: string;
  tags: string[];
  /** Undefined in a static listing (nothing was run). */
  outcome?: Outcome;
  /** True when the test is marked "expected to fail" (an open, tracked defect). */
  trackedFailure?: boolean;
  defects?: string[];
}

export type RequirementResult =
  | 'NO COVERAGE'
  | 'NOT RUN'
  | 'PARTIAL RUN'
  | 'FAILING'
  | 'DEFECT OPEN'
  | 'FLAKY'
  | 'SKIPPED'
  | 'VERIFIED';

export interface MatrixRow {
  requirement: Requirement;
  tests: number;
  passed: number;
  trackedFailures: number;
  failing: number;
  flaky: number;
  skipped: number;
  defects: string[];
  result: RequirementResult;
}

export const riskScore = (r: Pick<Requirement, 'impact' | 'likelihood'>): number => r.impact * r.likelihood;

/** The regression-pack tier a requirement earns from its risk score. */
export const riskTier = (score: number): 'Critical' | 'Standard' | 'Low' =>
  score >= 15 ? 'Critical' : score >= 9 ? 'Standard' : 'Low';

export function matches(test: TestOutcome, matcher: Matcher): boolean {
  if (matcher.file === undefined && matcher.title === undefined && matcher.tag === undefined) {
    return false; // an empty matcher must never match everything by accident
  }
  if (matcher.file !== undefined && !test.file.includes(matcher.file)) {
    return false;
  }
  if (matcher.title !== undefined && !test.title.toLowerCase().includes(matcher.title.toLowerCase())) {
    return false;
  }
  if (matcher.tag !== undefined && !test.tags.includes(matcher.tag)) {
    return false;
  }
  return true;
}

/** One entry per spec: the same test run in several projects (e.g. smoke in 3 browsers) counts once, worst result wins. */
export function mergeOutcomes(tests: TestOutcome[]): TestOutcome[] {
  const byKey = new Map<string, TestOutcome>();
  for (const t of tests) {
    const key = `${t.file}::${t.title}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...t, tags: [...t.tags], defects: [...(t.defects ?? [])] });
      continue;
    }
    existing.tags = [...new Set([...existing.tags, ...t.tags])];
    existing.defects = [...new Set([...(existing.defects ?? []), ...(t.defects ?? [])])];
    existing.trackedFailure = Boolean(existing.trackedFailure || t.trackedFailure);
    const order: Outcome[] = ['unexpected', 'flaky', 'expected', 'skipped'];
    const worst = [existing.outcome, t.outcome]
      .filter((o): o is Outcome => o !== undefined)
      .sort((a, b) => order.indexOf(a) - order.indexOf(b))[0];
    existing.outcome = worst;
  }
  return [...byKey.values()];
}

interface JsonTest {
  status?: string;
  expectedStatus?: string;
  annotations?: { type?: string; description?: string }[];
  results?: unknown[];
}
interface JsonSpec {
  title: string;
  file: string;
  tags?: string[];
  tests?: JsonTest[];
}
interface JsonSuite {
  specs?: JsonSpec[];
  suites?: JsonSuite[];
}

/** Reads Playwright's JSON reporter output (a --list or a real run) into test outcomes, merged per spec. */
export function outcomesFromJson(report: unknown): TestOutcome[] {
  const found: TestOutcome[] = [];
  const walk = (suite: JsonSuite): void => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const ran = (test.results?.length ?? 0) > 0;
        const status = test.status;
        const outcome: Outcome | undefined = !ran
          ? undefined
          : status === 'expected' || status === 'unexpected' || status === 'flaky' || status === 'skipped'
            ? status
            : undefined;
        const defects = (test.annotations ?? [])
          .filter((a) => a.type === 'bug' && a.description)
          .map((a) => (a.description ?? '').split(' ')[0] ?? '');
        found.push({
          file: spec.file.replace(/\\/g, '/'),
          title: spec.title,
          tags: (spec.tags ?? []).map((tag) => tag.replace(/^@/, '')),
          outcome,
          trackedFailure: test.expectedStatus === 'failed',
          defects,
        });
      }
    }
    for (const child of suite.suites ?? []) {
      walk(child);
    }
  };
  walk(report as JsonSuite);
  return mergeOutcomes(found);
}

export function buildMatrix(
  requirements: Requirement[],
  tests: TestOutcome[],
  hasResults: boolean,
): { rows: MatrixRow[]; unmapped: TestOutcome[] } {
  const mapped = new Set<TestOutcome>();
  const rows = requirements.map((requirement): MatrixRow => {
    const covering = tests.filter((t) => requirement.matchers.some((m) => matches(t, m)));
    covering.forEach((t) => mapped.add(t));
    const count = (pick: (t: TestOutcome) => boolean): number => covering.filter(pick).length;
    const trackedFailures = count((t) => t.outcome === 'expected' && Boolean(t.trackedFailure));
    const passed = count((t) => t.outcome === 'expected' && !t.trackedFailure);
    const failing = count((t) => t.outcome === 'unexpected');
    const flaky = count((t) => t.outcome === 'flaky');
    const skipped = count((t) => t.outcome === 'skipped');
    const defects = [...new Set(covering.filter((t) => t.trackedFailure).flatMap((t) => t.defects ?? []))].sort();

    let result: RequirementResult;
    if (covering.length === 0) result = 'NO COVERAGE';
    else if (!hasResults) result = 'NOT RUN';
    else if (failing > 0) result = 'FAILING';
    else if (trackedFailures > 0) result = 'DEFECT OPEN';
    else if (flaky > 0) result = 'FLAKY';
    else if (covering.every((t) => t.outcome === undefined)) result = 'NOT RUN';
    else if (skipped === covering.length) result = 'SKIPPED';
    else if (covering.some((t) => t.outcome === undefined)) result = 'PARTIAL RUN';
    else result = 'VERIFIED';

    return { requirement, tests: covering.length, passed, trackedFailures, failing, flaky, skipped, defects, result };
  });
  rows.sort((a, b) => riskScore(b.requirement) - riskScore(a.requirement) || a.requirement.id.localeCompare(b.requirement.id));
  return { rows, unmapped: tests.filter((t) => !mapped.has(t)) };
}

export function renderMatrix(
  rows: MatrixRow[],
  unmapped: TestOutcome[],
  meta: { mode: string; generated: string },
): string {
  const lines: string[] = [];
  lines.push(`Generated ${meta.generated} (${meta.mode}). Sorted by risk score = impact x likelihood.`);
  lines.push('');
  lines.push('| Req | Requirement | Area | Risk (I x L) | Tier | Tests | Passed | Open defects | Result |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (const row of rows) {
    const r = row.requirement;
    const score = riskScore(r);
    lines.push(
      `| ${r.id} | ${r.title} | ${r.area} | ${r.impact} x ${r.likelihood} = ${score} | ${riskTier(score)} | ${row.tests} | ${row.passed} | ${row.defects.join(', ') || '-'} | ${row.result} |`,
    );
  }
  const tiers = new Map<string, number>();
  for (const row of rows) {
    const tier = riskTier(riskScore(row.requirement));
    tiers.set(tier, (tiers.get(tier) ?? 0) + row.tests);
  }
  lines.push('');
  lines.push(
    `Tests by tier (a test covering several requirements is counted once per requirement): ${['Critical', 'Standard', 'Low'].map((t) => `${t} ${tiers.get(t) ?? 0}`).join(', ')}.`,
  );
  lines.push('');
  lines.push(`Tests not mapped to any requirement: ${unmapped.length}`);
  for (const t of unmapped.slice(0, 20)) {
    lines.push(`- ${t.file}: ${t.title}`);
  }
  if (unmapped.length > 20) {
    lines.push(`- ...and ${unmapped.length - 20} more`);
  }
  return lines.join('\n');
}

import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'https://parabank.parasoft.com/parabank/';

/** One quick look at the home page: reachable, and it is really ParaBank (has the Register link). */
async function demoIsUp(): Promise<{ up: boolean; detail: string }> {
  try {
    const response = await fetch(new URL('index.htm', BASE), { signal: AbortSignal.timeout(20_000) });
    const body = await response.text();
    return body.includes('Register')
      ? { up: true, detail: `HTTP ${response.status}` }
      : { up: false, detail: `HTTP ${response.status} but no Register link (error or challenge page?)` };
  } catch (error) {
    return { up: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Runs once before all tests: starts every run with an empty findings file, and checks the demo is reachable so an
 * outage stops the run in seconds instead of timing out test by test (one such run took 1.7 hours).
 * Skipped for offline unit runs, or with SKIP_PREFLIGHT=1.
 */
export default async function globalSetup(): Promise<void> {
  mkdirSync('findings', { recursive: true });
  writeFileSync('findings/observations.jsonl', '');

  const unitOnly = process.argv.some((arg) => arg.replace(/\\/g, '/').endsWith('tests/unit'));
  if (unitOnly || process.env.SKIP_PREFLIGHT) {
    return;
  }
  let status = await demoIsUp();
  if (!status.up) {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    status = await demoIsUp();
  }
  if (!status.up) {
    throw new Error(
      `Pre-flight: ${BASE} is not usable (${status.detail}). Open it in a browser; when it loads, run again. ` +
        'This is an environment problem, not a test failure. Set SKIP_PREFLIGHT=1 to run anyway.',
    );
  }
}

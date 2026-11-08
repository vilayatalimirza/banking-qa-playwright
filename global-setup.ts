import { mkdirSync, writeFileSync } from 'node:fs';

/** Runs once before all tests: starts every run with an empty findings file. */
export default async function globalSetup(): Promise<void> {
  mkdirSync('findings', { recursive: true });
  writeFileSync('findings/observations.jsonl', '');
}

import { appendFileSync, mkdirSync } from 'node:fs';
import { test, type Page } from '@playwright/test';

const FILE = 'findings/observations.jsonl';

export type ObservationData = Record<string, string | number | boolean | null>;

/**
 * Records what the application actually did, to findings/observations.jsonl
 * and to the HTML report as an annotation.
 *
 * Summarise with: npx tsx scripts/summarize-findings.ts
 */
export function observe(suite: string, data: ObservationData): void {
  mkdirSync('findings', { recursive: true });

  appendFileSync(
    FILE,
    `${JSON.stringify({ suite, ...data })}\n`,
  );

  test.info().annotations.push({
    type: 'observation',
    description: JSON.stringify(data),
  });
}

/**
 * Records an operation failure as a separate observation.
 * The original error is still rethrown by the caller.
 */
export function observeFailure(
  suite: string,
  phase: string,
  data: ObservationData,
  error: unknown,
): void {
  observe(suite, {
    ...data,
    phase,
    failure: error instanceof Error ? error.message : String(error),
  });
}

/** The visible text of ParaBank's main content panel, shortened for the findings table. */
export async function pageMessage(page: Page): Promise<string> {
  const text = await page
    .locator('#rightPanel')
    .innerText({ timeout: 1000 })
    .catch(() => 'n/a');

  return text.replace(/\s+/g, ' ').trim().slice(0, 140);
}
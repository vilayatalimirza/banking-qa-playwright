import { appendFileSync, mkdirSync } from 'node:fs';
import { test, type Page } from '@playwright/test';

const FILE = 'findings/observations.jsonl';

export type ObservationData = Record<string, string | number | boolean | null>;

/**
 * Records what the application actually did, to findings/observations.jsonl (one JSON object per
 * line, safe to append from parallel workers) and to the HTML report as an annotation.
 * Summarise with: npx tsx scripts/summarize-findings.ts
 */
export function observe(suite: string, data: ObservationData): void {
  mkdirSync('findings', { recursive: true });
  appendFileSync(FILE, `${JSON.stringify({ suite, ...data })}\n`);
  test.info().annotations.push({ type: 'observation', description: JSON.stringify(data) });
}

/** The visible text of ParaBank's main content panel, shortened for the findings table. */
export async function pageMessage(page: Page): Promise<string> {
  const text = await page
    .locator('#rightPanel')
    .innerText({ timeout: 1000 })
    .catch(() => 'n/a');
  return text.replace(/\s+/g, ' ').trim().slice(0, 140);
}

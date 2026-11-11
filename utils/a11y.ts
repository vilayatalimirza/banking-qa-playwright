import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from '@playwright/test';

// WCAG 2.0/2.1 level A and AA: the standard bar for a banking site.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

export interface A11yResult {
  /** All violations found. */
  total: number;
  /** Violations rated serious or critical: the ones that block real users. */
  serious: number;
  /** "rule-id(impact,elements)" for the serious ones, or '' when none. */
  seriousSummary: string;
  /** Same format, for every violation. */
  summary: string;
}

/** Runs an axe-core accessibility scan on the page as it is right now. */
export async function axeScan(page: Page): Promise<A11yResult> {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const describe = (list: typeof results.violations): string =>
    list.map((v) => `${v.id}(${v.impact ?? 'n/a'},${v.nodes.length})`).join(' ');
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  return {
    total: results.violations.length,
    serious: serious.length,
    seriousSummary: describe(serious),
    summary: describe(results.violations),
  };
}

import { expect } from '@playwright/test';

/**
 * Collects rule checks for one test.
 *  - INVARIANT: must hold whatever the business rules are (money is never created or destroyed).
 *  - REQUIREMENT: what a bank is expected to do (reject a negative amount, never overdraw).
 * Every check is a SOFT assertion, so one run reports every violated rule instead of stopping
 * at the first. Violations are also remembered so they can go into the findings table.
 */
export class Checks {
  private readonly violations: string[] = [];

  check(kind: 'INVARIANT' | 'REQUIREMENT', rule: string, holds: boolean, detail: string): void {
    const label = `${kind}: ${rule} (${detail})`;
    if (!holds) {
      this.violations.push(label);
    }
    expect.soft(holds, label).toBe(true);
  }

  get verdict(): string {
    return this.violations.length === 0 ? 'OK' : this.violations.join(' | ');
  }
}

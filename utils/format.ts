import { assertCents } from './money';

/**
 * Converts integer cents into the plain decimal text a form field expects.
 * 1234 -> "12.34", 100000 -> "1000.00" (no currency symbol, no thousands separator).
 */
export function toDecimalInput(cents: number): string {
  assertCents(cents);
  if (cents < 0) {
    throw new RangeError(`Form amounts must not be negative: ${cents}`);
  }
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

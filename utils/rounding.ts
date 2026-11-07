import { assertCents } from './money';

export type RoundingMode = 'HALF_UP' | 'HALF_EVEN';

const BASIS_POINTS_PER_UNIT = 10_000; // 1 basis point = 0.01%

/**
 * Applies a rate given in basis points to an amount in cents and returns whole cents.
 * Integer math only. HALF_UP rounds ties away from zero; HALF_EVEN ("banker's rounding")
 * rounds ties to the nearest even cent.
 */
export function applyRate(cents: number, basisPoints: number, mode: RoundingMode): number {
  assertCents(cents);
  assertCents(basisPoints);

  const sign = cents < 0 ? -1 : 1;
  const product = Math.abs(cents) * basisPoints;
  if (!Number.isSafeInteger(product)) {
    throw new RangeError(`Amount too large to apply rate safely: ${cents} x ${basisPoints}`);
  }

  const quotient = Math.floor(product / BASIS_POINTS_PER_UNIT);
  const remainder = product % BASIS_POINTS_PER_UNIT;

  let rounded: number;
  if (remainder * 2 > BASIS_POINTS_PER_UNIT) {
    rounded = quotient + 1; // more than half: round up
  } else if (remainder * 2 < BASIS_POINTS_PER_UNIT) {
    rounded = quotient; // less than half: round down
  } else {
    // exactly half: the rounding mode decides
    rounded = mode === 'HALF_UP' || quotient % 2 === 1 ? quotient + 1 : quotient;
  }

  return rounded === 0 ? 0 : sign * rounded; // avoid -0
}

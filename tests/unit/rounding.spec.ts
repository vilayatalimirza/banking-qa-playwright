import { expect, test } from '@playwright/test';
import { applyRate, type RoundingMode } from '../../utils/rounding';

// [cents, basisPoints, mode, expectedCents, note]
const cases: Array<[number, number, RoundingMode, number, string]> = [
  [500, 50, 'HALF_UP', 3, '2.5 cents ties away from zero'],
  [500, 50, 'HALF_EVEN', 2, '2.5 cents ties to even'],
  [1500, 50, 'HALF_UP', 8, '7.5 cents'],
  [1500, 50, 'HALF_EVEN', 8, '7.5 cents: 7 is odd so goes up to 8'],
  [1000, 50, 'HALF_UP', 5, 'exact, no rounding'],
  [1000, 50, 'HALF_EVEN', 5, 'exact, no rounding'],
  [12345, 50, 'HALF_UP', 62, '61.725 rounds up (not a tie)'],
  [12345, 50, 'HALF_EVEN', 62, '61.725 rounds up (not a tie)'],
  [100, 1, 'HALF_UP', 0, '0.01 cents rounds down to 0'],
  [0, 50, 'HALF_EVEN', 0, 'zero stays zero'],
  [-500, 50, 'HALF_UP', -3, 'negative tie, away from zero'],
  [-500, 50, 'HALF_EVEN', -2, 'negative tie, to even'],
];

for (const [cents, bp, mode, expected, note] of cases) {
  test(`applyRate(${cents}, ${bp}bp, ${mode}) = ${expected} (${note})`, () => {
    expect(applyRate(cents, bp, mode)).toBe(expected);
  });
}

test('applyRate rejects non-integer cents', () => {
  expect(() => applyRate(10.5, 50, 'HALF_UP')).toThrow(/Invalid cents value/);
});

test('applyRate rejects amounts that would overflow safe integers', () => {
  expect(() => applyRate(Number.MAX_SAFE_INTEGER, 10_000, 'HALF_UP')).toThrow(/too large/);
});

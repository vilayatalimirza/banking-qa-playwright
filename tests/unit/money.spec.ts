
import { expect, test } from '@playwright/test';
import {
  assertCents,
  formatMoney,
  parseMoney,
} from '../../utils/money';

// [input, expected cents]
const validCases: Array<[string, number]> = [
  ['$1,234.50', 123450],
  ['-$20.05', -2005],
  ['(20.05)', -2005],
  ['$-5', -500],
  ['19.99', 1999],
  ['0.1', 10],
  ['0', 0],
  ['$0.00', 0],
  ['-$0.00', 0],
  ['1,000,000.01', 100000001],
];

for (const [input, expectedCents] of validCases) {
  test(`parseMoney("${input}") returns ${expectedCents}`, () => {
    expect(parseMoney(input)).toBe(expectedCents);
  });
}

const invalidCases = [
  '',
  'abc',
  '10.999',
  '1,23',
  '--5',
  '(-5)',
  '1e3',
  '$',
];

for (const input of invalidCases) {
  test(`parseMoney("${input}") throws`, () => {
    expect(() => parseMoney(input)).toThrow(/Invalid money string/);
  });
}

// Values used to verify that formatting and parsing preserve cents.
const roundTripCases = [
  0,
  1,
  10,
  105,
  1999,
  123450,
  -1,
  -10,
  -2005,
  -123450,
];

for (const cents of roundTripCases) {
  test(`formatMoney and parseMoney preserve ${cents} cents`, () => {
    const formatted = formatMoney(cents);

    expect(parseMoney(formatted)).toBe(cents);
  });
}

// Valid integer cents should be accepted.
const validCents = [0, 1, -1, 100, -2005];

for (const cents of validCents) {
  test(`assertCents accepts ${cents}`, () => {
    expect(() => assertCents(cents)).not.toThrow();
  });
}

// Non-integers and unsafe numbers must be rejected.
const invalidCents = [
  1.5,
  -2.75,
  NaN,
  Infinity,
  -Infinity,
  Number.MAX_SAFE_INTEGER + 1,
];

for (const cents of invalidCents) {
  test(`assertCents rejects ${cents}`, () => {
    expect(() => assertCents(cents)).toThrow(/Invalid cents value/);
  });
}

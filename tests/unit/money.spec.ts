
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
  ['90071992547409.91', Number.MAX_SAFE_INTEGER],
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
  '$-$5',
  '(5',
  '5)',
  '()',
];

for (const input of invalidCases) {
  test(`parseMoney("${input}") throws`, () => {
    expect(() => parseMoney(input)).toThrow(/Invalid money string/);
  });
}

test('parseMoney rejects cents beyond the safe integer boundary', () => {
  expect(() => parseMoney('90071992547409.92')).toThrow(
    /Invalid cents value/,
  );
});

// Exact formatter output tests
const formattingCases: Array<[number, string]> = [
  [123450, '$1,234.50'],
  [-2005, '-$20.05'],
  [0, '$0.00'],
  [5, '$0.05'],
  [-5, '-$0.05'],
  [100000001, '$1,000,000.01'],
];

for (const [cents, expected] of formattingCases) {
  test(`formatMoney(${cents}) returns "${expected}"`, () => {
    expect(formatMoney(cents)).toBe(expected);
  });
}

// Round-trip tests
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

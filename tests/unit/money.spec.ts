import { expect, test } from '@playwright/test';
import { parseMoney } from '../../utils/money';

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

const invalidCases = ['', 'abc', '10.999', '1,23', '--5', '(-5)', '1e3', '$'];

for (const input of invalidCases) {
  test(`parseMoney("${input}") throws`, () => {
    expect(() => parseMoney(input)).toThrow(/Invalid money string/);
  });
}

import { expect, test } from '@playwright/test';
import { toDecimalInput } from '../../utils/format';

const cases: Array<[number, string]> = [
  [0, '0.00'],
  [5, '0.05'],
  [1234, '12.34'],
  [100000, '1000.00'], // no thousands separator: form fields reject commas
  [100000001, '1000000.01'],
];

for (const [cents, expected] of cases) {
  test(`toDecimalInput(${cents}) returns "${expected}"`, () => {
    expect(toDecimalInput(cents)).toBe(expected);
  });
}

test('toDecimalInput rejects negative cents', () => {
  expect(() => toDecimalInput(-1)).toThrow(/must not be negative/);
});

test('toDecimalInput rejects non-integer cents', () => {
  expect(() => toDecimalInput(1.5)).toThrow(/Invalid cents value/);
});

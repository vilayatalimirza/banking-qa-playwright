// Sandbox copy of the learner's money.ts (with the "$-$5" regex fix applied) so the new files can be verified.
export function assertCents(n: number): void {
  if (!Number.isSafeInteger(n)) {
    throw new TypeError(`Invalid cents value: ${n}`);
  }
}

export function parseMoney(input: string): number {
  let s = input.trim();
  const parenthesized = s.startsWith('(') && s.endsWith(')');

  if (s.startsWith('(') !== s.endsWith(')')) {
    throw new TypeError(`Invalid money string: "${input}"`);
  }
  if (parenthesized) {
    s = s.slice(1, -1);
  }

  const m = /^(-\$?|\$-?)?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/.exec(s);
  const hasMinus = m?.[1]?.includes('-') ?? false;

  if (!m || (parenthesized && hasMinus)) {
    throw new TypeError(`Invalid money string: "${input}"`);
  }

  const whole = Number(m[2].replaceAll(',', ''));
  const frac = Number((m[3] ?? '').padEnd(2, '0'));
  const cents = whole * 100 + frac;
  assertCents(cents);

  return (parenthesized || hasMinus) && cents !== 0 ? -cents : cents;
}

export function formatMoney(cents: number): string {
  assertCents(cents);
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100).toLocaleString('en-US');
  const fraction = String(abs % 100).padStart(2, '0');
  return `${cents < 0 ? '-' : ''}$${whole}.${fraction}`;
}

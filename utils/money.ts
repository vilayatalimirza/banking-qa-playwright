
export function assertCents(n: number): void {
  if (!Number.isSafeInteger(n)) {
    throw new TypeError(`Invalid cents value: ${n}`);
  }
}

export function parseMoney(input: string): number {
  let s = input.trim();
  const parenthesized = s.startsWith("(") && s.endsWith(")");

  if (s.startsWith("(") !== s.endsWith(")")) {
    throw new TypeError(`Invalid money string: "${input}"`);
  }

  if (parenthesized) {
    s = s.slice(1, -1);
  }

  const hasMinus = s.startsWith("-") || s.startsWith("$-");
  if (s.startsWith("-$") || s.startsWith("$-")) {
    s = s.slice(2);
  } else if (s.startsWith("-") || s.startsWith("$")) {
    s = s.slice(1);
  }

  const m = /^(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/.exec(s);
  if (!m || (parenthesized && hasMinus)) {
    throw new TypeError(`Invalid money string: "${input}"`);
  }

  const whole = Number(m[1].replaceAll(",", ""));
  const frac = Number((m[2] ?? "").padEnd(2, "0"));
  const cents = whole * 100 + frac;

  assertCents(cents);

  return (parenthesized || hasMinus) && cents !== 0 ? -cents : cents;
}

export function formatMoney(cents: number): string {
  assertCents(cents);

  const negative = cents < 0;
  const absoluteCents = Math.abs(cents);

  const whole = Math.floor(absoluteCents / 100);
  const fraction = absoluteCents % 100;

  const formattedWhole = whole.toLocaleString("en-US");
  const formattedFraction = String(fraction).padStart(2, "0");

  const sign = negative ? "-" : "";

  return `${sign}$${formattedWhole}.${formattedFraction}`;
}

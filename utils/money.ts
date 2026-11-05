export function parseMoney(input: string): number {
  let s = input.trim();
  let negative = false;

  if (s.startsWith("(") || s.endsWith(")")) {
    if (!s.startsWith("(") || !s.endsWith(")")) throw new Error(`Invalid money string: "${input}"`);
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith("-")) {
    if (negative) throw new Error(`Invalid money string: "${input}"`);
    negative = true;
    s = s.slice(1);
  }
  if (s.startsWith("$")) s = s.slice(1);
  if (s.startsWith("-")) {
    if (negative) throw new Error(`Invalid money string: "${input}"`);
    negative = true;
    s = s.slice(1);
  }

  const m = /^(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) throw new Error(`Invalid money string: "${input}"`);

  const whole = Number(m[1].replaceAll(",", ""));
  const frac = Number((m[2] ?? "").padEnd(2, "0"));
  const cents = whole * 100 + frac;
  return negative && cents !== 0 ? -cents : cents;
}

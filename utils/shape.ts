export type FieldType = 'string' | 'number' | 'boolean';

/**
 * Minimal response-schema check (no extra dependency).
 * Returns a list of problems; an empty list means the payload has every expected field with the right type.
 * Use: expect(shapeProblems(json, { id: 'number', type: 'string' })).toEqual([]);
 */
export function shapeProblems(value: unknown, shape: Record<string, FieldType>): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [`expected an object but got ${Array.isArray(value) ? 'an array' : String(value)}`];
  }
  const record = value as Record<string, unknown>;
  const problems: string[] = [];
  for (const [field, type] of Object.entries(shape)) {
    if (!(field in record)) {
      problems.push(`missing field "${field}"`);
    } else if (typeof record[field] !== type) {
      problems.push(`field "${field}" should be ${type} but is ${typeof record[field]}`);
    }
  }
  return problems;
}

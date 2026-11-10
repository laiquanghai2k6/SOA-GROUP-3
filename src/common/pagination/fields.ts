import { ProblemException } from '../errors/problem.exception';

/** fields=id,name,price_vnd (SRS 3.6). Field không tồn tại -> 422. */
export function parseFields<F extends string>(
  raw: string | undefined,
  allowed: readonly F[],
): F[] | undefined {
  if (!raw) return undefined;

  const requested = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const unknown = requested.filter((name) => !(allowed as readonly string[]).includes(name));
  if (unknown.length > 0) {
    throw ProblemException.validation([
      {
        field: 'fields',
        message: `Field không tồn tại: ${unknown.join(', ')}. Hỗ trợ: ${allowed.join(', ')}.`,
      },
    ]);
  }
  return requested as F[];
}

export function pickFields<T extends object>(item: T, fields?: readonly string[]): Partial<T> {
  if (!fields) return item;
  return Object.fromEntries(
    Object.entries(item).filter(([key]) => fields.includes(key)),
  ) as Partial<T>;
}

import { ProblemException } from '../errors/problem.exception';

export interface SortSpec<F extends string> {
  field: F;
  direction: 'asc' | 'desc';
}

/**
 * sort=price_vnd,-created_at (SRS 3.6). Trường không hỗ trợ -> 422.
 * Repository nhớ thêm id làm khoá phụ để thứ tự ổn định.
 */
export function parseSort<F extends string>(
  raw: string | undefined,
  allowed: readonly F[],
  fallback: readonly SortSpec<F>[],
): SortSpec<F>[] {
  if (!raw) return [...fallback];

  const specs: SortSpec<F>[] = [];
  const unsupported: string[] = [];
  for (const token of raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)) {
    const descending = token.startsWith('-');
    const name = descending ? token.slice(1) : token;
    if (!(allowed as readonly string[]).includes(name)) {
      unsupported.push(name);
      continue;
    }
    specs.push({ field: name as F, direction: descending ? 'desc' : 'asc' });
  }

  if (unsupported.length > 0) {
    throw ProblemException.validation([
      {
        field: 'sort',
        message: `Không hỗ trợ sắp xếp theo: ${unsupported.join(', ')}. Hỗ trợ: ${allowed.join(', ')}.`,
      },
    ]);
  }
  return specs.length > 0 ? specs : [...fallback];
}

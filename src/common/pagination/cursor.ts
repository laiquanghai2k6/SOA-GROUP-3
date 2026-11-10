import type { z } from 'zod';
import { ProblemException } from '../errors/problem.exception';

export type CursorPayload = Record<string, string | number | null>;

/** Cursor opaque, base64url (SRS 3.6). Luôn kèm id làm khoá phụ trong payload. */
export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function tryDecode(token: string): unknown {
  try {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
  } catch {
    return undefined;
  }
}

/** Cursor sai hoặc hết hạn -> 422 validation-error. */
export function decodeCursor<T extends z.ZodType>(token: string, schema: T): z.infer<T> {
  const parsed = schema.safeParse(tryDecode(token));
  if (parsed.success) return parsed.data;
  throw ProblemException.validation(
    [{ field: 'cursor', message: 'Cursor không hợp lệ hoặc đã hết hạn.' }],
    'Cursor không hợp lệ.',
  );
}

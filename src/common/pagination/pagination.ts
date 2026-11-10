import { z } from 'zod';
import { type CursorPayload, encodeCursor } from './cursor';

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).max(512).optional(),
});

/** Mở rộng cho từng collection: paginationQuerySchema.extend({ price_min: ..., sort: ... }) */
export class PaginationQueryDto {
  static readonly schema = paginationQuerySchema;
}

export interface Page<T> {
  data: T[];
  pagination: { limit: number; has_more: boolean; next_cursor: string | null };
}

/**
 * Repository truy vấn `limit + 1` dòng; hàm này cắt dòng thừa và tính next_cursor từ dòng cuối trang.
 * cursorOf phải trả về giá trị của các cột sort và id (khoá phụ).
 */
export function toPage<T>(
  rows: readonly T[],
  limit: number,
  cursorOf: (last: T) => CursorPayload,
): Page<T> {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : [...rows];
  const last = data.at(-1);
  return {
    data,
    pagination: {
      limit,
      has_more: hasMore,
      next_cursor: hasMore && last ? encodeCursor(cursorOf(last)) : null,
    },
  };
}

/** Schema zod của response phân trang, dùng trực tiếp với Standard Schema của NestJS 12. */
export function pageSchema<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    pagination: z.object({
      limit: z.number().int(),
      has_more: z.boolean(),
      next_cursor: z.string().nullable(),
    }),
  });
}

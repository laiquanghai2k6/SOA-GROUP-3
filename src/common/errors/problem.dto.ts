import { z } from 'zod';

export const problemDetailsSchema = z.object({
  type: z
    .string()
    .describe('URI định danh loại lỗi, ví dụ https://api.shop.example/problems/out-of-stock'),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().describe('Đường dẫn request gây lỗi'),
  trace_id: z.string().describe('Trùng request_id trong log'),
  errors: z
    .array(z.object({ field: z.string(), message: z.string() }))
    .optional()
    .describe('Chỉ có với lỗi validation (422)'),
});

/** Marker class giữ API export cũ; Swagger dùng `standardSchema` trực tiếp. */
export class ProblemDetailsDto {
  static readonly schema = problemDetailsSchema;
}

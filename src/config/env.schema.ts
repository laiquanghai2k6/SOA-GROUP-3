import { existsSync } from 'node:fs';
import { z } from 'zod';

const parseCsv = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    /** Số proxy tin cậy phía trước API (để req.ip và rate limit đúng). */
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    PROBLEM_BASE_URL: z
      .url()
      .default('https://api.shop.example/problems')
      .transform((value) => value.replace(/\/+$/, '')),

    DATABASE_URL: z
      .string({ error: 'Bắt buộc' })
      .refine((value) => /^postgres(ql)?:\/\//.test(value), {
        message: 'Phải bắt đầu bằng postgres:// hoặc postgresql://',
      }),
    DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    DB_LOG_QUERIES: z.stringbool().default(false),

    /** Danh sách origin cách nhau bằng dấu phẩy. Dùng cho CORS và kiểm tra Origin (CSRF). */
    CORS_ORIGINS: z
      .string({ error: 'Bắt buộc' })
      .transform(parseCsv)
      .pipe(z.array(z.url()).min(1, 'Cần ít nhất một origin'))
      .transform((urls) => urls.map((url) => new URL(url).origin)),

    JWT_ACCESS_SECRET: z.string({ error: 'Bắt buộc' }).min(32, 'Tối thiểu 32 ký tự'),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(604_800),
    COOKIE_SECURE: z.stringbool().default(true),

    RATE_LIMIT_ENABLED: z.stringbool().default(true),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.COOKIE_SECURE) {
      ctx.addIssue({
        code: 'custom',
        path: ['COOKIE_SECURE'],
        message: 'Không được tắt cờ Secure khi NODE_ENV=production',
      });
    }
    if (env.NODE_ENV === 'production' && !env.RATE_LIMIT_ENABLED) {
      ctx.addIssue({
        code: 'custom',
        path: ['RATE_LIMIT_ENABLED'],
        message: 'Không được tắt rate limit khi NODE_ENV=production',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

/** Hàm thuần, dùng cho test. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new EnvValidationError(
      `Cấu hình môi trường không hợp lệ:\n${z.prettifyError(result.error)}\n\n` +
        'Kiểm tra file .env (mẫu: .env.example).',
    );
  }
  return result.data;
}

let cached: Env | undefined;

/** Đọc .env (nếu có, không ghi đè biến đã set), validate một lần, dùng lại cho cả tiến trình. */
export function loadEnv(): Env {
  if (!cached) {
    if (existsSync('.env')) process.loadEnvFile('.env');
    cached = parseEnv(process.env);
  }
  return cached;
}

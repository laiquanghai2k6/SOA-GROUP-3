import type { Env } from './env.schema';

/** Truy cập cấu hình đã validate. Inject AppConfig thay vì đọc process.env. */
export class AppConfig {
  constructor(readonly env: Env) {}

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }
}

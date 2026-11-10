import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { AppLogger } from '../common/logging/app-logger';
import { DRIZZLE } from './database.tokens';
import type { Database } from './database.types';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly logger: AppLogger,
  ) {}

  /** SELECT 1 với timeout, dùng cho GET /ready (PLT-06). */
  async ping(timeoutMs = 2_000): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        this.db.execute(sql`select 1`),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('database ping timeout')), timeoutMs);
        }),
      ]);
      return true;
    } catch (err) {
      this.logger.pino.warn({ err }, 'readiness: database ping failed');
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}

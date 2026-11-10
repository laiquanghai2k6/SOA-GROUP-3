import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { AppLogger } from '../common/logging/app-logger';
import { AppConfig } from '../config/app-config';
import { DatabaseService } from './database.service';
import { DRIZZLE, PG_POOL } from './database.tokens';
import * as schema from './schema';
import { TransactionManager } from './transaction-manager';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [AppConfig, AppLogger],
      useFactory: (config: AppConfig, logger: AppLogger) => {
        const pool = new Pool({
          connectionString: config.env.DATABASE_URL,
          max: config.env.DB_POOL_MAX,
          connectionTimeoutMillis: 5_000,
          idleTimeoutMillis: 30_000,
        });
        pool.on('error', (err) => logger.pino.error({ err }, 'pg pool: lỗi ở client rảnh'));
        return pool;
      },
    },
    {
      provide: DRIZZLE,
      inject: [PG_POOL, AppConfig, AppLogger],
      useFactory: (pool: Pool, config: AppConfig, logger: AppLogger) =>
        drizzle({
          client: pool,
          schema,
          // Chỉ log câu SQL, không log tham số (có thể chứa password_hash, token_hash)
          logger: config.env.DB_LOG_QUERIES
            ? { logQuery: (query: string) => logger.pino.debug({ sql: query }, 'sql') }
            : false,
        }),
    },
    DatabaseService,
    TransactionManager,
  ],
  exports: [DRIZZLE, DatabaseService, TransactionManager],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /** Đóng pool khi nhận SIGTERM (PLT-11). */
  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
